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
  let s = pool[h % pool.length];
  if (subs) {
    for (const k of Object.keys(subs)) s = s.split('{' + k + '}').join(subs[k]);
  }
  return s;
}

/** Exposed for the guard, which walks every pool in the pool. */
export { _hash as _lineHash };
