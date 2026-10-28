// ══════════════════════════════════════════════════════════════════════
// ss/secret-room.js — the Voice's room of dilemmas, in the days
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 1, F1.1 (docs/superpowers/specs/2026-10-28-secret-story-hidden-spaces-design.md). The user,
// 2026-10-28: "the secret room is mostly used during the prime or the dailies when they need to spice up the
// game: dilemmas to get clues, block X's nomination vote, nominations d'office, reveal these videos to someone,
// let Y see his family for X amount of your kitty".
//
// The Voice calls one housemate, alone, up to the secret room and offers a trade whose price somebody else
// pays, or their own kitty does. Who says yes is the person: loyalty, strategy, boldness, how much money they
// hold, the bonds at stake, and how much they weigh the way it will look. Taken or refused, it has a
// consequence. The blocked votes and the double votes it writes are read by the nominations
// (js/bb/secret-story.js -> js/ss/nominations.js `blocked`, `double`).
//
// Pure: returns { kind, to, ..., accepted, effects } for the adapter to apply the bonds and the public.

import { mint, burn, balance } from './kitty.js';
import { addEvidence, secretOf } from './hunt.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** The trades, each from a real season. */
export const ROOM_DILEMMAS = ['clue-for-vote', 'money-for-nomination', 'the-tapes', 'their-family', 'double-vote', 'immunity-for-friend'];

const rulesOf = state => (state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} });
const push = (map, wk, n) => { (map[wk] ||= []).includes(n) || map[wk].push(n); };

/**
 * This week's secret-room dilemma, or null.
 * @param {any} state @param {any} ctx huntCtx @param {{ house?: string[], immune?: string[] }} o
 * @returns {any}
 */
export function secretRoomDilemma(state, ctx, { house = [], immune = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const room = house.filter(Boolean);
  const wk = ctx.week ?? 0;
  if (room.length < 5 || wk < 1) return null;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const looks = n => Number(ctx.looks?.(n)) || 0;
  const done = (state.roomDilemmas ||= []);
  const last = done.at(-1)?.kind;
  // who the Voice calls: somebody it hasn't called lately, the bold and the strategic first
  const called = new Set(done.filter(d => wk - d.week < 3).map(d => d.to));
  const to = room.filter(n => !called.has(n)).sort((a, b) => (S(b, 'strategic') + S(b, 'boldness') * 0.5 + rng() * 6) - (S(a, 'strategic') + S(a, 'boldness') * 0.5 + rng() * 6))[0];
  if (!to) return null;
  const others = room.filter(n => n !== to);
  const foe = others.slice().sort((a, b) => B(to, a) - B(to, b))[0];
  const friend = others.slice().sort((a, b) => B(to, b) - B(to, a))[0];
  const kitty = balance(state, to);
  const kinds = ROOM_DILEMMAS.filter(k => k !== last && (k !== 'their-family' || kitty >= 2000) && (k !== 'double-vote' || kitty >= 1500) && (k !== 'the-tapes' || kitty >= 1000));
  const kind = kinds[Math.floor(rng() * kinds.length) % kinds.length];
  const greed = S(to, 'strategic') * 0.04 + S(to, 'boldness') * 0.02 - S(to, 'loyalty') * 0.03 - looks(to) * 0.15;
  const fx = { bond: [], pub: [] };
  let ev = null;

  if (kind === 'clue-for-vote') {
    // the secret they want: their strongest theory still standing
    const on = others.filter(t => secretOf(state, t) && !secretOf(state, t).found && !(secretOf(state, t).holders || []).includes(to))
      .sort((a, b) => (Number(state.theories?.[to]?.[b]?.conf) || 0) - (Number(state.theories?.[to]?.[a]?.conf) || 0))[0];
    if (!on) return null;
    const accepted = rng() < clamp(0.45 + greed, 0.1, 0.9);
    let clue = null;
    if (accepted) {
      addEvidence(state, ctx, to, on, { strength: 0.35, how: 'secret-room' });
      clue = (secretOf(state, on)?.clues || [])[0] || null;
      push((rulesOf(state).blockedVote ||= {}), wk, foe);
      fx.pub.push([to, 'game', 0.12, 'traded a vote for a clue in the secret room'], [foe, 'pity', 0.06, 'lost the nomination vote']);
    } else fx.pub.push([to, 'warmth', 0.08, 'refused to take a vote away']);
    ev = { kind, to, on, named: foe, accepted, clue };
  } else if (kind === 'money-for-nomination') {
    const target = others.filter(n => !immune.includes(n)).sort((a, b) => B(to, a) - B(to, b))[0];
    if (!target) return null;
    const accepted = rng() < clamp(0.35 + greed + (kitty < 3000 ? 0.15 : 0), 0.08, 0.88);
    if (accepted) {
      mint(state, to, 3000, 'nominated somebody d\'office in the secret room', wk);
      push(rulesOf(state).dOffice, wk, target);
      fx.bond.push([target, to, -1.2]);
      fx.pub.push([to, 'heat', 0.25, `nominated ${target} for money`], [target, 'pity', 0.15, 'was nominated for money']);
    } else fx.pub.push([to, 'warmth', 0.12, 'refused money to nominate somebody']);
    ev = { kind, to, named: target, accepted, money: 3000 };
  } else if (kind === 'the-tapes') {
    // who has been talking about them: the worst bond they have, and a second if the house is big
    const talkers = others.filter(n => B(n, to) <= 0).sort((a, b) => B(a, to) - B(b, to)).slice(0, room.length >= 8 ? 2 : 1);
    if (!talkers.length) return null;
    const accepted = rng() < clamp(0.4 + S(to, 'intuition') * 0.03 - S(to, 'temperament') * 0.02 + S(to, 'boldness') * 0.02, 0.15, 0.9);
    if (accepted) {
      burn(state, to, 1000, 'the tapes in the secret room', wk);
      for (const t of talkers) fx.bond.push([to, t, -1.6]);
      fx.pub.push([to, 'pity', 0.15, 'watched what the house says behind their back'], ...talkers.map(t => [t, 'real', -0.15, 'was caught on tape']));
    }
    ev = { kind, to, talkers, accepted, money: 1000 };
  } else if (kind === 'their-family') {
    // somebody they love sees their family, paid from this kitty
    if (!friend) return null;
    const accepted = rng() < clamp(0.25 + S(to, 'loyalty') * 0.05 + Math.max(0, B(to, friend)) * 0.03 - S(to, 'strategic') * 0.02, 0.1, 0.92);
    if (accepted) {
      burn(state, to, 2000, `paid for ${friend}'s visit from home`, wk);
      fx.bond.push([friend, to, 2], [to, friend, 0.8]);
      fx.pub.push([to, 'warmth', 0.35, `paid for ${friend}'s family to visit`], [friend, 'pity', 0.15, 'got a visit from home']);
    } else fx.pub.push([to, 'heat', 0.08, `kept the money instead of ${friend}'s visit`]);
    ev = { kind, to, named: friend, accepted, money: 2000 };
  } else if (kind === 'double-vote') {
    const accepted = rng() < clamp(0.4 + greed, 0.1, 0.9);
    if (accepted) {
      burn(state, to, 1500, 'a double vote', wk);
      push((rulesOf(state).doubleVote ||= {}), wk, to);
      fx.pub.push([to, 'game', 0.1, 'bought a double vote']);
    }
    ev = { kind, to, accepted, money: 1500 };
  } else if (kind === 'immunity-for-friend') {
    if (!friend || immune.includes(friend)) return null;
    const accepted = rng() < clamp(0.18 + greed + S(to, 'strategic') * 0.02, 0.05, 0.75);
    if (accepted) {
      push((state.nextImmune ||= {}), wk, to);
      push(rulesOf(state).dOffice, wk, friend);
      fx.bond.push([friend, to, -2.5]);
      fx.pub.push([to, 'heat', 0.35, `sacrificed ${friend} for immunity`], [friend, 'pity', 0.25, 'was sacrificed by a friend']);
    } else fx.pub.push([to, 'warmth', 0.25, `protected ${friend} in the secret room`]);
    ev = { kind, to, named: friend, accepted };
  }
  if (!ev) return null;
  done.push({ week: wk, kind: ev.kind, to });
  return { ...ev, effects: fx };
}
