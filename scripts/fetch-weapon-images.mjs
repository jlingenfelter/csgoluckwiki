/**
 * Fetch weapon base images from PriceEmpire API
 * Generates src/lib/weapon-images.json with weapon slug → imageUrl mapping
 * Run: PRICEMPIRE_API_KEY=xxx node scripts/fetch-weapon-images.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'weapon-images.json');

if (!API_KEY) {
  console.error('Set PRICEMPIRE_API_KEY env variable');
  process.exit(1);
}

const STEAM_CDN = 'https://community.steamstatic.com/economy/image';

function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('-')) return `${STEAM_CDN}/${imagePath}`;
  return null;
}

// Weapon slugs → market hash name prefixes
const WEAPON_MAP = {
  'ak-47': 'AK-47',
  'm4a4': 'M4A4',
  'm4a1-s': 'M4A1-S',
  'awp': 'AWP',
  'ssg-08': 'SSG 08',
  'galil-ar': 'Galil AR',
  'famas': 'FAMAS',
  'aug': 'AUG',
  'sg-553': 'SG 553',
  'scar-20': 'SCAR-20',
  'g3sg1': 'G3SG1',
  'mac-10': 'MAC-10',
  'mp9': 'MP9',
  'mp7': 'MP7',
  'ump-45': 'UMP-45',
  'p90': 'P90',
  'mp5-sd': 'MP5-SD',
  'pp-bizon': 'PP-Bizon',
  'glock-18': 'Glock-18',
  'usp-s': 'USP-S',
  'p2000': 'P2000',
  'p250': 'P250',
  'five-seven': 'Five-SeveN',
  'tec-9': 'Tec-9',
  'cz75-auto': 'CZ75-Auto',
  'desert-eagle': 'Desert Eagle',
  'dual-berettas': 'Dual Berettas',
  'r8-revolver': 'R8 Revolver',
  'nova': 'Nova',
  'xm1014': 'XM1014',
  'mag-7': 'MAG-7',
  'sawed-off': 'Sawed-Off',
  'm249': 'M249',
  'negev': 'Negev',
};

// Knife/glove vanilla names (★ prefix, no skin name)
const KNIFE_GLOVE_MAP = {
  'bayonet': '★ Bayonet',
  'bowie-knife': '★ Bowie Knife',
  'butterfly-knife': '★ Butterfly Knife',
  'classic-knife': '★ Classic Knife',
  'falchion-knife': '★ Falchion Knife',
  'flip-knife': '★ Flip Knife',
  'gut-knife': '★ Gut Knife',
  'huntsman-knife': '★ Huntsman Knife',
  'karambit': '★ Karambit',
  'kukri-knife': '★ Kukri Knife',
  'm9-bayonet': '★ M9 Bayonet',
  'navaja-knife': '★ Navaja Knife',
  'nomad-knife': '★ Nomad Knife',
  'paracord-knife': '★ Paracord Knife',
  'shadow-daggers': '★ Shadow Daggers',
  'skeleton-knife': '★ Skeleton Knife',
  'stiletto-knife': '★ Stiletto Knife',
  'survival-knife': '★ Survival Knife',
  'talon-knife': '★ Talon Knife',
  'ursus-knife': '★ Ursus Knife',
  'bloodhound-gloves': '★ Bloodhound Gloves',
  'broken-fang-gloves': '★ Broken Fang Gloves',
  'driver-gloves': '★ Driver Gloves',
  'hand-wraps': '★ Hand Wraps',
  'hydra-gloves': '★ Hydra Gloves',
  'moto-gloves': '★ Moto Gloves',
  'specialist-gloves': '★ Specialist Gloves',
  'sport-gloves': '★ Sport Gloves',
};

async function main() {
  console.log('Fetching item images from PriceEmpire...');

  const url = `https://api.pricempire.com/v4/paid/items/images?app_id=730&api_key=${API_KEY}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = await res.json();
  const source = data?.images || data;

  if (!source || typeof source !== 'object') {
    console.error('No images data');
    process.exit(1);
  }

  console.log(`Total API entries: ${Object.keys(source).length}`);

  const weaponImages = {};

  // 1) Regular weapons: find first skin entry for each weapon (prefer Factory New)
  for (const [slug, marketPrefix] of Object.entries(WEAPON_MAP)) {
    const prefix = `${marketPrefix} | `;
    let bestImg = null;
    let bestName = '';

    for (const [name, imgVal] of Object.entries(source)) {
      if (!name.startsWith(prefix)) continue;

      let imgUrl = null;
      if (typeof imgVal === 'string' && imgVal.length > 5) {
        imgUrl = resolveImageUrl(imgVal);
      } else if (imgVal && typeof imgVal === 'object') {
        const cdnPath = imgVal.steam || imgVal.cdn || null;
        if (cdnPath) imgUrl = resolveImageUrl(cdnPath);
      }
      if (!imgUrl) continue;

      // Prefer items without wear (base skin), then Factory New
      const lower = name.toLowerCase();
      if (!lower.includes('(') && !lower.includes('stattrak') && !lower.includes('souvenir')) {
        bestImg = imgUrl;
        bestName = name;
        break;
      }
      if (!bestImg) {
        bestImg = imgUrl;
        bestName = name;
      }
    }

    if (bestImg) {
      weaponImages[slug] = bestImg;
      console.log(`  ${slug} <- ${bestName}`);
    } else {
      console.log(`  ${slug} <- NO IMAGE FOUND`);
    }
  }

  // 2) Knives/gloves: look for vanilla entries (★ Name) or first skin
  for (const [slug, vanillaName] of Object.entries(KNIFE_GLOVE_MAP)) {
    // Try exact vanilla match first
    let imgUrl = null;
    const vanillaImg = source[vanillaName];
    if (vanillaImg) {
      if (typeof vanillaImg === 'string' && vanillaImg.length > 5) {
        imgUrl = resolveImageUrl(vanillaImg);
      } else if (vanillaImg && typeof vanillaImg === 'object') {
        const cdnPath = vanillaImg.steam || vanillaImg.cdn || null;
        if (cdnPath) imgUrl = resolveImageUrl(cdnPath);
      }
    }

    if (imgUrl) {
      weaponImages[slug] = imgUrl;
      console.log(`  ${slug} <- ${vanillaName} (vanilla)`);
      continue;
    }

    // Fallback: find first skin entry
    const prefix = `${vanillaName} | `;
    for (const [name, imgVal] of Object.entries(source)) {
      if (!name.startsWith(prefix)) continue;

      if (typeof imgVal === 'string' && imgVal.length > 5) {
        imgUrl = resolveImageUrl(imgVal);
      } else if (imgVal && typeof imgVal === 'object') {
        const cdnPath = imgVal.steam || imgVal.cdn || null;
        if (cdnPath) imgUrl = resolveImageUrl(cdnPath);
      }
      if (imgUrl) {
        weaponImages[slug] = imgUrl;
        console.log(`  ${slug} <- ${name}`);
        break;
      }
    }

    if (!imgUrl) {
      console.log(`  ${slug} <- NO IMAGE FOUND`);
    }
  }

  console.log(`\nFound ${Object.keys(weaponImages).length} weapon images`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(weaponImages, null, 2));
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
