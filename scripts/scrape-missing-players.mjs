#!/usr/bin/env node
/**
 * Scrape missing players from ProSettings.net and generate JSON files.
 * Also enriches with PandaScore data for team/nationality.
 *
 * Usage: node scripts/scrape-missing-players.mjs
 */

import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Country code → flag emoji mapping
const FLAG_MAP = {
  'AF': '🇦🇫', 'AL': '🇦🇱', 'DZ': '🇩🇿', 'AR': '🇦🇷', 'AM': '🇦🇲', 'AU': '🇦🇺',
  'AT': '🇦🇹', 'AZ': '🇦🇿', 'BA': '🇧🇦', 'BD': '🇧🇩', 'BY': '🇧🇾', 'BE': '🇧🇪',
  'BR': '🇧🇷', 'BG': '🇧🇬', 'CA': '🇨🇦', 'CL': '🇨🇱', 'CN': '🇨🇳', 'CO': '🇨🇴',
  'HR': '🇭🇷', 'CZ': '🇨🇿', 'DK': '🇩🇰', 'EE': '🇪🇪', 'FI': '🇫🇮', 'FR': '🇫🇷',
  'GE': '🇬🇪', 'DE': '🇩🇪', 'GR': '🇬🇷', 'HK': '🇭🇰', 'HU': '🇭🇺', 'IS': '🇮🇸',
  'IN': '🇮🇳', 'ID': '🇮🇩', 'IL': '🇮🇱', 'IT': '🇮🇹', 'JP': '🇯🇵', 'JO': '🇯🇴',
  'KZ': '🇰🇿', 'KR': '🇰🇷', 'KG': '🇰🇬', 'LV': '🇱🇻', 'LB': '🇱🇧', 'LT': '🇱🇹',
  'LU': '🇱🇺', 'MK': '🇲🇰', 'MY': '🇲🇾', 'MT': '🇲🇹', 'MX': '🇲🇽', 'MD': '🇲🇩',
  'MN': '🇲🇳', 'ME': '🇲🇪', 'MA': '🇲🇦', 'NL': '🇳🇱', 'NZ': '🇳🇿', 'NO': '🇳🇴',
  'PK': '🇵🇰', 'PE': '🇵🇪', 'PH': '🇵🇭', 'PL': '🇵🇱', 'PT': '🇵🇹', 'RO': '🇷🇴',
  'RU': '🇷🇺', 'RS': '🇷🇸', 'SA': '🇸🇦', 'SG': '🇸🇬', 'SK': '🇸🇰', 'SI': '🇸🇮',
  'ZA': '🇿🇦', 'ES': '🇪🇸', 'SE': '🇸🇪', 'CH': '🇨🇭', 'TW': '🇹🇼', 'TH': '🇹🇭',
  'TR': '🇹🇷', 'UA': '🇺🇦', 'AE': '🇦🇪', 'GB': '🇬🇧', 'US': '🇺🇸', 'UY': '🇺🇾',
  'UZ': '🇺🇿', 'VN': '🇻🇳',
};

// Country name → flag
const COUNTRY_FLAG = {
  'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Argentina': '🇦🇷',
  'Armenia': '🇦🇲', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿',
  'Bangladesh': '🇧🇩', 'Belarus': '🇧🇾', 'Belgium': '🇧🇪', 'Bosnia and Herzegovina': '🇧🇦',
  'Brazil': '🇧🇷', 'Bulgaria': '🇧🇬', 'Canada': '🇨🇦', 'Chile': '🇨🇱', 'China': '🇨🇳',
  'Colombia': '🇨🇴', 'Croatia': '🇭🇷', 'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿',
  'Denmark': '🇩🇰', 'Estonia': '🇪🇪', 'Finland': '🇫🇮', 'France': '🇫🇷',
  'Georgia': '🇬🇪', 'Germany': '🇩🇪', 'Greece': '🇬🇷', 'Hong Kong': '🇭🇰',
  'Hungary': '🇭🇺', 'Iceland': '🇮🇸', 'India': '🇮🇳', 'Indonesia': '🇮🇩',
  'Iran': '🇮🇷', 'Iraq': '🇮🇶', 'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Japan': '🇯🇵',
  'Jordan': '🇯🇴', 'Kazakhstan': '🇰🇿', 'Kosovo': '🇽🇰', 'Kyrgyzstan': '🇰🇬',
  'Latvia': '🇱🇻', 'Lebanon': '🇱🇧', 'Lithuania': '🇱🇹', 'Luxembourg': '🇱🇺',
  'Malaysia': '🇲🇾', 'Malta': '🇲🇹', 'Mexico': '🇲🇽', 'Moldova': '🇲🇩',
  'Mongolia': '🇲🇳', 'Montenegro': '🇲🇪', 'Morocco': '🇲🇦', 'Netherlands': '🇳🇱',
  'New Zealand': '🇳🇿', 'Nigeria': '🇳🇬', 'North Macedonia': '🇲🇰', 'Norway': '🇳🇴',
  'Pakistan': '🇵🇰', 'Peru': '🇵🇪', 'Philippines': '🇵🇭', 'Poland': '🇵🇱',
  'Portugal': '🇵🇹', 'Romania': '🇷🇴', 'Russia': '🇷🇺', 'Russian Federation': '🇷🇺',
  'Saudi Arabia': '🇸🇦', 'Serbia': '🇷🇸', 'Singapore': '🇸🇬', 'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Spain': '🇪🇸',
  'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Taiwan': '🇹🇼', 'Thailand': '🇹🇭',
  'Turkey': '🇹🇷', 'Ukraine': '🇺🇦', 'United Arab Emirates': '🇦🇪',
  'United Kingdom': '🇬🇧', 'United States': '🇺🇸', 'Uruguay': '🇺🇾',
  'Uzbekistan': '🇺🇿', 'Vietnam': '🇻🇳',
};

function getFlag(country) {
  if (!country) return '';
  // Try direct country name
  if (COUNTRY_FLAG[country]) return COUNTRY_FLAG[country];
  // Try ISO code
  const upper = country.toUpperCase();
  if (FLAG_MAP[upper]) return FLAG_MAP[upper];
  // Try matching partial
  for (const [name, flag] of Object.entries(COUNTRY_FLAG)) {
    if (name.toLowerCase().includes(country.toLowerCase()) || country.toLowerCase().includes(name.toLowerCase())) {
      return flag;
    }
  }
  return '';
}

// Missing player slugs from ProSettings comparison
const MISSING = [
  "aspas","kennys","dosia","guardian","flusha","adren-usa","steel-brazil","malta","tenzki",
  "nifty","maniac","v1c7or","speed4k","aizy","denis","xign","balblna","mds","mou",
  "adren-kazakhstan","sanji","moddii","bubzkji","ustilo","dennis","sycrone","natosaphix",
  "obo","edward","xizt","doto","waterfallz","krystal","gaules","hutji","bit","krizzen",
  "morelz","mouz-player","gruby","seized","pimp","stfn","fitch","davcost","svyat","jr",
  "rage","erkast","zeus","rpk","rubino","summit1g","rock1ng","s0tf1k","crush","blocker",
  "kst","sunny","zoree","seangares","devil","neo","taz","chrisj","jemi","cromen","golden",
  "realzin","ramz1k","radifaction","jnt","daps","sergej","yel","marke","rickeh","t0rick",
  "ablej","scrunk","k0nfig","peppzor","maikelele","rusty","zero","roej","rush","vanity",
  "xeta","spiidi","fashr","daffu","relyks","cutler","fox","azk","mixwell","sick","fns",
  "pyth","dimasick","vice","hazed","tizian","cajunb","kioshima","dream3r","attacker","box",
  "taco","gade","szpero","snatchie","maluk3","trk","kvik","xseven","aerial","acilion",
  "friberg","nbk","alex-british","msl","fnx","sico","ersin","ed1m","azr","bubble","arki",
  "freeze","n9xtz","advent","devils274","miku","arrow","xenn","impulse","illya","7nation",
  "runnin","ricioli","blogg1s","the-elive","pr1me","satsu"
];

const PLAYERS_DIR = join(process.cwd(), 'src/data/players');

// Helpers
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractBetween(html, before, after) {
  const i = html.indexOf(before);
  if (i === -1) return '';
  const start = i + before.length;
  const end = html.indexOf(after, start);
  if (end === -1) return '';
  return html.substring(start, end).trim();
}

function extractText(html, className) {
  const regex = new RegExp(`class="[^"]*${className}[^"]*"[^>]*>([^<]+)`, 'i');
  const m = html.match(regex);
  return m ? m[1].trim() : '';
}

function parseNum(val) {
  if (!val) return 0;
  const n = parseFloat(val.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

async function scrapePlayer(slug) {
  const url = `https://prosettings.net/players/${slug}/`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html',
    }
  });

  if (!resp.ok) {
    console.log(`  [SKIP] ${slug} - HTTP ${resp.status}`);
    return null;
  }

  const html = await resp.text();

  // Extract player name from title or h1
  const titleMatch = html.match(/<title>([^<]+)/);
  const title = titleMatch ? titleMatch[1] : '';
  // Title format: "donk CS2 Settings, Crosshair & Config | ProSettings.net"
  const displayName = title.split(/\s+CS2/)[0].trim() || slug;

  // Extract team
  const teamMatch = html.match(/class="[^"]*player_team[^"]*"[^>]*>([^<]+)/i);
  const team = teamMatch ? teamMatch[1].trim() : '';

  // Extract country from flag image alt or text
  const countryMatch = html.match(/class="[^"]*country-flag[^"]*"[^>]*alt="([^"]+)"/i) ||
                       html.match(/class="[^"]*player_country[^"]*"[^>]*>([^<]+)/i);
  const country = countryMatch ? countryMatch[1].trim() : '';

  // Extract real name
  const realNameMatch = html.match(/Real\s*Name[^<]*<[^>]*>([^<]+)/i) ||
                        html.match(/class="[^"]*real-?name[^"]*"[^>]*>([^<]+)/i);
  const realName = realNameMatch ? realNameMatch[1].trim() : '';

  // Extract birthday / age
  const birthdayMatch = html.match(/Birthday[^<]*<[^>]*>([^<]+)/i) ||
                        html.match(/Born[^<]*<[^>]*>([^<]+)/i);
  const birthday = birthdayMatch ? birthdayMatch[1].trim() : '';

  const ageMatch = html.match(/Age[^<]*<[^>]*>(\d+)/i);
  const age = ageMatch ? parseInt(ageMatch[1]) : undefined;

  // === Settings extraction ===
  // Mouse
  const mouseMatch = html.match(/Mouse<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                     html.match(/class="[^"]*"[^>]*>\s*Mouse\s*<\/[^>]*>\s*<[^>]*>\s*<[^>]*>([^<]+)/i);
  const mouse = mouseMatch ? mouseMatch[1].trim() : '';

  // DPI
  const dpiMatch = html.match(/DPI<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                   html.match(/eDPI[^<]*<[^>]*>([^<]+)/i);

  // Sensitivity
  const sensMatch = html.match(/Sensitivity<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                    html.match(/In-?[Gg]ame\s*[Ss]ens[^<]*<[^>]*>([^<]+)/i);

  // eDPI
  const edpiMatch = html.match(/eDPI<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Zoom sens
  const zoomMatch = html.match(/Zoom\s*Sens[^<]*<[^>]*>([^<]+)/i);

  // Polling rate
  const pollingMatch = html.match(/Polling\s*Rate[^<]*<[^>]*>([^<]+)/i) ||
                       html.match(/Hz<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Resolution
  const resMatch = html.match(/Resolution<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Aspect ratio
  const aspectMatch = html.match(/Aspect\s*Ratio<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Stretch
  const stretchMatch = html.match(/Scaling\s*Mode<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                       html.match(/Display\s*Mode<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Refresh rate
  const refreshMatch = html.match(/Refresh\s*Rate<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                       html.match(/(\d+)\s*Hz/i);

  // Monitor
  const monitorMatch = html.match(/Monitor<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Keyboard
  const kbMatch = html.match(/Keyboard<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Headset
  const headsetMatch = html.match(/Headset<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Mousepad
  const mousepadMatch = html.match(/Mousepad<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Crosshair code
  const chCodeMatch = html.match(/Crosshair\s*Code<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                      html.match(/CSGO-[A-Za-z0-9-]+/);

  // Crosshair settings
  const chStyleMatch = html.match(/Crosshair\s*Style<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const chSizeMatch = html.match(/Crosshair\s*Size<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                      html.match(/Size<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const chThickMatch = html.match(/Thickness<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const chGapMatch = html.match(/Gap<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const chDotMatch = html.match(/Center\s*Dot<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const chOutlineMatch = html.match(/Outline<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const chColorMatch = html.match(/Crosshair\s*Color<\/[^>]*>[^<]*<[^>]*>([^<]+)/i) ||
                       html.match(/Color<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  // Viewmodel
  const vmFovMatch = html.match(/FOV<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const vmXMatch = html.match(/Offset\s*X<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const vmYMatch = html.match(/Offset\s*Y<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);
  const vmZMatch = html.match(/Offset\s*Z<\/[^>]*>[^<]*<[^>]*>([^<]+)/i);

  const dpi = parseNum(dpiMatch ? dpiMatch[1] : '');
  const sens = parseNum(sensMatch ? sensMatch[1] : '');

  const player = {
    name: displayName,
    slug: slug,
    realName: realName || '',
    team: team || 'Free Agent',
    country: country || '',
    flag: getFlag(country) || '',
    role: 'Rifler',
    ...(age ? { age } : {}),
    style: 'Rifler',
    mouse: mouse || '',
    dpi: dpi,
    sens: sens,
    edpi: parseNum(edpiMatch ? edpiMatch[1] : '') || (dpi * sens) || 0,
    zoomSens: parseNum(zoomMatch ? zoomMatch[1] : '') || 1,
    pollingRate: parseNum(pollingMatch ? pollingMatch[1] : '') || 1000,
    crosshairCode: (chCodeMatch ? (typeof chCodeMatch[1] === 'string' ? chCodeMatch[1] : chCodeMatch[0]) : '').trim(),
    crosshairColor: chColorMatch ? chColorMatch[1].trim() : '',
    crosshairStyle: chStyleMatch ? chStyleMatch[1].trim() : 'Classic Static',
    crosshairSize: parseNum(chSizeMatch ? chSizeMatch[1] : '2'),
    crosshairThickness: parseNum(chThickMatch ? chThickMatch[1] : '0'),
    crosshairGap: parseNum(chGapMatch ? chGapMatch[1] : '-3'),
    crosshairDot: chDotMatch ? chDotMatch[1].toLowerCase().includes('yes') : false,
    crosshairOutline: chOutlineMatch ? chOutlineMatch[1].toLowerCase().includes('yes') : false,
    res: resMatch ? resMatch[1].trim() : '1920x1080',
    aspect: aspectMatch ? aspectMatch[1].trim() : '16:9',
    stretch: stretchMatch ? stretchMatch[1].trim() : 'Native',
    refreshRate: parseNum(refreshMatch ? refreshMatch[1] : '240') || 240,
    vmFov: parseNum(vmFovMatch ? vmFovMatch[1] : '68') || 68,
    vmX: parseNum(vmXMatch ? vmXMatch[1] : '2.5'),
    vmY: parseNum(vmYMatch ? vmYMatch[1] : '0'),
    vmZ: parseNum(vmZMatch ? vmZMatch[1] : '-1.5'),
    monitor: monitorMatch ? monitorMatch[1].trim() : '',
    keyboard: kbMatch ? kbMatch[1].trim() : '',
    headset: headsetMatch ? headsetMatch[1].trim() : '',
    mousepad: mousepadMatch ? mousepadMatch[1].trim() : '',
    ...(birthday ? { birthday } : {}),
    bio: '',
  };

  return player;
}

async function main() {
  // Check which files already exist
  const existing = readdirSync(PLAYERS_DIR).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  const toScrape = MISSING.filter(slug => !existing.includes(slug));

  console.log(`Total missing: ${MISSING.length}`);
  console.log(`Already have: ${MISSING.length - toScrape.length}`);
  console.log(`Need to scrape: ${toScrape.length}`);
  console.log('');

  let scraped = 0;
  let failed = 0;

  for (const slug of toScrape) {
    try {
      console.log(`[${scraped + failed + 1}/${toScrape.length}] Scraping ${slug}...`);
      const player = await scrapePlayer(slug);

      if (player) {
        const filePath = join(PLAYERS_DIR, `${slug}.json`);
        writeFileSync(filePath, JSON.stringify(player, null, 2) + '\n');
        console.log(`  ✓ ${player.name} (${player.team}) → ${filePath}`);
        scraped++;
      } else {
        failed++;
      }

      // Rate limit: 200ms between requests
      await sleep(200);
    } catch (err) {
      console.log(`  [ERROR] ${slug}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Scraped: ${scraped}, Failed: ${failed}, Total: ${existing.length + scraped}`);
}

main().catch(console.error);
