#!/usr/bin/env node
// ONE-SHOT bootstrap. Turns the existing assets/avatars/*.png convention into a
// starting catalog: `<slug>.png` becomes the global default `base`, and an
// existing `<slug>-returnee.png` becomes a total-drama portrait `td-returnee`
// (that is what the -returnee art has always been used for). Run once; the
// output is committed and hand-edited from then on. Running it again would
// overwrite authored labels, so it refuses when the catalog already exists.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'assets/avatars');
const OUT = path.join(DIR, 'portrait-catalog.json');
if (fs.existsSync(OUT) && !process.argv.includes('--force')) {
  console.error('portrait-catalog.json already exists - refusing to overwrite');
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.png'));
const bases = files.filter(f => !f.endsWith('-returnee.png')).map(f => f.slice(0, -4)).sort();
const returnees = new Set(files.filter(f => f.endsWith('-returnee.png')).map(f => f.slice(0, -'-returnee.png'.length)));

const players = {};
for (const slug of bases) {
  const portraits = [{ id: 'base', show: 'global', label: 'Profile default', file: `${slug}.png` }];
  const defaults = { global: 'base' };
  if (returnees.has(slug)) {
    // NOT a total-drama default: a returning player picks this per season now.
    portraits.push({ id: 'td-returnee', show: 'total-drama', label: 'Returning-player look', file: `${slug}-returnee.png` });
  }
  players[slug] = { defaults, portraits };
}
// A -returnee file whose base is missing would otherwise be silently orphaned.
for (const slug of returnees) {
  if (players[slug]) continue;
  players[slug] = {
    defaults: { global: 'base' },
    portraits: [{ id: 'base', show: 'global', label: 'Returning-player look', file: `${slug}-returnee.png` }],
  };
}
fs.writeFileSync(OUT, JSON.stringify({ schemaVersion: 1, players }, null, 2) + '\n');
console.log(`seeded ${Object.keys(players).length} players, ${returnees.size} with returnee art`);
