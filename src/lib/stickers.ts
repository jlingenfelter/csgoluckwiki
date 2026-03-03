/**
 * Stickers Data Layer — reads from build-time generated stickers-data.json
 */

import stickersJson from './stickers-data.json';

export interface Sticker {
  slug: string;
  name: string;
  image?: string | null;
  variant: string;            // Paper, Holo, Glitter, Foil, Gold, Lenticular
  tournament?: string | null;
  team?: string | null;
  type: string;               // tournament, community
  rarity?: string | null;
  collection?: string | null;
  price: number;
  providers?: Record<string, number>;
  liquidity?: number | null;
  volume7d?: number | null;
  trades7d?: number | null;
  listingCount?: number | null;
}

// ── Variant Colors ──────────────────────────────────────────────────────────
export const VARIANT_COLORS: Record<string, string> = {
  'Paper': '#b0c3d9',
  'Holo': '#4b69ff',
  'Glitter': '#8847ff',
  'Foil': '#d32ce6',
  'Gold': '#e4ae39',
  'Lenticular': '#eb4b4b',
};

export const VARIANT_BG: Record<string, string> = {
  'Paper': 'rgba(176,195,217,0.15)',
  'Holo': 'rgba(75,105,255,0.15)',
  'Glitter': 'rgba(136,71,255,0.15)',
  'Foil': 'rgba(211,44,230,0.15)',
  'Gold': 'rgba(228,174,57,0.15)',
  'Lenticular': 'rgba(235,75,75,0.15)',
};

// ── Load stickers from generated JSON ─────────────────────────────────────
const data = stickersJson as any;
export const STICKERS: Sticker[] = data.stickers || [];
export const STICKERS_TOTAL: number = data.totalStickers || 0;
export const STICKERS_FETCHED_AT: string = data.fetchedAt || '';
export const ALL_TOURNAMENTS: string[] = data.tournaments || [];
export const ALL_TEAMS: string[] = data.teams || [];
export const ALL_VARIANTS: string[] = data.variants || [];

// ── Indexes (built once at import time) ──────────────────────────────────
const slugIndex = new Map<string, Sticker>();
for (const s of STICKERS) slugIndex.set(s.slug, s);

// ── Query Helpers ────────────────────────────────────────────────────────

export function getStickerBySlug(slug: string): Sticker | undefined {
  return slugIndex.get(slug);
}

export function getStickersByTournament(tournament: string): Sticker[] {
  return STICKERS.filter(s => s.tournament === tournament);
}

export function getStickersByTeam(team: string): Sticker[] {
  return STICKERS.filter(s => s.team === team);
}

export function getStickersByVariant(variant: string): Sticker[] {
  return STICKERS.filter(s => s.variant === variant);
}

export function getStickersByType(type: string): Sticker[] {
  return STICKERS.filter(s => s.type === type);
}

export function getStickersByCollection(collection: string): Sticker[] {
  return STICKERS.filter(s => s.collection === collection);
}

export function getTournaments(): string[] {
  return ALL_TOURNAMENTS;
}

export function getTeams(): string[] {
  return ALL_TEAMS;
}

export function getCollectionNames(): string[] {
  const set = new Set<string>();
  for (const s of STICKERS) {
    if (s.collection) set.add(s.collection);
  }
  return [...set].sort();
}

export function searchStickers(query: string, limit = 20): Sticker[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return STICKERS
    .filter(s => s.name.toLowerCase().includes(q) || (s.team && s.team.toLowerCase().includes(q)))
    .slice(0, limit);
}

export function getVariantColor(variant: string): string {
  return VARIANT_COLORS[variant] || '#b0c3d9';
}

export function getVariantBg(variant: string): string {
  return VARIANT_BG[variant] || 'rgba(176,195,217,0.15)';
}

/** Get the most expensive stickers */
export function getTopStickers(limit = 20): Sticker[] {
  return STICKERS.filter(s => s.price > 0).slice(0, limit);
}

/** Get stickers sorted by volume */
export function getMostTradedStickers(limit = 20): Sticker[] {
  return [...STICKERS]
    .filter(s => s.volume7d && s.volume7d > 0)
    .sort((a, b) => (b.volume7d || 0) - (a.volume7d || 0))
    .slice(0, limit);
}
