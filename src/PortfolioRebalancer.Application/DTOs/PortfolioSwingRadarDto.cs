namespace PortfolioRebalancer.Application.DTOs;

using PortfolioRebalancer.Domain.Models;

/// <summary>
/// Individual portfolio holding evaluated through the quant swing trading and stage analysis engine.
/// </summary>
public sealed record PortfolioHoldingSwingDto(
    string Ticker,
    string Name,
    string Sector,
    decimal Quantity,
    decimal BuyPrice,
    decimal CurrentPrice,
    decimal UnrealizedPnL,
    decimal UnrealizedPnLPercent,
    decimal WeightPercent,
    SwingTradingSignal? SwingSignal,
    string TimingVerdict,
    string ActionRecommendation,
    string ActionTone,
    bool IsStage2Uptrend,
    bool IsStage4Risk
);

/// <summary>
/// Comprehensive portfolio swing report sorting user holdings into active setups, forming squeezes, Stage 2 leaders, and Stage 4 risk flags.
/// </summary>
public sealed record PortfolioSwingRadarDto(
    Guid PortfolioId,
    string PortfolioName,
    int TotalHoldingsCount,
    int ActiveSetupsCount,
    int FormingSetupsCount,
    int Stage4RiskCount,
    IReadOnlyList<PortfolioHoldingSwingDto> ActiveSetups,
    IReadOnlyList<PortfolioHoldingSwingDto> FormingSetups,
    IReadOnlyList<PortfolioHoldingSwingDto> Stage2Leaders,
    IReadOnlyList<PortfolioHoldingSwingDto> Stage4Risks
);
