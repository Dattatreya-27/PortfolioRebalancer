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
  if (val === undefined || val === null || isNaN(val)) return "Ã¢â€šÂ¹0.00";
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
  return `Ã¢â€šÂ¹${crores.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr`;
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
  renderSectorTargetInputs();
  setupEventListeners();
  await loadPortfolios();
});

function setupEventListeners() {
  document.getElementById("btnCreatePortfolio").addEventListener("click", handleCreatePortfolio);
  document.getElementById("portfolioSelect").addEventListener("change", (e) => {
    if (e.target.value) selectPortfolio(e.target.value);
  });
  document.getElementById("btnAddHolding").addEventListener("click", handleAddHolding);
  document.getElementById("btnRunRebalance").addEventListener("click", handleRunRebalance);
  document.getElementById("btnInspectStock").addEventListener("click", handleInspectStock);

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

function renderSectorTargetInputs() {
  const container = document.getElementById("sectorTargetsContainer");
  container.innerHTML = "";

  SECTORS.forEach(sec => {
    const row = document.createElement("div");
    row.className = "flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800";
    row.innerHTML = `
      <span class="text-xs text-slate-300 font-medium">${sec}</span>
      <div class="flex items-center space-x-1.5">
        <input type="number" min="0" max="100" step="1" value="0" data-sector="${sec}"
          class="sector-weight-input w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-amber-400 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500" />
        <span class="text-xs text-slate-500">%</span>
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
  badge.textContent = `Total: ${sum.toFixed(1)}%`;

  if (Math.abs(sum - 100) < 0.01) {
    badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
  } else {
    badge.className = "text-xs font-semibold px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30";
  }
}

async function loadPortfolios() {
  try {
    const res = await fetch("/api/portfolios");
    const portfolios = await res.json();
    const select = document.getElementById("portfolioSelect");
    select.innerHTML = "";

    if (!portfolios || portfolios.length === 0) {
      const pid = await seedSamplePortfolio();
      if (pid) {
        currentPortfolioId = pid;
      }
      return loadPortfolios();
    }

    portfolios.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} (${formatINR(p.totalValue)})`;
      select.appendChild(opt);
    });

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
      <td class="py-3 px-3 text-right font-mono text-slate-200 font-medium">${h.quantity}</td>
      
      <!-- Avg Buy Price (From Excel) -->
      <td class="py-3 px-4 text-right font-mono text-slate-300">
        ${formatINR(h.buyPrice)}
      </td>

      <!-- Live CMP -->
      <td class="py-3 px-4 text-right font-mono font-bold text-amber-300 bg-slate-900/40">
        ${formatINR(h.price)}
      </td>

      <!-- Side-by-side Unrealized P&L -->
      <td class="py-3 px-4 text-right font-mono bg-slate-900/40 whitespace-nowrap">
        <span class="inline-block px-2.5 py-1 rounded ${pnlBg} font-semibold">
          ${isPos ? '+' : ''}${formatINR(h.unrealizedPnL)} (${isPos ? '+' : ''}${h.unrealizedPnLPercent.toFixed(1)}%)
        </span>
      </td>

      <!-- Total Invested Cost -->
      <td class="py-3 px-4 text-right font-mono text-slate-400">${formatINR(h.investedValue)}</td>

      <!-- Current Market Value -->
      <td class="py-3 px-4 text-right font-mono font-semibold text-white">${formatINR(h.marketValue)}</td>

      <!-- Portfolio Weight -->
      <td class="py-3 px-3 text-right font-mono text-slate-300">${h.weightPercent.toFixed(1)}%</td>

      <!-- Target Advisory -->
      <td class="py-3 px-3 text-center text-[10px] font-mono whitespace-nowrap">
        <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" title="${advisory.rationale}">
          T1: Ã¢â€šÂ¹${advisory.t1}
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
      document.getElementById("diagHhiVerdict").textContent = `${c.diversificationStatus} Ã¢â‚¬Â¢ ${c.verdict}`;
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
              <div class="text-[11px] text-slate-400 mt-0.5">Current: <span class="text-white font-mono font-semibold">${v.currentValue}%</span> Ã¢â‚¬Â¢ Allowed Limit: ${v.allowedLimit}%</div>
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
        eContainer.innerHTML = `<div class="text-xs text-slate-500 italic">No scheduled events for active holdings.</div>`;
      } else {
        diag.upcomingEvents.forEach(e => {
          const div = document.createElement("div");
          div.className = `p-2.5 rounded-lg border border-slate-800 bg-slate-950/70 flex items-start justify-between text-xs`;
          div.innerHTML = `
            <div>
              <div class="font-semibold text-white flex items-center space-x-1.5">
                ${e.ticker ? `<span class="font-mono text-amber-400 px-1 py-0.2 rounded bg-amber-500/10 text-[10px]">${e.ticker}</span>` : `<span class="text-orange-400 text-[10px] px-1 py-0.2 rounded bg-orange-500/10 uppercase">Macro Policy</span>`}
                <span>${e.eventTitle}</span>
              </div>
              <div class="text-[10px] text-slate-400 mt-0.5">${e.expectedImpact}</div>
            </div>
            <div class="text-right text-[10px] font-mono text-slate-300 ml-2 whitespace-nowrap">
              ${e.scheduledDate}
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
            <div class="text-[11px] text-slate-400">${t.sector} Ã¢â‚¬Â¢ Current: ${t.currentQuantity} shares</div>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold ${isBuy ? 'bg-emerald-500/20 text-emerald-400' : isHold ? 'bg-slate-700 text-slate-300' : 'bg-rose-500/20 text-rose-400'}">
            ${t.action} ${Math.abs(t.deltaQuantity)} shs
          </span>
          <div class="text-xs font-mono text-slate-300 mt-0.5">${formatINR(t.currentValue)} Ã¢â€ â€™ ${formatINR(t.targetValue)}</div>
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
  resultContainer.innerHTML = `<div class="text-slate-400">Evaluating multi-factor score for ${ticker}...</div>`;

  try {
    const res = await fetch(`/api/stocks/${ticker}`);
    if (!res.ok) {
      resultContainer.innerHTML = `<div class="text-rose-400">Stock '${ticker}' not found in registry.</div>`;
      return;
    }
    const data = await res.json();
    
    const scoreColor = data.overallScore >= 75 ? 'emerald' : data.overallScore >= 50 ? 'amber' : 'rose';

    resultContainer.innerHTML = `
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <span class="font-bold text-sm text-white font-mono">${data.ticker}</span>
          <span class="text-slate-400 text-xs ml-1">(${data.name})</span>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">${data.sector}</span>
          <span class="text-xs font-bold px-2.5 py-0.5 rounded bg-${scoreColor}-500/20 text-${scoreColor}-400 border border-${scoreColor}-500/30">
            Score: ${data.overallScore} / 100
          </span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
        <div class="p-2 bg-slate-900 rounded border border-slate-800">
          <div class="text-[10px] text-slate-400">Fundamentals</div>
          <div class="font-bold text-white text-xs mt-0.5">${data.fundamentalScore} / 100</div>
          <div class="text-[9px] text-slate-500">P/E: ${data.peRatio ? data.peRatio.toFixed(1) : 'N/A'}</div>
        </div>
        <div class="p-2 bg-slate-900 rounded border border-slate-800">
          <div class="text-[10px] text-slate-400">Technicals</div>
          <div class="font-bold text-white text-xs mt-0.5">${data.technicalScore} / 100</div>
          <div class="text-[9px] text-slate-500">Momentum</div>
        </div>
        <div class="p-2 bg-slate-900 rounded border border-slate-800">
          <div class="text-[10px] text-slate-400">National Policy</div>
          <div class="font-bold text-amber-400 text-xs mt-0.5">${data.policyAlignmentScore} / 100</div>
          <div class="text-[9px] text-slate-500">PLI / MakeInIndia</div>
        </div>
      </div>

      <div class="p-2.5 bg-slate-900 rounded border border-slate-800">
        <div class="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center">
          <i class="fa-solid fa-landmark mr-1"></i> National Policy Tailwind
        </div>
        <p class="text-slate-300 text-[11px] leading-relaxed">${data.policyTailwindSummary}</p>
      </div>

      ${data.riskFlags.length > 0 ? `
        <div class="p-2 bg-rose-950/20 border border-rose-500/30 rounded text-rose-300 text-[11px] space-y-1">
          <div class="font-bold text-rose-400 text-[10px] uppercase flex items-center">
            <i class="fa-solid fa-triangle-exclamation mr-1"></i> Breakdown Risk Warnings:
          </div>
          ${data.riskFlags.map(f => `<div>Ã¢â‚¬Â¢ ${f}</div>`).join('')}
        </div>
      ` : ''}

      <div class="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
        <span>CMP: <strong class="text-white">${formatINR(data.price)}</strong></span>
        <span>Market Cap: <strong class="text-white">${formatMarketCapCrores(data.marketCap)}</strong></span>
        <span>Div Yield: <strong class="text-white">${data.dividendYield ? data.dividendYield.toFixed(2) + '%' : 'N/A'}</strong></span>
      </div>
    `;
  } catch (err) {
    resultContainer.innerHTML = `<div class="text-rose-400">Error fetching stock scorecard.</div>`;
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
                <div class="text-[10px] text-slate-500 mt-0.5">Target: Ã¢â€šÂ¹${op.targetPrice} Ã¢â‚¬Â¢ ${op.catalystRationale}</div>
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