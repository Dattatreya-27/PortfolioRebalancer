using PortfolioRebalancer.Application.DTOs;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Service contract for auditing real portfolio holdings against academic market theories,
/// running What-If swap simulations, computing correlation matrices, and stress-testing macro shocks.
/// </summary>
public interface IPortfolioTheoryAuditService
{
    Task<PortfolioTheoryAuditSummaryDto?> AuditPortfolioAsync(Guid portfolioId, CancellationToken ct = default);
    Task<PortfolioSwapResultDto?> SimulateSwapAsync(Guid portfolioId, string exitTicker, string targetTicker, CancellationToken ct = default);
    Task<PortfolioCorrelationMatrixDto?> GetCorrelationMatrixAsync(Guid portfolioId, int topN = 10, CancellationToken ct = default);
    Task<MacroStressTestResultDto?> SimulateMacroStressTestAsync(Guid portfolioId, string scenarioKey, CancellationToken ct = default);
}
