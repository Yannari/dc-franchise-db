// The Voice's weekly game (part 2 design §8, §15): classic prizes, or a Master of the House.
import { describe, it, expect } from 'vitest';
import { settleWeeklyGame, resolveWeekly, CLASSIC_PRIZES } from '../js/ss/games.js';
import { openKitties, actualTotal, expectedTotal } from '../js/ss/kitty.js';
import { seededRandom } from './helpers/rng.js';

const S = (holders, text) => ({ id: `s-${holders.join('-')}`, holders, text, kind: 'personal', secretKind: 'past', clues: ['a key', 'an old photo', 'the word "before"'], tells: ['x'], difficulty: 0.5, found: false });
function fresh(weekly = 'classic') {
  const names = ['Ana', 'Ben', 'Cy', 'Di', 'Ed'];
  const state = { weekly, secrets: names.map(n => S([n], `secret of ${n}`)) };
  openKitties(state, names);
  return { state, names };
}
const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };

describe("the Voice's game", () => {
  it('is classic or revival, as picked, or drawn', () => {
    expect(resolveWeekly('classic')).toBe('classic');
    expect(resolveWeekly('revival')).toBe('revival');
    expect(['classic', 'revival']).toContain(resolveWeekly('random', () => 0.9));
  });
  it('in a classic season pays every kind of prize, and immunity only some weeks', () => {
    const seen = {};
    const r = rngFor(5);
    for (let i = 0; i < 300; i++) {
      const { state, names } = fresh();
      const g = settleWeeklyGame(state, { rng: r, week: 2, stat: () => 5 }, { winner: 'Ana', house: names });
      seen[g.act.prize] = (seen[g.act.prize] || 0) + 1;
      expect(g.immune.length > 0).toBe(g.act.prize === 'immunity');
      expect(actualTotal(state)).toBe(expectedTotal(state));
    }
    for (const p of CLASSIC_PRIZES.map(x => x.id)) expect(seen[p], p).toBeGreaterThan(20);
    expect(seen.immunity).toBeLessThan(150);
  });
  it('a clue prize puts a clue on the table about somebody else', () => {
    const r = rngFor(9);
    for (let i = 0; i < 100; i++) {
      const { state, names } = fresh();
      const g = settleWeeklyGame(state, { rng: r, week: 2, stat: () => 5 }, { winner: 'Ana', house: names });
      if (g.act.prize === 'clue') { expect(g.clueAct?.type).toBe('ss-clue'); expect(g.clueAct.holders).not.toContain('Ana'); }
    }
  });
  it('in a revival season makes a Master of the House: immune, and one direct nomination', () => {
    const { state, names } = fresh('revival');
    state.theories = { Ben: { Ana: { text: 'x', right: true, conf: 0.9, ev: [] } } };
    const g = settleWeeklyGame(state, { rng: rngFor(1), week: 2, stat: () => 5, bond: () => 0 }, { winner: 'Ana', house: names });
    expect(g.immune).toEqual(['Ana']);
    expect(g.masterPick).toBe('Ben');
  });
});
