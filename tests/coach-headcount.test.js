// The rule that decides whether a camp is too small to continue.
//
// Reported repeatedly and fixed in the wrong places twice: a tribe of two
// contestants and two coaches was folded because the trigger counted
// `gs.activePlayers` on it, which is the list of people who compete and vote.
// Four people were living there. This is the count that decides it, pulled out
// of the branch so the rule can be asserted rather than inferred from a season
// that may never reach the branch.
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addCoach, tribeHeadcount } from '../js/coaches.js';

const stats = () => ({ physical:5,endurance:5,mental:5,social:5,strategic:5,loyalty:5,boldness:5,intuition:5,temperament:5 });

beforeEach(() => {
  setPlayers(['A','B','C','Bowie','Nichelle'].map(n => ({ name: n, archetype: 'floater', stats: stats() })));
  setGs({ coaches: [], coachTraining: {}, coachCards: {},
    activePlayers: ['A','B','C'],
    tribes: [{ name: 'Yellow', members: ['A','B'] }, { name: 'Red', members: ['C'] }] });
});

describe('a camp of two is two people', () => {
  it('counts coaches as people living there', () => {
    addCoach({ name: 'Bowie', tribe: 'Yellow' });
    addCoach({ name: 'Nichelle', tribe: 'Yellow' });
    const yellow = { name: 'Yellow', members: ['A','B'] };
    expect(tribeHeadcount(yellow, ['A','B','C']),
      'two contestants and two coaches is four people, not two').toBe(4);
  });

  it('still reports two for a camp of two contestants and no coach', () => {
    expect(tribeHeadcount({ name: 'Yellow', members: ['A','B'] }, ['A','B','C'])).toBe(2);
  });

  it('counts a camp of one contestant and one coach as two', () => {
    addCoach({ name: 'Bowie', tribe: 'Red' });
    expect(tribeHeadcount({ name: 'Red', members: ['C'] }, ['A','B','C'])).toBe(2);
  });

  it('counts a camp of nothing but coaches', () => {
    addCoach({ name: 'Bowie', tribe: 'Yellow' });
    expect(tribeHeadcount({ name: 'Yellow', members: [] }, ['A','B','C']),
      'a coach standing on an empty beach is still somebody').toBe(1);
  });

  it('ignores eliminated contestants still listed on the roster', () => {
    addCoach({ name: 'Bowie', tribe: 'Yellow' });
    // B has been voted out but the tribe roster has not been rewritten yet.
    expect(tribeHeadcount({ name: 'Yellow', members: ['A','B'] }, ['A','C'])).toBe(2);
  });

  it('does not count another tribe’s coach', () => {
    addCoach({ name: 'Bowie', tribe: 'Red' });
    expect(tribeHeadcount({ name: 'Yellow', members: ['A','B'] }, ['A','B','C'])).toBe(2);
  });
});
