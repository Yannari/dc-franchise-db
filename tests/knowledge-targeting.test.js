// The payoff: a voter's BELIEF (incl. a planted lie) shifts who they target.
// beliefTargetMod is the knowledge-driven nudge added inside pickTarget's score.
import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { beliefTargetMod } from '../js/alliances.js';
import { recordPlantedLie } from '../js/knowledge-integration.js';

beforeEach(() => seedGame(['A', 'V', 'W'], { episode: 5, knowledge: {} }));

describe('decisions read beliefs: planted lie → targeting nudge', () => {
  it('no belief → no nudge', () => {
    expect(beliefTargetMod(['A'], 'V')).toBe(0);
  });

  it('a fooled attacker (swallowed the lie) nudges the accused up', () => {
    recordPlantedLie({ liar: 'W', victim: 'A', accused: 'V', believed: true, ep: 5 });
    expect(beliefTargetMod(['A'], 'V')).toBeGreaterThan(0.5);
    // ...but not toward an unrelated player
    expect(beliefTargetMod(['A'], 'W')).toBe(0);
  });

  it('a DETECTED lie gives NO nudge — they saw through it', () => {
    recordPlantedLie({ liar: 'W', victim: 'A', accused: 'V', believed: false, ep: 5 });
    expect(beliefTargetMod(['A'], 'V')).toBe(0);
  });

  it('nudges scale with how many attackers were fooled', () => {
    seedGame(['A', 'B', 'V', 'W'], { episode: 5, knowledge: {} });
    recordPlantedLie({ liar: 'W', victim: 'A', accused: 'V', believed: true, ep: 5 });
    recordPlantedLie({ liar: 'W', victim: 'B', accused: 'V', believed: true, ep: 5 });
    const two = beliefTargetMod(['A', 'B'], 'V');
    const one = beliefTargetMod(['A'], 'V');
    expect(two).toBeGreaterThan(one);
  });
});
