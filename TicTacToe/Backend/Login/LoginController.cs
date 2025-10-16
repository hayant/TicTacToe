using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using TicTacToe.Backend.Login.Models;

namespace TicTacToe.Backend.Login;

[ApiController]
[Route("api/[controller]")]
public class LoginController : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginModel request)
    {
        // TODO: Replace this with real user validation (database, etc.)
        if (request.Username != "Ana" || request.Password != "Hoo")
        {
            return Unauthorized(new { Message = "Invalid username or password" });
        }
        
        // Create user claims (you can add roles or other info here)
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, request.Username),
            new Claim(ClaimTypes.Role, "User"),
            new Claim("LoggedInAt", DateTime.UtcNow.ToString("o"))
        };

        var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

        var authProperties = new AuthenticationProperties
        {
            IsPersistent = true, // keeps cookie across browser sessions
            ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1)
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(claimsIdentity),
            authProperties
        );

        return Ok(new
        {
            Message = "Login successful",
            User = request.Username
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { Message = "Logged out successfully" });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        if (User?.Identity?.IsAuthenticated ?? false)
        {
            return Ok(new
            {
                Authenticated = true,
                Username = User.Identity!.Name
            });
        }

        return Unauthorized(new { Authenticated = false });
    }
}
