// The words on Dramagram: captions in a character's own voice, and comments
// from people who actually know them.
//
// Design: docs/superpowers/specs/2026-08-18-dramagram-design.md
//
// Templates by default; the AI writer is a polish pass invoked only on request.
// So this bank IS the product for most posts, and these tests are about whether
// it reads like a person rather than whether it compiles.
import { describe, expect, it } from 'vitest';
import {
  CAPTIONS, FALLBACK, COMMENTS, KIND_COMMENTS, TONES, toneFor,
  captionFor, commentsFor,
} from '../js/dramagram-voice.js';
import { KINDS, significanceOf } from '../js/life-events.js';

const ev = (kind, o = {}) => ({
  player: 'a', kind, afterSeason: 's-1', seq: 1, _sig: significanceOf(kind), ...o,
});

describe('the bank', () => {
  it('covers every tone for every kind it writes', () => {
    // A kind with only one register would put a villain's words in a hero's
    // mouth the moment that kind came up for them.
    for (const [kind, byTone] of Object.entries(CAPTIONS)) {
      for (const tone of TONES) {
        expect(byTone[tone], `${kind} has nothing in the ${tone} register`).toBeTruthy();
        expect(byTone[tone].length, `${kind}/${tone} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('maps every archetype to a register', () => {
    const ARCHETYPES = ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
      'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain',
      'goat', 'perceptive-player', 'showmancer'];
    for (const a of ARCHETYPES) {
      expect(TONES, `${a} has no register`).toContain(toneFor(a));
    }
    expect(toneFor('nonsense'), 'an unknown archetype must still speak').toBe('plain');
  });

  it('says something for every kind in the vocabulary', () => {
    // 68 kinds and a bank that covers some of them: the fallback is what stops
    // the rest rendering an empty caption.
    for (const k of KINDS) {
      const line = captionFor(ev(k.key, k.whom ? { whom: 'b' } : {}), { archetype: 'hero' });
      expect(line, `${k.key} renders no caption at all`).toBeTruthy();
    }
  });

  it('never leaves a slot unfilled', () => {
    for (const [kind, byTone] of Object.entries(CAPTIONS)) {
      for (const tone of TONES) {
        for (const t of byTone[tone]) {
          expect(t, `${kind}/${tone} has an unreplaced slot`).not.toMatch(/\{(name|whom|season)\}/);
        }
      }
    }
  });
});

describe('a caption is not the wiki line', () => {
  it('is first person', () => {
    // js/life-events.js writes "Lindsay graduated." — third person, past tense,
    // right for an article. A caption is the same fact from inside it.
    const third = /^[A-Z][a-z]+ (and [A-Z][a-z]+ )?(was|were|had|got|started|became|died)\b/;
    let checked = 0;
    for (const [kind, byTone] of Object.entries(CAPTIONS)) {
      for (const tone of TONES) {
        for (const t of byTone[tone]) {
          checked++;
          expect(t, `${kind}/${tone} reads like the encyclopedia sentence`).not.toMatch(third);
        }
      }
    }
    expect(checked).toBeGreaterThan(200);
  });

  it('keeps the hard ones short and plain', () => {
    // The life layer's craft note: the shortest true sentence, not the most
    // dramatic one available.
    for (const kind of ['bereavement', 'cancelled', 'bankruptcy', 'separated', 'sober']) {
      const bank = CAPTIONS[kind];
      if (!bank) continue;
      for (const tone of TONES) {
        for (const t of bank[tone]) {
          expect(t.length, `${kind}/${tone} is being dramatised`).toBeLessThan(90);
        }
      }
    }
  });
});

describe('the same post always reads the same way', () => {
  it('is deterministic', () => {
    const e = ev('wedding', { whom: 'b' });
    const opts = { archetype: 'villain', names: { a: 'A', b: 'B' } };
    expect(captionFor(e, opts)).toBe(captionFor(e, opts));
  });

  it('gives two different events different words', () => {
    const opts = { archetype: 'hero' };
    const one = captionFor(ev('new-job', { seq: 1 }), opts);
    const two = captionFor(ev('new-job', { seq: 7, afterSeason: 's-4' }), opts);
    expect(one).not.toBe(two);
  });

  it('gives two archetypes different words for one event', () => {
    const e = ev('wedding', { whom: 'b' });
    expect(captionFor(e, { archetype: 'hero' }))
      .not.toBe(captionFor(e, { archetype: 'villain' }));
  });
});

describe('the room under a post', () => {
  const names = { t: 'Trent', b: 'Beth', d: 'Duncan', l: 'Leshawna', r: 'Rival' };
  const close = [{ slug: 't', weight: 4 }, { slug: 'b', weight: 4 },
    { slug: 'd', weight: 3 }, { slug: 'l', weight: 3 }];

  it('is not four people saying one thing', () => {
    // A kind with one written line gave every close friend the same words:
    // four people under Lindsay's graduation all said "FOUR YEARS. you did it."
    // The pools are merged so a thin kind still reads as a room.
    const said = commentsFor(ev('graduated'), { ties: close, names }).map(c => c.text);
    expect(said.length).toBeGreaterThan(2);
    expect(new Set(said).size, `a chorus: ${said.join(' / ')}`).toBeGreaterThan(1);
  });

  it('warms with the tie and cools against it', () => {
    const out = commentsFor(ev('wedding', { whom: 'zz' }), {
      ties: [{ slug: 't', weight: 5 }, { slug: 'r', weight: -4 }], names,
    });
    const rel = Object.fromEntries(out.map(c => [c.slug, c.relation]));
    expect(rel.t).toBe('close');
    if (rel.r) expect(rel.r).toBe('rival');
  });

  it('mostly lets a rival say nothing', () => {
    // Silence is the commonest reaction to somebody you dislike doing well, and
    // a section where everybody turns up reads as a crowd rather than a life.
    let spoke = 0;
    for (let i = 0; i < 30; i++) {
      const out = commentsFor(ev('wedding', { whom: 'zz', seq: i }), {
        ties: [{ slug: 'r', weight: -4 }], names,
      });
      if (out.length) spoke++;
    }
    expect(spoke, 'every rival turns up to every post').toBeLessThan(25);
    expect(spoke, 'no rival ever speaks').toBeGreaterThan(2);
  });

  it('never has the other half of the post commenting on it', () => {
    // They are IN the wedding, not under it.
    const out = commentsFor(ev('wedding', { whom: 't' }), { ties: close, names });
    expect(out.some(c => c.slug === 't'), 'the spouse commented on their own wedding').toBe(false);
  });

  it('says nothing when nobody knows them', () => {
    expect(commentsFor(ev('wedding', { whom: 'b' }), { ties: [], names })).toEqual([]);
  });

  it('is deterministic', () => {
    const e = ev('birth');
    const a = commentsFor(e, { ties: close, names }).map(c => `${c.slug}:${c.text}`);
    const b = commentsFor(e, { ties: close, names }).map(c => `${c.slug}:${c.text}`);
    expect(a).toEqual(b);
  });

  it('caps how many turn up', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ slug: `p${i}`, weight: 4 }));
    expect(commentsFor(ev('wedding', { whom: 'zz' }), { ties: many, names }).length)
      .toBeLessThanOrEqual(4);
  });
});

describe('the banks are complete enough to use', () => {
  it('has a comment for every relation and significance', () => {
    for (const rel of ['close', 'friend', 'rival']) {
      for (const sig of ['major', 'notable', 'minor']) {
        expect(COMMENTS[rel]?.[sig]?.length, `nothing for a ${rel} on a ${sig} post`)
          .toBeGreaterThan(0);
      }
    }
  });

  it('has a fallback for every significance and register', () => {
    for (const sig of ['major', 'notable', 'minor']) {
      for (const tone of TONES) {
        expect(FALLBACK[sig]?.[tone]?.length, `no ${tone} fallback for a ${sig} event`)
          .toBeGreaterThan(0);
      }
    }
  });

  it('is a lot, as asked', () => {
    const captions = Object.values(CAPTIONS)
      .reduce((n, byTone) => n + TONES.reduce((m, t) => m + byTone[t].length, 0), 0);
    const comments = Object.values(COMMENTS)
      .reduce((n, bySig) => n + Object.values(bySig).reduce((m, a) => m + a.length, 0), 0)
      + Object.values(KIND_COMMENTS)
        .reduce((n, byRel) => n + Object.values(byRel).reduce((m, a) => m + a.length, 0), 0);
    expect(captions, 'the caption bank is thin').toBeGreaterThan(250);
    expect(comments, 'the comment bank is thin').toBeGreaterThan(60);
  });
});
