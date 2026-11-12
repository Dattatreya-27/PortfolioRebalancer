using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;

namespace PortfolioRebalancer.Application.Services;

public class QuarterlyEarningsService
{
    private readonly IQuarterlyEarningsProvider _earningsProvider;
    private readonly IPortfolioRepository _portfolioRepository;
    private readonly IStockDataProvider _stockDataProvider;

    public QuarterlyEarningsService(
        IQuarterlyEarningsProvider earningsProvider,
        IPortfolioRepository portfolioRepository,
        IStockDataProvider stockDataProvider)
    {
        _earningsProvider = earningsProvider;
        _portfolioRepository = portfolioRepository;
        _stockDataProvider = stockDataProvider;
    }

    public async Task<QuarterlyEarningsSummaryDto> GetStockEarningsAsync(string ticker, CancellationToken ct = default)
    {
        var summary = await _earningsProvider.GetQuarterlyEarningsAsync(ticker, ct);
        return new QuarterlyEarningsSummaryDto(
            summary.Ticker,
            summary.CompanyName,
            summary.LatestQuarter,
            summary.SurpriseVerdict,
            summary.CashConversionRatio,
            summary.DebtTrajectory,
            summary.Quarters.Select(q => new QuarterlyPeriodDto(
                q.QuarterLabel, q.PeriodEndDate, q.RevenueCrores, q.RevenueYoYPercent, q.RevenueQoQPercent,
                q.EbitdaCrores, q.OperatingMarginPercent, q.PatCrores, q.PatYoYPercent, q.PatQoQPercent,
                q.Eps, q.OperatingCashFlowCrores)).ToList(),
            summary.SegmentDrivers,
            summary.WhatImproved,
            summary.WhatDeteriorated,
            summary.PlainEnglishSummary
        );
    }

    public async Task<PortfolioEarningsDigestDto?> GetPortfolioEarningsDigestAsync(Guid portfolioId, CancellationToken ct = default)
    {
        var portfolio = await _portfolioRepository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var stockList = await _stockDataProvider.GetStocksAsync(tickers);
        var stocks = stockList.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);
        var earningsMap = await _earningsProvider.GetQuarterlyEarningsBatchAsync(tickers, ct);

        var totalValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);

        var items = new List<HoldingEarningsDigestItemDto>();
        foreach (var h in portfolio.Holdings)
        {
            var t = h.Stock.Ticker.Value;
            stocks.TryGetValue(t, out var stock);
            var weight = totalValue > 0 ? Math.Round((h.MarketValue.Amount / totalValue) * 100m, 1) : 0m;

            var summary = earningsMap.TryGetValue(t, out var e)
                ? e
                : await _earningsProvider.GetQuarterlyEarningsAsync(t, ct);

            var latest = summary.Quarters.FirstOrDefault();
            items.Add(new HoldingEarningsDigestItemDto(
                Ticker: t,
                StockName: stock?.Name ?? summary.CompanyName,
                Sector: stock?.Sector.ToString() ?? "Diversified",
                WeightPercent: weight,
                LatestQuarter: summary.LatestQuarter,
                SurpriseVerdict: summary.SurpriseVerdict,
                RevenueYoYPercent: latest?.RevenueYoYPercent ?? 0m,
                PatYoYPercent: latest?.PatYoYPercent ?? 0m,
                OperatingMarginPercent: latest?.OperatingMarginPercent ?? 0m,
                CashConversionRatio: summary.CashConversionRatio,
                DebtTrajectory: summary.DebtTrajectory,
                PlainEnglishSummary: summary.PlainEnglishSummary,
                WhatImproved: summary.WhatImproved,
                WhatDeteriorated: summary.WhatDeteriorated
            ));
        }

        items = items.OrderByDescending(i => i.WeightPercent).ToList();

        return new PortfolioEarningsDigestDto(
            PortfolioId: portfolio.Id,
            PortfolioName: portfolio.Name,
            BeatCount: items.Count(i => i.SurpriseVerdict == "BEAT"),
            InLineCount: items.Count(i => i.SurpriseVerdict == "IN_LINE"),
            MissCount: items.Count(i => i.SurpriseVerdict == "MISS"),
            Holdings: items
        );
    }
}
