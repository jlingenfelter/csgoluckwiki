/**
 * Cloudflare Pages Function: /api/map-meta
 * Aggregates map statistics from recent professional matches via PandaScore.
 * Fetches team stats from top teams and computes aggregate map meta.
 *
 * Returns: per-map pick rates, ban rates, win rates by side, pistol stats
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const apiKey = env.PANDASCORE_API_KEY;

  const baseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
  const errorHeaders = { ...baseHeaders, 'Cache-Control': 'no-store' };
  const headers = { ...baseHeaders, 'Cache-Control': 'public, max-age=3600, s-maxage=3600' };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No PandaScore API key configured' }), { status: 500, headers: errorHeaders });
  }

  try {
    // Fetch top teams to aggregate their map stats
    // Get teams from recent S/A-tier tournaments
    const teamsRes = await fetch(
      `https://api.pandascore.co/csgo/teams?sort=-modified_at&per_page=25&token=${apiKey}`,
      { headers: { 'Accept': 'application/json' }, cf: { cacheTtl: 3600 } }
    );

    if (!teamsRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch teams' }), { status: teamsRes.status, headers: errorHeaders });
    }

    const teams = await teamsRes.json();
    const teamIds = teams.map(t => t.id).slice(0, 20);

    // Fetch stats for each team in parallel (limit to 20 to stay within rate limits)
    const statsPromises = teamIds.map(id =>
      fetch(`https://api.pandascore.co/csgo/teams/${id}/stats?token=${apiKey}`, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 3600 },
      })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    );

    const allStats = (await Promise.all(statsPromises)).filter(Boolean);

    if (allStats.length === 0) {
      return new Response(JSON.stringify({ error: 'No team stats available' }), { status: 404, headers: errorHeaders });
    }

    // Aggregate map data across all teams
    const mapAgg = {};

    for (const teamData of allStats) {
      const maps = teamData.stats?.maps || [];
      for (const m of maps) {
        if (!m.total_played || m.total_played === 0) continue;

        if (!mapAgg[m.slug]) {
          mapAgg[m.slug] = {
            name: m.name,
            slug: m.slug,
            image: m.image_url,
            totalPlayed: 0,
            totalWins: 0,
            totalLosses: 0,
            totalPicks: 0,
            totalBans: 0,
            ctRoundsPlayed: 0,
            ctRoundsWon: 0,
            tRoundsPlayed: 0,
            tRoundsWon: 0,
            pistolPlayed: 0,
            pistolCtWins: 0,
            pistolTWins: 0,
            teamCount: 0,
            pickRateSum: 0,
            banRateSum: 0,
          };
        }

        const agg = mapAgg[m.slug];
        agg.totalPlayed += m.total_played;
        agg.totalWins += m.wins || 0;
        agg.totalLosses += m.losses || 0;
        agg.totalPicks += m.picks || 0;
        agg.totalBans += m.bans || 0;
        agg.ctRoundsPlayed += m.ct_round_total_played || 0;
        agg.ctRoundsWon += m.ct_round_wins || 0;
        agg.tRoundsPlayed += m.t_round_total_played || 0;
        agg.tRoundsWon += m.t_round_wins || 0;
        agg.pistolPlayed += m.pistol_round_total_played || 0;
        agg.pistolCtWins += m.ct_pistol_round_wins || 0;
        agg.pistolTWins += m.t_pistol_round_wins || 0;
        agg.teamCount++;
        agg.pickRateSum += (m.pick_rate || 0);
        agg.banRateSum += (m.ban_rate || 0);
      }
    }

    // Build response sorted by total games played
    const maps = Object.values(mapAgg)
      .filter(m => m.totalPlayed >= 10) // Only maps with meaningful data
      .sort((a, b) => b.totalPlayed - a.totalPlayed)
      .map(m => ({
        name: m.name,
        slug: m.slug,
        image: m.image,
        totalPlayed: m.totalPlayed,
        wins: m.totalWins,
        losses: m.totalLosses,
        picks: m.totalPicks,
        bans: m.totalBans,
        avgPickRate: m.teamCount > 0 ? +(m.pickRateSum / m.teamCount * 100).toFixed(1) : 0,
        avgBanRate: m.teamCount > 0 ? +(m.banRateSum / m.teamCount * 100).toFixed(1) : 0,
        ctWinRate: m.ctRoundsPlayed > 0 ? +(m.ctRoundsWon / m.ctRoundsPlayed * 100).toFixed(1) : 50,
        tWinRate: m.tRoundsPlayed > 0 ? +(m.tRoundsWon / m.tRoundsPlayed * 100).toFixed(1) : 50,
        ctRounds: m.ctRoundsPlayed,
        tRounds: m.tRoundsPlayed,
        pistolWinRate: m.pistolPlayed > 0
          ? +((m.pistolCtWins + m.pistolTWins) / m.pistolPlayed * 100).toFixed(1)
          : 50,
        pistolPlayed: m.pistolPlayed,
        teamsTracked: m.teamCount,
      }));

    // Overall stats
    const totalRounds = maps.reduce((s, m) => s + m.ctRounds + m.tRounds, 0);
    const totalCtWins = maps.reduce((s, m) => s + Math.round(m.ctWinRate * m.ctRounds / 100), 0);
    const totalTWins = maps.reduce((s, m) => s + Math.round(m.tWinRate * m.tRounds / 100), 0);

    return new Response(JSON.stringify({
      maps,
      teamsAnalyzed: allStats.length,
      totalGames: maps.reduce((s, m) => s + m.totalPlayed, 0),
      totalRounds,
      overallCtWinRate: totalRounds > 0 ? +(totalCtWins / (totalRounds / 2) * 100).toFixed(1) : 50,
      overallTWinRate: totalRounds > 0 ? +(totalTWins / (totalRounds / 2) * 100).toFixed(1) : 50,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', message: err.message }), { status: 500, headers: errorHeaders });
  }
}
