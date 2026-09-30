// ci-run.test.js — the Circle is REACHABLE from the run tab (Plan 4 Task 1).
// Every guard here is on the path the run tab takes: the flag, the queue, a
// reload, a re-run, and what gets saved.
import { describe, expect, it } from 'vitest';
import { gs, setGs, players, setPlayers, seasonConfig, formatIsRunnable } from '../js/core.js';
import { isCircleSeason, simulateCircleEpisode, circleEpisodesLeft, circleCastProblem, lastCircleRefusal,
  circleCanRerun, rerunCircleEpisode, circleSeasonShape, circleBookings } from '../js/ci-run.js';
import { makePlayers } from './helpers/ci-cast.js';

function freshSeason(n = 13, extra = {}) {
  Object.assign(seasonConfig, { format: 'the-circle', seasonNumber: 1, ciSetup: {}, ciPool: [], twistSchedule: [], ...extra });
  setPlayers(makePlayers(n, 5));
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ci: { seed: 505 } });
}
function playAll() {
  const aired = [];
  for (let i = 0; i < 30; i++) { const row = simulateCircleEpisode(); if (!row) break; aired.push(row); }
  return aired;
}

describe('the Circle can be started', () => {
  it('importing ci-run IS the wiring: the flag is set and the show reads as runnable', () => {
    expect(window._ciRunnable).toBe(true);
    expect(formatIsRunnable({ format: 'the-circle' })).toBe(true);
    freshSeason();
    expect(isCircleSeason()).toBe(true);
  });

  it('refuses a cast too small for its finalists, and says why', () => {
    freshSeason(5);
    expect(circleCastProblem()).toMatch(/more players than finalists/);
    expect(simulateCircleEpisode()).toBe(null);
    expect(lastCircleRefusal()).toMatch(/finalists/);
  });
});

import { DEFAULT_POOL } from '../js/ci/default-pool.js';
describe('a season nobody wrote a pool for', () => {
  const catfishNames = rows => new Set(rows.flatMap(r => Object.values(r.ci.profiles || {}))
    .filter(p => p.mode === 'catfish').map(p => p.name));
  it('plays the default Catfish Pool, so some players still hide behind a persona', () => {
    freshSeason(13, { ciPool: undefined });
    const names = catfishNames(playAll());
    expect(names.size).toBeGreaterThan(0);
    const handles = new Set(DEFAULT_POOL.map(p => p.handle));
    for (const n of names) expect(handles.has(n), n).toBe(true);
  });
  it('an author who emptied the pool gets a season with no catfish', () => {
    freshSeason(13, { ciPool: [] });
    expect(catfishNames(playAll()).size).toBe(0);
  });
});

describe('the season options', () => {
  it('plays the Days asked for; a number too small for the cast is raised to the fewest it needs', () => {
    freshSeason(13, { ciDays: 1 });
    const fewest = circleSeasonShape().length;
    expect(fewest).toBeGreaterThanOrEqual(10);
    for (const ciDays of [8, 12, 20, 30]) {
      freshSeason(13, { ciDays });
      const want = Math.max(ciDays, fewest);
      expect(circleSeasonShape().length, `ciDays ${ciDays}`).toBe(want);
      expect(playAll(), `ciDays ${ciDays}`).toHaveLength(want);
      expect(gs.activePlayers.length).toBe(5);
    }
  });

  it('four finalists end the season on four', () => {
    freshSeason(13, { ciFinalists: 4 });
    playAll();
    expect(gs.activePlayers.length).toBe(4);
  });
});

describe('a season plays one episode per press', () => {
  it('airs every day of the schedule, then stops, and names the winner', () => {
    freshSeason();
    const days = circleSeasonShape().length;
    const aired = playAll();
    expect(aired).toHaveLength(days);
    expect(aired.map(r => r.num)).toEqual(aired.map((_, i) => i + 1));
    expect(circleEpisodesLeft()).toBe(0);
    expect(gs.phase).toBe('complete');
    expect(gs.ciWinners.length).toBeGreaterThan(0);
    // what is saved is rows, never the engine's state
    expect(JSON.stringify(gs).length).toBeLessThan(6_000_000);
    expect(gs.ci.state).toBeUndefined();
  });

  it('a queue lost to a reload rebuilds the SAME season and keeps what aired', () => {
    freshSeason();
    const first = [simulateCircleEpisode(), simulateCircleEpisode(), simulateCircleEpisode()];
    delete gs._ciQueue;
    const next = simulateCircleEpisode();
    expect(next.num).toBe(4);
    freshSeason();
    const whole = playAll();
    expect(JSON.stringify(whole[3].ci.blocked)).toBe(JSON.stringify(next.ci.blocked));
    expect(first.map(r => r.num)).toEqual([1, 2, 3]);
  });
});

import { buildSeasonHubModel } from '../js/run-ui.js';
describe('reviewing an earlier episode', () => {
  it('the hub shows who was in AFTER that episode, not who is in now', () => {
    freshSeason();
    const aired = playAll();
    const two = aired[1];
    const model = buildSeasonHubModel(gs, seasonConfig, players, 2);
    expect(model.isHistorical).toBe(true);
    expect(model.remaining).toBe(two.ci.people.length);
    expect(model.remaining).not.toBe(gs.activePlayers.length);
  });
});

describe('re-running an episode', () => {
  it('keeps every earlier episode and deals the chosen one again', () => {
    freshSeason();
    const aired = playAll();
    expect(circleCanRerun()).toBe(true);
    const before = JSON.stringify(aired.slice(0, 3).map(r => r.ci.blocked));
    expect(rerunCircleEpisode(4)).toBe(true);
    expect(gs.episodeHistory.filter(r => r.format === 'the-circle').map(r => r.num)).toEqual([1, 2, 3]);
    const again = simulateCircleEpisode();
    expect(again.num).toBe(4);
    expect(JSON.stringify(gs.episodeHistory.slice(0, 3).map(r => r.ci.blocked))).toBe(before);
  });
});

describe('the Season Timeline books by episode', () => {
  it('a Circle card booked on episode N books the slot day N is', () => {
    freshSeason();
    const day3 = circleSeasonShape().find(d => d.day === 3);
    seasonConfig.twistSchedule = [{ type: 'ci-sole-influencer', episode: 3 }, { type: 'some-other-show-twist', episode: 3 }];
    expect(circleBookings()).toEqual({ [day3.slot]: ['ci-sole-influencer'] });
  });
});

import { buildVPScreens } from '../js/vp-screens.js';
import { generateSummaryText } from '../js/text-backlog.js';
describe('an aired episode can be watched and read', () => {
  it('the VP shows every aired scene, and the text backlog says the same lines', () => {
    freshSeason();
    const [, row] = [simulateCircleEpisode(), simulateCircleEpisode()];
    const screens = buildVPScreens(row);
    const aired = row.ci.aired.filter(s => s.script?.blocks?.length).length;
    expect(screens.length).toBe(aired);
    expect(screens.every(s => s.html.includes('Episode 2'))).toBe(true);
    const text = generateSummaryText(row);
    // a line from the first screen appears in the backlog too
    const firstLine = screens[0].html.match(/class="ci-(?:say|msg)">([^<]+)</)?.[1]?.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    expect(text).toContain(firstLine.slice(0, 30));
  });
});
