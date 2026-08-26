import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

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
});
