using Microsoft.AspNetCore.Mvc;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StocksController(
    StockEvaluationService stockEvaluationService,
    IChartPatternRecognitionService chartPatternService) : ControllerBase
{
    [HttpGet("{ticker}")]
    public async Task<ActionResult<StockEvaluationDetailDto>> GetStock(string ticker)
    {
        var stock = await stockEvaluationService.EvaluateAsync(ticker);
        if (stock is null)
            return NotFound(new { error = $"Stock with ticker '{ticker.ToUpperInvariant()}' not found." });

        return Ok(stock);
    }

    [HttpGet("{ticker}/chart")]
    public async Task<ActionResult<StockChartData>> GetStockChart(
        string ticker,
        [FromQuery] string range = "1y",
        [FromQuery] decimal? marginOfSafety = null,
        CancellationToken ct = default)
    {
        if (!marginOfSafety.HasValue)
        {
            var evaluation = await stockEvaluationService.EvaluateAsync(ticker);
            if (evaluation != null)
            {
                marginOfSafety = evaluation.MarginOfSafetyPercent;
            }
        }

        var chartData = await chartPatternService.GetStockChartDataAsync(ticker, range, marginOfSafety, ct);
        return Ok(chartData);
    }
}
