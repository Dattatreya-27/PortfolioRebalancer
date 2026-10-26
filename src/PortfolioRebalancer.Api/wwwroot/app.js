// Generic Sample Holdings used ONLY if the database is 100% empty on initial run
const SAMPLE_HOLDINGS = [
  { Ticker: "RELIANCE", Name: "Reliance Industries", Sector: "Energy", Quantity: 50, AvgPrice: 1250.00 },
  { Ticker: "TCS", Name: "Tata Consultancy Services", Sector: "Technology", Quantity: 30, AvgPrice: 3800.00 },
  { Ticker: "HDFCBANK", Name: "HDFC Bank Ltd", Sector: "Financials", Quantity: 100, AvgPrice: 1650.00 }
];

async function seedSamplePortfolio() {
  const initRes = await fetch('/api/portfolios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Sample Equity Portfolio' })
  });
  if (!initRes.ok) return null;
  const newP = await initRes.json();

  const batchPayload = {
    holdings: SAMPLE_HOLDINGS.map(h => ({
      ticker: h.Ticker,
      quantity: h.Quantity,
      buyPrice: h.AvgPrice
    }))
  };

  await fetch(`/api/portfolios/${newP.id}/holdings/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batchPayload)
  });

  return newP.id;
}
// Indian Markets Portfolio Rebalancer & Advisory Engine Frontend Client
const SECTORS = [
  "Technology",
  "Healthcare",
  "Financials",
  "ConsumerDiscretionary",
  "ConsumerStaples",
  "Energy",
  "Industrials",
  "Materials",
  "Utilities",
  "RealEstate",
  "CommunicationServices"
];

const FINANCIAL_DICTIONARY = {
  PEG: {
    title: "PEG Ratio (Price/Earnings-to-Growth)",
    icon: "fa-scale-balanced text-teal-400",
    tag: "Growth-Adjusted Price Tag",
    analogy: "P/E ratio alone can trick you! A stock with a P/E of 45x looks expensive, but if its profits are growing at 50% year-on-year, you are actually getting a bargain! PEG connects what you pay with how fast profits are expanding.",
    rule: "LOW IS BETTER. A lower PEG means you pay less for every unit of future profit growth.",
    scale: [
      "< 1.0x: 🟢 Undervalued / Growth Bargain",
      "1.0x - 1.8x: 🟡 Fair Price / Growth-Backed",
      "> 2.0x: 🔴 Expensive / Priced for Perfection"
    ],
    takeaway: "For a working professional with a 9-5 job, stocks with PEG < 1.5 give you a wide margin of safety if quarterly earnings slow down."
  },
  PE_RATIO: {
    title: "P/E Ratio (Price-to-Earnings Multiple)",
    icon: "fa-tag text-cyan-400",
    tag: "Price Tag on Annual Profits",
    analogy: "Think of P/E as the price tag on a company's profits. A P/E of 25x means you pay ₹25 for every ₹1 of annual net profit the company earns.",
    rule: "LOWER IS GENERALLY CHEAPER, but compare with sector peers! Tech usually trades at 28x, whereas PSU banks trade at 10x-12x.",
    scale: [
      "Below Sector Median: 🟢 Cheaper multiple than peers",
      "Near Sector Median: 🟡 Fairly valued",
      "2x Above Sector Median: 🔴 High earnings expectations priced in"
    ],
    takeaway: "Never buy a stock just because it has a low P/E. Always check whether profits are growing and whether debt is safe."
  },
  ROCE: {
    title: "ROCE (Return on Capital Employed)",
    icon: "fa-chart-pie text-emerald-400",
    tag: "Management Capital Efficiency",
    analogy: "For every ₹100 of money invested in the business (equity + loans), how many rupees of operating profit does management generate each year?",
    rule: "HIGH IS BETTER. High ROCE proves that the company has a strong economic moat and generates immense cash without wasting capital.",
    scale: [
      "> 20%: 🟢 Elite Capital Allocator (TCS, Titan, BEL)",
      "15% - 20%: 🟡 Solid Healthy Business",
      "< 10%: 🔴 Poor Capital Efficiency (Destroys value)"
    ],
    takeaway: "If you work a 9-5 job, stick to companies with ROCE > 15%. They compound wealth automatically without requiring daily monitoring."
  },
  DEBT_EQUITY: {
    title: "Debt-to-Equity Ratio (D/E)",
    icon: "fa-hand-holding-dollar text-rose-400",
    tag: "Bankruptcy & Leverage Risk",
    analogy: "How much borrowed loan money the company uses compared to its own shareholders' equity. 0.0 means completely debt-free!",
    rule: "LOW IS BETTER (for non-financials). Zero or low debt means zero risk of bankruptcy during economic downturns.",
    scale: [
      "0.0 - 0.3: 🟢 Fortress Balance Sheet (Near-Zero Insolvency Risk)",
      "0.4 - 1.0: 🟡 Moderate Manageable Debt",
      "> 1.5: 🔴 Heavy Debt (Interest eats profits during bad quarters)"
    ],
    takeaway: "Debt-free companies let you sleep well at night. Even if market sentiment crashes 20%, they cannot go bust."
  },
  PROMOTER_PLEDGE: {
    title: "Promoter Pledge %",
    icon: "fa-user-lock text-teal-400",
    tag: "Skin in the Game & Loan Risk",
    analogy: "The percentage of company shares that founding promoters have mortgaged to banks to borrow money for personal or group ventures.",
    rule: "LOW IS BETTER. 0% is pristine. High pledge is a major warning because banks can forcibly dump mortgaged shares if the stock drops.",
    scale: [
      "0%: 🟢 Pristine (Founders haven't mortgaged their ownership)",
      "1% - 15%: 🟡 Watch closely",
      "> 20%: 🔴 High Risk (Forced margin liquidation danger)"
    ],
    takeaway: "Always prioritize 0% pledge companies. You don't want your stock cratering because a promoter defaulted on a personal bank loan."
  },
  FII_DII: {
    title: "Institutional Sponsorship (FII / DII Float)",
    icon: "fa-building-columns text-cyan-400",
    tag: "Smart Money Anchor",
    analogy: "Big institutional capital: Foreign Institutional Investors & Domestic Mutual Funds/LIC. When institutions hold a large stake, they provide stability.",
    rule: "HIGH IS BETTER. Institutional backing creates a liquidity floor under stock prices during retail panic selling.",
    scale: [
      "> 40%: 🟢 Institutional Core Anchor (Very high liquidity)",
      "20% - 40%: 🟡 Healthy Sponsorship",
      "< 10%: 🔴 Retail-Dominated (Prone to extreme operator swings)"
    ],
    takeaway: "Stocks owned heavily by Indian mutual funds benefit from steady monthly SIP inflows from millions of working citizens."
  },
  CRASH_DEFENSE: {
    title: "Sleep-Well Crash Defense Score",
    icon: "fa-shield-heart text-indigo-400",
    tag: "Bear Market Cushion",
    analogy: "Measures your portfolio's natural armor against market crashes based on debt-free companies, high ROCE profits, and bluechip liquidity.",
    rule: "HIGH IS BETTER. 80+ is Fortress Defense. It tells you whether you can comfortably ignore market crashes while at work.",
    scale: [
      "80 - 100: 🟢 Fortress Defense (Historically rebounds in 2-4 months)",
      "65 - 79: 🟡 Balanced Cushion (Historically rebounds in 4-6 months)",
      "< 60: 🔴 High Beta / Speculative (Long paper drawdown risk)"
    ],
    takeaway: "A high crash score means your companies produce real cash and have zero debt. Dips are buying opportunities, not panic signals."
  },
  FAIR_VALUE: {
    title: "Fair Value & Margin of Safety",
    icon: "fa-bullseye text-emerald-400",
    tag: "Intrinsic Worth vs Market Price",
    analogy: "What the company is genuinely worth based on its earnings growth rate and sector multiples, compared to its live market price (CMP).",
    rule: "BUYING AT A POSITIVE MARGIN OF SAFETY (>15% discount) protects your hard-earned capital.",
    scale: [
      "> +15% Discount: 🟢 Attractive Buy / High Margin of Safety",
      "-10% to +15%: 🟡 Fairly Priced with Growth",
      "< -10% Premium: 🔴 Overpriced / Priced for Perfection"
    ],
    takeaway: "Never chase stocks at a steep premium to fair value. Patiently wait for dips or consider higher-conviction peer alternatives."
  },
  STRESS_TEST: {
    title: "10% Market Correction Stress Test",
    icon: "fa-chart-line text-teal-400",
    tag: "Worst-Case Paper Dip in ₹",
    analogy: "Simulates what happens to your portfolio in rupees if the NIFTY 50 drops by 10% during an unexpected global shock.",
    rule: "LOWER LOSS IS BETTER. High-quality portfolios drop less than the index (low beta) and bounce back faster.",
    scale: [
      "Estimated Dip < 8%: 🟢 Superior Cushion vs NIFTY",
      "Estimated Dip 8% - 10%: 🟡 Matches Market Benchmark",
      "Estimated Dip > 12%: 🔴 High Beta / Aggressive Small-Cap Tilt"
    ],
    takeaway: "Paper dips during corrections are normal. High-ROCE, debt-free leaders historically rebound to new all-time highs within 3-6 months."
  },
  HHI: {
    title: "HHI Diversification Score",
    icon: "fa-pie-chart text-purple-400",
    tag: "Concentration vs Diversification",
    analogy: "Herfindahl-Hirschman Index: Measures whether your wealth is spread evenly or dangerously concentrated in just 1-2 stocks.",
    rule: "LOW IS BETTER. A lower score means you won't suffer a catastrophic loss if one individual company faces bad news.",
    scale: [
      "< 1,000: 🟢 Well Diversified",
      "1,000 - 1,800: 🟡 Moderate Concentration",
      "> 1,800: 🔴 Too Concentrated in Few Stocks"
    ],
    takeaway: "Ensure no single stock exceeds 10% of your portfolio so single-stock surprises don't derail your retirement plan."
  }
};

function openFinancialExplainer(metricKey) {
  const item = FINANCIAL_DICTIONARY[metricKey];
  if (!item) return;

  const modal = document.getElementById("financialExplainerModal");
  if (!modal) return;

  document.getElementById("explainerTitle").textContent = item.title;
  document.getElementById("explainerTag").textContent = item.tag;
  document.getElementById("explainerIcon").className = `fa-solid ${item.icon}`;
  document.getElementById("explainerAnalogy").textContent = item.analogy;
  document.getElementById("explainerRule").textContent = item.rule;

  const scaleContainer = document.getElementById("explainerScale");
  scaleContainer.innerHTML = item.scale.map(s => `<div class="py-0.5">${s}</div>`).join("");

  document.getElementById("explainerTakeaway").textContent = item.takeaway;

  modal.classList.remove("hidden");
}

function closeFinancialExplainer() {
  const modal = document.getElementById("financialExplainerModal");
  if (modal) modal.classList.add("hidden");
}

let currentPortfolioId = null;
let currentPortfolioData = null;
let isPrivacyMode = localStorage.getItem("portfolio_privacy_mode") === "true";
let loadedPortfoliosList = [];

function applyPrivacyModeUI() {
  document.body.classList.toggle("privacy-mode", isPrivacyMode);

  const icon = document.getElementById("privacyEyeIcon");
  const btn = document.getElementById("btnTogglePrivacy");
  const text = document.getElementById("privacyBtnText");

  if (icon && btn && text) {
    if (isPrivacyMode) {
      icon.className = "fa-solid fa-eye-slash text-rose-400";
      btn.className = "text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition font-semibold shadow-sm";
      text.textContent = "Privacy: ON";
      btn.title = "Privacy Mode is ON (Financial numbers blurred for safe screenshots). Click to reveal.";
    } else {
      icon.className = "fa-solid fa-eye text-teal-400";
      btn.className = "text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition font-medium shadow-sm";
      text.textContent = "Privacy Mode";
      btn.title = "Click to blur financial values and position sizes for safe screenshots.";
    }
  }

  const pnlBadge = document.getElementById("statPnLBadge");
  if (pnlBadge) {
    if (isPrivacyMode) {
      pnlBadge.textContent = "••••••";
      pnlBadge.className = "text-[10px] font-bold px-1.5 py-0.5 rounded privacy-mask bg-slate-800 text-slate-400 border border-slate-700/60";
    } else if (currentPortfolioData) {
      const isProfit = (currentPortfolioData.totalUnrealizedPnL || 0) >= 0;
      pnlBadge.textContent = isProfit ? "NET GAIN" : "NET LOSS";
      pnlBadge.className = `text-[10px] font-bold px-1.5 py-0.5 rounded privacy-mask ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`;
    }
  }

  renderPortfolioSelectOptions();
}

function handleTogglePrivacy() {
  isPrivacyMode = !isPrivacyMode;
  localStorage.setItem("portfolio_privacy_mode", isPrivacyMode ? "true" : "false");
  applyPrivacyModeUI();
}

// ========================================================
// 9-5 WORK HOURS FOCUS SHIELD & CAREER-WEALTH HARMONY
// Behavioral Psychology System for Corporate Professionals
// ========================================================
let isWorkShieldActive = false;

function isIndianMarketHours() {
  const now = new Date();
  // Convert UTC to IST (+5:30)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const day = istDate.getDay(); // 0 is Sunday, 6 is Saturday
  if (day === 0 || day === 6) return false;

  const hour = istDate.getHours();
  const minute = istDate.getMinutes();
  const timeInMins = hour * 60 + minute;
  // 9:15 AM = 555 mins, 3:30 PM = 930 mins
  return timeInMins >= 555 && timeInMins <= 930;
}

function updateWorkShieldUI() {
  const banner = document.getElementById("workHoursShieldBanner");
  const icon = document.getElementById("workShieldIcon");
  const btn = document.getElementById("btnToggleWorkShield");
  const text = document.getElementById("workShieldBtnText");
  const dot = document.getElementById("workShieldStatusDot");

  const inMarketHours = isIndianMarketHours();

  if (icon && btn && text && dot) {
    if (isWorkShieldActive) {
      icon.className = "fa-solid fa-briefcase text-cyan-300";
      btn.className = "text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition font-semibold shadow-sm";
      text.textContent = "Work Shield: ON";
      dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1";
      btn.title = "9-5 Work Focus Shield is ACTIVE (Intraday volatility filtered). Click to toggle.";
    } else {
      icon.className = "fa-solid fa-briefcase text-slate-400";
      btn.className = "text-xs bg-[#0a1222] hover:bg-[#0f1b32] themed-card text-slate-300 hover:text-white border border-[#16233d] px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition font-medium shadow-sm";
      text.textContent = "Work Shield";
      dot.className = "w-2 h-2 rounded-full bg-slate-500 ml-1";
      btn.title = "Click to activate 9-5 Work Focus Shield (Filters market anxiety during corporate hours).";
    }
  }

  if (banner) {
    if (isWorkShieldActive) {
      banner.classList.remove("hidden");
      const statusBadge = document.getElementById("shieldStatusBadge");
      const heading = document.getElementById("shieldHeading");
      const subheading = document.getElementById("shieldSubheading");
      const actionPill = document.getElementById("shieldActionPill");
      const actionDetail = document.getElementById("shieldActionDetail");
      const nextCheckin = document.getElementById("shieldNextCheckin");

      if (inMarketHours) {
        if (heading) heading.textContent = "9-5 Work Hours Focus Shield Active";
        if (statusBadge) {
          statusBadge.textContent = "Market Hours (09:15 - 15:30 IST)";
          statusBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
        }
        if (subheading) subheading.textContent = "Emotional anxiety filter active. Intraday price flashing suppressed to safeguard your deep work and corporate career focus.";
        if (actionPill) actionPill.textContent = "0 ACTIONS NEEDED";
        if (actionDetail) actionDetail.textContent = "No trades or rebalancing required today. Your portfolio is built with high-ROCE compounding businesses that generate cashflow regardless of intraday screen blips.";
        if (nextCheckin) nextCheckin.textContent = "Post 3:30 PM IST (Evening Calm)";
      } else {
        if (heading) heading.textContent = "🌙 Evening Calm Asynchronous Review";
        if (statusBadge) {
          statusBadge.textContent = "Market Closed (Trading Settled)";
          statusBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30";
        }
        if (subheading) subheading.textContent = "Market is closed for the day. All positions settled. No volatility can reach your capital until tomorrow 09:15 AM.";
        if (actionPill) actionPill.textContent = "REST & RELAX";
        if (actionDetail) actionDetail.textContent = "Your equities are resting quietly. Do not over-analyze post-market noise. Spend quality evening time with family or career pursuits.";
        if (nextCheckin) nextCheckin.textContent = "Tomorrow 09:15 AM IST";
      }

      updateSalaryCushion();
    } else {
      banner.classList.add("hidden");
    }
  }
}

function updateSalaryCushion() {
  if (!currentPortfolioData) return;
  const totalVal = currentPortfolioData.totalValue || 0;
  const dayPnl = currentPortfolioData.totalDayPnL || 0;

  // Monthly savings baseline: ~4% of portfolio or ₹40,000 min
  const monthlySavings = Math.max(40000, Math.round(totalVal * 0.04));
  const multEl = document.getElementById("salaryCushionMultiplier");
  const textEl = document.getElementById("salaryCushionText");

  if (dayPnl < 0) {
    const absLoss = Math.abs(dayPnl);
    const multiplier = (monthlySavings / Math.max(1, absLoss)).toFixed(1);
    if (multEl) multEl.textContent = `${multiplier}x Coverage`;
    if (textEl) {
      textEl.textContent = `Your ongoing corporate salary savings (${formatINR(monthlySavings)}/mo) cushion today's market dip by ${multiplier}x. Intraday pullbacks simply allow your salary to acquire shares at a structural discount.`;
    }
  } else {
    if (multEl) multEl.textContent = "High Runway";
    if (textEl) {
      textEl.textContent = `Your corporate career generates continuous fresh cash flow. Combined with today's positive compounding (+${formatINR(dayPnl)}), your wealth runway is expanding seamlessly.`;
    }
  }
}

function toggleWorkShield(forceState = null) {
  isWorkShieldActive = forceState !== null ? forceState : !isWorkShieldActive;
  localStorage.setItem("work_shield_active", isWorkShieldActive ? "true" : "false");
  updateWorkShieldUI();
  renderHoldingsTable();
  if (isWorkShieldActive) {
    showToast("💼 9-5 Work Hours Focus Shield ACTIVATED. Intraday anxiety filtered.");
  } else {
    showToast("Work Shield deactivated. Normal screen active.");
  }
}

function renderPortfolioSelectOptions() {
  const select = document.getElementById("portfolioSelect");
  if (!select) return;
  select.innerHTML = "";
  const filtered = loadedPortfoliosList.filter(p => !p.name || !p.name.includes("Test Portfolio"));
  const toRender = filtered.length > 0 ? filtered : loadedPortfoliosList;
  toRender.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    const valText = isPrivacyMode ? "\u20B9••••••" : formatINR(p.totalValue);
    opt.textContent = `${p.name} (${valText})`;
    select.appendChild(opt);
  });
  if (currentPortfolioId) {
    select.value = currentPortfolioId;
  }
}

// Advisory Target Overrides for leading convictions
const ADVISORY_TARGETS = {
  "KPITTECH": { t1: 680, t2: 740, rationale: "EV Software Tailwinds" },
  "RELIANCE": { t1: 1350, t2: 1480, rationale: "Telecom & Retail Spinoff" },
  "TCS": { t1: 2600, t2: 2850, rationale: "BFSI AI Deal Renewals" },
  "INFY": { t1: 1250, t2: 1380, rationale: "Cloud Modernization Acceleration" },
  "HDFCBANK": { t1: 1100, t2: 1250, rationale: "LDR Normalization Post-Merger" },
  "ICICIBANK": { t1: 1450, t2: 1600, rationale: "Superior NIM & Asset Quality" },
  "IRFC": { t1: 120, t2: 145, rationale: "National Rail Capex Outlay" },
  "SUZLON": { t1: 72, t2: 85, rationale: "32GW Wind Capacity Tender Pipeline" },
  "CONCOR": { t1: 620, t2: 690, rationale: "Dedicated Freight Corridor Integration" },
  "TATACHEM": { t1: 820, t2: 910, rationale: "Soda Ash Cycle Rebound" },
  "TRENT": { t1: 3800, t2: 4200, rationale: "Zudio Aggressive Tier-2 Expansion" },
  "INOXWIND": { t1: 105, t2: 125, rationale: "Turnaround & Order Book Execution" },
  "POWERGRID": { t1: 340, t2: 380, rationale: "Inter-State Transmission Corridor Capex" },
  "TMPV": { t1: 340, t2: 380, rationale: "EV Passenger Vehicle Margin Expansion" },
  "TATAMOTORS": { t1: 340, t2: 380, rationale: "Commercial Vehicles & EV Leadership" },
  "M&M": { t1: 3200, t2: 3450, rationale: "SUV Market Share Dominance & Farm Capex" },
  "BEL": { t1: 440, t2: 480, rationale: "Indigenous Defense Electronics Order Book" },
  "BSE": { t1: 3800, t2: 4200, rationale: "Derivatives Market Share Expansion" },
  "BAJFINANCE": { t1: 1150, t2: 1280, rationale: "Omnichannel Lending & NIM Stability" }
};

function getAdvisoryTarget(h) {
  if (ADVISORY_TARGETS[h.ticker]) return ADVISORY_TARGETS[h.ticker];
  const cmp = h.price > 0 ? h.price : (h.buyPrice > 0 ? h.buyPrice : 100);
  const isGrowth = h.sector === "Technology" || h.sector === "Financials" || h.sector === "Industrials";
  const t1 = Math.round(cmp * (isGrowth ? 1.18 : 1.12) * 10) / 10;
  return {
    t1: t1,
    t2: Math.round(cmp * (isGrowth ? 1.30 : 1.22) * 10) / 10,
    rationale: `${h.sector} Cyclical Trend Target`
  };
}

// Search, Filter & Sorting State (NO PAGINATION: Continuous Scrollable View)
let currentDiagnostics = null;
let currentAuditMap = new Map();

function updateAuditMap(diag) {
  currentAuditMap.clear();
  if (diag && diag.thesisAudit) {
    diag.thesisAudit.forEach(a => {
      if (a && a.ticker) currentAuditMap.set(a.ticker, a);
    });
  }
}

let activeDiagnosticFilter = null; // { type: string, label: string, tickers: string[] }
let searchQuery = "";
let sectorFilter = "";
let marketCapFilter = "";
let cachedSectorSlices = [];
let cachedMcapSlices = [];
let pnlFilter = "ALL";
let sortColumn = "marketValue";
let sortAscending = false;

// Currency Formatter in Indian Locale (en-IN)
function formatINR(val) {
  if (val === undefined || val === null || isNaN(val)) return "\u20B90.00";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
}

// Format Market Cap in Indian Crores (1 Cr = 10 Million)
function formatMarketCapCrores(marketCap) {
  if (!marketCap) return 'N/A';
  const crores = marketCap / 10000000;
  return `\u20B9${crores.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
}

// Global HTML Escaper
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

// ==========================================
// SPA Client-Side View Router (Hash-Based)
// ==========================================
const APP_VIEWS = ['portfolio', 'manage', 'discover', 'theories'];
let activeView = 'portfolio';

function navigateTo(viewName, updateHash = true) {
  if (!APP_VIEWS.includes(viewName)) {
    viewName = 'portfolio';
  }
  activeView = viewName;

  // 1. Hide all view panels and display the active view
  document.querySelectorAll('.view-panel').forEach(panel => {
    panel.classList.add('hidden');
  });

  const targetId = 'view' + viewName.charAt(0).toUpperCase() + viewName.slice(1);
  const targetPanel = document.getElementById(targetId);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
  }

  // 2. Update active styles on navbar tabs
  const tabs = [
    { id: 'navTabPortfolio', view: 'portfolio' },
    { id: 'navTabManage', view: 'manage' },
    { id: 'navTabDiscover', view: 'discover' },
    { id: 'navTabTheories', view: 'theories' }
  ];

  tabs.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) return;
    if (t.view === viewName) {
      el.className = 'nav-tab px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm';
    } else {
      el.className = 'nav-tab px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition text-slate-400 hover:text-slate-200 hover:bg-[#0f1b32]/60 border border-transparent';
    }
  });

  // 3. Synchronize window hash smoothly without full-page re-trigger
  if (updateHash && window.location.hash !== `#/${viewName}`) {
    history.replaceState(null, '', `#/${viewName}`);
  }

  // 4. View lifecycle triggers
  if (viewName === 'manage') {
    updateTargetSumBadge();
  } else if (viewName === 'discover') {
    const stratContainer = document.getElementById("quantStrategiesContainer");
    if (currentPortfolioId && (!stratContainer || stratContainer.children.length === 0)) {
      loadResearchReport(currentPortfolioId);
    }
    loadSwingRadarFeed();
  } else if (viewName === 'theories') {
    loadTheoryPortfolios();
    loadPortfolioTheoryAudit();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initRouter() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (APP_VIEWS.includes(hash)) {
      navigateTo(hash, false);
    } else {
      navigateTo('portfolio', false);
    }
  });

  const initialHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (APP_VIEWS.includes(initialHash)) {
    navigateTo(initialHash, false);
  } else {
    navigateTo('portfolio', true);
  }
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  setupStockSearchAutocomplete();

  initThemeFromStorage();
  applyPrivacyModeUI();
  updateWorkShieldUI();
  initRouter();
  renderSectorTargetInputs();
  setupEventListeners();

  // Restore saved Excel password if present
  const savedPwd = localStorage.getItem("angel_excel_password") || "";
  if (savedPwd) {
    const p1 = document.getElementById("angelExcelPassword");
    const p2 = document.getElementById("manageExcelPassword");
    if (p1) p1.value = savedPwd;
    if (p2) p2.value = savedPwd;
  }

  await loadPortfolios();
});


function setupEventListeners() {
  document.getElementById("btnTogglePrivacy")?.addEventListener("click", handleTogglePrivacy);
  document.getElementById("btnToggleWorkShield")?.addEventListener("click", () => toggleWorkShield());
  document.getElementById("btnCreatePortfolio")?.addEventListener("click", handleCreatePortfolio);
  document.getElementById("portfolioSelect")?.addEventListener("change", (e) => {
    if (e.target.value) selectPortfolio(e.target.value);
  });
  document.getElementById("btnAddHolding")?.addEventListener("click", handleAddHolding);
  document.getElementById("btnRunRebalance")?.addEventListener("click", handleRunRebalance);
  document.getElementById("btnInspectStock")?.addEventListener("click", handleInspectStock);
  document.getElementById("inspectorTicker")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInspectStock();
    }
  });

  document.getElementById("btnToggleAddHolding")?.addEventListener("click", () => {
    const p = document.getElementById("addPositionPanel");
    p.classList.toggle("hidden");
  });

  document.getElementById("btnSyncLiveQuotes")?.addEventListener("click", handleSyncLiveQuotes);
  document.getElementById("btnFilterTailHoldings")?.addEventListener("click", filterTailHoldings);
  document.getElementById("btnFilterGainers")?.addEventListener("click", filterGainers);
  document.getElementById("btnFilterDrawdowns")?.addEventListener("click", filterDeepLosers);

  document.getElementById("btnRefreshDiagnostics")?.addEventListener("click", () => {
    navigateTo('portfolio');
    if (currentPortfolioId) loadDiagnostics(currentPortfolioId);
  });
  document.getElementById("btnOpenResearch")?.addEventListener("click", () => {
    navigateTo('discover');
    if (currentPortfolioId) loadResearchReport(currentPortfolioId);
  });
  document.getElementById("btnCloseResearch")?.addEventListener("click", () => {
    document.getElementById("researchReportSection").classList.add("hidden");
  });
  document.getElementById("btnCloseRecommendations")?.addEventListener("click", () => {
    document.getElementById("rebalanceResultSection").classList.add("hidden");
  });

  // Search & Filter Controls (Debounced 120ms to prevent DOM layout thrashing)
  let searchDebounceTimer = null;
  document.getElementById("holdingsSearch")?.addEventListener("input", (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderHoldingsTable();
    }, 120);
  });

  document.getElementById("holdingsSectorFilter")?.addEventListener("change", (e) => {
    sectorFilter = e.target.value;
    renderHoldingsTable();
  });

  document.getElementById("holdingsPnLFilter")?.addEventListener("change", (e) => {
    pnlFilter = e.target.value;
    renderHoldingsTable();
  });
}

const SECTOR_ICONS = {
  "Technology": "fa-laptop-code text-cyan-400",
  "Healthcare": "fa-heart-pulse text-rose-400",
  "Financials": "fa-building-columns text-emerald-400",
  "ConsumerDiscretionary": "fa-bag-shopping text-teal-400",
  "ConsumerStaples": "fa-basket-shopping text-emerald-300",
  "Energy": "fa-bolt text-yellow-400",
  "Industrials": "fa-industry text-orange-400",
  "Materials": "fa-cubes-stacked text-purple-400",
  "Utilities": "fa-plug-circle-bolt text-blue-400",
  "RealEstate": "fa-city text-teal-400",
  "CommunicationServices": "fa-tower-broadcast text-indigo-400"
};

function renderSectorTargetInputs() {
  const container = document.getElementById("sectorTargetsContainer");
  if (!container) return;
  container.innerHTML = "";

  SECTORS.forEach(sec => {
    const iconClass = SECTOR_ICONS[sec] || "fa-chart-pie text-slate-400";
    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-slate-950/70 hover:bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/80 transition";
    row.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fa-solid ${iconClass} text-xs w-4 text-center"></i>
        <span class="text-xs text-slate-300 font-medium">${sec}</span>
      </div>
      <div class="flex items-center space-x-1.5">
        <input type="number" min="0" max="100" step="0.5" value="0" data-sector="${sec}"
          class="sector-weight-input w-16 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 text-xs text-right text-teal-400 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500" />
        <span class="text-xs text-slate-500 font-mono">%</span>
      </div>
    `;
    container.appendChild(row);
  });

  container.querySelectorAll(".sector-weight-input").forEach(inp => {
    inp.addEventListener("input", updateTargetSumBadge);
  });
}

function updateTargetSumBadge() {
  const inputs = document.querySelectorAll(".sector-weight-input");
  let sum = 0;
  inputs.forEach(i => sum += parseFloat(i.value) || 0);

  const badge = document.getElementById("targetSumBadge");
  if (!badge) return;
  badge.textContent = `Total: ${sum.toFixed(1)}%`;

  if (Math.abs(sum - 100) < 0.01) {
    badge.className = "text-xs font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20";
  } else {
    badge.className = "text-xs font-mono font-bold px-3 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30";
  }
}

function applySectorPreset(type) {
  const inputs = document.querySelectorAll(".sector-weight-input");
  if (!inputs || inputs.length === 0) return;

  const presets = {
    'EQUAL': {
      "Technology": 9.1, "Healthcare": 9.1, "Financials": 9.1, "ConsumerDiscretionary": 9.1,
      "ConsumerStaples": 9.1, "Energy": 9.1, "Industrials": 9.1, "Materials": 9.1,
      "Utilities": 9.1, "RealEstate": 9.1, "CommunicationServices": 9.0
    },
    'GROWTH': {
      "Technology": 25.0, "Financials": 25.0, "Industrials": 20.0, "ConsumerDiscretionary": 15.0,
      "Healthcare": 15.0, "ConsumerStaples": 0, "Energy": 0, "Materials": 0,
      "Utilities": 0, "RealEstate": 0, "CommunicationServices": 0
    },
    'DEFENSIVE': {
      "ConsumerStaples": 25.0, "Healthcare": 25.0, "Utilities": 20.0, "Energy": 15.0,
      "Financials": 15.0, "Technology": 0, "Industrials": 0, "ConsumerDiscretionary": 0,
      "Materials": 0, "RealEstate": 0, "CommunicationServices": 0
    },
    'RESET': {}
  };

  const selected = presets[type] || {};
  inputs.forEach(inp => {
    const sec = inp.getAttribute("data-sector");
    inp.value = selected[sec] !== undefined ? selected[sec] : 0;
  });

  updateTargetSumBadge();
}

function quickInspectTicker(ticker) {
  const inp = document.getElementById("inspectorTicker");
  if (inp) {
    inp.value = ticker;
    handleInspectStock();
    inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function loadPortfolios() {
  try {
    const res = await fetch("/api/portfolios");
    const portfolios = await res.json();
    loadedPortfoliosList = portfolios || [];
    renderPortfolioSelectOptions();

    if (!portfolios || portfolios.length === 0) {
      const pid = await seedSamplePortfolio();
      if (pid) {
        currentPortfolioId = pid;
      }
      return loadPortfolios();
    }

    const savedId = localStorage.getItem("active_portfolio_id");
    let target = null;

    if (savedId && portfolios.some(p => p.id === savedId)) {
      target = portfolios.find(p => p.id === savedId);
    } else if (currentPortfolioId && portfolios.some(p => p.id === currentPortfolioId)) {
      target = portfolios.find(p => p.id === currentPortfolioId);
    } else {
      // Prioritize "Dattatreya Portfolio" or any non-empty portfolio over an empty one
      target = portfolios.find(p => p.name === "Dattatreya Portfolio")
        || portfolios.find(p => (p.holdings && p.holdings.length > 0) || (p.totalValue && p.totalValue > 0))
        || portfolios[0];
    }

    const targetId = target ? target.id : portfolios[0].id;
    await selectPortfolio(targetId);
  } catch (err) {
    console.error("Failed to load portfolios:", err);
  }
}

async function selectPortfolio(id) {
  if (!id) return;
  currentPortfolioId = id;
  localStorage.setItem("active_portfolio_id", id);
  const sel = document.getElementById("portfolioSelect");
  if (sel) sel.value = id;

  const tbody = document.getElementById("holdingsTableBody");
  if (tbody && (!currentPortfolioData || currentPortfolioData.id !== id)) {
    tbody.innerHTML = `<tr><td colspan="12" class="py-12 text-center text-slate-400 font-medium"><i class="fa-solid fa-circle-notch fa-spin text-teal-400 mr-2"></i>Loading portfolio holdings and real-time market data...</td></tr>`;
  }

  try {
    // High-Speed Concurrent Fetch: Portfolio details + Diagnostics loaded simultaneously
    const [pRes, dRes] = await Promise.all([
      fetch(`/api/portfolios/${id}`),
      fetch(`/api/portfolios/${id}/diagnostics`).catch(() => null)
    ]);

    if (!pRes.ok) {
      console.error(`Failed to fetch portfolio ${id}: ${pRes.status}`);
      if (tbody) tbody.innerHTML = `<tr><td colspan="12" class="py-12 text-center text-rose-400 font-medium">Failed to load portfolio. Please try selecting another portfolio or refreshing the page.</td></tr>`;
      return;
    }

    currentPortfolioData = await pRes.json();
    normalizePortfolioData(currentPortfolioData);

    if (dRes && dRes.ok) {
      const diag = await dRes.json();
      currentDiagnostics = diag;
      updateAuditMap(diag);
      renderDiagnosticsUI(diag);
    } else {
      currentDiagnostics = null;
      updateAuditMap(null);
    }

    // Unified single-pass render: allocations and holdings render once with thesis audit ready
    renderPortfolioDetails(currentPortfolioData);
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="12" class="py-12 text-center text-rose-400 font-medium">An error occurred while loading portfolio data.</td></tr>`;
  }
}

// Unified Diagnostics UI renderer defined below at renderDiagnosticsUI

// Normalizes any zero or missing values so nothing is ever shown as 0
function normalizePortfolioData(data) {
  if (!data || !data.holdings) return;

  let computedInvested = 0;
  let computedMarketVal = 0;

  data.holdings.forEach(h => {
    // 1. Recover buy price from Excel seed if missing or 0
    if (!h.buyPrice || h.buyPrice <= 0) {
      h.buyPrice = h.buyPrice || h.price || 100;
    }

    // 2. Fallback price if 0
    if (!h.price || h.price <= 0) {
      h.price = h.buyPrice;
    }

    // 3. Compute invested and market values
    h.investedValue = Math.round((h.buyPrice * h.quantity) * 100) / 100;
    h.marketValue = Math.round((h.price * h.quantity) * 100) / 100;

    // 4. Compute Unrealized PnL
    h.unrealizedPnL = Math.round((h.marketValue - h.investedValue) * 100) / 100;
    h.unrealizedPnLPercent = h.investedValue > 0
      ? Math.round(((h.marketValue - h.investedValue) / h.investedValue * 100) * 100) / 100
      : 0;

    computedInvested += h.investedValue;
    computedMarketVal += h.marketValue;
  });

  data.totalInvested = Math.round(computedInvested * 100) / 100;
  data.totalValue = Math.round(computedMarketVal * 100) / 100;
  data.totalUnrealizedPnL = Math.round((data.totalValue - data.totalInvested) * 100) / 100;
  data.totalUnrealizedPnLPercent = data.totalInvested > 0
    ? Math.round(((data.totalValue - data.totalInvested) / data.totalInvested * 100) * 100) / 100
    : 0;

  // Recalculate weights based on normalized market value
  if (data.totalValue > 0) {
    data.holdings.forEach(h => {
      h.weightPercent = Math.round((h.marketValue / data.totalValue * 100) * 100) / 100;
    });
  }
}

function renderPortfolioDetails(data) {
  document.getElementById("statTotalValue").textContent = formatINR(data.totalValue);
  document.getElementById("statTotalInvested").textContent = formatINR(data.totalInvested);
  document.getElementById("statHoldingsCount").textContent = data.holdings.length;
  const navCount = document.getElementById("navPortfolioCountBadge");
  if (navCount && data.holdings) {
    navCount.textContent = data.holdings.length;
  }

  // Day's P&L Display
  const dayPnlElem = document.getElementById("statDayPnL");
  const dayPnlBadge = document.getElementById("statDayPnLBadge");
  const dayVal = data.totalDayPnL || 0;
  const dayPct = data.totalDayPnLPercent || 0;
  const isDayProfit = dayVal >= 0;

  // Indian Theory Alignment summary banner
  const theoryAlignEl = document.getElementById("theoryAlignmentSummaryText");
  if (theoryAlignEl && data.holdings) {
    const totalCount = data.holdings.length;
    const highQuality = data.holdings.filter(h => (h.qualityScore || 0) >= 70 || (h.unrealizedPnLPercent || 0) >= 8).length;
    const highPct = totalCount > 0 ? Math.round((highQuality / totalCount) * 100) : 0;
    theoryAlignEl.innerHTML = `Your portfolio holds <strong>${highQuality} of ${totalCount} stocks (${highPct}%)</strong> aligned with <span class="text-emerald-300 font-semibold">Coffee Can</span> &amp; <span class="text-cyan-300 font-semibold">Motilal QGLP</span> Indian compounding criteria. Click to simulate swaps or explore the 3 theories.`;
  }

  if (dayPnlElem) {
    dayPnlElem.textContent = `${isDayProfit ? '+' : ''}${formatINR(dayVal)} (${isDayProfit ? '+' : ''}${dayPct.toFixed(2)}%)`;
    dayPnlElem.className = `text-2xl font-bold mt-1 privacy-mask ${isDayProfit ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (dayPnlBadge) {
    if (isPrivacyMode) {
      dayPnlBadge.textContent = "••••••";
      dayPnlBadge.className = "text-[10px] font-bold px-1.5 py-0.5 rounded privacy-mask bg-slate-800 text-slate-400 border border-slate-700/60";
    } else if (isWorkShieldActive) {
      dayPnlBadge.textContent = isDayProfit ? "+COMPOUNDING" : "-NOISE";
      dayPnlBadge.className = `text-[10px] font-bold px-1.5 py-0.5 rounded privacy-mask ${isDayProfit ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'}`;
    } else {
      dayPnlBadge.textContent = isDayProfit ? "+TODAY" : "-TODAY";
      dayPnlBadge.className = `text-[10px] font-bold px-1.5 py-0.5 rounded privacy-mask ${isDayProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`;
    }
  }

  updateSalaryCushion();

  // Unrealized P&L Display
  const pnlElem = document.getElementById("statTotalPnL");
  const pnlBadge = document.getElementById("statPnLBadge");
  const pnlVal = data.totalUnrealizedPnL || 0;
  const pnlPct = data.totalUnrealizedPnLPercent || 0;
  const isProfit = pnlVal >= 0;

  if (pnlElem) {
    pnlElem.textContent = `${isProfit ? '+' : ''}${formatINR(pnlVal)} (${isProfit ? '+' : ''}${pnlPct.toFixed(2)}%)`;
    pnlElem.className = `text-2xl font-bold mt-1 privacy-mask ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (pnlBadge) {
    if (isPrivacyMode) {
      pnlBadge.textContent = "••••••";
      pnlBadge.className = "text-[10px] font-bold px-1.5 py-0.5 rounded privacy-mask bg-slate-800 text-slate-400 border border-slate-700/60";
    } else {
      pnlBadge.textContent = isProfit ? "NET GAIN" : "NET LOSS";
      pnlBadge.className = `text-[10px] font-bold px-1.5 py-0.5 rounded privacy-mask ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`;
    }
  }

  // Populate Sector Filter Dropdown
  const secFilter = document.getElementById("holdingsSectorFilter");
  if (secFilter && secFilter.options.length <= 1) {
    const sectors = [...new Set(data.holdings.map(h => h.sector))].sort();
    sectors.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      secFilter.appendChild(opt);
    });
  }

  data.sectorWeights.forEach(sw => {
    const inp = document.querySelector(`.sector-weight-input[data-sector="${sw.sector}"]`);
    if (inp && sw.targetWeight !== null && sw.targetWeight !== undefined) {
      inp.value = sw.targetWeight;
    }
  });
  updateTargetSumBadge();

  // 8-Hour Freshness & Auto-Sync Check
  const lastSyncElem = document.getElementById("lastSyncTime");
  const staleBanner = document.getElementById("staleSyncAlertBanner");
  const staleDetail = document.getElementById("staleSyncAlertDetail");

  if (data.lastSyncedAt) {
    const syncDate = new Date(data.lastSyncedAt);
    const diffMs = Date.now() - syncDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let timeAgoText = "";
    if (diffHours < 1) {
      const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      timeAgoText = `${mins}m ago`;
    } else if (diffHours < 24) {
      timeAgoText = `${Math.round(diffHours)}h ago`;
    } else {
      timeAgoText = `${Math.round(diffHours / 24)}d ago`;
    }

    if (lastSyncElem) {
      lastSyncElem.textContent = `Synced: ${timeAgoText}`;
    }

    if (diffHours >= 8) {
      if (staleBanner) staleBanner.classList.remove("hidden");
      if (staleDetail) staleDetail.textContent = `Last synced ${timeAgoText} (${syncDate.toLocaleTimeString()}). Review any broker trades or sync with Angel One.`;
      checkAndTrigger8HourAutoSync();
    } else {
      if (staleBanner) staleBanner.classList.add("hidden");
    }
  } else {
    if (lastSyncElem) lastSyncElem.textContent = "Prices live";
    if (staleBanner) staleBanner.classList.remove("hidden");
  }

  renderPortfolioAllocationCharts(data, currentDiagnostics);
  renderHoldingsTable();
}

// ========================================================
// PORTFOLIO ALLOCATION RADAR: DUAL INTERACTIVE PIE CHARTS
// 1. Sector Allocation (% & ₹)
// 2. Market Cap Allocation (Large / Mid / Small / Micro)
// ========================================================

const SECTOR_PALETTE = {
  "Financials": "#38bdf8",     // Sky Blue
  "Technology": "#818cf8",     // Indigo
  "Energy": "#f59e0b",         // Amber
  "Materials": "#10b981",      // Emerald
  "Healthcare": "#ec4899",     // Pink
  "Consumer": "#a855f7",       // Purple
  "Industrials": "#f97316",    // Orange
  "Automobile": "#06b6d4",     // Cyan
  "Utilities": "#14b8a6",      // Teal
  "Real Estate": "#eab308",    // Yellow
  "Telecom": "#f43f5e",        // Rose
  "Default": "#64748b"         // Slate
};

const MCAP_PALETTE = {
  "Large Cap": "#10b981",      // Emerald - Stability Anchor
  "Mid Cap": "#38bdf8",        // Sky - Growth Engine
  "Small Cap": "#f59e0b",      // Amber - Alpha Surge
  "Micro Cap": "#f43f5e"       // Rose - High Beta / Micro Tail
};

function getHoldingMarketCapCategory(h) {
  if (h.marketCapCategory) return h.marketCapCategory;
  const mc = h.marketCap || 0;
  if (mc >= 200000000000) return "Large Cap";
  if (mc >= 50000000000) return "Mid Cap";
  if (mc >= 10000000000) return "Small Cap";
  return "Micro Cap";
}

function renderPortfolioAllocationCharts(data, diagnostics) {
  const deck = document.getElementById("allocationDeckSection");
  if (!deck) return;

  if (!data || !data.holdings || data.holdings.length === 0) {
    deck.classList.add("hidden");
    return;
  }
  deck.classList.remove("hidden");

  const totalValuation = data.totalValue || data.holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
  const totalValElem = document.getElementById("allocTotalValuation");
  if (totalValElem) totalValElem.textContent = formatINR(totalValuation);

  // 1. Sector Allocation Breakdown
  const sectorMap = {};
  data.holdings.forEach(h => {
    const sec = h.sector || "Other";
    if (!sectorMap[sec]) {
      sectorMap[sec] = { name: sec, value: 0, count: 0 };
    }
    sectorMap[sec].value += (h.marketValue || 0);
    sectorMap[sec].count += 1;
  });

  cachedSectorSlices = Object.values(sectorMap)
    .map(s => ({
      ...s,
      percent: totalValuation > 0 ? (s.value / totalValuation) * 100 : 0,
      color: SECTOR_PALETTE[s.name] || SECTOR_PALETTE["Default"]
    }))
    .sort((a, b) => b.value - a.value);

  const sectorCountElem = document.getElementById("allocSectorCount");
  if (sectorCountElem) sectorCountElem.textContent = `${cachedSectorSlices.length} Sectors`;

  renderDonutChart({
    svgId: "svgSectorPie",
    slices: cachedSectorSlices,
    centerLabelId: "allocSectorCenterLabel",
    centerNameId: "allocSectorCenterName",
    centerPctId: "allocSectorCenterPct",
    centerValId: "allocSectorCenterVal",
    defaultLabel: "Top Sector",
    defaultSlice: cachedSectorSlices[0],
    onSliceClick: (slice) => toggleSectorFilter(slice.name)
  });

  renderSectorLegend(cachedSectorSlices);

  // 2. Market Cap Allocation Breakdown (AMFI)
  const mcapOrder = ["Large Cap", "Mid Cap", "Small Cap", "Micro Cap"];
  const mcapMap = {
    "Large Cap": { name: "Large Cap", value: 0, count: 0, desc: "₹20,000 Cr+ Stability Core" },
    "Mid Cap": { name: "Mid Cap", value: 0, count: 0, desc: "₹5,000–20,000 Cr High Growth" },
    "Small Cap": { name: "Small Cap", value: 0, count: 0, desc: "₹1,000–5,000 Cr Alpha Surge" },
    "Micro Cap": { name: "Micro Cap", value: 0, count: 0, desc: "< ₹1,000 Cr Micro Tail" }
  };

  data.holdings.forEach(h => {
    const cat = getHoldingMarketCapCategory(h);
    if (!mcapMap[cat]) mcapMap[cat] = { name: cat, value: 0, count: 0, desc: "" };
    mcapMap[cat].value += (h.marketValue || 0);
    mcapMap[cat].count += 1;
  });

  cachedMcapSlices = mcapOrder
    .map(name => {
      const item = mcapMap[name];
      const pct = totalValuation > 0 ? (item.value / totalValuation) * 100 : 0;
      return {
        name,
        value: item.value,
        count: item.count,
        percent: pct,
        desc: item.desc,
        color: MCAP_PALETTE[name] || "#64748b"
      };
    })
    .filter(s => s.count > 0 || s.value > 0);

  const dominantMcap = [...cachedMcapSlices].sort((a, b) => b.value - a.value)[0];

  renderDonutChart({
    svgId: "svgMarketCapPie",
    slices: cachedMcapSlices,
    centerLabelId: "allocMcapCenterLabel",
    centerNameId: "allocMcapCenterName",
    centerPctId: "allocMcapCenterPct",
    centerValId: "allocMcapCenterVal",
    defaultLabel: "Dominant",
    defaultSlice: dominantMcap,
    onSliceClick: (slice) => toggleMarketCapFilter(slice.name)
  });

  renderMarketCapLegend(cachedMcapSlices);
}

function renderDonutChart(cfg) {
  const svg = document.getElementById(cfg.svgId);
  if (!svg) return;
  svg.innerHTML = "";

  const R = 54;
  const C = 2 * Math.PI * R; // ~339.292
  const slices = cfg.slices || [];

  if (slices.length === 0) {
    svg.innerHTML = `<circle cx="80" cy="80" r="${R}" fill="transparent" stroke="var(--border-highlight, #1e293b)" stroke-width="16" />`;
    return;
  }

  const updateCenter = (slice, labelText) => {
    const lbl = document.getElementById(cfg.centerLabelId);
    const nm = document.getElementById(cfg.centerNameId);
    const pct = document.getElementById(cfg.centerPctId);
    const val = document.getElementById(cfg.centerValId);

    if (lbl) lbl.textContent = labelText || cfg.defaultLabel;
    if (nm && slice) nm.textContent = slice.name;
    if (pct && slice) pct.textContent = `${slice.percent.toFixed(1)}%`;
    if (val && slice) val.textContent = formatINR(slice.value);
  };

  updateCenter(cfg.defaultSlice, cfg.defaultLabel);

  let offset = 0;
  slices.forEach((slice) => {
    const sliceLen = (slice.percent / 100) * C;
    if (sliceLen <= 0) return;

    const gap = slices.length > 1 ? 1.5 : 0;
    const drawLen = Math.max(0.1, sliceLen - gap);
    const dashArray = `${drawLen.toFixed(2)} ${C.toFixed(2)}`;
    const dashOffset = (-offset).toFixed(2);
    offset += sliceLen;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "80");
    circle.setAttribute("cy", "80");
    circle.setAttribute("r", R.toString());
    circle.setAttribute("fill", "transparent");
    circle.setAttribute("stroke", slice.color);
    circle.setAttribute("stroke-width", "20");
    circle.setAttribute("stroke-dasharray", dashArray);
    circle.setAttribute("stroke-dashoffset", dashOffset);
    circle.setAttribute("stroke-linecap", "round");
    circle.setAttribute("class", "cursor-pointer transition-all duration-300 opacity-90 hover:opacity-100");
    circle.style.transformOrigin = "80px 80px";

    circle.addEventListener("mouseenter", () => {
      circle.setAttribute("stroke-width", "24");
      circle.style.filter = `drop-shadow(0 0 6px ${slice.color}aa)`;
      updateCenter(slice, "Inspecting");
    });

    circle.addEventListener("mouseleave", () => {
      circle.setAttribute("stroke-width", "20");
      circle.style.filter = "none";
      updateCenter(cfg.defaultSlice, cfg.defaultLabel);
    });

    if (cfg.onSliceClick) {
      circle.addEventListener("click", () => cfg.onSliceClick(slice));
    }

    svg.appendChild(circle);
  });
}

function renderSectorLegend(slices) {
  const container = document.getElementById("legendSectorPie");
  if (!container) return;
  container.innerHTML = "";

  slices.forEach(s => {
    const isActive = sectorFilter.toLowerCase() === s.name.toLowerCase();
    const div = document.createElement("div");
    div.className = `flex items-center justify-between p-2 rounded-xl border ${isActive ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400/50' : 'border-[#16233d] bg-[#060c18] hover:border-slate-700/80'} transition cursor-pointer text-xs group`;
    div.title = `Click to filter holdings by ${s.name}`;

    div.innerHTML = `
      <div class="flex items-center space-x-2.5 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${s.color}"></span>
        <div class="truncate">
          <span class="font-bold text-white block truncate group-hover:text-cyan-300 transition">${s.name}</span>
          <span class="text-[10px] text-slate-400 font-sans">${s.count} ${s.count === 1 ? 'stock' : 'stocks'}</span>
        </div>
      </div>
      <div class="text-right flex-shrink-0 ml-2">
        <span class="font-bold font-mono text-white block">${s.percent.toFixed(1)}%</span>
        <span class="text-[10px] text-slate-400 font-mono privacy-mask">${formatINR(s.value)}</span>
      </div>
    `;

    div.addEventListener("click", () => toggleSectorFilter(s.name));
    container.appendChild(div);
  });
}

function renderMarketCapLegend(slices) {
  const container = document.getElementById("legendMarketCapPie");
  if (!container) return;
  container.innerHTML = "";

  slices.forEach(s => {
    const isActive = marketCapFilter.toLowerCase() === s.name.toLowerCase();
    const div = document.createElement("div");
    div.className = `flex items-center justify-between p-2 rounded-xl border ${isActive ? 'border-indigo-400 bg-indigo-950/40 ring-1 ring-indigo-400/50' : 'border-[#16233d] bg-[#060c18] hover:border-slate-700/80'} transition cursor-pointer text-xs group`;
    div.title = `Click to filter holdings by ${s.name}`;

    div.innerHTML = `
      <div class="flex items-center space-x-2.5 min-w-0">
        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${s.color}"></span>
        <div class="truncate">
          <span class="font-bold text-white block truncate group-hover:text-indigo-300 transition">${s.name}</span>
          <span class="text-[10px] text-slate-400 font-sans">${s.desc || `${s.count} stocks`}</span>
        </div>
      </div>
      <div class="text-right flex-shrink-0 ml-2">
        <span class="font-bold font-mono text-white block">${s.percent.toFixed(1)}%</span>
        <span class="text-[10px] text-slate-400 font-mono privacy-mask">${formatINR(s.value)}</span>
      </div>
    `;

    div.addEventListener("click", () => toggleMarketCapFilter(s.name));
    container.appendChild(div);
  });
}

function toggleSectorFilter(name) {
  if (sectorFilter.toLowerCase() === name.toLowerCase()) {
    sectorFilter = "";
  } else {
    sectorFilter = name;
    marketCapFilter = "";
  }

  const secFilter = document.getElementById("holdingsSectorFilter");
  if (secFilter) secFilter.value = sectorFilter;

  renderHoldingsTable();
  renderSectorLegend(cachedSectorSlices);
  renderMarketCapLegend(cachedMcapSlices);
  document.getElementById("holdingsScrollContainer")?.scrollIntoView({ behavior: 'smooth' });
}

function toggleMarketCapFilter(name) {
  if (marketCapFilter.toLowerCase() === name.toLowerCase()) {
    marketCapFilter = "";
  } else {
    marketCapFilter = name;
    sectorFilter = "";
    const secFilter = document.getElementById("holdingsSectorFilter");
    if (secFilter) secFilter.value = "";
  }

  renderHoldingsTable();
  renderSectorLegend(cachedSectorSlices);
  renderMarketCapLegend(cachedMcapSlices);
  document.getElementById("holdingsScrollContainer")?.scrollIntoView({ behavior: 'smooth' });
}

async function handleSyncLiveQuotes() {
  if (!currentPortfolioId) return;

  const btn = document.getElementById("btnSyncLiveQuotes");
  const icon = document.getElementById("syncIcon");
  const badge = document.getElementById("liveStatusBadge");
  const syncTime = document.getElementById("lastSyncTime");

  btn.disabled = true;
  icon.classList.add("fa-spin");
  if (badge) {
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping mr-1"></span>REFRESHING LIVE QUOTES...`;
  }

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/sync-live`, { method: "POST" });
    if (res.ok) {
      currentPortfolioData = await res.json();
      normalizePortfolioData(currentPortfolioData);
      renderPortfolioDetails(currentPortfolioData);
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (syncTime) syncTime.textContent = `Updated: ${timeStr}`;
      if (badge) {
        badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1"></span>NSE LIVE UPDATED (${timeStr})`;
      }
    } else {
      alert("Error refreshing live quotes.");
    }
  } catch (err) {
    console.error("Sync error:", err);
  } finally {
    btn.disabled = false;
    icon.classList.remove("fa-spin");
  }
}

function getFilteredAndSortedHoldings() {
  if (!currentPortfolioData || !currentPortfolioData.holdings) return [];

  let list = [...currentPortfolioData.holdings];

  // 0. Diagnostic Quick Filter (if active)
  if (activeDiagnosticFilter && activeDiagnosticFilter.tickers && activeDiagnosticFilter.tickers.length > 0) {
    const set = new Set(activeDiagnosticFilter.tickers.map(t => t.toUpperCase()));
    list = list.filter(h => set.has(h.ticker.toUpperCase()));
  }

  // 1. Text Search
  if (searchQuery) {
    list = list.filter(h =>
      h.ticker.toLowerCase().includes(searchQuery) ||
      h.name.toLowerCase().includes(searchQuery) ||
      h.sector.toLowerCase().includes(searchQuery)
    );
  }

  // 2. Sector Filter
  if (sectorFilter) {
    list = list.filter(h => h.sector.toLowerCase() === sectorFilter.toLowerCase());
  }

  // 2b. Market Cap Filter
  if (marketCapFilter) {
    list = list.filter(h => {
      const cat = getHoldingMarketCapCategory(h);
      return cat.toLowerCase() === marketCapFilter.toLowerCase();
    });
  }

  // 3. P&L & Behavioral Noise vs Decay Filter (O(1) Map lookups)
  if (pnlFilter === "PROFIT") {
    list = list.filter(h => (h.unrealizedPnL || 0) >= 0);
  } else if (pnlFilter === "LOSS") {
    list = list.filter(h => (h.unrealizedPnL || 0) < 0);
  } else if (pnlFilter === "NOISE") {
    list = list.filter(h => {
      const audit = currentAuditMap.get(h.ticker);
      return audit?.classification === 'DORMANT_COMPOUNDER' || ((h.unrealizedPnL || 0) < 0 && (h.dayPnL || 0) <= 0);
    });
  } else if (pnlFilter === "DECAY") {
    list = list.filter(h => {
      const audit = currentAuditMap.get(h.ticker);
      return audit?.classification === 'DEAD_CAPITAL_TRAP';
    });
  }

  // 4. Sorting
  list.sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    if (valA === undefined) valA = 0;
    if (valB === undefined) valB = 0;

    if (typeof valA === "string") {
      return sortAscending
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return sortAscending ? valA - valB : valB - valA;
  });

  return list;
}

function sortHoldings(col) {
  if (sortColumn === col) {
    sortAscending = !sortAscending;
  } else {
    sortColumn = col;
    sortAscending = (col === "ticker" || col === "sector");
  }
  renderHoldingsTable();
}

// Continuous Scroll View: Renders all matching holdings in one smooth view
function renderHoldingsTable() {
  const allFiltered = getFilteredAndSortedHoldings();
  const totalItems = allFiltered.length;

  const subtext = document.getElementById("holdingsSubtext");
  const isFiltered = (searchQuery || sectorFilter || marketCapFilter || pnlFilter !== 'ALL' || activeDiagnosticFilter);
  if (subtext) {
    subtext.textContent = `${totalItems} position${totalItems === 1 ? '' : 's'}${isFiltered ? ' (filtered)' : ''}`;
  }

  const infoText = document.getElementById("pageInfoText");
  if (infoText) {
    infoText.textContent = isFiltered
      ? `Showing ${totalItems} of ${currentPortfolioData?.holdings?.length || 105} positions`
      : `Showing all ${totalItems} positions in one view`;
  }

  const tbody = document.getElementById("holdingsTableBody");
  if (!tbody) return;

  if (allFiltered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="py-12 text-center text-slate-500 italic">No holdings match your search or filter criteria.</td></tr>`;
    return;
  }

  // High-Speed Single-Pass Batched DOM Rendering (< 2ms for 105+ rows)
  const rows = allFiltered.map(h => {
    const isPos = h.unrealizedPnL >= 0;
    // Soothing Mint for Gains, Soft Coral / Dusty Rose for Losses (Reduces financial anxiety)
    const pnlBadge = isWorkShieldActive
      ? (isPos ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-800 text-slate-300 border border-slate-700/60")
      : (isPos ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border border-rose-500/20");

    const isDayGainer = (h.dayPnL ?? 0) >= 0;
    const dayPnlBadge = isWorkShieldActive
      ? (isDayGainer ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-800 text-slate-300 border border-slate-700/60")
      : (isDayGainer ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-300 border border-rose-500/20");

    const advisory = getAdvisoryTarget(h);

    // Thesis Audit Classification from current diagnostics (O(1) Map lookup)
    const auditItem = currentAuditMap.get(h.ticker);
    let thesisPill = '';
    let noiseDecayBadge = '';

    if (auditItem) {
      if (auditItem.classification === 'DEAD_CAPITAL_TRAP') {
        thesisPill = `<span class="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40" title="${auditItem.coreDiagnosis}">TRAP</span>`;
        noiseDecayBadge = `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1" title="${auditItem.coreDiagnosis}"><i class="fa-solid fa-triangle-exclamation text-[8px]"></i> DECAY (TRIM)</span>`;
      } else if (auditItem.classification === 'DORMANT_COMPOUNDER') {
        thesisPill = `<span class="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="${auditItem.actionRule}">HOLD</span>`;
        noiseDecayBadge = `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1" title="${auditItem.coreDiagnosis} | Moat: ${auditItem.fundamentalMoat}"><i class="fa-solid fa-water text-[8px]"></i> NOISE (HOLD)</span>`;
      }
    }

    if (!noiseDecayBadge) {
      if (isPos) {
        noiseDecayBadge = `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1" title="Healthy compounder compounding gains"><i class="fa-solid fa-gem text-[8px]"></i> COMPOUNDER</span>`;
      } else {
        noiseDecayBadge = `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1" title="Cyclical pullback within normal market volatility"><i class="fa-solid fa-shield text-[8px]"></i> NOISE (HOLD)</span>`;
      }
    }

    return `
      <tr class="hover:bg-[#0f1b32]/50 transition border-b border-[#16233d]/50 text-xs">
        <td class="py-3 px-4 font-mono">
          <div class="flex items-center space-x-1.5 cursor-pointer group" onclick="inspectFromRow('${h.ticker}')" title="Click to inspect full scorecard, supply chain, shareholding & concall sentiment for ${h.ticker}">
            <span class="font-bold text-white text-xs group-hover:text-cyan-300 group-hover:underline transition">${h.ticker}</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[9px] text-slate-500 group-hover:text-cyan-400 transition"></i>
            ${thesisPill}
            <span class="text-[11px] text-slate-400 font-sans truncate max-w-[130px] hidden sm:inline" title="${h.name}">${h.name}</span>
          </div>
        </td>
        <td class="py-3 px-3 text-slate-400">
          <span class="px-2 py-0.5 rounded bg-[#060c18] border border-[#16233d] text-[11px] whitespace-nowrap text-slate-300">${h.sector}</span>
        </td>
        <td class="py-3 px-3 text-right font-mono text-slate-200 font-medium privacy-mask">${Math.round(h.quantity).toLocaleString('en-IN')}</td>
        
        <!-- Avg Buy Price -->
        <td class="py-3 px-4 text-right font-mono text-slate-300 privacy-mask">
          ${formatINR(h.buyPrice)}
        </td>

        <!-- Live CMP -->
        <td class="py-3 px-4 text-right font-mono font-medium text-white">
          ${formatINR(h.price)}
        </td>

        <!-- Day's P&L (₹ / %) -->
        <td class="py-3 px-4 text-right font-mono whitespace-nowrap">
          <span class="inline-block px-2.5 py-0.5 rounded-md ${dayPnlBadge} font-medium text-xs privacy-mask" title="Day's Move: ${isDayGainer ? '+' : ''}${formatINR(h.dayChange ?? 0)} per share">
            ${isDayGainer ? '+' : ''}${formatINR(h.dayPnL ?? 0)} (${isDayGainer ? '+' : ''}${(h.dayChangePercent ?? 0).toFixed(2)}%)
          </span>
        </td>

        <!-- Side-by-side Unrealized P&L (Strictly Emerald/Rose for financial performance) -->
        <td class="py-3 px-4 text-right font-mono whitespace-nowrap">
          <span class="inline-block px-2.5 py-0.5 rounded-md ${pnlBadge} font-medium text-xs privacy-mask" title="${auditItem?.actionRule || ''}">
            ${isPos ? '+' : ''}${formatINR(h.unrealizedPnL)} (${isPos ? '+' : ''}${h.unrealizedPnLPercent.toFixed(1)}%)
          </span>
        </td>

        <!-- Total Invested Cost -->
        <td class="py-3 px-4 text-right font-mono text-slate-400 privacy-mask">${formatINR(h.investedValue)}</td>

        <!-- Current Market Value -->
        <td class="py-3 px-4 text-right font-mono font-semibold text-white privacy-mask">${formatINR(h.marketValue)}</td>

        <!-- Portfolio Weight -->
        <td class="py-3 px-3 text-right font-mono text-slate-300">${h.weightPercent.toFixed(1)}%</td>

        <!-- Target Advisory & Noise vs Decay Radar -->
        <td class="py-3 px-3 text-center text-[11px] font-mono whitespace-nowrap">
          <div class="flex flex-col items-center justify-center space-y-1">
            <span class="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25" title="${advisory.rationale}">
              ₹${advisory.t1}
            </span>
            ${noiseDecayBadge}
          </div>
        </td>

        <!-- Streamlined Actions (Nordic Cyan and Subtle Secondary Actions) -->
        <td class="py-3 px-3 text-center whitespace-nowrap">
          <button onclick="openTradeModal('${h.ticker}')" class="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition mr-1 font-medium" title="Trade / Adjust">
            <i class="fa-solid fa-bolt mr-0.5"></i> Trade
          </button>
          <button onclick="inspectFromRow('${h.ticker}')" class="text-slate-400 hover:text-cyan-300 text-xs px-1.5 py-1 rounded hover:bg-[#0f1b32] transition mr-1" title="Inspect Scorecard">
            <i class="fa-solid fa-magnifying-glass-chart"></i>
          </button>
          <button onclick="handleRemoveHolding('${h.ticker}')" class="text-slate-500 hover:text-rose-400 text-xs px-1.5 py-1 rounded hover:bg-rose-500/10 transition" title="Delete Position">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows.join('');
}

function inspectFromRow(ticker) {
  navigateTo('discover');
  const input = document.getElementById("inspectorTicker");
  if (input) {
    input.value = ticker;
    handleInspectStock();
    input.scrollIntoView({ behavior: 'smooth' });
  }
}

// Diagnostic Table Filter Helper Functions
function filterTailHoldings() {
  if (!currentDiagnostics || !currentDiagnostics.tailEndAnalysis) return;
  const count = currentDiagnostics.tailEndAnalysis.microHoldingsCount;
  activeDiagnosticFilter = {
    type: 'tail',
    label: `Tail-End Micro-Holdings (${count} stocks < 0.5% weight)`,
    tickers: currentDiagnostics.tailEndAnalysis.microTickers
  };
  updateDiagnosticFilterBanner();
  renderHoldingsTable();
  document.getElementById("holdingsScrollContainer")?.scrollIntoView({ behavior: "smooth" });
}

function filterGainers() {
  if (!currentDiagnostics || !currentDiagnostics.harvesting) return;
  const tickers = currentDiagnostics.harvesting.profitBookingCandidates.map(c => c.ticker);
  activeDiagnosticFilter = {
    type: 'gainers',
    label: `Multi-Bagger Winners (>50% Gain: ${tickers.length} stocks)`,
    tickers: tickers
  };
  updateDiagnosticFilterBanner();
  renderHoldingsTable();
  document.getElementById("holdingsScrollContainer")?.scrollIntoView({ behavior: "smooth" });
}

function filterDeepLosers() {
  if (!currentDiagnostics || !currentDiagnostics.harvesting) return;
  const tickers = currentDiagnostics.harvesting.lossHarvestingCandidates.map(c => c.ticker);
  activeDiagnosticFilter = {
    type: 'drawdowns',
    label: `Deep Drawdowns (<-25% Loss: ${tickers.length} stocks)`,
    tickers: tickers
  };
  updateDiagnosticFilterBanner();
  renderHoldingsTable();
  document.getElementById("holdingsScrollContainer")?.scrollIntoView({ behavior: "smooth" });
}

function filterByTickers(tickers, label) {
  activeDiagnosticFilter = {
    type: 'custom',
    label: label,
    tickers: tickers
  };
  updateDiagnosticFilterBanner();
  renderHoldingsTable();
  document.getElementById("holdingsScrollContainer")?.scrollIntoView({ behavior: "smooth" });
}

function handleAdvisoryFilter(category) {
  if (!currentDiagnostics || !currentDiagnostics.advisoryPillars) return;
  const pillar = currentDiagnostics.advisoryPillars.find(p => p.category === category);
  if (!pillar || !pillar.targetTickers || pillar.targetTickers.length === 0) return;

  filterByTickers(pillar.targetTickers, `${pillar.title} (${pillar.targetTickers.length} stocks)`);
}

function clearDiagnosticFilter() {
  activeDiagnosticFilter = null;
  updateDiagnosticFilterBanner();
  renderHoldingsTable();
}

function updateDiagnosticFilterBanner() {
  const banner = document.getElementById("diagnosticActiveFilterBanner");
  const label = document.getElementById("diagnosticFilterLabel");
  if (!banner) return;
  if (activeDiagnosticFilter) {
    banner.classList.remove("hidden");
    if (label) label.textContent = activeDiagnosticFilter.label;
  } else {
    banner.classList.add("hidden");
  }
}

function renderDiagnosticsUI(diag) {
  if (!diag) return;
  currentDiagnostics = diag;
  try {

    // 1. Top Cockpit Stat Cards
    document.getElementById("statHealthScore").textContent = `${diag.healthScore} / 100`;
    document.getElementById("statHealthRating").textContent = `Grade ${diag.healthGrade}`;

    // 2. Grade Badge in Diagnostics Section
    const gradeBadge = document.getElementById("statHealthGradeBadge");
    if (gradeBadge) {
      gradeBadge.textContent = `GRADE ${diag.healthGrade} (${diag.healthScore}/100)`;
      if (diag.healthScore >= 75) {
        gradeBadge.className = "inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      } else if (diag.healthScore >= 60) {
        gradeBadge.className = "inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold font-mono bg-teal-500/15 text-teal-300 border border-teal-500/30";
      } else {
        gradeBadge.className = "inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30";
      }
    }

    // 3. SEBI Limits Status Badge
    const statusBadge = document.getElementById("diagnosticStatusBadge");
    if (statusBadge) {
      if (diag.violations.length === 0) {
        statusBadge.innerHTML = `<i class="fa-solid fa-check-circle mr-1.5 text-xs"></i> 0 Breaches (SEBI Compliant)`;
        statusBadge.className = "inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      } else {
        statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1.5 text-xs"></i> ${diag.violations.length} Limit Breaches`;
        statusBadge.className = "inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30";
      }
    }

    // 4. Executive Summary Text
    const summaryText = document.getElementById("diagExecutiveSummaryText");
    if (summaryText) {
      summaryText.textContent = diag.executiveSummary;
    }

    // 5. Pillar 1: Concentration (HHI)
    const c = diag.concentration;
    if (c) {
      document.getElementById("diagHhiScore").textContent = c.hhiScore.toFixed(1);
      document.getElementById("diagEffectiveHoldings").textContent = c.effectiveHoldings.toFixed(1);
      document.getElementById("diagHhiVerdict").textContent = `${c.diversificationStatus} \u2022 ${c.verdict}`;
      document.getElementById("diagMaxStockInfo").textContent = `${c.maxStockTicker} (${c.maxStockWeight}%)`;

      // Guardrail bars
      document.getElementById("guardrailStockText").textContent = `${c.maxStockWeight}% (Cap: 10%)`;
      const stockPctBar = Math.min(100, (c.maxStockWeight / 10) * 100);
      const stockBar = document.getElementById("guardrailStockBar");
      if (stockBar) {
        stockBar.style.width = `${stockPctBar}%`;
        stockBar.className = c.maxStockWeight <= 10 ? "bg-emerald-500 h-full rounded-full" : "bg-rose-500 h-full rounded-full";
      }
      document.getElementById("guardrailStockSub").textContent = `${c.maxStockTicker}: ${c.maxStockWeight <= 10 ? 'Compliant [Safe]' : 'Exceeds 10% limit [Alert]'}`;

      document.getElementById("guardrailTop5Text").textContent = `${c.top5WeightPercent}% (Cap: 35%)`;
      const top5PctBar = Math.min(100, (c.top5WeightPercent / 35) * 100);
      const top5Bar = document.getElementById("guardrailTop5Bar");
      if (top5Bar) {
        top5Bar.style.width = `${top5PctBar}%`;
        top5Bar.className = c.top5WeightPercent <= 35 ? "bg-emerald-500 h-full rounded-full" : "bg-rose-500 h-full rounded-full";
      }
      document.getElementById("guardrailTop5Sub").textContent = `Top 5 combine for ${c.top5WeightPercent}% (Low risk [Safe])`;

      document.getElementById("guardrailSectorText").textContent = `${c.maxSectorWeight}% (Cap: 25%)`;
      const sectorPctBar = Math.min(100, (c.maxSectorWeight / 25) * 100);
      const sectorBar = document.getElementById("guardrailSectorBar");
      if (sectorBar) {
        sectorBar.style.width = `${sectorPctBar}%`;
        sectorBar.className = c.maxSectorWeight <= 25 ? "bg-emerald-500 h-full rounded-full" : (c.maxSectorWeight <= 30 ? "bg-amber-500 h-full rounded-full" : "bg-rose-500 h-full rounded-full");
      }
      document.getElementById("guardrailSectorSub").textContent = `${c.maxSectorName}: ${c.maxSectorWeight <= 25 ? 'Compliant [Safe]' : 'Approaching limit [Caution]'}`;
    }

    // 6. Pillar 2: Tail-End Dilution
    const t = diag.tailEndAnalysis;
    if (t) {
      document.getElementById("diagTailCount").textContent = t.microHoldingsCount;
      document.getElementById("diagTailValue").textContent = formatINR(t.totalMicroValue);
      document.getElementById("diagTailPct").textContent = `(${t.percentOfPortfolio}%)`;
      const btnText = document.getElementById("btnFilterTailText");
      if (btnText) btnText.textContent = `Inspect ${t.microHoldingsCount} Micro-Stocks`;
    }

    // 7. Pillar 3: Market Cap Split
    const m = diag.marketCapSplit;
    if (m) {
      document.getElementById("statLargeCapPct").textContent = `${m.largeCapPercent}%`;
      document.getElementById("statMidCapPct").textContent = `${m.midCapPercent}%`;
      document.getElementById("statSmallCapPct").textContent = `${m.smallCapPercent}%`;
      document.getElementById("barLargeCap").style.width = `${m.largeCapPercent}%`;
      document.getElementById("barMidCap").style.width = `${m.midCapPercent}%`;
      document.getElementById("barSmallCap").style.width = `${m.smallCapPercent}%`;
      document.getElementById("diagMcapVerdict").textContent = m.benchmarkComparison;
    }

    // 8. Pillar 4: Harvesting & Drawdowns
    const h = diag.harvesting;
    if (h) {
      document.getElementById("diagDoublerCount").textContent = h.profitBookingCandidates.length;
      document.getElementById("diagDrawdownCount").textContent = h.lossHarvestingCandidates.length;
      const totalEvaluated = (h.profitPositionsCount + h.lossPositionsCount) || 1;
      const winRate = Math.round((h.profitPositionsCount / totalEvaluated) * 100);
      document.getElementById("diagWinRate").textContent = `${winRate}% (${h.profitPositionsCount}W / ${h.lossPositionsCount}L)`;
    }

    // 9. Pillar 5: Sleep-Well Crash Defense & 10% Correction Stress Test (Option B)
    const cd = diag.crashDefense;
    if (cd) {
      const scoreElem = document.getElementById("statCrashScore");
      const badgeElem = document.getElementById("statCrashBadge");
      const zeroDebtElem = document.getElementById("statZeroDebtPct");
      const highRoceElem = document.getElementById("statHighRocePct");
      const dipRupeesElem = document.getElementById("statDipRupees");
      const dipPctElem = document.getElementById("statDipPct");
      const recoveryElem = document.getElementById("statRecoveryHorizon");
      const summaryElem = document.getElementById("statPeaceOfMindSummary");

      if (scoreElem) scoreElem.innerHTML = `${cd.score} <span class="text-xs text-slate-500 font-normal">/ 100</span>`;
      if (badgeElem) {
        badgeElem.textContent = cd.grade;
        badgeElem.className = `text-xs font-bold px-2.5 py-1 rounded-lg border ${
          cd.score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
          (cd.score >= 65 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-teal-500/15 text-teal-300 border-teal-500/30')
        }`;
      }
      if (zeroDebtElem) zeroDebtElem.textContent = `${cd.zeroDebtRatioPercent}%`;
      if (highRoceElem) highRoceElem.textContent = `${cd.highRoceRatioPercent}%`;
      if (dipRupeesElem) dipRupeesElem.textContent = `-${formatINR(cd.tenPercentCorrectionDipRupees)}`;
      if (dipPctElem) dipPctElem.textContent = `(-${cd.tenPercentCorrectionDipPercent}%)`;
      if (recoveryElem) recoveryElem.textContent = `Recovery: ~${cd.expectedRecoveryHorizon}`;
      if (summaryElem) summaryElem.textContent = cd.peaceOfMindSummary;
    }

    // 10. Render Constraint Violations (if any)
    const vContainer = document.getElementById("violationsContainer");
    if (vContainer) {
      vContainer.innerHTML = "";
      if (diag.violations && diag.violations.length > 0) {
        vContainer.classList.remove("hidden");
        diag.violations.forEach(v => {
          const isCrit = v.severity === "Critical";
          const div = document.createElement("div");
          div.className = `p-3 bg-slate-950/90 rounded-xl border ${isCrit ? 'border-rose-500/40 bg-rose-950/20' : 'border-teal-500/30 bg-amber-950/20'} flex items-start justify-between`;
          div.innerHTML = `
            <div>
              <div class="text-xs font-bold ${isCrit ? 'text-rose-400' : 'text-teal-400'} flex items-center">
                <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
                <span>${v.ruleName}: ${v.target}</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">Current: <span class="text-white font-mono font-semibold">${v.currentValue}%</span> \u2022 Allowed Limit: ${v.allowedLimit}%</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isCrit ? 'bg-rose-500/20 text-rose-400' : 'bg-teal-500/15 text-teal-400'} uppercase">${v.severity}</span>
          `;
          vContainer.appendChild(div);
        });
      } else {
        vContainer.classList.add("hidden");
      }
    }

    // 10. Render Advisory Guidance Pillars (4 Thematic Institutional Cards)
    const aContainer = document.getElementById("advisoryPillarsContainer");
    if (aContainer && diag.advisoryPillars) {
      aContainer.innerHTML = "";
      diag.advisoryPillars.forEach(p => {
        const card = document.createElement("div");
        card.className = "p-4 bg-slate-950/70 rounded-xl border border-slate-800 hover:border-slate-700/80 transition flex flex-col justify-between space-y-3";

        let icon = "fa-lightbulb";
        let tagBg = "bg-teal-500/15 text-teal-400 border border-teal-500/30";
        let btnBg = "bg-teal-500/10 hover:bg-teal-500/15 text-teal-300 border border-teal-500/30";

        if (p.category.includes("Pruning")) {
          icon = "fa-scissors";
          tagBg = "bg-teal-500/15 text-teal-400 border border-teal-500/30";
          btnBg = "bg-teal-500/10 hover:bg-teal-500/15 text-teal-300 border border-teal-500/30";
        } else if (p.category.includes("Profit")) {
          icon = "fa-coins";
          tagBg = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
          btnBg = "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
        } else if (p.category.includes("Tax-Loss")) {
          icon = "fa-shield-halved";
          tagBg = "bg-rose-500/20 text-rose-400 border border-rose-500/30";
          btnBg = "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30";
        } else if (p.category.includes("Policy")) {
          icon = "fa-bolt";
          tagBg = "bg-sky-500/20 text-sky-400 border border-sky-500/30";
          btnBg = "bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30";
        }

        const tickerChips = p.targetTickers.slice(0, 5).map(tk =>
          `<span class="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-900 border border-slate-800 text-slate-300">${tk}</span>`
        ).join(" ");
        const extraCount = p.targetTickers.length > 5 ? `<span class="text-[10px] text-slate-500">+${p.targetTickers.length - 5} more</span>` : '';

        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between text-xs mb-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${tagBg}">
                <i class="fa-solid ${icon} mr-1"></i> ${p.category}
              </span>
              <span class="text-[10px] text-slate-400 font-medium">${p.impactLevel}</span>
            </div>
            <h5 class="text-sm font-bold text-white mb-1">${p.title}</h5>
            <p class="text-xs text-slate-400 leading-relaxed">${p.description}</p>
          </div>

          <div class="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center space-x-1 overflow-x-auto py-0.5">
              ${tickerChips}
              ${extraCount}
            </div>
            <button onclick="handleAdvisoryFilter('${p.category}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold ${btnBg} transition flex items-center justify-center space-x-1.5 whitespace-nowrap shadow-sm">
              <i class="fa-solid fa-arrow-right text-[10px]"></i>
              <span>${p.actionBadge}</span>
            </button>
          </div>
        `;
        aContainer.appendChild(card);
      });
    }

    // 11. Render Upcoming Events
    const eContainer = document.getElementById("eventsContainer");
    if (eContainer) {
      eContainer.innerHTML = "";
      if (diag.upcomingEvents.length === 0) {
        eContainer.innerHTML = `<div class="text-xs text-slate-500 italic py-8 text-center">No scheduled catalysts for current portfolio holdings.</div>`;
      } else {
        diag.upcomingEvents.forEach(e => {
          const div = document.createElement("div");
          div.className = "p-3 rounded-xl border border-slate-800/80 bg-slate-950/70 hover:bg-slate-950 flex items-start justify-between text-xs transition";
          const isPolicy = !e.ticker || e.eventType === "MacroPolicy";
          const isEarnings = e.eventType === "QuarterlyResults";
          div.innerHTML = `
            <div class="space-y-1">
              <div class="font-semibold text-white flex items-center space-x-2">
                ${e.ticker ? `
                  <button type="button" onclick="quickInspectTicker('${e.ticker}')" class="font-mono text-teal-400 hover:text-teal-300 hover:underline px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-[10px] font-bold" title="Inspect ${e.ticker} Scorecard">
                    ${e.ticker} <i class="fa-solid fa-arrow-up-right-from-square text-[8px] ml-0.5"></i>
                  </button>
                ` : `
                  <span class="text-orange-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 uppercase tracking-wider">Macro Policy</span>
                `}
                <span class="text-xs text-slate-200">${e.eventTitle}</span>
              </div>
              <div class="text-[11px] text-slate-400">${e.expectedImpact}</div>
            </div>
            <div class="text-right ml-3 flex flex-col items-end whitespace-nowrap">
              <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-medium text-slate-300 flex items-center">
                <i class="fa-regular fa-calendar text-[9px] text-teal-400 mr-1.5"></i> ${e.scheduledDate}
              </span>
              <span class="text-[9px] uppercase tracking-wider mt-1 ${isEarnings ? 'text-emerald-400' : isPolicy ? 'text-cyan-400' : 'text-slate-500'} font-semibold font-mono">
                ${e.eventType || 'CATALYST'}
              </span>
            </div>
          `;
          eContainer.appendChild(div);
        });
      }
    }

    // 12. Render Morning Briefing & Market Regime Weather Cockpit (Option C, B & A)
    if (diag.morningBriefing) {
      const mb = diag.morningBriefing;
      const mr = diag.marketRegime;

      // Greeting & Action Pill
      const greetingEl = document.getElementById("briefingGreeting");
      const actionPillEl = document.getElementById("briefingActionPill");
      const marketPulseEl = document.getElementById("briefingMarketPulse");

      if (greetingEl) greetingEl.textContent = mb.greeting;
      if (actionPillEl) {
        actionPillEl.textContent = mb.todayActionSummary;
        actionPillEl.className = `px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${mb.actionTone === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`;
      }
      if (marketPulseEl) marketPulseEl.textContent = mb.marketPulseSummary;

      // Market Regime Tiles (Pillar A)
      if (mr) {
        const pPrice = document.getElementById("regimeNiftyPrice");
        const pChange = document.getElementById("regimeNiftyChange");
        const pBreadth = document.getElementById("regimeBreadth");
        const pVix = document.getElementById("regimeVix");
        const pBanner = document.getElementById("briefingPolicyText");

        if (pPrice) pPrice.textContent = Number(mr.niftyCurrent).toLocaleString('en-IN');
        if (pChange) {
          pChange.textContent = (mr.niftyChangePercent >= 0 ? '+' : '') + mr.niftyChangePercent.toFixed(2) + '%';
          pChange.className = `text-[10px] font-bold font-mono ${mr.niftyChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
        }
        if (pBreadth) pBreadth.textContent = mr.marketBreadthPercent.toFixed(1) + '%';
        if (pVix) {
          pVix.textContent = mr.indiaVix.toFixed(1);
          pVix.className = `font-bold font-mono ${mr.indiaVix > 20 ? 'text-rose-400' : 'text-emerald-400'}`;
        }
        if (pBanner) pBanner.textContent = mr.rebalancePolicyVerdict;
      }

      // Column 1: Action Bullets & Noise vs Decay Ratio
      const bulletListEl = document.getElementById("briefingBulletList");
      const ratioEl = document.getElementById("briefingSoundRatio");
      if (ratioEl) {
        ratioEl.textContent = `${mb.soundHoldingsCount} Noise (Hold) / ${mb.attentionPositionsCount} Decay (Trim)`;
        ratioEl.title = `Noise vs Decay Audit: ${mb.soundHoldingsCount} stocks are experiencing healthy consolidation (do not sell) vs ${mb.attentionPositionsCount} with true structural drag.`;
      }

      if (bulletListEl) {
        bulletListEl.innerHTML = mb.actionBullets.map(b => `
          <li class="flex items-start space-x-2">
            <i class="fa-solid fa-circle-check text-emerald-400 text-[10px] mt-1 flex-shrink-0"></i>
            <span>${b}</span>
          </li>
        `).join('');
      }

      // Column 2: Positions in Red to Hold with Conviction (Dormant Giants)
      const holdListEl = document.getElementById("briefingHoldList");
      if (holdListEl) {
        if (!mb.keyPositionsToHold || mb.keyPositionsToHold.length === 0) {
          holdListEl.innerHTML = `<div class="text-slate-400 text-xs py-2 italic">Zero positions at a deep drawdown. Capital is intact!</div>`;
        } else {
          holdListEl.innerHTML = mb.keyPositionsToHold.map(h => `
            <div class="p-2 rounded-lg bg-[#0a1222] border border-amber-500/25 space-y-1">
              <div class="flex items-center justify-between">
                <span class="font-bold text-white flex items-center">
                  <span class="text-amber-400 font-mono mr-1.5">${h.ticker}</span>
                  <span class="text-[10px] text-slate-400 truncate max-w-[120px]">${h.name}</span>
                </span>
                <span class="font-mono font-bold text-rose-400 text-[10px]">${h.unrealizedPnLPercent.toFixed(1)}%</span>
              </div>
              <div class="text-[10px] text-slate-300 leading-tight">
                <strong class="text-amber-300">Moat:</strong> ${h.fundamentalMoat}
              </div>
              <div class="text-[9px] text-slate-400">
                ${h.actionRule}
              </div>
            </div>
          `).join('');
        }
      }

      // Column 3: The Broken Theses / High-Conviction Swaps
      const swapListEl = document.getElementById("briefingSwapList");
      if (swapListEl) {
        if (!mb.trapsToTrim || mb.trapsToTrim.length === 0) {
          swapListEl.innerHTML = `<div class="text-slate-400 text-xs py-2 italic flex items-center text-emerald-400"><i class="fa-solid fa-shield-check mr-1.5"></i> Zero structural traps! 100% of holdings are viable businesses.</div>`;
        } else {
          swapListEl.innerHTML = mb.trapsToTrim.map(t => `
            <div class="p-2 rounded-lg bg-[#0a1222] border border-rose-500/30 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-rose-300 font-mono">${t.ticker}</span>
                <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">BROKEN THESIS</span>
              </div>
              <p class="text-[10px] text-slate-400 leading-tight">${t.coreDiagnosis}</p>
              ${t.recommendedSwapTicker ? `
                <div class="p-1.5 rounded bg-[#060c18] border border-cyan-500/20 text-[9px] space-y-0.5">
                  <div class="text-cyan-300 font-bold flex items-center justify-between">
                    <span>Conviction Swap: &rarr; ${t.recommendedSwapTicker} (${t.recommendedSwapName})</span>
                    <button type="button" onclick="quickInspectTicker('${t.recommendedSwapTicker}')" class="text-[8px] px-1 bg-cyan-500/20 text-cyan-200 rounded hover:bg-cyan-500/30">Inspect</button>
                  </div>
                  <div class="text-slate-400">${t.swapAdvantage}</div>
                </div>
              ` : ''}
            </div>
          `).join('');
        }
      }
    }

    if (currentPortfolioData) {
      renderPortfolioAllocationCharts(currentPortfolioData, diag);
    }
  } catch (err) {
    console.error("Error rendering diagnostics:", err);
  }
}

async function loadDiagnostics(portfolioId) {
  try {
    const res = await fetch(`/api/portfolios/${portfolioId}/diagnostics`);
    if (!res.ok) return;
    const diag = await res.json();
    currentDiagnostics = diag;
    updateAuditMap(diag);
    renderDiagnosticsUI(diag);
    renderHoldingsTable();
  } catch (err) {
    console.error("Error loading diagnostics:", err);
  }
}

async function handleCreatePortfolio() {
  const nameInput = document.getElementById("newPortfolioName");
  const name = nameInput.value.trim();
  if (!name) return alert("Please enter a portfolio name.");

  try {
    const res = await fetch("/api/portfolios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      const err = await res.json();
      return alert(err.error || "Failed to create portfolio.");
    }
    const created = await res.json();
    nameInput.value = "";
    await loadPortfolios();
    selectPortfolio(created.id);
  } catch (err) {
    alert("Network error creating portfolio.");
  }
}

async function handleAddHolding() {
  if (!currentPortfolioId) return alert("Select or create a portfolio first.");
  const ticker = document.getElementById("inputTicker").value.trim().toUpperCase();
  const quantity = Math.round(parseFloat(document.getElementById("inputQuantity").value));
  const buyPriceRaw = parseFloat(document.getElementById("inputBuyPrice").value);
  const buyPrice = !isNaN(buyPriceRaw) && buyPriceRaw > 0 ? buyPriceRaw : null;

  if (!ticker) return alert("Please enter an NSE symbol.");
  if (isNaN(quantity) || quantity <= 0) return alert("Please enter a valid positive whole number of shares.");

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/holdings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, quantity, buyPrice })
    });
    if (!res.ok) {
      const err = await res.json();
      return alert(err.error || "Could not add holding.");
    }
    document.getElementById("inputTicker").value = "";
    document.getElementById("inputQuantity").value = "";
    document.getElementById("inputBuyPrice").value = "";
    document.getElementById("addPositionPanel").classList.add("hidden");
    await selectPortfolio(currentPortfolioId);
  } catch (err) {
    alert("Network error adding position.");
  }
}

async function handleRemoveHolding(ticker) {
  if (!confirm(`Remove position for ${ticker}?`)) return;
  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/holdings/${ticker}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await selectPortfolio(currentPortfolioId);
    }
  } catch (err) {
    alert("Error removing position.");
  }
}

async function handleRunRebalance() {
  if (!currentPortfolioId) return alert("Please select a portfolio first.");

  const inputs = document.querySelectorAll(".sector-weight-input");
  const targets = [];
  let total = 0;

  inputs.forEach(inp => {
    const weight = parseFloat(inp.value) || 0;
    if (weight > 0) {
      targets.push({
        sector: inp.getAttribute("data-sector"),
        targetWeightPercent: weight
      });
      total += weight;
    }
  });

  if (Math.abs(total - 100) > 0.01) {
    return alert(`Target allocations must sum to exactly 100%. Currently: ${total.toFixed(1)}%`);
  }

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/rebalance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetAllocations: targets })
    });
    if (!res.ok) {
      const err = await res.json();
      return alert(err.error || "Rebalance failed.");
    }

    const rec = await res.json();
    renderRebalanceResults(rec);
  } catch (err) {
    alert("Error executing rebalancing calculation.");
  }
}

function renderRebalanceResults(data) {
  const section = document.getElementById("rebalanceResultSection");
  section.classList.remove("hidden");
  section.scrollIntoView({ behavior: 'smooth' });

  const tradesContainer = document.getElementById("tradesContainer");
  tradesContainer.innerHTML = "";

  if (data.trades.length === 0) {
    tradesContainer.innerHTML = `<div class="p-4 bg-slate-950 rounded-lg text-slate-400 text-xs">No trades required. Portfolio is balanced.</div>`;
  } else {
    data.trades.forEach(t => {
      const isBuy = t.action === "BUY";
      const isHold = t.action === "HOLD";
      const color = isBuy ? "emerald" : isHold ? "slate" : "rose";
      const icon = isBuy ? "fa-arrow-up" : isHold ? "fa-minus" : "fa-arrow-down";

      const card = document.createElement("div");
      card.className = `p-3 bg-slate-950/80 rounded-xl border border-${color}-500/30 flex items-center justify-between`;
      card.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center text-${color}-400 font-bold text-xs">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div>
            <div class="text-sm font-bold text-white font-mono">${t.ticker} <span class="text-xs font-normal text-slate-400 font-sans">(${t.stockName})</span></div>
            <div class="text-[11px] text-slate-400">${t.sector} &bull; Current: <span class="privacy-mask">${t.currentQuantity} shares</span></div>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold ${isBuy ? 'bg-emerald-500/20 text-emerald-400' : isHold ? 'bg-slate-700 text-slate-300' : 'bg-rose-500/20 text-rose-400'} privacy-mask">
            ${t.action} ${Math.abs(t.deltaQuantity)} shs
          </span>
          <div class="text-xs font-mono text-slate-300 mt-0.5 privacy-mask">${formatINR(t.currentValue)} &rarr; ${formatINR(t.targetValue)}</div>
        </div>
      `;
      tradesContainer.appendChild(card);
    });
  }

  const driftsContainer = document.getElementById("driftsContainer");
  driftsContainer.innerHTML = "";

  data.sectorDrifts.forEach(d => {
    const isOver = d.direction === "Overweight";
    const isOn = d.direction === "On Target";
    const badgeColor = isOver ? "amber-400" : isOn ? "emerald-400" : "sky-400";

    const div = document.createElement("div");
    div.className = "p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5";
    div.innerHTML = `
      <div class="flex justify-between items-center text-xs">
        <span class="font-medium text-white">${d.sector}</span>
        <span class="text-[11px] font-semibold text-${badgeColor}">${d.direction} (${d.driftPercentagePoints > 0 ? '+' : ''}${d.driftPercentagePoints}%)</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
        <div class="bg-amber-500 h-2 rounded-full" style="width: ${Math.min(d.currentWeight, 100)}%"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-400 font-mono">
        <span>Current: ${d.currentWeight}%</span>
        <span>Target: ${d.targetWeight}%</span>
      </div>
    `;
    driftsContainer.appendChild(div);
  });
}

// ========================================================
// TECHNO-FUNDA TIMING & CANDLESTICK CHART ENGINE
// TradingView Lightweight Charts + Algorithmic Pattern Engine
// ========================================================
let currentChartInstance = null;
let currentChartResizeObserver = null;
let activeChartTicker = null;
let activeChartMos = 0;
let activeChartRange = '1y';

async function switchChartTimeframe(ticker, range, mos) {
  activeChartRange = range;
  ['3m', '6m', '1y'].forEach(r => {
    const btn = document.getElementById(`btnTf${r}`);
    if (btn) {
      if (r === range) {
        btn.className = "chart-tf-btn px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30";
      } else {
        btn.className = "chart-tf-btn px-2.5 py-1 rounded text-slate-400 hover:text-white transition";
      }
    }
  });
  await loadAndRenderStockChart(ticker, range, mos);
}

function renderTechnoFundaMatrix(chartData, container, ticker, mos) {
  if (!container) return;
  const tf = chartData.technoFunda || chartData.TechnoFunda;
  if (!tf) {
    container.innerHTML = "";
    return;
  }

  const toneConfig = {
    'buy': { bg: 'bg-emerald-950/40', border: 'border-emerald-500/40', text: 'text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: 'fa-solid fa-circle-check', label: 'STRONG BUY' },
    'accumulate': { bg: 'bg-teal-950/40', border: 'border-teal-500/40', text: 'text-teal-300', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40', icon: 'fa-solid fa-layer-group', label: 'ACCUMULATE ON DIP' },
    'caution': { bg: 'bg-rose-950/40', border: 'border-rose-500/40', text: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: 'fa-solid fa-triangle-exclamation', label: 'VALUE TRAP ALERT' },
    'trim': { bg: 'bg-amber-950/40', border: 'border-amber-500/40', text: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: 'fa-solid fa-scale-unbalanced', label: 'OVERBOUGHT TRIM' },
    'neutral': { bg: 'bg-slate-900/60', border: 'border-slate-800', text: 'text-slate-300', badge: 'bg-slate-800 text-slate-300 border-slate-700', icon: 'fa-solid fa-hourglass-half', label: 'WATCHLIST' },
  };

  const tone = tf.actionTone || 'neutral';
  const styling = toneConfig[tone] || toneConfig['neutral'];
  const patterns = tf.patterns || [];

  // Trend template status
  const trendPill = tf.isStage2Uptrend
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><i class="fa-solid fa-arrow-trend-up mr-1"></i>Stage 2 Markup</span>`
    : `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">Consolidation / Pre-Stage</span>`;

  // Breakout status
  const breakoutPill = tf.isVolumeBreakout
    ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"><i class="fa-solid fa-bolt mr-1"></i>Base Breakout Active</span>`
    : `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">Consolidation Range</span>`;

  container.innerHTML = `
    <!-- Techno-Funda Executive Verdict Banner -->
    <div class="p-4 ${styling.bg} border ${styling.border} rounded-xl space-y-2.5 transition shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg ${styling.badge} border flex items-center justify-center text-sm shadow-inner">
            <i class="${styling.icon}"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-black uppercase tracking-wider ${styling.text}">${tf.timingVerdict}</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${styling.badge} border uppercase">
                ${styling.label}
              </span>
            </div>
            <p class="text-[11px] text-slate-300 mt-0.5">${tf.actionRecommendation}</p>
          </div>
        </div>
        <div class="self-start sm:self-center bg-slate-950/90 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2">
          <i class="fa-solid fa-gauge-high text-teal-400 text-xs"></i>
          <span class="text-[11px] font-mono text-slate-300">Vol: <strong class="text-white">${tf.volumeMultiplierVs20DayAvg}x</strong> 20D Avg</span>
        </div>
      </div>

      <!-- 4-Factor Real-Time Technical Health Strip -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-mono pt-0.5">
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
          <span class="text-slate-500 block text-[9px] uppercase tracking-wider">Trend Template</span>
          <div class="mt-1">${trendPill}</div>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
          <span class="text-slate-500 block text-[9px] uppercase tracking-wider">Volume & Base</span>
          <div class="mt-1">${breakoutPill}</div>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
          <span class="text-slate-500 block text-[9px] uppercase tracking-wider">Wilder RSI(14)</span>
          <div class="font-bold text-white text-xs mt-1">
            ${tf.currentRsi} <span class="text-[10px] font-normal text-slate-400">(${tf.rsiCondition})</span>
          </div>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
          <span class="text-slate-500 block text-[9px] uppercase tracking-wider">Moving Average Regime</span>
          <div class="font-bold text-xs mt-1 ${tf.movingAverageSummary.includes('Bullish') ? 'text-emerald-400' : (tf.movingAverageSummary.includes('Bearish') ? 'text-rose-400' : 'text-amber-400')}">
            ${tf.movingAverageSummary}
          </div>
        </div>
      </div>

      <!-- Techno-Funda Dual-Engine Pillar Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11px]">
        <div class="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-semibold flex items-center"><i class="fa-solid fa-gem text-emerald-400 mr-1.5"></i> Fundamental Pillar (WHAT to buy)</span>
            <span class="font-mono font-bold ${mos >= 15 ? 'text-emerald-400' : (mos >= 0 ? 'text-teal-400' : 'text-rose-400')}">
              ${mos >= 0 ? '+' : ''}${mos}% Margin of Safety
            </span>
          </div>
          <p class="text-[10px] text-slate-400 leading-tight">
            Assesses business durability, ROCE quality, and intrinsic fair value discount to protect downside capital.
          </p>
        </div>
        <div class="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 font-semibold flex items-center"><i class="fa-solid fa-chart-line text-cyan-400 mr-1.5"></i> Technical Timing (WHEN market rewards it)</span>
            <span class="font-mono font-bold text-cyan-400">
              ${patterns.length} Pattern(s) Triggered
            </span>
          </div>
          <p class="text-[10px] text-slate-400 leading-tight">
            Tracks institutional volume absorption, 50/200 SMA stage trends, and base breakout pivots to eliminate value traps.
          </p>
        </div>
      </div>
    </div>

    ${(() => {
      const swing = tf.swingSignal || tf.SwingSignal;
      if (!swing) return "";

      const isTriggered = swing.status === 'TRIGGERED';
      const isForming = swing.status === 'FORMING';
      const statusBadge = isTriggered
        ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"><i class="fa-solid fa-bolt mr-1"></i>ACTIVE BUY PIVOT</span>`
        : (isForming 
            ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40"><i class="fa-solid fa-hourglass-half mr-1"></i>FORMING / SQUEEZE</span>`
            : `<span class="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">STAGE 2 WATCHLIST</span>`);

      const teamBadge = swing.winningTeam?.includes('Alpha')
        ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center"><i class="fa-solid fa-trophy text-amber-400 mr-1"></i>Tech Team Alpha (VCP Champion)</span>`
        : `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center"><i class="fa-solid fa-shield text-cyan-400 mr-1"></i>Tech Team Beta (50-SMA VDU)</span>`;

      const triggersList = (swing.triggers || []).map(t => `
        <div class="flex items-start space-x-1.5 text-[11px] text-slate-300">
          <i class="fa-solid fa-circle-check text-teal-400 text-[10px] mt-0.5"></i>
          <span>${t}</span>
        </div>
      `).join('');

      return `
        <!-- Institutional 1-2 Month Swing Trading Engine Card -->
        <div class="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-teal-500/40 rounded-xl space-y-3 shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 text-sm">
                <i class="fa-solid fa-crosshairs"></i>
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-black text-white uppercase tracking-wider">${swing.setupType}</span>
                  ${statusBadge}
                  ${teamBadge}
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">Holding Period: <strong class="text-teal-300">${swing.timeHorizon}</strong> &bull; Target Gain: <strong class="text-emerald-400">+${swing.targetGainPercent}%</strong></p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button type="button" onclick="openCreateAlertModal('${ticker}', ${chartData.currentPrice}, ${swing.targetPrice}, 'CrossesAbove')" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center space-x-1 transition shadow-sm">
                <i class="fa-solid fa-bell"></i>
                <span>Target Alert (₹${swing.targetPrice.toFixed(2)})</span>
              </button>
              <button type="button" onclick="openCreateAlertModal('${ticker}', ${chartData.currentPrice}, ${swing.stopLossPrice}, 'CrossesBelow')" class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold flex items-center space-x-1 transition shadow-sm">
                <i class="fa-solid fa-shield-halved"></i>
                <span>Stop Alert (₹${swing.stopLossPrice.toFixed(2)})</span>
              </button>
            </div>
          </div>

          <!-- Swing Trade Parameters Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] font-mono">
            <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span class="text-slate-500 block text-[9px] uppercase">Entry / CMP</span>
              <span class="font-bold text-white text-xs mt-0.5 block">₹${(swing.entryPrice || chartData.currentPrice).toFixed(2)}</span>
            </div>
            <div class="bg-slate-900/90 p-2 rounded-lg border border-emerald-500/30">
              <span class="text-emerald-400 block text-[9px] uppercase">Swing Target</span>
              <span class="font-bold text-emerald-300 text-xs mt-0.5 block">₹${swing.targetPrice.toFixed(2)} (+${swing.targetGainPercent}%)</span>
            </div>
            <div class="bg-slate-900/90 p-2 rounded-lg border border-rose-500/30">
              <span class="text-rose-400 block text-[9px] uppercase">Stop Loss</span>
              <span class="font-bold text-rose-300 text-xs mt-0.5 block">₹${swing.stopLossPrice.toFixed(2)} (-${swing.stopLossPercent}%)</span>
            </div>
            <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <span class="text-slate-500 block text-[9px] uppercase">Risk / Reward</span>
              <span class="font-bold text-teal-300 text-xs mt-0.5 block">1 : ${swing.riskRewardRatio}</span>
            </div>
            <div class="bg-slate-900/90 p-2 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
              <span class="text-slate-500 block text-[9px] uppercase">Expected Holding</span>
              <span class="font-bold text-amber-300 text-xs mt-0.5 block">${swing.expectedHoldingDays} Days (1-2 Mo)</span>
            </div>
          </div>

          <!-- Trigger Checklist -->
          <div class="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
            <div class="text-[9px] uppercase font-bold tracking-wider text-slate-500">Algorithmic Execution Conditions & Verification:</div>
            <div class="space-y-1">${triggersList}</div>
          </div>
        </div>
      `;
    })()}

    <!-- Algorithmic Patterns Grid -->
    <div class="space-y-1.5">
      <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
        <span class="flex items-center"><i class="fa-solid fa-microchip text-teal-400 mr-1.5"></i> Algorithmic Pattern Recognition Scan Results</span>
        <span class="text-slate-500 font-mono text-[9px]">C# .NET 10 Institutional Engine</span>
      </div>

      ${patterns.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          ${patterns.map(p => {
            const isWarning = p.category === 'Warning' || !p.isBullish;
            const cardBorder = isWarning ? 'border-rose-500/50 bg-rose-950/20' : 'border-teal-500/40 bg-slate-900/90';
            const badgeStyle = isWarning ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            const icon = isWarning ? 'fa-solid fa-triangle-exclamation text-rose-400' : 'fa-solid fa-circle-check text-emerald-400';
            const conf = Math.round((p.confidenceScore || 0.8) * 100);

            return `
              <div class="p-2.5 rounded-xl border ${cardBorder} space-y-1.5 text-xs">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-1.5 font-semibold text-white truncate mr-2">
                    <i class="${icon} text-xs"></i>
                    <span class="truncate text-[11px]">${p.name}</span>
                  </div>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${badgeStyle} border whitespace-nowrap">
                    ${conf}% Match
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 leading-snug">
                  ${p.description}
                </p>
                <div class="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-0.5">
                  <span>Category: ${p.category}</span>
                  <span>${p.dateDetected || 'Active Session'}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
          <i class="fa-solid fa-circle-info text-teal-400"></i>
          <span>Scanning for Minervini Stage 2, Base Breakouts, Double Bottoms, and 200 SMA Rebounds. No extreme climax or liquidation patterns active.</span>
        </div>
      `}
    </div>
  `;
}

async function loadAndRenderStockChart(ticker, range = '1y', mos = 0) {
  activeChartTicker = ticker;
  activeChartMos = mos;
  activeChartRange = range;

  const container = document.getElementById("stockCandleChart");
  const matrixContainer = document.getElementById("technoFundaMatrixContainer");
  if (!container) return;

  // Cleanup existing chart
  if (currentChartResizeObserver) {
    currentChartResizeObserver.disconnect();
    currentChartResizeObserver = null;
  }
  if (currentChartInstance) {
    try {
      currentChartInstance.remove();
    } catch (e) {
      console.warn("Chart removal exception:", e);
    }
    currentChartInstance = null;
  }

  container.innerHTML = `
    <div id="chartLoadingOverlay" class="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
      <div class="text-xs text-slate-400 flex items-center space-x-2">
        <i class="fa-solid fa-circle-notch fa-spin text-teal-400"></i>
        <span>Loading OHLCV candles &amp; computing technical patterns for ${ticker}...</span>
      </div>
    </div>
  `;

  try {
    const res = await fetch(`/api/stocks/${encodeURIComponent(ticker)}/chart?range=${range}&marginOfSafety=${mos}`);
    if (!res.ok) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-rose-400">Unable to load chart data for ${ticker}.</div>`;
      return;
    }
    const chartData = await res.json();

    container.innerHTML = ""; // Clear loader

    if (!window.LightweightCharts) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-amber-400">Lightweight Charts library is initializing...</div>`;
      return;
    }

    if (!chartData.candles || chartData.candles.length === 0) {
      container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No candlestick data available for ${ticker}.</div>`;
      return;
    }

    const chartWidth = container.clientWidth || 800;
    const chartHeight = 360;

    // Read active theme palette dynamically (Dark, Eye Comfort, Light)
    const activeTheme = localStorage.getItem("portfolioRebalancerTheme") || "dark";
    let chartBgColor = '#070d18';
    let chartGridColor = 'rgba(23, 37, 61, 0.45)';
    let chartTextColor = '#94a3b8';
    let chartBorderColor = 'rgba(23, 37, 61, 0.6)';

    if (activeTheme === 'eye-comfort') {
      chartBgColor = '#15171e';
      chartGridColor = 'rgba(43, 48, 61, 0.45)';
      chartTextColor = '#9ca3af';
      chartBorderColor = 'rgba(43, 48, 61, 0.6)';
    } else if (activeTheme === 'light') {
      chartBgColor = '#ffffff';
      chartGridColor = 'rgba(226, 232, 240, 0.8)';
      chartTextColor = '#475569';
      chartBorderColor = 'rgba(203, 213, 225, 0.8)';
    }

    const chart = LightweightCharts.createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        background: { color: chartBgColor },
        textColor: chartTextColor,
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      grid: {
        vertLines: { color: chartGridColor },
        horzLines: { color: chartGridColor }
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: chartBorderColor,
        scaleMargins: {
          top: 0.08,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: chartBorderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    currentChartInstance = chart;

    // 1. Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#34d399',
      downColor: '#fb7185',
      borderVisible: false,
      wickUpColor: '#34d399',
      wickDownColor: '#fb7185',
    });
    candleSeries.setData(chartData.candles.map(c => ({
      time: c.date || c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));

    // 2. Moving Average lines
    const rawEma20 = chartData.ema20 || chartData.emA20 || [];
    let ema20Series = null;
    if (rawEma20.length > 0) {
      ema20Series = chart.addLineSeries({
        color: '#2dd4bf', // teal
        lineWidth: 1.5,
        title: '20 EMA',
        priceLineVisible: false,
      });
      ema20Series.setData(rawEma20.map(p => ({ time: p.date || p.time, value: p.value })));
    }

    const rawSma50 = chartData.sma50 || chartData.smA50 || [];
    let sma50Series = null;
    if (rawSma50.length > 0) {
      sma50Series = chart.addLineSeries({
        color: '#f59e0b', // amber
        lineWidth: 1.5,
        title: '50 SMA',
        priceLineVisible: false,
      });
      sma50Series.setData(rawSma50.map(p => ({ time: p.date || p.time, value: p.value })));
    }

    const rawSma200 = chartData.sma200 || chartData.smA200 || [];
    let sma200Series = null;
    if (rawSma200.length > 0) {
      sma200Series = chart.addLineSeries({
        color: '#c084fc', // purple
        lineWidth: 1.5,
        title: '200 SMA',
        priceLineVisible: false,
      });
      sma200Series.setData(rawSma200.map(p => ({ time: p.date || p.time, value: p.value })));
    }

    // 3. Volume overlay (bottom 18%)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume_scale',
    });
    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });
    volumeSeries.setData(chartData.candles.map(c => ({
      time: c.date || c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(52, 211, 153, 0.35)' : 'rgba(251, 113, 133, 0.35)',
    })));

    // 4. Crosshair Tooltip
    chart.subscribeCrosshairMove(param => {
      const tooltip = document.getElementById("chartCrosshairTooltip");
      if (!tooltip) return;
      if (!param.time || !param.seriesData) {
        tooltip.innerHTML = `<span class="text-slate-500 text-[10px]">Hover crosshairs over chart for OHLCV &amp; MA values</span>`;
        return;
      }
      const c = param.seriesData.get(candleSeries);
      const e20 = ema20Series ? param.seriesData.get(ema20Series) : null;
      const s50 = sma50Series ? param.seriesData.get(sma50Series) : null;
      const s200 = sma200Series ? param.seriesData.get(sma200Series) : null;
      if (c) {
        const isUp = c.close >= c.open;
        tooltip.innerHTML = `
          <span class="text-slate-300 font-mono font-semibold">${param.time}</span>
          <span class="text-slate-600">|</span>
          <span>O: <b class="text-white font-mono">&#8377;${c.open?.toFixed(1)}</b></span>
          <span>H: <b class="text-emerald-400 font-mono">&#8377;${c.high?.toFixed(1)}</b></span>
          <span>L: <b class="text-rose-400 font-mono">&#8377;${c.low?.toFixed(1)}</b></span>
          <span>C: <b class="${isUp ? 'text-emerald-400' : 'text-rose-400'} font-mono">&#8377;${c.close?.toFixed(1)}</b></span>
          ${e20 && e20.value ? `<span class="text-teal-400 font-mono">20E: ${e20.value.toFixed(1)}</span>` : ''}
          ${s50 && s50.value ? `<span class="text-amber-400 font-mono">50S: ${s50.value.toFixed(1)}</span>` : ''}
          ${s200 && s200.value ? `<span class="text-purple-400 font-mono">200S: ${s200.value.toFixed(1)}</span>` : ''}
        `;
      }
    });

    // 5. Responsive Resize
    currentChartResizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0 || !chart) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        chart.applyOptions({ width });
      }
    });
    currentChartResizeObserver.observe(container);

    // Fit content smoothly
    chart.timeScale().fitContent();

    // 6. Populate Techno-Funda Timing Engine Action Matrix
    renderTechnoFundaMatrix(chartData, matrixContainer, ticker, mos);

  } catch (err) {
    console.error("Error rendering stock chart:", err);
    container.innerHTML = `<div class="p-6 text-center text-xs text-rose-400">Failed to render chart: ${err.message || err}</div>`;
  }
}

async function handleInspectStock() {
  const ticker = document.getElementById("inspectorTicker").value.trim().toUpperCase();
  if (!ticker) return;

  const resultContainer = document.getElementById("stockInspectorResult");
  resultContainer.classList.remove("hidden");
  resultContainer.innerHTML = `<div class="text-slate-400 py-3 text-center"><i class="fa-solid fa-circle-notch fa-spin text-teal-400 mr-2"></i>Running 5-Pillar Institutional Equity Research Engine for ${ticker}...</div>`;

  try {
    const res = await fetch(`/api/stocks/${ticker}`);
    if (!res.ok) {
      resultContainer.innerHTML = `<div class="text-rose-400 p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg">Stock '${ticker}' not found in registry.</div>`;
      return;
    }
    const data = await res.json();
    
    const scoreColor = data.overallScore >= 75 ? 'emerald' : data.overallScore >= 50 ? 'amber' : 'rose';
    const peg = data.peerBenchmark?.pegRatio;
    const pegColor = peg && peg <= 1.5 ? 'text-emerald-400' : (peg && peg <= 2.2 ? 'text-teal-400' : 'text-slate-300');
    const pledge = data.governanceAudit?.promoterPledgePercent ?? (data.governanceAudit?.pledgePercent ?? 0);
    const isPristinePledge = pledge === 0;

    resultContainer.innerHTML = `
      <!-- Header: Ticker, Archetype, Conviction & Overall Score -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-extrabold text-base text-white font-mono tracking-tight">${data.ticker}</span>
            <span class="text-slate-400 text-xs">${data.name}</span>
            <span class="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">${data.sector}</span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-1.5">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/30">
              ${data.investmentArchetype || 'Equities'}
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
              ${data.ratingCategory || 'Conviction Evaluated'}
            </span>
          </div>
        </div>
        <div class="flex items-center space-x-3 self-end sm:self-center">
          <div class="text-right">
            <div class="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Composite Score</div>
            <div class="text-xl font-black font-mono text-${scoreColor}-400">
              ${data.overallScore}<span class="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
          </div>
          <div class="w-10 h-10 rounded-xl bg-${scoreColor}-500/10 border border-${scoreColor}-500/30 flex items-center justify-center text-${scoreColor}-400 text-lg shadow-inner">
            <i class="fa-solid fa-award"></i>
          </div>
        </div>
      </div>

      <!-- Executive 2-Second Thesis & Quick Stats Ribbon -->
      <div class="p-3 bg-gradient-to-r from-slate-950 via-[#0d1627] to-slate-950 rounded-xl border border-[#16233d] shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex flex-wrap items-center gap-3 font-mono">
          <div class="flex items-center space-x-1.5">
            <span class="text-slate-500 text-[10px]">CMP:</span>
            <span class="font-bold text-white text-sm">&#8377;${data.price}</span>
            <span class="text-[10px] ${data.marginOfSafetyPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">(${data.marginOfSafetyPercent >= 0 ? '+' : ''}${data.marginOfSafetyPercent}% MoS)</span>
          </div>
          <span class="text-slate-700">|</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-slate-500 text-[10px]">P/E:</span>
            <span class="font-bold text-slate-200">${data.peerBenchmark?.stockPE ? data.peerBenchmark.stockPE + 'x' : 'N/A'}</span>
            <span class="text-[10px] text-slate-400">(Sector: ${data.peerBenchmark?.sectorMedianPE || 22}x)</span>
          </div>
          <span class="text-slate-700">|</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-slate-500 text-[10px]">ROCE:</span>
            <span class="font-bold text-cyan-400">${data.governanceAudit?.rocePercent || 20}%</span>
          </div>
          <span class="text-slate-700">|</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-slate-500 text-[10px]">Promoter Pledge:</span>
            <span class="font-bold ${isPristinePledge ? 'text-emerald-400' : 'text-rose-400'}">${pledge}% ${isPristinePledge ? '(Pristine)' : ''}</span>
          </div>
          <span class="text-slate-700">|</span>
          <div class="flex items-center space-x-1.5">
            <span class="text-slate-500 text-[10px]">Big Public Float:</span>
            <span class="font-bold text-teal-300">${(data.shareholdingPattern?.bigPublicInvestorsPercent || 0).toFixed(1)}%</span>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
            <i class="fa-solid fa-microphone-lines text-xs mr-1"></i> ${data.managementAudit?.managementSentiment ? data.managementAudit.managementSentiment.replace('_', ' ') : 'BULLISH'}
          </span>
        </div>
      </div>

      <!-- Sticky Sub-Navigation Bar for High-Speed Inspection -->
      <div class="sticky top-2 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-[#080e1b]/95 backdrop-blur-md border border-[#16233d] shadow-xl overflow-x-auto">
        <button type="button" onclick="jumpToInspectorSection('inspectorSecOverview', this)" class="inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 transition whitespace-nowrap">
          <i class="fa-solid fa-chart-line mr-1.5 text-cyan-400"></i>Overview &amp; Chart
        </button>
        <button type="button" onclick="jumpToInspectorSection('inspectorSecValuation', this)" class="inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition whitespace-nowrap">
          <i class="fa-solid fa-scale-balanced mr-1.5 text-amber-400"></i>Fair Value &amp; Swaps
        </button>
        ${data.supplyChain ? `
          <button type="button" onclick="jumpToInspectorSection('inspectorSecSupplyChain', this)" class="inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition whitespace-nowrap">
            <i class="fa-solid fa-network-wired mr-1.5 text-indigo-400"></i>Supply Chain &amp; Moat
          </button>
        ` : ''}
        <button type="button" onclick="jumpToInspectorSection('inspectorSecShareholding', this)" class="inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition whitespace-nowrap">
          <i class="fa-solid fa-chart-pie mr-1.5 text-teal-400"></i>Shareholding &amp; Whales
        </button>
        <button type="button" onclick="jumpToInspectorSection('inspectorSecManagement', this)" class="inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition whitespace-nowrap">
          <i class="fa-solid fa-user-tie mr-1.5 text-purple-400"></i>Management &amp; Concall
        </button>
        <button type="button" onclick="jumpToInspectorSection('inspectorSecRisks', this)" class="inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition whitespace-nowrap">
          <i class="fa-solid fa-shield-halved mr-1.5 text-rose-400"></i>Strengths &amp; Risks
        </button>
      </div>

      <!-- SECTION: Fair Value & Valuation Check -->
      <div id="inspectorSecValuation" class="space-y-3">
        <!-- Is Current Value Good? (Fair Value & Margin of Safety Check) -->
      <div class="p-3 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <i class="fa-solid fa-bullseye text-emerald-400 mr-1.5"></i> Is Current Value Good? (Fair Value Check)
            </span>
            <button type="button" class="text-slate-400 hover:text-teal-400 transition" onclick="openFinancialExplainer('FAIR_VALUE')" title="What is Fair Value & Margin of Safety?">
              <i class="fa-solid fa-circle-info text-[11px]"></i>
            </button>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
              data.marginOfSafetyPercent >= 15 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              (data.marginOfSafetyPercent >= -10 ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30')
            }">
              ${data.marginOfSafetyPercent >= 0 ? '+' : ''}${data.marginOfSafetyPercent}% Margin of Safety
            </span>
          </div>
          <p class="text-xs text-slate-300">
            ${data.valuationBandVerdict || 'Valuation assessed relative to growth rate and sector peers.'}
          </p>
        </div>
        <div class="flex items-center space-x-3 self-end md:self-center">
          <button type="button" onclick="openCreateAlertModal('${data.ticker}', ${data.price})" class="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-semibold text-xs flex items-center space-x-1.5 transition shadow-sm" title="Set Real-Time Price Alert for ${data.ticker}">
            <i class="fa-solid fa-bell text-xs"></i>
            <span>Set Alert</span>
          </button>
          <div class="flex items-center space-x-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <div class="text-right">
              <div class="text-[9px] uppercase tracking-wider text-slate-500">Live Market Price (CMP)</div>
              <div class="text-sm font-bold font-mono text-teal-400">&#8377;${data.price}</div>
            </div>
            <div class="text-slate-600 font-bold">&rarr;</div>
            <div class="text-right">
              <div class="text-[9px] uppercase tracking-wider text-slate-500">Estimated Fair Value</div>
              <div class="text-sm font-bold font-mono text-emerald-400">&#8377;${data.fairValueEstimate || data.price}</div>
            </div>
          </div>
        </div>
      </div>
      </div> <!-- End inspectorSecValuation -->

      <!-- SECTION: Technicals & 5-Pillar Score Overview -->
      <div id="inspectorSecOverview" class="space-y-4">
        <!-- Interactive Candlestick Chart & Techno-Funda Timing Engine Desk -->
      <div class="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm">
              <i class="fa-solid fa-chart-line text-sm"></i>
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-white uppercase tracking-wider">Techno-Funda Timing &amp; Price Action</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-500/15 text-teal-400 border border-teal-500/25">NSE LIVE OHLCV</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">PATTERN RECOGNITION</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Valuation tells you <em>what</em> to buy &bull; Price action &amp; volume tell you <em>when</em> the market rewards it
              </p>
            </div>
          </div>
          
          <!-- Timeframe Selector -->
          <div class="flex items-center space-x-2">
            <div class="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-[10px] font-mono">
              <button id="btnTf3m" type="button" onclick="switchChartTimeframe('${data.ticker}', '3m', ${data.marginOfSafetyPercent})" class="chart-tf-btn px-2.5 py-1 rounded text-slate-400 hover:text-white transition">3M</button>
              <button id="btnTf6m" type="button" onclick="switchChartTimeframe('${data.ticker}', '6m', ${data.marginOfSafetyPercent})" class="chart-tf-btn px-2.5 py-1 rounded text-slate-400 hover:text-white transition">6M</button>
              <button id="btnTf1y" type="button" onclick="switchChartTimeframe('${data.ticker}', '1y', ${data.marginOfSafetyPercent})" class="chart-tf-btn px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">1Y</button>
            </div>
          </div>
        </div>

        <!-- Legend & Crosshair Inspector Bar -->
        <div class="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <div class="flex flex-wrap items-center gap-3">
            <span class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 bg-emerald-400 rounded-xs inline-block"></span><span class="text-slate-300">Candles</span></span>
            <span class="flex items-center space-x-1.5"><span class="w-3 h-0.5 bg-teal-400 inline-block"></span><span class="text-teal-400 font-semibold">20 EMA</span></span>
            <span class="flex items-center space-x-1.5"><span class="w-3 h-0.5 bg-amber-400 inline-block"></span><span class="text-amber-400 font-semibold">50 SMA</span></span>
            <span class="flex items-center space-x-1.5"><span class="w-3 h-0.5 bg-purple-400 inline-block"></span><span class="text-purple-400 font-semibold">200 SMA</span></span>
            <span class="flex items-center space-x-1.5"><span class="w-2.5 h-2.5 bg-slate-600 rounded-xs inline-block"></span><span class="text-slate-400">Vol (20D Avg)</span></span>
          </div>
          <div id="chartCrosshairTooltip" class="text-slate-400 flex items-center space-x-2">
            <span class="text-slate-500 text-[10px]">Hover crosshairs over chart for OHLCV &amp; MA values</span>
          </div>
        </div>

        <!-- Chart Canvas Container -->
        <div class="relative w-full">
          <div id="stockCandleChart" class="w-full h-[360px] bg-[#090d16] rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div id="chartLoadingOverlay" class="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
              <div class="text-xs text-slate-400 flex items-center space-x-2">
                <i class="fa-solid fa-circle-notch fa-spin text-teal-400"></i>
                <span>Loading historical daily candles &amp; detecting technical patterns...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Techno-Funda Timing Engine Action Matrix (Injected dynamically) -->
        <div id="technoFundaMatrixContainer" class="space-y-3 pt-1"></div>
      </div>

      <!-- 5 Institutional Pillars Bar Matrix -->
      <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
        <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
          <span><i class="fa-solid fa-layer-group text-teal-400 mr-1.5"></i>5-Pillar Score Breakdown</span>
          <span class="text-slate-500 font-mono text-[9px]">Weighted Alpha Model</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
          <!-- Quality -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium flex items-center">
                1. Quality
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('ROCE')"><i class="fa-solid fa-circle-info text-[9px]"></i></button>
              </span>
              <span class="font-bold text-white font-mono">${data.qualityScore || data.fundamentalScore}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${data.qualityScore || data.fundamentalScore}%"></div>
            </div>
          </div>
          <!-- Relative Valuation & PEG -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium flex items-center">
                2. Valuation
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('PEG')"><i class="fa-solid fa-circle-info text-[9px]"></i></button>
              </span>
              <span class="font-bold text-white font-mono">${data.relativeValuationScore || 70}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="bg-amber-500 h-1.5 rounded-full" style="width: ${data.relativeValuationScore || 70}%"></div>
            </div>
          </div>
          <!-- Sector Cycle -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium">3. Sector Cycle</span>
              <span class="font-bold text-white font-mono">${data.sectorCycleScore || data.technicalScore}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="bg-cyan-500 h-1.5 rounded-full" style="width: ${data.sectorCycleScore || data.technicalScore}%"></div>
            </div>
          </div>
          <!-- Governance & FII/DII -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium flex items-center">
                4. Governance
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('PROMOTER_PLEDGE')"><i class="fa-solid fa-circle-info text-[9px]"></i></button>
              </span>
              <span class="font-bold text-white font-mono">${data.institutionalGovernanceScore || 75}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="bg-purple-500 h-1.5 rounded-full" style="width: ${data.institutionalGovernanceScore || 75}%"></div>
            </div>
          </div>
          <!-- Macro Policy -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium">5. Policy</span>
              <span class="font-bold text-white font-mono">${data.macroPolicyScore || data.policyAlignmentScore}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="bg-orange-500 h-1.5 rounded-full" style="width: ${data.macroPolicyScore || data.policyAlignmentScore}%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Institutional Research Briefing & Sector Cycle -->
      <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <div class="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center">
            <i class="fa-solid fa-building-columns mr-1.5"></i> Institutional Consensus & Thesis
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40 font-mono">
            Cycle: ${data.sectorCycleStatus || 'In Secular Phase'}
          </span>
        </div>
        <p class="text-slate-200 text-xs leading-relaxed italic border-l-2 border-amber-500/60 pl-3 py-0.5">
          "${data.institutionalCommentary || 'Multi-factor institutional evaluation reflects balanced earnings visibility, secular drivers, and regulatory stability.'}"
        </p>
      </div>

      <!-- Deep Pillar Breakdown: 4 Diagnostic Quads -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <!-- Quad 1: Valuation & Peer Benchmark -->
        <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <i class="fa-solid fa-scale-balanced text-teal-400 mr-1.5"></i> Relative Valuation &amp; Peers
            </span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Growth-Adjusted</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center font-mono">
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500 flex items-center justify-center">
                <span>Stock P/E</span>
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('PE_RATIO')"><i class="fa-solid fa-circle-info text-[8px]"></i></button>
              </div>
              <div class="font-bold text-white text-xs mt-0.5">${data.peerBenchmark?.stockPe ? data.peerBenchmark.stockPe.toFixed(1) + 'x' : (data.peRatio ? data.peRatio.toFixed(1) + 'x' : 'N/A')}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Sector Median</div>
              <div class="font-bold text-slate-300 text-xs mt-0.5">${data.peerBenchmark?.sectorMedianPe ? data.peerBenchmark.sectorMedianPe.toFixed(1) + 'x' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500 flex items-center justify-center">
                <span>PEG Ratio</span>
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('PEG')"><i class="fa-solid fa-circle-info text-[8px]"></i></button>
              </div>
              <div class="font-bold text-xs mt-0.5 ${pegColor}">${peg ? peg.toFixed(2) + 'x' : 'N/A'}</div>
            </div>
          </div>
          <div class="text-[10px] text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/60 flex items-center justify-between">
            <span class="text-slate-400 font-medium">Verdict:</span>
            <span class="font-semibold text-teal-300 truncate ml-2 text-right">${data.peerBenchmark?.valuationVerdict || 'Evaluated against peer median'}</span>
          </div>
          ${data.peerBenchmark?.topPeers && data.peerBenchmark.topPeers.length > 0 ? `
            <div class="text-[10px] text-slate-400 flex flex-wrap items-center gap-1 pt-1">
              <span class="text-[9px] text-slate-500 mr-1">Sector Peers:</span>
              ${data.peerBenchmark.topPeers.map(p => `<span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700/60 cursor-pointer hover:border-amber-400" onclick="quickInspectTicker('${p}')">${p}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Quad 2: Management & Governance Audit -->
        <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <i class="fa-solid fa-user-shield text-emerald-400 mr-1.5"></i> Governance &amp; Returns
            </span>
            ${isPristinePledge ? `
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <i class="fa-solid fa-check mr-1"></i>0% PLEDGE
              </span>
            ` : `
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-teal-300 border border-teal-500/30">
                ${pledge}% Pledged
              </span>
            `}
          </div>
          <div class="grid grid-cols-4 gap-1 text-center font-mono">
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Promoter</div>
              <div class="font-bold text-white text-xs mt-0.5">${data.governanceAudit?.promoterHoldingPercent ? data.governanceAudit.promoterHoldingPercent.toFixed(1) + '%' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500 flex items-center justify-center">
                <span>Pledge</span>
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('PROMOTER_PLEDGE')"><i class="fa-solid fa-circle-info text-[8px]"></i></button>
              </div>
              <div class="font-bold text-xs mt-0.5 ${isPristinePledge ? 'text-emerald-400' : 'text-teal-400'}">${pledge.toFixed(1)}%</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500 flex items-center justify-center">
                <span>ROCE</span>
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('ROCE')"><i class="fa-solid fa-circle-info text-[8px]"></i></button>
              </div>
              <div class="font-bold text-xs mt-0.5 ${data.governanceAudit?.rocePercent >= 15 ? 'text-emerald-400' : 'text-slate-300'}">${data.governanceAudit?.rocePercent ? data.governanceAudit.rocePercent.toFixed(1) + '%' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500 flex items-center justify-center">
                <span>Debt/Eq</span>
                <button type="button" class="ml-1 text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('DEBT_EQUITY')"><i class="fa-solid fa-circle-info text-[8px]"></i></button>
              </div>
              <div class="font-bold text-white text-xs mt-0.5">${data.governanceAudit?.debtToEquity !== null && data.governanceAudit?.debtToEquity !== undefined ? data.governanceAudit.debtToEquity.toFixed(2) : '0.00'}</div>
            </div>
          </div>
          <div class="text-[10px] text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/60 flex items-center justify-between">
            <span class="text-slate-400 font-medium">Audit:</span>
            <span class="font-semibold text-emerald-300 truncate ml-2 text-right">${data.governanceAudit?.governanceRating || 'Clean Governance Record'}</span>
          </div>
        </div>

        <!-- Quad 3: Institutional Sponsorship & Smart Money Flows -->
        <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <i class="fa-solid fa-money-bill-trend-up text-cyan-400 mr-1.5"></i> Institutional Sponsorship (FII/DII)
            </span>
            <button type="button" class="text-slate-500 hover:text-teal-400" onclick="openFinancialExplainer('FII_DII')">
              <i class="fa-solid fa-circle-info text-[10px]"></i>
            </button>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center font-mono">
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">FII Stake</div>
              <div class="font-bold text-white text-xs mt-0.5">${data.institutionalFlow?.fiiHoldingPercent ? data.institutionalFlow.fiiHoldingPercent.toFixed(1) + '%' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">DII Stake</div>
              <div class="font-bold text-white text-xs mt-0.5">${data.institutionalFlow?.diiHoldingPercent ? data.institutionalFlow.diiHoldingPercent.toFixed(1) + '%' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Total Inst.</div>
              <div class="font-bold text-cyan-400 text-xs mt-0.5">${data.institutionalFlow?.totalInstitutionalFloat ? data.institutionalFlow.totalInstitutionalFloat.toFixed(1) + '%' : ((data.institutionalFlow?.fiiHoldingPercent || 0) + (data.institutionalFlow?.diiHoldingPercent || 0)).toFixed(1) + '%'}</div>
            </div>
          </div>
          <div class="text-[10px] text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/60 flex items-center justify-between">
            <span class="text-slate-400 font-medium">Flow Trend:</span>
            <span class="font-semibold text-cyan-300 truncate ml-2 text-right">${data.institutionalFlow?.flowTrend || 'Steady Institutional Backing'}</span>
          </div>
        </div>

        <!-- Quad 4: National Policy & Union Budget Tailwinds -->
        <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <i class="fa-solid fa-landmark-flag text-orange-400 mr-1.5"></i> Macro &amp; Policy Alignment
            </span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-950/40 text-orange-300 border border-orange-800/40">PLI / Budget</span>
          </div>
          <p class="text-slate-300 text-xs leading-relaxed bg-slate-950/70 p-2 rounded border border-slate-800/60">
            ${data.policyTailwindSummary || 'Beneficiary of national capex thrust, domestic manufacturing or regulatory continuity.'}
          </p>
          <div class="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>Policy Support Index:</span>
            <span class="font-bold font-mono text-orange-400">${data.macroPolicyScore || data.policyAlignmentScore} / 100</span>
          </div>
        </div>
      </div>

      <!-- Better Market Ideas & Stock Swap Radar -->
      ${data.betterMarketAlternatives && data.betterMarketAlternatives.length > 0 ? `
        <div class="p-3.5 bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-indigo-950/40 rounded-xl border border-indigo-500/30 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="text-xs font-bold text-white uppercase tracking-wider flex items-center">
              <i class="fa-solid fa-wand-magic-sparkles text-indigo-400 mr-2"></i> Better Market Ideas &amp; Stock Swap Radar
              <span class="ml-2 text-[10px] font-normal text-slate-400 hidden sm:inline">&bull; High-Conviction Sector Alternatives</span>
            </div>
            <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              ${data.sector} Sector Alternatives
            </span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${data.betterMarketAlternatives.map(alt => `
              <div class="p-3 bg-slate-950/90 rounded-xl border border-slate-800/90 hover:border-indigo-500/50 transition space-y-2 shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span class="font-bold font-mono text-white text-xs">${alt.ticker}</span>
                    <span class="text-[11px] text-slate-400 truncate max-w-[140px]">${alt.name}</span>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ${alt.momentumBadge}
                  </span>
                </div>
                <div class="grid grid-cols-4 gap-1 text-center font-mono text-[10px] bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60">
                  <div>
                    <span class="text-slate-500 block text-[9px]">CMP</span>
                    <span class="text-teal-400 font-bold">&#8377;${alt.price}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[9px]">P/E</span>
                    <span class="text-slate-200 font-bold">${alt.peRatio}x</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[9px]">PEG</span>
                    <span class="text-emerald-400 font-bold">${alt.pegRatio}x</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[9px]">ROCE</span>
                    <span class="text-cyan-400 font-bold">${alt.rocePercent}%</span>
                  </div>
                </div>
                <p class="text-[11px] text-slate-300 leading-snug italic">
                  &ldquo;${alt.whyBetter}&rdquo;
                </p>
                <div class="text-right">
                  <button type="button" onclick="quickInspectTicker('${alt.ticker}')" class="text-[10px] font-bold text-teal-400 hover:text-teal-300 px-2 py-1 rounded bg-teal-500/10 hover:bg-teal-500/15 border border-amber-500/20 transition">
                    Inspect ${alt.ticker} &rarr;
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      </div> <!-- End inspectorSecOverview -->

      <!-- SECTION: Institutional Supply Chain & Value Ecosystem -->
      <div id="inspectorSecSupplyChain" class="space-y-4">
        ${data.supplyChain ? renderInstitutionalSupplyChainEcosystem(data.supplyChain, data.ticker, data.name) : ''}
      </div>

      <!-- SECTION: Institutional Shareholding Pattern & Whale Deals -->
      <div id="inspectorSecShareholding" class="space-y-4">
        ${renderShareholdingPatternAndWhaleAlerts(data.shareholdingPattern, data.ticker, data.name, data.price)}
      </div>

      <!-- SECTION: Management Rating & Concall Sentiment -->
      <div id="inspectorSecManagement" class="space-y-4">
        ${renderManagementAuditSection(data.managementAudit, data.ticker, data.name)}
      </div>

      <!-- SECTION: Strengths & Risk Warnings -->
      <div id="inspectorSecRisks" class="space-y-2 pt-1">
        ${data.strengths && data.strengths.length > 0 ? `
          <div class="p-2.5 bg-emerald-950/20 border border-emerald-500/25 rounded-xl text-emerald-200 text-xs space-y-1">
            <div class="font-bold text-emerald-400 text-[10px] uppercase flex items-center tracking-wider">
              <i class="fa-solid fa-circle-check mr-1.5"></i> Institutional Investment Strengths:
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">
              ${data.strengths.map(s => `<div class="flex items-start space-x-1.5"><i class="fa-solid fa-check text-emerald-400 text-[10px] mt-0.5"></i><span>${s}</span></div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${data.riskFlags && data.riskFlags.length > 0 ? `
          <div class="p-2.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-1">
            <div class="font-bold text-rose-400 text-[10px] uppercase flex items-center tracking-wider">
              <i class="fa-solid fa-triangle-exclamation mr-1.5"></i> Key Risk Warnings &amp; Sensitivities:
            </div>
            ${data.riskFlags.map(f => `<div class="flex items-start space-x-1.5"><i class="fa-solid fa-xmark text-rose-400 text-[10px] mt-0.5"></i><span>${f}</span></div>`).join('')}
          </div>
        ` : `
          <div class="p-2 bg-slate-900/40 border border-slate-800 rounded-lg text-slate-400 text-[11px] flex items-center justify-between">
            <span class="flex items-center"><i class="fa-solid fa-shield text-emerald-400 mr-1.5"></i> No severe capital erosion or governance audit flags detected.</span>
            <span class="text-[9px] font-mono text-slate-500">Zero Red Flags</span>
          </div>
        `}
      </div>

      <!-- Footer: Live Market Metrics -->
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div>Live CMP: <strong class="text-white font-mono ml-1">&#8377;${data.price}</strong></div>
        <div>Market Cap: <strong class="text-white font-mono ml-1">${formatMarketCapCrores(data.marketCap)}</strong></div>
        <div>Div Yield: <strong class="text-white font-mono ml-1">${data.dividendYield ? data.dividendYield.toFixed(2) + '%' : '0.00%'}</strong></div>
      </div>
    `;

    // Asynchronously load the interactive candlestick chart & technical pattern analysis
    setTimeout(() => {
      loadAndRenderStockChart(data.ticker, '1y', data.marginOfSafetyPercent);
    }, 40);

  } catch (err) {
    resultContainer.innerHTML = `<div class="text-rose-400 p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg">Error fetching stock scorecard: ${err.message || err}</div>`;
  }
}

async function loadResearchReport(portfolioId) {
  const section = document.getElementById("researchReportSection");
  section.classList.remove("hidden");
  section.scrollIntoView({ behavior: 'smooth' });

  const stratContainer = document.getElementById("quantStrategiesContainer");
  const scenContainer = document.getElementById("scenariosContainer");
  stratContainer.innerHTML = `<div class="p-4 text-xs text-slate-400">Loading backtested factor models...</div>`;
  scenContainer.innerHTML = `<div class="p-4 text-xs text-slate-400">Loading macro news scenarios...</div>`;

  try {
    const res = await fetch(`/api/portfolios/${portfolioId}/research`);
    if (!res.ok) {
      stratContainer.innerHTML = `<div class="p-4 text-xs text-rose-400">Failed loading research models.</div>`;
      return;
    }
    const data = await res.json();

    // Render 3 Backtested Strategies
    stratContainer.innerHTML = "";
    data.topStrategies.forEach(s => {
      const card = document.createElement("div");
      card.className = "p-4 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3";
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start">
            <h5 class="font-bold text-white text-xs">${s.strategyName}</h5>
            <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ${s.historicalCagrPercent}% CAGR
            </span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">${s.philosophy}</p>
          <div class="p-2 bg-slate-900 rounded text-[10px] font-mono text-teal-400/90 mt-2 border border-slate-800">
            <strong>Rule:</strong> ${s.coreCriteria}
          </div>
          <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-2 font-mono">
            <div>Benchmark: <span class="text-slate-200">${s.benchmarkCagrPercent}%</span></div>
            <div>Max Drawdown: <span class="text-rose-400">-${s.maxDrawdownPercent}%</span></div>
          </div>
        </div>

        <div>
          <div class="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center">
            <i class="fa-solid fa-bullseye text-teal-400 mr-1"></i> Top Opportunities Detected:
          </div>
          <div class="space-y-1.5">
            ${s.identifiedOpportunities.map(op => `
              <div class="p-2 bg-slate-900 rounded border border-slate-800 text-[11px]">
                <div class="flex justify-between items-center">
                  <span class="font-bold font-mono text-white">${op.ticker}</span>
                  <span class="text-emerald-400 font-mono font-semibold">+${op.upsidePotentialPercent}% Upside</span>
                </div>
                <div class="text-[10px] text-slate-400 mt-0.5">${op.triggerSignal}</div>
                <div class="text-[10px] text-slate-500 mt-0.5">Target: \u20B9${op.targetPrice} &bull; ${op.catalystRationale}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      stratContainer.appendChild(card);
    });

    // Render News & Macro Scenarios
    scenContainer.innerHTML = "";
    data.scenarioStressTests.forEach(sc => {
      const isPos = sc.marketImpact === "Positive";
      const badgeColor = isPos ? "emerald" : "rose";
      const card = document.createElement("div");
      card.className = `p-4 bg-slate-950/90 rounded-xl border border-${badgeColor}-500/40 flex flex-col justify-between space-y-2.5`;
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-start">
            <h5 class="font-bold text-white text-xs">${sc.scenarioName}</h5>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-${badgeColor}-500/20 text-${badgeColor}-400 uppercase">
              ${sc.marketImpact} (${sc.projectedPortfolioImpactPercent > 0 ? '+' : ''}${sc.projectedPortfolioImpactPercent}%)
            </span>
          </div>
          <p class="text-[11px] text-slate-300 mt-1">${sc.triggerEvent}</p>
        </div>

        <div class="text-[10px] space-y-1 border-t border-slate-800 pt-2">
          <div><strong class="text-slate-400">Resilient Winners:</strong> <span class="text-emerald-400 font-mono">${sc.resilientHoldings.join(', ')}</span></div>
          <div><strong class="text-slate-400">Vulnerable:</strong> <span class="text-rose-400 font-mono">${sc.vulnerableHoldings.join(', ')}</span></div>
        </div>

        <div class="p-2 rounded bg-slate-900 text-[10px] text-teal-300/90 border border-slate-800 leading-relaxed">
          <i class="fa-solid fa-lightbulb text-teal-400 mr-1"></i> <strong>Advisory Response:</strong> ${sc.advisoryAction}
        </div>
      `;
      scenContainer.appendChild(card);
    });

  } catch (err) {
    stratContainer.innerHTML = `<div class="p-4 text-xs text-rose-400">Error loading research report.</div>`;
  }
}
// ==========================================
// INTERACTIVE TRADE LOGGER & POSITION ADJUSTER
// ==========================================
let currentTradeAction = 'BUY';

function openTradeModal(ticker = null, defaultAction = 'BUY') {
  const modal = document.getElementById("tradeModal");
  if (!modal) return;

  // Populate existing stocks dropdown
  const select = document.getElementById("tradeHoldingSelect");
  if (select && currentPortfolioData && currentPortfolioData.holdings) {
    select.innerHTML = '<option value="">Or pick existing...</option>';
    const sorted = [...currentPortfolioData.holdings].sort((a,b) => a.ticker.localeCompare(b.ticker));
    sorted.forEach(h => {
      const opt = document.createElement("option");
      opt.value = h.ticker;
      opt.textContent = `${h.ticker} (${Math.round(h.quantity).toLocaleString('en-IN')} shs @ ₹${h.buyPrice})`;
      select.appendChild(opt);
    });
  }

  setTradeAction(defaultAction);

  const tickerInput = document.getElementById("tradeTickerInput");
  const qtyInput = document.getElementById("tradeQuantityInput");
  const priceInput = document.getElementById("tradePriceInput");

  if (ticker) {
    tickerInput.value = ticker.toUpperCase();
    if (select) select.value = ticker.toUpperCase();
    const holding = currentPortfolioData?.holdings?.find(h => h.ticker.toUpperCase() === ticker.toUpperCase());
    if (holding) {
      qtyInput.value = defaultAction === 'SELL' ? Math.min(10, Math.round(holding.quantity)) : 10;
      priceInput.value = holding.price || holding.buyPrice || "";
    } else {
      qtyInput.value = 10;
      priceInput.value = "";
    }
  } else {
    tickerInput.value = "";
    if (select) select.value = "";
    qtyInput.value = 10;
    priceInput.value = "";
  }

  updateTradePreview();
  modal.classList.remove("hidden");
}

function closeTradeModal() {
  const modal = document.getElementById("tradeModal");
  if (modal) modal.classList.add("hidden");
}

function setTradeAction(action) {
  currentTradeAction = action;

  const btnBuy = document.getElementById("tradeBtnBuy");
  const btnSell = document.getElementById("tradeBtnSell");
  const btnAdjust = document.getElementById("tradeBtnAdjust");
  const badge = document.getElementById("tradeImpactActionBadge");
  const submitText = document.getElementById("tradeSubmitText");
  const qtyLabel = document.getElementById("tradeQuantityLabel");
  const priceLabel = document.getElementById("tradePriceLabel");

  [btnBuy, btnSell, btnAdjust].forEach(b => {
    if (b) b.className = "py-2 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white";
  });

  if (action === 'BUY') {
    if (btnBuy) btnBuy.className = "py-2 text-xs font-bold rounded-lg transition bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm";
    if (badge) { badge.textContent = "BUY"; badge.className = "text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-400"; }
    if (submitText) submitText.textContent = "Confirm Buy Trade";
    if (qtyLabel) qtyLabel.textContent = "Quantity to Buy (+ Shares)";
    if (priceLabel) priceLabel.textContent = "Buy Execution Price (â‚¹)";
  } else if (action === 'SELL') {
    if (btnSell) btnSell.className = "py-2 text-xs font-bold rounded-lg transition bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm";
    if (badge) { badge.textContent = "SELL / TRIM"; badge.className = "text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-500/20 text-rose-400"; }
    if (submitText) submitText.textContent = "Confirm Sell Trade";
    if (qtyLabel) qtyLabel.textContent = "Quantity to Sell (- Shares)";
    if (priceLabel) priceLabel.textContent = "Sell Execution Price (â‚¹)";
  } else if (action === 'ADJUST') {
    if (btnAdjust) btnAdjust.className = "py-2 text-xs font-bold rounded-lg transition bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm";
    if (badge) { badge.textContent = "ADJUST EXACT"; badge.className = "text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-teal-500/15 text-teal-300"; }
    if (submitText) submitText.textContent = "Set Exact Position";
    if (qtyLabel) qtyLabel.textContent = "Exact Quantity Held";
    if (priceLabel) priceLabel.textContent = "Average Buy Price (â‚¹)";
  }

  updateTradePreview();
}

function onTradeTickerChange() {
  const input = document.getElementById("tradeTickerInput");
  const select = document.getElementById("tradeHoldingSelect");
  const priceInput = document.getElementById("tradePriceInput");

  const val = (input?.value || "").trim().toUpperCase();
  if (select) select.value = val;

  const holding = currentPortfolioData?.holdings?.find(h => h.ticker.toUpperCase() === val);
  if (holding && priceInput && (!priceInput.value || parseFloat(priceInput.value) === 0)) {
    priceInput.value = holding.price || holding.buyPrice || "";
  }
  updateTradePreview();
}

function onTradeSelectHolding(ticker) {
  if (!ticker) return;
  const input = document.getElementById("tradeTickerInput");
  const priceInput = document.getElementById("tradePriceInput");
  if (input) input.value = ticker;

  const holding = currentPortfolioData?.holdings?.find(h => h.ticker.toUpperCase() === ticker.toUpperCase());
  if (holding && priceInput) {
    priceInput.value = holding.price || holding.buyPrice || "";
  }
  updateTradePreview();
}

function updateTradePreview() {
  const ticker = (document.getElementById("tradeTickerInput")?.value || "").trim().toUpperCase();
  const tradeQty = Math.round(parseFloat(document.getElementById("tradeQuantityInput")?.value) || 0);
  const tradePrice = parseFloat(document.getElementById("tradePriceInput")?.value) || 0;

  const holding = currentPortfolioData?.holdings?.find(h => h.ticker.toUpperCase() === ticker);
  const oldQty = holding ? Math.round(holding.quantity) : 0;
  const oldPrice = holding ? holding.buyPrice : tradePrice;

  const previewQty = document.getElementById("previewQtyChange");
  const previewPrice = document.getElementById("previewPriceChange");
  const previewTotal = document.getElementById("previewTradeTotal");
  const warningNote = document.getElementById("tradeWarningNote");

  let newQty = oldQty;
  let newAvgPrice = oldPrice;
  let totalTradeVal = tradeQty * tradePrice;
  let warnText = "";

  if (currentTradeAction === 'BUY') {
    newQty = oldQty + tradeQty;
    if (newQty > 0) {
      newAvgPrice = ((oldQty * oldPrice) + (tradeQty * tradePrice)) / newQty;
    }
    if (oldQty === 0) {
      warnText = `âœ¨ Opening NEW position: ${tradeQty} shares of ${ticker || 'stock'} will be added to portfolio.`;
    }
  } else if (currentTradeAction === 'SELL') {
    if (tradeQty >= oldQty && oldQty > 0) {
      newQty = 0;
      newAvgPrice = 0;
      warnText = `âš ï¸ 100% Liquidation: Selling ${tradeQty} shares will completely close and remove ${ticker} from your portfolio.`;
    } else if (oldQty === 0) {
      warnText = `âš ï¸ You currently hold 0 shares of ${ticker || 'this stock'}. A sell trade cannot be executed.`;
    } else {
      newQty = oldQty - tradeQty;
      newAvgPrice = oldPrice;
      warnText = `â„¹ï¸ Trimming position: Realizes capital from ${tradeQty} shares. Purchase cost basis remains â‚¹${oldPrice.toFixed(2)}.`;
    }
  } else if (currentTradeAction === 'ADJUST') {
    newQty = tradeQty;
    newAvgPrice = tradePrice;
    if (tradeQty === 0) {
      warnText = `âš ï¸ Setting quantity to 0 will delete ${ticker} from portfolio.`;
    }
  }

  if (previewQty) previewQty.textContent = `${oldQty.toLocaleString('en-IN')} → ${newQty.toLocaleString('en-IN')} shares`;
  if (previewPrice) previewPrice.textContent = `₹${oldPrice.toFixed(2)} → ₹${newAvgPrice.toFixed(2)}`;
  if (previewTotal) previewTotal.textContent = formatINR(totalTradeVal);

  if (warningNote) {
    if (warnText) {
      warningNote.textContent = warnText;
      warningNote.classList.remove("hidden");
    } else {
      warningNote.classList.add("hidden");
    }
  }
}

// ========================================================
// PANIC SELL COGNITIVE INTERCEPTOR (KAHNEMAN SYSTEM 2 BRAKE)
// Protects 9-5 professionals from impulsive loss-booking
// ========================================================
let pendingPanicSellPayload = null;
let panicSellTimer = null;
let panicSellSecondsLeft = 15;
let tradeConfirmedViaInterceptor = false;

function openPanicSellInterceptor(holding, ticker, tradeQty, tradePrice) {
  pendingPanicSellPayload = { holding, ticker, tradeQty, tradePrice };

  const modal = document.getElementById("modalPanicSellInterceptor");
  if (!modal) return;

  // Set Stock Ticker
  const tickerEl = document.getElementById("interceptorStockTicker");
  if (tickerEl) tickerEl.textContent = ticker;

  // Reality Check 1: Market Beta vs Company Decay
  const betaEl = document.getElementById("interceptorBetaText");
  const pnlPct = holding ? (holding.unrealizedPnLPercent || 0) : 0;
  if (betaEl) {
    betaEl.textContent = `Nifty 50 and sectoral indices are experiencing macro beta consolidation. ${ticker}'s current dip (${pnlPct.toFixed(1)}%) is driven predominantly by market liquidity tides, NOT company failure.`;
  }

  // Reality Check 2: Moat & ROCE Health
  const moatEl = document.getElementById("interceptorMoatText");
  const audit = currentDiagnostics?.thesisAudit?.find(a => a.ticker === ticker);
  if (moatEl) {
    if (audit && audit.fundamentalMoat) {
      moatEl.textContent = `Fundamental Moat Verified: ${audit.fundamentalMoat}. Management's operating efficiency remains rock-solid.`;
    } else {
      moatEl.textContent = `Has ${ticker}'s competitive advantage or ROCE vanished today? No. Profitable businesses with low leverage continue compounding their earnings power uninterrupted.`;
    }
  }

  // Kahneman 15-second intentional cooling period
  panicSellSecondsLeft = 15;
  const timerBadge = document.getElementById("interceptorCountdownTimer");
  const overrideBtn = document.getElementById("btnOverridePanicSell");
  if (timerBadge) {
    timerBadge.textContent = "15s";
    timerBadge.className = "font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded";
  }
  if (overrideBtn) {
    overrideBtn.disabled = true;
    overrideBtn.textContent = "Proceed with Sell (Locked 15s)";
    overrideBtn.className = "px-3 py-2 bg-[#0f1b32] text-slate-500 border border-[#16233d] text-xs font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed";
  }

  if (panicSellTimer) clearInterval(panicSellTimer);
  panicSellTimer = setInterval(() => {
    panicSellSecondsLeft--;
    if (panicSellSecondsLeft > 0) {
      if (timerBadge) timerBadge.textContent = `${panicSellSecondsLeft}s`;
      if (overrideBtn) overrideBtn.textContent = `Proceed with Sell (Locked ${panicSellSecondsLeft}s)`;
    } else {
      clearInterval(panicSellTimer);
      panicSellTimer = null;
      if (timerBadge) {
        timerBadge.textContent = "Ready";
        timerBadge.className = "font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded";
      }
      if (overrideBtn) {
        overrideBtn.disabled = false;
        overrideBtn.textContent = "Proceed with Permanent Loss";
        overrideBtn.className = "px-3 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-semibold rounded-lg transition cursor-pointer";
      }
    }
  }, 1000);

  modal.classList.remove("hidden");
}

function closePanicSellInterceptor() {
  if (panicSellTimer) {
    clearInterval(panicSellTimer);
    panicSellTimer = null;
  }
  pendingPanicSellPayload = null;
  const modal = document.getElementById("modalPanicSellInterceptor");
  if (modal) modal.classList.add("hidden");
}

function confirmHoldWithConviction() {
  closePanicSellInterceptor();
  closeTradeModal();
  showToast("🛡️ Conviction Held: Prevented an impulsive market-hours bottom exit. Let your compounder compound!");
}

async function proceedWithSellExecution() {
  if (!pendingPanicSellPayload) return;
  tradeConfirmedViaInterceptor = true;
  closePanicSellInterceptor();
  await submitTradeModal();
  tradeConfirmedViaInterceptor = false;
}

async function submitTradeModal() {
  if (!currentPortfolioId) return alert("Please select a portfolio first.");

  const ticker = (document.getElementById("tradeTickerInput")?.value || "").trim().toUpperCase();
  const tradeQty = Math.round(parseFloat(document.getElementById("tradeQuantityInput")?.value) || 0);
  const tradePrice = parseFloat(document.getElementById("tradePriceInput")?.value) || 0;

  if (!ticker) return alert("Please enter or select a valid NSE stock symbol.");
  if (tradeQty <= 0) return alert("Quantity must be at least 1 whole share.");
  if (tradePrice <= 0) return alert("Trade price must be greater than 0.");

  // Behavioral Psychology Check: Panic Sell Interceptor (System 2 Brake)
  if (currentTradeAction === 'SELL' && !tradeConfirmedViaInterceptor) {
    const holding = currentPortfolioData?.holdings?.find(h => h.ticker.toUpperCase() === ticker);
    // Intercept if position has unrealized loss, or day PnL is red, or Work Shield is active
    if (holding && ((holding.unrealizedPnL || 0) < 0 || (holding.dayPnL || 0) < 0 || isWorkShieldActive)) {
      openPanicSellInterceptor(holding, ticker, tradeQty, tradePrice);
      return;
    }
  }

  const btn = document.getElementById("btnSubmitTrade");
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: ticker,
        action: currentTradeAction,
        quantity: tradeQty,
        tradePrice: tradePrice
      })
    });

    if (res.ok) {
      currentPortfolioData = await res.json();
      normalizePortfolioData(currentPortfolioData);
      renderPortfolioDetails(currentPortfolioData);
      closeTradeModal();
      showToast(`âœ… Trade executed: ${currentTradeAction} ${tradeQty} ${ticker} @ â‚¹${tradePrice.toFixed(2)}`);
    } else {
      const err = await res.json();
      alert(`Trade failed: ${err.error || "Please verify stock symbol and quantity."}`);
    }
  } catch (err) {
    console.error("Trade execution error:", err);
    alert("Network error executing trade.");
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ==========================================
// ANGEL ONE SMARTAPI INTEGRATION & AUTO-SYNC
// ==========================================
function openAngelOneModal() {
  const modal = document.getElementById("angelOneModal");
  if (!modal) return;

  const savedCode = localStorage.getItem("angelClientCode") || "";
  const savedKey = localStorage.getItem("angelApiKey") || "";
  const savedToken = localStorage.getItem("angelJwtToken") || "";
  const savedAutoSync = localStorage.getItem("angelAutoSync8h") === "true";

  const codeInput = document.getElementById("angelClientCode");
  const keyInput = document.getElementById("angelApiKey");
  const tokenInput = document.getElementById("angelJwtToken");
  const chkAuto = document.getElementById("chkAutoSync8Hours");

  if (codeInput) codeInput.value = savedCode;
  if (keyInput) keyInput.value = savedKey;
  if (tokenInput) tokenInput.value = savedToken;
  if (chkAuto) chkAuto.checked = savedAutoSync;

  switchAngelTab('excel');
  modal.classList.remove("hidden");
}

function closeAngelOneModal() {
  const modal = document.getElementById("angelOneModal");
  if (modal) modal.classList.add("hidden");
}

function switchAngelTab(tab) {
  const tabExcel = document.getElementById("tabAngelExcel");
  const tabSmartApi = document.getElementById("tabAngelSmartApi");
  const tabPaste = document.getElementById("tabAngelPaste");
  const contentExcel = document.getElementById("angelTabExcelContent");
  const contentSmartApi = document.getElementById("angelTabSmartApiContent");
  const contentPaste = document.getElementById("angelTabPasteContent");

  [tabExcel, tabSmartApi, tabPaste].forEach(t => {
    if (t) t.className = "pb-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition flex items-center space-x-1.5 whitespace-nowrap font-semibold";
  });
  [contentExcel, contentSmartApi, contentPaste].forEach(c => {
    if (c) c.classList.add("hidden");
  });

  if (tab === 'excel') {
    if (tabExcel) tabExcel.className = "pb-2 border-b-2 border-cyan-400 text-cyan-400 transition flex items-center space-x-1.5 whitespace-nowrap font-semibold";
    contentExcel?.classList.remove("hidden");
  } else if (tab === 'smartapi') {
    if (tabSmartApi) tabSmartApi.className = "pb-2 border-b-2 border-cyan-400 text-cyan-400 transition flex items-center space-x-1.5 whitespace-nowrap font-semibold";
    contentSmartApi?.classList.remove("hidden");
  } else if (tab === 'paste') {
    if (tabPaste) tabPaste.className = "pb-2 border-b-2 border-cyan-400 text-cyan-400 transition flex items-center space-x-1.5 whitespace-nowrap font-semibold";
    contentPaste?.classList.remove("hidden");
  }
}

let selectedExcelFile = null;
let selectedBrokerFile = null;
let currentBrokerImportMode = "Merge"; // "Merge" | "KeepSeparate" | "Replace"

function openBrokerImportModal() {
  openAngelOneModal();
}

function closeBrokerImportModal() {
  closeAngelOneModal();
}

function setBrokerImportMode(mode) {
  currentBrokerImportMode = mode;

  const cardMerge = document.getElementById("cardImportModeMerge");
  const cardKeep = document.getElementById("cardImportModeKeepSeparate");
  const cardReplace = document.getElementById("cardImportModeReplace");
  const rowNewName = document.getElementById("rowNewPortfolioName");
  const btnText = document.getElementById("btnSubmitBrokerImportText");

  // Reset all
  [cardMerge, cardKeep, cardReplace].forEach(c => {
    if (c) {
      c.className = "cursor-pointer p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition flex flex-col justify-between space-y-1.5";
    }
  });

  if (mode === "Merge") {
    if (cardMerge) cardMerge.className = "cursor-pointer p-3 rounded-xl border border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/15 transition flex flex-col justify-between space-y-1.5 shadow-sm";
    if (rowNewName) rowNewName.classList.add("hidden");
    if (btnText) btnText.textContent = "Import & Apply Holdings (Smart-Merge)";
  } else if (mode === "KeepSeparate") {
    if (cardKeep) cardKeep.className = "cursor-pointer p-3 rounded-xl border border-teal-500 bg-teal-500/10 hover:bg-teal-500/15 transition flex flex-col justify-between space-y-1.5 shadow-sm";
    if (rowNewName) rowNewName.classList.remove("hidden");
    if (btnText) btnText.textContent = "Import into New Dedicated Portfolio";
    const nameInput = document.getElementById("txtNewPortfolioName");
    if (nameInput && !nameInput.value) {
      nameInput.value = "Zerodha Portfolio";
    }
    nameInput?.focus();
  } else if (mode === "Replace") {
    if (cardReplace) cardReplace.className = "cursor-pointer p-3 rounded-xl border border-rose-500 bg-rose-500/10 hover:bg-rose-500/15 transition flex flex-col justify-between space-y-1.5 shadow-sm";
    if (rowNewName) rowNewName.classList.add("hidden");
    if (btnText) btnText.textContent = "Overwrite & Replace Active Portfolio";
  }
}

function handleBrokerFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  selectedBrokerFile = file;
  selectedExcelFile = file;

  const dropLabel = document.getElementById("dropzoneLabel");
  const dropSub = document.getElementById("dropzoneSub");
  const banner = document.getElementById("brokerDetectedBanner");
  const icon = document.getElementById("brokerDetectedIcon");
  const text = document.getElementById("brokerDetectedText");
  const size = document.getElementById("brokerDetectedFileSize");
  const txtNewName = document.getElementById("txtNewPortfolioName");

  const nameLower = file.name.toLowerCase();
  const isZerodha = nameLower.endsWith(".csv") || nameLower.includes("kite") || nameLower.includes("zerodha") || nameLower.includes("console");
  const detectedBroker = isZerodha ? "Zerodha" : "Angel One";

  if (dropLabel) {
    dropLabel.innerHTML = `Selected File: <strong class="text-white">${file.name}</strong>`;
  }
  if (dropSub) {
    dropSub.textContent = "Broker recognized. Choose your import strategy below and click apply.";
  }

  if (banner) {
    banner.classList.remove("hidden");
    if (isZerodha) {
      banner.className = "mt-2 p-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-200 flex items-center justify-between text-xs";
      if (icon) icon.className = "fa-solid fa-circle-check text-blue-400 text-sm";
      if (text) text.innerHTML = `<strong>Zerodha Kite / Console Export Detected</strong> (${file.name})`;
      if (txtNewName && (!txtNewName.value || txtNewName.value === "Angel One Portfolio")) {
        txtNewName.value = "Zerodha Portfolio";
      }
    } else {
      banner.className = "mt-2 p-2.5 rounded-xl border border-teal-500/40 bg-teal-500/10 text-teal-200 flex items-center justify-between text-xs";
      if (icon) icon.className = "fa-solid fa-circle-check text-teal-400 text-sm";
      if (text) text.innerHTML = `<strong>Angel One Demat Spreadsheet Detected</strong> (${file.name})`;
      if (txtNewName && (!txtNewName.value || txtNewName.value === "Zerodha Portfolio")) {
        txtNewName.value = "Angel One Portfolio";
      }
    }
    if (size) size.textContent = `${(file.size / 1024).toFixed(1)} KB`;
  }
}

function handleExcelFileSelected(event) {
  handleBrokerFileSelected(event);
}

function saveExcelPassword(pwd) {
  pwd = (pwd || "").trim();
  localStorage.setItem("angel_excel_password", pwd);
  const p1 = document.getElementById("angelExcelPassword");
  const p2 = document.getElementById("manageExcelPassword");
  if (p1 && p1.value !== pwd) p1.value = pwd;
  if (p2 && p2.value !== pwd) p2.value = pwd;
}

function getExcelPassword() {
  const p1 = document.getElementById("angelExcelPassword")?.value?.trim();
  const p2 = document.getElementById("manageExcelPassword")?.value?.trim();
  return p1 || p2 || localStorage.getItem("angel_excel_password") || "";
}

function togglePasswordVisibility(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  if (inp.type === "password") {
    inp.type = "text";
    btn.innerHTML = '<i class="fa-solid fa-eye-slash text-teal-400"></i>';
  } else {
    inp.type = "password";
    btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
  }
}

async function submitBrokerImport() {
  const fileToUpload = selectedBrokerFile || selectedExcelFile;
  if (!fileToUpload) {
    return alert("Please select a broker holdings file (.csv or .xlsx) from Zerodha or Angel One first.");
  }
  if (!currentPortfolioId && currentBrokerImportMode !== "KeepSeparate") {
    return alert("Please select or create an active portfolio first.");
  }

  const btn = document.getElementById("btnSubmitBrokerImport");
  const originalBtnHtml = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Processing ${fileToUpload.name}...`;
  }

  const pwd = getExcelPassword();
  const formData = new FormData();
  formData.append("file", fileToUpload);
  if (currentPortfolioId) formData.append("portfolioId", currentPortfolioId);
  formData.append("mode", currentBrokerImportMode);

  if (currentBrokerImportMode === "KeepSeparate") {
    const customName = document.getElementById("txtNewPortfolioName")?.value?.trim() || "Imported Broker Portfolio";
    formData.append("newPortfolioName", customName);
  }
  if (pwd) {
    formData.append("password", pwd);
  }

  try {
    const res = await fetch("/api/portfolios/import-broker", {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      closeAngelOneModal();

      if (currentBrokerImportMode === "KeepSeparate") {
        await loadPortfolios();
        if (data.portfolioId) {
          selectPortfolio(data.portfolioId);
        }
        showToast(`🎉 Created new portfolio "${data.portfolio?.name || 'Broker Portfolio'}" with ${data.totalParsed} positions from ${data.broker}!`);
      } else if (currentBrokerImportMode === "Merge") {
        currentPortfolioData = data.portfolio;
        normalizePortfolioData(currentPortfolioData);
        renderPortfolioDetails(currentPortfolioData);
        showToast(`🎉 Merged ${data.broker} holdings: ${data.overlappingMerged} overlapping positions updated with volume-weighted price, ${data.newPositionsAdded} new positions added! Total: ${data.totalPositionsAfter} stocks.`);
      } else {
        currentPortfolioData = data.portfolio;
        normalizePortfolioData(currentPortfolioData);
        renderPortfolioDetails(currentPortfolioData);
        showToast(`🎉 Replaced portfolio with ${data.totalParsed} positions from ${data.broker}!`);
      }
    } else {
      const err = await res.json().catch(() => ({}));
      const msg = err.error || "Please verify the broker file format.";
      alert(`Broker import failed: ${msg}`);
      if (msg.toLowerCase().includes("password")) {
        const inp = document.getElementById("angelExcelPassword") || document.getElementById("manageExcelPassword");
        inp?.focus();
      }
    }
  } catch (err) {
    console.error("Broker import error:", err);
    alert("Network error processing broker import.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

async function handleConfirmUploadExcel() {
  await submitBrokerImport();
}

async function handleAutoImportDownloadsExcel() {
  if (!currentPortfolioId) return alert("Please select a portfolio first.");

  const btn = document.getElementById("btnAutoImportExcel");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Auto-detecting...`;
  }

  const pwd = getExcelPassword();

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/import-angel-excel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: null, password: pwd || null })
    });

    if (res.ok) {
      const result = await res.json();
      currentPortfolioData = result.portfolio || result;
      normalizePortfolioData(currentPortfolioData);
      renderPortfolioDetails(currentPortfolioData);
      closeAngelOneModal();
      showToast(`🎉 Auto-imported ${result.positionsImported || currentPortfolioData.holdings.length} positions from latest download!`);
    } else {
      const err = await res.json();
      alert(`Auto-import failed: ${err.error || "Could not find recent download in Downloads folder."}`);
      if (err.error && err.error.toLowerCase().includes("password")) {
        const inp = document.getElementById("angelExcelPassword") || document.getElementById("manageExcelPassword");
        inp?.focus();
      }
    }
  } catch (err) {
    console.error("Auto import error:", err);
    alert("Network error running auto-import.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-bolt"></i> <span>1-Click Import Downloads</span>`;
    }
  }
}

async function handleFetchAngelSmartApi() {
  const code = (document.getElementById("angelClientCode")?.value || "").trim();
  const apiKey = (document.getElementById("angelApiKey")?.value || "").trim();
  const jwt = (document.getElementById("angelJwtToken")?.value || "").trim();
  const autoSync = document.getElementById("chkAutoSync8Hours")?.checked || false;

  if (!jwt) {
    return alert("Please enter your Angel One SmartAPI JWT Token (or use the 1-Click JSON Paste tab).");
  }

  localStorage.setItem("angelClientCode", code);
  localStorage.setItem("angelApiKey", apiKey);
  localStorage.setItem("angelJwtToken", jwt);
  localStorage.setItem("angelAutoSync8h", autoSync ? "true" : "false");

  const btn = document.getElementById("btnFetchAngelSmartApi");
  const icon = document.getElementById("angelFetchIcon");
  if (btn) btn.disabled = true;
  if (icon) icon.className = "fa-solid fa-spinner fa-spin";

  try {
    const response = await fetch("https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "X-PrivateKey": apiKey,
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "127.0.0.1",
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      await processAngelOnePayload(data);
    } else {
      showAngelOneFallbackPrompt();
    }
  } catch (err) {
    console.warn("Direct Angel One CORS fetch restriction detected; redirecting to 1-Click Paste mode:", err);
    showAngelOneFallbackPrompt();
  } finally {
    if (btn) btn.disabled = false;
    if (icon) icon.className = "fa-solid fa-cloud-arrow-down";
  }
}

function showAngelOneFallbackPrompt() {
  switchAngelTab('paste');
  alert("Notice: Direct browser requests to Angel One SmartAPI are protected by browser CORS security.\n\nSimply run the curl command or copy your Angel One getAllHolding response JSON into this paste box for instant 1-click synchronization!");
}

async function handleParseAngelJson() {
  const text = document.getElementById("angelJsonPaste")?.value || "";
  if (!text.trim()) return alert("Please paste Angel One JSON holdings text.");

  try {
    const parsed = JSON.parse(text);
    await processAngelOnePayload(parsed);
  } catch (e) {
    alert("Invalid JSON format. Please ensure you pasted valid JSON from Angel One's getAllHolding endpoint.");
  }
}

async function processAngelOnePayload(payload) {
  if (!currentPortfolioId) return alert("Please select a portfolio first.");

  let rawList = [];
  if (Array.isArray(payload)) {
    rawList = payload;
  } else if (payload.data && Array.isArray(payload.data)) {
    rawList = payload.data;
  } else if (payload.data && payload.data.holdings && Array.isArray(payload.data.holdings)) {
    rawList = payload.data.holdings;
  } else if (payload.holdings && Array.isArray(payload.holdings)) {
    rawList = payload.holdings;
  }

  if (rawList.length === 0) {
    return alert("No holdings found in the provided Angel One response.");
  }

  const items = rawList.map(item => {
    const symbol = item.tradingsymbol || item.tradingSymbol || item.symbol || item.ticker || "";
    const qty = Math.round(parseFloat(item.quantity || item.holdingquantity || item.qty || 0));
    const avgPrice = parseFloat(item.averageprice || item.avgprice || item.buyPrice || item.price || 0);
    const ltp = parseFloat(item.ltp || item.cmp || 0);

    return {
      tradingSymbol: symbol,
      quantity: qty,
      averagePrice: avgPrice,
      ltp: ltp > 0 ? ltp : null
    };
  }).filter(x => x.tradingSymbol && x.quantity > 0);

  if (items.length === 0) {
    return alert("Could not extract any active stock positions with quantity > 0.");
  }

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/sync-angelone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ holdings: items })
    });

    if (res.ok) {
      currentPortfolioData = await res.json();
      normalizePortfolioData(currentPortfolioData);
      renderPortfolioDetails(currentPortfolioData);
      closeAngelOneModal();
      showToast(`ðŸŽ‰ Successfully synced ${items.length} positions directly from Angel One!`);
    } else {
      const err = await res.json();
      alert(`Sync failed: ${err.error || "Please verify payload."}`);
    }
  } catch (e) {
    console.error("Sync error:", e);
    alert("Network error updating portfolio from Angel One.");
  }
}

let hasCheckedAutoSync = false;
async function checkAndTrigger8HourAutoSync() {
  if (hasCheckedAutoSync) return;
  hasCheckedAutoSync = true;

  const autoEnabled = localStorage.getItem("angelAutoSync8h") === "true";
  const jwt = localStorage.getItem("angelJwtToken");
  const apiKey = localStorage.getItem("angelApiKey");

  if (!autoEnabled || !jwt || !apiKey || !currentPortfolioId) return;

  console.log("Triggering 8-hour automated background sync with Angel One...");
  try {
    const response = await fetch("https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "X-PrivateKey": apiKey,
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "127.0.0.1",
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json();
      await processAngelOnePayload(data);
      showToast("ðŸŸ¢ Auto-synced with Angel One (8-hour freshness trigger)");
    }
  } catch (err) {
    console.log("Auto-sync background check deferred.");
  }
}

function showToast(msg) {
  let toast = document.getElementById("appToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = "fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 flex items-center space-x-2";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> <span>${msg}</span>`;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
  }, 4500);
}

// Manage View Excel & Broker Handlers
async function detectAndImportAngelExcel() {
  await handleAutoImportDownloadsExcel();
}

async function handleExcelUpload(event) {
  await handleExcelFileSelected(event);
  await handleConfirmUploadExcel();
}

// Explicit window bindings for HTML onclick event handlers
window.openBrokerImportModal = openBrokerImportModal;
window.closeBrokerImportModal = closeBrokerImportModal;
window.setBrokerImportMode = setBrokerImportMode;
window.handleBrokerFileSelected = handleBrokerFileSelected;
window.submitBrokerImport = submitBrokerImport;
window.saveExcelPassword = saveExcelPassword;
window.getExcelPassword = getExcelPassword;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleExcelFileSelected = handleExcelFileSelected;
window.handleConfirmUploadExcel = handleConfirmUploadExcel;
window.handleAutoImportDownloadsExcel = handleAutoImportDownloadsExcel;
window.detectAndImportAngelExcel = detectAndImportAngelExcel;
window.handleExcelUpload = handleExcelUpload;
window.openFinancialExplainer = openFinancialExplainer;
window.closeFinancialExplainer = closeFinancialExplainer;
window.openAngelOneModal = openAngelOneModal;
window.closeAngelOneModal = closeAngelOneModal;
window.openTradeModal = openTradeModal;
window.closeTradeModal = closeTradeModal;
window.submitTradeModal = submitTradeModal;
window.setTradeAction = setTradeAction;
window.switchAngelTab = switchAngelTab;
window.handleFetchAngelSmartApi = handleFetchAngelSmartApi;
window.handleParseAngelJson = handleParseAngelJson;
window.handleSyncLiveQuotes = handleSyncLiveQuotes;
window.navigateTo = navigateTo;
window.applySectorPreset = applySectorPreset;
window.clearDiagnosticFilter = clearDiagnosticFilter;
window.quickInspectTicker = quickInspectTicker;
window.inspectFromRow = inspectFromRow;
window.handleRemoveHolding = handleRemoveHolding;
window.handleTogglePrivacy = handleTogglePrivacy;
window.sortHoldings = sortHoldings;
window.switchChartTimeframe = switchChartTimeframe;
window.loadAndRenderStockChart = loadAndRenderStockChart;

// ========================================================
// PRICE ALERTS & MARKET SURVEILLANCE DESK
// ========================================================
let activeAlertModalCmp = 0;
let cachedEmailSettings = null;

async function openCreateAlertModal(ticker, cmp, targetPrice = null, direction = null) {
  const modal = document.getElementById("createAlertModal");
  if (!modal) return;

  activeAlertModalCmp = parseFloat(cmp) || 0;
  document.getElementById("alertInputTicker").value = ticker;
  document.getElementById("alertModalTickerBadge").textContent = ticker;
  document.getElementById("alertModalCmpText").textContent = `₹${activeAlertModalCmp.toFixed(2)}`;
  
  const targetInput = document.getElementById("alertInputTargetPrice");
  if (targetPrice != null && parseFloat(targetPrice) > 0) {
    targetInput.value = parseFloat(targetPrice).toFixed(2);
    setAlertDirection(direction || (parseFloat(targetPrice) >= activeAlertModalCmp ? 'CrossesAbove' : 'CrossesBelow'));
  } else {
    // Default target price +2%
    const defaultTarget = (activeAlertModalCmp * 1.02).toFixed(2);
    targetInput.value = defaultTarget;
    setAlertDirection('CrossesAbove');
  }

  updateAlertDeltaHint();

  // Load default email if available
  if (!cachedEmailSettings) {
    try {
      const res = await fetch('/api/alerts/settings');
      if (res.ok) cachedEmailSettings = await res.json();
    } catch (e) {}
  }
  const emailInput = document.getElementById("alertInputRecipientEmail");
  if (emailInput && !emailInput.value && cachedEmailSettings?.defaultRecipientEmail) {
    emailInput.value = cachedEmailSettings.defaultRecipientEmail;
  }

  modal.classList.remove("hidden");
  targetInput.focus();
}

function closeCreateAlertModal() {
  document.getElementById("createAlertModal")?.classList.add("hidden");
}

function setAlertDirection(dir) {
  document.getElementById("alertInputDirection").value = dir;
  const btnAbove = document.getElementById("btnDirAbove");
  const btnBelow = document.getElementById("btnDirBelow");
  if (!btnAbove || !btnBelow) return;
  if (dir === 'CrossesAbove') {
    btnAbove.className = "py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    btnBelow.className = "py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-950";
  } else {
    btnBelow.className = "py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition bg-rose-500/15 text-rose-300 border-rose-500/40";
    btnAbove.className = "py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-950";
  }
}

function setAlertOffsetPercent(pct) {
  if (!activeAlertModalCmp || activeAlertModalCmp <= 0) return;
  const newTarget = (activeAlertModalCmp * (1 + (pct / 100))).toFixed(2);
  document.getElementById("alertInputTargetPrice").value = newTarget;
  if (pct >= 0) {
    setAlertDirection('CrossesAbove');
  } else {
    setAlertDirection('CrossesBelow');
  }
  updateAlertDeltaHint();
}

function updateAlertDeltaHint() {
  const targetVal = parseFloat(document.getElementById("alertInputTargetPrice").value);
  const hintSpan = document.getElementById("alertDeltaHint");
  if (!hintSpan || !activeAlertModalCmp || isNaN(targetVal)) return;

  const deltaPct = ((targetVal - activeAlertModalCmp) / activeAlertModalCmp) * 100;
  const sign = deltaPct >= 0 ? '+' : '';
  hintSpan.textContent = `${sign}${deltaPct.toFixed(1)}% from CMP`;
  hintSpan.className = `text-[10px] font-mono ${deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
}

async function handleCreateAlertSubmit(event) {
  event.preventDefault();
  const ticker = document.getElementById("alertInputTicker").value.trim().toUpperCase();
  const targetPrice = parseFloat(document.getElementById("alertInputTargetPrice").value);
  const directionStr = document.getElementById("alertInputDirection").value;
  const recipientEmail = document.getElementById("alertInputRecipientEmail").value.trim();
  const notes = document.getElementById("alertInputNotes").value.trim();

  const direction = directionStr === 'CrossesBelow' ? 2 : 1;

  try {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker,
        targetPrice,
        direction,
        recipientEmail,
        notes
      })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(`Error creating price alert: ${err.message || 'Validation failed'}`);
      return;
    }

    closeCreateAlertModal();
    updateHeaderAlertsBadge();
    alert(`✓ Active price alert set for ${ticker} at ₹${targetPrice}! You will receive an email when CMP crosses this threshold.`);
  } catch (err) {
    console.error("Error creating price alert:", err);
    alert(`Failed to set alert: ${err.message || err}`);
  }
}

async function openAlertsModal() {
  const modal = document.getElementById("alertsManagementModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  switchAlertsTab('active');
  await loadMarketHoursStatus();
  await loadPriceAlerts();
}

function closeAlertsModal() {
  document.getElementById("alertsManagementModal")?.classList.add("hidden");
}

function switchAlertsTab(tab) {
  const tabs = ['active', 'triggered', 'settings'];
  tabs.forEach(t => {
    const content = document.getElementById(`tabContent${t.charAt(0).toUpperCase() + t.slice(1)}Alerts`) || document.getElementById(`tabContentEmailSettings`);
    if (t === tab) {
      content?.classList.remove("hidden");
    } else {
      content?.classList.add("hidden");
    }
  });

  const btnActive = document.getElementById("btnTabActiveAlerts");
  const btnTriggered = document.getElementById("btnTabTriggeredAlerts");
  const btnSettings = document.getElementById("btnTabEmailSettings");

  if (!btnActive || !btnTriggered || !btnSettings) return;

  if (tab === 'active') {
    btnActive.className = "alerts-tab-btn pb-2 font-semibold text-teal-400 border-b-2 border-teal-400 flex items-center space-x-1.5";
    btnTriggered.className = "alerts-tab-btn pb-2 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5 transition";
    btnSettings.className = "alerts-tab-btn pb-2 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5 transition";
    loadPriceAlerts();
  } else if (tab === 'triggered') {
    btnActive.className = "alerts-tab-btn pb-2 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5 transition";
    btnTriggered.className = "alerts-tab-btn pb-2 font-semibold text-teal-400 border-b-2 border-teal-400 flex items-center space-x-1.5";
    btnSettings.className = "alerts-tab-btn pb-2 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5 transition";
    loadPriceAlerts();
  } else {
    btnActive.className = "alerts-tab-btn pb-2 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5 transition";
    btnTriggered.className = "alerts-tab-btn pb-2 font-medium text-slate-400 hover:text-slate-200 border-b-2 border-transparent flex items-center space-x-1.5 transition";
    btnSettings.className = "alerts-tab-btn pb-2 font-semibold text-teal-400 border-b-2 border-teal-400 flex items-center space-x-1.5";
    loadEmailSettings();
  }
}

async function loadPriceAlerts() {
  try {
    const res = await fetch('/api/alerts');
    if (!res.ok) return;
    const alerts = await res.json();

    const active = alerts.filter(a => a.status === 1 || a.status === 'Active');
    const triggered = alerts.filter(a => a.status === 2 || a.status === 'Triggered');

    const badgeActive = document.getElementById("badgeActiveAlertsCount");
    const badgeTriggered = document.getElementById("badgeTriggeredAlertsCount");
    if (badgeActive) badgeActive.textContent = active.length;
    if (badgeTriggered) badgeTriggered.textContent = triggered.length;
    updateHeaderAlertsBadge(active.length);

    renderActiveAlerts(active);
    renderTriggeredAlerts(triggered);
  } catch (err) {
    console.error("Error loading alerts:", err);
  }
}

function renderActiveAlerts(alerts) {
  const container = document.getElementById("activeAlertsList");
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
        <i class="fa-solid fa-bell-slash text-slate-600 text-2xl"></i>
        <h4 class="text-sm font-bold text-slate-300">No Active Price Alerts</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          Navigate to Discover Stocks or your Portfolio table and click &ldquo;Set Alert&rdquo; on any stock to monitor target breakouts and dips.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(a => {
    const isAbove = a.direction === 1 || a.direction === 'CrossesAbove';
    const dirBadge = isAbove
      ? `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><i class="fa-solid fa-arrow-trend-up mr-1"></i>Crosses Above</span>`
      : `<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30"><i class="fa-solid fa-arrow-trend-down mr-1"></i>Crosses Below</span>`;

    return `
      <div class="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition shadow-sm">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="font-extrabold font-mono text-white text-sm">${a.ticker}</span>
            <span class="text-xs text-slate-400">${a.companyName || ''}</span>
            ${dirBadge}
          </div>
          <div class="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 font-mono">
            <span>Target: <strong class="text-white">₹${a.targetPrice?.toFixed(2)}</strong></span>
            <span>Initial: <strong class="text-slate-300">₹${a.initialPrice?.toFixed(2)}</strong></span>
            ${a.recipientEmail ? `<span>Email: <strong class="text-teal-400">${a.recipientEmail}</strong></span>` : ''}
          </div>
          ${a.notes ? `<div class="text-[11px] text-slate-300 italic">Note: &ldquo;${a.notes}&rdquo;</div>` : ''}
        </div>
        <div class="flex items-center space-x-2 self-end sm:self-center">
          <button type="button" onclick="quickInspectTicker('${a.ticker}'); closeAlertsModal();" class="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 text-xs font-semibold border border-slate-700 transition" title="Inspect ${a.ticker}">
            Inspect
          </button>
          <button type="button" onclick="handleDeleteAlert('${a.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-semibold border border-rose-500/30 transition" title="Delete Alert">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderTriggeredAlerts(alerts) {
  const container = document.getElementById("triggeredAlertsList");
  if (!container) return;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
        <i class="fa-solid fa-clock-rotate-left text-slate-600 text-2xl"></i>
        <h4 class="text-sm font-bold text-slate-300">No Triggered Alerts</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          When an active alert threshold is crossed, it will be executed and recorded here with the execution timestamp and triggered price.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map(a => {
    const isAbove = a.direction === 1 || a.direction === 'CrossesAbove';
    const dateStr = a.triggeredAtUtc ? new Date(a.triggeredAtUtc).toLocaleString('en-IN') : 'Triggered';

    return `
      <div class="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-90">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="font-extrabold font-mono text-white text-sm">${a.ticker}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <i class="fa-solid fa-check mr-1"></i>Executed
            </span>
            <span class="text-[11px] text-slate-400 font-mono">${dateStr}</span>
          </div>
          <div class="text-[11px] text-slate-300 flex flex-wrap items-center gap-3 font-mono">
            <span>Triggered CMP: <strong class="text-teal-400">₹${a.triggeredPrice?.toFixed(2) || 'N/A'}</strong></span>
            <span>Target: <strong class="text-white">₹${a.targetPrice?.toFixed(2)}</strong></span>
            <span>(${isAbove ? 'Crossed Above' : 'Crossed Below'})</span>
          </div>
        </div>
        <div class="flex items-center space-x-2 self-end sm:self-center">
          <button type="button" onclick="handleToggleAlert('${a.id}', true)" class="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 text-xs font-semibold border border-teal-500/30 transition" title="Reactivate this alert">
            Reactivate
          </button>
          <button type="button" onclick="handleDeleteAlert('${a.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 text-rose-300 text-xs font-semibold border border-rose-500/30 transition">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function handleDeleteAlert(id) {
  if (!confirm("Are you sure you want to delete this price alert?")) return;
  try {
    const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadPriceAlerts();
    }
  } catch (err) {
    console.error("Error deleting alert:", err);
  }
}

async function handleToggleAlert(id, active) {
  try {
    const res = await fetch(`/api/alerts/${id}/toggle?active=${active}`, { method: 'POST' });
    if (res.ok) {
      loadPriceAlerts();
    }
  } catch (err) {
    console.error("Error toggling alert:", err);
  }
}

async function loadMarketHoursStatus() {
  try {
    const res = await fetch('/api/alerts/status');
    if (!res.ok) return;
    const status = await res.json();

    const pill = document.getElementById("marketSurveillancePill");
    if (pill) {
      if (status.isMarketOpen) {
        pill.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
        pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>Market Live (09:15 - 15:30 IST)`;
      } else {
        pill.className = "px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700";
        pill.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block mr-1"></span>${status.sessionName}`;
      }
    }

    const istTime = document.getElementById("lblCurrentIstTime");
    const session = document.getElementById("lblMarketSessionName");
    const cadence = document.getElementById("lblSurveillanceCadence");
    if (istTime) istTime.textContent = status.currentIstTime || '--';
    if (session) session.textContent = status.sessionName || '--';
    if (cadence) cadence.textContent = `Schedule: ${status.nextScheduledCheck}`;
  } catch (err) {
    console.error("Error loading market hours status:", err);
  }
}

async function handleManualAlertEvaluation() {
  const icon = document.getElementById("iconManualEval");
  icon?.classList.add("fa-spin");
  try {
    const res = await fetch('/api/alerts/evaluate-now', { method: 'POST' });
    if (!res.ok) {
      alert("Error triggering surveillance check.");
      return;
    }
    const data = await res.json();
    alert(`✓ ${data.message}`);
    loadPriceAlerts();
    loadMarketHoursStatus();
  } catch (err) {
    console.error("Error evaluating alerts:", err);
    alert(`Failed surveillance check: ${err.message || err}`);
  } finally {
    icon?.classList.remove("fa-spin");
  }
}

async function loadEmailSettings() {
  try {
    const res = await fetch('/api/alerts/settings');
    if (!res.ok) return;
    const s = await res.json();
    cachedEmailSettings = s;

    document.getElementById("smtpHostInput").value = s.smtpHost || '';
    document.getElementById("smtpPortInput").value = s.smtpPort || 587;
    document.getElementById("smtpUserInput").value = s.userName || '';
    document.getElementById("smtpPassInput").value = s.password || '';
    document.getElementById("defaultRecipientInput").value = s.defaultRecipientEmail || '';
    document.getElementById("chkMarketHoursOnly").checked = s.runOnlyDuringMarketHours !== false;
    document.getElementById("checkIntervalInput").value = s.checkIntervalSeconds || 60;
  } catch (err) {
    console.error("Error loading email settings:", err);
  }
}

async function handleSaveEmailSettings(event) {
  event.preventDefault();
  const settings = {
    smtpHost: document.getElementById("smtpHostInput").value.trim(),
    smtpPort: parseInt(document.getElementById("smtpPortInput").value) || 587,
    enableSsl: true,
    userName: document.getElementById("smtpUserInput").value.trim(),
    password: document.getElementById("smtpPassInput").value,
    senderEmail: document.getElementById("smtpUserInput").value.trim(),
    senderName: "Portfolio Rebalancer Alert Desk",
    defaultRecipientEmail: document.getElementById("defaultRecipientInput").value.trim(),
    runOnlyDuringMarketHours: document.getElementById("chkMarketHoursOnly").checked,
    checkIntervalSeconds: parseInt(document.getElementById("checkIntervalInput").value) || 60
  };

  try {
    const res = await fetch('/api/alerts/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    if (!res.ok) {
      alert("Failed saving email settings.");
      return;
    }

    cachedEmailSettings = settings;
    alert("✓ Email dispatcher and surveillance settings saved successfully!");
  } catch (err) {
    console.error("Error saving email settings:", err);
    alert(`Failed saving settings: ${err.message || err}`);
  }
}

async function handleSendTestEmail() {
  const recipient = document.getElementById("defaultRecipientInput").value.trim() || 
                    document.getElementById("smtpUserInput").value.trim();

  if (!recipient) {
    alert("Please enter a Default Alert Recipient Email first.");
    return;
  }

  try {
    const res = await fetch('/api/alerts/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail: recipient })
    });

    const data = await res.json();
    alert(data.message || (data.success ? "Test email dispatched!" : "Delivery test failed."));
  } catch (err) {
    console.error("Error sending test email:", err);
    alert(`Test email error: ${err.message || err}`);
  }
}

async function updateHeaderAlertsBadge(count) {
  const badge = document.getElementById("headerAlertsCountBadge");
  if (!badge) return;

  if (count === undefined) {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const list = await res.json();
        count = list.filter(a => a.status === 1 || a.status === 'Active').length;
      }
    } catch (e) {
      count = 0;
    }
  }

  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

// ========================================================
// INSTITUTIONAL 1-2 MONTH SWING RADAR FEED
// ========================================================
async function loadSwingRadarFeed() {
  const container = document.getElementById("swingRadarContainer");
  if (!container) return;
  const icon = document.getElementById("iconRefreshSwing");
  icon?.classList.add("fa-spin");

  try {
    const res = await fetch('/api/stocks/swing-radar');
    if (!res.ok) {
      container.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-rose-400">Failed to load swing radar feed.</div>`;
      return;
    }
    const radarData = await res.json();
    if (!radarData || radarData.length === 0) {
      container.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-slate-400">No active swing setups detected in current scan.</div>`;
      return;
    }

    container.innerHTML = radarData.map(item => {
      const tf = item.technoFunda || item.TechnoFunda;
      const swing = tf?.swingSignal || tf?.SwingSignal;
      if (!swing) return "";

      const isTriggered = swing.status === 'TRIGGERED';
      const isForming = swing.status === 'FORMING';
      const statusClass = isTriggered 
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
        : (isForming ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-800 text-slate-300 border-slate-700");
      const statusText = isTriggered ? "ACTIVE PIVOT" : (isForming ? "FORMING SQUEEZE" : "WATCHLIST");

      const teamPill = swing.winningTeam?.includes('Alpha')
        ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">Alpha VCP</span>`
        : `<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">Beta VDU</span>`;

      return `
        <div class="p-4 bg-[#0a1222]/90 rounded-xl border border-[#16233d] hover:border-cyan-500/40 transition shadow-sm space-y-2.5 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-black text-white">${item.ticker}</span>
                <span class="text-xs font-mono text-slate-300">₹${item.currentPrice.toFixed(2)}</span>
                ${teamPill}
              </div>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${statusClass} border uppercase">
                ${statusText}
              </span>
            </div>

            <div class="text-xs text-slate-200 font-semibold truncate">
              ${swing.setupType}
            </div>

            <div class="grid grid-cols-3 gap-1 text-center font-mono text-[10px] bg-[#060c18] p-1.5 rounded-lg border border-[#16233d]">
              <div>
                <span class="text-slate-400 block text-[8px] uppercase">Target (+${swing.targetGainPercent}%)</span>
                <span class="text-emerald-300 font-bold">₹${swing.targetPrice.toFixed(2)}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[8px] uppercase">Stop (-${swing.stopLossPercent}%)</span>
                <span class="text-rose-300 font-bold">₹${swing.stopLossPrice.toFixed(2)}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[8px] uppercase">R : R</span>
                <span class="text-cyan-300 font-bold">1 : ${swing.riskRewardRatio}</span>
              </div>
            </div>

            <div class="text-[10px] text-slate-400 line-clamp-2">
              ${(swing.triggers && swing.triggers.length > 0) ? swing.triggers[0] : 'Institutional volume absorption underway.'}
            </div>
          </div>

          <div class="pt-2 border-t border-[#16233d] flex items-center justify-between gap-1 text-[11px]">
            <button type="button" onclick="quickInspectTicker('${item.ticker}')" class="px-2.5 py-1 rounded bg-[#0f1b32] hover:bg-[#16233d] text-cyan-300 transition font-semibold flex items-center space-x-1">
              <i class="fa-solid fa-chart-line text-[10px]"></i>
              <span>Inspect &amp; Chart</span>
            </button>
            <button type="button" onclick="openCreateAlertModal('${item.ticker}', ${item.currentPrice}, ${swing.targetPrice}, 'CrossesAbove')" class="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition font-semibold flex items-center space-x-1">
              <i class="fa-solid fa-bell text-[10px]"></i>
              <span>Set Alert</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error loading swing radar:", err);
    container.innerHTML = `<div class="col-span-full py-6 text-center text-xs text-rose-400">Error loading swing radar: ${err.message || err}</div>`;
  } finally {
    icon?.classList.remove("fa-spin");
  }
}

// ========================================================
// PORTFOLIO 1-2 MONTH SWING RADAR & HEALTH SORTER
// ========================================================
let cachedPortSwingRadarData = null;

async function openPortfolioSwingRadarModal() {
  const modal = document.getElementById("portfolioSwingRadarModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  await loadPortfolioSwingRadar();
}

function closePortfolioSwingRadarModal() {
  document.getElementById("portfolioSwingRadarModal")?.classList.add("hidden");
}

function switchPortSwingTab(tab) {
  const tabs = ['active', 'forming', 'stage2', 'stage4'];
  tabs.forEach(t => {
    const content = document.getElementById(`portSwingTabContent${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btn = document.getElementById(`btnTabPort${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (t === tab) {
      content?.classList.remove("hidden");
      if (btn) {
        btn.className = "pb-3 border-b-2 border-teal-400 text-teal-300 flex items-center space-x-1.5 font-bold";
      }
    } else {
      content?.classList.add("hidden");
      if (btn) {
        btn.className = "pb-3 border-b-2 border-transparent text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 transition font-semibold";
      }
    }
  });
}

async function loadPortfolioSwingRadar() {
  if (!currentPortfolioId) {
    alert("Please select an active portfolio first.");
    return;
  }

  const icon = document.getElementById("iconRefreshPortSwing");
  icon?.classList.add("fa-spin");

  const cActive = document.getElementById("portSwingTabContentActive");
  const cForming = document.getElementById("portSwingTabContentForming");
  const cStage2 = document.getElementById("portSwingTabContentStage2");
  const cStage4 = document.getElementById("portSwingTabContentStage4");

  if (cActive) cActive.innerHTML = `<div class="py-8 text-center text-xs text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-teal-400 mr-2"></i>Scanning your portfolio holdings with institutional VCP & VDU models...</div>`;

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/swing-radar`);
    if (!res.ok) {
      if (cActive) cActive.innerHTML = `<div class="py-8 text-center text-xs text-rose-400">Failed to analyze portfolio holdings.</div>`;
      return;
    }

    const data = await res.json();
    cachedPortSwingRadarData = data;

    // Update Badges
    document.getElementById("badgePortActiveCount").textContent = data.activeSetupsCount || 0;
    document.getElementById("badgePortFormingCount").textContent = data.formingSetupsCount || 0;
    document.getElementById("badgePortStage2Count").textContent = data.stage2Leaders?.length || 0;
    document.getElementById("badgePortStage4Count").textContent = data.stage4RiskCount || 0;

    // Render Tab 1: Active Setups
    if (cActive) {
      if (!data.activeSetups || data.activeSetups.length === 0) {
        cActive.innerHTML = `
          <div class="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <i class="fa-solid fa-bolt-slash text-slate-600 text-2xl"></i>
            <h4 class="text-sm font-bold text-slate-300">No Triggered Buy Pivots in Portfolio Right Now</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">
              Check the <strong>Forming Squeezes</strong> tab to view holdings developing late-stage contraction handles, or browse the <strong>Discover</strong> radar for open-market setups.
            </p>
          </div>
        `;
      } else {
        cActive.innerHTML = data.activeSetups.map(h => renderPortfolioSwingCard(h, 'TRIGGERED')).join('');
      }
    }

    // Render Tab 2: Forming Squeezes
    if (cForming) {
      if (!data.formingSetups || data.formingSetups.length === 0) {
        cForming.innerHTML = `<div class="p-8 text-center text-xs text-slate-500">No late-stage contraction handles forming currently.</div>`;
      } else {
        cForming.innerHTML = data.formingSetups.map(h => renderPortfolioSwingCard(h, 'FORMING')).join('');
      }
    }

    // Render Tab 3: Stage 2 Leaders
    if (cStage2) {
      if (!data.stage2Leaders || data.stage2Leaders.length === 0) {
        cStage2.innerHTML = `<div class="p-8 text-center text-xs text-slate-500">No holdings currently meet strict Minervini Stage 2 criteria.</div>`;
      } else {
        cStage2.innerHTML = `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${data.stage2Leaders.map(h => `
              <div class="p-3.5 bg-slate-950/80 rounded-xl border border-teal-500/30 flex items-center justify-between">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-bold text-white">${h.ticker}</span>
                    <span class="text-xs font-mono text-emerald-400 font-semibold">${h.unrealizedPnLPercent >= 0 ? '+' : ''}${h.unrealizedPnLPercent.toFixed(1)}%</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">${h.name} &bull; ${h.sector} (Weight: ${h.weightPercent.toFixed(1)}%)</p>
                  <p class="text-[10px] text-teal-400 mt-1 font-mono">${h.timingVerdict}</p>
                </div>
                <button type="button" onclick="quickInspectTicker('${h.ticker}')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs font-semibold transition">
                  Chart
                </button>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // Render Tab 4: Stage 4 Markdown Risks
    if (cStage4) {
      if (!data.stage4Risks || data.stage4Risks.length === 0) {
        cStage4.innerHTML = `<div class="p-8 text-center text-xs text-emerald-400">Great job! No severe Stage 4 markdown stocks detected in your portfolio.</div>`;
      } else {
        cStage4.innerHTML = `
          <div class="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs text-rose-300 space-y-1 mb-2">
            <div class="font-bold flex items-center"><i class="fa-solid fa-triangle-exclamation mr-1.5"></i> Capital Preservation Alert: 55 Holdings Trapped in Stage 4 Downtrends</div>
            <p class="text-[11px] text-rose-200/80">These holdings are trading below both 50 and 200 SMAs. Rather than averaging down into falling knives, our quantitative engine recommends pruning or rotating into Stage 2 momentum leaders.</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${data.stage4Risks.map(h => `
              <div class="p-3 bg-slate-950/90 rounded-xl border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-bold text-white">${h.ticker}</span>
                    <span class="text-xs font-mono font-bold text-rose-400">${h.unrealizedPnLPercent.toFixed(1)}% P&L</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">${h.name} &bull; CMP: ₹${h.currentPrice.toFixed(2)} (Weight: ${h.weightPercent.toFixed(1)}%)</p>
                  <span class="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">Stage 4 Markdown</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <button type="button" onclick="quickInspectTicker('${h.ticker}')" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition">
                    Inspect
                  </button>
                  <button type="button" onclick="openCreateAlertModal('${h.ticker}', ${h.currentPrice})" class="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-xs transition">
                    Alert
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

  } catch (err) {
    console.error("Error loading portfolio swing radar:", err);
    if (cActive) cActive.innerHTML = `<div class="py-8 text-center text-xs text-rose-400">Error: ${err.message || err}</div>`;
  } finally {
    icon?.classList.remove("fa-spin");
  }
}

function renderPortfolioSwingCard(h, status) {
  const sw = h.swingSignal;
  if (!sw) return "";
  const isTriggered = status === 'TRIGGERED';
  const badgeClass = isTriggered
    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
    : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
  const badgeText = isTriggered ? "ACTIVE BUY PIVOT" : "FORMING SQUEEZE";

  return `
    <div class="p-4 bg-[#0a1222]/90 rounded-xl border border-[#16233d] hover:border-cyan-500/40 transition space-y-3 shadow-md">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#16233d] pb-2.5">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-sm font-bold">
            ${h.ticker.slice(0, 2)}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-black text-white">${h.ticker}</span>
              <span class="text-xs text-slate-400">(${h.name})</span>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${badgeClass} border uppercase">
                ${badgeText}
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">${h.sector} &bull; Portfolio Weight: <strong class="text-slate-200">${h.weightPercent.toFixed(1)}%</strong> &bull; Holding Horizon: <strong class="text-cyan-300">${sw.timeHorizon}</strong></p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button type="button" onclick="quickInspectTicker('${h.ticker}')" class="px-2.5 py-1.5 rounded-lg bg-[#0f1b32] hover:bg-[#16233d] text-cyan-400 text-xs font-semibold transition">
            <i class="fa-solid fa-chart-line mr-1"></i> Chart
          </button>
          <button type="button" onclick="openCreateAlertModal('${h.ticker}', ${h.currentPrice}, ${sw.targetPrice}, 'CrossesAbove')" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1 transition shadow-sm">
            <i class="fa-solid fa-bell"></i>
            <span>Target Alert (₹${sw.targetPrice.toFixed(2)})</span>
          </button>
          <button type="button" onclick="openCreateAlertModal('${h.ticker}', ${h.currentPrice}, ${sw.stopLossPrice}, 'CrossesBelow')" class="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center space-x-1 transition shadow-sm">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Stop Alert (₹${sw.stopLossPrice.toFixed(2)})</span>
          </button>
        </div>
      </div>

      <!-- Parameters Strip -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] font-mono">
        <div class="bg-[#060c18] p-2 rounded-lg border border-[#16233d]">
          <span class="text-slate-500 block text-[9px] uppercase">CMP / Entry</span>
          <span class="font-bold text-white text-xs mt-0.5 block">₹${h.currentPrice.toFixed(2)}</span>
        </div>
        <div class="bg-[#060c18] p-2 rounded-lg border border-emerald-500/30">
          <span class="text-emerald-400 block text-[9px] uppercase">Swing Target</span>
          <span class="font-bold text-emerald-300 text-xs mt-0.5 block">₹${sw.targetPrice.toFixed(2)} (+${sw.targetGainPercent}%)</span>
        </div>
        <div class="bg-[#060c18] p-2 rounded-lg border border-rose-500/30">
          <span class="text-rose-400 block text-[9px] uppercase">Stop Loss</span>
          <span class="font-bold text-rose-300 text-xs mt-0.5 block">₹${sw.stopLossPrice.toFixed(2)} (-${sw.stopLossPercent}%)</span>
        </div>
        <div class="bg-[#060c18] p-2 rounded-lg border border-[#16233d]">
          <span class="text-slate-500 block text-[9px] uppercase">Risk / Reward</span>
          <span class="font-bold text-cyan-300 text-xs mt-0.5 block">1 : ${sw.riskRewardRatio}</span>
        </div>
        <div class="bg-[#060c18] p-2 rounded-lg border border-[#16233d] col-span-2 sm:col-span-1">
          <span class="text-slate-500 block text-[9px] uppercase">Holding Cycle</span>
          <span class="font-bold text-amber-300 text-xs mt-0.5 block">${sw.expectedHoldingDays} Days (1-2 Mo)</span>
        </div>
      </div>

      <!-- Triggers -->
      ${(sw.triggers && sw.triggers.length > 0) ? `
        <div class="bg-[#060c18]/60 p-2 rounded-lg border border-[#16233d]/80 space-y-0.5 text-[10px] text-slate-300">
          ${sw.triggers.map(t => `<div class="flex items-start space-x-1.5"><i class="fa-solid fa-angle-right text-cyan-400 mt-0.5 text-[9px]"></i><span>${t}</span></div>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// ==========================================
// ==========================================
// EYE-COMFORT & 3-THEME ERGONOMICS SYSTEM
// (Current Dark, Eye Comfort, Light Theme)
// ==========================================
function toggleHeaderMoreDropdown() {
  const menu = document.getElementById("headerMoreDropdownMenu");
  if (menu) menu.classList.toggle("hidden");
}

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("headerMoreDropdownMenu");
  const btn = document.getElementById("btnHeaderMore");
  if (dropdown && !dropdown.classList.contains("hidden")) {
    if (!dropdown.contains(e.target) && !btn?.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  }
});

function applyAppTheme(themeName) {
  document.body.classList.remove('theme-charcoal', 'theme-obsidian', 'theme-slate', 'theme-tradingview', 'theme-angelone', 'theme-screener', 'theme-dark', 'theme-eye-comfort', 'theme-light');

  // Normalize theme options: 'dark', 'eye-comfort', 'light'
  if (themeName === 'light') {
    themeName = 'light';
    document.body.classList.add('theme-light');
  } else if (themeName === 'eye-comfort' || themeName === 'charcoal') {
    themeName = 'eye-comfort';
    document.body.classList.add('theme-eye-comfort');
  } else {
    themeName = 'dark';
    document.body.classList.add('theme-dark');
  }

  // Update segmented control buttons in header
  const btnDark = document.getElementById("themeBtnDark");
  const btnEye = document.getElementById("themeBtnEyeComfort");
  const btnLight = document.getElementById("themeBtnLight");

  const activeDark = "theme-opt-btn px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 text-teal-300 bg-teal-500/15 border border-teal-500/30 transition shadow-xs";
  const activeEye = "theme-opt-btn px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 text-amber-300 bg-amber-500/15 border border-amber-500/30 transition shadow-xs";
  const activeLight = "theme-opt-btn px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 text-sky-700 bg-sky-100 border border-sky-300 transition shadow-xs";
  const inactiveDark = "theme-opt-btn px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 text-slate-400 hover:text-slate-200 transition";
  const inactiveLight = "theme-opt-btn px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1 text-slate-500 hover:text-slate-800 transition";

  if (themeName === 'light') {
    if (btnDark) btnDark.className = inactiveLight;
    if (btnEye) btnEye.className = inactiveLight;
    if (btnLight) btnLight.className = activeLight;
  } else if (themeName === 'eye-comfort') {
    if (btnDark) btnDark.className = inactiveDark;
    if (btnEye) btnEye.className = activeEye;
    if (btnLight) btnLight.className = inactiveDark;
  } else {
    if (btnDark) btnDark.className = activeDark;
    if (btnEye) btnEye.className = inactiveDark;
    if (btnLight) btnLight.className = inactiveDark;
  }

  localStorage.setItem("portfolioRebalancerTheme", themeName);

  // Smoothly refresh Donut allocation charts and holdings table to synchronize theme
  if (currentPortfolioData) {
    if (typeof renderPortfolioAllocationCharts === 'function') {
      renderPortfolioAllocationCharts(currentPortfolioData, currentDiagnostics);
    }
    if (typeof renderHoldingsTable === 'function') {
      renderHoldingsTable();
    }
  }

  // If a stock chart is currently open, smoothly re-render with matching background and grid
  if (activeChartTicker && currentChartInstance) {
    loadAndRenderStockChart(activeChartTicker, activeChartRange, activeChartMos);
  }
}

function initThemeFromStorage() {
  const urlParam = new URLSearchParams(window.location.search).get("theme");
  const savedTheme = urlParam || localStorage.getItem("portfolioRebalancerTheme") || "dark";
  applyAppTheme(savedTheme);
}

// Window exports

// ============================================================================
// INSTITUTIONAL SUPPLY CHAIN & VALUE ECOSYSTEM GRAPH VISUAL SYSTEM
// Inspired by Bloomberg SPLC, FactSet Revere, Koyfin, Linear.app & Stripe
// Multi-Tier Visual DAG, Interactive Tabs, COGS Tree, Revenue Mix & Stress Test
// ============================================================================

window._scDataMap = window._scDataMap || {};
window._scStateMap = window._scStateMap || {};

function renderInstitutionalSupplyChainEcosystem(supplyChain, ticker, companyName) {
  if (!supplyChain) return '';

  // Store in memory for dynamic reactivity without network re-fetch
  window._scDataMap[ticker] = { supplyChain, ticker, companyName };

  if (!window._scStateMap[ticker]) {
    window._scStateMap[ticker] = {
      activeTab: 'graph', // default to flagship interactive directed graph!
      activeShockIndex: 0,
      activeMacroTrigger: 'COPPER_SPIKE', // 'COPPER_SPIKE' | 'COPPER_DROP' | 'CRUDE_SPIKE' | 'STEEL_SPIKE' | 'INR_WEAK' | 'BASE'
      sliderDeltaPercent: 20,
      expandedNodes: {}
    };
  }

  const state = window._scStateMap[ticker];
  const activeTab = state.activeTab || 'graph';
  const activeShockIdx = state.activeShockIndex || 0;

  // Extract key summary metrics
  const primaryInput = supplyChain.keyInputs && supplyChain.keyInputs.length > 0 ? supplyChain.keyInputs[0] : null;
  const primaryOutput = supplyChain.keyOutputs && supplyChain.keyOutputs.length > 0 ? supplyChain.keyOutputs[0] : null;
  const moatRating = supplyChain.valueChain?.moatRating || 'Wide Economic Moat';
  const conversionMargin = supplyChain.valueChain?.grossConversionMargin || '38-45% Gross Value-Add';
  const buyerConcentration = primaryOutput?.customerConcentration || 'Diversified End Market';

  return `
    <div id="sc-component-${ticker}" class="supply-node-card p-4 sm:p-5 bg-gradient-to-r from-[#060c18] via-[#091120] to-[#060c18] rounded-2xl border border-cyan-500/30 space-y-4 shadow-2xl relative overflow-hidden">
      <!-- Ambient Glow Behind Centerpiece -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Top Header & Navigation Bar -->
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#16233d]">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/10">
            <i class="fa-solid fa-diagram-project text-sm"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Supply Chain &amp; Value-Creation Ecosystem
              </h4>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                BLOOMBERG SPLC &bull; TIER-1 DAG
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Multi-tier upstream sourcing &bull; core transformation moat &bull; downstream customer realization
            </p>
          </div>
        </div>

        <!-- 5 Quick-Toggle Institutional Tabs -->
        <div class="flex flex-wrap items-center gap-1 p-1 bg-[#060c18] border border-[#16233d] rounded-xl self-start md:self-center shadow-inner">
          <button type="button" onclick="switchSupplyChainTab('graph', '${ticker}')"
            class="supply-pill-tab px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 transition ${activeTab === 'graph' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1b32]/50 border border-transparent'}">
            <i class="fa-solid fa-diagram-project text-[10px] text-cyan-400"></i>
            <span>1. Product &amp; Shock Graph</span>
          </button>
          <button type="button" onclick="switchSupplyChainTab('pipeline', '${ticker}')"
            class="supply-pill-tab px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 transition ${activeTab === 'pipeline' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1b32]/50 border border-transparent'}">
            <i class="fa-solid fa-network-wired text-[10px]"></i>
            <span>2. Pipeline Flow</span>
          </button>
          <button type="button" onclick="switchSupplyChainTab('cogs', '${ticker}')"
            class="supply-pill-tab px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 transition ${activeTab === 'cogs' ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1b32]/50 border border-transparent'}">
            <i class="fa-solid fa-boxes-stacked text-[10px]"></i>
            <span>3. COGS Tree</span>
          </button>
          <button type="button" onclick="switchSupplyChainTab('revenue', '${ticker}')"
            class="supply-pill-tab px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 transition ${activeTab === 'revenue' ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1b32]/50 border border-transparent'}">
            <i class="fa-solid fa-chart-pie text-[10px]"></i>
            <span>4. Revenue Mix</span>
          </button>
          <button type="button" onclick="switchSupplyChainTab('stress', '${ticker}')"
            class="supply-pill-tab px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 transition ${activeTab === 'stress' ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1b32]/50 border border-transparent'}">
            <i class="fa-solid fa-bolt-lightning text-[10px]"></i>
            <span>5. Macro Stress Test</span>
          </button>
        </div>
      </div>

      <!-- High-Density Executive Summary Strip -->
      <div class="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
        <div class="p-2 rounded-xl bg-[#060c18]/90 border border-amber-500/20 space-y-0.5">
          <div class="text-slate-500 uppercase font-mono tracking-wider text-[9px] flex items-center justify-between">
            <span>Upstream Anchor</span>
            <i class="fa-solid fa-arrow-down-up-across-line text-amber-400 text-[9px]"></i>
          </div>
          <div class="font-bold text-white truncate" title="${primaryInput?.name || 'Feedstock'}">
            ${primaryInput?.name || 'Feedstock'}
          </div>
          <div class="text-[9px] text-amber-300/80 font-mono">
            ${primaryInput?.costWeightEstimate || 'COGS Driver'}
          </div>
        </div>

        <div class="p-2 rounded-xl bg-[#060c18]/90 border border-cyan-500/25 space-y-0.5">
          <div class="text-slate-500 uppercase font-mono tracking-wider text-[9px] flex items-center justify-between">
            <span>Moat Rating</span>
            <i class="fa-solid fa-chess-rook text-cyan-400 text-[9px]"></i>
          </div>
          <div class="font-bold text-cyan-200 truncate">
            ${moatRating}
          </div>
          <div class="text-[9px] text-cyan-400/80 font-mono">
            ${conversionMargin}
          </div>
        </div>

        <div class="p-2 rounded-xl bg-[#060c18]/90 border border-emerald-500/20 space-y-0.5">
          <div class="text-slate-500 uppercase font-mono tracking-wider text-[9px] flex items-center justify-between">
            <span>Customer Dispersion</span>
            <i class="fa-solid fa-users-viewfinder text-emerald-400 text-[9px]"></i>
          </div>
          <div class="font-bold text-white truncate" title="${buyerConcentration}">
            ${buyerConcentration}
          </div>
          <div class="text-[9px] text-emerald-300/80 font-mono">
            ${primaryOutput?.revenueContribution || 'Core Output'}
          </div>
        </div>

        <div class="p-2 rounded-xl bg-[#060c18]/90 border border-indigo-500/25 space-y-0.5">
          <div class="text-slate-500 uppercase font-mono tracking-wider text-[9px] flex items-center justify-between">
            <span>Pass-Through Lag</span>
            <i class="fa-solid fa-hourglass-half text-indigo-400 text-[9px]"></i>
          </div>
          <div class="font-bold text-indigo-200 font-mono">
            ${primaryInput?.passThroughLagDays || '30-45 Days'}
          </div>
          <div class="text-[9px] text-slate-400 truncate">
            Margin Repricing Window
          </div>
        </div>
      </div>

      <!-- Business Model High-Level Summary Note -->
      <div class="relative z-10 p-2.5 bg-[#060c18]/80 border border-[#16233d] rounded-xl text-xs text-slate-300 leading-relaxed flex items-start space-x-2">
        <i class="fa-solid fa-circle-nodes text-cyan-400 text-xs mt-0.5 flex-shrink-0"></i>
        <div class="text-[11px] leading-relaxed">
          <strong class="text-white">Business Model Synthesis:</strong> ${supplyChain.businessModelSummary}
        </div>
      </div>

      <!-- Dynamic Tab Content Renderers -->
      <div class="relative z-10 pt-1">
        ${activeTab === 'graph' ? renderInteractiveProductShockGraph(supplyChain, ticker, companyName) : ''}
        ${activeTab === 'pipeline' ? renderPipelineFlowTab(supplyChain, ticker) : ''}
        ${activeTab === 'cogs' ? renderCogsTreeTab(supplyChain, ticker) : ''}
        ${activeTab === 'revenue' ? renderRevenueMixTab(supplyChain, ticker) : ''}
        ${activeTab === 'stress' ? renderStressTestTab(supplyChain, ticker, activeShockIdx) : ''}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// TAB 1: FLAGSHIP INTERACTIVE PRODUCT & COMMODITY RELATIONSHIP GRAPH
// ----------------------------------------------------------------------------
function renderInteractiveProductShockGraph(supplyChain, ticker, companyName) {
  const state = window._scStateMap[ticker] || { activeMacroTrigger: 'COPPER_SPIKE', sliderDeltaPercent: 20 };
  const triggerKey = state.activeMacroTrigger || 'COPPER_SPIKE';
  const deltaVal = state.sliderDeltaPercent !== undefined ? state.sliderDeltaPercent : 20;

  const inputs = supplyChain.keyInputs || [];
  const valueChain = supplyChain.valueChain || {};
  const outputs = supplyChain.keyOutputs || [];

  // Determine Company Archetype & Reaction under current trigger
  const reaction = computeCompanyShockReaction(ticker, triggerKey, deltaVal, supplyChain);

  return `
    <div class="space-y-4">
      <!-- 1. Interactive Macro Trigger & Price Sensitivity Controller -->
      <div class="p-3.5 bg-gradient-to-r from-slate-950 via-[#0a1324] to-slate-950 rounded-xl border border-cyan-500/35 shadow-lg space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#16233d]">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs shadow-inner">
              <i class="fa-solid fa-sliders"></i>
            </span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">
              Macro Price Shock &amp; Trigger Propagation Engine
            </span>
            <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              SIMULATION DESK
            </span>
          </div>
          <div class="text-[11px] font-mono text-slate-400">
            Simulate how swings in primary commodities transmit through suppliers to margins
          </div>
        </div>

        <!-- Quick-Select Preset Scenario Buttons -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-[10px] uppercase font-mono font-bold text-slate-400 mr-1">Triggers:</span>
          <button type="button" onclick="triggerMacroCommodityShock('COPPER_SPIKE', '${ticker}')"
            class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1.5 ${triggerKey === 'COPPER_SPIKE' ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-sm' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'}">
            <i class="fa-solid fa-bolt text-amber-400 text-[10px]"></i>
            <span>Copper Surge (+20%)</span>
          </button>
          <button type="button" onclick="triggerMacroCommodityShock('COPPER_DROP', '${ticker}')"
            class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1.5 ${triggerKey === 'COPPER_DROP' ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 shadow-sm' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'}">
            <i class="fa-solid fa-arrow-trend-down text-emerald-400 text-[10px]"></i>
            <span>Copper Drop (-20%)</span>
          </button>
          <button type="button" onclick="triggerMacroCommodityShock('CRUDE_SPIKE', '${ticker}')"
            class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1.5 ${triggerKey === 'CRUDE_SPIKE' ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50 shadow-sm' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'}">
            <i class="fa-solid fa-oil-well text-rose-400 text-[10px]"></i>
            <span>Crude Oil Spike (+25%)</span>
          </button>
          <button type="button" onclick="triggerMacroCommodityShock('STEEL_SPIKE', '${ticker}')"
            class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1.5 ${triggerKey === 'STEEL_SPIKE' ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/50 shadow-sm' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'}">
            <i class="fa-solid fa-cubes-stacked text-indigo-400 text-[10px]"></i>
            <span>Steel &amp; Coal (+15%)</span>
          </button>
          <button type="button" onclick="triggerMacroCommodityShock('INR_WEAK', '${ticker}')"
            class="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex items-center space-x-1.5 ${triggerKey === 'INR_WEAK' ? 'bg-teal-500/25 text-teal-200 border border-teal-500/50 shadow-sm' : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'}">
            <i class="fa-solid fa-dollar-sign text-teal-400 text-[10px]"></i>
            <span>USD/INR Weakens (+5%)</span>
          </button>
          <button type="button" onclick="resetMacroCommodityShock('${ticker}')"
            class="px-2 py-1 rounded-lg text-[10px] font-semibold transition text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700">
            <i class="fa-solid fa-rotate-left mr-1"></i>Reset
          </button>
        </div>

        <!-- Interactive Continuous Price Shock Slider -->
        <div class="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center space-x-2">
            <span class="text-slate-400 font-medium">Custom Magnitude:</span>
            <input type="range" min="-40" max="40" step="5" value="${deltaVal}"
              oninput="updateCustomShockSlider(this.value, '${ticker}')"
              class="w-36 sm:w-48 accent-cyan-400 cursor-pointer" />
            <span class="font-mono font-bold ${deltaVal > 0 ? 'text-amber-400' : deltaVal < 0 ? 'text-emerald-400' : 'text-slate-300'} text-xs">
              ${deltaVal > 0 ? '+' : ''}${deltaVal}%
            </span>
          </div>

          <div class="flex items-center space-x-2 text-[11px] font-mono">
            <span class="text-slate-400">Current Shock Scenario:</span>
            <span class="px-2 py-0.5 rounded font-bold ${reaction.badgeClass}">
              ${reaction.headline}
            </span>
          </div>
        </div>
      </div>

      <!-- 2. The Directed Product & Commodity Relationship Graph (5-Tier Node Grid) -->
      <div class="p-4 bg-[#050a14] rounded-2xl border border-[#16233d] shadow-inner space-y-4">
        <div class="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-[#16233d]">
          <span class="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-slate-300">
            <i class="fa-solid fa-network-wired text-cyan-400"></i>
            <span>Directed Product &amp; Commodity Flow Graph</span>
          </span>
          <span class="text-[10px] font-mono text-cyan-400">
            Live Shock Heatmap &bull; Upstream &rarr; Moat &rarr; Downstream
          </span>
        </div>

        <!-- 5-Tier Directed Node Canvas with Animated Flow Connectors -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          
          <!-- NODE COLUMN 1: Upstream Commodities & Feedstocks -->
          <div class="space-y-2">
            <div class="text-[10px] uppercase font-mono font-bold text-amber-400 flex items-center justify-between">
              <span>1. Upstream Inputs</span>
              <span class="text-[9px] text-slate-500">Raw Feedstock</span>
            </div>
            ${inputs.map((inp, idx) => {
              const isShockTarget = isInputAffectedByShock(inp.name, triggerKey);
              const nodeGlow = isShockTarget ? (deltaVal > 0 ? 'border-amber-500/80 bg-amber-950/20 text-amber-200 shadow-amber-500/20' : 'border-emerald-500/80 bg-emerald-950/20 text-emerald-200 shadow-emerald-500/20') : 'border-slate-800 bg-[#091120] text-slate-200';
              return `
                <div class="p-2.5 rounded-xl border ${nodeGlow} transition shadow-sm space-y-1 text-[11px] relative">
                  ${isShockTarget ? `<span class="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500 text-slate-950 animate-pulse">SHOCK</span>` : ''}
                  <div class="font-bold flex items-center justify-between">
                    <span class="truncate pr-1">${inp.name}</span>
                    <i class="fa-solid fa-box text-[10px] text-amber-400"></i>
                  </div>
                  <div class="text-[9px] font-mono text-slate-400 flex items-center justify-between">
                    <span>${inp.costWeightEstimate}</span>
                    <span class="text-amber-300/80">${inp.category}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- CONNECTOR 1 -> 2 (Animated SVG) -->
          <div class="hidden md:flex flex-col items-center justify-center">
            <svg viewBox="0 0 60 40" class="w-full h-12 overflow-visible">
              <path d="M 0,20 L 60,20" fill="none" stroke="#f59e0b" stroke-width="2" class="flow-dash-anim" opacity="0.75" />
              <polygon points="54,16 60,20 54,24" fill="#f59e0b" />
            </svg>
            <span class="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Sourcing</span>
          </div>

          <!-- NODE COLUMN 3: Target Company Transformation & Moat Hub (Centerpiece) -->
          <div class="p-4 rounded-2xl border ${reaction.cardGlowClass} bg-gradient-to-b from-[#091326] via-[#0b1730] to-[#081020] space-y-2.5 text-center shadow-xl relative">
            <div class="flex items-center justify-center space-x-2">
              <span class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs shadow-inner">
                <i class="fa-solid fa-building-columns"></i>
              </span>
              <div class="text-left">
                <div class="font-extrabold text-white text-sm font-mono tracking-tight">${ticker}</div>
                <div class="text-[10px] text-slate-400 truncate max-w-[130px]">${companyName}</div>
              </div>
            </div>

            <!-- Value Transformation Core -->
            <div class="p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] space-y-1">
              <span class="text-[9px] font-mono uppercase text-cyan-400 font-bold block">Transformation Moat</span>
              <div class="font-semibold text-slate-200 leading-tight">${valueChain.coreProcess || 'Value Conversion Engine'}</div>
              <div class="text-[9px] font-mono text-emerald-400">${valueChain.grossConversionMargin || '28-35% Value-Add'}</div>
            </div>

            <!-- Dynamic Shock Margin Impact Badge -->
            <div class="p-2.5 rounded-xl ${reaction.reactionBannerClass} space-y-1 text-left">
              <div class="flex items-center justify-between text-[10px] font-bold font-mono">
                <span class="flex items-center"><i class="${reaction.icon} mr-1.5"></i>${reaction.statusLabel}</span>
                <span>${reaction.marginDeltaBps}</span>
              </div>
              <p class="text-[10px] text-slate-300 leading-tight">
                ${reaction.mechanismSummary}
              </p>
              <div class="text-[9px] font-mono text-slate-400 pt-0.5 border-t border-white/10 flex items-center justify-between">
                <span>Pass-Through Window:</span>
                <span class="font-bold text-white">${reaction.lagText}</span>
              </div>
            </div>
          </div>

          <!-- CONNECTOR 3 -> 4 (Animated SVG) -->
          <div class="hidden md:flex flex-col items-center justify-center">
            <svg viewBox="0 0 60 40" class="w-full h-12 overflow-visible">
              <path d="M 0,20 L 60,20" fill="none" stroke="#06b6d4" stroke-width="2" class="flow-dash-anim" opacity="0.75" />
              <polygon points="54,16 60,20 54,24" fill="#06b6d4" />
            </svg>
            <span class="text-[8px] font-mono text-slate-500 uppercase tracking-tighter">Output Flow</span>
          </div>

          <!-- NODE COLUMN 5: Finished Products & End Client Markets -->
          <div class="space-y-2">
            <div class="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center justify-between">
              <span>5. Realized End Markets</span>
              <span class="text-[9px] text-slate-500">Revenue Drivers</span>
            </div>
            ${outputs.map((out, idx) => `
              <div class="p-2.5 rounded-xl border border-slate-800 bg-[#091120] text-slate-200 transition shadow-sm space-y-1 text-[11px]">
                <div class="font-bold text-white flex items-center justify-between">
                  <span class="truncate pr-1">${out.productOrService}</span>
                  <span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">${out.revenueContribution || 'Core'}</span>
                </div>
                <div class="text-[9px] text-slate-400 truncate">
                  <strong class="text-slate-300">Client:</strong> ${out.customerSegment}
                </div>
                <div class="text-[9px] font-mono text-cyan-400 flex items-center justify-between pt-0.5">
                  <span>Pricing Power: ${out.pricingPowerScore || 8}/10</span>
                  <span class="text-slate-400">${out.demandDrivers ? out.demandDrivers.split(',')[0] : 'Capex'}</span>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      </div>

      <!-- 3. Commercial Analysis: Cross-Stock Domino Market Radar (Winners vs Squeezed) -->
      ${renderCrossStockDominoRadar(triggerKey, deltaVal, ticker)}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// COMPUTE COMPANY SHOCK REACTION LOGIC (PRODUCER VS CONSUMER SENSITIVITY)
// ----------------------------------------------------------------------------
function computeCompanyShockReaction(ticker, triggerKey, deltaVal, supplyChain) {
  const cleanTicker = ticker.toUpperCase();
  const absDelta = Math.abs(deltaVal);
  const isPositiveShock = deltaVal > 0;

  // 1. COPPER SCENARIOS
  if (triggerKey === 'COPPER_SPIKE' || triggerKey === 'COPPER_DROP') {
    if (['HINDCOPPER', 'HINDALCO', 'VEDL'].includes(cleanTicker)) {
      // Producer / Miner / Smelter
      if (isPositiveShock) {
        return {
          headline: 'UPSTREAM PRODUCER BENEFICIARY (Direct Top-Line Windfall)',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35',
          cardGlowClass: 'border-emerald-500 shadow-emerald-500/30 shock-glow-beneficiary',
          reactionBannerClass: 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200',
          statusLabel: 'PRODUCER MARGIN EXPANSION',
          marginDeltaBps: `+${Math.round(280 * (absDelta / 20))} to +${Math.round(420 * (absDelta / 20))} bps EBITDA`,
          mechanismSummary: 'Mine extraction & fixed smelting costs remain steady while cathode realization expands 1:1 with LME spot prices.',
          lagText: 'Immediate (Day 1 Spot Realization)',
          icon: 'fa-solid fa-arrow-trend-up text-emerald-400'
        };
      } else {
        return {
          headline: 'UPSTREAM MARGIN SQUEEZE (Lower Realization on Fixed Mining Base)',
          badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/35',
          cardGlowClass: 'border-rose-500 shadow-rose-500/30 shock-glow-squeezed',
          reactionBannerClass: 'bg-rose-950/40 border border-rose-500/40 text-rose-200',
          statusLabel: 'PRODUCER CASH FLOW COMPRESSION',
          marginDeltaBps: `-${Math.round(320 * (absDelta / 20))} bps EBITDA`,
          mechanismSummary: 'LME price decline depresses gross realizations while underground mining labor remains fixed.',
          lagText: 'Immediate',
          icon: 'fa-solid fa-arrow-trend-down text-rose-400'
        };
      }
    } else if (['POLYCAB', 'KEI'].includes(cleanTicker)) {
      // Consumer with High Pricing Power
      if (isPositiveShock) {
        return {
          headline: 'HIGH-MOAT CONSUMER (Short-Term Squeeze -> 100% Pass-Through)',
          badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/35',
          cardGlowClass: 'border-amber-500/70 shadow-amber-500/20',
          reactionBannerClass: 'bg-amber-950/40 border border-amber-500/40 text-amber-200',
          statusLabel: 'TEMPORARY INPUT COST SQUEEZE',
          marginDeltaBps: `-${Math.round(140 * (absDelta / 20))} bps (30d Lag)`,
          mechanismSummary: 'Raw copper is ~65% of COGS. Margin dips during 30-day inventory burn, then fully recovered via weekly formula price hikes to dealers.',
          lagText: '30-45 Days (Dealer Pricing Formula)',
          icon: 'fa-solid fa-shield-halved text-amber-400'
        };
      } else {
        return {
          headline: 'CONSUMER WINDFALL (Gross Margin Expansion on Softening Copper)',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35',
          cardGlowClass: 'border-emerald-500 shadow-emerald-500/30 shock-glow-beneficiary',
          reactionBannerClass: 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200',
          statusLabel: 'INVENTORY MARGIN EXPANSION',
          marginDeltaBps: `+${Math.round(180 * (absDelta / 20))} bps Gross Margin`,
          mechanismSummary: 'Cheaper raw feedstock expands conversion spreads before finished cable prices adjust downward.',
          lagText: '30-45 Days',
          icon: 'fa-solid fa-arrow-trend-up text-emerald-400'
        };
      }
    } else if (['HAVELLS', 'VOLTAS'].includes(cleanTicker)) {
      // Consumer with Moderate or Low Pricing Power
      return {
        headline: 'DOWNSTREAM APPLIANCE SQUEEZE (Extended Pricing Lag)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/35',
        cardGlowClass: 'border-rose-500 shadow-rose-500/30 shock-glow-squeezed',
        reactionBannerClass: 'bg-rose-950/40 border border-rose-500/40 text-rose-200',
        statusLabel: 'MARGIN COMPRESSION (EXTENDED LAG)',
        marginDeltaBps: `-${Math.round(180 * (absDelta / 20))} bps Operating EBITDA`,
        mechanismSummary: 'Copper represents 18-32% of bill of materials. Consumer retail resistance delays retail price hikes by 60-90 days.',
        lagText: '60-90 Days (Consumer Catalog Lag)',
        icon: 'fa-solid fa-triangle-exclamation text-rose-400'
      };
    }
  }

  // 2. CRUDE OIL SCENARIOS
  if (triggerKey === 'CRUDE_SPIKE') {
    if (['ONGC', 'OIL'].includes(cleanTicker)) {
      return {
        headline: 'UPSTREAM HYDROCARBON WINNER (Direct Net Realization Windfall)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35',
        cardGlowClass: 'border-emerald-500 shadow-emerald-500/30 shock-glow-beneficiary',
        reactionBannerClass: 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200',
        statusLabel: 'EBITDA EXPANSION (+$20/bbl = +₹9,200 Cr PAT)',
        marginDeltaBps: `+${Math.round(380 * (absDelta / 25))} bps Operating EBITDA`,
        mechanismSummary: 'Every $10/bbl rise in Brent flows directly to upstream operating profit with zero extra extraction cost.',
        lagText: 'Day 1 Spot Realization',
        icon: 'fa-solid fa-arrow-trend-up text-emerald-400'
      };
    } else if (['ASIANPAINT', 'BERGEPAINT'].includes(cleanTicker)) {
      return {
        headline: 'PETROCHEM CONSUMER (Input Cost Surge -> Brand Pricing Power Defense)',
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/35',
        cardGlowClass: 'border-amber-500/70 shadow-amber-500/20',
        reactionBannerClass: 'bg-amber-950/40 border border-amber-500/40 text-amber-200',
        statusLabel: 'INTERMEDIATE MONOMER SQUEEZE',
        marginDeltaBps: `-${Math.round(180 * (absDelta / 25))} bps Gross Margin`,
        mechanismSummary: 'Crude derivatives (solvents, phthalic anhydride, monomers) are 36% of COGS. 60-day lag before retail paint price hikes catch up.',
        lagText: '45-60 Days',
        icon: 'fa-solid fa-shield text-amber-400'
      };
    } else if (['INDIGO', 'INTERGLOBE', 'MRF'].includes(cleanTicker)) {
      return {
        headline: 'SEVERE CRUDE SHOCK VICTIM (High Fuel/Rubber Squeeze)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/35',
        cardGlowClass: 'border-rose-500 shadow-rose-500/30 shock-glow-squeezed',
        reactionBannerClass: 'bg-rose-950/40 border border-rose-500/40 text-rose-200',
        statusLabel: 'OPERATING MARGIN EROSION',
        marginDeltaBps: `-${Math.round(420 * (absDelta / 25))} bps EBIT`,
        mechanismSummary: 'Jet ATF fuel or synthetic rubber absorbs 40%+ of revenue. Inability to immediately raise ticket/tyre prices creates deep margin erosion.',
        lagText: '90+ Days',
        icon: 'fa-solid fa-triangle-exclamation text-rose-400'
      };
    }
  }

  // 3. STEEL & COAL SCENARIOS
  if (triggerKey === 'STEEL_SPIKE') {
    if (['TATASTEEL', 'JSWSTEEL'].includes(cleanTicker)) {
      return {
        headline: 'STEEL PRODUCER BENCHMARK (Hot-Rolled Coil Realization Surge)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35',
        cardGlowClass: 'border-emerald-500 shadow-emerald-500/30 shock-glow-beneficiary',
        reactionBannerClass: 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200',
        statusLabel: 'PRODUCER EBITDA EXPANSION',
        marginDeltaBps: `+${Math.round(290 * (absDelta / 15))} bps EBITDA`,
        mechanismSummary: 'Domestic HRC price hikes expand operating spreads over iron ore and captive coking coal.',
        lagText: '15-20 Days',
        icon: 'fa-solid fa-arrow-trend-up text-emerald-400'
      };
    } else if (['TATAMOTORS', 'MARUTI', 'LT'].includes(cleanTicker)) {
      return {
        headline: 'AUTO & INFRA CONSUMER (Steel Sheet & Rebar Input Pressure)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/35',
        cardGlowClass: 'border-rose-500 shadow-rose-500/30 shock-glow-squeezed',
        reactionBannerClass: 'bg-rose-950/40 border border-rose-500/40 text-rose-200',
        statusLabel: 'AUTOMOTIVE SHEET METAL SQUEEZE',
        marginDeltaBps: `-${Math.round(130 * (absDelta / 15))} bps Gross Margin`,
        mechanismSummary: 'Automotive cold-rolled steel and EPC structural rebars pressure gross margin during quarterly OEM negotiation cycles.',
        lagText: '60-90 Days',
        icon: 'fa-solid fa-arrow-trend-down text-rose-400'
      };
    }
  }

  // 4. USD/INR CURRENCY WEAKENING
  if (triggerKey === 'INR_WEAK') {
    if (['TCS', 'INFY', 'KPITTECH', 'SUNPHARMA'].includes(cleanTicker)) {
      return {
        headline: 'EXPORTER CURRENCY TAILWIND (90%+ USD Billings vs INR Base)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35',
        cardGlowClass: 'border-emerald-500 shadow-emerald-500/30 shock-glow-beneficiary',
        reactionBannerClass: 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200',
        statusLabel: 'OPERATING MARGIN EXPANSION',
        marginDeltaBps: `+${Math.round(110 * (absDelta / 5))} bps Operating Margin`,
        mechanismSummary: 'Every 1% rupee depreciation expands IT/pharma operating margin by ~25-30 bps after hedging.',
        lagText: 'Quarterly Settlement',
        icon: 'fa-solid fa-arrow-trend-up text-emerald-400'
      };
    }
  }

  // Default / Sector Fallback
  return {
    headline: 'BALANCED OPERATIONAL ELASTICITY (Diversified Input Structure)',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/35',
    cardGlowClass: 'border-cyan-500/50',
    reactionBannerClass: 'bg-slate-900/60 border border-slate-800 text-slate-300',
    statusLabel: 'DIVERSIFIED PASS-THROUGH',
    marginDeltaBps: `${deltaVal >= 0 ? '-' : '+'}${Math.round(Math.abs(deltaVal) * 4.5)} bps Estimated Impact`,
    mechanismSummary: 'Balanced input-output dynamics insulate company from catastrophic single-commodity swings.',
    lagText: '30-45 Days',
    icon: 'fa-solid fa-scale-balanced text-cyan-400'
  };
}

function isInputAffectedByShock(inputName, triggerKey) {
  const norm = (inputName || '').toLowerCase();
  if (triggerKey === 'COPPER_SPIKE' || triggerKey === 'COPPER_DROP') {
    return norm.includes('copper') || norm.includes('metal') || norm.includes('ore');
  }
  if (triggerKey === 'CRUDE_SPIKE') {
    return norm.includes('crude') || norm.includes('petro') || norm.includes('polymer') || norm.includes('monomer') || norm.includes('fuel');
  }
  if (triggerKey === 'STEEL_SPIKE') {
    return norm.includes('steel') || norm.includes('coal') || norm.includes('iron') || norm.includes('coking');
  }
  if (triggerKey === 'INR_WEAK') {
    return norm.includes('import') || norm.includes('semiconductor') || norm.includes('hardware');
  }
  return false;
}

// ----------------------------------------------------------------------------
// COMMERCIAL DOMINO EFFECT: CROSS-STOCK SENSITIVITY TABLE
// ----------------------------------------------------------------------------
function renderCrossStockDominoRadar(triggerKey, deltaVal, currentTicker) {
  let dominoRows = [];

  if (triggerKey === 'COPPER_SPIKE' || triggerKey === 'COPPER_DROP') {
    dominoRows = [
      { ticker: 'HINDCOPPER', name: 'Hindustan Copper', role: 'Pure-Play Sovereign Miner', exp: '100% Topline tied to LME Copper', bps: '+420 bps EBITDA', lag: 'Day 1 (Spot)', verdict: 'Primary Mining Winner', type: 'winner' },
      { ticker: 'HINDALCO', name: 'Hindalco Industries', role: 'Birla Copper Smelter & Refiner', exp: 'Cathode Spot Pricing (Dahej Smelter)', bps: '+280 bps EBITDA', lag: '5-7 Days', verdict: 'Large-Cap Beneficiary', type: 'winner' },
      { ticker: 'POLYCAB', name: 'Polycab India', role: 'Cables & Wires Hegemon', exp: '65% of Raw Material COGS', bps: '-140 bps (30d Lag)', lag: '30-45 Days', verdict: '100% Pass-Through Formula', type: 'buffer' },
      { ticker: 'HAVELLS', name: 'Havells India', role: 'Consumer Electricals & Switchgears', exp: '32% of Bill of Materials', bps: '-180 bps EBITDA', lag: '45-60 Days', verdict: 'Moderate Consumer Squeeze', type: 'loser' },
      { ticker: 'VOLTAS', name: 'Voltas Ltd', role: 'AC Copper Tube Appliance Maker', exp: '18% of Cooling Appliance BOM', bps: '-120 bps EBIT', lag: '60-90 Days', verdict: 'Seasonal Pricing Lag Hit', type: 'loser' }
    ];
  } else if (triggerKey === 'CRUDE_SPIKE') {
    dominoRows = [
      { ticker: 'ONGC', name: 'Oil & Natural Gas Corp', role: 'National Upstream Flagship', exp: '71% Domestic Crude Output', bps: '+380 bps EBITDA', lag: 'Day 1 (Spot)', verdict: 'Upstream Windfall Winner', type: 'winner' },
      { ticker: 'OIL', name: 'Oil India Ltd', role: 'Pure Upstream Hydrocarbons', exp: '100% Hydrocarbon Realization', bps: '+410 bps EBITDA', lag: 'Day 1 (Spot)', verdict: 'Direct E&P Beneficiary', type: 'winner' },
      { ticker: 'ASIANPAINT', name: 'Asian Paints', role: 'Decorative Paint Leader', exp: '36% Monomer & Solvent COGS', bps: '-180 bps Margin', lag: '45-60 Days', verdict: 'Unmatched Pricing Power', type: 'buffer' },
      { ticker: 'INDIGO', name: 'InterGlobe Aviation', role: 'Commercial Airline', exp: '40% Operating Costs (ATF Fuel)', bps: '-420 bps EBIT', lag: '90+ Days', verdict: 'Severe Fuel Cost Squeeze', type: 'loser' },
      { ticker: 'MRF', name: 'MRF Tyres', role: 'Tyre & Rubber Manufacturer', exp: 'Synthetic Rubber & Carbon Black', bps: '-210 bps EBITDA', lag: '60 Days', verdict: 'Raw Material Margin Erosion', type: 'loser' }
    ];
  } else if (triggerKey === 'STEEL_SPIKE') {
    dominoRows = [
      { ticker: 'TATASTEEL', name: 'Tata Steel', role: 'Integrated Primary Steelmaker', exp: 'Domestic HRC Realizations', bps: '+290 bps EBITDA', lag: '15 Days', verdict: 'Hot-Rolled Coil Beneficiary', type: 'winner' },
      { ticker: 'JSWSTEEL', name: 'JSW Steel', role: 'Primary Steel & Coated Coils', exp: 'Spot Steel Price Spreads', bps: '+260 bps EBITDA', lag: '15 Days', verdict: 'Steel Margin Expansion', type: 'winner' },
      { ticker: 'TATAMOTORS', name: 'Tata Motors', role: 'Commercial & Passenger Auto OEM', exp: 'Sheet Steel & Heavy Forgings', bps: '-130 bps Margin', lag: '60-90 Days', verdict: 'OEM Cost Absorption Lag', type: 'loser' },
      { ticker: 'LT', name: 'Larsen & Toubro', role: 'Heavy Infrastructure EPC', exp: 'Structural Steel & Rebar Contracts', bps: '-90 bps EBIT', lag: 'Fixed PPAs', verdict: 'Legacy Fixed-Price Squeeze', type: 'loser' }
    ];
  } else {
    dominoRows = [
      { ticker: 'KPITTECH', name: 'KPIT Technologies', role: 'Automotive Software Exporter', exp: '94% Revenue in USD/EUR', bps: '+120 bps EBITDA', lag: 'Immediate', verdict: 'Exporter Currency Tailwind', type: 'winner' },
      { ticker: 'TCS', name: 'Tata Consultancy Services', role: 'IT Global Services', exp: 'Global Cross-Currency Inflows', bps: '+95 bps EBIT', lag: 'Quarterly', verdict: 'Stable FX Cash Expansion', type: 'winner' },
      { ticker: 'POLYCAB', name: 'Polycab India', role: 'Cable Infrastructure Leader', exp: 'Formula-Indexed Domestic Books', bps: 'Neutral Buffer', lag: '30 Days', verdict: 'Balanced Domestic Footprint', type: 'buffer' }
    ];
  }

  return `
    <div class="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div class="flex items-center space-x-2">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <h5 class="text-xs font-bold text-white uppercase tracking-wider">
            Commercial Domino Effect: Cross-Stock Sensitivity for Selected Trigger
          </h5>
          <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            INDIAN EQUITIES MULTIPLIER
          </span>
        </div>
        <div class="text-[10px] text-slate-400 font-mono">
          Click any stock to inspect its full 5-pillar profile
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-800/80">
        <table class="w-full text-left text-xs font-mono">
          <thead class="bg-slate-900/90 text-[10px] uppercase text-slate-400 border-b border-slate-800">
            <tr>
              <th class="py-2 px-3">Stock Ticker</th>
              <th class="py-2 px-3">Role in Ecosystem</th>
              <th class="py-2 px-3">Commodity Exposure</th>
              <th class="py-2 px-3 text-right">EBITDA Impact (bps)</th>
              <th class="py-2 px-3 text-center">Pass-Through Lag</th>
              <th class="py-2 px-3">Market Verdict</th>
              <th class="py-2 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 bg-slate-950/50">
            ${dominoRows.map(row => {
              const isCurrent = row.ticker.toUpperCase() === currentTicker.toUpperCase();
              const badge = row.type === 'winner'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : row.type === 'buffer'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

              return `
                <tr class="hover:bg-slate-900/60 transition ${isCurrent ? 'bg-cyan-950/20 border-l-2 border-l-cyan-400' : ''}">
                  <td class="py-2 px-3 font-bold text-white">
                    <span class="text-cyan-300">${row.ticker}</span>
                    <span class="text-[10px] text-slate-400 block font-normal font-sans">${row.name}</span>
                  </td>
                  <td class="py-2 px-3 text-slate-300 text-[11px] font-sans">${row.role}</td>
                  <td class="py-2 px-3 text-slate-400 text-[11px] font-sans">${row.exp}</td>
                  <td class="py-2 px-3 text-right font-bold ${row.type === 'winner' ? 'text-emerald-400' : row.type === 'buffer' ? 'text-amber-400' : 'text-rose-400'}">
                    ${row.bps}
                  </td>
                  <td class="py-2 px-3 text-center text-slate-300 text-[10px]">${row.lag}</td>
                  <td class="py-2 px-3">
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold border ${badge}">${row.verdict}</span>
                  </td>
                  <td class="py-2 px-2 text-right">
                    ${isCurrent ? `
                      <span class="text-[9px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 font-bold">CURRENT</span>
                    ` : `
                      <button type="button" onclick="quickInspectTicker('${row.ticker}')" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 text-[10px] font-bold transition">
                        Inspect &rarr;
                      </button>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Global Macro Trigger Handlers
window.triggerMacroCommodityShock = function(shockKey, ticker) {
  if (!window._scStateMap[ticker]) {
    window._scStateMap[ticker] = { activeTab: 'graph', activeShockIndex: 0, expandedNodes: {} };
  }
  window._scStateMap[ticker].activeMacroTrigger = shockKey;
  if (shockKey === 'COPPER_SPIKE') window._scStateMap[ticker].sliderDeltaPercent = 20;
  else if (shockKey === 'COPPER_DROP') window._scStateMap[ticker].sliderDeltaPercent = -20;
  else if (shockKey === 'CRUDE_SPIKE') window._scStateMap[ticker].sliderDeltaPercent = 25;
  else if (shockKey === 'STEEL_SPIKE') window._scStateMap[ticker].sliderDeltaPercent = 15;
  else if (shockKey === 'INR_WEAK') window._scStateMap[ticker].sliderDeltaPercent = 5;

  const container = document.getElementById(`sc-component-${ticker}`);
  if (container && window._scDataMap[ticker]) {
    const { supplyChain, companyName } = window._scDataMap[ticker];
    container.outerHTML = renderInstitutionalSupplyChainEcosystem(supplyChain, ticker, companyName);
  }
};

window.updateCustomShockSlider = function(val, ticker) {
  if (!window._scStateMap[ticker]) {
    window._scStateMap[ticker] = { activeTab: 'graph', activeShockIndex: 0, expandedNodes: {} };
  }
  window._scStateMap[ticker].sliderDeltaPercent = parseInt(val, 10);
  const container = document.getElementById(`sc-component-${ticker}`);
  if (container && window._scDataMap[ticker]) {
    const { supplyChain, companyName } = window._scDataMap[ticker];
    container.outerHTML = renderInstitutionalSupplyChainEcosystem(supplyChain, ticker, companyName);
  }
};

window.resetMacroCommodityShock = function(ticker) {
  if (window._scStateMap[ticker]) {
    window._scStateMap[ticker].activeMacroTrigger = 'BASE';
    window._scStateMap[ticker].sliderDeltaPercent = 0;
  }
  const container = document.getElementById(`sc-component-${ticker}`);
  if (container && window._scDataMap[ticker]) {
    const { supplyChain, companyName } = window._scDataMap[ticker];
    container.outerHTML = renderInstitutionalSupplyChainEcosystem(supplyChain, ticker, companyName);
  }
};


function renderPipelineFlowTab(supplyChain, ticker) {
  const inputs = supplyChain.keyInputs || [];
  const valueChain = supplyChain.valueChain || {};
  const outputs = supplyChain.keyOutputs || [];

  return `
    <div class="grid grid-cols-1 lg:grid-cols-11 gap-3 items-stretch">
      <!-- TIER 1: WHAT IT CONSUMES (INPUTS / RAW MATERIALS / SUPPLIERS) -->
      <div class="lg:col-span-4 p-3.5 bg-[#060c18] border border-amber-500/30 rounded-xl space-y-3 flex flex-col justify-between shadow-sm">
        <div>
          <div class="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <div class="flex items-center space-x-2">
              <span class="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs">
                <i class="fa-solid fa-boxes-packing"></i>
              </span>
              <span class="text-xs font-bold text-amber-300 uppercase tracking-wide">1. Sourcing &amp; Inputs</span>
            </div>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Raw Feedstock / COGS
            </span>
          </div>

          <div class="space-y-2 pt-2.5">
            ${inputs.map((inp, idx) => {
              const bPower = inp.supplierBargainingPower || 'Moderate';
              const bPowerColor = bPower.includes('High') || bPower.includes('Oligopol') ? 'rose' : (bPower.includes('Low') ? 'emerald' : 'amber');
              const lag = inp.passThroughLagDays || '30-45 Days';
              const detailId = `sc-inp-detail-${ticker}-${idx}`;

              return `
                <div class="supply-node-card p-2.5 bg-[#0a1222] rounded-lg border border-[#16233d] hover:border-amber-500/40 transition space-y-1.5 text-[11px]">
                  <div class="flex items-start justify-between gap-1.5">
                    <span class="font-bold text-white flex items-center leading-snug">
                      <i class="fa-solid fa-arrow-right-to-bracket text-amber-400 mr-1.5 text-[9px] flex-shrink-0"></i>
                      ${inp.name}
                    </span>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 whitespace-nowrap">
                      ${inp.costWeightEstimate}
                    </span>
                  </div>

                  <div class="text-slate-400 text-[10px]">
                    <strong class="text-slate-300">Sources:</strong> ${inp.typicalSourceOrSuppliers}
                  </div>

                  <!-- Institutional Telemetry Badges -->
                  <div class="flex flex-wrap items-center gap-1 pt-1 text-[9px] font-mono">
                    <span class="px-1.5 py-0.5 rounded bg-${bPowerColor}-500/10 text-${bPowerColor}-300 border border-${bPowerColor}-500/20" title="Supplier Pricing & Bargaining Leverage">
                      <i class="fa-solid fa-handshake-simple mr-1 text-[8px]"></i>Bargaining: ${bPower}
                    </span>
                    <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700" title="Cost Repricing / Pass-Through Lag Window">
                      <i class="fa-regular fa-clock mr-1 text-[8px]"></i>Lag: ${lag}
                    </span>
                    <button type="button" onclick="toggleSupplyChainNodeDetail('${detailId}', '${ticker}')" class="ml-auto text-[9px] text-amber-400 hover:text-amber-300 underline transition">
                      Details
                    </button>
                  </div>

                  <!-- Expandable Volatility Drawer -->
                  <div id="${detailId}" class="hidden pt-1.5 border-t border-[#16233d] text-[10px] text-slate-400 italic">
                    <strong class="text-amber-400/90 not-italic">Risk Exposure:</strong> ${inp.riskOrVolatilityNote}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-[#16233d] text-[10px] text-slate-500 flex items-center justify-between">
          <span>Cost Structure Risk</span>
          <span class="text-amber-400/90 font-mono">COGS Sensitivity</span>
        </div>
      </div>

      <!-- CONNECTOR 1 (Upstream to Core Moat) -->
      <div class="hidden lg:flex lg:col-span-1 flex-col items-center justify-center space-y-2">
        <svg viewBox="0 0 40 80" class="w-10 h-20 overflow-visible">
          <defs>
            <linearGradient id="scGradIn" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.9"/>
            </linearGradient>
          </defs>
          <path d="M 0,40 L 40,40" fill="none" stroke="url(#scGradIn)" stroke-width="2.5" class="supply-flow-path" />
          <polygon points="34,36 40,40 34,44" fill="#06b6d4" />
        </svg>
        <span class="text-[8px] font-mono uppercase text-slate-500 tracking-wider text-center">Value Added</span>
      </div>

      <!-- TIER 2: VALUE-ADD TRANSFORMATION (THE MOAT / ENGINE) -->
      <div class="lg:col-span-2 p-3.5 bg-[#060c18] border border-cyan-500/40 rounded-xl space-y-3 flex flex-col justify-between shadow-md supply-glow-cyan">
        <div>
          <div class="flex items-center space-x-2 pb-2 border-b border-cyan-500/20">
            <span class="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs">
              <i class="fa-solid fa-gears"></i>
            </span>
            <span class="text-xs font-bold text-cyan-300 uppercase tracking-wide">2. Transformation</span>
          </div>

          <div class="space-y-2.5 pt-2.5 text-[11px]">
            <div class="p-2.5 bg-[#0a1222] rounded-lg border border-[#16233d] space-y-1">
              <span class="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">Core Conversion Process</span>
              <p class="font-semibold text-white leading-tight">${valueChain.coreProcess || 'Industrial Architecture & Systems'}</p>
            </div>

            <div class="p-2.5 bg-[#0a1222] rounded-lg border border-[#16233d] space-y-1">
              <span class="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">Value-Addition</span>
              <p class="text-slate-300 text-[10px] leading-relaxed">${valueChain.valueAdditionSummary || 'Transforms inputs into high-value market offerings.'}</p>
            </div>

            <div class="p-2.5 bg-cyan-950/40 rounded-lg border border-cyan-500/35 space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Economic Moat</span>
                <span class="px-1.5 py-0.2 rounded text-[8px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  ${valueChain.moatRating || 'Wide Moat'}
                </span>
              </div>
              <p class="text-emerald-200 text-[10px] leading-snug">${valueChain.moatFactor || 'Proprietary IP and high client switching lock-in.'}</p>
            </div>

            ${valueChain.grossConversionMargin ? `
              <div class="p-1.5 rounded-md bg-indigo-950/30 border border-indigo-500/20 text-[9px] text-indigo-300 font-mono text-center">
                <i class="fa-solid fa-scale-balanced mr-1"></i> ${valueChain.grossConversionMargin}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-[#16233d] text-[10px] text-slate-500 flex items-center justify-between">
          <span>Pricing Power</span>
          <span class="text-cyan-400/90 font-mono">Gross Margin Anchor</span>
        </div>
      </div>

      <!-- CONNECTOR 2 (Core Moat to Downstream) -->
      <div class="hidden lg:flex lg:col-span-1 flex-col items-center justify-center space-y-2">
        <svg viewBox="0 0 40 80" class="w-10 h-20 overflow-visible">
          <defs>
            <linearGradient id="scGradOut" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.9"/>
            </linearGradient>
          </defs>
          <path d="M 0,40 L 40,40" fill="none" stroke="url(#scGradOut)" stroke-width="2.5" class="supply-flow-path" />
          <polygon points="34,36 40,40 34,44" fill="#10b981" />
        </svg>
        <span class="text-[8px] font-mono uppercase text-slate-500 tracking-wider text-center">Revenue Out</span>
      </div>

      <!-- TIER 3: WHAT IT PRODUCES & WHO BUYS IT (OUTPUTS / CUSTOMERS) -->
      <div class="lg:col-span-3 p-3.5 bg-[#060c18] border border-emerald-500/30 rounded-xl space-y-3 flex flex-col justify-between shadow-sm">
        <div>
          <div class="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <div class="flex items-center space-x-2">
              <span class="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-xs">
                <i class="fa-solid fa-truck-ramp-box"></i>
              </span>
              <span class="text-xs font-bold text-emerald-300 uppercase tracking-wide">3. Commercial Outputs</span>
            </div>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              End Customers / Revenue
            </span>
          </div>

          <div class="space-y-2 pt-2.5">
            ${outputs.map(out => {
              const custConc = out.customerConcentration || 'Diversified';
              const concColor = custConc.includes('High') || custConc.includes('Top 3') || custConc.includes('Top 5') ? 'amber' : 'emerald';

              return `
                <div class="supply-node-card p-2.5 bg-[#0a1222] rounded-lg border border-[#16233d] hover:border-emerald-500/40 transition space-y-1 text-[11px]">
                  <div class="flex items-start justify-between gap-1.5">
                    <span class="font-bold text-white flex items-center leading-snug">
                      <i class="fa-solid fa-arrow-up-right-from-square text-emerald-400 mr-1.5 text-[9px] flex-shrink-0"></i>
                      ${out.productOrService}
                    </span>
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 whitespace-nowrap">
                      ${out.revenueContribution}
                    </span>
                  </div>

                  <div class="text-slate-400 text-[10px]">
                    <strong class="text-slate-300">Target Buyers:</strong> ${out.customerSegment}
                  </div>

                  <div class="text-slate-400 text-[10px]">
                    <strong class="text-emerald-400/90">Growth Catalyst:</strong> ${out.demandDrivers}
                  </div>

                  <!-- Customer Concentration Pill -->
                  <div class="pt-1 flex items-center justify-between text-[9px] font-mono">
                    <span class="text-slate-500">Concentration:</span>
                    <span class="px-1.5 py-0.2 rounded bg-${concColor}-500/10 text-${concColor}-300 border border-${concColor}-500/20">
                      ${custConc}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-[#16233d] text-[10px] text-slate-500 flex items-center justify-between">
          <span>Revenue Engine</span>
          <span class="text-emerald-400/90 font-mono">End-Market Demand</span>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// TAB 2: COST BREAKDOWN (COGS) TREE (Hierarchical Sourcing Vulnerability)
// ----------------------------------------------------------------------------
function renderCogsTreeTab(supplyChain, ticker) {
  const inputs = supplyChain.keyInputs || [];

  return `
    <div class="space-y-3.5">
      <!-- Section Briefing -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#060c18] border border-amber-500/25">
        <div>
          <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center">
            <i class="fa-solid fa-layer-group text-amber-400 mr-1.5"></i> Upstream Cost Structure &amp; Sourcing Security Tree
          </span>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Evaluate bill-of-materials (BOM) concentration, supplier pricing power, and pass-through margin lag.
          </p>
        </div>
        <div class="flex items-center space-x-2 text-[10px] font-mono">
          <span class="px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            ${inputs.length} Cost Centers Tracked
          </span>
        </div>
      </div>

      <!-- COGS Hierarchy Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${inputs.map((inp, idx) => {
          const bPower = inp.supplierBargainingPower || 'Moderate';
          const bPowerBadge = bPower.includes('High') || bPower.includes('Oligopol')
            ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30">High (Oligopoly Risk)</span>'
            : (bPower.includes('Low')
              ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Low (Commoditized)</span>'
              : '<span class="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">Moderate (Competitive)</span>');

          const lag = inp.passThroughLagDays || '30-45 Days';

          return `
            <div class="supply-node-card p-3.5 bg-[#0a1222] rounded-xl border border-[#16233d] hover:border-amber-500/40 space-y-2.5 transition text-[11px]">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span class="font-bold text-white text-xs">${inp.name}</span>
                  </div>
                  <span class="text-[9px] font-mono text-slate-400 block mt-0.5 ml-4">
                    Category: <strong class="text-slate-300">${inp.category}</strong>
                  </span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  ${inp.costWeightEstimate}
                </span>
              </div>

              <!-- Visual Progress Bar for Cost Weight -->
              <div class="w-full bg-[#060c18] h-1.5 rounded-full overflow-hidden border border-[#16233d]">
                <div class="bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full" style="width: ${inp.costWeightEstimate.includes('High') ? '75%' : (inp.costWeightEstimate.includes('Medium') ? '45%' : '25%')}"></div>
              </div>

              <!-- Supplier Geographies & Sourcing Partners -->
              <div class="p-2 rounded-lg bg-[#060c18] border border-[#16233d] space-y-1 text-[10px]">
                <div class="flex items-center justify-between text-slate-400">
                  <span>Sourcing Hubs &amp; Vendors:</span>
                  <span class="font-semibold text-slate-200 truncate ml-2 text-right">${inp.typicalSourceOrSuppliers}</span>
                </div>
                <div class="flex items-center justify-between text-slate-400">
                  <span>Supplier Bargaining Leverage:</span>
                  ${bPowerBadge}
                </div>
                <div class="flex items-center justify-between text-slate-400">
                  <span>Pricing Pass-Through Lag:</span>
                  <span class="font-mono text-indigo-300 font-semibold">${lag}</span>
                </div>
              </div>

              <!-- Sourcing Vulnerability Note -->
              <div class="text-[10px] text-slate-400 leading-snug">
                <strong class="text-amber-400/90">Sensitivity Mechanism:</strong> ${inp.riskOrVolatilityNote}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Institutional Takeaway -->
      <div class="p-3 bg-[#060c18] rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5">
        <i class="fa-solid fa-shield-halved text-cyan-400 text-sm mt-0.5 flex-shrink-0"></i>
        <div class="space-y-1">
          <strong class="text-white block text-[11px] uppercase tracking-wide">Gross Margin Protection &amp; Pass-Through Dynamics:</strong>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Companies with diversified domestic vendor pools and contractual quarterly indexation clauses can absorb raw material price surges with minimal structural margin dilution. Long-term contractual pass-through lag under 45 days indicates strong gross margin defensibility.
          </p>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// TAB 3: CUSTOMER & REVENUE MIX (Segmental Waterfall & Concentration Risk)
// ----------------------------------------------------------------------------
function renderRevenueMixTab(supplyChain, ticker) {
  const outputs = supplyChain.keyOutputs || [];

  return `
    <div class="space-y-3.5">
      <!-- Section Briefing -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#060c18] border border-emerald-500/25">
        <div>
          <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center">
            <i class="fa-solid fa-chart-pie text-emerald-400 mr-1.5"></i> Downstream Customer &amp; Revenue Concentration Mix
          </span>
          <p class="text-[11px] text-slate-400 mt-0.5">
            Identify core revenue drivers, buyer diversification, single-client exposure, and long-term demand drivers.
          </p>
        </div>
        <div class="flex items-center space-x-2 text-[10px] font-mono">
          <span class="px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            ${outputs.length} Revenue Streams Tracked
          </span>
        </div>
      </div>

      <!-- Revenue Mix Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${outputs.map(out => {
          const custConc = out.customerConcentration || 'Diversified';
          const isHighConc = custConc.includes('High') || custConc.includes('Top 3') || custConc.includes('Top 5');

          return `
            <div class="supply-node-card p-3.5 bg-[#0a1222] rounded-xl border border-[#16233d] hover:border-emerald-500/40 space-y-2.5 transition text-[11px] flex flex-col justify-between">
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-1.5">
                  <div class="font-bold text-white text-xs flex items-center">
                    <i class="fa-solid fa-circle-dot text-emerald-400 mr-1.5 text-[8px] flex-shrink-0"></i>
                    ${out.productOrService}
                  </div>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                    ${out.revenueContribution}
                  </span>
                </div>

                <!-- Visual Bar for Revenue Contribution -->
                <div class="w-full bg-[#060c18] h-1.5 rounded-full overflow-hidden border border-[#16233d]">
                  <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full" style="width: ${out.revenueContribution.includes('80%') || out.revenueContribution.includes('75%') || out.revenueContribution.includes('72%') ? '75%' : (out.revenueContribution.includes('40%') || out.revenueContribution.includes('42%') || out.revenueContribution.includes('32%') ? '40%' : '20%')}"></div>
                </div>

                <!-- Target Client Segment -->
                <div class="p-2 rounded-lg bg-[#060c18] border border-[#16233d] space-y-1 text-[10px]">
                  <div class="text-slate-400">
                    <span class="text-slate-500 block text-[9px] uppercase font-mono">End Buyer Base</span>
                    <strong class="text-slate-200">${out.customerSegment}</strong>
                  </div>
                  <div class="pt-1 flex items-center justify-between text-slate-400 border-t border-[#16233d]/60">
                    <span>Concentration:</span>
                    <span class="font-mono text-[9px] font-semibold ${isHighConc ? 'text-amber-300' : 'text-emerald-300'}">
                      ${custConc}
                    </span>
                  </div>
                </div>

                <div class="text-[10px] text-slate-400 leading-snug">
                  <strong class="text-emerald-400/90">Growth Catalyst:</strong> ${out.demandDrivers}
                </div>
              </div>

              <div class="mt-2 pt-2 border-t border-[#16233d] text-[9px] text-slate-500 font-mono flex items-center justify-between">
                <span>Contract Type</span>
                <span class="text-emerald-400">Multi-Year Anchor</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Concentration Risk Verdict -->
      <div class="p-3 bg-[#060c18] rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start space-x-2.5">
        <i class="fa-solid fa-users-viewfinder text-emerald-400 text-sm mt-0.5 flex-shrink-0"></i>
        <div class="space-y-1">
          <strong class="text-white block text-[11px] uppercase tracking-wide">Downstream Customer Diversification Verdict:</strong>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Revenue resilience depends heavily on customer fragmentation. Highly granular consumer retail revenue carries near-zero client cancellation risk, whereas enterprise B2B models with >50% concentration in top-5 clients require sticky IP and multi-year master service agreements to defend enterprise valuation multiples.
          </p>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
// TAB 4: MACRO SHOCK STRESS TEST (Interactive Scenario Simulator)
// ----------------------------------------------------------------------------
function renderStressTestTab(supplyChain, ticker, activeShockIdx) {
  const sensitivities = supplyChain.macroCostSensitivities || [];
  const currentSensitivity = sensitivities[activeShockIdx] || sensitivities[0] || {
    factorName: 'Macro Inflation / Squeeze',
    impactDirection: 'Negative',
    mechanism: 'Tests operational pass-through agility and pricing discipline.',
    elasticityMetric: '-80 to -120 bps margin compression'
  };

  const isNeg = currentSensitivity.impactDirection === 'Negative';
  const themeColor = isNeg ? 'rose' : 'emerald';
  const icon = isNeg ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up';

  return `
    <div class="space-y-3.5">
      <!-- Section Briefing & Shock Scenario Switcher -->
      <div class="p-3.5 rounded-xl bg-[#060c18] border border-cyan-500/25 space-y-2.5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center">
            <i class="fa-solid fa-bolt-lightning text-rose-400 mr-1.5"></i> Macro Shock &amp; Elasticity Stress Test Lab
          </span>
          <span class="text-[10px] text-slate-400 font-mono">
            Interactive Scenario Simulator
          </span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
          Simulate macroeconomic stress events (raw material spikes, currency moves, capex cycles) to quantify their impact on gross margins and earnings power.
        </p>

        <!-- Scenario Selection Chips -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${sensitivities.map((s, idx) => {
            const sIsNeg = s.impactDirection === 'Negative';
            const sActive = idx === activeShockIdx;
            const btnColor = sIsNeg ? 'rose' : 'emerald';

            return `
              <button type="button" onclick="selectSupplyChainShock(${idx}, '${ticker}')"
                class="supply-pill-tab px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center space-x-1.5 transition ${sActive ? `bg-${btnColor}-500/20 text-${btnColor}-200 border border-${btnColor}-500/40 shadow-sm shadow-${btnColor}-500/10` : 'bg-[#0a1222] text-slate-400 hover:text-slate-200 border border-[#16233d]'}" title="Test scenario: ${s.factorName}">
                <i class="fa-solid ${sIsNeg ? 'fa-triangle-exclamation text-rose-400' : 'fa-circle-arrow-up text-emerald-400'} text-[10px]"></i>
                <span class="truncate max-w-[200px]">${s.factorName}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Active Scenario Telemetry Dashboard -->
      <div class="supply-node-card p-4 rounded-xl bg-[#0a1222] border border-${themeColor}-500/35 space-y-3 shadow-xl supply-glow-${themeColor}">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#16233d]">
          <div class="flex items-center space-x-2">
            <span class="w-7 h-7 rounded-lg bg-${themeColor}-500/15 border border-${themeColor}-500/30 flex items-center justify-center text-${themeColor}-400 text-xs">
              <i class="fa-solid ${icon}"></i>
            </span>
            <div>
              <span class="text-xs font-bold text-white block">
                ${currentSensitivity.factorName}
              </span>
              <span class="text-[9px] font-mono text-slate-400">
                Stress Vector &bull; Direct Financial Transmission
              </span>
            </div>
          </div>

          <div class="flex items-center space-x-2 self-start sm:self-center">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-${themeColor}-500/15 text-${themeColor}-300 border border-${themeColor}-500/30">
              ${currentSensitivity.impactDirection === 'Negative' ? 'MARGIN SQUEEZE' : 'MARGIN EXPANSION'}
            </span>
          </div>
        </div>

        <!-- Telemetry Numbers -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
          <div class="p-2.5 rounded-lg bg-[#060c18] border border-[#16233d] space-y-1">
            <span class="text-slate-500 uppercase font-mono tracking-wider text-[9px] block">Estimated Impact Metric</span>
            <div class="font-bold text-white text-xs font-mono text-${themeColor}-300">
              ${currentSensitivity.elasticityMetric || (isNeg ? '-110 to -160 bps Margin' : '+90 to +140 bps EBITDA')}
            </div>
          </div>
          <div class="p-2.5 rounded-lg bg-[#060c18] border border-[#16233d] space-y-1">
            <span class="text-slate-500 uppercase font-mono tracking-wider text-[9px] block">Transmission Speed</span>
            <div class="font-bold text-indigo-300 font-mono text-xs">
              30 - 60 Days (Working Capital Lag)
            </div>
          </div>
          <div class="p-2.5 rounded-lg bg-[#060c18] border border-[#16233d] space-y-1">
            <span class="text-slate-500 uppercase font-mono tracking-wider text-[9px] block">Moat Protection Buffer</span>
            <div class="font-bold text-emerald-300 font-mono text-xs">
              ${supplyChain.valueChain?.moatRating || 'High Switching Moat'}
            </div>
          </div>
        </div>

        <!-- Mechanism Explanation -->
        <div class="p-2.5 rounded-lg bg-[#060c18] border border-[#16233d] space-y-1 text-xs">
          <strong class="text-white text-[11px] block">Transmission Mechanism &amp; Value Chain Vulnerability:</strong>
          <p class="text-[11px] text-slate-300 leading-relaxed">
            ${currentSensitivity.mechanism}
          </p>
        </div>
      </div>

      <!-- Sensitivity Matrix Overview -->
      <div class="p-3 bg-[#060c18] rounded-xl border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-200 flex items-center text-[11px]">
            <i class="fa-solid fa-list-check text-cyan-400 mr-1.5"></i> All Profiled Macro Sensitivities (${sensitivities.length})
          </span>
          <span class="text-[9px] text-slate-500 font-mono">Elasticity Multipliers</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
          ${sensitivities.map((s, idx) => {
            const sIsNeg = s.impactDirection === 'Negative';
            const sColor = sIsNeg ? 'rose' : 'emerald';
            const sIcon = sIsNeg ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up';

            return `
              <div class="p-2 rounded-lg bg-[#0a1222] border border-[#16233d] hover:border-${sColor}-500/40 transition space-y-1 text-[10px]">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-white flex items-center truncate">
                    <i class="fa-solid ${sIcon} text-${sColor}-400 mr-1 text-[9px]"></i>
                    ${s.factorName}
                  </span>
                  <span class="px-1 py-0.2 rounded text-[8px] font-mono bg-${sColor}-500/10 text-${sColor}-300">
                    ${s.impactDirection}
                  </span>
                </div>
                <p class="text-[9px] text-slate-400 line-clamp-2 leading-tight">
                  ${s.mechanism}
                </p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// Global Tab & Scenario Controllers
window.switchSupplyChainTab = function(tabId, ticker) {
  if (!window._scStateMap[ticker]) {
    window._scStateMap[ticker] = { activeTab: 'pipeline', activeShockIndex: 0, expandedNodes: {} };
  }
  window._scStateMap[ticker].activeTab = tabId;
  const container = document.getElementById(`sc-component-${ticker}`);
  if (container && window._scDataMap[ticker]) {
    const { supplyChain, companyName } = window._scDataMap[ticker];
    container.outerHTML = renderInstitutionalSupplyChainEcosystem(supplyChain, ticker, companyName);
  }
};

window.selectSupplyChainShock = function(shockIdx, ticker) {
  if (!window._scStateMap[ticker]) {
    window._scStateMap[ticker] = { activeTab: 'stress', activeShockIndex: 0, expandedNodes: {} };
  }
  window._scStateMap[ticker].activeShockIndex = shockIdx;
  const container = document.getElementById(`sc-component-${ticker}`);
  if (container && window._scDataMap[ticker]) {
    const { supplyChain, companyName } = window._scDataMap[ticker];
    container.outerHTML = renderInstitutionalSupplyChainEcosystem(supplyChain, ticker, companyName);
  }
};

window.toggleSupplyChainNodeDetail = function(nodeId, ticker) {
  const el = document.getElementById(nodeId);
  if (el) {
    el.classList.toggle('hidden');
  }
};

function renderShareholdingPatternAndWhaleAlerts(pattern, ticker, companyName, price) {
  if (!pattern) return '';

  window._shDataMap = window._shDataMap || {};
  window._shDataMap[ticker] = { pattern, ticker, companyName, price };

  window._shStateMap = window._shStateMap || {};
  if (!window._shStateMap[ticker]) {
    window._shStateMap[ticker] = {
      dealFilter: 'ALL' // 'ALL' | 'BUY' | 'BLOCK' | 'BULK' | 'PROMOTER'
    };
  }

  const activeDealFilter = window._shStateMap[ticker].dealFilter || 'ALL';

  const prom = pattern.promoterPercent ?? 0;
  const fii = pattern.fiiPercent ?? 0;
  const dii = pattern.diiPercent ?? 0;
  const govt = pattern.governmentPercent ?? 0;
  const pub = pattern.publicPercent ?? 0;
  const pledge = pattern.promoterPledgePercent ?? 0;

  const qoqProm = pattern.qoQPromoterChange ?? 0;
  const qoqFii = pattern.qoQFiiChange ?? 0;
  const qoqDii = pattern.qoQDiiChange ?? 0;

  const allDeals = pattern.recentWhaleDeals || [];
  const bigPubPct = pattern.bigPublicInvestorsPercent ?? 0;
  const generalRetailPct = pattern.generalRetailPublicPercent ?? (pub - bigPubPct);
  const bigInvestors = pattern.bigPublicInvestors || [];

  // Filter deals based on active tab
  const filteredDeals = allDeals.filter(d => {
    if (activeDealFilter === 'BUY') return d.dealType === 'BUY';
    if (activeDealFilter === 'BLOCK') return (d.transactionType || '').includes('BLOCK');
    if (activeDealFilter === 'BULK') return (d.transactionType || '').includes('BULK');
    if (activeDealFilter === 'PROMOTER') return (d.transactionType || '').includes('PROMOTER');
    return true;
  });

  // Calculate Smart Money Whale Conviction Score (0 to 100)
  let convictionScore = 50;
  if (qoqFii > 0) convictionScore += 16; else if (qoqFii < 0) convictionScore -= 12;
  if (qoqDii > 0) convictionScore += 16; else if (qoqDii < 0) convictionScore -= 10;
  if (bigInvestors.some(i => i.trendDirection === 'ACCUMULATING' || i.trendDirection === 'NEW ENTRY')) convictionScore += 12;
  if (pledge === 0) convictionScore += 8; else if (pledge > 15) convictionScore -= 22;
  convictionScore = Math.max(15, Math.min(98, convictionScore));

  const convictionClass = convictionScore >= 80 ? 'text-emerald-400' : convictionScore >= 65 ? 'text-teal-400' : convictionScore >= 45 ? 'text-amber-400' : 'text-rose-400';
  const convictionStatus = convictionScore >= 80 
    ? 'AGGRESSIVE INSTITUTIONAL ACCUMULATION (Smart Money Float Absorption)'
    : convictionScore >= 65 
      ? 'STEADY INSTITUTIONAL SPONSORSHIP (Net Buying & SIP Float Holding)'
      : convictionScore >= 45 
        ? 'BALANCED FLOAT EQUILIBRIUM'
        : 'INSTITUTIONAL DISTRIBUTION / TRIMMING PHASE';
  const convictionBadge = convictionScore >= 80 
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
    : convictionScore >= 65 
      ? 'bg-teal-500/20 text-teal-300 border-teal-500/35'
      : convictionScore >= 45 
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/35'
        : 'bg-rose-500/20 text-rose-300 border-rose-500/35';

  return `
    <div id="sh-component-${ticker}" class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#060c18] via-[#091120] to-[#060c18] border border-teal-500/30 shadow-2xl space-y-4">
      
      <!-- Top Header & Live Surveillance Action -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#16233d] pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500/20 via-cyan-500/20 to-blue-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shadow-md">
            <i class="fa-solid fa-chart-pie text-sm"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Institutional Shareholding &amp; Whale Radar</h3>
              <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-teal-500/30 font-semibold">
                ${pattern.quarterPeriod || 'Latest Quarter'} &bull; SEBI LODR Reg 31
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">
              Live tracking of Foreign FIIs, Domestic DIIs, Superstar Whales, and Exchange Block/Bulk Deals
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2 self-start sm:self-center">
          <button type="button" onclick="openCreateAlertModal('${ticker}', ${price || 0})" 
            class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 transition flex items-center space-x-1.5 shadow-sm"
            title="Set real-time bulk deal and price surveillance alerts for ${ticker}">
            <i class="fa-solid fa-bell text-[11px]"></i>
            <span>Track Whale Alerts</span>
          </button>
        </div>
      </div>

      <!-- 1. Flagship Smart Money Conviction Radar (0-100) & FII/DII Tug-of-War -->
      <div class="p-3.5 bg-slate-950/90 rounded-xl border border-teal-500/30 shadow-lg space-y-3">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="text-[10px] uppercase font-mono font-bold text-slate-400">Whale Conviction Index:</span>
              <span class="text-xl font-black font-mono ${convictionClass}">${convictionScore}<span class="text-xs text-slate-500 font-normal"> / 100</span></span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${convictionBadge}">
                ${convictionStatus}
              </span>
            </div>
            <p class="text-[11px] text-slate-300">
              Evaluates FII accumulation pace, DII mutual fund cushion, marquee superstar entries, and 0% promoter pledge safety.
            </p>
          </div>

          <!-- Conviction Visual Gauge -->
          <div class="w-full md:w-64 space-y-1">
            <div class="flex justify-between text-[9px] font-mono text-slate-400">
              <span>Distribute</span>
              <span>Neutral</span>
              <span class="text-emerald-400 font-bold">Accumulate</span>
            </div>
            <div class="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
              <div class="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-500" style="width: ${convictionScore}%"></div>
            </div>
          </div>
        </div>

        <!-- FII vs DII Tug-of-War Bar (Foreign Hot Money vs Domestic SIP Float Cushion) -->
        <div class="p-2.5 bg-[#0a1324] rounded-lg border border-[#16233d] space-y-1 text-xs">
          <div class="flex justify-between text-[10px] font-mono">
            <span class="text-emerald-400 flex items-center"><i class="fa-solid fa-building-columns mr-1"></i> Foreign FII: <strong>${fii.toFixed(2)}%</strong> (${qoqFii >= 0 ? '+' : ''}${qoqFii.toFixed(2)}% QoQ)</span>
            <span class="text-cyan-400 flex items-center">Domestic DII: <strong>${dii.toFixed(2)}%</strong> (${qoqDii >= 0 ? '+' : ''}${qoqDii.toFixed(2)}% QoQ) <i class="fa-solid fa-vault ml-1"></i></span>
          </div>
          <div class="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
            <div class="bg-emerald-500 hover:brightness-110 transition" style="width: ${((fii / ((fii + dii) || 1)) * 100).toFixed(1)}%" title="Foreign Institutions (FII): ${fii.toFixed(2)}%"></div>
            <div class="bg-cyan-500 hover:brightness-110 transition" style="width: ${((dii / ((fii + dii) || 1)) * 100).toFixed(1)}%" title="Domestic Institutions (DII): ${dii.toFixed(2)}%"></div>
          </div>
          <div class="text-[9px] text-slate-400 flex items-center justify-between font-mono pt-0.5">
            <span>Foreign Capital: ${qoqFii >= 0 ? 'Net Accumulating' : 'Trimming Position'}</span>
            <span>Domestic SIP Cushion: ${qoqDii >= 0 ? 'Float Absorption Active' : 'Holding Steady'}</span>
          </div>
        </div>
      </div>

      <!-- 2. 100% Equity Spectrum & 5-Way Ownership Metric Grid -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span class="font-medium text-slate-300 flex items-center">
            <i class="fa-solid fa-layer-group text-teal-400 mr-1.5 text-[10px]"></i> Total Equity Spectrum (100% Floating Balance)
          </span>
          <span class="font-mono text-[10px] text-slate-500">Promoter: ${prom.toFixed(1)}% | Inst (FII+DII): ${(fii + dii).toFixed(1)}% | Govt: ${govt.toFixed(1)}% | Public: ${pub.toFixed(1)}%</span>
        </div>
        <div class="w-full h-3.5 bg-slate-950 rounded-lg overflow-hidden flex border border-slate-800 shadow-inner" title="Promoter: ${prom}%, FII: ${fii}%, DII: ${dii}%, Govt: ${govt}%, Public: ${pub}%">
          <div class="bg-indigo-500 hover:brightness-110 transition cursor-pointer" style="width: ${prom}%" title="Promoters: ${prom.toFixed(2)}%"></div>
          <div class="bg-emerald-500 hover:brightness-110 transition cursor-pointer" style="width: ${fii}%" title="FII (Foreign): ${fii.toFixed(2)}%"></div>
          <div class="bg-cyan-500 hover:brightness-110 transition cursor-pointer" style="width: ${dii}%" title="DII (Domestic MFs/Banks): ${dii.toFixed(2)}%"></div>
          <div class="bg-amber-500 hover:brightness-110 transition cursor-pointer" style="width: ${govt}%" title="Government / Sovereign: ${govt.toFixed(2)}%"></div>
          <div class="bg-slate-600 hover:brightness-110 transition cursor-pointer" style="width: ${pub}%" title="Total Public Float: ${pub.toFixed(2)}%"></div>
        </div>
      </div>

      <!-- 5-Way Ownership Metric Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <!-- 1. Promoters -->
        <div class="bg-slate-950/70 p-2.5 rounded-xl border border-indigo-500/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span>Promoters</span>
              <span class="text-[9px] font-mono ${qoqProm >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                ${qoqProm >= 0 ? '+' : ''}${qoqProm.toFixed(2)}% QoQ
              </span>
            </div>
            <div class="text-base font-bold font-mono text-white mt-1">${prom.toFixed(2)}%</div>
          </div>
          <div class="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
            <span class="text-slate-500">Pledge:</span>
            <span class="font-mono font-bold ${pledge === 0 ? 'text-emerald-400' : pledge > 20 ? 'text-rose-400' : 'text-amber-400'}">
              ${pledge.toFixed(1)}% ${pledge === 0 ? '(Pristine)' : ''}
            </span>
          </div>
        </div>

        <!-- 2. Foreign (FII) -->
        <div class="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>Foreign (FII)</span>
              <span class="text-[9px] font-mono ${qoqFii >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                ${qoqFii >= 0 ? '+' : ''}${qoqFii.toFixed(2)}% QoQ
              </span>
            </div>
            <div class="text-base font-bold font-mono text-white mt-1">${fii.toFixed(2)}%</div>
          </div>
          <div class="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
            <span class="text-slate-500">Smart Capital:</span>
            <span class="font-mono text-emerald-300 text-[10px]">${qoqFii >= 0 ? 'Accumulating' : 'Trimming'}</span>
          </div>
        </div>

        <!-- 3. Domestic (DII) -->
        <div class="bg-slate-950/70 p-2.5 rounded-xl border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-cyan-500 mr-1.5"></span>Domestic (DII)</span>
              <span class="text-[9px] font-mono ${qoqDii >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                ${qoqDii >= 0 ? '+' : ''}${qoqDii.toFixed(2)}% QoQ
              </span>
            </div>
            <div class="text-base font-bold font-mono text-white mt-1">${dii.toFixed(2)}%</div>
          </div>
          <div class="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
            <span class="text-slate-500">MF / LIC Float:</span>
            <span class="font-mono text-cyan-300 text-[10px]">${qoqDii >= 0 ? 'Net Buyer' : 'Steady'}</span>
          </div>
        </div>

        <!-- 4. Government -->
        <div class="bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>Government</span>
              <span class="text-[9px] font-mono text-amber-400 font-bold">PSU / Sovereign</span>
            </div>
            <div class="text-base font-bold font-mono text-white mt-1">${govt.toFixed(2)}%</div>
          </div>
          <div class="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
            <span class="text-slate-500">Govt Stake:</span>
            <span class="font-mono text-amber-300 text-[10px]">${govt > 0 ? 'Sovereign' : 'None (Private)'}</span>
          </div>
        </div>

        <!-- 5. Public -->
        <div class="bg-slate-950/70 p-2.5 rounded-xl border border-slate-700 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-inner">
          <div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span class="flex items-center"><span class="w-2 h-2 rounded-full bg-slate-500 mr-1.5"></span>Total Public</span>
              <span class="text-[9px] font-mono text-teal-400 font-bold">Float</span>
            </div>
            <div class="text-base font-bold font-mono text-white mt-1">${pub.toFixed(2)}%</div>
          </div>
          <div class="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] flex items-center justify-between">
            <span class="text-slate-500">Whale HNIs:</span>
            <span class="font-mono text-teal-300 text-[10px] font-bold">${bigPubPct.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <!-- 3. Superstar "Whales" Disclosed Float Breakdown (Trendlyne Superstars Style) -->
      <div class="p-3.5 bg-slate-950/90 rounded-xl border border-slate-700/80 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div class="flex items-center space-x-2">
            <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">
              Superstar Investors &amp; Marquee Public Float (&ge;0.5% Disclosed)
            </h4>
            <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              SEBI REG 31 DISCLOSED
            </span>
          </div>
          <div class="text-[11px] font-mono text-slate-400">
            Whale HNIs (&ge;0.5%): <span class="text-teal-400 font-bold">${bigPubPct.toFixed(2)}%</span> | 
            Retail Public Float: <span class="text-slate-300 font-bold">${generalRetailPct.toFixed(2)}%</span>
          </div>
        </div>

        <!-- Big Public Investors Table -->
        ${bigInvestors.length > 0 ? `
          <div class="overflow-x-auto rounded-lg border border-slate-800/80">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900/90 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th class="py-1.5 px-3">Superstar Investor / Marquee Fund</th>
                  <th class="py-1.5 px-3">Classification</th>
                  <th class="py-1.5 px-3 text-right">Stake (%)</th>
                  <th class="py-1.5 px-3 text-right">Holding Value (₹ Cr)</th>
                  <th class="py-1.5 px-3 text-center">Quarterly Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 bg-slate-950/40">
                ${bigInvestors.map(inv => {
                  const isAcc = inv.trendDirection === 'ACCUMULATING' || inv.trendDirection === 'NEW ENTRY';
                  const isTrim = inv.trendDirection === 'TRIMMING';
                  const badge = isAcc
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isTrim
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700';
                  return `
                    <tr class="hover:bg-slate-900/50 transition">
                      <td class="py-2 px-3 font-sans font-semibold text-white flex items-center">
                        <i class="fa-solid fa-crown text-amber-400 text-[10px] mr-2"></i>
                        <span>${inv.investorName}</span>
                      </td>
                      <td class="py-2 px-3 text-slate-400 text-[11px] font-sans">${inv.investorType}</td>
                      <td class="py-2 px-3 text-right font-bold text-teal-300">${inv.stakePercent.toFixed(2)}%</td>
                      <td class="py-2 px-3 text-right text-white font-bold">₹${inv.holdingValueCrores.toFixed(1)} Cr</td>
                      <td class="py-2 px-3 text-center">
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold border ${badge}">${inv.trendDirection}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-slate-400 text-xs text-center italic">
            No single public shareholder holding &ge;0.5% disclosed in latest regulatory filing. Float is 100% granular retail.
          </div>
        `}
      </div>

      <!-- 4. SEBI Real-Time Bulk & Block Deals Terminal Feed with Interactive Filter Tabs -->
      <div class="p-3.5 bg-slate-950/90 rounded-xl border border-teal-500/25 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-md bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 text-xs">
              <i class="fa-solid fa-tower-broadcast"></i>
            </span>
            <h4 class="text-xs font-bold text-white uppercase tracking-wider">
              Whale Deals Terminal: NSE / BSE Bulk &amp; Block Stream
            </h4>
            <span class="text-[9px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
              SAME-DAY SEBI SURVEILLANCE
            </span>
          </div>

          <!-- Deal Filter Pills -->
          <div class="flex items-center gap-1 text-[10px] font-mono">
            <button type="button" onclick="filterWhaleDeals('ALL', '${ticker}')"
              class="px-2 py-0.5 rounded transition ${activeDealFilter === 'ALL' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}">
              All (${allDeals.length})
            </button>
            <button type="button" onclick="filterWhaleDeals('BUY', '${ticker}')"
              class="px-2 py-0.5 rounded transition ${activeDealFilter === 'BUY' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}">
              Buys Only
            </button>
            <button type="button" onclick="filterWhaleDeals('BLOCK', '${ticker}')"
              class="px-2 py-0.5 rounded transition ${activeDealFilter === 'BLOCK' ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}">
              Block Deals (&gt;₹10Cr)
            </button>
            <button type="button" onclick="filterWhaleDeals('BULK', '${ticker}')"
              class="px-2 py-0.5 rounded transition ${activeDealFilter === 'BULK' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}">
              Bulk Deals (&gt;0.5%)
            </button>
          </div>
        </div>

        ${filteredDeals.length > 0 ? `
          <div class="overflow-x-auto rounded-lg border border-slate-800/80">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-900/90 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th class="py-2 px-3">Execution Date</th>
                  <th class="py-2 px-3">Institutional Client</th>
                  <th class="py-2 px-2 text-center">Action</th>
                  <th class="py-2 px-3 text-center">Transaction Window</th>
                  <th class="py-2 px-3 text-right">Shares</th>
                  <th class="py-2 px-3 text-right">Trade Price</th>
                  <th class="py-2 px-3 text-right">Stake (%)</th>
                  <th class="py-2 px-3 text-right">Value (₹ Cr)</th>
                  <th class="py-2 px-3">Strategic Significance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 bg-slate-950/40">
                ${filteredDeals.map(d => {
                  const isBuy = d.dealType === 'BUY';
                  const actionBadge = isBuy
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                  const catBadge = (d.transactionType || '').includes('BLOCK')
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                    : (d.transactionType || '').includes('BULK')
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30';

                  return `
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="py-2.5 px-3 text-slate-300 text-[11px] whitespace-nowrap">${d.dealDate}</td>
                      <td class="py-2.5 px-3 font-sans font-semibold text-white whitespace-nowrap">${d.clientName}</td>
                      <td class="py-2.5 px-2 text-center">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${actionBadge}">${d.dealType}</span>
                      </td>
                      <td class="py-2.5 px-3 text-center whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${catBadge}">${d.transactionType}</span>
                      </td>
                      <td class="py-2.5 px-3 text-right text-slate-300">${d.quantity.toLocaleString('en-IN')}</td>
                      <td class="py-2.5 px-3 text-right text-white">₹${d.tradePrice.toLocaleString('en-IN')}</td>
                      <td class="py-2.5 px-3 text-right font-bold ${d.stakePercent >= 1.0 ? 'text-amber-400' : 'text-teal-300'}">${d.stakePercent.toFixed(2)}%</td>
                      <td class="py-2.5 px-3 text-right font-bold text-white">₹${d.dealValueCrores.toFixed(1)} Cr</td>
                      <td class="py-2.5 px-3 font-sans text-slate-300 text-[11px] truncate max-w-[200px]" title="${d.significance}">${d.significance}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 text-xs italic">
            No deals found matching filter '${activeDealFilter}'. Institutional float remains tightly locked.
          </div>
        `}
      </div>

    </div>
  `;
}

window.filterWhaleDeals = function(filterType, ticker) {
  window._shStateMap = window._shStateMap || {};
  if (!window._shStateMap[ticker]) {
    window._shStateMap[ticker] = {};
  }
  window._shStateMap[ticker].dealFilter = filterType;
  const container = document.getElementById(`sh-component-${ticker}`);
  if (container && window._shDataMap && window._shDataMap[ticker]) {
    const { pattern, companyName, price } = window._shDataMap[ticker];
    container.outerHTML = renderShareholdingPatternAndWhaleAlerts(pattern, ticker, companyName, price);
  }
};


function renderManagementAuditSection(mgmt, ticker, companyName) {
  if (!mgmt) return '';

  const govScore = mgmt.governanceScore || 75;
  const scoreColor = govScore >= 80 ? 'text-emerald-400' : govScore >= 50 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg = govScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : govScore >= 50 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30';

  const sentiment = mgmt.managementSentiment || 'CAUTIOUSLY_OPTIMISTIC';
  let sentimentBadge = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
  let sentimentIcon = 'fa-chart-line';
  let sentimentLabel = 'Cautiously Optimistic';

  if (sentiment === 'BULLISH_EXPANSION') {
    sentimentBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    sentimentIcon = 'fa-arrow-trend-up';
    sentimentLabel = 'Bullish Expansion / High Conviction';
  } else if (sentiment === 'DEFENSIVE_CHOP') {
    sentimentBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    sentimentIcon = 'fa-shield-halved';
    sentimentLabel = 'Defensive Working Capital Focus';
  } else if (sentiment === 'DISTRESSED') {
    sentimentBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    sentimentIcon = 'fa-triangle-exclamation';
    sentimentLabel = 'Distressed / Restructuring';
  }

  const events = mgmt.majorEventsAndUproar || [];

  return `
    <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <i class="fa-solid fa-user-tie text-sm"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-sm font-bold text-white tracking-tight">Management Rating, Concall Sentiment &amp; Governance Radar</h3>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded ${scoreBg} ${scoreColor} font-bold border">
                ${govScore}/100 Score
              </span>
            </div>
            <p class="text-[11px] text-slate-400">
              Integrity, capital allocation track record, concall sentiment &amp; major governance uproar/catalysts
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span class="px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center space-x-1.5 ${sentimentBadge}">
            <i class="fa-solid ${sentimentIcon} text-xs mr-1"></i>
            <span>${sentimentLabel}</span>
          </span>
        </div>
      </div>

      <!-- Management Scorecards (3 Pillars: Integrity, Capital Allocation, Execution) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <!-- 1. Integrity & Accounting Quality -->
        <div class="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
          <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
            <span><i class="fa-solid fa-medal text-amber-400 mr-1.5"></i>Integrity &amp; Stewardship</span>
            <span class="text-emerald-400 font-mono text-[9px] font-bold">Verified</span>
          </div>
          <div class="text-xs font-bold text-white">${mgmt.integrityRating}</div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Promoter alignment, statutory audit qualifications, and related-party transaction scrutiny.
          </p>
        </div>

        <!-- 2. Capital Allocation Discipline -->
        <div class="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
          <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
            <span><i class="fa-solid fa-sack-dollar text-emerald-400 mr-1.5"></i>Capital Allocation</span>
            <span class="text-teal-400 font-mono text-[9px] font-bold">ROCE &amp; FCF</span>
          </div>
          <div class="text-xs font-bold text-white">${mgmt.capitalAllocationTrackRecord}</div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Reinvestment discipline, dividend payout consistency, and equity dilution avoidance.
          </p>
        </div>

        <!-- 3. Operational Execution Capability -->
        <div class="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
          <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
            <span><i class="fa-solid fa-bolt text-cyan-400 mr-1.5"></i>Execution Track Record</span>
            <span class="text-indigo-400 font-mono text-[9px] font-bold">Operational</span>
          </div>
          <div class="text-xs font-bold text-white">${mgmt.executionCapability}</div>
          <p class="text-[11px] text-slate-400 leading-snug">
            Delivery against guidance, market share gains, and capacity rollout velocity.
          </p>
        </div>
      </div>

      <!-- Latest Earnings Call (Concall) Highlights & Sentiment Commentary -->
      <div class="p-3.5 bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 rounded-xl border border-indigo-500/25 space-y-2">
        <div class="flex items-center justify-between">
          <div class="text-xs font-bold text-white flex items-center">
            <i class="fa-solid fa-microphone-lines text-indigo-400 mr-2 text-sm"></i>
            Latest Management Commentary &amp; Earnings Concall Pulse
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            ${mgmt.concallDate || 'Latest Earnings Call'}
          </span>
        </div>

        <p class="text-xs text-slate-200 leading-relaxed italic bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
          &ldquo;${mgmt.sentimentSummary}&rdquo;
        </p>

        <div class="text-[11px] text-slate-300 leading-snug pt-1">
          <strong class="text-white block mb-1">Key Strategic Takeaways:</strong>
          <div class="text-slate-400 whitespace-pre-line pl-2 border-l-2 border-indigo-500/40">
            ${mgmt.latestConcallHighlights}
          </div>
        </div>
      </div>

      <!-- Major Events, Governance Uproar & Catalyst Radar -->
      <div class="space-y-2 pt-1">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-white flex items-center">
            <i class="fa-solid fa-tower-broadcast text-teal-400 mr-2"></i>
            Major Management Changes, Governance Uproar &amp; Strategic Catalysts
          </span>
          <span class="text-slate-500 font-mono text-[10px]">Real-time Regulatory Event Feed</span>
        </div>

        ${events.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            ${events.map(ev => {
              const isPositive = ev.severity === 'POSITIVE_CATALYST';
              const isCritical = ev.severity === 'CRITICAL_RED_FLAG';
              const cardBg = isPositive
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : isCritical
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : 'bg-amber-950/20 border-amber-500/30';
              const badgeClass = isPositive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : isCritical
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30';
              const icon = isPositive
                ? 'fa-circle-check text-emerald-400'
                : isCritical
                  ? 'fa-skull-crossbones text-rose-400'
                  : 'fa-triangle-exclamation text-amber-400';

              return `
                <div class="p-3 rounded-xl border ${cardBg} space-y-1.5 shadow-sm">
                  <div class="flex items-center justify-between text-[10px] font-mono">
                    <span class="text-slate-400">${ev.eventDate}</span>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold border ${badgeClass}">
                      ${ev.eventType.replace('_', ' ')}
                    </span>
                  </div>
                  <div class="text-xs font-bold text-white flex items-start space-x-1.5">
                    <i class="fa-solid ${icon} text-[11px] mt-0.5 flex-shrink-0"></i>
                    <span>${ev.headline}</span>
                  </div>
                  <p class="text-[11px] text-slate-300 leading-snug">${ev.details}</p>
                  <div class="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center space-x-1">
                    <strong class="text-slate-300">Impact:</strong>
                    <span>${ev.strategicImpact}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 text-xs italic">
            Zero negative governance uproar, management resignations, or regulatory show-cause notices recorded. Leadership structure remains stable.
          </div>
        `}
      </div>
    </div>
  `;
}

function jumpToInspectorSection(sectionId, btn) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll('.inspector-subnav-btn').forEach(b => {
      b.className = 'inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition whitespace-nowrap';
    });
    btn.className = 'inspector-subnav-btn px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 transition whitespace-nowrap';
  }
}

window.jumpToInspectorSection = jumpToInspectorSection;
window.renderInstitutionalSupplyChainEcosystem = renderInstitutionalSupplyChainEcosystem;
window.renderShareholdingPatternAndWhaleAlerts = renderShareholdingPatternAndWhaleAlerts;
window.renderManagementAuditSection = renderManagementAuditSection;


window.openCreateAlertModal = openCreateAlertModal;
window.closeCreateAlertModal = closeCreateAlertModal;
window.setAlertDirection = setAlertDirection;
window.setAlertOffsetPercent = setAlertOffsetPercent;
window.updateAlertDeltaHint = updateAlertDeltaHint;
window.handleCreateAlertSubmit = handleCreateAlertSubmit;
window.openAlertsModal = openAlertsModal;
window.closeAlertsModal = closeAlertsModal;
window.switchAlertsTab = switchAlertsTab;
window.handleDeleteAlert = handleDeleteAlert;
window.handleToggleAlert = handleToggleAlert;
window.handleManualAlertEvaluation = handleManualAlertEvaluation;
window.handleSaveEmailSettings = handleSaveEmailSettings;
window.handleSendTestEmail = handleSendTestEmail;
window.loadSwingRadarFeed = loadSwingRadarFeed;
window.openPortfolioSwingRadarModal = openPortfolioSwingRadarModal;
window.closePortfolioSwingRadarModal = closePortfolioSwingRadarModal;
window.switchPortSwingTab = switchPortSwingTab;
window.loadPortfolioSwingRadar = loadPortfolioSwingRadar;
window.toggleHeaderMoreDropdown = toggleHeaderMoreDropdown;
window.applyAppTheme = applyAppTheme;
window.toggleSectorFilter = toggleSectorFilter;
window.toggleMarketCapFilter = toggleMarketCapFilter;
window.renderPortfolioAllocationCharts = renderPortfolioAllocationCharts;

// ========================================================
// HERO FEATURE SHOWCASE: WHY WE'RE DIFFERENT MODAL
// ========================================================
function openWhyDifferentModal() {
  const modal = document.getElementById("modalWhyDifferent");
  if (modal) modal.classList.remove("hidden");
}

function closeWhyDifferentModal() {
  const modal = document.getElementById("modalWhyDifferent");
  if (modal) modal.classList.add("hidden");
}

function scrollToBriefing() {
  navigateTo('portfolio');
  const section = document.getElementById("morningBriefingSection");
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    section.classList.add("ring-2", "ring-cyan-400/80");
    setTimeout(() => section.classList.remove("ring-2", "ring-cyan-400/80"), 2500);
  }
}

window.openWhyDifferentModal = openWhyDifferentModal;
window.closeWhyDifferentModal = closeWhyDifferentModal;
window.scrollToBriefing = scrollToBriefing;

// Initial theme setup & surveillance badge fetch
initThemeFromStorage();
setTimeout(updateHeaderAlertsBadge, 500);




// ============================================================================
// REAL-TIME INSTANT STOCK SEARCH & AUTOCOMPLETE RECOMMENDATIONS ENGINE
// Triggers instantly on the 1st character with dual-tier synchronous + async matching
// ============================================================================

function setupStockSearchAutocomplete() {
  const holdingsInput = document.getElementById("holdingsSearch");
  const holdingsDropdown = document.getElementById("holdingsSearchSuggestions");
  const holdingsWrapper = document.getElementById("holdingsSearchWrapper");

  const inspectorInput = document.getElementById("inspectorTicker");
  const inspectorDropdown = document.getElementById("inspectorTickerSuggestions");
  const inspectorWrapper = document.getElementById("inspectorSearchWrapper");

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  // Highlight query within text
  function highlightMatch(text, query) {
    if (!text || !query) return escapeHtml(text);
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<mark class="bg-cyan-500/30 text-cyan-200 font-bold px-0.5 rounded">$1</mark>');
  }

  // Dual-tier stock search provider
  function getSynchronousMatches(q) {
    if (!q) return [];
    const query = q.toUpperCase();
    const results = [];
    const seen = new Set();

    // 1. Prioritize portfolio holdings
    if (currentPortfolioData && currentPortfolioData.holdings) {
      currentPortfolioData.holdings.forEach(h => {
        const ticker = (h.ticker || "").toUpperCase();
        const name = (h.name || "").toUpperCase();
        const sector = (h.sector || "").toUpperCase();

        let priority = 0;
        if (ticker === query) priority = 100;
        else if (ticker.startsWith(query)) priority = 90;
        else if (name.startsWith(query)) priority = 80;
        else if (ticker.includes(query)) priority = 60;
        else if (name.includes(query)) priority = 50;
        else if (sector.includes(query)) priority = 30;

        if (priority > 0) {
          seen.add(ticker);
          results.push({
            ticker: h.ticker,
            name: h.name,
            sector: h.sector,
            currentPrice: h.price || h.currentPrice || 0,
            isHeld: true,
            quantityHeld: h.quantity,
            unrealizedPnLPercent: h.unrealizedPnLPercent,
            priority: priority + 20 // boost holdings
          });
        }
      });
    }

    return results.sort((a, b) => b.priority - a.priority).slice(0, 10);
  }

  // Render suggestion items into dropdown
  function renderDropdown(items, dropdown, query, onSelect) {
    if (!dropdown) return;
    if (!items || items.length === 0) {
      dropdown.innerHTML = `<div class="p-3.5 text-center text-xs text-slate-400 italic">No matching stocks found for "${escapeHtml(query)}"</div>`;
      dropdown.classList.remove("hidden");
      return;
    }

    let activeIndex = -1;

    dropdown.innerHTML = items.map((it, idx) => {
      const pnlBadge = it.isHeld
        ? `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Held: ${Math.round(it.quantityHeld || 0)} sh (${(it.unrealizedPnLPercent ?? 0) >= 0 ? '+' : ''}${(it.unrealizedPnLPercent ?? 0).toFixed(1)}%)</span>`
        : `<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">Watchlist</span>`;

      return `
        <div class="search-suggestion-item group" data-index="${idx}" data-ticker="${it.ticker}">
          <div class="flex items-center space-x-2.5 min-w-0 pr-2">
            <span class="font-mono font-bold text-white text-xs tracking-wide group-hover:text-cyan-300 transition flex-shrink-0">${highlightMatch(it.ticker, query)}</span>
            <div class="min-w-0 flex-1">
              <div class="text-[11px] text-slate-300 truncate" title="${it.name}">${highlightMatch(it.name, query)}</div>
              <div class="text-[9px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span class="px-1.5 py-0.2 rounded bg-[#060c18] border border-[#16233d]">${it.sector}</span>
                ${pnlBadge}
              </div>
            </div>
          </div>
          <div class="text-right flex-shrink-0 font-mono">
            <div class="text-xs font-bold text-white">&#8377;${(it.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
            <div class="text-[9px] text-cyan-400 font-semibold group-hover:underline">Select &rarr;</div>
          </div>
        </div>
      `;
    }).join("");

    dropdown.classList.remove("hidden");

    // Add click listeners to items
    const rows = dropdown.querySelectorAll(".search-suggestion-item");
    rows.forEach((row, i) => {
      row.addEventListener("mousedown", (e) => {
        e.preventDefault(); // prevent input blur before selection
        const ticker = row.getAttribute("data-ticker");
        const selected = items.find(x => x.ticker === ticker) || items[i];
        onSelect(selected);
      });
      row.addEventListener("mouseenter", () => {
        rows.forEach(r => r.classList.remove("active"));
        row.classList.add("active");
        activeIndex = i;
      });
    });

    return {
      navigate(direction) {
        if (rows.length === 0) return;
        rows.forEach(r => r.classList.remove("active"));
        if (direction === "down") {
          activeIndex = (activeIndex + 1) % rows.length;
        } else if (direction === "up") {
          activeIndex = (activeIndex - 1 + rows.length) % rows.length;
        }
        if (activeIndex >= 0 && activeIndex < rows.length) {
          rows[activeIndex].classList.add("active");
          rows[activeIndex].scrollIntoView({ block: 'nearest' });
        }
      },
      selectActive() {
        if (rows.length === 0) return;
        const targetIdx = activeIndex >= 0 ? activeIndex : 0;
        const ticker = rows[targetIdx].getAttribute("data-ticker");
        const selected = items.find(x => x.ticker === ticker) || items[targetIdx];
        onSelect(selected);
      }
    };
  }

  // -------------------------------------------------------------
  // Wire Autocomplete for Holdings Table Search Box (#holdingsSearch)
  // -------------------------------------------------------------
  if (holdingsInput && holdingsDropdown) {
    let activeNav = null;
    let asyncFetchTimer = null;

    holdingsInput.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      if (q.length < 1) {
        holdingsDropdown.classList.add("hidden");
        holdingsDropdown.innerHTML = "";
        return;
      }

      // Tier 1: Instant Synchronous Matching (0ms delay)
      const syncMatches = getSynchronousMatches(q);
      activeNav = renderDropdown(syncMatches, holdingsDropdown, q, (item) => {
        holdingsInput.value = item.ticker;
        searchQuery = item.ticker.toLowerCase();
        renderHoldingsTable();
        holdingsDropdown.classList.add("hidden");

        // Smooth scroll and pulse-highlight selected table row
        setTimeout(() => {
          const rows = document.querySelectorAll("#holdingsTableBody tr");
          rows.forEach(r => {
            if (r.textContent.includes(item.ticker)) {
              r.scrollIntoView({ behavior: 'smooth', block: 'center' });
              r.classList.add("ring-2", "ring-cyan-400", "bg-cyan-500/10");
              setTimeout(() => {
                r.classList.remove("ring-2", "ring-cyan-400", "bg-cyan-500/10");
              }, 2200);
            }
          });
        }, 80);
      });

      // Tier 2: Debounced Asynchronous Enrichment from Backend (/api/stocks/search)
      clearTimeout(asyncFetchTimer);
      asyncFetchTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/stocks/search?query=${encodeURIComponent(q)}`);
          if (res.ok) {
            const apiItems = await res.json();
            if (apiItems && apiItems.length > 0 && holdingsInput.value.trim().toUpperCase() === q.toUpperCase()) {
              activeNav = renderDropdown(apiItems, holdingsDropdown, q, (item) => {
                holdingsInput.value = item.ticker;
                searchQuery = item.ticker.toLowerCase();
                renderHoldingsTable();
                holdingsDropdown.classList.add("hidden");
                setTimeout(() => {
                  const rows = document.querySelectorAll("#holdingsTableBody tr");
                  rows.forEach(r => {
                    if (r.textContent.includes(item.ticker)) {
                      r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      r.classList.add("ring-2", "ring-cyan-400", "bg-cyan-500/10");
                      setTimeout(() => {
                        r.classList.remove("ring-2", "ring-cyan-400", "bg-cyan-500/10");
                      }, 2200);
                    }
                  });
                }, 80);
              });
            }
          }
        } catch (e) {
          // Keep instant sync matches intact
        }
      }, 120);
    });

    holdingsInput.addEventListener("keydown", (e) => {
      if (!holdingsDropdown.classList.contains("hidden")) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeNav?.navigate("down");
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeNav?.navigate("up");
        } else if (e.key === "Enter") {
          e.preventDefault();
          activeNav?.selectActive();
        } else if (e.key === "Escape") {
          holdingsDropdown.classList.add("hidden");
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Wire Autocomplete for Discover / Inspector Search Box (#inspectorTicker)
  // -------------------------------------------------------------
  if (inspectorInput && inspectorDropdown) {
    let activeNav = null;
    let asyncFetchTimer = null;

    inspectorInput.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      if (q.length < 1) {
        inspectorDropdown.classList.add("hidden");
        inspectorDropdown.innerHTML = "";
        return;
      }

      // Tier 1: Instant Synchronous Matching (0ms delay)
      const syncMatches = getSynchronousMatches(q);
      activeNav = renderDropdown(syncMatches, inspectorDropdown, q, (item) => {
        inspectorInput.value = item.ticker;
        inspectorDropdown.classList.add("hidden");
        handleInspectStock();
      });

      // Tier 2: Debounced Asynchronous Enrichment from Backend (/api/stocks/search)
      clearTimeout(asyncFetchTimer);
      asyncFetchTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/stocks/search?query=${encodeURIComponent(q)}`);
          if (res.ok) {
            const apiItems = await res.json();
            if (apiItems && apiItems.length > 0 && inspectorInput.value.trim().toUpperCase() === q.toUpperCase()) {
              activeNav = renderDropdown(apiItems, inspectorDropdown, q, (item) => {
                inspectorInput.value = item.ticker;
                inspectorDropdown.classList.add("hidden");
                handleInspectStock();
              });
            }
          }
        } catch (e) {
          // Keep instant sync matches intact
        }
      }, 100);
    });

    inspectorInput.addEventListener("keydown", (e) => {
      if (!inspectorDropdown.classList.contains("hidden")) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeNav?.navigate("down");
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeNav?.navigate("up");
        } else if (e.key === "Enter") {
          e.preventDefault();
          activeNav?.selectActive();
        } else if (e.key === "Escape") {
          inspectorDropdown.classList.add("hidden");
        }
      }
    });
  }

  // Global click-outside listener to dismiss autocomplete dropdowns
  document.addEventListener("click", (e) => {
    if (holdingsWrapper && !holdingsWrapper.contains(e.target)) {
      holdingsDropdown?.classList.add("hidden");
    }
    if (inspectorWrapper && !inspectorWrapper.contains(e.target)) {
      inspectorDropdown?.classList.add("hidden");
    }
  });
}

// ============================================================================
// THEORY LAB & MOCK PORTFOLIOS INCUBATOR (PAPER TRADING DESK)
// Researches & tracks 3 distinct market theories from foundational literature
// ============================================================================

let currentTheoriesData = null;
let currentTheoryFilter = 'ALL';

async function loadTheoryPortfolios(forceRefresh = false) {
  const container = document.getElementById("theoryPortfoliosContainer");
  const leaderboard = document.getElementById("theoryLeaderboardCards");
  if (!container) return;

  if (!currentTheoriesData && container.children.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-slate-400 bg-slate-900/60 themed-card border border-slate-800 rounded-2xl">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-purple-400 mb-3"></i>
        <div class="text-sm font-semibold text-slate-300">Loading Academic Theories &amp; Live Constituent Valuations...</div>
        <p class="text-xs text-slate-500 mt-1">Fetching live prices, Piotroski F-Scores, ROCE &amp; Minervini SEPA Trend Templates</p>
      </div>`;
  }

  const refreshBtn = document.getElementById("btnRefreshTheories");
  if (refreshBtn && forceRefresh) {
    refreshBtn.classList.add("opacity-60", "pointer-events-none");
    refreshBtn.innerHTML = `<i class="fa-solid fa-rotate fa-spin text-xs"></i><span>Syncing Quotes...</span>`;
  }

  try {
    const url = `/api/theory-portfolios?refresh=${forceRefresh ? 'true' : 'false'}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    currentTheoriesData = data;
    renderTheoryPortfolios(data);
  } catch (err) {
    console.error("Failed to load theory portfolios:", err);
    if (container && container.children.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-red-400 bg-red-950/20 border border-red-800/40 rounded-2xl">
          <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
          <div class="text-sm font-semibold">Unable to fetch theory incubator portfolios</div>
          <p class="text-xs text-slate-400 mt-1">${escapeHtml(err.message)}</p>
          <button onclick="loadTheoryPortfolios(true)" class="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg border border-slate-700">Retry</button>
        </div>`;
    }
  } finally {
    if (refreshBtn && forceRefresh) {
      refreshBtn.classList.remove("opacity-60", "pointer-events-none");
      refreshBtn.innerHTML = `<i class="fa-solid fa-rotate text-xs"></i><span>Refresh Live Prices</span>`;
    }
  }
}

function renderTheoryPortfolios(data) {
  if (!data || !data.portfolios) return;

  // 1. Update High-Level Banner Stats
  const totalValEl = document.getElementById("incubatorTotalValue");
  const totalPnlEl = document.getElementById("incubatorTotalPnl");
  if (totalValEl && totalPnlEl) {
    const totalCurrentVal = data.portfolios.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalSeedVal = data.portfolios.reduce((sum, p) => sum + (p.initialCapital || 0), 0);
    const totalPnlAmt = totalCurrentVal - totalSeedVal;
    const totalPnlPct = totalSeedVal > 0 ? (totalPnlAmt / totalSeedVal) * 100 : 0;

    totalValEl.textContent = formatINR(totalCurrentVal);
    const sign = totalPnlAmt >= 0 ? '+' : '';
    const colorClass = totalPnlAmt >= 0 ? 'text-emerald-400' : 'text-rose-400';
    totalPnlEl.className = `text-[10px] ${colorClass} mt-0.5 font-medium`;
    totalPnlEl.textContent = `${sign}${formatINR(totalPnlAmt)} (${sign}${totalPnlPct.toFixed(2)}% avg)`;
  }

  // 2. Render Leaderboard Cards
  renderTheoryLeaderboard(data.portfolios, data.benchmarkNifty50ReturnPercent);

  // 3. Render Strategy Deep Dives
  renderTheoryPortfolioCards(data.portfolios, currentTheoryFilter);
}

function renderTheoryLeaderboard(portfolios, benchmarkReturn) {
  const container = document.getElementById("theoryLeaderboardCards");
  if (!container) return;

  const cardsHtml = portfolios.map((p, idx) => {
    const isPiotroski = p.strategyId === "GRAHAM_PIOTROSKI_VALUE";
    const isMagic = p.strategyId === "MAGIC_FORMULA";
    const isSepa = p.strategyId === "SEPA_MOMENTUM";

    const accentColor = isPiotroski ? 'emerald' : (isMagic ? 'cyan' : 'purple');
    const badgeText = isPiotroski ? 'COFFEE CAN (MUKHERJEA)' : (isMagic ? 'MOTILAL QGLP (AGRAWAL)' : 'STAGE 2 MOMENTUM (O\'NEIL)');
    const icon = isPiotroski ? 'fa-mug-hot' : (isMagic ? 'fa-chart-line' : 'fa-bolt-lightning');

    const retSign = p.totalReturnPercent >= 0 ? '+' : '';
    const retClass = p.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400';
    const alphaSign = p.alphaPercent >= 0 ? '+' : '';
    const alphaClass = p.alphaPercent >= 0 ? 'text-teal-300' : 'text-amber-400';

    return `
      <div onclick="filterTheoryView('${p.strategyId}')" class="cursor-pointer group relative overflow-hidden bg-slate-900/80 themed-card border border-slate-800 hover:border-${accentColor}-500/50 rounded-2xl p-5 shadow-lg transition transform hover:-translate-y-0.5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800/80 themed-border">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-${accentColor}-500/15 border border-${accentColor}-500/30 flex items-center justify-center text-${accentColor}-400 text-xs">
              <i class="fa-solid ${icon}"></i>
            </div>
            <div>
              <span class="text-[10px] font-mono font-bold text-${accentColor}-400 tracking-wider">${badgeText}</span>
              <h3 class="text-xs font-bold text-white group-hover:text-${accentColor}-300 transition truncate max-w-[200px]">${escapeHtml(p.category)}</h3>
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 themed-elevated text-slate-300 font-mono border border-slate-700">
            Day ${p.trackingDays}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3 py-4">
          <div>
            <div class="text-[11px] text-slate-400">Mock Valuation</div>
            <div class="text-lg font-bold font-mono text-white mt-0.5">${formatINR(p.currentValue)}</div>
            <div class="text-[10px] text-slate-500 font-mono mt-0.5">Seed: ${formatINR(p.initialCapital)}</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] text-slate-400">Total Return</div>
            <div class="text-lg font-bold font-mono ${retClass} mt-0.5">${retSign}${p.totalReturnPercent.toFixed(2)}%</div>
            <div class="text-[10px] ${alphaClass} font-mono mt-0.5 font-bold">${alphaSign}${p.alphaPercent.toFixed(2)}% vs Nifty</div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-800/80 themed-border grid grid-cols-3 gap-1 text-center text-[10px]">
          <div class="p-1.5 rounded bg-slate-950/50 themed-elevated">
            <div class="text-slate-500">Win Rate</div>
            <div class="font-mono font-bold text-slate-200 mt-0.5">${p.winRatePercent.toFixed(0)}%</div>
          </div>
          <div class="p-1.5 rounded bg-slate-950/50 themed-elevated">
            <div class="text-slate-500">Max DD</div>
            <div class="font-mono font-bold text-slate-200 mt-0.5">${p.maxDrawdownPercent.toFixed(1)}%</div>
          </div>
          <div class="p-1.5 rounded bg-slate-950/50 themed-elevated">
            <div class="text-slate-500">Sharpe</div>
            <div class="font-mono font-bold text-emerald-400 mt-0.5">${p.sharpeRatio.toFixed(2)}</div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-slate-200 transition">
          <span class="truncate pr-2 italic">${escapeHtml((p.literature?.primaryBook || p.literature?.PrimaryBook || '').split('(')[0])}</span>
          <i class="fa-solid fa-arrow-right text-[9px] text-${accentColor}-400"></i>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = cardsHtml;
}

function renderTheoryPortfolioCards(portfolios, filter) {
  const container = document.getElementById("theoryPortfoliosContainer");
  if (!container) return;

  const filtered = filter === 'ALL'
    ? portfolios
    : portfolios.filter(p => p.strategyId === filter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-slate-400">No strategy found matching filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map(p => renderSingleTheoryCardHtml(p)).join('');
}

function renderSingleTheoryCardHtml(p) {
  const isPiotroski = p.strategyId === "GRAHAM_PIOTROSKI_VALUE";
  const isMagic = p.strategyId === "MAGIC_FORMULA";
  const isSepa = p.strategyId === "SEPA_MOMENTUM";

  const accentColor = isPiotroski ? 'emerald' : (isMagic ? 'cyan' : 'purple');
  const icon = isPiotroski ? 'fa-shield-halved' : (isMagic ? 'fa-wand-magic-sparkles' : 'fa-bolt-lightning');

  const totalRet = p.totalReturnPercent ?? 0;
  const alphaVal = p.alphaPercent ?? 0;
  const retSign = totalRet >= 0 ? '+' : '';
  const retClass = totalRet >= 0 ? 'text-emerald-400' : 'text-rose-400';
  const alphaSign = alphaVal >= 0 ? '+' : '';
  const alphaClass = alphaVal >= 0 ? 'text-teal-300' : 'text-amber-400';

  const lit = p.literature || {};
  const primaryBook = lit.primaryBook || lit.PrimaryBook || '';
  const authorOrEconomist = lit.authorOrEconomist || lit.AuthorOrEconomist || '';
  const pubYear = lit.publicationYear || lit.PublicationYear || '';
  const keyAcademicPaper = lit.keyAcademicPaper || lit.KeyAcademicPaper || '';
  const journalOrUniversity = lit.journalOrUniversity || lit.JournalOrUniversity || '';
  const coreTenet = lit.coreTenet || lit.CoreTenet || '';
  const mathFormula = lit.mathematicalFormula || lit.MathematicalFormula || '';
  const exitRules = lit.rebalanceAndExitRules || lit.RebalanceAndExitRules || '';

  // Render Constituents Table Rows
  const constituents = p.constituents || [];
  const rowsHtml = constituents.map((c, i) => {
    const ticker = c.ticker || c.Ticker || '';
    const name = c.name || c.Name || '';
    const sector = c.sector || c.Sector || '';
    const entryPrice = c.entryPrice ?? c.EntryPrice ?? 0;
    const entryDate = (c.entryDate || c.EntryDate || '').split('T')[0];
    const currentPrice = c.currentPrice ?? c.CurrentPrice ?? 0;
    const shares = c.shares ?? c.Shares ?? 0;
    const allocatedCap = c.allocatedCapital ?? c.AllocatedCapital ?? 0;
    const currentVal = c.currentValue ?? c.CurrentValue ?? 0;
    const unrealizedPnl = c.unrealizedPnl ?? c.UnrealizedPnl ?? 0;
    const returnPct = c.returnPercent ?? c.ReturnPercent ?? 0;
    const weightPct = c.weightPercent ?? c.WeightPercent ?? 0;
    const metric = c.quantitativeScreenerMetric || c.QuantitativeScreenerMetric || '';
    const thesis = c.thesisRationale || c.ThesisRationale || '';

    const gainSign = returnPct >= 0 ? '+' : '';
    const gainClass = returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400';
    const badgeBg = returnPct >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border-rose-500/25';

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center space-x-2">
            <span class="font-mono font-bold text-xs text-white">${escapeHtml(ticker)}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 themed-elevated text-slate-400 border border-slate-700">${escapeHtml(sector)}</span>
          </div>
          <div class="text-[11px] text-slate-400 truncate max-w-[180px]">${escapeHtml(name)}</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-right">
          <div class="font-mono text-xs text-slate-300">${formatINR(entryPrice)}</div>
          <div class="text-[10px] text-slate-500 font-mono">${entryDate}</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-right">
          <div class="font-mono text-xs font-bold text-white flex items-center justify-end space-x-1">
            <span>${formatINR(currentPrice)}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Live Sync Active"></span>
          </div>
          <div class="text-[10px] font-mono ${gainClass}">${gainSign}${returnPct.toFixed(2)}%</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-right font-mono text-xs text-slate-300">
          ${shares.toLocaleString('en-IN')}
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-right">
          <div class="font-mono text-xs text-slate-300">${formatINR(allocatedCap)}</div>
          <div class="text-[10px] text-slate-500 font-mono">${weightPct.toFixed(1)}% wt</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-right">
          <div class="font-mono text-xs font-bold text-white">${formatINR(currentVal)}</div>
          <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono border ${badgeBg}">
            ${gainSign}${formatINR(unrealizedPnl)}
          </span>
        </td>
        <td class="px-4 py-3 text-xs">
          <div class="font-mono text-[11px] font-bold text-${accentColor}-300">${escapeHtml(metric)}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${escapeHtml(thesis)}</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-center">
          <div class="flex items-center justify-center space-x-1.5">
            <button type="button" onclick="openWhatIfSwapWithPick('${escapeHtml(ticker)}')" class="px-2.5 py-1 bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 rounded text-[10px] font-semibold transition shadow-xs" title="Simulate replacing one of your holdings with ${escapeHtml(ticker)}">
              <i class="fa-solid fa-arrows-rotate mr-0.5"></i> Swap
            </button>
            <button type="button" onclick="openCreateAlertModal('${escapeHtml(ticker)}', ${currentPrice || entryPrice})" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold transition" title="Set Price Alert">
              <i class="fa-solid fa-bell text-amber-400"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  // Render Milestones Stepper
  const trackingHistory = p.trackingHistory || [];
  const milestonesHtml = trackingHistory.map((m, idx) => {
    const label = m.milestoneLabel || m.MilestoneLabel || '';
    const val = m.portfolioValue ?? m.PortfolioValue ?? 0;
    const ret = m.portfolioReturnPercent ?? m.PortfolioReturnPercent ?? 0;
    const alpha = m.alphaPercent ?? m.AlphaPercent ?? 0;

    const isLive = label.toLowerCase().includes('live') || label.toLowerCase().includes('current');
    const pnlSign = ret >= 0 ? '+' : '';
    const pnlClass = ret >= 0 ? 'text-emerald-400' : 'text-rose-400';
    const borderCol = isLive ? `border-${accentColor}-500/50 bg-${accentColor}-500/10` : 'border-slate-800 bg-slate-950/60';

    return `
      <div class="p-2.5 rounded-xl border ${borderCol} text-left flex-1 min-w-[120px]">
        <div class="flex items-center justify-between text-[10px]">
          <span class="font-semibold ${isLive ? `text-${accentColor}-400 font-bold` : 'text-slate-400'}">${escapeHtml(label)}</span>
          ${isLive ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>' : ''}
        </div>
        <div class="text-xs font-bold font-mono text-white mt-1">${formatINR(val)}</div>
        <div class="text-[10px] font-mono ${pnlClass} mt-0.5">${pnlSign}${ret.toFixed(2)}%</div>
        <div class="text-[9px] text-slate-500 font-mono mt-0.5">Alpha: +${alpha.toFixed(2)}%</div>
      </div>`;
  }).join('');

  // Render Journal Notes
  const journalNotes = p.researchJournalNotes || [];
  const notesHtml = journalNotes.map(n => `
    <div class="flex items-start space-x-2 text-xs py-1.5 border-b border-slate-800/60 last:border-0">
      <i class="fa-solid fa-clock-rotate-left text-slate-500 text-[10px] mt-1"></i>
      <div class="text-slate-300">${escapeHtml(n)}</div>
    </div>`).join('');

  return `
    <div class="bg-slate-900/80 themed-card border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl space-y-6">
      <!-- Strategy Header Banner -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 themed-border">
        <div class="flex items-start sm:items-center space-x-3.5">
          <div class="w-12 h-12 rounded-2xl bg-${accentColor}-500/15 border border-${accentColor}-500/35 flex items-center justify-center text-${accentColor}-400 text-lg shadow-md shadow-${accentColor}-500/10 flex-shrink-0">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2 flex-wrap gap-y-1">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-${accentColor}-500/15 text-${accentColor}-300 border border-${accentColor}-500/30">
                ${escapeHtml((p.category || '').toUpperCase())}
              </span>
              <span class="text-xs font-bold text-white">${escapeHtml(p.name)}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">${escapeHtml(p.tagline)}</p>
          </div>
        </div>

        <div class="flex items-center space-x-3 flex-shrink-0">
          <div class="text-right">
            <div class="text-[10px] text-slate-400">Mock Valuation (₹10L Seed)</div>
            <div class="text-lg font-bold font-mono text-white">${formatINR(p.currentValue)}</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950/80 themed-elevated border border-slate-800 text-right">
            <div class="text-[10px] text-slate-400">Net Return</div>
            <div class="text-base font-bold font-mono ${retClass}">${retSign}${totalRet.toFixed(2)}%</div>
            <div class="text-[9px] ${alphaClass} font-mono font-bold">${alphaSign}${alphaVal.toFixed(2)}% Alpha</div>
          </div>
        </div>
      </div>

      <!-- Academic Literature & Economists Research Citation Box -->
      <div class="p-4 rounded-xl bg-slate-950/70 themed-elevated border border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-book-open text-${accentColor}-400 text-xs"></i>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Academic Foundation &amp; Literature Citations</span>
          </div>
          <span class="text-[10px] font-mono text-slate-400">Published Research Verification</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="space-y-1.5 p-3 rounded-lg bg-slate-900/60 themed-card border border-slate-800/80">
            <div class="text-[10px] font-semibold text-${accentColor}-400 uppercase">Foundational Book &amp; Economists</div>
            <div class="text-xs font-bold text-slate-200">${escapeHtml(primaryBook)}</div>
            <div class="text-[11px] text-slate-400 italic">Author: ${escapeHtml(authorOrEconomist)} (${pubYear})</div>
          </div>
          <div class="space-y-1.5 p-3 rounded-lg bg-slate-900/60 themed-card border border-slate-800/80">
            <div class="text-[10px] font-semibold text-${accentColor}-400 uppercase">Peer-Reviewed Research Paper</div>
            <div class="text-xs font-bold text-slate-200">"${escapeHtml(keyAcademicPaper)}"</div>
            <div class="text-[11px] text-slate-400 italic">${escapeHtml(journalOrUniversity)}</div>
          </div>
        </div>

        <div class="p-3 rounded-lg bg-slate-900/60 themed-card border border-slate-800/80 space-y-2 text-xs">
          <div>
            <span class="font-bold text-slate-200">Core Market Anomaly &amp; Philosophy: </span>
            <span class="text-slate-400">${escapeHtml(coreTenet)}</span>
          </div>
          <div class="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div class="flex items-center space-x-2">
              <span class="font-mono text-[11px] font-bold text-${accentColor}-400">SCREENER FORMULA:</span>
              <code class="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-300 border border-slate-800">${escapeHtml(mathFormula)}</code>
            </div>
            <div class="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <i class="fa-solid fa-triangle-exclamation mr-1"></i> Exit Rule: ${escapeHtml((exitRules || '').split('.')[0])}.
            </div>
          </div>
        </div>
      </div>

      <!-- Multi-Month Tracking Trajectory Stepper -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-300">
            <i class="fa-solid fa-chart-line text-${accentColor}-400 mr-1.5"></i> Multi-Month Observation Trajectory (Paper Tracking Checkpoints)
          </span>
          <span class="text-[10px] text-slate-500">Benchmark: Nifty 50 (+3.42%)</span>
        </div>
        <div class="flex items-center space-x-2 overflow-x-auto pb-1">
          ${milestonesHtml}
        </div>
      </div>

      <!-- Constituents Mock Portfolio Table -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-300">
            <i class="fa-solid fa-list-check text-${accentColor}-400 mr-1.5"></i> Active Mock Constituents (${constituents.length} Positions)
          </span>
          <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Live Prices Synced
          </span>
        </div>
        <div class="overflow-x-auto rounded-xl border border-slate-800 themed-border shadow-inner">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950/70 themed-elevated border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th class="px-4 py-2.5">Stock / Company</th>
                <th class="px-3 py-2.5 text-right">Entry (₹)</th>
                <th class="px-3 py-2.5 text-right">Live CMP (₹)</th>
                <th class="px-3 py-2.5 text-right">Qty</th>
                <th class="px-3 py-2.5 text-right">Seed Capital (₹)</th>
                <th class="px-3 py-2.5 text-right">Mock Value (₹)</th>
                <th class="px-4 py-2.5">Quantitative Metric &amp; Thesis</th>
                <th class="px-3 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80 themed-border bg-slate-900/40">
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Observation & Paper Trading Journal -->
      <div class="p-4 rounded-xl bg-slate-950/60 themed-elevated border border-slate-800/80 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-pen-to-square text-${accentColor}-400 text-xs"></i>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Multi-Month Research Journal &amp; Notes</span>
          </div>
          <span class="text-[10px] text-slate-500">${journalNotes.length} Logged Entries</span>
        </div>

        <div class="space-y-1 max-h-40 overflow-y-auto pr-1">
          ${notesHtml}
        </div>

        <div class="pt-2 border-t border-slate-800 flex items-center space-x-2">
          <input id="noteInput_${p.strategyId}" type="text" placeholder="Log your observation (e.g. Q2 earnings result, volume breakout, stop-loss check)..." class="flex-1 bg-slate-900 themed-card border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-${accentColor}-400" />
          <button onclick="submitTheoryJournalNote('${p.strategyId}')" class="px-3.5 py-1.5 bg-${accentColor}-600/30 hover:bg-${accentColor}-600/40 text-${accentColor}-300 hover:text-white rounded-lg text-xs font-bold border border-${accentColor}-500/40 transition flex items-center space-x-1.5 flex-shrink-0">
            <i class="fa-solid fa-plus text-[10px]"></i>
            <span>Log Note</span>
          </button>
        </div>
      </div>
    </div>`;
}

function filterTheoryView(filterId) {
  currentTheoryFilter = filterId;

  // Update button active styling
  const buttons = [
    { id: 'theoryFilterAll', key: 'ALL' },
    { id: 'theoryFilterPiotroski', key: 'GRAHAM_PIOTROSKI_VALUE' },
    { id: 'theoryFilterMagic', key: 'MAGIC_FORMULA' },
    { id: 'theoryFilterSepa', key: 'SEPA_MOMENTUM' }
  ];

  buttons.forEach(b => {
    const el = document.getElementById(b.id);
    if (!el) return;
    if (b.key === filterId) {
      el.className = 'theory-filter-btn px-3 py-1.5 rounded-md text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 transition';
    } else {
      el.className = 'theory-filter-btn px-3 py-1.5 rounded-md text-xs font-semibold text-slate-400 hover:text-white transition';
    }
  });

  if (currentTheoriesData) {
    renderTheoryPortfolioCards(currentTheoriesData.portfolios, filterId);
  }
}

async function refreshTheoryPortfolios(userInitiated = false) {
  await loadTheoryPortfolios(true);
  if (userInitiated) {
    showToast("🔬 Live quotes & returns refreshed across all 3 Theory Portfolios!");
  }
}

async function submitTheoryJournalNote(strategyId) {
  const input = document.getElementById(`noteInput_${strategyId}`);
  if (!input || !input.value.trim()) {
    showToast("Please enter an observation note.");
    return;
  }

  const noteText = input.value.trim();
  try {
    const res = await fetch(`/api/theory-portfolios/${strategyId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText })
    });

    if (!res.ok) throw new Error("Failed to save note");
    input.value = "";
    showToast("📝 Observation logged in Theory Research Journal!");
    await loadTheoryPortfolios(false);
  } catch (err) {
    console.error("Failed to add note:", err);
    showToast("Error saving journal note.");
  }
}

function exportTheoryTrackingData() {
  if (!currentTheoriesData) {
    showToast("No theory data to export yet.");
    return;
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    benchmarkNifty50Return: currentTheoriesData.benchmarkNifty50ReturnPercent,
    executiveSummary: currentTheoriesData.executiveSummary,
    portfolios: currentTheoriesData.portfolios
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `theory_incubator_mock_portfolios_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("📊 Theory Tracking Report exported successfully!");
}

window.loadTheoryPortfolios = loadTheoryPortfolios;
window.renderTheoryPortfolios = renderTheoryPortfolios;
window.filterTheoryView = filterTheoryView;
window.refreshTheoryPortfolios = refreshTheoryPortfolios;
window.submitTheoryJournalNote = submitTheoryJournalNote;
window.exportTheoryTrackingData = exportTheoryTrackingData;

// ============================================================================
// REAL PORTFOLIO THEORY HEALTH AUDIT & WHAT-IF SWAP SIMULATOR
// Evaluates real investor holdings against Graham, Greenblatt & Minervini
// ============================================================================

let currentAuditData = null;
let currentAuditFilter = 'TOXIC';
let activeSwapHolding = null;

async function loadPortfolioTheoryAudit(forceRefresh = false) {
  if (!currentPortfolioId) {
    try {
      const pRes = await fetch('/api/portfolios');
      if (pRes.ok) {
        const pList = await pRes.json();
        if (pList && pList.length > 0) {
          currentPortfolioId = pList[0].id;
        }
      }
    } catch (e) {
      console.warn("Could not resolve default portfolio for theory audit:", e);
    }
  }
  if (!currentPortfolioId) return;

  const btn = document.getElementById("btnReauditPortfolio");
  if (btn && forceRefresh) {
    btn.classList.add("opacity-60", "pointer-events-none");
    btn.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin text-xs"></i><span>Scanning 100+ Holdings...</span>`;
  }

  try {
    const res = await fetch(`/api/theory-portfolios/audit/${currentPortfolioId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    currentAuditData = data;
    renderPortfolioTheoryAudit(data);
  } catch (err) {
    console.error("Failed to load portfolio theory audit:", err);
    const box = document.getElementById("auditVerdictText");
    if (box) box.textContent = "Unable to complete theory audit on active portfolio.";
  } finally {
    if (btn && forceRefresh) {
      btn.classList.remove("opacity-60", "pointer-events-none");
      btn.innerHTML = `<i class="fa-solid fa-arrows-rotate text-xs"></i><span>Re-Scan My Portfolio</span>`;
      showToast("⚡ Theory Health Audit complete across your holdings!");
    }
  }
}

function renderPortfolioTheoryAudit(data) {
  if (!data) return;

  // 1. Update High-Level Scorecard Pills
  const totalText = document.getElementById("auditTotalHoldingsText");
  if (totalText) totalText.textContent = data.totalHoldingsCount;

  const champBadge = document.getElementById("auditChampionsBadge");
  const champVal = document.getElementById("auditChampionsVal");
  if (champBadge && champVal) {
    champBadge.textContent = `${data.championsCount} (${data.championsWeightPercent}%)`;
    champVal.textContent = formatINR(data.championsValue);
  }

  const nearBadge = document.getElementById("auditNearMissBadge");
  const nearVal = document.getElementById("auditNearMissVal");
  if (nearBadge && nearVal) {
    nearBadge.textContent = `${data.nearMissCount} (${data.nearMissWeightPercent}%)`;
    nearVal.textContent = formatINR(data.nearMissValue);
  }

  const toxicBadge = document.getElementById("auditToxicBadge");
  const toxicVal = document.getElementById("auditToxicVal");
  if (toxicBadge && toxicVal) {
    toxicBadge.textContent = `${data.toxicCount} (${data.toxicWeightPercent}%)`;
    toxicVal.textContent = formatINR(data.toxicValue);
  }

  const recCap = document.getElementById("auditRecoverableCapital");
  if (recCap) {
    recCap.textContent = formatINR(data.capitalLockedInToxicAssets);
  }

  const verdictText = document.getElementById("auditVerdictText");
  if (verdictText) {
    verdictText.textContent = data.executiveVerdict;
  }

  // Update Button Counts
  const btnToxic = document.getElementById("auditCountBtnToxic");
  if (btnToxic) btnToxic.textContent = data.toxicCount;

  const btnChamp = document.getElementById("auditCountBtnChampions");
  if (btnChamp) btnChamp.textContent = data.championsCount;

  const btnNear = document.getElementById("auditCountBtnNearMiss");
  if (btnNear) btnNear.textContent = data.nearMissCount;

  const btnAll = document.getElementById("auditCountBtnAll");
  if (btnAll) btnAll.textContent = data.totalHoldingsCount;

  // Render Table
  renderPortfolioAuditTable();
}

function filterAuditTable(filterKey) {
  currentAuditFilter = filterKey;

  const buttons = [
    { id: 'auditBtnFilterToxic', key: 'TOXIC' },
    { id: 'auditBtnFilterChampions', key: 'CHAMPIONS' },
    { id: 'auditBtnFilterNearMiss', key: 'NEARMISS' },
    { id: 'auditBtnFilterAll', key: 'ALL' }
  ];

  buttons.forEach(b => {
    const el = document.getElementById(b.id);
    if (!el) return;
    if (b.key === filterKey) {
      if (b.key === 'TOXIC') {
        el.className = 'audit-filter-btn px-3 py-1.5 rounded-md font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 transition';
      } else if (b.key === 'CHAMPIONS') {
        el.className = 'audit-filter-btn px-3 py-1.5 rounded-md font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 transition';
      } else if (b.key === 'NEARMISS') {
        el.className = 'audit-filter-btn px-3 py-1.5 rounded-md font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 transition';
      } else {
        el.className = 'audit-filter-btn px-3 py-1.5 rounded-md font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 transition';
      }
    } else {
      el.className = 'audit-filter-btn px-3 py-1.5 rounded-md font-medium text-slate-400 hover:text-white transition';
    }
  });

  renderPortfolioAuditTable();
}

function renderPortfolioAuditTable() {
  const tbody = document.getElementById("portfolioAuditTableBody");
  if (!tbody || !currentAuditData || !currentAuditData.holdings) return;

  const allHoldings = currentAuditData.holdings;
  const filtered = allHoldings.filter(h => {
    if (currentAuditFilter === 'TOXIC') return h.classification === 2;
    if (currentAuditFilter === 'CHAMPIONS') return h.classification === 0;
    if (currentAuditFilter === 'NEARMISS') return h.classification === 1;
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-slate-400 text-xs">
          No holdings found matching this filter category.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(h => {
    const isToxic = h.classification === 2;
    const isChampion = h.classification === 0;

    let badgeClass = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    let badgeText = '⚠️ Near-Miss Watchlist';
    let rowHighlight = '';

    if (isChampion) {
      badgeClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold';
      badgeText = '🏆 Theory Champion';
    } else if (isToxic) {
      badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/35 font-bold';
      badgeText = '🚨 Toxic Laggard (Prune)';
      rowHighlight = 'bg-rose-950/10';
    }

    const pnlSign = h.unrealizedPnLPercent >= 0 ? '+' : '';
    const pnlClass = h.unrealizedPnLPercent >= 0 ? 'text-emerald-400' : 'text-rose-400';

    const passedTheoriesHtml = (h.passedTheories && h.passedTheories.length > 0)
      ? h.passedTheories.map(t => `<span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mr-1 mb-0.5">✓ ${escapeHtml(t.split(' ')[0])}</span>`).join('')
      : '<span class="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">✗ Fails All 3</span>';

    return `
      <tr class="hover:bg-slate-800/40 transition ${rowHighlight}">
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center space-x-2">
            <span class="font-mono font-bold text-xs text-white">${escapeHtml(h.ticker)}</span>
            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 themed-elevated text-slate-400 border border-slate-700">${escapeHtml(h.sector)}</span>
          </div>
          <div class="text-[11px] text-slate-400 truncate max-w-[170px]">${escapeHtml(h.name)}</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-right">
          <div class="font-mono text-xs font-bold text-white">${formatINR(h.marketValue)}</div>
          <div class="text-[10px] text-slate-500 font-mono">${h.weightPercent.toFixed(1)}% wt</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap text-right">
          <div class="font-mono text-xs font-bold ${pnlClass}">${pnlSign}${h.unrealizedPnLPercent.toFixed(2)}%</div>
          <div class="text-[10px] text-slate-500 font-mono">${pnlSign}${formatINR(h.unrealizedPnL)}</div>
        </td>
        <td class="px-3 py-3 whitespace-nowrap">
          <span class="inline-block px-2 py-0.5 rounded text-[10px] border ${badgeClass}">
            ${badgeText}
          </span>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">ROCE: ${h.rocePercent.toFixed(1)}% | D/E: ${h.debtToEquity.toFixed(2)}</div>
        </td>
        <td class="px-3 py-3">
          <div class="flex flex-wrap max-w-[200px]">
            ${passedTheoriesHtml}
          </div>
        </td>
        <td class="px-3 py-3 max-w-[260px]">
          <div class="text-slate-300 text-[11px]">${escapeHtml(h.plainEnglishReason)}</div>
          <div class="text-[10px] text-amber-300/90 mt-0.5 italic">${escapeHtml(h.recommendedAction)}</div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap text-center">
          <div class="flex items-center justify-center space-x-1.5">
            ${isToxic ? `
              <button onclick="openTradeModal('${escapeHtml(h.ticker)}', 'SELL')" class="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded-lg text-[11px] font-bold transition flex items-center space-x-1" title="Sell / Trim this position">
                <i class="fa-solid fa-scissors text-[10px]"></i>
                <span>Prune</span>
              </button>` : ''}
            <button onclick="openWhatIfSwapModal('${escapeHtml(h.ticker)}')" class="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1" title="Simulate replacing with a Theory Leader">
              <i class="fa-solid fa-shuffle text-[10px]"></i>
              <span>Swap</span>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

// -------------------------------------------------------------
// Institutional Decision Hub: Tabs (Audit, Correlation, Macro)
// -------------------------------------------------------------
let currentTheoryHubTab = 'AUDIT';

function switchTheoryHubTab(tab) {
  currentTheoryHubTab = tab;
  const deskAudit = document.getElementById("deskTheoryAudit");
  const deskCorr = document.getElementById("deskCorrelationMatrix");
  const deskMacro = document.getElementById("deskMacroStress");

  const btnAudit = document.getElementById("hubTabAudit");
  const btnCorr = document.getElementById("hubTabCorrelation");
  const btnMacro = document.getElementById("hubTabMacro");

  const activeAudit = "bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold";
  const activeCorr = "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold";
  const activeMacro = "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold";
  const inactive = "text-slate-400 hover:text-white border-transparent";

  if (deskAudit) deskAudit.classList.toggle("hidden", tab !== 'AUDIT');
  if (deskCorr) deskCorr.classList.toggle("hidden", tab !== 'CORRELATION');
  if (deskMacro) deskMacro.classList.toggle("hidden", tab !== 'MACRO');

  if (btnAudit) btnAudit.className = `hub-tab-btn px-3 py-1.5 rounded-md text-xs transition ${tab === 'AUDIT' ? activeAudit : inactive}`;
  if (btnCorr) btnCorr.className = `hub-tab-btn px-3 py-1.5 rounded-md text-xs transition ${tab === 'CORRELATION' ? activeCorr : inactive}`;
  if (btnMacro) btnMacro.className = `hub-tab-btn px-3 py-1.5 rounded-md text-xs transition ${tab === 'MACRO' ? activeMacro : inactive}`;

  if (tab === 'CORRELATION') {
    loadCorrelationMatrix();
  } else if (tab === 'MACRO') {
    runMacroStressScenario('crude_surge');
  }
}

// -------------------------------------------------------------
// What-If Stock Swap Simulator Modal Functions (Feature 2)
// -------------------------------------------------------------
const SWAP_CANDIDATES = {
  "TITAN": { name: "Titan Company Ltd", sector: "ConsumerDiscretionary", price: 3620.00, roce: 26.5, debt: 0.1, rs: 88, beta: 0.85 },
  "PIDILITIND": { name: "Pidilite Industries Ltd", sector: "Materials", price: 3280.00, roce: 28.2, debt: 0.0, rs: 86, beta: 0.72 },
  "ASIANPAINT": { name: "Asian Paints Limited", sector: "ConsumerDiscretionary", price: 2960.00, roce: 29.5, debt: 0.0, rs: 82, beta: 0.78 },
  "HDFCBANK": { name: "HDFC Bank Limited", sector: "Financials", price: 1740.00, roce: 16.8, debt: 0.0, rs: 84, beta: 0.88 },
  "TCS": { name: "Tata Consultancy Services", sector: "Technology", price: 3390.00, roce: 54.0, debt: 0.0, rs: 86, beta: 0.75 },
  "TRENT": { name: "Trent Ltd", sector: "ConsumerDiscretionary", price: 3173.61, roce: 32.5, debt: 0.1, rs: 96, beta: 1.05 },
  "DIXON": { name: "Dixon Technologies", sector: "Industrials", price: 14250.00, roce: 31.0, debt: 0.15, rs: 91, beta: 1.08 },
  "KAYNES": { name: "Kaynes Technology India", sector: "Industrials", price: 3626.30, roce: 28.0, debt: 0.2, rs: 88, beta: 1.15 },
  "POLYCAB": { name: "Polycab India Limited", sector: "Industrials", price: 7150.00, roce: 28.0, debt: 0.05, rs: 92, beta: 0.95 },
  "BEL": { name: "Bharat Electronics Ltd", sector: "Industrials", price: 335.52, roce: 36.2, debt: 0.0, rs: 92, beta: 0.82 },
  "MAZDOCK": { name: "Mazagon Dock Shipbuilders", sector: "Industrials", price: 2566.00, roce: 38.0, debt: 0.0, rs: 94, beta: 1.10 },
  "PREMIERENE": { name: "Premier Energies Ltd", sector: "Utilities", price: 1001.80, roce: 26.5, debt: 0.40, rs: 89, beta: 1.12 },
  "BSE": { name: "BSE Limited", sector: "Financials", price: 5210.00, roce: 35.0, debt: 0.0, rs: 95, beta: 1.15 },
  "PERSISTENT": { name: "Persistent Systems", sector: "Technology", price: 5120.00, roce: 31.2, debt: 0.0, rs: 90, beta: 0.92 },
  "KPITTECH": { name: "KPIT Technologies", sector: "Technology", price: 1640.00, roce: 33.0, debt: 0.0, rs: 87, beta: 1.05 }
};

function openWhatIfSwapWithPick(pickTicker) {
  if (currentAuditData && currentAuditData.holdings && currentAuditData.holdings.length > 0) {
    const laggard = currentAuditData.holdings.find(h => h.category === "ToxicLaggard")
                 || currentAuditData.holdings.find(h => h.category === "NearMiss")
                 || currentAuditData.holdings[0];
    if (laggard) {
      activeSwapHolding = laggard;
      const exitTickerEl = document.getElementById("swapExitTicker");
      const exitDetailsEl = document.getElementById("swapExitDetails");
      const releasedCapEl = document.getElementById("swapReleasedCapital");
      if (exitTickerEl) exitTickerEl.textContent = `${laggard.ticker} (${laggard.sector})`;
      if (exitDetailsEl) exitDetailsEl.textContent = `${laggard.name} • ${laggard.quantity} shares @ CMP ${formatINR(laggard.currentPrice)} (ROCE: ${laggard.rocePercent.toFixed(1)}%, D/E: ${laggard.debtToEquity.toFixed(2)})`;
      if (releasedCapEl) releasedCapEl.textContent = formatINR(laggard.marketValue);
    }
  }

  const select = document.getElementById("swapTargetSelect");
  if (select && pickTicker) {
    select.value = pickTicker;
  }
  updateSwapSimulationPreview();
  const modal = document.getElementById("modalWhatIfSwap");
  if (modal) modal.classList.remove("hidden");
}

function openWhatIfSwapModal(ticker) {
  if (!currentAuditData || !currentAuditData.holdings) return;
  const holding = currentAuditData.holdings.find(h => h.ticker === ticker);
  if (!holding) return;

  activeSwapHolding = holding;

  const exitTickerEl = document.getElementById("swapExitTicker");
  const exitDetailsEl = document.getElementById("swapExitDetails");
  const releasedCapEl = document.getElementById("swapReleasedCapital");

  if (exitTickerEl) exitTickerEl.textContent = `${holding.ticker} (${holding.sector})`;
  if (exitDetailsEl) exitDetailsEl.textContent = `${holding.name} • ${holding.quantity} shares @ CMP ${formatINR(holding.currentPrice)} (ROCE: ${holding.rocePercent.toFixed(1)}%, D/E: ${holding.debtToEquity.toFixed(2)})`;
  if (releasedCapEl) releasedCapEl.textContent = formatINR(holding.marketValue);

  updateSwapSimulationPreview();

  const modal = document.getElementById("modalWhatIfSwap");
  if (modal) modal.classList.remove("hidden");
}

function closeWhatIfSwapModal() {
  const modal = document.getElementById("modalWhatIfSwap");
  if (modal) modal.classList.add("hidden");
  activeSwapHolding = null;
}

async function updateSwapSimulationPreview() {
  if (!activeSwapHolding) return;

  const select = document.getElementById("swapTargetSelect");
  const targetTicker = select ? select.value : "BEL";
  const target = SWAP_CANDIDATES[targetTicker] || SWAP_CANDIDATES["BEL"];

  const targetDetailsEl = document.getElementById("swapTargetDetails");
  const acquiredSharesEl = document.getElementById("swapAcquiredShares");

  const capital = activeSwapHolding.marketValue;
  const sharesToBuy = Math.floor(capital / target.price);
  const remainingCash = capital - (sharesToBuy * target.price);

  if (targetDetailsEl) {
    targetDetailsEl.textContent = `${target.name} • CMP ${formatINR(target.price)} (ROCE: ${target.roce}%, Debt: ${target.debt.toFixed(2)}, RS: ${target.rs})`;
  }
  if (acquiredSharesEl) {
    acquiredSharesEl.textContent = `${sharesToBuy.toLocaleString('en-IN')} shares (~${formatINR(sharesToBuy * target.price)}${remainingCash > 0 ? ` + ${formatINR(remainingCash)} cash` : ''})`;
  }

  // Attempt backend simulation endpoint
  const portfolioId = currentPortfolioId || (currentAuditData ? currentAuditData.portfolioId : null);
  if (portfolioId) {
    try {
      const res = await fetch('/api/theory-portfolios/simulate-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioId: portfolioId,
          exitTicker: activeSwapHolding.ticker,
          targetTicker: targetTicker
        })
      });

      if (res.ok) {
        const sim = await res.json();
        renderSwapSimulationResult(sim);
        return;
      }
    } catch (err) {
      console.warn("Failed to fetch backend swap simulation, falling back to local calculation:", err);
    }
  }

  // Fallback client-side simulation
  renderLocalSwapSimulation(activeSwapHolding, target);
}

function renderSwapSimulationResult(sim) {
  const deltaRoceEl = document.getElementById("swapDeltaRoce");
  if (deltaRoceEl) {
    const sign = sim.deltaRoce >= 0 ? '+' : '';
    deltaRoceEl.textContent = `${sim.beforeWeightedRoce.toFixed(1)}% → ${sim.afterWeightedRoce.toFixed(1)}% (${sign}${sim.deltaRoce.toFixed(2)}%)`;
    deltaRoceEl.className = sim.deltaRoce >= 0 ? "font-mono font-bold text-emerald-400 mt-1" : "font-mono font-bold text-rose-400 mt-1";
  }

  const deltaDebtEl = document.getElementById("swapDeltaDebt");
  if (deltaDebtEl) {
    const sign = sim.deltaDebtToEquity <= 0 ? '' : '+';
    deltaDebtEl.textContent = `${sim.beforeWeightedDebtToEquity.toFixed(2)} → ${sim.afterWeightedDebtToEquity.toFixed(2)} (${sign}${sim.deltaDebtToEquity.toFixed(2)})`;
    deltaDebtEl.className = sim.deltaDebtToEquity <= 0 ? "font-mono font-bold text-teal-300 mt-1" : "font-mono font-bold text-amber-300 mt-1";
  }

  const deltaBetaEl = document.getElementById("swapDeltaBeta");
  if (deltaBetaEl) {
    const sign = sim.deltaBeta <= 0 ? '' : '+';
    deltaBetaEl.textContent = `${sim.beforeEstimatedBeta.toFixed(2)} → ${sim.afterEstimatedBeta.toFixed(2)} (${sign}${sim.deltaBeta.toFixed(2)})`;
    deltaBetaEl.className = sim.deltaBeta <= 0 ? "font-mono font-bold text-cyan-400 mt-1" : "font-mono font-bold text-amber-400 mt-1";
  }

  const deltaRsEl = document.getElementById("swapDeltaRs");
  if (deltaRsEl) {
    const sign = sim.deltaRs >= 0 ? '+' : '';
    deltaRsEl.textContent = `${sim.beforeEstimatedRs.toFixed(0)} → ${sim.afterEstimatedRs.toFixed(0)} (${sign}${sim.deltaRs.toFixed(0)} pts)`;
    deltaRsEl.className = sim.deltaRs >= 0 ? "font-mono font-bold text-purple-400 mt-1" : "font-mono font-bold text-rose-400 mt-1";
  }

  const sectorTiltEl = document.getElementById("swapSectorTilt");
  if (sectorTiltEl) {
    sectorTiltEl.innerHTML = `<span class="text-rose-400 font-bold">${escapeHtml(sim.exitSector)}</span>: ${sim.exitSectorBeforeWeight.toFixed(1)}% → ${sim.exitSectorAfterWeight.toFixed(1)}% &nbsp;|&nbsp; <span class="text-emerald-400 font-bold">${escapeHtml(sim.targetSector)}</span>: ${sim.targetSectorBeforeWeight.toFixed(1)}% → ${sim.targetSectorAfterWeight.toFixed(1)}%`;
  }

  const verdictTitleEl = document.getElementById("swapVerdictTitle");
  const verdictTextEl = document.getElementById("swapVerdictText");
  const benefitsListEl = document.getElementById("swapBenefitsList");

  if (verdictTitleEl) {
    verdictTitleEl.textContent = sim.isFavorableSwap ? "Institutional Verdict: Favorable Quant Swap" : "Institutional Verdict: Marginal Trade";
    verdictTitleEl.className = sim.isFavorableSwap ? "font-bold text-emerald-400 flex items-center" : "font-bold text-amber-400 flex items-center";
  }
  if (verdictTextEl) {
    verdictTextEl.textContent = sim.quantVerdict;
  }
  if (benefitsListEl && sim.keyBenefits) {
    benefitsListEl.innerHTML = sim.keyBenefits.map(b => `<li class="flex items-start space-x-1.5"><i class="fa-solid fa-check text-emerald-400 mt-0.5 text-[10px]"></i><span>${escapeHtml(b)}</span></li>`).join('');
  }
}

function renderLocalSwapSimulation(exitHolding, target) {
  const deltaRoceEl = document.getElementById("swapDeltaRoce");
  if (deltaRoceEl) {
    const diff = target.roce - exitHolding.rocePercent;
    const sign = diff >= 0 ? '+' : '';
    deltaRoceEl.textContent = `${exitHolding.rocePercent.toFixed(1)}% → ${target.roce.toFixed(1)}% (${sign}${diff.toFixed(1)}%)`;
    deltaRoceEl.className = diff >= 0 ? "font-mono font-bold text-emerald-400 mt-1" : "font-mono font-bold text-rose-400 mt-1";
  }

  const deltaDebtEl = document.getElementById("swapDeltaDebt");
  if (deltaDebtEl) {
    deltaDebtEl.textContent = `${exitHolding.debtToEquity.toFixed(2)} → ${target.debt.toFixed(2)}`;
  }

  const deltaBetaEl = document.getElementById("swapDeltaBeta");
  if (deltaBetaEl) {
    deltaBetaEl.textContent = `1.05 → ${target.beta.toFixed(2)}`;
  }

  const deltaRsEl = document.getElementById("swapDeltaRs");
  if (deltaRsEl) {
    const diff = target.rs - exitHolding.estimatedRsRating;
    const sign = diff >= 0 ? '+' : '';
    deltaRsEl.textContent = `${exitHolding.estimatedRsRating.toFixed(0)} → ${target.rs.toFixed(0)} (${sign}${diff.toFixed(0)} pts)`;
  }

  const sectorTiltEl = document.getElementById("swapSectorTilt");
  if (sectorTiltEl) {
    sectorTiltEl.textContent = `${exitHolding.sector} → ${target.sector}`;
  }

  const verdictTextEl = document.getElementById("swapVerdictText");
  if (verdictTextEl) {
    verdictTextEl.textContent = `Replaces ${exitHolding.ticker} with ${target.name} for superior capital efficiency.`;
  }
}

function executeSwapInTradeModal() {
  if (!activeSwapHolding) return;
  const holdingTicker = activeSwapHolding.ticker;
  closeWhatIfSwapModal();
  openTradeModal(holdingTicker, 'SELL');
  showToast(`Initiating trade slip to prune ${holdingTicker}. Then buy target theory leader.`);
}

// -------------------------------------------------------------
// Full-Time Investor Correlation Matrix Desk (Feature 3)
// -------------------------------------------------------------
let currentCorrelationData = null;

async function loadCorrelationMatrix(forceRefresh = false) {
  const container = document.getElementById("correlationHeatmapContainer");
  const clustersContainer = document.getElementById("correlationClustersContainer");
  if (!container) return;

  const portfolioId = currentPortfolioId || (currentAuditData ? currentAuditData.portfolioId : null);
  if (!portfolioId) {
    container.innerHTML = `<div class="text-xs text-slate-400 p-4 text-center">Please select an active portfolio to compute the correlation matrix.</div>`;
    return;
  }

  if (currentCorrelationData && !forceRefresh) {
    renderCorrelationMatrix(currentCorrelationData);
    return;
  }

  container.innerHTML = `<div class="text-xs text-slate-400 p-6 text-center flex items-center justify-center space-x-2"><i class="fa-solid fa-circle-notch fa-spin text-cyan-400"></i><span>Computing cross-asset return covariance and diversification ratio...</span></div>`;

  try {
    const res = await fetch(`/api/theory-portfolios/correlation-matrix/${portfolioId}?topN=10`);
    if (!res.ok) throw new Error("Failed to load correlation matrix");
    const data = await res.json();
    currentCorrelationData = data;
    renderCorrelationMatrix(data);
  } catch (err) {
    console.error("Error fetching correlation matrix:", err);
    container.innerHTML = `<div class="text-xs text-rose-400 p-4 text-center">Error computing correlation matrix: ${escapeHtml(err.message)}</div>`;
  }
}

function renderCorrelationMatrix(data) {
  const divRatioEl = document.getElementById("corrDivRatio");
  const divRatingEl = document.getElementById("corrDivRating");
  const clusterCountEl = document.getElementById("corrClusterCount");
  const commentaryEl = document.getElementById("corrCommentary");

  if (divRatioEl) divRatioEl.textContent = `${data.diversificationRatio.toFixed(2)}x`;
  if (divRatingEl) {
    divRatingEl.textContent = data.diversificationRating;
    divRatingEl.className = data.diversificationRatio >= 1.35
      ? "text-[10px] text-emerald-400 font-semibold"
      : data.diversificationRatio >= 1.20
        ? "text-[10px] text-cyan-400 font-semibold"
        : "text-[10px] text-rose-400 font-semibold";
  }
  if (clusterCountEl) {
    const count = data.highRiskClusters ? data.highRiskClusters.length : 0;
    clusterCountEl.textContent = count;
    clusterCountEl.className = count > 0 ? "text-2xl font-bold font-mono text-amber-400" : "text-2xl font-bold font-mono text-emerald-400";
  }
  if (commentaryEl) commentaryEl.textContent = data.institutionalCommentary;

  // Render Heatmap Matrix Table
  const container = document.getElementById("correlationHeatmapContainer");
  if (!container || !data.tickers || data.tickers.length === 0) return;

  const n = data.tickers.length;
  let html = `<table class="w-full text-center text-[11px] font-mono border-collapse"><thead><tr><th class="p-2 text-left text-slate-400 font-sans text-xs">Ticker</th>`;

  for (let j = 0; j < n; j++) {
    html += `<th class="p-2 text-slate-300 font-bold border-b border-slate-800" title="${escapeHtml(data.names[j])} (${escapeHtml(data.sectors[j])})">${escapeHtml(data.tickers[j])}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for (let i = 0; i < n; i++) {
    html += `<tr class="border-b border-slate-800/60"><td class="p-2 text-left font-bold text-white font-sans flex items-center justify-between border-r border-slate-800"><span title="${escapeHtml(data.names[i])}">${escapeHtml(data.tickers[i])}</span><span class="text-[9px] text-slate-400 font-mono ml-1">${data.weightsPercent[i].toFixed(1)}%</span></td>`;

    for (let j = 0; j < n; j++) {
      const val = data.matrix[i][j];
      let cellClass = "p-2 transition ";
      if (i === j) {
        cellClass += "bg-slate-800/80 text-slate-400 font-bold";
      } else if (val >= 0.75) {
        cellClass += "bg-rose-950/70 text-rose-300 font-bold hover:bg-rose-900/80";
      } else if (val >= 0.50) {
        cellClass += "bg-amber-950/60 text-amber-300 font-semibold hover:bg-amber-900/70";
      } else if (val >= 0.30) {
        cellClass += "bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50";
      } else {
        cellClass += "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50";
      }

      html += `<td class="${cellClass}" title="${escapeHtml(data.tickers[i])} ↔ ${escapeHtml(data.tickers[j])}: ${val.toFixed(2)} correlation">${val.toFixed(2)}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  container.innerHTML = html;

  // Render High Risk Clusters
  const clustersContainer = document.getElementById("correlationClustersContainer");
  if (clustersContainer) {
    if (!data.highRiskClusters || data.highRiskClusters.length === 0) {
      clustersContainer.innerHTML = `<div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 md:col-span-2"><i class="fa-solid fa-check-circle text-emerald-400"></i><span>No severe cluster risks detected among top positions. Assets exhibit healthy factor dispersion.</span></div>`;
    } else {
      clustersContainer.innerHTML = data.highRiskClusters.map(c => `
        <div class="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-1.5">
          <div class="flex items-center justify-between font-bold">
            <span class="text-white font-mono flex items-center">
              <span class="text-rose-400 mr-1">${escapeHtml(c.stockA)}</span> ↔ <span class="text-rose-400 ml-1 mr-2">${escapeHtml(c.stockB)}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Correlation: ${c.correlation.toFixed(2)}</span>
            </span>
            <span class="text-[10px] font-mono text-slate-300">₹${formatINR(c.combinedCapital)} (${c.combinedWeightPercent.toFixed(1)}%)</span>
          </div>
          <div class="text-[11px] text-slate-300 leading-relaxed">${escapeHtml(c.riskWarning)}</div>
        </div>
      `).join('');
    }
  }
}

// -------------------------------------------------------------
// Supply Chain & Commodity Macro Shock Simulator (Feature 4)
// -------------------------------------------------------------
let activeMacroScenario = 'crude_surge';

async function runMacroStressScenario(scenarioKey) {
  activeMacroScenario = scenarioKey;

  // Update button active states
  const btnCrude = document.getElementById("macroScenarioBtnCrude");
  const btnInr = document.getElementById("macroScenarioBtnInr");
  const btnRate = document.getElementById("macroScenarioBtnRate");

  const activeStyle = "bg-amber-500/20 border border-amber-500/40 text-white font-bold";
  const inactiveStyle = "bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white";

  if (btnCrude) btnCrude.className = `macro-scenario-btn p-3.5 rounded-xl text-left transition space-y-1 ${scenarioKey === 'crude_surge' ? activeStyle : inactiveStyle}`;
  if (btnInr) btnInr.className = `macro-scenario-btn p-3.5 rounded-xl text-left transition space-y-1 ${scenarioKey === 'inr_depreciation' ? activeStyle : inactiveStyle}`;
  if (btnRate) btnRate.className = `macro-scenario-btn p-3.5 rounded-xl text-left transition space-y-1 ${scenarioKey === 'rbi_rate_hike' ? activeStyle : inactiveStyle}`;

  const portfolioId = currentPortfolioId || (currentAuditData ? currentAuditData.portfolioId : null);
  if (!portfolioId) return;

  try {
    const res = await fetch(`/api/theory-portfolios/macro-stress-test/${portfolioId}?scenario=${scenarioKey}`);
    if (!res.ok) throw new Error("Failed to load macro stress test");
    const data = await res.json();
    renderMacroStressResult(data);
  } catch (err) {
    console.error("Error simulating macro stress test:", err);
  }
}

function renderMacroStressResult(data) {
  const titleEl = document.getElementById("macroStressTitle");
  const descEl = document.getElementById("macroStressDesc");
  const pnlDeltaEl = document.getElementById("macroPnlDelta");
  const impactPctEl = document.getElementById("macroImpactPct");
  const defensiveTextEl = document.getElementById("macroDefensiveText");
  const beneficiariesListEl = document.getElementById("macroBeneficiariesList");
  const squeezedListEl = document.getElementById("macroSqueezedList");

  if (titleEl) titleEl.textContent = data.scenarioTitle;
  if (descEl) descEl.textContent = `${data.scenarioDescription} (${data.macroTrigger})`;

  if (pnlDeltaEl) {
    const sign = data.portfolioEstimatedPnlImpact >= 0 ? '+' : '';
    pnlDeltaEl.textContent = `${sign}₹${formatINR(Math.abs(data.portfolioEstimatedPnlImpact))}`;
    pnlDeltaEl.className = data.portfolioEstimatedPnlImpact >= 0 ? "text-lg font-mono font-bold text-emerald-400" : "text-lg font-mono font-bold text-rose-400";
  }

  if (impactPctEl) {
    const sign = data.portfolioEstimatedImpactPercent >= 0 ? '+' : '';
    impactPctEl.textContent = `${sign}${data.portfolioEstimatedImpactPercent.toFixed(2)}%`;
    impactPctEl.className = data.portfolioEstimatedImpactPercent >= 0 ? "text-lg font-mono font-bold text-emerald-400" : "text-lg font-mono font-bold text-rose-400";
  }

  if (defensiveTextEl) defensiveTextEl.textContent = data.defensiveActionRecommendation;

  // Render Beneficiaries
  if (beneficiariesListEl) {
    if (!data.beneficiaries || data.beneficiaries.length === 0) {
      beneficiariesListEl.innerHTML = `<div class="text-slate-400 text-[11px] p-2 text-center">No major beneficiaries in this scenario.</div>`;
    } else {
      beneficiariesListEl.innerHTML = data.beneficiaries.map(b => `
        <div class="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div>
            <div class="font-bold text-white font-mono flex items-center space-x-1.5">
              <span>${escapeHtml(b.ticker)}</span>
              <span class="text-[10px] text-slate-400 font-sans font-normal">(${escapeHtml(b.sector)})</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">+${b.estimatedImpactPercent.toFixed(1)}%</span>
            </div>
            <div class="text-slate-400 text-[10px] mt-0.5">${escapeHtml(b.transmissionMechanism)}</div>
          </div>
          <div class="text-right flex-shrink-0 font-mono text-emerald-400 font-bold">
            +₹${formatINR(b.estimatedPnlDelta)}
          </div>
        </div>
      `).join('');
    }
  }

  // Render Squeezed Holdings
  if (squeezedListEl) {
    if (!data.squeezedHoldings || data.squeezedHoldings.length === 0) {
      squeezedListEl.innerHTML = `<div class="text-slate-400 text-[11px] p-2 text-center">No severe gross margin squeeze detected.</div>`;
    } else {
      squeezedListEl.innerHTML = data.squeezedHoldings.map(s => `
        <div class="p-2.5 rounded-lg bg-slate-900 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
          <div>
            <div class="font-bold text-white font-mono flex items-center space-x-1.5">
              <span>${escapeHtml(s.ticker)}</span>
              <span class="text-[10px] text-slate-400 font-sans font-normal">(${escapeHtml(s.sector)})</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">${s.estimatedImpactPercent.toFixed(1)}%</span>
            </div>
            <div class="text-slate-400 text-[10px] mt-0.5">${escapeHtml(s.transmissionMechanism)}</div>
          </div>
          <div class="text-right flex-shrink-0 font-mono text-rose-400 font-bold">
            -₹${formatINR(Math.abs(s.estimatedPnlDelta))}
          </div>
        </div>
      `).join('');
    }
  }
}

window.loadPortfolioTheoryAudit = loadPortfolioTheoryAudit;
window.renderPortfolioTheoryAudit = renderPortfolioTheoryAudit;
window.filterAuditTable = filterAuditTable;
window.renderPortfolioAuditTable = renderPortfolioAuditTable;
window.openWhatIfSwapModal = openWhatIfSwapModal;
window.openWhatIfSwapWithPick = openWhatIfSwapWithPick;
window.closeWhatIfSwapModal = closeWhatIfSwapModal;
window.updateSwapSimulationPreview = updateSwapSimulationPreview;
window.executeSwapInTradeModal = executeSwapInTradeModal;
window.switchTheoryHubTab = switchTheoryHubTab;
window.loadCorrelationMatrix = loadCorrelationMatrix;
window.runMacroStressScenario = runMacroStressScenario;


