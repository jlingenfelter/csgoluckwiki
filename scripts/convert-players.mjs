#!/usr/bin/env node
/**
 * Convert prosettings.net player data to CSDB player JSON format.
 * Reads from ~/Downloads/prosettings-players.json
 * Writes to src/data/players/*.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const PLAYERS_DIR = join(PROJECT_ROOT, 'src', 'data', 'players');
const INPUT_FILE = join(process.env.HOME, 'Downloads', 'prosettings-players.json');

// Country code to name + flag emoji mapping
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

// Map prosettings role to style description
function roleToStyle(role) {
  const styles = {
    'Sniper': 'AWPer',
    'Rifler': 'Rifler',
    'Lurker': 'Lurker',
    'Entry Fragger': 'Entry Fragger',
    'IGL': 'In-Game Leader',
    'Support': 'Support',
    'Coach': 'Coach',
  };
  return styles[role] || role || 'Rifler';
}

// Parse numeric with fallback
function num(val, fallback = 0) {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

// Generate slug from player name or URL
function makeSlug(raw) {
  let slug = (raw.u || '').replace(/.*\/players\//, '').replace(/\/#?$/, '');
  if (!slug) {
    slug = raw.n.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  return slug;
}

// Determine refresh rate from Hz field
function parseHz(hz) {
  const n = parseInt(hz);
  return isNaN(n) ? 144 : n;
}

function main() {
  if (!existsSync(INPUT_FILE)) {
    console.error('Input file not found:', INPUT_FILE);
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${raw.length} players from prosettings data`);

  if (!existsSync(PLAYERS_DIR)) {
    mkdirSync(PLAYERS_DIR, { recursive: true });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const slugsSeen = new Set();

  for (const p of raw) {
    let slug = makeSlug(p);

    // Handle duplicate slugs
    if (slugsSeen.has(slug)) {
      // Append team abbreviation
      const teamSuffix = (p.t || '').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5);
      slug = `${slug}-${teamSuffix}`;
      if (slugsSeen.has(slug)) {
        slug = `${slug}-2`;
      }
    }
    slugsSeen.add(slug);

    const cc = (p.c || '').toLowerCase();
    const [countryName, flagEmoji] = COUNTRIES[cc] || [cc.toUpperCase() || 'Unknown', '🏳️'];

    const playerData = {
      name: p.n,
      slug: slug,
      realName: '',
      team: p.t || '',
      country: countryName,
      flag: flagEmoji,
      role: roleToStyle(p.r),
      image: `https://prosettings.net/wp-content/uploads/${slug}-200x200-fitcontain-q99-gb283-s1.webp`,
      style: p.r || 'Rifler',
      mouse: p.m || '',
      dpi: num(p.d, 400),
      sens: num(p.s, 2),
      edpi: num(p.e, 800),
      zoomSens: num(p.z, 1),
      pollingRate: parseHz(p.h),
      crosshairCode: '',
      crosshairColor: '',
      crosshairStyle: 'Classic Static',
      crosshairSize: 2,
      crosshairThickness: 1,
      crosshairGap: -1,
      crosshairDot: false,
      crosshairOutline: false,
      res: p.rs || '1920x1080',
      aspect: p.a || '16:9',
      stretch: p.sc || 'Native',
      refreshRate: 360,
      vmFov: 68,
      vmX: 2.5,
      vmY: 0,
      vmZ: -1.5,
      monitor: p.mo || '',
      keyboard: p.k || '',
      headset: p.hs || '',
      mousepad: p.mp || '',
      launchOptions: '',
      bio: ''
    };

    const filePath = join(PLAYERS_DIR, `${slug}.json`);

    if (existsSync(filePath)) {
      // Merge: keep existing data, update settings from prosettings
      const existing = JSON.parse(readFileSync(filePath, 'utf-8'));

      // Only update fields from prosettings that are better/newer
      // Keep existing bio, realName, crosshair settings, etc.
      const merged = { ...existing };

      // Always update these from prosettings (more current)
      if (p.t) merged.team = p.t;
      if (p.m) merged.mouse = p.m;
      if (num(p.d)) merged.dpi = num(p.d);
      if (num(p.s)) merged.sens = num(p.s);
      if (num(p.e)) merged.edpi = num(p.e);
      if (num(p.z)) merged.zoomSens = num(p.z);
      if (p.h) merged.pollingRate = parseHz(p.h);
      if (p.rs) merged.res = p.rs;
      if (p.a) merged.aspect = p.a;
      if (p.sc) merged.stretch = p.sc;
      if (p.mo) merged.monitor = p.mo;
      if (p.k) merged.keyboard = p.k;
      if (p.hs) merged.headset = p.hs;
      if (p.mp) merged.mousepad = p.mp;
      if (p.r) {
        merged.role = roleToStyle(p.r);
        merged.style = p.r;
      }
      // Add image if not present
      if (!merged.image) {
        merged.image = playerData.image;
      }

      writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
      updated++;
    } else {
      writeFileSync(filePath, JSON.stringify(playerData, null, 2) + '\n');
      created++;
    }
  }

  console.log(`Done! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  console.log(`Total player files: ${created + updated}`);
}

main();
