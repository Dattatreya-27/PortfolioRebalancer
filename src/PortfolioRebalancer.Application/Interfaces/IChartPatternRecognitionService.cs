using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Service responsible for fetching historical OHLCV candlestick data and algorithmically 
/// identifying classical technical patterns, trend stages, and volume breakout triggers.
/// </summary>
public interface IChartPatternRecognitionService
{
    /// <summary>
    /// Fetches historical candlestick data, moving average lines, volume metrics,
    /// and performs pattern recognition aligned with the stock's fundamental Margin of Safety.
    /// </summary>
    Task<StockChartData> GetStockChartDataAsync(string ticker, string range = "1y", decimal? marginOfSafetyPercent = null, CancellationToken ct = default);
}
