/**
 * Fetch skin images from PriceEmpire for case simulator
 * Generates src/lib/case-skin-images.json with weapon|name → imageUrl mapping
 * Also includes name-only fallbacks for skins where weapon doesn't match
 * Run: PRICEMPIRE_API_KEY=xxx node scripts/fetch-case-images.mjs
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'case-skin-images.json');

if (!API_KEY) {
  console.error('❌ Set PRICEMPIRE_API_KEY env variable');
  process.exit(1);
}

const STEAM_CDN = 'https://community.steamstatic.com/economy/image';

function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('-')) return `${STEAM_CDN}/${imagePath}`;
  return null;
}

function stripWear(name) {
  return name
    .replace(/^stattrak™?\s*/i, '')
    .replace(/^souvenir\s*/i, '')
    .replace(/^★\s*/, '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .replace(/\s*-\s*(Phase \d|Ruby|Sapphire|Black Pearl|Emerald)$/i, '')
    .trim();
}

async function main() {
  console.log('Fetching skin images from PriceEmpire...');

  const url = `https://api.pricempire.com/v4/paid/items/images?app_id=730&api_key=${API_KEY}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    console.error(`❌ PriceEmpire API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const source = data?.images || data;

  if (!source || typeof source !== 'object') {
    console.error('❌ No images data in response');
    process.exit(1);
  }

  console.log(`Raw entries from API: ${Object.keys(source).length}`);

  // Primary map: weapon|name → image
  const images = {};
  // Secondary map: name-only → image (for fallback when weapon doesn't match)
  const nameOnlyMap = {};
  let resolved = 0;

  for (const [name, imgVal] of Object.entries(source)) {
    let imgUrl = null;
    if (typeof imgVal === 'string' && imgVal.length > 5) {
      imgUrl = resolveImageUrl(imgVal);
    } else if (imgVal && typeof imgVal === 'object') {
      const cdnPath = imgVal.steam || imgVal.cdn || null;
      if (cdnPath) imgUrl = resolveImageUrl(cdnPath);
    }
    if (!imgUrl) continue;

    const cleanName = stripWear(name);
    const parts = cleanName.split(/\s*\|\s*/);
    if (parts.length >= 2) {
      const weapon = parts[0].trim();
      const skin = parts.slice(1).join('|').trim();
      const key = `${weapon}|${skin}`.toLowerCase();
      if (!images[key]) {
        images[key] = imgUrl;
        resolved++;
      }
      // Also store by skin name only (first one wins)
      const skinLower = skin.toLowerCase();
      if (!nameOnlyMap[skinLower]) {
        nameOnlyMap[skinLower] = imgUrl;
      }
    }
  }

  console.log(`Resolved ${resolved} unique weapon|skin entries`);
  console.log(`Name-only fallback entries: ${Object.keys(nameOnlyMap).length}`);

  // Merge skins-data.json images
  try {
    const skinData = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'lib', 'skins-data.json'), 'utf8'));
    let existing = 0;
    for (const skin of skinData.skins) {
      const key = `${skin.weapon}|${skin.name}`.toLowerCase();
      if (skin.image && !images[key]) {
        images[key] = skin.image;
        existing++;
      }
      // Also add to name-only map
      const skinLower = skin.name.toLowerCase();
      if (skin.image && !nameOnlyMap[skinLower]) {
        nameOnlyMap[skinLower] = skin.image;
      }
    }
    console.log(`Added ${existing} extra images from skins-data.json`);
  } catch (e) {
    console.log('Note: Could not read skins-data.json');
  }

  // Check case coverage with fallback
  try {
    const casesContent = readFileSync(join(__dirname, '..', 'src', 'lib', 'cases.ts'), 'utf8');
    const skinPattern = /\{\s*name:\s*'([^']+)',\s*rarity:\s*'([^']+)',\s*weapon:\s*'([^']+)'/g;
    let match;
    let total = 0, exact = 0, thePrefix = 0, nameOnly = 0, missing = 0;
    const missingList = [];
    const addedByFallback = {};

    while ((match = skinPattern.exec(casesContent)) !== null) {
      total++;
      const name = match[1], weapon = match[3];
      const key = `${weapon}|${name}`.toLowerCase();

      if (images[key]) {
        exact++;
      } else {
        // Try "The X" variant
        const theKey = `${weapon}|the ${name}`.toLowerCase();
        if (images[theKey]) {
          thePrefix++;
          images[key] = images[theKey]; // Add to images
        } else {
          // Fallback: match by skin name only
          const skinLower = name.toLowerCase();
          const theSkinLower = `the ${name}`.toLowerCase();
          if (nameOnlyMap[skinLower]) {
            nameOnly++;
            images[key] = nameOnlyMap[skinLower];
            addedByFallback[key] = nameOnlyMap[skinLower];
          } else if (nameOnlyMap[theSkinLower]) {
            nameOnly++;
            images[key] = nameOnlyMap[theSkinLower];
            addedByFallback[key] = nameOnlyMap[theSkinLower];
          } else {
            missing++;
            missingList.push(`${weapon} | ${name}`);
          }
        }
      }
    }

    console.log(`\nCase skin coverage:`);
    console.log(`  Exact match: ${exact}/${total}`);
    console.log(`  "The" prefix match: ${thePrefix}`);
    console.log(`  Name-only fallback: ${nameOnly}`);
    console.log(`  Still missing: ${missing}`);
    if (missingList.length > 0) {
      console.log('\nStill missing after all fallbacks:');
      [...new Set(missingList)].forEach(s => console.log(`  - ${s}`));
    }
  } catch (e) {
    console.log('Note: Could not check case coverage');
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(images, null, 0));
  console.log(`\n✅ Wrote ${Object.keys(images).length} entries to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
