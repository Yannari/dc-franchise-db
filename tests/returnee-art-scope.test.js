// Returning is a fact about an APPEARANCE, not about a person — and since the
// portrait catalog landed it is not a fact about ARTWORK at all.
//
// Originally reported: a houseguest who was not marked Returning was drawn with
// their returnee portrait, for two separate reasons, both of which let a past
// season reach into a present one. The mechanism that caused it (mutating
// p.slug to `{slug}-returnee`) is gone; these tests now hold the replacement to
// the same promise, and add the one the old design could not make — that
// ticking the box changes no picture whatsoever.
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { setPortraitCatalog } from '../js/avatar-registry.js';
import { baseAvatarSlug, ensurePortraitSelection, playerAvatarUrl } from '../js/players.js';
import { DEFAULT_ROSTER } from '../js/roster-data.js';

const CATALOG = {
  schemaVersion: 1,
  players: {
    jules: {
      defaults: { global: 'base', 'total-drama': 'td-original' },
      portraits: [
        { id: 'base', show: 'global', label: 'Profile default', file: 'jules.png' },
        { id: 'td-original', show: 'total-drama', label: 'Original', file: 'jules.png' },
        { id: 'td-returnee', show: 'total-drama', label: 'Returning look', file: 'jules-returnee.png' },
      ],
    },
    noart: { defaults: { global: 'base' }, portraits: [{ id: 'base', show: 'global', label: 'Default', file: 'noart.png' }] },
  },
};
const jules = over => ({ name: 'Jules', slug: 'jules', stats: {}, ...over });

beforeEach(() => {
  setPlayers([]);
  setPortraitCatalog(CATALOG, ['jules.png', 'jules-returnee.png', 'noart.png']);
});

describe('returnee art follows the season, not history', () => {
  it('never resolves to returnee art when Returning is off', () => {
    // Even with a stale slug left over from the season they DID return in.
    const p = ensurePortraitSelection(jules({ isReturnee: false, _returneeAvatarOk: true, slug: 'jules-returnee' }), 'total-drama');
    expect(p.avatarFile).toBe('jules.png');
    expect(playerAvatarUrl(p, 'total-drama')).toBe('assets/avatars/jules.png');
  });

  it('migrates an old returnee save onto the returnee portrait', () => {
    const p = ensurePortraitSelection(jules({ isReturnee: true, _returneeAvatarOk: true }), 'total-drama');
    expect(p.avatarFile).toBe('jules-returnee.png');
  });

  it('falls back to the base face when the art was never made', () => {
    const p = ensurePortraitSelection({ name: 'Noart', slug: 'noart', isReturnee: true, _returneeAvatarOk: true }, 'total-drama');
    expect(p.avatarFile).toBe('noart.png');
  });

  it('recovers the base slug from a stale returnee one, permanently', () => {
    const p = jules({ isReturnee: false, slug: 'jules-returnee' });
    expect(baseAvatarSlug(p)).toBe('jules');
    ensurePortraitSelection(p, 'total-drama');
    expect(p.slug, 'the stale returnee slug survived the repair').toBe('jules');
  });

  it('the checkbox cannot change the art once a portrait is chosen', () => {
    // The promise the old design could not make: artwork and returning status
    // were the same fact, so the box WAS the picker.
    const p = ensurePortraitSelection(jules({ isReturnee: false, avatarId: 'td-returnee', avatarFile: 'jules-returnee.png' }), 'total-drama');
    p.isReturnee = true;
    ensurePortraitSelection(p, 'total-drama');
    expect(p.avatarFile).toBe('jules-returnee.png');
    p.isReturnee = false;
    ensurePortraitSelection(p, 'total-drama');
    expect(p.avatarFile).toBe('jules-returnee.png');
  });

  it('draws from the season selection rather than any slug', () => {
    // Rendering from `p.slug` meant unticking Returning left the returnee
    // portrait on screen until something happened to recompute the field.
    const castUi = readFileSync('js/cast-ui.js', 'utf8');
    const castRoom = readFileSync('js/cast-room.js', 'utf8');
    expect(castUi).toMatch(/src="\$\{playerAvatarUrl\(p\)\}"/);
    expect(castUi, 'the card still renders a slug').not.toMatch(/avatars\/\$\{[^}]*slug[^}]*\}\.png/);
    expect(castRoom).toMatch(/src="\$\{esc\(_crAvatar\(p\)\)\}"/);
  });

  it('keeps a season’s casting decision off the permanent character record', () => {
    // syncCastToRoster wrote `isReturnee` onto the franchise roster, so being a
    // returnee once made you a returnee forever.
    const castUi = readFileSync('js/cast-ui.js', 'utf8');
    expect(castUi).toMatch(/delete FRANCHISE_ROSTER\[ri\]\.isReturnee;/);
    expect(castUi, 'the roster is still being stamped with a per-season flag')
      .not.toMatch(/FRANCHISE_ROSTER\[ri\]\.isReturnee = p\.isReturnee/);
  });

  it('writes an avatar to the slug that was asked for', () => {
    // The endpoint wrote `<roster slug>.png` and ignored the slug the caller
    // sent — destructive the moment anything uploaded a VARIANT, because the
    // returnee slot posted `jules-returnee` and this saved it over jules.png.
    const serve = readFileSync('serve.py', 'utf8');
    expect(serve).toMatch(/want = \(avatar\.get\('slug'\) or ''\)\.strip\(\)\.lower\(\)/);
    expect(serve, 'a slug is a filename here and is still trusted unvalidated')
      .toMatch(/re\.fullmatch\(r'\[a-z0-9\]\[a-z0-9-\]\*', want or ''\)/);
    expect(serve).toMatch(/AVATAR_DIR, target \+ '\.png'/);
  });

  it('ships a roster with no appearance flags on it', () => {
    // One had already leaked in, which is how this was found.
    const leaked = DEFAULT_ROSTER.filter(r => 'isReturnee' in r).map(r => r.name);
    expect(leaked, 'a per-season flag is baked into the shipped character list').toEqual([]);
  });
});
