/**
 * Cloudflare Pages Function: /api/all-players
 * Fetches ALL CS2 players from PandaScore (paginated).
 * Returns player names, teams, slugs for comparison with our database.
 *
 * Uses /csgo/players list endpoint.
 * Query params:
 *   ?pages=20  (max pages to fetch, default 15, max 30)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const errorHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers: errorHeaders });
  }

  try {
    const url = new URL(request.url);
    const maxPages = Math.min(parseInt(url.searchParams.get('pages') || '15', 10), 30);
    const perPage = 100;

    const allPlayers = [];
    let page = 1;

    while (page <= maxPages) {
      const apiUrl = `https://api.pandascore.co/csgo/players?per_page=${perPage}&page=${page}&sort=name&token=${apiKey}`;
      const res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 86400 },
      });

      if (!res.ok) {
        const errText = await res.text();
        // If we got some data already, return what we have
        if (allPlayers.length > 0) break;
        return new Response(JSON.stringify({ error: 'PandaScore API error', status: res.status, detail: errText }), { status: res.status, headers: errorHeaders });
      }

      const players = await res.json();
      if (!players.length) break;

      players.forEach(p => {
        allPlayers.push({
          id: p.id,
          name: p.name,
          slug: p.slug,
          firstName: p.first_name,
          lastName: p.last_name,
          nationality: p.nationality,
          age: p.age,
          image: p.image_url,
          role: p.role,
          active: p.active,
          team: p.current_team ? {
            id: p.current_team.id,
            name: p.current_team.name,
            slug: p.current_team.slug,
            acronym: p.current_team.acronym,
            image: p.current_team.image_url,
          } : null,
        });
      });

      if (players.length < perPage) break;
      page++;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    };

    return new Response(JSON.stringify({
      count: allPlayers.length,
      pages: page,
      players: allPlayers,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers: errorHeaders });
  }
}
