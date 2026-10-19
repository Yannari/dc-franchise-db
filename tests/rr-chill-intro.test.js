// The Ridonculous Race: Don presents the Chill Zone before the first team reaches it, the way the show does it (where
// it is, a gag about the place, and that the last team in may be going home), in the place's own words.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import NARR2 from '../js/rr/script/lines/narration-2.js';

describe('rr chill zone intro', () => {
  let res, eps;
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 9);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 9 });
    eps = airSeason(res);
  });

  it('every leg but the finale: Don introduces the Chill Zone before the first check-in', () => {
    for (const [i, ep] of eps.entries()) {
      const leg = res.legs[i];
      const intro = ep.segments.findIndex(s => s.kind === 'don-narrate' && s.ending === 'chill');
      if (leg.kind === 'final') { expect(intro, `leg ${ep.n}`).toBe(-1); continue; }
      expect(intro, `leg ${ep.n}`).toBeGreaterThanOrEqual(0);
      const first = ep.segments.findIndex(s => s.kind === 'don-place' || s.kind === 'mat-montage');
      if (first >= 0) expect(intro, `leg ${ep.n}`).toBeLessThan(first);
      expect(ep.segments[intro].lines?.length, `leg ${ep.n}`).toBeGreaterThan(0);
    }
  });

  it("in the place's own words when it has some", () => {
    const own = new Map();
    for (const e of NARR2['don-narrate.chill']) if (e.when?.place) (own.get(e.when.place) || own.set(e.when.place, []).get(e.when.place)).push(e.id);
    for (const [i, ep] of eps.entries()) {
      const leg = res.legs[i];
      if (leg.kind === 'final' || !own.has(leg.place)) continue;
      const seg = ep.segments.find(s => s.kind === 'don-narrate' && s.ending === 'chill');
      const used = String(seg.lineId || '').split(',');
      expect(used.some(id => own.get(leg.place).includes(id)), `leg ${ep.n} ${leg.place}: ${seg.lineId}`).toBe(true);
    }
  });
});
