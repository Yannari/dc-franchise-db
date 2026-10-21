// The race's twists are in Available Twists (the user, 2026-10-21: "we have surprise twist but no way to schedule those
// twist in the season timeline ... add them in Available Twists"). Each of the leg twists the season draws (schedule.js
// LEG_TWISTS) is a card in the catalogue for this show only, saying how it plays, and booking it on the legs selected
// pins that leg's twist, the same pin as the tile's TWIST picker; never the first leg or the last two.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { twistsForFormat, TWIST_CATEGORIES } from '../js/core.js';
import { RACE_FORMAT } from '../js/shows.js';
import { LEG_TWISTS } from '../js/rr/schedule.js';
import { raceBookTwist } from '../js/rr-run.js';

describe('rr: the twists in Available Twists', () => {
  const mine = twistsForFormat({ format: RACE_FORMAT });
  it('has a card for every leg twist the season can draw, and only for this show', () => {
    expect(mine.map(t => t.raceTwist).sort()).toEqual([...LEG_TWISTS].sort());
    for (const t of mine) {
      expect(t.id, t.id).toBe(`rr-${t.raceTwist}`);
      expect(TWIST_CATEGORIES.some(c => c.id === t.category), t.id).toBe(true);
      expect(t.desc.length, t.id).toBeGreaterThanOrEqual(200);
      expect(t.desc, t.id).not.toMatch(/\bvote\b/i);
    }
    expect(twistsForFormat({ format: 'total-drama' }).some(t => t.raceTwist)).toBe(false);
  });

  it('books a twist on the legs selected, as the leg\'s twist pin, and refuses the first leg and the last two', () => {
    const config = { rrTwistPins: { 5: 'yield' } };
    const r = raceBookTwist([1, 3, 5, 9, 10], 'rr-boomerang', 10, config);
    expect(r.booked).toEqual([3, 5]);
    expect(r.refused).toEqual([1, 9, 10]);
    expect(config.rrTwistPins).toEqual({ 3: 'boomerang', 5: 'boomerang' });
    // (before there is a cast there are no legs to count: only the first leg is refused)
    const empty = {};
    expect(raceBookTwist([1, 4], 'rr-yield', 0, empty)).toEqual({ booked: [4], refused: [1] });
    expect(empty.rrTwistPins).toEqual({ 4: 'yield' });
  });

  it('is what clicking a race card in Available Twists does', () => {
    const src = readFileSync('js/run-ui.js', 'utf8');
    const fn = src.match(/export function assignTwist[\s\S]*?\n\}/)[0];
    expect(fn).toMatch(/raceTwist[\s\S]*raceBookTwist\(/);
  });
});
