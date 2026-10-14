using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Entity representing an equity stock with its market data.
/// Uses 'required' properties for mandatory fields and private setters for controlled mutation.
/// </summary>
public sealed class Stock
{
    public required Ticker Ticker { get; init; }
    public required string Name { get; init; }
    public required Sector Sector { get; init; }
    public Money CurrentPrice { get; private set; }
    public decimal? PERatio { get; private set; }
    public decimal? DividendYield { get; private set; }
    public decimal? MarketCap { get; private set; }
    public DateTime LastUpdated { get; private set; }

    /// <summary>
    /// Updates market data for this stock. Only this method can mutate price data,
    /// enforcing the invariant that LastUpdated is always in sync.
    /// </summary>
    public void UpdateMarketData(
        Money price,
        decimal? peRatio = null,
        decimal? dividendYield = null,
        decimal? marketCap = null)
    {
        CurrentPrice = price;
        PERatio = peRatio;
        DividendYield = dividendYield;
        MarketCap = marketCap;
        LastUpdated = DateTime.UtcNow;
    }

    public override string ToString() => $"{Ticker} ({Name}) - {CurrentPrice}";
}
