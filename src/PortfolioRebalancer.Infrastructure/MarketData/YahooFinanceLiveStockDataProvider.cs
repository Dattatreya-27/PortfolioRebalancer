using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Infrastructure.MarketData;

/// <summary>
/// Production live market data provider fetching real-time quotes for NSE stocks from Yahoo Finance.
/// Uses authenticated HTTP sessions (cookies + crumb) with multi-symbol batching and caching.
/// Automatically handles symbol aliases (rebranded/renamed tickers), URL encoding, and fallback.
/// </summary>
public sealed class YahooFinanceLiveStockDataProvider : IStockDataProvider, IDisposable
{
    private readonly MockStockDataProvider _fallbackProvider = new();
    private readonly HttpClient _httpClient;
    private readonly CookieContainer _cookieContainer;
    private readonly ConcurrentDictionary<string, (Stock Stock, DateTime FetchedAt)> _cache = new(StringComparer.OrdinalIgnoreCase);
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(3);

    private static readonly Dictionary<string, string> SymbolAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["M&M"] = "M%26M.NS",
        ["IBULHSGFIN"] = "SAMMAANCAP.NS",
        ["GMRINFRA"] = "GMRAIRPORT.NS",
        ["TATAMOTORS"] = "TMPV.NS",
        ["VALOR"] = "DBREALTY.NS",
        ["NSDL"] = "NSDL.BO",
        ["AJRINFRA"] = "AJRINFRA.BO",
        ["GUJENERGY"] = "GUJENERGY.NS",
        ["GUJGASLTD"] = "GUJENERGY.NS",
        ["FRETAIL"] = "FRETAIL.BO",
        ["ZOMATO"] = "ETERNAL.NS",
        ["PAYTM"] = "PAYTM.NS",
        ["SOLAR INDUSTRIES"] = "SOLARINDS.NS",
        ["SOLAR INDUSTRIES INDIA"] = "SOLARINDS.NS",
        ["SOLARINDS"] = "SOLARINDS.NS",
        ["JP POWER VEN."] = "JPPOWER.NS",
        ["JPPOWER VEN"] = "JPPOWER.NS",
        ["JPPOWER"] = "JPPOWER.NS",
        ["NATL. ALUMINIUM"] = "NATIONALUM.NS",
        ["NATL ALUMINIUM"] = "NATIONALUM.NS",
        ["NATIONALUM"] = "NATIONALUM.NS",
        ["I O C L"] = "IOC.NS",
        ["IOCL"] = "IOC.NS",
        ["IOC"] = "IOC.NS",
        ["FIRSTCRY"] = "FIRSTCRY.NS",
        ["TRANSRAILL"] = "TRANSRAILL.NS",
        ["BHARATCOAL"] = "BHARATCOAL.NS"
    };

    private static string NormalizeTicker(string ticker)
    {
        var clean = ticker.Trim().ToUpperInvariant();
        if (clean.StartsWith("NSE:", StringComparison.OrdinalIgnoreCase))
            clean = clean[4..];
        else if (clean.StartsWith("BSE:", StringComparison.OrdinalIgnoreCase))
            clean = clean[4..];

        if (clean.EndsWith(".NS", StringComparison.OrdinalIgnoreCase))
            clean = clean[..^3];
        else if (clean.EndsWith(".BO", StringComparison.OrdinalIgnoreCase))
            clean = clean[..^3];
        return clean.Trim();
    }

    private string? _crumb;
    private DateTime _crumbFetchedAt = DateTime.MinValue;
    private readonly SemaphoreSlim _crumbLock = new(1, 1);

    public YahooFinanceLiveStockDataProvider()
    {
        _cookieContainer = new CookieContainer();
        var handler = new SocketsHttpHandler
        {
            CookieContainer = _cookieContainer,
            UseCookies = true,
            AutomaticDecompression = DecompressionMethods.All,
            PooledConnectionLifetime = TimeSpan.FromMinutes(15)
        };

        _httpClient = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(15)
        };
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        _httpClient.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
    }

    public async Task<Stock?> GetStockAsync(string ticker)
    {
        var list = await GetStocksAsync([ticker]);
        return list.FirstOrDefault();
    }

    public async Task<IReadOnlyList<Stock>> GetStocksAsync(IEnumerable<string> tickers)
    {
        var tickerList = tickers.Where(t => !string.IsNullOrWhiteSpace(t))
                                .Select(NormalizeTicker)
                                .Where(t => !string.IsNullOrWhiteSpace(t))
                                .Distinct()
                                .ToList();

        if (tickerList.Count == 0) return [];

        var results = new List<Stock>();
        var missingTickers = new List<string>();

        // 1. Check in-memory cache
        var now = DateTime.UtcNow;
        foreach (var t in tickerList)
        {
            if (_cache.TryGetValue(t, out var cached) && (now - cached.FetchedAt) < _cacheDuration)
            {
                results.Add(cached.Stock);
            }
            else
            {
                missingTickers.Add(t);
            }
        }

        if (missingTickers.Count == 0)
        {
            return results;
        }

        // 2. Fetch live batch from Yahoo Finance with URL-encoded symbols & alias resolution
        try
        {
            var crumb = await EnsureCrumbAsync();
            if (!string.IsNullOrEmpty(crumb))
            {
                const int batchSize = 30;
                for (int i = 0; i < missingTickers.Count; i += batchSize)
                {
                    var chunk = missingTickers.Skip(i).Take(batchSize).ToList();

                    // Build query symbols & bidirectional reverse lookup map
                    var reverseMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    var querySymbols = new List<string>();

                    foreach (var t in chunk)
                    {
                        string qSymbol;
                        if (SymbolAliases.TryGetValue(t, out var alias))
                        {
                            qSymbol = alias;
                            var rawClean = Uri.UnescapeDataString(alias).Replace(".NS", "").Replace(".BO", "");
                            reverseMap[rawClean] = t;
                        }
                        else
                        {
                            qSymbol = Uri.EscapeDataString(t) + ".NS";
                        }

                        reverseMap[t] = t;
                        querySymbols.Add(qSymbol);
                    }

                    var symbolsStr = string.Join(",", querySymbols);
                    var url = $"https://query2.finance.yahoo.com/v7/finance/quote?symbols={symbolsStr}&crumb={crumb}";

                    try
                    {
                        var response = await _httpClient.GetAsync(url);
                        if (response.IsSuccessStatusCode)
                        {
                            var json = await response.Content.ReadAsStringAsync();
                            using var doc = JsonDocument.Parse(json);
                            if (doc.RootElement.TryGetProperty("quoteResponse", out var qr) &&
                                qr.TryGetProperty("result", out var items))
                            {
                                foreach (var item in items.EnumerateArray())
                                {
                                    var rawSymbol = item.GetProperty("symbol").GetString() ?? "";
                                    var cleanSymbol = rawSymbol.Replace(".NS", "").Replace(".BO", "");

                                    // Resolve back to original portfolio ticker
                                    var originalTicker = reverseMap.TryGetValue(cleanSymbol, out var orig)
                                        ? orig
                                        : cleanSymbol.ToUpperInvariant();

                                    if (item.TryGetProperty("regularMarketPrice", out var priceElem))
                                    {
                                        var livePrice = priceElem.GetDecimal();
                                        if (livePrice > 0)
                                        {
                                            var name = item.TryGetProperty("shortName", out var n) ? n.GetString() ?? originalTicker : originalTicker;
                                            decimal? pe = item.TryGetProperty("trailingPE", out var peElem) ? peElem.GetDecimal() : null;
                                            decimal? divYield = item.TryGetProperty("dividendYield", out var dyElem) ? dyElem.GetDecimal() : null;
                                            decimal? marketCap = item.TryGetProperty("marketCap", out var mcElem) ? mcElem.GetDecimal() : null;

                                            decimal? prevClose = item.TryGetProperty("regularMarketPreviousClose", out var prevElem) ? prevElem.GetDecimal() : null;
                                            if (!prevClose.HasValue && item.TryGetProperty("regularMarketChange", out var chElem))
                                            {
                                                prevClose = livePrice - chElem.GetDecimal();
                                            }

                                            var fallback = await _fallbackProvider.GetStockAsync(originalTicker);
                                            var sector = fallback?.Sector ?? Sector.Industrials;

                                            var stock = new Stock
                                            {
                                                Ticker = new Ticker(originalTicker),
                                                Name = fallback?.Name ?? name,
                                                Sector = sector
                                            };
                                            stock.UpdateMarketData(
                                                Money.INR(livePrice),
                                                pe ?? fallback?.PERatio,
                                                divYield ?? fallback?.DividendYield,
                                                marketCap ?? fallback?.MarketCap,
                                                prevClose.HasValue && prevClose.Value > 0 ? Money.INR(prevClose.Value) : null);

                                            _cache[originalTicker] = (stock, DateTime.UtcNow);
                                            results.Add(stock);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch
                    {
                        // Chunk failed; fallback will populate remaining
                    }
                }
            }
        }
        catch
        {
            // Network failure â€” fall through to fallback
        }

        // 3. For any remaining missing tickers, try crumb-free v8 chart API before falling back to MockStockDataProvider
        var foundTickers = results.Select(s => s.Ticker.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var stillMissing = tickerList.Where(t => !foundTickers.Contains(t)).ToList();

        if (stillMissing.Count > 0)
        {
            var chartTasks = stillMissing.Select(t => TryFetchFromChartApiAsync(t));
            var chartResults = await Task.WhenAll(chartTasks);
            foreach (var cs in chartResults.Where(s => s is not null))
            {
                _cache[cs!.Ticker.Value] = (cs, DateTime.UtcNow);
                results.Add(cs);
                foundTickers.Add(cs.Ticker.Value);
            }
            stillMissing = tickerList.Where(t => !foundTickers.Contains(t)).ToList();
        }

        if (stillMissing.Count > 0)
        {
            var fallbackStocks = await _fallbackProvider.GetStocksAsync(stillMissing);
            foreach (var fs in fallbackStocks)
            {
                _cache[fs.Ticker.Value] = (fs, DateTime.UtcNow);
                results.Add(fs);
            }
        }

        return results;
    }

    private async Task<Stock?> TryFetchFromChartApiAsync(string originalTicker)
    {
        try
        {
            string qSymbol = SymbolAliases.TryGetValue(originalTicker, out var alias)
                ? alias
                : Uri.EscapeDataString(originalTicker) + ".NS";

            var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{qSymbol}?range=5d&interval=1d";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0");

            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            using var res = await _httpClient.SendAsync(req, cts.Token);
            if (!res.IsSuccessStatusCode) return null;

            using var doc = await JsonDocument.ParseAsync(await res.Content.ReadAsStreamAsync(cts.Token), cancellationToken: cts.Token);
            var result = doc.RootElement.GetProperty("chart").GetProperty("result")[0];
            var meta = result.GetProperty("meta");

            if (!meta.TryGetProperty("regularMarketPrice", out var priceElem) || !priceElem.TryGetDecimal(out var livePrice) || livePrice <= 0)
                return null;

            decimal? prevClose = null;
            if (result.TryGetProperty("indicators", out var ind) &&
                ind.TryGetProperty("quote", out var quotes) &&
                quotes.GetArrayLength() > 0 &&
                quotes[0].TryGetProperty("close", out var closes))
            {
                var validCloses = new List<decimal>();
                foreach (var c in closes.EnumerateArray())
                {
                    if (c.ValueKind == JsonValueKind.Number && c.TryGetDecimal(out var cv) && cv > 0)
                        validCloses.Add(cv);
                }
                if (validCloses.Count >= 2)
                    prevClose = validCloses[^2];
            }

            if (!prevClose.HasValue && meta.TryGetProperty("chartPreviousClose", out var cpElem) && cpElem.TryGetDecimal(out var cp) && cp > 0)
                prevClose = cp;

            var name = meta.TryGetProperty("shortName", out var sn) ? sn.GetString() ?? originalTicker : originalTicker;
            var fallback = await _fallbackProvider.GetStockAsync(originalTicker);
            var sector = fallback?.Sector ?? Sector.Industrials;

            var stock = new Stock
            {
                Ticker = new Ticker(originalTicker),
                Name = fallback?.Name ?? name,
                Sector = sector
            };
            stock.UpdateMarketData(
                Money.INR(livePrice),
                fallback?.PERatio,
                fallback?.DividendYield,
                fallback?.MarketCap,
                prevClose.HasValue && prevClose.Value > 0 ? Money.INR(prevClose.Value) : Money.INR(livePrice));

            return stock;
        }
        catch
        {
            return null;
        }
    }

    private async Task<string?> EnsureCrumbAsync()
    {
        if (!string.IsNullOrEmpty(_crumb) && (DateTime.UtcNow - _crumbFetchedAt).TotalHours < 6)
        {
            return _crumb;
        }

        await _crumbLock.WaitAsync();
        try
        {
            if (!string.IsNullOrEmpty(_crumb) && (DateTime.UtcNow - _crumbFetchedAt).TotalHours < 6)
            {
                return _crumb;
            }

            try
            {
                await _httpClient.GetAsync("https://fc.yahoo.com");
            }
            catch {}

            var crumbResponse = await _httpClient.GetAsync("https://query2.finance.yahoo.com/v1/test/getcrumb");
            if (crumbResponse.IsSuccessStatusCode)
            {
                var crumb = await crumbResponse.Content.ReadAsStringAsync();
                crumb = crumb.Trim();
                if (!string.IsNullOrEmpty(crumb) && crumb.Length < 30)
                {
                    _crumb = crumb;
                    _crumbFetchedAt = DateTime.UtcNow;
                    return _crumb;
                }
            }
        }
        catch {}
        finally
        {
            _crumbLock.Release();
        }

        return null;
    }

    public void ClearCache()
    {
        _cache.Clear();
    }

    public void Dispose()
    {
        _httpClient.Dispose();
        _crumbLock.Dispose();
    }
}
