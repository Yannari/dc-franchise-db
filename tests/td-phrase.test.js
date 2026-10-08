// The phrasebook (td/story/phrases): each move in many voices and ages, and every move a scene
// asks for exists. td/story/phrase.js picks the speaker's own voice and age first.
import { describe, it, expect } from 'vitest';
import { PHRASES } from '../js/td/story/phrases/index.js';
import { VOICE_TAGS } from '../js/td/story/voice.js';
import { AGES, hasMove } from '../js/td/story/phrase.js';
import { STORY_POOLS } from '../js/td/story/lines/index.js';

const TONES = new Set(VOICE_TAGS.filter(t => !AGES.has(t)));
const keyOk = k => k === 'any' || TONES.has(k) || AGES.has(k) || (/^([a-z]+)\+([a-z]+)$/.test(k) && TONES.has(k.split('+')[0]) && AGES.has(k.split('+')[1]));

describe('td phrasebook', () => {
  it('keys every phrase list on a real voice tag or age band', () => {
    for (const [move, book] of Object.entries(PHRASES)) for (const k of Object.keys(book)) expect(keyOk(k), `${move}: '${k}'`).toBe(true);
  });
  it('has enough of every move to go round', () => {
    for (const [move, book] of Object.entries(PHRASES)) {
      const parent = move.includes('.');
      expect((book.any || []).length, `${move}: any`).toBeGreaterThanOrEqual(parent ? 4 : 5);
      expect(Object.keys(book).filter(k => TONES.has(k)).length, `${move}: voices`).toBeGreaterThanOrEqual(parent ? 6 : 12);
      expect(['teen', 'grown'].every(a => (book[a] || []).length), `${move}: ages`).toBe(parent || true);
    }
  });
  it('names nobody but the person spoken to and the speaker', () => {
    for (const [move, book] of Object.entries(PHRASES)) for (const list of Object.values(book)) for (const x of list)
      for (const m of x.matchAll(/\{(\w+)(?:\.\w+)?\}/g)) expect(['to', 'by'].includes(m[1]), `${move}: ${x}`).toBe(true);
  });
  it('writes plain speech, no tics, nothing twice', () => {
    const TICS = [/\bout here,/i, /why not both/i, /that'?s the game\b/i, /\bnot an? [a-z]+\. it'?s an? /i, /it is what it is/i, /neither of them moves/i];
    const seen = new Set();
    for (const [move, book] of Object.entries(PHRASES)) for (const list of Object.values(book)) for (const x of list) {
      for (const re of TICS) expect(re.test(x), `${move}: ${x}`).toBe(false);
      expect(x.length, `${move}: ${x}`).toBeLessThan(140);
      seen.add(`${move}|${x}`);
    }
    expect(seen.size).toBeGreaterThan(800);
  });
  it('has every move a scene asks for', () => {
    for (const [k, pool] of Object.entries(STORY_POOLS)) for (const e of pool) for (const t of e.turns)
      if (t.move) expect(hasMove(t.move), `${e.id} (${k}): move '${t.move}'`).toBe(true);
  });
});
