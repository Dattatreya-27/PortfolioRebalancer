using System.Text;
using FluentAssertions;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;

namespace PortfolioRebalancer.Application.Tests.Services;

public class BrokerHoldingsParserTests
{
    [Fact]
    public void ParseCsv_ZerodhaKiteFormat_ExtractsHoldingsAndIdentifiesZerodha()
    {
        // Arrange: Standard Zerodha Kite export format
        var csv = """
            Instrument,Qty.,Avg. cost,LTP,Cur. val,P&L,Net chg.,Day chg.
            INFY,20,1450.50,1520.10,30402.00,1392.00,4.80,0.50
            TCS,10,3400.00,3550.00,35500.00,1500.00,4.41,-0.20
            RELIANCE-EQ,15,2400.00,2450.00,36750.00,750.00,2.08,0.15
            """;
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        // Act
        var result = BrokerHoldingsParser.Parse(stream, "holdings.csv");

        // Assert
        result.Should().NotBeNull();
        result.BrokerDetected.Should().Be("Zerodha");
        result.FileFormat.Should().Be("CSV");
        result.Holdings.Should().HaveCount(3);

        var infy = result.Holdings.First(h => h.Ticker == "INFY");
        infy.Quantity.Should().Be(20);
        infy.AveragePrice.Should().Be(1450.50m);
        infy.Ltp.Should().Be(1520.10m);

        var reliance = result.Holdings.First(h => h.Ticker == "RELIANCE");
        reliance.Quantity.Should().Be(15);
        reliance.AveragePrice.Should().Be(2400.00m);
    }

    [Fact]
    public void ParseCsv_ZerodhaConsoleFormat_ExtractsPositionsCorrectly()
    {
        // Arrange: Zerodha Console holdings format
        var csv = """
            Symbol,ISIN,Sector,Quantity,Average Price,Previous Closing Price
            BEL,INE263A01024,Industrials,100,320.50,335.50
            CANBK,INE476A01014,Financials,250,120.00,135.60
            """;
        using var stream = new MemoryStream(Encoding.UTF8.GetBytes(csv));

        // Act
        var result = BrokerHoldingsParser.Parse(stream, "console_holdings.csv");

        // Assert
        result.Should().NotBeNull();
        result.Holdings.Should().HaveCount(2);

        var bel = result.Holdings.First(h => h.Ticker == "BEL");
        bel.Quantity.Should().Be(100);
        bel.AveragePrice.Should().Be(320.50m);

        var canbk = result.Holdings.First(h => h.Ticker == "CANBK");
        canbk.Quantity.Should().Be(250);
        canbk.AveragePrice.Should().Be(120.00m);
    }

    [Fact]
    public void CleanSymbol_StripsExchangeSuffixesAndResolvesIsin()
    {
        // Act & Assert
        BrokerHoldingsParser.CleanSymbol("INFY-EQ", null).Should().Be("INFY");
        BrokerHoldingsParser.CleanSymbol("TCS.NS", null).Should().Be("TCS");
        BrokerHoldingsParser.CleanSymbol("EQ:RELIANCE", null).Should().Be("RELIANCE");
        BrokerHoldingsParser.CleanSymbol("RandomName", "INE04I401011").Should().Be("KPITTECH");
    }
}
