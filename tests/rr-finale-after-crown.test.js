// Once the winners are crowned, the finale is over on screen: the runners-up are named next, at the line, and the
// episode doesn't go back to them racing. Found by the 2026-10-20 season read (seed 43): the winners were crowned at
// 22:50, and then the runners-up started the buoys at 12:57 the next day, hugged at the footrace, finished it, and only
// then were named second.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr finale after the crown', () => {
  it('airs only the runners-up being named, the winners own moments and the interviews after the crown', () => {
    const late = [];
    let finales = 0;
    for (const seed of [41, 42, 43, 44]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const eps = airSeason(playRaceSeason({ teams, seed }));
      const ep = eps.at(-1);
      const k = ep.segments.findIndex(s => s.kind === 'don-crown' && s.ending === 'winner');
      if (k < 0) continue;
      finales++;
      // (the winners' own moments stay after it: a proposal on the mat)
      const won = ep.segments[k].teams[0];
      for (const s of ep.segments.slice(k + 1)) if (s.kind !== 'don-crown' && !s.kind.startsWith('int-') && !s.teams.includes(won)) late.push(`seed ${seed}: ${s.kind}/${s.ending} @${s.stretch}`);
    }
    // (seed 43: the runners-up were named at 13:26 the next day, after their chase had been cut in before the crown)
    for (const seed of [43]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const ep = airSeason(playRaceSeason({ teams, seed })).at(-1);
      const crowns = ep.segments.filter(s => s.kind === 'don-crown');
      expect(crowns.at(-1).t - crowns[0].t, `seed ${seed}`).toBeLessThan(60);
    }
    expect(finales).toBe(4);
    expect(late).toEqual([]);
  }, 240000);
});
