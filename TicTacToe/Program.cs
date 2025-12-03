using System.Text;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using TicTacToe.Backend.SignalR;
using TicTacToe.Data;
using TicTacToe.Data.DataAccess;
using Microsoft.OpenApi.Models;
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
        options.LoginPath = "/login";
        options.AccessDeniedPath = "/login";
        options.ExpireTimeSpan = TimeSpan.FromHours(1);
        options.SlidingExpiration = true;
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

var rootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");

var appPath = Path.Combine(rootPath, "app");
if (Directory.Exists(appPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(appPath),
        RequestPath = "/app"
    });
}

var loginPath = Path.Combine(rootPath, "login");
if (Directory.Exists(loginPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(loginPath),
        RequestPath = "/login"
    });
}

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

app.MapGet("/", context =>
{
    context.Response.Redirect("/login");
    return Task.CompletedTask;
});

app.MapFallbackToFile("/login/{*path:nonfile}", "login/index.html");
app.MapFallbackToFile("/app/{*path:nonfile}", "app/index.html").RequireAuthorization();

app.Run();