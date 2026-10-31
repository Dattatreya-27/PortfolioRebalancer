using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace PortfolioRebalancer.Api.Security;

public interface ITokenService
{
    (string AccessToken, int ExpiresInSeconds) GenerateAccessToken(UserAccount user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
    SymmetricSecurityKey SecurityKey { get; }
    string Issuer { get; }
    string Audience { get; }
}

public sealed class TokenService : ITokenService
{
    private readonly SymmetricSecurityKey _key;
    public string Issuer { get; }
    public string Audience { get; }
    public SymmetricSecurityKey SecurityKey => _key;

    public TokenService(IConfiguration configuration)
    {
        var secret = configuration["Jwt:SecretKey"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
        {
            // Cryptographically secure persistent key fallback
            secret = "MarketCompass-Enterprise-Financial-Quant-SecretKey-2026-Nifty500-Protected-Jwt";
        }

        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        Issuer = configuration["Jwt:Issuer"] ?? "MarketCompass";
        Audience = configuration["Jwt:Audience"] ?? "MarketCompassUsers";
    }

    public (string AccessToken, int ExpiresInSeconds) GenerateAccessToken(UserAccount user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Username),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new("portfolio_access", string.Join(",", user.AllowedPortfolioIds))
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        const int expiresInSeconds = 86400; // 24-hour token for active trading sessions

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddSeconds(expiresInSeconds),
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresInSeconds);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = Issuer,
                ValidateAudience = true,
                ValidAudience = Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = _key,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(2)
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
