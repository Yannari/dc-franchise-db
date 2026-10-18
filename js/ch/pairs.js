// ══════════════════════════════════════════════════════════════════════
// ch/pairs.js — the Pairs season: who is tied to whom, and the two-on-two
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-17-ch-pairs-season-design.md. A season where you live and die as a pair
// (Rivals, Battle of the Exes, Fresh Meat, Double Agents; Wikipedia, read 2026-10-17). This file holds the pairs
// and everything that reads them: how they are made, who carried whom, the two-on-two Arena, the pair's call-out,
// what happens when a partner leaves, the swaps of a Pick season.
//
//   state.pairs      [{ id, a, b, since, how, why, kin }]   the pairs still in the game
//   state.partnerOf  { name: partner }
//   state.pairLog    { pairId: { carry: { name: n }, events: [...] } }   who carried whom, the season long
//   state.lone       the players without a partner (a partner left and nobody was free)
//
// The vote names a pair by its REPRESENTATIVE (repOf: the pair's `a`), so every reader of a ballot that matches a
// target against the one voted in still works; the ballot keeps the member the voter meant (`named`).
import { getBond, addBond, getPerceivedBond } from '../bonds.js';
import { kinshipBetween } from '../core.js';
import { S, addScene, noise, logistic, shuffle, clamp } from './state.js';
import { performanceMod, nudge } from './mind.js';
import { remember } from './rel.js';
import { threatRead, arenaRead } from './respect.js';
import { blendScore, drawGame } from './arena.js';
import { calloutTerms, coupleOf } from './callout.js';

export const PAIRINGS = ['rivals', 'ties', 'fresh-meat', 'pick'];

export const pairsOn = state => !!state?.options?.pairs;
export const pairingOf = state => state.options.pairs?.pairing || 'rivals';
export const shapeOf = state => (state.options.gendered ? state.options.pairs?.shape || 'mixed' : 'any');
export const partnerOf = (state, n) => state.partnerOf?.[n] || null;
export const pairOf = (state, n) => (state.pairs || []).find(p => p.a === n || p.b === n) || null;
export const repOf = (state, n) => pairOf(state, n)?.a || n;
export const membersOf = (state, n) => { const p = pairOf(state, n); return p ? [p.a, p.b] : [n]; };
export const pairName = (state, n) => membersOf(state, n).join(' & ');
// The division a pair plays in: a same-gender pair's own, 'all' for a man and a woman (one champion pair).
export const pairDivision = (state, p) => (shapeOf(state) === 'same' ? state.division[p.a] : 'all');

// The units still in the game: what the schedule counts, and what "the final" means.
// Before the pairs are made (a draft season's combine), the cast is counted as the pairs it will make.
export const unitsLeft = state => (!pairsOn(state) ? state.active.length
  : state.pairs ? state.pairs.length : Math.floor(state.active.length / 2));

// Can these two be a pair in this season's shape?
function fits(state, a, b) {
  const sh = shapeOf(state);
  if (sh === 'any') return true;
  const same = state.division[a] === state.division[b];
  return sh === 'same' ? same : !same;
}

// ── the tie two people walk in with ──────────────────────────────────
// What they were to each other before the season, strongest first: a couple (married, engaged, together, dating),
// exes, family, old friends. From the franchise ledger (state.kin) and the characters' own ties (kinshipBetween).
const TIE_RANK = { married: 0, engaged: 1, partners: 2, dating: 3, exes: 4, twins: 5, siblings: 5, 'step-siblings': 6,
  cousins: 7, 'parent-child': 7, 'aunt-uncle': 8, 'in-laws': 8, 'old-friends': 9 };
const TIE_WORD = { married: 'couple', engaged: 'couple', partners: 'couple', dating: 'couple', exes: 'ex',
  twins: 'family', siblings: 'family', 'step-siblings': 'family', cousins: 'family', 'parent-child': 'family',
  'aunt-uncle': 'family', 'in-laws': 'family', 'old-friends': 'friends' };
export function tieOf(state, a, b) {
  const k = (state.kin || []).find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  let kin = k?.kin || null;
  if (!kin) { try { kin = kinshipBetween(a, b) || null; } catch { kin = null; } }
  return kin && TIE_RANK[kin] != null ? kin : null;
}
export const tieWord = kin => TIE_WORD[kin] || null;

// ── making the pairs ─────────────────────────────────────────────────
// Hand pairs first (the cast card's Partner field: two cards that name each other), then the method fills the rest.
function handPairs(state, pins = {}) {
  const out = [];
  const taken = new Set();
  for (const a of state.active) {
    const b = pins[a];
    if (!b || taken.has(a) || taken.has(b) || pins[b] !== a || !state.active.includes(b) || !fits(state, a, b)) continue;
    taken.add(a); taken.add(b);
    out.push({ a, b, how: 'hand' });
  }
  return { out, taken };
}

// Greedy matching on a cost (lowest first), inside the shape. Good enough at 24: the worst pair first, then the next.
function match(state, people, cost) {
  const rows = [];
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const a = people[i], b = people[j];
    if (fits(state, a, b)) rows.push({ a, b, c: cost(a, b) });
  }
  rows.sort((x, y) => x.c - y.c || (x.a + x.b).localeCompare(y.a + y.b));
  const used = new Set(), out = [];
  for (const r of rows) {
    if (used.has(r.a) || used.has(r.b)) continue;
    used.add(r.a); used.add(r.b);
    out.push(r);
  }
  return { out, left: people.filter(n => !used.has(n)) };
}

// Rivals: production pairs everybody with the worst relationship it can find. The franchise's carried grudges
// first, then the coldest bond after the first impressions. A pair with no real history is production's guess.
function rivalPairs(state, people) {
  const grudge = (a, b) => (state.carriedGrudge?.[`${a}>${b}`] || 0) + (state.carriedGrudge?.[`${b}>${a}`] || 0);
  const { out, left } = match(state, people, (a, b) => getBond(a, b) - grudge(a, b) * 2.5 + (tieOf(state, a, b) === 'exes' ? -1.5 : 0)
    // a couple or family is not a rivalry, whatever the bond says
    + (['couple', 'family'].includes(tieWord(tieOf(state, a, b))) ? 20 : 0));
  return { out: out.map(r => {
    const history = grudge(r.a, r.b) > 0 || getBond(r.a, r.b) <= -1.5 || tieOf(state, r.a, r.b) === 'exes';
    return { a: r.a, b: r.b, how: 'rivals', why: history ? (grudge(r.a, r.b) > 0 ? 'grudge' : tieOf(state, r.a, r.b) === 'exes' ? 'ex' : 'cold') : 'guess' };
  }), left };
}

// Exes / Ride or Die: the real ties first, strongest first; then the warmest bonds.
function tiePairs(state, people) {
  const { out, left } = match(state, people, (a, b) => {
    const t = tieOf(state, a, b);
    return t ? TIE_RANK[t] - 100 : -getBond(a, b);
  });
  return { out: out.map(r => {
    const kin = tieOf(state, r.a, r.b);
    return { a: r.a, b: r.b, how: 'ties', kin, why: kin ? tieWord(kin) : getBond(r.a, r.b) >= 2 ? 'friends' : 'guess' };
  }), left };
}

// A draft: the pickers in order, each picking the one they want most from who is left. The want: the bond they
// read, the strength they saw today (`today`: the combine or the premiere daily) weighed by how strategic the
// picker is, and a little chance. The last one picked is noticed.
function draft(state, rng, pickers, pickees, today = {}, how = 'pick') {
  const left = [...pickees];
  const out = [];
  for (const p of pickers) {
    const ok = left.filter(x => fits(state, p, x));
    if (!ok.length) continue;
    const want = x => getPerceivedBond(p, x) * 0.55 + ((today[x] ?? threatRead(state, x)) * 0.5) * S(p, 'strategic') / 10
      + threatRead(state, x) * 0.15 + noise(rng) * 0.35 + (coupleOf(state, p) === x ? 3 : 0);
    const chosen = [...ok].sort((x, y) => want(y) - want(x))[0];
    left.splice(left.indexOf(chosen), 1);
    out.push({ a: p, b: chosen, how, why: (today[chosen] ?? 0) >= 6.5 ? 'stats' : getBond(p, chosen) >= 2 ? 'friends' : 'pick' });
    addBond(p, chosen, 0.5);
    remember(chosen, p, 'worked-with-me', 0.8, { picked: true });
  }
  const last = out.at(-1);
  if (last && out.length >= 3) {
    nudge(state, last.b, 'morale', -0.8); nudge(state, last.b, 'confidence', -0.6);
    addScene(state, 'picked-last', [last.b], { by: last.a, pairs: true }, state.active, 'public');
  }
  return { out, left };
}

function freshMeatPairs(state, rng, people, today) {
  const vets = people.filter(n => !state.rookie[n]), rookies = people.filter(n => state.rookie[n]);
  // the most respected vet picks first (ties by the combine)
  const order = [...vets].sort((a, b) => (state.rec[b].respect - state.rec[a].respect) || ((today[b] || 0) - (today[a] || 0)) || a.localeCompare(b));
  const { out, left } = draft(state, rng, order, rookies, today, 'fresh-meat');
  return { out, left: [...left, ...vets.filter(v => !out.some(p => p.a === v))] };
}

function pickPairs(state, rng, people, today, winners = []) {
  // the premiere daily's winners pick first, then the most respected; in a man-and-woman season the smaller side picks
  let pickers = people, pickees = people;
  if (shapeOf(state) === 'mixed') {
    const m = people.filter(n => state.division[n] === 'm'), f = people.filter(n => state.division[n] === 'f');
    const pickSide = winners.some(w => state.division[w] === 'f') && !winners.some(w => state.division[w] === 'm') ? f
      : winners.some(w => state.division[w] === 'm') && !winners.some(w => state.division[w] === 'f') ? m : (m.length <= f.length ? m : f);
    pickers = pickSide; pickees = pickSide === m ? f : m;
  }
  const rank = n => (winners.includes(n) ? 100 : 0) + (state.rec[n].respect || 0) + (today[n] || 0) * 0.1;
  const order = [...pickers].sort((a, b) => rank(b) - rank(a) || a.localeCompare(b));
  if (shapeOf(state) !== 'mixed') {
    // everybody is a picker and a pickee: whoever is still free picks next
    const left = [...order], out = [];
    while (left.length >= 2) {
      const p = left.shift();
      const r = draft(state, rng, [p], left, today, 'pick');
      const got = r.out[0];
      if (!got) { left.push(p); break; }
      out.push(got);
      left.splice(left.indexOf(got.b), 1);
    }
    return { out, left };
  }
  return draft(state, rng, order, pickees, today, 'pick');
}

/**
 * Make the season's pairs. `today`: each player's score on the day it happens (the combine), for the drafts.
 * Records them on the state and airs the reveal (one scene for the house, one per pair). Returns the pairs.
 */
export function makeSeasonPairs(state, rng, { pins = {}, today = {}, winners = [] } = {}) {
  const { out: hand, taken } = handPairs(state, pins);
  const people = state.active.filter(n => !taken.has(n));
  const method = pairingOf(state);
  let made;
  if (method === 'ties') made = tiePairs(state, people);
  else if (method === 'fresh-meat') made = freshMeatPairs(state, rng, people, today);
  else if (method === 'pick') made = pickPairs(state, rng, people, today, winners);
  else made = rivalPairs(state, people);
  // anybody the method could not place (an uneven cast the setup should have refused): paired with each other
  const rest = match(state, made.left, (a, b) => -getBond(a, b));
  const leftovers = [...rest.out.map(r => ({ a: r.a, b: r.b, how: method, why: 'guess' })),
    ...pairUp(rest.left).map(([a, b]) => ({ a, b, how: method, why: 'guess' }))];
  const all = [...hand.map(p => ({ ...p, why: tieWord(tieOf(state, p.a, p.b)) || (getBond(p.a, p.b) <= -1.5 ? 'cold' : 'hand') })), ...made.out, ...leftovers];
  state.pairs = [];
  state.partnerOf = {};
  state.pairLog ||= {};
  state.lone = [...(rest.left.length % 2 ? [rest.left.at(-1)] : [])];
  for (const p of all) addPair(state, p);
  // the reveal: TJ names them, the house reacts; then each pair's first moment
  // a Rivals season with little real history: TJ says so, instead of promising grudges nobody has
  const history = state.pairs.filter(p => p.how === 'rivals' && p.why !== 'guess').length;
  const shown = method === 'rivals' && history < state.pairs.length / 2 ? 'rivals-new' : method;
  addScene(state, 'pairs-revealed', state.active, { pairs: state.pairs.map(p => [p.a, p.b]), method: shown }, state.active, method === 'rivals' || method === 'ties' ? 'airstrip' : 'challenge');
  for (const [i, p] of state.pairs.entries()) {
    // walking in tied to each other is felt at once: rivals sour, a couple or family warm
    const word = p.kin ? tieWord(p.kin) : null;
    // how they feel about each other as their names are called, before the pairing sours or warms it: two who
    // already get on are relieved whatever production meant by it (the user, 2026-10-18: "any pairs that have a
    // good reaction, or a neutral?")
    const before = Math.round(getBond(p.a, p.b) * 10) / 10;
    if (before >= 1.5 && !word) { addBond(p.a, p.b, 0.3); nudge(state, p.a, 'morale', 0.2); nudge(state, p.b, 'morale', 0.2); }
    else if (p.how === 'rivals') { addBond(p.a, p.b, p.why === 'guess' ? -0.2 : p.why === 'cold' ? -0.3 : -0.6); nudge(state, p.a, 'morale', -0.3); nudge(state, p.b, 'morale', -0.3); }
    else if (word === 'couple' || word === 'family') addBond(p.a, p.b, 0.6);
    else if (word === 'ex') addBond(p.a, p.b, -0.3);
    if (i > 0) addScene(state, 'pair-reveal', [p.a, p.b], { how: p.how, why: p.why, kin: p.kin || null, tie: word, bond: before }, state.active, method === 'rivals' || method === 'ties' ? 'airstrip' : 'challenge');
  }
  return state.pairs;
}

function pairUp(list) {
  const out = [];
  for (let i = 0; i + 1 < list.length; i += 2) out.push([list[i], list[i + 1]]);
  return out;
}

let pairSeq = 0;
function addPair(state, p) {
  const kin = p.kin ?? tieOf(state, p.a, p.b);
  const pair = { id: `p${state.ep || 0}-${++pairSeq}-${p.a}`, a: p.a, b: p.b, since: state.ep || 1, how: p.how, why: p.why || null, kin: kin || null };
  state.pairs.push(pair);
  state.partnerOf[p.a] = p.b;
  state.partnerOf[p.b] = p.a;
  state.pairLog[pair.id] = { a: p.a, b: p.b, carry: { [p.a]: 0, [p.b]: 0 }, events: [] };
  (state.pairHistory ||= []).push({ a: p.a, b: p.b, from: pair.since, how: p.how });
  return pair;
}

/** Put a pair back together (a return from the Arena): the pair they were, as a new entry in the history. */
export function restorePair(state, a, b) {
  state.pairs ||= []; state.partnerOf ||= {}; state.pairLog ||= {};
  const was = (state.pairHistory || []).findLast?.(h => (h.a === a && h.b === b) || (h.a === b && h.b === a));
  return addPair(state, { a, b, how: was?.how || 'return', why: 'return' });
}

export function dissolvePair(state, n) {
  const p = pairOf(state, n);
  if (!p) return null;
  state.pairs = state.pairs.filter(x => x !== p);
  delete state.partnerOf[p.a];
  delete state.partnerOf[p.b];
  const h = (state.pairHistory || []).findLast?.(x => x.a === p.a && x.b === p.b && x.to == null);
  if (h) h.to = state.ep;
  return p;
}

// ── who carried whom ─────────────────────────────────────────────────
// Every daily and every Arena adds to it: the partner who did better gets the difference, the other loses it. The
// season's sum is what "I carried you all season" is said from, and what a share-or-keep chooser weighs.
export function logCarry(state, a, b, d, what) {
  const p = pairOf(state, a);
  if (!p || partnerOf(state, a) !== b) return;
  const log = state.pairLog[p.id];
  const x = clamp(d, -1, 1);
  log.carry[a] = +((log.carry[a] || 0) + x).toFixed(2);
  log.carry[b] = +((log.carry[b] || 0) - x).toFixed(2);
  log.events.push({ ep: state.ep, what, by: x >= 0 ? a : b, d: +Math.abs(x).toFixed(2) });
}
/** { by, over, amount } the partner who carried the pair so far, or null when it is even. */
export function carriedBy(state, n, partner = partnerOf(state, n)) {
  const log = Object.values(state.pairLog || {}).filter(l => (l.a === n && l.b === partner) || (l.a === partner && l.b === n)).at(-1);
  if (!log) return null;
  const d = (log.carry[n] || 0) - (log.carry[partner] || 0);
  if (Math.abs(d) < 1) return null;
  return d > 0 ? { by: n, over: partner, amount: +(d / 2).toFixed(2) } : { by: partner, over: n, amount: +(-d / 2).toFixed(2) };
}

// After a pairs daily: the contributions inside each pair (scores from dailies.js playDaily).
export function logDaily(state, units, scores, dailyName) {
  const vals = Object.values(scores).filter(v => Number.isFinite(v));
  const spread = vals.length > 1 ? Math.max(1, Math.sqrt(vals.reduce((s, v) => s + (v - vals.reduce((a, b) => a + b, 0) / vals.length) ** 2, 0) / vals.length)) : 1;
  for (const u of units) {
    if (u.length !== 2 || partnerOf(state, u[0]) !== u[1]) continue;
    const [a, b] = u;
    logCarry(state, a, b, ((scores[a] || 0) - (scores[b] || 0)) / spread / 2, dailyName || 'daily');
  }
}

// ── the pair's call-out ──────────────────────────────────────────────
// Both partners have a pick; they agree, or one of them overrules the other (the bolder, the more strategic, the
// more respected), and the one overruled remembers it. Each candidate pair is read from both its members: the mean
// of the two, plus the stronger pull either way (a grudge with one of them is enough; a friend among them holds you
// back).
export function choosePairOpponent(state, rng, by, pool, opts = {}) {
  const mine = membersOf(state, by);
  const cands = [...new Set(pool.map(n => repOf(state, n)))].filter(r => !mine.includes(r));
  if (!cands.length) return null;
  const total = t => t.survive + t.grudge + t.prove + t.avoid + t.protect + t.promise + t.wish + t.shot;
  const readOf = x => cands.map(r => {
    const ts = membersOf(state, r).map(y => ({ y, t: calloutTerms(state, x, y, opts) }));
    const tots = ts.map(z => total(z.t));
    const mean = tots.reduce((a, b) => a + b, 0) / tots.length;
    const hi = Math.max(...tots), lo = Math.min(...tots);
    const v = mean + (hi - mean) * 0.4 + Math.min(0, lo - mean) * 0.6;
    const top = ts.sort((p, q) => total(q.t) - total(p.t))[0];
    return { r, v, top };
  }).sort((p, q) => q.v - p.v);
  const reads = Object.fromEntries(mine.map(x => [x, readOf(x)]));
  const wants = Object.fromEntries(mine.map(x => [x, reads[x][0]?.r || null]));
  const weight = x => S(x, 'boldness') * 0.45 + S(x, 'strategic') * 0.3 + (state.rec[x]?.respect || 0) * 0.25 + (state.mind[x]?.confidence || 5) * 0.15;
  const [x1, x2] = mine;
  const agreed = !x2 || wants[x1] === wants[x2];
  let decider = x1;
  if (x2 && !agreed) decider = weight(x2) + noise(rng) * 0.6 > weight(x1) ? x2 : x1;
  // a weighted draw over the decider's read, softened by the partner's
  const blend = cands.map(r => {
    const d = reads[decider].find(z => z.r === r), o = x2 ? reads[decider === x1 ? x2 : x1].find(z => z.r === r) : d;
    return { r, v: d.v * 0.75 + o.v * 0.25, top: d.top };
  });
  const best = Math.max(...blend.map(b => b.v));
  let r = blend[0].r;
  { let s = rng() * blend.reduce((a, b) => a + Math.exp((b.v - best) * 1.1), 0);
    for (const b of blend) { s -= Math.exp((b.v - best) * 1.1); if (s <= 0) { r = b.r; break; } } }
  const chosen = blend.find(b => b.r === r);
  const t = chosen.top.t;
  const parts = { survive: t.survive, grudge: t.grudge, prove: t.prove, shot: t.shot };
  let reason = Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0];
  if (t.promise > 0) reason = 'promise';
  // who did not get the name they wanted, when the other one did; when neither did, it was a compromise
  const got = x => wants[x] === r;
  const overruled = x2 && !agreed ? (got(x1) && !got(x2) ? x2 : got(x2) && !got(x1) ? x1 : null) : null;
  // the one who got their way decided it, whoever was louder going in
  if (overruled) decider = overruled === x1 ? x2 : x1;
  else if (x2 && !agreed) decider = null;
  if (overruled) {
    addBond(overruled, decider, -0.4);
    remember(overruled, decider, 'overruled-me', 0.7);
  } else if (x2) addBond(x1, x2, 0.2);
  return { opponent: r, about: chosen.top.y, reason, terms: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +v.toFixed(2)])),
    decider: decider || (overruled ? mine.find(x => x !== overruled) : x1), compromise: !agreed && !overruled, agreed, overruled, wants, ranked: blend.sort((a, b) => b.v - a.v).slice(0, 4).map(b => ({ name: b.r, total: +b.v.toFixed(2) })) };
}

// ── the two-on-two ───────────────────────────────────────────────────
// Each beat is played by a pair: the average of both partners at this game (CLAUDE.md: averages, never sums), and
// teamwork from the bond between them (a pair that cannot stand each other gives a little away on every beat: the
// whole joke of Rivals). Each beat names who won it for their side and who lost it for theirs, so "you cost us"
// has a receipt.
function side(state, rng, game, pair) {
  const each = pair.map(n => ({ n, s: blendScore(n, game.blend) * performanceMod(state, n, 1) + (state.rec[n]?.respect || 0) * 0.04 + noise(rng) * 0.35 }));
  const avg = each.reduce((a, x) => a + x.s, 0) / each.length;
  const team = pair.length === 2 ? clamp(getBond(pair[0], pair[1]), -10, 10) * 0.03 : 0;
  return { avg: avg + team, each, team };
}
function pairBeat(state, rng, game, A, B, carry = 0) {
  const sa = side(state, rng, game, A), sb = side(state, rng, game, B);
  const edge = (sa.avg - sb.avg) * 0.55 + carry + noise(rng) * 0.55;
  const pA = logistic(edge);
  const aWins = rng() < pA;
  const [w, l] = aWins ? [sa, sb] : [sb, sa];
  // who did it: the winning side's better one today; who cost it: the losing side's worse one
  const by = [...w.each].sort((x, y) => y.s - x.s)[0].n;
  const cost = [...l.each].sort((x, y) => x.s - y.s)[0].n;
  return { aWins, by, cost, margin: Math.abs(pA - 0.5) * 2, teamA: +sa.team.toFixed(2), teamB: +sb.team.toFixed(2) };
}
const pairGuess = (state, pair) => pair.reduce((a, n) => a + arenaRead(state, n), 0) / pair.length;

/** The duel between two pairs. a, b are the representatives; the result names the pairs, and winner/loser are reps. */
export function playPairDuel(state, rng, a, b, game = null) {
  game ||= drawGame(state, rng);
  const A = membersOf(state, a), B = membersOf(state, b);
  const beats = [];
  let aWon;
  if (game.format.startsWith('first-to')) {
    const need = Number(game.format.split('-')[2]);
    const score = { [a]: 0, [b]: 0 };
    let carry = 0;
    while (score[a] < need && score[b] < need) {
      const r = pairBeat(state, rng, game, A, B, carry);
      const winner = r.aWins ? a : b;
      score[winner]++;
      carry = (r.aWins ? 1 : -1) * 0.15;
      beats.push({ kind: 'round', n: beats.length + 1, winner, by: r.by, cost: r.cost, score: { ...score }, margin: +r.margin.toFixed(2) });
    }
    aWon = score[a] >= need;
  } else {
    let lead = 0;
    for (let i = 1; i <= 3; i++) {
      const r = pairBeat(state, rng, game, A, B);
      lead += (r.aWins ? 1 : -1) * (0.5 + r.margin);
      beats.push({ kind: game.format === 'race' ? 'stage' : 'hold', n: i, ahead: lead >= 0 ? a : b, by: r.by, cost: r.cost, margin: +r.margin.toFixed(2) });
    }
    aWon = lead >= 0;
    beats.push({ kind: 'finish', winner: aWon ? a : b });
  }
  const winner = aWon ? a : b, loser = aWon ? b : a;
  const winners = aWon ? A : B, losers = aWon ? B : A;
  const mid = beats[Math.floor((beats.length - 1) / 2)];
  const comeback = (mid?.winner || mid?.ahead) === loser;
  const upset = pairGuess(state, losers) - pairGuess(state, winners) > 1.2;
  for (const n of [...A, ...B]) nudge(state, n, 'energy', -2.6);
  // who carried inside each pair: beats won for the side, beats lost for it
  for (const pair of [A, B]) {
    if (pair.length !== 2) continue;
    const [x, y] = pair;
    const net = n => beats.filter(bt => bt.by === n).length - beats.filter(bt => bt.cost === n).length;
    logCarry(state, x, y, (net(x) - net(y)) / 3, 'arena');
  }
  return { game: game.id, gameName: game.name, kind: game.kind, a, b, pairA: A, pairB: B, winner, loser, winners, losers, beats, upset, comeback, pairs: true };
}

// ── when a partner leaves ────────────────────────────────────────────
// A quit, a medevac, a disqualification ends the pair. Rivals III: "Simone was sent home as his partner". Unless
// somebody else is also without a partner that day, in which case the two are paired ("stuck with what's left").
// Returns { left, repaired } — `left` goes home (the caller removes them), or `repaired` is their new pair.
export function partnerLeft(state, gone, how) {
  const p = dissolvePair(state, gone);
  state.lone = (state.lone || []).filter(n => n !== gone);
  if (!p) return null;
  const left = p.a === gone ? p.b : p.a;
  if (!state.active.includes(left)) return null;
  remember(left, gone, 'left-me', how === 'quit' ? 2.2 : how === 'disqualified' ? 1.8 : 0.4);
  const free = (state.lone || []).filter(n => n !== left && state.active.includes(n) && fits(state, left, n));
  if (free.length) {
    const other = free[0];
    state.lone = state.lone.filter(n => n !== other);
    const np = addPair(state, { a: left, b: other, how: 'leftover', why: 'leftover' });
    addScene(state, 'pair-repaired', [left, other], { gone, how }, state.active, 'villa');
    return { repaired: np };
  }
  return { left, gone, how };
}

// ── the swaps of a Pick season ───────────────────────────────────────
// Double Agents' infiltration: an Arena-winning pair may break up a pair; one winner takes a partner from another
// pair, weighed by that player's strength, their bond, and loyalty to the partner they have. The two left behind
// become a pair. At most one a week; never in the last two episodes before the final (the caller checks).
export function infiltrate(state, rng, winners) {
  if (pairingOf(state) !== 'pick' || winners.length !== 2) return null;
  let best = null;
  for (const w of winners) {
    const mine = partnerOf(state, w);
    if (!mine) continue;
    const keep = getBond(w, mine) * 0.5 + S(w, 'loyalty') * 0.25 + threatRead(state, mine) * 0.3 * S(w, 'strategic') / 10;
    for (const p of state.pairs) {
      if (p.a === w || p.b === w) continue;
      for (const t of [p.a, p.b]) {
        if (!fits(state, w, t)) continue;
        const want = getBond(w, t) * 0.5 + threatRead(state, t) * 0.3 * S(w, 'strategic') / 10 + S(w, 'boldness') * 0.05 + noise(rng) * 0.3
          + (coupleOf(state, w) === t ? 3 : 0);
        const gain = want - keep;
        if (gain > 0.8 && (!best || gain > best.gain)) best = { w, mine, t, from: p.a === t ? p.b : p.a, gain };
      }
    }
  }
  if (!best || rng() > logistic(best.gain - 1.2) * 0.8) return null;
  const { w, mine, t, from } = best;
  dissolvePair(state, w); dissolvePair(state, t);
  addPair(state, { a: w, b: t, how: 'swap', why: 'took' });
  addPair(state, { a: mine, b: from, how: 'swap', why: 'leftover' });
  remember(mine, w, 'dumped-me', 1.6); remember(from, t, 'taken-from-me', 0.9);
  addBond(mine, w, -1.2); addBond(w, t, 0.6);
  nudge(state, mine, 'morale', -1); nudge(state, mine, 'confidence', -0.6);
  addScene(state, 'pair-swap', [w, t, mine, from], { took: t, dumped: mine, from }, state.active, 'arena');
  return { by: w, took: t, dumped: mine, from };
}

/** Partner Swap (the Format Designer's one-episode twist): every pair redrawn by the season's own rule. */
export function partnerSwap(state, rng) {
  if (!pairsOn(state) || state.pairs.length < 2) return null;
  const before = state.pairs.map(p => [p.a, p.b]);
  for (const p of [...state.pairs]) dissolvePair(state, p.a);
  const people = shuffle(rng, state.active);
  // a swap never hands anybody their own partner back: the old pair costs too much
  const was = (a, b) => before.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const method = pairingOf(state);
  const cost = method === 'rivals' ? (a, b) => getBond(a, b) : (a, b) => -getBond(a, b) + noise(rng) * 1.5;
  const { out, left } = match(state, people, (a, b) => cost(a, b) + (was(a, b) ? 50 : 0));
  for (const r of out) addPair(state, { a: r.a, b: r.b, how: 'swap', why: was(r.a, r.b) ? 'again' : method === 'rivals' ? 'cold' : 'draw' });
  for (const [a, b] of pairUp(left)) addPair(state, { a, b, how: 'swap', why: 'leftover' });
  for (const p of state.pairs) for (const n of [p.a, p.b]) nudge(state, n, 'paranoia', 0.3);
  addScene(state, 'partner-swap', state.active, { before, after: state.pairs.map(p => [p.a, p.b]) }, state.active, 'villa');
  return { before, after: state.pairs.map(p => [p.a, p.b]) };
}

// ── the arc of a pair ────────────────────────────────────────────────
// Production's rivals either grow into friends or stay at war, and the moment it turns is the season's: aired big.
// Read at the end of every episode: the lowest the bond has been, and where it is now. A pair that was at war (-1 or
// below) and now likes each other (+2) has turned; one that sank to -6 is at war for good, said once.
export function pairArcs(state) {
  if (!pairsOn(state)) return [];
  const out = [];
  state.pairArc ||= {};
  for (const p of state.pairs) {
    const arc = (state.pairArc[p.id] ||= { low: getBond(p.a, p.b), turned: false, war: false });
    const b = getBond(p.a, p.b);
    arc.low = Math.min(arc.low, b);
    if (!arc.turned && arc.low <= -1 && b >= 2 && p.since < state.ep) {
      arc.turned = true;
      for (const n of [p.a, p.b]) nudge(state, n, 'morale', 0.8);
      addScene(state, 'pair-turn', [p.a, p.b], { rivals: p.how === 'rivals', low: +arc.low.toFixed(1) }, state.active, 'villa');
      out.push({ pair: [p.a, p.b], arc: 'turned' });
    } else if (!arc.war && b <= -6 && state.ep >= 2) {
      arc.war = true;
      for (const n of [p.a, p.b]) nudge(state, n, 'morale', -0.6);
      addScene(state, 'pair-war', [p.a, p.b], { rivals: p.how === 'rivals' }, state.active, 'villa');
      out.push({ pair: [p.a, p.b], arc: 'war' });
    }
  }
  return out;
}

// After a two-on-two: inside the losing pair, the one who cost it hears about it (or swallows it); inside the winning
// pair, the one who carried it says so, or the two of them celebrate as one. From the beats (who won each one for
// their side, who lost it for theirs).
export function arenaPairBeats(state, rng, duel) {
  const net = n => duel.beats.filter(b => b.by === n).length - duel.beats.filter(b => b.cost === n).length;
  const out = [];
  for (const [pair, won] of [[duel.losers, false], [duel.winners, true]]) {
    if (pair.length !== 2) continue;
    const [hi, lo] = [...pair].sort((x, y) => net(y) - net(x));
    const gap = net(hi) - net(lo);
    if (!won && gap >= 1) {
      const says = rng() < 0.35 + (10 - S(hi, 'temperament')) * 0.05 - Math.max(0, getBond(hi, lo)) * 0.04;
      if (says) { addBond(hi, lo, -0.8); remember(lo, hi, 'blamed-me', 1); }
      addScene(state, 'pair-arena-blame', [hi, lo], { says, gap, game: duel.gameName }, state.active, 'arena');
      out.push({ kind: 'blame', hi, lo, says });
    } else if (won) {
      if (gap >= 2) { remember(lo, hi, 'carried-me', 1); addBond(hi, lo, 0.3); }
      else addBond(hi, lo, 0.8);
      addScene(state, 'pair-arena-win', [hi, lo], { carried: gap >= 2, game: duel.gameName }, state.active, 'arena');
      out.push({ kind: gap >= 2 ? 'carried' : 'together', hi, lo });
    }
  }
  return out;
}
