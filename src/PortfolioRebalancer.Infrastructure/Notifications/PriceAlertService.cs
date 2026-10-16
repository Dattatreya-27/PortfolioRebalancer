using System.Text.Json;
using Microsoft.Extensions.Logging;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Infrastructure.Notifications;

public sealed class PriceAlertService : IPriceAlertService
{
    private readonly IStockDataProvider _stockDataProvider;
    private readonly IEmailNotificationService _emailNotificationService;
    private readonly ILogger<PriceAlertService> _logger;
    private readonly string _alertsFilePath;
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };
    private readonly SemaphoreSlim _lock = new(1, 1);
    private DateTime? _lastCheckTimeUtc;

    public PriceAlertService(
        IStockDataProvider stockDataProvider,
        IEmailNotificationService emailNotificationService,
        ILogger<PriceAlertService> logger)
    {
        _stockDataProvider = stockDataProvider;
        _emailNotificationService = emailNotificationService;
        _logger = logger;

        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string dataDir = Path.Combine(baseDir, "data");
        Directory.CreateDirectory(dataDir);
        _alertsFilePath = Path.Combine(dataDir, "price_alerts.json");
    }

    public async Task<IReadOnlyList<PriceAlert>> GetAllAlertsAsync()
    {
        await _lock.WaitAsync();
        try
        {
            return await LoadAlertsInternalAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<PriceAlert?> GetAlertByIdAsync(string alertId)
    {
        var alerts = await GetAllAlertsAsync();
        return alerts.FirstOrDefault(a => a.Id == alertId);
    }

    public async Task<PriceAlert> CreateAlertAsync(
        string ticker, 
        decimal targetPrice, 
        AlertDirection direction, 
        string recipientEmail, 
        string? notes = null)
    {
        string cleanTicker = ticker.Trim().ToUpperInvariant();
        var stock = await _stockDataProvider.GetStockAsync(cleanTicker);
        decimal currentPrice = stock?.CurrentPrice.Amount ?? targetPrice;
        string companyName = stock?.Name ?? cleanTicker;

        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            var settings = await _emailNotificationService.GetEmailSettingsAsync();
            recipientEmail = settings.DefaultRecipientEmail;
        }

        var newAlert = new PriceAlert
        {
            Id = Guid.NewGuid().ToString("N"),
            Ticker = cleanTicker,
            CompanyName = companyName,
            TargetPrice = targetPrice,
            Direction = direction,
            InitialPrice = currentPrice,
            RecipientEmail = recipientEmail,
            Notes = notes,
            Status = AlertStatus.Active,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _lock.WaitAsync();
        try
        {
            var list = await LoadAlertsInternalAsync();
            list.Add(newAlert);
            await SaveAlertsInternalAsync(list);
            _logger.LogInformation(
                "Created price alert for {Ticker} target ₹{Target} ({Direction}) for {Email}", 
                newAlert.Ticker, newAlert.TargetPrice, newAlert.Direction, newAlert.RecipientEmail);
            return newAlert;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteAlertAsync(string alertId)
    {
        await _lock.WaitAsync();
        try
        {
            var list = await LoadAlertsInternalAsync();
            int removed = list.RemoveAll(a => a.Id == alertId);
            if (removed > 0)
            {
                await SaveAlertsInternalAsync(list);
                _logger.LogInformation("Deleted price alert {AlertId}", alertId);
                return true;
            }
            return false;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> ToggleAlertStatusAsync(string alertId, bool isActive)
    {
        await _lock.WaitAsync();
        try
        {
            var list = await LoadAlertsInternalAsync();
            var alert = list.FirstOrDefault(a => a.Id == alertId);
            if (alert == null) return false;

            alert.Status = isActive ? AlertStatus.Active : AlertStatus.Cancelled;
            if (isActive)
            {
                alert.TriggeredAtUtc = null;
                alert.TriggeredPrice = null;
            }

            await SaveAlertsInternalAsync(list);
            _logger.LogInformation("Toggled alert {AlertId} status to {Status}", alertId, alert.Status);
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<int> EvaluateAlertsAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        int triggeredCount = 0;
        try
        {
            _lastCheckTimeUtc = DateTime.UtcNow;
            var list = await LoadAlertsInternalAsync();
            var activeAlerts = list.Where(a => a.Status == AlertStatus.Active).ToList();

            if (activeAlerts.Count == 0)
            {
                return 0;
            }

            var tickers = activeAlerts.Select(a => a.Ticker).Distinct().ToList();
            var priceMap = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

            foreach (var ticker in tickers)
            {
                try
                {
                    var stock = await _stockDataProvider.GetStockAsync(ticker);
                    if (stock != null)
                    {
                        priceMap[ticker] = stock.CurrentPrice.Amount;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to retrieve CMP for alert evaluation of {Ticker}", ticker);
                }
            }

            bool hasChanges = false;
            foreach (var alert in activeAlerts)
            {
                if (!priceMap.TryGetValue(alert.Ticker, out decimal cmp) || cmp <= 0)
                {
                    continue;
                }

                bool triggered = false;
                if (alert.Direction == AlertDirection.CrossesAbove && cmp >= alert.TargetPrice)
                {
                    triggered = true;
                }
                else if (alert.Direction == AlertDirection.CrossesBelow && cmp <= alert.TargetPrice)
                {
                    triggered = true;
                }

                if (triggered)
                {
                    alert.Status = AlertStatus.Triggered;
                    alert.TriggeredPrice = cmp;
                    alert.TriggeredAtUtc = DateTime.UtcNow;
                    hasChanges = true;
                    triggeredCount++;

                    _logger.LogInformation(
                        "PRICE ALERT TRIGGERED: {Ticker} hit ₹{Cmp} (Target: ₹{Target}, {Direction})",
                        alert.Ticker, cmp, alert.TargetPrice, alert.Direction);

                    // Dispatch notification
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _emailNotificationService.SendPriceAlertEmailAsync(alert, cmp, CancellationToken.None);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to send price alert email for {Ticker}", alert.Ticker);
                        }
                    }, cancellationToken);
                }
            }

            if (hasChanges)
            {
                await SaveAlertsInternalAsync(list);
            }

            return triggeredCount;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<MarketHoursStatus> GetMarketHoursStatusAsync()
    {
        DateTime istNow;
        try
        {
            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);
        }
        catch
        {
            istNow = DateTime.UtcNow.AddHours(5).AddMinutes(30);
        }

        bool isWeekday = istNow.DayOfWeek >= DayOfWeek.Monday && istNow.DayOfWeek <= DayOfWeek.Friday;
        var timeOfDay = istNow.TimeOfDay;

        var preMarketStart = new TimeSpan(9, 0, 0);
        var marketOpen = new TimeSpan(9, 15, 0);
        var marketClose = new TimeSpan(15, 30, 0);

        bool isMarketOpen = isWeekday && timeOfDay >= marketOpen && timeOfDay <= marketClose;
        string sessionName;

        if (!isWeekday)
        {
            sessionName = "Market Closed (Weekend)";
        }
        else if (timeOfDay < preMarketStart)
        {
            sessionName = "Pre-Market Awaiting (Opens 09:15 IST)";
        }
        else if (timeOfDay >= preMarketStart && timeOfDay < marketOpen)
        {
            sessionName = "Pre-Market Call Auction (09:00 - 09:15 IST)";
        }
        else if (isMarketOpen)
        {
            sessionName = "Live Trading Session (NSE/BSE Active)";
        }
        else
        {
            sessionName = "Market Closed (Reopens Next Trading Day 09:15 IST)";
        }

        var alerts = await GetAllAlertsAsync();
        int active = alerts.Count(a => a.Status == AlertStatus.Active);
        int triggered = alerts.Count(a => a.Status == AlertStatus.Triggered);

        string nextCheck = isMarketOpen 
            ? "Every 60s during trading hours" 
            : "Next trading day at 09:15 IST (or on manual evaluation)";

        return new MarketHoursStatus(
            IsMarketOpen: isMarketOpen,
            SessionName: sessionName,
            CurrentIstTime: istNow.ToString("dd-MMM-yyyy hh:mm:ss tt") + " IST",
            ActiveAlertsCount: active,
            TriggeredAlertsCount: triggered,
            LastCheckTimeUtc: _lastCheckTimeUtc,
            NextScheduledCheck: nextCheck
        );
    }

    private async Task<List<PriceAlert>> LoadAlertsInternalAsync()
    {
        if (!File.Exists(_alertsFilePath))
        {
            return new List<PriceAlert>();
        }

        try
        {
            string json = await File.ReadAllTextAsync(_alertsFilePath);
            return JsonSerializer.Deserialize<List<PriceAlert>>(json, JsonOptions) ?? new List<PriceAlert>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed reading price alerts from {Path}", _alertsFilePath);
            return new List<PriceAlert>();
        }
    }

    private async Task SaveAlertsInternalAsync(List<PriceAlert> list)
    {
        string json = JsonSerializer.Serialize(list, JsonOptions);
        await File.WriteAllTextAsync(_alertsFilePath, json);
    }
}
