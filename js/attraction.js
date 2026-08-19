// Who could plausibly be interested in whom.
//
// ── WHY THIS IS ITS OWN FILE ──
//
// The rule lived inside `romanticCompat` in js/players.js, which imports
// core.js and therefore the whole simulator. Anything outside the sim that
// needed to ask the question — the life resolver, in the first instance —
// could not import it, and the alternative was a second copy of the rule.
//
// A second copy is exactly how the franchise ended up proposing that two
// straight men had started seeing each other: the off-season resolver picked a
// partner off the social graph, which knows who is close to whom and nothing at
// all about who anybody is attracted to. One rule, one place, both callers.
//
// Data note: 90 of 182 characters have no `sexuality` on the roster. Blank
// means straight here, exactly as it always has in the sim — not because that
// is a good default in general, but because changing it here would silently
// re-write the pairing behaviour of every season already played.

export const DEFAULT_SEXUALITY = 'straight';
export const DEFAULT_GENDER = 'm';

/**
 * Would somebody of this sexuality be interested in that gender?
 *
 * `nb` is treated as a different gender from both `m` and `f`, so a straight
 * character can be interested in a non-binary one. That is the behaviour the
 * simulator has always had and this is a move of the rule, not a change to it.
 */
export function attracted(sexuality, myGender, theirGender) {
  const sex = sexuality || DEFAULT_SEXUALITY;
  const mine = myGender || DEFAULT_GENDER;
  const theirs = theirGender || DEFAULT_GENDER;
  if (sex === 'asexual') return false;
  if (sex === 'bi' || sex === 'queer' || sex === 'pan') return true;
  if (sex === 'gay') return mine === 'm' && theirs === 'm';
  if (sex === 'lesbian') return mine === 'f' && theirs === 'f';
  return mine !== theirs; // straight
}

/** Mutual interest, from two `{ gender, sexuality }` records. */
export function romanticallyCompatible(a, b) {
  return attracted(a?.sexuality, a?.gender, b?.gender)
    && attracted(b?.sexuality, b?.gender, a?.gender);
}

/**
 * The same question when the people may simply be unknown.
 *
 * A character missing from the roster has no gender to reason from, and the
 * strict rule would read that as two men and quietly refuse to ever pair them.
 * Missing DATA and a definite no are different answers, so this gives the
 * benefit of the doubt and lets the caller decide what to do about the gap.
 */
export function couldBeInterested(a, b) {
  if (!a?.gender || !b?.gender) return true;
  return romanticallyCompatible(a, b);
}
