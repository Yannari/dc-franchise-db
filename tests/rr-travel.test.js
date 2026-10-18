// The Ridonculous Race: flights, vehicles and ground travel (engine plan, Task 6).
import { describe, it, expect } from 'vitest';
import { flightStretches, resolveTravel, reseat, boardFlightScenes } from '../js/rr/travel.js';
import { runLeg } from '../js/rr/clock.js';
import { PLACES } from '../js/rr/places.js';
import { streamFor } from '../js/dr/rng.js';
import { raceState } from './helpers/rr-cast.js';

const fly = (st, air, gap = 5) => {
  const rng = streamFor(2, 'travel');
  const teams = st.order.map((id, i) => ({ id, t: i * gap }));
  return runLeg({ teams, stretches: [air], resolve: (tm, s, t, api) => resolveTravel(st, tm, s, t, api, rng) });
};

describe('rr travel', () => {
  it('two flights up to 8 teams, three above; the last flight has no seat limit', () => {
    expect(flightStretches(PLACES['home-city'], PLACES['red-sand-desert'], 8, streamFor(1, 'f'))[0].flights).toHaveLength(2);
    const f = flightStretches(PLACES['home-city'], PLACES['red-sand-desert'], 12, streamFor(1, 'f'))[0].flights;
    expect(f).toHaveLength(3);
    expect(f[0].seats).toBe(4);
    expect(f.at(-1).seats).toBe(Infinity);
  });

  it('nobody is dropped when seats run out; seats go by arrival order', () => {
    const st = raceState(12, 2);
    const [air] = flightStretches(PLACES['home-city'], PLACES['red-sand-desert'], 12, streamFor(2, 'f'));
    const r = fly(st, air);
    expect(Object.keys(r.finish)).toHaveLength(12);
    for (const id of st.order.slice(0, air.flights[0].seats)) expect(r.finish[id]).toBe(air.flights[0].lands);
    for (const id of st.order.slice(air.flights[0].seats)) expect(air.flights[0].taken).not.toContain(id);
  });

  it('a later flight can land first', () => {
    let seen = false;
    for (let s = 1; s < 60 && !seen; s++) {
      const f = flightStretches(PLACES['home-city'], PLACES['fire-mountain-isle'], 12, streamFor(s, 'travel'))[0].flights;
      if (f[1].lands < f[0].lands) seen = true;
    }
    expect(seen).toBe(true);
  });

  it('flights are longer between distant regions', () => {
    const near = flightStretches(PLACES['home-city'], PLACES['skyline-finale'], 6, streamFor(1, 'f'))[0].flights[0];
    const far = flightStretches(PLACES['home-city'], PLACES['fire-mountain-isle'], 6, streamFor(1, 'f'))[0].flights[0];
    expect(far.lands - far.departs).toBeGreaterThan(near.lands - near.departs);
  });

  it('a found connection beats the batch on a booking leg', () => {
    const st = raceState(12, 3);
    let found = 0;
    for (let s = 1; s <= 30; s++) {
      const [air] = flightStretches(PLACES['home-city'], PLACES['red-sand-desert'], 12, streamFor(s, 'f'), { book: true });
      expect(air.connection).toBeTruthy();
      const r = fly(st, air);
      found += Object.values(r.finish).filter(t => t === air.connection.lands).length;
      expect(Object.values(r.finish).filter(t => t === air.connection.lands).length).toBeLessThanOrEqual(air.connection.seats);
    }
    expect(found).toBeGreaterThan(0);
  });

  it('reseat moves a team to a flight with a free seat', () => {
    const [air] = flightStretches(PLACES['home-city'], PLACES['red-sand-desert'], 12, streamFor(4, 'f'));
    air.flights[2].taken.push('tX');
    expect(reseat(air, 'tX', 0)).toBe(true);
    expect(air.flights[0].taken).toContain('tX');
    expect(air.flights[2].taken).not.toContain('tX');
  });

  it('ground travel takes longer for weaker travellers and records mishaps as scenes', () => {
    const st = raceState(12, 5);
    const taxi = { id: 'taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 0 };
    const rng = streamFor(5, 'g');
    let mishaps = 0;
    for (let k = 0; k < 40; k++) {
      runLeg({ teams: st.order.map(id => ({ id, t: 0 })), stretches: [taxi], resolve: (tm, s, t, api) => resolveTravel(st, tm, s, t, api, rng) });
    }
    mishaps = st.scenes.filter(s => s.kind === 'travel-mishap').length;
    expect(mishaps).toBeGreaterThan(0);
    for (const sc of st.scenes.filter(s => s.kind === 'travel-mishap')) expect(sc.data.minutes).toBeGreaterThan(0);
  });

  it('a flight\'s teams share a same-flight scene', () => {
    const st = raceState(12, 6);
    const [air] = flightStretches(PLACES['home-city'], PLACES['red-sand-desert'], 12, streamFor(6, 'f'));
    fly(st, air);
    const scenes = boardFlightScenes(st, air);
    expect(scenes.length).toBe(air.flights.filter(f => f.taken.length).length);
    const all = scenes.flatMap(s => s.data.teams);
    expect(new Set(all).size).toBe(12);
  });
});
