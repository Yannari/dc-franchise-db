// Coaches — franchise winners and finalists who train a tribe without playing.
//
// THE ARCHITECTURE IS ONE SPLIT. A coach is in `players`, so pStats, pronouns,
// archetype and romanticCompat all resolve for them. A coach is NOT in
// `gs.activePlayers`, which 135 modules read to decide who competes, votes,
// holds immunity, sits on the jury and takes a placement — none of which a
// coach does. Being outside that array is not a workaround for the twist, it
// IS the twist, and promotion at the merge is one push into it.
import { gs } from './core.js';

/** Every coach still standing. */
export function activeCoaches() {
  return (gs.coaches || []).filter(c => !c.promoted);
}

export function isCoach(name) {
  return activeCoaches().some(c => c.name === name);
}

export function coachRecord(name) {
  return activeCoaches().find(c => c.name === name) || null;
}

export function coachesOf(tribeName) {
  return activeCoaches().filter(c => c.tribe === tribeName);
}

/**
 * Sessions scale with tribe size so somebody is always left out. A budget that
 * covers everyone produces no favouritism, and favouritism is the twist.
 */
export function sessionsFor(tribeSize) {
  return Math.max(1, Math.floor(tribeSize / 3));
}

export function addCoach({ name, tribe, sessionsPerEp = 2 }) {
  if (!gs.coaches) gs.coaches = [];
  const record = { name, tribe, saveCard: 'unused', promoted: false, sessionsPerEp };
  gs.coaches.push(record);
  return record;
}

export function removeCoach(name) {
  if (!gs.coaches) return;
  gs.coaches = gs.coaches.filter(c => c.name !== name);
}

/** Matches RI_TRAINING_CAP in js/rescue-island.js — one banked ceiling. */
export const COACH_TRAINING_CAP = 3.0;

/** Everything positive banked on this contestant, across every coach. */
export function trainingTotal(contestant) {
  let sum = 0;
  for (const perCoach of Object.values(gs.coachTraining || {})) {
    for (const amount of Object.values(perCoach[contestant] || {})) {
      if (amount > 0) sum += amount;
    }
  }
  return sum;
}

export function trainingBonus(contestant, stat) {
  let sum = 0;
  for (const perCoach of Object.values(gs.coachTraining || {})) {
    sum += perCoach[contestant]?.[stat] || 0;
  }
  return sum;
}

/**
 * Bank a session's result. Returns what was actually banked.
 *
 * The cap bounds HELP only. A negative amount always lands in full: a coach
 * below 5 in a stat teaches badly, and a contestant already at the ceiling must
 * still be able to be made worse.
 */
export function bankTraining(coach, contestant, stat, amount) {
  if (!gs.coachTraining) gs.coachTraining = {};
  if (!gs.coachTraining[coach]) gs.coachTraining[coach] = {};
  if (!gs.coachTraining[coach][contestant]) gs.coachTraining[coach][contestant] = {};

  let take = amount;
  if (amount > 0) take = Math.min(amount, Math.max(0, COACH_TRAINING_CAP - trainingTotal(contestant)));
  const slot = gs.coachTraining[coach][contestant];
  slot[stat] = (slot[stat] || 0) + take;
  return take;
}

/**
 * Delete everything one coach built and hand it back.
 *
 * Called when a coach is voted out. The returned map is what the tribe just
 * lost, and the fallout events narrate it.
 */
export function revokeCoachTraining(coach) {
  const lost = (gs.coachTraining || {})[coach] || {};
  if (gs.coachTraining) delete gs.coachTraining[coach];
  return lost;
}
