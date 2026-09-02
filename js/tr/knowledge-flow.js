// ══════════════════════════════════════════════════════════════════════
// tr/knowledge-flow.js — who actually knows a thing, and how it got to them
// ══════════════════════════════════════════════════════════════════════
//
// WHAT THIS EXISTS FOR, stated as the defect it closes rather than as a
// feature. The castle library ships sentences that assert propagation and
// write none:
//
//     js/tr/castle/trust.js        "It arrived back at {a} by three separate
//                                   routes before lunch."
//     js/tr/castle/mission-fallout "{a} told three separate people about the
//                                   mission on the road back."
//
// Both wrote a bond and nothing else. Nobody was named, no receipt existed,
// and the next scene had no way to know which three people the sentence meant
// — so a Faithful could be given a fact by a line of prose and the engine
// would never find out. writing-contracts.md calls that out by name:
// "Information spreads through named receipts", and "the reaction radius is
// the union of witnesses, named recipients, and people informed publicly. Do
// not select arbitrary active players merely to make the event feel
// important."
//
// THE LEDGER IS NOT NEW. `js/tr/scene-api.js`'s `propagate()` already wrote
// `{ factId, from, to, channel, ep, sceneId }` onto `gs.tr.propagation`, and
// `recordClaim` already fanned a claim out to its named listeners through it.
// What was missing is the READ side: nothing in the engine could answer "who
// knows this", so no scene could be gated on it and no sentence could be
// checked against it.
//
// ONE WRITER, NOT TWO. `shareFact` below is now that writer, and scene-api's
// `propagate` is a wrapper over it that adds the receipt, the human-readable
// source and the scene identity. The split is deliberate: the CHANNEL rules —
// the four legal channels, the audience-only rule that reaches no contestant,
// and the already-knew check — must be identical whichever door a caller comes
// in by, and they are identical because there is one copy of them.
import { gs } from '../core.js';

/**
 * How a fact can travel. The contract's four channels, and no fifth.
 *
 * OWNED HERE, AND RE-EXPORTED BY js/tr/scene-api.js. It was declared there, and
 * `propagate()` there is now a thin wrapper over `shareFact` below — one
 * writer, one ledger. Two functions appending to `gs.tr.propagation` with
 * different validation is how a receipt store ends up with rows nothing can
 * read, which is the defect this whole file is about.
 */
export const KNOWLEDGE_CHANNELS = [
  'witnessed', 'conversation', 'public-ceremony', 'confessional-audience-only',
];

/** The one channel that informs no contestant at all. */
export const AUDIENCE_ONLY = 'confessional-audience-only';

/**
 * The share of living players that has to hold a fact before prose is allowed
 * to say "everyone".
 *
 * THREE QUARTERS, and it is a floor rather than a target. A public ceremony
 * informs the room outright and clears it on its own (see `consensusPhrase`'s
 * `evidence` argument); reaching it by conversation takes fifteen receipts in
 * a twenty-person castle, which is what "the whole castle knows" should cost.
 */
export const CONSENSUS_FLOOR = 0.75;

/** Evidence kinds that can carry a whole-room claim without receipt counting. */
export const PUBLIC_EVIDENCE = new Set(['public-ceremony', 'public-vote', 'show-of-hands']);

function _tr() { return gs?.tr || null; }

function _str(v, what, role) {
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`knowledge-flow ${what}: ${role} must be a name, got ${JSON.stringify(v)}`);
  }
  return v;
}

/**
 * ONE FACT, FROM ONE PERSON TO ONE PERSON, WITH A RECEIPT.
 *
 * The contract's shape exactly: `{ factId, from, to, channel, ep, sceneId }`.
 * Returns the stored receipt, or a refusal record — never a bare `null` on a
 * refusal, because a caller that cannot tell "recorded" from "silently
 * dropped" is the whole problem this file is about.
 *
 * SELF-TALK IS NOT PROPAGATION and neither is a duplicate. Handing the same
 * fact to the same person twice records once: `knowersOf` is a set question,
 * and a second receipt would inflate the consensus count without informing
 * anybody new.
 */
export function shareFact({ factId, from, to, channel = 'conversation',
  ep = null, sceneId = null } = {}) {
  _str(factId, 'shareFact', 'factId');
  _str(from, 'shareFact', 'from');
  _str(to, 'shareFact', 'to');
  if (!KNOWLEDGE_CHANNELS.includes(channel)) {
    throw new Error(`knowledge-flow shareFact: unknown channel "${channel}"`);
  }
  if (channel === AUDIENCE_ONLY) {
    return { factId, from, to, channel, ep, sceneId,
      applied: false, blockedBy: 'audience-only: no contestant learns this' };
  }
  if (from === to) {
    return { factId, from, to, channel, ep, sceneId,
      applied: false, blockedBy: 'a person cannot be told something by themselves' };
  }
  const tr = _tr();
  const list = tr ? (tr.propagation ||= []) : null;
  if (list && list.some(r => r.factId === factId && r.to === to)) {
    return { factId, from, to, channel, ep, sceneId,
      applied: false, blockedBy: 'already knew: a second telling informs nobody new' };
  }
  const rec = { factId, from, to, channel, ep, sceneId };
  if (list) list.push(rec);
  return { ...rec, applied: true };
}

/**
 * Hand one fact to several named people at once, one receipt each.
 *
 * `to` is a LIST THE CALLER CHOSE, never a sample this function takes over the
 * cast. That distinction is the contract's, and it is why this takes names
 * rather than a count: "told three separate people" is only true if the event
 * can say which three.
 */
export function shareFactWith(names, { factId, from, channel = 'conversation',
  ep = null, sceneId = null } = {}) {
  const out = [];
  for (const to of (names || [])) {
    out.push(shareFact({ factId, from, to, channel, ep, sceneId }));
  }
  return out;
}

/**
 * EVERYBODY WHO HOLDS THIS FACT, as of `ep`.
 *
 * The union of three things, and no fourth:
 *   - the speaker of a stored claim with this id, and everybody named as
 *     having heard it (js/tr/scene-api.js's `recordClaim`);
 *   - both ends of every propagation receipt for it — the teller knew it in
 *     order to tell it;
 *   - nothing else. There is no "and probably the people they eat with".
 *
 * `ep` is a CUT-OFF, not a filter for equality: knowledge does not expire at
 * midnight. Passing null asks the question over the whole season so far.
 * A receipt with no episode stamped on it is counted — a harness that never
 * set one is asking about now.
 */
export function knowersOf(factId, ep = null) {
  if (typeof factId !== 'string' || !factId) return [];
  const tr = _tr();
  const out = new Set();
  const within = e => ep == null || e == null || e <= ep;
  for (const c of (tr?.claims || [])) {
    if (c.id !== factId || !within(c.ep)) continue;
    if (c.channel === AUDIENCE_ONLY) continue;
    if (c.speaker) out.add(c.speaker);
    for (const l of (c.listeners || [])) out.add(l);
  }
  for (const r of (tr?.propagation || [])) {
    if (r.factId !== factId || !within(r.ep)) continue;
    if (r.from) out.add(r.from);
    if (r.to) out.add(r.to);
  }
  return [...out];
}

/**
 * THE REACTION RADIUS: the people who may react to this fact tonight.
 *
 * Knowers, minus anybody who has left the castle. A scene may not be built for
 * a person who does not hold the record it turns on — that is the causal
 * contract's second question ("which participants know that record?") answered
 * as a function rather than as a code review.
 */
export function eligibleReactors(factId, ep = null, { living = null } = {}) {
  const alive = new Set(living || gs?.activePlayers || []);
  const knowers = knowersOf(factId, ep);
  if (!alive.size) return knowers;
  return knowers.filter(n => alive.has(n));
}

/**
 * Has this fact reached the share of the room that makes a whole-room claim
 * legal? Reported as the numbers, not as a boolean, so a caller writing prose
 * can print the precise version when the answer is no.
 */
export function consensusBasis({ factId = null, agreeing = null, ep = null,
  living = null, evidence = null } = {}) {
  const alive = (living || gs?.activePlayers || []).filter(Boolean);
  const holders = agreeing
    ? [...new Set(agreeing.filter(Boolean))]
    : eligibleReactors(factId, ep, { living: alive });
  const denominator = Math.max(1, alive.length || holders.length);
  const share = holders.length / denominator;
  const publicly = !!evidence && PUBLIC_EVIDENCE.has(evidence);
  return {
    factId, evidence: evidence || null,
    holders, living: alive.length || holders.length,
    share: Math.round(share * 1000) / 1000,
    floor: CONSENSUS_FLOOR,
    universal: publicly || share >= CONSENSUS_FLOOR,
    reason: publicly ? `everybody present saw it (${evidence})`
      : share >= CONSENSUS_FLOOR ? `${holders.length} of ${denominator} hold it`
        : `${holders.length} of ${denominator} hold it, under the ${CONSENSUS_FLOOR} floor`,
  };
}

function _names(list) {
  const l = list.filter(Boolean);
  if (l.length === 1) return l[0];
  if (l.length === 2) return `${l[0]} and ${l[1]}`;
  return `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`;
}

const COUNT_WORD = ['nobody', 'one', 'two', 'three', 'four', 'five', 'six', 'seven',
  'eight', 'nine', 'ten', 'eleven', 'twelve'];

/**
 * HOW MANY PEOPLE AGREE, SAID IN WORDS THE EVIDENCE SUPPORTS.
 *
 * writing-contracts.md forbids `everyone`, `the whole castle`, `the group
 * agrees`, `the castle turns` and `nobody trusts` without one of four
 * evidence sources. This is the only function in the engine allowed to produce
 * the universal version, and it produces it only when the basis says so.
 *
 * Everything below the floor gets the precise version, and the precise version
 * NAMES PEOPLE while it can (three or fewer) and counts them against the room
 * when it cannot. "Three players" is a legal sentence; "everyone" over three
 * of twelve is not.
 */
export function consensusPhrase({ agreeing = [], living = 0, evidence = null,
  factId = null, ep = null } = {}) {
  const list = [...new Set((agreeing || []).filter(Boolean))];
  const total = typeof living === 'number' ? living
    : (living || []).filter(Boolean).length;
  const basis = consensusBasis({ factId, agreeing: list, ep,
    living: typeof living === 'number' ? new Array(total).fill('?') : living, evidence });
  if (!list.length) return 'nobody';
  if (basis.universal) {
    return evidence && PUBLIC_EVIDENCE.has(evidence)
      ? 'everybody who was in the room'
      : 'everybody still in the castle';
  }
  if (list.length <= 3) return _names(list);
  const word = COUNT_WORD[list.length] || String(list.length);
  return total > list.length
    ? `${word} of the ${COUNT_WORD[total] || total} still here`
    : `${word} of them`;
}

/** Every fact `name` holds, as of `ep`. The inverse question, same ledger. */
export function factsKnownTo(name, ep = null) {
  const tr = _tr();
  const out = new Set();
  const within = e => ep == null || e == null || e <= ep;
  for (const c of (tr?.claims || [])) {
    if (!within(c.ep) || c.channel === AUDIENCE_ONLY) continue;
    if (c.speaker === name || (c.listeners || []).includes(name)) out.add(c.id);
  }
  for (const r of (tr?.propagation || [])) {
    if (!within(r.ep)) continue;
    if (r.from === name || r.to === name) out.add(r.factId);
  }
  return [...out];
}
