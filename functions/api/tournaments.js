/**
 * Cloudflare Pages Function: /api/tournaments
 * Proxies PandaScore CS2 tournament data — running and upcoming.
 *
 * Query params:
 *   ?type=running|upcoming|past  (default: running)
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
    const type = url.searchParams.get('type') || 'running';
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '10', 10), 25);
    const page = parseInt(url.searchParams.get('page') || '1', 10);

    const validTypes = ['running', 'upcoming', 'past'];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid type. Use: running, upcoming, past' }), { status: 400, headers });
    }

    const apiUrl = `https://api.pandascore.co/csgo/tournaments/${type}?per_page=${perPage}&page=${page}&sort=${type === 'past' ? '-end_at' : 'begin_at'}&token=${apiKey}`;

    const res = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 300 },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: 'PandaScore API error', status: res.status, detail: errText }), { status: res.status, headers });
    }

    const tournaments = await res.json();

    const slimTournaments = tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      type: t.type,
      country: t.country,
      tier: t.tier,
      prizepool: t.prizepool,
      beginAt: t.begin_at,
      endAt: t.end_at,
      hasBracket: t.has_bracket,
      region: t.region,
      winnerId: t.winner_id,
      league: {
        id: t.league?.id,
        name: t.league?.name,
        image: t.league?.image_url,
      },
      serie: {
        id: t.serie?.id,
        name: t.serie?.full_name || t.serie?.name,
        year: t.serie?.year,
      },
      matches: (t.matches || []).map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
        beginAt: m.begin_at,
        endAt: m.end_at,
        winnerId: m.winner_id,
        numberOfGames: m.number_of_games,
        matchType: m.match_type,
        forfeit: m.forfeit,
        streams: (m.streams_list || []).filter((s) => s.main).map((s) => ({
          language: s.language,
          url: s.raw_url,
        })),
      })),
    }));

    headers['Cache-Control'] = 'public, max-age=300, s-maxage=300';

    return new Response(JSON.stringify({ type, page, perPage, count: slimTournaments.length, tournaments: slimTournaments }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
