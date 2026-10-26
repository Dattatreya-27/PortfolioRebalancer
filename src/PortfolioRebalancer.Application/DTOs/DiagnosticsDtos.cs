namespace PortfolioRebalancer.Application.DTOs;

public sealed record StockEvaluationDetailDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Price,
    string Currency,
    decimal? PERatio,
    decimal? DividendYield,
    decimal? MarketCap,
    decimal OverallScore,
    decimal QualityScore,
    decimal RelativeValuationScore,
    decimal SectorCycleScore,
    decimal InstitutionalGovernanceScore,
    decimal MacroPolicyScore,
    string RatingCategory,
    string InvestmentArchetype,
    string SectorCycleStatus,
    string InstitutionalCommentary,
    string PolicyTailwindSummary,
    PeerBenchmarkDto PeerBenchmark,
    GovernanceAuditDto GovernanceAudit,
    InstitutionalFlowDto InstitutionalFlow,
    IReadOnlyList<string> Strengths,
    IReadOnlyList<string> RiskFlags,
    decimal FundamentalScore,
    decimal TechnicalScore,
    decimal FairValueEstimate = 0m,
    decimal MarginOfSafetyPercent = 0m,
    string ValuationBandVerdict = "",
    IReadOnlyList<StockAlternativeDto>? BetterMarketAlternatives = null,
    CompanySupplyChainDto? SupplyChain = null,
    ShareholdingPatternDto? ShareholdingPattern = null,
    ManagementAuditDto? ManagementAudit = null
);

public sealed record ShareholdingPatternDto(
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
    IReadOnlyList<WhaleTransactionDto> RecentWhaleDeals,
    decimal BigPublicInvestorsPercent = 0m,
    decimal GeneralRetailPublicPercent = 0m,
    IReadOnlyList<BigPublicInvestorDto>? BigPublicInvestors = null
);

public sealed record BigPublicInvestorDto(
    string InvestorName,
    decimal StakePercent,
    decimal HoldingValueCrores,
    string InvestorType,
    string TrendDirection
);

public sealed record WhaleTransactionDto(
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

public sealed record ManagementAuditDto(
    string IntegrityRating,
    decimal GovernanceScore,
    string CapitalAllocationTrackRecord,
    string ExecutionCapability,
    string ManagementSentiment,
    string SentimentSummary,
    string LatestConcallHighlights,
    string ConcallDate,
    IReadOnlyList<ManagementEventAlertDto> MajorEventsAndUproar
);

public sealed record ManagementEventAlertDto(
    string EventDate,
    string EventType,
    string Severity,
    string Headline,
    string Details,
    string StrategicImpact
);

public sealed record CompanySupplyChainDto(
    string BusinessModelSummary,
    IReadOnlyList<SupplyChainInputDto> KeyInputs,
    ValueChainTransformationDto ValueChain,
    IReadOnlyList<SupplyChainOutputDto> KeyOutputs,
    IReadOnlyList<SupplyChainSensitivityDto> MacroCostSensitivities,
    CustomerConcentrationDto? CustomerConcentration = null,
    BloombergSplcAuditDto? SplcAudit = null
);

public sealed record SupplyChainInputDto(
    string Name,
    string Category,
    string TypicalSourceOrSuppliers,
    string CostWeightEstimate,
    string RiskOrVolatilityNote,
    string SupplierBargainingPower = "Moderate",
    string PassThroughLagDays = "30-45 Days",
    decimal EstimatedCogsPercent = 0m,
    string TierLevel = "Tier-1",
    string SourcingContractType = "Formula-Indexed"
);

public sealed record ValueChainTransformationDto(
    string CoreProcess,
    string ValueAdditionSummary,
    string MoatFactor,
    string GrossConversionMargin = "",
    string MoatRating = "Competitive Moat",
    decimal ConversionMarginPercent = 0m,
    string KeyPatentsOrCertifications = "",
    int WorkingCapitalCycleDays = 0,
    decimal CapexToRevenuePercent = 0m
);

public sealed record SupplyChainOutputDto(
    string ProductOrService,
    string CustomerSegment,
    string RevenueContribution,
    string DemandDrivers,
    string CustomerConcentration = "Diversified",
    decimal RevenueSharePercent = 0m,
    int PricingPowerScore = 5,
    decimal ExportRevenuePercent = 0m,
    string CounterpartyRiskTier = "Investment Grade"
);

public sealed record SupplyChainSensitivityDto(
    string FactorName,
    string ImpactDirection,
    string Mechanism,
    string ElasticityMetric = "",
    string QuantitativeScenario = "",
    decimal MarginImpactBps = 0m,
    int PassThroughLagDays = 0,
    string MitigationBuffer = ""
);

public sealed record CustomerConcentrationDto(
    decimal Top1CustomerPercent,
    decimal Top5CustomerPercent,
    decimal Top10CustomerPercent,
    decimal HerfindahlHirschmanIndex,
    string CounterpartyRiskGrade,
    string ConcentrationVerdict
);

public sealed record BloombergSplcAuditDto(
    string PrimarySupplierCountryConcentration,
    string SingleSourceVulnerability,
    string SplcRelationshipStatus,
    decimal CostPassThroughElasticityScore
);

public sealed record StockAlternativeDto(
    string Ticker,
    string Name,
    decimal Price,
    decimal PeRatio,
    decimal PegRatio,
    decimal RocePercent,
    string WhyBetter,
    string MomentumBadge
);

public sealed record PeerBenchmarkDto(
    decimal StockPE,
    decimal SectorMedianPE,
    decimal PegRatio,
    string ValuationVerdict,
    IReadOnlyList<string> TopPeers
);

public sealed record GovernanceAuditDto(
    decimal PromoterHoldingPercent,
    decimal PromoterPledgePercent,
    decimal RocePercent,
    decimal RoePercent,
    decimal DebtToEquity,
    string GovernanceRating
);

public sealed record InstitutionalFlowDto(
    decimal FiiHoldingPercent,
    decimal DiiHoldingPercent,
    string InstitutionalConsensus,
    string FlowTrend
);

public sealed record PortfolioDiagnosticsDto(
    Guid PortfolioId,
    decimal HealthScore,
    string HealthGrade,
    string HealthRating,
    string ExecutiveSummary,
    HhiConcentrationDto Concentration,
    MarketCapDistributionDto MarketCapSplit,
    TailEndDilutionDto TailEndAnalysis,
    PnlHarvestingSummaryDto Harvesting,
    IReadOnlyList<ConstraintViolationDto> Violations,
    IReadOnlyList<AdvisoryGuidancePillarDto> AdvisoryPillars,
    IReadOnlyList<UpcomingEventDto> UpcomingEvents,
    CrashDefenseDto? CrashDefense = null,
    MarketRegimeDto? MarketRegime = null,
    IReadOnlyList<PositionThesisAuditDto>? ThesisAudit = null,
    MorningBriefingDto? MorningBriefing = null
);

public sealed record MarketRegimeDto(
    string Status,             // RISK_ON_EXPANSION | CHOP_CONSOLIDATION | MACRO_DRAWDOWN_CORRECTION
    string Title,              // Plain English: "Selective Bull Market", "Macro Liquidity Pullback"
    string BadgeClass,         // Emerald, Amber, Rose styling
    decimal NiftyCurrent,
    decimal NiftyChangePercent,
    decimal Nifty50Dma,
    decimal Nifty200Dma,
    decimal MarketBreadthPercent, // % stocks above 50 DMA (e.g. 58%)
    decimal IndiaVix,
    string RebalancePolicyVerdict, // "FREEZE LOSS-BOOKING: Broader market is down on macro beta..."
    string TacticalGuidance
);

public sealed record PositionThesisAuditDto(
    string Ticker,
    string Name,
    string Sector,
    decimal BuyPrice,
    decimal CurrentPrice,
    decimal UnrealizedPnL,
    decimal UnrealizedPnLPercent,
    decimal WeightPercent,
    string Classification,    // DORMANT_COMPOUNDER | DEAD_CAPITAL_TRAP | HEALTHY_GROWTH
    string BadgeClass,
    string CoreDiagnosis,     // Why is this stock red? e.g. "Dragged down by cyclical small-cap selloff despite 24% ROCE"
    string FundamentalMoat,   // Zero debt, 28% ROCE, Sovereign monopoly
    string ActionRule,        // "DO NOT BOOK LOSS: Business is sound. Rebound horizon: 3-5 months." vs "PRUNE / CONVICTION SWAP: Deteriorating fundamentals."
    string? RecommendedSwapTicker = null,
    string? RecommendedSwapName = null,
    string? SwapAdvantage = null
);

public sealed record MorningBriefingDto(
    string Greeting,
    string TodayActionSummary,   // "No Action Needed" or "1 Strategic Swap Suggested"
    string ActionTone,          // emerald | amber | cyan
    string MarketPulseSummary,  // 2-sentence macro summary
    int SoundHoldingsCount,     // Number of fundamentally sound positions
    int AttentionPositionsCount,// Number of positions with true fundamental impairment
    IReadOnlyList<string> ActionBullets,
    IReadOnlyList<PositionThesisAuditDto> KeyPositionsToHold,
    IReadOnlyList<PositionThesisAuditDto> TrapsToTrim
);

public sealed record CrashDefenseDto(
    int Score,
    string Grade,
    decimal ZeroDebtRatioPercent,
    decimal HighRoceRatioPercent,
    decimal LargeCapRatioPercent,
    decimal TenPercentCorrectionDipRupees,
    decimal TenPercentCorrectionDipPercent,
    string ExpectedRecoveryHorizon,
    string PeaceOfMindSummary
);

public sealed record HhiConcentrationDto(
    decimal HhiScore,
    decimal EffectiveHoldings,
    string DiversificationStatus,
    string Verdict,
    string MaxStockTicker,
    decimal MaxStockWeight,
    string MaxSectorName,
    decimal MaxSectorWeight,
    decimal Top5WeightPercent
);

public sealed record MarketCapDistributionDto(
    decimal LargeCapPercent,
    decimal MidCapPercent,
    decimal SmallCapPercent,
    decimal LargeCapValue,
    decimal MidCapValue,
    decimal SmallCapValue,
    string BenchmarkComparison,
    decimal MicroCapPercent = 0m,
    decimal MicroCapValue = 0m
);

public sealed record TailEndDilutionDto(
    int MicroHoldingsCount,
    decimal TotalMicroValue,
    decimal PercentOfPortfolio,
    IReadOnlyList<string> MicroTickers,
    string Rationale
);

public sealed record PnlHarvestingSummaryDto(
    int ProfitPositionsCount,
    int LossPositionsCount,
    decimal TotalUnrealizedPnL,
    decimal TotalUnrealizedPnLPercent,
    IReadOnlyList<HarvestingCandidateDto> ProfitBookingCandidates,
    IReadOnlyList<HarvestingCandidateDto> LossHarvestingCandidates
);

public sealed record HarvestingCandidateDto(
    string Ticker,
    string Name,
    decimal BuyPrice,
    decimal CurrentPrice,
    decimal PnlPercent,
    decimal MarketValue,
    string ActionReason,
    string SuggestedAction
);

public sealed record AdvisoryGuidancePillarDto(
    string Category,
    string Title,
    string Description,
    string ImpactLevel,
    string ActionBadge,
    IReadOnlyList<string> TargetTickers
);

public sealed record ConstraintViolationDto(
    string RuleName,
    string Target,
    decimal CurrentValue,
    decimal AllowedLimit,
    string Severity
);

public sealed record UpcomingEventDto(
    string? Ticker,
    string EventTitle,
    string EventType,
    string ScheduledDate,
    string ExpectedImpact
);