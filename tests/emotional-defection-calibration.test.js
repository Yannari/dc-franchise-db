import { describe, expect, it } from 'vitest';
import { setBond } from '../js/bonds.js';
import { rememberStrategy } from '../js/strategy-memory.js';
import { evaluateEmotionalDefection } from '../js/voting.js';
import { seedGame } from './helpers/setup.js';

const tribe = ['Alice', 'Bob', 'Cara', 'Dave', 'Eve', 'Finn', 'Gwen'];
const alliancePlan = { type: 'alliance', label: 'The Core', members: ['Alice', 'Finn', 'Gwen'], target: 'Cara' };
const plans = {
  none: [alliancePlan],
  weak: [alliancePlan, { type: 'consensus', label: 'Dave', members: ['Dave'], target: 'Bob' }],
  viable: [alliancePlan, { type: 'consensus', label: "Dave's group", members: ['Dave', 'Eve'], target: 'Bob' }],
  strong: [alliancePlan, { type: 'consensus', label: "Dave's group", members: ['Dave', 'Eve', 'Finn'], target: 'Bob' }],
};

function lcg(seed) {
  let state = seed >>> 0;
  return () => ((state = (1664525 * state + 1013904223) >>> 0) / 0x100000000);
}

function measure({ temperament, loyalty = 5, strategic = 5, boldness = 5, emotional = 'comfortable', support = 'viable', newAlliance = false }, trials = 5000) {
  seedGame(tribe.map(name => ({ name, stats: name === 'Alice'
    ? { temperament, loyalty, strategic, intuition: 6, boldness }
    : {} })), {
    episode: 4, phase: 'post-merge', isMerged: true, strategicMemories: {},
    namedAlliances: newAlliance ? [{ name: 'The Core', members: alliancePlan.members, active: true, formed: 5 }] : [],
  });
  setBond('Alice', 'Dave', 2);
  rememberStrategy('Alice', 'Bob', 'eliminated-ally', 4, 2.2, { ally: 'Zoe' });
  const random = lcg(20260715);
  let defections = 0;
  for (let i = 0; i < trials; i++) {
    if (evaluateEmotionalDefection('Alice', 'Cara', tribe, plans[support], [], [], emotional, random)) defections++;
  }
  return defections / trials;
}

describe('emotional defection calibration', () => {
  it('stays within the initial realism bands', () => {
    const results = [
      { scenario: 'no visible support / volatile', rate: measure({ temperament: 2, loyalty: 4, boldness: 7, support: 'none' }), min: 0, max: 0 },
      { scenario: 'weak numbers / calm', rate: measure({ temperament: 9, support: 'weak' }), min: 0, max: 0.05 },
      { scenario: 'weak numbers / volatile + uneasy', rate: measure({ temperament: 2, loyalty: 4, boldness: 7, emotional: 'uneasy', support: 'weak' }), min: 0.10, max: 0.24 },
      { scenario: 'viable plan / average', rate: measure({ temperament: 5, support: 'viable' }), min: 0.12, max: 0.28 },
      { scenario: 'viable plan / volatile', rate: measure({ temperament: 2, loyalty: 4, boldness: 7, support: 'viable' }), min: 0.20, max: 0.36 },
      { scenario: 'strong plan / volatile', rate: measure({ temperament: 2, loyalty: 4, boldness: 7, support: 'strong' }), min: 0.32, max: 0.48 },
      { scenario: 'new alliance / volatile', rate: measure({ temperament: 2, loyalty: 4, boldness: 7, support: 'viable', newAlliance: true }), min: 0.14, max: 0.28 },
    ];

    console.table(results.map(r => ({ scenario: r.scenario, rate: `${(r.rate * 100).toFixed(1)}%`, band: `${(r.min * 100).toFixed(0)}-${(r.max * 100).toFixed(0)}%` })));
    results.forEach(({ scenario, rate, min, max }) => {
      expect(rate, `${scenario} below band`).toBeGreaterThanOrEqual(min);
      expect(rate, `${scenario} above band`).toBeLessThanOrEqual(max);
    });
    const volatile = results.find(r => r.scenario === 'viable plan / volatile').rate;
    const protectedNew = results.find(r => r.scenario === 'new alliance / volatile').rate;
    expect(protectedNew).toBeLessThan(volatile);
  });
});
