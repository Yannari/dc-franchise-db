import { describe, it, expect } from 'vitest';
import { baseAvatarSlug } from '../js/players.js';
import * as playersMod from '../js/players.js';

describe('avatar slug resolution', () => {
  describe('baseAvatarSlug', () => {
    it('prefers baseSlug', () => {
      expect(baseAvatarSlug({ baseSlug: 'bowie', slug: 'bowie-returnee' })).toBe('bowie');
    });
    it('falls back to slug, stripping a -returnee suffix defensively', () => {
      expect(baseAvatarSlug({ slug: 'bowie' })).toBe('bowie');
      expect(baseAvatarSlug({ slug: 'bowie-returnee' })).toBe('bowie');
    });
    it('handles empty / null', () => {
      expect(baseAvatarSlug({})).toBe('');
      expect(baseAvatarSlug(null)).toBe('');
    });
  });

  describe('the slug-mutating API', () => {
    // Artwork used to be chosen by rewriting p.slug, which fused identity and
    // appearance. These are gone; a portrait is chosen per season instead.
    it.each(['resolveAvatarSlug', 'applyAvatarSlug', 'refreshReturneeAvatars', 'hasReturneeArt', 'whenReturneeArtKnown'])
      ('%s is no longer exported', name => expect(playersMod[name]).toBeUndefined());
  });
});
