using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PortfolioRebalancer.Application.Interfaces;

namespace PortfolioRebalancer.Api.Workers;

/// <summary>
/// Background worker that monitors stock price alerts during Indian equity market hours.
/// </summary>
public sealed class MarketHoursPriceAlertWorker : BackgroundService
{
    private readonly IPriceAlertService _priceAlertService;
    private readonly IEmailNotificationService _emailNotificationService;
    private readonly ILogger<MarketHoursPriceAlertWorker> _logger;

    public MarketHoursPriceAlertWorker(
        IPriceAlertService priceAlertService,
        IEmailNotificationService emailNotificationService,
        ILogger<MarketHoursPriceAlertWorker> logger)
    {
        _priceAlertService = priceAlertService;
        _emailNotificationService = emailNotificationService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MarketHoursPriceAlertWorker started. Initializing surveillance loop...");

        // Initial brief warm-up delay
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            int delaySeconds = 60;
            try
            {
                var settings = await _emailNotificationService.GetEmailSettingsAsync();
                delaySeconds = Math.Max(15, settings.CheckIntervalSeconds);

                var marketStatus = await _priceAlertService.GetMarketHoursStatusAsync();

                // Check whether we should evaluate alerts
                bool shouldEvaluate = !settings.RunOnlyDuringMarketHours || marketStatus.IsMarketOpen;

                if (shouldEvaluate && marketStatus.ActiveAlertsCount > 0)
                {
                    _logger.LogInformation(
                        "Surveillance tick: Evaluating {ActiveCount} active alerts ({Session}, {Time})...",
                        marketStatus.ActiveAlertsCount, marketStatus.SessionName, marketStatus.CurrentIstTime);

                    int triggered = await _priceAlertService.EvaluateAlertsAsync(stoppingToken);
                    if (triggered > 0)
                    {
                        _logger.LogInformation("Surveillance tick completed: {Triggered} alert(s) triggered and dispatched.", triggered);
                    }
                }
                else if (marketStatus.ActiveAlertsCount > 0 && !marketStatus.IsMarketOpen)
                {
                    _logger.LogDebug(
                        "Market currently closed ({Session}). Next scheduled check: {Next}",
                        marketStatus.SessionName, marketStatus.NextScheduledCheck);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in MarketHoursPriceAlertWorker surveillance loop.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(delaySeconds), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }

        _logger.LogInformation("MarketHoursPriceAlertWorker shutting down.");
    }
}
