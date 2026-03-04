/**
 * PriceEmpire Build-Time Fetcher — Multi-Marketplace + Images
 *
 * Endpoints:
 *   1. GET /v4/paid/items          → Item metadata
 *   2. GET /v4/paid/items/prices   → Prices (ARRAY or OBJECT format)
 *   3. GET /v4/paid/items/images   → { cdn_url, images: { name: { steam, cdn } } }
 *
 * Auth: Authorization: Bearer YOUR_API_KEY
 * Env:  PRICEMPIRE_API_KEY
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const PRICES_PATH = join(__dirname, '..', 'src', 'lib', 'prices.json');
const SKINS_PATH = join(__dirname, '..', 'src', 'lib', 'skins-data.json');
const PRICES_PREV_PATH = join(__dirname, '..', 'src', 'lib', 'prices-previous.json');

const API_BASE = 'https://api.pricempire.com/v4/paid';
const AUTH_HEADER = { 'Authorization': `Bearer ${API_KEY}` };

// ── PriceEmpire CDN ─────────────────────────────────────────────────────────
const PE_CDN = 'https://cs2-cdn.pricempire.com';
const PE_CDN_SIZE = 300;
const STEAM_CDN = 'https://community.steamstatic.com/economy/image';

// ── Marketplace Sources (validated against PriceEmpire /v2/meta/providerKeys + status page) ──
const PRICE_SOURCES = [
  // Tier 1: Major marketplaces (high volume, well-known)
  'buff163', 'buff163_buy', 'steam', 'skinport', 'csmoney', 'csmoneym',
  'dmarket', 'bitskins', 'csfloat', 'waxpeer', 'lisskins', 'skinbaron',
  // Tier 2: Popular marketplaces (active on PriceEmpire status page)
  'csgoempire', 'csgoroll', 'clashgg', 'skinsmonkey', 'youpin', 'uuskins',
  'whitemarket', 'ecosteam', 'shadowpay', 'skinswap', 'gamerpay', 'mannco',
  'rain', 'pirateswap', 'skins', 'buffmarket',
  // Tier 3: Smaller marketplaces (confirmed in providerKeys or status page)
  'c5game', 'lootfarm', 'skinflow', 'haloskins', 'rapidskins', 'tradeit',
  'skinbid', 'marketcsgo', 'itrade', 'cstrade', 'avanmarket', 'dupefi',
  'krakatoa', 'csgo500', 'skinrave', '49skins', 'snipeskins', 'skinplace',
  'exeskins', 'lootbear', 'swap_gg', 'csdeals',
  // Tier 4: From providerKeys API (not on status page but may return data)
  'csgoexo', 'gamdom', 'skinwallet', 'skintrade', 'skinthunder', 'skinout',
  'nerf', 'ggskin', 'cs2go', 'bitskinsp2p', 'swapmarket', 'vmarket',
  'itemherald', 'skinswap_cn', 'gameboost', 'gsoltrade',
];
const CORE_SOURCES = [
  'buff163', 'buff163_buy', 'steam', 'skinport', 'csmoney', 'csmoneym',
  'dmarket', 'bitskins', 'csfloat', 'waxpeer', 'lisskins', 'skinbaron',
  'csgoempire', 'csgoroll', 'clashgg', 'skinsmonkey', 'youpin', 'uuskins',
  'whitemarket', 'ecosteam', 'shadowpay', 'rain', 'pirateswap', 'skins',
];

const MARKETPLACE_INFO = {
  // Tier 1: Major marketplaces
  'buff163':      { name: 'Buff163',        color: '#f5a623', icon: 'BUFF' },
  'buff163_buy':  { name: 'Buff163 Buy',    color: '#f5a623', icon: 'BUFF' },
  'steam':        { name: 'Steam Market',   color: '#66c0f4', icon: 'STM' },
  'skinport':     { name: 'Skinport',       color: '#00a3ff', icon: 'SP' },
  'csmoney':      { name: 'CS.Money',       color: '#ffca28', icon: 'CSM' },
  'csmoneym':     { name: 'CS.Money Bot',   color: '#ffca28', icon: 'CSM' },
  'dmarket':      { name: 'DMarket',        color: '#6c5ce7', icon: 'DM' },
  'bitskins':     { name: 'BitSkins',       color: '#ff6b35', icon: 'BS' },
  'csfloat':      { name: 'CSFloat',        color: '#1a73e8', icon: 'CSF' },
  'waxpeer':      { name: 'Waxpeer',        color: '#ff9800', icon: 'WP' },
  'lisskins':     { name: 'LIS-SKINS',      color: '#ff5722', icon: 'LIS' },
  'skinbaron':    { name: 'SkinBaron',      color: '#e53935', icon: 'SBN' },
  // Tier 2: Popular marketplaces
  'csgoempire':   { name: 'CSGOEmpire',    color: '#f0b90b', icon: 'EMP' },
  'csgoroll':     { name: 'CSGORoll',       color: '#e74c3c', icon: 'ROLL' },
  'clashgg':      { name: 'Clash.GG',       color: '#f39c12', icon: 'CLG' },
  'skinsmonkey':  { name: 'SkinsMonkey',    color: '#27ae60', icon: 'SM' },
  'youpin':       { name: 'Youpin (UU)',     color: '#e91e63', icon: 'YP' },
  'uuskins':      { name: 'UUSkins',        color: '#9b59b6', icon: 'UU' },
  'whitemarket':  { name: 'White.Market',   color: '#ecf0f1', icon: 'WM' },
  'ecosteam':     { name: 'Ecosteam',       color: '#2ecc71', icon: 'ECO' },
  'shadowpay':    { name: 'ShadowPay',      color: '#9c27b0', icon: 'SHP' },
  'skinswap':     { name: 'SkinSwap',       color: '#8bc34a', icon: 'SW' },
  'gamerpay':     { name: 'GamerPay',       color: '#00c853', icon: 'GP' },
  'mannco':       { name: 'Mannco.store',   color: '#795548', icon: 'MC' },
  'rain':         { name: 'Rain.GG',        color: '#3498db', icon: 'RN' },
  'pirateswap':   { name: 'PirateSwap',     color: '#e74c3c', icon: 'PS' },
  'skins':        { name: 'Skins.com',      color: '#8e44ad', icon: 'SKN' },
  'buffmarket':   { name: 'BuffMarket',     color: '#f5a623', icon: 'BM' },
  // Tier 3: Smaller/niche marketplaces
  'c5game':       { name: 'C5Game',         color: '#ff6f00', icon: 'C5' },
  'lootfarm':     { name: 'Loot.Farm',      color: '#ff7043', icon: 'LF' },
  'skinflow':     { name: 'SkinFlow',       color: '#1abc9c', icon: 'SF' },
  'haloskins':    { name: 'HaloSkins',      color: '#ab47bc', icon: 'HS' },
  'rapidskins':   { name: 'RapidSkins',     color: '#e67e22', icon: 'RS' },
  'tradeit':      { name: 'Tradeit.gg',     color: '#4caf50', icon: 'TI' },
  'skinbid':      { name: 'SkinBid',        color: '#2196f3', icon: 'SB' },
  'marketcsgo':   { name: 'Market.CSGO',    color: '#607d8b', icon: 'MCS' },
  'itrade':       { name: 'iTrade',         color: '#00bcd4', icon: 'IT' },
  'cstrade':      { name: 'CSTrade',        color: '#009688', icon: 'CST' },
  'avanmarket':   { name: 'AvanMarket',     color: '#673ab7', icon: 'AV' },
  'dupefi':       { name: 'Dupe.fi',        color: '#34495e', icon: 'DF' },
  'krakatoa':     { name: 'Krakatoa',       color: '#d35400', icon: 'KRK' },
  'csgo500':      { name: 'CSGO500',        color: '#e74c3c', icon: '500' },
  'skinrave':     { name: 'SkinRave',       color: '#e91e63', icon: 'SR' },
  '49skins':      { name: '49Skins',        color: '#3f51b5', icon: '49' },
  'snipeskins':   { name: 'SnipeSkins',     color: '#ff5722', icon: 'SNP' },
  'skinplace':    { name: 'SkinPlace',      color: '#009688', icon: 'SPL' },
  'exeskins':     { name: 'ExeSkins',       color: '#607d8b', icon: 'EXE' },
  'swap_gg':      { name: 'Swap.gg',        color: '#7c4dff', icon: 'SG' },
  'csdeals':      { name: 'CS.Deals',       color: '#26a69a', icon: 'CSD' },
  'lootbear':     { name: 'LootBear',       color: '#ffd54f', icon: 'LB' },
  // Tier 4: From providerKeys API
  'csgoexo':      { name: 'CSGOExo',        color: '#ff7043', icon: 'EXO' },
  'gamdom':       { name: 'Gamdom',          color: '#2ecc71', icon: 'GAM' },
  'skinwallet':   { name: 'SkinWallet',     color: '#3498db', icon: 'SWL' },
  'skintrade':    { name: 'SkinTrade',      color: '#e67e22', icon: 'STR' },
  'skinthunder':  { name: 'SkinThunder',    color: '#f39c12', icon: 'STH' },
  'skinout':      { name: 'SkinOut',         color: '#1abc9c', icon: 'SO' },
  'nerf':         { name: 'Nerf.app',        color: '#e74c3c', icon: 'NRF' },
  'ggskin':       { name: 'GGSkin',          color: '#9b59b6', icon: 'GGS' },
  'cs2go':        { name: 'CS2GO',           color: '#3f51b5', icon: 'C2G' },
  'bitskinsp2p':  { name: 'BitSkins P2P',   color: '#ff6b35', icon: 'BSP' },
  'swapmarket':   { name: 'SwapMarket',     color: '#795548', icon: 'SWM' },
  'vmarket':      { name: 'V.Market',        color: '#607d8b', icon: 'VM' },
  'itemherald':   { name: 'ItemHerald',     color: '#00bcd4', icon: 'IH' },
  'skinswap_cn':  { name: 'SkinSwap CN',    color: '#8bc34a', icon: 'SWC' },
  'gameboost':    { name: 'GameBoost',       color: '#4caf50', icon: 'GB' },
  'gsoltrade':    { name: 'GSOL.Trade',      color: '#ff9800', icon: 'GSL' },
};

// ── Wear conditions ──────────────────────────────────────────────────────────
const WEAR_ORDER = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];

// ── Doppler phase variants ──────────────────────────────────────────────────
const DOPPLER_PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Ruby', 'Sapphire', 'Black Pearl'];
const GAMMA_DOPPLER_PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Emerald'];
const ALL_PHASE_SUFFIXES = [...new Set([...DOPPLER_PHASES, ...GAMMA_DOPPLER_PHASES])];

// ── Weapon prefixes ──────────────────────────────────────────────────────────
const WEAPON_PREFIXES = [
  'AK-47', 'M4A4', 'M4A1-S', 'AWP', 'Desert Eagle', 'USP-S', 'Glock-18',
  'SSG 08', 'Galil AR', 'FAMAS', 'AUG', 'SG 553', 'MAC-10', 'MP9',
  'MP7', 'UMP-45', 'P90', 'P250', 'Five-SeveN', 'Tec-9', 'CZ75-Auto',
  'Nova', 'XM1014', 'MAG-7', 'Sawed-Off', 'MP5-SD', 'PP-Bizon',
  'Dual Berettas', 'R8 Revolver', 'SCAR-20', 'G3SG1', 'Negev', 'M249',
  'P2000',
];
const KNIFE_PREFIXES = [
  'Bayonet', 'Karambit', 'Butterfly Knife', 'M9 Bayonet', 'Flip Knife',
  'Gut Knife', 'Falchion Knife', 'Shadow Daggers', 'Bowie Knife',
  'Huntsman Knife', 'Navaja Knife', 'Stiletto Knife', 'Talon Knife',
  'Ursus Knife', 'Classic Knife', 'Nomad Knife', 'Skeleton Knife',
  'Survival Knife', 'Paracord Knife', 'Kukri Knife',
];
const GLOVE_PREFIXES = [
  'Sport Gloves', 'Specialist Gloves', 'Driver Gloves', 'Hand Wraps',
  'Moto Gloves', 'Hydra Gloves', 'Broken Fang Gloves',
];

const RIFLES = ['AK-47', 'M4A4', 'M4A1-S', 'AWP', 'SSG 08', 'Galil AR', 'FAMAS', 'AUG', 'SG 553', 'SCAR-20', 'G3SG1'];
const PISTOLS = ['Desert Eagle', 'USP-S', 'Glock-18', 'P250', 'Five-SeveN', 'Tec-9', 'CZ75-Auto', 'Dual Berettas', 'R8 Revolver', 'P2000'];
const SMGS = ['MAC-10', 'MP9', 'MP7', 'UMP-45', 'P90', 'MP5-SD', 'PP-Bizon'];
const HEAVIES = ['Nova', 'XM1014', 'MAG-7', 'Sawed-Off', 'Negev', 'M249'];

function inferCategory(weaponName) {
  if (KNIFE_PREFIXES.includes(weaponName)) return 'knife';
  if (GLOVE_PREFIXES.includes(weaponName)) return 'glove';
  if (RIFLES.includes(weaponName)) return 'rifle';
  if (PISTOLS.includes(weaponName)) return 'pistol';
  if (SMGS.includes(weaponName)) return 'smg';
  if (HEAVIES.includes(weaponName)) return 'heavy';
  return 'other';
}

// ── Image URL resolvers ──────────────────────────────────────────────────────
// NOTE: PriceEmpire CDN (cs2-cdn.pricempire.com) blocks hotlinking with 503.
// Always prefer Steam CDN URLs which are publicly accessible.
function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('-')) return `${STEAM_CDN}/${imagePath}`;
  // For /panorama/ paths, fall back to PriceEmpire CDN (may not work for hotlinking)
  if (imagePath.startsWith('/panorama/')) {
    const withoutExt = imagePath.replace(/\.(png|avif|jpg)$/i, '');
    return `${PE_CDN}${withoutExt}_${PE_CDN_SIZE}.avif`;
  }
  return imagePath;
}

function buildPeCdnUrl(cdnPath) {
  if (!cdnPath) return null;
  if (cdnPath.startsWith('http')) return cdnPath;
  const withoutExt = cdnPath.replace(/\.(avif|png|jpg)$/i, '');
  return `${PE_CDN}${withoutExt}_${PE_CDN_SIZE}.avif`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function prefixToSlug(prefix) {
  return prefix.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function skinNameToSlug(weapon, skinName) {
  return `${prefixToSlug(weapon)}-${String(skinName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '')}`;
}

function simplifyRarity(rarity) {
  if (!rarity) return null; // Return null so caller can try fallback
  const r = rarity.toLowerCase();
  if (r.includes('consumer')) return 'Consumer';
  if (r.includes('industrial')) return 'Industrial';
  if (r.includes('mil-spec') || r.includes('mil spec')) return 'Mil-Spec';
  if (r.includes('restricted')) return 'Restricted';
  if (r.includes('classified')) return 'Classified';
  if (r.includes('covert')) return 'Covert';
  if (r.includes('contraband')) return 'Contraband';
  if (r.includes('extraordinary')) return 'Extraordinary';
  if (r.includes('rare') && r.includes('special')) return 'Extraordinary';
  return null;
}

// Infer rarity from price when API doesn't provide it
function inferRarityFromPrice(price, category) {
  if (category === 'knife' || category === 'glove') return 'Extraordinary';
  if (price <= 0) return 'Mil-Spec';
  if (price >= 500) return 'Covert';
  if (price >= 100) return 'Classified';
  if (price >= 20) return 'Restricted';
  if (price >= 3) return 'Mil-Spec';
  if (price >= 0.5) return 'Industrial';
  return 'Consumer';
}

function simplifyCategory(cat) {
  if (!cat) return 'other';
  const c = cat.toLowerCase();
  if (c.includes('rifle')) return 'rifle';
  if (c.includes('pistol')) return 'pistol';
  if (c.includes('smg') || c.includes('submachine')) return 'smg';
  if (c.includes('shotgun') || c.includes('machine gun') || c.includes('heavy')) return 'heavy';
  if (c.includes('knife') || c.includes('knives')) return 'knife';
  if (c.includes('glove')) return 'glove';
  return 'other';
}

function isRelevantItem(item) {
  const name = item.market_hash_name || item.name || '';
  if (!WEAR_ORDER.some(w => name.includes(`(${w})`))) return false;
  // Check both category and type fields (v4 API uses type)
  const cat = (item.category || item.type || '').toLowerCase();
  if (cat) {
    if (cat.includes('sticker') || cat.includes('graffiti') || cat.includes('music') ||
        cat.includes('agent') || cat.includes('patch') || cat.includes('pin') ||
        cat.includes('pass') || cat.includes('key') || cat.includes('container') ||
        cat.includes('tool') || cat.includes('collectible') || cat.includes('gift')) {
      return false;
    }
  }
  return true;
}

function getPhaseFromName(marketName) {
  // Match " - Phase 1", " - Ruby", " - Sapphire", " - Black Pearl", " - Emerald"
  // Phase suffix appears AFTER the wear condition: "★ Karambit | Doppler (Factory New) - Ruby"
  // But sometimes before: check both patterns
  for (const phase of ALL_PHASE_SUFFIXES) {
    if (marketName.includes(` - ${phase}`)) return phase;
  }
  return null;
}

function stripPhaseSuffix(name) {
  for (const phase of ALL_PHASE_SUFFIXES) {
    const idx = name.indexOf(` - ${phase}`);
    if (idx !== -1) return name.substring(0, idx);
  }
  return name;
}

function getBaseSkinName(marketName) {
  return stripPhaseSuffix(marketName)
    .replace(/\s*\(Factory New\)/, '')
    .replace(/\s*\(Minimal Wear\)/, '')
    .replace(/\s*\(Field-Tested\)/, '')
    .replace(/\s*\(Well-Worn\)/, '')
    .replace(/\s*\(Battle-Scarred\)/, '')
    .replace(/^StatTrak™\s+/, '')
    .replace(/^Souvenir\s+/, '')
    .replace(/^★\s+/, '')
    .trim();
}

function getPatternName(baseName) {
  const parts = baseName.split(' | ');
  return parts.length > 1 ? parts[1].trim() : baseName;
}

function getWeaponName(baseName) {
  const parts = baseName.split(' | ');
  return parts[0].trim();
}

// ══════════════════════════════════════════════════════════════════════════════
// FLEXIBLE PRICE EXTRACTION — handles multiple API response formats
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Extract per-provider prices from a single item's price data.
 *
 * PriceEmpire v4 actual format:
 *   item.prices = [
 *     { price: 1461, count: 246, updated_at: "...", provider_key: "buff163", meta: {...} },
 *     { price: 4340, count: 3,   updated_at: "...", provider_key: "dmarket", avg_7: 3, ... },
 *     ...
 *   ]
 *   price values are in CENTS (divide by 100 for USD)
 *   price can be 0 or null for providers with no data
 */
/**
 * Extract per-provider prices from a single item's price data.
 * Uses buff163 as primary reference (industry standard), then steam,
 * then falls back to median of all providers. Avoids using MAX which
 * can be inflated by certain marketplaces.
 */
function extractPrices(item) {
  const providers = {};
  const allPrices = [];

  const prices = item.prices;

  if (Array.isArray(prices)) {
    for (const p of prices) {
      const source = p.provider_key || p.source || p.provider || p.market || p.name || '';
      const rawPrice = p.price;
      if (!rawPrice || rawPrice <= 0) continue;
      const priceUSD = rawPrice / 100;
      if (source) {
        providers[source] = Math.round(priceUSD * 100) / 100;
      }
      allPrices.push(priceUSD);
    }
  } else if (prices && typeof prices === 'object' && !Array.isArray(prices)) {
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

  // Pick best price: prefer buff163, then steam, then median of all providers
  let bestPrice = 0;
  const PREFERRED_SOURCES = ['buff163', 'buff163_buy', 'steam', 'skinport', 'csfloat', 'csmoney'];
  for (const src of PREFERRED_SOURCES) {
    if (providers[src] && providers[src] > 0) {
      bestPrice = providers[src];
      break;
    }
  }

  // Fallback to median if no preferred source found
  if (bestPrice === 0 && allPrices.length > 0) {
    allPrices.sort((a, b) => a - b);
    const mid = Math.floor(allPrices.length / 2);
    bestPrice = allPrices.length % 2 === 0
      ? (allPrices[mid - 1] + allPrices[mid]) / 2
      : allPrices[mid];
  }

  // Last fallback: single price field on the item itself
  if (bestPrice === 0) {
    const singlePrice = item.price || item.suggested_price || 0;
    if (singlePrice > 0) {
      bestPrice = singlePrice / 100;
    }
  }

  return { bestPrice: Math.round(bestPrice * 100) / 100, providers };
}

// ── API Fetching ─────────────────────────────────────────────────────────────
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

async function fetchAllItems() {
  console.log('🔄 Fetching all items (metadata)...');
  try {
    const url = `${API_BASE}/items?app_id=730&language=en`;
    const res = await fetchWithRetry(url);
    if (!res || !res.ok) {
      console.log(`   ❌ Items endpoint failed: ${res?.status || 'no response'}`);
      return null;
    }
    const data = await res.json();
    console.log(`   ✅ Items response type: ${typeof data}, isArray: ${Array.isArray(data)}`);
    if (Array.isArray(data)) console.log(`   ✅ Got ${data.length} items`);
    else if (typeof data === 'object') console.log(`   ✅ Got object with ${Object.keys(data).length} keys`);

    // DEBUG: show first item structure
    const sample = Array.isArray(data) ? data[0] : data[Object.keys(data)[0]];
    if (sample) {
      console.log(`   📋 Sample item keys: ${Object.keys(sample).join(', ')}`);
    }
    return data;
  } catch (err) {
    console.log(`   ❌ Items fetch error: ${err.message}`);
    return null;
  }
}

async function fetchAllPrices() {
  const sourceOptions = [
    PRICE_SOURCES.join(','),
    CORE_SOURCES.join(','),
    'buff163,buff163_buy,steam,skinport,csfloat,csmoney',
    'buff163',
  ];

  for (const sources of sourceOptions) {
    console.log(`🔄 Fetching prices (${sources.split(',').length} sources)...`);
    try {
      const url = `${API_BASE}/items/prices?app_id=730&currency=USD&sources=${sources}`;
      const res = await fetchWithRetry(url);
      if (!res || !res.ok) {
        console.log(`   ⚠️ Prices failed with ${sources.split(',').length} sources (${res?.status}), trying fewer...`);
        continue;
      }
      const data = await res.json();

      // ── DEBUG: Detect response format ──────────────────────────────
      console.log(`   ✅ Prices response type: ${typeof data}, isArray: ${Array.isArray(data)}`);

      if (Array.isArray(data)) {
        console.log(`   ✅ Got ${data.length} price entries (ARRAY format)`);
        // Show first item structure
        if (data.length > 0) {
          const sample = data[0];
          console.log(`   📋 Sample price item keys: ${Object.keys(sample).join(', ')}`);
          console.log(`   📋 Sample item: ${JSON.stringify(sample).substring(0, 400)}`);
          // Check prices sub-field
          if (sample.prices) {
            console.log(`   📋 sample.prices type: ${typeof sample.prices}, isArray: ${Array.isArray(sample.prices)}`);
            if (Array.isArray(sample.prices) && sample.prices.length > 0) {
              console.log(`   📋 sample.prices[0]: ${JSON.stringify(sample.prices[0])}`);
            } else if (typeof sample.prices === 'object') {
              const pKeys = Object.keys(sample.prices);
              console.log(`   📋 sample.prices keys: ${pKeys.slice(0, 5).join(', ')}`);
              if (pKeys.length > 0) console.log(`   📋 sample.prices.${pKeys[0]}: ${JSON.stringify(sample.prices[pKeys[0]])}`);
            }
          }
          // Check for other price fields
          if (sample.price !== undefined) console.log(`   📋 sample.price = ${sample.price}`);
          if (sample.suggested_price !== undefined) console.log(`   📋 sample.suggested_price = ${sample.suggested_price}`);

          // Try extracting prices from first few items and report
          let withPrices = 0;
          const checkCount = Math.min(100, data.length);
          for (let i = 0; i < checkCount; i++) {
            const { bestPrice } = extractPrices(data[i]);
            if (bestPrice > 0) withPrices++;
          }
          console.log(`   📊 Price extraction test: ${withPrices}/${checkCount} items have prices > $0`);
        }
      } else if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        console.log(`   ✅ Got object with ${keys.length} keys (OBJECT format)`);
        if (keys.length > 0) {
          console.log(`   📋 First key: "${keys[0]}"`);
          console.log(`   📋 First value: ${JSON.stringify(data[keys[0]]).substring(0, 400)}`);
        }
      }

      return data;
    } catch (err) {
      console.log(`   ⚠️ Prices fetch error: ${err.message}, trying fewer sources...`);
      continue;
    }
  }

  console.log(`   ❌ All price source combinations failed`);
  return null;
}

async function fetchAllImages() {
  console.log('🔄 Fetching all item images...');
  try {
    const url = `${API_BASE}/items/images?app_id=730`;
    const res = await fetchWithRetry(url);
    if (!res || !res.ok) {
      console.log(`   ❌ Images endpoint failed: ${res?.status || 'no response'}`);
      return null;
    }
    const data = await res.json();
    const imageCount = data?.images ? Object.keys(data.images).length : 0;
    console.log(`   ✅ Got images for ${imageCount} items (CDN: ${data?.cdn_url || 'none'})`);
    return data;
  } catch (err) {
    console.log(`   ❌ Images fetch error: ${err.message}`);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PROCESSING — handles both ARRAY and OBJECT price data formats
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize the prices response into a Map<market_hash_name, item>
 * Handles:
 *  - Array of objects with market_hash_name field
 *  - Object keyed by market_hash_name
 */
function normalizePricesData(pricesData) {
  const map = new Map();
  if (!pricesData) return map;

  if (Array.isArray(pricesData)) {
    for (const item of pricesData) {
      const name = item.market_hash_name || item.name || item.marketHashName || '';
      if (name) map.set(name, item);
    }
  } else if (typeof pricesData === 'object') {
    for (const [name, val] of Object.entries(pricesData)) {
      if (typeof val === 'object' && val !== null) {
        map.set(name, { market_hash_name: name, ...val });
      } else if (typeof val === 'number') {
        // Simple { "name": price } format
        map.set(name, { market_hash_name: name, price: val });
      }
    }
  }

  return map;
}

function processData(itemsData, pricesData, imagesData) {
  // Build image lookup — store by both full name and base name (without wear/StatTrak)
  const imageLookup = new Map();
  if (imagesData?.images) {
    for (const [name, imgObj] of Object.entries(imagesData.images)) {
      // Prefer Steam CDN (public, no hotlink protection) over PriceEmpire CDN (blocks hotlinking)
      // NOTE: Some items return /panorama/ paths in the steam field — these are NOT valid web URLs
      const rawSteamUrl = imgObj.steam || null;
      const steamUrl = rawSteamUrl && rawSteamUrl.startsWith('http') ? rawSteamUrl
        : rawSteamUrl && rawSteamUrl.startsWith('-') ? `${STEAM_CDN}/${rawSteamUrl}` : null;
      const cdnPath = imgObj.cdn || null;
      const imageUrl = steamUrl || (cdnPath ? buildPeCdnUrl(cdnPath) : null);
      if (imageUrl) {
        imageLookup.set(name, imageUrl);
        // Also store by base name (without wear and StatTrak prefix) for lookup compatibility
        const baseName = getBaseSkinName(name);
        if (baseName !== name && !imageLookup.has(baseName)) {
          imageLookup.set(baseName, imageUrl);
        }
        // Also without StatTrak/Souvenir prefix
        const cleanBase = getBaseSkinName(name.replace(/^StatTrak™\s+/, '').replace(/^Souvenir\s+/, '').replace(/^★\s+/, ''));
        if (cleanBase !== name && !imageLookup.has(cleanBase)) {
          imageLookup.set(cleanBase, imageUrl);
        }
        // Store phase-specific base name (e.g., "Karambit | Doppler - Ruby")
        const phase = getPhaseFromName(name);
        if (phase) {
          const phaseBase = stripPhaseSuffix(name)
            .replace(/\s*\(Factory New\)/, '').replace(/\s*\(Minimal Wear\)/, '')
            .replace(/\s*\(Field-Tested\)/, '').replace(/\s*\(Well-Worn\)/, '')
            .replace(/\s*\(Battle-Scarred\)/, '')
            .replace(/^StatTrak™\s+/, '').replace(/^Souvenir\s+/, '').replace(/^★\s+/, '').trim();
          const phaseKey = `${phaseBase} - ${phase}`;
          if (!imageLookup.has(phaseKey)) imageLookup.set(phaseKey, imageUrl);
        }
      }
    }
    console.log(`   🖼️ Image lookup: ${imageLookup.size} items (with base name aliases)`);
  }

  // Normalize prices into a lookup Map
  const priceMap = normalizePricesData(pricesData);
  console.log(`   📊 Normalized price map: ${priceMap.size} items`);

  // Process items
  const skinMap = new Map();
  let skipped = 0, processed = 0, withPrices = 0;
  const itemsList = Array.isArray(itemsData) ? itemsData : [];

  for (const item of itemsList) {
    const marketName = item.market_hash_name || item.name || '';
    if (!marketName) continue;
    if (!isRelevantItem(item)) { skipped++; continue; }
    processed++;

    const isStatTrak = marketName.startsWith('StatTrak™ ');
    const isSouvenir = marketName.startsWith('Souvenir ');
    const baseName = getBaseSkinName(marketName);
    const weaponName = (typeof item.weapon?.name === 'string' ? item.weapon.name : null) || getWeaponName(baseName);
    const patternName = (typeof item.pattern === 'string' ? item.pattern : null) || getPatternName(baseName);
    const wear = WEAR_ORDER.find(w => marketName.includes(`(${w})`)) || null;
    if (!weaponName || !patternName || typeof patternName !== 'string') continue;

    const skinKey = `${weaponName}|${patternName}`;
    const weaponSlug = prefixToSlug(weaponName);

    // Get price data for this market_hash_name
    const priceItem = priceMap.get(marketName);
    const { bestPrice, providers } = priceItem ? extractPrices(priceItem) : { bestPrice: 0, providers: {} };
    if (bestPrice > 0) withPrices++;

    // Resolve image
    const baseClean = getBaseSkinName(marketName.replace(/^StatTrak™\s+/, '').replace(/^Souvenir\s+/, ''));
    let imageUrl = imageLookup.get(baseName) || imageLookup.get(baseClean) || null;
    if (!imageUrl && item.weapon?.image) imageUrl = resolveImageUrl(item.weapon.image);
    if (!imageUrl && priceItem?.image) imageUrl = resolveImageUrl(priceItem.image);

    // Extract trend/market metadata from priceItem (PriceEmpire fields)
    const trendData = priceItem ? {
      liquidity: parseFloat(priceItem.liquidity) || 0,
      volume7d: parseInt(priceItem.steam_last_7d) || 0,
      volume30d: parseInt(priceItem.steam_last_30d) || 0,
      volume90d: parseInt(priceItem.steam_last_90d) || 0,
      trades7d: parseInt(priceItem.trades_7d) || 0,
      trades30d: parseInt(priceItem.trades_30d) || 0,
      listingCount: parseInt(priceItem.count) || 0,
      rank: parseInt(priceItem.rank) || 0,
    } : null;

    // Extract description and flavor text
    const rawDesc = item.description || '';
    const descParts = rawDesc.split('\\n\\n');
    const mainDesc = (descParts[0] || '').replace(/<[^>]+>/g, '').trim();
    const flavorRaw = descParts.length > 1 ? descParts[descParts.length - 1] : '';
    const flavorText = flavorRaw.replace(/<\/?i>/g, '').replace(/<[^>]+>/g, '').trim() || null;

    if (!skinMap.has(skinKey)) {
      skinMap.set(skinKey, {
        weapon: weaponName, weaponSlug,
        name: patternName,
        slug: skinNameToSlug(weaponName, patternName),
        category: item.category ? simplifyCategory(item.category) : inferCategory(weaponName),
        rarity: simplifyRarity(item.rarity?.name) || inferRarityFromPrice(bestPrice, item.category ? simplifyCategory(item.category) : inferCategory(weaponName)),
        rarityColor: item.rarity?.color || null,
        collection: item.collections?.[0]?.name || null,
        image: imageUrl,
        statTrak: false, souvenir: false,
        minFloat: item.min_float ?? 0, maxFloat: item.max_float ?? 1,
        wears: {},
        statTrakWears: {},
        // Trend metadata (aggregated across wears)
        liquidity: trendData?.liquidity || 0,
        volume7d: trendData?.volume7d || 0,
        volume30d: trendData?.volume30d || 0,
        volume90d: trendData?.volume90d || 0,
        trades7d: trendData?.trades7d || 0,
        trades30d: trendData?.trades30d || 0,
        listingCount: trendData?.listingCount || 0,
        rank: trendData?.rank || 0,
        // Extended metadata
        description: mainDesc || null,
        flavorText: flavorText,
        finishStyle: item.style?.name || null,
        finishStyleDesc: item.style?.description || null,
        paintIndex: item.paint_index ?? null,
        releasedAt: item.released_at || null,
        legacyModel: item.legacy_model ?? null,
        team: item.team || null,
      });
    } else if (trendData) {
      // Aggregate trend data across wears — take the max/sum as appropriate
      const existing = skinMap.get(skinKey);
      existing.liquidity = Math.max(existing.liquidity, trendData.liquidity);
      existing.volume7d += trendData.volume7d;
      existing.volume30d += trendData.volume30d;
      existing.volume90d += trendData.volume90d;
      existing.trades7d += trendData.trades7d;
      existing.trades30d += trendData.trades30d;
      existing.listingCount += trendData.listingCount;
      existing.rank = Math.min(existing.rank || 99999, trendData.rank || 99999);
    }

    const skin = skinMap.get(skinKey);
    if (!skin.image && imageUrl) skin.image = imageUrl;
    if (isStatTrak) skin.statTrak = true;
    if (isSouvenir) skin.souvenir = true;

    if (wear && bestPrice > 0) {
      if (isStatTrak) {
        if (!skin.statTrakWears[wear] || bestPrice > skin.statTrakWears[wear].best) {
          skin.statTrakWears[wear] = { best: bestPrice, providers };
        }
      } else if (!isSouvenir) {
        if (!skin.wears[wear] || bestPrice > skin.wears[wear].best) {
          skin.wears[wear] = { best: bestPrice, providers };
        }
      }
    }
  }

  console.log(`   📦 Processed ${processed} items, ${withPrices} with prices, skipped ${skipped}`);
  console.log(`   🎨 Found ${skinMap.size} unique skins`);

  // ── Phase extraction pass: create Doppler/Gamma Doppler phase variants ──
  extractPhaseVariants(skinMap, priceMap, imageLookup);

  return convertSkinMapToOutput(skinMap);
}

// Fallback: build skins from prices data alone
function buildSkinsFromPricesOnly(pricesData, imagesData) {
  // Build image lookup with base name aliases
  const imageLookup = new Map();
  if (imagesData?.images) {
    for (const [name, imgObj] of Object.entries(imagesData.images)) {
      const rawSteamUrl = imgObj.steam || null;
      const steamUrl = rawSteamUrl && rawSteamUrl.startsWith('http') ? rawSteamUrl
        : rawSteamUrl && rawSteamUrl.startsWith('-') ? `${STEAM_CDN}/${rawSteamUrl}` : null;
      const cdnPath = imgObj.cdn || null;
      const imageUrl = steamUrl || (cdnPath ? buildPeCdnUrl(cdnPath) : null);
      if (imageUrl) {
        imageLookup.set(name, imageUrl);
        const baseName = getBaseSkinName(name);
        if (baseName !== name && !imageLookup.has(baseName)) imageLookup.set(baseName, imageUrl);
        const cleanBase = getBaseSkinName(name.replace(/^StatTrak™\s+/, '').replace(/^Souvenir\s+/, '').replace(/^★\s+/, ''));
        if (cleanBase !== name && !imageLookup.has(cleanBase)) imageLookup.set(cleanBase, imageUrl);
        // Store phase-specific base name
        const phase = getPhaseFromName(name);
        if (phase) {
          const phaseBase = stripPhaseSuffix(name)
            .replace(/\s*\(Factory New\)/, '').replace(/\s*\(Minimal Wear\)/, '')
            .replace(/\s*\(Field-Tested\)/, '').replace(/\s*\(Well-Worn\)/, '')
            .replace(/\s*\(Battle-Scarred\)/, '')
            .replace(/^StatTrak™\s+/, '').replace(/^Souvenir\s+/, '').replace(/^★\s+/, '').trim();
          const phaseKey = `${phaseBase} - ${phase}`;
          if (!imageLookup.has(phaseKey)) imageLookup.set(phaseKey, imageUrl);
        }
      }
    }
    console.log(`   🖼️ Images-only lookup: ${imageLookup.size} items (with aliases)`);
  }

  // Normalize prices
  const priceMap = normalizePricesData(pricesData);
  console.log(`   📊 Normalized price map: ${priceMap.size} entries`);

  const skinMap = new Map();
  let processed = 0, withPrices = 0;

  for (const [marketName, priceItem] of priceMap) {
    if (!WEAR_ORDER.some(w => marketName.includes(`(${w})`))) continue;

    const isStatTrak = marketName.startsWith('StatTrak™ ');
    const isSouvenir = marketName.startsWith('Souvenir ');
    const baseName = getBaseSkinName(marketName);
    const weaponName = getWeaponName(baseName);
    const patternName = getPatternName(baseName);
    const wear = WEAR_ORDER.find(w => marketName.includes(`(${w})`));
    if (!weaponName || !patternName || !wear) continue;

    const allPrefixes = [...WEAPON_PREFIXES, ...KNIFE_PREFIXES, ...GLOVE_PREFIXES];
    if (!allPrefixes.some(p => weaponName === p)) continue;
    processed++;

    const weaponSlug = prefixToSlug(weaponName);
    const { bestPrice, providers } = extractPrices(priceItem);
    if (bestPrice > 0) withPrices++;

    // Resolve image
    const baseClean = getBaseSkinName(marketName.replace(/^StatTrak™\s+/, '').replace(/^Souvenir\s+/, ''));
    let imageUrl = imageLookup.get(baseName) || imageLookup.get(baseClean) || null;
    if (!imageUrl && priceItem.image) imageUrl = resolveImageUrl(priceItem.image);

    const skinKey = `${weaponName}|${patternName}`;

    if (!skinMap.has(skinKey)) {
      skinMap.set(skinKey, {
        weapon: weaponName, weaponSlug,
        name: patternName,
        slug: skinNameToSlug(weaponName, patternName),
        category: inferCategory(weaponName),
        rarity: inferRarityFromPrice(bestPrice, inferCategory(weaponName)),
        rarityColor: null, collection: null,
        image: imageUrl,
        statTrak: false, souvenir: false,
        minFloat: 0, maxFloat: 1,
        wears: {},
        statTrakWears: {},
      });
    }

    const skin = skinMap.get(skinKey);
    if (!skin.image && imageUrl) skin.image = imageUrl;
    if (isStatTrak) skin.statTrak = true;
    if (isSouvenir) skin.souvenir = true;

    if (bestPrice > 0) {
      if (isStatTrak) {
        if (!skin.statTrakWears[wear] || bestPrice > skin.statTrakWears[wear].best) {
          skin.statTrakWears[wear] = { best: bestPrice, providers };
        }
      } else if (!isSouvenir) {
        if (!skin.wears[wear] || bestPrice > skin.wears[wear].best) {
          skin.wears[wear] = { best: bestPrice, providers };
        }
      }
    }
  }

  console.log(`   📦 Prices-only: ${processed} items processed, ${withPrices} with prices`);

  // ── Phase extraction pass: create Doppler/Gamma Doppler phase variants ──
  extractPhaseVariants(skinMap, priceMap, imageLookup);

  return convertSkinMapToOutput(skinMap);
}

// ══════════════════════════════════════════════════════════════════════════════
// DOPPLER PHASE EXTRACTION — scans priceMap for phase-specific entries
// ══════════════════════════════════════════════════════════════════════════════

function extractPhaseVariants(skinMap, priceMap, imageLookup) {
  let phaseCount = 0;
  const parentPhaseMap = new Map(); // parentKey -> [childKey, ...]

  for (const [marketName, priceItem] of priceMap) {
    const phase = getPhaseFromName(marketName);
    if (!phase) continue;
    if (!WEAR_ORDER.some(w => marketName.includes(`(${w})`))) continue;

    const isStatTrak = marketName.startsWith('StatTrak™ ');
    const isSouvenir = marketName.startsWith('Souvenir ');

    // Strip phase, wear, prefixes to get base name
    const baseName = getBaseSkinName(marketName);
    const weaponName = getWeaponName(baseName);
    const basePatternName = getPatternName(baseName); // e.g., "Doppler"
    const wear = WEAR_ORDER.find(w => marketName.includes(`(${w})`));
    if (!weaponName || !basePatternName || !wear) continue;

    const allPrefixes = [...WEAPON_PREFIXES, ...KNIFE_PREFIXES, ...GLOVE_PREFIXES];
    if (!allPrefixes.some(p => weaponName === p)) continue;

    // Phase variant skin key and name: "Doppler - Ruby"
    const phasePatternName = `${basePatternName} - ${phase}`;
    const skinKey = `${weaponName}|${phasePatternName}`;
    const parentKey = `${weaponName}|${basePatternName}`;
    const parentSkin = skinMap.get(parentKey);

    // Track parent → child relationships
    if (!parentPhaseMap.has(parentKey)) parentPhaseMap.set(parentKey, []);
    if (!parentPhaseMap.get(parentKey).includes(skinKey)) {
      parentPhaseMap.get(parentKey).push(skinKey);
    }

    const weaponSlug = prefixToSlug(weaponName);
    const { bestPrice, providers } = extractPrices(priceItem);

    // Resolve image — try phase-specific market name variations
    const phaseBaseName = stripPhaseSuffix(marketName)
      .replace(/\s*\(Factory New\)/, '').replace(/\s*\(Minimal Wear\)/, '')
      .replace(/\s*\(Field-Tested\)/, '').replace(/\s*\(Well-Worn\)/, '')
      .replace(/\s*\(Battle-Scarred\)/, '')
      .replace(/^StatTrak™\s+/, '').replace(/^Souvenir\s+/, '').replace(/^★\s+/, '').trim();
    // Try with phase suffix for image (some images are keyed by full name with phase)
    const phaseImageKey = `${phaseBaseName} - ${phase}`;
    let imageUrl = imageLookup.get(phaseImageKey) || imageLookup.get(phaseBaseName) || null;
    // Fall back to parent skin image
    if (!imageUrl && parentSkin?.image) imageUrl = parentSkin.image;

    if (!skinMap.has(skinKey)) {
      skinMap.set(skinKey, {
        weapon: weaponName, weaponSlug,
        name: phasePatternName,
        slug: skinNameToSlug(weaponName, phasePatternName),
        category: parentSkin?.category || inferCategory(weaponName),
        rarity: parentSkin?.rarity || inferRarityFromPrice(bestPrice, inferCategory(weaponName)),
        rarityColor: parentSkin?.rarityColor || null,
        collection: parentSkin?.collection || null,
        image: imageUrl,
        statTrak: parentSkin?.statTrak || false,
        souvenir: parentSkin?.souvenir || false,
        minFloat: parentSkin?.minFloat ?? 0,
        maxFloat: parentSkin?.maxFloat ?? 1,
        wears: {},
        statTrakWears: {},
        phase,
        parentSlug: parentSkin?.slug || skinNameToSlug(weaponName, basePatternName),
      });
      phaseCount++;
    }

    const skin = skinMap.get(skinKey);
    if (!skin.image && imageUrl) skin.image = imageUrl;
    if (isStatTrak) skin.statTrak = true;
    if (isSouvenir) skin.souvenir = true;

    if (bestPrice > 0) {
      if (isStatTrak) {
        if (!skin.statTrakWears[wear] || bestPrice > skin.statTrakWears[wear].best) {
          skin.statTrakWears[wear] = { best: bestPrice, providers };
        }
      } else if (!isSouvenir) {
        if (!skin.wears[wear] || bestPrice > skin.wears[wear].best) {
          skin.wears[wear] = { best: bestPrice, providers };
        }
      }
    }
  }

  // Backfill phaseVariants arrays on parent skins
  for (const [parentKey, childKeys] of parentPhaseMap) {
    const parentSkin = skinMap.get(parentKey);
    if (parentSkin) {
      parentSkin.phaseVariants = childKeys
        .map(ck => skinMap.get(ck)?.slug)
        .filter(Boolean)
        .sort();
    }
  }

  console.log(`   🔮 Created ${phaseCount} Doppler/Gamma Doppler phase variants`);
  console.log(`   🔗 ${parentPhaseMap.size} parent skins linked to phase variants`);
}

function convertSkinMapToOutput(skinMap) {
  const skins = [];
  const pricesByWeapon = {};
  let skinsWithPrices = 0;

  for (const [, skin] of skinMap) {
    const prices = [];
    for (const w of WEAR_ORDER) {
      if (skin.wears[w]) {
        prices.push({
          wear: w,
          price: Math.round(skin.wears[w].best * 100) / 100,
          providers: skin.wears[w].providers || {},
        });
      }
    }
    const statTrakPrices = [];
    if (skin.statTrakWears) {
      for (const w of WEAR_ORDER) {
        if (skin.statTrakWears[w]) {
          statTrakPrices.push({
            wear: w,
            price: Math.round(skin.statTrakWears[w].best * 100) / 100,
            providers: skin.statTrakWears[w].providers || {},
          });
        }
      }
    }
    if (prices.length > 0 || statTrakPrices.length > 0) skinsWithPrices++;

    const entry = {
      slug: skin.slug, weapon: skin.weapon, weaponSlug: skin.weaponSlug,
      name: skin.name, category: skin.category,
      rarity: skin.rarity, rarityColor: skin.rarityColor,
      collection: skin.collection, image: skin.image,
      statTrak: skin.statTrak, souvenir: skin.souvenir,
      minFloat: skin.minFloat, maxFloat: skin.maxFloat,
      prices,
    };
    if (statTrakPrices.length > 0) entry.statTrakPrices = statTrakPrices;
    // Add phase fields if present
    if (skin.phase) entry.phase = skin.phase;
    if (skin.parentSlug) entry.parentSlug = skin.parentSlug;
    if (skin.phaseVariants?.length) entry.phaseVariants = skin.phaseVariants;
    // Add trend/market metadata if present
    if (skin.liquidity > 0 || skin.volume7d > 0 || skin.volume30d > 0) {
      entry.liquidity = skin.liquidity || 0;
      entry.volume7d = skin.volume7d || 0;
      entry.volume30d = skin.volume30d || 0;
      entry.volume90d = skin.volume90d || 0;
      entry.trades7d = skin.trades7d || 0;
      entry.trades30d = skin.trades30d || 0;
      entry.listingCount = skin.listingCount || 0;
      entry.rank = skin.rank || 0;
    }
    // Extended metadata
    if (skin.description) entry.description = skin.description;
    if (skin.flavorText) entry.flavorText = skin.flavorText;
    if (skin.finishStyle) entry.finishStyle = skin.finishStyle;
    if (skin.finishStyleDesc) entry.finishStyleDesc = skin.finishStyleDesc;
    if (skin.paintIndex != null) entry.paintIndex = skin.paintIndex;
    if (skin.releasedAt) entry.releasedAt = skin.releasedAt;
    if (skin.legacyModel != null) entry.legacyModel = skin.legacyModel;
    if (skin.team) entry.team = skin.team;
    skins.push(entry);
  }

  skins.sort((a, b) => {
    const maxA = a.prices.length > 0 ? Math.max(...a.prices.map(p => p.price)) : 0;
    const maxB = b.prices.length > 0 ? Math.max(...b.prices.map(p => p.price)) : 0;
    if (maxA !== maxB) return maxB - maxA;
    return a.name.localeCompare(b.name);
  });

  for (const skin of skins) {
    for (const p of skin.prices) {
      if (!pricesByWeapon[skin.weaponSlug]) pricesByWeapon[skin.weaponSlug] = [];
      pricesByWeapon[skin.weaponSlug].push({
        name: `${skin.name} (${p.wear})`,
        fullName: `${skin.weapon} | ${skin.name} (${p.wear})`,
        price: p.price,
      });
    }
  }
  for (const slug in pricesByWeapon) {
    pricesByWeapon[slug].sort((a, b) => b.price - a.price);
  }

  console.log(`   📊 Output: ${skins.length} skins, ${skinsWithPrices} with prices`);
  return { skins, pricesByWeapon };
}

// ── Placeholder Data ─────────────────────────────────────────────────────────

function generatePlaceholderSkins() {
  return [
    { slug: 'ak-47-fire-serpent', weapon: 'AK-47', weaponSlug: 'ak-47', name: 'Fire Serpent', category: 'rifle', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Operation Bravo Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.76, prices: [{ wear: 'Factory New', price: 2800.00, providers: { buff163: 2750, steam: 2800 } }, { wear: 'Minimal Wear', price: 650.00, providers: { buff163: 640, steam: 650 } }, { wear: 'Field-Tested', price: 380.00, providers: { buff163: 375, steam: 380 } }], statTrakPrices: [{ wear: 'Factory New', price: 4200.00, providers: { buff163: 4100, steam: 4200 } }, { wear: 'Minimal Wear', price: 980.00, providers: { buff163: 960, steam: 980 } }, { wear: 'Field-Tested', price: 560.00, providers: { buff163: 550, steam: 560 } }] },
    { slug: 'ak-47-inheritance', weapon: 'AK-47', weaponSlug: 'ak-47', name: 'Inheritance', category: 'rifle', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Kilowatt Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.80, prices: [{ wear: 'Factory New', price: 171.83, providers: { buff163: 170, steam: 171.83 } }, { wear: 'Minimal Wear', price: 95.00, providers: { buff163: 93, steam: 95 } }], statTrakPrices: [{ wear: 'Factory New', price: 245.00, providers: { buff163: 240, steam: 245 } }, { wear: 'Minimal Wear', price: 135.00, providers: { buff163: 132, steam: 135 } }] },
    { slug: 'ak-47-vulcan', weapon: 'AK-47', weaponSlug: 'ak-47', name: 'Vulcan', category: 'rifle', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Operation Breakout Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.80, prices: [{ wear: 'Factory New', price: 85.00, providers: { buff163: 83, steam: 85 } }, { wear: 'Minimal Wear', price: 45.00, providers: { buff163: 44, steam: 45 } }] },
    { slug: 'awp-dragon-lore', weapon: 'AWP', weaponSlug: 'awp', name: 'Dragon Lore', category: 'rifle', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Cobblestone Collection', image: null, statTrak: false, souvenir: true, minFloat: 0.00, maxFloat: 0.70, prices: [{ wear: 'Factory New', price: 7500.00, providers: { buff163: 7400, steam: 7500 } }] },
    { slug: 'awp-gungnir', weapon: 'AWP', weaponSlug: 'awp', name: 'Gungnir', category: 'rifle', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Norse Collection', image: null, statTrak: false, souvenir: false, minFloat: 0.00, maxFloat: 0.80, prices: [{ wear: 'Factory New', price: 8500.00, providers: { buff163: 8400, steam: 8500 } }] },
    { slug: 'awp-printstream', weapon: 'AWP', weaponSlug: 'awp', name: 'Printstream', category: 'rifle', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Operation Riptide Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.80, prices: [{ wear: 'Factory New', price: 185.00, providers: { buff163: 182, skinport: 185 } }] },
    { slug: 'm4a4-howl', weapon: 'M4A4', weaponSlug: 'm4a4', name: 'Howl', category: 'rifle', rarity: 'Contraband', rarityColor: '#e4ae39', collection: 'Huntsman Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.40, prices: [{ wear: 'Factory New', price: 6500.00, providers: { buff163: 6400, steam: 6500 } }] },
    { slug: 'm4a1-s-printstream', weapon: 'M4A1-S', weaponSlug: 'm4a1-s', name: 'Printstream', category: 'rifle', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Operation Riptide Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.80, prices: [{ wear: 'Factory New', price: 85.00, providers: { buff163: 83, skinport: 85 } }] },
    { slug: 'desert-eagle-blaze', weapon: 'Desert Eagle', weaponSlug: 'desert-eagle', name: 'Blaze', category: 'pistol', rarity: 'Restricted', rarityColor: '#8847ff', collection: 'Dust 2 Collection', image: null, statTrak: false, souvenir: false, minFloat: 0.00, maxFloat: 0.08, prices: [{ wear: 'Factory New', price: 350.00, providers: { buff163: 345, steam: 350 } }] },
    { slug: 'usp-s-kill-confirmed', weapon: 'USP-S', weaponSlug: 'usp-s', name: 'Kill Confirmed', category: 'pistol', rarity: 'Covert', rarityColor: '#eb4b4b', collection: 'Shadow Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.70, prices: [{ wear: 'Factory New', price: 62.00, providers: { buff163: 60, steam: 62 } }] },
    { slug: 'glock-18-fade', weapon: 'Glock-18', weaponSlug: 'glock-18', name: 'Fade', category: 'pistol', rarity: 'Restricted', rarityColor: '#8847ff', collection: 'Assault Collection', image: null, statTrak: false, souvenir: false, minFloat: 0.00, maxFloat: 0.08, prices: [{ wear: 'Factory New', price: 420.00, providers: { buff163: 415, steam: 420 } }] },
    { slug: 'butterfly-knife-fade', weapon: 'Butterfly Knife', weaponSlug: 'butterfly-knife', name: 'Fade', category: 'knife', rarity: 'Extraordinary', rarityColor: '#e4ae39', collection: 'Operation Breakout Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.08, prices: [{ wear: 'Factory New', price: 2200.00, providers: { buff163: 2150, csmoney: 2200 } }] },
    { slug: 'karambit-fade', weapon: 'Karambit', weaponSlug: 'karambit', name: 'Fade', category: 'knife', rarity: 'Extraordinary', rarityColor: '#e4ae39', collection: 'Chroma Case', image: null, statTrak: true, souvenir: false, minFloat: 0.00, maxFloat: 0.08, prices: [{ wear: 'Factory New', price: 1650.00, providers: { buff163: 1620, csmoney: 1650 } }] },
    { slug: 'ak-47-redline', weapon: 'AK-47', weaponSlug: 'ak-47', name: 'Redline', category: 'rifle', rarity: 'Classified', rarityColor: '#d32ce6', collection: 'Operation Phoenix Case', image: null, statTrak: true, souvenir: false, minFloat: 0.10, maxFloat: 0.70, prices: [{ wear: 'Minimal Wear', price: 28.50, providers: { buff163: 27, steam: 28.50 } }, { wear: 'Field-Tested', price: 14.20, providers: { buff163: 13.80, steam: 14.20 } }], statTrakPrices: [{ wear: 'Minimal Wear', price: 52.00, providers: { buff163: 50, steam: 52 } }, { wear: 'Field-Tested', price: 30.33, providers: { buff163: 29.50, steam: 30.33 } }] },
  ];
}

function generatePlaceholderPrices() {
  const weapons = {};
  const skins = generatePlaceholderSkins();
  for (const skin of skins) {
    if (!weapons[skin.weaponSlug]) weapons[skin.weaponSlug] = [];
    for (const p of skin.prices) {
      weapons[skin.weaponSlug].push({
        name: `${skin.name} (${p.wear})`,
        fullName: `${skin.weapon} | ${skin.name} (${p.wear})`,
        price: p.price,
      });
    }
  }
  for (const slug in weapons) weapons[slug].sort((a, b) => b.price - a.price);
  return { fetchedAt: new Date().toISOString(), source: 'placeholder', weapons };
}

// ── Write final data ─────────────────────────────────────────────────────────
function writeFinalData(skins, pricesByWeapon) {
  writeFileSync(PRICES_PATH, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: 'pricempire',
    weapons: pricesByWeapon,
  }, null, 2));

  writeFileSync(SKINS_PATH, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    source: 'pricempire',
    totalSkins: skins.length,
    marketplaces: MARKETPLACE_INFO,
    skins,
  }, null, 2));

  const weaponCount = Object.keys(pricesByWeapon).length;
  const priceEntries = Object.values(pricesByWeapon).reduce((s, a) => s + a.length, 0);
  const withImg = skins.filter(s => s.image).length;
  const withPrices = skins.filter(s => s.prices.length > 0).length;
  console.log(`\n✅ Done!`);
  console.log(`   📦 ${skins.length} unique skins (${withPrices} with prices)`);
  console.log(`   💰 ${priceEntries} price entries across ${weaponCount} weapons`);
  console.log(`   🖼️ Images: ${withImg}/${skins.length} (${Math.round(withImg / skins.length * 100)}%)`);

  const byCat = {};
  for (const s of skins) byCat[s.category] = (byCat[s.category] || 0) + 1;
  console.log(`   📊 Categories: ${Object.entries(byCat).map(([k, v]) => `${k}=${v}`).join(', ')}`);
}

// ── Price snapshot (for "Best Deal of the Day" comparison) ──────────────────
function snapshotPreviousPrices() {
  if (!existsSync(SKINS_PATH)) {
    console.log('📸 No existing skins-data.json — skipping price snapshot');
    return;
  }

  // Only create a new snapshot if none exists or the existing one is >20 hours old
  if (existsSync(PRICES_PREV_PATH)) {
    try {
      const stat = statSync(PRICES_PREV_PATH);
      const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
      if (ageHours < 20) {
        console.log(`📸 Price snapshot exists (${ageHours.toFixed(1)}h old) — keeping it`);
        return;
      }
    } catch { /* proceed to create new snapshot */ }
  }

  try {
    const current = JSON.parse(readFileSync(SKINS_PATH, 'utf8'));
    const snapshot = {};
    for (const skin of (current.skins || [])) {
      if (!skin.prices || skin.prices.length === 0) continue;
      const lowestPrice = Math.min(...skin.prices.map(p => p.price));
      if (lowestPrice > 0) {
        snapshot[skin.slug] = {
          price: lowestPrice,
          providers: skin.prices[0]?.providers || {},
        };
      }
    }
    writeFileSync(PRICES_PREV_PATH, JSON.stringify({
      snapshotAt: new Date().toISOString(),
      fetchedAt: current.fetchedAt || '',
      prices: snapshot,
    }, null, 2));
    console.log(`📸 Saved price snapshot (${Object.keys(snapshot).length} skins) → prices-previous.json`);
  } catch (err) {
    console.log(`📸 Failed to snapshot prices: ${err.message}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(dirname(PRICES_PATH), { recursive: true });

  // Snapshot current prices before fetching new ones
  snapshotPreviousPrices();

  if (!API_KEY) {
    console.log('⚠️  No PRICEMPIRE_API_KEY set — generating placeholder data.\n');
    writeFileSync(PRICES_PATH, JSON.stringify(generatePlaceholderPrices(), null, 2));
    const placeholderSkins = generatePlaceholderSkins();
    writeFileSync(SKINS_PATH, JSON.stringify({
      fetchedAt: new Date().toISOString(), source: 'placeholder',
      totalSkins: placeholderSkins.length, marketplaces: MARKETPLACE_INFO, skins: placeholderSkins,
    }, null, 2));
    console.log(`📦 Wrote ${placeholderSkins.length} placeholder skins`);
    return;
  }

  console.log('🔑 API key found, fetching from PriceEmpire...\n');

  try {
    const [itemsData, pricesData, imagesData] = await Promise.all([
      fetchAllItems().catch(e => { console.log(`   ❌ Items error: ${e.message}`); return null; }),
      fetchAllPrices().catch(e => { console.log(`   ❌ Prices error: ${e.message}`); return null; }),
      fetchAllImages().catch(e => { console.log(`   ❌ Images error: ${e.message}`); return null; }),
    ]);

    if (!pricesData) {
      throw new Error('Prices endpoint failed — no price data available');
    }

    let result;
    if (!itemsData) {
      console.log('\n⚠️  Items endpoint failed — using prices-only mode');
      result = buildSkinsFromPricesOnly(pricesData, imagesData);
    } else {
      result = processData(itemsData, pricesData, imagesData);
    }

    writeFinalData(result.skins, result.pricesByWeapon);

  } catch (err) {
    console.error(`\n❌ Fatal error: ${err.message}`);
    console.log('   Falling back to placeholder data...\n');
    writeFileSync(PRICES_PATH, JSON.stringify(generatePlaceholderPrices(), null, 2));
    const placeholderSkins = generatePlaceholderSkins();
    writeFileSync(SKINS_PATH, JSON.stringify({
      fetchedAt: new Date().toISOString(), source: 'placeholder',
      totalSkins: placeholderSkins.length, marketplaces: MARKETPLACE_INFO, skins: placeholderSkins,
    }, null, 2));
    console.log(`📦 Wrote fallback placeholder data`);
  }
}

main().catch(console.error);
