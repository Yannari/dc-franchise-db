// Deterministic randomness for tests that measure a distribution.
//
// Some smoke tests assert on the SHAPE of many simulated runs — "narration
// rarely repeats", "a grab and a stun both happen somewhere in thirty runs".
// Those are the right things to assert, but against an unseeded Math.random
// they pass or fail on the day: the statistic lands near the threshold and
// which side it falls is luck. That is not flakiness in the simulator, it is a
// test with no fixed input.
//
// withSeededRandom pins Math.random to a reproducible stream for the duration
// of a block and restores the real one afterwards, so a failure means the
// simulator changed rather than that the dice were unkind.

/** Numerical Recipes LCG — small, fast, and identical on every machine. */
export function seededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Run `fn` with Math.random pinned to `seed`. Restores even if fn throws. */
export function withSeededRandom(seed, fn) {
  const real = Math.random;
  Math.random = seededRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = real;
  }
}
