// A team is in one place at a time (the user, 2026-10-21: "FINN and Manu are outside then right after inside again"):
// at 08:12 Finn and Manu stood helmeted on the tower's outside deck with Natalia and Grett, and the very next screen, at
// 08:12, in the corridor inside with Bowie and Sami. Each shot's plate followed only the scene's first team (where its
// stage put it), so the other team in it was wherever the first one was. Two screens of the same team, at the same
// stretch, minutes apart, stand it in the same shot.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';

const NEAR = 5;   // minutes
const CLOSE = 3;  // screens apart: what a viewer sees one after the other
const jumps = [];
let pairs = 0;
beforeAll(() => {
  for (const [n, seed] of [[12, 8], [10, 3], [12, 21]]) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    eps.forEach((_, i) => {
      const last = {};
      for (const [j, s] of episodeScreens(res, eps, i).screens.entries()) {
        if (s.kind !== 'world' || s.mode !== 'talk' || !s.plate?.f || s.t == null || !s.stretch) continue;
        for (const id of s.teams || []) {
          const p = last[id];
          // (its own progress, a stage, its start or its finish, moves a team on: a conversation doesn't)
          // (only a conversation between two teams is held to it: a team's own moment is at its own stage, a crowd is shot wide)
          const own = (s.teams || []).length !== 2 || s.split || (/^(task-|zip-it)/.test(s.seg) && s.teams[0] === id);
          if (p && !own && p.stretch === s.stretch && Math.abs(p.t - s.t) <= NEAR && j - p.j <= CLOSE) {
            pairs++;
            // (two teams last seen at the same minute in two places can't both stay put: the scene goes where the latest
            // sighting was, and only the other one moves)
            const other = (s.teams || []).some(o => o !== id && last[o]?.f === s.plate.f && last[o].stretch === s.stretch && Math.abs(last[o].t - s.t) <= Math.abs(p.t - s.t));
            // (the team the scene is about is at a stage of the challenge: the scene is at that stage, the other team with it;
            // tests/rr-vp-stage-talk.test.js)
            const stages = Object.values(stretchPlates(s.place, s.stretch, s.side)?.stages || {}).flatMap(g => [g.plate, g.fail, ...(g.alt || [])]).filter(Boolean).map(x => (Array.isArray(x) ? x[0] : x.f));
            const atTheirStage = stages.includes(s.plate.f);
            if (p.f !== s.plate.f && !other && !atTheirStage) jumps.push(`seed ${seed} ${s.id} ${id} ${s.stretch}: ${p.f} -> ${s.plate.f}`);
          }
          last[id] = { stretch: s.stretch, t: s.t, f: s.plate.f, j };
        }
      }
    });
  }
}, 600000);

describe('rr viewer: one place at a time', () => {
  it('stands a team in the same shot when it is seen again at the same stretch minutes later', () => {
    expect(pairs).toBeGreaterThan(20);
    expect(jumps).toEqual([]);
  });
});
