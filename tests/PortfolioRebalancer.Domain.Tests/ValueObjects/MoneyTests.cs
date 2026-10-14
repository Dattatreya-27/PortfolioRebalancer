using FluentAssertions;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Tests.ValueObjects;

public class MoneyTests
{
    [Fact]
    public void Add_SameCurrency_ShouldReturnSum()
    {
        var a = Money.USD(100m);
        var b = Money.USD(50m);
        var result = a + b;
        result.Amount.Should().Be(150m);
        result.Currency.Should().Be("USD");
    }

    [Fact]
    public void Add_DifferentCurrency_ShouldThrow()
    {
        var usd = Money.USD(100m);
        var inr = Money.INR(100m);
        var act = () => usd + inr;
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*USD*INR*");
    }

    [Fact]
    public void Subtract_ShouldReturnDifference()
    {
        var a = Money.USD(100m);
        var b = Money.USD(30m);
        var result = a - b;
        result.Amount.Should().Be(70m);
    }

    [Fact]
    public void Multiply_ShouldScaleAmount()
    {
        var money = Money.USD(100m);
        var result = money * 0.5m;
        result.Amount.Should().Be(50m);
    }

    [Fact]
    public void Multiply_LeftScalar_ShouldWork()
    {
        var money = Money.USD(100m);
        var result = 2m * money;
        result.Amount.Should().Be(200m);
    }

    [Fact]
    public void Zero_ShouldHaveZeroAmount()
    {
        var zero = Money.Zero();
        zero.Amount.Should().Be(0m);
        zero.Currency.Should().Be("INR");

        var zeroUsd = Money.Zero("USD");
        zeroUsd.Currency.Should().Be("USD");
    }

    [Fact]
    public void Comparison_ShouldWork()
    {
        var big = Money.USD(200m);
        var small = Money.USD(100m);
        (big > small).Should().BeTrue();
        (small < big).Should().BeTrue();
        (big >= small).Should().BeTrue();
        (small <= big).Should().BeTrue();
    }

    [Fact]
    public void ToString_ShouldFormat()
    {
        var money = Money.USD(1234.5m);
        money.ToString().Should().Contain("USD").And.Contain("1,234.50");
    }
}
