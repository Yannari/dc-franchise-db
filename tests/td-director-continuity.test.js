import { classify } from '../js/td/story/storylines.js';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { airTdEpisode } from '../js/td/story/director.js';
import { expect, it } from 'vitest';
import { continuityScore, rememberMoment } from '../js/td/story/continuity.js';
const moment = (step = 'friction', outcome = 'any', kind = 'drama.dispute', a = 'Heather', b = 'Leshawna') => ({ type: 'rivalry', step, outcome, roles: { a, b }, data: {}, topic: kind });
it('rests the same pair and topic across different scripts', () => {
  const memory = {};
  rememberMoment(memory, moment(), { ep: 2, camp: 'A', phase: 'post' });
  expect(continuityScore(memory, moment(), { ep: 3, camp: 'A' })).toBeLessThan(0);
  expect(continuityScore(memory, moment(), { ep: 6, camp: 'A' })).toBe(0);
});
it('prioritizes an actual change after an aired incident', () => {
  const memory = {};
  rememberMoment(memory, moment(), { ep: 2, camp: 'A' });
  expect(continuityScore(memory, moment('truce', 'made', 'friend.apology'), { ep: 3, camp: 'A' })).toBeGreaterThan(0);
});
it('does not connect unrelated pairs or unseen incidents', () => {
  const memory = {};
  expect(continuityScore(memory, moment('truce'), { ep: 3, camp: 'A' })).toBe(0);
  rememberMoment(memory, moment(), { ep: 2, camp: 'A' });
  expect(continuityScore(memory, moment('truce', 'made', 'friend.apology', 'Gwen', 'Trent'), { ep: 3, camp: 'A' })).toBe(0);
});
it('recognizes the pair after a swap and round trips plain save data', () => {
  const memory = {};
  rememberMoment(memory, moment(), { ep: 2, camp: 'A' });
  const restored = JSON.parse(JSON.stringify(memory));
  expect(continuityScore(restored, moment('blowup', 'any', 'drama.fight', 'Leshawna', 'Heather'), { ep: 3, camp: 'B' })).toBeGreaterThan(0);
});
it('does not reward an old change indefinitely or read future incidents', () => {
  const memory = {};
  rememberMoment(memory, moment(), { ep: 4, camp: 'A' });
  expect(continuityScore(memory, moment('truce'), { ep: 3, camp: 'A' })).toBe(0);
  expect(continuityScore(memory, moment('truce'), { ep: 10, camp: 'A' })).toBe(0);
});
it('gives a quieter bond moment room after an aired defense, once', () => {
  const memory = {};
  const defense = { type: 'friendship', step: 'bond', outcome: 'any', roles: { a: 'Gwen', b: 'Leshawna', c: 'Heather' }, topic: 'friend.defend' };
  const bond = { ...defense, topic: 'friend.bond' };
  rememberMoment(memory, defense, { ep: 2, camp: 'A' });
  expect(continuityScore(memory, bond, { ep: 3, camp: 'A' })).toBeGreaterThan(0);
  rememberMoment(memory, bond, { ep: 3, camp: 'A' });
  expect(continuityScore(memory, bond, { ep: 4, camp: 'A' })).toBeLessThan(0);
});
it('records only final aired events in a played season and replay leaves memory unchanged', () => {
  expect(seededRun(() => runOneSeason(), 1729).phase).toBe('complete');
  const memory = core.gs.tdStory.continuity;
  expect(Object.keys(memory).length).toBeGreaterThan(0);
  for (const [key, entry] of Object.entries(memory)) {
    const [type, a, b] = JSON.parse(key);
    const ep = core.gs.episodeHistory.find(e => e.num === entry.ep);
    const scenes = ep.campStory[entry.camp][entry.phase];
    expect(scenes.some(s => {
      const block = ep.campEvents[entry.camp];
      const events = Array.isArray(block) ? (entry.phase === 'pre' ? block : []) : block[entry.phase];
      const event = events?.[s.ref];
      const c = event && classify(event);
      return c?.type === type && [c.roles.a, c.roles.b].includes(a) && [c.roles.a, c.roles.b].includes(b);
    }), type + ':' + a + ':' + b).toBe(true);
  }
  const before = JSON.stringify(memory);
  for (const ep of core.gs.episodeHistory) airTdEpisode(ep);
  expect(JSON.stringify(core.gs.tdStory.continuity)).toBe(before);
});
