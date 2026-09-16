// ══════════════════════════════════════════════════════════════════════
// tests/dr-call-size.test.js — the panel calls five or six, every night
// ══════════════════════════════════════════════════════════════════════
//
// The stage used to be drawn from the real show's whole spread (3 to 10) and
// read as noise week to week. Six is the night; five and seven are rare. A
// room of six or more sees nothing else — on double eliminations, double
// wins, team nights and save nights too — and nobody stands in two groups.
// A named bottom three IS the lows: no extra LOW, and a high beside the win.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];
const cast = (n, seed) => {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay', archetype: ARCH[i % 8], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

describe('the call', () => {
  it('names six queens most nights, five or seven rarely, and each queen once', () => {
    for (const drSave of ['none', 'beaver', 'tank']) {
      for (let s = 1; s <= 10; s++) {
        const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
        const res = playDragSeason({
          cast: cast(14, s), seed: s * 101 + 7,
          config: { drSave, drSchedule: s % 3 ? [] : [{ episode: 4, doubleElimination: true }] },
          bond: (a, b) => bonds[key(a, b)] || 0,
          addBond: (a, b, d) => { bonds[key(a, b)] = (bonds[key(a, b)] || 0) + d; },
          popDelta: () => {},
        });
        for (const r of res.rows) {
          const c = r.dr.callAtCall || r.dr.call;
          if (!c || r.dr.finale || c.singers) continue;
          const on = [...c.win, ...c.high, ...c.low, ...c.atRisk, ...c.bottom];
          const room = r.dr.roomAtStart.length;
          const where = `${drSave} s${s} ep${r.num}`;
          expect(new Set([...on, ...c.safe]).size, `${where}: a queen in two groups`).toBe(on.length + c.safe.length);
          if (room >= 6) expect([5, 6, 7], where).toContain(on.length);
          if (c.pendingSave) {
            expect(c.low, `${where}: an extra LOW on a save night`).toEqual([]);
            expect(c.high.length, `${where}: no high on a save night`).toBeGreaterThanOrEqual(1);
          }
          else expect(on.length, where).toBeLessThanOrEqual(room);
          expect(c.win.length, where).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });
});
