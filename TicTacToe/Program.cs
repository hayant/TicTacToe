using System.Text;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TicTacToe.Data;

var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<TicTacToeDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "DefaultConnection"),
            b => b.MigrationsAssembly("TicTacToe")));

// Authentication
// builder.Services.AddAuthentication("Bearer")
//     .AddJwtBearer(options =>
//     {
//         options.TokenValidationParameters = new TokenValidationParameters()
//         {
//             ValidateIssuer = true,
//             ValidateAudience = true,
//             ValidateLifetime = true,
//             ValidIssuer = "TicTacToe",
//             ValidAudience = "TicTacToe",
//             IssuerSigningKey = new SymmetricSecurityKey(
//                 Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
//         };
//     });
//
// builder.Services.AddAuthorization();
// builder.Services.AddControllers();

var app = builder.Build();

// Migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TicTacToeDbContext>();
    db.Database.Migrate();
}

//// app.MapGet("/", () => "Hello World!");
// app.UseStaticFiles(new StaticFileOptions
// {
//     FileProvider = new PhysicalFileProvider(
//         Path.Combine(Directory.GetCurrentDirectory(), "scripts/dist")),
//     RequestPath = string.Empty
// });

// app.UseDefaultFiles();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "app")),
    RequestPath = "/app"
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "login")),
    RequestPath = "/login"
});

// app.UseAuthentication();
// app.UseAuthorization();
// app.MapControllers();

// app.UseRouting();
app.MapFallbackToFile("/app/{*path:nonfile}", "app/index.html");
app.MapFallbackToFile("/app/index.html");

// app.UseEndpoints(endpoints =>
// {
//     // endpoints.MapControllers();
//     // fallback for React
//     endpoints.MapFallbackToFile("/app/{*path:nonfile}", "app/index.html");
// });

// app.MapFallbackToFile("/app/index.html").RequireAuthorization();

app.Run();