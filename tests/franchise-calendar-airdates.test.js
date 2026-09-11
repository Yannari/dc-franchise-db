// ══════════════════════════════════════════════════════════════════════
// franchise-calendar-airdates.test.js — per-episode dates, derived
// ══════════════════════════════════════════════════════════════════════
//
// The calendar stores year + slot and deliberately nothing finer: "days never
// matter here", says the file, and two dropdowns cannot be filled in wrong.
// A wiki article wants a date under an episode heading anyway.
//
// So these are DERIVED. The rule the file is built on -- one source of time,
// no second clock -- holds only if moving the season moves every episode with
// it, and if a season nobody has placed yields nothing at all rather than a
// plausible-looking fiction.
import { describe, expect, it } from 'vitest';
import { airDateLabel, episodeAirDates, premiereDate } from '../js/franchise-calendar.js';

const S = { airYear: 2027, airSlot: 'winter' };

describe('episode airdates', () => {
  it('runs weekly from the premiere', () => {
    const d = episodeAirDates(S, 9, 'drag-race');
    expect(d).toHaveLength(9);
    for (let i = 1; i < d.length; i++) {
      expect(d[i] - d[i - 1]).toBe(7 * 24 * 3600 * 1000);
    }
  });

  it('airs every episode on the show&apos;s own night', () => {
    // Friday for drag; a season that jumps weekday mid-run is a bug, not a
    // special episode -- the show has one slot.
    for (const d of episodeAirDates(S, 12, 'drag-race')) expect(d.getUTCDay()).toBe(5);
    for (const d of episodeAirDates(S, 12, 'big-brother')) expect(d.getUTCDay()).toBe(3);
  });

  it('starts inside the slot it was given', () => {
    expect(premiereDate({ airYear: 2027, airSlot: 'winter' }, 'drag-race').getUTCMonth()).toBe(0);
    expect(premiereDate({ airYear: 2027, airSlot: 'summer' }, 'drag-race').getUTCMonth()).toBe(6);
  });

  it('moves the whole run when the season moves', () => {
    /* The point of deriving instead of storing. If these could disagree there
       would be two clocks, which is the thing franchise-calendar.js exists to
       prevent. */
    const a = episodeAirDates({ airYear: 2027, airSlot: 'winter' }, 5, 'drag-race');
    const b = episodeAirDates({ airYear: 2027, airSlot: 'fall' }, 5, 'drag-race');
    expect(a.every((d, i) => d < b[i])).toBe(true);
  });

  it('gives nothing for a season nobody has placed', () => {
    expect(episodeAirDates({}, 9, 'drag-race')).toEqual([]);
    expect(episodeAirDates({ airYear: 2027 }, 9, 'drag-race')).toEqual([]);
    expect(episodeAirDates(S, 0, 'drag-race')).toEqual([]);
    expect(airDateLabel(null)).toBe('');
    expect(airDateLabel(new Date('nope'))).toBe('');
  });

  it('labels a date the way an article prints one', () => {
    expect(airDateLabel(new Date(Date.UTC(2027, 2, 24)))).toBe('March 24, 2027');
  });
});
