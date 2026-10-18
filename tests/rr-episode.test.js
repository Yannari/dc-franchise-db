// The Ridonculous Race: the aired episode as text, to read (dialogue plan, Task 10).
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason, episodeText } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr episode text', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(8, 5);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 5 });
    eps = airSeason(res);
  });

  it('airs every leg, in order', () => {
    expect(eps.map(e => e.n)).toEqual(res.legs.map(l => l.n));
  });

  it('prints every aired segment, its words when it has them, and says so when it has none', () => {
    for (const [i, ep] of eps.entries()) {
      const text = episodeText(res.state, res.legs[i], ep);
      expect(text).toMatch(new RegExp(`^LEG ${ep.n} · `, 'm'));
      const heads = text.split('\n').filter(l => l.startsWith('-- '));
      expect(heads.length).toBe(ep.segments.length);
      for (const seg of ep.segments) {
        if (seg.lines) for (const l of seg.lines) expect(text).toContain(l.text);
      }
      expect(text.match(/\[no words yet\]/g)?.length || 0).toBe(ep.segments.filter(s => !s.lines).length);
      expect(text).not.toMatch(/undefined|NaN|\[object|\{[a-z]+(\.\w+)?\}/);
    }
  });
});
