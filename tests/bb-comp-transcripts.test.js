// The written week keeps up with the competitions.
//
// Big Brother has TWO transcript writers and they are easy to forget:
//   * text-backlog.js generateSummaryText — what the browser writes
//   * bb-run.js summariseWeek — what headless runs and these tests write
// Both walk `comp.beats` generically, so a new competition should appear in
// both for free. "Should" is the reason this test exists: the split has caught
// this project out before, and a competition whose narration never reaches the
// transcript is a week the reader cannot follow.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const COMPS = ['bb-mental-quiz', 'bb-mental-memory', 'bb-physical-precision',
  'bb-physical-slide', 'bb-mental-knockout', 'bb-sig-bb-comics'];

/** A week shaped the way both writers expect, with one forced competition. */
function weekWith(id, { secret = false } = {}) {
  const comp = runBBCompetition({
    type: 'hoh', participants: NAMES.slice(0, 8), house: NAMES,
    library: BB_COMPETITIONS, forcedId: id, rng: seededRng(id.length * 31 + 7),
    week: { num: 4, houseAtStart: NAMES },
  });
  const act = {
    type: 'hoh', winner: comp.winner, secret,
    results: comp.placements.map(n => ({ name: n, score: comp.scores[n] })),
    participants: comp.participants, competition: comp, socialBeats: [],
  };
  return {
    num: 4, format: 'big-brother', isBigBrother: true, acts: [act],
    houseAtStart: [...NAMES], hoh: secret ? null : comp.winner, hohSecret: secret,
    initialNominees: [], finalNominees: [], votes: {}, votingLog: [],
    comp,
  };
}

describe('both transcripts keep up with the competition library', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {};
    seasonConfig.romance = 'off';
    seasonConfig.format = 'big-brother';
    NAMES.forEach(n => {
      gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
        timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    });
  });

  for (const id of COMPS) {
    it(`${id} reaches both writers, beat for beat`, () => {
      const week = weekWith(id);
      const { comp } = week;
      const headless = summariseWeek(week);
      const browser = generateSummaryText(week);

      for (const [label, text] of [['summariseWeek', headless], ['generateSummaryText', browser]]) {
        expect(text, `${id}: ${label} produced nothing`).toBeTruthy();
        expect(text, `${id}: ${label} never names the competition`).toContain(comp.name);
        // Every narrated beat has to survive into the written week.
        const missing = (comp.beats || [])
          .filter(b => b && b.text && !text.includes(b.text))
          .map(b => b.badgeText);
        expect(missing, `${id}: ${label} dropped beats`).toEqual([]);
      }
      // The rules of the competition are stated, not just its name.
      expect(browser, `${id}: the browser transcript never explains the rules`)
        .toContain(comp.desc.slice(0, 60));
    });
  }

  it('a sealed Head of Household stays sealed in the written week too', () => {
    const week = weekWith('bb-mental-quiz', { secret: true });
    for (const [label, text] of [
      ['summariseWeek', summariseWeek(week)],
      ['generateSummaryText', generateSummaryText(week)],
    ]) {
      expect(text, `${label}: never says the result is sealed`).toMatch(/SEALED|sealed/);
      // The winner may appear only in the explicit viewer-only aside — the
      // house half of the transcript must not announce them.
      const houseFacing = text.replace(/\(Viewer only:[^)]*\)/g, '');
      expect(houseFacing, `${label}: announced the sealed winner`)
        .not.toMatch(new RegExp(`${week.comp.winner} wins Head of Household`));
    }
  });
});
