namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// Rebalance recommendation response — trade list and sector drifts.
/// </summary>
public sealed record RebalanceRecommendationDto(
    decimal TotalValue,
    IReadOnlyList<TradeRecommendationDto> Trades,
    IReadOnlyList<SectorDriftDto> SectorDrifts);

public sealed record TradeRecommendationDto(
    string Ticker,
    string StockName,
    string Sector,
    string Action,
    decimal CurrentQuantity,
    decimal TargetQuantity,
    decimal DeltaQuantity,
    decimal CurrentValue,
    decimal TargetValue);

public sealed record SectorDriftDto(
    string Sector,
    decimal CurrentWeight,
    decimal TargetWeight,
    decimal DriftPercentagePoints,
    string Direction);
