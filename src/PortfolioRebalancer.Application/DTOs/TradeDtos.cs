namespace PortfolioRebalancer.Application.DTOs;

public sealed record TradeRecordDto(
    Guid Id,
    string Ticker,
    string StockName,
    string Action,
    decimal Quantity,
    decimal Price,
    DateTime TradeDate,
    decimal TradeValue,
    string? OrderId,
    string? Exchange,
    string? TradeSource,
    decimal? RealizedPnL,
    decimal? RealizedPnLPercent,
    decimal? CostBasisPrice,
    int? HoldingDays,
    string? TaxClassification,
    string? Notes
);

public sealed record TradeAnalyticsDto(
    Guid PortfolioId,
    string PortfolioName,
    int TotalTradesCount,
    int BuyTradesCount,
    int SellTradesCount,
    decimal TotalRealizedPnL,
    decimal RealizedProfitOnly,
    decimal RealizedLossOnly,
    int WinningTradesCount,
    int LosingTradesCount,
    decimal WinRatePercent,
    decimal ProfitFactor,
    decimal AverageHoldingDays,
    decimal ShortTermCapitalGainsPnL, // STCG (< 365 days)
    decimal LongTermCapitalGainsPnL,  // LTCG (>= 365 days)
    IReadOnlyList<TradeRecordDto> RecentTrades,
    IReadOnlyList<TopTradedStockDto> TopTradedStocks
);

public sealed record TopTradedStockDto(
    string Ticker,
    string StockName,
    int TradeCount,
    decimal TotalVolume,
    decimal TotalRealizedPnL,
    decimal WinRatePercent
);

public sealed record BrokerTradebookImportResultDto(
    Guid PortfolioId,
    string PortfolioName,
    string BrokerDetected,
    string FileFormat,
    int TotalTradesParsed,
    int BuysImported,
    int SellsImported,
    int MatchedRoundTrips,
    decimal NetRealizedPnL,
    IReadOnlyList<TradeRecordDto> Trades
);
