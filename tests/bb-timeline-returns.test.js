// A returning houseguest is a houseguest.
//
// `buildEpisodeMap` projects how many players are left on each night, and its
// Big Brother section only ever ADDED evictions — double eviction takes two,
// Split House takes two. Both twists whose entire point is somebody coming BACK
// were invisible to it, so a Battle Back week showed 12 going to 11 when the
// eviction and the re-entry cancel out, and every week after it was off by one
// for the rest of the season.
//
// Exactly the fault the Split House had before it was fixed, running the other
// way: the season-shape panel counted it and the timeline never learned.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, relationships, seasonConfig, selectedEpisodes, seasonFormat,
  TWIST_CATALOG } from '../js/core.js';
import { ordinal, pronouns, pStats, romanticCompat } from '../js/players.js';
import { bKey, bondLabel, getBond, getPerceivedBond } from '../js/bonds.js';
import { buildEpisodeMap } from '../js/run-ui.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

/** A Big Brother season with the given twists scheduled. run-ui reads globals. */
function timeline(schedule = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG,
    seasonFormat, selectedEpisodes });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    mergeAt: 12, teams: 2, bbHaveNots: 'off', bbSafetyMode: 'off', ri: false });
  seasonConfig.twistSchedule = schedule.map((t, i) => ({ id: `t${i}`, ...t }));
  return buildEpisodeMap();
}

beforeEach(() => { seasonConfig.twistSchedule = []; });

// This file leaves a Big Brother season in shared module state, and vitest
// reuses a worker across files.
afterAll(() => { seasonConfig.twistSchedule = []; delete seasonConfig.format; });

describe('a week that sends somebody back is net zero', () => {
  it('does not shrink the house on a Battle Back week', () => {
    const plain = timeline([]);
    const back = timeline([{ episode: 3, type: 'bb-battle-back' }]);
    // Every week from the Battle Back onwards has one more player in it than
    // the same season without it.
    const at = n => (m => m.find(e => e.ep === n))(back);
    const plainAt = n => (m => m.find(e => e.ep === n))(plain);
    expect(at(4), 'the season ended before the twist could matter').toBeTruthy();
    expect(at(4).active - plainAt(4).active,
      'the returning houseguest was never counted').toBe(1);
  });

  it('runs the season one week longer, because somebody came back', () => {
    const plain = timeline([]);
    const back = timeline([{ episode: 3, type: 'bb-battle-back' }]);
    expect(back.length).toBe(plain.length + 1);
  });
});

describe('Camp Comeback returns when the camp fills, not when it opens', () => {
  it('adds nobody on the week the twist is announced', () => {
    const plain = timeline([]);
    const camp = timeline([{ episode: 2, type: 'bb-camp-comeback' }]);
    const at = (m, n) => m.find(e => e.ep === n);
    // Week 3 is one eviction into a four-eviction camp: nothing back yet.
    expect(at(camp, 3).active).toBe(at(plain, 3).active);
  });

  it('adds one once four have been evicted into it', () => {
    const plain = timeline([]);
    const camp = timeline([{ episode: 2, type: 'bb-camp-comeback' }]);
    const at = (m, n) => m.find(e => e.ep === n);
    // Campers are the next four evicted counting from week 2, so the fourth
    // arrives on week 5 and the return runs that same night.
    expect(at(camp, 6), 'the season is too short to reach the return').toBeTruthy();
    expect(at(camp, 6).active - at(plain, 6).active).toBe(1);
  });

  it('counts evictions rather than weeks, so a double eviction fills it early', () => {
    const slow = timeline([{ episode: 2, type: 'bb-camp-comeback' }]);
    const fast = timeline([
      { episode: 2, type: 'bb-camp-comeback' },
      { episode: 3, type: 'bb-double-eviction' },
    ]);
    // Measured against the SAME season without the camp, which is the only
    // probe that isolates the return: the first draft looked for the week the
    // projection stopped falling, and a double eviction drops by two, so the
    // shape it was watching for never appeared.
    const slowBase = timeline([]);
    const fastBase = timeline([{ episode: 3, type: 'bb-double-eviction' }]);
    const cameBack = (withCamp, without) => {
      for (const e of withCamp) {
        const other = without.find(o => o.ep === e.ep);
        if (other && e.active > other.active) return e.ep;
      }
      return null;
    };
    const slowWeek = cameBack(slow, slowBase);
    const fastWeek = cameBack(fast, fastBase);
    expect(slowWeek, 'the slow camp never returned anybody').toBeTruthy();
    expect(fastWeek, 'the fast camp never returned anybody').toBeTruthy();
    expect(fastWeek).toBeLessThan(slowWeek);
  });

  it('returns nobody when the camp never fills inside its four weeks', () => {
    // The twist runs for four weeks. A camp that has not taken four evictions
    // by then returns nobody, and projecting a return anyway would be wrong in
    // exactly the way this test exists to prevent.
    const plain = timeline([]);
    const stalled = timeline([
      { episode: 2, type: 'bb-camp-comeback' },
      { episode: 3, type: 'no-tribal' },
      { episode: 4, type: 'no-tribal' },
      { episode: 5, type: 'no-tribal' },
    ]);
    const tail = m => m[m.length - 1];
    // Same number of players standing at the end: nobody came back.
    expect(tail(stalled).active).toBe(tail(plain).active);
  });
});

describe('the eviction side still works', () => {
  it('has not stopped counting a double eviction as two', () => {
    const plain = timeline([]);
    const dbl = timeline([{ episode: 3, type: 'bb-double-eviction' }]);
    expect(dbl.length).toBe(plain.length - 1);
  });
});
