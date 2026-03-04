/**
 * Fetch images for the 43 missing case skins from Steam Community Market
 * Updates src/lib/case-skin-images.json with the missing entries
 * Run: node scripts/fetch-missing-images.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_PATH = join(__dirname, '..', 'src', 'lib', 'case-skin-images.json');

// Load current images
const images = JSON.parse(readFileSync(IMAGES_PATH, 'utf8'));

// Find missing case skins
const casesContent = readFileSync(join(__dirname, '..', 'src', 'lib', 'cases.ts'), 'utf8');
const skinPattern = /\{\s*name:\s*'([^']+)',\s*rarity:\s*'([^']+)',\s*weapon:\s*'([^']+)'/g;
let match;
const missing = [];
while ((match = skinPattern.exec(casesContent)) !== null) {
  const name = match[1], weapon = match[3];
  const key = `${weapon}|${name}`.toLowerCase();
  const theKey = `${weapon}|the ${name}`.toLowerCase();
  if (!images[key] && !images[theKey]) {
    if (!missing.find(m => m.key === key)) {
      missing.push({ weapon, name, key });
    }
  }
}

console.log(`Missing skins to fetch: ${missing.length}`);

// Steam Market search API — returns JSON with image URLs
const STEAM_SEARCH = 'https://steamcommunity.com/market/search/render/';

async function fetchSteamImage(weapon, skinName) {
  const query = `${weapon} | ${skinName}`;
  const params = new URLSearchParams({
    query,
    start: '0',
    count: '5',
    search_descriptions: '0',
    sort_column: 'name',
    sort_dir: 'asc',
    appid: '730',
    norender: '1',
  });

  try {
    const res = await fetch(`${STEAM_SEARCH}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      if (res.status === 429) return 'RATE_LIMITED';
      return null;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    // Find the matching result
    for (const result of data.results) {
      const hashName = result.hash_name || result.name || '';
      // Check if this result matches our weapon + skin
      if (hashName.includes(weapon) && hashName.includes(skinName)) {
        // Extract image URL from asset_description
        const icon = result.asset_description?.icon_url;
        if (icon) {
          return `https://steamcommunity-a.akamaihd.net/economy/image/${icon}`;
        }
      }
    }

    // If no exact match, try the first result's image
    const firstIcon = data.results[0]?.asset_description?.icon_url;
    if (firstIcon) {
      const firstName = data.results[0]?.hash_name || '';
      if (firstName.includes(skinName)) {
        return `https://steamcommunity-a.akamaihd.net/economy/image/${firstIcon}`;
      }
    }

    return null;
  } catch (e) {
    console.error(`  Error: ${e.message}`);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  let found = 0, notFound = 0, rateLimited = 0;

  for (let i = 0; i < missing.length; i++) {
    const { weapon, name, key } = missing[i];
    process.stdout.write(`[${i + 1}/${missing.length}] ${weapon} | ${name}...`);

    const imgUrl = await fetchSteamImage(weapon, name);

    if (imgUrl === 'RATE_LIMITED') {
      console.log(' RATE LIMITED — waiting 30s...');
      rateLimited++;
      await sleep(30000);
      i--; // retry
      continue;
    }

    if (imgUrl) {
      images[key] = imgUrl;
      found++;
      console.log(` ✓`);
    } else {
      notFound++;
      console.log(` ✗ not found`);
    }

    // Rate limit: 1 request per 1.5 seconds
    await sleep(1500);
  }

  console.log(`\nResults: ${found} found, ${notFound} not found, ${rateLimited} rate limited`);

  // Save updated images
  writeFileSync(IMAGES_PATH, JSON.stringify(images, null, 0));
  console.log(`✅ Updated ${IMAGES_PATH}`);

  // Verify final coverage
  const casesContent2 = readFileSync(join(__dirname, '..', 'src', 'lib', 'cases.ts'), 'utf8');
  const sp2 = /\{\s*name:\s*'([^']+)',\s*rarity:\s*'([^']+)',\s*weapon:\s*'([^']+)'/g;
  let m2, total = 0, covered = 0;
  while ((m2 = sp2.exec(casesContent2)) !== null) {
    total++;
    const k = `${m2[3]}|${m2[1]}`.toLowerCase();
    const tk = `${m2[3]}|the ${m2[1]}`.toLowerCase();
    if (images[k] || images[tk]) covered++;
  }
  console.log(`Final coverage: ${covered}/${total} (${(covered/total*100).toFixed(1)}%)`);
}

main();
