// Ready, Set, Woah has to be finishable.
//
// The calls used to be an independent coin flip each, and a played week drew a
// sheet with two GOs in it — both early. Everything after call three was WOAH,
// so a false start from that point could never be run off, and five of seven
// houseguests finished on exactly zero metres. The screen showed five
// identical cards, the placements between them were meaningless, and the
// narration told each of them they had spent the rest of the competition
// making the ground back up when there had been nothing left to make.
//
// The sheet is now dealt: four GO, three WOAH, shuffled, last call always GO.
// That last constraint is the one that matters — every WOAH has at least one
// run to the line after it, so being sent back is a cost rather than an
// ending. These are the properties that keep it that way.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle', 'Axel', 'Zee'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const play = seed => runBBCompetition({
  type: 'hoh', participants: NAMES, house: NAMES, library: BB_COMPETITIONS,
  forcedId: 'bb-classic-ready-set-woah', rng: seededRng(seed), week: { num: 2, houseAtStart: NAMES },
});
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 977 + 13);

describe('Ready, Set, Woah deals a sheet that can be run', () => {
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

  it('always calls four GO and three WOAH, and ends on a GO', () => {
    for (const seed of SEEDS) {
      const rows = Object.values(play(seed).debug.scoreBreakdown);
      for (const row of rows) {
        const words = row.calls.map(c => c.word);
        expect(words.filter(w => w === 'GO').length, `seed ${seed}: wrong number of GOs`).toBe(4);
        expect(words.filter(w => w === 'WOAH').length, `seed ${seed}: wrong number of WOAHs`).toBe(3);
        expect(words.at(-1), `seed ${seed}: the sheet does not end on a run to the line`).toBe('GO');
      }
      // And every houseguest is reading the same sheet.
      const sheets = rows.map(r => r.calls.map(c => c.word).join(''));
      expect(new Set(sheets).size, `seed ${seed}: houseguests got different calls`).toBe(1);
    }
  });

  it('nobody is left on nothing, however late they are sent back', () => {
    const stranded = [];
    for (const seed of SEEDS) {
      for (const [name, row] of Object.entries(play(seed).debug.scoreBreakdown)) {
        if (Math.round(row.ground) === 0) stranded.push(`seed ${seed}: ${name}`);
      }
    }
    expect(stranded, `finished on zero metres: ${stranded.slice(0, 5).join(', ')}`).toEqual([]);
  });

  it('a false start still costs, so the sheet is not just a footrace', () => {
    // The fix must not have made being sent back free. Across the sample,
    // houseguests who false-started should finish behind those who did not.
    let clean = 0, cleanTotal = 0, burned = 0, burnedTotal = 0;
    for (const seed of SEEDS) {
      for (const row of Object.values(play(seed).debug.scoreBreakdown)) {
        if (row.falseStarts > 0) { burned += row.ground; burnedTotal++; }
        else { clean += row.ground; cleanTotal++; }
      }
    }
    expect(burnedTotal, 'nobody ever false-started — the check is not testing anything')
      .toBeGreaterThan(0);
    expect(cleanTotal, 'nobody ever kept a clean sheet').toBeGreaterThan(0);
    expect(clean / cleanTotal, 'a false start cost nothing')
      .toBeGreaterThan(burned / burnedTotal);
  });

  it('the winner is never somebody who was sent back more than the runner-up', () => {
    // Ground is the score, but a tie on ground has to break toward whoever
    // kept their feet rather than array order.
    for (const seed of SEEDS) {
      const res = play(seed);
      const rows = res.debug.scoreBreakdown;
      const [first, second] = res.placements;
      const a = rows[first], b = rows[second];
      // Raw ground, not rounded: two houseguests a tenth of a metre apart are
      // not tied, and the tiebreak has no business firing between them.
      if (Math.abs(a.ground - b.ground) < 0.005) {
        expect(a.falseStarts, `seed ${seed}: tie on ground broke the wrong way`)
          .toBeLessThanOrEqual(b.falseStarts);
      }
    }
  });
});
