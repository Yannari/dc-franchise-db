// An alliance on the race is a few teams, not the race. Measured 2026-10-19 (20 seasons of 12 teams): every new deal
// joined the team's bloc, blocs averaged 3.6 teams and reached 9 of 12, and a team already in a bloc of four pitched the
// next one with "you two are the only team in this whole race I actually trust".
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const MAX_BLOC = 3;

describe('rr alliance blocs', () => {
  // a run of whole seasons: 40-65s alone on this machine, so the 90s default is too close in a full parallel
  // run (it timed out there, 2026-10-19); the ceiling sits well above the worst case, as vitest.config.js asks
  it(`a bloc a team pitches or meets its way into is at most ${MAX_BLOC} teams`, () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      for (const al of res.state.alliances) expect(al.teams.length, `seed ${seed}`).toBeLessThanOrEqual(MAX_BLOC);
    }
  }, 240000);

  it('a team already in an alliance asks the next team to join it, not to be the only one', () => {
    let joins = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      for (const sc of res.state.scenes.filter(s => s.kind === 'alliance-pitch')) {
        if (!sc.data?.snap?.bloc) continue;
        joins++;
        const ep = airSeason(res);
        const seg = ep.flatMap(e => e.segments).find(s => s.scene === sc.id);
        if (!seg) continue;
        expect(seg.lines.map(l => l.text).join(' '), seg.lineId).not.toMatch(/\bonly (ones|team|people)\b/i);
      }
      if (joins >= 3) break;
    }
    expect(joins).toBeGreaterThan(0);
  });
});
