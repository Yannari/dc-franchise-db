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

/**
 * The latest season aired — the franchise's "now".
 *
 * Everything between-seasons is measured from here, and it is deliberately
 * derived rather than stored: a stored "current year" is a second clock, and
 * two clocks disagree.
 */
export function latestAired(seasons = []) {
  const placed = seasons.filter(s => airKey(s) != null);
  if (!placed.length) return null;
  return placed.slice().sort(byAirDate)[placed.length - 1];
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
 * Returns { airYear, airSlot }, or null when the franchise has no dated season
 * to reason from — in which case nothing is written and nothing is guessed.
 */
export function nextWindowFor(seasons = [], format = null) {
  const quarters = s => { const k = airKey(s); return k == null ? null : Math.floor(k / 10) * 4 + (k % 10); };
  const at = q => ({ airYear: Math.floor(q / 4), airSlot: SLOTS[((q % 4) + 4) % 4] });

  const dated = seasons.filter(s => airKey(s) != null).sort(byAirDate);
  if (!dated.length) return null;

  const mine = format ? dated.filter(s => (s.format || null) === format) : dated;
  if (!mine.length) return at(quarters(dated[dated.length - 1]) + 1);
  if (mine.length === 1) return at(quarters(mine[0]) + 4);

  const last = quarters(mine[mine.length - 1]);
  const step = last - quarters(mine[mine.length - 2]);
  // A step of zero or a negative one means two seasons share a slot or the rows
  // are out of order; half a year is the franchise's commonest cadence and a
  // safer answer than repeating a date that already exists.
  return at(last + (step > 0 && step <= 8 ? step : 2));
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
