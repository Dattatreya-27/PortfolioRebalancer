using FluentAssertions;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Tests.ValueObjects;

public class TickerTests
{
    [Fact]
    public void Constructor_ShouldNormalizeToUpperCase()
    {
        var ticker = new Ticker("aapl");
        ticker.Value.Should().Be("AAPL");
    }

    [Fact]
    public void Constructor_ShouldTrimWhitespace()
    {
        var ticker = new Ticker("  MSFT  ");
        ticker.Value.Should().Be("MSFT");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_ShouldThrowForInvalidInput(string? value)
    {
        var act = () => new Ticker(value!);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void EqualTickers_ShouldBeEqual()
    {
        var ticker1 = new Ticker("GOOG");
        var ticker2 = new Ticker("goog");
        ticker1.Should().Be(ticker2);
    }

    [Fact]
    public void ImplicitConversion_ShouldReturnStringValue()
    {
        var ticker = new Ticker("TSLA");
        string value = ticker;
        value.Should().Be("TSLA");
    }

    [Fact]
    public void ToString_ShouldReturnValue()
    {
        var ticker = new Ticker("NFLX");
        ticker.ToString().Should().Be("NFLX");
    }
}
