// The dilemmas about people (js/ss/dilemmas.js; the user, 2026-10-30: "we need real dilemma that break relationship
// or form one not just about money"): each one moves a relationship, and its choice is the chooser's character.
import { describe, it, expect } from 'vitest';
import { DILEMMAS, runDilemma } from '../js/ss/dilemmas.js';
import { openKitties } from '../js/ss/kitty.js';
import { seededRandom } from './helpers/rng.js';

const names = ['Ana', 'Ben', 'Cy', 'Di', 'Ed'];
const S = h => ({ id: `s-${h}`, holders: [h], text: 'x', kind: 'personal', secretKind: 'past', clues: ['a'], tells: ['t'], difficulty: 0.5, found: false });
const fresh = () => { const state = { secrets: names.map(S) }; openKitties(state, names); return state; };
// Ana: Ben and Cy are her friends, Ed her rival
const BOND = { 'Ana|Ben': 6, 'Ana|Cy': 4, 'Ana|Di': 0, 'Ana|Ed': -5 };
const bond = (a, b) => BOND[`${a}|${b}`] ?? BOND[`${b}|${a}`] ?? 0;
const only = id => DILEMMAS.map(d => d.id).filter(x => x !== id);
const ctx = (seed, over = {}) => ({ rng: seededRandom(seed), week: 4, bond, stat: (n, k) => over[k] ?? 5, archetype: () => over.arch || 'floater', pop: () => 0 });

describe('the dilemmas about people', () => {
  for (const id of ['betray-friend', 'take-their-place', 'the-recording', 'choose-a-friend']) {
    it(`${id}: whatever is chosen, a relationship moves`, () => {
      for (let s = 1; s <= 20; s++) {
        const d = runDilemma(fresh(), ctx(s), { to: 'Ana', house: names, exclude: only(id) });
        expect(d?.dilemmaId).toBe(id);
        expect(d.effects.bond.length).toBeGreaterThan(0);
        expect(d.others.length).toBeGreaterThan(0);
      }
    });
  }
  it('a betrayal puts the friend up and breaks the friendship; the loyal and the nice rarely do it', () => {
    let betrayedNice = 0, betrayedSharp = 0;
    for (let s = 1; s <= 80; s++) {
      const st = fresh();
      const sharp = runDilemma(st, ctx(s, { strategic: 9, loyalty: 2, arch: 'schemer' }), { to: 'Ana', house: names, exclude: only('betray-friend') });
      if (sharp.chose.startsWith('put ')) {
        betrayedSharp++;
        expect(st.rules.dOffice[5]).toContain('Ben');
        expect(sharp.effects.bond).toContainEqual(['Ben', 'Ana', -4]);
      }
      const nice = runDilemma(fresh(), ctx(s, { strategic: 3, loyalty: 9, arch: 'hero' }), { to: 'Ana', house: names, exclude: only('betray-friend') });
      if (nice.chose.startsWith('put ')) betrayedNice++;
    }
    expect(betrayedSharp).toBeGreaterThan(betrayedNice);
  });
});
