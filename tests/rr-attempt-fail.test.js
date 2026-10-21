// A failed try is the challenge being done, and it's seen. Found by the 2026-10-20 season read: at a challenge with its
// own lines, a team's 'plain' moment gave way to its task beat, and a failed attempt (no other team, no storyline, no
// cause) always counted as plain, so not one aired in two whole seasons while every place had lines written for it.
// When it airs, the same team's result at that challenge comes after it (the failure, then how it ended).
// A staged challenge's failed try is its stage beat ending 'fail', and counts the same.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr failed attempts', () => {
  it('a failed try airs, before the same team gets the challenge done', () => {
    let aired = 0;
    for (const seed of [11, 12]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      for (const ep of airSeason(playRaceSeason({ teams, seed }))) {
        ep.segments.forEach((s, i) => {
          // (a staged challenge airs its failed try as the stage it went wrong at: 2026-10-21, every place is staged, and
          // the plain failed try is down to the few challenges a stage doesn't cover)
          if (s.kind !== 'attempt-fail' && !(s.kind === 'task-stage' && s.ending === 'fail')) return;
          aired++;
          const later = ep.segments.findIndex(x => x.kind === 'task-try' && x.stretch === s.stretch && x.teams?.[0] === s.teams?.[0]);
          if (later >= 0) expect(later, `leg ${ep.n} ${s.teams?.[0]} @${s.stretch}: the result aired before the failure`).toBeGreaterThan(i);
        });
      }
    }
    expect(aired).toBeGreaterThan(4);
  }, 240000);
});
