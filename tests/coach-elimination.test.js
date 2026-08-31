import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addBond } from '../js/bonds.js';
import { addCoach, bankTraining, isCoach, trainingBonus } from '../js/coaches.js';
import { eliminateCoach } from '../js/coach-episode.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers([
    { name: 'Julia', archetype: 'schemer', stats: stats() },
    { name: 'Evie',  archetype: 'goat',    stats: stats() },
    { name: 'Finn',  archetype: 'villain', stats: stats() },
  ]);
  setGs({ activePlayers: ['Evie', 'Finn'], coaches: [], coachTraining: {}, bonds: {}, episode: 5 });
  addCoach({ name: 'Julia', tribe: 'Red' });
  bankTraining('Julia', 'Evie', 'endurance', 1.4);
});

describe('voting out a coach', () => {
  it('destroys what they built — the cost that makes them worth keeping', () => {
    eliminateCoach({ num: 5 }, 'Julia');
    expect(trainingBonus('Evie', 'endurance')).toBe(0);
  });

  it('takes them off the coach list', () => {
    eliminateCoach({ num: 5 }, 'Julia');
    expect(isCoach('Julia')).toBe(false);
  });

  it('makes a close protégé grieve and a distant one shrug', () => {
    addBond('Julia', 'Evie', 8);
    addBond('Julia', 'Finn', -6);
    const out = eliminateCoach({ num: 5 }, 'Julia');
    const evie = out.reactions.find(r => r.contestant === 'Evie');
    const finn = out.reactions.find(r => r.contestant === 'Finn');
    expect(evie.kind).toBe('grief');
    expect(finn.kind).toBe('relief');
  });

  it('reports what was lost so the fallout can name it', () => {
    const out = eliminateCoach({ num: 5 }, 'Julia');
    expect(out.lost).toEqual({ Evie: { endurance: 1.4 } });
  });
});
