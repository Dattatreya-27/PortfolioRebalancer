using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using PortfolioRebalancer.Api.Configuration;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add API controllers, ProblemDetails, OpenAPI & HealthChecks
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks();
builder.Services.AddOpenApi();

// High-Performance Response Compression (Brotli + Gzip)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat([
        "application/json",
        "text/javascript",
        "text/css",
        "text/html",
        "application/javascript",
        "image/svg+xml"
    ]);
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

// Add clean architecture Application & Infrastructure services
builder.Services.AddApplicationServices();

// Enable CORS for ease of local frontend integration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Standardized ProblemDetails Exception Handler
app.UseExceptionHandler();

// Enable Response Compression early in pipeline
app.UseResponseCompression();

// OpenAPI & Modern Scalar API Documentation Playground
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("PortfolioRebalancer Quant & Risk API")
           .WithTheme(ScalarTheme.Moon);
});

// Operational Liveness & Health Probes
app.MapHealthChecks("/health");
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    environment = app.Environment.EnvironmentName,
    version = "2.0.0"
}));

app.UseCors();

// Enable default files (index.html) and static files with caching headers
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value ?? "";
        if (path.EndsWith("app.js") || path.EndsWith("index.html") || string.IsNullOrEmpty(path) || path == "/")
        {
            // Immediate freshness for application code
            ctx.Context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            ctx.Context.Response.Headers["Pragma"] = "no-cache";
            ctx.Context.Response.Headers["Expires"] = "0";
        }
        else if (path.EndsWith(".js") || path.EndsWith(".css") || path.EndsWith(".svg"))
        {
            // Fast 1-day caching for immutable vendor libraries
            ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=86400";
        }
    }
});

app.UseAuthorization();

app.MapControllers();

app.Run();
