// Every competition should explain its own result.
//
// The Debug tab's Competitions panel reads two levers off each houseguest's
// breakdown — `statTotal ?? base` for aptitude and `randomRoll ?? roll` for
// luck — so a surprising winner can be accounted for. A competition that
// reports neither renders blank rows, and house-visibility's "shows every lever
// behind a competition score" then passes or fails on which competition the
// week happened to draw, which is how this went unnoticed.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

// KNOWN GAP, recorded rather than hidden: the six signature competitions in
// bb-comps/signature.js were written before this contract existed and report
// their own structures (rounds, strikes, times) but neither lever. They are
// listed here so the panel's coverage is explicit and the exemption has to be
// deleted deliberately rather than forgotten. Everything else must report both.
const NO_LEVERS_YET = new Set([
  'bb-sig-otev', 'bb-sig-the-wall', 'bb-sig-pressure-cooker',
  'bb-sig-hide-and-go-veto', 'bb-sig-bb-comics', 'bb-sig-before-or-after',
]);

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((name, i) =>
  ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const HOUSE = CAST.map(p => p.name);
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('the debug panel can explain every competition', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {};
    seasonConfig.romance = 'off';
    HOUSE.forEach(n => {
      gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
        timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    });
  });

  it('reports aptitude and luck for every houseguest who played', () => {
    const missing = new Set();
    for (const comp of BB_COMPETITIONS) {
      if (NO_LEVERS_YET.has(comp.id)) continue;
      const type = comp.types.includes('hoh') ? 'hoh' : comp.types[0];
      for (const seed of [31, 88]) {
        const result = runBBCompetition({
          type, participants: HOUSE.slice(0, 8), house: HOUSE, library: BB_COMPETITIONS,
          forcedId: comp.id, rng: seededRng(seed), week: { num: 4, houseAtStart: HOUSE },
        });
        for (const [name, row] of Object.entries(result.debug.scoreBreakdown)) {
          const aptitude = row.statTotal ?? row.base;
          const luck = row.randomRoll ?? row.roll;
          if (!Number.isFinite(aptitude)) missing.add(`${comp.id}: no aptitude for ${name}`);
          if (!Number.isFinite(luck)) missing.add(`${comp.id}: no luck for ${name}`);
        }
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('the exemption list only names competitions that really are missing them', () => {
    // Stops the list rotting into a permanent excuse: once a signature
    // competition starts reporting its levers, this fails until it is removed.
    const stillMissing = [];
    for (const id of NO_LEVERS_YET) {
      const comp = BB_COMPETITIONS.find(c => c.id === id);
      expect(comp, `${id} is exempted but no longer exists`).toBeTruthy();
      const type = comp.types.includes('hoh') ? 'hoh' : comp.types[0];
      const result = runBBCompetition({
        type, participants: HOUSE.slice(0, 8), house: HOUSE, library: BB_COMPETITIONS,
        forcedId: id, rng: seededRng(12), week: { num: 4, houseAtStart: HOUSE },
      });
      const rows = Object.values(result.debug.scoreBreakdown);
      const reports = rows.length > 0
        && rows.every(r => Number.isFinite(r.statTotal ?? r.base) && Number.isFinite(r.randomRoll ?? r.roll));
      if (!reports) stillMissing.push(id);
    }
    expect(stillMissing.sort(), 'a listed competition now reports its levers — drop it from NO_LEVERS_YET')
      .toEqual([...NO_LEVERS_YET].sort());
  });
});
