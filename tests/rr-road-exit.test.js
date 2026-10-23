// A team Don goes out to on the road is the leg's ending (the user, 2026-10-21: "this one didnt announce the eliminated
// for some reason"): Evie and Nura's exit at the waterfall aired in the middle of the leg, before Don had even explained
// the challenge, and the leg ended on the seventh team's check-in. Don's walk out to them airs after the last check-in;
// what they were still doing once the mat was open is cut in with the check-ins before it.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const legs = [];
beforeAll(() => {
  // (seasons until three exits on the road: 2026-10-22, the roster's new faces left one in the first six)
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
    if (legs.length >= 3) break;
    const { cast, teams } = raceCast(10, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const aired = airSeason(res);
    res.legs.forEach((leg, i) => { if (leg.kind !== 'final' && (leg.onLocation || []).length) legs.push({ seed, leg, ep: aired[i] }); });
  }
}, 600000);

describe('rr: an exit on the road', () => {
  it('airs after the last check-in, as the leg\'s ending', () => {
    expect(legs.length).toBeGreaterThan(1);
    for (const { seed, leg, ep } of legs) {
      const segs = ep.segments;
      const out = leg.onLocation[0];
      const exit = segs.findIndex(x => x.kind === 'don-arrives' && x.teams.includes(out));
      expect(exit, `seed ${seed} leg ${leg.n}`).toBeGreaterThan(-1);
      const lastPlace = Math.max(...segs.map((x, j) => (x.kind === 'don-place' || x.kind === 'mat-montage' ? j : -1)));
      expect(exit, `seed ${seed} leg ${leg.n}: Don goes to them after the last check-in`).toBeGreaterThan(lastPlace);
      // nothing but their goodbye after it
      const after = segs.slice(exit + 1).filter(x => !x.teams.includes(out));
      expect(after.map(x => x.kind), `seed ${seed} leg ${leg.n}`).toEqual([]);
    }
  });

  it('airs nothing they did after Don reached them', () => {
    for (const { seed, leg, ep } of legs) {
      const out = leg.onLocation[0];
      const exit = ep.segments.find(x => x.kind === 'don-arrives' && x.teams.includes(out));
      const late = ep.segments.filter(x => x.teams.length && x.teams.every(id => id === out) && !/^int-/.test(x.kind) && x !== exit && x.t > exit.t + 0.01
        && !(/^task-/.test(x.kind) && (leg.log || []).some(l => l.id === out && l.stretch === x.stretch && l.from <= exit.t + 0.01)));
      expect(late.map(x => `${x.kind} ${x.t}`), `seed ${seed} leg ${leg.n}`).toEqual([]);
    }
  });

  it('never airs the team at a challenge before Don has explained it', () => {
    for (const { seed, leg, ep } of legs) {
      const segs = ep.segments, out = leg.onLocation[0];
      segs.forEach((x, j) => {
        if (!x.teams.includes(out) || !/^task-/.test(x.kind)) return;
        const demo = segs.findIndex(y => y.kind === 'don-demo' && y.stretch === x.stretch);
        if (demo >= 0) expect(j, `seed ${seed} leg ${leg.n}: ${x.kind} at ${x.stretch}`).toBeGreaterThan(demo);
      });
    }
  });
});
