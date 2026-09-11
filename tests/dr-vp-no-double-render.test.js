// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-no-double-render.test.js — one scene, one screen
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played episode: an afternoon of taking notes from the
// director — "Find the lens." "I AM finding the lens." — on the PREP screen,
// which is where a queen sews. It was on On Set as well. The same ten cards,
// twice, under two headings.
//
// `sceneSections` walks the episode once and assigns every scene to exactly
// one screen, and `buildSection` reads it. A CUSTOM builder was handed only
// the row, so each one re-derived its own contents by step — fine while a
// step belongs to one screen, and wrong the moment it does not. The booth,
// the rehearsal room and the set are all `step: 'prep'` with screens of their
// own, so `rpBuildPrep`'s `filter(s => s.step === 'prep')` swept up all three.
//
// The fix was to hand a custom builder its section. This is the guard: no
// scene's prose may appear on two screens of the same episode.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens, sceneSections } from '../js/vp-dr/screens.js';
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

const seasonWith = maxiId => playDragSeason({
  cast: cast(12, 555), seed: 77,
  config: { drSchedule: [{ episode: 3, maxiId }] },
  bond: () => 0, addBond: () => {}, popDelta: () => {},
});

/**
 * A distinctive slice of a scene's prose, long enough not to collide.
 *
 * The longest run with no character the renderer escapes — a window
 * containing a quote mark is `&quot;` in the HTML and matches nothing, which
 * read as "this scene is on no screen at all" the first time this was
 * written.
 */
const fingerprint = (sc) => {
  const runs = (sc.text || '').replace(/\s+/g, ' ').trim().split(/["'&<>]+/);
  return runs.sort((a, b) => b.length - a.length)[0].trim();
};

describe('a scene belongs to one screen', () => {
  /* The four beats that share `step: 'prep'` while owning their own screens.
     These are the collision; every other step belongs to one section. */
  for (const [maxiId, kind, screen] of [
    ['acting', 'chal:studio-taping', 'dr-set'],
    ['commercial', 'chal:studio-taping', 'dr-set'],
    ['music-video', 'chal:studio-day', 'dr-set'],
    ['rusical', 'chal:rehearsal', 'dr-rehearsal'],
    ['girl-group', 'chal:booth-session', 'dr-booth'],
  ]) {
    it(`${maxiId}: ${kind} renders on ${screen} and nowhere else`, () => {
      const season = seasonWith(maxiId);
      const row = season.rows.find(r => r.dr?.challenge?.id === maxiId);
      if (!row) return;                       // that challenge did not run
      const mine = row.dr.scenes.filter(s => s.kind === kind && s.text);
      if (!mine.length) return;               // this week produced none

      window._tvState = {};
      const screens = dragScreens(row);
      const marks = fingerprint(mine[0]);
      const on = screens.filter(s => (s.html || '').includes(marks)).map(s => s.id);
      expect(on, `${kind} rendered on ${on.length} screens`).toEqual([screen]);
    });
  }

  it('assigns every prep-step scene to exactly one section', () => {
    /* The mechanism, asserted directly: the walk is a partition. A builder
       that re-derives its own contents can break the partition downstream
       without this ever going red, which is why the render check above
       exists as well. */
    const season = seasonWith('acting');
    const row = season.rows.find(r => r.dr?.challenge?.id === 'acting');
    if (!row) return;
    const sections = sceneSections(row);
    const seen = new Map();
    for (const [id, list] of sections) {
      for (const sc of list) {
        expect(seen.has(sc), `a scene is in two sections: ${sc.kind}`).toBe(false);
        seen.set(sc, id);
      }
    }
    expect(seen.size).toBe(row.dr.scenes.length);
  });

  it('keeps the work room to the work room', () => {
    /* The counterpart. It would be an easy over-correction to hand the prep
       screen an empty list — it must still carry its OWN scenes. */
    const season = seasonWith('acting');
    const row = season.rows.find(r => r.dr?.challenge?.id === 'acting');
    if (!row) return;
    window._tvState = {};
    const prep = dragScreens(row).find(s => s.id === 'dr-prep');
    if (!prep) return;
    const own = (sceneSections(row).get('dr-prep') || []).filter(s => s.text);
    expect(own.length, 'the work room has nothing of its own').toBeGreaterThan(0);
    expect(prep.html.includes(fingerprint(own[0])),
      'the work room stopped drawing its own scenes').toBe(true);
  });
});
