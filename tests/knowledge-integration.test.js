import { beforeEach, describe, expect, it } from 'vitest';
import { POOLS } from '../js/td/script/lines/index.js';
import { seedGame } from './helpers/setup.js';
import { believes, factId } from '../js/knowledge.js';
import { knowledgeCampCards, recordDetectedBetrayalKnowledge,
  recordPitchKnowledge, recordVotingPlanKnowledge } from '../js/knowledge-integration.js';
describe('knowledge integration', () => {
  beforeEach(() => seedGame(['A', 'B', 'C', 'D'], { knowledge: {}, episode: 0 }));
  it('teaches a plan only to attending members', () => {
    recordVotingPlanKnowledge(['A', 'B', 'C'], [{ label: 'Core', target: 'C', members: ['A', 'B', 'D'] }], 1);
    expect(believes('A', 'target:C', 1)).toBeTruthy();
    expect(believes('B', 'target:C', 1)).toBeTruthy();
    expect(believes('C', 'target:C', 1)).toBeNull();
    expect(believes('D', 'target:C', 1)).toBeNull();
  });
  it('records who heard a pitch without declaring acceptance', () => {
    recordPitchKnowledge([{ pitcher: 'A', pitchTarget: 'D', claimedSupport: 3,
      responses: [{ voter: 'B', accepted: false }, { voter: 'C', accepted: true }] }], 1);
    const id = factId('pitch', 'A', 'D');
    expect(believes('B', id, 1)).toBeTruthy();
    expect(believes('C', id, 1)).toBeTruthy();
  });
  it('limits detected betrayal knowledge to witnesses', () => {
    recordDetectedBetrayalKnowledge({ traitor: 'A', votedFor: 'D', witnesses: ['B'], ep: 1 });
    const id = factId('betrayal', 'A', 'D');
    expect(believes('B', id, 1)).toBeTruthy();
    expect(believes('C', id, 1)).toBeNull();
  });
  it('renders uncertainty rather than revealing pitch results', () => {
    const [card] = knowledgeCampCards([{ from: 'A', to: 'B', subject: 'D', sourceType: 'rumor' }]);
    expect(card.lines?.length).toBeGreaterThan(1);
    expect(card.text).not.toMatch(/accepted|rejected|flipped/i);
    // The card is a scene now (td/script): whatever the listener says, nobody
    // commits a vote in it — the vote has not happened, and the pitch's result
    // is not theirs to know. Checked across every line the scene can pick.
    const COMMITS = /(i'll vote|i'm voting|i will vote|my vote is|you have my vote|you've got my vote|count me in|i'll write)/i;
    for (const [key, pool] of Object.entries(POOLS)) if (key.startsWith('flow.gossip.')) {
      for (const e of pool) for (const t of e.turns) expect(COMMITS.test(t.say || t.conf || t.beat), `${key} ${e.id}`).toBe(false);
    }
  });
});
