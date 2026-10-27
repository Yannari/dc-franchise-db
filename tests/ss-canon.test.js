// A Secret Story secret becomes canon on the character: written once, never changed,
// and published with the roster so the next Publish cannot wipe it.
// Spec: docs/superpowers/specs/2026-10-27-secret-story-show-design.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { canonSecretsOf } from '../js/ss/canon.js';

const state = { secrets: [
  { holders: ['Ana'], source: 'pool', kind: 'personal', secretKind: 'survived', poolId: 'plane-crash', text: 'I survived a plane crash', clues: ['a'], tells: ['b'], difficulty: 0.6 },
  { holders: ['Ben'], source: 'own', kind: 'personal', secretKind: 'job', text: 'I trained dolphins', clues: ['c'], tells: ['d'], difficulty: 0.5 },
  { holders: ['Cy', 'Di'], source: 'history', kind: 'real-pair', text: 'We are brother and sister' },
  { holders: ['Ed'], source: 'canon', kind: 'personal', text: 'old' },
  { holders: ['Fi'], source: 'history', kind: 'personal', text: 'I have already won Season 3' },
] };

describe('the canon a season creates', () => {
  const list = canonSecretsOf(state, { season: 'ss-2', slugOf: n => n.toLowerCase() });
  it('writes the personal secrets drawn or written, and nothing that is already on record', () => {
    expect(list.map(x => x.name)).toEqual(['Ana', 'Ben']);
  });
  it('keeps the kind, the clues and the season it was born in', () => {
    expect(list[0]).toMatchObject({ slug: 'ana', secret: { text: 'I survived a plane crash', kind: 'survived', id: 'plane-crash', firstSeason: 'ss-2' } });
    expect(list[1].secret).toMatchObject({ kind: 'job', clues: ['c'] });
  });
});

describe('the roster keeps it', () => {
  const src = readFileSync('worker/worker-studio.js', 'utf8');
  it('is write-once in the database', () => {
    expect(src).toMatch(/UPDATE roster SET secret = \?[^"]*WHERE slug = \? AND \(secret IS NULL/);
  });
  it('is never touched by a Studio character save', () => {
    const at = src.indexOf('INSERT INTO roster (slug');
    const save = src.slice(at, src.indexOf('.run();', at));
    expect(save).not.toMatch(/\bsecret\b/);
  });
  it('is published back out, so the next Publish cannot delete it', () => {
    expect(src).toMatch(/if \(r\.secret\)[\s\S]{0,200}out\.secret = secret/);
  });
  it('is finished by the season publish when the start could not write it', () => {
    expect(src).toMatch(/payload\.season\?\.canonSecrets/);
  });
});
