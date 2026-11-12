using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

public interface IMacroDataProvider
{
    Task<IReadOnlyList<MacroIndicator>> GetMacroIndicatorsAsync(CancellationToken ct = default);
    Task<MarketRegimeSnapshot> GetMarketRegimeAsync(CancellationToken ct = default);
}
