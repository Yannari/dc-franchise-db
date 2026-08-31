// episode.js has FOUR call sites that produce a runTribal(...)-shaped result
// object ({ eliminated, votes, log, ... }) — the main tribal, the double-tribal
// merged council, the multi-tribal per-tribe loop, and the double-boot second
// vote. All four must run the result through applyCoachElimination() before
// any contestant-only elimination machinery (double-elim, exile duel, RI/jury
// routing, gs.activePlayers filtering) reads result.eliminated — otherwise a
// coach's name flows into that machinery, which is a silent no-op for a name
// that was never in gs.activePlayers: removeCoach/revokeCoachTraining never
// run, and the coach quietly keeps coaching with training intact.
//
// simulateEpisode's internal runTribal() calls are not directly reachable from
// a unit test (they're closures inside one enormous function, not exported).
// What IS exported and unit-testable is the exact gate every one of those four
// call sites was changed to route through: applyCoachElimination(ep, result).
// This test proves that gate does the real job — genuine removal from the
// coach list and genuine revocation of banked training — using a bare
// runTribal-shaped result object, not a full simulateEpisode() run.
import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { addCoach, bankTraining, isCoach, trainingBonus } from '../js/coaches.js';
import { applyCoachElimination } from '../js/coach-episode.js';

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

describe('applyCoachElimination — the gate every non-primary tribal path routes through', () => {
  it('genuinely removes the coach, not just flags them', () => {
    const result = { eliminated: 'Julia', votes: { Julia: 2 }, log: [] };
    applyCoachElimination({ num: 5 }, result);
    expect(isCoach('Julia')).toBe(false);
  });

  it('genuinely revokes their banked training, not just leaves it standing', () => {
    const result = { eliminated: 'Julia', votes: { Julia: 2 }, log: [] };
    applyCoachElimination({ num: 5 }, result);
    expect(trainingBonus('Evie', 'endurance')).toBe(0);
  });

  it('nulls result.eliminated so downstream contestant-elimination code cannot run against a coach name', () => {
    const result = { eliminated: 'Julia', votes: { Julia: 2 }, log: [] };
    applyCoachElimination({ num: 5 }, result);
    expect(result.eliminated).toBeNull();
  });

  it('records the fallout on the episode the same way the primary path does', () => {
    const ep = { num: 5 };
    applyCoachElimination(ep, { eliminated: 'Julia', votes: {}, log: [] });
    expect(ep.coachElimination?.[0]?.coach).toBe('Julia');
  });

  it('does nothing to a real contestant — the ordinary path is untouched', () => {
    const result = { eliminated: 'Evie', votes: { Evie: 2 }, log: [] };
    const fired = applyCoachElimination({ num: 5 }, result);
    expect(fired).toBe(false);
    expect(result.eliminated).toBe('Evie');
    expect(isCoach('Julia')).toBe(true); // untouched — nobody else was voted out
  });

  it('is a no-op on a null/no-elimination result (ties, cancelled votes)', () => {
    const result = { eliminated: null, votes: {}, log: [] };
    const fired = applyCoachElimination({ num: 5 }, result);
    expect(fired).toBe(false);
    expect(result.eliminated).toBeNull();
  });
});
