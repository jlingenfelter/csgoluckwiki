export interface Weapon {
  slug: string;
  name: string;
  category: 'rifle' | 'smg' | 'pistol' | 'heavy' | 'knife' | 'glove' | 'grenade';
  subcategory?: string;
  team: 'ct' | 't' | 'both';
  cosmetic?: boolean;
  price: number;
  killReward: number;
  damage: number;
  armorPen: number;
  rpm: number;
  magSize: number;
  reserveAmmo: number;
  reloadTime: number;
  moveSpeed: number;
  rangeModifier: number;
  penetration: number;
  headshotMult: number;
  description: string;
  tips: string[];
  tags: string[];
}

// Steam CDN weapon render images (slug → internal weapon name)
const WEAPON_IMAGE_MAP: Record<string, string> = {
  'ak-47': 'weapon_ak47',
  'm4a4': 'weapon_m4a1',
  'm4a1-s': 'weapon_m4a1_silencer',
  'awp': 'weapon_awp',
  'ssg-08': 'weapon_ssg08',
  'galil-ar': 'weapon_galilar',
  'famas': 'weapon_famas',
  'aug': 'weapon_aug',
  'sg-553': 'weapon_sg556',
  'scar-20': 'weapon_scar20',
  'g3sg1': 'weapon_g3sg1',
  'mac-10': 'weapon_mac10',
  'mp9': 'weapon_mp9',
  'mp7': 'weapon_mp7',
  'ump-45': 'weapon_ump45',
  'p90': 'weapon_p90',
  'mp5-sd': 'weapon_mp5sd',
  'pp-bizon': 'weapon_bizon',
  'glock-18': 'weapon_glock',
  'usp-s': 'weapon_usp_silencer',
  'p2000': 'weapon_hkp2000',
  'p250': 'weapon_p250',
  'five-seven': 'weapon_fiveseven',
  'tec-9': 'weapon_tec9',
  'cz75-auto': 'weapon_cz75a',
  'desert-eagle': 'weapon_deagle',
  'dual-berettas': 'weapon_elite',
  'r8-revolver': 'weapon_revolver',
  'nova': 'weapon_nova',
  'xm1014': 'weapon_xm1014',
  'mag-7': 'weapon_mag7',
  'sawed-off': 'weapon_sawedoff',
  'm249': 'weapon_m249',
  'negev': 'weapon_negev',
  'he-grenade': 'weapon_hegrenade',
  'smoke-grenade': 'weapon_smokegrenade',
  'flashbang': 'weapon_flashbang',
  'molotov': 'weapon_molotov',
  'incendiary-grenade': 'weapon_incgrenade',
  'decoy-grenade': 'weapon_decoy',
};

export function getWeaponImage(slug: string): string | null {
  const name = WEAPON_IMAGE_MAP[slug];
  if (!name) return null;
  return `https://steamcdn-a.akamaihd.net/apps/730/icons/econ/weapons/base_weapons/${name}.png`;
}

export const WEAPON_CATEGORIES = [
  { slug: 'rifle', name: 'Rifles', icon: '🔫', description: 'Assault rifles and scoped marksman weapons that form the core of every competitive loadout.' },
  { slug: 'smg', name: 'SMGs', icon: '🔧', description: 'Budget-friendly automatic firearms with rapid fire rates, perfect for anti-eco setups and tight quarters.' },
  { slug: 'pistol', name: 'Pistols', icon: '🔫', description: 'Secondary weapons from the default Glock-18 and USP-S up to the hard-hitting Desert Eagle.' },
  { slug: 'heavy', name: 'Heavy', icon: '🛡️', description: 'Shotguns and light machine guns built for niche roles and short-range defensive holds.' },
  { slug: 'grenade', name: 'Grenades', icon: '💥', description: 'Tactical throwables — smokes, flashbangs, incendiaries, and HE rounds. The foundation of coordinated play.' },
  { slug: 'knife', name: 'Knives', icon: '🔪', description: 'Collectible knife finishes available in CS2. Every knife performs identically — these are purely aesthetic items.' },
  { slug: 'glove', name: 'Gloves', icon: '🧤', description: 'Wearable glove skins in CS2. Gloves are cosmetic-only accessories that alter your in-game hand model.' },
];

export const WEAPONS: Weapon[] = [
  // ═══════════════════════════════════════
  // RIFLES
  // ═══════════════════════════════════════
  {
    slug: 'ak-47', name: 'AK-47', category: 'rifle', subcategory: 'Assault Rifle',
    team: 't', price: 2700, killReward: 300, damage: 36, armorPen: 77.5,
    rpm: 600, magSize: 30, reserveAmmo: 90, reloadTime: 2.5, moveSpeed: 215,
    rangeModifier: 0.98, penetration: 2, headshotMult: 4,
    description: 'The iconic T-side rifle. One-shot headshot kill against helmeted opponents. High damage but challenging recoil pattern requiring dedicated practice.',
    tips: ['First 4 bullets: pull down smoothly', 'One-tap at long range, spray at close range', 'The go-to buy rifle for T-side — dominates at all ranges', 'Learn the first 10 bullets of the spray pattern for consistency'],
    tags: ['one-tap', 't-side', 'high-damage', 'spray-pattern'],
  },
  {
    slug: 'm4a4', name: 'M4A4', category: 'rifle', subcategory: 'Assault Rifle',
    team: 'ct', price: 3100, killReward: 300, damage: 33, armorPen: 70,
    rpm: 666, magSize: 30, reserveAmmo: 90, reloadTime: 3.07, moveSpeed: 225,
    rangeModifier: 0.97, penetration: 2, headshotMult: 4,
    description: 'The standard CT-side rifle. Reliable 30-round magazine, good fire rate, but cannot one-shot headshot against helmets. Choose between M4A4 and M4A1-S.',
    tips: ['Spray is more forgiving than AK-47', 'Aim for the head — dink + body shot kills fast', '30-round mag gives you more room for spray transfers', 'Better for holding angles against multiple enemies'],
    tags: ['ct-side', 'reliable', 'spray-transfer'],
  },
  {
    slug: 'm4a1-s', name: 'M4A1-S', category: 'rifle', subcategory: 'Assault Rifle',
    team: 'ct', price: 2900, killReward: 300, damage: 38, armorPen: 70,
    rpm: 600, magSize: 20, reserveAmmo: 80, reloadTime: 3.07, moveSpeed: 225,
    rangeModifier: 0.99, penetration: 2, headshotMult: 4,
    description: 'The silenced CT-side alternative. Higher damage per bullet and a tighter spray pattern than M4A4, but only 20 rounds per magazine. Silenced shots hide your tracers.',
    tips: ['Silencer hides tracers and muffles sound', 'Better first-shot accuracy than M4A4', '20 rounds — reload more frequently', 'Excellent for holding long-range angles'],
    tags: ['ct-side', 'silenced', 'accurate', 'low-mag'],
  },
  {
    slug: 'awp', name: 'AWP', category: 'rifle', subcategory: 'Sniper Rifle',
    team: 'both', price: 4750, killReward: 100, damage: 115, armorPen: 97.5,
    rpm: 41, magSize: 5, reserveAmmo: 30, reloadTime: 3.67, moveSpeed: 200,
    rangeModifier: 0.99, penetration: 3, headshotMult: 4,
    description: 'The most iconic weapon in Counter-Strike. One-shot kill to the body and head at any range. Extremely expensive and devastating in skilled hands.',
    tips: ['Hold angles — dont re-peek the same angle twice', 'Quick-scope for faster shots', '$100 kill reward means you need to be efficient', 'Save it if you can — $4750 is a big investment'],
    tags: ['sniper', 'one-shot', 'expensive', 'high-skill'],
  },
  {
    slug: 'ssg-08', name: 'SSG 08 (Scout)', category: 'rifle', subcategory: 'Sniper Rifle',
    team: 'both', price: 1700, killReward: 300, damage: 88, armorPen: 85,
    rpm: 48, magSize: 10, reserveAmmo: 90, reloadTime: 3.67, moveSpeed: 230,
    rangeModifier: 0.98, penetration: 2, headshotMult: 4,
    description: 'Budget sniper rifle. One-shot headshot kill against helmeted opponents. High mobility allows jump-scouting. Great eco-round option.',
    tips: ['Jump shots are accurate with the Scout', 'One-shot headshot at all ranges', 'Cheap enough for force-buy rounds', 'Fastest movement speed of any scoped weapon'],
    tags: ['sniper', 'budget', 'mobile', 'jump-shot'],
  },
  {
    slug: 'galil-ar', name: 'Galil AR', category: 'rifle', subcategory: 'Assault Rifle',
    team: 't', price: 1800, killReward: 300, damage: 30, armorPen: 77.5,
    rpm: 666, magSize: 30, reserveAmmo: 90, reloadTime: 3.0, moveSpeed: 215,
    rangeModifier: 0.98, penetration: 2, headshotMult: 4,
    description: 'Budget T-side rifle. Decent damage and fire rate at a much lower price than the AK-47. Good for force-buy rounds when you cant afford a full buy.',
    tips: ['Solid force-buy weapon when AK-47 is too expensive', 'Spray is harder to control than AK at range', 'Use in close-mid range fights', 'Burst fire at long distances'],
    tags: ['budget', 't-side', 'force-buy'],
  },
  {
    slug: 'famas', name: 'FAMAS', category: 'rifle', subcategory: 'Assault Rifle',
    team: 'ct', price: 2050, killReward: 300, damage: 30, armorPen: 70,
    rpm: 666, magSize: 25, reserveAmmo: 90, reloadTime: 3.30, moveSpeed: 220,
    rangeModifier: 0.96, penetration: 1, headshotMult: 4,
    description: 'Budget CT-side rifle with optional burst-fire mode. Cheaper alternative to M4A4/M4A1-S for force-buy rounds.',
    tips: ['Burst-fire mode can be useful at long range', 'Decent force-buy option for CTs', '25-round magazine is limiting', 'Spray pattern has significant horizontal spread'],
    tags: ['budget', 'ct-side', 'burst-fire', 'force-buy'],
  },
  {
    slug: 'aug', name: 'AUG', category: 'rifle', subcategory: 'Assault Rifle',
    team: 'ct', price: 3300, killReward: 300, damage: 28, armorPen: 90,
    rpm: 600, magSize: 30, reserveAmmo: 90, reloadTime: 3.80, moveSpeed: 220,
    rangeModifier: 0.96, penetration: 2, headshotMult: 4,
    description: 'Scoped CT-side rifle with high armor penetration. The scope provides accuracy for long-range duels but slows fire rate when scoped.',
    tips: ['Scope gives advantage in long-range fights', 'Higher armor pen than M4A4 and M4A1-S', 'Slightly more expensive than M4A4', 'Unscoped spray is different from scoped spray'],
    tags: ['ct-side', 'scoped', 'armor-pen'],
  },
  {
    slug: 'sg-553', name: 'SG 553', category: 'rifle', subcategory: 'Assault Rifle',
    team: 't', price: 3000, killReward: 300, damage: 30, armorPen: 100,
    rpm: 666, magSize: 30, reserveAmmo: 90, reloadTime: 2.80, moveSpeed: 210,
    rangeModifier: 0.98, penetration: 2, headshotMult: 4,
    description: 'Scoped T-side rifle with perfect armor penetration. The scope is useful for long-range fights. Unique diagonal spray pattern.',
    tips: ['100% armor penetration — most efficient vs armor', 'Spray pattern goes diagonal — practice it', 'Scope gives long-range advantage over AK', 'Underused in pro play but very powerful'],
    tags: ['t-side', 'scoped', 'armor-pen', 'diagonal-spray'],
  },
  {
    slug: 'scar-20', name: 'SCAR-20', category: 'rifle', subcategory: 'Auto Sniper',
    team: 'ct', price: 5000, killReward: 300, damage: 80, armorPen: 82.5,
    rpm: 240, magSize: 20, reserveAmmo: 90, reloadTime: 3.07, moveSpeed: 215,
    rangeModifier: 0.98, penetration: 3, headshotMult: 4,
    description: 'CT-side auto sniper. Semi-automatic with devastating damage output. Often considered annoying to play against due to its spam potential.',
    tips: ['Hold long angles and spam — very punishing', 'Two body shots kill at most ranges', 'Expensive at $5000 — only buy when economy is strong', 'Often tilts opponents — use strategically'],
    tags: ['ct-side', 'auto-sniper', 'spam', 'expensive'],
  },
  {
    slug: 'g3sg1', name: 'G3SG1', category: 'rifle', subcategory: 'Auto Sniper',
    team: 't', price: 5000, killReward: 300, damage: 80, armorPen: 82.5,
    rpm: 240, magSize: 20, reserveAmmo: 90, reloadTime: 4.67, moveSpeed: 215,
    rangeModifier: 0.98, penetration: 3, headshotMult: 4,
    description: 'T-side auto sniper. Semi-automatic with high damage. Mirror of the SCAR-20 for terrorists.',
    tips: ['Same stats as SCAR-20 but with longer reload', 'Effective for holding rushes on T-side', 'Very expensive — only in strong economies', 'Two quick body shots will kill'],
    tags: ['t-side', 'auto-sniper', 'spam', 'expensive'],
  },

  // ═══════════════════════════════════════
  // SMGs
  // ═══════════════════════════════════════
  {
    slug: 'mac-10', name: 'MAC-10', category: 'smg', subcategory: 'SMG',
    team: 't', price: 1050, killReward: 600, damage: 29, armorPen: 57.5,
    rpm: 800, magSize: 30, reserveAmmo: 100, reloadTime: 2.57, moveSpeed: 240,
    rangeModifier: 0.82, penetration: 1, headshotMult: 4,
    description: 'Cheap T-side SMG with extremely high fire rate. $600 kill reward makes it a money-making machine on anti-eco rounds. Run and gun playstyle.',
    tips: ['$600 kill reward — use on anti-eco rounds', 'Run and gun is viable due to high move speed', 'Terrible at long range — close the distance', 'Buy when you expect the enemy to eco'],
    tags: ['t-side', 'cheap', 'run-and-gun', 'anti-eco', 'money-maker'],
  },
  {
    slug: 'mp9', name: 'MP9', category: 'smg', subcategory: 'SMG',
    team: 'ct', price: 1250, killReward: 600, damage: 26, armorPen: 60,
    rpm: 857, magSize: 30, reserveAmmo: 120, reloadTime: 2.13, moveSpeed: 240,
    rangeModifier: 0.84, penetration: 1, headshotMult: 4,
    description: 'CT-side equivalent of the MAC-10. High fire rate, fast reload, and $600 kill reward. Excellent for anti-eco and close-range fights.',
    tips: ['$600 kill reward — great for building economy', 'Highest fire rate of any SMG', 'Very fast reload at 2.1 seconds', 'Close range only — falls off hard at distance'],
    tags: ['ct-side', 'anti-eco', 'fast-fire', 'money-maker'],
  },
  {
    slug: 'mp7', name: 'MP7', category: 'smg', subcategory: 'SMG',
    team: 'both', price: 1500, killReward: 600, damage: 29, armorPen: 62.5,
    rpm: 750, magSize: 30, reserveAmmo: 120, reloadTime: 3.13, moveSpeed: 220,
    rangeModifier: 0.85, penetration: 1, headshotMult: 4,
    description: 'Versatile SMG available to both sides. Good balance of damage, accuracy, and fire rate. Better range than MAC-10 and MP9.',
    tips: ['More accurate than MAC-10/MP9 at range', 'Good all-around SMG choice', 'Available to both teams', '$600 kill reward for economic advantage'],
    tags: ['versatile', 'both-sides', 'anti-eco'],
  },
  {
    slug: 'ump-45', name: 'UMP-45', category: 'smg', subcategory: 'SMG',
    team: 'both', price: 1200, killReward: 600, damage: 35, armorPen: 65,
    rpm: 666, magSize: 25, reserveAmmo: 100, reloadTime: 3.50, moveSpeed: 230,
    rangeModifier: 0.75, penetration: 1, headshotMult: 4,
    description: 'Budget SMG with surprisingly high damage per bullet. Good armor penetration for an SMG makes it viable even against armored opponents on force-buy rounds.',
    tips: ['Highest damage per bullet of any SMG', 'Good armor pen — viable vs armored enemies', 'Only 25 rounds — be careful with sprays', 'Best SMG for force-buy rounds'],
    tags: ['budget', 'high-damage', 'force-buy', 'armor-pen'],
  },
  {
    slug: 'p90', name: 'P90', category: 'smg', subcategory: 'SMG',
    team: 'both', price: 2350, killReward: 300, damage: 26, armorPen: 69,
    rpm: 857, magSize: 50, reserveAmmo: 100, reloadTime: 3.40, moveSpeed: 230,
    rangeModifier: 0.85, penetration: 1, headshotMult: 4,
    description: 'High-capacity SMG with 50 rounds. Expensive for an SMG and only $300 kill reward, but the massive magazine allows extended sprays. Run and gun capable.',
    tips: ['50-round magazine — just hold mouse1', 'Only $300 kill reward unlike other SMGs', 'Expensive for an SMG at $2350', 'Effective against ecos and in close quarters'],
    tags: ['high-capacity', 'run-and-gun', 'spray'],
  },
  {
    slug: 'mp5-sd', name: 'MP5-SD', category: 'smg', subcategory: 'SMG',
    team: 'both', price: 1500, killReward: 600, damage: 27, armorPen: 62.5,
    rpm: 750, magSize: 30, reserveAmmo: 120, reloadTime: 3.13, moveSpeed: 235,
    rangeModifier: 0.84, penetration: 1, headshotMult: 4,
    description: 'Silenced SMG alternative to the MP7. Hides tracers and muffles shots. Same price but trades slight damage for stealth.',
    tips: ['Silenced — no tracers or loud gunfire', 'Swap with MP7 in loadout menu', 'Good for flanking without being heard', 'Same $600 kill reward as other SMGs'],
    tags: ['silenced', 'stealth', 'anti-eco'],
  },
  {
    slug: 'pp-bizon', name: 'PP-Bizon', category: 'smg', subcategory: 'SMG',
    team: 'both', price: 1400, killReward: 600, damage: 27, armorPen: 57.5,
    rpm: 750, magSize: 64, reserveAmmo: 120, reloadTime: 2.43, moveSpeed: 240,
    rangeModifier: 0.78, penetration: 1, headshotMult: 4,
    description: '64-round magazine SMG. Enormous capacity but very low armor penetration. Only effective against unarmored opponents.',
    tips: ['64 rounds — largest SMG magazine', 'Terrible vs armored opponents', 'Only buy when enemy has no armor', 'Fast reload despite huge magazine'],
    tags: ['high-capacity', 'anti-eco-only', 'niche'],
  },

  // ═══════════════════════════════════════
  // PISTOLS
  // ═══════════════════════════════════════
  {
    slug: 'glock-18', name: 'Glock-18', category: 'pistol', subcategory: 'Starting Pistol',
    team: 't', price: 200, killReward: 300, damage: 30, armorPen: 47,
    rpm: 400, magSize: 20, reserveAmmo: 120, reloadTime: 2.17, moveSpeed: 240,
    rangeModifier: 0.75, penetration: 1, headshotMult: 4,
    description: 'Default T-side pistol. 20-round magazine with burst-fire mode. Weak against armor but effective in pistol rounds with volume of fire.',
    tips: ['Aim for the head — weak against armor', 'Burst-fire mode at close range can be deadly', '20 rounds gives ammo advantage over USP-S', 'Close the distance on pistol rounds'],
    tags: ['starting', 't-side', 'burst-fire', 'free'],
  },
  {
    slug: 'usp-s', name: 'USP-S', category: 'pistol', subcategory: 'Starting Pistol',
    team: 'ct', price: 200, killReward: 300, damage: 35, armorPen: 50.5,
    rpm: 352, magSize: 12, reserveAmmo: 24, reloadTime: 2.17, moveSpeed: 240,
    rangeModifier: 0.99, penetration: 1, headshotMult: 4,
    description: 'Default CT-side silenced pistol. Very accurate first shot, excellent for headshots. Only 12 rounds so make every shot count.',
    tips: ['Extremely accurate first shot — go for headshots', 'Silenced by default — removes tracers', 'Only 12 rounds — dont spam', 'One of the best pistol-round weapons'],
    tags: ['starting', 'ct-side', 'silenced', 'accurate', 'free'],
  },
  {
    slug: 'p2000', name: 'P2000', category: 'pistol', subcategory: 'Starting Pistol',
    team: 'ct', price: 200, killReward: 300, damage: 35, armorPen: 50.5,
    rpm: 352, magSize: 13, reserveAmmo: 52, reloadTime: 2.17, moveSpeed: 240,
    rangeModifier: 0.94, penetration: 1, headshotMult: 4,
    description: 'Alternative CT-side starting pistol. One more round than USP-S and more reserve ammo, but no silencer and slightly less range accuracy.',
    tips: ['13 rounds vs 12 for USP-S', 'More reserve ammo for extended fights', 'No silencer — slightly less accurate at range', 'Swap with USP-S in loadout menu'],
    tags: ['starting', 'ct-side', 'alternative', 'free'],
  },
  {
    slug: 'p250', name: 'P250', category: 'pistol', subcategory: 'Pistol',
    team: 'both', price: 300, killReward: 300, damage: 38, armorPen: 63.5,
    rpm: 400, magSize: 13, reserveAmmo: 26, reloadTime: 2.17, moveSpeed: 240,
    rangeModifier: 0.94, penetration: 1, headshotMult: 4,
    description: 'Cheap upgrade over starting pistols with better armor penetration. Reliable eco-round sidearm that can one-tap at close range.',
    tips: ['Great eco-round purchase at only $300', 'Better armor pen than starting pistols', 'One-tap headshot at very close range', 'Good backup sidearm for AWPers'],
    tags: ['eco', 'cheap', 'armor-pen'],
  },
  {
    slug: 'five-seven', name: 'Five-SeveN', category: 'pistol', subcategory: 'Pistol',
    team: 'ct', price: 500, killReward: 300, damage: 32, armorPen: 91.15,
    rpm: 400, magSize: 20, reserveAmmo: 100, reloadTime: 2.20, moveSpeed: 240,
    rangeModifier: 0.88, penetration: 1, headshotMult: 4,
    description: 'CT-side pistol with excellent armor penetration and 20-round magazine. Strong eco-round choice that can one-tap at close range.',
    tips: ['91% armor pen — great vs helmets', '20 rounds is very generous for a pistol', 'One-tap at close range', 'Best eco pistol for CTs'],
    tags: ['ct-side', 'eco', 'armor-pen', 'high-mag'],
  },
  {
    slug: 'tec-9', name: 'Tec-9', category: 'pistol', subcategory: 'Pistol',
    team: 't', price: 500, killReward: 300, damage: 33, armorPen: 90.6,
    rpm: 500, magSize: 18, reserveAmmo: 90, reloadTime: 2.42, moveSpeed: 240,
    rangeModifier: 0.85, penetration: 1, headshotMult: 4,
    description: 'T-side pistol with great armor penetration and running accuracy. Popular eco-round choice for aggressive T-side plays.',
    tips: ['Good running accuracy for aggressive plays', '90% armor pen — effective vs helmets', '18 rounds is solid for a pistol', 'Rush B with Tec-9 is a classic eco strat'],
    tags: ['t-side', 'eco', 'armor-pen', 'run-and-gun'],
  },
  {
    slug: 'cz75-auto', name: 'CZ75-Auto', category: 'pistol', subcategory: 'Pistol',
    team: 'both', price: 500, killReward: 100, damage: 33, armorPen: 77.65,
    rpm: 600, magSize: 12, reserveAmmo: 12, reloadTime: 2.70, moveSpeed: 240,
    rangeModifier: 0.85, penetration: 1, headshotMult: 4,
    description: 'Fully automatic pistol. Very fast time-to-kill at close range but tiny magazine and only 12 reserve rounds. Only $100 kill reward.',
    tips: ['Full auto — spray at close range', 'Only 12+12 ammo total — make it count', '$100 kill reward is bad for economy', 'Best for holding tight corners on eco'],
    tags: ['auto', 'eco', 'close-range', 'low-ammo'],
  },
  {
    slug: 'desert-eagle', name: 'Desert Eagle', category: 'pistol', subcategory: 'Pistol',
    team: 'both', price: 700, killReward: 300, damage: 63, armorPen: 93.2,
    rpm: 267, magSize: 7, reserveAmmo: 35, reloadTime: 2.17, moveSpeed: 230,
    rangeModifier: 0.94, penetration: 2, headshotMult: 4,
    description: 'The most powerful pistol in CS2. One-shot headshot at any range through helmets. High risk, high reward — only 7 rounds per magazine.',
    tips: ['One-tap headshot at any range', 'Highest pistol damage in the game', 'Only 7 rounds — aim carefully', 'Let recoil reset between shots'],
    tags: ['one-tap', 'high-damage', 'skill-based'],
  },
  {
    slug: 'dual-berettas', name: 'Dual Berettas', category: 'pistol', subcategory: 'Pistol',
    team: 'both', price: 300, killReward: 300, damage: 38, armorPen: 52,
    rpm: 500, magSize: 30, reserveAmmo: 120, reloadTime: 3.77, moveSpeed: 240,
    rangeModifier: 0.75, penetration: 1, headshotMult: 4,
    description: 'Dual-wielded pistols with 30-round combined capacity. Low armor pen but high volume of fire. Fun but rarely optimal.',
    tips: ['30 rounds combined — lots of ammo', 'Low armor pen — bad vs helmets', 'Fun but not competitive meta', 'Cheap at $300 for eco rounds'],
    tags: ['dual-wield', 'high-mag', 'niche'],
  },
  {
    slug: 'r8-revolver', name: 'R8 Revolver', category: 'pistol', subcategory: 'Pistol',
    team: 'both', price: 600, killReward: 300, damage: 86, armorPen: 93.2,
    rpm: 120, magSize: 8, reserveAmmo: 16, reloadTime: 2.25, moveSpeed: 220,
    rangeModifier: 0.98, penetration: 2, headshotMult: 4,
    description: 'High-damage revolver with a trigger delay. Primary fire has a windup before shooting. Secondary fire is inaccurate but instant. Niche weapon.',
    tips: ['Primary fire has a delay before shooting', 'Secondary fire (right click) is instant but inaccurate', 'Very high damage — 2-shot body kill', 'Replaces Desert Eagle in loadout'],
    tags: ['revolver', 'high-damage', 'delay', 'niche'],
  },

  // ═══════════════════════════════════════
  // HEAVY
  // ═══════════════════════════════════════
  {
    slug: 'nova', name: 'Nova', category: 'heavy', subcategory: 'Shotgun',
    team: 'both', price: 1050, killReward: 900, damage: 26, armorPen: 50,
    rpm: 68, magSize: 8, reserveAmmo: 32, reloadTime: 0.55, moveSpeed: 220,
    rangeModifier: 0.70, penetration: 1, headshotMult: 4,
    description: 'Pump-action shotgun. $900 kill reward makes it excellent for economic rounds. Devastating at close range, useless at distance.',
    tips: ['$900 kill reward — highest of any weapon', 'Aim at neck/head level for one-shot kills', 'Only effective at very close range', 'Great for anti-eco round money farming'],
    tags: ['shotgun', 'money-maker', 'close-range'],
  },
  {
    slug: 'xm1014', name: 'XM1014', category: 'heavy', subcategory: 'Shotgun',
    team: 'both', price: 2000, killReward: 900, damage: 20, armorPen: 80,
    rpm: 171, magSize: 7, reserveAmmo: 32, reloadTime: 0.50, moveSpeed: 215,
    rangeModifier: 0.70, penetration: 1, headshotMult: 4,
    description: 'Semi-automatic shotgun. Faster follow-up shots than the Nova. High armor pen for a shotgun. Good for close-range defense.',
    tips: ['Auto shotgun — fast follow-up shots', 'High armor pen for a shotgun', 'Reloads one shell at a time — can interrupt', '$900 kill reward like all shotguns'],
    tags: ['shotgun', 'auto', 'close-range'],
  },
  {
    slug: 'mag-7', name: 'MAG-7', category: 'heavy', subcategory: 'Shotgun',
    team: 'ct', price: 1300, killReward: 900, damage: 30, armorPen: 75,
    rpm: 71, magSize: 5, reserveAmmo: 32, reloadTime: 2.50, moveSpeed: 225,
    rangeModifier: 0.80, penetration: 1, headshotMult: 4,
    description: 'CT-side pump shotgun with magazine reload instead of shell-by-shell. Higher per-pellet damage than other shotguns.',
    tips: ['Magazine reload instead of per-shell', 'Highest per-pellet damage', 'Only 5 rounds — reload often', 'Great for holding close-range spots on CT'],
    tags: ['ct-side', 'shotgun', 'close-range'],
  },
  {
    slug: 'sawed-off', name: 'Sawed-Off', category: 'heavy', subcategory: 'Shotgun',
    team: 't', price: 1100, killReward: 900, damage: 32, armorPen: 75,
    rpm: 68, magSize: 7, reserveAmmo: 32, reloadTime: 0.50, moveSpeed: 210,
    rangeModifier: 0.70, penetration: 1, headshotMult: 4,
    description: 'T-side shotgun with devastating close-range damage. Extremely short effective range limits its usefulness.',
    tips: ['Insane damage up close — one-shot potential', 'Effective range is tiny', 'Only useful in very tight spaces', '$900 kill reward if you can get kills'],
    tags: ['t-side', 'shotgun', 'extreme-close'],
  },
  {
    slug: 'm249', name: 'M249', category: 'heavy', subcategory: 'Machine Gun',
    team: 'both', price: 5200, killReward: 300, damage: 32, armorPen: 80,
    rpm: 750, magSize: 100, reserveAmmo: 200, reloadTime: 5.70, moveSpeed: 195,
    rangeModifier: 0.97, penetration: 2, headshotMult: 4,
    description: 'Heavy machine gun with 100-round magazine. Extremely expensive and heavy. Rarely used in competitive play but fun for casual.',
    tips: ['100-round magazine — spray forever', 'Very expensive at $5200', 'Slow movement speed', 'Almost never used in competitive'],
    tags: ['machine-gun', 'high-capacity', 'expensive', 'niche'],
  },
  {
    slug: 'negev', name: 'Negev', category: 'heavy', subcategory: 'Machine Gun',
    team: 'both', price: 1700, killReward: 300, damage: 35, armorPen: 75,
    rpm: 800, magSize: 150, reserveAmmo: 200, reloadTime: 5.70, moveSpeed: 195,
    rangeModifier: 0.97, penetration: 2, headshotMult: 4,
    description: 'Budget machine gun with 150 rounds. After initial spray, becomes laser-accurate. Hold down fire to create an impenetrable wall of bullets.',
    tips: ['Spray becomes perfectly accurate after 1-2 seconds', '150-round magazine — hold mouse1', 'Use to deny pushes through chokepoints', 'Surprisingly cheap at $1700'],
    tags: ['machine-gun', 'laser', 'area-denial'],
  },

  // ═══════════════════════════════════════
  // GRENADES
  // ═══════════════════════════════════════
  {
    slug: 'he-grenade', name: 'HE Grenade', category: 'grenade', subcategory: 'Damage',
    team: 'both', price: 300, killReward: 300, damage: 98, armorPen: 57.5,
    rpm: 0, magSize: 1, reserveAmmo: 0, reloadTime: 0, moveSpeed: 245,
    rangeModifier: 0, penetration: 0, headshotMult: 1,
    description: 'Explosive grenade dealing up to 98 damage. Essential utility for softening enemies before pushes or finishing low-HP opponents.',
    tips: ['98 max damage — rarely kills full HP enemies', 'Use to finish tagged opponents', 'Great for clearing common hiding spots', 'Can damage through thin walls'],
    tags: ['utility', 'damage', 'essential'],
  },
  {
    slug: 'smoke-grenade', name: 'Smoke Grenade', category: 'grenade', subcategory: 'Utility',
    team: 'both', price: 300, killReward: 300, damage: 0, armorPen: 0,
    rpm: 0, magSize: 1, reserveAmmo: 0, reloadTime: 0, moveSpeed: 245,
    rangeModifier: 0, penetration: 0, headshotMult: 1,
    description: 'Creates an opaque smoke cloud lasting ~18 seconds. The most important utility in CS2 — used to block sightlines, execute sites, and delay pushes.',
    tips: ['Lasts approximately 18 seconds', 'Learn lineup smokes for every map you play', 'Used to block AWP angles and execute sites', 'Can be one-wayed for defensive advantage'],
    tags: ['utility', 'vision-block', 'essential', 'lineups'],
  },
  {
    slug: 'flashbang', name: 'Flashbang', category: 'grenade', subcategory: 'Utility',
    team: 'both', price: 200, killReward: 0, damage: 0, armorPen: 0,
    rpm: 0, magSize: 2, reserveAmmo: 0, reloadTime: 0, moveSpeed: 245,
    rangeModifier: 0, penetration: 0, headshotMult: 1,
    description: 'Blinds opponents who look at it. Can carry two. Essential for peeking angles, supporting teammates, and executing sites.',
    tips: ['Can carry 2 flashbangs', 'Pop flash = throw so enemies cant turn away', 'Flash for teammates before they peek', 'Turn away from enemy flashes to avoid being blinded'],
    tags: ['utility', 'blind', 'essential', 'pop-flash'],
  },
  {
    slug: 'molotov', name: 'Molotov', category: 'grenade', subcategory: 'Fire',
    team: 't', price: 400, killReward: 300, damage: 40, armorPen: 100,
    rpm: 0, magSize: 1, reserveAmmo: 0, reloadTime: 0, moveSpeed: 245,
    rangeModifier: 0, penetration: 0, headshotMult: 1,
    description: 'T-side fire grenade. Creates a burning area that deals 40 damage per second. Used to flush enemies from positions and deny areas.',
    tips: ['40 DPS — forces enemies to move', 'Use to clear common holding positions', 'Can be extinguished by smoke grenade', 'Cheaper than CT incendiary at $400'],
    tags: ['t-side', 'utility', 'area-denial', 'fire'],
  },
  {
    slug: 'incendiary-grenade', name: 'Incendiary Grenade', category: 'grenade', subcategory: 'Fire',
    team: 'ct', price: 600, killReward: 300, damage: 40, armorPen: 100,
    rpm: 0, magSize: 1, reserveAmmo: 0, reloadTime: 0, moveSpeed: 245,
    rangeModifier: 0, penetration: 0, headshotMult: 1,
    description: 'CT-side fire grenade. Identical to Molotov but $200 more expensive. Creates a burning area dealing 40 damage per second.',
    tips: ['Same as Molotov but $200 more expensive', 'Essential for stopping rushes on CT side', 'Throw at chokepoints to delay pushes', 'Can be extinguished by smoke grenade'],
    tags: ['ct-side', 'utility', 'area-denial', 'fire'],
  },
  {
    slug: 'decoy-grenade', name: 'Decoy Grenade', category: 'grenade', subcategory: 'Utility',
    team: 'both', price: 50, killReward: 300, damage: 0, armorPen: 0,
    rpm: 0, magSize: 1, reserveAmmo: 0, reloadTime: 0, moveSpeed: 245,
    rangeModifier: 0, penetration: 0, headshotMult: 1,
    description: 'Emits fake gunfire sounds matching your current weapon. Very cheap. Can be used to fake presence or trigger enemy rotations.',
    tips: ['Only $50 — buy it on every round', 'Shows as a dot on enemy radar', 'Mimics the sound of your equipped weapon', 'Can fake a presence at a bombsite'],
    tags: ['utility', 'cheap', 'fake', 'mind-games'],
  },

  // ═══════════════════════════════════════
  // KNIVES (cosmetic — shared combat stats)
  // ═══════════════════════════════════════
  { slug: 'bayonet', name: 'Bayonet', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A classic military knife with a clip-point blade. The Bayonet is one of the original CS knife models, featuring clean lines and a timeless design.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'bowie-knife', name: 'Bowie Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A large fixed-blade knife with an imposing profile. The Bowie Knife features a distinctive clip-point blade and heavy-duty construction.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'butterfly-knife', name: 'Butterfly Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A folding knife with two counter-rotating handles. Known for its iconic flipping animation, the Butterfly Knife is one of the most sought-after knife types in CS2.', tips: ['All knives share the same damage stats', 'Features a unique flipping deploy animation', 'One of the most popular and expensive knife types', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'popular'] },
  { slug: 'classic-knife', name: 'Classic Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'The original Counter-Strike knife design. A nostalgic callback to the classic 1.6 knife model with a straightforward design.', tips: ['All knives share the same damage stats', 'Based on the original CS 1.6 knife model', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'classic'] },
  { slug: 'falchion-knife', name: 'Falchion Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A curved blade knife with a single-edged design. The Falchion Knife features a distinctive swooping blade shape and spring-assisted deployment.', tips: ['All knives share the same damage stats', 'Features a unique spring-assist deploy animation', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'flip-knife', name: 'Flip Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A folding knife with a simple and clean flipping mechanism. The Flip Knife is an entry-level knife option with a satisfying deploy animation.', tips: ['All knives share the same damage stats', 'Generally one of the more affordable knife types', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'affordable'] },
  { slug: 'gut-knife', name: 'Gut Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A tactical knife with a short, wide blade featuring a gut hook. Usually the most budget-friendly knife option in CS2.', tips: ['All knives share the same damage stats', 'Typically the most affordable knife type', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'budget'] },
  { slug: 'huntsman-knife', name: 'Huntsman Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A full-tang fixed-blade knife with a large clip-point blade. The Huntsman Knife offers an aggressive profile and satisfying animations.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'karambit', name: 'Karambit', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A curved claw-like knife originating from Southeast Asia. The Karambit is consistently one of the most popular and expensive knife types due to its iconic spinning animation.', tips: ['All knives share the same damage stats', 'Features an iconic spinning inspect animation', 'One of the most expensive knife types', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'premium', 'popular'] },
  { slug: 'kukri-knife', name: 'Kukri Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A Nepalese knife with a distinctive inward-curving blade. The Kukri Knife was added with CS2 and features a unique heavy chopping animation.', tips: ['All knives share the same damage stats', 'Added with Counter-Strike 2', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'cs2-exclusive'] },
  { slug: 'm9-bayonet', name: 'M9 Bayonet', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A military combat knife modeled after the M9 bayonet. Features a clean straight-back blade design and is highly popular in the trading community.', tips: ['All knives share the same damage stats', 'One of the most popular knife types for trading', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'popular'] },
  { slug: 'navaja-knife', name: 'Navaja Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A folding knife with a ring-lock mechanism and distinctive curved blade. The Navaja is typically one of the more affordable knife options.', tips: ['All knives share the same damage stats', 'Usually one of the more affordable knife types', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'affordable'] },
  { slug: 'nomad-knife', name: 'Nomad Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A full-tang fixed-blade knife with a straight-back design. The Nomad Knife features a practical, no-frills look and sturdy build.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'paracord-knife', name: 'Paracord Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A survival knife with a paracord-wrapped handle. Features a simple, utilitarian design popular with outdoor enthusiasts.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'shadow-daggers', name: 'Shadow Daggers', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'Twin push daggers — the only dual-wielded knife type in CS2. Shadow Daggers feature a unique deployment and attack animation with both hands.', tips: ['All knives share the same damage stats', 'The only dual-wield knife in CS2', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare', 'dual-wield'] },
  { slug: 'skeleton-knife', name: 'Skeleton Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A minimalist knife with a skeletonized handle design. The Skeleton Knife features a clean, lightweight aesthetic and unique deploy animation.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'stiletto-knife', name: 'Stiletto Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'An Italian-style switchblade with a slender, needle-point blade. The Stiletto features a satisfying spring-loaded deployment mechanism.', tips: ['All knives share the same damage stats', 'Features a switchblade-style deploy animation', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'survival-knife', name: 'Survival Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A rugged fixed-blade survival knife with a sawback spine. Built for tough conditions with a no-nonsense military design.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'talon-knife', name: 'Talon Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A curved folding knife with a hawkbill blade design. The Talon Knife features a unique assisted-opening mechanism and aggressive blade profile.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },
  { slug: 'ursus-knife', name: 'Ursus Knife', category: 'knife', subcategory: 'Knife', team: 'both', cosmetic: true, price: 0, killReward: 1500, damage: 34, armorPen: 100, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 250, rangeModifier: 1, penetration: 0, headshotMult: 1, description: 'A large fixed-blade knife with a heavy, broad blade. The Ursus Knife draws inspiration from traditional European hunting knives.', tips: ['All knives share the same damage stats', 'Left click: 34 damage, right click: 55 damage', 'Backstab does 180 damage (instant kill)', 'Holding a knife gives max movement speed (250)'], tags: ['knife', 'cosmetic', 'rare'] },

  // ═══════════════════════════════════════
  // GLOVES (purely cosmetic — no combat stats)
  // ═══════════════════════════════════════
  { slug: 'sport-gloves', name: 'Sport Gloves', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Athletic-style gloves with a sporty design. Sport Gloves feature vibrant patterns and colors, making them popular for flashy loadouts.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Can be paired with matching knife skins', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
  { slug: 'specialist-gloves', name: 'Specialist Gloves', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Tactical gloves with a professional military look. Specialist Gloves offer a more subdued, operator-style aesthetic.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Can be paired with matching knife skins', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
  { slug: 'driver-gloves', name: 'Driver Gloves', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Classic leather driving gloves with a fingerless design. Driver Gloves offer an elegant, refined look with premium material finishes.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Can be paired with matching knife skins', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
  { slug: 'hand-wraps', name: 'Hand Wraps', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Cloth hand wraps with a rugged, combat-ready look. Hand Wraps feature a minimalist style that shows more of the player model\'s hands.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Show more of the character model\'s hands', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
  { slug: 'moto-gloves', name: 'Moto Gloves', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Motorcycle-style gloves with reinforced knuckles and a bold design. Moto Gloves combine protection with style.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Can be paired with matching knife skins', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
  { slug: 'hydra-gloves', name: 'Hydra Gloves', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Tactical gloves introduced with Operation Hydra. Feature a military-grade design with distinctive patterns and finishes.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Introduced with Operation Hydra', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
  { slug: 'broken-fang-gloves', name: 'Broken Fang Gloves', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Tactical gloves introduced with Operation Broken Fang. Feature a modern military aesthetic with fingerless design.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Introduced with Operation Broken Fang', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
  { slug: 'bloodhound-gloves', name: 'Bloodhound Gloves', category: 'glove', subcategory: 'Gloves', team: 'both', cosmetic: true, price: 0, killReward: 0, damage: 0, armorPen: 0, rpm: 0, magSize: 0, reserveAmmo: 0, reloadTime: 0, moveSpeed: 0, rangeModifier: 0, penetration: 0, headshotMult: 0, description: 'Tactical gloves introduced with Operation Bloodhound. Feature a rugged military design with textured grip surfaces.', tips: ['Gloves are purely cosmetic items', 'They change the appearance of your hands in-game', 'Introduced with Operation Bloodhound', 'Available in all five wear conditions'], tags: ['glove', 'cosmetic', 'rare'] },
];

// Helper functions
export function getWeaponBySlug(slug: string): Weapon | undefined {
  return WEAPONS.find(w => w.slug === slug);
}

export function getWeaponsByCategory(category: string): Weapon[] {
  return WEAPONS.filter(w => w.category === category);
}

export function getWeaponsByTeam(team: string): Weapon[] {
  return WEAPONS.filter(w => w.team === team || w.team === 'both');
}

export function searchWeapons(query: string): Weapon[] {
  const q = query.toLowerCase();
  return WEAPONS.filter(w => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || (w.tags && w.tags.some(t => t.includes(q))));
}

export function faqSchema(faqs: ({ q: string; a: string } | { question: string; answer: string })[]) {
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f: any) => ({ '@type': 'Question', name: f.q || f.question, acceptedAnswer: { '@type': 'Answer', text: f.a || f.answer } })) };
}

export function breadcrumbSchema(crumbs: { name?: string; label?: string; url?: string }[]) {
  const BASE = 'https://wiki.csgoluck.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => {
      const entry: Record<string, any> = { '@type': 'ListItem', position: i + 1, name: c.name || (c as any).label || '' };
      if (c.url) entry.item = c.url.startsWith('http') ? c.url : `${BASE}${c.url}`;
      return entry;
    }),
  };
}

export function toolAppSchema(opts: { name: string; url: string; description: string }) {
  return { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: opts.name, url: opts.url, description: opts.description, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
}

// ── Weapon Comparisons ──────────────────────────────────────────────────────
export interface WeaponComparison {
  slug: string;
  w1: Weapon;
  w2: Weapon;
}

export function getWeaponComparisons(): WeaponComparison[] {
  const combatWeapons = WEAPONS.filter(w => !w.cosmetic && w.category !== 'grenade');
  const comparisons: WeaponComparison[] = [];
  const seen = new Set<string>();

  // Generate same-category pairs
  for (let i = 0; i < combatWeapons.length; i++) {
    for (let j = i + 1; j < combatWeapons.length; j++) {
      const a = combatWeapons[i], b = combatWeapons[j];
      if (a.category !== b.category) continue;
      const slug = `${a.slug}-vs-${b.slug}`;
      if (seen.has(slug)) continue;
      seen.add(slug);
      comparisons.push({ slug, w1: a, w2: b });
    }
  }

  // Add key cross-category pairs
  const crossPairs: [string, string][] = [
    ['galil-ar', 'mac-10'], ['famas', 'mp9'], ['ump-45', 'galil-ar'], ['p90', 'famas'],
  ];
  for (const [s1, s2] of crossPairs) {
    const a = getWeaponBySlug(s1), b = getWeaponBySlug(s2);
    if (!a || !b) continue;
    const slug = `${s1}-vs-${s2}`;
    if (seen.has(slug)) continue;
    seen.add(slug);
    comparisons.push({ slug, w1: a, w2: b });
  }

  return comparisons;
}

export function getComparisonBySlug(slug: string): WeaponComparison | undefined {
  return getWeaponComparisons().find(c => c.slug === slug);
}
