using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Enhanced stock evaluation service returning multi-factor scores and policy alignment.
/// </summary>
public sealed class StockEvaluationService(
    IStockDataProvider stockProvider,
    IStockScoringService scoringService)
{
    public async Task<StockEvaluationDetailDto?> EvaluateAsync(string ticker)
    {
        var stock = await stockProvider.GetStockAsync(ticker);
        if (stock is null) return null;

        var score = scoringService.CalculateScore(stock);

        return new StockEvaluationDetailDto(
            Ticker: stock.Ticker.Value,
            Name: stock.Name,
            Sector: stock.Sector.ToString(),
            Price: stock.CurrentPrice.Amount,
            Currency: stock.CurrentPrice.Currency,
            PERatio: stock.PERatio,
            DividendYield: stock.DividendYield,
            MarketCap: stock.MarketCap,
            OverallScore: score.OverallScore,
            FundamentalScore: score.FundamentalScore,
            TechnicalScore: score.TechnicalScore,
            MacroPolicyScore: score.MacroPolicyScore,
            RatingCategory: score.RatingCategory,
            PolicyTailwindSummary: score.PolicyTailwindSummary,
            RiskFlags: score.RiskFlags
        );
    }
}
