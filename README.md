# ðŸ“ˆ Indian Markets Equity Portfolio Rebalancer & Advisory Engine

[![.NET 10](https://img.shields.io/badge/.NET-10.0-purple.svg)](https://dotnet.microsoft.com/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Onion-blue.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

An institutional-grade portfolio rebalancing, multi-factor risk scoring, and wealth advisory engine built with **C# .NET 10 Clean Architecture**, tailored for Indian equities (NSE & BSE).

---

## ðŸŒŸ Key Features

- **âš¡ Real-Time Live NSE Quotes**: Authenticated live quote pipeline with automated alias resolution for rebranded tickers (e.g. `SAMMAANCAP`, `TMPV`, `DBREALTY`, `GUJENERGY`).
- **ðŸ“Š Continuous Smooth Scroll Terminal**: High-density widescreen dashboard displaying side-by-side **Average Buy Price**, **Live CMP**, **Unrealized P&L (â‚¹ / %)**, and **Market Value**.
- **ðŸ›¡ï¸ Institutional Health & Risk Cockpit**:
  - **Herfindahl-Hirschman Index (HHI)**: Calculates portfolio concentration and Effective Number of Bets ($N_{\text{eff}}$).
  - **AMFI Market-Cap Allocation**: Large-Cap ($\ge â‚¹20,000\text{ Cr}$), Mid-Cap ($â‚¹5,000 - â‚¹20,000\text{ Cr}$), and Small-Cap distribution against institutional benchmarks (65/25/10).
  - **Tail-End Dilution Detector**: Identifies micro-holdings ($< 0.5\%$ weight) adding tracking overhead with near-zero alpha contribution.
  - **Alpha & Tax-Loss Harvesting**: Detects multi-baggers ($>50\%$ gain) for profit-taking and deep drawdowns ($<-25\%$) for tax-loss harvesting.
- **âš–ï¸ Dynamic Target Rebalancer**: Target sector allocation engine generating optimal BUY/SELL rupee orders to re-align risk without excessive portfolio turnover.
- **ðŸ”’ Privacy & Local-First Storage**: Portfolios persist locally on your machine (`data/portfolios.json`). No personal financial data is ever transmitted to third-party databases.

---

## ðŸ›ï¸ Architecture & Project Structure

Follows standard **Clean Architecture** (Onion Architecture) with strict boundary separation:

```
PortfolioRebalancer/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ PortfolioRebalancer.Domain/          # Pure entities, Value Objects (Money, Ticker), Enums
â”‚   â”œâ”€â”€ PortfolioRebalancer.Application/     # Use cases, DTOs, Rebalance & Diagnostic services
â”‚   â”œâ”€â”€ PortfolioRebalancer.Infrastructure/  # Yahoo Finance API, Local JSON persistence
â”‚   â””â”€â”€ PortfolioRebalancer.Api/             # ASP.NET Core Web API, Static UI (index.html, app.js)
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ PortfolioRebalancer.Domain.Tests/    # 45+ xUnit tests for financial math & value objects
â”‚   â”œâ”€â”€ PortfolioRebalancer.Application.Tests/
â”‚   â””â”€â”€ PortfolioRebalancer.Api.Tests/
â””â”€â”€ data/
    â””â”€â”€ portfolios.sample.json               # Sample template for quick testing
```

---

## ðŸš€ Getting Started

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/download)

### 1. Clone the repository
```bash
git clone https://github.com/Dattatreya-27/PortfolioRebalancer.git
cd PortfolioRebalancer
```

### 2. Build the solution
```bash
dotnet build src/PortfolioRebalancer.Api/PortfolioRebalancer.Api.csproj
```

### 3. Run the tests
```bash
dotnet test tests/PortfolioRebalancer.Domain.Tests/PortfolioRebalancer.Domain.Tests.csproj
```

### 4. Run the web application
```bash
dotnet run --project src/PortfolioRebalancer.Api/PortfolioRebalancer.Api.csproj --urls "http://localhost:5200"
```
Open **[http://localhost:5200](http://localhost:5200)** in your browser.

---

## ðŸ¤ Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request (PR)**.

---

## ðŸ“„ License
Distributed under the MIT License.