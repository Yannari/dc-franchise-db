import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { addPerceivedBond, getPerceivedBond, setBond } from '../js/bonds.js';
import { nominationScore } from '../js/bb/strategy.js';
import { updateBBPerceptions } from '../js/bb/shared-strategy.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  { name:'A', archetype:'floater', stats:{ intuition:2, mental:3, loyalty:7 } },
  { name:'B', archetype:'mastermind', stats:{ social:9, strategic:9 } },
  ...['C','D','E','F','G','H'].map(name => ({ name, archetype:'floater' })),
];
const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('Big Brother perceived-bond lifecycle adapter', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], perceivedBonds:{} }));

  it('corrects an existing misread toward reality without changing the real bond', () => {
    setBond('A','B',0);
    addPerceivedBond('A','B',7,'villain-manipulation');
    const result = updateBBPerceptions({ house:gs.activePlayers, week:{num:2}, rng:() => 1, maxNew:0 });
    expect(getPerceivedBond('A','B')).toBeGreaterThan(0);
    expect(getPerceivedBond('A','B')).toBeLessThan(7);
    expect(result.corrected).toHaveLength(1);
    expect(gs.bonds['A||B']).toBe(0);
  });

  it('creates a directional manipulation blind spot for a weak reader', () => {
    setBond('A','B',0);
    const result = updateBBPerceptions({ house:gs.activePlayers, week:{num:1}, rng:() => 0, maxNew:1 });
    expect(result.created[0]).toMatchObject({ observer:'A', subject:'B', reason:'villain-manipulation' });
    expect(getPerceivedBond('A','B')).toBeGreaterThan(0);
    expect(getPerceivedBond('B','A')).toBe(0);
  });

  it('removes perceptions involving an evicted player', () => {
    addPerceivedBond('A','B',5,'test');
    const result = updateBBPerceptions({ house:gs.activePlayers.filter(name => name !== 'B'), week:{num:2}, rng:() => 1, maxNew:0 });
    expect(result.removed).toContain('A→B');
    expect(gs.perceivedBonds['A→B']).toBeUndefined();
  });

  it('corrects faster when public nomination evidence contradicts the read', () => {
    setBond('A','B',0); setBond('A','C',0);
    addPerceivedBond('A','B',6,'villain-manipulation');
    addPerceivedBond('A','C',6,'villain-manipulation');
    updateBBPerceptions({ house:gs.activePlayers, week:{num:2, hoh:'B', initialNominees:['A','D']}, rng:() => 1, maxNew:0 });
    expect(getPerceivedBond('A','B')).toBeLessThan(getPerceivedBond('A','C'));
  });

  it('lets the same true bond produce a different nomination read', () => {
    setBond('A','B',0);
    const baseline = nominationScore('A','B',() => 0.5);
    addPerceivedBond('A','B',6,'villain-manipulation');
    const misread = nominationScore('A','B',() => 0.5);
    expect(misread).toBeLessThan(baseline - 4);
  });

  it('settles perception changes once at the end of a real week', () => {
    const week = simulateBBWeek({ rng:rng(19) });
    expect(week.perceptionChanges).toEqual(expect.objectContaining({ corrected:expect.any(Array), created:expect.any(Array), removed:expect.any(Array) }));
  });
});
