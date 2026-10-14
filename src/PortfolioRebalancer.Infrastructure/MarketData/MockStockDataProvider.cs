using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Infrastructure.MarketData;

/// <summary>
/// Stock data provider with seed data for leading Indian companies across NSE/BSE sectors.
/// Includes all 105 active holdings from the user's custom portfolio.
/// All prices and valuations in Indian Rupees (INR - â‚¹).
/// </summary>
public sealed class MockStockDataProvider : IStockDataProvider
{
    private record IndianStockSeed(string Name, Sector Sector, decimal PriceInr, decimal? PE, decimal? DivYield, decimal? MarketCapCrores);

    private static readonly Dictionary<string, IndianStockSeed> SeedData = new(StringComparer.OrdinalIgnoreCase)
    {
        ["GUJENERGY"] = new("Gujarat Energy", Sector.Utilities, 224.96m, 22.4m, 1.8m, 180000m),
        ["GUJGASLTD"] = new("Gujarat Energy", Sector.Utilities, 224.96m, 22.4m, 1.8m, 180000m),
        ["KPITTECH"] = new("KPIT Technologi.", Sector.Technology, 594.69m, 28.5m, 1.8m, 320000m),
        ["PREMIERENE"] = new("PREMIERENE", Sector.Utilities, 1001.8m, 18.2m, 2.5m, 190000m),
        ["IBULHSGFIN"] = new("Indiabulls Hous.", Sector.Financials, 132.73m, 16.8m, 1.1m, 450000m),
        ["TATACHEM"] = new("Tata Chemicals", Sector.Materials, 687.83m, 24.5m, 1.2m, 150000m),
        ["KSCL"] = new("Kaveri Seed Co.", Sector.ConsumerStaples, 782.17m, 45.2m, 2.1m, 280000m),
        ["TMCV"] = new("TMCV", Sector.ConsumerDiscretionary, 429.75m, 24.5m, 1.2m, 150000m),
        ["VAML"] = new("VAML", Sector.Materials, 407.61m, 24.5m, 1.2m, 150000m),
        ["YESBANK"] = new("Yes Bank", Sector.Financials, 20.75m, 16.8m, 1.1m, 450000m),
        ["CONCOR"] = new("Container Corpn.", Sector.Industrials, 526.82m, 32.0m, 0.8m, 210000m),
        ["VALOR"] = new("D B Realty", Sector.RealEstate, 115.3m, 24.5m, 1.2m, 150000m),
        ["ANGELONE"] = new("ANGELONE", Sector.Financials, 292.43m, 16.8m, 1.1m, 450000m),
        ["NSDL"] = new("NSDL", Sector.Financials, 821.87m, 16.8m, 1.1m, 450000m),
        ["ITCHOTELS"] = new("ITCHOTELS", Sector.ConsumerDiscretionary, 187.27m, 24.5m, 1.2m, 150000m),
        ["INFY"] = new("Infosys", Sector.Technology, 1121.57m, 28.5m, 1.8m, 320000m),
        ["MOIL"] = new("MOIL", Sector.Materials, 272.26m, 24.5m, 1.2m, 150000m),
        ["IRFC"] = new("I R F C", Sector.Financials, 95.55m, 16.8m, 1.1m, 450000m),
        ["SANOFI"] = new("Sanofi India", Sector.Healthcare, 3395.22m, 24.5m, 1.2m, 150000m),
        ["ONGC"] = new("O N G C", Sector.Energy, 241.9m, 14.5m, 3.2m, 580000m),
        ["FIRSTCRY"] = new("FIRSTCRY", Sector.ConsumerDiscretionary, 198.54m, 24.5m, 1.2m, 150000m),
        ["RAILTEL"] = new("Railtel Corpn.", Sector.CommunicationServices, 306.77m, 24.5m, 1.2m, 150000m),
        ["MSUMI"] = new("Motherson Wiring", Sector.ConsumerDiscretionary, 38.87m, 24.5m, 1.2m, 150000m),
        ["BHARATCOAL"] = new("BHARATCOAL", Sector.Energy, 32.72m, 14.5m, 3.2m, 580000m),
        ["APTUS"] = new("Aptus Value Hou.", Sector.Financials, 270.16m, 16.8m, 1.1m, 450000m),
        ["HINDUNILVR"] = new("Hind. Unilever", Sector.ConsumerStaples, 2183.1m, 45.2m, 2.1m, 280000m),
        ["UPL"] = new("UPL", Sector.Materials, 587.65m, 24.5m, 1.2m, 150000m),
        ["INOXWIND"] = new("Inox Wind", Sector.Utilities, 83.39m, 18.2m, 2.5m, 190000m),
        ["VOGL"] = new("VOGL", Sector.Energy, 33.63m, 14.5m, 3.2m, 580000m),
        ["TRIVENI"] = new("Triven.Engg.Ind.", Sector.ConsumerStaples, 279.45m, 45.2m, 2.1m, 280000m),
        ["CGPOWER"] = new("CG Power & Indu.", Sector.Industrials, 903.35m, 32.0m, 0.8m, 210000m),
        ["CMSINFO"] = new("CMS Info Systems", Sector.Technology, 258.74m, 28.5m, 1.8m, 320000m),
        ["TRENT"] = new("Trent", Sector.ConsumerDiscretionary, 3173.61m, 24.5m, 1.2m, 150000m),
        ["EXIDEIND"] = new("Exide Inds.", Sector.ConsumerDiscretionary, 422.26m, 24.5m, 1.2m, 150000m),
        ["POWERGRID"] = new("Power Grid Corpn", Sector.Utilities, 295.59m, 18.2m, 2.5m, 190000m),
        ["JIOFIN"] = new("Jio Financial", Sector.Financials, 286.87m, 16.8m, 1.1m, 450000m),
        ["PFC"] = new("Power Fin.Corpn.", Sector.Financials, 326.42m, 16.8m, 1.1m, 450000m),
        ["UBL"] = new("United Breweries", Sector.ConsumerStaples, 1438.3m, 45.2m, 2.1m, 280000m),
        ["SUZLON"] = new("Suzlon Energy", Sector.Utilities, 52.11m, 18.2m, 2.5m, 190000m),
        ["CHAMBLFERT"] = new("Chambal Fert.", Sector.Materials, 452.94m, 24.5m, 1.2m, 150000m),
        ["ASTRAMICRO"] = new("Astra Microwave", Sector.Industrials, 951.5m, 32.0m, 0.8m, 210000m),
        ["NAUKRI"] = new("NAUKRI", Sector.Technology, 1224.59m, 28.5m, 1.8m, 320000m),
        ["MPSL"] = new("MPS Infotecnics", Sector.Technology, 0.35m, 15.0m, 0.0m, 1260m),
        ["PGHH"] = new("P & G Hygiene", Sector.ConsumerStaples, 7924.22m, 45.2m, 2.1m, 280000m),
        ["RELIANCE"] = new("Reliance Industr", Sector.Energy, 1282.26m, 14.5m, 3.2m, 580000m),
        ["BPCL"] = new("B P C L", Sector.Energy, 305.35m, 14.5m, 3.2m, 580000m),
        ["MUTHOOTFIN"] = new("Muthoot Finance", Sector.Financials, 2708.24m, 16.8m, 1.1m, 450000m),
        ["IRCTC"] = new("I R C T C", Sector.ConsumerDiscretionary, 639.8m, 24.5m, 1.2m, 150000m),
        ["RPOWER"] = new("Reliance Power", Sector.Utilities, 21.98m, 18.2m, 2.5m, 190000m),
        ["BATAINDIA"] = new("Bata India", Sector.ConsumerDiscretionary, 713.74m, 24.5m, 1.2m, 150000m),
        ["KAYNES"] = new("Kaynes Tech", Sector.Industrials, 3626.3m, 32.0m, 0.8m, 210000m),
        ["JAINREC"] = new("JAINREC", Sector.Materials, 320.76m, 24.5m, 1.2m, 150000m),
        ["SHAKTIPUMP"] = new("Shakti Pumps", Sector.Industrials, 496.72m, 32.0m, 0.8m, 210000m),
        ["ITC"] = new("ITC", Sector.ConsumerStaples, 297.99m, 45.2m, 2.1m, 280000m),
        ["TATAPOWER"] = new("Tata Power Co.", Sector.Utilities, 335.13m, 18.2m, 2.5m, 190000m),
        ["M&M"] = new("M & M", Sector.ConsumerDiscretionary, 3064.28m, 24.5m, 1.2m, 150000m),
        ["JISLJALEQS"] = new("Jain Irrigation", Sector.Industrials, 29.62m, 32.0m, 0.8m, 210000m),
        ["BSE"] = new("BSE", Sector.Financials, 3195.61m, 16.8m, 1.1m, 450000m),
        ["TCS"] = new("TCS", Sector.Technology, 2247.12m, 28.5m, 1.8m, 320000m),
        ["ELIN"] = new("Elin Electronics", Sector.Industrials, 120.9m, 32.0m, 0.8m, 210000m),
        ["AMBUJACEM"] = new("Ambuja Cements", Sector.Materials, 436.62m, 24.5m, 1.2m, 150000m),
        ["IEX"] = new("Indian Energy Ex", Sector.Financials, 131.38m, 16.8m, 1.1m, 450000m),
        ["RECLTD"] = new("REC Ltd", Sector.Financials, 353.23m, 16.8m, 1.1m, 450000m),
        ["VEDL"] = new("Vedanta", Sector.Materials, 277.19m, 24.5m, 1.2m, 150000m),
        ["RCF"] = new("R C F", Sector.Materials, 119.27m, 24.5m, 1.2m, 150000m),
        ["NBCC"] = new("NBCC", Sector.RealEstate, 80.84m, 24.5m, 1.2m, 150000m),
        ["MAZDOCK"] = new("MAZDOCK", Sector.Industrials, 2566m, 32.0m, 0.8m, 210000m),
        ["ICICIGI"] = new("ICICI Lombard", Sector.Financials, 1851.63m, 16.8m, 1.1m, 450000m),
        ["WABAG"] = new("Va Tech Wabag", Sector.Industrials, 1483.03m, 32.0m, 0.8m, 210000m),
        ["BAJFINANCE"] = new("BAJFINANCE", Sector.Financials, 925.72m, 16.8m, 1.1m, 450000m),
        ["OSWALPUMPS"] = new("OSWALPUMPS", Sector.Industrials, 337.71m, 32.0m, 0.8m, 210000m),
        ["GRINFRA"] = new("G R Infraproject", Sector.Industrials, 913.73m, 32.0m, 0.8m, 210000m),
        ["MPSL"] = new("Visesh Infotec.", Sector.Technology, 1.23m, 28.5m, 1.8m, 320000m),
        ["GMRINFRA"] = new("GMR Airports Inf", Sector.Industrials, 97.75m, 32.0m, 0.8m, 210000m),
        ["ETHOSLTD"] = new("Ethos Ltd", Sector.ConsumerDiscretionary, 2628.91m, 24.5m, 1.2m, 150000m),
        ["REDTAPE"] = new("Redtape", Sector.ConsumerDiscretionary, 132.2m, 24.5m, 1.2m, 150000m),
        ["IREDA"] = new("IREDA", Sector.Financials, 146.4m, 16.8m, 1.1m, 450000m),
        ["HCLTECH"] = new("HCL Technologies", Sector.Technology, 1284.23m, 28.5m, 1.8m, 320000m),
        ["DABUR"] = new("Dabur India", Sector.ConsumerStaples, 426.98m, 45.2m, 2.1m, 280000m),
        ["DELHIVERY"] = new("Delhivery", Sector.Industrials, 455.01m, 32.0m, 0.8m, 210000m),
        ["BEL"] = new("Bharat Electron", Sector.Industrials, 335.52m, 32.0m, 0.8m, 210000m),
        ["CANBK"] = new("CANBK", Sector.Financials, 135.62m, 16.8m, 1.1m, 450000m),
        ["ADANIPOWER"] = new("ADANIPOWER", Sector.Utilities, 175.51m, 18.2m, 2.5m, 190000m),
        ["NCC"] = new("NCC", Sector.Industrials, 153.39m, 32.0m, 0.8m, 210000m),
        ["METROBRAND"] = new("Metro Brands", Sector.ConsumerDiscretionary, 991.55m, 24.5m, 1.2m, 150000m),
        ["HDFCBANK"] = new("HDFC Bank", Sector.Financials, 692.38m, 16.8m, 1.1m, 450000m),
        ["TATAMOTORS"] = new("TMPV", Sector.ConsumerDiscretionary, 371.22m, 24.5m, 1.2m, 150000m),
        ["COALINDIA"] = new("Coal India", Sector.Energy, 455.21m, 14.5m, 3.2m, 580000m),
        ["HINDCOPPER"] = new("Hindustan Copper", Sector.Materials, 509.8m, 24.5m, 1.2m, 150000m),
        ["MHRIL"] = new("Mahindra Holiday", Sector.ConsumerDiscretionary, 226.83m, 24.5m, 1.2m, 150000m),
        ["VMM"] = new("VMM", Sector.ConsumerDiscretionary, 111.07m, 24.5m, 1.2m, 150000m),
        ["SHARDACROP"] = new("Sharda Cropchem", Sector.Materials, 903.72m, 24.5m, 1.2m, 150000m),
        ["BDL"] = new("BDL", Sector.Industrials, 1308.96m, 32.0m, 0.8m, 210000m),
        ["CDSL"] = new("C D S L", Sector.Financials, 1338.16m, 16.8m, 1.1m, 450000m),
        ["SPMLINFRA"] = new("SPML Infra", Sector.Industrials, 197.23m, 32.0m, 0.8m, 210000m),
        ["HINDZINC"] = new("Hindustan Zinc", Sector.Materials, 570.58m, 24.5m, 1.2m, 150000m),
        ["GUJGASLTD"] = new("Gujarat Gas", Sector.Utilities, 264.85m, 18.2m, 2.5m, 190000m),
        ["SWSOLAR"] = new("Sterling & Wils.", Sector.Utilities, 199.12m, 18.2m, 2.5m, 190000m),
        ["AJRINFRA"] = new("AJR Infra &", Sector.Industrials, 2.54m, 32.0m, 0.8m, 210000m),
        ["AWHCL"] = new("Antony Waste han", Sector.Industrials, 420.72m, 32.0m, 0.8m, 210000m),
        ["IDEAFORGE"] = new("Ideaforge Tech", Sector.Industrials, 713.84m, 32.0m, 0.8m, 210000m),
        ["WIPRO"] = new("Wipro", Sector.Technology, 192.22m, 28.5m, 1.8m, 320000m),
        ["TRANSRAILL"] = new("TRANSRAILL", Sector.Industrials, 484.6m, 32.0m, 0.8m, 210000m),
        ["GICRE"] = new("General Insuranc", Sector.Financials, 361.72m, 16.8m, 1.1m, 450000m),
        ["IRCON"] = new("Ircon Intl.", Sector.Industrials, 146.1m, 32.0m, 0.8m, 210000m),
        ["GODREJCP"] = new("Godrej Consumer", Sector.ConsumerStaples, 926.47m, 45.2m, 2.1m, 280000m),
        ["BBTC"] = new("Bombay Burmah", Sector.ConsumerStaples, 1564.03m, 45.2m, 2.1m, 280000m),
        ["HGINFRA"] = new("H.G. Infra Engg.", Sector.Industrials, 512.65m, 32.0m, 0.8m, 210000m),

    };

    public Task<Stock?> GetStockAsync(string ticker)
    {
        var cleanTicker = NormalizeTicker(ticker);

        if (!SeedData.TryGetValue(cleanTicker, out var seed))
            return Task.FromResult<Stock?>(null);

        return Task.FromResult<Stock?>(CreateStock(cleanTicker, seed));
    }

    public Task<IReadOnlyList<Stock>> GetStocksAsync(IEnumerable<string> tickers)
    {
        var stocks = tickers
            .Select(NormalizeTicker)
            .Where(SeedData.ContainsKey)
            .Select(t => CreateStock(t, SeedData[t]))
            .ToList();

        return Task.FromResult<IReadOnlyList<Stock>>(stocks);
    }

    private static string NormalizeTicker(string ticker)
    {
        var clean = ticker.Trim().ToUpperInvariant();
        if (clean.EndsWith(".NS", StringComparison.OrdinalIgnoreCase))
            clean = clean[..^3];
        else if (clean.EndsWith(".BO", StringComparison.OrdinalIgnoreCase))
            clean = clean[..^3];
        return clean;
    }

    private static Stock CreateStock(string ticker, IndianStockSeed seed)
    {
        var stock = new Stock
        {
            Ticker = new Ticker(ticker),
            Name = seed.Name,
            Sector = seed.Sector
        };
        stock.UpdateMarketData(
            Money.INR(seed.PriceInr),
            peRatio: seed.PE,
            dividendYield: seed.DivYield,
            marketCap: seed.MarketCapCrores * 10_000_000m);
        return stock;
    }
}
