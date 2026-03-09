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

    // Resolve to team ID using multiple strategies
    if (!teamId) {
      // Strategy 1: Try slug lookup
      if (teamSlug) {
        const slugRes = await fetch(
          `https://api.pandascore.co/csgo/teams?filter[slug]=${encodeURIComponent(teamSlug)}&per_page=1&token=${apiKey}`,
          { cf: { cacheTtl: 86400 } }
        );
        if (slugRes.ok) {
          const teams = await slugRes.json();
          if (teams.length > 0) teamId = teams[0].id;
        }
      }

      // Strategy 2: If slug didn't work, try name search
      if (!teamId) {
        const searchName = teamName || (teamSlug ? teamSlug.replace(/-/g, ' ') : '');
        if (searchName) {
          const nameRes = await fetch(
            `https://api.pandascore.co/csgo/teams?search[name]=${encodeURIComponent(searchName)}&per_page=5&token=${apiKey}`,
            { cf: { cacheTtl: 86400 } }
          );
          if (nameRes.ok) {
            const teams = await nameRes.json();
            if (teams.length > 0) {
              // Try exact match first (case-insensitive)
              const exact = teams.find(t => t.name.toLowerCase() === searchName.toLowerCase());
              teamId = exact ? exact.id : teams[0].id;
            }
          }
        }
      }
    }

    if (!teamId) {
      return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404, headers });
    }

    // Fetch past and upcoming matches
    const [pastRes, upcomingRes] = await Promise.all([
      fetch(
        `https://api.pandascore.co/csgo/matches/past?filter[opponent_id]=${teamId}&sort=-begin_at&page=${page}&per_page=${perPage}&token=${apiKey}`,
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
      teamId: parseInt(teamId, 10),
      past: pastMatches.map(slimMatch),
      upcoming: upcomingMatches.map(slimMatch),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
