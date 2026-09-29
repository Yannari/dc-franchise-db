// ══════════════════════════════════════════════════════════════════════
// tests/dr-lipsync-record-audit.test.js — does a better season save you?
// ══════════════════════════════════════════════════════════════════════
//
// The real show, read off the fandom progress tables for US seasons 7-17:
// every night with one BTM2 and one ELIM, both queens' points-per-episode
// BEFORE that night (WIN 5, HIGH 4, SAFE 3, LOW 2, BTM 1):
//
//   better record survives, all nights (ties dropped)   67%   (40 of 60)
//   records 0.5+ PPE apart                              64%   (25 of 39)
//   records 1.0+ PPE apart                              89%   (17 of 19)
//
// The song decides most close nights and a clearly better season almost
// always survives. This plays the engine and prints the same three rows,
// plus the one thing the table cannot show: how often a queen who lost the
// song by three points or more (she bombed it) stays anyway, which should be
// rare whatever her record.
//
//   npx vitest run --config vitest.audit.config.js tests/dr-lipsync-record-audit.test.js
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { LIPSYNC_RECORD } from '../js/dr/week.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer',
  'social-butterfly', 'mastermind', 'underdog', 'perceptive-player'];
const PTS = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };

function cast(n, seed) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

function measure(seasons = 60) {
  const gaps = []; let bombs = 0; let bombSaved = 0;
  for (let s = 1; s <= seasons; s++) {
    const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
    const out = playDragSeason({
      cast: cast(14, s), seed: s * 7919 + 13, config: {},
      bond: (a, b) => bonds[key(a, b)] || 0,
      addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
      popDelta: () => {},
    });
    for (const r of out.rows) {
      const lip = r.dr?.lipsync;
      if (!lip || lip.call !== 'shantay' || !lip.winner || !lip.loser) continue;
      const ppe = n => {
        const rec = (r.dr.record?.[n] || []).slice(0, -1).filter(x => x in PTS);
        return rec.length ? rec.reduce((t, x) => t + PTS[x], 0) / rec.length : null;
      };
      const a = ppe(lip.winner); const b = ppe(lip.loser);
      if (a != null && b != null && a !== b) gaps.push(a - b);
      const sw = lip.scores?.[lip.winner]; const sl = lip.scores?.[lip.loser];
      /* SHE BOMBED IT: lost the song by four points or more, on a scale
         where two good performances land within a point or two. */
      if (sw != null && sl != null && Math.abs(sw - sl) >= 4) {
        bombs++;
        if (sw < sl) bombSaved++;
      }
    }
  }
  const rate = arr => (arr.length ? arr.filter(g => g > 0).length / arr.length : 0);
  return {
    all: rate(gaps), n: gaps.length,
    half: rate(gaps.filter(g => Math.abs(g) >= 0.5)),
    one: rate(gaps.filter(g => Math.abs(g) >= 1)),
    nOne: gaps.filter(g => Math.abs(g) >= 1).length,
    bombSaved: bombs ? bombSaved / bombs : 0, bombs,
  };
}

const pct = x => `${(x * 100).toFixed(0)}%`;

describe('a better season saves a queen about as often as it does on the show', () => {
  it('sweeps the two numbers and prints them beside the real table', () => {
    const base = { ...LIPSYNC_RECORD };
    console.log('\n  slope  cap   all    0.5+   1.0+  (n)   bombed-and-stayed');
    console.log('  real                   67%    64%    89%         rare');
    for (const [slope, cap, dead] of [[0, 0, 0], [2, 1.5, 0], [5, 5, 0], [6, 4, 0.3], [8, 4, 0.4], [8, 5, 0.4], [10, 5, 0.5], [10, 4, 0.5], [12, 4, 0.6]]) {
      Object.assign(LIPSYNC_RECORD, { slope, cap, dead });
      const m = measure(40);
      console.log(`  ${String(slope).padEnd(6)} ${String(cap).padEnd(4)} ${String(dead).padEnd(5)} ${pct(m.all).padEnd(6)} ${pct(m.half).padEnd(6)} ${pct(m.one).padEnd(5)} (${m.nOne})  ${pct(m.bombSaved)} of ${m.bombs}`);
    }
    Object.assign(LIPSYNC_RECORD, base);
  }, 600000);

  it('the shipped numbers sit inside the real show\'s range', () => {
    const m = measure(60);
    console.log(`\n  shipped ${JSON.stringify(LIPSYNC_RECORD)}: all ${pct(m.all)}, 1.0+ ${pct(m.one)} (${m.nOne}), bombed-and-stayed ${pct(m.bombSaved)} of ${m.bombs}`);
    // The song still decides a real share of nights...
    expect(m.all).toBeGreaterThan(0.55);
    expect(m.all).toBeLessThan(0.8);
    // ...a clearly better season usually survives...
    expect(m.one).toBeGreaterThan(0.75);
    // ...and a queen who bombed the song rarely stays.
    expect(m.bombSaved).toBeLessThan(0.2);
  }, 600000);
});
