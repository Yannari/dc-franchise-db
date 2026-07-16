import { describe, expect, it } from 'vitest';
import { coalitionMajority, evaluateSplitVoteSafety } from '../js/alliances.js';

describe('lost-vote-aware coalition planning', () => {
  const cast = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  it('derives the majority from actual ballots rather than people attending tribal', () => {
    expect(coalitionMajority(cast, ['A', 'B'])).toEqual({ eligible: 6, majority: 4 });
    expect(coalitionMajority(cast, [])).toEqual({ eligible: 8, majority: 5 });
  });
});

describe('idol split safety', () => {
  it('rejects a split whose backup cannot beat visible opposition', () => {
    expect(evaluateSplitVoteSafety({ primaryVoters: ['A','B','C'], backupVoters: ['D','E'], eligibleVoterCount: 10,
      strongestOpposition: 2, reliableVoters: ['A','B','C','D','E'], idolKnown: true }))
      .toMatchObject({ safe: false, rejectionReason: 'coalition-lacks-majority' });
  });

  it('rejects a majority split when an assignment is unreliable', () => {
    expect(evaluateSplitVoteSafety({ primaryVoters: ['A','B','C','D'], backupVoters: ['E','F'], eligibleVoterCount: 10,
      strongestOpposition: 1, reliableVoters: ['A','B','C','D','E'], idolSuspected: true }))
      .toMatchObject({ safe: false, rejectionReason: 'assignments-not-reliable', unreliable: ['F'] });
  });

  it('approves an idol-informed split when both reliable sides cover the opposition', () => {
    expect(evaluateSplitVoteSafety({ primaryVoters: ['A','B','C','D'], backupVoters: ['E','F'], eligibleVoterCount: 10,
      strongestOpposition: 1, reliableVoters: ['A','B','C','D','E','F'], idolKnown: true }))
      .toMatchObject({ safe: true, coordinated: 6, primaryCount: 4, backupCount: 2 });
  });
});
