import { describe, it, expect, beforeEach } from 'vitest';
import { setGs, gs } from '../js/core.js';
import { applyTwist, generateTwistScenes } from '../js/twists.js';

function mkGs() {
  return {
    phase: 'pre-merge',
    tribes: [
      { name: 'Embers',   members: ['Alpha', 'Bravo', 'Charlie'] },
      { name: 'Saplings', members: ['Delta', 'Echo', 'Foxtrot'] },
    ],
    activePlayers: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'],
    sitOutHistory: { Alpha: 1 },
    idolSlots: {},
    episodeHistory: [],
  };
}
const findTribe = (n) => gs.tribes.find(t => t.name === n);

describe('producer-swap twist', () => {
  beforeEach(() => setGs(mkGs()));

  it('one-way move: relocates the chosen player to the chosen tribe', () => {
    const ep = { twists: [] };
    applyTwist(ep, { type: 'producer-swap', swapPlayer: 'Charlie', swapToTribe: 'Saplings' });
    expect(findTribe('Embers').members).toEqual(['Alpha', 'Bravo']);
    expect(findTribe('Saplings').members).toContain('Charlie');
    expect(findTribe('Saplings').members).toHaveLength(4);
    const moves = ep.twists[0].producerMoves;
    expect(moves).toEqual([{ player: 'Charlie', from: 'Embers', to: 'Saplings' }]);
  });

  it('balanced 1-for-1: swap-back keeps both tribe counts equal', () => {
    const ep = { twists: [] };
    applyTwist(ep, { type: 'producer-swap', swapPlayer: 'Charlie', swapToTribe: 'Saplings', swapPlayer2: 'Delta' });
    expect(findTribe('Embers').members.sort()).toEqual(['Alpha', 'Bravo', 'Delta']);
    expect(findTribe('Saplings').members.sort()).toEqual(['Charlie', 'Echo', 'Foxtrot']);
    expect(ep.twists[0].producerMoves).toHaveLength(2);
  });

  it('resets sit-out history after the roster change', () => {
    const ep = { twists: [] };
    applyTwist(ep, { type: 'producer-swap', swapPlayer: 'Charlie', swapToTribe: 'Saplings' });
    expect(gs.sitOutHistory).toEqual({});
  });

  it('invalid/no-op config leaves tribes untouched', () => {
    const ep = { twists: [] };
    applyTwist(ep, { type: 'producer-swap', swapPlayer: 'Charlie', swapToTribe: 'Embers' }); // same tribe
    expect(findTribe('Embers').members).toEqual(['Alpha', 'Bravo', 'Charlie']);
    expect(ep.twists[0].producerMoves).toBeUndefined();
  });

  it('does nothing post-merge', () => {
    gs.phase = 'post-merge';
    const ep = { twists: [] };
    applyTwist(ep, { type: 'producer-swap', swapPlayer: 'Charlie', swapToTribe: 'Saplings' });
    expect(findTribe('Embers').members).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('generates VP scenes describing the move', () => {
    const ep = { twists: [] };
    applyTwist(ep, { type: 'producer-swap', swapPlayer: 'Charlie', swapToTribe: 'Saplings' });
    const scenes = generateTwistScenes(ep).find(s => s.type === 'producer-swap');
    expect(scenes).toBeTruthy();
    expect(scenes.label).toBe('Producer Swap');
    expect(scenes.scenes.some(s => s.text.includes('Charlie') && s.text.includes('Saplings'))).toBe(true);
  });
});
