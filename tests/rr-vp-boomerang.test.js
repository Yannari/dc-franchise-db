// A Boomerang never just appears (the user, 2026-10-20: "boomerang animation when they get one is inexistant ... its
// weird when its just appear out of nowhere"). The team that finds one sees it come out of the tip into their hands, and
// keeps holding it for the rest of that moment; a team hit by one sees it fly in and hit them. The BOOMERANG board
// comes after, never before the thing it's about.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens, overlayObstacles, fitOverlay, beatCardBox, slamSpot, slamSize, overlapOf } from '../js/vp-rr-ep/steps.js';

const screens = [];
beforeAll(() => {
  for (const seed of [41, 42]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { twistPins: { 2: 'boomerang', 3: 'boomerang-blind' } } });
    const aired = airSeason(res);
    aired.forEach((_, i) => screens.push(...episodeScreens(res, aired, i).screens));
  }
}, 300000);

describe('rr viewer: the Boomerang', () => {
  it('plays a found Boomerang into the hands of the team that found it, then they hold it', () => {
    const found = screens.filter(s => s.seg === 'boomerang-found' && s.kind === 'world');
    expect(found.length).toBeGreaterThan(0);
    for (const s of found) {
      const at = s.steps.findIndex(x => x.slam?.cls === 'boom');
      expect(at, s.id).toBeGreaterThanOrEqual(0);
      expect(s.steps[at].boom, s.id).toEqual({ kind: 'found', team: s.teams[0] });
      for (const x of s.steps.slice(at + 1)) expect(x.held, s.id).toBe(s.teams[0]);
    }
  });

  // (the card and the board both wanted the top middle: the BOOMERANG board sat half under "Nessa and Luis reach the
  // board...", 2026-10-21 screenshots)
  it('puts the narration card clear of the board it shares a click with', () => {
    let n = 0;
    const bad = [];
    for (const s of screens) if (s.kind === 'world') s.steps.forEach((st, k) => {
      if (!st.slam || st.part !== 'beat') return;
      n++;
      const b = beatCardBox(st.text), size = [b[2] - b[0], b[3] - b[1]];
      const { at, k: kk } = fitOverlay(size, overlayObstacles(s, k, st.cam), () => [[50, 37]], undefined, [1, 0.86, 0.74, 0.64]);
      const spot = slamSpot(s, k, st.cam), [w, h] = slamSize(st.slam).map(v => v * (spot.k ?? 1));
      const card = [at[0] - size[0] * kk / 2, at[1] - size[1] * kk / 2, at[0] + size[0] * kk / 2, at[1] + size[1] * kk / 2];
      if (overlapOf(card, [spot[0] - w / 2, spot[1] - h / 2, spot[0] + w / 2, spot[1] + h / 2]) > 0) bad.push(`${s.id} ${s.seg} step ${k}`);
    });
    expect(n).toBeGreaterThan(3);
    expect(bad).toEqual([]);
  });

  it('flies a Boomerang into the team it hits', () => {
    const hit = screens.filter(s => s.seg === 'boomerang-hit' && s.kind === 'world');
    expect(hit.length).toBeGreaterThan(0);
    for (const s of hit) {
      const at = s.steps.findIndex(x => x.slam?.cls === 'boom');
      expect(at, s.id).toBeGreaterThanOrEqual(0);
      expect(s.steps[at].boom, s.id).toEqual({ kind: 'hit', team: s.teams[0] });
    }
  });
});
