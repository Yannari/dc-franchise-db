// ══════════════════════════════════════════════════════════════════════
// tr/missions/index.js — the bespoke catalogue, and the switch that gates it
// ══════════════════════════════════════════════════════════════════════
//
// The four missions spec §9 asks for, and the picker `js/tr/missions.js` calls
// to choose between them.
//
// ── WHY THE CATALOGUE IS OFF BY DEFAULT, AND WHAT TURNS IT ON ─────────
//
// THE MOCKUP APPROVAL CONTRACT: "Simulation mechanics and failing tests may be
// built before visual approval. VP builder implementation may not." A bespoke
// mission that reached a played season before its VP builder existed would be
// an afternoon the visual player cannot draw — and tests/tr-vp.test.js renders
// every afternoon a season records and requires more than 200 characters of
// narration out of it, so that is not a cosmetic gap, it is a red suite.
//
// So `_bespokeEnabled` starts FALSE. Stage 1 ships the contract, the four
// simulations, the tests and the four mockups; stage 2 ships the VP builders
// and flips this to true in the same commit that makes the screens exist.
//
// THIS IS NOT A HOLD-OUT ON A GUARD. It is deliberately the OPPOSITE, and the
// distinction matters because this branch has narrowed three standing guards
// already. Because the catalogue cannot reach a played season, NOTHING in
// tests/tr-missions.test.js needed narrowing for this task: the money missions
// are still bit-identical on and off, the pot band is untouched, the alignment
// credibility sweep is untouched. The bespoke tests turn the switch on
// explicitly and run the missions directly, which is where the new claims are
// asserted and where they can fail.
//
// ── WHAT THE PICKER GUARANTEES ───────────────────────────────────────
//
// Never the same mission twice in a row (the archetype rotation's rule, and
// for the archetype rotation's reason: a season that runs one mission eight
// times has no missions in it), and never a mission whose `eligibility` says
// no. Everything else is a flat draw, because four missions weighted against
// each other is a balance decision nobody has measured yet.

import { drownedCauseway } from './drowned-causeway.js';
import { nightjarOrrery } from './nightjar-orrery.js';
import { longAccount } from './long-account.js';
import { ashVault } from './ash-vault.js';

/**
 * The catalogue, in the order they were written.
 *
 * FOUR WORLDS AND FOUR STAT SETS, which is the design rule rather than a
 * coincidence. Between them they use all nine valid stats: endurance/physical
 * (the wade), boldness/temperament (the ledge), mental/intuition (the bell and
 * the ledger), strategic (the gearing and the survey), social (the room),
 * loyalty (the shoring and the settlement). A cast member who is dead weight on
 * a sandbar is the one who wins the counting room, which is the only reason to
 * have four missions rather than one with four sets of nouns.
 */
export const TRAITORS_MISSIONS = Object.freeze([
  drownedCauseway,
  nightjarOrrery,
  longAccount,
  ashVault,
]);

/** Every bespoke mission id, for tests and for anything enumerating the catalogue. */
export const BESPOKE_MISSION_IDS = Object.freeze(TRAITORS_MISSIONS.map(m => m.id));

/**
 * Off until the VP builders exist. See the header — this is a release gate,
 * not a test hold-out, and stage 2 flips it in the commit that adds the screens.
 *
 * Exported as a setter rather than a mutable binding for the reason every other
 * switch in this codebase is (`_setMissionsEnabled`, `_setPactPotBlind`): a
 * module-level `let` that anything can assign has no single place to read the
 * current value from, and no way to say who turned it on.
 */
let _bespokeEnabled = false;
export function _setBespokeMissionsEnabled(on) { _bespokeEnabled = on !== false; }
export function bespokeMissionsEnabled() { return _bespokeEnabled; }

/** The mission with this id, or null. Used by the tests and by the VP dispatch. */
export function bespokeMission(id) {
  return TRAITORS_MISSIONS.find(m => m.id === id) || null;
}

/**
 * Choose a bespoke mission for this afternoon, or null.
 *
 * Returns null when the catalogue is gated off, when nothing is eligible, or
 * when the only eligible mission is the one that ran last — in which case the
 * caller falls back to the archetypes, which is the correct behaviour rather
 * than a failure: the format would rather run a stat-pair afternoon than repeat
 * yesterday's set.
 *
 * ONE RNG DRAW, whatever the field size. A draw per candidate would make the
 * missions' stream depend on how many missions happen to be eligible, so
 * adding a fifth mission would re-roll every afternoon of every recorded
 * season — the same reason `_runReliquary` takes one weighted draw for its
 * searcher instead of one per player.
 */
export function pickBespokeMission(ctx, rng, lastId = null) {
  if (!_bespokeEnabled) return null;
  const eligible = TRAITORS_MISSIONS.filter(m => {
    try { return m.eligibility(ctx) !== false; } catch { return false; }
  });
  const pool = eligible.filter(m => m.id !== lastId);
  if (!pool.length) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

export { createMissionCtx, validateMissionRecord, MISSION_BEHAVIOURS } from './contract.js';
