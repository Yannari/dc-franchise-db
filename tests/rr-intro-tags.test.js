// Two teams in the premiere never say the same line about what they are to each other. Found by the 2026-10-20 season
// read (seed 42): "I'm winning, by the way. Not the race. Us. I'm winning us." said by two couples in the same episode,
// the line picked for each team on its own from the relationship's short list.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr introduction tags', () => {
  it('gives every team in the premiere its own interview lines', () => {
    const twice = [];
    for (const seed of [41, 42, 43, 44, 45, 46]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const first = airSeason(playRaceSeason({ teams, seed }))[0];
      const seen = new Map();
      for (const s of first.segments.filter(x => x.kind === 'team-intro')) for (const l of s.lines.filter(x => x.kind === 'conf')) {
        if (seen.has(l.text) && seen.get(l.text) !== s.teams[0]) twice.push(`seed ${seed}: ${l.text}`);
        seen.set(l.text, s.teams[0]);
      }
    }
    expect(twice).toEqual([]);
  }, 240000);
});
