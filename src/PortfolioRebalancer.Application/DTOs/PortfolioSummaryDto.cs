namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// Portfolio summary — the main response for portfolio operations.
/// Flattened from domain models to avoid leaking domain internals through the API.
/// </summary>
public sealed record PortfolioSummaryDto(
    Guid Id,
    string Name,
    decimal TotalValue,
    decimal TotalInvested,
    decimal TotalUnrealizedPnL,
    decimal TotalUnrealizedPnLPercent,
    string Currency,
    IReadOnlyList<HoldingDto> Holdings,
    IReadOnlyList<SectorWeightDto> SectorWeights,
    DateTime? LastSyncedAt = null);

public sealed record HoldingDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Quantity,
    decimal BuyPrice,
    decimal Price,
    decimal InvestedValue,
    decimal MarketValue,
    decimal UnrealizedPnL,
    decimal UnrealizedPnLPercent,
    decimal WeightPercent,
    string PriceSource = "NSE_LIVE");

public sealed record SectorWeightDto(
    string Sector,
    decimal CurrentWeight,
    decimal? TargetWeight);
