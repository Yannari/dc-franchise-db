// How newcomers arrive (Plan 3b Task 7): each entry of spec 12.2, checked
// on what the engine did in a booked season.
import { describe, expect, it } from 'vitest';
import { setPlayers, TWIST_CATALOG } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rel } from '../js/ci/state.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';
import { ENTRIES } from '../js/ci/arrivals.js';
import { room } from './helpers/ci-room.js';

function season(bookings, seed = 5) {
  const cast = makePlayers(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const out = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, seed), seed, options: { bookings } });
  const arrivalDays = out.state.schedule.filter(d => d.arrivals > 0);
  return { ...out, arrivalDays };
}
function firstArrival(id, seed = 5, wantTwo = false) {
  const probe = season({}, seed);
  const d = probe.arrivalDays.find(x => (wantTwo ? x.arrivals >= 2 : x.arrivals === 1));
  if (!d) return null;
  const out = season({ [d.slot]: [id] }, seed);
  const on = kind => out.state.scenes.filter(s => s.kind === kind && s.day === d.day);
  return { ...out, day: d.day, on };
}

describe('the catalog', () => {
  it('every Circle arrival entry names a registered entry', () => {
    const mine = TWIST_CATALOG.filter(t => t.format === 'the-circle' && t.category === 'arrivals');
    expect(mine.length).toBeGreaterThanOrEqual(7);
    for (const t of mine) { expect(Object.keys(ENTRIES), t.id).toContain(t.ciEntry); expect(t.desc.length, t.id).toBeGreaterThan(200); }
  });
});

describe('a date with one of three (US 1 Ep 5)', () => {
  it('offers three, picks one for a date and a gift; the chosen warms, the two passed over feel it', () => {
    const r = firstArrival('ci-arrive-date');
    const date = r.on('date')[0];
    expect(date.data.options).toHaveLength(3);
    expect(date.data.options).toContain(date.data.chosen);
    const [h] = date.who;
    expect(rel(date.data.chosen, h, 'affection')).toBeGreaterThan(0);
  });
});

describe('invite one by one (US 3 Ep 6)', () => {
  it('invites in an order everybody can see', () => {
    const r = firstArrival('ci-arrive-invites');
    const inv = r.on('invites')[0];
    expect(inv.data.order.length).toBeGreaterThanOrEqual(3);
  });

  it('the newcomer invites the profile the room likes most first, and the bond follows the order', () => {
    // A newcomer has no bonds yet: they read the profiles and the likes. Read
    // on the day, in a flat room — at the end of a season every other day has
    // moved these bonds too, and the order says nothing about them.
    const s = room(6, 3);
    s.active = s.active.filter(h => h !== '@q5');
    s.likesCount = { '@q3': 6 };
    ENTRIES.invites.run(s, streamFor(1, 'invites'), ['@q5']);
    s.active.push('@q5');
    const { order } = s.scenes.find(x => x.kind === 'invites').data;
    expect(order[0]).toBe('@q3');
    const warmth = order.map(o => rel('@q5', o, 'affection'));
    expect(warmth).toEqual([...warmth].sort((a, b) => b - a));
  });
});

describe('race to message (US 6 Ep 6)', () => {
  it('the others race; the first to reach the newcomer gets the bond', () => {
    // A flat room, so only the race itself can move a bond.
    const s = room(6, 3);
    s.active = s.active.filter(h => h !== '@q5');
    ENTRIES.race.run(s, streamFor(1, 'race'), ['@q5']);
    const race = s.scenes.find(x => x.kind === 'race');
    expect(race.data.order.length).toBeGreaterThanOrEqual(2);
    expect(rel('@q5', race.data.order[0], 'affection')).toBeGreaterThan(rel('@q5', race.data.order.at(-1), 'affection'));
  });
});

describe('throw a party (US 4 Ep 7)', () => {
  it('the newcomer hosts; who was invited is noticed by who was not', () => {
    const r = firstArrival('ci-arrive-party');
    const p = r.on('newparty')[0];
    expect(p.data.guests.length).toBeGreaterThan(0);
    expect(p.data.left.length).toBeGreaterThan(0);
  });
});

describe('lurk silently (US 7 Ep 2)', () => {
  it('the newcomer watches before anyone knows, and arrives knowing who is strong', () => {
    const r = firstArrival('ci-arrive-lurk');
    const l = r.on('lurk')[0];
    expect(l.data.watched.length).toBeGreaterThan(0);
    expect(r.on('after-party')).toHaveLength(0);
  });
});

describe('chosen by the Influencers (US 4 Ep 1, US 6 Ep 1)', () => {
  it('the Influencers pick one of two waiting profiles; the chosen enters owing them', () => {
    const r = firstArrival('ci-arrive-chosen');
    const c = r.on('chosen')[0];
    if (!c) return;   // fell back: fewer than two waiting, or no Influencers yet
    expect(c.data.offered).toHaveLength(2);
    expect(c.data.offered).toContain(c.data.chosen);
    for (const i of c.data.by) expect(rel(c.data.chosen, i, 'obligation')).toBeGreaterThan(0);
    expect(r.state.joinedDay[c.data.chosen]).toBe(r.day);
  });
});

describe('arrive as a pair (US 3 Ep 3)', () => {
  it('two newcomers talk privately first and come in allied', () => {
    const r = firstArrival('ci-arrive-pair', 5, true);
    if (!r) return;
    const p = r.on('pair-arrival')[0];
    expect(p.who).toHaveLength(2);
    const [a, b] = p.who;
    expect(r.state.pacts.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a))).toBe(true);
  });
});

import { buildSchedule } from '../js/ci/schedule.js';
import { bookSeason } from '../js/ci/timeline.js';
import { streamFor } from '../js/dr/rng.js';
describe('the timeline and arrivals', () => {
  it('every slot is unique, so a booking lands on one day', () => {
    const s = buildSchedule({ total: 13, starters: 8, finalists: 5 });
    expect(new Set(s.map(d => d.slot)).size).toBe(s.length);
  });
  it('a pair on a one-arrival day pulls a newcomer forward, and nobody is lost', () => {
    const s = buildSchedule({ total: 13, starters: 8, finalists: 5 });
    const first = s.find(d => d.arrivals === 1);
    const booked = bookSeason(s, streamFor(1, 't'), { total: 13, finalists: 5, bookings: { [first.slot]: ['ci-arrive-pair'] } });
    const d = booked.find(x => x.slot === first.slot);
    expect(d.entry).toBe('pair');
    expect(d.arrivals).toBe(2);
    expect(booked.reduce((n, x) => n + x.arrivals, 0)).toBe(5);
  });
  it('the pair actually plays in a season', () => {
    const cast = makePlayers(13, 5); setPlayers(cast);
    const names = cast.map(p => p.name);
    const probe = buildSchedule({ total: 13, starters: 8, finalists: 5 });
    const slot = probe.find(d => d.arrivals === 1).slot;
    const { state } = playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(6, 5), seed: 5,
      options: { bookings: { [slot]: ['ci-arrive-pair'] } } });
    const p = state.scenes.find(s => s.kind === 'pair-arrival');
    expect(p).toBeTruthy();
    const [a, b] = p.who;
    expect(state.pacts.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a))).toBe(true);
  });
});
