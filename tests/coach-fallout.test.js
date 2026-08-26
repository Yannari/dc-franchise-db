// tests/coach-fallout.test.js
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addCoach } from '../js/coaches.js';
import { coachFallout } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie', archetype: 'goat', stats: stats() },
    { name: 'Finn', archetype: 'villain', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {} });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

const block = {
  sessions: [{ coach: 'Julia', contestant: 'Evie', stat: 'endurance', gain: 0.8 }],
  passedOver: [{ coach: 'Julia', contestant: 'Finn' }],
};

describe('the fallout', () => {
  it('produces events for both halves', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    expect(out.length).toBeGreaterThan(0);
  });

  it('gives every event the players it is about', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    for (const e of out) {
      expect(Array.isArray(e.players), 'a camp event without players is not one').toBe(true);
      expect(e.players.length).toBeGreaterThan(0);
      expect(e.badgeText, 'every camp event needs an explicit badge').toBeTruthy();
      expect(e.badgeClass).toBeTruthy();
    }
  });

  it('never prints another show’s vocabulary', () => {
    const out = coachFallout({ num: 4 }, { tribeName: 'Red', members: ['Evie', 'Finn'] }, block);
    const text = out.map(e => e.text).join(' ').toLowerCase();
    for (const wrong of ['evicted', 'nominated', 'houseguest', 'veto']) {
      expect(text).not.toContain(wrong);
    }
  });
});
