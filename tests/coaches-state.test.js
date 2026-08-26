// tests/coaches-state.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { addCoach, activeCoaches, coachesOf, isCoach, removeCoach } from '../js/coaches.js';

beforeEach(() => { setGs({ activePlayers: ['Bowie', 'Millie'], coaches: [], coachTraining: {} }); });

describe('a coach is a person who is not on the roster', () => {
  it('registers a coach without adding them to activePlayers', () => {
    addCoach({ name: 'Julia', tribe: 'Red' });
    expect(isCoach('Julia')).toBe(true);
    // The whole architecture in one assertion: 135 modules read this list to
    // decide who competes, votes, holds immunity and takes a placement.
    expect(gs.activePlayers).not.toContain('Julia');
  });

  it('does not think a contestant is a coach', () => {
    expect(isCoach('Bowie')).toBe(false);
  });

  it('finds the coaches on one tribe', () => {
    addCoach({ name: 'Julia', tribe: 'Red' });
    addCoach({ name: 'Yul', tribe: 'Blue' });
    expect(coachesOf('Red').map(c => c.name)).toEqual(['Julia']);
  });

  it('drops a coach who has been voted out', () => {
    addCoach({ name: 'Julia', tribe: 'Red' });
    removeCoach('Julia');
    expect(isCoach('Julia')).toBe(false);
    expect(activeCoaches()).toEqual([]);
  });

  it('survives being asked before any coach exists', () => {
    setGs({ activePlayers: [] });
    expect(isCoach('Anybody')).toBe(false);
    expect(activeCoaches()).toEqual([]);
    expect(coachesOf('Red')).toEqual([]);
  });
});
