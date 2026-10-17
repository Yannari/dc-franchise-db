// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/ground.js — where people can stand on a plate, and how big they are
// ══════════════════════════════════════════════════════════════════════
//
// Read off the plates' own marks (marks.js, tools/ch-art/places.json): the
// stand marks give the ground, the horizon gives the perspective. Pure.
import { CH_MARKS } from './marks.js';

// a team's colour (a Teams season): the same team, the same colour, every episode (steps.js casts it, stage.js recolours)
const TEAM_COLOURS = ['#2f80ff', '#e3262d', '#ffd21a', '#2bb673', '#a24bff', '#ff8a1f'];
export const teamColour = name => { let h = 11; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return TEAM_COLOURS[h % TEAM_COLOURS.length]; };

// Stand marks redrawn where a plate's own were wrong (the screenshots of every plate, 2026-10-15): the pool
// deck's stood at the very bottom, behind the dialogue box. [u, v, size]; replaces the plate's free stands.
const STAND_FIX = { pooldeck: [[.29, .66, .1], [.41, .66, .1], [.31, .76, .11], [.45, .76, .11], [.33, .86, .12], [.5, .86, .12]] };
// plates whose people are drawn too big for the room around them
const SIZE_FIX = { ridge: .7, gym: .85 };
for (const [k, M] of Object.entries(CH_MARKS)) {
  const f = STAND_FIX[String(k).replace(/-(day|night)$/, '')];
  if (f) M.m = [...M.m.filter(m => m.kind !== 'stand' || m.group), ...f.map(([u, v, s]) => ({ kind: 'stand', u, v, s }))];
  const z = SIZE_FIX[String(k).replace(/-(day|night)$/, '')];
  if (z) M.m = M.m.map(m => (m.s ? { ...m, s: m.s * z } : m));
}
export const marksOf = key => (CH_MARKS[key] || { m: [] }).m;
export const plateKey = (plate, night) => {
  const want = `${plate}-${night ? 'night' : 'day'}`;
  if (CH_MARKS[want]) return want;
  return CH_MARKS[`${plate}-day`] ? `${plate}-day` : `${plate}-night`;
};

// A crowd stands in rows on the plate's own ground (from its stand marks: the far line to the near one, never
// under the dialogue box), each row as wide as the frame allows. A plate's marks are sized for a close
// conversation; twenty people at that size are a wall of faces (the first screenshot, 2026-10-15).
export function groundOf(key) {
  const h = (CH_MARKS[key] || {}).h ?? .55;
  const st = marksOf(key).filter(m => m.kind === 'stand');
  const ref = st.length ? st.reduce((x, y) => (y.v > x.v ? y : x)) : { v: .8, s: .11 };
  // a person's size grows with their distance below the horizon (the plates' own perspective)
  const per = (ref.s || .1) / Math.max(.05, ref.v - h);
  const v1 = .8, v0 = Math.min(v1 - .06, h + .09);
  return { v0, v1, sizeAt: v => per * Math.max(.04, v - h) };
}
// Plates where a crowd can only stand in some places (the screenshots of every plate, 2026-10-15: the arrival
// stood in the sea under the dock, the beam's back row in the lagoon, the gorge's in the river). Rows from the
// far one to the near one, each with its own stretch of ground; `max` people a row.
const CROWD_ROWS = {
  dock: [{ v: .505, u0: .04, u1: .6, max: 11 }, { v: .775, u0: .05, u1: .5, max: 9 }],
  beam: [{ v: .7, u0: .06, u1: .94, max: 11 }, { v: .775, u0: .04, u1: .96, max: 12 }],
  gorge: [{ v: .585, u0: .015, u1: .19, max: 3 }, { v: .585, u0: .86, u1: .985, max: 3 }, { v: .79, u0: .04, u1: .96, max: 12 }],
};
// TJ where a plate has no host mark and its right edge is water.
const HOST_AT = { dock: { u: .58, v: .505 }, gorge: { u: .93, v: .79 } };
const baseOf = key => String(key).replace(/-(day|night)$/, '');
function rowsLineup(key, rows, n) {
  const g = groundOf(key);
  const out = [];
  let left = n;
  const per = rows.map(r => 0);
  // fill the near rows first (people stand in front), the far ones with what is left
  for (let k = rows.length - 1; k >= 0 && left > 0; k--) { per[k] = Math.min(rows[k].max, left); left -= per[k]; }
  for (let k = 0; k < rows.length && left > 0; k++) { const add = Math.min(left, 4); per[k] += add; left -= add; }
  rows.forEach((r, k) => {
    const m = per[k]; if (!m) return;
    const gap = (r.u1 - r.u0) / Math.max(m, 1);
    const s = Math.min(g.sizeAt(r.v), gap * 1.25, .13);
    for (let i = 0; i < m; i++) out.push({ u: r.u0 + gap * (i + .5), v: r.v, s });
  });
  return out;
}
export function lineup(key, n, { back = false } = {}) {
  if (!n) return [];
  if (CROWD_ROWS[baseOf(key)]) return rowsLineup(key, CROWD_ROWS[baseOf(key)], n);
  const g = groundOf(key);
  const perRow = Math.min(n, back ? 9 : 8);
  const rows = Math.ceil(n / perRow);
  const out = [];
  for (let r = 0; r < rows; r++) {
    // the back rows first, the near row last (it paints in front)
    const t = rows === 1 ? (back ? .25 : .7) : (back ? r / (rows - 1) * .45 : .25 + r / (rows - 1) * .75);
    const v = g.v0 + (g.v1 - g.v0) * t;
    const inRow = Math.min(perRow, n - r * perRow);
    const gap = .86 / Math.max(5, perRow);
    const s = Math.min(g.sizeAt(v), gap / .84 * .95);
    for (let k = 0; k < inRow; k++) {
      const u = .5 + (k - (inRow - 1) / 2) * gap + (r % 2 ? gap / 2 : 0) * (inRow < perRow ? 0 : 1) - (r % 2 ? gap / 4 : 0);
      out.push({ u: Math.min(.95, Math.max(.05, u)), v, s });
    }
  }
  return out;
}
/** TJ at the side of a plate that has no host spot, at the near row's size. */
export function hostSide(key) {
  const host = marksOf(key).find(m => m.kind === 'host');
  if (host) return ['host'];
  const g = groundOf(key);
  const at = HOST_AT[baseOf(key)];
  if (at) return { u: at.u, v: at.v, s: Math.min(g.sizeAt(at.v), .13) };
  return { u: .93, v: .78, s: Math.min(g.sizeAt(.78), .14) };
}

/** A person's size (the stage's `s`) standing at height v on a plate. */
export const sizeAt = (key, v) => groundOf(key).sizeAt(v);
/** A spot at (u, v) on a plate, sized for it. */
export const spotAt = (key, u, v, k = 1) => ({ u, v, s: Math.min(.16, sizeAt(key, v) * k) });
/** n spots in rows inside a band of the plate (u0..u1, v0..v1), sized for it: a crowd in the water, on a beach. */
export function band(key, n, { u0 = .1, u1 = .9, v0 = .62, v1 = .74, k = 1 } = {}) {
  if (!n) return [];
  const perRow = Math.min(n, 9), rows = Math.ceil(n / perRow), out = [];
  for (let r = 0; r < rows; r++) {
    const v = rows === 1 ? (v0 + v1) / 2 : v0 + (v1 - v0) * r / (rows - 1);
    const inRow = Math.min(perRow, n - r * perRow), gap = (u1 - u0) / Math.max(1, perRow);
    const s = Math.min(sizeAt(key, v) * k, gap / .84 * .95);
    for (let i = 0; i < inRow; i++) out.push({ u: u0 + gap * (i + .5) + (r % 2 ? gap / 3 : 0), v, s });
  }
  return out;
}
