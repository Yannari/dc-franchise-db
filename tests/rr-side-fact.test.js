// The Ridonculous Race: at an Either/Or, a line knows which side the team took (Stairs or Sky-deck, Lava or Falls), so
// a place can write each side its own lines. The side is recorded on the scene; it has to reach the facts.
import { describe, it, expect } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { factsFor, RR_FACT_KEYS } from '../js/rr/script/facts.js';
import { rolesOf } from '../js/rr/script/roles.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr side fact', () => {
  it('a scene at an Either/Or knows the side the team took', () => {
    expect(RR_FACT_KEYS).toContain('side');
    const { cast, teams } = raceCast(12, 1);
    setPlayers(cast);
    const st = playRaceSeason({ teams, seed: 1 }).state;
    const at = st.scenes.filter(s => s.data?.snap?.side && s.data?.team);
    expect(at.length).toBeGreaterThan(5);
    for (const s of at) expect(factsFor(s, rolesOf(s, st), st).side, `${s.kind} #${s.id}`).toBe(s.data.snap.side);
  });
});
