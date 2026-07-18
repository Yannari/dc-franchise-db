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
import { addRelationshipDimension, getRelationshipDimensions } from './relationships.js';
import { addBond } from './bonds.js';
import { strategicReputation } from './reputation.js';

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
export function recordProtection(savior, saved, { strength = 1, applyWarmth = true, ep = null } = {}) {
  if (!savior || !saved || savior === saved) return;
  if (applyWarmth) bumpWarmth(saved, savior, 1.5 * strength, `${savior} had their back`, ep);
  bumpDim(saved, savior, 'obligation', 1.5 * strength, `${savior} saved/protected them`, ep);
}

// Threats / bullying: fear up, warmth down.
export function recordIntimidation(aggressor, target, { strength = 1, applyWarmth = true, ep = null } = {}) {
  if (!aggressor || !target || aggressor === target) return;
  bumpDim(target, aggressor, 'fear', 1.0 * strength, `intimidated by ${aggressor}`, ep);
  if (applyWarmth) bumpWarmth(target, aggressor, -0.8 * strength, `felt threatened by ${aggressor}`, ep);
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

// Convert a publicly demonstrated strategic track record into a modest respect
// floor. Raw strategic stats do not count: the player must have actually led
// pitches or accumulated visible big moves. Discrete accomplishments below can
// still push respect above this baseline.
function demonstratedRespectTarget(actor, ep) {
  const rep = strategicReputation(actor, ep);
  const pitches = rep.evidence?.pitches || 0;
  const bigMoves = gs.playerStates?.[actor]?.bigMoves || 0;
  if (pitches < 2 && bigMoves < 1) return 0;
  const control = Math.max(0, rep.control - 0.32) * 6;
  const persuasion = pitches >= 2 ? Math.max(0, rep.persuasion - 0.45) * 3 : 0;
  return Math.min(4, control + persuasion);
}

function applyDemonstratedReputationRespect(ep, cast, episodeNum) {
  cast.forEach(actor => {
    const publicTarget = demonstratedRespectTarget(actor, ep);
    if (publicTarget <= 0) return;
    cast.filter(observer => observer !== actor).forEach(observer => {
      const current = getRelationshipDimensions(observer, actor);
      // Personal bias changes the read slightly, but distrust cannot erase
      // plainly visible competence. Converging toward a floor avoids endlessly
      // awarding the same reputation every episode.
      const bias = Math.max(0.75, Math.min(1.1, 0.9 + current.trust * 0.025));
      const gap = publicTarget * bias - current.strategicRespect;
      const amount = Math.min(0.9, Math.max(0, gap * 0.55));
      if (amount >= 0.1) recordStrategicRespect(observer, actor, amount,
        `${actor}'s visible strategic track record is becoming hard to dismiss`, episodeNum);
    });
  });
}

// Apply respect only for accomplishments the relevant observer could actually
// see. Called once after Tribal, when the challenge, pitches and advantage
// results are all known. Small values accumulate into a season-long read.
export function applyObservedStrategicRespect(ep) {
  if (!ep || ep._observedStrategicRespectApplied) return;
  ep._observedStrategicRespectApplied = true;
  const episodeNum = ep.num ?? curEp();
  const cast = [...new Set((ep.tribalPlayers?.length ? ep.tribalPlayers : gs.activePlayers) || [])];

  if (ep.immunityWinner) {
    recordChallengeDominance(ep.immunityWinner, cast, { margin: 1, ep: episodeNum });
  }
  if (ep.immunityWinner && ep.sharedImmunity && ep.sharedImmunity !== ep.immunityWinner) {
    // The base twist already adds warmth. Record the directional social debt
    // without booking that warmth a second time.
    recordProtection(ep.immunityWinner, ep.sharedImmunity,
      { strength: 0.8, applyWarmth: false, ep: episodeNum });
  }

  (ep.idolPlays || []).forEach(play => {
    if (play.failed || play.misplay || play.fake || (play.votesNegated || 0) <= 0) return;
    const actor = play.player;
    if (!actor) return;
    if (play.playedFor && play.playedFor !== actor) {
      // Ally-idol code already grants a large mutual bond boost. This adds the
      // missing meaning: the saved player now owes the holder.
      recordProtection(actor, play.playedFor,
        { strength: Math.min(1.4, 0.7 + (play.votesNegated || 0) * 0.12), applyWarmth: false, ep: episodeNum });
    }
    const amount = Math.min(1.4, 0.45 + (play.votesNegated || 0) * 0.18);
    cast.filter(observer => observer !== actor).forEach(observer =>
      recordStrategicRespect(observer, actor, amount,
        `${actor} played an idol correctly and erased ${play.votesNegated} vote${play.votesNegated === 1 ? '' : 's'}`, episodeNum));
  });

  (ep.votePitches || []).forEach(pitch => {
    const coalition = [...new Set(pitch.confirmedCoalition || pitch.flipped || [])];
    if (!pitch.success || !pitch.pitcher || coalition.length < 2) return;
    const amount = Math.min(1.1, 0.35 + coalition.length * 0.1);
    coalition.filter(observer => observer !== pitch.pitcher).forEach(observer =>
      recordStrategicRespect(observer, pitch.pitcher, amount,
        `${pitch.pitcher} assembled a credible ${coalition.length}-vote coalition`, episodeNum));
  });

  applyDemonstratedReputationRespect(ep, cast, episodeNum);
}
