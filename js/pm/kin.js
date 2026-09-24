// ══════════════════════════════════════════════════════════════════════
// pm/kin.js — the islanders who knew each other before the villa
// ══════════════════════════════════════════════════════════════════════
//
// User: "can we have relationships between contestants that are not exes,
// like sisters, twins?" The real show has had both: twins John and Tony
// Alberti (UK 1, 2015), and twin sisters Jess and Eve Gale, who walked in
// together as bombshells on UK 6 (2020) — "introduced as a pair, but
// technically separate contestants who would separately couple up"
// (heart.co.uk).
//
// The relation is authored on the cast's Relationships tab (core.js
// REL_KINSHIP, the same rows Big Brother reads). What it does here:
//   · family by blood never fancies each other: no attraction, ever
//   · everyone starts where the relation puts them — twins and best friends
//     close, estranged family and ex-best-friends cold, exes with a spark
//     left and a grudge beside it, a couple who came in together in love
//   · bombshells with a relation walk in together (pm/moments.js arrivals)
//   · the scenes only a relation has (events.js: kin-vet, kin-protect,
//     kin-heart, ex-awkward, ex-jealous), the vote (family never votes
//     against family), the goodbye when one of them is dumped, and a
//     sibling's opinion of a partner at the recoupling.
import { kinshipPairs, REL_KINSHIP, relationships } from '../core.js';
import { setBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { compatible, BLOOD } from './chemistry.js';

export { BLOOD };
// Came in together: romantic already.
export const TOGETHER = new Set(['married', 'engaged', 'partners', 'dating']);
// Where each relation starts: the bond both ways.
const START = {
  twins: 7, siblings: 6, 'step-siblings': 3.5, 'parent-child': 6, grandparent: 5, 'aunt-uncle': 4, cousins: 4, 'in-laws': 2.5,
  estranged: -3, married: 6, engaged: 6, partners: 5.5, dating: 4,
  'best-friends': 6, 'childhood-friends': 5, 'old-friends': 3.5, roommates: 3, colleagues: 1.5, teammates: 2,
  exes: 0.5, 'ex-friends': -3,
};

const key = (a, b) => [a, b].sort().join('|');

/**
 * Read the cast's relations into the season (only pairs who are both in it),
 * and set where each pair starts. `given` overrides the Relationships tab
 * (tests; a direct call).
 */
export function loadKin(state, cast, given = null, setup = {}) {
  const inCast = new Set(cast);
  // The islander cards used to carry their own "An ex in the villa" (user:
  // "you could port that there, ex and all"): an ex set there is an Exes row.
  const fromCards = cast.filter(n => setup[n]?.ex && inCast.has(setup[n].ex)).map(n => ({ a: n, b: setup[n].ex, kin: 'exes' }));
  const all = [...(given || kinshipPairs()), ...fromCards];
  const seen = new Set();
  const rows = all.filter(r => {
    if (!r || !inCast.has(r.a) || !inCast.has(r.b) || r.a === r.b || START[r.kin] == null) return false;
    const k = key(r.a, r.b);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
  // The tab's other axis, how the two FEEL about each other going in (a
  // bond with no relation: rivals from a previous show, friends of friends).
  if (!given) for (const r of relationships || []) {
    if (!r || !inCast.has(r.a) || !inCast.has(r.b) || r.a === r.b || !Number(r.bond)) continue;
    if (rows.some(x => key(x.a, x.b) === key(r.a, r.b))) continue;
    setBond(r.a, r.b, Number(r.bond));
  }
  state.kin = {};
  for (const r of rows) state.kin[key(r.a, r.b)] = r.kin;
  for (const r of rows) {
    setBond(r.a, r.b, START[r.kin]);
    // The Lie Detector's "your ex" question reads the profile.
    if (r.kin === 'exes') for (const [x, y] of [[r.a, r.b], [r.b, r.a]]) if (state.profiles[x] && !state.profiles[x].ex) state.profiles[x].ex = y;
    if (r.kin === 'exes') {
      // Something left, and something unforgiven, on both sides.
      for (const [x, y] of [[r.a, r.b], [r.b, r.a]]) addRelationshipDimension(x, y, 'resentment', 2);
    }
  }
  return rows.length;
}

/** What two islanders are to each other, or null. */
export const kinOf = (state, a, b) => state.kin?.[key(a, b)] || null;
/** Family by blood: never romantic. */
export const blood = (state, a, b) => BLOOD.has(kinOf(state, a, b));
/** Everyone `a` knew before the villa, with what they are to each other. */
export function kinFor(state, a) {
  return Object.entries(state.kin || {}).map(([k, kin]) => {
    const [x, y] = k.split('|');
    return x === a ? { other: y, kin } : y === a ? { other: x, kin } : null;
  }).filter(Boolean);
}
/** How a relation is spoken of: twins, family, friends, or exes. */
export const kinGroup = kin => (kin === 'twins' ? 'twins' : kin === 'exes' ? 'ex' : BLOOD.has(kin) ? 'family' : 'friends');

/** The words for a relation, for the screens. */
export const kinLabel = kin => REL_KINSHIP?.[kin]?.label || kin;
/** A family member or a best friend: somebody on your side. */
export const onYourSide = kin => BLOOD.has(kin) && kin !== 'estranged' || ['best-friends', 'childhood-friends', 'old-friends', 'roommates'].includes(kin);

/**
 * Seed what exes and couples who came in together still feel, once both are
 * in the villa and their attraction exists (chemistry.js seedAttraction).
 */
export function seedKinAttraction(state, name) {
  for (const { other, kin } of kinFor(state, name)) {
    if (!state.villa.includes(other) || !compatible(state, name, other)) continue;
    const lift = kin === 'exes' ? 2 : TOGETHER.has(kin) ? 4 : 0;
    if (!lift) continue;
    for (const [x, y] of [[name, other], [other, name]]) addRelationshipDimension(x, y, 'attraction', lift);
    if (TOGETHER.has(kin)) for (const [x, y] of [[name, other], [other, name]]) addRelationshipDimension(x, y, 'love', 5);
  }
}
