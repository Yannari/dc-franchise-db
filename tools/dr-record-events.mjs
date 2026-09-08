// tools/dr-record-events.mjs — do the track record's own events ever fire?
// Being the frontrunner, being perpetually safe, and living in the bottom are
// the three states a season puts a queen in, and each should cost her
// something socially. This counts what actually reaches the screen.
const { JSDOM } = await import('jsdom');
const d = new JSDOM('<!doctype html><html></html>', { url: 'http://localhost/' });
for (const k of ['window', 'document', 'localStorage', 'navigator']) {
  if (!globalThis[k]) globalThis[k] = d.window[k];
}
const { playDragSeason } = await import('../js/dr/season.js');
const { rngFor } = await import('../js/dr/rng.js');
const { WERK_EVENTS } = await import('../js/dr/data/werk-events.js');
const RUNS = Number(process.argv[2]) || 40;
const S = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const A = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer'];
const mk = seed => { const g = rngFor(seed); const r = () => 1 + Math.floor(g() * 10);
  return Array.from({ length: 12 }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: A[i % A.length], age: 21 + i, stats: Object.fromEntries(S.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } })); };

const RECORD_DRIVEN = new Set(WERK_EVENTS
  .filter(e => /lastCall|winsA|winsB|safesA|bottoms|neverTop|neverBottom|sinceTop|lipSynced/.test(String(e.when || '')))
  .map(e => e.id));

const fired = {};
for (const id of RECORD_DRIVEN) fired[id] = 0;
let seasons = 0;
for (let s = 0; s < RUNS; s++) {
  /* A REAL RELATIONSHIP LAYER, because without one this tool lies. Passing no
     `bond` leaves playDragSeason on its `() => 0` fallback, and every event
     gated on `f.bond` then becomes unreachable — `safe-pact` measured a flat
     zero across forty seasons and looked like a dead event, when the gate is
     satisfiable in 13% of queen-episodes and it was the harness that had
     switched it off. A headless season is not the game unless it carries the
     layer the game carries. */
  const bonds = {};
  const key = (a, b) => [a, b].sort().join('|');
  const out = playDragSeason({
    cast: mk(700 + s), seed: s,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, dd) => {
      const k = key(a, b);
      bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + dd));
    },
  });
  seasons++;
  for (const row of out.rows) {
    for (const sc of row.dr.scenes || []) {
      const id = String(sc.kind || '').replace(/^werk:/, '');
      if (RECORD_DRIVEN.has(id)) fired[id]++;
    }
  }
}
console.log(`\nrecord-driven werk events, ${seasons} seasons\n`);
const rows = Object.entries(fired).sort((a, b) => b[1] - a[1]);
for (const [id, n] of rows) {
  const flag = n === 0 ? '  <- NEVER FIRES' : '';
  console.log(`  ${id.padEnd(24)} ${String(n).padStart(4)}   ${(n / seasons).toFixed(2)}/season${flag}`);
}
console.log(`\n  ${rows.length} record-driven events of ${WERK_EVENTS.length} werk events total`);
