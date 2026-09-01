// ══════════════════════════════════════════════════════════════════════
// tr/scene-api.js — the only way a castle scene changes anything
// ══════════════════════════════════════════════════════════════════════
//
// WHAT THIS FILE IS FOR, in one sentence: a scene that says a thing happened
// must leave behind the thing that happened, and a machine-readable note
// saying why.
//
// The failure this replaces is the one the whole-plan review kept finding in
// prose form — a card reads "Gabby leaves with a contradiction she can repeat
// at the Round Table" and nothing anywhere in the season is different
// afterwards. The card is then a lie about the game, and no test can catch it,
// because there is nothing to compare the sentence against. A receipt is that
// something. It is written by the same call that performs the write, so a
// consequence cannot exist without its cause and a cause cannot be claimed
// without its consequence.
//
// ── ONE WRITE PATH PER STATE TYPE ─────────────────────────────────────
//
// Every state a scene is allowed to touch has exactly one function here, and
// scenes are expected to reach state through no other route. That is not
// bureaucracy; it is what makes the ~210 castle events auditable as a
// population rather than one at a time. When every belief in the season
// arrives through `addBelief`, "which scene made Gabby suspect Julia" is a
// lookup and not an investigation.
//
// The list, and it is deliberately short:
//
//   addBond              bonds.js                  a relationship moved
//   addBelief            deduction.sceneEvidence   somebody's read of somebody
//   recordClaim          gs.tr.claims              a thing somebody SAID
//   propagate            gs.tr.propagation         who learned it, and how
//   setVoteIntent        gs.tr.voteIntents         who they mean to write down
//   addMurderPreference  gs.tr.murderPrefs         who a Traitor wants gone
//   popDelta             gs.popularity             how the country took it
//   setEmotionalState    gs.tr.emotionOverrides    how they are holding up
//   openArc/advanceArc/resolveArc   threads.js     the story it belongs to
//
// ── WHAT DELIBERATELY HAS NO WRITE PATH ───────────────────────────────
//
// Absences here are the design, not an oversight. A scene may NOT:
//
//   * change an alignment. Who somebody IS is roles.js's ground truth, set by
//     the selection, a recruitment or an ultimatum. A conversation in a
//     corridor may make the room certain and must never make the room right.
//   * move the pot, award a Shield, a Dagger or the Seer, banish, murder, or
//     remove anybody from `gs.activePlayers`. Those are ceremonies with their
//     own records and their own channels (missions.js, powers.js,
//     roundtable.js, murder.js). A scene can only ever change what people
//     think, feel, want and owe each other.
//   * write a `public` or `observed` alignment belief. There are exactly three
//     of those in the engine (the turret, the reveal, the Seer) and this is
//     not one of them — see the ceiling note in js/knowledge.js. Every belief
//     a scene writes is `deduced` and capped, so no scene can ever hand a
//     Faithful certainty about anybody.
//   * touch the cooldowns, the round budget or the crowd ledgers. Those belong
//     to the scheduler and to `applyEventCrowd`, which are already single-path.
//
// ── RECEIPTS ARE DEBUG-ONLY ───────────────────────────────────────────
//
// Nothing a receipt says may reach a viewer. The viewer is shown the
// consequence by later behaviour — Gabby raises it at the table, and the
// audience works out why. `tr-debug` is where the machine sentence lives:
//
//   viewer  Gabby leaves with a contradiction she can repeat at the Round Table.
//   debug   belief · Gabby → Julia +0.7 · source: contradicted her dinner timeline
//
// `cover`, `thread`, `heat`, `opened today` and `The Loom` are debug words and
// forbidden in prose. `debugLine` below is the ONLY place this file composes a
// sentence, and it is never rendered outside js/vp-tr/debug.js.
//
// ── NO Math.random, EVER ──────────────────────────────────────────────
//
// Every path that needs a draw takes one by injection (`ctx.rng`, or an
// explicit `rng` option). The seeded-replay guards depend on it, and the one
// place a draw is unavoidable — `learn()`'s acceptance roll — is fed a
// deterministic COMMIT STREAM instead. See `_commitStream`.
import { gs } from '../core.js';
import { addBond as _addBond } from '../bonds.js';
import { sceneEvidence } from './deduction.js';
import { openThread, advanceThread, closeThread, knownOutcomes } from './threads.js';
import { voteIntentFor as _voteIntentFor, murderPreferenceFor as _murderPrefFor,
  receiptsForEp } from './state.js';

/** The three states `emotionalStateOf` (js/tr/events.js) knows about. */
export const EMOTIONAL_STATES = ['content', 'paranoid', 'desperate'];

/** How a fact can travel. The contract's four channels, and no fifth. */
export const KNOWLEDGE_CHANNELS = [
  'witnessed', 'conversation', 'public-ceremony', 'confessional-audience-only',
];

/**
 * A fact whose channel is `confessional-audience-only` reaches NO contestant.
 * That is the whole of observer safety at this layer, stated as a rule rather
 * than left to each of two hundred events to remember.
 */
const AUDIENCE_ONLY = 'confessional-audience-only';

function _tr() { return gs?.tr || null; }

function _round2(n) { return Math.round(n * 100) / 100; }

function _signed(n) {
  if (n == null) return '';
  const v = _round2(n);
  return (v >= 0 ? '+' : '') + v;
}

/**
 * The debug sentence, and the only sentence this file writes.
 *
 * Shape: `kind · who · source: why`, with the direction arrow reserved for a
 * DIRECTED effect (an observer's read of a subject, a voter's intent) and a
 * plus sign for a SYMMETRIC one (a bond, which two people share). Reading a
 * receipt row should tell you which of the two it was without a legend.
 */
function _debugLine(e) {
  let who;
  if (e.players && e.players.length >= 2) who = `${e.players[0]} + ${e.players[1]}`;
  else if (e.observer && e.subject) who = `${e.observer} → ${e.subject}`;
  else who = e.observer || e.subject || (e.players || []).join(', ') || '—';

  const amount = e.belief != null ? _signed(e.belief)
    : e.delta != null ? _signed(e.delta)
      : e.value != null ? String(e.value) : '';

  const head = amount ? `${e.kind} · ${who} ${amount}` : `${e.kind} · ${who}`;
  return e.applied === false
    ? `${head} · source: ${e.source} · NOT APPLIED (${e.blockedBy || 'refused'})`
    : `${head} · source: ${e.source}`;
}

/**
 * THE COMMIT STREAM, and why a scene does not re-roll its own outcome.
 *
 * `learn()` (js/knowledge.js) runs a persuasion check: does this knower accept
 * this claim, how much jitter lands on the confidence, and — for a claim whose
 * ground truth is false — do they see through it. That check is exactly right
 * for a rumour arriving second-hand and exactly wrong here, because by the
 * time a scene calls `addBelief` the scene has ALREADY decided, with its own
 * injected rng, that Gabby came away suspicious. Rolling again would mean a
 * card that says she did, over a season in which she did not: the precise bug
 * this file exists to make impossible.
 *
 * So the ordinary path feeds `learn()` a fixed three-position stream that
 * removes the second roll while leaving everything structural intact — the
 * alignment ceiling, the decay, the era rules, the strongest-evidence-wins
 * merge. The positions, in the order `_assess` consumes them:
 *
 *   0    acceptance. `acceptP` is never below 0.1, so 0 always accepts.
 *   0.5  the confidence jitter, `(rng() - 0.5) * 0.1`. Exactly zero.
 *   1    the lie-detection / exaggeration roll. 1 is above every probability
 *        either branch can produce, so neither fires.
 *
 * A scene planting something it KNOWS to be false does not get this stream —
 * see `addBelief`'s `truthStatus: 'false'` branch. Seeing through a plant is a
 * real mechanic and it needs a real draw, from the scene's own rng.
 */
function _commitStream() {
  const seq = [0, 0.5, 1];
  let i = 0;
  return () => seq[Math.min(i++, seq.length - 1)];
}

/**
 * The scene consequence API.
 *
 * `ctx` is the scene's own context, and every field is optional except that a
 * scene which passes `participants` opts in to the reaction-radius guard: a
 * belief, a claim or a vote intent may then only be written for somebody who
 * was actually in the room. That is the cheapest enforcement of the knowledge
 * contract there is, and it is opt-in only because a ceremony (the table, the
 * conclave) legitimately writes for people it does not enumerate.
 *
 *   { ep, sceneId, eventId, participants, rng }
 */
export function createTraitorsSceneApi(ctx = {}) {
  const ep = ctx.ep ?? null;
  const sceneId = ctx.sceneId ?? null;
  const eventId = ctx.eventId ?? null;
  const participants = Array.isArray(ctx.participants) ? [...ctx.participants] : null;
  const receipts = [];

  function _require(source, what) {
    if (typeof source !== 'string' || !source.trim()) {
      throw new Error(`scene-api ${what}: a state write needs a human-readable source `
        + '(what a later scene can cite), not an event id');
    }
  }

  /**
   * The reaction radius, as a precondition rather than a hope.
   *
   * A scene that lists its participants may not form a belief on behalf of
   * somebody who was not there. Without this the commonest disconnected-event
   * shape — "and the castle turns on Manu" — writes eight beliefs off one
   * conversation two people had.
   */
  function _inRoom(name, what) {
    if (!participants || participants.includes(name)) return true;
    throw new Error(`scene-api ${what}: ${name} was not in this scene `
      + `(${participants.join(', ')}). A scene may only write for who it convened.`);
  }

  function _push(entry) {
    const r = Object.freeze({
      kind: entry.kind,
      ep, sceneId, eventId,
      observer: entry.observer ?? null,
      subject: entry.subject ?? null,
      players: entry.players ? [...entry.players] : null,
      // `belief` is what the SCENE said the evidence was worth; `confidence`
      // is what the store actually holds after the alignment ceiling and the
      // acceptance check. They differ on almost every write, and collapsing
      // them into one number is how a receipt starts lying about the game.
      belief: entry.belief ?? null,
      delta: entry.delta ?? null,
      confidence: entry.confidence ?? null,
      value: entry.value ?? null,
      truthStatus: entry.truthStatus ?? null,
      source: entry.source,
      applied: entry.applied !== false,
      blockedBy: entry.blockedBy ?? null,
      debugLine: _debugLine({ ...entry, applied: entry.applied !== false }),
    });
    receipts.push(r);
    // Mirrored onto the season so the episode record and the debug tab can
    // find it later; the closure copy is what the firing scene reads back.
    // A world with no `gs.tr` (a unit test holding this API on its own) still
    // gets working receipts, which is why the mirror is conditional.
    const tr = _tr();
    if (tr) (tr.receipts ||= []).push(r);
    return r;
  }

  // ── RELATIONSHIPS ────────────────────────────────────────────────────
  /** Two people's bond moved, and a later scene can say what moved it. */
  function addBond(a, b, delta, { source } = {}) {
    _require(source, 'addBond');
    if (!a || !b || a === b || !delta) return null;
    _addBond(a, b, delta);
    return _push({ kind: 'bond', players: [a, b], delta, source });
  }

  // ── WHAT SOMEBODY THINKS SOMEBODY IS ─────────────────────────────────
  /**
   * `observer` came away from this scene reading `subject` differently.
   *
   * `belief` is how much the evidence was worth, 0..1, BEFORE the alignment
   * ceiling. `truthStatus` says what the scene knows about the cause:
   *
   *   'unknown'  the observer saw something real and cannot tell what it means.
   *              This is the overwhelmingly common case and it commits.
   *   'true'     the scene knows the read is correct (a genuine slip).
   *              Also commits — being right does not make you certain, the
   *              ceiling still applies.
   *   'false'    the scene is PLANTING something. Seeing through a plant is a
   *              real mechanic, so this branch REQUIRES the scene's own rng
   *              and takes a live detection roll rather than committing.
   */
  function addBelief(observer, subject, belief, { source, truthStatus = 'unknown', rng = null } = {}) {
    _require(source, 'addBelief');
    if (!observer || !subject || observer === subject) return null;
    _inRoom(observer, 'addBelief');
    const draws = rng || ctx.rng || null;
    if (truthStatus === 'false' && !draws) {
      throw new Error('scene-api addBelief: a belief the scene knows to be false must be '
        + 'rolled against the observer\'s read, so it needs the scene\'s rng — '
        + 'pass { rng } (or ctx.rng). Never Math.random.');
    }
    const landed = sceneEvidence(observer, subject, belief, {
      source, truthStatus, ep,
      rng: truthStatus === 'false' ? draws : _commitStream(),
    });
    return _push({
      kind: 'belief', observer, subject, belief, truthStatus, source,
      confidence: landed ? _round2(landed.confidence) : null,
      applied: !!landed,
      blockedBy: landed ? null : 'the observer did not accept it',
    });
  }

  // ── WHAT SOMEBODY SAID ───────────────────────────────────────────────
  /**
   * A stored claim, which is the raw material a contradiction is made of.
   *
   * The causal contract's worked example needs TWO incompatible stored claims
   * before anybody may be said to have caught anybody changing their story.
   * That is only possible if the first one was written down at the time, by
   * the scene that heard it, with the people who heard it named. `listeners`
   * is the reaction radius: nobody outside it may ever cite this.
   */
  function recordClaim(speaker, claim, { about = null, listeners = [], truthStatus = 'unknown',
    channel = 'conversation', source } = {}) {
    _require(source, 'recordClaim');
    if (!speaker || !claim) return null;
    _inRoom(speaker, 'recordClaim');
    const tr = _tr();
    const id = `claim-${ep}-${(tr?.claims?.length ?? receipts.length)}`;
    const heard = [...new Set(listeners.filter(n => n && n !== speaker))];
    const rec = { id, ep, sceneId, eventId, speaker, about: about || speaker,
      claim, truthStatus, channel, listeners: heard, source };
    if (tr) (tr.claims ||= []).push(rec);
    const r = _push({ kind: 'claim', observer: speaker, subject: about || speaker,
      value: claim, truthStatus, source });
    for (const to of heard) propagate(id, speaker, to, { channel, source });
    return { ...rec, receipt: r };
  }

  /**
   * A named receipt for one fact travelling from one person to one person.
   *
   * The contract's shape exactly: `{ factId, from, to, channel, ep, sceneId }`.
   * `confessional-audience-only` reaches no contestant AT ALL, and this is the
   * one place that rule is enforced — an audience-only confessional that
   * quietly informed a Faithful would be a hole straight through the observer
   * contract, and it would look like an ordinary function call.
   */
  function propagate(factId, from, to, { channel = 'conversation', source } = {}) {
    _require(source, 'propagate');
    if (!KNOWLEDGE_CHANNELS.includes(channel)) {
      throw new Error(`scene-api propagate: unknown channel "${channel}"`);
    }
    if (channel === AUDIENCE_ONLY) {
      return _push({ kind: 'propagation', observer: from, subject: to, value: factId,
        source, applied: false, blockedBy: 'audience-only: no contestant learns this' });
    }
    if (!factId || !from || !to || from === to) return null;
    const tr = _tr();
    const rec = { factId, from, to, channel, ep, sceneId };
    if (tr) (tr.propagation ||= []).push(rec);
    return _push({ kind: 'propagation', observer: from, subject: to, value: factId, source });
  }

  // ── WHAT SOMEBODY MEANS TO DO ────────────────────────────────────────
  /**
   * `voter` left this scene meaning to write `target` down.
   *
   * An INTENT, never an instruction: `chooseBanishmentVote` (js/tr/deduction.js)
   * reads it as one term beside suspicion and noise, so a scene can move a
   * ballot and cannot own one. `strength` is how firmly — a promise made to a
   * friend's face is worth more than a passing thought.
   */
  function setVoteIntent(voter, target, { source, strength = 0.35 } = {}) {
    _require(source, 'setVoteIntent');
    if (!voter || !target || voter === target) return null;
    _inRoom(voter, 'setVoteIntent');
    const tr = _tr();
    if (tr) {
      const list = (tr.voteIntents ||= []);
      const prev = list.find(x => x.voter === voter && x.ep === ep);
      if (prev) { prev.target = target; prev.strength = strength; prev.source = source; }
      else list.push({ voter, target, strength, ep, sceneId, source });
    }
    return _push({ kind: 'vote-intent', observer: voter, subject: target,
      delta: strength, source });
  }

  /**
   * A Traitor left this scene wanting somebody dead, or wanting them spared.
   *
   * Read by `formPreference` (js/tr/murder.js) as an additive term on the
   * candidate's score, so the conclave argument can cite a corridor rather
   * than arriving from nowhere. Negative deltas are the interesting half:
   * "not her, the room would connect it to me by breakfast".
   */
  function addMurderPreference(traitor, target, delta, { source } = {}) {
    _require(source, 'addMurderPreference');
    if (!traitor || !target || traitor === target || !delta) return null;
    const tr = _tr();
    if (tr) (tr.murderPrefs ||= []).push({ traitor, target, delta, ep, sceneId, source });
    return _push({ kind: 'murder-preference', observer: traitor, subject: target, delta, source });
  }

  // ── HOW THE COUNTRY TOOK IT, AND HOW THEY ARE HOLDING UP ─────────────
  /** Reputation with the audience. Same ledger every other show writes. */
  function popDelta(name, delta, { source } = {}) {
    _require(source, 'popDelta');
    if (!name || !delta) return null;
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[name] = (gs.popularity[name] || 0) + delta;
    return _push({ kind: 'popularity', observer: name, delta, source });
  }

  /**
   * A scene overrode how somebody is holding up.
   *
   * `emotionalStateOf` (js/tr/events.js) DERIVES the state from the last Round
   * Table, and castle events are forbidden from writing it directly — the
   * frozen `ctx.state` map exists to make that impossible. This is the one
   * sanctioned exception, and it is deliberately short-lived: a state set by a
   * scene holds until the next Round Table and is then superseded by the room's
   * own verdict. A conversation can rattle somebody for a day; only the table
   * can decide what they are.
   */
  function setEmotionalState(name, state, { source } = {}) {
    _require(source, 'setEmotionalState');
    if (!name) return null;
    if (!EMOTIONAL_STATES.includes(state)) {
      throw new Error(`scene-api setEmotionalState: "${state}" is not one of `
        + EMOTIONAL_STATES.join(', '));
    }
    const tr = _tr();
    if (tr) (tr.emotionOverrides ||= {})[name] = { state, ep, sceneId, source };
    return _push({ kind: 'emotion', observer: name, value: state, source });
  }

  // ── THE STORY IT BELONGS TO ──────────────────────────────────────────
  /** Open (or re-announce) the arc this scene starts. */
  function openArc(kind, parties, { source, seed = '' } = {}) {
    _require(source, 'openArc');
    const t = openThread(kind, parties, ep, seed || source);
    _push({ kind: 'arc-open', players: parties, value: t ? t.id : null, source });
    return t;
  }

  /** One more beat on an arc that is already open. */
  function advanceArc(id, note, { source } = {}) {
    _require(source, 'advanceArc');
    const t = advanceThread(id, ep, note || source, eventId || '');
    _push({ kind: 'arc-advance', value: id, source,
      players: t ? [...t.parties] : null,
      applied: !!t, blockedBy: t ? null : 'no open arc with that id' });
    return t;
  }

  /**
   * An arc ended, and it ended as SOMETHING.
   *
   * The outcome must be one `outcomeSense` (js/tr/threads.js) has heard of, or
   * every downstream branch that reads the sense silently falls off the end of
   * its own map — which is how the twelfth close site ships broken.
   */
  function resolveArc(id, outcome, { source } = {}) {
    _require(source, 'resolveArc');
    if (!knownOutcomes().includes(outcome)) {
      throw new Error(`scene-api resolveArc: unknown outcome "${outcome}" — `
        + 'add it to OUTCOME_SENSE in js/tr/threads.js or use one of: '
        + knownOutcomes().join(', '));
    }
    const t = closeThread(id, ep, outcome);
    _push({ kind: 'arc-resolve', value: `${id}:${outcome}`, source,
      players: t ? [...t.parties] : null,
      applied: !!t, blockedBy: t ? null : 'no arc with that id' });
    return t;
  }

  // ── READING BACK ─────────────────────────────────────────────────────
  //
  // There is no write path here on purpose. A receipt cannot be recorded
  // without a state write, because every function that records one performs
  // one first — which is what stops "one write path per state type" from being
  // a convention an author can step around by hand-writing a receipt for
  // something that never happened.
  /** Every receipt this scene produced, oldest first. */
  function allReceipts() { return receipts.slice(); }

  /** One receipt — by default the most recent, so a card can cite what it just did. */
  function receipt(n = -1) {
    const i = n < 0 ? receipts.length + n : n;
    return receipts[i] || null;
  }

  /**
   * The canonical `effects: [...]` array for the saved writing record.
   *
   * Deliberately a PROJECTION of the receipts rather than a second list an
   * author maintains: an effects array assembled by hand beside the calls that
   * perform the writes is an effects array that drifts from them.
   */
  function effects() {
    return receipts.filter(r => r.applied).map(r => {
      if (r.kind === 'bond') {
        return { kind: 'bond', players: [...r.players], delta: r.delta, source: r.source };
      }
      if (r.kind === 'belief') {
        return { kind: 'belief', observer: r.observer, subject: r.subject,
          delta: r.belief, source: r.source };
      }
      return { kind: r.kind, observer: r.observer, subject: r.subject,
        delta: r.delta ?? null, value: r.value ?? null, source: r.source };
    });
  }

  return {
    ep, sceneId, eventId,
    addBond, addBelief, recordClaim, propagate, setVoteIntent, addMurderPreference,
    popDelta, setEmotionalState, openArc, advanceArc, resolveArc,
    receipt, receipts: allReceipts, effects,
  };
}

// ── SEASON-LEVEL READERS ────────────────────────────────────────────────
//
// These are how a LATER scene cites an earlier one, which is the second half
// of the causal chain (`scene cites the fact`). They are read-only by
// construction — nothing here returns a live reference into `gs.tr`.

/** Every claim `name` has made, oldest first. */
export function claimsBy(name) {
  return (_tr()?.claims || []).filter(c => c.speaker === name).map(c => ({ ...c }));
}

/**
 * Every claim `knower` is entitled to cite about `about`.
 *
 * ENTITLEMENT, not availability. A claim reaches a listener only if they were
 * in the room when it was made, and the audience-only channel reaches nobody —
 * so this is also the guard that stops a Faithful quoting a turret confessional
 * they were never in.
 */
export function claimsKnownTo(knower, about = null) {
  return (_tr()?.claims || [])
    .filter(c => c.channel !== AUDIENCE_ONLY)
    .filter(c => c.speaker === knower || c.listeners.includes(knower))
    .filter(c => about == null || c.about === about)
    .map(c => ({ ...c }));
}

/**
 * The pairs of claims `knower` can hold up against each other.
 *
 * The contract forbids "Gabby catches Julia changing her story" unless two
 * incompatible stored claims exist AND Gabby knows both. This returns exactly
 * that set, so an event's `weight()` can gate on it instead of asserting it.
 * Incompatibility is declared by the claims themselves — a claim carries a
 * `claim` string and an optional `contradicts` tag — because only the author
 * of the two claims knows whether "upstairs" and "beside the library" are the
 * same hour.
 */
export function contradictionsKnownTo(knower, about) {
  const known = claimsKnownTo(knower, about);
  const out = [];
  for (let i = 0; i < known.length; i++) {
    for (let j = i + 1; j < known.length; j++) {
      const a = known[i], b = known[j];
      if (a.speaker === b.speaker && a.claim === b.claim) continue;
      if (a.claim !== b.claim) out.push([a, b]);
    }
  }
  return out;
}

// The three below are thin `gs`-bound wrappers over js/tr/state.js. The
// derivation lives there, once, because deduction.js and murder.js consume the
// same answers and importing this file from either would close a cycle.

/** Every receipt the season has recorded, optionally narrowed to one episode. */
export function seasonReceipts(ep = null) { return receiptsForEp(gs, ep); }

/** What `voter` last said they meant to do, this episode. Null when nothing was said. */
export function voteIntentFor(voter, ep) { return _voteIntentFor(gs, voter, ep); }

/** How much the day's scenes pushed `traitor` toward (or away from) `target`. */
export function murderPreferenceFor(traitor, target, ep) {
  return _murderPrefFor(gs, traitor, target, ep);
}
