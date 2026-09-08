// ══════════════════════════════════════════════════════════════════════
// dr-stage-beats.test.js — the contract for the main stage pools
// ══════════════════════════════════════════════════════════════════════
//
// Run this while filling js/dr/data/stage-beats.js. It reports what is still
// unwritten and rejects anything that breaks a rule.
import { describe, expect, it } from 'vitest';
import {
  STAGE_BEATS, STAGE_IDS, unwrittenStageTiers, thinStageTiers, stageBeatCount,
} from '../js/dr/data/stage-beats.js';
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

const SCOPES = ['once', 'per-queen', 'pair', 'per-judge'];
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
          /* A BEAT MAY NAME A JUDGE IF IT HAS ONE. `speaker: 'judge'` means
             the judge is talking; `judged: true` means the HOST is talking
             ABOUT a judge, which is what the panel introductions do. Both
             have a judge in scope, so both may use {j}. */
          if (b.speaker !== 'judge' && !b.judged) {
            expect(l, `${b.id}/${t.id} has no judge but uses {j}`).not.toMatch(/\{j\}/);
          }
          // {k} is a guest judge's credit and exists nowhere else.
          if (!b.judged) {
            expect(l, `${b.id}/${t.id} has no judge but uses {k}`).not.toMatch(/\{k\}/);
          }
          /* {c} IS THE CATEGORY AND ONLY ONE BEAT SAYS IT. Naming the prompt
             twice in an opening reads as a stutter, and naming it in a beat
             that fires before the host has announced it is a spoiler. */
          if (!b.category) {
            expect(l, `${b.id}/${t.id} does not announce the category but uses {c}`)
              .not.toMatch(/\{c\}/);
          }
          if (b.step !== 'lipsync') {
            expect(l, `${b.id}/${t.id} is not a lip sync but names a song`).not.toMatch(/\{s\}/);
          }
          const bad = l.match(/\{(?!a\}|b\}|j\}|s\}|c\}|k\})[^}]*\}/);
          expect(bad, `${b.id}/${t.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
        }
      }
    }
  });
});

describe('the announcement', () => {
  /* THE ONE BEAT THAT HAS TO SAY SOMETHING SPECIFIC. Every other pool in this
     file is free prose; this one carries the only statement of what the
     queens were asked to walk in, and a variant that forgets {c} renders an
     opening that announces nothing. */
  it('every written category call names the category', () => {
    const b = STAGE_BEATS.find(x => x.category);
    expect(b, 'no beat is marked as the one that announces the category').toBeTruthy();
    for (const t of b.tiers) {
      for (const l of t.lines) {
        expect(l, `${b.id}/${t.id} announces the category without naming it`)
          .toMatch(/\{c\}/);
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
    const thin = thinStageTiers();
    const total = STAGE_BEATS.reduce((n, b) => n + b.tiers.length, 0);
    /* THIN IS REPORTED, NOT FAILED. A ritual beat fires once a night and has
       nothing to collide with inside a single render pass, so a four-variant
       pool is seen three times across a twelve-episode season — thin rather
       than broken. The hard floor stays at four everywhere, because below
       four a tier repeats inside ONE episode, which is the actual bug. */
    // eslint-disable-next-line no-console
    console.log(`main stage: ${total - left.length} of ${total} tiers written.`
      + `\nstill to write (${left.length}): ${left.join(', ')}`
      + `\nthin for a ritual (${thin.length}): ${thin.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});

describe('THE RUNWAY IS NOT THE CALL', () => {
  /* A queen was described as being "in the top" on a night she was
     ELIMINATED. Found by playing forty seasons and reading every scene whose
     SUBJECT was a queen eliminated that episode — 50,764 scenes, one real
     offender, and it was not where it looked: the line lived in the
     `off-theme` tier, on a queen wearing the WRONG look.

     It read "A different runway, a different night, and {a} is in the top."
     The intent is a counterfactual — on another night this look would place —
     but the present tense states it as tonight's result, so a reader gets a
     placement claim in the show's own call vocabulary several cards before
     the panel has said anything, and sometimes about a queen who is going
     home. The runway happens BEFORE the critiques; it cannot know the call. */
  const CALL_CLAIM = /\{a\}\s+(?:is|was)\s+(?:in the top|in the bottom|safe|high|low)\b/i;

  it('no runway line tells the reader a queen placed', () => {
    const bad = [];
    for (const b of STAGE_BEATS) {
      if (b.step !== 'runway') continue;
      for (const t of b.tiers || []) {
        for (const line of t.lines || []) {
          if (CALL_CLAIM.test(line)) bad.push(`${b.id}/${t.id}: ${line.slice(0, 90)}`);
        }
      }
    }
    expect(bad, 'the runway announced a call it cannot know yet').toEqual([]);
  });
});
