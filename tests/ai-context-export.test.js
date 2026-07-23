import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setSeasonConfig } from '../js/core.js';
import { buildAIContextText } from '../js/stats-export.js';

describe('AI writing context export', () => {
  beforeEach(() => {
    setSeasonConfig({ name: 'Carnival Test', seasonNumber: 12 });
    setGs({
      initialized: true,
      episode: 2,
      phase: 'pre-merge',
      activePlayers: ['Axel', 'Bowie'],
      tribes: [{ name: 'Red', members: ['Axel'] }, { name: 'Blue', members: ['Bowie'] }],
      namedAlliances: [{ name: 'The Deal', members: ['Axel', 'Bowie'], active: true }],
      advantages: [{ holder: 'Bowie', type: 'idol' }],
      episodeHistory: [
        { num: 1, eliminated: 'Zee', summaryText: 'Episode one facts.' },
        { num: 2, eliminated: 'Raj', summaryText: 'Episode two facts.' },
      ],
    });
  });

  it('marks the latest package and carries current state plus chronological facts', () => {
    const text = buildAIContextText();
    expect(text).toContain('Latest simulated episode package: Episode 2');
    expect(text).toContain('If writing Episode 2, use Episodes 1-1 as prior continuity');
    expect(text).toContain('Players remaining (2): Axel, Bowie');
    expect(text).toContain('The Deal: Axel, Bowie');
    expect(text).toContain('Bowie: idol');
    expect(text.indexOf('===== EPISODE 1 =====')).toBeLessThan(text.indexOf('===== EPISODE 2 ====='));
    expect(text).toContain('not a prose style template');
  });

  it('returns nothing before any episode has been simulated', () => {
    setGs({ initialized: true, episodeHistory: [] });
    expect(buildAIContextText()).toBe('');
  });
});
