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

    // PandaScore returns players at the top level (game.players[]),
    // NOT nested under game.teams[].players[]. Group them by team.
    const teamMap = {};
    for (const t of (game.teams || [])) {
      teamMap[t.id] = { id: t.id, name: t.name, acronym: t.acronym, players: [] };
    }
    for (const p of (game.players || [])) {
      const teamId = p.team?.id;
      if (teamId && !teamMap[teamId]) {
        teamMap[teamId] = { id: teamId, name: p.team.name, acronym: p.team.acronym, players: [] };
      }
      if (teamId && teamMap[teamId]) {
        teamMap[teamId].players.push({
          id: p.player?.id,
          name: p.player?.name,
          slug: p.player?.slug,
          nationality: p.player?.nationality,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          headshots: p.headshots,
          adr: p.adr,
          kast: p.kast,       // already a percentage (e.g. 71.4)
          rating: p.rating,
          firstKillsDiff: p.first_kills_diff,
          flashAssists: p.flash_assists,
        });
      }
    }

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
      teams: Object.values(teamMap),
      rounds: game.rounds ? game.rounds.map(r => ({
        number: r.round,
        outcome: r.outcome,
        winnerTeam: r.winner_team,
        winnerSide: r.winner_side,
        ct: r.ct,
        t: r.terrorists,
      })) : [],
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
