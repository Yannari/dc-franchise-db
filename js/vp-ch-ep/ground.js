// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/ground.js — where people can stand on a plate, and how big they are
// ══════════════════════════════════════════════════════════════════════
//
// Read off the plates' own marks (marks.js, tools/ch-art/places.json): the
// stand marks give the ground, the horizon gives the perspective. Pure.
import { CH_MARKS } from './marks.js';

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
export function lineup(key, n, { back = false } = {}) {
  if (!n) return [];
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
