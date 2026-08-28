#!/usr/bin/env node
// Put a season's showmances onto its players' season details.
//
// WHY. The life layer decides who walked out of a season as a couple by reading
// `seasonDetails[].showmance` and `showmanceEnded`. Those are written from
// `gs.showmances` at EXPORT time — only when the season is still live in the
// simulator — and they had never been persisted for anybody: 0 of 279
// appearances carried one, Total Drama included. So `pairsFor()` returned an
// empty list for every season ever played, and not one relationship the
// off-season resolver has ever proposed came from a romance the audience
// actually watched. They all came from the close-friend fallback.
//
// The season documents have the pairs and their phases, so the field can be
// reconstructed without replaying anything.
//
// SEPARATED IS NOT A BREAK-UP. romance.js sets that type when one of them is
// voted out and the other stays — "not betrayal, relationship intact, just
// physically apart" — and the phase goes to 'broken-up' only because the couple
// is no longer active in the house. Treating the phase alone as the answer is
// the bug this exists to undo, so it is not repeated here.
//
// Usage:
//   node tools/backfill-showmances.mjs --season data/seasons/bb-1-data.json
//   node tools/backfill-showmances.mjs --season ... --write

import fs from 'node:fs';
import { parseSeasonRef } from '../js/shows.js';

const argv = process.argv.slice(2);
const arg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  if (i === -1) return d;
  const v = argv[i + 1];
  return !v || v.startsWith('--') ? d : v;
};
const WRITE = argv.includes('--write');
const SEASON_PATH = arg('season');
const PDB_PATH = arg('players', 'players_database.json');
if (!SEASON_PATH) { console.error('Need --season <path>.'); process.exit(1); }

const season = JSON.parse(fs.readFileSync(SEASON_PATH, 'utf8'));
const pdb = JSON.parse(fs.readFileSync(PDB_PATH, 'utf8'));
// THE PREFIX, ASKED OF THE REGISTRY. `startsWith('bb-')` is a show list one
// character wide, so this backfilled `tr-1` as a Total Drama season -- and an
// appearance with no format IS Total Drama, permanently. `parseSeasonRef`
// resolves any registered prefix and returns null rather than guessing.
const format = season.format || parseSeasonRef(season.seasonId)?.format || 'total-drama';

/**
 * Did this couple leave the season together?
 *
 * 'intact' — still together at the end, INCLUDING a pair split by an eviction.
 * 'broken' — it ended on screen: a partner's vote, a sabotage, or it faded.
 */
function endedOf(sh) {
  const how = sh.endedBy || sh.breakupType || null;
  if (how === 'separated') return 'intact';
  if (how === 'betrayal' || how === 'faded' || how === 'sabotaged') return 'broken';
  // A phase of 'broken-up' with no type recorded is a partner's vote; every
  // other phase is a couple that was still going when the season ended.
  return sh.phase === 'broken-up' ? 'broken' : 'intact';
}

const bySlug = new Map();
for (const sh of season.showmances || []) {
  const slugs = sh.playerSlugs || [];
  const names = sh.players || [];
  if (slugs.length !== 2 || names.length !== 2) continue;
  const ended = endedOf(sh);
  bySlug.set(slugs[0], { partner: names[1], ended, phase: sh.phase, how: sh.endedBy || null });
  bySlug.set(slugs[1], { partner: names[0], ended, phase: sh.phase, how: sh.endedBy || null });
}

if (!bySlug.size) { console.log('No showmances in this season document.'); process.exit(0); }

let changed = 0;
for (const p of pdb.players) {
  const hit = bySlug.get(p.id);
  if (!hit) continue;
  for (const d of p.seasonDetails || []) {
    if ((d.format || 'total-drama') !== format || d.season !== season.seasonNumber) continue;
    if (d.showmance === hit.partner && d.showmanceEnded === hit.ended) continue;
    console.log(`  ${p.name}: showmance=${hit.partner} ended=${hit.ended}`
      + `   (phase ${hit.phase}${hit.how ? ', ' + hit.how : ''})`);
    d.showmance = hit.partner;
    d.showmanceEnded = hit.ended;
    changed++;
  }
}

console.log(`\n${changed} season detail(s) ${WRITE ? 'updated' : 'would change'}.`);
if (!WRITE) { console.log('Dry run — pass --write to save.'); process.exit(0); }
fs.writeFileSync(PDB_PATH, JSON.stringify(pdb, null, 2) + '\n', 'utf8');
console.log(`Wrote ${PDB_PATH}`);
