#!/usr/bin/env node
/**
 * Player & Team Resolution Health Check
 * Verifies PandaScore resolution for all players and teams in the CSGOLuck Wiki database.
 *
 * Usage:
 *   node scripts/check-player-resolution.mjs                # Top 45 players + all teams + API pings
 *   node scripts/check-player-resolution.mjs --all          # All ~1,012 players + teams + API pings
 *   node scripts/check-player-resolution.mjs --batch 2      # Batch 2 of 5 (~194 players) + teams
 *   node scripts/check-player-resolution.mjs --failing      # Re-check previous failures only
 *   node scripts/check-player-resolution.mjs --teams-only   # Only check team resolution
 *   node scripts/check-player-resolution.mjs --api-only     # Only check API endpoint availability
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PLAYERS_DIR = join(PROJECT_ROOT, 'src', 'data', 'players');
const REPORTS_DIR = join(PROJECT_ROOT, 'reports', 'resolution');

// Ensure reports directory exists
if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });

// Load API key from .dev.vars
const devVarsPath = join(PROJECT_ROOT, '.dev.vars');
let API_KEY = '';
let PRICEMPIRE_KEY = '';
let STEAM_KEY = '';
if (existsSync(devVarsPath)) {
  const vars = readFileSync(devVarsPath, 'utf-8');
  API_KEY = vars.match(/PANDASCORE_API_KEY=(.+)/)?.[1]?.trim() || '';
  PRICEMPIRE_KEY = vars.match(/PRICEMPIRE_API_KEY=(.+)/)?.[1]?.trim() || '';
  STEAM_KEY = vars.match(/STEAM_API_KEY=(.+)/)?.[1]?.trim() || '';
}

if (!API_KEY) {
  console.error('ERROR: PANDASCORE_API_KEY not found in .dev.vars');
  process.exit(1);
}

const DELAY_MS = 1200;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Top 45 priority players (slug = filename without .json)
const TOP_PLAYERS = [
  'donk', 's1mple', 'zywoo', 'niko', 'm0nesy', 'ropz', 'device', 'electronic',
  'bit', 'ax1le', 'twistzz', 'rain', 'frozen', 'broky', 'hunter', 'jl',
  'w0nderful', 'im', 'brollan', 'xantares', 'jks', 'magisk', 'gla1ve',
  'karrigan', 'aleksib', 'cadian', 'tabsen', 'blamef', 'spinx', 'mezii',
  'degster', 'hooxi', 'nexa', 'syrson', 'flamez', 'stavn', 'jabbi',
  'torzsi', 'siuhy', 'isak', 'keoz', 'kennys', 'olofmeister', 'coldzera',
  'fallen', 'stewie2k', 'autimatic', 'nawwk', 'hallzerk',
];

const NON_TEAMS = ['free agent', 'retired', 'inactive', 'no team', 'none', 'benched', 'n/a', ''];

// ── HTTP Fetch Helper ──────────────────────────────────────────────────────────
async function fetchJSON(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429) {
        const wait = Math.pow(2, i) * 5000;
        console.log(`    Rate limited, waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      if (i === retries) return null;
      await sleep(2000);
    }
  }
  return null;
}

// ── Resolution helpers (replicate production logic exactly) ────────────────────
function isCSPlayer(p) {
  return (
    p.current_videogame?.slug === 'cs-go' ||
    p.current_videogame?.slug === 'cs-2' ||
    p.current_videogame?.id === 3 ||
    p.current_videogame?.id === 14
  );
}

function scorePlayer(p, ctx) {
  let score = 0;
  if (isCSPlayer(p)) score += 50;
  if (p.current_team) score += 20;
  if (ctx.team && p.current_team?.name?.toLowerCase().includes(ctx.team.toLowerCase())) score += 30;
  if (ctx.country && p.nationality) {
    const c = ctx.country.toLowerCase();
    const n = p.nationality.toLowerCase();
    if (n === c || n.includes(c) || c.includes(n)) score += 25;
  }
  if (p.slug === ctx.slug) score += 10;
  return score;
}

function pickBest(players, ctx) {
  if (!players || players.length === 0) return null;
  if (players.length === 1) return players[0];
  return [...players].sort((a, b) => scorePlayer(b, ctx) - scorePlayer(a, ctx))[0];
}

// ── Player Resolution ──────────────────────────────────────────────────────────
async function resolvePlayer(playerData) {
  const { slug, name, team, country } = playerData;
  const ctx = { slug, team, country };
  let pid = null;
  let resolvedVia = null;
  let apiCalls = 0;

  // Strategy 0: Team roster lookup
  if (team && !NON_TEAMS.includes(team.toLowerCase().trim())) {
    const url = `https://api.pandascore.co/csgo/teams?search[name]=${encodeURIComponent(team)}&per_page=5&token=${API_KEY}`;
    apiCalls++;
    const teams = await fetchJSON(url);
    if (teams) {
      for (const t of teams) {
        if (t.players?.length > 0) {
          const match = t.players.find(p => p.name.toLowerCase() === name.toLowerCase());
          if (match) {
            pid = match.id;
            resolvedVia = 'team-roster';
            break;
          }
        }
      }
    }
    await sleep(DELAY_MS);
  }

  // Strategy 1: CSGO-specific search
  if (!pid) {
    const url = `https://api.pandascore.co/csgo/players?search[name]=${encodeURIComponent(name)}&per_page=10&token=${API_KEY}`;
    apiCalls++;
    const players = await fetchJSON(url);
    if (players?.length > 0) {
      const slugMatch = players.find(p => p.slug === slug);
      if (slugMatch) {
        pid = slugMatch.id;
        resolvedVia = 'csgo-slug';
      } else {
        const nameMatches = players.filter(p => p.name.toLowerCase() === name.toLowerCase());
        if (nameMatches.length > 0) {
          const best = pickBest(nameMatches, ctx);
          if (best) { pid = best.id; resolvedVia = 'csgo-name'; }
        } else {
          const best = pickBest(players, ctx);
          if (best) { pid = best.id; resolvedVia = 'csgo-best'; }
        }
      }
    }
    await sleep(DELAY_MS);
  }

  // Strategy 2: Slug filter (generic)
  if (!pid) {
    const url = `https://api.pandascore.co/players?filter[slug]=${encodeURIComponent(slug)}&per_page=10&token=${API_KEY}`;
    apiCalls++;
    const players = await fetchJSON(url);
    if (players?.length > 0) {
      const best = pickBest(players, ctx);
      if (best) { pid = best.id; resolvedVia = 'slug-filter'; }
    }
    await sleep(DELAY_MS);
  }

  // Strategy 3: Name search (generic)
  if (!pid) {
    const searchName = name || slug.replace(/-/g, ' ');
    const url = `https://api.pandascore.co/players?search[name]=${encodeURIComponent(searchName)}&per_page=10&token=${API_KEY}`;
    apiCalls++;
    const players = await fetchJSON(url);
    if (players?.length > 0) {
      const best = pickBest(players, ctx);
      if (best) { pid = best.id; resolvedVia = 'name-search'; }
    }
    await sleep(DELAY_MS);
  }

  return { pid, resolvedVia, apiCalls };
}

// ── Player Validation ──────────────────────────────────────────────────────────
async function validatePlayer(pid, local) {
  let player = await fetchJSON(`https://api.pandascore.co/csgo/players/${pid}?token=${API_KEY}`);
  if (!player) {
    player = await fetchJSON(`https://api.pandascore.co/players/${pid}?token=${API_KEY}`);
  }
  await sleep(DELAY_MS);

  const issues = [];
  if (!player) {
    issues.push('FETCH_FAILED');
    return { valid: false, issues, ps: null };
  }

  if (!isCSPlayer(player)) {
    issues.push(`WRONG_GAME:${player.current_videogame?.slug || 'unknown'}`);
  }

  if (!player.current_team) {
    // Only flag NO_TEAM if local data says they're on a real team
    if (!NON_TEAMS.includes(local.team.toLowerCase().trim())) {
      issues.push('NO_TEAM');
    }
  }

  // Team mismatch (warning-level)
  if (player.current_team && !NON_TEAMS.includes(local.team.toLowerCase().trim())) {
    const psTeam = player.current_team.name.toLowerCase();
    const localTeam = local.team.toLowerCase();
    if (!psTeam.includes(localTeam) && !localTeam.includes(psTeam)) {
      // Check partial matches (e.g., "Falcons Esports" vs "Team Falcons")
      const psWords = psTeam.split(/\s+/);
      const localWords = localTeam.split(/\s+/);
      const overlap = psWords.some(w => w.length > 2 && localWords.some(lw => lw.includes(w) || w.includes(lw)));
      if (!overlap) {
        issues.push(`TEAM_MISMATCH:local="${local.team}",ps="${player.current_team.name}"`);
      }
    }
  }

  if (player.name.toLowerCase() !== local.name.toLowerCase()) {
    issues.push(`NAME_MISMATCH:local="${local.name}",ps="${player.name}"`);
  }

  return {
    valid: issues.filter(i => !i.startsWith('TEAM_MISMATCH')).length === 0,
    issues,
    ps: {
      id: player.id,
      name: player.name,
      slug: player.slug,
      team: player.current_team?.name || null,
      game: player.current_videogame?.slug || null,
      nationality: player.nationality,
    },
  };
}

// ── Team Resolution Check ──────────────────────────────────────────────────────
function getUniqueTeams() {
  const files = readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json'));
  const teamMap = new Map();
  for (const f of files) {
    try {
      const p = JSON.parse(readFileSync(join(PLAYERS_DIR, f), 'utf-8'));
      const team = p.team?.trim();
      if (team && !NON_TEAMS.includes(team.toLowerCase())) {
        if (!teamMap.has(team.toLowerCase())) {
          teamMap.set(team.toLowerCase(), { name: team, slug: team.toLowerCase().replace(/\s+/g, '-'), players: [] });
        }
        teamMap.get(team.toLowerCase()).players.push(p.name);
      }
    } catch { /* skip invalid */ }
  }
  return [...teamMap.values()].sort((a, b) => b.players.length - a.players.length);
}

function isCSTeam(t) {
  return (
    t.current_videogame?.slug === 'cs-go' ||
    t.current_videogame?.slug === 'cs-2' ||
    t.current_videogame?.id === 3 ||
    t.current_videogame?.id === 14
  );
}

async function resolveTeam(teamData) {
  const { name } = teamData;
  let teamId = null;
  let resolvedName = null;
  let resolvedVia = null;
  let apiCalls = 0;
  const issues = [];

  // Strategy 1: CSGO-specific search
  const searchTerm = name;
  const csgoUrl = `https://api.pandascore.co/csgo/teams?search[name]=${encodeURIComponent(searchTerm)}&per_page=10&token=${API_KEY}`;
  apiCalls++;
  const csgoTeams = await fetchJSON(csgoUrl);
  if (csgoTeams?.length > 0) {
    const exact = csgoTeams.find(t => t.name.toLowerCase() === name.toLowerCase()) ||
                  csgoTeams.find(t => t.slug === teamData.slug);
    const best = exact || csgoTeams[0];
    teamId = best.id;
    resolvedName = best.name;
    resolvedVia = exact ? 'csgo-exact' : 'csgo-first';
  }
  await sleep(DELAY_MS);

  // Strategy 2: Try stripping "Team " prefix
  if (!teamId && name.toLowerCase().startsWith('team ')) {
    const alt = name.slice(5);
    const altUrl = `https://api.pandascore.co/csgo/teams?search[name]=${encodeURIComponent(alt)}&per_page=10&token=${API_KEY}`;
    apiCalls++;
    const altTeams = await fetchJSON(altUrl);
    if (altTeams?.length > 0) {
      const match = altTeams.find(t => t.name.toLowerCase() === alt.toLowerCase()) ||
                    altTeams.find(t => t.name.toLowerCase().includes(alt.toLowerCase()));
      if (match) {
        teamId = match.id;
        resolvedName = match.name;
        resolvedVia = 'csgo-prefix-strip';
      }
    }
    await sleep(DELAY_MS);
  }

  // Strategy 3: Generic slug filter
  if (!teamId) {
    const slugUrl = `https://api.pandascore.co/teams?filter[slug]=${encodeURIComponent(teamData.slug)}&per_page=5&token=${API_KEY}`;
    apiCalls++;
    const slugTeams = await fetchJSON(slugUrl);
    if (slugTeams?.length > 0) {
      const csTeam = slugTeams.find(t => isCSTeam(t)) || slugTeams[0];
      teamId = csTeam.id;
      resolvedName = csTeam.name;
      resolvedVia = 'slug-filter';
    }
    await sleep(DELAY_MS);
  }

  // Strategy 4: Generic name search
  if (!teamId) {
    const nameUrl = `https://api.pandascore.co/teams?search[name]=${encodeURIComponent(name)}&per_page=25&token=${API_KEY}`;
    apiCalls++;
    const nameTeams = await fetchJSON(nameUrl);
    if (nameTeams?.length > 0) {
      const csTeam = nameTeams.find(t => t.name.toLowerCase() === name.toLowerCase() && isCSTeam(t)) ||
                     nameTeams.find(t => isCSTeam(t)) ||
                     nameTeams.find(t => t.name.toLowerCase() === name.toLowerCase()) ||
                     nameTeams[0];
      teamId = csTeam.id;
      resolvedName = csTeam.name;
      resolvedVia = 'name-search';
    }
    await sleep(DELAY_MS);
  }

  if (!teamId) {
    issues.push('NOT_RESOLVED');
  }

  // Validate: try fetching match data for this team
  if (teamId) {
    const matchUrl = `https://api.pandascore.co/csgo/matches/past?filter[opponent_id]=${teamId}&filter[status]=finished&sort=-begin_at&per_page=1&token=${API_KEY}`;
    apiCalls++;
    const matches = await fetchJSON(matchUrl);
    if (!matches || matches.length === 0) {
      issues.push('NO_MATCHES');
    }
    await sleep(DELAY_MS);
  }

  return {
    name,
    localPlayerCount: teamData.players.length,
    teamId,
    resolvedName,
    resolvedVia,
    apiCalls,
    issues,
    status: issues.length === 0 ? 'pass' : issues.some(i => i === 'NOT_RESOLVED') ? 'fail' : 'warn',
  };
}

// ── API Endpoint Ping Check ────────────────────────────────────────────────────
async function checkApiEndpoints() {
  const results = [];

  // PandaScore
  const psUrl = `https://api.pandascore.co/csgo/players?per_page=1&token=${API_KEY}`;
  const psStart = Date.now();
  const psData = await fetchJSON(psUrl);
  results.push({
    name: 'PandaScore (players)',
    status: psData ? 'ok' : 'fail',
    latencyMs: Date.now() - psStart,
  });

  const psMatchUrl = `https://api.pandascore.co/csgo/matches/upcoming?per_page=1&token=${API_KEY}`;
  const psm = Date.now();
  const psMatchData = await fetchJSON(psMatchUrl);
  results.push({
    name: 'PandaScore (matches)',
    status: psMatchData ? 'ok' : 'fail',
    latencyMs: Date.now() - psm,
  });

  const psTournUrl = `https://api.pandascore.co/csgo/tournaments/running?per_page=1&token=${API_KEY}`;
  const pst = Date.now();
  const psTournData = await fetchJSON(psTournUrl);
  results.push({
    name: 'PandaScore (tournaments)',
    status: psTournData !== null ? 'ok' : 'fail',
    latencyMs: Date.now() - pst,
  });

  // PriceEmpire
  if (PRICEMPIRE_KEY) {
    const peUrl = `https://api.pricempire.com/v3/items/prices?api_key=${PRICEMPIRE_KEY}&currency=USD&app_id=730`;
    const pe = Date.now();
    const peData = await fetchJSON(peUrl);
    results.push({
      name: 'PriceEmpire (prices)',
      status: peData ? 'ok' : 'fail',
      latencyMs: Date.now() - pe,
    });
  } else {
    results.push({ name: 'PriceEmpire (prices)', status: 'skip', latencyMs: 0 });
  }

  // Steam News (no key required)
  const snUrl = 'https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=730&count=1&maxlength=0&format=json';
  const sn = Date.now();
  const snData = await fetchJSON(snUrl);
  results.push({
    name: 'Steam News API',
    status: snData?.appnews ? 'ok' : 'fail',
    latencyMs: Date.now() - sn,
  });

  // Steam Web API (inventory/vanity URL)
  if (STEAM_KEY) {
    const swUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_KEY}&vanityurl=test`;
    const sw = Date.now();
    const swData = await fetchJSON(swUrl);
    results.push({
      name: 'Steam Web API',
      status: swData?.response ? 'ok' : 'fail',
      latencyMs: Date.now() - sw,
    });
  } else {
    results.push({ name: 'Steam Web API', status: 'skip', latencyMs: 0 });
  }

  return results;
}

// ── Report Helpers ─────────────────────────────────────────────────────────────
function pad(str, len) { return String(str).padEnd(len); }
function rpad(str, len) { return String(str).padStart(len); }

function printPlayerResult(idx, total, r) {
  const status = r.status === 'pass' ? '\x1b[32mPASS\x1b[0m' :
                 r.status === 'warn' ? '\x1b[33mWARN\x1b[0m' :
                 '\x1b[31mFAIL\x1b[0m';
  const via = r.resolvedVia ? `(${r.resolvedVia})` : '';
  const team = r.ps?.team || 'no team';
  const extra = r.issues.length > 0 ? ` ${r.issues.join(', ')}` : '';
  console.log(`  [${rpad(idx, 3)}/${total}] ${pad(r.slug, 20)} ${status} ${pad(via, 16)} ${pad(team, 22)}${extra}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const flagAll = args.includes('--all');
  const flagTeamsOnly = args.includes('--teams-only');
  const flagApiOnly = args.includes('--api-only');
  const flagFailing = args.includes('--failing');
  const batchIdx = args.indexOf('--batch');
  const batchNum = batchIdx !== -1 ? parseInt(args[batchIdx + 1], 10) : 0;

  const startTime = Date.now();
  const report = {
    timestamp: new Date().toISOString(),
    mode: flagAll ? 'all' : flagTeamsOnly ? 'teams-only' : flagApiOnly ? 'api-only' : flagFailing ? 'failing' : batchNum ? `batch-${batchNum}` : 'top45',
    players: { checked: 0, passed: 0, warnings: 0, failed: 0, details: [] },
    teams: { checked: 0, passed: 0, warnings: 0, failed: 0, details: [] },
    apis: [],
    totalApiCalls: 0,
    durationMs: 0,
  };

  // ── API Endpoint Checks ──
  console.log('\n\x1b[1m=== API Endpoint Health Check ===\x1b[0m\n');
  report.apis = await checkApiEndpoints();
  for (const api of report.apis) {
    const icon = api.status === 'ok' ? '\x1b[32m OK \x1b[0m' :
                 api.status === 'skip' ? '\x1b[90mSKIP\x1b[0m' :
                 '\x1b[31mFAIL\x1b[0m';
    console.log(`  ${icon}  ${pad(api.name, 28)} ${api.latencyMs > 0 ? api.latencyMs + 'ms' : ''}`);
  }

  if (flagApiOnly) {
    report.durationMs = Date.now() - startTime;
    saveReport(report);
    return;
  }

  // ── Player Resolution Checks ──
  if (!flagTeamsOnly) {
    // Determine which players to check
    let playerSlugs = [];

    if (flagFailing) {
      const latestPath = join(REPORTS_DIR, 'latest.json');
      if (existsSync(latestPath)) {
        const prev = JSON.parse(readFileSync(latestPath, 'utf-8'));
        playerSlugs = (prev.players?.details || [])
          .filter(d => d.status !== 'pass')
          .map(d => d.slug);
        console.log(`\nRe-checking ${playerSlugs.length} previously failing/warning players`);
      } else {
        console.log('\nNo previous report found. Running top 45 instead.');
        playerSlugs = TOP_PLAYERS;
      }
    } else if (flagAll) {
      playerSlugs = readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } else if (batchNum) {
      const allSlugs = readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
      const topSet = new Set(TOP_PLAYERS);
      const remaining = allSlugs.filter(s => !topSet.has(s));
      const totalBatches = 5;
      const batchSize = Math.ceil(remaining.length / totalBatches);
      const start = (batchNum - 1) * batchSize;
      playerSlugs = [...TOP_PLAYERS, ...remaining.slice(start, start + batchSize)];
      console.log(`\nBatch ${batchNum}/${totalBatches}: ${TOP_PLAYERS.length} top + ${Math.min(batchSize, remaining.length - start)} batch = ${playerSlugs.length} players`);
    } else {
      playerSlugs = TOP_PLAYERS;
    }

    console.log(`\n\x1b[1m=== Player Resolution Check (${playerSlugs.length} players) ===\x1b[0m\n`);

    for (let i = 0; i < playerSlugs.length; i++) {
      const slug = playerSlugs[i];
      const filePath = join(PLAYERS_DIR, `${slug}.json`);
      if (!existsSync(filePath)) {
        const result = { slug, status: 'fail', issues: ['FILE_NOT_FOUND'], resolvedVia: null, ps: null, apiCalls: 0 };
        report.players.details.push(result);
        report.players.failed++;
        printPlayerResult(i + 1, playerSlugs.length, result);
        continue;
      }

      const local = JSON.parse(readFileSync(filePath, 'utf-8'));
      const { pid, resolvedVia, apiCalls } = await resolvePlayer(local);
      report.totalApiCalls += apiCalls;

      if (!pid) {
        const result = { slug, status: 'fail', issues: ['NOT_RESOLVED'], resolvedVia: null, ps: null, apiCalls };
        report.players.details.push(result);
        report.players.failed++;
        printPlayerResult(i + 1, playerSlugs.length, result);
        continue;
      }

      const { valid, issues, ps } = await validatePlayer(pid, local);
      report.totalApiCalls++;

      const hasFailIssues = issues.some(i => !i.startsWith('TEAM_MISMATCH'));
      const status = hasFailIssues ? 'fail' : issues.length > 0 ? 'warn' : 'pass';
      const result = { slug, status, issues, resolvedVia, ps, apiCalls };
      report.players.details.push(result);

      if (status === 'pass') report.players.passed++;
      else if (status === 'warn') report.players.warnings++;
      else report.players.failed++;

      report.players.checked++;
      printPlayerResult(i + 1, playerSlugs.length, result);
    }
  }

  // ── Team Resolution Checks ──
  const teams = getUniqueTeams();
  // Check top teams (by player count, max 30 for daily, all for --all)
  const teamsToCheck = flagAll ? teams : teams.slice(0, 30);

  console.log(`\n\x1b[1m=== Team Resolution Check (${teamsToCheck.length} teams) ===\x1b[0m\n`);

  for (let i = 0; i < teamsToCheck.length; i++) {
    const t = teamsToCheck[i];
    const result = await resolveTeam(t);
    report.totalApiCalls += result.apiCalls;
    report.teams.details.push(result);
    report.teams.checked++;

    if (result.status === 'pass') report.teams.passed++;
    else if (result.status === 'warn') report.teams.warnings++;
    else report.teams.failed++;

    const status = result.status === 'pass' ? '\x1b[32mPASS\x1b[0m' :
                   result.status === 'warn' ? '\x1b[33mWARN\x1b[0m' :
                   '\x1b[31mFAIL\x1b[0m';
    const extra = result.issues.length > 0 ? ` ${result.issues.join(', ')}` : '';
    const resolved = result.resolvedName ? `-> "${result.resolvedName}" (${result.resolvedVia})` : '';
    console.log(`  [${rpad(i + 1, 2)}/${teamsToCheck.length}] ${pad(t.name, 22)} ${status} ${pad(resolved, 40)}${extra}`);
  }

  // ── Summary ──
  report.durationMs = Date.now() - startTime;

  console.log('\n\x1b[1m=== Summary ===\x1b[0m\n');

  if (!flagTeamsOnly) {
    const p = report.players;
    const pTotal = p.passed + p.warnings + p.failed;
    console.log(`  Players:  ${p.passed}/${pTotal} passed, ${p.warnings} warnings, ${p.failed} failed`);
  }

  const t = report.teams;
  const tTotal = t.passed + t.warnings + t.failed;
  console.log(`  Teams:    ${t.passed}/${tTotal} passed, ${t.warnings} warnings, ${t.failed} failed`);

  const apiOk = report.apis.filter(a => a.status === 'ok').length;
  const apiTotal = report.apis.filter(a => a.status !== 'skip').length;
  console.log(`  APIs:     ${apiOk}/${apiTotal} reachable`);
  console.log(`  API calls used: ${report.totalApiCalls}`);
  console.log(`  Duration: ${(report.durationMs / 1000).toFixed(1)}s`);

  // Print failures and warnings
  const playerFails = report.players.details.filter(d => d.status === 'fail');
  const playerWarns = report.players.details.filter(d => d.status === 'warn');
  const teamFails = report.teams.details.filter(d => d.status === 'fail');
  const teamWarns = report.teams.details.filter(d => d.status === 'warn');

  if (playerFails.length > 0) {
    console.log('\n  \x1b[31m--- Player Failures ---\x1b[0m');
    for (const f of playerFails) {
      console.log(`    ${f.slug}: ${f.issues.join(', ')}`);
    }
  }
  if (playerWarns.length > 0) {
    console.log('\n  \x1b[33m--- Player Warnings ---\x1b[0m');
    for (const w of playerWarns) {
      console.log(`    ${w.slug}: ${w.issues.join(', ')}`);
    }
  }
  if (teamFails.length > 0) {
    console.log('\n  \x1b[31m--- Team Failures ---\x1b[0m');
    for (const f of teamFails) {
      console.log(`    ${f.name}: ${f.issues.join(', ')}`);
    }
  }
  if (teamWarns.length > 0) {
    console.log('\n  \x1b[33m--- Team Warnings ---\x1b[0m');
    for (const w of teamWarns) {
      console.log(`    ${w.name}: ${w.issues.join(', ')}`);
    }
  }

  console.log('');
  saveReport(report);
}

function saveReport(report) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const latestPath = join(REPORTS_DIR, 'latest.json');
  const datedPath = join(REPORTS_DIR, `${dateStr}-${report.mode}.json`);

  writeFileSync(latestPath, JSON.stringify(report, null, 2));
  writeFileSync(datedPath, JSON.stringify(report, null, 2));
  console.log(`  Report saved: ${datedPath}`);
  console.log(`  Report saved: ${latestPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
