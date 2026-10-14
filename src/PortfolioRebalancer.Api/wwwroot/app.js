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
      icon.className = "fa-solid fa-eye text-amber-400";
      btn.className = "text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition font-medium shadow-sm";
      text.textContent = "Privacy Mode";
      btn.title = "Click to blur financial values and position sizes for safe screenshots.";
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

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  applyPrivacyModeUI();
  renderSectorTargetInputs();
  setupEventListeners();
  await loadPortfolios();
});

function setupEventListeners() {
  document.getElementById("btnTogglePrivacy")?.addEventListener("click", handleTogglePrivacy);
  document.getElementById("btnCreatePortfolio").addEventListener("click", handleCreatePortfolio);
  document.getElementById("portfolioSelect").addEventListener("change", (e) => {
    if (e.target.value) selectPortfolio(e.target.value);
  });
  document.getElementById("btnAddHolding").addEventListener("click", handleAddHolding);
  document.getElementById("btnRunRebalance").addEventListener("click", handleRunRebalance);
  document.getElementById("btnInspectStock").addEventListener("click", handleInspectStock);
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
    if (currentPortfolioId) loadDiagnostics(currentPortfolioId);
  });
  document.getElementById("btnOpenResearch")?.addEventListener("click", () => {
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
  "ConsumerDiscretionary": "fa-bag-shopping text-amber-400",
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
          class="sector-weight-input w-16 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 text-xs text-right text-amber-400 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500" />
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
    badge.className = "text-xs font-mono font-bold px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40";
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
  document.getElementById("portfolioSelect").value = id;
  try {
    const res = await fetch(`/api/portfolios/${id}`);
    if (!res.ok) return;
    currentPortfolioData = await res.json();
    normalizePortfolioData(currentPortfolioData);
    renderPortfolioDetails(currentPortfolioData);
    await loadDiagnostics(id);
  } catch (err) {
    console.error("Error fetching portfolio:", err);
  }
}

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

  // Unrealized P&L Display
  const pnlElem = document.getElementById("statTotalPnL");
  const pnlBadge = document.getElementById("statPnLBadge");
  const pnlVal = data.totalUnrealizedPnL || 0;
  const pnlPct = data.totalUnrealizedPnLPercent || 0;
  const isProfit = pnlVal >= 0;

  if (pnlElem) {
    pnlElem.textContent = `${isProfit ? '+' : ''}${formatINR(pnlVal)} (${isProfit ? '+' : ''}${pnlPct.toFixed(2)}%)`;
    pnlElem.className = `text-2xl font-bold mt-1 ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`;
  }
  if (pnlBadge) {
    pnlBadge.textContent = isProfit ? "NET GAIN" : "NET LOSS";
    pnlBadge.className = `text-[10px] font-bold px-1.5 py-0.5 rounded ${isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`;
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
  subtext.textContent = `${totalItems} position${totalItems === 1 ? '' : 's'}${isFiltered ? ' (filtered)' : ''}`;

  const infoText = document.getElementById("pageInfoText");
  if (infoText) {
    infoText.textContent = isFiltered
      ? `Showing ${totalItems} of ${currentPortfolioData?.holdings?.length || 105} positions`
      : `Showing all ${totalItems} positions in one view`;
  }

  const tbody = document.getElementById("holdingsTableBody");
  tbody.innerHTML = "";

  if (allFiltered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="py-12 text-center text-slate-500 italic">No holdings match your search or filter criteria.</td></tr>`;
    return;
  }

  allFiltered.forEach(h => {
    const isPos = h.unrealizedPnL >= 0;
    const pnlBg = isPos
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : "bg-rose-500/10 text-rose-400 border border-rose-500/20";

    const advisory = getAdvisoryTarget(h);

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-800/40 transition border-b border-slate-800/40 text-xs";
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-white text-xs">${h.ticker}</span>
          <span class="text-[10px] text-slate-400 font-sans truncate max-w-[140px] hidden sm:inline" title="${h.name}">${h.name}</span>
        </div>
      </td>
      <td class="py-3 px-3 text-slate-400">
        <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] whitespace-nowrap">${h.sector}</span>
      </td>
      <td class="py-3 px-3 text-right font-mono text-slate-200 font-medium privacy-mask">${h.quantity}</td>
      
      <!-- Avg Buy Price (From Excel) -->
      <td class="py-3 px-4 text-right font-mono text-slate-300 privacy-mask">
        ${formatINR(h.buyPrice)}
      </td>

      <!-- Live CMP -->
      <td class="py-3 px-4 text-right font-mono font-bold text-amber-300 bg-slate-900/40">
        ${formatINR(h.price)}
      </td>

      <!-- Side-by-side Unrealized P&L -->
      <td class="py-3 px-4 text-right font-mono bg-slate-900/40 whitespace-nowrap">
        <span class="inline-block px-2.5 py-1 rounded ${pnlBg} font-semibold privacy-mask">
          ${isPos ? '+' : ''}${formatINR(h.unrealizedPnL)} (${isPos ? '+' : ''}${h.unrealizedPnLPercent.toFixed(1)}%)
        </span>
      </td>

      <!-- Total Invested Cost -->
      <td class="py-3 px-4 text-right font-mono text-slate-400 privacy-mask">${formatINR(h.investedValue)}</td>

      <!-- Current Market Value -->
      <td class="py-3 px-4 text-right font-mono font-semibold text-white privacy-mask">${formatINR(h.marketValue)}</td>

      <!-- Portfolio Weight -->
      <td class="py-3 px-3 text-right font-mono text-slate-300">${h.weightPercent.toFixed(1)}%</td>

      <!-- Target Advisory -->
      <td class="py-3 px-3 text-center text-[10px] font-mono whitespace-nowrap">
        <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" title="${advisory.rationale}">
          T1: \u20B9${advisory.t1}
        </span>
      </td>

      <!-- Actions -->
      <td class="py-3 px-3 text-center whitespace-nowrap">
        <button onclick="inspectFromRow('${h.ticker}')" class="text-amber-400 hover:text-amber-300 text-xs px-2 py-1 rounded hover:bg-amber-500/10 transition mr-1" title="Inspect Scorecard">
          <i class="fa-solid fa-magnifying-glass-chart"></i>
        </button>
        <button onclick="handleRemoveHolding('${h.ticker}')" class="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded hover:bg-rose-500/10 transition" title="Delete Position">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function inspectFromRow(ticker) {
  document.getElementById("inspectorTicker").value = ticker;
  handleInspectStock();
  document.getElementById("inspectorTicker").scrollIntoView({ behavior: 'smooth' });
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

async function loadDiagnostics(portfolioId) {
  try {
    const res = await fetch(`/api/portfolios/${portfolioId}/diagnostics`);
    if (!res.ok) return;
    const diag = await res.json();
    currentDiagnostics = diag;

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
        gradeBadge.className = "inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30";
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

    // 9. Render Constraint Violations (if any)
    const vContainer = document.getElementById("violationsContainer");
    if (vContainer) {
      vContainer.innerHTML = "";
      if (diag.violations && diag.violations.length > 0) {
        vContainer.classList.remove("hidden");
        diag.violations.forEach(v => {
          const isCrit = v.severity === "Critical";
          const div = document.createElement("div");
          div.className = `p-3 bg-slate-950/90 rounded-xl border ${isCrit ? 'border-rose-500/40 bg-rose-950/20' : 'border-amber-500/40 bg-amber-950/20'} flex items-start justify-between`;
          div.innerHTML = `
            <div>
              <div class="text-xs font-bold ${isCrit ? 'text-rose-400' : 'text-amber-400'} flex items-center">
                <i class="fa-solid fa-triangle-exclamation mr-1.5"></i>
                <span>${v.ruleName}: ${v.target}</span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">Current: <span class="text-white font-mono font-semibold">${v.currentValue}%</span> \u2022 Allowed Limit: ${v.allowedLimit}%</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isCrit ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'} uppercase">${v.severity}</span>
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
        let tagBg = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
        let btnBg = "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30";

        if (p.category.includes("Pruning")) {
          icon = "fa-scissors";
          tagBg = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
          btnBg = "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30";
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
                  <button type="button" onclick="quickInspectTicker('${e.ticker}')" class="font-mono text-amber-400 hover:text-amber-300 hover:underline px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold" title="Inspect ${e.ticker} Scorecard">
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
                <i class="fa-regular fa-calendar text-[9px] text-amber-400 mr-1.5"></i> ${e.scheduledDate}
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

async function handleInspectStock() {
  const ticker = document.getElementById("inspectorTicker").value.trim().toUpperCase();
  if (!ticker) return;

  const resultContainer = document.getElementById("stockInspectorResult");
  resultContainer.classList.remove("hidden");
  resultContainer.innerHTML = `<div class="text-slate-400 py-3 text-center"><i class="fa-solid fa-circle-notch fa-spin text-amber-400 mr-2"></i>Running 5-Pillar Institutional Equity Research Engine for ${ticker}...</div>`;

  try {
    const res = await fetch(`/api/stocks/${ticker}`);
    if (!res.ok) {
      resultContainer.innerHTML = `<div class="text-rose-400 p-3 bg-rose-950/20 border border-rose-500/30 rounded-lg">Stock '${ticker}' not found in registry.</div>`;
      return;
    }
    const data = await res.json();
    
    const scoreColor = data.overallScore >= 75 ? 'emerald' : data.overallScore >= 50 ? 'amber' : 'rose';
    const peg = data.peerBenchmark?.pegRatio;
    const pegColor = peg && peg <= 1.5 ? 'text-emerald-400' : (peg && peg <= 2.2 ? 'text-amber-400' : 'text-slate-300');
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
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
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

      <!-- 5 Institutional Pillars Bar Matrix -->
      <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
        <div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
          <span><i class="fa-solid fa-layer-group text-amber-400 mr-1.5"></i>5-Pillar Score Breakdown</span>
          <span class="text-slate-500 font-mono text-[9px]">Weighted Alpha Model</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
          <!-- Quality -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium">1. Quality & ROCE</span>
              <span class="font-bold text-white font-mono">${data.qualityScore || data.fundamentalScore}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${data.qualityScore || data.fundamentalScore}%"></div>
            </div>
          </div>
          <!-- Relative Valuation & PEG -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium">2. Valuation & PEG</span>
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
              <span class="text-slate-400 font-medium">4. Governance & Inst</span>
              <span class="font-bold text-white font-mono">${data.institutionalGovernanceScore || 75}</span>
            </div>
            <div class="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="bg-purple-500 h-1.5 rounded-full" style="width: ${data.institutionalGovernanceScore || 75}%"></div>
            </div>
          </div>
          <!-- Macro Policy -->
          <div class="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-slate-400 font-medium">5. Policy Tailwinds</span>
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
          <div class="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center">
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
              <i class="fa-solid fa-scale-balanced text-amber-400 mr-1.5"></i> Relative Valuation & Peers
            </span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Growth-Adjusted</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center font-mono">
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Stock P/E</div>
              <div class="font-bold text-white text-xs mt-0.5">${data.peerBenchmark?.stockPe ? data.peerBenchmark.stockPe.toFixed(1) + 'x' : (data.peRatio ? data.peRatio.toFixed(1) + 'x' : 'N/A')}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Sector Median P/E</div>
              <div class="font-bold text-slate-300 text-xs mt-0.5">${data.peerBenchmark?.sectorMedianPe ? data.peerBenchmark.sectorMedianPe.toFixed(1) + 'x' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">PEG Ratio</div>
              <div class="font-bold text-xs mt-0.5 ${pegColor}">${peg ? peg.toFixed(2) + 'x' : 'N/A'}</div>
            </div>
          </div>
          <div class="text-[10px] text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/60 flex items-center justify-between">
            <span class="text-slate-400 font-medium">Verdict:</span>
            <span class="font-semibold text-amber-300 truncate ml-2 text-right">${data.peerBenchmark?.valuationVerdict || 'Evaluated against peer median'}</span>
          </div>
          ${data.peerBenchmark?.topPeers && data.peerBenchmark.topPeers.length > 0 ? `
            <div class="text-[10px] text-slate-400 flex flex-wrap items-center gap-1 pt-1">
              <span class="text-[9px] text-slate-500 mr-1">Sector Peers:</span>
              ${data.peerBenchmark.topPeers.map(p => `<span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[9px] border border-slate-700/60">${p}</span>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Quad 2: Management & Governance Audit -->
        <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div class="flex items-center justify-between pb-1 border-b border-slate-800/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center">
              <i class="fa-solid fa-user-shield text-emerald-400 mr-1.5"></i> Governance & Capital Return
            </span>
            ${isPristinePledge ? `
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <i class="fa-solid fa-check mr-1"></i>0% PLEDGE
              </span>
            ` : `
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ${pledge}% Pledged
              </span>
            `}
          </div>
          <div class="grid grid-cols-4 gap-1.5 text-center font-mono">
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Promoter</div>
              <div class="font-bold text-white text-xs mt-0.5">${data.governanceAudit?.promoterHoldingPercent ? data.governanceAudit.promoterHoldingPercent.toFixed(1) + '%' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Pledge</div>
              <div class="font-bold text-xs mt-0.5 ${isPristinePledge ? 'text-emerald-400' : 'text-amber-400'}">${pledge.toFixed(1)}%</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">ROCE</div>
              <div class="font-bold text-xs mt-0.5 ${data.governanceAudit?.rocePercent >= 15 ? 'text-emerald-400' : 'text-slate-300'}">${data.governanceAudit?.rocePercent ? data.governanceAudit.rocePercent.toFixed(1) + '%' : 'N/A'}</div>
            </div>
            <div class="bg-slate-950 p-1.5 rounded border border-slate-800/70">
              <div class="text-[9px] text-slate-500">Debt/Eq</div>
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
              <i class="fa-solid fa-money-bill-trend-up text-cyan-400 mr-1.5"></i> Institutional Sponsorship (FII / DII)
            </span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">Float Track</span>
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
              <i class="fa-solid fa-landmark-flag text-orange-400 mr-1.5"></i> Macro & Policy Alignment
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
              <i class="fa-solid fa-triangle-exclamation mr-1.5"></i> Key Risk Warnings & Sensitivities:
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
        <div>Live CMP: <strong class="text-white font-mono ml-1">${formatINR(data.price)}</strong></div>
        <div>Market Cap: <strong class="text-white font-mono ml-1">${formatMarketCapCrores(data.marketCap)}</strong></div>
        <div>Div Yield: <strong class="text-white font-mono ml-1">${data.dividendYield ? data.dividendYield.toFixed(2) + '%' : '0.00%'}</strong></div>
      </div>
    `;
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
          <div class="p-2 bg-slate-900 rounded text-[10px] font-mono text-amber-400/90 mt-2 border border-slate-800">
            <strong>Rule:</strong> ${s.coreCriteria}
          </div>
          <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-2 font-mono">
            <div>Benchmark: <span class="text-slate-200">${s.benchmarkCagrPercent}%</span></div>
            <div>Max Drawdown: <span class="text-rose-400">-${s.maxDrawdownPercent}%</span></div>
          </div>
        </div>

        <div>
          <div class="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center">
            <i class="fa-solid fa-bullseye text-amber-400 mr-1"></i> Top Opportunities Detected:
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

        <div class="p-2 rounded bg-slate-900 text-[10px] text-amber-300/90 border border-slate-800 leading-relaxed">
          <i class="fa-solid fa-lightbulb text-amber-400 mr-1"></i> <strong>Advisory Response:</strong> ${sc.advisoryAction}
        </div>
      `;
      scenContainer.appendChild(card);
    });

  } catch (err) {
    stratContainer.innerHTML = `<div class="p-4 text-xs text-rose-400">Error loading research report.</div>`;
  }
}