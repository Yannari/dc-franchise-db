// ══════════════════════════════════════════════════════════════════════
// ci/slips.js — when a cover shows, and when somebody goes looking (spec §7.7)
// ══════════════════════════════════════════════════════════════════════
//
// Real slips from the transcripts: a "golfer" who didn't know what an eagle
// is (US 4 Ep 8), period cramps "on my left side" and not knowing Adele (US 1
// Ep 12), a nickname let slip (US 3 Ep 13), and above all "too good to be
// true" (16 times in 90 episodes). A slip only counts if somebody notices.
import { isPair, distance, hiddenFacts, noticeInconsistency, SHARED_PROBE } from './shared.js';
import { clamp, S } from './state.js';
import { nudgeBelief, belief } from './beliefs.js';
import { feel } from './mind.js';
import { coverStrain, coverParts } from './cover.js';

// A voice that does not fit the face (Plan 3a+ Task 14): a "24-year-old" who
// types like a board memo, or a "50-year-old" who types LET'S GOOO. Only a
// catfish has a face to not fit.
export function voiceMismatch(state, h) {
  const style = coverParts(state, h).style;
  return style > 0.6 ? style : 0;
}
// Somebody near the persona's age knows how that age types (a fake young
// voice is heard soonest by the young).
export const EAR = { near: 6, bonus: 1.35 };
function earFor(state, obs, target) {
  const shown = state.profiles[target]?.shown?.age;
  const ages = (state.profiles[obs]?.players || []).map(n => state.people[n]?.age).filter(a => a != null);
  return shown != null && ages.some(a => Math.abs(a - shown) <= EAR.near) ? EAR.bonus : 1;
}
/** The author's leaks: phrases that belong to the person, not the profile. */
export const leaksOf = (state, h) => (state.profiles[h]?.players || []).flatMap(n => state.people[n]?.chatVoice?.leaks || []);

export const SLIP = { base: 0.008, stress: 0.06, party: 0.6, skill: 0.07 };
export const PROBE = { fail: 0.25, dodge: 0.08 };
export const THEORY_LINE = 0.35;
// A reader's paranoia finds something off even in an honest profile (US 1
// Alana: blocked first for "not being who she says she is", and she was).
export const MISREAD = 0.006;
export const SLIP_KINDS = ['knowledge', 'body', 'voice', 'tooPerfect', 'overreach', 'name'];

export function slipRisk(state, h, { specific = 0.3, party = false } = {}) {
  const p = state.profiles[h];
  if (!p?.gap) return 0;
  const stress = state.mind[h]?.stress ?? 2;
  const skill = (S(state, h, 'strategic') + S(state, h, 'mental')) / 2;
  return clamp(SLIP.base * p.gap * (1 + specific) * (1 + stress * SLIP.stress)
    * (party ? 1 + SLIP.party : 1) * (1 - skill * SLIP.skill)
    // Two people do not sound like one: the more unlike, the more it shows.
    * (1 + distance(state, h) / 20)
    // A persona is a performance: an easy one slips less than a bare gap
    // would, a hard one more (ci/cover.js).
    * (p.mode === 'catfish' ? 0.5 + coverStrain(state, h) : 1), 0, 0.6);
}

export function noticeChance(state, obs, target, attention = 0.5) {
  const paranoia = state.mind[obs]?.paranoia ?? 2;
  return clamp(S(state, obs, 'intuition') / 10 * (0.15 + attention * 0.6) * (1 + paranoia / 20), 0, 0.95);
}

function slipKind(state, h, rng) {
  const p = state.profiles[h];
  const real = state.people[p.players[0]];
  const w = {
    knowledge: (p.tells?.length ? 2 : 1) + hiddenFacts(state, h).length,
    body: p.shown?.gender && p.shown.gender !== real.gender ? 1.5 : 0.2,
    voice: coverStrain(state, h) * 1.5 + distance(state, h) / 10 + (leaksOf(state, h).length ? 1.5 : 0),
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
    if (rng() < noticeChance(state, obs, speaker, ctx.attention ?? 0.5) * (kind === 'voice' ? earFor(state, obs, speaker) : 1)) {
      noticedBy.push(obs);
      nudgeBelief(state, obs, speaker, 'real', -(0.06 + 0.03 * state.profiles[speaker].gap), scene);
      if (kind === 'voice' && isPair(state, speaker)) noticeInconsistency(state, obs, speaker, scene);
    }
  }
  const slip = { kind, noticedBy };
  // A voice slip is one of the author's leaks, when there are any ("Love, Tyler").
  const leaks = kind === 'voice' ? leaksOf(state, speaker) : [];
  if (leaks.length) slip.leak = leaks[Math.min(leaks.length - 1, Math.floor(rng() * leaks.length))];
  out.push(slip);
  (scene.data.slips ||= []).push({ by: speaker, ...slip });
  return out;
}

/** "Some quick trivia to see if it's really you." */
export function probe(state, rng, asker, target, scene) {
  const p = state.profiles[target];
  const record = r => { (scene.data.probes ||= []).push({ asker, target, result: r }); return r; };
  if (!p?.gap) { nudgeBelief(state, asker, target, 'real', 0.12, scene); return record('pass'); }
  // Two heads check every answer (spec §14.8: slow, but hard to trap).
  const fail = clamp(PROBE.fail * p.gap * (1 - S(state, target, 'mental') / 15), 0, 0.8)
    * (isPair(state, target) ? SHARED_PROBE : 1);
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
