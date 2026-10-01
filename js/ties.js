// ══════════════════════════════════════════════════════════════════════
// ties.js — who characters ARE to each other, across every show
// ══════════════════════════════════════════════════════════════════════
//
// User (2026-09-30): "do those relationship settings persist between shows,
// like a married couple stays married in life after the show" ... "do derived
// family, and married is the starting point".
//
// A family tie is a fact about two people, not about a season, so it is
// authored on the CHARACTER (Create Character → Family & ties; the roster's
// `ties`: [{ name, kin, role? }], in the Relationships tab's own words,
// core.js REL_KINSHIP). This module reads it:
//   · both ways — set it on one of the two;
//   · with the family nobody typed worked out from it (a parent's sibling is
//     an aunt, their child a cousin, a parent's parent a grandparent, siblings
//     share parents, a spouse's family are in-laws). What was typed always
//     wins over what was worked out;
//   · into the cast's Relationships tab lookups (core.js kinshipBetween /
//     kinshipPairs), so every show that already reads kinship (Big Brother,
//     Perfect Match, the Circle) gets the roster's ties for the people it cast
//     without anyone retyping them (js/ties-kin.js, the simulator only — a
//     public page reads ties without loading the simulator's core). A row
//     typed on the tab still wins: a season can say two siblings are
//     estranged this time.
//
// A couple's tie (married, engaged, partners, dating) is where their life
// STARTS: the life layer has the last word once it has news about them
// (franchise-carry.js).
import { setLifeStart } from './life-events.js';

// The relations with a direction, and the two sides: `role` on a tie is what
// the character it is written on is TO the other one.
export const DIRECTED = { 'parent-child': ['parent', 'child'], grandparent: ['grandparent', 'grandchild'], 'aunt-uncle': ['elder', 'younger'] };
const FLIP = { parent: 'child', child: 'parent', grandparent: 'grandchild', grandchild: 'grandparent', elder: 'younger', younger: 'elder' };
const SIBLINGS = new Set(['siblings', 'twins', 'step-siblings']);
const SPOUSE = new Set(['married']);
export const TOGETHER = new Set(['married', 'engaged', 'partners', 'dating']);
const key = (a, b) => [a, b].sort().join('|');

const _cache = new WeakMap();
// The simulator's live roster, or the one a page loaded (useRoster) — the
// published site has no window.FRANCHISE_ROSTER.
let _pageRoster = null;
/** For a page outside the simulator: the roster it fetched (franchise_roster.json). */
export function useRoster(list) {
  _pageRoster = Array.isArray(list) ? list : (Array.isArray(list?.players) ? list.players : null);
}
const rosterNow = () => (typeof window !== 'undefined' && Array.isArray(window.FRANCHISE_ROSTER) ? window.FRANCHISE_ROSTER : (_pageRoster || []));

/** Every tie the roster states, one edge per pair: { a, b, kin, roleA } (roleA: what a is to b). */
export function authoredEdges(roster = rosterNow()) {
  const out = new Map();
  for (const c of roster || []) {
    for (const t of c?.ties || []) {
      if (!t?.name || !t.kin || t.name === c.name) continue;
      const k = key(c.name, t.name);
      if (out.has(k)) continue;
      const roleA = DIRECTED[t.kin] ? (FLIP[t.role] ? t.role : DIRECTED[t.kin][0]) : null;
      out.set(k, { a: c.name, b: t.name, kin: t.kin, ...(roleA ? { roleA } : {}) });
    }
  }
  return out;
}

/** What `x` is to `y` on an edge (a role, or the kin for a relation with no direction). */
const roleOf = (e, x) => (e.roleA ? (e.a === x ? e.roleA : FLIP[e.roleA]) : null);

/** The family nobody typed, from the family somebody did. */
export function derivedEdges(authored) {
  const edges = new Map(authored);
  const add = (a, b, kin, roleA = null) => {
    if (!a || !b || a === b) return false;
    const k = key(a, b);
    if (edges.has(k)) return false;
    edges.set(k, { a, b, kin, ...(roleA ? { roleA } : {}), derived: true });
    return true;
  };
  const people = () => [...new Set([...edges.values()].flatMap(e => [e.a, e.b]))];
  const rel = (x, pred) => [...edges.values()].filter(e => (e.a === x || e.b === x) && pred(e, x)).map(e => (e.a === x ? e.b : e.a));
  const parentsOf = x => rel(x, (e, me) => e.kin === 'parent-child' && roleOf(e, me) === 'child');
  const siblingsOf = x => rel(x, e => SIBLINGS.has(e.kin));
  const spousesOf = x => rel(x, e => SPOUSE.has(e.kin));
  // Repeat until nothing new: a derived sibling can make a derived aunt.
  for (let pass = 0; pass < 6; pass++) {
    let grew = false;
    for (const x of people()) {
      // A sibling's sibling is a sibling (twins stay twins with each other only).
      for (const s of siblingsOf(x)) for (const t of siblingsOf(s)) grew = add(x, t, 'siblings') || grew;
      // Siblings share their parents.
      for (const s of siblingsOf(x)) for (const p of parentsOf(s)) grew = add(p, x, 'parent-child', 'parent') || grew;
    }
    for (const x of people()) {
      for (const p of parentsOf(x)) {
        // A parent's parent is a grandparent.
        for (const g of parentsOf(p)) grew = add(g, x, 'grandparent', 'grandparent') || grew;
        // A parent's sibling is an aunt or uncle; their child is a cousin.
        for (const u of siblingsOf(p)) {
          grew = add(u, x, 'aunt-uncle', 'elder') || grew;
          for (const c of rel(u, (e, me) => e.kin === 'parent-child' && roleOf(e, me) === 'parent')) grew = add(x, c, 'cousins') || grew;
        }
      }
      // A spouse's family, and a sibling's spouse, are in-laws.
      for (const sp of spousesOf(x)) {
        for (const p of parentsOf(sp)) grew = add(x, p, 'in-laws') || grew;
        for (const s of siblingsOf(sp)) grew = add(x, s, 'in-laws') || grew;
      }
      for (const s of siblingsOf(x)) for (const sp of spousesOf(s)) grew = add(x, sp, 'in-laws') || grew;
    }
    if (!grew) break;
  }
  return edges;
}

/** Every tie, typed and worked out, for a roster (cached until the roster changes). */
export function allTies(roster = rosterNow()) {
  // Keyed on the array and a cheap signature, so a roster edited in place
  // (a tie added, a character pushed) is worked out again.
  let sig = (roster || []).length;
  for (const c of roster || []) sig += (c?.ties?.length || 0) * 1000003;
  const hit = roster && typeof roster === 'object' ? _cache.get(roster) : null;
  if (hit && hit.sig === sig) return hit.all;
  const all = derivedEdges(authoredEdges(roster));
  if (roster && typeof roster === 'object') _cache.set(roster, { sig, all });
  return all;
}

/** The tie between two people, or null: { kin, roleA (what a is to b), derived }. */
export function tieBetween(a, b, roster = rosterNow()) {
  const e = allTies(roster).get(key(a, b));
  if (!e) return null;
  return { kin: e.kin, ...(e.roleA ? { roleA: roleOf(e, a) } : {}), derived: !!e.derived };
}

/** Every tie between two of these people. */
export function tiesAmong(names, roster = rosterNow()) {
  const set = new Set(names || []);
  return [...allTies(roster).values()].filter(e => set.has(e.a) && set.has(e.b));
}

/** Everyone a person is tied to, from their side: [{ name, kin, role, derived }]. */
export function tiesOf(name, roster = rosterNow()) {
  return [...allTies(roster).values()].filter(e => e.a === name || e.b === name).map(e => {
    const other = e.a === name ? e.b : e.a;
    return { name: other, kin: e.kin, ...(e.roleA ? { role: roleOf(e, name) } : {}), derived: !!e.derived };
  });
}

// ── Where a tie starts a pair, for an engine with no relation layer ──
// (The Traitors.) The same scale the villa starts its relations on (js/pm/kin.js
// START). A couple is not here: the life layer carries a couple in.
export const TIE_BOND = {
  twins: 7, siblings: 6, 'step-siblings': 3.5, 'parent-child': 6, grandparent: 5, 'aunt-uncle': 4, cousins: 4, 'in-laws': 2.5,
  estranged: -3, 'best-friends': 6, 'childhood-friends': 5, 'old-friends': 3.5, roommates: 3, colleagues: 1.5, teammates: 2,
  exes: 0.5, 'ex-friends': -3,
};
/**
 * The cast's ties as starting bonds, with the franchise's carried sums added
 * on top (a betrayal between sisters on another show leaves them sisters, and
 * colder). `pairs` are core.js kinshipPairs() rows; `carried` franchise-carry sums.
 */
export function tieStartBonds(cast, pairs = [], carried = [], clamp = 7) {
  const inCast = new Set(cast || []);
  const sum = new Map();
  const put = (a, b, d) => {
    if (!inCast.has(a) || !inCast.has(b) || a === b || !Number.isFinite(d)) return;
    const k = key(a, b);
    const cur = sum.get(k) || { a, b, delta: 0 };
    cur.delta += d; sum.set(k, cur);
  };
  for (const p of pairs || []) if (!(p.fromProfile && p.couple) && TIE_BOND[p.kin] != null) put(p.a, p.b, TIE_BOND[p.kin]);
  for (const c of carried || []) put(c.a, c.b, Number(c.delta));
  return [...sum.values()].map(s => ({ ...s, delta: Math.max(-clamp, Math.min(clamp, s.delta)) })).filter(s => s.delta);
}

// ── Married is the starting point ──
// A couple tie set on the character is where their life STARTS (life-events.js
// stateOf): "Married to Luis" on Dramagram with no wedding invented, and the
// life layer moves it on from there. Only what was TYPED: nobody is worked out
// into a marriage. The closest tie wins if somebody typed two.
export const TIE_STAGE = { married: 'married', engaged: 'engaged', partners: 'living-together', dating: 'dating' };
const STAGE_RANK = ['married', 'engaged', 'partners', 'dating'];
export function startingCouple(name, roster = rosterNow()) {
  const mine = tiesOf(name, roster).filter(t => !t.derived && TIE_STAGE[t.kin]);
  if (!mine.length) return null;
  mine.sort((x, y) => STAGE_RANK.indexOf(x.kin) - STAGE_RANK.indexOf(y.kin));
  return { kin: mine[0].kin, stage: TIE_STAGE[mine[0].kin], withName: mine[0].name };
}
/** The same, by slug, for the life log (which keys people by slug). */
export function startingCoupleBySlug(slug, roster = rosterNow()) {
  const me = (roster || []).find(c => c?.slug === slug);
  const c = me && startingCouple(me.name, roster);
  if (!c) return null;
  const partner = (roster || []).find(p => p?.name === c.withName);
  return partner?.slug ? { stage: c.stage, with: partner.slug } : null;
}
setLifeStart(slug => startingCoupleBySlug(slug));
