// No competition may be a foregone conclusion.
//
// Stats are meant to be proportional, not decisive — the house should be able
// to lose a competition it was favoured in. This measures the property that
// actually matters: across many runs of the same competition with the same
// cast, how many different houseguests end up winning it, and how much of the
// time the single most successful one takes it.
//
// It caught a real one. Slippery Slope is a race to fill a container, and
// additive progress is deterministic by construction: the per-trip luck
// averages out over eight trips while the carry advantage applies on every one
// of them. Three houseguests won all sixty competitions and the best of them
// took 60%. Widening the noise and flattening the slip chance changed nothing,
// because the problem was the shape of the race rather than its numbers — it
// took adding the grab (the ball still has to come out of the container, and
// it can be lost) to give the field a way back in.
//
// The thresholds are a floor, not a target. Most competitions sit well clear.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

// A lumpy cast, not a ladder. An evenly-stepped stat gradient exaggerates
// determinism badly — measured on one, Bowlerina looked like it had collapsed
// to four winners in sixty when on a realistic roster it was mid-pack.
const varied = seed => {
  let x = seed;
  const r = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
  return Object.fromEntries(STAT_KEYS.map(k => [k, 1 + Math.floor(r() * 10)]));
};
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: varied(i * 977 + 41) }));
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const RUNS = 40;
const FIELD = 8;
const MIN_DISTINCT_WINNERS = 4;   // of eight playing
const MAX_SHARE_FOR_ONE = 0.62;   // nobody owns a competition outright

describe('competitions stay winnable by more than one person', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {};
    seasonConfig.romance = 'off';
    NAMES.forEach(n => {
      gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
        timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    });
  });

  // Every slot, not just the HOH one.
  //
  // This measured `types.includes('hoh')` and nothing else, which left the
  // veto-only competitions and the entire arena library — a third of the
  // catalogue — never checked. Measured when the gap was found: the two
  // tightest competitions in the whole game are both arena games, and one of
  // them was sitting two points under a threshold it was not being held to.
  const SLOTS = ['hoh', 'veto', 'arena'];

  for (const slot of SLOTS) {
    it(`every ${slot.toUpperCase()} competition spreads its wins`, () => {
      const failures = [];
      const pool = BB_COMPETITIONS.filter(c => c.types.includes(slot)
        // A competition playable in several slots is measured once, in the
        // first slot it declares, rather than three times over.
        && SLOTS.find(s => c.types.includes(s)) === slot);
      expect(pool.length, `no competitions declare the ${slot} slot`).toBeGreaterThan(0);
      for (const comp of pool) {
        const wins = new Map();
        for (let i = 0; i < RUNS; i++) {
          const result = runBBCompetition({
            type: slot, participants: NAMES.slice(0, FIELD), house: NAMES,
            library: BB_COMPETITIONS, forcedId: comp.id, rng: seededRng(i * 401 + 9),
            week: { num: 5, houseAtStart: NAMES },
            // The arena and veto games read a block; without one they either
            // refuse to run or run a different shape than they do in a season.
            nominees: ['G', 'H'], hoh: 'A',
          });
          wins.set(result.winner, (wins.get(result.winner) || 0) + 1);
        }
        const share = Math.max(...wins.values()) / RUNS;
        if (wins.size < MIN_DISTINCT_WINNERS || share > MAX_SHARE_FOR_ONE) {
          failures.push(`${comp.id}: ${wins.size} winners, top takes ${Math.round(share * 100)}%`);
        }
      }
      expect(failures, failures.join(' | ')).toEqual([]);
    });
  }
});
