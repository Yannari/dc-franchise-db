// ══════════════════════════════════════════════════════════════════════
// dr-balance-audit.test.js — sixty seasons, and the tables they print
// ══════════════════════════════════════════════════════════════════════
//
// AN AUDIT, not a guard. It follows the repo's own convention rather than the
// plan's: the name ends `-audit.test.js`, so vitest.config.js already excludes
// it from `npm test` and vitest.audit.config.js already collects it. No new
// registration, and it gets an npm script like every other audit:
//
//     npm run audit:dr-balance
//
// Reach for it after changing any blend, weight or noise amount. The point is
// the printed tables, not the assertions: every prose and balance bug this
// project has found was found by reading output, and the loose bounds below
// exist only to stop a silent collapse going unnoticed.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat', 'schemer', 'loyal-soldier'];

function cast(n, seed) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 20 + (i % 20),
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const craftMean = p => Object.values(p.drag).reduce((a, b) => a + b, 0) / 7;
const log = (...a) => console.log(...a); // eslint-disable-line no-console

describe('balance over 60 seasons', () => {
  const N = 60;
  // A REAL BOND LAYER, because the default one is a trap. playDragSeason falls
  // back to `bond: () => 0` with an addBond that remembers nothing, so a season
  // played that way has no relationships at all — and the first run of this
  // audit duly reported that help and sabotage never fire in sixty seasons,
  // which was true of the harness and false of the engine. Both need a bond at
  // ±3 to reach. A played season gets its bonds from js/dr-run.js; this stands
  // in for that, seeded so the room already knows itself the way it does after
  // the arrivals.
  const seasons = Array.from({ length: N }, (_, s) => {
    const c = cast(13, 1000 + s);
    const bonds = {};
    const key = (a, b) => [a, b].sort().join('|');
    const r = rngFor(s * 7919 + 13);
    for (let i = 0; i < c.length; i++) {
      for (let j = i + 1; j < c.length; j++) {
        bonds[key(c[i].name, c[j].name)] = Math.round((r() - 0.5) * 14);
      }
    }
    const out = playDragSeason({
      cast: c, seed: s, config: { drDoubleShantay: true },
      bond: (a, b) => bonds[key(a, b)] || 0,
      addBond: (a, b, d) => {
        const k = key(a, b);
        bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d));
      },
    });
    return { c, out };
  });

  it('the strongest craft line wins often, and not always', () => {
    const hits = seasons.filter(({ c, out }) =>
      out.winner === [...c].sort((a, b) => craftMean(b) - craftMean(a))[0].name).length;
    log(`best-craft winner: ${(hits / N * 100).toFixed(1)}%  (chance 7.7% at a cast of 13)`);
    expect(hits / N).toBeGreaterThan(0.15);
    expect(hits / N).toBeLessThan(0.70);
  });

  it('no single maxi type decides the season on its own', () => {
    // A type whose winner takes the crown far more often than the average
    // winner does is a type that is worth too much. The table is the point;
    // the assertion only catches a collapse.
    const byType = {};
    for (const { out } of seasons) {
      for (const row of out.rows) {
        const id = row.dr?.challenge?.id;
        if (!id || id === 'finale') continue;
        const w = row.dr.call?.win?.[0];
        if (!w) continue;
        byType[id] ||= { wins: 0, crowned: 0 };
        byType[id].wins++;
        if (w === out.winner) byType[id].crowned++;
      }
    }
    const totalWins = Object.values(byType).reduce((s, x) => s + x.wins, 0);
    const base = Object.values(byType).reduce((s, x) => s + x.crowned, 0) / Math.max(1, totalWins);
    log(`\nwinning a week of each type, and how often that queen was crowned (base ${(base * 100).toFixed(0)}%)`);
    for (const [id, x] of Object.entries(byType).sort((a, b) => b[1].wins - a[1].wins)) {
      log(`  ${id.padEnd(20)} wins ${String(x.wins).padStart(3)}  -> crown ${(x.crowned / x.wins * 100).toFixed(0)}%`);
      if (x.wins >= 20) {
        expect(x.crowned / x.wins, `${id} is worth too much`).toBeLessThan(base * 3);
      }
    }
  });

  it('every maxi type is reachable and produces a spread', () => {
    const seen = new Set();
    for (const { out } of seasons) {
      for (const row of out.rows) if (row.dr?.challenge?.id) seen.add(row.dr.challenge.id);
    }
    const missing = MAXI_TYPES.map(m => m.id).filter(id => !seen.has(id));
    log(`\ntypes never scheduled in ${N} seasons: ${missing.join(', ') || 'none'}`);
    expect(missing.length, `never scheduled: ${missing.join(', ')}`).toBeLessThanOrEqual(2);

    for (const { out } of seasons.slice(0, 10)) {
      for (const row of out.rows) {
        if (!row.dr?.performances) continue;
        const vals = Object.values(row.dr.performances).map(p => p.perf);
        expect(Math.max(...vals) - Math.min(...vals),
          `${row.dr.challenge?.id} produced no spread`).toBeGreaterThan(1);
      }
    }
  });

  it('help, sabotage and the walkthrough all actually fire', () => {
    const counts = {};
    for (const { out } of seasons) {
      for (const row of out.rows) {
        for (const e of row.dr?.events || []) counts[e.type] = (counts[e.type] || 0) + 1;
      }
    }
    log(`\nevents fired across ${N} seasons:`);
    for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      log(`  ${k.padEnd(24)} ${v}`);
    }
    // The three that are always available, on every type. If one of them stops
    // firing, the werk room has gone quiet and nothing else would say so.
    for (const must of ['help', 'sabotage', 'walkthrough']) {
      expect(counts[must], `${must} never fired in ${N} seasons`).toBeGreaterThan(0);
    }
  });
});
