// tests/coach-fallout.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addBond, getBond } from '../js/bonds.js';
import { addCoach } from '../js/coaches.js';
import { coachFallout } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

const FORBIDDEN = ['evicted', 'nominated', 'houseguest', 'hoh', 'veto'];
function assertNoWrongShowWords(out) {
  const text = out.map(e => e.text).join(' ').toLowerCase();
  for (const wrong of FORBIDDEN) expect(text).not.toContain(wrong);
}
function assertWellFormed(out) {
  for (const e of out) {
    expect(Array.isArray(e.players), 'a camp event without players is not one').toBe(true);
    expect(e.players.length).toBeGreaterThan(0);
    expect(e.badgeText, 'every camp event needs an explicit badge').toBeTruthy();
    expect(e.badgeClass).toBeTruthy();
  }
}

// A roll() that always lands inside every "fires if roll() < X" / clears every
// "skip if roll() >= X" gate in coachFallout, and always picks pool[0] inside
// pick(). Every probabilistic branch below is reached with this alone —
// whether it actually fires still depends on the branch's structural
// precondition (a defender who exists, two coaches on the tribe, a negative
// gain, etc.), which each fixture below supplies.
const alwaysRoll = () => 0;

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie', archetype: 'goat', stats: stats() },
    { name: 'Finn', archetype: 'villain', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {} });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

const block = {
  sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 }],
  passedOver: [{ coach: 'Julia', contestant: 'Finn' }],
};

describe('the fallout', () => {
  it('produces events for both halves', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    expect(out.length).toBeGreaterThan(0);
  });

  it('gives every event the players it is about', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    assertWellFormed(out);
  });

  it('never prints another show’s vocabulary', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    assertNoWrongShowWords(out);
  });
});

describe('coachBreakthrough — guaranteed on a positive session', () => {
  it('fires, is well-formed, and moves the bond + popularity', () => {
    const before = getBond('Julia', 'Evie');
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block, alwaysRoll);
    const ev = out.find(e => e.type === 'coachBreakthrough');
    expect(ev, 'breakthrough must fire on a positive-gain session').toBeTruthy();
    expect(ev.players).toEqual(['Julia', 'Evie']);
    expect(ev.badgeText).toBeTruthy();
    expect(ev.badgeClass).toBeTruthy();
    expect(getBond('Julia', 'Evie')).toBeGreaterThan(before);
    expect(gs.popularity?.['Evie']).toBeGreaterThan(0);
    assertNoWrongShowWords(out);
  });
});

describe('coachPassedOverNotices — guaranteed per passed-over entry', () => {
  it('fires, is well-formed, and costs a bond — escalating with the streak', () => {
    const before = getBond('Julia', 'Finn');
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block, alwaysRoll);
    const ev = out.find(e => e.type === 'coachPassedOverNotices');
    expect(ev).toBeTruthy();
    expect(ev.players).toEqual(['Finn', 'Julia']);
    expect(ev.badgeText).toBeTruthy();
    expect(ev.badgeClass).toBeTruthy();
    expect(getBond('Julia', 'Finn')).toBeLessThan(before);
    assertNoWrongShowWords(out);
  });

  it('escalates the badge once the streak hits three episodes running', () => {
    // Simulate Finn being passed over three episodes in a row by calling
    // coachFallout three times with a fresh session/passedOver split each
    // time but the same tribe, so the streak counter on gs persists.
    const onlyPassedOver = { sessions: [], passedOver: [{ coach: 'Julia', contestant: 'Finn' }] };
    coachFallout({ num: 2 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, onlyPassedOver, alwaysRoll);
    coachFallout({ num: 3 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, onlyPassedOver, alwaysRoll);
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, onlyPassedOver, alwaysRoll);
    const ev = out.find(e => e.type === 'coachPassedOverNotices');
    expect(ev.badgeText).toBe('PATTERN NOTICED');
    assertNoWrongShowWords(out);
  });
});

describe('coachDefended — a protégé defends their coach unprompted', () => {
  it('fires when a tribemate already trusts the coach, and is well-formed', () => {
    setPlayers([
      { name: 'Julia', archetype: 'schemer', stats: stats() },
      { name: 'Evie', archetype: 'goat', stats: stats() },
      { name: 'Finn', archetype: 'villain', stats: stats() },
      { name: 'Theo', archetype: 'hero', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie', 'Finn', 'Theo'], coaches: [], coachTraining: {}, bonds: {} });
    addCoach({ name: 'Julia', tribe: 'Red' });
    addBond('Julia', 'Theo', 3); // Theo already trusts Julia going in — short of the early-season depth ceiling.

    const tribe = { tribeName: 'Red', members: ['Evie', 'Finn', 'Theo'] };
    const localBlock = {
      sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 }],
      passedOver: [{ coach: 'Julia', contestant: 'Finn' }],
    };
    const before = getBond('Julia', 'Theo');
    const out = coachFallout({ num: 4 }, tribe, localBlock, alwaysRoll);
    const ev = out.find(e => e.type === 'coachDefended');
    expect(ev, 'a tribemate with a strong bond to the coach must defend them').toBeTruthy();
    expect(ev.players[0]).toBe('Theo');
    expect(ev.players).toContain('Julia');
    expect(ev.badgeText).toBeTruthy();
    expect(ev.badgeClass).toBeTruthy();
    expect(getBond('Julia', 'Theo')).toBeGreaterThan(before);
    assertWellFormed(out);
    assertNoWrongShowWords(out);
  });
});

describe('coachProtegeBond — two trained protégés compare what they got, and click', () => {
  it('fires when two contestants are trained the same episode, and moves their bond', () => {
    setPlayers([
      { name: 'Julia', archetype: 'schemer', stats: stats() },
      { name: 'Evie', archetype: 'goat', stats: stats() },
      { name: 'Theo', archetype: 'hero', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie', 'Theo'], coaches: [], coachTraining: {}, bonds: {} });
    addCoach({ name: 'Julia', tribe: 'Red' });

    const tribe = { tribeName: 'Red', members: ['Evie', 'Theo'] };
    const localBlock = {
      sessions: [
        { coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 },
        { coach: 'Julia', contestant: 'Theo', stat: 'endurance', gain: 0.5 },
      ],
      passedOver: [],
    };
    const before = getBond('Evie', 'Theo');
    const out = coachFallout({ num: 4 }, tribe, localBlock, alwaysRoll);
    const ev = out.find(e => e.type === 'coachProtegeBond');
    expect(ev).toBeTruthy();
    expect(ev.players).toEqual(['Evie', 'Theo']);
    expect(ev.badgeText).toBeTruthy();
    expect(ev.badgeClass).toBeTruthy();
    expect(getBond('Evie', 'Theo')).toBeGreaterThan(before);
    assertWellFormed(out);
    assertNoWrongShowWords(out);
  });
});

describe('coachCompareNotes — a trained protégé and a passed-over one turn sour', () => {
  it('fires when at least one contestant was trained and another was skipped, and costs a bond', () => {
    const before = getBond('Evie', 'Finn');
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block, alwaysRoll);
    const ev = out.find(e => e.type === 'coachCompareNotes');
    expect(ev).toBeTruthy();
    expect(ev.players).toEqual(['Evie', 'Finn']);
    expect(ev.badgeText).toBeTruthy();
    expect(ev.badgeClass).toBeTruthy();
    expect(getBond('Evie', 'Finn')).toBeLessThan(before);
    assertWellFormed(out);
    assertNoWrongShowWords(out);
  });
});

describe('coachPoachedProtege — caught between two coaches on the same tribe', () => {
  it('fires when a second coach already has a real bond with the trained contestant', () => {
    setPlayers([
      { name: 'Julia', archetype: 'schemer', stats: stats() },
      { name: 'Marco', archetype: 'mastermind', stats: stats() },
      { name: 'Evie', archetype: 'goat', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {}, bonds: {} });
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Marco', tribe: 'Red' });
    addBond('Marco', 'Evie', 2.5); // Marco already has a foothold with Evie.

    const tribe = { tribeName: 'Red', members: ['Evie'] };
    const localBlock = {
      sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 }],
      passedOver: [],
    };
    const beforeOther = getBond('Marco', 'Evie');
    const beforeMine = getBond('Julia', 'Evie');
    const out = coachFallout({ num: 4 }, tribe, localBlock, alwaysRoll);
    const ev = out.find(e => e.type === 'coachPoachedProtege');
    expect(ev, 'two coaches on one tribe with an existing bond must produce the tension').toBeTruthy();
    expect(ev.players).toContain('Evie');
    expect(ev.players).toContain('Julia');
    expect(ev.players).toContain('Marco');
    expect(ev.badgeText).toBeTruthy();
    expect(ev.badgeClass).toBeTruthy();
    expect(getBond('Marco', 'Evie')).toBeLessThan(beforeOther);
    expect(getBond('Julia', 'Evie')).toBeGreaterThan(beforeMine);
    assertWellFormed(out);
    assertNoWrongShowWords(out);
  });
});

describe('coachBadAdvice — a bad session detonates in front of the tribe', () => {
  it('fires on a negative-gain session and costs both popularity and bond', () => {
    const localBlock = {
      sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: -0.6 }],
      passedOver: [],
    };
    const beforeBond = getBond('Julia', 'Evie');
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, localBlock, alwaysRoll);
    const ev = out.find(e => e.type === 'coachBadAdvice');
    expect(ev).toBeTruthy();
    expect(ev.players).toEqual(['Evie', 'Julia']);
    expect(ev.badgeText).toBeTruthy();
    expect(ev.badgeClass).toBeTruthy();
    expect(getBond('Julia', 'Evie')).toBeLessThan(beforeBond);
    expect(gs.popularity?.['Evie']).toBeLessThan(0);
    assertWellFormed(out);
    assertNoWrongShowWords(out);
  });
});

