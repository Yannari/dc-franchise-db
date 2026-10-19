// Don runs through the middle of the pack like the show does ("third place... hold on... fourth, fifth"): two or more
// mid-pack teams with no penalty checking in back to back are one run, in a cast of any size (the user, 2026-10-19:
// fewer repeats; Don's mid-pack check-ins were 15 repeats a season of a hundred). The top three, the bottom three, a
// penalty and a lone mid-pack check-in keep their own moment, and every team's racing still airs in full.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr check-in runs', () => {
  it('back-to-back mid-pack check-ins air as one run, in a small cast too, and only those', () => {
    let runs = 0;
    for (const [n, seed] of [[8, 3], [10, 5], [12, 7]]) {
      const { cast, teams } = raceCast(n, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      airSeason(res).forEach((ep, i) => {
        const leg = res.legs[i], N = leg.order.length;
        for (const s of ep.segments.filter(x => x.kind === 'mat-montage' && x.checkinRun)) {
          runs++;
          expect(s.teams.length).toBeGreaterThanOrEqual(2);
          expect(s.lines.length).toBeGreaterThanOrEqual(s.teams.length);
          const places = s.teams.map(id => leg.order.indexOf(id));
          for (const at of places) expect(at >= 3 && at < N - 3, `${n}/${seed} leg ${ep.n}: place ${at + 1} of ${N}`).toBe(true);
          for (const id of s.teams) expect(leg.penalties?.[id] || 0).toBe(0);
          expect(Math.max(...places) - Math.min(...places)).toBe(s.teams.length - 1);
        }
      });
    }
    expect(runs).toBeGreaterThan(3);
  });
});
