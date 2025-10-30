using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TicTacToe.Backend.Helpers;
using TicTacToe.Backend.Login.Models;
using TicTacToe.Data.DataAccess;
using TicTacToe.Data.Models;

namespace TicTacToe.Backend.Login;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoginController(UserDataAccess userDataAccess) : ControllerBase
{
    private readonly UserDataAccess userDataAccess = userDataAccess;
    
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginModel request)
    {
        var user = userDataAccess.GetUser(request.Username);
        if (user is null || !Cryptography.VerifyPassword(request.Password, user.PasswordHash,  user.PasswordSalt))
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

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] LoginModel request)
    {
        if (string.IsNullOrWhiteSpace(request.Username)
            || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Username or password cannot be empty");
        }
        
        var user = userDataAccess.GetUser(request.Username);
        
        if (user is not null)
        {
            return BadRequest("Username already exists");
        }
        
        var (hash, salt) = Cryptography.HashPassword(request.Password);
        
        var success = userDataAccess.CreateUser(new User
        {
            Username = request.Username,
            PasswordHash = hash,
            PasswordSalt = salt,
            CreatedAt = DateTimeOffset.Now,
            UpdatedAt = DateTimeOffset.Now,
            Email = string.Empty,
        });
        
        return success 
            ? Ok(new { Message = "User created successfully" })
            : BadRequest(new { Message = "User creation failed" });
    }
    
    [HttpPost("update")]
    public async Task<IActionResult> UpdatePassword([FromBody] LoginModel request)
    {
        if (string.IsNullOrWhiteSpace(request.Username)
            || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Username or password cannot be empty");
        }

        return BadRequest(new { Message = "Hello world!"} );
    }
    
    [HttpPost("me")]
    [AllowAnonymous]
    public IActionResult Me([FromBody] string dateTime)
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
