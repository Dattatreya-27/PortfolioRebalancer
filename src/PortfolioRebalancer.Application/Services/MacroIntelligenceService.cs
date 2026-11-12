using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Services;

public class MacroIntelligenceService
{
    private readonly IMacroDataProvider _macroProvider;
    private readonly IPortfolioRepository _portfolioRepository;
    private readonly IStockDataProvider _stockDataProvider;

    public MacroIntelligenceService(
        IMacroDataProvider macroProvider,
        IPortfolioRepository portfolioRepository,
        IStockDataProvider stockDataProvider)
    {
        _macroProvider = macroProvider;
        _portfolioRepository = portfolioRepository;
        _stockDataProvider = stockDataProvider;
    }

    public async Task<MacroDashboardDto> GetMacroDashboardAsync(Guid? portfolioId = null, CancellationToken ct = default)
    {
        var indicators = await _macroProvider.GetMacroIndicatorsAsync(ct);
        var impacts = new List<MacroIndicatorHoldingImpactDto>();

        if (portfolioId.HasValue)
        {
            var portfolio = await _portfolioRepository.GetByIdAsync(portfolioId.Value);
            if (portfolio is not null && portfolio.Holdings.Count > 0)
            {
                var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var stockList = await _stockDataProvider.GetStocksAsync(tickers);
                var stocks = stockList.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

                foreach (var h in portfolio.Holdings)
                {
                    var t = h.Stock.Ticker.Value;
                    var sector = stocks.TryGetValue(t, out var s) ? s.Sector.ToString() : h.Stock.Sector.ToString();
                    impacts.AddRange(EvaluateMacroForHolding(t, sector, indicators));
                }
            }
        }

        var dtoList = indicators.Select(i => new MacroIndicatorDto(
            i.Code, i.Name, i.Region, i.CurrentValue, i.PreviousValue,
            i.ChangeDelta, i.Unit, i.TrendDirection, i.AsOfDate, i.Commentary)).ToList();

        return new MacroDashboardDto(
            PortfolioId: portfolioId,
            GeneratedAtUtc: DateTime.UtcNow,
            IndiaIndicators: dtoList.Where(i => i.Region == "India").ToList(),
            GlobalIndicators: dtoList.Where(i => i.Region == "Global").ToList(),
            PortfolioImpacts: impacts
        );
    }

    private static IEnumerable<MacroIndicatorHoldingImpactDto> EvaluateMacroForHolding(
        string ticker, string sector, IReadOnlyList<MacroIndicator> indicators)
    {
        var s = sector.ToLowerInvariant();
        var results = new List<MacroIndicatorHoldingImpactDto>();

        var brent = indicators.FirstOrDefault(i => i.Code == "BRENT_CRUDE");
        var inr = indicators.FirstOrDefault(i => i.Code == "USD_INR");
        var rbi = indicators.FirstOrDefault(i => i.Code == "RBI_REPO");
        var us10y = indicators.FirstOrDefault(i => i.Code == "US_10Y");

        if (s.Contains("technology") || s.Contains("it") || s.Contains("healthcare") || s.Contains("pharma"))
        {
            if (inr is not null)
            {
                results.Add(new MacroIndicatorHoldingImpactDto(
                    inr.Code, inr.Name, ticker, sector,
                    inr.TrendDirection == "UP" ? "TAILWIND" : "NEUTRAL",
                    "HIGH",
                    inr.TrendDirection == "UP"
                        ? "Rupee depreciation expands INR realization & operating margins on USD export revenues."
                        : "Stable INR keeps export realizations predictable."));
            }
            if (us10y is not null && s.Contains("tech"))
            {
                results.Add(new MacroIndicatorHoldingImpactDto(
                    us10y.Code, us10y.Name, ticker, sector,
                    us10y.TrendDirection == "UP" ? "HEADWIND" : "TAILWIND",
                    "MEDIUM",
                    us10y.TrendDirection == "UP"
                        ? "Elevated US yields can delay discretionary US enterprise IT tech budgets."
                        : "Easing US yields support BFSI & enterprise tech capex recovery."));
            }
        }
        else if (s.Contains("financial") || s.Contains("bank"))
        {
            if (rbi is not null)
            {
                results.Add(new MacroIndicatorHoldingImpactDto(
                    rbi.Code, rbi.Name, ticker, sector,
                    rbi.TrendDirection == "DOWN" ? "TAILWIND" : "NEUTRAL",
                    "HIGH",
                    "RBI rate stance directly governs deposit repricing, NIMs, and credit growth momentum."));
            }
        }
        else if (s.Contains("energy") || s.Contains("oil") || s.Contains("materials") || s.Contains("chemicals") || s.Contains("auto") || s.Contains("consumer"))
        {
            if (brent is not null)
            {
                var isEnergyProducer = s.Contains("energy") || s.Contains("oil");
                var direction = isEnergyProducer
                    ? (brent.TrendDirection == "DOWN" ? "HEADWIND" : "TAILWIND")
                    : (brent.TrendDirection == "DOWN" ? "TAILWIND" : "HEADWIND");
                results.Add(new MacroIndicatorHoldingImpactDto(
                    brent.Code, brent.Name, ticker, sector,
                    direction,
                    "MEDIUM",
                    isEnergyProducer
                        ? "Crude price trajectory directly impacts upstream/refining realizations."
                        : "Crude oil movements drive petrochemical, packaging, and logistics input costs."));
            }
        }

        return results;
    }
}
