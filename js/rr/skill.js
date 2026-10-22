// ══════════════════════════════════════════════════════════════════════
// rr/skill.js — how good a racer, or a team, is at a task
// ══════════════════════════════════════════════════════════════════════
//
// All proportional (CLAUDE.md): a stat blend per task type (types.js), the team's
// identity (×1.12 good, ×0.88 bad), teamwork from the pair's bond (and a snap),
// and energy. Temperament widens the SPREAD of a pressure task (spreadOf), the
// Big Brother library's swingBy constants (js/bb-comps/_shared.js scoreField).
import { S } from './state.js';
import { TASK_TYPES } from './types.js';
import { identityOf } from './identities.js';
import { getBond } from '../bonds.js';

// How much faster a better team is (2026-10-21): a task's time is its base over pace(level). Linear (level / 5) made the
// weakest team in a cast (3.8) take 2.3 times as long as the strongest (8.8) at everything, every leg, and the team that
// was last and survived went out next time 48% of the time (chance 16%). The curve keeps the order and softens the gap.
export const SKILL_CURVE = 0.55, PASS_SLOPE = 0.05;
export const pace = level => (level / 5) ** SKILL_CURVE;

export function identityFactor(team, types) {
  const id = identityOf(team);
  if (!id) return 1;
  let f = 1;
  for (const t of types) {
    if (id.good.includes(t)) f *= 1.12;
    else if (id.bad.includes(t)) f *= 0.88;
  }
  return f;
}

export function levelOf(name, types) {
  if (!types.length) return 5;
  let sum = 0;
  for (const t of types) {
    const lv = TASK_TYPES[t]?.level || {};
    for (const [stat, w] of Object.entries(lv)) sum += w * S(name, stat);
  }
  return sum / types.length;
}

export function spreadOf(name, types) {
  if (!types.some(t => TASK_TYPES[t]?.spread)) return 0.62;
  return 0.62 + (10 - S(name, 'temperament')) * 0.085;
}

export function teamwork(state, teamId) {
  const t = state.teams[teamId];
  const raw = 0.9 + 0.02 * getBond(t.a, t.b);
  const w = Math.min(1.1, Math.max(0.75, raw));
  return state.snapped?.[teamId] ? w * 0.92 : w;
}

export function energyFactor(state, name) {
  const e = state.mind?.[name]?.energy ?? 100;
  return 0.85 + 0.15 * e / 100;
}

export function teamLevel(state, teamId, types, who = 'both') {
  const t = state.teams[teamId];
  if (who !== 'both') return levelOf(who, types) * identityFactor(t, types) * energyFactor(state, who);
  const lv = (levelOf(t.a, types) + levelOf(t.b, types)) / 2;
  const en = (energyFactor(state, t.a) + energyFactor(state, t.b)) / 2;
  return lv * identityFactor(t, types) * teamwork(state, teamId) * en;
}
