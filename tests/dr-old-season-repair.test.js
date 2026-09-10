// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-old-season-repair.test.js — a season played before the freeze
// existed can still be re-run
// ══════════════════════════════════════════════════════════════════════
//
// Reported from the live site: ↺ would not re-run an already-simulated drag
// episode, and a challenge chosen in the timeline dropdown did nothing. The
// season was started on 09-09.
//
// Neither is a bug in the button. Both features work by freezing the aired
// weeks, which needs `gs._drSchedule` — recorded since `1c1ad969`, on main
// 09-09 13:34 — and a rebuild that starts from the bond state the first play
// started from, which needs `gs._drInitBonds`, on main 09-10 08:51. A season
// begun before those has neither, and both gates correctly refuse rather than
// replay a different season underneath a history that has already aired.
//
// Restarting the season was the only other answer, and it is not one.
//
// WHAT MAKES THE REPAIR SAFE IS THAT NOTHING IS INVENTED: the initial bonds
// come out of checkpoint 1, which is the state saved BEFORE episode one ran,
// and the schedule comes out of the episodes themselves.
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const DRAG = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

describe('a drag season from before the freeze', () => {
  let dr;

  /** Play `n` episodes the way the Run tab does — checkpoint, then simulate. */
  const play = n => {
    for (let i = 0; i < n; i++) {
      const cpNum = (core.gs.episodeHistory?.length || 0) + 1;
      core.gsCheckpoints[cpNum] = core.snapshotGs();
      dr.simulateDragEpisode();
    }
  };

  /** Strip the two fields a season started on 09-09 would not have. */
  const age = () => {
    delete core.gs._drSchedule;
    delete core.gs._drInitBonds;
    delete core.gs._drInitLean;
  };

  beforeEach(async () => {
    core.setPlayers(CAST.map(p => ({ ...p })));
    core.setSeasonConfig({
      ...core.defaultConfig(), format: 'drag-race', seasonNumber: 1,
      drFinale: 'top4', drSchedule: [], twistSchedule: [],
    });
    core.setGs({
      episodeHistory: [], eliminated: [], popularity: {}, phase: 'stage', _drSeed: 4711,
      /* SEEDED BONDS, because a real season has them and the repair reads
         them off checkpoint 1. The first version of this fixture had none, so
         `cp1.bonds` was undefined, the repair skipped, and the test that
         compared `_drInitBonds` to `cp1.bonds` compared undefined to undefined
         and passed without either existing. */
      bonds: { 'Q1||Q2': 2.5, 'Q3||Q4': -1.5, 'Q5||Q6': 4 },
      bondLean: { 'Q1||Q2': 0.5 },
      /* AND THE SNAPSHOT A SEASON STARTED TODAY WOULD CARRY. initGameState
         writes these; this fixture does not call it, so without them every
         season here would look old and the "already froze properly" case
         could not be modelled at all. `age()` removes them again. */
      _drInitBonds: { 'Q1||Q2': 2.5, 'Q3||Q4': -1.5, 'Q5||Q6': 4 },
      _drInitLean: { 'Q1||Q2': 0.5 },
    });
    for (const k of Object.keys(core.gsCheckpoints)) delete core.gsCheckpoints[k];
    dr = await import('../js/dr-run.js');
  });

  it('is a season that could not freeze — the condition reported', () => {
    /* THE CONTROL ARM. Without it every assertion below would pass on a season
       that never had the problem.
       It does NOT call `rerunDragEpisode`: that repairs before it decides now,
       so it is no longer able to observe the broken state. The gate it
       consults is the honest thing to assert. */
    play(3);
    age();
    expect(dr.dragScheduleRecorded()).toBe(false);
    expect(dr.dragQueueEditable()).toBe(false);
  });

  it('takes its initial bonds from checkpoint 1, not from a recomputation', () => {
    play(3);
    // Episodes move bonds, so the live state is no longer the state the season
    // began from. That difference is the entire point of reading checkpoint 1.
    expect(JSON.stringify(core.gs.bonds))
      .not.toBe(JSON.stringify(core.gsCheckpoints[1].bonds));
    age();
    dr.repairOldDragSeason();
    // Byte-identical to what was saved before episode one ran...
    expect(JSON.stringify(core.gs._drInitBonds))
      .toBe(JSON.stringify(core.gsCheckpoints[1].bonds));
    // ...and that is a real bond table, not two undefineds agreeing.
    expect(Object.keys(core.gs._drInitBonds).length).toBeGreaterThan(0);
    expect(core.gs._drInitBonds['Q1||Q2']).toBe(2.5);
  });

  it('rebuilds the schedule from the episodes that aired', () => {
    play(4);
    const ran = core.gs.episodeHistory.map(r => r.dr.challenge.id);
    age();
    const done = dr.repairOldDragSeason();
    expect(done).toEqual({ bonds: true, schedule: true });
    expect(core.gs._drSchedule.map(r => r.maxiId)).toEqual(ran);
    expect(core.gs._drSchedule.map(r => r.episode))
      .toEqual(core.gs.episodeHistory.map(r => r.num));
  });

  it('lets the re-run and the dropdown work afterwards', () => {
    play(4);
    age();
    expect(dr.rerunDragEpisode(3), 'the re-run still refuses after the repair').toBe(true);
    expect(core.gs._drReroll).toEqual({ from: 3, nonce: 1 });
    expect(dr.dragScheduleRecorded()).toBe(true);
  });

  it('leaves the episodes that already aired exactly where they were', () => {
    // The whole worry: a repair must not cost an episode.
    play(4);
    const before = core.gs.episodeHistory.map(r =>
      JSON.stringify({ n: r.num, c: r.dr.challenge.id, out: r.exits.map(x => x.name) }));
    age();
    dr.repairOldDragSeason();
    const after = core.gs.episodeHistory.map(r =>
      JSON.stringify({ n: r.num, c: r.dr.challenge.id, out: r.exits.map(x => x.name) }));
    expect(after).toEqual(before);
    expect(core.gs.episodeHistory.length).toBe(4);
  });

  it('does nothing to a season that already froze properly', () => {
    play(3);
    const schedBefore = JSON.stringify(core.gs._drSchedule);
    const bondsBefore = JSON.stringify(core.gs._drInitBonds);
    expect(dr.repairOldDragSeason()).toEqual({ bonds: false, schedule: false });
    expect(JSON.stringify(core.gs._drSchedule)).toBe(schedBefore);
    expect(JSON.stringify(core.gs._drInitBonds)).toBe(bondsBefore);
  });

  it('declines rather than half-writing when checkpoint 1 is gone', () => {
    /* An older save, or one whose early checkpoints were pruned.
       A HALF REPAIR IS WORSE THAN NONE. The schedule alone satisfies
       `dragScheduleRecorded()`, so the re-run would go ahead and replay the
       season on top of bonds it had already written — §11.5 O, re-created by
       the thing meant to fix it. Caught by tests/dr-rebook.test.js, whose two
       "refuses a season whose running order was never recorded" cases went
       green-to-red the moment the repair wrote a schedule it could not back
       with bonds. */
    play(3);
    age();
    delete core.gsCheckpoints[1];
    expect(dr.repairOldDragSeason()).toEqual({ bonds: false, schedule: false });
    expect(core.gs._drSchedule).toBeUndefined();
    // And the season is left exactly as refusing as it was.
    expect(dr.dragScheduleRecorded()).toBe(false);
    expect(dr.rerunDragEpisode(2)).toBe(false);
  });
});
