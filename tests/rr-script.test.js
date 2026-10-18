// The Ridonculous Race: who plays which part, and what a line may know (dialogue plan, Task 2).
import { describe, it, expect, beforeAll } from 'vitest';
import { rolesOf } from '../js/rr/script/roles.js';
import { factsFor, RR_FACT_KEYS } from '../js/rr/script/facts.js';
import { SCENES, playScene } from '../js/rr/scenes.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { raceCast } from './helpers/rr-cast.js';
import { fixtureCtx } from './helpers/rr-catalogue.js';

describe('rr roles and facts', () => {
  let res;
  beforeAll(() => {
    const { cast, teams } = raceCast(10, 6);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 6, options: { twists: { 3: 'boomerang' } } });
  });

  it('every catalogue scene of a season gets roles, and every role is someone in it or the host', () => {
    const st = res.state;
    for (const sc of st.scenes.filter(s => SCENES[s.kind])) {
      const r = rolesOf(sc, st);
      expect(r, `#${sc.id} ${sc.kind}`).toBeTruthy();
      expect(r.ending).toBe(sc.data.ending);
      for (const [k, n] of Object.entries(r.roles)) {
        if (k === 'don' || k === 'local') continue;
        const there = sc.who.includes(n) || (SCENES[sc.kind].family === 4 && sc.seenBy.includes(n));
        expect(there, `#${sc.id} ${sc.kind} ${k}=${n}`).toBe(true);
      }
    }
  });

  it('a partner moment that one of them leads is led by the leader', () => {
    const ctx = fixtureCtx('tip-read');
    const sc = playScene(ctx, 'tip-read', () => 0.5, { ending: 'clear' });
    expect(rolesOf(sc, ctx.state).roles.a).toBe(ctx.state.lead[ctx.team.id]);
  });

  it('two teams: a and b are the team at the centre, c and d the other', () => {
    const ctx = fixtureCtx('trash-talk');
    const sc = playScene(ctx, 'trash-talk', () => 0.5, { ending: 'exchange' });
    const { roles, slots } = rolesOf(sc, ctx.state);
    const t1 = ctx.state.teams[ctx.team.id], t2 = ctx.state.teams[ctx.other.id];
    expect([roles.a, roles.b].sort()).toEqual([t1.a, t1.b].sort());
    expect([roles.c, roles.d].sort()).toEqual([t2.a, t2.b].sort());
    expect(slots.team).toBeTruthy();
    expect(slots.teamB).toBeTruthy();
  });

  it('a romance scene casts its two lovers as a and b', () => {
    const ctx = fixtureCtx('flirt');
    const t1 = ctx.state.teams[ctx.team.id], t2 = ctx.state.teams[ctx.other.id];
    ctx.people = [t1.b, t2.a];
    const sc = playScene(ctx, 'flirt', () => 0.5, { ending: 'returned' });
    const { roles } = rolesOf(sc, ctx.state);
    expect(roles.a).toBe(t1.b);
    expect(roles.b).toBe(t2.a);
  });

  it('facts use only the whitelist, and never change after the scene', () => {
    const st = res.state;
    for (const sc of st.scenes.filter(s => SCENES[s.kind]).slice(0, 400)) {
      const r = rolesOf(sc, st);
      const f = factsFor(sc, r, st);
      for (const k of Object.keys(f)) expect(RR_FACT_KEYS, `${sc.kind} fact ${k}`).toContain(k);
    }
    const ctx = fixtureCtx('bond-moment');
    const sc = playScene(ctx, 'bond-moment', () => 0.5, { ending: 'laugh' });
    const before = JSON.stringify(factsFor(sc, rolesOf(sc, ctx.state), ctx.state));
    const t = ctx.state.teams[ctx.team.id];
    addBond(t.a, t.b, -9);
    ctx.state.money[ctx.team.id] = 0;
    ctx.state.leg = 9;
    expect(JSON.stringify(factsFor(sc, rolesOf(sc, ctx.state), ctx.state))).toBe(before);
  });
});
