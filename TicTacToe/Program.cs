using System.Text;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using TicTacToe.Backend.SignalR;
using TicTacToe.Data;
using TicTacToe.Data.DataAccess;
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "wwwroot" // ensure this is relative to content root
});

// DbContext
builder.Services.AddDbContext<TicTacToeDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "DefaultConnection"),
            b => b.MigrationsAssembly("TicTacToe")));

// Services
builder.Services.AddScoped<UserDataAccess>();
builder.Services.AddScoped<TicTacToe.Data.DataAccess.GameDataAccess>();

// Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        // The SPA renders its login view at "/" (there is no separate /login page).
        options.LoginPath = "/";
        options.AccessDeniedPath = "/";
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;

        // For API/XHR requests, return a status code instead of redirecting to an
        // HTML page, so the SPA can react to auth failures itself (fetch would
        // otherwise follow the redirect and receive index.html instead of JSON).
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }
            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            }
            context.Response.Redirect(context.RedirectUri);
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

var app = builder.Build();

// Migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TicTacToeDbContext>();
    db.Database.Migrate();
}

// Single-page app served from wwwroot (index.html + bundle.js at the root).
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TicTacToe API v1");
    c.RoutePrefix = "swagger"; // optional
});

app.MapControllers();
app.MapHub<GameHub>("/gameHub").RequireAuthorization();

// SPA fallback: any non-file route serves index.html; the client-side
// router (and RequireAuth guard) takes over from there.
app.MapFallbackToFile("index.html");

app.Run();