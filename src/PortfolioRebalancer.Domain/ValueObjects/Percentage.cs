namespace PortfolioRebalancer.Domain.ValueObjects;

/// <summary>
/// Value object representing a percentage (0–100).
/// Prevents invalid percentages and provides fraction conversion.
/// </summary>
public readonly record struct Percentage
{
    public decimal Value { get; }

    public Percentage(decimal value)
    {
        if (value < 0m || value > 100m)
            throw new ArgumentOutOfRangeException(
                nameof(value), value, "Percentage must be between 0 and 100.");
        Value = Math.Round(value, 4);
    }

    /// <summary>Returns the percentage as a decimal fraction (e.g., 60% -> 0.60).</summary>
    public decimal AsFraction => Value / 100m;

    /// <summary>Creates a Percentage from a decimal fraction (e.g., 0.60 -> 60%).</summary>
    public static Percentage FromFraction(decimal fraction) => new(fraction * 100m);

    public override string ToString() => $"{Value:F2}%";
}
