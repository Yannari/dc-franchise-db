// The Ridonculous Race: tasks, Either/Or choice and switching, Botch or Watch (engine plan, Task 8).
import { describe, it, expect } from 'vitest';
import { setPlayers, setGs } from '../js/core.js';
import { attemptChance, runTask, pickBotch, runEither, runBotch, resolveTask } from '../js/rr/tasks.js';
import { newState, addTeams } from '../js/rr/state.js';
import { streamFor } from '../js/dr/rng.js';
import { runLeg } from '../js/rr/clock.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const person = (name, v, arch = 'floater', over = {}) => ({ name, archetype: arch, stats: { ...Object.fromEntries(STATS.map(s => [s, v])), ...over } });
const api0 = { here: () => [], slot: (id, c, t) => t, delay() {} };

function teamOf(names, stats, over = {}) {
  setGs({ bonds: {} });
  setPlayers(names.map(n => person(n, stats, 'floater', over)));
  const st = newState(1, {});
  addTeams(st, [{ id: 't1', name: 'T', a: names[0], b: names[1], rel: 'bffs', identity: null, custom: null }]);
  return st;
}

describe('rr tasks', () => {
  it('chance is proportional and clamped', () => {
    expect(attemptChance(5, 0.5)).toBe(0.5);
    expect(attemptChance(10, 0.9)).toBe(0.95);
    expect(attemptChance(0, 0.1)).toBe(0.05);
    expect(attemptChance(7, 0.5)).toBeCloseTo(0.66);
  });

  it('better racers finish the same task sooner on average', () => {
    const task = { id: 'dig', kind: 'allin', types: ['strength'], base: 20, pass: 0.5, loopCost: 5 };
    const mean = v => {
      const st = teamOf(['A' + v, 'B' + v], v);
      let sum = 0;
      for (let s = 1; s <= 200; s++) sum += runTask(st, { id: 't1' }, task, 0, api0, streamFor(s * 7919, 'task')).end;
      return sum / 200;
    };
    expect(mean(8)).toBeLessThan(mean(3));
  });

  it('a chained task is slower when the task it depends on took more attempts', () => {
    const st = teamOf(['Ca', 'Cb'], 5);
    const stew = { id: 'stew', kind: 'allin', types: ['stomach'], base: 12, pass: 1, loopCost: 6, chain: { from: 'spices' } };
    st.attempts = { t1: { spices: { attempts: 1 } } };
    const quick = runTask(st, { id: 't1' }, stew, 0, api0, streamFor(3, 'c')).end;
    st.attempts = { t1: { spices: { attempts: 5 } } };
    const slow = runTask(st, { id: 't1' }, stew, 0, api0, streamFor(3, 'c')).end;
    expect(slow).toBeGreaterThan(quick);
  });

  it('botch partners alternate', () => {
    const st = teamOf(['Da', 'Db'], 5);
    const b = { id: 'b1', kind: 'botch', types: ['water'], base: 20, loopCost: 5, pass: 0.5, teaser: 'Who?' };
    const first = pickBotch(st, st.teams.t1, b, streamFor(1, 'b'));
    const second = pickBotch(st, st.teams.t1, { ...b, id: 'b2' }, streamFor(2, 'b'));
    const third = pickBotch(st, st.teams.t1, { ...b, id: 'b3' }, streamFor(3, 'b'));
    expect(second).not.toBe(first);
    expect(third).toBe(first);
    expect(st.botch.count[first]).toBe(2);
  });

  it('a team switches sides after failing on the side it cannot do', () => {
    let switched = 0;
    for (let s = 1; s <= 50; s++) {
      const st = teamOf(['Ea', 'Eb'], 9, { boldness: 1, endurance: 1 });   // terrible at nerve, fine at brains
      const either = { id: 'e', kind: 'either', sides: [
        { id: 'scary', types: ['nerve'], base: 5, pass: 0.15, loopCost: 15 },
        { id: 'smart', types: ['brains'], base: 30, pass: 0.8, loopCost: 5 }] };
      // force the scary side first by starting there
      const r = runEither(st, { id: 't1' }, either, 0, api0, streamFor(s * 31, 'e'), { side: 'scary' });
      if (r.data.switched) switched++;
    }
    expect(switched).toBeGreaterThan(25);
  });

  it('a botcher who keeps failing can quit, at a four-hour penalty', () => {
    let quits = 0;
    for (let s = 1; s <= 200; s++) {
      const st = teamOf(['Fa', 'Fb'], 1, { boldness: 0 });
      st.mind.Fa.stress = 90; st.mind.Fb.stress = 90;
      const b = { id: 'swim', kind: 'botch', types: ['water'], base: 10, pass: 0.05, loopCost: 5, teaser: 'Who?' };
      const r = runBotch(st, { id: 't1' }, b, 0, api0, streamFor(s * 13, 'q'));
      if (r.quit) { quits++; expect(st.pending.t1).toBeGreaterThanOrEqual(240); expect(st.rec.t1.quits).toBe(1); }
    }
    expect(quits).toBeGreaterThan(0);
  });

  it('resolveTask runs inside the clock and records attempts', () => {
    const st = teamOf(['Ga', 'Gb'], 6);
    const task = { id: 'dig', kind: 'allin', types: ['strength'], base: 20, pass: 0.6, loopCost: 5 };
    const r = runLeg({ teams: [{ id: 't1', t: 0 }], stretches: [task], resolve: (tm, s, t, api) => resolveTask(st, tm, s, t, api, streamFor(1, 'r')) });
    expect(r.finish.t1).toBeGreaterThan(0);
    expect(st.attempts.t1.dig.attempts).toBeGreaterThanOrEqual(1);
  });
});
