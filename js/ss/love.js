// ══════════════════════════════════════════════════════════════════════
// ss/love.js — love in the House of Secrets: the Love Room, and the couple's week
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-29: "build the love room too and more romance storylines" ("check if the romance is developed
// enough for secret story cause its a real important part of the real show"); "and more dialogue nominations in the
// sas when one of them goes strategy to put the couple in the sas". The showmances themselves come from romance.js
// (spark, honeymoon, target, ride-or-die); this is what Secret Story does with them, a week at a time:
//
//   THE LOVE ROOM (S5, S6): the Voice gives a couple a night in the room with the heart-shaped bed. Closer for it, the
//     country loves it, whoever wanted one of them watches the door close, and the strategists take note.
//   PILLOW TALK: one asks the other for their secret. Refused (a little hurt), or a hint slips (the partner has it).
//   THE CONFESSION: a spark, said out loud. Welcomed, or "not yet".
//   THE DOUBT: a schemer tells one of them the other is only using them for the game.
//   THE FIGHT: a couple's row about the game, and the making up.
//   THE FUTURE: what happens outside, the families, the first weekend.
//   THE THIRD: somebody flirts with one of them; the other one sees it.
//   THE PLOT: two housemates agree the couple is a threat and they are putting them in the airlock.
//
// Every one moves somebody: bonds, the public, the hunt. Pure: state + the hunt's ctx `{ stat, bond, rng, week,
// archetype, compat }`; the adapter (js/bb/secret-story.js) applies `effects`.

import { addEvidence, secretOf } from './hunt.js';

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const VILLAIN = ['villain', 'mastermind', 'schemer'];

/**
 * The couple's week. `couples` = [{ a, b, phase, weeks }] (both in the house), `sparks` = [[a, b]].
 * Returns acts `{ kind, a, b, c?, ..., effects: { bond: [[x, y, d]], pub: [[n, axis, d, why]] } }`.
 */
export function loveWeek(state, ctx, { house = [], couples = [], sparks = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const S = (n, k) => Number(ctx.stat?.(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond?.(a, b)) || 0;
  const arch = n => ctx.archetype?.(n) || '';
  const compat = (a, b) => (typeof ctx.compat === 'function' ? !!ctx.compat(a, b) : true);
  const L = (state.love ||= { rooms: [], log: [] });
  const out = [];
  const busy = new Set();
  const others = (...not) => house.filter(n => !not.includes(n));
  const fx = () => ({ bond: [], pub: [] });
  const done = (kind, a, b) => L.log.some(x => x.kind === kind && x.week === wk - 1 && [x.a, x.b].sort().join() === [a, b].sort().join());
  // (a confession is said once, by a pair)
  const ever = (kind, a, b) => L.log.some(x => x.kind === kind && [x.a, x.b].sort().join() === [a, b].sort().join());
  // who would split a couple: a strategist, or a villain, who is not close to them
  const plotters = (a, b) => others(a, b).filter(x => (S(x, 'strategic') >= 6 || VILLAIN.includes(arch(x)) || B(x, a) + B(x, b) < 0) && B(x, a) + B(x, b) < 3);
  const live = couples.filter(c => house.includes(c.a) && house.includes(c.b));
  // (the nominations read the couples of the week: a strategist would rather split one: js/ss/nominations.js)
  L.couples = live.map(c => [c.a, c.b]);

  // ── THE LOVE ROOM: once a couple, never in week one, about one week in three ──
  const room = live.filter(c => c.phase !== 'spark' && !L.rooms.some(r => [r.a, r.b].sort().join() === [c.a, c.b].sort().join()))
    .sort((x, y) => B(y.a, y.b) - B(x.a, x.b))[0];
  if (room && wk >= 2 && rng() < 0.35) {
    const { a, b } = room;
    const e = fx();
    e.bond.push([a, b, 1.5]);
    e.pub.push([a, 'arc', 0.3, 'spent a night in the Love Room'], [b, 'arc', 0.3, 'spent a night in the Love Room'], [a, 'warmth', 0.1, ''], [b, 'warmth', 0.1, '']);
    // whoever wanted one of them watches the door close
    const jealous = others(a, b).filter(x => (compat(x, a) && B(x, a) >= 4) || (compat(x, b) && B(x, b) >= 4)).sort((x, y) => Math.max(B(y, a), B(y, b)) - Math.max(B(x, a), B(x, b)))[0] || null;
    if (jealous) { const of = B(jealous, a) >= B(jealous, b) ? a : b; e.bond.push([jealous, of === a ? b : a, -1]); e.pub.push([jealous, 'pity', 0.2, 'watched the Love Room door close']); }
    // ...and the strategists see a pair that will vote together
    const wary = others(a, b, jealous).filter(x => S(x, 'strategic') >= 6).slice(0, 2);
    for (const w of wary) e.bond.push([w, a, -0.3], [w, b, -0.3]);
    L.rooms.push({ a, b, week: wk });
    busy.add(a); busy.add(b);
    out.push({ kind: 'loveroom', a, b, jealous, wary, effects: e });
  }

  // ── the week's other storylines: one a couple, two at most ──
  const cands = [];
  for (const c of live) {
    if (busy.has(c.a) || busy.has(c.b)) continue;
    const { a, b } = c;
    const sa = secretOf(state, a), sb = secretOf(state, b);
    const holder = sa && !sa.found && !(sa.holders || []).includes(b) ? a : sb && !sb.found && !(sb.holders || []).includes(a) ? b : null;
    if (holder && !done('pillow', a, b)) cands.push({ kind: 'pillow', c, w: 1.2 });
    if (!done('fight', a, b)) cands.push({ kind: 'fight', c, w: 0.7 + (Number(c.strain) || 0) * 0.3 });
    if (!done('future', a, b) && c.phase !== 'spark') cands.push({ kind: 'future', c, w: 0.8 });
    if (others(a, b).some(x => (VILLAIN.includes(arch(x)) || S(x, 'strategic') >= 7) && B(x, a) < 2)) cands.push({ kind: 'doubt', c, w: 0.7 });
    if (others(a, b).some(x => (compat(x, a) && B(x, a) >= 3) || (compat(x, b) && B(x, b) >= 3))) cands.push({ kind: 'third', c, w: 0.6 });
    if (plotters(a, b).length >= 2 && !done('plot', a, b)) cands.push({ kind: 'plot', c, w: 1.4 });
  }
  for (const [a, b] of sparks) if (house.includes(a) && house.includes(b) && !busy.has(a) && !busy.has(b) && !ever('confession', a, b)) cands.push({ kind: 'confession', c: { a, b, phase: 'spark' }, w: 1 });
  const want = cands.length ? (rng() < 0.6 ? 2 : 1) : 0;
  while (out.filter(x => x.kind !== 'loveroom').length < want && cands.length) {
    const tot = cands.reduce((s, x) => s + x.w, 0);
    let r = rng() * tot, i = 0;
    for (; i < cands.length - 1; i++) { r -= cands[i].w; if (r <= 0) break; }
    const pickd = cands.splice(i, 1)[0];
    const { a, b } = pickd.c;
    if (busy.has(a) || busy.has(b)) continue;
    const ev = story(pickd.kind, pickd.c);
    if (!ev) continue;
    busy.add(a); busy.add(b);
    out.push(ev);
  }
  for (const x of out) L.log.push({ kind: x.kind, a: x.a, b: x.b, week: wk });
  if (L.log.length > 60) L.log.splice(0, L.log.length - 60);
  return out;

  function story(kind, c) {
    const { a, b } = c;
    const e = fx();
    if (kind === 'pillow') {
      const sa = secretOf(state, a);
      const holder = sa && !sa.found && !(sa.holders || []).includes(b) ? a : b;
      const asker = holder === a ? b : a;
      // a loyal, careful holder keeps it; a loose one, very much in love, lets a hint through
      const slipP = clamp(0.18 + (B(a, b) - 4) * 0.04 + (10 - S(holder, 'strategic')) * 0.025 - S(holder, 'loyalty') * 0.01);
      const hinted = rng() < slipP;
      if (hinted) { addEvidence(state, ctx, asker, holder, { strength: 0.3, how: 'pillow-slip' }); e.bond.push([a, b, 0.4]); e.pub.push([holder, 'fun', 0.08, 'nearly told the secret in bed']); }
      else { e.bond.push([a, b, -0.3]); e.pub.push([holder, 'game', 0.1, 'kept the secret even from the one they love']); }
      return { kind, a, b, holder, asker, hinted, effects: e };
    }
    if (kind === 'confession') {
      const first = S(a, 'boldness') >= S(b, 'boldness') ? a : b, other = first === a ? b : a;
      const yes = compat(other, first) && B(a, b) + rng() * 3 >= 4;
      e.bond.push([a, b, yes ? 1.2 : -0.4]);
      e.pub.push([first, yes ? 'arc' : 'pity', yes ? 0.2 : 0.2, yes ? 'said "I like you" first' : 'was told "not yet"']);
      return { kind, a: first, b: other, yes, effects: e };
    }
    if (kind === 'doubt') {
      const d = others(a, b).filter(x => (VILLAIN.includes(arch(x)) || S(x, 'strategic') >= 7) && B(x, a) < 2).sort((x, y) => S(y, 'strategic') - S(x, 'strategic'))[0];
      const told = S(a, 'intuition') <= S(b, 'intuition') ? a : b, about = told === a ? b : a;
      const shaken = B(told, about) + rng() * 4 < 6.5;
      e.bond.push(shaken ? [told, about, -0.8] : [d, told, -0.6]);
      if (shaken) e.bond.push([d, told, 0.3]);
      e.pub.push([d, 'heat', 0.15, 'tried to split the couple']);
      return { kind, a: told, b: about, c: d, shaken, effects: e };
    }
    if (kind === 'fight') {
      const why = ['nominations', 'attention', 'secret', 'kitty'][Math.floor(rng() * 4)];
      const made = B(a, b) + rng() * 3 >= 4;
      e.bond.push([a, b, made ? -0.2 : -0.9]);
      e.pub.push([a, 'fun', 0.08, 'had a row with their partner'], [b, 'fun', 0.08, '']);
      return { kind, a, b, why, made, effects: e };
    }
    if (kind === 'future') {
      e.bond.push([a, b, 0.8]); e.pub.push([a, 'warmth', 0.1, 'talked about the future with their partner'], [b, 'warmth', 0.1, '']);
      return { kind, a, b, effects: e };
    }
    if (kind === 'third') {
      const pool = others(a, b).filter(x => (compat(x, a) && B(x, a) >= 3) || (compat(x, b) && B(x, b) >= 3));
      const t = pool.sort((x, y) => Math.max(B(y, a), B(y, b)) - Math.max(B(x, a), B(x, b)))[0];
      const target = compat(t, a) && B(t, a) >= B(t, b) ? a : b, partner = target === a ? b : a;
      const shut = B(target, partner) + rng() * 3 >= 5;
      e.bond.push([partner, t, -1.5], [target, partner, shut ? 0.4 : -0.6]);
      if (!shut) e.bond.push([target, t, 0.5]);
      e.pub.push([t, 'heat', 0.15, 'flirted with somebody in a couple'], [partner, 'pity', 0.1, '']);
      return { kind, a: target, b: partner, c: t, shut, effects: e };
    }
    if (kind === 'plot') {
      const ps = plotters(a, b).sort((x, y) => (B(x, a) + B(x, b)) - (B(y, a) + B(y, b))).slice(0, 2);
      if (ps.length < 2) return null;
      const [p1, p2] = ps;
      // the plotters close ranks; the couple feels the room cool, and the country notices the scheming
      e.bond.push([p1, p2, 0.6], [p1, a, -0.4], [p1, b, -0.4], [p2, a, -0.4], [p2, b, -0.4]);
      e.pub.push([p1, 'game', 0.12, 'plotted to split the couple'], [p2, 'game', 0.08, '']);
      (L.plots ||= {})[wk] = { by: [p1, p2], couple: [a, b] };
      return { kind, a, b, c: p1, d: p2, effects: e };
    }
    return null;
  }
}
