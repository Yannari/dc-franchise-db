// The Ridonculous Race: a whole leg on one clock (engine plan, Task 18).
import { describe, it, expect } from 'vitest';
import { playLeg } from '../js/rr/leg.js';
import { PLACES } from '../js/rr/places.js';
import { streamFor } from '../js/dr/rng.js';
import { setGs } from '../js/core.js';
import { raceState } from './helpers/rr-cast.js';

function setup(n, seed = 21) {
  setGs({ bonds: {}, popularity: {} });
  const st = raceState(n, seed, { restMinutes: 720, medevacReturn: true });
  st.lastOrder = [...st.order];
  st.leg = 1;
  return st;
}
const LEG2 = { n: 2, kind: 'elim', money: 100, reward: null, twist: null };
const teamOf = (st, n) => st.order.find(id => st.teams[id].a === n || st.teams[id].b === n);

describe('rr leg', () => {
  it('plays the fire-mountain leg: every team either finishes or is out, times are increasing along the log', () => {
    const st = setup(12);
    const r = playLeg(st, { ...LEG2 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(5, 'leg2'));
    expect(r.order.length + r.eliminated.filter(x => !r.order.includes(x)).length).toBeGreaterThanOrEqual(11);
    expect(r.eliminated).toHaveLength(1);
    for (const id of st.order) {
      const mine = r.log.filter(l => l.id === id);
      for (let i = 1; i < mine.length; i++) expect(mine[i].from).toBeGreaterThanOrEqual(mine[i - 1].to);
    }
  });

  it('keeps the clock in whole minutes', () => {
    const st = setup(8, 3);
    const r = playLeg(st, { ...LEG2 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(3, 'leg'));
    for (const l of r.log) { expect(Number.isInteger(l.from), `${l.id} ${l.stretch}`).toBe(true); expect(Number.isInteger(l.to)).toBe(true); }
    for (const v of Object.values(r.times)) expect(Number.isInteger(v)).toBe(true);
  });

  it('is deterministic', () => {
    const a = setup(10);
    const ra = playLeg(a, { ...LEG2 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(9, 'leg'));
    const b = setup(10);
    const rb = playLeg(b, { ...LEG2 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(9, 'leg'));
    expect(rb.order).toEqual(ra.order);
    expect(rb.times).toEqual(ra.times);
    expect(b.scenes.length).toBe(a.scenes.length);
  });

  it('every between-teams scene names teams that were at the same stretch at the same minute', () => {
    const st = setup(12, 33);
    const r = playLeg(st, { ...LEG2 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(33, 'leg'));
    const checked = r.scenes.filter(s => s.data.other && s.data.stretch && s.data.t != null);
    expect(checked.length).toBeGreaterThan(5);
    for (const s of checked) {
      for (const id of [s.data.team, s.data.other]) {
        const ok = r.log.some(l => l.id === id && l.stretch === s.data.stretch && l.from <= s.data.t && (s.data.t <= l.to || l.stretch === 'mat'));
        expect(ok, `${s.kind} ${id} at ${s.data.stretch} ${s.data.t}`).toBe(true);
      }
      // a room (family 3) seats people from any team present; a two-team scene names only its two teams
      if (s.data.family !== 3) for (const n of s.who) expect([s.data.team, s.data.other], s.kind).toContain(teamOf(st, n));
      for (const n of s.who) {
        const id = teamOf(st, n);
        expect(r.log.some(l => l.id === id && l.stretch === s.data.stretch && l.from <= s.data.t && (s.data.t <= l.to || l.stretch === 'mat')), `${s.kind} ${n}`).toBe(true);
      }
    }
  });

  it('a 12-team leg airs moments from at least six catalogue families', () => {
    const st = setup(12, 44);
    const r = playLeg(st, { ...LEG2 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(44, 'leg'));
    const fams = new Set(r.scenes.map(s => s.data.family).filter(Boolean));
    expect(fams.size).toBeGreaterThanOrEqual(6);
  });

  it('every team gets at least two partner moments', () => {
    const st = setup(12, 45);
    const r = playLeg(st, { ...LEG2 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(45, 'leg'));
    for (const id of r.order) expect(r.scenes.filter(s => s.data.family === 1 && s.data.team === id).length, id).toBeGreaterThanOrEqual(2);
  });

  it('a Boomerang target re-runs the task (two intervals on that stretch)', () => {
    let found = false;
    for (let s = 1; s <= 25 && !found; s++) {
      const st = setup(10, s);
      const r = playLeg(st, { n: 2, kind: 'elim', money: 100, reward: null, twist: 'boomerang' },
        PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(s, 'boom'));
      const target = Object.keys(st.uturn || {})[0];
      // a target can be stopped before the board, or on its way back (a place closed for the night, then Don): look for
      // one that got there and finished the leg
      if (!target || !r.log.some(l => l.id === target && l.stretch === 'board') || !r.log.some(l => l.id === target && l.stretch === 'mat')) continue;
      found = true;
      const redo = st.uturn[target].stretch;
      expect(r.log.filter(l => l.id === target && l.stretch === redo)).toHaveLength(2);
      expect(r.log.filter(l => l.id === target && l.stretch === 'board')).toHaveLength(2);
    }
    expect(found).toBe(true);
  });

  it('a place that is closed holds teams until it opens', () => {
    const st = setup(6, 7);
    st.clock = 420;
    const temple = { id: 'temple-isle', name: 'Temple Isle', region: 'ocean', stretches: [
      { id: 'walk', kind: 'travel', mode: 'foot', base: 10, cost: 0 },
      { id: 'temple', kind: 'allin', types: ['brains'], base: 20, pass: 0.6, loopCost: 5, opens: 600, closes: 1200 },
      { id: 'mat', kind: 'mat' },
    ] };
    const r = playLeg(st, { ...LEG2 }, null, temple, streamFor(7, 'temple'));
    const at = r.log.filter(l => l.stretch === 'temple');
    expect(at).toHaveLength(6);
    for (const l of at) expect(l.to).toBeGreaterThanOrEqual(600 - 420);
  });
});
