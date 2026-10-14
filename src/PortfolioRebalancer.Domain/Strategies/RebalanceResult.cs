using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Strategies;

/// <summary>
/// The output of a rebalancing calculation — contains trade recommendations and drift analysis.
/// </summary>
public sealed record RebalanceResult(
    IReadOnlyList<TradeRecommendation> Trades,
    IReadOnlyList<SectorDrift> SectorDrifts,
    Money EstimatedTotalValue);

/// <summary>
/// A recommended trade to bring a holding closer to its target allocation.
/// </summary>
public sealed record TradeRecommendation(
    Ticker Ticker,
    string StockName,
    Sector Sector,
    decimal CurrentQuantity,
    decimal TargetQuantity,
    decimal DeltaQuantity,
    Money CurrentValue,
    Money TargetValue)
{
    public bool IsBuy => DeltaQuantity > 0;
    public bool IsSell => DeltaQuantity < 0;
    public bool IsHold => DeltaQuantity == 0;
    public string Action => IsBuy ? "BUY" : IsSell ? "SELL" : "HOLD";
}

/// <summary>
/// Measures how far a sector's current weight has drifted from its target.
/// </summary>
public sealed record SectorDrift(
    Sector Sector,
    Percentage CurrentWeight,
    Percentage TargetWeight,
    decimal DriftPercentagePoints)
{
    public bool IsOverweight => DriftPercentagePoints > 0;
    public bool IsUnderweight => DriftPercentagePoints < 0;
}
