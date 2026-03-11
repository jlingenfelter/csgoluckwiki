/**
 * Cloudflare Pages Function: /api/team-competitive-stats
 * Fetches competitive performance stats for a team from PandaScore.
 * Uses /csgo/teams/{id}/stats for rich map pool, win rates, and round data.
 *
 * Query params:
 *   ?id=12345          (PandaScore team ID — fastest)
 *   ?slug=natus-vincere (PandaScore team slug)
 *   ?name=NAVI          (search by name)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const baseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
  const errorHeaders = { ...baseHeaders, 'Cache-Control': 'no-store' };
  const headers = { ...baseHeaders, 'Cache-Control': 'public, max-age=1800, s-maxage=1800' };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers: errorHeaders });
  }

  try {
    const url = new URL(request.url);
    let teamId = url.searchParams.get('id');
    const teamSlug = url.searchParams.get('slug');
    const teamName = url.searchParams.get('name');

    // Helper: check if a PandaScore team object is CS:GO / CS2
    const isCSTeam = (t) =>
      t.current_videogame?.slug === 'cs-go' || t.current_videogame?.slug === 'cs-2' ||
      t.current_videogame?.id === 3 || t.current_videogame?.id === 14;

    // Step 1: Resolve team ID if not provided directly
    if (!teamId) {
      if (!teamSlug && !teamName) {
        return new Response(JSON.stringify({ error: 'Provide ?id=, ?slug=, or ?name= parameter' }), { status: 400, headers: errorHeaders });
      }

      // Strategy 1: CSGO-specific search first (most accurate for CS teams)
      const searchTerm = teamName || (teamSlug ? teamSlug.replace(/-/g, ' ') : '');
      if (searchTerm) {
        const csgoRes = await fetch(
          `https://api.pandascore.co/csgo/teams?search[name]=${encodeURIComponent(searchTerm)}&per_page=10&token=${apiKey}`,
          { cf: { cacheTtl: 3600 } }
        );
        if (csgoRes.ok) {
          const teams = await csgoRes.json();
          if (teams.length > 0) {
            const exact = teams.find(t => t.slug === teamSlug) ||
                          teams.find(t => t.name.toLowerCase() === searchTerm.toLowerCase());
            teamId = (exact || teams[0]).id;
          }
        }

        // Also try stripping "Team " prefix (e.g. "Team Spirit" → "Spirit")
        if (!teamId) {
          const altNames = [];
          if (searchTerm.toLowerCase().startsWith('team ')) altNames.push(searchTerm.slice(5));
          if (searchTerm.toLowerCase().startsWith('org ')) altNames.push(searchTerm.slice(4));
          for (const alt of altNames) {
            if (!alt) continue;
            const altRes = await fetch(
              `https://api.pandascore.co/csgo/teams?search[name]=${encodeURIComponent(alt)}&per_page=10&token=${apiKey}`,
              { cf: { cacheTtl: 3600 } }
            );
            if (altRes.ok) {
              const teams = await altRes.json();
              const match = teams.find(t => t.name.toLowerCase() === alt.toLowerCase()) ||
                            teams.find(t => t.name.toLowerCase().includes(alt.toLowerCase()));
              if (match) {
                teamId = match.id;
                break;
              }
            }
          }
        }
      }

      // Strategy 2: Generic slug/name lookup fallback
      if (!teamId) {
        let lookupUrl;
        if (teamSlug) {
          lookupUrl = `https://api.pandascore.co/teams?filter[slug]=${encodeURIComponent(teamSlug)}&per_page=10&token=${apiKey}`;
        } else {
          lookupUrl = `https://api.pandascore.co/teams?search[name]=${encodeURIComponent(teamName)}&per_page=25&token=${apiKey}`;
        }

        const lookupRes = await fetch(lookupUrl, { cf: { cacheTtl: 3600 } });
        if (lookupRes.ok) {
          const results = await lookupRes.json();
          if (Array.isArray(results) && results.length > 0) {
            const csTeam = results.find(isCSTeam);
            teamId = csTeam ? csTeam.id : results[0].id;
          }
        }
      }

      if (!teamId) {
        return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404, headers: errorHeaders });
      }
    }

    // Step 2: Fetch team stats from the dedicated stats endpoint
    const statsRes = await fetch(
      `https://api.pandascore.co/csgo/teams/${teamId}/stats?token=${apiKey}`,
      {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 1800 },
      }
    );

    if (!statsRes.ok) {
      const errText = await statsRes.text();
      return new Response(JSON.stringify({ error: 'Stats fetch failed', status: statsRes.status, detail: errText }), { status: statsRes.status, headers: errorHeaders });
    }

    const raw = await statsRes.json();
    const stats = raw.stats || {};
    const counts = stats.counts || {};
    const perGame = stats.per_game_averages || {};
    const perRound = stats.per_round_averages || {};

    // Build map pool data (only maps with games played)
    const maps = (stats.maps || [])
      .filter(m => m.total_played > 0)
      .sort((a, b) => b.total_played - a.total_played)
      .map(m => ({
        name: m.name,
        slug: m.slug,
        image: m.image_url,
        played: m.total_played,
        wins: m.wins,
        losses: m.losses,
        winRate: m.total_played > 0 ? +(m.wins / m.total_played * 100).toFixed(1) : 0,
        picks: m.picks,
        bans: m.bans,
        pickRate: +(m.pick_rate * 100).toFixed(0),
        banRate: +(m.ban_rate * 100).toFixed(0),
        ctRounds: m.ct_round_total_played,
        ctWins: m.ct_round_wins,
        ctWinRate: m.ct_round_total_played > 0 ? +(m.ct_round_wins / m.ct_round_total_played * 100).toFixed(1) : 0,
        tRounds: m.t_round_total_played,
        tWins: m.t_round_wins,
        tWinRate: m.t_round_total_played > 0 ? +(m.t_round_wins / m.t_round_total_played * 100).toFixed(1) : 0,
        pistolPlayed: m.pistol_round_total_played,
        pistolCtWins: m.ct_pistol_round_wins,
        pistolTWins: m.t_pistol_round_wins,
        pistolWinRate: m.pistol_round_total_played > 0
          ? +((m.ct_pistol_round_wins + m.t_pistol_round_wins) / m.pistol_round_total_played * 100).toFixed(1)
          : 0,
      }));

    // Build last games
    const lastGames = (raw.last_games || []).map(g => ({
      id: g.id,
      matchId: g.match_id,
      map: g.map?.name || 'Unknown',
      mapImage: g.map?.image_url,
      status: g.status,
      detailedStats: g.detailed_stats,
      beginAt: g.begin_at,
      teams: (g.teams || []).map(t => ({
        id: t.team?.id,
        name: t.team?.name,
        score: t.score,
        firstHalf: t.first_half_score,
        secondHalf: t.second_half_score,
      })),
      winnerId: g.winner?.id,
    }));

    // Build response
    const response = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      acronym: raw.acronym,
      location: raw.location,
      image: raw.image_url,
      record: {
        matchesPlayed: counts.matches_played || 0,
        matchesWon: counts.matches_won || 0,
        matchesLost: counts.matches_lost || 0,
        matchesDraw: counts.matches_draw || 0,
        matchWinRate: counts.matches_played > 0 ? +(counts.matches_won / counts.matches_played * 100).toFixed(1) : 0,
        gamesPlayed: counts.games_played || 0,
        gamesWon: counts.games_won || 0,
        gamesLost: counts.games_lost || 0,
        gameWinRate: counts.games_played > 0 ? +(counts.games_won / counts.games_played * 100).toFixed(1) : 0,
      },
      rounds: {
        played: counts.rounds_played || 0,
        won: counts.rounds_won || 0,
        winRate: counts.rounds_played > 0 ? +(counts.rounds_won / counts.rounds_played * 100).toFixed(1) : 0,
        ctPlayed: counts.ct_round_total_played || 0,
        ctWon: counts.ct_round_wins || 0,
        ctWinRate: counts.ct_round_total_played > 0 ? +(counts.ct_round_wins / counts.ct_round_total_played * 100).toFixed(1) : 0,
        tPlayed: counts.t_round_total_played || 0,
        tWon: counts.t_round_wins || 0,
        tWinRate: counts.t_round_total_played > 0 ? +(counts.t_round_wins / counts.t_round_total_played * 100).toFixed(1) : 0,
        pistolPlayed: counts.pistol_round_total_played || 0,
        pistolWon: counts.pistol_round_wins || 0,
        pistolWinRate: counts.pistol_round_total_played > 0 ? +(counts.pistol_round_wins / counts.pistol_round_total_played * 100).toFixed(1) : 0,
      },
      fragging: {
        kills: counts.kills || 0,
        deaths: counts.deaths || 0,
        kdDiff: counts.k_d_diff || 0,
        headshots: counts.headshots || 0,
        hsRate: counts.kills > 0 ? +(counts.headshots / counts.kills * 100).toFixed(1) : 0,
        flashAssists: counts.flash_assists || 0,
      },
      averages: {
        killsPerGame: perGame.kills,
        deathsPerGame: perGame.deaths,
        adrPerGame: perGame.adr,
        kastPerGame: perGame.kast,
        killsPerRound: perRound.kills,
        deathsPerRound: perRound.deaths,
      },
      maps,
      lastGames,
    };

    return new Response(JSON.stringify(response), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers: errorHeaders });
  }
}
