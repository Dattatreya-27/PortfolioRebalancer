using FluentAssertions;
using PortfolioRebalancer.Application.Services;
using PortfolioRebalancer.Infrastructure.MarketData;

namespace PortfolioRebalancer.Application.Tests.Services;

public class TheoryPortfolioServiceTests : IDisposable
{
    private readonly string _tempFilePath;
    private readonly MockStockDataProvider _stockProvider;
    private readonly TheoryPortfolioService _service;

    public TheoryPortfolioServiceTests()
    {
        _tempFilePath = Path.Combine(Path.GetTempPath(), $"test_theory_portfolios_{Guid.NewGuid():N}.json");
        _stockProvider = new MockStockDataProvider();
        _service = new TheoryPortfolioService(_stockProvider, _tempFilePath);
    }

    public void Dispose()
    {
        if (File.Exists(_tempFilePath))
        {
            try { File.Delete(_tempFilePath); } catch { }
        }
    }

    [Fact]
    public async Task GetIncubatorDashboardAsync_ReturnsAllThreeMarketTheoriesWithRigorousCitations()
    {
        // Act
        var dashboard = await _service.GetIncubatorDashboardAsync();

        // Assert
        dashboard.Should().NotBeNull();
        dashboard.Portfolios.Should().HaveCount(3);
        dashboard.BenchmarkNifty50ReturnPercent.Should().BeGreaterThan(0);
        dashboard.ExecutiveSummary.Should().Contain("Coffee Can");
        dashboard.ExecutiveSummary.Should().Contain("Motilal Oswal QGLP");
        dashboard.ExecutiveSummary.Should().Contain("Policy Momentum");

        var p1 = dashboard.Portfolios.FirstOrDefault(p => p.StrategyId == "GRAHAM_PIOTROSKI_VALUE");
        p1.Should().NotBeNull();
        p1!.Literature.PrimaryBook.Should().Contain("Coffee Can");
        p1.Literature.AuthorOrEconomist.Should().Contain("Saurabh Mukherjea");
        p1.Literature.JournalOrUniversity.Should().Contain("Marcellus");
        p1.Literature.KeyAcademicPaper.Should().Contain("Coffee Can");
        p1.InitialCapital.Should().Be(1000000m);
        p1.Constituents.Should().HaveCount(5);

        var p2 = dashboard.Portfolios.FirstOrDefault(p => p.StrategyId == "MAGIC_FORMULA");
        p2.Should().NotBeNull();
        p2!.Literature.PrimaryBook.Should().Contain("Wealth Creation");
        p2.Literature.AuthorOrEconomist.Should().Contain("Raamdeo Agrawal");
        p2.InitialCapital.Should().Be(1000000m);
        p2.Constituents.Should().HaveCount(5);

        var p3 = dashboard.Portfolios.FirstOrDefault(p => p.StrategyId == "SEPA_MOMENTUM");
        p3.Should().NotBeNull();
        p3!.Literature.PrimaryBook.Should().Contain("William O'Neil");
        p3.Literature.AuthorOrEconomist.Should().Contain("William J. O'Neil");
        p3.Literature.JournalOrUniversity.Should().Contain("William O'Neil India");
        p3.InitialCapital.Should().Be(1000000m);
        p3.Constituents.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetIncubatorDashboardAsync_CalculatesReturnsAndWeightsAccurately()
    {
        // Act
        var dashboard = await _service.GetIncubatorDashboardAsync();

        // Assert
        foreach (var portfolio in dashboard.Portfolios)
        {
            portfolio.CurrentValue.Should().BeGreaterThan(0);
            decimal sumConstituentValues = portfolio.Constituents.Sum(c => c.CurrentValue);
            portfolio.CurrentValue.Should().BeApproximately(sumConstituentValues, 0.05m);

            decimal expectedReturnAmt = portfolio.CurrentValue - portfolio.InitialCapital;
            portfolio.TotalReturnAmount.Should().BeApproximately(expectedReturnAmt, 0.05m);

            decimal expectedReturnPct = Math.Round((expectedReturnAmt / portfolio.InitialCapital) * 100m, 2);
            portfolio.TotalReturnPercent.Should().BeApproximately(expectedReturnPct, 0.05m);

            decimal expectedAlpha = Math.Round(portfolio.TotalReturnPercent - dashboard.BenchmarkNifty50ReturnPercent, 2);
            portfolio.AlphaPercent.Should().BeApproximately(expectedAlpha, 0.05m);

            decimal totalWeight = portfolio.Constituents.Sum(c => c.WeightPercent);
            totalWeight.Should().BeInRange(99.0m, 101.0m);
        }
    }

    [Fact]
    public async Task AddJournalNoteAsync_AppendsAndPersistsNote()
    {
        // Arrange
        const string note = "Observed strong volume breakout on defence orders. Validating entry trigger.";

        // Act
        var result = await _service.AddJournalNoteAsync("SEPA_MOMENTUM", note);
        var strategy = await _service.GetTheoryPortfolioAsync("SEPA_MOMENTUM");

        // Assert
        result.Should().BeTrue();
        strategy.Should().NotBeNull();
        strategy!.ResearchJournalNotes.Should().Contain(n => n.Contains(note));
    }
}
