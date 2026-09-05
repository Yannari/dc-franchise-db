// ══════════════════════════════════════════════════════════════════════
// twist-schedule-is-not-scratch-space.test.js — episode 4 is episode 4
// ══════════════════════════════════════════════════════════════════════
//
// Reported with two screenshots of the same Format Designer, before and after
// simulating one episode: a Reward Challenge appeared on the night just
// played, episode 4 emptied out, and every later twist slid down one. Then,
// after a first fix: "it's visually different but the system stays the same —
// episode 4 acts as empty and episode 5 acts with episode 4's twists."
//
// THREE THINGS WERE WRONG, all of them the same mistake in different clothes:
// treating the author's plan as somewhere to record what happened.
//
//   1. the auto reward challenge was PUSHED onto seasonConfig.twistSchedule
//      every episode played, so the plan grew cards nobody placed
//   2. an Elimination Swap added one to the `episode` of every later entry and
//      saved that to localStorage, so a twist written for 5 sat on 6, then 7
//   3. and the extra night a cancelled elimination costs was counted TWICE in
//      the projection — `elims = 0` already makes the loop take another turn,
//      and a second block pushed an empty episode on top of it
//
// The schedule is keyed by episode number and nothing shifts it. Whatever the
// author put on a night is what that night runs, however the ones before it
// turned out.
import { describe, it, expect } from 'vitest';
import { core, runOneSeason, makeCast, seededRun } from './helpers/season-harness.js';
import { buildEpisodeMap } from '../js/run-ui.js';

const SCHEDULE = [
  { episode: 3, type: 'elimination-swap', id: 'swap' },
  { episode: 4, type: 'million-bucks-bc', id: 'mb' },
  { episode: 6, type: 'tribe-expansion', id: 'te' },
];

const run = seededRun(() => {
  runOneSeason({
    twistSchedule: JSON.parse(JSON.stringify(SCHEDULE)),
    autoRewardChallenges: true, foodWater: 'enabled',
  }, 16, makeCast(16));
  globalThis.gs = core.gs;
  globalThis.players = core.players;
  globalThis.seasonConfig = core.seasonConfig;
  return {
    schedule: (core.seasonConfig.twistSchedule || []).map(t => ({ ...t })),
    skipped: [...(core.gs.skippedEliminationEps || [])],
    rows: (core.gs.episodeHistory || []).map(e => ({
      num: e.num, swap: !!e.swapResult, chal: e.challengeType || null,
      elim: e.eliminated || null })),
    timeline: buildEpisodeMap().slice(0, 8),
  };
});

describe('a season with a cancelled elimination', () => {
  it('actually cancelled one, or this proves nothing', () => {
    expect(run.skipped, 'no elimination was skipped — the arm is vacuous').toContain(3);
    expect(run.rows.find(r => r.num === 3)?.swap).toBe(true);
    expect(run.rows.find(r => r.num === 3)?.elim, 'somebody left the swap episode').toBeNull();
  });

  it('leaves the plan exactly as written', () => {
    expect(run.schedule.map(t => ({ episode: t.episode, type: t.type })))
      .toEqual(SCHEDULE.map(t => ({ episode: t.episode, type: t.type })));
  });

  it('grew no entries nobody placed', () => {
    expect(run.schedule).toHaveLength(SCHEDULE.length);
    expect(run.schedule.some(t => t.type === 'reward-challenge')).toBe(false);
  });

  it('runs episode 4 on episode 4', () => {
    // The whole report, in one assertion. The twist written for the night
    // after the swap runs on that night, not the one after it.
    const mb = run.rows.find(r => r.chal === 'million-bucks-bc');
    expect(mb, 'the scheduled challenge never fired').toBeTruthy();
    expect(mb.num, 'the twist slid past the episode it was written for').toBe(4);
  });

  it('draws the timeline the same way it runs it', () => {
    const byEp = Object.fromEntries(run.timeline.map(e => [e.ep, e.engineType || null]));
    expect(byEp[3]).toBe('elimination-swap');
    expect(byEp[4], 'the designer shows an empty night where a twist was placed')
      .toBe('million-bucks-bc');
    expect(byEp[6]).toBe('tribe-expansion');
  });

  it('counts the extra night once', () => {
    // The swap episode removes nobody, so the count holds across it — and does
    // so exactly once. Counting it twice is what inserted the empty episode.
    const at = n => run.timeline.find(e => e.ep === n)?.active;
    expect(at(4), 'the roster moved on an episode that eliminated nobody').toBe(at(3));
    expect(at(5), 'the extra night was counted twice').toBe(at(4) - 1);
  });
});
