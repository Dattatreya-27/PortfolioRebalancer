using System.Diagnostics;
using FluentAssertions;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;
using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;

namespace PortfolioRebalancer.Application.Tests.Services;

public class PortfolioLoadingPerformanceTests : IDisposable
{
    private readonly string _tempFilePath;
    private readonly JsonFilePortfolioRepository _repository;
    private readonly MockStockDataProvider _stockProvider;
    private readonly IndianMarketScoringService _scoringService;
    private readonly IndianCatalystEventProvider _eventProvider;
    private readonly PortfolioService _portfolioService;
    private readonly PortfolioDiagnosticService _diagnosticService;

    public PortfolioLoadingPerformanceTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"test_portfolios_{Guid.NewGuid():N}.json");
        _repository = new JsonFilePortfolioRepository(_tempFilePath);
        _stockProvider = new MockStockDataProvider();
        _scoringService = new IndianMarketScoringService();
        _eventProvider = new IndianCatalystEventProvider();
        _portfolioService = new PortfolioService(_repository, _stockProvider);
        _diagnosticService = new PortfolioDiagnosticService(_repository, _scoringService, _eventProvider);

        var baseline = new Portfolio { Name = "Baseline Test Portfolio" };
        var stock = new Stock
        {
            Ticker = new Ticker("INFY"),
            Name = "Infosys",
            Sector = Sector.Technology
        };
        stock.UpdateMarketData(new Money(1800m));
        baseline.AddHolding(new Holding
        {
            Stock = stock,
            Quantity = 10,
            AverageBuyPrice = new Money(1600m)
        });
        _repository.SaveAsync(baseline).GetAwaiter().GetResult();
    }

    public void Dispose()
    {
        try
        {
            if (File.Exists(_tempFilePath))
                File.Delete(_tempFilePath);
        }
        catch
        {
            // Ignore cleanup failures
        }
    }

    [Fact]
    public async Task GetAllPortfolios_ShouldLoadFast_WithoutErrors()
    {
        var sw = Stopwatch.StartNew();
        var portfolios = await _portfolioService.GetAllPortfoliosAsync();
        sw.Stop();

        portfolios.Should().NotBeNull();
        sw.ElapsedMilliseconds.Should().BeLessThan(200, "loading all portfolios must be fast and sub-200ms");
    }

    [Fact]
    public async Task LoadLargePortfolio_Diagnostics_ShouldCompleteUnder100ms_WithoutBottlenecks()
    {
        // 1. Setup a portfolio with 105 real-world holdings
        var portfolio = new Portfolio { Name = "Performance Stress Test Portfolio" };
        var sectors = Enum.GetValues<Sector>();

        for (int i = 1; i <= 105; i++)
        {
            var sector = sectors[i % sectors.Length];
            var ticker = new Ticker($"SYM{i:D3}");
            var qty = i * 10; // Whole shares only
            var buyPrice = new Money(100m + (i * 2.5m));
            var currentPrice = new Money(90m + (i * 3.0m));

            var stock = new Stock
            {
                Ticker = ticker,
                Name = $"Company {i}",
                Sector = sector
            };
            stock.UpdateMarketData(currentPrice);

            var holding = new Holding
            {
                Stock = stock,
                Quantity = qty,
                AverageBuyPrice = buyPrice
            };
            portfolio.AddHolding(holding);
        }

        await _repository.SaveAsync(portfolio);

        // 2. Measure diagnostic engine computation under load
        var sw = Stopwatch.StartNew();
        var diagnostics = await _diagnosticService.RunDiagnosticsAsync(portfolio.Id);
        sw.Stop();

        diagnostics.Should().NotBeNull();
        diagnostics!.PortfolioId.Should().Be(portfolio.Id);
        diagnostics.Concentration.Should().NotBeNull();
        diagnostics.ThesisAudit.Should().HaveCount(105);

        // High-performance threshold check: 105 holdings diagnostics should run in under 100ms
        sw.ElapsedMilliseconds.Should().BeLessThan(100, "diagnostic audit for 105 holdings must compute under 100ms");
    }

    [Fact]
    public async Task ConcurrentPortfolioLoading_ShouldBeThreadSafe_WithZeroFailures()
    {
        var portfolios = await _portfolioService.GetAllPortfoliosAsync();
        portfolios.Should().NotBeEmpty();
        var targetId = portfolios[0].Id;

        const int concurrency = 50;
        var sw = Stopwatch.StartNew();

        var tasks = Enumerable.Range(0, concurrency).Select(async _ =>
        {
            var p = await _portfolioService.GetPortfolioAsync(targetId);
            var d = await _diagnosticService.RunDiagnosticsAsync(targetId);
            return (Portfolio: p, Diagnostics: d);
        });

        var results = await Task.WhenAll(tasks);
        sw.Stop();

        results.Should().HaveCount(concurrency);
        results.All(r => r.Portfolio != null && r.Diagnostics != null).Should().BeTrue();
        sw.ElapsedMilliseconds.Should().BeLessThan(2000, "50 concurrent loading operations should finish within 2 seconds");
    }

    [Fact]
    public async Task HoldingsQuantities_ShouldNeverContainFractions()
    {
        var portfolios = await _portfolioService.GetAllPortfoliosAsync();
        foreach (var p in portfolios)
        {
            var full = await _portfolioService.GetPortfolioAsync(p.Id);
            if (full?.Holdings == null) continue;

            foreach (var h in full.Holdings)
            {
                (h.Quantity % 1).Should().Be(0, $"Holding {h.Ticker} quantity must be a whole number of shares, found: {h.Quantity}");
            }
        }
    }
}
