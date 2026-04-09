using System.Security.Claims;
using bds_backend.Data;
using bds_backend.Dtos;
using bds_backend.Models;
using bds_backend.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bds_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    PasswordService passwordService,
    JwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.UserAccounts.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Email already registered." });

        var (hash, salt) = passwordService.HashPassword(request.Password);
        var user = new UserAccount
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = hash,
            PasswordSalt = salt,
            Role = request.Role
        };
        db.UserAccounts.Add(user);
        db.AuditLogs.Add(new AuditLog { Action = "REGISTER", Detail = email });
        await db.SaveChangesAsync();

        return Ok(new { message = "Registered successfully." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.UserAccounts.SingleOrDefaultAsync(u => u.Email == email);
        if (user is null || !passwordService.VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized(new { message = "Invalid email or password." });

        var token = jwtTokenService.CreateToken(user);
        db.AuditLogs.Add(new AuditLog { UserId = user.Id, Action = "LOGIN", Detail = user.Email });
        await db.SaveChangesAsync();

        return Ok(new
        {
            token,
            user = new { user.Id, user.FullName, user.Email, user.Role }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Sid) ?? User.FindFirstValue("sub");
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();
        var user = await db.UserAccounts.FindAsync(userId);
        if (user is null) return NotFound();
        return Ok(new { user.Id, user.FullName, user.Email, user.Role, user.CreatedAtUtc });
    }

    [Authorize]
    [HttpDelete("delete-account")]
    public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var userIdClaim = User.FindFirstValue("sub");
        if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();
        var user = await db.UserAccounts.FindAsync(userId);
        if (user is null) return NotFound();
        if (!passwordService.VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized(new { message = "Password incorrect." });

        db.UserAccounts.Remove(user);
        db.AuditLogs.Add(new AuditLog { UserId = userId, Action = "DELETE_ACCOUNT", Detail = user.Email });
        await db.SaveChangesAsync();
        return Ok(new { message = "Account deleted." });
    }
}
