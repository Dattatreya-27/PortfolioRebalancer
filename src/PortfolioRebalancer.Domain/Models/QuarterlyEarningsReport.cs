namespace PortfolioRebalancer.Domain.Models;

public record QuarterlyFinancialPeriod(
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

public record EarningsSurprise(
    string QuarterLabel,
    decimal? ConsensusEps,
    decimal? ActualEps,
    decimal SurprisePercent,
    string Verdict // "BEAT" | "IN_LINE" | "MISS"
);

public record QuarterlyEarningsSummary(
    string Ticker,
    string CompanyName,
    string LatestQuarter,
    string SurpriseVerdict, // "BEAT" | "IN_LINE" | "MISS"
    decimal CashConversionRatio, // OCF / EBITDA %
    string DebtTrajectory, // "DELEVERAGING" | "STABLE" | "LEVERAGING" | "NET_CASH"
    IReadOnlyList<QuarterlyFinancialPeriod> Quarters,
    IReadOnlyList<string> SegmentDrivers,
    IReadOnlyList<string> WhatImproved,
    IReadOnlyList<string> WhatDeteriorated,
    string PlainEnglishSummary
);
