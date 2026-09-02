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
// RE-BASELINED AFTER TASK 7 (fix round 1, I1). The paragraph that stood here
// described a world that no longer exists — "Task 7 (the ~210-event library) is
// not built yet", "a mean around 8-12", "a single boundary-exact hit". Task 7
// shipped, the library is 128 events, and a standard 18-person table episode
// now averages 27.4 castle scenes. The comment at the foot of the old arm said
// in as many words that whoever landed Task 7 should expect to re-baseline
// this file; that is what this is.
//
// WHY IT MATTERED THAT IT WAS STALE. The only shipped assertion touching the
// 25-scene number was `sawFullDay` — "at least one episode in this scan
// touched 25". It passed at a mean of 12.8 and it passes at 27.4, so a
// regression of THIRTEEN SCENES AN EPISODE, which is the whole of what Task 7
// bought, would have left this file green. The largest deliverable in the task
// had no assertion behind it.
//
// WHAT IS ASSERTED NOW is the MEAN over the scan, plus the SHARE of episodes
// that clear 25 — not a per-episode floor, because a per-episode floor would
// be red on arrival and would be lying about the distribution. The numbers are
// in the arm below.
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
  // ── THE DISTRIBUTION, MEASURED, BEFORE ANY BAND IS SET ───────────────
  //
  // 14 seeds x an 18-person cast, table episodes only, ENDGAME ROUNDS
  // EXCLUDED. The exclusion is not tidying: an endgame round runs no mission,
  // so it has two fewer windows by construction and is a different animal from
  // a standard episode, which is what the 25-scene number is about. Both
  // populations are printed by the reporting arm below so the choice is
  // visible rather than assumed.
  //
  //     n=94   min 0   p10 24   median 30   mean 27.39   max 37
  //     episodes at or above 25: 87.2%
  //
  // THREE THINGS THAT FOLLOW, and the third is why this is not a per-episode
  // floor:
  //
  //   1. THE MEAN IS THE DELIVERABLE. Task 7's target was >=25 scenes an
  //      episode and it lands at 27.4. Banding the mean at 24 puts a real
  //      number under the task's largest claim: a regression of the size Task
  //      7's `runWindow` fix is worth (~5 scenes) leaves it green, and a
  //      regression of the size Task 7 itself is worth (~13) does not.
  //   2. THE SHARE IS BANDED TOO, because a mean can be held up by a long
  //      right tail while most episodes are thin. 87.2% of episodes clear 25;
  //      the band is 60%, which is well clear of today and would redden on a
  //      distribution that had gone bimodal.
  //   3. THERE IS NO PER-EPISODE FLOOR, ON PURPOSE. 12.8% of episodes are
  //      below 25 and the tenth percentile is 24, so a naive per-episode
  //      `>= 25` would be red the day it was written. Some of those are the
  //      last rounds of a season with six people left in the castle, which is
  //      a smaller building with less going on in it and SHOULD produce fewer
  //      scenes. Asserting what is true is the whole point; asserting what
  //      sounds strongest is how a file ends up with `sawFullDay` in it.
  function standardEpisodeCounts(castSize = 18) {
    const counts = [];
    for (const seed of SEEDS) {
      for (const row of tableRows(castSize, seed)) {
        if (row.tr.endgame) continue;
        counts.push(row.tr.castle.phases.flatMap(p => p.scenes).length);
      }
    }
    return counts.sort((a, b) => a - b);
  }

  it('a standard episode averages the scene count the task was built to deliver', () => {
    const counts = standardEpisodeCounts(18);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    const atLeast25 = counts.filter(n => n >= 25).length / counts.length;
    console.log(`\n[tr-episode-density] 18-cast standard episodes: n=${counts.length} `
      + `min=${counts[0]} p10=${counts[Math.floor(counts.length * 0.1)]} `
      + `median=${counts[Math.floor(counts.length / 2)]} mean=${mean.toFixed(2)} `
      + `max=${counts[counts.length - 1]} at-or-above-25=${(atLeast25 * 100).toFixed(1)}%`);

    // ANTI-VACUITY: the scan has to have found episodes to measure.
    expect(counts.length, 'no standard table episodes were measured at all')
      .toBeGreaterThan(60);
    expect(mean, `the castle averages ${mean.toFixed(2)} scenes a standard episode, against `
      + 'the 27.4 Task 7 delivered — this is the assertion that number never had')
      .toBeGreaterThan(24);
    expect(atLeast25, `only ${(atLeast25 * 100).toFixed(1)}% of standard episodes reach 25 `
      + 'scenes — the mean is being held up by a tail rather than by the body')
      .toBeGreaterThan(0.6);
  });

  it('and the scheduler is not structurally capped below the band', () => {
    // WHAT `sawFullDay` USED TO BE, kept because the claim is still worth
    // making and is now made about the top of the distribution rather than
    // about a single boundary-exact hit. If the maximum a season can produce
    // collapses, the mean band above may still pass for a while on a narrowed
    // distribution; this catches the ceiling falling on its own.
    const counts = standardEpisodeCounts(18);
    expect(counts[counts.length - 1], 'the busiest episode in the whole scan is under 30 '
      + 'scenes — the scheduler, not the pool, has become the limit')
      .toBeGreaterThanOrEqual(30);
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
