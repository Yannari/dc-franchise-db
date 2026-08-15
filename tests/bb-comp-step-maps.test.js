// A competition's per-player step map is a map on every single step.
//
// The rebuilt competitions each emit a `steps` array beside their beats, one
// step per beat, carrying a snapshot of where everybody stood at that moment:
// `placed` for the boards, `ground` for the track, `heats` for the platforms.
// The screens read nothing else — the whole instrument is drawn from it.
//
// Each competition builds those steps through a small `say()` helper that
// merges the caller's own fields with the snapshot. Written with the caller's
// fields LAST, a step that happens to carry a scalar of the same name silently
// replaces the entire map with a single number:
//
//     say(..., { kind: 'win', placed: champ.placed })   // a number
//     steps.push({ placed: <the map>, ...step })        // now a number
//
// Two competitions shipped exactly that, both on their win step, and both
// failed in the same invisible way: the last and most important card of the
// night was drawn with the second-to-last card's data. Nothing threw, nothing
// looked broken, and the only symptom was a winner's board sitting three
// pieces short of the buzzer they had visibly just hit.
//
// This is the guard. Every step, every competition, every player.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks'];
const ARCH = ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'loyal-soldier',
  'hothead', 'wildcard', 'social-butterfly', 'perceptive-player'];
const CAST = NAMES.map((name, i) => ({ name, archetype: ARCH[i],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// competition id -> the per-player map its steps must always carry.
const STEP_MAPS = {
  'bb-mental-puzzle': ['placed', 'bad'],
  'bb-endurance-wall': ['ground'],
  'bb-endurance-soak': ['heats'],
};

// Pure Chance carries a LIST rather than a map — the drop order, which the
// board draws as its queue — and it is merged the same way and can be clobbered
// the same way, so it is checked the same way.
const STEP_LISTS = { 'bb-luck-draw': ['order'] };

describe('per-player step maps survive every step', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
    gs.popularity = {};
    seasonConfig.romance = 'off';
    NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
      timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
  });

  for (const [id, keys] of Object.entries(STEP_MAPS)) {
    it(`${id} never lets a step clobber ${keys.join('/')}`, () => {
      for (const seed of [7, 77, 313, 4242]) {
        const participants = NAMES.slice(0, 8);
        const r = runBBCompetition({
          type: 'hoh', participants, house: NAMES, library: BB_COMPETITIONS,
          forcedId: id, rng: rngFor(seed), week: { num: 4, houseAtStart: NAMES },
          nominees: [NAMES[1], NAMES[5]], hoh: NAMES[0],
        });
        const steps = r.detail?.steps || [];
        expect(steps.length, `${id}: no steps`).toBeGreaterThan(2);

        steps.forEach((s, i) => {
          // The opening step is allowed to carry empty maps: nobody has done
          // anything yet. Every other step must carry the whole field.
          if (s.kind === 'open') return;
          for (const key of keys) {
            const map = s[key];
            expect(typeof map, `${id} seed ${seed} step ${i} (${s.kind}): ${key} is a ${typeof map}, not a map`)
              .toBe('object');
            expect(map).not.toBeNull();
            for (const name of participants) {
              expect(Number.isFinite(Number(map[name])),
                `${id} seed ${seed} step ${i} (${s.kind}): ${key} is missing ${name}`).toBe(true);
            }
          }
        });

        // And specifically the last card, which is where both bugs lived.
        const last = steps[steps.length - 1];
        for (const key of keys) {
          expect(Object.keys(last[key] || {}).length,
            `${id}: the final step's ${key} is not a full map`).toBe(participants.length);
        }
      }
    });
  }

  for (const [id, keys] of Object.entries(STEP_LISTS)) {
    it(`${id} never lets a step clobber ${keys.join('/')}`, () => {
      const participants = NAMES.slice(0, 8);
      for (const seed of [7, 77, 313]) {
        const r = runBBCompetition({
          type: 'hoh', participants, house: NAMES, library: BB_COMPETITIONS,
          forcedId: id, rng: rngFor(seed), week: { num: 4, houseAtStart: NAMES },
          nominees: [NAMES[1]], hoh: NAMES[0],
        });
        const steps = r.detail?.steps || [];
        expect(steps.length).toBeGreaterThan(2);
        steps.forEach((s, i) => {
          for (const key of keys) {
            expect(Array.isArray(s[key]),
              `${id} seed ${seed} step ${i} (${s.kind}): ${key} is not a list`).toBe(true);
            expect(s[key], `${id} step ${i}: ${key} lost somebody`).toHaveLength(participants.length);
          }
        });
      }
    });
  }
});
