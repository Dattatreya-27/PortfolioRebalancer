using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Port interface for calculating multi-factor stock scores and policy alignment.
/// </summary>
public interface IStockScoringService
{
    StockScore CalculateScore(Stock stock);
}

/// <summary>
/// Port interface for retrieving national economic policy calendars and company results dates.
/// </summary>
public interface ICatalystEventProvider
{
    Task<IReadOnlyList<UpcomingEvent>> GetUpcomingEventsAsync(IEnumerable<string> tickers);
}
