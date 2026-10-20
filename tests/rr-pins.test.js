// The user, 2026-10-19: "how do i choose the country... where is the dropdown in season timeline" and "why cant i
// choose where the non elimination twist happen myself". A leg's place and its kind can be pinned; everything not
// pinned is still drawn. Leg 1 starts at the start place and the last leg is the finale, as on the show.
import { describe, it, expect } from 'vitest';
import { drawRoute } from '../js/rr/route.js';
import { buildSchedule } from '../js/rr/schedule.js';
import { PLACES } from '../js/rr/places.js';

const middle = Object.values(PLACES).filter(p => !p.start && !p.finale).map(p => p.id);

describe('rr pinned legs', () => {
  it('a pinned place plays on its leg; the rest are drawn, never the same place twice in a row', () => {
    const pins = { 3: middle[0], 5: middle[1] };
    for (const seed of [1, 2, 3, 4]) {
      const route = drawRoute({ legs: 12, seed, options: { pins } });
      expect(route.length).toBe(12);
      expect(route[2]).toBe(middle[0]);
      expect(route[4]).toBe(middle[1]);
      expect(PLACES[route[0]].start).toBe(true);
      expect(PLACES[route.at(-1)].finale).toBe(true);
      for (let i = 1; i < route.length; i++) expect(route[i], `seed ${seed} leg ${i + 1}`).not.toBe(route[i - 1]);
    }
  });

  it('a pinned non-elimination leg is one; a pinned elimination leg is not; the count is at least the pins', () => {
    for (const seed of [1, 2, 3]) {
      const legs = buildSchedule({ teams: 10, seed, options: { legKinds: { 4: 'non', 6: 'non', 3: 'elim' } } });
      expect(legs.find(l => l.n === 4).kind).toBe('non');
      expect(legs.find(l => l.n === 6).kind).toBe('non');
      expect(legs.find(l => l.n === 3).kind).toBe('elim');
      expect(legs.at(-1).kind).toBe('final');
      // every team but the final three still goes home on an elimination leg
      expect(legs.filter(l => l.kind === 'elim').length).toBe(10 - 3);
    }
    // more pins than the share asks for: the season grows to hold them
    const many = buildSchedule({ teams: 6, seed: 1, options: { nonElimShare: 0, legKinds: { 2: 'non', 3: 'non', 4: 'non' } } });
    expect(many.filter(l => l.kind === 'non').map(l => l.n)).toEqual([2, 3, 4]);
  });
});
