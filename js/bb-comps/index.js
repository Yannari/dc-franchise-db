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
].map(production);

export const BB_COMPETITIONS_BY_CATEGORY = BB_COMPETITIONS.reduce((acc, comp) => {
  (acc[comp.category] ||= []).push(comp);
  return acc;
}, {});

/** Which competitions can serve a given slot — the dispatcher's own filter. */
export const competitionsFor = type => BB_COMPETITIONS.filter(c => c.types.includes(type));

export { ENDURANCE_COMPS, MENTAL_COMPS, PHYSICAL_COMPS, LUCK_COMPS, ARENA_COMPETITIONS };
export default BB_COMPETITIONS;
