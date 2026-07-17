// ══════════════════════════════════════════════════════════════════════
// relationship-events.js — semantic bridge from gameplay moments into the
// multidimensional relationship model, with a per-pair cause history and
// per-dimension decay.
//
// Division of labour (keeps the two subsystems from fighting):
//   • WARMTH  (affection / trust / resentment) stays bond-driven — these events
//     route through addBond, so the legacy-bond↔dimension bridge and
//     recoverBonds remain the single source of truth and the only thing that
//     fades them.
//   • SPECIFIC dims (strategicRespect / fear / obligation / attraction) are
//     event-only. Nothing else moves them, so this file also owns their decay.
//
// Every change logs a short human-readable cause so the relationship VP and
// Voting Plans can explain WHY a dimension is where it is.
// ══════════════════════════════════════════════════════════════════════
import { gs } from './core.js';
import { addRelationshipDimension } from './relationships.js';
import { addBond } from './bonds.js';

// decay lives in relationships.js (leaf) so bonds.js/recoverBonds can call it
// without a circular import; re-exported here for API cohesion.
export { decayRelationshipDimensions } from './relationships.js';

const curEp = () => (gs.episode || 0) + 1;

// ── cause history ─────────────────────────────────────────────────────
function causeStore() { if (!gs.relationshipCauses) gs.relationshipCauses = {}; return gs.relationshipCauses; }
function logCause(from, to, dim, delta, reason, ep) {
  const key = `${from}→${to}`;
  const arr = causeStore()[key] || (causeStore()[key] = []);
  arr.push({ ep: ep ?? curEp(), dim, delta: Math.round(delta * 100) / 100, reason });
  if (arr.length > 12) arr.splice(0, arr.length - 12);   // keep the recent tail
}
// recent causes for a directional pair, optionally filtered to one dimension.
export function recentCauses(from, to, dim = null) {
  const arr = causeStore()[`${from}→${to}`] || [];
  const out = dim ? arr.filter(c => c.dim === dim) : arr;
  return [...out].reverse();   // newest first
}
export function clearRelationshipCausesFor(name) {
  const s = causeStore();
  Object.keys(s).forEach(key => { const [a, b] = key.split('→'); if (a === name || b === name) delete s[key]; });
}

function bumpDim(from, to, dim, delta, reason, ep) {
  if (from === to || !delta) return;
  addRelationshipDimension(from, to, dim, delta);
  logCause(from, to, dim, delta, reason, ep);
}
function bumpWarmth(a, b, delta, reason, ep) {
  if (a === b || !delta) return;
  addBond(a, b, delta);                 // bridge handles affection/trust/resentment
  logCause(a, b, delta >= 0 ? 'affection' : 'resentment', delta, reason, ep);
}

// ── semantic events ────────────────────────────────────────────────────
// A blindside / betrayal: warmth craters, and the victim learns to FEAR the
// person who can do that to them. The traitor carries a little guilt (obligation).
export function recordBetrayal(victim, traitor, { severity = 1, applyWarmth = true, ep = null } = {}) {
  if (!victim || !traitor || victim === traitor) return;
  // Callers that already booked the bond/trust/resentment hit (e.g. the
  // alliance betrayal handler) pass applyWarmth:false so we only add the
  // missing fear + guilt and the cause trail.
  if (applyWarmth) bumpWarmth(victim, traitor, -2 * severity, `blindsided/crossed by ${traitor}`, ep);
  bumpDim(victim, traitor, 'fear', 1.2 * severity, `saw ${traitor} pull off a betrayal`, ep);
  bumpDim(traitor, victim, 'obligation', 0.4 * severity, `crossed ${victim} — owes them one`, ep);
}

// Dominating a challenge earns strategic respect and a little fear from onlookers.
export function recordChallengeDominance(winner, observers = [], { margin = 1, ep = null } = {}) {
  if (!winner) return;
  observers.forEach(o => {
    if (o === winner) return;
    bumpDim(o, winner, 'strategicRespect', 0.6 * margin, `${winner} dominated a challenge`, ep);
    bumpDim(o, winner, 'fear', 0.3 * margin, `${winner} is a challenge threat`, ep);
  });
}

// Being saved / shielded builds obligation and warmth toward the protector.
export function recordProtection(savior, saved, { strength = 1, ep = null } = {}) {
  if (!savior || !saved || savior === saved) return;
  bumpWarmth(saved, savior, 1.5 * strength, `${savior} had their back`, ep);
  bumpDim(saved, savior, 'obligation', 1.5 * strength, `${savior} saved/protected them`, ep);
}

// Threats / bullying: fear up, warmth down.
export function recordIntimidation(aggressor, target, { strength = 1, ep = null } = {}) {
  if (!aggressor || !target || aggressor === target) return;
  bumpDim(target, aggressor, 'fear', 1.0 * strength, `intimidated by ${aggressor}`, ep);
  bumpWarmth(target, aggressor, -0.8 * strength, `felt threatened by ${aggressor}`, ep);
}

// A romantic spark: mutual attraction.
export function recordAttractionSpark(a, b, { strength = 1, ep = null } = {}) {
  if (!a || !b || a === b) return;
  bumpDim(a, b, 'attraction', 1.5 * strength, `drawn to ${b}`, ep);
  bumpDim(b, a, 'attraction', 1.5 * strength, `drawn to ${a}`, ep);
}

// Someone visibly kept their word / took a bullet for the alliance.
export function recordLoyaltyProof(prover, beneficiary, { strength = 1, ep = null } = {}) {
  if (!prover || !beneficiary || prover === beneficiary) return;
  bumpWarmth(beneficiary, prover, 1.2 * strength, `${prover} proved loyal`, ep);
  bumpDim(beneficiary, prover, 'obligation', 0.8 * strength, `${prover} kept their word`, ep);
}

// Generic strategic-respect nudge (e.g. a slick vote read, an idol play witnessed).
export function recordStrategicRespect(from, to, amount = 1, reason = 'respected their game', ep = null) {
  bumpDim(from, to, 'strategicRespect', amount, reason, ep);
}

