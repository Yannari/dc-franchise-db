// The Voice's party nights and the store (part 2 design §15).
import { describe, expect, it } from 'vitest';
import { throwParty, runSuperette, PARTY_THEMES } from '../js/ss/parties.js';
import { openKitties, expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { seededRandom } from './helpers/rng.js';

const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };
const H = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
const fresh = () => { const s = { secrets: H.map(n => ({ id: n, holders: [n], text: `s ${n}`, tells: ['hums a tune'], clues: ['a clue'], found: false })), theories: {}, buzzes: [] }; openKitties(s, H); return s; };
const ctxOf = (seed, over = {}) => ({ rng: rngFor(seed), week: 3, stat: (n, k) => over.stats?.[n]?.[k] ?? 5, bond: over.bond || (() => 0), archetype: () => 'hero', compat: over.compat || (() => true) });

describe('party night', () => {
  it('never puts a kiss or a flirt on two people who are not romantically compatible', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const p = throwParty(fresh(), ctxOf(seed, { bond: () => 8, compat: () => false }), { house: H });
      expect(p.moments.some(m => m.kind === 'kiss' || m.kind === 'flirt')).toBe(false);
    }
  });
  it('brings the romance out of two who like each other', () => {
    let kisses = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const p = throwParty(fresh(), ctxOf(seed, { bond: (a, b) => ([a, b].sort().join() === 'Ana,Ben' ? 8 : 0) }), { house: H });
      if (p.moments.some(m => (m.kind === 'kiss' || m.kind === 'flirt') && m.who.includes('Ana') && m.who.includes('Ben'))) kisses++;
    }
    expect(kisses).toBeGreaterThan(40);
  });
  it('lets a feud blow up, with consequences', () => {
    let fights = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const p = throwParty(fresh(), ctxOf(seed, { bond: (a, b) => ([a, b].sort().join() === 'Cy,Di' ? -7 : 0), stats: { Cy: { temperament: 2, boldness: 8 } } }), { house: H });
      const f = p.moments.find(m => m.kind === 'fight');
      if (f) { fights++; expect(p.effects.bond.some(([a, b, d]) => d < 0 && [a, b].sort().join() === 'Cy,Di')).toBe(true); }
    }
    expect(fights).toBeGreaterThan(30);
  });
  it('every party has consequences and keeps the money honest; themes do not repeat', () => {
    const s = fresh();
    const seen = new Set();
    for (let seed = 1; seed <= PARTY_THEMES.length; seed++) {
      const p = throwParty(s, ctxOf(seed), { house: H });
      expect(p.effects.bond.length + p.effects.pub.length).toBeGreaterThan(0);
      expect(seen.has(p.theme)).toBe(false); seen.add(p.theme);
      expect(actualTotal(s)).toBe(expectedTotal(s));
    }
  });
});

describe('the store', () => {
  it('stays shut after a punishment, and the house blames whoever cost it', () => {
    const r = runSuperette(fresh(), ctxOf(1), { house: H, closed: 'Ed' });
    expect(r.closed).toBe(true);
    expect(r.beats[0].text).toMatch(/store/);
    expect(r.beats[0].text).not.toMatch(/sup[ée]rette/i);
  });
  it('a good or bad haul moves the house, and the money stays honest', () => {
    let moved = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = fresh();
      const r = runSuperette(s, ctxOf(seed, { stats: { Ana: { boldness: 9 } } }), { house: H, picker: 'Ana' });
      expect(r.runners[0]).toBe('Ana');
      if (r.effects.bond.length) moved++;
      expect(actualTotal(s)).toBe(expectedTotal(s));
    }
    expect(moved).toBeGreaterThan(10);
  });
});
