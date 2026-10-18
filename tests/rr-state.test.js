// The Ridonculous Race: the season state and the teams (engine plan, Task 1).
import { describe, it, expect } from 'vitest';
import { setPlayers } from '../js/core.js';
import { newState, addTeams, REL, addScene, partner, teamOf } from '../js/rr/state.js';
import { raceCast, raceState } from './helpers/rr-cast.js';

describe('rr state', () => {
  it('adds teams with money, passes, minds and a leader', () => {
    const { cast, teams } = raceCast(12, 3);
    setPlayers(cast);
    const st = newState(3, {});
    addTeams(st, teams);
    expect(st.order).toHaveLength(12);
    expect(st.people).toHaveLength(24);
    for (const t of teams) {
      expect(st.money[t.id]).toBe(0);
      expect([t.a, t.b]).toContain(st.lead[t.id]);
      expect(st.mind[t.a]).toEqual({ energy: 100, morale: 60, stress: 10 });
      expect(partner(st, t.id, t.a)).toBe(t.b);
      expect(teamOf(st, t.b)).toBe(t.id);
      expect(Object.keys(REL)).toContain(t.rel);
    }
  });

  it('the leader is the partner with the higher strategic + boldness', () => {
    setPlayers([
      { name: 'Lo', archetype: 'floater', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 2, loyalty: 5, boldness: 2, intuition: 5, temperament: 5 } },
      { name: 'Hi', archetype: 'floater', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 9, loyalty: 5, boldness: 8, intuition: 5, temperament: 5 } },
    ]);
    const st = newState(1, {});
    addTeams(st, [{ id: 't1', name: 'Test', a: 'Lo', b: 'Hi', rel: 'bffs', identity: null, custom: null }]);
    expect(st.lead.t1).toBe('Hi');
  });

  it('family relationships are flagged', () => {
    expect(REL.siblings.family).toBe(true);
    expect(REL.exes.family).toBeFalsy();
    expect(REL.exes.snap).toBe(1.5);
    expect(Object.keys(REL)).toHaveLength(16);
  });

  it('a scene records who saw it', () => {
    const st = newState(1, {});
    const sc = addScene(st, 'help', ['A', 'B'], { t: 40 }, ['A', 'B', 'C']);
    expect(sc.seenBy).toEqual(['A', 'B', 'C']);
    expect(sc.t).toBe(40);
    expect(st.scenes).toHaveLength(1);
  });

  it('raceState builds a ready state', () => {
    const st = raceState(6, 4);
    expect(st.order).toHaveLength(6);
    expect(new Set(st.people).size).toBe(12);
  });
});
