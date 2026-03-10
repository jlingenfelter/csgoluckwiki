/**
 * Cloudflare Pages Function: /api/matches
 * Proxies PandaScore CS2 match data — live, upcoming, and past matches.
 * Keeps API key server-side. Caches 60s for live data, 5min for past.
 *
 * Query params:
 *   ?type=running|upcoming|past  (default: upcoming)
 *   ?per_page=5                  (default: 10, max 25)
 *   ?page=1                      (default: 1)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'upcoming';
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '10', 10), 25);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    // Validate type
    const validTypes = ['running', 'upcoming', 'past'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid type. Use: running, upcoming, past' }), { status: 400, headers });
    }

    // Build PandaScore URL — use /csgo/ prefix for list endpoints.
    // For past matches, use filter[status]=finished instead of /past endpoint
    // because /past returns canceled matches with null end_at that sort to the top.
    let apiUrl;
    if (type === 'past') {
      apiUrl = `https://api.pandascore.co/csgo/matches?filter[status]=finished&per_page=${perPage}&page=${page}&sort=-scheduled_at&token=${apiKey}`;
    } else {
      apiUrl = `https://api.pandascore.co/csgo/matches/${type}?per_page=${perPage}&page=${page}&sort=begin_at&token=${apiKey}`;
    }

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: type === 'running' ? 60 : type === 'upcoming' ? 120 : 300 },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'PandaScore API error', status: res.status, detail: errText }), { status: res.status, headers });
    }

    const matches = await res.json();

    // Slim down the response — only send what the frontend needs
    const slimMatches = matches.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      status: m.status,
      matchType: m.match_type,
      numberOfGames: m.number_of_games,
      beginAt: m.begin_at,
      endAt: m.end_at,
      scheduledAt: m.scheduled_at,
      forfeit: m.forfeit,
      draw: m.draw,
      winnerId: m.winner_id,
      opponents: (m.opponents || []).map((o) => ({
        id: o.opponent?.id,
        name: o.opponent?.name,
        acronym: o.opponent?.acronym,
        location: o.opponent?.location,
        image: o.opponent?.image_url,
        imageDark: o.opponent?.dark_mode_image_url,
      })),
      results: m.results || [],
      tournament: {
        id: m.tournament?.id,
        name: m.tournament?.name,
        tier: m.tournament?.tier,
        prizepool: m.tournament?.prizepool,
        country: m.tournament?.country,
      },
      league: {
        id: m.league?.id,
        name: m.league?.name,
        image: m.league?.image_url,
      },
      serie: {
        id: m.serie?.id,
        name: m.serie?.full_name || m.serie?.name,
        year: m.serie?.year,
      },
      streams: (m.streams_list || []).filter((s) => s.main).map((s) => ({
        language: s.language,
        url: s.raw_url,
        embed: s.embed_url,
      })),
    }));

    // Cache headers: shorter for live, longer for past
    const cacheSec = type === 'running' ? 60 : type === 'upcoming' ? 120 : 300;
    headers['Cache-Control'] = `public, max-age=${cacheSec}, s-maxage=${cacheSec}`;

    return new Response(JSON.stringify({ type, page, perPage, count: slimMatches.length, matches: slimMatches }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
