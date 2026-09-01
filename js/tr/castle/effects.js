// ══════════════════════════════════════════════════════════════════════
// tr/castle/effects.js — how a castle event is allowed to change anything
// ══════════════════════════════════════════════════════════════════════
//
// WHAT THIS IS FOR, in one sentence: js/tr/scene-api.js was written as THE
// single write path for every castle consequence, and for the whole of its
// first life nothing under js/tr/castle/ imported it. All 98 events called
// `addBond` and the thread writers directly, so not one castle scene left a
// receipt behind, `tr-debug` had nothing to show, and the contract the API
// docblock states was fiction. This module is the on-ramp, and
// `tests/tr-castle-write-path.test.js` is the rule that keeps it the only one.
//
// AN EVENT NEEDS EXACTLY ONE LINE OF IT:
//
//   const api = sceneApi(ctx, 'trust-confide-fear');
//
// and then writes through `api.addBond`, `api.openArc`, `api.advanceArc`,
// `api.resolveArc` and the rest of the surface in js/tr/scene-api.js. Every
// one of those records a receipt naming the scene that caused it.
//
// WHY `sceneApi` AND NOT `createTraitorsSceneApi` DIRECTLY. The runner
// (`pickEvent`, js/tr/events.js) makes one API per firing and hands it to
// `fire()` on `ctx.api`, so every receipt a scene writes carries the same
// scene identity. But three harnesses call `fire()` themselves against a
// hand-built ctx — `validateRegistry`, tr-castle.test.js's frozen-map probe
// and tr-castle-belief-gate.test.js — and an event that read `ctx.api`
// unconditionally would throw in all three. So this takes the runner's API
// when there is one and mints a matching one when there is not, which is also
// what lets a single event be fired in isolation and its receipts read back.
//
// ── THE TWO CITATION HELPERS, AND WHY THEY ARE NOT API METHODS ─────────
//
// `advanceCiting` and `continueThread` (js/tr/threads.js) are not primitives.
// Each is a READ (`findOpenThread`, `priorMoments`, `citeMoments` — pure
// functions over the thread log) composed with exactly one WRITE. Moving the
// composition here keeps the write on the API where the receipt is minted and
// leaves the reads where they are, so no new primitive was needed and
// scene-api.js did not grow a method that is really two.
import { createTraitorsSceneApi } from '../scene-api.js';
import { findOpenThread, priorMoments, citeMoments } from '../threads.js';

/** The scene API for this firing: the runner's if it made one, otherwise ours. */
export function sceneApi(ctx, eventId) {
  if (ctx && ctx.api) return ctx.api;
  return createTraitorsSceneApi({ ep: ctx?.ep ?? null, eventId });
}

/**
 * One more beat on `thread`, with the story's earlier moments named in it.
 *
 * Same composition `advanceCiting` performed, with the write moved onto the
 * API. The throw on a missing thread is kept verbatim and for the same reason:
 * every call site guarantees one in its own `weight()`, so a null here is a
 * weight/fire disagreement and returning a tidy `{ thread: null }` would drop
 * the beat and let the season carry on looking fine.
 */
export function arcAdvanceCiting(api, thread, ep, note, { cite = true, max = 3, source } = {}) {
  if (!thread) {
    throw new Error('arcAdvanceCiting: no story to advance — weight() and fire() disagree');
  }
  const prior = cite ? priorMoments(thread, ep).slice(0, max) : [];
  const citation = prior.length ? citeMoments(thread, ep, max, note) : '';
  const full = citation ? `${note} ${citation}` : note;
  return { thread: api.advanceArc(thread.id, full, { source }), note: full,
    cited: prior.map(p => p.ep) };
}

/** Advance the open story these parties already have, or start one. */
export function arcContinue(api, kind, parties, ep, note, { cite = true, max = 3, source } = {}) {
  const existing = findOpenThread(kind, parties);
  if (!existing) {
    return { thread: api.openArc(kind, parties, { source, seed: note }), note, cited: [] };
  }
  return arcAdvanceCiting(api, existing, ep, note, { cite, max, source });
}
