/**
 * Cloudflare Pages Function: /api/skin-prices
 * Fetches current skin prices from PriceEmpire for case simulator profit tracking
 * Returns { prices: { "weapon|name": { buff163: cents, steam: cents, ... } } }
 * Caches for 1 hour since prices change frequently
 */

export async function onRequestGet(context) {
  const { env } = context;
  const apiKey = env.PRICEMPIRE_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache 1h
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No API key configured' }), { status: 500, headers });
  }

  try {
    // Fetch all item prices from PriceEmpire v3
    // This returns prices in cents for all CS2 items
    const url = `https://api.pricempire.com/v3/items/prices?api_key=${apiKey}&currency=USD&app_id=730`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 3600 },
    });

    if (!res.ok) {
      // Try v4 endpoint as fallback
      const url2 = `https://api.pricempire.com/v4/paid/items/prices?api_key=${apiKey}&currency=USD&app_id=730`;
      const res2 = await fetch(url2, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 3600 },
      });
      if (!res2.ok) {
        return new Response(JSON.stringify({ error: `PriceEmpire API error: ${res2.status}` }), { status: 502, headers });
      }
      const data2 = await res2.json();
      return processAndReturn(data2, headers);
    }

    const data = await res.json();
    return processAndReturn(data, headers);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}

function processAndReturn(data, headers) {
  const prices = {};

  // Handle various response formats from PriceEmpire
  if (Array.isArray(data)) {
    // Array of items
    for (const item of data) {
      const name = item.market_hash_name || item.name;
      if (!name) continue;
      const key = name.toLowerCase();
      // Extract prices from provider data
      const priceObj = extractPrices(item);
      if (Object.keys(priceObj).length > 0) {
        prices[key] = priceObj;
      }
    }
  } else if (typeof data === 'object') {
    // Object keyed by item name
    for (const [name, itemData] of Object.entries(data)) {
      if (!name || typeof itemData !== 'object') continue;
      const key = name.toLowerCase();
      const priceObj = extractPrices(itemData);
      if (Object.keys(priceObj).length > 0) {
        prices[key] = priceObj;
      }
    }
  }

  return new Response(JSON.stringify({ prices, count: Object.keys(prices).length }), { headers });
}

function extractPrices(item) {
  const result = {};

  // Direct price fields
  if (item.buff163) result.buff163 = typeof item.buff163 === 'number' ? item.buff163 : item.buff163?.price || 0;
  if (item.steam) result.steam = typeof item.steam === 'number' ? item.steam : item.steam?.price || 0;
  if (item.skinport) result.skinport = typeof item.skinport === 'number' ? item.skinport : item.skinport?.price || 0;
  if (item.csfloat) result.csfloat = typeof item.csfloat === 'number' ? item.csfloat : item.csfloat?.price || 0;

  // Nested prices object
  if (item.prices && typeof item.prices === 'object') {
    for (const [provider, pData] of Object.entries(item.prices)) {
      const val = typeof pData === 'number' ? pData : pData?.price || pData?.avg || 0;
      if (val > 0) result[provider] = val;
    }
  }

  // Provider data array
  if (item.providers && Array.isArray(item.providers)) {
    for (const p of item.providers) {
      if (p.name && p.price > 0) result[p.name] = p.price;
    }
  }

  // If item itself has a price field
  if (item.price && typeof item.price === 'number') {
    result.default = item.price;
  }

  return result;
}
