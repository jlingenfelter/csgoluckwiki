export interface FAQ {
  q: string;
  a: string;
  slug: string;
}

export interface FAQCategory {
  name: string;
  icon: string;
  slug: string;
  questions: FAQ[];
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    name: 'Ranking System',
    icon: '🏆',
    slug: 'ranking',
    questions: [
      { q: 'How are players ranked in Counter-Strike 2?', a: 'CS2 offers two parallel ranking tracks. Competitive Skill Groups assign one of 18 emblem ranks (Silver through Global Elite) on a per-map basis. Premier Mode, the primary ranked queue, uses a visible numerical Elo-style score that adjusts after every match depending on the result and your individual impact.', slug: '' },
      { q: 'What ranks exist in the CS2 Competitive mode?', a: 'The Competitive ladder spans 18 tiers: six Silver ranks (Silver I up to Silver Elite Master), four Gold Nova tiers, four Master Guardian levels (MG1 through DMG), the Legendary Eagle pair (LE and LEM), Supreme Master First Class, and The Global Elite at the summit.', slug: '' },
      { q: 'What is the fastest way to climb ranks in CS2?', a: 'String together wins, maintain strong round-to-round stats like ADR and headshot rate, and earn MVP awards whenever possible. The system weighs individual round results, not just match outcomes. Staying active and avoiding extended breaks is also important because inactivity can erode your hidden MMR.', slug: '' },
      { q: 'How does the Premier Rating number work?', a: 'Premier Rating is a concrete numerical score — generally between 0 and 30,000-plus — that quantifies your competitive standing. After every Premier match, you see the exact number of points gained or lost, giving you far more visibility into your progress than the traditional emblem system ever did.', slug: '' },
      { q: 'Does my rank disappear if I stop playing?', a: 'It can. If you go without playing for roughly two weeks or longer, your visible rank may be hidden until you complete a recalibration match. Behind the scenes, your matchmaking rating can also drift downward during extended absences.', slug: '' },
    ]
  },
  {
    name: 'Performance & FPS',
    icon: '⚡',
    slug: 'performance',
    questions: [
      { q: 'What steps can I take to boost my frame rate in CS2?', a: 'Drop your render resolution, dial back shader complexity, turn off MSAA and FXAA, switch shadows to Low, ensure your GPU drivers are current, shut down background programs, add the -high flag to your launch options, and set fps_max 0 in your autoexec. Because CS2 leans heavily on single-threaded CPU performance, upgrading that component often yields the biggest gains.', slug: '' },
      { q: 'Which video settings should I use for maximum CS2 performance?', a: "To push frame rates as high as possible: set Global Shadow Quality, Model/Texture Detail, and Shader Detail all to Low; disable Multisampling entirely; use Bilinear texture filtering; turn off FXAA and VSync. If you can, keep your resolution at the monitor's native setting to avoid sacrificing visual sharpness.", slug: '' },
      { q: 'Why does CS2 run at fewer frames than CS:GO did?', a: 'CS2 is built on the Source 2 engine, which demands more from both GPU and CPU than the original Source engine behind CS:GO. The baseline hardware requirements are higher as a result. Valve continues to ship performance improvements with major patches, so the gap narrows over time.', slug: '' },
      { q: 'Can faster RAM really improve CS2 frame rates?', a: 'It can. Memory clocked at DDR4-3200 or DDR5-5600 and above with tight CAS latency timings can deliver a noticeable 5-15% uplift in FPS, particularly in CPU-bottlenecked situations where every cycle counts.', slug: '' },
      { q: 'Which processor gives the best CS2 performance?', a: "CS2 rewards high single-core clock speeds above all else. Current top performers include AMD's Ryzen 7000-series chips and Intel's 14th generation (and later) desktop CPUs. A modern six-core processor running at elevated boost frequencies is the sweet spot for competitive play.", slug: '' },
    ]
  },
  {
    name: 'Weapons & Mechanics',
    icon: '🔫',
    slug: 'weapons',
    questions: [
      { q: 'Which weapon is considered the strongest in CS2?', a: 'The AK-47 dominates on the T side and the M4A4 or M4A1-S rules the CT side — together they form the backbone of professional loadouts. The AK-47 stands alone as the only rifle capable of a single-headshot kill through a helmet. The AWP deals the most raw damage per shot in the game, but its $4,750 price tag makes it a significant economic commitment.', slug: '' },
      { q: 'How do spray patterns and recoil function in CS2?', a: 'Every weapon follows a predetermined recoil pattern that repeats identically on each spray. The initial two or three rounds land close to your crosshair, after which the grouping rises and drifts laterally in a fixed sequence. Mastering compensation means pulling your aim downward and side-to-side in the mirror image of that pattern.', slug: '' },
      { q: 'How do the AK-47, M4A4, and M4A1-S compare?', a: 'The AK-47 outputs the highest per-bullet damage and is the only rifle that one-taps helmeted heads, but its recoil kicks harder. The M4A4 balances a 30-round magazine with manageable spray, though it needs two headshots to secure a kill. The M4A1-S carries just 20 rounds but features the gentlest recoil of the three and comes suppressed. Your pick should align with your play style and role on the team.', slug: '' },
      { q: 'What determines first-shot accuracy in CS2?', a: 'Each weapon has a unique first-shot inaccuracy value. The AK-47, for example, lands roughly 97% of opening shots on a head-sized target at medium distance. The M4A1-S edges ahead of the AK-47 in standing first-shot precision. For the tightest possible spread, scoped rifles like the SG553 and AUG lead the category.', slug: '' },
      { q: 'What exactly do kevlar and helmets protect against?', a: 'A kevlar vest at $650 cuts incoming body damage by approximately half. Adding a helmet for a combined $1,000 also neutralises the bonus headshot multiplier from most guns. Key exceptions exist, though: the AK-47, SG553, and AWP all retain lethal headshot potential even through full armour. On T-side eco rounds, grabbing a helmet is almost always worth it.', slug: '' },
    ]
  },
  {
    name: 'Economy System',
    icon: '💰',
    slug: 'economy',
    questions: [
      { q: 'How is money earned and spent in CS2?', a: 'Income flows from winning rounds, securing kills, planting or defusing the bomb, and receiving loss-streak bonuses. Your bank rolls over from round to round with a $16,000 ceiling. Good teams coordinate when to invest in full equipment (buy rounds) versus when to save cash (eco rounds) to maintain a financial edge.', slug: '' },
      { q: 'How does the consecutive loss bonus scale?', a: 'Each successive round loss bumps your starting cash higher: one loss gives $1,400, two losses $1,900, three $2,400, four $2,900, and five or more maxes out at $3,400. After breaking the streak with a win, the bonus does not vanish instantly — you retain one tier of the bonus before it fully resets.', slug: '' },
      { q: 'How do I decide between a force buy and a full eco?', a: "Force buy if your squad can at least afford armour plus upgraded pistols or SMGs and the round is do-or-die for the half, or if winning one round would cripple the opponent's economy. Save on a full eco when banking for just one or two more rounds would let everyone afford rifles and a complete utility set.", slug: '' },
      { q: 'What are the per-kill money rewards in CS2?', a: 'Reward amounts depend on the weapon class: knife kills pay $1,500, SMGs award $600, shotguns $900, pistols and rifles each give $300, the AWP only returns $100, and grenade kills grant $300. The deliberately low AWP payout is designed to discourage saving for a sniper on eco rounds.', slug: '' },
      { q: 'What does a complete buy round look like?', a: 'A standard full buy means a rifle ($2,700-$4,750), kevlar with helmet ($1,000), and a full utility belt — one smoke ($300), two flashes ($200 each), and a molotov or HE grenade ($300-$400). Budget per player runs roughly $4,500 to $6,000 depending on weapon choice.', slug: '' },
    ]
  },
  {
    name: 'Skins & Trading',
    icon: '🎨',
    slug: 'skins',
    questions: [
      { q: "What does a skin's float value tell me?", a: 'The float is a decimal between 0.00 and 1.00 that dictates visual wear. The scale maps to five named conditions: Factory New (0.00-0.07), Minimal Wear (0.07-0.15), Field-Tested (0.15-0.38), Well-Worn (0.38-0.45), and Battle-Scarred (0.45-1.00). Skins closer to 0.00 look cleaner and typically carry higher price tags.', slug: '' },
      { q: "What factors drive a skin's market price?", a: 'Value hinges on a combination of rarity tier (Covert being the most desirable), exterior condition (Factory New at the top), distinctive patterns such as Case Hardened blue gems, exceptionally low float numbers, the presence of StatTrak kill tracking, any applied stickers, and the broader supply-and-demand dynamics on the marketplace.', slug: '' },
      { q: 'Which marketplaces can I use to purchase CS2 skins?', a: 'Widely used platforms include the Steam Community Market (Valve\'s official venue with a 15% transaction fee), Skinport, Buff163, DMarket, CS.Money, Tradeit.gg, and SkinBaron. Independent marketplaces generally charge lower commissions — typically between 2% and 7% — compared to Steam.', slug: '' },
      { q: 'Can CS2 skins serve as a worthwhile investment?', a: 'Certain skins have seen impressive long-term appreciation, particularly discontinued drops, operation-exclusive items, and sought-after knife or glove finishes. That said, the skin market is inherently volatile — patch notes, speculative trading, and shifting player tastes all move prices. Treat any capital you put into skins as money you are comfortable losing.', slug: '' },
      { q: 'How does the trade-up contract system operate?', a: 'You feed 10 skins of identical rarity into a contract and receive a single random skin one rarity tier higher, drawn from the same collection pool. The resulting item\'s float is derived from the average float of your inputs. By carefully mixing skins from specific collections, you can tilt the odds toward landing a particular high-value output.', slug: '' },
    ]
  },
  {
    name: 'Technical Setup',
    icon: '🖥️',
    slug: 'technical',
    questions: [
      { q: 'What hardware do I need to run Counter-Strike 2?', a: 'At the bare minimum you need Windows 10, a quad-core processor, 8 GB of RAM, and a DirectX 11 graphics card with at least 1 GB of VRAM. For a smooth competitive experience, aim for Windows 10 or 11, a six-core (or better) CPU, 16 GB of RAM, a DirectX 12 GPU with 4 GB+ VRAM, and an SSD for quick map loads.', slug: '' },
      { q: 'How do I create and configure an autoexec.cfg?', a: 'Make a plain text file called autoexec.cfg and drop it into your CS2 config directory at Steam/steamapps/common/Counter-Strike Global Offensive/game/csgo/cfg/. Write one command per line, and close the file with host_writeconfig. CS2 will process every instruction in this file automatically on startup.', slug: '' },
      { q: 'What refresh rate should my monitor be for competitive CS2?', a: '144 Hz is the practical floor for anyone playing competitively. Stepping up to 240 Hz delivers a clearly perceptible smoothness upgrade. 360 Hz panels exist and are common among pros, though the marginal gain over 240 Hz is smaller. Whatever your panel speed, make sure your GPU pushes frame rates that meet or exceed it.', slug: '' },
      { q: 'Is exclusive fullscreen better than borderless windowed?', a: 'For competitive play, exclusive fullscreen wins — it offers the lowest possible input latency and the best raw frame-rate performance. Borderless windowed mode lets you alt-tab instantly but introduces roughly 1-2 ms of extra input delay. The vast majority of serious competitors stick with exclusive fullscreen.', slug: '' },
      { q: 'How do I repair or verify my CS2 installation?', a: 'In your Steam Library, right-click Counter-Strike 2, choose Properties, open the Installed Files tab, and hit "Verify integrity of game files." Steam will scan for missing or corrupted data and re-download anything that does not match. This is a reliable fix after crashes, failed updates, or unexplained errors.', slug: '' },
    ]
  },
  {
    name: 'Competitive Play',
    icon: '⚔️',
    slug: 'competitive',
    questions: [
      { q: 'How do Competitive and Premier mode differ?', a: 'Competitive mode lets you queue for individual maps of your choosing and assigns one of 18 emblem ranks (Silver through Global Elite). Premier mode involves a map-veto process against your opponents, tracks your skill with a visible numerical rating, and is widely regarded as the flagship ranked experience in CS2.', slug: '' },
      { q: 'How many placement games are required?', a: 'You must accumulate 10 wins before the system issues your initial Premier Rating or Competitive rank. During this calibration period, each win or loss carries extra weight, so early match results have an outsized influence on where you initially land.', slug: '' },
      { q: 'What is ADR and why should I track it?', a: 'ADR stands for Average Damage per Round and serves as a measure of your consistent combat output. A solid benchmark is 80-100+ ADR. Even if you are not topping the kill column, high ADR means you are reliably softening up opponents, which directly translates into more rounds won for your team.', slug: '' },
      { q: 'What is the best way to improve at CS2?', a: 'Concentrate on keeping your crosshair at head height and pre-aimed on common peek angles, learn a handful of key smokes and flashes for each map you play, manage your economy wisely, avoid taking fights you do not need to take, and regularly review your own demo recordings to spot recurring errors.', slug: '' },
      { q: 'Which maps are most beginner-friendly?', a: 'Mirage and Dust 2 are the standard starting recommendations — both use a straightforward three-lane structure and see the most play time, so finding matches is effortless. Inferno is a logical next map to learn since it teaches CT-side discipline. After that, Ancient and Anubis offer good progression because they place a heavier emphasis on coordinated utility usage.', slug: '' },
    ]
  },
  {
    name: 'About CSGOLuck Wiki',
    icon: '📖',
    slug: 'about',
    questions: [
      { q: 'What exactly is CSGOLuck Wiki?', a: 'CSGOLuck Wiki is a comprehensive CS2 reference hub maintained by the team at CSGOLuck.com. It houses live skin pricing, a full weapon database, verified pro player configurations, interactive calculators, strategy guides, and detailed map breakdowns — everything consolidated in one free-to-use destination.', slug: '' },
      { q: 'What is the relationship with CSGOLuck.com?', a: 'CSGOLuck.com is the parent brand behind this wiki. Beyond the knowledge base, csgoluck.com offers additional CS2-related entertainment options and community-driven features worth exploring.', slug: '' },
      { q: 'Does Valve have any involvement with CSGOLuck Wiki?', a: 'None at all. CSGOLuck Wiki operates independently as a community resource. All Counter-Strike 2 intellectual property — game assets, logos, and trademarks — remain the sole property of Valve Corporation. We are simply passionate players building helpful tools for other players.', slug: '' },
      { q: 'How frequently is the information on this site refreshed?', a: 'Skin market values are pulled on a regular cycle through PriceEmpire, which aggregates pricing data from over 14 separate platforms. Pro player configs are cross-checked and revised whenever a competitor updates their setup. Game-mechanics data like weapon stats are adjusted to match each new CS2 patch.', slug: '' },
      { q: "Is there any cost to using the wiki's tools and content?", a: 'Everything on CSGOLuck Wiki is completely free — no account sign-up, no premium paywall, no hidden charges. Our philosophy is that high-quality CS2 resources should be openly accessible to the entire community.', slug: '' },
    ]
  },
];

// Auto-generate slugs from question text
for (const cat of FAQ_CATEGORIES) {
  for (const faq of cat.questions) {
    faq.slug = slugify(faq.q);
  }
}

export const ALL_FAQS = FAQ_CATEGORIES.flatMap(cat =>
  cat.questions.map(faq => ({ ...faq, category: cat.slug, categoryName: cat.name, categoryIcon: cat.icon }))
);

export function getFAQBySlug(slug: string) {
  return ALL_FAQS.find(f => f.slug === slug) || null;
}

export function getRelatedFAQs(slug: string, limit = 5) {
  const current = getFAQBySlug(slug);
  if (!current) return ALL_FAQS.slice(0, limit);
  // Same category first, then others
  const sameCategory = ALL_FAQS.filter(f => f.category === current.category && f.slug !== slug);
  const otherCategories = ALL_FAQS.filter(f => f.category !== current.category);
  return [...sameCategory, ...otherCategories].slice(0, limit);
}
