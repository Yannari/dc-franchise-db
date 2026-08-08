// Not saying the same thing next week.
//
// Both streams already avoid repeating themselves WITHIN an episode, and they
// are good at it — the audit measures a Birdie night at 108 distinct lines out
// of 112, and the alumni room at nine out of nine. Across a season the same
// audit measures the room at 55%: it repeats itself half the time.
//
// That gap is the whole diagnosis. The memory is a `Set` built when an episode
// starts and dropped when it ends, so every episode begins having forgotten
// everything, walks into the same pool, and draws from the same end of it. The
// pools are not short of words — the room prints 259 lines a season out of
// roughly twenty takes per event kind. It is short of memory.
//
// ── why a rota rather than a history ──
//
// The obvious fix is to remember what earlier episodes said. It does not fit
// what this actually is: an episode's feed is built on demand, from that
// episode, whenever somebody opens it. Episode 14 does not have episodes 1 to
// 13 in hand, and building them to find out what they said would mean building
// the whole season to render one night of it.
//
// So instead of remembering where the last episode stopped, each episode is
// TOLD where to start. A pool is walked from a point derived from the episode
// number, so consecutive episodes enter the same pool at points far apart, and
// a season walks the pool rather than repeatedly grazing one end. It needs no
// state, gives the same answer every time it is asked, and works identically
// on the played path, the archive path and a feed rebuilt years later.
//
// What it deliberately does NOT do is narrow the pool. Restricting an episode
// to a window would trade the cross-episode repetition for within-episode
// repetition, and within-episode is the part that currently works. Everything
// stays eligible; only the starting point moves.

/**
 * Where in a pool this episode starts.
 *
 * ── it has to SWEEP, not restart ──
 *
 * The first version scattered the start with a multiplicative hash, so
 * consecutive episodes landed far apart. Measured, it made the room slightly
 * WORSE: 55% distinct across a season became 51%. Of course it did. A start
 * scattered pseudorandomly and then drawn from randomly is uniform sampling
 * with extra steps, and uniform sampling over a shared pool is exactly the
 * thing that was already producing the repeats.
 *
 * What removes them is a rota. Episode E starts where episode E-1's draws left
 * off — `episode * stride` — so a season WALKS the pool instead of grazing it.
 * A twenty-line pool drawn three times a night is exhausted in seven episodes
 * with no repeat at all, where random selection expects its first collision
 * around the fourth draw.
 *
 * `stride` is how many lines a night typically takes from one pool; too small
 * and consecutive episodes overlap, too large and the sweep skips. `salt`
 * offsets each pool by a fixed amount so they do not all begin at index zero
 * and move in formation — the offset is scattered, the STEP is not.
 */
export function rotationStart(length, episode = 0, salt = 0, stride = 3) {
  if (!(length > 0)) return 0;
  const ep = Math.abs(Math.trunc(Number(episode) || 0));
  return (hash(salt) + ep * Math.max(1, Math.trunc(stride))) % length;
}

/** A stable number for a string key, so pools rotate independently. */
export function hash(key) {
  if (typeof key === 'number') return Math.abs(Math.trunc(key));
  let h = 2166136261;
  for (const ch of String(key ?? '')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The pool, read from this episode's starting point round to it again. */
export function rotate(pool, episode = 0, salt = 0, stride = 3) {
  const arr = Array.isArray(pool) ? pool : [];
  if (arr.length < 2) return [...arr];
  const start = rotationStart(arr.length, episode, salt, stride);
  return Array.from({ length: arr.length }, (_, i) => arr[(start + i) % arr.length]);
}

/**
 * An index near the front of a rotated list.
 *
 * Geometric fall-off rather than a hard window: mostly at the episode's own
 * starting point, occasionally well past it. The fall-off is steep, because a
 * rota only works if the episode actually consumes the lines it was pointed
 * at — a flat distribution over the whole pool ignores the starting point and
 * makes the sweep decorative. `used` still guarantees it moves on, so steep
 * costs nothing within a night; the far end of the pool stays reachable, so a
 * pool bigger than the rota can still surprise.
 */
export function frontIndex(rng, length, spread = null) {
  if (!(length > 0)) return 0;
  // ── the bias has to scale with the pool ──
  //
  // A fixed fall-off measured WORSE on the timeline: 89% distinct across a
  // season fell to 86%, and the newly worst offenders were the smallest pools —
  // "IM SCREAMING" fourteen times, "WHAT" thirteen. Of course. A four-line pool
  // has no room to sweep, so concentrating on its front just picks the same two
  // lines, where uniform selection at least spread across four.
  //
  // Tied to length instead: a big pool gets a real bias, so the rota means
  // something, and a tiny one is drawn almost flat, because there is nothing to
  // rotate through.
  const s = spread == null ? Math.max(1.5, length / 3) : spread;
  return Math.min(length - 1, Math.floor(-Math.log(1 - rng()) * s));
}

/**
 * One line from a pool: unused if possible, and starting somewhere that
 * depends on which episode this is.
 *
 * `used` still does the within-episode work and still comes first — freshness
 * is not being weakened, it is being given a different place to begin. The
 * choice among what is left is front-weighted rather than uniform, because
 * uniform selection over the whole pool ignores the starting point entirely
 * and the rotation would do nothing at all.
 */
export function pickRotating(pool, rng, used,
  { episode = 0, salt = 0, spread = null, stride = 3 } = {}) {
  const arr = Array.isArray(pool) ? pool : [];
  if (!arr.length) return '';
  const order = rotate(arr, episode, salt, stride);

  // The pool running dry inside one episode is not a failure — it means this
  // night said more about one moment than there are ways to say it. Repeating
  // beats falling silent, which is what the old memory did too.
  const fresh = used ? order.filter(x => !used.has(x)) : order;
  const from = fresh.length ? fresh : order;
  const chosen = from[frontIndex(rng, from.length, spread)];

  if (used) {
    used.add(chosen);
    // Keep the memory shorter than the pool, or it fills, every line looks used
    // and the filter stops meaning anything.
    if (used.size > Math.max(1, arr.length - 2)) used.delete([...used][0]);
  }
  return chosen;
}
