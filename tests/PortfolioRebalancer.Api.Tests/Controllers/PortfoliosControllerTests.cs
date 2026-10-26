using System.Diagnostics;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using PortfolioRebalancer.Api.Controllers;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;
using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;

namespace PortfolioRebalancer.Api.Tests.Controllers;

public class PortfoliosControllerTests : IDisposable
{
    private readonly string _tempFilePath;
    private readonly JsonFilePortfolioRepository _repository;
    private readonly MockStockDataProvider _stockProvider;
    private readonly IndianMarketScoringService _scoringService;
    private readonly IndianCatalystEventProvider _eventProvider;
    private readonly ChartPatternRecognitionService _chartPatternService;
    private readonly IMemoryCache _cache;
    private readonly PortfolioService _portfolioService;
    private readonly PortfolioDiagnosticService _diagnosticService;
    private readonly PortfolioAdvisoryService _advisoryService;
    private readonly MarketTheoryResearchService _researchService;
    private readonly PortfoliosController _controller;

    public PortfoliosControllerTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"test_portfolios_{Guid.NewGuid():N}.json");
        _repository = new JsonFilePortfolioRepository(_tempFilePath);
        _stockProvider = new MockStockDataProvider();
        _scoringService = new IndianMarketScoringService();
        _eventProvider = new IndianCatalystEventProvider();
        _chartPatternService = new ChartPatternRecognitionService();
        _cache = new MemoryCache(new MemoryCacheOptions());

        _portfolioService = new PortfolioService(_repository, _stockProvider);
        _diagnosticService = new PortfolioDiagnosticService(_repository, _scoringService, _eventProvider);
        _advisoryService = new PortfolioAdvisoryService(_repository, _stockProvider);
        _researchService = new MarketTheoryResearchService(_repository, _stockProvider);
        var tradingEngine = new DailyStockTradingEngine(_repository, _scoringService);

        _controller = new PortfoliosController(
            _portfolioService,
            _diagnosticService,
            _advisoryService,
            _researchService,
            tradingEngine,
            _chartPatternService,
            _cache);

        // Seed initial test portfolio so tests have isolated fixture data
        var initial = new Portfolio { Name = "Test Fixture Portfolio" };
        var stock = new Stock
        {
            Ticker = new Ticker("INFY"),
            Name = "Infosys",
            Sector = Sector.Technology
        };
        stock.UpdateMarketData(new Money(1800m));
        initial.AddHolding(new Holding
        {
            Stock = stock,
            Quantity = 10,
            AverageBuyPrice = new Money(1600m)
        });
        _repository.SaveAsync(initial).GetAwaiter().GetResult();
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
        }
    }

    [Fact]
    public async Task GetAll_ShouldReturnOk_AndCacheSubsequentCalls()
    {
        // 1. Initial call
        var result1 = await _controller.GetAll();
        result1.Result.Should().BeOfType<OkObjectResult>();

        // 2. Cached call must be ultra-fast (sub-millisecond)
        var sw = Stopwatch.StartNew();
        var result2 = await _controller.GetAll();
        sw.Stop();

        result2.Result.Should().BeOfType<OkObjectResult>();
        sw.ElapsedMilliseconds.Should().BeLessThan(10, "cached GetAll response should return immediately");
    }

    [Fact]
    public async Task GetDiagnostics_ShouldCacheResult_AndInvalidateOnMutation()
    {
        // Create test portfolio
        var createRes = await _controller.Create(new CreatePortfolioRequest("Cache Invalidation Test Portfolio"));
        var created = (createRes.Result as CreatedAtActionResult)?.Value as PortfolioSummaryDto;
        created.Should().NotBeNull();
        var id = created!.Id;

        // Add a holding
        await _controller.AddHolding(id, new AddHoldingRequest("RELIANCE", 10, 1400m));

        // First diagnostics call (populates cache)
        var diag1 = await _controller.GetDiagnostics(id);
        diag1.Result.Should().BeOfType<OkObjectResult>();

        // Verify it is cached
        _cache.TryGetValue($"portfolio_diagnostics_{id}", out PortfolioDiagnosticsDto? cachedDiag).Should().BeTrue();
        cachedDiag.Should().NotBeNull();

        // Mutate by adding another holding (must invalidate cache)
        await _controller.AddHolding(id, new AddHoldingRequest("TCS", 5, 2600m));

        // Cache should now be cleared
        _cache.TryGetValue($"portfolio_diagnostics_{id}", out _).Should().BeFalse("mutation must invalidate cached diagnostics");

        // Clean up
        await _controller.RemoveHolding(id, "RELIANCE");
        await _controller.RemoveHolding(id, "TCS");
    }

    [Fact]
    public async Task ConcurrencyTest_MultipleClientsRequestingDiagnostics_ShouldHandleLoadWithoutErrors()
    {
        var all = await _controller.GetAll();
        var portfolios = (all.Result as OkObjectResult)?.Value as IReadOnlyList<PortfolioSummaryDto>;
        portfolios.Should().NotBeEmpty();
        var id = portfolios![0].Id;

        const int concurrency = 25;
        var tasks = Enumerable.Range(0, concurrency).Select(_ => _controller.GetDiagnostics(id));

        var results = await Task.WhenAll(tasks);
        results.Should().HaveCount(concurrency);
        results.All(r => r.Result is OkObjectResult).Should().BeTrue("all concurrent diagnostics requests must succeed");
    }
}
