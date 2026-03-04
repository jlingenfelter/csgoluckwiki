import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'lib', 'skins-data.json'), 'utf8'));

const slugs = ['ak-47-fire-serpent', 'awp-dragon-lore', 'desert-eagle-blaze', 'ak-47-redline', 'awp-asiimov'];
for (const slug of slugs) {
  const skin = data.skins.find(s => s.slug === slug);
  if (!skin) { console.log(slug + ' → NOT FOUND'); continue; }
  console.log(`\n${skin.weapon} | ${skin.name}:`);
  for (const p of skin.prices) {
    const steam = p.providers?.steam;
    const buff = p.providers?.buff163;
    const skinport = p.providers?.skinport;
    const csfloat = p.providers?.csfloat;
    console.log(`  ${p.wear}: Steam=$${steam ?? 'N/A'}, Buff=$${buff ?? 'N/A'}, Skinport=$${skinport ?? 'N/A'}, CSFloat=$${csfloat ?? 'N/A'}, Listed=$${p.price.toFixed(2)}`);
  }
}
console.log('\nFetched at:', data.fetchedAt);
