using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Infrastructure.MarketData;

public class PolicyIntelligenceProvider : IPolicyIntelligenceProvider
{
    private static readonly IReadOnlyList<PolicyShift> ActivePolicies = new List<PolicyShift>
    {
        new(
            Id: "POL-DOM-CAPEX-2025",
            Title: "Union Budget Public Capex & Defence/Power Grid Allocation",
            Scope: "Domestic",
            Category: "UnionBudget",
            AnnouncedDate: "FY25-26",
            SourceAuthority: "Ministry of Finance, Govt of India",
            Summary: "Sustained ₹11.11L Cr+ capital expenditure outlay prioritizing railways, defence indigenization, transmission grids, and renewable energy.",
            AffectedSectors: new[] { "Industrials", "Infrastructure", "Capital Goods", "Energy", "Utilities", "Defence" },
            KeyKeywords: new[] { "capex", "defence", "power", "grid", "railway", "infra", "engineering" }
        ),
        new(
            Id: "POL-DOM-PLI-MFG",
            Title: "PLI Scheme Disbursements & Domestic Electronics/Pharma Incentives",
            Scope: "Domestic",
            Category: "PLI",
            AnnouncedDate: "2025",
            SourceAuthority: "DPIIT / MeitY",
            Summary: "Production-Linked Incentive milestones accelerating domestic manufacturing in EMS, specialty pharma APIs, and EV components.",
            AffectedSectors: new[] { "Healthcare", "Pharma", "Consumer Discretionary", "Auto", "Technology", "Materials" },
            KeyKeywords: new[] { "pli", "manufacturing", "api", "electronics", "ev", "auto" }
        ),
        new(
            Id: "POL-DOM-RBI-CREDIT",
            Title: "RBI Unsecured Retail & NBFC Risk-Weight Tightening / LCR Norms",
            Scope: "Domestic",
            Category: "RBI_SEBI",
            AnnouncedDate: "2025",
            SourceAuthority: "Reserve Bank of India (RBI)",
            Summary: "Higher capital risk weights on unsecured personal loans and NBFC lending; banks with strong CASA deposits gain relative funding advantage.",
            AffectedSectors: new[] { "Financials", "Banking", "NBFC" },
            KeyKeywords: new[] { "bank", "nbfc", "finance", "lending", "credit", "casa" }
        ),
        new(
            Id: "POL-INTL-US-TARIFFS",
            Title: "US Reciprocal Tariff & Global Trade Realignment",
            Scope: "International",
            Category: "Tariffs_Trade",
            AnnouncedDate: "2025",
            SourceAuthority: "US Trade Representative (USTR)",
            Summary: "Potential US tariff hikes on Asian imports create near-term export uncertainty for select goods, while accelerating China+1 sourcing toward India.",
            AffectedSectors: new[] { "Materials", "Chemicals", "Auto", "Consumer Discretionary", "Industrials", "Technology" },
            KeyKeywords: new[] { "export", "tariff", "us", "china+1", "chemicals", "auto" }
        ),
        new(
            Id: "POL-INTL-IT-VISA",
            Title: "US H-1B Visa & Enterprise Tech Outsourcing Scrutiny",
            Scope: "International",
            Category: "Visa_Outsourcing",
            AnnouncedDate: "2025",
            SourceAuthority: "US DHS / Congress",
            Summary: "Stricter onshore visa rules push Indian IT services toward higher offshore delivery mix and local US hiring; BFSI tech spend recovery remains key.",
            AffectedSectors: new[] { "Technology", "IT" },
            KeyKeywords: new[] { "it", "software", "tech", "outsourcing", "h1b", "ai" }
        ),
        new(
            Id: "POL-INTL-USFDA",
            Title: "USFDA Plant Inspection Cycle & US Generic Pricing Stabilization",
            Scope: "International",
            Category: "FDA_Regulatory",
            AnnouncedDate: "2025",
            SourceAuthority: "U.S. Food & Drug Administration",
            Summary: "Resumed USFDA inspections increase compliance scrutiny (Form 483/OAI risk) for export-oriented plants, while US generic price erosion is moderating.",
            AffectedSectors: new[] { "Healthcare", "Pharma" },
            KeyKeywords: new[] { "pharma", "fda", "usfda", "drug", "hospital", "healthcare" }
        ),
        new(
            Id: "POL-DOM-FMCG-RURAL",
            Title: "MSP Hikes & Rural Welfare Outlays Supporting Mass Consumption",
            Scope: "Domestic",
            Category: "UnionBudget",
            AnnouncedDate: "2025",
            SourceAuthority: "Cabinet Committee / Govt of India",
            Summary: "Higher minimum support prices and rural employment/housing outlays gradually support rural volume recovery for staples and two-wheelers.",
            AffectedSectors: new[] { "Consumer Staples", "FMCG", "Consumer Discretionary" },
            KeyKeywords: new[] { "fmcg", "staples", "rural", "consumer", "retail" }
        )
    };

    public Task<IReadOnlyList<PolicyShift>> GetActivePolicyShiftsAsync(CancellationToken ct = default)
        => Task.FromResult(ActivePolicies);
}
