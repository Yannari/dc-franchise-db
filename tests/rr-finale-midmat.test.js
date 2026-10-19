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

  it('the third team is cut at the halfway mat before the final dash, the way the show cuts it (the user, 2026-10-19)', () => {
    for (const seed of [61, 3, 8]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      const leg = res.legs.at(-1);
      const out = leg.eliminated.find(id => leg.how[id] === 'midpoint');
      if (!out) continue;
      const segs = airSeason(res).at(-1).segments;
      const cut = segs.findIndex(s => s.kind === 'don-elim' && s.teams.includes(out));
      const crown = segs.findIndex(s => s.kind === 'don-crown');
      const lastMid = Math.max(...segs.map((s, i) => (s.kind === 'don-place' && s.src?.data?.midmat ? i : -1)));
      expect(cut, `seed ${seed}`).toBeGreaterThan(lastMid);
      expect(cut, `seed ${seed}`).toBeLessThan(crown);
      // nothing of theirs airs after their cut but their goodbye
      for (const s of segs.slice(cut + 1).filter(x => x.teams.includes(out))) expect(['int-exit', 'console', 'goodbye', 'goodbye-kiss', 'int-bleachers'], `seed ${seed} ${s.kind}`).toContain(s.kind);
    }
  });
});

