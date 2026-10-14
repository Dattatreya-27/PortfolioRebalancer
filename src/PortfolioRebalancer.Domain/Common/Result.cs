namespace PortfolioRebalancer.Domain.Common;

/// <summary>
/// Railway-oriented Result type for domain operations that can fail.
/// Avoids using exceptions for expected business rule violations.
/// </summary>
public sealed class Result<T>
{
    public T? Value { get; }
    public string? Error { get; }
    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    private Result(T value)
    {
        Value = value;
        IsSuccess = true;
    }

    private Result(string error)
    {
        Error = error;
        IsSuccess = false;
    }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);

    /// <summary>
    /// Pattern match on success/failure — forces callers to handle both cases.
    /// </summary>
    public TResult Match<TResult>(
        Func<T, TResult> onSuccess,
        Func<string, TResult> onFailure)
        => IsSuccess ? onSuccess(Value!) : onFailure(Error!);

    /// <summary>
    /// Transform the success value, short-circuiting on failure.
    /// </summary>
    public Result<TNew> Map<TNew>(Func<T, TNew> transform)
        => IsSuccess ? Result<TNew>.Success(transform(Value!)) : Result<TNew>.Failure(Error!);

    /// <summary>
    /// Chain another Result-producing operation, short-circuiting on failure.
    /// </summary>
    public Result<TNew> Bind<TNew>(Func<T, Result<TNew>> transform)
        => IsSuccess ? transform(Value!) : Result<TNew>.Failure(Error!);
}
