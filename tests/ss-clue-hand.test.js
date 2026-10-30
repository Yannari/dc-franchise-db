// The clue in the confessional (js/ss/hunt.js handClue; the user, 2026-10-29: "they get their clue in the confessional
// and get out of it with it", "its the choice of the one getting the clue to share it with some people all of them
// 2/3 1 of them or none"): one housemate gets it, chooses who else sees it, and only they gain the evidence.
import { describe, it, expect } from 'vitest';
import { openKitties } from '../js/ss/kitty.js';
import { handClue, theoryOf } from '../js/ss/hunt.js';
import { seededRandom } from './helpers/rng.js';

const S = (holders, text) => ({ id: `s-${holders.join('-')}`, holders, text, kind: 'personal', secretKind: 'survived',
  clues: ['a seat belt buckle', 'a toy aeroplane', 'the word "altitude"'], tells: ['goes quiet about flying'], difficulty: 0.5, found: false });
const names = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
function fresh() {
  const state = { secrets: [S(['Ana'], 'I survived a plane crash'), S(['Ben'], 'I was buried by an avalanche')] };
  openKitties(state, names);
  return state;
}
// Cy is close to Di and Ed, cold with the rest
const bond = (a, b) => ((a === 'Cy' && (b === 'Di' || b === 'Ed')) || (b === 'Cy' && (a === 'Di' || a === 'Ed')) ? 4 : -1);
const ctx = (over = {}, seed = 1) => ({ rng: seededRandom(seed), week: 2, stat: (n, k) => over[n]?.[k] ?? 5, bond });

describe('the clue handed out in the confessional', () => {
  it('goes to the one named, who is never its holder, and only the people shown it learn from it', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const state = fresh();
      const act = handClue(state, ctx({}, seed), { holder: 'Ana', house: names, to: 'Cy' });
      expect(act.got).toBe('Cy');
      expect(['all', 'few', 'one', 'none']).toContain(act.share);
      const saw = new Set(['Cy', ...act.shared]);
      for (const n of names.filter(x => x !== 'Ana')) {
        const th = theoryOf(state, n, 'Ana');
        if (!saw.has(n)) expect(th?.conf || 0).toBe(0);
      }
      if (act.share === 'one') expect(act.shared).toHaveLength(1);
      if (act.share === 'few') expect(act.shared.length).toBeGreaterThanOrEqual(2);
      if (act.share === 'none') expect(act.shared).toHaveLength(0);
      // a few or one: only friends, and the bond grows
      if (act.share === 'few' || act.share === 'one') {
        for (const n of act.shared) expect(['Di', 'Ed']).toContain(n);
        expect(act.effects.bond.length).toBe(act.shared.length);
      }
    }
  });
  it('the strategic keep it more often than the sociable and loyal', () => {
    let keepSharp = 0, keepWarm = 0;
    // (one stream for the whole run: a fresh seed per draw reads only each seed's first number)
    const sharp = { ...ctx({ Cy: { strategic: 9, loyalty: 2, social: 3 } }, 7) }, warm = { ...ctx({ Cy: { strategic: 2, loyalty: 9, social: 9 } }, 11) };
    for (let i = 0; i < 400; i++) {
      if (handClue(fresh(), sharp, { holder: 'Ana', house: names, to: 'Cy' }).share === 'none') keepSharp++;
      if (handClue(fresh(), warm, { holder: 'Ana', house: names, to: 'Cy' }).share === 'none') keepWarm++;
    }
    expect(keepSharp).toBeGreaterThan(keepWarm * 2);
    expect(keepWarm).toBeGreaterThan(0);
  });
});
