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

// A CAVEAT FOR TESTS, measured rather than assumed: this LCG's FIRST draw is a
// linear function of the seed, so consecutive seeds barely differ. Across
// rngFor(0)..rngFor(199) the first value spans 0.236 to 0.313 — a seventh of
// the range. A test that loops small consecutive seeds and reads one decision
// is therefore sampling one corner of the distribution, not the distribution,
// and will report a probabilistic behaviour as if it were deterministic.
// Spread the seeds (rngFor(i * 7919 + 13) covers 0.00 to 0.98) or burn a draw.
// A played season never hits this: its seed is drawn once and every later
// decision reads a stream already well mixed.

/** Numerical Recipes LCG — small, fast, identical on every machine. */
export function rngFor(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
