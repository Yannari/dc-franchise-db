// ══════════════════════════════════════════════════════════════════════
// pm/feelings.js — what they feel, what they show, what the other believes
// ══════════════════════════════════════════════════════════════════════
//
// Spec §6.3. Three layers, one DIRECTION at a time:
//   Feels    — js/relationships.js (attraction, love, affection...), the truth
//   Shows    — state.shows["A→B"]: the romance A acts out toward B; absent = honest
//   Believes — state.believes["V:A→V"]: what V thinks A feels for V
// Every islander decision reads its own feelings and its beliefs — never the
// other person's truth (spec §7).
//
// Hiding is not scheming; faking and manipulating are (spec §6.5).
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';
import { compatible } from './chemistry.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);

/**
 * The romance bar. A crush is mostly spark, so attraction alone can carry it
 * (x0.9); falling for someone lifts it past what the spark gives on its own.
 */
export function romance(a, b) {
  const att = getRelationshipDimension(a, b, 'attraction'), love = getRelationshipDimension(a, b, 'love');
  return Math.round(clamp(Math.max(0.9 * att, 0.5 * att + 0.6 * love), 0, 10) * 100) / 100;
}
export const friendship = (a, b) => getRelationshipDimension(a, b, 'affection');

export function shown(state, a, b) {
  const m = state.shows?.[`${a}→${b}`];
  return m == null ? romance(a, b) : m;
}
export function setMask(state, a, b, value) {
  state.shows ||= {};
  if (value == null) delete state.shows[`${a}→${b}`];
  else state.shows[`${a}→${b}`] = clamp(value, 0, 10);
}

export function believed(state, viewer, a) {
  const v = state.believes?.[`${viewer}:${a}→${viewer}`];
  return v == null ? shown(state, a, viewer) : v;
}
export function revealTruth(state, viewer, a) {
  state.believes ||= {};
  state.believes[`${viewer}:${a}→${viewer}`] = romance(a, viewer);
}

/** The franchise's scheming gate (CLAUDE.md), unchanged. */
export function schemeEligible(p) {
  if (!p || NICE.has(p.archetype)) return false;
  if (VILLAIN.has(p.archetype)) return true;
  return (p.stats?.strategic ?? 5) >= 6 && (p.stats?.loyalty ?? 5) <= 4;
}

const partnerOf = (state, n) => {
  const c = state.couples.find(x => x.includes(n));
  return c ? (c[0] === n ? c[1] : c[0]) : null;
};

/** Love grows from time together, only where there is attraction, scaled by loyalty. */
export function growLove(state, couples) {
  for (const [a, b] of couples) {
    for (const [x, y] of [[a, b], [b, a]]) {
      const att = getRelationshipDimension(x, y, 'attraction');
      const aff = Math.max(0, friendship(x, y));
      const loy = state.profiles[x]?.stats?.loyalty ?? 5;
      // Villa time runs fast (spec §6.8): a day there does the work of a week outside.
      addRelationshipDimension(x, y, 'love', 0.12 * (att / 10) * (1 + aff / 10) * (0.5 + loy / 10) * 7);
    }
  }
}

/**
 * Belief drifts toward what is shown, plus a leak of the truth: the viewer's
 * intuition sees through it, the actor's social skill covers it.
 */
export function updateBeliefs(state) {
  state.believes ||= {};
  for (const v of state.villa) for (const a of state.villa) {
    if (a === v || !compatible(state, a, v)) continue;
    const key = `${v}:${a}→${v}`;
    const truth = romance(a, v), show = shown(state, a, v);
    const see = ((state.profiles[v]?.stats?.intuition ?? 5) / 10) * (1 - 0.5 * (state.profiles[a]?.stats?.social ?? 5) / 10);
    const target = show + (truth - show) * see;
    const cur = state.believes[key] ?? show;
    state.believes[key] = Math.round((cur + (target - cur) * 0.35) * 100) / 100;
  }
}

/**
 * Each episode, each islander decides what to show. Proportional in every
 * term; the gate is the only yes/no, and it is the franchise's scheming rule.
 *   Hide  — any archetype: a crush on someone who is not their partner, while
 *           coupled (loyalty) or when the crush is a friend's partner.
 *   Fake  — scheme-eligible only: coupled, low real romance, a reason to stay.
 */
export function decideMasks(state, rng) {
  for (const a of state.villa) {
    const prof = state.profiles[a], s = prof.stats, mine = partnerOf(state, a);
    for (const b of state.villa) {
      if (a === b || !compatible(state, a, b)) continue;
      const truth = romance(a, b);
      if (b !== mine) {
        const theirs = partnerOf(state, b);
        const friendsPartner = theirs && friendship(a, theirs) > 3;
        const masked = state.shows?.[`${a}→${b}`];
        const reason = (mine ? s.loyalty / 10 : 0) + (friendsPartner ? 0.5 : 0);
        // A hidden crush, once hidden, stays hidden while the reason stands;
        // it comes out on its own only when the reason goes (single again,
        // the friend's couple over).
        if (!reason) { if (masked != null && masked < truth) setMask(state, a, b, null); }
        else if (masked != null && masked < truth) setMask(state, a, b, truth * (1 - s.loyalty / 12));
        else if (truth >= 3 && rng() < truth / 10 * reason) setMask(state, a, b, truth * (1 - s.loyalty / 12));
      } else if (schemeEligible(prof)) {
        const reason = ['win', 'money', 'fame'].includes(prof.intent) ? 0.4 : 0.2;
        const fakeP = (1 - truth / 10) * (s.strategic / 10) * (reason + 0.3);
        if (truth < 5 && rng() < fakeP) setMask(state, a, b, Math.min(10, truth + 3 + s.social / 3));
      }
    }
  }
}

/** Narration label for A's side of the pair (spec §6.4). Thresholds are allowed: this is text. */
export function relationshipLabel(state, a, b) {
  const me = romance(a, b), them = romance(b, a), show = shown(state, a, b), fr = friendship(a, b);
  const coupled = state.couples.some(c => c.includes(a) && c.includes(b));
  if (show - me >= 4 && me <= 3) return ['fake', 'Faking it'];
  if (coupled) {
    if (me >= 7 && them >= 7) return ['love', 'Head over heels'];
    if (me >= 6 && them <= 3) return ['alone', 'All in — alone'];
    if (me <= 3 && them >= 6) return ['surv', 'Not feeling it'];
    if (me <= 3 && them <= 3) return ['surv', 'Couple for survival'];
    return ['love', 'Coupled'];
  }
  if (me >= 6 && show <= 2) return ['hidden', 'Hidden crush'];
  if (me >= 6 && fr <= -2) return ['mixed', "Fancies, can't stand"];
  if (me >= 6 && them >= 6) return ['crush', 'Mutual spark'];
  if (me >= 5) return ['crush', 'One-way crush'];
  if (me <= 1 && fr >= 5 && them >= 6) return ['zone', 'Friend-zoning'];
  if (fr <= -5) return ['rival', "Can't stand"];
  if (fr >= 6 && me <= 1) return ['friend', 'Just friends'];
  return null;
}
