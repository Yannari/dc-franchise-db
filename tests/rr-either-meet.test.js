// Two teams who meet at an Either/Or before they split are seen where they met, at its start, not on the side one of
// them then took (the user, 2026-10-21: "a team ara and zoey being in the elevator and the stairs at the same time for 2
// confrontations with another team"). Teams of different sides meet only in its first minutes (leg.js meetInside);
// the moment was shot on the first team's side, so a team that met an elevator team and then a stairs team was in
// the elevator and the stairwell at once.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';
import { PLACES } from '../js/rr/places.js';

const found = [];
beforeAll(() => {
  for (const seed of [3, 4, 5, 6, 8, 9]) {
    const { cast, teams } = raceCast(10, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const aired = airSeason(res);
    const leg = res.legs[0];
    const either = new Set((PLACES[leg.place]?.stretches || []).filter(s => s.sides).map(s => s.id));
    const rows = (res.state.taskLog || []).filter(r => r.leg === leg.n);
    const sideOf = (id, sid) => rows.find(r => r.team === id && r.stretch === sid)?.side ?? null;
    const segs = aired[0].segments, screens = episodeScreens(res, aired, 0).screens;
    for (const s of screens) {
      if (s.kind !== 'world' || !either.has(s.stretch) || (s.teams || []).length < 2) continue;
      const sides = new Set(s.teams.map(id => sideOf(id, s.stretch)).filter(Boolean));
      if (sides.size > 1) found.push({ seed, s, seg: segs.find(x => x.stretch === s.stretch && x.t === s.t && x.kind === s.seg && x.teams.join() === s.teams.join()) });
    }
  }
}, 600000);

// (what two teams can do in its first minutes: talk, size each other up, pitch, tease; nobody has started yet, so
// nobody has watched anybody at it: "they've been at it for an hour", "has failed this task twice already" aired there)
const NEEDS_WORK = ['watching-together', 'spy', 'steal', 'help-offer', 'rescue', 'tug-of-war', 'mock-the-struggle', 'save-your-enemy',
  'free-ride', 'course-sabotage', 'mind-game', 'deal'];
describe('rr: what a meeting at an Either/Or before the split can be', () => {
  it('is never a scene about watching the other team at work', () => {
    const bad = [];
    let n = 0;
    for (const { seed, seg } of found) {
      if (!seg) continue;
      n++;
      if (NEEDS_WORK.includes(seg.kind)) bad.push(`seed ${seed} ${seg.kind}.${seg.ending}`);
    }
    expect(n).toBeGreaterThan(3);
    expect(bad).toEqual([]);
  });
  it('keeps "failed this task twice" for a team that has, and the cab offer for the road', async () => {
    const { POOLS } = await import('../js/rr/script/lines/index.js');
    const find = id => Object.values(POOLS).flat().find(e => e.id === id);
    expect(find('mg.s-task1').when).toMatchObject({ at: 'task', failsB: 'many' });
    expect(find('vt.ds4').when).toMatchObject({ at: 'road' });
  });
});

describe('rr: a meeting at an Either/Or before the teams split', () => {
  it('airs at the start of it, on no side', () => {
    expect(found.length).toBeGreaterThan(3);
    for (const { seed, s, seg } of found) {
      expect(seg?.side ?? null, `seed ${seed} ${s.id} ${s.seg}`).toBe(null);
      expect(s.side ?? null, `seed ${seed} ${s.id}`).toBe(null);
      const sp = stretchPlates(s.place, s.stretch, null);
      expect([...(sp?.talk || []), sp?.act].filter(Boolean).map(p => p.f), `seed ${seed} ${s.id}: ${s.plate.f}`).toContain(s.plate.f);
    }
  });
});
