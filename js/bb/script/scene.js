// ══════════════════════════════════════════════════════════════════════
// bb/script/scene.js — a decided moment, before it has any words
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-01 §4.2. An event decides what happened (the ending, the
// result), applies its consequences, and hands back a SCENE: who played which
// part, what was decided, and who was in the room to see it. The words come
// afterwards, from the record (bb/script/write.js), so a line can never
// contradict what the numbers did.
//
//   kind     the pool family: 'friction.dishes', 'friction.food', ...
//   who      { a, b, c } — the parts. a speaks first; c is a third party.
//   data     what was decided: { ending: 'blowup' | 'snipe' | 'smoothed', ... }
//   seenBy   everybody in the room. Only they can learn from this scene.
//   room     where it happened (house-events.js BB_ROOMS)

export function makeScene(kind, who, data = {}, seenBy = [], room = null) {
  const people = Object.values(who).filter(Boolean);
  const seen = [...new Set([...people, ...seenBy.filter(Boolean)])];
  return { kind, who: { ...who }, data: { ...data }, seenBy: seen, room };
}

/**
 * Knowledge has a witness (§17.1 #2, ADDING-A-SHOW §11.5 D, enforced at the
 * source). Anything a scene teaches a houseguest goes through here, and it
 * refuses a learner who was not in the room.
 */
export function witness(scene, name) {
  if (!scene || !Array.isArray(scene.seenBy)) throw new Error('witness(): not a scene');
  if (!scene.seenBy.includes(name)) {
    throw new Error(`${name} learned from a ${scene.kind} scene they were not in (seen by ${scene.seenBy.join(', ')})`);
  }
  return true;
}

/** Run `learn` for `name` only if they saw `scene`; throws otherwise. */
export function learnFrom(scene, name, learn) {
  witness(scene, name);
  return learn();
}
