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
import { SCHEME_EVENTS } from './schemes.js';
import { LOCATION_TEXTURE_EVENTS } from './location-texture.js';
import { STORY_FOLLOWUP_EVENTS } from './story-followups.js';
import { BLOC_EVENTS } from './blocs.js';
import { FALLOUT_EVENTS } from './fallout.js';
import { REIGN_EVENTS } from './reign.js';
import { SHOWMANCE_EVENTS } from './showmance.js';
import { BOND_EVENTS } from './bonds.js';
import { VOTE_PLAN_EVENTS } from './vote-plans.js';
import { INVISIBLE_EVENTS } from './invisible.js';
import { HACKER_EVENTS } from './hacker.js';
import { ROADKILL_EVENTS } from './roadkill.js';
import { PANDORA_EVENTS } from './pandora.js';
import { SPLIT_HOUSE_EVENTS } from './split-house.js';
import { CONSEQUENCE_ARC_EVENTS } from './consequence-arcs.js';
import { ALLIANCE_LIFE_EVENTS } from './alliance-life.js';
import { SHOWMANCE_ARC_EVENTS } from './showmance-arcs.js';
import { HAVENOT_LIFE_EVENTS } from './havenot-life.js';

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
  ...SCHEME_EVENTS,
  ...LOCATION_TEXTURE_EVENTS,
  ...STORY_FOLLOWUP_EVENTS,
  ...BLOC_EVENTS,
  ...FALLOUT_EVENTS,
  ...REIGN_EVENTS,
  ...SHOWMANCE_EVENTS,
  ...BOND_EVENTS,
  ...VOTE_PLAN_EVENTS,
  ...INVISIBLE_EVENTS,
  ...HACKER_EVENTS,
  ...ROADKILL_EVENTS,
  ...PANDORA_EVENTS,
  ...SPLIT_HOUSE_EVENTS,
  ...CONSEQUENCE_ARC_EVENTS,
  ...ALLIANCE_LIFE_EVENTS,
  ...SHOWMANCE_ARC_EVENTS,
  ...HAVENOT_LIFE_EVENTS,
];

/** The same events grouped, for debug screens and for testing one slice. */
export const HOUSE_EVENTS_BY_CATEGORY = {
  ceremonies: [...CEREMONY_EVENTS, ...POWER_EVENTS.filter(e => e.category === 'ceremonies'), ...[...VOTE_PLAN_EVENTS, ...CONSEQUENCE_ARC_EVENTS, ...ALLIANCE_LIFE_EVENTS, ...SHOWMANCE_ARC_EVENTS, ...HAVENOT_LIFE_EVENTS].filter(e => e.category === 'ceremonies')],
  social: [...SOCIAL_EVENTS, ...EDITORIAL_SOCIAL_EVENTS, ...POWER_EVENTS.filter(e => e.category === 'social'), ...SCHEME_EVENTS.filter(e => e.category === 'social'), ...LOCATION_TEXTURE_EVENTS.filter(e => e.category === 'social'), ...STORY_FOLLOWUP_EVENTS.filter(e => e.category === 'social'), ...BLOC_EVENTS.filter(e => e.category === 'social'), ...REIGN_EVENTS.filter(e => e.category === 'social'), ...SHOWMANCE_EVENTS.filter(e => e.category === 'social'), ...BOND_EVENTS.filter(e => e.category === 'social'), ...[...VOTE_PLAN_EVENTS, ...CONSEQUENCE_ARC_EVENTS, ...ALLIANCE_LIFE_EVENTS, ...SHOWMANCE_ARC_EVENTS, ...HAVENOT_LIFE_EVENTS].filter(e => e.category === 'social')],
  deals: [...DEALS_EVENTS, ...VENUE_EVENTS.filter(e => e.category === 'deals'), ...POWER_EVENTS.filter(e => e.category === 'deals'), ...SCHEME_EVENTS.filter(e => e.category === 'deals'), ...LOCATION_TEXTURE_EVENTS.filter(e => e.category === 'deals'), ...STORY_FOLLOWUP_EVENTS.filter(e => e.category === 'deals'), ...BLOC_EVENTS.filter(e => e.category === 'deals'), ...FALLOUT_EVENTS.filter(e => e.category === 'deals'), ...REIGN_EVENTS.filter(e => e.category === 'deals'), ...SHOWMANCE_EVENTS.filter(e => e.category === 'deals'), ...[...VOTE_PLAN_EVENTS, ...CONSEQUENCE_ARC_EVENTS, ...ALLIANCE_LIFE_EVENTS, ...SHOWMANCE_ARC_EVENTS, ...HAVENOT_LIFE_EVENTS].filter(e => e.category === 'deals')],
  'house-life': [...HOUSE_LIFE_EVENTS, ...VENUE_EVENTS.filter(e => e.category === 'house-life'), ...POWER_EVENTS.filter(e => e.category === 'house-life'), ...LOCATION_TEXTURE_EVENTS.filter(e => e.category === 'house-life'), ...FALLOUT_EVENTS.filter(e => e.category === 'house-life'), ...REIGN_EVENTS.filter(e => e.category === 'house-life'), ...BOND_EVENTS.filter(e => e.category === 'house-life'), ...[...VOTE_PLAN_EVENTS, ...CONSEQUENCE_ARC_EVENTS, ...ALLIANCE_LIFE_EVENTS, ...SHOWMANCE_ARC_EVENTS, ...HAVENOT_LIFE_EVENTS].filter(e => e.category === 'house-life')],
  phases: [...PHASE_EVENTS, ...POWER_EVENTS.filter(e => e.category === 'phases'), ...[...VOTE_PLAN_EVENTS, ...CONSEQUENCE_ARC_EVENTS, ...ALLIANCE_LIFE_EVENTS, ...SHOWMANCE_ARC_EVENTS, ...HAVENOT_LIFE_EVENTS].filter(e => e.category === 'phases')],
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

export { CEREMONY_EVENTS, SOCIAL_EVENTS, EDITORIAL_SOCIAL_EVENTS, DEALS_EVENTS, HOUSE_LIFE_EVENTS, PHASE_EVENTS, LOCATION_TEXTURE_EVENTS };
export default HOUSE_EVENTS;
