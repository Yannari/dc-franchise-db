// ══════════════════════════════════════════════════════════════════════
// dr-vp-summary.test.js — an episode can be OPENED
// ══════════════════════════════════════════════════════════════════════
//
// Found by playing a season in a browser and clicking an episode: it threw.
// The show could be played and never watched, because a drag row fell through
// to the Total Drama screen builder and its transcript writer, both of which
// read tribes and a Tribal Council off a row that has neither.
//
// This is the guard on that. It is NOT a guard on the viewing party's design,
// which is Plan 5's — it is the floor: every episode of a season renders and
// transcribes without throwing, in this show's own words.
import { describe, expect, it } from 'vitest';
import { rpBuildDragSummary, generateDragSummaryText } from '../js/vp-dr/summary.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'mastermind', 'goat'];

function cast(n = 12, seed = 1) {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'm', 'nb'][i % 3],
    archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const strip = h => h.replace(/<[^>]+>/g, ' ');

describe('every episode of a season opens', () => {
  const seasons = Array.from({ length: 6 }, (_, s) => playDragSeason({ cast: cast(12, 300 + s), seed: s }));

  it('renders without throwing, and says something', () => {
    for (const { rows } of seasons) {
      for (const row of rows) {
        let html;
        expect(() => { html = rpBuildDragSummary(row); }, `episode ${row.num}`).not.toThrow();
        expect(html.length, `episode ${row.num} is empty`).toBeGreaterThan(300);
        expect(html, `episode ${row.num} leaked a placeholder`).not.toMatch(/undefined|NaN|\[object/);
      }
    }
  });

  it('transcribes without throwing', () => {
    for (const { rows } of seasons) {
      for (const row of rows) {
        let txt;
        expect(() => { txt = generateDragSummaryText(row); }, `episode ${row.num}`).not.toThrow();
        expect(txt.length, `episode ${row.num}`).toBeGreaterThan(150);
        expect(txt).toMatch(/DRAG RACE — EPISODE/);
        expect(txt, `episode ${row.num} leaked a placeholder`).not.toMatch(/undefined|NaN|\[object/);
      }
    }
  });

  it('speaks this show\'s words and no other\'s', () => {
    for (const { rows } of seasons) {
      for (const row of rows) {
        expect(foreignWordsIn(strip(rpBuildDragSummary(row)), 'drag-race'), `screen, episode ${row.num}`).toEqual([]);
        expect(foreignWordsIn(generateDragSummaryText(row), 'drag-race'), `text, episode ${row.num}`).toEqual([]);
      }
    }
  });

  it('shows the panel rank beside the final one — the thing worth watching', () => {
    const row = seasons[0].rows.find(r => !r.dr.finale);
    const html = rpBuildDragSummary(row);
    expect(html).toMatch(/PANEL/);
    expect(html).toMatch(/FINAL/);
    for (const b of row.dr.bend.slice(0, 3)) expect(html).toContain(b.name);
  });

  it('the finale draws the bracket and the crown', () => {
    const last = seasons[0].rows[seasons[0].rows.length - 1];
    const html = rpBuildDragSummary(last);
    expect(html).toContain(last.dr.finale.winner);
    expect(html).toMatch(/crowned/i);
    /* THE PLACEMENTS SURVIVED THE MOVE TO THE REGISTRY. A finale row emits
       only five scenes, so a transcript built from scenes alone would have
       dropped the bracket and the finishing order — the one thing a finale
       is for — the day the readout was replaced. `finaleBlock` renders them
       from `dr.finale`, which is structured data and on no scene at all. */
    const text = generateDragSummaryText(last);
    expect(text).toMatch(/Placements/i);
    expect(text).toContain(last.dr.finale.winner);
    for (const n of last.dr.finale.placements) expect(text, n).toContain(n);
  });

  it('IS THE SCREENS NOW, not a readout of the engine', () => {
    /* This used to assert the transcript called itself a readout, so nobody
       would mistake it for the finished thing. It is the finished thing now:
       `generateDragSummaryText` renders `dragScreensRevealed` and strips the
       HTML, so one list feeds the viewing party and the transcript both.
       The readout survives behind the `dr_debug_screen` flag.

       And it prints the EPISODE, not the shadow row's key. The transcript
       builds on a renumbered copy so it cannot consume the viewer's own
       reveals, and reading that number for display put "EPISODE -5" at the
       top of every transcribed screen. */
    const row = seasons[0].rows[1];
    const text = generateDragSummaryText(row);
    expect(text).not.toMatch(/readout/i);
    expect(text).toMatch('EPISODE 2');
    expect(text).not.toMatch(/EPISODE -/);
    // Nor the furniture: no status bar, no reveal buttons, no cast rail.
    expect(text).not.toMatch(/Reveal all|QUEENS/);
    // But the screens themselves are all there, by name.
    expect(text).toMatch(/COLD OPEN/);
    expect(text).toMatch(/CRITIQUES/);
  });

  it('survives a malformed row rather than taking the page down', () => {
    for (const bad of [{ num: 1, dr: {} }, { num: 2, dr: { call: {} }, exits: [] },
      { num: 3, dr: { bend: [], living: [] }, exits: [] }]) {
      expect(() => rpBuildDragSummary(bad), JSON.stringify(bad)).not.toThrow();
      expect(() => generateDragSummaryText(bad), JSON.stringify(bad)).not.toThrow();
    }
  });
});
