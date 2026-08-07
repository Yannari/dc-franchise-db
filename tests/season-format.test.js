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
import { extractBigBrotherSeasonTemplate, mergeBigBrotherSeason,
  mergeBigBrotherSeasonsDatabase } from '../js/stats-export.js';
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
    // BB16, not S16. Both merges used to write the bare `S${n} Winner`, so a
    // Big Brother winner and the Total Drama winner of the same-numbered season
    // wore identical badges — and on a crossover career, both at once.
    expect(winners[0].badges).toContain('BB16 Winner');
    expect(winners[0].badges).not.toContain('S16 Winner');
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

describe('recording a Big Brother season in seasons_database.json', () => {
  function seasonDoc(seasonNumber = 1) {
    const { weeks, finalists } = runSeason(5);
    return extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber });
  }

  it('refuses a season document from the wrong show', () => {
    expect(() => mergeBigBrotherSeasonsDatabase({ seasons: [] }, { format: 'total-drama', seasonNumber: 3 }))
      .toThrow(/big-brother/);
  });

  it('writes a season record the sync can match a Big Brother detail against', () => {
    // The point of the whole function. /api/sync-seasons validates every season
    // detail against the (format, season_number) pairs it finds here; a detail
    // with no matching record is dropped with ok:true and nothing but
    // counts.skipped moving, so the failure mode is a silent one.
    const doc = seasonDoc(1);
    const db = mergeBigBrotherSeasonsDatabase({ franchise: {}, seasons: [] }, doc);
    const rec = db.seasons.find(s => s.format === 'big-brother' && s.seasonNumber === 1);
    expect(rec, 'no Big Brother season record was written').toBeTruthy();
    expect(rec.seasonId).toBe('bb-1');
    expect(rec.winner.name).toBe(doc.winner.name);
    expect(rec.status).toBe('Complete');
    expect(rec.episodeCount).toBeGreaterThan(0);
  });

  it('leaves the Total Drama season with the same number alone', () => {
    // `seasons` is keyed (format, season_number), so these are two different
    // seasons. A number-only dedupe would delete one to write the other.
    const existing = { franchise: { totalSeasons: 14 }, seasons: [
      { seasonNumber: 1, format: 'total-drama', seasonId: 'td-1', title: 'Total Drama One' },
      { seasonNumber: 2, format: 'total-drama', seasonId: 'td-2', title: 'Total Drama Two' },
    ] };
    const db = mergeBigBrotherSeasonsDatabase(existing, seasonDoc(1));
    expect(db.seasons).toHaveLength(3);
    expect(db.seasons.find(s => s.seasonId === 'td-1')?.title).toBe('Total Drama One');
    expect(db.seasons.filter(s => s.seasonId === 'bb-1')).toHaveLength(1);
  });

  it('re-exporting replaces its own record and only its own', () => {
    const existing = { franchise: {}, seasons: [
      { seasonNumber: 1, format: 'total-drama', seasonId: 'td-1', title: 'Total Drama One' },
    ] };
    const once = mergeBigBrotherSeasonsDatabase(existing, seasonDoc(1));
    const twice = mergeBigBrotherSeasonsDatabase(once, seasonDoc(1));
    expect(twice.seasons.filter(s => s.seasonId === 'bb-1')).toHaveLength(1);
    expect(twice.seasons.filter(s => s.seasonId === 'td-1')).toHaveLength(1);
  });

  it('never walks the franchise season count backwards', () => {
    const db = mergeBigBrotherSeasonsDatabase({ franchise: { totalSeasons: 14 }, seasons: [] }, seasonDoc(1));
    expect(db.franchise.totalSeasons).toBe(14);
  });
});

describe('two shows, one career', () => {
  it('counts a season in each show as two seasons, one per show', () => {
    // A player who did Total Drama 1 and Big Brother 1 is a two-season veteran
    // with one season on each résumé. `player.seasons` holds bare NUMBERS, so
    // both collapse to a single `1` in it — counting that array would file them
    // as a rookie. totalSeasons comes off the format-tagged details instead.
    const { weeks, finalists } = runSeason(5);
    const doc = extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber: 1 });
    const name = doc.placements[0].name;

    const existing = { players: [{
      id: name.toLowerCase(), name,
      seasons: [1], totalSeasons: 1, wins: 0, totalChallengeWins: 4,
      totalVotesAgainst: 2, badges: [],
      seasonDetails: [{ season: 1, format: 'total-drama', seasonId: 'td-1',
        placement: 3, status: 'Jury', challengeWins: 4, votesReceived: 2 }],
    }] };

    const db = mergeBigBrotherSeason(existing, doc);
    const player = db.players.find(p => p.name === name);

    expect(player.seasonDetails).toHaveLength(2);
    expect(player.totalSeasons, 'the Total Drama season was swallowed').toBe(2);
    expect(player.byShow['total-drama'].seasons).toBe(1);
    expect(player.byShow['big-brother'].seasons).toBe(1);
    // The Total Drama season's own numbers survive untouched.
    expect(player.byShow['total-drama'].totalChallengeWins).toBe(4);
    expect(player.seasonDetails.find(d => d.format === 'total-drama').placement).toBe(3);
  });

  it('re-exporting Big Brother 1 does not strip the Total Drama 1 detail', () => {
    // The dedupe used to match on season number alone, so this run found the
    // Total Drama detail, subtracted THAT show's numbers from the career totals
    // and deleted it.
    const { weeks, finalists } = runSeason(5);
    const doc = extractBigBrotherSeasonTemplate(weeks, finalists, { seasonNumber: 1 });
    const name = doc.placements[0].name;
    const existing = { players: [{
      id: name.toLowerCase(), name,
      seasons: [1], totalSeasons: 1, wins: 0, totalChallengeWins: 4,
      totalVotesAgainst: 2, badges: [],
      seasonDetails: [{ season: 1, format: 'total-drama', seasonId: 'td-1',
        placement: 3, status: 'Jury', challengeWins: 4, votesReceived: 2 }],
    }] };

    const once = mergeBigBrotherSeason(existing, doc);
    const twice = mergeBigBrotherSeason(once, doc);
    const player = twice.players.find(p => p.name === name);

    expect(player.seasonDetails.filter(d => d.format === 'total-drama')).toHaveLength(1);
    expect(player.seasonDetails.filter(d => d.format === 'big-brother')).toHaveLength(1);
    expect(player.totalSeasons).toBe(2);
    expect(player.byShow['total-drama'].totalChallengeWins).toBe(4);
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
