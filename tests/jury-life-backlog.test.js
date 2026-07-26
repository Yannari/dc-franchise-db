// @vitest-environment jsdom
// The Jury Life villa segment (jury-elimination twist) must appear in the text
// backlog — a retranscription of the rpBuildJuryLife VP screen. Runs a real
// season with the twist scheduled post-merge (season-harness handles the
// window-global shims the VP builders need).
import { describe, expect, it } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

describe('jury life text backlog (jury-elimination twist)', () => {
  it('the twist episode summary includes the JURY LIFE villa section', () => {
    seededRun(() => {
      runOneSeason({ twistSchedule: [{ episode: 12, type: 'jury-elimination' }] });
      const h = (core.gs.episodeHistory || []).find(entry =>
        (entry.twists || []).some(t => t.type === 'jury-elimination' && (t.elimLog || []).length >= 2));
      expect(h, 'jury-elimination twist never fired with 2+ jurors').toBeTruthy();
      expect(h.summaryText).toContain('JURY LIFE — THE JURY VILLA');
      // The section body must actually name at least one juror.
      const section = h.summaryText.split('JURY LIFE — THE JURY VILLA')[1] || '';
      const jurors = [...new Set(h.twists.find(t => t.type === 'jury-elimination').elimLog.map(v => v.juror))];
      expect(jurors.some(j => section.includes(j))).toBe(true);
      // Episodes WITHOUT the twist never get the section.
      const other = (core.gs.episodeHistory || []).find(entry => entry !== h && entry.summaryText);
      expect(other.summaryText).not.toContain('JURY LIFE — THE JURY VILLA');
    });
  }, 120000);
});
