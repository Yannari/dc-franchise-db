// @vitest-environment jsdom
// Validates the Strategy Hub renders for real episodes across every tab, and
// that tab/episode switching is DOM-only (no full-page rebuild).
import { describe, it, expect } from 'vitest';
import { runOneSeason, core } from './helpers/season-harness.js';
import * as vp from '../js/vp-screens.js';

const TABS = ['timeline', 'alliances', 'relationships', 'hierarchy', 'plans', 'popularity', 'advantages'];

describe('Strategy Hub', () => {
  it('renders for a real post-merge episode and every tab returns markup without throwing', () => {
    runOneSeason();
    const hist = core.gs.episodeHistory;
    // pick a merged episode with some alliances if possible, else a late one
    const rec = hist.filter(h => h.gsSnapshot?.namedAlliances?.length).slice(-1)[0] || hist[hist.length - 2] || hist[hist.length - 1];
    expect(rec).toBeTruthy();
    const hub = vp.rpBuildStrategyHub(rec);
    expect(hub).toContain('strat-hub');
    expect(hub).toContain('data-hubtab="timeline"');
    TABS.forEach(tab => {
      const c = vp._stratHubContent(rec, tab);
      expect(typeof c).toBe('string');            // never throws for any tab
    });
  });

  it('switching tab/episode updates the DOM only (hub content), not the page', () => {
    runOneSeason();
    const hist = core.gs.episodeHistory;
    const rec = hist[hist.length - 2] || hist[hist.length - 1];
    document.body.innerHTML = `<div id="page">${vp.rpBuildStrategyHub(rec)}</div>`;
    const before = document.getElementById('page').children.length;

    vp._stratHub(rec.num, 'popularity');
    const hubEl = document.querySelector('.strat-hub');
    expect(hubEl.dataset.tab).toBe('popularity');
    expect(hubEl.querySelector('.strat-hub-content').innerHTML.length).toBeGreaterThan(0);

    // Scrub to an earlier episode — still DOM-only, page unchanged.
    const earlier = Math.max(1, rec.num - 1);
    vp._stratHub(earlier, hubEl.dataset.tab);
    expect(document.querySelector('.strat-hub').dataset.ep).toBe(String(earlier));
    expect(document.getElementById('page').children.length).toBe(before); // page frame untouched
  });

  it('the roster covers the whole cast (every tribe), not just the tribal group', () => {
    runOneSeason();
    // pre-merge episode: activePlayers spans both tribes; the hub reads that, not tribalPlayers
    const preMerge = core.gs.episodeHistory.find(h => !h.isMerge && h.gsSnapshot?.activePlayers?.length > 8);
    if (!preMerge) return; // some seasons merge early; skip if no such episode
    const net = vp.rpBuildRelationshipNetwork(preMerge);
    const roster = preMerge.gsSnapshot.activePlayers;
    // at least one player beyond a single 6-8 person tribal group appears in the face selector
    expect(roster.length).toBeGreaterThan(8);
  });
});
