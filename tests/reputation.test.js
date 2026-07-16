import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { reputationModifier, strategicReputation, updateStrategicReputations } from '../js/reputation.js';
import { seedGame } from './helpers/setup.js';

describe('behavior-based strategic reputations', () => {
  beforeEach(() => {
    seedGame(['A','B','C'], {
      episode:5,
      episodeHistory:[
        { num:1, votingLog:[{ voter:'A', voted:'C' }], votePitches:[{ pitcher:'A', success:true,
          confirmedCoalition:['A','B','C'], liedAboutNumbers:false, responses:[{ voter:'B', leaked:true }] }] },
        { num:2, votingLog:[{ voter:'A', voted:'C' }], votePitches:[{ pitcher:'A', success:true,
          confirmedCoalition:['A','B'], liedAboutNumbers:false, responses:[{ voter:'B', leaked:true }] }] },
        { num:3, votingLog:[{ voter:'A', voted:'C' }] },
      ],
      namedAlliances:[],
      playerStates:{ A:{ bigMoves:3 }, B:{}, C:{} },
    });
  });

  it('earns persuasion and control from repeated successful organizing', () => {
    const rep = strategicReputation('A');
    expect(rep.labels).toContain('Persuasive');
    expect(rep.persuasion).toBeGreaterThan(0.65);
    expect(rep.control).toBeGreaterThan(0.6);
    expect(reputationModifier('A', 'pitch-trust')).toBeGreaterThan(0);
  });

  it('earns a leaky reputation from repeated disclosed conversations', () => {
    const rep = strategicReputation('B');
    expect(rep.labels).toContain('Leaky');
    expect(rep.discretion).toBeLessThan(0.35);
    expect(reputationModifier('B', 'leak')).toBeGreaterThan(0);
  });

  it('records label changes without making reputation a static player trait', () => {
    const ep = { num:6, votingLog:[], votePitches:[] };
    const changes = updateStrategicReputations(ep);
    expect(gs.strategicReputations.A.labels).toContain('Persuasive');
    expect(changes.some(change => change.player === 'A' && change.earned.includes('Persuasive'))).toBe(true);
    expect(ep.strategicReputations.A.name).toBe('A');
  });

  it('marks repeated alliance betrayal as unreliable', () => {
    gs.namedAlliances = [{ name:'Core', active:true, members:['A','B','C'], betrayals:[
      { player:'C', severity:'moderate' }, { player:'C', severity:'major' }
    ] }];
    const rep = strategicReputation('C');
    expect(rep.labels).toContain('Unreliable');
    expect(reputationModifier('C', 'idol-trust')).toBeLessThan(0);
  });
});
