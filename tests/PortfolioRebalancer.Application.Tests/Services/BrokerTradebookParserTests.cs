using System.Text;
using PortfolioRebalancer.Application.Services;
using Xunit;

namespace PortfolioRebalancer.Application.Tests.Services;

public class BrokerTradebookParserTests
{
    [Fact]
    public void ParseCsv_ZerodhaTradebook_CorrectlyMatchesFifoRealizedPnL()
    {
        // Setup realistic Zerodha tradebook CSV
        var csvContent = new StringBuilder();
        csvContent.AppendLine("symbol,isin,trade_date,exchange,segment,series,trade_type,quantity,price,order_id,trade_id,order_execution_time");
        csvContent.AppendLine("TCS,INE467B01029,2025-01-10,NSE,EQ,EQ,buy,10,3500.00,1001,5001,2025-01-10 10:15:00");
        csvContent.AppendLine("TCS,INE467B01029,2025-02-15,NSE,EQ,EQ,buy,10,3600.00,1002,5002,2025-02-15 11:30:00");
        csvContent.AppendLine("TCS,INE467B01029,2025-06-20,NSE,EQ,EQ,sell,15,4000.00,1003,5003,2025-06-20 14:00:00");

        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(csvContent.ToString()));

        // Act
        var trades = BrokerTradebookParser.ParseAndMatchTrades(ms, "tradebook-zerodha.csv");

        // Assert
        Assert.Equal(3, trades.Count);

        var sellTrade = trades.First(t => t.Action == "SELL");
        Assert.Equal("TCS", sellTrade.Ticker.Value);
        Assert.Equal(15, sellTrade.Quantity);
        Assert.Equal(4000.00m, sellTrade.Price.Amount);

        // FIFO cost basis for 15 shares:
        // 10 shares @ 3500 + 5 shares @ 3600 = 35000 + 18000 = 53000 / 15 = 3533.33
        Assert.NotNull(sellTrade.CostBasisPrice);
        Assert.Equal(3533.33m, sellTrade.CostBasisPrice.Value);

        // Realized PnL: (4000 - 3533.33) * 15 = ~7000.05
        Assert.NotNull(sellTrade.RealizedPnL);
        Assert.True(sellTrade.RealizedPnL.Value.Amount > 6990m && sellTrade.RealizedPnL.Value.Amount < 7010m);
        Assert.True(sellTrade.IsWinningTrade);
        Assert.Equal("STCG (Short-Term)", sellTrade.TaxClassification);
    }

    [Fact]
    public void ParseCsv_LosingTrade_CorrectlyFlagsNegativeRealizedPnL()
    {
        var csvContent = new StringBuilder();
        csvContent.AppendLine("symbol,trade_type,quantity,price,trade_date,order_id");
        csvContent.AppendLine("INFY,buy,20,1600.00,2025-03-01,101");
        csvContent.AppendLine("INFY,sell,20,1400.00,2025-04-10,102");

        using var ms = new MemoryStream(Encoding.UTF8.GetBytes(csvContent.ToString()));

        var trades = BrokerTradebookParser.ParseAndMatchTrades(ms, "trades.csv");

        Assert.Equal(2, trades.Count);
        var sell = trades.First(t => t.Action == "SELL");
        Assert.NotNull(sell.RealizedPnL);
        Assert.Equal(-4000.00m, sell.RealizedPnL.Value.Amount);
        Assert.False(sell.IsWinningTrade);
        Assert.Equal(-12.50m, sell.RealizedPnLPercent);
    }
}
