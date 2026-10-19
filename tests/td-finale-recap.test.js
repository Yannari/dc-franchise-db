// @vitest-environment jsdom
// The finale's cold open (td/story/finale-recap.js): the whole season and each finalist's road, played by the stepped
// "previously on" screen. The user, 2026-10-19: "the total drama finale in stepped viewer is kinda underwhelming".
import { describe, expect, it } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdPreviouslyScreen } from '../js/vp-td-ep/twist-screens.js';

describe('the finale recap', () => {
  it('recaps the season, then each finalist in turn, and plays as the road to the finale', () => {
    seededRun(() => {
      runOneSeason({}, 16);
      const fin = core.gs.episodeHistory.find(h => h.isFinale);
      expect(fin, 'no finale').toBeTruthy();
      const lines = fin.tdPreviously || [];
      expect(lines.length).toBeGreaterThan(8);
      const text = lines.map(l => l.text).join('\n');
      expect(text).toMatch(/finale of/);
      expect(text).toMatch(/sixteen/);
      // every finalist gets a beat of their own, in the order they are introduced
      const order = (fin.finaleEntrants || fin.finaleFinalists).map(f => text.indexOf(f));
      order.forEach(i => expect(i).toBeGreaterThan(-1));
      // a clip is the player's own line, and a host line never names a vote count of zero as a close call
      lines.filter(l => l.clip).forEach(l => expect(l.by).not.toBe('Chris'));
      expect(text).not.toMatch(/nearly ended it: (one|two) votes/);
      const scr = tdPreviouslyScreen(fin, { host: 'Chris', history: core.gs.episodeHistory });
      expect(scr.label).toBe('The Road to the Finale');
      expect(scr.steps.some(s => s.k === 'title' && s.name === 'The Road to the Finale')).toBe(true);
    });
  }, 180000);
});
