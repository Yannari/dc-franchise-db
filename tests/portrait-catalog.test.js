import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from '../tools/gen-avatar-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ok = () => ({
  schemaVersion: 1,
  players: {
    bowie: {
      defaults: { global: 'base', 'total-drama': 'td-return' },
      portraits: [
        { id: 'base', show: 'global', label: 'Profile default', file: 'bowie.png' },
        { id: 'td-return', show: 'total-drama', label: 'Second TD appearance', file: 'bowie-returnee.png' },
      ],
    },
  },
});
const FILES = new Set(['bowie.png', 'bowie-returnee.png']);
const codes = (c, f = FILES, refs = []) => validateCatalog(c, f, refs).map(p => p.code);

describe('validateCatalog', () => {
  it('accepts a well-formed catalog', () => {
    expect(validateCatalog(ok(), FILES, [])).toEqual([]);
  });

  it('rejects a duplicate portrait id', () => {
    const c = ok();
    c.players.bowie.portraits.push({ id: 'base', show: 'global', label: 'Dupe', file: 'bowie.png' });
    expect(codes(c)).toContain('duplicate-id');
  });

  it('rejects an unknown show key', () => {
    const c = ok();
    c.players.bowie.portraits[1].show = 'the-mole';
    expect(codes(c)).toContain('unknown-show');
  });

  it.each(['../secrets/bowie.png', 'a/b.png', 'a\\b.png', 'http://x/y.png', '.hidden.png', 'note.txt'])
    ('rejects the unsafe filename %s', file => {
      const c = ok();
      c.players.bowie.portraits[0].file = file;
      expect(codes(c)).toContain('unsafe-file');
    });

  it('rejects a missing file', () => {
    const c = ok();
    c.players.bowie.portraits[0].file = 'nobody.png';
    expect(codes(c)).toContain('missing-file');
  });

  it('requires exactly one valid global default', () => {
    const c = ok();
    c.players.bowie.defaults.global = 'nope';
    expect(codes(c)).toContain('bad-global-default');
  });

  it('rejects a show default that points at another show', () => {
    const c = ok();
    c.players.bowie.defaults['big-brother'] = 'td-return';
    expect(codes(c)).toContain('bad-show-default');
  });

  it('rejects deleting an id a saved season still references', () => {
    const refs = [{ playerSlug: 'bowie', avatarId: 'tr-castle', source: 'data/seasons/x-data.json' }];
    expect(codes(ok(), FILES, refs)).toContain('deleted-historical-id');
  });

  it('accepts a retained alias for a retired id', () => {
    const c = ok();
    c.players.bowie.aliases = { 'tr-castle': 'base' };
    const refs = [{ playerSlug: 'bowie', avatarId: 'tr-castle', source: 'data/seasons/x-data.json' }];
    expect(validateCatalog(c, FILES, refs)).toEqual([]);
  });

  it('allows duplicate labels', () => {
    const c = ok();
    c.players.bowie.portraits[1].label = 'Profile default';
    expect(validateCatalog(c, FILES, [])).toEqual([]);
  });

  it('flags a non-png as informational, not an error', () => {
    const c = ok();
    c.players.bowie.portraits[0].file = 'bowie.webp';
    const problems = validateCatalog(c, new Set(['bowie.webp', 'bowie-returnee.png']), []);
    expect(problems.map(p => p.code)).toEqual(['non-png']);
  });
});

describe('the committed catalog', () => {
  it('validates against the real avatars directory', () => {
    const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/avatars/portrait-catalog.json'), 'utf8'));
    const files = new Set(fs.readdirSync(path.join(ROOT, 'assets/avatars'))
      .filter(f => /\.(png|webp|jpe?g|gif)$/i.test(f)));
    expect(validateCatalog(cat, files, [])).toEqual([]);
  });

  it('agrees with the generated file inventory', () => {
    const inv = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/avatars/available-files.json'), 'utf8'));
    const onDisk = fs.readdirSync(path.join(ROOT, 'assets/avatars'))
      .filter(f => /\.(png|webp|jpe?g|gif)$/i.test(f)).sort();
    expect(inv.files).toEqual(onDisk);
  });
});
