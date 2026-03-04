/**
 * Fetch agent images from PriceEmpire API
 * Generates src/lib/agent-images.json with agent name → imageUrl mapping
 * Run: PRICEMPIRE_API_KEY=xxx node scripts/fetch-agent-images.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'agent-images.json');

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

// Known agent faction names that appear after the pipe in market hash names
const AGENT_FACTIONS = [
  'seal frogman', 'ksk', 'sabre', 'sabre footsoldier', 'professional',
  'phoenix', 'phoenix connexion', 'balkans', 'the doctor', 'elite crew',
  'guerrilla warfare', 'swat', 'fbi', 'fbi sniper', 'gign', 'sas',
  'nswc seal', 'usaf tacp', 'tacp', 'irs', 'ctm', 'st6',
  'the professionals', 'the elite mr. muhlik',
];

async function main() {
  console.log('Fetching item images from PriceEmpire...');

  const url = `https://api.pricempire.com/v4/paid/items/images?app_id=730&api_key=${API_KEY}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    console.error(`❌ API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const source = data?.images || data;

  if (!source || typeof source !== 'object') {
    console.error('❌ No images data');
    process.exit(1);
  }

  console.log(`Total API entries: ${Object.keys(source).length}`);

  const agentImages = {};
  let count = 0;

  for (const [name, imgVal] of Object.entries(source)) {
    // Must have pipe separator (Name | Faction format)
    if (!name.includes(' | ')) continue;

    const lower = name.toLowerCase();

    // Skip weapon skins (have wear conditions), stickers, graffiti, cases, music kits, etc.
    if (lower.includes('(factory new)') || lower.includes('(minimal wear)') ||
        lower.includes('(field-tested)') || lower.includes('(well-worn)') ||
        lower.includes('(battle-scarred)') || lower.includes('sticker |') ||
        lower.includes('sealed graffiti') || lower.includes('case') ||
        lower.includes('music kit') || lower.includes('capsule') ||
        lower.includes('package') || lower.includes('patch |') ||
        lower.includes('souvenir charm') || lower.includes('pin |') ||
        lower.startsWith('★') || lower.startsWith('sticker slab') ||
        lower.startsWith('charm |') || lower.includes('lil\'')) continue;

    // Check if faction part matches known agent factions
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

    // Store by full name, agent name only, and name|faction
    agentImages[lower] = imgUrl;
    if (!agentImages[agentName]) agentImages[agentName] = imgUrl;
    agentImages[`${agentName}|${faction}`] = imgUrl;
    count++;
    console.log(`  ${name}`);
  }

  console.log(`\nFound ${count} agent images`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(agentImages, null, 2));
  console.log(`✅ Wrote ${OUTPUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
