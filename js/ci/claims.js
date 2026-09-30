// ══════════════════════════════════════════════════════════════════════
// ci/claims.js — small facts that people say, and where they go (spec §7.5)
// ══════════════════════════════════════════════════════════════════════
//
// A claim is "HOLDER feels/did KIND about ABOUT", said by somebody. The engine
// knows whether it is true; the players do not. A listener believes it in
// proportion to their trust in whoever told them — and bad news about
// yourself lands harder when you are paranoid. The SOURCE travels with it:
// "Mercedeze said Antonio isn't even a factor" (US 1 Ep 2).
import { rel, bump, clamp, S } from './state.js';
import { nudgeBelief, noteAlly } from './beliefs.js';
import { feel } from './mind.js';

export const CLAIM_KINDS = ['distrusts', 'likes', 'targeting', 'catfish', 'real', 'ally',
  'saved', 'ratedLow', 'visitSaid'];
const JUICY = new Set(['distrusts', 'targeting', 'catfish', 'visitSaid', 'ratedLow']);
// Pairs that cannot both be true of the same holder and subject.
const OPPOSED = { saved: 'targeting', targeting: 'saved', likes: 'distrusts', distrusts: 'likes',
  catfish: 'real', real: 'catfish' };

export function makeClaim(state, { kind, about, holder, value = true, truth, secrecy = 'between', by, to = null, weight = 1 }) {
  if (!CLAIM_KINDS.includes(kind)) throw new Error(`unknown claim kind ${kind}`);
  const claim = { id: `c${state.claims.length + 1}`, day: state.day, kind, about, holder, value,
    truth: !!truth, secrecy, origin: { by, to }, ...(weight !== 1 ? { weight } : {}) };
  state.claims.push(claim);
  return claim;
}

export const claimById = (state, id) => state.claims.find(c => c.id === id);
export const knows = (state, obs, id) => !!state.know[obs]?.[id];

/** How much a listener takes from this teller: 0.05 (no trust) to 1 (themselves). */
export function weightFrom(obs, from) {
  if (from === obs) return 1;
  return clamp((rel(obs, from, 'trust') + 10) / 20, 0.05, 1);
}

export function learn(state, obs, claim, from, scene) {
  const row = (state.know[obs] ||= {});
  if (row[claim.id]) return false;
  row[claim.id] = { from, day: state.day };
  applyClaim(state, obs, claim, from, scene);
  return true;
}

function applyClaim(state, obs, claim, from, scene) {
  // A claim can carry less than its teller's word (a blocked player's parting shot).
  const w = weightFrom(obs, from) * (claim.weight ?? 1);
  const alarm = 1 + (state.mind[obs]?.paranoia ?? 2) / 10;
  const aboutMe = claim.about === obs;
  const holder = claim.holder;
  switch (claim.kind) {
    case 'catfish':
      if (!aboutMe) nudgeBelief(state, obs, claim.about, 'real', -0.25 * w * alarm, scene);
      break;
    case 'real':
      if (!aboutMe) nudgeBelief(state, obs, claim.about, 'real', 0.15 * w, scene);
      break;
    case 'distrusts':
    case 'visitSaid':
      if (aboutMe && holder !== obs) {
        nudgeBelief(state, obs, holder, 'likesMe', -3 * w * alarm, scene);
        bump(obs, holder, 'trust', -1.5 * w);
        bump(obs, holder, 'resentment', 1 * w);
      } else if (!aboutMe && holder !== claim.about) {
        // A warning about somebody else ("watch out for Heather"): the
        // listener trusts that person a little less and watches them more.
        bump(obs, claim.about, 'trust', -0.8 * w);
        nudgeBelief(state, obs, claim.about, 'threat', 0.5 * w, scene);
      }
      break;
    case 'targeting':
      if (aboutMe && holder !== obs) {
        nudgeBelief(state, obs, holder, 'threat', 2 * w, scene);
        feel(state, obs, 'paranoia', 1 * w);
      }
      break;
    case 'likes':
      if (aboutMe && holder !== obs) nudgeBelief(state, obs, holder, 'likesMe', 2 * w, scene);
      break;
    case 'ally':
      if (holder !== obs) noteAlly(state, obs, holder, claim.about, scene);
      break;
    case 'saved':
      if (aboutMe && holder !== obs) bump(obs, holder, 'obligation', 1.5 * w);
      break;
    case 'ratedLow':
      if (aboutMe && holder !== obs) {
        nudgeBelief(state, obs, holder, 'likesMe', -2 * w, scene);
        bump(obs, holder, 'resentment', 1 * w);
      }
      break;
  }
}

/** The appetite to repeat a claim to this listener. 0 = keeps it. Proportional throughout. */
export function passOnWeight(state, knower, claim, listener) {
  if (claim.secrecy === 'public' || listener === knower) return 0;
  if (claim.origin.by === listener) return 0;
  const source = claim.origin.by;
  const loyalToSource = source === knower ? 1 : clamp((rel(knower, source, 'affection') + 10) / 20, 0, 1);
  const discretion = S(state, knower, 'loyalty') / 10;
  const toTarget = claim.about === listener ? 1.4 : 1;
  const juicy = JUICY.has(claim.kind) ? 1 : 0.5;
  const warmth = clamp((rel(knower, listener, 'affection') + 10) / 20, 0, 1);
  return juicy * toTarget * warmth * (1 - 0.6 * discretion * loyalToSource);
}

/** Pairs of claims this player holds that cannot both be true (spec §7.6). */
export function contradictions(state, obs) {
  const mine = state.claims.filter(c => state.know[obs]?.[c.id]);
  const out = [];
  for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) {
    const a = mine[i], b = mine[j];
    if (a.holder !== b.holder || a.about !== b.about) continue;
    if (OPPOSED[a.kind] === b.kind || (a.kind === b.kind && a.value !== b.value)) out.push({ a, b });
  }
  return out;
}
