// js/shows.js is the only place that knows what a show is.
//
// This is a guard about the SHAPE OF THE CODE, which is unusual and deliberate:
// the format-to-prefix map had been duplicated THREE times — here, in js/fame.js
// and in worker/worker-studio.js — and both copies were written by someone who
// knew the rule. The rule cannot enforce itself, and the worker's copy decides
// season FILENAMES, so a show missing from it writes its season over another
// show's file. That is the collision that nearly took Total Drama 1's episode log.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SHOWS, formatPrefix, seasonId, DEFAULT_FORMAT } from '../js/shows.js';
import { SEASON_FORMATS, DEFAULT_FORMAT as CORE_DEFAULT } from '../js/core.js';

const read = f => readFileSync(join(process.cwd(), f), 'utf8');

describe('the registry', () => {
  it('describes every show completely', () => {
    for (const [format, show] of Object.entries(SHOWS)) {
      expect(show.prefix, `${format} has no prefix`).toBeTruthy();
      expect(show.name, `${format} has no name`).toBeTruthy();
      expect(show.emoji, `${format} has no emoji`).toBeTruthy();
      expect(Array.isArray(show.careerStats), `${format} declares no career stats`).toBe(true);
    }
  });

  it('gives every show a distinct prefix', () => {
    const prefixes = Object.values(SHOWS).map(s => s.prefix);
    expect(new Set(prefixes).size, 'two shows share a prefix — their season IDs collide')
      .toBe(prefixes.length);
  });

  it('silently prefixes an unregistered format as the default — which is why callers must guard', () => {
    // formatPrefix falls back to the DEFAULT show rather than throwing, so an
    // unregistered format does not get a distinct prefix — it gets Total Drama's.
    // Two unknown shows would therefore both resolve to td-N-data.json and
    // overwrite each other, the very collision this registry exists to prevent.
    // Anything that turns a format into a FILENAME must reject unknown formats up
    // front; worker-studio.js's publishSeason checks SHOWS[format] for this reason.
    expect(SHOWS.wrestling).toBeUndefined();
    expect(formatPrefix('wrestling')).toBe(SHOWS['total-drama'].prefix);
    expect(Object.keys(SHOWS).length).toBeGreaterThan(0);
  });

  it('builds season IDs from it', () => {
    expect(seasonId('total-drama', 4)).toBe('td-4');
    expect(seasonId('big-brother', 1)).toBe('bb-1');
    expect(formatPrefix('big-brother')).toBe('bb');
  });
});

describe('nothing else keeps its own copy', () => {
  const sources = () => {
    const out = [];
    const walk = dir => {
      for (const entry of readdirSync(join(process.cwd(), dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(rel); }
        else if (entry.name.endsWith('.js')) out.push(rel);
      }
    };
    walk('js'); walk('worker');
    return out.filter(f => f !== 'js/shows.js');
  };

  it('has no second format-to-prefix map', () => {
    // Three shapes, because a re-introduction does not have to look like the one
    // that was deleted:
    //   forward   { 'total-drama': 'td' }
    //   inverse   { td: 'total-drama' }        — a lookup table read the other way
    //   ternary   format === 'big-brother' ? 'bb' : 'td'
    // All three turn a format into a prefix without asking the registry, which is
    // the property that matters — not the punctuation they use to do it.
    const offenders = [];
    for (const file of sources()) {
      const src = read(file);
      for (const [format, show] of Object.entries(SHOWS)) {
        const f = `['"\`]${format}['"\`]`;
        const p = `['"\`]${show.prefix}['"\`]`;
        const shapes = [
          ['forward map', new RegExp(`${f}\\s*:\\s*${p}`)],
          ['inverse map', new RegExp(`['"\`]?${show.prefix}['"\`]?\\s*:\\s*${f}`)],
          // A conditional on one line that names both the format and its prefix.
          ['ternary', new RegExp(`^.*${f}.*\\?.*${p}.*$`, 'm')],
        ];
        for (const [shape, pattern] of shapes) {
          if (pattern.test(src)) offenders.push(`${file} (${format}, ${shape})`);
        }
      }
    }
    expect(offenders, `a second prefix map appeared in: ${offenders.join(', ')}`).toEqual([]);
  });

  it("keeps core.js's format list in step with the registry", () => {
    // js/core.js cannot import the registry — CLAUDE.md requires it to stay a
    // leaf — so its SEASON_FORMATS is a legitimate second list. What is NOT
    // legitimate is the two disagreeing: seasonFormat() would reject a show the
    // rest of the site accepts, silently filing its seasons as Total Drama.
    expect([...SEASON_FORMATS].sort()).toEqual(Object.keys(SHOWS).sort());
    expect(CORE_DEFAULT).toBe(DEFAULT_FORMAT);
  });
});
