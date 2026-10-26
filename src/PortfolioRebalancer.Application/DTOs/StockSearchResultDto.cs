namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// Instant stock search autocomplete recommendation item.
/// </summary>
public sealed record StockSearchResultDto(
    string Ticker,
    string Name,
    string Sector,
    decimal CurrentPrice,
    decimal? PERatio,
    decimal? MarketCap,
    bool IsHeld,
    decimal? QuantityHeld,
    decimal? UnrealizedPnLPercent
);
