#!/usr/bin/env node
/**
 * One-time fix: re-match loadout entries that are raw ProSettings names
 * (contain "★", "|", or "(") against skins-data.json using phase-aware matching.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLAYERS_DIR = join(__dirname, '..', 'src', 'data', 'players');
const SKINS_DATA = join(__dirname, '..', 'src', 'lib', 'skins-data.json');

// Build matcher
const data = JSON.parse(readFileSync(SKINS_DATA, 'utf-8'));
const lookup = new Map();
for (const s of data.skins || []) {
  const key = `${s.weapon.toLowerCase()}|${s.name.toLowerCase()}`.replace(/['']/g, "'");
  lookup.set(key, s.slug);
  // For phase variants like "Doppler - Ruby", also add "doppler ruby" (no dash)
  if (s.name.includes(' - ')) {
    const altKey = `${s.weapon.toLowerCase()}|${s.name.toLowerCase().replace(' - ', ' ')}`.replace(/['']/g, "'");
    if (!lookup.has(altKey)) lookup.set(altKey, s.slug);
  }
}

const PHASE_SUFFIXES = [
  'ruby', 'sapphire', 'black pearl', 'emerald',
  'phase 1', 'phase 2', 'phase 3', 'phase 4',
  'fire & ice', 'fire and ice', 'blue gem',
];

function matchSkin(fullName) {
  // Strip StatTrak™ BEFORE ★ (format is "StatTrak™ ★ Weapon | Skin")
  let cleaned = fullName
    .replace(/^StatTrak™\s*/i, '')
    .replace(/^★\s*/, '')
    .replace(/\s*\([^)]+\)\s*$/, '')
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .trim();
  const parts = cleaned.split('|').map(s => s.trim());
  if (parts.length !== 2) return null;
  const weapon = parts[0].toLowerCase();
  const skinName = parts[1].toLowerCase();

  const exact = lookup.get(`${weapon}|${skinName}`);
  if (exact) return exact;

  for (const phase of PHASE_SUFFIXES) {
    if (skinName.endsWith(' ' + phase)) {
      const baseName = skinName.slice(0, -(phase.length + 1)).trim();
      const match = lookup.get(`${weapon}|${baseName}`);
      if (match) return match;
    }
  }

  return null;
}

function isRawName(val) {
  return val && (val.includes('|') || val.includes('★') || val.includes('('));
}

let fixed = 0, unfixable = 0, total = 0;
const unmatched = [];

for (const file of readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json'))) {
  const path = join(PLAYERS_DIR, file);
  const player = JSON.parse(readFileSync(path, 'utf-8'));
  if (!player.loadout) continue;

  let changed = false;
  for (const slot of ['knife', 'gloves', 'rifle', 'pistol', 'awp']) {
    const val = player.loadout[slot];
    if (!isRawName(val)) continue;
    total++;
    const slug = matchSkin(val);
    if (slug) {
      player.loadout[slot] = slug;
      changed = true;
      fixed++;
    } else {
      unfixable++;
      unmatched.push(val);
    }
  }

  if (changed) {
    writeFileSync(path, JSON.stringify(player, null, 2) + '\n');
  }
}

console.log(`\nFixed ${fixed}/${total} raw skin names (${unfixable} could not be matched)`);
if (unmatched.length > 0) {
  console.log('\nUnmatched:');
  [...new Set(unmatched)].sort().forEach(n => console.log(`  - ${n}`));
}
