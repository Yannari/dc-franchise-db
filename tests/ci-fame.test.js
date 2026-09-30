// ci-fame.test.js — a famous face is recognised (user, 2026-09-30: "build it").
// A player who shows their own face and is famous gets recognised: the one
// who recognises them knows the profile is real, sees a bigger threat, and
// warms to a fan favourite or resents a known villain. A catfish hiding their
// fame is not recognised: that is why a celebrity catfishes.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, circleSetup } from './helpers/ci-cast.js';
import { POOLS } from '../js/ci/lines/index.js';

function season(seed, repOf) {
  const cast = makePlayers(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  const setup = circleSetup(names);
  for (const [n, rep] of Object.entries(repOf(names))) Object.assign(setup[n], rep);
  return { names, ...playCircleSeason({ cast: names, setup, pool: [], seed }) };
}

describe('a famous face is recognised', () => {
  it('a celebrity playing as themselves is recognised by somebody, and it is a scene', () => {
    let seen = 0;
    for (let s = 1; s <= 6; s++) {
      const { state, names, rows } = season(s, n => ({ [n[0]]: { rep: 'celebrity', catfish: 'never', mode: 'honest' } }));
      const h = state.handleOf[names[0]];
      const scenes = state.scenes.filter(x => x.kind === 'recognise' && x.data.fame && x.data.profile === h);
      seen += scenes.length;
      for (const sc of scenes) {
        const obs = sc.who[0];
        expect(state.beliefs?.[obs]?.[h]?.real ?? 1).toBeGreaterThan(0.6);   // a real face, and they know it
      }
      if (scenes.length) expect(rows.flatMap(r => r.ci.aired).some(a => a.kind === 'recognise')).toBe(true);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('the edit airs two recognitions of one face a day, three a season: the rest happen off camera', () => {
    let offCamera = 0;
    for (let s = 1; s <= 6; s++) {
      const { state, names } = season(s, n => ({ [n[0]]: { rep: 'celebrity', catfish: 'never', mode: 'honest' } }));
      const h = state.handleOf[names[0]];
      const fame = state.scenes.filter(x => x.kind === 'recognise' && x.data.fame && x.data.profile === h);
      const aired = fame.filter(x => x.aired);
      expect(aired.length).toBeLessThanOrEqual(3);
      const perDay = {}; for (const x of aired) perDay[x.day] = (perDay[x.day] || 0) + 1;
      for (const n of Object.values(perDay)) expect(n).toBeLessThanOrEqual(2);
      const ids = aired.map(x => x.script?.blocks?.[0]?.id);
      expect(new Set(ids).size).toBe(ids.length);   // no line said twice about one face
      offCamera += fame.length - aired.length;
    }
    expect(offCamera).toBeGreaterThan(0);
  });

  it('nobody-famous players are never recognised for fame', () => {
    const { state } = season(3, () => ({}));
    expect(state.scenes.filter(x => x.kind === 'recognise' && x.data.fame)).toHaveLength(0);
  });

  it('a celebrity behind a persona is not recognised', () => {
    for (let s = 1; s <= 4; s++) {
      const cast = makePlayers(13, s); setPlayers(cast);
      const names = cast.map(p => p.name);
      const setup = circleSetup(names);
      Object.assign(setup[names[0]], { rep: 'celebrity', catfish: 'always' });
      const pool = [{ id: 'p1', handle: 'Kim', age: 24, gender: 'f', jobId: 'bartender', status: 'Single', reasons: ['strategic', 'protective'], details: [], fits: {} }];
      const { state } = playCircleSeason({ cast: names, setup, pool, seed: s });
      const h = state.handleOf[names[0]];
      if (state.profiles[h].mode !== 'catfish') continue;
      expect(state.scenes.filter(x => x.kind === 'recognise' && x.data.fame && x.data.profile === h)).toHaveLength(0);
    }
  });

  it('the lines exist for each kind of fame', () => {
    for (const k of ['recognise.celebrity', 'recognise.villain', 'recognise.tv']) expect(POOLS[k]?.length, k).toBeGreaterThanOrEqual(3);
  });
});

describe('a row carries who each player really is, for the arrival screens', () => {
  it('real age, job, hometown and fame per player; each profile its status, reason and bio', () => {
    const { rows, names } = season(2, n => ({ [n[0]]: { rep: 'threat', autoStars: 2.5, job: 'lawyer', hometown: 'Chicago' } }));
    const who = rows[0].ci.cast[names[0]];
    expect(who).toMatchObject({ job: 'lawyer', hometown: 'Chicago', rep: 'threat', stars: 2.5 });
    const p = Object.values(rows[0].ci.profiles)[0];
    expect(p).toHaveProperty('status');
    expect(p).toHaveProperty('reason');
    expect(p).toHaveProperty('bio');
    expect(Array.isArray(p.edits)).toBe(true);
  });
});

describe('every recognition names the face', () => {
  it('each fame entry says who it is about, or the viewer cannot tell', () => {
    for (const k of ['recognise.celebrity', 'recognise.villain', 'recognise.tv'])
      for (const e of POOLS[k]) expect(JSON.stringify(e.turns), e.id).toMatch(/\{b\}/);
  });
});
