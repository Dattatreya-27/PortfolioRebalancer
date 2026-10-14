using FluentAssertions;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.Strategies;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Tests.Strategies;

public class SectorTargetStrategyTests
{
    private readonly SectorTargetStrategy _strategy = new();

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

    private static Portfolio CreateBalancedPortfolio()
    {
        var portfolio = new Portfolio { Name = "Test" };

        // Tech: AAPL=1500 + MSFT=2000 = 3500
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("AAPL", Sector.Technology, 150m),
            Quantity = 10
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("MSFT", Sector.Technology, 400m),
            Quantity = 5
        });

        // Healthcare: JNJ=800
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("JNJ", Sector.Healthcare, 160m),
            Quantity = 5
        });

        // Financials: JPM=700
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("JPM", Sector.Financials, 140m),
            Quantity = 5
        });

        // Total: 3500 + 800 + 700 = 5000
        // Current weights: Tech=70%, Health=16%, Fin=14%
        // Target: Tech=50%, Health=30%, Fin=20%
        portfolio.SetTargetAllocations([
            new SectorAllocation(Sector.Technology, new Percentage(50)),
            new SectorAllocation(Sector.Healthcare, new Percentage(30)),
            new SectorAllocation(Sector.Financials, new Percentage(20))
        ]);

        return portfolio;
    }

    [Fact]
    public void Calculate_ShouldReturnTradesForAllHoldings()
    {
        var portfolio = CreateBalancedPortfolio();
        var result = _strategy.Calculate(portfolio);

        result.Trades.Should().HaveCount(4); // AAPL, MSFT, JNJ, JPM
    }

    [Fact]
    public void Calculate_OverweightSector_ShouldRecommendSelling()
    {
        var portfolio = CreateBalancedPortfolio();
        var result = _strategy.Calculate(portfolio);

        // Tech is 70% but target is 50% — should sell
        var techTrades = result.Trades.Where(t => t.Sector == Sector.Technology);
        techTrades.Should().AllSatisfy(t => t.IsSell.Should().BeTrue());
    }

    [Fact]
    public void Calculate_UnderweightSector_ShouldRecommendBuying()
    {
        var portfolio = CreateBalancedPortfolio();
        var result = _strategy.Calculate(portfolio);

        // Healthcare is 16% but target is 30% — should buy
        var healthTrades = result.Trades.Where(t => t.Sector == Sector.Healthcare);
        healthTrades.Should().AllSatisfy(t => t.IsBuy.Should().BeTrue());
    }

    [Fact]
    public void Calculate_ShouldPreserveTotalPortfolioValue()
    {
        var portfolio = CreateBalancedPortfolio();
        var result = _strategy.Calculate(portfolio);

        // Sum of target values should equal total portfolio value
        var totalTargetValue = result.Trades.Sum(t => t.TargetValue.Amount);
        totalTargetValue.Should().BeApproximately(5000m, 0.1m);
    }

    [Fact]
    public void Calculate_ShouldReportCorrectSectorDrifts()
    {
        var portfolio = CreateBalancedPortfolio();
        var result = _strategy.Calculate(portfolio);

        var techDrift = result.SectorDrifts.First(d => d.Sector == Sector.Technology);
        techDrift.IsOverweight.Should().BeTrue();
        techDrift.DriftPercentagePoints.Should().BeApproximately(20m, 0.1m); // 70% - 50%

        var healthDrift = result.SectorDrifts.First(d => d.Sector == Sector.Healthcare);
        healthDrift.IsUnderweight.Should().BeTrue();
    }

    [Fact]
    public void Calculate_EmptyPortfolio_ShouldReturnEmptyResult()
    {
        var portfolio = new Portfolio { Name = "Empty" };
        var result = _strategy.Calculate(portfolio);

        result.Trades.Should().BeEmpty();
        result.SectorDrifts.Should().BeEmpty();
        result.EstimatedTotalValue.Amount.Should().Be(0m);
    }

    [Fact]
    public void Calculate_NoTargetAllocations_ShouldThrow()
    {
        var portfolio = new Portfolio { Name = "No Targets" };
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("AAPL", Sector.Technology, 150m),
            Quantity = 10
        });

        var act = () => _strategy.Calculate(portfolio);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*target allocations*");
    }

    [Fact]
    public void Calculate_AlreadyBalanced_ShouldHaveMinimalDelta()
    {
        var portfolio = new Portfolio { Name = "Balanced" };

        // Create a portfolio that's already at target: 60/40
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("AAPL", Sector.Technology, 150m),
            Quantity = 4  // 600
        });
        portfolio.AddHolding(new Holding
        {
            Stock = CreateStock("JNJ", Sector.Healthcare, 100m),
            Quantity = 4  // 400
        });
        // Total = 1000, Tech=60%, Health=40%

        portfolio.SetTargetAllocations([
            new SectorAllocation(Sector.Technology, new Percentage(60)),
            new SectorAllocation(Sector.Healthcare, new Percentage(40))
        ]);

        var result = _strategy.Calculate(portfolio);

        result.Trades.Should().AllSatisfy(t =>
            Math.Abs(t.DeltaQuantity).Should().BeLessThan(0.01m));
    }

    [Fact]
    public void Name_ShouldReturnStrategyName()
    {
        _strategy.Name.Should().Be("Sector Target Rebalancing");
    }
}
