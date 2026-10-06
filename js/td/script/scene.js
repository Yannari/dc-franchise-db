// ══════════════════════════════════════════════════════════════════════
// td/script/scene.js — a decided camp moment, before it has any words
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-06 §5. A camp event decides what happened (who, the ending,
// the bonds, the deal) and hands back a SCENE instead of a sentence. The words
// come afterwards (td/script/write.js), from the record, so a line can never
// contradict what the numbers did. Same contract as js/bb/script/scene.js.
//
//   kind     the pool family: 'deal.side', 'flow.gossip', ...
//   who      { a, b, c } — the parts. a speaks first; c is a third party.
//   data     what was decided: { ending, ... }; a person talked about goes here
//            as {target}, never in `who`.
//   seenBy   everybody there. Only they can learn from this scene.
//   spot     where it happened: the camp-access location id (setting-specific:
//            'dock', 'cabins', 'shoreline'...), with its label.
import { findConversationAccess, currentCampAccessEpisode } from '../../camp-access.js';

export function makeScene(kind, who, data = {}, seenBy = [], spot = null) {
  const people = Object.values(who).filter(Boolean);
  const seen = [...new Set([...people, ...seenBy.filter(Boolean)])];
  return { kind, who: { ...who }, data: { ...data }, seenBy: seen, spot: spot ? { ...spot } : null };
}

/**
 * Where two people talked, from the camp's own schedule — the same lookup the
 * access annotation runs after the feed is built, so the scene is staged where
 * the episode record says the talk happened. Pure: it reads the schedule.
 * Returns { spot, nearby } — nearby are the people in the same spot who are
 * not part of the talk (they may see it, depending on the scene).
 */
export function spotOf(ep, a, b, phase = 'pre') {
  const e = ep || currentCampAccessEpisode();
  if (!e || !a) return { spot: null, nearby: [] };
  const acc = b ? findConversationAccess(e, a, b, { phase, privacy: 0.35, slipAway: true }) : null;
  if (!acc?.possible || !acc.locationId) return { spot: null, nearby: [] };
  return { spot: { id: acc.locationId, label: acc.location, window: acc.windowId || null }, nearby: acc.nearby || [] };
}

/**
 * Knowledge has a witness (ADDING-A-SHOW §11.5 D). Anything a scene teaches a
 * player goes through here, and it refuses a learner who was not there.
 */
export function witness(scene, name) {
  if (!scene || !Array.isArray(scene.seenBy)) throw new Error('witness(): not a scene');
  if (!scene.seenBy.includes(name)) {
    throw new Error(`${name} learned from a ${scene.kind} scene they were not in (seen by ${scene.seenBy.join(', ')})`);
  }
  return true;
}
