// ══════════════════════════════════════════════════════════════════════
// bb/jury.js — when the jury opens, and who is sitting on it
// ══════════════════════════════════════════════════════════════════════
//
// The same arithmetic was written out three times and disagreed with itself.
// houseStructure() in bb-run.js said a jury of seven opens with nine
// houseguests left; the eviction interview in bb-aftermath.js worked it out
// again inline and printed TO THE JURY HOUSE from ten. So the timeline promised
// one night and the broadcast announced another, and the person who went home
// tenth was told they were a juror.
//
// The seating itself was never wrong — seatBBJury clamps with slice(-size), so
// the finale always sat exactly jurySize people. It was only ever the
// announcement that lied, which is the most awkward kind of bug: nothing to
// repair in a saved season, and nothing that shows up in a result.
//
// One rule, stated once:
//
//   The jury is the last `jurySize` people out, and the houseguest cut at the
//   final three is one of them.
//
// Everything below follows from that sentence. The reserved final seat is why
// the number is jurySize + 2 rather than + 1, and it is the part an off-by-one
// here quietly eats — six weekly jurors plus the final-three cut is seven, and
// starting a week early makes eight.
//
// Deliberately NOT a running gs.jury. The weeks ledger already records every
// eviction and every reversal, so the jury is derived on demand rather than
// copied per week — a house that writes its own roster into state every
// Thursday is how gs got to nineteen megabytes last time.
import { gs, seasonConfig } from '../core.js';

const sizeOf = config => Math.max(0, Number((config || seasonConfig)?.jurySize) || 0);

/**
 * How many houseguests are in the house on the night the FIRST juror is
 * evicted — counted at the start of that week, with the evictee still in it.
 *
 * Zero when the season is played without a jury, which callers should read as
 * "never", not as "immediately".
 */
export function juryOpensAt(config = seasonConfig) {
  const size = sizeOf(config);
  return size > 0 ? size + 2 : 0;
}

/**
 * Does tonight's eviction seat a juror?
 *
 * `houseAtStart` is the size of the house at the top of the week — the count
 * that includes the person about to leave, which is what week.houseAtStart
 * holds. Passing the post-eviction number is the off-by-one this module
 * exists to end.
 */
export function evictionSeatsAJuror(houseAtStart, config = seasonConfig) {
  const opens = juryOpensAt(config);
  const n = Number(houseAtStart) || 0;
  return opens > 0 && n > 0 && n <= opens;
}

/**
 * Which juror this eviction makes — 1 for the first, 2 for the second, and so
 * on. Zero when nobody is being seated.
 *
 * For the broadcast, which says FIRST MEMBER OF THE JURY out loud and then
 * counts. Derived from the house size rather than from how many are already
 * seated, so it is correct when called before the eviction is recorded.
 */
export function jurorOrdinalFor(houseAtStart, config = seasonConfig) {
  if (!evictionSeatsAJuror(houseAtStart, config)) return 0;
  return juryOpensAt(config) - (Number(houseAtStart) || 0) + 1;
}

/**
 * Everybody evicted so far who is sitting on the jury.
 *
 * Read from the weeks ledger, oldest first. An eviction a Battle Back undid is
 * not a seat: the week keeps its record, because the vote did happen and the
 * transcript still says so, but it stops counting as a departure — otherwise a
 * returnee ends up on the jury they are still playing against. If they are
 * evicted again later that week has its own entry and seats them properly.
 *
 * Clamped to the last `jurySize`, the same way the finale seats them, so a
 * mid-season reader and the final vote can never disagree about who is on it.
 */
export function seatedJurors({ upToWeek = null, config = seasonConfig } = {}) {
  const weeks = gs.bb?.weeks || [];
  const size = sizeOf(config);
  const out = [];
  for (const week of weeks) {
    if (upToWeek != null && Number(week?.num) > Number(upToWeek)) continue;
    if (!week?.evicted || week.evictionReversed) continue;
    // A week that never recorded its opening house still records an eviction,
    // and the eviction is the authority — the house size only decides whether
    // it was a jury one. Seasons saved before houseAtStart was written, and
    // weeks assembled by hand, would otherwise return an EMPTY jury at the
    // finale, which is a far worse answer than one pre-juror too many. The
    // trailing clamp settles the count either way, which is all the old code
    // ever relied on.
    const opening = (week.houseAtStart || []).length;
    if (opening > 0 && !evictionSeatsAJuror(opening, config)) continue;
    out.push(week.evicted);
  }
  return size ? out.slice(-size) : out;
}

/**
 * The jury, said out loud on the night it changes.
 *
 * Reaching jury is the milestone the whole back half of a season is played
 * toward, and neither transcript mentioned it at all — somebody evicted in week
 * nine read exactly like somebody evicted in week two. So the night it opens is
 * announced, and after that the roster is carried, because "who is already out
 * there" is the number every remaining houseguest is doing sums against and a
 * reader could not see it.
 *
 * Lives here rather than in either writer because BOTH call it: the run
 * transcript and the in-app one. A section that exists in one of them is a
 * section half the readers never see, and two copies of this would eventually
 * disagree about who is on the panel.
 *
 * @param {object} week  needs `num` and `evicted`
 * @param {function} line  the writer's own line sink
 */
export function juryLines(week, line) {
  const seated = seatedJurors({ upToWeek: week?.num });
  if (!seated.length) return;
  const justSeated = seated[seated.length - 1] === week?.evicted;
  if (justSeated && seated.length === 1) {
    line('');
    line(`  ${week.evicted} is the first member of the jury.`);
    line('  From tonight, everybody voted out helps decide who wins.');
  } else if (justSeated) {
    line('');
    line(`  ${week.evicted} joins the jury — number ${seated.length} out there.`);
  }
  line(`  Jury (${seated.length}): ${seated.join(', ')}.`);
}

/** Is this person on the jury as things stand? */
export function isSeatedJuror(name, opts = {}) {
  return !!name && seatedJurors(opts).includes(name);
}

/**
 * How many seats are still to be filled, the reserved final-three cut included.
 *
 * The finale takes one more juror than the weeks do — the houseguest cut at
 * three — so a reader counting only evictions comes up one short all season.
 */
export function juryStillToSeat(opts = {}) {
  return Math.max(0, sizeOf(opts.config) - seatedJurors(opts).length);
}
