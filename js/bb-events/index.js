// ══════════════════════════════════════════════════════════════════════
// bb-events/index.js — the house event registry
// ══════════════════════════════════════════════════════════════════════
//
// One import for everything the house can do, so a caller never has to know
// which categories exist:
//
//   import { HOUSE_EVENTS } from './bb-events/index.js';
//   simulateBBSeason({ houseEvents: HOUSE_EVENTS, ... });
//
// This exists because the engine takes its library as an argument and defaults
// it to empty. Without a registry, every event written is unreachable from
// anywhere but its own test — which is exactly where nineteen of them sat.

import { CEREMONY_EVENTS } from './ceremonies.js';
import { SOCIAL_EVENTS } from './social.js';
import { EDITORIAL_SOCIAL_EVENTS } from './editorial-social.js';
import { DEALS_EVENTS } from './deals.js';
import { HOUSE_LIFE_EVENTS } from './house-life.js';
import { PHASE_EVENTS } from './phases.js';
import { VENUE_EVENTS } from './venue.js';
import { POWER_EVENTS } from './power.js';

/** Every house event, in no particular order — the scheduler weights them. */
export const HOUSE_EVENTS = [
  ...CEREMONY_EVENTS,
  ...SOCIAL_EVENTS,
  ...EDITORIAL_SOCIAL_EVENTS,
  ...DEALS_EVENTS,
  ...HOUSE_LIFE_EVENTS,
  ...PHASE_EVENTS,
  ...VENUE_EVENTS,
  ...POWER_EVENTS,
];

/** The same events grouped, for debug screens and for testing one slice. */
export const HOUSE_EVENTS_BY_CATEGORY = {
  ceremonies: [...CEREMONY_EVENTS, ...POWER_EVENTS.filter(e => e.category === 'ceremonies')],
  social: [...SOCIAL_EVENTS, ...EDITORIAL_SOCIAL_EVENTS, ...POWER_EVENTS.filter(e => e.category === 'social')],
  deals: [...DEALS_EVENTS, ...VENUE_EVENTS.filter(e => e.category === 'deals'), ...POWER_EVENTS.filter(e => e.category === 'deals')],
  'house-life': [...HOUSE_LIFE_EVENTS, ...VENUE_EVENTS.filter(e => e.category === 'house-life'), ...POWER_EVENTS.filter(e => e.category === 'house-life')],
  phases: [...PHASE_EVENTS, ...POWER_EVENTS.filter(e => e.category === 'phases')],
};

export function houseEventsFor(...categories) {
  if (!categories.length) return HOUSE_EVENTS;
  return categories.flatMap(name => HOUSE_EVENTS_BY_CATEGORY[name] || []);
}

/**
 * A registry with a duplicate id would silently shadow an event: the scheduler
 * de-duplicates by id within an act, so the second one could never fire. Cheap
 * to check once, here, rather than wondering later why a category went quiet.
 */
export function assertUniqueEventIds(events = HOUSE_EVENTS) {
  const seen = new Set();
  const duplicates = [];
  for (const event of events) {
    if (seen.has(event.id)) duplicates.push(event.id);
    seen.add(event.id);
  }
  if (duplicates.length) throw new Error(`Duplicate Big Brother event ids: ${duplicates.join(', ')}`);
  return true;
}

export { CEREMONY_EVENTS, SOCIAL_EVENTS, EDITORIAL_SOCIAL_EVENTS, DEALS_EVENTS, HOUSE_LIFE_EVENTS, PHASE_EVENTS };
export default HOUSE_EVENTS;
