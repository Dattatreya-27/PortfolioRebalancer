using Microsoft.AspNetCore.Mvc;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortfoliosController(
    PortfolioService portfolioService,
    PortfolioDiagnosticService diagnosticService,
    PortfolioAdvisoryService advisoryService,
    MarketTheoryResearchService researchService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PortfolioSummaryDto>>> GetAll()
    {
        var portfolios = await portfolioService.GetAllPortfoliosAsync();
        return Ok(portfolios);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PortfolioSummaryDto>> GetById(Guid id)
    {
        var portfolio = await portfolioService.GetPortfolioAsync(id);
        if (portfolio is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

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

        return Ok(updated);
    }

    [HttpDelete("{id:guid}/holdings/{ticker}")]
    public async Task<ActionResult<PortfolioSummaryDto>> RemoveHolding(Guid id, string ticker)
    {
        var updated = await portfolioService.RemoveHoldingAsync(id, ticker);
        if (updated is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

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

            return Ok(updated);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
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

            return Ok(updated);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
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
        var diagnostics = await diagnosticService.RunDiagnosticsAsync(id);
        if (diagnostics is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        return Ok(diagnostics);
    }

    [HttpGet("{id:guid}/advisory")]
    public async Task<ActionResult<FinancialAdvisoryReportDto>> GetAdvisoryReport(Guid id)
    {
        var report = await advisoryService.GenerateAdvisoryReportAsync(id);
        if (report is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        return Ok(report);
    }

    [HttpGet("{id:guid}/research")]
    public async Task<ActionResult<MasterResearchReportDto>> GetResearchReport(Guid id)
    {
        var report = await researchService.GenerateResearchReportAsync(id);
        if (report is null)
            return NotFound(new { error = $"Portfolio with ID '{id}' not found." });

        return Ok(report);
    }
}
