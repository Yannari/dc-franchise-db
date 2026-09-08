// ══════════════════════════════════════════════════════════════════════
// dr-exporter-registration.test.js — the export dispatch knows this show
// ══════════════════════════════════════════════════════════════════════
//
// This file replaced a REFUSAL, and the refusal was doing real work: without a
// registration, asking to export a drag season fell through to the default and
// ran the Total Drama pipeline over a runway, publishing a document in the
// wrong show's shape with no error. The guards below are what that refusal was
// protecting, kept now that a real exporter can get them wrong quietly.
import { describe, expect, it, vi, beforeEach } from 'vitest';

// The mock binds `gs` ONCE at import, so the tests must mutate this object
// rather than replace it — reassigning globalThis.__gs leaves the module
// pointing at the old one, and the second test silently checked an empty
// history instead of the mixed one it set up.
globalThis.__gs = { episodeHistory: [], dr: {} };
globalThis.__cfg = { format: 'drag-race', seasonNumber: 3 };
vi.mock('../js/core.js', async orig => {
  const actual = await orig();
  return { ...actual, gs: globalThis.__gs, seasonConfig: globalThis.__cfg };
});

describe('the drag exporter', () => {
  beforeEach(() => {
    globalThis.__gs.episodeHistory.length = 0;
    globalThis.__gs.dr = {};
  });

  it('is registered, so the dispatch never falls through to another show', async () => {
    const { seasonExporterFor } = await import('../js/stats-export.js');
    const fn = seasonExporterFor('drag-race');
    expect(fn, 'drag-race has no exporter registered').toBeTruthy();
    expect(fn.name).toBe('exportDragRaceSeason');
  });

  it('refuses an empty history rather than publishing a season of nobody', async () => {
    const { exportDragRaceSeason } = await import('../js/stats-export.js');
    await expect(exportDragRaceSeason(() => {})).rejects.toThrow(/no .* season to export/i);
  });

  it('refuses rows belonging to another show', async () => {
    globalThis.__gs.episodeHistory.push(
      { num: 1, format: 'drag-race', dr: { living: ['A'] }, exits: [] },
      { num: 2, format: 'big-brother', bb: {} },
    );
    const { exportDragRaceSeason } = await import('../js/stats-export.js');
    await expect(exportDragRaceSeason(() => {})).rejects.toThrow(/big-brother/);
  });
});
