// ══════════════════════════════════════════════════════════════════════
// twist-schedule-is-not-scratch-space.test.js — simulating is not authoring
// ══════════════════════════════════════════════════════════════════════
//
// Reported with two screenshots of the same Format Designer, before and after
// simulating one episode: a Reward Challenge appeared on the episode just
// played, episode 4 emptied out, and every later twist slid down one.
//
// TWO writers, both editing `seasonConfig.twistSchedule` — the author's plan,
// the thing the designer draws and localStorage keeps:
//
//   1. the auto reward challenge was PUSHED onto it every episode
//   2. an Elimination Swap added one to the `episode` of every later entry,
//      and saved the result back to localStorage
//
// The second is the slide. It is a real fact — a cancelled elimination inserts
// a blank night, so everything after it does run a night later — but storing
// it in the plan meant the plan changed under the author, permanently, and
// again on the next swap.
//
// It is derived now. `gs.skippedEliminationEps` already recorded every skip;
// `authoredEpisode()` turns a played night into the authored one, and returns
// null for an inserted blank so the night after a swap does not re-fire the
// swap's own twists.
import { describe, it, expect } from 'vitest';
import { core, runOneSeason, makeCast, seededRun } from './helpers/season-harness.js';
import { authoredEpisode } from '../js/core.js';

const SCHEDULE = [
  { episode: 3, type: 'elimination-swap', id: 'swap' },
  { episode: 5, type: 'million-bucks-bc', id: 'mb' },
  { episode: 7, type: 'tribe-expansion', id: 'te' },
];

function playWithSwap() {
  return seededRun(() => {
    runOneSeason({
      twistSchedule: JSON.parse(JSON.stringify(SCHEDULE)),
      autoRewardChallenges: true, foodWater: 'enabled',
    }, 16, makeCast(16));
    return {
      schedule: (core.seasonConfig.twistSchedule || []).map(t => ({ ...t })),
      skipped: [...(core.gs.skippedEliminationEps || [])],
      rows: (core.gs.episodeHistory || []).map(e => ({
        num: e.num, swap: !!e.swapResult, chal: e.challengeType || null })),
    };
  });
}

describe('a played season leaves the written one alone', () => {
  const run = playWithSwap();

  it('the swap actually happened, or this proves nothing', () => {
    expect(run.skipped, 'no elimination was skipped — the arm is vacuous')
      .toContain(3);
    expect(run.rows.some(r => r.swap)).toBe(true);
  });

  it('the schedule is exactly what was written', () => {
    expect(run.schedule.map(t => ({ episode: t.episode, type: t.type })))
      .toEqual(SCHEDULE.map(t => ({ episode: t.episode, type: t.type })));
  });

  it('grew no entries nobody placed', () => {
    // The auto reward used to be pushed on for every episode played.
    expect(run.schedule).toHaveLength(SCHEDULE.length);
    expect(run.schedule.some(t => t.type === 'reward-challenge')).toBe(false);
  });

  it('still runs the later twists on the nights the slide puts them', () => {
    // The behaviour must not change — only where the slide is stored. With a
    // blank inserted after episode 3, the authored episode 5 runs on the
    // sixth night.
    const mb = run.rows.find(r => r.chal === 'million-bucks-bc');
    expect(mb, 'the scheduled challenge never fired').toBeTruthy();
    expect(mb.num, 'the twist did not land after the inserted blank').toBe(6);
  });
});

describe('authoredEpisode', () => {
  const g = { skippedEliminationEps: [3] };

  it('is the identity before anything is skipped', () => {
    expect(authoredEpisode(2, { skippedEliminationEps: [] })).toBe(2);
    expect(authoredEpisode(9, {})).toBe(9);
  });

  it('leaves the nights up to and including the skip alone', () => {
    expect(authoredEpisode(3, g)).toBe(3);
  });

  it('calls the inserted night a blank', () => {
    // Without this the episode after a swap re-fires the swap's own twists.
    expect(authoredEpisode(4, g)).toBeNull();
  });

  it('slides everything after it by one', () => {
    expect(authoredEpisode(5, g)).toBe(4);
    expect(authoredEpisode(6, g)).toBe(5);
    expect(authoredEpisode(8, g)).toBe(7);
  });

  it('stacks for two swaps', () => {
    const two = { skippedEliminationEps: [3, 7] };
    expect(authoredEpisode(8, two)).toBeNull();       // the second blank
    expect(authoredEpisode(9, two)).toBe(7);
    expect(authoredEpisode(12, two)).toBe(10);
  });
});
