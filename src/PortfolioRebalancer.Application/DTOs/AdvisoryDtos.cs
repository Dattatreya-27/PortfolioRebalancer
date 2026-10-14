namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// Advisory trade recommendation for locking in profits or cutting laggards.
/// </summary>
public sealed record ProfitBookingRecommendationDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Quantity,
    decimal AvgBuyPrice,
    decimal CurrentPrice,
    decimal TargetExitPrice,
    decimal UnrealizedProfitPercent,
    decimal EstimatedTotalProfit,
    string Urgency, // "High", "Medium", "Hold/Trailing Stop"
    string ActionReason
);

/// <summary>
/// Micro-positions (under 0.5% weight) identified for consolidation into high-conviction core leaders.
/// </summary>
public sealed record TailEndConsolidationDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Quantity,
    decimal InvestedValue,
    decimal WeightPercent,
    string ConsolidationCandidate, // e.g. "Consolidate into SUZLON / PREMIERENE"
    string Rationale
);

/// <summary>
/// Comprehensive advisory dossier containing profit targets, consolidation candidates, and tax estimates.
/// </summary>
public sealed record FinancialAdvisoryReportDto(
    Guid PortfolioId,
    decimal TotalInvested,
    decimal EstimatedCurrentValue,
    decimal TotalUnrealizedGains,
    IReadOnlyList<ProfitBookingRecommendationDto> ProfitTargets,
    IReadOnlyList<TailEndConsolidationDto> TailEndHoldings,
    decimal EstimatedCashUnlockedFromTargets
);
