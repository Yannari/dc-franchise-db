// ══════════════════════════════════════════════════════════════════════
// ss/prime.js — the prime: the weekly live show, a full episode
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §10, §12. The user, 2026-10-27: "prime are full episode so
// theyre not sometimes with 30 click like real full episodes". A prime is the
// week's big show, two hours on the real channel:
//
//   the opening (the host, the crowd, the night's name)
//   the week in the house (what the viewers saw)
//   the nominees in the airlock, live with the host
//   two to five SEGMENTS: dilemmas, the red phone, the room of truths, a
//     family visit through the airlock glass, the missions revealed
//   the public's verdict, read in the airlock
//   the walk to the studio, the interview, the secret the house never found
//   After Secret, with the host and Blaineley
//
// This file decides what happens in the segments, and applies it. The viewer
// (js/vp-bb-ep/steps.js) turns the act into the episode.
//
// Pure: state + the hunt's context `{ stat, bond, rng, week, archetype, pop }`.

import { mint, burn, transfer, balance } from './kitty.js';
import { secretOf, theoryOf, showClue, hiddenSecrets } from './hunt.js';
import { runDilemma, nominateNext, immuneNext } from './dilemmas.js';
import { RATE } from './twists.js';
import { grantPower } from './powers.js';

const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const bondOf = (ctx, a, b) => Number(ctx?.bond?.(a, b)) || 0;
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
const usd = n => `$${Number(n || 0).toLocaleString('en-US')}`;

// ── THE RED PHONE (§12): whoever answers first gets the message ──────────

/** Who runs for it: the bold and the curious; the careful hang back. Null when nobody picks up. */
export function whoAnswers(ctx, house) {
  const rng = ctx.rng || Math.random;
  let best = null, bestT = Infinity;
  for (const n of house) {
    // seconds to reach it: boldness and a little intuition (you hear it first)
    const t = 6 - st(ctx, n, 'boldness') * 0.35 - st(ctx, n, 'intuition') * 0.1 + rng() * 3.2;
    if (t < bestT) { bestT = t; best = n; }
  }
  // S5: nobody before the fifth ring, everybody nominated. Rare.
  return bestT > 4.8 ? null : best;
}

/** Every message is a real one (§12). Each: `{ id, build(state, ctx, n, house) -> {said, effects…} | null }`. */
const PHONE = [
  // the cards (js/ss/powers.js): held in secret, played after the nominees are read
  { id: 'joker-card', w: 0.6, build(state, ctx, n) {
    grantPower(state, { kind: 'joker', holder: n, week: ctx.week ?? 0, from: 'phone' });
    return { said: 'You receive the Joker card. Keep it secret. After a nomination, you may use it once: cancel one nominee, and name another.', text: `${n} receives the Joker card, in secret.` };
  } },
  { id: 'switch-card', w: 0.5, build(state, ctx, n, house) {
    const f = house.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, b) - bondOf(ctx, n, a))[0] || null;
    grantPower(state, { kind: 'switch', holder: n, week: ctx.week ?? 0, from: 'phone', protects: f });
    return { said: `You receive the Switch card. If you${f ? `, or ${f},` : ''} are nominated in the next three weeks, it will take you off, and you will name somebody else.`, choice: f, text: `${n} receives the Switch card, protecting ${f ? `${n} and ${f}` : n}.`, target: f };
  } },
  { id: 'nominated', w: 1.2, build(state, ctx, n) {
    nominateNext(state, ctx, n);
    return { said: 'You are nominated for next week.', text: `${n} is nominated d'office for next week.`, pop: [[n, 0.15]] };
  } },
  { id: 'pass-nomination', w: 1.3, build(state, ctx, n, house) {
    const r = house.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, a) - bondOf(ctx, n, b))[0];
    if (!r) return null;
    const keep = NICE.includes(ctx.archetype?.(n)) && (ctx.rng || Math.random)() < 0.5;
    const to = keep ? n : r;
    nominateNext(state, ctx, to);
    return keep
      ? { said: 'You are nominated for next week, unless you give the nomination to another housemate. Who?', choice: 'keeps it', text: `${n} keeps the nomination rather than hand it to somebody.`, pop: [[n, 0.35]] }
      : { said: 'You are nominated for next week, unless you give the nomination to another housemate. Who?', choice: r, text: `${n} gives the nomination to ${r}.`, bond: [[r, n, -2.5]], target: r };
  } },
  { id: 'extra-vote', w: 1, build(state, ctx, n, house) {
    const r = house.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, a) - bondOf(ctx, n, b))[0];
    if (!r) return null;
    state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
    const wk = (ctx.week ?? 0) + 1;
    (state.rules.extraVotes[wk] ||= {})[r] = (state.rules.extraVotes[wk][r] || 0) + 1;
    return { said: 'Choose a housemate. Next week they start the nominations with one vote against them.', choice: r, text: `${r} starts next week's nominations with a vote against them.`, bond: [[r, n, -1.5]], target: r };
  } },
  { id: 'money', w: 0.9, build(state, ctx, n) {
    const amt = 5000 + Math.floor((ctx.rng || Math.random)() * 3) * 2500;
    mint(state, n, amt, 'the red phone', ctx.week ?? 0);
    return { said: `You have won ${usd(amt)} for your kitty.`, text: `${n} wins ${usd(amt)}.` };
  } },
  { id: 'give-money', w: 0.8, build(state, ctx, n, house) {
    const r = house.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, a) - bondOf(ctx, n, b))[0];
    if (!r || balance(state, n) < 3000) return null;
    const amt = Math.min(5000, balance(state, n));
    transfer(state, n, r, amt, 'the red phone: to the one you like least', ctx.week ?? 0);
    return { said: `Give ${usd(amt)} of your kitty to the housemate you get on with least. Now.`, choice: r, text: `${n} hands ${usd(amt)} to ${r}, and the whole house knows what that means.`, bond: [[r, n, -1.5]], target: r };
  } },
  { id: 'divide-kitty', w: 0.6, build(state, ctx, n) {
    const by = 2 + Math.floor((ctx.rng || Math.random)() * 4);
    const lost = balance(state, n) - Math.round(balance(state, n) / by);
    if (lost <= 0) return null;
    burn(state, n, lost, `the red phone: kitty divided by ${by}`, ctx.week ?? 0);
    return { said: `Your kitty is divided by ${by}.`, text: `${n}'s kitty is divided by ${by}: ${usd(lost)} gone.`, pop: [[n, 0.1]] };
  } },
  { id: 'fake-clue', w: 0.8, build(state, ctx, n, house) {
    const s = secretOf(state, n);
    if (!s || s.found) return null;
    // a real false lead: everybody who reads it leans toward the wrong secret (ss/hunt.js)
    const c = showClue(state, ctx, { holder: n, how: 'phone', house, fake: true });
    if (!c) return null;
    return { said: 'You may plant a false clue about your own secret. The house will think it is real.', text: `${n} plants a false clue about their own secret.`, clue: c.clue };
  } },
  { id: 'master-of-immunity', w: 0.7, build(state, ctx, n, house) {
    const f = house.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, b) - bondOf(ctx, n, a))[0];
    const self = !f || (st(ctx, n, 'loyalty') < 6 && (ctx.rng || Math.random)() < 0.6);
    immuneNext(state, ctx, self ? n : f);
    return self
      ? { said: 'You are the master of immunity. Give it to whoever you want.', choice: n, text: `${n} keeps the immunity for themselves.`, pop: [[n, -0.15]] }
      : { said: 'You are the master of immunity. Give it to whoever you want.', choice: f, text: `${n} gives the immunity to ${f}.`, bond: [[f, n, 2]], target: f };
  } },
  { id: 'trust', w: 0.7, build(state, ctx, n, house) {
    const most = house.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, b) - bondOf(ctx, n, a));
    if (most.length < 2) return null;
    const least = most[most.length - 1];
    return { said: 'Tell the house, out loud: who do you trust most here, and who least?', choice: `${most[0]} most, ${least} least`,
      text: `${n} names ${most[0]} as the one they trust most, and ${least} as the one they trust least.`, bond: [[most[0], n, 1.2], [least, n, -2]], target: least };
  } },
];

/** The red phone rings. */
export function ringPhone(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const n = whoAnswers(ctx, house);
  if (!n) {
    // nobody answered: everybody is nominated? (S5) The simulator makes it an extra vote on everybody.
    state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
    return { kind: 'phone', answered: null, rings: 5, text: 'Nobody answers before the fifth ring. The Voice is not pleased.', effects: { bond: [], pop: [] } };
  }
  const pool = PHONE.slice();
  for (let i = 0; i < 6 && pool.length; i++) {
    const total = pool.reduce((s, m) => s + m.w, 0);
    let r = rng() * total, k = 0;
    while (k < pool.length - 1 && (r -= pool[k].w) > 0) k++;
    const m = pool.splice(k, 1)[0];
    const fx = m.build(state, ctx, n, house);
    if (!fx) continue;
    const rings = 1 + Math.floor(rng() * 3);
    // the house heard who ran for it, and the greedy look greedy
    return { kind: 'phone', answered: n, rings, message: m.id, said: fx.said, choice: fx.choice || null, target: fx.target || null, text: fx.text, clue: fx.clue || null,
      effects: { bond: fx.bond || [], pop: fx.pop || [] } };
  }
  return null;
}

// ── THE ROOM OF TRUTHS: what the house said about you, on tape ───────────

/** The housemate the house talks about most behind their back: the tapes are played to them. */
export function roomOfTruths(state, ctx, { house = [] } = {}) {
  const score = n => house.filter(x => x !== n).reduce((s, x) => s + Math.max(0, -bondOf(ctx, x, n)), 0);
  const subject = house.slice().sort((a, b) => score(b) - score(a))[0];
  if (!subject || score(subject) < 1.5) return null;
  const talkers = house.filter(x => x !== subject && bondOf(ctx, x, subject) < -0.5).sort((a, b) => bondOf(ctx, a, subject) - bondOf(ctx, b, subject)).slice(0, 3);
  if (!talkers.length) return null;
  // how they take it: temperament
  const temper = st(ctx, subject, 'temperament');
  const reaction = temper <= 4 ? 'explodes' : temper >= 7 ? 'calm' : 'hurt';
  return { kind: 'truths', subject, talkers, reaction,
    text: `${subject} watches what ${talkers.join(', ')} said behind their back.`,
    effects: { bond: talkers.map(t => [subject, t, reaction === 'explodes' ? -3 : -2]), pop: [[subject, reaction === 'calm' ? 0.4 : 0.2], ...talkers.map(t => [t, -0.15])] } };
}

// ── A VISIT: family through the airlock glass ────────────────────────────

/** The housemate who had the hardest week (wrong buzzes, nominations, enemies) gets a family visit. */
export function familyVisit(state, ctx, { house = [], nominees = [], to = null } = {}) {
  const rng = ctx.rng || Math.random;
  const hard = n => (nominees.includes(n) ? 1.5 : 0)
    + (state.buzzes || []).filter(b => b.by === n && b.outcome === 'wrong' && b.week === ctx.week).length
    + house.filter(x => x !== n && bondOf(ctx, n, x) < -3).length * 0.5 + rng();
  const n = to || house.slice().sort((a, b) => hard(b) - hard(a))[0];
  if (!n) return null;
  const who = ['mother', 'father', 'sister', 'brother', 'grandmother', 'best friend from home'][Math.floor(rng() * 6)];
  // friends gather at the glass; the one who comforts them after gets closer
  const friend = house.filter(x => x !== n).sort((a, b) => bondOf(ctx, n, b) - bondOf(ctx, n, a))[0] || null;
  return { kind: 'visit', to: n, who, friend, text: `${n}'s ${who} comes to the airlock glass.`,
    effects: { bond: friend ? [[n, friend, 1]] : [], pop: [[n, 0.45]] } };
}

// ── THE NIGHT'S RUNNING ORDER ────────────────────────────────────────────

/** The night's name, from what happens in it (S8 named every prime; S11 too). */
export function primeName(segments) {
  const has = k => segments.some(s => s.kind === k);
  if (has('phone')) return 'The Red Phone';
  if (has('truths')) return 'The Prime of Truths';
  if (segments.filter(s => s.kind === 'dilemma').length >= 2) return 'The Night of Dilemmas';
  if (has('visit')) return 'The Prime of Hearts';
  if (has('mission')) return 'The House Drops the Mask';
  return 'The House of Secrets, Live';
}

/**
 * Plans and plays the prime's segments. `missions` are this week's settled
 * missions (ss/missions.js settleMissions), shown as a segment of their own.
 * Returns `{ name, segments }`; every segment carries `effects` for the
 * engine to apply (bonds, the public).
 */
export function playPrime(state, ctx, { house = [], nominees = [], missions = [], tools = {} } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const segs = [];
  if (missions.length) segs.push({ kind: 'mission', results: missions, effects: { bond: [], pop: [] } });
  // the dilemmas: one most weeks, two some weeks, never on a nominee's last night
  const free = house.filter(n => !nominees.includes(n));
  const nDil = week <= 1 ? 1 : rng() < (RATE.dilemmas[tools.dilemmas] ?? 0.35) ? 2 : 1;
  const used = [];
  for (let i = 0; i < nDil && free.length; i++) {
    const to = free.filter(n => !segs.some(s => s.to === n))[Math.floor(rng() * free.length)] || free[0];
    const d = runDilemma(state, ctx, { to, house, exclude: used });
    if (d) { used.push(d.dilemmaId); segs.push({ kind: 'dilemma', ...d }); }
  }
  // the red phone: a signature tool, rings on some primes (more in the seasons that use it)
  // the season's draw sets how often each tool comes out (js/ss/twists.js)
  const phoneP = tools.phone === false ? 0 : RATE.phone[tools.phone] ?? 0.32;
  if (week >= 2 && rng() < phoneP) { const p = ringPhone(state, ctx, { house }); if (p) segs.push(p); }
  if (week >= 3 && rng() < (RATE.truths[tools.truths] ?? 0.28)) { const t = roomOfTruths(state, ctx, { house }); if (t) segs.push(t); }
  const visited = segs.find(s => s.kind === 'dilemma' && s.visit);
  if (!visited && week >= 2 && rng() < (RATE.visits[tools.visits] ?? 0.3)) { const v = familyVisit(state, ctx, { house, nominees }); if (v) segs.push(v); }
  // the order on the night: missions early, the phone in the middle, the heart near the verdict
  const ORDER = { mission: 1, dilemma: 2, phone: 3, truths: 4, visit: 5 };
  segs.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
  return { name: primeName(segs), segments: segs };
}

/** Nobody's popularity, when the caller has none to give. */
const noPop = (/** @type {string} */ _n) => /** @type {number} */ (0);

// ── AFTER THE VERDICT ────────────────────────────────────────────────────

/**
 * The eliminated leaves: if nobody found their secret, the house hears it on
 * the set tonight. Who was right, who was wrong, who never guessed. The
 * theories about it close.
 */
export function revealOnExit(state, { evicted = undefined, house = [], week = 0 } = {}) {
  const s = secretOf(state, evicted);
  if (!s) return null;
  const was = !!s.found;
  const foundBy = s.foundBy || null;
  const right = [], wrong = [];
  for (const n of house) {
    const th = theoryOf(state, n, evicted);
    if (!th || th.conf < 0.2) continue;
    (th.right ? right : wrong).push(n);
  }
  // nobody found it: it is out now, and nobody is paid for it (foundBy stays empty)
  if (!was) { s.found = true; s.foundBy = null; s.week = week; s.revealedOnExit = week; }
  // the theories about it are moot now
  for (const n of Object.keys(state.theories || {})) if (state.theories[n]?.[evicted]) delete state.theories[n][evicted];
  // a partner still in the house is exposed with it
  const partners = (s.holders || []).filter(h => h !== evicted && house.includes(h));
  return { evicted, secret: s.text, alreadyFound: was, foundBy: was ? foundBy : null, right, wrong, partners, kitty: balance(state, evicted) };
}

/**
 * After Secret (the host and Blaineley, the eliminated on the couch): what the
 * viewers know that the house does not. Read from the state, after the verdict.
 */
export function afterShow(state, ctx, { evicted = undefined, house = [], popOf = noPop } = {}) {
  const hidden = hiddenSecrets(state).filter(s => (s.holders || []).some(h => house.includes(h)));
  // the theories closest to the truth, and the loudest wrong ones
  const close = [], wrong = [];
  for (const n of house) for (const [t, th] of Object.entries(state.theories?.[n] || {})) {
    if (!house.includes(t) || !th || th.conf < 0.3) continue;
    (th.right ? close : wrong).push({ by: n, target: t, conf: Math.round(th.conf * 100) / 100, guess: th.text });
  }
  close.sort((a, b) => b.conf - a.conf); wrong.sort((a, b) => b.conf - a.conf);
  const fav = house.slice().sort((a, b) => popOf(b) - popOf(a));
  const kitties = house.map(n => [n, balance(state, n)]).sort((a, b) => b[1] - a[1]);
  // Blaineley's pick for the next secret to fall: the one with the surest hunter
  const nextToFall = close[0] ? { holder: close[0].target, by: close[0].by } : null;
  return { evicted, hiddenLeft: hidden.length, close: close.slice(0, 3), wrong: wrong.slice(0, 2),
    favourite: fav[0] || null, leastLiked: fav[fav.length - 1] || null, kitties: kitties.slice(0, 5), nextToFall };
}
