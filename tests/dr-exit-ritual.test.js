// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-exit-ritual.test.js — every queen who goes home gets a goodbye,
// and the Showroom opens on somebody with something to show
// ══════════════════════════════════════════════════════════════════════
//
// Both of these were found by `npm run audit:dr-spec` check 5 ("no screen is
// claimed and empty") and neither had a guard of its own. The audit plays a
// hundred seasons and takes ten seconds; these take one, and they name the
// defect instead of reporting a count.
//
// 1. THE TOURNAMENT EXIT. js/dr/week.js skips renderStageBeats whole on a
//    bracket night -- right for the critiques and the lip sync, wrong for the
//    exit ritual at the bottom of it, which is format-agnostic. The queen the
//    bracket sent home left with no farewell, no mirror message and no closing
//    line, so Sashay Away drew her portrait over nothing while its subtitle
//    promised "the mirror message".
//
// 2. THE SHOWROOM'S FIRST TAB. It opened on `living[0]` -- cast order, which
//    knows nothing about who has a relationship -- so a night with seven
//    bonded pairs could greet the viewer with "No connections yet".
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { renderStageBeats } from '../js/dr/stage.js';
import { rpBuildRelationships } from '../js/vp-dr/relationships.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const DRAG = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

const RITUAL = ['stage:farewell', 'stage:mirror-message', 'stage:closing'];

describe('the exit ritual on a bracket night', () => {
  // The Lalaparuza pinned to a week that eliminates, which is the only shape
  // that reaches `M.tournamentExit` with somebody actually going home.
  const season = () => playDragSeason({
    cast: CAST, seed: 4711,
    config: { drSchedule: [{ episode: 5, maxiId: 'lipsync-challenge' }], drFinale: 'top4' },
  });

  it('runs a tournament night that sends somebody home — the control arm', () => {
    /* WITHOUT THIS THE TEST BELOW IS UNFAILABLE. If the pin did not take, or
       the night happened not to eliminate, "every exit has a farewell" is true
       of a season with no tournament exit in it at all. */
    const row = season().rows[4];
    expect(row.dr?.challenge?.id).toBe('lipsync-challenge');
    expect((row.exits || []).length).toBeGreaterThan(0);
    expect((row.dr.scenes || []).some(s => s.kind === 'tournament-elim')).toBe(true);
  });

  it('gives the queen it sent home a farewell, a mirror message and a close', () => {
    const row = season().rows[4];
    const kinds = new Set((row.dr.scenes || []).map(s => s.kind));
    for (const k of RITUAL) {
      expect(kinds.has(k), `a tournament exit emitted no ${k}`).toBe(true);
    }
  });

  it('files the ritual in the exit step, where the Sashay screen reads it', () => {
    /* The step is what decides which VP section a scene lands in -- push a
       scene into the wrong one and the screen is empty with the text sitting
       two sections up. Cheap to assert and the exact shape of the bug that
       emptied Elimination Day on eight episodes of nine. */
    const row = season().rows[4];
    for (const sc of (row.dr.scenes || [])) {
      if (RITUAL.includes(sc.kind)) expect(sc.step, sc.kind).toBe('exit');
    }
  });

  it('every elimination night in a season has the ritual, tournament or not', () => {
    for (const row of season().rows) {
      if (!(row.exits || []).length || row.dr?.finale) continue;
      const kinds = new Set((row.dr.scenes || []).map(s => s.kind));
      expect(kinds.has('stage:farewell'),
        `episode ${row.num} sent ${row.exits.map(x => x.name)} home with no farewell`)
        .toBe(true);
    }
  });

  it('emits the ritual and nothing before it when asked for it alone', () => {
    // exitOnly is the seam the week uses. If it ever started emitting the
    // stage as well, a bracket night would grow critiques it never held.
    const scenes = renderStageBeats({ exitOnly: true, exits: ['Q1'], players: {} });
    expect(scenes.length).toBeGreaterThan(0);
    for (const sc of scenes) expect(sc.step).toBe('exit');
    expect(scenes.some(s => s.kind === 'stage:entrance')).toBe(false);
  });
});

describe('the Showroom opens on somebody with something to show', () => {
  const ep = (bonds, living) => ({
    num: 3, dr: { bonds, living, families: [], scenes: [] },
  });

  it('does not open blank while another queen has connections', () => {
    /* The exact shape measured in the audit: the first queen in cast order has
       nothing, and everybody else has something. */
    const living = ['Q1', 'Q2', 'Q3', 'Q4'];
    const html = rpBuildRelationships(ep([
      ['Q2', 'Q3', 5], ['Q3', 'Q4', -4], ['Q2', 'Q4', 3],
    ], living));
    /* The open panel only -- the tabs are chrome and every queen is named
       there, so searching the whole document finds content that is one click
       away rather than content that is on screen.

       SLICING PAST THE `>` MATTERS. The first version of this cut at
       `indexOf('id="rel-content"')`, which lands INSIDE the opening tag, so
       the leftover `id="rel-content">` survived tag-stripping as literal text
       and every body began with it. `^No connections yet` could not match and
       the test passed with the fix reverted. */
    const open = html.slice(html.indexOf('id="rel-content"') + 'id="rel-content"'.length + 1);
    const body = open.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(body, 'the Showroom opened on the one queen with no connections')
      .not.toMatch(/^No connections yet/);
  });

  it('still opens on cast order when nobody has more than anybody else', () => {
    // A tie must not reshuffle the room: the choice has to be stable across a
    // rebuild, and cast order is the tie-break.
    const living = ['Q1', 'Q2', 'Q3'];
    const html = rpBuildRelationships(ep([['Q1', 'Q2', 4], ['Q2', 'Q3', -4]], living));
    const open = html.slice(html.indexOf('id="rel-content"'));
    expect(open).toContain('Q2');
  });
});
