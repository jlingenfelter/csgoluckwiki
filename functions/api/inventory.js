/**
 * Cloudflare Pages Function — Steam Inventory Lookup
 *
 * Fetches a user's CS2 inventory from Steam Web API and calculates total value.
 *
 * Usage: GET /api/inventory?steamid=76561198000000000
 *
 * Returns: JSON with items array and summary stats
 */

export async function onRequestGet(context) {
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300, s-maxage=300',
  };

  try {
  const { request, env } = context;
  const url = new URL(request.url);

  const steamid = url.searchParams.get('steamid');

  const headers = jsonHeaders;

  // Handle OPTIONS for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (!steamid) {
    return new Response(
      JSON.stringify({ error: 'Missing "steamid" parameter' }),
      { status: 400, headers }
    );
  }

  const apiKey = env.STEAM_API_KEY || undefined;
    // Resolve input to a numeric Steam ID (17 digits)
    let numericSteamId = null;

    // Check if it's already a 17-digit Steam ID
    if (/^\d{17}$/.test(steamid)) {
      numericSteamId = steamid;
    }

    // Check if it's a full profile URL — extract ID or vanity name
    if (!numericSteamId) {
      const profileMatch = steamid.match(/steamcommunity\.com\/profiles\/(\d{17})/);
      if (profileMatch) {
        numericSteamId = profileMatch[1];
      }
    }

    if (!numericSteamId) {
      const vanityMatch = steamid.match(/steamcommunity\.com\/id\/([^\/\?\s]+)/);
      if (vanityMatch) {
        // Extract vanity name from URL and resolve it
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: 'Steam API key not configured. Custom URLs require the Steam API key. Try using a numeric Steam ID (17 digits) or a full profile URL with /profiles/.' }),
            { status: 500, headers }
          );
        }
        numericSteamId = await resolveVanityUrl(vanityMatch[1], apiKey);
      }
    }

    // If still not resolved, treat as a vanity name
    if (!numericSteamId) {
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Steam API key not configured. Usernames require the Steam API key. Try using a numeric Steam ID (17 digits) instead — you can find it on steamid.io.' }),
          { status: 500, headers }
        );
      }
      numericSteamId = await resolveVanityUrl(steamid, apiKey);
    }

    if (!numericSteamId) {
      return new Response(
        JSON.stringify({ error: 'Could not find user. Check your Steam ID or username.' }),
        { status: 404, headers }
      );
    }

    // Fetch inventory from Steam API
    const inventoryUrl = `https://steamcommunity.com/inventory/${numericSteamId}/730/2?l=english&count=5000`;

    const inventoryResponse = await fetch(inventoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (inventoryResponse.status === 403) {
      return new Response(
        JSON.stringify({ error: 'This inventory is private. The user needs to set their inventory to public in Steam Privacy Settings (Profile → Edit Profile → Privacy Settings → Set "Game details" to Public).' }),
        { status: 403, headers }
      );
    }

    if (inventoryResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: 'Steam rate limit reached. Please wait a minute and try again.' }),
        { status: 429, headers }
      );
    }

    if (!inventoryResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Steam returned status ${inventoryResponse.status}. Please try again later or check the Steam ID.` }),
        { status: 502, headers }
      );
    }

    let inventoryData;
    try {
      const responseText = await inventoryResponse.text();
      // Steam sometimes returns null or empty for private inventories
      if (!responseText || responseText === 'null') {
        return new Response(
          JSON.stringify({ error: 'This inventory appears to be private or empty. Make sure the Steam profile\'s "Game details" privacy setting is set to Public.' }),
          { status: 403, headers }
        );
      }
      inventoryData = JSON.parse(responseText);
    } catch (parseErr) {
      return new Response(
        JSON.stringify({ error: 'Steam returned an invalid response. This usually means the inventory is private. Set "Game details" to Public in Steam Privacy Settings.' }),
        { status: 403, headers }
      );
    }

    if (!inventoryData || (!inventoryData.assets && !inventoryData.descriptions)) {
      // Check for Steam's explicit error messages
      if (inventoryData?.error) {
        return new Response(
          JSON.stringify({ error: `Steam error: ${inventoryData.error}. Make sure "Game details" is set to Public in Steam Privacy Settings.` }),
          { status: 403, headers }
        );
      }
      return new Response(
        JSON.stringify({ error: 'No CS2 items found in this inventory. The inventory may be empty or private. Ensure "Game details" is set to Public in Steam Privacy Settings.' }),
        { status: 404, headers }
      );
    }

    // Map descriptions by classid + instanceid
    const descMap = {};
    const descriptions = inventoryData.descriptions || [];
    for (const desc of descriptions) {
      const key = `${desc.classid}_${desc.instanceid}`;
      descMap[key] = desc;
    }

    // First pass: collect weapon items
    const weaponItems = [];
    const assets = inventoryData.assets || [];

    for (const asset of assets) {
      const key = `${asset.classid}_${asset.instanceid}`;
      const desc = descMap[key];

      if (!desc) continue;

      const itemName = desc.market_hash_name || desc.name || 'Unknown Item';
      const wear = extractWear(desc.market_hash_name);
      const float = extractFloat(desc.tags);
      const category = extractCategory(desc);
      const appId = asset.appid;

      // Only include CS2 weapon items (app 730, context 2)
      if (String(appId) !== '730' || String(asset.contextid) !== '2') continue;

      // Skip non-weapon items (cases, keys, etc.)
      if (!isWeaponItem(itemName, category)) continue;

      weaponItems.push({ name: itemName, wear, float, category, assetId: asset.assetid });
    }

    // Batch fetch prices for all items at once
    const itemNames = [...new Set(weaponItems.map(i => i.name))];
    const priceMap = await fetchAllPrices(itemNames, env.PRICEMPIRE_API_KEY);

    // Second pass: build items array with prices
    const items = [];
    let totalValue = 0;

    for (const item of weaponItems) {
      const price = priceMap[item.name] || 0;
      items.push({
        name: item.name,
        wear: item.wear,
        float: item.float,
        category: item.category,
        price,
        assetId: item.assetId,
      });
      totalValue += price;
    }

    // Sort by price descending
    items.sort((a, b) => (b.price || 0) - (a.price || 0));

    return new Response(
      JSON.stringify({
        steamid: numericSteamId,
        items,
        totalValue: parseFloat(totalValue.toFixed(2)),
        itemCount: items.length,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers }
    );
  } catch (innerErr) {
    console.error('Inventory lookup error:', innerErr);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (innerErr.message || 'Unknown error') }),
      { status: 500, headers: jsonHeaders }
    );
  }
}

async function resolveVanityUrl(vanityUrl, apiKey) {
  try {
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${encodeURIComponent(vanityUrl)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.response?.success === 1) {
      return data.response.steamid;
    }
    return null;
  } catch (err) {
    console.error('Vanity URL resolution error:', err);
    return null;
  }
}

async function fetchAllPrices(itemNames, apiKey) {
  if (!apiKey || itemNames.length === 0) {
    return {};
  }

  const priceMap = {};

  try {
    // Batch fetch from PriceEmpire v4 prices endpoint
    const sourcesParam = 'buff,steam,skinport,csfloat,dmarket,waxpeer,skinbid,bitskins,lis-skins,cs-trade';
    const url = `https://api.pricempire.com/v4/paid/prices?app_id=730&sources=${sourcesParam}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (response.ok) {
      const data = await response.json();
      // data is keyed by market_hash_name
      for (const name of itemNames) {
        const itemPrices = data[name];
        if (itemPrices) {
          // Find lowest available price across sources
          let bestPrice = 0;
          for (const [source, priceData] of Object.entries(itemPrices)) {
            const price = priceData?.price;
            if (price && price > 0) {
              const usdPrice = price / 100; // PriceEmpire prices are in cents
              if (bestPrice === 0 || usdPrice < bestPrice) {
                bestPrice = usdPrice;
              }
            }
          }
          priceMap[name] = bestPrice;
        }
      }
    }
  } catch (err) {
    console.log('Batch price fetch failed:', err.message);
  }

  return priceMap;
}

function extractWear(marketHashName) {
  if (!marketHashName) return null;

  const wearPatterns = {
    'Factory New': 'Factory New',
    'Minimal Wear': 'Minimal Wear',
    'Field-Tested': 'Field-Tested',
    'Well-Worn': 'Well-Worn',
    'Battle-Scarred': 'Battle-Scarred',
  };

  for (const [pattern, label] of Object.entries(wearPatterns)) {
    if (marketHashName.includes(`(${pattern})`)) {
      return label;
    }
  }

  return null;
}

function extractFloat(tags) {
  if (!tags || !Array.isArray(tags)) return null;

  for (const tag of tags) {
    if (tag.category === 'Exterior' && tag.internal_name) {
      // Try to extract float from common tag names
      const floatMatch = tag.internal_name.match(/\d+\.?\d*/);
      if (floatMatch) {
        return parseFloat(floatMatch[0]);
      }
    }
  }

  return null;
}

function extractCategory(desc) {
  if (!desc.type) return 'Other';

  if (desc.type.includes('Knife')) return 'Knives';
  if (desc.type.includes('Pistol')) return 'Pistols';
  if (desc.type.includes('SMG')) return 'SMGs';
  if (desc.type.includes('Rifle')) return 'Rifles';
  if (desc.type.includes('Shotgun')) return 'Shotguns';
  if (desc.type.includes('Machine Gun')) return 'Heavy';
  if (desc.type.includes('Sniper')) return 'Snipers';
  if (desc.type.includes('Agent')) return 'Agents';
  if (desc.type.includes('Gloves')) return 'Gloves';

  return 'Other';
}

function isWeaponItem(itemName, category) {
  // Filter out non-weapon items
  const excludePatterns = [
    /case$/i,
    /key$/i,
    /sticker/i,
    /music kit/i,
    /spray/i,
    /graffiti/i,
    /patch/i,
    /container/i,
    /souvenir package/i,
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(itemName)) {
      return false;
    }
  }

  // Must be in a weapon category
  const weaponCategories = [
    'Pistols',
    'SMGs',
    'Rifles',
    'Shotguns',
    'Snipers',
    'Heavy',
    'Knives',
    'Agents',
    'Gloves',
  ];

  return weaponCategories.includes(category);
}

export async function onRequestPost(context) {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
