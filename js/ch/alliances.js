// ══════════════════════════════════════════════════════════════════════
// ch/alliances.js — the power alliance and the blocs
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.4 and §4.7. On the real show one big alliance runs the house vote
// for weeks, and the season is about who breaks it. The Traitors' blocs
// (tr/alliances.js) form from bonds and social reach; this is the same idea
// with the Challenge's own pulls:
//
//   - a LEADER: strategic and social, with somebody to lead;
//   - members join by perceived bond to the leader and to each other,
//     original-show loyalty (the Total Drama people, the Big Brother people),
//     and vets pulling rookies in as numbers (a rookie joins for safety);
//   - each episode the leader proposes a target (`proposeTarget`), and each
//     member weighs it in the vote by loyalty;
//   - it CRACKS when the target is a member's friend, or when an ally votes for
//     or calls out another ally (`afterVote`).
//
// Archetype appetite as in The Traitors: a social-butterfly or loyal-soldier is
// always in somebody's circle; a floater or a chaos-agent drifts.
import { getPerceivedBond, addBond } from '../bonds.js';
import { S, archetypeOf, addScene } from './state.js';
import { betrayed } from './rel.js';
import { noteAlliance } from './knowledge.js';
import { isOutsider } from './blocs.js';

const APPETITE = {
  'social-butterfly': 1.3, 'loyal-soldier': 1.3, showmancer: 1.1, hero: 1.1, mastermind: 1.2, schemer: 1.1,
  villain: 0.9, 'challenge-beast': 1.0, underdog: 1.1, goat: 1.0, 'perceptive-player': 1.0,
  hothead: 0.8, wildcard: 0.7, floater: 0.6, 'chaos-agent': 0.6,
};
const appetite = n => APPETITE[archetypeOf(n)] ?? 1;

const ALLIANCE_NAMES = ['The Shipwreck Crew', 'Lagoon Sharks', 'The Riptide', 'Night Shift', 'The Old Guard',
  'The Undertow', 'Coral Club', 'The Dock Rats', 'High Tide', 'The Bunk Six', 'Saltwater Syndicate', 'The Breakers'];

export const allianceOf = (state, name) => state.alliances.find(a => !a.ended && a.members.includes(name)) || null;
export const activeAlliances = state => state.alliances.filter(a => !a.ended);

// How much `a` wants to be in a group with `b`: perceived bond, the same old
// show, and a vet seeing a rookie's vote.
export function pull(state, a, b) {
  let p = getPerceivedBond(a, b);
  if (state.origin[a] && state.origin[a] === state.origin[b]) p += 2.2 * state.cliqueStrength;
  if (!state.rookie[a] && state.rookie[b]) p += 0.6;      // a vet sees a number
  if (state.rookie[a] && !state.rookie[b]) p += 0.8;      // a rookie sees safety
  if (state.rookie[a] && state.rookie[b]) p += 0.5;
  // Outsiders to the power find each other (blocs.js).
  if (state.ep > 1 && isOutsider(state, a) && isOutsider(state, b)) p += 1.2;
  return p;
}

// Form alliances: a few leaders, each recruiting. Called early (days 1-3), and
// again whenever the house has drifted enough for a new group to make sense.
export function formAlliances(state, rng, { max = 3 } = {}) {
  const free = state.active.filter(n => !allianceOf(state, n));
  if (activeAlliances(state).length >= max || free.length < 3) return [];
  const made = [];
  const leaders = free
    .map(n => ({ item: n, w: Math.pow((S(n, 'strategic') * 0.6 + S(n, 'social') * 0.4) / 10, 3) * appetite(n) }))
    .sort((x, y) => y.w - x.w);
  for (const { item: leader } of leaders) {
    if (activeAlliances(state).length >= max) break;
    if (allianceOf(state, leader)) continue;
    if (rng() > 0.35 + S(leader, 'strategic') * 0.05) continue;
    const pool = state.active.filter(n => n !== leader && !allianceOf(state, n));
    // Size: a core of three or four to start (a power alliance is GROWN, not
    // founded at full size: growAlliances), a third of the house at most.
    const cap = Math.min(4, Math.max(3, Math.round(state.active.length / 3)));
    const ranked = pool.map(n => ({ n, p: pull(state, leader, n) + pull(state, n, leader) * 0.5 }))
      .filter(x => x.p > 0.8).sort((x, y) => y.p - x.p);
    const members = [leader];
    for (const { n } of ranked) {
      if (members.length >= cap) break;
      // The candidate weighs the group: their pull to its members, their appetite.
      const want = members.reduce((acc, m) => acc + pull(state, n, m), 0) / members.length * appetite(n);
      if (want + (rng() - 0.5) * 2 > 1.2) members.push(n);
    }
    if (members.length < 3) continue;
    const name = ALLIANCE_NAMES.find(x => !state.alliances.some(a => a.name === x)) || `Alliance ${state.alliances.length + 1}`;
    const al = { id: state.alliances.length + 1, name, leader, members, formedEp: state.ep, formedDay: state.day, ended: false,
      origin: members.every(m => state.origin[m] && state.origin[m] === state.origin[leader]) ? state.origin[leader] : null };
    state.alliances.push(al);
    for (const a of members) for (const b of members) if (a < b) addBond(a, b, 0.8);
    noteAlliance(state, al);
    addScene(state, 'alliance-form', members, { alliance: al.id, name, leader, origin: al.origin }, members, 'private');
    made.push(al);
  }
  return made;
}

// The power alliance: the biggest working one.
export function powerAlliance(state) {
  const live = activeAlliances(state).filter(a => a.members.filter(m => state.active.includes(m)).length >= 3);
  return live.sort((a, b) => b.members.length - a.members.length)[0] || null;
}

// After a vote and a call-out: did an ally turn on an ally? Did the target
// fall on somebody's friend? Cracks end an alliance or push a member out.
export function afterVote(state, rng, { ballots, votedIn, calledOut, by }) {
  for (const al of activeAlliances(state)) {
    const inside = al.members.filter(m => state.active.includes(m));
    const betrayals = [];
    for (const b of ballots) if (al.members.includes(b.voter) && al.members.includes(b.target)) betrayals.push({ a: b.voter, b: b.target, how: 'vote' });
    if (calledOut && al.members.includes(by) && al.members.includes(calledOut)) betrayals.push({ a: by, b: calledOut, how: 'callout' });
    for (const x of betrayals) {
      addBond(x.a, x.b, x.how === 'callout' ? -2 : -1.2);
      betrayed(x.b, x.a, x.how === 'callout' ? 1.4 : 1);
      for (const m of inside) if (m !== x.a && m !== x.b) addBond(m, x.a, -0.6);
      addScene(state, 'alliance-betrayal', [x.a, x.b], { alliance: al.id, how: x.how }, state.active, 'public');
    }
    if (betrayals.length) {
      // The betrayer goes, or the alliance does: by how many it angered.
      const hurt = betrayals.length / Math.max(1, inside.length);
      if (hurt >= 0.34 || rng() < 0.45 + hurt) {
        endAlliance(state, al, 'betrayal');
      } else {
        for (const x of betrayals) leave(state, al, x.a, 'pushed-out');
      }
    }
    if (inside.length < 3 && !al.ended) endAlliance(state, al, 'numbers');
  }
}

export function leave(state, al, name, why) {
  if (!al.members.includes(name)) return;
  al.members = al.members.filter(m => m !== name);
  // when the one leaving is the leader, the other part is somebody still in the group (a scene with the
  // same person on both sides read "Ireland: I'm sorry. / Ireland: That's it? You're out?")
  const other = al.leader !== name ? al.leader : al.members.find(m => state.active.includes(m)) || al.members[0];
  if (other) addScene(state, 'alliance-leave', [name, other], { alliance: al.id, why }, al.members.concat(name), 'private');
  if (al.leader === name && al.members.length) {
    al.leader = [...al.members].sort((a, b) => S(b, 'strategic') - S(a, 'strategic'))[0];
  }
}

export function endAlliance(state, al, why) {
  if (al.ended) return;
  al.ended = true; al.endedEp = state.ep; al.why = why;
  addScene(state, 'alliance-end', al.members.filter(m => state.active.includes(m)), { alliance: al.id, why }, al.members, 'private');
}

// An alliance grows: once it has run a vote or two, it brings in the free agent
// it trusts most (the swing votes it recruited are the obvious candidates).
// This is how a power alliance becomes one, and its growth is a storyline.
export function growAlliances(state, rng) {
  const cap = Math.max(4, Math.round(state.active.length / 3));
  for (const al of activeAlliances(state)) {
    const inside = al.members.filter(m => state.active.includes(m));
    if (inside.length >= cap || state.ep - al.formedEp < 1) continue;
    const free = state.active.filter(n => !allianceOf(state, n));
    const best = free.map(n => ({ n, p: inside.reduce((a, m) => a + pull(state, n, m), 0) / inside.length + pull(state, al.leader, n) * 0.5 }))
      .sort((a, b) => b.p - a.p)[0];
    if (!best || best.p < 1.6 || rng() > 0.35 + S(al.leader, 'strategic') * 0.03) continue;
    al.members.push(best.n);
    for (const m of inside) addBond(m, best.n, 0.5);
    noteAlliance(state, al, [best.n]);
    addScene(state, 'alliance-grow', [al.leader, best.n], { alliance: al.id, name: al.name, size: al.members.length }, al.members, 'private');
  }
}
