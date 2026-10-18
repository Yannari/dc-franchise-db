// The Ridonculous Race: the stress loop, make-ups and the leader (engine plan, Task 9).
import { describe, it, expect } from 'vitest';
import { setPlayers, setGs } from '../js/core.js';
import { tick, rest, behind } from '../js/rr/mind.js';
import { snapCheck, makeupCheck, leaderCheck } from '../js/rr/team.js';
import { teamwork } from '../js/rr/skill.js';
import { newState, addTeams } from '../js/rr/state.js';
import { streamFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const person = (name, over = {}) => ({ name, archetype: 'floater', stats: { ...Object.fromEntries(STATS.map(s => [s, 5])), ...over } });

function pair(rel, temper, stress) {
  setGs({ bonds: {} });
  setPlayers([person('A', { temperament: temper }), person('B', { temperament: temper })]);
  const st = newState(1, {});
  addTeams(st, [{ id: 't1', name: 'T', a: 'A', b: 'B', rel, identity: null, custom: null }]);
  st.mind.A.stress = stress; st.mind.B.stress = stress;
  return st;
}

describe('rr mind and team', () => {
  it('volatile exes under pressure snap far more often than calm friends', () => {
    let hot = 0, calm = 0;
    for (let s = 1; s <= 300; s++) {
      const a = pair('exes', 2, 90); if (snapCheck(a, 't1', streamFor(s * 17, 'snap'))) hot++;
      const b = pair('bffs', 8, 20); if (snapCheck(b, 't1', streamFor(s * 17, 'snap'))) calm++;
    }
    expect(hot).toBeGreaterThan(calm * 3);
    expect(hot).toBeGreaterThan(0);
  });

  it('a snap marks the team, costs teamwork and leaves a scene; a make-up clears it', () => {
    let st;
    for (let s = 1; s <= 200; s++) { st = pair('exes', 0, 100); if (snapCheck(st, 't1', streamFor(s, 'x'))) break; }
    expect(st.snapped.t1).toBe(true);
    expect(st.scenes.at(-1).kind).toBe('snap');
    const before = teamwork(st, 't1');
    st.snapped.t1 = false;
    expect(teamwork(st, 't1')).toBeGreaterThan(before);
    st.snapped.t1 = true;
    let made = false;
    for (let s = 1; s <= 50 && !made; s++) made = !!makeupCheck(st, 't1', streamFor(s, 'm'));
    expect(made).toBe(true);
    expect(st.snapped.t1).toBe(false);
    expect(st.scenes.at(-1).kind).toBe('makeup');
  });

  it('energy drains with time, rest restores it and caps at 100; stress follows how far behind they think they are', () => {
    const st = pair('bffs', 5, 10);
    tick(st, 't1', 300);
    expect(st.mind.A.energy).toBe(90);
    rest(st);
    expect(st.mind.A.energy).toBe(100);
    behind(st, 't1', 1);
    expect(st.mind.A.stress).toBeGreaterThan(0);
  });

  it('an injured leader hands the lead over', () => {
    const st = pair('bffs', 5, 10);
    const was = st.lead.t1;
    leaderCheck(st, 't1', 'injury', streamFor(1, 'l'), was);
    expect(st.lead.t1).not.toBe(was);
    expect(st.scenes.at(-1).kind).toBe('leader-shift');
  });
});
