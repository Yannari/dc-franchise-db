// The Ridonculous Race: Red Sand Desert played 1:1 with the real leg (Ridonculous Race ep. 2, the wiki's
// "None Down, Eighteen to Go - Part 2"): five spices picked with no judge ("ideally cumin, cinnamon, paprika,
// saffron and ginger"; teams that don't know guess), a stew cooked with the team's own spices (wrong ones make
// it worse), a camel that can go down or stop, and the Vegans who walk beside theirs.
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { factsFor } from '../js/rr/script/facts.js';
import { rolesOf } from '../js/rr/script/roles.js';
import { getPlace } from '../js/rr/places.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr Red Sand Desert, 1:1', () => {
  const states = [];
  beforeAll(() => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { cast, teams } = raceCast(12, seed);
      teams[0].identity = 'vegans';
      setPlayers(cast);
      states.push(playRaceSeason({ teams, seed }).state);
    }
  });
  const rows = (st, stretch) => (st.taskLog || []).filter(r => r.stretch === stretch);

  it('the spices are picked, not judged: one go, no fails, a count of right picks', () => {
    const spices = getPlace('red-sand-desert').stretches.find(s => s.id === 'spices');
    expect(spices.pick).toEqual({ of: 5 });
    let n = 0;
    for (const st of states) {
      expect(st.scenes.filter(s => s.kind === 'attempt-fail' && s.data.stretch === 'spices')).toEqual([]);
      for (const r of rows(st, 'spices')) {
        n++;
        expect(r.fails).toBe(0);
        expect(r.right).toBeGreaterThanOrEqual(0);
        expect(r.right).toBeLessThanOrEqual(5);
      }
    }
    expect(n).toBeGreaterThan(20);
  });

  it('the wrong spices make the stew worse', () => {
    const good = [], bad = [];
    for (const st of states) for (const r of rows(st, 'stew')) {
      const p = rows(st, 'spices').find(x => x.team === r.team && x.leg === r.leg);
      if (!p) continue;
      (p.right >= 4 ? good : p.right <= 2 ? bad : []).push(r.fails);
    }
    const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
    expect(good.length).toBeGreaterThan(5);
    expect(bad.length).toBeGreaterThan(5);
    expect(avg(bad)).toBeGreaterThan(avg(good));
  });

  it('a scene at the stew knows how the spices went', () => {
    let n = 0;
    for (const st of states) for (const s of st.scenes.filter(s => s.data?.stretch === 'stew' && s.data?.team)) {
      const f = factsFor(s, rolesOf(s, st), st);
      expect(['right', 'mostly', 'wrong'], s.kind).toContain(f.picked);
      n++;
    }
    expect(n).toBeGreaterThan(10);
  });

  it('the camel has its own mishaps, and the Vegans walk beside theirs', () => {
    const camel = getPlace('red-sand-desert').stretches.find(s => s.id === 'camel');
    expect(camel.mishaps.map(m => m[0])).toEqual(expect.arrayContaining(['camel-down', 'camel-stops']));
    let walked = 0, kinds = new Set();
    for (const st of states) {
      const isVegan = id => st.teams[id].identity === 'vegans';
      for (const s of st.scenes.filter(s => s.kind === 'travel-mishap' && s.data.stretch === 'camel')) {
        kinds.add(s.data.kind);
        if (s.data.kind === 'walks-beside') { expect(isVegan(s.data.team)).toBe(true); walked++; }
        else expect(['camel-down', 'camel-stops']).toContain(s.data.kind);
      }
      // every Vegans team that got to the stew came by camel, walking beside it
      for (const r of rows(st, 'stew').filter(r => isVegan(r.team)))
        expect(st.scenes.some(s => s.kind === 'travel-mishap' && s.data.kind === 'walks-beside' && s.data.team === r.team && s.leg === r.leg), `leg ${r.leg}`).toBe(true);
    }
    expect(walked).toBeGreaterThan(0);
    expect(kinds.has('camel-down') || kinds.has('camel-stops')).toBe(true);
  });
});
