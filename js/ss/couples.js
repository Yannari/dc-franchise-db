// ══════════════════════════════════════════════════════════════════════
// ss/couples.js — keeping a real tie hidden, every week
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-28: "the struggle to hide your relationship to protect your secret is one of the most common
// storylines". Two housemates who share a real secret (a couple, a family, two friends: js/ss/duos.js, or the
// roster's own ties) live it every week, and every week it can give them away:
//   a COUPLE steals a moment at night (closer; somebody may catch it), keeps its distance in public until somebody
//     flirts with one of them (jealousy, a fight in private, the make-up), or lets a pet name slip;
//   a FAMILY or two FRIENDS defend each other too hard, share a joke that is too old, look after each other.
// Pure: events with `effects` and `evidence` for the adapter (js/bb/secret-story.js). `ctx.pick` forces one (tests).

import { addEvidence } from './hunt.js';
import { duoRel } from './duos.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const ROMANCE = ['stolen', 'jealous', 'slip'];
const KIN = ['defend', 'joke', 'care'];

/**
 * The week's moments for every real tie still hidden (two weeks in three, one moment a tie).
 * @param {any} state @param {any} ctx huntCtx (+ compat) @param {{ house?: string[] }} o
 * @returns {any[]}
 */
export function coupleWeek(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const compat = (a, b) => (typeof ctx.compat === 'function' ? !!ctx.compat(a, b) : true);
  const out = [];
  const ties = (state.secrets || []).filter(s => !s.found && s.kind === 'real-pair' && (s.holders || []).length === 2 && s.holders.every(h => house.includes(h)));
  for (const s of ties) {
    if (!ctx.pick && (s.lastDuo === wk - 1 && rng() < 0.5)) continue;
    const [a, b] = s.holders;
    const rel = duoRel(s);
    const others = house.filter(n => n !== a && n !== b);
    if (!others.length) continue;
    const pool = rel === 'romance' ? ROMANCE : KIN;
    const kind = ctx.pick && pool.includes(ctx.pick) ? ctx.pick : pool.filter(k => k !== s.lastDuoKind)[Math.floor(rng() * (pool.length - 1)) % (pool.length - 1)];
    // the sharpest pair of eyes in the house
    const eyes = others.slice().sort((x, y) => S(y, 'intuition') - S(x, 'intuition') + (rng() - 0.5))[0];
    const fx = { bond: [], pub: [] };
    const evidence = [];
    const care = (S(a, 'temperament') + S(b, 'temperament') + S(a, 'strategic') + S(b, 'strategic')) / 4;
    let ev = null;
    if (kind === 'stolen') {
      // a moment alone, at night: closer; caught, it is the loudest lead there is
      fx.bond.push([a, b, 0.6]);
      const caught = rng() < clamp(0.2 + S(eyes, 'intuition') * 0.04 - care * 0.03, 0.05, 0.6);
      if (caught) { addEvidence(state, ctx, eyes, a, { strength: 0.45, how: 'caught-together' }); evidence.push(eyes); }
      fx.pub.push([a, 'arc', 0.15, 'stole a moment with their secret love'], [b, 'arc', 0.15, 'stole a moment with their secret love']);
      ev = { kind, a, b, caughtBy: caught ? eyes : null, where: ['the bathroom, the taps running', 'under the covers, after lights out', 'the garden, behind the pool house', 'the store room'][Math.floor(rng() * 4) % 4] };
    } else if (kind === 'jealous') {
      // they act like strangers in public, so somebody else is free to flirt: the most taken with one of them
      let best = null;
      for (const n of others) for (const t of [a, b]) if (compat(n, t) && (!best || B(n, t) > B(best[0], best[1]))) best = [n, t];
      const [flirt, target] = best || [others[0], a];
      const jealous = target === a ? b : a;
      fx.bond.push([jealous, flirt, -0.5], [a, b, -0.3], [a, b, 0.5]);
      const showed = rng() < clamp(0.25 - S(jealous, 'temperament') * 0.015 + S(jealous, 'boldness') * 0.01, 0.05, 0.4);
      if (showed) { addEvidence(state, ctx, eyes, a, { strength: 0.3, how: 'jealousy' }); evidence.push(eyes); }
      fx.pub.push([jealous, 'arc', 0.2, 'watched somebody flirt with their secret love'], [jealous, 'pity', 0.1, 'had to watch, and say nothing']);
      ev = { kind, a, b, flirt, target, jealous, showed };
    } else if (kind === 'slip') {
      // a pet name, a "we" too many, in front of the house
      const heard = others.slice().sort(() => rng() - 0.5).slice(0, 2);
      for (const n of heard) addEvidence(state, ctx, n, a, { strength: 0.2, how: 'slip' });
      evidence.push(...heard);
      fx.pub.push([a, 'fun', 0.1, 'nearly gave the couple away']);
      ev = { kind, a, b, heard, word: ['babe', 'my love', 'sweetheart', 'honey'][Math.floor(rng() * 4) % 4] };
    } else if (kind === 'defend') {
      // somebody goes after one of them, and the other jumps in far too fast
      const attacker = others.slice().sort((x, y) => B(x, a) - B(y, a))[0];
      fx.bond.push([attacker, b, -0.4], [a, b, 0.4]);
      addEvidence(state, ctx, attacker, a, { strength: 0.2, how: 'defended' });
      evidence.push(attacker);
      ev = { kind, a, b, attacker };
    } else if (kind === 'joke') {
      const heard = eyes;
      addEvidence(state, ctx, heard, a, { strength: 0.18, how: 'old-joke' });
      evidence.push(heard);
      fx.bond.push([a, b, 0.3]);
      ev = { kind, a, b, heard };
    } else {
      // one of them has a hard day; the other looks after them, quietly
      fx.bond.push([a, b, 0.5]);
      fx.pub.push([b, 'warmth', 0.15, 'looked after somebody quietly']);
      ev = { kind: 'care', a, b };
    }
    s.lastDuo = wk; s.lastDuoKind = ev.kind;
    out.push({ ...ev, rel, text: s.text, effects: fx, evidence });
  }
  return out;
}
