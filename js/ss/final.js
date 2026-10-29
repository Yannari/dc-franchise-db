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
// secrets nobody found are unveiled, and every one kept that long DOUBLES its
// holder's kitty (the rule from season 12 on; never less than $10,000 added).
// Then every kitty in the house is VALIDATED: from that night it is theirs,
// and nothing in the last week can take it below that (js/ss/kitty.js).
//
// THE FINAL WEEK: every eliminated housemate comes back for one last party (the
// user, 2026-10-29): a secret nobody ever heard is told, the showmance is
// picked up or put to rest, the one who buzzed you is faced, the worst grudge
// is settled or blows up, and each guest backs a finalist. The final prime runs
// each finalist's journey, then the public's shares from last place to first,
// and the winner takes the cheque ($100,000, the user's call) on top of their
// kitty.
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
    clues: ['a portrait in the hallway whose eyes follow you', 'a second watching portrait, above the dining table', 'two more watching portraits in the girls\' bedroom', 'another watching portrait, in the bathroom behind the mirror', 'a watching portrait in the store room, behind the cereal', 'the last watching portrait, in the confessional itself'] },
  { id: 'numbers', riddle: 'Every room hides a number. Add them up.', answer: 'forty-two',
    clues: ['a six in the pattern of the bathroom tiles', 'a nine on the confessional clock that never moves', 'a four stitched into a cushion', 'a twelve on the bottom of a garden chair', 'a three drawn in the steam of the shower', 'an eight on the back of the clue table'] },
  { id: 'song', riddle: 'A song plays every night at midnight. Its first word is the answer.', answer: 'the word "always"',
    clues: ['the midnight song only plays in the garden', 'the midnight song is the same song every night', 'the first word of the midnight song is sung by a woman', 'the first word of the midnight song starts with an A', 'the first word of the midnight song means "forever"', 'the first word of the midnight song has six letters'] },
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
  const score = n => (hs.seen[n] || 0) * 0.12 + st(ctx, n, 'mental') / 10 * 0.3 + st(ctx, n, 'intuition') / 10 * 0.2 + rng() * 0.3;
  const best = house.map(n => ({ n, s: score(n) })).sort((a, b) => b.s - a.s)[0];
  // (calibrated by the ss-spec audit: 0.62 solved it 97% of seasons)
  if (!best || best.s < 0.78) return { type: 'ss-house-secret-end', week: ctx.week ?? 0, solved: false, answer: hs.answer,
    beats: [{ text: 'Nobody solves the secret of the house.', players: [], badgeText: 'THE HOUSE', badgeClass: 'grey', part: 'house-secret' }] };
  hs.solvedBy = best.n;
  // the Voice's offer: the place in the final, for money
  const offer = 15000 + Math.round(rng() * 7) * 5000;
  const greed = (st(ctx, best.n, 'strategic') - st(ctx, best.n, 'loyalty') + 10) / 20;
  const sells = rng() < clamp(0.04 + greed * 0.2 + (offer - 15000) / 35000 * 0.12);
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
    // (doubled: what they had is added again; a kitty smaller than $10,000 gets $10,000)
    const paid = in_.map(h => {
      const before = balance(state, h);
      const add = Math.max(before, KEPT_BONUS);
      mint(state, h, add, 'kept the secret to the semi-final: the kitty doubled', ctx.week ?? 0);
      return { n: h, before, after: balance(state, h), doubled: add === before };
    });
    out.push({ holders: in_, text: s.text, paid });
  }
  return out;
}

/**
 * The semi prime's last word on the money: every kitty in the house is validated.
 * From tonight it is theirs; the last week cannot take it below this (kitty.js).
 */
export function validateKitties(state, { house = [], week = 0 } = {}) {
  const amounts = Object.fromEntries(house.map(n => [n, balance(state, n)]));
  state.kittyValidated = { week, amounts };
  return house.map(n => ({ n, amount: amounts[n] })).sort((a, b) => b.amount - a.amount);
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

/**
 * THE LAST PARTY (the user, 2026-10-29: "at the finale week each eliminated houseguest come back one last time to
 * party, settling the scores, revealed their secrets if not already revealed/found before their elimination,
 * support their friend for the finale, fight with their enemies, reckon with their showmance"). From season 3 the
 * eliminated came back in the final week; here they all come back for one night in the garden.
 *
 * `couples`: the season's showmances, `{ a, b, broken }`. Returns `{ guests, moments }`; each moment carries its
 * consequences as `fx` ({ bond: [[a, b, d]], pub: [[n, axis, d, why]] }) for the adapter to apply, and every moment
 * returned is one the screen plays (no consequence nobody sees).
 */
export function finalParty(state, ctx, { finalists = [], eliminated = [], couples = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const here = [...finalists, ...eliminated];
  const calm = n => st(ctx, n, 'temperament') / 10;
  const key = (a, b) => [a, b].sort().join('|');
  const settled = new Set();
  // (nobody carries the night: two scores settled per guest at most, three for anybody counting the finalists)
  const load = {};
  const busy = (...ns) => ns.some(n => (load[n] || 0) >= (eliminated.includes(n) ? 2 : 3));
  const took = (...ns) => { for (const n of ns) load[n] = (load[n] || 0) + 1; };
  const closest = (n, pool) => pool.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, b) - bondOf(ctx, n, a))[0] || null;
  /** @type {any[]} */ const moments = [];

  // a secret nobody ever heard: found by no hunter, never told on the set (a walk-out, an exclusion)
  for (const g of eliminated) {
    const s = secretOf(state, g);
    if (!s || s.found || s.unveiled != null) continue;
    s.found = true; s.foundBy = null; s.week = week; s.revealedAtParty = week;
    moments.push({ kind: 'secret', who: g, with: closest(g, finalists), text: s.text, partners: (s.holders || []).filter(h => h !== g && here.includes(h)),
      fx: { bond: [], pub: [[g, 'fun', 0.2, 'told the house the secret at the last party'], [g, 'arc', 0.15, 'told the house the secret at the last party']] } });
  }
  // the showmance: picked up where it stopped, or put to rest
  for (const c of couples) {
    const g = eliminated.includes(c.a) ? c.a : eliminated.includes(c.b) ? c.b : null;
    const o = g === c.a ? c.b : c.a;
    if (!g || !here.includes(o) || settled.has(key(g, o)) || busy(g, o)) continue;
    settled.add(key(g, o)); took(g, o);
    if (!c.broken) {
      moments.push({ kind: 'lovers', who: g, with: o, fx: { bond: [[g, o, 1.5]], pub: [[g, 'warmth', 0.12, `was reunited with ${o}`], [o, 'warmth', 0.12, `was reunited with ${g}`]] } });
    } else if (rng() < clamp(0.25 + (calm(g) + calm(o)) / 2 * 0.55 + bondOf(ctx, g, o) / 20)) {
      moments.push({ kind: 'closure', who: g, with: o, fx: { bond: [[g, o, 1]], pub: [[g, 'warmth', 0.08, `made peace with ${o}`], [o, 'warmth', 0.08, `made peace with ${g}`]] } });
    } else {
      moments.push({ kind: 'cold', who: g, with: o, fx: { bond: [[g, o, -0.5]], pub: [[g, 'fun', 0.1, `ignored ${o} at the last party`]] } });
    }
  }
  // the one who buzzed you (the bitterest three)
  const buzzed = eliminated.map(g => ({ g, f: secretOf(state, g)?.foundBy }))
    .filter(x => x.f && here.includes(x.f) && x.f !== x.g && !settled.has(key(x.g, x.f)))
    .sort((a, b) => bondOf(ctx, a.g, a.f) - bondOf(ctx, b.g, b.f)).slice(0, 3);
  for (const { g, f } of buzzed) {
    // (two who found each other's secrets: one scene between them, not two)
    if (settled.has(key(g, f)) || busy(g, f)) continue;
    settled.add(key(g, f)); took(g, f);
    const peace = rng() < clamp(0.3 + calm(g) * 0.45 + bondOf(ctx, g, f) / 20);
    moments.push({ kind: 'buzzed', who: g, with: f, peace,
      fx: peace ? { bond: [[g, f, 1.5]], pub: [[g, 'warmth', 0.1, `forgave ${f} for finding the secret`]] }
        : { bond: [[g, f, -0.5]], pub: [[g, 'fun', 0.1, `faced ${f} again at the last party`]] } });
  }
  // the worst grudge in the garden: settled, or it blows up again (three at most)
  const grudges = [];
  for (const g of eliminated) {
    const e = here.filter(x => x !== g && !settled.has(key(g, x))).sort((a, b) => bondOf(ctx, g, a) - bondOf(ctx, g, b))[0];
    if (e && bondOf(ctx, g, e) <= -3) grudges.push({ g, e, b: bondOf(ctx, g, e) });
  }
  for (const { g, e } of grudges.sort((a, b) => a.b - b.b)) {
    if (settled.has(key(g, e)) || busy(g, e) || moments.filter(m => m.kind === 'makeup' || m.kind === 'fight').length >= 3) continue;
    settled.add(key(g, e)); took(g, e);
    const peace = rng() < clamp(0.15 + (calm(g) + calm(e)) / 2 * 0.5);
    moments.push({ kind: peace ? 'makeup' : 'fight', who: g, with: e,
      fx: peace ? { bond: [[g, e, 2]], pub: [[g, 'warmth', 0.1, `made up with ${e}`], [e, 'warmth', 0.1, `made up with ${g}`]] }
        : { bond: [[g, e, -1]], pub: [[g, 'fun', 0.15, `had it out with ${e} at the last party`], [e, 'fun', 0.08, `had it out with ${g} at the last party`]] } });
  }
  // a secret told on the set the night they left: the house never got the story (two at most)
  const MOVING = ['survived', 'family', 'love', 'body'];
  const told = eliminated.filter(g => { const s = secretOf(state, g); return s && s.revealedOnExit != null && !s.foundBy; })
    .sort((a, b) => Number(MOVING.includes(secretOf(state, b)?.kind)) - Number(MOVING.includes(secretOf(state, a)?.kind))).slice(0, 2);
  const asked = new Set();
  for (const g of told) {
    // (a different finalist asks each one, when there is one)
    const a = closest(g, finalists.filter(f => !asked.has(f))) || closest(g, finalists);
    if (!a) continue;
    asked.add(a);
    moments.push({ kind: 'story', who: g, with: a, text: secretOf(state, g)?.text || '', fx: { bond: [[g, a, 0.5]], pub: [[g, 'warmth', 0.12, 'told the story behind the secret']] } });
  }
  // every guest backs a finalist: their closest one, if they are on good terms
  for (const g of eliminated) {
    const f = closest(g, finalists);
    if (!f || bondOf(ctx, g, f) < 0) continue;
    moments.push({ kind: 'support', who: g, with: f, fx: { bond: [[g, f, 1]], pub: [[f, 'warmth', 0.05, `was backed by ${g} at the last party`]] } });
  }
  return { guests: eliminated.slice(), moments };
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
