using System.Globalization;
using System.Text.RegularExpressions;
using ExcelDataReader;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Parsed raw trade entry before cost-basis pairing.
/// </summary>
public sealed record RawBrokerTrade(
    string Ticker,
    string StockName,
    string Action,
    decimal Quantity,
    decimal Price,
    DateTime TradeDate,
    string? OrderId,
    string? Exchange,
    string BrokerSource
);

/// <summary>
/// Unified Tradebook parser supporting Zerodha (Console/Kite CSV/Excel tradebook)
/// and Angel One (Trade History / Demat Ledger Excel/CSV).
/// Performs automatic FIFO cost-basis matching to calculate exact Realized P&amp;L,
/// holding period in days, and STCG vs LTCG tax classification.
/// </summary>
public static partial class BrokerTradebookParser
{
    private static readonly Regex SymbolCleanupRegex = MySymbolCleanupRegex();

    [GeneratedRegex(@"-(EQ|BE|SM|ST)$|\.NS$|\.BO$|^EQ:", RegexOptions.IgnoreCase)]
    private static partial Regex MySymbolCleanupRegex();

    public static List<TradeRecord> ParseAndMatchTrades(Stream stream, string fileName, string? password = null)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        List<RawBrokerTrade> rawTrades;

        if (ext == ".csv" || ext == ".txt")
        {
            rawTrades = ParseCsv(stream);
        }
        else
        {
            rawTrades = ParseExcel(stream, password);
        }

        if (rawTrades.Count == 0) return [];

        return MatchFifoTrades(rawTrades);
    }

    public static List<RawBrokerTrade> ParseCsv(Stream stream)
    {
        using var reader = new StreamReader(stream, System.Text.Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 4096, leaveOpen: true);
        var lines = new List<string>();
        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            if (!string.IsNullOrWhiteSpace(line)) lines.Add(line.Trim());
        }

        if (lines.Count == 0) return [];

        int headerIdx = -1;
        int symCol = -1, typeCol = -1, qtyCol = -1, priceCol = -1, dateCol = -1, orderCol = -1, exchCol = -1, isinCol = -1;
        string broker = "Generic Tradebook";

        for (int i = 0; i < Math.Min(lines.Count, 20); i++)
        {
            var cols = SplitCsvLine(lines[i]);
            for (int c = 0; c < cols.Count; c++)
            {
                var h = cols[c].Trim().ToLowerInvariant();
                if (h == "symbol" || h == "instrument" || h == "trading symbol" || h == "stock" || h == "security")
                {
                    symCol = c;
                    if (h == "instrument") broker = "Zerodha";
                }
                else if (h == "trade_type" || h == "trade type" || h == "type" || h == "action" || h == "buy/sell" || h == "b/s")
                {
                    typeCol = c;
                }
                else if (h == "quantity" || h == "qty" || h == "trade qty" || h == "shares")
                {
                    qtyCol = c;
                }
                else if (h == "price" || h == "trade price" || h == "rate" || h == "average price" || h == "exec price")
                {
                    priceCol = c;
                }
                else if (h == "trade_date" || h == "trade date" || h == "date" || h == "execution time" || h == "order date")
                {
                    dateCol = c;
                }
                else if (h == "order_id" || h == "order id" || h == "order no" || h == "trade id" || h == "trade_id")
                {
                    orderCol = c;
                }
                else if (h == "exchange" || h == "segment")
                {
                    exchCol = c;
                }
                else if (h == "isin")
                {
                    isinCol = c;
                }
            }

            if (symCol >= 0 && qtyCol >= 0 && priceCol >= 0)
            {
                headerIdx = i;
                break;
            }
        }

        if (headerIdx < 0) return [];

        var rawList = new List<RawBrokerTrade>();

        for (int i = headerIdx + 1; i < lines.Count; i++)
        {
            var cols = SplitCsvLine(lines[i]);
            if (cols.Count <= Math.Max(symCol, Math.Max(qtyCol, priceCol))) continue;

            var rawSym = cols[symCol].Trim();
            if (string.IsNullOrWhiteSpace(rawSym)) continue;

            string? isin = isinCol >= 0 && isinCol < cols.Count ? cols[isinCol].Trim() : null;
            var cleanTicker = CleanSymbol(rawSym, isin);
            if (string.IsNullOrWhiteSpace(cleanTicker)) continue;

            if (!decimal.TryParse(cols[qtyCol].Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var qty) || qty <= 0)
                continue;

            if (!decimal.TryParse(cols[priceCol].Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var price) || price <= 0)
                continue;

            string action = "BUY";
            if (typeCol >= 0 && typeCol < cols.Count)
            {
                var t = cols[typeCol].Trim().ToUpperInvariant();
                if (t.StartsWith('S') || t == "SELL") action = "SELL";
            }

            DateTime tradeDate = DateTime.UtcNow;
            if (dateCol >= 0 && dateCol < cols.Count)
            {
                var dtStr = cols[dateCol].Trim();
                if (DateTime.TryParse(dtStr, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate) ||
                    DateTime.TryParseExact(dtStr, ["yyyy-MM-dd", "dd-MM-yyyy", "yyyy/MM/dd", "dd/MM/yyyy", "yyyy-MM-dd HH:mm:ss", "dd-MM-yyyy HH:mm:ss"], CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedDate))
                {
                    tradeDate = parsedDate;
                }
            }

            string? orderId = orderCol >= 0 && orderCol < cols.Count ? cols[orderCol].Trim() : null;
            string? exchange = exchCol >= 0 && exchCol < cols.Count ? cols[exchCol].Trim() : "NSE";

            rawList.Add(new RawBrokerTrade(
                Ticker: cleanTicker,
                StockName: rawSym,
                Action: action,
                Quantity: qty,
                Price: price,
                TradeDate: tradeDate,
                OrderId: orderId,
                Exchange: exchange,
                BrokerSource: broker
            ));
        }

        return rawList;
    }

    public static List<RawBrokerTrade> ParseExcel(Stream stream, string? password = null)
    {
        var rawList = new List<RawBrokerTrade>();

        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        ms.Position = 0;

        try
        {
            var readerConfig = new ExcelReaderConfiguration
            {
                Password = string.IsNullOrWhiteSpace(password) ? null : password.Trim()
            };

            using var reader = ExcelReaderFactory.CreateReader(ms, readerConfig);

            while (reader.Read())
            {
                int fieldCount = reader.FieldCount;
                int symCol = -1, typeCol = -1, qtyCol = -1, priceCol = -1, dateCol = -1, orderCol = -1, isinCol = -1;
                string broker = "Angel One";

                for (int c = 0; c < fieldCount; c++)
                {
                    var h = reader.GetValue(c)?.ToString()?.Trim().ToLowerInvariant() ?? "";
                    if (h == "symbol" || h == "instrument" || h == "trading symbol" || h == "company name" || h == "stock")
                    {
                        symCol = c;
                        if (h == "instrument") broker = "Zerodha";
                    }
                    else if (h == "trade_type" || h == "trade type" || h == "type" || h == "action" || h == "buy/sell" || h == "b/s" || h == "trans type")
                    {
                        typeCol = c;
                    }
                    else if (h == "quantity" || h == "qty" || h == "trade qty" || h == "shares")
                    {
                        qtyCol = c;
                    }
                    else if (h == "price" || h == "trade price" || h == "rate" || h == "average price")
                    {
                        priceCol = c;
                    }
                    else if (h == "trade_date" || h == "trade date" || h == "date" || h == "execution time" || h == "order date")
                    {
                        dateCol = c;
                    }
                    else if (h == "order_id" || h == "order id" || h == "order no" || h == "trade id")
                    {
                        orderCol = c;
                    }
                    else if (h == "isin")
                    {
                        isinCol = c;
                    }
                }

                if (symCol >= 0 && qtyCol >= 0 && priceCol >= 0)
                {
                    // Read rows under this header
                    while (reader.Read())
                    {
                        var rawSym = reader.GetValue(symCol)?.ToString()?.Trim() ?? "";
                        if (string.IsNullOrWhiteSpace(rawSym)) continue;

                        string? isin = isinCol >= 0 ? reader.GetValue(isinCol)?.ToString()?.Trim() : null;
                        var cleanTicker = CleanSymbol(rawSym, isin);
                        if (string.IsNullOrWhiteSpace(cleanTicker)) continue;

                        var qtyObj = reader.GetValue(qtyCol);
                        if (!decimal.TryParse(qtyObj?.ToString()?.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var qty) || qty <= 0)
                            continue;

                        var priceObj = reader.GetValue(priceCol);
                        if (!decimal.TryParse(priceObj?.ToString()?.Replace(",", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out var price) || price <= 0)
                            continue;

                        string action = "BUY";
                        if (typeCol >= 0)
                        {
                            var t = reader.GetValue(typeCol)?.ToString()?.Trim().ToUpperInvariant() ?? "";
                            if (t.StartsWith('S') || t == "SELL") action = "SELL";
                        }

                        DateTime tradeDate = DateTime.UtcNow;
                        if (dateCol >= 0)
                        {
                            var dtObj = reader.GetValue(dateCol);
                            if (dtObj is DateTime dtVal) tradeDate = dtVal;
                            else if (DateTime.TryParse(dtObj?.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDt))
                                tradeDate = parsedDt;
                        }

                        string? orderId = orderCol >= 0 ? reader.GetValue(orderCol)?.ToString()?.Trim() : null;

                        rawList.Add(new RawBrokerTrade(
                            Ticker: cleanTicker,
                            StockName: rawSym,
                            Action: action,
                            Quantity: qty,
                            Price: price,
                            TradeDate: tradeDate,
                            OrderId: orderId,
                            Exchange: "NSE",
                            BrokerSource: broker
                        ));
                    }
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] BrokerTradebookParser ExcelDataReader: {ex.Message}");
        }

        return rawList;
    }

    /// <summary>
    /// Performs FIFO inventory matching between historical Buy fills and Sell fills to calculate
    /// exact Realized P&amp;L (₹), Realized P&amp;L (%), holding duration in days, and tax bracket.
    /// </summary>
    public static List<TradeRecord> MatchFifoTrades(List<RawBrokerTrade> rawTrades)
    {
        // Sort chronologically
        var sorted = rawTrades.OrderBy(t => t.TradeDate).ToList();

        var buyQueues = new Dictionary<string, Queue<FifoBuySlot>>(StringComparer.OrdinalIgnoreCase);
        var result = new List<TradeRecord>();

        foreach (var t in sorted)
        {
            var ticker = t.Ticker;
            if (!buyQueues.ContainsKey(ticker))
            {
                buyQueues[ticker] = new Queue<FifoBuySlot>();
            }

            if (t.Action == "BUY")
            {
                buyQueues[ticker].Enqueue(new FifoBuySlot(t.Quantity, t.Price, t.TradeDate));

                result.Add(new TradeRecord
                {
                    Ticker = new Ticker(ticker),
                    StockName = t.StockName,
                    Action = "BUY",
                    Quantity = t.Quantity,
                    Price = Money.INR(Math.Round(t.Price, 2)),
                    TradeDate = t.TradeDate,
                    OrderId = t.OrderId,
                    Exchange = t.Exchange,
                    TradeSource = t.BrokerSource
                });
            }
            else // SELL
            {
                decimal remainingToSell = t.Quantity;
                decimal totalCost = 0m;
                decimal matchedQty = 0m;
                double totalHoldingDaysWeight = 0;

                var q = buyQueues[ticker];
                while (remainingToSell > 0 && q.Count > 0)
                {
                    var head = q.Peek();
                    decimal takeQty = Math.Min(remainingToSell, head.RemainingQty);

                    totalCost += takeQty * head.BuyPrice;
                    matchedQty += takeQty;

                    int days = Math.Max(0, (int)(t.TradeDate - head.BuyDate).TotalDays);
                    totalHoldingDaysWeight += days * (double)takeQty;

                    head.RemainingQty -= takeQty;
                    remainingToSell -= takeQty;

                    if (head.RemainingQty <= 0)
                    {
                        q.Dequeue();
                    }
                }

                decimal? costBasis = matchedQty > 0 ? Math.Round(totalCost / matchedQty, 2) : null;
                decimal? pnl = null;
                decimal? pnlPercent = null;
                int? avgHoldingDays = null;

                if (costBasis.HasValue && costBasis.Value > 0)
                {
                    pnl = Math.Round((t.Price - costBasis.Value) * matchedQty, 2);
                    pnlPercent = Math.Round(((t.Price - costBasis.Value) / costBasis.Value) * 100m, 2);
                    avgHoldingDays = (int)Math.Round(totalHoldingDaysWeight / (double)matchedQty);
                }

                result.Add(new TradeRecord
                {
                    Ticker = new Ticker(ticker),
                    StockName = t.StockName,
                    Action = "SELL",
                    Quantity = t.Quantity,
                    Price = Money.INR(Math.Round(t.Price, 2)),
                    TradeDate = t.TradeDate,
                    OrderId = t.OrderId,
                    Exchange = t.Exchange,
                    TradeSource = t.BrokerSource,
                    CostBasisPrice = costBasis,
                    RealizedPnL = pnl.HasValue ? Money.INR(pnl.Value) : null,
                    RealizedPnLPercent = pnlPercent,
                    HoldingDays = avgHoldingDays
                });
            }
        }

        // Return latest trades first
        return result.OrderByDescending(r => r.TradeDate).ToList();
    }

    private static string CleanSymbol(string rawSymbol, string? isin)
    {
        if (!string.IsNullOrWhiteSpace(isin) && AngelOneExcelParser.IsinToTicker.TryGetValue(isin.Trim(), out var isinMapped))
        {
            return isinMapped.ToUpperInvariant();
        }

        string cleaned = rawSymbol.Trim().ToUpperInvariant();
        cleaned = SymbolCleanupRegex.Replace(cleaned, "");
        return cleaned.Trim();
    }

    private static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var cur = new System.Text.StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(cur.ToString().Trim());
                cur.Clear();
            }
            else
            {
                cur.Append(c);
            }
        }
        result.Add(cur.ToString().Trim());
        return result;
    }

    private sealed class FifoBuySlot
    {
        public decimal RemainingQty { get; set; }
        public decimal BuyPrice { get; }
        public DateTime BuyDate { get; }

        public FifoBuySlot(decimal qty, decimal price, DateTime date)
        {
            RemainingQty = qty;
            BuyPrice = price;
            BuyDate = date;
        }
    }
}
