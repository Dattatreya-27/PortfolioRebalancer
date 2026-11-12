using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

public interface IPolicyIntelligenceProvider
{
    Task<IReadOnlyList<PolicyShift>> GetActivePolicyShiftsAsync(CancellationToken ct = default);
}
