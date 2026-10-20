// ci-twist-alert.test.js — every twist is announced by an alert that says how
// it works (the user, 2026-10-20: the alerts are "not explained very well, we
// should have a screen with the explanation of the twist in an alert screen").
import { describe, expect, it } from 'vitest';
import { TWIST_CATALOG } from '../js/core.js';
import { sentencesOf, twistOf, withTwistAlerts } from '../js/vp-ci/twist-alert.js';

const circleCards = TWIST_CATALOG.filter(t => t.format === 'the-circle');

describe('the explanation', () => {
  it('every Circle twist card has one: at least two sentences, none of them a note for the author', () => {
    for (const c of circleCards) {
      const s = sentencesOf(c.desc);
      expect(s.length, c.id).toBeGreaterThanOrEqual(2);
      for (const x of s) expect(x, c.id).not.toMatch(/\b(needs two|the timeline|booked|it was made for)\b/i);
    }
  });
});

describe('the alert screen', () => {
  const rate = { kind: 'ratings', stage: 'rate', steps: [] };
  it('a Ratings night that isn\'t the usual is announced before the Ratings, with its name and how it works', () => {
    const out = withTwistAlerts({ ci: { night: { format: 'secret' } } }, [rate]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ kind: 'twist', stage: 'explain', d: { name: 'Secret Influencers' } });
    expect(out[0].steps[0].text).toBe('Alert! Secret Influencers.');
    expect(out[0].steps.length).toBeGreaterThan(2);
    expect(out[1]).toBe(rate);
  });

  it('the usual night, and a newcomer who just snoops, need no alert', () => {
    expect(withTwistAlerts({ ci: { night: { format: 'standard' } } }, [rate])).toHaveLength(1);
    expect(twistOf({ ci: {} }, { kind: 'arrival', d: { entry: 'snoop' } })).toBeNull();
    expect(twistOf({ ci: {} }, { kind: 'arrival', d: { entry: 'party' } })?.id).toBe('ci-arrive-party');
    expect(twistOf({ ci: {} }, { kind: 'power-reveal', d: { power: 'joker' } })?.id).toBe('ci-power-joker');
  });

  it('a twist with a scene of its own is explained once a day; an in-world alert is read first, then explained', () => {
    const swap = { kind: 'swap', stage: 'ui', steps: [] };
    const out = withTwistAlerts({ ci: {} }, [swap, { ...swap }]);
    expect(out.map(s => s.kind)).toEqual(['twist', 'swap', 'swap']);
    const disrupter = { kind: 'disrupter', stage: 'alert', steps: [] };
    expect(withTwistAlerts({ ci: {} }, [disrupter]).map(s => s.kind)).toEqual(['disrupter', 'twist']);
  });
});
