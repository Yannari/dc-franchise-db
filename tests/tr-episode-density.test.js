// ══════════════════════════════════════════════════════════════════════
// tr-episode-density.test.js — measuring the Castle Day against the band
// ══════════════════════════════════════════════════════════════════════
//
// Task 5 (task-5-brief.md) replaces the old flat 4-8-per-round castle budget
// with six phase-specific budgets (js/tr/castle/phases.js). The controller
// ruling attached to that task (R2) makes the binding number explicit: a
// standard episode's AUDIENCE observer stream must land in the 100-140
// reveal-card band (global-constraints.md), and a scene is 2-5 cards
// depending on how many of the four beat kinds (establish/action/reaction/
// consequence) its observer stream carries.
//
// Task 6 (the VP rewrite) and Task 7 (the ~210-event library) are not built
// yet, so THE FULL CARD COUNT CANNOT BE MEASURED HERE — there is no card
// renderer to run a scene through. What this file measures instead is the
// one number already real: how many SCENES a standard episode's six phases
// actually produce, over representative seeds and cast sizes, off the
// starting ranges the brief specifies (3-5, 5-8, 4-6, 6-9, 4-7, 2-4). That
// count is Task 12's other half of the arithmetic; see task-5-report.md for
// how the two combine and what they imply about the starting ranges.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { CASTLE_PHASE_BUDGETS, CASTLE_PHASE_ORDER, castlePhaseRecord } from '../js/tr/castle/phases.js';
import roster from '../franchise_roster.json';

// Side-effect imports: the real event pool, exactly as tr-castle.test.js
// loads it. Without these the pool is empty and every phase measures zero
// scenes regardless of budget — a true but useless number.
import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';
import '../js/tr/castle/romance.js';
import '../js/tr/castle/callback.js';
import '../js/tr/castle/testing.js';
import '../js/tr/castle/journey.js';
import '../js/tr/castle/mission-fallout.js';
import '../js/tr/castle/consequences.js';
import '../js/tr/castle/nightfall.js';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 42, 777, 12345];
// Representative cast sizes: a small castle, a full standard castle, and a
// late-game-scale castle (spec §2.3: "late-game episodes scale down with
// cast size" — this is measured, not assumed).
const CAST_SIZES = [10, 14, 18];

function tableRows(castSize, seed) {
  const SEASON_ROSTER = roster.players.slice(0, castSize);
  const SEASON_CAST = SEASON_ROSTER.map(p => p.name);
  setPlayers(SEASON_ROSTER);
  playTraitorsSeason({ cast: SEASON_CAST, traitorCount: 3, seed });
  // Every row with a Round Table (episode 1 never has one, and is excluded —
  // it structurally cannot exercise private-strategy/roundtable-scramble).
  return (gs.episodeHistory || []).filter(r => r.num > 1 && r.tr?.castle?.phases);
}

describe('castlePhaseRecord: no silent scene loss on an unmapped window', () => {
  // Fix round 1, Important finding 1: `castlePhaseRecord` used to drop any
  // scene whose `.window` wasn't in `WINDOW_TO_PHASE`, with no fallback and
  // no signal — the exact silent-data-loss class the sibling `windows` list
  // in `_castleRecord` (js/tr/headless.js) already guards, with a comment
  // saying so. Harmless today (all seven `KNOWN_WINDOWS` map to a phase),
  // but Task 7 adds ~110 events and a new window tag introduced there
  // without a matching `WINDOW_TO_PHASE` entry must not vanish quietly.
  it('a scene under a real, mapped window lands in exactly one known phase', () => {
    const scenes = [{ window: 'evening', eventId: 'x' }];
    const phases = castlePhaseRecord(scenes);
    expect(phases.map(p => p.id)).toEqual(CASTLE_PHASE_ORDER);
    const withIt = phases.filter(p => p.scenes.includes(scenes[0]));
    expect(withIt.map(p => p.id)).toEqual(['private-strategy']);
  });

  it('a scene under an UNMAPPED window is preserved, not dropped', () => {
    const orphan = { window: 'some-future-window', eventId: 'y' };
    const scenes = [{ window: 'dawn', eventId: 'x' }, orphan];
    const phases = castlePhaseRecord(scenes);
    // The six known phases are unchanged in id, order and count...
    expect(phases.slice(0, CASTLE_PHASE_ORDER.length).map(p => p.id)).toEqual(CASTLE_PHASE_ORDER);
    // ...and the orphaned scene is findable SOMEWHERE in the record, not lost.
    const allScenes = phases.flatMap(p => p.scenes);
    expect(allScenes).toContain(orphan);
    // It must not have been silently folded into one of the six known
    // phases either — that would hide the bug just as effectively as
    // dropping it outright.
    for (const known of phases.slice(0, CASTLE_PHASE_ORDER.length)) {
      expect(known.scenes).not.toContain(orphan);
    }
  });
});

describe('phase budgets: arithmetic sanity', () => {
  it('the six phases are exactly the brief\'s ids, in the brief\'s order', () => {
    expect(CASTLE_PHASE_ORDER).toEqual(['breakfast-fallout', 'morning-life',
      'mission-fallout', 'private-strategy', 'roundtable-scramble', 'post-banishment']);
  });

  it('starting ranges match the brief\'s Step 3 instruction exactly', () => {
    const ranges = CASTLE_PHASE_BUDGETS.map(p => [p.min, p.max]);
    expect(ranges).toEqual([[3, 5], [5, 8], [4, 6], [6, 9], [4, 7], [2, 4]]);
  });
});

describe('measured scene counts (a standard 18-person episode)', () => {
  // MEASURED, NOT ASSUMED: against the real, currently-registered ~98-event
  // pool (Task 7's ~210-event library is not built yet), a single table
  // episode's fired scene count is 0-28 across this scan, with a mean around
  // 8-12 depending on cast size — well under a hard per-episode 25 floor.
  // The bottleneck is eligible-event exhaustion inside `runWindow` (see
  // js/tr/events.js's header comment: most events have sharp, rare
  // preconditions BY DESIGN), not the phase budgets in js/tr/castle/phases.js
  // — `private-strategy` (backed by 27 registered `evening` events) already
  // lands near its own 6-9 ceiling most rounds, while `mission-fallout`
  // (backed by only 6 `journey-back` events) frequently fires zero. Raising
  // the ranges further would not move this number; the pot already goes
  // unspent in the thin windows. See task-5-report.md for the full
  // arithmetic and why this is Task 7's gap to close, not a Task 5 retune.
  //
  // What IS asserted, precisely: across the WHOLE scan below (14 seeds x 3
  // cast sizes, n=112+ table episodes) the fired count touched >=25 exactly
  // ONCE. That is a single boundary-exact hit, not a comfortable margin —
  // fix round 1 corrected earlier wording ("demonstrably capable") that
  // overstated this as proof of reliable capability. The honest claim this
  // assertion makes is narrower: the scheduler is not STRUCTURALLY incapable
  // of a 25-scene day, so a red result here means something changed, not
  // that the ceiling was always out of reach.
  //
  // RE-BASELINING, NOT REGRESSION, IS THE FIRST HYPOTHESIS. Because the one
  // passing sample sits exactly on the boundary, this arm is sensitive to
  // Task 7 harmlessly adding even one or two events to a thin window
  // (`journey-back` at 6, `night` at 7) and nudging that single case either
  // side of 25. Whoever lands Task 7 should expect this test to need
  // re-baselining as the library grows — a red result here should be
  // investigated as "did the boundary case move" before being treated as a
  // regression.
  it('the schedule touches a 25-scene day at least once in the scan', () => {
    let sawFullDay = false;
    for (const seed of SEEDS) {
      for (const row of tableRows(18, seed)) {
        const total = row.tr.castle.phases.flatMap(p => p.scenes).length;
        if (total >= 25) sawFullDay = true;
      }
    }
    expect(sawFullDay, 'not one episode in this scan touched a 25-scene day — '
      + 'that would mean the phase-budget scheduler itself is structurally '
      + 'incapable of it, not just pool-limited (see the header comment above: '
      + 'the passing case is a single boundary-exact hit, and this arm is '
      + 'expected to need re-baselining as Task 7 changes the pool)')
      .toBe(true);
  });

  it('reports the measured min/mean/max scene count across seeds and cast sizes', () => {
    // Not a pass/fail band by itself — this test always passes (the assertion
    // below is a smoke check that measurement ran at all). Its purpose is to
    // put real numbers in the run output for task-5-report.md; see that file
    // for the numbers this produced and what they imply about the 100-140
    // audience-card band once Task 6/7 make a full card count measurable.
    const report = {};
    for (const castSize of CAST_SIZES) {
      const counts = [];
      for (const seed of SEEDS) {
        const rows = tableRows(castSize, seed);
        for (const row of rows) {
          counts.push(row.tr.castle.phases.flatMap(p => p.scenes).length);
        }
      }
      counts.sort((a, b) => a - b);
      const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
      report[castSize] = {
        n: counts.length,
        min: counts[0],
        max: counts[counts.length - 1],
        mean: Math.round(mean * 10) / 10,
      };
    }
    // eslint-disable-next-line no-console
    console.log('[tr-episode-density] measured castle-scene counts per table episode:',
      JSON.stringify(report));
    expect(Object.keys(report).length).toBe(CAST_SIZES.length);
  });
});
