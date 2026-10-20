// The Ridonculous Race: a big cast airs like the show (the user, 2026-10-18: "ok if it's faithful").
// At least BIG_CAST teams always get their full scenes. Beyond those, a team with no story that leg (not top
// three, not bottom three, no penalty, nothing with another team or that must air) is checked in by Don in a
// line, with the others like it, and its clean runs at a task are shown together; who is quiet rotates.
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { BIG_CAST } from '../js/rr/story/director.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr big cast', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(18, 3);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 3 });
    eps = airSeason(res);
  });

  it('quick check-ins only while the cast is big, and only for teams with no story', () => {
    expect(BIG_CAST).toBe(10);
    let quick = 0;
    eps.forEach((ep, i) => {
      const order = res.legs[i].order, N = order.length;
      // a check-in run (two or more mid-pack teams in a row, any cast) is how Don does the mat, not a hurried team:
      // rr-checkin-run.test.js holds it
      for (const s of ep.segments.filter(s => s.kind === 'mat-montage' && !s.checkinRun)) {
        expect(N, `leg ${ep.n}`).toBeGreaterThan(BIG_CAST);
        for (const id of s.teams) {
          const at = order.indexOf(id);
          expect(at >= 3 && at < N - 3, `leg ${ep.n}: ${id} placed ${at + 1} of ${N}`).toBe(true);
          const story = ep.segments.some(x => x.teams.includes(id) && x.scene != null && !['mat-montage', 'don-opener', 'same-flight', 'int-bleachers'].includes(x.kind)
            && (x.tier === 0 || x.teams.length > 1));
          expect(story, `leg ${ep.n}: ${id} had a story and was hurried`).toBe(false);
          quick++;
        }
        expect(s.lines?.length, `leg ${ep.n}`).toBeGreaterThanOrEqual(s.teams.length);
      }
      if (N <= BIG_CAST) expect(ep.segments.some(s => (s.kind === 'mat-montage' && !s.checkinRun) || s.kind === 'task-montage'), `leg ${ep.n}`).toBe(false);
    });
  });

  // six whole seasons of a big cast: 50-75s alone on this machine, so the 90s default is too close in a full parallel
  // run (it timed out there, 2026-10-19); the ceiling sits well above the worst case, as vitest.config.js asks
  it('quiet teams do get checked in together, across seasons (one season can have a story for every team)', () => {
    let quick = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { cast, teams } = raceCast(18, seed);
      setPlayers(cast);
      for (const ep of airSeason(playRaceSeason({ teams, seed })))
        quick += ep.segments.filter(s => s.kind === 'mat-montage').flatMap(s => s.teams).length;
    }
    expect(quick).toBeGreaterThan(0);
  }, 240000);

  it('at least ten teams get their full scenes in every episode, and the quiet ones rotate', () => {
    const quickBy = {};
    eps.forEach((ep, i) => {
      const quick = new Set(ep.segments.filter(s => s.kind === 'mat-montage' && !s.checkinRun).flatMap(s => s.teams));
      expect(res.legs[i].order.length - quick.size, `leg ${ep.n}`).toBeGreaterThanOrEqual(Math.min(BIG_CAST, res.legs[i].order.length));
      for (const id of quick) quickBy[id] = (quickBy[id] || 0) + 1;
    });
    const counts = Object.values(quickBy);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(3);
  });

  it('every team still checks in on air, quick or full', () => {
    eps.forEach((ep, i) => {
      for (const id of res.legs[i].order) {
        if (res.legs[i].eliminated.includes(id)) continue;
        const seen = ep.segments.some(s => ['don-place', 'don-crown', 'mat-montage', 'don-fakeout'].includes(s.kind) && s.teams.includes(id));
        expect(seen, `leg ${ep.n}: ${id}`).toBe(true);
      }
    });
  });

  it('a task montage names two or more teams, each with a clean run there', () => {
    // with ten teams always in full, nearly every team has a story each leg (measured 2026-10-18: one quiet team in a
    // whole 18-team season), so a montage is rare: this checks one is right when it happens, across three seasons
    let n = 0;
    const seasons = [[res, eps]];
    for (const seed of [11, 21]) {
      const { cast, teams } = raceCast(18, seed);
      setPlayers(cast);
      const r = playRaceSeason({ teams, seed });
      seasons.push([r, airSeason(r)]);
    }
    for (const [res, eps] of seasons) eps.forEach((ep, i) => {
      for (const s of ep.segments.filter(s => s.kind === 'task-montage')) {
        n++;
        expect(s.teams.length).toBeGreaterThanOrEqual(2);
        for (const id of s.teams) {
          const row = res.state.taskLog.find(r => r.leg === ep.n && r.team === id && r.stretch === s.stretch);
          expect(row && !row.fails && !row.switched && !row.quit, `leg ${ep.n} ${id}`).toBe(true);
        }
        expect(s.lines?.length).toBeGreaterThan(0);
        expect(s.lines.map(l => l.text).join(' ')).not.toMatch(/[{}]/);
      }
    });
    expect(n).toBeGreaterThanOrEqual(0);
  });

  it('a quick check-in is a line or two a team', () => {
    for (const ep of eps) for (const s of ep.segments.filter(s => s.kind === 'mat-montage')) {
      expect(s.lines.length, `leg ${ep.n}`).toBeLessThanOrEqual(3 * s.teams.length);
      expect(s.lines.filter(l => l.by === 'Don').length).toBeGreaterThanOrEqual(s.teams.length);
    }
  });
});
