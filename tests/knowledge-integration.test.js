import { beforeEach, describe, expect, it } from 'vitest';
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
    expect(card.text).toMatch(/no promise|nothing away/);
    expect(card.text).not.toMatch(/accepted|rejected|flipped/i);
  });
});
