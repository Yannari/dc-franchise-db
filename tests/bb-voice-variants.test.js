// ══════════════════════════════════════════════════════════════════════
// bb-voice-variants — lines in the speaker's own register, and no more sitcom ping-pong
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15, on "Who's the worst at the comps?" / "Me." / "Definitely Ara." / "You fell off the
// thing." / "Everybody fell off the thing!": "it doesn't sound human... it's not Total Drama, it's not Big
// Brother, it's not fluid, they just repeat each other like bots". And: be simple, and let the line be the
// speaker's ("what do you want me to say" if she's mean, "I really don't know what's going on with me" if
// she's anxious). Pool turns can carry `v: { <register>: line }` (bb/story/register.js variantOf).
import { describe, expect, it } from 'vitest';
import { STORY_POOLS } from '../js/bb/story/lines/index.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { VARIANT_KEYS } from '../js/bb/story/register.js';

const ALL = { ...STORY_POOLS, ...POOLS };
const entries = () => Object.entries(ALL).flatMap(([key, list]) => (Array.isArray(list) ? list : []).map(e => [key, e]));
const slots = s => new Set([...String(s || '').matchAll(/\{(\w+)(?:\.\w+)?\}/g)].map(m => m[1]));

// A scene of quips: a run of four or more spoken lines of five words or fewer, lines that repeat two words of the
// line before ("You fell off the thing." / "Everybody fell off the thing!"), or more than half its lines tiny.
// Two of the three is the register the user rejected.
const STOP = new Set("the a an i you it is to of and in that this was me my we be not do just so on for at it's i'm you're".split(' '));
const words = s => String(s || '').toLowerCase().replace(/\{[^}]+\}/g, 'x').match(/[a-z']+/g) || [];
export function pingPong(e) {
  const says = (e.turns || []).filter(t => t.say);
  if (says.length < 4) return false;
  let run = 0, longest = 0, echo = 0;
  says.forEach((t, i) => {
    const w = words(t.say);
    run = w.length <= 5 ? run + 1 : 0; longest = Math.max(longest, run);
    if (!i) return;
    const prev = words(says[i - 1].say).filter(x => !STOP.has(x));
    const pairs = new Set(prev.slice(1).map((x, j) => `${prev[j]} ${x}`));
    const cur = w.filter(x => !STOP.has(x));
    if (cur.slice(1).some((x, j) => pairs.has(`${cur[j]} ${x}`))) echo++;
  });
  const tiny = says.filter(t => words(t.say).length <= 4).length / says.length > 0.5;
  return [longest >= 4, echo >= 2, tiny].filter(Boolean).length >= 2;
}

describe('lines in the speaker\'s own voice', () => {
  it('a variant is keyed by a register (or a family of them) the writer knows', () => {
    for (const [key, e] of entries()) for (const t of e.turns || []) for (const k of Object.keys(t.v || {})) {
      expect(VARIANT_KEYS, `${key} ${e.id} v.${k}`).toContain(k);
    }
  });

  it('a variant names nobody and nothing its scene does not (the scene was picked for its slots)', () => {
    for (const [key, e] of entries()) for (const t of e.turns || []) {
      const base = slots((e.turns || []).map(x => x.say || x.dr || x.beat || '').join(' '));
      for (const [k, line] of Object.entries(t.v || {})) for (const s of slots(line)) {
        expect(base.has(s) || s === 'comp', `${key} ${e.id} v.${k} names {${s}}`).toBe(true);
      }
    }
  });

  it('a variant is something to say, not a stage direction (a beat has no speaker to read a register from)', () => {
    for (const [key, e] of entries()) for (const t of e.turns || []) if (t.v) expect(!!t.by && !t.beat, `${key} ${e.id}`).toBe(true);
  });
});

describe('no sitcom ping-pong', () => {
  // A ratchet: the count only goes down as the rewrite goes on (206 on 2026-10-15 by the first count, 0 after the ninth: none left). A new pool
  // entry written in the old register fails here.
  const CEILING = 0;
  it(`at most ${CEILING} scenes still trade quips`, () => {
    const left = entries().filter(([, e]) => pingPong(e));
    expect(left.length, left.slice(0, 20).map(([k, e]) => `${k} ${e.id}`).join('\n')).toBeLessThanOrEqual(CEILING);
  });

  it('the scene the user quoted is gone', () => {
    const all = JSON.stringify(ALL);
    expect(all).not.toMatch(/fell off the thing/);
  });
});
