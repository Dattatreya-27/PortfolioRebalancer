using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;

namespace PortfolioRebalancer.Api.Configuration;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Core Caching
        services.AddMemoryCache();

        // Infrastructure adapters
        services.AddSingleton<IPortfolioRepository, JsonFilePortfolioRepository>();
        services.AddSingleton<IStockDataProvider, YahooFinanceLiveStockDataProvider>();
        services.AddSingleton<IStockScoringService, IndianMarketScoringService>();
        services.AddSingleton<ICatalystEventProvider, IndianCatalystEventProvider>();
        services.AddSingleton<IChartPatternRecognitionService, ChartPatternRecognitionService>();
        services.AddSingleton<IEmailNotificationService, PortfolioRebalancer.Infrastructure.Notifications.EmailNotificationService>();
        services.AddSingleton<IPriceAlertService, PortfolioRebalancer.Infrastructure.Notifications.PriceAlertService>();
        services.AddHostedService<PortfolioRebalancer.Api.Workers.MarketHoursPriceAlertWorker>();

        // Application services
        services.AddScoped<PortfolioService>();
        services.AddScoped<StockEvaluationService>();
        services.AddScoped<PortfolioDiagnosticService>();
        services.AddScoped<PortfolioAdvisoryService>();
        services.AddScoped<MarketTheoryResearchService>();
        services.AddScoped<DailyStockTradingEngine>();
        services.AddScoped<TheoryPortfolioService>();
        services.AddScoped<ITheoryPortfolioService>(sp => sp.GetRequiredService<TheoryPortfolioService>());
        services.AddScoped<PortfolioTheoryAuditService>();
        services.AddScoped<IPortfolioTheoryAuditService>(sp => sp.GetRequiredService<PortfolioTheoryAuditService>());

        return services;
    }
}
