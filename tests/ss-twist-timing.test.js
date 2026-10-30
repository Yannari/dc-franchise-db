// When the twists may happen (js/ss/schedule.js; the user, 2026-10-30: "why are they already clan ep2 u gotta locked
// some twist so they can only appear later in the game"): each twist has its earliest week, a week holds two at most,
// and the timeline's Randomize books nothing before its time.
import { describe, it, expect } from 'vitest';
import { SS_EARLIEST, SS_MAX_PER_WEEK, surpriseOk, markSurprise, ssRandomDraw, earliestOf } from '../js/ss/schedule.js';
import { seededRandom } from './helpers/rng.js';

describe('twist timing', () => {
  it('no twist before its week; the big ones wait for week four or later', () => {
    expect(SS_EARLIEST['ss-clans']).toBeGreaterThanOrEqual(4);
    expect(SS_EARLIEST['clans-event']).toBeGreaterThanOrEqual(4);
    expect(SS_EARLIEST['ss-second-house']).toBeGreaterThanOrEqual(4);
    const st = {};
    expect(surpriseOk(st, 2, 'ss-clans')).toBe(false);
    expect(surpriseOk(st, 4, 'ss-clans')).toBe(true);
  });
  it('two surprises a week at most', () => {
    const st = {};
    for (let i = 0; i < SS_MAX_PER_WEEK; i++) { expect(surpriseOk(st, 5)).toBe(true); markSurprise(st, 5, `t${i}`); }
    expect(surpriseOk(st, 5)).toBe(false);
    expect(surpriseOk(st, 6)).toBe(true);
  });
  it('the Randomize never books a card before its week', () => {
    const weeks = Array.from({ length: 12 }, (_, i) => ({ ep: i + 1, active: 16 - i, finale: i === 11 }));
    for (let s = 1; s <= 200; s++) for (const [ep, id] of ssRandomDraw(seededRandom(s), weeks)) if (id !== 'ss-public-signs') expect(ep).toBeGreaterThanOrEqual(earliestOf(id));
  });
});
