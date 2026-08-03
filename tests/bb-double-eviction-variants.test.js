// The double eviction's three shapes, wiki-grounded:
//   fast-forward — the US live hour, a compressed second cycle (the original
//     build, regression-covered elsewhere);
//   double-vote  — the international night: one vote over three nominees,
//     the two highest evict-getters both walk;
//   week-in-one  — BB5/6: a second FULL cycle, real house life and
//     campaigning, inside the same episode.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig, players } from '../js/core.js';
import { pStats, pronouns, threatScore } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { ordinal } from '../js/finale.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: 'P' + i, archetype: ['mastermind', 'hero', 'floater', 'villain', 'schemer', 'goat'][i % 6],
  gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 1),
}));
const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  seasonConfig.romance = 'enabled';
  seasonConfig.finaleSize = 3;
}

describe('the double vote (international)', () => {
  const dvWeek = seed => {
    reset();
    return simulateBBWeek({ rng: seededRng(seed), houseEvents: HOUSE_EVENTS,
      competitions: BB_COMPETITIONS, twists: ['bb-double-eviction'], doubleVote: true });
  };

  it('runs one vote over three chairs and walks the top two', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const week = dvWeek(seed * 13 + 9);
      expect(week.doubleVote).toBe(true);
      expect(week.initialNominees).toHaveLength(3);
      expect(week.finalNominees).toHaveLength(3);
      // Both walks recorded, distinct, and drawn from the final block.
      expect(week.evicted).toBeTruthy();
      expect(week.secondEvicted).toBeTruthy();
      expect(week.evicted).not.toBe(week.secondEvicted);
      expect(week.finalNominees).toContain(week.evicted);
      expect(week.finalNominees).toContain(week.secondEvicted);
      // The two who left got at least as many votes as the survivor.
      const survivor = week.finalNominees.find(n => n !== week.evicted && n !== week.secondEvicted);
      expect((week.votes[week.evicted] || 0)).toBeGreaterThanOrEqual(week.votes[survivor] || 0);
      // Ballots are all real names on the final block, cast by non-nominees.
      for (const b of week.ballots) {
        expect(week.finalNominees).toContain(b.evict);
        expect(week.finalNominees).not.toContain(b.voter);
        expect(b.voter).not.toBe(week.hoh);
      }
      // Both are out of the house and in the eliminated ledger, walk order kept.
      expect(gs.activePlayers).not.toContain(week.evicted);
      expect(gs.activePlayers).not.toContain(week.secondEvicted);
      const i1 = gs.eliminated.indexOf(week.evicted);
      const i2 = gs.eliminated.indexOf(week.secondEvicted);
      expect(i1).toBeGreaterThanOrEqual(0);
      expect(i2).toBe(i1 + 1);
      // The eviction act tells the double story.
      const ev = week.acts.find(a => a.type === 'eviction');
      expect(ev.doubleVote).toBe(true);
      expect(ev.secondEvicted).toBe(week.secondEvicted);
    }
  });

  it('replays identically for the same seed', () => {
    const run = () => {
      const w = dvWeek(517);
      return { first: w.evicted, second: w.secondEvicted, votes: w.votes };
    };
    expect(run()).toEqual(run());
  });

  it('stands down when the house is too small for three chairs and two walks', () => {
    reset();
    gs.activePlayers = CAST.slice(0, 5).map(p => p.name);
    const week = simulateBBWeek({ rng: seededRng(9), houseEvents: HOUSE_EVENTS,
      competitions: BB_COMPETITIONS, house: gs.activePlayers, twists: ['bb-double-eviction'], doubleVote: true });
    expect(week.doubleVote).toBe(false);
    expect(week.initialNominees).toHaveLength(2);
    expect(week.secondEvicted ?? null).toBe(null);
  });
});

describe('the week-in-one (BB5/6)', () => {
  const playSeason = (deStyle, seed = 3) => {
    reset();
    Object.assign(seasonConfig, {
      format: 'big-brother', jurySize: 7, bbSafetyMode: 'off',
      bbHaveNots: 'off', bbDepartures: 'off', setting: 'bb-house',
      twistSchedule: [{ episode: 2, type: 'bb-double-eviction', deStyle }],
    });
    gs.episodeHistory = []; gs.riPlayers = gs.riPlayers || []; gs.sideDeals = []; gs.knowledge = {};
    Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, threatScore, getBond, getPerceivedBond, ordinal });
    simulateBBEpisode();          // week 1, plain
    return simulateBBEpisode();   // week 2, the double
  };

  it('runs the second cycle at full length inside the same episode', () => {
    const ep = playSeason('week-in-one');
    expect(ep.doubleEviction).toBeTruthy();
    expect(ep.doubleEvictionStyle).toBe('week-in-one');
    expect(ep.alsoEliminated).toBeTruthy();
    expect(ep.alsoEliminated).not.toBe(ep.eliminated);
    // The proof of "full length": the second segment has real house-life
    // stretches, which the fast-forward's compressed cycle never produces.
    const seg2House = (ep.acts || []).filter(a => (a.segment || 1) === 2 && a.type === 'house');
    expect(seg2House.length, 'second cycle had no house life — that is a fast-forward').toBeGreaterThanOrEqual(1);
  });

  it('the fast-forward stays compressed by contrast', () => {
    const ep = playSeason('fast-forward', 5);
    expect(ep.doubleEviction).toBeTruthy();
    expect(ep.doubleEvictionStyle).toBe('fast-forward');
    const seg2House = (ep.acts || []).filter(a => (a.segment || 1) === 2 && a.type === 'house');
    expect(seg2House).toHaveLength(0);
  });

  it('the double-vote style routes through the played path with both names in the transcript', () => {
    const ep = playSeason('double-vote', 7);
    expect(ep.doubleEvictionStyle).toBe('double-vote');
    expect(ep.doubleEviction ?? null).toBe(null);   // no second cycle
    expect(ep.alsoEliminated).toBeTruthy();
    expect(ep.finalNominees).toHaveLength(3);
    expect(ep.summaryText).toContain('DOUBLE EVICTION — one vote, two walks');
    expect(ep.summaryText).toContain(ep.alsoEliminated);
  });
});
