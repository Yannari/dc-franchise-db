// The Ridonculous Race: every part of the catalogue a season should reach, reaches it
// (the first spec audit, 2026-10-18: 55 kinds never fired; manual §11.5, the system that
// runs and reaches no screen).
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const REACH = [
  'size-up', 'console', 'leader-shift', 'int-exit', 'int-backstory',
  'don-opener', 'don-demo', 'don-rule', 'don-ruling',
  'airport-crowd', 'watching-together', 'mat-crowd',
  'judge-no', 'judge-yes', 'driver', 'arrival-awe', 'identity-moment', 'injury', 'gross-out', 'phobia', 'surrender', 'beg',
  // spending-fight needs a fare a team can barely pay: with four places only the desert charges (sub-project 3)
  'homesick', 'exhaustion', 'confession-attempt', 'near-kiss',
];

describe('rr reach', () => {
  let kinds, switches;
  beforeAll(() => {
    kinds = {}; switches = 0;
    for (let s = 1; s <= 8; s++) {
      const { cast, teams } = raceCast(12, s);
      setPlayers(cast);
      const r = playRaceSeason({ teams, seed: s, options: { twists: { 3: 'boomerang' } } });
      for (const sc of r.state.scenes) kinds[sc.kind] = (kinds[sc.kind] || 0) + 1;
      switches += (r.state.switches || []).length;
    }
  });

  it('every reachable kind fires in eight seasons (the rare ones within forty-eight)', () => {
    // a near-kiss comes about once in eight seasons (3 in 24, measured 2026-10-18): eight seasons missed it a third
    // of the time, which measured the sample, not the reach (§11.5)
    const RARE = ['near-kiss'];
    const more = {};
    // remeasured 2026-10-19: 7 seasons in 60 (one in nine), and seeds 1-24 happened to have none, so 24 seasons missed
    // it about one run in twenty. Search on to 48, stopping at the first (a miss is now about one run in four hundred).
    for (let s = 9; s <= 48 && RARE.some(k => !kinds[k] && !more[k]); s++) {
      const { cast, teams } = raceCast(12, s);
      setPlayers(cast);
      for (const sc of playRaceSeason({ teams, seed: s }).state.scenes) if (RARE.includes(sc.kind)) more[sc.kind] = 1;
    }
    const missing = REACH.filter(k => !kinds[k] && !more[k]);
    expect(missing).toEqual([]);
  }, 180000);

  it('teams sometimes switch sides of an Either/Or', () => {
    expect(switches).toBeGreaterThan(0);
  });
});
