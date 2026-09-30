// Layer 3 (Plan 3a+ Task 14): a voice can give a player away, and the room
// notices how people type. Both are engine outcomes with consequences; the
// words only report them.
import { describe, expect, it } from 'vitest';
import { room } from './helpers/ci-room.js';
import { addScene, rel } from '../js/ci/state.js';
import { belief } from '../js/ci/beliefs.js';
import { rollSlips, voiceMismatch } from '../js/ci/slips.js';
import { noticeStyle, styleTraits } from '../js/ci/feed.js';
import { writeScene } from '../js/ci/script.js';
import { streamFor } from '../js/dr/rng.js';

function catfishRoom(voice) {
  const s = room(6, 2);
  Object.assign(s.profiles['@q0'], { mode: 'catfish', gap: 3, shown: { name: 'Tyler', gender: 'm', age: 24 } });
  Object.assign(s.people.Q0, { age: 71, gender: 'f', chatVoice: voice });
  return s;
}

describe('a voice that gives a player away', () => {
  it('carries the author\'s leak into the slip, and slips on voice more often for it', () => {
    const count = voice => {
      const s = catfishRoom(voice);
      const sc = addScene(s, 'chat', ['@q0', '@q1'], {});
      let voiceSlips = 0, all = 0;
      for (let i = 0; i < 1500; i++) {
        for (const sl of rollSlips(s, streamFor(i, 'slip'), '@q0', ['@q1'], { attention: 0.5 }, sc)) {
          if (sl.misread) continue;
          all++;
          if (sl.kind === 'voice') { voiceSlips++; if (voice?.leaks) expect(voice.leaks).toContain(sl.leak); }
        }
      }
      return voiceSlips / all;
    };
    const plain = count({ register: 'warm' });
    const leaky = count({ register: 'warm', leaks: ['Love, Tyler', 'sweetheart'] });
    expect(leaky).toBeGreaterThan(plain * 1.3);
  });

  it('hears a register that does not fit the face (a formal "24-year-old")', () => {
    expect(voiceMismatch(catfishRoom({ register: 'formal' }), '@q0')).toBeGreaterThan(0);
    expect(voiceMismatch(catfishRoom({ register: 'hype' }), '@q0')).toBe(0);
    const honest = room(4, 1);
    honest.people.Q0.chatVoice = { register: 'formal' };
    expect(voiceMismatch(honest, '@q0')).toBe(0);
  });

  it('writes the leak into the chat, in quotes, when it is noticed', () => {
    const s = catfishRoom({ register: 'warm', leaks: ['Love, Tyler'] });
    const sc = addScene(s, 'chat', ['@q0', '@q1'], { intent: 'bond', ending: 'warm', claims: [],
      slips: [{ by: '@q0', kind: 'voice', noticedBy: ['@q1'], leak: 'Love, Tyler' }] });
    const text = writeScene(s, sc).blocks.flatMap(b => b.lines.map(l => l.text)).join(' | ');
    expect(text).toContain('Love, Tyler');
  });
});

describe('the room notices how people type', () => {
  it('names what is distinctive: authored habits first, then a strong register', () => {
    const s = room(4, 1);
    s.people.Q0.chatVoice = { caps: 'all', greetings: ['MY PEOPLE!'] };
    expect(styleTraits(s, '@q0').map(t => t.trait)).toEqual(expect.arrayContaining(['caps', 'greeting']));
    s.people.Q1.chatVoice = { register: 'formal' };
    expect(styleTraits(s, '@q1').map(t => t.trait)).toEqual(['formal']);
    expect(styleTraits(s, '@q2')).toEqual([]);   // warm, nothing authored: nothing to notice
  });

  it('charms or annoys, and the relationship moves either way', () => {
    let charmed = 0, annoyed = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const s = room(4, seed);
      s.people.Q0.chatVoice = { caps: 'all' };
      const sc = addScene(s, 'circle-chat', [...s.active], { posts: [{ by: '@q0' }], theories: [] });
      const note = noticeStyle(s, streamFor(seed, 'style'), sc);
      if (!note) continue;
      expect(note.about).toBe('@q0');
      if (note.tone === 'charmed') { charmed++; expect(rel(note.by, '@q0', 'affection')).toBeGreaterThan(0); }
      if (note.tone === 'annoyed') { annoyed++; expect(rel(note.by, '@q0', 'resentment')).toBeGreaterThan(0); }
    }
    expect(charmed).toBeGreaterThan(0);
    expect(annoyed).toBeGreaterThan(0);
  });

  it('makes a catfish whose voice does not fit the face look less real', () => {
    let seen = 0;
    for (let seed = 1; seed <= 40 && !seen; seed++) {
      const s = catfishRoom({ register: 'formal' });
      const sc = addScene(s, 'circle-chat', [...s.active], { posts: [{ by: '@q0' }], theories: [] });
      const note = noticeStyle(s, streamFor(seed, 'style'), sc);
      if (note?.trait !== 'mismatch') continue;
      seen++;
      expect(note.tone).toBe('suspicious');
      expect(belief(s, note.by, '@q0').real).toBeLessThan(0.8);
    }
    expect(seen).toBe(1);
  });

  it('notices each thing about each person once', () => {
    const s = room(3, 1);
    s.people.Q0.chatVoice = { caps: 'all' };
    const notes = [];
    for (let i = 0; i < 40; i++) {
      const sc = addScene(s, 'circle-chat', [...s.active], { posts: [{ by: '@q0' }], theories: [] });
      const n = noticeStyle(s, streamFor(i, 'style'), sc);
      if (n) notes.push(`${n.by}|${n.trait}`);
    }
    expect(new Set(notes).size).toBe(notes.length);
  });
});
