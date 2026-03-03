/**
 * Cloudflare Pages Function: /api/skin-images
 * Fetches skin images from PriceEmpire for case simulator
 * Returns { images: { "weapon|name": "url", ... } }
 * Caches aggressively since skin images rarely change
 */

const PE_CDN = 'https://cs2-cdn.pricempire.com';

function buildCdnUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const clean = path.replace(/\.(avif|png|jpg)$/i, '');
  return `${PE_CDN}${clean}_png_256.png`;
}

export async function onRequestGet(context) {
  const { env } = context;
  const apiKey = env.PRICEMPIRE_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache 24h
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No API key configured' }), { status: 500, headers });
  }

  try {
    // Fetch all item images from PriceEmpire
    const url = `https://api.pricempire.com/v4/paid/items/images?app_id=730&api_key=${apiKey}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 86400 }, // Cache at Cloudflare edge for 24h
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `PriceEmpire API error: ${res.status}` }), { status: 502, headers });
    }

    const data = await res.json();
    const images = {};

    // PriceEmpire v4 images API can return different formats:
    // 1. { images: { "name": { cdn, steam } } }  — object values
    // 2. { images: { "weapon|skin (wear)": "url" } } — string values
    const source = data?.images || data;
    if (source && typeof source === 'object') {
      for (const [name, imgVal] of Object.entries(source)) {
        // Handle both string URLs and object { cdn, steam } values
        let url = null;
        if (typeof imgVal === 'string' && imgVal.length > 5) {
          url = imgVal.startsWith('http') ? imgVal : buildCdnUrl(imgVal);
        } else if (imgVal && typeof imgVal === 'object') {
          const cdnPath = imgVal.cdn || imgVal.steam || null;
          if (cdnPath) url = buildCdnUrl(cdnPath);
        }
        if (!url) continue;

        // Clean name: strip StatTrak™/Souvenir prefix and (Wear) suffix
        // Keys can be "AK-47 | Inheritance (Field-Tested)" or "ak-47|inheritance (field-tested)"
        const cleanName = name
          .replace(/^stattrak™?\s*/i, '')
          .replace(/^souvenir\s*/i, '')
          .replace(/\s*\([^)]+\)\s*$/, '');

        // Split on " | " or "|" (with or without spaces)
        const parts = cleanName.split(/\s*\|\s*/);
        if (parts.length >= 2) {
          const weapon = parts[0].trim().toLowerCase();
          const skin = parts.slice(1).join('|').trim().toLowerCase();
          const key = `${weapon}|${skin}`;
          // Only store if we don't already have this base skin (first one wins)
          if (!images[key]) {
            images[key] = url;
            const normalized = key.replace(/[^a-z0-9|]/g, '');
            if (!images[normalized]) images[normalized] = url;
          }
        }
      }
    }

    return new Response(JSON.stringify({ images, count: Object.keys(images).length }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
