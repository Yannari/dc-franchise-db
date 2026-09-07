// ══════════════════════════════════════════════════════════════════════
// dr-stage-beats.test.js — the contract for the main stage pools
// ══════════════════════════════════════════════════════════════════════
//
// Run this while filling js/dr/data/stage-beats.js. It reports what is still
// unwritten and rejects anything that breaks a rule.
import { describe, expect, it } from 'vitest';
import { STAGE_BEATS, STAGE_IDS, unwrittenStageTiers, stageBeatCount } from '../js/dr/data/stage-beats.js';
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

const SCOPES = ['once', 'per-queen', 'pair'];
const STEPS = ['main-stage', 'runway', 'critiques', 'untucked', 'results', 'lipsync', 'exit'];

describe('the schema', () => {
  it('every beat is complete and uniquely named', () => {
    expect(new Set(STAGE_IDS).size).toBe(STAGE_IDS.length);
    for (const b of STAGE_BEATS) {
      expect(b.id, 'a beat with no id').toBeTruthy();
      expect(STEPS, `${b.id} sits in step "${b.step}"`).toContain(b.step);
      expect(SCOPES, `${b.id} has scope "${b.scope}"`).toContain(b.scope);
      expect(b.note, `${b.id} has no note for the writer`).toBeTruthy();
      expect(b.tierBy, `${b.id} says nothing about what picks its tier`).toBeTruthy();
      expect(b.tiers.length, `${b.id} has no tiers`).toBeGreaterThan(0);
      expect(new Set(b.tiers.map(t => t.id)).size, `${b.id} repeats a tier id`).toBe(b.tiers.length);
      for (const t of b.tiers) {
        expect(t.note, `${b.id}/${t.id} has no note`).toBeTruthy();
        expect(Array.isArray(t.lines), `${b.id}/${t.id} lines is not an array`).toBe(true);
      }
    }
  });

  it('covers every stage step the week emits', () => {
    // The gap this whole file exists to close: each of these used to be one
    // bare marker scene with no beats inside it.
    for (const step of ['main-stage', 'runway', 'critiques', 'results', 'lipsync', 'exit']) {
      const n = STAGE_BEATS.filter(b => b.step === step).length;
      expect(n, `step "${step}" has no beats`).toBeGreaterThan(0);
    }
  });

  it('produces a full stage rather than a handful of markers', () => {
    // A mid-season night: ten walking, six on stage, two in the lip sync, one
    // going home. The point of the rewrite is that this is dozens of beats.
    const n = stageBeatCount({ walking: 10, onStage: 6, bottom: 2, exits: 1 });
    expect(n, `a mid-season stage produces only ${n} beats`).toBeGreaterThanOrEqual(30);
  });

  it('only a pair-scoped beat may use {b}', () => {
    for (const b of STAGE_BEATS) {
      for (const t of b.tiers) {
        for (const l of t.lines) {
          if (b.scope !== 'pair') {
            expect(l, `${b.id}/${t.id} is ${b.scope} but uses {b}`).not.toMatch(/\{b\}/);
          }
          if (b.speaker !== 'judge') {
            expect(l, `${b.id}/${t.id} has no judge but uses {j}`).not.toMatch(/\{j\}/);
          }
          const bad = l.match(/\{(?!a\}|b\}|j\})[^}]*\}/);
          expect(bad, `${b.id}/${t.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
        }
      }
    }
  });
});

describe('the lines', () => {
  const written = STAGE_BEATS.flatMap(b => b.tiers
    .filter(t => t.lines.length)
    .map(t => ({ b, t })));

  it('there is at least one written tier to write against', () => {
    expect(written.length, 'nothing is written at all').toBeGreaterThan(0);
  });

  it('a written tier has four genuinely different variants', () => {
    for (const { b, t } of written) {
      expect(t.lines.length, `${b.id}/${t.id} has ${t.lines.length}`).toBeGreaterThanOrEqual(4);
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
        expect(bad, `${b.id}/${t.id} says "${bad[0]}", which belongs to another show`).toEqual([]);
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
    const left = unwrittenStageTiers();
    const total = STAGE_BEATS.reduce((n, b) => n + b.tiers.length, 0);
    // eslint-disable-next-line no-console
    console.log(`main stage: ${total - left.length} of ${total} tiers written.`
      + `\nstill to write (${left.length}): ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});
