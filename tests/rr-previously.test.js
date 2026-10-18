// The Ridonculous Race: "previously on", from what actually aired (dialogue plan, Task 10).
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { previouslyFor, RECAP_KINDS } from '../js/rr/story/previously.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr previously', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(10, 7);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 7 });
    eps = airSeason(res);
  });

  it('the first episode has none; every later one opens on it', () => {
    expect(eps[0].previously).toBeNull();
    for (const ep of eps.slice(1)) expect(ep.previously, `leg ${ep.n}`).toBeTruthy();
  });

  it('recaps only moments that aired last time, at most four, Don speaking', () => {
    for (let i = 1; i < eps.length; i++) {
      const p = eps[i].previously;
      const airedLast = new Set(eps[i - 1].segments.map(s => s.scene).filter(x => x != null));
      expect(p.scenes.length).toBeGreaterThan(0);
      expect(p.scenes.length).toBeLessThanOrEqual(4);
      for (const id of p.scenes) expect(airedLast.has(id), `leg ${eps[i].n} recaps #${id}`).toBe(true);
      expect(p.lines.every(l => l.by === 'Don')).toBe(true);
      for (const l of p.lines) expect(l.text).not.toMatch(/[{}]|undefined/);
    }
  });

  it("names last episode's exit when there was one", () => {
    for (let i = 1; i < eps.length; i++) {
      const out = res.legs[i - 1].eliminated;
      if (!out.length) continue;
      const name = res.state.teams[out[0]].name;
      expect(eps[i].previously.lines.map(l => l.text).join(' ')).toContain(name);
    }
  });

  it('only recaps kinds it has words for', () => {
    for (const ep of eps.slice(1)) for (const k of ep.previously.kinds) expect(RECAP_KINDS).toContain(k);
  });
});
