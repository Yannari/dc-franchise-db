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
import { _setVoteSuspicionMult, _setPactWatch } from '../js/tr/deduction.js';
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

// ══════════════════════════════════════════════════════════════════════
// PLAN 5 TASK 6: EVERY BAND IN THIS FILE RE-MEASURED AT HEAD
// ══════════════════════════════════════════════════════════════════════
//
// Tasks 1-5 moved scene selection, thread continuity, residue citation, three
// spec gaps, 16 new events and three anti-repetition guards. Every band below
// was calibrated against a distribution those tasks changed, so all of them
// were re-measured against the same 200 seeds, and the plan's base revision
// (df17dda2, 81 events) was re-run for comparison rather than trusted from a
// report. Nothing here was moved to accommodate a failure; two bands were
// re-EXPRESSED, and the reasons are on them.
//
//   band                     base (81 ev)   head (98 ev)   threshold
//   traitor-hit rate            0.3383         0.3487       > 0.22
//   early lift                  0.0372         0.0266       < 0.10
//   late lift                   0.2042         0.2368       (see Task 9)
//   faithful win rate           0.4600         0.4950       0.10 - 0.75
//   mean plurality share        0.4031         0.4034       0.20 - 0.55
//
// THE DEDUCTION BANDS ARE NOT INSULATED FROM CASTLE CONTENT, and this file
// used to assume they were. Castle events write zero beliefs by construction
// (tr-castle-belief-gate.test.js), so the assumption was that content cannot
// reach the room's reasoning — but they move bonds, and bonds move ballots.
// Seventeen new events moved late lift +3.3pp and early lift -1.1pp. Both
// moved in the safe direction here; neither was going to.
//
// LATE LIFT WAS THE ONE TO WATCH, AND PLAN 5 TASK 9 GAVE IT A CONTROL ARM.
// It was the last band in this file that was an ABSOLUTE constant against a
// measurement content demonstrably moves, and the Task 6 note that used to sit
// here left it that way on the grounds that no control could be built without
// doubling the run. That was wrong on both counts: the run costs about a
// second, and the band was thinner than the note claimed. Re-measured over six
// DECORRELATED 200-season blocks at head, the live figure reads
//
//     0.2368  0.1977  0.1403  0.1892  0.1746  0.2080   mean 0.1911  sd 0.0325
//
// so the shipped 0.15 floor is RED on block 400 (0.1403) on an engine nobody
// had touched. The shipped seed block flattered it, exactly as this file's
// own 60-season note warned about a different band. It is replaced below by a
// separation against an in-run control, and the derivation is on the
// assertion.
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

  // THE BLIND-BALLOT CONTROL ARM, earned by Plan 5 Task 9 and used by the late
  // band below. Same seeds, same castle content, same code path, with the
  // DEDUCTION CHANNEL SWITCHED OFF at the one place it reaches a decision:
  // chooseBanishmentVote scores every candidate on the noise term alone.
  //
  // WHY THE ABLATION IS AT THE BALLOT AND NOT AT THE EVIDENCE HOOK. Swapping
  // `evidence` out (the placebo's seam) removes one of three writers - the
  // reveal cascade and murderEvidence still run - so it is a partial ablation
  // of the channel this band is named for. Zeroing the multiplier removes the
  // belief store's whole influence on the vote in one place, keeps
  // suspicionBoard() honest so the BOARD PRECISION probe is unaffected, and
  // leaves the rng draw in chooseBanishmentVote untouched so both arms consume
  // the same stream per ballot.
  //
  // WHAT THE CONTROL IS NOT. It is not a base rate and it is not zero: blind
  // ballots score -17.63pp, well BELOW chance, because a Traitor pays a price
  // to name the pact (chooseBanishmentVote, Plan 6 Task 6) and that price is
  // charged against the score — so a room voting on noise alone can never
  // afford it and systematically under-hits Traitors. That structural offset
  // is the thing an absolute floor on the live number silently assumed was
  // constant, and it is unchanged by the price replacing the old hard filter:
  // measured base vs head over eight 200-season blocks, this control moved by
  // 0.0000pp, because the price at every field size exceeds the whole 0.35
  // noise term and nothing else in this arm can outbid it.
  const blindBallot = (() => {
    const restore = _setVoteSuspicionMult(0);
    let blind;
    try { blind = run(); } finally { restore(); }
    return { early: liftOver(blind, EARLY), late: liftOver(blind, LATE) };
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
    // == PLAN 5 TASK 9: THE ABSOLUTE FLOOR IS REPLACED BY A SEPARATION ==
    //
    // It was `late.lift > 0.15`, a constant carried since before the castle
    // had content, and the assumption underneath it was that the zero-belief-
    // write constraint insulated this number from the castle. IT DOES NOT.
    // Castle events write no beliefs, but they call addBond, bondResistance()
    // reads bonds, and suspicion() is multiplied by it -- so the castle reaches
    // the ballot without writing a single belief. Measured at head, 200 seeds,
    // one content FILE unregistered at a time:
    //
    //     minus-trust      live 0.1889  (-0.0479)   <- worst adverse
    //     minus-journey    live 0.2006  (-0.0362)
    //     minus-grief      live 0.2291  (-0.0078)
    //     minus-callback   live 0.2368  (+0.0000)   <- fires zero times here
    //     minus-testing    live 0.2439  (+0.0071)
    //     minus-cover      live 0.2472  (+0.0104)
    //     minus-romance    live 0.2519  (+0.0151)
    //     minus-suspicion  live 0.2790  (+0.0422)
    //
    // One content file is worth up to 4.8pp of a band that had 8.7pp of
    // headroom. This plan ships one or two files' worth of content per task.
    //
    // THE OBSERVABLE IS NOW live_late - blind_late, against the control arm
    // built at the top of this describe: the same seeds, the same castle, the
    // ballot reading no beliefs. Six decorrelated 200-season blocks (seed
    // bases 0, 200, 400, 600, 800, 1000), both arms re-run per block:
    //
    //     live   0.2368  0.1977  0.1403  0.1892  0.1746  0.2080   mean 0.1911  sd 0.0325
    //     blind -0.1763 -0.1775 -0.1786 -0.1879 -0.1642 -0.1682   mean -0.1755 sd 0.0084
    //     sep    0.4131  0.3752  0.3189  0.3771  0.3388  0.3762   mean 0.3665  sd 0.0331
    //
    // WHAT THE CONTROL BUYS, STATED HONESTLY, BECAUSE TASK 6 LEARNED THIS THE
    // EXPENSIVE WAY. A control arm protects against the thing it ABLATES and
    // nothing else:
    //   - sampling drift in the OFFSET  - removed. The blind arm is stable to
    //     sd 0.0084 across blocks, so the structural -17.6pp the live number
    //     used to be measured against is now re-derived every run instead of
    //     being baked into a constant.
    //   - mechanism-strength drift      - removed (both arms share every input
    //     to the vote except the multiplier).
    //   - COMPOSITION drift             - NOT removed, and barely reduced.
    //     Re-running BOTH arms per content file:
    //
    //       minus-trust      sep 0.3665  (-0.0466)   <- worst adverse
    //       minus-journey    sep 0.3702  (-0.0429)
    //       minus-grief      sep 0.4018  (-0.0113)
    //       minus-callback   sep 0.4131  (+0.0000)
    //       minus-romance    sep 0.4323  (+0.0192)
    //       minus-cover      sep 0.4330  (+0.0198)
    //       minus-testing    sep 0.4334  (+0.0203)
    //       minus-suspicion  sep 0.4431  (+0.0300)
    //
    //     4.66pp adverse per file against 4.79pp on the live arm. The reason
    //     is structural and worth writing down: with the ballot blind, bonds
    //     cannot reach the vote at all, so removing castle content moves the
    //     control almost not at all (max 1.32pp) and the separation inherits
    //     the live arm's exposure nearly whole. This band is content-priced,
    //     not content-proof, and anyone adding castle content must re-check it.
    //
    // WHERE 0.22 COMES FROM. Worst live block 0.3189 minus 0.0989 of headroom
    // = 2.1 adverse content files; on the shipped block (0.4131) it is 4.1.
    // The ablation reads EXACTLY 0.0000, so the assertion keeps 0.22 of margin
    // against the thing it is named for.
    //
    // WHAT IT CATCHES AND WHAT IT CANNOT, swept on the same 200 seeds by
    // detuning the same multiplier the control zeroes:
    //
    //     mult 1.00 (shipped)  late  0.2368   sep 0.4131
    //     mult 0.75            late  0.1367   sep 0.3130
    //     mult 0.50            late  0.1342   sep 0.3105
    //     mult 0.25            late  0.0193   sep 0.1956   <- RED
    //     mult 0.10            late -0.0679   sep 0.1084   <- RED
    //     mult 0.00            late -0.1763   sep 0.0000   <- RED
    //
    // So it catches the channel switched off and the channel at a quarter
    // strength. It does NOT catch a half-strength ballot channel -- and NO
    // floor here can, because the 0.75 and 0.50 arms (0.3130, 0.3105) sit
    // inside the full-strength block range (0.3189-0.4131). 200 seasons a
    // block cannot separate adjacent strengths; the continuity band below
    // reached the same wall and says so. A floor placed at 0.31 to catch them
    // would have 0.9 content files of headroom and would be walked through by
    // the next task that adds events, which is how the 0.15 got here.
    //
    // AND THE CONTROL IS BOUNDED, BECAUSE A CONTROL CAN DRIFT TOO. A
    // separation is only evidence if the arm it is measured against stays
    // uninformative. If the blind arm drifted DOWNWARD the separation would
    // widen and could hide a live-arm collapse -- the same shape as the Task 6
    // scan that erased its own evidence. Blind late lift is -0.1755 mean, sd
    // 0.0084 across blocks and -0.1895..-0.1641 across content perturbations.
    //
    // BOTH BOUNDS ARE PLACED WHERE A MUTATION ACTUALLY CROSSES THEM, not at a
    // round number. Upper: deleting `* _voteSuspicionMult` in deduction.js
    // makes the control arm the live engine, +0.2368 -- red at -0.05 by a
    // mile, and that is the seam failing silently, which is the likeliest way
    // this band dies. Lower: an ANTI-informative ballot is the furthest down
    // the arm can be driven, and it saturates -- mult -1 reads -0.2314, -3
    // reads -0.2517, -100 reads -0.2412. So -0.22 is red on all of those and
    // -0.30 would have been red on none of them, i.e. unfailable. -0.22 sits
    // 3.6 block-sd and 2.3 content-file-widths (max observed 0.0132) below the
    // worst honest reading. Tripwires on the harness, not bands on the engine.
    expect(late.total, 'no late banishments to measure').toBeGreaterThan(40);
    expect(blindBallot.late.total, 'the blind-ballot control produced no late banishments')
      .toBeGreaterThan(40);
    console.log(`late lift: engine ${(late.lift * 100).toFixed(2)}pp vs blind ballot `
      + `${(blindBallot.late.lift * 100).toFixed(2)}pp = separation `
      + `${((late.lift - blindBallot.late.lift) * 100).toFixed(2)}pp`);
    // Diagnostic, asserted nowhere: the blind arm's EARLY lift, which is the
    // same structural offset measured before any reveal has landed. The gap
    // between the two blind halves (-4.2pp early, -17.6pp late) is the
    // population effect the null already prices out; it is printed so a future
    // reader can see the offset is not a constant across the season either.
    console.log(`[diagnostic, NOT a gate] blind ballot early ${(blindBallot.early.lift * 100).toFixed(2)}pp`
      + ` -> late ${(blindBallot.late.lift * 100).toFixed(2)}pp`);

    // TRIPWIRE, NOT A GATE: the control must still be a control.
    expect(blindBallot.late.lift,
      'the blind ballot is SHARP in the endgame -- it has information in it and is no longer a control')
      .toBeLessThan(-0.05);
    expect(blindBallot.late.lift,
      'the blind ballot is ANTI-informative -- it has fallen below its structural offset and is '
      + 'propping up the separation below rather than the engine earning it')
      .toBeGreaterThan(-0.22);

    // THE MUTATIONS THAT PROVE ALL THREE, RUN RATHER THAN CLAIMED. Each was
    // applied, the file run, and reverted:
    //
    //   1. `score: rng() * 0.35` (the belief term deleted outright)
    //      -> five tests red, but the FIRST failure in this one is the
    //         `rate > 0.22` line at 0.1213, so the gate is not even reached.
    //         A hard ablation is not a proof of THIS assertion.
    //   2. `... * _voteSuspicionMult * 0.25` (the channel at quarter strength)
    //      -> the gate is the first line to fail here, at exactly the swept
    //         0.1956 against 0.22, with `rate > 0.22` and `early < 0.10` both
    //         still green. This is the gate's proof.
    //   3. `* _voteSuspicionMult` deleted (the seam made inert, so the control
    //      arm is silently the live engine)
    //      -> ONE failure in the whole file: the upper tripwire, at +0.2368.
    //         Nothing else here notices, which is why that tripwire is not
    //         redundant with the gate.
    //   4. the control arm called with -1 instead of 0
    //      -> ONE failure: the lower tripwire, at -0.2314 against -0.22. The
    //         gate stays green at 0.4682, which is the propping-up this bound
    //         exists to catch.
    //
    // THE GATE.
    expect(late.lift - blindBallot.late.lift,
      'the endgame is no sharper than a ballot that reads no beliefs -- the reveal cascade is not landing')
      .toBeGreaterThan(0.22);
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
    // ~13 ballots, a noise term on every score and Traitors paying a price they
    // can almost never afford to name the pact, at least one vote always diverges — so it read
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
  // == RE-DERIVED BY PLAN 5 TASK 1, ROUND 3. THE NUMBERS ABOVE ARE HISTORY. ==
  //
  // The paragraph that used to sit here said this was "a band on the guard
  // being SWITCHED OFF, not on the guard being weak". After Task 1 that was
  // false in the worst way: it was a band on NOTHING. A reviewer deleted the
  // entire guard with one line in events.js -
  //
  //     continuationMult = 1 + _contBase + heat * _contPerHeat;  ->  = 1;
  //
  // - and this test stayed GREEN, at 23.3% against its 0.22 floor, clearing
  // the separation assertion by 5.6pp. Fifteen of fifteen passing with the
  // mechanism the band is named for deleted.
  //
  // WHY IT WENT SLACK, because the cause matters more than the number. There
  // are now TWO things that continue a story: this guard, which prefers an
  // advancing event once actors are in the room, and `_sceneActors`, which
  // since Task 1 walks the actors of a live thread INTO the room 35% of the
  // time. The old control arm flattened the guard AND zeroed scene selection,
  // so "the rule off" meant the whole Plan-5 engine off - and the floor was
  // chosen against an engine in which scene selection did not exist. Scene
  // selection alone lifts the conditional rate to 23.3%, well clear of 0.22,
  // so the floor could never see the guard again.
  //
  // THE OBSERVABLE IS STILL THE CONDITIONAL RATE, and that was the question
  // worth asking before re-deriving. It still isolates the guard cleanly at
  // the shipped operating point - the guard's marginal contribution is
  // 36.14% -> 23.29%, a 12.84pp gap, LARGER in absolute terms than the 6.2pp
  // it had before Task 1, because scene selection supplies the guard with far
  // more scenes in which there is something to prefer. What was wrong was not
  // the metric but the CONTROL, and the floor derived from it.
  //
  // SO THE CONTROL IS NOW GUARD-ONLY: the guard flattened, scene selection
  // LEFT AT ITS SHIPPED VALUE. That is the arm that answers "what does this
  // guard contribute, here, now", and it is strictly the harder control - it
  // starts 5.6pp higher than the both-off arm it replaces. Measured on 200
  // seeds at the shipped 0.35 and 3/1.5:
  //
  //     shipped                  36.14%   (2994 live-thread scenes)
  //     guard flattened          23.29%   (2975)   <- the control, and the mutation
  //     scene selection off      29.22%   (989)
  //     both off                 17.73%   (1004)
  //
  // The floor was 0.30 against those numbers. TASK 2 MOVED BOTH ARMS by
  // widening what `continued` counts (46.23% / 30.49%) and the floor is now
  // 0.38 — see the block immediately above the assertion for the derivation
  // and for the third input this floor turns out to depend on. The seam
  // control and the hard source mutation agree to two decimal places (23.29%
  // vs 23.3%), which is what makes the seam a legitimate stand-in for deleting
  // the line, and that agreement is unaffected by the re-derivation.
  //
  // ONE COUPLING, STATED SO IT IS NOT A SURPRISE LATER — AND SINCE TASK 2,
  // TWO. This floor is tied to the shipped CONTINUATION_SCENE_P: scene
  // selection feeds the guard the scenes it acts in, so moving that knob moves
  // this band. It is ALSO tied to how many events declare `advancesThread`,
  // which is what moved it the second time. That is correct, not fragile:
  // the band measures what the guard contributes AT THE OPERATING POINT, and
  // the assertion that isolates the guard by itself is the separation one,
  // which needs no floor at all.
  //
  // WHAT IT STILL CANNOT CATCH: a guard quietly detuned by half rather than
  // switched off. That was true before Task 1 and is true now; 200 seasons a
  // block cannot separate adjacent strengths. The band is honest about being
  // an off-switch detector, and now it actually is one.
  //
  // WHAT THE DIAGNOSTICS SAY, AND IT IS STILL NOT FLATTERING. The old reading
  // was 89.6% of threads opened, given one beat and never touched again, a
  // mean thread of 1.13 beats and 0.6% ever reaching a payoff. After Task 1 it
  // was 73.9%, 1.43 beats and 4.0%; after Task 2 it is 72.3%, 1.46 beats and
  // 3.9%. That is a real move and it is nowhere near enough: seven stories in
  // ten still die where they start.
  //
  // AND THE REASON IS NOT WHAT THIS COMMENT USED TO SAY. It blamed the pool:
  // "only 27 of 81 events set `advancesThread`". Task 2 tried raising it to 44 of
  // 81, closing nine of the ten zero-advancer cells; the mean thread
  // moved 1.43 -> 1.48 while the payoff rate FELL and one event was starved
  // to the edge of dead, so it settled at 32 of the 81 events the pool held
  // AT THAT TIME. Task 4 then added seventeen events, and the pool now stands
  // at 39 advancers of 98 - the figure pinned in
  // tr-castle-reachability.test.js, which is the only copy to trust. The flag is a declaration,
  // not a capability — `openThread` folds into an open thread of the same kind
  // and parties, so the pool was already continuing stories it had not
  // declared. What actually gates a continuation is the drawn event's FAMILY
  // matching the thread's kind, plus the 5-episode pair cooldown.
  // `abandonThread` is still never called by the engine. Recorded here so the
  // next person does not read a green tick as "the castle tells long
  // stories", and does not spend Task 4 or 5 adding flags expecting length.
  it('CONTINUES A STORY: a live thread is preferred to a fresh one', () => {
    const live = continuity(seasons);
    // THE CONTROL: same seeds, same content, scene selection at its SHIPPED
    // value, and guard 1 flattened to a multiplier of 1 - which is exactly
    // what deleting the guard's one line in events.js does. Restored in a
    // finally: leaving it flat would silently change every measurement in
    // this file that runs afterwards.
    const restore = _setContinuationGuard({ base: 0, perHeat: 0 });
    let dead;
    try { dead = continuity(run()); } finally { restore(); }

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

    // == RE-DERIVED BY PLAN 5 TASK 2. 0.30 -> 0.38. ==
    //
    // WHAT MOVED WAS THE OBSERVABLE, NOT THE GUARD. `continued` is defined in
    // pickEvent as `chosen.advancesThread && (the thread this event would
    // advance)`, so it counts a DECLARATION. Task 2 changed how many events
    // declare, and changed what the lookup counts as "the thread this event
    // would advance" (`threadScope: 'solo'`, for the four cover events whose
    // thread is keyed on one person rather than on the scene). Both arms moved
    // together:
    //
    //     shipped                  36.14%  ->  46.23%
    //     guard flattened          23.29%  ->  30.49%   <- the control
    //     separation               12.84pp ->  15.74pp
    //
    // The control walked straight through the old 0.30 floor, which is exactly
    // the failure the control arm exists to detect. Nothing about the guard got
    // weaker; its marginal contribution grew by 2.9pp.
    //
    // WHERE 0.38 COMES FROM. It sits dead centre between the arms: 8.23pp under
    // the live arm and 7.51pp over the control. The sd of the 200-season
    // figure, from splitting these same seeds into eight 25-season blocks and
    // scaling, is 0.0081 live and 0.0074 control — 10.1 sd either way.
    //
    // AND THAT SD MEASURES SEED NOISE, WHICH IS NOT WHAT MOVES THIS BAND. Say
    // it outright, because 10 sd reads like far more safety than it is: the
    // seeds here are FIXED, so this test cannot flake, and the sampling sd only
    // prices "how much would this number wobble on different seeds". What
    // actually moves it is CONTENT. Task 2's first pass declared 17 more
    // advancers and moved the live arm 19.8pp — 25 sd — without changing a
    // single thread's shape. READ THE HEADROOM IN DECLARATIONS, NOT IN SD:
    // the control arm sits 7.5pp under the floor and 17 declarations were worth
    // about 7pp of the control, so there is room for roughly 17 more before
    // this band goes stale again. Tasks 4 and 5 add events.
    //
    // THE THIRD THING THIS FLOOR IS A FUNCTION OF, stated because two
    // consecutive tasks have now moved it. The floor tracks:
    //   1. the continuation guard's strength (what the band is named for),
    //   2. `CONTINUATION_SCENE_P` — scene selection feeds the guard the scenes
    //      it acts in (Task 1 recorded this),
    //   3. THE POOL'S ADVANCER DECLARATION RATE. Not a mechanism — a
    //      measurement surface. `advancesThread` is a declaration, not a
    //      capability, because `openThread` already folds into an open thread
    //      with the same kind and party set. With the guard flattened, the
    //      seasons before and after a pure declaration change are BIT-IDENTICAL
    //      — no thread changes shape; more of what was already happening simply
    //      gets labelled. Change the flag count and you move this floor, by
    //      construction.
    //
    // AND THE DECLARATION IS NOT FREE, which is the other thing Task 2 learned
    // the hard way. Guard 1 multiplies a declared advancer by 4x-9x; `rare`
    // multiplies by 2x. So every advancer declared in a window starves that
    // window's RARE events. Declaring ten advancers in `morning` took
    // `romance-shared-alibi` from 12 firings per 400 seasons to 2 and tripped
    // the dead-event floor in tr-castle-reachability.test.js. Those ten
    // declarations were withdrawn; the citations they carried were kept, since
    // citing residue never needed the flag.
    // == PLAN 5 TASK 6: THE ABSOLUTE FLOOR IS DELETED, NOT MOVED ==========
    //
    // It was 0.22, then 0.30, then 0.38, re-derived twice by content change,
    // and each rotation of that treadmill left a window in which the band was
    // guarding nothing (Task 1 found the guard could be deleted outright with
    // the file still green). The reason is structural and is written up in the
    // plan: an ABSOLUTE floor on the live arm rots whenever content moves the
    // measurement, while a comparison between the live arm and a control
    // measured IN THE SAME RUN does not, because both sides move together.
    //
    // At head both arms had moved again — live 44.4%, control 33.4% — so 0.38
    // sat 4.6pp above the control and was one content change from being walked
    // through for the third time. It is replaced by a RATIO against the same
    // control, which is the same statement with nothing to go stale.
    //
    // MEASURED over six DECORRELATED 200-season blocks (seed bases 0, 200,
    // 400, 600, 800, 1000), each block re-running both arms on its own seeds:
    //
    //     ratio  1.3278 1.3232 1.2883 1.3621 1.3133 1.3366   mean 1.3252  sd 0.0250
    //     sep    0.1095 0.1088 0.0992 0.1188 0.1041 0.1121   mean 0.1088  sd 0.0067
    //
    // == AND THE SAMPLING sd IS NOT THE NUMBER THAT MATTERS (round 2, R1) ==
    //
    // The first draft of this comment said a ratio against an in-run control
    // "cannot go stale" and priced it at 5.0 sd against a 1.20 floor. That
    // claim was TOO STRONG and the 5.0 sd was the wrong statistic. It prices
    // SAMPLING noise — how much the number wobbles on different seeds — and
    // the failure that killed the old absolute floors twice was CONTENT
    // movement, which a ratio reduces but does not remove.
    //
    // WHAT A RATIO DOES AND DOES NOT FIX, stated properly:
    //   - sampling drift        — removed (both arms share the seeds)
    //   - mechanism drift       — removed (both arms share the guard's inputs)
    //   - COMPOSITION drift     — NOT removed. Which events exist changes how
    //     many scenes contain something the guard can prefer, and that moves
    //     the two arms by DIFFERENT amounts.
    //
    // MEASURED, one castle content file removed at a time, 200 seasons, both
    // arms re-run per file (a file is roughly the unit of content change this
    // plan makes — Task 4 added 16 events, Task 5 three guards):
    //
    //     minus-testing    1.2602   (-0.0676)   <- worst adverse
    //     minus-suspicion  1.2921   (-0.0358)
    //     minus-grief      1.2920   (-0.0358)
    //     minus-romance    1.3081   (-0.0197)
    //     minus-trust      1.3109   (-0.0170)
    //     minus-callback   1.3421   (+0.0143)
    //     minus-cover      1.3478   (+0.0200)
    //     minus-journey    1.4152   (+0.0873)
    //
    // One content file moves this ratio by up to 0.068 — 2.7x the sampling sd
    // of 0.0250. Deleting the file outright rather than unregistering its
    // events (the reviewer's method) reads 0.0844 adverse, and that larger
    // figure is what the floor below is derived against.
    //
    // SO THE FLOOR IS 1.10, NOT 1.20. At 1.20 the headroom was 0.1252, which
    // is 1.5 adverse content files: two of them breach it, and this plan
    // routinely ships one. At 1.10 the headroom is 0.2278 — 2.7 adverse files
    // — and the mutation still produces EXACTLY 1.000, so the assertion keeps
    // 0.10 of margin against the thing it is named for.
    //
    // AND THE SEPARATION LINE IS NOT REDUNDANT — IT IS THE DETUNE DETECTOR.
    // Dropping the ratio to 1.10 costs the ability to catch a weakened guard,
    // and the separation floor buys it back. Measured, guard strength swept at
    // a fixed scene P (200 seasons, control re-run each time):
    //
    //     guard 3/1.5   (shipped)  ratio 1.3278   sep 0.1095
    //     guard 2.25/1.125  (75%)  ratio 1.2884   sep 0.0964
    //     guard 1.5/0.75    (50%)  ratio 1.2419   sep 0.0808
    //     guard 0.75/0.375  (25%)  ratio 1.1557   sep 0.0520   <- sep is RED
    //     guard flattened    (0%)  ratio 1.0000   sep 0.0000   <- both RED
    //
    // So the pair catches the same detune the old 1.20 floor caught (a quarter
    // strength guard) while surviving twice the content movement. The
    // separation's own composition exposure is 0.0173 adverse per file against
    // 0.0495 of headroom — 2.9 files, so it is the tighter of the two on
    // content and the looser on detune, which is the right way round.
    //
    // WHAT NEITHER CAN CATCH: a guard detuned to half or three-quarters. 200
    // seasons a block cannot separate adjacent strengths, and no floor here
    // sits between 1.2419 and 1.2884. The honest normalising fix — condition
    // the rate on scenes where an advancing event of the matching family is
    // actually eligible — would remove the composition term at the source, and
    // is a different measurement with its own derivation. Not done here.
    expect(live.rate / dead.rate, 'the castle starts stories and never continues them — '
      + 'the guard buys no more continuation than the same seeds buy with it flattened')
      .toBeGreaterThan(1.10);
    // The detune half of the pair, in the units the diagnostics print.
    // Measured 0.1088; a quarter-strength guard reads 0.0520.
    expect(live.rate - dead.rate, 'the continuation guard moved nothing')
      .toBeGreaterThan(0.06);
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
  // lever. The explanation that used to sit here - that only 27 of 81 events
  // set `advancesThread`, so half of all live-thread scenes had nothing that
  // could continue them - was REFUTED by Task 2 and its counts are stale twice
  // over. The flag is a declaration, not a capability (`openThread` folds a
  // firing into an open thread of the same kind and parties regardless), and
  // the real gate is family-matching plus the 5-episode pair cooldown. The
  // live pool shape, pinned in tr-castle-reachability.test.js, is 98 events,
  // 39 advancers, 45 non-empty (family x window) cells - 18 with none, 17 with
  // exactly one, 10 with two or more. It is pinned to catch silent drift, not
  // as a target: the first three copies written into this repo were all wrong
  // in the same direction and nothing in the suite could tell.
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

    // == PLAN 5 TASK 6: THE ABSOLUTE FLOOR IS DELETED, NOT MOVED ==========
    //
    // Same treatment as the continuation band above, and this one was already
    // most of the way to the failure. 1.28 was derived when the live arm read
    // 1.431 and the uniform control 1.139. Tasks 2-5 moved BOTH arms up: at
    // head the control reads 1.2678, which is 0.0122 UNDER its own ceiling
    // against an across-block sd of 0.0057 — 2.1 sd, the same knife-edge class
    // as the 2.14 sd assertion Task 2 found. One more content change and the
    // control walks through 1.28, at which point the pair of assertions is
    // guarding nothing and the file is still green.
    //
    // MEASURED over six decorrelated 200-season blocks (bases 0..1000), both
    // arms re-run per block:
    //
    //     ratio  1.2620 1.2593 1.2405 1.2634 1.2486 1.2528  mean 1.2544  sd 0.0089
    //     sep    0.3321 0.3287 0.3047 0.3332 0.3178 0.3188  mean 0.3226  sd 0.0110
    //
    // 1.15 is 11.8 sd under the ratio; 0.15 is 15.7 sd under the separation.
    // Under the mutation (CONTINUATION_SCENE_P = 0) the two arms are the same
    // 200 seasons, so the ratio is exactly 1.000 and the separation 0.000.
    //
    // == IT IS NOT AN OFF-SWITCH DETECTOR, AND THAT WAS WORTH CHECKING ==
    //
    // The obvious objection (round 2, R2) is that the mutation IS the control
    // arm, so the ratio is tautologically 1.000 and the band can only catch a
    // selector switched off — the caveat the continuation band above carries
    // honestly. Measured, sweeping the knob instead of asserting the claim:
    //
    //     scene P 0.35   (shipped)  meanLen 1.6000   ratio 1.2620   green
    //     scene P 0.2625     (75%)  meanLen 1.4831   ratio 1.1698   green
    //     scene P 0.175      (50%)  meanLen 1.4090   ratio 1.1114   RED
    //     scene P 0.0875     (25%)  meanLen 1.3350   ratio 1.0530   RED
    //     scene P 0           (0%)  meanLen 1.2678   ratio 1.0000   RED
    //
    // The 1.15 floor reddens on a selector HALVED, not only on one deleted.
    // Its resolution limit is 75%: it cannot separate the shipped value from a
    // quarter detune, and no honest floor here can, since 1.1698 and 1.2620
    // are three sampling sd apart on a statistic whose content drift is larger
    // than that. Stated rather than left as a hope.
    //
    // ITS COMPOSITION EXPOSURE, measured the same way as the band above (one
    // castle content file removed at a time): worst adverse -0.0428
    // (minus-trust) against 0.1120 of headroom — 2.6 content files. The
    // separation's worst adverse is -0.0537 against 0.1821 — 3.4 files. This
    // band did not need widening; the continuation one did.
    // RE-EXPRESSED (1.15 -> 1.10) when the endgame boundary moved: the mandated
    // loop now runs ~one round longer (it no longer breaks on bare `fa <= tr`),
    // which lengthens threads in BOTH arms — live 1.60 -> 1.83, uniform control
    // 1.27 -> 1.62 — and a ratio of two rising numbers compresses even when the
    // gap between them does not. The gap is what proves the selector: the
    // separation band below reads 0.21 (was 0.32) and is still 4+ sd clear of
    // its 0.15 floor, so scene selection is demonstrably live and it is the
    // ratio's denominator that moved, not the mechanism. New reading 1.130 /
    // 1.133 (200 / 500 seasons), stable; floor cut ~1.3 sd under it. The
    // separation band is the primary detune guard here (see its note) — a
    // halved selector collapses the gap under 0.15 regardless of season length.
    expect(live.meanLen / sceneOff.meanLen, 'threads are no longer than they were under '
      + 'uniform actor selection - scene selection is not reconvening live stories')
      .toBeGreaterThan(1.10);
    // And the separation in beats, which is the same statement in the units
    // the diagnostics print. Measured +0.210 beats after the endgame boundary
    // move (was +0.323); both arms lengthened, the gap held well clear of 0.15.
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
    // This was already the right shape and Task 6 left it alone; the two bands
    // above were converted to match it.
    //
    // RE-MEASURED AT HEAD (Task 6), six decorrelated 200-season blocks, both
    // arms per block: 0.9199 0.9071 0.9253 0.9224 0.8980 0.9142 — mean 0.9145,
    // sd 0.0100. The 0.88 floor is 3.4 sd down. That is the THINNEST margin
    // left in this file and it is stated rather than widened: the honest
    // reading is that Tasks 1-5 spent most of the coverage budget, so the next
    // task to add scene-hungry content should expect to meet this band first.
    // At P=1 it is 0.304.
    expect(peopleRatio, 'people stopped appearing in scenes at all - live threads are '
      + 'monopolising the castle and most of the cast is frozen out of the season')
      .toBeGreaterThan(0.88);
    // The other half of monopoly, and the half a ratio cannot see: coverage can
    // look fine in aggregate while one pair takes a quarter of every season.
    //
    // THIS ONE IS DELIBERATELY ABSOLUTE, and Task 6 checked it against the
    // shape it was sweeping for and kept it. The other absolute constants in
    // this file were floors COPIED OUT OF A MEASUREMENT, which is what rots.
    // This is a DESIGN BOUND — "no two people may own a fifth of a season" —
    // on a quantity that is a share by construction and so cannot drift with
    // the round budget or the pool size. Converting it to a ratio against the
    // uniform control would be strictly worse: if a future change made the
    // control monopolise too, a ratio ceiling would let the live arm rise with
    // it, which is the exact failure the band exists to catch.
    //
    // RE-MEASURED AT HEAD, six decorrelated 200-season blocks: 0.1407 0.1535
    // 0.1440 0.1550 0.1476 0.1484 — mean 0.1482, sd 0.0055, so the 0.20
    // ceiling is 9.4 sd up. Uniform selection reads 0.0636 (ratio 2.33x).
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
  // THE TRIPWIRE HAS FIRED AND THIS IS THE BAND IT WAS HOLDING THE PLACE FOR.
  //
  // What stood here asserted `blocked === 0` and said, in as many words, that
  // the moment a mission awarded a Shield the count was to be MEASURED and the
  // assertion swapped for the plan's original. Both have now happened: the
  // Reliquary (js/tr/missions.js) awards Shields, js/tr/powers.js decides who
  // saw it won, and a season reaches this state on its own.
  //
  // MEASURED, so the floor below is placed rather than hoped for. Over 400
  // seasons: 1.66 Shields a season, of which 4.1% block a murder — 0.068
  // blocked murders a season, or about one season in fifteen. Over the 200
  // seasons this file plays the expectation is therefore ~13.6, and a Poisson
  // sd of 3.7 puts a floor of zero 3.7 sd below the measurement, which is the
  // separation this project requires of a sampled assertion.
  //
  // WHY IT IS RARE, AND WHY THAT IS THE DESIGN RATHER THAN A SHORTFALL. A
  // Shield only blocks anything if the Traitor who wins the conclave's argument
  // is BOTH blind to it (they were not among the players who saw it won) and
  // happens to be pointed at the holder out of a room of ten or more. Nearly
  // every Shield expires unused, which is what makes winning one a gamble
  // rather than a purchase — and, since the room saw some of them won, a
  // liability the next morning. If this number ever climbs towards one a
  // season, something has made Shields common or the conclave blind, and both
  // are regressions.
  it('A BLOCKED MURDER IS VISIBLE: a season reaches the state on its own', () => {
    const blocked = seasons.reduce((n, s) => n + (s.blockedMurders?.length || 0), 0);
    const murders = seasons.reduce((n, s) => n + s.log.filter(r => r.murdered).length, 0);
    // Executions are the OTHER way the castle loses somebody at night: a
    // refused ultimatum. They are counted here rather than folded into
    // `murdered` because MURDERS THE COALITION is a measurement of
    // formPreference's victim choice and an execution is chooseRecruit's —
    // but a death that no number reports is a death no measurement can find,
    // and until offerRecruitment returned `executed` this one was invisible.
    const executed = seasons.reduce((n, s) => n + s.log.filter(r => r.executed).length, 0);
    const shields = seasons.reduce((n, s) => n + (s.shields?.length || 0), 0);
    console.log(`blocked murders across ${seasons.length} seasons: ${blocked} `
      + `(against ${murders} completed murders, ${executed} refused-ultimatum executions `
      + `and ${shields} Shields won, ${(blocked / Math.max(1, shields) * 100).toFixed(1)}% of which blocked something)`);
    expect(murders, 'no murders at all: this comparison would be vacuous').toBeGreaterThan(200);
    expect(shields, 'no Shield was won at all: the block path cannot be reached')
      .toBeGreaterThan(100);
    expect(blocked, 'the shield path never fired in 200 seasons').toBeGreaterThan(0);
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
  // ── THE PACT BREAKS, AND ONLY WHERE IT SHOULD ────────────────────
  //
  // Plan 6 Task 6 replaced an absolute bar on a Traitor naming a fellow (zero
  // occurrences in 1,996 seasons) with a price that falls as the field shrinks
  // and the pot grows. This is the POPULATION arm of that guard; the decision
  // arm is in tests/tr-deduction.test.js.
  //
  // IT COUNTS OPPORTUNITIES, NOT SEASONS, AND IT STATES ITS COVERAGE. Task 4 of
  // this plan shipped a guard a mutation SURVIVED, because the forbidden state
  // arose in 22 seasons out of 400 and a season-level assertion could not see
  // the rule break. A betrayal is rarer than that on purpose — the price is
  // what makes it rare — so the denominator here is every ballot on which a
  // Traitor HAD a fellow to name and somebody else to name instead, and the
  // floors below fail loudly if the run stops producing those.
  //
  // ── AND THE LATE ARM IS TWO POPULATIONS, BANDED APART ────────────────
  //
  // (Whole-plan review, F6.) The `living <= 6` bucket was cut by Task 6 against
  // 149 MANDATED decisions. Task 7 then added 362 ENDGAME decisions to the same
  // bucket without touching this file, and they betray at 50.3% against the
  // mandated half's 11.4% — so the band Task 6 wrote was, by the end of the
  // plan, carried almost entirely by a mechanism built after it. Pooled, the
  // arm could not tell a dead mandated channel from a live endgame one. Two
  // buckets now, each with its own coverage floor and its own band.
  //
  // BOTH NUMBERS, AT BOTH SAMPLE SIZES, because this plan's closing correction
  // is that a lesson learned in one measurement does not reach the others:
  //
  //     arm                    200 seasons        1,200 seasons
  //     full castle (>=10)     0 / 2,770          0 / 16,385
  //     mid (7-9)              0 / 530            0 / 3,114
  //     mandated, <=6 living   17 / 149  = 11.41%  175 / 865  = 20.23%
  //     endgame, <=6 living    182 / 362 = 50.28%  1,008 / 1,996 = 50.50%
  //
  // NOTE — the endgame row above is the PRE-BOUNDARY-MOVE reading. When the
  // mandated loop stopped breaking on bare `fa <= tr` (headless.js), endgames
  // began convening at the final three-to-five instead of at any parity size,
  // and this arm re-read to 224/294 = 76.2% (200 seasons) / stable ~78% at 500
  // — a real relocation of the population, not an engine change. The two-sided
  // band far below is re-cut around it; the derivation and the size breakdown
  // are on that band.
  //
  // The endgame arm is stable to two decimal places. THE MANDATED ARM IS NOT:
  // 11.41% on n=149 is 2.7 sd below the 20.23% the larger sample gives, and
  // that 11.41% is the figure this file's own population reads. So its floor is
  // cut well under the LOW reading rather than near either — the point of the
  // band is that the channel is alive, and there is no honest way to bound a
  // rate this file cannot measure to better than +/-3pp.
  it('THE PACT BREAKS LATE AND NEVER EARLY, over the decisions themselves', () => {
    const big = { n: 0, b: 0 }, mandated = { n: 0, b: 0 }, endgame = { n: 0, b: 0 };
    const restore = _setPactWatch(d => {
      // No choice was on offer unless there was a fellow AND a non-fellow.
      if (!d.fellows.length || d.fellows.length >= d.pool.length) return;
      const bucket = d.living >= 10 ? big
        : (d.living <= 6 ? (d.endgame ? endgame : mandated) : null);
      if (!bucket) return;
      bucket.n++;
      if (d.betrayed) bucket.b++;
    });
    try { run(); } finally { restore(); }

    const pct = (x) => (x.b / x.n * 100).toFixed(2);
    console.log(`pact: full castle (10+ living) ${big.b}/${big.n} betrayals`
      + ` = ${pct(big)}%; late MANDATED (<=6 living) ${mandated.b}/${mandated.n}`
      + ` = ${pct(mandated)}%; ENDGAME (<=6 living) ${endgame.b}/${endgame.n}`
      + ` = ${pct(endgame)}%`);

    // COVERAGE FIRST, PER ARM AND NEVER POOLED. Without these a run that
    // reached none of the states would pass while observing nothing, which is
    // how Task 4's guard stayed green with its rule deleted — and a pooled
    // floor is carried by one live channel while the other is dead, which is
    // the shape Task 5 shipped and had to unpick.
    expect(big.n, 'no Traitor ever faced this decision in a full castle — '
      + 'the early arm is vacuous').toBeGreaterThan(2000);
    expect(mandated.n, 'the mandated loop never once left a Traitor in a room of six or '
      + 'fewer with a fellow still in it — this arm is vacuous').toBeGreaterThan(100);
    expect(endgame.n, 'no endgame table ever put the question to a Traitor with a fellow '
      + 'opposite — the endgame arm is vacuous').toBeGreaterThan(250);

    // Early: the pact is not for sale while there is a castle full of people
    // to spend instead. Measured 0/2,770 here and 0/16,385 at 1,200 seasons;
    // the band is written as a rate rather than as zero so that a single freak
    // room does not go red on something the model does permit in principle.
    expect(big.b / big.n, 'Traitors are naming each other in a full castle — '
      + 'the price is not being charged early').toBeLessThan(0.005);

    // LATE AND MANDATED. Task 6's own population, and the one the original
    // band was cut against. 11.41% here, 20.23% at 1,200; the floor is a
    // quarter of the low reading and 3.2 sd below it on this sample's own
    // binomial error, which is as tight as a rate measured on 149 decisions
    // may honestly be drawn.
    expect(mandated.b, 'not one Traitor turned on a fellow in the mandated loop — the '
      + 'channel Task 6 built is dead and the pooled band used to hide it')
      .toBeGreaterThan(3);
    expect(mandated.b / mandated.n, 'the late mandated betrayal rate has collapsed toward '
      + 'the old hard bar').toBeGreaterThan(0.03);

    // THE ENDGAME. RE-EXPRESSED when the endgame boundary moved (headless.js:
    // the mandated loop no longer breaks on bare `fa <= tr`, which used to open
    // the reveal-less finale at a 3-v-3 SIX-hander and stop the murders two
    // nights early — the bug this re-derivation rides in on). Parity now opens
    // the endgame only once the room is already small (endgameSize + 2), so
    // endgames convene at the final three-to-five rather than at any parity
    // size. That is the show's own fire-round size, and it MOVES THIS RATE by
    // changing WHAT IS BEING COUNTED, exactly as this file's split-out warns:
    // the old 50.3% center was a DILUTION artifact of the size-6 endgames the
    // bug produced, where a Traitor had three non-fellows to name and rarely
    // had to turn on the pact. It was never the true final-table rate.
    //
    // Measured over this file's own 200 seeds, and stable across a sample bump:
    //
    //     endgame arm       200 seasons        500 seasons
    //     betrayal rate     224 / 294 = 76.2%  542 / 693 = 78.2%
    //     by room size      3: 92%  4: 87%  5: 52%
    //
    // The rate is size-driven: fellow-naming is near-forced in a three- or
    // four-hander (few non-fellows left to name instead) and only ~half-priced
    // at five. The two-sided band is re-cut around the new stable ~0.77: the
    // floor still asserts the endgame is where the pact breaks (it breaks there
    // far MORE than the mandated loop's 13-15%), and the ceiling still asserts
    // the price is charged at all — a rate at 1.0 would mean a Traitor always
    // names a fellow, which the reluctance term forbids. ~5.7 sd either side on
    // n=294 (binomial sd 0.0247) is ±0.14.
    expect(endgame.b / endgame.n, 'the endgame has stopped being the place the pact '
      + 'breaks').toBeGreaterThan(0.62);
    expect(endgame.b / endgame.n, 'the endgame is now betraying at a rate that has '
      + 'stopped charging the price at all — a Traitor is always naming a fellow')
      .toBeLessThan(0.90);
  });

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
