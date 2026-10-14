using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.Strategies;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Orchestrates portfolio operations — the bridge between API controllers and domain logic.
/// 
/// KEY PATTERN: Application Services coordinate but don't contain business rules.
/// Business rules live in the Domain layer (Portfolio, SectorTargetStrategy).
/// This service handles: loading, mapping, saving, and delegating to domain objects.
/// </summary>
public sealed class PortfolioService(
    IPortfolioRepository repository,
    IStockDataProvider stockProvider)
{
    public async Task<PortfolioSummaryDto> CreatePortfolioAsync(string name)
    {
        var portfolio = new Portfolio { Name = name };
        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> GetPortfolioAsync(Guid id)
    {
        var portfolio = await repository.GetByIdAsync(id);
        return portfolio is null ? null : MapToSummary(portfolio);
    }

    public async Task<IReadOnlyList<PortfolioSummaryDto>> GetAllPortfoliosAsync()
    {
        var portfolios = await repository.GetAllAsync();
        return portfolios.Select(MapToSummary).ToList();
    }

    public async Task<PortfolioSummaryDto?> AddHoldingAsync(
        Guid portfolioId, string ticker, decimal quantity, decimal? buyPrice = null)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var stock = await stockProvider.GetStockAsync(ticker)
            ?? throw new ArgumentException($"Unknown stock ticker: {ticker}");

        portfolio.AddHolding(new Holding
        {
            Stock = stock,
            Quantity = quantity,
            AverageBuyPrice = buyPrice.HasValue ? Money.INR(buyPrice.Value) : null
        });
        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> AddHoldingsBatchAsync(
        Guid portfolioId, IEnumerable<HoldingItemRequest> items)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var itemList = items.ToList();
        var tickers = itemList.Select(i => i.Ticker).Distinct();
        var stocks = await stockProvider.GetStocksAsync(tickers);
        var stockLookup = stocks.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

        foreach (var item in itemList)
        {
            if (stockLookup.TryGetValue(item.Ticker.Trim().ToUpperInvariant(), out var stock))
            {
                portfolio.AddHolding(new Holding
                {
                    Stock = stock,
                    Quantity = item.Quantity,
                    AverageBuyPrice = item.BuyPrice.HasValue ? Money.INR(item.BuyPrice.Value) : null
                });
            }
        }

        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> SyncLiveQuotesAsync(Guid portfolioId)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value).Distinct().ToList();
        if (tickers.Count > 0)
        {
            var freshStocks = await stockProvider.GetStocksAsync(tickers);
            var priceMap = freshStocks.ToDictionary(s => s.Ticker.Value, s => s.CurrentPrice, StringComparer.OrdinalIgnoreCase);
            portfolio.UpdateHoldingPrices(priceMap);
            await repository.SaveAsync(portfolio);
        }

        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> RemoveHoldingAsync(Guid portfolioId, string ticker)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        portfolio.RemoveHolding(new Ticker(ticker));
        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<RebalanceRecommendationDto?> RebalanceAsync(
        Guid portfolioId, List<SectorAllocationItem> targets)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        // Map request DTOs to domain value objects
        var allocations = targets.Select(t =>
        {
            if (!Enum.TryParse<Sector>(t.Sector, ignoreCase: true, out var sector))
                throw new ArgumentException($"Invalid sector: '{t.Sector}'");
            return new SectorAllocation(sector, new Percentage(t.TargetWeightPercent));
        });

        portfolio.SetTargetAllocations(allocations);
        await repository.SaveAsync(portfolio);

        // Delegate to domain strategy — the service doesn't know HOW to rebalance
        var strategy = new SectorTargetStrategy();
        var result = strategy.Calculate(portfolio);

        return MapToRecommendation(result);
    }

    // --- Mapping helpers: Domain → DTOs ---
    // These prevent domain model leakage through the API boundary.

    private static PortfolioSummaryDto MapToSummary(Portfolio portfolio)
    {
        var totalValue = portfolio.TotalValue.Amount;
        var totalInvested = portfolio.TotalInvested.Amount;

        var holdings = portfolio.Holdings.Select(h => new HoldingDto(
            Ticker: h.Stock.Ticker.Value,
            Name: h.Stock.Name,
            Sector: h.Stock.Sector.ToString(),
            Quantity: h.Quantity,
            BuyPrice: h.AverageBuyPrice?.Amount ?? h.Stock.CurrentPrice.Amount,
            Price: h.Stock.CurrentPrice.Amount,
            InvestedValue: Math.Round(h.InvestedAmount.Amount, 2),
            MarketValue: Math.Round(h.MarketValue.Amount, 2),
            UnrealizedPnL: Math.Round(h.UnrealizedPnL.Amount, 2),
            UnrealizedPnLPercent: h.UnrealizedPnLPercent,
            WeightPercent: totalValue > 0
                ? Math.Round(h.MarketValue.Amount / totalValue * 100, 2)
                : 0,
            PriceSource: "NSE_LIVE"
        )).ToList();

        var currentWeights = portfolio.GetCurrentSectorWeights();
        var targetLookup = portfolio.TargetAllocations
            .ToDictionary(a => a.Sector, a => a.TargetWeight.Value);

        var sectorWeights = currentWeights.Select(kv => new SectorWeightDto(
            Sector: kv.Key.ToString(),
            CurrentWeight: Math.Round(kv.Value.Value, 2),
            TargetWeight: targetLookup.TryGetValue(kv.Key, out var tw) ? tw : null
        )).ToList();

        // Include sectors with targets but no current holdings
        foreach (var (sector, weight) in targetLookup)
        {
            if (!currentWeights.ContainsKey(sector))
            {
                sectorWeights.Add(new SectorWeightDto(
                    Sector: sector.ToString(),
                    CurrentWeight: 0,
                    TargetWeight: weight));
            }
        }

        return new PortfolioSummaryDto(
            Id: portfolio.Id,
            Name: portfolio.Name,
            TotalValue: Math.Round(totalValue, 2),
            TotalInvested: Math.Round(totalInvested, 2),
            TotalUnrealizedPnL: Math.Round(portfolio.TotalUnrealizedPnL.Amount, 2),
            TotalUnrealizedPnLPercent: portfolio.TotalUnrealizedPnLPercent,
            Currency: "INR",
            Holdings: holdings,
            SectorWeights: sectorWeights);
    }

    private static RebalanceRecommendationDto MapToRecommendation(RebalanceResult result)
    {
        var trades = result.Trades.Select(t => new TradeRecommendationDto(
            Ticker: t.Ticker.Value,
            StockName: t.StockName,
            Sector: t.Sector.ToString(),
            Action: t.Action,
            CurrentQuantity: t.CurrentQuantity,
            TargetQuantity: Math.Round(t.TargetQuantity, 2),
            DeltaQuantity: Math.Round(t.DeltaQuantity, 2),
            CurrentValue: Math.Round(t.CurrentValue.Amount, 2),
            TargetValue: Math.Round(t.TargetValue.Amount, 2)
        )).ToList();

        var drifts = result.SectorDrifts.Select(d => new SectorDriftDto(
            Sector: d.Sector.ToString(),
            CurrentWeight: Math.Round(d.CurrentWeight.Value, 2),
            TargetWeight: Math.Round(d.TargetWeight.Value, 2),
            DriftPercentagePoints: Math.Round(d.DriftPercentagePoints, 2),
            Direction: d.IsOverweight ? "Overweight" : d.IsUnderweight ? "Underweight" : "On Target"
        )).ToList();

        return new RebalanceRecommendationDto(
            TotalValue: Math.Round(result.EstimatedTotalValue.Amount, 2),
            Trades: trades,
            SectorDrifts: drifts);
    }
}
