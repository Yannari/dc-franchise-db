// ══════════════════════════════════════════════════════════════════════
// rr/interest.js — who fancies whom, one direction at a time
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-11-03: "do we have one-sided crush?" A spark was one number shared by two people, and whether a
// confession was returned was a roll weighted by their bond: nobody's own feelings decided it. Here a crush is x's,
// about y, and y's answer is y's interest in x:
//   · canFancy(x, y): x could be drawn to y at all (js/attraction.js, one way: x's sexuality and y's gender; never
//     anybody under 18, never the age gap the user ruled out). A gay man can fall for his straight best friend; the
//     friend just can't return it. A COUPLE still needs both ways (players.js romanticCompat).
//   · interestOf(state, y, x): how drawn y is to x, 0..10. Nothing if y can't be; else y's own taste in x (seeded, so a
//     season replays the same) plus what the race has made of them (the bond).
import { attracted, isMinor, tooFarApart } from '../attraction.js';
import { players } from '../core.js';
import { getBond } from '../bonds.js';
import { stableRng } from '../script/rng.js';

const P = n => players.find(p => p.name === n) || null;

/** x could be drawn to y at all. */
export function canFancy(x, y) {
  const a = P(x), b = P(y);
  if (!a || !b || x === y) return false;
  if (isMinor(a) || isMinor(b) || tooFarApart(a, b)) return false;
  return attracted(a.sexuality, a.gender, b.gender);
}

/** How drawn y is to x, 0..10. */
export function interestOf(state, y, x) {
  if (!canFancy(y, x)) return 0;
  const taste = 1 + 5 * stableRng(state?.seed ?? 0, 'rr-interest', y, x)();
  return Math.max(0, Math.min(10, taste + 0.4 * getBond(y, x)));
}
// what an answer to a confession is, from the one asked's interest: yes, not now, no
export const RETURNS = 4.5;
export const MAYBE = 3;
export const answerOf = n => (n >= RETURNS ? 'yes' : n >= MAYBE ? 'maybe' : 'no');
