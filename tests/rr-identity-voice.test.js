// The Ridonculous Race: a team's identity is heard (the kits speak at natural moments; dialogue plan Task 4+).
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr identity voice', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 9);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 9 });
    eps = airSeason(res);
  });

  it('teams with an identity are heard in it, regularly', () => {
    const lines = eps.flatMap(ep => ep.segments.flatMap(s => s.lines || [])).filter(l => String(l.voice || '').startsWith('id:'));
    expect(lines.length).toBeGreaterThanOrEqual(30);
  });

  it('only a team with an identity speaks one, and no slot is left unfilled', () => {
    const st = res.state;
    const teamOf = n => Object.values(st.teams).find(t => t.a === n || t.b === n);
    for (const ep of eps) for (const s of ep.segments) for (const l of s.lines || []) {
      if (!String(l.voice || '').startsWith('id:')) continue;
      const t = teamOf(l.by);
      expect(t && (t.identity || t.custom?.voice), `${l.by}: ${l.text}`).toBeTruthy();
      expect(l.text).not.toMatch(/[{}]/);
    }
  });
});
