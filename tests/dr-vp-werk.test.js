// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-werk.test.js — the room, before and after the stage
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import { rpBuildColdOpen, rpBuildWerkMorning, rpBuildWerkElimDay } from '../js/vp-dr/werk.js';
import { rpBuildArrivals } from '../js/vp-dr/arrivals.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'nb'][i % 2],
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast: cast(12, 6), seed: 3,
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the arrivals screen', () => {
  it('walks every queen in, once, in the order she arrived', () => {
    const html = rpBuildArrivals(rows[0]);
    for (const n of rows[0].houseAtStart) expect(html, `${n} did not walk in`).toContain(n);
    const steps = (html.match(/id="dr-step-arrivals-\d+"/g) || []);
    expect(steps.length).toBe(rows[0].houseAtStart.length);
    expect(new Set(steps).size, 'a step id was reused').toBe(steps.length);
  });

  it('THE RAIL FILLS AS THE DOOR OPENS, and spoils nobody', () => {
    rpBuildArrivals(rows[0]);
    const panels = window._drSidebar.arrivals;
    expect(panels.length).toBe(rows[0].houseAtStart.length);
    // The first panel names one queen; it must not carry the twelfth.
    expect(panels[0]).toContain(rows[0].houseAtStart[0]);
    for (const later of rows[0].houseAtStart.slice(1)) {
      expect(panels[0], `${later} was in the room before she walked in`).not.toContain(later);
    }
    expect(panels[panels.length - 1]).toContain(rows[0].houseAtStart.at(-1));
  });

  it('draws nothing rather than throwing when there is no cast', () => {
    expect(rpBuildArrivals({ num: 1, dr: {} })).toBe('');
  });
});

describe('the werk room screens', () => {
  const withExit = rows.find(r => (r.exits || []).length && r.num > 1);

  it('the cold open names who left LAST night, and darkens her station', () => {
    // Episode N's cold open is about episode N-1's exit: the room wakes up
    // to an empty station. Asserting this row's own exit would be asserting
    // somebody who has not left yet.
    const i = rows.findIndex(r => r === withExit);
    const html = rpBuildColdOpen(rows[i + 1]);
    const gone = withExit.exits[0].name;
    expect(html).toContain(gone);
    // Her bulbs are off. That is the first thing the room notices.
    expect(html).toMatch(/dr-mirror dr-dark/);
    expect(html).toMatch(/dr-mirrormsg/);
  });

  it('elimination day names the category, so the room has a subject', () => {
    const row = rows.find(r => r.dr?.runway?.category);
    const html = rpBuildWerkElimDay(row);
    expect(html).toContain(row.dr.runway.category);
    expect(html).toMatch(/dr-cat/);
  });

  it('every screen builds on every ordinary episode', () => {
    for (const row of rows.filter(r => !r.dr.finale)) {
      for (const [name, fn] of [['cold open', rpBuildColdOpen], ['morning', rpBuildWerkMorning],
        ['elim day', rpBuildWerkElimDay]]) {
        let html;
        expect(() => { html = fn(row); }, `${name} on episode ${row.num}`).not.toThrow();
        expect(html.length, `${name} is empty on episode ${row.num}`).toBeGreaterThan(400);
      }
    }
  });

  it("SHOWS WHAT THE SCENE COST, from the row's own events", () => {
    /* The project rule: a scene with no consequence is decoration. These
       screens read `dr.events` and never recompute — a screen that called a
       simulation function would show tonight's answer on a replay of
       episode four. */
    const anyArrow = rows.filter(r => !r.dr.finale)
      .some(r => /dr-arrow/.test(rpBuildWerkMorning(r) + rpBuildColdOpen(r)));
    expect(anyArrow, 'no screen ever showed a bond or an audience change').toBe(true);
  });

  it('speaks only this show\'s words', () => {
    for (const row of rows.filter(r => !r.dr.finale).slice(0, 4)) {
      for (const fn of [rpBuildColdOpen, rpBuildWerkMorning, rpBuildWerkElimDay]) {
        const text = strip(fn(row));
        expect(foreignWordsIn(text, 'drag-race'), `episode ${row.num}`).toEqual([]);
      }
    }
  });

  it('carries the modern CSS with a plain rule underneath', () => {
    const html = rpBuildWerkMorning(rows[3]);
    // The current features are used...
    expect(html).toMatch(/@property/);
    expect(html).toMatch(/:has\(/);
    expect(html).toMatch(/color-mix\(/);
    expect(html).toMatch(/container-type/);
    // ...and none of them is load-bearing: reveal is a class, reduced motion
    // is honoured, and the scroll-driven polish sits behind @supports.
    expect(html).toMatch(/@supports \(animation-timeline/);
    expect(html).toMatch(/prefers-reduced-motion/);
  });
});
