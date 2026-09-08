// ══════════════════════════════════════════════════════════════════════
// dr-publish.test.js — the season leaves the tab
// ══════════════════════════════════════════════════════════════════════
//
// A SOURCE-AND-SHAPE guard. The worker is Cloudflare-bound and the write path
// is a Python server, so neither can be called from here — what CAN be checked
// is that neither holds its own idea of which shows exist, and that the
// document satisfies everything publish demands of it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SHOWS, DEFAULT_FORMAT } from '../js/shows.js';
import { mergeDragSeason, mergeDragSeasonsDatabase } from '../js/stats-export.js';
import { buildDragSeasonDocument, seasonFilePath } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const worker = readFileSync('worker/worker-studio.js', 'utf8');
const serve = readFileSync('serve.py', 'utf8');
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10) {
  const rng = rngFor(1); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const doc = buildDragSeasonDocument(playDragSeason({ cast: cast(), seed: 1 }).rows, { seasonNumber: 1 });
const episodes = doc.dr.episodes;

describe('the validator', () => {
  it('reads the registry rather than holding its own show list', () => {
    expect(worker).toMatch(/from '\.\.\/js\/shows\.js'/);
    expect(worker).toMatch(/SHOWS\[/);
    // A pair or triple of slugs written out is a show list, and the next show
    // falls out of it silently.
    const literalList = worker.match(/\[\s*'(?:total-drama|big-brother|traitors|drag-race)'\s*,[^\]]{0,120}\]/g) || [];
    expect(literalList, `a written-out show list: ${literalList.join(' | ')}`).toEqual([]);
  });

  it('EVERY DEFAULT IS THE DEFAULT SHOW, NAMED AS SUCH', () => {
    /* `format || 'total-drama'` and `DEFAULT_FORMAT` do the same thing and are
       not the same line: the first is a slug typed into a file that is not the
       registry, which is how `startsWith('bb-')` and `d.bb ? … : …` got here.
       The fallback is correct — every season predating the second show carries
       no tag — so this is about where the word comes from. */
    const typed = worker.match(/\|\|\s*'total-drama'/g) || [];
    expect(typed, `${typed.length} hardcoded default(s) — use DEFAULT_FORMAT`).toEqual([]);
    expect(DEFAULT_FORMAT).toBe('total-drama');
  });
});

describe('the document publish is handed', () => {
  it('carries everything publish demands', () => {
    for (const k of ['seasonNumber', 'format', 'seasonId', 'placements', 'winner', 'twists']) {
      expect(doc[k], `missing ${k}`).toBeDefined();
    }
    for (const p of doc.placements) {
      expect(p.name).toBeTruthy();
      expect(p.playerSlug).toBeTruthy();
      expect(Number.isFinite(p.placement)).toBe(true);
      expect(p.status).toBeTruthy();
    }
    expect(episodes.length).toBeGreaterThan(0);
  });

  it('carries NEITHER of the other shows\' round arrays', () => {
    // A document with a `weeks` key is a house to half this codebase, whatever
    // its format field says — `_ruFormatOfDoc` reads exactly that.
    expect(doc.weeks).toBeUndefined();
    expect(doc.votingHistory).toBeUndefined();
  });

  it('the file path, the id and the registry agree', () => {
    expect(doc.seasonId).toBe(`${SHOWS['drag-race'].prefix}-1`);
    expect(seasonFilePath(1)).toBe('data/seasons/dr-1-data.json');
    expect(seasonFilePath(1)).toContain(doc.seasonId);
  });

  it('survives the round trip publish actually performs', () => {
    // Publish is JSON over the wire and JSON on disk. A Set or a function in
    // here is a field that vanishes between the tab and the file.
    const back = JSON.parse(JSON.stringify(doc));
    expect(back).toEqual(doc);
  });
});

describe('the local write path', () => {
  it('names season files from the id, not from a Total Drama pattern', () => {
    expect(serve).toMatch(/data\/seasons|data_seasons|seasons/);
    // `season{n}-data.json` is the bare-integer rule, which is Total Drama's
    // alone; every other show is prefixed.
    expect(serve).not.toMatch(/season\{n\}-data|season%d-data/);
  });
});

describe('the database merges', () => {
  /* The season document is only a third of a publish. Without these two the
     site describes a season none of its players know they played: no row in
     seasons_database.json, no appearance on any career, nothing on the board.
     The first version of exportDragRaceSeason shipped exactly that. */
  const empty = () => ({ franchise: {}, players: [] });

  it('gives every queen an appearance tagged with THIS show', () => {
    const db = mergeDragSeason(empty(), doc);
    expect(db.players.length).toBe(doc.placements.length);
    for (const p of db.players) {
      const det = p.seasonDetails.find(d => d.season === 1);
      expect(det, `${p.name} has no season detail`).toBeTruthy();
      expect(det.format, `${p.name} is filed under the wrong show`).toBe('drag-race');
      expect(det.dr, `${p.name} carries no dr block`).toBeTruthy();
    }
  });

  it('CHALLENGE WINS IS MAXI WINS ALONE, not maxi plus lip syncs', () => {
    /* Big Brother folds two competitions into `challengeWins` because the
       house has two. A runway has one — and folding lip syncs in would make
       the field mean "nights she was on the stage at the end", which is a
       different and much commoner thing, on the number every career page,
       leaderboard and comparison already reads. */
    const db = mergeDragSeason(empty(), doc);
    for (const p of db.players) {
      const row = doc.placements.find(x => x.name === p.name);
      expect(p.totalChallengeWins, p.name).toBe(row.dr.wins);
      expect(p.totalLipsyncWins, p.name).toBe(row.dr.lipsyncWins);
    }
    const anyLipsync = doc.placements.some(x => x.dr.lipsyncWins > 0);
    expect(anyLipsync, 'no lip syncs in this season — the check is vacuous').toBe(true);
  });

  it('WRITES NO ZERO FOR A BALLOT THAT DOES NOT EXIST', () => {
    // `totalVotesAgainst: 0` from a show with no vote is indistinguishable
    // from a zero earned on a show that has one, and it would sit on a career
    // beside a camp's real total.
    const withCamp = {
      franchise: {},
      players: [{
        id: 'q1', name: 'Q1', seasons: [3], totalVotesAgainst: 7, totalJuryVotes: 2,
        seasonDetails: [{ season: 3, format: 'total-drama', placement: 4, votesReceived: 7 }],
      }],
    };
    const db = mergeDragSeason(withCamp, doc);
    const q1 = db.players.find(p => p.id === 'q1');
    expect(q1.totalVotesAgainst, 'the camp’s votes were diluted').toBe(7);
    expect(q1.totalJuryVotes).toBe(2);
  });

  it('re-publishing replaces this season and leaves the other shows alone', () => {
    const mixed = {
      franchise: {},
      players: [{
        id: 'q1', name: 'Q1', seasons: [1], wins: 1, totalChallengeWins: 4,
        badges: ['S1 Winner'],
        seasonDetails: [
          { season: 1, format: 'total-drama', placement: 1, status: 'Winner', challengeWins: 4 },
          { season: 1, format: 'drag-race', placement: 9, status: 'Stale', dr: { wins: 99 } },
        ],
      }],
    };
    const db = mergeDragSeason(mixed, doc);
    const q1 = db.players.find(p => p.id === 'q1');
    const drRows = q1.seasonDetails.filter(d => d.format === 'drag-race');
    expect(drRows.length, 'the stale drag row survived').toBe(1);
    expect(drRows[0].dr.wins).not.toBe(99);
    const tdRow = q1.seasonDetails.find(d => d.format === 'total-drama');
    expect(tdRow, 'the camp season was stripped by a drag publish').toBeTruthy();
    expect(tdRow.placement).toBe(1);
  });

  it('badges the winner with a prefixed season, never a bare integer', () => {
    const db = mergeDragSeason(empty(), doc);
    const champ = db.players.find(p => p.name === doc.placements[0].name);
    expect(champ.badges.some(b => /^DR1\b/.test(b)), champ.badges.join(', ')).toBe(true);
    expect(champ.badges).not.toContain('S1 Winner');
  });

  it('the seasons row is this show, with no jury and no tally', () => {
    const db = mergeDragSeasonsDatabase({ franchise: {}, seasons: [] }, doc);
    const row = db.seasons.find(x => x.format === 'drag-race');
    expect(row, 'no row was written').toBeTruthy();
    expect(row.seasonId).toBe('dr-1');
    expect(row.castSize).toBe(doc.castSize);
    // A jurySize of 0 is a claim about a jury that sat and cast nothing.
    expect(row.jurySize, 'a jury size was written for a show with no jury').toBeUndefined();
    expect(row.winner.vote, 'a vote tally on a show with no vote').toBe('');
    expect(row.winner.name).toBe(doc.winner.name);
    expect(row.winner.runnerUp).toBe(doc.placements[1].name);
  });

  it('names the top competitor in this show’s word', () => {
    const db = mergeDragSeasonsDatabase({ franchise: {}, seasons: [] }, doc);
    const row = db.seasons.find(x => x.format === 'drag-race');
    if (!row.awards.mostChallengeWins) return;      // a season where nobody won one
    expect(row.awards.mostChallengeWins.detail).toMatch(/maxi challenge/);
    expect(row.awards.mostChallengeWins.detail).not.toMatch(/comp wins|immunit/i);
  });

  it('hands Miss Congeniality the audience award slot', () => {
    const who = doc.placements[3].name;
    const db = mergeDragSeasonsDatabase({ franchise: {}, seasons: [] },
      { ...doc, congeniality: who });
    const row = db.seasons.find(x => x.format === 'drag-race');
    expect(row.awards.fanFavorite?.name).toBe(who);
  });

  it('leaves another show’s season 1 row untouched', () => {
    const before = { franchise: {}, seasons: [{ seasonNumber: 1, format: 'big-brother', seasonId: 'bb-1', title: 'House' }] };
    const db = mergeDragSeasonsDatabase(before, doc);
    expect(db.seasons.filter(x => x.format === 'big-brother').length).toBe(1);
    expect(db.seasons.find(x => x.format === 'big-brother').title).toBe('House');
    expect(db.seasons.filter(x => x.format === 'drag-race').length).toBe(1);
  });

  it('refuses a document from another show outright', () => {
    expect(() => mergeDragSeason(empty(), { format: 'big-brother', seasonNumber: 1 }))
      .toThrow(/drag-race/);
    expect(() => mergeDragSeasonsDatabase({ seasons: [] }, { format: 'traitors', seasonNumber: 1 }))
      .toThrow(/drag-race/);
  });
});
