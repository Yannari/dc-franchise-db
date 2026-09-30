// ══════════════════════════════════════════════════════════════════════
// ci/formats.js — how a ratings night ends (spec §10, Plan 3b)
// ══════════════════════════════════════════════════════════════════════
//
// A format is the rule that turns a ratings night into a blocking. Each
// entry says how many it removes, how many Influencers it seats, whether it
// can run tonight, and runs. The timeline (ci/timeline.js) draws only
// formats registered here, so nothing half-built can be booked. A format
// that cannot run when its night comes falls back to standard, on record.
import { addScene } from './state.js';
import { standardBlocking } from './blocking.js';

export const FORMATS = {
  // Every season: the top two meet in the Hangout and block one.
  standard: { removes: 1, seats: 2, can: () => true,
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'standard' }) },
  // US 3 Ep 1, UK 3 Ep 1: the top-rated player alone.
  sole: { removes: 1, seats: 1, can: () => true,
    run: (state, rng, rating) => standardBlocking(state, rng, rating, { format: 'sole' }) },
};

/** Before the ratings: settle tonight's format (a booking that cannot run
 *  tonight falls back to standard, on record) and, if it is not the usual
 *  Hangout, the Circle tells the players the rule before it happens (§16.4). */
export function prepareNight(state, night = { format: 'standard' }) {
  let format = night.format || 'standard';
  if (!FORMATS[format] || !(FORMATS[format].canNow?.(state) ?? true)) {
    night.fellBack = format; format = 'standard';
  }
  night.format = format;
  if (format !== 'standard') addScene(state, 'alert', [...state.active], { format }, [...state.active]);
  (state.nights ||= []).push({ day: state.day, format, ...(night.fellBack ? { fellBack: night.fellBack } : {}) });
  return night;
}

/** After the ratings: tonight's blocking. */
export function runBlocking(state, rng, rating, night = { format: 'standard' }) {
  return FORMATS[night.format || 'standard'].run(state, rng, rating);
}
