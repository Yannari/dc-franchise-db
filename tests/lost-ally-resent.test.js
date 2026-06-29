import { describe, it, expect, beforeEach } from 'vitest';
import { setGs, gs } from '../js/core.js';
import { bKey } from '../js/bonds.js';
import { applyPostTribalConsequences } from '../js/episode.js';

beforeEach(() => {
  setGs({
    activePlayers: ['Rosa-Maria', 'James', 'Lake', 'Aiden'], // Ellie eliminated
    isMerged: true,
    namedAlliances: [{ name: 'The Pact', active: true, type: 'pact', members: ['Ellie', 'Rosa-Maria', 'Aiden'], betrayals: [] }],
    bonds: {
      [bKey('Aiden', 'Ellie')]: 3,        // Aiden genuinely liked Ellie
      [bKey('Rosa-Maria', 'Ellie')]: -3,  // Rosa-Maria disliked Ellie
    },
    discoveredVotesLastEp: [],
    blowupHeatNextEp: new Set(),
    episodeHistory: [],
  });
});

const ep = () => ({
  eliminated: 'Ellie',
  openVote: true,
  votingLog: [
    { voter: 'Rosa-Maria', voted: 'Ellie' }, // Rosa-Maria DROVE the vote
    { voter: 'James', voted: 'Ellie' },
    { voter: 'Lake', voted: 'Ellie' },
    { voter: 'Aiden', voted: 'James' },      // Aiden did NOT vote Ellie
  ],
});

describe('lost-ally resentment only fires for genuine, non-complicit allies', () => {
  it('excludes the ringleader, includes the genuine ally', () => {
    applyPostTribalConsequences(ep());
    const allies = [...new Set(gs.discoveredVotesLastEp.filter(e => e.type === 'lost-ally').map(e => e.ally))];
    expect(allies).toContain('Aiden');          // liked Ellie, didn't vote her → grieves
    expect(allies).not.toContain('Rosa-Maria'); // voted Ellie + disliked her → no grief
  });
});
