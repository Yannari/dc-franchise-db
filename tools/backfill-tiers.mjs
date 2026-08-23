#!/usr/bin/env node
// Put each player's tier back on their roster row, from their OWN show's board.
//
// WHY. `players_database.json` carries a `tier` per player, and it is what D1's
// `players.tier` is loaded from — which is the tier the site actually serves,
// because nothing ever reads D1's `rankings` table. A new roster row is created
// with `tier: ''` and nothing writes it back, so every one of Big Brother 1's
// seventeen houseguests had a blank tier while the Big Brother board had real
// ones. "Big Brother tiers are missing from D1" was this, not the schema.
//
// A RANKING BELONGS TO THE SHOW THAT RANKS IT, so the board is chosen per
// player from the show they actually played rather than from one global file.
// Somebody who has played two shows takes the tier of whichever board ranks
// them best, because a roster row has one tier and being S-tier somewhere is
// the truer headline than being C-tier somewhere else.
//
// Re-runnable, and worth re-running after any rankings publish.
//
// Usage:
//   node tools/backfill-tiers.mjs           # dry run
//   node tools/backfill-tiers.mjs --write

import fs from 'node:fs';

const WRITE = process.argv.includes('--write');
const PDB = 'players_database.json';

// Mirrors js/ranking-boards.js. Kept as data rather than imported because that
// module fetches over HTTP for the browser; change one and change the other.
const BOARD_FILES = {
  'total-drama': 'rankings_database.json',
  'big-brother': 'rankings_bb.json',
};

const TIER_ORDER = ['S+', 'S', 'A', 'B', 'C', 'D'];
const rankOfTier = t => {
  const i = TIER_ORDER.indexOf(t);
  return i === -1 ? TIER_ORDER.length : i;
};

const boards = {};
for (const [format, file] of Object.entries(BOARD_FILES)) {
  if (!fs.existsSync(file)) { console.log(`  (no board for ${format} yet — skipped)`); continue; }
  const b = JSON.parse(fs.readFileSync(file, 'utf8'));
  boards[format] = new Map((b.rankings || []).map(r => [r.playerId || r.name, r]));
}

const pdb = JSON.parse(fs.readFileSync(PDB, 'utf8'));
let changed = 0, missing = 0;

for (const p of pdb.players) {
  // Which shows this player actually played. An absent format is Total Drama,
  // the same rule the rest of the repo uses.
  const formats = new Set((p.seasonDetails || []).map(d => d.format || 'total-drama'));
  if (!formats.size) continue;

  let best = null;
  for (const f of formats) {
    const row = boards[f]?.get(p.id) || boards[f]?.get(p.name);
    if (!row?.tier) continue;
    if (!best || rankOfTier(row.tier) < rankOfTier(best.tier)) best = row;
  }
  if (!best) {
    if (!p.tier) missing++;
    continue;
  }
  if (p.tier === best.tier) continue;
  console.log(`  ${p.name.padEnd(12)} ${(p.tier || '(blank)').padEnd(8)} -> ${best.tier}`);
  p.tier = best.tier;
  changed++;
}

console.log(`\n${changed} tier(s) ${WRITE ? 'updated' : 'would change'}`
  + (missing ? `, ${missing} player(s) still blank (on no board yet)` : ''));
if (!WRITE) { console.log('Dry run — pass --write to save.'); process.exit(0); }
fs.writeFileSync(PDB, JSON.stringify(pdb, null, 2) + '\n', 'utf8');
console.log(`Wrote ${PDB}`);
