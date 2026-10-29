// ══════════════════════════════════════════════════════════════════════
// ss/launch.js — launch night, as the real one runs (transcript research §1)
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "launch night and prime could be a little bit bigger,
// they are important like an episode". The real launch (S14, 2 h 30) is built
// of ARRIVALS, each a small episode of its own, with the house shown live in
// between and the LIST OF SECRETS told to the public in batches. This file
// decides what happens on the night (who arrives when, the first missions, what
// the first ones in do while they wait), and applies its consequences; the
// viewer (js/vp-bb-ep/ss-launch.js) airs it.
//
// Docs: docs/research/secret-story-transcripts.md §1.
//
// Pure: state + ctx `{ stat, bond, rng, archetype }`; returns effects as
// `bond: [[a, b, d]]` for the adapter to apply.

import { addEvidence, secretOf } from './hunt.js';
import { mint } from './kitty.js';
import { roleOf } from './production.js';
import { duoRel } from './duos.js';

const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/**
 * What the first ones in do while they wait for the next arrival (the real
 * launch cuts to the house between arrivals): a tour, claiming beds, the
 * introductions, the superfan explaining the show, staring at the wall of
 * clues, hiding to surprise the next one; and (the user, 2026-10-28: "first
 * meeting, first crush, first drama... they're live") a first crush, a first
 * clash, a secret that nearly slips, waving at the cameras. Each moves the
 * first impressions.
 */
const CHECKIN_KINDS = ['tour', 'beds', 'intro', 'explain', 'wall', 'hide', 'crush', 'clash', 'slip', 'live'];
// (the night cuts to the house after these arrivals: most of them, as the real one does)
const SLOTS = [2, 3, 4, 6, 7, 9, 10, 12, 13, 15];

/**
 * Plans the night. `house` in the order the Voice calls them; returns
 * `{ order, missions, checkins, lists, effects }`.
 */
export function planLaunch(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const order = house.slice();
  const effects = { bond: [] };
  const missions = [];
  // THE FIRST TO ARRIVE: a privilege with a price (S14). The audience's signs
  // with their secret are still up somewhere in the house: hide the last one
  // before the next housemate walks in. A careful one manages; a hurried one
  // leaves a scrap where the second arrival finds it.
  const first = order[0], second = order[1];
  if (first && second && secretOf(state, first)) {
    const ok = rng() < clamp(0.35 + st(ctx, first, 'strategic') * 0.04 + st(ctx, first, 'temperament') * 0.02);
    if (!ok) addEvidence(state, ctx, second, first, { strength: 0.3, how: 'launch-sign' });
    missions.push({ kind: 'hide-sign', who: first, by: 0, ok, found: ok ? null : second });
  }
  // THE THIRD: a code built from two things only the first two can tell them
  // (S14: a shoe size and the eggs in the pantry), asked for without saying why.
  const third = order[2];
  if (third && first && second) {
    const ok = rng() < clamp(0.3 + st(ctx, third, 'social') * 0.05);
    if (ok) mint(state, third, 1000, 'the launch-night code', 1);
    missions.push({ kind: 'code', who: third, by: 2, from: [first, second], ok, reward: ok ? 1000 : 0 });
    if (ok) effects.bond.push([third, first, 0.3], [third, second, 0.3]);
  }
  // THE HOUSE BETWEEN ARRIVALS
  const checkins = [];
  const used = new Set();
  const compat = (a, b) => (typeof ctx.compat === 'function' ? !!ctx.compat(a, b) : true);
  const hot = n => st(ctx, n, 'boldness') - st(ctx, n, 'temperament');
  const pairsOf = list => list.flatMap((x, i) => list.slice(i + 1).map(y => [x, y]));
  for (const after of SLOTS) {
    if (after >= order.length) break;
    const inside = order.slice(0, after);
    if (inside.length < 2) continue;
    const newest = inside[inside.length - 1];
    // a crush needs two who could; a slip needs a secret to slip
    const crushPair = pairsOf(inside).filter(([x, y]) => compat(x, y) && compat(y, x))
      .sort((p, q) => (st(ctx, q[0], 'social') + st(ctx, q[1], 'social') + rng()) - (st(ctx, p[0], 'social') + st(ctx, p[1], 'social') + rng()))[0];
    const fits = k => (k !== 'explain' || inside.length >= 3) && (k !== 'crush' || !!crushPair) && (k !== 'clash' || inside.length >= 3)
      && (k !== 'slip' || inside.some(n => secretOf(state, n)));
    let kinds = CHECKIN_KINDS.filter(k => !used.has(k) && fits(k));
    // (every kind once before any comes back; then the house moments that bear repeating)
    if (!kinds.length) kinds = ['intro', 'live', 'crush', 'clash', 'slip'].filter(fits);
    const kind = kinds[Math.floor(rng() * kinds.length)] || 'intro';
    used.add(kind);
    let who;
    if (kind === 'crush') who = crushPair;
    // the first drama: the two hottest tempers in the house so far
    else if (kind === 'clash') who = inside.slice().sort((x, y) => hot(y) - hot(x) + (rng() - 0.5)).slice(0, 2);
    // a secret that nearly slips: the one with the least control, to the sharpest pair of ears
    else if (kind === 'slip') {
      const s = inside.filter(n => secretOf(state, n)).sort((x, y) => st(ctx, x, 'temperament') + st(ctx, x, 'strategic') - st(ctx, y, 'temperament') - st(ctx, y, 'strategic') + (rng() - 0.5))[0];
      const ear = inside.filter(n => n !== s && !(secretOf(state, s)?.holders || []).includes(n)).sort((x, y) => st(ctx, y, 'intuition') - st(ctx, x, 'intuition') + (rng() - 0.5))[0];
      who = [s, ear].filter(Boolean);
    } else who = [newest, ...inside.slice(0, -1).sort(() => rng() - 0.5)].slice(0, kind === 'wall' || kind === 'hide' || kind === 'live' ? 3 : 2);
    if (who.length < 2) continue;
    const [a, b] = who;
    // the superfan who knows the show by heart: the sharpest of them
    const fan = kind === 'explain' ? inside.slice().sort((x, y) => (st(ctx, y, 'mental') + st(ctx, y, 'strategic')) - (st(ctx, x, 'mental') + st(ctx, x, 'strategic')))[0] : null;
    let d = 0.3;
    // two bold ones after the same bed: the first friction of the season
    const clash = kind === 'clash' || (kind === 'beds' && st(ctx, a, 'boldness') + st(ctx, b, 'boldness') >= 13);
    if (clash) d = -0.4 - Math.max(0, hot(a) + hot(b)) * 0.03;
    if (kind === 'crush') d = 0.6 + (st(ctx, a, 'social') + st(ctx, b, 'social')) * 0.02;
    // what nearly slipped: the one listening has a lead (the confider and the listener feel closer for it)
    if (kind === 'slip') addEvidence(state, ctx, b, a, { strength: 0.25, how: 'launch-slip' });
    for (let i = 0; i < who.length; i++) for (let j = i + 1; j < who.length; j++) effects.bond.push([who[i], who[j], d]);
    checkins.push({ after, kind, who, fan, clash });
  }
  // THE PRODUCTION SECRETS, SET UP (the user: "production secret set up: that's our plan, that's how we're going to
  // play this, do you know where I'm from if they ask?"): once every holder is in, they slip away to agree on the
  // story; a role kept alone gets a live call from the host in the confessional.
  for (const s of (state.secrets || []).filter(x => x.source === 'production')) {
    const role = roleOf(s);
    const hs = (s.holders || []).filter(h => order.includes(h));
    if (!hs.length || ['secret-box', 'intruders'].includes(String(role || ''))) continue;
    const after = Math.max(...hs.map(h => order.indexOf(h))) + 1;
    checkins.push({ after, kind: hs.length > 1 ? 'plan' : 'role-call', who: hs, role: role || null, text: s.text });
    for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) effects.bond.push([hs[i], hs[j], 0.5]);
  }
  // A REAL TIE (a couple, a family, two friends: js/ss/duos.js) agrees, once both are in, that they have never met
  for (const s of (state.secrets || []).filter(x => x.kind === 'real-pair' && (x.holders || []).length === 2 && x.holders.every(h => order.includes(h)))) {
    const after = Math.max(...s.holders.map(h => order.indexOf(h))) + 1;
    checkins.push({ after, kind: 'plan', who: s.holders.slice(), role: duoRel(s) === 'romance' ? 'hide' : 'hide-kin', text: s.text });
  }
  checkins.sort((x, y) => x.after - y.after);
  // THE LIST OF SECRETS (S14): told to the public in batches, never saying whose.
  // Clues only: the story of a secret is told from what the Voice can show.
  // A batch tells the secrets of housemates still to come: the ones already in had
  // theirs shown by the audience's signs as they arrived.
  const secrets = (state.secrets || []).filter(s => (s.text || '').length);
  const arrives = s => Math.min(...(s.holders || []).map(h => order.indexOf(h)).filter(i => i >= 0));
  const told = new Set();
  const lists = [];
  for (const after of [2, 6, 10]) {
    if (after >= order.length) break;
    const later = secrets.filter(s => !told.has(s) && arrives(s) >= after).sort(() => rng() - 0.5).slice(0, 3);
    later.forEach(s => told.add(s));
    if (later.length) lists.push({ after, secrets: later.map(s => ({ text: s.text, clues: (s.clues || []).slice(0, 2), pair: (s.holders || []).length > 1 })) });
  }
  return { order, missions, checkins, lists, effects };
}

/**
 * The Voice's last summer, for the cold open: the most recent Secret Story
 * season the franchise ledger has, and its winner. Null on the first season.
 */
export function lastSummer(seasons = {}) {
  const ss = Object.entries(seasons || {}).filter(([, r]) => r?.ssDraw);
  if (!ss.length) return null;
  const num = k => Number(String(k).replace(/\D+/g, '')) || 0;
  const [key, rec] = ss.sort((a, b) => num(b[0]) - num(a[0]))[0];
  const winner = Object.entries(rec.players || {}).find(([, p]) => p?.winner)?.[0] || null;
  return { season: num(key), winner, name: rec.seasonName || null };
}
