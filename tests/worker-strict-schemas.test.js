// ══════════════════════════════════════════════════════════════════════
// worker-strict-schemas.test.js — a whole mode that 400s on every call
// ══════════════════════════════════════════════════════════════════════
//
// "Still says 'No narrative has been written for this season yet' after my
// export."
//
// The export ran, the fill ran, the worker was reachable and had the mode. It
// answered:
//
//   Invalid schema for response_format 'wiki_fill': In context=('properties',
//   'players','items'), 'required' is required to be supplied and to be an
//   array including every key in properties. Missing 'lead'.
//
// OpenAI's structured output with `strict: true` demands that `required` list
// EVERY key in `properties`. `lead` had been added to the schema and never
// added to `required`, so every wiki-fill call this worker has ever made was
// refused before it reached a model — for every show, not just Drag Race.
//
// The fill turned that 400 into `players: []` and reported "the worker
// returned no players", which reads as a writer with nothing to say rather
// than as a request that never happened. It was found by posting the fill's
// own payload at the deployed worker and reading the error, and it could not
// have been found any other way: the repo looks entirely correct.
//
// Sweeping for it found five more in the same shape across two workers, all in
// `episode_analytics`. Hence a guard on the CLASS.
//
// The opposite mistake is equally fatal and this file caught me making it: a
// `required` naming a key that is NOT in `properties` is refused just as hard.
// A field a model may legitimately omit belongs in the schema as a nullable
// type — `{ type: ["string", "null"] }` — never as a missing `required` entry.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WORKER_DIR = 'worker';
const files = readdirSync(WORKER_DIR).filter(f => f.endsWith('.js'));

/**
 * Every `properties: { … }` object in the source, with the keys it declares
 * and the `required: [ … ]` that closes the same object.
 *
 * A brace walk rather than a JSON parse: these schemas are JavaScript object
 * literals with comments, template strings and computed values in them, so
 * there is nothing to `JSON.parse`. The walk skips strings and comments so a
 * `{` inside a description cannot throw the depth off — the first version did
 * not, and it reported a property from a neighbouring object.
 */
function schemaObjects(src) {
  const out = [];
  for (let at = src.indexOf('properties:'); at !== -1; at = src.indexOf('properties:', at + 1)) {
    const open = src.indexOf('{', at);
    if (open === -1) continue;
    let depth = 0;
    let i = open;
    const keys = [];
    let pending = '';
    for (; i < src.length; i++) {
      const c = src[i];
      // Skip a string.
      if (c === '"' || c === "'" || c === '`') {
        const q = c;
        i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
        continue;
      }
      // Skip a comment.
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
      if (c === '{') { depth++; pending = ''; continue; }
      if (c === '}') { depth--; if (depth === 0) break; pending = ''; continue; }
      if (depth === 1) {
        if (/[A-Za-z0-9_$]/.test(c)) { pending += c; continue; }
        if (c === ':' && pending) { keys.push(pending); pending = ''; continue; }
        if (!/\s/.test(c)) pending = '';
      }
    }
    // The `required` belonging to THIS object: after its closing brace, before
    // the enclosing object ends.
    const tail = src.slice(i + 1, i + 500);
    const m = tail.match(/^[\s,]*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*required:\s*\[([^\]]*)\]/);
    if (!m) continue;
    /* ── A SCHEMA BUILT FROM A SPREAD CHECKS ITSELF ──
       `properties: { …, ...extra }` with `required: [ …, ...Object.keys(extra) ]`
       agrees by construction, and no static read can see through it. Skipping
       it is right; flagging it would train the reader to ignore this file. */
    if (m[1].includes('...') || src.slice(open, i + 1).includes('...')) continue;
    const required = m[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    out.push({ line: src.slice(0, open).split('\n').length, keys, required });
  }
  return out;
}

describe('every strict worker schema', () => {
  const strict = files.filter(f =>
    readFileSync(join(WORKER_DIR, f), 'utf8').includes('strict: true'));

  it('finds the workers that use structured output', () => {
    expect(strict.length, 'no worker sends a strict schema?').toBeGreaterThan(0);
  });

  for (const f of strict) {
    const src = readFileSync(join(WORKER_DIR, f), 'utf8');
    const objs = schemaObjects(src);

    it(`${f}: requires every property it declares`, () => {
      const bad = objs
        .map(o => ({ ...o, missing: o.keys.filter(k => !o.required.includes(k)) }))
        .filter(o => o.missing.length)
        .map(o => `${f}:${o.line} missing from required: ${o.missing.join(', ')}`);
      expect(bad, `strict mode refuses these outright:\n${bad.join('\n')}`).toEqual([]);
    });

    it(`${f}: requires nothing it does not declare`, () => {
      // The mistake in the other direction, and just as fatal.
      const bad = objs
        .map(o => ({ ...o, extra: o.required.filter(k => !o.keys.includes(k)) }))
        .filter(o => o.extra.length)
        .map(o => `${f}:${o.line} required but not a property: ${o.extra.join(', ')}`);
      expect(bad, `strict mode refuses these outright:\n${bad.join('\n')}`).toEqual([]);
    });
  }

  it('has a required list for the wiki fill that includes the lead', () => {
    /* The one that was reported, named so a regression is legible rather than
       being one line in a sweep. */
    const src = readFileSync(join(WORKER_DIR, 'worker-season-live.js'), 'utf8');
    const at = src.indexOf('name: "wiki_fill"');
    expect(at, 'the wiki_fill mode is gone').toBeGreaterThan(-1);
    expect(src).toMatch(/required:\s*\["name",\s*"lead",\s*"personality",\s*"quotes",\s*"trivia"\]/);
  });
});
