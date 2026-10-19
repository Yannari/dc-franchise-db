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

  it('a team never says the same kit line twice in a season', () => {
    const seen = new Set();
    for (const ep of eps) for (const s of ep.segments) for (const l of s.lines || []) {
      if (!l.auto) continue;
      expect(seen.has(`${l.by}|${l.text}`), `${l.by}: ${l.text}`).toBe(false);
      seen.add(`${l.by}|${l.text}`);
    }
  });

  it('an added line is said in the scene, before its closing interview, and never struggles after a success', () => {
    for (const ep of eps) for (const s of ep.segments) {
      const ls = s.lines || [];
      ls.forEach((l, i) => {
        if (!l.auto || s.kind.startsWith('int-')) return;
        expect(ls.slice(0, i).some(x => x.kind === 'conf') && ls.slice(i).every(x => x.kind !== 'conf'), `${s.kind}: ${l.text}`).toBe(false);
        if (s.kind === 'task-try' && s.ending === 'after-fails') expect(l.voice).not.toBe('id:struggle');
      });
    }
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
