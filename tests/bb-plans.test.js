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
//
// ── on the fixture ───────────────────────────────────────────────────
//
// Nearly every assertion here needs a house that has been playing for weeks,
// and the first version of this file got that by replaying a season inside each
// test — eleven seasons for eleven tests, about nine minutes. The season is
// seeded and therefore identical every time, so ten of those eleven were
// recomputing a result they already had.
//
// So it is played ONCE, in beforeAll, snapshotting the whole of `gs` after
// every eviction. A test asks for the house size it wants to look at and gets
// that moment restored. Restoring deep-clones, so a test may scheme all it
// likes without leaking into the next one.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale, runBBFinale } from '../js/bb-run.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { housePlan, houseStage } from '../js/bb/plans.js';
import { endgameDealsOf, makeEndgameDeal, sincerityOf } from '../js/bb/deals.js';
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

// ── recording and replaying a moment in a season ─────────────────────

/**
 * Copy the world.
 *
 * Per-key rather than wholesale, because `gs` picks up the occasional value
 * structuredClone refuses (a function, a DOM-ish object) and one of those
 * should not cost us the other forty keys.
 */
function snapshot() {
  const world = {};
  for (const [key, value] of Object.entries(gs)) {
    try { world[key] = structuredClone(value); } catch { /* not state we can carry */ }
  }
  // Adaptation writes back onto the player objects, so they travel too.
  return { world, cast: structuredClone(players) };
}

/**
 * Put it back.
 *
 * Both `gs` and `players` are mutated in place rather than reassigned: every
 * module in the project holds the original reference, and main.js exposes those
 * same objects on window, so swapping them out would leave half the codebase
 * looking at the previous world.
 */
function restore(snap) {
  for (const key of Object.keys(gs)) delete gs[key];
  for (const [key, value] of Object.entries(snap.world)) gs[key] = structuredClone(value);
  players.splice(0, players.length, ...structuredClone(snap.cast));
}

/** One season, recorded: a snapshot per house size, every episode, the finale. */
function recordSeason(seed) {
  const byHouseSize = new Map();
  const episodes = [];
  let cut = null;
  reset();
  withSeededRandom(seed, () => {
    byHouseSize.set((gs.activePlayers || []).length, snapshot());
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 30) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      episodes.push(ep);
      byHouseSize.set((gs.activePlayers || []).length, snapshot());
    }
    const finale = runBBFinale();
    cut = (finale?.acts || []).find(a => a.type === 'final-cut') || null;
  });
  return { seed, byHouseSize, episodes, cut };
}

let SEASON = null;

beforeAll(() => { SEASON = recordSeason(4242); }, 300000);

/**
 * Replay the last night from the recorded final three, arranging it first.
 *
 * Reseeding the finale was tried and buys nothing: with three players left the
 * competitions are stat-dominated, so the same person won all three parts under
 * every seed and produced four identical cuts. Varying the SITUATION is both
 * cheaper and a stronger test — rather than sampling the decision and hoping to
 * catch it going each way, set up a promise worth keeping and a promise worth
 * breaking, and check it goes the right way each time.
 */
function replayFinale(arrange) {
  restore(SEASON.byHouseSize.get(3));
  let cut = null;
  withSeededRandom(7, () => {
    arrange?.(gs.activePlayers || []);
    const finale = runBBFinale();
    cut = (finale?.acts || []).find(a => a.type === 'final-cut') || null;
  });
  return cut;
}

/**
 * Make this the ONLY promise on the table, at exactly the sincerity we want.
 *
 * Clearing the others matters: the cut weighs the most sincere deal it finds,
 * so a season that arrives at the final three with two organic final twos will
 * quietly weigh one of those instead of the one the test just planted — and the
 * test then proves nothing about the case it meant to set up.
 */
function soloPromise(a, b, sincerity) {
  for (const deal of gs.sideDeals || []) {
    if (deal.tier === 'final-two' || deal.tier === 'final-three') deal.active = false;
  }
  const deal = makeEndgameDeal(a, b, 'final-two', { week: { num: 99 } });
  if (deal) { deal.sincerity = { [a]: sincerity, [b]: sincerity }; }
  return deal;
}

/** Restore the recorded season at the moment the house was this big. */
function atHouseOf(size, season = SEASON) {
  const snap = season.byHouseSize.get(size);
  if (!snap) throw new Error(`the recorded season never had ${size} houseguests `
    + `(it had ${[...season.byHouseSize.keys()].sort((a, b) => b - a).join(', ')})`);
  restore(snap);
  return gs.activePlayers || [];
}

// Every test starts from the same globals main.js would have set at boot.
beforeEach(() => {
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat, bKey });
});

describe('houseguests have a plan', () => {
  it('gives everybody one, shaped by how well they plan', () => {
    const house = atHouseOf(17);
    for (const name of house) {
      expect(housePlan(name), `${name} has no plan at all`).toBeTruthy();
    }
    // A mastermind and a floater must not plan identically. planStyle was
    // hardcoded to 'reactive' for every single houseguest.
    const styles = new Set(house.map(n => housePlan(n).planStyle));
    expect(styles.size, 'every houseguest plans exactly the same way').toBeGreaterThan(1);
  });

  it('fills the fields it declares, once the end is in sight', () => {
    // Each field is checked where it MEANS something rather than all at one
    // snapshot. A shield has to be a bigger threat than you, so by the final
    // eight there is often nobody left to hide behind and zero is the correct
    // answer — measured, shields run 3-6 of the house from seventeen down to
    // nine and then taper out. A goat is the mirror: it needs a jury to be
    // beatable in front of, so it does not exist early.
    const filledAt = (size, field) => {
      const house = atHouseOf(size);
      return house.filter(n => {
        const v = housePlan(n)?.[field];
        return Array.isArray(v) ? v.some(x => x && x !== n) : !!v;
      }).length;
    };

    // Every one of these was 0/N across a full measured season.
    expect(houseStage(atHouseOf(8).length)).not.toBe('early');
    expect(filledAt(12, 'shield'), 'nobody in the mid-game is hiding behind anybody').toBeGreaterThan(0);
    expect(filledAt(8, 'goat'), 'nobody has worked out who they beat').toBeGreaterThan(0);
    expect(filledAt(8, 'targets'), 'nobody is coming for anybody').toBeGreaterThan(0);
    expect(filledAt(12, 'preferredCore'), 'nobody is close to anybody').toBeGreaterThan(0);
    // Checked at eight OR six: the field fills as endgame deals form, and one
    // seed's season can legitimately reach eight with its deals still young —
    // measured across seeds it runs two to four players, but a single fixed
    // seed is a lottery ticket, and this assertion is about the FIELD working.
    expect(filledAt(8, 'betrayalConditions') + filledAt(6, 'betrayalConditions'),
      'nobody would ever turn on their own').toBeGreaterThan(0);
  });

  it('does not read a goat as somebody who has to like you', () => {
    // Total Drama needs a goat who keeps choosing you, so it requires a warm
    // relationship. The final Head of Household picks alone and the person
    // picked has no say, so hostility is no obstacle at all. Importing the
    // wrong show's constraint left the late house with no endgame reads.
    const house = atHouseOf(6);
    const goats = house.map(n => housePlan(n)?.goat).filter(Boolean);
    expect(goats.length, 'the final six have no idea who they would rather sit beside')
      .toBeGreaterThan(0);
  });

  it('explains every revision it makes', () => {
    const withChanges = SEASON.episodes.filter(ep => (ep.planChanges || []).length);
    expect(withChanges.length, 'nobody changed their mind all season').toBeGreaterThan(0);
    for (const ep of withChanges) {
      for (const c of ep.planChanges) {
        expect(c.reason, `a plan moved with no reason given: ${JSON.stringify(c)}`).toBeTruthy();
        expect(c.owner).toBeTruthy();
      }
    }
  });
});

describe('a plan changes what actually happens', () => {
  it('will not put its own shield on the block', () => {
    // The entire reason to keep a bigger player in the house is that they
    // absorb the shots. An HOH who nominates their own shield has not
    // understood their own strategy — and before the plan was wired in,
    // nominations could not see one.
    //
    // Measured as an AGGREGATE rate rather than per houseguest. The first
    // version counted individual offenders against a threshold, and with only
    // four shields in the house that made one unlucky draw a failure — a test
    // that samples rather than checks.
    // Sampled across three points in the season rather than one. A single
    // snapshot yields a handful of shield-holders, and with four of them the
    // difference between passing and failing is one person having a noisy week.
    const rates = [];
    for (const size of [12, 10, 8]) {
      let house;
      try { house = atHouseOf(size); } catch { continue; }
      for (const hoh of house) {
        const plan = housePlan(hoh);
        if (!plan?.shield || !house.includes(plan.shield)) continue;
        // Seeded. chooseNominationPlan falls back to Math.random, so sampling
        // it bare made this test roll fresh dice on every run — it passed alone
        // and failed in the suite purely because that is a different roll, and
        // the true rate sits close enough to the boundary to flip.
        let up = 0, seed = 1337 + hoh.length * 31 + size;
        const rng = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        for (let i = 0; i < 60; i++) {
          if (chooseNominationPlan(hoh, house, rng).nominees.includes(plan.shield)) up++;
        }
        rates.push(up / 60);
      }
    }
    expect(rates.length, 'nobody in the final ten is hiding behind anybody').toBeGreaterThan(0);

    // Asserted on the SPREAD, not the mean. nominationPlanPull scales the
    // shield discount by how well somebody plans, on purpose — a reactive
    // houseguest barely consults their own plan — so one mediocre planner
    // ignoring their shield is the design working, not failing. A mean hides
    // that behind a single outlier: three of four at 0% and one at 59% reads as
    // 15% and looks like nothing works.
    //
    // Two of roughly ten go up each week, so blind chance is about 20%.
    const disciplined = rates.filter(r => r < 0.2).length;
    expect(disciplined / rates.length, 'most Heads of Household ignore their own shield')
      .toBeGreaterThanOrEqual(0.6);
  });

  it('never holds somebody as shield and target at once', () => {
    // Revision could push a name onto `targets` without checking it was not the
    // shield, and the two pulls then cancel: a top target is +3.4 against the
    // shield's -7, which is how one houseguest ended up nominating their own
    // wall 62% of the time.
    for (const size of [12, 10, 8, 6]) {
      let house;
      try { house = atHouseOf(size); } catch { continue; }
      for (const name of house) {
        const plan = housePlan(name);
        if (!plan?.shield) continue;
        expect(plan.targets || [], `${name} is hiding behind ${plan.shield} and hunting them`)
          .not.toContain(plan.shield);
      }
    }
  });

  it('keeps a final two off the block', () => {
    const house = atHouseOf(9);
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
  });
});

describe('promises about the end', () => {
  it('does not let the house saturate with them', () => {
    // Twenty-eight live final twos between ten houseguests makes the strongest
    // promise in the game worth nothing.
    const house = atHouseOf(10);
    for (const name of house) {
      expect(endgameDealsOf(name).length, `${name} is holding too many endgame deals`)
        .toBeLessThanOrEqual(3);
    }
  });

  it('records the two sides separately, because they rarely agree', () => {
    const house = atHouseOf(11);
    const seen = [];
    for (const a of house) for (const d of endgameDealsOf(a)) if (!seen.includes(d)) seen.push(d);
    for (const deal of seen) {
      for (const n of deal.players) {
        const s = sincerityOf(deal, n);
        expect(s, 'sincerity is out of range').toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(1);
      }
    }
  });

  it('can be broken by a vote, not only at the very end', () => {
    // Only the final cut could break one, so a measured season made thirty-odd
    // final twos and broke exactly zero of them before the final three.
    const broke = SEASON.episodes.reduce((n, ep) => n + (ep.dealBreaks || []).length, 0);
    expect(broke, 'nobody went back on the end all season').toBeGreaterThan(0);
  });

  it('tells the user when somebody does', () => {
    const ep = SEASON.episodes.find(e => (e.dealBreaks || []).length);
    expect(ep, 'no promise was broken in the recorded season').toBeTruthy();
    // The transcript reads live state for some sections, so put the world back
    // the way it was when this episode happened.
    restore(SEASON.byHouseSize.get((ep.houseAtStart || []).length - 1) || SEASON.byHouseSize.get(3));
    const text = generateBBSummaryText(ep);
    expect(text, 'a promise was broken and the transcript never mentions it')
      .toContain('PROMISES BROKEN');
    expect(text).toContain(ep.dealBreaks[0].breaker);
  });
});

describe('the final cut', () => {
  it('reaches the last night with something actually promised', () => {
    const cut = replayFinale();
    expect(cut, 'the season never reached a final cut').toBeTruthy();
    expect(cut.finalHoh).toBeTruthy();
    // The projection is still computed — it is one of the two readings, not
    // the only one any more.
    expect(cut.projected, 'the jury projection was never taken').toBeTruthy();
  });

  it('keeps a promise it means, even against the projection', () => {
    // The one moment in Big Brother where a final two is publicly honoured or
    // broken. It used to be resolved on projected jury margin alone, so nobody
    // ever kept their word because nobody was ever asked to.
    const base = replayFinale();
    const cut = replayFinale(house => {
      const hoh = base.finalHoh;
      // Deliberately promise the HARDER opponent — the one the projection says
      // to cut — so keeping it costs something.
      const harder = house.find(n => n !== hoh && n !== base.projected);
      if (harder) soloPromise(hoh, harder, 1);
    });
    expect(cut.honoured, 'a fully sincere final two was not honoured').toBeTruthy();
    expect(cut.kept, 'they honoured the deal but sat beside somebody else')
      .toBe(cut.honoured.partner);
  });

  it('breaks one it does not, and the jury is told', () => {
    const base = replayFinale();
    let partner = null;
    const cut = replayFinale(house => {
      const hoh = base.finalHoh;
      partner = house.find(n => n !== hoh && n !== base.projected);
      if (!partner) return;
      soloPromise(hoh, partner, 0);
      // Somebody who would not keep it for its own sake. Loyalty is the floor
      // in honoursDeal(), so a loyal player keeps even an insincere deal when
      // keeping it is free — which is correct, and not what we are testing.
      const p = players.find(x => x.name === hoh);
      if (p?.stats) p.stats.loyalty = 0;
    });
    if (!partner) return;
    expect(cut.betrayal, 'an insincere final two survived the final cut').toBeTruthy();
    expect(cut.betrayal.partner).toBe(partner);
    expect(cut.kept, 'they broke the deal and still sat beside the same person')
      .not.toBe(partner);
    // A broken final two is the most punished move in this game; the jury has
    // to know it happened.
    // The deal broken AT THE FINALE, matched by the reason the finale writes.
    // Two narrower matches both picked the wrong deal: nominations now break
    // promises mid-season, so the same PAIR can carry an older break — never
    // exposed to a jury, because it happened in week four — and find() returns
    // whichever came first in the array.
    const broken = (gs.sideDeals || []).find(d => d.broken && d.brokenBy === cut.finalHoh
      && (d.players || []).includes(partner)
      && d.brokenReason === 'cut them at the final three');
    expect(broken, 'the break was never recorded on the deal').toBeTruthy();
    expect(broken.exposedTo, 'the jury was never told').toContain(partner);
  });
});
