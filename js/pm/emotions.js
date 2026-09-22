// ══════════════════════════════════════════════════════════════════════
// pm/emotions.js — how they feel, day to day (spec §6.8)
// ══════════════════════════════════════════════════════════════════════
//
// Season state, not stats: nine stats only (§5.1). Every feeling here moves on
// what the islander WITNESSED, WAS TOLD, or BELIEVES — callers pass only
// perceived events in. Pure state; the scenes are made in villa-day.js.
//
// Research this follows (spec §6.8): secure people are not very jealous until
// a threat is confirmed, then very; anxious people are jealous early and often,
// with intrusive thoughts and checking; avoidant people feel less but answer a
// threat with jealousy induction and revenge. Sleep loss and the pressure
// cooker turn feelings up as the season goes on.
import { romance, believed } from './feelings.js';
import { betrayalWeight, believedCloseness } from './ladder.js';

export const FEELINGS = ['security', 'confidence', 'loneliness', 'guilt', 'heartbreak', 'stress'];
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function weighted(rng, entries) {
  const live = entries.filter(([, w]) => w > 0);
  let r = rng() * live.reduce((s, [, w]) => s + w, 0);
  for (const [v, w] of live) { r -= w; if (r <= 0) return v; }
  return live[live.length - 1][0];
}
const partnerOf = (state, n) => { const c = state.couples.find(x => x.includes(n)); return c ? (c[0] === n ? c[1] : c[0]) : null; };

/** Continuous, from the nine stats. The label is narration only. */
export function attachment(p) {
  const s = p.stats;
  const anxiety = clamp(1.6 * (s.loyalty / 10) * (1 - s.temperament / 10), 0, 1);
  const avoidance = clamp(1.3 * (1 - s.loyalty / 10) * (0.4 + 0.6 * s.strategic / 10), 0, 1);
  return { anxiety, avoidance, secure: clamp(1 - Math.max(anxiety, avoidance), 0, 1) };
}
export function attachmentLabel(p) {
  const a = attachment(p);
  if (a.anxiety >= 0.5 && a.anxiety >= a.avoidance) return 'anxious';
  if (a.avoidance >= 0.5) return 'avoidant';
  return 'secure';
}

export function emo(state, n) {
  return ((state.emo ||= {})[n] ||= { security: 5, confidence: 5, loneliness: 1, guilt: 0, heartbreak: 0,
    stress: 1, jealousy: {}, heartbreakFrom: null });
}
export function feel(state, n, key, d) { const e = emo(state, n); e[key] = clamp(e[key] + d, 0, 10); return e[key]; }

/** Stress wears the temper down: the same slight lands harder in week five. */
export const effectiveTemperament = (state, n) => clamp(state.profiles[n].stats.temperament - 0.35 * emo(state, n).stress, 0, 10);

/** A threat to my couple, as I perceive it. Returns the jealousy it added. */
export function jealousyHit(state, viewer, partner, rival, raw, { confirmed = false } = {}) {
  const a = attachment(state.profiles[viewer]);
  const love = romance(viewer, partner) / 10;
  const style = a.secure * (confirmed ? 1 : 0.15) + a.anxiety * (0.8 + 0.6 * a.anxiety) + a.avoidance * 0.5;
  const e = emo(state, viewer);
  const amount = clamp(raw * love * betrayalWeight(state, viewer, partner) * style * (1 + 0.08 * e.stress), 0, 10);
  e.jealousy[rival] = clamp((e.jealousy[rival] || 0) + amount, 0, 10);
  feel(state, viewer, 'security', -0.6 * amount);
  feel(state, viewer, 'stress', 0.2 * amount);
  return amount;
}

/** How the jealousy comes out. Proportional weights; one is drawn. */
export function jealousyOutlet(state, viewer, rng) {
  const p = state.profiles[viewer], s = p.stats, a = attachment(p), t = effectiveTemperament(state, viewer) / 10;
  return weighted(rng, [
    ['confront', (s.boldness / 10) * (1 - t) + 0.05],
    ['sulk', (1 - s.boldness / 10) * 0.5 * (1 - t) + 0.05],
    // Making them jealous back is not a scheme, but nice archetypes rarely do it.
    ['retaliate', a.avoidance * 0.8 * (NICE.has(p.archetype) ? 0.3 : 1)],
    ['reassure', a.anxiety * 0.8 + 0.05],
    ['hidden', t * 0.6 * a.secure + 0.05],
  ]);
}

export function breakHeart(state, n, by, amount) {
  const e = emo(state, n);
  feel(state, n, 'heartbreak', amount);
  e.heartbreakFrom = by;
  feel(state, n, 'confidence', -0.4 * amount);
  feel(state, n, 'security', -amount);
}
export const rebounding = (state, n) => emo(state, n).heartbreak > 3;

/** One villa day. Stress builds; jealousy, guilt and heartbreak fade; security drifts to what they believe. */
export function tickEmotions(state) {
  for (const n of state.villa) {
    const e = emo(state, n), partner = partnerOf(state, n);
    e.stress = clamp(e.stress + 0.25, 0, 10);
    for (const r of Object.keys(e.jealousy)) { e.jealousy[r] *= 0.55; if (e.jealousy[r] < 0.05) delete e.jealousy[r]; }
    e.guilt *= 0.85;
    e.heartbreak *= 0.88;
    e.loneliness = clamp(e.loneliness + (partner ? -0.6 : 0.8), 0, 10);
    // Security is RECIPROCITY, not romance: do they seem as into me as I am
    // into them? An even couple sits at 5; being the keener one pulls it down.
    const target = partner
      ? clamp(5 + 5 * (believed(state, n, partner) - romance(n, partner)) / 10
        + 3 * believedCloseness(state, n, partner), 0, 10)
      : 3;
    e.security = clamp(e.security + (target - e.security) * 0.25, 0, 10);
    e.confidence = clamp(e.confidence + (5 - e.confidence) * 0.1, 0, 10);
  }
}

/** Why somebody might walk, and how likely it is today. */
export function walkRisk(state, n) {
  const e = emo(state, n);
  const ex = e.heartbreakFrom;
  const exHere = ex && state.villa.includes(ex);
  const exMovedOn = exHere && !!partnerOf(state, ex);
  const heartbreak = exHere
    ? 0.05 * (e.heartbreak / 10) * (1.3 - effectiveTemperament(state, n) / 10) * (exMovedOn ? 1.5 : 1) : 0;
  const homesick = 0.03 * (e.loneliness / 10) * (e.stress / 10);
  return heartbreak >= homesick ? { p: heartbreak, cause: 'heartbreak' } : { p: homesick, cause: 'homesick' };
}
