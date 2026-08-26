// ══════════════════════════════════════════════════════════════════════
// tr/deduction.js — what the castle believes about who is a Traitor
// ══════════════════════════════════════════════════════════════════════
//
// This is the show. Everything else — the missions, the pot, the murder — feeds
// the one question a Round Table asks, and this file is where the answer forms.
//
// It is a layer on js/knowledge.js rather than a system of its own, and the fit
// is close enough to be worth stating. That module already models a fact with a
// ground truth, a per-person belief with a confidence and a source, a
// credibility tier per source type, decay with age, and a read-skill roll on
// mental+intuition that decides both whether you accept a claim AND whether you
// see through a false one. Point all of that at a new `alignment` fact type and
// most of a social deduction engine is already written.
//
// THE ONE RULE THAT MAKES IT WORK: nobody ever OBSERVES an alignment. The
// Traitors are told theirs; everybody else can only ever deduce or hear a rumour,
// which the credibility tiers cap at 0.62 and 0.45. So no Faithful can reach
// certainty, ever, about anyone — which is exactly the state the people on this
// show are in, and it falls out of the tier table rather than out of a special
// case in every reader.
import { gs } from '../core.js';
import { recordFact, learn, believes } from '../knowledge.js';
import { alignmentFactId, livingTraitors, alignmentAt } from './roles.js';
import { getBond } from '../bonds.js';

export { alignmentFactId };

/**
 * The Traitors meet, and learn each other with certainty.
 *
 * `public` credibility (1.0) is correct and is the ONLY place it is used for an
 * alignment: they are standing in a room together wearing the cloaks. Every
 * other belief about alignment in the whole game arrives as `deduced` or
 * `rumor`. If a second caller ever passes `public` or `observed` here, the
 * ceiling that makes the format work is gone.
 */
export function seedTraitorKnowledge(ep) {
  const traitors = livingTraitors(ep);
  for (const knower of traitors) {
    for (const subject of traitors) {
      learn(knower, alignmentFactId(subject),
        { source: 'the turret', sourceType: 'public', ep, rng: () => 0 });
    }
  }
  return traitors;
}

/** Store a completed round. This is also the export shape (spec §10.1). */
export function recordRound(round) {
  if (!gs.tr) return null;
  (gs.tr.rounds ||= []).push(round);
  return round;
}

/**
 * Every banishment ballot cast so far, oldest first.
 *
 * `ep` is the only thing added, and it is the only thing any caller ever read.
 * This used to decorate each ballot with the round's `banished` and
 * `wasTraitor` as well; nothing anywhere looked at either, and a field that is
 * written and never read is a claim about what this evidence considers that is
 * not true. The reveal loop below gets both from the round it is already
 * standing in.
 */
function banishmentBallots() {
  return (gs.tr?.rounds || []).flatMap(r =>
    (r.ballots || []).filter(b => b.channel === 'banishment')
      .map(b => ({ ...b, ep: r.ep })));
}

// How hard each ballot pattern pushes. Deliberately small: a single vote is a
// hint, not a proof, and the ceiling in learn() is what stops a pile of hints
// becoming certainty.
//
// TWO SIGNALS THAT USED TO SIT HERE AND ARE GONE, because a constant that reads
// as tuned while being unreachable is a worse lie than no constant at all:
//
//   votedRevealedTraitor: -0.16  — "exonerating". It was assigned and then
//   discarded unconditionally three lines later by `if (weight <= 0) continue`,
//   so it never once entered a belief in any season this engine has played. Nor
//   could it: js/knowledge.js has no representation for a NEGATIVE belief —
//   confidence is a magnitude, and learn() keeps the strongest evidence seen, so
//   there is nothing for a minus sign to write to. Exoneration here is the
//   ABSENCE of a suspicion, and naming the revealed Traitor already buys exactly
//   that: everybody else in the room takes a defendedRevealedTraitor hit and you
//   do not. That is a real relative effect and it is the only one available.
//   Reinstating a signed weight means giving beliefs a sign first, which is a
//   knowledge-layer change and not a Traitors one.
//
//   votedRevealedFaithful: 0.10  — "you spent a life for nothing". It reached
//   learn() as a confidence of 0.16, which _assess() turns into an acceptance
//   probability of about 0.045: one observer in twenty-two, and inert by any
//   measurement. Raising it is not the answer either, because of WHO it points
//   at — a banished Faithful is normally named by most of the room, so the
//   signal indicts the majority and carries almost no information about anyone.
//   A revealed Faithful tells the castle it was wrong, not who is guilty.
//   revealCascade() already says precisely that; now this agrees with it.
const W = {
  defendedRevealedTraitor: 0.34,   // you kept a Traitor in. The strongest read available.
  pairSilence:             0.35,   // scales how UNLIKELY a silent pair record is
  pairSilenceCeiling:      0.24,   // ...and how far that can ever get, which is not far
};

/**
 * Turn the public ballot record into deduced beliefs about alignment.
 *
 * Runs once per round, after a banishment reveal. Every belief it forms arrives
 * as `deduced`, so it goes through _assess() in js/knowledge.js.
 *
 * BE ACCURATE ABOUT WHAT _assess() ACTUALLY DOES, because the sentence that used
 * to stand here — "a sharp reader accepts a real pattern and sees through a
 * coincidental one" — describes something it cannot do. It has no access to the
 * pattern. It reads the fact's GROUND TRUTH, and marks the belief `valence:
 * 'false'` at a rate scaled by mental+intuition when the truth is false; the
 * belief is then worth nothing, because suspicion() maps a false valence to 0.
 * About a third of all the suspicion ever aimed at a Faithful is deleted for the
 * sole reason that they are a Faithful.
 *
 * That is deliberate and sanctioned by spec §4.2 ("sharp readers see through the
 * frame"): it is an INTUITION PRIOR — a smart player's unearned, unjustified,
 * frequently-correct hunch that the story they are being told about somebody is
 * not the true one. It is a real part of what this format is. But it is an
 * oracle, it is a large share of this engine's measured detection, and anyone
 * reading a lift number here should know it is in there. It is not inference,
 * and no amount of ballot reading is responsible for it.
 */
export function ballotEvidence(ep, rng = Math.random) {
  const ballots = banishmentBallots();
  if (!ballots.length) return [];
  const living = gs.activePlayers || [];
  const formed = [];

  // ── reveals: who protected whom, and who was right ──────────────────
  const reveals = (gs.tr?.rounds || []).filter(r => r.banished);
  for (const round of reveals) {
    // Revote ballots count here, and they were excluded before for no reason.
    // They are read aloud in front of exactly the same room, and they are a
    // CLEANER signal than the first ballot: the field has been narrowed to the
    // tied players, so naming somebody other than the person who turned out to
    // be a Traitor is a two-way choice rather than a pick from fifteen names.
    // Worth 30.7% against 29.9% on the hit rate over 200 seasons, and +1.2pp on
    // the late-season lift.
    //
    // They deliberately do NOT feed the pair-silence loop below. A revote where
    // you were not allowed to name somebody is not a chance you passed up.
    const cast = ballots.filter(b => b.ep === round.ep)
      .concat((round.revotes || []).flatMap(rv => rv.ballots || []));
    for (const b of cast) {
      if (!living.includes(b.voter)) continue;
      // One pattern, and only one, is evidence about a person: you kept somebody
      // in on a night they turned out to be a Traitor. Naming them buys nothing
      // positive — it buys the absence of this, which is all exoneration is here.
      if (!round.banishedWasTraitor) continue;
      if (b.voted === round.banished) continue;
      const weight = W.defendedRevealedTraitor;
      for (const observer of living) {
        if (observer === b.voter) continue;
        const belief = learn(observer, alignmentFactId(b.voter), {
          source: `the ballot in episode ${round.ep}`,
          sourceType: 'deduced',
          confidence: weight * 1.6,
          ep, rng,
        });
        if (belief) formed.push({ observer, subject: b.voter, weight, ep: round.ep });
      }
    }
  }

  // ── the pair who never touch each other ─────────────────────────────
  // Catches real Traitor pairs AND innocent best friends, and the false
  // positive is the point: this is how a castle convinces itself about two
  // people who simply like each other.
  //
  // WHY THIS IS NORMALISED BY OPPORTUNITY AND NOT BY ELAPSED ROUNDS.
  //
  // It used to read `min(0.5, 0.07 * roundsSoFar)`, so the confidence of every
  // silent pair GREW with the length of the season regardless of anything the
  // pair had actually done — acceptance climbed from about 10% at three rounds
  // to 44% at seven. For most pairs this signal is symmetric noise, so what rose
  // all season was the NOISE FLOOR: mean suspicion of an innocent Faithful went
  // 0.11 -> 0.29 -> 0.37 across banishment rounds 4, 6 and 8, while the gap to a
  // Traitor plateaued at ~0.11 from round 6 — and the vote noise term in
  // chooseBanishmentVote is 0.35, three times that margin. The engine peaked at
  // round 4-5 and degraded into the endgame, which is backwards for a format
  // whose whole promise is that the last table is the sharpest one.
  //
  // The information in a silence is not how long the season has run. It is how
  // unlikely the silence was GIVEN THE CHANCES they had to break it. A pair who
  // have only shared three votes in a room of eighteen have said almost nothing,
  // because a random ballot would rarely have landed on that one name anyway; a
  // pair still silent after nine shared votes in a room of eight have said
  // something. So each shared round contributes its own per-round probability
  // that a ballot WOULD have broken the silence, the run compounds into a
  // probability that the silence is coincidence, and the result is capped low.
  // It still grows — slowly, and for a reason — and it stays weak, because
  // innocent friends are supposed to keep getting caught by it.
  const eps = [...new Set(ballots.map(b => b.ep))].sort((x, y) => x - y);
  const votersByEp = new Map(eps.map(e => [e, new Set(ballots.filter(b => b.ep === e).map(b => b.voter))]));
  for (const a of living) {
    for (const b of living) {
      if (a >= b) continue;
      if (ballots.some(x => (x.voter === a && x.voted === b) || (x.voter === b && x.voted === a))) continue;
      // Only rounds in which BOTH of them actually cast a ballot were chances to
      // name each other. A pair who overlapped for two nights is not a pattern.
      let pCoincidence = 1, shared = 0;
      for (const e of eps) {
        const voters = votersByEp.get(e);
        if (!voters.has(a) || !voters.has(b) || voters.size < 3) continue;
        shared++;
        // Two ballots, each of which could have landed on the other's name out
        // of that night's field.
        pCoincidence *= Math.max(0, 1 - 2 / (voters.size - 1));
      }
      if (shared < 3) continue;
      const conf = Math.min(W.pairSilenceCeiling, W.pairSilence * (1 - pCoincidence));
      for (const observer of living) {
        if (observer === a || observer === b) continue;
        for (const subject of [a, b]) {
          const belief = learn(observer, alignmentFactId(subject), {
            source: `never once voted against ${subject === a ? b : a}`,
            sourceType: 'deduced', confidence: conf, ep, rng,
          });
          if (belief) formed.push({ observer, subject, weight: conf, ep });
        }
      }
    }
  }

  return formed;
}

/**
 * How much does a warm relationship blunt a suspicion?
 *
 * Not a rounding error — it is the mechanism by which a well-liked Traitor
 * survives a table the evidence should have lost them, and by which a Faithful's
 * best friend is the last person they will name. At bond +10 roughly half the
 * signal is absorbed; at 0 none of it is; hostility sharpens it slightly.
 */
function bondResistance(observer, target) {
  const bond = getBond(observer, target);
  return bond >= 0 ? 1 - (bond / 10) * 0.5 : 1 + Math.min(0.2, -bond / 50);
}

/** How strongly `observer` suspects `target` right now. 0 = no read at all. */
export function suspicion(observer, target, ep) {
  if (observer === target) return 0;
  const b = believes(observer, alignmentFactId(target), ep);
  if (!b) return 0;
  // A belief the observer has correctly identified as FALSE is not suspicion —
  // it is the opposite, and treating it as a small positive is how a sharp
  // reader ends up voting for the person they just cleared.
  if (b.valence === 'false') return 0;
  return Math.max(0, b.effectiveConfidence * bondResistance(observer, target));
}

/** Everyone `observer` could name, most suspected first. */
export function suspicionBoard(observer, ep, candidates = null) {
  const pool = (candidates || gs.activePlayers || []).filter(n => n !== observer);
  return pool
    .map(name => ({ name, score: suspicion(observer, name, ep) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Who does `voter` write down?
 *
 * The noise term is load-bearing in both directions. Without it a room with any
 * shared evidence votes unanimously every single round, which no Round Table has
 * ever done; and a room with NO evidence votes for whoever sorts first, which
 * would decide episode one alphabetically.
 */
export function chooseBanishmentVote(voter, candidates, ep, rng = Math.random) {
  const pool = (candidates || []).filter(n => n !== voter);
  if (!pool.length) return null;

  // A Traitor knows exactly who not to name, and will spend a Faithful to
  // protect the pact — until there is nobody else left to spend.
  const isTraitor = alignmentAt(voter, ep) === 'traitor';
  const safe = isTraitor ? pool.filter(n => alignmentAt(n, ep) !== 'traitor') : pool;
  const usable = safe.length ? safe : pool;

  const scored = usable.map(name => ({
    name,
    score: suspicion(voter, name, ep) + rng() * 0.35,
  })).sort((a, b) => b.score - a.score);
  return scored[0].name;
}

/**
 * A banishment reveal, and everything it retroactively re-scores.
 *
 * The certainty is about ONE person and is the only one a Faithful ever gets.
 * The value is in the second half: a room that now knows Duncan was a Traitor
 * also knows who spent a vote keeping him, and that is real evidence about
 * THOSE people, arrived at by reasoning rather than by being told.
 *
 * This is why the last three Round Tables of a season feel different from the
 * first three without anything being scripted — every reveal converts a round of
 * ballots that meant nothing into a round of ballots that mean something.
 */
export function revealCascade(name, wasTraitor, ep, rng = Math.random) {
  // The one line in this engine that hands out certainty about an alignment to
  // the whole room. It is only ever legitimate about somebody who has just LEFT
  // the game and said it out loud. Today that holds by call order — runRoundTable
  // removes the banished player before calling — which is not a rule, it is a
  // coincidence one refactor away from ending. A future caller (a murder reveal,
  // a recruitment exposure, an exit blowup) that fires this about a LIVING player
  // would collapse the format in a single line, so refuse it here rather than
  // trusting every future call site.
  if (!name || (gs.activePlayers || []).includes(name)) return [];
  const living = (gs.activePlayers || []).filter(n => n !== name);

  // 1. The certainty. `public` is correct: they said it out loud, to the room.
  //    This and seedTraitorKnowledge are the only two places alignment is ever
  //    learned at better than `deduced`.
  recordFact({ type: 'alignment', subject: name, truth: !!wasTraitor, ep });
  for (const observer of living) {
    learn(observer, alignmentFactId(name),
      { source: 'the reveal', sourceType: 'public', ep, rng: () => 0 });
  }

  // 2. The re-scoring. Only a revealed TRAITOR indicts their defenders — a
  //    revealed Faithful tells you the room was wrong, not who is guilty.
  if (!wasTraitor) return [];
  const round = (gs.tr?.rounds || []).find(r => r.ep === ep && r.banished === name);
  if (!round) return [];

  const formed = [];
  for (const b of (round.ballots || [])) {
    if (b.channel !== 'banishment' || !living.includes(b.voter)) continue;
    if (b.voted === name) continue;                 // they were right; nothing to answer for
    for (const observer of living) {
      if (observer === b.voter) continue;
      const belief = learn(observer, alignmentFactId(b.voter), {
        source: `kept ${name} in on the night ${name} was revealed`,
        sourceType: 'deduced', confidence: 0.5, ep, rng,
      });
      if (belief) formed.push({ observer, subject: b.voter });
    }
  }
  return formed;
}
