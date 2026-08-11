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
import { factId, recordFact, learn, believes, getFact, propagate, pruneStale }
  from '../knowledge.js';

const live = () => (gs.activePlayers || []).filter(Boolean);

/**
 * A belief roll that depends on who and when, and on nothing else.
 *
 * Whether somebody accepts what they were told runs through `_assess`, which
 * needs randomness. Reaching for Math.random here is a real bug rather than a
 * style question: a season is driven by a SEEDED generator, and an unseeded
 * draw in the middle of it means the same seed stops producing the same season
 * — which the replay guards catch and which would quietly make every saved
 * house unreproducible. Threading the week's generator down through two plan
 * functions and everything that calls them is the invasive fix; this is the
 * better one, because it is also more faithful. Whether a particular person
 * believes a particular piece of news should not depend on how many unrelated
 * dice were rolled earlier in the week.
 */
export function stableRng(...parts) {
  let seed = 2166136261;
  const key = parts.join('|');
  for (let i = 0; i < key.length; i++) seed = Math.imul(seed ^ key.charCodeAt(i), 16777619);
  seed >>>= 0;
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
    // You know how you voted. Nobody else does — unless the ballot was not
    // secret, which is the Sanctum and nothing else. That week the vote is
    // cast in the room in front of everybody, so it is a PUBLIC fact the
    // moment it happens, like the Head of Household below it.
    //
    // Forcing detection in the alliance ledger was not enough on its own: that
    // told the victim, and left everybody else in the room to work out from a
    // count what they had just watched with their own eyes.
    if (week.publicVote) {
      live().forEach(name => learn(name, id, { sourceType: 'public', ep }));
    } else {
      learn(ballot.voter, id, { sourceType: 'observed', ep });
    }
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

/**
 * Somebody finds out about a promise they were not in the room for.
 *
 * The deal itself is recorded by the handshake; this is the second half, and
 * the half that makes exposure worth anything. A name passed across the kitchen
 * becomes a belief with a source, which means it propagates onward like every
 * other fact, decays if nobody repeats it, and — because whoever told them may
 * have been guessing or lying — can be wrong. Returns false when there is no
 * such deal on record, so a rumour about a handshake that never happened does
 * not quietly become a fact.
 */
export function learnBBDeal(knower, a, b, { from = null, week = 0, confidence = 0.8,
  rng = null } = {}) {
  if (!knower || !a || !b || a === b) return false;
  const [x, y] = [a, b].sort();
  const id = factId('deal', x, y);
  if (!getFact(id)) return false;
  const roll = rng || stableRng('deal', x, y, knower, from || '', week);
  // Being in the room is knowledge; being told is a persuasion roll the
  // listener can fail. So this reports whether the belief actually formed,
  // not merely that somebody opened their mouth.
  return !!learn(knower, id, {
    source: from || 'observation', sourceType: from ? 'told' : 'observed',
    from, confidence, ep: week, rng: roll,
  });
}

/**
 * Does this person think those two are going to the end together?
 *
 * The question a Head of Household is really asking when they look at a pair.
 * Deliberately a BELIEF and not the truth: somebody who has been told a lie
 * about a final two should act on it, and be wrong.
 */
export function believesDeal(knower, a, b) {
  if (!knower || !a || !b || a === b) return false;
  const [x, y] = [a, b].sort();
  return !!believes(knower, factId('deal', x, y));
}

/**
 * Somebody is holding a power, and the house does not know it.
 *
 * The `type: 'power'` fact already in this file is the HOH REIGN — who is in
 * charge this week — which is public by definition. This is the opposite kind
 * of fact: a secret advantage whose whole value is that nobody can price it.
 *
 * Recorded as a belief rather than a flag for the same reason deals are. "Who
 * has the power" is a thing houseguests are WRONG about, loudly, for weeks, and
 * a boolean on the instance cannot be wrong. Only the holder knows at first;
 * everybody else has to be told, catch them using it, or guess.
 */
export function recordBBPower(holder, powerId, { week = 0, knownTo = [] } = {}) {
  if (!holder || !powerId) return null;
  const id = factId('holds', holder, powerId);
  recordFact({ type: 'holds', subject: holder, object: powerId, payload: {}, ep: week });
  learn(holder, id, { sourceType: 'observed', ep: week });
  // A public grant has witnesses. A secret one has none, and that is the point.
  for (const name of knownTo) {
    if (name && name !== holder) learn(name, id, { sourceType: 'observed', ep: week });
  }
  return id;
}

/**
 * Somebody finds out. Told, or caught watching.
 *
 * Returns whether the belief actually FORMED — being told is a persuasion roll
 * the listener can fail, exactly as with a deal, so a whisper is not the same
 * as knowledge and an unconvincing one is worth nothing.
 */
export function learnBBPower(knower, holder, powerId, { from = null, week = 0,
  confidence = 0.75, rng = null } = {}) {
  if (!knower || !holder || !powerId || knower === holder) return false;
  const id = factId('holds', holder, powerId);
  // No such power on record: a rumour about an advantage nobody has does not
  // quietly become one.
  if (!getFact(id)) return false;
  const roll = rng || stableRng('holds', holder, powerId, knower, from || '', week);
  return !!learn(knower, id, {
    source: from || 'observation', sourceType: from ? 'told' : 'observed',
    from, confidence, ep: week, rng: roll,
  });
}

/** Does this houseguest think that one is holding something? */
export function believesPowerHeld(knower, holder, powerId) {
  if (!knower || !holder || !powerId) return false;
  return !!believes(knower, factId('holds', holder, powerId));
}

/**
 * Everybody who thinks this person is holding something.
 *
 * What a nomination plan is really asking when it hesitates over a name — and
 * the reason a power that has been guessed at is worth less than one that has
 * not, even when nobody can prove it.
 */
export function suspectedHolders(powerId, house = []) {
  const out = [];
  for (const knower of house) {
    for (const holder of house) {
      if (knower === holder) continue;
      if (believesPowerHeld(knower, holder, powerId)) out.push({ knower, holder });
    }
  }
  return out;
}

/**
 * Who somebody is coming for. They know; anybody they told may know.
 *
 * Keyed by HUNTER AND QUARRY, not by quarry alone. Keying it on the target
 * meant two people coming for the same houseguest — the normal case in a house
 * where everybody can see who the threat is — wrote the same fact id, and the
 * second one silently overwrote the first's hunter. Half the intentions in the
 * house would have vanished into the other half.
 */
export function recordBBTarget(actor, target, { week = 0, toldTo = [] } = {}) {
  if (!actor || !target || actor === target) return null;
  const id = factId('target', actor, target);
  recordFact({ type: 'target', subject: actor, object: target,
    payload: { hunter: actor, quarry: target }, ep: week });
  learn(actor, id, { sourceType: 'observed', ep: week });
  toldTo.filter(Boolean).filter(n => n !== actor).forEach(name => learn(name, id,
    { source: actor, sourceType: 'told', from: actor, ep: week,
      rng: stableRng('target', actor, target, name, week) }));
  return id;
}

/**
 * Does this person think that person is coming for them — or for anybody?
 *
 * The question that turns being hunted into something the quarry can act on.
 * A belief, so somebody can be certain about a target that was never set and
 * miss one that was.
 */
export function believesTarget(knower, actor, target) {
  if (!knower || !actor || !target) return false;
  return !!believes(knower, factId('target', actor, target));
}

/**
 * Everybody this person believes is CURRENTLY gunning for them.
 *
 * Target facts carry a validity of one episode, because who somebody wants out
 * is the most perishable thing in the house — it is renewed every week the
 * intention still stands. A belief past that window comes back marked stale and
 * is dropped here: acting this week on a name you heard six weeks ago is not
 * being well informed, it is holding a grudge, and the plan has a revenge list
 * for that.
 */
export function believedHunters(name) {
  if (!name) return [];
  return live().filter(other => {
    if (other === name) return false;
    const belief = believes(name, factId('target', other, name));
    return !!belief && belief.valence !== 'stale';
  });
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
 * Somebody works out a ballot from the count.
 *
 * The honest third way to learn a vote, next to observing one and being told.
 * A house is read a total and never a ballot, but a total only adds up so many
 * ways — two votes out of three allies is arithmetic rather than suspicion —
 * and the people who are good at this are the ones the format calls good at
 * this.
 *
 * Recorded as `deduced` (credibility 0.62, below being told) rather than
 * observed, because working it out is not the same as knowing it: it decays,
 * it can be argued out of them, and if the count was a coincidence they are
 * simply wrong in a way the system can later expose.
 */
export function learnBBVote(knower, voter, evicted, week = 0, rng = Math.random) {
  if (!knower || !voter) return false;
  const id = factId('vote', voter, evicted);
  if (!getFact(id)) return false;
  return !!learn(knower, id, { source: 'the count', sourceType: 'deduced', ep: week, rng });
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

// `beliefIsAccurate` and `knowledgeScore` used to live here and are gone. Both
// were written for consumers that never arrived, and `knowledgeScore` had
// quietly been broken the whole time it sat unused: it looped over the house
// without ever reading the loop variable and asked `believedVoters(name, null)`,
// which returns an empty array on its own null guard, so it answered 0 for
// everybody in every season. A scoreboard that always reads zero is worse than
// no scoreboard. If a screen ever wants either of them, `isAccurate` in
// ../knowledge.js is the honest primitive to build on.

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
