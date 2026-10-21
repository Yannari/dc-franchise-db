// A shot is lifted only while the dialogue bar is over the bottom of the picture (the user, 2026-10-21: "what is this
// black bar in all the screens?"): a narration card steps the bar aside, and a shot still lifted for a bar that was not
// there showed the dark strip under the plate across the bottom of every card. With no bar over it the shot comes
// back down and the picture fills the frame; a close-up stays inside the plate.
import { describe, it, expect } from 'vitest';
import { framed, barShown } from '../js/vp-rr-ep/steps.js';

describe('rr viewer: the lift follows the bar', () => {
  it('knows when the bar is on the picture', () => {
    expect(barShown({ part: 'say', text: 'Go!' })).toBe(true);
    expect(barShown({ part: 'pause', text: '. . .' })).toBe(true);
    expect(barShown({ part: 'beat', text: 'Sami jumps.' })).toBe(false);
    expect(barShown({ part: 'card', text: '' })).toBe(false);
    expect(barShown({ part: 'tip', text: 'Detour' })).toBe(false);
    expect(barShown(null)).toBe(false);
  });
  it('lifts a wide shot under the bar and not without it', () => {
    expect(framed({ shot: 'wide', s: 1, x: 0, y: 12 }, true).y).toBe(12);
    expect(framed({ shot: 'wide', s: 1, x: 0, y: 12 }, false).y).toBe(0);
  });
  it('keeps a close-up inside the plate without the bar', () => {
    const f = framed({ shot: 'two', s: 2, x: 20, y: 60 }, false);
    expect(f.y + 100 / f.s).toBeLessThanOrEqual(100);
    expect(f).toMatchObject({ s: 2, x: 20 });
    expect(framed({ shot: 'two', s: 2, x: 20, y: 60 }, true).y).toBe(60);
  });
});
