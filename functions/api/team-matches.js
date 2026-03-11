/**
 * Cloudflare Pages Function: /api/team-matches
 * Fetches recent matches for a given team.
 *
 * Query params:
 *   ?id=12345          (PandaScore team ID)
 *   ?slug=natus-vincere (PandaScore team slug)
 *   ?name=Natus Vincere (team name — fuzzy search fallback)
 *   ?page=1            (optional, default 1)
 *   ?per_page=20       (optional, default 20, max 50)
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
    let teamId = url.searchParams.get('id');
    const teamSlug = url.searchParams.get('slug');
    const teamName = url.searchParams.get('name');
    const page = url.searchParams.get('page') || '1';
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20', 10), 50);

    if (!teamId && !teamSlug && !teamName) {
      return new Response(JSON.stringify({ error: 'Provide ?id=, ?slug=, or ?name= parameter' }), { status: 400, headers });
    }

    // Resolve to team ID using multiple strategies.
    // Priority: CSGO-specific search first (most accurate), then generic endpoints.
    let teamImage = null;
    let teamName_ = null;

    // Helper: check if a team is CS:GO / CS2
    const isCSTeam = (t) =>
      t.current_videogame?.slug === 'cs-go' || t.current_videogame?.slug === 'cs-2' ||
      t.current_videogame?.id === 3 || t.current_videogame?.id === 14;

    if (!teamId) {
      // Strategy 1: CSGO-specific search (most accurate for CS teams)
      // Many orgs have different PandaScore entries per game (e.g. "Spirit" for CS, "Team Spirit" for Dota 2)
      const searchTerm = teamName || (teamSlug ? teamSlug.replace(/-/g, ' ') : '');
      if (searchTerm) {
        const csgoRes = await fetch(
          `https://api.pandascore.co/csgo/teams?search[name]=${encodeURIComponent(searchTerm)}&per_page=10&token=${apiKey}`,
          { cf: { cacheTtl: 3600 } }
        );
        if (csgoRes.ok) {
          const teams = await csgoRes.json();
          if (teams.length > 0) {
            // Prefer exact name/slug match, then first result
            const exact = teams.find(t => t.slug === teamSlug) ||
                          teams.find(t => t.name.toLowerCase() === searchTerm.toLowerCase());
            const best = exact || teams[0];
            teamId = best.id;
            teamImage = best.image_url;
            teamName_ = best.name;
          }
        }

        // Also try splitting off common prefixes like "Team " for broader search
        // e.g. "Team Spirit" → also search "Spirit"
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
              // Look for a team whose name contains the search term
              const match = teams.find(t => t.name.toLowerCase() === alt.toLowerCase()) ||
                            teams.find(t => t.name.toLowerCase().includes(alt.toLowerCase()));
              if (match) {
                teamId = match.id;
                teamImage = match.image_url;
                teamName_ = match.name;
                break;
              }
            }
          }
        }
      }

      // Strategy 2: Try slug lookup (generic endpoint)
      if (!teamId && teamSlug) {
        const slugRes = await fetch(
          `https://api.pandascore.co/teams?filter[slug]=${encodeURIComponent(teamSlug)}&per_page=5&token=${apiKey}`,
          { cf: { cacheTtl: 3600 } }
        );
        if (slugRes.ok) {
          const teams = await slugRes.json();
          if (teams.length > 0) {
            // Prefer CS team
            const csTeam = teams.find(t => isCSTeam(t)) || teams[0];
            teamId = csTeam.id;
            teamImage = csTeam.image_url;
            teamName_ = csTeam.name;
          }
        }
      }

      // Strategy 3: Name search on generic endpoint (broadest fallback)
      if (!teamId) {
        const searchName = teamName || (teamSlug ? teamSlug.replace(/-/g, ' ') : '');
        if (searchName) {
          const nameRes = await fetch(
            `https://api.pandascore.co/teams?search[name]=${encodeURIComponent(searchName)}&per_page=25&token=${apiKey}`,
            { cf: { cacheTtl: 3600 } }
          );
          if (nameRes.ok) {
            const teams = await nameRes.json();
            if (teams.length > 0) {
              // Prefer CS:GO/CS2 team with exact name match
              const csTeam = teams.find(t =>
                t.name.toLowerCase() === searchName.toLowerCase() && isCSTeam(t)
              ) || teams.find(t => isCSTeam(t))
                || teams.find(t => t.name.toLowerCase() === searchName.toLowerCase()) || teams[0];
              teamId = csTeam.id;
              teamImage = csTeam.image_url;
              teamName_ = csTeam.name;
            }
          }
        }
      }
    } else {
      // If ID provided, fetch team details for image
      const teamRes = await fetch(
        `https://api.pandascore.co/csgo/teams/${teamId}?token=${apiKey}`,
        { cf: { cacheTtl: 3600 } }
      );
      if (teamRes.ok) {
        const t = await teamRes.json();
        teamImage = t.image_url;
        teamName_ = t.name;
      }
    }

    if (!teamId) {
      return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404, headers });
    }

    // Fetch past and upcoming matches — use /csgo/ prefix for match list queries.
    // Generic /matches with filter[videogame] returns empty for list queries.
    const [pastRes, upcomingRes] = await Promise.all([
      fetch(
        `https://api.pandascore.co/csgo/matches/past?filter[opponent_id]=${teamId}&filter[status]=finished&filter[forfeit]=false&sort=-begin_at&page=${page}&per_page=${perPage}&token=${apiKey}`,
        { cf: { cacheTtl: 600 } }
      ),
      fetch(
        `https://api.pandascore.co/csgo/matches/upcoming?filter[opponent_id]=${teamId}&sort=begin_at&per_page=5&token=${apiKey}`,
        { cf: { cacheTtl: 300 } }
      ),
    ]);

    const pastMatches = pastRes.ok ? await pastRes.json() : [];
    const upcomingMatches = upcomingRes.ok ? await upcomingRes.json() : [];

    function slimMatch(m) {
      // Compute scores: prefer results[].score, fall back to counting game wins
      let results = m.results || [];
      const hasValidScores = results.length === 2 && results.some(r => r.score > 0);

      if (!hasValidScores && Array.isArray(m.games) && m.games.length > 0) {
        const winCounts = {};
        for (const g of m.games) {
          const gWinner = g.winner?.id || g.winner_id;
          if (gWinner) {
            winCounts[gWinner] = (winCounts[gWinner] || 0) + 1;
          }
        }
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
        draw: m.draw,
        opponents: (m.opponents || []).map(o => ({
          id: o.opponent?.id,
          name: o.opponent?.name,
          acronym: o.opponent?.acronym,
          image: o.opponent?.image_url,
          location: o.opponent?.location,
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
      teamId: parseInt(teamId, 10),
      teamName: teamName_,
      teamImage: teamImage,
      past: pastMatches.map(slimMatch),
      upcoming: upcomingMatches.map(slimMatch),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
