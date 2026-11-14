using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;
using Xunit;
using Xunit.Abstractions;

namespace PortfolioRebalancer.Application.Tests;

public class PortfolioPriceAuditTests
{
    private readonly ITestOutputHelper _output;

    public PortfolioPriceAuditTests(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public async Task AuditAllStoredPortfolioPricesAgainstLiveYahoo()
    {
        var repo = new JsonFilePortfolioRepository(@"D:\PortfolioRebalancer\data\portfolios.json");
        var provider = new YahooFinanceLiveStockDataProvider();

        var portfolios = await repo.GetAllAsync();
        foreach (var p in portfolios)
        {
            _output.WriteLine($"=== Portfolio: {p.Name} ===");
            var tickers = p.Holdings.Select(h => h.Stock.Ticker.Value).ToList();
            var liveStocks = await provider.GetStocksAsync(tickers);
            var liveMap = liveStocks.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

            foreach (var h in p.Holdings)
            {
                var t = h.Stock.Ticker.Value;
                var stored = h.Stock.CurrentPrice.Amount;
                var buy = h.AverageBuyPrice?.Amount ?? 0m;
                if (liveMap.TryGetValue(t, out var live))
                {
                    var lp = live.CurrentPrice.Amount;
                    var diff = Math.Abs(lp - stored);
                    if (diff > 5m && (lp > stored * 1.5m || lp < stored * 0.6m))
                    {
                        _output.WriteLine($"MISMATCH: {t,-16} Stored={stored,-10} Live={lp,-10} Buy={buy,-10} PrevClose={live.PreviousClose?.Amount}");
                    }
                }
                else
                {
                    _output.WriteLine($"NOT FOUND: {t,-16} Stored={stored,-10} Buy={buy,-10}");
                }
            }
        }
    }
}
