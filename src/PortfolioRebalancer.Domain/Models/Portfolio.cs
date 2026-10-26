using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Aggregate root for a user's investment portfolio.
/// Encapsulates holdings and target sector allocations.
/// Uses IReadOnlyList to prevent external mutation of internal collections.
/// </summary>
public sealed class Portfolio
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    private readonly List<Holding> _holdings = [];
    public IReadOnlyList<Holding> Holdings => _holdings.AsReadOnly();

    private readonly List<SectorAllocation> _targetAllocations = [];
    public IReadOnlyList<SectorAllocation> TargetAllocations => _targetAllocations.AsReadOnly();

    /// <summary>Total market value of all holdings.</summary>
    public Money TotalValue
    {
        get
        {
            if (_holdings.Count == 0) return Money.Zero();
            decimal total = 0m;
            for (int i = 0; i < _holdings.Count; i++)
            {
                total += _holdings[i].MarketValue.Amount;
            }
            return new Money(total, _holdings[0].MarketValue.Currency);
        }
    }

    /// <summary>Total invested capital across all holdings.</summary>
    public Money TotalInvested
    {
        get
        {
            if (_holdings.Count == 0) return Money.Zero();
            decimal total = 0m;
            for (int i = 0; i < _holdings.Count; i++)
            {
                total += _holdings[i].InvestedAmount.Amount;
            }
            return new Money(total, _holdings[0].InvestedAmount.Currency);
        }
    }

    /// <summary>Total unrealized Profit/Loss in rupees = TotalValue - TotalInvested.</summary>
    public Money TotalUnrealizedPnL => TotalValue - TotalInvested;

    /// <summary>Overall portfolio return percentage = ((TotalValue - TotalInvested) / TotalInvested) * 100.</summary>
    public decimal TotalUnrealizedPnLPercent => TotalInvested.Amount > 0
        ? Math.Round(((TotalValue.Amount - TotalInvested.Amount) / TotalInvested.Amount) * 100m, 2)
        : 0m;

    /// <summary>Total Day's Profit/Loss in rupees across all holdings.</summary>
    public Money TotalDayPnL
    {
        get
        {
            if (_holdings.Count == 0) return Money.Zero();
            decimal total = 0m;
            for (int i = 0; i < _holdings.Count; i++)
            {
                total += _holdings[i].DayPnL.Amount;
            }
            return new Money(total, _holdings[0].MarketValue.Currency);
        }
    }

    /// <summary>Total Day's Profit/Loss percentage = (TotalDayPnL / (TotalValue - TotalDayPnL)) * 100.</summary>
    public decimal TotalDayPnLPercent
    {
        get
        {
            var baseValue = TotalValue.Amount - TotalDayPnL.Amount;
            return baseValue > 0 ? Math.Round((TotalDayPnL.Amount / baseValue) * 100m, 2) : 0m;
        }
    }

    /// <summary>Updates live market prices for portfolio holdings.</summary>
    public void UpdateHoldingPrices(IReadOnlyDictionary<string, Money> latestPrices)
    {
        for (int i = 0; i < _holdings.Count; i++)
        {
            var h = _holdings[i];
            if (latestPrices.TryGetValue(h.Stock.Ticker.Value, out var newPrice))
            {
                h.Stock.UpdateMarketData(newPrice, h.Stock.PERatio, h.Stock.DividendYield, h.Stock.MarketCap);
            }
        }
    }

    public DateTime? LastSyncedAt { get; set; } = DateTime.UtcNow;

    public void AddHolding(Holding holding)
    {
        ArgumentNullException.ThrowIfNull(holding);

        var cleanHolding = holding.Quantity % 1 != 0
            ? holding.WithQuantity(Math.Round(holding.Quantity, 0, MidpointRounding.AwayFromZero))
            : holding;

        var existing = _holdings.FindIndex(h => h.Stock.Ticker == cleanHolding.Stock.Ticker);
        if (existing >= 0)
            _holdings[existing] = cleanHolding;
        else
            _holdings.Add(cleanHolding);

        LastSyncedAt = DateTime.UtcNow;
    }

    public void ExecuteTrade(Stock stock, string tradeType, decimal quantity, decimal tradePrice)
    {
        ArgumentNullException.ThrowIfNull(stock);
        var cleanQty = Math.Round(quantity, 0, MidpointRounding.AwayFromZero);
        if (cleanQty <= 0 && !tradeType.Trim().Equals("ADJUST", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Trade quantity must be at least 1 whole share.", nameof(quantity));
        if (tradePrice <= 0) throw new ArgumentException("Trade price must be greater than zero.", nameof(tradePrice));

        var normalizedType = tradeType.Trim().ToUpperInvariant();
        var existingIndex = _holdings.FindIndex(h => h.Stock.Ticker == stock.Ticker);

        if (normalizedType == "BUY")
        {
            if (existingIndex >= 0)
            {
                var existing = _holdings[existingIndex];
                var oldQty = existing.Quantity;
                var oldAvg = existing.AverageBuyPrice?.Amount ?? existing.Stock.CurrentPrice.Amount;
                var newQty = oldQty + cleanQty;
                var newAvgPrice = Math.Round(((oldQty * oldAvg) + (cleanQty * tradePrice)) / newQty, 2);

                _holdings[existingIndex] = new Holding
                {
                    Stock = stock,
                    Quantity = newQty,
                    AverageBuyPrice = Money.INR(newAvgPrice)
                };
            }
            else
            {
                _holdings.Add(new Holding
                {
                    Stock = stock,
                    Quantity = cleanQty,
                    AverageBuyPrice = Money.INR(Math.Round(tradePrice, 2))
                });
            }
        }
        else if (normalizedType == "SELL")
        {
            if (existingIndex >= 0)
            {
                var existing = _holdings[existingIndex];
                if (cleanQty >= existing.Quantity)
                {
                    _holdings.RemoveAt(existingIndex);
                }
                else
                {
                    _holdings[existingIndex] = new Holding
                    {
                        Stock = stock,
                        Quantity = existing.Quantity - cleanQty,
                        AverageBuyPrice = existing.AverageBuyPrice
                    };
                }
            }
            else
            {
                throw new InvalidOperationException($"Cannot sell {stock.Ticker.Value}: holding does not exist in portfolio.");
            }
        }
        else if (normalizedType == "ADJUST")
        {
            if (cleanQty <= 0)
            {
                if (existingIndex >= 0) _holdings.RemoveAt(existingIndex);
            }
            else
            {
                var newHolding = new Holding
                {
                    Stock = stock,
                    Quantity = cleanQty,
                    AverageBuyPrice = Money.INR(Math.Round(tradePrice, 2))
                };
                if (existingIndex >= 0) _holdings[existingIndex] = newHolding;
                else _holdings.Add(newHolding);
            }
        }
        else
        {
            throw new ArgumentException($"Invalid trade type '{tradeType}'. Supported types: BUY, SELL, ADJUST.", nameof(tradeType));
        }

        LastSyncedAt = DateTime.UtcNow;
    }

    public bool RemoveHolding(Ticker ticker)
    {
        var removed = _holdings.RemoveAll(h => h.Stock.Ticker == ticker) > 0;
        if (removed) LastSyncedAt = DateTime.UtcNow;
        return removed;
    }

    /// <summary>
    /// Replaces all portfolio holdings in bulk (e.g., from an external broker sync like Angel One).
    /// </summary>
    public void ReplaceHoldings(IEnumerable<Holding> holdings)
    {
        ArgumentNullException.ThrowIfNull(holdings);
        _holdings.Clear();
        _holdings.AddRange(holdings);
        LastSyncedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Sets the target sector allocations. Validates that weights sum to 100%.
    /// </summary>
    public void SetTargetAllocations(IEnumerable<SectorAllocation> allocations)
    {
        var allocationList = allocations.ToList();

        var totalWeight = allocationList.Sum(a => a.TargetWeight.Value);
        if (Math.Abs(totalWeight - 100m) > 0.01m)
            throw new InvalidOperationException(
                $"Target allocations must sum to 100%. Got {totalWeight:F2}%.");

        var duplicateSectors = allocationList
            .GroupBy(a => a.Sector)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key);

        if (duplicateSectors.Any())
            throw new InvalidOperationException(
                $"Duplicate sector allocations: {string.Join(", ", duplicateSectors)}");

        _targetAllocations.Clear();
        _targetAllocations.AddRange(allocationList);
    }

    /// <summary>
    /// Calculates the current weight of each sector based on market values.
    /// </summary>
    public Dictionary<Sector, Percentage> GetCurrentSectorWeights()
    {
        if (_holdings.Count == 0) return new();

        var sectorTotals = new Dictionary<Sector, decimal>();
        decimal totalAmount = 0m;

        for (int i = 0; i < _holdings.Count; i++)
        {
            var h = _holdings[i];
            var mv = h.MarketValue.Amount;
            totalAmount += mv;

            if (sectorTotals.TryGetValue(h.Stock.Sector, out var current))
            {
                sectorTotals[h.Stock.Sector] = current + mv;
            }
            else
            {
                sectorTotals[h.Stock.Sector] = mv;
            }
        }

        if (totalAmount == 0) return new();

        var result = new Dictionary<Sector, Percentage>(sectorTotals.Count);
        foreach (var (sector, amount) in sectorTotals)
        {
            result[sector] = Percentage.FromFraction(amount / totalAmount);
        }

        return result;
    }

    public override string ToString() => $"{Name} ({Holdings.Count} holdings, {TotalValue})";
}
