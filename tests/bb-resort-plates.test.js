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
import { pickPlate, plateFor, isNight, plateBase } from '../js/vp-bb-ep/plates.js';
import { BB_ROOMS } from '../js/bb/house-events.js';

const ROOT = path.resolve(__dirname, '..');
const PLATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/bb-resort/plates.json'), 'utf8'));
const IDS = Object.keys(PLATES).filter(k => !k.startsWith('_'));
const SETS = new Set(['ceremony', 'ceremony3', 'dining', 'kitchen', 'bedroom', 'hoh', 'yard', 'dr', 'storage', 'havenot',
  'bathroom', 'juryhouse', 'door', 'premiere', 'comp', 'wall', 'cutaway', 'studio', 'finale', 'map']);
const USES = new Set(['eviction', 'ceremony', 'nominations', 'house', 'meal', 'quiet', 'dr']);
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
      dining: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'],
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

  it('keeps the beach out of the house: houseguests never leave it, the beach is the jury\'s', () => {
    const HOUSE = new Set(['ceremony', 'ceremony3', 'dining', 'kitchen', 'bedroom', 'hoh', 'yard', 'dr', 'storage', 'havenot', 'bathroom']);
    for (const id of IDS.filter(id => /^(beach|dock)/.test(id))) {
      for (const s of PLATES[id].sets) expect(HOUSE.has(s), `${id} is listed for the house set ${s}`).toBe(false);
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
    expect(plateFor({ set: 'dining', seated: {} })).toBe('dining-noms');
    // an arena or a built set is never a plate
    expect(plateFor({ set: 'yard', arena: true })).toBe(null);
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
});
