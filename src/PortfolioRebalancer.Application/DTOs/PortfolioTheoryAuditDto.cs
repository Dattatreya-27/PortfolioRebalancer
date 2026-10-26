namespace PortfolioRebalancer.Application.DTOs;

public enum TheoryAuditCategory
{
    TheoryChampion,  // Passes 2+ theories (High conviction core compounder)
    NearMiss,        // Passes 1 theory or high quality awaiting trigger
    ToxicLaggard     // Fails all 3 theories (High debt, negative cash flows, capital drag)
}

public sealed record HoldingTheoryAuditItemDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Quantity,
    decimal CurrentPrice,
    decimal MarketValue,
    decimal UnrealizedPnL,
    decimal UnrealizedPnLPercent,
    decimal WeightPercent,
    TheoryAuditCategory Classification,
    IReadOnlyList<string> PassedTheories,
    IReadOnlyList<string> FailedTheories,
    decimal QualityScore,
    decimal RocePercent,
    decimal DebtToEquity,
    decimal EstimatedFScore,
    decimal EstimatedRsRating,
    string PlainEnglishReason,
    string RecommendedAction,
    string SuggestedTheoryReplacement
);

public sealed record PortfolioTheoryAuditSummaryDto(
    Guid PortfolioId,
    string PortfolioName,
    DateTime AuditedAt,
    int TotalHoldingsCount,
    decimal TotalPortfolioValue,
    int ChampionsCount,
    decimal ChampionsValue,
    decimal ChampionsWeightPercent,
    int NearMissCount,
    decimal NearMissValue,
    decimal NearMissWeightPercent,
    int ToxicCount,
    decimal ToxicValue,
    decimal ToxicWeightPercent,
    decimal CapitalLockedInToxicAssets,
    string ExecutiveVerdict,
    IReadOnlyList<HoldingTheoryAuditItemDto> Holdings
);

// -------------------------------------------------------------------------------------------------
// Feature 2: What-If Swap Simulator DTOs
// -------------------------------------------------------------------------------------------------

public sealed record PortfolioSwapRequestDto(
    Guid PortfolioId,
    string ExitTicker,
    string TargetTicker
);

public sealed record PortfolioSwapResultDto(
    Guid PortfolioId,
    string ExitTicker,
    string ExitName,
    string ExitSector,
    decimal ExitQuantity,
    decimal ExitPrice,
    decimal ReleasedCapital,
    string TargetTicker,
    string TargetName,
    string TargetSector,
    decimal TargetPrice,
    decimal AcquiredShares,
    decimal RemainingCash,
    decimal PortfolioTotalValue,
    // Factor Deltas
    decimal BeforeWeightedRoce,
    decimal AfterWeightedRoce,
    decimal DeltaRoce,
    decimal BeforeWeightedDebtToEquity,
    decimal AfterWeightedDebtToEquity,
    decimal DeltaDebtToEquity,
    decimal BeforeEstimatedBeta,
    decimal AfterEstimatedBeta,
    decimal DeltaBeta,
    decimal BeforeEstimatedRs,
    decimal AfterEstimatedRs,
    decimal DeltaRs,
    // Sector Allocation Shifts
    decimal ExitSectorBeforeWeight,
    decimal ExitSectorAfterWeight,
    decimal TargetSectorBeforeWeight,
    decimal TargetSectorAfterWeight,
    // Institutional Verdict
    string QuantVerdict,
    bool IsFavorableSwap,
    IReadOnlyList<string> KeyBenefits
);

// -------------------------------------------------------------------------------------------------
// Feature 3: Full-Time Investor Correlation Matrix & Concentration Stress DTOs
// -------------------------------------------------------------------------------------------------

public sealed record CorrelatedClusterRiskDto(
    string StockA,
    string StockB,
    string SectorA,
    string SectorB,
    double Correlation,
    decimal CombinedCapital,
    decimal CombinedWeightPercent,
    string RiskWarning
);

public sealed record PortfolioCorrelationMatrixDto(
    Guid PortfolioId,
    string PortfolioName,
    IReadOnlyList<string> Tickers,
    IReadOnlyList<string> Names,
    IReadOnlyList<string> Sectors,
    IReadOnlyList<decimal> WeightsPercent,
    double[][] Matrix,
    decimal DiversificationRatio,
    string DiversificationRating,
    IReadOnlyList<CorrelatedClusterRiskDto> HighRiskClusters,
    string InstitutionalCommentary
);

// -------------------------------------------------------------------------------------------------
// Feature 4: Supply Chain & Commodity Macro Shock Simulator DTOs
// -------------------------------------------------------------------------------------------------

public sealed record MacroHoldingImpactDto(
    string Ticker,
    string Name,
    string Sector,
    decimal WeightPercent,
    decimal CurrentMarketValue,
    string ImpactDirection,
    decimal EstimatedImpactPercent,
    decimal EstimatedPnlDelta,
    string TransmissionMechanism
);

public sealed record MacroStressTestResultDto(
    Guid PortfolioId,
    string ScenarioKey,
    string ScenarioTitle,
    string ScenarioDescription,
    string MacroTrigger,
    decimal PortfolioValue,
    decimal PortfolioEstimatedImpactPercent,
    decimal PortfolioEstimatedPnlImpact,
    IReadOnlyList<MacroHoldingImpactDto> Beneficiaries,
    IReadOnlyList<MacroHoldingImpactDto> SqueezedHoldings,
    string DefensiveActionRecommendation
);
