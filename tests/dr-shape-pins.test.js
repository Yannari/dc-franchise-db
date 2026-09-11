// ══════════════════════════════════════════════════════════════════════
// dr-shape-pins.test.js — a picker on screen that changes the night
// ══════════════════════════════════════════════════════════════════════
//
// The timeline lets an author pin a week's CONTENT — which maxi, which mini,
// which guest — and, for two challenges, its SHAPE: how many teams the girl
// group splits into, and whether the acting week stages one production or
// runs the same script twice with the room cut in half.
//
// `weekCfg` in js/dr/season.js copies the schedule entry FIELD BY FIELD, so a
// pin it does not name never reaches the engine. `makeoverPool` was that bug
// once and has a comment about it. `ggFormat` and `ggThemeId` were that bug
// again, for longer, and nobody noticed because the dropdown was on screen:
// measured over twenty seasons, unset / `cast` / `teams-3` all produced the
// same 12-to-8 split of two teams to three. Three settings, one outcome.
//
// So this suite asks the only question that catches it: does changing the
// control change the season?
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { buildSchedule } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'floater', age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

/** Play `runs` seasons with one week pinned, and report the team shapes seen. */
function shapes(maxiId, pin, runs = 12) {
  const out = {};
  for (let s = 1; s <= runs; s++) {
    const season = playDragSeason({
      cast: cast(12, s * 7919 + 13), seed: s * 31 + 5,
      config: { drSchedule: [{ episode: 3, maxiId, ...pin }] },
      bond: () => 0, addBond: () => {}, popDelta: () => {},
    });
    const row = season.rows.find(r => r.dr?.challenge?.id === maxiId);
    if (!row) continue;
    const n = (row.dr.assignment?.teams || []).length;
    out[n] = (out[n] || 0) + 1;
  }
  return out;
}

describe('a shape pin survives the schedule', () => {
  it('carries every shape pin onto the week config', () => {
    /* The mechanical half: buildSchedule keeps them. It always did — the loss
       was one layer further on, which is why this alone was never enough. */
    const sch = buildSchedule({
      episodes: 10,
      castSize: 12,
      pinned: [{ episode: 2, maxiId: 'acting', actFormat: 'one-cast' },
        { episode: 3, maxiId: 'girl-group', ggFormat: 'cast', ggThemeId: 'disco' }],
      rng: rngFor(3),
    });
    const byEp = Object.fromEntries(sch.map(w => [w.episode, w]));
    expect(byEp[2].actFormat).toBe('one-cast');
    expect(byEp[3].ggFormat).toBe('cast');
    expect(byEp[3].ggThemeId).toBe('disco');
  });
});

describe('and changes the night', () => {
  it('the girl group splits the way it was booked', () => {
    const one = shapes('girl-group', { ggFormat: 'cast' });
    const three = shapes('girl-group', { ggFormat: 'teams-3' });
    expect(Object.keys(one), 'booked one group, got something else').toEqual(['1']);
    expect(Object.keys(three), 'booked three teams, got something else').toEqual(['3']);
  });

  it('the acting week stages what it was booked to stage', () => {
    const one = shapes('acting', { actFormat: 'one-cast' });
    const two = shapes('acting', { actFormat: 'two-casts' });
    expect(Object.keys(one), 'booked one cast, got something else').toEqual(['1']);
    expect(Object.keys(two), 'booked two casts, got something else').toEqual(['2']);
  });

  it('leaves both to the roll when nothing is pinned', () => {
    /* The counterpart, and the reason the bug hid: an unpinned week must
       still produce BOTH shapes across a run of seasons. A pin that quietly
       forced one would look exactly like a pin that worked. */
    const gg = shapes('girl-group', {}, 20);
    const act = shapes('acting', {}, 20);
    expect(Object.keys(gg).length, 'the girl group only ever plays one shape')
      .toBeGreaterThan(1);
    expect(Object.keys(act).length, 'the acting week only ever plays one shape')
      .toBeGreaterThan(1);
  });
});
