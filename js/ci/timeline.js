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
import { CIRCLE_FORMAT } from '../shows.js';
import { FORMATS } from './formats.js';

export const POSITIONS = ['first', 'early', 'middle', 'late', 'last'];

// Weights by position. Standard dominates every stretch, as it does on the show.
export const NIGHT_DRAWS = {
  first: [['standard', 6], ['sole', 2], ['forced', 1]],
  early: [['standard', 7], ['sole', 1], ['save-first', 1], ['forced', 0.5]],
  middle: [['standard', 7], ['save-first', 2], ['trio', 1], ['secret', 1], ['mutual', 0.5], ['save-two', 1], ['plead', 1],
    ['instant', 1], ['double', 1], ['antivirus', 1], ['mission', 0.7], ['none', 0.4], ['most-human', 0.5],
    ['audience-block', 0.6], ['audience-immunity', 0.6]],
  late: [['standard', 6], ['sole', 1], ['secret', 2], ['super', 2], ['mutual', 0.5], ['plead', 1], ['room-vote', 1],
    ['instant', 0.5], ['double', 0.5], ['public-super', 1], ['mission', 0.5], ['audience-block', 0.8], ['audience-immunity', 0.5]],
  last: [['standard', 6], ['super', 3]],
};

// A special format already used this season is that much less likely again:
// drawn night by night, a season could run America's Save twice in three days.
export const SEEN_AGAIN = 0.3;

export function positionOf(i, n) {
  if (i === 0) return 'first';
  if (i === n - 1) return 'last';
  const f = i / (n - 1);
  return f < 0.34 ? 'early' : f < 0.67 ? 'middle' : 'late';
}

const formatOfTwist = id => TWIST_CATALOG.find(t => t.id === id && t.format === CIRCLE_FORMAT && t.category === 'blocking')?.ciFormat;
const entryOfTwist = id => TWIST_CATALOG.find(t => t.id === id && t.format === CIRCLE_FORMAT && t.category === 'arrivals')?.ciEntry;
const powerOfTwist = id => TWIST_CATALOG.find(t => t.id === id && t.format === CIRCLE_FORMAT && t.category === 'power')?.ciPower;
// Powers a blocked player hands over (spec 14), drawn now and then mid-season.
export const POWER_DRAWS = { chance: 0.2, kinds: [['immunity', 2], ['hacker', 1], ['joker', 1], ['burner', 1]] };
export const DISRUPTER_CHANCE = 0.3;
const twistOfId = id => TWIST_CATALOG.find(t => t.id === id && t.format === CIRCLE_FORMAT && t.ciTwist)?.ciTwist;
// Identity twists, drawn rarely (booked by slot as often as the author likes).
export const TWIST_DRAWS = { swap: 0.08, clone: 0.06, 'ride-or-die': 0.12 };
// A slot's booking: one id, or a list (a night can have a blocking and an arrival).
const idsAt = (bookings, slot) => [].concat(bookings[slot] || []);

// How newcomers come in (spec 12.2), by how many arrive that day.
export const ENTRY_DRAWS = {
  one: [['snoop', 3], ['date', 1.5], ['invites', 1], ['race', 1], ['lurk', 1], ['chosen', 1], ['party', 1], ['pair', 1]],
  more: [['snoop', 2], ['pair', 2], ['party', 1.5], ['race', 1]],
};

function weighted(rng, options) {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [f, w] of options) if ((r -= w) <= 0) return f;
  return options.at(-1)[0];
}

/** The schedule with `night` on every blocking day (and days a double gave back). */
// `fixed`: the timeline already holds a drawn season (the Randomize button,
// ci-run.js circleRandomDraw), so nothing more is drawn behind the author's
// back: no extra power, twist or disrupter the timeline does not show.
// `surprises: false` (the season option "Surprise twists" off): only what is
// booked happens. An empty night is the standard Hangout, a newcomer comes in
// the usual way (snoop), and nothing else is drawn. A night the season needs
// to remove two (behind after a no-blocking night) is still a double: that is
// the count, not a surprise.
export function bookSeason(schedule, rng, { total, finalists = 5, bookings = {}, fixed = false, surprises = true } = {}) {
  if (!surprises) fixed = true;
  const out = schedule.map(d => ({ ...d }));
  // Twists that change how many must be blocked, placed first: a second
  // chance brings one profile back (+1); an egg twist blocks a newcomer on
  // arrival (-1). Each applies from its own day on.
  const deltas = [];
  for (const d of out) {
    if (d.final || d.finale || d.day === 1) continue;
    const ids = idsAt(bookings, d.slot);
    if (ids.some(id => twistOfId(id) === 'second-chance')) { d.twist = 'second-chance'; deltas.push({ day: d.day, delta: 1, twist: d }); }
    if (d.arrivals > 0 && ids.some(id => entryOfTwist(id) === 'egg')) {
      if (d.arrivals < 2) {
        const from = out.filter(x => x.day > d.day && x.arrivals > 0).at(-1);
        if (from) { from.arrivals--; d.arrivals++; d.pulledFrom = from.slot; }
      }
      if (d.arrivals >= 2) { d.entry = 'egg'; d.entryBooked = true; deltas.push({ day: d.day, delta: -1 }); }
    }
  }
  const nights = out.filter(d => d.block);
  const n = nights.length;
  let need = total - finalists, removed = 0;
  const used = new Set();
  nights.forEach((d, i) => {
    if (!d.block) return;                          // given back to a double earlier
    for (const e of deltas.filter(x => !x.applied && x.day <= d.day)) {
      e.applied = true;
      // A second chance needs two blocked players to bring back.
      if (e.delta > 0 && removed < 2) { delete e.twist.twist; e.twist.twistFellBack = 'second-chance'; continue; }
      need += e.delta; removed -= e.delta < 0 ? e.delta : 0;
    }
    const later = nights.slice(i + 1).filter(x => x.block);
    const ctx = { position: positionOf(i, n), index: i, nights: n, need, later: later.length };
    // What is left after tonight must still be doable: every later night
    // removes at least one, and all but the last can remove two. When the
    // season is behind (a night that removed nobody), tonight must take two.
    const cap = later.length + Math.max(0, later.length - 1);
    const mustDouble = need - later.length >= 2;
    const fits = f => FORMATS[f] && FORMATS[f].can(ctx)
      // (a surplus later night can be given back; only the last cannot)
      && need - FORMATS[f].removes >= (later.length ? 1 : 0) && need - FORMATS[f].removes <= cap
      && (!mustDouble || FORMATS[f].removes >= 2);
    const ids = idsAt(bookings, d.slot);
    const bookedId = ids.find(id => formatOfTwist(id)) || ids.find(id => !entryOfTwist(id));
    const booked = bookedId && formatOfTwist(bookedId);
    let night;
    if (bookedId && booked && fits(booked)) night = { format: booked, booked: true };
    // A booking that cannot run is standard (or a double, when the season is
    // behind), on record, never a surprise draw.
    else if (bookedId) night = { format: mustDouble && fits('double') ? 'double' : 'standard', fellBack: booked || bookedId };
    else if (!surprises) night = { format: mustDouble && fits('double') ? 'double' : 'standard' };
    else {
      const options = (NIGHT_DRAWS[ctx.position] || [['standard', 1]]).filter(([f]) => fits(f))
        .map(([f, w]) => [f, f !== 'standard' && used.has(f) ? w * SEEN_AGAIN : w]);
      night = { format: options.length ? weighted(rng, options) : mustDouble ? 'double' : 'standard' };
    }
    night.position = ctx.position;
    used.add(night.format);
    const bookedPower = ids.map(powerOfTwist).find(Boolean);
    if (bookedPower) night.power = bookedPower;
    else if (!fixed && (ctx.position === 'middle' || ctx.position === 'late') && rng() < POWER_DRAWS.chance) night.power = weighted(rng, POWER_DRAWS.kinds);
    d.night = night;
    // Give back the later nights the season no longer needs (latest first,
    // never the last): a double ahead of schedule frees one; a double that
    // catches up after a night with no blocking frees none.
    const surplus = later.length - (need - FORMATS[night.format].removes);
    for (let k = 0, j = later.length - 2; k < surplus && j >= 0; k++, j--) {
      Object.assign(later[j], { block: false, gaveBack: d.slot, game: true, party: true });
    }
    need -= FORMATS[night.format].removes;
    removed += FORMATS[night.format].removes;
  });
  // Disrupter alerts (US 7): booked on a day, or drawn on some social days.
  for (const d of out) {
    if (d.block || d.final || d.finale || d.day === 1) continue;
    if (idsAt(bookings, d.slot).includes('ci-disrupter') || (!fixed && d.slot.startsWith('social') && rng() < DISRUPTER_CHANCE)) d.disrupter = true;
  }
  // Identity twists (spec 14): booked on a day, or drawn now and then.
  let rodDrawn = false;
  for (const d of out) {
    if (d.final || d.finale || d.day === 1) continue;
    if (d.twist || d.twistFellBack) continue;       // placed in the first pass
    const booked = idsAt(bookings, d.slot).map(twistOfId).find(Boolean);
    if (booked) { d.twist = booked; continue; }
    if (fixed) continue;
    if (d.slot.startsWith('social') && rng() < TWIST_DRAWS.swap) d.twist = 'swap';
    else if (d.block && d.night?.position === 'middle' && rng() < TWIST_DRAWS.clone) d.twist = 'clone';
    else if (!rodDrawn && d.day <= Math.ceil(out.length / 2) && rng() < TWIST_DRAWS['ride-or-die']) { d.twist = 'ride-or-die'; rodDrawn = true; }
  }
  // Arrival days: booked by slot, or drawn by how many arrive. A pair on a
  // one-arrival day pulls a newcomer forward from the last later arrival day
  // (a 13-player season spreads its newcomers one a day, and the real show
  // still brought two in together: US 3 Ep 3).
  for (const d of out) {
    if (!(d.arrivals > 0) || d.entry === 'egg') continue;
    const booked = idsAt(bookings, d.slot).map(entryOfTwist).find(x => x && x !== 'egg');
    let entry = booked || (surprises ? weighted(rng, ENTRY_DRAWS[d.arrivals >= 2 ? 'more' : 'one']) : 'snoop');
    if (entry === 'pair' && d.arrivals < 2) {
      const from = out.filter(x => x.day > d.day && x.arrivals > 0).at(-1);
      if (from) { from.arrivals--; d.arrivals++; d.pulledFrom = from.slot; }
      else entry = 'snoop';
    }
    d.entry = entry;
    if (booked) d.entryBooked = true;
  }
  return out;
}
