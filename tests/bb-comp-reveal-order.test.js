// A competition reveals worst first.
//
// The scored competitions sort their field best-first because the placements
// are read off that order, and both of them then narrated in the same order —
// so the very first card handed the viewer the winning score and every card
// after it was a countdown to nothing. The generic competition board already
// counts up from last place for exactly this reason.
//
// This asserts the run cards climb: worst card first, winner last.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// id, the field on the breakdown that decides the result, and which way is better.
const SCORED = [
  ['bb-physical-precision', 'total', (a, b) => a >= b],   // more points is better
  ['bb-mental-memory', 'time', (a, b) => a <= b],         // less time is better
];

describe('scored competitions build to the winner', () => {
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

  for (const [id, key, isBetter] of SCORED) {
    it(`${id}: run cards climb, and the winner is last`, () => {
      for (const seed of [5, 23, 61]) {
        const comp = runBBCompetition({
          type: 'hoh', participants: NAMES, house: NAMES, library: BB_COMPETITIONS,
          forcedId: id, rng: seededRng(seed), week: { num: 4, houseAtStart: NAMES },
        });
        const bd = comp.debug.scoreBreakdown;

        // One card per houseguest: a beat about exactly one player who has a
        // record. Multi-player beats are the opening and the margin, which are
        // not run cards — counting them made an earlier draft of this test
        // report the wrong first card.
        const order = [];
        for (const b of comp.beats) {
          const who = (b.players || []);
          if (who.length !== 1) continue;
          if (b.badgeClass === 'gold') continue;
          const name = who[0];
          if (bd[name] && !order.includes(name)) order.push(name);
        }
        const where = `${id}/seed ${seed}`;
        expect(order.length, `${where}: no run cards`).toBeGreaterThan(2);
        expect(order[0], `${where}: winner revealed first`).not.toBe(comp.winner);
        expect(order[order.length - 1], `${where}: winner not revealed last`).toBe(comp.winner);

        // And it climbs the whole way, allowing for ties.
        const values = order.map(n => bd[n][key]);
        for (let i = 1; i < values.length; i++) {
          expect(isBetter(values[i], values[i - 1]),
            `${where}: card ${i + 1} (${order[i]}=${values[i]}) is worse than card ${i} (${order[i - 1]}=${values[i - 1]})`)
            .toBe(true);
        }
      }
    });
  }
});
