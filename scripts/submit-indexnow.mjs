/**
 * IndexNow + Sitemap Ping — Post-deploy indexing script
 *
 * Submits all site URLs to Bing/Yandex via IndexNow API,
 * then pings Google and Bing with the sitemap URL.
 *
 * Usage: node scripts/submit-indexnow.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

const SITE = 'https://csdb.gg';
const INDEXNOW_KEY = '5fcd2860c752f714c5baaa6b8d97f8a3';

// ── Extract URLs from sitemap ───────────────────────────────────────────────
function extractUrlsFromSitemap() {
  try {
    const xml = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf-8');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    console.log(`📋 Found ${urls.length} URLs in sitemap`);
    return urls;
  } catch (err) {
    console.error('❌ Could not read sitemap:', err.message);
    return [];
  }
}

// ── Submit to IndexNow (Bing + Yandex) ─────────────────────────────────────
async function submitIndexNow(urls) {
  // IndexNow supports batch submission of up to 10,000 URLs
  const BATCH_SIZE = 10000;
  const engines = [
    'https://api.indexnow.org/indexnow',
  ];

  for (const engine of engines) {
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const batch = urls.slice(i, i + BATCH_SIZE);
      const body = {
        host: 'csdb.gg',
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: batch,
      };

      try {
        const res = await fetch(engine, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok || res.status === 200 || res.status === 202) {
          console.log(`✅ IndexNow (${engine}): Submitted ${batch.length} URLs (${res.status})`);
        } else {
          const text = await res.text().catch(() => '');
          console.log(`⚠️ IndexNow (${engine}): ${res.status} — ${text.substring(0, 200)}`);
        }
      } catch (err) {
        console.log(`❌ IndexNow (${engine}): ${err.message}`);
      }
    }
  }
}

// ── Ping search engine sitemaps ─────────────────────────────────────────────
async function pingSitemaps() {
  const sitemapUrl = `${SITE}/sitemap-index.xml`;
  const pingUrls = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  ];

  for (const url of pingUrls) {
    try {
      const res = await fetch(url);
      console.log(`✅ Sitemap ping: ${url.split('?')[0].split('/').pop()} — ${res.status}`);
    } catch (err) {
      console.log(`⚠️ Sitemap ping failed: ${err.message}`);
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Post-deploy indexing for csdb.gg\n');

  const urls = extractUrlsFromSitemap();
  if (urls.length === 0) {
    console.log('No URLs found. Build the site first (npm run build).');
    return;
  }

  console.log(`\n📤 Submitting ${urls.length} URLs to IndexNow...`);
  await submitIndexNow(urls);

  console.log('\n📡 Pinging search engine sitemaps...');
  await pingSitemaps();

  console.log('\n✅ Done! URLs submitted for indexing.');
  console.log('   Google: Submit sitemap manually at https://search.google.com/search-console');
  console.log('   Bing: Verify site at https://www.bing.com/webmasters');
}

main().catch(console.error);
