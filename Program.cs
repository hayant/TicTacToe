using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

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