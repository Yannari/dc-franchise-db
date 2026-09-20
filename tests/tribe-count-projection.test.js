// ══════════════════════════════════════════════════════════════════════
// tribe-count-projection.test.js — how many tribes a NIGHT has
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "I made a tribe expansion from 2 to 3 and it still thinks I have
// 2 teams" — Multi-Tribal and Double Tribal stayed greyed out with
// "⚠️ needs 3+ tribes" on every episode after the expansion, and the
// randomizer refused to place them.
//
// `seasonConfig.teams` is how many tribes the season STARTED with. A season
// changes it: a Tribe Expansion makes a third, a Tribe Dissolve folds one back
// in, and the merge ends tribes altogether. Every scheduling gate read the
// opening number — while the engines themselves (twists.js) read
// `gs.tribes.length` and would have run the twist perfectly well. The UI was
// refusing a twist the simulator was ready to play.
//
// So the projection carries the tribe count per episode the way it already
// carries "N left", and the gates read the night rather than the season.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { buildEpisodeMap } from '../js/run-ui.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Owen', 'Gwen', 'Heather', 'Duncan', 'Izzy', 'Noah', 'Bridgette', 'Geoff',
  'Leshawna', 'Harold', 'Courtney', 'Trent', 'Lindsay', 'Tyler', 'Beth', 'Cody', 'Eva', 'DJ'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'floater'][i % 4],
}));

function season(twists = [], cfg = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  // run-ui.js reads these as bare globals
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  delete seasonConfig.format;
  Object.assign(seasonConfig, { teams: 2, finaleSize: 3, mergeAt: 10, ...cfg });
  seasonConfig.twistSchedule = twists;
}

afterAll(() => { seasonConfig.twistSchedule = []; seasonConfig.teams = 2; delete seasonConfig.format; });
beforeEach(() => season());

const tribesAt = (map, ep) => map.find(e => e.ep === ep)?.tribes;

describe('the projected tribe count', () => {
  it('starts at the authored number', () => {
    const map = buildEpisodeMap();
    expect(tribesAt(map, 1)).toBe(2);
    expect(tribesAt(map, 2)).toBe(2);
  });

  it('counts a booked Tribe Expansion from its own episode on', () => {
    season([{ episode: 3, type: 'tribe-expansion' }]);
    const map = buildEpisodeMap();
    expect(tribesAt(map, 2)).toBe(2);
    // the twist fires before the challenge, so its own night already has three
    expect(tribesAt(map, 3)).toBe(3);
    expect(tribesAt(map, 4)).toBe(3);
  });

  it('counts a Tribe Dissolve back down, never below two', () => {
    season([{ episode: 2, type: 'tribe-expansion' }, { episode: 4, type: 'tribe-dissolve' },
      { episode: 5, type: 'tribe-dissolve' }]);
    const map = buildEpisodeMap();
    expect(tribesAt(map, 3)).toBe(3);
    expect(tribesAt(map, 4)).toBe(2);
    expect(tribesAt(map, 5)).toBe(2);
  });

  it('believes the season over the schedule once the expansion has actually run', () => {
    // nothing booked: the expansion happened in play, and gs carries three tribes
    season();
    gs.episode = 4;
    gs.tribes = [{ name: 'Bass', members: [] }, { name: 'Gophers', members: [] }, { name: 'Maggots', members: [] }];
    const map = buildEpisodeMap();
    expect(tribesAt(map, 4)).toBe(3);
    expect(tribesAt(map, 5)).toBe(3);
    gs.tribes = [];
  });

  it('reports one tribe after the merge', () => {
    const map = buildEpisodeMap();
    const post = map.find(e => e.phase === 'post-merge');
    expect(post?.tribes).toBe(1);
  });

  it('sizes a Multi-Tribal night by the tribes it actually has', () => {
    // FOUR tribes, deliberately: the winner is safe and the other three each vote, so three
    // go home. Two expansions, because at three tribes the old code's floor of 2 gave the
    // right answer for the wrong reason — a test that passes against the bug is no test.
    season([{ episode: 2, type: 'tribe-expansion' }, { episode: 3, type: 'tribe-expansion' },
      { episode: 4, type: 'multi-tribal' }]);
    const map = buildEpisodeMap();
    expect(tribesAt(map, 4)).toBe(4);
    const before = map.find(e => e.ep === 4).active;
    const after = map.find(e => e.ep === 5).active;
    expect(before - after).toBe(3);
  });
});
