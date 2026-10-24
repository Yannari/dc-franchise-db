// A partner outside the franchise: married (or engaged, partners, dating) to somebody who is not a character.
//
// The user, 2026-10-23: "just add in tie a way to set married for status unknow". A couple tie on the sheet
// with `outside: true` and the name optional. It is nobody else's tie and no family is worked out from it; it
// is the partner waiting at home (life-cast.js soloPartners), which every show already plays.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { outsidePartner, authoredEdges, startingCouple } from '../js/ties.js';
import { lifeSeeds } from '../js/life-cast.js';
import { normalizeCharacter } from '../js/character-file.js';

const ROSTER = [
  { name: 'Paisley', slug: 'paisley', gender: 'f', sexuality: 'straight', ties: [{ name: '', kin: 'married', outside: true }] },
  { name: 'Sawyer', slug: 'sawyer', gender: 'm', sexuality: 'gay', ties: [{ name: 'Caleb', kin: 'married', outside: true }] },
  { name: 'Robin', slug: 'robin', gender: 'nb', ties: [{ name: '', kin: 'dating', outside: true }] },
  { name: 'Juan', slug: 'juan', gender: 'm', sexuality: 'straight', ties: [{ name: '', kin: 'married', outside: true }, { name: 'Lacey', kin: 'married' }] },
  { name: 'Lacey', slug: 'lacey', gender: 'f', sexuality: 'straight' },
];
afterEach(() => { delete globalThis.window; });

describe('the partner at home', () => {
  it('is the typed name, or "Paisley\'s husband" read off her gender and sexuality', () => {
    expect(outsidePartner('Paisley', ROSTER)).toEqual({ name: "Paisley's husband", stage: 'married', named: false, word: 'husband' });
    expect(outsidePartner('Sawyer', ROSTER)).toEqual({ name: 'Caleb', stage: 'married', named: true, word: 'husband' });
    expect(outsidePartner('Robin', ROSTER).name).toBe("Robin's partner");
    expect(outsidePartner('Lacey', ROSTER)).toBeNull();
  });

  it('is nobody else\'s tie, and no family is worked out from it', () => {
    const edges = [...authoredEdges(ROSTER).values()];
    expect(edges.some(e => e.a === 'Sawyer' || e.b === 'Caleb')).toBe(false);
    expect(edges.filter(e => e.a === 'Juan' || e.b === 'Juan')).toHaveLength(1);
    expect(startingCouple('Paisley', ROSTER)).toBeNull();
  });

  it('walks in as the partner left at home, and a spouse in the franchise wins over it', () => {
    globalThis.window = { FRANCHISE_ROSTER: ROSTER };
    const out = lifeSeeds([{ name: 'Paisley', slug: 'paisley' }, { name: 'Sawyer', slug: 'sawyer' }], [], []);
    expect(out.soloPartners).toEqual([
      { name: 'Paisley', whom: null, whomName: "Paisley's husband", stage: 'married', outside: true, named: false, word: 'husband' },
      { name: 'Sawyer', whom: null, whomName: 'Caleb', stage: 'married', outside: true, named: true, word: 'husband' },
    ]);
    expect(out.showmances).toEqual([]);
    const juan = lifeSeeds([{ name: 'Juan', slug: 'juan' }], [], []);
    expect(juan.soloPartners).toEqual([{ name: 'Juan', whom: 'lacey', whomName: 'Lacey', stage: 'married' }]);
  });
});

describe('it survives every save', () => {
  it('the Worker keeps it, a couple only, the name optional', () => {
    const worker = readFileSync(resolve(process.cwd(), 'worker/worker-studio.js'), 'utf8');
    const src = worker.slice(worker.indexOf('const TIE_KINDS'), worker.indexOf('// A Total Drama character kit'));
    const tiesToJson = new Function('ValidationError', `${src}\nreturn tiesToJson;`)(Error);
    expect(JSON.parse(tiesToJson([{ name: '', kin: 'married', outside: true }, { name: '', kin: 'siblings', outside: true }])))
      .toEqual([{ name: '', kin: 'married', outside: true }]);
  });

  it('a character file keeps it', () => {
    const got = normalizeCharacter({ name: 'Paisley', ties: [{ name: '', kin: 'married', outside: true }] }, {});
    expect(got.ties).toEqual([{ name: '', kin: 'married', outside: true }]);
  });

  it('the Studio saves it and offers it in the picker', () => {
    const studio = readFileSync(resolve(process.cwd(), 'js/studio.js'), 'utf8');
    expect(studio).toMatch(/Someone outside the franchise/);
    expect(studio).toMatch(/filter\(t => t && t\.kin && \(t\.outside \|\| \(t\.name && t\.name !== d\.name\)\)\)/);
  });
});
