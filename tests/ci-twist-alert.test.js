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

  // The user, 2026-10-20: "im getting 2 different alert screen now fix that keep the new one remove the old one".
  it('one alert screen per twist: the explained one; a scene that was an alert plays after it in the apartment', () => {
    const swap = { kind: 'swap', stage: 'ui', steps: [] };
    const out = withTwistAlerts({ ci: {} }, [swap, { ...swap }]);
    expect(out.map(s => s.kind)).toEqual(['twist', 'swap', 'swap']);
    const disrupter = { kind: 'disrupter', stage: 'alert', steps: [] };
    const d = withTwistAlerts({ ci: {} }, [disrupter]);
    expect(d.map(s => [s.kind, s.stage])).toEqual([['twist', 'explain'], ['disrupter', 'apt']]);
  });

  it('the Circle\'s old one-line alert for a night\'s format gives way to the explained one, and the Ratings get no second', () => {
    const old = { kind: 'alert', stage: 'alert', steps: [{ text: "'The top-rated Player will block alone.'" }] };
    const out = withTwistAlerts({ ci: { night: { format: 'secret' } } }, [old, { kind: 'chat', stage: 'apt', steps: [] }, rate]);
    expect(out.map(s => s.kind)).toEqual(['twist', 'chat', 'ratings']);
    expect(out.filter(s => s.stage === 'alert' || s.stage === 'explain')).toHaveLength(1);
  });
});
