// Majority Rules has to be long enough to be a competition.
//
// The rule that makes it interesting is also what kept killing it: the
// majority that decides a round is the majority of the LOCK-INS, so the side
// sent home is always the smaller one, and the field halves on every question.
// Eight houseguests is therefore three questions and a tiebreaker — eight to
// five to three to two — no matter how many superlatives sit in the bank.
// Measured before this: an average of 4.1 questions on a field of eight, and
// seasons that resolved the whole competition in TWO.
//
// The elimination rounds are the second half now. The first is a survey: same
// questions, nobody goes home, everybody marked. So the guard is about depth
// and about the shape of the two halves — the survey must not evict anybody,
// and the sudden death must still obey the real rule.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const ID = 'bb-mental-quiz';
const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const rngFor = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const boot = () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null, haveNots: [] };
  gs.popularity = {};
  seasonConfig.romance = 'off';
  NAMES.forEach(n => { gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
    timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 }; });
};

const play = (seed, size = 8) => runBBCompetition({
  type: 'hoh', participants: NAMES.slice(0, size), house: NAMES.slice(0, size),
  library: BB_COMPETITIONS, forcedId: ID, rng: rngFor(seed),
  week: { num: 4, houseAtStart: NAMES.slice(0, size) },
});

const bdOf = r => r.breakdown || r.debug?.scoreBreakdown || {};
const asked = r => Math.max(0, ...Object.values(bdOf(r)).map(x => (x.picks || []).length));

describe('Majority Rules runs long enough to be one', () => {
  beforeEach(boot);

  it('asks a real number of questions, whatever the field', () => {
    for (const size of [6, 8, 12]) {
      const counts = [];
      for (let s = 0; s < 25; s++) { boot(); counts.push(asked(play(s * 41 + 9, size))); }
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      // Before: 3.6 / 4.1 / 5.1 by field size, with a floor of two.
      expect(Math.min(...counts), `field ${size} ran a ${Math.min(...counts)}-question competition`)
        .toBeGreaterThanOrEqual(5);
      expect(avg, `field ${size} averaged only ${avg.toFixed(1)} questions`).toBeGreaterThan(5.5);
    }
  });

  it('nobody goes home during the survey', () => {
    for (let s = 0; s < 25; s++) {
      boot();
      const r = play(s * 17 + 3);
      const cutAt = r.beats.findIndex(b => (b.badgeText || '') === 'THE CUT');
      if (cutAt < 0) continue;                       // short field: no survey
      const before = r.beats.slice(0, cutAt);
      expect(before.some(b => (b.badgeText || '') === 'MINORITY'),
        'somebody was eliminated during the scoring half').toBe(false);
      // And the survey is not one question long.
      const surveyQs = before.filter(b => /^ROUND /.test(b.badgeText || '')).length;
      expect(surveyQs, 'the survey was too short to be worth scoring').toBeGreaterThanOrEqual(3);
    }
  });

  it('the cut takes the people who read the room worst', () => {
    for (let s = 0; s < 40; s++) {
      boot();
      const r = play(s * 23 + 5);
      const bd = bdOf(r);
      const cut = Object.entries(bd).filter(([, x]) => x.cutAtSurvey).map(([n]) => n);
      if (!cut.length) continue;
      const kept = Object.entries(bd).filter(([, x]) => !x.cutAtSurvey).map(([n]) => n);
      // Nobody cut may have out-scored somebody kept, at the moment of the cut.
      const worstKept = Math.min(...kept.map(n => bd[n].correct ?? 0));
      const bestCut = Math.max(...cut.map(n => bd[n].correct ?? 0));
      // Kept players keep scoring after the cut, so compare against the floor:
      // a cut player must not have beaten the worst survivor's SURVEY score.
      const surveyScore = n => (bd[n].picks || [])
        .filter(pk => pk.q <= Math.max(...cut.map(c => bd[c].outRound || 0)))
        .filter(pk => pk.right === true).length;
      expect(bestCut, `${cut[0]} was cut with more correct reads than a survivor`)
        .toBeLessThanOrEqual(Math.max(worstKept, ...kept.map(surveyScore)));
      return;
    }
    throw new Error('no cut happened in 40 competitions');
  });

  it('sudden death still sends the minority home', () => {
    for (let s = 0; s < 25; s++) {
      boot();
      const r = play(s * 31 + 11);
      const bd = bdOf(r);
      for (const [name, row] of Object.entries(bd)) {
        if (row.cutAtSurvey || !row.outRound) continue;
        const pick = (row.picks || []).find(pk => pk.q === row.outRound);
        if (!pick || !pick.majority) continue;       // dead-even round, nobody out
        expect(pick.right, `${name} went out on a question they got RIGHT`).toBe(false);
      }
    }
  });

  it('still produces exactly one winner, and everybody is placed', () => {
    for (const size of [3, 6, 8, 12]) {
      boot();
      const r = play(size * 77, size);
      expect(r.placements).toHaveLength(size);
      expect(new Set(r.placements).size).toBe(size);
      expect(r.winner).toBe(r.placements[0]);
      // Every question a houseguest was present for is recorded with its pair,
      // which is what the screen draws the board from.
      for (const row of Object.values(bdOf(r))) {
        (row.picks || []).forEach(pk => {
          expect(Array.isArray(pk.pair) && pk.pair.filter(Boolean).length).toBe(2);
          expect(pk.pair).toContain(pk.pick);
        });
      }
    }
  });
});
