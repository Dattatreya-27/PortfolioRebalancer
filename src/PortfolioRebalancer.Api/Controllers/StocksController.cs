using Microsoft.AspNetCore.Mvc;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StocksController(StockEvaluationService stockEvaluationService) : ControllerBase
{
    [HttpGet("{ticker}")]
    public async Task<ActionResult<StockEvaluationDetailDto>> GetStock(string ticker)
    {
        var stock = await stockEvaluationService.EvaluateAsync(ticker);
        if (stock is null)
            return NotFound(new { error = $"Stock with ticker '{ticker.ToUpperInvariant()}' not found." });

        return Ok(stock);
    }
}
