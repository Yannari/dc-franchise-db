// The Ridonculous Race: the place format, the starter places and the route (engine plan, Task 4).
import { describe, it, expect } from 'vitest';
import { PLACES, validatePlace, getPlace } from '../js/rr/places.js';
import { drawRoute } from '../js/rr/route.js';

describe('rr places', () => {
  it('the four starter places are valid', () => {
    expect(Object.keys(PLACES).sort()).toEqual(['fire-mountain-isle', 'home-city', 'red-sand-desert', 'skyline-finale']);
    for (const p of Object.values(PLACES)) expect(validatePlace(p), p.id).toEqual([]);
    expect(getPlace('home-city').start).toBe(true);
    expect(getPlace('skyline-finale').finale).toBe(true);
  });

  it('validatePlace catches a broken place', () => {
    const bad = { id: 'x', name: 'X', stretches: [{ id: 'e', kind: 'either', sides: [] }] };
    expect(validatePlace(bad).length).toBeGreaterThan(0);
    const real = { id: 'y', name: 'Y', stretches: [
      { id: 'a', kind: 'allin', types: ['water'], base: 20, pass: 0.5, loopCost: 5, desc: 'Teams swim across the bay off the coast of Japan. '.repeat(6) },
      { id: 'm', kind: 'mat' }] };
    expect(validatePlace(real).some(p => /real place/.test(p))).toBe(true);
    const short = { id: 'z', name: 'Z', stretches: [{ id: 'a', kind: 'allin', types: ['water'], base: 20, pass: 0.5, loopCost: 5, desc: 'Swim.' }, { id: 'm', kind: 'mat' }] };
    expect(validatePlace(short).some(p => /desc/.test(p))).toBe(true);
  });

  it('the route starts at the start place, ends at the finale, never repeats back to back', () => {
    for (const seed of [4, 9, 17]) {
      const r = drawRoute({ legs: 13, seed, options: {} });
      expect(r).toHaveLength(13);
      expect(PLACES[r[0]].start).toBe(true);
      expect(PLACES[r.at(-1)].finale).toBe(true);
      for (let i = 1; i < r.length; i++) expect(r[i]).not.toBe(r[i - 1]);
      for (const id of r.slice(1, -1)) { expect(PLACES[id].start).toBeFalsy(); expect(PLACES[id].finale).toBeFalsy(); }
    }
  });

  it('a booked route is used as given', () => {
    const route = ['home-city', 'red-sand-desert', 'skyline-finale'];
    expect(drawRoute({ legs: 3, seed: 1, options: { route } })).toEqual(route);
  });
});
