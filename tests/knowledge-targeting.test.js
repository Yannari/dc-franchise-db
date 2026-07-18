// The payoff: a voter's BELIEF (incl. a planted lie) shifts who they target.
// beliefTargetMod is the knowledge-driven nudge added inside pickTarget's score.
import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { beliefTargetMod, attackersSuspectIdol } from '../js/alliances.js';
import { recordPlantedLie } from '../js/knowledge-integration.js';
import { recordFact, learn } from '../js/knowledge.js';
import { gs } from '../js/core.js';

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

describe('decisions read beliefs: idol reactions are belief-gated', () => {
  it('no knowledge and not public → no suspicion (information asymmetry)', () => {
    expect(attackersSuspectIdol(['A'], 'V')).toBe(false);
  });

  it('a publicly-revealed idol → everyone suspects', () => {
    gs.knownIdolHoldersThisEp = new Set(['V']);
    expect(attackersSuspectIdol(['A'], 'V')).toBe(true);
    gs.knownIdolHoldersThisEp = null;
  });

  it('only an attacker who actually learned it suspects', () => {
    recordFact({ type: 'idol', subject: 'V', truth: true, ep: 5 });
    learn('A', 'idol:V', { sourceType: 'observed', ep: 5 });
    expect(attackersSuspectIdol(['A'], 'V')).toBe(true);
    expect(attackersSuspectIdol(['W'], 'V')).toBe(false);   // W never found out
  });

  it('a dismissed false rumor does not count as suspicion', () => {
    recordFact({ type: 'idol', subject: 'V', truth: true, ep: 5 });
    // force a "false"-valence belief (they concluded the rumor was bogus)
    const f = recordFact({ type: 'idol', subject: 'V', truth: true, ep: 5 });
    f.beliefs['A'] = { confidence: 0.7, source: 'rumor', sourceType: 'rumor', valence: 'false', learnedEp: 5, knowsOthersKnow: [] };
    expect(attackersSuspectIdol(['A'], 'V')).toBe(false);
  });
});
