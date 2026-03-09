#!/usr/bin/env node
/**
 * Cleanup scraped player data:
 * 1. Identify and remove non-CS2 players (VALORANT pages)
 * 2. Fix names with title garbage
 * 3. Fix birthday field issues
 * 4. Report stats
 */

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const PLAYERS_DIR = join(process.cwd(), 'src/data/players');
const files = readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json'));

// Known VALORANT-only players that should be removed from CS2 database
// These are players whose ProSettings page redirects to VALORANT
const VALORANT_ONLY = [
  'aspas',      // VALORANT pro (Leviatán)
];

let fixed = 0;
let removed = 0;
const valorantPlayers = [];
const csValPlayers = []; // Players who played both CS and VALORANT

files.forEach(f => {
  const filePath = join(PLAYERS_DIR, f);
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  let changed = false;

  // Check for VALORANT in name
  if (data.name && data.name.includes('VALORANT')) {
    const slug = f.replace('.json', '');
    // Extract clean name from the title
    const cleanName = data.name
      .replace(/\s+VALORANT.*$/i, '')
      .replace(/&amp;/g, '&')
      .trim();

    // These players played CS before moving to VALORANT
    // They should be kept but with clean name and note they moved to VALORANT
    const csVetsTurnedVal = [
      'seangares', 'rubino', 'vanity', 'xeta', 'relyks', 'cutler',
      'azk', 'mixwell', 'sick', 'fns', 'dimasick', 'vice', 'hazed'
    ];

    if (csVetsTurnedVal.includes(slug)) {
      // Keep them, but fix the name and mark as Retired from CS
      data.name = cleanName;
      data.team = 'Retired';
      data.bio = 'Former CS professional who transitioned to VALORANT.';
      changed = true;
      csValPlayers.push(slug);
      console.log(`  [FIX] ${slug}: name="${cleanName}", team=Retired (CS→VALORANT)`);
    } else {
      // Pure VALORANT player - remove
      unlinkSync(filePath);
      removed++;
      valorantPlayers.push(slug);
      console.log(`  [DEL] ${slug}: VALORANT-only player removed`);
      return;
    }
  }

  // Fix bad names with ProSettings title text
  if (data.name && (data.name.includes('ProSettings') || data.name.includes('&amp;'))) {
    const cleanName = data.name
      .replace(/\s+(CS2|CSGO|CS:GO|VALORANT|Fortnite).*$/i, '')
      .replace(/&amp;/g, '&')
      .trim();
    data.name = cleanName;
    changed = true;
    console.log(`  [FIX] ${f}: name cleaned to "${cleanName}"`);
  }

  // Fix birthday = "Birthday" (regex matched label instead of value)
  if (data.birthday === 'Birthday') {
    delete data.birthday;
    changed = true;
  }

  // Fix edpi if 0 but dpi and sens are set
  if (data.edpi === 0 && data.dpi > 0 && data.sens > 0) {
    data.edpi = Math.round(data.dpi * data.sens);
    changed = true;
  }

  // Fix role: check if name suggests AWPer
  const awpers = ['kennys', 'guardian', 'fallen', 'osee', 'sh1ro', 'zywoo', 'm0nesy',
                   'nifty', 'mou', 'fox', 'cerq', 'jame', 'syrson', 'device'];
  const slug = f.replace('.json', '');
  if (awpers.includes(slug) && data.role === 'Rifler') {
    data.role = 'AWPer';
    data.style = 'AWPer';
    changed = true;
  }

  // Check if IGL
  const igls = ['karrigan', 'gla1ve', 'aleksib', 'hooxi', 'fallen', 'zeus', 'seangares',
                'daps', 'golden', 'xizt', 'neo', 'msl', 'stanislaw', 'fns', 'cadian'];
  if (igls.includes(slug) && data.role === 'Rifler') {
    data.role = 'IGL';
    data.style = 'IGL';
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    fixed++;
  }
});

// Count final total
const finalFiles = readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json'));

console.log('\n=== CLEANUP SUMMARY ===');
console.log(`Total files: ${files.length}`);
console.log(`Fixed: ${fixed}`);
console.log(`Removed (VALORANT-only): ${removed} - ${valorantPlayers.join(', ')}`);
console.log(`CS→VALORANT (kept as Retired): ${csValPlayers.length} - ${csValPlayers.join(', ')}`);
console.log(`Final player count: ${finalFiles.length}`);
