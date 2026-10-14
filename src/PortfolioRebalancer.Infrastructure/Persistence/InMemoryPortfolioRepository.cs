using System.Collections.Concurrent;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Infrastructure.Persistence;

/// <summary>
/// In-memory portfolio repository using ConcurrentDictionary.
/// 
/// PATTERN: This is the Adapter — it implements the Application layer's port interface.
/// Registered as Singleton so data persists across HTTP requests (until app restarts).
/// Swap this for EF Core + SQLite later by changing ONE line in DI registration.
/// </summary>
public sealed class InMemoryPortfolioRepository : IPortfolioRepository
{
    private readonly ConcurrentDictionary<Guid, Portfolio> _portfolios = new();

    public Task<Portfolio?> GetByIdAsync(Guid id)
    {
        _portfolios.TryGetValue(id, out var portfolio);
        return Task.FromResult(portfolio);
    }

    public Task<IReadOnlyList<Portfolio>> GetAllAsync()
    {
        IReadOnlyList<Portfolio> list = _portfolios.Values.ToList().AsReadOnly();
        return Task.FromResult(list);
    }

    public Task SaveAsync(Portfolio portfolio)
    {
        _portfolios.AddOrUpdate(portfolio.Id, portfolio, (_, _) => portfolio);
        return Task.CompletedTask;
    }

    public Task<bool> DeleteAsync(Guid id)
    {
        return Task.FromResult(_portfolios.TryRemove(id, out _));
    }
}
