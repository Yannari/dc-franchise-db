// ══════════════════════════════════════════════════════════════════════
// pm/public-vote.js — the country votes
// ══════════════════════════════════════════════════════════════════════
//
// ONE OF THE FILES ALLOWED TO READ THE PUBLIC LEDGER (spec §8, and
// tests/pm-ledger-readers.test.js). The public votes on what AIRED, which is
// all the ledger holds. Nothing an islander decides lives in this file.
import { coupleScore } from './ledger.js';
import { romance } from './feelings.js';

const TEMP = 10;

function shares(state, couples, rng) {
  const rows = couples.map(c => ({ couple: c, score: coupleScore(state.ledger, c[0], c[1]) + (rng() - 0.5) * 6 }));
  const max = Math.max(...rows.map(r => r.score));
  const w = rows.map(r => Math.exp((r.score - max) / TEMP));
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
  const p = Math.max(0, Math.min(0.9, 0.02 + (prof.intent === 'money' ? 0.25 : 0)
    + 0.1 * (1 - (prof.stats.loyalty ?? 5) / 10) + 0.1 * (1 - romance(holder, other) / 10)));
  return { holder, choice: rng() < p ? 'steal' : 'split', p };
}
