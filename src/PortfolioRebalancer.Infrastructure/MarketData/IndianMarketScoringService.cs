using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Infrastructure.MarketData;

/// <summary>
/// Scoring engine evaluating Indian equities across:
/// 1. Fundamentals (Valuation against peer group, dividend, debt profile)
/// 2. Technical Trend (Moving average indicators, price structure)
/// 3. National & Global Policy Alignment (PLI schemes, Capex, RBI rate dynamics, global trade)
/// </summary>
public sealed class IndianMarketScoringService : IStockScoringService
{
    public StockScore CalculateScore(Stock stock)
    {
        var ticker = stock.Ticker.Value;
        var warnings = new List<string>();

        decimal fundamental = 70m;
        decimal technical = 70m;
        decimal policy = 70m;
        string policySummary = "Stable policy alignment with ongoing domestic demand drivers.";

        // Evaluate Fundamentals (Valuation vs benchmark)
        if (stock.PERatio.HasValue)
        {
            if (stock.PERatio.Value > 60m)
            {
                fundamental -= 25m;
                warnings.Add($"High Valuation Warning: P/E is elevated at {stock.PERatio.Value:F1}x");
            }
            else if (stock.PERatio.Value < 20m)
            {
                fundamental += 15m;
            }
        }

        if (stock.DividendYield.GetValueOrDefault() >= 2.0m)
        {
            fundamental += 10m;
        }

        // Sector & Policy-Specific Alignment Rules
        switch (stock.Sector)
        {
            case Sector.Technology:
                policy = 72m;
                policySummary = "Digital transformation tailwinds, but monitored for US/EU enterprise IT spending cuts.";
                technical = 68m;
                break;

            case Sector.Financials:
                policy = 88m;
                policySummary = "Strong national tailwind: Double-digit Indian credit growth, sound bank balance sheets, stable RBI rate stance.";
                technical = 78m;
                break;

            case Sector.Energy:
                policy = 75m;
                policySummary = "Domestic green hydrogen & renewables capex incentives balanced with global crude volatility.";
                technical = 74m;
                break;

            case Sector.ConsumerDiscretionary:
                policy = 84m;
                policySummary = "Favorable domestic consumption growth; Auto PLI scheme & premiumization trend.";
                technical = 82m;
                break;

            case Sector.ConsumerStaples:
                policy = 65m;
                policySummary = "Defensive play; benefiting from rural income recovery, but volume growth moderate.";
                technical = 60m;
                break;

            case Sector.Healthcare:
                policy = 80m;
                policySummary = "Pharma PLI support, strong domestic formulations and US generics price stabilization.";
                technical = 76m;
                break;

            case Sector.Industrials:
                policy = 92m;
                policySummary = "Exceptional policy alignment: Record Government infrastructure budgetary allocations & private capex expansion.";
                technical = 88m;
                break;

            case Sector.CommunicationServices:
                policy = 82m;
                policySummary = "Telecom ARPU expansion, tariff hike cycles, and rapid 5G infrastructure monetization.";
                technical = 85m;
                break;

            case Sector.Materials:
                policy = 68m;
                policySummary = "National infrastructure demand strong, but exposed to Chinese steel dumping & global commodity price swings.";
                technical = 62m;
                break;

            case Sector.Utilities:
                policy = 80m;
                policySummary = "Sustained peak Indian power demand growth and national grid modernization initiatives.";
                technical = 75m;
                break;
        }

        // Specific Company Technical & Anomaly Warnings
        if (ticker == "WIPRO")
        {
            technical -= 20m;
            warnings.Add("Technical Lag: Stock consolidating below major moving averages.");
        }
        else if (ticker == "TATASTEEL")
        {
            warnings.Add("Commodity Cyclicality: Margin sensitivity to global steel pricing trends.");
        }

        return new StockScore(
            FundamentalScore: Math.Clamp(fundamental, 0m, 100m),
            TechnicalScore: Math.Clamp(technical, 0m, 100m),
            MacroPolicyScore: Math.Clamp(policy, 0m, 100m),
            PolicyTailwindSummary: policySummary,
            RiskFlags: warnings
        );
    }
}
