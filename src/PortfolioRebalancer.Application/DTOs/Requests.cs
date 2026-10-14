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
