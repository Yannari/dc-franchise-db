// Big Brother's house as the Reality Resort plates (tools/bb-resort, spec
// docs/superpowers/specs/2026-10-13-bb-resort-plates-design.md). These hold the plates to
// their contract:
//   - every plate has its source, a real room, sets the stage has and moments it knows;
//   - every plate the list names is built (day and/or night) and on disk;
//   - a plate that seats a ceremony has every seat that ceremony reads;
//   - every room the engine uses has a plate or its Blender fallback;
//   - the lines win: a scene that says "pool" plays at the pool.
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RESORT } from '../js/vp-bb-ep/resort.js';
import { pickPlate, plateFor, isNight, plateBase, themedFor, CORNER } from '../js/vp-bb-ep/plates.js';
import { BB_ROOMS } from '../js/bb/house-events.js';

const ROOT = path.resolve(__dirname, '..');
const PLATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/bb-resort/plates.json'), 'utf8'));
const IDS = Object.keys(PLATES).filter(k => !k.startsWith('_'));
const SETS = new Set(['ceremony', 'ceremony3', 'dining', 'kitchen', 'bedroom', 'hoh', 'yard', 'dr', 'storage', 'havenot',
  'bathroom', 'juryhouse', 'door', 'premiere', 'comp', 'wall', 'cutaway', 'studio', 'studio-wide', 'finale', 'finale-jury', 'villa', 'map']);
const USES = new Set(['eviction', 'ceremony', 'nominations', 'house', 'meal', 'quiet', 'secret', 'dr']);
// the stage's sets for the engine's rooms (ROOM_SET in vp-bb-ep/steps.js) and their Blender rooms
const ROOM_SETS = { kitchen: 'kitchen', ceremony: 'living', bedroom: 'bedroom', hoh: 'hoh', yard: 'yard', dr: 'dr',
  storage: 'storage', havenot: 'havenot', bathroom: 'bathroom', dining: 'dining' };

describe('the plate list', () => {
  it('every plate has a source, a real room, known sets and known moments', () => {
    for (const id of IDS) {
      const P = PLATES[id];
      expect(fs.existsSync(path.join(ROOT, 'tools/bb-resort/src', `${id}.webp`)), id).toBe(true);
      if (P.nightsrc) expect(fs.existsSync(path.join(ROOT, 'tools/bb-resort/src', `${P.nightsrc}.webp`)), id).toBe(true);
      expect(BB_ROOMS, id).toContain(P.room);
      for (const s of P.sets) expect(SETS.has(s), `${id}: set ${s}`).toBe(true);
      for (const u of P.use) expect(USES.has(u), `${id}: use ${u}`).toBe(true);
      if (P.words) expect(() => new RegExp(P.words)).not.toThrow();
    }
  });

  it('every plate is built, and every file the manifest names is on disk', () => {
    for (const id of IDS) expect(RESORT.have.default?.[id], `${id} is not built`).toBeTruthy();
    for (const [theme, plates] of Object.entries(RESORT.have)) {
      for (const [id, tods] of Object.entries(plates)) {
        for (const tod of tods) {
          for (const f of [`${id}-${tod}.webp`, `${id}-${tod}-hd.webp`, `${id}-${tod}-motion.webp`]) {
            expect(fs.existsSync(path.join(ROOT, 'assets/sets/bb/resort', theme, f)), `${theme}/${f}`).toBe(true);
          }
        }
      }
    }
  });

  it('a plate that seats a ceremony has every seat that ceremony reads', () => {
    const NEED = {
      ceremony: ['N-1', 'N1', 'L0', 'R0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'stand'],
      ceremony3: ['N-1', 'N0', 'N1', 'L0', 'R0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3', 'stand'],
      dining: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12'],
      studio: ['G', 'H'],
      finale: ['F0', 'F1', 'D0', 'D1', 'H', 'box'],
      'finale-jury': ['J0', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8'],
    };
    for (const id of IDS) {
      const A = PLATES[id].anchors;
      if (!A) continue;
      for (const set of PLATES[id].sets) {
        for (const k of NEED[set] || []) {
          const a = A.seats?.[k];
          expect(a, `${id}: seat ${k}`).toBeTruthy();
          expect(a.at[0] >= 0 && a.at[0] <= 100 && a.at[1] >= 0 && a.at[1] <= 100 && a.w > 0, `${id}: seat ${k} on the frame`).toBe(true);
        }
        if (set === 'ceremony') { expect(A.panels?.length, `${id}: memory-wall panels`).toBe(2); expect(A.tv, `${id}: the host's screen`).toBeTruthy(); }
        if (set === 'dining') for (const k of ['head', 'box', 'screen']) expect(A[k], `${id}: ${k}`).toBeTruthy();
      }
    }
  });

  it('keeps the jury sequestered: no plate the jury lives in is a room of the house', () => {
    const HOUSE = new Set(['ceremony', 'ceremony3', 'dining', 'kitchen', 'bedroom', 'hoh', 'yard', 'dr', 'storage', 'havenot', 'bathroom']);
    for (const id of IDS.filter(id => PLATES[id].sets.includes('juryhouse'))) {
      for (const s of PLATES[id].sets) expect(HOUSE.has(s), `${id} is the jury's and the house's (${s})`).toBe(false);
    }
  });

  it('every room the engine plays in has a plate or its Blender room', () => {
    for (const [set, file] of Object.entries(ROOM_SETS)) {
      const plate = IDS.some(id => PLATES[id].sets.includes(set));
      const blender = fs.existsSync(path.join(ROOT, 'assets/bb/house/default', `${file}-td-b.webp`));
      expect(plate || blender, set).toBe(true);
    }
  });
});

describe('choosing a plate', () => {
  it('a ceremony plays on the plate with its seats', () => {
    expect(plateFor({ set: 'ceremony', seated: {} })).toBe('living-screens');
    // the user's D02/D03: a third nominee has a third chair, and nominations are at the round table
    expect(plateFor({ set: 'ceremony3', seated: {} })).toBe('living-screens-3');
    expect(plateFor({ set: 'dining', seated: {} })).toBe('nom-table');
    // the studio's sets (B08-B11) are plates; a competition's arena or a built set never is
    expect(plateFor({ set: 'studio', arena: true, seated: {} })).toBe('studio-interview');
    expect(plateFor({ set: 'finale', arena: true, seated: {} })).toBe('studio-finale');
    expect(plateFor({ set: 'finale-jury', arena: true, seated: {} })).toBe('studio-jury');
    expect(plateFor({ set: 'studio-wide', arena: true })).toBe('studio-arrival');
    expect(plateFor({ set: 'yard', arena: true })).toBe(null);
    expect(plateFor({ set: 'ceremony', built: true })).toBe(null);
  });

  it('the place the lines name wins, and the pick is stable', () => {
    const p = pickPlate('yard', 'scene-7', 'They talk quietly by the pool.');
    expect(PLATES[p].words).toMatch(/pool/);
    expect(pickPlate('yard', 'scene-7', 'They talk quietly by the pool.')).toBe(p);
    // a plate chosen only by name (the gym) is not where an unnamed backyard talk lands
    for (let i = 0; i < 40; i++) {
      const q = pickPlate('yard', `scene-${i}`, 'They talk.');
      expect(PLATES[q].use.some(u => u === 'house' || u === 'quiet'), q).toBe(true);
    }
  });

  it("a private talk can slip off to the island's hidden spots; a house talk never lands there", () => {
    const hidden = id => (PLATES[id].use || []).includes('secret');
    const secret = Array.from({ length: 60 }, (_, i) => pickPlate('yard', `s-${i}`, 'They talk.', 'secret'));
    expect(secret.some(hidden)).toBe(true);
    for (let i = 0; i < 60; i++) expect(hidden(pickPlate('yard', `h-${i}`, 'They talk.')), `h-${i}`).toBe(false);
    // a room with no hidden spot keeps its own plates
    expect(PLATES[pickPlate('bedroom', 'x', 'They talk.', 'secret')].sets).toContain('bedroom');
  });

  it('reads the hour: night from eight in the evening, and the live show is at night', () => {
    expect(isNight('9:30 PM')).toBe(true);
    expect(isNight('9:30 AM')).toBe(false);
    expect(isNight('12:40 AM')).toBe(true);
    expect(isNight('20:00')).toBe(true);
    expect(isNight('13:30')).toBe(false);
    expect(isNight('LIVE')).toBe(true);
  });

  it('a night that does not exist falls back to the day, and a theme to the default house', () => {
    expect(plateBase('confessional', 'default', true)).toMatch(/default\/confessional-day$/);
    expect(plateBase('living-screens', 'mystery', true)).toMatch(/\/living-screens-night$/);
  });

  it('a themed season with no copy of a view takes the theme\'s view of the same corner of the room', () => {
    // the house's wide kitchen is kitchen-room; Machine and Mystery decorated the older wide view, kitchen-wide
    for (const theme of ['machine', 'mystery']) {
      if (!RESORT.have[theme]?.['kitchen-wide'] || RESORT.have[theme]?.['kitchen-room']) continue;
      for (let i = 0; i < 20; i++) expect(themedFor('kitchen-room', { set: 'kitchen', id: `s${i}` }, theme)).toBe('kitchen-wide');
      expect(CORNER[themedFor('kitchen-room', null, theme)]).toBe('kitchen');
    }
  });
});
