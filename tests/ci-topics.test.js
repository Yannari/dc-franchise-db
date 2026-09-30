// ci-topics.test.js — small talk about a real life (user, 2026-09-30: "more
// different about everything, matching their personality or their catfish
// personality"). A friendly chat is often ABOUT the other person's life: the
// topic comes from their profile (a persona's job and details; a player's own
// job and hometown, nothing invented), and a catfish wings a job they don't have.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { topicsOf, wingsIt } from '../js/ci/topics.js';
import { TOPICS } from '../js/ci/persona-data.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const seasons = [2, 5, 8].map(seed => {
  const cast = rosterCast(13, seed); setPlayers(cast); const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed }).state;
});
const topicChats = state => state.scenes.filter(s => s.aired && s.kind === 'chat' && s.script?.blocks?.[0]?.key?.startsWith('chat.topic.'));

describe('friendly chats are about something', () => {
  it('a real share of aired bond chats is about the other person\'s life', () => {
    for (const state of seasons) {
      const bond = state.scenes.filter(s => s.aired && s.kind === 'chat' && s.data.intent === 'bond' && s.data.ending !== 'cold');
      const topic = topicChats(state);
      expect(topic.length, 'topic chats').toBeGreaterThan(3);
      expect(topic.length / bond.length).toBeLessThan(0.7);
    }
  });
  it('the topic is one of the other person\'s own; a catfish always wings it, an honest player never does', () => {
    for (const state of seasons) for (const sc of topicChats(state)) {
      const [, b] = sc.who;
      const key = sc.script.blocks[0].key;
      if (wingsIt(state, b) && key === 'chat.topic.fake') continue;
      // a catfish talks as the persona about everything but a job, which it wings
      if (wingsIt(state, b)) expect(['circle-life', 'single', 'taken', 'complicated']).toContain(key.replace('chat.topic.', ''));
      else {
        expect(key).not.toBe('chat.topic.fake');
        expect(topicsOf(state, b)).toContain(key.replace('chat.topic.', ''));
      }
    }
  });
  it('an honest player\'s topics come only from their job and hometown', () => {
    for (const state of seasons) for (const [h, p] of Object.entries(state.profiles)) {
      if (p.mode === 'catfish') continue;
      const t = topicsOf(state, h);
      if (!p.shown?.hometown || /^swiss$/i.test(p.shown.hometown)) expect(t).not.toContain('hometown');
      const SHARED = ['hometown', 'single', 'taken', 'complicated', 'circle-life'];
      if (!p.shown?.job) expect(t.filter(x => !SHARED.includes(x))).toEqual([]);
      for (const x of t) expect(SHARED.includes(x) || !!TOPICS[x], x).toBe(true);
    }
  });
  it('the words carry the topic and the town, capitalized when they open a sentence', () => {
    for (const state of seasons) for (const sc of topicChats(state)) {
      const text = sc.script.blocks[0].lines.map(l => l.text).join(' ');
      expect(text).not.toMatch(/\{(topic|town)\}/);
      expect(text).not.toMatch(/(^|[.!?]\s)(night shifts|hospital life|the law|teaching|training)\b/);
    }
  });
  it('a hometown is said like a person says it, and a nationality is not a place', async () => {
    const { townOf } = await import('../js/ci/topics.js');
    expect(townOf('Toronto, Ontario')).toBe('Toronto');
    expect(townOf('Swiss')).toBeNull();
    expect(townOf('Chicago')).toBe('Chicago');
  });
});
