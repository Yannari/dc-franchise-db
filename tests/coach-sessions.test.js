// tests/coach-sessions.test.js
import { describe, expect, it } from 'vitest';
import { pickSessionTargets, sessionGain, teachableStat } from '../js/coach-agenda.js';

const stats = over => ({
  physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...over,
});

describe('a coach teaches what they are good at', () => {
  it('picks their strongest discipline', () => {
    expect(teachableStat(stats({ endurance: 9 }))).toBe('endurance');
    expect(teachableStat(stats({ strategic: 10, endurance: 9 }))).toBe('strategic');
  });
});

describe('a bad coach teaches badly', () => {
  it('helps when the coach is good at it', () => {
    expect(sessionGain(9, 5, () => 0.5)).toBeGreaterThan(0);
  });

  it('DAMAGES when the coach is bad at it', () => {
    // Not a smaller bonus — damage. A temperament-2 coach running temperament
    // sessions teaches a contestant to detonate.
    expect(sessionGain(2, 5, () => 0.5)).toBeLessThan(0);
  });

  it('teaches better to somebody who trusts them', () => {
    expect(sessionGain(9, 8, () => 0.5)).toBeGreaterThan(sessionGain(9, -8, () => 0.5));
  });
});

describe('who gets the session', () => {
  const candidates = [
    { name: 'Evie', stats: stats({ endurance: 2, social: 2, strategic: 2 }), bond: 0, atRisk: 0 },
    { name: 'Finn', stats: stats({ endurance: 8, social: 9, strategic: 9 }), bond: 0, atRisk: 0 },
  ];

  it('sends a challenge-beast after the biggest gain', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats({ endurance: 9 }), archetype: 'challenge-beast', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked, 'the weakest gains most').toEqual(['Evie']);
  });

  it('sends a mastermind after the vote', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats({ strategic: 9, loyalty: 1 }), archetype: 'mastermind', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked, 'influence over improvement').toEqual(['Finn']);
  });

  it('never spends more sessions than it has', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats(), archetype: 'hero', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked).toHaveLength(1);
  });

  it('leaves somebody out, which is the whole point', () => {
    const picked = pickSessionTargets({
      coach: { stats: stats(), archetype: 'hero', vulnerability: 0 },
      candidates, sessions: 1, roll: () => 0.5,
    });
    expect(picked.length).toBeLessThan(candidates.length);
  });
});
