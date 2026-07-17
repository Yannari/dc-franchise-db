// Directional, multidimensional relationship state. Legacy bonds remain the
// compatibility summary; new logic should use the dimension it cares about.
import { gs } from './core.js';

export const RELATIONSHIP_DIMENSIONS = Object.freeze([
  'affection', 'trust', 'strategicRespect', 'fear',
  'obligation', 'resentment', 'attraction',
]);
const SIGNED = new Set(['affection', 'trust', 'strategicRespect']);
const clamp = (v, min, max) => Math.max(min, Math.min(max, Number.isFinite(Number(v)) ? Number(v) : 0));

export const relationshipKey = (from, to) => `${from}→${to}`;
function validateDimension(d) {
  if (!RELATIONSHIP_DIMENSIONS.includes(d)) throw new Error(`Unknown relationship dimension: ${d}`);
}
export function defaultRelationshipDimensions(legacyBond = 0) {
  const bond = clamp(legacyBond, -10, 10);
  return { affection: bond, trust: bond, strategicRespect: 0, fear: 0,
    obligation: 0, resentment: Math.max(0, -bond), attraction: 0 };
}
function store() {
  if (!gs) return null;
  if (!gs.relationshipDimensions) gs.relationshipDimensions = {};
  return gs.relationshipDimensions;
}
function legacyBond(a, b) {
  return gs?.bonds?.[[a, b].sort().join('||')] ?? 0;
}
export const hasRelationshipDimensions = (a, b) =>
  Boolean(gs?.relationshipDimensions?.[relationshipKey(a, b)]);
export function getRelationshipDimensions(a, b) {
  return { ...defaultRelationshipDimensions(legacyBond(a, b)),
    ...(gs?.relationshipDimensions?.[relationshipKey(a, b)] || {}) };
}
export function getRelationshipDimension(a, b, dimension) {
  validateDimension(dimension);
  return getRelationshipDimensions(a, b)[dimension];
}
export function setRelationshipDimension(a, b, dimension, value) {
  validateDimension(dimension);
  const target = store();
  if (!target || a === b) return 0;
  const current = getRelationshipDimensions(a, b);
  current[dimension] = clamp(value, SIGNED.has(dimension) ? -10 : 0, 10);
  target[relationshipKey(a, b)] = current;
  return current[dimension];
}
export const addRelationshipDimension = (a, b, d, delta) =>
  setRelationshipDimension(a, b, d, getRelationshipDimension(a, b, d) + Number(delta || 0));
export function addMutualRelationshipDimension(a, b, dimension, delta) {
  return [addRelationshipDimension(a, b, dimension, delta),
    addRelationshipDimension(b, a, dimension, delta)];
}

// Compatibility bridge for existing events that only report a bond change.
// Respect, fear, obligation, and attraction require semantically specific events.
export function applyLegacyBondDelta(a, b, delta) {
  const d = Number(delta || 0);
  if (!d || a === b) return;
  if (d > 0) {
    addMutualRelationshipDimension(a, b, 'affection', d);
    addMutualRelationshipDimension(a, b, 'trust', d * 0.65);
    addMutualRelationshipDimension(a, b, 'resentment', -d * 0.45);
  } else {
    addMutualRelationshipDimension(a, b, 'affection', d * 0.55);
    addMutualRelationshipDimension(a, b, 'trust', d);
    addMutualRelationshipDimension(a, b, 'resentment', -d * 0.8);
  }
}
export function seedRelationshipFromLegacyBond(a, b, bond, { overwrite = false } = {}) {
  const target = store();
  if (!target || a === b) return;
  const summary = defaultRelationshipDimensions(bond);
  [relationshipKey(a, b), relationshipKey(b, a)].forEach(key => {
    if (!target[key]) { target[key] = summary; return; }
    if (overwrite) {
      // Re-sync only the bond-summary dimensions to the new legacy bond; preserve
      // accumulated strategicRespect/fear/obligation/attraction (not derivable from a scalar).
      target[key] = { ...target[key], affection: summary.affection, trust: summary.trust, resentment: summary.resentment };
    }
  });
}
export function relationshipDecisionProfile(a, b) {
  const r = getRelationshipDimensions(a, b);
  return { ...r,
    warmth: clamp(r.affection - r.resentment * 0.7, -10, 10),
    safety: clamp(r.trust - r.fear * 0.55, -10, 10),
    strategicDanger: clamp(r.strategicRespect * 0.65 + r.fear * 0.75, -10, 10),
    socialDebt: clamp(r.obligation - r.resentment * 0.35, -10, 10),
    romanticPull: clamp(r.attraction + Math.max(0, r.affection) * 0.25, 0, 10),
  };
}

// Decision-specific adapters prevent callers from collapsing the dimensions
// back into one universal relationship score.
export function pitchTrust(from, pitcher) {
  const r = relationshipDecisionProfile(from, pitcher);
  return clamp(r.trust + r.obligation * 0.2 - r.resentment * 0.35, -10, 10);
}

export function targetProtection(from, target) {
  const r = relationshipDecisionProfile(from, target);
  return clamp(
    r.affection * 0.7 + r.trust * 0.2 + r.obligation * 0.45 - r.resentment * 0.65,
    -10,
    10,
  );
}
export function removeRelationshipDimensionsFor(name) {
  if (!gs?.relationshipDimensions) return;
  Object.keys(gs.relationshipDimensions).forEach(key => {
    const [from, to] = key.split('→');
    if (from === name || to === name) delete gs.relationshipDimensions[key];
  });
}

// Per-dimension decay of the EVENT-DRIVEN specific dims. Multiplicative pull
// toward 0 each episode: fear fades fastest (out of sight, out of mind),
// strategic respect is stickiest, attraction/obligation fade unless reinforced.
// Warmth dims (affection/trust/resentment) are intentionally excluded —
// recoverBonds owns those. Lives here (leaf module) so bonds.js can call it
// without a circular import.
const DIMENSION_DECAY = { fear: 0.85, obligation: 0.9, attraction: 0.9, strategicRespect: 0.96 };
export function decayRelationshipDimensions(ep = null) {
  const dims = gs?.relationshipDimensions;
  if (!dims) return;
  Object.keys(dims).forEach(key => {
    const rec = dims[key];
    for (const [dim, factor] of Object.entries(DIMENSION_DECAY)) {
      const v = rec[dim];
      if (v) rec[dim] = Math.abs(v) < 0.05 ? 0 : Math.round(v * factor * 1000) / 1000;
    }
  });
}
