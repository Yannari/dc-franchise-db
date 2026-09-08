// ══════════════════════════════════════════════════════════════════════
// dr-brief-voices.test.js — the contract for the announcement pools
// ══════════════════════════════════════════════════════════════════════
//
// Run this while filling js/dr/data/brief-voices.js. It reports what is still
// unwritten and rejects anything that breaks a rule.
//
// The rule that matters here and nowhere else is coverage: every challenge in
// the catalogue must land on a family that exists, because a challenge with
// no family falls to `generic` and `generic` is the tier that cannot say what
// the week involves. That fallback is correct for a one-off and wrong for a
// challenge somebody shipped a whole module for.
import { describe, expect, it } from 'vitest';
import {
  BRIEF_FAMILIES, APTITUDE_IDS,
  briefFamily, briefLinesFor, reactionLinesFor,
  unwrittenBriefVoices, briefVoiceTierCount,
} from '../js/dr/data/brief-voices.js';
import { MAXI_PERFORMANCE, familyForChallenge } from '../js/dr/data/maxi-performance.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

function tooSimilar(x, y) {
  const words = t => new Set(String(t).toLowerCase().match(/[a-z']+/g) || []);
  const a = words(x);
  const b = words(y);
  if (!a.size || !b.size) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size) > 0.6;
}

const written = BRIEF_FAMILIES.flatMap(f => [
  { pool: 'brief', key: f.family, t: f.brief },
  ...f.reactions.map(t => ({ pool: 'reaction', key: f.family, t })),
]).filter(x => x.t.lines.length);

describe('the schema', () => {
  it('carries a brief for every performance family', () => {
    /* THE TWO FILES MUST NOT DRIFT. familyForChallenge() is the shared
       mapping, so a family added to maxi-performance.js and not to this one
       would silently take the `generic` brief — the exact fallback this file
       exists to stop a real challenge from using. */
    const mine = BRIEF_FAMILIES.map(f => f.family);
    for (const f of MAXI_PERFORMANCE) {
      expect(mine, `family "${f.family}" has a performance pool but no brief`).toContain(f.family);
    }
    expect(new Set(mine).size, 'a family is listed twice').toBe(mine.length);
    expect(mine, 'there is no fallback family').toContain('generic');
  });

  it('never lets a real challenge fall back to generic', () => {
    for (const c of MAXI_TYPES) {
      const fam = familyForChallenge(c.id).family;
      expect(briefFamily(fam).family,
        `challenge "${c.id}" resolves to a family with no brief`).toBe(fam);
      expect(fam, `challenge "${c.id}" has no family of its own`).not.toBe('generic');
    }
  });

  it('tiers every family the same three ways, and says whether it is solo', () => {
    for (const f of BRIEF_FAMILIES) {
      expect(f.reactions.map(t => t.id), `${f.family}`).toEqual(APTITUDE_IDS);
      expect(typeof f.solo, `${f.family} does not say whether it is solo`).toBe('boolean');
      expect(f.note, `${f.family} has no note for the writer`).toBeTruthy();
      expect(f.brief.note, `${f.family}'s brief has no note`).toBeTruthy();
      for (const t of f.reactions) expect(t.note, `${f.family}/${t.id} has no note`).toBeTruthy();
    }
  });

  it('hands back null for an unwritten family rather than a placeholder', () => {
    // stage.js falls back to the generic beat on a null, which is what lets
    // this file ship empty and be filled a family at a time.
    expect(reactionLinesFor('talent-show', 'not-a-tier')).toBeNull();
    expect(briefFamily('not-a-family').family,
      'an unknown family falls to the one written for unknowns').toBe('generic');
    expect(briefLinesFor('not-a-family')).toBe(briefLinesFor('generic'));
  });
});

describe('the lines', () => {
  it('keeps each pool on its own axis', () => {
    for (const { pool, key, t } of written) {
      for (const l of t.lines) {
        if (pool === 'brief') {
          /* THE BRIEF IS ADDRESSED TO THE ROOM. Singling a queen out belongs
             to the reaction beat, which fires straight afterwards for the
             three queens it is actually about. */
          expect(l, `brief:${key} names a queen, which is the reaction's job`)
            .not.toMatch(/\{a\}/);
        }
        const bad = l.match(/\{(?!a\}|c\})[^}]*\}/);
        expect(bad, `${pool}:${key}/${t.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
  });

  it('does not put a team in a solo challenge', () => {
    /* THE MEASUREMENT THAT BUILT THIS FILE. A Talent Show is one queen alone
       on a bare stage, and the generic reactions had her casting a group,
       choreographing a number and picking fabric. A solo family's prose may
       not reach for the machinery of a team challenge. */
    const TEAM = /\b(teams?|teammates?|captains?|casting|cast (?:her|the) |groups?|rehearse together|the others in her team)\b/i;
    for (const { pool, key, t } of written) {
      const f = briefFamily(key);
      if (!f.solo) continue;
      for (const l of t.lines) {
        expect(TEAM.test(l),
          `${pool}:${key}/${t.id} is a solo challenge but reaches for a team`).toBe(false);
      }
    }
  });

  it('a written tier has four genuinely different variants', () => {
    for (const { pool, key, t } of written) {
      expect(t.lines.length, `${pool}:${key}/${t.id} has ${t.lines.length}`)
        .toBeGreaterThanOrEqual(4);
      expect(new Set(t.lines).size, `${pool}:${key}/${t.id} repeats a line`).toBe(t.lines.length);
      for (let i = 0; i < t.lines.length; i++) {
        for (let k = i + 1; k < t.lines.length; k++) {
          expect(tooSimilar(t.lines[i], t.lines[k]),
            `${pool}:${key}/${t.id}: variants ${i + 1} and ${k + 1} are the same line reworded`)
            .toBe(false);
        }
      }
    }
  });

  it('speaks this show and no other', () => {
    for (const { pool, key, t } of written) {
      for (const l of t.lines) {
        const bad = foreignWordsIn(l, 'drag-race');
        expect(bad, `${pool}:${key}/${t.id} says "${bad[0]}", which belongs to another show`)
          .toEqual([]);
      }
    }
  });

  it('writes prose, not a caption', () => {
    for (const { pool, key, t } of written) {
      for (const l of t.lines) {
        expect(l.length, `${pool}:${key}/${t.id} has a one-liner`).toBeGreaterThan(80);
      }
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const left = unwrittenBriefVoices();
    const total = briefVoiceTierCount();
    // eslint-disable-next-line no-console
    console.log(`brief voices: ${total - left.length} of ${total} tiers written.`
      + `\nstill to write (${left.length}): ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});
