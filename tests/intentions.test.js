import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, setGs } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import {
  formIntentions, getIntentions, ensureIntentions, evolveIntentions,
  describeIntentions, removeIntentionsFor, resetIntentions,
} from '../js/intentions.js';

// A trusts B>C>D>E; E/F are strategic threats A distrusts.
function seed() {
  seedGame(
    [{ name: 'A', stats: { strategic: 6 } }, { name: 'B', stats: { strategic: 4 } },
     { name: 'C', stats: { strategic: 3 } }, { name: 'D', stats: { strategic: 4 } },
     { name: 'E', stats: { strategic: 9, social: 8 } }, { name: 'F', stats: { strategic: 9, boldness: 8 } }],
    { episode: 6, intentions: {}, relationshipDimensions: {}, bonds: {} },
  );
  setRelationshipDimension('A', 'B', 'trust', 8);
  setRelationshipDimension('A', 'C', 'trust', 6);
  setRelationshipDimension('A', 'D', 'trust', 2);
  setRelationshipDimension('A', 'E', 'trust', -4);
  setRelationshipDimension('A', 'F', 'trust', -5);
}
beforeEach(seed);

describe('intentions: formation', () => {
  it('seeds a coherent first plan from the social landscape', () => {
    const p = formIntentions('A', 6);
    expect(p.finalThree).toEqual(['A', 'B', 'C']);        // self + 2 most trusted
    expect(p.backupAllies).toContain('D');
    expect(p.targets.every(n => ['E', 'F'].includes(n))).toBe(true);  // distrusted threats
    expect(p.formedEp).toBe(6);
    expect(getIntentions('A')).toBe(p);
    expect(ensureIntentions('A')).toBe(p);                 // idempotent
  });
});

describe('intentions: persistence', () => {
  it('does NOT rebuild the plan when nothing changes', () => {
    const p = formIntentions('A', 6);
    const f3 = [...p.finalThree];
    evolveIntentions('A', 7);
    evolveIntentions('A', 8);
    expect(getIntentions('A').finalThree).toEqual(f3);     // unchanged across episodes
    expect(getIntentions('A').history.length).toBe(0);
  });
});

describe('intentions: evolution on believable triggers', () => {
  it('promotes a backup into the final three when a member is eliminated', () => {
    formIntentions('A', 6);
    setGs({ ...gs, activePlayers: gs.activePlayers.filter(n => n !== 'C') });   // C voted out
    evolveIntentions('A', 7);
    const p = getIntentions('A');
    expect(p.finalThree).not.toContain('C');
    expect(p.finalThree.length).toBe(3);
    expect(p.history.some(h => h.field === 'finalThree' && h.reason.includes('slot'))).toBe(true);
  });

  it('turns a crossed ally into a revenge target and drops them from the final three', () => {
    formIntentions('A', 6);
    setRelationshipDimension('A', 'B', 'resentment', 6);   // B crossed A
    evolveIntentions('A', 7);
    const p = getIntentions('A');
    expect(p.revenge).toContain('B');
    expect(p.targets).toContain('B');
    expect(p.finalThree).not.toContain('B');
    expect(p.history.some(h => h.field === 'revenge' && h.to === 'B')).toBe(true);
  });

  it('tracks an advantage plan when they hold one', () => {
    formIntentions('A', 6);
    gs.advantages = [{ holder: 'A', type: 'idol', used: false }];
    evolveIntentions('A', 7);
    expect(getIntentions('A').advantagePlan).toBe('hold');
    gs.advantages = [];
    evolveIntentions('A', 8);
    expect(getIntentions('A').advantagePlan).toBeNull();
  });
});

describe('intentions: hints + cleanup', () => {
  it('describes the plan in plain language', () => {
    formIntentions('A', 6);
    const hints = describeIntentions('A');
    expect(hints.some(h => /final three with B & C/.test(h))).toBe(true);
    expect(hints.some(h => /target/.test(h))).toBe(true);
  });

  it('scrubs a departed contestant from everyone\'s plans', () => {
    formIntentions('A', 6);
    expect(getIntentions('A').finalThree).toContain('B');
    removeIntentionsFor('B');
    expect(getIntentions('A').finalThree).not.toContain('B');
    resetIntentions();
    expect(getIntentions('A')).toBeNull();
  });
});
