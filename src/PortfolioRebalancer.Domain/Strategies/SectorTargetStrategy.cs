using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Strategies;

/// <summary>
/// Rebalances a portfolio to match target sector allocations.
/// Holdings within each sector are scaled proportionally to preserve
/// the relative weight of individual stocks within a sector.
/// </summary>
public sealed class SectorTargetStrategy : IRebalancingStrategy
{
    public string Name => "Sector Target Rebalancing";

    public RebalanceResult Calculate(Portfolio portfolio)
    {
        var totalValue = portfolio.TotalValue;

        if (totalValue.Amount == 0)
            return new RebalanceResult([], [], totalValue);

        if (portfolio.TargetAllocations.Count == 0)
            throw new InvalidOperationException(
                "Cannot rebalance: no target allocations have been set.");

        var currentWeights = portfolio.GetCurrentSectorWeights();

        // 1. Calculate sector drifts
        var sectorDrifts = portfolio.TargetAllocations
            .Select(target =>
            {
                var currentWeight = currentWeights.GetValueOrDefault(
                    target.Sector, new Percentage(0));

                return new SectorDrift(
                    Sector: target.Sector,
                    CurrentWeight: currentWeight,
                    TargetWeight: target.TargetWeight,
                    DriftPercentagePoints: currentWeight.Value - target.TargetWeight.Value);
            })
            .ToList();

        // 2. Calculate target value per sector
        var targetValueBySector = portfolio.TargetAllocations
            .ToDictionary(
                a => a.Sector,
                a => totalValue * a.TargetWeight.AsFraction);

        // 3. Group holdings by sector
        var holdingsBySector = portfolio.Holdings
            .GroupBy(h => h.Stock.Sector)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 4. Calculate trade recommendations
        var trades = new List<TradeRecommendation>();

        foreach (var (sector, sectorTargetValue) in targetValueBySector)
        {
            if (!holdingsBySector.TryGetValue(sector, out var sectorHoldings))
                continue;

            var sectorCurrentValue = sectorHoldings.Sum(h => h.MarketValue.Amount);
            if (sectorCurrentValue == 0) continue;

            foreach (var holding in sectorHoldings)
            {
                // Distribute target proportionally within sector
                var holdingShareInSector = holding.MarketValue.Amount / sectorCurrentValue;
                var holdingTargetValue = sectorTargetValue * holdingShareInSector;

                var targetQuantity = holding.Stock.CurrentPrice.Amount > 0
                    ? Math.Round(
                        holdingTargetValue.Amount / holding.Stock.CurrentPrice.Amount, 4)
                    : 0m;

                var deltaQuantity = Math.Round(targetQuantity - holding.Quantity, 4);

                trades.Add(new TradeRecommendation(
                    Ticker: holding.Stock.Ticker,
                    StockName: holding.Stock.Name,
                    Sector: sector,
                    CurrentQuantity: holding.Quantity,
                    TargetQuantity: targetQuantity,
                    DeltaQuantity: deltaQuantity,
                    CurrentValue: holding.MarketValue,
                    TargetValue: holdingTargetValue));
            }
        }

        return new RebalanceResult(trades, sectorDrifts, totalValue);
    }
}
