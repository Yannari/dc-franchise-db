// The Ridonculous Race: task types, identities and skill (engine plan, Task 2).
import { describe, it, expect } from 'vitest';
import { setPlayers } from '../js/core.js';
import { TASK_TYPES } from '../js/rr/types.js';
import { IDENTITIES } from '../js/rr/identities.js';
import { identityFactor, spreadOf, levelOf, teamwork, teamLevel } from '../js/rr/skill.js';
import { newState, addTeams } from '../js/rr/state.js';
import { addBond, getBond } from '../js/bonds.js';
import { setGs } from '../js/core.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const flat = (name, v, over = {}) => ({ name, archetype: 'floater', stats: { ...Object.fromEntries(STATS.map(s => [s, v])), ...over } });

describe('rr types and identities', () => {
  it('twelve task types whose level weights sum to 1', () => {
    expect(Object.keys(TASK_TYPES)).toHaveLength(12);
    for (const [k, t] of Object.entries(TASK_TYPES)) {
      const sum = Object.values(t.level).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1), k).toBeLessThan(1e-9);
      for (const s of Object.keys(t.level)) expect(STATS).toContain(s);
    }
    expect(TASK_TYPES.water.spread).toBe(true);
    expect(TASK_TYPES.hands.level.temperament).toBe(0.2);
    expect(TASK_TYPES.brains.spread).toBe(false);
  });

  it('54 identities, every type and reference valid', () => {
    expect(Object.keys(IDENTITIES)).toHaveLength(54);
    for (const [id, x] of Object.entries(IDENTITIES)) {
      expect(x.name, id).toBeTruthy();
      expect(x.good.length + x.bad.length, id).toBeGreaterThan(0);
      for (const t of [...x.good, ...x.bad]) expect(TASK_TYPES[t], `${id}:${t}`).toBeTruthy();
      for (const o of [...x.friction, ...x.friends]) expect(IDENTITIES[o], `${id}->${o}`).toBeTruthy();
    }
    expect(IDENTITIES['adversity-twins'].mishap).toBe(1.5);
  });

  it('the identity nudge and custom identities', () => {
    expect(identityFactor({ identity: 'surfers' }, ['water'])).toBeCloseTo(1.12);
    expect(identityFactor({ identity: 'surfers' }, ['brains'])).toBeCloseTo(0.88);
    expect(identityFactor({ identity: null }, ['water'])).toBe(1);
    expect(identityFactor({ identity: null, custom: { strength: 'lifeguards' } }, ['water'])).toBeCloseTo(1.12);
  });

  it('temperament is the spread in pressure types, never in calm ones', () => {
    setPlayers([flat('Hot', 5, { temperament: 2 }), flat('Cool', 5, { temperament: 9 })]);
    expect(spreadOf('Hot', ['water'])).toBeGreaterThan(spreadOf('Cool', ['water']));
    expect(spreadOf('Hot', ['brains'])).toBe(0.62);
    expect(spreadOf('Cool', ['brains'])).toBe(0.62);
  });

  it('level, teamwork and the team level', () => {
    setGs({ bonds: {} });
    setPlayers([flat('A', 8), flat('B', 4)]);
    expect(levelOf('A', ['brains'])).toBeCloseTo(8);
    const st = newState(1, {});
    addTeams(st, [{ id: 't1', name: 'T', a: 'A', b: 'B', rel: 'bffs', identity: null, custom: null }]);
    expect(teamwork(st, 't1')).toBeCloseTo(0.9);
    // the shared bond store saturates toward the rails, so read back what it holds
    for (let i = 0; i < 10; i++) addBond('A', 'B', 10);
    const w = Math.min(1.1, 0.9 + 0.02 * getBond('A', 'B'));
    expect(teamwork(st, 't1')).toBeCloseTo(w);
    st.snapped.t1 = true;
    expect(teamwork(st, 't1')).toBeCloseTo(w * 0.92);
    st.snapped.t1 = false;
    expect(teamLevel(st, 't1', ['brains'], 'A')).toBeCloseTo(8);
    expect(teamLevel(st, 't1', ['brains'])).toBeCloseTo(6 * w);
  });
});
