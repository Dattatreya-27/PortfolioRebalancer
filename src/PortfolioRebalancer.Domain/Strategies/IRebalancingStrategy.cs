using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Domain.Strategies;

/// <summary>
/// Strategy pattern interface for portfolio rebalancing algorithms.
/// Each implementation provides a different rebalancing approach.
/// </summary>
public interface IRebalancingStrategy
{
    /// <summary>Human-readable name of this strategy.</summary>
    string Name { get; }

    /// <summary>
    /// Calculates the trades needed to rebalance the portfolio.
    /// Pure function: does not mutate the portfolio.
    /// </summary>
    RebalanceResult Calculate(Portfolio portfolio);
}
