// Integration-side test: the Big Brother export adapter.
//
// Owned by the integration half of the Big Brother work (see
// docs/superpowers/specs/2026-07-30-big-brother-mode-design.md). It runs the
// real engine rather than fixtures, so it fails if the week object's shape
// drifts away from the contract the spec pins down.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonFormat, twistFormat, twistsForFormat, formatIsRunnable, formatName,
  TWIST_CATALOG, defaultConfig } from '../js/core.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { extractBigBrotherSeasonTemplate, mergeBigBrotherSeason } from '../js/stats-export.js';
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

  // Written when the house had no twists of its own. What it was really
  // guarding is that a twist belongs to exactly one show and an unmarked entry
  // stays Total Drama, which is what it checks now that the house has three.
  it('files an unmarked twist under Total Drama and never shares one between shows', () => {
    expect(TWIST_CATALOG.filter(t => !t.format).every(t => twistFormat(t) === 'total-drama')).toBe(true);
    const td = twistsForFormat('total-drama');
    const bb = twistsForFormat('big-brother');
    expect(td.length + bb.length).toBe(TWIST_CATALOG.length);
    const bbIds = new Set(bb.map(t => t.id));
    expect(td.some(t => bbIds.has(t.id))).toBe(false);
    expect(bb.length).toBeGreaterThan(0);
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

describe('folding a Big Brother season into the career database', () => {
  function merged(seasonNumber = 16, existing = { players: [] }) {
    const { weeks, finalists } = runSeason(5);
    const doc = extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber });
    return { doc, db: mergeBigBrotherSeason(existing, doc) };
  }

  it('refuses a season document from the wrong show', () => {
    expect(() => mergeBigBrotherSeason({ players: [] }, { format: 'total-drama', seasonNumber: 3 }))
      .toThrow(/big-brother/);
  });

  it('gives every houseguest a career record tagged with the show', () => {
    const { db } = merged();
    expect(db.players).toHaveLength(CAST.length);
    for (const p of db.players) {
      const sd = p.seasonDetails.find(d => d.season === 16);
      expect(sd.format).toBe('big-brother');
      expect(sd.bb).toBeDefined();
      expect(p.seasons).toContain(16);
      expect(p.totalSeasons).toBe(1);
    }
  });

  it('never writes Total Drama shapes it did not measure', () => {
    const { db } = merged();
    for (const p of db.players) {
      expect(p.totalImmunityWins).toBe(0);
      expect(p.totalRewardWins).toBe(0);
      expect(p.totalIdolsFound).toBe(0);
      const sd = p.seasonDetails[0];
      expect(sd).not.toHaveProperty('idolsFound');
      expect(sd).not.toHaveProperty('immunityWins');
      expect(sd).not.toHaveProperty('tribe');
    }
  });

  it('counts HOH and veto as competition wins, and also on their own terms', () => {
    const { db } = merged();
    for (const p of db.players) {
      const bb = p.seasonDetails[0].bb;
      expect(p.totalChallengeWins).toBe(bb.hohWins + bb.vetoWins);
      expect(p.totalHohWins).toBe(bb.hohWins);
      expect(p.totalVetoWins).toBe(bb.vetoWins);
    }
    const hoh = db.players.reduce((s, p) => s + p.totalHohWins, 0);
    expect(hoh).toBeGreaterThan(0);
  });

  it('crowns exactly one winner, with a badge', () => {
    const { doc, db } = merged();
    const winners = db.players.filter(p => p.wins === 1);
    expect(winners).toHaveLength(1);
    expect(winners[0].name).toBe(doc.winner.name);
    expect(winners[0].badges).toContain('S16 Winner');
  });

  it('re-exporting a season corrects it instead of double-counting', () => {
    const { db } = merged();
    const before = JSON.parse(JSON.stringify(db));
    const { weeks, finalists } = runSeason(5);
    const doc = extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber: 16 });
    const again = mergeBigBrotherSeason(db, doc);

    expect(again.players).toHaveLength(before.players.length);
    for (const p of again.players) {
      const was = before.players.find(q => q.id === p.id);
      expect(p.totalSeasons).toBe(was.totalSeasons);
      expect(p.wins).toBe(was.wins);
      expect(p.totalChallengeWins).toBe(was.totalChallengeWins);
      expect(p.totalVotesAgainst).toBe(was.totalVotesAgainst);
      expect(p.seasonDetails.filter(d => d.season === 16)).toHaveLength(1);
      expect(p.badges.filter(b => b === 'S16 Winner')).toHaveLength(was.badges.filter(b => b === 'S16 Winner').length);
    }
  });

  it('leaves an existing Total Drama career intact and averages across both shows', () => {
    const existing = { franchise: { totalSeasons: 14, totalPlayers: 1 }, players: [{
      id: 'a', name: 'A', seasons: [14], totalSeasons: 1, wins: 1, bestPlacement: 1,
      avgPlacement: 1, totalChallengeWins: 7, totalImmunityWins: 5, totalRewardWins: 2,
      totalVotesAgainst: 3, totalIdolsFound: 1, totalJuryVotes: 6, badges: ['S14 Winner'],
      seasonDetails: [{ season: 14, placement: 1, status: 'Winner', immunityWins: 5, idolsFound: 1 }],
    }] };
    const { db } = merged(16, existing);
    const a = db.players.find(p => p.id === 'a');

    expect(a.totalImmunityWins).toBe(5);            // untouched by the Big Brother season
    expect(a.totalIdolsFound).toBe(1);
    expect(a.seasonDetails).toHaveLength(2);
    expect(a.totalSeasons).toBe(2);
    expect(a.totalChallengeWins).toBeGreaterThanOrEqual(7);

    const bbPlace = a.seasonDetails.find(d => d.season === 16).placement;
    expect(a.avgPlacement).toBeCloseTo((1 + bbPlace) / 2, 2);
    expect(a.bestPlacement).toBe(1);
    expect(db.franchise.totalSeasons).toBe(16);
  });

  it('will not walk the franchise season count backwards', () => {
    const existing = { franchise: { totalSeasons: 20 }, players: [] };
    const { db } = merged(16, existing);
    expect(db.franchise.totalSeasons).toBe(20);
  });
});

describe('which show a season is', () => {
  it('never claims an unbuilt engine is runnable', () => {
    expect(formatIsRunnable('total-drama')).toBe(true);
    // Big Brother is only runnable once the run loop actually dispatches it.
    const had = window._bbRunnable;
    window._bbRunnable = false;
    expect(formatIsRunnable('big-brother')).toBe(false);
    window._bbRunnable = true;
    expect(formatIsRunnable('big-brother')).toBe(true);
    window._bbRunnable = had;
  });

  it('names both shows', () => {
    expect(formatName('big-brother')).toBe('Big Brother');
    expect(formatName({})).toBe('Total Drama');
    expect(formatName('nonsense')).toBe('Total Drama');
  });
});
