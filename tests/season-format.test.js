// Integration-side test: the Big Brother export adapter.
//
// Owned by the integration half of the Big Brother work (see
// docs/superpowers/specs/2026-07-30-big-brother-mode-design.md). It runs the
// real engine rather than fixtures, so it fails if the week object's shape
// drifts away from the contract the spec pins down.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonFormat, twistFormat, twistsForFormat, TWIST_CATALOG, defaultConfig } from '../js/core.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { extractBigBrotherSeasonTemplate } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind'], ['B', 'social-butterfly'], ['C', 'challenge-beast'], ['D', 'schemer'],
  ['E', 'hero'], ['F', 'floater'], ['G', 'villain'], ['H', 'loyal-soldier'],
  ['I', 'underdog'], ['J', 'goat'],
].map(([name, archetype]) => ({ name, archetype }));

function seededRng(seed = 5) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function runSeason(seed = 5) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {} };
  const { weeks, finalists } = simulateBBSeason({ rng: seededRng(seed), finaleSize: 3 });
  return { weeks, finalists };
}

describe('show formats', () => {
  it('treats everything written before Big Brother as Total Drama', () => {
    expect(seasonFormat({})).toBe('total-drama');
    expect(seasonFormat({ format: 'big-brother' })).toBe('big-brother');
    expect(seasonFormat({ format: 'wrestling' })).toBe('total-drama');
    expect(defaultConfig().format).toBe('total-drama');
  });

  it('files every existing twist under Total Drama without editing the catalog', () => {
    expect(TWIST_CATALOG.every(t => twistFormat(t) === 'total-drama')).toBe(true);
    expect(twistsForFormat('total-drama')).toHaveLength(TWIST_CATALOG.length);
    expect(twistsForFormat('big-brother')).toHaveLength(0);
  });
});

describe('Big Brother season export', () => {
  let season;
  beforeEach(() => {
    const { weeks, finalists } = runSeason(5);
    season = extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber: 16, jurySize: 5 });
  });

  it('tags the format so the site can group it', () => {
    expect(season.format).toBe('big-brother');
    expect(season.seasonNumber).toBe(16);
  });

  it('places every houseguest exactly once, 1..N', () => {
    const places = season.placements.map(p => p.placement).sort((a, b) => a - b);
    expect(places).toEqual(Array.from({ length: CAST.length }, (_, i) => i + 1));
    expect(new Set(season.placements.map(p => p.name)).size).toBe(CAST.length);
  });

  it('gives the winner first place and the last evictee last', () => {
    expect(season.placements[0].placement).toBe(1);
    expect(season.placements[0].name).toBe(season.winner.name);
    expect(season.placements.at(-1).placement).toBe(CAST.length);
  });

  it('keeps the shared fields flat so existing readers still work', () => {
    for (const p of season.placements) {
      expect(p).toHaveProperty('placement');
      expect(p).toHaveProperty('status');
      expect(p).toHaveProperty('votesReceived');
      expect(p).toHaveProperty('playerSlug');
    }
  });

  it('nests Big Brother stats under bb, never alongside Total Drama ones', () => {
    for (const p of season.placements) {
      expect(p.bb).toBeDefined();
      expect(p).not.toHaveProperty('immunityWins');
      expect(p).not.toHaveProperty('idolsFound');
    }
  });

  it('counts one HOH and one veto per week across the cast', () => {
    const total = key => season.placements.reduce((sum, p) => sum + p.bb[key], 0);
    expect(total('hohWins')).toBe(season.weeks.length);
    expect(total('vetoWins')).toBe(season.weeks.length);
  });

  it('only counts someone as saved when the veto actually moved them', () => {
    const saved = season.placements.reduce((sum, p) => sum + p.bb.timesSaved, 0);
    const movedWeeks = season.weeks.filter(w =>
      (w.initialNominees || []).some(n => !(w.finalNominees || []).includes(n))).length;
    expect(saved).toBe(movedWeeks);
  });

  it('distinguishes being nominated from reaching the block', () => {
    for (const p of season.placements) {
      expect(p.bb.timesOnBlock).toBeLessThanOrEqual(p.bb.timesNominated);
    }
  });

  it('produces a season with the same episode count as weeks played', () => {
    expect(season.episodeCount).toBe(season.weeks.length);
    expect(season.weeks.every(w => w.evicted)).toBe(true);
  });

  it('is stable across seeds — no cast size produces a broken document', () => {
    for (const seed of [11, 29, 74]) {
      const { weeks, finalists } = runSeason(seed);
      const doc = extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber: 17 });
      expect(doc.placements).toHaveLength(CAST.length);
      expect(doc.placements[0].status).toBe('Winner');
    }
  });
});
