// A big moment the race plays itself (a partner blow-up, the lead changing hands) gets a confessional like any other.
// Read 2026-10-19: leg 9 of a season (12 teams, seed 8) had two blow-ups and aired no confessional at all, because only
// the scenes the talk picker chose were ever followed by an interview.
import { describe, it, expect } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr interviews', () => {
  it('a blow-up between partners can be talked about in the confessional', () => {
    let about = 0, snaps = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const st = playRaceSeason({ teams, seed }).state;
      const ids = new Set(st.scenes.filter(s => s.kind === 'snap').map(s => s.id));
      snaps += ids.size;
      about += st.scenes.filter(s => s.kind.startsWith('int-') && ids.has(s.data?.about)).length;
    }
    expect(snaps).toBeGreaterThan(5);
    expect(about).toBeGreaterThan(0);
  });

  it('every leg airs a confessional: a moment someone talks about to camera is worth its airtime', async () => {
    const { airSeason } = await import('../js/rr/episode.js');
    for (const [n, seed] of [[12, 8], [12, 1], [12, 2], [10, 3], [8, 4], [12, 5]]) {
      const { cast, teams } = raceCast(n, seed);
      setPlayers(cast);
      const eps = airSeason(playRaceSeason({ teams, seed }));
      for (const ep of eps) expect(ep.segments.filter(s => s.lines?.some(l => l.kind === 'conf')).length, `${n}/${seed} leg ${ep.n}`).toBeGreaterThan(0);
    }
  });
});
