// ══════════════════════════════════════════════════════════════════════
// bb-comps/index.js — the competition registry
// ══════════════════════════════════════════════════════════════════════
//
// One import for every production competition:
//
//   import { BB_COMPETITIONS } from './bb-comps/index.js';
//   simulateBBSeason({ competitions: BB_COMPETITIONS, ... });
//
// The dispatcher in js/bb/comps.js always appends its own generic fallbacks, so
// this library never has to be complete for a week to run. But a season plays
// about thirty competitions, and the fallbacks narrate a single line each — so
// the standard here is the one Total Drama already sets, where a real challenge
// is scheduled every episode and the generic one is the safety net rather than
// the norm.

import { ENDURANCE_COMPS } from './endurance.js';
import { MENTAL_COMPS } from './mental.js';
import { PHYSICAL_COMPS } from './physical.js';
import { LUCK_COMPS } from './luck.js';
import { ARENA_COMPETITIONS } from './arena.js';
import { SIGNATURE_COMPS } from './signature.js';
import { PAIR_COMPS } from './pairs.js';
import { CLASSIC_COMPS } from './classics.js';
import { ARENA_CLASSIC_COMPS } from './arena-classics.js';
import { FINAL_HOH_COMPS } from './final-hoh.js';
import { JURY_QUIZ_COMPS } from './jury-quiz.js';
import { RECALL_COMPS } from './recall.js';
import { SOCIAL_COMPS } from './social.js';
import { DURESS_COMPS } from './duress.js';
import { STAMINA_COMPS } from './stamina.js';
import { HANDWORK_COMPS } from './handwork.js';

/**
 * How strongly a written competition outranks a fallback.
 *
 * The dispatcher always appends its own generic competitions to the pool, and
 * with equal weights they took 37.6% of a season — meaning nearly two weeks in
 * five were narrated by a single line. Total Drama schedules a real challenge
 * every episode and keeps the generic one as a safety net; this is the same
 * standard expressed as a selection weight.
 *
 * It is a preference, not an exclusion. If the library ever has nothing
 * eligible for a slot — a type nothing here serves, or a category on cooldown —
 * the fallback still runs and the week still happens.
 */
// 8, up from 7: season-level freshness (a used comp defers hard) means the
// written library exhausts before the season does, and at 7 the generic
// safety net was winning enough late-season slots to sit exactly at the 80%
// line the suite draws. One notch keeps the library carrying the season.
const PRODUCTION_WEIGHT = 8;

/** Preserve a competition's own weighting; scale it above the fallbacks. */
const production = comp => ({
  ...comp,
  weight(ctx) {
    const own = typeof comp.weight === 'function' ? Math.max(0, Number(comp.weight(ctx)) || 0) : 1;
    return PRODUCTION_WEIGHT * own;
  },
});

export const BB_COMPETITIONS = [
  ...ENDURANCE_COMPS,
  ...MENTAL_COMPS,
  ...PHYSICAL_COMPS,
  ...LUCK_COMPS,
  ...ARENA_COMPETITIONS,
  ...ARENA_CLASSIC_COMPS,
  ...PAIR_COMPS,
  ...CLASSIC_COMPS,
  // Last on purpose: `.find(c => c.category === ...)` lookups elsewhere should
  // keep resolving to the original single-sort competitions, and the signature
  // set is an addition to the library rather than a replacement of it.
  ...SIGNATURE_COMPS,
  // Only the finale asks for these, and it asks by id. They carry the
  // production weight like everything else so that nothing has to special-case
  // them, but no weekly slot declares their type, so no weekly draw can reach
  // them.
  ...FINAL_HOH_COMPS,
  ...JURY_QUIZ_COMPS,
  // Batch one of the recurring-competition expansion. Deliberately weighted
  // toward the slots the library was thin in: memory had two competitions
  // against ten mental, and nothing anywhere was scored on `social`.
  ...RECALL_COMPS,
  ...SOCIAL_COMPS,
  ...DURESS_COMPS,
  // Batch two: the body half of the expansion. Endurance, physical and
  // precision were the categories a season kept drawing from, so these are
  // written to be lost in different WAYS rather than to be more of the same —
  // knocked off, dropped, broken, clipped, or lost on the second half.
  ...STAMINA_COMPS,
  ...HANDWORK_COMPS,
].map(production);

export const BB_COMPETITIONS_BY_CATEGORY = BB_COMPETITIONS.reduce((acc, comp) => {
  (acc[comp.category] ||= []).push(comp);
  return acc;
}, {});

/** Which competitions can serve a given slot — the dispatcher's own filter. */
export const competitionsFor = type => BB_COMPETITIONS.filter(c => c.types.includes(type));

export { ENDURANCE_COMPS, MENTAL_COMPS, PHYSICAL_COMPS, LUCK_COMPS, ARENA_COMPETITIONS, SIGNATURE_COMPS, PAIR_COMPS, CLASSIC_COMPS, ARENA_CLASSIC_COMPS, FINAL_HOH_COMPS, JURY_QUIZ_COMPS, RECALL_COMPS, SOCIAL_COMPS, DURESS_COMPS, STAMINA_COMPS, HANDWORK_COMPS };
export default BB_COMPETITIONS;
