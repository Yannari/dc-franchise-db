// A crush is one person's (the user, 2026-11-03: "do we have one-sided crush?"): a secret crush on your own partner,
// and a crush across two teams whose answer is the other person's own interest, not a roll on the bond.
import { describe, it, expect } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { newState, addTeams } from '../js/rr/state.js';
import { walkIn, playRaceSeason } from '../js/rr/season.js';
import { playScene } from '../js/rr/scenes.js';
import { canFancy, interestOf } from '../js/rr/interest.js';
import { airSeason } from '../js/rr/episode.js';
import { raceCast } from './helpers/rr-cast.js';

const S = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 6, intuition: 5, temperament: 5 };
const person = (name, gender, sexuality, age = 25) => ({ name, gender, sexuality, age, stats: { ...S }, archetype: 'hero' });

function team(a, b, extra = {}) {
  setGs({ bonds: {}, popularity: {} });
  const st = newState(7, {});
  addTeams(st, [{ id: 't1', name: 'T', a, b, rel: 'bffs', identity: null, custom: null, ...extra },
    { id: 't2', name: 'U', a: 'Other1', b: 'Other2', rel: 'bffs', identity: null, custom: null }]);
  st.leg = 4;
  return st;
}
const ctxOf = (st, flip, moment = 'quiet') => ({ state: st, team: { id: 't1' }, other: null, stretch: { id: 's', kind: 'travel' }, t: 100,
  api: null, present: ['t1'], moment, event: { fails: 0 }, flip });

describe('rr: who can fancy whom, one way at a time', () => {
  it('a gay man can fall for his straight best friend, who can\'t return it; nobody under 18, either way', () => {
    setPlayers([person('Gus', 'm', 'gay'), person('Stan', 'm', 'straight'), person('Kid', 'f', 'straight', 15), person('Bo', 'm', 'straight')]);
    expect(canFancy('Gus', 'Stan')).toBe(true);
    expect(canFancy('Stan', 'Gus')).toBe(false);
    expect(interestOf({ seed: 1 }, 'Stan', 'Gus')).toBe(0);
    expect(canFancy('Bo', 'Kid')).toBe(false);
    expect(canFancy('Kid', 'Bo')).toBe(false);
  });
});

describe('rr: a secret crush on your partner', () => {
  it('never on a family team, never where nobody can; the one who can is the one with the crush', () => {
    setPlayers([person('Gus', 'm', 'gay'), person('Stan', 'm', 'straight'), person('Other1', 'f', 'straight'), person('Other2', 'm', 'straight')]);
    const fam = team('Gus', 'Stan', { rel: 'siblings', feel: 'crush' });
    walkIn(fam);
    expect(fam.teams.t1.feel).toBeUndefined();
    const st = team('Stan', 'Gus', { feel: 'crush' });
    walkIn(st);
    expect(st.teams.t1.crusher).toBe('Gus');
    setPlayers([person('Gus', 'm', 'straight'), person('Stan', 'm', 'straight'), person('Other1', 'f', 'straight'), person('Other2', 'm', 'straight')]);
    const none = team('Stan', 'Gus', { feel: 'crush' });
    walkIn(none);
    expect(none.teams.t1.feel).toBeUndefined();
  });

  it('the partner\'s answer is their own: drawn to them is a couple, not able to be is not like that', () => {
    setPlayers([person('Ana', 'f', 'straight'), person('Ben', 'm', 'straight'), person('Other1', 'f', 'straight'), person('Other2', 'm', 'straight')]);
    const st = team('Ana', 'Ben', { feel: 'crush', crusher: 'Ana' });
    walkIn(st);
    setBond('Ana', 'Ben', 10);
    const sc = playScene(ctxOf(st, false), 'crush-out', () => 0.5);
    expect(sc.data.ending).toBe('together');
    expect(st.teams.t1.rel).toBe('newly-dating');
    expect(st.couples.some(k => [k.a, k.b].sort().join() === 'Ana,Ben')).toBe(true);

    setPlayers([person('Gus', 'm', 'gay'), person('Stan', 'm', 'straight'), person('Other1', 'f', 'straight'), person('Other2', 'm', 'straight')]);
    const no = team('Gus', 'Stan', { feel: 'crush', crusher: 'Gus' });
    walkIn(no);
    setBond('Gus', 'Stan', 10);
    const out = playScene(ctxOf(no, false), 'crush-out', () => 0.5);
    expect(out.data.ending).toBe('not-like-that');
    expect(no.teams.t1.feel).toBe('strained');
    expect(no.couples.length).toBe(0);
    // it's out: nothing more to pine about
    expect(playScene(ctxOf(no, false), 'pining', () => 0.5)).toBeNull();
  });
});

describe('rr: a crush across two teams', () => {
  it('a confession to somebody who can\'t return it is turned down, and the one who asked carries a torch', () => {
    setPlayers([person('Gus', 'm', 'gay'), person('Amy', 'f', 'straight'), person('Stan', 'm', 'straight'), person('Bea', 'f', 'straight')]);
    setGs({ bonds: {}, popularity: {} });
    const st = newState(3, {});
    addTeams(st, [{ id: 't1', name: 'T', a: 'Gus', b: 'Amy', rel: 'bffs' }, { id: 't2', name: 'U', a: 'Stan', b: 'Bea', rel: 'bffs' }]);
    st.leg = 4;
    const ctx = { state: st, team: { id: 't1' }, other: { id: 't2' }, people: ['Gus', 'Stan'], stretch: null, t: 100, api: null,
      present: ['t1', 't2'], moment: 'confession', event: { fails: 0 } };
    const sc = playScene(ctx, 'confession', () => 0.5);
    expect(sc.data.ending).toBe('crushed');
    expect(st.unrequited['Gus>Stan']).toBe(4);
    const t = playScene({ ...ctx, moment: 'quiet' }, 'torch', () => 0.1);
    expect(t?.kind).toBe('torch');
  });
});

describe('rr: secret crushes across seasons', () => {
  it('they pine, it comes out, the answer follows the partner, and it airs', () => {
    const tally = {}, aired = {};
    for (let seed = 1; seed <= 12; seed++) {
      const { cast, teams } = raceCast(10, seed);
      // a team two of whom could be together, so the answer can be yes or no
      const [a, b] = [teams[0].a, teams[0].b];
      setPlayers(cast.map(p => (p.name === a ? { ...p, gender: 'f', sexuality: 'straight', age: 24 } : p.name === b ? { ...p, gender: 'm', sexuality: seed % 3 ? 'straight' : 'gay', age: 25 } : p)));
      teams[0].rel = 'bffs'; teams[0].feel = 'crush'; teams[0].crusher = a;
      const res = playRaceSeason({ teams, seed });
      for (const s of res.state.scenes.filter(x => x.data.team === 't1' && ['pining', 'crush-jealous', 'crush-out'].includes(x.kind))) {
        const k = `${s.kind}.${s.data.ending}`;
        tally[k] = (tally[k] || 0) + 1;
        expect(s.who[0], k).toBe(a);
        // a partner who can't be drawn to her never says yes
        if (s.kind === 'crush-out' && seed % 3 === 0) expect(s.data.ending).toBe('not-like-that');
      }
      for (const ep of airSeason(res)) for (const seg of ep.segments || []) {
        const sc = res.state.scenes.find(x => x.id === seg.scene);
        if (!sc || !['pining', 'crush-jealous', 'crush-out', 'torch'].includes(sc.kind)) continue;
        for (const l of seg.lines) expect(l.text, seg.lineId).not.toMatch(/[{}]/);
        aired[sc.kind] = (aired[sc.kind] || 0) + 1;
      }
    }
    const outs = Object.entries(tally).filter(([k]) => k.startsWith('crush-out.')).reduce((n, [, v]) => n + v, 0);
    expect(Object.entries(tally).filter(([k]) => k.startsWith('pining.')).reduce((n, [, v]) => n + v, 0)).toBeGreaterThan(10);
    expect(outs).toBeGreaterThan(2);
    expect(aired.pining || 0).toBeGreaterThan(3);
    expect(aired['crush-out'] || 0).toBeGreaterThan(1);
  }, 300000);
});
