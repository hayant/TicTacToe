using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using TicTacToe.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<TicTacToeDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "DefaultConnection"),
            b => b.MigrationsAssembly("TicTacToe")));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TicTacToeDbContext>();
    db.Database.Migrate();
}

//// app.MapGet("/", () => "Hello World!");
app.UseDefaultFiles();
// app.UseStaticFiles(new StaticFileOptions
// {
//     FileProvider = new PhysicalFileProvider(
//         Path.Combine(Directory.GetCurrentDirectory(), "scripts/dist")),
//     RequestPath = string.Empty
// });
app.UseStaticFiles();

//app.MapFallbackToFile("index.html");

app.Run();