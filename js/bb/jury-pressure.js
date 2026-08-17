// ══════════════════════════════════════════════════════════════════════
// bb/jury-pressure.js — what the jury line does to the way the game is played
// ══════════════════════════════════════════════════════════════════════
//
// js/bb-events/jury-bubble.js is the house TALKING about the milestone. This is
// the game BEHAVING differently because of it, and the two are deliberately
// separate files: a scene that describes a stake nothing reads is decoration,
// and a read nobody ever narrates is a number the viewer cannot see. Written
// together, they are the same thing from the inside and the outside.
//
// ── the reads ──
//
// Three, not the four this started as. The fourth was measured and deleted; the
// note where it used to be says why, and is worth reading before adding one.
//
//   bubbleCompliance     an exposed houseguest near the line takes the pawn
//                        seat they would have refused in week two
//   juryManagementWeight wanting somebody's vote at the end matters more once
//                        there is actually a jury to sit on
//   juryPactKeepPull     "we get to jury together" costs a vote, or it was
//                        never worth anything
//
// ── THE RULE THEY ARE ALL WRITTEN UNDER ──
//
// Circumstance decides this game. Every function here returns a NUDGE on a
// number somebody else already computed — proportional, bounded, and small
// against the spread of the thing it is added to. None of them is a threshold,
// none flips a decision on its own, and each is scaled by how well the
// houseguest in question can think that far ahead, so a reactive player is
// barely touched by any of it.
//
// The competition library was rebuilt the week before this was written because
// a signal had swamped its noise and the same houseguest won everything. A jury
// bubble that decided nominations would be that bug again in a different file.
// tests/bb-jury-bubble.test.js measures how often each read actually changes an
// outcome; if any of them starts DECIDING weeks, the numbers here are wrong.

import { gs, seasonConfig } from '../core.js';
import { pStats } from '../players.js';
import { juryOpensAt } from './jury.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Live houseguests, from whatever the caller could give us. */
const _house = house => (Array.isArray(house) && house.length
  ? house : (gs.activePlayers || [])).filter(Boolean);

/**
 * Evictions left before the jury opens; null when the season has no jury.
 * Negative once the jury is seating.
 */
export function juryToGo(house) {
  const opens = juryOpensAt(seasonConfig);
  if (!opens) return null;
  return _house(house).length - opens;
}

/** Is the jury taking members yet? */
export const juryIsOpen = house => {
  const toGo = juryToGo(house);
  return toGo != null && toGo <= 0;
};

/**
 * How loudly the line is ringing, 0 to 1.
 *
 * Zero while the milestone is far enough away to be abstract, climbing as the
 * house shrinks toward it, and zero again once it is behind them. Everything
 * below is scaled by this, which is what keeps the whole idea confined to the
 * three or four weeks it belongs to instead of colouring a season.
 */
export function bubblePressure(house) {
  const toGo = juryToGo(house);
  if (toGo == null || toGo <= 0 || toGo > 4) return 0;
  return clamp((5 - toGo) / 4, 0, 1);
}

// ── there is no bitterJurorPull here, and that is the finding ──
//
// "Cut them before they get a vote" was going to be a fourth read: an additive
// pull on nominationScore for a candidate who resents the Head of Household,
// live only while the jury is shut. It was written, wired, and measured, and
// the measurement killed it.
//
// Across three played seasons sampled while the bubble was ringing, resentment
// toward the Head of Household correlates with the `revenge` term ALREADY in
// nominationScore at r = 0.873, and the top-scoring target was already the
// bitterest houseguest in 62% of reads. Bonds in this engine are symmetric and
// applyLegacyBondDelta writes resentment straight off them, so the two numbers
// are very nearly the same number. A term that duplicates one beside it can
// only ever reinforce a decision, never redirect one — measured over 138 reads
// at every size up to 2.8, it changed the nomination target exactly zero times.
//
// So the pressure is delivered where it belongs: jury-bury-them-first, in
// js/bb-events/jury-bubble.js, sets an explicit target on two houseguests after
// a scene in which they argue for it. That feeds the plan pull that already
// exists — worth 3.4, far more than any tiebreaker — and, unlike a hidden score
// term, the viewer sees the decision get made.
//
// The general lesson, which is why this note is longer than the function would
// have been: a new read has to be measured against the reads already there. Two
// correlated terms are not twice the signal, they are one signal and a
// maintenance cost.

/**
 * Whether somebody on the bubble says yes to the chair.
 *
 * Returns an additive adjustment to negotiatePawn's acceptance score. An
 * exposed houseguest a week or two from a jury seat has a reason to be useful
 * to the person holding the power — and a bold one has the opposite reaction,
 * which is the same pressure producing two different people.
 *
 * `danger` is the 0-1 exposure the caller already computed.
 */
export function bubbleCompliance(name, house, danger = 0) {
  const ring = bubblePressure(house);
  if (!ring || !name) return 0;
  const s = pStats(name);
  // Loyal and cautious bends; bold and disloyal digs in. Centred so the average
  // houseguest is barely moved either way.
  const bend = (s.loyalty * 0.55 + (10 - s.boldness) * 0.45) / 10 - 0.5;
  return clamp(bend * ring * clamp(danger, 0, 1) * 3.2, -1.2, 1.2);
}

/**
 * How much a vote at the end is worth caring about yet.
 *
 * strategy.js has always discounted a nomination for somebody on the Head of
 * Household's `juryPlan`. That discount was a constant, which quietly said
 * managing a jury matters exactly as much in week two — when there is no jury
 * and the person may not make it — as it does at final six. Returns a
 * MULTIPLIER for that existing pull rather than a new term, so the behaviour
 * stays in one place.
 */
export function juryManagementWeight(house) {
  return juryIsOpen(house) ? 1.45 : 0.6;
}

/**
 * "We get to jury together", as a vote.
 *
 * The pact has existed for a while and resolved into a bond bump, which meant
 * two people could promise each other the one thing they both wanted and then
 * vote each other out without the promise ever costing anybody anything.
 *
 * Returns an additive KEEP pull for initialVotePreference, live only while the
 * partner is genuinely still short of the line — the whole promise expires the
 * moment they are both across it. Sized against a final-two deal's 3.6 and a
 * landed campaign's 2.6: this is worth less than either, and a voter who has
 * decided the pact partner has to go still evicts them.
 */
export function juryPactKeepPull(voter, nominee, house) {
  if (!voter || !nominee) return 0;
  const toGo = juryToGo(house);
  if (toGo == null || toGo > 4 || toGo <= 0) return 0;
  const pact = (gs.sideDeals || []).find(d => d && d.active !== false && !d.broken
    && d.type === 'make-jury'
    && (d.players || []).includes(voter) && (d.players || []).includes(nominee));
  if (!pact) return 0;
  // A promise bought with a vote is worth less than one made between friends:
  // the transactional version was always a price, and both of them knew it.
  const sincerity = pact.transactional ? 0.55 : 1;
  // And it is worth what the person who made it is worth — a serial promiser
  // keeps fewer of them.
  const keeps = clamp(pStats(voter).loyalty / 10, 0.25, 1);
  return clamp(1.9 * sincerity * keeps, 0, 1.9);
}
