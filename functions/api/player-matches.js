/**
 * Cloudflare Pages Function: /api/player-matches
 * Fetches recent matches for a given player.
 *
 * Query params:
 *   ?id=12345          (PandaScore player ID)
 *   ?slug=s1mple       (PandaScore player slug)
 *   ?name=s1mple        (player name — fuzzy search fallback)
 *   ?page=1            (optional, default 1)
 *   ?per_page=15       (optional, default 15, max 50)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=600, s-maxage=600',
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers });
  }

  try {
    const url = new URL(request.url);
    let playerId = url.searchParams.get('id');
    const playerSlug = url.searchParams.get('slug');
    const playerName = url.searchParams.get('name');
    const page = url.searchParams.get('page') || '1';
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '15', 10), 50);

    if (!playerId && !playerSlug && !playerName) {
      return new Response(JSON.stringify({ error: 'Provide ?id=, ?slug=, or ?name= parameter' }), { status: 400, headers });
    }

    // Resolve to player ID using multiple strategies
    if (!playerId) {
      // Strategy 1: Try slug lookup
      if (playerSlug) {
        const slugRes = await fetch(
          `https://api.pandascore.co/players?filter[slug]=${encodeURIComponent(playerSlug)}&filter[videogame]=csgo&per_page=1&token=${apiKey}`,
          { cf: { cacheTtl: 86400 } }
        );
        if (slugRes.ok) {
          const players = await slugRes.json();
          if (players.length > 0) playerId = players[0].id;
        }
      }

      // Strategy 2: If slug didn't work, try name search
      if (!playerId) {
        const searchName = playerName || (playerSlug ? playerSlug.replace(/-/g, ' ') : '');
        if (searchName) {
          const nameRes = await fetch(
            `https://api.pandascore.co/players?search[name]=${encodeURIComponent(searchName)}&filter[videogame]=csgo&per_page=5&token=${apiKey}`,
            { cf: { cacheTtl: 86400 } }
          );
          if (nameRes.ok) {
            const players = await nameRes.json();
            if (players.length > 0) {
              // Try exact match first (case-insensitive)
              const exact = players.find(p => p.name.toLowerCase() === searchName.toLowerCase());
              playerId = exact ? exact.id : players[0].id;
            }
          }
        }
      }
    }

    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers });
    }

    // Fetch the player's team to find matches by team
    const playerRes = await fetch(
      `https://api.pandascore.co/players/${playerId}?token=${apiKey}`,
      { cf: { cacheTtl: 3600 } }
    );

    if (!playerRes.ok) {
      return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers });
    }

    const player = await playerRes.json();
    const currentTeamId = player.current_team?.id;

    // Fetch past matches for the player's current team
    let pastMatches = [];
    if (currentTeamId) {
      const matchesRes = await fetch(
        `https://api.pandascore.co/csgo/matches/past?filter[opponent_id]=${currentTeamId}&sort=-begin_at&page=${page}&per_page=${perPage}&token=${apiKey}`,
        { cf: { cacheTtl: 600 } }
      );
      if (matchesRes.ok) {
        pastMatches = await matchesRes.json();
      }
    }

    function slimMatch(m) {
      return {
        id: m.id,
        name: m.name,
        status: m.status,
        matchType: m.match_type,
        numberOfGames: m.number_of_games,
        beginAt: m.begin_at,
        winnerId: m.winner_id,
        forfeit: m.forfeit,
        opponents: (m.opponents || []).map(o => ({
          id: o.opponent?.id,
          name: o.opponent?.name,
          acronym: o.opponent?.acronym,
          image: o.opponent?.image_url,
        })),
        results: m.results || [],
        tournament: {
          name: m.tournament?.name,
          tier: m.tournament?.tier,
        },
        league: {
          name: m.league?.name,
          image: m.league?.image_url,
        },
      };
    }

    const result = {
      playerId: parseInt(playerId, 10),
      playerName: player.name,
      currentTeam: player.current_team ? {
        id: player.current_team.id,
        name: player.current_team.name,
        image: player.current_team.image_url,
      } : null,
      matches: pastMatches.map(slimMatch),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
