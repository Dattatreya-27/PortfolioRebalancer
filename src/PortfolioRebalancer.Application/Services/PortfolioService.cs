using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.Strategies;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Orchestrates portfolio operations — the bridge between API controllers and domain logic.
/// 
/// KEY PATTERN: Application Services coordinate but don't contain business rules.
/// Business rules live in the Domain layer (Portfolio, SectorTargetStrategy).
/// This service handles: loading, mapping, saving, and delegating to domain objects.
/// </summary>
public sealed class PortfolioService(
    IPortfolioRepository repository,
    IStockDataProvider stockProvider)
{
    public async Task<PortfolioSummaryDto> CreatePortfolioAsync(string name)
    {
        var portfolio = new Portfolio { Name = name };
        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> GetPortfolioAsync(Guid id)
    {
        var portfolio = await repository.GetByIdAsync(id);
        return portfolio is null ? null : MapToSummary(portfolio);
    }

    public async Task<IReadOnlyList<PortfolioSummaryDto>> GetAllPortfoliosAsync()
    {
        var portfolios = await repository.GetAllAsync();
        return portfolios.Select(MapToSummary).ToList();
    }

    public async Task<PortfolioSummaryDto?> AddHoldingAsync(
        Guid portfolioId, string ticker, decimal quantity, decimal? buyPrice = null)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var stock = await stockProvider.GetStockAsync(ticker)
            ?? throw new ArgumentException($"Unknown stock ticker: {ticker}");

        portfolio.AddHolding(new Holding
        {
            Stock = stock,
            Quantity = quantity,
            AverageBuyPrice = buyPrice.HasValue ? Money.INR(buyPrice.Value) : null
        });
        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> AddHoldingsBatchAsync(
        Guid portfolioId, IEnumerable<HoldingItemRequest> items)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var itemList = items.ToList();
        var tickers = itemList.Select(i => i.Ticker).Distinct();
        var stocks = await stockProvider.GetStocksAsync(tickers);
        var stockLookup = stocks.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

        foreach (var item in itemList)
        {
            if (stockLookup.TryGetValue(item.Ticker.Trim().ToUpperInvariant(), out var stock))
            {
                var cleanQty = Math.Round(item.Quantity, 0, MidpointRounding.AwayFromZero);
                if (cleanQty <= 0) continue;

                portfolio.AddHolding(new Holding
                {
                    Stock = stock,
                    Quantity = cleanQty,
                    AverageBuyPrice = item.BuyPrice.HasValue ? Money.INR(item.BuyPrice.Value) : null
                });
            }
        }

        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> SyncLiveQuotesAsync(Guid portfolioId)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value).Distinct().ToList();
        if (tickers.Count > 0)
        {
            var freshStocks = await stockProvider.GetStocksAsync(tickers);
            var priceMap = freshStocks.ToDictionary(s => s.Ticker.Value, s => s.CurrentPrice, StringComparer.OrdinalIgnoreCase);
            portfolio.UpdateHoldingPrices(priceMap);
            await repository.SaveAsync(portfolio);
        }

        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> RemoveHoldingAsync(Guid portfolioId, string ticker)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        portfolio.RemoveHolding(new Ticker(ticker));
        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> ExecuteTradeAsync(
        Guid portfolioId, string ticker, string action, decimal quantity, decimal tradePrice)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var cleanTicker = ticker.Trim().ToUpperInvariant();
        var stock = await stockProvider.GetStockAsync(cleanTicker)
            ?? throw new ArgumentException($"Unknown stock ticker: {cleanTicker}");

        var wholeQty = Math.Round(quantity, 0, MidpointRounding.AwayFromZero);
        if (wholeQty <= 0 && !action.Equals("ADJUST", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Trade quantity must be at least 1 whole share.", nameof(quantity));

        portfolio.ExecuteTrade(stock, action, wholeQty, tradePrice);
        await repository.SaveAsync(portfolio);
        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> UpdateHoldingAsync(
        Guid portfolioId, string ticker, decimal quantity, decimal buyPrice)
    {
        return await ExecuteTradeAsync(portfolioId, ticker, "ADJUST", quantity, buyPrice);
    }

    public async Task<PortfolioSummaryDto?> SyncAngelOneHoldingsAsync(
        Guid portfolioId, List<AngelOneHoldingItemRequest> items)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        var cleanItems = items
            .Where(i => i.Quantity > 0)
            .Select(i =>
            {
                var sym = i.TradingSymbol.Trim().ToUpperInvariant();
                sym = System.Text.RegularExpressions.Regex.Replace(sym, "-(EQ|BE)$", "");
                return new { Ticker = sym, i.Quantity, i.AveragePrice, i.Ltp };
            })
            .ToList();

        var tickers = cleanItems.Select(x => x.Ticker).Distinct().ToList();
        var stocks = await stockProvider.GetStocksAsync(tickers);
        var stockLookup = stocks.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

        var newHoldings = new List<Holding>();
        foreach (var item in cleanItems)
        {
            if (stockLookup.TryGetValue(item.Ticker, out var stock))
            {
                if (item.Ltp.HasValue && item.Ltp.Value > 0)
                {
                    stock.UpdateMarketData(Money.INR(item.Ltp.Value), stock.PERatio, stock.DividendYield, stock.MarketCap);
                }

                newHoldings.Add(new Holding
                {
                    Stock = stock,
                    Quantity = Math.Round(item.Quantity, 0, MidpointRounding.AwayFromZero),
                    AverageBuyPrice = Money.INR(item.AveragePrice)
                });
            }
        }

        if (newHoldings.Count > 0)
        {
            portfolio.ReplaceHoldings(newHoldings);
            await repository.SaveAsync(portfolio);
        }

        return MapToSummary(portfolio);
    }

    public async Task<PortfolioSummaryDto?> ImportAngelOneExcelAsync(Guid portfolioId, Stream excelStream, string? password = null)
    {
        var items = AngelOneExcelParser.ParseHoldings(excelStream, password);
        return await SyncAngelOneHoldingsAsync(portfolioId, items);
    }

    public async Task<BrokerImportResponseDto?> ImportBrokerHoldingsAsync(
        Guid? portfolioId,
        Stream fileStream,
        string fileName,
        BrokerImportMode mode,
        string? newPortfolioName = null,
        string? password = null,
        CancellationToken ct = default)
    {
        var parseResult = BrokerHoldingsParser.Parse(fileStream, fileName, password);
        if (parseResult.Holdings.Count == 0)
        {
            throw new InvalidOperationException($"No active positions found in '{fileName}'. Please verify file format and columns.");
        }

        var tickers = parseResult.Holdings.Select(x => x.Ticker).Distinct().ToList();
        var stocks = await stockProvider.GetStocksAsync(tickers);
        var stockLookup = stocks.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

        Portfolio targetPortfolio;
        var mergeAudit = new List<HoldingMergeAuditItemDto>();
        int mergedCount = 0;
        int newPositionsCount = 0;

        if (mode == BrokerImportMode.KeepSeparate || !portfolioId.HasValue)
        {
            string portName = !string.IsNullOrWhiteSpace(newPortfolioName)
                ? newPortfolioName.Trim()
                : $"{parseResult.BrokerDetected} Portfolio";

            targetPortfolio = new Portfolio { Name = portName };

            var newHoldings = new List<Holding>();
            foreach (var item in parseResult.Holdings)
            {
                if (stockLookup.TryGetValue(item.Ticker, out var stock))
                {
                    if (item.Ltp.HasValue && item.Ltp.Value > 0)
                    {
                        stock.UpdateMarketData(Money.INR(item.Ltp.Value), stock.PERatio, stock.DividendYield, stock.MarketCap);
                    }

                    var h = new Holding
                    {
                        Stock = stock,
                        Quantity = item.Quantity,
                        AverageBuyPrice = Money.INR(item.AveragePrice)
                    };
                    newHoldings.Add(h);
                    mergeAudit.Add(new HoldingMergeAuditItemDto(
                        Ticker: stock.Ticker.Value,
                        Name: stock.Name,
                        Sector: stock.Sector.ToString(),
                        PreviousQuantity: 0,
                        PreviousBuyPrice: 0,
                        ImportedQuantity: item.Quantity,
                        ImportedBuyPrice: item.AveragePrice,
                        NewTotalQuantity: item.Quantity,
                        NewWeightedBuyPrice: item.AveragePrice,
                        WasMerged: false
                    ));
                    newPositionsCount++;
                }
            }

            targetPortfolio.ReplaceHoldings(newHoldings);
            await repository.SaveAsync(targetPortfolio);
        }
        else
        {
            var existingPortfolio = await repository.GetByIdAsync(portfolioId.Value);
            if (existingPortfolio is null) return null;
            targetPortfolio = existingPortfolio;

            if (mode == BrokerImportMode.Replace)
            {
                var newHoldings = new List<Holding>();
                foreach (var item in parseResult.Holdings)
                {
                    if (stockLookup.TryGetValue(item.Ticker, out var stock))
                    {
                        if (item.Ltp.HasValue && item.Ltp.Value > 0)
                        {
                            stock.UpdateMarketData(Money.INR(item.Ltp.Value), stock.PERatio, stock.DividendYield, stock.MarketCap);
                        }

                        newHoldings.Add(new Holding
                        {
                            Stock = stock,
                            Quantity = item.Quantity,
                            AverageBuyPrice = Money.INR(item.AveragePrice)
                        });
                        mergeAudit.Add(new HoldingMergeAuditItemDto(
                            Ticker: stock.Ticker.Value,
                            Name: stock.Name,
                            Sector: stock.Sector.ToString(),
                            PreviousQuantity: 0,
                            PreviousBuyPrice: 0,
                            ImportedQuantity: item.Quantity,
                            ImportedBuyPrice: item.AveragePrice,
                            NewTotalQuantity: item.Quantity,
                            NewWeightedBuyPrice: item.AveragePrice,
                            WasMerged: false
                        ));
                        newPositionsCount++;
                    }
                }
                targetPortfolio.ReplaceHoldings(newHoldings);
                await repository.SaveAsync(targetPortfolio);
            }
            else // BrokerImportMode.Merge
            {
                foreach (var item in parseResult.Holdings)
                {
                    if (stockLookup.TryGetValue(item.Ticker, out var stock))
                    {
                        if (item.Ltp.HasValue && item.Ltp.Value > 0)
                        {
                            stock.UpdateMarketData(Money.INR(item.Ltp.Value), stock.PERatio, stock.DividendYield, stock.MarketCap);
                        }

                        var existing = targetPortfolio.Holdings.FirstOrDefault(h => h.Stock.Ticker.Value.Equals(item.Ticker, StringComparison.OrdinalIgnoreCase));
                        if (existing != null)
                        {
                            decimal oldQty = existing.Quantity;
                            decimal oldAvg = existing.AverageBuyPrice?.Amount ?? existing.Stock.CurrentPrice.Amount;
                            decimal addQty = item.Quantity;
                            decimal addPrice = item.AveragePrice;
                            decimal newQty = oldQty + addQty;
                            decimal newWeightedPrice = newQty > 0
                                ? Math.Round(((oldQty * oldAvg) + (addQty * addPrice)) / newQty, 2)
                                : addPrice;

                            targetPortfolio.AddHolding(new Holding
                            {
                                Stock = stock,
                                Quantity = newQty,
                                AverageBuyPrice = Money.INR(newWeightedPrice)
                            });

                            mergeAudit.Add(new HoldingMergeAuditItemDto(
                                Ticker: stock.Ticker.Value,
                                Name: stock.Name,
                                Sector: stock.Sector.ToString(),
                                PreviousQuantity: oldQty,
                                PreviousBuyPrice: oldAvg,
                                ImportedQuantity: addQty,
                                ImportedBuyPrice: addPrice,
                                NewTotalQuantity: newQty,
                                NewWeightedBuyPrice: newWeightedPrice,
                                WasMerged: true
                            ));
                            mergedCount++;
                        }
                        else
                        {
                            targetPortfolio.AddHolding(new Holding
                            {
                                Stock = stock,
                                Quantity = item.Quantity,
                                AverageBuyPrice = Money.INR(item.AveragePrice)
                            });

                            mergeAudit.Add(new HoldingMergeAuditItemDto(
                                Ticker: stock.Ticker.Value,
                                Name: stock.Name,
                                Sector: stock.Sector.ToString(),
                                PreviousQuantity: 0,
                                PreviousBuyPrice: 0,
                                ImportedQuantity: item.Quantity,
                                ImportedBuyPrice: item.AveragePrice,
                                NewTotalQuantity: item.Quantity,
                                NewWeightedBuyPrice: item.AveragePrice,
                                WasMerged: false
                            ));
                            newPositionsCount++;
                        }
                    }
                }
                await repository.SaveAsync(targetPortfolio);
            }
        }

        var summary = MapToSummary(targetPortfolio);

        return new BrokerImportResponseDto(
            PortfolioId: targetPortfolio.Id,
            PortfolioName: targetPortfolio.Name,
            BrokerDetected: parseResult.BrokerDetected,
            ModeUsed: mode,
            TotalImportedPositions: parseResult.Holdings.Count,
            MergedPositionsCount: mergedCount,
            NewPositionsCount: newPositionsCount,
            TotalPortfolioValue: summary.TotalValue,
            MergeAudit: mergeAudit,
            Portfolio: summary
        );
    }

    public async Task<RebalanceRecommendationDto?> RebalanceAsync(
        Guid portfolioId, List<SectorAllocationItem> targets)
    {
        var portfolio = await repository.GetByIdAsync(portfolioId);
        if (portfolio is null) return null;

        // Map request DTOs to domain value objects
        var allocations = targets.Select(t =>
        {
            if (!Enum.TryParse<Sector>(t.Sector, ignoreCase: true, out var sector))
                throw new ArgumentException($"Invalid sector: '{t.Sector}'");
            return new SectorAllocation(sector, new Percentage(t.TargetWeightPercent));
        });

        portfolio.SetTargetAllocations(allocations);
        await repository.SaveAsync(portfolio);

        // Delegate to domain strategy — the service doesn't know HOW to rebalance
        var strategy = new SectorTargetStrategy();
        var result = strategy.Calculate(portfolio);

        return MapToRecommendation(result);
    }

    // --- Mapping helpers: Domain → DTOs ---
    // These prevent domain model leakage through the API boundary.

    private static PortfolioSummaryDto MapToSummary(Portfolio portfolio)
    {
        var totalValue = portfolio.TotalValue.Amount;
        var totalInvested = portfolio.TotalInvested.Amount;

        var holdings = portfolio.Holdings.Select(h =>
        {
            var mc = h.Stock.MarketCap;
            var mcVal = mc ?? 0m;
            string mcapCat = mcVal >= 200_000_000_000m ? "Large Cap"
                           : mcVal >= 50_000_000_000m ? "Mid Cap"
                           : mcVal >= 10_000_000_000m ? "Small Cap"
                           : "Micro Cap";

            return new HoldingDto(
                Ticker: h.Stock.Ticker.Value,
                Name: h.Stock.Name,
                Sector: h.Stock.Sector.ToString(),
                Quantity: Math.Round(h.Quantity, 0, MidpointRounding.AwayFromZero),
                BuyPrice: h.AverageBuyPrice?.Amount ?? h.Stock.CurrentPrice.Amount,
                Price: h.Stock.CurrentPrice.Amount,
                InvestedValue: Math.Round(h.InvestedAmount.Amount, 2),
                MarketValue: Math.Round(h.MarketValue.Amount, 2),
                UnrealizedPnL: Math.Round(h.UnrealizedPnL.Amount, 2),
                UnrealizedPnLPercent: h.UnrealizedPnLPercent,
                WeightPercent: totalValue > 0
                    ? Math.Round(h.MarketValue.Amount / totalValue * 100, 2)
                    : 0,
                PriceSource: "NSE_LIVE",
                DayChange: Math.Round(h.Stock.DayChange, 2),
                DayChangePercent: h.Stock.DayChangePercent,
                DayPnL: Math.Round(h.DayPnL.Amount, 2),
                MarketCap: mc,
                MarketCapCategory: mcapCat
            );
        }).ToList();

        var currentWeights = portfolio.GetCurrentSectorWeights();
        var targetLookup = portfolio.TargetAllocations
            .ToDictionary(a => a.Sector, a => a.TargetWeight.Value);

        var sectorWeights = currentWeights.Select(kv => new SectorWeightDto(
            Sector: kv.Key.ToString(),
            CurrentWeight: Math.Round(kv.Value.Value, 2),
            TargetWeight: targetLookup.TryGetValue(kv.Key, out var tw) ? tw : null
        )).ToList();

        // Include sectors with targets but no current holdings
        foreach (var (sector, weight) in targetLookup)
        {
            if (!currentWeights.ContainsKey(sector))
            {
                sectorWeights.Add(new SectorWeightDto(
                    Sector: sector.ToString(),
                    CurrentWeight: 0,
                    TargetWeight: weight));
            }
        }

        return new PortfolioSummaryDto(
            Id: portfolio.Id,
            Name: portfolio.Name,
            TotalValue: Math.Round(totalValue, 2),
            TotalInvested: Math.Round(totalInvested, 2),
            TotalUnrealizedPnL: Math.Round(portfolio.TotalUnrealizedPnL.Amount, 2),
            TotalUnrealizedPnLPercent: portfolio.TotalUnrealizedPnLPercent,
            Currency: "INR",
            Holdings: holdings,
            SectorWeights: sectorWeights,
            LastSyncedAt: portfolio.LastSyncedAt,
            TotalDayPnL: Math.Round(portfolio.TotalDayPnL.Amount, 2),
            TotalDayPnLPercent: portfolio.TotalDayPnLPercent);
    }

    private static RebalanceRecommendationDto MapToRecommendation(RebalanceResult result)
    {
        var trades = result.Trades.Select(t => new TradeRecommendationDto(
            Ticker: t.Ticker.Value,
            StockName: t.StockName,
            Sector: t.Sector.ToString(),
            Action: t.Action,
            CurrentQuantity: t.CurrentQuantity,
            TargetQuantity: Math.Round(t.TargetQuantity, 2),
            DeltaQuantity: Math.Round(t.DeltaQuantity, 2),
            CurrentValue: Math.Round(t.CurrentValue.Amount, 2),
            TargetValue: Math.Round(t.TargetValue.Amount, 2)
        )).ToList();

        var drifts = result.SectorDrifts.Select(d => new SectorDriftDto(
            Sector: d.Sector.ToString(),
            CurrentWeight: Math.Round(d.CurrentWeight.Value, 2),
            TargetWeight: Math.Round(d.TargetWeight.Value, 2),
            DriftPercentagePoints: Math.Round(d.DriftPercentagePoints, 2),
            Direction: d.IsOverweight ? "Overweight" : d.IsUnderweight ? "Underweight" : "On Target"
        )).ToList();

        return new RebalanceRecommendationDto(
            TotalValue: Math.Round(result.EstimatedTotalValue.Amount, 2),
            Trades: trades,
            SectorDrifts: drifts);
    }
}
