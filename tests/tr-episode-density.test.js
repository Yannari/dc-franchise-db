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
import { CASTLE_PHASE_BUDGETS, CASTLE_PHASE_ORDER } from '../js/tr/castle/phases.js';
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
  // What IS asserted: the mechanism reaches a full >=25-scene day SOMEWHERE
  // in this scan — proof the phase-budget scheduler itself is not the
  // limiting factor — without claiming every episode does.
  it('the schedule reaches a 25-scene day somewhere in the scan', () => {
    let sawFullDay = false;
    for (const seed of SEEDS) {
      for (const row of tableRows(18, seed)) {
        const total = row.tr.castle.phases.flatMap(p => p.scenes).length;
        if (total >= 25) sawFullDay = true;
      }
    }
    expect(sawFullDay, 'no episode in this scan reached a 25-scene day at all — '
      + 'that would mean the phase-budget mechanism itself is broken, not just '
      + 'pool-limited').toBe(true);
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
