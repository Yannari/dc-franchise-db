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

  it('the writers can see the task, the ride, the result at the mat, why the lead changed, and who is older', () => {
    for (const k of ['taskType', 'mode', 'matPlace', 'why', 'aElder']) expect(RR_FACT_KEYS).toContain(k);
    const st = res.state;
    // (Don naming the place too: a season can go without a partners' moment on the mat, 2026-10-22)
    const mat = st.scenes.filter(s => ['blame', 'celebrate', 'bond-moment', 'don-place'].includes(s.kind) && s.data.stretch === 'mat' && !s.data.midmat);
    expect(mat.length).toBeGreaterThan(0);
    for (const s of mat) expect(['first', 'top', 'mid', 'bottom', 'last']).toContain(s.data.matPlace);
    const travel = st.scenes.filter(s => s.data.snap?.stretchKind === 'travel');
    expect(travel.some(s => s.data.snap.mode)).toBe(true);
    const task = st.scenes.filter(s => ['either', 'botch', 'allin'].includes(s.data.snap?.stretchKind));
    expect(task.some(s => factsFor(s, rolesOf(s, st), st).taskType)).toBe(true);
    // a snap knows where and when it happened; a lead change knows why
    const snaps = st.scenes.filter(s => s.kind === 'snap');
    expect(snaps.length).toBeGreaterThan(0);
    for (const s of snaps) { expect(s.data.stretch).toBeTruthy(); expect(s.data.t).not.toBeNull(); }
    for (const s of st.scenes.filter(x => x.kind === 'leader-shift')) expect(['injury', 'snap', 'crush', 'win']).toContain(s.data.why);
    // a Botch's hint is a slot
    const wb = st.scenes.find(s => s.kind === 'whose-botch');
    if (wb) expect(rolesOf(wb, st).slots.teaser).toBeTruthy();
  });

  it('a parent-and-child team knows who is older, when the cast says so', () => {
    const ctx = fixtureCtx('bond-moment');
    const t = ctx.state.teams[ctx.team.id];
    t.rel = 'parent-child';
    t.elder = t.b;
    const sc = playScene(ctx, 'bond-moment', () => 0.5, { ending: 'memory' });
    const r = rolesOf(sc, ctx.state);
    expect(factsFor(sc, r, ctx.state).aElder).toBe(r.roles.a === t.b);
  });

  it('a two-team scene knows the other team too: its relationship, its money, its failures, and who owes whom', () => {
    for (const k of ['relB', 'relFamB', 'brokeB', 'failsB', 'weOwe']) expect(RR_FACT_KEYS).toContain(k);
    const ctx = fixtureCtx('deal');
    const st = ctx.state;
    ctx.state.money[ctx.other.id] = 0;
    const sc = playScene(ctx, 'deal', () => 0.5, { ending: 'struck' });
    const f = factsFor(sc, rolesOf(sc, st), st);
    expect(f.relB).toBe(st.teams[ctx.other.id].rel);
    expect(f.brokeB).toBe(true);
    expect(f.failsB).toBe('many');
    // the helping team struck the deal: the other team owes it
    const ctx2 = fixtureCtx('deal-broken', { doerArchetype: 'villain' });
    ctx2.state.deals = [{ a: ctx2.other.id, b: ctx2.team.id, leg: 3, done: false }];
    const br = playScene(ctx2, 'deal-broken', () => 0.5, { ending: 'walk-away' });
    expect(factsFor(br, rolesOf(br, ctx2.state), ctx2.state).weOwe).toBe(true);
  });

  it("the other team's lines speak in the other team's relationship", async () => {
    const { voicedLine } = await import('../js/rr/script/write.js');
    const turn = { by: 'c', say: 'base', v: { 'rel:family': 'family line', 'rel:exes': 'exes line' } };
    expect(voicedLine(turn, 'Nobody', { relFam: 'exes', rng: () => 0 }).text).toBe('exes line');
  });

  it('a confrontation knows what the sabotage was, and a meeting knows who just arrived', () => {
    for (const k of ['sabKind', 'weArrived']) expect(RR_FACT_KEYS).toContain(k);
    const ctx = fixtureCtx('push', { doerArchetype: 'villain' });
    const st = ctx.state;
    playScene(ctx, 'push', () => 0.5, { ending: 'seen' });
    expect(st.sabotaged[ctx.other.id].kind).toBe('push');
    // the victims, later: their scene knows it was a push
    const later = fixtureCtx('confront');
    Object.assign(later, { state: st, team: { id: ctx.other.id }, other: { id: ctx.team.id }, _ready: false, moment: 'overlap', arriving: ctx.other.id });
    const sc = playScene(later, 'confront', () => 0.5, { ending: 'denied' });
    const f = factsFor(sc, rolesOf(sc, st), st);
    expect(f.sabKind).toBe('push');
    expect(f.weArrived).toBe(true);
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

describe('rr endings that speak alone', () => {
  it("a penalty at the mat is never written from the general check-in lines", async () => {
    const { writeScene, OWN_ONLY } = await import('../js/rr/script/write.js');
    const { POOLS } = await import('../js/rr/script/lines/index.js');
    expect(OWN_ONLY.has('don-place.penalty-reveal')).toBe(true);
    const anyIds = new Set((POOLS['don-place.any'] || []).map(e => e.id));
    // seasons keep coming until one has a penalty (a penalty is rare, and the seeds reshuffle every time the place library
    // grows: seed 5 alone stopped having one when four more places could be drawn, 2026-10-19); every penalty in every
    // season played is checked
    let seen = 0;
    for (let seed = 5; seed < 30 && !seen; seed++) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const st = playRaceSeason({ teams, seed }).state;
      const pens = st.scenes.filter(s => s.kind === 'don-place' && s.data.ending === 'penalty-reveal');
      seen += pens.length;
      for (const s of pens) { const w = writeScene(st, s); if (w) expect(anyIds.has(w.lineId), `seed ${seed}: ${w.lineId}`).toBe(false); }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('rr place and challenge lines', () => {
  it("a scene knows its challenge, and a place's own lines weigh more than the general ones", async () => {
    const { STRONG } = await import('../js/rr/script/write.js');
    const { factsFor, RR_FACT_KEYS } = await import('../js/rr/script/facts.js');
    expect(STRONG).toEqual(expect.arrayContaining(['place', 'taskId', 'cause', 'threadStep']));
    expect(RR_FACT_KEYS).toContain('taskId');
    const { cast, teams } = raceCast(8, 2);
    setPlayers(cast);
    const st = playRaceSeason({ teams, seed: 2 }).state;
    // any challenge the season ran (the library has grown: which places a season visits depends on its route)
    const { PLACES } = await import('../js/rr/places.js');
    const tasks = new Set(Object.values(PLACES).flatMap(p => p.stretches.filter(x => ['allin', 'botch', 'either', 'superteam'].includes(x.kind)).map(x => x.id)));
    const s = st.scenes.find(x => tasks.has(x.data?.stretch));
    expect(s).toBeTruthy();
    expect(factsFor(s, rolesOf(s, st), st).taskId).toBe(s.data.stretch);
  });
});
