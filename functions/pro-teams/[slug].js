/**
 * Cloudflare Pages Function: /pro-teams/[slug]
 * Dynamic fallback for team pages without static player settings data.
 * Only triggered when no pre-built static page exists for the slug.
 * Fetches team data from PandaScore and renders a full HTML page.
 */
export async function onRequestGet(context) {
  const { env, params } = context;
  const apiKey = env.PANDASCORE_API_KEY;
  const slug = params.slug;

  if (!slug || !apiKey) {
    return new Response('Not found', { status: 404 });
  }

  try {
    // Step 1: Resolve team from PandaScore
    // Try slug-based lookup first (e.g., "natus-vincere" -> "natus-vincere-cs-go")
    let team = null;
    let teamId = null;

    const slugRes = await fetch(
      `https://api.pandascore.co/teams?filter[slug]=${encodeURIComponent(slug + '-cs-go')}&per_page=1&token=${apiKey}`,
      { headers: { Accept: 'application/json' }, cf: { cacheTtl: 3600 } }
    );
    if (slugRes.ok) {
      const slugTeams = await slugRes.json();
      if (slugTeams.length > 0) {
        team = slugTeams[0];
        teamId = team.id;
      }
    }

    // Fallback: search by name derived from slug
    if (!teamId) {
      const searchName = slug.replace(/-/g, ' ');
      const nameRes = await fetch(
        `https://api.pandascore.co/teams?search[name]=${encodeURIComponent(searchName)}&per_page=25&token=${apiKey}`,
        { headers: { Accept: 'application/json' }, cf: { cacheTtl: 3600 } }
      );
      if (nameRes.ok) {
        const nameTeams = await nameRes.json();
        const csTeam = nameTeams.find(t =>
          (t.current_videogame?.slug === 'cs-go' || t.current_videogame?.slug === 'cs2') &&
          t.slug?.replace(/-cs-go$/, '').replace(/-cs2$/, '') === slug
        ) || nameTeams.find(t =>
          (t.current_videogame?.slug === 'cs-go' || t.current_videogame?.slug === 'cs2') &&
          t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug
        ) || nameTeams.find(t =>
          t.current_videogame?.slug === 'cs-go' || t.current_videogame?.slug === 'cs2'
        );
        if (csTeam) {
          team = csTeam;
          teamId = csTeam.id;
        }
      }
    }

    if (!teamId || !team) {
      return new Response(render404(slug), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Step 2: Fetch stats + recent matches in parallel
    const [statsRes, matchesRes] = await Promise.all([
      fetch(`https://api.pandascore.co/csgo/teams/${teamId}/stats?token=${apiKey}`, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 1800 },
      }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.pandascore.co/csgo/matches/past?filter[opponent_id]=${teamId}&sort=-begin_at&per_page=10&token=${apiKey}`, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 1800 },
      }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    // Step 3: Build page data
    const stats = statsRes?.stats || {};
    const counts = stats.counts || {};
    const maps = (stats.maps || []).filter(m => m.total_played > 0).sort((a, b) => b.total_played - a.total_played);
    const players = team.players || [];
    const csPlayers = players.filter(p => p.active !== false);
    const recentMatches = matchesRes || [];

    const html = renderPage({
      team,
      stats: counts,
      maps,
      players: csPlayers,
      recentMatches,
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

function renderPage({ team, stats, maps, players, recentMatches, teamId }) {
  const teamName = team.name || 'Unknown Team';
  const teamImage = team.image_url || '';
  const location = team.location || '';
  const acronym = team.acronym || '';

  const matchesPlayed = stats.matches_played || 0;
  const matchesWon = stats.matches_won || 0;
  const matchWinRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed * 100).toFixed(1) : '0';
  const gamesPlayed = stats.games_played || 0;
  const roundsPlayed = stats.rounds_played || 0;
  const roundsWon = stats.rounds_won || 0;
  const roundWinRate = roundsPlayed > 0 ? (roundsWon / roundsPlayed * 100).toFixed(1) : '0';
  const ctPlayed = stats.ct_round_total_played || 0;
  const ctWon = stats.ct_round_wins || 0;
  const ctWinRate = ctPlayed > 0 ? (ctWon / ctPlayed * 100).toFixed(1) : '0';
  const tPlayed = stats.t_round_total_played || 0;
  const tWon = stats.t_round_wins || 0;
  const tWinRate = tPlayed > 0 ? (tWon / tPlayed * 100).toFixed(1) : '0';
  const pistolPlayed = stats.pistol_round_total_played || 0;
  const pistolWon = stats.pistol_round_wins || 0;
  const pistolWinRate = pistolPlayed > 0 ? (pistolWon / pistolPlayed * 100).toFixed(1) : '0';

  // Roster HTML
  let rosterHTML = '';
  if (players.length > 0) {
    rosterHTML = `
      <section class="dt-section">
        <h2 class="dt-title">Active Roster</h2>
        <div class="dt-roster">
          ${players.map(p => `
            <div class="dt-player">
              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" class="dt-player-img" />` : `<div class="dt-player-img dt-player-placeholder">${(p.name || '?')[0]}</div>`}
              <div class="dt-player-info">
                <span class="dt-player-name">${p.name || 'Unknown'}</span>
                ${p.first_name || p.last_name ? `<span class="dt-player-real">${(p.first_name || '')} ${(p.last_name || '')}</span>` : ''}
                ${p.nationality ? `<span class="dt-player-flag">${p.nationality}</span>` : ''}
                ${p.role ? `<span class="dt-player-role">${p.role}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  // Map pool HTML
  let mapPoolHTML = '';
  if (maps.length > 0) {
    mapPoolHTML = `
      <section class="dt-section">
        <h2 class="dt-title">Map Pool</h2>
        <div class="dt-table-wrap">
          <table class="dt-table">
            <thead><tr>
              <th>Map</th><th>Played</th><th>W-L</th><th>Win%</th><th>Pick%</th><th>Ban%</th><th>CT WR</th><th>T WR</th>
            </tr></thead>
            <tbody>
              ${maps.map(m => {
                const wr = m.total_played > 0 ? (m.wins / m.total_played * 100).toFixed(1) : '0';
                const ctR = m.ct_round_total_played > 0 ? (m.ct_round_wins / m.ct_round_total_played * 100).toFixed(1) : '-';
                const tR = m.t_round_total_played > 0 ? (m.t_round_wins / m.t_round_total_played * 100).toFixed(1) : '-';
                const pickR = (m.pick_rate * 100).toFixed(0);
                const banR = (m.ban_rate * 100).toFixed(0);
                return `<tr>
                  <td style="text-align:left;font-weight:700">${m.name}</td>
                  <td>${m.total_played}</td>
                  <td>${m.wins}-${m.losses}</td>
                  <td style="color:${parseFloat(wr) >= 50 ? '#2ecc71' : '#e74c3c'};font-weight:700">${wr}%</td>
                  <td style="color:#2ecc71">${pickR}%</td>
                  <td style="color:#e74c3c">${banR}%</td>
                  <td style="color:#5b9bd5">${ctR}%</td>
                  <td style="color:#e8c44a">${tR}%</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  // Recent matches HTML
  let matchesHTML = '';
  if (recentMatches.length > 0) {
    matchesHTML = `
      <section class="dt-section">
        <h2 class="dt-title">Recent Matches</h2>
        <div class="dt-matches">
          ${recentMatches.map(m => {
            const ops = m.opponents || [];
            const t1 = ops[0]?.opponent || {};
            const t2 = ops[1]?.opponent || {};
            const r1 = m.results?.find(r => r.team_id === t1.id)?.score ?? '-';
            const r2 = m.results?.find(r => r.team_id === t2.id)?.score ?? '-';
            const isWin = m.winner_id === teamId;
            const date = m.begin_at ? new Date(m.begin_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
            return `
              <a href="/match-detail/?id=${m.id}" class="dt-match ${isWin ? 'win' : 'loss'}">
                <span class="dt-match-result">${isWin ? 'W' : 'L'}</span>
                <div class="dt-match-teams">
                  <span class="dt-match-team">${t1.name || 'TBD'}</span>
                  <span class="dt-match-score">${r1} - ${r2}</span>
                  <span class="dt-match-team">${t2.name || 'TBD'}</span>
                </div>
                <span class="dt-match-date">${date}</span>
              </a>`;
          }).join('')}
        </div>
      </section>`;
  }

  const title = `${teamName} CS2 Team Stats — Competitive Performance | CSGOLuck Wiki`;
  const description = `${teamName} CS2 competitive statistics: match record, map pool, win rates, and recent results.`;

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

.dt-wrap{max-width:900px;margin:0 auto;padding:2rem 1.5rem}
.breadcrumb{font-size:.82rem;color:var(--text2);margin-bottom:1.5rem}
.breadcrumb a{color:var(--text2)}
.breadcrumb a:hover{color:var(--accent)}
.breadcrumb .sep{margin:0 .4rem;color:var(--text2)}

/* Team Header */
.dt-header{display:flex;align-items:center;gap:1.25rem;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border)}
.dt-logo{width:64px;height:64px;border-radius:8px;object-fit:contain;background:var(--bg3);padding:6px;flex-shrink:0}
.dt-logo-placeholder{width:64px;height:64px;border-radius:8px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:var(--text2);flex-shrink:0}
.dt-header-info h1{font-size:1.6rem;font-weight:800;margin-bottom:.25rem}
.dt-header-meta{display:flex;gap:.75rem;align-items:center;font-size:.82rem;color:var(--text2)}
.dt-header-meta .dt-loc{background:var(--bg3);padding:.15rem .45rem;border-radius:3px;font-weight:600;text-transform:uppercase;font-size:.7rem}

/* Stats Overview */
.dt-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1.5rem}
.dt-stat-card{background:var(--bg2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:4px;padding:.6rem .75rem;text-align:center}
.dt-stat-val{font-size:1.3rem;font-weight:800;color:var(--accent);display:block}
.dt-stat-lbl{font-size:.6rem;color:var(--text2);text-transform:uppercase;letter-spacing:.03em}

/* Round Stats */
.dt-round-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:1.5rem}
.dt-round-card{background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:.65rem;text-align:center}
.dt-round-val{font-size:1.1rem;font-weight:800;display:block}
.dt-round-lbl{font-size:.6rem;color:var(--text2);text-transform:uppercase}

/* Sections */
.dt-section{margin-bottom:2rem}
.dt-title{font-size:1.1rem;font-weight:700;margin-bottom:.75rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}

/* Roster */
.dt-roster{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.5rem}
.dt-player{display:flex;align-items:center;gap:.65rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:.65rem .75rem}
.dt-player-img{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;background:var(--bg3)}
.dt-player-placeholder{display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text2);font-size:.9rem}
.dt-player-info{display:flex;flex-direction:column;min-width:0}
.dt-player-name{font-weight:700;font-size:.88rem}
.dt-player-real{font-size:.72rem;color:var(--text2)}
.dt-player-flag{font-size:.65rem;color:var(--text2);text-transform:uppercase;font-weight:600}
.dt-player-role{font-size:.62rem;color:var(--accent);text-transform:uppercase;font-weight:700}

/* Table */
.dt-table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:4px}
.dt-table{width:100%;border-collapse:collapse;background:var(--bg2);font-size:.82rem}
.dt-table thead{background:var(--bg3)}
.dt-table th{padding:.6rem .5rem;text-align:center;font-weight:700;text-transform:uppercase;font-size:.62rem;letter-spacing:.04em;color:var(--text)}
.dt-table td{padding:.5rem .5rem;border-bottom:1px solid var(--border);text-align:center}
.dt-table tbody tr:hover td{background:var(--bg3)}

/* Matches */
.dt-matches{display:flex;flex-direction:column;gap:.5rem}
.dt-match{display:flex;align-items:center;gap:.75rem;padding:.6rem .85rem;background:var(--bg2);border:1px solid var(--border);border-radius:4px;color:inherit;text-decoration:none;transition:border-color .15s}
.dt-match:hover{border-color:var(--accent);text-decoration:none}
.dt-match.win{border-left:3px solid var(--accent)}
.dt-match.loss{border-left:3px solid #e74c3c}
.dt-match-result{font-size:.7rem;font-weight:800;width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:3px;flex-shrink:0}
.dt-match.win .dt-match-result{background:rgba(46,204,113,.15);color:var(--accent)}
.dt-match.loss .dt-match-result{background:rgba(231,76,60,.15);color:#e74c3c}
.dt-match-teams{display:flex;align-items:center;gap:.5rem;flex:1;min-width:0;justify-content:center}
.dt-match-team{font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.dt-match-team:last-of-type{text-align:right}
.dt-match-score{font-size:.9rem;font-weight:800;flex-shrink:0;min-width:40px;text-align:center;color:var(--text)}
.dt-match-date{font-size:.72rem;color:var(--text2);flex-shrink:0;white-space:nowrap}

/* Note banner */
.dt-note{background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.75rem 1rem;font-size:.82rem;color:var(--text2);margin-bottom:1.5rem;text-align:center}
.dt-note a{color:var(--accent);font-weight:600}

/* Back link */
.dt-back{display:inline-flex;align-items:center;gap:.3rem;font-size:.82rem;color:var(--text2);margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border)}
.dt-back:hover{color:var(--accent)}

@media(max-width:600px){
  .dt-stats-grid{grid-template-columns:repeat(2,1fr)}
  .dt-round-grid{grid-template-columns:1fr}
  .dt-header{flex-direction:column;text-align:center}
  .dt-roster{grid-template-columns:1fr}
}
</style>
</head>
<body>
<div class="dt-wrap">

<nav class="breadcrumb">
  <a href="/">Home</a><span class="sep">/</span>
  <a href="/pro-teams/">Teams</a><span class="sep">/</span>
  <span>${esc(teamName)}</span>
</nav>

<div class="dt-header">
  ${teamImage ? `<img src="${esc(teamImage)}" alt="${esc(teamName)}" class="dt-logo" />` : `<div class="dt-logo-placeholder">${esc(acronym || teamName[0] || '?')}</div>`}
  <div class="dt-header-info">
    <h1>${esc(teamName)}</h1>
    <div class="dt-header-meta">
      ${acronym ? `<span>${esc(acronym)}</span>` : ''}
      ${location ? `<span class="dt-loc">${esc(location)}</span>` : ''}
    </div>
  </div>
</div>

<div class="dt-note">
  This team doesn't have player settings data yet. Showing competitive stats from PandaScore.
  <br><a href="/pro-teams/">Browse teams with settings data &rarr;</a>
</div>

${matchesPlayed > 0 ? `
<section class="dt-section">
  <h2 class="dt-title">Competitive Overview</h2>
  <div class="dt-stats-grid">
    <div class="dt-stat-card"><span class="dt-stat-val">${matchWinRate}%</span><span class="dt-stat-lbl">Match Win Rate</span></div>
    <div class="dt-stat-card"><span class="dt-stat-val">${gamesPlayed}</span><span class="dt-stat-lbl">Maps Played</span></div>
    <div class="dt-stat-card"><span class="dt-stat-val">${roundWinRate}%</span><span class="dt-stat-lbl">Round Win Rate</span></div>
    <div class="dt-stat-card"><span class="dt-stat-val">${pistolWinRate}%</span><span class="dt-stat-lbl">Pistol Win Rate</span></div>
  </div>
  <div class="dt-round-grid">
    <div class="dt-round-card"><span class="dt-round-val" style="color:#5b9bd5">${ctWinRate}%</span><span class="dt-round-lbl">CT Round WR</span></div>
    <div class="dt-round-card"><span class="dt-round-val" style="color:#e8c44a">${tWinRate}%</span><span class="dt-round-lbl">T Round WR</span></div>
    <div class="dt-round-card"><span class="dt-round-val">${matchesWon}-${matchesPlayed - matchesWon}</span><span class="dt-round-lbl">Match Record</span></div>
  </div>
</section>
` : ''}

${rosterHTML}
${mapPoolHTML}
${matchesHTML}

<a href="/pro-teams/" class="dt-back">&larr; Back to All Teams</a>

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
<title>Team Not Found | CSGOLuck Wiki</title>
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
  <h1>Team Not Found</h1>
  <p>"${esc(name)}" could not be found in the CS2 team database.</p>
  <a href="/pro-teams/">&larr; Browse All Teams</a>
</div>
</body>
</html>`;
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
