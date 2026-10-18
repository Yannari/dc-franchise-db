// ══════════════════════════════════════════════════════════════════════
// rr/travel.js — flights, vehicles and the road
// ══════════════════════════════════════════════════════════════════════
//
// Spec §5.2, "the equaliser engine": flights in batches with seat limits taken in
// arrival order (a later flight can land first, a layover); on a booking leg a
// skilled traveller can find a better connection; vehicles that leave once full;
// stations with room for so many; ground travel scaled by Travel skill, with the
// odd mishap. Money is charged in money.js (Task 7).
import { addScene } from './state.js';
import { teamLevel, spreadOf } from './skill.js';
import { identityOf } from './identities.js';
import { REGIONS } from './places.js';

const CHECK_IN = 30;

export function flightStretches(from, to, nTeams, rng, { book = false } = {}) {
  const hops = Math.max(1, Math.abs(REGIONS.indexOf(from?.region) - REGIONS.indexOf(to?.region)));
  const duration = 240 + 120 * hops;
  const count = nTeams > 8 ? 3 : 2;
  const first = Math.ceil(nTeams / count);
  const flights = [];
  for (let k = 0; k < count; k++) {
    const departs = 60 + 90 * k;
    let lands = departs + duration + Math.round(rng() * 60);
    // a layover: one time in four the second flight lands before the first
    if (k === 1 && rng() < 0.25) lands = flights[0].lands - (20 + Math.round(rng() * 40));
    flights.push({ seats: k === count - 1 ? Infinity : first, departs, lands, taken: [] });
  }
  const air = { id: 'airport', kind: 'travel', mode: 'flight', base: duration, cost: 0, noBeg: true,
    label: `Fly to ${to?.name || 'the next place'}`, flights, book };
  if (book) {
    // a connection nobody was told about: two seats, earlier than the first batch
    air.connection = { seats: 2, departs: flights[0].departs + 30, lands: flights[0].lands - 45 - Math.round(rng() * 30), taken: [] };
  }
  return [air];
}

const flightOf = (stretch, id) => stretch.flights.findIndex(f => f.taken.includes(id));

export function reseat(stretch, id, k) {
  const target = stretch.flights[k];
  if (!target || target.taken.length >= target.seats) return false;
  const from = flightOf(stretch, id);
  if (from === k) return true;
  if (from >= 0) stretch.flights[from].taken = stretch.flights[from].taken.filter(x => x !== id);
  target.taken.push(id);
  return true;
}

function resolveFlight(state, team, stretch, t, rng) {
  const id = team.id;
  // first class (a reward): the first flight, whatever the queue
  if (state.firstClass?.[id] === state.leg && stretch.flights[0].taken.length < stretch.flights[0].seats + 1) {
    stretch.flights[0].taken.push(id);
    return { end: stretch.flights[0].lands, data: { flight: 0, firstClass: true } };
  }
  // a booking leg: a good traveller can find the connection nobody was told about
  const c = stretch.connection;
  if (c && c.taken.length < c.seats && t + CHECK_IN <= c.departs && rng() < 0.3 * teamLevel(state, id, ['travel']) / 10) {
    c.taken.push(id);
    const t2 = state.teams[id];
    addScene(state, 'found-flight', [t2.a, t2.b], { t, stretch: stretch.id, team: id }, [t2.a, t2.b]);
    return { end: c.lands, data: { flight: 'connection' } };
  }
  let k = stretch.flights.findIndex(f => f.taken.length < f.seats && f.departs >= t + CHECK_IN);
  if (k < 0) k = stretch.flights.length - 1;   // the last flight has no seat limit
  const f = stretch.flights[k];
  f.taken.push(id);
  return { end: Math.max(f.lands, t + CHECK_IN + stretch.base), data: { flight: k } };
}

const MISHAPS = [['flat-tyre', 25], ['lost-driver', 40], ['wrong-way', 30]];

function groundTime(state, id, stretch, rng) {
  const lv = Math.max(1, teamLevel(state, id, ['travel']));
  const t = state.teams[id];
  const spread = (spreadOf(t.a, ['travel']) + spreadOf(t.b, ['travel'])) / 2;
  return stretch.base * (1 + 0.25 * (0.5 - rng()) * spread) / (lv / 5);
}

export function resolveTravel(state, team, stretch, t, api, rng) {
  const id = team.id;
  if (stretch.mode === 'flight' && stretch.flights) return resolveFlight(state, team, stretch, t, rng);

  if (stretch.waitFor) {
    const v = api.vehicle(stretch.id, stretch, id, t);
    if (v.departs == null) return { hold: v.group.first + (stretch.maxWait ?? 60) };
    return { end: v.departs + stretch.base, data: { vehicle: v.group.members.length } };
  }

  let dur = groundTime(state, id, stretch, rng);
  let start = t;
  if (stretch.capacity) start = api.slot(stretch.id, stretch.capacity, t, dur);

  // the odd mishap on the road: the adversity twins get more of them
  const tm = state.teams[id];
  const mishap = identityOf(tm)?.mishap || 1;
  if (stretch.mode !== 'foot' && rng() < 0.06 * mishap) {
    const [kind, base] = MISHAPS[Math.floor(rng() * MISHAPS.length)];
    const minutes = Math.round(base / (Math.max(1, teamLevel(state, id, ['travel'])) / 5));
    dur += minutes;
    addScene(state, 'travel-mishap', [tm.a, tm.b], { t, stretch: stretch.id, team: id, kind, minutes }, [tm.a, tm.b]);
  }
  return { end: start + dur };
}

// One scene per flight: the teams on it share a cabin (the plane is a social room).
export function boardFlightScenes(state, stretch) {
  const out = [];
  const flights = [...stretch.flights, ...(stretch.connection ? [stretch.connection] : [])];
  flights.forEach((f, k) => {
    if (!f.taken.length) return;
    const people = f.taken.flatMap(id => [state.teams[id].a, state.teams[id].b]);
    out.push(addScene(state, 'same-flight', people, { flight: k, teams: [...f.taken], t: f.departs, stretch: stretch.id }, people));
  });
  return out;
}
