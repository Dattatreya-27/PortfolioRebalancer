namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Direction condition for triggering a price alert.
/// </summary>
public enum AlertDirection
{
    CrossesAbove = 1,
    CrossesBelow = 2
}

/// <summary>
/// Status of a price alert.
/// </summary>
public enum AlertStatus
{
    Active = 1,
    Triggered = 2,
    Cancelled = 3
}

/// <summary>
/// Represents a user price alert on a specific stock ticker.
/// </summary>
public sealed class PriceAlert
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Ticker { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public decimal TargetPrice { get; set; }
    public AlertDirection Direction { get; set; } = AlertDirection.CrossesAbove;
    public decimal InitialPrice { get; set; }
    public decimal? TriggeredPrice { get; set; }
    public string RecipientEmail { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public AlertStatus Status { get; set; } = AlertStatus.Active;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? TriggeredAtUtc { get; set; }
}

/// <summary>
/// User-configurable SMTP and notification preferences.
/// </summary>
public sealed class EmailSettings
{
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SenderName { get; set; } = "Portfolio Rebalancer Alert Desk";
    public string DefaultRecipientEmail { get; set; } = string.Empty;
    public bool RunOnlyDuringMarketHours { get; set; } = true;
    public int CheckIntervalSeconds { get; set; } = 60;
    public bool IsConfigured => !string.IsNullOrWhiteSpace(SmtpHost) && 
                                !string.IsNullOrWhiteSpace(UserName) && 
                                !string.IsNullOrWhiteSpace(Password);
}

/// <summary>
/// Status report of the market hours monitor worker.
/// </summary>
public sealed record MarketHoursStatus(
    bool IsMarketOpen,
    string SessionName, // "Regular Trading Session", "Pre-Market", "Market Closed"
    string CurrentIstTime,
    int ActiveAlertsCount,
    int TriggeredAlertsCount,
    DateTime? LastCheckTimeUtc,
    string NextScheduledCheck
);
