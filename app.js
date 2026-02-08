// ============================================================
// Cookie Clicker Game
// ============================================================

// --- Game State ---
const game = {
    cookies: 0,
    totalCookies: 0,
    totalClicks: 0,
    clickPower: 1,
    cps: 0,
    buildings: {},
    upgrades: {},
    startTime: Date.now(),
    goldenClicks: 0,
};

// --- Building Definitions ---
const BUILDINGS = [
    { id: 'cursor',    name: 'Cursor',       icon: '\u{1F5B1}', desc: 'Auto-clicks once every 10 seconds',   baseCost: 15,         baseCps: 0.1   },
    { id: 'grandma',   name: 'Grandma',      icon: '\u{1F475}', desc: 'A nice grandma to bake cookies',      baseCost: 100,        baseCps: 1     },
    { id: 'farm',      name: 'Farm',          icon: '\u{1F33E}', desc: 'Grows cookie plants',                 baseCost: 1100,       baseCps: 8     },
    { id: 'mine',      name: 'Mine',          icon: '\u{26CF}',  desc: 'Mines cookie dough from the earth',   baseCost: 12000,      baseCps: 47    },
    { id: 'factory',   name: 'Factory',       icon: '\u{1F3ED}', desc: 'Mass-produces cookies',               baseCost: 130000,     baseCps: 260   },
    { id: 'bank',      name: 'Bank',          icon: '\u{1F3E6}', desc: 'Generates cookies from interest',     baseCost: 1400000,    baseCps: 1400  },
    { id: 'temple',    name: 'Temple',        icon: '\u{26EA}',  desc: 'Prayers bring forth cookies',         baseCost: 20000000,   baseCps: 7800  },
    { id: 'wizard',    name: 'Wizard Tower',  icon: '\u{1F9D9}', desc: 'Conjures cookies with magic',         baseCost: 330000000,  baseCps: 44000 },
    { id: 'shipment',  name: 'Shipment',      icon: '\u{1F680}', desc: 'Imports cookies from the cookie planet', baseCost: 5100000000, baseCps: 260000 },
    { id: 'alchemy',   name: 'Alchemy Lab',   icon: '\u{2697}',  desc: 'Turns gold into cookies',             baseCost: 75000000000, baseCps: 1600000 },
];

// --- Upgrade Definitions ---
const UPGRADES = [
    // Click upgrades
    { id: 'click1',  name: 'Reinforced Index Finger', icon: '\u{1F446}', desc: 'Click power x2',             cost: 100,       type: 'click',    multiplier: 2, requires: { totalClicks: 1 } },
    { id: 'click2',  name: 'Carpal Tunnel Prevention', icon: '\u{1F4AA}', desc: 'Click power x2',            cost: 500,       type: 'click',    multiplier: 2, requires: { totalClicks: 50 } },
    { id: 'click3',  name: 'Ambidextrous',            icon: '\u{1F91E}', desc: 'Click power x2',             cost: 10000,     type: 'click',    multiplier: 2, requires: { totalClicks: 200 } },
    { id: 'click4',  name: 'Thousand Fingers',        icon: '\u{270B}',  desc: 'Click power x5',             cost: 100000,    type: 'click',    multiplier: 5, requires: { totalClicks: 500 } },

    // Building upgrades - Cursor
    { id: 'cursor1',  name: 'Faster Cursors',     icon: '\u{2B50}', desc: 'Cursors are twice as efficient',   cost: 100,       type: 'building', target: 'cursor',  multiplier: 2, requires: { building: 'cursor', count: 1 } },
    { id: 'cursor2',  name: 'Titanium Mouse',     icon: '\u{1F31F}', desc: 'Cursors are twice as efficient',  cost: 500,       type: 'building', target: 'cursor',  multiplier: 2, requires: { building: 'cursor', count: 10 } },

    // Building upgrades - Grandma
    { id: 'grandma1', name: 'Forwards from Grandma', icon: '\u{1F4E7}', desc: 'Grandmas are twice as efficient', cost: 1000,  type: 'building', target: 'grandma', multiplier: 2, requires: { building: 'grandma', count: 1 } },
    { id: 'grandma2', name: 'Steel-Plated Rolling Pins', icon: '\u{1F4CC}', desc: 'Grandmas are twice as efficient', cost: 5000, type: 'building', target: 'grandma', multiplier: 2, requires: { building: 'grandma', count: 10 } },

    // Building upgrades - Farm
    { id: 'farm1',    name: 'Cheap Hoes',         icon: '\u{1F331}', desc: 'Farms are twice as efficient',    cost: 11000,     type: 'building', target: 'farm',    multiplier: 2, requires: { building: 'farm', count: 1 } },
    { id: 'farm2',    name: 'Fertilizer',          icon: '\u{1F4A7}', desc: 'Farms are twice as efficient',   cost: 55000,     type: 'building', target: 'farm',    multiplier: 2, requires: { building: 'farm', count: 10 } },

    // Building upgrades - Mine
    { id: 'mine1',    name: 'Sugar Gas',           icon: '\u{1F4A8}', desc: 'Mines are twice as efficient',   cost: 120000,    type: 'building', target: 'mine',    multiplier: 2, requires: { building: 'mine', count: 1 } },
    { id: 'mine2',    name: 'Megadrill',           icon: '\u{1F529}', desc: 'Mines are twice as efficient',   cost: 600000,    type: 'building', target: 'mine',    multiplier: 2, requires: { building: 'mine', count: 10 } },

    // Building upgrades - Factory
    { id: 'factory1', name: 'Sturdier Conveyor Belts', icon: '\u{2699}', desc: 'Factories are twice as efficient', cost: 1300000, type: 'building', target: 'factory', multiplier: 2, requires: { building: 'factory', count: 1 } },
    { id: 'factory2', name: 'Child Labor',         icon: '\u{1F477}', desc: 'Factories are twice as efficient', cost: 6500000, type: 'building', target: 'factory', multiplier: 2, requires: { building: 'factory', count: 10 } },

    // Building upgrades - Bank
    { id: 'bank1',    name: 'Taller Tellers',      icon: '\u{1F4B0}', desc: 'Banks are twice as efficient',   cost: 14000000,  type: 'building', target: 'bank',    multiplier: 2, requires: { building: 'bank', count: 1 } },
    { id: 'bank2',    name: 'Monopoly',             icon: '\u{1F3B2}', desc: 'Banks are twice as efficient',  cost: 70000000,  type: 'building', target: 'bank',    multiplier: 2, requires: { building: 'bank', count: 10 } },

    // CPS multipliers
    { id: 'mult1',  name: 'Kitten Helpers',       icon: '\u{1F431}', desc: 'All production x2',             cost: 50000,      type: 'global', multiplier: 2, requires: { totalCookies: 10000 } },
    { id: 'mult2',  name: 'Kitten Workers',       icon: '\u{1F63A}', desc: 'All production x2',             cost: 5000000,    type: 'global', multiplier: 2, requires: { totalCookies: 1000000 } },
    { id: 'mult3',  name: 'Kitten Engineers',      icon: '\u{1F638}', desc: 'All production x2',            cost: 500000000,  type: 'global', multiplier: 2, requires: { totalCookies: 100000000 } },
];

// --- Initialize Building Counts ---
BUILDINGS.forEach(b => {
    game.buildings[b.id] = 0;
});
UPGRADES.forEach(u => {
    game.upgrades[u.id] = false;
});

// --- DOM References ---
const cookieCountEl = document.getElementById('cookieCount');
const cpsEl = document.getElementById('cps');
const clickPowerEl = document.getElementById('clickPower');
const bigCookieEl = document.getElementById('bigCookie');
const cookieAreaEl = document.getElementById('cookieArea');
const buildingListEl = document.getElementById('buildingList');
const upgradeListEl = document.getElementById('upgradeList');
const statsPanelEl = document.getElementById('statsPanel');
const goldenCookieEl = document.getElementById('goldenCookie');
const saveIndicatorEl = document.getElementById('saveIndicator');

// --- Number Formatting ---
function formatNumber(n) {
    if (n < 1000) return Math.floor(n).toLocaleString();
    if (n < 1e6) return (n / 1e3).toFixed(1) + 'K';
    if (n < 1e9) return (n / 1e6).toFixed(2) + 'M';
    if (n < 1e12) return (n / 1e9).toFixed(2) + 'B';
    if (n < 1e15) return (n / 1e12).toFixed(2) + 'T';
    if (n < 1e18) return (n / 1e15).toFixed(2) + 'Qa';
    return (n / 1e18).toFixed(2) + 'Qi';
}

function formatCps(n) {
    if (n < 10) return n.toFixed(1);
    return formatNumber(n);
}

// --- Calculate CPS ---
function recalculateCps() {
    let totalCps = 0;
    let globalMultiplier = 1;

    // Apply global upgrades
    UPGRADES.forEach(u => {
        if (u.type === 'global' && game.upgrades[u.id]) {
            globalMultiplier *= u.multiplier;
        }
    });

    BUILDINGS.forEach(b => {
        const count = game.buildings[b.id];
        if (count === 0) return;

        let buildingMultiplier = 1;
        UPGRADES.forEach(u => {
            if (u.type === 'building' && u.target === b.id && game.upgrades[u.id]) {
                buildingMultiplier *= u.multiplier;
            }
        });

        totalCps += b.baseCps * count * buildingMultiplier;
    });

    game.cps = totalCps * globalMultiplier;
}

function recalculateClickPower() {
    let power = 1;
    UPGRADES.forEach(u => {
        if (u.type === 'click' && game.upgrades[u.id]) {
            power *= u.multiplier;
        }
    });
    game.clickPower = power;
}

// --- Building Cost ---
function getBuildingCost(building) {
    const count = game.buildings[building.id];
    return Math.ceil(building.baseCost * Math.pow(1.15, count));
}

// --- Cookie Click ---
function clickCookie(e) {
    game.cookies += game.clickPower;
    game.totalCookies += game.clickPower;
    game.totalClicks++;

    // Animate cookie
    bigCookieEl.classList.remove('clicked');
    void bigCookieEl.offsetWidth;
    bigCookieEl.classList.add('clicked');

    // Floating text
    const rect = cookieAreaEl.getBoundingClientRect();
    const text = document.createElement('div');
    text.className = 'click-text';
    text.textContent = '+' + formatNumber(game.clickPower);
    text.style.left = (e.clientX - rect.left - 20 + (Math.random() - 0.5) * 40) + 'px';
    text.style.top = (e.clientY - rect.top - 20) + 'px';
    cookieAreaEl.appendChild(text);
    setTimeout(() => text.remove(), 1000);

    updateDisplay();
}

bigCookieEl.addEventListener('click', clickCookie);

// --- Buy Building ---
function buyBuilding(buildingId) {
    const building = BUILDINGS.find(b => b.id === buildingId);
    if (!building) return;

    const cost = getBuildingCost(building);
    if (game.cookies < cost) return;

    game.cookies -= cost;
    game.buildings[buildingId]++;
    recalculateCps();
    updateDisplay();
}

// --- Buy Upgrade ---
function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade || game.upgrades[upgradeId]) return;
    if (game.cookies < upgrade.cost) return;
    if (!isUpgradeUnlocked(upgrade)) return;

    game.cookies -= upgrade.cost;
    game.upgrades[upgradeId] = true;

    if (upgrade.type === 'click') {
        recalculateClickPower();
    }
    recalculateCps();
    updateDisplay();
}

function isUpgradeUnlocked(upgrade) {
    const req = upgrade.requires;
    if (req.totalClicks && game.totalClicks < req.totalClicks) return false;
    if (req.totalCookies && game.totalCookies < req.totalCookies) return false;
    if (req.building && game.buildings[req.building] < req.count) return false;
    return true;
}

// --- Tab Switching ---
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById('tab-' + tabName).classList.remove('hidden');

    if (tabName === 'stats') renderStats();
}

// --- Render Buildings ---
function renderBuildings() {
    buildingListEl.innerHTML = '';

    BUILDINGS.forEach(b => {
        const cost = getBuildingCost(b);
        const count = game.buildings[b.id];
        const affordable = game.cookies >= cost;
        const visible = game.totalCookies >= b.baseCost * 0.5 || count > 0;

        if (!visible) return;

        const item = document.createElement('div');
        item.className = 'building-item' + (affordable ? ' affordable' : '') + (!affordable ? ' locked' : '');
        item.onclick = () => buyBuilding(b.id);

        let buildingCps = b.baseCps;
        UPGRADES.forEach(u => {
            if (u.type === 'building' && u.target === b.id && game.upgrades[u.id]) {
                buildingCps *= u.multiplier;
            }
        });

        item.innerHTML = `
            <div class="building-icon">${b.icon}</div>
            <div class="building-info">
                <div class="building-name">${b.name}</div>
                <div class="building-desc">${b.desc}</div>
                <div class="building-cost ${affordable ? '' : 'too-expensive'}">${formatNumber(cost)} cookies</div>
                <div class="building-cps">each produces ${formatCps(buildingCps)} cps</div>
            </div>
            <div class="building-count">${count}</div>
        `;

        buildingListEl.appendChild(item);
    });
}

// --- Render Upgrades ---
function renderUpgrades() {
    upgradeListEl.innerHTML = '';

    UPGRADES.forEach(u => {
        const purchased = game.upgrades[u.id];
        const unlocked = isUpgradeUnlocked(u);
        const affordable = game.cookies >= u.cost;

        // Only show if unlocked or purchased
        if (!unlocked && !purchased) return;

        const item = document.createElement('div');
        item.className = 'upgrade-item'
            + (purchased ? ' purchased' : '')
            + (!purchased && affordable ? ' affordable' : '')
            + (!purchased && !affordable ? ' locked' : '');

        if (!purchased) {
            item.onclick = () => buyUpgrade(u.id);
        }

        item.innerHTML = `
            ${u.icon}
            <div class="upgrade-tooltip">
                <div class="upgrade-tooltip-name">${u.name}</div>
                <div class="upgrade-tooltip-desc">${u.desc}</div>
                <div class="upgrade-tooltip-cost">${purchased ? 'Purchased' : formatNumber(u.cost) + ' cookies'}</div>
            </div>
        `;

        upgradeListEl.appendChild(item);
    });
}

// --- Render Stats ---
function renderStats() {
    const elapsed = Date.now() - game.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    const totalBuildings = Object.values(game.buildings).reduce((a, b) => a + b, 0);
    const totalUpgrades = Object.values(game.upgrades).filter(Boolean).length;

    statsPanelEl.innerHTML = `
        <div class="stat-section-title">General</div>
        <div class="stat-row">
            <span class="stat-label">Cookies in bank</span>
            <span class="stat-value">${formatNumber(game.cookies)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Total cookies baked</span>
            <span class="stat-value">${formatNumber(game.totalCookies)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Cookies per second</span>
            <span class="stat-value">${formatCps(game.cps)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Click power</span>
            <span class="stat-value">${formatNumber(game.clickPower)}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Total clicks</span>
            <span class="stat-value">${game.totalClicks.toLocaleString()}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Golden cookies clicked</span>
            <span class="stat-value">${game.goldenClicks}</span>
        </div>

        <div class="stat-section-title">Buildings & Upgrades</div>
        <div class="stat-row">
            <span class="stat-label">Buildings owned</span>
            <span class="stat-value">${totalBuildings}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Upgrades purchased</span>
            <span class="stat-value">${totalUpgrades} / ${UPGRADES.length}</span>
        </div>

        <div class="stat-section-title">Session</div>
        <div class="stat-row">
            <span class="stat-label">Time played</span>
            <span class="stat-value">${hours}h ${minutes}m ${seconds}s</span>
        </div>

        <button class="reset-btn" onclick="resetGame()">Reset Game</button>
    `;
}

// --- Update Display ---
function updateDisplay() {
    cookieCountEl.textContent = formatNumber(game.cookies);
    cpsEl.textContent = 'per second: ' + formatCps(game.cps);
    clickPowerEl.textContent = formatNumber(game.clickPower);
    renderBuildings();
    renderUpgrades();
}

// --- Game Loop (CPS ticks) ---
let lastTick = Date.now();

function gameTick() {
    const now = Date.now();
    const delta = (now - lastTick) / 1000;
    lastTick = now;

    if (game.cps > 0) {
        const earned = game.cps * delta;
        game.cookies += earned;
        game.totalCookies += earned;
    }

    updateDisplay();
    requestAnimationFrame(gameTick);
}

// --- Golden Cookie ---
let goldenTimeout = null;

function scheduleGoldenCookie() {
    const delay = 60000 + Math.random() * 120000; // 1-3 minutes
    goldenTimeout = setTimeout(spawnGoldenCookie, delay);
}

function spawnGoldenCookie() {
    const el = goldenCookieEl;
    el.classList.remove('hidden');
    el.style.left = (80 + Math.random() * (window.innerWidth - 160)) + 'px';
    el.style.top = (80 + Math.random() * (window.innerHeight - 160)) + 'px';

    // Auto-hide after 13 seconds
    setTimeout(() => {
        el.classList.add('hidden');
    }, 13000);

    // Schedule next
    scheduleGoldenCookie();
}

goldenCookieEl.addEventListener('click', () => {
    goldenCookieEl.classList.add('hidden');
    game.goldenClicks++;

    // Random bonus
    const bonusType = Math.random();
    let title, desc;

    if (bonusType < 0.5) {
        // Lucky: gain cookies equal to 10 minutes of CPS (min 100)
        const bonus = Math.max(game.cps * 600, 100);
        game.cookies += bonus;
        game.totalCookies += bonus;
        title = 'Lucky!';
        desc = '+' + formatNumber(bonus) + ' cookies';
    } else if (bonusType < 0.8) {
        // Frenzy: temporary CPS boost (handled as instant cookies for simplicity)
        const bonus = Math.max(game.cps * 900, 500);
        game.cookies += bonus;
        game.totalCookies += bonus;
        title = 'Cookie Storm!';
        desc = '+' + formatNumber(bonus) + ' cookies';
    } else {
        // Click frenzy: big click bonus
        const bonus = Math.max(game.clickPower * 777, 777);
        game.cookies += bonus;
        game.totalCookies += bonus;
        title = 'Click Frenzy!';
        desc = '+' + formatNumber(bonus) + ' cookies';
    }

    // Visual feedback
    showBonusNotification(title, desc);
    updateDisplay();
});

function showBonusNotification(title, desc) {
    // Flash
    const flash = document.createElement('div');
    flash.className = 'bonus-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    // Notification
    const notif = document.createElement('div');
    notif.className = 'bonus-notification';
    notif.innerHTML = `
        <div class="bonus-title">${title}</div>
        <div class="bonus-desc">${desc}</div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2500);
}

// --- Save / Load ---
function saveGame() {
    const data = {
        cookies: game.cookies,
        totalCookies: game.totalCookies,
        totalClicks: game.totalClicks,
        buildings: game.buildings,
        upgrades: game.upgrades,
        startTime: game.startTime,
        goldenClicks: game.goldenClicks,
    };
    localStorage.setItem('cookieClickerSave', JSON.stringify(data));

    // Show save indicator
    const el = saveIndicatorEl;
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    setTimeout(() => el.classList.add('hidden'), 2000);
}

function loadGame() {
    const raw = localStorage.getItem('cookieClickerSave');
    if (!raw) return false;

    try {
        const data = JSON.parse(raw);
        game.cookies = data.cookies || 0;
        game.totalCookies = data.totalCookies || 0;
        game.totalClicks = data.totalClicks || 0;
        game.startTime = data.startTime || Date.now();
        game.goldenClicks = data.goldenClicks || 0;

        if (data.buildings) {
            Object.keys(data.buildings).forEach(id => {
                if (game.buildings.hasOwnProperty(id)) {
                    game.buildings[id] = data.buildings[id];
                }
            });
        }
        if (data.upgrades) {
            Object.keys(data.upgrades).forEach(id => {
                if (game.upgrades.hasOwnProperty(id)) {
                    game.upgrades[id] = data.upgrades[id];
                }
            });
        }

        recalculateClickPower();
        recalculateCps();
        return true;
    } catch (e) {
        return false;
    }
}

function resetGame() {
    if (!confirm('Are you sure you want to reset all progress?')) return;

    localStorage.removeItem('cookieClickerSave');
    game.cookies = 0;
    game.totalCookies = 0;
    game.totalClicks = 0;
    game.clickPower = 1;
    game.cps = 0;
    game.startTime = Date.now();
    game.goldenClicks = 0;

    BUILDINGS.forEach(b => { game.buildings[b.id] = 0; });
    UPGRADES.forEach(u => { game.upgrades[u.id] = false; });

    updateDisplay();
}

// --- Auto-save every 30 seconds ---
setInterval(saveGame, 30000);

// --- Initialize ---
loadGame();
updateDisplay();
requestAnimationFrame(gameTick);
scheduleGoldenCookie();
