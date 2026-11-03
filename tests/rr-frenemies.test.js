// Frenemies and one-sided teams (the user, 2026-11-02: "can we have best friends who are passive aggressive bff but
// rivals? or just non reciprocal relationship?"), and the bond each relationship walks in with (every team used to
// start at 0, so enemies raced the first leg with a best friends' teamwork).
import { describe, it, expect } from 'vitest';
import { setGs, setPlayers, players } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { newState, addTeams, REL, FOOLED_VIEW, oneSided, mayScheme } from '../js/rr/state.js';
import { walkIn, resenterOf, playRaceSeason } from '../js/rr/season.js';
import { teamwork } from '../js/rr/skill.js';
import { playScene, prepare, viewOf } from '../js/rr/scenes.js';
import { airSeason } from '../js/rr/episode.js';
import { raceCast } from './helpers/rr-cast.js';

const NEW_KINDS = ['dig', 'keep-score', 'frenemy-turn', 'gush', 'cold-shoulder', 'quiet-sabotage', 'finds-out'];

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

describe('rr: a one-sided team', () => {
  it('names a resenter when the Pairs view did not, and keeps one it did', () => {
    const st = twoTeams('bffs', 'one-sided');
    walkIn(st);
    const t = st.teams[st.order[1]];
    expect([t.a, t.b]).toContain(t.resents);
    expect(t.resents).toBe(resenterOf(t));
    const kept = twoTeams('bffs', 'one-sided', { resents: null });
    const k = kept.teams[kept.order[1]];
    k.resents = k.b;
    walkIn(kept);
    expect(k.resents).toBe(k.b);
  });

  it('the fooled one thinks they are best friends; the teamwork reads the real bond', () => {
    const st = twoTeams('bffs', 'one-sided');
    walkIn(st);
    const id = st.order[1];
    const o = oneSided(st, id);
    expect(o.found).toBe(false);
    expect(viewOf(st, o.fooled, o.resents)).toBe(FOOLED_VIEW);
    expect(viewOf(st, o.resents, o.fooled)).toBe(REL['one-sided'].start);
    // what the fooled one believes never props up how they race
    expect(teamwork(st, id)).toBeLessThan(teamwork(st, st.order[0]));
  });

  it('a resenter who may not scheme is cold, never a saboteur', () => {
    const st = twoTeams('bffs', 'one-sided');
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

  it('finding out ends the act: enemies or best friends, and the view is gone', () => {
    const st = twoTeams('bffs', 'one-sided');
    walkIn(st);
    st.leg = 3;
    const id = st.order[1];
    const t = st.teams[id];
    for (const ending of ['mask-off', 'have-it-out']) {
      st.found = {}; t.rel = 'one-sided';
      const ctx = { state: st, team: { id }, other: null, stretch: { id: 's', kind: 'travel' }, t: 100, api: null,
        present: [id], moment: 'quiet', event: { fails: 0 }, flip: t.resents === t.a };
      const sc = playScene(ctx, 'finds-out', () => 0.5, { ending });
      expect(sc.who[0]).not.toBe(t.resents);
      expect(st.found[id]).toBe(3);
      expect(t.rel).toBe(ending === 'mask-off' ? 'enemies' : 'bffs');
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
      teams[1].rel = 'one-sided';
      // (the draw can give other teams these relationships too)
      const relAt = Object.fromEntries(teams.map(x => [x.id, x.rel]));
      const res = playRaceSeason({ teams, seed });
      const mine = res.state.scenes.filter(s => NEW_KINDS.includes(s.kind));
      for (const s of mine) {
        played[s.kind] = (played[s.kind] || 0) + 1;
        expect(s.data.effects.length, `${s.kind}.${s.data.ending}`).toBeGreaterThan(0);
        if (s.kind === 'finds-out') finds[s.data.ending]++;
        if (s.kind === 'quiet-sabotage') expect(mayScheme(s.who[0])).toBe(true);
        if (['frenemy-turn', 'dig', 'keep-score'].includes(s.kind)) expect(relAt[s.data.team], s.kind).toBe('frenemies');
        if (['gush', 'cold-shoulder', 'quiet-sabotage', 'finds-out'].includes(s.kind)) expect(relAt[s.data.team], s.kind).toBe('one-sided');
      }
      for (const ep of airSeason(res)) for (const seg of ep.segments || []) {
        const sc = res.state.scenes.find(x => x.id === seg.scene);
        if (!sc || !NEW_KINDS.includes(sc.kind)) continue;
        expect(seg.lines.length, seg.lineId).toBeGreaterThan(0);
        for (const l of seg.lines) expect(l.text, seg.lineId).not.toMatch(/[{}]/);
        turns[sc.kind] = (turns[sc.kind] || 0) + 1;
      }
    }
    for (const k of ['dig', 'keep-score', 'gush', 'cold-shoulder']) expect(played[k] || 0, k).toBeGreaterThan(3);
    expect(finds['mask-off'] + finds['have-it-out']).toBeGreaterThan(0);
    for (const k of ['dig', 'gush', 'cold-shoulder']) expect(turns[k] || 0, `${k} aired`).toBeGreaterThan(0);
  }, 300000);
});
