namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Institutional Supply Chain, Input Sourcing Matrix, Value-Creation Transformation, 
/// Customer Concentration & Macro Stress Elasticity Profile.
/// Modeled after Bloomberg Terminal SPLC <GO>, FactSet Revere Supply Chain, and Koyfin Factor Sensitivities.
/// </summary>
public sealed record CompanySupplyChainProfile(
    string BusinessModelSummary,
    IReadOnlyList<SupplyChainInput> KeyInputs,
    ValueChainTransformation ValueChain,
    IReadOnlyList<SupplyChainOutput> KeyOutputs,
    IReadOnlyList<SupplyChainSensitivity> MacroCostSensitivities,
    CustomerConcentrationProfile? CustomerConcentration = null,
    BloombergSplcAuditProfile? SplcAudit = null
);

public sealed record SupplyChainInput(
    string Name,
    string Category, // e.g., "Raw Material", "Energy / Power", "Semiconductor / Hardware", "Software / Talent"
    string TypicalSourceOrSuppliers, // e.g., "Domestic Steel & Aluminium Mills", "Imported TSMC / Nvidia Chips"
    string CostWeightEstimate, // e.g., "High (35-45% of COGS)", "Medium (15-20%)"
    string RiskOrVolatilityNote, // e.g., "Sensitive to global crude oil and petrochemical prices"
    string SupplierBargainingPower = "Moderate", // "Low (Buyer Monopsony)", "Moderate", "High (Bottleneck / Oligopoly)"
    string PassThroughLagDays = "30-45 Days", // e.g., "15-21 Days", "30-45 Days", "60-90 Days"
    decimal EstimatedCogsPercent = 0m, // CFA benchmark estimated % of COGS or OPEX (e.g., 42.0m)
    string TierLevel = "Tier-1", // "Tier-1 Direct Contract", "Tier-2 Sub-component", "Tier-3 Foundry"
    string SourcingContractType = "Formula-Indexed" // "Spot Market", "Fixed Annual", "Formula-Indexed", "Cost-Plus"
);

public sealed record ValueChainTransformation(
    string CoreProcess, // e.g., "Embedded Automotive Software Architecture, Calibration & AUTOSAR Stack"
    string ValueAdditionSummary, // e.g., "Converts raw silicon and OEM specs into certified automotive operating systems"
    string MoatFactor, // e.g., "High switching costs, 99.8% multi-year OEM integration lock-in"
    string GrossConversionMargin = "", // e.g., "38-42% Gross Margin", "24-27% EBITDA Conversion"
    string MoatRating = "Competitive Moat", // "Wide Moat", "Statutory Monopoly", "High Cost Advantage"
    decimal ConversionMarginPercent = 0m, // Precise numeric conversion margin %
    string KeyPatentsOrCertifications = "", // AS9100D, IATF 16949, ALMM Tier-1, ISO 26262 ASIL-D
    int WorkingCapitalCycleDays = 0, // DIO + DSO - DPO in days (negative = negative working capital cash cow)
    decimal CapexToRevenuePercent = 0m // Capital intensity %
);

public sealed record SupplyChainOutput(
    string ProductOrService, // e.g., "Autonomous Driving Software, Powertrain Control ECUs"
    string CustomerSegment, // e.g., "Global Tier-1 OEMs (BMW, JLR, Honda, Paccar)"
    string RevenueContribution, // e.g., "Passenger Cars (72%), Commercial Vehicles (28%)"
    string DemandDrivers, // e.g., "Software-Defined Vehicles (SDVs), EV electrification mandate"
    string CustomerConcentration = "Diversified", // e.g., "Top 5 = 48% (Moderate Concentration)", "Diversified Retail B2C"
    decimal RevenueSharePercent = 0m, // Numerical revenue share %
    int PricingPowerScore = 5, // 1 to 10 scale
    decimal ExportRevenuePercent = 0m, // Domestic vs Export %
    string CounterpartyRiskTier = "Investment Grade" // "Sovereign / AAA", "High Grade Corporates", "Dispersed Retail"
);

public sealed record SupplyChainSensitivity(
    string FactorName, // e.g., "Crude Oil Price Spike", "Chip Shortage / Supply Chain Bottlenecks"
    string ImpactDirection, // "Negative" (Margin Squeeze) or "Positive" (Margin Expansion)
    string Mechanism, // e.g., "Raises freight and packaging material costs by ~150 bps"
    string ElasticityMetric = "", // e.g., "-140 bps EBITDA per +15% Crude rise", "+₹4,800/unit CV cost rise"
    string QuantitativeScenario = "", // Exact scenario description
    decimal MarginImpactBps = 0m, // Numeric basis points impact
    int PassThroughLagDays = 0, // Days to pass through
    string MitigationBuffer = "" // Inventory turn cushion, hedging, formula pass-through
);

public sealed record CustomerConcentrationProfile(
    decimal Top1CustomerPercent, // % revenue from single largest client
    decimal Top5CustomerPercent, // % revenue from top 5 clients
    decimal Top10CustomerPercent, // % revenue from top 10 clients
    decimal HerfindahlHirschmanIndex, // HHI score (0 to 10,000)
    string CounterpartyRiskGrade, // "Sovereign / Central Govt", "Tier-1 Global Automakers", "Dispersed Mass Consumer", "State Discoms"
    string ConcentrationVerdict // "Ultra-Granular Retail", "Moderate Strategic Accounts", "Sovereign Monopsony Concentration"
);

public sealed record BloombergSplcAuditProfile(
    string PrimarySupplierCountryConcentration, // "Domestic India (70%), China (15%), US/EU (15%)"
    string SingleSourceVulnerability, // "Low - Dual-sourcing on >85% BOM items"
    string SplcRelationshipStatus, // "Direct OEM Contract & Strategic Long-Term Alliance"
    decimal CostPassThroughElasticityScore // 0-100 score of pricing power & margin defense
);
