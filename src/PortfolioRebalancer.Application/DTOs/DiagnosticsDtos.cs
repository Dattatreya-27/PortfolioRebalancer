namespace PortfolioRebalancer.Application.DTOs;

public sealed record StockEvaluationDetailDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Price,
    string Currency,
    decimal? PERatio,
    decimal? DividendYield,
    decimal? MarketCap,
    decimal OverallScore,
    decimal QualityScore,
    decimal RelativeValuationScore,
    decimal SectorCycleScore,
    decimal InstitutionalGovernanceScore,
    decimal MacroPolicyScore,
    string RatingCategory,
    string InvestmentArchetype,
    string SectorCycleStatus,
    string InstitutionalCommentary,
    string PolicyTailwindSummary,
    PeerBenchmarkDto PeerBenchmark,
    GovernanceAuditDto GovernanceAudit,
    InstitutionalFlowDto InstitutionalFlow,
    IReadOnlyList<string> Strengths,
    IReadOnlyList<string> RiskFlags,
    decimal FundamentalScore,
    decimal TechnicalScore,
    decimal FairValueEstimate = 0m,
    decimal MarginOfSafetyPercent = 0m,
    string ValuationBandVerdict = "",
    IReadOnlyList<StockAlternativeDto>? BetterMarketAlternatives = null
);

public sealed record StockAlternativeDto(
    string Ticker,
    string Name,
    decimal Price,
    decimal PeRatio,
    decimal PegRatio,
    decimal RocePercent,
    string WhyBetter,
    string MomentumBadge
);

public sealed record PeerBenchmarkDto(
    decimal StockPE,
    decimal SectorMedianPE,
    decimal PegRatio,
    string ValuationVerdict,
    IReadOnlyList<string> TopPeers
);

public sealed record GovernanceAuditDto(
    decimal PromoterHoldingPercent,
    decimal PromoterPledgePercent,
    decimal RocePercent,
    decimal RoePercent,
    decimal DebtToEquity,
    string GovernanceRating
);

public sealed record InstitutionalFlowDto(
    decimal FiiHoldingPercent,
    decimal DiiHoldingPercent,
    string InstitutionalConsensus,
    string FlowTrend
);

public sealed record PortfolioDiagnosticsDto(
    Guid PortfolioId,
    decimal HealthScore,
    string HealthGrade,
    string HealthRating,
    string ExecutiveSummary,
    HhiConcentrationDto Concentration,
    MarketCapDistributionDto MarketCapSplit,
    TailEndDilutionDto TailEndAnalysis,
    PnlHarvestingSummaryDto Harvesting,
    IReadOnlyList<ConstraintViolationDto> Violations,
    IReadOnlyList<AdvisoryGuidancePillarDto> AdvisoryPillars,
    IReadOnlyList<UpcomingEventDto> UpcomingEvents,
    CrashDefenseDto? CrashDefense = null
);

public sealed record CrashDefenseDto(
    int Score,
    string Grade,
    decimal ZeroDebtRatioPercent,
    decimal HighRoceRatioPercent,
    decimal LargeCapRatioPercent,
    decimal TenPercentCorrectionDipRupees,
    decimal TenPercentCorrectionDipPercent,
    string ExpectedRecoveryHorizon,
    string PeaceOfMindSummary
);

public sealed record HhiConcentrationDto(
    decimal HhiScore,
    decimal EffectiveHoldings,
    string DiversificationStatus,
    string Verdict,
    string MaxStockTicker,
    decimal MaxStockWeight,
    string MaxSectorName,
    decimal MaxSectorWeight,
    decimal Top5WeightPercent
);

public sealed record MarketCapDistributionDto(
    decimal LargeCapPercent,
    decimal MidCapPercent,
    decimal SmallCapPercent,
    decimal LargeCapValue,
    decimal MidCapValue,
    decimal SmallCapValue,
    string BenchmarkComparison
);

public sealed record TailEndDilutionDto(
    int MicroHoldingsCount,
    decimal TotalMicroValue,
    decimal PercentOfPortfolio,
    IReadOnlyList<string> MicroTickers,
    string Rationale
);

public sealed record PnlHarvestingSummaryDto(
    int ProfitPositionsCount,
    int LossPositionsCount,
    decimal TotalUnrealizedPnL,
    decimal TotalUnrealizedPnLPercent,
    IReadOnlyList<HarvestingCandidateDto> ProfitBookingCandidates,
    IReadOnlyList<HarvestingCandidateDto> LossHarvestingCandidates
);

public sealed record HarvestingCandidateDto(
    string Ticker,
    string Name,
    decimal BuyPrice,
    decimal CurrentPrice,
    decimal PnlPercent,
    decimal MarketValue,
    string ActionReason,
    string SuggestedAction
);

public sealed record AdvisoryGuidancePillarDto(
    string Category,
    string Title,
    string Description,
    string ImpactLevel,
    string ActionBadge,
    IReadOnlyList<string> TargetTickers
);

public sealed record ConstraintViolationDto(
    string RuleName,
    string Target,
    decimal CurrentValue,
    decimal AllowedLimit,
    string Severity
);

public sealed record UpcomingEventDto(
    string? Ticker,
    string EventTitle,
    string EventType,
    string ScheduledDate,
    string ExpectedImpact
);