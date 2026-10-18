// The Ridonculous Race: Boomerang and its vote, Yield, Express Pass, Zip-It, Save (engine plan, Task 16).
import { describe, it, expect } from 'vitest';
import { handOut, resolveBoard, useExpress, useSave, zipTask } from '../js/rr/twists.js';
import { streamFor } from '../js/dr/rng.js';
import { setGs } from '../js/core.js';
import { raceState } from './helpers/rr-cast.js';

const board = { id: 'box', kind: 'board', after: 'lagoon', label: 'The Boomerang board' };
const api = { delay() {}, here: () => [] };
function fresh(seed = 3) {
  setGs({ bonds: {}, popularity: {} });
  const st = raceState(8, seed);
  st.leg = 3;
  st.lastOrder = [...st.order];
  return st;
}

describe('rr twists', () => {
  it('a Boomerang is handed to one active team, never aimed at its holder or at a team already through', () => {
    for (let s = 1; s <= 40; s++) {
      const st = fresh(s);
      handOut(st, { n: 3, kind: 'elim', twist: 'boomerang' }, streamFor(s, 'h'));
      const holders = st.order.filter(id => st.passes[id].boomerang);
      expect(holders).toHaveLength(1);
      const h = holders[0];
      // three teams are already through the board before the holder gets there
      const before = st.order.filter(id => id !== h).slice(0, 3);
      for (const id of before) resolveBoard(st, { id }, board, 500, api, streamFor(s, 'b'));
      resolveBoard(st, { id: h }, board, 510, api, streamFor(s, 'b2'));
      const target = Object.keys(st.uturn || {})[0];
      expect(target, `seed ${s}`).toBeTruthy();
      expect(target).not.toBe(h);
      expect(before).not.toContain(target);
      expect(st.boomeranged[target]).toBe(h);
      expect(st.passes[h].boomerang).toBe(0);
    }
  });

  it('a Boomerang is wasted when every other team is already through', () => {
    const st = fresh(2);
    handOut(st, { n: 3, kind: 'elim', twist: 'boomerang' }, streamFor(2, 'h'));
    const h = st.order.find(id => st.passes[id].boomerang);
    for (const id of st.order.filter(x => x !== h)) resolveBoard(st, { id }, board, 500, api, streamFor(1, 'b'));
    resolveBoard(st, { id: h }, board, 600, api, streamFor(2, 'b'));
    expect(Object.keys(st.uturn || {})).toHaveLength(0);
    const sc = st.scenes.find(x => x.kind === 'boomerang-decide');
    expect(sc.data.wasted).toBe(true);
  });

  it('the Boomerang target redoes the task when it reaches the board, once', () => {
    const st = fresh(4);
    handOut(st, { n: 3, kind: 'elim', twist: 'boomerang' }, streamFor(4, 'h'));
    const h = st.order.find(id => st.passes[id].boomerang);
    resolveBoard(st, { id: h }, board, 500, api, streamFor(4, 'b'));
    const target = Object.keys(st.uturn)[0];
    const first = resolveBoard(st, { id: target }, board, 520, api, streamFor(4, 'c'));
    expect(first.redo).toBe('lagoon');
    const second = resolveBoard(st, { id: target }, board, 560, api, streamFor(4, 'd'));
    expect(second.redo).toBeFalsy();
  });

  it('a Boomerang Vote records one ballot per active team, nobody votes for themselves, and the most-voted is the target', () => {
    for (let s = 1; s <= 20; s++) {
      const st = fresh(s);
      st.gone.push(st.order[7]);
      const leg = { n: 3, kind: 'elim', twist: 'boomerang-vote' };
      handOut(st, leg, streamFor(s, 'v'));
      const active = st.order.filter(id => !st.gone.includes(id));
      expect(leg.vote.ballots).toHaveLength(active.length);
      for (const b of leg.vote.ballots) { expect(b.from).not.toBe(b.to); expect(active).toContain(b.to); }
      const tally = {};
      for (const b of leg.vote.ballots) tally[b.to] = (tally[b.to] || 0) + 1;
      expect(tally[leg.vote.target]).toBe(Math.max(...Object.values(tally)));
    }
  });

  it('a Yield stops its target thirty minutes at the board', () => {
    const st = fresh(5);
    handOut(st, { n: 3, kind: 'elim', twist: 'yield' }, streamFor(5, 'y'));
    const h = st.order.find(id => st.passes[id].yield);
    resolveBoard(st, { id: h }, board, 500, api, streamFor(5, 'b'));
    const target = Object.keys(st.yielded)[0];
    expect(target).not.toBe(h);
    const free = st.order.find(id => id !== h && id !== target);
    const normal = resolveBoard(st, { id: free }, board, 530, api, streamFor(5, 'n')).end - 530;
    expect(resolveBoard(st, { id: target }, board, 530, api, streamFor(5, 'c')).end - 530).toBe(normal + 30);
  });

  it('an Express Pass skips exactly one stretch, the one the team rates worst', () => {
    const st = fresh(6);
    const id = st.order[0];
    st.passes[id].express = 1;
    const stretches = [
      { id: 'a', kind: 'allin', types: ['strength'], base: 20, pass: 0.5, loopCost: 5 },
      { id: 'b', kind: 'allin', types: ['brains'], base: 20, pass: 0.5, loopCost: 5 },
      { id: 'c', kind: 'allin', types: ['stomach'], base: 20, pass: 0.5, loopCost: 5 },
      { id: 'mat', kind: 'mat' },
    ];
    const used = stretches.filter(s => useExpress(st, { id }, s, stretches));
    expect(used).toHaveLength(1);
    expect(st.passes[id].express).toBe(0);
    expect(useExpress(st, { id }, stretches[0], stretches)).toBe(false);
  });

  it('a Save is spent once', () => {
    const st = fresh(7);
    const id = st.order[1];
    st.passes[id].save = 1;
    expect(useSave(st, id)).toBe(true);
    expect(useSave(st, id)).toBe(false);
    expect(st.scenes.some(s => s.kind === 'save-used')).toBe(true);
  });

  it('only the first team to finish the Zip-It task wins it; a team tries once a season', () => {
    const st = fresh(8);
    const zip = { id: 'zip', kind: 'task', optional: 'zip', types: ['hands'], base: 20, pass: 0.99, loopCost: 5 };
    const always = () => 0;
    const r1 = zipTask(st, { id: st.order[0] }, zip, 500, api, always);
    const r2 = zipTask(st, { id: st.order[1] }, zip, 505, api, always);
    expect(r1.tried && r1.won).toBe(true);
    expect(r2.tried).toBe(true);
    expect(r2.won).toBe(false);
    expect(r2.end).toBeGreaterThan(505);
    st.leg = 4;
    expect(zipTask(st, { id: st.order[0] }, zip, 500, api, always).tried).toBe(false);
  });
});
