/**
 * Cloudflare Pages Function: /api/player-stats
 * Proxies PandaScore player stats data.
 *
 * Query params:
 *   ?id=12345          (PandaScore player ID)
 *   ?slug=s1mple       (PandaScore player slug — searches by slug)
 *   ?name=s1mple       (player display name — used for name-based search fallback)
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
    const playerName = url.searchParams.get('name');

    if (!playerId && !playerSlug) {
      return new Response(JSON.stringify({ error: 'Provide ?id= or ?slug= parameter' }), { status: 400, headers });
    }

    let pid = playerId;
    let resolvedVideogame = null;

    // If slug provided, resolve to ID first using multiple strategies
    if (!pid && playerSlug) {
      // Strategy 1: Exact slug lookup (generic /players — slug is globally unique)
      const searchUrl = `https://api.pandascore.co/players?filter[slug]=${encodeURIComponent(playerSlug)}&per_page=5&token=${apiKey}`;
      const searchRes = await fetch(searchUrl, { cf: { cacheTtl: 3600 } });
      if (searchRes.ok) {
        const players = await searchRes.json();
        // Prefer CS2/CSGO players when multiple matches
        const csPlayer = players.find(p =>
          p.current_videogame?.slug === 'cs-go' || p.current_videogame?.slug === 'cs-2' ||
          p.current_videogame?.id === 3 || p.current_videogame?.id === 14
        );
        if (csPlayer) {
          pid = csPlayer.id;
          resolvedVideogame = csPlayer.current_videogame?.slug;
        } else if (players.length > 0) {
          pid = players[0].id;
          resolvedVideogame = players[0].current_videogame?.slug;
        }
      }

      // Strategy 2: Name-based search using the provided name parameter
      if (!pid) {
        const searchName = playerName || playerSlug.replace(/-/g, ' ');
        const nameUrl = `https://api.pandascore.co/players?search[name]=${encodeURIComponent(searchName)}&per_page=10&token=${apiKey}`;
        const nameRes = await fetch(nameUrl, { cf: { cacheTtl: 3600 } });
        if (nameRes.ok) {
          const players = await nameRes.json();
          if (players.length > 0) {
            // Prefer CS2/CSGO players, then exact name match
            const csPlayers = players.filter(p =>
              p.current_videogame?.slug === 'cs-go' || p.current_videogame?.slug === 'cs-2' ||
              p.current_videogame?.id === 3 || p.current_videogame?.id === 14
            );
            if (csPlayers.length > 0) {
              const exact = csPlayers.find(p =>
                p.slug === playerSlug || p.name.toLowerCase() === searchName.toLowerCase()
              );
              pid = exact ? exact.id : csPlayers[0].id;
            } else {
              const exact = players.find(p =>
                p.slug === playerSlug || p.name.toLowerCase() === searchName.toLowerCase()
              );
              pid = exact ? exact.id : players[0].id;
            }
          }
        }
      }

      // Strategy 3: Try CSGO-specific player endpoint by ID range (fallback)
      if (!pid && playerName) {
        const csgoUrl = `https://api.pandascore.co/csgo/players?search[name]=${encodeURIComponent(playerName)}&per_page=5&token=${apiKey}`;
        const csgoRes = await fetch(csgoUrl, { cf: { cacheTtl: 3600 } });
        if (csgoRes.ok) {
          const players = await csgoRes.json();
          if (players.length > 0) {
            const exact = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
            pid = exact ? exact.id : players[0].id;
          }
        }
      }
    }

    if (!pid) {
      return new Response(JSON.stringify({ error: 'Player not found', slug: playerSlug, name: playerName }), { status: 404, headers });
    }

    // Fetch player stats — /csgo/ prefix is valid for both CS:GO and CS2
    const statsUrl = `https://api.pandascore.co/csgo/players/${pid}/stats?token=${apiKey}`;
    const statsRes = await fetch(statsUrl, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 3600 },
    });

    if (!statsRes.ok) {
      // If /csgo/ stats fail, try getting basic player info as fallback
      const basicUrl = `https://api.pandascore.co/players/${pid}?token=${apiKey}`;
      const basicRes = await fetch(basicUrl, { cf: { cacheTtl: 3600 } });
      if (basicRes.ok) {
        const basicPlayer = await basicRes.json();
        // Return basic info without stats
        return new Response(JSON.stringify({
          id: basicPlayer.id,
          name: basicPlayer.name,
          slug: basicPlayer.slug,
          firstName: basicPlayer.first_name,
          lastName: basicPlayer.last_name,
          nationality: basicPlayer.nationality,
          image: basicPlayer.image_url,
          role: basicPlayer.role,
          active: basicPlayer.active,
          currentTeam: basicPlayer.current_team ? {
            id: basicPlayer.current_team.id,
            name: basicPlayer.current_team.name,
            image: basicPlayer.current_team.image_url,
            slug: basicPlayer.current_team.slug,
          } : null,
          stats: { totals: {}, averages: {}, perRound: {} },
          lastGames: [],
          teams: (basicPlayer.teams || []).map(t => ({
            id: t.id, name: t.name, image: t.image_url, slug: t.slug,
          })),
          _note: 'Stats endpoint returned ' + statsRes.status + ' — basic info only',
        }), { status: 200, headers });
      }
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
