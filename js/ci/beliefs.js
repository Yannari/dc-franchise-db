// ══════════════════════════════════════════════════════════════════════
// ci/beliefs.js — what each player believes about each profile (spec §5.2)
// ══════════════════════════════════════════════════════════════════════
//
// THE RULE THIS FILE EXISTS FOR: a belief only moves because of a scene the
// player saw. Every change names its scene, and a player not in that scene's
// `seenBy` throws — the "character who knows more than they should" bug class
// (ADDING-A-SHOW §11.5 D) caught at the source instead of in a transcript.
import { clamp } from './state.js';

export const RANGES = { real: [0, 1], threat: [0, 10], likesMe: [-10, 10] };

function fresh(state, obs) {
  const paranoia = state.mind[obs]?.paranoia ?? 2;
  return { real: clamp(0.85 - paranoia * 0.03, 0.5, 0.9), guessOf: null, threat: 3,
    likesMe: 0, alliesOf: [], ratedMe: null };
}

export function belief(state, obs, target) {
  const row = (state.beliefs[obs] ||= {});
  return (row[target] ||= fresh(state, obs));
}

function witnessed(scene, obs) {
  if (!scene || !scene.seenBy.includes(obs)) {
    throw new Error(`belief change for ${obs} from scene ${scene?.id} they did not see`);
  }
}

export function nudgeBelief(state, obs, target, field, delta, scene) {
  witnessed(scene, obs);
  const b = belief(state, obs, target);
  const [lo, hi] = RANGES[field];
  const before = b[field];
  b[field] = clamp(before + delta, lo, hi);
  state.beliefLog.push({ obs, target, field, delta: b[field] - before, scene: scene.id, day: state.day });
  return b[field];
}

export function setBelief(state, obs, target, field, value, scene) {
  witnessed(scene, obs);
  const b = belief(state, obs, target);
  const v = RANGES[field] ? clamp(value, ...RANGES[field]) : value;
  state.beliefLog.push({ obs, target, field, set: v, scene: scene.id, day: state.day });
  b[field] = v;
  return v;
}

export function noteAlly(state, obs, holder, ally, scene) {
  witnessed(scene, obs);
  const b = belief(state, obs, holder);
  if (!b.alliesOf.includes(ally)) b.alliesOf.push(ally);
}

export const suspicion = (state, obs, target) => 1 - belief(state, obs, target).real;
