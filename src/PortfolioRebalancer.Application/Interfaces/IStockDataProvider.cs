using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Port interface for fetching stock market data.
/// Adapters (Yahoo Finance, Alpha Vantage, Mock) implement this contract.
/// </summary>
public interface IStockDataProvider
{
    Task<Stock?> GetStockAsync(string ticker);
    Task<IReadOnlyList<Stock>> GetStocksAsync(IEnumerable<string> tickers);
}
