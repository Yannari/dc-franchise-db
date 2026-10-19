// @vitest-environment jsdom
// A coach voted out is recorded on ep.coachElimination and never on ep.eliminated
// (coach-episode.js nulls it). The export's placement walker and the Aftermath
// read only the second, so every coach was filed "Unknown" under the whole cast
// and never came to an Aftermath or the reunion (2026-10-19, a 25-player
// Redemption Island season with coaches).
import { describe, it, expect } from 'vitest';
import { runHeadlessSeason } from './helpers/coach-season.js';
import * as core from '../js/core.js';
import { extractSeasonTemplate } from '../js/stats-export.js';
import { generateAftermathShow } from '../js/aftermath.js';

describe('coaches in the export and at the reunion', () => {
  it('every person in the season is placed, nobody is Unknown, and everyone reaches the reunion', async () => {
    let s = 7919;
    const rnd = Math.random;
    Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    try {
      const { episodes, coachNames } = await runHeadlessSeason({
        twist: 'coaches', coachesPerTribe: 1, castSize: 25, mergeAt: 13,
        config: { ri: true, riReentryAt: 13, riFormat: 'redemption', seasonNumber: 99, aftermath: 'enabled' },
      });
      const everyone = core.players.map(p => p.name);
      const pl = extractSeasonTemplate().placements;
      expect(pl.map(p => p.name).sort()).toEqual([...everyone].sort());
      expect(new Set(pl.map(p => p.placement)).size).toBe(everyone.length);
      expect(pl.filter(p => p.phase === 'Unknown').map(p => p.name)).toEqual([]);

      const booted = core.gs.episodeHistory.flatMap(h => (h.coachElimination || []).map(c => c.coach));
      expect(booted.length).toBeGreaterThan(0); // the sample has to contain the case
      const fin = episodes[episodes.length - 1].ep;
      if (!fin.aftermath) generateAftermathShow(fin);
      const reu = fin.aftermath;
      const onStage = new Set([...(reu.peanutGallery || []), ...(reu.interviews || []).map(i => i.player)]);
      expect(everyone.filter(n => !onStage.has(n))).toEqual([]);
      expect(coachNames.every(n => onStage.has(n))).toBe(true);
    } finally {
      Math.random = rnd;
    }
  }, 300000);
});
