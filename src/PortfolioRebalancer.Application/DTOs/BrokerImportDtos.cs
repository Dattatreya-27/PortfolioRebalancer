namespace PortfolioRebalancer.Application.DTOs;

public enum BrokerImportMode
{
    Merge,        // Smart-merge into active portfolio with weighted average cost recalculation
    KeepSeparate, // Create a dedicated new portfolio (e.g. "Zerodha Portfolio")
    Replace       // Overwrite existing portfolio holdings
}

public sealed record BrokerParsedHoldingItem(
    string Ticker,
    decimal Quantity,
    decimal AveragePrice,
    decimal? Ltp = null,
    string? Isin = null,
    string? RawSymbol = null
);

public sealed record BrokerParseResult(
    string BrokerDetected, // "Zerodha", "Angel One", "Generic Broker"
    string FileFormat,     // "CSV", "Excel"
    IReadOnlyList<BrokerParsedHoldingItem> Holdings
);

public sealed record HoldingMergeAuditItemDto(
    string Ticker,
    string Name,
    string Sector,
    decimal PreviousQuantity,
    decimal PreviousBuyPrice,
    decimal ImportedQuantity,
    decimal ImportedBuyPrice,
    decimal NewTotalQuantity,
    decimal NewWeightedBuyPrice,
    bool WasMerged // true = updated existing holding, false = added new holding
);

public sealed record BrokerImportResponseDto(
    Guid PortfolioId,
    string PortfolioName,
    string BrokerDetected,
    BrokerImportMode ModeUsed,
    int TotalImportedPositions,
    int MergedPositionsCount,
    int NewPositionsCount,
    decimal TotalPortfolioValue,
    IReadOnlyList<HoldingMergeAuditItemDto> MergeAudit,
    PortfolioSummaryDto Portfolio
);
