using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using AuthRequests = SportsCenterManagement.BLL.DTOs.Auth.Requests;
using AuthResponses = SportsCenterManagement.BLL.DTOs.Auth.Responses;

namespace SportsCenterManagement.API.Authentication;

public sealed class BearerTokenIssuer
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(1);
    private readonly IDataProtector _protector;
    private readonly IConfiguration _configuration;

    public BearerTokenIssuer(IDataProtectionProvider provider, IConfiguration configuration)
    {
        _protector = provider.CreateProtector("SportsCenter.BearerToken.v1");
        _configuration = configuration;
    }

    public (string Token, DateTime ExpiresAt) Issue(AuthResponses.AuthenticatedUser user)
    {
        var expiresAt = DateTime.UtcNow.Add(TokenLifetime);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
            new(ClaimTypes.Role, user.Role)
        };
        if (user.CenterId.HasValue) claims.Add(new Claim("centerId", user.CenterId.Value.ToString()));
        var key = _configuration["Jwt:Key"] ?? _configuration["Jwt:SecretKey"]
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"], audience: _configuration["Jwt:Audience"],
            claims: claims, notBefore: DateTime.UtcNow, expires: expiresAt,
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256));
        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public ClaimsPrincipal Validate(string token)
    {
        var payload = JsonSerializer.Deserialize<TokenPayload>(_protector.Unprotect(token))
            ?? throw new InvalidOperationException("Token không hợp lệ.");
        if (payload.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("Token đã hết hạn.");
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, payload.UserId.ToString()),
            new(ClaimTypes.Name, payload.Username),
            new(ClaimTypes.Role, payload.Role)
        };
        if (payload.CenterId.HasValue)
        {
            claims.Add(new Claim("centerId", payload.CenterId.Value.ToString()));
        }
        return new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));
    }

    private sealed record TokenPayload(long UserId, string Username, string Role, long? CenterId, DateTime ExpiresAt);
}
