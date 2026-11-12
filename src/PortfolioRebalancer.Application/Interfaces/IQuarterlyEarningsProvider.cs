using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

public interface IQuarterlyEarningsProvider
{
    Task<QuarterlyEarningsSummary> GetQuarterlyEarningsAsync(string ticker, CancellationToken ct = default);
    Task<IReadOnlyDictionary<string, QuarterlyEarningsSummary>> GetQuarterlyEarningsBatchAsync(IEnumerable<string> tickers, CancellationToken ct = default);
}
