// ══════════════════════════════════════════════════════════════════════
// tests/helpers/show-vocabulary.js — WHO OWNS WHICH WORDS. One copy.
// ══════════════════════════════════════════════════════════════════════
//
// This table used to live inside `tests/show-vocabulary.test.js`, and when
// `tests/tr-vp.test.js` needed the same rule for a rendered screen it restated
// the list rather than importing it — a test file has no exports to take.
//
// TWO COPIES OF ONE RULE IS A SHAPE THIS REPO HAS BEEN BITTEN BY at least four
// times: the act names, the pool-shape figures, the tier cuts, and the show
// list itself (eight files held their own, see docs/ADDING-A-SHOW.md §13). The
// failure is always the same and always quiet — one copy is extended, the other
// is not, and the guard built on the stale copy keeps passing while it stops
// guarding. A vocabulary list is the worst possible thing to hold two copies
// of, because the bug it catches is itself a copy that drifted.
//
// So it lives here, in one place, and both guards import it.

// ── the vocabularies ──────────────────────────────────────────────────
//
// `own` is what a show is ALLOWED to say, and therefore what its rivals are
// not. A word may belong to more than one show: both a camp and a house have a
// jury, so "jury" is on both lists and is forbidden only on the castle, which
// has neither a jury nor a merge.
//
// FORBIDDEN IS DERIVED, IN BOTH DIRECTIONS: everything every other show owns,
// minus everything this one owns. The previous version listed only the two
// shipped shows, so no Traitors noun was forbidden anywhere — a Total Drama
// page could have said "banished at the Round Table" and passed.
export const VOCAB = {
  'big-brother': {
    own: [
      'head of household', 'hoh', 'power of veto', 'veto',
      'evict', 'evicted', 'eviction', 'houseguest', 'houseguests',
      'have-not', 'block buster', 'nominated', 'nomination', 'nominee',
      'on the block', 'the block', 'house', 'jury', 'juror', 'slop',
      'challenge', 'challenges',
    ],
    // "Competition" is deliberately NOT here. A mission is a competition and
    // so is a challenge, so it cannot be true of one show and false of
    // another — and this table is only for words that can. "Competition
    // history" is a heading every show's article is entitled to.
  },
  'total-drama': {
    own: [
      'tribe', 'tribal council', 'campfire', 'idol', 'immunity challenge',
      'contestant', 'contestants', 'voted out', 'camper', 'camp', 'merge',
      'marshmallow', 'beach', 'island', 'jury', 'juror',
      'challenge', 'challenges', 'immunity',
    ],
  },
  traitors: {
    own: [
      'traitor', 'traitors', 'faithful', 'faithfuls', 'banish', 'banished',
      'banishment', 'murder', 'murdered', 'round table', 'conclave', 'castle',
      'dagger', 'mission', 'missions', 'turret', 'final table',
    ],
  },
  'drag-race': {
    own: [
      'queen', 'queens', 'runway', 'lip sync', 'lip-sync', 'lipsync', 'werk room',
      'untucked', 'shantay', 'sashay', 'sashayed away', 'maxi challenge',
      'mini challenge', 'snatch game', 'main stage', 'condragulations',
      'bottom two', 'miss congeniality',
      /* ── AND "CHALLENGE", WHICH STOPPED BEING EXCLUSIVE THE DAY THIS
         SHOW WAS REGISTERED ──────────────────────────────────────────
         It is listed for Big Brother and Total Drama above, which was true
         while they were the only two shows that held one. A MAXI CHALLENGE IS
         A CHALLENGE: this show says the word in its registry entry, in its
         career stat labels and in every sentence about what the queens did on
         Tuesday. `forbiddenFor` subtracts a format's own words from the
         forbidden set, so listing it here is what makes the word available to
         the show that genuinely uses it while keeping it forbidden on a
         castle, which calls them missions.
         The precedent is the "competition" note above, and the rule it states:
         this table is only for words that can be true of one show and false of
         another. */
      'challenge', 'challenges',
    ],
    // "Safe" is deliberately NOT here. Big Brother calls a houseguest safe and
    // so does this show; a word two formats both own cannot be exclusive to
    // either, and listing it would fail every Big Brother page.
  },
};

/** Everything a given format is not allowed to say. */
export function forbiddenFor(format) {
  const mine = new Set((VOCAB[format]?.own || []).map(w => w.toLowerCase()));
  const others = Object.entries(VOCAB)
    .filter(([f]) => f !== format)
    .flatMap(([, v]) => v.own);
  return [...new Set(others.map(w => w.toLowerCase()))].filter(w => !mine.has(w));
}


/**
 * Which forbidden words appear in ALREADY-STRIPPED, plain text.
 *
 * The stripping is left to the caller because the two callers strip different
 * things: a rendered VP screen carries 20KB of its own stylesheet, and that has
 * to go first or a failure names the entire visual system instead of the
 * sentence that broke.
 */
export function foreignWordsIn(text, format) {
  const hay = String(text || '').toLowerCase();
  return forbiddenFor(format).filter(w =>
    // Built by concatenation, so the boundary must be written '\\b'. A bare
    // '\b' inside a string literal is U+0008 and the regex then matches
    // nothing whatever — a negative guard that passes for free, forever.
    new RegExp('\\b' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b').test(hay));
}
