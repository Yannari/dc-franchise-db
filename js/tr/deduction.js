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
// Traitors are told theirs; everybody else can only ever deduce or hear a
// rumour, and every such belief is capped at 0.62 — the ALIGNMENT_CRED_CEILING
// in js/knowledge.js. So no Faithful can reach certainty, ever, about anyone,
// which is exactly the state the people on this show are in.
//
// 0.62 IS THE NUMBER THAT DOES THE WORK, and this sentence used to name 0.45
// as if the rumour tier were a second ceiling. It is not one. An explicit
// `confidence` bypasses SOURCE_CRED entirely, and roundtable.js's broadcast()
// passes one — `Math.max(0.05, Math.min(0.6, pitch * trust))`, up to 0.60,
// through `sourceType: 'rumor'`. Measured over 200 seasons, the strongest
// belief any Faithful holds all season is 0.5997 and it arrives by exactly that
// path. The rumour tier caps only the callers that pass no confidence; the
// ceiling in learn() is what actually bounds the format.
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
//   defendedRevealedTraitor: 0.34  — "you kept a Traitor in". Still the strongest
//   read in the engine, but it is not a BALLOT weight any more and does not
//   belong here: revealCascade() emits it once, at the moment of the reveal, at
//   its own confidence of 0.5. Leaving the constant here would invite a second
//   caller, and a second caller is precisely the bug that was deleted (see the
//   long note inside ballotEvidence).
const W = {
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

  // ── THE REVEAL LOOP THAT USED TO STAND HERE, AND WHY IT IS GONE ─────
  //
  // It walked EVERY past reveal on EVERY round and, for each one, re-indicted
  // every voter who had not named the person who turned out to be a Traitor —
  // at confidence 0.544 (the old W.defendedRevealedTraitor * 1.6). revealCascade()
  // already emits exactly that indictment, once, at 0.5, at the moment the
  // reveal becomes knowable. This was the same fact learned again every round
  // for the rest of the season.
  //
  // THE MECHANISM THAT MAKES REPETITION HARMFUL RATHER THAN NEUTRAL, and the
  // reason nobody should re-add this: learn() OVERWRITES a stored valence when
  // the new confidence is >= the stored one, and _assess() stores the
  // protective `valence: 'false'` — the intuition prior that clears an innocent
  // — at a rate scaled by mental+intuition. Re-rolling the same indictment
  // every round therefore keeps re-rolling that protective valence away, and it
  // does so at a HIGHER confidence than the cascade's, so it always wins the
  // overwrite. It does not sharpen the read; it strips the protection off
  // exactly the innocent people it indicts. Measured: protection on Faithfuls
  // 41.9% with the cascade alone, 29.2% with this re-walk bolted on.
  //
  // Deleting it is worth, over 200 seasons: aggregate lift 1.29x -> 1.52x,
  // early->late growth 20.8pp -> 31.2pp, Faithful win rate 41% -> 54%.
  //
  // One indictment at the moment of knowledge is both the correct model of the
  // room — you learn a thing once, when it happens — and the stronger engine.
  // The revote ballots this loop used to fold in went with it: they were only
  // ever a second helping of the same defender signal, and they deliberately
  // never fed the pair rule below (a revote in which you were not ALLOWED to
  // name somebody is not a chance you passed up).

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

/**
 * Does `observer` KNOW `target`'s alignment, rather than merely suspect it?
 *
 * READ-ONLY, and it exists so the castle layer can condition on the pact
 * WITHOUT reading ground truth. The castle is forbidden from importing
 * knowledge.js (tests/tr-castle-belief-gate.test.js), and `suspicion()` alone
 * cannot answer this: it multiplies by bondResistance, so a warm pair's
 * turret-grade certainty and a cold pair's deduced guess land on the same
 * number and no threshold separates them.
 *
 * `public` is the discriminator, and it is a closed set by design: the only
 * three writers of a `public` alignment belief are the turret seeding, the
 * banishment reveal, and a recruit being shown the turret (see the ceiling
 * note in js/knowledge.js). Every other alignment belief in the game — every
 * deduction, every rumour — arrives capped at ALIGNMENT_CRED_CEILING and is
 * therefore a suspicion, never knowledge, whatever its number.
 */
export function knowsAlignmentOf(observer, target, ep) {
  if (observer === target) return false;
  const b = believes(observer, alignmentFactId(target), ep);
  if (!b || b.valence !== 'accurate') return false;
  return b.sourceType === 'public' && b.effectiveConfidence > 0;
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

// How loud each murder-shaped inference is. Smaller than the ballot weights on
// purpose: a murder is one data point a night, and the ballot record is many.
//
// BOTH CHANNELS ARE PRICED AGAINST A CONTROL, NOT AGAINST A FLAT BASE, AND
// THAT IS THE WHOLE OF THE ARGUMENT. An earlier version of this comment priced
// `pushedThenDied` at 0.48 on "30.4% vs 21.0% base = 1.45x, a real signal".
// That base was the season-wide aggregate Traitor share, and the murder removes
// a Faithful every night, so Traitor density climbs monotonically — measuring
// any late-arriving channel against a flat aggregate credits it for the drift.
//
// Re-measured at the EMISSION level over 600 seasons, each indictment scored
// against the Traitor density of the room it was actually emitted into:
//
//   pushedThenDied              n=2261    24.1% vs base 19.9%  = 1.21x
//   CTRL: voted for ANY faithful n=30308  23.3% vs base 19.4%  = 1.20x
//   clashTraced                 n=1456    17.0% vs base 19.5%  = 0.87x
//
// The control is the point. `pushedThenDied` beats a room's Traitor density by
// 1.21x — and so does the entirely uninformative statement "you voted for
// somebody who turned out to be a Faithful", at 1.20x. Its edge over that is
// 0.01x, and the 1.21x itself is STRUCTURAL rather than deductive:
// chooseBanishmentVote legitimately stops a Traitor naming the pact, so
// Traitors' ballots are restricted to Faithfuls; formPreference then draws the
// victim from livingFaithfuls; so anybody who voted for the victim inherits an
// enrichment derived from ground truth that has nothing to do with the murder.
//
//   clashTraced  0.87x — no signal, and it cannot have any: formPreference
//                PENALISES murdering somebody you visibly clashed with, so a
//                clash with the victim is uncorrelated with guilt by
//                construction of the conclave itself.
//
// ONE CHANNEL SURVIVES. An earlier version of this comment argued that neither
// should be deleted, on the grounds that a false-positive generator is a thing
// this format is made of. That is true of `pushedThenDied`, which is at least
// 1.21x — weakly right, and wrong in an interesting way. It is NOT true of
// `clashTraced`, which measured 0.87x at emission and 0.57x on surviving
// beliefs: it did not generate the format's false positives, it generated
// ONLY false positives, at a rate worse than chance. See the deletion note in
// murderEvidence for the mechanism. What was wrong with `pushedThenDied` was
// only the PRICE — the loudest belief in the engine was carrying little
// information, and it diluted every board it touched.
//
// THE PRICE, RE-DERIVED AFTER THE `clashTraced` DELETION. 0.48 -> 0.36 -> 0.62.
//
// The 0.36 was swept with `clashTraced` still present and was never redone, so
// it was an unverified claim about a different engine. Re-swept at 0.18 / 0.24
// / 0.30 / 0.36 / 0.42 / 0.48 / 0.60 / 0.75 / 1.00 over twelve DECORRELATED
// 200-season blocks (rngFor in headless.js), and the answer inverted: 0.36 was
// too LOW.
//
// FIRST, THE CEILING. 0.75 and 1.00 reproduce each other bit-for-bit, because
// learn() clamps any non-`public` alignment belief to ALIGNMENT_CRED_CEILING =
// SOURCE_CRED.deduced = 0.62 (js/knowledge.js). Every price above 0.62 IS 0.62.
// The constant is written as 0.62 rather than 1.0 so that it says what it does.
//
// SECOND, AND THIS IS WHAT THE OLD COMMENT GOT WRONG: the flatness it read as
// "not buying signal" was measured against nothing. The real series IS flat
// and noisy over 0.30-0.62 — late-lift means 19.02 / 19.11 / 18.80 / 20.09 /
// 18.88 / 20.19pp, non-monotone, against a per-block sd of 1.7 — and picking a
// price off worst-of-twelve blocks is exactly the worst-of-N mistake that has
// collapsed three of this project's headline numbers.
//
// So it was swept against a CONTROL: the identical channel, identical emission
// count, identical rounds, identical price, with the SUBJECT drawn uniformly
// from the living instead of from the people who pushed the victim's name.
// Same loudness, no information. Twelve blocks each:
//
//   price   late lift  real / control   edge      board  real / control   edge
//   0.24        17.30 / 17.70pp        -0.40pp          1.866 / 1.875    -0.009
//   0.36        19.11 / 18.58pp        +0.53pp          1.893 / 1.862    +0.031
//   0.60        18.88 / 15.47pp        +3.41pp          1.932 / 1.872    +0.060
//   0.62        20.19 / 15.33pp        +4.86pp          1.946 / 1.888    +0.058
//
// The control is flat in price on both metrics and the real channel is not:
// the EDGE grows monotonically, from indistinguishable-from-noise at 0.24 to
// clearly separated at the ceiling. Turning the noise channel up actively
// HURTS the room (17.70 -> 15.33pp) while turning the real one up helps it.
// That is a dose-response separation against a matched control, and it is the
// only thing in this sweep that is not block noise.
//
// At the ceiling every band improves or holds, on twelve blocks: hit 33.64%
// (min 30.80), early 3.95pp mean / worst 6.87 (was 5.67 / 7.38 — the room is
// LESS sharp early, which is the correct direction for this format), late
// 20.19pp mean / worst 15.19 (was 19.11 / 15.03), growth worst 10.35pp, board
// 1.946 mean / min 1.846 (was 1.893 / 1.792), victim +1.07, faithful wins
// 45.8%.
//
// WHAT IS STILL TRUE: this channel is weakly right, not sharp. At the emission
// level it is 1.21x against a 1.20x control, and part of that enrichment is
// structural — chooseBanishmentVote bars a Traitor from naming the pact, so
// Traitors' ballots are restricted to Faithfuls. It earns the ceiling because
// its edge over an equally loud noise channel is real and increasing, not
// because it is a good detector. Late lift remains the thinnest gate in the
// file and any future change to the murder layer hits it first.
//
// clashTraced is gone entirely; see murderEvidence.
const M = {
  // The ALIGNMENT_CRED_CEILING in js/knowledge.js. Anything higher is this
  // value; if that ceiling ever moves, this channel is silently repriced.
  pushedThenDied:  0.62,   // you wanted them gone, and they went
};

/**
 * Evidence source 2 — what a murder tells the room about the living.
 *
 * EMITTED EXACTLY ONCE, for the round that just happened. This is not a
 * stylistic choice: Plan 2 measured that re-walking history every round makes
 * the room WORSE, because learn() overwrites a belief's valence on a re-roll
 * and a protective 'false' is stored at x0.6 — so repetition strips protection
 * off precisely the innocent people the evidence indicts. Deleting that shape
 * from ballotEvidence was worth 0.20-0.23x of lift. Do not reintroduce it here.
 */
export function murderEvidence(ep, rng = Math.random) {
  const rounds = gs.tr?.rounds || [];
  const round = rounds[rounds.length - 1];
  // ONLY the round that just closed. `>= ep` would not be enough: it stops a
  // same-episode re-read but happily re-emits an OLD round every round after
  // it, which is precisely the re-walk Plan 2 deleted from ballotEvidence for
  // costing 0.20-0.23x of lift. The equality is the guard.
  if (!round || round.ep !== ep - 1) return [];
  const living = gs.activePlayers || [];
  const formed = [];

  // A blocked attempt is public: nobody died and everybody can count chairs.
  // It teaches that a Shield was live, which is information about the GAME
  // rather than about a person, so it forms no belief here — it is read by
  // the VP and by a later plan's counting argument. Recorded for both.
  const blocked = (gs.tr?.blockedMurders || []).some(b => b.ep === round.ep);

  // THE ATTEMPT, not the death — and the difference is what keeps `!blocked`
  // load-bearing. The harness records `murderTarget` on every night the
  // conclave chose somebody and `murdered` only when they actually died, so a
  // blocked night carries a target and `!blocked` is the only thing suppressing
  // it. Reading `round.murdered` alone would make a blocked night `null`
  // anyway, `!blocked` would never do any work, and the suppression test would
  // be green because its state was unreachable rather than because suppression
  // works. `?? round.murdered` keeps older round records (and fixtures that
  // record only the death) reading correctly.
  const victim = round.murderTarget ?? round.murdered;

  if (victim && !blocked) {
    // You pushed their name at the table, and that night they died.
    const pushers = new Set([
      ...(round.accusations || []).filter(a => a.target === victim).map(a => a.accuser),
      ...(round.ballots || []).filter(b => b.channel === 'banishment' && b.voted === victim)
        .map(b => b.voter),
    ]);
    for (const pusher of pushers) {
      if (!living.includes(pusher)) continue;
      for (const observer of living) {
        if (observer === pusher) continue;
        const belief = learn(observer, alignmentFactId(pusher), {
          source: `wanted ${victim} gone the night ${victim} died`,
          sourceType: 'deduced', confidence: M.pushedThenDied, ep, rng,
        });
        if (belief) formed.push({ observer, subject: pusher, ep: round.ep, kind: 'pushed-then-died' });
      }
    }

    // THE `clash-traced` CHANNEL WAS DELETED HERE. DO NOT RE-ADD IT.
    //
    // It read `round.murderCost.blames` — the people who visibly clashed with
    // the victim — and indicted each of them at 0.24. It sounds like the
    // format's best false positive, and that is exactly what it turned out to
    // be: a false-positive GENERATOR with no compensating signal.
    //
    // Measured 0.87x at emission (n=1456, 17.0% Traitor against a room density
    // of 19.5%) and 0.57x on the beliefs that SURVIVED to influence a board.
    // Below 1.0x on both: it named Faithfuls MORE often than chance did.
    //
    // The mechanism, so nobody rediscovers it by accident: `formPreference`
    // PENALISES murdering somebody you visibly clashed with — a Traitor who
    // kills the person the castle already saw them fighting with is pointing at
    // themselves. So a clash-traced victim is, by construction of the conclave,
    // one whose visible enemies are UNLIKELY to be Traitors. The channel was
    // anti-correlated with guilt by design, not by accident, and no price fixes
    // a sign error.
  }

  return formed;
}
