namespace PortfolioRebalancer.Domain.Enums;

/// <summary>
/// Severity levels for market alerts.
/// </summary>
public enum AlertSeverity
{
    /// <summary>Informational — no action required.</summary>
    Info,

    /// <summary>Warning — review recommended.</summary>
    Warning,

    /// <summary>Critical — immediate attention required.</summary>
    Critical
}
