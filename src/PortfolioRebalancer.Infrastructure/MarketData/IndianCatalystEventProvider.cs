using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Infrastructure.MarketData;

/// <summary>
/// Corporate actions and Indian macro policy calendar registry.
/// </summary>
public sealed class IndianCatalystEventProvider : ICatalystEventProvider
{
    private static readonly List<UpcomingEvent> MasterCalendar =
    [
        // Macro / National Policy Events
        new(null, "RBI Monetary Policy Committee (MPC) Rate Decision", "Monetary Policy",
            DateTime.UtcNow.AddDays(14), "High - Direct impact on Banks, Auto & Real Estate"),

        new(null, "National GST Council Meeting", "Regulatory Policy",
            DateTime.UtcNow.AddDays(28), "Medium - Consumption & Rate Rationalization"),

        // Earnings Results Dates for NSE Leaders
        new(new Ticker("RELIANCE"), "Q3 Financial Results & Board Meeting", "Quarterly Results",
            DateTime.UtcNow.AddDays(6), "High - Oil to Chemicals & Retail/Jio growth metrics"),

        new(new Ticker("TCS"), "Q3 Earnings Announcement & Interim Dividend", "Quarterly Results",
            DateTime.UtcNow.AddDays(8), "High - IT Sector demand commentary & deal wins"),

        new(new Ticker("INFY"), "Q3 Results & FY Guidance Revision", "Quarterly Results",
            DateTime.UtcNow.AddDays(10), "High - Guidance benchmark for Indian Tech"),

        new(new Ticker("HDFCBANK"), "Q3 Earnings & Loan-to-Deposit (LDR) Update", "Quarterly Results",
            DateTime.UtcNow.AddDays(12), "High - Margin & deposit trajectory check"),

        new(new Ticker("TATAMOTORS"), "Quarterly Earnings & JLR Free Cash Flow Update", "Quarterly Results",
            DateTime.UtcNow.AddDays(16), "High - EV ramp-up & domestic commercial vehicle cycle"),

        new(new Ticker("ITC"), "Q3 Financial Results & Hotel Demerger Update", "Quarterly Results",
            DateTime.UtcNow.AddDays(18), "Medium - Cigarette volume growth & FMCG margins"),

        new(new Ticker("LT"), "Q3 Order Inflow & Infrastructure Capex Update", "Quarterly Results",
            DateTime.UtcNow.AddDays(20), "High - Benchmark for Indian Infrastructure Capex")
    ];

    public Task<IReadOnlyList<UpcomingEvent>> GetUpcomingEventsAsync(IEnumerable<string> tickers)
    {
        var tickerSet = tickers
            .Select(t => t.Trim().ToUpperInvariant())
            .ToHashSet();

        // Include all macro events (Ticker == null) plus events matching portfolio tickers
        var events = MasterCalendar
            .Where(e => e.Ticker == null || tickerSet.Contains(e.Ticker.Value.Value))
            .OrderBy(e => e.ScheduledDate)
            .ToList();

        return Task.FromResult<IReadOnlyList<UpcomingEvent>>(events);
    }
}
