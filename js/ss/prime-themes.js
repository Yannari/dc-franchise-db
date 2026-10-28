// ══════════════════════════════════════════════════════════════════════
// ss/prime-themes.js — the prime with a theme
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 2, F2.3 (docs/superpowers/specs/2026-10-28-secret-story-powers-design.md). The user, 2026-10-28:
// "do you have themes for primes? like red phone prime, dilemma prime, bridge of sacrifices prime, truth
// revealed prime". Most weeks from week two the prime gets one, drawn against the last two:
//
//   'red-phone'  the red phone rings again and again;
//   'dilemmas'   the Night of Dilemmas: three of them;
//   'bridge'     the Bridge of Sacrifices (S5, S13): housemates cross one by one; on the bridge each is offered a
//                sacrifice so a friend waiting on the other side crosses with a reward;
//   'truths'     Truths Revealed: the room of truths, twice;
//   'rings'      the Rings (S13): four power rings handed to four housemates (secret immunity, a nomination,
//                the bank exchange, the Switch).
//
// Pure: the theme, and the bridge's and the rings' segments; js/ss/prime.js plays the rest.

import { mint, burn, balance, transfer } from './kitty.js';
import { showClue, secretOf } from './hunt.js';
import { grantPower } from './powers.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export const PRIME_THEMES = { 'red-phone': 'The Red Phone', dilemmas: 'The Night of Dilemmas', bridge: 'The Bridge of Sacrifices', truths: 'Truths Revealed', rings: 'The Night of the Rings' };

/** This week's theme, or null (week one has the launch; the final has its own night). */
export function primeTheme(state, ctx, { house = [], tools = {} } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  if (wk < 2 || house.length < 6) return null;
  const forced = state.forcePrimeTheme?.[wk];
  if (forced === 'none') return null;
  const past = (state.primeThemes ||= {});
  const recent = [past[wk - 1], past[wk - 2]].filter(Boolean);
  if (!forced && rng() > 0.55) return null;
  const can = Object.keys(PRIME_THEMES).filter(k => !recent.includes(k) && (k !== 'red-phone' || tools.phone !== 'none') && (k !== 'truths' || tools.truths !== 'none'));
  const theme = forced || can[Math.floor(rng() * can.length) % Math.max(1, can.length)];
  if (!theme) return null;
  past[wk] = theme;
  return theme;
}

/**
 * The Bridge of Sacrifices: up to four crossings. Each crosser is offered a sacrifice (their money, a clue on
 * their own secret, a nomination next week) so the friend waiting crosses with a reward (money, an immunity).
 */
export function bridgeOfSacrifices(state, ctx, { house = [], nominees = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const crossers = house.filter(n => !nominees.includes(n)).sort(() => rng() - 0.5).slice(0, Math.min(4, house.length - 1));
  const crossings = [];
  const fx = { bond: [], pub: [] };
  for (const c of crossers) {
    const friend = house.filter(n => n !== c).sort((a, b) => B(c, b) - B(c, a))[0];
    if (!friend) continue;
    const sec = secretOf(state, c);
    const kinds = ['money', ...(sec && !sec.found ? ['clue'] : []), 'nomination'];
    const kind = kinds[Math.floor(rng() * kinds.length) % kinds.length];
    const reward = rng() < 0.5 ? 'money' : 'immunity';
    const price = kind === 'money' ? Math.min(balance(state, c), 3000 + Math.floor(rng() * 3) * 1000) : 0;
    if (kind === 'money' && price < 1000) continue;
    // the heart against the game: loyalty and the bond against strategy and what it costs
    const cost = kind === 'nomination' ? 0.25 : kind === 'clue' ? 0.2 : 0.1;
    const yes = rng() < clamp(0.3 + S(c, 'loyalty') * 0.05 + Math.max(0, B(c, friend)) * 0.04 - S(c, 'strategic') * 0.02 - cost, 0.08, 0.92);
    let clue = null;
    if (yes) {
      if (kind === 'money') burn(state, c, price, `the Bridge of Sacrifices, for ${friend}`, wk);
      if (kind === 'clue') clue = showClue(state, ctx, { holder: c, how: 'sacrifice', house })?.clue || null;
      if (kind === 'nomination') { state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} }; (state.rules.dOffice[wk + 1] ||= []).includes(c) || state.rules.dOffice[wk + 1].push(c); }
      if (reward === 'money') mint(state, friend, 5000, 'crossed the Bridge of Sacrifices', wk);
      else { (state.nextImmune ||= {}); (state.nextImmune[wk + 1] ||= []).includes(friend) || state.nextImmune[wk + 1].push(friend); }
      fx.bond.push([friend, c, 2]);
      fx.pub.push([c, 'warmth', 0.3, `sacrificed for ${friend} on the bridge`]);
    } else {
      fx.bond.push([friend, c, -1.2]);
      fx.pub.push([c, 'heat', 0.12, `refused to sacrifice for ${friend}`]);
    }
    crossings.push({ who: c, friend, kind, price, reward, yes, clue });
  }
  if (!crossings.length) return null;
  return { kind: 'bridge', crossings, effects: { bond: fx.bond, pop: [] }, pub: fx.pub };
}

/** The Rings: four powers, four housemates. The bank exchange is spent tonight; the others are cards. */
export function handOutRings(state, ctx, { house = [], nominees = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const wk = ctx.week ?? 0;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const who = house.slice().sort(() => rng() - 0.5).slice(0, 4);
  if (who.length < 4) return null;
  const rings = [];
  const [a, b, c, d] = who;
  grantPower(state, { kind: 'immunity', holder: a, week: wk, from: 'ring' });
  rings.push({ ring: 'immunity', to: a });
  grantPower(state, { kind: 'nominate', holder: b, week: wk + 1, from: 'ring' });
  rings.push({ ring: 'nominate', to: b });
  // the bank exchange: swap kitties with the richest housemate, if it pays
  const rich = house.filter(n => n !== c).sort((x, y) => balance(state, y) - balance(state, x))[0];
  const gain = rich ? balance(state, rich) - balance(state, c) : 0;
  if (rich && gain > 0) {
    const mine = balance(state, c), theirs = balance(state, rich);
    transfer(state, rich, c, theirs, 'the bank-exchange ring', wk);
    transfer(state, c, rich, mine, 'the bank-exchange ring', wk);
  }
  rings.push({ ring: 'bank', to: c, with: gain > 0 ? rich : null, gain: Math.max(0, gain) });
  const friend = house.filter(n => n !== d).sort((x, y) => B(d, y) - B(d, x))[0] || null;
  grantPower(state, { kind: 'switch', holder: d, week: wk + 1, from: 'ring', protects: friend });
  rings.push({ ring: 'switch', to: d, protects: friend });
  const bond = gain > 0 && rich ? [[rich, c, -2]] : [];
  return { kind: 'rings', rings, effects: { bond, pop: [] } };
}
