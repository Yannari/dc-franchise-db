// The user, 2026-10-10, of eight campers lined up in the sea on the beach: "dont put people in the water if
// they're not swimming ... respect the venues". A crowd stands where the plate has ground: never inside a
// body of water in the foreground (a 'pool' mark), on any plate, at any group size.
import { describe, it, expect } from 'vitest';
import { TD_MARKS } from '../js/vp-td-ep/marks.js';
import { placeScene } from '../js/vp-td-ep/steps.js';
import { TD_WET, WET_COLS, WET_ROWS } from '../js/vp-td-ep/wet.js';

const wet = (key, u, v) => { const g = TD_WET[key]; const row = g[Math.min(WET_ROWS - 1, Math.floor(v * WET_ROWS))], col = Math.min(WET_COLS - 1, Math.floor(u * WET_COLS)); return !!((parseInt(row[15 - (col >> 2)], 16) >> (col & 3)) & 1); };

// three plates carry a hand-set floor in steps.js (LOW_FLOOR): the people stand in the foreground there on purpose
const HAND_SET = /(islands\/skull-rock|redemption\/skull-beach|redemption\/cave-entrance)-/;
const NAMES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'];
describe('people stand on the ground', () => {
  it('knows where the water is on the plates', () => expect(Object.keys(TD_WET).length).toBeGreaterThan(30));
  // the authored standing and sitting spots are the ground: nobody stands deeper than the deepest of them
  // (that is where the beach crowd went into the sea), or far off to the side of the floor they cover
  it('stands nobody deeper than the ground the plate marks', () => {
    const bad = [];
    for (const [key, plate] of Object.entries(TD_MARKS)) {
      const marks = (plate.m || []).filter(m => (m.kind === 'stand' || m.kind === 'seat') && m.u > .05 && m.u < .95);
      if (!marks.length || /\/map-/.test(key) || HAND_SET.test(key)) continue;
      const deep = Math.max(...marks.map(m => m.v)), lo = Math.min(...marks.map(m => m.u)), hi = Math.max(...marks.map(m => m.u));
      for (let n = 1; n <= 9; n++) for (const sit of [false, true]) {
        const placed = placeScene(key, NAMES.slice(0, n), [], { sit });
        for (const [who, p] of Object.entries(placed)) {
          if (p.v > deep + .025) bad.push(`${key} n=${n}${sit ? ' sit' : ''}: ${who} at v ${p.v.toFixed(2)}, ground ends ${deep.toFixed(2)}`);
          if (p.u < Math.min(lo - .17, .5 - .16) || p.u > Math.max(hi + .17, .5 + .16)) bad.push(`${key} n=${n}: ${who} at u ${p.u.toFixed(2)}, floor ${lo.toFixed(2)}-${hi.toFixed(2)}`);
        }
      }
    }
    expect(bad.slice(0, 40)).toEqual([]);
  });
  // ...and the plate's own water mask (wet.js): nobody off an authored mark has their feet in the water
  it('never puts anybody in the water', () => {
    const bad = [];
    for (const key of Object.keys(TD_WET).filter(k => !HAND_SET.test(k) && !/\/map-/.test(k) && TD_MARKS[k])) {
      const marks = (TD_MARKS[key].m || []).filter(m => m.kind === 'stand' || m.kind === 'seat');
      const onMark = p => marks.some(m => Math.abs(m.u - p.u) < .03 && Math.abs(m.v - p.v) < .03);
      for (let n = 1; n <= 9; n++) for (const sit of [false, true]) {
        const placed = placeScene(key, NAMES.slice(0, n), [], { sit });
        for (const [who, p] of Object.entries(placed)) if (!onMark(p) && wet(key, p.u, p.v)) bad.push(`${key} n=${n}${sit ? ' sit' : ''}: ${who} at ${p.u.toFixed(2)},${p.v.toFixed(2)}`);
      }
    }
    expect(bad.slice(0, 30)).toEqual([]);
  });

});
