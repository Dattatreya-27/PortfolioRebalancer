using System.IO.Compression;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using PortfolioRebalancer.Application.DTOs;

namespace PortfolioRebalancer.Application.Services;

/// <summary>
/// High-performance, zero-dependency Excel (.xlsx) parser for Angel One Demat portfolio exports.
/// Extracts exact stock positions, quantities, average buy prices, and LTP.
/// Maps ISINs and company names to pure NSE tickers.
/// </summary>
public static class AngelOneExcelParser
{
    public static readonly Dictionary<string, string> IsinToTicker = new(StringComparer.OrdinalIgnoreCase)
    {
        ["INE04I401011"] = "KPITTECH",
        ["INE0BS701011"] = "PREMIERENE",
        ["INE148I01020"] = "IBULHSGFIN",
        ["INE092A01019"] = "TATACHEM",
        ["INE455I01029"] = "KSCL",
        ["INE1TAE01010"] = "TMCV",
        ["INE1CDF01017"] = "VAML",
        ["INE528G01035"] = "YESBANK",
        ["INE111A01025"] = "CONCOR",
        ["INE879I01012"] = "VALOR",
        ["INE732I01021"] = "ANGELONE",
        ["INE301O01023"] = "NSDL",
        ["INE379A01028"] = "ITCHOTELS",
        ["INE009A01021"] = "INFY",
        ["INE490G01020"] = "MOIL",
        ["INE053F01010"] = "IRFC",
        ["INE058A01010"] = "SANOFI",
        ["INE213A01029"] = "ONGC",
        ["INE02RE01045"] = "FIRSTCRY",
        ["INE0DD101019"] = "RAILTEL",
        ["INE0FS801015"] = "MSUMI",
        ["INE05XR01022"] = "BHARATCOAL",
        ["INE852O01025"] = "APTUS",
        ["INE030A01027"] = "HINDUNILVR",
        ["INE628A01036"] = "UPL",
        ["INE066P01011"] = "INOXWIND",
        ["INE704J01044"] = "VOGL",
        ["INE256C01024"] = "TRIVENI",
        ["INE067A01029"] = "CGPOWER",
        ["INE925R01014"] = "CMSINFO",
        ["INE849A01020"] = "TRENT",
        ["INE302A01020"] = "EXIDEIND",
        ["INE752E01010"] = "POWERGRID",
        ["INE758E01017"] = "JIOFIN",
        ["INE134E01011"] = "PFC",
        ["INE686F01025"] = "UBL",
        ["INE040H01021"] = "SUZLON",
        ["INE085A01013"] = "CHAMBLFERT",
        ["INE386C01029"] = "ASTRAMICRO",
        ["INE663F01032"] = "NAUKRI",
        ["INE179A01014"] = "PGHH",
        ["INE002A01018"] = "RELIANCE",
        ["INE029A01011"] = "BPCL",
        ["INE414G01012"] = "MUTHOOTFIN",
        ["INE335Y01020"] = "IRCTC",
        ["INE614G01033"] = "RPOWER",
        ["INE176A01028"] = "BATAINDIA",
        ["INE918Z01012"] = "KAYNES",
        ["INE0YD401026"] = "JAINREC",
        ["INE908D01010"] = "SHAKTIPUMP",
        ["INE154A01025"] = "ITC",
        ["INE245A01021"] = "TATAPOWER",
        ["INE101A01026"] = "M&M",
        ["INE175A01038"] = "JISLJALEQS",
        ["INE118H01025"] = "BSE",
        ["INE467B01029"] = "TCS",
        ["INE050401020"] = "ELIN",
        ["INE079A01024"] = "AMBUJACEM",
        ["INE022Q01020"] = "IEX",
        ["INE020B01018"] = "RECLTD",
        ["INE205A01025"] = "VEDL",
        ["INE027A01015"] = "RCF",
        ["INE095N01031"] = "NBCC",
        ["INE249Z01020"] = "MAZDOCK",
        ["INE765G01017"] = "ICICIGI",
        ["INE956G01038"] = "WABAG",
        ["INE296A01032"] = "BAJFINANCE",
        ["INE0BYP01024"] = "OSWALPUMPS",
        ["INE201P01022"] = "GRINFRA",
        ["INE861A01058"] = "MPSL",
        ["INE776C01039"] = "GMRINFRA",
        ["INE04TZ01018"] = "ETHOSLTD",
        ["INE0LXT01019"] = "REDTAPE",
        ["INE202E01016"] = "IREDA",
        ["INE860A01027"] = "HCLTECH",
        ["INE016A01026"] = "DABUR",
        ["INE148O01028"] = "DELHIVERY",
        ["INE263A01024"] = "BEL",
        ["INE476A01022"] = "CANBK",
        ["INE814H01029"] = "ADANIPOWER",
        ["INE868B01028"] = "NCC",
        ["INE317I01021"] = "METROBRAND",
        ["INE040A01034"] = "HDFCBANK",
        ["INE155A01022"] = "TATAMOTORS",
        ["INE522F01014"] = "COALINDIA",
        ["INE531E01026"] = "HINDCOPPER",
        ["INE998I01010"] = "MHRIL",
        ["INE01EA01019"] = "VMM",
        ["INE221J01015"] = "SHARDACROP",
        ["INE171Z01026"] = "BDL",
        ["INE736A01011"] = "CDSL",
        ["INE937A01023"] = "SPMLINFRA",
        ["INE267A01025"] = "HINDZINC",
        ["INE844O01030"] = "GUJENERGY",
        ["INE00M201021"] = "SWSOLAR",
        ["INE181G01025"] = "AJRINFRA",
        ["INE01BK01022"] = "AWHCL",
        ["INE349Y01013"] = "IDEAFORGE",
        ["INE075A01022"] = "WIPRO",
        ["INE454P01035"] = "TRANSRAILL",
        ["INE481Y01014"] = "GICRE",
        ["INE962Y01021"] = "IRCON",
        ["INE102D01028"] = "GODREJCP",
        ["INE050A01025"] = "BBTC",
        ["INE926X01010"] = "HGINFRA",
        ["INE752P01024"] = "FRETAIL",
    };

    public static List<AngelOneHoldingItemRequest> ParseHoldings(Stream excelStream)
    {
        using var zip = new ZipArchive(excelStream, ZipArchiveMode.Read, leaveOpen: true);
        
        // 1. Read shared strings
        var sharedStrings = new List<string>();
        var sstEntry = zip.GetEntry("xl/sharedStrings.xml");
        if (sstEntry != null)
        {
            using var sstStream = sstEntry.Open();
            var xdoc = XDocument.Load(sstStream);
            XNamespace ns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
            foreach (var si in xdoc.Descendants(ns + "si"))
            {
                var text = string.Concat(si.Descendants(ns + "t").Select(t => t.Value));
                sharedStrings.Add(text);
            }
        }

        // 2. Locate Equity sheet (sheet2.xml or sheet1.xml)
        var sheetEntry = zip.GetEntry("xl/worksheets/sheet2.xml") 
                      ?? zip.GetEntry("xl/worksheets/sheet1.xml")
                      ?? zip.Entries.FirstOrDefault(e => e.FullName.StartsWith("xl/worksheets/sheet", StringComparison.OrdinalIgnoreCase));

        if (sheetEntry == null)
            throw new InvalidOperationException("Could not find worksheet inside the Excel archive.");

        using var sheetStream = sheetEntry.Open();
        var sheetDoc = XDocument.Load(sheetStream);
        XNamespace sns = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

        var rows = sheetDoc.Descendants(sns + "row").ToList();
        List<string>? headers = null;
        var results = new List<AngelOneHoldingItemRequest>();

        foreach (var row in rows)
        {
            var cells = row.Elements(sns + "c").ToList();
            var cellValues = new Dictionary<int, string>();

            foreach (var c in cells)
            {
                var rAttr = (string?)c.Attribute("r") ?? "";
                var colLetters = Regex.Match(rAttr, @"^[A-Z]+").Value;
                int colIdx = ColumnLettersToIndex(colLetters);

                var tAttr = (string?)c.Attribute("t");
                var vElem = c.Element(sns + "v");
                var rawVal = vElem?.Value ?? "";

                string val = rawVal;
                if (tAttr == "s" && int.TryParse(rawVal, out var sIdx) && sIdx >= 0 && sIdx < sharedStrings.Count)
                {
                    val = sharedStrings[sIdx];
                }
                cellValues[colIdx] = val;
            }

            int maxCol = cellValues.Keys.DefaultIfEmpty(-1).Max();
            if (maxCol < 0) continue;

            var rowList = new List<string>();
            for (int i = 0; i <= maxCol; i++)
            {
                rowList.Add(cellValues.TryGetValue(i, out var cv) ? cv.Trim() : "");
            }

            // Identify header row
            if (rowList.Contains("ISIN") && (rowList.Contains("Total Quantity") || rowList.Contains("Quantity")))
            {
                headers = rowList;
                continue;
            }

            if (headers != null)
            {
                int isinIdx = headers.IndexOf("ISIN");
                int nameIdx = headers.IndexOf("Company Name");
                int qtyIdx = headers.FindIndex(h => h.Contains("Total Quantity") || h.Equals("Quantity", StringComparison.OrdinalIgnoreCase));
                int avgIdx = headers.FindIndex(h => h.Contains("Avg Trading Price") || h.Contains("Average Price"));
                int ltpIdx = headers.IndexOf("LTP");

                if (isinIdx >= 0 && qtyIdx >= 0 && isinIdx < rowList.Count && qtyIdx < rowList.Count)
                {
                    string isin = rowList[isinIdx].Trim();
                    string company = (nameIdx >= 0 && nameIdx < rowList.Count) ? rowList[nameIdx].Trim() : "";

                    if (string.IsNullOrWhiteSpace(isin) || isin.Equals("Total", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (!decimal.TryParse(rowList[qtyIdx], out var qty) || qty <= 0)
                        continue;

                    decimal avgPrice = 0;
                    if (avgIdx >= 0 && avgIdx < rowList.Count)
                        decimal.TryParse(rowList[avgIdx], out avgPrice);

                    decimal ltp = 0;
                    if (ltpIdx >= 0 && ltpIdx < rowList.Count)
                        decimal.TryParse(rowList[ltpIdx], out ltp);

                    // Resolve ticker: 1st by ISIN, 2nd by Company Name / Symbol
                    string? ticker = null;
                    if (IsinToTicker.TryGetValue(isin, out var mappedTicker))
                    {
                        ticker = mappedTicker;
                    }
                    else if (!string.IsNullOrWhiteSpace(company))
                    {
                        ticker = company.ToUpperInvariant();
                    }

                    if (!string.IsNullOrWhiteSpace(ticker))
                    {
                        results.Add(new AngelOneHoldingItemRequest(
                            TradingSymbol: ticker,
                            Quantity: qty,
                            AveragePrice: avgPrice,
                            Ltp: ltp > 0 ? ltp : null
                        ));
                    }
                }
            }
        }

        return results;
    }

    private static int ColumnLettersToIndex(string column)
    {
        int index = 0;
        foreach (char c in column)
        {
            index = index * 26 + (c - 'A' + 1);
        }
        return index - 1;
    }
}
