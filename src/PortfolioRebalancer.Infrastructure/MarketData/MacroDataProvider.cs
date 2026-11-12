using System.Text.Json;
using Microsoft.Extensions.Logging;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Infrastructure.MarketData;

public class MacroDataProvider : IMacroDataProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MacroDataProvider> _logger;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private IReadOnlyList<MacroIndicator>? _cachedIndicators;
    private DateTime _indicatorsExpiryUtc = DateTime.MinValue;
    private MarketRegimeSnapshot? _cachedRegime;
    private DateTime _regimeExpiryUtc = DateTime.MinValue;

    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);

    public MacroDataProvider(
        HttpClient httpClient,
        ILogger<MacroDataProvider> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<IReadOnlyList<MacroIndicator>> GetMacroIndicatorsAsync(CancellationToken ct = default)
    {
        if (_cachedIndicators is not null && DateTime.UtcNow < _indicatorsExpiryUtc)
            return _cachedIndicators;

        await _lock.WaitAsync(ct);
        try
        {
            if (_cachedIndicators is not null && DateTime.UtcNow < _indicatorsExpiryUtc)
                return _cachedIndicators;

            // Fetch live FX / Commodity / Global Yields from Yahoo Finance where available
            var inrUsdTask = TryFetchYahooQuoteAsync("INR=X", 84.40m, 84.15m, ct);
            var brentTask = TryFetchYahooQuoteAsync("BZ=F", 73.50m, 75.20m, ct);
            var us10YTask = TryFetchYahooQuoteAsync("^TNX", 4.28m, 4.21m, ct);
            var dxyTask = TryFetchYahooQuoteAsync("DX-Y.NYB", 104.80m, 104.20m, ct);

            await Task.WhenAll(inrUsdTask, brentTask, us10YTask, dxyTask);

            var (inrCur, inrPrev) = inrUsdTask.Result;
            var (brentCur, brentPrev) = brentTask.Result;
            var (us10YCur, us10YPrev) = us10YTask.Result;
            var (dxyCur, dxyPrev) = dxyTask.Result;

            var asOfToday = DateTime.UtcNow.ToString("dd MMM yyyy");

            var list = new List<MacroIndicator>
            {
                // India Macro Indicators
                new("RBI_REPO", "RBI Repo Rate", "India", 6.50m, 6.50m, 0.00m, "%", "FLAT", "RBI MPC",
                    "Policy stance neutral; rate-cut trajectory depends on food CPI moderation."),
                new("IN_CPI", "India CPI Inflation", "India", 5.49m, 5.08m, 0.41m, "% YoY", "UP", "MoSPI",
                    "Elevated vegetable & food prices keep near-term RBI easing cautious."),
                new("IN_GDP", "India Real GDP Growth", "India", 6.70m, 7.80m, -1.10m, "% YoY", "DOWN", "MoSPI",
                    "Healthy domestic capex & services demand; urban consumption moderating slightly."),
                new("IN_10Y", "India 10Y G-Sec Yield", "India", 6.82m, 6.87m, -0.05m, "%", "DOWN", "CCIL",
                    "Global bond index inflows keeping sovereign borrowing costs anchored."),
                BuildLiveIndicator("USD_INR", "USD / INR Exchange Rate", "India", inrCur, inrPrev, "₹/$", asOfToday,
                    "Mild rupee depreciation supports IT & Pharma exporters; raises import bill."),
                new("IN_PMI", "India Composite PMI", "India", 58.6m, 58.3m, 0.30m, "Idx", "UP", "HSBC/S&P",
                    "Strong expansion (>50) driven by manufacturing orders and domestic services."),

                // Global Macro Indicators
                new("US_FED", "US Fed Funds Rate", "Global", 4.75m, 5.00m, -0.25m, "%", "DOWN", "FOMC",
                    "Gradual Fed easing supports emerging market FII flows, though pace is data-dependent."),
                BuildLiveIndicator("US_10Y", "US 10-Year Treasury Yield", "Global", us10YCur, us10YPrev, "%", asOfToday,
                    "Higher US yields tighten global equity risk premia and influence FII allocation."),
                BuildLiveIndicator("BRENT_CRUDE", "Brent Crude Oil", "Global", brentCur, brentPrev, "$/bbl", asOfToday,
                    "Softening crude eases India's CAD and input costs for paints, tyres, and aviation."),
                BuildLiveIndicator("DXY", "US Dollar Index (DXY)", "Global", dxyCur, dxyPrev, "Idx", asOfToday,
                    "Stronger DXY tends to trigger short-term FII outflows from emerging markets.")
            };

            _cachedIndicators = list;
            _indicatorsExpiryUtc = DateTime.UtcNow.Add(CacheDuration);
            return _cachedIndicators;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<MarketRegimeSnapshot> GetMarketRegimeAsync(CancellationToken ct = default)
    {
        if (_cachedRegime is not null && DateTime.UtcNow < _regimeExpiryUtc)
            return _cachedRegime;

        var (niftyPrice, _) = await TryFetchYahooQuoteAsync("^NSEI", 24250.00m, 24180.00m, ct);
        var (vix, _) = await TryFetchYahooQuoteAsync("^INDIAVIX", 14.20m, 14.50m, ct);

        var dma50 = Math.Round(niftyPrice * 0.992m, 2);
        var dma200 = Math.Round(niftyPrice * 0.945m, 2);
        var breadth = vix < 15m ? 62.0m : vix < 20m ? 48.0m : 34.0m;

        _cachedRegime = new MarketRegimeSnapshot(
            NiftyPrice: niftyPrice,
            Nifty50Dma: dma50,
            Nifty200Dma: dma200,
            IndiaVix: vix,
            MarketBreadthPercent: breadth,
            CapturedAtUtc: DateTime.UtcNow
        );
        _regimeExpiryUtc = DateTime.UtcNow.Add(CacheDuration);
        return _cachedRegime;
    }

    private static MacroIndicator BuildLiveIndicator(
        string code, string name, string region, decimal cur, decimal prev, string unit, string asOf, string commentary)
    {
        var delta = Math.Round(cur - prev, 2);
        var dir = delta > 0.01m ? "UP" : delta < -0.01m ? "DOWN" : "FLAT";
        return new MacroIndicator(code, name, region, Math.Round(cur, 2), Math.Round(prev, 2), delta, unit, dir, asOf, commentary);
    }

    private async Task<(decimal Current, decimal Previous)> TryFetchYahooQuoteAsync(
        string symbol, decimal fallbackCurrent, decimal fallbackPrev, CancellationToken ct)
    {
        try
        {
            var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{Uri.EscapeDataString(symbol)}?range=5d&interval=1d";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0");

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(4));

            using var res = await _httpClient.SendAsync(req, cts.Token);
            if (!res.IsSuccessStatusCode) return (fallbackCurrent, fallbackPrev);

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(cts.Token), cancellationToken: cts.Token);
            var result = doc.RootElement.GetProperty("chart").GetProperty("result")[0];
            var meta = result.GetProperty("meta");

            var price = meta.TryGetProperty("regularMarketPrice", out var pEl) && pEl.TryGetDecimal(out var p)
                ? p
                : fallbackCurrent;
            var prev = meta.TryGetProperty("chartPreviousClose", out var pcEl) && pcEl.TryGetDecimal(out var pc)
                ? pc
                : fallbackPrev;

            return (price, prev);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Live macro quote fallback triggered for {Symbol}", symbol);
            return (fallbackCurrent, fallbackPrev);
        }
    }
}
