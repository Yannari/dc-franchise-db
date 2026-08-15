// The money. Canon tiers, canon carry-over, and a ledger nobody else can read.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { balance, canAfford, spend, credit, bucksLedgerFor,
  awardWeeklyBucks, PAYOUT_TIERS, FLOOR_TIER } from '../js/bb/bb-bucks.js';

// Read the amounts from the module rather than restating them. A test that
// copies the tiers is a second source of truth for them, and the whole reason
// the tiers were rescalable in one line is that nothing downstream owns a copy.
const [TOP, MID] = PAYOUT_TIERS;
const FLOOR = FLOOR_TIER;

const HOUSE = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly'];

// A deterministic rng so a payout is reproducible inside one test.
function seq(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

beforeEach(() => {
  // gs starts as null in core.js — the repo convention is to seed it via setGs.
  setGs({ bb: { weeks: [], bucks: {} }, popularity: {} });
});

describe('the ledger', () => {
  it('starts everybody at nothing', () => {
    expect(balance('Bowie')).toBe(0);
  });

  it('credits and reads back', () => {
    credit('Bowie', 100);
    credit('Bowie', 50);
    expect(balance('Bowie')).toBe(150);
  });

  it('refuses to spend money that is not there', () => {
    credit('Bowie', 60);
    expect(canAfford('Bowie', 125)).toBe(false);
    expect(spend('Bowie', 125)).toBe(false);
    expect(balance('Bowie')).toBe(60);
  });

  it('spends what is there', () => {
    credit('Bowie', 125);
    expect(spend('Bowie', 125)).toBe(true);
    expect(balance('Bowie')).toBe(0);
  });

  it('survives a round trip through JSON, because saves do', () => {
    credit('Bowie', 75);
    const revived = JSON.parse(JSON.stringify(gs.bb.bucks));
    expect(revived.Bowie).toBe(75);
  });
});

describe('the weekly payout', () => {
  // The canon SHAPE — three, three, and the rest — with amounts read from the
  // module. The amounts were rescaled off the broadcast's $100/$75/$50 because
  // this simulator pays every week rather than only during the three weeks the
  // room was open; the shape is untouched.
  it('pays the canon shape: three at the top, three in the middle, the rest on the floor', () => {
    const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.1, 0.4, 0.7]) });
    const amounts = act.payouts.map(p => p.amount).sort((a, b) => b - a);
    expect(amounts.filter(a => a === TOP.amount)).toHaveLength(TOP.count);
    expect(amounts.filter(a => a === MID.amount)).toHaveLength(MID.count);
    expect(amounts.filter(a => a === FLOOR.amount)).toHaveLength(HOUSE.length - TOP.count - MID.count);
  });

  // A whole season's income must not comfortably clear the menu, or a purchase
  // stops being a sacrifice and the room becomes a shop. Sixteen weeks at the
  // top tier should just about reach the 250 Coin and nothing beyond it; a
  // floor houseguest should never get there at all.
  it('prices a season so that the most-watched houseguest can afford ONE big thing', () => {
    const WEEKS = 16, COIN = 250, ROULETTE = 125;
    expect(TOP.amount * WEEKS).toBeGreaterThanOrEqual(COIN);
    expect(TOP.amount * WEEKS).toBeLessThan(COIN + ROULETTE);
    expect(FLOOR.amount * WEEKS).toBeLessThan(COIN);
    expect(FLOOR.amount * WEEKS).toBeGreaterThanOrEqual(ROULETTE);
  });

  it('pays every houseguest exactly once', () => {
    const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    expect(act.payouts.map(p => p.name).sort()).toEqual([...HOUSE].sort());
  });

  it('writes the payout into the ledger and carries it across weeks', () => {
    awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    const afterOne = HOUSE.map(balance);
    awardWeeklyBucks({ week: { num: 2 }, house: HOUSE, rng: seq([0.3, 0.6, 0.8]) });
    HOUSE.forEach((name, i) => expect(balance(name)).toBeGreaterThan(afterOne[i] - 1));
    // Nobody can be poorer after a payout than before one: two weeks on the
    // floor is the least anybody in that house can be holding.
    expect(HOUSE.every(n => balance(n) >= FLOOR.amount * 2)).toBe(true);
  });

  it('leans towards the houseguests the audience actually likes', () => {
    gs.popularity = { Bowie: 9, Chase: 9, Ripper: 9 };
    let top = 0;
    for (let s = 0; s < 60; s++) {
      gs.bb.bucks = {};
      const rng = seq([(s % 10) / 10, ((s * 3) % 10) / 10, ((s * 7) % 10) / 10]);
      const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng });
      const paidTop = act.payouts.filter(p => p.tier === 'top').map(p => p.name);
      top += paidTop.filter(n => ['Bowie', 'Chase', 'Ripper'].includes(n)).length;
    }
    // 3 of 8 at random would be ~67 over 60 draws of 3. Weighted must beat that clearly.
    expect(top).toBeGreaterThan(90);
  });

  it('pays nobody in a house too small to have tiers', () => {
    expect(awardWeeklyBucks({ week: { num: 1 }, house: ['Bowie', 'Chase'], rng: seq([0.5]) })).toBeNull();
  });

  it('names a real tier on every payout, for the transcript', () => {
    const act = awardWeeklyBucks({ week: { num: 1 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    expect(act.type).toBe('bb-bucks');
    expect(act.beats.length).toBeGreaterThan(0);
    act.payouts.forEach(p => expect(['top', 'middle', 'floor']).toContain(p.tier));
  });

  it('never reports another houseguest\'s balance in a beat', () => {
    credit('Bowie', 500);
    const act = awardWeeklyBucks({ week: { num: 2 }, house: HOUSE, rng: seq([0.2, 0.5, 0.9]) });
    expect(act.beats.some(b => b.text.includes('500'))).toBe(false);
  });

  it('is deterministic with no rng passed, because the season is seeded', () => {
    // The default rng must be the week's seeded generator, never Math.random —
    // an unseeded draw makes the same seed stop producing the same house.
    const first = awardWeeklyBucks({ week: { num: 4 }, house: HOUSE });
    setGs({ bb: { weeks: [], bucks: {} }, popularity: {} });
    const second = awardWeeklyBucks({ week: { num: 4 }, house: HOUSE });
    expect(second.payouts).toEqual(first.payouts);
    expect(second.beats.map(b => b.text)).toEqual(first.beats.map(b => b.text));
  });

  it('pays a different week differently, so the seed is week-stable not fixed', () => {
    const four = awardWeeklyBucks({ week: { num: 4 }, house: HOUSE });
    setGs({ bb: { weeks: [], bucks: {} }, popularity: {} });
    const five = awardWeeklyBucks({ week: { num: 5 }, house: HOUSE });
    const topOf = act => act.payouts.filter(p => p.tier === 'top').map(p => p.name).sort();
    expect(topOf(five)).not.toEqual(topOf(four));
  });

  it('frozen tiers, so nothing downstream can retune canon by accident', () => {
    expect(Object.isFrozen(PAYOUT_TIERS)).toBe(true);
  });
});

describe('the snapshot', () => {
  it('reports a balance for every houseguest in the room', () => {
    credit('Bowie', 100);
    const ledger = bucksLedgerFor(HOUSE);
    expect(ledger).toHaveLength(HOUSE.length);
    expect(ledger.find(l => l.name === 'Bowie').balance).toBe(100);
    expect(ledger.find(l => l.name === 'Chase').balance).toBe(0);
  });
});
