using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Service responsible for dispatching email alerts and managing SMTP settings.
/// </summary>
public interface IEmailNotificationService
{
    Task<bool> SendPriceAlertEmailAsync(PriceAlert alert, decimal currentPrice, CancellationToken cancellationToken = default);
    Task<bool> SendTestEmailAsync(string recipientEmail, CancellationToken cancellationToken = default);
    Task<EmailSettings> GetEmailSettingsAsync();
    Task UpdateEmailSettingsAsync(EmailSettings settings);
}
