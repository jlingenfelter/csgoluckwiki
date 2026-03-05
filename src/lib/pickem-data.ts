import stickersJson from './stickers-data.json';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface PickemTeam {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  region: 'EU' | 'CIS' | 'NA' | 'SA' | 'MENA' | 'Asia' | 'INT';
}

export interface PickemStage {
  id: string;
  name: string;
  type: 'swiss' | 'bracket';
  status: 'locked' | 'open' | 'completed';
  teamIds: string[];
  results: Record<string, any>;
}

export interface PickemTournament {
  id: string;
  name: string;
  location: string;
  dates: { start: string; end: string };
  status: 'upcoming' | 'active' | 'completed';
  teams: PickemTeam[];
  stages: PickemStage[];
}

export interface PickemChallenge {
  id: string;
  description: string;
  check: (picks: Record<string, any>, results: Record<string, any>) => boolean;
}

// ---------------------------------------------------------------------------
// Sticker logo helper
// ---------------------------------------------------------------------------

const stickers = (stickersJson as any).stickers as Array<{
  slug: string;
  name: string;
  image: string;
  variant: string;
  tournament: string;
  team: string;
  type: string;
}>;

/**
 * Look up the Paper-variant team sticker image for a given team and
 * tournament. Paper stickers have `variant === "Paper"` and their `name`
 * follows the pattern `"TeamName | Tournament"` (no variant suffix).
 *
 * Returns an empty string when no matching sticker is found.
 */
export function getTeamLogo(teamName: string, tournament: string): string {
  const match = stickers.find(
    (s) =>
      s.variant === 'Paper' &&
      s.tournament === tournament &&
      s.team === teamName
  );
  return match?.image ?? '';
}

// ---------------------------------------------------------------------------
// Short-name mapping
// ---------------------------------------------------------------------------

const SHORT_NAMES: Record<string, string> = {
  'Natus Vincere': 'NAVI',
  'Team Spirit': 'Spirit',
  'Team Liquid': 'Liquid',
  'Ninjas in Pyjamas': 'NIP',
  'GamerLegion': 'GL',
  'Imperial Esports': 'Imperial',
  'FaZe Clan': 'FaZe',
  'G2 esports': 'G2',
  'paiN Gaming': 'paiN',
  'The Mongolz': 'Mongolz',
  'RED Canids': 'RED',
  'The Huns': 'Huns',
  'Lynn Vision': 'LV',
  'Passion UA': 'PUA',
  'Rare Atom': 'RA',
};

function shortName(name: string): string {
  return SHORT_NAMES[name] ?? name;
}

// ---------------------------------------------------------------------------
// Team definitions – Budapest 2025
// ---------------------------------------------------------------------------

const TOURNAMENT_NAME = 'Budapest 2025';

interface TeamDef {
  id: string;
  name: string;
  region: PickemTeam['region'];
}

const TEAM_DEFS: TeamDef[] = [
  // EU
  { id: 'mouz', name: 'MOUZ', region: 'EU' },
  { id: 'astralis', name: 'Astralis', region: 'EU' },
  { id: 'fnatic', name: 'fnatic', region: 'EU' },
  { id: 'gamerlegion', name: 'GamerLegion', region: 'EU' },
  { id: 'ninjas-in-pyjamas', name: 'Ninjas in Pyjamas', region: 'EU' },
  { id: '3dmax', name: '3DMAX', region: 'EU' },
  { id: 'aurora', name: 'Aurora', region: 'EU' },
  { id: 'parivision', name: 'PARIVISION', region: 'EU' },
  { id: 'b8', name: 'B8', region: 'EU' },
  { id: 'passion-ua', name: 'Passion UA', region: 'EU' },

  // CIS
  { id: 'team-spirit', name: 'Team Spirit', region: 'CIS' },
  { id: 'natus-vincere', name: 'Natus Vincere', region: 'CIS' },

  // NA
  { id: 'team-liquid', name: 'Team Liquid', region: 'NA' },
  { id: 'nrg', name: 'NRG', region: 'NA' },
  { id: 'm80', name: 'M80', region: 'NA' },
  { id: 'flyquest', name: 'FlyQuest', region: 'NA' },

  // SA
  { id: 'furia', name: 'FURIA', region: 'SA' },
  { id: 'pain-gaming', name: 'paiN Gaming', region: 'SA' },
  { id: 'imperial-esports', name: 'Imperial Esports', region: 'SA' },
  { id: 'legacy', name: 'Legacy', region: 'SA' },
  { id: 'fluxo', name: 'Fluxo', region: 'SA' },
  { id: 'red-canids', name: 'RED Canids', region: 'SA' },
  { id: 'mibr', name: 'MIBR', region: 'SA' },

  // MENA
  { id: 'falcons', name: 'Falcons', region: 'MENA' },

  // Asia
  { id: 'the-mongolz', name: 'The Mongolz', region: 'Asia' },
  { id: 'tyloo', name: 'TYLOO', region: 'Asia' },
  { id: 'lynn-vision', name: 'Lynn Vision', region: 'Asia' },
  { id: 'rare-atom', name: 'Rare Atom', region: 'Asia' },
  { id: 'the-huns', name: 'The Huns', region: 'Asia' },
  { id: '910', name: '910', region: 'Asia' },
  { id: 'aw', name: 'AW', region: 'Asia' },

  // INT (international rosters)
  { id: 'vitality', name: 'Vitality', region: 'INT' },
  { id: 'faze-clan', name: 'FaZe Clan', region: 'INT' },
  { id: 'g2-esports', name: 'G2 esports', region: 'INT' },
];

/**
 * Build a PickemTeam from a TeamDef, resolving the logo from the sticker
 * data at module-load time.
 */
function buildTeam(def: TeamDef): PickemTeam {
  return {
    id: def.id,
    name: def.name,
    shortName: shortName(def.name),
    logo: getTeamLogo(def.name, TOURNAMENT_NAME),
    region: def.region,
  };
}

const BUDAPEST_TEAMS: PickemTeam[] = TEAM_DEFS.map(buildTeam);

// ---------------------------------------------------------------------------
// Stages
// ---------------------------------------------------------------------------

const BUDAPEST_STAGES: PickemStage[] = [
  {
    id: 'opening-stage',
    name: 'Opening Stage',
    type: 'swiss',
    status: 'open',
    teamIds: [
      '3dmax',
      'legacy',
      'b8',
      'lynn-vision',
      'passion-ua',
      'parivision',
      'aurora',
      'fluxo',
      'rare-atom',
      'the-huns',
      'red-canids',
      '910',
      'aw',
      'tyloo',
      'mibr',
      'pain-gaming',
    ],
    results: {},
  },
  {
    id: 'elimination-stage',
    name: 'Elimination Stage',
    type: 'swiss',
    status: 'open',
    teamIds: [
      'team-spirit',
      'vitality',
      'mouz',
      'faze-clan',
      'furia',
      'natus-vincere',
      'astralis',
      'falcons',
      'the-mongolz',
      'g2-esports',
      'team-liquid',
      'fnatic',
      'ninjas-in-pyjamas',
      'gamerlegion',
      'flyquest',
      'nrg',
    ],
    results: {},
  },
  {
    id: 'advancement-stage',
    name: 'Advancement Stage',
    type: 'swiss',
    status: 'open',
    teamIds: [],
    results: {},
  },
  {
    id: 'playoffs',
    name: 'Playoffs',
    type: 'bracket',
    status: 'open',
    teamIds: [],
    results: {},
  },
];

// ---------------------------------------------------------------------------
// Tournament
// ---------------------------------------------------------------------------

export const TOURNAMENTS: PickemTournament[] = [
  {
    id: 'budapest-2025',
    name: 'PGL Major Budapest 2025',
    location: 'Budapest, Hungary',
    dates: { start: '2025-09-28', end: '2025-10-19' },
    status: 'active',
    teams: BUDAPEST_TEAMS,
    stages: BUDAPEST_STAGES,
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getTournament(id: string): PickemTournament | undefined {
  return TOURNAMENTS.find((t) => t.id === id);
}

export function getTeamById(
  tournamentId: string,
  teamId: string,
): PickemTeam | undefined {
  const tournament = getTournament(tournamentId);
  return tournament?.teams.find((t) => t.id === teamId);
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export const CHALLENGES: PickemChallenge[] = [
  {
    id: 'opening-3-0',
    description: 'Correctly predict a team that goes 3-0 in the Opening Stage',
    check: (picks, results) =>
      picks['opening-3-0'] !== undefined &&
      picks['opening-3-0'] === results['opening-3-0'],
  },
  {
    id: 'opening-0-3',
    description: 'Correctly predict a team that goes 0-3 in the Opening Stage',
    check: (picks, results) =>
      picks['opening-0-3'] !== undefined &&
      picks['opening-0-3'] === results['opening-0-3'],
  },
  {
    id: 'opening-advance',
    description:
      'Correctly predict 5 or more teams that advance from the Opening Stage',
    check: (picks, results) => {
      const pickSet: string[] = picks['opening-advance'] ?? [];
      const resultSet: string[] = results['opening-advance'] ?? [];
      const correct = pickSet.filter((t: string) => resultSet.includes(t));
      return correct.length >= 5;
    },
  },
  {
    id: 'elimination-3-0',
    description:
      'Correctly predict a team that goes 3-0 in the Elimination Stage',
    check: (picks, results) =>
      picks['elimination-3-0'] !== undefined &&
      picks['elimination-3-0'] === results['elimination-3-0'],
  },
  {
    id: 'elimination-0-3',
    description:
      'Correctly predict a team that goes 0-3 in the Elimination Stage',
    check: (picks, results) =>
      picks['elimination-0-3'] !== undefined &&
      picks['elimination-0-3'] === results['elimination-0-3'],
  },
  {
    id: 'elimination-advance',
    description:
      'Correctly predict 5 or more teams that advance from the Elimination Stage',
    check: (picks, results) => {
      const pickSet: string[] = picks['elimination-advance'] ?? [];
      const resultSet: string[] = results['elimination-advance'] ?? [];
      const correct = pickSet.filter((t: string) => resultSet.includes(t));
      return correct.length >= 5;
    },
  },
  {
    id: 'advancement-advance',
    description:
      'Correctly predict 5 or more teams that advance from the Advancement Stage',
    check: (picks, results) => {
      const pickSet: string[] = picks['advancement-advance'] ?? [];
      const resultSet: string[] = results['advancement-advance'] ?? [];
      const correct = pickSet.filter((t: string) => resultSet.includes(t));
      return correct.length >= 5;
    },
  },
  {
    id: 'playoff-semifinalists',
    description: 'Correctly predict 2 or more playoff semifinalists',
    check: (picks, results) => {
      const pickSet: string[] = picks['playoff-semifinalists'] ?? [];
      const resultSet: string[] = results['playoff-semifinalists'] ?? [];
      const correct = pickSet.filter((t: string) => resultSet.includes(t));
      return correct.length >= 2;
    },
  },
  {
    id: 'playoff-finalists',
    description: 'Correctly predict at least 1 playoff finalist',
    check: (picks, results) => {
      const pickSet: string[] = picks['playoff-finalists'] ?? [];
      const resultSet: string[] = results['playoff-finalists'] ?? [];
      const correct = pickSet.filter((t: string) => resultSet.includes(t));
      return correct.length >= 1;
    },
  },
  {
    id: 'playoff-champion',
    description: 'Correctly predict the tournament champion',
    check: (picks, results) =>
      picks['playoff-champion'] !== undefined &&
      picks['playoff-champion'] === results['playoff-champion'],
  },
  {
    id: 'perfect-pickem',
    description: 'Earn all 10 challenge points (complete every challenge)',
    check: (picks, results) => {
      // Relies on all other challenges passing — run each individually
      const others = CHALLENGES.filter((c) => c.id !== 'perfect-pickem');
      return others.every((c) => c.check(picks, results));
    },
  },
];
