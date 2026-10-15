// ══════════════════════════════════════════════════════════════════════
// ch/callout.js — who the player voted in names as their opponent, and why
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4.2. Four reasons, scored for every eligible opponent:
//
//   survive      the odds of beating them in an average Arena game, as this
//                player reads them (the record, not the stat sheet);
//   grudge       a bad bond, or "they voted for me" (the revenge list);
//   prove        their strength times boldness, plus a hunger for respect
//                (a rookie, a `prove` need, a free-ride accusation to answer);
//   avoid-beast  a penalty on a strong Arena record.
//
// An ally is almost never called out (unless the player may scheme and is
// strategic with low loyalty); a showmance partner never; an insurance deal
// holds by loyalty. The pick is weighted-random over the totals, and the
// strongest reason is kept so the speech matches it (the dialogue layer reads
// `reason`).
import { getPerceivedBond } from '../bonds.js';
import { S, mayScheme, weighted, logistic } from './state.js';
import { grudgeOf, oweOf, protectOf } from './rel.js';
import { planOf } from './plans.js';
import { arenaRead, freeRide } from './respect.js';
import { allianceOf } from './alliances.js';

export function coupleOf(state, name) {
  const c = state.couples.find(x => !x.ended && (x.a === name || x.b === name));
  return c ? (c.a === name ? c.b : c.a) : null;
}
export function dealBetween(state, a, b) {
  return state.deals.find(d => !d.broken && ((d.a === a && d.b === b) || (d.a === b && d.b === a))) || null;
}

// What X thinks of calling out Y, split by reason.
export function calloutTerms(state, x, y) {
  const mine = arenaRead(state, x), theirs = arenaRead(state, y);
  const bold = S(x, 'boldness') / 10, temper = S(x, 'temperament') / 10, loyal = S(x, 'loyalty') / 10;
  const pWin = logistic((mine - theirs) * 0.6);
  const survive = pWin * 4 * (1 - bold * 0.45);
  // A grudge: resentment and the receipts (they voted me in, they called me out).
  const grudge = (Math.max(0, -getPerceivedBond(x, y)) * 0.2 + grudgeOf(x, y) * 0.75
    + (planOf(state, x)?.revenge?.includes(y) ? 0.8 : 0)) * (1.25 - temper * 0.5);
  const hunger = (state.rookie[x] ? 0.25 : 0) + (state.psyche[x] === 'prove' ? 0.35 : 0) + freeRide(state, x) * 0.4
    + (state.psyche[x] === 'redemption' ? 0.2 : 0);
  const prove = (theirs / 10) * bold * 3 * (1 + hunger);
  const avoid = -Math.max(0, theirs - 6.2) * 0.55 * (1 - bold * 0.8);
  // Friends, the alliance, a showmance, a deal, a debt.
  const bond = protectOf(x, y);
  const schemer = mayScheme(x) && S(x, 'strategic') >= 7 && S(x, 'loyalty') <= 3;
  let protect = 0;
  if (bond > 2.5) protect -= (bond - 2.5) * 0.7 * (0.4 + loyal);
  const al = allianceOf(state, x);
  if (al && al.members.includes(y)) protect -= schemer ? 0.8 : 3 * (0.4 + loyal);
  if (coupleOf(state, x) === y) protect -= 9;
  if (dealBetween(state, x, y)) protect -= 2.5 * (0.3 + loyal);
  protect -= oweOf(x, y) * 0.6;
  if (planOf(state, x)?.core?.includes(y)) protect -= 2.5 * (0.4 + loyal);
  // A threat made at the vote is a promise the whole house heard: going back on it costs your word, so the
  // bold and the proud keep it (state.promises, vote.js campaign).
  const pr = state.promises?.[x];
  const promise = pr && pr.at === y && pr.ep >= state.ep - 1 ? 0.5 + bold * 1.3 + (1 - temper) * 0.4 + (state.word?.[x] || 0) * 0.3 : 0;
  return { survive, grudge, prove, avoid, protect, promise, pWin };
}

export function chooseOpponent(state, rng, x, eligible) {
  const rows = eligible.filter(y => y !== x).map(y => {
    const t = calloutTerms(state, x, y);
    const total = t.survive + t.grudge + t.prove + t.avoid + t.protect + t.promise;
    return { y, t, total };
  });
  if (!rows.length) return null;
  const best = Math.max(...rows.map(r => r.total));
  const pick = weighted(rng, rows.map(r => ({ item: r, w: Math.exp((r.total - best) * 1.1) })));
  const t = pick.t;
  // The reason: the biggest positive term; "avoid the beast" when the player
  // passed over the strongest eligible to take a safer fight.
  const parts = { survive: t.survive, grudge: t.grudge, prove: t.prove };
  let reason = Object.entries(parts).sort((a, b) => b[1] - a[1])[0][0];
  const strongest = [...rows].sort((a, b) => arenaRead(state, b.y) - arenaRead(state, a.y))[0];
  if (reason === 'survive' && strongest.y !== pick.y && arenaRead(state, strongest.y) >= 7 && strongest.t.avoid < -0.4) reason = 'avoid-beast';
  // they said they would, in front of everybody
  if (t.promise > 0) reason = 'promise';
  // A broken deal is a betrayal on the record.
  const deal = dealBetween(state, x, pick.y);
  return { opponent: pick.y, reason, terms: rounded(t), deal: deal ? deal.id : null,
    ranked: rows.sort((a, b) => b.total - a.total).slice(0, 4).map(r => ({ name: r.y, total: +r.total.toFixed(2) })) };
}

const rounded = t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +v.toFixed(2)]));
