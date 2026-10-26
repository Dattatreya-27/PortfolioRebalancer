using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Service contract managing mock incubation and live tracking of the 3 academic market theories.
/// </summary>
public interface ITheoryPortfolioService
{
    Task<TheoryIncubatorDashboardDto> GetIncubatorDashboardAsync(bool forceRefresh = false, CancellationToken ct = default);
    Task<TheoryPortfolio?> GetTheoryPortfolioAsync(string strategyId, CancellationToken ct = default);
    Task<bool> AddJournalNoteAsync(string strategyId, string note, CancellationToken ct = default);
}
