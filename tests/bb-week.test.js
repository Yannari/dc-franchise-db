import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { simulateBBSeason, simulateBBWeek } from '../js/bb/week.js';
import { chooseNominationPlan } from '../js/bb/strategy.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  ['A', 'mastermind'], ['B', 'social-butterfly'], ['C', 'challenge-beast'], ['D', 'schemer'],
  ['E', 'hero'], ['F', 'floater'], ['G', 'villain'], ['H', 'loyal-soldier'],
].map(([name, archetype]) => ({ name, archetype }));

function seededRng(seed = 7) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

describe('Big Brother headless week engine', () => {
  beforeEach(() => seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] }));

  it('runs the complete act sequence, excludes the outgoing HOH, and evicts one nominee', () => {
    gs.bb = { outgoingHoh: 'A', weeks: [], stats: {} };
    const week = simulateBBWeek({ rng: seededRng(12) });
    // The week now emits its own house segments between the ceremonies, each
    // carrying the phase the house is actually in.
    expect(week.acts.map(act => act.type)).toEqual([
      'house', 'hoh', 'house', 'nominations', 'house', 'veto', 'house',
      'veto-ceremony', ...week.acts.filter(a => a.type === 'campaign').map(() => 'campaign'), 'eviction',
    ]);
    expect(week.acts.every(act => !('day' in act))).toBe(true);
    expect(week.acts.find(a => a.type === 'hoh').results.map(result => result.name)).not.toContain('A');
    expect(week.finalNominees).toContain(week.evicted);
    expect(gs.activePlayers).toHaveLength(7);
    expect(gs.eliminated).toContain(week.evicted);
  });

  it('exposes every structural interception point needed by future twists', () => {
    const called = [];
    const hooks = Object.fromEntries([
      'hohResult', 'nominationResult', 'vetoParticipants', 'vetoOutcome',
      'vetoDecision', 'replacementChoice', 'voteEligibility', 'evictionResult',
    ].map(name => [name, value => { called.push(name); return value; }]));
    simulateBBWeek({ rng: () => 0.01, hooks });
    expect(called).toEqual(expect.arrayContaining([
      'hohResult', 'nominationResult', 'vetoParticipants', 'vetoOutcome',
      'vetoDecision', 'voteEligibility', 'evictionResult',
    ]));
  });

  it('records the vote position before campaigning and after each campaign act', () => {
    const week = simulateBBWeek({ rng: seededRng(3) });
    expect(Object.values(week.preCampaignVotes).reduce((a, b) => a + b, 0)).toBe(5);
    const campaigns = week.acts.filter(act => act.type === 'campaign');
    expect(campaigns).toHaveLength(2);
    expect(campaigns.every(day => day.events.length > 0)).toBe(true);
    expect(campaigns.every(act => act.votesAfterAct)).toBe(true);
  });

  it('uses bonds in directed nomination strategy', () => {
    setBond('A', 'B', 9);
    setBond('A', 'G', -9);
    const plan = chooseNominationPlan('A', gs.activePlayers, () => 0.99);
    expect(plan.nominees).toContain('G');
    expect(plan.target).toBe('G');
    expect(plan.rankings.find(entry => entry.name === 'G').score)
      .toBeGreaterThan(plan.rankings.find(entry => entry.name === 'B').score);
    if (plan.nominees.includes('B')) expect(plan.pawn).toBe('B');
  });

  it('can run a full season to a final three without invoking Total Drama rules', () => {
    const result = simulateBBSeason({ rng: seededRng(44), finaleSize: 3 });
    expect(result.weeks).toHaveLength(5);
    expect(result.finalists).toHaveLength(3);
    expect(gs.bb.weeks).toHaveLength(5);
    expect(gs.eliminated).toHaveLength(5);
  });
});
