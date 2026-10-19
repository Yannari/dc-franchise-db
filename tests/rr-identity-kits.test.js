// The Ridonculous Race: every team identity has its own lines, for every hook (dialogue plan, Task 4+).
import { describe, it, expect } from 'vitest';
import { KITS, HOOKS } from '../js/rr/script/identity.js';
import { IDENTITIES } from '../js/rr/identities.js';
import { REAL } from '../js/rr/places.js';

const VOTE_WORDS = /\b(vote[sd]?|voting|ballots?|tribal|jury|evict(ed|ion)?|nominat(e|ed|ion)|the Arena|immunity)\b/i;
const SLOTS = ['partner', 'identity', 'teamB', 'identityB'];

describe('rr identity kits', () => {
  it('every identity has a kit', () => {
    for (const id of Object.keys(IDENTITIES)) expect(KITS[id], id).toBeTruthy();
  });

  it('every hook has two voice lines and two specific lines', () => {
    for (const [id, kit] of Object.entries(KITS)) for (const h of HOOKS) {
      expect((kit.voice?.[h] || []).length, `${id} voice.${h}`).toBeGreaterThanOrEqual(2);
      expect((kit.specific?.[h] || []).length, `${id} specific.${h}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('lines name only their slots, no real place, no vote words', () => {
    for (const [id, kit] of Object.entries(KITS)) for (const part of ['voice', 'specific']) for (const [h, lines] of Object.entries(kit[part] || {})) {
      expect(HOOKS, `${id}.${part}.${h}`).toContain(h);
      for (const l of lines) {
        for (const m of l.matchAll(/\{(\w+)(?:\.\w+)?\}/g)) expect(SLOTS, `${id}.${part}.${h}: ${l}`).toContain(m[1]);
        expect(REAL.test(l), `${id}: ${l}`).toBe(false);
        expect(VOTE_WORDS.test(l), `${id}: ${l}`).toBe(false);
      }
    }
  });

  it('a voice line never names its own identity (a custom team borrows it)', () => {
    for (const [id, kit] of Object.entries(KITS)) {
      const name = IDENTITIES[id]?.name;
      if (!name) continue;
      const word = name.split(' ')[0].replace(/s$/, '');
      for (const lines of Object.values(kit.voice || {})) for (const l of lines) {
        expect(new RegExp(`\\b${word}`, 'i').test(l), `${id} voice: ${l}`).toBe(false);
      }
    }
  });
});
