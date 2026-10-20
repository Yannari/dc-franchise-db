// When a season aired.
//
// Until now the franchise had NO temporal field of any kind. Fifteen seasons,
// no dates, and season order existed only as a number inside a single show — so
// `td-9` and `bb-1` had no defined relationship in time at all. That is why the
// whole Big Brother season 1 cast coming from Total Drama had no *when*, why
// nothing could be ordered across shows, and why a birthdate could only ever
// produce one age instead of an age per season.
//
// ── WHY YEAR + SLOT, NOT A DATE ──
//
// Because two Big Brothers and two Survivors can air in the same year, "the gap
// between two seasons" is not a thing — there is no *the* gap when several shows
// run in parallel. A calendar solves that; exact dates would too, but days never
// matter here and two dropdowns cannot be filled in wrong.
//
// ── NOTHING TICKS ──
//
// "Now" is the end of the most recent season aired. Time advances because you
// aired something, not because a clock ran. That keeps the in-world date
// impossible to contradict: there is no second source of time to drift.

// ── ONE HOME ──
//
// The window lives on the season's row in `seasons_database.json` and NOWHERE
// ELSE. The first version also wrote it into all fifteen documents under
// data/seasons/, which duplicated the fact and reformatted 329 lines of
// hand-indented JSON to add two fields. A second copy of a date is a second
// thing to keep in step, and this project has been bitten by that often enough
// to have a document about it.

import { SHOWS } from './shows.js';

/** The four slots, in the order they occur within a year. */
export const SLOTS = ['winter', 'spring', 'summer', 'fall'];

const SLOT_LABEL = {
  winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall',
};

/**
 * The month a slot is taken to start in.
 *
 * Only used for age arithmetic and for ordering against a birthdate, never
 * shown. Mid-slot rather than the boundary, so a season is treated as happening
 * DURING its slot rather than on the first morning of it.
 */
const SLOT_MONTH = { winter: 1, spring: 4, summer: 7, fall: 10 };

/**
 * A sortable number for a season's air window, or null if it has none.
 *
 * Seasons without a window sort last rather than first: an unscheduled season
 * is one nobody has placed yet, and putting it at the dawn of the franchise
 * would silently rewrite every "the first player to…" it takes part in.
 */
export function airKey(season) {
  const y = Number(season?.airYear);
  const i = SLOTS.indexOf(String(season?.airSlot || '').toLowerCase());
  if (!Number.isFinite(y) || i < 0) return null;
  return y * 10 + i;
}

/** Chronological across every show. Unscheduled seasons keep their order, last. */
export function byAirDate(a, b) {
  const ka = airKey(a);
  const kb = airKey(b);
  if (ka == null && kb == null) return 0;
  if (ka == null) return 1;
  if (kb == null) return -1;
  return ka - kb;
}

/** "Summer 2026", or '' when the season has not been placed. */
export function airLabel(season) {
  if (airKey(season) == null) return '';
  return `${SLOT_LABEL[String(season.airSlot).toLowerCase()]} ${season.airYear}`;
}

/**
 * How old somebody was during a season, from an ISO birthdate.
 *
 * THE POINT OF THE WHOLE FILE, for a wiki: a real article says how old somebody
 * was on the season being read, not how old they are today. `js/wiki.js` has
 * only ever been able to say the latter.
 *
 * Null when either half is missing, so a caller can fall back rather than print
 * a number it made up.
 */
export function ageAt(birthdate, season) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthdate || ''))) return null;
  if (airKey(season) == null) return null;
  const b = new Date(`${birthdate}T00:00:00Z`);
  if (Number.isNaN(b.getTime())) return null;
  const month = SLOT_MONTH[String(season.airSlot).toLowerCase()];
  let age = Number(season.airYear) - b.getUTCFullYear();
  // Their birthday has not happened yet by the time the slot starts.
  if (month < b.getUTCMonth() + 1) age--;
  return age >= 0 && age < 130 ? age : null;
}

/** How many episodes a season is drawn with when its row does not say. */
export const DEFAULT_RUN = 12;

/** A season's finale, as a UTC Date: its premiere, then one episode a week. */
export function finaleDate(season, format = season?.format) {
  const n = Number(season?.episodeCount) > 0 ? Number(season.episodeCount) : DEFAULT_RUN;
  return episodeAirDates(season, n, format).pop() || null;
}

/**
 * The latest season aired — the franchise's "now".
 *
 * Everything between-seasons is measured from here, and it is deliberately
 * derived rather than stored: a stored "current year" is a second clock, and
 * two clocks disagree.
 *
 * LATEST BY FINALE, NOT BY SLOT. A 26-episode spring season runs into
 * September; a 12-episode one exported after it in the same spring ends in
 * June. Sorted by slot alone, exporting the short one walked "now" back three
 * months.
 */
export function latestAired(seasons = []) {
  const placed = seasons.filter(s => airKey(s) != null);
  if (!placed.length) return null;
  const end = s => finaleDate(s)?.getTime() ?? 0;
  return placed.slice().sort((a, b) => end(a) - end(b) || byAirDate(a, b))[placed.length - 1];
}

/** The date "now" is: the latest finale. Null with nothing aired. */
export function nowDate(seasons = []) {
  const s = latestAired(seasons);
  return s ? finaleDate(s) : null;
}

/**
 * THE 2027 EXCEPTION (the user, 2026-10-20). Six seasons were already on the
 * calendar for 2027 when the rule below came in (a season can't premiere
 * before "now"), and Total Drama 15's 26-week run had already carried "now"
 * to September 2027 before any of them was played. Under the rule all six
 * would have moved a year, and the user asked to keep their 2027. So they keep
 * the windows they had (`booked` on their show's registry entry), whatever
 * order they are played in.
 *
 * Nothing else is ever added: from now on the Run tab and the export warn when
 * a season is due (js/air-watch.js), so a season starts before it can slip.
 */
/** A booked window for this show's season `number`, or null. */
export function bookedWindow(format, number) {
  const w = SHOWS[format]?.booked?.[number];
  return w ? { ...w } : null;
}

/**
 * Whole years between two seasons — the span a life layer would resolve over.
 *
 * Slots are quarters, so the arithmetic is in quarters and reported as years to
 * one decimal. Null if either season is unplaced.
 */
export function yearsBetween(from, to) {
  const a = airKey(from);
  const b = airKey(to);
  if (a == null || b == null) return null;
  const quarters = (Math.floor(b / 10) - Math.floor(a / 10)) * 4 + ((b % 10) - (a % 10));
  return Math.round((quarters / 4) * 10) / 10;
}

/**
 * Where the NEXT season of a show belongs, read off that show's own rhythm.
 *
 * A season arrives from the export with no date at all — the calendar has
 * always been hand-written — and an undated season has no off-season, because
 * "after" is meaningless without a "when". So the export has to place it, and
 * the only honest way to place it is to continue the pattern already on the
 * record instead of inventing a schedule.
 *
 * The gap between a show's two most recent seasons IS the schedule: Total Drama
 * alternates spring and fall, two quarters apart, and Big Brother has run once
 * a summer. One dated season means a year later in the same slot; none at all
 * means one quarter after whatever aired last anywhere, which is as close to
 * "soon" as a franchise with no other seasons of that show can get.
 *
 * ── A SHOW WITH HOME QUARTERS ──
 *
 * Most shows now say when they air: `airSlots` on their registry entry (Drag
 * Race and The Traitors in winter, Big Brother in summer...). Then the rhythm
 * is not inferred at all. The next season is the next home quarter after the
 * show's last one, and a show's FIRST season is its first home quarter at or
 * after whatever aired last anywhere — "at", because two shows sharing a
 * quarter is the plan, not a collision. Without this, The Traitors' first
 * season would have landed in whatever quarter followed Drag Race, and every
 * season after it would have continued that accident.
 *
 * ── NEVER BEFORE "NOW" (the user, 2026-10-20) ──
 *
 * "Now" is the latest finale (nowDate). A season nobody has played yet cannot
 * have premiered before it: Total Drama 15 ran 26 weeks into September 2027,
 * and the Circle's first season, played after it, still sat in that April —
 * a "projected" bar drawn in the past. So the window found above moves on to
 * the first one whose premiere is at or after now. A show's own quarters
 * still win: the Circle waits for the next spring rather than taking the fall.
 *
 * That makes the ORDER seasons are exported in matter, which is why a season's
 * window is fixed when it starts (`gs.airWindow`, js/air-watch.js) and why the
 * Run tab warns when another show is due. A `booked` window, above, is the
 * one exception.
 *
 * `number` is the season being placed (default: the show's next one), for
 * the bookings.
 *
 * Returns { airYear, airSlot }, or null when the franchise has no dated season
 * to reason from — in which case nothing is written and nothing is guessed.
 */
export function nextWindowFor(seasons = [], format = null, { number = null } = {}) {
  const quarters = s => { const k = airKey(s); return k == null ? null : Math.floor(k / 10) * 4 + (k % 10); };
  const at = q => ({ airYear: Math.floor(q / 4), airSlot: SLOTS[((q % 4) + 4) % 4] });

  const dated = seasons.filter(s => airKey(s) != null).sort(byAirDate);
  if (!dated.length) return null;

  // An All Stars season is not part of the flagship's rhythm: it has its own
  // quarter (nextAllStarsWindow), and counting it here would push the next
  // winter season a year late every time one aired.
  const mine = format ? dated.filter(s => (s.format || null) === format && !s.allStars) : dated;

  const next = number ?? (mine.length ? Math.max(...mine.map(s => Number(s.seasonNumber) || 0), mine.length) + 1 : 1);
  // A booking only ever keeps a season EARLIER than the rule would put it: it
  // is the exception to "never before now", not a schedule of its own.
  const booked = format ? bookedWindow(format, next) : null;
  const pick = w => (booked && airKey(booked) < airKey(w) ? booked : w);

  const now = nowDate(dated);
  const open = q => !now || premiereDate(at(q), format) >= now;

  const home = (format && SHOWS[format]?.airSlots || []).map(s => SLOTS.indexOf(s)).filter(i => i >= 0);
  if (home.length) {
    const from = mine.length ? quarters(mine[mine.length - 1]) + 1 : quarters(dated[dated.length - 1]);
    for (let q = from; q < from + 16; q++) if (home.includes(((q % 4) + 4) % 4) && open(q)) return pick(at(q));
  }

  let q;
  let step = 1;
  if (!mine.length) q = quarters(dated[dated.length - 1]) + 1;
  else if (mine.length === 1) { q = quarters(mine[0]) + 4; step = 4; } else {
    const last = quarters(mine[mine.length - 1]);
    const gap = last - quarters(mine[mine.length - 2]);
    // A step of zero or a negative one means two seasons share a slot or the rows
    // are out of order; half a year is the franchise's commonest cadence and a
    // safer answer than repeating a date that already exists.
    step = gap > 0 && gap <= 8 ? gap : 2;
    q = last + step;
  }
  for (let i = 0; i < 16 && !open(q); i++) q += step;
  return pick(at(q));
}

/**
 * Where a show's next ALL STARS season belongs, or null for a show without one.
 *
 * The registry says when (`allStars` on the show's entry): the first is
 * possible only once the flagship has aired its `after`-th season, in the
 * first All Stars quarter after it, and every one after that a year on. A
 * season row counts as All Stars when it carries `allStars: true`.
 *
 * Before the first, the flagship seasons it waits for may not exist yet — the
 * franchise is in 2027 and the third Drag Race airs in 2029 — so the flagship's
 * own rhythm is walked forward to find them. Those projected flagship windows
 * come back as `bridge`, so a calendar can draw the seasons the All Stars is
 * waiting on instead of a lone bar with nothing before it.
 *
 * Returns { airYear, airSlot, number, bridge }; `number` is which All Stars
 * this would be.
 */
export function nextAllStarsWindow(seasons = [], format = null) {
  const cfg = format ? SHOWS[format]?.allStars : null;
  const slots = (cfg?.airSlots || []).map(s => SLOTS.indexOf(s)).filter(i => i >= 0);
  if (!slots.length) return null;
  const quarters = s => { const k = airKey(s); return Math.floor(k / 10) * 4 + (k % 10); };
  const at = q => ({ airYear: Math.floor(q / 4), airSlot: SLOTS[((q % 4) + 4) % 4] });
  const slotAfter = q0 => { for (let q = q0 + 1; q <= q0 + 4; q++) if (slots.includes(((q % 4) + 4) % 4)) return q; return q0 + 4; };

  const dated = seasons.filter(s => airKey(s) != null).sort(byAirDate);
  if (!dated.length) return null;
  const mine = dated.filter(s => (s.format || null) === format);
  const stars = mine.filter(s => s.allStars);
  // Never before "now", like a flagship season (nextWindowFor).
  const now = nowDate(dated);
  const open = q0 => { let q = q0; for (let i = 0; i < 16 && now && premiereDate(at(q), format) < now; i++) q = slotAfter(q); return q; };
  if (stars.length) return { ...at(open(slotAfter(quarters(stars[stars.length - 1])))), number: stars.length + 1, bridge: [] };

  const need = Math.max(1, Number(cfg.after) || 1);
  const flagships = mine.filter(s => !s.allStars);
  const bridge = [];
  let rows = dated;
  while (flagships.length < need) {
    const w = nextWindowFor(rows, format);
    if (!w) return null;
    const row = { format, airYear: w.airYear, airSlot: w.airSlot };
    bridge.push(w);
    flagships.push(row);
    rows = [...rows, row].sort(byAirDate);
  }
  return { ...at(open(slotAfter(quarters(flagships[need - 1])))), number: 1, bridge };
}

// ── THE FRANCHISE'S PRESENT, SET ONCE ────────────────────────────────
//
// "Nothing ticks" is the rule at the top of this file, and three places were
// breaking it: js/wiki.js and two blocks in player.html each computed an age
// against `new Date()`. Real time advances whether or not a season airs, so
// every character silently gained a year the moment the real calendar turned —
// while the franchise sat where it was. It reads correct today only because
// the real year and the aired year happen to match.
//
// So the present is stored once, derived from the seasons that have actually
// aired, and everything asks the same question of the same source.
let _now = null;

/** Point the calendar at the seasons that exist. Returns the present. */
export function setFranchiseNow(seasons) {
  _now = latestAired(seasons || []) || null;
  return _now;
}

/** The season that is "now", or null before any list has been supplied. */
export function franchiseNow() { return _now; }

/**
 * Their age at the franchise's present.
 *
 * Null rather than a real-world fallback when the present is unknown: an age
 * computed off the wrong clock is worse than a blank, because it looks right.
 */
export function ageNow(birthdate) {
  return _now ? ageAt(birthdate, _now) : null;
}

// ── PER-EPISODE AIRDATES ──────────────────────────────────────────────
//
// The season's window is year + slot, and that was the right granularity for
// everything this file was built for: ages, ordering, "the first player to".
// A wiki article wants something this file deliberately does not store —
// "March 24, 2027" under an episode heading.
//
// So it is DERIVED, never stored. A weekly run from the slot's month, one
// episode a week, on the night that show airs. That keeps the rule at the top
// of this file intact: there is still exactly one source of time, and no
// second clock to drift out of step with it. Change the season's slot and
// every episode date moves with it, because there is nothing else to update.
//
// It does mean the DAY is a convention rather than a fact. That is the honest
// trade for a column a reference page is expected to have, and it is a
// convention applied identically to every season, so two seasons in the same
// slot cannot disagree about when a Friday was.


/**
 * The premiere date for a season, as a UTC Date, or null if it has no window.
 *
 * The first <night> falling on or after the slot's month begins.
 */
export function premiereDate(season, format) {
  if (airKey(season) == null) return null;
  const month = SLOT_MONTH[String(season.airSlot).toLowerCase()];
  // What night the show goes out on is the registry's (SHOWS[format].airNight).
  const want = SHOWS[format]?.airNight ?? 5;
  const d = new Date(Date.UTC(Number(season.airYear), month - 1, 1));
  d.setUTCDate(d.getUTCDate() + ((want - d.getUTCDay() + 7) % 7));
  return d;
}

/**
 * `count` weekly airdates from the premiere, as UTC Dates.
 *
 * Empty when the season has no window — a caller prints nothing rather than
 * a date it invented whole.
 */
export function episodeAirDates(season, count, format) {
  const first = premiereDate(season, format);
  if (!first || !(count > 0)) return [];
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(first.getTime());
    d.setUTCDate(d.getUTCDate() + i * 7);
    return d;
  });
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** "March 24, 2027". Empty string for a null date, never "Invalid Date". */
export function airDateLabel(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
