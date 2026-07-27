// @vitest-environment jsdom
// The Carnival Rescue finale (rescue-mission format) must fully retranscribe
// its six-act VP — including the bench assignments — into the finale summary.
import { describe, expect, it } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

describe('carnival rescue finale text backlog', () => {
  it('finale summary contains all six acts, the benches, and the champion', () => {
    seededRun(() => {
      runOneSeason({ finaleFormat: 'rescue-mission' });
      const finale = (core.gs.episodeHistory || []).find(h => h.isFinale);
      expect(finale, 'season never reached a finale').toBeTruthy();
      expect(finale.rescueData, 'rescue-mission finale did not produce rescueData').toBeTruthy();
      const text = finale.summaryText || '';
      expect(text).toContain('CARNIVAL RESCUE — THE FINAL CHALLENGE');
      ['ACT 1 — CORN MAZE', 'ACT 2 — HAUNTED HOUSE', 'ACT 3 — PIRATE SHIP',
       'ACT 4 — WATERSLIDE', 'ACT 5 — LAKE RESCUE', 'ACT 6 — FINAL DRIVE', 'CHAMPION']
        .forEach(section => expect(text).toContain(section));
      // Bench assignments (who roots for whom) render on the title card.
      expect(text).toMatch(/Rooting for/i);
      // The winner is named inside the transcription.
      const winner = typeof core.gs.finaleResult?.winner === 'object'
        ? core.gs.finaleResult.winner?.name : core.gs.finaleResult?.winner;
      expect(winner).toBeTruthy();
      expect(text).toContain(winner);
    });
  }, 120000);
});
