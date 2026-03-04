/**
 * SkinDeck Market Price Fetcher
 *
 * Fetches all CS2 market items from SkinDeck (powers CSGOLuck marketplace)
 * and saves lowest listing price per market_hash_name for display on skin pages.
 *
 * Endpoint: GET https://api.skindeck.com/secure/market/?perPage=-1&game=730
 * Auth:     api-key header
 * Env:      SKINDECK_API_KEY
 *
 * Usage:    SKINDECK_API_KEY="xxx" node scripts/fetch-skindeck-prices.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'skindeck-data.json');

const API_KEY = process.env.SKINDECK_API_KEY;
if (!API_KEY) {
  console.error('❌ Missing SKINDECK_API_KEY environment variable');
  process.exit(1);
}

const API_URL = 'https://api.skindeck.com/secure/market/';
const GAME_CS2 = '730';

async function fetchAllMarketItems() {
  console.log('📦 Fetching all CS2 market items from SkinDeck...');

  const url = `${API_URL}?perPage=-1&game=${GAME_CS2}`;
  const res = await fetch(url, {
    headers: { 'api-key': API_KEY },
  });

  if (!res.ok) {
    throw new Error(`SkinDeck API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(`SkinDeck API returned success=false`);
  }

  console.log(`✅ Fetched ${data.items.length} listings (count: ${data.count})`);
  return data.items;
}

function processItems(items) {
  // Group by market_hash_name → find lowest offer.price per name
  const grouped = {};

  for (const item of items) {
    const hashName = item.market_hash_name;
    if (!hashName || !item.offer) continue;

    const price = item.offer.price;
    if (typeof price !== 'number' || price <= 0) continue;

    if (!grouped[hashName]) {
      grouped[hashName] = {
        price: price,              // lowest offer price (USD)
        marketPrice: item.market_price || null, // buff/market ref price
        count: 1,
        weapon: item.weapon || null,
        name: item.name || null,
        exterior: item.exterior || null,
        rarity: item.rarity || null,
        isStatTrak: item.isStatTrak || false,
        isSouvenir: item.isSouvenir || false,
      };
    } else {
      grouped[hashName].count++;
      if (price < grouped[hashName].price) {
        grouped[hashName].price = price;
      }
    }
  }

  return grouped;
}

async function main() {
  try {
    const items = await fetchAllMarketItems();
    const processed = processItems(items);

    const uniqueNames = Object.keys(processed).length;
    console.log(`🔧 Processed into ${uniqueNames} unique items`);

    const output = {
      fetchedAt: new Date().toISOString(),
      source: 'skindeck',
      totalListings: items.length,
      uniqueItems: uniqueNames,
      items: processed,
    };

    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`💾 Saved to ${OUTPUT_PATH}`);

    // Stats
    const prices = Object.values(processed).map(i => i.price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    console.log(`\n📊 Stats:`);
    console.log(`   Items with prices: ${uniqueNames}`);
    console.log(`   Price range: $${Math.min(...prices).toFixed(2)} — $${Math.max(...prices).toFixed(2)}`);
    console.log(`   Average price: $${avg.toFixed(2)}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
