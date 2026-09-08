// ══════════════════════════════════════════════════════════════════════
// dr-family.test.js — who was already related when they walked in
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import {
  assignDragFamilies, familyOf, relation, FAMILY_CAP, FAMILY_BOND,
} from '../js/dr/family.js';
import { rngFor } from '../js/dr/rng.js';

const q = (name, age, style, slug) => ({
  name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), age,
  drag: { style, acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 },
});

/* A cast with two obvious families in it and enough strangers to be a cast:
   the Deveraux women are a generation apart in the same style, and the two
   club kids are contemporaries. */
const CAST = [
  q('Ivy Deveraux', 41, 'pageant'),
  q('Coco Deveraux', 24, 'pageant'),
  q('MK Static', 29, 'club-kid'),
  q('Priya Static', 27, 'club-kid'),
  q('Wayne', 33, 'comedy'),
  q('Julia', 35, 'fashion'),
  q('Bowie', 26, 'art'),
  q('Damien', 30, 'spooky'),
];

describe('casting the families', () => {
  it('never puts a queen in two families', () => {
    for (let s = 0; s < 40; s++) {
      const { families } = assignDragFamilies({ cast: CAST, rng: rngFor(s) });
      const seen = new Set();
      for (const f of families) {
        for (const m of f.members) {
          expect(seen.has(m), `${m} is in two families`).toBe(false);
          seen.add(m);
        }
      }
    }
  });

  it('keeps it to a thread rather than a soap', () => {
    for (let s = 0; s < 40; s++) {
      const { families } = assignDragFamilies({ cast: CAST, rng: rngFor(s) });
      expect(families.length, `seed ${s}`).toBeLessThanOrEqual(FAMILY_CAP);
    }
  });

  it('relates queens who share a scene, not queens who happen to be here', () => {
    /* STYLE IS THE BIG TERM. A drag family comes out of a shared scene, so two
       pageant queens are far likelier than a pageant queen and a club kid —
       and a cast where everybody does something different should mostly
       produce nobody related at all rather than an arbitrary pairing. */
    let sameStyle = 0;
    let total = 0;
    for (let s = 0; s < 60; s++) {
      const { families } = assignDragFamilies({ cast: CAST, rng: rngFor(s) });
      for (const f of families) {
        total += 1;
        const styles = f.members.map(m => CAST.find(c => c.name === m).drag.style);
        if (new Set(styles).size === 1) sameStyle += 1;
      }
    }
    expect(total, 'no families were ever cast').toBeGreaterThan(0);
    expect(sameStyle / total, 'families are being cast across unrelated scenes')
      .toBeGreaterThan(0.8);
  });

  it('a daughter takes her mother\'s name, which is the whole institution', () => {
    let lines = 0;
    for (let s = 0; s < 60; s++) {
      const { families } = assignDragFamilies({ cast: CAST, rng: rngFor(s) });
      for (const f of families) {
        if (f.kind !== 'line') continue;
        lines += 1;
        // The elder is the mother, the surname is hers, and the name says so.
        expect(f.surname, `${f.name} is a line with no surname`).toBeTruthy();
        expect(f.name).toContain(f.surname);
        const mother = f.members.find(m => f.roles[m] === 'mother');
        const daughter = f.members.find(m => f.roles[m] === 'daughter');
        expect(mother, 'a line with no mother').toBeTruthy();
        expect(daughter, 'a line with no daughter').toBeTruthy();
        const age = n => CAST.find(c => c.name === n).age;
        expect(age(mother), 'the daughter is older than her mother')
          .toBeGreaterThan(age(daughter));
      }
    }
    expect(lines, 'no line was ever cast from a cast built to produce one')
      .toBeGreaterThan(0);
  });

  it('seeds a warm bond rather than an alliance', () => {
    const { families, bonds } = assignDragFamilies({ cast: CAST, rng: rngFor(3) });
    expect(bonds.length).toBe(families.length);
    for (const [a, b, d] of bonds) {
      expect(d).toBe(FAMILY_BOND);
      expect(familyOf(families, a).members).toContain(b);
    }
    // Warm acquaintance, not a locked pair: everything after this is earned.
    expect(FAMILY_BOND).toBeLessThan(6);
  });

  it('says what they are to each other, from either side', () => {
    const { families } = assignDragFamilies({ cast: CAST, rng: rngFor(7) });
    const line = families.find(f => f.kind === 'line');
    if (line) {
      const mother = line.members.find(m => line.roles[m] === 'mother');
      const daughter = line.members.find(m => line.roles[m] === 'daughter');
      expect(relation(families, mother, daughter)).toBe('daughter');
      expect(relation(families, daughter, mother)).toBe('mother');
    }
    const house = families.find(f => f.kind === 'house');
    if (house) {
      const [a, b] = house.members;
      expect(relation(families, a, b)).toBe('sister');
    }
    expect(relation(families, 'Wayne', 'Julia'), 'strangers are not related').toBeNull();
    expect(familyOf(families, 'nobody')).toBeNull();
  });

  it('does not fall over on a room too small to have families in it', () => {
    expect(assignDragFamilies({ cast: CAST.slice(0, 3), rng: rngFor(1) }).families).toEqual([]);
    expect(assignDragFamilies({ cast: [], rng: rngFor(1) }).families).toEqual([]);
    expect(assignDragFamilies({}).families).toEqual([]);
  });

  it('does not cast the same family every season', () => {
    /* ON A CAST WHERE THE CHOICE IS REAL. CAST above has exactly two obvious
       pairs — same style, right age gap, nothing else close — so it SHOULD
       produce the same two families every time, and asserting otherwise would
       be asking the draw to override the fiction. The roll is there to break
       ties between equally plausible pairings, so that is what this measures:
       six queens who could all plausibly be each other's family. */
    const OPEN = [
      q('Ada Vance', 42, 'pageant'), q('Bea Vance', 40, 'pageant'),
      q('Cleo Vance', 25, 'pageant'), q('Dot Vance', 24, 'pageant'),
      q('Eve Vance', 39, 'pageant'), q('Fay Vance', 23, 'pageant'),
      q('Gia', 31, 'comedy'), q('Hana', 30, 'art'),
    ];
    const shapes = new Set();
    for (let s = 0; s < 40; s++) {
      const { families } = assignDragFamilies({ cast: OPEN, rng: rngFor(s) });
      shapes.add(families.map(f => f.members.join('+')).sort().join(' | '));
    }
    expect(shapes.size, 'the roll never breaks a tie between equal pairings')
      .toBeGreaterThan(1);
  });
});
