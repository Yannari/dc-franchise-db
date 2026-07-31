// What each houseguest is actually trying to do.
//
// The house was handed Total Drama's plan object with every field left empty
// and only `targets` ever written — a mastermind on strategic 9 planned exactly
// like a floater on strategic 2, which is to say not at all. Nothing read
// `.shield` or `.goat` anywhere in the format, so filling them would not have
// mattered either.
//
// These tests are written against the two failure modes that actually bit:
// fields that are declared and never filled, and fields that are filled and
// never read. Both look fine in isolation and only show up by playing seasons
// and counting.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale, runBBFinale } from '../js/bb-run.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { housePlan, houseStage } from '../js/bb/plans.js';
import { endgameDealsOf, dealBetween, tierOf, makeEndgameDeal, sincerityOf } from '../js/bb/deals.js';
import { chooseNominationPlan } from '../js/bb/strategy.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj','Julia','Priya','MK','Damien'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat, bKey });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'every-week', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  gs.intentions = {};
}

/**
 * Play until the house is the size we want to look at.
 *
 * Seeded, and not optionally. An unseeded run of this measured different
 * seasons on every invocation, which showed up as a shield assertion that
 * passed on its own and failed inside the suite — the classic shape of a test
 * that is really sampling rather than checking.
 */
function playDownTo(size, { seed = 4242, cap = 30 } = {}) {
  let last = null;
  withSeededRandom(seed, () => {
    let guard = 0;
    while ((gs.activePlayers || []).length > size && guard++ < cap) last = simulateBBEpisode();
  });
  return last;
}

describe('houseguests have a plan', () => {
  it('gives everybody one, shaped by how well they plan', () => {
    reset();
    withSeededRandom(11, () => simulateBBEpisode());
    const house = gs.activePlayers || [];
    for (const name of house) {
      expect(housePlan(name), `${name} has no plan at all`).toBeTruthy();
    }
    // A mastermind and a floater must not plan identically. planStyle was
    // hardcoded to 'reactive' for every single houseguest.
    const styles = new Set(house.map(n => housePlan(n).planStyle));
    expect(styles.size, 'every houseguest plans exactly the same way').toBeGreaterThan(1);
  }, 240000);

  it('fills the fields it declares, once the end is in sight', () => {
    reset();
    playDownTo(8);
    const house = gs.activePlayers || [];
    expect(houseStage(house.length)).not.toBe('early');
    const filled = field => house.filter(n => {
      const v = housePlan(n)?.[field];
      return Array.isArray(v) ? v.some(x => x && x !== n) : !!v;
    }).length;

    // Every one of these was 0/N across a full measured season.
    expect(filled('targets'), 'nobody is coming for anybody').toBeGreaterThan(0);
    expect(filled('shield'), 'nobody is hiding behind anybody').toBeGreaterThan(0);
    expect(filled('goat'), 'nobody has worked out who they beat').toBeGreaterThan(0);
    expect(filled('preferredCore'), 'nobody is close to anybody').toBeGreaterThan(0);
    expect(filled('betrayalConditions'), 'nobody would ever turn on their own').toBeGreaterThan(0);
  }, 240000);

  it('does not read a goat as somebody who has to like you', () => {
    // Total Drama needs a goat who keeps choosing you, so it requires a warm
    // relationship. The final Head of Household picks alone and the person
    // picked has no say, so hostility is no obstacle at all. Importing the
    // wrong show's constraint left the late house with no endgame reads.
    reset();
    playDownTo(6);
    const house = gs.activePlayers || [];
    const goats = house.map(n => housePlan(n)?.goat).filter(Boolean);
    expect(goats.length, 'the final six have no idea who they would rather sit beside')
      .toBeGreaterThan(0);
  }, 240000);

  it('explains every revision it makes', () => {
    reset();
    const ep = playDownTo(12);
    const changes = ep.planChanges || [];
    expect(changes.length, 'nobody changed their mind all week').toBeGreaterThan(0);
    for (const c of changes) {
      expect(c.reason, `a plan moved with no reason given: ${JSON.stringify(c)}`).toBeTruthy();
      expect(c.owner).toBeTruthy();
    }
  }, 240000);
});

describe('a plan changes what actually happens', () => {
  it('will not put its own shield on the block', () => {
    // The entire reason to keep a bigger player in the house is that they
    // absorb the shots. An HOH who nominates their own shield has not
    // understood their own strategy — and before the plan was wired in,
    // nominations could not see one.
    reset();
    playDownTo(10);
    const house = gs.activePlayers || [];
    let checked = 0, violations = 0;
    for (const hoh of house) {
      const plan = housePlan(hoh);
      if (!plan?.shield || !house.includes(plan.shield)) continue;
      checked++;
      // Averaged over draws so a single noisy roll is not the verdict.
      let up = 0;
      for (let i = 0; i < 40; i++) {
        if (chooseNominationPlan(hoh, house).nominees.includes(plan.shield)) up++;
      }
      if (up / 40 > 0.35) violations++;
    }
    if (checked) {
      expect(violations, 'Heads of Household keep nominating the person they are hiding behind')
        .toBeLessThanOrEqual(Math.floor(checked * 0.34));
    }
  }, 240000);

  it('keeps a final two off the block', () => {
    reset();
    playDownTo(9);
    const house = gs.activePlayers || [];
    const hoh = house[0];
    const partner = house.find(n => n !== hoh);
    // A sincere, explicit promise between these two.
    const deal = makeEndgameDeal(hoh, partner, 'final-two', { week: { num: 99 } });
    if (!deal) return;                       // capped out; nothing to assert
    deal.sincerity[hoh] = 1;
    let up = 0;
    for (let i = 0; i < 60; i++) {
      if (chooseNominationPlan(hoh, house).nominees.includes(partner)) up++;
    }
    expect(up / 60, 'the person they promised the end to keeps going up anyway')
      .toBeLessThan(0.3);
  }, 240000);
});

describe('promises about the end', () => {
  it('does not let the house saturate with them', () => {
    // Twenty-eight live final twos between ten houseguests makes the strongest
    // promise in the game worth nothing.
    reset();
    playDownTo(10);
    const house = gs.activePlayers || [];
    for (const name of house) {
      expect(endgameDealsOf(name).length, `${name} is holding too many endgame deals`)
        .toBeLessThanOrEqual(3);
    }
  }, 240000);

  it('records the two sides separately, because they rarely agree', () => {
    reset();
    playDownTo(11);
    const house = gs.activePlayers || [];
    const seen = [];
    for (const a of house) for (const d of endgameDealsOf(a)) if (!seen.includes(d)) seen.push(d);
    for (const deal of seen) {
      for (const n of deal.players) {
        const s = sincerityOf(deal, n);
        expect(s, 'sincerity is out of range').toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }
    }
  }, 240000);

  it('can be broken by a vote, not only at the very end', () => {
    // Only the final cut could break one, so a measured season made thirty-odd
    // final twos and broke exactly zero of them before the final three.
    reset();
    let broke = 0;
    withSeededRandom(63, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 30) {
        broke += (simulateBBEpisode().dealBreaks || []).length;
      }
    });
    expect(broke, 'nobody went back on the end all season').toBeGreaterThan(0);
  }, 240000);

  it('tells the user when somebody does', () => {
    reset();
    let ep = null;
    withSeededRandom(63, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 30) {
        ep = simulateBBEpisode();
        if ((ep.dealBreaks || []).length) break;
      }
    });
    if (!(ep.dealBreaks || []).length) return;
    const text = generateBBSummaryText(ep);
    expect(text, 'a promise was broken and the transcript never mentions it')
      .toContain('PROMISES BROKEN');
    expect(text).toContain(ep.dealBreaks[0].breaker);
  }, 240000);
});

describe('the final cut', () => {
  it('is a decision about a promise, not only about a jury projection', () => {
    // This is the one moment in Big Brother where a final two is publicly
    // honoured or broken, and it used to be resolved on projected margin alone
    // — so nobody ever kept their word, because nobody was ever asked to.
    let honoured = 0, betrayed = 0, hadPromise = 0;
    // reset() is deterministic, so looping it replays one identical season.
    // The seed has to actually drive the randomness or this samples nothing.
    for (const seed of [7, 41, 88]) {
      withSeededRandom(seed, () => {
        reset();
        let guard = 0;
        while (!houseIsAtFinale() && guard++ < 30) simulateBBEpisode();
        const finale = runBBFinale();
        const cut = (finale?.acts || []).find(a => a.type === 'final-cut');
        if (!cut) return;
        if (cut.hadPromise) hadPromise++;
        if (cut.honoured) honoured++;
        if (cut.betrayal) betrayed++;
      });
    }
    expect(hadPromise, 'six seasons and nobody reached the final three with a deal')
      .toBeGreaterThan(0);
    expect(honoured + betrayed, 'a promise existed at the final three and was neither kept nor broken')
      .toBeGreaterThan(0);
  }, 300000);   // three full seasons, played to the finale
});
