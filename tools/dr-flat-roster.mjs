// ══════════════════════════════════════════════════════════════════════
// tools/dr-flat-roster.mjs — what a season cast from the roster looks like
// ══════════════════════════════════════════════════════════════════════
//
// franchise_roster.json carries drag craft for NOBODY. `dragOf` fills a
// missing stat with 5, so a cast taken straight off the roster is seven
// identical queens as far as craft is concerned, and the season is decided
// entirely by star power, archetype and noise.
//
// This measures the gap rather than asserting it: the same thirteen players,
// once as the roster actually has them and once with craft varied, and the
// spread of maxi wins in each. A flat cast is not broken — every page still
// draws — but it is a different show, and the number says how different.
//
//   node tools/dr-flat-roster.mjs [seasons]
import { readFileSync } from 'node:fs';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const RUNS = Number(process.argv[2]) || 40;
const roster = JSON.parse(readFileSync('franchise_roster.json', 'utf8'));
const players = Array.isArray(roster) ? roster : (roster.players || []);
const DRAG_STATS = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];

const authored = players.filter(p => p.drag && DRAG_STATS.some(k => Number.isFinite(Number(p.drag[k]))));
console.log(`roster: ${players.length} players, ${authored.length} with any authored drag craft`);

function pickCast(seed, n = 13) {
  const rng = rngFor(seed * 7919 + 13);
  const pool = [...players];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

// A control arm: the SAME cast with craft varied, so the comparison is about
// the craft and not about which thirteen people were drawn.
function varied(cast, seed) {
  const rng = rngFor(seed * 104729 + 7);
  return cast.map(p => ({
    ...p,
    drag: Object.fromEntries(DRAG_STATS.map(k => [k, 1 + Math.floor(rng() * 10)])),
  }));
}

function spread(cast, seed) {
  const bonds = {};
  const key = (a, b) => [a, b].sort().join('|');
  const { rows } = playDragSeason({
    cast, seed,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
  });
  const wins = {};
  let eps = 0;
  for (const r of rows) {
    eps++;
    for (const n of r.dr?.call?.win || []) wins[n] = (wins[n] || 0) + 1;
  }
  const counts = cast.map(p => wins[p.name] || 0);
  const top = Math.max(...counts);
  const winners = counts.filter(c => c > 0).length;
  return { top, winners, eps };
}

const arm = fn => {
  let top = 0; let winners = 0; let eps = 0;
  for (let s = 0; s < RUNS; s++) {
    const c = fn(s);
    const r = spread(c, s);
    top += r.top; winners += r.winners; eps += r.eps;
  }
  return {
    top: (top / RUNS).toFixed(2),
    winners: (winners / RUNS).toFixed(2),
    eps: (eps / RUNS).toFixed(1),
  };
};

const flat = arm(s => pickCast(s));
const vary = arm(s => varied(pickCast(s), s));
console.log(`\n${RUNS} seasons per arm, 13 queens each`);
console.log('arm                 most maxis by one queen   queens who won any   episodes');
console.log(`roster as it is     ${String(flat.top).padStart(18)}   ${String(flat.winners).padStart(18)}   ${flat.eps}`);
console.log(`same cast, varied   ${String(vary.top).padStart(18)}   ${String(vary.winners).padStart(18)}   ${vary.eps}`);
