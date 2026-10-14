using PortfolioRebalancer.Api.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add API controllers & OpenAPI
builder.Services.AddControllers();
builder.Services.AddOpenApi();

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

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

// Enable default files (index.html) and static files from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();

app.MapControllers();

app.Run();
