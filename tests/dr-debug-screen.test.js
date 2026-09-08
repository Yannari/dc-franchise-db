// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-debug-screen.test.js — the fan ledger, the arcs, and being able to
// open the screen that shows them
// ══════════════════════════════════════════════════════════════════════
//
// Three separate failures met here, and only one of them was a missing
// feature:
//
//   1. POPULARITY WAS WRITTEN AND NEVER STORED. Nearly every scene in this
//      show moves the ledger and it lived only on the season state, which is
//      one object for the whole run — so no episode could draw its own
//      standing and none did. The most-written number in the show was
//      invisible.
//   2. THE DEBUG SCREEN WAS BEHIND A FLAG NOTHING SETS. `dr_debug_screen` is
//      written by no button; the toolbar's wrench sets `vp_debug`, the way it
//      does for the other shows. The screen existed, was registered, and
//      could only be opened by typing into localStorage by hand.
//   3. AND IT WAS NOT DEEP-DIVE ONLY. The view filter hid `debug` by exact
//      id, so `dr-debug` and the castle's `tr-debug` both sat in the
//      watch-mode running order, between the runway and the lip sync.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { rpBuildDragSummary } from '../js/vp-dr/summary.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];
const NAMES = ['Ivy', 'Coco', 'Nell', 'Rita', 'Mimi', 'Bowie', 'Julia', 'Emmah', 'Axel', 'Wayne'];

const season = (seed = 3) => {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  const cast = NAMES.map((name, i) => ({
    name, slug: name.toLowerCase(), gender: 'f', archetype: 'wildcard', age: 25 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
  return playDragSeason({ cast, seed });
};

describe('the fan ledger reaches the row', () => {
  const { rows } = season();

  it('is on every episode, not just at the end', () => {
    for (const row of rows) {
      expect(row.dr.popularity, `ep ${row.num} has no ledger`).toBeTruthy();
      expect(Object.keys(row.dr.popularity).length).toBeGreaterThan(0);
    }
  });

  it('is a snapshot, so a replayed episode shows that episode', () => {
    /* The ledger is one object mutated all season. Copying the reference
       rather than the values would make every episode show the finale's
       numbers, and would look completely correct on the last row — which is
       the row anybody checks first. */
    const early = rows[1].dr.popularity;
    const late = rows[rows.length - 1].dr.popularity;
    const moved = Object.keys(early).filter(n => early[n] !== late[n]);
    expect(moved.length, 'every episode holds identical numbers').toBeGreaterThan(0);
  });

  it('has somebody the audience actively dislikes', () => {
    // Not a nice-to-have: a ledger that only ever goes up is a participation
    // count, and the screen's tiers below HATED would be unreachable content.
    const last = rows[rows.length - 1].dr.popularity;
    const vals = Object.values(last);
    expect(Math.min(...vals)).toBeLessThan(Math.max(...vals));
  });
});

describe('the debug screen', () => {
  const { rows } = season();
  const row = rows[Math.floor(rows.length / 2)];

  it('draws the fan pulse with real names and a tier on each', () => {
    const html = rpBuildDragSummary(row);
    expect(html).toContain('Fan pulse');
    expect(html).toMatch(/LOVED|FAN FAVOURITE|RISING|STEADY|INVISIBLE|FADING|UNPOPULAR|HATED/);
    // Populated, not the empty state — a heading alone passes a `toContain`.
    expect(html).not.toContain('No fan ledger');
    const top = Object.entries(row.dr.popularity).sort((a, b) => b[1] - a[1])[0][0];
    expect(html).toContain(top);
  });

  it('answers "what storyline is she on" per queen, told arcs first', () => {
    /* Listed flat it was 23 arcs, most with zero beats — cast at the start
       and never told — so one queen carried four labels, three of which the
       season had never said out loud. */
    const html = rpBuildDragSummary(row);
    expect(html).toContain('Storylines');
    for (const n of row.dr.living) expect(html, `${n} is missing`).toContain(n);
    const told = row.dr.storylines.filter(a => a.alive && a.beats > 0);
    if (told.length) {
      // A told arc prints its beat count; an untold one is greyed and bare.
      expect(html).toMatch(/·\d/);
      expect(html).toContain('cast and never used');
    }
  });

  it('is on the finale too', () => {
    // Both panels are season-long and the finale is where they pay off.
    expect(rpBuildDragSummary(rows[rows.length - 1])).toContain('Fan pulse');
  });

  it('opens on an episode that has none of it', () => {
    // A debug screen that can crash is one you cannot open on the episode
    // that broke.
    expect(() => rpBuildDragSummary({ num: 1, dr: {} })).not.toThrow();
    expect(rpBuildDragSummary({ num: 1, dr: {} })).toContain('No fan ledger');
  });
});

describe('being able to open it', () => {
  const read = f => readFileSync(f, 'utf8');

  it('honours the flag the toolbar actually sets', () => {
    // THE BUG: registered behind `dr_debug_screen`, which nothing writes.
    const src = read('js/vp-screens.js');
    const block = src.slice(src.indexOf("built.push({ id: 'dr-debug'") - 900,
      src.indexOf("built.push({ id: 'dr-debug'"));
    expect(block, 'the drag debug screen ignores vp_debug').toContain('vp_debug');
    // And the old flag still works, so a season switched on by hand stays on.
    expect(block).toContain('dr_debug_screen');
  });

  it('keeps every show’s debug screen out of the watching modes', () => {
    /* Matched by SHAPE, not by a list of three ids: `debug`, `tr-debug` and
       `dr-debug` exist today and a fourth show would have arrived the same
       way — through a filter that knew only the first. */
    const ui = read('js/vp-ui.js');
    expect(ui).toContain("endsWith('-debug')");
    // Both modes that hide it must use the shared test, not an id compare.
    const watch = ui.slice(ui.indexOf('function _vpVisibleIndexes'), ui.indexOf('export function vpSetViewMode'));
    expect(watch).toContain('_vpIsDebug');
    const quick = ui.slice(ui.indexOf('function _vpQuickScreen'), ui.indexOf('function _vpVisibleIndexes'));
    expect(quick).toContain('_vpIsDebug');
    expect(quick, 'quick mode still compares the id directly')
      .not.toContain("screen.id === 'debug'");
  });
});
