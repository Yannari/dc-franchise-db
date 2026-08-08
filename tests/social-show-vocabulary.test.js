// There is no block on Total Drama.
//
// The alumni takes were written in one show's language and shown to both, so a
// Total Drama night read "Alessio is on the block. Fight or do not. Nobody is
// coming." No block, no nomination ceremony, no pawn, no veto, no houseguests —
// and a `nomination` event on that show is somebody who TOOK VOTES at a
// ceremony and stayed, which is a different fact needing different words.
//
// Two classes of fix behind this. Most were a noun: `the block` becomes
// `w.onDanger`, which is "on the block" in one show and "in the crosshairs" in
// the other. The rest were Big Brother by STRUCTURE — a veto meeting, a
// replacement nominee, a double eviction — and a noun swap there produces a
// Total Drama sentence describing a Big Brother mechanic, which is worse than
// the original because it sounds right. Those were rewritten to be about the
// thing both shows have: somebody the room has decided about.
import { describe, expect, it } from 'vitest';
import { GENERIC_TAKES, LENS_TAKES, TAKES } from '../js/social/chat.js';
import { TRAIT_TAKES } from '../js/social/voices.js';
import { words } from '../js/social/adapter.js';

/** Words that belong to exactly one show and must never cross. */
const BB_ONLY = /\b(the block|on the block|pawns?|vetos?|vetoes|HOH|head of household|houseguests?|nomination|nominated|nominees?|evicted?|eviction)/i;
const TD_ONLY = /\b(the crosshairs|tribal council|campfire ceremony|marshmallow)/i;

/** Every line the room can produce, rendered in one show's vocabulary. */
function everyLine(format) {
  const w = words(format);
  const out = [];
  const push = (label, pool) => {
    for (const fn of pool || []) out.push([label, fn({ s: 'Ted', w, k: 'moment' })]);
  };
  for (const [name, byKind] of Object.entries(TRAIT_TAKES)) {
    for (const [kind, pool] of Object.entries(byKind)) push(`trait:${name}/${kind}`, pool);
  }
  for (const [name, byKind] of Object.entries(LENS_TAKES)) {
    for (const [kind, pool] of Object.entries(byKind)) push(`lens:${name}/${kind}`, pool);
  }
  for (const [kind, pool] of Object.entries(TAKES)) push(`general/${kind}`, pool);
  push('generic', GENERIC_TAKES);
  return out;
}

describe('the room speaks the show it is in', () => {
  it('never says block, pawn, veto or nominee on Total Drama', () => {
    const wrong = everyLine('total-drama')
      .filter(([, text]) => BB_ONLY.test(text))
      .map(([where, text]) => `${where}: ${text.slice(0, 90)}`);
    expect(wrong, `${wrong.length} lines still speak Big Brother`).toEqual([]);
  });

  it('never says crosshairs or tribal council on Big Brother', () => {
    const wrong = everyLine('big-brother')
      .filter(([, text]) => TD_ONLY.test(text))
      .map(([where, text]) => `${where}: ${text.slice(0, 90)}`);
    expect(wrong, `${wrong.length} lines still speak Total Drama`).toEqual([]);
  });

  it('renders both shows without leaving a hole', () => {
    // A take that reaches for a word its show does not define prints
    // "undefined" mid-sentence, which is how a vocabulary gets a gap nobody
    // notices until it is on screen.
    for (const format of ['total-drama', 'big-brother']) {
      for (const [where, text] of everyLine(format)) {
        expect(text, `${where} printed undefined`).not.toMatch(/undefined/);
        expect(text, `${where} left a slot`).not.toMatch(/\$\{/);
      }
    }
  });

  it('actually says something different in each show', () => {
    // The point of the vocabulary is that the two shows diverge. If every line
    // renders identically, the words are not being used.
    const a = everyLine('total-drama').map(([, t]) => t);
    const b = everyLine('big-brother').map(([, t]) => t);
    const differ = a.filter((t, i) => t !== b[i]).length;
    expect(differ, 'no line changes between shows').toBeGreaterThan(20);
  });
});

describe('the vocabulary is complete', () => {
  const KEYS = ['danger', 'Danger', 'onDanger', 'nominated', 'nominee', 'pawn',
    'Pawn', 'ceremony', 'Ceremony', 'jury', 'safe', 'home', 'vote', 'challenge'];

  it('defines every term in both shows and in the fallback', () => {
    // The generic set is what an unregistered show gets, and a missing key
    // there is an `undefined` on a page nobody is testing.
    for (const format of ['total-drama', 'big-brother', 'nonsense-show']) {
      const w = words(format);
      for (const key of KEYS) {
        expect(typeof w[key], `${format} has no "${key}"`).toBe('string');
        expect(w[key].length, `${format}.${key} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it('reads correctly after the subject', () => {
    // `nominated` follows a name — "Ted was nominated" / "Ted took votes" — so
    // it carries its own verb rather than assuming one.
    expect(words('big-brother').nominated).toMatch(/^was /);
    expect(words('total-drama').nominated).not.toMatch(/^was /);
  });
});
