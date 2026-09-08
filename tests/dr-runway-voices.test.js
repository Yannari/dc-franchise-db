// ══════════════════════════════════════════════════════════════════════
// dr-runway-voices.test.js — the contract for the runway's three pools
// ══════════════════════════════════════════════════════════════════════
//
// Run this while filling js/dr/data/runway-voices.js. It reports what is
// still unwritten and rejects anything that breaks a rule.
//
// The rules that matter here and nowhere else in the show are the two that
// keep the join working. Three pools are concatenated into one paragraph, so
// each must know only its own axis: a theme line that says how the look
// landed is wrong, and a swagger line that names the garment is wrong, and
// both of them render as a sentence that contradicts the one beside it.
import { describe, expect, it } from 'vitest';
import {
  RUNWAY_THEMES, RUNWAY_VOICES, RUNWAY_SWAGGER,
  RUNWAY_TIER_IDS, RUNWAY_FIT_IDS,
  SWAGGER_BY_ARCHETYPE, SWAGGER_GROUPS, THEME_BY_CATEGORY,
  swaggerGroupFor, themeFamilyFor, fitTierFor,
  themeLinesFor, voiceLinesFor, swaggerLinesFor,
  unwrittenRunwayVoices, runwayVoiceTierCount,
} from '../js/dr/data/runway-voices.js';
import { DRAG_STYLES } from '../js/dr/queen.js';
import { RUNWAY_CATEGORIES } from '../js/dr/data/runways.js';
import { ARCHETYPES } from '../js/core.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

/** Same similarity measure the stage pools use: shared vocabulary, whole line. */
function tooSimilar(x, y) {
  const words = t => new Set(String(t).toLowerCase().match(/[a-z']+/g) || []);
  const a = words(x);
  const b = words(y);
  if (!a.size || !b.size) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size) > 0.6;
}

/** Every (pool, key, tier, line) written anywhere, flattened once. */
const written = [
  ...RUNWAY_THEMES.flatMap(f => f.tiers.map(t => ({ pool: 'theme', key: f.family, t }))),
  ...RUNWAY_VOICES.flatMap(v => v.tiers.map(t => ({ pool: 'voice', key: v.style, t }))),
  ...RUNWAY_SWAGGER.flatMap(g => g.tiers.map(t => ({ pool: 'swagger', key: g.group, t }))),
].filter(x => x.t.lines.length);

describe('the schema', () => {
  it('covers every drag style a queen can have', () => {
    // dragOf() gives every queen a style, authored or derived, so a missing
    // style here is a queen the runway cannot speak for.
    const covered = RUNWAY_VOICES.map(v => v.style);
    expect(new Set(covered).size, 'a style is listed twice').toBe(covered.length);
    for (const s of DRAG_STYLES) expect(covered, `no voice for "${s}"`).toContain(s);
  });

  it('covers every archetype in the franchise', () => {
    for (const a of Object.keys(ARCHETYPES)) {
      expect(SWAGGER_BY_ARCHETYPE[a], `archetype "${a}" is in no swagger group`).toBeTruthy();
    }
    const groups = RUNWAY_SWAGGER.map(g => g.group);
    for (const g of SWAGGER_GROUPS) expect(groups, `no swagger pool for "${g}"`).toContain(g);
  });

  it('files every authored runway category, and falls back for the rest', () => {
    const families = RUNWAY_THEMES.map(f => f.family);
    for (const c of RUNWAY_CATEGORIES) {
      const fam = themeFamilyFor(c.label);
      expect(THEME_BY_CATEGORY[c.label], `"${c.label}" is filed under no family`).toBeTruthy();
      expect(families, `"${c.label}" is filed under a family that does not exist`).toContain(fam);
    }
    // A week with no authored category gets "<Challenge> eleganza", and a
    // Ball invents its own. Those must land somewhere rather than crash.
    expect(themeFamilyFor('Snatch Game eleganza')).toBe('open');
    expect(families).toContain('open');
  });

  it('tiers the pools by the right axis', () => {
    for (const f of RUNWAY_THEMES) {
      expect(f.tiers.map(t => t.id), `theme:${f.family}`).toEqual(RUNWAY_FIT_IDS);
    }
    for (const v of RUNWAY_VOICES) {
      expect(v.tiers.map(t => t.id), `voice:${v.style}`).toEqual(RUNWAY_TIER_IDS);
    }
    for (const g of RUNWAY_SWAGGER) {
      expect(g.tiers.map(t => t.id), `swagger:${g.group}`).toEqual(RUNWAY_TIER_IDS);
    }
    for (const x of [...RUNWAY_THEMES, ...RUNWAY_VOICES, ...RUNWAY_SWAGGER]) {
      for (const t of x.tiers) expect(t.note, `a tier with no note for the writer`).toBeTruthy();
    }
  });

  it('reads the fit from the category, three ways', () => {
    expect(fitTierFor('spooky', 'Night of a Thousand Ghouls')).toBe('home');
    expect(fitTierFor('pageant', 'Night of a Thousand Ghouls')).toBe('against');
    expect(fitTierFor('dancer', 'Night of a Thousand Ghouls'),
      'a style that is neither flattered nor fought is neutral').toBe('neutral');
    expect(fitTierFor('camp', 'Best Drag'),
      'a prompt that names no styles cannot be fought').toBe('neutral');
    expect(fitTierFor('camp', 'Snatch Game eleganza'),
      'an uncatalogued category declares nothing, so it flatters nobody').toBe('neutral');
    expect(fitTierFor('', 'Showgirl')).toBe('neutral');
  });

  it('keeps most of the room neutral, which is what a two-style prompt means', () => {
    /* THE MEASUREMENT THAT FORCED `clashes` TO EXIST. Reading `fit === 0` as
       a clash filed eight styles in ten under `against`, so the off-theme
       paragraph fired for almost every queen and a four-variant tier printed
       the same words three times in one runway. Ten styles against every
       authored category: home and against should each be a minority. */
    let home = 0; let against = 0; let neutral = 0;
    for (const c of RUNWAY_CATEGORIES) {
      for (const s of DRAG_STYLES) {
        const t = fitTierFor(s, c.label);
        if (t === 'home') home++; else if (t === 'against') against++; else neutral++;
      }
    }
    const total = home + against + neutral;
    expect(neutral / total, 'most of the room should have no strong relation to the prompt')
      .toBeGreaterThan(0.5);
    expect(against / total, 'fighting the prompt must stay rarer than not').toBeLessThan(0.3);
    expect(home / total, 'somebody has to be at home in it').toBeGreaterThan(0.1);
  });

  it('never names a clash a category also flatters', () => {
    for (const c of RUNWAY_CATEGORIES) {
      for (const s of c.clashes || []) {
        expect(c.styles || [], `"${c.label}" both flatters and fights ${s}`).not.toContain(s);
        expect(DRAG_STYLES, `"${c.label}" fights "${s}", which is not a drag style`).toContain(s);
      }
      // A prompt that asks everybody the same question cannot be fought.
      if (!(c.styles || []).length) {
        expect(c.clashes || [], `"${c.label}" names no styles but names a clash`).toEqual([]);
      }
    }
  });

  it('hands back null for an unwritten tier rather than a placeholder', () => {
    // stage.js falls back to the narrator on a null, which is what lets this
    // file ship empty and be filled one style at a time.
    expect(voiceLinesFor('not-a-style', 'stunning')).toBeNull();
    expect(themeLinesFor('open', 'not-a-fit')).toBeNull();
    expect(swaggerLinesFor('scrapper', 'not-a-tier')).toBeNull();
    expect(swaggerGroupFor('brainiac'), 'an unknown archetype falls to the neutral group')
      .toBe('scrapper');
  });
});

describe('the lines', () => {
  it('speaks in the first person, because she is the one speaking', () => {
    // The whole point of the file. A line that slips back into "she walks
    // out" is the narrator this pool exists to replace.
    for (const { pool, key, t } of written) {
      for (const l of t.lines) {
        expect(l, `${pool}:${key}/${t.id} is written in the third person`)
          .toMatch(/\b(I|I'm|I've|I'd|I'll|my|me|mine|myself)\b/);
      }
    }
  });

  it('keeps each pool on its own axis', () => {
    for (const { pool, key, t } of written) {
      for (const l of t.lines) {
        if (pool === 'theme') {
          expect(l, `theme:${key}/${t.id} does not name the category`).toMatch(/\{c\}/);
        } else {
          /* A VOICE OR SWAGGER LINE MAY NOT NAME THE CATEGORY. It lands after
             a theme line that already named it, so a second mention reads as
             a stutter — and on a fallback walk there is no theme line and the
             category has not been introduced at all. */
          expect(l, `${pool}:${key}/${t.id} names the category, which is the theme line's job`)
            .not.toMatch(/\{c\}/);
        }
        const bad = l.match(/\{(?!a\}|c\})[^}]*\}/);
        expect(bad, `${pool}:${key}/${t.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
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
        // Shorter than the stage pools on purpose: these are clauses of one
        // paragraph rather than whole paragraphs, and the swagger line is a
        // single closing sentence.
        expect(l.length, `${pool}:${key}/${t.id} has a one-liner`).toBeGreaterThan(40);
      }
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const left = unwrittenRunwayVoices();
    const total = runwayVoiceTierCount();
    // eslint-disable-next-line no-console
    console.log(`runway voices: ${total - left.length} of ${total} tiers written`
      + ` (${(total - left.length) * 4}+ of ${total * 4} lines).`
      + `\nstill to write (${left.length}): ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});
