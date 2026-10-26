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
    IReadOnlyList<string> RiskFlags,     // Key operational or valuation risks
    decimal FairValueEstimate = 0m,      // Estimated intrinsic fair value in INR
    decimal MarginOfSafetyPercent = 0m,  // Discount (+) or Premium (-) relative to CMP
    string ValuationBandVerdict = "",    // e.g. "Attractive Buy / Undervalued"
    IReadOnlyList<StockAlternative>? BetterMarketAlternatives = null, // Curated alternative ideas
    CompanySupplyChainProfile? SupplyChain = null, // Input-transformation-output & raw material graph
    ShareholdingPatternData? ShareholdingPattern = null, // Institutional shareholding: Promoters, FII, DII, Govt, Public & Whale deals
    ManagementAuditData? ManagementAudit = null // Management evaluation, concall sentiment & major governance events/uproar
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

public sealed record StockAlternative(
    string Ticker,
    string Name,
    decimal Price,
    decimal PeRatio,
    decimal PegRatio,
    decimal RocePercent,
    string WhyBetter,
    string MomentumBadge
);

public sealed record ShareholdingPatternData(
    decimal PromoterPercent,
    decimal FiiPercent,
    decimal DiiPercent,
    decimal GovernmentPercent,
    decimal PublicPercent,
    decimal PromoterPledgePercent,
    string QuarterPeriod,
    decimal QoQPromoterChange,
    decimal QoQFiiChange,
    decimal QoQDiiChange,
    IReadOnlyList<WhaleTransactionAlert> RecentWhaleDeals,
    decimal BigPublicInvestorsPercent = 0m,
    decimal GeneralRetailPublicPercent = 0m,
    IReadOnlyList<BigPublicInvestorDetail>? BigPublicInvestors = null
);

public sealed record BigPublicInvestorDetail(
    string InvestorName,
    decimal StakePercent,
    decimal HoldingValueCrores,
    string InvestorType, // "Super-Investor / Marquee HNI" | "Family Office" | "Corporate Body"
    string TrendDirection // "ACCUMULATING" | "STEADY" | "NEW_ENTRY" | "TRIMMING"
);

public sealed record WhaleTransactionAlert(
    string DealDate,
    string ClientName,
    string DealType, // "BUY" or "SELL"
    string TransactionType, // "BULK_DEAL (>0.5%)" or "BLOCK_DEAL (>1% / ₹10Cr+)" or "PROMOTER_SAST"
    decimal Quantity,
    decimal TradePrice,
    decimal StakePercent,
    decimal DealValueCrores,
    string Significance
);

public sealed record ManagementAuditData(
    string IntegrityRating, // "Tier-1 Pristine Governance" | "Disciplined / Clean" | "Watchlist / Moderate Concerns" | "Severe Governance Red Flag"
    decimal GovernanceScore, // 0 - 100
    string CapitalAllocationTrackRecord, // "Disciplined: High ROCE (>22%), Zero Dilution, Consistent Free Cash Flow"
    string ExecutionCapability, // "Industry Leader: Aggressive store rollout with industry-leading sales/sqft"
    string ManagementSentiment, // "BULLISH_EXPANSION" | "CAUTIOUSLY_OPTIMISTIC" | "DEFENSIVE_CHOP" | "DISTRESSED"
    string SentimentSummary, // Summary of management outlook
    string LatestConcallHighlights, // Key takeaways from latest concall
    string ConcallDate, // e.g. "Q2 FY25 Earnings Call"
    IReadOnlyList<ManagementEventAlert> MajorEventsAndUproar // Key positive catalysts or negative governance/uproar events
);

public sealed record ManagementEventAlert(
    string EventDate,
    string EventType, // "GOVERNANCE_UPROAR" | "MANAGEMENT_SHAKEUP" | "PROMOTER_ACTION" | "CAPEX_BREAKTHROUGH" | "REGULATORY_SCRUTINY"
    string Severity, // "POSITIVE_CATALYST" | "CRITICAL_RED_FLAG" | "WATCHLIST_NOTICE" | "NEUTRAL"
    string Headline,
    string Details,
    string StrategicImpact
);