// ══════════════════════════════════════════════════════════════════════
// ci/slips.js — when a cover shows, and when somebody goes looking (spec §7.7)
// ══════════════════════════════════════════════════════════════════════
//
// Real slips from the transcripts: a "golfer" who didn't know what an eagle
// is (US 4 Ep 8), period cramps "on my left side" and not knowing Adele (US 1
// Ep 12), a nickname let slip (US 3 Ep 13), and above all "too good to be
// true" (16 times in 90 episodes). A slip only counts if somebody notices.
import { clamp, S } from './state.js';
import { nudgeBelief, belief } from './beliefs.js';
import { feel } from './mind.js';

export const SLIP = { base: 0.008, stress: 0.06, party: 0.6, skill: 0.07 };
export const PROBE = { fail: 0.25, dodge: 0.08 };
export const THEORY_LINE = 0.35;
// A reader's paranoia finds something off even in an honest profile (US 1
// Alana: blocked first for "not being who she says she is", and she was).
export const MISREAD = 0.03;
export const SLIP_KINDS = ['knowledge', 'body', 'voice', 'tooPerfect', 'overreach', 'name'];

export function slipRisk(state, h, { specific = 0.3, party = false } = {}) {
  const p = state.profiles[h];
  if (!p?.gap) return 0;
  const stress = state.mind[h]?.stress ?? 2;
  const skill = (S(state, h, 'strategic') + S(state, h, 'mental')) / 2;
  return clamp(SLIP.base * p.gap * (1 + specific) * (1 + stress * SLIP.stress)
    * (party ? 1 + SLIP.party : 1) * (1 - skill * SLIP.skill), 0, 0.6);
}

export function noticeChance(state, obs, target, attention = 0.5) {
  const paranoia = state.mind[obs]?.paranoia ?? 2;
  return clamp(S(state, obs, 'intuition') / 10 * (0.15 + attention * 0.6) * (1 + paranoia / 20), 0, 0.95);
}

function slipKind(state, h, rng) {
  const p = state.profiles[h];
  const real = state.people[p.players[0]];
  const w = {
    knowledge: p.tells?.length ? 2 : 1,
    body: p.shown?.gender && p.shown.gender !== real.gender ? 1.5 : 0.2,
    voice: Math.abs((p.shown?.age ?? real.age) - (real.age ?? 25)) / 10,
    tooPerfect: p.mode === 'catfish' ? 1 : 0.5,
    overreach: 0.6,
    name: p.players.length > 1 ? 1 : 0.3,
  };
  let r = rng() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const [k, v] of Object.entries(w)) { if ((r -= v) <= 0) return k; }
  return 'tooPerfect';
}

export function rollSlips(state, rng, speaker, listeners, ctx, scene) {
  const out = [];
  for (const obs of listeners) {
    if (obs === speaker) continue;
    const p = MISREAD * (state.mind[obs]?.paranoia ?? 2) / 10 * (1 + (ctx.attention ?? 0.5));
    if (rng() < p) {
      nudgeBelief(state, obs, speaker, 'real', -0.06, scene);
      const m = { kind: 'tooPerfect', noticedBy: [obs], misread: true };
      out.push(m);
      (scene.data.slips ||= []).push({ by: speaker, ...m });
    }
  }
  if (rng() >= slipRisk(state, speaker, ctx)) return out;
  const kind = slipKind(state, speaker, rng);
  const noticedBy = [];
  for (const obs of listeners) {
    if (obs === speaker) continue;
    if (rng() < noticeChance(state, obs, speaker, ctx.attention ?? 0.5)) {
      noticedBy.push(obs);
      nudgeBelief(state, obs, speaker, 'real', -(0.06 + 0.03 * state.profiles[speaker].gap), scene);
    }
  }
  const slip = { kind, noticedBy };
  out.push(slip);
  (scene.data.slips ||= []).push({ by: speaker, ...slip });
  return out;
}

/** "Some quick trivia to see if it's really you." */
export function probe(state, rng, asker, target, scene) {
  const p = state.profiles[target];
  const record = r => { (scene.data.probes ||= []).push({ asker, target, result: r }); return r; };
  if (!p?.gap) { nudgeBelief(state, asker, target, 'real', 0.12, scene); return record('pass'); }
  const fail = clamp(PROBE.fail * p.gap * (1 - S(state, target, 'mental') / 15), 0, 0.8);
  const dodge = clamp(S(state, target, 'strategic') * PROBE.dodge, 0, 0.8);
  feel(state, target, 'stress', 0.8);
  const r = rng();
  if (r < fail * (1 - dodge)) { nudgeBelief(state, asker, target, 'real', -0.25, scene); return record('fail'); }
  if (r < fail) {
    nudgeBelief(state, asker, target, 'real', -0.08 * S(state, asker, 'intuition') / 10, scene);
    return record('dodge');
  }
  nudgeBelief(state, asker, target, 'real', 0.08, scene);
  return record('pass');
}

export const hasTheory = (state, obs, target) => belief(state, obs, target).real < THEORY_LINE;
