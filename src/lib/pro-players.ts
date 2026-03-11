export interface ProPlayer {
  name: string;
  slug: string;
  realName: string;
  team: string;
  country: string;
  flag: string;
  role: string;
  age?: number;
  birthday?: string;
  style: string;
  image?: string;
  // Mouse & Sensitivity
  mouse: string;
  dpi: number;
  sens: number;
  edpi: number;
  zoomSens: number;
  pollingRate: number;
  windowsSens?: string;
  // Crosshair (basic)
  crosshairCode: string;
  crosshairColor: string;
  crosshairStyle: string;
  crosshairSize: number;
  crosshairThickness: number;
  crosshairGap: number;
  crosshairDot: boolean;
  crosshairOutline: boolean;
  // Crosshair (detailed — from individual page scrape)
  crosshairSettings?: {
    style?: string;
    size?: string;
    thickness?: string;
    gap?: string;
    dot?: string;
    outline?: string;
    color?: string;
    followRecoil?: string;
    outlineThickness?: string;
    red?: string;
    green?: string;
    blue?: string;
    useAlpha?: string;
    alphaValue?: string;
    tStyle?: string;
    deployedWeaponGap?: string;
    splitDistance?: string;
    fixedGap?: string;
    innerSplitAlpha?: string;
    outerSplitAlpha?: string;
    splitSizeRatio?: string;
    sniperWidth?: string;
  };
  // Video
  res: string;
  aspect: string;
  stretch: string;
  refreshRate: number;
  // Video (detailed — from individual page scrape)
  videoSettings?: {
    brightness?: string;
    displayMode?: string;
    boostPlayerContrast?: string;
    vsync?: string;
    nvidiaReflex?: string;
    nvidiaGSync?: string;
    maxFPS?: string;
    msaa?: string;
    globalShadowQuality?: string;
    dynamicShadows?: string;
    modelTextureDetail?: string;
    textureFilteringMode?: string;
    shaderDetail?: string;
    particleDetail?: string;
    ambientOcclusion?: string;
    hdr?: string;
    fidelityFX?: string;
  };
  // Viewmodel
  vmFov: number;
  vmX: number;
  vmY: number;
  vmZ: number;
  vmPresetpos?: number;
  // Bob settings
  bobSettings?: {
    lowerAmt?: string;
    amtLat?: string;
    amtVert?: string;
    cycle?: string;
  };
  // Radar settings
  radarSettings?: {
    centersPlayer?: string;
    rotating?: string;
    toggleShape?: string;
    hudSize?: string;
    mapZoom?: string;
  };
  // HUD settings
  hudSettings?: {
    scale?: string;
    color?: string;
  };
  // Monitor settings (ZOWIE-specific DyAc, eQualizer, etc.)
  monitorSettings?: {
    dyac?: string;
    blackEqualizer?: string;
    colorVibrance?: string;
    lowBlueLight?: string;
    pictureMode?: string;
    monitorBrightness?: string;
    contrast?: string;
    sharpness?: string;
    gamma?: string;
    colorTemperature?: string;
    ama?: string;
  };
  // Gear
  monitor: string;
  keyboard: string;
  headset: string;
  mousepad: string;
  // PC Specs
  gpu?: string;
  // Launch options
  launchOptions: string;
  // Bio snippet
  bio: string;
  // Social links
  socials?: {
    twitter?: string;
    twitch?: string;
    instagram?: string;
    hltv?: string;
  };
  // Player loadout (skin slugs)
  loadout?: {
    knife?: string;
    gloves?: string;
    rifle?: string;
    pistol?: string;
    awp?: string;
  };
}

// ── Load all player JSON files from src/data/players/ ─────────────────────
// Astro's import.meta.glob loads all matching files at build time
const playerModules = import.meta.glob<ProPlayer>('../data/players/*.json', { eager: true });

// Curated top players by popularity/fame — shown first on listing pages
const TOP_PLAYERS = [
  'donk', 's1mple', 'zywoo', 'niko', 'm0nesy', 'ropz', 'device', 'electronic',
  'bit', 'ax1le', 'twistzz', 'rain', 'frozen', 'broky', 'hunter-', 'jl',
  'w0nderful', 'im', 'brollan', 'xantares', 'jks', 'magisk', 'gla1ve',
  'karrigan', 'aleksib', 'cadiaN', 'tabsen', 'blameF', 'spinx', 'mezii',
  'degster', 'hooxi', 'nexa', 'syrson', 'flamez', 'stavn', 'jabbi',
  'torzsi', 'siuhy', 'isak', 'keoz', 'kennys', 'olofmeister', 'coldzera',
  'fallen', 'stewie2k', 'autimatic', 'nawwk', 'hallzerk',
];

export const PRO_PLAYERS: ProPlayer[] = Object.values(playerModules)
  .map((mod: any) => mod.default || mod)
  .sort((a, b) => {
    const aIdx = TOP_PLAYERS.indexOf(a.slug);
    const bIdx = TOP_PLAYERS.indexOf(b.slug);
    // Both in top list: sort by ranking
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    // One in top list: that one first
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    // Both have bios: sort alphabetically
    if (a.bio && b.bio) return a.name.localeCompare(b.name);
    // One has bio: that one first
    if (a.bio) return -1;
    if (b.bio) return 1;
    // Neither: alphabetical
    return a.name.localeCompare(b.name);
  });

// ── Computed stats ──────────────────────────────────────────────────────────
export function getAverageEdpi(): number {
  if (PRO_PLAYERS.length === 0) return 0;
  return Math.round(PRO_PLAYERS.reduce((s, p) => s + p.edpi, 0) / PRO_PLAYERS.length);
}

/** Get eDPI distribution data for histogram visualization */
export function getEdpiDistribution(): { buckets: { min: number; max: number; count: number; pct: number }[]; total: number; median: number } {
  if (PRO_PLAYERS.length === 0) return { buckets: [], total: 0, median: 0 };
  const sorted = PRO_PLAYERS.map(p => p.edpi).sort((a, b) => a - b);
  const total = sorted.length;
  const median = sorted[Math.floor(total / 2)];
  // Use 200-width buckets from 0-2000+ for a compact histogram
  const ranges = [
    [0, 399], [400, 599], [600, 799], [800, 999], [1000, 1199], [1200, 1599], [1600, 2000]
  ] as const;
  const buckets = ranges.map(([min, max]) => {
    const count = sorted.filter(e => e >= min && e <= max).length;
    return { min, max, count, pct: Math.round((count / total) * 100) };
  });
  return { buckets, total, median };
}

/** Get the percentile ranking of a given eDPI value (0-100, lower eDPI = lower percentile) */
export function getEdpiPercentile(edpi: number): number {
  if (PRO_PLAYERS.length === 0) return 50;
  const below = PRO_PLAYERS.filter(p => p.edpi < edpi).length;
  return Math.round((below / PRO_PLAYERS.length) * 100);
}
export function getMostCommonRes(): string {
  if (PRO_PLAYERS.length === 0) return 'N/A';
  const c: Record<string, number> = {};
  PRO_PLAYERS.forEach(p => c[p.res] = (c[p.res] || 0) + 1);
  const entries = Object.entries(c).sort((a, b) => b[1] - a[1]);
  return entries.length > 0 ? entries[0][0] : 'N/A';
}
export function getMostCommonDpi(): number {
  if (PRO_PLAYERS.length === 0) return 0;
  const c: Record<number, number> = {};
  PRO_PLAYERS.forEach(p => c[p.dpi] = (c[p.dpi] || 0) + 1);
  const entries = Object.entries(c).sort((a, b) => b[1] - a[1]);
  return entries.length > 0 ? Number(entries[0][0]) : 0;
}
export function getMouseBrandBreakdown(): { name: string; pct: number }[] {
  if (PRO_PLAYERS.length === 0) return [];
  const b: Record<string, number> = {};
  PRO_PLAYERS.forEach(p => { b[p.mouse.split(' ')[0]] = (b[p.mouse.split(' ')[0]] || 0) + 1; });
  return Object.entries(b).map(([n, c]) => ({ name: n, pct: Math.round((c / PRO_PLAYERS.length) * 100) })).sort((a, b) => b.pct - a.pct);
}
export function getStretchedBreakdown(): { stretched: number; bars: number; native: number } {
  let s = 0, b = 0, n = 0;
  PRO_PLAYERS.forEach(p => { if (p.stretch === 'Stretched') s++; else if (p.stretch === 'Black Bars') b++; else n++; });
  return { stretched: s, bars: b, native: n };
}
export function getRoleBreakdown(): { role: string; count: number }[] {
  const c: Record<string, number> = {};
  PRO_PLAYERS.forEach(p => c[p.role] = (c[p.role] || 0) + 1);
  return Object.entries(c).map(([r, n]) => ({ role: r, count: n })).sort((a, b) => b.count - a.count);
}
export function getPlayerBySlug(s: string): ProPlayer | undefined {
  return PRO_PLAYERS.find(p => p.slug === s);
}

// ── Team helpers ────────────────────────────────────────────────────────────
const NON_TEAMS = ['free agent', 'retired', 'inactive', 'no team', 'none', 'benched', 'n/a', '', 'content creator'];

export interface TeamInfo {
  name: string;
  slug: string;
  players: ProPlayer[];
}

export function getTeams(): TeamInfo[] {
  const map: Record<string, ProPlayer[]> = {};
  PRO_PLAYERS.forEach(p => {
    if (NON_TEAMS.includes(p.team.toLowerCase().trim())) return;
    if (!map[p.team]) map[p.team] = [];
    map[p.team].push(p);
  });
  return Object.entries(map)
    .map(([name, players]) => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      players,
    }))
    .sort((a, b) => b.players.length - a.players.length);
}

export function getTeamBySlug(slug: string): TeamInfo | undefined {
  return getTeams().find(t => t.slug === slug);
}

// ── Gear helpers ────────────────────────────────────────────────────────────
export type GearType = 'mouse' | 'keyboard' | 'headset' | 'monitor' | 'mousepad';

export interface GearItem {
  name: string;
  slug: string;
  type: GearType;
  players: ProPlayer[];
}

const GEAR_FIELDS: { key: keyof ProPlayer; type: GearType }[] = [
  { key: 'mouse', type: 'mouse' },
  { key: 'keyboard', type: 'keyboard' },
  { key: 'headset', type: 'headset' },
  { key: 'monitor', type: 'monitor' },
  { key: 'mousepad', type: 'mousepad' },
];

export function getAllGear(): GearItem[] {
  const map: Record<string, GearItem> = {};
  for (const { key, type } of GEAR_FIELDS) {
    for (const p of PRO_PLAYERS) {
      const val = p[key] as string;
      if (!val) continue;
      const mapKey = `${type}:${val}`;
      if (!map[mapKey]) map[mapKey] = {
        name: val,
        slug: `${type}-${val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
        type,
        players: [],
      };
      map[mapKey].players.push(p);
    }
  }
  return Object.values(map).sort((a, b) => b.players.length - a.players.length);
}

export function getGearBySlug(slug: string): GearItem | undefined {
  return getAllGear().find(g => g.slug === slug);
}

export function getGearByType(type: GearType): GearItem[] {
  return getAllGear().filter(g => g.type === type);
}

// ── Country helpers ─────────────────────────────────────────────────────────
export interface CountryInfo {
  name: string;
  slug: string;
  flag: string;
  players: ProPlayer[];
}

export function getCountries(): CountryInfo[] {
  const map: Record<string, { flag: string; players: ProPlayer[] }> = {};
  PRO_PLAYERS.forEach(p => {
    if (!p.country) return;
    if (!map[p.country]) map[p.country] = { flag: p.flag, players: [] };
    map[p.country].players.push(p);
  });
  return Object.entries(map)
    .map(([name, data]) => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      flag: data.flag,
      players: data.players,
    }))
    .sort((a, b) => b.players.length - a.players.length);
}

export function getCountryBySlug(slug: string): CountryInfo | undefined {
  return getCountries().find(c => c.slug === slug);
}

// ── Role helpers ────────────────────────────────────────────────────────────
export interface RoleInfo {
  name: string;
  slug: string;
  players: ProPlayer[];
  description: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  'Rifler': 'Riflers are the backbone of any CS2 team, responsible for securing kills with assault rifles like the AK-47 and M4A4. They need excellent spray control and game sense.',
  'AWPer': 'AWPers specialize in the AWP sniper rifle, holding angles and getting opening picks. They need precise flick aim and strong positioning to justify the $4750 investment.',
  'IGL': 'In-Game Leaders call strategies, read the opponents, and make mid-round adjustments. They sacrifice some individual performance for team coordination and tactical depth.',
  'Entry Fragger': 'Entry fraggers lead the charge onto bombsites, taking the first duels to create space for their team. They need fast reactions, aggressive positioning, and confidence.',
  'Support': 'Support players enable their teammates with utility (smokes, flashes, molotovs) and trade kills. They prioritize team success over individual stats.',
  'Lurker': 'Lurkers play independently on the opposite side of the map, catching rotations and creating pressure. They need excellent timing and map awareness.',
  'Coach': 'Coaches guide their team from outside the server, developing strategies and analyzing opponents. Their settings reflect personal preference rather than competitive optimization.',
};

export function getRoles(): RoleInfo[] {
  const map: Record<string, ProPlayer[]> = {};
  PRO_PLAYERS.forEach(p => {
    if (!map[p.role]) map[p.role] = [];
    map[p.role].push(p);
  });
  return Object.entries(map)
    .map(([name, players]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      players,
      description: ROLE_DESCRIPTIONS[name] || `Professional CS2 ${name.toLowerCase()} players and their settings.`,
    }))
    .sort((a, b) => b.players.length - a.players.length);
}

export function getRoleBySlug(slug: string): RoleInfo | undefined {
  return getRoles().find(r => r.slug === slug);
}

// ── Loadout helpers ─────────────────────────────────────────────────────────
export function getPlayersWithLoadout(limit = 20): ProPlayer[] {
  return PRO_PLAYERS
    .filter(p => p.loadout && (p.loadout.knife || p.loadout.rifle || p.loadout.awp))
    .slice(0, limit);
}


// ── Gear image lookup ───────────────────────────────────────────────────────
import gearImagesData from './gear-images.json';
const gearImages: Record<string, { imageUrl: string; type: string }> = gearImagesData;

export function getGearImageUrl(gearName: string): string | null {
  return gearImages[gearName]?.imageUrl ?? null;
}

// ── Players using a specific skin ───────────────────────────────────────────
export function getPlayersUsingSkin(skinSlug: string): ProPlayer[] {
  return PRO_PLAYERS.filter(p => {
    if (!p.loadout) return false;
    return Object.values(p.loadout).some(v => v === skinSlug);
  });
}
