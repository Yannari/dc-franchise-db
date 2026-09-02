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
//   lowerBelief          deduction.sceneDoubt      a cover story that worked
//   popDelta             crowd.crowdMoment         how the country took it
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
//   * touch the cooldowns or the round budget. Those belong to the scheduler.
//   * touch either audience ledger DIRECTLY. js/tr/crowd.js is the only file
//     under js/tr/ permitted to so much as NAME them — a source rule enforced
//     by tests/tr-audience.test.js, which is why this comment does not name
//     them either. The reason is structural: crowd.js writes the affection
//     ledger from GROUND TRUTH, because the audience has known since night
//     one, so a second writer is alignment reaching the castle through a
//     channel the belief gate does not watch. `popDelta` therefore takes a
//     COLOUR, not a number, and hands it to `crowdMoment` — which is also what
//     keeps the affection/spectacle pairing intact. An earlier draft of this
//     file wrote the affection ledger itself, and was a second write path into
//     something the codebase had already made single-path: the exact defect
//     this task exists to prevent, committed by one of its own writers.
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
import { sceneEvidence, sceneDoubt, sceneEvidenceThreshold } from './deduction.js';
import { crowdMoment, CROWD_COLOURS } from './crowd.js';
import { openThread, advanceThread, closeThread, knownOutcomes } from './threads.js';
import { voteIntentFor as _voteIntentFor, murderPreferenceFor as _murderPrefFor,
  recordedReceipts } from './state.js';
import { KNOWLEDGE_CHANNELS, AUDIENCE_ONLY, shareFact,
  knowersOf as _knowersOf, consensusPhrase as _consensusPhrase } from './knowledge-flow.js';

/** The three states `emotionalStateOf` (js/tr/events.js) knows about. */
export const EMOTIONAL_STATES = ['content', 'paranoid', 'desperate'];

/**
 * How a fact can travel. The contract's four channels, and no fifth.
 *
 * DECLARED IN js/tr/knowledge-flow.js AND RE-EXPORTED HERE, unchanged, because
 * this is where every existing caller imports it from. That file owns the
 * propagation LEDGER — it has the read side (`knowersOf`, `eligibleReactors`)
 * that nothing had before Task 7A — and `propagate` below now writes through
 * its `shareFact`, so there is exactly one function appending to
 * `gs.tr.propagation`.
 *
 * A fact whose channel is `confessional-audience-only` reaches NO contestant.
 * That is the whole of observer safety at this layer, stated as a rule rather
 * than left to each of two hundred events to remember, and it is enforced in
 * `shareFact` so the second front door cannot get it wrong.
 */
export { KNOWLEDGE_CHANNELS, AUDIENCE_ONLY } from './knowledge-flow.js';

/**
 * The counter that keeps claim ids unique when there is NO SEASON.
 *
 * With a season the id is derived from `gs.tr.claims.length`, which is state,
 * so a replay mints the same ids in the same order. A season-less harness has
 * no such counter, and the previous fallback (`0`, plus a listener count and a
 * speaker-name length) collided the moment two claims in one harness matched on
 * both — which the docblock calling it collision-free did not say.
 *
 * Ids are labels, never inputs to a decision, so a process-local counter on the
 * season-less path costs no determinism: nothing replays a harness that has no
 * season to replay.
 */
let _looseClaimSeq = 0;

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
  // A crowd moment is a COLOUR that also moved a number; both belong on the
  // row, because "cruel -3" and "selfish -1.5" are different things to have
  // done and the number alone cannot tell them apart.
  if (e.kind === 'crowd' && e.value) {
    return e.applied === false
      ? `crowd · ${who} ${e.value} · source: ${e.source} · NOT APPLIED (${e.blockedBy || 'refused'})`
      : `crowd · ${who} ${e.value} ${amount} · source: ${e.source}`;
  }

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
 *   0    acceptance, WHEREVER ACCEPTANCE IS POSSIBLE AT ALL.
 *   0.5  the confidence jitter, `(rng() - 0.5) * 0.1`. Exactly zero.
 *   1    the lie-detection / exaggeration roll. 1 is above every probability
 *        either branch can produce, so neither fires.
 *
 * THE FIRST POSITION HAS A LIMIT AND THIS DOCBLOCK USED TO DENY IT. It said
 * `acceptP` never drops below 0.1, so a 0 always accepts. `_assess` computes
 * `clamp01(0.1 + cred*0.75 + readSkill*(cred - 0.55)*0.9)`, and below
 * `cred = 0.55` the read-skill term is negative — so for weak evidence the
 * clamp takes `acceptP` to exactly 0 and `rng() >= 0` rejects every time. Small
 * nudges are the commonest scene-scale evidence there is, and they were being
 * dropped in silence, most often for the sharpest observers. That floor is now
 * computed and reported rather than discovered: see `sceneEvidenceThreshold`
 * (js/tr/deduction.js), which `addBelief` consults so the receipt says
 * `applied:false` with the number, instead of returning an unexplained null.
 *
 * A scene planting something it KNOWS to be false does not get this stream —
 * see `addBelief`'s `truthStatus: 'false'` branch and `sceneEvidence`'s note
 * on why that roll cannot live inside `learn()`.
 */
function _commitStream() {
  const seq = [0, 0.5, 1];
  let i = 0;
  return () => seq[Math.min(i++, seq.length - 1)];
}

/**
 * EVERYBODY THIS SEASON HAS EVER HAD, living or not.
 *
 * `gs.activePlayers` alone is the wrong set: a grief scene is about somebody
 * who is gone, and a callback names a person banished four episodes ago. The
 * alignment ledger receives one entry per player at selection and is never
 * pruned, so it is the census — the same source `castSize` uses.
 *
 * Returns null when there is no season at all (a unit test holding this API on
 * its own), and validation is then skipped rather than failing everything.
 */
function _census() {
  const tr = _tr();
  const eras = tr?.alignment ? Object.keys(tr.alignment) : [];
  const living = gs?.activePlayers || [];
  if (!eras.length && !living.length) return null;
  return new Set([...eras, ...living]);
}

/**
 * A NAME THAT IS NOT IN THE SEASON IS AN AUTHORING BUG, AND IT THROWS.
 *
 * This used to be a silent `return null`: a typo in one of two hundred event
 * files either did nothing at all — leaving a card claiming a consequence that
 * never happened, the defect this file exists for — or wrote a belief about a
 * person who does not exist, because `sceneEvidence` will happily `recordFact`
 * for them. Neither failure has a symptom until somebody reads a transcript.
 *
 * A throw is chosen over a `blockedBy:'unknown player'` receipt deliberately.
 * A refused receipt is the right answer for something the ENGINE decided (an
 * observer who did not accept a read, a cover story that failed); a misspelt
 * name is not a thing the castle decided, it is a thing the author got wrong,
 * and it should stop the test that touches it rather than accumulate quietly
 * in a debug table nobody opens.
 */
function _name(n, what, role = 'player') {
  if (typeof n !== 'string' || !n.trim()) {
    throw new Error(`scene-api ${what}: ${role} must be a player name, got ${JSON.stringify(n)}`);
  }
  const census = _census();
  if (census && !census.has(n)) {
    throw new Error(`scene-api ${what}: "${n}" is not in this season. `
      + 'A name that is not in the cast is a typo, not a consequence.');
  }
  return n;
}

/** Two names that must be two different people. */
function _pair(a, b, what) {
  _name(a, what, 'first player');
  _name(b, what, 'second player');
  if (a === b) {
    throw new Error(`scene-api ${what}: "${a}" and "${b}" are the same person`);
  }
}

/**
 * A delta that is not a number at all is an author error and throws. A delta
 * of ZERO is not.
 *
 * THE DISTINCTION IS THE ONE THIS FILE ALREADY STATES ELSEWHERE: a throw is
 * right for something the AUTHOR got wrong, a refused receipt for something the
 * ENGINE decided. Zero-as-branch-sentinel is the house idiom under
 * js/tr/castle/ — `let bondDelta = 0;` followed by two branches that may or may
 * not set it (callback.js, cover.js) — so a zero arriving here is a branch that
 * fired CORRECTLY and simply had nothing to pay. Throwing on it would make
 * every one of those existing `if (delta)` guards load-bearing, and an author
 * writing the natural unguarded call would crash a season in episode nine from
 * code that passed every test.
 *
 * So zero returns zero, and the caller records `blockedBy` NO_OP instead of
 * writing. That also buys something a throw structurally cannot: a season-wide
 * count of scenes that decided to do nothing, since a throw stops at the first.
 *
 * NaN, Infinity and junk still throw. Those are never a branch decision; they
 * are a computation that went wrong.
 */
function _delta(d, what) {
  const v = Number(d);
  if (!Number.isFinite(v)) {
    throw new Error(`scene-api ${what}: delta must be a finite number, `
      + `got ${JSON.stringify(d)}`);
  }
  return v;
}

/** The receipt for a write a scene declined to make. See `_delta`. */
const NO_OP = 'no-op — the branch fired and had nothing to pay';

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
  // The claims this scene has minted, so `contradicts` can name one of them
  // before the season ledger exists to hold it. See `recordClaim`.
  const _minted = new Map();

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
    _pair(a, b, 'addBond');
    const d = _delta(delta, 'addBond');
    if (d === 0) {
      return _push({ kind: 'bond', players: [a, b], delta: 0, source,
        applied: false, blockedBy: NO_OP });
    }
    _addBond(a, b, d);
    return _push({ kind: 'bond', players: [a, b], delta: d, source });
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
   *
   * FOR THE AUTHOR OF A CAUGHT LIE: a DETECTED plant writes no state at all.
   * `sawThrough` on the receipt is enough to narrate "Gabby caught Julia
   * planting", but it is not queryable from the belief store, so nothing later
   * in the season can find it. If a caught liar is supposed to have a
   * consequence, the scene must say so itself — a second `addBelief` on the
   * PLANTER, with its own source — and nothing here enforces that.
   */
  function addBelief(observer, subject, belief, { source, truthStatus = 'unknown', rng = null } = {}) {
    _require(source, 'addBelief');
    _pair(observer, subject, 'addBelief');
    _inRoom(observer, 'addBelief');
    const draws = rng || ctx.rng || null;
    if (truthStatus === 'false' && !draws) {
      throw new Error('scene-api addBelief: a belief the scene knows to be false must be '
        + 'rolled against the observer\'s read, so it needs the scene\'s rng — '
        + 'pass { rng } (or ctx.rng). Never Math.random.');
    }
    const res = sceneEvidence(observer, subject, belief, {
      source, truthStatus, ep,
      rng: truthStatus === 'false' ? draws : _commitStream(),
    });
    // THREE DIFFERENT WAYS TO WRITE NOTHING, AND THE RECEIPT SAYS WHICH.
    // A caller that cannot tell "they saw through it" from "that was too small
    // to register" from "they did not buy it" cannot put an honest sentence on
    // a card, and the old single null could not tell any of them apart.
    const blockedBy = res.sawThrough
      ? 'saw through the plant'
      : res.refused
        ? (belief <= sceneEvidenceThreshold(observer)
          ? `below ${observer}'s notice (strength ${_round2(belief)}, `
            + `threshold ${_round2(sceneEvidenceThreshold(observer))})`
          : 'the observer did not accept it')
        : null;
    return _push({
      kind: 'belief', observer, subject, belief, truthStatus, source,
      confidence: res.confidence != null ? _round2(res.confidence) : null,
      applied: !!res.belief,
      blockedBy,
    });
  }

  /**
   * A COVER STORY THAT WORKED. `observer` suspects `subject` less than before.
   *
   * The counterpart `learn()` structurally cannot provide — it merges upward
   * with `Math.max` — and therefore the primitive the whole cover family would
   * otherwise have had to invent for itself, as a second belief write path,
   * inside the castle. Delegates to `sceneDoubt` (js/tr/deduction.js), which
   * holds the three guards that stop a successful cover from ERASING a known
   * fact: the fact record survives, the belief record survives at zero, and
   * certainty — the turret, the reveal and the Seer — is refused outright.
   *
   * `amount` is how much doubt the explanation bought, subtracted from the
   * read as it stands today. It cannot go below zero — this is doubt, not
   * evidence of innocence, and the format has no such thing.
   */
  function lowerBelief(observer, subject, amount, { source } = {}) {
    _require(source, 'lowerBelief');
    _pair(observer, subject, 'lowerBelief');
    _inRoom(observer, 'lowerBelief');
    const a = _delta(amount, 'lowerBelief');
    // A NEGATIVE amount is not a branch that paid nothing — it is a caller who
    // has the direction backwards, so it keeps its throw.
    if (a < 0) {
      throw new Error('scene-api lowerBelief: amount is how much doubt was bought and is '
        + 'positive — use addBelief to raise a read');
    }
    if (a === 0) {
      return _push({ kind: 'doubt', observer, subject, delta: 0, source,
        applied: false, blockedBy: NO_OP });
    }
    const res = sceneDoubt(observer, subject, a, { source, ep });
    return _push({
      kind: 'doubt', observer, subject, delta: -a, source,
      confidence: res && res.after != null ? _round2(res.after) : null,
      applied: !!(res && !res.refused),
      blockedBy: !res || !res.belief
        ? 'no read to lower'
        : res.refused ? 'certainty is not doubtable — they watched it happen' : null,
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
    channel = 'conversation', contradicts = [], source } = {}) {
    _require(source, 'recordClaim');
    _name(speaker, 'recordClaim', 'speaker');
    if (typeof claim !== 'string' || !claim.trim()) {
      throw new Error('scene-api recordClaim: a claim is the sentence somebody said');
    }
    _inRoom(speaker, 'recordClaim');
    const subject = about || speaker;
    _name(subject, 'recordClaim', 'subject');
    const tr = _tr();
    const heard = [...new Set(listeners.filter(n => n && n !== speaker))];
    for (const h of heard) _name(h, 'recordClaim', 'listener');
    // A COLLISION-FREE ID, IN BOTH WORLDS. Keyed on the season ledger's own
    // length so two scenes in the same episode cannot mint the same id, and on
    // `_looseClaimSeq` when there is no ledger to key on.
    const id = tr
      ? `claim-${ep}-${tr.claims?.length ?? 0}`
      : `claim-${ep}-loose-${_looseClaimSeq++}`;
    // WHICH EARLIER CLAIMS THIS ONE IS INCOMPATIBLE WITH, DECLARED.
    // Never inferred. Only the author of two claims knows whether "upstairs"
    // and "beside the library" describe the same hour, and a rule that treats
    // any two different sentences about a person as a contradiction would make
    // every pair of unrelated remarks read as caught-in-a-lie.
    const against = (Array.isArray(contradicts) ? contradicts : [contradicts])
      .filter(x => typeof x === 'string' && x);
    // WHAT COUNTS AS ON THE RECORD: the season ledger, plus the claims THIS
    // scene has already minted. Without the second half a season-less harness
    // rejected every `contradicts` naming a claim it had just created itself,
    // because nothing it wrote had anywhere to be stored.
    const known = new Set([...(tr?.claims || []).map(c => c.id), ..._minted.keys()]);
    for (const cid of against) {
      if (!known.has(cid)) {
        throw new Error(`scene-api recordClaim: contradicts "${cid}", which is not a `
          + 'stored claim. A contradiction needs both accounts on the record.');
      }
    }
    const rec = { id, ep, sceneId, eventId, speaker, about: subject,
      claim, truthStatus, channel, listeners: heard, contradicts: against, source };
    if (tr) (tr.claims ||= []).push(rec);
    _minted.set(id, rec);
    const r = _push({ kind: 'claim', observer: speaker, subject,
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
    if (!factId || !from || !to || from === to) return null;
    // THE LEDGER WRITE ITSELF LIVES IN js/tr/knowledge-flow.js. This function
    // keeps the receipt, the source sentence and the scene identity, which are
    // the things `shareFact` has no business knowing about; `shareFact` keeps
    // the channel validation, the audience-only rule and the already-knew
    // check, which are the things that must be identical whichever door a
    // caller came in by.
    const r = shareFact({ factId, from, to, channel, ep, sceneId });
    if (r && r.applied === false) {
      return _push({ kind: 'propagation', observer: from, subject: to, value: factId,
        source, applied: false, blockedBy: r.blockedBy });
    }
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
    _pair(voter, target, 'setVoteIntent');
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
    _pair(traitor, target, 'addMurderPreference');
    const d = _delta(delta, 'addMurderPreference');
    if (d === 0) {
      return _push({ kind: 'murder-preference', observer: traitor, subject: target,
        delta: 0, source, applied: false, blockedBy: NO_OP });
    }
    const tr = _tr();
    if (tr) (tr.murderPrefs ||= []).push({ traitor, target, delta: d, ep, sceneId, source });
    return _push({ kind: 'murder-preference', observer: traitor, subject: target, delta: d, source });
  }

  // ── HOW THE COUNTRY TOOK IT, AND HOW THEY ARE HOLDING UP ─────────────
  /**
   * One thing the country watched somebody do.
   *
   * TAKES A COLOUR, NOT A NUMBER, and delegates to `crowdMoment`
   * (js/tr/crowd.js). Three reasons, and the first alone is decisive:
   *
   *   1. js/tr/crowd.js is the ONLY file under js/tr/ allowed to name either
   *      audience ledger — a source rule enforced by tests/tr-audience.test.js
   *      over the raw source, comments included, which is why this docblock
   *      says "the ledgers" and never their keys. They are written from ground
   *      truth, so a second writer is alignment reaching the castle through an
   *      unwatched channel. A raw `+= delta` on the affection ledger here was
   *      a second write path into something this codebase had already made
   *      single-path, in the one task whose whole point is that there is one.
   *   2. There are TWO ledgers, not one. Affection and spectacle are different
   *      feelings and a bare number cannot say which moved: a masterful murder
   *      is almost all spectacle, a selfless act almost all affection. Passing
   *      a colour keeps the pairing that separation depends on.
   *   3. A Traitor's kindness is damped and their cowardice is not. That rule
   *      lives in `crowdMoment` and applies for free here.
   *
   * `mult` scales the moment, not the colour — the same knob every other crowd
   * caller uses. The valid colours are `crowd.js`'s own table, so an unknown
   * one throws here rather than silently scoring nothing.
   */
  function popDelta(name, colour, { source, mult = 1 } = {}) {
    _require(source, 'popDelta');
    _name(name, 'popDelta');
    if (!CROWD_COLOURS[colour]) {
      throw new Error(`scene-api popDelta: "${colour}" is not a crowd colour. `
        + 'This takes a colour, not a number — one of: '
        + Object.keys(CROWD_COLOURS).join(', '));
    }
    const rec = crowdMoment(name, colour, ep, { mult, reason: source });
    return _push({ kind: 'crowd', observer: name, value: colour,
      delta: rec ? _round2(rec.affection) : null, source,
      applied: !!rec, blockedBy: rec ? null : 'no season to score against' });
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
    _name(name, 'setEmotionalState');
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
    if (!Array.isArray(parties) || !parties.length) {
      throw new Error('scene-api openArc: an arc is about somebody — parties must be a name list');
    }
    for (const n of parties) _name(n, 'openArc', 'party');
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

  // ── HOW MANY PEOPLE MAY THIS SENTENCE CLAIM (writing-contracts.md) ───
  //
  // "Words such as `everyone`, `the whole room`, `the group agrees`, `the
  // castle turns`, and `nobody trusts` require evidence." An event that wants
  // to say how far something has got calls this and drops the answer into its
  // line, so the words come from the receipts rather than from the author's
  // sense of scale. `living` defaults to the castle as it stands.
  //
  // ON THE API AND NOT IMPORTED DIRECTLY, for the reason every other
  // consequence is: js/tr/castle/ may not import js/tr/knowledge-flow.js's
  // writer, and a file that imported the readers would be one edit away from
  // importing `shareFact` beside them.
  function consensusPhrase({ factId = null, agreeing = null, living = null,
    evidence = null } = {}) {
    return _consensusPhrase({
      factId, ep,
      agreeing: agreeing || (factId ? _knowersOf(factId, ep) : []),
      living: living || (gs?.activePlayers || []).length,
      evidence,
    });
  }

  // NO `consensusBasis` OR `knowersOf` ON THIS SURFACE, DELIBERATELY. Both
  // were here in the first cut of Task 7A and no event called either, which is
  // this project's own named failure mode wearing a helpful face. They are
  // exported from js/tr/knowledge-flow.js for the readers that do use them —
  // `consensusPhrase` above calls both — and they come back onto the API the
  // day an event needs them, with the event in the same commit.

  return {
    ep, sceneId, eventId,
    addBond, addBelief, lowerBelief, recordClaim, propagate, setVoteIntent,
    consensusPhrase,
    addMurderPreference, popDelta, setEmotionalState, openArc, advanceArc, resolveArc,
    receipt, receipts: allReceipts, effects,
  };
}

// ── SEASON-LEVEL READERS ────────────────────────────────────────────────
//
// These are how a LATER scene cites an earlier one, which is the second half
// of the causal chain (`scene cites the fact`). They are read-only by
// construction — nothing here returns a live reference into `gs.tr`.

// THE THREE READERS BELOW REQUIRE A SEASON. They read `gs.tr.claims`, which is
// where a claim is STORED; a season-less harness keeps its claims only on the
// API instance that minted them (see `_minted`), so these return empty there.
// That is the honest answer rather than a defect: "who is entitled to cite
// this" is a question about a castle, and there is no castle.

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
 * INCOMPATIBILITY IS DECLARED, NEVER INFERRED. A claim names the earlier
 * claims it contradicts (`recordClaim`'s `contradicts` option, validated
 * against the store at write time), because only the author of two accounts
 * knows whether "upstairs" and "beside the library" describe the same hour.
 * An earlier draft of this function treated ANY two different sentences about
 * the same person as a contradiction, which would have made every pair of
 * unrelated remarks read as somebody caught in a lie — and events are meant to
 * gate `weight()` on this.
 *
 * The KNOWLEDGE half is the other requirement the contract states: the pair is
 * returned only when `knower` is entitled to cite BOTH accounts. Gabby holding
 * one of them and having heard about the other second-hand is not a
 * contradiction she can raise.
 */
export function contradictionsKnownTo(knower, about = null) {
  const known = claimsKnownTo(knower, about);
  const byId = new Map(known.map(c => [c.id, c]));
  const out = [];
  const seen = new Set();
  for (const later of known) {
    for (const id of (later.contradicts || [])) {
      const earlier = byId.get(id);
      if (!earlier) continue;               // knower does not know the other half
      const key = [earlier.id, later.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([earlier, later]);
    }
  }
  return out;
}

// The three below are thin `gs`-bound wrappers over js/tr/state.js. The
// derivation lives there, once, because deduction.js and murder.js consume the
// same answers and importing this file from either would close a cycle.

/**
 * Every receipt the season has recorded, optionally narrowed to one episode.
 *
 * READS THE EPISODE ROWS, NOT THE LIVE BUFFER. `gs.tr.receipts` is trimmed as
 * each episode is recorded (see `trimRecordedReceipts` in js/tr/state.js), so a
 * reader still pointed at it would quietly answer "this episode" to a question
 * about the season. Re-sourced here rather than later because this function has
 * no production caller yet — only tests — and it will never be cheaper to move.
 */
export function seasonReceipts(ep = null) { return recordedReceipts(gs, ep); }

/** What `voter` last said they meant to do, this episode. Null when nothing was said. */
export function voteIntentFor(voter, ep) { return _voteIntentFor(gs, voter, ep); }

/** How much the day's scenes pushed `traitor` toward (or away from) `target`. */
export function murderPreferenceFor(traitor, target, ep) {
  return _murderPrefFor(gs, traitor, target, ep);
}
