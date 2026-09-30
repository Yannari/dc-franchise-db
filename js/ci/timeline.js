// ══════════════════════════════════════════════════════════════════════
// ci/timeline.js — the Season Timeline for the Circle (Plan 3b)
// ══════════════════════════════════════════════════════════════════════
//
// What each ratings night is: booked by the author by slot, or drawn by where
// the night sits in the season, the way the real seasons place them (spec
// §10): a sole influencer on the first night (US 3, UK 3), the instant and
// double blocks in the middle, super and secret influencers late. Perfect
// Match books its dumpings the same way. Only formats registered in
// ci/formats.js can be drawn, and a night that removes two gives a later
// blocking day back, so the season always ends with its finalists.
import { TWIST_CATALOG } from '../core.js';
import { FORMATS } from './formats.js';

export const POSITIONS = ['first', 'early', 'middle', 'late', 'last'];

// Weights by position. Standard dominates every stretch, as it does on the show.
export const NIGHT_DRAWS = {
  first: [['standard', 6], ['sole', 2]],
  early: [['standard', 7], ['sole', 1], ['save-first', 1]],
  middle: [['standard', 7], ['save-first', 2], ['trio', 1], ['secret', 1], ['mutual', 0.5]],
  late: [['standard', 6], ['sole', 1], ['secret', 2], ['super', 2], ['mutual', 0.5]],
  last: [['standard', 6], ['super', 3]],
};

export function positionOf(i, n) {
  if (i === 0) return 'first';
  if (i === n - 1) return 'last';
  const f = i / (n - 1);
  return f < 0.34 ? 'early' : f < 0.67 ? 'middle' : 'late';
}

const formatOfTwist = id => TWIST_CATALOG.find(t => t.id === id && t.format === 'the-circle' && t.category === 'blocking')?.ciFormat;

function weighted(rng, options) {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [f, w] of options) if ((r -= w) <= 0) return f;
  return options.at(-1)[0];
}

/** The schedule with `night` on every blocking day (and days a double gave back). */
export function bookSeason(schedule, rng, { total, finalists = 5, bookings = {} } = {}) {
  const out = schedule.map(d => ({ ...d }));
  const nights = out.filter(d => d.block);
  const n = nights.length;
  let need = total - finalists;
  nights.forEach((d, i) => {
    if (!d.block) return;                          // given back to a double earlier
    const later = nights.slice(i + 1).filter(x => x.block);
    const ctx = { position: positionOf(i, n), index: i, nights: n, need, later: later.length };
    // A night may remove more than one only while a later night (not the
    // last) can be given back for each extra.
    const fits = f => FORMATS[f] && FORMATS[f].can(ctx)
      && need - FORMATS[f].removes >= 0 && FORMATS[f].removes - 1 <= Math.max(0, later.length - 1);
    const bookedId = bookings[d.slot];
    const booked = bookedId && formatOfTwist(bookedId);
    let night;
    if (bookedId && booked && fits(booked)) night = { format: booked, booked: true };
    // A booking that cannot run is standard, on record, never a surprise draw.
    else if (bookedId) night = { format: 'standard', fellBack: booked || bookedId };
    else {
      const options = (NIGHT_DRAWS[ctx.position] || [['standard', 1]]).filter(([f]) => fits(f));
      night = { format: options.length ? weighted(rng, options) : 'standard' };
    }
    night.position = ctx.position;
    d.night = night;
    const extra = FORMATS[night.format].removes - 1;
    // Give back the latest later nights (never the last) for each extra removal.
    for (let k = 0, j = later.length - 2; k < extra && j >= 0; k++, j--) {
      Object.assign(later[j], { block: false, gaveBack: d.slot, game: true, party: true });
    }
    need -= FORMATS[night.format].removes;
  });
  return out;
}
