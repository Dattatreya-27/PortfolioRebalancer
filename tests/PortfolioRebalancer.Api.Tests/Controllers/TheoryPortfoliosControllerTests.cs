using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using PortfolioRebalancer.Api.Controllers;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;

namespace PortfolioRebalancer.Api.Tests.Controllers;

public class TheoryPortfoliosControllerTests : IDisposable
{
    private readonly string _tempFilePath;
    private readonly string _tempRepoPath;
    private readonly JsonFilePortfolioRepository _repository;
    private readonly MockStockDataProvider _stockProvider;
    private readonly IndianMarketScoringService _scoringService;
    private readonly TheoryPortfolioService _service;
    private readonly PortfolioTheoryAuditService _auditService;
    private readonly TheoryPortfoliosController _controller;

    public TheoryPortfoliosControllerTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"test_ctrl_theory_portfolios_{Guid.NewGuid():N}.json");
        _tempRepoPath = Path.Combine(Path.GetTempPath(), $"test_ctrl_portfolios_{Guid.NewGuid():N}.json");
        _repository = new JsonFilePortfolioRepository(_tempRepoPath);
        _stockProvider = new MockStockDataProvider();
        _scoringService = new IndianMarketScoringService();
        _service = new TheoryPortfolioService(_stockProvider, _tempFilePath);
        _auditService = new PortfolioTheoryAuditService(_repository, _scoringService);
        _controller = new TheoryPortfoliosController(_service, _auditService);
    }

    public void Dispose()
    {
        if (File.Exists(_tempFilePath))
        {
            try { File.Delete(_tempFilePath); } catch { }
        }
        if (File.Exists(_tempRepoPath))
        {
            try { File.Delete(_tempRepoPath); } catch { }
        }
    }

    [Fact]
    public async Task GetDashboard_ReturnsOkWithThreeTheories()
    {
        // Act
        var result = await _controller.GetDashboard();

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var dashboard = okResult!.Value as TheoryIncubatorDashboardDto;
        dashboard.Should().NotBeNull();
        dashboard!.Portfolios.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetStrategy_ExistingId_ReturnsOk()
    {
        // Act
        var result = await _controller.GetStrategy("MAGIC_FORMULA");

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var portfolio = okResult!.Value as TheoryPortfolio;
        portfolio.Should().NotBeNull();
        portfolio!.StrategyId.Should().Be("MAGIC_FORMULA");
    }

    [Fact]
    public async Task GetStrategy_NonExistingId_ReturnsNotFound()
    {
        // Act
        var result = await _controller.GetStrategy("NON_EXISTING");

        // Assert
        var notFound = result.Result as NotFoundObjectResult;
        notFound.Should().NotBeNull();
    }

    [Fact]
    public async Task AddJournalNote_ValidNote_ReturnsOk()
    {
        // Act
        var result = await _controller.AddJournalNote("GRAHAM_PIOTROSKI_VALUE", new TheoryPortfoliosController.AddJournalNoteRequest("Test observation"));

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
    }

    [Fact]
    public async Task AuditPortfolio_PortfolioExists_ReturnsOk()
    {
        // Arrange
        var p = new Portfolio { Name = "Audit Test Port" };
        await _repository.SaveAsync(p);

        // Act
        var result = await _controller.AuditPortfolio(p.Id);

        // Assert
        var okResult = result.Result as OkObjectResult;
        okResult.Should().NotBeNull();
        var audit = okResult!.Value as PortfolioTheoryAuditSummaryDto;
        audit.Should().NotBeNull();
        audit!.PortfolioId.Should().Be(p.Id);
    }

    [Fact]
    public async Task AuditPortfolio_PortfolioDoesNotExist_ReturnsNotFound()
    {
        // Act
        var result = await _controller.AuditPortfolio(Guid.NewGuid());

        // Assert
        var notFound = result.Result as NotFoundObjectResult;
        notFound.Should().NotBeNull();
    }

    [Fact]
    public async Task SimulateSwap_InvalidPayload_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.SimulateSwap(new PortfolioSwapRequestDto(Guid.NewGuid(), "", ""));

        // Assert
        var badRequest = result.Result as BadRequestObjectResult;
        badRequest.Should().NotBeNull();
    }

    [Fact]
    public async Task GetCorrelationMatrix_NonExistentPortfolio_ReturnsNotFound()
    {
        // Act
        var result = await _controller.GetCorrelationMatrix(Guid.NewGuid());

        // Assert
        var notFound = result.Result as NotFoundObjectResult;
        notFound.Should().NotBeNull();
    }

    [Fact]
    public async Task GetMacroStressTest_NonExistentPortfolio_ReturnsNotFound()
    {
        // Act
        var result = await _controller.GetMacroStressTest(Guid.NewGuid());

        // Assert
        var notFound = result.Result as NotFoundObjectResult;
        notFound.Should().NotBeNull();
    }
}
