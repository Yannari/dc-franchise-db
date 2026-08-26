import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { addCoach, bankTraining, isCoach, trainingBonus } from '../js/coaches.js';
import { promoteCoaches } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });
const STAT_KEYS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie', archetype: 'goat', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie'], coaches: [], coachTraining: {}, bonds: {}, isMerged: true });
  addCoach({ name: 'Julia', tribe: 'Red' });
});

describe('promotion', () => {
  it('puts them on the roster, which is the whole architecture paying off', () => {
    promoteCoaches({ num: 10 });
    expect(gs.activePlayers).toContain('Julia');
    expect(isCoach('Julia')).toBe(false);
  });

  it('leaves the training they gave with the people they gave it to', () => {
    bankTraining('Julia', 'Evie', 'endurance', 1.5);
    promoteCoaches({ num: 10 });
    expect(trainingBonus('Evie', 'endurance')).toBeCloseTo(1.5);
  });

  it('arrives having trained nobody on themselves pre-merge, and the stake lands only on the stake stat', () => {
    for (const stat of STAT_KEYS) {
      expect(trainingBonus('Julia', stat), `pre-promotion ${stat}`).toBe(0);
    }

    bankTraining('Julia', 'Evie', 'endurance', 1.5);
    const [out] = promoteCoaches({ num: 10 });

    for (const stat of STAT_KEYS) {
      if (stat === 'strategic') {
        expect(trainingBonus('Julia', stat), `post-promotion ${stat}`).toBeCloseTo(out.stake);
      } else {
        expect(trainingBonus('Julia', stat), `post-promotion ${stat}`).toBe(0);
      }
    }
  });

  it('rewards a coach whose protégés are still standing', () => {
    bankTraining('Julia', 'Evie', 'endurance', 1.5);
    const [out] = promoteCoaches({ num: 10 });
    expect(out.stake, 'a surviving protégé is worth something').toBeGreaterThan(0);
  });
});
