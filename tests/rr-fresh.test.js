// The Ridonculous Race: the first hour of the race is the first hour (read loop, season 3). Nobody has
// slept twenty minutes "since the start", thanked a partner for putting up with them "today", or fallen
// behind before a single task.
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { NOT_FRESH, FRESH_MINUTES } from '../js/rr/talk.js';
import { factsFor } from '../js/rr/script/facts.js';
import { rolesOf } from '../js/rr/script/roles.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr fresh start', () => {
  let st;
  beforeAll(() => {
    const { cast, teams } = raceCast(18, 3);
    setPlayers(cast);
    st = playRaceSeason({ teams, seed: 3 }).state;
  });
  const fresh = () => st.scenes.filter(s => s.leg === 1 && (s.data.t ?? 0) < FRESH_MINUTES);

  it('moments that need time behind them wait', () => {
    expect(NOT_FRESH.has('bond-moment') && NOT_FRESH.has('small-talk') && NOT_FRESH.has('manage-partner')).toBe(true);
    expect(fresh().length).toBeGreaterThan(5);
    for (const s of fresh()) expect(NOT_FRESH.has(s.kind), `${s.kind} at minute ${s.data.t}`).toBe(false);
  });

  it('nobody is behind or ahead before the race has started', () => {
    for (const s of fresh()) {
      expect(s.data.snap?.fresh, s.kind).toBe(true);
      const f = factsFor(s, rolesOf(s, st), st);
      expect(f.fresh && !f.behind && !f.ahead, s.kind).toBe(true);
    }
  });
});
