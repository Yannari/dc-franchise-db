// ══════════════════════════════════════════════════════════════════════
// tools/dr-dump-season.mjs — play a drag season and print it
// ══════════════════════════════════════════════════════════════════════
//
// The same idea as tools/tr-dump-episode.mjs: the fastest way to find out
// whether the engine is doing anything sensible is to read a season. Every
// prose and balance bug in this project has been found this way and none of
// them by an assertion — the flat contest penalty that charged twelve of
// thirteen queens the same amount was invisible to 300 passing tests and
// obvious in the first episode of a dump.
//
//   node tools/dr-dump-season.mjs                 a season, to the terminal
//   node tools/dr-dump-season.mjs 12              a specific seed
//   node tools/dr-dump-season.mjs 12 > season.txt to a file, to read properly
//
// NOTE THE BOND LAYER BELOW. playDragSeason falls back to `bond: () => 0` with
// an addBond that remembers nothing, so a season played without one has no
// relationships at all and every event gated on a bond silently cannot fire.
// A dump on the default would quietly be a dump of a different, emptier show.
import { playDragSeason } from '../js/dr/season.js';
import { generateDragSummaryText } from '../js/vp-dr/summary.js';
import { rngFor } from '../js/dr/rng.js';

const SEED = Number(process.argv[2]) || 7;

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat',
  'schemer', 'loyal-soldier'];
const NAMES = ['Vespa Vex', 'Coco Bijou', 'Mona Steel', 'Pixie Rot', 'Athena Gold',
  'Sister Mercy', 'Bunny Deluxe', 'Kiki Sable', 'Lux Mirage', 'Gigi Fontaine',
  'Roxy Havoc', 'Nadia Sharp', 'Tilly Bloom'];

const rng = rngFor(SEED);
const roll = () => 1 + Math.floor(rng() * 10);
const cast = NAMES.map((name, i) => ({
  name, slug: name.toLowerCase().replace(/\W+/g, '-'), gender: 'f',
  archetype: ARCH[i % ARCH.length], age: 21 + (i * 2) % 18,
  stats: Object.fromEntries(STATS.map(k => [k, roll()])),
  drag: {
    acting: roll(), comedy: roll(), dance: roll(), design: roll(),
    runway: roll(), lipsync: roll(), singing: roll(),
  },
}));

const bonds = {};
const key = (a, b) => [a, b].sort().join('|');
const br = rngFor(SEED * 7919 + 13);
for (let i = 0; i < cast.length; i++) {
  for (let j = i + 1; j < cast.length; j++) {
    bonds[key(cast[i].name, cast[j].name)] = Math.round((br() - 0.5) * 14);
  }
}

const out = playDragSeason({
  cast, seed: SEED, config: { drDoubleShantay: true },
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => {
    const k = key(a, b);
    bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d));
  },
});

const say = (...a) => console.log(...a); // eslint-disable-line no-console
say(`=== DRAG RACE, seed ${SEED} — ${out.rows.length} episodes, `
  + `${out.winner} is crowned (runner-up ${out.runnerUp}) ===\n`);
say('THE CAST');
for (const p of cast) {
  const d = p.drag;
  say(`  ${p.name.padEnd(15)} ${p.archetype.padEnd(14)} age ${p.age}  `
    + `act${d.acting} com${d.comedy} dan${d.dance} des${d.design} `
    + `run${d.runway} lip${d.lipsync} sing${d.singing}`);
}
say('');
for (const row of out.rows) say(`${generateDragSummaryText(row)}\n${'-'.repeat(70)}\n`);
