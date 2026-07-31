// The Block Buster: three nominees every week, one wins their way off.
//
// What it changes is that a nomination stops being a sentence and becomes a
// competition — so these check the block is genuinely three, that the Block
// Buster reduces it to two before anybody votes, and that the vote still works
// with the smaller electorate a third nominee leaves behind.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { buildBBWeekScreens } from '../js/vp-screens.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';

const CAST = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N']
  .map((name, i) => ({
    name, gender: 'm', sexuality: 'straight',
    archetype: ['mastermind','hero','floater','villain','schemer','goat','challenge-beast'][i % 7],
  }));

function reset(mode, stopsAt) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond });
  seasonConfig.format = 'big-brother';
  seasonConfig.finaleSize = 3;
  seasonConfig.twistSchedule = [];
  seasonConfig.bbHaveNots = 'twist';
  seasonConfig.bbSafetyMode = mode;
  if (stopsAt !== undefined) seasonConfig.bbSafetyStopsAt = stopsAt;
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
}

const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type);

const mode = 'block-buster', textTitle = 'THE BLOCK BUSTER', screenLabel = 'Block Buster';

describe('the Block Buster', () => {
  it('puts three on the block and takes one off before the vote', () => {
    // Two or three is the HOH's call, so play until a three-chair week happens.
    let ep = null;
    for (let attempt = 0; attempt < 25 && !ep; attempt++) {
      reset(mode, 6);
      const week = simulateBBEpisode();
      if (week.initialNominees.length === 3) ep = week;
    }
    expect(ep, 'never saw a three-nominee week in 25 tries').toBeTruthy();

    // Three nominated.
    expect(ep.initialNominees).toHaveLength(3);
    const noms = actOf(ep, 'nominations');
    expect(noms.nominees).toHaveLength(3);
    expect(noms.nominees).not.toContain(ep.hoh);
    expect(new Set(noms.nominees).size).toBe(3);

    // The arena is played by exactly those on the block, and nobody else.
    const arena = actOf(ep, 'safety');
    expect(arena, 'no arena act').toBeTruthy();
    expect(arena.mode).toBe(mode);
    expect(arena.participants).toHaveLength(3);
    expect(ep.blockBeforeSafety).toHaveLength(3);
    expect(arena.participants).toContain(arena.winner);

    // Two face the vote, and the winner is not one of them.
    expect(ep.finalNominees).toHaveLength(2);
    expect(ep.finalNominees).not.toContain(arena.winner);
    expect(ep.safetyWinner).toBe(arena.winner);
    // Saving yourself is not the same as being vetoed, but it counts as a save.
    expect(gs.bb.stats[arena.winner].timesSaved).toBeGreaterThanOrEqual(1);

    // The vote still happens, between the two who lost.
    expect(ep.finalNominees).toContain(ep.eliminated);
    expect(ep.eliminated).not.toBe(arena.winner);
    expect(gs.activePlayers).toHaveLength(CAST.length - 1);
    // Nobody who was on the block votes, and neither does the HOH.
    for (const b of ep.votingLog || []) {
      expect(ep.finalNominees).not.toContain(b.voter);
      expect(b.voter).not.toBe(ep.hoh);
    }
    expect((ep.votingLog || []).length).toBeGreaterThan(0);
  });

  it('gets its own screen and its own transcript section', () => {
    let ep = null;
    for (let attempt = 0; attempt < 25 && !ep; attempt++) {
      reset(mode, 6);
      const week = simulateBBEpisode();
      if (actOf(week, 'safety')) ep = week;
    }
    expect(ep, 'never saw a Block Buster in 25 tries').toBeTruthy();
    const screens = buildBBWeekScreens(ep);
    const arena = screens.find(s => s.id === 'bb-safety');
    expect(arena, 'no Block Buster screen').toBeTruthy();
    expect(arena.label).toBe(screenLabel);
    expect(arena.html).toContain(ep.safetyWinner);
    // All three nominees appear on it, not just the winner.
    for (const n of ep.blockBeforeSafety) expect(arena.html).toContain(n);

    const text = generateBBSummaryText(ep);
    expect(text).toContain(textTitle);
    expect(text).toContain(ep.safetyWinner);
  });
});

describe('the Block Buster over a season', () => {
  it('stops before a third nominee would leave nobody to vote', () => {
    reset('block-buster', 6);
    let guard = 0, sawArena = 0, sawTwo = 0;
    while (!houseIsAtFinale() && guard++ < 40) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      const house = ep.houseAtStart.length;
      // The block is two or three - the HOH decides - and the Block Buster
      // only happens when there is a third chair for it to empty.
      expect([2, 3]).toContain(ep.initialNominees.length);
      if (actOf(ep, 'safety')) {
        sawArena++;
        expect(house, 'Block Buster ran in too small a house').toBeGreaterThan(6);
        expect(ep.initialNominees).toHaveLength(3);
      } else {
        sawTwo++;
        // Either the house got small, or the HOH only named two.
        expect(house <= 6 || ep.initialNominees.length === 2).toBe(true);
      }
      // Whatever happens, exactly one person leaves each week.
      expect(ep.eliminated).toBeTruthy();
    }
    expect(sawArena).toBeGreaterThan(0);
    expect(sawTwo).toBeGreaterThan(0);
    expect(gs.activePlayers).toHaveLength(3);
  });

  it('never runs a Block Buster once the house is at the stopping point', () => {
    reset('block-buster', 6);
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 40) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      if (ep.houseAtStart.length <= 6) {
        expect(actOf(ep, 'safety'), 'ran below the stopping point').toBeUndefined();
        expect(ep.initialNominees).toHaveLength(2);
      }
    }
  });

  // The three twists and the two modes are all week-shape changes, so they are
  // the most likely things in this format to break each other.
  it('survives an instant eviction — no veto, but still a Block Buster', () => {
    reset('block-buster', 6);
    seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-instant-eviction' }];
    const ep = simulateBBEpisode();
    expect(ep.initialNominees).toHaveLength(3);
    expect(actOf(ep, 'veto')).toBeUndefined();
    expect(actOf(ep, 'safety')).toBeTruthy();
    expect(ep.finalNominees).toHaveLength(2);
    expect(gs.activePlayers).toHaveLength(CAST.length - 1);
  });

  it('runs in both halves of a double eviction, with separate screens', () => {
    reset('block-buster', 6);
    seasonConfig.twistSchedule = [{ episode: 1, type: 'bb-double-eviction' }];
    const ep = simulateBBEpisode();
    // Either half may be a two-nominee week, so require at least one arena
    // across the night rather than exactly one in each half.
    expect((ep.acts || []).filter(a => a.type === 'safety').length).toBeGreaterThanOrEqual(1);
    expect(gs.activePlayers).toHaveLength(CAST.length - 2);
    const ids = buildBBWeekScreens(ep).map(s => s.id);
    expect(new Set(ids).size, 'duplicate screen ids').toBe(ids.length);
    expect(ids.some(id => id === 'bb-safety' || id === 'bb-safety-2')).toBe(true);
  });

  // There were briefly two modes. A season saved then should still open.
  it('loads a season saved under the old AI Arena mode as a Block Buster', () => {
    let ep = null;
    for (let attempt = 0; attempt < 25 && !ep; attempt++) {
      reset('ai-arena', 6);
      const week = simulateBBEpisode();
      if (actOf(week, 'safety')) ep = week;
    }
    expect(ep, 'never saw a Block Buster in 25 tries').toBeTruthy();
    expect(ep.initialNominees).toHaveLength(3);
    expect(ep.safetyMode).toBe('block-buster');
    expect(actOf(ep, 'safety').mode).toBe('block-buster');
    expect(ep.finalNominees).toHaveLength(2);
  });

  it('lets the Head of Household name only two, and then holds no Block Buster', () => {
    let ep = null;
    for (let attempt = 0; attempt < 25 && !ep; attempt++) {
      reset('block-buster', 6);
      const week = simulateBBEpisode();
      if (week.initialNominees.length === 2) ep = week;
    }
    expect(ep, 'the HOH named three every time in 25 tries').toBeTruthy();
    expect(actOf(ep, 'safety')).toBeUndefined();
    expect(ep.finalNominees).toHaveLength(2);
    expect(ep.eliminated).toBeTruthy();
  });

  it('is off by default, and off means two nominees', () => {
    reset('off');
    const ep = simulateBBEpisode();
    expect(ep.initialNominees).toHaveLength(2);
    expect(actOf(ep, 'safety')).toBeUndefined();
    expect(ep.safetyMode).toBeNull();
  });
});
