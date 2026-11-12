using PortfolioRebalancer.Application.DTOs;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Services;

public class PolicyImpactService
{
    private readonly IPolicyIntelligenceProvider _policyProvider;
    private readonly IPortfolioRepository _portfolioRepository;
    private readonly IStockDataProvider _stockDataProvider;

    public PolicyImpactService(
        IPolicyIntelligenceProvider policyProvider,
        IPortfolioRepository portfolioRepository,
        IStockDataProvider stockDataProvider)
    {
        _policyProvider = policyProvider;
        _portfolioRepository = portfolioRepository;
        _stockDataProvider = stockDataProvider;
    }

    public async Task<PortfolioPolicyImpactMapDto> GetPolicyImpactMapAsync(Guid? portfolioId = null, CancellationToken ct = default)
    {
        var policies = await _policyProvider.GetActivePolicyShiftsAsync(ct);
        var holdingImpacts = new List<PolicyHoldingImpactDto>();

        if (portfolioId.HasValue)
        {
            var portfolio = await _portfolioRepository.GetByIdAsync(portfolioId.Value);
            if (portfolio is not null && portfolio.Holdings.Count > 0)
            {
                var tickers = portfolio.Holdings.Select(h => h.Stock.Ticker.Value).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var stockList = await _stockDataProvider.GetStocksAsync(tickers);
                var stocks = stockList.ToDictionary(s => s.Ticker.Value, StringComparer.OrdinalIgnoreCase);

                foreach (var h in portfolio.Holdings)
                {
                    var t = h.Stock.Ticker.Value;
                    stocks.TryGetValue(t, out var stock);
                    var name = stock?.Name ?? h.Stock.Name;
                    var sector = stock?.Sector.ToString() ?? h.Stock.Sector.ToString();

                    foreach (var pol in policies)
                    {
                        var impact = MatchPolicyToHolding(pol, t, name, sector);
                        if (impact is not null)
                            holdingImpacts.Add(impact);
                    }
                }
            }
        }

        var policyDtos = policies.Select(p => new PolicyShiftDto(
            p.Id, p.Title, p.Scope, p.Category, p.AnnouncedDate, p.SourceAuthority, p.Summary, p.AffectedSectors)).ToList();

        return new PortfolioPolicyImpactMapDto(
            PortfolioId: portfolioId,
            DomesticShiftsCount: policyDtos.Count(p => p.Scope == "Domestic"),
            InternationalShiftsCount: policyDtos.Count(p => p.Scope == "International"),
            DirectImpactsCount: holdingImpacts.Count(i => i.ImpactType == "DIRECT"),
            IndirectImpactsCount: holdingImpacts.Count(i => i.ImpactType == "INDIRECT"),
            Policies: policyDtos,
            HoldingImpacts: holdingImpacts
        );
    }

    public async Task<IReadOnlyList<PolicyHoldingImpactDto>> GetStockPolicyImpactsAsync(string ticker, CancellationToken ct = default)
    {
        var clean = (ticker ?? "").Trim().ToUpperInvariant().Replace(".NS", "").Replace(".BO", "");
        var stock = await _stockDataProvider.GetStockAsync(clean);
        var name = stock?.Name ?? clean;
        var sector = stock?.Sector.ToString() ?? "Diversified";

        var policies = await _policyProvider.GetActivePolicyShiftsAsync(ct);
        var list = new List<PolicyHoldingImpactDto>();
        foreach (var pol in policies)
        {
            var match = MatchPolicyToHolding(pol, clean, name, sector);
            if (match is not null)
                list.Add(match);
        }
        return list;
    }

    private static PolicyHoldingImpactDto? MatchPolicyToHolding(
        PolicyShift pol, string ticker, string stockName, string sector)
    {
        var secLower = sector.ToLowerInvariant();
        var nameLower = stockName.ToLowerInvariant();

        var directSectorMatch = pol.AffectedSectors.Any(s =>
            secLower.Contains(s.ToLowerInvariant()) || s.ToLowerInvariant().Contains(secLower));

        var keywordMatch = pol.KeyKeywords.Any(k =>
            nameLower.Contains(k.ToLowerInvariant()) || ticker.ToLowerInvariant().Contains(k.ToLowerInvariant()));

        // Indirect macro/supply-chain linkage even if not primary sector
        var isIndirectSupplyChain = !directSectorMatch && !keywordMatch &&
            ((pol.Id == "POL-DOM-CAPEX-2025" && (secLower.Contains("financial") || secLower.Contains("materials"))) ||
             (pol.Id == "POL-INTL-US-TARIFFS" && (secLower.Contains("tech") || secLower.Contains("pharma") || secLower.Contains("health"))));

        if (!directSectorMatch && !keywordMatch && !isIndirectSupplyChain)
            return null;

        var impactType = (directSectorMatch || keywordMatch) ? "DIRECT" : "INDIRECT";
        var (direction, rationale) = DeriveImpactDirectionAndRationale(pol, sector, impactType);

        return new PolicyHoldingImpactDto(
            PolicyId: pol.Id,
            PolicyTitle: pol.Title,
            Scope: pol.Scope,
            Category: pol.Category,
            AnnouncedDate: pol.AnnouncedDate,
            SourceAuthority: pol.SourceAuthority,
            Ticker: ticker,
            StockName: stockName,
            Sector: sector,
            ImpactType: impactType,
            ImpactDirection: direction,
            Rationale: rationale
        );
    }

    private static (string Direction, string Rationale) DeriveImpactDirectionAndRationale(
        PolicyShift pol, string sector, string impactType)
    {
        return pol.Id switch
        {
            "POL-DOM-CAPEX-2025" => impactType == "DIRECT"
                ? ("POSITIVE", "Direct beneficiary of government infrastructure, power-grid, and defence order-book visibility.")
                : ("POSITIVE", "Indirect tailwind from higher industrial credit demand and materials/cement/steel off-take."),
            "POL-DOM-PLI-MFG" => ("POSITIVE", "PLI incentives boost domestic manufacturing capex returns and export competitiveness."),
            "POL-DOM-RBI-CREDIT" => ("WATCH", "Higher risk weights favor well-capitalized CASA banks while tightening NBFC/unsecured growth."),
            "POL-INTL-US-TARIFFS" => sector.Contains("Chem", StringComparison.OrdinalIgnoreCase) || sector.Contains("Materials", StringComparison.OrdinalIgnoreCase)
                ? ("POSITIVE", "China+1 supply-chain diversification can shift US/EU orders toward Indian specialty manufacturers.")
                : ("WATCH", "Monitor US tariff pass-through and export-duty exposure across overseas revenue streams."),
            "POL-INTL-IT-VISA" => ("WATCH", "Visa/onshore scrutiny nudges higher offshore mix and local hiring, keeping margin execution in focus."),
            "POL-INTL-USFDA" => ("WATCH", "Plant inspection outcomes (EIR vs OAI) remain a key catalyst for US product launches."),
            "POL-DOM-FMCG-RURAL" => ("POSITIVE", "Rural income and MSP support aid volume recovery in staples and entry-level discretionary."),
            _ => ("WATCH", pol.Summary)
        };
    }
}
