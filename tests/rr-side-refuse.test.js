// A team never chooses a side its identity refuses (2026-10-20: the Vegans sat down to Geyser Island's feast of
// fermented shark and sheep's head). A side lists `refuse: { identities }`; a team of one of them takes the other side,
// and never switches onto it.
import { describe, it, expect } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { PLACES } from '../js/rr/places.js';

describe('rr: a side a team refuses', () => {
  it('keeps the Vegans off the feast', () => {
    const feast = PLACES['geyser-island'].stretches.find(s => s.id === 'feast-fossil').sides.find(s => s.id === 'feast');
    expect(feast.refuse?.identities).toContain('vegans');
    let vegans = 0;
    for (let seed = 41; seed <= 52; seed++) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed, options: { pins: { 2: 'geyser-island' } } });
      for (const r of res.state.taskLog || []) {
        if (r.stretch !== 'feast-fossil' || res.state.teams[r.team]?.identity !== 'vegans') continue;
        vegans++;
        expect(r.side, `seed ${seed}`).toBe('fossil');
      }
    }
    expect(vegans).toBeGreaterThan(0);
  }, 600000);
});
