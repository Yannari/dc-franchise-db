// The Ridonculous Race: the Chill Zone (engine plan, Task 17).
import { describe, it, expect } from 'vitest';
import { checkIn, medevac } from '../js/rr/chill.js';
import { DON_GOES_AFTER, MARKED_MINUTES, DEPARTURE_PENALTY } from '../js/rr/format.js';
import { streamFor } from '../js/dr/rng.js';
import { setGs } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { raceState } from './helpers/rr-cast.js';

function setup(n, options = {}) {
  setGs({ bonds: {}, popularity: {} });
  const st = raceState(n, 11, { restMinutes: 720, medevacReturn: true, ...options });
  st.leg = 2;
  st.lastOrder = [...st.order];
  return st;
}
const elim = { n: 2, kind: 'elim', reward: null };

describe('rr Chill Zone', () => {
  it('same-minute finishes are ordered by last leg', () => {
    const st = setup(3); const [a, b, c] = st.order; st.lastOrder = [b, a, c];
    const r = checkIn(st, { n: 2, kind: 'non', nonElimPenalty: 'speed-bump' }, { [a]: 100, [b]: 100, [c]: 200 }, []);
    expect(r.order).toEqual([b, a, c]);
    expect(r.nonElim).toEqual({ id: c, penalty: 'speed-bump' });
    expect(st.speedBump[c]).toBe(3);
    expect(r.eliminated).toEqual([]);
    expect(st.rec[c].lasts).toBe(1);
  });

  it('a penalty can drop a team into last; a last team on an elimination leg does not serve its own', () => {
    const st = setup(3); const [a, b, c] = st.order;
    st.pending[a] = 30;
    const r = checkIn(st, elim, { [a]: 100, [b]: 110, [c]: 120 }, []);
    expect(r.order).toEqual([b, c, a]);
    expect(r.eliminated).toEqual([a]);
    expect(r.how[a]).toBe('last');
    expect(r.unserved).toContain(a);
    expect(st.gone).toContain(a);
    expect(st.rec[a].penalties).toBe(30);
    expect(st.pending).toEqual({});
    expect(st.scenes.some(s => s.kind === 'don-elim' && s.data.team === a)).toBe(true);
  });

  it('a team too far behind is eliminated where it stands', () => {
    const st = setup(4); const [a, b, c, d] = st.order;
    const r = checkIn(st, elim, { [a]: 100, [b]: 120, [c]: 140, [d]: 140 + DON_GOES_AFTER + 1 }, []);
    expect(r.eliminated).toEqual([d]);
    expect(r.how[d]).toBe('on-location');
    expect(st.scenes.some(s => s.kind === 'don-arrives' && s.data.team === d)).toBe(true);
    const st2 = setup(4); const [p, q, x, y] = st2.order;
    const r2 = checkIn(st2, elim, { [p]: 100, [q]: 120, [x]: 140 }, [y]);
    expect(r2.eliminated).toEqual([y]);
    expect(r2.how[y]).toBe('on-location');
  });

  it('a Save passes the elimination to the next-to-last', () => {
    const st = setup(4); const [a, b, c, d] = st.order;
    st.passes[d].save = 1;
    const r = checkIn(st, elim, { [a]: 100, [b]: 110, [c]: 120, [d]: 130 }, []);
    expect(r.eliminated).toEqual([c]);
    expect(st.gone).not.toContain(d);
    expect(st.passes[d].save).toBe(0);
    expect(st.rec[d].lasts).toBe(1);
  });

  it('departure gaps are the real gaps, and the clock moves to the next morning', () => {
    const st = setup(3); const [a, b, c] = st.order;
    st.clock = 420;
    const r = checkIn(st, { n: 2, kind: 'non', nonElimPenalty: 'departure' }, { [a]: 300, [b]: 345, [c]: 400 }, []);
    expect(r.depart).toEqual({ [a]: 0, [b]: 45, [c]: 100 });
    expect(st.clock).toBe((420 + 300 + 720) % 1440);
    expect(st.carryPenalty[c]).toBe(DEPARTURE_PENALTY);
    // the carried penalty is served at the next mat
    st.leg = 3;
    const r3 = checkIn(st, { n: 3, kind: 'elim' }, { [a]: 100, [b]: 110, [c]: 100 }, []);
    expect(r3.times[c]).toBe(100 + DEPARTURE_PENALTY);
    expect(st.carryPenalty[c] || 0).toBe(0);
  });

  it('a marked team pays half an hour unless it wins the next leg', () => {
    const st = setup(3); const [a, b, c] = st.order;
    st.marked[c] = 2;
    const r = checkIn(st, { n: 2, kind: 'non', nonElimPenalty: 'marked' }, { [a]: 100, [b]: 110, [c]: 105 }, []);
    expect(r.times[c]).toBe(105 + MARKED_MINUTES);
    const st2 = setup(3); const [x, y, z] = st2.order;
    st2.marked[z] = 2;
    const r2 = checkIn(st2, { n: 2, kind: 'non', nonElimPenalty: 'marked' }, { [x]: 100, [y]: 110, [z]: 90 }, []);
    expect(r2.times[z]).toBe(90);
  });

  it('the first team gets the reward and a leg win', () => {
    const st = setup(3); const [a, b, c] = st.order;
    st.money[a] = 10;
    checkIn(st, { n: 2, kind: 'elim', reward: 'cash' }, { [a]: 100, [b]: 110, [c]: 120 }, []);
    expect(st.money[a]).toBe(210);
    expect(st.rec[a].legWins).toBe(1);
    const st2 = setup(3); const [p, q, r] = st2.order;
    checkIn(st2, { n: 2, kind: 'elim', reward: 'first-class' }, { [p]: 100, [q]: 110, [r]: 120 }, []);
    expect(st2.firstClass[p]).toBe(3);
  });

  it('a medevac brings back the eliminated team the medevaced team owes most', () => {
    const st = setup(7); const [a, , , , e, f] = st.order;
    st.gone.push(e, f);
    st.owes.push({ from: a, to: f, leg: 1 }, { from: a, to: f, leg: 2 }, { from: a, to: e, leg: 1 });
    addBond(st.teams[a].a, st.teams[e].a, 5);
    const r = medevac(st, a, 3, streamFor(1, 'm'));
    expect(r.returned).toBe(f);
    expect(st.gone).toContain(a);
    expect(st.gone).not.toContain(f);
    expect(st.scenes.some(s => s.kind === 'medevac-choice')).toBe(true);
  });

  it('nobody returns when fewer than four teams would remain', () => {
    const st = setup(4); const [a, , , d] = st.order;
    st.gone.push(d);
    expect(medevac(st, a, 3, streamFor(1, 'm')).returned).toBeNull();
  });
});
