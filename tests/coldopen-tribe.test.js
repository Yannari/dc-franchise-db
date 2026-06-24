import { describe, it, expect, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { _textColdOpen } from '../js/text-backlog.js';

function render(ep) {
  const lines = [];
  _textColdOpen(ep, s => lines.push(s), () => {});
  return lines.join('\n');
}

describe('cold open names the boot tribe (pre-merge)', () => {
  it('attributes the previous boot to their tribe and restricts the debrief', () => {
    setGs({
      isMerged: false,
      episodeHistory: [{
        num: 2, eliminated: 'Connor', isMerge: false,
        tribesAtStart: [
          { name: 'Embers', members: ['James', 'Maggy', 'Lake'] },
          { name: 'Saplings', members: ['Connor', 'Kai', 'Tess'] },
        ],
      }],
      namedAlliances: [],
    });
    const out = render({ num: 3 });
    expect(out).toContain("at Saplings's Tribal Council");
    expect(out).toContain('was on Saplings');
    expect(out).toContain('the post-Tribal debrief is Saplings members ONLY');
  });

  it('omits tribe note post-merge', () => {
    setGs({
      isMerged: true,
      episodeHistory: [{ num: 5, eliminated: 'Yul', isMerge: false, tribesAtStart: [] }],
      namedAlliances: [],
    });
    const out = render({ num: 6 });
    expect(out).toContain('Yul was voted out');
    expect(out).not.toContain('post-Tribal debrief');
  });
});
