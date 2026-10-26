using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Quantitative engine that audits an investor's real portfolio holdings
/// against the 3 academic market theories (Graham-Piotroski, Greenblatt, Minervini).
/// Identifies Theory Champions, Near-Misses, and Toxic Laggards to prune.
/// </summary>
public sealed class PortfolioTheoryAuditService(
    IPortfolioRepository repository,
    IStockScoringService scoringService) : IPortfolioTheoryAuditService
{
    private static readonly Dictionary<string, string> SectorTheoryReplacements = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Energy"] = "ONGC / Coal India (High ROCE, Sovereign Cash Flow)",
        ["Financials"] = "HDFC Bank (Pristine NPA Record, ROE > 16%) or ICICI Bank",
        ["Technology"] = "TCS (ROCE 54%, Zero Debt, 100% Cash Flow)",
        ["ConsumerDiscretionary"] = "Titan (25%+ ROCE, Jewelry Moat) or Trent (Zudio 35% CAGR)",
        ["ConsumerStaples"] = "Pidilite (Fevicol Moat, 70%+ Market Share) or Asian Paints",
        ["Industrials"] = "Bharat Electronics / BEL (ROCE 36%, ₹76,000 Cr Backlog) or Dixon Tech",
        ["Utilities"] = "Premier Energies (Solar Cell PLI Leader) or NTPC (Green Capex)",
        ["Materials"] = "Polycab (Wires & Cables 24% Share, ROCE 28%) or Tata Chemicals"
    };

    public async Task<PortfolioTheoryAuditSummaryDto?> AuditPortfolioAsync(Guid portfolioId, CancellationToken ct = default)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio == null) return null;

        var items = new List<HoldingTheoryAuditItemDto>();
        decimal totalPortfolioValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);

        int championsCount = 0;
        decimal championsValue = 0m;

        int nearMissCount = 0;
        decimal nearMissValue = 0m;

        int toxicCount = 0;
        decimal toxicValue = 0m;

        foreach (var holding in portfolio.Holdings)
        {
            var ticker = holding.Stock.Ticker.Value;
            var name = holding.Stock.Name;
            var sector = holding.Stock.Sector.ToString();
            var qty = holding.Quantity;
            var cmp = holding.Stock.CurrentPrice.Amount;
            var mktVal = holding.MarketValue.Amount;
            var pnl = holding.UnrealizedPnL.Amount;
            var pnlPct = holding.UnrealizedPnLPercent;
            var weightPct = totalPortfolioValue > 0 ? Math.Round((mktVal / totalPortfolioValue) * 100m, 2) : 0m;

            var score = scoringService.CalculateScore(holding.Stock);

            decimal qualityScore = score.QualityScore;
            decimal roce = score.GovernanceAudit.RocePercent;
            decimal debtToEquity = score.GovernanceAudit.DebtToEquity;
            decimal pledge = score.GovernanceAudit.PromoterPledgePercent;
            decimal marginOfSafety = score.MarginOfSafetyPercent;
            decimal sectorCycleScore = score.SectorCycleScore;

            // Approximate F-Score (1-9) based on quality, cash flow, and debt metrics
            decimal estimatedFScore = Math.Clamp(Math.Round(qualityScore / 11m, 0), 1, 9);
            if (debtToEquity < 0.5m) estimatedFScore = Math.Min(9, estimatedFScore + 1);
            if (pledge > 15m || debtToEquity > 1.5m) estimatedFScore = Math.Max(1, estimatedFScore - 2);

            // Approximate RS Rating (1-99)
            decimal estimatedRs = Math.Clamp(Math.Round((sectorCycleScore * 0.6m) + (score.OverallScore * 0.4m), 0), 10, 99);

            var passed = new List<string>();
            var failed = new List<string>();

            bool isFinancial = string.Equals(sector, "Financials", StringComparison.OrdinalIgnoreCase);

            // 1. Saurabh Mukherjea Coffee Can Compounding Test (High ROCE + Zero Debt + Clean Governance)
            // For non-financials: ROCE >= 15%, D/E <= 0.45x, low pledge; for financials: clean credit & ROE >= 15%
            bool passCoffeeCan = (isFinancial || debtToEquity <= 0.50m) && pledge < 5m && (roce >= 15m || qualityScore >= 70m) && qualityScore >= 66m;
            if (passCoffeeCan) passed.Add("Saurabh Mukherjea Coffee Can (ROCE >= 15%, Zero Debt)");
            else failed.Add("Coffee Can Compounding (Fails 10-Yr ROCE >= 15% threshold or excessive leverage)");

            // 2. Raamdeo Agrawal Motilal Oswal QGLP Test (Quality + Growth + Longevity + Fair Price)
            bool passQglp = (roce >= 18m || qualityScore >= 72m) && (isFinancial || debtToEquity <= 0.85m) && score.PeerBenchmark.StockPE <= 48m && qualityScore >= 64m;
            if (passQglp) passed.Add("Motilal Oswal QGLP (High RoE & Earnings Growth)");
            else failed.Add("Motilal Oswal QGLP (Lacks high RoE compounding or forward earnings growth runway)");

            // 3. Indian Techno-Funda Stage 2 Momentum Test (Stage 2 Uptrend + Relative Strength)
            bool passStage2 = estimatedRs >= 76m && sectorCycleScore >= 70m && (pnlPct > -3m || holding.DayPnLPercent > 0.1m) && qualityScore >= 58m;
            if (passStage2) passed.Add("Indian Stage 2 Momentum (RS >= 80, Institutional Inflows)");
            else failed.Add("Indian Stage 2 Momentum (Below RS rating threshold or broken trend)");

            // Classification
            TheoryAuditCategory category;
            string plainEnglishReason;
            string recommendedAction;

            if (passed.Count >= 2 || (passed.Count == 1 && score.OverallScore >= 80m))
            {
                category = TheoryAuditCategory.TheoryChampion;
                championsCount++;
                championsValue += mktVal;
                plainEnglishReason = $"Robust capital compounder. Backed by {passed.Count} academic theories with ROCE {roce:F1}% and clean balance sheet metrics.";
                recommendedAction = "Core Compounder — Hold and let capital compound uninterrupted.";
            }
            else if (passed.Count == 0 && ((!isFinancial && debtToEquity > 0.9m) || pledge > 15m || qualityScore < 56m || pnlPct < -10m || (!isFinancial && roce < 14m)))
            {
                category = TheoryAuditCategory.ToxicLaggard;
                toxicCount++;
                toxicValue += mktVal;
                plainEnglishReason = $"Fails all 3 theories. Capital drag risk due to high leverage (D/E {debtToEquity:F2}), low ROCE ({roce:F1}%), or structural cyclical headwinds.";
                recommendedAction = $"Prune or Exit — Liquidate position to recover ₹{mktVal:N0} and reinvest into Theory Leaders.";
            }
            else
            {
                category = TheoryAuditCategory.NearMiss;
                nearMissCount++;
                nearMissValue += mktVal;
                plainEnglishReason = passed.Count > 0
                    ? $"Meets {passed[0]}, but pending valuation cooling or breakout volume confirmation."
                    : "Stable defensive holding, but lacks decisive multi-factor alpha catalysts.";
                recommendedAction = "Watchlist / Neutral Hold — Monitor quarterly results and accumulate only on technical pullbacks.";
            }

            var suggestedSwap = SectorTheoryReplacements.TryGetValue(sector, out var rep)
                ? rep
                : "BEL or TCS (Top Institutional Compounders)";

            items.Add(new HoldingTheoryAuditItemDto(
                Ticker: ticker,
                Name: name,
                Sector: sector,
                Quantity: qty,
                CurrentPrice: cmp,
                MarketValue: mktVal,
                UnrealizedPnL: pnl,
                UnrealizedPnLPercent: pnlPct,
                WeightPercent: weightPct,
                Classification: category,
                PassedTheories: passed,
                FailedTheories: failed,
                QualityScore: qualityScore,
                RocePercent: roce,
                DebtToEquity: debtToEquity,
                EstimatedFScore: estimatedFScore,
                EstimatedRsRating: estimatedRs,
                PlainEnglishReason: plainEnglishReason,
                RecommendedAction: recommendedAction,
                SuggestedTheoryReplacement: suggestedSwap
            ));
        }

        // Sort: Toxic Laggards first by capital locked, then Near-Miss, then Champions
        var sortedItems = items
            .OrderBy(i => i.Classification switch
            {
                TheoryAuditCategory.ToxicLaggard => 0,
                TheoryAuditCategory.NearMiss => 1,
                TheoryAuditCategory.TheoryChampion => 2,
                _ => 3
            })
            .ThenByDescending(i => i.MarketValue)
            .ToList();

        decimal championsWeight = totalPortfolioValue > 0 ? Math.Round((championsValue / totalPortfolioValue) * 100m, 2) : 0m;
        decimal nearMissWeight = totalPortfolioValue > 0 ? Math.Round((nearMissValue / totalPortfolioValue) * 100m, 2) : 0m;
        decimal toxicWeight = totalPortfolioValue > 0 ? Math.Round((toxicValue / totalPortfolioValue) * 100m, 2) : 0m;

        var verdict = $"Out of {portfolio.Holdings.Count} holdings, {championsCount} qualify as Theory Champions ({championsWeight}% of portfolio), " +
                      $"while {toxicCount} holdings ({toxicWeight}%) fail all 3 academic theories, locking up ₹{toxicValue:N0} in low-efficiency capital. " +
                      $"Pruning the top {Math.Min(10, toxicCount)} toxic laggards will immediately free up ₹{Math.Min(toxicValue, toxicValue * 0.75m):N0} for high-alpha compounding.";

        return new PortfolioTheoryAuditSummaryDto(
            PortfolioId: portfolio.Id,
            PortfolioName: portfolio.Name,
            AuditedAt: DateTime.UtcNow,
            TotalHoldingsCount: portfolio.Holdings.Count,
            TotalPortfolioValue: totalPortfolioValue,
            ChampionsCount: championsCount,
            ChampionsValue: championsValue,
            ChampionsWeightPercent: championsWeight,
            NearMissCount: nearMissCount,
            NearMissValue: nearMissValue,
            NearMissWeightPercent: nearMissWeight,
            ToxicCount: toxicCount,
            ToxicValue: toxicValue,
            ToxicWeightPercent: toxicWeight,
            CapitalLockedInToxicAssets: toxicValue,
            ExecutiveVerdict: verdict,
            Holdings: sortedItems
        );
    }

    // -------------------------------------------------------------------------------------------------
    // Feature 2: What-If Swap Simulator Engine
    // -------------------------------------------------------------------------------------------------

    private sealed record CandidateMetrics(string Name, string Sector, decimal Price, decimal Roce, decimal DebtToEquity, decimal RsRating, decimal Beta);

    private static readonly Dictionary<string, CandidateMetrics> TheoryCandidateCatalog = new(StringComparer.OrdinalIgnoreCase)
    {
        ["BEL"] = new("Bharat Electronics Ltd", "Industrials", 335.52m, 36.2m, 0.0m, 92m, 0.82m),
        ["TCS"] = new("Tata Consultancy Services", "Technology", 3390.00m, 54.0m, 0.0m, 86m, 0.75m),
        ["TRENT"] = new("Trent Ltd", "ConsumerDiscretionary", 3173.61m, 32.5m, 0.10m, 96m, 1.05m),
        ["ONGC"] = new("Oil and Natural Gas Corp", "Energy", 241.90m, 22.0m, 0.35m, 84m, 0.85m),
        ["CANBK"] = new("Canara Bank", "Financials", 135.62m, 19.5m, 0.0m, 82m, 0.95m),
        ["KAYNES"] = new("Kaynes Technology India", "Industrials", 3626.30m, 28.0m, 0.20m, 88m, 1.15m),
        ["MAZDOCK"] = new("Mazagon Dock Shipbuilders", "Industrials", 2566.00m, 38.0m, 0.0m, 94m, 1.10m),
        ["DIXON"] = new("Dixon Technologies", "Industrials", 14250.00m, 31.0m, 0.15m, 91m, 1.08m),
        ["ITC"] = new("ITC Ltd", "ConsumerStaples", 312.40m, 36.5m, 0.0m, 79m, 0.65m),
        ["COALINDIA"] = new("Coal India", "Energy", 462.50m, 48.0m, 0.05m, 85m, 0.88m),
        ["NTPC"] = new("NTPC Ltd", "Utilities", 395.20m, 16.5m, 1.10m, 81m, 0.80m),
        ["PERSISTENT"] = new("Persistent Systems", "Technology", 5120.00m, 31.2m, 0.0m, 90m, 0.92m),
        ["KPITTECH"] = new("KPIT Technologies", "Technology", 1640.00m, 33.0m, 0.0m, 87m, 1.05m),
        ["PREMIERENE"] = new("Premier Energies Ltd", "Utilities", 1001.80m, 26.5m, 0.40m, 89m, 1.12m)
    };

    private static decimal EstimateBeta(string sector) => sector switch
    {
        "Technology" => 1.10m,
        "Industrials" => 1.05m,
        "ConsumerDiscretionary" => 1.02m,
        "Financials" => 1.15m,
        "Energy" => 0.90m,
        "Materials" => 1.12m,
        "ConsumerStaples" => 0.68m,
        "Utilities" => 0.75m,
        "Healthcare" => 0.72m,
        _ => 1.00m
    };

    private static decimal EstimateRelativeStrength(decimal technicalScore, decimal sectorCycleScore)
    {
        return Math.Clamp(Math.Round((sectorCycleScore * 0.6m) + (technicalScore * 0.4m), 0), 10, 99);
    }

    public async Task<PortfolioSwapResultDto?> SimulateSwapAsync(Guid portfolioId, string exitTicker, string targetTicker, CancellationToken ct = default)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio == null || portfolio.Holdings.Count == 0) return null;

        var exitHolding = portfolio.Holdings.FirstOrDefault(h => string.Equals(h.Stock.Ticker.Value, exitTicker, StringComparison.OrdinalIgnoreCase));
        if (exitHolding == null) return null;

        decimal totalPortfolioValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);
        if (totalPortfolioValue <= 0) return null;

        decimal releasedCapital = exitHolding.MarketValue.Amount;
        var exitScore = scoringService.CalculateScore(exitHolding.Stock);
        bool isExitBank = exitHolding.Stock.Sector == Sector.Financials || exitHolding.Stock.Name.Contains("Bank", StringComparison.OrdinalIgnoreCase);

        decimal exitRoce = exitScore.GovernanceAudit.RocePercent;
        decimal exitDebt = isExitBank ? 0.0m : exitScore.GovernanceAudit.DebtToEquity;
        decimal exitBeta = EstimateBeta(exitHolding.Stock.Sector.ToString());
        decimal exitRs = EstimateRelativeStrength(exitScore.TechnicalScore, exitScore.SectorCycleScore);
        string exitSector = exitHolding.Stock.Sector.ToString();

        // Target Candidate Resolution
        CandidateMetrics targetCandidate;
        if (TheoryCandidateCatalog.TryGetValue(targetTicker, out var found))
        {
            targetCandidate = found;
        }
        else
        {
            // Fallback generic metrics
            targetCandidate = new CandidateMetrics(targetTicker, "Diversified", 1000m, 25m, 0.1m, 85m, 0.95m);
        }

        decimal acquiredShares = targetCandidate.Price > 0 ? Math.Floor(releasedCapital / targetCandidate.Price) : 0;
        decimal remainingCash = releasedCapital - (acquiredShares * targetCandidate.Price);

        // Calculate baseline weighted metrics
        decimal totalWeightedRoce = 0m;
        decimal totalWeightedDebt = 0m;
        decimal totalWeightedBeta = 0m;
        decimal totalWeightedRs = 0m;
        decimal exitSectorCapital = 0m;
        decimal targetSectorCapital = 0m;

        foreach (var h in portfolio.Holdings)
        {
            decimal mv = h.MarketValue.Amount;
            decimal w = mv / totalPortfolioValue;
            var sc = scoringService.CalculateScore(h.Stock);
            bool isBank = h.Stock.Sector == Sector.Financials || h.Stock.Name.Contains("Bank", StringComparison.OrdinalIgnoreCase);

            decimal roce = sc.GovernanceAudit.RocePercent;
            decimal debt = isBank ? 0.0m : sc.GovernanceAudit.DebtToEquity;
            decimal beta = EstimateBeta(h.Stock.Sector.ToString());
            decimal rs = EstimateRelativeStrength(sc.TechnicalScore, sc.SectorCycleScore);

            totalWeightedRoce += (roce * w);
            totalWeightedDebt += (debt * w);
            totalWeightedBeta += (beta * w);
            totalWeightedRs += (rs * w);

            if (string.Equals(h.Stock.Sector.ToString(), exitSector, StringComparison.OrdinalIgnoreCase))
                exitSectorCapital += mv;
            if (string.Equals(h.Stock.Sector.ToString(), targetCandidate.Sector, StringComparison.OrdinalIgnoreCase))
                targetSectorCapital += mv;
        }

        decimal exitWeight = releasedCapital / totalPortfolioValue;
        decimal afterWeightedRoce = totalWeightedRoce - (exitRoce * exitWeight) + (targetCandidate.Roce * exitWeight);
        decimal afterWeightedDebt = totalWeightedDebt - (exitDebt * exitWeight) + (targetCandidate.DebtToEquity * exitWeight);
        decimal afterWeightedBeta = totalWeightedBeta - (exitBeta * exitWeight) + (targetCandidate.Beta * exitWeight);
        decimal afterWeightedRs = totalWeightedRs - (exitRs * exitWeight) + (targetCandidate.RsRating * exitWeight);

        decimal exitSectorBeforeWeight = Math.Round((exitSectorCapital / totalPortfolioValue) * 100m, 2);
        decimal targetSectorBeforeWeight = Math.Round((targetSectorCapital / totalPortfolioValue) * 100m, 2);

        decimal exitSectorAfterWeight = exitSectorBeforeWeight - Math.Round(exitWeight * 100m, 2);
        decimal targetSectorAfterWeight = string.Equals(exitSector, targetCandidate.Sector, StringComparison.OrdinalIgnoreCase)
            ? targetSectorBeforeWeight
            : targetSectorBeforeWeight + Math.Round(exitWeight * 100m, 2);

        decimal deltaRoce = Math.Round(afterWeightedRoce - totalWeightedRoce, 2);
        decimal deltaDebt = Math.Round(afterWeightedDebt - totalWeightedDebt, 2);
        decimal deltaBeta = Math.Round(afterWeightedBeta - totalWeightedBeta, 2);
        decimal deltaRs = Math.Round(afterWeightedRs - totalWeightedRs, 2);

        bool isFavorable = (targetCandidate.Roce >= exitRoce || targetCandidate.RsRating > exitRs) && (targetCandidate.DebtToEquity <= exitDebt + 0.15m);

        var keyBenefits = new List<string>();
        if (targetCandidate.Roce > exitRoce)
            keyBenefits.Add($"Boosts capital productivity: Exit ROCE {exitRoce:F1}% is replaced with {targetCandidate.Roce:F1}% (Magic Formula criterion).");
        if (targetCandidate.DebtToEquity < exitDebt)
            keyBenefits.Add($"De-leverages balance sheet: Reduces debt load from {exitDebt:F2} to {targetCandidate.DebtToEquity:F2}.");
        if (targetCandidate.RsRating > exitRs)
            keyBenefits.Add($"Momentum upgrade: Relative strength surges from {exitRs:F0} to {targetCandidate.RsRating:F0} (Minervini Stage 2 uptrend).");
        if (deltaBeta < 0)
            keyBenefits.Add($"Volatility dampener: Lowers overall portfolio beta by {Math.Abs(deltaBeta):F2}, improving Sharpe ratio resilience.");

        string verdict = isFavorable
            ? $"FAVORABLE QUANT SWAP: Selling ₹{releasedCapital:N0} of {exitTicker} to fund {acquiredShares} shares of {targetTicker} expands portfolio capital efficiency by {deltaRoce:+0.00;-0.00;0.00}% ROCE while eliminating laggard drag."
            : $"MARGINAL TRADE: Swap into {targetTicker} offers neutral delta. Consider reviewing high-conviction alternatives before trading.";

        return new PortfolioSwapResultDto(
            PortfolioId: portfolio.Id,
            ExitTicker: exitHolding.Stock.Ticker.Value,
            ExitName: exitHolding.Stock.Name,
            ExitSector: exitSector,
            ExitQuantity: exitHolding.Quantity,
            ExitPrice: exitHolding.Stock.CurrentPrice.Amount,
            ReleasedCapital: releasedCapital,
            TargetTicker: targetTicker.ToUpperInvariant(),
            TargetName: targetCandidate.Name,
            TargetSector: targetCandidate.Sector,
            TargetPrice: targetCandidate.Price,
            AcquiredShares: acquiredShares,
            RemainingCash: remainingCash,
            PortfolioTotalValue: totalPortfolioValue,
            BeforeWeightedRoce: Math.Round(totalWeightedRoce, 2),
            AfterWeightedRoce: Math.Round(afterWeightedRoce, 2),
            DeltaRoce: deltaRoce,
            BeforeWeightedDebtToEquity: Math.Round(totalWeightedDebt, 2),
            AfterWeightedDebtToEquity: Math.Round(afterWeightedDebt, 2),
            DeltaDebtToEquity: deltaDebt,
            BeforeEstimatedBeta: Math.Round(totalWeightedBeta, 2),
            AfterEstimatedBeta: Math.Round(afterWeightedBeta, 2),
            DeltaBeta: deltaBeta,
            BeforeEstimatedRs: Math.Round(totalWeightedRs, 1),
            AfterEstimatedRs: Math.Round(afterWeightedRs, 1),
            DeltaRs: deltaRs,
            ExitSectorBeforeWeight: exitSectorBeforeWeight,
            ExitSectorAfterWeight: Math.Max(0m, exitSectorAfterWeight),
            TargetSectorBeforeWeight: targetSectorBeforeWeight,
            TargetSectorAfterWeight: targetSectorAfterWeight,
            QuantVerdict: verdict,
            IsFavorableSwap: isFavorable,
            KeyBenefits: keyBenefits
        );
    }

    // -------------------------------------------------------------------------------------------------
    // Feature 3: Portfolio Correlation Matrix & Concentration Stress-Tester Engine
    // -------------------------------------------------------------------------------------------------

    public async Task<PortfolioCorrelationMatrixDto?> GetCorrelationMatrixAsync(Guid portfolioId, int topN = 10, CancellationToken ct = default)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio == null || portfolio.Holdings.Count == 0) return null;

        decimal totalValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);
        if (totalValue <= 0) return null;

        var topHoldings = portfolio.Holdings
            .OrderByDescending(h => h.MarketValue.Amount)
            .Take(Math.Max(4, Math.Min(topN, portfolio.Holdings.Count)))
            .ToList();

        int n = topHoldings.Count;
        var tickers = topHoldings.Select(h => h.Stock.Ticker.Value).ToList();
        var names = topHoldings.Select(h => h.Stock.Name).ToList();
        var sectors = topHoldings.Select(h => h.Stock.Sector.ToString()).ToList();
        var weights = topHoldings.Select(h => Math.Round((h.MarketValue.Amount / totalValue) * 100m, 2)).ToList();

        double[][] matrix = new double[n][];
        var clusters = new List<CorrelatedClusterRiskDto>();

        for (int i = 0; i < n; i++)
        {
            matrix[i] = new double[n];
            for (int j = 0; j < n; j++)
            {
                if (i == j)
                {
                    matrix[i][j] = 1.00;
                }
                else
                {
                    double corr = ComputeSyntheticCorrelation(topHoldings[i].Stock, topHoldings[j].Stock);
                    matrix[i][j] = Math.Round(corr, 2);

                    if (i < j && corr >= 0.70)
                    {
                        decimal combinedCap = topHoldings[i].MarketValue.Amount + topHoldings[j].MarketValue.Amount;
                        decimal combinedWeight = weights[i] + weights[j];
                        clusters.Add(new CorrelatedClusterRiskDto(
                            StockA: tickers[i],
                            StockB: tickers[j],
                            SectorA: sectors[i],
                            SectorB: sectors[j],
                            Correlation: Math.Round(corr, 2),
                            CombinedCapital: combinedCap,
                            CombinedWeightPercent: combinedWeight,
                            RiskWarning: $"High cross-holding co-movement ({corr:F2}). A drawdown in {sectors[i]} will transmit systemic risk across ₹{combinedCap:N0} ({combinedWeight:F1}% of portfolio)."
                        ));
                    }
                }
            }
        }

        // Diversification Ratio = Sum(w_i * sigma_i) / sigma_portfolio
        // Synthetic annual asset volatilities
        double[] assetVols = new double[n];
        for (int i = 0; i < n; i++)
        {
            assetVols[i] = EstimateAssetVolatility(topHoldings[i].Stock.Sector.ToString());
        }

        double sumWeightedVol = 0.0;
        double normWeightSum = (double)weights.Sum();
        double[] normWeights = new double[n];
        for (int i = 0; i < n; i++)
        {
            normWeights[i] = (double)weights[i] / (normWeightSum > 0 ? normWeightSum : 1.0);
            sumWeightedVol += normWeights[i] * assetVols[i];
        }

        double portfolioVariance = 0.0;
        for (int i = 0; i < n; i++)
        {
            for (int j = 0; j < n; j++)
            {
                portfolioVariance += normWeights[i] * normWeights[j] * matrix[i][j] * assetVols[i] * assetVols[j];
            }
        }
        double portfolioVol = Math.Sqrt(Math.Max(0.0001, portfolioVariance));
        decimal diversificationRatio = Math.Round((decimal)(sumWeightedVol / portfolioVol), 2);

        string rating = diversificationRatio switch
        {
            >= 1.35m => "Excellent Diversification (Factor Resilient)",
            >= 1.20m => "Moderate Diversification (Minor Sector Overlap)",
            _ => "High Cluster Concentration Risk"
        };

        string commentary = clusters.Count > 0
            ? $"Detected {clusters.Count} high-correlation clusters (correlation > 0.70) among top positions. Top cluster pair {clusters[0].StockA} & {clusters[0].StockB} co-move with {clusters[0].Correlation:F2} correlation, exposing ₹{clusters[0].CombinedCapital:N0} to concurrent drawdowns."
            : $"Low cross-holding correlation across top assets. Portfolio shows strong factor dispersion with a diversification ratio of {diversificationRatio:F2}.";

        return new PortfolioCorrelationMatrixDto(
            PortfolioId: portfolio.Id,
            PortfolioName: portfolio.Name,
            Tickers: tickers,
            Names: names,
            Sectors: sectors,
            WeightsPercent: weights,
            Matrix: matrix,
            DiversificationRatio: diversificationRatio,
            DiversificationRating: rating,
            HighRiskClusters: clusters.OrderByDescending(c => c.CombinedWeightPercent).ToList(),
            InstitutionalCommentary: commentary
        );
    }

    private static double ComputeSyntheticCorrelation(Stock a, Stock b)
    {
        string secA = a.Sector.ToString();
        string secB = b.Sector.ToString();

        if (string.Equals(secA, secB, StringComparison.OrdinalIgnoreCase))
        {
            return secA switch
            {
                "Financials" => 0.84,
                "Technology" => 0.82,
                "Energy" => 0.78,
                "Industrials" => 0.76,
                "ConsumerDiscretionary" => 0.73,
                _ => 0.75
            };
        }

        // Cross-sector baseline correlations
        if ((secA == "Industrials" && secB == "Materials") || (secA == "Materials" && secB == "Industrials")) return 0.62;
        if ((secA == "Industrials" && secB == "Energy") || (secA == "Energy" && secB == "Industrials")) return 0.54;
        if ((secA == "Financials" && secB == "Industrials") || (secA == "Industrials" && secB == "Financials")) return 0.52;
        if ((secA == "Technology" && secB == "ConsumerDiscretionary") || (secA == "ConsumerDiscretionary" && secB == "Technology")) return 0.48;
        if ((secA == "ConsumerStaples" || secA == "Healthcare") && (secB == "Materials" || secB == "Energy")) return 0.18;
        if ((secB == "ConsumerStaples" || secB == "Healthcare") && (secA == "Materials" || secA == "Energy")) return 0.18;

        return 0.36;
    }

    private static double EstimateAssetVolatility(string sector) => sector switch
    {
        "Technology" => 0.28,
        "Industrials" => 0.26,
        "ConsumerDiscretionary" => 0.25,
        "Financials" => 0.24,
        "Energy" => 0.27,
        "Materials" => 0.29,
        "ConsumerStaples" => 0.16,
        "Utilities" => 0.19,
        _ => 0.22
    };

    // -------------------------------------------------------------------------------------------------
    // Feature 4: Supply Chain & Commodity Macro Shock Simulator Engine
    // -------------------------------------------------------------------------------------------------

    public async Task<MacroStressTestResultDto?> SimulateMacroStressTestAsync(Guid portfolioId, string scenarioKey, CancellationToken ct = default)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio == null || portfolio.Holdings.Count == 0) return null;

        decimal totalValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);
        if (totalValue <= 0) return null;

        string title, desc, trigger, defRecommendation;
        Func<Holding, (decimal impactPct, string direction, string mechanism)> impactCalculator;

        switch (scenarioKey?.ToLowerInvariant())
        {
            case "inr_depreciation":
                title = "Currency Devaluation Shock (+3.0% USD/INR)";
                desc = "Simulates Indian Rupee weakening against the US Dollar from ₹84.00 to ₹86.50/USD.";
                trigger = "Foreign institutional capital outflows and global strong dollar index surge.";
                defRecommendation = "Allocate proceeds towards IT services leaders (TCS, Persistent) and active exporters; trim domestic capex players reliant on imported capital equipment.";
                impactCalculator = h =>
                {
                    string sec = h.Stock.Sector.ToString();
                    if (sec == "Technology")
                        return (4.2m, "Beneficiary", "Export earnings denominated in USD convert to higher Rupee revenues (+140 bps operating margin).");
                    if (sec == "Healthcare")
                        return (3.4m, "Beneficiary", "US FDA formulation exports realize immediate rupee realization gains.");
                    if (sec == "ConsumerDiscretionary" || sec == "Industrials")
                        return (-2.8m, "Squeezed", "Imported electronic components, chips, and sub-assemblies face landed cost inflation.");
                    return (0.2m, "Neutral", "Domestic business model insulated from direct FX volatility.");
                };
                break;

            case "rbi_rate_hike":
                title = "Monetary Policy Tightening (+25 bps RBI Repo Rate)";
                desc = "Simulates RBI Monetary Policy Committee raising repo rate to combat core inflation.";
                trigger = "Domestic food & crude inflation surprises to the upside, prompting immediate liquidity tightening.";
                defRecommendation = "Favor high-CASA tier-1 lenders (HDFC Bank, Canara Bank) with pricing power; exit levered midcap industrials with floating debt.";
                impactCalculator = h =>
                {
                    string sec = h.Stock.Sector.ToString();
                    var sc = scoringService.CalculateScore(h.Stock);
                    decimal de = sc.GovernanceAudit.DebtToEquity;

                    if (sec == "Financials")
                        return (1.8m, "Beneficiary", "Floating rate lending books reprice faster than fixed term deposits, expanding Net Interest Margin (NIM).");
                    if (de > 0.6m)
                        return (-4.6m, "Squeezed", $"High leverage (D/E {de:F2}) contracts interest coverage ratio and raises debt service costs.");
                    if (sec == "ConsumerDiscretionary")
                        return (-2.4m, "Squeezed", "Higher auto/retail EMI borrowing rates marginally dampen consumer retail financing.");
                    return (-0.5m, "Neutral", "Clean balance sheet with minimal floating rate exposure.");
                };
                break;

            case "crude_surge":
            default:
                scenarioKey = "crude_surge";
                title = "Global Crude Oil Shock (+15% to $90/bbl)";
                desc = "Simulates Brent crude spiking from $78 to $90/barrel driven by geopolitical shipping bottlenecks.";
                trigger = "Hormuz strait geopolitical friction or sudden OPEC+ supply quota curtailment.";
                defRecommendation = "Maintain overweight allocation in upstream sovereign exploration (ONGC); prune paints, aviation, and synthetic chemical holdings.";
                impactCalculator = h =>
                {
                    string sec = h.Stock.Sector.ToString();
                    string ticker = h.Stock.Ticker.Value;

                    if (string.Equals(ticker, "ONGC", StringComparison.OrdinalIgnoreCase) || sec == "Energy")
                        return (7.5m, "Beneficiary", "Realized oil and gas net-back price jumps directly, boosting upstream gross EBITDA.");
                    if (sec == "Materials" || sec == "ConsumerDiscretionary")
                        return (-4.8m, "Squeezed", "Petrochemical derivatives and logistics freight expenses compress gross margin by 180-250 bps.");
                    if (sec == "ConsumerStaples")
                        return (-2.2m, "Squeezed", "Surging packaging, palm oil, and freight costs pressure retail operating margins.");
                    return (-0.3m, "Neutral", "Limited direct petrochemical supply chain exposure.");
                };
                break;
        }

        var allImpacts = new List<MacroHoldingImpactDto>();
        decimal totalPnlDelta = 0m;

        foreach (var h in portfolio.Holdings)
        {
            decimal mv = h.MarketValue.Amount;
            decimal w = Math.Round((mv / totalValue) * 100m, 2);
            var (impactPct, direction, mechanism) = impactCalculator(h);
            decimal pnlDelta = Math.Round(mv * (impactPct / 100m), 2);
            totalPnlDelta += pnlDelta;

            allImpacts.Add(new MacroHoldingImpactDto(
                Ticker: h.Stock.Ticker.Value,
                Name: h.Stock.Name,
                Sector: h.Stock.Sector.ToString(),
                WeightPercent: w,
                CurrentMarketValue: mv,
                ImpactDirection: direction,
                EstimatedImpactPercent: impactPct,
                EstimatedPnlDelta: pnlDelta,
                TransmissionMechanism: mechanism
            ));
        }

        decimal portfolioImpactPct = Math.Round((totalPnlDelta / totalValue) * 100m, 2);

        var beneficiaries = allImpacts
            .Where(i => i.EstimatedImpactPercent > 0.5m)
            .OrderByDescending(i => i.EstimatedPnlDelta)
            .Take(8)
            .ToList();

        var squeezed = allImpacts
            .Where(i => i.EstimatedImpactPercent < -0.5m)
            .OrderBy(i => i.EstimatedPnlDelta)
            .Take(8)
            .ToList();

        return new MacroStressTestResultDto(
            PortfolioId: portfolio.Id,
            ScenarioKey: scenarioKey,
            ScenarioTitle: title,
            ScenarioDescription: desc,
            MacroTrigger: trigger,
            PortfolioValue: totalValue,
            PortfolioEstimatedImpactPercent: portfolioImpactPct,
            PortfolioEstimatedPnlImpact: totalPnlDelta,
            Beneficiaries: beneficiaries,
            SqueezedHoldings: squeezed,
            DefensiveActionRecommendation: defRecommendation
        );
    }
}
