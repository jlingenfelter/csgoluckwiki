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

// ── Souvenir package market names ─────────────────────────────────────────────
// Generated from the same tournament × map data as containers.ts
const SOUVENIR_TOURNAMENTS = [
  { t: 'Budapest 2025',               maps: ['Train','Nuke','Ancient','Dust II','Overpass','Mirage','Inferno'] },
  { t: 'Austin 2025',                 maps: ['Train','Nuke','Ancient','Dust II','Anubis','Mirage','Inferno'] },
  { t: 'Shanghai 2024',               maps: ['Vertigo','Nuke','Ancient','Dust II','Anubis','Mirage','Inferno'] },
  { t: 'Copenhagen 2024',             maps: ['Vertigo','Nuke','Ancient','Overpass','Anubis','Mirage','Inferno'] },
  { t: 'Paris 2023',                  maps: ['Vertigo','Nuke','Ancient','Overpass','Anubis','Mirage','Inferno'] },
  { t: 'Rio 2022',                    maps: ['Vertigo','Nuke','Ancient','Overpass','Dust II','Mirage','Inferno'] },
  { t: 'Antwerp 2022',                maps: ['Vertigo','Nuke','Ancient','Overpass','Dust II','Mirage','Inferno'] },
  { t: 'Stockholm 2021',              maps: ['Vertigo','Nuke','Ancient','Overpass','Dust II','Mirage','Inferno'] },
  { t: 'Berlin 2019',                 maps: ['Vertigo','Nuke','Train','Overpass','Dust II','Mirage','Inferno'] },
  { t: 'Katowice 2019',               maps: ['Nuke','Train','Cache','Overpass','Dust II','Mirage','Inferno'] },
  { t: 'London 2018',                 maps: ['Nuke','Train','Cache','Overpass','Dust II','Mirage','Inferno'] },
  { t: 'Boston 2018',                 maps: ['Nuke','Train','Cache','Overpass','Cobblestone','Mirage','Inferno'] },
  { t: 'Krakow 2017',                 maps: ['Nuke','Train','Cache','Overpass','Cobblestone','Mirage','Inferno'] },
  { t: 'Atlanta 2017',                maps: ['Nuke','Train','Cache','Overpass','Cobblestone','Mirage','Dust II'] },
  { t: 'Cologne 2016',                maps: ['Nuke','Train','Cache','Overpass','Cobblestone','Mirage','Dust II'] },
  { t: 'MLG Columbus 2016',           maps: ['Nuke','Train','Cache','Overpass','Cobblestone','Inferno','Mirage','Dust II'] },
  { t: 'DreamHack Cluj-Napoca 2015',  maps: ['Train','Cache','Overpass','Cobblestone','Inferno','Mirage','Dust II'] },
  { t: 'ESL One Cologne 2015',        maps: ['Train','Cache','Overpass','Cobblestone','Inferno','Mirage','Dust II'] },
  { t: 'ESL One Katowice 2015',       maps: ['Overpass','Cobblestone','Cache','Nuke','Mirage','Inferno','Dust II'] },
  { t: 'DreamHack 2014',              maps: ['Overpass','Cobblestone','Cache','Nuke','Mirage','Inferno','Dust II'] },
  { t: 'ESL One Cologne 2014',        maps: ['Overpass','Cobblestone','Cache','Nuke','Mirage','Inferno','Dust II'] },
];

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Add souvenir packages to CASE_NAMES
for (const { t, maps } of SOUVENIR_TOURNAMENTS) {
  for (const map of maps) {
    const name = `${t} ${map} Souvenir Package`;
    CASE_NAMES[toSlug(name)] = name;
  }
}

// ── Sticker capsule market names ──────────────────────────────────────────────
const STICKER_CAPSULE_NAMES = [
  'Warhammer 40,000 Sticker Capsule',
  'Warhammer 40,000 Traitor Astartes Sticker Capsule',
  'Warhammer 40,000 Adeptus Astartes Sticker Capsule',
  'Warhammer 40,000 Imperium Sticker Capsule',
  'Warhammer 40,000 Xenos Sticker Capsule',
  'Craft Sticker Capsule', 'Elemental Craft Sticker Capsule',
  'Feral Predators Capsule', 'Boardroom Sticker Capsule',
  'High Noon Capsule', 'Sans Titre Capsule', 'Ambush Sticker Capsule',
  '10 Year Birthday Sticker Capsule', 'Slid3 Capsule', 'Pinups Capsule',
  'Poorly Drawn Capsule', 'Skill Groups Capsule', 'Metal Capsule',
  'Halo Capsule', 'Half-Life: Alyx Sticker Capsule',
  'Shattered Web Sticker Capsule', 'X-Ray P250 Package',
  'Broken Fang Sticker Collection', 'Operation Riptide Sticker Collection',
  'Watercolor Capsule', 'CS20 Sticker Capsule', 'Bestiary Capsule',
  'Chicken Capsule', 'Perfect World Sticker Capsule 1',
  'Perfect World Sticker Capsule 2', 'Enfu Sticker Capsule',
  'Sugarface Capsule', 'Team Roles Capsule', 'Community Sticker Capsule 1',
  'Sticker Capsule 2', 'CS:GO Sticker Capsule',
];

// Tournament sticker capsules
const STICKER_TOURNAMENT_TIERS = [
  { t: 'Budapest 2025',   tiers: ['Contenders','Challengers','Legends'] },
  { t: 'Austin 2025',     tiers: ['Contenders','Challengers','Legends'] },
  { t: 'Shanghai 2024',   tiers: ['Contenders','Challengers','Legends'] },
  { t: 'Copenhagen 2024', tiers: ['Contenders','Challengers','Legends'] },
  { t: 'Paris 2023',      tiers: ['Contenders','Challengers','Legends'] },
  { t: 'Rio 2022',        tiers: ['Contenders','Challengers','Legends'] },
  { t: 'Antwerp 2022',    tiers: ['Contenders','Challengers','Legends'] },
  { t: 'Stockholm 2021',  tiers: ['Finalists','Champions'] },
  { t: 'Berlin 2019',     tiers: ['Returning Challengers','Minor Challengers','Legends'] },
  { t: 'Katowice 2019',   tiers: ['Returning Challengers','Minor Challengers','Legends'] },
  { t: 'London 2018',     tiers: ['Returning Challengers','Minor Challengers','Legends'] },
];

for (const name of STICKER_CAPSULE_NAMES) {
  CASE_NAMES[toSlug(name)] = name;
}

for (const { t, tiers } of STICKER_TOURNAMENT_TIERS) {
  for (const tier of tiers) {
    const name = `${t} ${tier} Sticker Capsule`;
    CASE_NAMES[toSlug(name)] = name;
  }
}

// ── Autograph capsule market names ────────────────────────────────────────────
const AUTOGRAPH_TOURNAMENT_TIERS = [
  { t: 'Budapest 2025',   tiers: ['Contenders','Challengers','Legends','Champions'] },
  { t: 'Austin 2025',     tiers: ['Contenders','Challengers','Legends','Champions'] },
  { t: 'Shanghai 2024',   tiers: ['Contenders','Challengers','Legends','Champions'] },
  { t: 'Copenhagen 2024', tiers: ['Contenders','Challengers','Legends','Champions'] },
  { t: 'Paris 2023',      tiers: ['Contenders','Challengers','Legends','Champions'] },
  { t: 'Rio 2022',        tiers: ['Contenders','Challengers','Legends','Champions'] },
  { t: 'Antwerp 2022',    tiers: ['Contenders','Challengers','Legends','Champions'] },
  { t: 'Stockholm 2021',  tiers: ['Finalists','Champions'] },
  { t: 'Berlin 2019',     tiers: ['Returning Challengers','Minor Challengers','Legends'] },
  { t: 'Katowice 2019',   tiers: ['Returning Challengers','Minor Challengers','Legends'] },
  { t: 'London 2018',     tiers: ['Returning Challengers','Minor Challengers','Legends'] },
];

for (const { t, tiers } of AUTOGRAPH_TOURNAMENT_TIERS) {
  for (const tier of tiers) {
    const name = `${t} ${tier} Autograph Capsule`;
    CASE_NAMES[toSlug(name)] = name;
  }
}

// Team-specific autograph capsules (Boston 2018, Krakow 2017, Atlanta 2017)
const TEAM_AUTOGRAPH_CAPSULES = [
  // Boston 2018
  ...['Astralis','Cloud9','FaZe','fnatic','G2','Gambit','mousesports',
     "Na'Vi",'NiP','North','QBF','SK','Space Soldiers','TyLoo','Vega','Virtus.pro']
    .map(team => `Boston 2018 ${team} Autograph Capsule`),
  // Krakow 2017
  ...['Astralis','BIG','FaZe','fnatic','G2','Gambit','Immortals','mousesports',
     "Na'Vi",'NiP','North','SK','Space Soldiers','TyLoo','Virtus.pro','Vega Squadron']
    .map(team => `Krakow 2017 ${team} Autograph Capsule`),
  // Atlanta 2017
  ...['Astralis','Cloud9','FaZe','fnatic','G2','Gambit','Immortals',
     "Na'Vi",'NiP','SK','TyLoo','Virtus.pro','North','mousesports',
     'OpTic Gaming','Team Liquid']
    .map(team => `Atlanta 2017 ${team} Autograph Capsule`),
];

for (const name of TEAM_AUTOGRAPH_CAPSULES) {
  CASE_NAMES[toSlug(name)] = name;
}

// ── Music Kit Box market names ────────────────────────────────────────────────
const MUSIC_KIT_NAMES = [
  'StatTrak Masterminds 2 Music Kit Box', 'Masterminds 2 Music Kit Box',
  'StatTrak Masterminds Music Kit Box', 'Masterminds Music Kit Box',
  'StatTrak Initiators Music Kit Box', 'Initiators Music Kit Box',
  'StatTrak NIGHTMODE Music Kit Box', 'NIGHTMODE Music Kit Box',
  'StatTrak Tacticians Music Kit Box', 'Tacticians Music Kit Box',
  'StatTrak Radicals Music Kit Box',
  'StatTrak Deluge Music Kit Box', 'Deluge Music Kit Box',
];

for (const name of MUSIC_KIT_NAMES) {
  CASE_NAMES[toSlug(name)] = name;
}

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

// ── Image helpers ────────────────────────────────────────────────────────────
const STEAM_CDN = 'https://community.steamstatic.com/economy/image';

function resolveImageUrl(imgPath) {
  if (!imgPath) return null;
  if (typeof imgPath === 'string' && imgPath.startsWith('http')) return imgPath;
  if (typeof imgPath === 'string' && imgPath.startsWith('-')) return `${STEAM_CDN}/${imgPath}`;
  return null;
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

  // ── Fetch images ──────────────────────────────────────────────────────────
  console.log('\n🖼️  Fetching container images from PriceEmpire...');
  const imageMap = new Map();
  try {
    const imgUrl = `https://api.pricempire.com/v4/paid/items/images?app_id=730&api_key=${API_KEY}`;
    const imgRes = await fetchWithRetry(imgUrl);
    if (imgRes && imgRes.ok) {
      const imgData = await imgRes.json();
      const imgSource = imgData?.images || imgData;
      if (imgSource && typeof imgSource === 'object') {
        for (const [name, imgVal] of Object.entries(imgSource)) {
          let imgUrlResolved = null;
          if (typeof imgVal === 'string' && imgVal.length > 5) {
            imgUrlResolved = resolveImageUrl(imgVal);
          } else if (imgVal && typeof imgVal === 'object') {
            const cdnPath = imgVal.steam || imgVal.cdn || null;
            if (cdnPath) imgUrlResolved = resolveImageUrl(cdnPath);
          }
          if (imgUrlResolved) imageMap.set(name, imgUrlResolved);
        }
        console.log(`✅ Got ${imageMap.size} image entries`);
      }
    } else {
      console.log(`   ⚠️ Image fetch failed (${imgRes?.status}), continuing without images`);
    }
  } catch (err) {
    console.log(`   ⚠️ Image fetch error: ${err.message}, continuing without images`);
  }

  // ── Build normalized lookup for fuzzy matching ────────────────────────────
  function normalize(name) {
    return name.toLowerCase()
      .replace(/[™®:;,.'\-–—]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const normalizedPriceMap = new Map();
  const normalizedImageMap = new Map();
  for (const [name, item] of priceMap.entries()) {
    normalizedPriceMap.set(normalize(name), { name, item });
  }
  for (const [name, url] of imageMap.entries()) {
    normalizedImageMap.set(normalize(name), url);
  }

  // ── Extract prices & images for our cases ────────────────────────────────
  const cases = {};
  let found = 0;
  let missing = 0;
  let imagesFound = 0;

  for (const [id, marketName] of Object.entries(CASE_NAMES)) {
    // Try exact match first, then normalized/fuzzy match
    let item = priceMap.get(marketName);
    let image = imageMap.get(marketName) || null;

    if (!item || !image) {
      const normName = normalize(marketName);
      if (!item) {
        const fuzzy = normalizedPriceMap.get(normName);
        if (fuzzy) {
          item = fuzzy.item;
          console.log(`   🔍 Fuzzy matched "${marketName}" → "${fuzzy.name}"`);
        }
      }
      if (!image) {
        const fuzzyImg = normalizedImageMap.get(normName);
        if (fuzzyImg) image = fuzzyImg;
      }
    }

    if (item) {
      const { price, source, providers } = extractPrice(item);
      if (price > 0) {
        cases[id] = { price, source };
        if (image) { cases[id].image = image; imagesFound++; }
        found++;
        console.log(`   ✅ ${marketName}: $${price.toFixed(2)} (${source})${image ? ' 🖼️' : ''}`);
      } else {
        if (image) { cases[id] = { price: 0, source: 'none', image }; imagesFound++; }
        missing++;
        console.log(`   ⚠️ ${marketName}: no price data${image ? ' (has image)' : ''}`);
      }
    } else {
      if (image) { cases[id] = { price: 0, source: 'none', image }; imagesFound++; }
      missing++;
      console.log(`   ❌ ${marketName}: not found in API response${image ? ' (has image)' : ''}`);
    }
  }

  // ── Search for unmatched capsules in API data ────────────────────────────
  const missingNames = Object.entries(CASE_NAMES)
    .filter(([id]) => !cases[id] || !cases[id].price)
    .map(([, name]) => name);

  if (missingNames.length > 0) {
    console.log(`\n🔍 Searching API data for ${missingNames.length} unmatched items...`);
    const capsuleKeywords = ['capsule', 'music kit', 'sticker', 'autograph', 'souvenir', 'package'];
    const apiCapsules = [...priceMap.keys()].filter(name =>
      capsuleKeywords.some(kw => name.toLowerCase().includes(kw))
    );

    for (const missingName of missingNames.slice(0, 10)) {
      const words = missingName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const candidates = apiCapsules.filter(apiName => {
        const lower = apiName.toLowerCase();
        return words.filter(w => lower.includes(w)).length >= Math.ceil(words.length * 0.6);
      });
      if (candidates.length > 0 && candidates.length <= 5) {
        console.log(`   "${missingName}" → possible matches: ${candidates.join(', ')}`);
      }
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source: 'pricempire',
    cases,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n✅ Done! ${found} priced, ${imagesFound} with images, ${missing} missing → ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  writeFileSync(OUTPUT_PATH, JSON.stringify({ fetchedAt: new Date().toISOString(), source: 'error', cases: {} }, null, 2));
  process.exit(1);
});
