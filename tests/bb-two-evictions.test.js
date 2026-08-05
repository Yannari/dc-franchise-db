// A night that removes two houseguests has to remove two everywhere.
//
// Reported from a played season: a Split House evicted two, and the second one
// had no interview, did not appear in the episode history, was missing from the
// season hub card, and never showed up in the season timeline — so the house
// count went 16 -> 15 on a night that took two people out, and every number
// downstream was wrong from then on.
//
// One root cause under all of it: getEpisodeEliminations() knew every Total
// Drama shape for a double elimination (multi-tribal, ambassador, tied
// destinies, emissary) and none of Big Brother's. Everything that reports who
// left is built on that helper.
//
// This holds all four surfaces at once, for BOTH twists that remove two.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseStructure } from '../js/bb-run.js';
import { getEpisodeEliminations, buildHubAftermath } from '../js/run-ui.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', bbEvictionInterview: 'enabled' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

/** Play until the twist actually produced two evictions. */
function playTwo(twist) {
  for (let seed = 1; seed <= 16; seed++) {
    house([twist]);
    const ep = withSeededRandom(seed * 53 + 7, () => simulateBBEpisode());
    if (ep?.eliminated && ep?.alsoEliminated) return ep;
  }
  return null;
}

for (const twist of ['bb-split-house', 'bb-double-eviction']) {
  describe(`${twist} removes two houseguests`, () => {
    beforeEach(() => house([twist]));

    it('reports both of them everywhere who-left is asked', () => {
      const ep = playTwo(twist);
      expect(ep, `no ${twist} week produced two evictions`).toBeTruthy();
      const both = [ep.eliminated, ep.alsoEliminated];

      // The shared collector — the hub card, the episode trail and the season
      // timeline all read this.
      const named = getEpisodeEliminations(ep);
      expect(named, 'the collector lost an evictee').toEqual(expect.arrayContaining(both));
      expect(named).toHaveLength(2);

      // The hub's aftermath card, which draws an avatar per name.
      const hub = buildHubAftermath(ep);
      expect(hub.eliminatedLabel, 'the hub card names only one').toContain(ep.eliminated);
      expect(hub.eliminatedLabel).toContain(ep.alsoEliminated);
    });

    it('sits both of them in the interview chair', () => {
      const ep = playTwo(twist);
      expect(ep, `no ${twist} week produced two evictions`).toBeTruthy();
      expect(ep.evictionInterview, 'the first evictee was not interviewed').toBeTruthy();
      expect(ep.secondEvictionInterview, 'the second evictee walked past the chair').toBeTruthy();
      expect(ep.evictionInterview.evictee).toBe(ep.eliminated);
      expect(ep.secondEvictionInterview.evictee).toBe(ep.alsoEliminated);

      // And the transcript carries both, not one.
      const text = generateSummaryText(ep);
      expect(text).toMatch(/THE EVICTEE INTERVIEW/);
      expect(text).toMatch(/THE SECOND EVICTEE INTERVIEW/);
      expect(text).toContain(ep.alsoEliminated);
    });

    it('takes two out of the house, not one', () => {
      const ep = playTwo(twist);
      expect(ep, `no ${twist} week produced two evictions`).toBeTruthy();
      const started = (ep.houseAtStart || []).length;
      const left = getEpisodeEliminations(ep).length;
      expect(left, 'the night removed one').toBe(2);
      expect((gs.activePlayers || []).length,
        'the roster does not match a two-eviction night').toBe(started - 2);
      for (const name of [ep.eliminated, ep.alsoEliminated]) {
        expect(gs.activePlayers, `${name} is still in the house`).not.toContain(name);
        expect(gs.eliminated, `${name} is not on the eliminated list`).toContain(name);
      }
    });
  });
}

describe('the projected season', () => {
  it('counts a Split House as a night that removes two', () => {
    // Sixteen cast, one scheduled split: the season is a week shorter than the
    // same season without it, exactly like a double eviction.
    const plain = houseStructure({ jurySize: 7, twistSchedule: [] }, 16);
    const split = houseStructure({ jurySize: 7,
      twistSchedule: [{ episode: 3, type: 'bb-split-house' }] }, 16);
    const weeksOf = segs => Number(String(segs[1].label).match(/^(\d+)/)?.[1] ?? -1);
    expect(weeksOf(split), 'the split did not shorten the projection')
      .toBe(weeksOf(plain) - 1);
    expect(split[1].label).toMatch(/split/i);
  });
});
