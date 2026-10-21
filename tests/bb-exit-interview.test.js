// Kristal-talKs exit interviews on a real Big Brother season (played path).
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { recordBBExits, publishedExitInterviews } from '../js/bb/exit-interview.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
].map(([name, archetype, gender]) => ({ name, archetype, gender, sexuality: 'straight' }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, getBond, getPerceivedBond });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.jury = []; gs.jurorHistory = {};
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = [];
  gs.exitInterviews = [];
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
}

function playSeason(seed) {
  reset();
  withSeededRandom(seed, () => {
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 40) simulateBBEpisode();
    simulateBBFinale();
  });
}

describe('a whole season of exit interviews', () => {
  for (const seed of [11, 23, 47]) {
    describe(`seed ${seed}`, () => {
      beforeEach(() => playSeason(seed));

      it('every evictee records one the week they leave, and each finalist one on finale night', () => {
        const recs = gs.exitInterviews;
        const finale = gs.bb.finale;
        const evicted = gs.bb.weeks.flatMap(w => [w.evicted, w.secondEvicted]).filter(Boolean);
        for (const name of evicted) {
          if ((gs.activePlayers || []).includes(name) && ![finale.winner, finale.runnerUp].includes(name)) continue;
          expect(recs.filter(r => r.guest === name).length, name).toBeGreaterThanOrEqual(1);
        }
        const finalNight = recs.filter(r => r.kind === 'finalist');
        expect(finalNight.map(r => r.placement).sort()).toEqual(finale.cut ? [1, 2, 3] : [1, 2]);
        expect(recs.find(r => r.placement === 1).guest).toBe(finale.winner);
        // Nobody records twice in one week.
        const keys = recs.map(r => `${r.guest}|${r.week}`);
        expect(new Set(keys).size).toBe(keys.length);
      });

      it('no juror hears a word before the final vote', () => {
        const finaleWeek = Math.max(...gs.exitInterviews.map(r => r.week));
        const jury = gs.bb.finale.jury || [];
        expect(jury.length).toBeGreaterThan(0);
        for (const r of gs.exitInterviews) {
          for (const j of jury) {
            if (r.heardBy[j] != null) expect(r.heardBy[j], `${j} heard ${r.id}`).toBe(finaleWeek);
          }
        }
      });

      it('predicts a winner who was still in the house, and names nobody twice', () => {
        for (const r of gs.exitInterviews.filter(x => x.kind !== 'finalist')) {
          if (r.prediction) expect(r.stillIn).toContain(r.prediction);
          expect(r.stillIn).not.toContain(r.guest);
          const who = r.named.map(n => n.who);
          expect(new Set(who).size).toBe(who.length);
        }
      });

      it('moves something: fans, and the bonds of the people who heard it', () => {
        const moved = gs.exitInterviews.filter(r => Object.keys(r.effects.popularity).length);
        expect(moved.length).toBeGreaterThan(0);
        const heard = gs.exitInterviews.filter(r => Object.keys(r.heardBy).length);
        expect(heard.length).toBeGreaterThan(0);
      });

      it('publishes the decisions, not the hearing stamps', () => {
        const pub = publishedExitInterviews();
        expect(pub.length).toBe(gs.exitInterviews.length);
        expect(pub[0].heardBy).toBeUndefined();
        expect(Array.isArray(pub[0].heard)).toBe(true);
        expect(JSON.parse(JSON.stringify(pub))).toEqual(pub);
      });
    });
  }
});

describe('the odd nights', () => {
  beforeEach(() => {
    reset();
    gs.activePlayers = CAST.map(c => c.name).filter(n => n !== 'A');
    gs.eliminated = ['A'];
  });

  it('a walkout has no vote to ask about', () => {
    const [r] = recordBBExits({ num: 2, evicted: 'A', departure: { name: 'A', kind: 'walkout' }, ballots: [] });
    expect(r.kind).toBe('walked');
    expect(r.truth).toBeNull();
    expect(r.segments).not.toContain('the-tape');
  });

  it('a living camper records nothing until the camp is done with them', () => {
    gs.bb.camp = [{ name: 'A' }];
    expect(recordBBExits({ num: 2, evicted: 'A', ballots: [] })).toEqual([]);
    gs.bb.camp[0].gone = true;
    const [r] = recordBBExits({ num: 4, evicted: null, ballots: [] });
    expect(r.guest).toBe('A');
  });

  it('somebody back in the house records nothing', () => {
    gs.activePlayers.push('A');
    expect(recordBBExits({ num: 2, evicted: 'A', ballots: [] })).toEqual([]);
  });
});
