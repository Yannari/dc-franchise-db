// ══════════════════════════════════════════════════════════════════════
// pm/just-friends.js — "I think we're better as friends"
// ══════════════════════════════════════════════════════════════════════
//
// A couple one of whom ended it as friends (pm/threads.js doubt-end) stays
// friends until they rekindle: a second chance taken (exes.js reunite), or a
// recoupling that puts them back together with the feeling back on both
// sides (moments.js recoupleNight). Until then (user, 2026-10-26: "do they
// only act as friends now?"):
//   - no couple's scenes between them: no kiss, no cuddle, no pillow talk,
//     no ladder, no "I love you", and love stops growing;
//   - their own scene instead (events.js 'just-friends');
//   - and neither of them is TAKEN by the other (user: "Casa Amor shouldn't
//     consider them taken if they didn't rekindle"): a kiss elsewhere is no
//     secret to tell, no jealousy, no mugging-off with the public — even
//     while the villa still has them sharing a bed as a couple.
// A leaf: everything imports it, it imports nothing.

const key = (a, b) => [a, b].sort().join('|');

export const justFriends = (state, a, b) => !!(a && b && state.justFriends?.[key(a, b)]);

/** {ender} ended it; {hurt} was told. */
export function becomeFriends(state, ender, hurt, ep = state.ep) {
  (state.justFriends ||= {})[key(ender, hurt)] = { ep, ender, hurt };
}

export function rekindle(state, a, b) {
  if (state.justFriends) delete state.justFriends[key(a, b)];
}

export const friendsRecords = state => Object.values(state.justFriends || {});

/**
 * Who has {n}'s heart in the villa's eyes: the partner, unless the two are
 * only friends now. Read wherever being TAKEN matters (cheating, jealousy,
 * temptation); partnerOf stays the couple for recouplings and dumpings.
 */
export function heartOf(state, n) {
  const c = state.couples?.find(x => x.includes(n));
  const p = c ? (c[0] === n ? c[1] : c[0]) : null;
  return p && !justFriends(state, n, p) ? p : null;
}
