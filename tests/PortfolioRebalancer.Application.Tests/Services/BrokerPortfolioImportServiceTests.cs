using System.Text;
using FluentAssertions;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;
using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;

namespace PortfolioRebalancer.Application.Tests.Services;

public class BrokerPortfolioImportServiceTests : IDisposable
{
    private readonly string _tempFilePath;
    private readonly JsonFilePortfolioRepository _repository;
    private readonly MockStockDataProvider _stockProvider;
    private readonly PortfolioService _portfolioService;

    public BrokerPortfolioImportServiceTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"test_broker_import_{Guid.NewGuid():N}.json");
        _repository = new JsonFilePortfolioRepository(_tempFilePath);
        _stockProvider = new MockStockDataProvider();
        _portfolioService = new PortfolioService(_repository, _stockProvider);
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
    public async Task ImportBrokerHoldingsAsync_MergeMode_RecalculatesWeightedAverageBuyPrice()
    {
        // Arrange: Existing portfolio with 10 shares of INFY @ 1000 and 15 shares of TCS @ 3000
        var portfolio = new Portfolio { Name = "Main Investment Portfolio" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("INFY", "Infosys", Sector.Technology, 1500m),
            Quantity = 10,
            AverageBuyPrice = Money.INR(1000m)
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("TCS", "Tata Consultancy", Sector.Technology, 3500m),
            Quantity = 15,
            AverageBuyPrice = Money.INR(3000m)
        });
        await _repository.SaveAsync(portfolio);

        // Zerodha CSV with 10 shares of INFY @ 1200 (should merge to 20 @ 1100) and 30 shares of BEL @ 300 (new holding)
        var csv = """
            Instrument,Qty.,Avg. cost,LTP
            INFY,10,1200.00,1500.00
            BEL,30,300.00,335.00
            """;
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        // Act
        var result = await _portfolioService.ImportBrokerHoldingsAsync(
            portfolio.Id,
            stream,
            "zerodha_kite.csv",
            BrokerImportMode.Merge);

        // Assert
        result.Should().NotBeNull();
        result!.ModeUsed.Should().Be(BrokerImportMode.Merge);
        result.MergedPositionsCount.Should().Be(1);
        result.NewPositionsCount.Should().Be(1);

        // Verify target portfolio holds 3 stocks: INFY (merged), TCS (retained), BEL (added)
        var updatedPort = await _repository.GetByIdAsync(portfolio.Id);
        updatedPort!.Holdings.Should().HaveCount(3);

        var infy = updatedPort.Holdings.First(h => h.Stock.Ticker.Value == "INFY");
        infy.Quantity.Should().Be(20);
        // (10*1000 + 10*1200) / 20 = 1100
        infy.AverageBuyPrice!.Value.Amount.Should().Be(1100.00m);

        var tcs = updatedPort.Holdings.First(h => h.Stock.Ticker.Value == "TCS");
        tcs.Quantity.Should().Be(15); // Untouched

        var bel = updatedPort.Holdings.First(h => h.Stock.Ticker.Value == "BEL");
        bel.Quantity.Should().Be(30);
        bel.AverageBuyPrice!.Value.Amount.Should().Be(300.00m);
    }

    [Fact]
    public async Task ImportBrokerHoldingsAsync_KeepSeparateMode_CreatesNewDedicatedPortfolio()
    {
        // Arrange
        var csv = """
            Instrument,Qty.,Avg. cost,LTP
            ONGC,100,220.00,240.00
            CANBK,200,110.00,135.00
            """;
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        // Act
        var result = await _portfolioService.ImportBrokerHoldingsAsync(
            portfolioId: null,
            stream,
            "zerodha_holdings.csv",
            BrokerImportMode.KeepSeparate,
            newPortfolioName: "Zerodha Demat Portfolio");

        // Assert
        result.Should().NotBeNull();
        result!.PortfolioName.Should().Be("Zerodha Demat Portfolio");
        result.ModeUsed.Should().Be(BrokerImportMode.KeepSeparate);
        result.NewPositionsCount.Should().Be(2);

        var created = await _repository.GetByIdAsync(result.PortfolioId);
        created.Should().NotBeNull();
        created!.Name.Should().Be("Zerodha Demat Portfolio");
        created.Holdings.Should().HaveCount(2);
    }

    [Fact]
    public async Task ImportBrokerHoldingsAsync_ReplaceMode_OverwritesExistingHoldings()
    {
        // Arrange
        var portfolio = new Portfolio { Name = "Old Portfolio" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("WIPRO", "Wipro Ltd", Sector.Technology, 450m),
            Quantity = 100
        });
        await _repository.SaveAsync(portfolio);

        var csv = """
            Instrument,Qty.,Avg. cost,LTP
            TCS,50,3400.00,3500.00
            """;
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        // Act
        var result = await _portfolioService.ImportBrokerHoldingsAsync(
            portfolio.Id,
            stream,
            "zerodha_export.csv",
            BrokerImportMode.Replace);

        // Assert
        result.Should().NotBeNull();
        var updated = await _repository.GetByIdAsync(portfolio.Id);
        updated!.Holdings.Should().HaveCount(1);
        updated.Holdings.First().Stock.Ticker.Value.Should().Be("TCS");
    }
}
