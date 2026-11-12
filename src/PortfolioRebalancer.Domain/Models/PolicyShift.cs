namespace PortfolioRebalancer.Domain.Models;

public record PolicyShift(
    string Id,
    string Title,
    string Scope, // "Domestic" | "International"
    string Category, // "UnionBudget" | "PLI" | "RBI_SEBI" | "Tax_Customs" | "Tariffs_Trade" | "Visa_Outsourcing" | "FDA_Regulatory" | "Geopolitics_ChinaPlus1"
    string AnnouncedDate,
    string SourceAuthority,
    string Summary,
    IReadOnlyList<string> AffectedSectors,
    IReadOnlyList<string> KeyKeywords
);

public record PolicyHoldingImpact(
    string PolicyId,
    string PolicyTitle,
    string Scope,
    string Category,
    string AnnouncedDate,
    string SourceAuthority,
    string Ticker,
    string StockName,
    string Sector,
    string ImpactType,      // "DIRECT" | "INDIRECT"
    string ImpactDirection, // "POSITIVE" | "NEGATIVE" | "WATCH"
    string Rationale
);
