using FluentAssertions;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;
using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;

namespace PortfolioRebalancer.Application.Tests.Services;

public class PortfolioTheoryAuditServiceTests : IDisposable
{
    private readonly string _tempFilePath;
    private readonly JsonFilePortfolioRepository _repository;
    private readonly IndianMarketScoringService _scoringService;
    private readonly PortfolioTheoryAuditService _auditService;

    public PortfolioTheoryAuditServiceTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"test_audit_portfolios_{Guid.NewGuid():N}.json");
        _repository = new JsonFilePortfolioRepository(_tempFilePath);
        _scoringService = new IndianMarketScoringService();
        _auditService = new PortfolioTheoryAuditService(_repository, _scoringService);
    }

    public void Dispose()
    {
        if (File.Exists(_tempFilePath))
        {
            try { File.Delete(_tempFilePath); } catch { }
        }
    }

    private static Stock CreateStock(string ticker, string name, Sector sector, decimal price)
    {
        var stock = new Stock
        {
            Ticker = new Ticker(ticker),
            Name = name,
            Sector = sector
        };
        stock.UpdateMarketData(Money.INR(price));
        return stock;
    }

    [Fact]
    public async Task AuditPortfolioAsync_ValidPortfolio_ReturnsCategorizedAuditSummary()
    {
        // Arrange: Create portfolio with 3 distinct holding types
        var portfolio = new Portfolio { Name = "Test Audit Portfolio" };

        // 1. High Quality Champion candidate (TCS)
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("TCS", "Tata Consultancy Services", Sector.Technology, 3200m),
            Quantity = 20,
            AverageBuyPrice = Money.INR(3100m)
        });

        // 2. High Momentum / Growth candidate (TRENT)
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("TRENT", "Trent Ltd", Sector.ConsumerDiscretionary, 3200m),
            Quantity = 15,
            AverageBuyPrice = Money.INR(2900m)
        });

        // 3. Stressed / Toxic candidate
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("AJRINFRA", "AJR Infra & Tolling", Sector.Industrials, 2.50m),
            Quantity = 500,
            AverageBuyPrice = Money.INR(5.00m)
        });

        await _repository.SaveAsync(portfolio);

        // Act
        var result = await _auditService.AuditPortfolioAsync(portfolio.Id);

        // Assert
        result.Should().NotBeNull();
        result!.TotalHoldingsCount.Should().Be(3);
        result.TotalPortfolioValue.Should().BeGreaterThan(0);
        result.ExecutiveVerdict.Should().Contain("holdings");
        result.Holdings.Should().HaveCount(3);

        // Verify that holdings have valid classifications and recommendations
        foreach (var item in result.Holdings)
        {
            item.Classification.Should().BeOneOf(TheoryAuditCategory.TheoryChampion, TheoryAuditCategory.NearMiss, TheoryAuditCategory.ToxicLaggard);
            item.PlainEnglishReason.Should().NotBeNullOrWhiteSpace();
            item.RecommendedAction.Should().NotBeNullOrWhiteSpace();
            item.SuggestedTheoryReplacement.Should().NotBeNullOrWhiteSpace();
        }

        // Sum of categories should equal total holdings
        (result.ChampionsCount + result.NearMissCount + result.ToxicCount).Should().Be(3);
    }

    [Fact]
    public async Task AuditPortfolioAsync_NonExistentPortfolio_ReturnsNull()
    {
        // Act
        var result = await _auditService.AuditPortfolioAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task SimulateSwapAsync_ValidExitAndTarget_CalculatesPreciseDeltasAndVerdict()
    {
        // Arrange
        var portfolio = new Portfolio { Name = "Swap Test Port" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("WIPRO", "Wipro Ltd", Sector.Technology, 450m),
            Quantity = 100, // 45,000 INR
            AverageBuyPrice = Money.INR(500m)
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("INFY", "Infosys Ltd", Sector.Technology, 1500m),
            Quantity = 30, // 45,000 INR
            AverageBuyPrice = Money.INR(1400m)
        });
        await _repository.SaveAsync(portfolio);

        // Act: Swap WIPRO for BEL (Bharat Electronics, Industrials)
        var result = await _auditService.SimulateSwapAsync(portfolio.Id, "WIPRO", "BEL");

        // Assert
        result.Should().NotBeNull();
        result!.ExitTicker.Should().Be("WIPRO");
        result.TargetTicker.Should().Be("BEL");
        result.ReleasedCapital.Should().Be(45000m);
        result.AcquiredShares.Should().BeGreaterThan(0);
        result.QuantVerdict.Should().NotBeNullOrWhiteSpace();
        result.KeyBenefits.Should().NotBeEmpty();
        result.TargetSector.Should().Be("Industrials");
        result.ExitSector.Should().Be("Technology");
        result.ExitSectorAfterWeight.Should().BeLessThan(result.ExitSectorBeforeWeight);
    }

    [Fact]
    public async Task SimulateSwapAsync_ExitTickerNotFound_ReturnsNull()
    {
        // Arrange
        var portfolio = new Portfolio { Name = "Swap Port" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("TCS", "TCS", Sector.Technology, 3200m),
            Quantity = 10
        });
        await _repository.SaveAsync(portfolio);

        // Act
        var result = await _auditService.SimulateSwapAsync(portfolio.Id, "NON_EXISTING", "BEL");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetCorrelationMatrixAsync_CalculatesMatrixAndDiversificationRatio()
    {
        // Arrange
        var portfolio = new Portfolio { Name = "Correlation Test Port" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("TCS", "Tata Consultancy Services", Sector.Technology, 3200m),
            Quantity = 20
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("HDFCBANK", "HDFC Bank Ltd", Sector.Financials, 1600m),
            Quantity = 40
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("ONGC", "Oil & Natural Gas Corp", Sector.Energy, 240m),
            Quantity = 250
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("LT", "Larsen & Toubro", Sector.Industrials, 3400m),
            Quantity = 20
        });
        await _repository.SaveAsync(portfolio);

        // Act
        var result = await _auditService.GetCorrelationMatrixAsync(portfolio.Id, topN: 10);

        // Assert
        result.Should().NotBeNull();
        result!.Tickers.Should().HaveCount(4);
        result.Matrix.Length.Should().Be(4);
        result.DiversificationRatio.Should().BeGreaterThan(1.0m);
        result.DiversificationRating.Should().NotBeNullOrWhiteSpace();
        result.InstitutionalCommentary.Should().NotBeNullOrWhiteSpace();

        // Diagonal elements must be 1.0
        for (int i = 0; i < 4; i++)
        {
            result.Matrix[i][i].Should().Be(1.00);
        }
    }

    [Fact]
    public async Task SimulateMacroStressTestAsync_CrudeSurge_IdentifiesBeneficiariesAndSqueezedHoldings()
    {
        // Arrange
        var portfolio = new Portfolio { Name = "Macro Stress Port" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("ONGC", "Oil and Natural Gas Corp", Sector.Energy, 240m),
            Quantity = 500
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("ASIANPAINT", "Asian Paints Ltd", Sector.Materials, 2800m),
            Quantity = 40
        });
        await _repository.SaveAsync(portfolio);

        // Act
        var result = await _auditService.SimulateMacroStressTestAsync(portfolio.Id, "crude_surge");

        // Assert
        result.Should().NotBeNull();
        result!.ScenarioKey.Should().Be("crude_surge");
        result.MacroTrigger.Should().NotBeNullOrWhiteSpace();
        result.Beneficiaries.Should().Contain(b => b.Ticker == "ONGC");
        result.SqueezedHoldings.Should().Contain(s => s.Ticker == "ASIANPAINT");
        result.DefensiveActionRecommendation.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task SimulateMacroStressTestAsync_InrDepreciation_BenefitsITExporters()
    {
        // Arrange
        var portfolio = new Portfolio { Name = "FX Port" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("TCS", "Tata Consultancy Services", Sector.Technology, 3200m),
            Quantity = 30
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("MARUTI", "Maruti Suzuki", Sector.ConsumerDiscretionary, 11000m),
            Quantity = 10
        });
        await _repository.SaveAsync(portfolio);

        // Act
        var result = await _auditService.SimulateMacroStressTestAsync(portfolio.Id, "inr_depreciation");

        // Assert
        result.Should().NotBeNull();
        result!.Beneficiaries.Should().Contain(b => b.Ticker == "TCS");
        result.SqueezedHoldings.Should().Contain(s => s.Ticker == "MARUTI");
    }
}
