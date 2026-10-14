namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// A proven quantitative market strategy backtested on the Nifty 500 universe.
/// </summary>
public sealed record QuantStrategyBacktestDto(
    string StrategyId,
    string StrategyName,
    string Philosophy,
    string CoreCriteria,
    decimal HistoricalCagrPercent, // 2018 - 2024 backtested CAGR
    decimal BenchmarkCagrPercent,  // Nifty 500 benchmark (~15.2% CAGR)
    decimal MaxDrawdownPercent,
    decimal WinRatePercent,
    IReadOnlyList<StockOpportunityDto> IdentifiedOpportunities
);

/// <summary>
/// Stock matching a quantitative theory (undervalued or breakout candidate).
/// </summary>
public sealed record StockOpportunityDto(
    string Ticker,
    string Name,
    string Sector,
    decimal CurrentPrice,
    decimal ValuationMetric, // P/E or PEG or Discount to 52W High
    decimal TargetPrice,
    decimal UpsidePotentialPercent,
    string TriggerSignal,    // "52W High Breakout + Volume", "GARP P/E Compression", "High ROCE Capitulation"
    string CatalystRationale
);

/// <summary>
/// News scenario stress testing report (Bullish, Base, Bearish policy/earnings scenarios).
/// </summary>
public sealed record NewsScenarioStressTestDto(
    string ScenarioName,
    string TriggerEvent,
    string MarketImpact, // "Positive", "Neutral", "Adverse"
    decimal ProjectedPortfolioImpactPercent,
    IReadOnlyList<string> VulnerableHoldings,
    IReadOnlyList<string> ResilientHoldings,
    string AdvisoryAction
);

/// <summary>
/// The Master Intelligence and Research Report combining Backtested Theories and Scenario Stress Tests.
/// </summary>
public sealed record MasterResearchReportDto(
    Guid PortfolioId,
    DateTime GeneratedAt,
    IReadOnlyList<QuantStrategyBacktestDto> TopStrategies,
    IReadOnlyList<NewsScenarioStressTestDto> ScenarioStressTests
);
