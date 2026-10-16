# 📊 Intrinsic Fair Value & Margin of Safety Methodology

> **Reference Guide for Retail Investors & 9-to-5 Working Professionals**  
> *How Portfolio Rebalancer objectively calculates fair intrinsic worth and downside risk without emotional market bias.*

---

## 🎯 Executive Summary

In Indian equity markets, buying quality stocks is only half the battle—**paying the right price** determines whether you compound wealth or face prolonged drawdowns.

Our valuation engine computes the **Intrinsic Fair Value** and **Margin of Safety** using an institutional framework that unites:
1. **Peter Lynch's Growth-at-a-Reasonable-Price (GARP)** framework ($P/E \approx \text{Growth Rate}$).
2. **Benjamin Graham's Margin of Safety principle** ($\text{Discount to Intrinsic Value}$).
3. **Sector Relative Multiples** (to prevent paying dot-com style multiples for cyclical or asset-heavy businesses).

---

## 📐 1. The Mathematical Model & Formulas

### Step 1: Target Fair P/E Multiple ($PE_{\text{fair}}$)
A company's fair multiple is primarily driven by its sustainable compounded earnings growth rate ($\text{EPS Growth}$):

$$PE_{\text{fair}} = \text{Clamp}\Big(\text{EPS Growth}_{3\text{Yr}} \times 1.30,\; 14.0,\; PE_{\text{Sector Median}} \times 1.30\Big)$$

Where:
* **$\text{EPS Growth}_{3\text{Yr}}$**: The 3-year compounded annual growth rate (CAGR) of net profits.
* **$1.30\times$ Quality Premium**: High-quality Indian compounding leaders (clean balance sheets, high ROCE) are awarded up to a 30% premium above their pure growth rate.
* **$14.0\times$ Absolute Floor**: Anchors robust, cash-rich, low-growth dividend companies so they are not artificially undervalued.
* **$\text{Sector Median} \times 1.30$ Ceiling**: Hard risk-management cap. Prevents the model from justifying irrational bubble valuations when quarterly earnings temporarily spike.

---

### Step 2: Intrinsic Fair Value ($V_{\text{fair}}$)
Once the fair multiple is known, the share's intrinsic fair worth is calculated relative to its Current Market Price ($\text{CMP}$) and its current market $PE_{\text{stock}}$:

$$V_{\text{fair}} = \text{CMP} \times \left(\frac{PE_{\text{fair}}}{PE_{\text{stock}}}\right)$$

> **Mathematical Proof**:  
> Since $\text{CMP} = \text{EPS} \times PE_{\text{stock}}$, dividing by $PE_{\text{stock}}$ yields the company's real underlying $\text{EPS}$. Multiplying by $PE_{\text{fair}}$ gives:  
> $$V_{\text{fair}} = \text{EPS} \times PE_{\text{fair}}$$  
> This directly answers: *"What would this company be priced at if the market traded its actual profits at its fair growth multiple?"*

---

### Step 3: Margin of Safety Percentage
The Margin of Safety measures the percentage discount (positive) or premium (negative) of intrinsic value relative to CMP:

$$\text{Margin of Safety \%} = \left(\frac{V_{\text{fair}} - \text{CMP}}{\text{CMP}}\right) \times 100\%$$

---

## 🚦 2. Institutional Valuation Verdicts

| Margin of Safety | Status | Indicator | Actionable Rule for 9-to-5 Working Professionals |
| :---: | :---: | :---: | :--- |
| **$\ge +15.0\%$** | **Undervalued** | 🟢 **High Margin of Safety** | **Attractive Buy / Accumulate.** The market is giving you a generous cushion against future economic or earnings disappointments. Dips are compounding opportunities. |
| **$-10.0\%$ to $+15.0\%$** | **Fair Value** | 🟡 **Growth-Backed** | **Hold / Continue Systematic SIP.** The share price is moving in lockstep with corporate earnings growth. Suitable for long-term compounders. |
| **$< -10.0\%$** | **Overvalued** | 🔴 **Priced for Perfection** | **Exercise Caution / Stagger Exits.** Future growth for the next 2–3 years is already priced in. Vulnerable to sharp 15–25% multiple compressions on any quarterly earnings miss. |

---

## 🔍 3. Worked Real-World Examples

### Example A: Undervalued Growth Leader (High Margin of Safety)
* **Stock**: HDFC Bank Ltd (`HDFCBANK`)
* **CMP**: ₹1,650
* **Current Stock P/E**: $17.5\times$
* **3-Year EPS Growth**: $17.0\%$
* **Banking Sector Median P/E**: $18.2\times$

1. **Calculate Fair P/E**:  
   $$PE_{\text{fair}} = \text{Clamp}(17.0 \times 1.30,\; 14.0,\; 18.2 \times 1.30) = \text{Clamp}(22.1,\; 14.0,\; 23.66) = \mathbf{22.1\times}$$
2. **Calculate Intrinsic Fair Value**:  
   $$V_{\text{fair}} = ₹1,650 \times \left(\frac{22.1}{17.5}\right) = \mathbf{₹2,083.70}$$
3. **Margin of Safety**:  
   $$\text{Margin of Safety} = \left(\frac{₹2,083.70 - ₹1,650}{₹1,650}\right) \times 100\% = \mathbf{+26.3\%} \quad \text{(🟢 High Margin of Safety)}$$

---

### Example B: Expensive Momentum Stock (Negative Margin of Safety)
* **Stock**: Hypothetical Specialty Manufacturer
* **CMP**: ₹3,200
* **Current Stock P/E**: $68.0\times$
* **3-Year EPS Growth**: $22.0\%$
* **Capital Goods Sector Median P/E**: $42.0\times$

1. **Calculate Fair P/E**:  
   $$PE_{\text{fair}} = \text{Clamp}(22.0 \times 1.30,\; 14.0,\; 42.0 \times 1.30) = \text{Clamp}(28.6,\; 14.0,\; 54.6) = \mathbf{28.6\times}$$
2. **Calculate Intrinsic Fair Value**:  
   $$V_{\text{fair}} = ₹3,200 \times \left(\frac{28.6}{68.0}\right) = \mathbf{₹1,345.90}$$
3. **Margin of Safety**:  
   $$\text{Margin of Safety} = \left(\frac{₹1,345.90 - ₹3,200}{₹3,200}\right) \times 100\% = \mathbf{-57.9\%} \quad \text{(🔴 Priced for Perfection)}$$
   *Takeaway*: Even though profits grow at 22%, paying $68\times$ earnings leaves zero margin for error.

---

## 💻 4. Code Implementation in Solution

The complete calculation is implemented in C# inside:  
[`src/PortfolioRebalancer.Infrastructure/MarketData/IndianMarketScoringService.cs`](file:///D:/PortfolioRebalancer/src/PortfolioRebalancer.Infrastructure/MarketData/IndianMarketScoringService.cs#L361-L373)

```csharp
// 7. Calculate Fair Value & Margin of Safety
decimal cmp = stock.CurrentPrice.Amount;
decimal epsGrowth = profile.EpsGrowth3Yr > 0 ? profile.EpsGrowth3Yr : 15m;
decimal targetFairPe = Math.Clamp(epsGrowth * 1.30m, 14m, sectorInfo.MedianPE * 1.30m);
decimal fairValue = Math.Round(stockPe > 0 ? (cmp * (targetFairPe / stockPe)) : cmp, 2);
decimal marginOfSafety = cmp > 0 ? Math.Round(((fairValue - cmp) / cmp) * 100m, 1) : 0m;

string valuationBandVerdict = marginOfSafety switch
{
    >= 15.0m => "Attractive Buy / Undervalued (High Margin of Safety)",
    >= -10.0m => "Fairly Valued / Growth-Backed",
    _ => "Overvalued / Priced for Perfection (Wait for Dips or Trim)"
};
```

---

## 🛡️ Key Takeaway for Portfolio Rebalancing
When rebalancing, **Portfolio Rebalancer uses this Margin of Safety to steer capital**:
* We trim positions that have entered **Priced for Perfection** territory ($< -10\%$).
* We allocate fresh funds or rebalance capital into sectors and companies offering **High Margin of Safety** ($\ge +15\%$).
