// ══════════════════════════════════════════════════════════════════════
// dr-storyline-wiring.test.js — the arcs actually reach the week
// ══════════════════════════════════════════════════════════════════════
//
// Task 1 built a tracker; this checks it is plugged in at both ends. The bug
// class it guards is the one this codebase keeps producing: a system that
// runs, computes a correct answer, and is read by nobody.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat'];

function cast(n = 12, seed = 1) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ARCH[i % ARCH.length], age: 20 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

/** A season with a real bond layer, since arcs are cast partly from bonds. */
function season(castSeed, seed) {
  const c = cast(12, castSeed);
  const bonds = {};
  const key = (a, b) => [a, b].sort().join('|');
  const r = rngFor(seed * 7919 + 13);
  for (let i = 0; i < c.length; i++) {
    for (let j = i + 1; j < c.length; j++) bonds[key(c[i].name, c[j].name)] = Math.round((r() - 0.5) * 16);
  }
  return playDragSeason({
    cast: c, seed,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => {
      const k = key(a, b);
      bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d));
    },
  });
}

describe('storylines in a played season', () => {
  const { rows, state } = season(3, 5);

  it('casts arcs before anybody performs', () => {
    expect(state.storylines.length).toBeGreaterThan(0);
    for (const s of state.storylines) expect(s.arc).toBeTruthy();
  });

  it('every episode snapshots its own arcs', () => {
    for (const row of rows) {
      expect(Array.isArray(row.dr.storylines), `ep ${row.num}`).toBe(true);
      expect(row.dr.storylines.length, `ep ${row.num}`).toBeGreaterThan(0);
      for (const s of row.dr.storylines) expect(s.arc).toBeTruthy();
    }
  });

  it('the snapshot is a snapshot: episode 1 is not the season-end list', () => {
    // Replaying episode 4 must show episode 4's arcs. If the row held the live
    // list by reference, every episode would show the finale's.
    const first = rows[0].dr.storylines.reduce((s, x) => s + x.beats, 0);
    const late = rows[rows.length - 2].dr.storylines.reduce((s, x) => s + x.beats, 0);
    expect(late).toBeGreaterThan(first);
  });

  it('records what the tracker asked for, so a screen can show the lean', () => {
    const need = rows[2].dr.storylineNeed;
    expect(need).toBeTruthy();
    for (const [n, v] of Object.entries(need)) {
      expect(rows[2].dr.living.concat(rows[2].exits.map(x => x.name))).toContain(n);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('asks for something non-zero at least once in a season', () => {
    // A wired tracker that always returns zeroes is indistinguishable from the
    // stub it replaced, which is exactly the bug this file exists to catch.
    const anyPull = rows.some(r => Object.values(r.dr.storylineNeed || {}).some(v => v !== 0));
    expect(anyPull, 'the tracker never once leaned on a week').toBe(true);
  });

  it('an arc whose queen leaves is marked dead, not deleted', () => {
    const dead = state.storylines.filter(s => !s.alive);
    const gone = new Set(state.out);
    for (const s of dead) expect(s.players.some(n => gone.has(n))).toBe(true);
    // Dead arcs keep their beats: a finished arc is still what happened.
    for (const s of dead) expect(Array.isArray(s.beats)).toBe(true);
  });

  it('most seasons get at least one arc to a second beat', () => {
    let ok = 0;
    for (let s = 0; s < 20; s++) {
      if (season(100 + s, s).state.storylines.some(x => x.beats.length >= 2)) ok++;
    }
    expect(ok / 20).toBeGreaterThan(0.7);
  });

  it('stays serialisable, because the row goes into the save', () => {
    const r = rows[2];
    expect(JSON.parse(JSON.stringify(r.dr.storylines))).toEqual(r.dr.storylines);
    expect(JSON.parse(JSON.stringify(state.storylines))).toEqual(state.storylines);
  });

  it('is seeded: the same seed casts the same arcs', () => {
    const a = season(3, 5).state.storylines;
    const b = season(3, 5).state.storylines;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
