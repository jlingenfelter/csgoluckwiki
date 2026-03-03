/**
 * Cloudflare Pages Function — /api/patch-notes
 * Fetches latest CS2 patch notes from the Steam News API.
 * Filters for official Valve updates and returns clean JSON.
 * Cached for 1 hour at the edge.
 */

const STEAM_NEWS_URL = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/';
const APP_ID = 730; // CS2
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};

// Tags we assign based on content keywords
function autoTag(title, contents) {
  const text = (title + ' ' + contents).toLowerCase();
  const tags = [];

  if (/\bmap\b|de_|cs_|dust|mirage|inferno|nuke|anubis|ancient|overpass|vertigo|train/.test(text)) tags.push('map');
  if (/weapon|rifle|pistol|smg|awp|ak-?47|m4a[14]|deagle|glock|usp|recoil|damage|accuracy/.test(text)) tags.push('weapon');
  if (/economy|money|loss bonus|round loss|buy|cost|price change/.test(text)) tags.push('economy');
  if (/balance|adjust|tweak|nerf|buff|reduc|increas/.test(text)) tags.push('balance');
  if (/compet|matchmak|rank|elo|rating|premier|mm/.test(text)) tags.push('competitive');
  if (/anti.?cheat|vac|trust.?factor|ban|overwatch/.test(text)) tags.push('anticheat');
  if (/case|skin|collection|sticker|operation|pass|cosmetic|agent|music.?kit/.test(text)) tags.push('cosmetics');
  if (/ui|hud|menu|interface|overlay|scoreboard|inventory/.test(text)) tags.push('ui');
  if (/bug|fix|crash|exploit|issue|resolve|patch/.test(text)) tags.push('bugfix');
  if (/perform|fps|optimi|frame|render|shader|load/.test(text)) tags.push('performance');
  if (/audio|sound|music|voice/.test(text)) tags.push('audio');
  if (/server|network|tick|lag|latency|sub.?tick/.test(text)) tags.push('server');

  return tags.length > 0 ? tags : ['update'];
}

// Convert Steam HTML-ish content to cleaner text, extract bullet points
function parseChanges(contents) {
  if (!contents) return [];

  // Steam uses [list][*]...[/list] BBCode and sometimes HTML
  let text = contents;

  // Remove images and links markup
  text = text.replace(/\{STEAM_CLAN_IMAGE\}[^\s]*/g, '');
  text = text.replace(/\[img\].*?\[\/img\]/gi, '');
  text = text.replace(/\[url=.*?\](.*?)\[\/url\]/gi, '$1');
  text = text.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
  text = text.replace(/<img[^>]*>/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/?[^>]+>/g, '');

  // Extract list items from BBCode
  const listItems = [];
  const bbcodeListRegex = /\[\*\]\s*([^\[]*)/g;
  let match;
  while ((match = bbcodeListRegex.exec(text)) !== null) {
    const item = match[1].trim();
    if (item.length > 3) listItems.push(item);
  }

  if (listItems.length > 0) return listItems;

  // Fallback: split by newlines and dashes/bullets
  const lines = text.split(/\n/)
    .map(l => l.replace(/^[\s\-–—•*]+/, '').trim())
    .filter(l => l.length > 5 && !l.startsWith('[') && !l.startsWith('{'));

  // Skip the first line if it looks like a header/intro
  const changes = [];
  for (const line of lines) {
    // Skip very long paragraphs (probably prose, not changelog items)
    if (line.length > 300) continue;
    changes.push(line);
  }

  return changes.slice(0, 30); // Cap at 30 items
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const count = Math.min(parseInt(url.searchParams.get('count') || '30', 10), 100);

    // Fetch from Steam News API
    const steamUrl = `${STEAM_NEWS_URL}?appid=${APP_ID}&count=${count}&maxlength=0&format=json`;
    const res = await fetch(steamUrl, {
      headers: { 'User-Agent': 'CSDB.gg/1.0' },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Steam API error', status: res.status }), {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    const data = await res.json();
    const newsItems = data?.appnews?.newsitems || [];

    // Filter for official Valve posts (not community/workshop)
    const officialFeeds = [
      'steam_community_announcements',
      'SteamDB Unknown App 730',
    ];

    const updates = newsItems
      .filter(item => {
        const feed = item.feedname || '';
        const label = (item.feedlabel || '').toLowerCase();
        // Include official announcements, exclude community hub posts
        return officialFeeds.includes(feed) ||
               label.includes('community announcements') ||
               label.includes('product update') ||
               label.includes('patch');
      })
      .map(item => {
        const date = new Date(item.date * 1000).toISOString().split('T')[0];
        const changes = parseChanges(item.contents);
        const tags = autoTag(item.title, item.contents);

        return {
          date,
          title: item.title || 'CS2 Update',
          tags,
          changes,
          url: item.url || null,
          steamId: item.gid || null,
        };
      });

    return new Response(JSON.stringify({ updates, count: updates.length, fetched: new Date().toISOString() }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch patch notes', detail: err.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}
