using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Diagnostic report assessing portfolio health, concentration constraints, and overall policy alignment.
/// </summary>
public sealed record PortfolioDiagnostics(
    decimal HealthScore,                       // 0 - 100 aggregate score
    string HealthRating,                       // "Excellent", "Good", "Needs Attention", "High Risk"
    IReadOnlyList<ConstraintViolation> Violations, // Any single-stock (>15%) or sector (>30%) breach
    IReadOnlyList<string> StrategicRecommendations, // Actionable improvements
    IReadOnlyList<UpcomingEvent> RelevantUpcomingEvents // Results & Policy events for holdings
);

public sealed record ConstraintViolation(
    string RuleName,
    string Target,        // Ticker or Sector name
    decimal CurrentValue, // Actual percentage
    decimal AllowedLimit, // Threshold (e.g. 15% or 30%)
    string Severity       // "Warning", "Critical"
);
