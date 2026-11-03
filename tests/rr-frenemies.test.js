// Frenemies and one-sided teams (the user, 2026-11-02: "can we have best friends who are passive aggressive bff but
// rivals? or just non reciprocal relationship?"), and the bond each relationship walks in with (every team used to
// start at 0, so enemies raced the first leg with a best friends' teamwork).
import { describe, it, expect } from 'vitest';
import { setGs, setPlayers, players } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { newState, addTeams, REL, FEEL, FOOLED_VIEW, oneSided, mayScheme } from '../js/rr/state.js';
import { raceHistoryRel } from '../js/rr-run.js';
import { relLabel } from '../js/rr/story/previously.js';
import { walkIn, resenterOf, playRaceSeason } from '../js/rr/season.js';
import { teamwork } from '../js/rr/skill.js';
import { playScene, prepare, viewOf } from '../js/rr/scenes.js';
import { airSeason } from '../js/rr/episode.js';
import { raceCast } from './helpers/rr-cast.js';

const NEW_KINDS = ['dig', 'keep-score', 'frenemy-turn', 'gush', 'cold-shoulder', 'quiet-sabotage', 'finds-out', 'sore-spot', 'clear-the-air'];
// one-sided and strained are feelings, on any relationship: these tests put them on a parent and child
const ONE_SIDED = ['parent-child', { feel: 'one-sided' }];

function twoTeams(rel1, rel2, extra = {}) {
  const { cast, teams } = raceCast(4, 3);
  setPlayers(cast);
  setGs({ bonds: {}, popularity: {} });
  const st = newState(1, {});
  addTeams(st, teams.map((t, i) => ({ ...t, rel: i === 0 ? rel1 : i === 1 ? rel2 : t.rel, ...(i === 1 ? extra : {}) })));
  return st;
}

describe('rr: what a team walks in with', () => {
  it('every relationship has a starting bond, and enemies start below best friends', () => {
    for (const [rel, r] of Object.entries(REL)) expect(typeof r.start, rel).toBe('number');
    expect(REL.enemies.start).toBeLessThan(REL.rivals.start);
    expect(REL.rivals.start).toBeLessThan(REL.bffs.start);
    expect(REL.married.start).toBeGreaterThanOrEqual(REL.bffs.start);
  });

  it('the bond is set before the first leg, so the teamwork differs from the start', () => {
    const st = twoTeams('bffs', 'enemies');
    walkIn(st);
    const [t1, t2] = st.order;
    expect(getBond(st.teams[t1].a, st.teams[t1].b)).toBe(REL.bffs.start);
    expect(getBond(st.teams[t2].a, st.teams[t2].b)).toBe(REL.enemies.start);
    expect(teamwork(st, t1)).toBeGreaterThan(teamwork(st, t2));
  });
});

describe('rr: a one-sided team (a parent and child)', () => {
  it('names a resenter when the Pairs view did not, and keeps one it did', () => {
    const st = twoTeams('bffs', ...ONE_SIDED);
    walkIn(st);
    const t = st.teams[st.order[1]];
    expect([t.a, t.b]).toContain(t.resents);
    expect(t.resents).toBe(resenterOf(t));
    const kept = twoTeams('bffs', 'parent-child', { feel: 'one-sided', resents: null });
    const k = kept.teams[kept.order[1]];
    k.resents = k.b;
    walkIn(kept);
    expect(k.resents).toBe(k.b);
  });

  it('the fooled one thinks they are best friends; the teamwork reads the real bond', () => {
    const st = twoTeams('bffs', ...ONE_SIDED);
    walkIn(st);
    const id = st.order[1];
    const o = oneSided(st, id);
    expect(o.found).toBe(false);
    expect(viewOf(st, o.fooled, o.resents)).toBe(FOOLED_VIEW);
    expect(viewOf(st, o.resents, o.fooled)).toBe(REL['parent-child'].start + FEEL['one-sided'].shift);
    // what the fooled one believes never props up how they race
    expect(teamwork(st, id)).toBeLessThan(teamwork(st, st.order[0]));
  });

  it('a resenter who may not scheme is cold, never a saboteur', () => {
    const st = twoTeams('bffs', ...ONE_SIDED);
    walkIn(st);
    const id = st.order[1];
    const t = st.teams[id];
    // make the resenter a hero (a nice archetype)
    setPlayers(players.map(p => (p.name === t.resents ? { ...p, archetype: 'hero' } : p)));
    expect(mayScheme(t.resents)).toBe(false);
    const ctx = { state: st, team: { id }, other: null, stretch: { id: 's', kind: 'botch', types: ['water'] }, t: 100,
      api: null, present: [id], moment: 'botch-pick', event: { fails: 0 }, flip: t.resents === t.b };
    prepare(ctx);
    expect(ctx.A).toBe(t.resents);
    expect(playScene(ctx, 'quiet-sabotage', () => 0.5)).toBeNull();
    const cold = playScene({ ...ctx, _ready: false, moment: 'quiet' }, 'cold-shoulder', () => 0.5);
    expect(cold?.kind).toBe('cold-shoulder');
  });

  it('finding out ends the act: bitter both ways or warm, still parent and child, and the view is gone', () => {
    const st = twoTeams('bffs', ...ONE_SIDED);
    walkIn(st);
    st.leg = 3;
    const id = st.order[1];
    const t = st.teams[id];
    for (const ending of ['mask-off', 'have-it-out']) {
      st.found = {}; t.feel = 'one-sided';
      const ctx = { state: st, team: { id }, other: null, stretch: { id: 's', kind: 'travel' }, t: 100, api: null,
        present: [id], moment: 'quiet', event: { fails: 0 }, flip: t.resents === t.a };
      const sc = playScene(ctx, 'finds-out', () => 0.5, { ending });
      expect(sc.who[0]).not.toBe(t.resents);
      expect(st.found[id]).toBe(3);
      expect(t.feel).toBe(ending === 'mask-off' ? 'strained' : 'warm');
      expect(t.rel).toBe('parent-child');
      expect(oneSided(st, id)).toBeNull();
    }
  });
});

describe('rr: frenemies and one-sided teams across seasons', () => {
  // whole seasons: well under a minute here; the ceiling is for a full parallel run (vitest.config.js)
  it('their scenes play, change something, and are written', () => {
    const played = {}, finds = { 'mask-off': 0, 'have-it-out': 0 }, turns = {};
    for (let seed = 1; seed <= 10; seed++) {
      const { cast, teams } = raceCast(10, seed);
      setPlayers(cast);
      teams[0].rel = 'frenemies';
      teams[1].rel = 'parent-child'; teams[1].feel = 'one-sided';
      teams[2].feel = 'strained';
      // (the draw can give other teams frenemies too)
      const relAt = Object.fromEntries(teams.map(x => [x.id, x.rel]));
      const feelAt = Object.fromEntries(teams.map(x => [x.id, x.feel || 'warm']));
      const res = playRaceSeason({ teams, seed });
      const mine = res.state.scenes.filter(s => NEW_KINDS.includes(s.kind));
      for (const s of mine) {
        played[s.kind] = (played[s.kind] || 0) + 1;
        expect(s.data.effects.length, `${s.kind}.${s.data.ending}`).toBeGreaterThan(0);
        if (s.kind === 'finds-out') finds[s.data.ending]++;
        if (s.kind === 'quiet-sabotage') expect(mayScheme(s.who[0])).toBe(true);
        if (['frenemy-turn', 'dig', 'keep-score'].includes(s.kind)) expect(relAt[s.data.team], s.kind).toBe('frenemies');
        if (['gush', 'cold-shoulder', 'quiet-sabotage', 'finds-out'].includes(s.kind)) expect(feelAt[s.data.team], s.kind).toBe('one-sided');
        // (strained from the start, or after a one-sided team found out)
        if (['sore-spot', 'clear-the-air'].includes(s.kind)) expect(['strained', 'one-sided']).toContain(feelAt[s.data.team]);
      }
      for (const ep of airSeason(res)) for (const seg of ep.segments || []) {
        const sc = res.state.scenes.find(x => x.id === seg.scene);
        if (!sc || !NEW_KINDS.includes(sc.kind)) continue;
        expect(seg.lines.length, seg.lineId).toBeGreaterThan(0);
        for (const l of seg.lines) expect(l.text, seg.lineId).not.toMatch(/[{}]/);
        turns[sc.kind] = (turns[sc.kind] || 0) + 1;
      }
    }
    for (const k of ['dig', 'keep-score', 'gush', 'cold-shoulder', 'sore-spot']) expect(played[k] || 0, k).toBeGreaterThan(3);
    expect(finds['mask-off'] + finds['have-it-out']).toBeGreaterThan(0);
    for (const k of ['dig', 'gush', 'cold-shoulder', 'sore-spot']) expect(turns[k] || 0, `${k} aired`).toBeGreaterThan(0);
  }, 300000);
});

describe('rr: what they are, and how they feel about it', () => {
  it('a feeling moves any relationship\'s starting bond, and strained snaps more', () => {
    const st = twoTeams('parent-child', 'parent-child', { feel: 'strained' });
    walkIn(st);
    const [t1, t2] = st.order.map(id => st.teams[id]);
    expect(getBond(t1.a, t1.b)).toBe(REL['parent-child'].start);
    expect(getBond(t2.a, t2.b)).toBe(REL['parent-child'].start + FEEL.strained.shift);
    expect(FEEL.strained.snap).toBeGreaterThan(FEEL.warm.snap);
    expect(t2.feel0).toBe('strained');
  });

  it('reads the roster\'s ties: an aunt and nephew, colleagues, a falling-out, an estranged relative', () => {
    expect(raceHistoryRel('Lorraine', 'Jace', null, { kin: 'aunt-uncle', roleA: 'elder' })).toMatchObject({ rel: 'aunt-uncle', from: 'family' });
    expect(raceHistoryRel('Mia', 'Cory', null, { kin: 'colleagues' })).toMatchObject({ rel: 'coworkers', from: 'ties' });
    expect(raceHistoryRel('A', 'B', null, { kin: 'ex-friends' })).toMatchObject({ rel: 'bffs', feel: 'strained' });
    expect(raceHistoryRel('A', 'B', null, { kin: 'estranged' }, false, 30)).toMatchObject({ rel: 'parent-child', feel: 'strained' });
    expect(raceHistoryRel('A', 'B', null, { kin: 'estranged' }, false, 4)).toMatchObject({ rel: 'siblings', feel: 'strained' });
  });

  it('Don names an aunt and nephew, twins, and a strained father and daughter for what they are', () => {
    setPlayers([{ name: 'Lorraine', gender: 'f', age: 52, stats: {} }, { name: 'Jace', gender: 'm', age: 24, stats: {} },
      { name: 'Ana', gender: 'f', stats: {} }, { name: 'Zoe', gender: 'f', stats: {} },
      { name: 'Ahanu', gender: 'm', age: 49, stats: {} }, { name: 'Suki', gender: 'f', age: 20, stats: {} }]);
    expect(relLabel({ rel: 'aunt-uncle', a: 'Jace', b: 'Lorraine', elder: 'Lorraine' })).toBe('aunt and nephew');
    expect(relLabel({ rel: 'siblings', a: 'Ana', b: 'Zoe', history: { kin: 'twins' } })).toBe('twin sisters');
    expect(relLabel({ rel: 'parent-child', a: 'Ahanu', b: 'Suki', feel0: 'strained' })).toBe("father and daughter, and it's complicated");
    // one-sided looks warm from outside: Don doesn't know
    expect(relLabel({ rel: 'parent-child', a: 'Ahanu', b: 'Suki', feel0: 'one-sided' })).toBe('father and daughter');
  });
});
