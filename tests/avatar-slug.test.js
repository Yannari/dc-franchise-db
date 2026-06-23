import { describe, it, expect } from 'vitest';
import { baseAvatarSlug, resolveAvatarSlug, applyAvatarSlug } from '../js/players.js';

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

  describe('resolveAvatarSlug', () => {
    it('newbie uses base slug', () => {
      expect(resolveAvatarSlug({ baseSlug: 'bowie', isReturnee: false })).toBe('bowie');
    });
    it('returnee uses -returnee variant ONLY when the variant is confirmed to exist', () => {
      expect(resolveAvatarSlug({ baseSlug: 'bowie', isReturnee: true, _returneeAvatarOk: true })).toBe('bowie-returnee');
    });
    it('returnee without a confirmed variant falls back to base', () => {
      expect(resolveAvatarSlug({ baseSlug: 'bowie', isReturnee: true })).toBe('bowie');
      expect(resolveAvatarSlug({ baseSlug: 'bowie', isReturnee: true, _returneeAvatarOk: false })).toBe('bowie');
    });
    it('empty slug stays empty', () => {
      expect(resolveAvatarSlug({ isReturnee: true, _returneeAvatarOk: true })).toBe('');
    });
  });

  describe('applyAvatarSlug', () => {
    it('writes canonical baseSlug + effective slug for a returnee with variant', () => {
      const p = { slug: 'bowie', isReturnee: true, _returneeAvatarOk: true };
      applyAvatarSlug(p);
      expect(p.baseSlug).toBe('bowie');     // canonical preserved
      expect(p.slug).toBe('bowie-returnee'); // effective render slug
    });
    it('newbie keeps base on .slug', () => {
      const p = { slug: 'bowie', isReturnee: false };
      applyAvatarSlug(p);
      expect(p.baseSlug).toBe('bowie');
      expect(p.slug).toBe('bowie');
    });
    it('un-flagging a returnee restores the base slug', () => {
      const p = { baseSlug: 'bowie', slug: 'bowie-returnee', isReturnee: true, _returneeAvatarOk: true };
      applyAvatarSlug(p);
      expect(p.slug).toBe('bowie-returnee');
      p.isReturnee = false;
      applyAvatarSlug(p);
      expect(p.slug).toBe('bowie'); // reverted
    });
  });
});
