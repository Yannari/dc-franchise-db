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
import { playTraitorsSeason, rngFor, _castleRngFor } from '../js/tr/headless.js';
import { _setContinuationGuard, _setContinuationSceneP } from '../js/tr/events.js';
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
// it steeply. Measured over twelve decorrelated 200-season blocks (an earlier
// note here read "k=1 -> +16.2pp, k=3 -> +5.8pp, k=6 -> -2.0pp", from a single
// block under the correlated seeding rngFor() has since fixed and before murder
// evidence existed):
//
//     k=1  ->  -1.7pp        k=3  ->  -12.6pp        k=6  ->  -17.1pp
//
// The ORDERING is what matters here and it has not changed: a thin placebo
// still manufactures the most growth and a thick one the least.
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

/**
 * DOES THE CASTLE CONTINUE A STORY, OR JUST START FORTY OF THEM?
 *
 * `continued / liveScenes`, and the choice of that denominator is the whole
 * measurement — see the long comment on the band below for why the obvious
 * alternative is unfailable.
 *
 *   liveScenes — draws whose actors already had an open thread with each
 *                other. The guard can only act where there is something to
 *                continue, so this is the only population it is visible in.
 *   continued  — draws that landed on an event which advances a thread those
 *                actors already had.
 *
 * Both flags are sampled inside pickEvent BEFORE fire() runs (see events.js):
 * afterwards a scene that had a live story is indistinguishable from one that
 * was just handed one.
 *
 * The rest is diagnostics — thread lengths, revivals from cold, payoffs —
 * printed and asserted nowhere, because none of them separates the guard from
 * the control.
 */
function continuity(seasons) {
  let firings = 0, liveScenes = 0, continued = 0;
  let threads = 0, beats = 0, revivals = 0, closed = 0, singleAndCold = 0;
  let pairSum = 0, peopleSum = 0, maxShareSum = 0;
  const lens = {};
  for (const s of seasons) {
    // COVERAGE, counted per season and averaged — never pooled. Pooling
    // distinct pairs across 200 seasons hides the failure this measures: a
    // season where one storyline eats every scene still contributes new pairs
    // to a pooled set, because it is a different cast from the season before.
    const pairs = new Set(), people = new Set(), pairCount = new Map();
    let scenesHere = 0;
    for (const r of s.log) {
      for (const f of (r.castleEvents || [])) {
        firings++; scenesHere++;
        if (f.liveThread) liveScenes++;
        if (f.continued) continued++;
        const a = f.actors || [];
        if (a.length >= 2) {
          const k = [...a].sort().join('|');
          pairs.add(k);
          pairCount.set(k, (pairCount.get(k) || 0) + 1);
        }
        for (const q of a) people.add(q);
      }
    }
    pairSum += pairs.size;
    peopleSum += people.size;
    // The share of THIS season's scenes taken by its single busiest pair. This
    // is the monopoly failure stated directly, and unlike a distinct-pair count
    // it does not fall just because the change is working.
    let busiest = 0;
    for (const v of pairCount.values()) busiest = Math.max(busiest, v);
    maxShareSum += scenesHere ? busiest / scenesHere : 0;
    for (const t of (s.threads || [])) {
      threads++;
      beats += t.beats.length;
      lens[t.beats.length] = (lens[t.beats.length] || 0) + 1;
      if (t.state === 'closed') closed++;
      else if (t.beats.length === 1) singleAndCold++;
      // Heat as heatAt() computes it, replayed over the beat log, so we can ask
      // what the heat WAS when each beat landed. A beat that arrives on a
      // thread already decayed to zero is the "she never let it go" revival
      // findOpenThread's parties-keyed lookup exists to make reachable.
      let heat = 0, lastEp = null;
      for (const b of t.beats) {
        if (lastEp != null) {
          const before = Math.max(0, heat - Math.max(0, b.ep - lastEp) * 0.5);
          if (before === 0) revivals++;
          heat = Math.min(4, before + 1);
        } else heat = 1;
        lastEp = b.ep;
      }
    }
  }
  return { firings, liveScenes, continued, threads, beats, revivals, closed,
    pairsPerSeason: pairSum / seasons.length,
    peoplePerSeason: peopleSum / seasons.length,
    maxPairShare: maxShareSum / seasons.length,
    rate: continued / liveScenes,
    liveShare: liveScenes / firings,
    advanceShare: (beats - threads) / beats,
    meanLen: beats / threads,
    revivalShare: revivals / beats,
    closedShare: closed / threads,
    deadShare: singleAndCold / threads,
    lens };
}

describe('the castle, measured over many seasons', () => {
  const seasons = run();

  // THE SCENE-SELECTION CONTROL ARM, shared by the two bands Plan 5 Task 1
  // earns. Same seeds, same content, CONTINUATION_SCENE_P zeroed - actor
  // selection back to a uniform draw over the living cast, which is exactly
  // the pre-Plan-5 engine. Computed once: two 200-season runs of the same
  // control would cost a second and tell us the same thing.
  //
  // It is a CONTROL and not a remembered base rate on purpose. A floor copied
  // out of a measurement goes stale the moment content changes; an assertion
  // that the same seeds with selection made uninformative come in on the wrong
  // side of that floor re-derives the separation on every run and cannot.
  const sceneOff = (() => {
    const restore = _setContinuationSceneP(0);
    try { return continuity(run()); } finally { restore(); }
  })();

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
    // which is a leak and not a feature.
    //
    // THE CEILING IS 0.10 AND IT USED TO BE 0.05. That is a band being
    // RE-DERIVED, not widened to fit, and the distinction is the whole reason
    // this comment is long.
    //
    // The 0.05 was measured before rngFor() hashed its seed (headless.js), and
    // every block measured under it was 200 replays of two or three Traitor
    // identities rather than 200 seasons. Seeds 1..200 — the block this file
    // ships — drew the roster's WEAKEST possible first Traitor 129 times out of
    // 200 and read +0.1pp; seeds 2001..2200 drew its strongest and read
    // +21.8pp. The engine's honest early lift on the decorrelated population is
    // 5.58pp (sd 1.77 over twelve 200-season blocks), so 0.05 was never a band
    // this engine passed — it was a band this SEED BLOCK passed.
    //
    // Repricing was tried first and rejected on measurement, not on taste: most
    // of the murder layer's early contribution comes from M.pushedThenDied, and
    // sweeping it 0.48/0.36/0.30/0.24/0.18 moves the twelve-block early mean
    // 5.58/6.30/6.15/5.71/4.22pp. Only 0.18 gets the MEAN under 5pp, its worst
    // block still reads 6.64pp, and it costs 2pp of late lift. There is no
    // price of this channel at which 0.05 is honestly green.
    //
    // RE-SWEPT AGAIN AFTER THE `clashTraced` DELETION, AND THE PRICE WENT UP,
    // NOT DOWN: 0.36 -> 0.62, the alignment credibility ceiling (see the
    // control-matched sweep in js/tr/deduction.js). Early lift went DOWN with
    // it — twelve-block mean 5.67 -> 3.95pp, worst block 7.38 -> 6.87pp — so
    // the loudest this channel can legally be is also the least early-leaky
    // this engine has measured. The 0.10 ceiling now has 3.1pp of headroom on
    // the worst block rather than 2.3pp, and it is still not tightened; see
    // below for what it can and cannot catch.
    //
    // So the band is re-derived from the observed distribution, and the reason
    // a room reading ~6pp above chance in the first half is CORRECT for this
    // format is the murder itself. Before Plan 3 the first half of a season
    // contained no evidence at all — ballots only re-score after a reveal, and
    // the early reveals have not happened yet — so early lift sat NEGATIVE and
    // a 5pp ceiling was generous. A murder is evidence that arrives on night
    // two and needs no reveal to be worth anything, and the room is supposed to
    // read it. The band's job was never "the early half must be at chance"; it
    // was "nothing may arrive early that the room could not have worked out",
    // and it catches that at 0.10 as well as it did at 0.05:
    //
    //   engine, twelve decorrelated blocks : 6.30pp mean, sd 1.57, worst 8.65
    //   the PLACEBO, same blocks           : +19.2 to +23.1pp — RED, every block
    //   the clash-traced ground-truth oracle this band caught in Task 7 was
    //   worth +4.9pp on its own, which still takes the engine to ~11pp — RED.
    //
    // WHAT THIS BAND CANNOT DO, MEASURED, AND WRITTEN DOWN BECAUSE AN EARLIER
    // VERSION OF THIS COMMENT CLAIMED THE OPPOSITE.
    //
    // It used to say the Task-7 ground-truth oracle "was worth +4.9pp on its
    // own, which still takes the engine to ~11pp — RED". That is FALSE. The
    // +4.9pp was measured under the correlated seeding rngFor() has since
    // fixed, and with an M.pushedThenDied that has since changed. Re-measured
    // over twelve decorrelated 200-season blocks, restoring the pre-fix
    // `const clashed = livingTraitors(ep).filter(...)` in js/tr/murder.js:
    //
    //   engine : 6.30pp mean, sd 1.64, range 2.81 - 8.65
    //   ORACLE : 7.18pp mean, sd 1.49, range 4.54 - 9.79
    //
    // The oracle is worth +0.87pp, not +4.9pp, and the two distributions OVERLAP
    // almost entirely: the oracle's LOWEST block (4.54) sits far below the
    // engine's HIGHEST (8.65). Any ceiling low enough to go red on the oracle's
    // 4.54 is already red on the engine on several of its own blocks, and any
    // ceiling high enough to clear the engine's 8.65 lets most of the oracle
    // through. There is NO early band that is green on this engine and red on
    // that oracle. This band does not catch it — not at 0.10, not at 0.05, not
    // at any value — and nobody should believe it does.
    //
    // SINCE THE `clash-traced` CHANNEL WAS DELETED, THE ORACLE IS WORTH ZERO.
    // Not "small": zero. `murderCost.blames` was its only route into the belief
    // store, and murderEvidence no longer reads it, so restoring the pre-fix
    // `livingTraitors(ep).filter(...)` in js/tr/murder.js and re-running the
    // twelve-block probe reproduces these numbers BIT-FOR-BIT. The band is left
    // at 0.10 rather than tightened, because on the post-deletion distribution
    // (5.76pp mean, sd 1.43, worst block 7.70) a tighter ceiling would catch
    // nothing that 0.10 does not already catch — the placebo is red at 0.10 on
    // all twelve blocks and the oracle is red at no ceiling whatsoever. A band
    // tightened to catch nothing is a band waiting to go red on block noise.
    //
    // What it DOES still catch is the placebo, which reads +19.2 to +23.1pp and
    // is red on every one of the twelve blocks. That is a real leak of a real
    // class, and it is the only thing this band is currently evidence against.
    expect(early.total, 'no early banishments to measure').toBeGreaterThan(40);
    expect(early.lift, 'the room is already sharp in the first half -- information is leaking in early')
      .toBeLessThan(0.10);

    // LATE: by the second half every reveal has re-scored a round of ballots,
    // and the endgame is supposed to be the sharpest table of the season.
    //
    // Measured 20.19pp mean, sd 2.72, worst block 15.19pp over twelve
    // decorrelated 200-season blocks at the repriced M.pushedThenDied = 0.62
    // (was 19.11pp mean / worst 15.03 at 0.36). STILL THE THINNEST GATE IN THE
    // FILE — 0.19pp on its worst block, up from 0.03pp — and any future change
    // to the murder layer hits it first.
    //
    // THE WORST BLOCK IS NOT A RESULT AND WAS NOT USED AS ONE. Across the
    // price sweep the worst-of-twelve wandered 13.70 / 14.35 / 15.03 / 15.19 /
    // 16.82pp with no monotone relation to price, against a per-block sd of
    // 1.7 — it is one unlucky block, exactly the statistic that produced this
    // project's three most flattering refuted numbers. The price was decided
    // on the channel's edge over a matched noise control, not on this figure.
    // The figure is quoted only to say how much room the band has left.
    //
    // Deleting the `clash-traced` channel moved this 19.02 -> 18.31pp. That is
    // NOT a 0.71pp loss: measured block-by-block the change is -5.1, +1.5,
    // -3.9, +1.5, +0.2, +0.5, +1.5, -0.9, +1.3, +0.5, -0.9, -4.6 — seven blocks
    // up, five down, t = -0.9 against block noise of sd 1.9. It is
    // indistinguishable from zero, and every other statistic in this file moved
    // flat or better (board precision worst block 0.253 -> 0.306 over placebo,
    // growth margin worst 7.07 -> 7.84pp, early worst 8.65 -> 7.70pp).
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
    // The one thing this test asserts that no other test does: GROWTH.
    //
    // There used to be a second line here, `expect(late.lift).toBeGreaterThan(0.10)`.
    // It is deleted rather than kept as belt-and-braces, because it was
    // STRICTLY DOMINATED: BEATS CHANCE asserts `late.lift > 0.15` on the
    // identically-computed statistic over the identical seasons, so the 0.10
    // line could never go red without the 0.15 line going red first. A test
    // that cannot fail independently is not a second opinion, it is noise in
    // the failure report — and it made this file look like it had six gates on
    // late lift when it has one.
    expect(late.lift, 'the room learns nothing as the season goes on').toBeGreaterThan(early.lift + 0.05);
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
    // The LOWEST early lift any noise density manages — the placebo's best
    // attempt at looking like an engine that is not leaking. See the band on it
    // at the foot of this test.
    let bestPlaceboEarly = Infinity;
    for (const k of PLACEBO_K) {
      const placebo = run(SEASONS, 3, placeboEvidence(k));
      const pEarly = liftOver(placebo, EARLY), pLate = liftOver(placebo, LATE);
      const pAll = liftOver(placebo, ALL);
      const growth = pLate.lift - pEarly.lift;
      console.log(`placebo k=${k}: ${(pEarly.lift * 100).toFixed(1)}pp -> ${(pLate.lift * 100).toFixed(1)}pp`
        + ` (grows ${(growth * 100).toFixed(1)}pp, raw lift ${(pAll.rate / pAll.nul).toFixed(2)}x)`);
      minTotal = Math.min(minTotal, pEarly.total);
      bestPlaceboEarly = Math.min(bestPlaceboEarly, pEarly.lift);
      if (growth > worstGrowth) { worstGrowth = growth; worstK = k; }
    }
    console.log(`worst placebo: k=${worstK} at ${(worstGrowth * 100).toFixed(1)}pp`);
    console.log(`placebo early lift, best density: ${(bestPlaceboEarly * 100).toFixed(1)}pp `
      + `(the early band's ceiling is 10.0pp)`);

    expect(minTotal, 'a placebo produced no banishments to compare against').toBeGreaterThan(100);
    // A TRIPWIRE, NOT A GATE — AND IT IS LABELLED THAT WAY BECAUSE IT CANNOT
    // FAIL ON ANYTHING THAT RUNS TODAY.
    //
    // The 0.20 was set against a measured worst of +16.2pp, which left 3.8pp of
    // headroom and read like a live band. That figure is stale twice over: it
    // predates rngFor()'s hash AND it predates murder evidence existing, and
    // the placebo's growth collapsed once the engine it is compared against
    // started learning earlier. Re-measured over twelve decorrelated
    // 200-season blocks:
    //
    //   k=1  mean  -1.71pp  sd 2.54  worst  +2.93pp   <- still the worst k
    //   k=3  mean -12.59pp  sd 2.24  worst  -7.55pp
    //   k=6  mean -17.07pp  sd 2.76  worst  -9.80pp
    //
    // Worst block of the worst density is +2.93pp against a 20pp ceiling —
    // roughly 6.7 sd of slack, and the shipped block reads -0.78pp. Nothing
    // that runs is going to trip this.
    //
    // It is NOT re-derived down to the measurement, and the reason is what it
    // is for: it is not measuring the engine, it is asserting that the CONTROL
    // is still a control. Tightening it to, say, 0.05 would convert a harness
    // tripwire into a band that goes red on placebo block noise and gets
    // "fixed" by someone widening it. Left at 0.20, relabelled, with the real
    // number in the comment so the next reader is not misled about its slack.
    //
    // (The k-ordering IS still load-bearing: k=1 remains the worst density in
    // all twelve blocks, so asserting against the MAX rather than against k=3
    // alone continues to earn its two extra runs.)
    expect(worstGrowth, 'a placebo density is LEARNING -- it has information in it and is no longer a control')
      .toBeLessThan(0.20);
    expect(realGrowth, 'the engine sharpens no faster than pure noise does -- the ballot layer is inert')
      .toBeGreaterThan(worstGrowth + 0.05);

    // THE EARLY BAND'S PROOF OF FAILABILITY, ASSERTED RATHER THAN CLAIMED.
    //
    // The comment on the early ceiling (0.10, in BEATS CHANCE above) says the
    // placebo is red there on every block. That was a claim in prose about
    // numbers nothing re-ran, and this file has been wrong in exactly that way
    // before. The placebo is already played here for the growth band, so the
    // check is free: the LEAST leaky noise density must still come in over the
    // ceiling the engine has to stay under. Measured 17.1pp at k=3 and k=1
    // against a 10.0pp ceiling, on an engine reading 3.4pp.
    //
    // This is also the answer to "can the early band be tightened". It cannot
    // usefully be: the only leak class it demonstrably catches is this one, it
    // catches it with 7pp to spare, and the ground-truth oracle it was
    // originally written against is now structurally unreachable — `blames` was
    // that oracle's only route into the belief store and murderEvidence no
    // longer reads it. A tighter ceiling would catch nothing more and would go
    // red on block noise.
    expect(bestPlaceboEarly, 'the placebo no longer leaks early — the early band now '
      + 'catches nothing at all and is evidence of nothing')
      .toBeGreaterThan(0.10);
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

  // ── THE PLAN'S CENTRAL CLAIM, MEASURED AT LAST ────────────────────
  //
  // "Continuation beats novelty" is the one rule that is supposed to stop a
  // season reading as forty unconnected incidents, and until this band it was
  // asserted in four doc comments and measured nowhere.
  //
  // THE OBVIOUS METRIC IS UNFAILABLE AND MUST NOT BE USED. The natural reading
  // of the claim is "what share of thread beats were advances rather than
  // opens", and it is 11.6%. With the continuation guard FLATTENED TO 1 — the
  // rule switched off entirely — it is 11.0%. Twelve decorrelated 200-season
  // blocks each way; the distributions overlap; any floor the live engine
  // clears the dead one clears too. Nearly all of that 11.6% is the runner
  // re-drawing the same pair by chance and openThread folding the second scene
  // into the first thread, which happens at the same rate whether or not
  // anything is preferring continuation. A band on it would have been the
  // eleventh unfailable guard in this project, and it would have been guarding
  // the plan's whole thesis.
  //
  // WHAT IS ACTUALLY FAILABLE is the CONDITIONAL rate: given a scene whose
  // actors already have a live story, how often does the draw land on an event
  // that continues it? That is where the multiplier lives, and it separates
  // cleanly. Twelve decorrelated blocks, four strengths of the same guard:
  //
  //   guard OFF     (mult 1)    0.1989 mean   sd 0.0089   range 0.1831-0.2155
  //   guard HALVED  (0.5/0.25)  0.2333 mean   sd 0.0117   range 0.2115-0.2485
  //   guard SHIPPED (1/0.5)     0.2606 mean   sd 0.0138   range 0.2347-0.2763
  //   guard DOUBLED (2/1)       0.2917 mean   sd 0.0133   range 0.2666-0.3095
  //
  // Monotone in the knob, and the shipped and OFF ranges do not overlap: the
  // worst live block (0.2347) is above the best dead block (0.2155). A
  // failable band has to sit in that 1.9pp window, and 0.22 is where it sits —
  // 1.47pp under the worst live block, 0.45pp over the best dead one. There is
  // no wider band that can fail, and a band that cannot fail is not evidence.
  //
  // THE CONTROL RUNS EVERY TIME, and that is not ceremony. A floor chosen from
  // a measurement goes stale the moment content changes; an assertion that the
  // SAME seeds with the guard switched off come in UNDER that floor cannot go
  // stale, because it re-derives the separation on every run. If a future
  // change makes the guard inert, this test goes red on the third assertion
  // even if someone has been generous with the first.
  //
  // WHAT IT CATCHES, EXACTLY. Verified by mutation, not asserted: setting
  // CONTINUATION_BASE and CONTINUATION_PER_HEAT to 0 in events.js takes the
  // shipped block from 26.9% to 21.6% and this test goes RED on the first
  // assertion. (Both figures predate Plan 5 Task 1; on the current engine the
  // same mutation lands well above the floor, because scene selection is now
  // also feeding continuation. This band is the guard's, and it has lost
  // sensitivity — see the update note below.) It is a band on the guard being SWITCHED OFF, not on the guard
  // being weak: a HALVED guard reads 24.7% on the shipped block and passes the
  // floor, and clears the separation assertion below by 0.002. Nothing here
  // would catch a guard quietly detuned by half, and nothing at 200 seasons a
  // block could — the halved and shipped distributions overlap.
  //
  // UPDATED BY PLAN 5 TASK 1, AND THE NUMBERS ABOVE ARE NOW HISTORY. Two
  // things moved under this band, both deliberately, both in the direction it
  // measures. The shipped guard is 3/1.5, not 1/0.5 (see the note on the
  // constants in events.js: on its own the multiplier is nearly inert, and it
  // was raised because at a fixed scene P it is free). And `_sceneActors` now
  // convenes the parties of a live thread 35% of the time instead of drawing
  // uniformly, which is what the paragraph this replaces said somebody would
  // eventually have to do. Live reads 36.1% against 17.7% with BOTH
  // mechanisms off; the 0.22 floor is untouched and is now cleared by a wide
  // margin, so this band no longer has much power to detect a detuned guard
  // — the two bands below are the ones with headroom in both directions.
  //
  // WHAT THE DIAGNOSTICS SAY, AND IT IS STILL NOT FLATTERING. The old reading
  // was 89.6% of threads opened, given one beat and never touched again, a
  // mean thread of 1.13 beats and 0.6% ever reaching a payoff. It is now
  // 73.9%, 1.43 beats and 4.0%. That is a real move and it is nowhere near
  // enough: three quarters of stories still die where they start. The reason
  // is no longer scene selection — it is that only 27 of 81 events set
  // `advancesThread` and 11 of the 26 (family x window) cells hold none at
  // all, so half of all scenes convened on a live thread have nothing eligible
  // that could continue it. `abandonThread` is still never called by the
  // engine. Recorded here so the next person does not read a green tick as
  // "the castle tells long stories".
  it('CONTINUES A STORY: a live thread is preferred to a fresh one', () => {
    const live = continuity(seasons);
    // The same seeds, the same content, guard 1 flattened to a multiplier of 1.
    // Restored in a finally: leaving it flat would silently change every
    // measurement in this file that runs afterwards.
    //
    // BOTH continuation mechanisms are switched off here, not just guard 1.
    // Since Plan 5 Task 1 there are two of them - the scoring guard, and scene
    // selection convening the parties of a live thread - and a control that
    // flattens only the first is no longer "the rule switched off": it still
    // walks the actors of a live story into the room, which raises the
    // conditional rate on its own (measured 21.4% with only guard 1 flat,
    // against 17.7% with both off, on the shipped value). Leaving the control
    // half-built would have left this band 0.6pp from green-with-the-rule-off.
    // The 0.22 floor below is UNCHANGED - the control was completed, not the
    // band retuned.
    const restore = _setContinuationGuard({ base: 0, perHeat: 0 });
    const restoreScene = _setContinuationSceneP(0);
    let dead;
    try { dead = continuity(run()); } finally { restoreScene(); restore(); }

    console.log(`continuation: ${(live.rate * 100).toFixed(1)}% of ${live.liveScenes} live-thread scenes `
      + `continued (guard off: ${(dead.rate * 100).toFixed(1)}% of ${dead.liveScenes})`);
    console.log(`[diagnostic, NOT a gate] ${live.firings} firings, ${live.threads} threads, `
      + `${(live.liveShare * 100).toFixed(1)}% of scenes had a live thread, `
      + `advance share ${(live.advanceShare * 100).toFixed(1)}% (guard off ${(dead.advanceShare * 100).toFixed(1)}%)`);
    console.log(`[diagnostic, NOT a gate] mean thread ${live.meanLen.toFixed(2)} beats, `
      + `${(live.deadShare * 100).toFixed(1)}% die at one beat, ${(live.closedShare * 100).toFixed(1)}% reach a payoff, `
      + `${(live.revivalShare * 100).toFixed(1)}% of beats revive a cold thread`);
    console.log(`[diagnostic, NOT a gate] thread lengths: ${JSON.stringify(live.lens)}`);

    // Non-vacuity first: a run where nobody ever walked into a scene with a
    // live story would make the ratio meaningless however good it looked.
    expect(live.liveScenes, 'no scene ever had a live thread — this ratio is noise')
      .toBeGreaterThan(500);
    expect(dead.liveScenes, 'the control produced no live-thread scenes to compare against')
      .toBeGreaterThan(500);

    expect(live.rate, 'the castle starts stories and never continues them — guard 1 is inert')
      .toBeGreaterThan(0.22);
    // THE PROOF THE BAND ABOVE CAN FAIL. Same seeds, same pool, rule off.
    expect(dead.rate, 'the continuation band is green with continuation SWITCHED OFF — '
      + 'it is measuring the runner re-drawing a pair by chance, not the guard')
      .toBeLessThan(0.22);
    // And the separation itself, which does not depend on 0.22 being well
    // chosen. Worst of twelve decorrelated blocks: +4.33pp.
    expect(live.rate - dead.rate, 'the continuation guard moved nothing')
      .toBeGreaterThan(0.03);
  });

  // == THE TWO BANDS PLAN 5 TASK 1 EARNS ==============================
  //
  // They guard OPPOSITE failure modes, and that is the whole reason there are
  // two. A selector that never reconvenes anybody leaves the castle exactly
  // where it was - forty unconnected incidents. A selector that reconvenes too
  // eagerly is worse than useless: one storyline eats the season, most of the
  // cast never appears in a scene at all, and the thread-health band goes
  // GREENER the more broken it gets. A pair of bands where only one can fail
  // is half a guard, so each is proved by the mutation that breaks IT:
  // CONTINUATION_SCENE_P = 0 for the first, = 1 for the second.
  //
  // WHAT "CAST COVERAGE" IS, AND WHAT IT IS NOT. The first draft of the second
  // band counted DISTINCT PAIRS per season. That was wrong, and wrong in the
  // most dangerous direction: revisiting a pair instead of drawing a fresh one
  // IS the intended effect, so a distinct-pair count falls precisely when the
  // change works. It read -13.1% at a scene P of 0.15 and -43.9% at 0.5, and
  // banding it would have capped the fix at the value that moved least. The
  // failure actually worth guarding is somebody being FROZEN OUT of the season
  // and one pair OWNING it, so the band is on two things that say that
  // directly: distinct PEOPLE per season against the control, and the share of
  // a season's scenes taken by its single busiest pair. Distinct pairs is
  // still printed, as a diagnostic and not a gate.
  //
  // THE JOINT GRID the operating point was chosen from. The two levers had to
  // be swept together, not one at a time: thread length is
  // P(scene convenes live-thread actors) x P(drawn event advances it). 200
  // seasons, seeds 1..200, every cell against the same P=0 / guard-shipped
  // control (1.139 beats, 87.7% die at one beat, 1.91% payoff, 2.42% reach 3
  // beats, 15.9 people/season, 7.6% max-pair share, 24.4% conditional).
  //
  //   scene P  guard   beats  die@1   payoff  >=3 beats  people    maxpair  cond
  //   0.15     1/0.5   1.228  82.5%   2.44%    4.34%     -3.3%     11.5%    29.4%
  //   0.15     3/1.5   1.232  82.0%   2.86%    4.62%     -3.8%     11.6%    34.0%
  //   0.35     1/0.5   1.397  76.1%   3.08%    8.98%     -9.7%     16.8%    30.2%
  //   0.35     2/1     1.408  75.4%   3.30%    9.17%     -8.7%     16.3%    33.3%
  //   0.35     3/1.5   1.431  73.9%   3.96%    9.87%     -9.0%     17.0%    36.1%  <- SHIPPED
  //   0.5      1/0.5   1.599  69.0%   4.41%   13.55%    -16.7%     23.4%    33.5%
  //   0.5      3/1.5   1.645  67.0%   5.02%   14.40%    -17.4%     23.8%    39.4%
  //
  // (1.5x rows omitted for width; they sit between 1/0.5 and 2/1 throughout
  // and add nothing to the reading.)
  //
  // Scene P is the lever that moves thread health; the guard multiplier barely
  // does. Every row of the guard sweep at a fixed scene P moves the mean by
  // ~0.03 beats while moving the guard's own conditional rate by 6pp. 0.35 is
  // where the coverage budget binds - 0.5 doubles the >=3-beat share but costs
  // 16.7% of the people who appear at all and hands 23.4% of a season to one
  // pair. The guard goes to 3/1.5 because at a fixed scene P it is free on
  // every coverage and deduction measure and buys +29% on the payoff rate.
  //
  // THE CEILING, AND THE THIRD CONSTRAINT NOBODY HAS BUILT YET. Even the most
  // aggressive cell reaches 1.65 beats. The binding constraint is not either
  // lever: in 49.9% of scenes whose actors already share a live thread, NO
  // eligible event could advance it - only 27 of 81 events set
  // `advancesThread`, and 11 of the 26 (family x window) cells contain zero of
  // them (grief has one, in dawn only; cover has none in evening). Where an
  // advancer is available the guard already converts 60.6% of those scenes at
  // 1/0.5 and 73.8% at 3/1.5, so the multiplier is not what is missing.
  // Nothing in scene selection can fix that, and it is Tasks 2-5' problem.
  it('STORIES ACCUMULATE: threads run longer than they do under uniform selection', () => {
    const live = continuity(seasons);
    console.log(`thread health: mean ${live.meanLen.toFixed(3)} beats, `
      + `${(live.deadShare * 100).toFixed(1)}% die at one beat, `
      + `${(live.closedShare * 100).toFixed(2)}% pay off `
      + `(uniform selection: ${sceneOff.meanLen.toFixed(3)}, `
      + `${(sceneOff.deadShare * 100).toFixed(1)}%, ${(sceneOff.closedShare * 100).toFixed(2)}%)`);

    // Non-vacuity: no threads at all would make every ratio here meaningless.
    expect(live.threads, 'no threads were opened - these ratios are noise').toBeGreaterThan(2000);

    // The floor sits between the two measurements with headroom on both sides:
    // 1.431 live, 1.139 under uniform selection. Over ~4600 threads the sd of
    // this mean is about 0.011, so 1.28 is roughly 13 sd from each arm.
    expect(live.meanLen, 'threads are no longer than they were under uniform actor selection - '
      + 'scene selection is not reconvening live stories')
      .toBeGreaterThan(1.28);
    // THE PROOF THE FLOOR CAN FAIL. Same seeds, same pool, selection made
    // uninformative. If this ever comes in ABOVE the floor, the floor is
    // measuring something other than the change it is named for.
    expect(sceneOff.meanLen, 'the thread-health band is green with scene selection SWITCHED OFF - '
      + 'it is measuring the runner re-drawing a pair by chance, not the selector')
      .toBeLessThan(1.28);
    // And the separation itself, which does not depend on 1.28 being well
    // chosen. Measured +0.293 beats.
    expect(live.meanLen - sceneOff.meanLen, 'thread-aware scene selection moved nothing')
      .toBeGreaterThan(0.15);
  });

  it('THE CAST DOES NOT SHRINK: nobody is frozen out and no pair owns the season', () => {
    const live = continuity(seasons);
    const peopleRatio = live.peoplePerSeason / sceneOff.peoplePerSeason;
    console.log(`coverage: ${live.peoplePerSeason.toFixed(1)} distinct people/season `
      + `(uniform ${sceneOff.peoplePerSeason.toFixed(1)}, ratio ${peopleRatio.toFixed(3)}), `
      + `busiest pair holds ${(live.maxPairShare * 100).toFixed(1)}% of a season's scenes `
      + `(uniform ${(sceneOff.maxPairShare * 100).toFixed(1)}%)`);
    console.log(`[diagnostic, NOT a gate] ${live.pairsPerSeason.toFixed(1)} distinct pairs/season `
      + `(uniform ${sceneOff.pairsPerSeason.toFixed(1)}) - falls when the change WORKS, so it is `
      + `printed and not banded`);

    expect(sceneOff.peoplePerSeason, 'the control convened nobody to compare against')
      .toBeGreaterThan(5);

    // A RATIO AGAINST THE CONTROL, not a remembered count: the absolute number
    // of scenes a season gets is set by the round budget, so any future change
    // to that budget would move a raw floor without anything having collapsed.
    // Measured 0.912 against a 0.88 floor; across-season sd puts the floor
    // about 3 sd down. At P=1 it is 0.62 and falling.
    expect(peopleRatio, 'people stopped appearing in scenes at all - live threads are '
      + 'monopolising the castle and most of the cast is frozen out of the season')
      .toBeGreaterThan(0.88);
    // The other half of monopoly, and the half a ratio cannot see: coverage can
    // look fine in aggregate while one pair takes a quarter of every season.
    // Measured 17.0% against a 20% ceiling, and 7.6% under uniform selection.
    expect(live.maxPairShare, 'one pair has taken over the season - the castle is now '
      + 'two people talking with the rest of the cast as extras')
      .toBeLessThan(0.20);
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
    // Executions are the OTHER way the castle loses somebody at night: a
    // refused ultimatum. They are counted here rather than folded into
    // `murdered` because MURDERS THE COALITION is a measurement of
    // formPreference's victim choice and an execution is chooseRecruit's —
    // but a death that no number reports is a death no measurement can find,
    // and until offerRecruitment returned `executed` this one was invisible.
    const executed = seasons.reduce((n, s) => n + s.log.filter(r => r.executed).length, 0);
    console.log(`blocked murders across ${seasons.length} seasons: ${blocked} `
      + `(against ${murders} completed murders and ${executed} refused-ultimatum executions) `
      + `— structurally zero until missions exist`);
    expect(murders, 'no murders at all: this comparison would be vacuous').toBeGreaterThan(200);
    expect(blocked,
      'A SHIELD FIRED IN A SEASON. Plan 5 has landed: measure the count and replace '
      + 'this tripwire with expect(blocked).toBeGreaterThan(0).').toBe(0);
  });

  // ── THE CASTLE STREAM IS NEVER THE GAME STREAM (finding 14) ──
  //
  // headless.js derives the castle's rng by multiplying the seed by 40503,
  // which is ODD — so `40503 * 2**31 === 2**31` modulo 2**32 and at that one
  // seed the derived seed IS the seed. The castle would draw from the game's
  // own stream, and every content change would re-roll every murder, ballot
  // and banishment: exactly the coupling the whole isolation exists to
  // prevent, invisible because nobody plays seed 2**31.
  //
  // `rngFor` hashes its argument with an odd multiply, a bijection mod 2**32,
  // so two streams coincide IF AND ONLY IF the seeds handed to it are equal.
  // Comparing first draws is therefore a complete test, not a sample.
  it('the castle stream never collapses onto the game stream, 2**31 included', () => {
    const collisions = [];
    for (const seed of [1, 2, 7, 13, 99, 12345, 2 ** 31, 2 ** 31 + 1, 2 ** 32 - 1, 0]) {
      if (rngFor(seed)() === _castleRngFor(seed)()) collisions.push(seed);
    }
    expect(collisions, `castle and game streams are identical at seed(s) ${collisions.join(', ')}`)
      .toEqual([]);
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
