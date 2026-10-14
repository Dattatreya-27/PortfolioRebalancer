namespace PortfolioRebalancer.Domain.ValueObjects;

/// <summary>
/// Value object representing a monetary amount with currency.
/// Defaults to INR for Indian equities.
/// Provides safe arithmetic operations that enforce currency consistency.
/// </summary>
public readonly record struct Money(decimal Amount, string Currency = "INR")
{
    public static Money Zero(string currency = "INR") => new(0m, currency);
    public static Money INR(decimal amount) => new(amount, "INR");
    public static Money USD(decimal amount) => new(amount, "USD");

    public Money Add(Money other)
    {
        EnsureSameCurrency(other);
        return this with { Amount = Amount + other.Amount };
    }

    public Money Subtract(Money other)
    {
        EnsureSameCurrency(other);
        return this with { Amount = Amount - other.Amount };
    }

    public Money Multiply(decimal factor) => this with { Amount = Amount * factor };

    public static Money operator +(Money a, Money b) => a.Add(b);
    public static Money operator -(Money a, Money b) => a.Subtract(b);
    public static Money operator *(Money a, decimal b) => a.Multiply(b);
    public static Money operator *(decimal a, Money b) => b.Multiply(a);

    public static bool operator >(Money a, Money b)
    {
        a.EnsureSameCurrency(b);
        return a.Amount > b.Amount;
    }

    public static bool operator <(Money a, Money b)
    {
        a.EnsureSameCurrency(b);
        return a.Amount < b.Amount;
    }

    public static bool operator >=(Money a, Money b)
    {
        a.EnsureSameCurrency(b);
        return a.Amount >= b.Amount;
    }

    public static bool operator <=(Money a, Money b)
    {
        a.EnsureSameCurrency(b);
        return a.Amount <= b.Amount;
    }

    private readonly void EnsureSameCurrency(Money other)
    {
        if (Currency != other.Currency)
            throw new InvalidOperationException(
                $"Cannot perform operation between {Currency} and {other.Currency}");
    }

    public override string ToString() => $"{Currency} {Amount:N2}";
}
