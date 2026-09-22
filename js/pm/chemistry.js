// ══════════════════════════════════════════════════════════════════════
// pm/chemistry.js — who fancies whom ("my type on paper")
// ══════════════════════════════════════════════════════════════════════
//
// Attraction lives in the SHARED relationship store (js/relationships.js),
// one record per direction — A fancying B says nothing about B fancying A.
// This file computes the spark on meeting and offers a small API over the
// store; it keeps no table of its own (ADDING-A-SHOW §11.5 Q, spec §6.1).
//
// `romanticallyCompatible` (js/attraction.js) gates everything: no attraction
// without compatibility, same rule the rest of the franchise uses.
import { romanticallyCompatible } from '../attraction.js';
import { streamFor } from '../dr/rng.js';
import { getRelationshipDimension, setRelationshipDimension, addRelationshipDimension }
  from '../relationships.js';
import { vibeScore, ickScore } from './profile.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function typeFit(me, them) {
  const want = me.type?.looks || [];
  const looks = want.length ? want.filter(t => (them.looks || []).includes(t)).length / want.length : 0.5;
  const vibes = me.type?.vibes?.length
    ? me.type.vibes.reduce((a, v) => a + vibeScore(v, them.stats), 0) / me.type.vibes.length : 0.5;
  return 0.5 * looks + 0.5 * vibes;
}

export function ickHit(me, them) {
  return (me.icks || []).length ? Math.max(...me.icks.map(i => ickScore(i, them.stats))) : 0;
}

export function interestBonus(me, them) {
  const theirs = them.interests || [];
  const shared = (me.interests || []).filter(i => theirs.includes(i)).length;
  return shared * 0.06 + (me.bonusInterest && theirs.includes(me.bonusInterest) ? 0.15 : 0);
}

/** 0..10, or null when the two are not romantically compatible. */
export function attractionOf(me, them, rng) {
  if (!me || !them || me.name === them.name || !romanticallyCompatible(me, them)) return null;
  const spark = rng();
  // An ick only bites above the middle, so an ordinary islander is not a
  // little repellent to everybody.
  const ick = 0.6 * Math.max(0, ickHit(me, them) - 0.4);
  const raw = 0.45 * typeFit(me, them) + 0.35 * spark + interestBonus(me, them) - ick;
  return Math.round(clamp(raw * 10, 0, 10) * 100) / 100;
}

export function compatible(state, a, b) {
  const pa = state.profiles[a], pb = state.profiles[b];
  return !!pa && !!pb && a !== b && romanticallyCompatible(pa, pb);
}

/** Attraction both ways between `name` and everybody already in the villa. */
export function seedAttraction(state, name, seed) {
  for (const other of state.villa) {
    if (other === name) continue;
    for (const [a, b] of [[name, other], [other, name]]) {
      const v = attractionOf(state.profiles[a], state.profiles[b], streamFor(seed, `spark:${a}>${b}`));
      if (v != null) setRelationshipDimension(a, b, 'attraction', v);
    }
  }
}

/** A→B attraction, or null when the pair can never be romantic. */
export function attr(state, a, b) {
  return compatible(state, a, b) ? getRelationshipDimension(a, b, 'attraction') : null;
}

export function nudgeAttraction(state, a, b, d) {
  if (!compatible(state, a, b)) return;
  addRelationshipDimension(a, b, 'attraction', d);
}
