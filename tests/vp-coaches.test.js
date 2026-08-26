// @vitest-environment jsdom
// tests/vp-coaches.test.js
import { describe, expect, it } from 'vitest';
import { rpBuildCoachBoard } from '../js/vp-coaches.js';

const ep = {
  num: 4,
  coachData: {
    Red: {
      sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 }],
      passedOver: [{ coach: 'Julia', contestant: 'Finn' }],
    },
  },
};

describe('the coaches’ board', () => {
  it('draws the session that happened', () => {
    const html = rpBuildCoachBoard(ep);
    expect(html).toContain('Julia');
    expect(html).toContain('Evie');
    expect(html).toContain('endurance');
  });

  it('names who was passed over — the neglect is the story', () => {
    expect(rpBuildCoachBoard(ep)).toContain('Finn');
  });

  it('uses Total Drama words and no Big Brother ones', () => {
    const html = rpBuildCoachBoard(ep).toLowerCase();
    for (const wrong of ['evicted', 'nominated', 'houseguest', 'head of household', 'veto']) {
      expect(html, `${wrong} must never appear on a Total Drama screen`).not.toContain(wrong);
    }
  });

  it('renders nothing rather than throwing on an episode with no coaching', () => {
    expect(() => rpBuildCoachBoard({ num: 1 })).not.toThrow();
  });

  it('carries its own class prefix and a reduced-motion fallback', () => {
    const html = rpBuildCoachBoard(ep);
    expect(html).toMatch(/cb-/);
    expect(html).toMatch(/prefers-reduced-motion/);
  });
});
