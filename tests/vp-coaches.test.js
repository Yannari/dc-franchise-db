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

// The sealed half of the card, read like a vote. The peers signed or refused
// before a single ballot was cast and the coach it was played for does not
// know which — so this is read BEFORE the votes, or the ending is given away
// twice.
describe('the signatures are read out', () => {
  it('renders every peer verdict with its reason, and wires its own reveals', async () => {
    const { rpBuildCoachSignatures } = await import('../js/vp-coaches.js');
    const html = rpBuildCoachSignatures({ num: 6, coachCardCommits: [
      { coach: 'Julia', tribe: 'Red', signed: false, refusedBy: 'Wayne',
        votes: [{ coach: 'Wayne', consents: false, reason: 'costs-my-protege' },
                { coach: 'Ada', consents: true, reason: 'debt' }] }] });
    expect(html).toContain('REFUSED');
    expect(html).toContain('SIGNED');
    expect(html).toContain('their own protégé');
    expect(html).toContain('Not unanimous');
    // Two signatures plus the outcome card = three steps.
    expect(html).toContain("coachRevealNext('cb-sigs',3)");
    expect(html).not.toContain('undefined');
  });

  it('draws nothing at all when no card was played', async () => {
    const { rpBuildCoachSignatures } = await import('../js/vp-coaches.js');
    expect(rpBuildCoachSignatures({ num: 6 })).toBe('');
  });

  it('says the card is live when every peer signed', async () => {
    const { rpBuildCoachSignatures } = await import('../js/vp-coaches.js');
    const html = rpBuildCoachSignatures({ num: 6, coachCardCommits: [
      { coach: 'Julia', tribe: 'Red', signed: true, refusedBy: null,
        votes: [{ coach: 'Wayne', consents: true, reason: 'allied' }] }] });
    expect(html).toContain('Unanimous');
    expect(html).toContain('they run together');
  });
});

