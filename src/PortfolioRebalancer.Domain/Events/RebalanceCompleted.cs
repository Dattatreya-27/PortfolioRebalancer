namespace PortfolioRebalancer.Domain.Events;

/// <summary>
/// Domain event raised when a portfolio rebalancing calculation completes.
/// </summary>
public sealed record RebalanceCompleted(
    Guid PortfolioId,
    string PortfolioName,
    int TradeCount,
    DateTime OccurredAt) : IDomainEvent;
