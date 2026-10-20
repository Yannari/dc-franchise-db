// A team is seen finishing the first task of a leg too. The director's "first clean run airs as getting there, the
// last as getting out" was written for a leg with one task: with two, no team ever finished the first one on
// screen (12 seasons, 2026-10-20: not one task-done at the wedding slots, the wall race or the dig site), so the
// task-done lines of every first task, the task-start lines of every second task, and the second-half plates
// (the dress on the rails, the gong, the built skeleton) were written and unreachable.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr task beats at a leg with two tasks', () => {
  it('airs a team finishing the first task, and a team arriving at the second', () => {
    const seen = {};
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { cast, teams } = raceCast(8, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'great-falls', 3: 'bamboo-wall-hills', 4: 'badlands' } } });
      for (const ep of airSeason(res)) for (const s of ep.segments) if (s.stretch && ['task-start', 'task-done'].includes(s.kind)) seen[`${s.kind}@${s.stretch}`] = (seen[`${s.kind}@${s.stretch}`] || 0) + 1;
    }
    for (const first of ['wedding-slots', 'wall-race', 'dino']) expect(seen[`task-done@${first}`] || 0, `task-done at ${first}: ${JSON.stringify(seen)}`).toBeGreaterThan(0);
    for (const second of ['tightrope', 'delicacies', 'oil-barrel']) expect(seen[`task-start@${second}`] || 0, `task-start at ${second}`).toBeGreaterThan(0);
  }, 240000);
});
