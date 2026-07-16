import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { rememberStrategy } from '../js/strategy-memory.js';
import { evaluateEmotionalDefection } from '../js/voting.js';
import { seedGame } from './helpers/setup.js';

const tribe = ['Alice', 'Bob', 'Cara', 'Dave', 'Eve', 'Finn', 'Gwen'];
const alliancePlan = { type: 'alliance', label: 'The Core', members: ['Alice', 'Finn', 'Gwen'], target: 'Cara' };
const counterPlan = { type: 'consensus', label: "Dave's group", members: ['Dave', 'Eve'], target: 'Bob' };

function evaluate(overrides = {}) {
  return evaluateEmotionalDefection(
    'Alice', 'Cara', tribe, overrides.alliances || [alliancePlan, counterPlan], [], [],
    overrides.emotional || 'comfortable', overrides.roll || (() => 0)
  );
}

describe('temperament-driven emotional defections', () => {
  beforeEach(() => {
    seedGame(tribe.map(name => ({
      name,
      stats: name === 'Alice'
        ? { temperament: 2, loyalty: 4, strategic: 5, intuition: 6, boldness: 7 }
        : {},
    })), { episode: 4, phase: 'post-merge', isMerged: true, strategicMemories: {}, namedAlliances: [] });
    setBond('Alice', 'Dave', 2);
    rememberStrategy('Alice', 'Bob', 'eliminated-ally', 4, 2.2, { ally: 'Zoe' });
  });

  it('lets a volatile player join a visible, viable revenge plan', () => {
    const result = evaluate();

    expect(result?.target).toBe('Bob');
    expect(result?.estimatedSupport).toBe(3); // Dave, Eve, and Alice
    expect(result?.majority).toBe(4);
    expect(result?.confidence).toBeGreaterThanOrEqual(result?.requiredConfidence);
  });

  it('does not invent numbers when nobody is visibly supporting the target', () => {
    const result = evaluate({ alliances: [alliancePlan] });

    expect(result).toBeNull();
  });

  it('keeps calm players disciplined with the same uncertain coalition', () => {
    const alice = gs.activePlayers.includes('Alice');
    expect(alice).toBe(true);
    // Replace Alice's low temperament while preserving the rest of the fixture.
    const player = players.find(p => p.name === 'Alice');
    player.stats.temperament = 9;

    expect(evaluate()).toBeNull();
  });

  it('still requires the emotional action roll after the numbers check passes', () => {
    expect(evaluate({ roll: () => 0.999 })).toBeNull();
  });

  it('records an explainable diagnostic for both restraint and defection', () => {
    const held = [];
    const heldResult = evaluateEmotionalDefection('Alice', 'Cara', tribe, [alliancePlan, counterPlan], [], [], 'comfortable', () => 0.999, held);
    expect(heldResult).toBeNull();
    expect(held[0]).toMatchObject({ voter: 'Alice', target: 'Bob', decision: 'held-plan', decisionReason: 'discipline-won' });

    const moved = [];
    evaluateEmotionalDefection('Alice', 'Cara', tribe, [alliancePlan, counterPlan], [], [], 'comfortable', () => 0, moved);
    expect(moved[0]).toMatchObject({ voter: 'Alice', target: 'Bob', decision: 'defected', estimatedSupport: 3, majority: 4 });
    expect(moved[0].actChance).toBeGreaterThan(0);
  });

  it('gives brand-new alliances extra protection from shaky revenge flips', () => {
    gs.namedAlliances = [{ name: 'The Core', members: alliancePlan.members, active: true, formed: 5 }];
    const thinCounterPlan = { ...counterPlan, members: ['Dave'] }; // Alice sees only 2/4 votes
    expect(evaluate({ alliances: [alliancePlan, thinCounterPlan], emotional: 'desperate' })).toBeNull();
  });
});
