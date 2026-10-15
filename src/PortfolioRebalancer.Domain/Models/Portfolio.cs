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
    public Money TotalValue => _holdings.Count == 0
        ? Money.Zero()
        : _holdings.Aggregate(Money.Zero(_holdings[0].MarketValue.Currency), (total, h) => total + h.MarketValue);

    /// <summary>Total invested capital across all holdings.</summary>
    public Money TotalInvested => _holdings.Count == 0
        ? Money.Zero()
        : _holdings.Aggregate(Money.Zero(_holdings[0].InvestedAmount.Currency), (total, h) => total + h.InvestedAmount);

    /// <summary>Total unrealized Profit/Loss in rupees = TotalValue - TotalInvested.</summary>
    public Money TotalUnrealizedPnL => TotalValue - TotalInvested;

    /// <summary>Overall portfolio return percentage = ((TotalValue - TotalInvested) / TotalInvested) * 100.</summary>
    public decimal TotalUnrealizedPnLPercent => TotalInvested.Amount > 0
        ? Math.Round(((TotalValue.Amount - TotalInvested.Amount) / TotalInvested.Amount) * 100m, 2)
        : 0m;

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

        var existing = _holdings.FindIndex(h => h.Stock.Ticker == holding.Stock.Ticker);
        if (existing >= 0)
            _holdings[existing] = holding;
        else
            _holdings.Add(holding);

        LastSyncedAt = DateTime.UtcNow;
    }

    public void ExecuteTrade(Stock stock, string tradeType, decimal quantity, decimal tradePrice)
    {
        ArgumentNullException.ThrowIfNull(stock);
        if (quantity <= 0) throw new ArgumentException("Trade quantity must be greater than zero.", nameof(quantity));
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
                var newQty = oldQty + quantity;
                var newAvgPrice = Math.Round(((oldQty * oldAvg) + (quantity * tradePrice)) / newQty, 2);

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
                    Quantity = quantity,
                    AverageBuyPrice = Money.INR(Math.Round(tradePrice, 2))
                });
            }
        }
        else if (normalizedType == "SELL")
        {
            if (existingIndex >= 0)
            {
                var existing = _holdings[existingIndex];
                if (quantity >= existing.Quantity)
                {
                    _holdings.RemoveAt(existingIndex);
                }
                else
                {
                    _holdings[existingIndex] = new Holding
                    {
                        Stock = stock,
                        Quantity = existing.Quantity - quantity,
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
            if (quantity <= 0)
            {
                if (existingIndex >= 0) _holdings.RemoveAt(existingIndex);
            }
            else
            {
                var newHolding = new Holding
                {
                    Stock = stock,
                    Quantity = quantity,
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
        if (TotalValue.Amount == 0) return new();

        return _holdings
            .GroupBy(h => h.Stock.Sector)
            .ToDictionary(
                g => g.Key,
                g => Percentage.FromFraction(
                    g.Sum(h => h.MarketValue.Amount) / TotalValue.Amount)
            );
    }

    public override string ToString() => $"{Name} ({Holdings.Count} holdings, {TotalValue})";
}
