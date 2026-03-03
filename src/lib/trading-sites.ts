export interface TradingSite {
  slug: string;
  name: string;
  url: string;
  logo: string;
  type: 'marketplace' | 'trading' | 'both';
  fees: string;
  trustpilot: number | null;
  founded: number;
  description: string;
  features: string[];
  pros: string[];
  cons: string[];
  paymentMethods: string[];
  color: string;
  // ── Affiliate & Promo Config ──────────────────────────────────────
  // Edit these values to set your referral links and promo codes.
  // referralUrl: Your affiliate tracking URL (replaces the plain site URL in CTAs)
  // promoCode: The code users should enter to get a bonus
  // promoBonus: Description of what the code gives (e.g. "+5% bonus", "$5 free")
  // promoDetails: Longer description of the promo for the dedicated promo page
  referralUrl?: string;       // e.g. 'https://tradeit.gg/?ref=csdb'
  promoCode?: string;         // e.g. 'CSDB'
  promoBonus?: string;        // e.g. '+5% Trade Bonus'
  promoDetails?: string;      // Longer description for promo page
}

export const tradingSites: TradingSite[] = [
  {
    slug: 'buff163',
    name: 'Buff163',
    url: 'https://buff.163.com',
    logo: 'BUF',
    type: 'marketplace',
    fees: '2.5% seller fee',
    trustpilot: null,
    founded: 2018,
    description: 'The world\'s largest CS2 skin marketplace with over 4.2 million listed offers. A P2P platform dominating the Asian market with extensive inventory and competitive pricing.',
    features: ['P2P marketplace', '4.2M+ listed offers', 'Real-time pricing', 'Extensive inventory', 'Fast transactions'],
    pros: ['Lowest fees in the market', 'Massive inventory', 'Real-time price updates', 'Established platform'],
    cons: ['Primarily Chinese interface', 'Limited English support', 'Regional restrictions'],
    paymentMethods: ['Chinese payment methods', 'Alipay', 'WeChat Pay', 'Bank transfer'],
    color: '#d4956e',
    // ── EDIT YOUR AFFILIATE DETAILS BELOW ──
    referralUrl: '',    // e.g. 'https://buff.163.com/?ref=csdb'
    promoCode: '',      // e.g. 'CSDB'
    promoBonus: '',     // e.g. '2% fee discount'
    promoDetails: '',   // Longer promo description
  },
  {
    slug: 'skinport',
    name: 'Skinport',
    url: 'https://skinport.com',
    logo: 'SKP',
    type: 'marketplace',
    fees: '6-12% seller fees',
    trustpilot: 4.3,
    founded: 2016,
    description: 'Popular EU and NA P2P marketplace with custodial escrow for buyer/seller protection. Known for high trust ratings and reliable banking options.',
    features: ['P2P marketplace', 'Custodial escrow', 'EU bank transfers', 'High trust rating', 'Seller protection'],
    pros: ['High Trustpilot rating', 'Secure escrow system', 'EU payment options', 'Good seller protection'],
    cons: ['Higher seller fees', 'Limited to EU/NA', 'Slower payouts'],
    paymentMethods: ['Bank transfer', 'Credit card', 'PayPal', 'Crypto options'],
    color: '#00a3ff',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'csfloat',
    name: 'CSFloat',
    url: 'https://csfloat.com',
    logo: 'CSF',
    type: 'marketplace',
    fees: '2% base fee',
    trustpilot: 4.1,
    founded: 2020,
    description: 'Specialized P2P marketplace known for industry-leading float value tools and accurate skin condition analysis. Popular with collectors and float enthusiasts.',
    features: ['Advanced float tools', 'P2P marketplace', 'Detailed condition analysis', 'Bank transfers', 'Float database'],
    pros: ['Low 2% fees', 'Best float tools', 'Accurate condition data', 'Transparent pricing'],
    cons: ['Smaller inventory than Buff', 'Limited payment methods', 'Higher minimum trades'],
    paymentMethods: ['Bank transfer', 'Wire transfer', 'Crypto'],
    color: '#1a73e8',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'csmoney',
    name: 'CS.MONEY',
    url: 'https://cs.money',
    logo: 'CSM',
    type: 'both',
    fees: '3-5% fees (varies)',
    trustpilot: 4.2,
    founded: 2013,
    description: 'One of the largest and longest-running platforms with 1M+ bot inventory. Offers both instant bot trading and P2P marketplace for maximum flexibility.',
    features: ['1M+ bot inventory', 'P2P marketplace', 'Instant trades', 'Long-standing reputation', 'Multi-game support'],
    pros: ['Instant bot trading available', 'Massive inventory', 'Established since 2013', 'Both trading options'],
    cons: ['Competitive bot prices', 'UI can be cluttered', 'Variable fees'],
    paymentMethods: ['Bank transfer', 'Crypto', 'PayPal', 'Local methods'],
    color: '#ffca28',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'tradeit-gg',
    name: 'Tradeit.gg',
    url: 'https://tradeit.gg',
    logo: 'TRD',
    type: 'trading',
    fees: 'Platform fee varies',
    trustpilot: 4.8,
    founded: 2017,
    description: 'Fast instant bot trading platform for CS2 with high Trustpilot rating (4.8). Supports multiple games and delivers trades almost instantly.',
    features: ['Instant bot trades', 'Multi-game support', 'Fast payouts', 'High trust rating', 'Quick cash out'],
    pros: ['Fastest trades (4.8s average)', 'Highest Trustpilot rating', 'Multi-game platform', 'Instant cashout'],
    cons: ['Higher bot prices', 'Limited inventory control', 'Platform fees charged'],
    paymentMethods: ['PayPal', 'Bank transfer', 'Crypto', 'Game currency'],
    color: '#4caf50',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'dmarket',
    name: 'DMarket',
    url: 'https://dmarket.com',
    logo: 'DMK',
    type: 'both',
    fees: 'Up to 7% fees',
    trustpilot: 3.9,
    founded: 2015,
    description: 'Blockchain-based marketplace with up to 7% savings and both P2P and instant trading options. Innovative platform focused on security and transparency.',
    features: ['Blockchain security', 'P2P marketplace', 'Instant trading', 'Large inventory', 'Multi-game support'],
    pros: ['Blockchain-based', 'Both trading options', 'Up to 7% savings', 'Good inventory'],
    cons: ['Crypto-heavy approach', 'Less user-friendly interface', 'Lower popularity'],
    paymentMethods: ['Crypto', 'Bank transfer', 'PayPal', 'DMC tokens'],
    color: '#6c5ce7',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'skinsmonkey',
    name: 'SkinsMonkey',
    url: 'https://skinsmonkey.com',
    logo: 'SKM',
    type: 'trading',
    fees: 'Platform fees apply',
    trustpilot: 4.0,
    founded: 2019,
    description: 'Bot trading platform offering 35% deposit bonus and extremely fast trades (8.2 seconds average). Maintains 1.5M+ item inventory for quick access.',
    features: ['35% deposit bonus', '8.2s avg trade time', '1.5M+ inventory', 'Instant payouts', 'Crypto support'],
    pros: ['Generous welcome bonus', 'Ultra-fast trades', 'Large inventory', 'Good for quick flips'],
    cons: ['Bonus turnover requirements', 'Platform fees', 'Bot pricing higher'],
    paymentMethods: ['Crypto', 'PayPal', 'Bank transfer', 'E-wallets'],
    color: '#ff9800',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'whitemarket',
    name: 'White Market',
    url: 'https://whitemarket.io',
    logo: 'WMT',
    type: 'marketplace',
    fees: '0% buyer / 5% seller',
    trustpilot: 4.1,
    founded: 2020,
    description: 'P2P marketplace with revolutionary 0% buyer fees and only 5% seller fees. Integrated with WhiteBIT for crypto payments. Great value for both sides.',
    features: ['0% buyer fees', '5% seller fees', 'Crypto support', 'WhiteBIT integration', 'P2P trading'],
    pros: ['No buyer fees', 'Low seller fees', 'Crypto integration', 'Fair pricing model'],
    cons: ['Smaller inventory', 'Newer platform', 'Limited payment methods'],
    paymentMethods: ['Crypto', 'WhiteBIT', 'Bank transfer', 'USDT'],
    color: '#e0e0e0',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'bitskins',
    name: 'BitSkins',
    url: 'https://bitskins.com',
    logo: 'BSK',
    type: 'marketplace',
    fees: '5-7% fees',
    trustpilot: 3.8,
    founded: 2013,
    description: 'Long-running marketplace supporting multiple games including DOTA2 and CS2. Known for instant withdrawals and established reputation.',
    features: ['Long-running platform', 'Instant withdrawals', 'Multi-game support', 'Secure escrow', 'Global access'],
    pros: ['Instant cashout', 'Established brand', 'Multi-game platform', 'Global accessibility'],
    cons: ['Moderate fees', 'Slower trade times', 'Declining popularity'],
    paymentMethods: ['PayPal', 'Bank transfer', 'Crypto', 'Gift cards'],
    color: '#ff6b35',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'skinbaron',
    name: 'SkinBaron',
    url: 'https://skinbaron.de',
    logo: 'SBN',
    type: 'marketplace',
    fees: '5-10% fees',
    trustpilot: 4.4,
    founded: 2014,
    description: 'German-based P2P marketplace with strong trust in EU market. Offers PayPal support and reliable seller protection for European traders.',
    features: ['EU-based security', 'PayPal support', 'P2P marketplace', 'Seller protection', 'German regulations'],
    pros: ['High EU trust rating', 'PayPal available', 'Strong seller protection', 'EU regulated'],
    cons: ['Higher fees', 'EU-focused only', 'Slower international trades'],
    paymentMethods: ['PayPal', 'Bank transfer', 'Credit card', 'SEPA'],
    color: '#e53935',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'skinswap',
    name: 'SkinSwap',
    url: 'https://skinswap.gg',
    logo: 'SKW',
    type: 'trading',
    fees: 'Platform fees vary',
    trustpilot: 3.9,
    founded: 2018,
    description: 'Bot-based instant trading platform for CS2 and Rust with quick cash out options. Perfect for traders wanting fast execution without market waiting.',
    features: ['Bot trading', 'Instant trades', 'CS2 & Rust', 'Quick cashout', 'Multi-game'],
    pros: ['Instant execution', 'Simple interface', 'Multi-game support', 'Fast payouts'],
    cons: ['Bot pricing premium', 'Limited inventory control', 'Higher fees'],
    paymentMethods: ['PayPal', 'Bank transfer', 'Crypto', 'Gift cards'],
    color: '#8bc34a',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'waxpeer',
    name: 'Waxpeer',
    url: 'https://waxpeer.com',
    logo: 'WAX',
    type: 'marketplace',
    fees: '2-5% fees',
    trustpilot: 4.0,
    founded: 2016,
    description: 'P2P marketplace known for low fees and fast trades. Lightweight platform focused on efficiency with competitive pricing and quick transactions.',
    features: ['Low fees', 'P2P marketplace', 'Fast trades', 'Simple interface', 'Lightweight platform'],
    pros: ['Competitive fees', 'Quick trade execution', 'User-friendly', 'Good liquidity'],
    cons: ['Smaller community', 'Lower inventory', 'Limited features'],
    paymentMethods: ['Bank transfer', 'PayPal', 'Crypto', 'E-wallets'],
    color: '#ff9800',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'gamerpay',
    name: 'GamerPay',
    url: 'https://gamerpay.io',
    logo: 'GPY',
    type: 'marketplace',
    fees: '4-6% fees',
    trustpilot: 4.2,
    founded: 2019,
    description: 'EU-based marketplace with instant payouts and verified item systems. Focus on user verification and secure transactions for European players.',
    features: ['EU-based', 'Instant payouts', 'Verified items', 'Secure transactions', 'User verification'],
    pros: ['Quick payouts', 'Item verification system', 'EU based', 'Good trust rating'],
    cons: ['EU-focused', 'Moderate fees', 'Smaller inventory'],
    paymentMethods: ['Bank transfer', 'PayPal', 'SEPA', 'Crypto'],
    color: '#00c853',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'loot-farm',
    name: 'Loot.Farm',
    url: 'https://loot.farm',
    logo: 'LFM',
    type: 'trading',
    fees: 'Platform fees apply',
    trustpilot: 3.8,
    founded: 2017,
    description: 'Multi-game bot trading platform offering instant trades for CS2 and other titles. Fast execution with multi-game support for flexibility.',
    features: ['Bot trading', 'Multi-game support', 'Instant trades', 'Multiple games', 'Quick execution'],
    pros: ['Instant bot trades', 'Multi-game platform', 'Simple interface', 'Fast payouts'],
    cons: ['Higher bot premiums', 'Limited market control', 'Fewer payment options'],
    paymentMethods: ['PayPal', 'Bank transfer', 'Crypto', 'E-wallets'],
    color: '#ff7043',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'shadowpay',
    name: 'ShadowPay',
    url: 'https://shadowpay.com',
    logo: 'SHP',
    type: 'marketplace',
    fees: '3-6% fees',
    trustpilot: 3.7,
    founded: 2019,
    description: 'P2P marketplace with competitive fees and focus on privacy. Smaller but growing platform offering alternative to mainstream options.',
    features: ['P2P marketplace', 'Privacy-focused', 'Competitive fees', 'Anonymous trading', 'Crypto support'],
    pros: ['Privacy options', 'Competitive pricing', 'Growing community', 'Crypto support'],
    cons: ['Smaller platform', 'Lower trust rating', 'Limited support'],
    paymentMethods: ['Crypto', 'Bank transfer', 'PayPal', 'E-wallets'],
    color: '#9c27b0',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'lis-skins',
    name: 'LIS-SKINS',
    url: 'https://lis-skins.com',
    logo: 'LIS',
    type: 'marketplace',
    fees: '3-5% fees',
    trustpilot: 3.6,
    founded: 2017,
    description: 'P2P marketplace with competitive pricing and a streamlined interface. Popular in European and CIS regions with fast trade execution.',
    features: ['P2P marketplace', 'Fast trades', 'Competitive pricing', 'CIS region focused', 'Bank transfers'],
    pros: ['Competitive fees', 'Fast trade execution', 'Simple interface', 'Popular in CIS'],
    cons: ['Smaller inventory', 'Limited global reach', 'Fewer payment options'],
    paymentMethods: ['Bank transfer', 'Crypto', 'E-wallets', 'Local methods'],
    color: '#ff5722',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'swap-gg',
    name: 'Swap.gg',
    url: 'https://swap.gg',
    logo: 'SWP',
    type: 'trading',
    fees: 'Platform fees apply',
    trustpilot: 3.5,
    founded: 2018,
    description: 'Instant skin trading bot platform offering quick trades for CS2, Dota 2, and Rust items. Simple interface designed for fast swaps.',
    features: ['Instant bot trades', 'Multi-game support', 'Simple interface', 'Quick swaps', 'No registration required'],
    pros: ['Instant execution', 'Multi-game platform', 'Easy to use', 'No account needed'],
    cons: ['Higher premiums', 'Limited inventory', 'Bot pricing'],
    paymentMethods: ['Skins', 'Crypto'],
    color: '#7c4dff',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'cs-deals',
    name: 'CS.Deals',
    url: 'https://cs.deals',
    logo: 'CSD',
    type: 'marketplace',
    fees: '1-2% fees',
    trustpilot: 3.4,
    founded: 2018,
    description: 'P2P marketplace known for extremely low fees starting at just 1%. Offers trading, withdrawals, and a clean interface focused on value.',
    features: ['Ultra-low fees', 'P2P marketplace', 'Clean interface', 'Fast withdrawals', 'Multi-game'],
    pros: ['Lowest fees (1-2%)', 'Clean interface', 'Multi-game support', 'Fast cashout'],
    cons: ['Smaller inventory', 'Lower trust score', 'Limited support'],
    paymentMethods: ['Crypto', 'Bank transfer', 'E-wallets'],
    color: '#26a69a',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'lootbear',
    name: 'LootBear',
    url: 'https://lootbear.com',
    logo: 'LBR',
    type: 'both',
    fees: 'Platform fees vary',
    trustpilot: 3.7,
    founded: 2018,
    description: 'Unique platform offering both skin buying and skin rental services. Rent expensive skins to try before you buy, or earn passive income by renting out your inventory.',
    features: ['Skin rentals', 'Buy & sell', 'Passive income', 'Try before buy', 'Large catalog'],
    pros: ['Unique rental model', 'Try expensive skins', 'Earn passive income', 'Good selection'],
    cons: ['Rental fees add up', 'Complex pricing', 'Limited direct trading'],
    paymentMethods: ['Credit card', 'PayPal', 'Crypto', 'Bank transfer'],
    color: '#ffd54f',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
  {
    slug: 'haloskins',
    name: 'HaloSkins',
    url: 'https://haloskins.com',
    logo: 'HLS',
    type: 'marketplace',
    fees: '3-5% fees',
    trustpilot: null,
    founded: 2021,
    description: 'Newer CS2 skin marketplace offering competitive pricing and a modern interface. Growing platform with focus on user experience.',
    features: ['Modern interface', 'Competitive pricing', 'CS2 focused', 'Fast listings', 'Secure transactions'],
    pros: ['Modern UI', 'Competitive prices', 'Fast processing', 'CS2 focused'],
    cons: ['Newer platform', 'Smaller inventory', 'Less established trust'],
    paymentMethods: ['Crypto', 'Bank transfer', 'E-wallets'],
    color: '#ab47bc',
    referralUrl: '',
    promoCode: '',
    promoBonus: '',
    promoDetails: '',
  },
];

// ── Merge affiliate data from CMS-editable JSON ──────────────────────────
// The admin panel edits trading-sites-affiliate.json via Decap CMS.
// We merge those values into the hardcoded array so affiliate links stay up to date.
import affiliateData from './trading-sites-affiliate.json';

const affiliateMap = new Map(
  (affiliateData?.sites || []).map((s: any) => [s.slug, s])
);

for (const site of tradingSites) {
  const aff = affiliateMap.get(site.slug);
  if (aff) {
    if (aff.referralUrl) site.referralUrl = aff.referralUrl;
    if (aff.promoCode) site.promoCode = aff.promoCode;
    if (aff.promoBonus) site.promoBonus = aff.promoBonus;
    if (aff.promoDetails) site.promoDetails = aff.promoDetails;
  }
}

export function getTradingSiteBySlug(slug: string): TradingSite | undefined {
  return tradingSites.find(site => site.slug === slug);
}

export function getTradingSitesByType(type: 'marketplace' | 'trading' | 'both' | 'all'): TradingSite[] {
  if (type === 'all') return tradingSites;
  return tradingSites.filter(site => site.type === type);
}

export function getTradingSitesForComparison(): TradingSite[] {
  return tradingSites.sort((a, b) => {
    // Sort by trustpilot rating (nulls last), then by name
    if (a.trustpilot === null && b.trustpilot === null) return a.name.localeCompare(b.name);
    if (a.trustpilot === null) return 1;
    if (b.trustpilot === null) return -1;
    return b.trustpilot - a.trustpilot;
  });
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  });
}

export function breadcrumbSchema(crumbs: { name?: string; label?: string; url?: string }[]) {
  const BASE = 'https://csdb.gg';
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => {
      const entry: Record<string, any> = { '@type': 'ListItem', position: i + 1, name: c.name || (c as any).label || '' };
      if (c.url) entry.item = c.url.startsWith('http') ? c.url : `${BASE}${c.url}`;
      return entry;
    }),
  });
}
