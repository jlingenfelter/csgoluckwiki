/**
 * Cloudflare Pages Function: /api/match-detail
 * Fetches detailed match data including individual game/map results.
 *
 * Query params:
 *   ?id=12345          (PandaScore match ID)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, s-maxage=300',
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers });
  }

  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get('id');

    if (!matchId) {
      return new Response(JSON.stringify({ error: 'Provide ?id= parameter' }), { status: 400, headers });
    }

    // Fetch match + games in parallel — use generic /matches endpoint
    // to avoid degraded data from the /csgo/ specific endpoints.
    const [matchRes, gamesRes] = await Promise.all([
      fetch(`https://api.pandascore.co/matches/${matchId}?token=${apiKey}`, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 300 },
      }),
      fetch(`https://api.pandascore.co/matches/${matchId}/games?token=${apiKey}`, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 300 },
      }),
    ]);

    if (!matchRes.ok) {
      return new Response(JSON.stringify({ error: 'Match not found', status: matchRes.status }), { status: matchRes.status, headers });
    }

    const match = await matchRes.json();
    const games = gamesRes.ok ? await gamesRes.json() : [];

    const result = {
      id: match.id,
      name: match.name,
      slug: match.slug,
      status: match.status,
      matchType: match.match_type,
      numberOfGames: match.number_of_games,
      beginAt: match.begin_at,
      endAt: match.end_at,
      winnerId: match.winner_id,
      forfeit: match.forfeit,
      draw: match.draw,
      opponents: (match.opponents || []).map(o => ({
        id: o.opponent?.id,
        name: o.opponent?.name,
        acronym: o.opponent?.acronym,
        location: o.opponent?.location,
        image: o.opponent?.image_url,
      })),
      results: match.results || [],
      tournament: {
        id: match.tournament?.id,
        name: match.tournament?.name,
        tier: match.tournament?.tier,
        prizepool: match.tournament?.prizepool,
      },
      league: {
        id: match.league?.id,
        name: match.league?.name,
        image: match.league?.image_url,
      },
      serie: {
        id: match.serie?.id,
        name: match.serie?.full_name || match.serie?.name,
      },
      streams: (match.streams_list || []).filter(s => s.main).map(s => ({
        language: s.language,
        url: s.raw_url,
        embed: s.embed_url,
      })),
      games: games.map(g => ({
        id: g.id,
        position: g.position,
        status: g.status,
        complete: g.complete,
        map: g.map ? { id: g.map.id, name: g.map.name, image: g.map.image_url } : null,
        winnerId: g.winner?.id,
        winnerName: g.winner?.name,
        beginAt: g.begin_at,
        endAt: g.end_at,
        length: g.length,
        teams: (g.teams || []).map(t => ({
          id: t.team?.id,
          name: t.team?.name,
          firstHalfScore: t.first_half_score,
          secondHalfScore: t.second_half_score,
          overtimeScore: t.overtime_score,
          score: t.score,
        })),
        rounds: g.rounds ? g.rounds.length : 0,
      })),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
