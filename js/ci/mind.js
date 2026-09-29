// ══════════════════════════════════════════════════════════════════════
// ci/mind.js — what isolation does to a person (spec §5.5)
// ══════════════════════════════════════════════════════════════════════
//
// Six states, 0..10, each drifting back toward a baseline set by stats.
// Loneliness and homesickness rise every day on their own: nobody has seen
// a face for days, and that is the show. A catfish who is loyal feels the
// lie ("it was terrible, and I felt the strain" — US 1 Seaburn).
// Emotions change what players choose and say, never directly who wins.
import { clamp, S } from './state.js';

export const MIND_KEYS = ['loneliness', 'paranoia', 'stress', 'guilt', 'elation', 'homesick'];
export const DAILY = { loneliness: 0.6, homesick: 0.3 };
export const RETURN = 0.25;
export const GUILT_PER_DAY = 0.35;

function baseline(state, h) {
  const temper = S(state, h, 'temperament'), intuition = S(state, h, 'intuition');
  return { loneliness: 2, paranoia: 1 + (10 - temper) * 0.2 + intuition * 0.1,
    stress: 1 + (10 - temper) * 0.15, guilt: 0, elation: 3, homesick: 2 };
}

export function initMind(state, h) { state.mind[h] = baseline(state, h); }
export const mood = (state, h, key) => state.mind[h]?.[key] ?? 0;

/** A blow or a lift. Temperament damps it: a calm player feels less of the same event. */
export function feel(state, h, key, delta) {
  const m = state.mind[h];
  if (!m) return 0;
  const damp = 1.2 - S(state, h, 'temperament') / 20;
  m[key] = clamp(m[key] + delta * damp, 0, 10);
  return m[key];
}

/** Once a day: settle toward baseline, then the day's own weight. */
export function driftMind(state, h) {
  const m = state.mind[h];
  if (!m) return;
  const base = baseline(state, h);
  for (const k of MIND_KEYS) m[k] += (base[k] - m[k]) * RETURN;
  m.loneliness += DAILY.loneliness;
  m.homesick += DAILY.homesick;
  const p = state.profiles[h];
  if (p && p.gap > 0) m.guilt += GUILT_PER_DAY * p.gap * S(state, h, 'loyalty') / 10;
  for (const k of MIND_KEYS) m[k] = clamp(m[k], 0, 10);
}
