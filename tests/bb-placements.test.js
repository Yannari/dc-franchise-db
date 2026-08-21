// Placing a season that had somebody come back.
//
// _bbPlacements counted eviction EVENTS and numbered down from their total, so
// a houseguest evicted twice consumed two places and occupied one: the first
// exit was overwritten by the second, the abandoned number became a permanent
// hole, and everybody evicted before them was pushed a place further down.
//
// Measured on the first season with a return in it: fifteen evictions,
// fourteen people, a cast of seventeen numbered one to EIGHTEEN with no
// thirteenth place, and the first boot listed as eighteenth in a
// seventeen-player season.
import { describe, it, expect } from 'vitest';
import { extractBigBrotherSeasonTemplate } from '../js/stats-export.js';
import { setGs } from '../js/core.js';

// The template reads live state for popularity and the power ledger. It needs
// to exist; it does not need to say anything.
setGs({ popularity: {}, bb: { powers: [] }, episodeHistory: [] });

const week = (n, evicted) => ({ week: n, evicted, nominees: [], votes: {} });

describe('placements on a season with a return in it', () => {
  // Jane goes in week 6, comes back, and goes again in week 14.
  const NAMES = ['Stella', 'Amberly', 'Harriett', 'Zella', 'Hasan', 'Jane', 'Nico',
    'Dylon', 'Ireland', 'Natasha', 'Felipe', 'Gyselle', 'Aaron', 'Jane', 'Tobias'];
  const weeks = NAMES.map((n, i) => week(i + 1, n));
  const finalists = ['Misha', 'Jules', 'Joel'];
  const tmpl = extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber: 1, jurySize: 7 });
  const place = Object.fromEntries(tmpl.placements.map(p => [p.name, p.placement]));

  it('numbers every player once, with no gaps', () => {
    const places = tmpl.placements.map(p => p.placement).sort((a, b) => a - b);
    expect(places.length, 'a player was dropped or duplicated').toBe(17);
    places.forEach((n, i) => expect(n, `gap or repeat at ${n}`).toBe(i + 1));
  });

  it('does not put the first boot below the size of the cast', () => {
    expect(place.Stella, 'first evicted must be last place, not one past it').toBe(17);
  });

  it('places a returnee by their LAST exit, not their first', () => {
    // Coming back and lasting six more weeks is not a worse result than going
    // out the first time.
    expect(place.Jane).toBe(5);
    expect(place.Tobias, 'the boot before the final three').toBe(4);
  });

  it('keeps the finale on top', () => {
    expect(place.Misha).toBe(1);
    expect(place.Jules).toBe(2);
    expect(place.Joel).toBe(3);
  });
});
