import { beforeEach, describe, expect, it } from 'vitest';
import { setGs } from '../js/core.js';
import { addCoach, bankTraining, revokeCoachTraining, trainingBonus, trainingTotal } from '../js/coaches.js';

beforeEach(() => {
  setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {} });
  addCoach({ name: 'Julia', tribe: 'Red' });
  addCoach({ name: 'Yul', tribe: 'Red' });
});

describe('training is banked per coach', () => {
  it("sums a contestant's bonus across every coach who taught them", () => {
    bankTraining('Julia', 'Evie', 'endurance', 1.0);
    bankTraining('Yul', 'Evie', 'endurance', 0.5);
    expect(trainingBonus('Evie', 'endurance')).toBeCloseTo(1.5);
  });

  it('gives back exactly what one coach built, and only that', () => {
    // This is why the store is keyed by coach first: gs.riTraining is keyed by
    // player and cannot answer "what did THIS coach build?", which is the one
    // question voting a coach out has to ask.
    bankTraining('Julia', 'Evie', 'endurance', 1.0);
    bankTraining('Yul', 'Evie', 'endurance', 0.5);
    const lost = revokeCoachTraining('Julia');
    expect(lost).toEqual({ Evie: { endurance: 1.0 } });
    expect(trainingBonus('Evie', 'endurance')).toBeCloseTo(0.5);
  });

  it('caps a contestant at 3.0 across all stats and all coaches', () => {
    bankTraining('Julia', 'Evie', 'endurance', 2.5);
    const banked = bankTraining('Yul', 'Evie', 'mental', 1.5);
    expect(banked, 'only the headroom is taken').toBeCloseTo(0.5);
    expect(trainingTotal('Evie')).toBeCloseTo(3.0);
  });

  it('lets a bad coach do damage past the cap', () => {
    // The cap bounds help, not harm. A temperament-2 coach teaching temperament
    // must be able to make somebody worse however much good they have banked.
    bankTraining('Julia', 'Evie', 'endurance', 3.0);
    bankTraining('Yul', 'Evie', 'temperament', -1.2);
    expect(trainingBonus('Evie', 'temperament')).toBeCloseTo(-1.2);
  });

  it('returns zero for a contestant nobody has trained', () => {
    expect(trainingBonus('Nobody', 'mental')).toBe(0);
    expect(trainingTotal('Nobody')).toBe(0);
  });
});
