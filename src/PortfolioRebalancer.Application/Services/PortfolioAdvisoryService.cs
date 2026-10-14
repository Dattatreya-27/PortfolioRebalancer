using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Wealth Advisory service generating actionable target exit levels,
/// profit-booking candidates, and tail-end portfolio consolidation advice.
/// </summary>
public sealed class PortfolioAdvisoryService(
    IPortfolioRepository repository,
    IStockDataProvider stockProvider)
{
    private static readonly Dictionary<string, (decimal TargetPrice, string Urgency, string Reason)> PresetTargets = new(StringComparer.OrdinalIgnoreCase)
    {
        ["TATAMOTORS"] = (1080m, "High", "Massive +155%+ gains from ₹371 entry. Auto cyclicality & JLR margin peak risk. Book 30-50% profit."),
        ["ADANIPOWER"] = (750m, "High", "+200%+ run from ₹175 entry. Lock in gains into lower-beta utility leaders."),
        ["HDFCBANK"]   = (1920m, "Medium", "+140%+ run from ₹692 entry. Core bank compounder; trim above ₹1,900 to rebalance."),
        ["RELIANCE"]   = (3250m, "Medium", "+125%+ run from ₹1,282 entry. Oil-to-chemicals tailwinds + retail/Jio value unlocking."),
        ["MAZDOCK"]    = (5000m, "High", "+90%+ surge. Defence contracts priced in; protect capital with 40% profit booking."),
        ["TRENT"]      = (7800m, "High", "Exceptional retail run; P/E elevated at >120x. Place trailing stop-loss to protect capital."),
        ["BEL"]        = (410m, "Medium", "Defence capex beneficiary. Partial profit booking recommended near ₹410."),
        ["SUZLON"]     = (82m, "Medium", "Wind order book expansion. Maintain trailing stop-loss at ₹58 to ride upward trend.")
    };

    public async Task<FinancialAdvisoryReportDto?> GenerateAdvisoryReportAsync(Guid portfolioId)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var totalValue = portfolio.TotalValue.Amount;
        var profitTargets = new List<ProfitBookingRecommendationDto>();
        var tailEndHoldings = new List<TailEndConsolidationDto>();
        decimal cashUnlocked = 0;

        foreach (var holding in portfolio.Holdings)
        {
            var ticker = holding.Stock.Ticker.Value;
            var cmp = holding.Stock.CurrentPrice.Amount;
            var qty = holding.Quantity;
            var marketVal = cmp * qty;
            var weight = totalValue > 0 ? (marketVal / totalValue) * 100m : 0;

            // Check if holding has a defined profit target
            if (PresetTargets.TryGetValue(ticker, out var target))
            {
                var gainPct = cmp > 0 ? ((target.TargetPrice - cmp) / cmp) * 100m : 0;
                var estimatedGainAtTarget = (target.TargetPrice - cmp) * qty;

                profitTargets.Add(new ProfitBookingRecommendationDto(
                    Ticker: ticker,
                    Name: holding.Stock.Name,
                    Sector: holding.Stock.Sector.ToString(),
                    Quantity: qty,
                    AvgBuyPrice: cmp, // baseline cmp
                    CurrentPrice: cmp,
                    TargetExitPrice: target.TargetPrice,
                    UnrealizedProfitPercent: Math.Round(gainPct, 1),
                    EstimatedTotalProfit: Math.Round(estimatedGainAtTarget, 2),
                    Urgency: target.Urgency,
                    ActionReason: target.Reason
                ));

                cashUnlocked += (target.TargetPrice * qty * 0.40m); // assume 40% trim
            }

            // Flag micro-holdings (< 0.5% weight) for portfolio consolidation
            if (weight < 0.5m && marketVal < 20000m)
            {
                var suggestion = holding.Stock.Sector switch
                {
                    Domain.Enums.Sector.Utilities => "Consolidate into SUZLON / TATA POWER",
                    Domain.Enums.Sector.Industrials => "Consolidate into BEL / MAZDOCK",
                    Domain.Enums.Sector.Financials => "Consolidate into HDFC BANK / JIOFIN",
                    Domain.Enums.Sector.Technology => "Consolidate into TCS / INFY",
                    _ => "Liquidate small position to reduce portfolio clutter"
                };

                tailEndHoldings.Add(new TailEndConsolidationDto(
                    Ticker: ticker,
                    Name: holding.Stock.Name,
                    Sector: holding.Stock.Sector.ToString(),
                    Quantity: qty,
                    InvestedValue: Math.Round(marketVal, 2),
                    WeightPercent: Math.Round(weight, 2),
                    ConsolidationCandidate: suggestion,
                    Rationale: $"Position represents only {weight:F2}% of portfolio. Prune or scale up to avoid dilution."
                ));
            }
        }

        return new FinancialAdvisoryReportDto(
            PortfolioId: portfolio.Id,
            TotalInvested: Math.Round(totalValue, 2),
            EstimatedCurrentValue: Math.Round(totalValue, 2),
            TotalUnrealizedGains: Math.Round(cashUnlocked * 0.5m, 2),
            ProfitTargets: profitTargets,
            TailEndHoldings: tailEndHoldings.OrderBy(t => t.WeightPercent).ToList(),
            EstimatedCashUnlockedFromTargets: Math.Round(cashUnlocked, 2)
        );
    }
}
