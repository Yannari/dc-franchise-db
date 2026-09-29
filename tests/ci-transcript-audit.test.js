// A played Circle season, written out to read.
//
//     npm run ci:transcript             seed 7, 13 players
//     CI_SEED=19 npm run ci:transcript  any other seed
//     CI_CAST=16 …                      another cast size (a third arrive later)
//
// Writes transcripts/ci-season-<seed>.txt and .html (gitignored) and prints the
// path. Uses js/ci/transcript.js — the same renderer the screens will use.
import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { seasonText, seasonHtml } from '../js/ci/transcript.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Readable stand-ins for the synthetic cast, which alternates f/m.
const F = ['Sammie', 'Chloe', 'Yu Ling', 'Raven', 'Madelyn', 'Jadejha', 'Terilisha', 'Lauren', 'Quori', 'Savannah', 'Alyssa', 'Crissa'];
const M = ['Joey', 'Shubham', 'Chris', 'Frank', 'Kyle', 'Darian', 'Garret', 'Myles', 'Eversen', 'Bryant', 'Marvin', 'Chaz'];

it('writes a season transcript', () => {
  const seed = Number(process.env.CI_SEED) || 7;
  const size = Number(process.env.CI_CAST) || 13;
  const cast = makePlayers(size, seed).map((p, i) => ({ ...p, name: (i % 2 === 0 ? F : M)[Math.floor(i / 2)] }));
  setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows, state, result } = playCircleSeason({ cast: names,
    setup: circleSetup(names, { newcomers: Math.round(size * 0.38) }), pool: makePool(6, seed), seed });
  const dir = join(ROOT, 'transcripts');
  mkdirSync(dir, { recursive: true });
  const base = join(dir, `ci-season-${seed}`);
  writeFileSync(`${base}.txt`, seasonText(state, rows, result));
  writeFileSync(`${base}.html`, seasonHtml(state, rows, result));
  const missing = Object.entries(state.missingPools || {}).sort((a, b) => b[1] - a[1]);
  console.log(`\nwrote ${base}.txt\nmissing pools (${missing.length}): ${missing.slice(0, 40).map(([k, n]) => `${k}×${n}`).join(', ')}\n`);
});
