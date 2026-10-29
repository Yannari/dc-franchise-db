// ══════════════════════════════════════════════════════════════════════
// ss/public-votes.js — the night the public decides differently
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 5 (docs/superpowers/specs/2026-10-28-secret-story-family5-design.md).
//   THE HOUSE DECIDES (S8): the public names the bottom two; the housemates, one by one, live, say which of them
//   leaves.
//   THE VOTE TO ELIMINATE (S13): the public votes against, not to save: the most disliked leaves, not the least loved.
//   THE TICKET (S9, S14): late in the season, the housemates vote one of their own straight through the next prime.
// Pure: decisions for the adapter (js/bb/secret-story.js) to read.

import { fileOf } from './public.js';

export const VOTE_MODES = ['save', 'evict', 'house-decides'];

/** How the public votes at this prime: `state.forceVoteMode[wk]` for tests. */
export function voteMode(state, ctx, { nominees = [] } = {}) {
  const wk = ctx.week ?? 0;
  const forced = state.forceVoteMode?.[wk];
  if (forced && VOTE_MODES.includes(forced)) return forced;
  const rng = ctx.rng || Math.random;
  const used = state.voteModes || {};
  const r = rng();
  if (wk >= 3 && nominees.length >= 3 && !Object.values(used).includes('house-decides') && r < 0.1) return 'house-decides';
  if (wk >= 4 && !Object.values(used).includes('evict') && r >= 0.1 && r < 0.2) return 'evict';
  return 'save';
}

/** The public's vote AGAINST: percents to eliminate, read from heat and the warmth that is missing. */
export function evictShares(state, names = [], rng = Math.random, noise = 0.2) {
  const dislike = n => {
    const f = fileOf(state, n);
    return Math.max(0.3, 1 + Math.max(0, f.heat) * 1.2 - Math.max(0, f.warmth) * 0.6 - Math.max(0, f.pity) * 0.3 + Math.max(0, f.seen) * 0.05);
  };
  const raw = Object.fromEntries(names.map(n => [n, Math.pow(dislike(n), 1.35) * Math.exp((rng() - 0.5) * 2 * noise)]));
  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const pct = Object.fromEntries(names.map(n => [n, Math.max(1.5, (raw[n] / total) * 100)]));
  const sum = Object.values(pct).reduce((a, b) => a + b, 0);
  return Object.fromEntries(names.map(n => [n, Math.round((pct[n] / sum) * 1000) / 10]));
}

/** The house decides between the public's bottom two: each housemate, live, names the one they keep least. */
export function houseDecides(ctx, { bottom = [], house = [], publicLowest = null } = {}) {
  const rng = ctx.rng || Math.random;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const [x, y] = bottom;
  const votes = {};
  for (const v of house.filter(n => !bottom.includes(n))) votes[v] = B(v, x) + (rng() - 0.5) * 0.6 < B(v, y) + (rng() - 0.5) * 0.6 ? x : y;
  const tally = { [x]: 0, [y]: 0 };
  for (const t of Object.values(votes)) tally[t]++;
  // (a tie goes the public's way: the lower of the two)
  const evicted = tally[x] === tally[y] ? (publicLowest || x) : tally[x] > tally[y] ? x : y;
  return { votes, tally, evicted, tie: tally[x] === tally[y] };
}

/** The ticket: once, late in the season (eight or fewer in the house), the house votes one of its own through. */
export function ticketDue(state, ctx, { house = [] } = {}) {
  const wk = ctx.week ?? 0;
  const forced = state.forceTicket?.[wk];
  if (forced === 'none') return false;
  if (forced) return true;
  if (state.ticket || house.length > 8 || house.length < 5) return false;
  return (ctx.rng || Math.random)() < 0.2;
}
export function ticketVote(state, ctx, { house = [] } = {}) {
  const wk = ctx.week ?? 0;
  const rng = ctx.rng || Math.random;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const votes = {};
  // each votes for the one they would most like to keep, never themselves; a strategic voter for a weaker player
  for (const v of house) {
    const others = house.filter(n => n !== v);
    votes[v] = others.slice().sort((a, b) => (B(v, b) - B(v, a)) + (S(v, 'strategic') - 5) * 0.08 * ((S(b, 'social') - S(a, 'social'))) + (rng() - 0.5) * 0.4)[0];
  }
  const tally = {};
  for (const t of Object.values(votes)) tally[t] = (tally[t] || 0) + 1;
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  const winner = top ? top[0] : null;
  if (winner) { state.nextImmune ||= {}; (state.nextImmune[wk + 1] ||= []).includes(winner) || state.nextImmune[wk + 1].push(winner); }
  state.ticket = { week: wk, winner, votes, tally };
  return { kind: 'ticket', winner, votes, tally, effects: { bond: Object.entries(votes).filter(([, t]) => t === winner).map(([v]) => [winner, v, 0.5]), pop: [] } };
}
