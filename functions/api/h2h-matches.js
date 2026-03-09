/**
 * Cloudflare Pages Function: /api/h2h-matches
 * Fetches head-to-head match history between two teams.
 *
 * Query params:
 *   ?team1=12345       (PandaScore team 1 ID)
 *   ?team2=67890       (PandaScore team 2 ID)
 *   ?per_page=20       (optional, default 20, max 50)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=1800, s-maxage=1800',
  };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers });
  }

  try {
    const url = new URL(request.url);
    const team1Id = url.searchParams.get('team1');
    const team2Id = url.searchParams.get('team2');
    const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20', 10), 50);

    if (!team1Id || !team2Id) {
      return new Response(JSON.stringify({ error: 'Provide ?team1= and ?team2= parameters (team IDs)' }), { status: 400, headers });
    }

    // Fetch past matches for team1, then filter to matches against team2
    // PandaScore doesn't have a direct H2H endpoint, so we fetch team1's matches and filter
    // Use generic /matches endpoint — the /csgo/matches endpoint returns degraded data.
    const matchesRes = await fetch(
      `https://api.pandascore.co/matches/past?filter[opponent_id]=${team1Id}&filter[videogame]=csgo&sort=-begin_at&per_page=100&token=${apiKey}`,
      { cf: { cacheTtl: 1800 } }
    );

    if (!matchesRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch matches' }), { status: 500, headers });
    }

    const allMatches = await matchesRes.json();

    // Filter to only matches where team2 is the other opponent
    const t2 = parseInt(team2Id, 10);
    const h2hMatches = allMatches.filter(m => {
      const opponentIds = (m.opponents || []).map(o => o.opponent?.id);
      return opponentIds.includes(t2);
    }).slice(0, perPage);

    // Compute H2H record
    const t1 = parseInt(team1Id, 10);
    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;

    h2hMatches.forEach(m => {
      if (m.draw) { draws++; return; }
      if (m.winner_id === t1) team1Wins++;
      else if (m.winner_id === t2) team2Wins++;
    });

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
      team1Id: t1,
      team2Id: t2,
      record: {
        team1Wins,
        team2Wins,
        draws,
        total: h2hMatches.length,
      },
      matches: h2hMatches.map(slimMatch),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
