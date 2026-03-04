import agentImagesRaw from './agent-images.json';

const agentImages: Record<string, string> = agentImagesRaw as Record<string, string>;

export interface Agent {
  name: string;
  faction: string;
  operation: string;
  tier: string;
  side: 'CT' | 'T';
  slug: string;
  image: string | null;
}

function slugify(name: string, faction: string): string {
  return `${name}-${faction}`.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getAgentImage(name: string, faction: string): string | null {
  const n = name.toLowerCase().trim();
  const f = faction.toLowerCase().trim();
  return agentImages[`${n} | ${f}`] || agentImages[`${n}|${f}`] || agentImages[n] || null;
}

const ctAgentsRaw = [
  { name: "Cmdr. Frank 'Wet Sox' Baroud", faction: 'SEAL Frogman', operation: 'Shattered Web', tier: 'Elite' },
  { name: "Cmdr. Davida 'Goggles' Fernandez", faction: 'SEAL Frogman', operation: 'Broken Fang', tier: 'Elite' },
  { name: 'Lieutenant Rex Krikey', faction: 'SEAL Frogman', operation: 'Riptide', tier: 'Superior' },
  { name: 'Seal Team 6 Soldier', faction: 'NSWC SEAL', operation: 'Broken Fang', tier: 'Exceptional' },
  { name: 'Buckshot', faction: 'NSWC SEAL', operation: 'Shattered Web', tier: 'Superior' },
  { name: "'Blueberries' Buckshot", faction: 'NSWC SEAL', operation: 'Riptide', tier: 'Elite' },
  { name: 'Lt. Commander Ricksaw', faction: 'NSWC SEAL', operation: 'Broken Fang', tier: 'Elite' },
  { name: 'Special Agent Ava', faction: 'FBI', operation: 'Shattered Web', tier: 'Elite' },
  { name: 'Operator', faction: 'FBI SWAT', operation: 'Broken Fang', tier: 'Superior' },
  { name: 'Michael Syfers ', faction: 'FBI Sniper', operation: 'Shattered Web', tier: 'Exceptional' },
  { name: 'Markus Delrow', faction: 'FBI HRT', operation: 'Riptide', tier: 'Superior' },
  { name: '3rd Commando Company', faction: 'KSK', operation: 'Shattered Web', tier: 'Exceptional' },
  { name: "Cmdr. Mae 'Dead Cold' Jamison", faction: 'SWAT', operation: 'Broken Fang', tier: 'Elite' },
  { name: 'Chem-Haz Specialist', faction: 'SWAT', operation: 'Shattered Web', tier: 'Exceptional' },
  { name: 'Bio-Haz Specialist', faction: 'SWAT', operation: 'Broken Fang', tier: 'Superior' },
  { name: '1st Lieutenant Farlow', faction: 'SWAT', operation: 'Riptide', tier: 'Exceptional' },
  { name: "Lieutenant 'Tree Hugger' Farlow", faction: 'SWAT', operation: 'Riptide', tier: 'Superior' },
  { name: 'Sergeant Bombson', faction: 'SWAT', operation: 'Riptide', tier: 'Distinguished' },
  { name: "John 'Van Healen' Kask", faction: 'SWAT', operation: 'Broken Fang', tier: 'Distinguished' },
  { name: 'B Squadron Officer', faction: 'SAS', operation: 'Shattered Web', tier: 'Exceptional' },
  { name: 'D Squadron Officer', faction: 'NZSAS', operation: 'Broken Fang', tier: 'Superior' },
  { name: "'Two Times' McCoy", faction: 'USAF TACP', operation: 'Shattered Web', tier: 'Elite' },
];

const tAgentsRaw = [
  { name: 'Dragomir', faction: 'Sabre', operation: 'Shattered Web', tier: 'Superior' },
  { name: 'Dragomir', faction: 'Sabre Footsoldier', operation: 'Broken Fang', tier: 'Exceptional' },
  { name: 'Maximus', faction: 'Sabre', operation: 'Riptide', tier: 'Distinguished' },
  { name: 'Blackwolf', faction: 'Sabre', operation: 'Shattered Web', tier: 'Elite' },
  { name: 'Rezan the Redshirt', faction: 'Sabre', operation: 'Broken Fang', tier: 'Superior' },
  { name: 'Rezan The Ready', faction: 'Sabre', operation: 'Riptide', tier: 'Exceptional' },
  { name: "'The Doctor' Romanov", faction: 'Sabre', operation: 'Broken Fang', tier: 'Elite' },
  { name: 'Vypa Sista of the Revolution', faction: 'Guerrilla Warfare', operation: 'Riptide', tier: 'Elite' },
  { name: 'Trapper', faction: 'Guerrilla Warfare', operation: 'Shattered Web', tier: 'Exceptional' },
  { name: 'Trapper Aggressor', faction: 'Guerrilla Warfare', operation: 'Broken Fang', tier: 'Superior' },
  { name: 'Elite Trapper Solman', faction: 'Guerrilla Warfare', operation: 'Riptide', tier: 'Elite' },
  { name: 'Crasswater The Forgotten', faction: 'Guerrilla Warfare', operation: 'Shattered Web', tier: 'Superior' },
  { name: "'Medium Rare' Crasswater", faction: 'Guerrilla Warfare', operation: 'Riptide', tier: 'Elite' },
  { name: 'Arno The Overgrown', faction: 'Guerrilla Warfare', operation: 'Broken Fang', tier: 'Exceptional' },
  { name: 'Col. Mangos Dabisi', faction: 'Guerrilla Warfare', operation: 'Riptide', tier: 'Superior' },
  { name: 'Soldier', faction: 'Phoenix', operation: 'Broken Fang', tier: 'Superior' },
  { name: 'Slingshot', faction: 'Phoenix', operation: 'Shattered Web', tier: 'Exceptional' },
  { name: 'Enforcer', faction: 'Phoenix', operation: 'Broken Fang', tier: 'Distinguished' },
  { name: 'Street Soldier', faction: 'Phoenix', operation: 'Riptide', tier: 'Exceptional' },
  { name: 'Ground Rebel ', faction: 'Elite Crew', operation: 'Shattered Web', tier: 'Elite' },
  { name: 'The Elite Mr. Muhlik', faction: 'Elite Crew', operation: 'Broken Fang', tier: 'Elite' },
  { name: 'Jungle Rebel', faction: 'Elite Crew', operation: 'Riptide', tier: 'Exceptional' },
  { name: 'Osiris', faction: 'Elite Crew', operation: 'Broken Fang', tier: 'Superior' },
  { name: 'Prof. Shahmat', faction: 'Elite Crew', operation: 'Riptide', tier: 'Elite' },
  { name: 'Sir Bloody Darryl Royale', faction: 'The Professionals', operation: 'Shattered Web', tier: 'Elite' },
  { name: 'Sir Bloody Skullhead Darryl', faction: 'The Professionals', operation: 'Shattered Web', tier: 'Elite' },
  { name: 'Sir Bloody Miami Darryl', faction: 'The Professionals', operation: 'Broken Fang', tier: 'Elite' },
  { name: 'Sir Bloody Loudmouth Darryl', faction: 'The Professionals', operation: 'Riptide', tier: 'Elite' },
  { name: 'Sir Bloody Silent Darryl', faction: 'The Professionals', operation: 'Riptide', tier: 'Elite' },
  { name: 'Bloody Darryl The Strapped', faction: 'The Professionals', operation: 'Broken Fang', tier: 'Superior' },
  { name: 'Getaway Sally', faction: 'The Professionals', operation: 'Broken Fang', tier: 'Superior' },
  { name: 'Number K', faction: 'The Professionals', operation: 'Shattered Web', tier: 'Exceptional' },
  { name: 'Little Kev', faction: 'The Professionals', operation: 'Riptide', tier: 'Distinguished' },
  { name: 'Safecracker Voltzmann', faction: 'The Professionals', operation: 'Broken Fang', tier: 'Exceptional' },
];

function buildAgents(raw: typeof ctAgentsRaw, side: 'CT' | 'T'): Agent[] {
  return raw.map(a => ({
    ...a,
    side,
    slug: slugify(a.name, a.faction),
    image: getAgentImage(a.name, a.faction),
  }));
}

export const CT_AGENTS = buildAgents(ctAgentsRaw, 'CT');
export const T_AGENTS = buildAgents(tAgentsRaw, 'T');
export const ALL_AGENTS = [...CT_AGENTS, ...T_AGENTS];

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'Elite': return '#a855f7';
    case 'Superior': return '#e4ae39';
    case 'Exceptional': return '#2ecc71';
    case 'Distinguished': return '#60a5fa';
    default: return 'var(--text2)';
  }
}
