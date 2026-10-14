// ══════════════════════════════════════════════════════════════════════
// ch/blocs.js — the power structure, as each player SEES it
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother's lesson (js/bb/blocs.js): a group's power over the game is real
// from the day it forms, but its power over other people's DECISIONS starts at
// zero and grows only from evidence somebody could have seen. Without that,
// everybody aims at the same name and nobody ever organises against anybody.
//
// The Challenge has a source of evidence Big Brother lacks: the vote is said
// out loud. Who voted with whom is public, so a power alliance gives itself
// away by voting as one. Each observer's read of "the power" is:
//
//   - what they KNOW (alliance facts: their own group, spotted meetings,
//     rumours, an alliance outed in front of the room — ch/knowledge.js), and
//   - what they DEDUCE from the open votes: people who voted the same name in
//     two of the last three votes look like a bloc.
//
// Outsiders to the power organise against it: a term in their vote (aim at
// the power) and a pull toward each other (formAlliances reads `outsiders`).
import { believedAlliances } from './knowledge.js';
import { S } from './state.js';

// Pairs who voted the same name in at least two of the last three votes.
export function coVoters(state) {
  const votes = state.episodes.slice(-3).flatMap(e => e.votes || []);
  const same = {};
  for (const v of votes) {
    const by = {};
    for (const b of v.ballots) (by[b.target] ||= []).push(b.voter);
    for (const group of Object.values(by)) {
      for (const a of group) for (const b of group) if (a < b) same[`${a}|${b}`] = (same[`${a}|${b}`] || 0) + 1;
    }
  }
  return Object.entries(same).filter(([, n]) => n >= 2).map(([k]) => k.split('|'));
}

// The largest group `observer` believes is running things, that they are not
// part of. { members, source } or null.
export function perceivedPower(state, observer) {
  const known = Object.values(believedAlliances(state, observer)).filter(m => !m.includes(observer));
  let best = known.sort((a, b) => b.length - a.length)[0] || null;
  let source = best ? 'known' : null;
  // Deduction from the open votes, for anybody who pays attention.
  if (S(observer, 'intuition') + S(observer, 'strategic') >= 9) {
    const pairs = coVoters(state).filter(([a, b]) => a !== observer && b !== observer && state.active.includes(a) && state.active.includes(b));
    // Grow a cluster from the most connected voter.
    const deg = {};
    for (const [a, b] of pairs) { deg[a] = (deg[a] || 0) + 1; deg[b] = (deg[b] || 0) + 1; }
    const hub = Object.entries(deg).sort((x, y) => y[1] - x[1])[0]?.[0];
    if (hub) {
      const cluster = [hub, ...pairs.filter(p => p.includes(hub)).map(p => (p[0] === hub ? p[1] : p[0]))];
      if (cluster.length >= 3 && (!best || cluster.length > best.length)) { best = cluster; source = 'voting-pattern'; }
    }
  }
  if (!best || best.length < 3) return null;
  return { members: best, source };
}

// How much `observer` wants to break the power by voting `target` in.
export function breakThePower(state, observer, target) {
  const p = perceivedPower(state, observer);
  if (!p || !p.members.includes(target)) return 0;
  const share = p.members.length / Math.max(1, state.active.length);
  return (share - 0.15) * 4 * (0.4 + S(observer, 'strategic') / 10);
}

export function isOutsider(state, name) {
  return !state.alliances.some(a => !a.ended && a.members.includes(name)) && !!perceivedPower(state, name);
}
