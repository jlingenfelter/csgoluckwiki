/**
 * Cloudflare Pages Function: /api/player-matches
 * Fetches recent matches for a given player.
 *
 * Query params:
 *   ?id=12345          (PandaScore player ID)
 *   ?slug=s1mple       (PandaScore player slug)
 *   ?name=s1mple       (player name — fuzzy search fallback)
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

    const playerTeam = url.searchParams.get('team');
    const playerCountry = url.searchParams.get('country');

    if (!playerId && !playerSlug && !playerName) {
      return new Response(JSON.stringify({ error: 'Provide ?id=, ?slug=, or ?name= parameter' }), { status: 400, headers });
    }

    // Helper: check if a PandaScore player is CS:GO / CS2
    const isCSPlayer = (p) =>
      p.current_videogame?.slug === 'cs-go' || p.current_videogame?.slug === 'cs-2' ||
      p.current_videogame?.id === 3 || p.current_videogame?.id === 14;

    // Helper: score a candidate player for best match quality
    const scorePlayer = (p) => {
      let score = 0;
      if (isCSPlayer(p)) score += 50;
      if (p.current_team) score += 20;
      if (playerTeam && p.current_team?.name?.toLowerCase().includes(playerTeam.toLowerCase())) score += 30;
      if (playerCountry && p.nationality) {
        const country = playerCountry.toLowerCase();
        const nat = p.nationality.toLowerCase();
        if (nat === country || nat.includes(country) || country.includes(nat)) score += 25;
      }
      if (p.slug === playerSlug) score += 10;
      return score;
    };

    const pickBest = (players) => {
      if (!players || players.length === 0) return null;
      if (players.length === 1) return players[0];
      return players.sort((a, b) => scorePlayer(b) - scorePlayer(a))[0];
    };

    // Resolve to player ID using multiple strategies
    if (!playerId) {
      // Strategy 1: CSGO-specific search first (most accurate for CS players)
      const csgoUrl = `https://api.pandascore.co/csgo/players?search[name]=${encodeURIComponent(playerName || playerSlug)}&per_page=10&token=${apiKey}`;
      const csgoRes = await fetch(csgoUrl, { cf: { cacheTtl: 3600 } });
      if (csgoRes.ok) {
        const players = await csgoRes.json();
        if (players.length > 0) {
          // Check exact slug match first (highest confidence)
          const slugMatch = players.find(p => p.slug === playerSlug);
          if (slugMatch) {
            playerId = slugMatch.id;
          } else {
            // Collect ALL exact name matches, then score them to pick best
            const searchLower = (playerName || playerSlug).toLowerCase();
            const nameMatches = players.filter(p => p.name.toLowerCase() === searchLower);
            if (nameMatches.length > 0) {
              const best = pickBest(nameMatches);
              if (best) playerId = best.id;
            } else {
              // No exact match — score all candidates
              const best = pickBest(players);
              if (best) playerId = best.id;
            }
          }
        }
      }

      // Strategy 2: Slug filter on generic endpoint
      if (!playerId && playerSlug) {
        const slugRes = await fetch(
          `https://api.pandascore.co/players?filter[slug]=${encodeURIComponent(playerSlug)}&per_page=10&token=${apiKey}`,
          { cf: { cacheTtl: 3600 } }
        );
        if (slugRes.ok) {
          const players = await slugRes.json();
          const best = pickBest(players);
          if (best) playerId = best.id;
        }
      }

      // Strategy 3: Name-based search fallback
      if (!playerId) {
        const searchName = playerName || (playerSlug ? playerSlug.replace(/-/g, ' ') : '');
        if (searchName) {
          const nameRes = await fetch(
            `https://api.pandascore.co/players?search[name]=${encodeURIComponent(searchName)}&per_page=10&token=${apiKey}`,
            { cf: { cacheTtl: 3600 } }
          );
          if (nameRes.ok) {
            const players = await nameRes.json();
            const best = pickBest(players);
            if (best) playerId = best.id;
          }
        }
      }
    }

    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player not found', slug: playerSlug, name: playerName }), { status: 404, headers });
    }

    // Fetch the player's team to find matches — /csgo/ prefix works for both CS:GO and CS2
    const playerRes = await fetch(
      `https://api.pandascore.co/csgo/players/${playerId}?token=${apiKey}`,
      { cf: { cacheTtl: 3600 } }
    );

    // Fallback: if /csgo/ fails, try generic /players
    let player;
    if (!playerRes.ok) {
      const genericRes = await fetch(
        `https://api.pandascore.co/players/${playerId}?token=${apiKey}`,
        { cf: { cacheTtl: 3600 } }
      );
      if (!genericRes.ok) {
        return new Response(JSON.stringify({ error: 'Player not found' }), { status: 404, headers });
      }
      player = await genericRes.json();
    } else {
      player = await playerRes.json();
    }

    const currentTeamId = player.current_team?.id;

    // Fetch past matches for the player's current team (only finished, non-forfeit matches)
    let pastMatches = [];
    let upcomingMatches = [];
    if (currentTeamId) {
      const [pastRes, upcomingRes] = await Promise.all([
        fetch(
          `https://api.pandascore.co/csgo/matches/past?filter[opponent_id]=${currentTeamId}&filter[status]=finished&filter[forfeit]=false&sort=-begin_at&page=${page}&per_page=${perPage}&token=${apiKey}`,
          { cf: { cacheTtl: 600 } }
        ),
        fetch(
          `https://api.pandascore.co/csgo/matches/upcoming?filter[opponent_id]=${currentTeamId}&sort=begin_at&per_page=10&token=${apiKey}`,
          { cf: { cacheTtl: 300 } }
        ),
      ]);
      if (pastRes.ok) {
        pastMatches = await pastRes.json();
      }
      if (upcomingRes.ok) {
        upcomingMatches = await upcomingRes.json();
      }
    }

    function slimMatch(m) {
      // Compute scores: prefer results[].score, fall back to counting game wins
      let results = m.results || [];
      const hasValidScores = results.length === 2 && results.some(r => r.score > 0);

      if (!hasValidScores && Array.isArray(m.games) && m.games.length > 0) {
        // Count game wins per team from the games array
        const winCounts = {};
        for (const g of m.games) {
          const gWinner = g.winner?.id || g.winner_id;
          if (gWinner) {
            winCounts[gWinner] = (winCounts[gWinner] || 0) + 1;
          }
        }
        // Build results from win counts
        const opponents = (m.opponents || []).map(o => o.opponent?.id).filter(Boolean);
        if (opponents.length === 2) {
          results = opponents.map(id => ({
            team_id: id,
            score: winCounts[id] || 0,
          }));
        }
      }

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
        results,
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
      upcoming: upcomingMatches.map(slimMatch),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
