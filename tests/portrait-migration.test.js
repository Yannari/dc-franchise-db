import { describe, it, expect, beforeEach } from 'vitest';
import { setPortraitCatalog } from '../js/avatar-registry.js';
import {
  ensurePortraitSelection, migrateCastPortraits, portraitSlug, playerAvatarUrl, baseAvatarSlug,
} from '../js/players.js';
import * as playersMod from '../js/players.js';

const CATALOG = {
  schemaVersion: 1,
  players: {
    bowie: {
      defaults: { global: 'base', 'total-drama': 'td-original' },
      portraits: [
        { id: 'base', show: 'global', label: 'Profile default', file: 'bowie.png' },
        { id: 'td-original', show: 'total-drama', label: 'Original', file: 'bowie.png' },
        { id: 'td-returnee', show: 'total-drama', label: 'Returning look', file: 'bowie-returnee.png' },
      ],
    },
    plain: { defaults: { global: 'base' }, portraits: [{ id: 'base', show: 'global', label: 'Default', file: 'plain.png' }] },
  },
};
beforeEach(() => setPortraitCatalog(CATALOG, ['bowie.png', 'bowie-returnee.png', 'plain.png']));

describe('ensurePortraitSelection', () => {
  it('repairs a mutated -returnee slug: identity restored, portrait recorded', () => {
    const p = ensurePortraitSelection(
      { name: 'Bowie', slug: 'bowie-returnee', baseSlug: 'bowie', isReturnee: true, _returneeAvatarOk: true },
      'total-drama');
    expect(p.slug).toBe('bowie');
    expect(p.avatarId).toBe('td-returnee');
    expect(p.avatarFile).toBe('bowie-returnee.png');
    expect(p.isReturnee).toBe(true);
    expect('_returneeAvatarOk' in p).toBe(false);
  });

  it('repairs the isReturnee + _returneeAvatarOk shape', () => {
    const p = ensurePortraitSelection({ name: 'Bowie', slug: 'bowie', isReturnee: true, _returneeAvatarOk: true }, 'total-drama');
    expect(p.avatarFile).toBe('bowie-returnee.png');
    expect(p.slug).toBe('bowie');
  });

  it('leaves a plain record on the show default', () => {
    expect(ensurePortraitSelection({ name: 'Bowie', slug: 'bowie' }, 'total-drama'))
      .toMatchObject({ avatarId: 'td-original', avatarFile: 'bowie.png', slug: 'bowie' });
  });

  it('never overwrites an explicit selection, so ticking Returning changes no art', () => {
    const p = ensurePortraitSelection({ name: 'Bowie', slug: 'bowie', avatarId: 'base', avatarFile: 'bowie.png', isReturnee: false }, 'total-drama');
    p.isReturnee = true;                            // the user flips the checkbox
    ensurePortraitSelection(p, 'total-drama');      // and a later render re-runs migration
    expect(p.avatarId).toBe('base');
    expect(p.avatarFile).toBe('bowie.png');
  });

  it('migrates once and is idempotent', () => {
    const p = { name: 'Bowie', slug: 'bowie-returnee', baseSlug: 'bowie', isReturnee: true, _returneeAvatarOk: true };
    ensurePortraitSelection(p, 'total-drama');
    const first = { ...p };
    ensurePortraitSelection(p, 'total-drama');
    expect(p).toEqual(first);
  });

  it('a returnee on a show with no returnee art gets that show default, not TD art', () => {
    const p = ensurePortraitSelection({ name: 'Bowie', slug: 'bowie', isReturnee: true, _returneeAvatarOk: true }, 'traitors');
    expect(p.avatarFile).toBe('bowie.png');
  });

  it('tolerates a player with no slug at all', () => {
    expect(() => ensurePortraitSelection({ name: 'Nobody' }, 'total-drama')).not.toThrow();
  });
});

describe('migrateCastPortraits', () => {
  it('repairs every member and tolerates junk', () => {
    const cast = [{ name: 'Bowie', slug: 'bowie-returnee', isReturnee: true, _returneeAvatarOk: true }, null];
    expect(() => migrateCastPortraits(cast, 'total-drama')).not.toThrow();
    expect(cast[0].slug).toBe('bowie');
    expect(cast[0].avatarFile).toBe('bowie-returnee.png');
  });
  it('ignores a non-array', () => expect(() => migrateCastPortraits(null, 'total-drama')).not.toThrow());
});

describe('identity helpers', () => {
  it('baseAvatarSlug still means identity', () => {
    expect(baseAvatarSlug({ baseSlug: 'bowie', slug: 'bowie-returnee' })).toBe('bowie');
    expect(baseAvatarSlug({ slug: 'bowie-returnee' })).toBe('bowie');
    expect(baseAvatarSlug(null)).toBe('');
  });
  it('portraitSlug returns canonical identity, never a -returnee slug', () => {
    expect(portraitSlug('Bowie', [{ name: 'Bowie', slug: 'bowie-returnee' }])).toBe('bowie');
    expect(portraitSlug('No Such Person', [])).toBe('no-such-person');
  });
  it('playerAvatarUrl honours the cast member selection', () => {
    expect(playerAvatarUrl({ name: 'Bowie', slug: 'bowie', avatarFile: 'bowie-returnee.png' }, 'total-drama'))
      .toBe('assets/avatars/bowie-returnee.png');
  });
  it('playerAvatarUrl falls back to the base file for somebody off the roster', () => {
    expect(playerAvatarUrl('Some Guest', 'total-drama')).toBe('assets/avatars/some-guest.png');
  });
});

describe('the slug-mutating API is gone for good', () => {
  it.each(['resolveAvatarSlug', 'applyAvatarSlug', 'refreshReturneeAvatars', 'hasReturneeArt', 'whenReturneeArtKnown'])
    ('%s is no longer exported', name => expect(playersMod[name]).toBeUndefined());
});
