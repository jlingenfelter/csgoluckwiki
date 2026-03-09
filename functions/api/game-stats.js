/**
 * Cloudflare Pages Function: /api/game-stats
 * Fetches per-player stats for a specific game/map within a match.
 *
 * Query params:
 *   ?id=12345          (PandaScore game ID)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers });
  }

  try {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('id');

    if (!gameId) {
      return new Response(JSON.stringify({ error: 'Provide ?id= parameter' }), { status: 400, headers });
    }

    // Use /csgo/ prefix for individual game lookups — generic /games/{id} returns 404.
    const gameRes = await fetch(
      `https://api.pandascore.co/csgo/games/${gameId}?token=${apiKey}`,
      { headers: { 'Accept': 'application/json' }, cf: { cacheTtl: 3600 } }
    );

    if (!gameRes.ok) {
      return new Response(JSON.stringify({ error: 'Game not found', status: gameRes.status }), { status: gameRes.status, headers });
    }

    const game = await gameRes.json();

    const result = {
      id: game.id,
      position: game.position,
      status: game.status,
      complete: game.complete,
      length: game.length,
      beginAt: game.begin_at,
      endAt: game.end_at,
      map: game.map ? { id: game.map.id, name: game.map.name, image: game.map.image_url } : null,
      winnerId: game.winner?.id,
      winnerName: game.winner?.name,
      teams: (game.teams || []).map(t => ({
        id: t.team?.id,
        name: t.team?.name,
        acronym: t.team?.acronym,
        score: t.score,
        firstHalfScore: t.first_half_score,
        secondHalfScore: t.second_half_score,
        overtimeScore: t.overtime_score,
        players: (t.players || []).map(p => ({
          id: p.player?.id || p.id,
          name: p.player?.name || p.name,
          slug: p.player?.slug || p.slug,
          nationality: p.player?.nationality || p.nationality,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          headshots: p.headshots,
          adr: p.adr,
          kast: p.kast,
          rating: p.rating,
          firstKillsDiff: p.first_kills_diff,
          flashAssists: p.flash_assists,
        })),
      })),
      rounds: game.rounds ? game.rounds.map(r => ({
        number: r.number,
        outcome: r.outcome,
        winnerId: r.winner?.id,
        winnerName: r.winner?.name,
        winnerSide: r.winner_side,
        ct: r.ct?.team?.id,
        t: r.t?.team?.id,
      })) : [],
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
