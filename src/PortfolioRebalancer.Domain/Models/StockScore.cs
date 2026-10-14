namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Multi-factor score and policy alignment profile for an individual stock.
/// Encapsulates Fundamental, Technical, and National/Global Macro Policy factors.
/// </summary>
public sealed record StockScore(
    decimal FundamentalScore,    // 0 - 100: Valuation, ROE/ROCE, Debt, Dividend
    decimal TechnicalScore,      // 0 - 100: Trend (vs 50/200 DMA), RSI, Momentum
    decimal MacroPolicyScore,    // 0 - 100: Government capex, PLI, RBI rates, Global demand
    string PolicyTailwindSummary,// Descriptive analysis of key policy alignment
    IReadOnlyList<string> RiskFlags // Active warnings (e.g., "Trading below 200 DMA", "P/E > Sector Avg")
)
{
    /// <summary>
    /// Weighted composite rating: 40% Fundamental, 30% Technical, 30% Macro Policy.
    /// </summary>
    public decimal OverallScore => Math.Round(
        (FundamentalScore * 0.40m) +
        (TechnicalScore * 0.30m) +
        (MacroPolicyScore * 0.30m), 1);

    public string RatingCategory => OverallScore switch
    {
        >= 80 => "Strong Buy / Outperform",
        >= 65 => "Accumulate",
        >= 50 => "Neutral / Hold",
        >= 35 => "Underperform",
        _ => "High Risk / Reduce"
    };

    public bool HasCriticalRisk => RiskFlags.Count > 0;
}
