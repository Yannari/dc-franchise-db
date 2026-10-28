// The secret hunt (part 2 design §4–§6): theories, clues, tells, talk, the buzz,
// and a kitty that never invents money.
import { describe, it, expect } from 'vitest';
import { openKitties, transfer, mint, burn, takeAll, balance, expectedTotal, actualTotal, KITTY_START, BUZZ_STAKE } from '../js/ss/kitty.js';
import { addEvidence, showClue, huntDay, runBuzzes, resolveBuzz, theoryOf, buzzBar, secretOf } from '../js/ss/hunt.js';
import { seededRandom } from './helpers/rng.js';

const S = (holders, text, extra = {}) => ({ id: `s-${holders.join('-')}`, holders, text, kind: 'personal', secretKind: 'survived',
  clues: ['a seat belt buckle', 'a toy aeroplane', 'the word "altitude"'], tells: ['goes quiet about flying'], difficulty: 0.5, found: false, ...extra });

function fresh() {
  const names = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
  const state = { secrets: [S(['Ana'], 'I survived a plane crash'), S(['Ben'], 'I was buried by an avalanche for four hours'),
    S(['Cy', 'Di'], 'We are twins', { secretKind: 'family' }), S(['Ed'], 'I was lost in the desert for three days'), S(['Fi'], 'I was struck by lightning twice')] };
  openKitties(state, names);
  return { state, names };
}
const ctx = (over = {}, seed = 1) => ({ rng: seededRandom(seed), week: 2, stat: (n, k) => over[n]?.[k] ?? 5, bond: () => 0 });

describe('the kitty', () => {
  it('opens at $10,000 and never invents money', () => {
    const { state } = fresh();
    expect(balance(state, 'Ana')).toBe(KITTY_START);
    transfer(state, 'Ana', 'Ben', 3000, 'test');
    mint(state, 'Cy', 2000, 'mission');
    burn(state, 'Di', 500, 'punishment');
    takeAll(state, 'Ed', 'Fi', 'found');
    expect(actualTotal(state)).toBe(expectedTotal(state));
    expect(balance(state, 'Ed')).toBe(0);
  });
  it('cannot take more than somebody has', () => {
    const { state } = fresh();
    expect(transfer(state, 'Ana', 'Ben', 99999, 'test')).toBe(KITTY_START);
    expect(burn(state, 'Ana', 1, 'x')).toBe(0);
  });
});

describe('theories', () => {
  it('a sharp reader on a loud clue ends up nearer the truth than a dull one', () => {
    let sharpRight = 0, dullRight = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const a = fresh(); const b = fresh();
      for (let i = 0; i < 3; i++) {
        addEvidence(a.state, ctx({ Ben: { mental: 9, intuition: 9 } }, seed * 7 + i), 'Ben', 'Ana', { strength: 0.3 });
        addEvidence(b.state, ctx({ Ben: { mental: 2, intuition: 2 } }, seed * 7 + i), 'Ben', 'Ana', { strength: 0.3 });
      }
      if (theoryOf(a.state, 'Ben', 'Ana').right) sharpRight++;
      if (theoryOf(b.state, 'Ben', 'Ana').right) dullRight++;
    }
    expect(sharpRight).toBeGreaterThan(dullRight + 30);
  });
  it('a wrong theory is a near miss of the same kind, never invented', () => {
    const { state } = fresh();
    for (let seed = 1; seed < 60; seed++) addEvidence(state, ctx({}, seed), 'Ben', 'Ana', { strength: 0.05 });
    const th = theoryOf(state, 'Ben', 'Ana');
    expect(typeof th.text).toBe('string');
    expect(th.conf).toBeGreaterThan(0);
  });
  it('nobody theorises about their own secret or their partner\'s', () => {
    const { state } = fresh();
    expect(addEvidence(state, ctx(), 'Cy', 'Di', { strength: 0.5 })).toBeNull();
    expect(addEvidence(state, ctx(), 'Ana', 'Ana', { strength: 0.5 })).toBeNull();
  });
  it('a fake clue pulls soft readers toward the fake', () => {
    let fooled = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const { state, names } = fresh();
      showClue(state, ctx({ Ben: { mental: 2, intuition: 2 } }, seed), { holder: 'Ana', house: names, fake: true, fakeText: 'I am a pilot' });
      if (theoryOf(state, 'Ben', 'Ana')?.text === 'I am a pilot') fooled++;
    }
    expect(fooled).toBeGreaterThan(50);
  });
});

describe('clues on the table', () => {
  it('show every housemate but the holders, and never repeat a clue', () => {
    const { state, names } = fresh();
    const a1 = showClue(state, ctx({}, 3), { holder: 'Cy', house: names });
    const a2 = showClue(state, ctx({}, 4), { holder: 'Cy', house: names });
    expect(a1.type).toBe('ss-clue');
    expect(a1.clue).not.toBe(a2.clue);
    expect(theoryOf(state, 'Di', 'Cy')).toBeNull();
    expect(theoryOf(state, 'Ana', 'Cy')).toBeTruthy();
  });
});

describe('a day of watching', () => {
  it('perceptive housemates notice tells more often than oblivious ones', () => {
    let keen = 0, dull = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const k = fresh(); const d = fresh();
      keen += huntDay(k.state, ctx({ Ben: { intuition: 10 } }, seed), { house: k.names }).filter(m => m.kind === 'tell' && m.who === 'Ben').length;
      dull += huntDay(d.state, ctx({ Ben: { intuition: 1 } }, seed), { house: d.names }).filter(m => m.kind === 'tell' && m.who === 'Ben').length;
    }
    expect(keen).toBeGreaterThan(dull * 2);
  });
});

describe('the buzz', () => {
  function primed(right) {
    const { state, names } = fresh();
    state.theories = { Ben: { Ana: { text: right ? 'I survived a plane crash' : 'I am a pilot', right, conf: 0.95, ev: [] } } };
    return { state, names };
  }
  it('right: takes the whole kitty and the secret is out', () => {
    const { state } = primed(true);
    const act = resolveBuzz(state, ctx({ Ben: { intuition: 9, mental: 9 }, Ana: { strategic: 2, temperament: 2, social: 2 } }, 5), 'Ben', 'Ana', { bar: 0.6 });
    expect(act.outcome).toBe('right');
    expect(balance(state, 'Ben')).toBe(KITTY_START * 2);
    expect(balance(state, 'Ana')).toBe(0);
    expect(secretOf(state, 'Ana').found).toBe(true);
    expect(actualTotal(state)).toBe(expectedTotal(state));
  });
  it('wrong: the stake goes to the target, the secret stays hidden', () => {
    const { state } = primed(false);
    state.theories.Ben.Ana.conf = 0.98;
    const act = resolveBuzz(state, ctx({ Ben: { intuition: 1, mental: 1 } }, 6), 'Ben', 'Ana', { bar: 0.6 });
    expect(act.outcome).toBe('wrong');
    expect(balance(state, 'Ana')).toBe(KITTY_START + BUZZ_STAKE);
    expect(secretOf(state, 'Ana').found).toBe(false);
  });
  it('a buzzer talked out of it in the confrontation withdraws for free', () => {
    const { state } = primed(false);
    state.theories.Ben.Ana.conf = 0.72;
    const act = resolveBuzz(state, ctx({ Ben: { intuition: 9, mental: 9 } }, 7), 'Ben', 'Ana', { bar: 0.8 });
    expect(act.outcome).toBe('withdrawn');
    expect(balance(state, 'Ben')).toBe(KITTY_START);
  });
  it('nobody buzzes without the stake, unless the buzz is free', () => {
    const { state, names } = primed(true);
    state.kitty.Ben = 4999;
    expect(runBuzzes(state, ctx({ Ben: { boldness: 10 } }, 8), { house: names })).toEqual([]);
    state.freeBuzz.Ben = 1;
    const acts = runBuzzes(state, ctx({ Ben: { boldness: 10 } }, 8), { house: names });
    expect(acts.length).toBe(1);
    expect(acts[0].free).toBe(true);
  });
  it('the bold buzz on less, and everybody buzzes on less near the end', () => {
    const { state } = fresh();
    const c = ctx({ Bold: { boldness: 10 }, Shy: { boldness: 1 } });
    expect(buzzBar(state, c, 'Bold')).toBeLessThan(buzzBar(state, c, 'Shy'));
    expect(buzzBar(state, c, 'Shy', { weeksLeft: 1 })).toBeLessThan(buzzBar(state, c, 'Shy', { weeksLeft: 8 }));
  });
});
