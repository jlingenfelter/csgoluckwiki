/**
 * Fetch and download CS2 agent images locally
 *
 * Two modes:
 *   1. With API key:  PRICEMPIRE_API_KEY=xxx node scripts/fetch-agent-images.mjs
 *      Fetches fresh image URLs from PriceEmpire, downloads them, updates agent-images.json
 *   2. Without API key:  node scripts/fetch-agent-images.mjs
 *      Uses existing agent-images.json URLs to download images locally
 *
 * Downloads to: public/images/agents/
 * Updates:      src/lib/agent-images.json  (keys stay the same, values become local paths)
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const OUTPUT_JSON = join(ROOT, 'src', 'lib', 'agent-images.json');
const IMAGE_DIR = join(ROOT, 'public', 'images', 'agents');

const STEAM_CDN = 'https://community.steamstatic.com/economy/image';

// Known agent faction names used to filter PriceEmpire results
const AGENT_FACTIONS = [
  'seal frogman', 'ksk', 'sabre', 'sabre footsoldier', 'professional',
  'phoenix', 'phoenix connexion', 'balkans', 'the doctor', 'elite crew',
  'guerrilla warfare', 'swat', 'fbi', 'fbi sniper', 'gign', 'sas',
  'nswc seal', 'usaf tacp', 'tacp', 'tacp cavalry', 'irs', 'ctm', 'st6',
  'the professionals', 'the elite mr. muhlik', 'fbi hrt', 'nzsas',
];

function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('-')) return `${STEAM_CDN}/${imagePath}`;
  return null;
}

/** Create a filesystem-safe filename from an agent key */
function toFilename(key) {
  return key
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '.png';
}

/** Download a single image with retry */
async function downloadImage(url, filepath) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const ws = createWriteStream(filepath);
      await pipeline(res.body, ws);
      return true;
    } catch (err) {
      if (attempt === 3) {
        console.error(`    Failed after 3 attempts: ${err.message}`);
        return false;
      }
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  return false;
}

/** Fetch agent image URLs from PriceEmpire API */
async function fetchFromApi() {
  console.log('Fetching item images from PriceEmpire API...');

  const url = `https://api.pricempire.com/v4/paid/items/images?app_id=730&api_key=${API_KEY}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const source = data?.images || data;

  if (!source || typeof source !== 'object') {
    console.error('No images data in API response');
    process.exit(1);
  }

  console.log(`Total API entries: ${Object.keys(source).length}`);

  // Build map of unique agent URLs keyed by "name | faction" (lowercase)
  const urlMap = {};
  let count = 0;

  for (const [name, imgVal] of Object.entries(source)) {
    if (!name.includes(' | ')) continue;

    const lower = name.toLowerCase();

    // Skip non-agent items
    if (lower.includes('(factory new)') || lower.includes('(minimal wear)') ||
        lower.includes('(field-tested)') || lower.includes('(well-worn)') ||
        lower.includes('(battle-scarred)') || lower.includes('sticker |') ||
        lower.includes('sealed graffiti') || lower.includes('case') ||
        lower.includes('music kit') || lower.includes('capsule') ||
        lower.includes('package') || lower.includes('patch |') ||
        lower.includes('souvenir charm') || lower.includes('pin |') ||
        lower.startsWith('\u2605') || lower.startsWith('sticker slab') ||
        lower.startsWith('charm |') || lower.includes('lil\'')) continue;

    const parts = name.split(' | ');
    if (parts.length < 2) continue;
    const faction = parts.slice(1).join(' | ').trim().toLowerCase();

    const isAgent = AGENT_FACTIONS.some(f => faction.includes(f));
    if (!isAgent) continue;

    let imgUrl = null;
    if (typeof imgVal === 'string' && imgVal.length > 5) {
      imgUrl = resolveImageUrl(imgVal);
    } else if (imgVal && typeof imgVal === 'object') {
      const cdnPath = imgVal.steam || imgVal.cdn || null;
      if (cdnPath) imgUrl = resolveImageUrl(cdnPath);
    }
    if (!imgUrl) continue;

    const agentName = parts[0].trim().toLowerCase();

    // Store three key variants for lookup flexibility
    urlMap[lower] = imgUrl;
    if (!urlMap[agentName]) urlMap[agentName] = imgUrl;
    urlMap[`${agentName}|${faction}`] = imgUrl;
    count++;
    console.log(`  Found: ${name}`);
  }

  console.log(`\nExtracted ${count} agent entries from API`);
  return urlMap;
}

/** Load existing agent-images.json URLs */
function loadExistingUrls() {
  try {
    const raw = JSON.parse(readFileSync(OUTPUT_JSON, 'utf8'));
    // Only keep entries that are remote URLs (not already local paths)
    const urlMap = {};
    for (const [key, val] of Object.entries(raw)) {
      if (typeof val === 'string' && val.startsWith('http')) {
        urlMap[key] = val;
      }
    }
    console.log(`Loaded ${Object.keys(urlMap).length} existing remote URLs from agent-images.json`);
    return urlMap;
  } catch {
    console.error('No existing agent-images.json found and no API key provided.');
    process.exit(1);
  }
}

async function main() {
  // Step 1: Get URL map (from API or existing JSON)
  let urlMap;
  if (API_KEY) {
    urlMap = await fetchFromApi();
  } else {
    console.log('No PRICEMPIRE_API_KEY set -- using existing agent-images.json URLs');
    urlMap = loadExistingUrls();
  }

  // Step 2: Deduplicate URLs -- many keys point to the same image
  const urlToKeys = {};
  for (const [key, url] of Object.entries(urlMap)) {
    if (!urlToKeys[url]) urlToKeys[url] = [];
    urlToKeys[url].push(key);
  }
  const uniqueUrls = Object.keys(urlToKeys);
  console.log(`\nUnique images to download: ${uniqueUrls.length}`);

  // Step 3: Create output directory
  mkdirSync(IMAGE_DIR, { recursive: true });
  console.log(`Image directory: ${IMAGE_DIR}`);

  // Step 4: Download each unique image
  const localPathMap = {};  // key -> local web path
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    const keys = urlToKeys[url];

    // Use the shortest key with a pipe as the canonical name for the filename
    const canonicalKey = keys
      .filter(k => k.includes('|'))
      .sort((a, b) => a.length - b.length)[0] || keys[0];

    const filename = toFilename(canonicalKey);
    const filepath = join(IMAGE_DIR, filename);
    const webPath = `/images/agents/${filename}`;

    const progress = `[${i + 1}/${uniqueUrls.length}]`;

    if (existsSync(filepath)) {
      console.log(`  ${progress} Skipped (exists): ${filename}`);
      skipped++;
    } else {
      console.log(`  ${progress} Downloading: ${filename}`);
      const ok = await downloadImage(url, filepath);
      if (ok) {
        downloaded++;
      } else {
        failed++;
        // If download fails, keep the remote URL for those keys
        for (const k of keys) localPathMap[k] = url;
        continue;
      }
      // Small delay between downloads to be polite
      if (i < uniqueUrls.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    // Map all keys that share this URL to the local path
    for (const k of keys) {
      localPathMap[k] = webPath;
    }
  }

  console.log(`\nDownloaded: ${downloaded}, Skipped (existed): ${skipped}, Failed: ${failed}`);
  console.log(`Total mapping entries: ${Object.keys(localPathMap).length}`);

  // Step 5: Write updated agent-images.json with local paths
  writeFileSync(OUTPUT_JSON, JSON.stringify(localPathMap, null, 2));
  console.log(`\nWrote ${Object.keys(localPathMap).length} entries to ${OUTPUT_JSON}`);

  // Step 6: Verify coverage against agents.ts data
  verifyCoverage(localPathMap);
}

function verifyCoverage(imageMap) {
  const ctAgents = [
    { name: "Cmdr. Frank 'Wet Sox' Baroud", faction: 'SEAL Frogman' },
    { name: "Cmdr. Davida 'Goggles' Fernandez", faction: 'SEAL Frogman' },
    { name: 'Lieutenant Rex Krikey', faction: 'SEAL Frogman' },
    { name: 'Seal Team 6 Soldier', faction: 'NSWC SEAL' },
    { name: 'Buckshot', faction: 'NSWC SEAL' },
    { name: "'Blueberries' Buckshot", faction: 'NSWC SEAL' },
    { name: 'Lt. Commander Ricksaw', faction: 'NSWC SEAL' },
    { name: 'Special Agent Ava', faction: 'FBI' },
    { name: 'Operator', faction: 'FBI SWAT' },
    { name: 'Michael Syfers', faction: 'FBI Sniper' },
    { name: 'Markus Delrow', faction: 'FBI HRT' },
    { name: '3rd Commando Company', faction: 'KSK' },
    { name: "Cmdr. Mae 'Dead Cold' Jamison", faction: 'SWAT' },
    { name: 'Chem-Haz Specialist', faction: 'SWAT' },
    { name: 'Bio-Haz Specialist', faction: 'SWAT' },
    { name: '1st Lieutenant Farlow', faction: 'SWAT' },
    { name: "Lieutenant 'Tree Hugger' Farlow", faction: 'SWAT' },
    { name: 'Sergeant Bombson', faction: 'SWAT' },
    { name: "John 'Van Healen' Kask", faction: 'SWAT' },
    { name: 'B Squadron Officer', faction: 'SAS' },
    { name: 'D Squadron Officer', faction: 'NZSAS' },
    { name: "'Two Times' McCoy", faction: 'USAF TACP' },
  ];

  const tAgents = [
    { name: 'Dragomir', faction: 'Sabre' },
    { name: 'Dragomir', faction: 'Sabre Footsoldier' },
    { name: 'Maximus', faction: 'Sabre' },
    { name: 'Blackwolf', faction: 'Sabre' },
    { name: 'Rezan the Redshirt', faction: 'Sabre' },
    { name: 'Rezan The Ready', faction: 'Sabre' },
    { name: "'The Doctor' Romanov", faction: 'Sabre' },
    { name: 'Vypa Sista of the Revolution', faction: 'Guerrilla Warfare' },
    { name: 'Trapper', faction: 'Guerrilla Warfare' },
    { name: 'Trapper Aggressor', faction: 'Guerrilla Warfare' },
    { name: 'Elite Trapper Solman', faction: 'Guerrilla Warfare' },
    { name: 'Crasswater The Forgotten', faction: 'Guerrilla Warfare' },
    { name: "'Medium Rare' Crasswater", faction: 'Guerrilla Warfare' },
    { name: 'Arno The Overgrown', faction: 'Guerrilla Warfare' },
    { name: 'Col. Mangos Dabisi', faction: 'Guerrilla Warfare' },
    { name: 'Soldier', faction: 'Phoenix' },
    { name: 'Slingshot', faction: 'Phoenix' },
    { name: 'Enforcer', faction: 'Phoenix' },
    { name: 'Street Soldier', faction: 'Phoenix' },
    { name: 'Ground Rebel', faction: 'Elite Crew' },
    { name: 'The Elite Mr. Muhlik', faction: 'Elite Crew' },
    { name: 'Jungle Rebel', faction: 'Elite Crew' },
    { name: 'Osiris', faction: 'Elite Crew' },
    { name: 'Prof. Shahmat', faction: 'Elite Crew' },
    { name: 'Sir Bloody Darryl Royale', faction: 'The Professionals' },
    { name: 'Sir Bloody Skullhead Darryl', faction: 'The Professionals' },
    { name: 'Sir Bloody Miami Darryl', faction: 'The Professionals' },
    { name: 'Sir Bloody Loudmouth Darryl', faction: 'The Professionals' },
    { name: 'Sir Bloody Silent Darryl', faction: 'The Professionals' },
    { name: 'Bloody Darryl The Strapped', faction: 'The Professionals' },
    { name: 'Getaway Sally', faction: 'The Professionals' },
    { name: 'Number K', faction: 'The Professionals' },
    { name: 'Little Kev', faction: 'The Professionals' },
    { name: 'Safecracker Voltzmann', faction: 'The Professionals' },
  ];

  console.log('\n--- Agent Coverage Check ---');
  let matched = 0, missing = 0;
  const missingList = [];

  for (const a of [...ctAgents, ...tAgents]) {
    const n = a.name.toLowerCase().trim();
    const f = a.faction.toLowerCase().trim();
    const img = imageMap[`${n} | ${f}`] || imageMap[`${n}|${f}`] || imageMap[n] || null;
    if (img) {
      matched++;
    } else {
      missing++;
      missingList.push(`${a.name} | ${a.faction}`);
    }
  }

  console.log(`Matched: ${matched}/${matched + missing}`);
  if (missingList.length > 0) {
    console.log('Missing:');
    missingList.forEach(m => console.log(`  - ${m}`));
  } else {
    console.log('All agents have images!');
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
