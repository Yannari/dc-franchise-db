// ══════════════════════════════════════════════════════════════════════
// ch/rel.js — The Challenge on the shared relationship substrate
// ══════════════════════════════════════════════════════════════════════
//
// The Challenge does not keep feelings of its own. It reads and writes the
// same directional, multidimensional model Total Drama and Big Brother use
// (js/relationships.js: affection, trust, strategicRespect, fear,
// obligation, resentment, attraction), the same semantic events
// (js/relationship-events.js, every change with a cause the screen can read),
// and the same receipts (js/strategy-memory.js: "voted for me", "called me
// out", "stood up for me"). Everything lives on the season's own `gs`.
//
// This file is the vocabulary the Challenge's moments translate into:
//
//   an Arena win             dominance: respect and fear from everyone watching
//   a call-out               intimidation of the one called; a receipt either way
//   a vote, out loud         a receipt for the one voted for; a friend's vote is
//                            a betrayal
//   a tiebreak that saves    protection: obligation to the one who saved
//   a deal kept / broken     loyalty proof / betrayal
//   an apology accepted      a pro-social receipt ("made-amends")
//   a fight                  intimidation, resentment
//   a partner who picked you "worked-with-me"
//
// Readers are the adapters the decisions use, never the raw bond alone.
import { gs } from '../core.js';
import { getBond } from '../bonds.js';
import { getRelationshipDimensions, relationshipDecisionProfile, pitchTrust, tacticalCooperation, targetProtection } from '../relationships.js';
import { recordBetrayal, recordChallengeDominance, recordProtection, recordIntimidation,
  recordAttractionSpark, recordLoyaltyProof, recordStrategicRespect } from '../relationship-events.js';
import { rememberStrategy, strategicMemoryScore, strongestStrategicMemory, memoriesAbout } from '../strategy-memory.js';

const ep = () => gs.episode || 0;

// ── readers ──────────────────────────────────────────────────────────
export const dims = (a, b) => getRelationshipDimensions(a, b);
export const trustOf = (a, b) => (dims(a, b).trust || 0) * 0.6 + getBond(a, b) * 0.4;
export const respectOf = (a, b) => dims(a, b).strategicRespect || 0;
export const fearOf = (a, b) => dims(a, b).fear || 0;
export const resentOf = (a, b) => dims(a, b).resentment || 0;
export const oweOf = (a, b) => dims(a, b).obligation || 0;
export const attractOf = (a, b) => dims(a, b).attraction || 0;
export const warmthOf = (a, b) => relationshipDecisionProfile(a, b).warmth;
export const protectOf = (a, b) => targetProtection(a, b);
export const cooperateWith = (a, organiser) => tacticalCooperation(a, organiser);
export const believePitch = (a, pitcher) => pitchTrust(a, pitcher);
// What `a` holds against `b`: receipts, weighted by how much each mattered and
// how long ago (positive = against, negative = for).
export const receipts = (a, b) => strategicMemoryScore(a, b, ep() + 1);
export const worstReceipt = (a, b) => strongestStrategicMemory(a, b, ep() + 1);
export const memories = (a, b) => memoriesAbout(a, b);

// A grudge, as one number: resentment plus the receipts held against them.
export const grudgeOf = (a, b) => resentOf(a, b) * 0.6 + Math.max(0, receipts(a, b)) * 0.8;

// ── writers ──────────────────────────────────────────────────────────
export function remember(observer, subject, type, severity = 1, details = {}) {
  return rememberStrategy(observer, subject, type, ep(), severity, details);
}

export function arenaWon(winner, loser, watchers, { margin = 1 } = {}) {
  recordChallengeDominance(winner, watchers.filter(w => w !== winner), { margin, ep: ep() });
  recordIntimidation(winner, loser, { strength: 0.5, applyWarmth: false, ep: ep() });
}

export function dailyWon(winner, watchers, margin = 0.5) {
  recordChallengeDominance(winner, watchers.filter(w => w !== winner), { margin, ep: ep() });
}

export function calledOut(by, opponent, reason) {
  recordIntimidation(by, opponent, { strength: reason === 'prove' ? 0.6 : 1, applyWarmth: reason === 'grudge', ep: ep() });
  remember(opponent, by, 'called-me-out', reason === 'grudge' ? 2.2 : 1.6, { reason });
  // Calling out the strongest is a statement the house respects.
  if (reason === 'prove') recordStrategicRespect(opponent, by, 0.6, `${by} called out the strongest available`, ep());
}

export function votedFor(voter, target, { friend = false } = {}) {
  remember(target, voter, 'voted-for-me', friend ? 2.4 : 1.4, { friend });
  if (friend) recordBetrayal(target, voter, { severity: 0.8, applyWarmth: false, ep: ep() });
}

export function saved(by, who, strength = 1) {
  recordProtection(by, who, { strength, ep: ep() });
  remember(who, by, 'saved-me', 1.5 * strength);
}

export function betrayed(victim, traitor, severity = 1, type = 'alliance-betrayal') {
  recordBetrayal(victim, traitor, { severity, ep: ep() });
  remember(victim, traitor, type, 1.5 + severity);
}

export function keptWord(prover, beneficiary, strength = 1) {
  recordLoyaltyProof(prover, beneficiary, { strength, ep: ep() });
  remember(beneficiary, prover, 'loyalty', 1 + strength * 0.5);
}

export function intimidated(aggressor, target, strength = 1) {
  recordIntimidation(aggressor, target, { strength, ep: ep() });
}

export function sparked(a, b, strength = 1) {
  recordAttractionSpark(a, b, { strength, ep: ep() });
}

export function respected(from, to, amount, why) {
  recordStrategicRespect(from, to, amount, why, ep());
}
