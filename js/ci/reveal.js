// ══════════════════════════════════════════════════════════════════════
// ci/reveal.js — when a profile's truth reaches a player (spec §5.3–§5.4)
// ══════════════════════════════════════════════════════════════════════
//
// Relationships live on PROFILE handles during the season. When a player
// learns who is really behind a profile (a visit, a goodbye video, a
// confession, the finale meet), their feelings are CONVERTED into feelings
// about the real person — and that person-to-person record is what the
// franchise ledger will keep (Plan 6).
//
//   words true, face false (protective catfish): warmth carries, respect up.
//     "The connection was real." — US 1 Shubham on Seaburn.
//   words false too (they lied about other players to you): resentment.
//   flirted with under a false gender: the attraction turns to resentment.
import { rel, peopleOf } from './state.js';
import { setBelief } from './beliefs.js';
import { RELATIONSHIP_DIMENSIONS, setRelationshipDimension } from '../relationships.js';

export const isRevealed = (state, obs, target) => !!state.revealed[obs]?.[target];

/** Did this profile tell `obs` anything false about another player? */
export function wordsTrue(state, target, obs) {
  return !state.claims.some(c => c.origin.by === target && c.truth === false && state.know[obs]?.[c.id]);
}

export function revealTo(state, obs, target, scene) {
  if (obs === target || isRevealed(state, obs, target)) return false;
  (state.revealed[obs] ||= {})[target] = true;
  const p = state.profiles[target];
  const truth = p.mode === 'catfish' ? 0 : p.mode === 'edited' ? 0.7 : 1;
  setBelief(state, obs, target, 'real', truth, scene);
  convertFeelings(state, obs, target);
  return true;
}

function convertFeelings(state, obs, target) {
  const p = state.profiles[target];
  const d = Object.fromEntries(RELATIONSHIP_DIMENSIONS.map(k => [k, rel(obs, target, k)]));
  if (p.mode === 'catfish') {
    const honestWords = wordsTrue(state, target, obs);
    const ideal = state.ideal[obs]?.[target] || 0;
    d.trust = d.trust * 0.7 + (honestWords ? 1 : -3);
    d.strategicRespect += 1.5;
    d.resentment += (honestWords ? 0 : 3) + ideal * 0.3;
    const realGender = state.people[p.players[0]].gender;
    if (d.attraction > 0 && p.shown.gender !== realGender) {
      d.resentment += d.attraction * 0.3;
      d.attraction *= 0.2;
    }
  } else if (p.mode === 'edited') {
    d.trust -= 0.5;
  }
  for (const a of peopleOf(state, obs)) for (const b of peopleOf(state, target)) {
    for (const [k, v] of Object.entries(d)) setRelationshipDimension(a, b, k, v);
  }
  return d;
}
