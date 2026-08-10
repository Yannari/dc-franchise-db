// Returning is a fact about an APPEARANCE, not about a person.
//
// Reported: a houseguest who was not marked Returning was drawn with their
// returnee portrait. Two separate reasons, and both of them let a past season
// reach into a present one.
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { resolveAvatarSlug, applyAvatarSlug, baseAvatarSlug } from '../js/players.js';
import { DEFAULT_ROSTER } from '../js/roster-data.js';

const jules = over => ({ name: 'Jules', slug: 'jules', baseSlug: 'jules',
  stats: {}, ...over });

describe('returnee art follows the checkbox, not history', () => {
  beforeEach(() => setPlayers([]));

  it('never resolves to returnee art when Returning is off', () => {
    // Even with the art confirmed present and a stale slug left over from the
    // season they DID return in.
    const p = jules({ isReturnee: false, _returneeAvatarOk: true, slug: 'jules-returnee' });
    expect(resolveAvatarSlug(p)).toBe('jules');
  });

  it('uses it when Returning is on and the art exists', () => {
    expect(resolveAvatarSlug(jules({ isReturnee: true, _returneeAvatarOk: true }))).toBe('jules-returnee');
  });

  it('falls back to the base face when the art was never made', () => {
    expect(resolveAvatarSlug(jules({ isReturnee: true, _returneeAvatarOk: false }))).toBe('jules');
  });

  it('recovers the base slug from a stale returnee one', () => {
    const p = jules({ isReturnee: false, slug: 'jules-returnee', baseSlug: undefined });
    expect(baseAvatarSlug(p)).toBe('jules');
    applyAvatarSlug(p);
    expect(p.slug, 'the stale returnee slug survived a recompute').toBe('jules');
  });

  it('draws from the rule rather than the cached slug', () => {
    // `p.slug` is a CACHE of the rule, written by applyAvatarSlug. Rendering
    // straight from it meant unticking Returning left the returnee portrait on
    // screen until something happened to recompute the field — the checkbox
    // said one thing and the face said another.
    const castUi = readFileSync('js/cast-ui.js', 'utf8');
    const castRoom = readFileSync('js/cast-room.js', 'utf8');
    expect(castUi).toMatch(/avatars\/\$\{resolveAvatarSlug\(p\)\}\.png/);
    expect(castUi, 'the card still renders the cached slug').not.toMatch(/avatars\/\$\{p\.slug\}\.png/);
    expect(castRoom).toMatch(/avatars\/\$\{esc\(_crSlug\(p\)\)\}\.png/);
  });

  it('keeps a season’s casting decision off the permanent character record', () => {
    // syncCastToRoster wrote `isReturnee` onto the franchise roster, so being a
    // returnee once made you a returnee forever, and every later season could
    // inherit it.
    const castUi = readFileSync('js/cast-ui.js', 'utf8');
    expect(castUi).toMatch(/delete FRANCHISE_ROSTER\[ri\]\.isReturnee;/);
    expect(castUi, 'the roster is still being stamped with a per-season flag')
      .not.toMatch(/FRANCHISE_ROSTER\[ri\]\.isReturnee = p\.isReturnee/);
  });

  it('ships a roster with no appearance flags on it', () => {
    // One had already leaked in, which is how this was found.
    const leaked = DEFAULT_ROSTER.filter(r => 'isReturnee' in r).map(r => r.name);
    expect(leaked, 'a per-season flag is baked into the shipped character list').toEqual([]);
  });
});
