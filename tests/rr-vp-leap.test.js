// A jump off a cliff is a jump (the user, 2026-10-21, at Cliff Pool Isle's falls: "theres no animation for jumping from
// a cliff we said animate everything", and on the way back up: "sami isnt even hauling or near the chest"). The one
// diving stands on the top of the falls until the line that has them jump, then leaps out and drops into the lagoon,
// where they stay; the climb back up goes up the cliff with the chest in their arms.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';

const shots = [];
beforeAll(() => {
  for (const seed of [8, 21, 34]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'cliff-pool-isle' } } });
    const aired = airSeason(res);
    const i = res.legs.findIndex(l => l.place === 'cliff-pool-isle');
    if (i >= 0) shots.push(...episodeScreens(res, aired, i).screens.filter(s => s.seg === 'task-stage' && s.stretch === 'falls-dive'));
  }
}, 600000);

const JUMPS = /\b(jumps?|leaps?|drops?|dives?|steps off)\b/i;

describe('rr viewer: off the falls', () => {
  it('stands the diver on the top of the falls until the line where they jump, then has them in the lagoon', () => {
    const jumps = shots.filter(s => s.stage === 'the-jump');
    expect(jumps.length).toBeGreaterThan(0);
    for (const s of jumps) {
      expect(s.plate.leap, s.id).toBe(true);
      const at = s.steps.findIndex(x => x.part === 'beat' && JUMPS.test(x.text || ''));
      expect(s.leapAt, s.id).toBe(at < 0 ? Math.min(1, s.steps.length - 1) : at);
      const id = s.teams[0];
      s.pos.forEach((p, k) => {
        if (k < s.leapAt) expect(p[id][1], `${s.id} step ${k}: on the top`).toBeLessThan(40);
        else expect(p[id][1], `${s.id} step ${k}: in the lagoon`).toBeGreaterThan(60);
      });
    }
  });

  it('climbs back up the cliff with the chest', () => {
    const ups = shots.filter(s => s.stage === 'cliff-path');
    expect(ups.length).toBeGreaterThan(0);
    for (const s of ups) {
      expect(s.plate.mode, s.id).toBe('climb');
      expect(s.plate.carry, s.id).toBe('chest');
      // (a dropped chest slips back down: only a climb that makes it ends higher than it started)
      const id = s.teams[0], ys = s.pos.map(p => p[id][1]);
      if (!s.failStamp) expect(ys.at(-1), s.id).toBeLessThan(ys[0]);
    }
  });
});
