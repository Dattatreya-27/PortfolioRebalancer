namespace PortfolioRebalancer.Application.DTOs;

/// <summary>
/// Request DTOs — thin data carriers for API input.
/// Using records for immutability and built-in equality.
/// </summary>

public sealed record CreatePortfolioRequest(string Name);

public sealed record AddHoldingRequest(string Ticker, decimal Quantity, decimal? BuyPrice = null);

public sealed record BatchAddHoldingsRequest(List<HoldingItemRequest> Holdings);

public sealed record HoldingItemRequest(string Ticker, decimal Quantity, decimal? BuyPrice = null);

public sealed record RebalanceRequest(List<SectorAllocationItem> TargetAllocations);

public sealed record SectorAllocationItem(string Sector, decimal TargetWeightPercent);

public sealed record ExecuteTradeRequest(
    string Ticker,
    string Action, // "BUY", "SELL", "ADJUST"
    decimal Quantity,
    decimal TradePrice
);

public sealed record UpdateHoldingRequest(decimal Quantity, decimal BuyPrice);

public sealed record AngelOneSyncRequest(List<AngelOneHoldingItemRequest> Holdings);

public sealed record AngelOneHoldingItemRequest(
    string TradingSymbol,
    decimal Quantity,
    decimal AveragePrice,
    decimal? Ltp = null
);

public sealed record ImportAngelOneFileRequest(string? FilePath = null);
