using Microsoft.AspNetCore.Mvc;
using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Services;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MacroController(
    MacroIntelligenceService macroService,
    PolicyImpactService policyService) : ControllerBase
{
    [HttpGet("indicators")]
    public async Task<ActionResult<MacroDashboardDto>> GetMacroIndicators(
        [FromQuery] Guid? portfolioId = null,
        CancellationToken ct = default)
    {
        var result = await macroService.GetMacroDashboardAsync(portfolioId, ct);
        return Ok(result);
    }

    [HttpGet("policies")]
    public async Task<ActionResult<PortfolioPolicyImpactMapDto>> GetPolicyImpacts(
        [FromQuery] Guid? portfolioId = null,
        CancellationToken ct = default)
    {
        var result = await policyService.GetPolicyImpactMapAsync(portfolioId, ct);
        return Ok(result);
    }
}
