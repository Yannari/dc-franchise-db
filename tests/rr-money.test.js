// The Ridonculous Race: money, begging, borrowing and debts (engine plan, Task 7).
import { describe, it, expect } from 'vitest';
import { payStipend, spend, afford, surrender, repayDebts } from '../js/rr/money.js';
import { resolveTravel } from '../js/rr/travel.js';
import { runLeg } from '../js/rr/clock.js';
import { streamFor } from '../js/dr/rng.js';
import { addBond, getBond } from '../js/bonds.js';
import { setGs } from '../js/core.js';
import { raceState } from './helpers/rr-cast.js';

const none = { here: () => [] };

describe('rr money', () => {
  it('pays the stipend to every active team, skipping a team that surrendered', () => {
    const st = raceState(4, 1);
    payStipend(st, { n: 2, money: 120 });
    for (const id of st.order) expect(st.money[id]).toBe(120);
    st.leg = 2;
    surrender(st, st.order[0], 'surrender-money');
    expect(st.money[st.order[0]]).toBe(0);
    payStipend(st, { n: 3, money: 100 });
    expect(st.money[st.order[0]]).toBe(0);
    expect(st.money[st.order[1]]).toBe(220);
    payStipend(st, { n: 4, money: 100 });
    expect(st.money[st.order[0]]).toBe(100);
  });

  it('surrendering everything takes the bag too', () => {
    const st = raceState(4, 1); st.leg = 5;
    surrender(st, st.order[1], 'surrender-all');
    expect(st.noBag[st.order[1]]).toBe(6);
  });

  it('spend refuses when short and changes nothing', () => {
    const st = raceState(2, 1);
    st.money[st.order[0]] = 20;
    expect(spend(st, st.order[0], 30, 'taxi')).toBe(false);
    expect(st.money[st.order[0]]).toBe(20);
    expect(spend(st, st.order[0], 15, 'taxi')).toBe(true);
    expect(st.money[st.order[0]]).toBe(5);
  });

  it('a broke team walks where it can', () => {
    const st = raceState(2, 1);
    const taxi = { id: 'taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 40 };
    expect(afford(st, st.teams[st.order[0]], taxi, 0, streamFor(1, 'm'), none).how).toBe('walk');
  });

  it('a team at $0 on a boat stretch begs, never where begging is not allowed', () => {
    const st = raceState(4, 1); const [t] = st.order;
    const boat = { id: 'boat', kind: 'travel', mode: 'boat', base: 30, cost: 40 };
    const r = afford(st, st.teams[t], boat, 100, streamFor(1, 'm'), none);
    expect(r.how).toBe('beg');
    expect(r.minutes).toBeGreaterThan(0);
    expect(st.money[t]).toBeGreaterThanOrEqual(40);
    expect(st.rec[t].begged).toBeGreaterThan(0);
    expect(st.scenes.some(s => s.kind === 'beg')).toBe(true);
    st.money[t] = 0;
    const r2 = afford(st, st.teams[t], { ...boat, noBeg: true }, 100, streamFor(1, 'm'), none);
    expect(r2.how).not.toBe('beg');
    expect(r2.minutes).toBeGreaterThan(0);
  });

  it('borrows from an ally present with money to spare, and repays later', () => {
    setGs({ bonds: {} });
    const st = raceState(4, 1); const [t, ally] = st.order;
    const A = st.teams[t], B = st.teams[ally];
    addBond(A.a, B.a, 4);
    st.money[ally] = 200;
    const boat = { id: 'boat', kind: 'travel', mode: 'boat', base: 30, cost: 40 };
    const r = afford(st, A, boat, 100, streamFor(1, 'm'), { here: () => [{ id: ally }] });
    expect(r.how).toBe('borrow');
    expect(st.money[ally]).toBe(160);
    expect(st.debts).toEqual([{ from: t, to: ally, amount: 40, leg: st.leg, paid: false }]);
    st.money[t] = 100;
    const before = getBond(A.a, B.a);
    repayDebts(st);
    expect(st.debts[0].paid).toBe(true);
    expect(st.money[ally]).toBe(200);
    expect(getBond(A.a, B.a)).toBeGreaterThan(before);
  });

  it('a debt left unpaid three legs on is dodged', () => {
    setGs({ bonds: {} });
    const st = raceState(4, 1); const [t, ally] = st.order;
    st.debts.push({ from: t, to: ally, amount: 40, leg: 1, paid: false });
    st.money[t] = 0; st.leg = 4;
    repayDebts(st);
    expect(st.scenes.some(s => s.kind === 'debt-dodged')).toBe(true);
  });

  it('travel charges the fare, and a broke team still gets through', () => {
    const st = raceState(3, 2);
    const taxi = { id: 'taxi', kind: 'travel', mode: 'taxi', base: 30, cost: 25 };
    st.money[st.order[0]] = 100; st.money[st.order[1]] = 0; st.money[st.order[2]] = 0;
    const r = runLeg({ teams: st.order.map(id => ({ id, t: 0 })), stretches: [taxi], resolve: (tm, s, t, api) => resolveTravel(st, tm, s, t, api, streamFor(2, 'x')) });
    expect(st.money[st.order[0]]).toBe(75);
    expect(Object.keys(r.finish)).toHaveLength(3);
    expect(r.finish[st.order[1]]).toBeGreaterThan(r.finish[st.order[0]]);
  });
});
