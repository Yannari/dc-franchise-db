// ══════════════════════════════════════════════════════════════════════
// franchise-carry.js — what a cast brings with them, for a show that plays
// in its own game state
// ══════════════════════════════════════════════════════════════════════
//
// User: bonds between islanders, positive and negative, must "persist between
// seasons (an All Stars), between shows (two islanders on The Traitors), and
// outside the shows (the social life system: getting together, married,
// breaking up)".
//
// initGameState (js/savestate.js) already seeds gs.bonds from both sources for
// a Total Drama, Big Brother or Drag Race season: the franchise ledger (what
// happened on a show — js/franchise-meta.js buildFranchiseMeta) and the life
// log (what happened since — js/life-cast.js lifeSeeds). Perfect Match and The
// Traitors play inside a game state of their own (setGs at the top of their
// season functions) and never saw either. This is the one place both read it.
//
// LIFE OUTRANKS THE LEDGER. A couple who finished a villa together and split
// outside walk in as exes; a showmance that "ended badly" on a show and got
// back together since walks in as a couple.
//
// Empty on a franchise with no history, so a new cast plays exactly as before.
import { buildFranchiseMeta } from './franchise-meta.js';
import { lifeSeeds } from './life-cast.js';

// A life stage as a relation the villa can play (js/pm/kin.js START / TOGETHER).
export const LIFE_KIN = { dating: 'dating', public: 'dating', 'living-together': 'partners', engaged: 'engaged', married: 'married' };
const CLAMP = 6;
const pk = (a, b) => [a, b].sort().join('|');

/**
 * `people` are the cast's player objects; `cfg` the season config.
 *   kin    [{ a, b, kin, from }]   relations: exes, a couple, old friends
 *   bonds  [{ a, b, delta, resent, why }]   grudges: betrayal, blindside, rivals
 *   sums   [{ a, b, delta }]       every pair's carried bond, summed and clamped
 *                                  (for an engine with no relation layer)
 */
export function carriedFor(people = [], cfg = {}, { lifeLog = null, lifeSeasons = null } = {}) {
  const out = { kin: [], bonds: [], sums: [] };
  const w = typeof window !== 'undefined' ? window : {};
  let meta = null, life = null;
  try { meta = buildFranchiseMeta(people, cfg); } catch { meta = null; }
  if (cfg?.lifeCarryover !== false) {
    try { life = lifeSeeds(people, lifeLog || w.__lifeLog || [], lifeSeasons || w.__lifeSeasons || []); } catch { life = null; }
  }
  const decided = new Set();
  const sum = new Map();
  const add = (a, b, d) => {
    const k = pk(a, b);
    const cur = sum.get(k) || { a, b, delta: 0 };
    cur.delta += Number(d) || 0;
    sum.set(k, cur);
  };
  for (const sh of life?.showmances || []) {
    const [a, b] = sh.players; decided.add(pk(a, b));
    out.kin.push({ a, b, kin: LIFE_KIN[sh.stage] || 'dating', from: 'life' });
  }
  for (const sp of life?.pairs || []) {
    add(sp.a, sp.b, sp.bondDelta);
    if (sp.kind !== 'life-ex' || decided.has(pk(sp.a, sp.b))) continue;
    decided.add(pk(sp.a, sp.b));
    out.kin.push({ a: sp.a, b: sp.b, kin: 'exes', from: 'life' });
  }
  for (const sp of meta?.seededPairs || []) {
    const k = pk(sp.a, sp.b);
    const lifeSettled = (life?.showmances || []).some(sh => pk(...sh.players) === k)
      || (life?.pairs || []).some(p => p.kind === 'life-ex' && pk(p.a, p.b) === k);
    if (sp.kind === 'showmance-broken' || sp.kind === 'showmance-intact') {
      // Life has the last word on a couple.
      if (!lifeSettled) add(sp.a, sp.b, sp.bondDelta);
      if (decided.has(k)) continue;
      decided.add(k);
      out.kin.push({ a: sp.a, b: sp.b, kin: sp.kind === 'showmance-broken' ? 'exes' : 'dating', from: 'ledger' });
    } else if (sp.kind === 'allies') {
      add(sp.a, sp.b, sp.bondDelta);
      if (!decided.has(k)) { decided.add(k); out.kin.push({ a: sp.a, b: sp.b, kin: 'old-friends', from: 'ledger' }); }
    } else {
      // betrayal · blindside · rivals: the one it is about carries the grudge.
      add(sp.a, sp.b, sp.bondDelta);
      out.bonds.push({ a: sp.a, b: sp.b, delta: sp.bondDelta, resent: sp.kind === 'rivals' || sp.wronged !== false, why: sp.kind });
    }
  }
  out.sums = [...sum.values()].map(s => ({ ...s, delta: Math.max(-CLAMP, Math.min(CLAMP, s.delta)) })).filter(s => s.delta);
  return out;
}
