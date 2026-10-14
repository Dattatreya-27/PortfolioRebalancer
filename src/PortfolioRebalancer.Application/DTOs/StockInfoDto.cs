namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// Stock information response for the stock evaluation endpoint.
/// </summary>
public sealed record StockInfoDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Price,
    string Currency,
    decimal? PERatio,
    decimal? DividendYield,
    decimal? MarketCap,
    DateTime LastUpdated);
