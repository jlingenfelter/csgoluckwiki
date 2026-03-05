/**
 * Fetch sticker, autograph, and music kit data from PriceEmpire
 * Maps items to their capsules for the case simulator
 * Run: PRICEMPIRE_API_KEY=xxx node scripts/fetch-sticker-data.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.PRICEMPIRE_API_KEY;
const OUTPUT_PATH = join(__dirname, '..', 'src', 'lib', 'sticker-data.json');

if (!API_KEY) {
  console.error('❌ Set PRICEMPIRE_API_KEY env variable');
  process.exit(1);
}

function resolveImageUrl(imgPath) {
  if (!imgPath) return null;
  if (typeof imgPath === 'string' && imgPath.startsWith('http')) return imgPath;
  if (typeof imgPath === 'string' && imgPath.startsWith('/')) return `https://community.steamstatic.com${imgPath}`;
  if (typeof imgPath === 'string' && imgPath.startsWith('-')) return `https://community.steamstatic.com/economy/image/${imgPath}`;
  return null;
}

// ── Capsule ID → image folder mapping ──
const CAPSULE_FOLDER_MAP = {
  // Community / Collab capsules
  'warhammer-40000-sticker-capsule':                     'warhammer',
  'warhammer-40000-traitor-astartes-sticker-capsule':   'warhammer',
  'warhammer-40000-adeptus-astartes-sticker-capsule':   'warhammer',
  'warhammer-40000-imperium-sticker-capsule':            'warhammer',
  'warhammer-40000-xenos-sticker-capsule':               'warhammer',
  'feral-predators-capsule':                'feral_predators',
  'halo-capsule':                           'halo',
  'half-life-alyx-sticker-capsule':         'alyx',
  'shattered-web-sticker-capsule':          'shattered_web',
  'cs20-sticker-capsule':                   'cs20',
  '10-year-birthday-sticker-capsule':       'csgo10',
  'slid3-capsule':                          'slid3_capsule',
  'pinups-capsule':                         'pinups_capsule',
  'poorly-drawn-capsule':                   'poorly_drawn',
  'skill-groups-capsule':                   'skillgroup_capsule',
  'metal-capsule':                          'team_roles_capsule',
  'chicken-capsule':                        'chicken_capsule',
  'bestiary-capsule':                       'bestiary_capsule',
  'boardroom-sticker-capsule':              'community2022',
  'high-noon-capsule':                      'community2022',
  'sans-titre-capsule':                     'community2022',
  'ambush-sticker-capsule':                 'community2022',
  'broken-fang-sticker-collection':         'broken_fang',
  'operation-riptide-sticker-collection':   'op_riptide',
  'watercolor-capsule':                     'community01',
  'perfect-world-sticker-capsule-1':        'community',
  'perfect-world-sticker-capsule-2':        'community02',
  'sugarface-capsule':                      'sugarface_capsule',
  'enfu-sticker-capsule':                   'enfu_capsule',
  'community-sticker-capsule-1':            'standard',
  'craft-sticker-capsule':                  'recoil',
  'elemental-craft-sticker-capsule':        'spring2022',

  // Tournament sticker capsules
  'budapest-2025-legends-sticker-capsule':      'bud2025',
  'budapest-2025-challengers-sticker-capsule':  'bud2025',
  'budapest-2025-contenders-sticker-capsule':   'bud2025',
  'budapest-2025-champions-sticker-capsule':    'bud2025',
  'austin-2025-legends-sticker-capsule':        'aus2025',
  'austin-2025-challengers-sticker-capsule':    'aus2025',
  'austin-2025-contenders-sticker-capsule':     'aus2025',
  'austin-2025-champions-sticker-capsule':      'aus2025',
  'shanghai-2024-legends-sticker-capsule':      'sha2024',
  'shanghai-2024-challengers-sticker-capsule':  'sha2024',
  'shanghai-2024-contenders-sticker-capsule':   'sha2024',
  'shanghai-2024-champions-sticker-capsule':    'sha2024',
  'copenhagen-2024-legends-sticker-capsule':    'cph2024',
  'copenhagen-2024-challengers-sticker-capsule':'cph2024',
  'copenhagen-2024-contenders-sticker-capsule': 'cph2024',
  'copenhagen-2024-champions-sticker-capsule':  'cph2024',
  'paris-2023-legends-sticker-capsule':         'paris2023',
  'paris-2023-challengers-sticker-capsule':     'paris2023',
  'paris-2023-contenders-sticker-capsule':      'paris2023',
  'paris-2023-champions-sticker-capsule':       'paris2023',
  'rio-2022-legends-sticker-capsule':           'rio2022',
  'rio-2022-challengers-sticker-capsule':       'rio2022',
  'rio-2022-contenders-sticker-capsule':        'rio2022',
  'rio-2022-champions-sticker-capsule':         'rio2022',
  'antwerp-2022-legends-sticker-capsule':       'antwerp2022',
  'antwerp-2022-challengers-sticker-capsule':   'antwerp2022',
  'antwerp-2022-contenders-sticker-capsule':    'antwerp2022',
  'antwerp-2022-champions-sticker-capsule':     'antwerp2022',
  'stockholm-2021-legends-sticker-capsule':     'stockh2021',
  'stockholm-2021-challengers-sticker-capsule': 'stockh2021',
  'stockholm-2021-contenders-sticker-capsule':  'stockh2021',
  'stockholm-2021-champions-sticker-capsule':   'stockh2021',
  '2020-rmr-legends-sticker-capsule':           'rmr2020',
  '2020-rmr-challengers-sticker-capsule':       'rmr2020',
  '2020-rmr-contenders-sticker-capsule':        'rmr2020',
  'berlin-2019-legends-sticker-capsule':        'berlin2019',
  'berlin-2019-challengers-sticker-capsule':    'berlin2019',
  'berlin-2019-minor-challengers-sticker-capsule': 'berlin2019',
  'berlin-2019-returning-challengers-sticker-capsule': 'berlin2019',
  'katowice-2019-legends-sticker-capsule':      'katowice2019',
  'katowice-2019-challengers-sticker-capsule':  'katowice2019',
  'katowice-2019-minor-challengers-sticker-capsule': 'katowice2019',
  'katowice-2019-returning-challengers-sticker-capsule': 'katowice2019',
  'london-2018-legends-sticker-capsule':        'london2018',
  'london-2018-challengers-sticker-capsule':    'london2018',
  'london-2018-minor-challengers-sticker-capsule': 'london2018',
  'london-2018-returning-challengers-sticker-capsule': 'london2018',
  'boston-2018-legends-sticker-capsule':         'boston2018',
  'boston-2018-challengers-sticker-capsule':     'boston2018',
  'boston-2018-minor-challengers-sticker-capsule': 'boston2018',
  'boston-2018-returning-challengers-sticker-capsule': 'boston2018',
  'krakow-2017-legends-sticker-capsule':        'krakow2017',
  'krakow-2017-challengers-sticker-capsule':    'krakow2017',
  'atlanta-2017-legends-sticker-capsule':       'atlanta2017',
  'atlanta-2017-challengers-sticker-capsule':   'atlanta2017',
  'cologne-2016-legends-sticker-capsule':       'cologne2016',
  'cologne-2016-challengers-sticker-capsule':   'cologne2016',
  'mlg-columbus-2016-legends-sticker-capsule':  'columbus2016',
  'mlg-columbus-2016-challengers-sticker-capsule': 'columbus2016',
  'dreamhack-cluj-napoca-2015-legends-sticker-capsule': 'cluj2015',
  'dreamhack-cluj-napoca-2015-challengers-sticker-capsule': 'cluj2015',
  'esl-one-cologne-2015-legends-sticker-capsule': 'cologne2015',
  'esl-one-cologne-2015-challengers-sticker-capsule': 'cologne2015',
  'esl-one-katowice-2015-legends-sticker-capsule': 'eslkatowice2015',
  'esl-one-katowice-2015-challengers-sticker-capsule': 'eslkatowice2015',
  'dreamhack-2014-legends-sticker-capsule':     'dhw2014',
  'dreamhack-2014-challengers-sticker-capsule': 'dhw2014',
  'esl-one-cologne-2014-legends-sticker-capsule': 'cologne2014',
  'esl-one-cologne-2014-challengers-sticker-capsule': 'cologne2014',
  'ems-one-katowice-2014-legends-sticker-capsule': 'emskatowice2014',
  'ems-one-katowice-2014-challengers-sticker-capsule': 'emskatowice2014',

  // Autograph capsules — same tournament folders
  'budapest-2025-contenders-autograph-capsule': 'bud2025',
  'budapest-2025-challengers-autograph-capsule':'bud2025',
  'budapest-2025-legends-autograph-capsule':    'bud2025',
  'budapest-2025-champions-autograph-capsule':  'bud2025',
  'austin-2025-contenders-autograph-capsule':   'aus2025',
  'austin-2025-challengers-autograph-capsule':  'aus2025',
  'austin-2025-legends-autograph-capsule':      'aus2025',
  'austin-2025-champions-autograph-capsule':    'aus2025',
  'shanghai-2024-contenders-autograph-capsule': 'sha2024',
  'shanghai-2024-challengers-autograph-capsule':'sha2024',
  'shanghai-2024-legends-autograph-capsule':    'sha2024',
  'shanghai-2024-champions-autograph-capsule':  'sha2024',
  'copenhagen-2024-contenders-autograph-capsule':'cph2024',
  'copenhagen-2024-challengers-autograph-capsule':'cph2024',
  'copenhagen-2024-legends-autograph-capsule':  'cph2024',
  'copenhagen-2024-champions-autograph-capsule':'cph2024',
  'paris-2023-contenders-autograph-capsule':    'paris2023',
  'paris-2023-challengers-autograph-capsule':   'paris2023',
  'paris-2023-legends-autograph-capsule':       'paris2023',
  'paris-2023-champions-autograph-capsule':     'paris2023',
  'rio-2022-contenders-autograph-capsule':      'rio2022',
  'rio-2022-challengers-autograph-capsule':     'rio2022',
  'rio-2022-legends-autograph-capsule':         'rio2022',
  'rio-2022-champions-autograph-capsule':       'rio2022',
  'antwerp-2022-contenders-autograph-capsule':  'antwerp2022',
  'antwerp-2022-challengers-autograph-capsule': 'antwerp2022',
  'antwerp-2022-legends-autograph-capsule':     'antwerp2022',
  'antwerp-2022-champions-autograph-capsule':   'antwerp2022',
  'stockholm-2021-contenders-autograph-capsule':'stockh2021',
  'stockholm-2021-challengers-autograph-capsule':'stockh2021',
  'stockholm-2021-legends-autograph-capsule':   'stockh2021',
  'stockholm-2021-champions-autograph-capsule': 'stockh2021',
};

// Sticker rarity classification
function getStickerRarity(name) {
  if (name.includes('(Gold)') || name.includes('(Contraband)')) return 'special';
  if (name.includes('(Holo)') || name.includes('(Foil)') || name.includes('(Lenticular)')) return 'covert';
  if (name.includes('(Glitter)') || name.includes('(Embroidered)')) return 'classified';
  if (name.includes('(Shimmer)') || name.includes('(Champion)')) return 'restricted';
  return 'mil-spec';
}

async function main() {
  console.log('Fetching item data from PriceEmpire...');

  const url = `https://api.pricempire.com/v4/paid/items/prices?app_id=730&api_key=${API_KEY}&sources=buff163`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

  if (!res.ok) {
    console.error(`❌ API error: ${res.status}`);
    process.exit(1);
  }

  const allItems = await res.json();
  console.log(`Total items from API: ${allItems.length}`);

  // ── Fetch proper Steam CDN images from images endpoint ──
  console.log('Fetching images from PriceEmpire images endpoint...');
  const imgUrl = `https://api.pricempire.com/v4/paid/items/images?app_id=730&api_key=${API_KEY}`;
  const imgRes = await fetch(imgUrl, { headers: { 'Accept': 'application/json' } });
  const imgData = imgRes.ok ? await imgRes.json() : {};
  const imgSource = imgData?.images || imgData || {};
  console.log(`Image entries from API: ${Object.keys(imgSource).length}`);

  // Build image lookup: market_hash_name → Steam CDN URL
  const imageMap = {};
  for (const [name, val] of Object.entries(imgSource)) {
    let url = null;
    if (typeof val === 'string' && val.length > 5) {
      url = resolveImageUrl(val);
    } else if (val && typeof val === 'object') {
      const cdnPath = val.steam || val.cdn || null;
      if (cdnPath) url = cdnPath.startsWith('http') ? cdnPath : resolveImageUrl(cdnPath);
    }
    if (url) imageMap[name] = url;
  }
  console.log(`Resolved ${Object.keys(imageMap).length} image URLs`);

  const stickerItems = allItems.filter(i => i.market_hash_name.startsWith('Sticker | '));
  const musicItems = allItems.filter(i => i.market_hash_name.startsWith('Music Kit'));
  console.log(`Sticker items: ${stickerItems.length}, Music kits: ${musicItems.length}`);

  // ── Build folder → stickers index ──
  const pools = {};
  let imgHit = 0, imgMiss = 0;

  for (const s of stickerItems) {
    const img = s.image || '';
    const parts = img.split('/');
    const folder = parts.length >= 6 ? parts[5] : 'unknown';
    if (!pools[folder]) pools[folder] = [];
    const price = s.prices?.[0]?.price || 0;
    // Prefer Steam CDN image from images endpoint, fall back to panorama path
    const steamImg = imageMap[s.market_hash_name] || null;
    if (steamImg) imgHit++; else imgMiss++;
    pools[folder].push({
      n: s.market_hash_name.replace('Sticker | ', ''),
      r: getStickerRarity(s.market_hash_name),
      p: price,
      i: steamImg,
    });
  }
  console.log(`Sticker images: ${imgHit} from CDN, ${imgMiss} missing`);

  // ── Music kit pool ──
  const mkPool = musicItems.map(m => ({
    n: m.market_hash_name.replace(/^(StatTrak™?\s*)?Music Kit\s*\|\s*/, ''),
    r: m.market_hash_name.includes('StatTrak') ? 'classified' : 'mil-spec',
    p: m.prices?.[0]?.price || 0,
    i: imageMap[m.market_hash_name] || null,
  }));

  // ── Build capsule→pool mapping ──
  // capsuleMap: capsuleId → poolKey
  const capsuleMap = {};
  const usedPools = new Set();

  for (const [capsuleId, folder] of Object.entries(CAPSULE_FOLDER_MAP)) {
    if (pools[folder] && pools[folder].length > 0) {
      capsuleMap[capsuleId] = folder;
      usedPools.add(folder);
    }
  }

  // Add music kit pools
  if (mkPool.length > 0) {
    pools['_music'] = mkPool;
    usedPools.add('_music');
  }

  // ── Output: only include used pools ──
  const outputPools = {};
  for (const key of usedPools) {
    outputPools[key] = pools[key];
  }

  const output = {
    pools: outputPools,      // poolKey → [items]
    map: capsuleMap,          // capsuleId → poolKey
  };

  // Stats
  let uniqueItems = 0;
  for (const items of Object.values(outputPools)) uniqueItems += items.length;
  console.log(`\nPools: ${Object.keys(outputPools).length} unique pools`);
  console.log(`Capsules mapped: ${Object.keys(capsuleMap).length}`);
  console.log(`Unique items: ${uniqueItems}`);

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 0));
  const size = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Wrote ${size}MB to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
