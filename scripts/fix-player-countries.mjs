#!/usr/bin/env node

/**
 * fix-player-countries.mjs
 *
 * Fixes pro player country and flag data in the CSDB1.gg project
 * by copying correct country/flag values from the csgoluck-wiki project.
 *
 * The csgoluck-wiki already has correct nationality data for all 868 players,
 * while CSDB1.gg has "Unknown" / white flag for 864 of them.
 *
 * Usage:  cd /Users/josh/csgoluck-wiki && node scripts/fix-player-countries.mjs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const WIKI_PLAYERS_DIR = '/Users/josh/csgoluck-wiki/src/data/players';
const CSDB_PLAYERS_DIR = '/Users/josh/CSDB1.gg/src/data/players';

async function main() {
  // 1. Build a lookup map from the wiki (source of truth)
  const wikiFiles = await readdir(WIKI_PLAYERS_DIR);
  const jsonFiles = wikiFiles.filter(f => f.endsWith('.json'));

  console.log(`[wiki] Found ${jsonFiles.length} player JSON files (source of truth)`);

  const wikiData = new Map(); // slug -> { country, flag }

  for (const file of jsonFiles) {
    const raw = await readFile(join(WIKI_PLAYERS_DIR, file), 'utf-8');
    const player = JSON.parse(raw);
    wikiData.set(player.slug, {
      country: player.country,
      flag: player.flag,
    });
  }

  console.log(`[wiki] Loaded country/flag data for ${wikiData.size} players\n`);

  // 2. Read and update each CSDB player file
  const csdbFiles = await readdir(CSDB_PLAYERS_DIR);
  const csdbJsonFiles = csdbFiles.filter(f => f.endsWith('.json'));

  console.log(`[csdb] Found ${csdbJsonFiles.length} player JSON files to update\n`);

  let updated = 0;
  let alreadyCorrect = 0;
  let notFoundInWiki = 0;
  let errors = 0;

  for (const file of csdbJsonFiles) {
    const filePath = join(CSDB_PLAYERS_DIR, file);
    try {
      const raw = await readFile(filePath, 'utf-8');
      const player = JSON.parse(raw);

      // Look up correct data from wiki
      const wikiInfo = wikiData.get(player.slug);

      if (!wikiInfo) {
        // Try matching by filename (without .json)
        const slugFromFile = file.replace('.json', '');
        const wikiInfoByFile = wikiData.get(slugFromFile);
        if (!wikiInfoByFile) {
          console.log(`  [skip] ${player.slug} (${file}) — not found in wiki data`);
          notFoundInWiki++;
          continue;
        }
        // Use the file-based match
        if (player.country === wikiInfoByFile.country && player.flag === wikiInfoByFile.flag) {
          alreadyCorrect++;
          continue;
        }
        player.country = wikiInfoByFile.country;
        player.flag = wikiInfoByFile.flag;
      } else {
        // Check if already correct
        if (player.country === wikiInfo.country && player.flag === wikiInfo.flag) {
          alreadyCorrect++;
          continue;
        }

        // Update the fields
        player.country = wikiInfo.country;
        player.flag = wikiInfo.flag;
      }

      // Write back with 2-space indent to match existing format
      const output = JSON.stringify(player, null, 2) + '\n';
      await writeFile(filePath, output, 'utf-8');
      updated++;

      if (updated <= 10) {
        console.log(`  [updated] ${player.slug}: ${player.country} ${player.flag}`);
      }
    } catch (err) {
      console.error(`  [error] ${file}: ${err.message}`);
      errors++;
    }
  }

  if (updated > 10) {
    console.log(`  ... and ${updated - 10} more`);
  }

  console.log('\n--- Summary ---');
  console.log(`  Total CSDB files:    ${csdbJsonFiles.length}`);
  console.log(`  Updated:             ${updated}`);
  console.log(`  Already correct:     ${alreadyCorrect}`);
  console.log(`  Not found in wiki:   ${notFoundInWiki}`);
  console.log(`  Errors:              ${errors}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
