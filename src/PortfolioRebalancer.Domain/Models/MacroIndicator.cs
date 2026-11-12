namespace PortfolioRebalancer.Domain.Models;

public record MacroIndicator(
    string Code,
    string Name,
    string Region, // "India" | "Global"
    decimal CurrentValue,
    decimal PreviousValue,
    decimal ChangeDelta,
    string Unit,
    string TrendDirection, // "UP" | "DOWN" | "FLAT"
    string AsOfDate,
    string Commentary
);

public record MarketRegimeSnapshot(
    decimal NiftyPrice,
    decimal Nifty50Dma,
    decimal Nifty200Dma,
    decimal IndiaVix,
    decimal MarketBreadthPercent,
    DateTime CapturedAtUtc
);

public record MacroHoldingImpact(
    string IndicatorCode,
    string IndicatorName,
    string Ticker,
    string Sector,
    string ImpactDirection, // "TAILWIND" | "HEADWIND" | "NEUTRAL"
    string ImpactStrength,  // "HIGH" | "MEDIUM" | "LOW"
    string Mechanism
);
