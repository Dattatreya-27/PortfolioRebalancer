using Microsoft.AspNetCore.Mvc;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Api.Controllers;

[ApiController]
[Route("api/alerts")]
public sealed class PriceAlertsController : ControllerBase
{
    private readonly IPriceAlertService _priceAlertService;
    private readonly IEmailNotificationService _emailNotificationService;
    private readonly ILogger<PriceAlertsController> _logger;

    public PriceAlertsController(
        IPriceAlertService priceAlertService,
        IEmailNotificationService emailNotificationService,
        ILogger<PriceAlertsController> logger)
    {
        _priceAlertService = priceAlertService;
        _emailNotificationService = emailNotificationService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PriceAlert>>> GetAlerts()
    {
        var alerts = await _priceAlertService.GetAllAlertsAsync();
        return Ok(alerts);
    }

    [HttpPost]
    public async Task<ActionResult<PriceAlert>> CreateAlert([FromBody] CreatePriceAlertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Ticker))
        {
            return BadRequest(new { message = "Stock ticker symbol is required." });
        }

        if (request.TargetPrice <= 0)
        {
            return BadRequest(new { message = "Target price must be greater than zero." });
        }

        var alert = await _priceAlertService.CreateAlertAsync(
            ticker: request.Ticker,
            targetPrice: request.TargetPrice,
            direction: request.Direction,
            recipientEmail: request.RecipientEmail ?? string.Empty,
            notes: request.Notes);

        return Ok(alert);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAlert(string id)
    {
        bool success = await _priceAlertService.DeleteAlertAsync(id);
        if (!success)
        {
            return NotFound(new { message = $"Price alert with id '{id}' not found." });
        }
        return NoContent();
    }

    [HttpPost("{id}/toggle")]
    public async Task<IActionResult> ToggleAlert(string id, [FromQuery] bool active = true)
    {
        bool success = await _priceAlertService.ToggleAlertStatusAsync(id, active);
        if (!success)
        {
            return NotFound(new { message = $"Price alert with id '{id}' not found." });
        }
        return Ok(new { message = $"Alert status updated to {(active ? "Active" : "Cancelled")}." });
    }

    [HttpPost("evaluate-now")]
    public async Task<IActionResult> EvaluateNow()
    {
        int triggered = await _priceAlertService.EvaluateAlertsAsync();
        var status = await _priceAlertService.GetMarketHoursStatusAsync();
        return Ok(new { 
            triggeredCount = triggered,
            message = triggered > 0 
                ? $"Surveillance evaluation completed: {triggered} alert(s) triggered and dispatched." 
                : "Surveillance evaluation completed: No alert threshold crossings detected.",
            marketStatus = status
        });
    }

    [HttpGet("status")]
    public async Task<ActionResult<MarketHoursStatus>> GetStatus()
    {
        var status = await _priceAlertService.GetMarketHoursStatusAsync();
        return Ok(status);
    }

    [HttpGet("settings")]
    public async Task<ActionResult<EmailSettings>> GetSettings()
    {
        var settings = await _emailNotificationService.GetEmailSettingsAsync();
        return Ok(settings);
    }

    [HttpPost("settings")]
    public async Task<IActionResult> SaveSettings([FromBody] EmailSettings settings)
    {
        await _emailNotificationService.UpdateEmailSettingsAsync(settings);
        return Ok(new { message = "Notification and email settings saved successfully.", settings });
    }

    [HttpPost("test-email")]
    public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RecipientEmail))
        {
            return BadRequest(new { message = "Recipient email address is required." });
        }

        bool success = await _emailNotificationService.SendTestEmailAsync(request.RecipientEmail);
        return Ok(new { 
            success, 
            message = success 
                ? $"Test alert verification delivered to {request.RecipientEmail}." 
                : "Failed sending test email via SMTP. Check server logs or configure SMTP credentials." 
        });
    }
}

public sealed record CreatePriceAlertRequest(
    string Ticker,
    decimal TargetPrice,
    AlertDirection Direction,
    string? RecipientEmail = null,
    string? Notes = null
);

public sealed record TestEmailRequest(
    string RecipientEmail
);
