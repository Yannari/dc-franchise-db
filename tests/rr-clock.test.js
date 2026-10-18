// The Ridonculous Race: the leg clock (engine plan, Task 5).
import { describe, it, expect } from 'vitest';
import { runLeg } from '../js/rr/clock.js';

const walk = mins => ({ id: 's' + mins, kind: 'travel', base: mins });
const fixed = (team, s, t) => ({ end: t + s.base });

describe('rr clock', () => {
  it('moves teams in time order and records every interval', () => {
    const r = runLeg({ teams: [{ id: 'a', t: 0 }, { id: 'b', t: 10 }], stretches: [walk(30), walk(20)], resolve: fixed });
    expect(r.finish).toEqual({ a: 50, b: 60 });
    expect(r.log.filter(l => l.id === 'a').map(l => [l.from, l.to])).toEqual([[0, 30], [30, 50]]);
  });

  it('here() sees a team already at the stretch', () => {
    const seen = [];
    runLeg({ teams: [{ id: 'a', t: 0 }, { id: 'b', t: 5 }], stretches: [walk(30)],
      resolve: (team, s, t, api) => { seen.push([team.id, api.here(s.id, t).map(x => x.id)]); return { end: t + 30 }; } });
    expect(seen).toEqual([['a', []], ['b', ['a']]]);
  });

  it('a capacity-2 station queues the third team', () => {
    const st = { id: 'sauna', kind: 'allin', base: 10 };
    const r = runLeg({ teams: ['a', 'b', 'c'].map(id => ({ id, t: 0 })), stretches: [st],
      resolve: (team, s, t, api) => { const start = api.slot(s.id, 2, t, 10); return { end: start + 10 }; } });
    expect(r.finish).toEqual({ a: 10, b: 10, c: 20 });
  });

  it('a vehicle that waits for 3 leaves full, or at maxWait, or when nobody else can come', () => {
    const heli = { id: 'heli', kind: 'travel', base: 15, waitFor: 3, maxWait: 60 };
    const res = (team, s, t, api) => { const v = api.vehicle(s.id, s, team.id, t); return v.departs == null ? { hold: v.group.first + s.maxWait } : { end: v.departs + s.base }; };
    const r = runLeg({ teams: [{ id: 'a', t: 0 }, { id: 'b', t: 10 }, { id: 'c', t: 20 }, { id: 'd', t: 30 }], stretches: [heli], resolve: res });
    expect([r.finish.a, r.finish.b, r.finish.c]).toEqual([35, 35, 35]);
    expect(r.finish.d).toBe(45);   // alone, but nobody else is coming: leaves at once
  });

  it('a vehicle that never fills leaves at its deadline', () => {
    const boat = { id: 'boat', kind: 'travel', base: 10, waitFor: 6, maxWait: 40 };
    const res = (team, s, t, api) => { const v = api.vehicle(s.id, s, team.id, t); return v.departs == null ? { hold: v.group.first + s.maxWait } : { end: v.departs + s.base }; };
    const r = runLeg({ teams: [{ id: 'a', t: 0 }, { id: 'b', t: 5 }, { id: 'c', t: 100 }], stretches: [walk(1), boat], resolve: (tm, s, t, api) => s.id === 'boat' ? res(tm, s, t, api) : { end: t + 1 } });
    expect(r.finish.a).toBe(51);
    expect(r.finish.b).toBe(51);
    expect(r.finish.c).toBe(111);
  });

  it('delay() pushes a team that is already on its way', () => {
    const r = runLeg({ teams: [{ id: 'a', t: 0 }, { id: 'b', t: 5 }], stretches: [walk(30)],
      resolve: (team, s, t, api) => { if (team.id === 'b') api.delay('a', 15); return { end: t + 30 }; } });
    expect(r.finish.a).toBe(45);
  });

  it('a team can leave the leg, or skip stretches', () => {
    const r = runLeg({ teams: [{ id: 'a', t: 0 }, { id: 'b', t: 0 }], stretches: [walk(10), walk(20), walk(30)],
      resolve: (team, s, t) => team.id === 'a' && s.base === 10 ? { end: t + 10, skip: 1 } : team.id === 'b' && s.base === 20 ? { out: true, end: t + 5 } : { end: t + s.base } });
    expect(r.finish.a).toBe(40);
    expect(r.out).toEqual(['b']);
    expect(r.finish.b).toBeUndefined();
  });

  it('ties are broken by the order teams were given', () => {
    const order = [];
    runLeg({ teams: [{ id: 'x', t: 0 }, { id: 'y', t: 0 }], stretches: [walk(5)], resolve: (team, s, t) => { order.push(team.id); return { end: t + 5 }; } });
    expect(order).toEqual(['x', 'y']);
  });
});
