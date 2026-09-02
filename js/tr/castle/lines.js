// ══════════════════════════════════════════════════════════════════════
// tr/castle/lines.js — line pools chosen WITHOUT touching the rng
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS EXISTS. Half the castle pool wrote a constant: one sentence per
// event, printed with different names in it. `susp-misread-tell` put its one
// line in episodes 1, 4, 8 and 10 of the same castle. A season whose stories
// accumulate correctly still reads as repetitive if the sentences are
// identical, and repetition is the defect the reader actually notices.
//
// WHY IT IS NOT JUST `pick(rng, POOL)`. `fire(ctx, rng)` is handed the SAME
// castle rng stream that drives `_sceneActors` and `pickEvent`
// (js/tr/events.js). One extra draw inside one `fire()` shifts every draw
// after it, so a purely cosmetic edit reroutes the whole season. Measured on
// one event given a four-line pool: firings 19015 -> 18459 (-2.9%), 38 of 41
// low-count branches moved, and one branch fell below the branch floor. Doing
// that to forty-odd events at once would be a pool-wide redistribution
// wearing the clothes of a text change.
//
// So the line is chosen by HASHING state the event already has — its id, its
// branch, the episode, the people in the scene. That is:
//   - varied       (a different pair, or a different night, gets a different
//                   sentence; the same pair on the same night is the same
//                   scene and should read the same way)
//   - reproducible (same seed in, same prose out — the replay guards hold)
//   - free         (it consumes no rng draw, so the firing tables are
//                   bit-identical before and after)
//
// THE OTHER FREE ROUTE, and the preferred one where it is available: an event
// that ALREADY calls `pick(rng, POOL)` can have variants added to that pool
// at no cost, because `pick` draws once regardless of how long the array is.
// Use that when the event has a pool; use `lineFor` when it has none.

import { gs } from '../../core.js';

/**
 * FNV-1a. Small, stable across runs and platforms, and no dependency.
 *
 * NO FINALISER, AND THAT IS MEASURED RATHER THAN INHERITED. Raw FNV-1a puts
 * two keys differing only in their last character about 1/256 of the range
 * apart, which destroys any choice taken off the TOP bits. `lineFor` does not
 * take one: it uses `h % pool.length`, and `%` is immune, because the gap is
 * (delta * 16777619) and 16777619 is prime -- a family of keys ending in
 * 0,1,2... walks every slot exactly once before any of them repeats, which is
 * strictly better than a coin at not repeating.
 *
 * Measured over 4,200 seasons, which is the sample tests/tr-castle-prose.js
 * uses for the same statistic: seasons printing one sentence three times sit
 * at 1.60% as this stands, and at 1.86% with a MurmurHash3 finaliser added
 * here. The finaliser is worse. Plan 5's 1.54% was not measured on a system
 * that was quietly less varied than it looked.
 *
 * `js/vp-tr/confessionals.js` carries a finaliser for the opposite reason and
 * says so at length: it indexes off the top bits, so it needs one.
 */
function _hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// ── AND WHY THE HASH IS ONLY THE STARTING POINT (Task 7 stage 6) ──────
//
// THE MEASUREMENT. tests/tr-castle-prose.test.js asks how often a SEASON
// prints one sentence three times. Stage 6's writing took that from 25.50% to
// 9.38% — 65 events rewritten from one or two branches to four or five, and
// forty-odd line pools widened — and then it stopped falling, because what is
// left is not a defect in any one pool. It is the birthday problem over the
// whole library: a season now runs ~27 castle scenes an episode over eleven
// episodes, and with a median pool of eight a hash that picks INDEPENDENTLY
// each time will land on the same element three times somewhere, in about one
// season in ten, however good the writing is. Getting to the 4% band by pool
// width alone needs every pool at roughly sixteen lines, which is another
// two thousand sentences and buys nothing a reader would notice.
//
// THE FIX IS THE ONE THE SCREEN LAYER ALREADY USES, and it is a rule about
// drawing rather than a rule about writing. `_pickUnique` in
// js/vp-tr/castle-day.js walks to the next UNUSED element of a pool and
// round-robins once the pool is exhausted, and its own docblock says why:
// "a pool of three read four times in one evening prints one of them twice,
// and a reader notices that immediately... the hash fallback let a busy day
// draw the same line a third time while three others sat unused". That is
// exactly this problem one layer up, and the same answer works here.
//
// SO: the hash still chooses WHERE IN THE POOL to start — which is what keeps
// a different pair, or a different night, reading differently — and then the
// draw walks forward past elements this (event, branch) has already used in
// this season. When the pool is exhausted the record for that bucket clears
// and it starts again, so a branch that fires more often than its pool is
// wide round-robins instead of colliding by chance.
//
// FOUR PROPERTIES, and they are the reason this is not a metric dodge:
//
//   - IT CONSUMES NO RNG. Same as before: the walk is over the pool, not over
//     the stream. The firing tables are bit-identical, no murder, ballot or
//     mission draw moves, and the seeded replay guards hold.
//   - IT IS DETERMINISTIC. The usage record lives on `gs.tr`, is written in
//     scene order, and both the engine and the transcript walk the scenes in
//     that order — so the same seed produces the same prose, which is what
//     the replay guards actually assert.
//   - IT IS PER SEASON, NOT PER PROCESS. The store is on the season's own
//     state and dies with it, so two seasons played back to back do not
//     inherit each other's usage.
//   - IT CANNOT HIDE A THIN POOL. A one-line pool still prints one line every
//     time, and tests/tr-castle-prose.test.js's variety floor still counts the
//     DISTINCT sentences a branch produced across the whole corpus. This
//     changes the ORDER a pool is spent in, never its contents.
//
// The bucket key deliberately strips digits, so `event|branch|ep` and
// `event|ep|branch` (both orderings exist in the pool) collapse to the same
// (event, branch) bucket — which is the same key the prose suite's `mask()`
// measures, so the thing being deduplicated is exactly the thing being counted.

/**
 * Per-season record of which pool slots an (event, branch) has already spent,
 * as a BITMASK rather than a list.
 *
 * A plain number, so the store stays JSON-serialisable (it rides on `gs.tr`
 * and has to survive `prepGsForSave`), stays small — one integer per (event,
 * branch) rather than a growing array — and, the reason it is not a list, the
 * membership test is a single `&` instead of an `includes` scan. The list
 * version was O(pool^2) per draw and pushed the 1,600-season branch sweep in
 * tests/tr-castle-reachability.test.js past its own timeout.
 *
 * Pools wider than 31 lines fall back to the plain hash (see `lineFor`),
 * because a 32-bit mask cannot index them and a pool that wide does not need
 * the help.
 */
function _maskStore() {
  const tr = gs && gs.tr;
  if (!tr) return null;               // probe harnesses hand-build a ctx with no season
  if (!tr._lineUsed) tr._lineUsed = {};
  return tr._lineUsed;
}

/**
 * One line out of `pool`, chosen deterministically from `key` and the
 * substitution values, with `{name}` placeholders filled from `subs`.
 *
 * `key` should name the event and the branch; the caller adds whatever else
 * varies (episode, act, a count). The subs values join the key automatically,
 * so the people in the scene vary the sentence without the caller repeating
 * them.
 *
 *   lineFor(MISREAD_LINES, `susp-misread-tell|${ctx.ep}`, { a, b })
 *
 * Consumes no rng. That is the whole point — see the header.
 */
export function lineFor(pool, key, subs) {
  const vals = subs ? Object.values(subs) : [];
  const h = _hash([key, ...vals].join('|'));
  const n = pool.length;
  let idx = h % n;
  // WALK PAST WHAT THIS BRANCH HAS ALREADY SPENT THIS SEASON. See the long
  // note above: the hash still picks the starting point, so the variation the
  // hash was for is unchanged; this only stops a busy season landing on the
  // same element twice while others sit unused.
  const store = _maskStore();
  if (store && n > 1 && n <= 31) {
    const bucket = String(key).replace(/\d+/g, '');
    let mask = store[bucket] || 0;
    let step = 0;
    while (step < n && (mask & (1 << ((idx + step) % n)))) step++;
    if (step >= n) { mask = 0; step = 0; }          // exhausted: round-robin
    idx = (idx + step) % n;
    store[bucket] = mask | (1 << idx);
  }
  let s = pool[idx];
  if (subs) {
    for (const k of Object.keys(subs)) s = s.split('{' + k + '}').join(subs[k]);
  }
  return s;
}

/** Exposed for the guard, which walks every pool in the pool. */
export { _hash as _lineHash };
