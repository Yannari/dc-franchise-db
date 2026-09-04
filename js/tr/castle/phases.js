// ══════════════════════════════════════════════════════════════════════
// tr/castle/phases.js — the day, spent in six chronological beats
// ══════════════════════════════════════════════════════════════════════
//
// Before this file, a castle round drew ONE flat 4-8 total (`startRoundBudget`
// in events.js) and spread it fair-share across all seven `runWindow` calls
// a round makes. That produced a day, but not a SCHEDULE: nothing said a
// standard episode should read as breakfast, then the day, then the mission's
// wake, then the maneuvering before a table, then the maneuvering right after
// one, then the night — every window drew from the same undifferentiated pot.
//
// Design §2.1's regular-episode spine names eight chronological beats. Two of
// them — the mission itself and its briefing/travel — are NOT castle scenes;
// they are their own engine (js/tr/missions.js) and their own card budget.
// The other six are exactly the phases below, and they are what this file
// schedules: each phase draws ITS OWN scene-count budget from ITS OWN range,
// independent of every other phase, and spends it fair-share across the
// existing per-window event pool (js/tr/events.js) that phase owns.
//
// WHY TWO WINDOWS SHARE A PHASE. `journey-out` — getting out the door for the
// mission — is bundled into `morning-life` rather than given its own phase.
// The mission runs BETWEEN `journey-out` and `journey-back`
// (js/tr/headless.js), and giving `journey-out` its own phase would force a
// choice between breaking that bracket (running the whole phase, both
// windows, before the mission ever starts) or splitting one phase's budget
// across two call sites. Folding it into the phase that immediately precedes
// it avoids both: `morning-life`'s single `runCastlePhase` call still finishes
// before the mission runs, exactly where `journey-out`'s own `runWindow` call
// used to sit.
import { runWindow, startBudget } from '../events.js';
import { seasonConfig } from '../../core.js';
import { densityFactor, scaledRange, TR_DENSITY_DEFAULT } from '../../tr-density.js';

/**
 * The six phases a Castle Day is scheduled from, IN THE ORDER THE DAY RUNS
 * THEM. `windows` names the `runWindow` window ids (js/tr/events.js's
 * `KNOWN_WINDOWS`) that phase draws its scenes from — the underlying event
 * pool, its preconditions and its cooldowns are unchanged; only the budget
 * that decides HOW MANY scenes each stretch of the day gets is new.
 *
 * STARTING RANGES, not final ones. These are Task 5's Step 3 starting point
 * (3-5, 5-8, 4-6, 6-9, 4-7, 2-4) — retuning them is Task 12's job, once
 * Task 6's VP and Task 7's ~210-event library make a full episode's card
 * count actually measurable end to end. See task-5-report.md for the
 * arithmetic this leaves open.
 */
export const CASTLE_PHASE_BUDGETS = [
  { id: 'breakfast-fallout', label: 'Breakfast Fallout',
    min: 3, max: 5, windows: ['dawn'] },
  { id: 'morning-life', label: 'Morning Castle Life',
    min: 5, max: 8, windows: ['morning', 'journey-out'] },
  { id: 'mission-fallout', label: 'Mission Fallout',
    min: 4, max: 6, windows: ['journey-back'] },
  { id: 'private-strategy', label: 'Private Strategy',
    min: 6, max: 9, windows: ['evening'] },
  { id: 'roundtable-scramble', label: 'Round Table Scramble',
    min: 4, max: 7, windows: ['after-table'] },
  { id: 'post-banishment', label: 'Post-Banishment',
    min: 2, max: 4, windows: ['night'] },
];

/** The six ids, in chronological order — the shape every episode's `ep.tr.castle.phases` walks. */
export const CASTLE_PHASE_ORDER = CASTLE_PHASE_BUDGETS.map(p => p.id);

const _byId = new Map(CASTLE_PHASE_BUDGETS.map(p => [p.id, p]));

/**
 * `runWindow` window id -> owning phase id, the reverse of the table above.
 * `_castleRecord` (js/tr/headless.js) uses this to bucket the flat, already-
 * fired `castleEvents` array back into phases for the record — it does NOT
 * need headless.js to track phase boundaries structurally, because every
 * fired scene already carries the window it fired in (`f.event.window`).
 */
export const WINDOW_TO_PHASE = Object.freeze(
  CASTLE_PHASE_BUDGETS.reduce((out, p) => {
    for (const w of p.windows) out[w] = p.id;
    return out;
  }, {})
);

/**
 * Run one Castle Day phase: draw its own scene-count budget from its own
 * `[min, max]` range (replacing the old flat 4-8-per-round total for exactly
 * the window(s) this phase owns) and spend it fair-share across them via the
 * existing `runWindow` mechanism. Returns the fired scenes in the same shape
 * `runWindow` already returns — headless.js concatenates them onto the
 * round's flat `castle`/`castleEvents` array exactly as it always has, so the
 * murder/table/night order contract downstream of a window is untouched.
 *
 * `rng` MUST be the castle layer's own stream (`_castleRngFor` in
 * headless.js), never the game's rng — see that function's doc comment for
 * why a content change must never perturb a murder, ballot or mission draw.
 */
export function runCastlePhase(phase, ep, rng) {
  const def = _byId.get(phase);
  if (!def) throw new Error(`runCastlePhase: unknown phase "${phase}"`);
  // THE AUTHOR'S EPISODE LENGTH, applied to the RANGE and not to the result.
  //
  // `scaledRange` returns its arguments untouched at factor 1, and this is
  // still exactly ONE draw at every density -- which is the whole of the rng
  // contract here. The castle stream is shared with nothing, but it is
  // reproducible from the season seed, so a density that added or skipped a
  // draw would re-roll every castle day downstream of the first phase that
  // used it. A default season is therefore bit-identical to the code that had
  // no density setting at all; tests/tr-density-controls.test.js asserts it
  // rather than trusting this comment.
  const [lo, hi] = scaledRange(def.min, def.max,
    densityFactor(seasonConfig?.trDensity || TR_DENSITY_DEFAULT));
  const count = lo + Math.floor(rng() * (hi - lo + 1));
  startBudget(count, def.windows.length);
  const fired = [];
  for (const w of def.windows) fired.push(...runWindow(w, ep, rng));
  return fired;
}

/**
 * The record shape Task 6's screens read: all six phases, ALWAYS, in
 * chronological order, each carrying whatever scenes actually fired for it
 * this episode.
 *
 * A phase with nothing in it still appears, WITH AN EMPTY `scenes` ARRAY —
 * unlike the older per-window record (`DAY_WINDOWS` filtering in
 * `_castleRecord`), which drops a silent window outright. Episode one has no
 * Round Table, so `private-strategy` and `roundtable-scramble` never fire —
 * campaigning for, or reacting to, a table that isn't happening — and would
 * be the two entries missing from a five-entry list. A screen that walks six
 * phases in order needs the shape to be there on the one night two of them
 * are empty; dropping them would be the exact "the shape is missing where I
 * need it" bug the older record already tolerates for windows.
 *
 * Takes the ALREADY-BUILT per-scene records (`_castleRecord`'s `scenes`,
 * each carrying `.window`) rather than the raw `fired` array, so this is a
 * pure regrouping with no access to `gs` and no thread/citation logic of its
 * own to drift from `_castleRecord`'s.
 */
export function castlePhaseRecord(scenes) {
  const byPhase = new Map(CASTLE_PHASE_ORDER.map(id => [id, []]));
  // FALLBACK BUCKETS, KEYED BY WINDOW, FOR ANYTHING NOT IN `WINDOW_TO_PHASE`.
  // Mirrors the guard the sibling `windows` list already carries in
  // `_castleRecord` (js/tr/headless.js): "Anything the pool ever grows that
  // is not one of the seven would otherwise vanish silently." Every window
  // in `KNOWN_WINDOWS` maps to a phase today, so this is inert now — but
  // Task 7 adds ~110 events, and an author registering a scene under a new
  // window without also updating `WINDOW_TO_PHASE` must not have it
  // disappear with nothing to show for it.
  const overflow = new Map();
  for (const s of (scenes || [])) {
    const phaseId = WINDOW_TO_PHASE[s.window];
    if (phaseId && byPhase.has(phaseId)) {
      byPhase.get(phaseId).push(s);
      continue;
    }
    const key = s.window || '(unknown window)';
    if (!overflow.has(key)) overflow.set(key, []);
    overflow.get(key).push(s);
  }
  const known = CASTLE_PHASE_ORDER.map(id => ({ id, label: _byId.get(id).label, scenes: byPhase.get(id) }));
  // Appended AFTER the six known phases, never in place of one — a caller
  // asserting the exact six ids on a normal day sees no difference, and a
  // caller that walks the whole array still finds the orphaned scenes rather
  // than losing them.
  const unmapped = [...overflow.entries()].map(([window, sc]) =>
    ({ id: `unmapped:${window}`, label: `Unmapped window: ${window}`, scenes: sc }));
  return [...known, ...unmapped];
}
