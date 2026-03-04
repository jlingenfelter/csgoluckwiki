/**
 * Skins Data Layer — reads from build-time generated skins-data.json
 */

import skinsJson from './skins-data.json';

export interface SkinPrice {
  wear: string;
  price: number;
  providers?: Record<string, number>;
}

export interface Skin {
  slug: string;
  weapon: string;
  weaponSlug: string;
  name: string;
  category: string;
  rarity: string;
  rarityColor?: string | null;
  collection?: string | null;
  image?: string | null;
  statTrak: boolean;
  souvenir: boolean;
  minFloat: number;
  maxFloat: number;
  prices: SkinPrice[];
  statTrakPrices?: SkinPrice[];
  phase?: string | null;
  parentSlug?: string | null;
  phaseVariants?: string[];
  // Market trend metadata (from PriceEmpire)
  liquidity?: number;
  volume7d?: number;
  volume30d?: number;
  volume90d?: number;
  trades7d?: number;
  trades30d?: number;
  listingCount?: number;
  rank?: number;
  // Extended metadata (from PriceEmpire items endpoint)
  description?: string | null;
  flavorText?: string | null;
  finishStyle?: string | null;
  finishStyleDesc?: string | null;
  paintIndex?: number | null;
  releasedAt?: string | null;
  legacyModel?: boolean;
  team?: string | null;
}

export interface MarketplaceInfo {
  name: string;
  color: string;
  icon: string;
}

// ── Rarity Colors ──────────────────────────────────────────────────────────
export const RARITY_COLORS: Record<string, string> = {
  'Consumer': '#b0c3d9',
  'Industrial': '#5e98d9',
  'Mil-Spec': '#4b69ff',
  'Restricted': '#8847ff',
  'Classified': '#d32ce6',
  'Covert': '#eb4b4b',
  'Contraband': '#e4ae39',
  'Extraordinary': '#e4ae39',
};

export const RARITY_BG: Record<string, string> = {
  'Consumer': 'rgba(176,195,217,0.15)',
  'Industrial': 'rgba(94,152,217,0.15)',
  'Mil-Spec': 'rgba(75,105,255,0.15)',
  'Restricted': 'rgba(136,71,255,0.15)',
  'Classified': 'rgba(211,44,230,0.15)',
  'Covert': 'rgba(235,75,75,0.15)',
  'Contraband': 'rgba(228,174,57,0.15)',
  'Extraordinary': 'rgba(228,174,57,0.15)',
};

// ── Load skins from generated JSON ─────────────────────────────────────────
export const SKINS: Skin[] = (skinsJson as any).skins || [];
export const SKINS_SOURCE: string = (skinsJson as any).source || 'unknown';
export const SKINS_FETCHED_AT: string = (skinsJson as any).fetchedAt || '';
export const SKINS_TOTAL: number = (skinsJson as any).totalSkins || 0;
export const MARKETPLACES: Record<string, MarketplaceInfo> = (skinsJson as any).marketplaces || {};

// ── Query Helpers ──────────────────────────────────────────────────────────

export function getSkinsByWeapon(weaponSlug: string): Skin[] {
  return SKINS.filter(s => s.weaponSlug === weaponSlug);
}

export function getSkinsByCategory(category: string): Skin[] {
  return SKINS.filter(s => s.category === category);
}

export function getSkinBySlug(slug: string): Skin | undefined {
  return SKINS.find(s => s.slug === slug);
}

export function getPhaseVariants(skin: Skin): Skin[] {
  if (!skin.phaseVariants?.length) return [];
  return skin.phaseVariants.map(slug => getSkinBySlug(slug)).filter(Boolean) as Skin[];
}

export function getParentSkin(skin: Skin): Skin | undefined {
  return skin.parentSlug ? getSkinBySlug(skin.parentSlug) : undefined;
}

export function getLowestPrice(skin: Skin): number {
  if (!skin.prices || skin.prices.length === 0) return 0;
  return Math.min(...skin.prices.map(p => p.price));
}

export function getHighestPrice(skin: Skin): number {
  if (!skin.prices || skin.prices.length === 0) return 0;
  return Math.max(...skin.prices.map(p => p.price));
}

/** Format a price with commas for thousands (e.g. 1,234.56) */
export function fmtPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getUniqueWeapons(): string[] {
  return [...new Set(SKINS.map(s => s.weapon))];
}

export function getUniqueWeaponSlugs(): string[] {
  return [...new Set(SKINS.map(s => s.weaponSlug))];
}

export function getUniqueCategories(): string[] {
  return [...new Set(SKINS.map(s => s.category))];
}

export function getSkinCountByWeapon(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const s of SKINS) {
    counts[s.weaponSlug] = (counts[s.weaponSlug] || 0) + 1;
  }
  return counts;
}

export function getWeaponsInCategory(category: string): { weapon: string; weaponSlug: string; count: number }[] {
  const map = new Map<string, { weapon: string; weaponSlug: string; count: number }>();
  for (const s of SKINS) {
    if (s.category !== category) continue;
    const existing = map.get(s.weaponSlug);
    if (existing) {
      existing.count++;
    } else {
      map.set(s.weaponSlug, { weapon: s.weapon, weaponSlug: s.weaponSlug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Get all skins with the same finish name (Skin Family — e.g., all "Fade" skins across weapons) */
export function getSkinFamily(skinName: string, excludeSlug?: string): Skin[] {
  return SKINS.filter(s => s.name === skinName && s.slug !== excludeSlug && !s.phase)
    .sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
}

export function getCategoryCount(category: string): number {
  return SKINS.filter(s => s.category === category).length;
}

export function searchSkins(query: string): Skin[] {
  const q = query.toLowerCase();
  return SKINS.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.weapon.toLowerCase().includes(q) ||
    (s.collection && s.collection.toLowerCase().includes(q))
  );
}

// ── Trend / Market Movers helpers ──────────────────────────────────────────
export function getTopByVolume(limit = 50): Skin[] {
  return [...SKINS]
    .filter(s => (s.volume7d || 0) > 0)
    .sort((a, b) => (b.volume7d || 0) - (a.volume7d || 0))
    .slice(0, limit);
}

export function getTopByLiquidity(limit = 50): Skin[] {
  return [...SKINS]
    .filter(s => (s.liquidity || 0) > 0)
    .sort((a, b) => (b.liquidity || 0) - (a.liquidity || 0))
    .slice(0, limit);
}

export function getMostTraded(limit = 50): Skin[] {
  return [...SKINS]
    .filter(s => (s.trades7d || 0) > 0)
    .sort((a, b) => (b.trades7d || 0) - (a.trades7d || 0))
    .slice(0, limit);
}

export function getMostListings(limit = 50): Skin[] {
  return [...SKINS]
    .filter(s => (s.listingCount || 0) > 0)
    .sort((a, b) => (b.listingCount || 0) - (a.listingCount || 0))
    .slice(0, limit);
}

export function getVolumeLabel(volume: number): string {
  if (volume >= 10000) return `${(volume / 1000).toFixed(0)}K`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

export function getLiquidityColor(liquidity: number): string {
  if (liquidity >= 80) return '#4caf50'; // High — green
  if (liquidity >= 50) return '#ff9800'; // Medium — orange
  if (liquidity >= 20) return '#f44336'; // Low — red
  return '#9e9e9e'; // Very low — gray
}

export function getLiquidityLabel(liquidity: number): string {
  if (liquidity >= 80) return 'High';
  if (liquidity >= 50) return 'Medium';
  if (liquidity >= 20) return 'Low';
  return 'Very Low';
}

// ── Collection helpers ──────────────────────────────────────────────────────
export interface CollectionInfo {
  name: string;
  slug: string;
  skins: Skin[];
  rarities: Record<string, number>;
  weapons: string[];
}

export function getCollections(): CollectionInfo[] {
  const map: Record<string, Skin[]> = {};
  for (const s of SKINS) {
    if (!s.collection) continue;
    if (!map[s.collection]) map[s.collection] = [];
    map[s.collection].push(s);
  }
  return Object.entries(map)
    .map(([name, skins]) => {
      const rarities: Record<string, number> = {};
      const weaponSet = new Set<string>();
      skins.forEach(s => {
        rarities[s.rarity] = (rarities[s.rarity] || 0) + 1;
        weaponSet.add(s.weapon);
      });
      return {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        skins: skins.sort((a, b) => {
          const rarityOrder = ['Contraband', 'Covert', 'Classified', 'Restricted', 'Mil-Spec', 'Industrial', 'Consumer'];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        }),
        rarities,
        weapons: [...weaponSet].sort(),
      };
    })
    .sort((a, b) => b.skins.length - a.skins.length);
}

export function getCollectionBySlug(slug: string): CollectionInfo | undefined {
  return getCollections().find(c => c.slug === slug);
}
