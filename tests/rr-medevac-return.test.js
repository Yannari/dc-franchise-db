// A team that can't go on after a leg brings an eliminated team back (chill.js medevac). The user, 2026-11-03: "the
// team eliminated in my ep1 were at the start of my ep2". The choice had no time and was pulled in before the
// elimination, and the next recap still said goodbye to the team that came back.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr medevac return', () => {
  it('airs the choice after the elimination, and the next recap says who came back', () => {
    // (seed 31: the Police Cadets are pulled out after leg 1 and bring back the Adversity Twins, eliminated on it)
    const { cast, teams } = raceCast(12, 31);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 31 });
    const eps = airSeason(res);
    const m = (res.state.medevacs || []).find(x => x.returned);
    expect(m, 'seed 31 has a medevac that brings a team back').toBeTruthy();
    const ep = eps[m.leg - 1];
    const segs = ep.segments;
    const choice = segs.findIndex(s => s.kind === 'medevac-choice');
    const exit = segs.findIndex(s => s.kind === 'don-elim' && s.teams.includes(m.returned));
    expect(choice, 'the choice airs').toBeGreaterThanOrEqual(0);
    if (exit >= 0) expect(choice, 'after the team that comes back was sent home').toBeGreaterThan(exit);
    const recap = (eps[m.leg]?.previously?.lines || []).map(l => l.text).join(' ');
    const back = res.state.teams[m.returned];
    expect(recap).toMatch(/come back|brought back|gave .* their place|in their place/);
    expect(recap.includes(back.name) || recap.includes(back.a)).toBe(true);
  }, 240000);
});
