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
import { findOpenThread, heatAt, openThreads, actFor } from './threads.js';
import { applyEventCrowd } from './crowd.js';
import { weightedPick } from '../event-scheduler.js';

/** Windows a round is built from (spec §5.6) — registerEvent rejects any other. */
export const KNOWN_WINDOWS = new Set([
  'dawn', 'morning', 'journey-out', 'journey-back', 'evening', 'after-table', 'night',
]);

// Guard tuning. Named constants, not magic numbers scattered through _score,
// so a reviewer mutating "the continuation guard" knows exactly which knob
// that is.
// Raised from 1/0.5 in Plan 5 Task 1 round 2, after the two levers were swept
// JOINTLY rather than one at a time. On its own this knob is nearly inert on
// thread health — at scene P 0.35, tripling it moves the guard's conditional
// rate 30.2% -> 36.1% (+20% relative) and the mean thread only 1.397 -> 1.431
// beats (+2.4%). It is kept at 3x anyway because it is FREE: people coverage,
// max-single-pair share, every deduction band and the repetition audit are all
// unmoved, and it buys +29% on the payoff rate (3.08% -> 3.96%), which is the
// metric Tasks 2-5 actually need since residue can only be cited by a thread
// that reaches one.
//
// WHY IT IS NEARLY INERT, MEASURED, because the answer is the next
// bottleneck and not a property of this constant: in HALF of all scenes whose
// actors already share a live thread, there is no eligible event that could
// advance it at all — 49.0% at these shipped 3/1.5 constants, 49.9% at the
// old 1/0.5. The guard is a multiplier on a set that is empty half the time.
// Where an advancer IS available the guard is doing real work — 60.6% of those
// scenes continue at 1/0.5 and 73.8% at 3/1.5.
//
// THE "POOL COVERAGE IS THE CEILING" CLAIM THAT USED TO END THIS PARAGRAPH IS
// WITHDRAWN, and the counts it quoted are stale twice over. Plan 5's second
// amendment proved `advancesThread` is a DECLARATION, not a capability:
// `openThread` folds a firing into an open thread of the same kind and
// parties whether or not anything is declared, and with guard 1 flattened,
// seasons before and after a re-declaration pass are bit-identical. What
// actually gates a continuation is family-matching plus the 5-episode pair
// cooldown. The live pool shape, pinned in tr-castle-reachability.test.js, is
// now 98 events, 39 of them advancers, over 45 non-empty (family x window)
// cells: 18 hold none, 17 hold exactly one, 10 hold two or more. That table is
// a ledger for catching silent drift, not a quality bar to be maximised. See
// the note above the bands in tr-calibration.test.js.
const CONTINUATION_BASE = 3;
const CONTINUATION_PER_HEAT = 1.5;
const RARE_MULTIPLIER = 2;         // amplify UP when a rare precondition clears, never down

// How often a scene is convened BECAUSE a story is live, rather than by a
// uniform draw over the cast. Tuned in Plan 5 Task 1 against a
// CONTINUATION_SCENE_P = 0 control arm; see the joint grid in
// tr-calibration.test.js. Zero is the control (pure uniform selection, the
// pre-Plan-5 engine); one would let live threads monopolise every scene and
// freeze most of the cast out of the season, which the coverage band catches.
//
// 0.35 is where the cast-coverage budget binds, not where thread health stops
// improving: 0.5 would buy 1.6 beats but costs 16.7% of the people who appear
// in a scene at all and puts 23.4% of a season's scenes on one single pair.
export const CONTINUATION_SCENE_P = 0.35;
let _contSceneP = CONTINUATION_SCENE_P;

/**
 * Test-only seam, the same contract as `_setContinuationGuard`: an exported
 * const cannot be zeroed by a control arm, and a band whose control cannot be
 * built is not a measurement. Returns a restore function — call it in a
 * `finally`, or every measurement that runs afterwards is silently retuned.
 */
export function _setContinuationSceneP(p = CONTINUATION_SCENE_P) {
  const prev = _contSceneP;
  _contSceneP = p;
  return () => { _contSceneP = prev; };
}

// The live values `_score` reads. They are variables and not the constants
// above for exactly one reason: the continuity band in tr-calibration.test.js
// asserts that the continuation guard is doing something, and a band that
// cannot be shown to go red when the thing it guards is switched off is not a
// measurement — it is the eleventh unfailable guard in this project. The
// control arm needs the multiplier flattened to 1, and flattening it requires
// a seam. Nothing in the show may ever call this; it is the same contract as
// `_resetRegistry` and as `evidence` in playTraitorsSeason.
let _contBase = CONTINUATION_BASE;
let _contPerHeat = CONTINUATION_PER_HEAT;

/**
 * Test-only: retune (or disable) guard 1. Returns a restore function — call it
 * in a `finally`, because leaving the guard flattened would silently change
 * every other measurement in the file that runs after.
 */
export function _setContinuationGuard({ base = CONTINUATION_BASE, perHeat = CONTINUATION_PER_HEAT } = {}) {
  const prevBase = _contBase, prevPerHeat = _contPerHeat;
  _contBase = base; _contPerHeat = perHeat;
  return () => { _contBase = prevBase; _contPerHeat = prevPerHeat; };
}

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
 * The people an event's own result says the scene was about.
 *
 * Read off the result rather than off `ctx.actors` because thirteen events
 * narrate a thread's parties instead of the convened pair — see the note in
 * `pickEvent`. Unknown shapes yield nothing, which degrades to the old
 * behaviour rather than to a wrong key.
 *
 * EXPORTED because the episode record needs the same answer. `_recordEpisode`
 * (js/tr/headless.js) snapshots the day's scenes for the Castle Day screen,
 * and the observer contract on that screen turns on WHO WAS IN THE SCENE — a
 * second derivation of that question in the recorder would drift from the one
 * the cooldowns key on the first time an event returns a new field shape.
 */
export function sceneParticipants(res) {
  const out = new Set();
  for (const k of ['pair', 'actors', 'parties']) {
    if (Array.isArray(res?.[k])) for (const n of res[k]) if (typeof n === 'string') out.add(n);
  }
  for (const k of ['actor', 'doubter', 'suspected', 'onTheSpot']) {
    if (typeof res?.[k] === 'string') out.add(res[k]);
  }
  return [...out];
}

/**
 * Is this event blocked by ANY of the three cooldown scopes right now?
 * `oncePerSeason` is a permanent block on the event scope — not time-based,
 * because there is no episode count after which a signature event is
 * allowed to happen again.
 *
 * Player scope checks EVERY actor named in the scene, regardless of how many
 * there are — a two-actor scene still writes (and checks) a per-player
 * cooldown for each participant. Earlier this scope and pair scope were
 * mutually exclusive by actor count (solo vs. two-or-more), on the theory
 * that a two-actor scene's per-player entries would otherwise always be
 * enough to re-block the exact same pair on their own, making the
 * pair-scope check untestable dead weight. That theory was correct but the
 * fix was wrong: exclusivity also meant a single player could run the same
 * event with a NEW partner every episode and player scope would never see
 * them, because a multi-actor scene never wrote to it — exactly the
 * "same person, same beat, over and over" player scope exists to catch.
 * The unequal durations below (2/3/5) already isolate each scope for
 * mutation testing without needing exclusivity: at an episode gap of 3-4,
 * event scope has lapsed and player scope has too, but pair scope still
 * holds, and a lapsed player scope with a live pair scope (or vice versa)
 * is reachable by picking the gap between their two window sizes.
 */
function _onCooldown(ev, ctx) {
  const cds = gs.tr.cooldowns;
  // An explicit ev.cooldown is a PARTIAL { event?, player?, pair? } so an
  // author can tune one scope without flattening the other two to the same
  // value — a scalar override would collapse 2/3/5 back to one duration and
  // reintroduce the exact masking (event scope always explains the result)
  // that unequal defaults exist to prevent.
  const evWindow = ev.cooldown?.event ?? EVENT_COOLDOWN_EPS;
  const playerWindow = ev.cooldown?.player ?? PLAYER_COOLDOWN_EPS;
  const pairWindow = ev.cooldown?.pair ?? PAIR_COOLDOWN_EPS;

  const evLast = cds.event[ev.id];
  if (evLast != null) {
    if (ev.oncePerSeason) return true;
    if (ctx.ep - evLast < evWindow) return true;
  }

  if (ctx.actors?.length) {
    for (const p of ctx.actors) {
      const last = cds.player[`${ev.id}:${p}`];
      if (last != null && ctx.ep - last < playerWindow) return true;
    }
  }
  if (ctx.actors?.length >= 2) {
    const pairLast = cds.pair[`${ev.id}:${_pairKey(ctx.actors)}`];
    if (pairLast != null && ctx.ep - pairLast < pairWindow) return true;
  }

  return false;
}

/**
 * The thread this event would actually continue, if any.
 *
 * WHY THIS IS NOT JUST `findOpenThread(ev.family, ctx.actors)` (review round 3,
 * R6). A handful of cover events keep a thread on ONE person — a cover story is
 * personal, and `cover-preemptive-alibi`, `cover-feign-fear`,
 * `cover-rehearsed-story-advance` and `cover-alibi-crumbles` all open and
 * advance on `[actor]`. Keyed on the full scene, the lookup misses that thread
 * whenever the scene happens to hold two people, so guard 1 declined to
 * multiply a firing that really was a continuation and `pickEvent` labelled it
 * a fresh beat. The declaration was live in a solo scene and inert in a pair
 * one, for no reason a reader of the event could see.
 *
 * `threadScope: 'solo'` says so out loud. It is deliberately NOT the default:
 * letting every event fall back to a per-actor lookup would boost a suspicion
 * event drawn on A and B because A has an open suspicion with somebody else
 * entirely, which is a different story and not a continuation of anything.
 */
function _threadThisEventWouldAdvance(ev, ctx) {
  if (ev.threadScope === 'solo') {
    let best = null;
    for (const p of ctx.actors) {
      const t = findOpenThread(ev.family, [p]);
      if (t && (!best || heatAt(t, ctx.ep) > heatAt(best, ctx.ep))) best = t;
    }
    return best;
  }
  return findOpenThread(ev.family, ctx.actors);
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
    const thread = _threadThisEventWouldAdvance(ev, ctx);
    if (thread) {
      const heat = heatAt(thread, ctx.ep);
      continuationMult = 1 + _contBase + heat * _contPerHeat;
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

  // The weighted-random draw itself — one rng() call, proportional to score
  // — is the exact same primitive Big Brother's house scheduler uses to pick
  // a beat (js/event-scheduler.js). Shared here rather than duplicated so the
  // two formats' selection math cannot silently drift apart; everything
  // AROUND the draw (guards, cooldown scopes, thread continuation) stays
  // here because it needs Traitors vocabulary the kernel does not know.
  const chosen = weightedPick(scored, rng, e => e.score) || scored.at(-1);

  const cds = gs.tr.cooldowns;
  cds.event[chosen.id] = ctx.ep;
  if (ctx.actors?.length) {
    for (const p of ctx.actors) {
      cds.player[`${chosen.id}:${p}`] = ctx.ep;
    }
  }
  if (ctx.actors?.length >= 2) {
    cds.pair[`${chosen.id}:${_pairKey(ctx.actors)}`] = ctx.ep;
  }

  // WHAT THE CONTINUATION GUARD ACTUALLY DID, SAMPLED BEFORE fire() RUNS.
  //
  // Both flags are HARNESS DATA — nothing in the engine reads them — and both
  // must be read here rather than reconstructed afterwards, because fire()
  // opens, advances and closes threads, so a scene that HAD a live story
  // before the draw is indistinguishable from one that was just given one.
  //
  //   liveThread — these exact actors already had an open thread with somebody
  //                (any family). This is the conditioning set: the guard can
  //                only ever act on a scene where there is something to
  //                continue, so it is the only population in which its effect
  //                is visible at all.
  //   continued  — the event the draw actually landed on is one that advances
  //                a thread these actors already had. This is the plan's
  //                central claim, stated as an observable.
  //
  // The unconditional "what share of beats were advances" is NOT that claim
  // and must not be banded as if it were: it is dominated by the runner
  // re-drawing the same pair by chance and openThread folding the second
  // scene into the first thread, which happens at very nearly the same rate
  // with the guard switched off. See the band in tr-calibration.test.js.
  const liveThread = ctx.actors?.length
    ? (gs.tr.threads || []).some(t => t.state === 'open'
        && _pairKey(t.parties) === _pairKey(ctx.actors))
    : false;
  const continued = !!(chosen.advancesThread && ctx.actors?.length
    && _threadThisEventWouldAdvance(chosen, ctx));

  const consequences = chosen.fire(ctx, rng);

  // ── WHO WAS ACTUALLY IN THE SCENE (whole-plan review, F4) ──────────────
  //
  // The three cooldown scopes above key on `ctx.actors`, the people the scene
  // sampler CONVENED. For most of the pool those are the people the event
  // writes about, and the keys are right. For thirteen events they are not:
  // `_threadForActors` (js/tr/castle/romance.js, and trust.js's twin) matches
  // a thread on ANY convened actor and then narrates the thread's own parties,
  // so a scene drawn as (Chef Hatchet + Amy) prints "Beardo and Amy" — and
  // Beardo, the person the scene is about, took no cooldown at all. The same
  // couple could then be run through the same event again next episode behind
  // a different third party, indefinitely, because nothing the check looks at
  // had ever recorded them.
  //
  // So the participants an event REPORTS are keyed too. That is not a second
  // guess at who was in the room: `pair`/`actors`/`actor` are the fields the
  // events already return to say who the sentence was about, and the shape is
  // pinned by tr-castle.test.js. The convened actors keep their keys as well —
  // a draw was spent on them either way — so this can only ever ADD protection.
  //
  // WHAT IT DOES NOT FIX, said plainly: the outsider is still convened for a
  // story they have no part of. The predicate fix that would end that
  // (`some` -> `every`) costs 73% of the romance family's reach and pushes
  // `romance-liability-exposed` under the branch floor; measured, rejected,
  // and written up over `_threadForActors`.
  for (const p of sceneParticipants(consequences)) {
    if (ctx.actors?.includes(p)) continue;
    cds.player[`${chosen.id}:${p}`] = ctx.ep;
  }
  const wrote = sceneParticipants(consequences);
  if (wrote.length >= 2) cds.pair[`${chosen.id}:${_pairKey(wrote)}`] = ctx.ep;

  // WHAT THE COUNTRY MADE OF IT (spec 10.4). Declared on the consequences by
  // the event itself — `crowd: { name, colour }` — because the event is the
  // only thing that knows which branch it took and who it was about, and
  // derived from the family or the bond delta it would be a guess. Applied
  // here so no event author ever touches either ledger directly, and it
  // takes no rng draw, so a season with the ledgers in it is bit-identical to
  // one without. See js/tr/crowd.js.
  const crowd = applyEventCrowd(consequences, ctx.ep);

  // `actors` is harness data too — nothing in the engine reads it. The
  // coverage band needs to count DISTINCT pairs convened per season, and after
  // fire() has run there is no way to recover who was in the room.
  return { event: chosen, consequences, liveThread, continued, crowd,
    actors: [...(ctx.actors || [])] };
}

// ── The runner: seven social windows around four mechanical beats (§5.6) ──
//
// BUDGET RULE. A round produces 4-8 castle events TOTAL, spread across its
// seven windows, not 4-8 PER window. The total is a per-ROUND budget, drawn
// once from a stream that is NOT the game's own rng (see the note on the
// caller in headless.js) so replay stays exact and content changes cannot
// perturb the murder/vote/ballot draws.
//
// PER-WINDOW CAP: FAIR SHARE, NOT A FLAT NUMBER. A flat cap (e.g. "3 per
// window") is first-come-first-served against a shared pot: with a round
// total of 5 and a flat cap of 3, dawn takes 3, morning takes the remaining
// 2, and the five windows after morning — including evening, where vote
// pitches live and feed the Round Table — see zero, every single round that
// draws a low total, because dawn and morning always go first. That is not
// a hypothetical; it is what a flat cap of 3 measurably does.
//
// Instead each call caps itself at ceil(remaining / windowsLeft), where
// windowsLeft counts the window making this call. That reserves an even
// split of whatever is left for whatever hasn't run yet, so an early window
// can never spend more than its fair share of the pot before later windows
// get a turn — it self-corrects, too: if dawn's own eligible pool is thin
// and it draws less than its share, the leftover rolls forward into a
// larger fair share for everyone still to come, not back to dawn. Only the
// tightest possible round (total 4, the minimum, spread over 7 windows)
// still runs out before the last few windows get a turn — that is the
// budget being small, not the rule being unfair, and it happens on a
// minority of rounds since the total is redrawn 4-8 every round.
const ROUND_BUDGET_MIN = 4;
const ROUND_BUDGET_MAX = 8; // inclusive

/**
 * ep -> act, the same three-band split every event's `acts` multiplier reads.
 * Delegates to threads.js so a thread's stamped `act` and a ctx's `act` can
 * never disagree about where episode 4 sits.
 */
function _actFor(ep) {
  return actFor(ep);
}

// ══════════════════════════════════════════════════════════════════════
// SPEC CONFORMANCE: §5.3's `ctx` NAMES SIX THINGS AND CARRIES ONE
// ══════════════════════════════════════════════════════════════════════
//
// Written down because §5.3 currently READS as satisfied and is not (whole-plan
// review, F8). The spec says `ctx` carries role, position, bond, stats, state
// and history. The object built below is
//   { ep, window, act, living, actors, state }
// — `state` is the only one of the six on it.
//
// THE INTENT IS MET AND THE LETTER IS NOT, and the difference matters to
// whoever reads §5.3 next. The other five are reachable from inside `weight()`
// and `fire()` by direct import, and every one of them is used that way today:
// role via `alignmentAt` (js/tr/roles.js, and ONLY for the acting player's own
// role — probes A/B/C in tests/tr-castle.test.js enforce that), bond via
// `getBond`, stats via `pStats`, history via `activeSeasons` and the thread
// store, position via `gs.tr.rounds` and `ctx.living`. Copying them onto `ctx`
// would buy nothing but a second place for each to be wrong.
//
// `state` is on `ctx` for a reason the others do not have: it is DERIVED and
// FROZEN. `emotionalStateOf` reads the last round's public ballots and
// accusations, and freezing the map is what stops a castle event writing what
// the room remembers about the last vote through a side door — a channel the
// belief gate does not watch, because it watches `learn()`.

// ── EMOTIONAL STATE (spec 5.3) ────────────────────────────────────────────
//
// `ctx` is specified to carry state, "emotional - `paranoid` and `desperate`
// already exist and knowledge.js already reads them", and no castle event read
// it. The vocabulary is shared with js/knowledge.js's spreadRate() and
// js/players.js's getPlayerState() on purpose; the SOURCE is not.
//
// WHY THIS DOES NOT READ gs.playerStates. That store is written by the Total
// Drama episode loop (js/bonds.js flips a player to 'desperate' or 'paranoid'
// there). A Traitors season is built by playTraitorsSeason, which creates a
// `gs` holding bonds and activePlayers and nothing else, so every read of it
// would return the default 'content' forever - a branch that exists, looks
// live, and is unreachable, which is the one failure mode this project's
// sweeps exist to catch. So state is DERIVED from what the castle actually
// knows about a person, and it is derived from PUBLIC facts only: the ballots
// and the accusations of the last Round Table, which everybody in the room
// watched happen. No alignment, no belief, no ground truth.
//
// THRESHOLDS, MEASURED over 200 seasons rather than guessed. Per actor-slot in
// a scene: taking 3+ votes and still being here reads at 3.5%, taking any vote
// at all reads at 35%. Naming alone is nearly useless as a signal - debate()
// has every speaker name their top read, so in a room of nineteen almost
// everybody is named by somebody - which is why one accuser is not enough and
// two is the bar.
const DESPERATE_VOTE_SHARE = 0.4;
const PARANOID_ACCUSER_SHARE = 0.25;

/**
 * How this person is holding up, as of the last Round Table that has happened.
 *
 * "The last table that has happened" is literally the last recorded round, and
 * that is correct for every window without a special case. FIVE windows run
 * BEFORE runRoundTable pushes this episode's round - dawn, morning, the two
 * journey windows and EVENING (headless.js runs evening immediately before the
 * table, which is the point of it: vote pitches live there) - so all five see
 * episode-1. after-table and night run after it and see this one. That is
 * exactly the state each of those windows is about.
 *
 * ── REVOTES ARE DELIBERATELY NOT COUNTED ──
 *
 * Only `round.ballots` is read. `round.revotes` (roundtable.js) holds the
 * tie-break rounds, and a vote cast there is NOT on the same scale as a
 * first-round vote: the electorate is the room MINUS the tied players and the
 * slate is only the tied players, so it concentrates votes by construction.
 * First-ballot pressure is instead measured as a share of that ballot's room:
 * three votes early can be attention while two of five late is desperation.
 * Accusations use the same proportional rule but retain the two-accuser floor,
 * because one person naming somebody is ordinary debate noise.
 */
export function emotionalStateOf(name) {
  const rounds = gs.tr?.rounds || [];
  const last = rounds[rounds.length - 1];
  if (!last) return 'content';
  let votes = 0;
  for (const b of (last.ballots || [])) if (b.voted === name) votes++;
  const voteShare = votes / Math.max(1, (last.ballots || []).length);
  if (voteShare >= DESPERATE_VOTE_SHARE) return 'desperate';
  let accusers = 0;
  for (const a of (last.accusations || [])) if (a.target === name) accusers++;
  const accuserShare = accusers / Math.max(1, (last.accusations || []).length);
  if (votes >= 1 || (accusers >= 2 && accuserShare >= PARANOID_ACCUSER_SHARE)) return 'paranoid';
  return 'content';
}

/** Either of the two states spec 5.3 names, as one question most events ask. */
export function isNervy(state) { return state === 'paranoid' || state === 'desperate'; }

/**
 * The scene's state map, FROZEN.
 *
 * Castle events read `ctx.state` and must never write it: it is a derived view
 * of the round record, so a write would be a castle event editing what the room
 * remembers about the last vote through a side door - and the belief gate
 * (tr-castle-belief-gate.test.js) watches learn(), not this. Module code is
 * strict, so an assignment throws rather than being quietly dropped, and
 * tr-castle.test.js runs every registered event's fire() against a frozen map
 * as a rule over the whole pool.
 */
function _stateFor(actors) {
  const out = {};
  for (const n of (actors || [])) out[n] = emotionalStateOf(n);
  return Object.freeze(out);
}

/**
 * Draw and install this round's total castle-event budget on `gs.tr`, so
 * every window called during the round (a sequence of separate runWindow
 * calls from headless.js, not one function) shares and depletes the same
 * pot. `windowCount` is how many runWindow calls this round will make (5 on
 * round one, which has no Round Table; 7 every round after) — it is what
 * lets the fair-share cap in runWindow divide what's left evenly over what's
 * actually still coming, rather than assuming seven every time.
 *
 * Drawn from whatever `rng` the caller passes — headless.js passes its own
 * hashed castle-layer stream, never the game's rng directly. See the note
 * there for why the two must never be the same stream.
 */
export function startRoundBudget(rng, windowCount = 7) {
  const total = ROUND_BUDGET_MIN + Math.floor(rng() * (ROUND_BUDGET_MAX - ROUND_BUDGET_MIN + 1));
  gs.tr.roundBudget = { total, used: 0, windowsLeft: windowCount };
  return gs.tr.roundBudget;
}

/**
 * A scene: who is actually present for whatever this draw turns out to be.
 * Solo about 40% of the time, a pair otherwise (when there are at least two
 * living players) — chosen fresh per draw, not once for the whole window,
 * because two draws in the same window are two different moments, not one.
 * This is what puts real names on `ctx.actors` so the cooldown scopes in
 * `pickEvent` (event/player/PAIR) actually have something to key on when
 * they run through the real runner, instead of only ever being exercised by
 * a test that hands pickEvent a hand-built ctx directly.
 */
export function _sceneActors(living, rng, ep) {
  if (!living.length) return [];

  // THE BIAS THAT MAKES STORIES ACCUMULATE. Uniform selection is why threads
  // died: with ~18 alive and a 60% pair draw, one specific pair reconvenes at
  // 0.6 * 2/(18*17) ~= 0.4% a draw. The continuation guard in pickEvent scores
  // continuation correctly and was simply never asked, because nothing ever
  // convened a scene BECAUSE a story was live. This is a BIAS and not a rule:
  // the rest of the time selection is the untouched uniform draw, or no new
  // thread would ever open and the season would be one storyline.
  //
  // Threads with a dead party are skipped rather than reconvened with whoever
  // is left — a scene is the PARTIES of the story, and half of one is a
  // different story.
  const alive = new Set(living);
  const live = openThreads(ep).filter(t => t.parties.length && t.parties.every(p => alive.has(p)));
  if (live.length && rng() < _contSceneP) {
    // Heat-weighted, NOT max-heat: the hottest storyline must not monopolise
    // the season, which is the failure mode the coverage band guards. The 0.15
    // floor is what keeps a cold-but-open thread revivable — the same "she
    // never let it go" case findOpenThread's parties-keyed lookup exists for.
    const total = live.reduce((s, t) => s + Math.max(0.15, heatAt(t, ep)), 0);
    let roll = rng() * total;
    let chosen = live[live.length - 1];
    for (const t of live) { roll -= Math.max(0.15, heatAt(t, ep)); if (roll <= 0) { chosen = t; break; } }
    return [...chosen.parties];
  }

  const i = Math.floor(rng() * living.length);
  if (living.length < 2 || rng() < 0.4) return [living[i]];
  let j = Math.floor(rng() * living.length);
  while (j === i) j = Math.floor(rng() * living.length);
  return [living[i], living[j]];
}

/**
 * Fire whatever this window has to offer, until its own fair-share cap or
 * the round's shared budget runs out, or nothing is left eligible. Returns
 * the fired events (each `{ event, consequences }`, as pickEvent returns) so
 * the caller can log them — the budget itself is observable on
 * `gs.tr.roundBudget` for the calibration to measure later, rather than
 * only in this return value.
 *
 * No castle events are registered yet (that is Tasks 5 and 6), so in a real
 * season this runs five or seven times a round and returns `[]` every time.
 * That is expected: the point of this task is the plumbing running cleanly
 * with an empty pool, not a season that already has content.
 */
export function runWindow(window, ep, rng) {
  const fired = [];
  const budget = gs.tr.roundBudget;
  if (!budget) return fired; // no round in progress: nothing to spend
  const living = gs.activePlayers || [];
  const act = _actFor(ep);

  const remaining = budget.total - budget.used;
  const windowsLeft = Math.max(1, budget.windowsLeft ?? 1);
  const cap = Math.max(1, Math.ceil(remaining / windowsLeft));
  budget.windowsLeft = Math.max(0, (budget.windowsLeft ?? windowsLeft) - 1);

  let drawnHere = 0;
  while (drawnHere < cap && budget.used < budget.total) {
    // A fresh ctx (and fresh actors) per draw, not one shared ctx for the
    // whole window — see _sceneActors.
    const actors = _sceneActors(living, rng, ep);
    const ctx = { ep, window, act, living, actors, state: _stateFor(actors) };
    const result = pickEvent(ctx, rng);
    if (!result) break; // nothing eligible left for this window right now
    fired.push(result);
    budget.used++;
    drawnHere++;
  }
  return fired;
}
