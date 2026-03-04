#!/usr/bin/env node
/**
 * Replace placeholder player images with real photos from ProSettings.net
 * Only replaces files that are exactly 184072 bytes (the placeholder size).
 */

import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, '..', 'public', 'images', 'players');
const PLACEHOLDER_SIZE = 184072;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const DELAY_MS = 300;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Get all placeholder images
const files = readdirSync(IMAGES_DIR).filter(f => f.endsWith('.webp'));
const placeholders = files.filter(f => {
  const stat = statSync(join(IMAGES_DIR, f));
  return stat.size === PLACEHOLDER_SIZE;
});

console.log(`Found ${placeholders.length} placeholder images out of ${files.length} total`);

let replaced = 0;
let failed = 0;

for (let i = 0; i < placeholders.length; i++) {
  const file = placeholders[i];
  const slug = basename(file, '.webp');

  // Try ProSettings CDN with WebP conversion and resize
  const url = `https://prosettings.net/cdn-cgi/image/width=200,format=webp,fit=contain,quality=80/wp-content/uploads/${slug}.png`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      // Only save if it's a real image (not another placeholder or error page)
      if (buffer.length > 500 && buffer.length < 150000 && buffer.length !== PLACEHOLDER_SIZE) {
        writeFileSync(join(IMAGES_DIR, file), buffer);
        replaced++;
        if (replaced % 50 === 0) {
          console.log(`  ✅ Replaced ${replaced}/${placeholders.length}...`);
        }
      } else {
        failed++;
      }
    } else {
      failed++;
    }
  } catch (err) {
    failed++;
  }

  await sleep(DELAY_MS);
}

console.log(`\n✅ Done: ${replaced} replaced, ${failed} failed/skipped`);
