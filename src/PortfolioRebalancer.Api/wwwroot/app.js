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

function renderPortfolioSelectOptions() {
  const select = document.getElementById("portfolioSelect");
  if (!select) return;
  select.innerHTML = "";
  loadedPortfoliosList.forEach(p => {
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
let activeDiagnosticFilter = null; // { type: string, label: string, tickers: string[] }
let searchQuery = "";
let sectorFilter = "";
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

// ==========================================
// SPA Client-Side View Router (Hash-Based)
// ==========================================
const APP_VIEWS = ['portfolio', 'manage', 'discover'];
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
    { id: 'navTabDiscover', view: 'discover' }
  ];

  tabs.forEach(t => {
    const el = document.getElementById(t.id);
    if (!el) return;
    if (t.view === viewName) {
      el.className = 'nav-tab px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm';
    } else {
      el.className = 'nav-tab px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent';
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
  applyPrivacyModeUI();
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

  // Search & Filter Controls
  document.getElementById("holdingsSearch")?.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderHoldingsTable();
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

    const targetId = currentPortfolioId && portfolios.some(p => p.id === currentPortfolioId)
      ? currentPortfolioId
      : portfolios[0].id;
    await selectPortfolio(targetId);
  } catch (err) {
    console.error("Failed to load portfolios:", err);
  }
}

async function selectPortfolio(id) {
  currentPortfolioId = id;
  const sel = document.getElementById("portfolioSelect");
  if (sel) sel.value = id;

  try {
    // High-Speed Concurrent Fetch: Portfolio details + Diagnostics loaded simultaneously
    const [pRes, dRes] = await Promise.all([
      fetch(`/api/portfolios/${id}`),
      fetch(`/api/portfolios/${id}/diagnostics`).catch(() => null)
    ]);

    if (!pRes.ok) return;
    currentPortfolioData = await pRes.json();
    normalizePortfolioData(currentPortfolioData);
    renderPortfolioDetails(currentPortfolioData);

    if (dRes && dRes.ok) {
      const diag = await dRes.json();
      currentDiagnostics = diag;
      renderDiagnosticsUI(diag);
    }
  } catch (err) {
    console.error("Error fetching portfolio:", err);
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

  renderHoldingsTable();
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

  // 3. P&L Filter
  if (pnlFilter === "PROFIT") {
    list = list.filter(h => (h.unrealizedPnL || 0) >= 0);
  } else if (pnlFilter === "LOSS") {
    list = list.filter(h => (h.unrealizedPnL || 0) < 0);
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
  const isFiltered = (searchQuery || sectorFilter || pnlFilter !== 'ALL' || activeDiagnosticFilter);
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
    const pnlBadge = isPos
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : "bg-rose-500/10 text-rose-300 border border-rose-500/20";

    const advisory = getAdvisoryTarget(h);

    return `
      <tr class="hover:bg-slate-800/30 transition border-b border-slate-800/40 text-xs">
        <td class="py-3 px-4 font-mono">
          <div class="flex items-center space-x-2">
            <span class="font-semibold text-slate-100 text-xs">${h.ticker}</span>
            <span class="text-[11px] text-slate-400 font-sans truncate max-w-[130px] hidden sm:inline" title="${h.name}">${h.name}</span>
          </div>
        </td>
        <td class="py-3 px-3 text-slate-400">
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-[11px] whitespace-nowrap text-slate-300">${h.sector}</span>
        </td>
        <td class="py-3 px-3 text-right font-mono text-slate-200 font-medium privacy-mask">${h.quantity}</td>
        
        <!-- Avg Buy Price -->
        <td class="py-3 px-4 text-right font-mono text-slate-300 privacy-mask">
          ${formatINR(h.buyPrice)}
        </td>

        <!-- Live CMP -->
        <td class="py-3 px-4 text-right font-mono font-medium text-slate-100">
          ${formatINR(h.price)}
        </td>

        <!-- Side-by-side Unrealized P&L (Soft Mint / Soft Coral) -->
        <td class="py-3 px-4 text-right font-mono whitespace-nowrap">
          <span class="inline-block px-2.5 py-0.5 rounded-md ${pnlBadge} font-medium text-xs privacy-mask">
            ${isPos ? '+' : ''}${formatINR(h.unrealizedPnL)} (${isPos ? '+' : ''}${h.unrealizedPnLPercent.toFixed(1)}%)
          </span>
        </td>

        <!-- Total Invested Cost -->
        <td class="py-3 px-4 text-right font-mono text-slate-400 privacy-mask">${formatINR(h.investedValue)}</td>

        <!-- Current Market Value -->
        <td class="py-3 px-4 text-right font-mono font-semibold text-slate-100 privacy-mask">${formatINR(h.marketValue)}</td>

        <!-- Portfolio Weight -->
        <td class="py-3 px-3 text-right font-mono text-slate-300">${h.weightPercent.toFixed(1)}%</td>

        <!-- Target Advisory -->
        <td class="py-3 px-3 text-center text-[11px] font-mono whitespace-nowrap">
          <span class="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20" title="${advisory.rationale}">
            ₹${advisory.t1}
          </span>
        </td>

        <!-- Streamlined Actions (Calm Teal and Subtle Actions) -->
        <td class="py-3 px-3 text-center whitespace-nowrap">
          <button onclick="openTradeModal('${h.ticker}')" class="text-teal-400 hover:text-teal-300 text-xs px-2 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition mr-1 font-medium" title="Trade / Adjust">
            <i class="fa-solid fa-bolt mr-0.5"></i> Trade
          </button>
          <button onclick="inspectFromRow('${h.ticker}')" class="text-slate-400 hover:text-teal-300 text-xs px-1.5 py-1 rounded hover:bg-slate-800 transition mr-1" title="Inspect Scorecard">
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

  } catch (err) {
    console.error("Error rendering diagnostics:", err);
  }
}

async function loadDiagnostics(portfolioId) {
  try {
    const res = await fetch(`/api/portfolios/${portfolioId}/diagnostics`);
    if (!res.ok) return;
    const diag = await res.json();
    renderDiagnosticsUI(diag);
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
  const quantity = parseFloat(document.getElementById("inputQuantity").value);
  const buyPriceRaw = parseFloat(document.getElementById("inputBuyPrice").value);
  const buyPrice = !isNaN(buyPriceRaw) && buyPriceRaw > 0 ? buyPriceRaw : null;

  if (!ticker) return alert("Please enter an NSE symbol.");
  if (isNaN(quantity) || quantity <= 0) return alert("Please enter a valid positive quantity.");

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

    const chart = LightweightCharts.createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        background: { color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.45)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.45)' }
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(51, 65, 85, 0.6)',
        scaleMargins: {
          top: 0.08,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: 'rgba(51, 65, 85, 0.6)',
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

      <!-- Strengths & Risk Warnings -->
      <div class="space-y-2 pt-1">
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
      opt.textContent = `${h.ticker} (${h.quantity} shs @ â‚¹${h.buyPrice})`;
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
      qtyInput.value = defaultAction === 'SELL' ? Math.min(10, holding.quantity) : 10;
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
  const tradeQty = parseFloat(document.getElementById("tradeQuantityInput")?.value) || 0;
  const tradePrice = parseFloat(document.getElementById("tradePriceInput")?.value) || 0;

  const holding = currentPortfolioData?.holdings?.find(h => h.ticker.toUpperCase() === ticker);
  const oldQty = holding ? holding.quantity : 0;
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

  if (previewQty) previewQty.textContent = `${oldQty} â†’ ${newQty} shares`;
  if (previewPrice) previewPrice.textContent = `â‚¹${oldPrice.toFixed(2)} â†’ â‚¹${newAvgPrice.toFixed(2)}`;
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

async function submitTradeModal() {
  if (!currentPortfolioId) return alert("Please select a portfolio first.");

  const ticker = (document.getElementById("tradeTickerInput")?.value || "").trim().toUpperCase();
  const tradeQty = parseFloat(document.getElementById("tradeQuantityInput")?.value) || 0;
  const tradePrice = parseFloat(document.getElementById("tradePriceInput")?.value) || 0;

  if (!ticker) return alert("Please enter or select a valid NSE stock symbol.");
  if (tradeQty <= 0) return alert("Quantity must be greater than 0.");
  if (tradePrice <= 0) return alert("Trade price must be greater than 0.");

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

function handleExcelFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  selectedExcelFile = file;

  const dropLabel = document.getElementById("dropzoneLabel");
  const dropSub = document.getElementById("dropzoneSub");
  const summary = document.getElementById("excelUploadSummary");
  const fileName = document.getElementById("excelFileName");

  if (dropLabel) dropLabel.innerHTML = `Selected: <strong class="text-emerald-400">${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
  if (dropSub) dropSub.textContent = "Click 'Import & Sync Portfolio' below to apply";
  if (fileName) fileName.textContent = file.name;
  if (summary) summary.classList.remove("hidden");
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

async function handleConfirmUploadExcel() {
  if (!selectedExcelFile) return alert("Please select an Angel One Excel (.xlsx) file first.");
  if (!currentPortfolioId) return alert("Please select a portfolio first.");

  const btn = document.getElementById("btnConfirmUploadExcel");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Parsing Excel...`;
  }

  const pwd = getExcelPassword();
  const formData = new FormData();
  formData.append("file", selectedExcelFile);
  if (pwd) formData.append("password", pwd);

  try {
    const res = await fetch(`/api/portfolios/${currentPortfolioId}/upload-excel`, {
      method: "POST",
      body: formData
    });

    if (res.ok) {
      currentPortfolioData = await res.json();
      normalizePortfolioData(currentPortfolioData);
      renderPortfolioDetails(currentPortfolioData);
      closeAngelOneModal();
      showToast(`🎉 Successfully imported ${currentPortfolioData.holdings.length} holdings from ${selectedExcelFile.name}!`);
    } else {
      const err = await res.json();
      alert(`Excel import failed: ${err.error || "Please verify the Excel format."}`);
      if (err.error && err.error.toLowerCase().includes("password")) {
        const inp = document.getElementById("angelExcelPassword") || document.getElementById("manageExcelPassword");
        inp?.focus();
      }
    }
  } catch (err) {
    console.error("Excel upload error:", err);
    alert("Network error uploading Excel file.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Import & Sync Portfolio</span>`;
    }
  }
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
    const qty = parseFloat(item.quantity || item.holdingquantity || item.qty || 0);
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

async function openCreateAlertModal(ticker, cmp) {
  const modal = document.getElementById("createAlertModal");
  if (!modal) return;

  activeAlertModalCmp = parseFloat(cmp) || 0;
  document.getElementById("alertInputTicker").value = ticker;
  document.getElementById("alertModalTickerBadge").textContent = ticker;
  document.getElementById("alertModalCmpText").textContent = `₹${activeAlertModalCmp.toFixed(2)}`;
  
  // Default target price +2%
  const defaultTarget = (activeAlertModalCmp * 1.02).toFixed(2);
  const targetInput = document.getElementById("alertInputTargetPrice");
  targetInput.value = defaultTarget;

  setAlertDirection('CrossesAbove');
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

// Window exports
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

// Initial surveillance badge fetch
setTimeout(updateHeaderAlertsBadge, 500);


