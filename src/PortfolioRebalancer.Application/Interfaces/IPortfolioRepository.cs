using PortfolioRebalancer.Domain.Models;

namespace PortfolioRebalancer.Application.Interfaces;

/// <summary>
/// Port interface for portfolio persistence.
/// The Domain/Application layers define WHAT we need; Infrastructure decides HOW.
/// This is the Dependency Inversion Principle (the 'D' in SOLID) in action.
/// </summary>
public interface IPortfolioRepository
{
    Task<Portfolio?> GetByIdAsync(Guid id);
    Task<IReadOnlyList<Portfolio>> GetAllAsync();
    Task SaveAsync(Portfolio portfolio);
    Task<bool> DeleteAsync(Guid id);
}
