import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { resolveBBCampaignAct } from '../js/bb/shared-strategy.js';
import { simulateBBWeek } from '../js/bb/week.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  { name:'A', archetype:'social-butterfly', stats:{ social:9, strategic:7, loyalty:7 } },
  { name:'B', archetype:'hero', stats:{ social:6, strategic:5, loyalty:8 } },
  ...['C','D','E','F','G','H'].map(name => ({ name, archetype:'floater' })),
];
const seeded = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

describe('Big Brother shared campaign adapter', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], playerStates:{} }));

  it('uses shared pitch responses to move a persuadable ballot', () => {
    setBond('C','A',6); setBond('C','B',-2);
    const ballots = [{ voter:'C', evict:'A', margin:0.2, changed:false }, { voter:'D', evict:'A', margin:1, changed:false }, { voter:'E', evict:'B', margin:3, changed:false }];
    const result = resolveBBCampaignAct({ nominees:['A','B'], ballots, house:gs.activePlayers, rng:() => 0 });
    expect(result.pitches.flatMap(pitch => pitch.responses).every(response => typeof response.acceptChance === 'number' && response.reason)).toBe(true);
    expect(ballots.find(ballot => ballot.voter === 'C')).toMatchObject({ evict:'B', changed:true, changedBy:'A', changeReason:'accepted-campaign-pitch' });
  });

  it('resolves competing pitches before applying incompatible commitments', () => {
    setBond('C','A',5); setBond('C','B',5);
    const ballots = [{ voter:'C', evict:'A', margin:0, changed:false }, { voter:'D', evict:'B', margin:0, changed:false }, { voter:'E', evict:'A', margin:0, changed:false }];
    const result = resolveBBCampaignAct({ nominees:['A','B'], ballots, house:gs.activePlayers, rng:() => 0 });
    const retainedBy = result.pitches.filter(pitch => pitch.flipped.includes('C'));
    expect(retainedBy.length).toBeLessThanOrEqual(1);
  });

  it('exposes leaks, counterplay, reactions, and changes as campaign evidence', () => {
    const ballots = ['C','D','E','F','G'].map((voter, index) => ({ voter, evict:index < 3 ? 'A' : 'B', margin:0.4, changed:false }));
    const result = resolveBBCampaignAct({ nominees:['A','B'], ballots, house:gs.activePlayers, campaignIndex:1, rng:seeded(9) });
    expect(result).toEqual(expect.objectContaining({ pitches:expect.any(Array), intel:expect.any(Array), counterplay:expect.any(Array), changed:expect.any(Array) }));
    expect(result.pitches.every(pitch => typeof pitch.reactionSummary === 'string' && Array.isArray(pitch.reactions))).toBe(true);
  });

  it('preserves the public week ballot and variable-act contracts', () => {
    const week = simulateBBWeek({ rng:seeded(31), campaignActCount:3 });
    expect(week.campaign).toHaveLength(3);
    expect(week.acts.filter(act => act.type === 'campaign')).toHaveLength(3);
    expect(week.ballots.every(ballot => ballot.voter && ballot.evict && typeof ballot.changed === 'boolean')).toBe(true);
    expect(week.voteChanges).toBe(week.ballots.filter(ballot => ballot.changed).length);
  });
});
