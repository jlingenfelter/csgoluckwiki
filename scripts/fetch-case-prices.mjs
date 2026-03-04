/**
 * PriceEmpire Case Container Price Fetcher
 *
 * Fetches market prices for CS2 case containers from PriceEmpire.
 * Uses the same API and price extraction logic as fetch-prices.mjs.
 *
 * Output: src/lib/case-prices.json
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'case-prices.json');

const API_BASE = 'https://api.pricempire.com/v4/paid';
const AUTH_HEADER = { 'Authorization': `Bearer ${API_KEY}` };

// Source priority (same as fetch-prices.mjs)
const CORE_SOURCES = [
  'buff163', 'buff163_buy', 'steam', 'skinport', 'csmoney', 'csmoneym',
  'dmarket', 'bitskins', 'csfloat', 'waxpeer', 'lisskins', 'skinbaron',
  'csgoempire', 'csgoroll', 'clashgg', 'skinsmonkey', 'youpin', 'uuskins',
  'whitemarket', 'ecosteam', 'shadowpay', 'rain', 'pirateswap', 'skins',
];
const PREFERRED_SOURCES = ['buff163', 'buff163_buy', 'steam', 'skinport', 'csfloat', 'csmoney'];

// Case ID → Steam market_hash_name mapping (from caseDatabase in cases.ts)
const CASE_NAMES = {
  'kilowatt': 'Kilowatt Case',
  'gallery': 'Gallery Case',
  'revolution': 'Revolution Case',
  'recoil': 'Recoil Case',
  'dreams-nightmares': 'Dreams & Nightmares Case',
  'snakebite': 'Snakebite Case',
  'fracture': 'Fracture Case',
  'prisma2': 'Prisma 2 Case',
  'prisma': 'Prisma Case',
  'clutch': 'Clutch Case',
  'spectrum2': 'Spectrum 2 Case',
  'danger-zone': 'Danger Zone Case',
  'cs20': 'CS20 Case',
  'operation-bravo': 'Operation Bravo Case',
  'chroma': 'Chroma Case',
  'gamma': 'Gamma Case',
  'fever': 'Fever Case',
  'horizon': 'Horizon Case',
  'spectrum': 'Spectrum Case',
  'glove': 'Glove Case',
  'gamma2': 'Gamma 2 Case',
  'chroma3': 'Chroma 3 Case',
  'chroma2': 'Chroma 2 Case',
  'revolver': 'Revolver Case',
  'falchion': 'Falchion Case',
  'shadow': 'Shadow Case',
  'operation-wildfire': 'Operation Wildfire Case',
  'operation-hydra': 'Operation Hydra Case',
  'operation-riptide': 'Operation Riptide Case',
  'operation-broken-fang': 'Operation Broken Fang Case',
  'shattered-web': 'Shattered Web Case',
  'operation-breakout': 'Operation Breakout Weapon Case',
  'operation-vanguard': 'Operation Vanguard Weapon Case',
  'operation-phoenix': 'Operation Phoenix Weapon Case',
  'huntsman': 'Huntsman Weapon Case',
  'winter-offensive': 'Winter Offensive Weapon Case',
  'csgo-weapon-case': 'CS:GO Weapon Case',
  'csgo-weapon-case-2': 'CS:GO Weapon Case 2',
  'csgo-weapon-case-3': 'CS:GO Weapon Case 3',
  'esports-2013': 'eSports 2013 Case',
  'esports-2013-winter': 'eSports 2013 Winter Case',
  'esports-2014-summer': 'eSports 2014 Summer Case',
};

// Reverse lookup: market name → case ID
const NAME_TO_ID = {};
for (const [id, name] of Object.entries(CASE_NAMES)) {
  NAME_TO_ID[name] = id;
}

// ── Fetch with retry (same pattern as fetch-prices.mjs) ─────────────────────
async function fetchWithRetry(url, retries = 3, timeoutMs = 60000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { headers: AUTH_HEADER, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      if (res.status === 429) {
        const wait = Math.pow(2, i) * 3000;
        console.log(`   ⏳ Rate limited (429), waiting ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      console.log(`   ⚠️ HTTP ${res.status}: ${res.statusText} (attempt ${i + 1}/${retries})`);
      if (i === retries - 1) return res;
    } catch (err) {
      console.log(`   ⚠️ Fetch error: ${err.message} (attempt ${i + 1}/${retries})`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// ── Extract best price from a price item (same logic as fetch-prices.mjs) ───
function extractPrice(item) {
  const providers = {};
  const allPrices = [];
  const prices = item.prices;

  if (Array.isArray(prices)) {
    for (const p of prices) {
      const source = p.provider_key || p.source || p.provider || p.market || p.name || '';
      const rawPrice = p.price;
      if (!rawPrice || rawPrice <= 0) continue;
      const priceUSD = rawPrice / 100;
      if (source) providers[source] = Math.round(priceUSD * 100) / 100;
      allPrices.push(priceUSD);
    }
  } else if (prices && typeof prices === 'object') {
    for (const [source, val] of Object.entries(prices)) {
      let priceUSD = 0;
      if (typeof val === 'number' && val > 0) {
        priceUSD = val / 100;
      } else if (val && typeof val === 'object' && val.price > 0) {
        priceUSD = val.price / 100;
      }
      if (priceUSD > 0) {
        providers[source] = Math.round(priceUSD * 100) / 100;
        allPrices.push(priceUSD);
      }
    }
  }

  let bestPrice = 0;
  let bestSource = '';
  for (const src of PREFERRED_SOURCES) {
    if (providers[src] && providers[src] > 0) {
      bestPrice = providers[src];
      bestSource = src;
      break;
    }
  }

  if (bestPrice === 0 && allPrices.length > 0) {
    allPrices.sort((a, b) => a - b);
    const mid = Math.floor(allPrices.length / 2);
    bestPrice = allPrices.length % 2 === 0
      ? (allPrices[mid - 1] + allPrices[mid]) / 2
      : allPrices[mid];
    bestSource = 'median';
  }

  if (bestPrice === 0) {
    const singlePrice = item.price || item.suggested_price || 0;
    if (singlePrice > 0) {
      bestPrice = singlePrice / 100;
      bestSource = 'suggested';
    }
  }

  return { price: Math.round(bestPrice * 100) / 100, source: bestSource, providers };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('📦 Fetching case container prices from PriceEmpire...\n');

  if (!API_KEY) {
    console.log('⚠️ PRICEMPIRE_API_KEY not set — writing empty fallback');
    writeFileSync(OUTPUT_PATH, JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'placeholder', cases: {} }, null, 2));
    return;
  }

  // Fetch prices — try progressively fewer sources on failure (same as fetch-prices.mjs)
  const sourceOptions = [
    CORE_SOURCES.join(','),
    'buff163,steam,skinport,csfloat,csmoney',
    'buff163',
  ];

  let pricesData;
  for (const sources of sourceOptions) {
    const url = `${API_BASE}/items/prices?app_id=730&currency=USD&sources=${sources}`;
    console.log(`🔄 Fetching prices (${sources.split(',').length} sources)...`);
    try {
      const res = await fetchWithRetry(url);
      if (!res || !res.ok) {
        console.log(`   ⚠️ Failed with ${sources.split(',').length} sources (${res?.status}), trying fewer...`);
        continue;
      }
      pricesData = await res.json();
      console.log(`✅ Got prices response (type: ${typeof pricesData}, isArray: ${Array.isArray(pricesData)})`);
      break;
    } catch (err) {
      console.log(`   ⚠️ Fetch error: ${err.message}, trying fewer sources...`);
    }
  }

  if (!pricesData) {
    console.log('❌ All source options failed');
    writeFileSync(OUTPUT_PATH, JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'error', cases: {} }, null, 2));
    return;
  }

  // Normalize into a name → item map
  const priceMap = new Map();
  if (Array.isArray(pricesData)) {
    for (const item of pricesData) {
      const name = item.market_hash_name || item.name || item.marketHashName || '';
      if (name) priceMap.set(name, item);
    }
  } else if (typeof pricesData === 'object') {
    for (const [name, val] of Object.entries(pricesData)) {
      if (typeof val === 'object' && val !== null) {
        priceMap.set(name, { market_hash_name: name, ...val });
      } else if (typeof val === 'number') {
        priceMap.set(name, { market_hash_name: name, price: val });
      }
    }
  }
  console.log(`📊 Normalized ${priceMap.size} items in price map`);

  // Extract prices for our cases
  const cases = {};
  let found = 0;
  let missing = 0;

  for (const [id, marketName] of Object.entries(CASE_NAMES)) {
    const item = priceMap.get(marketName);
    if (item) {
      const { price, source, providers } = extractPrice(item);
      if (price > 0) {
        cases[id] = { price, source };
        found++;
        console.log(`   ✅ ${marketName}: $${price.toFixed(2)} (${source})`);
      } else {
        missing++;
        console.log(`   ⚠️ ${marketName}: no price data`);
      }
    } else {
      missing++;
      console.log(`   ❌ ${marketName}: not found in API response`);
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source: 'pricempire',
    cases,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✅ Done! ${found} cases with prices, ${missing} missing → ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  writeFileSync(OUTPUT_PATH, JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'error', cases: {} }, null, 2));
  process.exit(1);
});
