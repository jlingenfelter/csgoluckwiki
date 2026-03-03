/**
 * Cloudflare Pages Function — Price History Proxy
 *
 * Proxies requests to PriceEmpire's price history API so the API key stays server-side.
 * Extracts only the matching item's data from the response to keep payloads small.
 *
 * Usage: GET /api/price-history?name=AK-47+|+Redline+(Field-Tested)&source=steam
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const name = url.searchParams.get('name');
  const source = url.searchParams.get('source') || 'steam';
  const debug = url.searchParams.get('debug') === '1';

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  };

  if (!name) {
    return new Response(JSON.stringify({ error: 'Missing "name" parameter' }), { status: 400, headers });
  }

  const apiKey = env.PRICEMPIRE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers });
  }

  // Try multiple endpoint formats
  const endpoints = [
    // v3 with source param
    `https://api.pricempire.com/v3/items/prices/history?source=${encodeURIComponent(source)}&market_hash_name=${encodeURIComponent(name)}`,
    // v3 without source (get all sources)
    `https://api.pricempire.com/v3/items/prices/history?market_hash_name=${encodeURIComponent(name)}`,
    // v4 paid endpoint
    `https://api.pricempire.com/v4/paid/items/prices/history?app_id=730&provider_key=${encodeURIComponent(source)}&currency=USD&market_hash_names=${encodeURIComponent(name)}`,
    // v4 without provider_key
    `https://api.pricempire.com/v4/paid/items/prices/history?app_id=730&currency=USD&market_hash_names=${encodeURIComponent(name)}`,
    // v3 item history (singular item endpoint)
    `https://api.pricempire.com/v3/items/history?source=${encodeURIComponent(source)}&market_hash_name=${encodeURIComponent(name)}`,
  ];

  const debugLog = [];

  for (const apiUrl of endpoints) {
    try {
      const resp = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      const body = await resp.text();

      if (debug) {
        debugLog.push({ url: apiUrl, status: resp.status, bodyLength: body.length, bodyPreview: body.substring(0, 300) });
      }

      if (resp.ok && body && body.length > 5) {
        try {
          const parsed = JSON.parse(body);
          if (!parsed) continue;

          // If the response is already an array of data points, return directly
          if (Array.isArray(parsed) && parsed.length > 0) {
            return new Response(body, { status: 200, headers });
          }

          // If it's an object, try to extract the matching item's data
          if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            let itemData = null;

            // Try exact match first
            if (parsed[name]) {
              itemData = parsed[name];
            } else {
              // Try case-insensitive match
              const nameLower = name.toLowerCase();
              for (const key of Object.keys(parsed)) {
                if (key.toLowerCase() === nameLower) {
                  itemData = parsed[key];
                  break;
                }
              }
            }

            if (itemData) {
              // If itemData is { timestamp: price } format, convert to array
              // NOTE: PriceEmpire returns prices in cents — divide by 100 for dollars
              if (typeof itemData === 'object' && !Array.isArray(itemData)) {
                const entries = Object.entries(itemData);
                if (entries.length > 0 && typeof entries[0][1] === 'number') {
                  // Detect if prices are in cents: if median price > 100, likely cents
                  const samplePrices = entries.slice(0, 20).map(([, p]) => p);
                  const median = samplePrices.sort((a, b) => a - b)[Math.floor(samplePrices.length / 2)];
                  const isCents = median > 100; // $1+ items in cents will be > 100

                  const points = entries
                    .map(([ts, price]) => ({
                      date: parseInt(ts),
                      price: isCents ? Math.round(price) / 100 : price
                    }))
                    .sort((a, b) => a.date - b.date);
                  return new Response(JSON.stringify(points), { status: 200, headers });
                }
              }

              // If it's already an array, return it
              if (Array.isArray(itemData) && itemData.length > 0) {
                return new Response(JSON.stringify(itemData), { status: 200, headers });
              }
            }

            // If no matching item found but response has data,
            // check if it has nested source data like { source: { item: data } }
            if (parsed[source] && typeof parsed[source] === 'object') {
              const sourceData = parsed[source];
              const srcItem = sourceData[name] || Object.values(sourceData)[0];
              if (srcItem) {
                if (typeof srcItem === 'object' && !Array.isArray(srcItem)) {
                  const entries = Object.entries(srcItem);
                  if (entries.length > 0 && typeof entries[0][1] === 'number') {
                    const samplePrices = entries.slice(0, 20).map(([, p]) => p);
                    const median = samplePrices.sort((a, b) => a - b)[Math.floor(samplePrices.length / 2)];
                    const isCents = median > 100;

                    const points = entries
                      .map(([ts, price]) => ({
                        date: parseInt(ts),
                        price: isCents ? Math.round(price) / 100 : price
                      }))
                      .sort((a, b) => a.date - b.date);
                    return new Response(JSON.stringify(points), { status: 200, headers });
                  }
                }
                if (Array.isArray(srcItem) && srcItem.length > 0) {
                  return new Response(JSON.stringify(srcItem), { status: 200, headers });
                }
              }
            }

            // If we got a huge response (25K+ items) without finding our item, skip to next endpoint
            if (Object.keys(parsed).length > 100 && !itemData) {
              if (debug) debugLog.push({ note: `Large response (${Object.keys(parsed).length} keys) but target item not found` });
              continue;
            }

            // Small response with data — return it (might be item-specific already)
            if (Object.keys(parsed).length <= 100) {
              return new Response(body, { status: 200, headers });
            }
          }
        } catch (e) {
          if (debug) debugLog.push({ parseError: e.message });
        }
      }
    } catch (err) {
      if (debug) {
        debugLog.push({ url: apiUrl, error: err.message });
      }
    }
  }

  // If debug mode, return all attempts
  if (debug) {
    return new Response(JSON.stringify({ error: 'All endpoints failed or item not found', attempts: debugLog }, null, 2), { status: 404, headers });
  }

  return new Response(JSON.stringify({ error: 'Price history not available' }), { status: 404, headers });
}
