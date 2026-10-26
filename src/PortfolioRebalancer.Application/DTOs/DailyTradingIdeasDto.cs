namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// Daily swing / positional trading signal identified by the algorithmic scanning engine.
/// </summary>
public sealed record DailyTradingIdeaDto(
    string Ticker,
    string Name,
    string Sector,
    decimal CurrentPrice,
    string SignalType,            // "IVAD_POCKET_PIVOT_BREAKOUT", "MOS_MEAN_REVERSION_DIP", "IDOD_DISTRIBUTION_WARNING"
    string StrategyName,
    string FormulaDescription,
    int SetupQualityScore,        // 1 - 100
    decimal EntryTrigger,
    decimal StopLoss,
    decimal TargetPrice,
    decimal RiskRewardRatio,
    string VolumeProfile,
    string CatalystRationale,
    string ActionableGuidance,
    string HoldingStatus
);

/// <summary>
/// Daily stock trading ideas and algorithmic screener report for active portfolio monitoring.
/// </summary>
public sealed record DailyTradingRadarDto(
    Guid PortfolioId,
    string PortfolioName,
    DateTime GeneratedAtUtc,
    IReadOnlyList<DailyTradingIdeaDto> InstitutionalBreakouts,
    IReadOnlyList<DailyTradingIdeaDto> MeanReversionDips,
    IReadOnlyList<DailyTradingIdeaDto> DistributionWarnings,
    IReadOnlyList<string> DailyExecutionRules
);
