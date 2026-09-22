// ══════════════════════════════════════════════════════════════════════
// pm/circle.js — friends, and the villa as a group (spec §6.9)
// ══════════════════════════════════════════════════════════════════════
//
// Confidants carry opinions ("the girls don't rate him"); girl code and the
// boys' code punish grafting on a friend's couple; friends at Casa pull each
// other ("it's a lads' holiday"); and how harshly the villa judges an act
// depends on how much it likes the one who did it — the double standard
// Movie Night gets accused of.
import { friendship } from './feelings.js';
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';
import { coupleStrength } from './ladder.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const partnerOf = (state, n) => { const c = state.couples.find(x => x.includes(n)); return c ? (c[0] === n ? c[1] : c[0]) : null; };

export function confidantOf(state, n) {
  let best = null, score = 2;
  for (const o of state.villa) {
    if (o === n || o === partnerOf(state, n)) continue;
    const s = friendship(n, o) + 0.5 * getRelationshipDimension(n, o, 'trust');
    if (s > score) { best = o; score = s; }
  }
  return best;
}

/** What `judge` thinks of `target`, -1..1. */
export const verdict = (state, judge, target) =>
  clamp((friendship(judge, target) + 0.5 * getRelationshipDimension(judge, target, 'trust')) / 10, -1, 1);

/** How harshly `judge` reads what `actor` did: 0.5 for a close friend, 1.5 for a rival. */
export const judgement = (state, judge, actor) => 1 - 0.5 * clamp(friendship(judge, actor) / 10, -1, 1);

/** Grafting on a couple costs the grafter with everyone who protects that couple. */
export function girlCode(state, grafter, [x, y]) {
  const turned = [];
  const strength = coupleStrength(state, x, y);
  for (const v of state.villa) {
    if (v === grafter || v === x || v === y) continue;
    const protective = Math.max(friendship(v, x), friendship(v, y)) / 10;
    if (protective <= 0.3) continue;
    const hit = -(0.8 + 1.2 * strength) * protective * judgement(state, v, grafter);
    addRelationshipDimension(v, grafter, 'affection', hit);
    addRelationshipDimension(v, grafter, 'resentment', -hit * 0.5);
    turned.push(v);
  }
  return turned;
}

/** Friends' Casa choices so far pull this islander, weighted by how little loyalty holds them. */
export function peerPressure(state, n, decisions) {
  const friends = decisions.filter(d => d.name !== n && friendship(n, d.name) > 4);
  if (!friends.length) return 0;
  const twisted = friends.filter(d => d.choice === 'twist').length / friends.length;
  return (twisted - 0.5) * (1 - state.profiles[n].stats.loyalty / 10) * 0.5;
}
