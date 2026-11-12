using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;

namespace PortfolioRebalancer.Application.Services;

public class PortfolioPillarIntelligenceService
{
    private readonly IPortfolioRepository _portfolioRepository;
    private readonly IStockDataProvider _stockDataProvider;
    private readonly IStockScoringService _scoringService;

    public PortfolioPillarIntelligenceService(
        IPortfolioRepository portfolioRepository,
        IStockDataProvider stockDataProvider,
        IStockScoringService scoringService)
    {
        _portfolioRepository = portfolioRepository;
        _stockDataProvider = stockDataProvider;
        _scoringService = scoringService;
    }

    public async Task<PortfolioInstitutionalRadarDto?> GetInstitutionalRadarAsync(Guid portfolioId, CancellationToken ct = default)
    {
        var portfolio = await _portfolioRepository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var stockList = await _stockDataProvider.GetStocksAsync(tickers);
        var stocks = stockList.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

        var totalValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);

        var items = new List<HoldingInstitutionalSummaryDto>();
        foreach (var h in portfolio.Holdings)
        {
            var t = h.Stock.Ticker.Value;
            var stock = stocks.TryGetValue(t, out var s) ? s : h.Stock;

            var score = _scoringService.CalculateScore(stock);
            var sp = score.ShareholdingPattern;
            var inst = score.InstitutionalFlow;

            var weight = totalValue > 0 ? Math.Round((h.MarketValue.Amount / totalValue) * 100m, 1) : 0m;
            var fii = sp?.FiiPercent ?? inst?.FiiHoldingPercent ?? 0m;
            var dii = sp?.DiiPercent ?? inst?.DiiHoldingPercent ?? 0m;
            var qoqFii = sp?.QoQFiiChange ?? 0m;
            var qoqDii = sp?.QoQDiiChange ?? 0m;
            var netInst = qoqFii + qoqDii;

            var signal = netInst >= 0.35m ? "ACCUMULATION"
                : netInst <= -0.35m ? "DISTRIBUTION"
                : "NEUTRAL";

            var whaleCount = sp?.RecentWhaleDeals?.Count ?? 0;
            var latestWhale = sp?.RecentWhaleDeals?.FirstOrDefault() is { } w
                ? $"{w.ClientName} ({w.DealType} ₹{w.DealValueCrores:F0} Cr)"
                : "No recent bulk/block deal flags";

            var notable = sp?.BigPublicInvestors?.Select(b => $"{b.InvestorName} ({b.StakePercent:F1}%)").ToList()
                ?? new List<string>();

            items.Add(new HoldingInstitutionalSummaryDto(
                Ticker: t,
                StockName: stock.Name,
                Sector: stock.Sector.ToString(),
                WeightPercent: weight,
                QuarterPeriod: sp?.QuarterPeriod ?? "Latest Quarter",
                FiiPercent: fii,
                QoQFiiChange: qoqFii,
                DiiPercent: dii,
                QoQDiiChange: qoqDii,
                PromoterPercent: sp?.PromoterPercent ?? 0m,
                QoQPromoterChange: sp?.QoQPromoterChange ?? 0m,
                PromoterPledgePercent: score.GovernanceAudit?.PromoterPledgePercent ?? 0m,
                NetInstitutionalSignal: signal,
                WhaleAlertsCount: whaleCount,
                LatestWhaleSummary: latestWhale,
                NotableInvestors: notable
            ));
        }

        items = items.OrderByDescending(i => i.WeightPercent).ToList();

        return new PortfolioInstitutionalRadarDto(
            PortfolioId: portfolio.Id,
            PortfolioName: portfolio.Name,
            AccumulationCount: items.Count(i => i.NetInstitutionalSignal == "ACCUMULATION"),
            DistributionCount: items.Count(i => i.NetInstitutionalSignal == "DISTRIBUTION"),
            PledgeFlagCount: items.Count(i => i.PromoterPledgePercent > 5m),
            Holdings: items
        );
    }

    public async Task<PortfolioManagementPulseDto?> GetManagementPulseAsync(Guid portfolioId, CancellationToken ct = default)
    {
        var portfolio = await _portfolioRepository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var stockList = await _stockDataProvider.GetStocksAsync(tickers);
        var stocks = stockList.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

        var totalValue = portfolio.Holdings.Sum(h => h.MarketValue.Amount);

        var items = new List<HoldingManagementPulseDto>();
        foreach (var h in portfolio.Holdings)
        {
            var t = h.Stock.Ticker.Value;
            var stock = stocks.TryGetValue(t, out var s) ? s : h.Stock;

            var score = _scoringService.CalculateScore(stock);
            var mgmt = score.ManagementAudit;
            var weight = totalValue > 0 ? Math.Round((h.MarketValue.Amount / totalValue) * 100m, 1) : 0m;

            var uproarText = mgmt?.MajorEventsAndUproar?.FirstOrDefault() is { } ev
                ? $"{ev.Headline}: {ev.Details}"
                : "No adverse governance or regulatory uproar flagged.";

            items.Add(new HoldingManagementPulseDto(
                Ticker: t,
                StockName: stock.Name,
                Sector: stock.Sector.ToString(),
                WeightPercent: weight,
                IntegrityRating: mgmt?.IntegrityRating ?? "Disciplined / Clean",
                GovernanceScore: mgmt?.GovernanceScore ?? score.InstitutionalGovernanceScore,
                CapitalAllocationTrackRecord: mgmt?.CapitalAllocationTrackRecord ?? "Steady ROCE & capital discipline.",
                ExecutionCapability: mgmt?.ExecutionCapability ?? "Consistent operational delivery.",
                ManagementSentiment: mgmt?.ManagementSentiment ?? "CAUTIOUSLY_OPTIMISTIC",
                LatestConcallHighlights: mgmt?.LatestConcallHighlights ?? "Management executing on core operational priorities with steady margin discipline.",
                MajorEventsAndUproar: uproarText
            ));
        }

        items = items.OrderByDescending(i => i.WeightPercent).ToList();
        var avgGov = items.Count > 0 ? Math.Round(items.Average(i => i.GovernanceScore), 1) : 0m;

        return new PortfolioManagementPulseDto(
            PortfolioId: portfolio.Id,
            PortfolioName: portfolio.Name,
            AverageGovernanceScore: avgGov,
            BullishToneCount: items.Count(i => i.ManagementSentiment.Contains("BULLISH", StringComparison.OrdinalIgnoreCase) || i.ManagementSentiment.Contains("OPTIMISTIC", StringComparison.OrdinalIgnoreCase)),
            CautiousOrFlaggedCount: items.Count(i => i.IntegrityRating.Contains("Red Flag", StringComparison.OrdinalIgnoreCase) || i.IntegrityRating.Contains("Concerns", StringComparison.OrdinalIgnoreCase) || i.ManagementSentiment.Contains("DEFENSIVE", StringComparison.OrdinalIgnoreCase) || i.ManagementSentiment.Contains("DISTRESSED", StringComparison.OrdinalIgnoreCase)),
            Holdings: items
        );
    }
}
