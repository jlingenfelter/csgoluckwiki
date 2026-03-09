/**
 * Cloudflare Pages Function: /api/player-stats
 * Proxies PandaScore player stats data.
 *
 * Query params:
 *   ?id=12345          (PandaScore player ID)
 *   ?slug=s1mple       (PandaScore player slug — searches by slug)
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
    const playerId = url.searchParams.get('id');
    const playerSlug = url.searchParams.get('slug');

    if (!playerId && !playerSlug) {
      return new Response(JSON.stringify({ error: 'Provide ?id= or ?slug= parameter' }), { status: 400, headers });
    }

    let pid = playerId;

    // If slug provided, resolve to ID first.
    // Use /csgo/players for slug lookup — generic /players with filter[videogame]=csgo
    // returns empty results. The /csgo/ prefix works for player slug searches.
    if (!pid && playerSlug) {
      const searchUrl = `https://api.pandascore.co/csgo/players?filter[slug]=${encodeURIComponent(playerSlug)}&per_page=1&token=${apiKey}`;
      const searchRes = await fetch(searchUrl, { cf: { cacheTtl: 3600 } });
      if (searchRes.ok) {
        const players = await searchRes.json();
        if (players.length > 0) pid = players[0].id;
      }
      // Fallback: try name search if slug didn't match
      if (!pid) {
        const nameUrl = `https://api.pandascore.co/csgo/players?search[name]=${encodeURIComponent(playerSlug)}&per_page=5&token=${apiKey}`;
        const nameRes = await fetch(nameUrl, { cf: { cacheTtl: 3600 } });
        if (nameRes.ok) {
          const players = await nameRes.json();
          if (players.length > 0) {
            const exact = players.find(p => p.slug === playerSlug || p.name.toLowerCase() === playerSlug.toLowerCase());
            pid = exact ? exact.id : players[0].id;
          }
        }
      }
    }

    if (!pid) {
      return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers });
    }

    // Fetch player stats — use /csgo/ prefix for consistency
    const statsUrl = `https://api.pandascore.co/csgo/players/${pid}/stats?token=${apiKey}`;
    const statsRes = await fetch(statsUrl, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 3600 },
    });

    if (!statsRes.ok) {
      const errText = await statsRes.text();
      return new Response(JSON.stringify({ error: 'PandaScore API error', status: statsRes.status, detail: errText }), { status: statsRes.status, headers });
    }

    const raw = await statsRes.json();

    // Slim down response
    const stats = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      firstName: raw.first_name,
      lastName: raw.last_name,
      nationality: raw.nationality,
      age: raw.age,
      image: raw.image_url,
      role: raw.role,
      active: raw.active,
      currentTeam: raw.current_team ? {
        id: raw.current_team.id,
        name: raw.current_team.name,
        image: raw.current_team.image_url,
        slug: raw.current_team.slug,
      } : null,
      stats: {
        totals: {
          kills: raw.stats?.counts?.kills,
          deaths: raw.stats?.counts?.deaths,
          assists: raw.stats?.counts?.assists,
          headshots: raw.stats?.counts?.headshots,
          roundsPlayed: raw.stats?.counts?.rounds_played,
          matchesPlayed: raw.stats?.counts?.matches_played,
          matchesWon: raw.stats?.counts?.matches_won,
          matchesLost: raw.stats?.counts?.matches_lost,
          gamesPlayed: raw.stats?.counts?.games_played,
          gamesWon: raw.stats?.counts?.games_won,
          gamesLost: raw.stats?.counts?.games_lost,
        },
        averages: {
          adr: raw.stats?.per_game_averages?.adr,
          kills: raw.stats?.per_game_averages?.kills,
          deaths: raw.stats?.per_game_averages?.deaths,
          assists: raw.stats?.per_game_averages?.assists,
          headshots: raw.stats?.per_game_averages?.headshots,
          kast: raw.stats?.per_game_averages?.kast,
          rating: raw.stats?.per_game_averages?.hltv_game_rating,
          firstKillsDiff: raw.stats?.per_game_averages?.first_kills_diff,
          flashAssists: raw.stats?.per_game_averages?.flash_assists,
        },
        perRound: {
          kills: raw.stats?.per_round_averages?.kills,
          deaths: raw.stats?.per_round_averages?.deaths,
          assists: raw.stats?.per_round_averages?.assists,
          headshots: raw.stats?.per_round_averages?.headshots,
        },
      },
      lastGames: (raw.last_games || []).slice(0, 5).map(g => ({
        gameId: g.game_id,
        adr: g.adr,
        kills: g.kills,
        deaths: g.deaths,
        assists: g.assists,
        headshots: g.headshots,
        kast: g.kast,
        rating: g.rating,
        opponent: g.opponent ? { name: g.opponent.name, image: g.opponent.image_url } : null,
      })),
      teams: (raw.teams || []).map(t => ({
        id: t.id,
        name: t.name,
        image: t.image_url,
        slug: t.slug,
      })),
    };

    return new Response(JSON.stringify(stats), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
