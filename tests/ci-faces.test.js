// ci-faces.test.js — the face catalogue and the default Catfish Pool (Plan 4
// Task 3, spec §4.6). A season with no authored pool still has catfish, and
// every persona's face fits the persona it is sold as.
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { FACES, faceById, sameArt, pickFace } from '../js/ci/faces.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { personaStyle } from '../js/ci/cover.js';

const ON_DISK = readdirSync('assets/guests').filter(f => f.endsWith('.png'));
const shows = (face, gender) => face.presents === 'androgynous' || face.presents === (gender === 'm' ? 'man' : 'woman');

describe('the face catalogue', () => {
  it('tags every image in assets/guests once, and nothing else', () => {
    expect(FACES.map(f => f.file).sort()).toEqual(ON_DISK.map(f => `assets/guests/${f}`).sort());
    expect(new Set(FACES.map(f => f.id)).size).toBe(FACES.length);
  });

  it('every entry says what the face shows: presents, an age range, a vibe, a look', () => {
    for (const f of FACES) {
      expect(['woman', 'man', 'androgynous'], f.id).toContain(f.presents);
      expect(f.age[0], f.id).toBeGreaterThanOrEqual(18);
      expect(f.age[1], f.id).toBeGreaterThanOrEqual(f.age[0]);
      expect(f.vibe.length, f.id).toBeGreaterThan(0);
      expect(f.look.length, f.id).toBeGreaterThan(10);
    }
  });

  it('two files of the same drawing know each other, both ways', () => {
    for (const f of FACES) for (const twin of f.sameArt || []) {
      expect(faceById(twin)?.sameArt, `${f.id} -> ${twin}`).toContain(f.id);
    }
    expect(sameArt('athlete-lance', 'vet-lance')).toBe(true);
    expect(sameArt('athlete-lance', 'athlete-chad')).toBe(false);
  });
});

describe('a persona gets a face that fits it', () => {
  it('matches how the persona presents and sits inside its age', () => {
    for (const persona of [{ gender: 'f', age: 23 }, { gender: 'm', age: 41 }, { gender: 'm', age: 19 }]) {
      const f = pickFace(persona);
      expect(shows(f, persona.gender)).toBe(true);
      expect(persona.age).toBeGreaterThanOrEqual(f.age[0]);
      expect(persona.age).toBeLessThanOrEqual(f.age[1]);
    }
  });

  it('never hands out a face already taken, nor another file of the same drawing', () => {
    const persona = { gender: 'm', age: 27, look: 'black slicked hair' };
    const first = pickFace(persona);
    const second = pickFace(persona, [first.id]);
    expect(second.id).not.toBe(first.id);
    expect(sameArt(first.id, second.id)).toBe(false);
  });

  it('is the same answer every time (no dice: the author sees what the season gets)', () => {
    expect(pickFace({ gender: 'f', age: 30 }).id).toBe(pickFace({ gender: 'f', age: 30 }).id);
  });
});

describe('the default Catfish Pool', () => {
  it('is eight personas, each whole, none sharing a face, a handle or a drawing', () => {
    expect(DEFAULT_POOL).toHaveLength(8);
    const faces = DEFAULT_POOL.map(p => p.face);
    expect(new Set(faces).size).toBe(8);
    expect(new Set(DEFAULT_POOL.map(p => p.handle)).size).toBe(8);
    expect(new Set(DEFAULT_POOL.map(p => p.id)).size).toBe(8);
    for (const a of faces) for (const b of faces) if (a !== b) expect(sameArt(a, b)).toBe(false);
    for (const p of DEFAULT_POOL) {
      for (const k of ['id', 'handle', 'face', 'age', 'gender', 'job', 'status', 'bio']) expect(p[k], `${p.id}.${k}`).toBeTruthy();
      expect(p.reasons.length).toBeGreaterThan(0);
      for (const r of p.reasons) expect(['strategic', 'protective', 'family', 'experimental']).toContain(r);
    }
  });

  it("each face fits the persona it is sold as", () => {
    for (const p of DEFAULT_POOL) {
      const f = faceById(p.face);
      expect(f, p.face).toBeTruthy();
      expect(shows(f, p.gender), p.id).toBe(true);
      expect(p.age, p.id).toBeGreaterThanOrEqual(f.age[0]);
      expect(p.age, p.id).toBeLessThanOrEqual(f.age[1]);
    }
  });

  it('spreads across the ways people type and the ages people fake', () => {
    const registers = new Set(DEFAULT_POOL.map(p => personaStyle(p).register));
    expect(registers.size).toBeGreaterThanOrEqual(5);
    expect(DEFAULT_POOL.filter(p => p.gender === 'f').length).toBeGreaterThanOrEqual(3);
    expect(DEFAULT_POOL.filter(p => p.gender === 'm').length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...DEFAULT_POOL.map(p => p.age))).toBeGreaterThanOrEqual(38);
    expect(Math.min(...DEFAULT_POOL.map(p => p.age))).toBeLessThanOrEqual(23);
  });
});
