// ══════════════════════════════════════════════════════════════════════
// pm/public-vote.js — the country votes
// ══════════════════════════════════════════════════════════════════════
//
// ONE OF THE FILES ALLOWED TO READ THE PUBLIC LEDGER (spec §8, and
// tests/pm-ledger-readers.test.js). The public votes on what AIRED, which is
// all the ledger holds. Nothing an islander decides lives in this file.
import { coupleScore } from './ledger.js';
import { romance } from './feelings.js';

// How the country's votes split. A couple's share is proportional to its
// approval plus a floor every couple with fans gets (BASE): that is what the
// real UK series 5 final looks like — 48.8 / 25.6 / 18.2 / 7.4 — and it is
// what this gives for approvals around 80 / 45 / 35 / 15 (46 / 26 / 20 / 9).
// A softmax over the same scores (the first version) handed a leading couple
// 98% of a mid-season vote and 91% of a final. Only the shares move with this:
// the ORDER, so the bottom couples and the winners, is the same either way.
const BASE = 40;
const FLOOR = 8;

function shares(state, couples, rng) {
  const rows = couples.map(c => ({ couple: c, score: coupleScore(state.ledger, c[0], c[1]) + (rng() - 0.5) * 6 }));
  // Softplus rather than a hard clamp, so two disliked couples still rank
  // apart; FLOOR is the core fans even the villains' couple keeps (the real
  // bottom couple still took 7.4%).
  const w = rows.map(r => FLOOR + 8 * Math.log1p(Math.exp((r.score + BASE) / 8)));
  const sum = w.reduce((a, b) => a + b, 0);
  rows.forEach((r, i) => { r.share = w[i] / sum; });
  return rows;
}

export function publicVote(state, { rng, bottom = 2 }) {
  const rows = shares(state, state.couples, rng);
  const ranked = [...rows].sort((a, b) => a.share - b.share);
  return {
    shares: rows.map(r => ({ couple: r.couple, share: r.share })),
    bottom: ranked.slice(0, Math.min(bottom, rows.length)).map(r => r.couple),
  };
}

export function finalVote(state, { rng }) {
  return shares(state, state.couples, rng)
    .sort((a, b) => b.share - a.share)
    .map((r, i) => ({ couple: r.couple, share: r.share, placement: i + 1 }));
}

/** The envelope. Measured in the audit: the real UK show never saw a steal. */
export function splitOrSteal(state, couple, { rng }) {
  const holder = couple[Math.floor(rng() * couple.length)];
  const other = couple[0] === holder ? couple[1] : couple[0];
  const prof = state.profiles[holder];
  // Measured at the first weights: 17% of winners stole. No UK winner ever
  // has, so the whole curve is a third of what it was — a `money` islander
  // who never fell for them is still the one who might.
  const p = Math.max(0, Math.min(0.9, (0.01 + (prof.intent === 'money' ? 0.2 : 0)
    + 0.06 * (1 - (prof.stats.loyalty ?? 5) / 10) + 0.06 * (1 - romance(holder, other) / 10)) * 0.4));
  return { holder, choice: rng() < p ? 'steal' : 'split', p };
}
