using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Events;

/// <summary>
/// Domain event raised when the market scanner detects an extraordinary event.
/// </summary>
public sealed record MarketAlertTriggered(
    Ticker Ticker,
    string Title,
    string Message,
    AlertSeverity Severity,
    DateTime OccurredAt) : IDomainEvent;
