// ══════════════════════════════════════════════════════════════════════
// tools/print-drag-signals.mjs — the eleven signals, one row per episode
// ══════════════════════════════════════════════════════════════════════
//
// The ratings engine turns eleven signals into four opinions, and the only
// way to know whether the signals are reading a real season is to print
// them and look. A column pinned at 0.00 all season is a read that is not
// reading; a column pinned at 1.00 is a read with no headroom. Both look
// identical from inside a passing test.
//
//   node tools/print-drag-signals.mjs            one season, seed 7
//   node tools/print-drag-signals.mjs 12         a specific seed
//   node tools/print-drag-signals.mjs 12 40      40 seasons, summary only
//
// NOTE THE jsdom BOOT: js/ratings.js reaches js/core.js, which reads
// localStorage at module scope. These are browser modules and this is the
// browser API they legitimately expect.
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const k of ['window', 'document', 'localStorage', 'navigator']) {
  if (!globalThis[k]) globalThis[k] = dom.window[k];
}

const { readSignals } = await import('../js/ratings.js');
const { playDragSeason } = await import('../js/dr/season.js');
const { rngFor } = await import('../js/dr/rng.js');

const SEED = Number(process.argv[2]) || 7;
const RUNS = Number(process.argv[3]) || 1;

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['hero', 'villain', 'wildcard', 'floater', 'mastermind', 'schemer', 'goat'];
const KEYS = ['blindside', 'predictable', 'steamroll', 'powerShift', 'showmance',
  'twist', 'returns', 'likability', 'villainy', 'mess', 'strategy'];

function castFor(seed, n = 13) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 23 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

function readSeason(seed) {
  const cast = castFor(100 + seed);
  const bonds = {}; const pop = {};
  const key = (a, b) => [a, b].sort().join('|');
  const { rows } = playDragSeason({
    cast, seed,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: (n, d) => { pop[n] = (pop[n] || 0) + d; },
  });
  const out = []; let prev = null;
  for (const row of rows.filter(r => !r.dr.finale)) {
    const s = readSignals({ ...row, format: 'drag-race' }, prev, {
      format: 'drag-race', popularity: pop, house: row.dr.living, players: cast,
    });
    out.push(s); prev = s;
  }
  return out;
}

const pad = (s, n) => String(s).padStart(n);
const head = ['ep', ...KEYS.map(k => k.slice(0, 6))];

if (RUNS === 1) {
  const read = readSeason(SEED);
  console.log(`\nseed ${SEED} · ${read.length} episodes\n`);
  console.log(head.map((h, i) => pad(h, i ? 7 : 3)).join(' '));
  for (const s of read) {
    console.log([pad(s.ep, 3), ...KEYS.map(k => pad(s[k].toFixed(2), 7))].join(' '));
  }
  console.log('\n' + [pad('mean', 3), ...KEYS.map(k =>
    pad((read.reduce((a, s) => a + s[k], 0) / read.length).toFixed(2), 7))].join(' '));
} else {
  const all = [];
  for (let i = 0; i < RUNS; i++) all.push(...readSeason(SEED + i));
  console.log(`\n${RUNS} seasons · ${all.length} episodes\n`);
  console.log(pad('signal', 12), pad('mean', 7), pad('min', 7), pad('max', 7), pad('zero%', 7));
  for (const k of KEYS) {
    const v = all.map(s => s[k]);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const zero = v.filter(x => x === 0).length / v.length;
    // A column that is zero most of the time is a read that is barely
    // reading, whatever its mean looks like.
    const flag = zero > 0.9 ? '  <- never fires' : mean > 0.95 ? '  <- no headroom' : '';
    console.log(pad(k, 12), pad(mean.toFixed(2), 7), pad(Math.min(...v).toFixed(2), 7),
      pad(Math.max(...v).toFixed(2), 7), pad(`${(zero * 100).toFixed(0)}%`, 7), flag);
  }
}
