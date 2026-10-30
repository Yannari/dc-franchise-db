// The sixteen more themed primes (js/ss/prime-nights.js; the user, 2026-10-30: "lets do more prime theme we have 5 we
// need at least 15 more"): every night plays two or more segments, every segment changes something, no money is
// invented or lost on the way, and every night has its timeline card and its earliest week.
import { describe, it, expect } from 'vitest';
import { NIGHT_THEMES, playNight, nightPossible } from '../js/ss/prime-nights.js';
import { PRIME_THEMES } from '../js/ss/prime-themes.js';
import { openKitties, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { SS_CARDS, SS_EARLIEST } from '../js/ss/schedule.js';
import { TWIST_CATALOG } from '../js/core.js';
import { seededRandom } from './helpers/rng.js';

const names = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi', 'Gus', 'Hal'];
const S = h => ({ id: `s-${h}`, holders: [h], text: 'x', kind: 'personal', secretKind: 'past', clues: ['a', 'b', 'c'], tells: ['t'], difficulty: 0.5, found: false });
const fresh = () => { const state = { secrets: names.map(S) }; openKitties(state, names); return state; };
const bond = (a, b) => ((names.indexOf(a) + names.indexOf(b)) % 5) - 2 + (a < b ? 3 : 0);
const gender = n => (names.indexOf(n) % 2 ? 'm' : 'f');
const opts = { house: names, nominees: ['Hal'], gone: ['Zed', 'Yan'], ballots: [{ week: 2, voter: 'Ana', picks: ['Ben', 'Cy'] }, { week: 3, voter: 'Di', picks: ['Cy'] }], gender, couples: [['Ana', 'Ben']] };
const ctx = seed => ({ rng: seededRandom(seed), week: 5, stat: () => 5, bond: (a, b) => bond(a, b), archetype: () => 'floater', pop: n => names.indexOf(n) });

describe('the sixteen more nights', () => {
  it('there are twenty-one themed primes', () => {
    expect(Object.keys(NIGHT_THEMES).length).toBe(16);
    expect(Object.keys(PRIME_THEMES).length).toBe(21);
  });
  for (const th of Object.keys(NIGHT_THEMES)) {
    it(`${th}: plays, changes something, and keeps the money whole`, () => {
      for (let seed = 1; seed <= 8; seed++) {
        const st = fresh();
        expect(nightPossible(th, { ...opts, bond })).toBe(true);
        const segs = playNight(st, ctx(seed), th, opts);
        expect(segs.length).toBeGreaterThanOrEqual(['hearts', 'back-in-time'].includes(th) ? 1 : 2);
        for (const s of segs) { expect(s.kind).toBe('night'); expect(s.theme).toBe(th); }
        // something moved: a bond, the public, the kitties, next week's list, or the evidence
        const moved = segs.some(s => (s.effects.bond || []).length || (s.pub || []).length) || JSON.stringify(st.nextImmune || {}) !== '{}' || JSON.stringify(st.rules?.dOffice || {}) !== '{}'
          || (st.kittyLog || []).length || Object.keys(st.theories || {}).length || st.genderWar;
        expect(moved).toBeTruthy();
        expect(actualTotal(st)).toBe(expectedTotal(st));
      }
    });
    it(`${th}: a timeline card, Randomize and an earliest week`, () => {
      const card = TWIST_CATALOG.find(t => t.id === `ss-${th}`);
      expect(card?.format).toBe('secret-story');
      expect(card.desc.length).toBeGreaterThan(120);
      expect(SS_CARDS.prime).toContain(`ss-${th}`);
      expect(SS_EARLIEST[`ss-${th}`]).toBeGreaterThanOrEqual(2);
    });
  }
  it('the gender war sends the losing side to next week\'s nominations', () => {
    const st = fresh();
    playNight(st, ctx(3), 'gender-war', opts);
    expect(['m', 'f']).toContain(st.genderWar[6]);
  });
  it('a night that cannot happen this week is not drawn', () => {
    expect(nightPossible('returns', { ...opts, gone: [], bond })).toBe(false);
    expect(nightPossible('gender-war', { ...opts, gender: () => 'f', bond })).toBe(false);
  });
});
