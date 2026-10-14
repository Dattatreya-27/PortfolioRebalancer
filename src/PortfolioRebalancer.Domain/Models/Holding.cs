using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Represents a position in a portfolio — a stock and the quantity held.
/// Immutable by design: to change quantity, create a new Holding via WithQuantity().
/// </summary>
public sealed class Holding
{
    public required Stock Stock { get; init; }
    public required decimal Quantity { get; init; }

    public Money? AverageBuyPrice { get; init; }

    /// <summary>Calculated market value = price × quantity.</summary>
    public Money MarketValue => Stock.CurrentPrice * Quantity;

    /// <summary>Invested capital = buy price × quantity (or MarketValue if buy price not recorded).</summary>
    public Money InvestedAmount => AverageBuyPrice.HasValue
        ? AverageBuyPrice.Value * Quantity
        : MarketValue;

    /// <summary>Unrealized Profit/Loss in absolute rupees = MarketValue - InvestedAmount.</summary>
    public Money UnrealizedPnL => MarketValue - InvestedAmount;

    /// <summary>Unrealized Profit/Loss percentage = ((MarketValue - InvestedAmount) / InvestedAmount) * 100.</summary>
    public decimal UnrealizedPnLPercent => InvestedAmount.Amount > 0
        ? Math.Round(((MarketValue.Amount - InvestedAmount.Amount) / InvestedAmount.Amount) * 100m, 2)
        : 0m;

    /// <summary>Creates a new Holding with a different quantity (immutable update).</summary>
    public Holding WithQuantity(decimal newQuantity) => new()
    {
        Stock = Stock,
        Quantity = newQuantity,
        AverageBuyPrice = AverageBuyPrice
    };

    public override string ToString() => $"{Quantity:N2} x {Stock.Ticker} = {MarketValue} (Buy: {AverageBuyPrice})";
}
