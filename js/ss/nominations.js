// ══════════════════════════════════════════════════════════════════════
// ss/nominations.js — who a housemate names in the confessional, and why
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §8. Not Big Brother's "who can I get the votes to remove":
// in the House of Secrets you nominate, in order,
//   1. whoever is CLOSING IN ON YOUR SECRET (you feel it: they watch you,
//      they asked the wrong question, they buzzed you);
//   2. whoever took your kitty, or whoever you buzzed and got wrong;
//   3. the people you cannot stand;
//   4. a strong player (a big kitty, a sharp hunter);
//   5. your mission's target, if the Voice asked you to get them nominated;
// and you think twice before naming the public's favourite: it is pointless
// (the country saves them) and the country notices.
//
// Every pick carries its REASON, because commandment 6 says a nomination is
// justified out loud in the confessional, and the screen says it.
//
// Pure: state + the hunt's context `{ stat, bond, rng, week, pop }`.

import { theoryOf, secretOf } from './hunt.js';
import { missionById } from './missions.js';

const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };

/** How much `voter` wants `cand` nominated, and the main reason. */
export function nominationWish(state, ctx, voter, cand) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const parts = [];
  // 1. They are closing in on MY secret. You sense it with intuition.
  const th = theoryOf(state, cand, voter);
  if (th && !secretOf(state, voter)?.found) {
    const felt = th.conf * (0.35 + st(ctx, voter, 'intuition') / 10 * 0.65);
    parts.push([felt * 4.5, 'suspects-me']);
  }
  // 2. History: they buzzed me; they took my kitty; I lost money buzzing them.
  const buzzes = state.buzzes || [];
  if (buzzes.some(b => b.by === cand && b.target === voter && b.outcome !== 'right')) parts.push([2.4, 'buzzed-me']);
  if (buzzes.some(b => b.by === cand && b.target === voter && b.outcome === 'right')) parts.push([3.0, 'took-my-kitty']);
  if (buzzes.some(b => b.by === voter && b.target === cand && b.outcome === 'wrong')) parts.push([1.2, 'cost-me']);
  // 3. Bonds.
  const bd = ctx.bond?.(voter, cand) ?? 0;
  parts.push([-bd * 0.55, bd < -2 ? 'cannot-stand' : 'bond']);
  // 4. A strong player: a big kitty, a sharp hunter.
  const kitty = Number(state.kitty?.[cand]) || 0;
  parts.push([Math.min(2, kitty / 20000) * 0.8 + (st(ctx, cand, 'intuition') + st(ctx, cand, 'strategic')) * 0.04, 'threat']);
  // 5. A mission: get them nominated (the holder, and the friends they lobby).
  for (const m of (state.missions || []).filter(x => x.status === 'active' && x.week === week)) {
    const e = missionById(m.missionId);
    if (!e || e.judged !== 'event') continue;
    if (e.event === 'target-nominated' && m.target === cand) {
      if (m.holders.includes(voter)) parts.push([5, 'mission']);
      else if ((ctx.bond?.(voter, m.holders[0]) ?? 0) >= 3) parts.push([1.6, 'talked-into-it']);
    }
    if (e.event === 'self-nominated' && m.holders[0] === cand) parts.push([1.4, 'annoying']);
  }
  // 6. A couple votes together, and a strategist would rather split it; the ones who plotted it this week mean it
  //    (js/ss/love.js: "strategy to put the couple in the sas", the user, 2026-10-29).
  const plot = state.love?.plots?.[week];
  if (plot && plot.by.includes(voter) && plot.couple.includes(cand)) parts.push([3.2, 'the-couple']);
  else if ((state.love?.couples || []).some(c => c.includes(cand) && !c.includes(voter)) && st(ctx, voter, 'strategic') >= 6) parts.push([0.6 + st(ctx, voter, 'strategic') * 0.08, 'the-couple']);
  // 7. A promise bought with a clue in the clue room (js/ss/clue-room.js): "not this week". Most keep it.
  if ((state.clueRoom?.deals?.[week] || []).some(d => d.promised === voter && d.spare === cand)) parts.push([-(3 + st(ctx, voter, 'loyalty') * 0.35), 'promise']);
  // The public's favourite is a wasted vote, and the house learns that as the
  // weeks go by.
  const pop = Number(ctx.pop?.(cand)) || 0;
  parts.push([-Math.max(0, pop) * 0.25 * Math.min(1, week / 8), 'favourite']);
  parts.push([rng() * 1.6, 'gut']);
  const score = parts.reduce((s, [v]) => s + v, 0);
  const reason = parts.filter(([, r]) => !['gut', 'favourite', 'bond'].includes(r)).sort((a, b) => b[0] - a[0])[0];
  return { score, reason: reason && reason[0] > 0.8 ? reason[1] : (bd < -1 ? 'cannot-stand' : 'gut') };
}

/**
 * The ballots. `voters` name two each from `pool`; ties for the second chair
 * go to a second round among the tied (the real show did this), and a tie that
 * survives it puts all of them up.
 */
export function castNominations(state, ctx, { voters = [], pool = [], extraVotes = {}, seats = 2, double = [], invert = false, picksPer = 2 } = {}) {
  const ballots = [];
  const tally = Object.fromEntries(pool.map(n => [n, 0]));
  for (const v of voters) {
    // (the inverted week, js/ss/nomination-twists.js: they name who they want to SAVE, the ones they least want gone)
    const ranked = pool.filter(n => n !== v).map(n => ({ n, ...nominationWish(state, ctx, v, n) })).sort((a, b) => (invert ? a.score - b.score : b.score - a.score));
    const picks = ranked.slice(0, Math.max(1, picksPer));
    // (a double vote, bought in the secret room, counts twice)
    for (const p of picks) tally[p.n] = (tally[p.n] || 0) + (double.includes(v) ? 2 : 1);
    ballots.push({ voter: v, picks: picks.map(p => p.n), reasons: Object.fromEntries(picks.map(p => [p.n, p.reason])) });
  }
  for (const [n, k] of Object.entries(extraVotes)) if (n in tally) tally[n] += invert ? -k : k;
  if (invert) {
    // the least saved go up (an extra vote against counts as one save fewer)
    const S0 = Math.max(1, Math.min(seats, pool.length));
    const order = Object.keys(tally).sort((a, b) => tally[a] - tally[b]);
    return { nominees: order.slice(0, S0), ballots, tally, secondRound: null, inverted: true };
  }
  const ranked = Object.keys(tally).sort((a, b) => tally[b] - tally[a]);
  // (how many go up is the Voice's call each week: two, sometimes three or four; the caller says)
  const S = Math.max(1, Math.min(seats, ranked.length));
  let nominees = ranked.slice(0, S);
  let secondRound = null;
  if (ranked.length > S && tally[ranked[S - 1]] === tally[ranked[S]]) {
    const cutT = tally[ranked[S - 1]];
    const tied = ranked.filter(n => tally[n] === cutT);
    const keep = ranked.filter(n => tally[n] > cutT);
    const need = S - keep.length;
    const second = Object.fromEntries(tied.map(n => [n, 0]));
    for (const v of voters) {
      const choice = tied.filter(n => n !== v).map(n => ({ n, s: nominationWish(state, ctx, v, n).score })).sort((a, b) => b.s - a.s)[0];
      if (choice) second[choice.n]++;
    }
    const order = Object.keys(second).sort((a, b) => second[b] - second[a]);
    const cut = second[order[need - 1]];
    const winners = order.filter((n, i) => i < need || second[n] === cut);
    nominees = [...keep, ...winners];
    secondRound = { tied, votes: second, stillTied: winners.length > need };
  }
  return { nominees, ballots, tally, secondRound };
}
