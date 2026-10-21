// Don in the seat his opener puts him in (2026-10-20: the swamp opener "sit in a rocking chair, so that's what I'm
// doing" had Don standing beside the chair, and the Don Box drawn right on top of it). An opener whose shot has Don
// with a race cut-out (a hammock, a sunlounger, a rocking chair: opener-shots.js `deco`) seats him on it, and the Don
// Box stands clear of it.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';

const seats = [];
beforeAll(() => {
  const pins = { 2: 'swamp-prison', 3: 'carnival-rainforest', 4: 'cliff-pool-isle', 5: 'treasure-isles' };
  for (let seed = 41; seed <= 46; seed++) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins } });
    const aired = airSeason(res);
    for (let i = 1; i <= 4; i++) for (const s of episodeScreens(res, aired, i).screens) {
      const seat = s.seg === 'don-opener' && (s.plate?.deco || []).find(d => /@race$/.test(d[0]));
      if (seat) seats.push({ s, seat });
    }
  }
}, 600000);

describe("rr viewer: Don in his opener's seat", () => {
  it('seats Don on the cut-out the opener puts him with, and keeps the Don Box off it', () => {
    expect(seats.length).toBeGreaterThan(0);
    for (const { s, seat: [key, x, , w] } of seats) {
      expect(s.donStand, `${s.id} ${key}`).toBeTruthy();
      expect(Math.abs(s.donStand[0] - x), `${s.id} Don on the ${key}`).toBeLessThan(w / 3);
      if (s.boxAt) expect(Math.abs(s.boxAt[0] - x), `${s.id} the Don Box off the ${key}`).toBeGreaterThan(w / 2 + 3);
    }
  });
});
