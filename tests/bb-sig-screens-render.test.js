// Every themed competition screen actually renders.
//
// rpBuildBBComp wraps each themed builder in a try/catch and falls back to the
// generic board on error, which is the right behaviour and a terrible failure
// mode: a screen that throws looks exactly like a screen that was never
// written. A one-character mistake — a pair of backticks inside a stylesheet
// that is itself a template literal — silently ended the string, threw
// "av is not defined" on every build, and turned Before or After back into the
// plain board with nothing but a console warning to show for it.
//
// So this asserts the whole set: for each competition that has a themed screen,
// the screen renders, and the dispatcher never has to catch anything.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';
import { rpBuildBBComp, _tvState } from '../js/vp-screens.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Every competition that owns a themed screen, and the slots it can fill.
const THEMED = [
  'bb-sig-otev', 'bb-sig-the-wall', 'bb-sig-pressure-cooker',
  'bb-sig-hide-and-go-veto', 'bb-sig-bb-comics', 'bb-sig-before-or-after',
  'bb-mental-quiz', 'bb-mental-memory', 'bb-physical-precision',
  'bb-physical-slide', 'bb-mental-knockout',
];

describe('themed competition screens render', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {};
    seasonConfig.romance = 'off';
    NAMES.forEach(n => {
      gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
        timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    });
    Object.keys(_tvState).forEach(k => delete _tvState[k]);
  });

  for (const id of THEMED) {
    it(`${id}: themed in every slot it serves, at every stage of the reveal`, () => {
      const comp = BB_COMPETITIONS.find(c => c.id === id);
      expect(comp, `${id} is not in the library`).toBeTruthy();
      const slots = comp.types.filter(t => t === 'hoh' || t === 'veto');

      for (const slot of slots) {
        for (const size of [6, 8, 12]) {
          const result = runBBCompetition({
            type: slot, participants: NAMES.slice(0, size), house: NAMES,
            library: BB_COMPETITIONS, forcedId: id, rng: seededRng(size * 17 + 5),
            week: { num: 4, houseAtStart: NAMES },
          });
          const act = {
            type: slot, winner: result.winner,
            participants: result.participants,
            results: result.placements.map(n => ({ name: n, score: result.scores[n] })),
            competition: result,
          };
          const ep = { num: 4, acts: [act] };
          const where = `${id}/${slot}/${size}`;

          // The dispatcher swallows builder errors; catching the warning is
          // the only way to tell a broken screen from an absent one.
          const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
          try {
            const closed = rpBuildBBComp(ep, slot) || '';
            Object.keys(_tvState).filter(k => k.startsWith('bb_sig_'))
              .forEach(k => { _tvState[k].idx = 999; });
            const open = rpBuildBBComp(ep, slot) || '';

            expect(warn.mock.calls.map(c => String(c[0])), `${where}: builder threw`).toEqual([]);
            expect(closed.includes('bbc-what'), `${where}: generic before reveal`).toBe(false);
            expect(open.includes('bbc-what'), `${where}: generic after reveal`).toBe(false);
            expect(open.length, `${where}: suspiciously short`).toBeGreaterThan(2000);
            expect(open, `${where}: rendered undefined/NaN`).not.toMatch(/undefined|NaN|\[object Object\]/);
          } finally {
            warn.mockRestore();
          }
        }
      }
    });
  }
});
