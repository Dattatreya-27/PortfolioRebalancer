using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Enhanced stock evaluation service returning multi-factor scores, peer benchmarks,
/// management governance audit, institutional flows, and policy alignment.
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
            QualityScore: score.QualityScore,
            RelativeValuationScore: score.RelativeValuationScore,
            SectorCycleScore: score.SectorCycleScore,
            InstitutionalGovernanceScore: score.InstitutionalGovernanceScore,
            MacroPolicyScore: score.MacroPolicyScore,
            RatingCategory: score.RatingCategory,
            InvestmentArchetype: score.InvestmentArchetype,
            SectorCycleStatus: score.SectorCycleStatus,
            InstitutionalCommentary: score.InstitutionalCommentary,
            PolicyTailwindSummary: score.PolicyTailwindSummary,
            PeerBenchmark: new PeerBenchmarkDto(
                StockPE: score.PeerBenchmark.StockPE,
                SectorMedianPE: score.PeerBenchmark.SectorMedianPE,
                PegRatio: score.PeerBenchmark.PegRatio,
                ValuationVerdict: score.PeerBenchmark.ValuationVerdict,
                TopPeers: score.PeerBenchmark.TopPeers
            ),
            GovernanceAudit: new GovernanceAuditDto(
                PromoterHoldingPercent: score.GovernanceAudit.PromoterHoldingPercent,
                PromoterPledgePercent: score.GovernanceAudit.PromoterPledgePercent,
                RocePercent: score.GovernanceAudit.RocePercent,
                RoePercent: score.GovernanceAudit.RoePercent,
                DebtToEquity: score.GovernanceAudit.DebtToEquity,
                GovernanceRating: score.GovernanceAudit.GovernanceRating
            ),
            InstitutionalFlow: new InstitutionalFlowDto(
                FiiHoldingPercent: score.InstitutionalFlow.FiiHoldingPercent,
                DiiHoldingPercent: score.InstitutionalFlow.DiiHoldingPercent,
                InstitutionalConsensus: score.InstitutionalFlow.InstitutionalConsensus,
                FlowTrend: score.InstitutionalFlow.FlowTrend
            ),
            Strengths: score.Strengths,
            RiskFlags: score.RiskFlags,
            FundamentalScore: score.FundamentalScore,
            TechnicalScore: score.TechnicalScore
        );
    }
}