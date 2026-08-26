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
import { learn, believes } from '../knowledge.js';
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

/** Every banishment ballot cast so far, oldest first. */
function banishmentBallots() {
  return (gs.tr?.rounds || []).flatMap(r =>
    (r.ballots || []).filter(b => b.channel === 'banishment')
      .map(b => ({ ...b, ep: r.ep, banished: r.banished, wasTraitor: r.banishedWasTraitor })));
}

// How hard each ballot pattern pushes. Deliberately small: a single vote is a
// hint, not a proof, and the ceiling in learn() is what stops a pile of hints
// becoming certainty.
const W = {
  defendedRevealedTraitor: 0.34,   // you kept a Traitor in. The strongest read available.
  votedRevealedFaithful:   0.10,   // you spent a life for nothing — or you meant to
  votedRevealedTraitor:   -0.16,   // exonerating
  neverVotedEachOther:     0.07,   // per round of a clean pair record
};

/**
 * Turn the public ballot record into deduced beliefs about alignment.
 *
 * Runs once per round, after a banishment reveal. Every belief it forms arrives
 * as `deduced`, so it runs the read-skill roll in js/knowledge.js — a sharp
 * reader accepts a real pattern and sees through a coincidental one, a gullible
 * one does the reverse, and neither can ever be certain.
 */
export function ballotEvidence(ep, rng = Math.random) {
  const ballots = banishmentBallots();
  if (!ballots.length) return [];
  const living = gs.activePlayers || [];
  const formed = [];

  // ── reveals: who protected whom, and who was right ──────────────────
  const reveals = (gs.tr?.rounds || []).filter(r => r.banished);
  for (const round of reveals) {
    const cast = ballots.filter(b => b.ep === round.ep);
    for (const b of cast) {
      if (!living.includes(b.voter)) continue;
      const votedForTheBanished = b.voted === round.banished;
      let weight = 0;
      if (round.banishedWasTraitor) {
        weight = votedForTheBanished ? W.votedRevealedTraitor : W.defendedRevealedTraitor;
      } else if (votedForTheBanished) {
        weight = W.votedRevealedFaithful;
      }
      if (weight <= 0) continue;   // exoneration is handled by absence, not by a negative belief
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
  const rounds = new Set(ballots.map(b => b.ep));
  if (rounds.size >= 3) {
    for (const a of living) {
      for (const b of living) {
        if (a >= b) continue;
        const aVotedB = ballots.some(x => x.voter === a && x.voted === b);
        const bVotedA = ballots.some(x => x.voter === b && x.voted === a);
        if (aVotedB || bVotedA) continue;
        const conf = Math.min(0.5, W.neverVotedEachOther * rounds.size);
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
