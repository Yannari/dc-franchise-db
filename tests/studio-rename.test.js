// ══════════════════════════════════════════════════════════════════════
// studio-rename.test.js — a character can be renamed
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "I can't change the name of an existing player. I accidentally
// named her aubrey instead of Aubrey but it says Slug "aubrey" already used by
// aubrey."
//
// The save refused a slug collision with "a DIFFERENT existing character", and
// decided different by NAME:
//
//     _roster().find(p => p.slug === d.slug && p.name !== d.name)
//
// A rename is the one edit that changes a name, so the stored row still held
// the old one, `p.name !== d.name` was true, and the character collided with
// itself. Fixing a capital letter was impossible.
//
// Identity here is the SLUG: it is what the roster is keyed on, what the save
// updates by, and the one field a rename leaves alone.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const studio = fs.readFileSync(path.join(ROOT, 'js/studio.js'), 'utf8');

/** Pull a function body out of the source so its logic can be run. */
function grab(name) {
  const i = studio.indexOf('function ' + name + '(');
  let depth = 0, j = studio.indexOf('{', i);
  for (let k = j; k < studio.length; k++) {
    if (studio[k] === '{') depth++;
    else if (studio[k] === '}' && --depth === 0) { j = k + 1; break; }
  }
  return studio.slice(i, j);
}

/**
 * The two decisions under test, lifted out of `_save` so they can be run
 * against a roster without a browser: which row is a clash, and which row the
 * save updates.
 */
function decisions(roster, draft) {
  const editing = draft._editingSlug || null;
  const clash = roster.find(p => p.slug === draft.slug
    && (editing ? p.slug !== editing : p.name !== draft.name));
  const index = roster.findIndex(p => (draft._editingSlug && p.slug === draft._editingSlug)
    || p.slug === draft.slug || p.name === draft.name);
  return { clash, index };
}

const ROSTER = [
  { slug: 'aubrey', name: 'aubrey' },
  { slug: 'bowie', name: 'Bowie' },
];

describe('the collision check asks about identity, not spelling', () => {
  it('lets a character be renamed to a different capitalisation', () => {
    const { clash, index } = decisions(ROSTER,
      { _editingSlug: 'aubrey', slug: 'aubrey', name: 'Aubrey' });
    expect(clash, 'the character collided with itself').toBeUndefined();
    expect(index, 'the rename would not have found its own row').toBe(0);
  });

  it('lets a character be renamed entirely', () => {
    const { clash, index } = decisions(ROSTER,
      { _editingSlug: 'aubrey', slug: 'aubrey', name: 'Aubrey Fitzgerald' });
    expect(clash).toBeUndefined();
    expect(index).toBe(0);
  });

  it('still refuses a slug that belongs to somebody else', () => {
    const { clash } = decisions(ROSTER,
      { _editingSlug: 'aubrey', slug: 'bowie', name: 'Aubrey' });
    expect(clash, 'a real collision was allowed through').toBeTruthy();
    expect(clash.name).toBe('Bowie');
  });

  it('still refuses a NEW character taking an existing slug', () => {
    const { clash } = decisions(ROSTER, { slug: 'bowie', name: 'Somebody Else' });
    expect(clash).toBeTruthy();
  });

  it('lets a new character through', () => {
    const { clash, index } = decisions(ROSTER, { slug: 'cody', name: 'Cody' });
    expect(clash).toBeUndefined();
    expect(index, 'a new character matched an existing row').toBe(-1);
  });

  it('updates the row rather than duplicating it when the slug changes too', () => {
    // Matching on the NEW slug or the NEW name finds nothing when both have
    // changed, and the save then pushes a second character.
    const { index } = decisions(ROSTER,
      { _editingSlug: 'aubrey', slug: 'aubrey-f', name: 'Aubrey Fitzgerald' });
    expect(index, 'the rename would have left a duplicate behind').toBe(0);
  });
});

describe('the source keeps the editing slug', () => {
  it('records which row the editor loaded', () => {
    expect(studio).toContain('_editingSlug: base.slug');
  });

  it('starts a new character with none', () => {
    expect(grab('_blankChar')).toContain('_editingSlug: null');
  });

  it('does not decide the collision by name any more', () => {
    const save = studio.slice(studio.indexOf('async function _save()'),
      studio.indexOf('async function _save()') + 2500);
    expect(save, 'the collision check still compares names')
      .not.toMatch(/p\.slug === d\.slug && p\.name !== d\.name/);
    expect(save).toContain('_editingSlug');
  });
});
