using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Domain model representing an executed trade (Buy or Sell) with realized gain/loss tracking.
/// Can be imported from Zerodha Tradebook/P&amp;L or Angel One Trade History, or recorded via in-app trade execution.
/// </summary>
public sealed class TradeRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Ticker Ticker { get; init; }
    public string StockName { get; init; } = string.Empty;
    public required string Action { get; init; } // "BUY" or "SELL"
    public decimal Quantity { get; init; }
    public required Money Price { get; init; }
    public DateTime TradeDate { get; init; } = DateTime.UtcNow;
    public string? OrderId { get; init; }
    public string? Exchange { get; init; } // "NSE", "BSE"
    public string? TradeSource { get; init; } // "Zerodha Tradebook", "Angel One Trade History", "Manual / In-App"

    // Realized Profit/Loss fields (populated on SELL fills)
    public Money? RealizedPnL { get; init; }
    public decimal? RealizedPnLPercent { get; init; }
    public decimal? CostBasisPrice { get; init; }
    public int? HoldingDays { get; init; }
    public string? Notes { get; init; }

    /// <summary>Gross trade turnover value (Quantity * Price)</summary>
    public Money TradeValue => Money.INR(Math.Round(Quantity * Price.Amount, 2));

    /// <summary>Whether this trade generated a positive realized profit.</summary>
    public bool IsWinningTrade => (RealizedPnL?.Amount ?? 0m) > 0m;

    /// <summary>Tax category based on Indian equity holding period (>= 365 days = LTCG, &lt; 365 days = STCG)</summary>
    public string? TaxClassification
    {
        get
        {
            if (!Action.Equals("SELL", StringComparison.OrdinalIgnoreCase) || !HoldingDays.HasValue)
                return null;

            return HoldingDays.Value >= 365 ? "LTCG (Long-Term)" : "STCG (Short-Term)";
        }
    }
}
