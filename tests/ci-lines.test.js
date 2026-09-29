// ci-lines.test.js — the pools are well-formed, and they talk like the show.
//
// Written before the pools (Plan 2, ruled) so every line is checked as it is
// written. The coverage test — every key the engine can ask for has three
// plain entries — closes the plan (Task 10).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { POOLS } from '../js/ci/lines/index.js';
import { FACT_KEYS, ROLES, POOL_KEYS } from '../js/ci/script.js';
import { EMOJI } from '../js/ci/voice.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

const ENTRIES = Object.entries(POOLS).flatMap(([k, list]) => list.map(e => [k, e]));
const turnTexts = e => (e.turns || []).flatMap(t => ['react', 'say', 'send', 'post', 'video'].filter(x => t[x]).map(x => [t.by, x, t[x]]));
const allTexts = e => [e.stage, e.beat, ...turnTexts(e).map(t => t[2])].filter(Boolean);
const SLOT = /\{([^}]*)\}/g;
const OK_SLOT = /^([abc])(\.(real|aka|sub|obj|pos|posAdj|ref|Sub|Obj|PosAdj))?$|^([et]):([A-Za-z0-9]+)$|^(q|game|ans)$/;

describe('the pools are well-formed', () => {
  it('has unique ids that start with their pool key, and only known pool keys', () => {
    const ids = ENTRIES.map(([, e]) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [k, e] of ENTRIES) expect(e.id.startsWith(`${k}.`), e.id).toBe(true);
    for (const k of Object.keys(POOLS)) expect(POOL_KEYS, `orphan pool ${k}`).toContain(k);
  });

  it('casts only a, b, c and the host, and every turn says something', () => {
    for (const [, e] of ENTRIES) {
      expect(e.turns?.length || e.stage, e.id).toBeTruthy();
      for (const t of e.turns || []) {
        expect(ROLES, e.id).toContain(t.by);
        expect(t.react || t.say || t.send || t.post || t.video, e.id).toBeTruthy();
      }
    }
  });

  it('uses only real slots, and the truth only in the host\'s mouth or the staging', () => {
    for (const [, e] of ENTRIES) {
      for (const x of allTexts(e)) for (const [, s] of x.matchAll(SLOT)) expect(s, `${e.id}: {${s}}`).toMatch(OK_SLOT);
      for (const [by, , x] of turnTexts(e)) {
        // A player knows one real name: their own ("Hi, I'm Seaburn" on a goodbye video).
        if (by === 'host') continue;
        const others = new RegExp(`\\{(?!${by}\\.real\\})[abc]\\.(real|aka)\\}`);
        expect(x, `${e.id}: a player cannot know the real name`).not.toMatch(others);
      }
      for (const [by, kind, x] of turnTexts(e)) {
        if (kind !== 'send' && kind !== 'post') expect(x, `${e.id}: emoji and hashtags live in messages`).not.toMatch(/\{[et]:/);
        for (const [, k] of x.matchAll(/\{e:([A-Za-z0-9]+)\}/g)) expect(EMOJI, `${e.id}: emoji ${k}`).toHaveProperty(k);
        for (const [, t] of x.matchAll(/\{t:([A-Za-z0-9]+)\}/g)) expect(t, `${e.id}: hashtag`).toMatch(/^[A-Z][A-Za-z0-9]+$/);
        void by;
      }
    }
  });

  it('covers every key the engine can ask for with three plain entries', () => {
    const thin = POOL_KEYS.filter(k => (POOLS[k] || []).filter(e => !e.when).length < 3)
      .map(k => `${k}: ${(POOLS[k] || []).filter(e => !e.when).length}`);
    expect(thin).toEqual([]);
  });

  it('conditions only on known facts', () => {
    for (const [, e] of ENTRIES) for (const k of Object.keys(e.when || {})) expect(FACT_KEYS, `${e.id}: ${k}`).toContain(k);
  });
});

describe('the pools talk like the show', () => {
  const roster = JSON.parse(readFileSync(join(process.cwd(), 'franchise_roster.json'), 'utf8'));
  const people = (Array.isArray(roster) ? roster : roster.players || Object.values(roster)).map(p => p.name).filter(Boolean);
  // Names that are also ordinary words, allowed in a line as the word.
  const WORDS = new Set(['Chef', 'Max', 'Summer', 'Sky', 'Star', 'Hope', 'Joy', 'Will', 'Grace', 'Faith', 'Rose', 'Ivy',
    'Dawn', 'Crystal', 'Angel', 'Hunter', 'Chase', 'Lucky', 'Brick', 'Heather', 'Mike', 'Owen', 'Alan', 'Tom', 'Bill',
    'Scary', 'Honey', 'Baby', 'Sugar', 'Queen', 'King', 'Duke', 'Ace', 'Blue', 'Red', 'Storm', 'River']);
  const FIRST = [...new Set(people.map(n => n.split(' ')[0]).filter(n => n.length > 2 && !WORDS.has(n)))];
  const STANDINS = ['Sammie', 'Chloe', 'Raven', 'Madelyn', 'Jadejha', 'Terilisha', 'Joey', 'Shubham', 'Chris', 'Frank',
    'Kyle', 'Darian', 'Garret', 'Rebecca', 'Mercedeze', 'Carol', 'Nathan', 'Jared', 'Imani', 'Gianna'];

  it('writes no names into a pool', () => {
    const bad = [];
    for (const [, e] of ENTRIES) for (const x of allTexts(e)) {
      const bare = x.replace(SLOT, ' ');
      for (const n of [...FIRST, ...STANDINS]) if (new RegExp(`\\b${n}\\b`).test(bare)) bad.push(`${e.id}: ${n}`);
    }
    expect(bad).toEqual([]);
  });

  it('borrows no other show\'s vocabulary', () => {
    const bad = [];
    for (const [, e] of ENTRIES) for (const x of allTexts(e)) {
      const f = foreignWordsIn(x.replace(SLOT, ' '), 'the-circle');
      if (f.length) bad.push(`${e.id}: ${f.join(', ')}`);
    }
    expect(bad).toEqual([]);
  });

  it('writes American English', () => {
    const UK = /\b(colour|favourite|mum|realise[ds]?|whilst|apologise[ds]?|organise[ds]?|mate|bloody|brilliant|fancy|knackered|gutted|telly|loo|innit|reckon)\b/i;
    for (const [, e] of ENTRIES) for (const x of allTexts(e)) expect(x, e.id).not.toMatch(UK);
  });

  it('is fluent, not clever: no stings, no epigrams, no jokes to decode', () => {
    const CLEVER = ['the energy of', 'nobody asked for', 'which is new', "it doesn't help", 'and they both notice',
      'sits with it', 'main character', 'understood the assignment', 'it takes another', 'nobody can argue',
      "that's how i knew", 'but on purpose', 'with extra steps', 'would like a word', 'doing a lot of work',
      'which says enough', 'which is an answer', 'a second too long', 'somehow that', 'is proof of that',
      'the bar is on the floor', 'i will die on this hill', 'for all the wrong reasons', 'this is how it ends',
      'chef\'s kiss', 'living rent free', 'it\'s giving', 'no notes', 'the plot thickens', 'and scene'];
    const bad = [];
    for (const [, e] of ENTRIES) for (const x of allTexts(e)) for (const c of CLEVER) if (x.toLowerCase().includes(c)) bad.push(`${e.id}: "${c}"`);
    expect(bad).toEqual([]);
  });

  // Only a MESSAGE needs an answer. A question said out loud to yourself
  // ('Getting old?') is how people talk; the transcripts are full of them.
  it('answers every question: a question is followed by the other speaker, or the asker leaves', () => {
    const bad = [];
    for (const [, e] of ENTRIES) {
      const ts = e.turns || [];
      ts.forEach((t, i) => {
        const last = (t.send || '').replace(/\{[et]:[A-Za-z0-9]+\}/g, '').trim();
        if (!last.endsWith('?') || t.by === 'host') return;
        const next = ts[i + 1];
        if (!next && !e.leaves) bad.push(`${e.id}: ends on a question`);
        else if (next && next.by === t.by && !e.leaves) bad.push(`${e.id}: turn ${i} asks and the same speaker goes on`);
      });
    }
    expect(bad).toEqual([]);
  });
});
