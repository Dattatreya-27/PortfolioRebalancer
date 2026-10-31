using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PortfolioRebalancer.Api.Security;

public sealed record LoginRequest(string Username, string Password);

public sealed record OAuth2TokenResponse(
    string access_token,
    string token_type,
    int expires_in,
    string scope,
    UserProfileDto user
);

public sealed record UserProfileDto(
    string Username,
    string FullName,
    string Role,
    List<string> AllowedPortfolioIds
);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ITokenService _tokenService;

    public AuthController(IUserService userService, ITokenService tokenService)
    {
        _userService = userService;
        _tokenService = tokenService;
    }

    /// <summary>
    /// Standard JSON login endpoint for Single Page Application.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public ActionResult<OAuth2TokenResponse> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { error = "Username and password are required." });
        }

        var user = _userService.ValidateUser(request.Username, request.Password);
        if (user == null)
        {
            return Unauthorized(new { error = "Invalid credentials. Please verify your username and password." });
        }

        var (accessToken, expiresIn) = _tokenService.GenerateAccessToken(user);

        return Ok(new OAuth2TokenResponse(
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: expiresIn,
            scope: "portfolio:read portfolio:write trades:read trades:write",
            user: new UserProfileDto(
                user.Username,
                user.FullName,
                user.Role,
                user.AllowedPortfolioIds
            )
        ));
    }

    /// <summary>
    /// RFC 6749 OAuth 2.0 Token Endpoint (grant_type=password).
    /// Compatible with OAuth 2.0 / OpenID Connect client libraries and API clients.
    /// </summary>
    [HttpPost("oauth2/token")]
    [Consumes("application/x-www-form-urlencoded")]
    [AllowAnonymous]
    public ActionResult<OAuth2TokenResponse> OAuthToken([FromForm] IFormCollection form)
    {
        var grantType = form["grant_type"].ToString();
        var username = form["username"].ToString();
        var password = form["password"].ToString();

        if (string.IsNullOrEmpty(grantType) || !grantType.Equals("password", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "unsupported_grant_type", error_description = "Only grant_type 'password' is supported." });
        }

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new { error = "invalid_request", error_description = "Username and password are required." });
        }

        var user = _userService.ValidateUser(username, password);
        if (user == null)
        {
            return Unauthorized(new { error = "invalid_grant", error_description = "Invalid username or password." });
        }

        var (accessToken, expiresIn) = _tokenService.GenerateAccessToken(user);

        return Ok(new OAuth2TokenResponse(
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: expiresIn,
            scope: "portfolio:read portfolio:write trades:read trades:write",
            user: new UserProfileDto(
                user.Username,
                user.FullName,
                user.Role,
                user.AllowedPortfolioIds
            )
        ));
    }

    /// <summary>
    /// Returns the authenticated user's profile and active session status.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public ActionResult<UserProfileDto> GetCurrentUser()
    {
        var username = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var user = _userService.GetByUsername(username);
        if (user == null) return NotFound(new { error = "User account not found." });

        return Ok(new UserProfileDto(
            user.Username,
            user.FullName,
            user.Role,
            user.AllowedPortfolioIds
        ));
    }

    /// <summary>
    /// Changes the user's password securely with PBKDF2 hash update.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public IActionResult ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var username = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            return BadRequest(new { error = "New password must be at least 6 characters long." });
        }

        var success = _userService.ChangePassword(username, request.CurrentPassword, request.NewPassword);
        if (!success)
        {
            return BadRequest(new { error = "Current password was incorrect." });
        }

        return Ok(new { message = "Password updated successfully." });
    }
}
