// An All Stars season publishes as dras-N beside the main series.
// Plan: docs/superpowers/plans/2026-10-27-drag-race-all-stars-own-show.md (Task 3)
import { describe, it, expect } from 'vitest';
import { mergeDragSeason, mergeDragSeasonsDatabase, seasonExporterFor } from '../js/stats-export.js';
import { buildDragSeasonDocument, seasonFilePath } from '../js/dr/export.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { drLedgerRecord } from '../js/dr/ledger-record.js';
import { composeExit } from '../js/kristal-exit.js';

const AS = 'drag-race-all-stars';
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 10) {
  const rng = rngFor(1); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const drDoc = buildDragSeasonDocument(playDragSeason({ cast: cast(), seed: 1 }).rows, { seasonNumber: 1 });
const asDoc = buildDragSeasonDocument(
  playDragSeason({ cast: cast(), seed: 2, config: { drAllStars: true } }).rows,
  { seasonNumber: 1, format: AS });

describe('an All Stars season document', () => {
  it('exports an all-stars season as dras', () => {
    expect(asDoc.format).toBe(AS);
    expect(asDoc.seasonId).toBe('dras-1');
    expect(seasonFilePath(1, AS)).toBe('data/seasons/dras-1-data.json');
    expect(seasonFilePath(1)).toBe('data/seasons/dr-1-data.json');
    expect(drDoc.seasonId).toBe('dr-1');
  });

  it('is exported by the drag exporter', () => {
    expect(seasonExporterFor(AS)).toBe(seasonExporterFor('drag-race'));
  });
});

describe('merging it beside the main series', () => {
  it('dras-1 merge leaves dr-1 details alone', () => {
    let db = mergeDragSeason({}, drDoc);
    db = mergeDragSeason(db, asDoc);
    db = mergeDragSeason(db, asDoc);
    const q = db.players.find(p => p.id === 'q1');
    const apps = q.seasonDetails.map(d => `${d.format}/${d.season}`).sort();
    expect(apps).toEqual(['drag-race-all-stars/1', 'drag-race/1']);
  });

  it('seasons db keeps both rows', () => {
    let db = mergeDragSeasonsDatabase({}, drDoc);
    db = mergeDragSeasonsDatabase(db, asDoc);
    const rows = db.seasons.map(s => `${s.format}/${s.seasonNumber}`).sort();
    expect(rows).toEqual(['drag-race-all-stars/1', 'drag-race/1']);
    const as = db.seasons.find(s => s.format === AS);
    expect(as.seasonId).toBe('dras-1');
    expect(as.title).toBe('Drag Race All Stars 1');
    expect(as.hallOfFame).toBe(true);
    expect('allStars' in as).toBe(false);
    expect(db.seasons.find(s => s.format === 'drag-race').hallOfFame).toBeUndefined();
  });

  it('the merges refuse another family', () => {
    const bb = { ...drDoc, format: 'big-brother' };
    expect(() => mergeDragSeason({}, bb)).toThrow();
    expect(() => mergeDragSeasonsDatabase({}, bb)).toThrow();
  });
});

describe('what the season leaves behind', () => {
  it('files its ledger record under the show', () => {
    const rows = playDragSeason({ cast: cast(), seed: 2, config: { drAllStars: true } }).rows;
    expect(drLedgerRecord(rows, { format: AS }).format).toBe(AS);
    expect(drLedgerRecord(rows).format).toBe('drag-race');
  });

  it('records its exit interviews in Drag Race words', () => {
    const rec = { id: 'x-w3-Zed', guest: 'Zed', week: 3, kind: 'boot', mood: 'gutted', placement: 8,
      named: [], stillIn: ['Q1', 'Q2'], rivals: [], allies: [], prediction: 'Q1',
      segments: ['fan-mail', 'who-next'], reception: 'warm' };
    const say = format => composeExit({ id: 'kt-dras', record: rec, guestName: 'Zed', season: { format } },
      { words: { round: 'Episode' } });
    expect(say(AS)).toEqual(say('drag-race'));
  });
});
