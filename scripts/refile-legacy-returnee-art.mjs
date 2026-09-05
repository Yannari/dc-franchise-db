#!/usr/bin/env node
// ONE-SHOT. Put each legacy `<slug>-returnee.png` on the show it was actually
// drawn for.
//
// scripts/seed-portrait-catalog.mjs filed all 27 of them under Total Drama,
// because that is the only show the `-returnee` convention ever knew about —
// the filename predates shows existing at all. Seven of those characters have
// never played Total Drama, so their only alternate look sat on a show they
// are not in, invisible to the seasons that could have used it.
//
// The evidence is their own record: somebody whose every appearance is on one
// show drew this for that show. Anyone who has played more than one is left
// alone and reported, because there is nothing here to infer from.
//
//   node scripts/refile-legacy-returnee-art.mjs --check   report only
//   node scripts/refile-legacy-returnee-art.mjs           apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'assets/avatars/portrait-catalog.json');
const DB = path.join(ROOT, 'players_database.json');
const apply = !process.argv.includes('--check');

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
const byId = new Map((db.players || []).map(p => [p.id, p]));

// The id says which show it belongs to, so it moves with the portrait. Nothing
// has recorded one yet (checked), but an alias is kept anyway: a cast sitting
// in somebody's browser may still be holding the old one.
const ID_FOR = { 'total-drama': 'td-returnee', 'big-brother': 'bb-returnee', traitors: 'tr-returnee' };

const moved = [];
const kept = [];
const ambiguous = [];

for (const [slug, entry] of Object.entries(catalog.players || {})) {
  const legacy = (entry.portraits || []).find(p => p.file === `${slug}-returnee.png`);
  if (!legacy) continue;

  const shows = [...new Set((byId.get(slug)?.seasonDetails || [])
    .map(d => d.format || 'total-drama'))];

  if (shows.length !== 1) { ambiguous.push([slug, shows]); continue; }
  const show = shows[0];
  if (legacy.show === show) { kept.push([slug, show]); continue; }

  const oldId = legacy.id;
  const newId = ID_FOR[show] || oldId;
  moved.push([slug, legacy.show, show, oldId, newId]);

  if (!apply) continue;
  legacy.show = show;
  if (newId !== oldId) {
    legacy.id = newId;
    entry.aliases = { ...(entry.aliases || {}), [oldId]: newId };
  }
  // A default naming the portrait under the show it just left would dangle.
  for (const [key, value] of Object.entries(entry.defaults || {})) {
    if (value === oldId && key !== show && key !== 'global') delete entry.defaults[key];
  }
}

for (const [slug, from, to, oldId, newId] of moved) {
  console.log(`  ${slug.padEnd(12)} ${from} -> ${to}   (${oldId} -> ${newId})`);
}
for (const [slug, shows] of ambiguous) {
  console.log(`  ? ${slug.padEnd(12)} played ${shows.join(' + ') || 'nothing recorded'} — left alone, file it by hand`);
}
console.log(`\n${moved.length} moved, ${kept.length} already correct, ${ambiguous.length} need a human`);

if (apply && moved.length) {
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  console.log('wrote assets/avatars/portrait-catalog.json');
} else if (!apply) {
  console.log('(--check: nothing written)');
}
