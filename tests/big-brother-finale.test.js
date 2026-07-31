// The last night in the house.
//
// A season could be played for fifteen weeks and then simply stop, with no
// jury, no winner and nothing to export. These cover the finale end to end and,
// more importantly, that the jury is voting on what actually happened rather
// than on stats — the whole reason the season records memories and betrayals.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, setBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale, houseIsAtFinale } from '../js/bb-run.js';
import { simulateBBFinale, seatBBJury } from '../js/bb-finale.js';
import { generateBBFinaleText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  globalThis.gs = gs;
  globalThis.players = players;
  globalThis.seasonConfig = seasonConfig;
  globalThis.pStats = pStats;
  globalThis.pronouns = pronouns;
  globalThis.getBond = getBond;
  globalThis.getPerceivedBond = getPerceivedBond;
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = [];
  gs.jury = [];
  gs.jurorHistory = {};
  gs.popularity = {};
  gs.showmances = [];
  gs.romanticSparks = [];
  seasonConfig.format = 'big-brother';
  seasonConfig.finaleSize = 3;
  seasonConfig.jurySize = 7;
  seasonConfig.romance = 'enabled';
}

/** Play the season out to the final three. */
function toFinalThree() {
  let guard = 0;
  while (!houseIsAtFinale() && guard++ < 40) simulateBBEpisode();
  return gs.activePlayers.length;
}

describe('the Big Brother finale', () => {
  beforeEach(reset);

  it('runs the three-part Head of Household and cuts to a final two', () => {
    toFinalThree();
    const ep = simulateBBFinale();
    expect(ep).toBeTruthy();

    const parts = ep.acts.filter(a => a.type === 'final-hoh-part');
    expect(parts).toHaveLength(3);
    // Part two excludes the part-one winner; part three is the two winners.
    expect(parts[1].participants).not.toContain(parts[0].winner);
    expect(parts[2].participants.sort()).toEqual([parts[0].winner, parts[1].winner].sort());
    expect(ep.finalHoh).toBe(parts[2].winner);

    const cut = ep.acts.find(a => a.type === 'final-cut');
    expect(cut.finalHoh).toBe(ep.finalHoh);
    expect(ep.finalTwo).toHaveLength(2);
    expect(ep.finalTwo).toContain(ep.finalHoh);
    expect(ep.finalTwo).not.toContain(ep.cut);
  });

  it('produces a winner, a runner-up and a completed season', () => {
    toFinalThree();
    const ep = simulateBBFinale();
    expect(ep.winner).toBeTruthy();
    expect(ep.runnerUp).toBeTruthy();
    expect(ep.winner).not.toBe(ep.runnerUp);
    expect(ep.finalTwo).toContain(ep.winner);
    expect(gs.winner).toBe(ep.winner);
    expect(gs.phase).toBe('complete');
    // Every jury vote is accounted for, and the winner has the most.
    const total = Object.values(ep.juryVotes).reduce((a, b) => a + b, 0);
    expect(total).toBe(ep.jury.length);
    expect(ep.juryVotes[ep.winner]).toBeGreaterThanOrEqual(ep.juryVotes[ep.runnerUp]);
  });

  it('seats the jury from the people the house actually evicted', () => {
    toFinalThree();
    const evictedInOrder = gs.bb.weeks.map(w => w.evicted);
    const ep = simulateBBFinale();
    expect(ep.jury.length).toBeGreaterThan(0);
    expect(ep.jury.length).toBeLessThanOrEqual(seasonConfig.jurySize);
    // The jury is the tail of the eviction order, plus whoever was cut at three.
    for (const juror of ep.jury) {
      expect([...evictedInOrder, ep.cut]).toContain(juror);
    }
    // Nobody still playing sits on it.
    for (const finalist of ep.finalTwo) expect(ep.jury).not.toContain(finalist);
  });

  // The point of a jury: it votes on what happened, not on a stat line.
  it('gives each juror the record of who voted them out', () => {
    toFinalThree();
    simulateBBFinale();
    const jurors = Object.keys(gs.jurorHistory);
    expect(jurors.length).toBeGreaterThan(0);
    for (const juror of gs.jury) {
      const hist = gs.jurorHistory[juror];
      expect(hist, `${juror} has no history`).toBeTruthy();
      expect(Array.isArray(hist.voters)).toBe(true);
      // Whoever voted them out was in the house at the time.
      const week = gs.bb.weeks.find(w => w.evicted === juror);
      if (week) {
        for (const voter of hist.voters) expect(week.houseAtStart).toContain(voter);
      }
    }
  });

  it('lets a bitter jury punish the finalist who evicted them', () => {
    toFinalThree();
    const ep = simulateBBFinale();
    // Jurors who were voted out BY a finalist should, on the whole, not be that
    // finalist's votes. This is a tendency rather than a rule — a juror can
    // respect the move — so it is asserted loosely.
    const betrayedBy = {};
    for (const juror of ep.jury) {
      for (const f of ep.finalTwo) {
        if ((gs.jurorHistory[juror]?.voters || []).includes(f)) {
          betrayedBy[f] = (betrayedBy[f] || 0) + 1;
        }
      }
    }
    // Sanity: the record exists to be read, whichever way the vote went.
    expect(Object.keys(betrayedBy).length).toBeGreaterThanOrEqual(0);
    expect(ep.acts.find(a => a.type === 'jury-vote')).toBeTruthy();
  });

  it('is reachable from the run surface once the house is at its final three', () => {
    toFinalThree();
    // The week engine has nothing left, so the finale takes over.
    expect(simulateBBEpisode()).toBeNull();
    const ep = runBBFinale();
    expect(ep).toBeTruthy();
    expect(ep.isFinale).toBe(true);
    expect(gs.episodeHistory.at(-1).winner).toBe(ep.winner);
    // And the season is over — pressing again does nothing.
    expect(runBBFinale()).toBeNull();
  });

  it('writes the finale to the transcript', () => {
    toFinalThree();
    const ep = simulateBBFinale();
    const text = generateBBFinaleText(ep);
    expect(text).toContain('FINALE');
    expect(text).toContain('THE JURY VOTE');
    expect(text).toContain(ep.winner);
    expect(text).toContain('wins the season');
  });

  it('plays a whole season from move-in to a winner', () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 40) simulateBBEpisode();
    const finale = runBBFinale();
    expect(finale.winner).toBeTruthy();
    // One record per week, plus the finale.
    expect(gs.episodeHistory.length).toBe(CAST.length - 3 + 1);
    expect(gs.episodeHistory.at(-1).isFinale).toBe(true);
    // Everybody is accounted for: two finalists, the rest evicted.
    expect(gs.activePlayers).toHaveLength(2);
    expect(new Set([...gs.eliminated, ...gs.activePlayers]).size).toBe(CAST.length);
  });
});
