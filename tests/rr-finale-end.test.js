// How the finale ends (the user, 2026-10-23: "last word at the finale is the winners then the losers then last words of
// the winner then the host don signing off"): Don crowns the winners, names the runners-up, the winners have the last
// word on the stage, and Don signs the season off; nothing airs after him.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const finales = [];
beforeAll(() => {
  for (const seed of [41, 42, 43, 44]) {
    const { cast, teams } = raceCast(12, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    finales.push({ seed, res, ep: airSeason(res).at(-1) });
  }
}, 600000);

describe('rr finale: the last words', () => {
  it('crown, runners-up, the winners\' last words, then Don signing off, and nothing after', () => {
    for (const { seed, res, ep } of finales) {
      const segs = ep.segments;
      const at = (kind, ending) => segs.findIndex(s => s.kind === kind && (!ending || s.ending === ending));
      const crown = at('don-crown', 'winner'), runner = at('don-crown', 'runner-up');
      const words = at('winner-words'), off = at('don-signoff');
      const where = `seed ${seed}`;
      expect(crown, where).toBeGreaterThanOrEqual(0);
      expect(runner, where).toBeGreaterThan(crown);
      expect(words, where).toBeGreaterThan(runner);
      expect(off, where).toBe(segs.length - 1);
      expect(segs[words].teams, where).toEqual([res.winner]);
      expect(segs[words].lines?.length, where).toBeGreaterThan(1);
      expect(segs[off].lines?.length, where).toBeGreaterThan(0);
      expect(segs[off].lines.every(l => /don/i.test(l.by || l.speaker || 'Don') || l.kind === 'beat' || !l.by), where).toBe(true);
    }
  });
});
