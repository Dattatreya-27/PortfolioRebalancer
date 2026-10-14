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
    decimal FundamentalScore,
    decimal TechnicalScore,
    decimal MacroPolicyScore,
    string RatingCategory,
    string PolicyTailwindSummary,
    IReadOnlyList<string> RiskFlags
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
    IReadOnlyList<UpcomingEventDto> UpcomingEvents
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