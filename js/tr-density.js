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
//   cast 10   mean 81 cards/ep   castle 21.4   fixed 59.4   castle share 26%
//   cast 14   mean 88 cards/ep   castle 25.6   fixed 62.9   castle share 29%
//   cast 18   mean 94 cards/ep   castle 28.2   fixed 66.1   castle share 30%
//
// THE CASTLE DAY IS UNDER A THIRD OF AN EPISODE. The other 70% is the spine —
// cold open (15.2), Round Table (18.1), suspicion board (7.8), conclave (6.5),
// status (5.0), mission (4.7) — and those are the show, not padding. A density
// control may not touch them: an episode that skips its Round Table cards is
// not a shorter episode of this show, it is a broken one.
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
// Which is why each level carries TWO numbers. `factor` is the budget knob the
// engine turns. `effective` is the multiplier the castle ACTUALLY produced
// when the season was played and the cards were counted, and it is the one the
// estimator uses — because an author is owed the measured length, not the
// requested one. Compact shows the same gap in the other direction (asks 0.45,
// delivers 0.62) via the one-scene floor and fair-share rounding.
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
    effective: 0.62,
    blurb: 'Leaner castle days. The night itself is untouched — breakfast, the '
      + 'mission, the table and the murder all still run in full — but the '
      + 'small scenes around them are cut back. About a tenth shorter.',
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
    effective: 1.19,
    blurb: 'As much of the day as the castle can actually produce. Adds only '
      + 'about 8% — on most nights the pool of scenes that could plausibly '
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
// Linear in cast size, fitted to the measurement at the top of this file.
// Both lines are close to 0.85 cards per extra player, which is what you would
// expect: a bigger castle means more people for a scene to be about AND more
// names on every board the spine already draws.
//
//   fixed(size)      = 51.0 + 0.84 * size     10 -> 59.4  14 -> 62.8  18 -> 66.1
//   castleFull(size) = 13.0 + 0.85 * size     10 -> 21.5  14 -> 24.9  18 -> 28.3
//
// The spread is the measured p10/p90 ratio against the mean (0.54 / 1.18 at
// cast 18). It is wide because early episodes are genuinely short — episode
// one has no Round Table and no private strategy to scramble over — so a
// single "typical" number quoted alone would overstate the front of a season.
const FIXED_BASE = 51.0, FIXED_PER_HEAD = 0.84;
const CASTLE_BASE = 13.0, CASTLE_PER_HEAD = 0.85;
const P10_RATIO = 0.54, P90_RATIO = 1.18;

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
  return {
    typical: Math.round(typical),
    low: Math.round(typical * P10_RATIO),
    high: Math.round(typical * P90_RATIO),
    castle: Math.round(castle),
    fixed: Math.round(fixed),
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
