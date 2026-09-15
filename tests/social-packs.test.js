// ══════════════════════════════════════════════════════════════════════
// social-packs.test.js — a show that brings its own fandom brings all of it
// ══════════════════════════════════════════════════════════════════════
//
// The feed was one library written for shows decided by a vote, shown to a
// castle and a runway. Swapping nouns did not fix that: "the table got the
// read wrong" and "the lip sync was hers" are not the same sentence as "that
// was a blindside" with a different word in it. So a show declares a PACK
// (js/social/packs/) — its own events, topics, words, regulars and host takes
// — and keeps only the shared FANDOM layer.
//
// Every arm here is a way a pack can be half-built and still look finished: a
// topic that fires on a kind nobody emits, a kind nobody talks about, a host
// voice that goes silent on the show's biggest night, a line in another show's
// words. Each of those reads fine in the file and is silence or a wrong noun
// on screen.
import { describe, expect, it } from 'vitest';
import { allPacks } from '../js/social/packs/index.js';
import { TOPICS, EVENT_KINDS, topicsFor } from '../js/social/topics.js';
import { PHRASINGS } from '../js/social/phrasings.js';
import { SLOT_NAMES } from '../js/social/sampler.js';
import { TRAIT_TAKES } from '../js/social/voices.js';
import { ARCHETYPES, PERSONAS, personasFor } from '../js/social/personas.js';
import { words, eventLabel } from '../js/social/adapter.js';
import { SHOWS, DEFAULT_FORMAT } from '../js/shows.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

const PACKS = allPacks();
const streamsOf = t => (t.stream === 'both' ? ['timeline', 'chat'] : [t.stream]);
const slotsIn = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]);

it('there is at least one pack, or everything below is vacuous', () => {
  expect(PACKS.length).toBeGreaterThan(0);
});

describe.each(PACKS.map(p => [p.format, p]))('the %s pack', (format, pack) => {
  const kinds = Object.keys(pack.kinds || {});
  const w = words(format);

  it('belongs to a registered show and never reuses a shared topic id', () => {
    expect(SHOWS[format], `${format} is not in js/shows.js`).toBeTruthy();
    const shared = new Set(TOPICS.map(t => t.id));
    for (const t of pack.topics) expect(shared.has(t.id), `${t.id} shadows a shared topic`).toBe(false);
  });

  it('fires every topic on a kind that exists, and talks about every kind it emits', () => {
    const known = new Set([...EVENT_KINDS, ...kinds]);
    for (const t of pack.topics) {
      expect(t.triggers.length, `${t.id} can never fire`).toBeGreaterThan(0);
      for (const k of t.triggers) expect(known.has(k), `${t.id} triggers on unknown "${k}"`).toBe(true);
      expect(t.reads.length, `${t.id} reads nothing`).toBeGreaterThan(0);
    }
    for (const k of kinds) {
      expect(pack.topics.some(t => t.triggers.includes(k)), `nothing reacts to "${k}"`).toBe(true);
      expect(pack.kinds[k].label, `"${k}" has no label`).toBeTruthy();
      expect(eventLabel(k, format)).toBe(pack.kinds[k].label);
      for (const implied of pack.kinds[k].implies || []) {
        expect(EVENT_KINDS, `"${k}" implies unknown "${implied}"`).toContain(implied);
      }
    }
  });

  it('gives every topic words in every room it claims, in real slots only', () => {
    const gaps = [];
    for (const t of pack.topics) {
      for (const stream of streamsOf(t)) {
        for (const shape of t.shapes) {
          const pool = pack.phrasings?.[t.id]?.[shape]?.[stream];
          if (!Array.isArray(pool) || pool.length < 6) gaps.push(`${t.id}/${shape}/${stream}: ${pool?.length || 0}`);
          for (const line of pool || []) {
            for (const s of slotsIn(line)) {
              if (!SLOT_NAMES.includes(s)) gaps.push(`${t.id}/${shape}/${stream} uses {${s}}`);
            }
          }
        }
      }
      expect(pack.topicAim?.[t.id], `${t.id} has no aim`).toBeTruthy();
    }
    expect(gaps).toEqual([]);
  });

  it('gives the alumni room a take on every kind, and every host voice a take on the big ones', () => {
    for (const k of kinds) {
      expect(pack.chatTakes?.[k]?.length ?? 0, `the room has nothing for "${k}"`).toBeGreaterThanOrEqual(8);
    }
    expect(Object.keys(pack.hostTakes || {}).sort(), 'a host voice is missing')
      .toEqual(Object.keys(TRAIT_TAKES).sort());
    const covered = Object.keys(Object.values(pack.hostTakes)[0] || {}).sort();
    expect(covered.length, 'host voices cover no kinds').toBeGreaterThan(0);
    for (const [trait, byKind] of Object.entries(pack.hostTakes)) {
      expect(Object.keys(byKind).sort(), `${trait} covers different kinds`).toEqual(covered);
      for (const [k, pool] of Object.entries(byKind)) {
        expect(pool.length, `${trait} has too little for ${k}`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('speaks its own show, and renders without a hole', () => {
    const bad = [];
    const check = (where, text) => {
      if (typeof text !== 'string' || !text.trim()) { bad.push(`${where}: empty`); return; }
      if (/undefined|\$\{/.test(text)) bad.push(`${where}: hole — ${text.slice(0, 80)}`);
      const foreign = foreignWordsIn(text, format);
      if (foreign.length) bad.push(`${where}: ${foreign.join(',')} — ${text.slice(0, 80)}`);
    };
    for (const [topic, shapes] of Object.entries(pack.phrasings || {})) {
      for (const [shape, streams] of Object.entries(shapes)) {
        for (const [stream, pool] of Object.entries(streams)) {
          pool.forEach((line, i) => check(`${topic}/${shape}/${stream}#${i}`, line));
        }
      }
    }
    for (const [k, pool] of Object.entries(pack.chatTakes || {})) {
      pool.forEach((fn, i) => check(`chat/${k}#${i}`, fn({ s: 'Gwen', w, k: eventLabel(k, format) })));
    }
    for (const [trait, byKind] of Object.entries(pack.hostTakes || {})) {
      for (const [k, pool] of Object.entries(byKind)) {
        pool.forEach((fn, i) => check(`${trait}/${k}#${i}`, fn({ s: 'Gwen', w, k: eventLabel(k, format) })));
      }
    }
    for (const p of pack.personas || []) check(`persona ${p.handle}`, p.handle.replace(/_/g, ' '));
    expect(bad).toEqual([]);
  });

  it('says a name the way a person would, not three times in one breath', () => {
    // A take cannot use a pronoun, so the easy way out is the name again — and
    // "Carrie deserved a proper exit and got a morning where Carrie simply never
    // walked in. I'm furious on Carrie's behalf." was found by reading an
    // episode, not by any other arm here.
    const bad = [];
    const count = fn => (fn({ s: 'Qqq', w, k: 'K' }).match(/Qqq/g) || []).length;
    for (const [k, pool] of Object.entries(pack.chatTakes || {})) {
      pool.forEach((fn, i) => { if (count(fn) >= 3) bad.push(`chat/${k}#${i}`); });
    }
    for (const [trait, byKind] of Object.entries(pack.hostTakes || {})) {
      for (const [k, pool] of Object.entries(byKind)) {
        pool.forEach((fn, i) => { if (count(fn) >= 3) bad.push(`${trait}/${k}#${i}`); });
      }
    }
    expect(bad).toEqual([]);
  });

  it('brings regulars who are complete and collide with nobody', () => {
    const shared = new Set(PERSONAS.map(p => p.handle));
    const mine = (pack.personas || []).map(p => p.handle);
    expect(mine.length).toBeGreaterThanOrEqual(4);
    expect(new Set(mine).size, 'two regulars share a handle').toBe(mine.length);
    for (const p of pack.personas) {
      expect(shared.has(p.handle), `${p.handle} is already a franchise regular`).toBe(false);
      expect(p.handle).toMatch(/^@[a-z0-9_]+$/);
      expect(ARCHETYPES).toContain(p.archetype);
      expect(p.platforms.length).toBeGreaterThan(0);
    }
    const crowd = personasFor(format);
    for (const a of ARCHETYPES) {
      expect(crowd.some(p => p.archetype === a), `nobody watching ${format} is a ${a}`).toBe(true);
    }
    for (const room of ['timeline', 'chat']) {
      expect(crowd.some(p => p.platforms.includes(room)), `nobody posts in the ${room}`).toBe(true);
    }
  });

  it('draws no shared GAME topic, whatever the event', () => {
    const allowed = new Set([...TOPICS.filter(t => t.layer === 'fandom'), ...pack.topics].map(t => t.id));
    for (const kind of [...EVENT_KINDS, ...kinds]) {
      for (const stream of ['timeline', 'chat']) {
        for (const t of topicsFor(kind, stream, format)) {
          expect(allowed.has(t.id), `${format} drew ${t.id} on ${kind}`).toBe(true);
        }
      }
    }
  });
});

describe('the shared library', () => {
  it('keeps the fandom layer true of every show', () => {
    const bad = [];
    for (const t of TOPICS.filter(x => x.layer === 'fandom')) {
      for (const [shape, streams] of Object.entries(PHRASINGS[t.id] || {})) {
        for (const [stream, pool] of Object.entries(streams)) {
          for (const line of pool) {
            for (const format of Object.keys(SHOWS)) {
              const foreign = foreignWordsIn(line, format);
              if (foreign.length) bad.push(`${t.id}/${shape}/${stream} on ${format}: ${foreign.join(',')}`);
            }
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('leaves a show with no pack exactly as it was', () => {
    for (const kind of EVENT_KINDS) {
      for (const stream of ['timeline', 'chat']) {
        expect(topicsFor(kind, stream, DEFAULT_FORMAT)).toEqual(topicsFor(kind, stream));
      }
    }
    expect(personasFor(DEFAULT_FORMAT)).toBe(PERSONAS);
    expect(personasFor('big-brother')).toBe(PERSONAS);
  });
});
