using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StocksController(
    StockEvaluationService stockEvaluationService,
    IChartPatternRecognitionService chartPatternService,
    QuarterlyEarningsService quarterlyEarningsService,
    PolicyImpactService policyImpactService,
    IMemoryCache cache) : ControllerBase
{
    private static string NormalizeTicker(string ticker)
    {
        var clean = (ticker ?? string.Empty).Trim().ToUpperInvariant();
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

    [HttpGet("{ticker}")]
    public async Task<ActionResult<StockEvaluationDetailDto>> GetStock(string ticker)
    {
        var normalizedTicker = NormalizeTicker(ticker);
        if (string.IsNullOrWhiteSpace(normalizedTicker))
            return BadRequest(new { error = "Ticker cannot be empty." });

        var cacheKey = $"stock_eval_{normalizedTicker}";
        if (cache.TryGetValue(cacheKey, out StockEvaluationDetailDto? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var stock = await stockEvaluationService.EvaluateAsync(normalizedTicker);
        if (stock is null)
            return NotFound(new { error = $"Stock with ticker '{normalizedTicker}' not found." });

        cache.Set(cacheKey, stock, TimeSpan.FromSeconds(60));
        return Ok(stock);
    }

    [HttpGet("{ticker}/chart")]
    public async Task<ActionResult<StockChartData>> GetStockChart(
        string ticker,
        [FromQuery] string range = "1y",
        [FromQuery] decimal? marginOfSafety = null,
        CancellationToken ct = default)
    {
        var normalizedTicker = NormalizeTicker(ticker);
        var cacheKey = $"stock_chart_{normalizedTicker}_{range}_{marginOfSafety}";
        if (cache.TryGetValue(cacheKey, out StockChartData? cached) && cached is not null)
        {
            return Ok(cached);
        }

        if (!marginOfSafety.HasValue)
        {
            var evaluation = await stockEvaluationService.EvaluateAsync(normalizedTicker);
            if (evaluation != null)
            {
                marginOfSafety = evaluation.MarginOfSafetyPercent;
            }
        }

        var chartData = await chartPatternService.GetStockChartDataAsync(normalizedTicker, range, marginOfSafety, ct);
        cache.Set(cacheKey, chartData, TimeSpan.FromSeconds(60));
        return Ok(chartData);
    }

    [HttpGet("swing-radar")]
    public async Task<ActionResult<IReadOnlyList<StockChartData>>> GetSwingRadar(CancellationToken ct = default)
    {
        const string cacheKey = "stocks_swing_radar_global";
        if (cache.TryGetValue(cacheKey, out IReadOnlyList<StockChartData>? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var radar = await chartPatternService.GetSwingRadarAsync(ct);
        cache.Set(cacheKey, radar, TimeSpan.FromSeconds(60));
        return Ok(radar);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<StockSearchResultDto>>> SearchStocks(
        [FromQuery] string? query,
        [FromQuery] Guid? portfolioId = null,
        CancellationToken ct = default)
    {
        var normalizedQuery = (query ?? string.Empty).Trim().ToUpperInvariant();
        var cacheKey = $"stocks_search_{normalizedQuery}_{portfolioId}";
        if (cache.TryGetValue(cacheKey, out IReadOnlyList<StockSearchResultDto>? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var results = await stockEvaluationService.SearchStocksAsync(query, portfolioId, ct);
        cache.Set(cacheKey, results, TimeSpan.FromSeconds(30));
        return Ok(results);
    }

    [HttpGet("{ticker}/earnings")]
    public async Task<ActionResult<QuarterlyEarningsSummaryDto>> GetStockEarnings(string ticker, CancellationToken ct = default)
    {
        var normalizedTicker = NormalizeTicker(ticker);
        if (string.IsNullOrWhiteSpace(normalizedTicker))
            return BadRequest(new { error = "Ticker cannot be empty." });

        var result = await quarterlyEarningsService.GetStockEarningsAsync(normalizedTicker, ct);
        return Ok(result);
    }

    [HttpGet("{ticker}/policy-impact")]
    public async Task<ActionResult<IReadOnlyList<PolicyHoldingImpactDto>>> GetStockPolicyImpacts(string ticker, CancellationToken ct = default)
    {
        var normalizedTicker = NormalizeTicker(ticker);
        if (string.IsNullOrWhiteSpace(normalizedTicker))
            return BadRequest(new { error = "Ticker cannot be empty." });

        var result = await policyImpactService.GetStockPolicyImpactsAsync(normalizedTicker, ct);
        return Ok(result);
    }
}
