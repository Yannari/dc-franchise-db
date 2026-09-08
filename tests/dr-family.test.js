// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-family.test.js — who was already related when they walked in
// ══════════════════════════════════════════════════════════════════════
import { afterEach, describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  assignDragFamilies, familyOf, relation, FAMILY_CAP, FAMILY_BOND,
  familiesFromRelations, AUTHORED_RELATIONS, dragRelationsFrom,
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

/* ── PUT THE GLOBALS BACK ────────────────────────────────────────────
   js/cast-ui.js reads `players`, `relationships`, `seasonConfig` and
   `miniAvatar` as bare globals, because in the browser js/main.js puts them
   there. A test that supplies them has to take them away again: module state
   is reset between files but globalThis is not, so a leaked `players` is
   still standing when the next file in the same worker runs, and the failure
   lands over there rather than here. Measured: three unrelated files went red
   in a batch and green alone. */
const GLOBALS = ['seasonConfig', 'players', 'relationships', 'REL_KINSHIP',
  'REL_TYPES', 'miniAvatar', 'document', 'window'];
const _before = new Map(GLOBALS.map(k => [k, Object.getOwnPropertyDescriptor(global, k)]));
afterEach(() => {
  for (const k of GLOBALS) {
    const d = _before.get(k);
    if (d) Object.defineProperty(global, k, d);
    else delete global[k];
  }
});

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

// ══════════════════════════════════════════════════════════════════════
// The genealogy: three authored terms, everything else derived.
// ══════════════════════════════════════════════════════════════════════
describe('kinship', () => {
  const CLAN = [
    q('Ivy Deveraux', 55, 'pageant'), q('Rita Deveraux', 52, 'pageant'),
    q('Coco Deveraux', 30, 'pageant'), q('Nell Deveraux', 28, 'pageant'),
    q('Mimi Deveraux', 24, 'pageant'), q('Stranger', 33, 'comedy'),
  ];
  /* Ivy and Rita are sisters. Coco is Ivy's, Nell is Rita's, and Mimi is
     Coco's — three generations, which is the smallest family that can
     produce an aunt, a cousin and a great-aunt at the same time. */
  const REL = [
    { a: 'Ivy Deveraux', b: 'Rita Deveraux', kind: 'sister' },
    { a: 'Coco Deveraux', b: 'Ivy Deveraux', kind: 'mother' },
    { a: 'Nell Deveraux', b: 'Rita Deveraux', kind: 'mother' },
    { a: 'Mimi Deveraux', b: 'Coco Deveraux', kind: 'mother' },
  ];
  const fams = assignDragFamilies({ cast: CLAN, relations: REL, rng: rngFor(1) }).families;
  const rel = (a, b) => relation(fams, a, b);

  it('derives every term from the three anybody would author', () => {
    /* AUTHORED: mother, daughter, sister. Nobody types "great-aunt" and
       nobody should have to — if Ivy is Coco's mother and Rita is Ivy's
       sister then Rita is Coco's aunt, whether or not anybody wrote it. */
    expect(rel('Ivy Deveraux', 'Coco Deveraux')).toBe('daughter');
    expect(rel('Coco Deveraux', 'Ivy Deveraux')).toBe('mother');
    expect(rel('Ivy Deveraux', 'Rita Deveraux')).toBe('sister');
    expect(rel('Ivy Deveraux', 'Mimi Deveraux')).toBe('granddaughter');
    expect(rel('Mimi Deveraux', 'Ivy Deveraux')).toBe('grandmother');
    expect(rel('Coco Deveraux', 'Rita Deveraux')).toBe('aunt');
    expect(rel('Rita Deveraux', 'Coco Deveraux')).toBe('niece');
    expect(rel('Coco Deveraux', 'Nell Deveraux')).toBe('cousin');
    expect(rel('Mimi Deveraux', 'Rita Deveraux')).toBe('great-aunt');
  });

  it('is directional, so a card can say whose she is', () => {
    // "her daughter" and "her mother" are different sentences about the same
    // pair, and a screen needs to be able to pick one.
    expect(rel('Ivy Deveraux', 'Coco Deveraux'))
      .not.toBe(rel('Coco Deveraux', 'Ivy Deveraux'));
  });

  it('relates nobody to a queen outside the family', () => {
    expect(rel('Ivy Deveraux', 'Stranger')).toBeNull();
    expect(rel('Stranger', 'Mimi Deveraux')).toBeNull();
    expect(rel('Ivy Deveraux', 'Ivy Deveraux'), 'nobody is her own anything').toBeNull();
  });

  it('gathers the whole clan into one family without anybody naming it', () => {
    // Connected components: an author writes pairs, not a house.
    expect(fams.length).toBe(1);
    expect(fams[0].members.sort()).toEqual([
      'Coco Deveraux', 'Ivy Deveraux', 'Mimi Deveraux', 'Nell Deveraux', 'Rita Deveraux',
    ]);
    expect(fams[0].name).toBe('The House of Deveraux');
    expect(fams[0].kind).toBe('line');
  });

  it('survives a circle, because an author can always draw one', () => {
    const loop = [
      { a: 'Ivy Deveraux', b: 'Coco Deveraux', kind: 'mother' },
      { a: 'Coco Deveraux', b: 'Ivy Deveraux', kind: 'mother' },
    ];
    const f = assignDragFamilies({ cast: CLAN, relations: loop, rng: rngFor(1) }).families;
    expect(() => relation(f, 'Ivy Deveraux', 'Coco Deveraux')).not.toThrow();
  });

  it('ignores a relation naming somebody who is not in the cast', () => {
    // A relationship tab outlives the cast it was written against: swap one
    // queen out and her rows are still there, pointing at nobody. They must
    // drop rather than seat a ghost at the table.
    const ghost = [{ a: 'Ivy Deveraux', b: 'Nobody At All', kind: 'mother' }];
    expect(familiesFromRelations(CLAN, ghost)).toEqual([]);
    // The season still gets its derived families — dropping a bad row is not
    // the same as cancelling the feature — but nothing claims to be authored.
    const f = assignDragFamilies({ cast: CLAN, relations: ghost, rng: rngFor(1) }).families;
    expect(f.some(x => x.authored)).toBe(false);
    expect(f.flatMap(x => x.members)).not.toContain('Nobody At All');
  });
});

// ══════════════════════════════════════════════════════════════════════
// The Relationships tab is the author's end of all of this.
// ══════════════════════════════════════════════════════════════════════
describe('authored from the relationships tab', () => {
  const CAST = [
    q('Ivy Deveraux', 55, 'pageant'), q('Coco Deveraux', 30, 'pageant'),
    q('Nell Deveraux', 28, 'pageant'), q('Stranger', 33, 'comedy'),
  ];
  // What the cast builder actually saves: two axes on one row.
  const TAB = [
    { a: 'Ivy Deveraux', b: 'Coco Deveraux', kin: 'drag-mother', type: 'enemy', bond: -4 },
    { a: 'Nell Deveraux', b: 'Coco Deveraux', kin: 'drag-sisters', type: 'ally', bond: 4 },
    { a: 'Stranger', b: 'Ivy Deveraux', kin: 'best-friends', type: 'ally', bond: 5 },
    { a: 'Stranger', b: 'Coco Deveraux', kin: 'none', type: 'neutral', bond: 0 },
  ];

  it('reads a tab row in the direction the tab is written in', () => {
    /* THE ONE FIDDLY BIT. A row says "A is B's mother"; an edge says "b is a's
       mother". They are opposite ways round because the tab is written from A
       and the resolver answers about B, and getting it backwards silently
       inverts every family in the season. */
    const edges = dragRelationsFrom([TAB[0]]);
    expect(edges).toEqual([{ a: 'Coco Deveraux', b: 'Ivy Deveraux', kind: 'mother' }]);
    const fams = familiesFromRelations(CAST, edges);
    expect(relation(fams, 'Coco Deveraux', 'Ivy Deveraux')).toBe('mother');
    expect(relation(fams, 'Ivy Deveraux', 'Coco Deveraux')).toBe('daughter');
  });

  it('takes the same row from the other end', () => {
    const row = { a: 'Coco Deveraux', b: 'Ivy Deveraux', kin: 'drag-daughter' };
    const fams = familiesFromRelations(CAST, dragRelationsFrom([row]));
    expect(relation(fams, 'Coco Deveraux', 'Ivy Deveraux')).toBe('mother');
  });

  it('ignores the terms that are not a drag family', () => {
    // `best-friends` is real and already says everything it means through the
    // bond. Reading it as kinship would put half a cast in one house.
    expect(dragRelationsFrom([TAB[2], TAB[3]])).toEqual([]);
  });

  it('builds the house the tab describes, feelings and all', () => {
    const fams = familiesFromRelations(CAST, dragRelationsFrom(TAB));
    expect(fams.length).toBe(1);
    expect(fams[0].members.sort())
      .toEqual(['Coco Deveraux', 'Ivy Deveraux', 'Nell Deveraux']);
    // Nell is Coco's sister, so Ivy is her mother too — authored once, true twice.
    expect(relation(fams, 'Nell Deveraux', 'Ivy Deveraux')).toBe('mother');
    // And the feelings axis is untouched: they are family AND at war, which is
    // the entire reason `kin` and `type` are two fields.
    expect(TAB[0].bond).toBe(-4);
  });
});

describe(`a played season carries the author's houses`, () => {
  it('threads tab relations through playDragSeason', async () => {
    const { playDragSeason } = await import('../js/dr/season.js');
    const cast = [
      'Ivy Deveraux', 'Coco Deveraux', 'Nell Deveraux', 'Wayne Cross',
      'Julia Vale', 'Bowie Sharpe', 'Emmah Rae', 'Caleb Storm',
    ].map((n, i) => q(n, 24 + i * 3, 'pageant'));
    const relations = dragRelationsFrom([
      { a: 'Ivy Deveraux', b: 'Coco Deveraux', kin: 'drag-mother' },
      { a: 'Nell Deveraux', b: 'Coco Deveraux', kin: 'drag-sisters' },
    ]);
    const { state } = playDragSeason({ cast, seed: 4, relations });
    const house = (state.dragFamilies || []).find(f => f.authored);
    expect(house, 'the authored house survived into the season').toBeTruthy();
    expect(house.members.sort())
      .toEqual(['Coco Deveraux', 'Ivy Deveraux', 'Nell Deveraux']);
    // A season that authors nothing still gets its own families rather than
    // an empty room.
    const plain = playDragSeason({ cast, seed: 4 });
    expect(plain.state.dragFamilies.some(f => f.authored)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════
// ...and that an author can actually reach the terms.
// ══════════════════════════════════════════════════════════════════════
describe('the kinship picker', () => {
  /* A term nobody can select is a term that does not exist. Both halves are
     worth pinning: the drag terms must APPEAR on a runway, and must NOT appear
     on a camp — a Total Drama pair cannot have a drag mother, and offering her
     is how a season ends up carrying a relation no engine reads. */
  const build = async (format) => {
    const dom = new JSDOM('<select id="rel-kin"></select>');
    global.document = dom.window.document;
    global.window = dom.window;
    const core = await import('../js/core.js');
    core.seasonConfig.format = format;
    global.REL_KINSHIP = core.REL_KINSHIP;
    global.seasonConfig = core.seasonConfig;
    const { buildKinshipSelect } = await import('../js/cast-ui.js');
    buildKinshipSelect();
    return [...dom.window.document.querySelectorAll('#rel-kin option')].map(o => o.value);
  };

  it('offers the drag terms on a drag season and nowhere else', async () => {
    const drag = await build('drag-race');
    expect(drag).toEqual(expect.arrayContaining(['drag-mother', 'drag-daughter', 'drag-sisters']));
    // The shared terms stay shared — this gates by show, it does not replace.
    expect(drag).toContain('exes');

    const td = await build('total-drama');
    for (const term of ['drag-mother', 'drag-daughter', 'drag-sisters']) {
      expect(td, `${term} offered to a camp`).not.toContain(term);
    }
    expect(td).toContain('siblings');
  });
});

// ══════════════════════════════════════════════════════════════════════
// The tab shows the tree the rows make, not just the rows.
// ══════════════════════════════════════════════════════════════════════
describe('the family panel', () => {
  it('draws terms nobody typed', async () => {
    const dom = new JSDOM('<div id="rel-list"></div><div id="rel-families"></div>');
    global.document = dom.window.document;
    const core = await import('../js/core.js');
    core.seasonConfig.format = 'drag-race';
    core.setPlayers([
      { name: 'Ivy Deveraux', age: 55 }, { name: 'Coco Deveraux', age: 30 },
      { name: 'Nell Deveraux', age: 28 }, { name: 'Rita Deveraux', age: 52 },
    ]);
    core.setRelationships([
      { a: 'Ivy Deveraux', b: 'Coco Deveraux', kin: 'drag-mother', type: 'ally', bond: 4 },
      { a: 'Nell Deveraux', b: 'Coco Deveraux', kin: 'drag-sisters', type: 'ally', bond: 3 },
      { a: 'Rita Deveraux', b: 'Ivy Deveraux', kin: 'drag-sisters', type: 'enemy', bond: -5 },
    ]);
    for (const k of ['seasonConfig', 'players', 'relationships', 'REL_KINSHIP', 'REL_TYPES'])
      Object.defineProperty(global, k, { get: () => core[k], configurable: true });
    global.miniAvatar = () => '<i></i>';

    const { renderRelList } = await import('../js/cast-ui.js');
    renderRelList();
    // Read through the markup rather than textContent: the name and its term
    // sit in sibling elements, so textContent runs them together.
    const text = dom.window.document.getElementById('rel-families')
      .innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    expect(text).toContain('The House of Deveraux');
    // Everybody who shares the surname is visibly related from the door.
    expect(text).toContain('the room can see it');
    // AUTHORED: Coco's mother is Ivy. DERIVED: Nell is Coco's sister, so Ivy
    // is her mother too — three rows, and the fourth relation for free. That
    // derived line is the whole point of the panel; the rows above it already
    // say the rest.
    expect(text).toContain("Coco Deveraux Ivy Deveraux's daughter");
    expect(text).toContain("Nell Deveraux Ivy Deveraux's daughter");
    expect(text).toContain("Rita Deveraux Ivy Deveraux's sister");
  });
});
