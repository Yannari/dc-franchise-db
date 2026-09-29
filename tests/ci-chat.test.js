import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, addScene, bump, rel } from '../js/ci/state.js';
import { initMind, mood } from '../js/ci/mind.js';
import { belief } from '../js/ci/beliefs.js';
import { makeClaim, learn } from '../js/ci/claims.js';
import { isRevealed } from '../js/ci/reveal.js';
import { utilities, planChats, attractionOk, contextFor } from '../js/ci/chat.js';
import { runChat } from '../js/ci/conversation.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(specs) {
  const s = newState(1);
  for (const [name, o] of Object.entries(specs)) {
    s.people[name] = { name, gender: o.gender || 'f', sexuality: o.sexuality || 'straight',
      archetype: o.archetype || 'floater', stats: { ...STATS, ...(o.stats || {}) }, age: 25 };
    const h = `@${name.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [name], mode: o.mode || 'honest', gap: o.mode === 'catfish' ? 2 : 0,
      tells: [], shown: { gender: o.shown || o.gender || 'f', age: 25 } };
    s.handleOf[name] = h;
    s.active.push(h);
    initMind(s, h);
  }
  return s;
}
const always = v => () => v;

describe('choosing chats', () => {
  it('never plans a chat with yourself or with a blocked player, and respects the budget', () => {
    const s = room({ A: { stats: { social: 10 } }, B: {}, C: {}, D: {} });
    s.active = s.active.filter(h => h !== '@d');
    const plans = planChats(s, streamFor(1, 'chat'), contextFor(s, 1));
    for (const p of plans) {
      expect(p.from).not.toBe(p.to);
      expect(s.active).toContain(p.to);
    }
    const fromA = plans.filter(p => p.from === '@a');
    expect(fromA.length).toBeLessThanOrEqual(4);
    expect(new Set(fromA.map(p => p.to)).size).toBe(fromA.length);
  });

  it('never lets a nice archetype plant a claim', () => {
    const s = room({ H: { archetype: 'hero', stats: { strategic: 10, loyalty: 1 } }, R: {}, F: {} });
    bump('@h', '@r', 'resentment', 9);
    const ctx = { ...contextFor(s, 2), rivalOf: { '@h': '@r' } };
    expect(utilities(s, '@h', '@f', ctx).plant).toBe(0);
    const v = room({ V: { archetype: 'villain' }, R: {}, F: {} });
    expect(utilities(v, '@v', '@f', { ...contextFor(v, 2), rivalOf: { '@v': '@r' } }).plant).toBeGreaterThan(0);
  });

  it('lets a nice player claim credit only when it is true', () => {
    const s = room({ H: { archetype: 'hero', stats: { loyalty: 2 } }, X: {} });
    const ctx = { ...contextFor(s, 2), creditable: { '@h': ['@x'] } };
    expect(utilities(s, '@h', '@x', ctx).credit).toBe(0);
    expect(utilities(s, '@h', '@x', { ...ctx, protectedBy: { '@x': ['@h'] } }).credit).toBeGreaterThan(0);
  });

  it('flirts only toward the gender a player is into, as the profile shows it', () => {
    const s = room({ M: { gender: 'm' }, CAT: { gender: 'm', shown: 'f', mode: 'catfish' }, G: { gender: 'm' } });
    expect(attractionOk(s, '@m', '@cat')).toBe(true);
    expect(attractionOk(s, '@m', '@g')).toBe(false);
  });

  it('wants to probe a profile it suspects', () => {
    const s = room({ A: { stats: { intuition: 9 } }, B: {} });
    const calm = utilities(s, '@a', '@b', contextFor(s, 1)).probe;
    belief(s, '@a', '@b').real = 0.2;
    expect(utilities(s, '@a', '@b', contextFor(s, 1)).probe).toBeGreaterThan(calm);
  });
});

describe('running a chat', () => {
  it('decides the ending first and every turn carries it', () => {
    const s = room({ A: {}, B: {} });
    const sc = runChat(s, streamFor(4, 'x'), { from: '@a', to: '@b', intent: 'bond' }, {});
    expect(['warm', 'neutral', 'cold']).toContain(sc.data.ending);
    expect(sc.data.turns.length).toBeGreaterThanOrEqual(2);
    for (const t of sc.data.turns) expect(t.tone).toBe(sc.data.ending);
  });

  it('a warm bond warms both sides and eases loneliness', () => {
    const s = room({ A: {}, B: {} });
    const before = mood(s, '@b', 'loneliness');
    runChat(s, always(0), { from: '@a', to: '@b', intent: 'bond' }, {});   // rng 0 → warm
    expect(rel('@b', '@a', 'affection')).toBeGreaterThan(0);
    expect(rel('@a', '@b', 'affection')).toBeGreaterThan(0);
    expect(mood(s, '@b', 'loneliness')).toBeLessThan(before);
  });

  it('a warm alliance makes a protect pact; a warm pitch makes a rate pact', () => {
    const s = room({ A: {}, B: {} });
    const ally = runChat(s, always(0), { from: '@a', to: '@b', intent: 'ally' }, {});
    const pitch = runChat(s, always(0), { from: '@a', to: '@b', intent: 'pitch' }, {});
    expect(s.pacts.find(p => p.id === ally.data.pact).kind).toBe('protect');
    expect(s.pacts.find(p => p.id === pitch.data.pact).kind).toBe('rate');
  });

  it('a pump passes on what the other one heard', () => {
    const s = room({ A: {}, B: { stats: { loyalty: 1 } }, C: {} });
    bump('@b', '@a', 'affection', 9);
    const c = makeClaim(s, { kind: 'targeting', holder: '@c', about: '@a', truth: true, by: '@c' });
    learn(s, '@b', c, '@c', addScene(s, 'chat', ['@b', '@c']));
    const sc = runChat(s, always(0), { from: '@a', to: '@b', intent: 'pump' }, {});
    expect(sc.data.claims).toContain(c.id);
    expect(s.know['@a'][c.id].from).toBe('@b');
  });

  it('comparing notes can expose a liar', () => {
    const s = room({ A: {}, B: { stats: { intuition: 10 } }, C: { stats: { intuition: 10 } } });
    const lie = makeClaim(s, { kind: 'saved', holder: '@a', about: '@c', truth: false, by: '@a' });
    const truth = makeClaim(s, { kind: 'targeting', holder: '@a', about: '@c', truth: true, by: '@b' });
    learn(s, '@c', lie, '@a', addScene(s, 'chat', ['@a', '@c']));
    learn(s, '@c', truth, '@b', addScene(s, 'chat', ['@b', '@c']));
    const sc = runChat(s, always(0), { from: '@c', to: '@b', intent: 'compare' }, {});
    expect(sc.data.exposed).toBe('@a');
    expect(rel('@c', '@a', 'trust')).toBeLessThan(0);
    expect(rel('@b', '@a', 'trust')).toBeLessThan(0);
  });

  it('a confession reveals the truth to the one confessed to', () => {
    const s = room({ CAT: { mode: 'catfish' }, B: {} });
    runChat(s, always(0), { from: '@cat', to: '@b', intent: 'confess' }, {});
    expect(isRevealed(s, '@b', '@cat')).toBe(true);
  });

  it('a probe\'s ending is the probe\'s result', () => {
    const s = room({ A: {}, B: {} });
    const sc = runChat(s, streamFor(2, 'p'), { from: '@a', to: '@b', intent: 'probe' }, {});
    expect(sc.data.probes[0].result).toBe('pass');
    expect(sc.data.ending).toBe('warm');
  });
});
