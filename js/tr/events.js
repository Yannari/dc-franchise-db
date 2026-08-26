// ══════════════════════════════════════════════════════════════════════
// tr/events.js — the engine that decides what happens tonight
// ══════════════════════════════════════════════════════════════════════
//
// An event declares weight(ctx) over live state, and MOST events are weight
// 0 most of the time. That is the anti-repetition mechanism: an event with
// sharp preconditions fires once a season and reads as authored rather than
// rolled. What actually stops a season looping is not more content — it is
// four guards applied on top of that raw weight:
//
//   1. Continuation beats novelty  — advancing an open thread multiplies up.
//   2. Rare-state amplification    — a rare event, once eligible, multiplies
//      up, never down. Gate content behind a rare state and weight it like
//      everything else and it will never win a draw against common events —
//      you will have shipped content you believe is in the game and is not.
//   3. Cooldowns at three scopes   — event, player, and PAIR. Pair is the one
//      that matters: without it the same two people have the same
//      conversation four times and the season reads as a loop.
//   4. Acts                        — early/middle/late multipliers, so an
//      episode-9 castle does not sound like an episode-2 castle.
//
// registerEvent() NEVER calls fire(). Firing writes bonds, threads, residue
// and state — validating the weight/fire agreement by executing it at import
// time would mutate whatever season happens to be live, which is a worse bug
// than the one being guarded against. That agreement is instead checked by
// validateRegistry(), a sandboxed sweep a test calls deliberately, never the
// engine.
import { gs } from '../core.js';
import { findOpenThread, heatAt } from './threads.js';

/** Windows a round is built from (spec §5.6) — registerEvent rejects any other. */
const KNOWN_WINDOWS = new Set([
  'dawn', 'morning', 'journey-out', 'journey-back', 'evening', 'after-table', 'night',
]);

// Guard tuning. Named constants, not magic numbers scattered through _score,
// so a reviewer mutating "the continuation guard" knows exactly which knob
// that is.
const CONTINUATION_BASE = 1;       // a live-but-cold thread still beats a fresh event
const CONTINUATION_PER_HEAT = 0.5; // a hot thread beats a cold one by more
const RARE_MULTIPLIER = 2;         // amplify UP when a rare precondition clears, never down

// Per-scope cooldown durations (episodes), deliberately UNEQUAL. If all three
// scopes held the same window, the event-scope check — which blocks ANY
// re-firing of that id, for anyone — would always be the thing doing the
// blocking, and the player/pair checks below it would never be reached: a
// mutant deleting the pair-scope line would pass every test built on "fire
// it once, check it's gone", because event scope already explains that
// result. Pair gets the LONGEST hold on purpose: it is the scope that
// matters, and it is the last one still enforcing a boundary after the event
// itself has become generally available again for a different cast.
const EVENT_COOLDOWN_EPS = 2;
const PLAYER_COOLDOWN_EPS = 3;
const PAIR_COOLDOWN_EPS = 5;

export const EVENTS = [];
const _seenIds = new Set();

/** Test-only: clear the registry between specs so one test's events cannot leak into another. */
export function _resetRegistry() {
  EVENTS.length = 0;
  _seenIds.clear();
}

/**
 * Register an event. Validates SHAPE ONLY — both weight and fire are
 * functions, the id is unique, the window is one of the seven the runner
 * knows about. It deliberately does NOT check that weight() and fire()
 * agree about eligibility: doing that here means calling fire() against
 * whatever context is convenient at import time, which writes to the live
 * season as a side effect of loading a module. See validateRegistry().
 */
export function registerEvent(def) {
  if (typeof def?.weight !== 'function') {
    throw new Error(`registerEvent(${def?.id}): weight must be a function`);
  }
  if (typeof def?.fire !== 'function') {
    throw new Error(`registerEvent(${def?.id}): fire must be a function`);
  }
  if (!def.id || _seenIds.has(def.id)) {
    throw new Error(`registerEvent: id "${def?.id}" is missing or already registered`);
  }
  if (!KNOWN_WINDOWS.has(def.window)) {
    throw new Error(`registerEvent(${def.id}): unknown window "${def.window}"`);
  }
  _seenIds.add(def.id);
  EVENTS.push(def);
  return def;
}

/**
 * Does every registered event that CLAIMS to be eligible actually fire?
 *
 * The BB Hacker lesson: an event that weights itself in and then declines to
 * do anything is content you believe is in the game and is not. It cannot be
 * checked at registration, because firing has side effects — so this runs
 * against a throwaway world and is called by a test, never by the engine.
 */
export function validateRegistry(makeCtx, rng) {
  const broken = [];
  for (const ev of EVENTS) {
    const ctx = makeCtx(ev);              // a fresh sandbox world per event
    if (ev.weight(ctx) <= 0) continue;    // not claiming eligibility: fine
    if (ev.fire(ctx, rng) == null) broken.push(ev.id);
  }
  return broken;
}

function _pairKey(actors) {
  return [...actors].sort().join('|');
}

/**
 * Is this event blocked by ANY of the three cooldown scopes right now?
 * `oncePerSeason` is a permanent block on the event scope — not time-based,
 * because there is no episode count after which a signature event is
 * allowed to happen again.
 *
 * Player scope and pair scope are checked on MUTUALLY EXCLUSIVE actor
 * counts (solo vs. two-or-more) rather than both always firing together.
 * If a two-actor scene recorded a per-player cooldown for each participant
 * as well as the pair cooldown, the player-scope entries alone would always
 * be enough to re-block the exact same pair on their own — the pair-scope
 * check would then never be the thing doing the blocking, and disabling it
 * would go unnoticed by any test built on a two-person scene. Scoping them
 * to different actor counts is what makes "pair" a real, independent guard
 * instead of a redundant restatement of "player".
 */
function _onCooldown(ev, ctx) {
  const cds = gs.tr.cooldowns;
  // An explicit ev.cooldown overrides all three scopes uniformly (author's
  // call); otherwise each scope uses its own default window (see above).
  const evWindow = ev.cooldown ?? EVENT_COOLDOWN_EPS;
  const playerWindow = ev.cooldown ?? PLAYER_COOLDOWN_EPS;
  const pairWindow = ev.cooldown ?? PAIR_COOLDOWN_EPS;

  const evLast = cds.event[ev.id];
  if (evLast != null) {
    if (ev.oncePerSeason) return true;
    if (ctx.ep - evLast < evWindow) return true;
  }

  if (ctx.actors?.length === 1) {
    const last = cds.player[`${ev.id}:${ctx.actors[0]}`];
    if (last != null && ctx.ep - last < playerWindow) return true;
  } else if (ctx.actors?.length >= 2) {
    const pairLast = cds.pair[`${ev.id}:${_pairKey(ctx.actors)}`];
    if (pairLast != null && ctx.ep - pairLast < pairWindow) return true;
  }

  return false;
}

/**
 * Raw weight(ctx), scaled by the four guards. Guards only ever multiply —
 * an event that opts out of a guard (no `acts`, not `rare`, no
 * `advancesThread`) just gets a 1x on that factor, never a penalty.
 */
function _score(ev, ctx) {
  const base = ev.weight(ctx);
  if (!(base > 0)) return 0;

  // Guard 1: continuation beats novelty. Query heatAt() directly rather than
  // treating hottest()'s non-null return as the test for continuability —
  // heat decays to zero and a thread drops out of hottest() well before it
  // closes, but reviving a cold-but-open thread ("she never let it go") is
  // still a story beat and still deserves the bonus, not just a hot one.
  let continuationMult = 1;
  if (ev.advancesThread && ctx.actors?.length) {
    const thread = findOpenThread(ev.family, ctx.actors);
    if (thread) {
      const heat = heatAt(thread, ctx.ep);
      continuationMult = 1 + CONTINUATION_BASE + heat * CONTINUATION_PER_HEAT;
    }
  }

  // Guard 2: rare-state amplification. Weighted UP when eligible, never down
  // — a `rare` event that never received the bonus would need to out-roll a
  // common event on raw weight alone, which it structurally cannot when its
  // whole design is "weight() is 0 almost always".
  const rareMult = ev.rare ? RARE_MULTIPLIER : 1;

  // Guard 4: acts. (Guard 3, cooldowns, is a hard filter in eligible(), not
  // a multiplier — a cooled-down event isn't "less likely", it's off.)
  const actMult = ev.acts?.[ctx.act] ?? 1;

  return base * continuationMult * rareMult * actMult;
}

/** Every event eligible right now: correct window, weight() > 0, no cooldown block. Scored. */
export function eligible(ctx) {
  const out = [];
  for (const ev of EVENTS) {
    if (ev.window !== ctx.window) continue;
    if (_onCooldown(ev, ctx)) continue;
    const score = _score(ev, ctx);
    if (score > 0) out.push({ ...ev, score });
  }
  return out;
}

/**
 * Weighted-random pick among eligible events, recording all three cooldown
 * scopes and firing the winner. Returns null when nothing is eligible.
 */
export function pickEvent(ctx, rng) {
  const scored = eligible(ctx);
  if (!scored.length) return null;

  const total = scored.reduce((s, e) => s + e.score, 0);
  let roll = rng() * total;
  let chosen = scored[scored.length - 1];
  for (const ev of scored) {
    roll -= ev.score;
    if (roll <= 0) { chosen = ev; break; }
  }

  const cds = gs.tr.cooldowns;
  cds.event[chosen.id] = ctx.ep;
  if (ctx.actors?.length === 1) {
    cds.player[`${chosen.id}:${ctx.actors[0]}`] = ctx.ep;
  } else if (ctx.actors?.length >= 2) {
    cds.pair[`${chosen.id}:${_pairKey(ctx.actors)}`] = ctx.ep;
  }

  const consequences = chosen.fire(ctx, rng);
  return { event: chosen, consequences };
}
