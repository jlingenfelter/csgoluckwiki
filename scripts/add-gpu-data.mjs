#!/usr/bin/env node
/**
 * Add GPU data from prosettings extract to existing player JSON files.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PLAYERS_DIR = join(PROJECT_ROOT, 'src', 'data', 'players');
const INPUT_FILE = join(process.env.HOME, 'Downloads', 'prosettings-players.json');

function makeSlug(raw) {
  let slug = (raw.u || '').replace(/.*\/players\//, '').replace(/\/#?$/, '');
  if (!slug) {
    slug = raw.n.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  return slug;
}

function main() {
  if (!existsSync(INPUT_FILE)) {
    console.error('Input file not found:', INPUT_FILE);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${raw.length} players from prosettings data`);

  let updated = 0;
  const slugsSeen = new Set();

  for (const p of raw) {
    let slug = makeSlug(p);
    if (slugsSeen.has(slug)) {
      const teamSuffix = (p.t || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
      slug = `${slug}-${teamSuffix}`;
      if (slugsSeen.has(slug)) slug = `${slug}-2`;
    }
    slugsSeen.add(slug);

    if (!p.g || p.g.trim() === '') continue;

    const filePath = join(PLAYERS_DIR, `${slug}.json`);
    if (!existsSync(filePath)) continue;

    const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (existing.gpu) continue; // Already has GPU data

    existing.gpu = p.g.trim();
    writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n');
    updated++;
  }

  console.log(`Added GPU data to ${updated} player files`);
}

main();
