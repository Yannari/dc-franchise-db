// ══════════════════════════════════════════════════════════════════════
// pm/villa-vote.js — when the islanders finish what the public started
// ══════════════════════════════════════════════════════════════════════
//
// Four real formats (spec §9.2). Voters read friendship, who threatens their
// own couple, and how settled the couple they would be splitting looks — "you
// don't split a real couple" (spec §6.7). Never approval or fame.
import { friendship } from './feelings.js';
import { attr } from './chemistry.js';
import { partnerOf } from './events.js';
import { coupleStrength } from './ladder.js';

// The last four are Plan 4.5 (docs/superpowers/plans/…-plan-4.5-twists.md),
// each read from real seasons: the favourite couple picks (UK 9, 11, 12, 13),
// one side saves one of the other's bottom (UK 9, US 8), the couples name the
// least compatible (UK 10, 13, US 8), and the dumped come back (UK 11-13).
export const DUMP_FORMATS = ['cross-gender', 'safe-pick-couple', 'one-stays', 'public',
  'top-couple-picks', 'save-one', 'couples-vote', 'ex-islanders'];

function affinity(state, v, t) {
  const mine = partnerOf(state, v);
  // Your own partner, always: a boy whose girlfriend is at risk saves her.
  // Measured: without it, Marcus saved Amber and left his own Chloe to go.
  if (mine === t) return 100;
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

const coupleAffinity = (state, voters, c) => voters.reduce((s, v) => s + affinity(state, v, c[0]) + affinity(state, v, c[1]), 0);

/**
 * The public's favourite couple sends one of the bottom couples home. They
 * decide TOGETHER, out loud, at the fire pit: the couple the two of them are
 * least attached to, with no thought of the public (they don't know the votes).
 */
export function topCouplePicks(state, { bottom, pickers, rng }) {
  const ranked = [...bottom].map(c => [c, coupleAffinity(state, pickers, c) + (rng() - 0.5) * 0.5])
    .sort((x, y) => x[1] - y[1]);
  const dumped = [...ranked[0][0]];
  return { dumped, ballots: pickers.map(v => ({ voter: v, target: dumped[0], couple: dumped, channel: 'villa' })) };
}

/** One side saves one of the other side's bottom islanders; the rest go. */
export function saveOne(state, { atRisk, rng }) {
  const g = n => state.profiles[n].gender;
  const voters = state.villa.filter(v => !atRisk.includes(v) && g(v) !== g(atRisk[0]));
  if (!voters.length) return { dumped: atRisk.slice(1), saved: atRisk[0], ballots: [] };
  const ballots = voters.map(v => ({ voter: v, save: true, channel: 'villa',
    target: [...atRisk].sort((x, y) => affinity(state, v, y) - affinity(state, v, x))[0] }));
  const saved = tally(ballots, rng);
  return { dumped: atRisk.filter(n => n !== saved), saved, ballots };
}

/**
 * Each couple names the couple they think is least compatible (UK 10 d16,
 * UK 13 d18, US 8 d25). A couple reads another as weak when it looks it — a
 * low rung — and when they have no reason to protect it. The two couples
 * named most are at risk.
 */
export function couplesVote(state, { rng, atRisk = 2, immune = [] }) {
  const votes = [];
  for (const c of state.couples) {
    const others = state.couples.filter(o => o !== c);
    if (!others.length) continue;
    const target = [...others].map(o => [o, coupleAffinity(state, c, o) + 4 * coupleStrength(state, o[0], o[1])
      + (rng() - 0.5) * 0.5]).sort((x, y) => x[1] - y[1])[0][0];
    votes.push({ couple: [...c], target: [...target] });
  }
  const count = new Map();
  for (const v of votes) { const k = v.target.join('|'); count.set(k, (count.get(k) || 0) + 1); }
  const safe = c => !c.some(n => immune.includes(n));
  const vulnerable = [...count].sort((x, y) => y[1] - x[1] || rng() - 0.5)
    .map(([k]) => state.couples.find(c => c.join('|') === k)).filter(c => c && safe(c)).slice(0, atRisk);
  // Fewer couples named than places at risk (eight couples can name three):
  // the rest are the weakest-looking of the unnamed, or a semi-final that
  // has to trim to four could not (measured: a 40-islander final of five).
  const unnamed = state.couples.filter(c => !vulnerable.includes(c) && safe(c))
    .sort((x, y) => coupleStrength(state, x[0], x[1]) - coupleStrength(state, y[0], y[1]));
  while (vulnerable.length < atRisk && unnamed.length) vulnerable.push(unnamed.shift());
  return { votes, vulnerable };
}

/**
 * What an ex-islander holds against somebody still in the villa: they voted
 * the ex out, or they were the ex's partner and have coupled up since.
 */
export function grudgeOf(state, ex, n) {
  if ((state.dumpedBy?.[ex] || []).includes(n)) return 'voted';
  if (state.leftBehind?.[ex] === n && partnerOf(state, n)) return 'moved-on';
  return null;
}

/** The dumped islanders who come back to vote: those who lived here, most recent first. */
export function returningExes(state, max = 8) {
  // Not anyone back in the villa already (a returning islander), and nobody twice.
  return [...new Set([...(state.gone || [])].reverse()
    .filter(x => x.ep > (state.ledger.firstEp?.[x.name] ?? x.ep) && !state.villa.includes(x.name))
    .map(x => x.name))].slice(0, max);
}

/** The exes vote which of the vulnerable couples leaves; the most-voted goes. */
export function exIslandersVote(state, { exes, vulnerable, rng, dump = 1 }) {
  const ballots = exes.map(ex => {
    const score = c => c.reduce((s, n) => s + friendship(ex, n) - (grudgeOf(state, ex, n) ? 6 : 0), 0) + (rng() - 0.5) * 0.5;
    const worst = [...vulnerable].sort((x, y) => score(x) - score(y))[0];
    const held = worst.find(n => grudgeOf(state, ex, n)) || null;
    return { voter: ex, target: held || worst[0], couple: [...worst], channel: 'exes',
      grudge: held ? grudgeOf(state, ex, held) : null };
  });
  const count = new Map();
  for (const b of ballots) { const k = b.couple.join('|'); count.set(k, (count.get(k) || 0) + 1); }
  const order = [...count].sort((x, y) => y[1] - x[1] || rng() - 0.5).map(([k]) => k);
  for (const c of vulnerable) if (!order.includes(c.join('|'))) order.push(c.join('|'));
  const dumped = order.slice(0, dump).flatMap(k => k.split('|'));
  return { dumped, ballots };
}
