// The team going home is told so after everybody else has checked in. Read 2026-10-19 (seed 61, leg 1): Don eliminated
// the last team at minute 65, before second place had arrived, because a team caught turning a sign (marked) serves its
// minutes at the mat and the elimination was timed at its finish, not at its check-in.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr elimination order', () => {
  it('in every leg, the team going home hears it after every other team has reached the mat', () => {
    for (const seed of [61, 7, 19]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      airSeason(res).forEach((ep, i) => {
        const segs = ep.segments;
        const places = segs.filter(s => s.kind === 'don-place');
        const elim = segs.findIndex(s => s.kind === 'don-elim');
        // the finale's third team is cut at its midpoint mat, while the other two still race: that one airs mid-leg
        if ((res.legs || res.state.legs)[i]?.kind === 'final') return;
        if (elim < 0 || !places.length) return;
        const lastPlace = segs.lastIndexOf(places.at(-1));
        expect(elim, `seed ${seed} leg ${i + 1}`).toBeGreaterThan(lastPlace);
      });
    }
  });
});
