#!/usr/bin/env node
/**
 * Fetch gear product images from ProSettings.net player pages.
 *
 * Strategy:
 * 1. Read all player JSON files to get unique gear items
 * 2. For a representative sample of players, fetch their ProSettings page
 * 3. Extract gear image URLs from the page HTML
 * 4. Build a gear-name → image-url mapping
 * 5. Save to src/lib/gear-images.json
 *
 * Usage: node scripts/fetch-gear-images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PLAYERS_DIR = path.join(ROOT, 'src/data/players');
const OUTPUT_PATH = path.join(ROOT, 'src/lib/gear-images.json');

const GEAR_KEYS = ['mouse', 'keyboard', 'headset', 'monitor', 'mousepad'];

// Rate limit: be respectful
const DELAY_MS = 1500;
const MAX_PLAYERS_TO_SCRAPE = 200; // Should cover most gear items

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Read all player data and collect unique gear items + which players use them
 */
function loadGearData() {
  const files = fs.readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json'));
  const gearMap = {}; // gearName -> { type, players: [slugs] }
  const playerGear = {}; // playerSlug -> { mouse, keyboard, ... }

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(PLAYERS_DIR, file), 'utf8'));
    const slug = data.slug || path.basename(file, '.json');

    const gear = {};
    for (const key of GEAR_KEYS) {
      const val = data[key];
      if (!val) continue;
      gear[key] = val;

      const mapKey = `${key}:${val}`;
      if (!gearMap[mapKey]) {
        gearMap[mapKey] = { name: val, type: key, players: [] };
      }
      gearMap[mapKey].players.push(slug);
    }
    if (Object.keys(gear).length > 0) {
      playerGear[slug] = gear;
    }
  }

  return { gearMap, playerGear };
}

/**
 * Pick a minimal set of players that covers the most gear items
 */
function pickPlayersToScrape(gearMap, playerGear) {
  const uncovered = new Set(Object.keys(gearMap));
  const selected = [];

  while (uncovered.size > 0 && selected.length < MAX_PLAYERS_TO_SCRAPE) {
    // Find player who covers the most uncovered gear items
    let bestPlayer = null;
    let bestCount = 0;

    for (const [slug, gear] of Object.entries(playerGear)) {
      if (selected.includes(slug)) continue;
      let count = 0;
      for (const key of GEAR_KEYS) {
        if (gear[key] && uncovered.has(`${key}:${gear[key]}`)) {
          count++;
        }
      }
      if (count > bestCount) {
        bestCount = count;
        bestPlayer = slug;
      }
    }

    if (!bestPlayer || bestCount === 0) break;

    selected.push(bestPlayer);
    const gear = playerGear[bestPlayer];
    for (const key of GEAR_KEYS) {
      if (gear[key]) {
        uncovered.delete(`${key}:${gear[key]}`);
      }
    }
  }

  console.log(`Selected ${selected.length} players to scrape (covers ${Object.keys(gearMap).length - uncovered.size}/${Object.keys(gearMap).length} gear items)`);
  if (uncovered.size > 0) {
    console.log(`  ${uncovered.size} items still uncovered`);
  }

  return selected;
}

/**
 * Fetch a ProSettings player page and extract gear image URLs
 */
async function scrapePlayerGearImages(playerSlug) {
  const url = `https://prosettings.net/players/${playerSlug}/`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.log(`  ${playerSlug}: HTTP ${response.status}`);
      return {};
    }

    const html = await response.text();

    // Extract gear images from the Gear section
    // Pattern: <img ... src="...{product-slug}-187x187-fitcontain.{ext}" alt="{GearName}" ...>
    const gearImages = {};
    const imgRegex = /<img[^>]+src="([^"]*(?:187x187|136x136)-fitcontain[^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      const imgUrl = match[1];
      const altText = match[2].trim();
      if (altText && !altText.includes('logo') && altText.length > 2) {
        gearImages[altText] = imgUrl;
      }
    }

    // Also try reverse order (alt before src)
    const imgRegex2 = /<img[^>]+alt="([^"]*)"[^>]*src="([^"]*(?:187x187|136x136)-fitcontain[^"]*)"[^>]*>/gi;
    while ((match = imgRegex2.exec(html)) !== null) {
      const altText = match[1].trim();
      const imgUrl = match[2];
      if (altText && !altText.includes('logo') && altText.length > 2) {
        if (!gearImages[altText]) {
          gearImages[altText] = imgUrl;
        }
      }
    }

    return gearImages;
  } catch (err) {
    console.log(`  ${playerSlug}: fetch error — ${err.message}`);
    return {};
  }
}

/**
 * Normalize gear name for fuzzy matching
 */
function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  console.log('Loading player data...');
  const { gearMap, playerGear } = loadGearData();
  console.log(`Found ${Object.keys(gearMap).length} unique gear items across ${Object.keys(playerGear).length} players`);

  // Load existing data if available (resume support)
  let existing = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    console.log(`Loaded ${Object.keys(existing).length} existing mappings`);
  }

  // Pick players to scrape
  const players = pickPlayersToScrape(gearMap, playerGear);

  // Scrape player pages
  const imageMap = {}; // normalized gear name -> { name, imageUrl, type }
  let scraped = 0;
  let imagesFound = 0;

  for (const slug of players) {
    scraped++;
    process.stdout.write(`\r  Scraping ${scraped}/${players.length}: ${slug}...`);

    const images = await scrapePlayerGearImages(slug);

    for (const [altText, imgUrl] of Object.entries(images)) {
      const key = normalize(altText);
      if (!imageMap[key]) {
        imageMap[key] = { name: altText, imageUrl: imgUrl };
        imagesFound++;
      }
    }

    if (scraped < players.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n\nScraped ${scraped} players, found ${imagesFound} unique gear images`);

  // Match scraped images to our gear items
  const result = { ...existing };
  let matched = 0;
  let unmatched = 0;

  for (const [mapKey, info] of Object.entries(gearMap)) {
    const { name, type } = info;

    // Skip if already in existing data
    if (result[name]) {
      matched++;
      continue;
    }

    // Try exact normalized match
    const key = normalize(name);
    if (imageMap[key]) {
      result[name] = {
        imageUrl: imageMap[key].imageUrl,
        type,
      };
      matched++;
      continue;
    }

    // Try fuzzy: check if any scraped name contains our name or vice versa
    let found = false;
    for (const [scraped_key, scraped_info] of Object.entries(imageMap)) {
      if (scraped_key.includes(key) || key.includes(scraped_key)) {
        result[name] = {
          imageUrl: scraped_info.imageUrl,
          type,
        };
        matched++;
        found = true;
        break;
      }
    }

    if (!found) {
      unmatched++;
    }
  }

  console.log(`Matched: ${matched}/${Object.keys(gearMap).length}`);
  console.log(`Unmatched: ${unmatched}`);

  // Save
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`Saved to ${OUTPUT_PATH}`);

  // Log unmatched items for manual review
  if (unmatched > 0) {
    const unmatchedItems = Object.entries(gearMap)
      .filter(([_, info]) => !result[info.name])
      .map(([_, info]) => `  ${info.type}: ${info.name} (${info.players.length} players)`)
      .sort();

    const unmatchedPath = path.join(ROOT, 'scripts/unmatched-gear.txt');
    fs.writeFileSync(unmatchedPath, unmatchedItems.join('\n'));
    console.log(`Unmatched items saved to ${unmatchedPath}`);
  }
}

main().catch(console.error);
