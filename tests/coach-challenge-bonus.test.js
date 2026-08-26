import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { setGs, setPlayers } from '../js/core.js';
import { addCoach, bankTraining } from '../js/coaches.js';
import { simulateLastChance } from '../js/challenges-core.js';

describe('banked training is worth something', () => {
  it('is added to the stat the challenge actually reads', () => {
    // Rescue Island already does exactly this with _getTrainingBonus; the
    // coaches' bank has to reach the same place or the whole twist is a number
    // nobody ever feels.
    const core = readFileSync('js/challenges-core.js', 'utf8');
    expect(core, 'challenges-core must import the coach bank')
      .toMatch(/import \{[^}]*trainingBonus[^}]*\} from '\.\/coaches\.js'/);
    expect(core, 'and apply it where a stat is read')
      .toMatch(/trainingBonus\(/);
  });

  it('does not put coaches in a challenge', () => {
    const core = readFileSync('js/challenges-core.js', 'utf8');
    // Coaches are not in gs.activePlayers, so nothing here should need to
    // filter them out — if a filter appears, the architecture has leaked.
    expect(core).not.toMatch(/isCoach\(/);
  });

  describe('the last-chance duel', () => {
    // An elimination duel is the single place banked training matters most:
    // training that evaporates here is training that does not count when it
    // counts. Both duelists have identical stats so the only thing that can
    // separate them is the bank.
    let randomSpy;

    beforeEach(() => {
      setGs({ activePlayers: ['Evie', 'Yul'], coaches: [], coachTraining: {} });
      setPlayers([
        { name: 'Evie', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } },
        { name: 'Yul', stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 } },
      ]);
      addCoach({ name: 'Julia', tribe: 'Red' });
      // Math.random() = 0 fixes the duel pick (index 0) and zeroes both
      // duelists' random noise identically, so the bank is the only variable.
      randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
      randomSpy.mockRestore();
    });

    it('lets banked training win a tied duel', () => {
      bankTraining('Julia', 'Evie', 'physical', 2.0);
      const result = simulateLastChance('Evie', 'Yul');
      expect(result.winner).toBe('Evie');
    });
  });
});
