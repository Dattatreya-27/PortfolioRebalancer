using FluentAssertions;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Tests.Models;

public class PortfolioTests
{
    private static Stock CreateStock(string ticker, Sector sector, decimal price)
    {
        var stock = new Stock
        {
            Ticker = new Ticker(ticker),
            Name = $"{ticker} Corp",
            Sector = sector
        };
        stock.UpdateMarketData(Money.USD(price));
        return stock;
    }

    private static Portfolio CreateTestPortfolio()
    {
        var portfolio = new Portfolio { Name = "Test Portfolio" };

        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("AAPL", Sector.Technology, 150m),
            Quantity = 10
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("JNJ", Sector.Healthcare, 160m),
            Quantity = 5
        });

        return portfolio;
    }

    [Fact]
    public void TotalValue_ShouldSumAllHoldings()
    {
        var portfolio = CreateTestPortfolio();
        // AAPL: 10 * 150 = 1500, JNJ: 5 * 160 = 800, Total = 2300
        portfolio.TotalValue.Amount.Should().Be(2300m);
    }

    [Fact]
    public void TotalValue_EmptyPortfolio_ShouldBeZero()
    {
        var portfolio = new Portfolio { Name = "Empty" };
        portfolio.TotalValue.Amount.Should().Be(0m);
    }

    [Fact]
    public void AddHolding_DuplicateTicker_ShouldReplace()
    {
        var portfolio = CreateTestPortfolio();
        var newApple = new Holding
        {
            Stock = CreateStock("AAPL", Sector.Technology, 150m),
            Quantity = 20
        };

        portfolio.AddHolding(newApple);

        portfolio.Holdings.Should().HaveCount(2);
        portfolio.Holdings.First(h => h.Stock.Ticker == new Ticker("AAPL"))
            .Quantity.Should().Be(20);
    }

    [Fact]
    public void RemoveHolding_ShouldRemoveByTicker()
    {
        var portfolio = CreateTestPortfolio();
        var removed = portfolio.RemoveHolding(new Ticker("AAPL"));
        removed.Should().BeTrue();
        portfolio.Holdings.Should().HaveCount(1);
    }

    [Fact]
    public void RemoveHolding_NonExistent_ShouldReturnFalse()
    {
        var portfolio = CreateTestPortfolio();
        var removed = portfolio.RemoveHolding(new Ticker("GOOG"));
        removed.Should().BeFalse();
    }

    [Fact]
    public void SetTargetAllocations_ValidWeights_ShouldSucceed()
    {
        var portfolio = new Portfolio { Name = "Test" };
        var allocations = new[]
        {
            new SectorAllocation(Sector.Technology, new Percentage(60)),
            new SectorAllocation(Sector.Healthcare, new Percentage(40))
        };

        portfolio.SetTargetAllocations(allocations);

        portfolio.TargetAllocations.Should().HaveCount(2);
    }

    [Fact]
    public void SetTargetAllocations_WeightsNotSumTo100_ShouldThrow()
    {
        var portfolio = new Portfolio { Name = "Test" };
        var allocations = new[]
        {
            new SectorAllocation(Sector.Technology, new Percentage(60)),
            new SectorAllocation(Sector.Healthcare, new Percentage(30))
        };

        var act = () => portfolio.SetTargetAllocations(allocations);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*100%*");
    }

    [Fact]
    public void SetTargetAllocations_DuplicateSectors_ShouldThrow()
    {
        var portfolio = new Portfolio { Name = "Test" };
        var allocations = new[]
        {
            new SectorAllocation(Sector.Technology, new Percentage(50)),
            new SectorAllocation(Sector.Technology, new Percentage(50))
        };

        var act = () => portfolio.SetTargetAllocations(allocations);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Duplicate*");
    }

    [Fact]
    public void GetCurrentSectorWeights_ShouldCalculateCorrectly()
    {
        var portfolio = CreateTestPortfolio();
        // AAPL (Tech): 1500/2300 ≈ 65.22%, JNJ (Health): 800/2300 ≈ 34.78%
        var weights = portfolio.GetCurrentSectorWeights();

        weights.Should().ContainKey(Sector.Technology);
        weights.Should().ContainKey(Sector.Healthcare);
        weights[Sector.Technology].Value.Should().BeApproximately(65.22m, 0.1m);
        weights[Sector.Healthcare].Value.Should().BeApproximately(34.78m, 0.1m);
    }

    [Fact]
    public void GetCurrentSectorWeights_EmptyPortfolio_ShouldReturnEmpty()
    {
        var portfolio = new Portfolio { Name = "Empty" };
        var weights = portfolio.GetCurrentSectorWeights();
        weights.Should().BeEmpty();
    }
}
