using System.Collections.Concurrent;
using System.Text.Json;
using PortfolioRebalancer.Application.Interfaces;
using PortfolioRebalancer.Domain.Enums;
using PortfolioRebalancer.Domain.Models;
using PortfolioRebalancer.Domain.ValueObjects;

namespace PortfolioRebalancer.Infrastructure.Persistence;

/// <summary>
/// Production JSON file-backed portfolio repository providing persistent local storage.
/// Data is persisted to disk at D:\PortfolioRebalancer\data\portfolios.json so that any changes,
/// deletions, additions, or price updates permanently survive across server restarts and sessions.
/// </summary>
public sealed class JsonFilePortfolioRepository : IPortfolioRepository
{
    private readonly string _filePath;
    private readonly ConcurrentDictionary<Guid, Portfolio> _cache = new();
    private readonly SemaphoreSlim _fileLock = new(1, 1);
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    public JsonFilePortfolioRepository(string? customPath = null)
    {
        if (!string.IsNullOrEmpty(customPath))
        {
            _filePath = customPath;
        }
        else if (Directory.Exists(@"D:\PortfolioRebalancer\data"))
        {
            _filePath = @"D:\PortfolioRebalancer\data\portfolios.json";
        }
        else
        {
            var dir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data");
            Directory.CreateDirectory(dir);
            _filePath = Path.Combine(dir, "portfolios.json");
        }

        var parentDir = Path.GetDirectoryName(_filePath);
        if (!string.IsNullOrEmpty(parentDir) && !Directory.Exists(parentDir))
        {
            Directory.CreateDirectory(parentDir);
        }

        LoadFromFile();
    }

    public Task<Portfolio?> GetByIdAsync(Guid id)
    {
        _cache.TryGetValue(id, out var portfolio);
        return Task.FromResult(portfolio);
    }

    public Task<IReadOnlyList<Portfolio>> GetAllAsync()
    {
        IReadOnlyList<Portfolio> list = _cache.Values.ToList().AsReadOnly();
        return Task.FromResult(list);
    }

    public async Task SaveAsync(Portfolio portfolio)
    {
        ArgumentNullException.ThrowIfNull(portfolio);
        _cache.AddOrUpdate(portfolio.Id, portfolio, (_, _) => portfolio);
        await FlushToFileAsync();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var removed = _cache.TryRemove(id, out _);
        if (removed)
        {
            await FlushToFileAsync();
        }
        return removed;
    }

    private void LoadFromFile()
    {
        if (!File.Exists(_filePath)) return;

        try
        {
            var json = File.ReadAllText(_filePath);
            if (string.IsNullOrWhiteSpace(json)) return;

            var models = JsonSerializer.Deserialize<List<PortfolioStorageModel>>(json);
            if (models is null) return;

            _cache.Clear();
            foreach (var m in models)
            {
                var portfolio = MapToDomain(m);
                _cache[portfolio.Id] = portfolio;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] Could not load portfolios from {_filePath}: {ex.Message}");
        }
    }

    private async Task FlushToFileAsync()
    {
        await _fileLock.WaitAsync();
        try
        {
            var models = _cache.Values.Select(MapFromDomain).ToList();
            var json = JsonSerializer.Serialize(models, JsonOptions);

            var tempPath = _filePath + ".tmp";
            await File.WriteAllTextAsync(tempPath, json);
            File.Move(tempPath, _filePath, overwrite: true);
        }
        finally
        {
            _fileLock.Release();
        }
    }

    private static Portfolio MapToDomain(PortfolioStorageModel model)
    {
        var portfolio = new Portfolio
        {
            Id = model.Id,
            Name = model.Name,
            CreatedAt = model.CreatedAt,
            LastSyncedAt = model.LastSyncedAt
        };

        foreach (var h in model.Holdings)
        {
            if (!Enum.TryParse<Sector>(h.Sector, ignoreCase: true, out var sector))
            {
                sector = Sector.Industrials;
            }

            var stock = new Stock
            {
                Ticker = new Ticker(h.Ticker),
                Name = h.Name,
                Sector = sector
            };

            stock.UpdateMarketData(
                Money.INR(h.CurrentPrice),
                h.PERatio,
                h.DividendYield,
                h.MarketCap);

            var holding = new Holding
            {
                Stock = stock,
                Quantity = h.Quantity,
                AverageBuyPrice = h.AverageBuyPrice.HasValue ? Money.INR(h.AverageBuyPrice.Value) : null
            };

            portfolio.AddHolding(holding);
        }

        if (model.TargetAllocations.Count > 0)
        {
            try
            {
                var allocations = model.TargetAllocations.Select(t =>
                {
                    Enum.TryParse<Sector>(t.Sector, ignoreCase: true, out var sec);
                    return new SectorAllocation(sec, new Percentage(t.TargetWeight));
                });
                portfolio.SetTargetAllocations(allocations);
            }
            catch {}
        }

        return portfolio;
    }

    private static PortfolioStorageModel MapFromDomain(Portfolio domain)
    {
        return new PortfolioStorageModel
        {
            Id = domain.Id,
            Name = domain.Name,
            CreatedAt = domain.CreatedAt,
            LastSyncedAt = domain.LastSyncedAt,
            Holdings = domain.Holdings.Select(h => new HoldingStorageModel
            {
                Ticker = h.Stock.Ticker.Value,
                Name = h.Stock.Name,
                Sector = h.Stock.Sector.ToString(),
                Quantity = h.Quantity,
                AverageBuyPrice = h.AverageBuyPrice?.Amount,
                CurrentPrice = h.Stock.CurrentPrice.Amount,
                PERatio = h.Stock.PERatio,
                DividendYield = h.Stock.DividendYield,
                MarketCap = h.Stock.MarketCap
            }).ToList(),
            TargetAllocations = domain.TargetAllocations.Select(t => new SectorAllocationStorageModel
            {
                Sector = t.Sector.ToString(),
                TargetWeight = t.TargetWeight.Value
            }).ToList()
        };
    }

    private sealed class PortfolioStorageModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? LastSyncedAt { get; set; }
        public List<HoldingStorageModel> Holdings { get; set; } = [];
        public List<SectorAllocationStorageModel> TargetAllocations { get; set; } = [];
    }

    private sealed class HoldingStorageModel
    {
        public string Ticker { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Sector { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal? AverageBuyPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal? PERatio { get; set; }
        public decimal? DividendYield { get; set; }
        public decimal? MarketCap { get; set; }
    }

    private sealed class SectorAllocationStorageModel
    {
        public string Sector { get; set; } = string.Empty;
        public decimal TargetWeight { get; set; }
    }
}
