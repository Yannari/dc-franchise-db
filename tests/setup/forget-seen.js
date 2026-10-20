// The memory of aired episodes is OFF in the suite, and empty.
//
// The queued shows remember each episode they air, by seed and dice, in
// localStorage (js/seen-episodes.js, and the Circle's own dc_ci_seen), so a
// save loaded from before an episode deals it again instead of re-airing it.
// The suites replay one fixed seed on purpose, often twice in one test, to
// prove a season reproduces: with the memory on, the second play would find
// its episodes "already shown" and become a different season. The tests of the
// memory itself switch it back on (globalThis.__dcSeenEpisodesOff = false).
import { beforeEach } from 'vitest';

beforeEach(() => {
  globalThis.__dcSeenEpisodesOff = true;
  if (typeof localStorage === 'undefined') return;
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('dc_seen_') || k === 'dc_ci_seen') localStorage.removeItem(k);
    }
  } catch { /* no storage in this environment */ }
});
