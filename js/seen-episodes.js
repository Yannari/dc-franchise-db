// ══════════════════════════════════════════════════════════════════════
// seen-episodes.js — an episode already shown is never shown again
// ══════════════════════════════════════════════════════════════════════
//
// ADDING-A-SHOW §N, case 3. A show that plays its whole season on the first
// press keeps the unaired episodes on `gs` (`_trQueue`, `_drQueue`, ...), and
// every save carries them. So loading a season saved at episode 3 and pressing
// Simulate handed back the episode 4 already watched (the user, 2026-10-20, on
// the Circle: "simulating new episode just use an episode already simulated
// before instead of creating a different one").
//
// A save cannot know it is being rewound, so the memory lives outside it, in
// this browser: every aired episode by show, seed and dice. Before a queued
// episode airs, a show asks `dealUnseen`; dice already shown are turned with
// the show's own re-run until they are new. That covers every way back — the
// save list, a file import, a cloud restore — without touching any of them.
//
// The Circle keeps its own copy (js/ci-run.js `dc_ci_seen`), written first.

const STORE = show => `dc_seen_${show}`;
const CAP = 3000;

/** Off in the test suite (tests/setup/forget-seen.js), where one fixed seed is
 *  replayed on purpose to prove a season reproduces; the tests of this memory
 *  switch it back on. */
export const seenOff = () => globalThis.__dcSeenEpisodesOff === true;

function _read(show) {
  try { return JSON.parse(localStorage.getItem(STORE(show)) || '[]'); } catch { return []; }
}

/** Has this browser already aired the episode these dice make? */
export function wasShown(show, key) { return !seenOff() && _read(show).includes(key); }

/** Remember an episode as aired. Storage full or blocked: the next rewind re-airs, as before. */
export function noteShown(show, key) {
  if (seenOff()) return;
  try {
    const seen = _read(show).filter(k => k !== key);
    seen.push(key);
    localStorage.setItem(STORE(show), JSON.stringify(seen.slice(-CAP)));
  } catch { /* nothing to do */ }
}

/** Forget a show's memory (tests start every season unseen). */
export function forgetShown(show) { try { localStorage.removeItem(STORE(show)); } catch { /* nothing */ } }

/**
 * The dice key for a season whose re-runs are a count per episode
 * (`rerolls[N]`, as js/pm-run.js, ch-run.js and rr-run.js keep them): only the
 * counts at or before `num` decide episode `num`.
 */
export function rerollKey(seed, num, rerolls = {}) {
  return `${seed}|${num}|${Object.keys(rerolls || {}).filter(d => Number(d) <= Number(num))
    .sort((a, b) => a - b).map(d => `${d}:${rerolls[d]}`).join(',')}`;
}

/**
 * Before the next queued episode airs: while its dice were already shown, turn
 * them with the show's own re-run. `next()` is the number about to air (or
 * null), `keyOf(num)` its dice as they stand now, `redeal(num)` the re-run
 * (false when it cannot, and then the episode airs as queued).
 */
export function dealUnseen(show, { next, keyOf, redeal, tries = 20 }) {
  if (seenOff()) return;
  const seen = new Set(_read(show));
  if (!seen.size) return;
  for (let i = 0; i < tries; i++) {
    const num = next();
    if (num == null || !seen.has(keyOf(num))) return;
    if (!redeal(num)) return;
  }
}
