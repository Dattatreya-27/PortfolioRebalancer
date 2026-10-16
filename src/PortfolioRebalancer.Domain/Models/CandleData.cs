namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Represents a single historical trading session candlestick (OHLCV).
/// </summary>
public sealed record CandleData(
    string Date, // YYYY-MM-DD
    decimal Open,
    decimal High,
    decimal Low,
    decimal Close,
    long Volume
);

/// <summary>
/// A single point along a technical indicator overlay (e.g. 20 EMA, 50 SMA).
/// </summary>
public sealed record TechnicalIndicatorPoint(
    string Date,
    decimal Value
);

/// <summary>
/// An algorithmically recognized technical price/volume pattern.
/// </summary>
public sealed record DetectedPattern(
    string Name,
    string Category, // Breakout, Reversal, Support, Warning
    string Description,
    bool IsBullish,
    decimal ConfidenceScore,
    string? DateDetected = null
);

/// <summary>
/// Structured institutional 1-2 month swing trading setup (targeting 5% to 15%+ returns).
/// Powered by the Quant tournament winners: Tech Team Alpha (VCP Momentum Breakout) and Tech Team Beta (50-SMA VDU Pullback).
/// </summary>
public sealed record SwingTradingSignal(
    string SetupType, // "VCP Breakout" or "50-SMA VDU Pullback"
    string Status, // "TRIGGERED" (active pivot), "FORMING" (late consolidation / dry-up), "WATCHLIST"
    string WinningTeam, // "Tech Team Alpha (Champion)" or "Tech Team Beta"
    string Badge, // "VCP Surge" or "50-SMA VDU"
    decimal EntryPrice,
    decimal TargetPrice,
    decimal StopLossPrice,
    decimal TargetGainPercent,
    decimal StopLossPercent,
    decimal RiskRewardRatio,
    int ExpectedHoldingDays,
    decimal ConfidenceScore,
    string TimeHorizon, // "20 - 45 Trading Days (~1 - 2 Months)"
    IReadOnlyList<string> Triggers
);

/// <summary>
/// The unified "Techno-Funda" synthesis combining fundamental Margin of Safety with chart timing.
/// </summary>
public sealed record TechnoFundaResult(
    decimal MarginOfSafetyPercent,
    string TimingVerdict,
    string ActionRecommendation,
    string ActionTone, // "buy", "accumulate", "caution", "trim"
    bool IsStage2Uptrend,
    bool IsVolumeBreakout,
    decimal CurrentRsi,
    string RsiCondition,
    string MovingAverageSummary,
    decimal VolumeMultiplierVs20DayAvg,
    IReadOnlyList<DetectedPattern> Patterns,
    SwingTradingSignal? SwingSignal = null
);

/// <summary>
/// Complete bundle returned to the frontend for TradingView Lightweight Charts rendering.
/// </summary>
public sealed record StockChartData(
    string Ticker,
    string Range,
    decimal CurrentPrice,
    IReadOnlyList<CandleData> Candles,
    IReadOnlyList<TechnicalIndicatorPoint> Ema20,
    IReadOnlyList<TechnicalIndicatorPoint> Sma50,
    IReadOnlyList<TechnicalIndicatorPoint> Sma200,
    TechnoFundaResult TechnoFunda
);
