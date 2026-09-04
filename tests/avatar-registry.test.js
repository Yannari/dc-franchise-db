import { describe, it, expect, beforeEach } from 'vitest';
import {
  setPortraitCatalog, portraitOptions, hasShowPortraits, resolvePortrait, avatarUrl,
  legacyPortraitSelection, isSafePortraitFile,
} from '../js/avatar-registry.js';

const CATALOG = {
  schemaVersion: 1,
  players: {
    bowie: {
      defaults: { global: 'base', 'total-drama': 'td-original', traitors: 'tr-castle' },
      portraits: [
        { id: 'base', show: 'global', label: 'Profile default', file: 'bowie.png' },
        { id: 'td-original', show: 'total-drama', label: 'Original season', file: 'bowie.png' },
        { id: 'td-return', show: 'total-drama', label: 'Second TD appearance', file: 'bowie-returnee.png' },
        { id: 'td-third', show: 'total-drama', label: 'Third TD appearance', file: 'bowie-td3.png' },
        { id: 'bb-1', show: 'big-brother', label: 'House look', file: 'bowie-bb.png' },
        { id: 'tr-castle', show: 'traitors', label: 'Castle outfit', file: 'bowie-tr.png' },
      ],
    },
    plain: {
      defaults: { global: 'base' },
      portraits: [{ id: 'base', show: 'global', label: 'Profile default', file: 'plain.png' }],
    },
  },
};
const FILES = ['bowie.png', 'bowie-returnee.png', 'bowie-td3.png', 'bowie-bb.png', 'bowie-tr.png', 'plain.png'];

beforeEach(() => setPortraitCatalog(CATALOG, FILES));

describe('resolution order', () => {
  it('1. prefers a safe historical snapshot', () => {
    const r = resolvePortrait({ playerSlug: 'bowie', show: 'traitors', avatarId: 'tr-castle', avatarFile: 'bowie-returnee.png' });
    expect(r.file).toBe('bowie-returnee.png');
    expect(r.source).toBe('season-snapshot');
  });
  it('2. uses the selected id when there is no snapshot', () => {
    expect(resolvePortrait({ playerSlug: 'bowie', show: 'total-drama', avatarId: 'td-third' }))
      .toMatchObject({ file: 'bowie-td3.png', source: 'selected-id' });
  });
  it('3. falls to the show default when the id is unknown', () => {
    expect(resolvePortrait({ playerSlug: 'bowie', show: 'traitors', avatarId: 'nope' }))
      .toMatchObject({ file: 'bowie-tr.png', source: 'show-default' });
  });
  it('4. falls to the global default when the show has none', () => {
    expect(resolvePortrait({ playerSlug: 'bowie', show: 'big-brother' }))
      .toMatchObject({ file: 'bowie.png', source: 'global-default' });
  });
  it('5. falls to the legacy base file for a player not in the catalog', () => {
    expect(resolvePortrait({ playerSlug: 'ghost', show: 'total-drama' }))
      .toMatchObject({ file: 'ghost.png', source: 'legacy-default' });
  });
  it('6. reports a fallback for no slug at all', () => {
    expect(resolvePortrait({ playerSlug: '', show: 'total-drama' }).source).toBe('fallback');
  });
});

describe('show isolation', () => {
  it('a big-brother portrait never appears in the traitors options', () => {
    const ids = portraitOptions('bowie', 'traitors').map(o => o.id);
    expect(ids).toContain('tr-castle');
    expect(ids).not.toContain('bb-1');
    expect(ids).not.toContain('td-return');
  });
  it('the global portrait is offered last, after the show-specific ones', () => {
    const opts = portraitOptions('bowie', 'traitors');
    expect(opts[opts.length - 1].id).toBe('base');
    expect(opts[opts.length - 1].isGlobal).toBe(true);
  });
  it('supports unlimited portraits for one player and show', () => {
    expect(portraitOptions('bowie', 'total-drama').filter(o => !o.isGlobal)).toHaveLength(3);
  });
  it('an unknown show is treated as global only - never as total-drama', () => {
    expect(portraitOptions('bowie', 'the-mole').map(o => o.id)).toEqual(['base']);
    expect(resolvePortrait({ playerSlug: 'bowie', show: 'the-mole' }))
      .toMatchObject({ file: 'bowie.png', source: 'global-default' });
  });
  it('a player with only a global portrait offers exactly that', () => {
    expect(portraitOptions('plain', 'big-brother').map(o => o.id)).toEqual(['base']);
    expect(hasShowPortraits('plain', 'big-brother')).toBe(false);
    expect(hasShowPortraits('bowie', 'traitors')).toBe(true);
  });
});

describe('safety', () => {
  it.each(['../x.png', 'a/b.png', 'a\\b.png', 'http://x/y.png', 'data:image/png;base64,AAA', '.hidden.png', 'note.txt'])
    ('rejects %s', f => expect(isSafePortraitFile(f)).toBe(false));
  it('accepts a plain basename', () => expect(isSafePortraitFile('bowie-tr.png')).toBe(true));
  it('an unsafe snapshot is ignored, not rendered', () => {
    const r = resolvePortrait({ playerSlug: 'bowie', show: 'traitors', avatarFile: '../evil.png' });
    expect(r.file).toBe('bowie-tr.png');
    expect(r.url).not.toContain('..');
  });
});

describe('missing files', () => {
  it('marks a registered-but-absent file missing without changing the choice', () => {
    setPortraitCatalog(CATALOG, ['bowie.png']);
    expect(portraitOptions('bowie', 'traitors').find(o => o.id === 'tr-castle').missing).toBe(true);
    expect(resolvePortrait({ playerSlug: 'bowie', show: 'traitors' }).missing).toBe(true);
  });
});

describe('avatarUrl', () => {
  it('accepts a bare slug', () => expect(avatarUrl('plain')).toBe('assets/avatars/plain.png'));
  it('accepts a player object and honours its stored selection', () => {
    expect(avatarUrl({ slug: 'bowie', show: 'total-drama', avatarId: 'td-return' })).toBe('assets/avatars/bowie-returnee.png');
  });
  it('accepts a snapshot-only object', () => {
    expect(avatarUrl({ slug: 'bowie', avatarFile: 'bowie-td3.png' })).toBe('assets/avatars/bowie-td3.png');
  });
  it('strips a legacy mutated slug back to identity', () => {
    expect(avatarUrl({ slug: 'bowie-returnee', show: 'traitors' })).toBe('assets/avatars/bowie-tr.png');
  });
});

describe('legacyPortraitSelection', () => {
  it('maps a mutated -returnee slug onto the catalog entry with that file', () => {
    expect(legacyPortraitSelection({ slug: 'bowie-returnee', baseSlug: 'bowie', isReturnee: true }, 'total-drama'))
      .toEqual({ avatarId: 'td-return', avatarFile: 'bowie-returnee.png' });
  });
  it('maps the isReturnee + _returneeAvatarOk shape', () => {
    expect(legacyPortraitSelection({ slug: 'bowie', isReturnee: true, _returneeAvatarOk: true }, 'total-drama'))
      .toEqual({ avatarId: 'td-return', avatarFile: 'bowie-returnee.png' });
  });
  it('a plain returnee with no returnee art gets the show/global default', () => {
    expect(legacyPortraitSelection({ slug: 'plain', isReturnee: true, _returneeAvatarOk: true }, 'total-drama'))
      .toEqual({ avatarId: 'base', avatarFile: 'plain.png' });
  });
  it('a non-returnee gets the show default, not the returnee art', () => {
    expect(legacyPortraitSelection({ slug: 'bowie', isReturnee: false }, 'total-drama'))
      .toEqual({ avatarId: 'td-original', avatarFile: 'bowie.png' });
  });
  it('never returns the returnee art for a different show', () => {
    expect(legacyPortraitSelection({ slug: 'bowie', isReturnee: true, _returneeAvatarOk: true }, 'traitors'))
      .toEqual({ avatarId: 'tr-castle', avatarFile: 'bowie-tr.png' });
  });
});
