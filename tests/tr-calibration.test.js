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
import { learn } from '../js/knowledge.js';
import { alignmentFactId } from '../js/tr/deduction.js';
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
function placeboEvidence(ep, rng) {
  const living = gs.activePlayers || [];
  for (const observer of living) {
    for (let i = 0; i < 3; i++) {
      const subject = living[Math.floor(rng() * living.length)];
      if (!subject || subject === observer) continue;
      learn(observer, alignmentFactId(subject),
        { source: 'a feeling', sourceType: 'deduced', confidence: 0.5, ep, rng });
    }
  }
  return [];
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

  // THIS BAND IS CURRENTLY RED, AND IT IS NOT TO BE WIDENED.
  //
  // It reads 1.29x against its 1.4 floor. It went red when the harness stopped
  // measuring the engine with every bond pinned at zero (see _seedStartingBonds
  // in tr/headless.js): bondResistance() was exactly 1.0 in every number this
  // band was ever calibrated against, so the floor was set on an engine with one
  // of its levers disabled. With bonds live the value sits near 1.3-1.4 for any
  // reasonable starting spread, against a standard error of about 0.06. The
  // deduction did not get worse -- the belief gap between a Traitor and a
  // Faithful is unchanged -- what changed is that a warm bond can now carry
  // somebody through a table, which is the mechanism the design asked for.
  //
  // Note also what this band CANNOT do, whatever number it is set to: the
  // placebo passes it at 2.48x, well clear of the engine's own score. Raw lift
  // measures the _assess() oracle far more than it measures inference. Fixing
  // the red honestly means making the ballot layer contribute more, or accepting
  // a lower floor as a deliberate, argued decision -- not moving the number so
  // the tick goes green.
  it('BEATS CHANCE: banishments beat the SHIFTING null, not the premiere one', () => {
    // The null here is not a constant, and getting that wrong is the easiest way
    // to award this engine credit it has not earned. Three Traitors in twenty is
    // 15.8% on night one only. The murder removes a FAITHFUL every round and
    // nothing but a banishment ever removes a Traitor, so Traitor density climbs
    // monotonically all season — by the eighth banishment a coin flip hits a
    // Traitor 27% of the time. Averaged over the real population trajectory the
    // aggregate null is 19.1%, not 15%.
    //
    // So this asserts two things: the fixed floor the plan specified, AND a real
    // multiple of the null actually observed in these seasons. A uniform-random
    // voter scores 0.92x its own null; this engine scores 1.8x.
    let hits = 0, total = 0, nullSum = 0;
    seasons.forEach(s => s.log.forEach(r => {
      if (!r.banished) return;
      total++;
      nullSum += r.traitorsAtVote / r.aliveAtVote;   // chance, at the moment of THIS vote
      if (r.wasTraitor) hits++;
    }));
    expect(total, 'nothing was banished — this metric would be vacuous').toBeGreaterThan(100);
    const rate = hits / total, nul = nullSum / total;
    console.log(`traitor-hit rate: ${(rate * 100).toFixed(1)}% over ${total} banishments `
      + `(null ${(nul * 100).toFixed(1)}%, lift ${(rate / nul).toFixed(2)}x)`);
    expect(rate, 'the room is banishing at random — the deduction layer is not working').toBeGreaterThan(0.22);
    expect(rate / nul, 'the hit rate is just Traitor density, not deduction').toBeGreaterThan(1.4);
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
    // THE ONE BAND THAT CANNOT BE PASSED BY AN ENGINE WITH NO INFERENCE IN IT.
    //
    // Every other number in this file is passed by the placebo, most of them
    // comfortably -- see its definition above, where it scores a HIGHER raw lift
    // than the real engine does. The one thing noise cannot do is get better at
    // the job, because a random belief in the last round is worth exactly what a
    // random belief in the first one was. So the metric is not the lift; it is
    // how much the lift GROWS from the first half of a season's banishments to
    // the second, and the comparison is against a placebo run inside the same
    // measurement rather than against a constant somebody wrote down once.
    const placebo = run(SEASONS, 3, placeboEvidence);
    const rEarly = liftOver(seasons, EARLY), rLate = liftOver(seasons, LATE);
    const pEarly = liftOver(placebo, EARLY), pLate = liftOver(placebo, LATE);
    const rAll = liftOver(seasons, ALL), pAll = liftOver(placebo, ALL);
    const realGrowth = rLate.lift - rEarly.lift;
    const placeboGrowth = pLate.lift - pEarly.lift;
    console.log(`engine : ${(rEarly.lift * 100).toFixed(1)}pp -> ${(rLate.lift * 100).toFixed(1)}pp`
      + ` (grows ${(realGrowth * 100).toFixed(1)}pp, raw lift ${(rAll.rate / rAll.nul).toFixed(2)}x)`);
    console.log(`placebo: ${(pEarly.lift * 100).toFixed(1)}pp -> ${(pLate.lift * 100).toFixed(1)}pp`
      + ` (grows ${(placeboGrowth * 100).toFixed(1)}pp, raw lift ${(pAll.rate / pAll.nul).toFixed(2)}x)`);
    expect(pEarly.total, 'the placebo produced no banishments to compare against').toBeGreaterThan(100);
    expect(placeboGrowth, 'the placebo is LEARNING -- it has information in it and is no longer a control')
      .toBeLessThan(0.12);
    expect(realGrowth, 'the engine sharpens no faster than pure noise does -- the ballot layer is inert')
      .toBeGreaterThan(placeboGrowth + 0.05);
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
