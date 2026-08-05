// Pinning the arena.
//
// Every Big Brother week has an HOH competition and a veto competition, and the
// Season Timeline has always let you book both. The arena — the Block Buster's
// game, the one three nominees play with the whole house at the glass — was the
// slot nobody could book, so the entire arena library came up at random and only
// at random. Eighteen written games, and a season being authored could choose
// the competition that hands out power but not the one somebody's game ends on.
//
// The engine was never the problem: week.js has always read
// `forcedCompetitions.arena`. The resolver simply never put it there.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { bbCompetitionsForSlot, bbForcedCompsForWeek, simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'block-buster' });
  seasonConfig.twistSchedule = [];
  seasonConfig.bbCompSchedule = [];
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.namedAlliances = []; gs.jury = []; gs.episode = 0;
}
afterAll(() => {
  seasonConfig.bbCompSchedule = []; seasonConfig.twistSchedule = [];
  delete seasonConfig.format; delete seasonConfig.bbSafetyMode;
});

describe('the arena has a list to pick from', () => {
  beforeEach(() => house());

  it('offers the arena library, On Tilt included', () => {
    const list = bbCompetitionsForSlot('arena');
    expect(list.length, 'the arena slot offered nothing at all').toBeGreaterThan(8);
    expect(list.map(c => c.id)).toContain('bb-arena-on-tilt');
    expect(list.find(c => c.id === 'bb-arena-on-tilt').name).toBe('On Tilt');
  });

  it('keeps the three slots separate, because they are', () => {
    // An arena game is played by the nominees with the house watching. Nothing
    // in it serves an HOH or a veto ceremony, and the picker must not pretend
    // otherwise — that filter is what stops a week the dispatcher would refuse.
    const arena = new Set(bbCompetitionsForSlot('arena').map(c => c.id));
    const hoh = new Set(bbCompetitionsForSlot('hoh').map(c => c.id));
    expect(hoh.has('bb-arena-on-tilt'), 'On Tilt was offered as an HOH comp').toBe(false);
    expect(arena.has('bb-arena-on-tilt')).toBe(true);
  });
});

describe('and a pin that survives the trip to the engine', () => {
  beforeEach(() => house());

  it('passes the arena through, which it never used to', () => {
    seasonConfig.bbCompSchedule = [{ episode: 2, arena: 'bb-arena-on-tilt' }];
    const forced = bbForcedCompsForWeek(2);
    expect(forced, 'the arena pin was dropped on the way to the engine').toBeTruthy();
    expect(forced.arena).toBe('bb-arena-on-tilt');
  });

  it('leaves no residue when every picker on a week is cleared', () => {
    expect(bbForcedCompsForWeek(9)).toBeUndefined();
    seasonConfig.bbCompSchedule = [{ episode: 9 }];
    expect(bbForcedCompsForWeek(9), 'an empty entry pinned something').toBeUndefined();
  });

  it('actually runs the pinned game in the arena', () => {
    seasonConfig.bbCompSchedule = [{ episode: 1, arena: 'bb-arena-on-tilt' }];
    let staged = null;
    for (let seed = 1; seed <= 12 && !staged; seed++) {
      house();
      seasonConfig.bbCompSchedule = [{ episode: 1, arena: 'bb-arena-on-tilt' }];
      const ep = withSeededRandom(seed * 5, () => simulateBBEpisode());
      const arena = (ep.acts || []).find(a => a.competition?.variant === 'ontilt');
      if (arena) staged = arena;
    }
    expect(staged, 'the arena was pinned to On Tilt and never staged it').toBeTruthy();
    expect(staged.competition.placements.length).toBeGreaterThan(1);
  });
});
