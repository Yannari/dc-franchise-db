// ══════════════════════════════════════════════════════════════════════
// dr/rng.js — the season's dice
// ══════════════════════════════════════════════════════════════════════
//
// One seeded generator, threaded through every function in js/dr/ as an
// argument. Nothing in this show may call `Math.random()` directly: a season
// is replayed from its seed when an episode is re-aired, and a single bare
// random call somewhere in the engine makes that replay produce a different
// episode than the one that was watched. Big Brother learned this the hard way
// and the rule is written down there too.
//
// THE SAME ALGORITHM AS tests/helpers/rng.js, deliberately duplicated rather
// than imported: the engine must never import from tests/. The two are checked
// against each other in tests/dr-perform.test.js, so they cannot drift.

/** Numerical Recipes LCG — small, fast, identical on every machine. */
export function rngFor(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
