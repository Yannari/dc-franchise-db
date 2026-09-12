// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-returnee-placement.test.js — ranked where she left the FIRST time
// ══════════════════════════════════════════════════════════════════════
//
// "Taystee returned ep6 so places higher than Cheryl Hole and Riot, but the
// placement in season of Drag Race 1 doesn't say that."
//
// It did not. `dragPlacements` orders the board from the bottom up by when
// each queen left, and it recorded the FIRST exit:
//
//   for (const x of row.exits || []) if (leftAt[x.name] === undefined) …
//
// Right for everybody who leaves once, and wrong for the one queen a season
// brings back. Measured on the exported season, where Taystee went out on
// episode three, returned on five and left again on six:
//
//   exits   ep2 Marge Stache · ep3 Taystee · ep4 Cheryl Hole
//           ep5 Riot · ep6 Taystee
//   board   11 Riot · 12 Cheryl Hole · 13 Taystee
//   true    11 Taystee · 12 Riot · 13 Cheryl Hole
//
// She outlasted both of them and was placed under both. The same defect the
// house had, where a returnee's career ended at her first eviction — a
// returnee is the only case where "when did she leave" has two answers, and
// only the last one places anybody.
import { describe, expect, it } from 'vitest';
import { dragPlacements } from '../js/dr/export.js';

/** A season as the exporter sees it: rows with `exits` and a finale. */
const row = (exits = [], dr = {}) => ({ exits, dr: { living: [], ...dr } });

describe('a queen who came back', () => {
  it('places where she left the second time', () => {
    const rows = [
      row(),
      row([{ name: 'Marge' }]),
      row([{ name: 'Taystee' }]),          // out first…
      row([{ name: 'Cheryl' }]),
      row(),                               // …back here…
      row([{ name: 'Taystee' }]),          // …and out for good, after Cheryl
      row([], { finale: { placements: ['Quin', 'Paige'] } }),
    ];
    const board = dragPlacements(rows, ['Quin', 'Paige', 'Taystee', 'Cheryl', 'Marge']);
    const at = n => board.find(p => p.name === n).placement;

    expect(at('Quin')).toBe(1);
    expect(at('Paige')).toBe(2);
    // The three who went home, newest exit first.
    expect(at('Taystee'), 'ranked at her first exit, under queens she outlasted')
      .toBeLessThan(at('Cheryl'));
    expect(at('Cheryl')).toBeLessThan(at('Marge'));
  });

  it('does not disturb a season where nobody returns', () => {
    const rows = [
      row(), row([{ name: 'C' }]), row([{ name: 'B' }]),
      row([], { finale: { placements: ['W', 'R'] } }),
    ];
    const board = dragPlacements(rows, ['W', 'R', 'B', 'C']);
    expect(board.map(p => p.name)).toEqual(['W', 'R', 'B', 'C']);
  });

  it('takes the verb from the exit that ended her season', () => {
    /* A queen eliminated, brought back and then disqualified did not sashay
       away — and `find` returned the first exit, so the board said she did. */
    const rows = [
      row([{ name: 'Taystee', verb: 'sashayed away' }]),
      row(),
      row([{ name: 'Taystee', verb: 'disqualified' }]),
      row([], { finale: { placements: ['Quin'] } }),
    ];
    const board = dragPlacements(rows, ['Quin', 'Taystee']);
    expect(board.find(p => p.name === 'Taystee').status).toBe('Disqualified');
  });
});
