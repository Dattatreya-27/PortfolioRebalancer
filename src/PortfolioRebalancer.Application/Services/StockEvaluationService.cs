using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Enhanced stock evaluation service returning multi-factor scores, peer benchmarks,
/// management governance audit, institutional flows, and policy alignment.
/// </summary>
public sealed class StockEvaluationService(
    IStockDataProvider stockProvider,
    IStockScoringService scoringService,
    IPortfolioRepository? repository = null)
{
    public async Task<StockEvaluationDetailDto?> EvaluateAsync(string ticker)
    {
        var stock = await stockProvider.GetStockAsync(ticker);
        if (stock is null) return null;

        var score = scoringService.CalculateScore(stock);

        return new StockEvaluationDetailDto(
            Ticker: stock.Ticker.Value,
            Name: stock.Name,
            Sector: stock.Sector.ToString(),
            Price: stock.CurrentPrice.Amount,
            Currency: stock.CurrentPrice.Currency,
            PERatio: stock.PERatio,
            DividendYield: stock.DividendYield,
            MarketCap: stock.MarketCap,
            OverallScore: score.OverallScore,
            QualityScore: score.QualityScore,
            RelativeValuationScore: score.RelativeValuationScore,
            SectorCycleScore: score.SectorCycleScore,
            InstitutionalGovernanceScore: score.InstitutionalGovernanceScore,
            MacroPolicyScore: score.MacroPolicyScore,
            RatingCategory: score.RatingCategory,
            InvestmentArchetype: score.InvestmentArchetype,
            SectorCycleStatus: score.SectorCycleStatus,
            InstitutionalCommentary: score.InstitutionalCommentary,
            PolicyTailwindSummary: score.PolicyTailwindSummary,
            PeerBenchmark: new PeerBenchmarkDto(
                StockPE: score.PeerBenchmark.StockPE,
                SectorMedianPE: score.PeerBenchmark.SectorMedianPE,
                PegRatio: score.PeerBenchmark.PegRatio,
                ValuationVerdict: score.PeerBenchmark.ValuationVerdict,
                TopPeers: score.PeerBenchmark.TopPeers
            ),
            GovernanceAudit: new GovernanceAuditDto(
                PromoterHoldingPercent: score.GovernanceAudit.PromoterHoldingPercent,
                PromoterPledgePercent: score.GovernanceAudit.PromoterPledgePercent,
                RocePercent: score.GovernanceAudit.RocePercent,
                RoePercent: score.GovernanceAudit.RoePercent,
                DebtToEquity: score.GovernanceAudit.DebtToEquity,
                GovernanceRating: score.GovernanceAudit.GovernanceRating
            ),
            InstitutionalFlow: new InstitutionalFlowDto(
                FiiHoldingPercent: score.InstitutionalFlow.FiiHoldingPercent,
                DiiHoldingPercent: score.InstitutionalFlow.DiiHoldingPercent,
                InstitutionalConsensus: score.InstitutionalFlow.InstitutionalConsensus,
                FlowTrend: score.InstitutionalFlow.FlowTrend
            ),
            Strengths: score.Strengths,
            RiskFlags: score.RiskFlags,
            FundamentalScore: score.FundamentalScore,
            TechnicalScore: score.TechnicalScore,
            FairValueEstimate: score.FairValueEstimate,
            MarginOfSafetyPercent: score.MarginOfSafetyPercent,
            ValuationBandVerdict: score.ValuationBandVerdict,
            BetterMarketAlternatives: score.BetterMarketAlternatives?.Select(a => new StockAlternativeDto(
                Ticker: a.Ticker,
                Name: a.Name,
                Price: a.Price,
                PeRatio: a.PeRatio,
                PegRatio: a.PegRatio,
                RocePercent: a.RocePercent,
                WhyBetter: a.WhyBetter,
                MomentumBadge: a.MomentumBadge
            )).ToList(),
            SupplyChain: score.SupplyChain is null ? null : new CompanySupplyChainDto(
                BusinessModelSummary: score.SupplyChain.BusinessModelSummary,
                KeyInputs: score.SupplyChain.KeyInputs.Select(i => new SupplyChainInputDto(
                    Name: i.Name,
                    Category: i.Category,
                    TypicalSourceOrSuppliers: i.TypicalSourceOrSuppliers,
                    CostWeightEstimate: i.CostWeightEstimate,
                    RiskOrVolatilityNote: i.RiskOrVolatilityNote,
                    SupplierBargainingPower: i.SupplierBargainingPower,
                    PassThroughLagDays: i.PassThroughLagDays,
                    EstimatedCogsPercent: i.EstimatedCogsPercent,
                    TierLevel: i.TierLevel,
                    SourcingContractType: i.SourcingContractType
                )).ToList(),
                ValueChain: new ValueChainTransformationDto(
                    CoreProcess: score.SupplyChain.ValueChain.CoreProcess,
                    ValueAdditionSummary: score.SupplyChain.ValueChain.ValueAdditionSummary,
                    MoatFactor: score.SupplyChain.ValueChain.MoatFactor,
                    GrossConversionMargin: score.SupplyChain.ValueChain.GrossConversionMargin,
                    MoatRating: score.SupplyChain.ValueChain.MoatRating,
                    ConversionMarginPercent: score.SupplyChain.ValueChain.ConversionMarginPercent,
                    KeyPatentsOrCertifications: score.SupplyChain.ValueChain.KeyPatentsOrCertifications,
                    WorkingCapitalCycleDays: score.SupplyChain.ValueChain.WorkingCapitalCycleDays,
                    CapexToRevenuePercent: score.SupplyChain.ValueChain.CapexToRevenuePercent
                ),
                KeyOutputs: score.SupplyChain.KeyOutputs.Select(o => new SupplyChainOutputDto(
                    ProductOrService: o.ProductOrService,
                    CustomerSegment: o.CustomerSegment,
                    RevenueContribution: o.RevenueContribution,
                    DemandDrivers: o.DemandDrivers,
                    CustomerConcentration: o.CustomerConcentration,
                    RevenueSharePercent: o.RevenueSharePercent,
                    PricingPowerScore: o.PricingPowerScore,
                    ExportRevenuePercent: o.ExportRevenuePercent,
                    CounterpartyRiskTier: o.CounterpartyRiskTier
                )).ToList(),
                MacroCostSensitivities: score.SupplyChain.MacroCostSensitivities.Select(s => new SupplyChainSensitivityDto(
                    FactorName: s.FactorName,
                    ImpactDirection: s.ImpactDirection,
                    Mechanism: s.Mechanism,
                    ElasticityMetric: s.ElasticityMetric,
                    QuantitativeScenario: s.QuantitativeScenario,
                    MarginImpactBps: s.MarginImpactBps,
                    PassThroughLagDays: s.PassThroughLagDays,
                    MitigationBuffer: s.MitigationBuffer
                )).ToList(),
                CustomerConcentration: score.SupplyChain.CustomerConcentration is null ? null : new CustomerConcentrationDto(
                    Top1CustomerPercent: score.SupplyChain.CustomerConcentration.Top1CustomerPercent,
                    Top5CustomerPercent: score.SupplyChain.CustomerConcentration.Top5CustomerPercent,
                    Top10CustomerPercent: score.SupplyChain.CustomerConcentration.Top10CustomerPercent,
                    HerfindahlHirschmanIndex: score.SupplyChain.CustomerConcentration.HerfindahlHirschmanIndex,
                    CounterpartyRiskGrade: score.SupplyChain.CustomerConcentration.CounterpartyRiskGrade,
                    ConcentrationVerdict: score.SupplyChain.CustomerConcentration.ConcentrationVerdict
                ),
                SplcAudit: score.SupplyChain.SplcAudit is null ? null : new BloombergSplcAuditDto(
                    PrimarySupplierCountryConcentration: score.SupplyChain.SplcAudit.PrimarySupplierCountryConcentration,
                    SingleSourceVulnerability: score.SupplyChain.SplcAudit.SingleSourceVulnerability,
                    SplcRelationshipStatus: score.SupplyChain.SplcAudit.SplcRelationshipStatus,
                    CostPassThroughElasticityScore: score.SupplyChain.SplcAudit.CostPassThroughElasticityScore
                )
            ),
            ShareholdingPattern: score.ShareholdingPattern is null ? null : new ShareholdingPatternDto(
                PromoterPercent: score.ShareholdingPattern.PromoterPercent,
                FiiPercent: score.ShareholdingPattern.FiiPercent,
                DiiPercent: score.ShareholdingPattern.DiiPercent,
                GovernmentPercent: score.ShareholdingPattern.GovernmentPercent,
                PublicPercent: score.ShareholdingPattern.PublicPercent,
                PromoterPledgePercent: score.ShareholdingPattern.PromoterPledgePercent,
                QuarterPeriod: score.ShareholdingPattern.QuarterPeriod,
                QoQPromoterChange: score.ShareholdingPattern.QoQPromoterChange,
                QoQFiiChange: score.ShareholdingPattern.QoQFiiChange,
                QoQDiiChange: score.ShareholdingPattern.QoQDiiChange,
                RecentWhaleDeals: score.ShareholdingPattern.RecentWhaleDeals.Select(w => new WhaleTransactionDto(
                    DealDate: w.DealDate,
                    ClientName: w.ClientName,
                    DealType: w.DealType,
                    TransactionType: w.TransactionType,
                    Quantity: w.Quantity,
                    TradePrice: w.TradePrice,
                    StakePercent: w.StakePercent,
                    DealValueCrores: w.DealValueCrores,
                    Significance: w.Significance
                )).ToList(),
                BigPublicInvestorsPercent: score.ShareholdingPattern.BigPublicInvestorsPercent,
                GeneralRetailPublicPercent: score.ShareholdingPattern.GeneralRetailPublicPercent,
                BigPublicInvestors: score.ShareholdingPattern.BigPublicInvestors?.Select(b => new BigPublicInvestorDto(
                    InvestorName: b.InvestorName,
                    StakePercent: b.StakePercent,
                    HoldingValueCrores: b.HoldingValueCrores,
                    InvestorType: b.InvestorType,
                    TrendDirection: b.TrendDirection
                )).ToList()
            ),
            ManagementAudit: score.ManagementAudit is null ? null : new ManagementAuditDto(
                IntegrityRating: score.ManagementAudit.IntegrityRating,
                GovernanceScore: score.ManagementAudit.GovernanceScore,
                CapitalAllocationTrackRecord: score.ManagementAudit.CapitalAllocationTrackRecord,
                ExecutionCapability: score.ManagementAudit.ExecutionCapability,
                ManagementSentiment: score.ManagementAudit.ManagementSentiment,
                SentimentSummary: score.ManagementAudit.SentimentSummary,
                LatestConcallHighlights: score.ManagementAudit.LatestConcallHighlights,
                ConcallDate: score.ManagementAudit.ConcallDate,
                MajorEventsAndUproar: score.ManagementAudit.MajorEventsAndUproar.Select(e => new ManagementEventAlertDto(
                    EventDate: e.EventDate,
                    EventType: e.EventType,
                    Severity: e.Severity,
                    Headline: e.Headline,
                    Details: e.Details,
                    StrategicImpact: e.StrategicImpact
                )).ToList()
            )
        );
    }

    public async Task<IReadOnlyList<StockSearchResultDto>> SearchStocksAsync(
        string? query,
        Guid? portfolioId = null,
        CancellationToken ct = default)
    {
        query = (query ?? string.Empty).Trim();
        var results = new Dictionary<string, (StockSearchResultDto Item, int Priority)>(StringComparer.OrdinalIgnoreCase);

        // 1. Search in portfolio holdings if repository is available
        if (repository != null)
        {
            Domain.Models.Portfolio? portfolio = null;
            if (portfolioId.HasValue)
            {
                portfolio = await repository.GetByIdAsync(portfolioId.Value);
            }
            else
            {
                var all = await repository.GetAllAsync();
                portfolio = all.FirstOrDefault();
            }

            if (portfolio != null)
            {
                foreach (var h in portfolio.Holdings)
                {
                    var ticker = h.Stock.Ticker.Value;
                    var name = h.Stock.Name;
                    var sector = h.Stock.Sector.ToString();
                    var buy = h.AverageBuyPrice?.Amount ?? h.Stock.CurrentPrice.Amount;
                    var pnlPct = buy > 0 ? ((h.Stock.CurrentPrice.Amount - buy) / buy) * 100m : 0m;

                    int priority = CalculateMatchPriority(ticker, name, sector, query);
                    if (priority > 0)
                    {
                        results[ticker] = (new StockSearchResultDto(
                            Ticker: ticker,
                            Name: name,
                            Sector: sector,
                            CurrentPrice: h.Stock.CurrentPrice.Amount,
                            PERatio: h.Stock.PERatio,
                            MarketCap: h.Stock.MarketCap,
                            IsHeld: true,
                            QuantityHeld: h.Quantity,
                            UnrealizedPnLPercent: Math.Round(pnlPct, 1)
                        ), priority + 50); // Boost portfolio holdings
                    }
                }
            }
        }

        // 2. Also search known master universe / stockProvider
        var candidateTickers = new[]
        {
            "TCS", "INFY", "HCLTECH", "WIPRO", "KPITTECH", "CMSINFO", "NAUKRI",
            "RELIANCE", "ONGC", "COALINDIA", "BPCL", "BHARATCOAL", "VOGL",
            "HDFCBANK", "BAJFINANCE", "JIOFIN", "CANBK", "RECLTD", "IREDA", "IEX", "CDSL", "BSE", "MUTHOOTFIN", "ICICIGI", "ANGELONE", "NSDL", "YESBANK", "APTUS", "IRFC", "IBULHSGFIN", "GICRE",
            "TATAMOTORS", "M&M", "TRENT", "IRCTC", "METROBRAND", "REDTAPE", "MSUMI", "EXIDEIND", "BATAINDIA", "ITCHOTELS", "ETHOSLTD", "FIRSTCRY", "MHRIL", "VMM", "TMCV",
            "BEL", "ASTRAMICRO", "MAZDOCK", "BDL", "KAYNES", "CGPOWER", "WABAG", "CONCOR", "GMRINFRA", "HGINFRA", "IRCON", "NCC", "DELHIVERY", "SHAKTIPUMP", "GRINFRA", "IDEAFORGE", "IXIGO", "BHARTIARTL", "ELIN", "OSWALPUMPS", "TRANSRAILL", "SPMLINFRA", "JISLJALEQS", "AWHCL",
            "ADANIPOWER", "TATAPOWER", "POWERGRID", "SUZLON", "INOXWIND", "PREMIERENE", "SWSOLAR", "GUJENERGY", "RPOWER",
            "ITC", "HINDUNILVR", "GODREJCP", "DABUR", "PGHH", "UBL", "TRIVENI", "KSCL", "BBTC",
            "HINDZINC", "HINDCOPPER", "AMBUJACEM", "CHAMBLFERT", "MOIL", "TATACHEM", "VEDL", "UPL", "SHARDACROP", "RCF", "VAML", "JAINREC",
            "RAILTEL", "SANOFI", "NBCC", "VALOR"
        };

        foreach (var ticker in candidateTickers)
        {
            if (results.ContainsKey(ticker)) continue;

            int priority = CalculateMatchPriority(ticker, ticker, string.Empty, query);
            if (priority > 0)
            {
                var stock = await stockProvider.GetStockAsync(ticker);
                if (stock != null)
                {
                    priority = CalculateMatchPriority(stock.Ticker.Value, stock.Name, stock.Sector.ToString(), query);
                    results[ticker] = (new StockSearchResultDto(
                        Ticker: stock.Ticker.Value,
                        Name: stock.Name,
                        Sector: stock.Sector.ToString(),
                        CurrentPrice: stock.CurrentPrice.Amount,
                        PERatio: stock.PERatio,
                        MarketCap: stock.MarketCap,
                        IsHeld: false,
                        QuantityHeld: null,
                        UnrealizedPnLPercent: null
                    ), priority);
                }
            }
        }

        return results.Values
            .OrderByDescending(r => r.Priority)
            .ThenByDescending(r => r.Item.MarketCap ?? 0)
            .Select(r => r.Item)
            .Take(12)
            .ToList();
    }

    private static int CalculateMatchPriority(string ticker, string name, string sector, string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return 10;

        if (ticker.Equals(query, StringComparison.OrdinalIgnoreCase)) return 100;
        if (ticker.StartsWith(query, StringComparison.OrdinalIgnoreCase)) return 90;
        if (name.StartsWith(query, StringComparison.OrdinalIgnoreCase)) return 80;
        if (ticker.Contains(query, StringComparison.OrdinalIgnoreCase)) return 60;
        if (name.Contains(query, StringComparison.OrdinalIgnoreCase)) return 50;
        if (sector.Contains(query, StringComparison.OrdinalIgnoreCase)) return 30;

        return 0;
    }
}
