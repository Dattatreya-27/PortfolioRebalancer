namespace PortfolioRebalancer.Application.DTOs;

public record QuarterlyPeriodDto(
    string QuarterLabel,
    DateTime PeriodEndDate,
    decimal RevenueCrores,
    decimal RevenueYoYPercent,
    decimal RevenueQoQPercent,
    decimal EbitdaCrores,
    decimal OperatingMarginPercent,
    decimal PatCrores,
    decimal PatYoYPercent,
    decimal PatQoQPercent,
    decimal Eps,
    decimal OperatingCashFlowCrores
);

public record QuarterlyEarningsSummaryDto(
    string Ticker,
    string CompanyName,
    string LatestQuarter,
    string SurpriseVerdict,
    decimal CashConversionRatio,
    string DebtTrajectory,
    IReadOnlyList<QuarterlyPeriodDto> Quarters,
    IReadOnlyList<string> SegmentDrivers,
    IReadOnlyList<string> WhatImproved,
    IReadOnlyList<string> WhatDeteriorated,
    string PlainEnglishSummary
);

public record HoldingEarningsDigestItemDto(
    string Ticker,
    string StockName,
    string Sector,
    decimal WeightPercent,
    string LatestQuarter,
    string SurpriseVerdict,
    decimal RevenueYoYPercent,
    decimal PatYoYPercent,
    decimal OperatingMarginPercent,
    decimal CashConversionRatio,
    string DebtTrajectory,
    string PlainEnglishSummary,
    IReadOnlyList<string> WhatImproved,
    IReadOnlyList<string> WhatDeteriorated
);

public record PortfolioEarningsDigestDto(
    Guid PortfolioId,
    string PortfolioName,
    int BeatCount,
    int InLineCount,
    int MissCount,
    IReadOnlyList<HoldingEarningsDigestItemDto> Holdings
);

public record HoldingInstitutionalSummaryDto(
    string Ticker,
    string StockName,
    string Sector,
    decimal WeightPercent,
    string QuarterPeriod,
    decimal FiiPercent,
    decimal QoQFiiChange,
    decimal DiiPercent,
    decimal QoQDiiChange,
    decimal PromoterPercent,
    decimal QoQPromoterChange,
    decimal PromoterPledgePercent,
    string NetInstitutionalSignal, // "ACCUMULATION" | "DISTRIBUTION" | "NEUTRAL"
    int WhaleAlertsCount,
    string LatestWhaleSummary,
    IReadOnlyList<string> NotableInvestors
);

public record PortfolioInstitutionalRadarDto(
    Guid PortfolioId,
    string PortfolioName,
    int AccumulationCount,
    int DistributionCount,
    int PledgeFlagCount,
    IReadOnlyList<HoldingInstitutionalSummaryDto> Holdings
);

public record HoldingManagementPulseDto(
    string Ticker,
    string StockName,
    string Sector,
    decimal WeightPercent,
    string IntegrityRating,
    decimal GovernanceScore,
    string CapitalAllocationTrackRecord,
    string ExecutionCapability,
    string ManagementSentiment,
    string LatestConcallHighlights,
    string MajorEventsAndUproar
);

public record PortfolioManagementPulseDto(
    Guid PortfolioId,
    string PortfolioName,
    decimal AverageGovernanceScore,
    int BullishToneCount,
    int CautiousOrFlaggedCount,
    IReadOnlyList<HoldingManagementPulseDto> Holdings
);

public record MacroIndicatorDto(
    string Code,
    string Name,
    string Region,
    decimal CurrentValue,
    decimal PreviousValue,
    decimal ChangeDelta,
    string Unit,
    string TrendDirection,
    string AsOfDate,
    string Commentary
);

public record MacroIndicatorHoldingImpactDto(
    string IndicatorCode,
    string IndicatorName,
    string Ticker,
    string Sector,
    string ImpactDirection,
    string ImpactStrength,
    string Mechanism
);

public record MacroDashboardDto(
    Guid? PortfolioId,
    DateTime GeneratedAtUtc,
    IReadOnlyList<MacroIndicatorDto> IndiaIndicators,
    IReadOnlyList<MacroIndicatorDto> GlobalIndicators,
    IReadOnlyList<MacroIndicatorHoldingImpactDto> PortfolioImpacts
);

public record PolicyShiftDto(
    string Id,
    string Title,
    string Scope,
    string Category,
    string AnnouncedDate,
    string SourceAuthority,
    string Summary,
    IReadOnlyList<string> AffectedSectors
);

public record PolicyHoldingImpactDto(
    string PolicyId,
    string PolicyTitle,
    string Scope,
    string Category,
    string AnnouncedDate,
    string SourceAuthority,
    string Ticker,
    string StockName,
    string Sector,
    string ImpactType,
    string ImpactDirection,
    string Rationale
);

public record PortfolioPolicyImpactMapDto(
    Guid? PortfolioId,
    int DomesticShiftsCount,
    int InternationalShiftsCount,
    int DirectImpactsCount,
    int IndirectImpactsCount,
    IReadOnlyList<PolicyShiftDto> Policies,
    IReadOnlyList<PolicyHoldingImpactDto> HoldingImpacts
);
