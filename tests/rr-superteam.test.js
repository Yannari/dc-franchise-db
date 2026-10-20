// A Superteam (Stilt River's catfish, 1:1 with the real "Ca-Noodling"): the teams that reach it together do the task as
// one, and the moment they're put together is the challenge's story ("who are we stuck with"). Found 2026-10-19 by
// booking the place: the engine joined five pairs of teams on the leg and not one of those scenes reached the episode
// (a system that runs and reaches no screen, ADDING-A-SHOW §11.5).
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr superteam', () => {
  it('every Superteam the engine forms is put together on screen, on the leg it happened', () => {
    let formed = 0;
    for (const seed of [3, 11]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'stilt-river' } } });
      const eps = airSeason(res);
      const leg = res.legs.findIndex(l => l.place === 'stilt-river');
      expect(leg).toBeGreaterThan(-1);
      const picks = res.state.scenes.filter(s => s.kind === 'superteam-pick');
      formed += picks.length;
      const aired = new Set(eps[leg].segments.filter(s => s.kind === 'superteam-pick').map(s => s.scene));
      for (const p of picks) expect(aired.has(p.id), `seed ${seed}: superteam ${p.who.join(', ')} formed and never aired`).toBe(true);
    }
    expect(formed).toBeGreaterThan(0);
  });

  // Teams are put together in the order they reach the challenge (as on the show: nobody picks). The moment says what was
  // true when they were: two rival teams are stuck with each other (and stay rivals, no alliance out of it), the last
  // teams in are what's left over, anyone else is glad of who they got. Found 2026-10-19: leg.js forced 'chosen' on every
  // group, so rivals came out of the river allied and every line said "we pick you".
  it('a formation says what was true: rivals stuck together, the last teams in left over, the rest glad', () => {
    const endings = {};
    for (const seed of [3, 5, 11, 17]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { pins: { 6: 'stilt-river' } } });
      const n = res.legs.find(l => l.place === 'stilt-river').n;
      const picks = res.state.scenes.filter(s => s.kind === 'superteam-pick' && s.leg === n).sort((x, y) => x.data.t - y.data.t || x.id - y.id);
      picks.forEach((p, i) => {
        const e = p.data.ending;
        endings[e] = (endings[e] || 0) + 1;
        // (two teams at odds twice over or more; a single sour moment is not a feud)
        if (p.data.snap.rivalry >= 2) expect(e, `seed ${seed}: rivals ${p.who.join(', ')}`).toBe('forced-with-enemies');
        else if (e === 'left-over') expect(i, `seed ${seed}: left over before anyone else formed`).toBeGreaterThan(0);
        else expect(e, `seed ${seed}: ${p.who.join(', ')}`).toBe('chosen');
        if (e === 'forced-with-enemies') expect(p.data.effects.some(f => f[0] === 'ally'), 'rivals allied').toBe(false);
      });
      expect(picks.filter(p => p.data.ending === 'left-over').length, `seed ${seed}: one group is last`).toBeLessThanOrEqual(1);
      // and no formation is written with the same entry twice in one episode
      const ep = airSeason(res)[n - 1];
      const ids = ep.segments.filter(s => s.kind === 'superteam-pick').map(s => s.lineId);
      expect(new Set(ids).size, `seed ${seed}: ${ids.join(' ')}`).toBe(ids.length);
    }
    expect(endings['left-over'], JSON.stringify(endings)).toBeGreaterThan(0);
  });
});
