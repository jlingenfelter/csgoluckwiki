#!/usr/bin/env node
/**
 * Fetch CS2 pro player data from ProSettings.net
 *
 * Two-phase approach:
 *   1. Scrape /lists/cs2/ table for all player settings (single request)
 *   2. Scrape individual /players/[slug]/ pages for skins + crosshair codes
 *
 * Usage:
 *   node scripts/fetch-players.mjs              # Full fetch (settings + skins)
 *   node scripts/fetch-players.mjs --settings    # Settings only (fast, 1 request)
 *   node scripts/fetch-players.mjs --skins-only  # Only fetch skins for existing players
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PLAYERS_DIR = join(PROJECT_ROOT, 'src', 'data', 'players');
const SKINS_DATA_PATH = join(PROJECT_ROOT, 'src', 'lib', 'skins-data.json');

const PROSETTINGS_BASE = 'https://prosettings.net';
const LIST_URL = `${PROSETTINGS_BASE}/lists/cs2/`;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ── Rate limiting ────────────────────────────────────────────────────────────
const DELAY_MS = 1200; // 1.2s between individual page requests
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Country code to name + flag emoji ────────────────────────────────────────
const COUNTRIES = {
  af: ['Afghanistan', '🇦🇫'], al: ['Albania', '🇦🇱'], dz: ['Algeria', '🇩🇿'], ar: ['Argentina', '🇦🇷'],
  am: ['Armenia', '🇦🇲'], au: ['Australia', '🇦🇺'], at: ['Austria', '🇦🇹'], az: ['Azerbaijan', '🇦🇿'],
  ba: ['Bosnia and Herzegovina', '🇧🇦'], bd: ['Bangladesh', '🇧🇩'], be: ['Belgium', '🇧🇪'],
  bg: ['Bulgaria', '🇧🇬'], br: ['Brazil', '🇧🇷'], by: ['Belarus', '🇧🇾'], ca: ['Canada', '🇨🇦'],
  ch: ['Switzerland', '🇨🇭'], cl: ['Chile', '🇨🇱'], cn: ['China', '🇨🇳'], co: ['Colombia', '🇨🇴'],
  cr: ['Costa Rica', '🇨🇷'], cy: ['Cyprus', '🇨🇾'], cz: ['Czechia', '🇨🇿'], de: ['Germany', '🇩🇪'],
  dk: ['Denmark', '🇩🇰'], do: ['Dominican Republic', '🇩🇴'], ec: ['Ecuador', '🇪🇨'],
  ee: ['Estonia', '🇪🇪'], eg: ['Egypt', '🇪🇬'], es: ['Spain', '🇪🇸'], fi: ['Finland', '🇫🇮'],
  fr: ['France', '🇫🇷'], gb: ['United Kingdom', '🇬🇧'], ge: ['Georgia', '🇬🇪'], gr: ['Greece', '🇬🇷'],
  gt: ['Guatemala', '🇬🇹'], hk: ['Hong Kong', '🇭🇰'], hr: ['Croatia', '🇭🇷'], hu: ['Hungary', '🇭🇺'],
  id: ['Indonesia', '🇮🇩'], ie: ['Ireland', '🇮🇪'], il: ['Israel', '🇮🇱'], in: ['India', '🇮🇳'],
  iq: ['Iraq', '🇮🇶'], ir: ['Iran', '🇮🇷'], is: ['Iceland', '🇮🇸'], it: ['Italy', '🇮🇹'],
  jo: ['Jordan', '🇯🇴'], jp: ['Japan', '🇯🇵'], kz: ['Kazakhstan', '🇰🇿'], kg: ['Kyrgyzstan', '🇰🇬'],
  kr: ['South Korea', '🇰🇷'], kw: ['Kuwait', '🇰🇼'], lb: ['Lebanon', '🇱🇧'], lt: ['Lithuania', '🇱🇹'],
  lv: ['Latvia', '🇱🇻'], ly: ['Libya', '🇱🇾'], ma: ['Morocco', '🇲🇦'], md: ['Moldova', '🇲🇩'],
  me: ['Montenegro', '🇲🇪'], mk: ['North Macedonia', '🇲🇰'], mn: ['Mongolia', '🇲🇳'],
  mt: ['Malta', '🇲🇹'], mx: ['Mexico', '🇲🇽'], my: ['Malaysia', '🇲🇾'], ng: ['Nigeria', '🇳🇬'],
  nl: ['Netherlands', '🇳🇱'], no: ['Norway', '🇳🇴'], nz: ['New Zealand', '🇳🇿'],
  pa: ['Panama', '🇵🇦'], pe: ['Peru', '🇵🇪'], ph: ['Philippines', '🇵🇭'], pk: ['Pakistan', '🇵🇰'],
  pl: ['Poland', '🇵🇱'], pt: ['Portugal', '🇵🇹'], py: ['Paraguay', '🇵🇾'], qa: ['Qatar', '🇶🇦'],
  ro: ['Romania', '🇷🇴'], rs: ['Serbia', '🇷🇸'], ru: ['Russia', '🇷🇺'], sa: ['Saudi Arabia', '🇸🇦'],
  se: ['Sweden', '🇸🇪'], sg: ['Singapore', '🇸🇬'], si: ['Slovenia', '🇸🇮'], sk: ['Slovakia', '🇸🇰'],
  sy: ['Syria', '🇸🇾'], th: ['Thailand', '🇹🇭'], tj: ['Tajikistan', '🇹🇯'], tn: ['Tunisia', '🇹🇳'],
  tr: ['Turkey', '🇹🇷'], tw: ['Taiwan', '🇹🇼'], ua: ['Ukraine', '🇺🇦'], us: ['United States', '🇺🇸'],
  uy: ['Uruguay', '🇺🇾'], uz: ['Uzbekistan', '🇺🇿'], ve: ['Venezuela', '🇻🇪'], vn: ['Vietnam', '🇻🇳'],
  xk: ['Kosovo', '🇽🇰'], za: ['South Africa', '🇿🇦'],
};

// Reverse lookup: flag emoji → country code
const FLAG_TO_CC = {};
for (const [cc, [, flag]] of Object.entries(COUNTRIES)) {
  FLAG_TO_CC[flag] = cc;
}

// ── Role mapping ─────────────────────────────────────────────────────────────
function normalizeRole(role) {
  const r = (role || '').trim();
  const map = {
    'Sniper': 'AWPer', 'AWPer': 'AWPer', 'Awper': 'AWPer',
    'Rifler': 'Rifler',
    'Lurker': 'Lurker',
    'Entry Fragger': 'Entry Fragger', 'Entry': 'Entry Fragger',
    'IGL': 'IGL', 'In-Game Leader': 'IGL',
    'Support': 'Support',
    'Coach': 'Coach',
  };
  return map[r] || r || 'Rifler';
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function num(val, fallback = 0) {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── HTTP fetch with retry ────────────────────────────────────────────────────
async function fetchWithRetry(url, retries = 3, timeoutMs = 30000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return await res.text();
      if (res.status === 429) {
        const wait = Math.pow(2, i) * 3000;
        console.log(`   ⏳ Rate limited (429), waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      if (res.status === 403) {
        console.log(`   ⚠️ 403 Forbidden for ${url}`);
        return null;
      }
      console.log(`   ⚠️ HTTP ${res.status} for ${url} (attempt ${i + 1}/${retries})`);
    } catch (err) {
      console.log(`   ⚠️ Fetch error: ${err.message} (attempt ${i + 1}/${retries})`);
      if (i === retries - 1) return null;
      await sleep(2000);
    }
  }
  return null;
}

// ── Parse the listing table HTML ─────────────────────────────────────────────
function parseListingTable(html) {
  const players = [];

  // Extract table rows — each <tr> in <tbody>
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) {
    console.log('   ❌ No <tbody> found in listing page');
    return players;
  }

  const rows = tbodyMatch[1].split(/<tr[^>]*>/i).filter(r => r.includes('</td>'));

  for (const row of rows) {
    // Extract all <td> contents
    const cells = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m;
    while ((m = tdRegex.exec(row)) !== null) {
      cells.push(m[1]);
    }

    if (cells.length < 10) continue;

    // Cell order: [flag_img], Team, Player, Role, Mouse, HZ, DPI, Sens, eDPI, Zoom Sens, Monitor, GPU, Resolution, Aspect Ratio, Scaling Mode, Mousepad, Keyboard, Headset, Chair

    // Extract country from flag image (class contains country code)
    const flagMatch = cells[0]?.match(/class="[^"]*flag-icon-([a-z]{2})[^"]*"/i)
      || cells[0]?.match(/flag-icon-([a-z]{2})/i)
      || cells[0]?.match(/\/flags\/([a-z]{2})\./i);
    const cc = flagMatch ? flagMatch[1].toLowerCase() : '';

    // Extract player name and slug from link
    const playerLink = cells[2]?.match(/<a[^>]*href="[^"]*\/players\/([^"\/]+)\/?[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    if (!playerLink) continue;

    const slug = playerLink[1];
    const name = playerLink[2].replace(/<[^>]+>/g, '').trim();
    if (!name) continue;

    // Strip HTML tags from cell contents
    const strip = s => (s || '').replace(/<[^>]+>/g, '').trim();

    const team = strip(cells[1]);
    const role = strip(cells[3]);
    const mouse = strip(cells[4]);
    const hz = strip(cells[5]);
    const dpi = strip(cells[6]);
    const sens = strip(cells[7]);
    const edpi = strip(cells[8]);
    const zoomSens = strip(cells[9]);
    const monitor = strip(cells[10]);
    const gpu = strip(cells[11]);
    const res = strip(cells[12]);
    const aspect = strip(cells[13]);
    const scaling = strip(cells[14]);
    const mousepad = strip(cells[15]);
    const keyboard = strip(cells[16]);
    const headset = strip(cells[17]);

    const [countryName, flagEmoji] = COUNTRIES[cc] || [cc.toUpperCase() || 'Unknown', '🏳️'];

    players.push({
      name, slug, team, role: normalizeRole(role),
      country: countryName, flag: flagEmoji, cc,
      mouse, dpi: num(dpi, 400), sens: num(sens, 2), edpi: num(edpi, 800),
      zoomSens: num(zoomSens, 1), pollingRate: num(hz, 1000),
      monitor, gpu: gpu || '', res: res || '1920x1080',
      aspect: aspect || '16:9', stretch: scaling || 'Native',
      mousepad, keyboard, headset,
    });
  }

  return players;
}

// ── Extract all data-field values from HTML ───────────────────────────────────
function extractDataFields(html) {
  const fields = {};
  const regex = /<tr[^>]*data-field="([^"]+)"[^>]*>[\s\S]*?<td>([\s\S]*?)<\/td>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const key = m[1].trim();
    const val = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').replace(/&#039;/g, "'").trim();
    if (val && val !== 'Unknown') fields[key] = val;
  }
  return fields;
}

// ── Parse individual player page — comprehensive extraction ──────────────────
function parsePlayerPage(html) {
  const result = { crosshairCode: '', skins: [] };

  // ── Extract all data-field values at once ──
  const fields = extractDataFields(html);

  // ── Crosshair code ──
  const xhairMatch = html.match(/CSGO-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+/);
  if (xhairMatch) {
    result.crosshairCode = xhairMatch[0];
  }

  // ── Real name + birthday from bio section ──
  const nameMatch = html.match(/<tr[^>]*field-name[^>]*>[\s\S]*?<td>([\s\S]*?)<\/td>/i);
  if (nameMatch) result.realName = nameMatch[1].replace(/<[^>]+>/g, '').trim();

  const birthdayMatch = html.match(/<tr[^>]*field-birthday[^>]*>[\s\S]*?<td>([\s\S]*?)<\/td>/i);
  if (birthdayMatch) result.birthday = birthdayMatch[1].replace(/<[^>]+>/g, '').trim();

  // ── Launch options ──
  const launchMatch = html.match(/section--launch_options[\s\S]*?<pre>([\s\S]*?)<\/pre>/i);
  if (launchMatch) result.launchOptions = launchMatch[1].trim();

  // ── Crosshair details ──
  result.crosshairSettings = {};
  const xMap = {
    'cl_crosshair_recoil': 'followRecoil',
    'cl_crosshair_outlinethickness': 'outlineThickness',
    'cl_crosshaircolor_r': 'red',
    'cl_crosshaircolor_g': 'green',
    'cl_crosshaircolor_b': 'blue',
    'cl_crosshairusealpha': 'useAlpha',
    'cl_crosshairalpha': 'alphaValue',
    'cl_crosshair_t': 'tStyle',
    'cl_crosshairgap_useweaponvalue': 'deployedWeaponGap',
    'cl_crosshair_dynamic_splitdist': 'splitDistance',
    'cl_fixedcrosshairgap': 'fixedGap',
    'cl_crosshair_dynamic_splitalpha_innermod': 'innerSplitAlpha',
    'cl_crosshair_dynamic_splitalpha_outermod': 'outerSplitAlpha',
    'cl_crosshair_dynamic_maxdist_splitratio': 'splitSizeRatio',
    'cl_crosshair_sniper_width': 'sniperWidth',
    'cl_crosshairstyle': 'style',
    'cl_crosshairsize': 'size',
    'cl_crosshairthickness': 'thickness',
    'cl_crosshairgap': 'gap',
    'cl_crosshairdot': 'dot',
    'cl_crosshair_drawoutline': 'outline',
    'cl_crosshaircolor': 'color',
  };
  for (const [fieldKey, propKey] of Object.entries(xMap)) {
    if (fields[fieldKey] !== undefined) result.crosshairSettings[propKey] = fields[fieldKey];
  }

  // ── Bob settings ──
  result.bobSettings = {};
  if (fields['cl_bob_lower_amt']) result.bobSettings.lowerAmt = fields['cl_bob_lower_amt'];
  if (fields['cl_bobamt_lat']) result.bobSettings.amtLat = fields['cl_bobamt_lat'];
  if (fields['cl_bobamt_vert']) result.bobSettings.amtVert = fields['cl_bobamt_vert'];
  if (fields['cl_bobcycle']) result.bobSettings.cycle = fields['cl_bobcycle'];

  // ── Video settings ──
  result.videoSettings = {};
  const vMap = {
    'brightness': 'brightness',
    'display_mode': 'displayMode',
    'boost_player_contrast': 'boostPlayerContrast',
    'wait_for_vertical_sync': 'vsync',
    'nvidia_reflex_low_latency': 'nvidiaReflex',
    'nvidia_g-sync': 'nvidiaGSync',
    'max_fps': 'maxFPS',
    'multisampling_anti-aliasing_mode': 'msaa',
    'global_shadow_quality': 'globalShadowQuality',
    'dynamic_shadows': 'dynamicShadows',
    'model_texture_detail': 'modelTextureDetail',
    'texture_filtering_mode': 'textureFilteringMode',
    'shader_detail': 'shaderDetail',
    'particle_detail': 'particleDetail',
    'ambient_occlusion': 'ambientOcclusion',
    'high_dynamic_range': 'hdr',
    'fidelityfx_super_resolution': 'fidelityFX',
  };
  for (const [fieldKey, propKey] of Object.entries(vMap)) {
    if (fields[fieldKey] !== undefined) result.videoSettings[propKey] = fields[fieldKey];
  }

  // ── Radar settings ──
  result.radarSettings = {};
  if (fields['cl_radar_always_centered']) result.radarSettings.centersPlayer = fields['cl_radar_always_centered'];
  if (fields['cl_radar_rotate']) result.radarSettings.rotating = fields['cl_radar_rotate'];
  if (fields['cl_radar_square_with_scoreboard']) result.radarSettings.toggleShape = fields['cl_radar_square_with_scoreboard'];
  if (fields['cl_radar_hud_scale']) result.radarSettings.hudSize = fields['cl_radar_hud_scale'];
  if (fields['cl_radar_scale']) result.radarSettings.mapZoom = fields['cl_radar_scale'];

  // ── HUD settings ──
  result.hudSettings = {};
  if (fields['hud_scaling']) result.hudSettings.scale = fields['hud_scaling'];
  if (fields['cl_hud_color']) result.hudSettings.color = fields['cl_hud_color'];

  // ── Monitor settings (DyAc, color, etc.) ──
  result.monitorSettings = {};
  const mMap = {
    'dyac': 'dyac',
    'black_equalizer': 'blackEqualizer',
    'color_vibrance': 'colorVibrance',
    'low_blue_light': 'lowBlueLight',
    'picture_mode': 'pictureMode',
    'brightness': 'monitorBrightness',  // Note: also used in video settings
    'contrast': 'contrast',
    'sharpness': 'sharpness',
    'gamma': 'gamma',
    'color_temperature': 'colorTemperature',
    'ama': 'ama',
  };
  for (const [fieldKey, propKey] of Object.entries(mMap)) {
    if (fields[fieldKey] !== undefined && fieldKey !== 'brightness') {
      result.monitorSettings[propKey] = fields[fieldKey];
    }
  }
  // brightness is shared between video and monitor sections - handle specially
  // The video section brightness is usually a percentage, monitor brightness is 0-100

  // ── Viewmodel (update existing fields from detail page) ──
  if (fields['viewmodel_fov']) result.vmFov = num(fields['viewmodel_fov'], 0);
  if (fields['viewmodel_offset_x']) result.vmX = num(fields['viewmodel_offset_x'], 0);
  if (fields['viewmodel_offset_y']) result.vmY = num(fields['viewmodel_offset_y'], 0);
  if (fields['viewmodel_offset_z']) result.vmZ = num(fields['viewmodel_offset_z'], 0);
  if (fields['viewmodel_presetpos']) result.vmPresetpos = num(fields['viewmodel_presetpos'], 0);

  // ── Mouse (update existing from detail page for accuracy) ──
  if (fields['windows_sensitivity']) result.windowsSens = fields['windows_sensitivity'];

  // ── Refresh rate from detail page ──
  if (fields['hz']) result.refreshRate = num(fields['hz'], 0);

  // ── Skins ──
  const skinRegex = /<h4[^>]*>[\s\S]*?(?:<a[^>]*>)?\s*((?:★\s+)?(?:StatTrak™\s+)?[^<]+\|[^<]+)\s*(?:<\/a>)?[\s\S]*?<\/h4>/gi;
  let sm;
  while ((sm = skinRegex.exec(html)) !== null) {
    const fullName = sm[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').trim();
    if (fullName.includes('700,000')) continue;
    result.skins.push(fullName);
  }

  // Clean up empty nested objects
  if (Object.keys(result.crosshairSettings).length === 0) delete result.crosshairSettings;
  if (Object.keys(result.bobSettings).length === 0) delete result.bobSettings;
  if (Object.keys(result.videoSettings).length === 0) delete result.videoSettings;
  if (Object.keys(result.radarSettings).length === 0) delete result.radarSettings;
  if (Object.keys(result.hudSettings).length === 0) delete result.hudSettings;
  if (Object.keys(result.monitorSettings).length === 0) delete result.monitorSettings;

  return result;
}

// ── Match skin names to our skins-data.json slugs ────────────────────────────
function buildSkinMatcher() {
  if (!existsSync(SKINS_DATA_PATH)) {
    console.log('   ⚠️ skins-data.json not found, skin matching disabled');
    return () => null;
  }

  const data = JSON.parse(readFileSync(SKINS_DATA_PATH, 'utf-8'));
  const skins = data.skins || [];

  // Build lookup: "weapon|skinname" → slug (lowercase, no wear/stattrak)
  const lookup = new Map();
  for (const skin of skins) {
    const key = `${skin.weapon.toLowerCase()}|${skin.name.toLowerCase()}`.replace(/['']/g, "'");
    lookup.set(key, skin.slug);
    // For phase variants like "Doppler - Ruby", also add "doppler ruby" (no dash)
    // so ProSettings "Doppler Ruby" matches directly
    if (skin.name.includes(' - ')) {
      const altKey = `${skin.weapon.toLowerCase()}|${skin.name.toLowerCase().replace(' - ', ' ')}`.replace(/['']/g, "'");
      if (!lookup.has(altKey)) lookup.set(altKey, skin.slug);
    }
  }

  // Doppler phases, Marble Fade patterns, etc. — strip these to match base skin
  const PHASE_SUFFIXES = [
    'ruby', 'sapphire', 'black pearl', 'emerald',
    'phase 1', 'phase 2', 'phase 3', 'phase 4',
    'fire & ice', 'fire and ice', 'blue gem',
  ];

  return function matchSkin(fullName) {
    // Parse "★ Butterfly Knife | Doppler Ruby (Factory New)" → weapon + skin name
    // Strip StatTrak™ BEFORE ★ (since format is "StatTrak™ ★ Weapon | Skin")
    let cleaned = fullName
      .replace(/^StatTrak™\s*/i, '')
      .replace(/^★\s*/, '')
      .replace(/\s*\([^)]+\)\s*$/, '') // Remove wear condition
      .replace(/[\u2018\u2019\u0060\u00B4]/g, "'") // Normalize curly apostrophes
      .trim();

    const parts = cleaned.split('|').map(s => s.trim());
    if (parts.length !== 2) return null;

    const weapon = parts[0].toLowerCase();
    const skinName = parts[1].toLowerCase();
    const key = `${weapon}|${skinName}`;

    // Try exact match first
    const exact = lookup.get(key);
    if (exact) return exact;

    // Strip phase suffix and retry (e.g. "Doppler Ruby" → "Doppler")
    for (const phase of PHASE_SUFFIXES) {
      if (skinName.endsWith(' ' + phase)) {
        const baseName = skinName.slice(0, -(phase.length + 1)).trim();
        const baseKey = `${weapon}|${baseName}`;
        const match = lookup.get(baseKey);
        if (match) return match;
      }
    }

    return null;
  };
}

// ── Categorize skins into loadout slots ──────────────────────────────────────
const KNIFE_PREFIXES = [
  'bayonet', 'karambit', 'butterfly knife', 'm9 bayonet', 'flip knife',
  'gut knife', 'falchion knife', 'shadow daggers', 'bowie knife',
  'huntsman knife', 'navaja knife', 'stiletto knife', 'talon knife',
  'ursus knife', 'classic knife', 'nomad knife', 'skeleton knife',
  'survival knife', 'paracord knife', 'kukri knife',
];
const GLOVE_PREFIXES = [
  'sport gloves', 'specialist gloves', 'driver gloves', 'hand wraps',
  'moto gloves', 'hydra gloves', 'broken fang gloves',
];
const AWP_NAMES = ['awp'];
const PISTOL_NAMES = [
  'desert eagle', 'usp-s', 'glock-18', 'p250', 'five-seven', 'tec-9',
  'cz75-auto', 'dual berettas', 'r8 revolver', 'p2000',
];

function categoriseSkin(fullName) {
  const lower = fullName.toLowerCase().replace(/^stattrak™\s*/i, '').replace(/^★\s*/, '');
  const weapon = lower.split('|')[0].trim();

  if (KNIFE_PREFIXES.some(k => weapon === k || weapon.startsWith(k + ' '))) return 'knife';
  if (GLOVE_PREFIXES.some(g => weapon === g || weapon.startsWith(g + ' '))) return 'gloves';
  if (AWP_NAMES.includes(weapon)) return 'awp';
  if (PISTOL_NAMES.includes(weapon)) return 'pistol';
  return 'rifle'; // AK-47, M4A4, M4A1-S, etc.
}

// ── Merge into existing player JSON ──────────────────────────────────────────
function mergePlayer(existing, newData) {
  const merged = { ...existing };

  // Always update settings from the listing table
  if (newData.team) merged.team = newData.team;
  if (newData.role) merged.role = newData.role;
  if (newData.mouse) merged.mouse = newData.mouse;
  if (newData.dpi) merged.dpi = newData.dpi;
  if (newData.sens) merged.sens = newData.sens;
  if (newData.edpi) merged.edpi = newData.edpi;
  if (newData.zoomSens) merged.zoomSens = newData.zoomSens;
  if (newData.pollingRate) merged.pollingRate = newData.pollingRate;
  if (newData.res) merged.res = newData.res;
  if (newData.aspect) merged.aspect = newData.aspect;
  if (newData.stretch) merged.stretch = newData.stretch;
  if (newData.monitor) merged.monitor = newData.monitor;
  if (newData.keyboard) merged.keyboard = newData.keyboard;
  if (newData.headset) merged.headset = newData.headset;
  if (newData.mousepad) merged.mousepad = newData.mousepad;
  if (newData.gpu) merged.gpu = newData.gpu;
  if (newData.country) merged.country = newData.country;
  if (newData.flag) merged.flag = newData.flag;

  // Update crosshair code if found
  if (newData.crosshairCode) merged.crosshairCode = newData.crosshairCode;

  // Update loadout if skins were found
  if (newData.loadout && Object.values(newData.loadout).some(v => v)) {
    merged.loadout = newData.loadout;
  }

  // Update real name and birthday if found (don't overwrite curated values)
  if (newData.realName && !merged.realName) merged.realName = newData.realName;
  if (newData.birthday) merged.birthday = newData.birthday;

  // Update launch options if found
  if (newData.launchOptions) merged.launchOptions = newData.launchOptions;

  // Update viewmodel from detail page (more accurate than listing)
  if (newData.vmFov) merged.vmFov = newData.vmFov;
  if (newData.vmX !== undefined) merged.vmX = newData.vmX;
  if (newData.vmY !== undefined) merged.vmY = newData.vmY;
  if (newData.vmZ !== undefined) merged.vmZ = newData.vmZ;
  if (newData.vmPresetpos) merged.vmPresetpos = newData.vmPresetpos;
  if (newData.windowsSens) merged.windowsSens = newData.windowsSens;
  if (newData.refreshRate) merged.refreshRate = newData.refreshRate;

  // Update nested settings objects (replace entirely if found)
  if (newData.crosshairSettings) merged.crosshairSettings = newData.crosshairSettings;
  if (newData.bobSettings) merged.bobSettings = newData.bobSettings;
  if (newData.videoSettings) merged.videoSettings = newData.videoSettings;
  if (newData.radarSettings) merged.radarSettings = newData.radarSettings;
  if (newData.hudSettings) merged.hudSettings = newData.hudSettings;
  if (newData.monitorSettings) merged.monitorSettings = newData.monitorSettings;

  return merged;
}

function createNewPlayer(data) {
  return {
    name: data.name,
    slug: data.slug,
    realName: '',
    team: data.team || '',
    country: data.country || 'Unknown',
    flag: data.flag || '🏳️',
    role: data.role || 'Rifler',
    image: `https://prosettings.net/wp-content/uploads/${data.slug}-200x200-2x-fitcontain-q99-gb283-s1.png`,
    style: data.role || 'Rifler',
    mouse: data.mouse || '',
    dpi: data.dpi || 400,
    sens: data.sens || 2,
    edpi: data.edpi || 800,
    zoomSens: data.zoomSens || 1,
    pollingRate: data.pollingRate || 1000,
    crosshairCode: data.crosshairCode || '',
    crosshairColor: '',
    crosshairStyle: 'Classic Static',
    crosshairSize: 2,
    crosshairThickness: 1,
    crosshairGap: -1,
    crosshairDot: false,
    crosshairOutline: false,
    res: data.res || '1920x1080',
    aspect: data.aspect || '16:9',
    stretch: data.stretch || 'Native',
    refreshRate: 360,
    vmFov: 68,
    vmX: 2.5,
    vmY: 0,
    vmZ: -1.5,
    monitor: data.monitor || '',
    keyboard: data.keyboard || '',
    headset: data.headset || '',
    mousepad: data.mousepad || '',
    gpu: data.gpu || '',
    launchOptions: '',
    bio: '',
    ...(data.loadout ? { loadout: data.loadout } : {}),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const settingsOnly = args.includes('--settings');
  const skinsOnly = args.includes('--skins-only');

  if (!existsSync(PLAYERS_DIR)) {
    mkdirSync(PLAYERS_DIR, { recursive: true });
  }

  const matchSkin = buildSkinMatcher();

  // ── Phase 1: Fetch listing table ───────────────────────────────────────────
  let listingPlayers = [];

  if (!skinsOnly) {
    console.log('📋 Phase 1: Fetching player listing table...');
    const html = await fetchWithRetry(LIST_URL);
    if (!html) {
      console.log('   ❌ Failed to fetch listing page');
      if (!skinsOnly) {
        console.log('   Falling back to existing player files only');
      }
    } else {
      listingPlayers = parseListingTable(html);
      console.log(`   ✅ Parsed ${listingPlayers.length} players from listing`);
    }

    // Write/merge player settings
    let created = 0, updated = 0;
    const slugsSeen = new Set();

    for (const p of listingPlayers) {
      let slug = p.slug;
      if (slugsSeen.has(slug)) {
        const suffix = (p.team || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
        slug = `${slug}-${suffix}`;
      }
      slugsSeen.add(slug);

      const filePath = join(PLAYERS_DIR, `${slug}.json`);

      if (existsSync(filePath)) {
        const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
        const merged = mergePlayer(existing, p);
        writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
        updated++;
      } else {
        const newPlayer = createNewPlayer({ ...p, slug });
        writeFileSync(filePath, JSON.stringify(newPlayer, null, 2) + '\n');
        created++;
      }
    }

    console.log(`   📊 Created: ${created}, Updated: ${updated}`);
  }

  if (settingsOnly) {
    console.log('\n✅ Done (settings only mode)');
    return;
  }

  // ── Phase 2: Fetch individual pages for skins + crosshair ──────────────────
  console.log('\n🎨 Phase 2: Fetching skins & crosshair codes from player pages...');

  // Get list of player slugs to process
  let slugsToFetch = [];
  if (skinsOnly) {
    // Use existing player files
    slugsToFetch = readdirSync(PLAYERS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } else {
    slugsToFetch = listingPlayers.map(p => p.slug);
  }

  console.log(`   Processing ${slugsToFetch.length} players...`);

  let skinsFetched = 0, skinsFound = 0, crosshairsFound = 0, errors = 0;

  for (let i = 0; i < slugsToFetch.length; i++) {
    const slug = slugsToFetch[i];
    const url = `${PROSETTINGS_BASE}/players/${slug}/`;

    if (i > 0 && i % 50 === 0) {
      console.log(`   ... ${i}/${slugsToFetch.length} (${skinsFound} skins, ${crosshairsFound} crosshairs)`);
    }

    const html = await fetchWithRetry(url, 2, 15000);
    skinsFetched++;

    if (!html) {
      errors++;
      await sleep(DELAY_MS);
      continue;
    }

    const pageData = parsePlayerPage(html);

    // Build loadout from skins
    const loadout = {};
    for (const skinName of pageData.skins) {
      const slot = categoriseSkin(skinName);
      const skinSlug = matchSkin(skinName);
      if (!loadout[slot]) {
        loadout[slot] = skinSlug || skinName; // Prefer slug, fall back to full name
      }
    }

    if (pageData.skins.length > 0) skinsFound++;
    if (pageData.crosshairCode) crosshairsFound++;

    // Merge all parsed data (settings, crosshair, video, bob, radar, etc.) into player file
    const filePath = join(PLAYERS_DIR, `${slug}.json`);
    if (existsSync(filePath)) {
      const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
      const merged = mergePlayer(existing, { ...pageData, loadout });
      writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n✅ Done!`);
  console.log(`   📊 Fetched: ${skinsFetched} player pages`);
  console.log(`   🎨 Skins found: ${skinsFound} players have skin data`);
  console.log(`   🎯 Crosshairs found: ${crosshairsFound} players have crosshair codes`);
  if (errors > 0) console.log(`   ⚠️  Errors: ${errors} pages failed`);
}

main().catch(console.error);
