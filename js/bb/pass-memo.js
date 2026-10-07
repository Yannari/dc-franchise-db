// ══════════════════════════════════════════════════════════════════════
// bb/pass-memo.js — remember a read for one scoring pass, and no longer
// ══════════════════════════════════════════════════════════════════════
//
// A profile of a played season (2026-10-07: "can the episode generation be quicker without losing
// anything?"): 85% of the time went to the house-event scheduler scoring every event before each
// beat, and most of that to the same few reads asked again by event after event: the threat
// profile, a pair's relationship profile, who grates on whom, the screen-time order. While the
// events are being SCORED nothing in the world changes (only firing one does), so a read asked
// twice in one pass has the same answer. This remembers it for that pass only.
//
// The scheduler opens a pass before it scores and closes it before it fires anything
// (house-events.js scheduleHouseBeats); outside a pass every wrapped function runs as before. A
// seeded season is held byte-for-byte to the same result (tools: fingerprint in the commit).

let active = false;
let epoch = 0;

/** Open (true) or close (false) a scoring pass. Every call starts a new pass: nothing carries over. */
export function scoringPass(on) {
  active = !!on;
  epoch++;
}

/**
 * Wrap a pure read. `keyOf(...args)` names the call; `copy(value)` hands each caller its own copy
 * when the value is something a caller could change (an array it might sort).
 */
export function passMemo(fn, keyOf, copy = null) {
  const cache = new Map();
  let at = -1;
  return function memoised(...args) {
    if (!active) return fn.apply(this, args);
    if (at !== epoch) { cache.clear(); at = epoch; }
    const k = keyOf(...args);
    if (cache.has(k)) { const v = cache.get(k); return copy ? copy(v) : v; }
    const v = fn.apply(this, args);
    cache.set(k, v);
    return copy ? copy(v) : v;
  };
}
