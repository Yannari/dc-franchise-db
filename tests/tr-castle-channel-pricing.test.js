// ══════════════════════════════════════════════════════════════════════
// tr-castle-channel-pricing.test.js — why the castle still writes no
// beliefs, as a measurement instead of a policy
// ══════════════════════════════════════════════════════════════════════
//
// tests/tr-castle-belief-gate.test.js enforces that js/tr/castle/ writes ZERO
// beliefs, and states the condition for that ever changing: "a castle event
// does not get to make the room RIGHT about somebody until its channel has
// been priced". This file is that pricing. It exists so the rule is backed by
// a number anybody can re-run rather than by a paragraph.
//
// ── WHY ANYBODY WANTED TO OPEN IT ─────────────────────────────────────
//
// Measured over 60 seasons, 96.7% of every reason the Round Table cites comes
// from the VOTING RECORD, and three phrases are 95% of it:
//
//     38.9%  kept a revealed Traitor in
//     28.6%  never once voted against X
//     27.6%  pushed somebody who then died
//
// The castle runs ~67 suspicion scenes a season — an account that did not
// hold, a story that changed — and none of it is admissible, so the debate can
// only ever argue about ballots.
//
// ── THE ANSWER, AND IT IS NO ──────────────────────────────────────────
//
// The narrowest concrete class the castle has is two players checking a THIRD
// person's account (`topicKind: 'suspicion-third'`) on a branch the screen
// itself words as damaging. Priced against `any-faithful`, it is an
// ANTI-SIGNAL: it names Traitors LESS often than a random living Faithful, so
// opening it would point the castle at innocents — the `clashTraced` failure
// this project has already shipped once.
//
// AND THE CONTENTLESS TWIN IS WHY THAT IS BELIEVABLE — though not in the way
// this comment first claimed, and the correction is worth keeping.
//
// At 40 seasons (n=75) the twin SCORED BETTER than the adverse channel, and
// this file said so: "being talked about at all carries more than being talked
// about badly". Re-measured at 220 seasons (n=265) that reverses — the adverse
// branch reads 1.244 against the twin's 1.026. The original comparison was
// noise on 75 emissions, which is the same knife-edge mistake the SEASONS
// constant below records.
//
// WHAT SURVIVES, AND IT IS THE PART THAT MATTERED: both are ANTI-SIGNALS
// against their own controls (-0.230 and -0.370). The adverse filter buys a
// little over the unfiltered twin and nowhere near enough to reach the bar, so
// the branch — the part a reader would assume was the evidence — does not make
// an uninformative channel informative.
//
// THE CAUSE IS STRUCTURAL AND NO AMOUNT OF PROSE FIXES IT. Castle scenes are
// alignment-blind by construction: the sampler chooses who a scene is about
// from threads, bonds and who has not had a scene lately. None of that touches
// who was actually out at night, so the subject cannot carry information
// however the outcome is worded.
//
// ── WHAT WOULD WORK, PRICED SO THE NEXT AUTHOR DOES NOT GUESS ─────────
//
// A scene whose OUTCOME IS COUPLED TO THE NIGHT. `murderBallots` records who
// was awake choosing a name, which is the hour a morning alibi scene asks
// about. Coupled at a realistic rate — a scene reaches 30% of the people who
// were really out, and wrongly snags 12% of those who were not — the channel
// PASSES the gate with margin, on both disjoint blocks.
//
// So the castle is not inadmissible in principle. THIS castle event is,
// because it is not about anything.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { measureChannel } from '../js/tr/channel-audit.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
// 40 -> 220, AND THE FIRST VERSION OF THIS FILE WAS WRONG TO USE 40.
//
// At 40 seasons the uncoupled castle channel emits about 47 indictments, and
// this file then asserted a THRESHOLD on the edge computed from them. That is
// the knife-edge guard this project keeps re-learning: adding three events
// elsewhere shifted the rng stream, the same channel re-measured at +0.152
// instead of -0.248, and the test failed on noise rather than on a change in
// what it guards. `gateChannel` itself refuses to rule below 200 emissions —
// "too rare to measure, not too rare to build" — and this file should not have
// been more confident than the tool it is quoting.
const SEASONS = 220;

/** One measurement, shared: each of these plays 40 seasons. */
function priced(source) {
  setPlayers(ROSTER);
  return measureChannel({ source, cast: CAST, seasons: SEASONS });
}
const ADVERSE = priced('castle-third-party-adverse');
const ANY = priced('castle-third-party-any');
const COUPLED = priced('synthetic-alibi-noisy');

describe('the castle suspicion channel is priced, and it does not pass', () => {
  it('names Traitors no more often than a random living Faithful', () => {
    console.log(`[pricing] castle-third-party-adverse n=${ADVERSE.n} `
      + `ratio ${ADVERSE.ratio.toFixed(3)} ctrl ${ADVERSE.controlRatio.toFixed(3)} `
      + `edge ${ADVERSE.edge.toFixed(3)}`);
    expect(ADVERSE.n, 'too few emissions to rule on — gateChannel refuses below 200')
      .toBeGreaterThan(200);
    // The gate's bar is +0.15. This is nowhere near it and is on the wrong
    // side of zero; the assertion is deliberately loose so it fails only if
    // something has genuinely changed, not on stream noise.
    expect(ADVERSE.edge, 'the castle channel has become informative — re-run the '
      + 'full gateChannel() and reconsider tests/tr-castle-belief-gate.test.js')
      .toBeLessThan(0.05);
  });

  it('and the branch filter does not rescue it, which is how we know', () => {
    console.log(`[pricing] castle-third-party-any     n=${ANY.n} `
      + `ratio ${ANY.ratio.toFixed(3)} edge ${ANY.edge.toFixed(3)}`);
    // THE TWIN. Same scenes, same rounds, every branch. The claim is NOT that
    // the twin outscores the filtered channel — measured properly it does not
    // (see the header). It is that BOTH sit below their own controls, so the
    // branch filter, which is the only thing a reader would take for the
    // evidence, does not turn an uninformative channel into an informative
    // one. Assert that directly instead of on the ordering of two noisy
    // ratios, which is what the first version of this arm did.
    expect(ANY.n, 'the twin emitted nothing').toBeGreaterThan(400);
    expect(ANY.edge, 'the unfiltered castle channel has become informative')
      .toBeLessThan(0.05);
    expect(ADVERSE.edge, 'the branch filter now lifts the castle channel over '
      + 'the bar — re-run gateChannel() and reconsider '
      + 'tests/tr-castle-belief-gate.test.js').toBeLessThan(0.05);
  });
});

describe('a scene coupled to the night would pass', () => {
  it('clears the gate at a realistic catch rate, so the door is not bricked up', () => {
    console.log(`[pricing] synthetic-alibi-noisy      n=${COUPLED.n} `
      + `ratio ${COUPLED.ratio.toFixed(3)} ctrl ${COUPLED.controlRatio.toFixed(3)} `
      + `edge ${COUPLED.edge.toFixed(3)}`);
    // 30% catch, 12% false positive — deliberately unflattering, and it still
    // clears +0.15. This arm is the constructive half of the finding: it says
    // the castle CAN be made admissible, and names the property that would do
    // it, so the negative result above is not read as "never".
    expect(COUPLED.n, 'the coupled channel emitted nothing').toBeGreaterThan(800);
    expect(COUPLED.edge, 'a channel coupled to the conclave no longer beats its '
      + 'control — the constructive half of this finding has gone stale')
      .toBeGreaterThan(0.15);
  });
});
