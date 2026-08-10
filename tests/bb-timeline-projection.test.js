// The timeline has to count the same evictions the engine performs.
//
// buildEpisodeMap projects "N left" for every episode before a season is
// played, and its list of twists that remove more than one person was entirely
// Total Drama: double-elim, tied-destinies, ambassadors, emissary-vote,
// multi-tribal. Not one Big Brother twist was in it, so the designer assumed a
// house evicts exactly one houseguest a week whatever was scheduled.
//
// Reported on a Split House week showing 16 left going to 15. Two houseguests
// leave that night — one from each side — and the error does not stay local:
// every episode after it is off by one for the rest of the season, which moves
// the projected jury open and the finale.
//
// The season-shape panel (houseStructure in bb-run.js) already counted both.
// Only the timeline was wrong, which is why it survived this long.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { buildEpisodeMap } from '../js/run-ui.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn', 'Ennui', 'Sky'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function season(twists = [], cfg = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  // run-ui.js reads these as bare globals, the catalogue included.
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', ...cfg });
  seasonConfig.twistSchedule = twists;
}

// This file leaves a Big Brother season standing in shared module state, and
// vitest reuses a worker across files — so a Total Drama test running after it
// inherited format:'big-brother', a twist schedule and a three-nominee mode,
// and failed for reasons that had nothing to do with itself.
afterAll(() => {
  seasonConfig.twistSchedule = [];
  seasonConfig.bbSafetyMode = 'off';
  seasonConfig.bbHaveNots = 'off';
  delete seasonConfig.format;
});

/** How many the projection says leave in this episode. */
const dropAt = (map, epNum) => {
  const here = map.find(e => e.ep === epNum);
  const next = map.find(e => e.ep === epNum + 1);
  if (!here || !next) return null;
  return here.active - next.active;
};

describe('a week that evicts two is projected as evicting two', () => {
  beforeEach(() => season());

  it('counts the Split House as a double', () => {
    season([{ id: 't1', episode: 2, type: 'bb-split-house' }]);
    const map = buildEpisodeMap();
    expect(dropAt(map, 2), 'a Split House week projected only one eviction').toBe(2);
    // ...and an ordinary week beside it still takes one.
    expect(dropAt(map, 1)).toBe(1);
  });

  it('counts a double eviction as a double', () => {
    // Same bug, same list, never reported because nobody had checked it.
    season([{ id: 't1', episode: 3, type: 'bb-double-eviction' }]);
    const map = buildEpisodeMap();
    expect(dropAt(map, 3)).toBe(2);
  });

  it('does not lose the extra body for the rest of the season', () => {
    // The real damage: an off-by-one at episode two moves every count after
    // it, so the projected finale sits a week late all season.
    const plain = (season(), buildEpisodeMap());
    season([{ id: 't1', episode: 2, type: 'bb-split-house' }]);
    const split = buildEpisodeMap();
    expect(split.length, 'a double eviction did not shorten the season')
      .toBeLessThan(plain.length);
  });
});

describe('and a week that stands down is projected as standing down', () => {
  it('does not promise a double the engine will refuse to run', () => {
    // splitPossible in bb-run.js needs ten houseguests — two sides of five,
    // each with an HOH, two nominees and somebody left to vote. Below that the
    // week runs as an ordinary one, and promising two would be wrong in the
    // other direction.
    season([{ id: 't1', episode: 9, type: 'bb-split-house' }]);
    const map = buildEpisodeMap();
    const at = map.find(e => e.ep === 9);
    expect(at, 'the season is too short to reach that episode').toBeTruthy();
    expect(at.active, 'this test needs a house already under ten').toBeLessThan(10);
    expect(dropAt(map, 9), 'projected a double the engine would stand down')
      .toBe(1);
  });

  it('stands down beside a second cycle, the way the engine does', () => {
    season([
      { id: 't1', episode: 2, type: 'bb-split-house' },
      { id: 't2', episode: 2, type: 'bb-double-eviction' },
    ]);
    // The double still takes two; the split is refused rather than stacking.
    expect(dropAt(buildEpisodeMap(), 2)).toBe(2);
  });

  it('stands down under a three-nominee mode', () => {
    season([{ id: 't1', episode: 2, type: 'bb-split-house' }], { bbSafetyMode: 'block-buster' });
    expect(dropAt(buildEpisodeMap(), 2)).toBe(1);
  });
});

// A house ends at three, whatever the slider says.
//
// `houseFinaleSize()` in bb-run.js returns 3 unconditionally — the last night
// is a three-part Head of Household played from three, and the week engine
// refuses a house of fewer than four. The projection read
// `seasonConfig.finaleSize` instead, and that key SURVIVES a format change, so
// a season carrying a final two from a camp season drew one week too many:
// a phantom eviction from three, and a finale starting from two. Reported off
// a screenshot showing "Ep 16 · 3 LEFT" followed by the finale.
describe('the house always ends at a final three', () => {
  const finaleOf = map => map[map.length - 1];

  it('ignores a configured final two', () => {
    season([], { finaleSize: 2 });
    const map = buildEpisodeMap();
    expect(finaleOf(map).active, 'the finale runs from three').toBe(3);
  });

  it('projects the same season whatever the slider says', () => {
    season([], { finaleSize: 2 });
    const two = buildEpisodeMap().map(e => `${e.ep}:${e.active}`);
    season([], { finaleSize: 3 });
    const three = buildEpisodeMap().map(e => `${e.ep}:${e.active}`);
    expect(two).toEqual(three);
  });

  it('leaves the last playable week with four in the house', () => {
    season([], { finaleSize: 2 });
    const map = buildEpisodeMap();
    expect(map[map.length - 2].active, 'the week before the finale plays from four').toBe(4);
  });

  it('still honours the slider for a camp season', () => {
    season([], { finaleSize: 2 });
    seasonConfig.format = 'total-drama';
    expect(finaleOf(buildEpisodeMap()).active).toBe(2);
  });
});
