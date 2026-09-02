// ══════════════════════════════════════════════════════════════════════
// tr/episode-editor.js — the cut: which stories tonight is about, in what
// order, and what happened to everything somebody said they would do
// ══════════════════════════════════════════════════════════════════════
//
// THE SCHEDULER SUPPLIES MATERIAL. THIS DECIDES WHAT THE EPISODE IS.
//
// js/tr/events.js and js/tr/castle/phases.js between them fire ~27 castle
// scenes a night, in the order the seven windows happen to draw them. That is
// a day. It is not an episode: nothing says two or three stories are the point
// of tonight and the rest is texture, nothing stops four accusations landing
// in a row, and — the defect that matters most — nothing follows up. A scene
// that opens a story is a PROMISE, and until this file existed the promise had
// nowhere to be recorded, so a story could simply stop and every suite stayed
// green.
//
// ── WHAT IT MAY AND MAY NOT DO (controller ruling R1) ─────────────────
//
// IT ORDERS AND SHAPES. IT DOES NOT SPEND THE THROUGHPUT. Task 7 took the
// castle from 12.8 fired scenes an episode to 27.4 and the audience card
// stream from about 57 to 121, inside the plan's 100-140 band. An editor that
// "tightened" the cut by dropping scenes would hand that back, quietly, and
// the card band is the one number the whole plan is measured on.
//
// SO THIS EDITOR DROPS NOTHING. Not "drops little" — nothing. `buildEpisodeEdit`
// returns a permutation of exactly the scenes it was given, and
// tests/tr-episode-editor.test.js asserts set equality on scene identity, not
// merely on length. The record therefore has no `dropped` field: a field that
// is always empty is a field a later reader will assume is load-bearing, and
// this project has shipped that shape before. If a future task genuinely needs
// a cut, it adds the field, the reason, and the floor guard together.
//
// ── WHAT IT ACTUALLY CHANGES ──────────────────────────────────────────
//
//   1. STORY HIERARCHY. Threads are ranked and split into primary, secondary
//      and texture. Nothing is invented to fill a tier: a quiet night has two
//      primaries and says so.
//   2. TONE AND PACING. Within one chronological block — the WINDOW, which is
//      finer than the six Castle Day phases; see `_phaseKey` — scenes are
//      resequenced so a run of conflict is broken by whatever relief that
//      block actually holds. Chronology is not negotiable, so the resequencer
//      NEVER moves a scene across a block boundary: breakfast cannot be moved
//      to after the table, and a scene on the way out cannot be moved to the
//      way back, which is the boundary the mission itself sits on.
//   3. PROMISES. Every story opened tonight is recorded as a promise, and
//      every promise ends the episode with one of four statuses. `postponed`
//      is a real answer; silence is not.
//
// ── NO RNG IS DRAWN ───────────────────────────────────────────────────
//
// `buildEpisodeEdit` takes an `rng` for interface compatibility with the rest
// of the engine and, today, never calls it. That is deliberate and it is worth
// saying out loud: the editor runs inside `_recordEpisode`, downstream of the
// murder, the ballot and the mission, and a draw taken here would perturb
// nothing today and would perturb everything the first time somebody moved the
// call site. Ordering is a function of the scenes, so it does not need one.
import { gs } from '../core.js';
import { consensusBasis } from './knowledge-flow.js';
import { sceneToneClass } from './castle/voice.js';

/** The four terminal answers a promise may end an episode with. */
export const PROMISE_STATUSES = ['resolved', 'attempted', 'postponed', 'abandoned'];

/** The seven registers the tone ledger counts. */
export const TONES = ['suspense', 'strategy', 'conflict', 'warmth', 'humour',
  'grief', 'ordinary-life'];

/** The three tones that count as relief for the pacing contract. */
export const RELIEF_TONES = new Set(['warmth', 'humour', 'ordinary-life']);

/** No more than this many high-conflict scenes back to back. */
export const MAX_CONFLICT_RUN = 3;

/** No more than this many consecutive scenes sharing a family or a pair. */
export const MAX_SAME_RUN = 2;

/**
 * Story-tier sizes for a STANDARD castle, and how they scale down.
 *
 * writing-contracts.md: "A standard episode normally carries 2-3 primary
 * stories, 2-4 secondary stories, and 3-6 texture scenes. The editor may use
 * fewer late in the game." Late is not a special case bolted on — it falls out
 * of the living count, because a castle of six people cannot produce three
 * primary stories and should not pretend to.
 */
export const TIERS = { primaryMax: 3, secondaryMax: 4, textureMin: 3, textureMax: 6 };

/** Below this many living players the castle is late-game and scales down. */
const LATE_GAME_LIVING = 8;

// ══════════════════════════════════════════════════════════════════════
// PROMISES
// ══════════════════════════════════════════════════════════════════════

function _promises() {
  if (!gs?.tr) return null;
  return (gs.tr.promises ||= []);
}

/**
 * SOMEBODY SAID THEY WOULD DO A THING.
 *
 * `action` is the sentence the castle actually produced — the beat that opened
 * the story — never a paraphrase composed here. The contract's forbidden case
 * is a confessional saying "I'm checking that story" and nobody checking; the
 * only way a later sweep can tell whether the checking happened is if the
 * original words are on the record next to the status.
 */
export function recordPromise(sceneId, owner, action,
  { ep = null, threadId = null, parties = null } = {}) {
  if (typeof owner !== 'string' || !owner.trim()) {
    throw new Error(`episode-editor recordPromise: owner must be a name, got ${JSON.stringify(owner)}`);
  }
  if (typeof action !== 'string' || !action.trim()) {
    throw new Error('episode-editor recordPromise: a promise is the thing that was said, '
      + 'not an event id');
  }
  const list = _promises();
  const id = `promise-${ep ?? 0}-${list ? list.length : 0}-${threadId || sceneId || owner}`;
  const rec = { id, sourceSceneId: sceneId || null, promisedAction: action, owner,
    ep, lastEp: ep, threadId: threadId || null, parties: [...(parties || [owner])],
    status: 'open', resolutionSceneId: null, abandonmentReason: null, detail: null };
  if (list) list.push(rec);
  return rec;
}

/**
 * ...AND HERE IS WHAT HAPPENED TO IT.
 *
 * `abandoned` REQUIRES A REASON and throws without one. That is the single
 * assertion the whole promise ledger is for: "silently forgotten" and
 * "abandoned" must not be spellable the same way, or the contract's forbidden
 * case passes through as a valid status.
 */
export function settlePromise(id, status, detail = '') {
  if (!PROMISE_STATUSES.includes(status)) {
    throw new Error(`episode-editor settlePromise: "${status}" is not one of `
      + PROMISE_STATUSES.join('/'));
  }
  if (status === 'abandoned' && (typeof detail !== 'string' || !detail.trim())) {
    throw new Error('episode-editor settlePromise: an abandoned promise needs a recorded '
      + 'reason. A promise that simply stopped is the defect this ledger exists for.');
  }
  const rec = (_promises() || []).find(p => p.id === id);
  if (!rec) return null;
  rec.status = status;
  rec.detail = detail || null;
  if (status === 'abandoned') rec.abandonmentReason = detail;
  return rec;
}

/**
 * Every promise still awaiting a FINAL answer at `ep`.
 *
 * `postponed` IS NOT TERMINAL AND THAT IS THE POINT. writing-contracts.md's
 * valid abandonment is "the promise is stored as postponed, not silently
 * forgotten" — a story held over is a story that comes back, and a ledger that
 * closed the book on it the night it opened could never record the payoff three
 * episodes later. So a postponed promise stays in this list, and the night its
 * thread closes it becomes `resolved` with the closing beat named.
 *
 * The other three are terminal: a resolved story has paid off, an abandoned one
 * has a recorded reason it cannot, and `attempted` is stamped on a promise the
 * episode carried without settling — which is itself re-openable, because the
 * story is still live.
 */
export function openPromises(ep = null) {
  return (_promises() || []).filter(p =>
    (p.status === 'open' || p.status === 'postponed' || p.status === 'attempted')
    && (ep == null || p.ep == null || p.ep <= ep));
}

// ══════════════════════════════════════════════════════════════════════
// TONE
// ══════════════════════════════════════════════════════════════════════

/**
 * A scene's tone, derived from what the engine recorded and from nothing else.
 *
 * FAMILY FIRST, BRANCH SECOND. A grief scene is grief; a suspicion scene is
 * conflict when its branch went badly and suspense when it did not. That
 * split is what stops the pacing rule treating "she answered it and he
 * believed her" as an argument, which would make almost every castle read as
 * an unbroken wall and make the rule useless.
 *
 * The adverse test is the record's own `tone` field when the screen has
 * already computed one, then the branch name, then the closed-thread outcome —
 * in that order, because each is a stronger statement than the next.
 */
export function sceneTone(scene) {
  if (!scene) return 'ordinary-life';
  if (TONES.includes(scene.tone)) return scene.tone;
  const fam = String(scene.family || scene.kind || '');
  // ADVERSE IS NOT A REGEX OVER THE BRANCH NAME, AND THE FIRST DRAFT OF THIS
  // FUNCTION LEARNED THAT BY MEASUREMENT. A pattern over words like `broke`,
  // `caught` and `refused` classified 28 of 695 real castle scenes as conflict
  // — 4% — because the branch vocabulary this library actually produces is
  // `did-not-line-up`, `named-somebody-else`, `misread-calm`, `nearly-said-it`.
  // The pacing rule was therefore inert on the very seasons it was written for.
  // `sceneToneClass` (js/tr/castle/voice.js) is the hand-sorted denylist over
  // every branch five real seasons produced, which is the same answer the
  // reaction card is already selected with.
  const adverse = scene.toneClass === 'adverse' || sceneToneClass(scene) === 'adverse';
  if (fam === 'grief') return 'grief';
  if (fam === 'romance' || fam === 'romance-spark') return 'warmth';
  if (fam === 'trust') return adverse ? 'conflict' : 'warmth';
  if (fam === 'journey') return adverse ? 'conflict' : 'ordinary-life';
  if (fam === 'callback') return adverse ? 'conflict' : 'ordinary-life';
  if (fam === 'cover') return adverse ? 'conflict' : 'suspense';
  if (fam === 'testing') return adverse ? 'conflict' : 'suspense';
  if (fam === 'suspicion') return adverse ? 'conflict' : 'suspense';
  if (fam === 'mission' || fam === 'mission-fallout') return adverse ? 'conflict' : 'strategy';
  return adverse ? 'conflict' : 'ordinary-life';
}

/** The longest run of consecutive entries satisfying `pred`. Exported for tests. */
export function longestRun(list, pred) {
  let best = 0, run = 0;
  for (const x of (list || [])) {
    if (pred(x)) { run++; if (run > best) best = run; } else run = 0;
  }
  return best;
}

// ══════════════════════════════════════════════════════════════════════
// THE CUT
// ══════════════════════════════════════════════════════════════════════

function _pairKey(scene) {
  const people = [...new Set([...(scene.people || []), ...(scene.parties || []),
    ...(scene.actors || [])].filter(Boolean))].sort();
  return people.join('|');
}

/**
 * THE CHRONOLOGICAL BLOCK A SCENE MAY BE MOVED WITHIN, AND NOT OUT OF.
 *
 * `window` in practice, because that is what `_castleRecord` (js/tr/headless.js)
 * stamps on every scene and it is FINER than the six Castle Day phases:
 * `morning-life` owns both `morning` and `journey-out`, and the mission runs
 * between them. Grouping by phase would let the editor move a scene from
 * before the mission to after it, which is a chronology error the phase record
 * cannot see. Grouping by window cannot.
 *
 * `phaseId` is honoured first for a caller that supplies one — the fixtures in
 * tests/tr-episode-editor.test.js do, so that file can exercise the boundary
 * rule without depending on the window table.
 */
function _phaseKey(scene) {
  return String(scene.phaseId || scene.phase || scene.window || 'castle');
}

/**
 * RESEQUENCE ONE PHASE.
 *
 * Greedy, and greedy is the right shape here rather than a laziness: the
 * constraints are all LOCAL (what came immediately before), so a next-best
 * choice at every step satisfies them wherever they are satisfiable at all,
 * and where they are not — a phase holding six conflict scenes and no relief —
 * it degrades to the original order instead of failing. Ordering cannot
 * manufacture warmth that the night did not contain, and inventing a scene to
 * relieve a run is exactly what the plan forbids.
 *
 * Penalties, in the order they bind:
 *   - continuing a conflict run already at MAX_CONFLICT_RUN: very heavy;
 *   - a third scene in a row from the same family, or with the same pair: heavy;
 *   - SPENDING RELIEF EARLY: a flat cost on any non-conflict scene while the
 *     run is still under the cap, turning to a large bonus once the cap is
 *     reached. Without it the greedy cashes its one warm scene on the second
 *     card of the phase and has nothing left when the run actually needs
 *     breaking — measured on the conflict-heavy fixture, that is the
 *     difference between a longest run of 5 and one of 3.
 *   - the same non-conflict tone twice running: light, so variety is
 *     preferred and never enforced at the cost of the rules above.
 *
 * THE RUN STATE CARRIES ACROSS PHASE BOUNDARIES, and the scenes do not. The
 * distinction is the whole point: the editor may not move a breakfast scene
 * into the evening, but it must know, when it starts the evening, that
 * breakfast ended on two accusations — a phase-local resequencer produces two
 * individually legal phases whose join is a run of five.
 *
 * Ties break on the ORIGINAL INDEX, so the output is deterministic and, on a
 * phase with no constraint pressure at all, identical to the input.
 */
function _resequence(scenes, carry = null, { reserveTail = false } = {}) {
  const isConflict = s => sceneTone(s) === 'conflict';
  const conflicts = scenes.filter(isConflict);
  const others = scenes.filter(s => !isConflict(s));
  const out = [];
  let conflictRun = carry?.conflictRun ?? 0;
  let lastFamily = carry?.lastFamily ?? null, famRun = carry?.famRun ?? 0;
  let lastPair = carry?.lastPair ?? null, pairRun = carry?.pairRun ?? 0;
  let lastTone = carry?.lastTone ?? null;

  /**
   * Take the next scene from `list`, preferring one that does not continue a
   * family or pair run. Falls back to the head of the list, so relative order
   * is preserved wherever there is no constraint to satisfy — which is what
   * makes an unpressured phase come out identical to the way it fired.
   */
  function take(list) {
    let at = 0;
    for (let k = 0; k < list.length; k++) {
      const s = list[k];
      const fam = String(s.family || s.kind || '');
      const pair = _pairKey(s);
      const famBad = fam && fam === lastFamily && famRun >= MAX_SAME_RUN;
      const pairBad = pair && pair === lastPair && pairRun >= MAX_SAME_RUN;
      const dull = sceneTone(s) === lastTone;
      if (!famBad && !pairBad && !dull) { at = k; break; }
      if (!famBad && !pairBad && at === 0 && k > 0) at = k;
    }
    const [s] = list.splice(at, 1);
    const fam = String(s.family || s.kind || '');
    const pair = _pairKey(s);
    const tone = sceneTone(s);
    conflictRun = tone === 'conflict' ? conflictRun + 1 : 0;
    famRun = fam && fam === lastFamily ? famRun + 1 : 1;
    pairRun = pair && pair === lastPair ? pairRun + 1 : 1;
    lastFamily = fam; lastPair = pair; lastTone = tone;
    out.push(s);
  }

  while (conflicts.length || others.length) {
    let takeConflict;
    // ── A PHASE DOES NOT HAND THE NEXT ONE A LIVE RUN ────────────────
    //
    // `reserveTail` holds one non-conflict scene back to close the phase with
    // whenever there is a phase after this one. Without it the resequencer
    // produces four individually legal phases whose JOINS are the problem: on
    // the conflict-heavy fixture it spent every relief scene inside its own
    // phase and handed the last phase — which has none — a run already at two,
    // for a longest run of six. Ordering cannot move a breakfast scene into
    // the evening, but it can decline to end breakfast mid-argument.
    const spendable = reserveTail ? others.length - 1 : others.length;
    if (!conflicts.length) takeConflict = false;
    else if (!others.length) takeConflict = true;
    else if (conflictRun >= MAX_CONFLICT_RUN) takeConflict = false;
    else if (spendable <= 0) takeConflict = true;
    else {
      // ── SPEND RELIEF ON AN EVEN SPLIT, NOT AT THE CAP ────────────────
      //
      // The separators still available divide the conflicts still waiting into
      // `others.length + 1` groups. `g` is that group size, capped at the
      // contract's maximum. Taking conflicts while the run is under `g` and a
      // relief scene the moment it reaches `g` spreads the night's arguments
      // as evenly as the night's own material allows.
      //
      // A COST-GREEDY WAS TRIED FIRST AND MEASURED WORSE. Penalising relief
      // while the run was under the cap made the editor deliberately build
      // every run UP to three before spending anything, and over eight real
      // seasons that raised the mean longest run from 2.51 to 2.66 — the
      // editor making the thing it exists to fix slightly worse, which no
      // assertion about the cap would have caught.
      const groups = spendable + 1;
      const g = Math.min(MAX_CONFLICT_RUN,
        Math.max(1, Math.ceil(conflicts.length / groups)));
      takeConflict = conflictRun < g;
    }
    take(takeConflict ? conflicts : others);
  }
  return { out, carry: { conflictRun, lastFamily, famRun, lastPair, pairRun, lastTone } };
}

/**
 * A story, as the record stores it: `{ arcId, premise, plannedBeats, payoff }`.
 *
 * PREMISE IS DERIVED, NEVER WRITTEN. It names the story's kind, its parties
 * and the day it started — every one of which is on the thread — and it says
 * nothing the engine did not already record. A premise composed here would be
 * the editor inventing the thing it is supposed to be selecting.
 */
function _arcRecord(arc) {
  const who = arc.parties.length ? arc.parties.join(' and ') : 'the castle';
  const since = arc.openedEp != null ? `, running since day ${arc.openedEp}` : '';
  return {
    arcId: arc.arcId,
    premise: `${arc.kind} between ${who}${since}`,
    kind: arc.kind,
    parties: [...arc.parties],
    plannedBeats: arc.scenes.map(s => s.sceneId),
    beatsTonight: arc.scenes.length,
    payoff: arc.payoff,
  };
}

function _sceneId(s, i) {
  return s.sceneId || `${s.window || 'w'}:${s.eventId || 'e'}:${s.beatNo ?? i}`;
}

/**
 * BUILD TONIGHT'S CUT.
 *
 * `eligibleScenes` are the scenes that ALREADY FIRED — the day, as recorded.
 * "Eligible" is the plan's word and it is worth being precise about what it
 * means here: the editor selects among things that causally happened, and has
 * no power to make anything happen. It cannot reach into the pool for a scene
 * the castle did not produce, which is the guarantee behind "Do not synthesize
 * facts to satisfy story quotas".
 *
 * `ctx`: `{ ep, living }`. `rng` is accepted and unused — see the header.
 */
export function buildEpisodeEdit(eligibleScenes, ctx = {}, rng = null) { // eslint-disable-line no-unused-vars
  const input = (eligibleScenes || []).filter(Boolean);
  const ep = ctx.ep ?? null;
  const living = [...new Set((ctx.living || gs?.activePlayers || []).filter(Boolean))];

  // ── 1. TONE, STAMPED ON EVERY SCENE ─────────────────────────────────
  // Additive metadata on the record, not a rewrite of it: the screens read
  // `family`/`branch` exactly as before, and a guard can now check the
  // pacing prose against the reason for it rather than against itself.
  for (let i = 0; i < input.length; i++) {
    const s = input[i];
    s.sceneId = _sceneId(s, i);
    s.tone = sceneTone(s);
    // THE ORDER THE WINDOWS FIRED THEM IN, KEPT. Without it there is no way
    // to reconstruct the unedited day, and a band on the edited order cannot
    // be shown to differ from the order it replaced — which is the shape this
    // plan has shipped a guard in before.
    s.firedAt = i;
  }

  // ── 2. ORDER, PHASE BY PHASE ────────────────────────────────────────
  // Phases keep the order they arrived in — that is the chronology of a day
  // and the editor has no authority over it. Only the contents of a phase are
  // resequenced.
  const phaseOrder = [];
  const byPhase = new Map();
  for (const s of input) {
    const k = _phaseKey(s);
    if (!byPhase.has(k)) { byPhase.set(k, []); phaseOrder.push(k); }
    byPhase.get(k).push(s);
  }
  const scenes = [];
  let carry = null;
  for (let pi = 0; pi < phaseOrder.length; pi++) {
    const res = _resequence(byPhase.get(phaseOrder[pi]), carry,
      { reserveTail: pi < phaseOrder.length - 1 });
    carry = res.carry;
    scenes.push(...res.out);
  }

  // ── 3. STORY HIERARCHY ──────────────────────────────────────────────
  const arcs = new Map();
  for (const s of scenes) {
    const id = s.threadId || `loose:${s.eventId}:${_pairKey(s)}`;
    if (!arcs.has(id)) {
      arcs.set(id, { arcId: id, kind: s.kind || s.family || 'story',
        parties: [...new Set((s.parties && s.parties.length ? s.parties
          : (s.people || [])).filter(Boolean))],
        openedEp: s.openedEp ?? null, scenes: [], payoff: null, closedHere: false,
        priorDays: new Set() });
    }
    const arc = arcs.get(id);
    arc.scenes.push(s);
    for (const d of (s.priorDays || [])) arc.priorDays.add(d);
    if (s.closedNow) { arc.payoff = s.outcome || 'closed'; arc.closedHere = true; }
  }
  const ranked = [...arcs.values()].sort((x, y) => {
    const sx = x.scenes.length * 2 + (x.closedHere ? 3 : 0) + x.priorDays.size;
    const sy = y.scenes.length * 2 + (y.closedHere ? 3 : 0) + y.priorDays.size;
    if (sy !== sx) return sy - sx;
    return String(x.arcId).localeCompare(String(y.arcId));
  });

  // Late-game scales the tiers down rather than padding them. A six-person
  // castle producing "three primary stories" would be the editor asserting a
  // shape the night does not have.
  const late = living.length > 0 && living.length < LATE_GAME_LIVING;
  const primaryCap = late ? 2 : TIERS.primaryMax;
  const secondaryCap = late ? 2 : TIERS.secondaryMax;

  // A PRIMARY STORY TOOK MORE THAN ONE BEAT. One scene is not a story the
  // episode is about; it is texture, and calling it primary would make the
  // tier meaningless on a quiet night.
  const multi = ranked.filter(a => a.scenes.length > 1);
  const single = ranked.filter(a => a.scenes.length <= 1);
  const primaryStories = multi.slice(0, primaryCap).map(_arcRecord);
  const secondaryStories = multi.slice(primaryCap, primaryCap + secondaryCap).map(_arcRecord);
  const promoted = new Set([...primaryStories, ...secondaryStories].map(a => a.arcId));
  const textureSlots = [...multi.filter(a => !promoted.has(a.arcId)), ...single]
    .flatMap(a => a.scenes)
    .map(s => ({ purpose: s.tone, phase: _phaseKey(s), sceneId: s.sceneId }));

  // ── 4. TONE LEDGER ──────────────────────────────────────────────────
  const toneLedger = Object.fromEntries(TONES.map(t => [t, 0]));
  for (const s of scenes) toneLedger[s.tone] = (toneLedger[s.tone] || 0) + 1;

  // ── 5. PROMISES ─────────────────────────────────────────────────────
  //
  // A STORY OPENED IS A PROMISE MADE. That is not a metaphor bolted on to
  // satisfy a schema: `openThread` is called by the event that starts
  // something, its seed note is the sentence the castle produced, and every
  // later beat on that thread is somebody carrying it. So the promise's
  // `promisedAction` is the opening beat's own words and its owner is the
  // person the record says drove that scene.
  const alive = new Set(living);
  for (const s of scenes) {
    if (!s.opened || !s.threadId) continue;
    const owner = s.speaker || (s.parties || [])[0] || (s.people || [])[0];
    if (!owner) continue;
    const already = (_promises() || []).some(p => p.threadId === s.threadId);
    if (already) continue;
    recordPromise(s.sceneId, owner, String(s.line || '').trim() || s.eventId,
      { ep, threadId: s.threadId, parties: s.parties && s.parties.length ? s.parties : s.people });
  }
  // ...AND EVERY PROMISE ANSWERS FOR ITSELF BEFORE THE EPISODE IS FILED.
  // The four answers, in the order they are checked, because each is a
  // stronger statement than the one after it. Promises HELD OVER FROM EARLIER
  // EPISODES are checked too: a story opened on day three and paid off on day
  // six is the continuity the whole of spec section 7 is about, and a ledger
  // that only ever looked at tonight's own openings could not record it.
  for (const p of openPromises(ep)) {
    const arc = p.threadId ? arcs.get(p.threadId) : null;
    const beats = arc ? arc.scenes : [];
    const touched = beats.length > 0;
    if (arc && arc.closedHere) {
      settlePromise(p.id, 'resolved', `paid off on day ${ep}: ${arc.payoff}`);
      p.resolutionSceneId = beats[beats.length - 1]?.sceneId || null;
      p.lastEp = ep;
      continue;
    }
    const carriedTonight = beats.filter(b => !b.opened).length;
    if (carriedTonight > 0) {
      settlePromise(p.id, 'attempted',
        `carried ${carriedTonight} further beat(s) on day ${ep} without settling`);
      p.resolutionSceneId = beats[beats.length - 1]?.sceneId || null;
      p.lastEp = ep;
      continue;
    }
    if (alive.size && !alive.has(p.owner)) {
      settlePromise(p.id, 'abandoned',
        `${p.owner} left the castle before it could be carried further`);
      p.lastEp = ep;
      continue;
    }
    const others = (arc?.parties || p.parties || []).filter(n => n !== p.owner);
    const goneParty = alive.size ? others.find(n => !alive.has(n)) : null;
    if (goneParty) {
      settlePromise(p.id, 'abandoned',
        `${goneParty} is no longer in the castle, so the story has nobody left to settle with`);
      p.lastEp = ep;
      continue;
    }
    settlePromise(p.id, 'postponed',
      touched ? 'opened tonight and still open: it takes another day'
        : `nothing moved it on day ${ep}; it is still owed`);
    p.lastEp = ep;
  }
  // WHAT THE EPISODE DID TO THE LEDGER: promises opened tonight, and promises
  // from earlier nights that tonight answered. Not the whole season's ledger —
  // a row carrying every promise ever made would grow without bound, which is
  // the state-bloat shape this project has measured before.
  const promises = (_promises() || [])
    .filter(p => ep == null || p.ep === ep || p.lastEp === ep)
    .map(p => ({ ...p }));

  // ── 6. CONSENSUS BASIS ──────────────────────────────────────────────
  // What the room could legally be said to agree about tonight. Stored so a
  // screen or a later scene has a number to point at instead of the word
  // "everyone" — see js/tr/knowledge-flow.js.
  const consensus = consensusBasis({
    agreeing: [...new Set(scenes.flatMap(s => s.people || []))],
    living, ep,
  });

  return {
    ep,
    scenes,
    primaryStories,
    secondaryStories,
    textureSlots: textureSlots.slice(0, Math.max(TIERS.textureMin, textureSlots.length)),
    toneLedger,
    promises,
    consensus,
    // WHAT THE RESEQUENCER ACHIEVED, ON THE RECORD. A band that only ever
    // reads the run length cannot tell "ordering fixed it" from "there was
    // never a run", and this plan has shipped that shape before.
    pacing: {
      longestConflictRun: longestRun(scenes, s => s.tone === 'conflict'),
      reliefScenes: scenes.filter(s => RELIEF_TONES.has(s.tone)).length,
      // How many chronological blocks the night was resequenced inside — see
      // `_phaseKey`. Seven on a full day, because it is the WINDOW and not the
      // six-phase grouping.
      blocks: phaseOrder.length,
    },
  };
}
