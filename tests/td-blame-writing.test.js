import { expect, it } from 'vitest';
import blame from '../js/td/story/lines/n-blame.js';
import voices from '../js/td/story/lines/voices/index.js';
it('gives the accused a defense and the witness a position in every public blame scene', () => {
  for (const key of ['story.chal.lost', 'long.crowd.lost.any']) for (const scene of blame[key]) {
    expect(scene.turns.filter(t => t.by === 'b' && t.say).length, scene.id).toBeGreaterThanOrEqual(2);
    expect(scene.turns.some(t => t.by === 'c' && t.say), scene.id).toBe(true);
  }
});
it('does not invent a failure mechanism, a guaranteed vote, or unseen accusers', () => {
  const text = JSON.stringify(blame);
  expect(text).not.toMatch(/you froze|barely moving|we were winning until|tonight one of us goes home|other people are|slowest again/i);
});
it('retires voice overlays that would reintroduce the old argument', () => {
  expect(Object.keys(voices).filter(id => id.startsWith('nbl.'))).toEqual([]);
});
