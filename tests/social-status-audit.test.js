// @vitest-environment jsdom
// #8 calibration: status must not lock the same people at the top or turn
// outsiders into automatic boots. Runs full seasons and inspects the frozen
// per-episode hierarchy snapshots.
import { describe, it, expect } from 'vitest';
import { runOneSeason, core } from './helpers/season-harness.js';

const isActive = (status, name, role) => Boolean(status?.[name]?.[role]?.active);

describe('#8 social-status calibration audit', () => {
  it('does not lock the top or auto-boot outsiders across full seasons', () => {
    const N = Number.parseInt(process.env.SS_SEASONS || '30', 10);
    let bootTotal = 0, outsiderBoots = 0;
    let fieldSlots = 0, outsiderSlots = 0;
    let centerObservations = 0; const centerHolders = new Set();
    let centerEpisodes = 0, distinctCenterTop = 0;

    for (let s = 0; s < N; s++) {
      runOneSeason();
      const hist = core.gs.episodeHistory;
      for (let i = 0; i < hist.length; i++) {
        const prior = hist[i - 1]?.gsSnapshot?.socialStatus;   // status going INTO this tribal
        const ep = hist[i];
        // Boots: was the eliminated an outsider going in?
        if (ep.eliminated && prior) {
          bootTotal++;
          if (isActive(prior, ep.eliminated, 'outsider')) outsiderBoots++;
        }
        // Field composition (from each frozen snapshot): outsider prevalence.
        const status = ep.gsSnapshot?.socialStatus || {};
        const field = Object.keys(status);
        if (field.length) {
          fieldSlots += field.length;
          outsiderSlots += field.filter(n => isActive(status, n, 'outsider')).length;
          // Top social-center holder this episode (lock-in tracking, per season).
          const centers = field.filter(n => isActive(status, n, 'social-center'))
            .sort((a, b) => (status[b]['social-center'].score) - (status[a]['social-center'].score));
          if (centers.length) { centerObservations++; centerHolders.add(`${s}:${centers[0]}`); }
        }
      }
      // Per-season churn: how many DISTINCT players ever held top social-center.
      const perSeasonTops = new Set();
      let eps = 0;
      hist.forEach(ep => {
        const status = ep.gsSnapshot?.socialStatus || {};
        const centers = Object.keys(status).filter(n => isActive(status, n, 'social-center'))
          .sort((a, b) => (status[b]['social-center'].score) - (status[a]['social-center'].score));
        if (centers.length) { perSeasonTops.add(centers[0]); eps++; }
      });
      if (eps > 0) { centerEpisodes += eps; distinctCenterTop += perSeasonTops.size; }
    }

    const outsiderBootRate = bootTotal ? outsiderBoots / bootTotal : 0;
    const outsiderFieldShare = fieldSlots ? outsiderSlots / fieldSlots : 0;
    const centerChurn = centerEpisodes ? distinctCenterTop / (centerEpisodes / Math.max(1, N)) / N : 0; // ~distinct tops per season / eps-per-season

    console.table([{
      seasons: N,
      'outsider boot rate': (outsiderBootRate * 100).toFixed(1) + '%',
      'outsider field share': (outsiderFieldShare * 100).toFixed(1) + '%',
      'distinct top-center / season': (distinctCenterTop / N).toFixed(1),
      'avg center-active eps / season': (centerEpisodes / N).toFixed(1),
    }]);

    // Outsiders are naturally more vulnerable, but must NOT be automatic boots.
    expect(outsiderBootRate).toBeLessThan(0.75);
    // The top of the hierarchy must move — not one locked social center all season.
    expect(distinctCenterTop / N).toBeGreaterThan(1.3);
  }, 120000);
});
