/**
 * PriceEmpire Sticker Fetcher — Multi-Marketplace + Images
 *
 * Fetches CS2 sticker data from PriceEmpire v4 API:
 *   1. GET /v4/paid/items          → Item metadata (filter for stickers)
 *   2. GET /v4/paid/items/prices   → Multi-provider prices
 *   3. GET /v4/paid/items/images   → Image CDN paths
 *
 * Auth: Authorization: Bearer YOUR_API_KEY
 * Env:  PRICEMPIRE_API_KEY
 *
 * Output: src/lib/stickers-data.json
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'stickers-data.json');

const API_BASE = 'https://api.pricempire.com/v4/paid';
const AUTH_HEADER = { 'Authorization': `Bearer ${API_KEY}` };

// ── CDN ──────────────────────────────────────────────────────────────────────
const PE_CDN = 'https://cs2-cdn.pricempire.com';
const PE_CDN_SIZE = 300;
const STEAM_CDN = 'https://community.steamstatic.com/economy/image';

// ── Marketplace Sources ──────────────────────────────────────────────────────
const PRICE_SOURCES = [
  'buff163', 'buff163_buy', 'steam', 'skinport', 'csmoney', 'csmoney2',
  'dmarket', 'bitskins', 'lis-skins', 'tradeit', 'youpin',
  'shadowpay', 'skinswap', 'csfloat', 'waxpeer', 'skinbid',
  'gamerpay', 'lootfarm', 'swap_gg', 'mannco', 'csdeals', 'skinbaron',
  'haloskins', 'c5game', 'igxe', 'lootbear',
];
const CORE_SOURCES = ['buff163', 'buff163_buy', 'steam', 'skinport', 'csmoney', 'dmarket', 'bitskins', 'csfloat', 'waxpeer'];

// ── Sticker variant types ────────────────────────────────────────────────────
const VARIANT_TYPES = ['Lenticular', 'Gold', 'Glitter', 'Foil', 'Holo', 'Paper'];
// Order matters: check most specific first

// ── Known tournament names (for parsing) ─────────────────────────────────────
const TOURNAMENT_PATTERNS = [
  // Format: "Event City Year" — match from the pipe separator onwards
  /\|\s*(.+?\d{4})\s*$/,        // "| Copenhagen 2024"
  /\|\s*(.+?Major\s+\d{4})\s*$/, // "| PGL Major Copenhagen 2024"
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(str) {
  return str.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/g, '')
    .replace(/^-+/g, '');
}

function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('-')) return `${STEAM_CDN}/${imagePath}`;
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

/**
 * Check if an item is a sticker.
 * Stickers have market_hash_name starting with "Sticker | "
 */
function isStickerItem(item) {
  const name = item.market_hash_name || item.name || '';
  return name.startsWith('Sticker | ');
}

/**
 * Parse a sticker market_hash_name into structured data.
 *
 * Formats:
 *   "Sticker | NAVI (Holo) | Copenhagen 2024"
 *   "Sticker | Chicken Lover"
 *   "Sticker | s1mple (Gold) | Copenhagen 2024"
 *   "Sticker | Copenhagen 2024"
 *   "Sticker | Team Spirit (Glitter) | Austin 2025"
 */
function parseStickerName(marketName) {
  // Remove "Sticker | " prefix
  const raw = marketName.replace(/^Sticker \| /, '');

  // Split on " | " to get parts
  const parts = raw.split(' | ');

  // Extract variant from parenthetical in the first part
  let variant = 'Paper';
  let nameWithoutVariant = parts[0];
  for (const v of VARIANT_TYPES) {
    const pattern = new RegExp(`\\(${v}\\)`, 'i');
    if (pattern.test(nameWithoutVariant)) {
      variant = v;
      nameWithoutVariant = nameWithoutVariant.replace(pattern, '').trim();
      break;
    }
  }

  // Tournament/event is the last part if there are 2+ parts
  let tournament = null;
  if (parts.length >= 2) {
    tournament = parts[parts.length - 1].trim();
  }

  // Determine type
  let type = 'community';
  if (tournament) {
    // Check if it's a tournament sticker
    if (/\d{4}/.test(tournament)) {
      type = 'tournament';
    }
  }

  // Team detection: if there's a tournament, the first part is typically team/player name
  let team = null;
  if (type === 'tournament' && nameWithoutVariant) {
    team = nameWithoutVariant;
  }

  // Display name: remove the "Sticker | " prefix but keep everything else
  const displayName = raw;

  return {
    displayName,
    stickerLabel: nameWithoutVariant,
    variant,
    tournament,
    team,
    type,
  };
}

/**
 * Extract per-provider prices from a single item's price data.
 * Same logic as fetch-prices.mjs but simplified for single-price items.
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
      if (source) providers[source] = Math.round(priceUSD * 100) / 100;
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

  // Pick best price: prefer buff163, then steam, then median
  let bestPrice = 0;
  const PREFERRED = ['buff163', 'buff163_buy', 'steam', 'skinport', 'csfloat', 'csmoney'];
  for (const src of PREFERRED) {
    if (providers[src] && providers[src] > 0) {
      bestPrice = providers[src];
      break;
    }
  }

  if (bestPrice === 0 && allPrices.length > 0) {
    allPrices.sort((a, b) => a - b);
    const mid = Math.floor(allPrices.length / 2);
    bestPrice = allPrices.length % 2 === 0
      ? (allPrices[mid - 1] + allPrices[mid]) / 2
      : allPrices[mid];
  }

  if (bestPrice === 0) {
    const singlePrice = item.price || item.suggested_price || 0;
    if (singlePrice > 0) bestPrice = singlePrice / 100;
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
    if (Array.isArray(data)) console.log(`   ✅ Got ${data.length} total items`);
    return data;
  } catch (err) {
    console.log(`   ❌ Items fetch error: ${err.message}`);
    return null;
  }
}

async function fetchAllPrices() {
  const sourceOptions = [PRICE_SOURCES.join(','), CORE_SOURCES.join(','), 'buff163'];

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
      if (Array.isArray(data)) console.log(`   ✅ Got ${data.length} price entries`);
      else if (typeof data === 'object') console.log(`   ✅ Got ${Object.keys(data).length} price entries`);
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
    console.log(`   ✅ Got images for ${imageCount} items`);
    return data;
  } catch (err) {
    console.log(`   ❌ Images fetch error: ${err.message}`);
    return null;
  }
}

// ── Normalize prices into a Map ──────────────────────────────────────────────
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
        map.set(name, { market_hash_name: name, price: val });
      }
    }
  }
  return map;
}

// ── Main Processing ──────────────────────────────────────────────────────────
function processStickers(itemsData, pricesData, imagesData) {
  // Build image lookup
  const imageLookup = new Map();
  if (imagesData?.images) {
    for (const [name, imgObj] of Object.entries(imagesData.images)) {
      const rawSteamUrl = imgObj.steam || null;
      const steamUrl = rawSteamUrl && rawSteamUrl.startsWith('http') ? rawSteamUrl
        : rawSteamUrl && rawSteamUrl.startsWith('-') ? `${STEAM_CDN}/${rawSteamUrl}` : null;
      const cdnPath = imgObj.cdn || null;
      const imageUrl = steamUrl || (cdnPath ? buildPeCdnUrl(cdnPath) : null);
      if (imageUrl) imageLookup.set(name, imageUrl);
    }
    console.log(`   🖼️ Image lookup: ${imageLookup.size} items`);
  }

  // Normalize prices
  const priceMap = normalizePricesData(pricesData);
  console.log(`   📊 Normalized price map: ${priceMap.size} items`);

  // Process items — filter for stickers only
  const stickers = [];
  const slugSet = new Set();
  let found = 0, withPrices = 0, withImages = 0;

  const itemsList = Array.isArray(itemsData) ? itemsData : [];

  for (const item of itemsList) {
    const marketName = item.market_hash_name || item.name || '';
    if (!marketName || !isStickerItem(item)) continue;
    found++;

    const parsed = parseStickerName(marketName);

    // Get price data
    const priceItem = priceMap.get(marketName);
    const { bestPrice, providers } = priceItem ? extractPrices(priceItem) : { bestPrice: 0, providers: {} };
    if (bestPrice > 0) withPrices++;

    // Get image
    let imageUrl = imageLookup.get(marketName) || null;
    if (!imageUrl && item.image) imageUrl = resolveImageUrl(item.image);
    if (!imageUrl && priceItem?.image) imageUrl = resolveImageUrl(priceItem.image);
    if (imageUrl) withImages++;

    // Extract trend data
    const trendData = priceItem ? {
      liquidity: parseFloat(priceItem.liquidity) || 0,
      volume7d: parseInt(priceItem.steam_last_7d) || 0,
      trades7d: parseInt(priceItem.trades_7d) || 0,
      listingCount: parseInt(priceItem.count) || 0,
    } : {};

    // Build slug
    let slug = toSlug(parsed.displayName);
    // Ensure unique
    if (slugSet.has(slug)) {
      let i = 2;
      while (slugSet.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }
    slugSet.add(slug);

    // Rarity from API
    const rarity = item.rarity?.name || null;

    // Collection from API
    const collection = item.collections?.[0]?.name || null;

    stickers.push({
      slug,
      name: parsed.displayName,
      image: imageUrl,
      variant: parsed.variant,
      tournament: parsed.tournament,
      team: parsed.team,
      type: parsed.type,
      rarity,
      collection,
      price: bestPrice,
      providers: Object.keys(providers).length > 0 ? providers : undefined,
      liquidity: trendData.liquidity || undefined,
      volume7d: trendData.volume7d || undefined,
      trades7d: trendData.trades7d || undefined,
      listingCount: trendData.listingCount || undefined,
    });
  }

  // Also scan priceMap for stickers not in items endpoint
  let priceOnlyCount = 0;
  for (const [marketName, priceItem] of priceMap) {
    if (!marketName.startsWith('Sticker | ')) continue;
    // Skip if already processed from items
    const existingSlug = toSlug(marketName.replace(/^Sticker \| /, ''));
    if (slugSet.has(existingSlug)) continue;

    priceOnlyCount++;
    const parsed = parseStickerName(marketName);
    const { bestPrice, providers } = extractPrices(priceItem);
    if (bestPrice <= 0) continue; // Skip stickers with no price data

    let imageUrl = imageLookup.get(marketName) || null;
    if (!imageUrl && priceItem.image) imageUrl = resolveImageUrl(priceItem.image);
    if (imageUrl) withImages++;
    if (bestPrice > 0) withPrices++;

    const trendData = {
      liquidity: parseFloat(priceItem.liquidity) || 0,
      volume7d: parseInt(priceItem.steam_last_7d) || 0,
      trades7d: parseInt(priceItem.trades_7d) || 0,
      listingCount: parseInt(priceItem.count) || 0,
    };

    let slug = toSlug(parsed.displayName);
    if (slugSet.has(slug)) {
      let i = 2;
      while (slugSet.has(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    }
    slugSet.add(slug);

    stickers.push({
      slug,
      name: parsed.displayName,
      image: imageUrl,
      variant: parsed.variant,
      tournament: parsed.tournament,
      team: parsed.team,
      type: parsed.type,
      rarity: null,
      collection: null,
      price: bestPrice,
      providers: Object.keys(providers).length > 0 ? providers : undefined,
      liquidity: trendData.liquidity || undefined,
      volume7d: trendData.volume7d || undefined,
      trades7d: trendData.trades7d || undefined,
      listingCount: trendData.listingCount || undefined,
    });
  }

  // Sort by price descending (most valuable first)
  stickers.sort((a, b) => b.price - a.price);

  // Stats
  const tournaments = [...new Set(stickers.filter(s => s.tournament).map(s => s.tournament))];
  const teams = [...new Set(stickers.filter(s => s.team).map(s => s.team))];
  const variants = [...new Set(stickers.map(s => s.variant))];

  console.log(`\n📊 Sticker Processing Summary:`);
  console.log(`   Found in items endpoint: ${found}`);
  console.log(`   Found in prices only: ${priceOnlyCount}`);
  console.log(`   Total stickers: ${stickers.length}`);
  console.log(`   With prices: ${withPrices}`);
  console.log(`   With images: ${withImages}`);
  console.log(`   Tournaments: ${tournaments.length}`);
  console.log(`   Teams: ${teams.length}`);
  console.log(`   Variants: ${variants.join(', ')}`);

  return {
    fetchedAt: new Date().toISOString(),
    source: 'pricempire',
    totalStickers: stickers.length,
    tournaments: tournaments.sort(),
    teams: teams.sort(),
    variants: variants.sort(),
    stickers,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎯 CSDB.gg Sticker Fetcher\n');

  if (!API_KEY) {
    console.error('❌ PRICEMPIRE_API_KEY not set. Usage:');
    console.error('   PRICEMPIRE_API_KEY=your_key node scripts/fetch-stickers.mjs');
    process.exit(1);
  }

  const [itemsData, pricesData, imagesData] = await Promise.all([
    fetchAllItems(),
    fetchAllPrices(),
    fetchAllImages(),
  ]);

  if (!itemsData && !pricesData) {
    console.error('❌ Failed to fetch both items and prices. Aborting.');
    process.exit(1);
  }

  console.log('\n🔧 Processing sticker data...');
  const output = processStickers(itemsData, pricesData, imagesData);

  // Write output
  const json = JSON.stringify(output, null, 2);
  writeFileSync(OUTPUT_PATH, json);
  console.log(`\n✅ Written ${output.totalStickers} stickers to ${OUTPUT_PATH}`);
  console.log(`   File size: ${(Buffer.byteLength(json) / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
