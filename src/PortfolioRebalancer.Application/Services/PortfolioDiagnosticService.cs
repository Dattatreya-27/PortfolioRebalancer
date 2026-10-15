using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Institutional portfolio diagnostic engine modeled on BlackRock Aladdin, Morningstar MPRS,
/// and AMFI multi-factor risk frameworks (HHI concentration, market-cap styles, tail-end clutter, and harvesting).
/// </summary>
public sealed class PortfolioDiagnosticService(
    IPortfolioRepository repository,
    IStockScoringService scoringService,
    ICatalystEventProvider eventProvider)
{
    private const decimal MaxSingleStockWarning = 10.0m;
    private const decimal MaxSingleStockCritical = 15.0m;
    private const decimal MaxSectorWarning = 25.0m;
    private const decimal MaxSectorCritical = 30.0m;
    private const decimal LargeCapThreshold = 200_000_000_000m; // Rs 20,000 Cr AMFI bracket
    private const decimal MidCapThreshold = 50_000_000_000m;    // Rs 5,000 Cr AMFI bracket

    public async Task<PortfolioDiagnosticsDto?> RunDiagnosticsAsync(Guid portfolioId)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var violations = new List<ConstraintViolationDto>();
        var totalMarketValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);
        var totalInvestedCost = portfolio.Holdings.Sum(h => h.InvestedAmount.Amount);

        if (totalMarketValue == 0 || portfolio.Holdings.Count == 0)
        {
            return new PortfolioDiagnosticsDto(
                PortfolioId: portfolio.Id,
                HealthScore: 0,
                HealthGrade: "N/A",
                HealthRating: "Empty Portfolio",
                ExecutiveSummary: "Portfolio contains no active equity positions. Add stock holdings to generate institutional diagnostics.",
                Concentration: new HhiConcentrationDto(0, 0, "No Positions", "N/A", "N/A", 0, "N/A", 0, 0),
                MarketCapSplit: new MarketCapDistributionDto(0, 0, 0, 0, 0, 0, "N/A"),
                TailEndAnalysis: new TailEndDilutionDto(0, 0, 0, [], "No holdings available."),
                Harvesting: new PnlHarvestingSummaryDto(0, 0, 0, 0, [], []),
                Violations: [],
                AdvisoryPillars: [],
                UpcomingEvents: [],
                CrashDefense: new CrashDefenseDto(50, "N/A", 0, 0, 0, 0, 0, "N/A", "Add holdings to assess crash defense.")
            );
        }

        // 1. Calculate Individual Weights, HHI, and Granularity
        decimal hhiSum = 0;
        decimal largeCapVal = 0;
        decimal midCapVal = 0;
        decimal smallCapVal = 0;
        decimal zeroDebtVal = 0;
        decimal highRoceVal = 0;
        int profitCount = 0;
        int lossCount = 0;

        var microTickers = new List<string>();
        decimal microTotalValue = 0;

        var profitCandidates = new List<HarvestingCandidateDto>();
        var lossCandidates = new List<HarvestingCandidateDto>();

        var holdingWeights = new List<(Holding Holding, decimal Weight, decimal MarketVal, decimal PnlPct)>();
        decimal totalScoreContribution = 0;

        foreach (var holding in portfolio.Holdings)
        {
            var ticker = holding.Stock.Ticker.Value;
            var mv = holding.MarketValue.Amount;
            var cost = holding.InvestedAmount.Amount;
            var buyPrice = holding.AverageBuyPrice?.Amount ?? holding.Stock.CurrentPrice.Amount;
            var weight = Math.Round((mv / totalMarketValue) * 100m, 2);
            var pnlPct = holding.UnrealizedPnLPercent;

            holdingWeights.Add((holding, weight, mv, pnlPct));

            // HHI calculation
            hhiSum += (weight * weight);

            // Factor score contribution & Crash Defense resilience trackers
            var score = scoringService.CalculateScore(holding.Stock);
            totalScoreContribution += (score.OverallScore * (weight / 100m));

            if (score.GovernanceAudit.DebtToEquity <= 0.4m) zeroDebtVal += mv;
            if (score.GovernanceAudit.RocePercent >= 15.0m) highRoceVal += mv;

            // Market Cap distribution
            var mc = holding.Stock.MarketCap ?? 0m;
            if (mc >= LargeCapThreshold)
                largeCapVal += mv;
            else if (mc >= MidCapThreshold)
                midCapVal += mv;
            else
                smallCapVal += mv;

            // Tail-End Clutter (< 0.5% weight)
            if (weight < 0.5m)
            {
                microTickers.Add(ticker);
                microTotalValue += mv;
            }

            // P&L counters
            if (pnlPct >= 0) profitCount++;
            else lossCount++;

            // Profit Booking Candidates (> 50% gain)
            if (pnlPct >= 50m)
            {
                profitCandidates.Add(new HarvestingCandidateDto(
                    Ticker: ticker,
                    Name: holding.Stock.Name,
                    BuyPrice: buyPrice,
                    CurrentPrice: holding.Stock.CurrentPrice.Amount,
                    PnlPercent: pnlPct,
                    MarketValue: Math.Round(mv, 2),
                    ActionReason: $"+{pnlPct:F1}% multi-bagger run. Near resistance.",
                    SuggestedAction: "Lock in 30â€“50% profits or trail tight stop"
                ));
            }

            // Deep Drawdown Candidates (< -25% loss)
            if (pnlPct <= -25m)
            {
                lossCandidates.Add(new HarvestingCandidateDto(
                    Ticker: ticker,
                    Name: holding.Stock.Name,
                    BuyPrice: buyPrice,
                    CurrentPrice: holding.Stock.CurrentPrice.Amount,
                    PnlPercent: pnlPct,
                    MarketValue: Math.Round(mv, 2),
                    ActionReason: $"{pnlPct:F1}% drawdown from buy price.",
                    SuggestedAction: "Audit thesis or harvest tax losses against FY gains"
                ));
            }

            // Constraint Check: Single Stock Cap
            if (weight > MaxSingleStockWarning)
            {
                violations.Add(new ConstraintViolationDto(
                    RuleName: "Single-Stock Concentration Cap",
                    Target: ticker,
                    CurrentValue: weight,
                    AllowedLimit: MaxSingleStockWarning,
                    Severity: weight > MaxSingleStockCritical ? "Critical" : "Warning"
                ));
            }
        }

        // Sort holdings by weight descending
        holdingWeights.Sort((a, b) => b.Weight.CompareTo(a.Weight));

        var maxStock = holdingWeights[0];
        var top5Weight = holdingWeights.Take(5).Sum(h => h.Weight);
        var effectiveHoldings = hhiSum > 0 ? Math.Round(10000m / hhiSum, 1) : 0m;

        // 2. Sector Exposure & Concentration Checks
        var sectorWeights = portfolio.GetCurrentSectorWeights();
        var maxSector = sectorWeights.OrderByDescending(s => s.Value.Value).FirstOrDefault();

        foreach (var (sector, weight) in sectorWeights)
        {
            if (weight.Value > MaxSectorWarning)
            {
                violations.Add(new ConstraintViolationDto(
                    RuleName: "Sector Exposure Cap",
                    Target: sector.ToString(),
                    CurrentValue: weight.Value,
                    AllowedLimit: MaxSectorWarning,
                    Severity: weight.Value > MaxSectorCritical ? "Critical" : "Warning"
                ));
            }
        }

        // 3. Diversification Status & HHI Verdict
        string divStatus = hhiSum switch
        {
            < 300 => "Hyper-Diversified (Tail Clutter Drag)",
            < 1000 => "Optimal Institutional Balance",
            < 1800 => "Moderately Concentrated",
            _ => "Highly Concentrated (Key-Person / Idiosyncratic Risk)"
        };

        string hhiVerdict = $"HHI score of {hhiSum:F1} across {portfolio.Holdings.Count} holdings yields {effectiveHoldings} effective bets. Largest position is {maxStock.Holding.Stock.Ticker.Value} ({maxStock.Weight}%).";

        // 4. Market Cap Split
        var largePct = Math.Round((largeCapVal / totalMarketValue) * 100m, 1);
        var midPct = Math.Round((midCapVal / totalMarketValue) * 100m, 1);
        var smallPct = Math.Round((smallCapVal / totalMarketValue) * 100m, 1);

        var mcapComparison = "Institutional style alignment: " +
            (largePct >= 60 ? "Strong large-cap stability core (~65% benchmark)" : "Growth-tilted with mid/small cap bias");

        // 5. Tail-End Dilution
        var microPct = Math.Round((microTotalValue / totalMarketValue) * 100m, 1);
        var microRationale = $"{microTickers.Count} micro-positions (<0.5% weight) lock {microTotalValue:N0} INR ({microPct}% of AUM), generating tracking overhead without moving overall portfolio returns.";

        // 6. Overall Health Score & Grade
        decimal healthScore = totalScoreContribution;
        if (violations.Count > 0)
            healthScore -= (violations.Count * 7.5m);

        if (microTickers.Count > 10)
            healthScore -= 4.0m; // Penalty for diworsification clutter

        healthScore = Math.Clamp(Math.Round(healthScore, 1), 0m, 100m);

        string healthGrade = healthScore switch
        {
            >= 90 => "A+",
            >= 82 => "A",
            >= 75 => "A-",
            >= 68 => "B+",
            >= 60 => "B",
            >= 50 => "C",
            _ => "D"
        };

        string healthRating = healthScore switch
        {
            >= 80 => "Institutional Grade (Resilient Core, Controlled Risk)",
            >= 70 => "Strong Quality (Solid Core, Minor Clutter Cleanup Needed)",
            >= 55 => "Moderate Balance (Elevated Dispersion, Review Laggards)",
            _ => "High Risk (Constraint Breaches or Structural Drag Present)"
        };

        string executiveSummary = $"Portfolio holds {portfolio.Holdings.Count} positions with an effective bet size of {effectiveHoldings} stocks. " +
            $"Core is anchored by Large Caps ({largePct}%) and Mid Caps ({midPct}%). " +
            (microTickers.Count > 0 ? $"{microTickers.Count} micro-holdings ({microPct}% weight) are candidates for capital consolidation." : "Portfolio has zero micro-position clutter.");

        // 7. Structured Advisory Pillars
        var advisoryPillars = new List<AdvisoryGuidancePillarDto>();

        // Pillar A: Micro-Tail Consolidation
        if (microTickers.Count > 0)
        {
            advisoryPillars.Add(new AdvisoryGuidancePillarDto(
                Category: "Clutter Pruning",
                Title: "Consolidate Tail-End Micro-Positions",
                Description: $"Prune or scale up {microTickers.Count} micro-holdings (<0.5% weight each, total {microTotalValue:N0} INR). Reallocate this capital into your highest-conviction core compounders to eliminate tracking drag.",
                ImpactLevel: "High Impact",
                ActionBadge: $"Review {microTickers.Count} Micro-Positions",
                TargetTickers: microTickers
            ));
        }

        // Pillar B: Multi-Bagger Profit Booking
        if (profitCandidates.Count > 0)
        {
            var pTickers = profitCandidates.Select(p => p.Ticker).ToList();
            advisoryPillars.Add(new AdvisoryGuidancePillarDto(
                Category: "Profit Harvesting",
                Title: "Lock In Multi-Bagger Gains & Trail Stops",
                Description: $"{profitCandidates.Count} stock(s) ({string.Join(", ", pTickers)}) have gained >50% from cost. Take 30â€“50% profits off the table or apply a dynamic trailing stop-loss to secure accumulated wealth.",
                ImpactLevel: "High Impact",
                ActionBadge: $"Harvest {profitCandidates.Count} Gainers",
                TargetTickers: pTickers
            ));
        }

        // Pillar C: Tax-Loss Harvesting & Pruning
        if (lossCandidates.Count > 0)
        {
            var lTickers = lossCandidates.Select(l => l.Ticker).ToList();
            advisoryPillars.Add(new AdvisoryGuidancePillarDto(
                Category: "Tax-Loss Optimization",
                Title: "Tax-Loss Harvesting & Laggard Audit",
                Description: $"{lossCandidates.Count} stock(s) ({string.Join(", ", lTickers)}) are in deep drawdown (>25% loss). Re-examine the underlying investment thesis; if impaired, harvest capital losses to offset FY2026 capital gains taxes.",
                ImpactLevel: "Strategic",
                ActionBadge: $"Audit {lossCandidates.Count} Drawdowns",
                TargetTickers: lTickers
            ));
        }

        // Pillar D: Sector & National Capex Tailwinds
        var topSectors = sectorWeights.OrderByDescending(s => s.Value.Value).Take(2).Select(s => s.Key.ToString()).ToList();
        var policyHoldings = portfolio.Holdings
            .Where(h => h.Stock.Sector is Sector.Utilities or Sector.Industrials or Sector.Energy)
            .OrderByDescending(h => h.MarketValue.Amount)
            .Take(4)
            .Select(h => h.Stock.Ticker.Value)
            .ToList();

        advisoryPillars.Add(new AdvisoryGuidancePillarDto(
            Category: "Policy Alpha",
            Title: "Ride Secular Capex & Energy Transition Tailwinds",
            Description: $"Maintain high conviction in national infrastructure and energy security leaders ({string.Join(", ", policyHoldings)}). Top sectors ({string.Join(" & ", topSectors)}) remain directly aligned with multi-year government capital outlays.",
            ImpactLevel: "Strategic",
            ActionBadge: "Policy Core",
            TargetTickers: policyHoldings
        ));

        // 8. Upcoming Catalysts
        var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value);
        var events = await eventProvider.GetUpcomingEventsAsync(tickers);
        var eventDtos = events.Select(e => new UpcomingEventDto(
            Ticker: e.Ticker?.Value,
            EventTitle: e.EventTitle,
            EventType: e.EventType,
            ScheduledDate: e.ScheduledDate.ToString("dd MMM yyyy"),
            ExpectedImpact: e.ExpectedImpact
        )).ToList();

        // 9. P&L Harvesting Summary
        var totalPnL = totalMarketValue - totalInvestedCost;
        var totalPnLPct = totalInvestedCost > 0 ? Math.Round((totalPnL / totalInvestedCost) * 100m, 2) : 0m;

        // 10. Sleep-Well Crash Defense & 10% Correction Stress Test (Option B)
        var zeroDebtRatio = totalMarketValue > 0 ? Math.Round((zeroDebtVal / totalMarketValue) * 100m, 1) : 0m;
        var highRoceRatio = totalMarketValue > 0 ? Math.Round((highRoceVal / totalMarketValue) * 100m, 1) : 0m;

        int crashScore = (int)Math.Clamp(
            (zeroDebtRatio * 0.40m) + (highRoceRatio * 0.35m) + (largePct * 0.25m),
            30m, 98m
        );

        string crashGrade = crashScore switch
        {
            >= 80 => "Fortress Defense (High Crash Resilience)",
            >= 65 => "Balanced Cushion (Moderate Resilience)",
            >= 50 => "Market Beta (Average Resilience)",
            _ => "High Volatility (Vulnerable to Sharp Drawdowns)"
        };

        decimal portfolioBeta = Math.Round(Math.Clamp(1.20m - ((crashScore / 100m) * 0.50m), 0.65m, 1.25m), 2);
        decimal dipPercent = Math.Round(10.0m * portfolioBeta, 1);
        decimal dipRupees = Math.Round(totalMarketValue * (dipPercent / 100m), 2);

        string recoveryHorizon = crashScore >= 75 ? "2 to 4 Months" : (crashScore >= 60 ? "4 to 7 Months" : "8+ Months");
        string peaceOfMind = $"If NIFTY drops 10%, your estimated paper dip is ₹{dipRupees:N0} ({dipPercent:F1}%). With {zeroDebtRatio:F0}% of capital in debt-free/low-debt companies and {highRoceRatio:F0}% in high-ROCE leaders, your positions face near-zero insolvency risk and historically recover faster than speculative stocks.";

        var crashDefense = new CrashDefenseDto(
            Score: crashScore,
            Grade: crashGrade,
            ZeroDebtRatioPercent: zeroDebtRatio,
            HighRoceRatioPercent: highRoceRatio,
            LargeCapRatioPercent: largePct,
            TenPercentCorrectionDipRupees: dipRupees,
            TenPercentCorrectionDipPercent: dipPercent,
            ExpectedRecoveryHorizon: recoveryHorizon,
            PeaceOfMindSummary: peaceOfMind
        );

        return new PortfolioDiagnosticsDto(
            PortfolioId: portfolio.Id,
            HealthScore: healthScore,
            HealthGrade: healthGrade,
            HealthRating: healthRating,
            ExecutiveSummary: executiveSummary,
            Concentration: new HhiConcentrationDto(
                HhiScore: Math.Round(hhiSum, 1),
                EffectiveHoldings: effectiveHoldings,
                DiversificationStatus: divStatus,
                Verdict: hhiVerdict,
                MaxStockTicker: maxStock.Holding.Stock.Ticker.Value,
                MaxStockWeight: maxStock.Weight,
                MaxSectorName: maxSector.Key.ToString(),
                MaxSectorWeight: maxSector.Value.Value,
                Top5WeightPercent: Math.Round(top5Weight, 2)
            ),
            MarketCapSplit: new MarketCapDistributionDto(
                LargeCapPercent: largePct,
                MidCapPercent: midPct,
                SmallCapPercent: smallPct,
                LargeCapValue: Math.Round(largeCapVal, 2),
                MidCapValue: Math.Round(midCapVal, 2),
                SmallCapValue: Math.Round(smallCapVal, 2),
                BenchmarkComparison: mcapComparison
            ),
            TailEndAnalysis: new TailEndDilutionDto(
                MicroHoldingsCount: microTickers.Count,
                TotalMicroValue: Math.Round(microTotalValue, 2),
                PercentOfPortfolio: microPct,
                MicroTickers: microTickers,
                Rationale: microRationale
            ),
            Harvesting: new PnlHarvestingSummaryDto(
                ProfitPositionsCount: profitCount,
                LossPositionsCount: lossCount,
                TotalUnrealizedPnL: Math.Round(totalPnL, 2),
                TotalUnrealizedPnLPercent: totalPnLPct,
                ProfitBookingCandidates: profitCandidates,
                LossHarvestingCandidates: lossCandidates
            ),
            Violations: violations,
            AdvisoryPillars: advisoryPillars,
            UpcomingEvents: eventDtos,
            CrashDefense: crashDefense
        );
    }
}