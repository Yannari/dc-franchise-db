// ══════════════════════════════════════════════════════════════════════
// bb/fallout.js — the morning after somebody leaves
// ══════════════════════════════════════════════════════════════════════
//
// A houseguest was voted out on Thursday and by Friday morning the house had
// forgotten it happened. Nothing read the ballots afterwards — a search of every
// event file found exactly one reader of votingLog anywhere, and it only asked
// whether anybody had ever voted at all. So events that wanted to talk about the
// last eviction had nothing to talk about and invented it, which is why one of
// them confidently described "the last two evictions" in week two.
//
// That is a missing scene, but it is a much bigger missing STRATEGY. The single
// most reliable engine of a real season is somebody working out who sent their
// friend home and spending the next three weeks on it. Losing an ally is where
// grudges come from, where new alliances come from, and where the person who
// gets away with it gets away with it.
//
// The four things this file answers on the Friday morning:
//
//   who is hurt      — scaled by how close they actually were
//   who is relieved  — and whether they have the sense to hide it
//   who gets blamed  — which is NOT the same as who did it
//   who gets credit  — finding out somebody stayed loyal to your friend
//
// Blame is the important one and it is deliberately unreliable. Votes in this
// house are secret. Nobody gets a list; they get a room full of people who all
// say they did not do it, and they work backwards from who benefited, who was
// standing too close to whom, and whichever group they had already decided was
// running things.
//
// What decides whether they get there is whether somebody TOLD them. A mourner
// working from real knowledge names the right person about nine times in ten; a
// mourner reconstructing from a result and a grudge manages one in three. The
// misfire is as much a part of the show as the correct read, and it is the
// reason information is worth anything in here.

import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';
import { listBlocs, knowledgeOf } from './blocs.js';
import { knowsVote } from './knowledge.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const live = () => (gs.activePlayers || []).filter(Boolean);

/** The week that just finished, with its ballots. Null in week one. */
export function lastCompletedWeek() {
  const weeks = gs.bb?.weeks || [];
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i]?.evicted && (weeks[i].ballots || []).length) return weeks[i];
  }
  return null;
}

/** Did this person vote to evict? Null when they had no vote to cast. */
export function votedAgainst(name, week = lastCompletedWeek()) {
  if (!week) return null;
  const ballot = (week.ballots || []).find(b => b.voter === name);
  if (!ballot) return null;
  return ballot.evict === week.evicted;
}

/**
 * How hard the eviction landed on each survivor.
 *
 * Grief is the bond, straightforwardly — but somebody who voted out a person
 * they were close to gets `hypocrisy` as well, and that is the reading the
 * audience always makes and the house usually makes too. Crying over a name you
 * wrote down is a performance, and people can tell.
 */
export function reactionsTo(week = lastCompletedWeek()) {
  if (!week?.evicted) return [];
  const gone = week.evicted;
  return live().filter(name => name !== gone).map(name => {
    const closeness = getBond(name, gone);
    const voted = votedAgainst(name, week);
    const stats = pStats(name);
    const grief = Math.max(0, closeness) * (0.6 + stats.loyalty / 20);
    const relief = Math.max(0, -closeness) * 0.8;
    return {
      name, closeness, voted, grief, relief,
      // Wrote the name down and is grieving anyway.
      hypocrisy: voted === true && closeness >= 3 ? grief : 0,
      // Kept somebody's friend and nobody knows it yet.
      loyal: voted === false && closeness >= 2,
    };
  }).sort((a, b) => (b.grief + b.relief) - (a.grief + a.relief));
}

/** Whoever took it hardest and might do something about it. */
export function chiefMourner(week = lastCompletedWeek()) {
  const hurt = reactionsTo(week).filter(r => r.grief >= 1.5);
  return hurt[0] || null;
}

/**
 * Who this person decides did it.
 *
 * Nobody sees the ballots, so this is a reconstruction, and it is built out of
 * exactly the things a houseguest actually has: who put them up, who could have
 * saved them and did not, who gained, and which group they had already worked
 * out was voting together — plus, decisively, whatever anybody has actually
 * told them. The truth itself is not an input.
 *
 * @returns {{blamed:string, correct:boolean, why:string, confidence:number}|null}
 */
export function assignBlame(mourner, week = lastCompletedWeek()) {
  if (!mourner || !week?.evicted) return null;
  const gone = week.evicted;
  const suspects = live().filter(name => name !== mourner);
  if (!suspects.length) return null;

  const scored = suspects.map(name => {
    let score = 0;
    const reasons = [];

    // The person who put them there. Public, undeniable, and the first place
    // anybody looks — which is exactly why a Head of Household takes the blame
    // for a vote they did not control.
    if (name === week.hoh) { score += 3.2; reasons.push('put them up'); }
    // The one who could have moved the block and left it alone.
    if (name === week.vetoWinner && name !== week.hoh
      && !(week.finalNominees || []).includes(name)) {
      score += 1.8; reasons.push('held the veto and did nothing with it');
    }
    // A group the mourner already believes votes together is the obvious engine
    // behind any result they did not like.
    for (const bloc of listBlocs()) {
      if (!bloc.members.includes(name) || bloc.members.includes(mourner)) continue;
      const known = knowledgeOf(mourner, bloc.id);
      if (known >= 0.4) { score += known * 2.4; reasons.push(`is one of ${bloc.label}`); }
    }
    // Somebody who was visibly warm to the mourner is the last person suspected,
    // which is the whole reason a quiet betrayal works.
    score -= Math.max(0, getPerceivedBond(mourner, name)) * 0.5;
    // Has anybody actually TOLD them?
    //
    // This is the difference between solving it and guessing, and until the
    // knowledge layer existed there was no way to express it: the model reached
    // straight for the truth and scaled it by intuition, which quietly said
    // that perceptive people can see through walls. They cannot. What they can
    // do is get told things and work out whether the person telling them is
    // worth believing. A mourner who has heard it from somebody is close to
    // certain; one who has heard nothing is reconstructing from a result.
    if (knowsVote(mourner, name, gone)) { score += 5.5; reasons.push('and somebody told them so'); }

    // And nothing at all from the truth itself.
    //
    // There used to be a term here that added the real answer scaled by
    // intuition, on the theory that a perceptive houseguest half-senses it.
    // Measured, it was doing nearly all the work: with it, a mourner who had
    // been told nothing still identified the right person 71% of the time;
    // without it, 33%. The first number is clairvoyance with a stat check in
    // front of it, and it made the entire knowledge layer decorative — being
    // told something was worth 18 points of accuracy over simply being sharp.
    //
    // Perception still matters everywhere it should: sharp houseguests read
    // blocs faster, get told more because they have better contacts, and judge
    // a source better when they are told. What they cannot do is see a ballot.
    const reallyDid = votedAgainst(name, week);

    return { name, score, reasons, reallyDid };
  }).sort((a, b) => b.score - a.score);

  const pick = scored[0];
  if (!pick || pick.score <= 0) return null;
  const spread = pick.score - (scored[1]?.score ?? 0);
  return {
    blamed: pick.name,
    correct: pick.reallyDid === true,
    confidence: clamp(0.35 + spread * 0.18, 0.2, 0.95),
    why: pick.reasons[0] || 'was standing in the wrong place',
    reasons: pick.reasons,
  };
}

/**
 * Who actually kept them, for the people who find out.
 *
 * The counterpart to blame and the reason this is not purely a grudge engine:
 * discovering that somebody quietly voted to keep your friend is how the next
 * alliance starts.
 */
export function keptThem(week = lastCompletedWeek()) {
  if (!week?.evicted) return [];
  return (week.ballots || [])
    .filter(b => b.evict !== week.evicted && live().includes(b.voter))
    .map(b => b.voter);
}

/** Everybody who wrote the name down and is still here. */
export function wroteTheName(week = lastCompletedWeek()) {
  if (!week?.evicted) return [];
  return (week.ballots || [])
    .filter(b => b.evict === week.evicted && live().includes(b.voter))
    .map(b => b.voter);
}

/**
 * How many times this group has now voted as one.
 *
 * The bloc events wanted to say "again" and "twice running" and had no way to
 * know, so the prose was walked back to something vaguer instead. This is the
 * number they were reaching for, and it is better evidence than any single
 * week: one vote together is a coincidence, three is a structure.
 */
export function timesVotedTogether(bloc) {
  const weeks = gs.bb?.weeks || [];
  let count = 0;
  for (const week of weeks) {
    const cast = bloc.members
      .map(name => (week.ballots || []).find(b => b.voter === name))
      .filter(Boolean);
    if (cast.length >= 2 && cast.every(b => b.evict === cast[0].evict)) count++;
  }
  return count;
}

/** How many evictions this house has actually seen. */
export function evictionCount() {
  return (gs.bb?.weeks || []).filter(w => w?.evicted).length;
}
