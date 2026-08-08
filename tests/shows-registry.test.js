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
import { SHOWS, formatPrefix, seasonId } from '../js/shows.js';

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
    // Matches an object literal mapping a known format to its prefix, e.g.
    //   { 'total-drama': 'td', 'big-brother': 'bb' }
    const offenders = [];
    for (const file of sources()) {
      const src = read(file);
      for (const [format, show] of Object.entries(SHOWS)) {
        const pattern = new RegExp(`['"\`]${format}['"\`]\\s*:\\s*['"\`]${show.prefix}['"\`]`);
        if (pattern.test(src)) offenders.push(`${file} (${format})`);
      }
    }
    expect(offenders, `a second prefix map appeared in: ${offenders.join(', ')}`).toEqual([]);
  });
});
