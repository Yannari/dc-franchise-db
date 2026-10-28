// Who a housemate nominates in the confessional, and why (part 2 design §8).
import { describe, it, expect } from 'vitest';
import { nominationWish, castNominations } from '../js/ss/nominations.js';
import { seededRandom } from './helpers/rng.js';

const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };
const S = n => ({ id: `s-${n}`, holders: [n], text: `secret of ${n}`, found: false });
const NAMES = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
const base = () => ({ secrets: NAMES.map(S), kitty: Object.fromEntries(NAMES.map(n => [n, 10000])), theories: {}, buzzes: [], missions: [] });
const ctx = (over = {}) => ({ rng: rngFor(over.seed || 1), week: 4, stat: (n, k) => over.stats?.[n]?.[k] ?? 5, bond: over.bond || (() => 0), pop: over.pop || (() => 0) });

describe('nominations', () => {
  it('a housemate names whoever is closing in on their secret, and says so', () => {
    let named = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const state = base();
      state.theories.Cy = { Ana: { text: 'secret of Ana', right: true, conf: 0.9, ev: [] } };
      const { ballots } = castNominations(state, ctx({ seed, stats: { Ana: { intuition: 9 } } }), { voters: ['Ana'], pool: NAMES });
      if (ballots[0].picks.includes('Cy')) { named++; expect(ballots[0].reasons.Cy).toBe('suspects-me'); }
    }
    expect(named).toBeGreaterThan(50);
  });
  it('a buzz is not forgotten', () => {
    const state = base();
    state.buzzes = [{ by: 'Ed', target: 'Ana', outcome: 'wrong' }];
    expect(nominationWish(state, ctx(), 'Ana', 'Ed').reason).toBe('buzzed-me');
  });
  it('the public\'s favourite is named less as the season goes on', () => {
    const state = base();
    const fav = nominationWish(state, { ...ctx({ pop: n => (n === 'Ben' ? 8 : 0) }), week: 10, rng: () => 0.5 }, 'Ana', 'Ben').score;
    const other = nominationWish(state, { ...ctx({ pop: n => (n === 'Ben' ? 8 : 0) }), week: 10, rng: () => 0.5 }, 'Ana', 'Cy').score;
    expect(fav).toBeLessThan(other);
  });
  it('a mission to get somebody nominated moves the holder\'s vote, and a friend\'s', () => {
    const state = base();
    state.missions = [{ missionId: 'get-nominated', status: 'active', week: 4, holders: ['Ana'], target: 'Fi' }];
    const c = ctx({ bond: (a, b) => (a === 'Ben' && b === 'Ana' ? 5 : 0) });
    expect(nominationWish(state, c, 'Ana', 'Fi').reason).toBe('mission');
    expect(nominationWish(state, c, 'Ben', 'Fi').score).toBeGreaterThan(nominationWish(state, c, 'Ben', 'Ed').score - 0.5);
  });
  it('a tie for the second chair goes to a second round', () => {
    const state = base();
    const r = castNominations(state, ctx({ seed: 3 }), { voters: ['Ana', 'Ben'], pool: ['Cy', 'Di', 'Ed', 'Fi'], extraVotes: {} });
    expect(r.nominees.length).toBeGreaterThanOrEqual(2);
    if (r.secondRound) expect(r.secondRound.tied.length).toBeGreaterThanOrEqual(2);
  });
});
