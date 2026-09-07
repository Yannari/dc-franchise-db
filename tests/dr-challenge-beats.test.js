// ══════════════════════════════════════════════════════════════════════
// dr-challenge-beats.test.js — the contract for the challenge-phase pools
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_BEATS, CHALLENGE_IDS, unwrittenChallengeTiers, challengeBeatCount,
} from '../js/dr/data/challenge-beats.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

/**
 * Are two lines the same beat reworded?
 *
 * Measured on the WHOLE line rather than its opening, and that distinction is
 * the whole point. The first version compared the first eighteen characters
 * and demanded all four differ, which is right for an ordinary scene and wrong
 * for a ritual: three of the winner's lines open with "Condragulations"
 * because that is the word the show says every single week, and the guard
 * called correct prose a failure.
 *
 * Shared vocabulary across a whole line is the real signal for a reworded
 * sentence, and a shared catchphrase at the front is not.
 */
function tooSimilar(x, y) {
  const words = t => new Set(String(t).toLowerCase().match(/[a-z']+/g) || []);
  const a = words(x);
  const b = words(y);
  if (!a.size || !b.size) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size) > 0.6;
}

const SCOPES = ['once', 'per-queen'];
const STEPS = ['maxi-announce', 'mini', 'choice', 'maxi-perform'];

describe('the schema', () => {
  it('every beat is complete and uniquely named', () => {
    expect(new Set(CHALLENGE_IDS).size).toBe(CHALLENGE_IDS.length);
    for (const b of CHALLENGE_BEATS) {
      expect(STEPS, `${b.id} sits in step "${b.step}"`).toContain(b.step);
      expect(SCOPES, `${b.id} has scope "${b.scope}"`).toContain(b.scope);
      expect(b.note, `${b.id} has no note`).toBeTruthy();
      expect(b.tierBy, `${b.id} says nothing about what picks its tier`).toBeTruthy();
      expect(b.tiers.length, `${b.id} has no tiers`).toBeGreaterThan(0);
      expect(new Set(b.tiers.map(t => t.id)).size, `${b.id} repeats a tier id`).toBe(b.tiers.length);
      for (const t of b.tiers) {
        expect(t.note, `${b.id}/${t.id} has no note`).toBeTruthy();
        expect(Array.isArray(t.lines), `${b.id}/${t.id} lines is not an array`).toBe(true);
      }
    }
  });

  it('covers all four phases that had no beats at all', () => {
    for (const step of STEPS) {
      expect(CHALLENGE_BEATS.filter(b => b.step === step).length, `"${step}" has no beats`)
        .toBeGreaterThan(0);
    }
  });

  it('adds real volume to the phases that were bare markers', () => {
    // These four steps produced about 3 scenes between them before this file.
    const n = challengeBeatCount({ living: 10, reacting: 3, moments: 1 });
    expect(n, `only ${n} beats added`).toBeGreaterThanOrEqual(25);
  });

  it('never uses {b}, because nothing here is a pair beat', () => {
    for (const b of CHALLENGE_BEATS) {
      for (const t of b.tiers) {
        for (const l of t.lines) {
          expect(l, `${b.id}/${t.id} uses {b}`).not.toMatch(/\{b\}/);
          if (b.speaker !== 'host') {
            expect(l, `${b.id}/${t.id} has no host but uses {c}`).not.toMatch(/\{c\}/);
          }
          const bad = l.match(/\{(?!a\}|c\})[^}]*\}/);
          expect(bad, `${b.id}/${t.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
        }
      }
    }
  });
});

describe('the lines', () => {
  const written = CHALLENGE_BEATS.flatMap(b => b.tiers.filter(t => t.lines.length).map(t => ({ b, t })));

  it('there is an exemplar to write against', () => {
    expect(written.length).toBeGreaterThan(0);
  });

  it('a written tier has four genuinely different variants', () => {
    for (const { b, t } of written) {
      expect(t.lines.length, `${b.id}/${t.id}`).toBeGreaterThanOrEqual(4);
      expect(new Set(t.lines).size, `${b.id}/${t.id} repeats a line`).toBe(t.lines.length);
      for (let i = 0; i < t.lines.length; i++) {
        for (let k = i + 1; k < t.lines.length; k++) {
          expect(tooSimilar(t.lines[i], t.lines[k]),
            `${b.id}/${t.id}: variants ${i + 1} and ${k + 1} are the same beat reworded`).toBe(false);
        }
      }
    }
  });

  it('speaks this show and no other', () => {
    for (const { b, t } of written) {
      for (const l of t.lines) {
        const bad = foreignWordsIn(l, 'drag-race');
        expect(bad, `${b.id}/${t.id} says "${bad[0]}"`).toEqual([]);
      }
    }
  });

  it('writes prose, not a caption', () => {
    for (const { b, t } of written) {
      for (const l of t.lines) {
        expect(l.length, `${b.id}/${t.id} has a one-liner`).toBeGreaterThan(80);
      }
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const left = unwrittenChallengeTiers();
    const total = CHALLENGE_BEATS.reduce((n, b) => n + b.tiers.length, 0);
    // eslint-disable-next-line no-console
    console.log(`challenge phases: ${total - left.length} of ${total} tiers written.`
      + `\nstill to write (${left.length}): ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});
