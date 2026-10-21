// The race's locals have faces (the user made 49 avatars, 2026-10-20: "i finished the local"). A local who speaks shows
// their avatar, on the stage and in the dialogue box, named for who they are (the egg judge, not "A local"); a place's
// own local stands at their challenge when the plate has no cut-out of them.
import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { LOCALS, PLACE_LOCALS, localUrl, localFor, placeLocal } from '../js/vp-rr-ep/locals.js';
import { PLACES } from '../js/rr/places.js';

let eps = [];
beforeAll(() => {
  for (const [seed, pins] of [[41, {}], [42, { 2: 'fishing-cove', 3: 'red-sand-desert', 4: 'stone-head-island' }]]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins } });
    const aired = airSeason(res);
    aired.forEach((_, i) => eps.push(episodeScreens(res, aired, i)));
  }
}, 400000);

describe('rr viewer: the locals', () => {
  it('has an avatar for every local, and every challenge it names exists', () => {
    for (const id of Object.keys(LOCALS)) expect(existsSync(localUrl(id)), id).toBe(true);
    // (`stretch:side` keys name a side of a choose-one challenge)
    for (const [p, m] of Object.entries(PLACE_LOCALS)) for (const k of Object.keys(m)) {
      const [s, side] = k.split(':');
      const st = PLACES[p].stretches.find(x => x.id === s);
      expect(st, `${p}/${k}`).toBeTruthy();
      if (side) expect(st.sides?.some(d => d.id === side), `${p}/${k}`).toBe(true);
    }
  });

  it('the one running a challenge is its own local; anyone else is the role, the same face all scene', () => {
    expect(localFor('The judge', 'stone-head-island', 'eggs').id).toBe('egg-judge');
    expect(localFor('A local', 'fishing-cove', 'welcome-rite').name).toBe('The fisherman');
    expect(localFor('The ticket agent', 'fishing-cove', 'airport').id).toBe('ticket-agent');
    expect(localFor('A local', 'home-city', 'tower', 7).id).toBe(localFor('A local', 'home-city', 'tower', 7).id);
    expect(localFor('The crowd')).toBeNull();
  });

  it('every local on screen has a face, and a speaking one says who they are', () => {
    let speaking = 0, standing = 0;
    for (const ep of eps) for (const s of ep.screens) {
      for (const nm of s.locals || []) {
        if (nm === 'The crowd') continue;
        const f = s.localFaces?.[nm];
        expect(f?.url, `${s.id} ${nm}`).toBeTruthy();
        expect(existsSync(f.url)).toBe(true);
        if (s.steps.some(st => st.by === nm)) speaking++; else standing++;
      }
    }
    expect(speaking).toBeGreaterThan(5);
    expect(standing).toBeGreaterThan(10);
  });

  // (their full-body cut-outs come off now: the avatar always stands there, 2026-10-20)
  it("a place's own local stands at their challenge", () => {
    const at = {};
    for (const ep of eps) for (const s of ep.screens) {
      const own = placeLocal(s.place, s.stretch, s.side);
      if (!own || s.kind !== 'world' || s.mode !== 'talk' || s.plate?.closed || s.plate?.water || !['task-start', 'task-done'].includes(s.seg)) continue;
      const key = `${s.place}/${s.stretch}`;
      at[key] ||= { shown: 0 };
      if (Object.values(s.localFaces || {}).some(f => f.id === own)) at[key].shown++;
    }
    expect(Object.keys(at).length).toBeGreaterThan(5);
    for (const [k, v] of Object.entries(at)) expect(v.shown, k).toBeGreaterThan(0);
  });
});
