import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, addScene, bump } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { POOLS } from '../js/ci/lines/index.js';
import { factsFor, pickEntry, renderEntry, fill, peekReal, FACT_KEYS } from '../js/ci/script.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room() {
  const s = newState(3);
  s.day = 4;
  const add = (name, gender, shown, handle, mode = 'honest') => {
    s.people[name] = { name, gender, archetype: 'floater', stats: { ...STATS }, age: 25 };
    s.profiles[handle] = { handle, players: [name], mode, gap: mode === 'catfish' ? 2 : 0,
      shown: { name: handle.slice(1)[0].toUpperCase() + handle.slice(2), gender: shown, age: 24 },
      voice: { emoji: 0.5, hashtags: 0.5, caps: 0 } };
    s.handleOf[name] = handle; s.active.push(handle); initMind(s, handle);
  };
  add('Seaburn', 'm', 'f', '@rebecca', 'catfish');
  add('Shubham', 'm', 'm', '@shubham');
  add('Sammie', 'f', 'f', '@sammie');
  return s;
}

describe('names and pronouns', () => {
  it('lets players say the persona\'s name and pronouns, and only the host the truth', () => {
    const s = room();
    const cast = { a: '@shubham', b: '@rebecca' };
    expect(fill(s, '{b} said {b.sub} was tired.', cast, 'a')).toBe('Rebecca said she was tired.');
    expect(fill(s, '{b.aka} is tired, and {b.sub} is lying.', cast, 'host')).toBe('Rebecca, aka Seaburn, is tired, and he is lying.');
    expect(fill(s, '{a.aka} is here.', cast, 'host')).toBe('Shubham is here.');
    expect(fill(s, '{b} puts the kettle on. {b.Sub} looks at the screen.', cast, 'narration'))
      .toBe('Seaburn puts the kettle on. He looks at the screen.');
  });
});

describe('facts', () => {
  it('reads beliefs without creating them', () => {
    const s = room();
    const sc = addScene(s, 'chat', ['@shubham', '@rebecca'], { intent: 'bond', ending: 'warm' });
    const before = JSON.stringify(s.beliefs);
    factsFor(s, sc, { a: '@shubham', b: '@rebecca' });
    expect(peekReal(s, '@shubham', '@sammie')).toBeGreaterThan(0.5);
    expect(JSON.stringify(s.beliefs)).toBe(before);
  });

  it('reports the chat, the pair and the mood from the speaker\'s side', () => {
    const s = room();
    bump('@shubham', '@rebecca', 'affection', 6);
    s.mind['@shubham'].loneliness = 9;
    const sc = addScene(s, 'chat', ['@shubham', '@rebecca'], { intent: 'bond', ending: 'warm' });
    const f = factsFor(s, sc, { a: '@shubham', b: '@rebecca' });
    expect(f).toMatchObject({ intent: 'bond', ending: 'warm', friends: true, mood: 'lonely', catfish: false, outed: false });
    for (const k of Object.keys(f)) expect(FACT_KEYS).toContain(k);
  });
});

describe('picking and rendering', () => {
  it('falls back to an entry with no conditions when nothing matches', () => {
    const s = room();
    POOLS['test.pool'] = [
      { id: 'test.pool.1', when: { mood: 'guilty' }, turns: [{ by: 'a', say: 'guilty' }] },
      { id: 'test.pool.2', turns: [{ by: 'a', say: 'plain' }] },
    ];
    const e = pickEntry(s, 'test.pool', { mood: 'steady' }, '@a|@b', streamFor(1, 'x'));
    expect(e.id).toBe('test.pool.2');
    delete POOLS['test.pool'];
  });

  it('prefers a matching entry and avoids reusing one for the same pair', () => {
    const s = room();
    POOLS['test.pool'] = [
      { id: 'test.pool.1', when: { mood: 'lonely' }, turns: [{ by: 'a', say: 'lonely' }] },
      { id: 'test.pool.2', turns: [{ by: 'a', say: 'plain' }] },
      { id: 'test.pool.3', turns: [{ by: 'a', say: 'plain again' }] },
    ];
    let lonely = 0;
    for (let i = 0; i < 40; i++) {
      const t = room();
      if (pickEntry(t, 'test.pool', { mood: 'lonely' }, `p${i}`, streamFor(i, 'x')).id === 'test.pool.1') lonely++;
    }
    expect(lonely).toBeGreaterThan(20);
    const first = pickEntry(s, 'test.pool', {}, 'pair', streamFor(2, 'x'));
    const second = pickEntry(s, 'test.pool', {}, 'pair', streamFor(3, 'x'));
    expect(second.id).not.toBe(first.id);
    delete POOLS['test.pool'];
  });

  it('renders turns in order — react, say, send — with the screen text and the dictation', () => {
    const s = room();
    const entry = { id: 'x.1', stage: '{a} sits down.', turns: [
      { by: 'a', say: 'Let me check on {b.obj}.', send: 'Hey {b}! You good? {e:hug}' },
      { by: 'b', react: 'Aw.', send: 'All good {e:heart}' }], beat: '{b} smiles.' };
    const block = renderEntry(s, entry, { a: '@shubham', b: '@rebecca' }, streamFor(4, 'r'));
    expect(block.lines.map(l => l.kind)).toEqual(['stage', 'say', 'send', 'react', 'send']);
    expect(block.lines[1].text).toBe('Let me check on her.');
    expect(block.lines[2].text).toMatch(/^Hey Rebecca! You good\?/);
    expect(block.lines[2].spoken).toMatch(/^Message: "Hey Rebecca, exclamation point\. You good, question mark\."/);
    expect(block.beat).toBe('Seaburn smiles.');   // a beat is staging: the real person
    expect(JSON.stringify(block)).not.toMatch(/\{[a-z]/);
  });
});

import { speakerLabel, blockText } from '../js/ci/transcript.js';

describe('the transcript', () => {
  it('labels a catfish with the persona, and prints a block the way the edit plays it', () => {
    const s = room();
    expect(speakerLabel(s, '@rebecca')).toBe('SEABURN (as Rebecca)');
    expect(speakerLabel(s, '@shubham')).toBe('SHUBHAM');
    const block = { id: 'x.1', beat: 'Seaburn smiles.', lines: [
      { who: '@shubham', kind: 'stage', text: 'Shubham sits down.' },
      { who: '@shubham', kind: 'say', text: 'Let me check on her.' },
      { who: '@shubham', kind: 'send', text: 'Hey Rebecca! You good?', spoken: 'Message: "Hey Rebecca, exclamation point." Send.' },
      { who: '@rebecca', kind: 'react', text: 'Aw.' },
      { who: '@rebecca', kind: 'send', text: 'All good ❤️', spoken: 'Message: "All good." Heart emoji. Send.' },
      { who: 'host', kind: 'host', text: 'Adorable.' }] };
    expect(blockText(s, block)).toEqual([
      '  [Shubham sits down.]',
      '  SHUBHAM, aloud: "Let me check on her."',
      '  SHUBHAM dictates: Message: "Hey Rebecca, exclamation point." Send.',
      '      ▸ SHUBHAM: Hey Rebecca! You good?',
      '  SEABURN (as Rebecca): "Aw."',
      '      ▸ REBECCA: All good ❤️',
      '  HOST: Adorable.',
      '  — Seaburn smiles.',
    ]);
  });
});
