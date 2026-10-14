namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Institutional multi-factor stock scorecard modeled after top equity research frameworks.
/// Evaluates:
/// 1. Fundamental Quality (ROCE, ROE, Balance Sheet strength)
/// 2. Relative Valuation & PEG (P/E relative to sector & earnings growth, P/B for banks)
/// 3. Sector & Industry Cycle (Industry momentum, capex expansion vs margin contraction)
/// 4. Management & Institutional Sponsorship (Promoter pledge, FII/DII holdings, corporate governance)
/// 5. Macro Policy & National Catalysts (PLI, Union Budget capex, domestic indigenization)
/// </summary>
public sealed record StockScore(
    decimal QualityScore,                // 0 - 100: ROCE/ROE, Balance Sheet, Free Cash Flow
    decimal RelativeValuationScore,      // 0 - 100: PEG ratio, Sector-Relative P/E & P/B
    decimal SectorCycleScore,            // 0 - 100: Sector momentum, Capex cycle, Demand tailwinds
    decimal InstitutionalGovernanceScore,// 0 - 100: FII/DII flows, Promoter pledge, Clean accounting
    decimal MacroPolicyScore,            // 0 - 100: Government capex, Make In India, PLI
    string InvestmentArchetype,          // e.g. "High-Quality Compounder (GARP)", "Capex & Policy Leader", "Cyclical Re-Rating"
    string SectorCycleStatus,            // e.g. "Expansionary Capex Phase", "Mid-Cycle Compounding", "Trough / Turnaround"
    string InstitutionalCommentary,      // In-depth analyst commentary
    string PolicyTailwindSummary,        // Key national policy alignment
    PeerBenchmarkData PeerBenchmark,     // Peer comparisons (Stock P/E vs Sector Median, PEG)
    GovernanceAuditData GovernanceAudit, // Promoter stake, pledge, ROCE, Debt/Equity
    InstitutionalFlowData InstitutionalFlow, // FII/DII stakes, flow trend
    IReadOnlyList<string> Strengths,     // Core competitive moats
    IReadOnlyList<string> RiskFlags      // Key operational or valuation risks
)
{
    /// <summary>
    /// Institutional weighted score:
    /// 25% Quality + 20% Relative Valuation + 20% Sector Cycle + 20% Governance/Institutions + 15% Policy
    /// </summary>
    public decimal OverallScore => Math.Round(
        (QualityScore * 0.25m) +
        (RelativeValuationScore * 0.20m) +
        (SectorCycleScore * 0.20m) +
        (InstitutionalGovernanceScore * 0.20m) +
        (MacroPolicyScore * 0.15m), 1);

    public string RatingCategory => OverallScore switch
    {
        >= 82 => "Strong Buy / Outperform",
        >= 72 => "Accumulate / Buy on Dips",
        >= 58 => "Hold / Core Compounder",
        >= 45 => "Neutral / Review Thesis",
        _ => "Underperform / Prune"
    };

    // Backward compatibility properties for diagnostics and legacy callers
    public decimal FundamentalScore => QualityScore;
    public decimal TechnicalScore => SectorCycleScore;
    public bool HasCriticalRisk => RiskFlags.Count > 0;
}

public sealed record PeerBenchmarkData(
    decimal StockPE,
    decimal SectorMedianPE,
    decimal PegRatio,
    string ValuationVerdict,
    IReadOnlyList<string> TopPeers
);

public sealed record GovernanceAuditData(
    decimal PromoterHoldingPercent,
    decimal PromoterPledgePercent,
    decimal RocePercent,
    decimal RoePercent,
    decimal DebtToEquity,
    string GovernanceRating
);

public sealed record InstitutionalFlowData(
    decimal FiiHoldingPercent,
    decimal DiiHoldingPercent,
    string InstitutionalConsensus,
    string FlowTrend
);