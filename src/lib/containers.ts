/**
 * CS2 Openable Containers Data
 *
 * Covers all openable container types:
 *   - Souvenir packages (148 entries across 21 tournaments)
 *   - Sticker capsules (non-tournament and tournament)
 *   - Autograph capsules
 *   - Music kit boxes
 *
 * ConVars IDs match the in-game item schema numeric IDs.
 */

// ── Types & Interfaces ────────────────────────────────────────────────────────

export type ContainerType =
  | 'souvenir'
  | 'sticker-capsule'
  | 'autograph-capsule'
  | 'music-kit'
  | 'patch-pack'
  | 'graffiti'
  | 'pins'
  | 'charm';

export interface SouvenirPackageData {
  id: string;         // URL slug, e.g. "budapest-2025-mirage-souvenir-package"
  name: string;       // Display name, e.g. "Budapest 2025 Mirage Souvenir Package"
  tournament: string; // e.g. "Budapest 2025"
  year: number;
  map: string;        // e.g. "Mirage"
  collection: string; // Matches the `collection` field on Skin objects
  convarsId: number;
}

export interface OtherContainer {
  id: string;
  name: string;
  type: ContainerType;
  year?: number;
  tournament?: string;
  convarsId?: number;
}

// ── Souvenir Drop Odds ────────────────────────────────────────────────────────
// Souvenir packages use a different probability table than weapon cases.

export const SOUVENIR_DROP_ODDS: Record<string, number> = {
  Consumer:   80.0,
  Industrial: 16.0,
  'Mil-Spec':  3.2,
  Restricted:  0.64,
  Classified:  0.128,
  Covert:      0.0256,
};

// ── Map-to-Collection Mapping ─────────────────────────────────────────────────
//
// Souvenir packages contain skins drawn from map-specific collections.
// The collection name changed for several maps between the legacy and modern era.
//
// "Modern" era: Stockholm 2021 and all later events.
// "Legacy" era: Berlin 2019 and all earlier events.

/**
 * Returns the correct collection name for a given map and tournament era.
 * Pass `modern = true` for Stockholm 2021 and later; `false` for Berlin 2019
 * and earlier.
 */
export function getCollectionName(map: string, modern: boolean, year?: number, tournament?: string): string {
  if (modern) {
    // Overpass switched collections in 2024
    if (map === 'Overpass') {
      if (year && year >= 2024) return 'The Overpass 2024 Collection';
      return 'The Overpass Collection';
    }
    // Train switched collections in 2025
    if (map === 'Train') {
      if (year && year >= 2025) return 'The Train 2025 Collection';
      return 'The 2021 Train Collection';
    }
    const modernMap: Record<string, string> = {
      'Dust II':    'The 2021 Dust 2 Collection',
      'Mirage':     'The 2021 Mirage Collection',
      'Inferno':    'The 2018 Inferno Collection',
      'Nuke':       'The 2018 Nuke Collection',
      'Vertigo':    'The 2021 Vertigo Collection',
      'Ancient':    'The Ancient Collection',
      'Anubis':     'The Anubis Collection',
      'Cobblestone':'The Cobblestone Collection',
      'Cache':      'The Cache Collection',
    };
    return modernMap[map] ?? `The ${map} Collection`;
  } else {
    const legacyMap: Record<string, string> = {
      'Dust II':    'The Dust 2 Collection',
      'Mirage':     'The Mirage Collection',
      'Inferno':    'The Inferno Collection',
      'Nuke':       'The Nuke Collection',
      'Overpass':   'The Overpass Collection',
      'Train':      'The Train Collection',
      'Cache':      'The Cache Collection',
      'Cobblestone':'The Cobblestone Collection',
      'Vertigo':    'The Vertigo Collection',
    };
    return legacyMap[map] ?? `The ${map} Collection`;
  }
}

// ── Slug Helper ───────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Internal builder helpers ──────────────────────────────────────────────────

function makeSouvenir(
  tournament: string,
  year: number,
  map: string,
  convarsId: number,
  modern: boolean,
): SouvenirPackageData {
  const name = `${tournament} ${map} Souvenir Package`;
  const collection = getCollectionName(map, modern, year, tournament);
  return {
    id: toSlug(name),
    name,
    tournament,
    year,
    map,
    collection,
    convarsId,
  };
}

// ── Souvenir Packages ─────────────────────────────────────────────────────────
//
// 148 entries across 21 major tournaments (2014–2025).
// Entries are ordered chronologically, newest first.
// ConVars IDs are assigned sequentially within each tournament block.

export const SOUVENIR_PACKAGES: SouvenirPackageData[] = [

  // ── Budapest 2025 (IDs 457–463) — modern era ─────────────────────────────
  makeSouvenir('Budapest 2025', 2025, 'Train',    457, true),
  makeSouvenir('Budapest 2025', 2025, 'Nuke',     458, true),
  makeSouvenir('Budapest 2025', 2025, 'Ancient',  459, true),
  makeSouvenir('Budapest 2025', 2025, 'Dust II',  460, true),
  makeSouvenir('Budapest 2025', 2025, 'Overpass', 461, true),
  makeSouvenir('Budapest 2025', 2025, 'Mirage',   462, true),
  makeSouvenir('Budapest 2025', 2025, 'Inferno',  463, true),

  // ── Austin 2025 (IDs 434–440) — modern era ───────────────────────────────
  makeSouvenir('Austin 2025', 2025, 'Train',    434, true),
  makeSouvenir('Austin 2025', 2025, 'Nuke',     435, true),
  makeSouvenir('Austin 2025', 2025, 'Ancient',  436, true),
  makeSouvenir('Austin 2025', 2025, 'Dust II',  437, true),
  makeSouvenir('Austin 2025', 2025, 'Anubis',   438, true),
  makeSouvenir('Austin 2025', 2025, 'Mirage',   439, true),
  makeSouvenir('Austin 2025', 2025, 'Inferno',  440, true),

  // ── Shanghai 2024 (IDs 418–424) — modern era ─────────────────────────────
  makeSouvenir('Shanghai 2024', 2024, 'Vertigo', 418, true),
  makeSouvenir('Shanghai 2024', 2024, 'Nuke',    419, true),
  makeSouvenir('Shanghai 2024', 2024, 'Ancient', 420, true),
  makeSouvenir('Shanghai 2024', 2024, 'Dust II', 421, true),
  makeSouvenir('Shanghai 2024', 2024, 'Anubis',  422, true),
  makeSouvenir('Shanghai 2024', 2024, 'Mirage',  423, true),
  makeSouvenir('Shanghai 2024', 2024, 'Inferno', 424, true),

  // ── Copenhagen 2024 (IDs 401–407) — modern era ───────────────────────────
  makeSouvenir('Copenhagen 2024', 2024, 'Vertigo', 401, true),
  makeSouvenir('Copenhagen 2024', 2024, 'Nuke',    402, true),
  makeSouvenir('Copenhagen 2024', 2024, 'Ancient', 403, true),
  makeSouvenir('Copenhagen 2024', 2024, 'Overpass',404, true),
  makeSouvenir('Copenhagen 2024', 2024, 'Anubis',  405, true),
  makeSouvenir('Copenhagen 2024', 2024, 'Mirage',  406, true),
  makeSouvenir('Copenhagen 2024', 2024, 'Inferno', 407, true),

  // ── Paris 2023 (IDs 382–388) — modern era ────────────────────────────────
  makeSouvenir('Paris 2023', 2023, 'Vertigo', 382, true),
  makeSouvenir('Paris 2023', 2023, 'Nuke',    383, true),
  makeSouvenir('Paris 2023', 2023, 'Ancient', 384, true),
  makeSouvenir('Paris 2023', 2023, 'Overpass',385, true),
  makeSouvenir('Paris 2023', 2023, 'Anubis',  386, true),
  makeSouvenir('Paris 2023', 2023, 'Mirage',  387, true),
  makeSouvenir('Paris 2023', 2023, 'Inferno', 388, true),

  // ── Rio 2022 (IDs 362–368) — modern era ──────────────────────────────────
  makeSouvenir('Rio 2022', 2022, 'Vertigo', 362, true),
  makeSouvenir('Rio 2022', 2022, 'Nuke',    363, true),
  makeSouvenir('Rio 2022', 2022, 'Ancient', 364, true),
  makeSouvenir('Rio 2022', 2022, 'Overpass',365, true),
  makeSouvenir('Rio 2022', 2022, 'Dust II', 366, true),
  makeSouvenir('Rio 2022', 2022, 'Mirage',  367, true),
  makeSouvenir('Rio 2022', 2022, 'Inferno', 368, true),

  // ── Antwerp 2022 (IDs 344–350) — modern era ──────────────────────────────
  makeSouvenir('Antwerp 2022', 2022, 'Vertigo', 344, true),
  makeSouvenir('Antwerp 2022', 2022, 'Nuke',    345, true),
  makeSouvenir('Antwerp 2022', 2022, 'Ancient', 346, true),
  makeSouvenir('Antwerp 2022', 2022, 'Overpass',347, true),
  makeSouvenir('Antwerp 2022', 2022, 'Dust II', 348, true),
  makeSouvenir('Antwerp 2022', 2022, 'Mirage',  349, true),
  makeSouvenir('Antwerp 2022', 2022, 'Inferno', 350, true),

  // ── Stockholm 2021 (IDs 330–336) — modern era ────────────────────────────
  makeSouvenir('Stockholm 2021', 2021, 'Vertigo', 330, true),
  makeSouvenir('Stockholm 2021', 2021, 'Nuke',    331, true),
  makeSouvenir('Stockholm 2021', 2021, 'Ancient', 332, true),
  makeSouvenir('Stockholm 2021', 2021, 'Overpass',333, true),
  makeSouvenir('Stockholm 2021', 2021, 'Dust II', 334, true),
  makeSouvenir('Stockholm 2021', 2021, 'Mirage',  335, true),
  makeSouvenir('Stockholm 2021', 2021, 'Inferno', 336, true),

  // ── Berlin 2019 (IDs 284–290) — legacy era ───────────────────────────────
  makeSouvenir('Berlin 2019', 2019, 'Vertigo', 284, false),
  makeSouvenir('Berlin 2019', 2019, 'Nuke',    285, false),
  makeSouvenir('Berlin 2019', 2019, 'Train',   286, false),
  makeSouvenir('Berlin 2019', 2019, 'Overpass',287, false),
  makeSouvenir('Berlin 2019', 2019, 'Dust II', 288, false),
  makeSouvenir('Berlin 2019', 2019, 'Mirage',  289, false),
  makeSouvenir('Berlin 2019', 2019, 'Inferno', 290, false),

  // ── Katowice 2019 (IDs 267–273) — legacy era ─────────────────────────────
  makeSouvenir('Katowice 2019', 2019, 'Nuke',    267, false),
  makeSouvenir('Katowice 2019', 2019, 'Train',   268, false),
  makeSouvenir('Katowice 2019', 2019, 'Cache',   269, false),
  makeSouvenir('Katowice 2019', 2019, 'Overpass',270, false),
  makeSouvenir('Katowice 2019', 2019, 'Dust II', 271, false),
  makeSouvenir('Katowice 2019', 2019, 'Mirage',  272, false),
  makeSouvenir('Katowice 2019', 2019, 'Inferno', 273, false),

  // ── London 2018 (IDs 251–257) — legacy era ───────────────────────────────
  makeSouvenir('London 2018', 2018, 'Nuke',    251, false),
  makeSouvenir('London 2018', 2018, 'Train',   252, false),
  makeSouvenir('London 2018', 2018, 'Cache',   253, false),
  makeSouvenir('London 2018', 2018, 'Overpass',254, false),
  makeSouvenir('London 2018', 2018, 'Dust II', 255, false),
  makeSouvenir('London 2018', 2018, 'Mirage',  256, false),
  makeSouvenir('London 2018', 2018, 'Inferno', 257, false),

  // ── Boston 2018 (IDs 230–236) — legacy era ───────────────────────────────
  makeSouvenir('Boston 2018', 2018, 'Nuke',       230, false),
  makeSouvenir('Boston 2018', 2018, 'Train',      231, false),
  makeSouvenir('Boston 2018', 2018, 'Cache',      232, false),
  makeSouvenir('Boston 2018', 2018, 'Overpass',   233, false),
  makeSouvenir('Boston 2018', 2018, 'Cobblestone',234, false),
  makeSouvenir('Boston 2018', 2018, 'Mirage',     235, false),
  makeSouvenir('Boston 2018', 2018, 'Inferno',    236, false),

  // ── Krakow 2017 (IDs 213–219) — legacy era ───────────────────────────────
  makeSouvenir('Krakow 2017', 2017, 'Nuke',       213, false),
  makeSouvenir('Krakow 2017', 2017, 'Train',      214, false),
  makeSouvenir('Krakow 2017', 2017, 'Cache',      215, false),
  makeSouvenir('Krakow 2017', 2017, 'Overpass',   216, false),
  makeSouvenir('Krakow 2017', 2017, 'Cobblestone',217, false),
  makeSouvenir('Krakow 2017', 2017, 'Mirage',     218, false),
  makeSouvenir('Krakow 2017', 2017, 'Inferno',    219, false),

  // ── Atlanta 2017 (IDs 200–206) — legacy era ──────────────────────────────
  makeSouvenir('Atlanta 2017', 2017, 'Nuke',       200, false),
  makeSouvenir('Atlanta 2017', 2017, 'Train',      201, false),
  makeSouvenir('Atlanta 2017', 2017, 'Cache',      202, false),
  makeSouvenir('Atlanta 2017', 2017, 'Overpass',   203, false),
  makeSouvenir('Atlanta 2017', 2017, 'Cobblestone',204, false),
  makeSouvenir('Atlanta 2017', 2017, 'Mirage',     205, false),
  makeSouvenir('Atlanta 2017', 2017, 'Dust II',    206, false),

  // ── Cologne 2016 (IDs 165–171) — legacy era ──────────────────────────────
  makeSouvenir('Cologne 2016', 2016, 'Nuke',       165, false),
  makeSouvenir('Cologne 2016', 2016, 'Train',      166, false),
  makeSouvenir('Cologne 2016', 2016, 'Cache',      167, false),
  makeSouvenir('Cologne 2016', 2016, 'Overpass',   168, false),
  makeSouvenir('Cologne 2016', 2016, 'Cobblestone',169, false),
  makeSouvenir('Cologne 2016', 2016, 'Mirage',     170, false),
  makeSouvenir('Cologne 2016', 2016, 'Dust II',    171, false),

  // ── MLG Columbus 2016 (IDs 133–140) — legacy era — 8 maps ────────────────
  makeSouvenir('MLG Columbus 2016', 2016, 'Nuke',       133, false),
  makeSouvenir('MLG Columbus 2016', 2016, 'Train',      134, false),
  makeSouvenir('MLG Columbus 2016', 2016, 'Cache',      135, false),
  makeSouvenir('MLG Columbus 2016', 2016, 'Overpass',   136, false),
  makeSouvenir('MLG Columbus 2016', 2016, 'Cobblestone',137, false),
  makeSouvenir('MLG Columbus 2016', 2016, 'Inferno',    138, false),
  makeSouvenir('MLG Columbus 2016', 2016, 'Mirage',     139, false),
  makeSouvenir('MLG Columbus 2016', 2016, 'Dust II',    140, false),

  // ── DreamHack Cluj-Napoca 2015 (IDs 101–107) — legacy era ────────────────
  makeSouvenir('DreamHack Cluj-Napoca 2015', 2015, 'Train',      101, false),
  makeSouvenir('DreamHack Cluj-Napoca 2015', 2015, 'Cache',      102, false),
  makeSouvenir('DreamHack Cluj-Napoca 2015', 2015, 'Overpass',   103, false),
  makeSouvenir('DreamHack Cluj-Napoca 2015', 2015, 'Cobblestone',104, false),
  makeSouvenir('DreamHack Cluj-Napoca 2015', 2015, 'Inferno',    105, false),
  makeSouvenir('DreamHack Cluj-Napoca 2015', 2015, 'Mirage',     106, false),
  makeSouvenir('DreamHack Cluj-Napoca 2015', 2015, 'Dust II',    107, false),

  // ── ESL One Cologne 2015 (IDs 73–79) — legacy era ────────────────────────
  makeSouvenir('ESL One Cologne 2015', 2015, 'Train',      73, false),
  makeSouvenir('ESL One Cologne 2015', 2015, 'Cache',      74, false),
  makeSouvenir('ESL One Cologne 2015', 2015, 'Overpass',   75, false),
  makeSouvenir('ESL One Cologne 2015', 2015, 'Cobblestone',76, false),
  makeSouvenir('ESL One Cologne 2015', 2015, 'Inferno',    77, false),
  makeSouvenir('ESL One Cologne 2015', 2015, 'Mirage',     78, false),
  makeSouvenir('ESL One Cologne 2015', 2015, 'Dust II',    79, false),

  // ── ESL One Katowice 2015 (IDs 39–45) — legacy era ───────────────────────
  makeSouvenir('ESL One Katowice 2015', 2015, 'Overpass',   39, false),
  makeSouvenir('ESL One Katowice 2015', 2015, 'Cobblestone',40, false),
  makeSouvenir('ESL One Katowice 2015', 2015, 'Cache',      41, false),
  makeSouvenir('ESL One Katowice 2015', 2015, 'Nuke',       42, false),
  makeSouvenir('ESL One Katowice 2015', 2015, 'Mirage',     43, false),
  makeSouvenir('ESL One Katowice 2015', 2015, 'Inferno',    44, false),
  makeSouvenir('ESL One Katowice 2015', 2015, 'Dust II',    45, false),

  // ── DreamHack 2014 (IDs 31–37) — legacy era ──────────────────────────────
  makeSouvenir('DreamHack 2014', 2014, 'Overpass',   31, false),
  makeSouvenir('DreamHack 2014', 2014, 'Cobblestone',32, false),
  makeSouvenir('DreamHack 2014', 2014, 'Cache',      33, false),
  makeSouvenir('DreamHack 2014', 2014, 'Nuke',       34, false),
  makeSouvenir('DreamHack 2014', 2014, 'Mirage',     35, false),
  makeSouvenir('DreamHack 2014', 2014, 'Inferno',    36, false),
  makeSouvenir('DreamHack 2014', 2014, 'Dust II',    37, false),

  // ── ESL One Cologne 2014 (IDs 22–28) — legacy era ────────────────────────
  makeSouvenir('ESL One Cologne 2014', 2014, 'Overpass',   22, false),
  makeSouvenir('ESL One Cologne 2014', 2014, 'Cobblestone',23, false),
  makeSouvenir('ESL One Cologne 2014', 2014, 'Cache',      24, false),
  makeSouvenir('ESL One Cologne 2014', 2014, 'Nuke',       25, false),
  makeSouvenir('ESL One Cologne 2014', 2014, 'Mirage',     26, false),
  makeSouvenir('ESL One Cologne 2014', 2014, 'Inferno',    27, false),
  makeSouvenir('ESL One Cologne 2014', 2014, 'Dust II',    28, false),
];

// ── Sticker Capsules ──────────────────────────────────────────────────────────

export const STICKER_CAPSULES: OtherContainer[] = [

  // Non-tournament community/collab sticker capsules
  { id: 'warhammer-40000-sticker-capsule',    name: 'Warhammer 40,000 Sticker Capsule',     type: 'sticker-capsule', convarsId: 428 },
  { id: 'warhammer-40000-traitor-astartes-sticker-capsule',  name: 'Warhammer 40,000 Traitor Astartes Sticker Capsule',  type: 'sticker-capsule', convarsId: 429 },
  { id: 'warhammer-40000-adeptus-astartes-sticker-capsule', name: 'Warhammer 40,000 Adeptus Astartes Sticker Capsule', type: 'sticker-capsule' },
  { id: 'warhammer-40000-imperium-sticker-capsule',         name: 'Warhammer 40,000 Imperium Sticker Capsule',         type: 'sticker-capsule' },
  { id: 'warhammer-40000-xenos-sticker-capsule',            name: 'Warhammer 40,000 Xenos Sticker Capsule',            type: 'sticker-capsule' },
  { id: 'craft-sticker-capsule',              name: 'Craft Sticker Capsule',                type: 'sticker-capsule', convarsId: 427 },
  { id: 'elemental-craft-sticker-capsule',    name: 'Elemental Craft Sticker Capsule',      type: 'sticker-capsule', convarsId: 453 },
  { id: 'feral-predators-capsule',            name: 'Feral Predators Capsule',              type: 'sticker-capsule', convarsId: 413 },
  { id: 'boardroom-sticker-capsule',          name: 'Boardroom Sticker Capsule',            type: 'sticker-capsule', convarsId: 409 },
  { id: 'high-noon-capsule',                  name: 'High Noon Capsule',                    type: 'sticker-capsule', convarsId: 410 },
  { id: 'sans-titre-capsule',                 name: 'Sans Titre Capsule',                   type: 'sticker-capsule', convarsId: 411 },
  { id: 'ambush-sticker-capsule',             name: 'Ambush Sticker Capsule',               type: 'sticker-capsule', convarsId: 412 },
  { id: '10-year-birthday-sticker-capsule',   name: '10 Year Birthday Sticker Capsule',     type: 'sticker-capsule', convarsId: 375 },
  { id: 'slid3-capsule',                      name: 'Slid3 Capsule',                        type: 'sticker-capsule', convarsId: 376 },
  { id: 'pinups-capsule',                     name: 'Pinups Capsule',                       type: 'sticker-capsule', convarsId: 377 },
  { id: 'poorly-drawn-capsule',               name: 'Poorly Drawn Capsule',                 type: 'sticker-capsule', convarsId: 378 },
  { id: 'skill-groups-capsule',               name: 'Skill Groups Capsule',                 type: 'sticker-capsule', convarsId: 352 },
  { id: 'metal-capsule',                      name: 'Metal Capsule',                        type: 'sticker-capsule', convarsId: 353 },
  { id: 'halo-capsule',                       name: 'Halo Capsule',                         type: 'sticker-capsule', convarsId: 320 },
  { id: 'half-life-alyx-sticker-capsule',     name: 'Half-Life: Alyx Sticker Capsule',      type: 'sticker-capsule', convarsId: 313 },
  { id: 'shattered-web-sticker-capsule',      name: 'Shattered Web Sticker Capsule',        type: 'sticker-capsule', convarsId: 308 },
  { id: 'x-ray-p250-package',                 name: 'X-Ray P250 Package',                   type: 'sticker-capsule', convarsId: 309 },
  { id: 'broken-fang-sticker-collection',     name: 'Broken Fang Sticker Collection',       type: 'sticker-capsule', convarsId: 327 },
  { id: 'operation-riptide-sticker-collection',name: 'Operation Riptide Sticker Collection',type: 'sticker-capsule', convarsId: 338 },
  { id: 'watercolor-capsule',                 name: 'Watercolor Capsule',                   type: 'sticker-capsule', convarsId: 298 },
  { id: 'cs20-sticker-capsule',               name: 'CS20 Sticker Capsule',                 type: 'sticker-capsule', convarsId: 297 },
  { id: 'bestiary-capsule',                   name: 'Bestiary Capsule',                     type: 'sticker-capsule', convarsId: 261 },
  { id: 'chicken-capsule',                    name: 'Chicken Capsule',                      type: 'sticker-capsule', convarsId: 262 },
  { id: 'perfect-world-sticker-capsule-1',    name: 'Perfect World Sticker Capsule 1',      type: 'sticker-capsule', convarsId: 244 },
  { id: 'perfect-world-sticker-capsule-2',    name: 'Perfect World Sticker Capsule 2',      type: 'sticker-capsule', convarsId: 245 },
  { id: 'enfu-sticker-capsule',               name: 'Enfu Sticker Capsule',                 type: 'sticker-capsule', convarsId: 70  },
  { id: 'sugarface-capsule',                  name: 'Sugarface Capsule',                    type: 'sticker-capsule', convarsId: 71  },
  { id: 'team-roles-capsule',                 name: 'Team Roles Capsule',                   type: 'sticker-capsule', convarsId: 72  },
  { id: 'community-sticker-capsule-1',        name: 'Community Sticker Capsule 1',          type: 'sticker-capsule', convarsId: 46  },
  { id: 'sticker-capsule-2',                  name: 'Sticker Capsule 2',                    type: 'sticker-capsule', convarsId: 10  },
  { id: 'csgosticker-capsule',                name: 'CS:GO Sticker Capsule',                type: 'sticker-capsule', convarsId: 9   },

  // Tournament sticker capsules — 3 tiers per event (Contenders / Challengers / Legends)
  // Budapest 2025
  { id: 'budapest-2025-contenders-sticker-capsule',  name: 'Budapest 2025 Contenders Sticker Capsule',  type: 'sticker-capsule', year: 2025, tournament: 'Budapest 2025' },
  { id: 'budapest-2025-challengers-sticker-capsule', name: 'Budapest 2025 Challengers Sticker Capsule', type: 'sticker-capsule', year: 2025, tournament: 'Budapest 2025' },
  { id: 'budapest-2025-legends-sticker-capsule',     name: 'Budapest 2025 Legends Sticker Capsule',     type: 'sticker-capsule', year: 2025, tournament: 'Budapest 2025' },

  // Austin 2025
  { id: 'austin-2025-contenders-sticker-capsule',    name: 'Austin 2025 Contenders Sticker Capsule',    type: 'sticker-capsule', year: 2025, tournament: 'Austin 2025' },
  { id: 'austin-2025-challengers-sticker-capsule',   name: 'Austin 2025 Challengers Sticker Capsule',   type: 'sticker-capsule', year: 2025, tournament: 'Austin 2025' },
  { id: 'austin-2025-legends-sticker-capsule',       name: 'Austin 2025 Legends Sticker Capsule',       type: 'sticker-capsule', year: 2025, tournament: 'Austin 2025' },

  // Shanghai 2024
  { id: 'shanghai-2024-contenders-sticker-capsule',  name: 'Shanghai 2024 Contenders Sticker Capsule',  type: 'sticker-capsule', year: 2024, tournament: 'Shanghai 2024' },
  { id: 'shanghai-2024-challengers-sticker-capsule', name: 'Shanghai 2024 Challengers Sticker Capsule', type: 'sticker-capsule', year: 2024, tournament: 'Shanghai 2024' },
  { id: 'shanghai-2024-legends-sticker-capsule',     name: 'Shanghai 2024 Legends Sticker Capsule',     type: 'sticker-capsule', year: 2024, tournament: 'Shanghai 2024' },

  // Copenhagen 2024
  { id: 'copenhagen-2024-contenders-sticker-capsule',  name: 'Copenhagen 2024 Contenders Sticker Capsule',  type: 'sticker-capsule', year: 2024, tournament: 'Copenhagen 2024' },
  { id: 'copenhagen-2024-challengers-sticker-capsule', name: 'Copenhagen 2024 Challengers Sticker Capsule', type: 'sticker-capsule', year: 2024, tournament: 'Copenhagen 2024' },
  { id: 'copenhagen-2024-legends-sticker-capsule',     name: 'Copenhagen 2024 Legends Sticker Capsule',     type: 'sticker-capsule', year: 2024, tournament: 'Copenhagen 2024' },

  // Paris 2023
  { id: 'paris-2023-contenders-sticker-capsule',  name: 'Paris 2023 Contenders Sticker Capsule',  type: 'sticker-capsule', year: 2023, tournament: 'Paris 2023' },
  { id: 'paris-2023-challengers-sticker-capsule', name: 'Paris 2023 Challengers Sticker Capsule', type: 'sticker-capsule', year: 2023, tournament: 'Paris 2023' },
  { id: 'paris-2023-legends-sticker-capsule',     name: 'Paris 2023 Legends Sticker Capsule',     type: 'sticker-capsule', year: 2023, tournament: 'Paris 2023' },

  // Rio 2022
  { id: 'rio-2022-contenders-sticker-capsule',  name: 'Rio 2022 Contenders Sticker Capsule',  type: 'sticker-capsule', year: 2022, tournament: 'Rio 2022' },
  { id: 'rio-2022-challengers-sticker-capsule', name: 'Rio 2022 Challengers Sticker Capsule', type: 'sticker-capsule', year: 2022, tournament: 'Rio 2022' },
  { id: 'rio-2022-legends-sticker-capsule',     name: 'Rio 2022 Legends Sticker Capsule',     type: 'sticker-capsule', year: 2022, tournament: 'Rio 2022' },

  // Antwerp 2022
  { id: 'antwerp-2022-contenders-sticker-capsule',  name: 'Antwerp 2022 Contenders Sticker Capsule',  type: 'sticker-capsule', year: 2022, tournament: 'Antwerp 2022' },
  { id: 'antwerp-2022-challengers-sticker-capsule', name: 'Antwerp 2022 Challengers Sticker Capsule', type: 'sticker-capsule', year: 2022, tournament: 'Antwerp 2022' },
  { id: 'antwerp-2022-legends-sticker-capsule',     name: 'Antwerp 2022 Legends Sticker Capsule',     type: 'sticker-capsule', year: 2022, tournament: 'Antwerp 2022' },

  // Stockholm 2021 (2 tiers: Finalists / Champions — no Contenders tier)
  { id: 'stockholm-2021-finalists-sticker-capsule', name: 'Stockholm 2021 Finalists Sticker Capsule', type: 'sticker-capsule', year: 2021, tournament: 'Stockholm 2021' },
  { id: 'stockholm-2021-champions-sticker-capsule', name: 'Stockholm 2021 Champions Sticker Capsule', type: 'sticker-capsule', year: 2021, tournament: 'Stockholm 2021' },

  // Berlin 2019 (3 tiers)
  { id: 'berlin-2019-returning-challengers-sticker-capsule', name: 'Berlin 2019 Returning Challengers Sticker Capsule', type: 'sticker-capsule', year: 2019, tournament: 'Berlin 2019' },
  { id: 'berlin-2019-minor-challengers-sticker-capsule',     name: 'Berlin 2019 Minor Challengers Sticker Capsule',     type: 'sticker-capsule', year: 2019, tournament: 'Berlin 2019' },
  { id: 'berlin-2019-legends-sticker-capsule',               name: 'Berlin 2019 Legends Sticker Capsule',               type: 'sticker-capsule', year: 2019, tournament: 'Berlin 2019' },

  // Katowice 2019 (3 tiers)
  { id: 'katowice-2019-returning-challengers-sticker-capsule', name: 'Katowice 2019 Returning Challengers Sticker Capsule', type: 'sticker-capsule', year: 2019, tournament: 'Katowice 2019' },
  { id: 'katowice-2019-minor-challengers-sticker-capsule',     name: 'Katowice 2019 Minor Challengers Sticker Capsule',     type: 'sticker-capsule', year: 2019, tournament: 'Katowice 2019' },
  { id: 'katowice-2019-legends-sticker-capsule',               name: 'Katowice 2019 Legends Sticker Capsule',               type: 'sticker-capsule', year: 2019, tournament: 'Katowice 2019' },

  // London 2018 (3 tiers)
  { id: 'london-2018-returning-challengers-sticker-capsule', name: 'London 2018 Returning Challengers Sticker Capsule', type: 'sticker-capsule', year: 2018, tournament: 'London 2018' },
  { id: 'london-2018-minor-challengers-sticker-capsule',     name: 'London 2018 Minor Challengers Sticker Capsule',     type: 'sticker-capsule', year: 2018, tournament: 'London 2018' },
  { id: 'london-2018-legends-sticker-capsule',               name: 'London 2018 Legends Sticker Capsule',               type: 'sticker-capsule', year: 2018, tournament: 'London 2018' },
];

// ── Autograph Capsules ────────────────────────────────────────────────────────
// Modern era: 4 tiers per event (Contenders / Challengers / Legends / Champions).
// Stockholm 2021: 2 tiers (Finalists / Champions).
// Berlin 2019 & Katowice 2019: 3 tiers (Returning Challengers / Minor Challengers / Legends).
// Boston 2018 and earlier: team-specific autograph capsules (18–20 per event).

export const AUTOGRAPH_CAPSULES: OtherContainer[] = [

  // Budapest 2025 (IDs 447–450)
  { id: 'budapest-2025-contenders-autograph-capsule',  name: 'Budapest 2025 Contenders Autograph Capsule',  type: 'autograph-capsule', year: 2025, tournament: 'Budapest 2025', convarsId: 447 },
  { id: 'budapest-2025-challengers-autograph-capsule', name: 'Budapest 2025 Challengers Autograph Capsule', type: 'autograph-capsule', year: 2025, tournament: 'Budapest 2025', convarsId: 448 },
  { id: 'budapest-2025-legends-autograph-capsule',     name: 'Budapest 2025 Legends Autograph Capsule',     type: 'autograph-capsule', year: 2025, tournament: 'Budapest 2025', convarsId: 449 },
  { id: 'budapest-2025-champions-autograph-capsule',   name: 'Budapest 2025 Champions Autograph Capsule',   type: 'autograph-capsule', year: 2025, tournament: 'Budapest 2025', convarsId: 450 },

  // Austin 2025 (IDs 425–428 range)
  { id: 'austin-2025-contenders-autograph-capsule',    name: 'Austin 2025 Contenders Autograph Capsule',    type: 'autograph-capsule', year: 2025, tournament: 'Austin 2025', convarsId: 425 },
  { id: 'austin-2025-challengers-autograph-capsule',   name: 'Austin 2025 Challengers Autograph Capsule',   type: 'autograph-capsule', year: 2025, tournament: 'Austin 2025', convarsId: 426 },
  { id: 'austin-2025-legends-autograph-capsule',       name: 'Austin 2025 Legends Autograph Capsule',       type: 'autograph-capsule', year: 2025, tournament: 'Austin 2025', convarsId: 427 },
  { id: 'austin-2025-champions-autograph-capsule',     name: 'Austin 2025 Champions Autograph Capsule',     type: 'autograph-capsule', year: 2025, tournament: 'Austin 2025', convarsId: 428 },

  // Shanghai 2024
  { id: 'shanghai-2024-contenders-autograph-capsule',  name: 'Shanghai 2024 Contenders Autograph Capsule',  type: 'autograph-capsule', year: 2024, tournament: 'Shanghai 2024' },
  { id: 'shanghai-2024-challengers-autograph-capsule', name: 'Shanghai 2024 Challengers Autograph Capsule', type: 'autograph-capsule', year: 2024, tournament: 'Shanghai 2024' },
  { id: 'shanghai-2024-legends-autograph-capsule',     name: 'Shanghai 2024 Legends Autograph Capsule',     type: 'autograph-capsule', year: 2024, tournament: 'Shanghai 2024' },
  { id: 'shanghai-2024-champions-autograph-capsule',   name: 'Shanghai 2024 Champions Autograph Capsule',   type: 'autograph-capsule', year: 2024, tournament: 'Shanghai 2024' },

  // Copenhagen 2024 — Champions capsule has its own ID (414)
  { id: 'copenhagen-2024-contenders-autograph-capsule',  name: 'Copenhagen 2024 Contenders Autograph Capsule',  type: 'autograph-capsule', year: 2024, tournament: 'Copenhagen 2024' },
  { id: 'copenhagen-2024-challengers-autograph-capsule', name: 'Copenhagen 2024 Challengers Autograph Capsule', type: 'autograph-capsule', year: 2024, tournament: 'Copenhagen 2024' },
  { id: 'copenhagen-2024-legends-autograph-capsule',     name: 'Copenhagen 2024 Legends Autograph Capsule',     type: 'autograph-capsule', year: 2024, tournament: 'Copenhagen 2024' },
  { id: 'copenhagen-2024-champions-autograph-capsule',   name: 'Copenhagen 2024 Champions Autograph Capsule',   type: 'autograph-capsule', year: 2024, tournament: 'Copenhagen 2024', convarsId: 414 },

  // Paris 2023
  { id: 'paris-2023-contenders-autograph-capsule',  name: 'Paris 2023 Contenders Autograph Capsule',  type: 'autograph-capsule', year: 2023, tournament: 'Paris 2023' },
  { id: 'paris-2023-challengers-autograph-capsule', name: 'Paris 2023 Challengers Autograph Capsule', type: 'autograph-capsule', year: 2023, tournament: 'Paris 2023' },
  { id: 'paris-2023-legends-autograph-capsule',     name: 'Paris 2023 Legends Autograph Capsule',     type: 'autograph-capsule', year: 2023, tournament: 'Paris 2023' },
  { id: 'paris-2023-champions-autograph-capsule',   name: 'Paris 2023 Champions Autograph Capsule',   type: 'autograph-capsule', year: 2023, tournament: 'Paris 2023' },

  // Rio 2022
  { id: 'rio-2022-contenders-autograph-capsule',  name: 'Rio 2022 Contenders Autograph Capsule',  type: 'autograph-capsule', year: 2022, tournament: 'Rio 2022' },
  { id: 'rio-2022-challengers-autograph-capsule', name: 'Rio 2022 Challengers Autograph Capsule', type: 'autograph-capsule', year: 2022, tournament: 'Rio 2022' },
  { id: 'rio-2022-legends-autograph-capsule',     name: 'Rio 2022 Legends Autograph Capsule',     type: 'autograph-capsule', year: 2022, tournament: 'Rio 2022' },
  { id: 'rio-2022-champions-autograph-capsule',   name: 'Rio 2022 Champions Autograph Capsule',   type: 'autograph-capsule', year: 2022, tournament: 'Rio 2022' },

  // Antwerp 2022
  { id: 'antwerp-2022-contenders-autograph-capsule',  name: 'Antwerp 2022 Contenders Autograph Capsule',  type: 'autograph-capsule', year: 2022, tournament: 'Antwerp 2022' },
  { id: 'antwerp-2022-challengers-autograph-capsule', name: 'Antwerp 2022 Challengers Autograph Capsule', type: 'autograph-capsule', year: 2022, tournament: 'Antwerp 2022' },
  { id: 'antwerp-2022-legends-autograph-capsule',     name: 'Antwerp 2022 Legends Autograph Capsule',     type: 'autograph-capsule', year: 2022, tournament: 'Antwerp 2022' },
  { id: 'antwerp-2022-champions-autograph-capsule',   name: 'Antwerp 2022 Champions Autograph Capsule',   type: 'autograph-capsule', year: 2022, tournament: 'Antwerp 2022' },

  // Stockholm 2021 (2 tiers only)
  { id: 'stockholm-2021-finalists-autograph-capsule', name: 'Stockholm 2021 Finalists Autograph Capsule', type: 'autograph-capsule', year: 2021, tournament: 'Stockholm 2021' },
  { id: 'stockholm-2021-champions-autograph-capsule', name: 'Stockholm 2021 Champions Autograph Capsule', type: 'autograph-capsule', year: 2021, tournament: 'Stockholm 2021' },

  // Berlin 2019 (3 tiers)
  { id: 'berlin-2019-returning-challengers-autograph-capsule', name: 'Berlin 2019 Returning Challengers Autograph Capsule', type: 'autograph-capsule', year: 2019, tournament: 'Berlin 2019' },
  { id: 'berlin-2019-minor-challengers-autograph-capsule',     name: 'Berlin 2019 Minor Challengers Autograph Capsule',     type: 'autograph-capsule', year: 2019, tournament: 'Berlin 2019' },
  { id: 'berlin-2019-legends-autograph-capsule',               name: 'Berlin 2019 Legends Autograph Capsule',               type: 'autograph-capsule', year: 2019, tournament: 'Berlin 2019' },

  // Katowice 2019 (3 tiers)
  { id: 'katowice-2019-returning-challengers-autograph-capsule', name: 'Katowice 2019 Returning Challengers Autograph Capsule', type: 'autograph-capsule', year: 2019, tournament: 'Katowice 2019' },
  { id: 'katowice-2019-minor-challengers-autograph-capsule',     name: 'Katowice 2019 Minor Challengers Autograph Capsule',     type: 'autograph-capsule', year: 2019, tournament: 'Katowice 2019' },
  { id: 'katowice-2019-legends-autograph-capsule',               name: 'Katowice 2019 Legends Autograph Capsule',               type: 'autograph-capsule', year: 2019, tournament: 'Katowice 2019' },

  // London 2018 (3 tiers)
  { id: 'london-2018-returning-challengers-autograph-capsule', name: 'London 2018 Returning Challengers Autograph Capsule', type: 'autograph-capsule', year: 2018, tournament: 'London 2018' },
  { id: 'london-2018-minor-challengers-autograph-capsule',     name: 'London 2018 Minor Challengers Autograph Capsule',     type: 'autograph-capsule', year: 2018, tournament: 'London 2018' },
  { id: 'london-2018-legends-autograph-capsule',               name: 'London 2018 Legends Autograph Capsule',               type: 'autograph-capsule', year: 2018, tournament: 'London 2018' },

  // Boston 2018 and earlier — team-specific autograph capsules (18–20 per event).
  // Listed as individual entries; convarsId omitted where not confirmed.
  // Boston 2018 teams: Astralis, Cloud9, FaZe, fnatic, G2, Gambit, mousesports,
  //   Na'Vi, Nip, North, QBF, SK, Space Soldiers, TyLoo, Vega, Virtus.pro
  { id: 'boston-2018-astralis-autograph-capsule',        name: 'Boston 2018 Astralis Autograph Capsule',        type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-cloud9-autograph-capsule',          name: 'Boston 2018 Cloud9 Autograph Capsule',          type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-faze-autograph-capsule',            name: 'Boston 2018 FaZe Autograph Capsule',            type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-fnatic-autograph-capsule',          name: 'Boston 2018 fnatic Autograph Capsule',          type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-g2-autograph-capsule',              name: 'Boston 2018 G2 Autograph Capsule',              type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-gambit-autograph-capsule',          name: 'Boston 2018 Gambit Autograph Capsule',          type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-mousesports-autograph-capsule',     name: 'Boston 2018 mousesports Autograph Capsule',     type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-navi-autograph-capsule',            name: "Boston 2018 Na'Vi Autograph Capsule",           type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-nip-autograph-capsule',             name: 'Boston 2018 NiP Autograph Capsule',             type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-north-autograph-capsule',           name: 'Boston 2018 North Autograph Capsule',           type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-qbf-autograph-capsule',             name: 'Boston 2018 QBF Autograph Capsule',             type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-sk-autograph-capsule',              name: 'Boston 2018 SK Autograph Capsule',              type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-space-soldiers-autograph-capsule',  name: 'Boston 2018 Space Soldiers Autograph Capsule',  type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-tyloo-autograph-capsule',           name: 'Boston 2018 TyLoo Autograph Capsule',           type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-vega-autograph-capsule',            name: 'Boston 2018 Vega Autograph Capsule',            type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },
  { id: 'boston-2018-virtus-pro-autograph-capsule',      name: 'Boston 2018 Virtus.pro Autograph Capsule',      type: 'autograph-capsule', year: 2018, tournament: 'Boston 2018' },

  // Krakow 2017
  { id: 'krakow-2017-astralis-autograph-capsule',       name: 'Krakow 2017 Astralis Autograph Capsule',       type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-big-autograph-capsule',            name: 'Krakow 2017 BIG Autograph Capsule',            type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-faze-autograph-capsule',           name: 'Krakow 2017 FaZe Autograph Capsule',           type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-fnatic-autograph-capsule',         name: 'Krakow 2017 fnatic Autograph Capsule',         type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-g2-autograph-capsule',             name: 'Krakow 2017 G2 Autograph Capsule',             type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-gambit-autograph-capsule',         name: 'Krakow 2017 Gambit Autograph Capsule',         type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-immortals-autograph-capsule',      name: 'Krakow 2017 Immortals Autograph Capsule',      type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-mousesports-autograph-capsule',    name: 'Krakow 2017 mousesports Autograph Capsule',    type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-navi-autograph-capsule',           name: "Krakow 2017 Na'Vi Autograph Capsule",          type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-nip-autograph-capsule',            name: 'Krakow 2017 NiP Autograph Capsule',            type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-north-autograph-capsule',          name: 'Krakow 2017 North Autograph Capsule',          type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-sk-autograph-capsule',             name: 'Krakow 2017 SK Autograph Capsule',             type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-space-soldiers-autograph-capsule', name: 'Krakow 2017 Space Soldiers Autograph Capsule', type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-tyloo-autograph-capsule',          name: 'Krakow 2017 TyLoo Autograph Capsule',          type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-vp-autograph-capsule',             name: 'Krakow 2017 Virtus.pro Autograph Capsule',     type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },
  { id: 'krakow-2017-vega-autograph-capsule',           name: 'Krakow 2017 Vega Squadron Autograph Capsule',  type: 'autograph-capsule', year: 2017, tournament: 'Krakow 2017' },

  // Atlanta 2017
  { id: 'atlanta-2017-astralis-autograph-capsule',      name: 'Atlanta 2017 Astralis Autograph Capsule',      type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-c9-autograph-capsule',            name: 'Atlanta 2017 Cloud9 Autograph Capsule',         type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-faze-autograph-capsule',          name: 'Atlanta 2017 FaZe Autograph Capsule',           type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-fnatic-autograph-capsule',        name: 'Atlanta 2017 fnatic Autograph Capsule',         type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-g2-autograph-capsule',            name: 'Atlanta 2017 G2 Autograph Capsule',             type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-gambit-autograph-capsule',        name: 'Atlanta 2017 Gambit Autograph Capsule',         type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-immortals-autograph-capsule',     name: 'Atlanta 2017 Immortals Autograph Capsule',      type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-navi-autograph-capsule',          name: "Atlanta 2017 Na'Vi Autograph Capsule",          type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-nip-autograph-capsule',           name: 'Atlanta 2017 NiP Autograph Capsule',            type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-sk-autograph-capsule',            name: 'Atlanta 2017 SK Autograph Capsule',             type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-tyloo-autograph-capsule',         name: 'Atlanta 2017 TyLoo Autograph Capsule',          type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-vp-autograph-capsule',            name: 'Atlanta 2017 Virtus.pro Autograph Capsule',     type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-north-autograph-capsule',         name: 'Atlanta 2017 North Autograph Capsule',          type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-mousesports-autograph-capsule',   name: 'Atlanta 2017 mousesports Autograph Capsule',    type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-optic-autograph-capsule',         name: 'Atlanta 2017 OpTic Gaming Autograph Capsule',   type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
  { id: 'atlanta-2017-liquid-autograph-capsule',        name: 'Atlanta 2017 Team Liquid Autograph Capsule',    type: 'autograph-capsule', year: 2017, tournament: 'Atlanta 2017' },
];

// ── Music Kit Boxes ───────────────────────────────────────────────────────────

export const MUSIC_KIT_BOXES: OtherContainer[] = [
  { id: 'stattrak-masterminds-2-music-kit-box', name: 'StatTrak Masterminds 2 Music Kit Box', type: 'music-kit', convarsId: 452 },
  { id: 'masterminds-2-music-kit-box',          name: 'Masterminds 2 Music Kit Box',          type: 'music-kit', convarsId: 451 },
  { id: 'stattrak-masterminds-music-kit-box',   name: 'StatTrak Masterminds Music Kit Box',   type: 'music-kit', convarsId: 442 },
  { id: 'masterminds-music-kit-box',            name: 'Masterminds Music Kit Box',            type: 'music-kit', convarsId: 441 },
  { id: 'stattrak-initiators-music-kit-box',    name: 'StatTrak Initiators Music Kit Box',    type: 'music-kit', convarsId: 397 },
  { id: 'initiators-music-kit-box',             name: 'Initiators Music Kit Box',             type: 'music-kit', convarsId: 396 },
  { id: 'stattrak-nightmode-music-kit-box',     name: 'StatTrak NIGHTMODE Music Kit Box',     type: 'music-kit', convarsId: 374 },
  { id: 'nightmode-music-kit-box',              name: 'NIGHTMODE Music Kit Box',              type: 'music-kit', convarsId: 373 },
  { id: 'stattrak-tacticians-music-kit-box',    name: 'StatTrak Tacticians Music Kit Box',    type: 'music-kit', convarsId: 326 },
  { id: 'tacticians-music-kit-box',             name: 'Tacticians Music Kit Box',             type: 'music-kit', convarsId: 325 },
  { id: 'stattrak-radicals-music-kit-box',      name: 'StatTrak Radicals Music Kit Box',      type: 'music-kit', convarsId: 310 },
  { id: 'stattrak-deluge-music-kit-box',        name: 'StatTrak Deluge Music Kit Box',        type: 'music-kit', convarsId: 316 },
  { id: 'deluge-music-kit-box',                 name: 'Deluge Music Kit Box',                 type: 'music-kit', convarsId: 315 },
];

// ── Query Helpers ─────────────────────────────────────────────────────────────

/** Returns all souvenir packages. */
export function getSouvenirPackages(): SouvenirPackageData[] {
  return SOUVENIR_PACKAGES;
}

/** Returns souvenir packages for a specific tournament name. */
export function getSouvenirsByTournament(tournament: string): SouvenirPackageData[] {
  return SOUVENIR_PACKAGES.filter(p => p.tournament === tournament);
}

/**
 * Returns the map collection name for a given souvenir package.
 * Convenience wrapper — same as accessing `pkg.collection` directly,
 * but useful when you only have the package object at hand.
 */
export function getCollectionForSouvenir(pkg: SouvenirPackageData): string {
  return pkg.collection;
}

/**
 * Returns every container across all types in a single flat array.
 * Souvenir packages are cast to OtherContainer shape for uniformity.
 */
export function getAllContainers(): OtherContainer[] {
  const souvenirs: OtherContainer[] = SOUVENIR_PACKAGES.map(p => ({
    id: p.id,
    name: p.name,
    type: 'souvenir' as ContainerType,
    year: p.year,
    tournament: p.tournament,
    convarsId: p.convarsId,
  }));

  return [
    ...souvenirs,
    ...STICKER_CAPSULES,
    ...AUTOGRAPH_CAPSULES,
    ...MUSIC_KIT_BOXES,
  ];
}

/** Returns all containers of a specific type. */
export function getContainersByType(type: ContainerType): OtherContainer[] {
  return getAllContainers().filter(c => c.type === type);
}

/** Returns a souvenir package by its slug id. */
export function getSouvenirById(id: string): SouvenirPackageData | undefined {
  return SOUVENIR_PACKAGES.find(p => p.id === id);
}

/** Returns all unique tournament names that have souvenir packages. */
export function getSouvenirTournaments(): string[] {
  const seen = new Set<string>();
  return SOUVENIR_PACKAGES.map(p => p.tournament).filter(t => {
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}
