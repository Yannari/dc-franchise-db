// ══════════════════════════════════════════════════════════════════════
// bb/knowledge.js — what the house knows, and how it finds out
// ══════════════════════════════════════════════════════════════════════
//
// The simulator has had a proper knowledge model for a long time: facts with a
// truth value, per-person beliefs with a confidence and a source, second-order
// knowledge of who else knows, and propagation between people who actually
// talk. Total Drama uses all of it. Big Brother reached exactly one function in
// it — recordPlantedLie, and only because the shared scheme generators call it
// on the way past. Nothing else. A houseguest never learned anything, never
// passed it on, and never turned out to be wrong about something.
//
// The reason it is worth wiring rather than reinventing is the same reason it
// is worth CHANGING: the one difference between the two shows is enormous.
//
// In Survivor and in Total Drama the votes are read out loud. Everybody watches
// every ballot; nobody has to wonder who wrote their name. In this house the
// vote is secret, and the only person who ever observes a ballot is the person
// who cast it. Everything else — who flipped, who kept you, who has been lying
// about it for a week — has to travel person to person through people with
// reasons to lie, or be deduced from a result.
//
// So Total Drama's bridge records votes as public knowledge and this one
// records them as private. That single line is most of the format's paranoia,
// and it is what makes the blame layer honest: a mourner who has actually been
// TOLD gets it right, and a mourner working from a result and a grudge does not.

import { gs, players } from '../core.js';
import { pStats } from '../players.js';
import { getBond, getPerceivedBond, addBond } from '../bonds.js';
import { factId, recordFact, learn, believes, getFact, propagate, pruneStale, isAccurate }
  from '../knowledge.js';

const live = () => (gs.activePlayers || []).filter(Boolean);

// ── recording ─────────────────────────────────────────────────────────

/**
 * The ballots, as private knowledge.
 *
 * Each vote becomes a fact that exactly one person observes: the voter. The
 * house watches somebody leave and learns nothing about who did it, which is
 * the correct starting state and the reason anybody has to campaign, lie or
 * deduce afterwards.
 */
export function recordBBVotes(week) {
  if (!week?.evicted) return [];
  const ep = week.num || 0;
  const ids = [];
  for (const ballot of week.ballots || []) {
    if (!ballot?.voter || !ballot?.evict) continue;
    const id = factId('vote', ballot.voter, ballot.evict);
    recordFact({ type: 'vote', subject: ballot.voter, object: ballot.evict,
      payload: { week: ep, evicted: week.evicted, against: ballot.evict === week.evicted }, ep });
    // You know how you voted. Nobody else does.
    learn(ballot.voter, id, { sourceType: 'observed', ep });
    ids.push(id);
  }
  // The Head of Household and the nominees are public, so the whole house
  // learns those without anybody having to say anything.
  if (week.hoh) {
    const id = factId('power', week.hoh);
    recordFact({ type: 'power', subject: week.hoh, payload: { week: ep }, ep });
    live().forEach(name => learn(name, id, { sourceType: 'public', ep }));
    ids.push(id);
  }
  return ids;
}

/**
 * A promise about the end.
 *
 * Both parties observe it; nobody else is in the room. This is what makes
 * double-dealing possible at all — and what makes exposing it a real discovery
 * rather than an announcement.
 */
export function recordBBDeal(a, b, tier = 'final-two', week = 0) {
  if (!a || !b || a === b) return null;
  const id = factId('deal', [a, b].sort()[0], [a, b].sort()[1]);
  recordFact({ type: 'deal', subject: [a, b].sort()[0], object: [a, b].sort()[1],
    payload: { tier }, ep: week });
  learn(a, id, { sourceType: 'observed', ep: week });
  learn(b, id, { sourceType: 'observed', ep: week });
  return id;
}

/** Who somebody is coming for. They know; anybody they told may know. */
export function recordBBTarget(actor, target, { week = 0, toldTo = [] } = {}) {
  if (!actor || !target) return null;
  const id = factId('target', target);
  recordFact({ type: 'target', subject: target, payload: { hunter: actor }, ep: week });
  learn(actor, id, { sourceType: 'observed', ep: week });
  toldTo.filter(Boolean).forEach(name => learn(name, id,
    { source: actor, sourceType: 'told', from: actor, ep: week }));
  return id;
}

/**
 * Something that is not true.
 *
 * Recorded with truth false, so anybody who accepts it holds a belief the
 * system knows is wrong — which is what lets the house discover it later
 * rather than the simulation quietly agreeing with the liar.
 */
export function recordBBFalseClaim(liar, about, { week = 0, believers = [] } = {}) {
  if (!liar || !about) return null;
  const id = factId('lie', liar, about);
  recordFact({ type: 'lie', subject: liar, object: about, truth: false,
    payload: { claim: 'double-dealing' }, ep: week });
  learn(liar, id, { sourceType: 'observed', ep: week });
  believers.filter(Boolean).forEach(name => learn(name, id,
    { source: liar, sourceType: 'told', confidence: 0.7, from: liar, ep: week }));
  return id;
}

// ── spreading ─────────────────────────────────────────────────────────

/**
 * Who a houseguest would actually tell something to.
 *
 * The shared default treats every alliance-mate as a confidant and everybody
 * else as an equal chance. A house is smaller and more claustrophobic than
 * that: people talk to the person they trust most and the person they happen to
 * be lying next to, and a bond of -5 does not receive information.
 */
export function bbContacts(knower) {
  const others = live().filter(name => name !== knower);
  const allies = new Set();
  for (const alliance of gs.namedAlliances || []) {
    if (alliance.active === false) continue;
    if (!(alliance.members || []).includes(knower)) continue;
    alliance.members.forEach(m => { if (m !== knower && others.includes(m)) allies.add(m); });
  }
  // A showmance is the tightest information channel in the house.
  for (const showmance of gs.showmances || []) {
    if (showmance.phase === 'broken-up') continue;
    const pair = showmance.players || [];
    if (pair.includes(knower)) pair.forEach(m => { if (m !== knower && others.includes(m)) allies.add(m); });
  }
  // And anybody they are simply close to.
  others.forEach(name => { if (getBond(knower, name) >= 4) allies.add(name); });
  return {
    allies: [...allies],
    // You do not hand information to somebody you cannot stand.
    others: others.filter(name => getPerceivedBond(knower, name) > -2),
  };
}

/**
 * A week of the house talking.
 *
 * Returns what moved, so the feed can show somebody finding something out
 * instead of the house silently becoming better informed.
 */
export function tickBBKnowledge(week, rng = Math.random) {
  const ep = week?.num || 0;
  let events = [];
  try {
    events = propagate(ep, { contacts: bbContacts, rng, maxPerFact: 2 }) || [];
  } catch { events = []; }
  try { pruneStale(ep, { maxAge: 8 }); } catch { /* nothing to prune */ }
  return events;
}

// ── asking ────────────────────────────────────────────────────────────

/** Does this person believe they know how that person voted? */
export function knowsVote(knower, voter, evicted) {
  if (!knower || !voter) return false;
  // believes() hands back the belief object; every caller here wants the
  // question answered, not the record.
  return !!believes(knower, factId('vote', voter, evicted));
}

/**
 * Everybody this person believes voted out the evictee — right or wrong.
 *
 * The list a houseguest is actually working from when they decide who to blame,
 * which is not the same as the list of people who did it.
 */
export function believedVoters(knower, evicted) {
  if (!knower || !evicted) return [];
  return live().filter(name => name !== knower && knowsVote(knower, name, evicted));
}

/** Is what they believe about this actually true? */
export function beliefIsAccurate(knower, type, subject, object = null) {
  try { return isAccurate(knower, factId(type, subject, object)); } catch { return false; }
}

/** For the screens: how much of the house's business does this person know? */
export function knowledgeScore(name) {
  if (!name) return 0;
  let known = 0;
  for (const other of live()) {
    if (other === name) continue;
    // Votes they think they can account for.
    known += believedVoters(name, null).length ? 1 : 0;
  }
  return known;
}

// ── the jury house ────────────────────────────────────────────────────

/**
 * Seven people with nothing to do but compare notes.
 *
 * The single most consequential conversation in the format happens after
 * everybody in it has stopped playing. A juror walks out believing something
 * about their own eviction — often the wrong thing, because the vote was secret
 * and somebody lied to their face about it on the way out — and then spends
 * weeks sitting with the other people who were there.
 *
 * Total Drama's equivalent reconciles credit for orchestrating a boot, which
 * this format never records. What a house jury actually relitigates is simpler
 * and sharper: who wrote my name down. So the jury talks, vote facts move
 * between them, and a juror who finds out that a finalist was one of the votes
 * carries that into the only decision they have left.
 *
 * @returns {Array} what each juror found out, for the finale to show
 */
export function reconcileBBJury(jury = gs.jury || [], { week = 0, rng = Math.random } = {}) {
  const panel = [...new Set(jury)].filter(Boolean);
  if (panel.length < 2) return [];
  const inPanel = name => panel.includes(name);
  const learned = [];

  // They only have each other, so contacts are the rest of the panel.
  try {
    propagate(week, {
      contacts: knower => ({
        allies: panel.filter(n => n !== knower && getBond(knower, n) >= 2),
        others: panel.filter(n => n !== knower),
      }),
      rng, maxPerFact: 3,
    });
  } catch { /* nothing to pass around */ }

  // And then each of them works out what it means for their own exit.
  const weeks = gs.bb?.weeks || [];
  for (const juror of panel) {
    const own = weeks.find(w => w.evicted === juror);
    if (!own) continue;
    if ((gs.bb.juryReconciled ||= {})[juror]) continue;
    gs.bb.juryReconciled[juror] = true;
    for (const ballot of own.ballots || []) {
      if (ballot.evict !== juror || ballot.voter === juror) continue;
      // Did they find out? A juror learns their own eviction's votes only the
      // same way anybody learns anything here — from somebody who knew.
      if (!knowsVote(juror, ballot.voter, juror)) continue;
      // Finding out in the jury house is worse than finding out in the house:
      // there is nothing to do with it except decide how to vote at the end.
      addBond(juror, ballot.voter, -1.8);
      learned.push({ juror, voter: ballot.voter, kind: 'found-out',
        stillPlaying: !inPanel(ballot.voter) });
    }
  }
  return learned;
}
