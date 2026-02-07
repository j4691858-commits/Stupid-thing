// ============================================================
// Live Stock Market Tracker - Analysis & Ranking Engine
// ============================================================

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'JPM'];
const INDEX_SYMBOLS = ['^GSPC', '^DJI', '^IXIC', '^VIX'];
const REFRESH_INTERVAL = 30000; // 30 seconds

let trackedSymbols = JSON.parse(localStorage.getItem('trackedSymbols')) || [...DEFAULT_SYMBOLS];
let stockData = {};
let refreshTimer = null;

// ---- Data Fetching ----

async function fetchQuote(symbol) {
    // Route through local proxy to avoid CORS issues
    const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d&includePrePost=false`;
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        const result = json.chart.result[0];
        const meta = result.meta;
        const quotes = result.indicators.quote[0];
        const timestamps = result.timestamp || [];
        const closes = quotes.close || [];
        const volumes = quotes.volume || [];
        const highs = quotes.high || [];
        const lows = quotes.low || [];

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        // Compute daily returns for volatility
        const dailyReturns = [];
        for (let i = 1; i < closes.length; i++) {
            if (closes[i] != null && closes[i - 1] != null && closes[i - 1] !== 0) {
                dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
            }
        }

        // Average volume over period
        const validVolumes = volumes.filter(v => v != null && v > 0);
        const avgVolume = validVolumes.length > 0
            ? validVolumes.reduce((a, b) => a + b, 0) / validVolumes.length
            : 0;

        // Current volume (latest day)
        const currentVolume = validVolumes.length > 0 ? validVolumes[validVolumes.length - 1] : 0;

        // Compute high/low range for the period
        const validHighs = highs.filter(h => h != null);
        const validLows = lows.filter(l => l != null);
        const periodHigh = validHighs.length > 0 ? Math.max(...validHighs) : price;
        const periodLow = validLows.length > 0 ? Math.min(...validLows) : price;

        // Volatility (std dev of daily returns, annualized)
        const volatility = computeVolatility(dailyReturns);

        // Momentum: price relative to 5-day range
        const momentum = periodHigh !== periodLow
            ? ((price - periodLow) / (periodHigh - periodLow)) * 100
            : 50;

        // Volume ratio (current vs average)
        const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

        return {
            symbol: meta.symbol,
            name: meta.shortName || meta.longName || meta.symbol,
            price,
            prevClose,
            change,
            changePercent,
            volume: currentVolume,
            avgVolume,
            volumeRatio,
            marketCap: meta.marketCap || 0,
            currency: meta.currency || 'USD',
            exchange: meta.exchangeName || '',
            periodHigh,
            periodLow,
            volatility,
            momentum,
            dailyReturns,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
            lastFetched: Date.now(),
            error: null,
        };
    } catch (err) {
        return {
            symbol,
            error: err.message,
            lastFetched: Date.now(),
        };
    }
}

function computeVolatility(returns) {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // annualized %
}

// ---- Analysis & Scoring ----

function analyzeStock(stock) {
    if (stock.error) return { ...stock, compositeScore: 0, signal: 'hold' };

    // Scoring weights
    const scores = {};

    // 1. Price momentum (0-100, higher = better)
    scores.momentum = clamp(stock.momentum, 0, 100);

    // 2. Change percent score (map -5%..+5% to 0..100)
    scores.changePercent = clamp(mapRange(stock.changePercent, -5, 5, 0, 100), 0, 100);

    // 3. Volume enthusiasm: high volume ratio is bullish
    scores.volumeRatio = clamp(mapRange(stock.volumeRatio, 0.5, 2.0, 20, 100), 0, 100);

    // 4. Volatility score (lower volatility = higher score for safety)
    scores.volatilityScore = clamp(mapRange(stock.volatility, 80, 10, 0, 100), 0, 100);

    // 5. 52-week position
    let weekPosition = 50;
    if (stock.fiftyTwoWeekHigh > stock.fiftyTwoWeekLow && stock.fiftyTwoWeekLow > 0) {
        weekPosition = ((stock.price - stock.fiftyTwoWeekLow) / (stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow)) * 100;
    }
    scores.weekPosition = clamp(weekPosition, 0, 100);

    // Composite score (weighted average)
    const composite =
        scores.momentum * 0.25 +
        scores.changePercent * 0.25 +
        scores.volumeRatio * 0.15 +
        scores.volatilityScore * 0.15 +
        scores.weekPosition * 0.20;

    // Signal determination
    let signal = 'hold';
    if (composite >= 65) signal = 'buy';
    else if (composite <= 35) signal = 'sell';

    return {
        ...stock,
        scores,
        compositeScore: Math.round(composite),
        signal,
    };
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

// ---- Ranking ----

function rankStocks() {
    const sortBy = document.getElementById('sortBy').value;
    const stocks = Object.values(stockData).filter(s => !s.error && !INDEX_SYMBOLS.includes(s.symbol));

    stocks.sort((a, b) => {
        switch (sortBy) {
            case 'compositeScore': return (b.compositeScore || 0) - (a.compositeScore || 0);
            case 'changePercent': return (b.changePercent || 0) - (a.changePercent || 0);
            case 'volume': return (b.volume || 0) - (a.volume || 0);
            case 'marketCap': return (b.marketCap || 0) - (a.marketCap || 0);
            case 'momentum': return (b.momentum || 0) - (a.momentum || 0);
            case 'volatility': return (a.volatility || 0) - (b.volatility || 0); // lower is better
            default: return (b.compositeScore || 0) - (a.compositeScore || 0);
        }
    });

    return stocks;
}

// ---- Rendering ----

function renderStocks() {
    const ranked = rankStocks();
    renderStockCards(ranked);
    renderRankingTable(ranked);
}

function renderStockCards(ranked) {
    const grid = document.getElementById('stockGrid');
    const loading = document.getElementById('loadingState');
    if (loading) loading.style.display = 'none';

    // Keep cards, remove old ones
    grid.innerHTML = '';

    ranked.forEach((stock, index) => {
        const card = document.createElement('div');
        card.className = 'stock-card';
        const changeClass = stock.changePercent >= 0 ? 'up' : 'down';
        const changeSign = stock.changePercent >= 0 ? '+' : '';
        const scoreLevel = stock.compositeScore >= 60 ? 'high' : stock.compositeScore >= 40 ? 'medium' : 'low';

        card.innerHTML = `
            <button class="remove-btn" onclick="removeSymbol('${stock.symbol}')" title="Remove">&times;</button>
            <div class="rank-badge ${index < 3 ? 'top3' : ''}">#${index + 1}</div>
            <div class="card-header">
                <div>
                    <div class="card-symbol">${stock.symbol}</div>
                    <div class="card-name">${stock.name}</div>
                </div>
                <div>
                    <div class="card-price">${formatCurrency(stock.price)}</div>
                    <div class="card-change ${changeClass}">
                        ${changeSign}${stock.change.toFixed(2)} (${changeSign}${stock.changePercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
            <div class="card-metrics">
                <div class="metric">
                    <span class="metric-label">Volume</span>
                    <span class="metric-value">${formatNumber(stock.volume)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Vol Ratio</span>
                    <span class="metric-value" style="color: ${stock.volumeRatio > 1.2 ? 'var(--green)' : stock.volumeRatio < 0.8 ? 'var(--red)' : 'var(--text-primary)'}">${stock.volumeRatio.toFixed(2)}x</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Momentum</span>
                    <span class="metric-value">${stock.momentum.toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Volatility</span>
                    <span class="metric-value">${stock.volatility.toFixed(1)}%</span>
                </div>
            </div>
            <div class="card-analysis">
                <span class="signal-badge ${stock.signal}">${stock.signal}</span>
                <div class="score-bar">
                    <div class="score-bar-track">
                        <div class="score-bar-fill ${scoreLevel}" style="width: ${stock.compositeScore}%"></div>
                    </div>
                    <span class="score-label">${stock.compositeScore}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderRankingTable(ranked) {
    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';

    ranked.forEach((stock, index) => {
        const changeClass = stock.changePercent >= 0 ? 'up' : 'down';
        const changeSign = stock.changePercent >= 0 ? '+' : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="rank-num ${index < 3 ? 'top' : ''}">${index + 1}</td>
            <td class="symbol-cell">${stock.symbol}</td>
            <td>${formatCurrency(stock.price)}</td>
            <td class="${changeClass}">${changeSign}${stock.changePercent.toFixed(2)}%</td>
            <td>${formatNumber(stock.volume)}</td>
            <td>${formatMarketCap(stock.marketCap)}</td>
            <td>${stock.momentum.toFixed(1)}%</td>
            <td>${stock.volatility.toFixed(1)}%</td>
            <td><strong>${stock.compositeScore}</strong></td>
            <td><span class="signal-badge ${stock.signal}">${stock.signal}</span></td>
            <td><button class="remove-row-btn" onclick="removeSymbol('${stock.symbol}')">&times;</button></td>
        `;
        tbody.appendChild(row);
    });
}

function updateMarketOverview() {
    const indices = [
        { id: 'overviewSP500', symbol: '^GSPC' },
        { id: 'overviewDow', symbol: '^DJI' },
        { id: 'overviewNasdaq', symbol: '^IXIC' },
        { id: 'overviewVIX', symbol: '^VIX' },
    ];

    indices.forEach(({ id, symbol }) => {
        const el = document.getElementById(id);
        const data = stockData[symbol];
        if (!data || data.error) return;

        el.querySelector('.overview-value').textContent = formatCurrency(data.price);
        const changeEl = el.querySelector('.overview-change');
        const sign = data.changePercent >= 0 ? '+' : '';
        changeEl.textContent = `${sign}${data.changePercent.toFixed(2)}%`;
        changeEl.className = `overview-change ${data.changePercent >= 0 ? 'up' : 'down'}`;
    });
}

// ---- Formatting Helpers ----

function formatCurrency(val) {
    if (val == null) return '--';
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(val) {
    if (val == null) return '--';
    if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B';
    if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M';
    if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K';
    return val.toLocaleString();
}

function formatMarketCap(val) {
    if (!val) return '--';
    if (val >= 1e12) return '$' + (val / 1e12).toFixed(2) + 'T';
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(0) + 'M';
    return '$' + val.toLocaleString();
}

// ---- User Actions ----

function addSymbol() {
    const input = document.getElementById('symbolInput');
    const raw = input.value.trim().toUpperCase();
    if (!raw) return;

    // Support comma-separated symbols
    const symbols = raw.split(/[\s,]+/).filter(s => s.length > 0);
    let added = false;

    symbols.forEach(sym => {
        if (!trackedSymbols.includes(sym)) {
            trackedSymbols.push(sym);
            added = true;
        }
    });

    if (added) {
        saveSymbols();
        fetchAllStocks();
    }
    input.value = '';
}

function removeSymbol(symbol) {
    trackedSymbols = trackedSymbols.filter(s => s !== symbol);
    delete stockData[symbol];
    saveSymbols();
    renderStocks();
}

function saveSymbols() {
    localStorage.setItem('trackedSymbols', JSON.stringify(trackedSymbols));
}

// ---- Data Fetching Pipeline ----

async function fetchAllStocks() {
    updateStatus('loading');
    const allSymbols = [...new Set([...INDEX_SYMBOLS, ...trackedSymbols])];

    // Fetch in parallel batches of 6
    const batchSize = 6;
    for (let i = 0; i < allSymbols.length; i += batchSize) {
        const batch = allSymbols.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(fetchQuote));
        results.forEach(result => {
            if (result) {
                stockData[result.symbol] = analyzeStock(result);
            }
        });
        // Render progressively
        updateMarketOverview();
        renderStocks();
    }

    updateStatus('done');
    document.getElementById('lastUpdated').textContent =
        'Updated: ' + new Date().toLocaleTimeString();
}

// ---- Market Status ----

function updateStatus(state) {
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');

    if (state === 'loading') {
        dot.className = 'status-dot';
        text.textContent = 'Fetching...';
    } else {
        // Check if market is likely open (US Eastern, Mon-Fri, 9:30am-4pm)
        const now = new Date();
        const utcHour = now.getUTCHours();
        const utcMin = now.getUTCMinutes();
        const day = now.getUTCDay();
        // ET = UTC-5 (EST) or UTC-4 (EDT) -- approximate
        const etHour = (utcHour - 5 + 24) % 24;
        const isWeekday = day >= 1 && day <= 5;
        const afterOpen = etHour > 9 || (etHour === 9 && utcMin >= 30);
        const beforeClose = etHour < 16;
        const isOpen = isWeekday && afterOpen && beforeClose;

        dot.className = `status-dot ${isOpen ? 'live' : 'closed'}`;
        text.textContent = isOpen ? 'Market Open' : 'Market Closed';
    }
}

// ---- Auto Refresh ----

function toggleAutoRefresh() {
    const checked = document.getElementById('autoRefresh').checked;
    if (checked) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

function startAutoRefresh() {
    stopAutoRefresh();
    refreshTimer = setInterval(fetchAllStocks, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}

// ---- Keyboard Shortcut ----

document.getElementById('symbolInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSymbol();
});

// ---- Initialize ----

(function init() {
    fetchAllStocks();
    if (document.getElementById('autoRefresh').checked) {
        startAutoRefresh();
    }
})();
