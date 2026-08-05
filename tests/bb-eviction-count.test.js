// The houseguest with the most votes is the one who leaves.
//
// Reported from a real week: the block was Emmah, Hicks and Scary Girl, the
// vote was announced as 11-2-0, and EMMAH went home with two.
//
// The tally was right the whole time. The selection compared nominees[0]
// against nominees[1] and nothing else — correct for exactly as long as a
// block holds two people, and it has not for a long time. America's Nominee,
// Roadkill, the Den's curse and the Block Buster all seat a third chair, and
// on those weeks the third nominee's votes were never read: two beat the zero
// beside it, and the eleven was not in the comparison at all.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists;
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.namedAlliances = []; gs.jury = []; gs.episode = 0;
}
afterAll(() => { seasonConfig.twistSchedule = []; delete seasonConfig.format; });

/** Every week played, with its final block and its tally. */
function weeks(twists, seeds) {
  const out = [];
  for (const seed of seeds) {
    house(twists);
    withSeededRandom(seed, () => {
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 4) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        const w = gs.bb.weeks[gs.bb.weeks.length - 1];
        if (w && w.evicted && w.votes) out.push(w);
      }
    });
  }
  return out;
}

function checkAll(list) {
  let threeChair = 0;
  for (const w of list) {
    const noms = w.finalNominees || w.initialNominees || [];
    if (noms.length >= 3) threeChair++;
    const counts = noms.map(n => [n, Number(w.votes[n] || 0)]);
    const most = Math.max(...counts.map(([, v]) => v));
    const got = Number(w.votes[w.evicted] || 0);
    expect(got,
      `week ${w.num}: evicted ${w.evicted} on ${got} votes when the block was ${
        counts.map(([n, v]) => `${n} ${v}`).join(', ')}`)
      .toBe(most);
  }
  return threeChair;
}

describe('the vote decides who leaves', () => {
  it('evicts the top of a two-chair block', () => {
    const list = weeks([], [3, 11, 27, 42]);
    expect(list.length, 'no weeks played').toBeGreaterThan(3);
    checkAll(list);
  });

  it('reads the THIRD chair too — America\u2019s Nominee', () => {
    const list = weeks([{ id: 't1', episode: 2, type: 'bb-americas-nominee' }],
      [3, 11, 27, 42, 58, 77]);
    const three = checkAll(list);
    expect(three, 'no three-chair week ever ran, so this proves nothing')
      .toBeGreaterThan(0);
  });

  it('reads it on a Roadkill week as well', () => {
    const list = weeks([{ id: 't1', episode: 2, type: 'bb-roadkill' }],
      [5, 19, 33, 64, 91]);
    const three = checkAll(list);
    expect(three, 'no three-chair week ever ran').toBeGreaterThan(0);
  });

  it('never evicts somebody who was not on the block', () => {
    for (const w of weeks([{ id: 't1', episode: 2, type: 'bb-americas-nominee' }], [7, 23, 51])) {
      const noms = w.finalNominees || w.initialNominees || [];
      expect(noms, `week ${w.num}: evicted ${w.evicted}, who was not nominated`)
        .toContain(w.evicted);
    }
  });
});
