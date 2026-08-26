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
