// A played Circle season, written out to read.
//
//     npm run ci:transcript             seed 7, 13 players
//     CI_SEED=19 npm run ci:transcript  any other seed
//     CI_CAST=16 …                      another cast size (a third arrive later)
//     CI_BOOK=rating2=ci-sole-influencer  book a night's format by slot
//     CI_AI=1                           the AI player (US 6) joins on Day 1
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
import { VOICE_SHEETS, VOICE_CAST, PERSONA_VOICES } from './helpers/ci-voices.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Readable stand-ins for the synthetic cast, which alternates f/m.
const F = ['Sammie', 'Chloe', 'Yu Ling', 'Raven', 'Madelyn', 'Jadejha', 'Terilisha', 'Lauren', 'Quori', 'Savannah', 'Alyssa', 'Crissa'];
const M = ['Joey', 'Shubham', 'Chris', 'Frank', 'Kyle', 'Darian', 'Garret', 'Myles', 'Eversen', 'Bryant', 'Marvin', 'Chaz'];

it('writes a season transcript', () => {
  const seed = Number(process.env.CI_SEED) || 7;
  const size = Number(process.env.CI_CAST) || 13;
  const cast = makePlayers(size, seed).map((p, i) => ({ ...p, name: (i % 2 === 0 ? F : M)[Math.floor(i / 2)] }));
  // A shared profile, so every read covers one (the user's example, spec
  // §14.8): Mateo and Luis, brothers, one profile — Mateo's face, Luis's brain.
  const pair = process.env.CI_PAIR !== '0';
  if (pair) {
    Object.assign(cast[1], { name: 'Mateo', age: 26, archetype: 'showmancer',
      stats: { ...cast[1].stats, social: 8, boldness: 8, strategic: 4, temperament: 6 } });
    Object.assign(cast[3], { name: 'Luis', age: 31, archetype: 'loyal-soldier',
      stats: { ...cast[3].stats, social: 5, boldness: 3, strategic: 8, temperament: 3 } });
  }
  setPlayers(cast);
  const names = cast.map(p => p.name);
  const setup = circleSetup(names, { newcomers: Math.round(size * 0.38) });
  if (pair) {
    Object.assign(setup.Mateo, { catfish: 'never', face: 'Mateo', brain: 'Luis', job: 'personal trainer' });
    Object.assign(setup.Luis, { catfish: 'never', partner: 'Mateo', facts: ['three kids at home'] });
  }
  // Authored chat voices on a few of the cast (CI_VOICES=0 to read without).
  if (process.env.CI_VOICES !== '0') {
    for (const [name, sheet] of Object.entries(VOICE_CAST)) if (setup[name]) setup[name].chatVoice = VOICE_SHEETS[sheet];
  }
  const pool = makePool(6, seed);
  if (process.env.CI_VOICES !== '0') for (const p of pool) if (PERSONA_VOICES[p.handle]) p.chatVoice = PERSONA_VOICES[p.handle];
  // CI_BOOK="rating2=ci-sole-influencer,rating5=..." books nights by slot.
  const bookings = Object.fromEntries((process.env.CI_BOOK || '').split(',').filter(Boolean).map(x => x.split('=')));
  const { rows, state, result } = playCircleSeason({ cast: names, setup, pool, seed, options: { bookings, ai: process.env.CI_AI === '1' } });
  const dir = join(ROOT, 'transcripts');
  mkdirSync(dir, { recursive: true });
  const base = join(dir, `ci-season-${seed}`);
  writeFileSync(`${base}.txt`, seasonText(state, rows, result));
  writeFileSync(`${base}.html`, seasonHtml(state, rows, result));
  const missing = Object.entries(state.missingPools || {}).sort((a, b) => b[1] - a[1]);
  console.log(`\nwrote ${base}.txt\nmissing pools (${missing.length}): ${missing.slice(0, 40).map(([k, n]) => `${k}×${n}`).join(', ')}\n`);
});
