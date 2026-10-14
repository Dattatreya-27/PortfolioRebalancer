using FluentAssertions;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Tests.ValueObjects;

public class PercentageTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(50)]
    [InlineData(100)]
    public void Constructor_ValidValues_ShouldSucceed(decimal value)
    {
        var pct = new Percentage(value);
        pct.Value.Should().Be(value);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(100.01)]
    [InlineData(200)]
    public void Constructor_InvalidValues_ShouldThrow(decimal value)
    {
        var act = () => new Percentage(value);
        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void AsFraction_ShouldConvertCorrectly()
    {
        var pct = new Percentage(60m);
        pct.AsFraction.Should().Be(0.60m);
    }

    [Fact]
    public void FromFraction_ShouldConvertCorrectly()
    {
        var pct = Percentage.FromFraction(0.75m);
        pct.Value.Should().Be(75m);
    }

    [Fact]
    public void EqualPercentages_ShouldBeEqual()
    {
        var a = new Percentage(50m);
        var b = new Percentage(50m);
        a.Should().Be(b);
    }

    [Fact]
    public void ToString_ShouldFormatWithPercent()
    {
        var pct = new Percentage(33.33m);
        pct.ToString().Should().Be("33.33%");
    }
}
