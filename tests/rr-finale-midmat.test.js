// The finale's halfway mat is not a finish line. Read 2026-10-19 (seed 61): the first team there heard "First place,
// and nobody even close!" with two challenges still to run, the second "You're safe", and the third, told at the
// halfway mat after the winners were crowned, "you're the last team to arrive".
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr finale halfway mat', () => {
  it("Don's lines at the halfway mat are about the halfway mat", () => {
    let n = 0;
    for (const seed of [61, 3, 8]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      const final = airSeason(res).at(-1);
      const mid = new Set(res.state.scenes.filter(s => s.data?.midmat).map(s => s.id));
      for (const seg of final.segments.filter(s => mid.has(s.scene))) {
        n++;
        const text = seg.lines.map(l => l.text).join(' ');
        expect(seg.lineId, text).toMatch(/^fm\./);
        expect(text).toMatch(/halfway/i);
        expect(text).not.toMatch(/first place|you're safe|last team to arrive/i);
      }
    }
    expect(n).toBeGreaterThanOrEqual(6);
  });
});
