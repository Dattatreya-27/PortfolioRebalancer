using System.Net;
using System.Net.Mail;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Infrastructure.Notifications;

public sealed class EmailNotificationService : IEmailNotificationService
{
    private readonly ILogger<EmailNotificationService> _logger;
    private readonly string _settingsFilePath;
    private readonly string _sentAlertsDirectory;
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public EmailNotificationService(ILogger<EmailNotificationService> logger)
    {
        _logger = logger;
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string dataDir = Path.Combine(baseDir, "data");
        Directory.CreateDirectory(dataDir);
        _settingsFilePath = Path.Combine(dataDir, "email_settings.json");
        _sentAlertsDirectory = Path.Combine(dataDir, "sent_alerts");
        Directory.CreateDirectory(_sentAlertsDirectory);
    }

    public async Task<EmailSettings> GetEmailSettingsAsync()
    {
        if (!File.Exists(_settingsFilePath))
        {
            return new EmailSettings();
        }

        try
        {
            string json = await File.ReadAllTextAsync(_settingsFilePath);
            return JsonSerializer.Deserialize<EmailSettings>(json, JsonOptions) ?? new EmailSettings();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read email settings from {Path}, returning defaults.", _settingsFilePath);
            return new EmailSettings();
        }
    }

    public async Task UpdateEmailSettingsAsync(EmailSettings settings)
    {
        string json = JsonSerializer.Serialize(settings, JsonOptions);
        await File.WriteAllTextAsync(_settingsFilePath, json);
        _logger.LogInformation("Email notification settings updated successfully.");
    }

    public async Task<bool> SendTestEmailAsync(string recipientEmail, CancellationToken cancellationToken = default)
    {
        var settings = await GetEmailSettingsAsync();
        string istTime = GetCurrentIstTime();

        string subject = "🧪 Portfolio Rebalancer - Test Price Alert Service";
        string htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'/>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
    .header {{ background: linear-gradient(135deg, rgba(45,212,191,0.15), rgba(52,211,153,0.15)); border-bottom: 1px solid #1e293b; padding: 24px; text-align: center; }}
    .title {{ font-size: 20px; font-weight: 800; color: #ffffff; margin: 0; }}
    .subtitle {{ font-size: 13px; color: #94a3b8; margin-top: 6px; }}
    .body {{ padding: 24px; }}
    .status-badge {{ display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: bold; background-color: rgba(52,211,153,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.3); margin-bottom: 16px; }}
    .message {{ font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }}
    .info-box {{ background-color: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; font-family: monospace; font-size: 12px; color: #94a3b8; margin-bottom: 20px; }}
    .footer {{ padding: 16px 24px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <div class='status-badge'>✓ TEST VERIFICATION PASSED</div>
      <h1 class='title'>Portfolio Rebalancer Alert Desk</h1>
      <div class='subtitle'>Indian Markets &bull; NSE Live Surveillance Engine</div>
    </div>
    <div class='body'>
      <p class='message'>
        Your price alert delivery channel is working! This test confirms that your notifications pipeline is operational and ready to dispatch market-hours price triggers.
      </p>
      <div class='info-box'>
        <div><strong>Recipient:</strong> {recipientEmail}</div>
        <div><strong>Timestamp:</strong> {istTime}</div>
        <div><strong>Engine:</strong> C# .NET 10 Institutional Rebalancer</div>
        <div><strong>Status:</strong> Connected</div>
      </div>
    </div>
    <div class='footer'>
      PortfolioRebalancer &bull; Open-Source Indian Equity Wealth Diagnostics
    </div>
  </div>
</body>
</html>";

        return await DeliverEmailAsync(settings, recipientEmail, subject, htmlBody, "TEST_VERIFICATION");
    }

    public async Task<bool> SendPriceAlertEmailAsync(PriceAlert alert, decimal currentPrice, CancellationToken cancellationToken = default)
    {
        var settings = await GetEmailSettingsAsync();
        string recipient = !string.IsNullOrWhiteSpace(alert.RecipientEmail) 
            ? alert.RecipientEmail 
            : settings.DefaultRecipientEmail;

        if (string.IsNullOrWhiteSpace(recipient))
        {
            _logger.LogWarning("No recipient email specified for price alert on {Ticker}. Skipping delivery.", alert.Ticker);
            return false;
        }

        string istTime = GetCurrentIstTime();
        bool isCrossAbove = alert.Direction == AlertDirection.CrossesAbove;
        string directionLabel = isCrossAbove ? "CROSSED ABOVE RESISTANCE" : "CROSSED BELOW SUPPORT";
        string directionIcon = isCrossAbove ? "🚀" : "🎯";
        string accentColor = isCrossAbove ? "#34d399" : "#38bdf8";
        string accentBg = isCrossAbove ? "rgba(52,211,153,0.15)" : "rgba(56,189,248,0.15)";
        string accentBorder = isCrossAbove ? "rgba(52,211,153,0.3)" : "rgba(56,189,248,0.3)";

        decimal changeFromInitial = alert.InitialPrice > 0 
            ? Math.Round(((currentPrice - alert.InitialPrice) / alert.InitialPrice) * 100m, 2) 
            : 0m;
        string changeSign = changeFromInitial >= 0 ? "+" : "";

        string subject = $"{directionIcon} PRICE ALERT: {alert.Ticker} {directionLabel} ₹{alert.TargetPrice:N2} (CMP: ₹{currentPrice:N2})";

        string htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8'/>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }}
    .container {{ max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
    .header {{ background: linear-gradient(135deg, {accentBg}, rgba(15,23,42,0.95)); border-bottom: 1px solid #1e293b; padding: 24px; text-align: left; }}
    .badge {{ display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; font-family: monospace; background-color: {accentBg}; color: {accentColor}; border: 1px solid {accentBorder}; margin-bottom: 12px; text-transform: uppercase; }}
    .ticker {{ font-size: 26px; font-weight: 900; color: #ffffff; margin: 0; font-family: monospace; letter-spacing: -0.5px; }}
    .company {{ font-size: 13px; color: #94a3b8; margin-top: 4px; }}
    .body {{ padding: 24px; }}
    .grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }}
    .card {{ background-color: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 14px; text-align: center; }}
    .label {{ font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px; }}
    .value {{ font-size: 18px; font-weight: 800; font-family: monospace; color: #ffffff; }}
    .highlight {{ color: {accentColor}; }}
    .notes-box {{ background-color: rgba(30,41,59,0.5); border-left: 3px solid {accentColor}; border-radius: 0 8px 8px 0; padding: 12px 16px; font-size: 13px; color: #cbd5e1; margin-bottom: 20px; font-style: italic; }}
    .btn {{ display: block; text-align: center; background: linear-gradient(to right, #0d9488, #14b8a6); color: #022c22 !important; font-weight: 800; font-size: 13px; padding: 12px 20px; border-radius: 10px; text-decoration: none; margin-top: 20px; }}
    .footer {{ padding: 16px 24px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #64748b; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <div class='badge'>{directionIcon} {directionLabel}</div>
      <h1 class='ticker'>{alert.Ticker}</h1>
      <div class='company'>{alert.CompanyName} &bull; National Stock Exchange of India</div>
    </div>
    <div class='body'>
      <div class='grid'>
        <div class='card'>
          <div class='label'>Current Market Price (CMP)</div>
          <div class='value highlight'>₹{currentPrice:N2}</div>
        </div>
        <div class='card'>
          <div class='label'>Alert Target Threshold</div>
          <div class='value'>₹{alert.TargetPrice:N2}</div>
        </div>
        <div class='card'>
          <div class='label'>Initial Price When Set</div>
          <div class='value'>₹{alert.InitialPrice:N2}</div>
        </div>
        <div class='card'>
          <div class='label'>Price Movement</div>
          <div class='value' style='color: {(changeFromInitial >= 0 ? "#34d399" : "#fb7185")};'>{changeSign}{changeFromInitial}%</div>
        </div>
      </div>

      {(string.IsNullOrWhiteSpace(alert.Notes) ? "" : $@"
      <div class='notes-box'>
        <strong>Your Strategy Note:</strong> ""{alert.Notes}""
      </div>")}

      <div style='font-size: 12px; color: #94a3b8; font-family: monospace; text-align: center;'>
        Triggered at: <strong>{istTime}</strong> &bull; Indian Standard Time
      </div>

      <a href='http://localhost:5200/#/discover' class='btn'>Open {alert.Ticker} in Portfolio Rebalancer &rarr;</a>
    </div>
    <div class='footer'>
      PortfolioRebalancer Price Alert Notification Service &bull; One-Shot Trigger Executed &bull; Automated Surveillance
    </div>
  </div>
</body>
</html>";

        return await DeliverEmailAsync(settings, recipient, subject, htmlBody, alert.Ticker);
    }

    private async Task<bool> DeliverEmailAsync(
        EmailSettings settings, 
        string recipient, 
        string subject, 
        string htmlBody, 
        string tag)
    {
        // 1. Always write local copy to sent_alerts for instant zero-config audit & preview
        try
        {
            string fileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{tag}.html";
            string filePath = Path.Combine(_sentAlertsDirectory, fileName);
            await File.WriteAllTextAsync(filePath, htmlBody);
            _logger.LogInformation("Wrote preview alert email to {FilePath}", filePath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not save email copy to disk.");
        }

        // 2. If SMTP is configured, transmit over wire
        if (settings.IsConfigured)
        {
            try
            {
                using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
                {
                    EnableSsl = settings.EnableSsl,
                    Credentials = new NetworkCredential(settings.UserName, settings.Password),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 10000 // 10s
                };

                string sender = !string.IsNullOrWhiteSpace(settings.SenderEmail) ? settings.SenderEmail : settings.UserName;
                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(sender, settings.SenderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true
                };

                mailMessage.To.Add(recipient);
                await client.SendMailAsync(mailMessage);
                _logger.LogInformation("Successfully dispatched price alert email via SMTP to {Recipient}", recipient);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed sending email via SMTP host {Host}:{Port} to {Recipient}. Saved local HTML preview instead.", 
                    settings.SmtpHost, settings.SmtpPort, recipient);
                return false;
            }
        }
        else
        {
            _logger.LogInformation(
                "SMTP credentials not configured yet. Alert email rendered and archived to local storage for {Recipient}.", 
                recipient);
            return true;
        }
    }

    private static string GetCurrentIstTime()
    {
        try
        {
            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
            return istNow.ToString("dd-MMM-yyyy hh:mm:ss tt") + " IST";
        }
        catch
        {
            var istNow = DateTime.UtcNow.AddHours(5).AddMinutes(30);
            return istNow.ToString("dd-MMM-yyyy hh:mm:ss tt") + " IST";
        }
    }
}
