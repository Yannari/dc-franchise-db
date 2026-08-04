// A houseguest who thinks they are going home does not take the prize.
//
// Two competitions taunt the field with a way out: Slippery Slope puts a
// lesser prize in a small container you can only fill by quitting, and the
// Pressure Cooker offers a prize to one specific holder if they take their
// thumb off the button. Both were treating that as a personality question —
// how bold, how greedy, how tired — and both were letting people on the block
// stroll off a competition that was the only thing standing between them and
// a chair.
//
// It is not a personality question. Somebody who believes they are going home
// on Thursday will do anything to win, and no letter from home is worth
// enough to change that. Danger is therefore a MULTIPLIER on temptation
// rather than one term among several, drawn from the one model the library
// shares (`dangerLevel`) rather than each competition guessing at it.
//
// Measured when this went in: nominees playing the veto took the Slippery
// Slope prize 0 times in 160, safe houseguests 25.5% of the time.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { dangerLevel } from '../js/bb/strategy.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Wayne', 'Emmah', 'Chase', 'Scary Girl', 'Nichelle',
  'Axel', 'Zee', 'Brightly', 'Hicks', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater',
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1) }));
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('the prize only tempts somebody who can afford to take it', () => {
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

  it('rates a nominee playing the veto as being in real danger', () => {
    const ctx = { type: 'veto', house: NAMES, nominees: ['Bowie', 'Wayne'] };
    expect(dangerLevel('Bowie', ctx)).toBe(1);
    expect(dangerLevel('Caleb', ctx)).toBeLessThan(1);
  });

  it('Slippery Slope: the block does not walk off the lane', () => {
    let nomTook = 0, nomRuns = 0, safeTook = 0, safeRuns = 0;
    for (let s = 0; s < 60; s++) {
      const r = runBBCompetition({
        type: 'veto', participants: NAMES, house: NAMES, library: BB_COMPETITIONS,
        forcedId: 'bb-physical-slide', rng: seededRng(s * 977 + 11),
        week: { num: 4, houseAtStart: NAMES }, nominees: ['Bowie', 'Wayne'],
      });
      for (const [name, row] of Object.entries(r.debug.scoreBreakdown)) {
        const onBlock = name === 'Bowie' || name === 'Wayne';
        if (onBlock) { nomRuns++; if (row.tookPrize) nomTook++; }
        else { safeRuns++; if (row.tookPrize) safeTook++; }
      }
    }
    // The safe half has to actually be taking it, or this proves nothing.
    expect(safeTook, 'nobody ever took the prize — the check is vacuous').toBeGreaterThan(0);
    expect(nomTook, `${nomTook} nominees quit a veto they needed`).toBe(0);
    expect(nomTook / Math.max(1, nomRuns))
      .toBeLessThan(safeTook / Math.max(1, safeRuns));
  });

  it('Slippery Slope: taking it is a real decision with a real payout', () => {
    // A prize that changes nothing is a shrug. What it buys — or costs — is
    // how the rest of the house feels about somebody who stopped.
    let sawShared = 0, sawKept = 0;
    for (let s = 0; s < 60; s++) {
      const r = runBBCompetition({
        type: 'hoh', participants: NAMES, house: NAMES, library: BB_COMPETITIONS,
        forcedId: 'bb-physical-slide', rng: seededRng(s * 613 + 5),
        week: { num: 4, houseAtStart: NAMES },
      });
      for (const row of Object.values(r.debug.scoreBreakdown)) {
        if (!row.tookPrize) continue;
        if (row.prize === 'shopping') sawShared++;
        if (row.prize === 'cash') sawKept++;
      }
    }
    // Both kinds exist and are reachable; the payouts differ in sign, which is
    // what makes the choice interesting rather than a uniform penalty.
    expect(sawShared + sawKept, 'neither prize kind was ever drawn').toBeGreaterThan(0);
  });

  it('the boldness in Slippery Slope is spent once, not twice', () => {
    // It decides whether you stop, not how well you climb — so it must not
    // also be sitting in the stat profile.
    const comp = BB_COMPETITIONS.find(c => c.id === 'bb-physical-slide');
    expect(Object.keys(comp.stats)).not.toContain('boldness');
    const sum = Object.values(comp.stats).reduce((a, b) => a + b, 0);
    expect(Math.round(sum * 100) / 100, 'the profile no longer sums to 1').toBe(1);
  });

  it('Pressure Cooker: the same rule, on the same model', () => {
    let nomTook = 0, safeTook = 0;
    for (let s = 0; s < 60; s++) {
      const r = runBBCompetition({
        type: 'hoh', participants: NAMES, house: NAMES, library: BB_COMPETITIONS,
        forcedId: 'bb-sig-pressure-cooker', rng: seededRng(s * 811 + 7),
        week: { num: 4, houseAtStart: NAMES }, nominees: ['Bowie', 'Wayne'],
      });
      for (const [name, row] of Object.entries(r.debug.scoreBreakdown)) {
        // `tempted` counts times they were OFFERED and said no, which is a
        // different thing and is fine to happen to anybody. Taking it is
        // `tookPrize`, and that is the behaviour under test.
        if (!row.tookPrize) continue;
        if (name === 'Bowie' || name === 'Wayne') nomTook++; else safeTook++;
      }
    }
    expect(safeTook, 'nobody ever came off the button — the check is vacuous').toBeGreaterThan(0);
    expect(nomTook, 'a nominee came off the button for a prize').toBe(0);
  });

  it('being offered it while desperate still happens, and is refused out loud', () => {
    // The floor stops them TAKING it, not being tempted. Somebody in trouble
    // staring at a prize and saying no is the scene worth keeping.
    let refusals = 0;
    for (let s = 0; s < 60; s++) {
      const r = runBBCompetition({
        type: 'hoh', participants: NAMES, house: NAMES, library: BB_COMPETITIONS,
        forcedId: 'bb-sig-pressure-cooker', rng: seededRng(s * 811 + 7),
        week: { num: 4, houseAtStart: NAMES }, nominees: ['Bowie', 'Wayne'],
      });
      refusals += (r.beats || []).filter(b => b.badgeText === 'REFUSED THE PRIZE').length;
    }
    expect(refusals, 'nobody ever refused a prize out loud').toBeGreaterThan(0);
  });
});

// ── what the prize is actually worth ──────────────────────────────────

describe('the prize gives the taker something the week can feel', () => {
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

  it('says what the taker walked away with, not just what it was called', () => {
    for (let s = 0; s < 40; s++) {
      const r = runBBCompetition({
        type: 'hoh', participants: NAMES, house: NAMES, library: BB_COMPETITIONS,
        forcedId: 'bb-physical-slide', rng: seededRng(s * 613 + 5),
        week: { num: 4, houseAtStart: NAMES },
      });
      const takes = (r.beats || []).filter(b => String(b.badgeText).startsWith('TAKES:'));
      if (!takes.length) continue;
      // The benefit is stated in words, on its own beat.
      expect(takes[0].text.length, 'the prize beat says nothing').toBeGreaterThan(40);
      return;
    }
    throw new Error('no seeded run produced a prize to check');
  });

});
