/**
 * Cloudflare Pages Function: /api/tournament-detail
 * Fetches tournament data: info, standings, matches, and teams.
 *
 * Query params:
 *   ?id=12345          (PandaScore tournament ID)
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
    const tournamentId = url.searchParams.get('id');

    if (!tournamentId) {
      return new Response(JSON.stringify({ error: 'Provide ?id= parameter' }), { status: 400, headers });
    }

    const base = 'https://api.pandascore.co/csgo';

    // Fetch tournament info, standings, matches, and teams in parallel
    const [infoRes, standingsRes, matchesRes, teamsRes] = await Promise.all([
      fetch(`${base}/tournaments/${tournamentId}?token=${apiKey}`, { cf: { cacheTtl: 600 } }),
      fetch(`${base}/tournaments/${tournamentId}/standings?token=${apiKey}`, { cf: { cacheTtl: 600 } }),
      fetch(`${base}/tournaments/${tournamentId}/matches?sort=-begin_at&per_page=50&token=${apiKey}`, { cf: { cacheTtl: 300 } }),
      fetch(`${base}/tournaments/${tournamentId}/teams?per_page=50&token=${apiKey}`, { cf: { cacheTtl: 600 } }),
    ]);

    if (!infoRes.ok) {
      return new Response(JSON.stringify({ error: 'Tournament not found', status: infoRes.status }), { status: infoRes.status, headers });
    }

    const info = await infoRes.json();
    const standings = standingsRes.ok ? await standingsRes.json() : [];
    const matches = matchesRes.ok ? await matchesRes.json() : [];
    const teams = teamsRes.ok ? await teamsRes.json() : [];

    const result = {
      id: info.id,
      name: info.name,
      slug: info.slug,
      beginAt: info.begin_at,
      endAt: info.end_at,
      tier: info.tier,
      prizepool: info.prizepool,
      winnerId: info.winner_id,
      winnerType: info.winner_type,
      live: info.live_supported,
      league: {
        id: info.league?.id,
        name: info.league?.name,
        image: info.league?.image_url,
      },
      serie: {
        id: info.serie?.id,
        name: info.serie?.full_name || info.serie?.name,
        year: info.serie?.year,
        season: info.serie?.season,
      },
      standings: standings.map(s => ({
        rank: s.rank,
        teamId: s.team?.id,
        teamName: s.team?.name,
        teamAcronym: s.team?.acronym,
        teamImage: s.team?.image_url,
        teamLocation: s.team?.location,
        wins: s.wins,
        losses: s.losses,
        ties: s.ties,
        total: s.total,
      })),
      matches: matches.map(m => ({
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
      })),
      teams: teams.map(t => ({
        id: t.id,
        name: t.name,
        acronym: t.acronym,
        image: t.image_url,
        location: t.location,
      })),
    };

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers });
  }
}
