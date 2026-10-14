using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Upcoming corporate earnings results or major national policy event (e.g., RBI MPC).
/// </summary>
public sealed record UpcomingEvent(
    Ticker? Ticker,
    string EventTitle,
    string EventType, // "Quarterly Results", "Monetary Policy", "Union Budget", "Regulatory"
    DateTime ScheduledDate,
    string ExpectedImpact // "High", "Medium", "Informational"
);
