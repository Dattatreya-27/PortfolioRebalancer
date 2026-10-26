using System.Globalization;
using System.Text.RegularExpressions;
using ExcelDataReader;
using PortfolioRebalancer.Application.DTOs;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// Unified multi-broker holdings parser supporting Zerodha (Console & Kite CSV/Excel)
/// and Angel One (Demat Excel), with automatic format detection and symbol normalization.
/// </summary>
public static partial class BrokerHoldingsParser
{
    private static readonly Regex TickerCleanupRegex = MyTickerCleanupRegex();

    [GeneratedRegex(@"-(EQ|BE|SM|ST)$|\.NS$|\.BO$|^EQ:", RegexOptions.IgnoreCase)]
    private static partial Regex MyTickerCleanupRegex();

    public static BrokerParseResult Parse(Stream stream, string fileName, string? password = null)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        if (ext == ".csv" || ext == ".txt")
        {
            return ParseCsv(stream);
        }

        return ParseExcel(stream, password);
    }

    public static BrokerParseResult ParseCsv(Stream stream)
    {
        using var reader = new StreamReader(stream, System.Text.Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 4096, leaveOpen: true);
        var lines = new List<string>();
        string? line;
        while ((line = reader.ReadLine()) != null)
        {
            if (!string.IsNullOrWhiteSpace(line))
            {
                lines.Add(line.Trim());
            }
        }

        if (lines.Count == 0)
        {
            return new BrokerParseResult("Generic Broker", "CSV", []);
        }

        // Find header line
        int headerIdx = -1;
        int tickerCol = -1, isinCol = -1, qtyCol = -1, avgCol = -1, ltpCol = -1;
        string broker = "Generic Broker";

        for (int i = 0; i < Math.Min(lines.Count, 15); i++)
        {
            var cols = SplitCsvLine(lines[i]);
            for (int c = 0; c < cols.Count; c++)
            {
                var h = cols[c].Trim().ToLowerInvariant();
                if (h == "instrument" || h == "symbol" || h == "trading symbol" || h == "stock" || h == "security")
                {
                    tickerCol = c;
                    if (h == "instrument") broker = "Zerodha";
                }
                else if (h == "isin" || h == "isin code")
                {
                    isinCol = c;
                }
                else if (h == "qty." || h == "qty" || h == "quantity" || h == "holding qty" || h == "shares")
                {
                    qtyCol = c;
                }
                else if (h == "avg. cost" || h == "average price" || h == "avg price" || h == "buy price" || h == "cost price" || h == "avg. cost price")
                {
                    avgCol = c;
                    if (h == "avg. cost") broker = "Zerodha";
                }
                else if (h == "ltp" || h == "last price" || h == "cmp" || h == "closing price" || h == "previous closing price" || h == "close")
                {
                    ltpCol = c;
                }
            }

            if (tickerCol >= 0 && qtyCol >= 0)
            {
                headerIdx = i;
                break;
            }
        }

        if (headerIdx < 0)
        {
            return new BrokerParseResult(broker, "CSV", []);
        }

        var results = new List<BrokerParsedHoldingItem>();

        for (int i = headerIdx + 1; i < lines.Count; i++)
        {
            var cols = SplitCsvLine(lines[i]);
            if (cols.Count <= Math.Max(tickerCol, qtyCol)) continue;

            string rawTicker = cols[tickerCol].Trim();
            if (string.IsNullOrWhiteSpace(rawTicker) || rawTicker.StartsWith("Total", StringComparison.OrdinalIgnoreCase))
                continue;

            string? isin = isinCol >= 0 && isinCol < cols.Count ? cols[isinCol].Trim() : null;

            if (!TryParseDecimal(cols[qtyCol], out var qty) || qty <= 0)
                continue;

            decimal avgPrice = 0m;
            if (avgCol >= 0 && avgCol < cols.Count)
            {
                TryParseDecimal(cols[avgCol], out avgPrice);
            }

            decimal? ltp = null;
            if (ltpCol >= 0 && ltpCol < cols.Count && TryParseDecimal(cols[ltpCol], out var parsedLtp) && parsedLtp > 0)
            {
                ltp = parsedLtp;
            }

            string cleanTicker = CleanSymbol(rawTicker, isin);
            if (!string.IsNullOrWhiteSpace(cleanTicker))
            {
                results.Add(new BrokerParsedHoldingItem(
                    Ticker: cleanTicker,
                    Quantity: Math.Round(qty, 0, MidpointRounding.AwayFromZero),
                    AveragePrice: Math.Round(avgPrice, 2),
                    Ltp: ltp.HasValue ? Math.Round(ltp.Value, 2) : null,
                    Isin: isin,
                    RawSymbol: rawTicker
                ));
            }
        }

        return new BrokerParseResult(broker, "CSV", results);
    }

    public static BrokerParseResult ParseExcel(Stream stream, string? password = null)
    {
        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

        var ms = new MemoryStream();
        stream.CopyTo(ms);
        ms.Position = 0;

        // Try ExcelDataReader
        try
        {
            var readerConfig = new ExcelReaderConfiguration
            {
                Password = string.IsNullOrWhiteSpace(password) ? null : password.Trim()
            };

            using var reader = ExcelReaderFactory.CreateReader(ms, readerConfig);
            var results = new List<BrokerParsedHoldingItem>();
            string broker = "Generic Broker";

            while (reader.Read())
            {
                // Find header row in sheet
                int fieldCount = reader.FieldCount;
                int tickerCol = -1, isinCol = -1, qtyCol = -1, avgCol = -1, ltpCol = -1;

                for (int c = 0; c < fieldCount; c++)
                {
                    var h = reader.GetValue(c)?.ToString()?.Trim().ToLowerInvariant() ?? "";
                    if (h == "instrument" || h == "symbol" || h == "trading symbol" || h == "company name" || h == "stock")
                    {
                        tickerCol = c;
                        if (h == "instrument") broker = "Zerodha";
                        if (h == "company name") broker = "Angel One";
                    }
                    else if (h == "isin" || h == "isin code")
                    {
                        isinCol = c;
                    }
                    else if (h == "qty." || h == "qty" || h == "quantity" || h == "holding qty" || h == "shares")
                    {
                        qtyCol = c;
                        if (h == "holding qty") broker = "Angel One";
                    }
                    else if (h == "avg. cost" || h == "average price" || h == "avg price" || h == "buy price")
                    {
                        avgCol = c;
                        if (h == "avg. cost") broker = "Zerodha";
                    }
                    else if (h == "ltp" || h == "last price" || h == "cmp" || h == "cur. val" || h == "previous closing price")
                    {
                        ltpCol = c;
                    }
                }

                if (tickerCol >= 0 && qtyCol >= 0)
                {
                    // Found headers, read remaining rows in this sheet
                    while (reader.Read())
                    {
                        var rawTicker = reader.GetValue(tickerCol)?.ToString()?.Trim() ?? "";
                        if (string.IsNullOrWhiteSpace(rawTicker) || rawTicker.StartsWith("Total", StringComparison.OrdinalIgnoreCase))
                            continue;

                        string? isin = isinCol >= 0 ? reader.GetValue(isinCol)?.ToString()?.Trim() : null;

                        var qtyStr = reader.GetValue(qtyCol)?.ToString() ?? "";
                        if (!TryParseDecimal(qtyStr, out var qty) || qty <= 0)
                            continue;

                        decimal avgPrice = 0m;
                        if (avgCol >= 0)
                        {
                            var avgStr = reader.GetValue(avgCol)?.ToString() ?? "";
                            TryParseDecimal(avgStr, out avgPrice);
                        }

                        decimal? ltp = null;
                        if (ltpCol >= 0)
                        {
                            var ltpStr = reader.GetValue(ltpCol)?.ToString() ?? "";
                            if (TryParseDecimal(ltpStr, out var parsedLtp) && parsedLtp > 0)
                            {
                                ltp = parsedLtp;
                            }
                        }

                        string cleanTicker = CleanSymbol(rawTicker, isin);
                        if (!string.IsNullOrWhiteSpace(cleanTicker))
                        {
                            results.Add(new BrokerParsedHoldingItem(
                                Ticker: cleanTicker,
                                Quantity: Math.Round(qty, 0, MidpointRounding.AwayFromZero),
                                AveragePrice: Math.Round(avgPrice, 2),
                                Ltp: ltp.HasValue ? Math.Round(ltp.Value, 2) : null,
                                Isin: isin,
                                RawSymbol: rawTicker
                            ));
                        }
                    }
                    break;
                }
            }

            if (results.Count > 0)
            {
                return new BrokerParseResult(broker, "Excel", results);
            }
        }
        catch (Exception)
        {
            // If ExcelDataReader hit an issue or proprietary encryption, fallback to AngelOneExcelParser
        }

        // Fallback: AngelOneExcelParser
        ms.Position = 0;
        var angelHoldings = AngelOneExcelParser.ParseHoldings(ms, password);
        var mapped = angelHoldings.Select(h => new BrokerParsedHoldingItem(
            Ticker: CleanSymbol(h.TradingSymbol, null),
            Quantity: h.Quantity,
            AveragePrice: h.AveragePrice,
            Ltp: h.Ltp,
            RawSymbol: h.TradingSymbol
        )).ToList();

        return new BrokerParseResult("Angel One", "Excel", mapped);
    }

    public static string CleanSymbol(string rawSymbol, string? isin)
    {
        // 1. ISIN is the sovereign authoritative identifier if mapped
        if (!string.IsNullOrWhiteSpace(isin) && AngelOneExcelParser.IsinToTicker.TryGetValue(isin.Trim(), out var isinMapped))
        {
            return isinMapped.ToUpperInvariant();
        }

        string cleaned = rawSymbol.Trim().ToUpperInvariant();
        cleaned = TickerCleanupRegex.Replace(cleaned, "").Trim();

        // 2. Direct company name mapping fallbacks
        if (AngelOneExcelParser.IsinToTicker.TryGetValue(cleaned, out var directMapped))
        {
            return directMapped.ToUpperInvariant();
        }

        return cleaned;
    }

    private static bool TryParseDecimal(string? text, out decimal value)
    {
        value = 0m;
        if (string.IsNullOrWhiteSpace(text)) return false;

        string sanitized = text.Replace("₹", "").Replace(",", "").Replace(" ", "").Trim();
        return decimal.TryParse(sanitized, NumberStyles.Any, CultureInfo.InvariantCulture, out value);
    }

    private static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        bool inQuotes = false;
        var current = new System.Text.StringBuilder();

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString());
        return result;
    }
}
