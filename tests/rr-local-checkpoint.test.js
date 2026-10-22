// A local checkpoint (the user, 2026-10-22: "the local never said anything so why are they even there ... the local and
// their accent should be part of the game too and no need to add a donbox when a local is already to give ticket (only
// if they give ticket donbox isnt necessary) its a local checkpoint"). Where a challenge's own local hands the clue out,
// the local says something as it changes hands, in their own way of talking (the fisherman, the gaucho, the monk), and
// there is no Don Box there, not even when Don shows the challenge.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { PLACE_LOCALS, LOCALS, placeLocal } from '../js/vp-rr-ep/locals.js';
import { HANDOVER } from '../js/rr/script/lines/local-handover.js';
import { PLACES } from '../js/rr/places.js';

// every challenge whose clue a local hands out (a side's own local isn't at the checkpoint: the Don Box is)
const AT_CHECKPOINT = Object.entries(PLACE_LOCALS).flatMap(([p, m]) => Object.keys(m).filter(k => !k.includes(':')).map(s => [p, s, placeLocal(p, s)]))
  .filter(([p, s]) => PLACES[p]?.stretches.some(x => x.id === s));
const places = [...new Set(AT_CHECKPOINT.map(([p]) => p))];
const runs = [];
beforeAll(() => {
  for (let i = 0, seed = 61; i < places.length; i += 10, seed++) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const pins = Object.fromEntries(places.slice(i, i + 10).map((p, k) => [k + 2, p]));
    const res = playRaceSeason({ teams, seed, options: { pins } });
    const aired = airSeason(res);
    runs.push({ seed, res, aired, eps: aired.map((_, k) => episodeScreens(res, aired, k)) });
  }
}, 1200000);

describe('rr: a local checkpoint', () => {
  it('has the local\'s own words for handing the clue over, for every local who hands one out', () => {
    expect(AT_CHECKPOINT.length).toBeGreaterThan(30);
    for (const [p, s, id] of AT_CHECKPOINT) {
      const h = HANDOVER[id];
      expect(h, `${p}/${s}: ${id}`).toBeTruthy();
      expect(h.any.length, id).toBeGreaterThanOrEqual(3);
      expect(h.ahead?.length, id).toBeGreaterThanOrEqual(1);
      expect(h.behind?.length, id).toBeGreaterThanOrEqual(1);
    }
  });

  it('has the local say something every time they hand a team its clue, and stand there to do it', () => {
    let n = 0;
    for (const { seed, eps } of runs) for (const ep of eps) for (const s of ep.screens) {
      if (s.seg !== 'clue' || !s.stretch) continue;
      const id = placeLocal(s.place, s.stretch);
      const local = id && LOCALS[id];
      const spoke = s.steps.filter(x => x.by && Object.values(LOCALS).includes(x.by)).map(x => x.by);
      if (!id) { expect(spoke, `seed ${seed} ${s.id}: a local talks at a Don Box`).toEqual([]); continue; }
      n++;
      expect(s.steps[0]?.by, `seed ${seed} ${s.id} ${s.place}/${s.stretch}: ${s.steps.map(x => `${x.by}: ${x.text}`).join(' | ')}`).toBe(local);
      expect(s.locals, `seed ${seed} ${s.id}`).toContain(local);
    }
    expect(n).toBeGreaterThan(15);
  });

  it('puts no Don Box where a local hands the clue out, not even when Don shows the challenge', () => {
    let n = 0;
    for (const { seed, eps } of runs) for (const ep of eps) for (const s of ep.screens) {
      if (!s.stretch || !placeLocal(s.place, s.stretch)) continue;
      if (!['clue', 'clue-montage', 'box-grab', 'decide-side', 'don-demo'].includes(s.seg)) continue;
      n++;
      expect(s.donBox, `seed ${seed} ${s.id} ${s.seg}`).toBeFalsy();
      if (s.checkpoint) expect(s.checkpoint.from, `seed ${seed} ${s.id}`).toBe('local');
    }
    expect(n).toBeGreaterThan(15);
  });
});
