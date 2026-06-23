// Regenerates assets/avatars/returnee-manifest.json from the files on disk.
// Run after adding/removing any {slug}-returnee.png:  node tools/gen-returnee-manifest.mjs
import { readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'assets', 'avatars');
const slugs = readdirSync(dir)
  .filter(f => f.endsWith('-returnee.png'))
  .map(f => f.slice(0, -'-returnee.png'.length))
  .sort();

const out = join(dir, 'returnee-manifest.json');
writeFileSync(out, JSON.stringify(slugs) + '\n');
console.log(`Wrote ${slugs.length} returnee slug(s) to ${out}: ${slugs.join(', ') || '(none)'}`);
