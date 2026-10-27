// A season's ranking, computed without the page: the rows the calculator reads
// off a season document, the scores it gives them, and the board it writes.
// The tool's buttons call the same three functions, so a board built from a
// script and one built by hand cannot disagree.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ruRowsFromDoc, ruScoreRows, ruApplyResults, ruEmptyBoard, RU_WINNER_FLOOR }
  from '../js/rankings-update.js';

const dr1 = JSON.parse(readFileSync('data/seasons/dr-1-data.json', 'utf8'));

describe('the rows a season document gives the calculator', () => {
  const rows = ruRowsFromDoc(dr1);

  it('has every queen, in finishing order', () => {
    expect(rows).toHaveLength(dr1.placements.length);
    expect(rows.map(r => r.placement)).toEqual([...rows.map(r => r.placement)].sort((a, b) => a - b));
  });

  it("reads Drag Race's own columns", () => {
    const winner = dr1.placements.find(p => p.placement === 1);
    const row = rows.find(r => r.name === winner.name);
    expect(row.immWins).toBe(winner.dr.wins);
    expect(row.rewWins).toBe(winner.dr.lipsyncWins);
    expect(row.comp3Wins).toBe(winner.dr.smackdownCrowns ?? 0);   // the Smackdown crown
    expect(row.strategicScore).toBe(winner.dr.ppe ?? 0);          // points per episode
    expect(row.socialCol).toBe(winner.dr.bottoms);
  });

  it('ticks Miss Congeniality', () => {
    const cong = dr1.awards?.fanFavorite?.name || dr1.congeniality;
    if (cong) expect(rows.find(r => r.name === cong).fanFav).toBe(true);
    expect(rows.filter(r => r.fanFav).length).toBeLessThanOrEqual(1);
  });
});

describe('scoring them onto an empty board', () => {
  const rows = ruRowsFromDoc(dr1);
  const results = ruScoreRows(rows, { board: ruEmptyBoard('drag-race'), castSize: rows.length, format: 'drag-race' });

  it('scores everybody, the winner at least at the champion floor', () => {
    expect(results).toHaveLength(rows.length);
    for (const r of results) expect(Number.isFinite(r.newScore)).toBe(true);
    expect(results.find(r => r.placement === 1).newScore).toBeGreaterThanOrEqual(RU_WINNER_FLOOR);
    expect(results.every(r => r.isNew)).toBe(true);
  });

  it('writes a ranked board that says what it ranks', () => {
    const board = ruEmptyBoard('drag-race');
    ruApplyResults(board, results, { seasonNum: 1, format: 'drag-race' });
    expect(board.rankings).toHaveLength(rows.length);
    expect(board.rankings.map(p => p.rank)).toEqual(rows.map((_, i) => i + 1));
    const scores = board.rankings.map(p => p.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(board.metadata.format).toBe('drag-race');
    expect(board.metadata.totalPlayers).toBe(rows.length);
    const w = board.rankings.find(p => p.name === results.find(r => r.placement === 1).name);
    expect(w.wins).toBe(1);
    expect(w.placements).toEqual([1]);
    expect(typeof w.reasoning).toBe('string');
  });

  it('an All Stars season lands on the Drag Race board', () => {
    expect(ruEmptyBoard('drag-race-all-stars').metadata.format).toBe('drag-race');
  });
});

describe('the worker names the board the way the site reads it', () => {
  it('files a spin-off under its family', () => {
    const src = readFileSync('worker/worker-studio.js', 'utf8');
    const fn = src.slice(src.indexOf('function rankingsPathFor'), src.indexOf('function rankingsPathFor') + 400);
    expect(fn).toMatch(/familyOf\(format\)/);
  });
});

// "Use current season": the document comes from the show's own builder.
import { ruSeasonDocument } from '../js/rankings-update.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

describe('the season in the simulator, as a document', () => {
  const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
  const cast = () => { const rng = rngFor(3); const r = () => 1 + Math.floor(rng() * 10);
    return Array.from({ length: 10 }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
      stats: Object.fromEntries(STATS.map(k => [k, r()])),
      drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } })); };

  it('builds a Drag Race All Stars document from the drag rows', () => {
    const rows = playDragSeason({ cast: cast(), seed: 5, config: { drAllStars: true } }).rows;
    const doc = ruSeasonDocument({ episodeHistory: rows, seasonNumber: 2, dr: {} }, { format: 'drag-race-all-stars' });
    expect(doc.format).toBe('drag-race-all-stars');
    expect(doc.seasonId).toBe('dras-2');
    expect(doc.placements).toHaveLength(10);
    expect(ruRowsFromDoc(doc)[0].placement).toBe(1);
  });

  it('refuses a Challenge season that has not reached its final', () => {
    expect(() => ruSeasonDocument({ episodeHistory: [], seasonNumber: 1 }, { format: 'the-challenge' })).toThrow(/final/);
  });

  it('refuses a Circle season with no ledger record', () => {
    expect(() => ruSeasonDocument({ episodeHistory: [], seasonNumber: 1 }, { format: 'the-circle' })).toThrow(/record|finale|play/i);
  });

  it('leaves Total Drama to its own template', () => {
    expect(ruSeasonDocument({ episodeHistory: [] }, { format: 'total-drama' })).toBeNull();
  });
});

// Every show with a ranking currency has its own board, and the calculator
// reads each show's audience award however its document spells it.
import { boardFile } from '../js/ranking-boards.js';
describe('boards for The Challenge and The Circle', () => {
  it('have their own files, never the Total Drama board', () => {
    expect(boardFile('the-challenge')).toBe('rankings_ch.json');
    expect(boardFile('the-circle')).toBe('rankings_ci.json');
  });
  it("tick The Circle's fan favourite", () => {
    const ci1 = JSON.parse(readFileSync('data/seasons/ci-1-data.json', 'utf8'));
    const fav = ci1.fanFavourite?.name || ci1.fanFavourite;
    const rows = ruRowsFromDoc(ci1);
    expect(rows.filter(r => r.fanFav).map(r => r.name)).toEqual(fav ? [fav] : []);
  });
});

describe('a show with one competition', () => {
  it('scores The Circle without its missing second column', () => {
    const ci1 = JSON.parse(readFileSync('data/seasons/ci-1-data.json', 'utf8'));
    const rows = ruRowsFromDoc(ci1);
    const res = ruScoreRows(rows, { board: ruEmptyBoard('the-circle'), castSize: rows.length, format: 'the-circle' });
    expect(res.every(r => Number.isFinite(r.newScore))).toBe(true);
  });
});
