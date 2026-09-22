// ══════════════════════════════════════════════════════════════════════
// pm/villa-vote.js — when the islanders finish what the public started
// ══════════════════════════════════════════════════════════════════════
//
// Four real formats (spec §9.2). Voters read friendship, who threatens their
// own couple, and how settled the couple they would be splitting looks — "you
// don't split a real couple" (spec §6.7). Never approval or fame.
import { friendship, romance } from './feelings.js';
import { attr } from './chemistry.js';
import { partnerOf } from './events.js';
import { coupleStrength } from './ladder.js';

export const DUMP_FORMATS = ['cross-gender', 'safe-pick-couple', 'one-stays', 'public'];

function affinity(state, v, t) {
  const mine = partnerOf(state, v);
  const threat = mine && (attr(state, t, mine) ?? 0) > 6 ? 2 : 0;
  const theirs = partnerOf(state, t);
  // The villa protects a couple that has made it official.
  const protect = theirs ? 3 * coupleStrength(state, t, theirs) : 0;
  return friendship(v, t) - threat + protect;
}

function tally(ballots, rng) {
  const count = new Map();
  for (const b of ballots) count.set(b.target, (count.get(b.target) || 0) + 1);
  const top = Math.max(...count.values());
  const tied = [...count].filter(([, c]) => c === top).map(([n]) => n);
  return tied[Math.floor(rng() * tied.length)];
}

export function villaDumping(state, { format, bottom, rng }) {
  const atRisk = bottom.flat();
  const voters = state.villa.filter(n => !atRisk.includes(n));
  const g = n => state.profiles[n].gender;
  if (format === 'public' || !voters.length) return { dumped: [...bottom[0]], ballots: [] };

  if (format === 'one-stays') {
    const [a, b] = bottom[0];
    const ballots = voters.map(v => ({ voter: v, target: affinity(state, v, a) >= affinity(state, v, b) ? b : a, channel: 'villa' }));
    return { dumped: [tally(ballots, rng)], ballots };
  }

  if (format === 'safe-pick-couple') {
    const ballots = voters.map(v => {
      const worst = [...bottom].sort((x, y) =>
        (affinity(state, v, x[0]) + affinity(state, v, x[1]))
        - (affinity(state, v, y[0]) + affinity(state, v, y[1])))[0];
      return { voter: v, target: worst[0], couple: [...worst], channel: 'villa' };
    });
    const lead = tally(ballots, rng);
    return { dumped: [...bottom.find(c => c.includes(lead))], ballots };
  }

  // cross-gender: each side votes one of the other side's at-risk islanders.
  const dumped = [], ballots = [];
  for (const side of ['f', 'm']) {
    const targets = atRisk.filter(n => g(n) !== side);
    const sideVoters = voters.filter(v => g(v) === side);
    if (!targets.length || !sideVoters.length) continue;
    const mine = sideVoters.map(v => ({ voter: v, channel: 'villa',
      target: [...targets].sort((x, y) => affinity(state, v, x) - affinity(state, v, y))[0] }));
    ballots.push(...mine);
    dumped.push(tally(mine, rng));
  }
  return { dumped, ballots };
}
