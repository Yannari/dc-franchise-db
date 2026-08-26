// DOES THE ROOM ACTUALLY WORK ANYTHING OUT?
//
// Spec section 13, step 6: "If a Round Table does not produce a believable
// banishment here, nothing else matters — stop and fix it before building
// anything else." This file is that check, and it is the reason this plan
// exists before any screen, any mission and any conclave.
//
// A green unit suite proves beliefs update. It does not prove a castle deduces.
// These are population measurements over many seeded seasons, and a failure here
// is a DESIGN failure, not a flaky test — do not widen a band to make it pass.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { pStats } from '../js/players.js';
import { learn } from '../js/knowledge.js';
import { alignmentFactId, ballotEvidence, suspicionBoard } from '../js/tr/deduction.js';
import { alignmentAt } from '../js/tr/roles.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

// franchise_roster.json is { players: [...] }, NOT a bare array. Reaching for
// roster.slice() throws; this is the shape the file actually has.
const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
// Sixty seasons is not enough seasons.
//
// Measured across 40 disjoint 60-season blocks, the lift band failed 1 in 40
// (min 1.37), the faithful-win band 3 in 40 and SHARPENS 2 in 40 — about 15% of
// blocks would go red on an engine nobody had touched. The suite is not flaky
// (the seeds are fixed 1..60), but the headroom it reports is optimistic and the
// particular block it reports flatters the result. Two hundred seasons costs a
// few seconds and turns a population estimate into one.
const SEASONS = 200;

function run(n = SEASONS, traitorCount = 3, evidence = undefined) {
  setPlayers(ROSTER);
  return Array.from({ length: n }, (_, i) =>
    playTraitorsSeason({ cast: CAST, traitorCount, seed: i + 1, ...(evidence ? { evidence } : {}) }));
}

// == THE PLACEBO ========================================================
//
// A season with identical population dynamics, the identical
// chooseBanishmentVote, the identical Round Table -- and the ballot-reading
// layer replaced by three beliefs per observer per round, at `deduced` 0.5,
// about a UNIFORMLY RANDOM living player. There is no information in it at all.
//
// It is here because a green tick on the bands below is not evidence that this
// engine deduces anything, and the only way to know that is to run something
// which provably does not and see what it scores. The answer is uncomfortable
// and belongs in the file rather than in a report nobody reads: the placebo
// BEATS the real engine on raw detection -- 40.7% against 27.0%, lift 2.48x
// against 1.29x -- because _assess() in js/knowledge.js reads the fact's ground
// truth and marks a belief about a Faithful `valence: 'false'` at a rate scaled
// by mental and intuition, and suspicion() maps that to zero. Feed it pure noise
// and it hands back an alignment oracle. That is intended design (spec 4.2,
// "sharp readers see through the frame") and it is NOT to be removed -- but it
// means the raw hit rate, the raw lift and every band derived from them measure
// the oracle far more than they measure inference, and no future change to this
// engine can be judged by them.
//
// What the placebo cannot do is LEARN. Its lift is about the same on the first
// banishment as on the last, because a random belief in round eight is worth
// exactly what a random belief in round two was. That is the one axis on which
// inference is visible, and the band below is on that axis and only that axis.
//
// THE DENSITY k IS NOT A FREE CHOICE, so it is not made once and forgotten.
// The placebo's growth depends on how much noise it pours in, and it depends on
// it steeply -- measured over 200 seasons:
//
//     k=1  ->  +16.2pp        k=3  ->  +5.8pp        k=6  ->  -2.0pp
//
// A thin placebo has blank boards early and full ones late, which manufactures
// growth out of nothing; a thick one saturates immediately and shows none. A
// guard written against k=3 alone would have been passed by a control that
// BREAKS it at k=1. So the band below runs all three and asserts against the
// WORST (highest-growth) of them. It costs two extra 200-season runs, about a
// second, and it removes an arbitrary constant from the only band in this file
// that isolates inference by construction.
function placeboEvidence(k) {
  return function (ep, rng) {
    const living = gs.activePlayers || [];
    for (const observer of living) {
      for (let i = 0; i < k; i++) {
        const subject = living[Math.floor(rng() * living.length)];
        if (!subject || subject === observer) continue;
        learn(observer, alignmentFactId(subject),
          { source: 'a feeling', sourceType: 'deduced', confidence: 0.5, ep, rng });
      }
    }
    return [];
  };
}
const PLACEBO_K = [1, 3, 6];
const SHIPPED_K = 3;

/**
 * BOARD PRECISION: how often the person a Faithful most suspects IS a Traitor,
 * over the Traitor base rate at that moment, counting ONLY observers who hold a
 * read at all.
 *
 * This is the metric that survives noise injection, and that is the whole
 * reason it is here. Bolting zero-information beliefs onto the real engine
 * RAISES the aggregate lift (1.52x -> 2.54x, measured on this engine; 1.29x ->
 * 2.42x before the duplicate reveal walk was deleted), because that number
 * rewards COVERAGE: more beliefs means more chances for _assess()'s
 * ground-truth oracle to clear an innocent, and the room votes better without
 * having reasoned better. Dividing by the number of non-blank boards prices
 * that out -- adding noise buys more boards, not better ones, and a diluted
 * board is a worse board.
 *
 * It wraps the evidence hook rather than touching the engine: suspicionBoard()
 * is a pure read (believes() draws no randomness), so the probe is inert and
 * the probed seasons reproduce the unprobed hit rate to the digit.
 */
function boardProbe(inner, acc) {
  return (ep, rng) => {
    const out = inner(ep, rng);
    const living = gs.activePlayers || [];
    const traitors = living.filter(n => alignmentAt(n, ep) === 'traitor').length;
    if (!living.length || !traitors) return out;
    for (const observer of living) {
      if (alignmentAt(observer, ep) === 'traitor') continue;   // they were told; not deducing
      const top = suspicionBoard(observer, ep)[0];
      if (!top || top.score <= 0) { acc.blank++; continue; }   // no read at all: not counted
      acc.n++;
      acc.nul += traitors / (living.length - 1);               // chance, for THIS observer
      if (alignmentAt(top.name, ep) === 'traitor') acc.hit++;
    }
    return out;
  };
}
function boardPrecision(evidence) {
  const acc = { hit: 0, n: 0, nul: 0, blank: 0 };
  run(SEASONS, 3, boardProbe(evidence, acc));
  return { n: acc.n, blank: acc.blank,
    precision: (acc.hit / acc.n) / (acc.nul / acc.n),
    blankShare: acc.blank / (acc.n + acc.blank) };
}

/** Hit rate, and the chance rate that applied at each individual banishment. */
function liftOver(seasons, pick) {
  let hits = 0, total = 0, nul = 0;
  seasons.forEach(s => {
    const bans = s.log.filter(r => r.banished);
    pick(bans).forEach(r => { total++; nul += r.traitorsAtVote / r.aliveAtVote; if (r.wasTraitor) hits++; });
  });
  return { lift: hits / total - nul / total, rate: hits / total, nul: nul / total, total };
}
const EARLY = b => b.slice(0, Math.floor(b.length / 2));
const LATE = b => b.slice(Math.floor(b.length / 2));
const ALL = b => b;

describe('the castle, measured over many seasons', () => {
  const seasons = run();

  it('finishes every season without hanging or crashing', () => {
    expect(seasons.length).toBe(SEASONS);
    seasons.forEach(s => {
      expect(s.log.length).toBeGreaterThan(2);
      expect(['traitors', 'faithfuls']).toContain(s.winner);
    });
  });

  // A BELIEVABLE BANISHMENT, AND THE TWO PHASES IT HAS.
  //
  // What used to stand here was a single aggregate lift floor of 1.4x, and it
  // conflated two halves of a season WHOSE CORRECT SIGNS ARE OPPOSITE. Early,
  // the room knows nothing and the Traitors steer it -- the format's early
  // banishments are supposed to hit Faithfuls, and an engine that is sharp on
  // night three is not simulating this show. Late, every reveal has converted a
  // round of meaningless ballots into a round of meaningful ones, and the lift
  // must be strongly positive. Averaging a number that should be negative with
  // one that should be large gave a gate neither half could fail honestly and
  // that a change in either direction could move.
  //
  // So: the plan's own spec-derived floor on the raw rate (spec section 13 step
  // 6, "a believable banishment"), plus one band per phase, each with its sign.
  it('BEATS CHANCE: a believable banishment, with the right shape by phase', () => {
    // The null is not a constant, and getting that wrong is the easiest way to
    // award this engine credit it has not earned. Three Traitors in twenty is
    // 15.8% on night one only. The murder removes a FAITHFUL every round and
    // nothing but a banishment ever removes a Traitor, so Traitor density climbs
    // monotonically all season -- by the eighth banishment a coin flip hits a
    // Traitor 27% of the time. Averaged over the real population trajectory the
    // aggregate null is ~20.9%, not 15%.
    let hits = 0, total = 0, nullSum = 0;
    seasons.forEach(s => s.log.forEach(r => {
      if (!r.banished) return;
      total++;
      nullSum += r.traitorsAtVote / r.aliveAtVote;   // chance, at the moment of THIS vote
      if (r.wasTraitor) hits++;
    }));
    expect(total, 'nothing was banished -- this metric would be vacuous').toBeGreaterThan(100);
    const rate = hits / total, nul = nullSum / total;
    const early = liftOver(seasons, EARLY), late = liftOver(seasons, LATE);
    console.log(`traitor-hit rate: ${(rate * 100).toFixed(1)}% over ${total} banishments `
      + `(null ${(nul * 100).toFixed(1)}%)`);
    console.log(`early lift ${(early.lift * 100).toFixed(1)}pp (n=${early.total})   `
      + `late lift ${(late.lift * 100).toFixed(1)}pp (n=${late.total})`);

    // THE DIAGNOSTIC THAT IS NOT A GATE, AND MUST NEVER BE MADE ONE AGAIN.
    //
    // Aggregate lift scores _assess()'s ground-truth valence COVERAGE far more
    // than it scores inference. It is monotone in how many beliefs sit in the
    // store, whatever those beliefs contain: bolting pure zero-information noise
    // onto the real engine takes it from 1.52x to 2.54x, and the standalone
    // placebo scores 2.48x against this engine's 1.52x. A floor on it rewards an
    // engine for forming MORE reads, not better ones, and any future change can
    // be made to pass it by adding noise. Printed, because a sudden collapse is
    // still worth seeing. Asserted nowhere. The band that actually isolates
    // inference is BOARD PRECISION, below.
    console.log(`[diagnostic, NOT a gate] aggregate lift ${(rate / nul).toFixed(2)}x`);

    // The plan's operationalisation of "a believable banishment".
    expect(rate, 'the room is banishing at random -- the deduction layer is not working')
      .toBeGreaterThan(0.22);

    // EARLY: the room must NOT be sharp on night three. A positive early lift
    // means somebody arrived at the first Round Table already knowing things,
    // which is a leak and not a feature. Measured -4.7 to -6.8pp across four
    // disjoint 200-season blocks, so the band flags a leak, not block noise.
    expect(early.total, 'no early banishments to measure').toBeGreaterThan(40);
    expect(early.lift, 'the room is already sharp in the first half -- information is leaking in early')
      .toBeLessThan(0.05);

    // LATE: by the second half every reveal has re-scored a round of ballots,
    // and the endgame is supposed to be the sharpest table of the season.
    // Measured +20.8 to +25.5pp across the same four blocks.
    expect(late.total, 'no late banishments to measure').toBeGreaterThan(40);
    expect(late.lift, 'the endgame is no sharper than chance -- the reveal cascade is not landing')
      .toBeGreaterThan(0.15);
  });

  // SANITY CHECK, NOT A GATE. This band cannot fail on anything that runs. The
  // no-evidence control passes it at 13.0% and the placebo passes it at 68.5%.
  // Both bounds are real design statements -- a castle that always finds them is
  // as broken as one that never does -- and both are worth keeping as a shape
  // check on the population dynamics. Neither is evidence of deduction, and a
  // green tick here must never be read as any.
  it('SANITY: the faithfuls neither always nor never win', () => {
    const faithfulWins = seasons.filter(s => s.winner === 'faithfuls').length / seasons.length;
    console.log(`faithful win rate: ${(faithfulWins * 100).toFixed(1)}%`);
    // The real format is Traitor-favoured. A castle that always finds them is
    // as broken as one that never does, and far less fun.
    expect(faithfulWins).toBeGreaterThan(0.10);
    expect(faithfulWins, 'the faithfuls are solving it every time').toBeLessThan(0.75);
  });

  it('SHARPENS: the LIFT OVER CHANCE grows as the season goes on', () => {
    // Raw hit rate cannot tell learning from arithmetic. A uniform-random voter
    // ALSO shows late > early — 16.6% to 22.7% when measured — purely because
    // Traitor density drifts upward as Faithfuls are murdered. A band on the raw
    // rate is therefore passed by an engine with no deduction in it at all, which
    // makes it worse than no band.
    //
    // So both halves are measured against the chance rate that applied at each
    // individual banishment, and what must grow is the LIFT. Under the random
    // control this goes red exactly as it should: -0.6pp early, -2.8pp late.
    const early = liftOver(seasons, EARLY);
    const late = liftOver(seasons, LATE);
    expect(early.total, 'no early banishments to measure').toBeGreaterThan(40);
    expect(late.total, 'no late banishments to measure').toBeGreaterThan(40);
    console.log(`early ${(early.rate * 100).toFixed(1)}% vs null ${(early.nul * 100).toFixed(1)}% = lift ${(early.lift * 100).toFixed(1)}pp (n=${early.total})`);
    console.log(`late  ${(late.rate * 100).toFixed(1)}% vs null ${(late.nul * 100).toFixed(1)}% = lift ${(late.lift * 100).toFixed(1)}pp (n=${late.total})`);
    expect(late.lift, 'the room learns nothing as the season goes on').toBeGreaterThan(early.lift + 0.05);
    expect(late.lift, 'late banishments are no better than chance').toBeGreaterThan(0.10);
  });

  // THE UPPER BOUND IS A GATE; THE LOWER BOUND IS A SANITY CHECK. A room
  // following one shared scalar converges on 1.0, and 0.55 catches that. The
  // floor catches nothing: with ~13 ballots over ~12 candidates pure noise
  // concentrates more than intuition suggests, and both controls sail through it
  // -- the no-evidence control reads 32.4% and the placebo 31.2%, against the
  // engine's 32.8%. Kept because the shape is worth watching, labelled so nobody
  // reads its green tick as a sign the room agrees about anything real.
  it('SANITY: the room votes as neither a bloc nor a coin', () => {
    // The band this replaces asked whether two distinct names got a vote. With
    // ~13 ballots, a noise term on every score and Traitors structurally barred
    // from naming the pact, at least one vote always diverges — so it read
    // 100.0%, and it would read 100.0% on an engine with no deduction in it.
    // A metric that cannot go red is not a metric.
    //
    // Plurality share — the winner's votes over the ballots cast — has a failure
    // mode in BOTH directions. A room following a single shared scalar converges
    // on 1.0; a room with no shared read at all cannot concentrate votes.
    // Measured here: 31.3-32.6% across five disjoint 60-season blocks.
    let shares = [], marginSum = 0, closeRounds = 0, roundCount = 0;
    seasons.forEach(s => (s.rounds || []).forEach(r => {
      const t = {};
      (r.ballots || []).forEach(b => { t[b.voted] = (t[b.voted] || 0) + 1; });
      const counts = Object.values(t).sort((a, b) => b - a);
      const cast = (r.ballots || []).length;
      if (!counts.length || !cast) return;
      roundCount++;
      shares.push(counts[0] / cast);
      marginSum += counts[0] - (counts[1] || 0);
      if (counts[0] - (counts[1] || 0) <= 1) closeRounds++;
    }));
    expect(roundCount, 'no round tables to measure').toBeGreaterThan(100);
    const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
    console.log(`mean plurality share: ${(mean * 100).toFixed(1)}% over ${roundCount} round tables `
      + `(mean winning margin ${(marginSum / roundCount).toFixed(2)} votes, `
      + `${(closeRounds / roundCount * 100).toFixed(1)}% decided by <=1)`);
    expect(mean, 'nobody agrees with anybody — there is no shared read in the room').toBeGreaterThan(0.20);
    expect(mean, 'the room is voting as one bloc, not deducing').toBeLessThan(0.55);
  });

  it('BEATS THE PLACEBO: only the real engine gets better as it learns', () => {
    // Noise cannot get better at the job -- a random belief in the last round is
    // worth exactly what a random belief in the first one was -- so the metric is
    // not the lift (the placebo WINS that; see its definition above), it is how
    // much the lift GROWS from the first half of a season's banishments to the
    // second.
    //
    // Run against three noise densities and judged against the worst of them,
    // because the placebo's growth is steeply k-dependent (k=1 +16.2pp, k=3
    // +5.8pp, k=6 -2.0pp) and the old guard of 0.12 was written against k=3
    // alone -- a control at k=1 would have broken it. Asserting on the MAX
    // removes that arbitrary constant from the one band here that cannot be
    // gamed by adding beliefs.
    const rEarly = liftOver(seasons, EARLY), rLate = liftOver(seasons, LATE);
    const rAll = liftOver(seasons, ALL);
    const realGrowth = rLate.lift - rEarly.lift;
    console.log(`engine : ${(rEarly.lift * 100).toFixed(1)}pp -> ${(rLate.lift * 100).toFixed(1)}pp`
      + ` (grows ${(realGrowth * 100).toFixed(1)}pp, raw lift ${(rAll.rate / rAll.nul).toFixed(2)}x)`);

    let worstGrowth = -Infinity, worstK = null, minTotal = Infinity;
    for (const k of PLACEBO_K) {
      const placebo = run(SEASONS, 3, placeboEvidence(k));
      const pEarly = liftOver(placebo, EARLY), pLate = liftOver(placebo, LATE);
      const pAll = liftOver(placebo, ALL);
      const growth = pLate.lift - pEarly.lift;
      console.log(`placebo k=${k}: ${(pEarly.lift * 100).toFixed(1)}pp -> ${(pLate.lift * 100).toFixed(1)}pp`
        + ` (grows ${(growth * 100).toFixed(1)}pp, raw lift ${(pAll.rate / pAll.nul).toFixed(2)}x)`);
      minTotal = Math.min(minTotal, pEarly.total);
      if (growth > worstGrowth) { worstGrowth = growth; worstK = k; }
    }
    console.log(`worst placebo: k=${worstK} at ${(worstGrowth * 100).toFixed(1)}pp`);

    expect(minTotal, 'a placebo produced no banishments to compare against').toBeGreaterThan(100);
    // Measured worst is k=1 at +16.2pp. A control that climbs past 20pp is
    // manufacturing growth out of its own blank-board rate and is no longer a
    // control -- which is a finding about the harness, not about the engine, and
    // the message says so.
    expect(worstGrowth, 'a placebo density is LEARNING -- it has information in it and is no longer a control')
      .toBeLessThan(0.20);
    expect(realGrowth, 'the engine sharpens no faster than pure noise does -- the ballot layer is inert')
      .toBeGreaterThan(worstGrowth + 0.05);
  });

  // THE BAND THAT ISOLATES INFERENCE, AND THE ONLY ONE NOISE INJECTION CANNOT
  // GAME.
  //
  // Every rate-and-lift band in this file is a COVERAGE measure in disguise:
  // they count how often the room lands on a Traitor, so they reward an engine
  // for holding more reads regardless of whether the reads are any good. That is
  // why bolting a pure-noise stream onto the real engine takes its aggregate
  // lift from 1.52x to 2.54x, and why that number was demoted to a diagnostic.
  //
  // Measured, engine + a k=3 noise stream on top: aggregate lift 1.52x -> 2.54x
  // (up, and clear of any floor anyone would write), early lift -5.7pp ->
  // +21.7pp, growth 31.2pp -> 5.9pp, and BOARD PRECISION 2.11x -> 1.68x. The
  // early band, the growth band and this one all go red on it. The lift floor
  // that used to be the gate goes green. That is the whole argument.
  //
  // This one conditions on HOLDING A READ. For each living Faithful at each
  // banishment, take the top of their suspicion board and ask whether it is a
  // Traitor, against the Traitor base rate at that moment, counting only
  // non-blank boards. Noise added to this engine buys more boards and dilutes
  // each one, so it moves the number DOWN, not up. It is the axis on which the
  // review found the engine genuinely better than the control: fewer reads
  // (65% blank against the placebo's 11%) but sharper ones.
  it('BOARD PRECISION: when a faithful holds a read, it is a better read than noise', () => {
    const engine = boardPrecision(ballotEvidence);
    const placebo = boardPrecision(placeboEvidence(SHIPPED_K));
    console.log(`engine board : ${engine.precision.toFixed(2)}x over ${engine.n} non-blank boards`
      + ` (${(engine.blankShare * 100).toFixed(1)}% blank)`);
    console.log(`placebo board: ${placebo.precision.toFixed(2)}x over ${placebo.n} non-blank boards`
      + ` (${(placebo.blankShare * 100).toFixed(1)}% blank)`);

    // Non-vacuity: a run that formed almost no reads would make the ratio
    // meaningless however good it looked.
    expect(engine.n, 'almost nobody ever held a read -- this ratio is noise').toBeGreaterThan(2000);
    expect(placebo.n, 'the placebo held no reads to compare against').toBeGreaterThan(2000);

    // Measured: engine 1.94-2.11x across four disjoint 200-season blocks,
    // shipped placebo 1.70x. The margin of 0.15 is honest headroom under the
    // worst engine block (1.94 - 1.70 = 0.24), not under the best.
    //
    // WRITTEN DOWN BECAUSE IT IS THE THIN PART: the placebo's board precision is
    // also k-dependent and rises as it thins out (k=6 1.63x, k=3 1.70x, k=1
    // 1.87x), because a sparse noise stream leaves _assess()'s oracle a larger
    // share of the few boards that exist. Against a k=1 control the engine's
    // margin would be ~0.07, not ~0.30. The comparison is deliberately against
    // the SHIPPED placebo, the same control the growth band uses, and the number
    // to watch if this band ever goes red is the blank share -- an engine that
    // starts forming many more reads will trade precision for coverage.
    expect(engine.precision,
      'the engine reads no better than pure noise does when it has a read at all')
      .toBeGreaterThan(placebo.precision + 0.15);
  });

  // ── THE TWO BANDS THIS PLAN EARNS ─────────────────────────────────
  it('MURDERS THE COALITION: the victim is better connected than average', () => {
    // The visibility trap, from the Traitors' side: murder is the only tool
    // that works on somebody the table will never remove, so a conclave that
    // is reasoning at all should skew toward the well-liked. If this fails,
    // the conclave is picking at random and the tool-allocation term in
    // formPreference is inert.
    //
    // The field is every living player at the moment of the attempt, the
    // victim included. Including them biases the comparison AGAINST the claim,
    // which is the direction a band should be wrong in.
    let victimSocial = 0, victims = 0, fieldSocial = 0, field = 0;
    seasons.forEach(s => s.log.forEach(r => {
      if (!r.murdered) return;
      victimSocial += (pStats(r.murdered).social || 5); victims++;
      (r.livingAtMurder || []).forEach(n => { fieldSocial += (pStats(n).social || 5); field++; });
    }));
    expect(victims, 'no murders happened at all').toBeGreaterThan(200);
    expect(field, 'the harness recorded no living field to compare against').toBeGreaterThan(2000);
    const vAvg = victimSocial / victims, fAvg = fieldSocial / field;
    console.log(`victim social ${vAvg.toFixed(2)} vs field ${fAvg.toFixed(2)} `
      + `(+${(vAvg - fAvg).toFixed(2)}) over ${victims} murders`);
    // Measured +0.92 to +1.05 across five disjoint 200-season blocks. The band
    // is the plan's own wording — above the living average — rather than a
    // margin, because the margin is a property of how the roster's `social`
    // happens to be distributed and a future roster would move it without any
    // change to the conclave. The margin band below sits at roughly half the
    // smallest measured value (0.92), which is headroom no random picker could
    // reach — a random victim scores +0.00 by definition.
    expect(vAvg, 'the conclave murders at random — tool allocation is inert')
      .toBeGreaterThan(fAvg);
    expect(vAvg - fAvg, 'the skew toward the well-liked has collapsed to noise')
      .toBeGreaterThan(0.5);
  });

  // A BLOCKED MURDER IS VISIBLE — AND TODAY IT STRUCTURALLY CANNOT HAPPEN.
  //
  // This is the band the plan asks for, inverted into a TRIPWIRE, and the
  // inversion is the honest form of it right now. `grantShield` has exactly one
  // caller in the whole repo and it is tests/tr-murder.test.js: Shields are won
  // in missions, missions are Plan 5, and until they exist no season can
  // produce a night where nobody dies. Writing `toBeGreaterThan(0)` today would
  // be a band that is red on arrival and would be "fixed" by someone deleting
  // it; asserting the zero says the same thing and cannot be silently lost.
  //
  // PLAN 5 MUST REPLACE THIS. The moment a mission awards a Shield this test
  // goes red, and the correct response is to measure the blocked-murder count
  // and swap the assertion for the plan's original:
  //     expect(blocked, 'the shield path never fired').toBeGreaterThan(0);
  //
  // The path itself is NOT unexercised in the meantime — tests/tr-murder.test.js
  // grants a Shield directly and asserts that the murder is blocked, that the
  // Shield is spent anyway, that the attempt is recorded, and (in
  // tr-murder.test.js's suppression test) that a blocked night forms no belief
  // while an otherwise identical unblocked night does. What is untested is only
  // whether a SEASON ever reaches that state on its own, and today it cannot.
  it('A BLOCKED MURDER IS VISIBLE: awaiting Plan 5 — nothing grants a shield yet', () => {
    const blocked = seasons.reduce((n, s) => n + (s.blockedMurders?.length || 0), 0);
    const murders = seasons.reduce((n, s) => n + s.log.filter(r => r.murdered).length, 0);
    console.log(`blocked murders across ${seasons.length} seasons: ${blocked} `
      + `(against ${murders} completed murders) — structurally zero until missions exist`);
    expect(murders, 'no murders at all: this comparison would be vacuous').toBeGreaterThan(200);
    expect(blocked,
      'A SHIELD FIRED IN A SEASON. Plan 5 has landed: measure the count and replace '
      + 'this tripwire with expect(blocked).toBeGreaterThan(0).').toBe(0);
  });

  it('replays identically from a seed', () => {
    const a = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 99 });
    const b = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 99 });
    expect(a.log.map(r => r.banished)).toEqual(b.log.map(r => r.banished));
    expect(a.winner).toBe(b.winner);
  });

  it('starts genuinely fresh: no beliefs leak between seasons', () => {
    // A half-reset world — new rounds and a new roster but the OLD knowledge
    // store — inflates the detection rate and gives a false pass on the gate.
    // If anything leaked, an intervening season would perturb the replay.
    const first = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 4242 });
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 777 });
    playTraitorsSeason({ cast: CAST, traitorCount: 2, seed: 31337 });
    const again = playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 4242 });
    expect(again.traitors).toEqual(first.traitors);
    expect(again.log.map(r => `${r.banished}/${r.murdered}`))
      .toEqual(first.log.map(r => `${r.banished}/${r.murdered}`));
  });
});
