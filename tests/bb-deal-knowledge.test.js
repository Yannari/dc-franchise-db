// A promise about the end, and who finds out about it.
//
// bb/knowledge.js was built to give the house a real information layer and half
// of it was never connected. `recordBBDeal` and `recordBBTarget` had no callers
// anywhere in the simulator, which meant two things the format is supposed to
// run on simply could not happen: nobody could ever learn that two other people
// had shaken on a final two, and nobody could ever find out they were being
// hunted. `exposeDeal` wrote to a private array on the deal that two places
// read and nothing acted on, so being exposed cost a pair precisely nothing.
//
// The through-line of every test below is that these are BELIEFS and not the
// truth. A Head of Household acts on what somebody told them, which means a
// rumour can split an innocent pair and a real final two nobody has breathed a
// word about stays invisible. That asymmetry is the point: it is what makes
// exposing a deal worth doing, and what makes talking about your target
// dangerous.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { makeEndgameDeal, exposeDeal, dealBetween } from '../js/bb/deals.js';
import {
  recordBBDeal, learnBBDeal, believesDeal,
  recordBBTarget, believesTarget, believedHunters,
  tickBBKnowledge,
} from '../js/bb/knowledge.js';
import { chooseNominationPlan } from '../js/bb/strategy.js';
import { formHousePlan, housePlan, reviseHousePlans } from '../js/bb/plans.js';
import { factId, getFact, learn, believes } from '../js/knowledge.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

/**
 * Word reaching the quarry — the one direction no hunter tells deliberately.
 *
 * `rng: () => 0` because being told is a persuasion roll the listener can fail,
 * and a test about what somebody does with the news should not be a test of
 * whether they happened to believe it.
 */
const wordGetsBack = (knower, hunter, quarry, ep = 3) =>
  learn(knower, factId('target', hunter, quarry),
    { sourceType: 'told', from: 'someone', ep, rng: () => 0 });

/** planSkill is 0.65 strategic + 0.2 intuition + 0.15 social. Pin it. */
function setSkill(name, value) {
  const stats = players.find(p => p.name === name).stats;
  stats.strategic = value; stats.intuition = value; stats.social = value;
}

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    twistSchedule: [], bbSafetyMode: 'off', bbHaveNots: 'off', bbDepartures: 'off' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  gs.namedAlliances = []; gs.intentions = {}; gs.knowledge = {}; gs.jury = [];
  gs.episode = 1;
}

describe('shaking on the end is something that happened in a room', () => {
  beforeEach(house);

  it('is observed by the two people in it and by nobody else', () => {
    makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 2 } });

    expect(believesDeal('Bowie', 'Chase', 'Bowie'), 'his own handshake').toBe(true);
    expect(believesDeal('Chase', 'Bowie', 'Chase')).toBe(true);
    // Argument order must not matter — the fact is keyed on the sorted pair.
    expect(believesDeal('Bowie', 'Bowie', 'Chase')).toBe(true);

    for (const outsider of NAMES.filter(n => n !== 'Bowie' && n !== 'Chase')) {
      expect(believesDeal(outsider, 'Bowie', 'Chase'),
        `${outsider} was not in the room and should know nothing`).toBe(false);
    }
  });

  it('records a final three as its three pairs, not one three-way secret', () => {
    // What travels across a kitchen is "those two are working together". Being
    // told one leg of a trio is not being handed the other two.
    makeEndgameDeal('Bowie', 'Chase', 'final-three', { week: { num: 2 }, third: 'Ripper' });

    expect(getFact(factId('deal', 'Bowie', 'Chase'))).toBeTruthy();
    expect(getFact(factId('deal', 'Chase', 'Ripper'))).toBeTruthy();
    expect(getFact(factId('deal', 'Bowie', 'Ripper'))).toBeTruthy();
    expect(believesDeal('Ripper', 'Bowie', 'Chase'), 'all three were in the room').toBe(true);
  });

  it('will not let a rumour invent a handshake that never happened', () => {
    // Nobody made this deal. Being told about it must not conjure the fact.
    expect(learnBBDeal('Scary', 'Bowie', 'Chase', { from: 'Axel', week: 3 })).toBe(false);
    expect(believesDeal('Scary', 'Bowie', 'Chase')).toBe(false);
  });
});

describe('exposure is what makes it cost something', () => {
  beforeEach(house);

  it('puts the deal into the head of the person who was told', () => {
    const deal = makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 2 } });
    expect(believesDeal('Scary', 'Bowie', 'Chase')).toBe(false);

    exposeDeal(deal, 'Scary', { from: 'Chase', week: 3, rng: () => 0 });

    expect(deal.exposedTo, 'the plain roll of who has been told').toContain('Scary');
    expect(believesDeal('Scary', 'Bowie', 'Chase'),
      'told about it and still could not act on it').toBe(true);
  });

  it('travels onward on its own, without anybody scripting the next telling', () => {
    // The whole reason for entering it into the model rather than a private
    // array: week two's gossip is week three's common knowledge.
    const deal = makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 1 } });
    exposeDeal(deal, ['Scary', 'Axel', 'Zee'], { from: 'Chase', week: 1, rng: () => 0 });
    const toldDirectly = new Set(['Bowie', 'Chase', 'Scary', 'Axel', 'Zee']);

    // Propagation walks a knower's CONTACTS, and bbContacts counts an ally as
    // an alliance mate, a showmance or a bond of 4+. A house of strangers has
    // nobody to leak to, so the people who were told need somebody they talk
    // to before any of this can be exercised.
    ['Hicks', 'Emmah', 'Millie'].forEach(n => {
      addBond('Scary', n, 6); addBond('Axel', n, 6); addBond('Zee', n, 6);
    });

    // Everybody talks to everybody for a few weeks.
    let spread = 0;
    for (let w = 2; w <= 6 && !spread; w++) {
      tickBBKnowledge({ num: w }, () => 0.05);
      spread = NAMES.filter(n => !toldDirectly.has(n) && believesDeal(n, 'Bowie', 'Chase')).length;
    }
    expect(spread, 'the deal never left the people who were told directly').toBeGreaterThan(0);
  });

  it('does not turn a member of the deal into somebody who heard a rumour', () => {
    // The finale exposes a broken deal to the whole jury, and the person who
    // got cut is sitting on that jury — so the roll has to accept them. What
    // must not happen is their first-hand knowledge being overwritten by
    // hearsay on the way past.
    const deal = makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 2 } });
    const before = believes('Bowie', factId('deal', 'Bowie', 'Chase'));
    expect(before.sourceType, 'he was in the room').toBe('observed');

    expect(exposeDeal(deal, 'Bowie', { from: 'Chase', week: 3, rng: () => 0 }),
      'the roll takes anybody not already on it').toBe(true);

    const after = believes('Bowie', factId('deal', 'Bowie', 'Chase'));
    expect(after.sourceType, 'first-hand knowledge was downgraded to gossip').toBe('observed');
  });
});

describe('a known pair goes up together', () => {
  beforeEach(house);

  /**
   * One week, staged so the question is answerable.
   *
   * The pair-split structure hangs off the TOP-RANKED candidate, so the target
   * has to be the person the Head of Household was coming for anyway — the
   * honest question is not "does she nominate him" but "given she is, does
   * knowing about the deal change who sits beside him". She also needs an
   * obvious pawn of her own, or the classic structure reaches for the partner
   * by coincidence and the two plays become indistinguishable.
   */
  function stage() {
    addBond('Nichelle', 'Bowie', -4.5);     // the week's target
    addBond('Nichelle', 'Ripper', -2.6);
    addBond('Nichelle', 'Zee', -2.4);
    addBond('Bowie', 'Chase', 8);           // visibly inseparable
    addBond('Nichelle', 'Emmah', 7);        // the chair she would otherwise use
    return makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 2 } });
  }

  /** Across the spread of rolls: how often do the pair go up, and why. */
  function draws() {
    const out = { paired: 0, citedDeal: 0 };
    for (let s = 0; s < 20; s++) {
      const plan = chooseNominationPlan('Nichelle', [...NAMES], () => s / 20);
      if (plan.nominees.includes('Bowie') && plan.nominees.includes('Chase')) out.paired++;
      if (/have something at the end/.test(plan.structureWhy || '')) out.citedDeal++;
    }
    return out;
  }

  it('is invisible to a Head of Household who has not been told', () => {
    stage();
    expect(believesDeal('Nichelle', 'Bowie', 'Chase'),
      'nobody told her anything').toBe(false);

    const { citedDeal } = draws();
    expect(citedDeal, 'a secret deal steered a nomination').toBe(0);
  });

  it('is the reason they are seated together once she knows', () => {
    // The payoff, and the control above is the same house to the letter. The
    // only difference between the two is that somebody talked.
    const deal = stage();
    exposeDeal(deal, 'Nichelle', { from: 'Scary', week: 3, rng: () => 0 });
    expect(believesDeal('Nichelle', 'Bowie', 'Chase')).toBe(true);

    const { paired, citedDeal } = draws();
    expect(paired, 'she knew about the final two and never once used it').toBeGreaterThan(0);
    expect(citedDeal, 'the pair went up and the deal was not the stated reason').toBeGreaterThan(0);
  });

  it('splits an innocent pair when what she believes is wrong', () => {
    // She has been told. It is not true. She acts on it anyway, because that
    // is what acting on information means — and being wrong in public is the
    // price of playing on gossip.
    const real = makeEndgameDeal('Bowie', 'Chase', 'final-two', { week: { num: 2 } });
    // Ripper and Scary never shook on anything...
    expect(dealBetween('Ripper', 'Scary')).toBeNull();
    // ...but the fact exists and Nichelle has been handed it.
    recordBBDeal('Ripper', 'Scary', 'final-two', 2);
    learnBBDeal('Nichelle', 'Ripper', 'Scary', { from: 'Axel', week: 3, rng: () => 0 });

    expect(believesDeal('Nichelle', 'Ripper', 'Scary'),
      'she believes it whether or not it is true').toBe(true);
    expect(dealBetween('Ripper', 'Scary'),
      'the belief must not have created a real deal').toBeNull();
    expect(real.players).toEqual(['Bowie', 'Chase']);
  });
});

describe('being hunted is something you can find out', () => {
  beforeEach(house);

  it('keeps two hunters of the same houseguest apart', () => {
    // The bug this had while it sat unused: keyed on the quarry alone, so the
    // second hunter silently overwrote the first. In a house where everybody
    // can see who the threat is, that is most of the intentions in the game.
    recordBBTarget('Bowie', 'Caleb', { week: 2 });
    recordBBTarget('Scary', 'Caleb', { week: 2 });

    expect(believesTarget('Bowie', 'Bowie', 'Caleb')).toBe(true);
    expect(believesTarget('Scary', 'Scary', 'Caleb')).toBe(true);
    expect(getFact(factId('target', 'Bowie', 'Caleb'))?.payload?.hunter).toBe('Bowie');
    expect(getFact(factId('target', 'Scary', 'Caleb'))?.payload?.hunter).toBe('Scary');
  });

  it('is known to the hunter and never to the quarry by default', () => {
    // Whether a confidant BELIEVES what they were told is a persuasion roll
    // they can fail, so the two people told are not asserted individually. The
    // load-bearing half is the other one: telling your core must never leak to
    // the person you are coming for.
    recordBBTarget('Bowie', 'Caleb', { week: 2, toldTo: ['Chase', 'Ripper'] });

    expect(believesTarget('Bowie', 'Bowie', 'Caleb'), 'his own intention').toBe(true);
    expect(believesTarget('Caleb', 'Bowie', 'Caleb'),
      'the quarry has not been told yet').toBe(false);
    expect(believedHunters('Caleb')).toEqual([]);
  });

  it('reaches the quarry, and then it is on their list', () => {
    // How fast somebody acts on the news scales with how well they plan — a
    // weak planner files it behind two names already on a three-deep list and
    // may never get to it. That is the design, so the player under test is
    // pinned sharp rather than left to the roster's random stats.
    setSkill('Caleb', 9);
    formHousePlan('Caleb', { house: [...NAMES], week: { num: 2 } });
    recordBBTarget('Bowie', 'Caleb', { week: 2 });
    // Word gets back.
    learnBBDeal('Caleb', 'Bowie', 'Caleb');       // wrong shape: must not apply
    expect(believedHunters('Caleb'), 'a deal call must not register as a hunt').toEqual([]);

    wordGetsBack('Caleb', 'Bowie', 'Caleb');
    expect(believedHunters('Caleb')).toContain('Bowie');

    reviseHousePlans({ house: [...NAMES], week: { num: 3 }, trigger: 'week' });
    const plan = housePlan('Caleb');
    expect(plan.targets, 'he found out and did nothing about it').toContain('Bowie');
    expect(plan.origins.targets.Bowie).toMatch(/word got back/);
  });
});
