/**
 * Cloudflare Pages Function: /pro-players/[slug]
 * Dynamic fallback for player pages without static settings data.
 * Only triggered when no pre-built static page exists for the slug.
 * Fetches player data + stats from PandaScore and renders a full HTML page.
 */
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const apiKey = env.PANDASCORE_API_KEY;
  const slug = params.slug;

  if (!slug || !apiKey) {
    return new Response('Not found', { status: 404 });
  }

  // Try to serve the static Astro-built page first.
  // If a pre-built player page exists (with settings data), serve that instead.
  try {
    const assetRes = await env.ASSETS.fetch(request);
    if (assetRes.status !== 404) {
      return assetRes;
    }
  } catch (_) {
    // ASSETS.fetch not available or errored — continue to dynamic render
  }

  try {
    // Step 1: Resolve player from PandaScore
    let player = null;
    let playerId = null;

    // Strategy 1: Exact slug lookup with CS preference
    const slugRes = await fetch(
      `https://api.pandascore.co/players?filter[slug]=${encodeURIComponent(slug)}&per_page=10&token=${apiKey}`,
      { headers: { Accept: 'application/json' }, cf: { cacheTtl: 3600 } }
    );
    if (slugRes.ok) {
      const players = await slugRes.json();
      const csPlayer = players.find(p =>
        p.current_videogame?.slug === 'cs-go' || p.current_videogame?.slug === 'cs-2' ||
        p.current_videogame?.id === 3 || p.current_videogame?.id === 14
      );
      if (csPlayer) {
        player = csPlayer;
        playerId = csPlayer.id;
      } else if (players.length > 0) {
        player = players[0];
        playerId = players[0].id;
      }
    }

    // Strategy 2: Name-based search
    if (!playerId) {
      const searchName = slug.replace(/-/g, ' ');
      const nameRes = await fetch(
        `https://api.pandascore.co/csgo/players?search[name]=${encodeURIComponent(searchName)}&per_page=15&token=${apiKey}`,
        { headers: { Accept: 'application/json' }, cf: { cacheTtl: 3600 } }
      );
      if (nameRes.ok) {
        const players = await nameRes.json();
        const exact = players.find(p =>
          p.slug === slug || p.name.toLowerCase() === searchName.toLowerCase()
        );
        if (exact) {
          player = exact;
          playerId = exact.id;
        } else if (players.length > 0) {
          player = players[0];
          playerId = players[0].id;
        }
      }
    }

    if (!playerId || !player) {
      return new Response(render404(slug), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Step 2: Fetch detailed player info + stats + recent team matches in parallel
    const teamId = player.current_team?.id;
    const [detailRes, statsRes, matchesRes] = await Promise.all([
      fetch(`https://api.pandascore.co/csgo/players/${playerId}?token=${apiKey}`, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 1800 },
      }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.pandascore.co/csgo/players/${playerId}/stats?token=${apiKey}`, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 1800 },
      }).then(r => r.ok ? r.json() : null).catch(() => null),
      teamId ? fetch(`https://api.pandascore.co/csgo/matches/past?filter[opponent_id]=${teamId}&sort=-begin_at&per_page=10&token=${apiKey}`, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 1800 },
      }).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
    ]);

    // Merge detail data into player if available
    if (detailRes) {
      player = { ...player, ...detailRes };
    }

    const html = renderPage({
      player,
      stats: statsRes,
      recentMatches: matchesRes || [],
      teamId,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
      },
    });
  } catch (err) {
    return new Response('Server error: ' + err.message, { status: 500 });
  }
}

function renderPage({ player, stats, recentMatches, teamId }) {
  const name = player.name || 'Unknown';
  const realName = [player.first_name, player.last_name].filter(Boolean).join(' ');
  const image = player.image_url || '';
  const nationality = player.nationality || '';
  const age = player.age || null;
  const role = player.role || '';
  const team = player.current_team;
  const teamName = team?.name || '';
  const teamImage = team?.image_url || '';
  const teamSlug = team?.slug?.replace(/-cs-go$/, '').replace(/-cs2$/, '') || '';

  // Stats
  const counts = stats?.stats?.counts || {};
  const avgs = stats?.stats?.per_game_averages || {};
  const perRound = stats?.stats?.per_round_averages || {};
  const lastGames = (stats?.last_games || []).slice(0, 5);

  const kills = counts.kills || 0;
  const deaths = counts.deaths || 0;
  const assists = counts.assists || 0;
  const headshots = counts.headshots || 0;
  const roundsPlayed = counts.rounds_played || 0;
  const matchesPlayed = counts.matches_played || 0;
  const matchesWon = counts.matches_won || 0;
  const gamesPlayed = counts.games_played || 0;
  const gamesWon = counts.games_won || 0;

  const kd = deaths > 0 ? (kills / deaths).toFixed(2) : '0';
  const hsPercent = kills > 0 ? (headshots / kills * 100).toFixed(1) : '0';
  const matchWinRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed * 100).toFixed(1) : '0';
  const mapWinRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed * 100).toFixed(1) : '0';

  const avgRating = avgs.hltv_game_rating != null ? Number(avgs.hltv_game_rating).toFixed(2) : '-';
  const avgAdr = avgs.adr != null ? Number(avgs.adr).toFixed(1) : '-';
  const avgKills = avgs.kills != null ? Number(avgs.kills).toFixed(1) : '-';
  const avgDeaths = avgs.deaths != null ? Number(avgs.deaths).toFixed(1) : '-';
  const avgAssists = avgs.assists != null ? Number(avgs.assists).toFixed(1) : '-';
  const avgKast = avgs.kast != null ? (Number(avgs.kast) * 100).toFixed(1) : '-';
  const avgFirstKillsDiff = avgs.first_kills_diff != null ? (avgs.first_kills_diff >= 0 ? '+' : '') + Number(avgs.first_kills_diff).toFixed(2) : '-';
  const avgFlashAssists = avgs.flash_assists != null ? Number(avgs.flash_assists).toFixed(1) : '-';

  // Recent games table
  let recentGamesHTML = '';
  if (lastGames.length > 0) {
    recentGamesHTML = `
      <section class="dp-section">
        <h2 class="dp-title">Recent Performances</h2>
        <div class="dp-table-wrap">
          <table class="dp-table">
            <thead><tr>
              <th>Opponent</th><th>K</th><th>D</th><th>A</th><th>ADR</th><th>KAST</th><th>Rating</th>
            </tr></thead>
            <tbody>
              ${lastGames.map(g => {
                const oppName = g.opponent?.name || 'Unknown';
                const ratingVal = g.rating != null ? Number(g.rating).toFixed(2) : '-';
                const ratingColor = g.rating >= 1.1 ? '#2ecc71' : g.rating <= 0.9 ? '#e74c3c' : 'var(--text)';
                const kastVal = g.kast != null ? (Number(g.kast) * 100).toFixed(0) + '%' : '-';
                return `<tr>
                  <td style="text-align:left;font-weight:600">${esc(oppName)}</td>
                  <td>${g.kills ?? '-'}</td>
                  <td>${g.deaths ?? '-'}</td>
                  <td>${g.assists ?? '-'}</td>
                  <td>${g.adr != null ? Number(g.adr).toFixed(0) : '-'}</td>
                  <td>${kastVal}</td>
                  <td style="color:${ratingColor};font-weight:700">${ratingVal}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  // Match history
  let matchesHTML = '';
  if (recentMatches.length > 0 && teamId) {
    matchesHTML = `
      <section class="dp-section">
        <h2 class="dp-title">Recent Matches</h2>
        <div class="dp-matches">
          ${recentMatches.map(m => {
            const ops = m.opponents || [];
            const t1 = ops[0]?.opponent || {};
            const t2 = ops[1]?.opponent || {};
            const r1 = m.results?.find(r => r.team_id === t1.id)?.score ?? '-';
            const r2 = m.results?.find(r => r.team_id === t2.id)?.score ?? '-';
            const isWin = m.winner_id === teamId;
            const date = m.begin_at ? new Date(m.begin_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            return `
              <a href="/match-detail/?id=${m.id}" class="dp-match ${isWin ? 'win' : 'loss'}">
                <span class="dp-match-result">${isWin ? 'W' : 'L'}</span>
                <div class="dp-match-teams">
                  <span class="dp-match-team">${esc(t1.name || 'TBD')}</span>
                  <span class="dp-match-score">${r1} - ${r2}</span>
                  <span class="dp-match-team">${esc(t2.name || 'TBD')}</span>
                </div>
                <span class="dp-match-date">${date}</span>
              </a>`;
          }).join('')}
        </div>
      </section>`;
  }

  // Team history
  const teams = (player.teams || []).filter(t => t.name);
  let teamHistoryHTML = '';
  if (teams.length > 1) {
    teamHistoryHTML = `
      <section class="dp-section">
        <h2 class="dp-title">Team History</h2>
        <div class="dp-team-history">
          ${teams.map(t => `
            <div class="dp-team-item">
              ${t.image_url ? `<img src="${esc(t.image_url)}" alt="${esc(t.name)}" class="dp-team-logo" />` : `<div class="dp-team-logo dp-team-placeholder">${(t.name || '?')[0]}</div>`}
              <span class="dp-team-name">${esc(t.name)}</span>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  const title = `${name} CS2 Player Stats & Performance | CSGOLuck Wiki`;
  const description = `${name}${realName ? ` (${realName})` : ''} CS2 stats: rating, ADR, K/D ratio, KAST, and recent match performances.`;

  return `<!DOCTYPE html>
<html lang="en" style="background:#0d0e12">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="theme-color" content="#2ecc71" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
:root{--bg:#0d0e12;--bg2:#13141a;--bg3:#1a1c24;--text:#ffffff;--text2:#909090;--accent:#2ecc71;--border:#242630}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Montserrat',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}

.dp-wrap{max-width:900px;margin:0 auto;padding:2rem 1.5rem}
.breadcrumb{font-size:.82rem;color:var(--text2);margin-bottom:1.5rem}
.breadcrumb a{color:var(--text2)}
.breadcrumb a:hover{color:var(--accent)}
.breadcrumb .sep{margin:0 .4rem;color:var(--text2)}

/* Player Header */
.dp-header{display:flex;align-items:center;gap:1.25rem;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border)}
.dp-avatar{width:80px;height:80px;border-radius:50%;object-fit:cover;background:var(--bg3);flex-shrink:0;border:3px solid var(--border)}
.dp-avatar-placeholder{width:80px;height:80px;border-radius:50%;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:var(--text2);flex-shrink:0;border:3px solid var(--border)}
.dp-header-info h1{font-size:1.6rem;font-weight:800;margin-bottom:.15rem}
.dp-header-info h1 .dp-real-name{font-size:.85rem;font-weight:400;color:var(--text2);margin-left:.5rem}
.dp-header-meta{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;font-size:.82rem;color:var(--text2)}
.dp-tag{background:var(--bg3);padding:.15rem .5rem;border-radius:3px;font-weight:600;font-size:.72rem;text-transform:uppercase;letter-spacing:.02em}
.dp-tag.role{color:var(--accent);border:1px solid rgba(46,204,113,.25)}
.dp-tag.country{color:var(--text)}
.dp-team-badge{display:inline-flex;align-items:center;gap:.35rem;background:var(--bg3);padding:.2rem .55rem;border-radius:3px;font-weight:600;font-size:.78rem;color:var(--text);text-decoration:none}
.dp-team-badge:hover{border-color:var(--accent);text-decoration:none;color:var(--accent)}
.dp-team-badge img{height:16px;width:16px;object-fit:contain;border-radius:2px}

/* Stats Grid */
.dp-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1.5rem}
.dp-stat-card{background:var(--bg2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:4px;padding:.6rem .75rem;text-align:center}
.dp-stat-val{font-size:1.3rem;font-weight:800;color:var(--accent);display:block}
.dp-stat-lbl{font-size:.6rem;color:var(--text2);text-transform:uppercase;letter-spacing:.03em}

/* Secondary stats */
.dp-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1.5rem}
.dp-stat-sm{background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:.55rem .65rem;text-align:center}
.dp-stat-sm .dp-stat-val{font-size:1.05rem;color:var(--text)}
.dp-stat-sm .dp-stat-lbl{font-size:.58rem}

/* Totals bar */
.dp-totals{display:flex;gap:1.25rem;flex-wrap:wrap;margin-bottom:1.5rem;padding:.85rem 1rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px}
.dp-total-item{display:flex;flex-direction:column;align-items:center;gap:.1rem}
.dp-total-val{font-size:1rem;font-weight:700}
.dp-total-lbl{font-size:.6rem;color:var(--text2);text-transform:uppercase}

/* Sections */
.dp-section{margin-bottom:2rem}
.dp-title{font-size:1.1rem;font-weight:700;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}

/* Table */
.dp-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:4px}
.dp-table{width:100%;border-collapse:collapse;background:var(--bg2);font-size:.82rem}
.dp-table thead{background:var(--bg3)}
.dp-table th{padding:.6rem .5rem;text-align:center;font-weight:700;text-transform:uppercase;font-size:.62rem;letter-spacing:.04em;color:var(--text)}
.dp-table td{padding:.5rem .5rem;border-bottom:1px solid var(--border);text-align:center}
.dp-table tbody tr:hover td{background:var(--bg3)}

/* Matches */
.dp-matches{display:flex;flex-direction:column;gap:.5rem}
.dp-match{display:flex;align-items:center;gap:.75rem;padding:.6rem .85rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;color:inherit;text-decoration:none;transition:border-color .15s}
.dp-match:hover{border-color:var(--accent);text-decoration:none}
.dp-match.win{border-left:3px solid var(--accent)}
.dp-match.loss{border-left:3px solid #e74c3c}
.dp-match-result{font-size:.7rem;font-weight:800;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:3px;flex-shrink:0}
.dp-match.win .dp-match-result{background:rgba(46,204,113,.15);color:var(--accent)}
.dp-match.loss .dp-match-result{background:rgba(231,76,60,.15);color:#e74c3c}
.dp-match-teams{display:flex;align-items:center;gap:.5rem;flex:1;min-width:0;justify-content:center}
.dp-match-team{font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.dp-match-team:last-of-type{text-align:right}
.dp-match-score{font-size:.9rem;font-weight:800;flex-shrink:0;min-width:40px;text-align:center;color:var(--text)}
.dp-match-date{font-size:.72rem;color:var(--text2);flex-shrink:0;white-space:nowrap}

/* Team history */
.dp-team-history{display:flex;flex-wrap:wrap;gap:.5rem}
.dp-team-item{display:flex;align-items:center;gap:.5rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:.45rem .65rem}
.dp-team-logo{width:24px;height:24px;border-radius:3px;object-fit:contain;flex-shrink:0;background:var(--bg3)}
.dp-team-placeholder{display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text2);font-size:.7rem}
.dp-team-name{font-size:.8rem;font-weight:600}

/* Note banner */
.dp-note{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.75rem 1rem;font-size:.82rem;color:var(--text2);margin-bottom:1.5rem;text-align:center}
.dp-note a{color:var(--accent);font-weight:600}

/* Back link */
.dp-back{display:inline-flex;align-items:center;gap:.3rem;font-size:.82rem;color:var(--text2);margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border)}
.dp-back:hover{color:var(--accent)}

@media(max-width:600px){
  .dp-stats-grid,.dp-stats-row{grid-template-columns:repeat(2,1fr)}
  .dp-header{flex-direction:column;text-align:center}
  .dp-header-meta{justify-content:center}
}
</style>
</head>
<body>
<div class="dp-wrap">

<nav class="breadcrumb">
  <a href="/">Home</a><span class="sep">/</span>
  <a href="/pro-players/">Players</a><span class="sep">/</span>
  <span>${esc(name)}</span>
</nav>

<div class="dp-header">
  ${image ? `<img src="${esc(image)}" alt="${esc(name)}" class="dp-avatar" />` : `<div class="dp-avatar-placeholder">${esc(name[0] || '?')}</div>`}
  <div class="dp-header-info">
    <h1>${esc(name)}${realName ? `<span class="dp-real-name">${esc(realName)}</span>` : ''}</h1>
    <div class="dp-header-meta">
      ${role ? `<span class="dp-tag role">${esc(role)}</span>` : ''}
      ${nationality ? `<span class="dp-tag country">${esc(nationality)}</span>` : ''}
      ${age ? `<span class="dp-tag">Age ${age}</span>` : ''}
      ${teamName ? `<a href="/pro-teams/${esc(teamSlug)}/" class="dp-team-badge">${teamImage ? `<img src="${esc(teamImage)}" alt="${esc(teamName)}" />` : ''}${esc(teamName)}</a>` : ''}
    </div>
  </div>
</div>

<div class="dp-note">
  This player doesn't have settings or config data yet. Showing competitive stats from PandaScore.
  <br><a href="/pro-players/">Browse players with full settings data &rarr;</a>
</div>

${matchesPlayed > 0 ? `
<section class="dp-section">
  <h2 class="dp-title">Performance Overview</h2>
  <div class="dp-stats-grid">
    <div class="dp-stat-card"><span class="dp-stat-val">${avgRating}</span><span class="dp-stat-lbl">Avg Rating</span></div>
    <div class="dp-stat-card"><span class="dp-stat-val">${avgAdr}</span><span class="dp-stat-lbl">Avg ADR</span></div>
    <div class="dp-stat-card"><span class="dp-stat-val">${kd}</span><span class="dp-stat-lbl">K/D Ratio</span></div>
    <div class="dp-stat-card"><span class="dp-stat-val">${avgKast}%</span><span class="dp-stat-lbl">KAST%</span></div>
  </div>
  <div class="dp-stats-row">
    <div class="dp-stat-sm"><span class="dp-stat-val">${avgKills}</span><span class="dp-stat-lbl">Avg Kills</span></div>
    <div class="dp-stat-sm"><span class="dp-stat-val">${avgDeaths}</span><span class="dp-stat-lbl">Avg Deaths</span></div>
    <div class="dp-stat-sm"><span class="dp-stat-val">${hsPercent}%</span><span class="dp-stat-lbl">HS%</span></div>
    <div class="dp-stat-sm"><span class="dp-stat-val">${avgFirstKillsDiff}</span><span class="dp-stat-lbl">FK Diff/Map</span></div>
  </div>
  <div class="dp-totals">
    <div class="dp-total-item"><span class="dp-total-val">${matchesPlayed}</span><span class="dp-total-lbl">Matches</span></div>
    <div class="dp-total-item"><span class="dp-total-val">${matchWinRate}%</span><span class="dp-total-lbl">Match WR</span></div>
    <div class="dp-total-item"><span class="dp-total-val">${gamesPlayed}</span><span class="dp-total-lbl">Maps</span></div>
    <div class="dp-total-item"><span class="dp-total-val">${mapWinRate}%</span><span class="dp-total-lbl">Map WR</span></div>
    <div class="dp-total-item"><span class="dp-total-val">${kills.toLocaleString()}</span><span class="dp-total-lbl">Total Kills</span></div>
    <div class="dp-total-item"><span class="dp-total-val">${roundsPlayed.toLocaleString()}</span><span class="dp-total-lbl">Rounds</span></div>
  </div>
</section>
` : '<div class="dp-note">No competitive stats available for this player yet.</div>'}

${recentGamesHTML}
${matchesHTML}
${teamHistoryHTML}

<a href="/pro-players/" class="dp-back">&larr; Back to All Players</a>

</div>
</body>
</html>`;
}

function render404(slug) {
  const name = slug.replace(/-/g, ' ');
  return `<!DOCTYPE html>
<html lang="en" style="background:#0d0e12">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Player Not Found | CSGOLuck Wiki</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet" />
<style>
:root{--bg:#0d0e12;--bg2:#13141a;--bg3:#1a1c24;--text:#ffffff;--text2:#909090;--accent:#2ecc71;--border:#242630}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Montserrat',sans-serif;background:var(--bg);color:var(--text);display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}
h1{font-size:1.4rem;margin-bottom:.5rem}
p{color:var(--text2);font-size:.9rem;margin-bottom:1rem}
a{color:var(--accent);text-decoration:none;font-weight:600}
a:hover{text-decoration:underline}
</style>
</head>
<body>
<div>
  <h1>Player Not Found</h1>
  <p>"${esc(name)}" could not be found in the CS2 player database.</p>
  <a href="/pro-players/">&larr; Browse All Players</a>
</div>
</body>
</html>`;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
