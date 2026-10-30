using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Application.Services;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortfoliosController(
    PortfolioService portfolioService,
    PortfolioDiagnosticService diagnosticService,
    PortfolioAdvisoryService advisoryService,
    MarketTheoryResearchService researchService,
    DailyStockTradingEngine tradingEngine,
    IChartPatternRecognitionService chartPatternService,
    IMemoryCache cache) : ControllerBase
{
    private void InvalidatePortfolioCache(Guid id)
    {
        cache.Remove($"portfolio_summary_{id}");
        cache.Remove($"portfolio_diagnostics_{id}");
        cache.Remove($"portfolio_advisory_{id}");
        cache.Remove($"portfolio_research_{id}");
        cache.Remove($"portfolio_radar_{id}");
        cache.Remove($"portfolio_trading_ideas_{id}");
        cache.Remove("portfolio_all_summaries");
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PortfolioSummaryDto>>> GetAll()
    {
        const string cacheKey = "portfolio_all_summaries";
        if (cache.TryGetValue(cacheKey, out IReadOnlyList<PortfolioSummaryDto>? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var portfolios = await portfolioService.GetAllPortfoliosAsync();
        cache.Set(cacheKey, portfolios, TimeSpan.FromSeconds(15));
        return Ok(portfolios);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PortfolioSummaryDto>> GetById(Guid id)
    {
        var cacheKey = $"portfolio_summary_{id}";
        if (cache.TryGetValue(cacheKey, out PortfolioSummaryDto? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var portfolio = await portfolioService.GetPortfolioAsync(id);
        if (portfolio is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        cache.Set(cacheKey, portfolio, TimeSpan.FromSeconds(30));
        return Ok(portfolio);
    }

    [HttpPost]
    public async Task<ActionResult<PortfolioSummaryDto>> Create([FromBody] CreatePortfolioRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Portfolio name cannot be empty." });

        var created = await portfolioService.CreatePortfolioAsync(request.Name);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPost("{id:guid}/holdings")]
    public async Task<ActionResult<PortfolioSummaryDto>> AddHolding(Guid id, [FromBody] AddHoldingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Ticker))
            return BadRequest(new { error = "Ticker cannot be empty." });

        if (request.Quantity <= 0)
            return BadRequest(new { error = "Quantity must be greater than zero." });

        try
        {
            var updated = await portfolioService.AddHoldingAsync(id, request.Ticker, request.Quantity, request.BuyPrice);
            if (updated is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/sync-live")]
    public async Task<ActionResult<PortfolioSummaryDto>> SyncLiveQuotes(Guid id)
    {
        var updated = await portfolioService.SyncLiveQuotesAsync(id);
        if (updated is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        InvalidatePortfolioCache(id);
        return Ok(updated);
    }

    [HttpPost("{id:guid}/holdings/batch")]
    public async Task<ActionResult<PortfolioSummaryDto>> AddHoldingsBatch(Guid id, [FromBody] BatchAddHoldingsRequest request)
    {
        if (request.Holdings is null || request.Holdings.Count == 0)
            return BadRequest(new { error = "Holdings list cannot be empty." });

        var updated = await portfolioService.AddHoldingsBatchAsync(id, request.Holdings);
        if (updated is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        InvalidatePortfolioCache(id);
        return Ok(updated);
    }

    [HttpDelete("{id:guid}/holdings/{ticker}")]
    public async Task<ActionResult<PortfolioSummaryDto>> RemoveHolding(Guid id, string ticker)
    {
        var updated = await portfolioService.RemoveHoldingAsync(id, ticker);
        if (updated is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        InvalidatePortfolioCache(id);
        return Ok(updated);
    }

    [HttpPost("{id:guid}/trades")]
    public async Task<ActionResult<PortfolioSummaryDto>> ExecuteTrade(Guid id, [FromBody] ExecuteTradeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Ticker))
            return BadRequest(new { error = "Ticker cannot be empty." });

        if (request.Quantity <= 0)
            return BadRequest(new { error = "Quantity must be greater than zero." });

        if (request.TradePrice <= 0)
            return BadRequest(new { error = "Trade price must be greater than zero." });

        try
        {
            var updated = await portfolioService.ExecuteTradeAsync(
                id, request.Ticker, request.Action, request.Quantity, request.TradePrice);

            if (updated is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(updated);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/trade-analytics")]
    public async Task<ActionResult<TradeAnalyticsDto>> GetTradeAnalytics(Guid id)
    {
        var analytics = await portfolioService.GetTradeAnalyticsAsync(id);
        if (analytics is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        return Ok(analytics);
    }

    [HttpPost("{id:guid}/import-tradebook")]
    public async Task<ActionResult<BrokerTradebookImportResultDto>> ImportTradebookFile(
        Guid id,
        IFormFile file,
        [FromForm] string? password = null,
        [FromForm] bool clearExisting = false)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Please select a valid Zerodha or Angel One tradebook file." });

        try
        {
            using var stream = file.OpenReadStream();
            var result = await portfolioService.ImportBrokerTradebookAsync(
                id, stream, file.FileName, password, clearExisting);

            if (result is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}/holdings/{ticker}")]
    public async Task<ActionResult<PortfolioSummaryDto>> UpdateHolding(Guid id, string ticker, [FromBody] UpdateHoldingRequest request)
    {
        if (string.IsNullOrWhiteSpace(ticker))
            return BadRequest(new { error = "Ticker cannot be empty." });

        if (request.Quantity < 0)
            return BadRequest(new { error = "Quantity cannot be negative." });

        if (request.BuyPrice <= 0 && request.Quantity > 0)
            return BadRequest(new { error = "Buy price must be greater than zero." });

        try
        {
            var updated = await portfolioService.UpdateHoldingAsync(id, ticker, request.Quantity, request.BuyPrice);
            if (updated is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(updated);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/sync-angelone")]
    public async Task<ActionResult<PortfolioSummaryDto>> SyncAngelOne(Guid id, [FromBody] AngelOneSyncRequest request)
    {
        if (request.Holdings is null)
            return BadRequest(new { error = "Holdings list cannot be null." });

        try
        {
            var updated = await portfolioService.SyncAngelOneHoldingsAsync(id, request.Holdings);
            if (updated is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(updated);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Imports holdings from Zerodha (Console/Kite CSV or Excel) or Angel One (Demat Excel),
    /// supporting smart-merging (weighted avg cost recalculation), separate portfolio creation, or overwrite.
    /// </summary>
    [HttpPost("import-broker")]
    public async Task<ActionResult<BrokerImportResponseDto>> ImportBrokerFile(
        [FromForm] IFormFile file,
        [FromForm] Guid? portfolioId = null,
        [FromForm] string mode = "Merge",
        [FromForm] string? newPortfolioName = null,
        [FromForm] string? password = null,
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "Please select a valid Zerodha (CSV/Excel) or Angel One file to upload." });
        }

        if (!Enum.TryParse<BrokerImportMode>(mode, ignoreCase: true, out var importMode))
        {
            importMode = BrokerImportMode.Merge;
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = await portfolioService.ImportBrokerHoldingsAsync(
                portfolioId,
                stream,
                file.FileName,
                importMode,
                newPortfolioName,
                password,
                ct);

            if (result == null)
            {
                return NotFound(new { error = $"Target portfolio with ID '{portfolioId}' not found." });
            }

            if (portfolioId.HasValue)
            {
                InvalidatePortfolioCache(portfolioId.Value);
            }
            InvalidatePortfolioCache(result.PortfolioId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/upload-excel")]
    public async Task<ActionResult<PortfolioSummaryDto>> UploadExcel(Guid id, IFormFile file, [FromForm] string? password = null)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Please select a valid Angel One Excel (.xlsx) file to upload." });

        try
        {
            using var stream = file.OpenReadStream();
            var updated = await portfolioService.ImportAngelOneExcelAsync(id, stream, password);
            if (updated is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/import-angel-excel")]
    public async Task<ActionResult<object>> ImportAngelExcel(Guid id, [FromBody] ImportAngelOneFileRequest? request)
    {
        string? targetPath = request?.FilePath;

        if (string.IsNullOrWhiteSpace(targetPath))
        {
            var downloadsDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
            if (Directory.Exists(downloadsDir))
            {
                var files = Directory.GetFiles(downloadsDir, "*Holding*Details*.xlsx")
                                     .Concat(Directory.GetFiles(downloadsDir, "*D200136*.xlsx"))
                                     .Distinct()
                                     .Select(f => new FileInfo(f))
                                     .OrderByDescending(f => f.LastWriteTimeUtc)
                                     .ToList();

                if (files.Count > 0)
                {
                    targetPath = files[0].FullName;
                }
            }
        }

        if (string.IsNullOrWhiteSpace(targetPath) || !System.IO.File.Exists(targetPath))
        {
            return BadRequest(new { error = $"Angel One Excel file not found. Checked: '{targetPath ?? "Downloads folder"}'." });
        }

        try
        {
            using var stream = System.IO.File.OpenRead(targetPath);
            var updated = await portfolioService.ImportAngelOneExcelAsync(id, stream, request?.Password);
            if (updated is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(new
            {
                portfolio = updated,
                sourceFile = targetPath,
                positionsImported = updated.Holdings.Count
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/rebalance")]
    public async Task<ActionResult<RebalanceRecommendationDto>> Rebalance(Guid id, [FromBody] RebalanceRequest request)
    {
        if (request.TargetAllocations is null || request.TargetAllocations.Count == 0)
            return BadRequest(new { error = "At least one target allocation must be provided." });

        try
        {
            var recommendation = await portfolioService.RebalanceAsync(id, request.TargetAllocations);
            if (recommendation is null)
                return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

            InvalidatePortfolioCache(id);
            return Ok(recommendation);
        }
        catch (Exception ex) when (ex is InvalidOperationException or ArgumentException)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/diagnostics")]
    public async Task<ActionResult<PortfolioDiagnosticsDto>> GetDiagnostics(Guid id)
    {
        var cacheKey = $"portfolio_diagnostics_{id}";
        if (cache.TryGetValue(cacheKey, out PortfolioDiagnosticsDto? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var diagnostics = await diagnosticService.RunDiagnosticsAsync(id);
        if (diagnostics is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        cache.Set(cacheKey, diagnostics, TimeSpan.FromSeconds(60));
        return Ok(diagnostics);
    }

    [HttpGet("{id:guid}/advisory")]
    public async Task<ActionResult<FinancialAdvisoryReportDto>> GetAdvisoryReport(Guid id)
    {
        var cacheKey = $"portfolio_advisory_{id}";
        if (cache.TryGetValue(cacheKey, out FinancialAdvisoryReportDto? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var report = await advisoryService.GenerateAdvisoryReportAsync(id);
        if (report is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        cache.Set(cacheKey, report, TimeSpan.FromMinutes(2));
        return Ok(report);
    }

    [HttpGet("{id:guid}/research")]
    public async Task<ActionResult<MasterResearchReportDto>> GetResearchReport(Guid id)
    {
        var cacheKey = $"portfolio_research_{id}";
        if (cache.TryGetValue(cacheKey, out MasterResearchReportDto? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var report = await researchService.GenerateResearchReportAsync(id);
        if (report is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        cache.Set(cacheKey, report, TimeSpan.FromMinutes(2));
        return Ok(report);
    }

    [HttpGet("{id:guid}/swing-radar")]
    public async Task<ActionResult<PortfolioSwingRadarDto>> GetPortfolioSwingRadar(Guid id, CancellationToken ct = default)
    {
        var cacheKey = $"portfolio_radar_{id}";
        if (cache.TryGetValue(cacheKey, out PortfolioSwingRadarDto? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var portfolio = await portfolioService.GetPortfolioAsync(id);
        if (portfolio is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        var activeSetups = new ConcurrentBag<PortfolioHoldingSwingDto>();
        var formingSetups = new ConcurrentBag<PortfolioHoldingSwingDto>();
        var stage2Leaders = new ConcurrentBag<PortfolioHoldingSwingDto>();
        var stage4Risks = new ConcurrentBag<PortfolioHoldingSwingDto>();

        await Parallel.ForEachAsync(portfolio.Holdings, new ParallelOptions
        {
            MaxDegreeOfParallelism = 8,
            CancellationToken = ct
        }, async (h, token) =>
        {
            try
            {
                var chartData = await chartPatternService.GetStockChartDataAsync(h.Ticker, "1y", ct: token);
                var tf = chartData.TechnoFunda;
                var swing = tf.SwingSignal;

                bool isStage4 = tf.TimingVerdict.Contains("FALLING KNIFE", StringComparison.OrdinalIgnoreCase) ||
                                tf.TimingVerdict.Contains("VALUE TRAP", StringComparison.OrdinalIgnoreCase) ||
                                h.UnrealizedPnLPercent <= -20.0m ||
                                tf.Patterns.Any(p => p.Name.Contains("Falling Knife") || p.Category == "Warning");

                var item = new PortfolioHoldingSwingDto(
                    Ticker: h.Ticker,
                    Name: h.Name,
                    Sector: h.Sector,
                    Quantity: h.Quantity,
                    BuyPrice: h.BuyPrice,
                    CurrentPrice: chartData.CurrentPrice > 0 ? chartData.CurrentPrice : h.Price,
                    UnrealizedPnL: h.UnrealizedPnL,
                    UnrealizedPnLPercent: h.UnrealizedPnLPercent,
                    WeightPercent: h.WeightPercent,
                    SwingSignal: swing,
                    TimingVerdict: tf.TimingVerdict,
                    ActionRecommendation: tf.ActionRecommendation,
                    ActionTone: tf.ActionTone,
                    IsStage2Uptrend: tf.IsStage2Uptrend,
                    IsStage4Risk: isStage4
                );

                if (swing != null && swing.Status == "TRIGGERED")
                {
                    activeSetups.Add(item);
                }
                else if (swing != null && swing.Status == "FORMING")
                {
                    formingSetups.Add(item);
                }
                else if (tf.IsStage2Uptrend)
                {
                    stage2Leaders.Add(item);
                }

                if (isStage4)
                {
                    stage4Risks.Add(item);
                }
            }
            catch
            {
                // Continue scanning remaining holdings
            }
        });

        var result = new PortfolioSwingRadarDto(
            PortfolioId: portfolio.Id,
            PortfolioName: portfolio.Name,
            TotalHoldingsCount: portfolio.Holdings.Count,
            ActiveSetupsCount: activeSetups.Count,
            FormingSetupsCount: formingSetups.Count,
            Stage4RiskCount: stage4Risks.Count,
            ActiveSetups: activeSetups.OrderByDescending(x => x.WeightPercent).ToList(),
            FormingSetups: formingSetups.OrderByDescending(x => x.WeightPercent).ToList(),
            Stage2Leaders: stage2Leaders.OrderByDescending(x => x.WeightPercent).ToList(),
            Stage4Risks: stage4Risks.OrderBy(x => x.UnrealizedPnLPercent).ToList()
        );

        cache.Set(cacheKey, result, TimeSpan.FromMinutes(1));
        return Ok(result);
    }

    [HttpGet("{id:guid}/daily-trading-ideas")]
    public async Task<ActionResult<DailyTradingRadarDto>> GetDailyTradingIdeas(Guid id, CancellationToken ct = default)
    {
        string cacheKey = $"portfolio_trading_ideas_{id}";
        if (cache.TryGetValue(cacheKey, out DailyTradingRadarDto? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var ideas = await tradingEngine.ScanPortfolioDailyIdeasAsync(id, ct);
        if (ideas is null)
        {
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });
        }

        cache.Set(cacheKey, ideas, TimeSpan.FromMinutes(2));
        return Ok(ideas);
    }
}
