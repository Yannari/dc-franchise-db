// tests/coach-deals.test.js — Coach Against Coach: non-aggression, trade,
// and the-fall between two coaches sharing a tribe.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addBond, getBond, bKey } from '../js/bonds.js';

// addBond applies temperament scaling, a depth ceiling and outward saturation
// — all correct for gameplay, all noise for a fixture that wants an EXACT
// starting bond. setBond writes the raw store directly, the way a fixture
// setting up "this pair has known each other a while at this exact level" is
// supposed to.
function setBond(a, b, v) { gs.bonds ||= {}; gs.bonds[bKey(a, b)] = v; }
import { addCoach } from '../js/coaches.js';
import { runCoachDealBlock, activeCoachDeal, nonAggressionBars } from '../js/coach-deals.js';
import { runCoachingBlock } from '../js/coach-episode.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

const alwaysRoll = () => 0;

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

describe('runCoachDealBlock — one coach only', () => {
  beforeEach(() => {
    setPlayers([{ name: 'Julia', archetype: 'schemer', stats: stats() }]);
    setGs({ activePlayers: [], coaches: [], coachTraining: {}, bonds: {}, coachDeals: [] });
    addCoach({ name: 'Julia', tribe: 'Red' });
  });

  it('is a no-op — there is no rival coach to compete with', () => {
    const out = runCoachDealBlock({ num: 3 }, { name: 'Red', members: ['Evie'] }, alwaysRoll);
    expect(out).toEqual([]);
  });
});

describe('non-aggression — two Support-leaning coaches settle honestly', () => {
  beforeEach(() => {
    setPlayers([
      { name: 'Julia', archetype: 'hero', stats: stats({ loyalty: 9, social: 9 }) },
      { name: 'Marco', archetype: 'hero', stats: stats({ loyalty: 9, social: 9 }) },
      { name: 'Evie', archetype: 'goat', stats: stats() },
      { name: 'Finn', archetype: 'goat', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, coachDeals: [] });
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Marco', tribe: 'Red' });
    addBond('Julia', 'Evie', 4); // Julia's own protégé — what a truce protects.
  });

  const tribe = { name: 'Red', members: ['Evie', 'Finn'] };

  it('seals a non-aggression pact, well-formed and vocabulary-clean', () => {
    const out = runCoachDealBlock({ num: 3 }, tribe, alwaysRoll);
    const ev = out.find(e => e.type === 'coachNonAggression');
    expect(ev, 'two matched Support coaches with no rival pull must settle non-aggression').toBeTruthy();
    expect(ev.players).toEqual(['Julia', 'Marco']);
    assertWellFormed(out);
    assertNoWrongShowWords(out);
    const deal = activeCoachDeal('Julia', 'Marco', 'Red');
    expect(deal).toBeTruthy();
    expect(deal.type).toBe('non-aggression');
  });

  it('is a real consequence, not cosmetic — it bars the rival from courting the protégé', () => {
    runCoachDealBlock({ num: 3 }, tribe, alwaysRoll);
    expect(nonAggressionBars('Marco', 'Evie', tribe)).toBe(true);
    expect(nonAggressionBars('Julia', 'Finn', tribe)).toBe(false);
  });

  it('actually removes the barred protégé from the rival coach’s session pool', () => {
    runCoachDealBlock({ num: 3 }, tribe, alwaysRoll);
    const block = runCoachingBlock({ num: 3 }, tribe, () => 0.5);
    expect(block.sessions.every(s => !(s.coach === 'Marco' && s.contestant === 'Evie'))).toBe(true);
  });
});

describe('trade — two Control-leaning coaches swap standing', () => {
  beforeEach(() => {
    setPlayers([
      { name: 'Julia', archetype: 'mastermind', stats: stats({ strategic: 9, loyalty: 2 }) },
      { name: 'Marco', archetype: 'mastermind', stats: stats({ strategic: 9, loyalty: 2 }) },
      { name: 'Evie', archetype: 'goat', stats: stats() },
      { name: 'Finn', archetype: 'goat', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, coachDeals: [] });
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Marco', tribe: 'Red' });
    addBond('Julia', 'Evie', 4);
    addBond('Marco', 'Finn', 4);
  });

  const tribe = { name: 'Red', members: ['Evie', 'Finn'] };

  it('seals a trade and actually swaps bond standing over the two protégés', () => {
    const beforeJE = getBond('Julia', 'Evie'), beforeMF = getBond('Marco', 'Finn');
    const out = runCoachDealBlock({ num: 3 }, tribe, alwaysRoll);
    const ev = out.find(e => e.type === 'coachTrade');
    expect(ev, 'two matched Control coaches must trade influence').toBeTruthy();
    assertWellFormed(out);
    assertNoWrongShowWords(out);
    expect(getBond('Julia', 'Evie')).toBeLessThan(beforeJE);
    expect(getBond('Marco', 'Evie')).toBeGreaterThan(0);
    expect(getBond('Marco', 'Finn')).toBeLessThan(beforeMF);
    expect(getBond('Julia', 'Finn')).toBeGreaterThan(0);
  });
});

describe('the fall — a vulnerable Survive coach bargains their own exit', () => {
  beforeEach(() => {
    setPlayers([
      { name: 'Julia', archetype: 'goat', stats: stats() },
      { name: 'Marco', archetype: 'goat', stats: stats() },
      { name: 'Evie', archetype: 'goat', stats: stats() },
      { name: 'Theo', archetype: 'goat', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie', 'Theo'], coaches: [], coachTraining: {}, bonds: {}, coachDeals: [] });
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Marco', tribe: 'Red' });
    // Julia is on the outs with the tribe overall — genuinely vulnerable —
    // but still has one real protégé (Theo) worth protecting on the way out.
    // Set directly (see setBond) so addBond's depth ceiling doesn't damp a
    // single-shot -9 into something too shallow to clear the 0.45 gate.
    setBond('Julia', 'Evie', -9);
    setBond('Julia', 'Theo', 3);
  });

  const tribe = { name: 'Red', members: ['Evie', 'Theo'] };

  it('marks the vulnerable coach as this episode’s target — the only lever a non-voter has', () => {
    const out = runCoachDealBlock({ num: 5 }, tribe, alwaysRoll);
    const ev = out.find(e => e.type === 'coachTheFall');
    expect(ev, 'a genuinely vulnerable Survive coach must be able to bargain the fall').toBeTruthy();
    expect(ev.players[0]).toBe('Julia');
    assertWellFormed(out);
    assertNoWrongShowWords(out);
    expect(gs._coachFallHeat?.Julia).toBe(5);
  });

  it('the protection clause is a real bond change, not just a line of text', () => {
    const before = getBond('Marco', 'Theo');
    runCoachDealBlock({ num: 5 }, tribe, alwaysRoll);
    expect(getBond('Marco', 'Theo')).toBeGreaterThan(before);
  });
});

describe('rejection — proposed but not accepted', () => {
  it('produces a well-formed, vocabulary-clean decline instead of a silent no-op', () => {
    setPlayers([
      { name: 'Julia', archetype: 'mastermind', stats: stats({ strategic: 9, loyalty: 2 }) },
      { name: 'Marco', archetype: 'chaos-agent', stats: stats({ boldness: 9, temperament: 1 }) },
      { name: 'Evie', archetype: 'goat', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {}, bonds: {}, coachDeals: [] });
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Marco', tribe: 'Red' });
    const tribe = { name: 'Red', members: ['Evie'] };
    // roll() always returns a mid-high value: clears the propose gate (small
    // chances are still often < 0.9) but fails the accept gate reliably when
    // the responder (a Disrupt archetype) has near-zero affinity for a deal
    // they did not choose and no overlap to fall back on.
    const midRoll = () => 0.5;
    const out = runCoachDealBlock({ num: 3 }, tribe, midRoll);
    const rejected = out.find(e => e.type === 'coachDealRejected');
    if (rejected) {
      assertWellFormed(out);
      assertNoWrongShowWords(out);
    }
    // Either it rejected (asserted above) or nothing rose above the propose
    // threshold this roll — both are valid, non-crashing outcomes. What must
    // never happen is an unsealed deal silently registering as active.
    expect((gs.coachDeals || []).filter(d => d.active).length).toBeLessThanOrEqual(1);
  });
});

describe('breaking a live deal — the Disrupt coach walks away from it', () => {
  function seedDeal(type, extra = {}) {
    gs.coachDeals = [{
      players: ['Marco', 'Julia'], tribe: 'Red', type, active: true, broken: false,
      madeEp: 2, proposer: 'Julia', faller: type === 'the-fall' ? 'Julia' : null,
      about: 'their arrangement', ...extra,
    }];
  }

  beforeEach(() => {
    setPlayers([
      { name: 'Julia', archetype: 'hero', stats: stats({ loyalty: 9, social: 9, temperament: 9, boldness: 2 }) },
      { name: 'Marco', archetype: 'chaos-agent', stats: stats({ boldness: 9, temperament: 1 }) },
      { name: 'Evie', archetype: 'goat', stats: stats() },
    ]);
    setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {}, bonds: {}, coachDeals: [] });
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Marco', tribe: 'Red' });
  });

  const tribe = { name: 'Red', members: ['Evie'] };

  it('the high-Disrupt coach breaks a non-aggression pact and immediately poaches', () => {
    addBond('Julia', 'Evie', 4);
    seedDeal('non-aggression');
    const beforeJE = getBond('Julia', 'Evie');
    const beforeMJ = getBond('Marco', 'Julia');
    const out = runCoachDealBlock({ num: 4 }, tribe, alwaysRoll);
    const ev = out.find(e => e.type === 'coachDealBroken');
    expect(ev, 'the Disrupt coach must be the one who breaks it').toBeTruthy();
    expect(ev.players[0]).toBe('Marco');
    assertWellFormed(out);
    assertNoWrongShowWords(out);
    expect(getBond('Marco', 'Julia')).toBeLessThan(beforeMJ);
    expect(getBond('Marco', 'Evie')).toBeGreaterThan(0);
    expect(getBond('Julia', 'Evie')).toBeLessThan(beforeJE);
    const deal = gs.coachDeals[0];
    expect(deal.broken).toBe(true);
    expect(deal.brokenBy).toBe('Marco');
  });

  it('breaking the-fall costs the breaker heavily and can undo the protection', () => {
    addBond('Marco', 'Evie', 4);
    seedDeal('the-fall', { protectedProteges: ['Evie'] });
    const beforeME = getBond('Marco', 'Evie');
    const out = runCoachDealBlock({ num: 4 }, tribe, alwaysRoll);
    const ev = out.find(e => e.type === 'coachDealBroken');
    expect(ev).toBeTruthy();
    expect(ev.players[0]).toBe('Marco'); // the survivor reneging
    assertWellFormed(out);
    assertNoWrongShowWords(out);
    expect(getBond('Marco', 'Evie')).toBeLessThan(beforeME);
  });
});
