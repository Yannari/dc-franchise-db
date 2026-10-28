// ══════════════════════════════════════════════════════════════════════
// ss/final.js — the secret of the house, the semi-final, the final week
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §18.
//
// THE SECRET OF THE HOUSE: a riddle hidden in the house all season (seasons
// 4–7 and 13: portraits, numbers in every room, letters spelling FINALE). Its
// clues turn up through the season; whoever solves it in the semi-final week
// wins a place in the final, and the Voice offers to buy that place back.
//
// THE SEMI-FINAL: the hunt's last week. At the semi prime the hunt closes, the
// secrets nobody found are unveiled, and the Voice pays every one of them for
// being kept that long.
//
// THE FINAL WEEK: the eliminated come back for a day, a few at a time; the
// final prime runs each finalist's journey, then the public's shares from last
// place to first, and the winner takes the cheque ($100,000, the user's call)
// on top of their kitty.
//
// Pure: state + ctx `{ stat, bond, rng, week }`.

import { mint, balance } from './kitty.js';
import { secretOf } from './hunt.js';

export const CHEQUE = 100000;
export const KEPT_BONUS = 10000;
const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const bondOf = (ctx, a, b) => Number(ctx?.bond?.(a, b)) || 0;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** The riddles, in the spirit of the real ones. Each: what the house is told, the answer, the clues in order. */
export const HOUSE_RIDDLES = [
  { id: 'letters', riddle: 'Six letters are hidden in this house. Put them in the right order.', answer: 'the word FINALE',
    clues: ['an F under a sofa cushion', 'an I on the back of the confessional mirror', 'an N taped inside the fridge door', 'an A painted on the bottom of the pool', 'an L tucked in a book in the library', 'an E on the oven clock at midnight'] },
  { id: 'portraits', riddle: 'Some of the portraits in this house are watching you. How many?', answer: 'seven portraits',
    clues: ['a portrait in the hallway whose eyes follow you', 'a second one above the dining table', 'two more in the girls\' bedroom', 'one in the bathroom, behind the mirror', 'one in the store, behind the cereal', 'the last one, in the confessional itself'] },
  { id: 'numbers', riddle: 'Every room hides a number. Add them up.', answer: 'forty-two',
    clues: ['a six in the pattern of the bathroom tiles', 'a nine on the confessional clock that never moves', 'a four stitched into a cushion', 'a twelve on the bottom of a garden chair', 'a three drawn in the steam of the shower', 'an eight on the back of the clue table'] },
  { id: 'song', riddle: 'A song plays every night at midnight. Its first word is the answer.', answer: 'the word "always"',
    clues: ['the song only plays in the garden', 'it is the same song every night', 'the first word is sung by a woman', 'it starts with the letter A', 'the word means "forever"', 'it has six letters'] },
];

export function planHouseSecret(state, rng = Math.random) {
  const r = HOUSE_RIDDLES[Math.floor(rng() * HOUSE_RIDDLES.length)];
  state.houseSecret = { id: r.id, riddle: r.riddle, answer: r.answer, clues: r.clues.slice(), next: 0, seen: {}, solvedBy: null, sold: false };
  return state.houseSecret;
}

/**
 * A clue to the secret of the house turns up: the one who finds it (`to`), and
 * whoever is sharp enough to notice them finding it.
 */
export function houseSecretClue(state, ctx, { house = [], to = null } = {}) {
  const hs = state.houseSecret;
  if (!hs || hs.solvedBy || hs.next >= hs.clues.length) return null;
  const rng = ctx.rng || Math.random;
  const finder = to && house.includes(to) ? to : house.slice().sort((a, b) => st(ctx, b, 'intuition') - st(ctx, a, 'intuition') + (rng() - 0.5) * 6)[0];
  if (!finder) return null;
  const clue = hs.clues[hs.next++];
  hs.seen[finder] = (hs.seen[finder] || 0) + 1;
  const noticed = house.filter(n => n !== finder && rng() < st(ctx, n, 'intuition') / 10 * 0.35);
  for (const n of noticed) hs.seen[n] = (hs.seen[n] || 0) + 0.5;
  return { type: 'ss-house-secret', week: ctx.week ?? 0, finder, clue, noticed, n: hs.next, of: hs.clues.length,
    beats: [{ text: `${finder} finds a clue to the secret of the house: ${clue}.`, players: [finder, ...noticed].slice(0, 3), badgeText: 'THE HOUSE', badgeClass: 'gold', part: 'house-secret' }] };
}

/**
 * The semi-final week: somebody solves the secret of the house, or nobody does.
 * The solver wins a place in the final, and the Voice offers to buy it back.
 */
export function solveHouseSecret(state, ctx, { house = [] } = {}) {
  const hs = state.houseSecret;
  if (!hs || hs.solvedBy) return null;
  const rng = ctx.rng || Math.random;
  const score = n => (hs.seen[n] || 0) * 0.22 + st(ctx, n, 'mental') / 10 * 0.3 + st(ctx, n, 'intuition') / 10 * 0.2 + rng() * 0.3;
  const best = house.map(n => ({ n, s: score(n) })).sort((a, b) => b.s - a.s)[0];
  if (!best || best.s < 0.62) return { type: 'ss-house-secret-end', week: ctx.week ?? 0, solved: false, answer: hs.answer,
    beats: [{ text: 'Nobody solves the secret of the house.', players: [], badgeText: 'THE HOUSE', badgeClass: 'grey', part: 'house-secret' }] };
  hs.solvedBy = best.n;
  // the Voice's offer: the place in the final, for money
  const offer = 15000 + Math.round(rng() * 7) * 5000;
  const greed = (st(ctx, best.n, 'strategic') - st(ctx, best.n, 'loyalty') + 10) / 20;
  const sells = rng() < clamp(0.15 + greed * 0.35 + (offer - 15000) / 35000 * 0.25);
  if (sells) { hs.sold = true; mint(state, best.n, offer, 'sold the place in the final', ctx.week ?? 0); }
  return { type: 'ss-house-secret-end', week: ctx.week ?? 0, solved: true, by: best.n, answer: hs.answer, riddle: hs.riddle, offer, sold: sells,
    beats: [{ text: sells ? `${best.n} solves the secret of the house, then sells the place in the final for $${offer.toLocaleString('en-US')}.` : `${best.n} solves the secret of the house and keeps the place in the final.`,
      players: [best.n], badgeText: 'THE HOUSE', badgeClass: 'gold', part: 'house-secret' }] };
}

/** Who holds a place in the final already (solved the house's secret and kept it). */
export const finalPlace = state => (state?.houseSecret?.solvedBy && !state.houseSecret.sold ? state.houseSecret.solvedBy : null);

/**
 * The semi prime: the hunt closes, the secrets nobody found are unveiled, and
 * every one kept this long is paid.
 */
export function unveilSecrets(state, ctx, { house = [] } = {}) {
  state.huntClosed = true;
  const out = [];
  for (const s of state.secrets || []) {
    if (s.found || s.unveiled) continue;
    const in_ = (s.holders || []).filter(h => house.includes(h));
    if (!in_.length) continue;
    s.unveiled = ctx.week ?? 0;
    for (const h of in_) mint(state, h, KEPT_BONUS, 'kept the secret to the semi-final', ctx.week ?? 0);
    out.push({ holders: in_, text: s.text });
  }
  return out;
}

/**
 * The final week: the eliminated come back for a day. Each one's visit, by who
 * they were in the house: a reunion with their closest finalist, a reckoning
 * with whoever found their secret or nominated them most.
 */
export function finalWeekReturns(state, ctx, { finalists = [], eliminated = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const visits = [];
  for (const n of eliminated) {
    const friend = finalists.slice().sort((a, b) => bondOf(ctx, n, b) - bondOf(ctx, n, a))[0];
    const foundBy = secretOf(state, n)?.foundBy;
    const enemy = foundBy && finalists.includes(foundBy) ? foundBy : finalists.slice().sort((a, b) => bondOf(ctx, n, a) - bondOf(ctx, n, b))[0];
    const kind = enemy && bondOf(ctx, n, enemy) <= -3 && rng() < 0.6 ? 'reckoning' : 'reunion';
    visits.push({ who: n, kind, with: kind === 'reckoning' ? enemy : friend, foundBy: foundBy || null });
  }
  return visits;
}

/** Each finalist's season in a few lines: the biggest things the public remembers. */
export function journeyOf(state, n) {
  const f = state.public?.[n] || {};
  const all = [...(f.highlights || []), ...(f.log || [])].filter(l => l.why && l.d > 0).sort((a, b) => b.d - a.d);
  // the biggest moments, from different weeks and different things, then told in order
  const seen = new Set(), weeks = new Set(), out = [];
  for (const l of all) {
    if (seen.has(l.why) || weeks.has(l.week)) continue;
    seen.add(l.why); weeks.add(l.week); out.push(l);
    if (out.length === 4) break;
  }
  return out.sort((a, b) => a.week - b.week).map(l => ({ week: l.week, why: l.why }));
}

export const kittyOf = (state, n) => balance(state, n);
