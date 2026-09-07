// ══════════════════════════════════════════════════════════════════════
// tr-density.js — how long an episode of this show is, and who decides
// ══════════════════════════════════════════════════════════════════════
//
// An author scheduling a season had no way to say "make the episodes
// shorter". The Castle Day drew its six phase budgets from fixed ranges
// (js/tr/castle/phases.js) and that was the length you got.
//
// ── WHAT WAS MEASURED FIRST, BECAUSE IT DECIDES THE WHOLE DESIGN ──────
//
// A reveal card is an `id="xx-step-…"` element — the unit the visual player
// actually pages through. Counting them across 8 seeds x 3 cast sizes, every
// screen `traitorsScreens` builds for the audience:
//
//   cast 10   mean 95.0 cards/ep    castle 28.8   fixed 66.2   castle share 30%
//   cast 14   mean 104.5 cards/ep   castle 31.8   fixed 72.7   castle share 30%
//   cast 18   mean 109.7 cards/ep   castle 33.3   fixed 76.5   castle share 30%
//
// RE-MEASURED, AND EVERY NUMBER IN THIS FILE MOVED. The table above used to
// read 81/88/94, and by the time anybody re-ran it the estimator was telling an
// author 94 cards for an episode that runs 110 — 16% short, against a band of
// 8%. Nothing about the control changed; the SHOW got longer. Both halves grew:
// the spine gained a wider Round Table and cold open, and the castle gained
// scores of events across the confrontation, alibi, alone and group families,
// which is the mechanism `runWindow` describes — a bigger pool means fewer
// barren draws, so a phase spends more of the budget it already had. An
// estimator fitted to a pool is a measurement with a shelf-life, and
// tests/tr-density-controls.test.js is what notices when it expires. It went
// red rather than drifting quietly, which is what it is for.
//
// THE CASTLE DAY IS STILL UNDER A THIRD OF AN EPISODE, and the share did not
// move at all — 30% then, 30% now, at every cast size. The other 70% is the
// spine — Round Table (25.2), cold open (16.2), suspicion board (8.9),
// conclave (7.0), mission (5.1), status (5.0), arrival (4.4), selection (2.5),
// endgame (1.7) — and those are the show, not padding. A density control may
// not touch them: an episode that skips its Round Table cards is not a shorter
// episode of this show, it is a broken one.
//
// So density scales the DISCRETIONARY layer only, and the honest consequence
// is that it moves total episode length by roughly -11% to +8%, not by the 2x
// that words like "compact" and "extended" imply on their own. The estimator
// reports the TOTAL, so the author is told the true number rather than the
// flattering one.
//
// ── AND EXTENDED IS CAPPED BY THE EVENT POOL, NOT BY ITS BUDGET ──────
//
// The first cut set extended at 1.75 and the estimator predicted 116 cards at
// cast 18. Measured: 101.5. Raising the budget factor further was tried before
// anything was written down, and it is the finding that shaped this file:
//
//   factor 1.75 -> 101.5 cards      factor 2.5 -> 102.5      factor 4.0 -> 103.8
//
// More than doubling the budget buys two cards. A phase cannot fire scenes it
// does not have: `runWindow` is bounded by how many pool events are ELIGIBLE
// that night once preconditions and cooldowns have had their say, and by the
// upper phases that number is already the binding constraint. Extended is
// therefore left at 1.75 — 2.5 and 4.0 deliver nothing extra and would only
// make the setting lie harder about what it does.
//
// AND THE CAP MOVED WHEN THE POOL DID, WHICH IS THE SAME FINDING FROM THE
// OTHER SIDE. Extended delivered 1.19x of the castle when that was written and
// delivers 1.37x now, off an unchanged budget factor of 1.75. Nothing was
// tuned: the events written since are what a 1.75 budget now has to spend
// itself on. So the ceiling on this control is content, and the way to raise it
// has never been the number below.
//
// Which is why each level carries TWO numbers. `factor` is the budget knob the
// engine turns. `effective` is the multiplier the castle ACTUALLY produced
// when the season was played and the cards were counted, and it is the one the
// estimator uses — because an author is owed the measured length, not the
// requested one. Compact shows the same gap in the other direction (asks 0.45,
// delivers 0.63) via the one-scene floor and fair-share rounding.
//
// ── WHY FACTOR 1.0 HAS TO BE ARITHMETICALLY EXACT ────────────────────
//
// The castle layer draws from its own rng stream and a season is reproducible
// from its seed: one added or removed draw re-rolls everything downstream.
// `scaledRange` therefore returns `[min, max]` UNCHANGED at factor 1, and
// `runCastlePhase` still makes exactly one draw at every density. A season
// played on the default is bit-identical to the same season before this file
// existed, and tests/tr-density-controls.test.js asserts that rather than
// assuming it.
//
// Placed at js/ rather than js/tr/ for the same reason as js/tr-rules.js:
// it holds no engine state, and both the engine (phases.js) and the setup UI
// (cast-ui.js) read it, so it lives in one copy where neither can drift.

/**
 * The three lengths an author can pick, shortest first.
 *
 * `factor` scales the Castle Day's per-phase scene budgets. `blurb` is what
 * the setup screen says about the trade, in the author's terms rather than
 * the engine's.
 */
export const TR_DENSITY_LEVELS = [
  {
    id: 'compact',
    label: 'Compact',
    factor: 0.45,
    effective: 0.63,
    blurb: 'Leaner castle days. The night itself is untouched — breakfast, the '
      + 'mission, the table and the murder all still run in full — but the '
      + 'small scenes around them are cut back. About an eighth shorter.',
  },
  {
    id: 'full',
    label: 'Full',
    factor: 1,
    effective: 1,
    blurb: 'The default. A complete castle day around each night: fallout at '
      + 'breakfast, life in the castle, private strategy, the scramble.',
  },
  {
    id: 'extended',
    label: 'Extended',
    factor: 1.75,
    effective: 1.37,
    blurb: 'As much of the day as the castle can actually produce. Adds only '
      + 'about 11% — on most nights the pool of scenes that could plausibly '
      + 'happen runs out before the budget does.',
  },
];

export const TR_DENSITY_IDS = TR_DENSITY_LEVELS.map(d => d.id);
export const TR_DENSITY_DEFAULT = 'full';

const _byId = new Map(TR_DENSITY_LEVELS.map(d => [d.id, d]));

/** The level record, falling back to the default for anything unrecognised. */
export function densityLevel(id) {
  return _byId.get(id) || _byId.get(TR_DENSITY_DEFAULT);
}

/** The scene-budget multiplier the ENGINE applies. 1 for the default. */
export function densityFactor(id) {
  return densityLevel(id).factor;
}

/**
 * The multiplier the castle actually DELIVERED when this was measured.
 *
 * Not the same as `densityFactor`, and deliberately so — see the header. The
 * estimator uses this one, because the number an author is shown has to be the
 * length they will get, not the length that was asked for.
 */
export function densityEffective(id) {
  const l = densityLevel(id);
  return l.effective == null ? l.factor : l.effective;
}

/**
 * A phase's `[min, max]` scene budget under a density.
 *
 * EXACT AT FACTOR 1 — returns the pair it was given, so the default consumes
 * the rng stream identically to the code that had no density at all.
 *
 * A phase never scales below 1 scene: a castle day with a phase budgeted at
 * zero is not a compact episode, it is a missing stretch of the day, and the
 * record shape downstream still expects the phase to exist.
 */
export function scaledRange(min, max, factor) {
  if (factor === 1) return [min, max];
  const lo = Math.max(1, Math.round(min * factor));
  const hi = Math.max(lo, Math.round(max * factor));
  return [lo, hi];
}

// ── the estimator ─────────────────────────────────────────────────────
//
// Linear in cast size, least-squares over the three sweeps at the top of this
// file. Both lines still rise with the cast, for the reason they always did: a
// bigger castle means more people for a scene to be about AND more names on
// every board the spine already draws.
//
//   fixed(size)      = 53.8 + 1.28 * size     10 -> 66.6  14 -> 71.8  18 -> 76.9
//   castleFull(size) = 23.5 + 0.56 * size     10 -> 29.1  14 -> 31.3  18 -> 33.5
//
// THE TWO SLOPES CAME APART AT THE RE-FIT AND THE REASON IS WORTH KEEPING.
// They were both ~0.85 before; the spine's is now more than twice the castle's.
// Cast size feeds the spine ROSTER-WIDE — every extra player is another row on
// the suspicion board, another name in the Round Table's count, another face in
// status — while a castle day still fires a bounded number of scenes about two
// people each. Adding players lengthens the boards linearly and the castle
// barely at all. Worst residual across the seven measured sweeps: 3.2%, against
// the 8% band the test holds.
//
// The spread is the measured p10/p90 ratio against the mean (0.91 / 1.09 at
// cast 18), and IT NARROWED SHARPLY — it was 0.54 / 1.18. The old comment
// explained the width by early episodes being genuinely short, and that is
// still true of episode one, but the floor has risen: a thin night now has
// enough castle written for it to reach 100 cards. The range is consequently
// much tighter than it was, which is a real thing to tell an author rather
// than a rounding artefact.
const FIXED_BASE = 53.8, FIXED_PER_HEAD = 1.28;
const CASTLE_BASE = 23.5, CASTLE_PER_HEAD = 0.56;
const P10_RATIO = 0.91, P90_RATIO = 1.09;

/**
 * Roughly how many reveal cards an episode will run to.
 *
 * Returns `{ typical, low, high, castle, fixed }` — all counts of reveal
 * cards. `low`/`high` are the tenth and ninetieth percentile of a played
 * season, not the absolute extremes: the first episode of a season sits below
 * `low` by construction and saying so in a range would make the range useless.
 */
export function traitorsEstimatedCards(castSize = 18, densityId = TR_DENSITY_DEFAULT) {
  const size = Math.max(4, Math.min(30, Number(castSize) || 18));
  const f = densityEffective(densityId);
  const fixed = FIXED_BASE + FIXED_PER_HEAD * size;
  const castle = (CASTLE_BASE + CASTLE_PER_HEAD * size) * f;
  const typical = fixed + castle;
  // THE PARTS SUM TO THE WHOLE BY CONSTRUCTION, NOT BY LUCK. Rounding all
  // three independently let `castle + fixed` come out one card above
  // `typical` at the re-fitted constants — the invariant the summary line
  // prints and tests/tr-density-controls.test.js asserts. So the total and
  // the fixed half are rounded and the castle half is what is left, which is
  // also what it MEANS: the part of the shown number this control moves.
  const total = Math.round(typical);
  const fixedCards = Math.round(fixed);
  return {
    typical: total,
    low: Math.round(typical * P10_RATIO),
    high: Math.round(typical * P90_RATIO),
    castle: total - fixedCards,
    fixed: fixedCards,
  };
}

/**
 * The one-line readout the setup screen prints under the picker.
 *
 * Says the share as well as the count, because "about 94 cards" on its own
 * does not tell an author that moving the control can only reach a third of
 * them — which is the single most useful thing to know before moving it.
 */
export function traitorsDensitySummary(castSize = 18, densityId = TR_DENSITY_DEFAULT) {
  const e = traitorsEstimatedCards(castSize, densityId);
  return `About ${e.typical} cards a typical episode (${e.low}–${e.high} across a season). `
    + `${e.castle} of them are castle scenes, which is the part this setting moves; `
    + `the other ${e.fixed} are the night itself.`;
}
