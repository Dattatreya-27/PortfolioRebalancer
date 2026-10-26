using Microsoft.AspNetCore.Mvc;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/theory-portfolios")]
public sealed class TheoryPortfoliosController(
    ITheoryPortfolioService theoryPortfolioService,
    IPortfolioTheoryAuditService theoryAuditService) : ControllerBase
{
    public record AddJournalNoteRequest(string Note);

    /// <summary>
    /// Audits an investor's real portfolio against the 3 academic market theories.
    /// Identifies Theory Champions, Near-Misses, and Toxic Laggards to prune.
    /// </summary>
    [HttpGet("audit/{portfolioId:guid}")]
    public async Task<ActionResult<PortfolioTheoryAuditSummaryDto>> AuditPortfolio(
        Guid portfolioId,
        CancellationToken ct = default)
    {
        var audit = await theoryAuditService.AuditPortfolioAsync(portfolioId, ct);
        if (audit == null)
        {
            return NotFound(new { error = $"Portfolio with ID '{portfolioId}' not found." });
        }
        return Ok(audit);
    }

    /// <summary>
    /// Simulates swapping an underperforming portfolio holding with a theory champion leader.
    /// Returns exact mathematical deltas on ROCE, Beta, Debt, RS, and sector concentration.
    /// </summary>
    [HttpPost("simulate-swap")]
    public async Task<ActionResult<PortfolioSwapResultDto>> SimulateSwap(
        [FromBody] PortfolioSwapRequestDto request,
        CancellationToken ct = default)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ExitTicker) || string.IsNullOrWhiteSpace(request.TargetTicker))
        {
            return BadRequest(new { error = "ExitTicker and TargetTicker must be provided." });
        }

        var result = await theoryAuditService.SimulateSwapAsync(request.PortfolioId, request.ExitTicker, request.TargetTicker, ct);
        if (result == null)
        {
            return NotFound(new { error = $"Could not simulate swap. Ensure portfolio '{request.PortfolioId}' exists and contains '{request.ExitTicker}'." });
        }

        return Ok(result);
    }

    /// <summary>
    /// Computes full-time investor cross-asset correlation matrix, diversification ratio,
    /// and hidden cluster risks for the portfolio.
    /// </summary>
    [HttpGet("correlation-matrix/{portfolioId:guid}")]
    public async Task<ActionResult<PortfolioCorrelationMatrixDto>> GetCorrelationMatrix(
        Guid portfolioId,
        [FromQuery] int topN = 10,
        CancellationToken ct = default)
    {
        var result = await theoryAuditService.GetCorrelationMatrixAsync(portfolioId, topN, ct);
        if (result == null)
        {
            return NotFound(new { error = $"Portfolio with ID '{portfolioId}' not found or has no holdings." });
        }

        return Ok(result);
    }

    /// <summary>
    /// Stress-tests portfolio holdings against macroeconomic shocks (Crude surge, INR drop, RBI rate hike)
    /// leveraging input-output supply chain transmissions.
    /// </summary>
    [HttpGet("macro-stress-test/{portfolioId:guid}")]
    public async Task<ActionResult<MacroStressTestResultDto>> GetMacroStressTest(
        Guid portfolioId,
        [FromQuery] string scenario = "crude_surge",
        CancellationToken ct = default)
    {
        var result = await theoryAuditService.SimulateMacroStressTestAsync(portfolioId, scenario, ct);
        if (result == null)
        {
            return NotFound(new { error = $"Portfolio with ID '{portfolioId}' not found or has no holdings." });
        }

        return Ok(result);
    }

    /// <summary>
    /// Gets the mock portfolio tracking incubator dashboard across all 3 academic theories.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<TheoryIncubatorDashboardDto>> GetDashboard(
        [FromQuery] bool refresh = false,
        CancellationToken ct = default)
    {
        var dashboard = await theoryPortfolioService.GetIncubatorDashboardAsync(refresh, ct);
        return Ok(dashboard);
    }

    /// <summary>
    /// Gets detailed metrics and holdings for a single market theory portfolio.
    /// </summary>
    [HttpGet("{strategyId}")]
    public async Task<ActionResult<TheoryPortfolio>> GetStrategy(
        string strategyId,
        CancellationToken ct = default)
    {
        var portfolio = await theoryPortfolioService.GetTheoryPortfolioAsync(strategyId, ct);
        if (portfolio == null)
        {
            return NotFound(new { error = $"Strategy '{strategyId}' not found in mock incubator." });
        }
        return Ok(portfolio);
    }

    /// <summary>
    /// Forces real-time market quote refresh across all constituents in the 3 mock portfolios.
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<TheoryIncubatorDashboardDto>> RefreshQuotes(CancellationToken ct = default)
    {
        var dashboard = await theoryPortfolioService.GetIncubatorDashboardAsync(forceRefresh: true, ct);
        return Ok(dashboard);
    }

    /// <summary>
    /// Appends a new paper trading observation or thesis validation note to a theory portfolio.
    /// </summary>
    [HttpPost("{strategyId}/notes")]
    public async Task<IActionResult> AddJournalNote(
        string strategyId,
        [FromBody] AddJournalNoteRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request?.Note))
        {
            return BadRequest(new { error = "Note text cannot be empty." });
        }

        var success = await theoryPortfolioService.AddJournalNoteAsync(strategyId, request.Note, ct);
        if (!success)
        {
            return NotFound(new { error = $"Strategy '{strategyId}' not found." });
        }

        return Ok(new { message = "Research journal note appended successfully." });
    }
}
