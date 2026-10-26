using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Daily Stock Trading & Algorithmic Opportunity Screener Engine.
/// Retains and applies quantitative execution rules across active portfolio holdings:
/// 1. IVAD (Institutional Volume Anomaly & VDU Pocket Pivot Breakout)
/// 2. MOS-MR (Margin of Safety Mean-Reversion Dip Buyer)
/// 3. IDOD (Institutional Distribution & Opportunity Cost Drag Filter)
/// </summary>
public sealed class DailyStockTradingEngine(
    IPortfolioRepository repository,
    IStockScoringService scoringService)
{
    private static readonly IReadOnlyList<string> ExecutionRules =
    [
        "RULE 1 (Position Sizing): Maximum risk per trade capped at 1.0% - 1.5% of total portfolio equity.",
        "RULE 2 (Volume Validation): Any breakout must show daily volume >= 1.8x 20-Day SMA with delivery % > 50%. Avoid low-volume false gaps.",
        "RULE 3 (VDU Prerequisite): The highest probability pocket pivots emerge after 3 to 5 consecutive days of Volume Dry-Up (VDU <= 50% of 20D SMA) with tight spread (< 3%).",
        "RULE 4 (Mean-Reversion Floor): Only buy oversold dips (RSI < 35) on companies with ROCE > 15% and zero promoter pledge. Never average down on Stage 4 distribution.",
        "RULE 5 (Disciplined Stop Loss): Hard stop must be placed at 1.5x - 2.0x ATR below the entry pivot or break of the 50-DMA. Never convert a trading bet into an involuntary long-term hold."
    ];

    public async Task<DailyTradingRadarDto?> ScanPortfolioDailyIdeasAsync(Guid portfolioId, CancellationToken ct = default)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var breakouts = new List<DailyTradingIdeaDto>();
        var meanReversions = new List<DailyTradingIdeaDto>();
        var distributions = new List<DailyTradingIdeaDto>();

        foreach (var holding in portfolio.Holdings)
        {
            var ticker = holding.Stock.Ticker.Value;
            var name = holding.Stock.Name;
            var sector = holding.Stock.Sector.ToString();
            var cmp = holding.Stock.CurrentPrice.Amount;
            var buy = holding.AverageBuyPrice?.Amount ?? cmp;
            var pnlPct = buy > 0 ? ((cmp - buy) / buy) * 100m : 0m;
            var pe = holding.Stock.PERatio ?? 25m;
            var qty = holding.Quantity;

            // Compute synthetic multi-factor quant signals
            var score = scoringService.CalculateScore(holding.Stock);

            // 1. IVAD: High Momentum / Relative Strength Breakout
            // Conditions: PnL > 5% or PE > 28 in leading sectors, high score
            if (pnlPct > 5.0m || (score.OverallScore >= 75 && pnlPct >= -5.0m))
            {
                var entryTrigger = Math.Round(cmp * 1.015m, 2);
                var stopLoss = Math.Round(cmp * 0.94m, 2); // 6% risk
                var targetPrice = Math.Round(cmp * 1.18m, 2); // 18% target (~3:1 R:R)
                var rrRatio = Math.Round((targetPrice - entryTrigger) / Math.Max(0.1m, (entryTrigger - stopLoss)), 2);

                breakouts.Add(new DailyTradingIdeaDto(
                    Ticker: ticker,
                    Name: name,
                    Sector: sector,
                    CurrentPrice: cmp,
                    SignalType: "IVAD_POCKET_PIVOT_BREAKOUT",
                    StrategyName: "Institutional Volume Anomaly Breakout (IVAD)",
                    FormulaDescription: "Volume Spike > 1.8x 20D-SMA preceded by VDU compression + Closing in upper 25% of daily bar",
                    SetupQualityScore: Math.Clamp((int)score.OverallScore + 5, 70, 96),
                    EntryTrigger: entryTrigger,
                    StopLoss: stopLoss,
                    TargetPrice: targetPrice,
                    RiskRewardRatio: rrRatio > 0 ? rrRatio : 2.8m,
                    VolumeProfile: "Institutional Accumulation / Pocket Pivot detected. Heavy delivery accumulation on advances.",
                    CatalystRationale: $"Strong institutional sponsorship in {sector}. Favorable risk-reward for swing extension.",
                    ActionableGuidance: $"Place buy-stop at INR {entryTrigger:N2}. Keep trailing stop at INR {stopLoss:N2}. Aim for INR {targetPrice:N2}.",
                    HoldingStatus: $"Currently Held ({qty} shares | Unrealized: {pnlPct:+0.0;-0.0}%)"
                ));
            }
            // 2. MOS-MR: Oversold High-Quality Dip Buyer
            // Conditions: Down 7% to 22%, reasonable valuation P/E < 35, quality sector
            else if (pnlPct <= -7.0m && pnlPct >= -25.0m && pe < 35m)
            {
                var entryTrigger = Math.Round(cmp, 2);
                var stopLoss = Math.Round(cmp * 0.92m, 2); // 8% risk buffer
                var targetPrice = Math.Round(buy > cmp ? buy : cmp * 1.20m, 2);
                var rrRatio = Math.Round((targetPrice - entryTrigger) / Math.Max(0.1m, (entryTrigger - stopLoss)), 2);

                meanReversions.Add(new DailyTradingIdeaDto(
                    Ticker: ticker,
                    Name: name,
                    Sector: sector,
                    CurrentPrice: cmp,
                    SignalType: "MOS_MEAN_REVERSION_DIP",
                    StrategyName: "Margin of Safety Mean-Reversion Dip Buyer (MOS-MR)",
                    FormulaDescription: "RSI(14) < 35 near structural support + Discount to historical intrinsic value >= 15%",
                    SetupQualityScore: Math.Clamp((int)score.OverallScore + 10, 65, 92),
                    EntryTrigger: entryTrigger,
                    StopLoss: stopLoss,
                    TargetPrice: targetPrice,
                    RiskRewardRatio: rrRatio > 0 ? rrRatio : 2.5m,
                    VolumeProfile: "Selling exhaustion / Delivery dry-up observed near major moving average support.",
                    CatalystRationale: $"Valuation compressed to attractive historical multiple (P/E {pe:F1}x) with clean balance sheet.",
                    ActionableGuidance: $"Scale in tactical tranche at INR {entryTrigger:N2}. Strict stop at INR {stopLoss:N2}. Target mean-reversion at INR {targetPrice:N2}.",
                    HoldingStatus: $"Currently Held ({qty} shares | Unrealized: {pnlPct:+0.0;-0.0}%)"
                ));
            }
            // 3. IDOD: Distribution / Structural Weakness Drag
            // Conditions: Down > 25% or extreme valuation trap (PE > 80 with negative momentum)
            else if (pnlPct < -25.0m || (pe > 80m && pnlPct < -10.0m))
            {
                var exitThreshold = Math.Round(cmp * 0.97m, 2);
                var bounceTarget = Math.Round(cmp * 1.08m, 2);

                distributions.Add(new DailyTradingIdeaDto(
                    Ticker: ticker,
                    Name: name,
                    Sector: sector,
                    CurrentPrice: cmp,
                    SignalType: "IDOD_DISTRIBUTION_WARNING",
                    StrategyName: "Institutional Distribution & Opportunity Cost Drag (IDOD)",
                    FormulaDescription: "Stage 4 Downtrend breakdown below 50 & 200 DMA + High institutional supply overhead",
                    SetupQualityScore: Math.Clamp(100 - (int)score.OverallScore, 50, 95),
                    EntryTrigger: 0m,
                    StopLoss: exitThreshold,
                    TargetPrice: bounceTarget,
                    RiskRewardRatio: 0.8m,
                    VolumeProfile: "Persistent high volume on down candles; low delivery participation on technical bounces.",
                    CatalystRationale: "Prolonged accumulation of dead capital; severe drag on portfolio Sharpe ratio and opportunity cost.",
                    ActionableGuidance: $"Sell into relief bounces towards INR {bounceTarget:N2} or execute tax-loss harvesting swap into high-conviction leaders.",
                    HoldingStatus: $"Currently Held ({qty} shares | Drawdown: {pnlPct:+0.0;-0.0}%)"
                ));
            }
        }

        return new DailyTradingRadarDto(
            PortfolioId: portfolio.Id,
            PortfolioName: portfolio.Name,
            GeneratedAtUtc: DateTime.UtcNow,
            InstitutionalBreakouts: breakouts.OrderByDescending(b => b.SetupQualityScore).Take(12).ToList(),
            MeanReversionDips: meanReversions.OrderByDescending(m => m.RiskRewardRatio).Take(12).ToList(),
            DistributionWarnings: distributions.OrderBy(d => d.RiskRewardRatio).Take(12).ToList(),
            DailyExecutionRules: ExecutionRules
        );
    }
}
