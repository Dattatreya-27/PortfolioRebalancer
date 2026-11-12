using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;
using PortfolioRebalancer.Infrastructure.MarketData;
using PortfolioRebalancer.Infrastructure.Persistence;
using Xunit;

namespace PortfolioRebalancer.Application.Tests;

public class PillarIntelligenceServicesTests
{
    private static (InMemoryPortfolioRepository Repo, IStockDataProvider StockProvider, Portfolio Portfolio) CreateTestContext()
    {
        var repo = new InMemoryPortfolioRepository();

        var portfolio = new Portfolio { Name = "Core Long-Term Portfolio" };

        var icici = new Stock { Ticker = new Ticker("ICICIBANK"), Name = "ICICI Bank Ltd", Sector = Sector.Financials };
        icici.UpdateMarketData(Money.INR(1250m));
        var infy = new Stock { Ticker = new Ticker("INFY"), Name = "Infosys Ltd", Sector = Sector.Technology };
        infy.UpdateMarketData(Money.INR(1850m));
        var sun = new Stock { Ticker = new Ticker("SUNPHARMA"), Name = "Sun Pharmaceutical Industries Ltd", Sector = Sector.Healthcare };
        sun.UpdateMarketData(Money.INR(1820m));

        portfolio.ExecuteTrade(icici, "BUY", 10m, 1000m);
        portfolio.ExecuteTrade(infy, "BUY", 10m, 1500m);
        portfolio.ExecuteTrade(sun, "BUY", 10m, 1400m);

        var stockProvider = new StubStockDataProvider(icici, infy, sun);
        repo.SaveAsync(portfolio).GetAwaiter().GetResult();
        return (repo, stockProvider, portfolio);
    }

    [Fact]
    public async Task QuarterlyEarningsService_ComputesPortfolioEarningsDigest()
    {
        var (repo, stockProvider, portfolio) = CreateTestContext();
        var provider = new QuarterlyEarningsProvider(stockProvider);
        var service = new QuarterlyEarningsService(provider, repo, stockProvider);

        var digest = await service.GetPortfolioEarningsDigestAsync(portfolio.Id);

        Assert.NotNull(digest);
        Assert.Equal(3, digest!.Holdings.Count);
        Assert.Equal(3, digest.BeatCount); // ICICIBANK, INFY, SUNPHARMA are all BEAT
        Assert.All(digest.Holdings, h => Assert.False(string.IsNullOrWhiteSpace(h.PlainEnglishSummary)));
    }

    [Fact]
    public async Task PolicyImpactService_MapsDomesticAndInternationalPoliciesToHoldings()
    {
        var (repo, stockProvider, portfolio) = CreateTestContext();
        var policyProvider = new PolicyIntelligenceProvider();
        var service = new PolicyImpactService(policyProvider, repo, stockProvider);

        var map = await service.GetPolicyImpactMapAsync(portfolio.Id);

        Assert.True(map.DomesticShiftsCount > 0);
        Assert.True(map.InternationalShiftsCount > 0);
        Assert.True(map.DirectImpactsCount > 0);
        Assert.Contains(map.HoldingImpacts, i => i.Ticker == "ICICIBANK" && i.Scope == "Domestic");
        Assert.Contains(map.HoldingImpacts, i => i.Ticker == "INFY" && i.Scope == "International");
        Assert.Contains(map.HoldingImpacts, i => i.Ticker == "SUNPHARMA" && i.Scope == "International");
    }

    [Fact]
    public async Task MacroIntelligenceService_MapsMacroIndicatorsToHeldSectors()
    {
        var (repo, stockProvider, portfolio) = CreateTestContext();
        var macroProvider = new StubMacroDataProvider();
        var service = new MacroIntelligenceService(macroProvider, repo, stockProvider);

        var dashboard = await service.GetMacroDashboardAsync(portfolio.Id);

        Assert.NotEmpty(dashboard.IndiaIndicators);
        Assert.NotEmpty(dashboard.GlobalIndicators);
        Assert.Contains(dashboard.PortfolioImpacts, i => i.Ticker == "ICICIBANK" && i.IndicatorCode == "RBI_REPO");
        Assert.Contains(dashboard.PortfolioImpacts, i => i.Ticker == "INFY" && i.IndicatorCode == "USD_INR");
    }

    private sealed class StubMacroDataProvider : IMacroDataProvider
    {
        public Task<IReadOnlyList<MacroIndicator>> GetMacroIndicatorsAsync(CancellationToken ct = default)
        {
            IReadOnlyList<MacroIndicator> list = new List<MacroIndicator>
            {
                new("RBI_REPO", "RBI Repo Rate", "India", 6.50m, 6.50m, 0m, "%", "FLAT", "RBI", "Neutral stance."),
                new("USD_INR", "USD / INR", "India", 84.40m, 84.10m, 0.30m, "₹/$", "UP", "Today", "Mild depreciation."),
                new("US_10Y", "US 10Y Yield", "Global", 4.28m, 4.20m, 0.08m, "%", "UP", "Today", "Higher US yields.")
            };
            return Task.FromResult(list);
        }

        public Task<MarketRegimeSnapshot> GetMarketRegimeAsync(CancellationToken ct = default)
            => Task.FromResult(new MarketRegimeSnapshot(24250m, 24000m, 23000m, 14.2m, 60m, DateTime.UtcNow));
    }

    private sealed class StubStockDataProvider : IStockDataProvider
    {
        private readonly Dictionary<string, Stock> _map;
        public StubStockDataProvider(params Stock[] stocks)
            => _map = stocks.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

        public Task<Stock?> GetStockAsync(string ticker)
            => Task.FromResult(_map.TryGetValue(ticker, out var s) ? s : null);

        public Task<IReadOnlyList<Stock>> GetStocksAsync(IEnumerable<string> tickers)
            => Task.FromResult<IReadOnlyList<Stock>>(tickers.Where(t => _map.ContainsKey(t)).Select(t => _map[t]).ToList());
    }
}
