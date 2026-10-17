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
import { nudge } from './mind.js';
import { S, archetypeOf, addScene, kinOf, KIN_PULL } from './state.js';
import { betrayed, remember } from './rel.js';
import { noteAlliance } from './knowledge.js';
import { isOutsider } from './blocs.js';

const APPETITE = {
  'social-butterfly': 1.3, 'loyal-soldier': 1.3, showmancer: 1.1, hero: 1.1, mastermind: 1.2, schemer: 1.1,
  villain: 0.9, 'challenge-beast': 1.0, underdog: 1.1, goat: 1.0, 'perceptive-player': 1.0,
  hothead: 0.8, wildcard: 0.7, floater: 0.6, 'chaos-agent': 0.6,
};
const appetite = n => APPETITE[archetypeOf(n)] ?? 1;

// The user, 2026-10-16: "the alliance names are always the same". Twelve names taken in order made every season's
// first alliance The Shipwreck Crew. A pool for who formed it (all vets, all rookies, a mix), drawn per season.
const ALLIANCE_NAMES = {
  any: ['The Shipwreck Crew', 'Lagoon Sharks', 'The Riptide', 'Night Shift', 'The Undertow', 'Coral Club', 'The Dock Rats',
    'High Tide', 'The Bunk Six', 'Saltwater Syndicate', 'The Breakers', 'The Tide Pool', 'Rip Current', 'The Sandbar',
    'Low Tide', 'The Deep End', 'Dead Calm', 'The Reef', 'Storm Front', 'The Lifeguards', 'Second Wind', 'The Driftwood Club',
    'The Bonfire', 'Last Light', 'The Anchor', 'Rogue Wave', 'The Roof Crew', 'The Kitchen Table', 'Sunrise Club',
    'The Hammocks', 'Black Flag', 'The Lagoon Pact', 'Ground Zero', 'The Heat', 'Firewall', 'The Long Game'],
  vets: ['The Old Guard', 'The Veterans', 'Hall of Fame', 'The Dynasty', 'The Big Dogs', 'Old Money', 'The Legends', 'The Establishment'],
  rookies: ['The New Blood', 'The Fresh Faces', 'Rookie Row', 'The Underdogs', 'The Newcomers', 'Day Ones', 'The Uprising'],
};
// The name a new group takes: one nobody in this season has used, drawn from the pool that fits it.
export function allianceName(state, rng, members) {
  const vets = members.filter(n => !state.rookie?.[n]).length;
  const kind = vets === members.length ? 'vets' : vets === 0 ? 'rookies' : 'any';
  const free = list => list.filter(x => !state.alliances.some(a => a.name === x));
  const pool = (kind !== 'any' && rng() < 0.5 && free(ALLIANCE_NAMES[kind]).length) ? free(ALLIANCE_NAMES[kind]) : free(ALLIANCE_NAMES.any);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : `Alliance ${state.alliances.length + 1}`;
}

export const allianceOf = (state, name) => state.alliances.find(a => !a.ended && a.members.includes(name)) || null;
export const activeAlliances = state => state.alliances.filter(a => !a.ended);
// a bloc made inside a team (teams.js teamDailyReactions) takes new members only from that team while the teams stand
const teamFits = (state, al, n) => !al.teamId || state.teamsBroken || !state.teams?.length || state.teamOf?.[n] === al.teamId;

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
  // A couple wants each other in the group, old friends do too, and exes would rather not (state.js kinOf).
  p += KIN_PULL[kinOf(state, a, b)] || 0;
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
    const name = allianceName(state, rng, members);
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
      addScene(state, 'alliance-betrayal', [x.a, x.b], { alliance: al.id, name: al.name, how: x.how }, state.active, 'public');
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

export function leave(state, al, name, why, extra = {}) {
  if (!al.members.includes(name)) return;
  al.members = al.members.filter(m => m !== name);
  // when the one leaving is the leader, the other part is somebody still in the group (a scene with the
  // same person on both sides read "Ireland: I'm sorry. / Ireland: That's it? You're out?")
  const other = al.leader !== name ? al.leader : al.members.find(m => state.active.includes(m)) || al.members[0];
  (al.former ||= []).push(name);
  if (other) addScene(state, 'alliance-leave', [name, other], { alliance: al.id, name: al.name, why, ...extra }, al.members.concat(name), 'private');
  if (al.leader === name && al.members.length) {
    al.leader = [...al.members].sort((a, b) => S(b, 'strategic') - S(a, 'strategic'))[0];
  }
}

export function endAlliance(state, al, why) {
  if (al.ended) return;
  al.ended = true; al.endedEp = state.ep; al.why = why;
  addScene(state, 'alliance-end', al.members.filter(m => state.active.includes(m)), { alliance: al.id, name: al.name, why }, al.members, 'private');
}

// An alliance grows: once it has run a vote or two, it brings in the free agent
// it trusts most (the swing votes it recruited are the obvious candidates).
// This is how a power alliance becomes one, and its growth is a storyline.
export function growAlliances(state, rng) {
  const cap = Math.max(4, Math.round(state.active.length / 3));
  for (const al of activeAlliances(state)) {
    const inside = al.members.filter(m => state.active.includes(m));
    if (inside.length >= cap || state.ep - al.formedEp < 1) continue;
    // never back into a group they left (they walked out, or were thrown out: the room remembers)
    const free = state.active.filter(n => !allianceOf(state, n) && !(al.former || []).includes(n) && teamFits(state, al, n));
    const best = free.map(n => ({ n, p: inside.reduce((a, m) => a + pull(state, n, m), 0) / inside.length + pull(state, al.leader, n) * 0.5 }))
      .sort((a, b) => b.p - a.p)[0];
    if (!best || best.p < 1.6 || rng() > 0.35 + S(al.leader, 'strategic') * 0.03) continue;
    al.members.push(best.n);
    for (const m of inside) addBond(m, best.n, 0.5);
    noteAlliance(state, al, [best.n]);
    addScene(state, 'alliance-grow', [al.leader, best.n], { alliance: al.id, name: al.name, size: al.members.length }, al.members, 'private');
  }
}


// ── alliances that change shape (the user, 2026-10-16: "do we have alliance removal, one person deciding to
// remove themselves, or they get removed, or an alliance dissolving altogether, and all the variants?") ──
// The group already threw people out (pushed-out, cut-loose, exposed) and ended (betrayal, numbers, final).
// These are the rest, each with what it costs:
//   walked         a member who no longer fits the group leaves on their own
//   walked-friend  a member leaves because the group is coming for their partner or a close friend
//   defected       a member jumps to another alliance they are closer to (a betrayal to the old one)
//   merged         two smaller alliances join against a bigger one
//   drifted        a group gone cold ends by agreement
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const inside = (state, al) => al.members.filter(m => state.active.includes(m));
// how well a member fits a group: their pull to the rest of it, on average
const fitOf = (state, al, n) => {
  const rest = inside(state, al).filter(m => m !== n);
  return rest.length ? rest.reduce((t, m) => t + pull(state, n, m), 0) / rest.length : 0;
};
const leaderTargets = (state, al) => (state.plans?.[al.leader]?.targets || []).filter(t => state.active.includes(t));

export function allianceShifts(state, rng) {
  const done = new Set();   // one change per person a day
  for (const al of activeAlliances(state)) {
    if (state.ep - (al.formedEp || 0) < 1) continue;
    const ins = inside(state, al);
    if (ins.length < 2) continue;
    // a group gone cold ends by agreement: nobody betrayed anybody, they just stopped being a group
    const pairs = [];
    for (let i = 0; i < ins.length; i++) for (let j = i + 1; j < ins.length; j++) pairs.push(getPerceivedBond(ins[i], ins[j]));
    const warmth = pairs.reduce((t, v) => t + v, 0) / pairs.length;
    if (warmth < 0.3 && rng() < (0.3 - warmth) * 0.35) {
      for (const m of ins) nudge(state, m, 'paranoia', 0.3);
      endAlliance(state, al, 'drifted');
      continue;
    }
    for (const m of ins) {
      if (m === al.leader || done.has(m) || al.ended) continue;
      // the group is coming for somebody they love: their partner, or a close friend
      const friend = leaderTargets(state, al).find(t => t !== m && !al.members.includes(t) && (kinOf(state, m, t) === 'couple' || getPerceivedBond(m, t) >= 5));
      const fit = fitOf(state, al, m);
      // somewhere better: another alliance they are much closer to, with room
      const cap = Math.max(4, Math.round(state.active.length / 3));
      // (never back into a group they walked out of or were thrown out of)
      const better = activeAlliances(state).filter(o => o !== al && inside(state, o).length < cap && !(o.former || []).includes(m) && teamFits(state, o, m))
        .map(o => ({ o, gain: fitOf(state, o, m) - fit })).sort((x, y) => y.gain - x.gain)[0];
      const nice = NICE.has(archetypeOf(m));
      if (better && better.gain > 2.2 && (!nice || friend) && rng() < (better.gain - 2.2) * 0.12 + (1 - S(m, 'loyalty') / 10) * 0.05) {
        // the old group hears it as a betrayal; the new one gains a vote and a person who has done this before
        const from = al.name, to = better.o;
        leave(state, al, m, 'defected', { to: to.name });
        for (const x of inside(state, al)) { addBond(x, m, -1.2); betrayed(x, m, 0.8); }
        to.members.push(m);
        for (const x of inside(state, to)) if (x !== m) addBond(x, m, 0.5);
        noteAlliance(state, to, [m]);
        addScene(state, 'alliance-switch', [to.leader, m], { alliance: to.id, name: to.name, size: to.members.length, from }, to.members, 'private');
        done.add(m);
        continue;
      }
      // (measured: 0.18 + loyalty * 0.15 a day walked 1.4 people a season out for a friend; now about half that)
      if (friend && rng() < 0.05 + (S(m, 'loyalty') / 10) * 0.06) {
        // loyal to the person, not the group
        leave(state, al, m, 'walked-friend', { target: friend });
        addBond(m, friend, 0.8); remember(friend, m, 'stood-up-for-me', 1);
        for (const x of inside(state, al)) addBond(x, m, -0.6);
        done.add(m);
        continue;
      }
      if (fit < 0 && rng() < -fit * 0.05) {
        leave(state, al, m, 'walked');
        for (const x of inside(state, al)) addBond(x, m, -0.4);
        nudge(state, m, 'paranoia', 0.5);
        done.add(m);
      }
    }
  }
  // two smaller groups join against a bigger one, when their leaders like each other enough
  const live = activeAlliances(state).map(al => ({ al, n: inside(state, al).length })).sort((x, y) => y.n - x.n);
  if (live.length >= 3 && state.ep >= 3) {
    const big = live[0];
    const small = live.slice(1).filter(x => x.n >= 2 && x.n < big.n);
    for (let i = 0; i < small.length; i++) for (let j = i + 1; j < small.length; j++) {
      const A = small[i].al, B = small[j].al;
      if (A.ended || B.ended || small[i].n + small[j].n > Math.round(state.active.length / 2)) continue;
      // a team's bloc does not merge across the teams while they stand
      if ((A.teamId || B.teamId) && !state.teamsBroken && state.teams?.length && A.teamId !== B.teamId) continue;
      const cross = (pull(state, A.leader, B.leader) + pull(state, B.leader, A.leader)) / 2;
      if (cross < 1.5 || rng() > (cross - 1.5) * 0.06 + (S(A.leader, 'strategic') + S(B.leader, 'strategic')) * 0.002) continue;
      const [keep, fold] = small[i].n >= small[j].n ? [A, B] : [B, A];
      const moving = inside(state, fold);
      for (const m of moving) { if (!keep.members.includes(m)) keep.members.push(m); for (const x of inside(state, keep)) if (x !== m) addBond(x, m, 0.4); }
      fold.ended = true; fold.endedEp = state.ep; fold.why = 'merged'; fold.into = keep.id;
      noteAlliance(state, keep, moving);
      addScene(state, 'alliance-merge', [keep.leader, fold.leader, ...inside(state, keep).filter(m => m !== keep.leader && m !== fold.leader)],
        { alliance: keep.id, name: keep.name, from: fold.name, against: big.al.name }, keep.members, 'private');
      return;
    }
  }
}
