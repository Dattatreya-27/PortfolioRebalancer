using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Service responsible for managing and evaluating stock price alerts.
/// </summary>
public interface IPriceAlertService
{
    Task<IReadOnlyList<PriceAlert>> GetAllAlertsAsync();
    Task<PriceAlert?> GetAlertByIdAsync(string alertId);
    Task<PriceAlert> CreateAlertAsync(string ticker, decimal targetPrice, AlertDirection direction, string recipientEmail, string? notes = null);
    Task<bool> DeleteAlertAsync(string alertId);
    Task<bool> ToggleAlertStatusAsync(string alertId, bool isActive);
    Task<int> EvaluateAlertsAsync(CancellationToken cancellationToken = default);
    Task<MarketHoursStatus> GetMarketHoursStatusAsync();
}
