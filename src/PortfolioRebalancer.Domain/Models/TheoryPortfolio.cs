namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Academic literature, foundational books, research papers, and economists backing the quant theory.
/// </summary>
public sealed record TheoryLiteratureCitation(
    string PrimaryBook,
    string AuthorOrEconomist,
    int PublicationYear,
    string KeyAcademicPaper,
    string JournalOrUniversity,
    string CoreTenet,
    string MathematicalFormula,
    string RebalanceAndExitRules
);

/// <summary>
/// Individual mock stock constituent in the theory portfolio.
/// </summary>
public sealed record TheoryConstituent(
    string Ticker,
    string Name,
    string Sector,
    int Shares,
    decimal EntryPrice,
    DateTime EntryDate,
    decimal CurrentPrice,
    decimal AllocatedCapital,
    decimal CurrentValue,
    decimal UnrealizedPnl,
    decimal ReturnPercent,
    decimal WeightPercent,
    string QuantitativeScreenerMetric,
    string ThesisRationale
);

/// <summary>
/// Historical observation checkpoint tracking portfolio performance over weeks and months.
/// </summary>
public sealed record TheoryTrackingSnapshot(
    string MilestoneLabel,
    DateTime Timestamp,
    decimal PortfolioValue,
    decimal PortfolioReturnPercent,
    decimal BenchmarkReturnPercent,
    decimal AlphaPercent
);

/// <summary>
/// Mock investment portfolio driven by a specific market theory for multi-month tracking.
/// </summary>
public sealed record TheoryPortfolio(
    string StrategyId,
    string Name,
    string Category,
    string Tagline,
    decimal InitialCapital,
    decimal CurrentValue,
    decimal TotalReturnAmount,
    decimal TotalReturnPercent,
    decimal BenchmarkReturnPercent,
    decimal AlphaPercent,
    decimal MaxDrawdownPercent,
    decimal SharpeRatio,
    decimal WinRatePercent,
    DateTime InceptionDate,
    int TrackingDays,
    string StatusBadge,
    TheoryLiteratureCitation Literature,
    IReadOnlyList<TheoryConstituent> Constituents,
    IReadOnlyList<TheoryTrackingSnapshot> TrackingHistory,
    IReadOnlyList<string> ResearchJournalNotes
);

/// <summary>
/// Aggregated dashboard payload for the Theory Lab & Mock Incubator view.
/// </summary>
public sealed record TheoryIncubatorDashboardDto(
    DateTime AsOfDate,
    decimal BenchmarkNifty50ReturnPercent,
    IReadOnlyList<TheoryPortfolio> Portfolios,
    string ExecutiveSummary
);
