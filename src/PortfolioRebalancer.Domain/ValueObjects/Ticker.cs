namespace PortfolioRebalancer.Domain.ValueObjects;

/// <summary>
/// Strongly-typed value object for stock ticker symbols.
/// Ensures normalization (uppercase, trimmed) and prevents primitive obsession.
/// </summary>
public readonly record struct Ticker
{
    public string Value { get; }

    public Ticker(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        Value = value.Trim().ToUpperInvariant();
    }

    public static implicit operator string(Ticker ticker) => ticker.Value;
    public override string ToString() => Value;
}
