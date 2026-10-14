using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Domain.Models;

/// <summary>
/// Value object representing a target allocation for a sector.
/// Example: Technology sector should be 30% of the portfolio.
/// </summary>
public sealed record SectorAllocation(Sector Sector, Percentage TargetWeight);
