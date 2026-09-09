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
//
// AND IT IS NOT ONLY TESTS. This used to end "a played season never hits
// this: its seed is drawn once and every later decision reads a stream
// already well mixed." That is false for whatever a season decides FIRST,
// and what a season decides first is its schedule.
//
// buildSchedule shuffles the six tentpoles to choose which one a short
// season has no room for, and took Math.floor(rng() * 6) as its opening
// draw. That is 1 for every seed from 1 to 20, so the shuffle put the same
// challenge last in all forty seasons measured and the Rusical never once
// happened on a twelve-queen cast. It burns four draws now. Anything else
// that makes a decision from a fresh stream must do the same, or be moved
// later in the season.
//
// The real fix is to avalanche the seed here so neighbouring seeds diverge
// from draw one. That was written and measured: it works, and it also
// re-rolls every seeded stream in the repo, which surfaced two pre-existing
// Big Brother failures (bb-chain-of-safety casts one houseguest twice on a
// card). Left undone deliberately — it is a change to make on purpose, with
// those two fixed alongside it, not as a side effect.

/** Numerical Recipes LCG — small, fast, identical on every machine. */
export function rngFor(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * An INDEPENDENT stream off the same season seed.
 *
 * The season used to walk one generator from its first decision to its last,
 * which made every decision depend on how many numbers the decisions before it
 * happened to draw. That is what made a drag season un-editable: pinning the
 * Ball onto episode five changed how many draws `buildSchedule` took, and the
 * whole season downstream of it came out different -- so a pin could not be
 * applied to a season already in progress without silently rewriting weeks the
 * viewer had already watched.
 *
 * `streamFor(seed, salt)` gives the schedule its own dice and every episode its
 * own dice, so a change to one week moves that week and nothing else.
 *
 * THE SALT IS AVALANCHED, NOT ADDED. rngFor's first draw is a linear function
 * of its seed (see above), so `rngFor(seed + episode)` would hand consecutive
 * episodes nearly the same opening number -- the same defect that put the same
 * tentpole last in forty consecutive seasons. Seed and salt are mixed through
 * two multiply-xorshift rounds and four draws are burned on top, which is what
 * the note above asks of anything deciding from a fresh stream.
 */
export function streamFor(seed = 1, salt = 0) {
  const s = typeof salt === 'string'
    ? [...salt].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7)
    : (Number(salt) || 0) >>> 0;
  let h = (Math.imul(seed >>> 0, 2654435761) ^ Math.imul(s + 0x9e37, 40503)) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0; h = Math.imul(h, 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 3266489917) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  const r = rngFor(h);
  r(); r(); r(); r();
  return r;
}
