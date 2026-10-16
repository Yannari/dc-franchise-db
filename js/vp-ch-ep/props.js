// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/props.js — the games' objects, drawn over the plates
// ══════════════════════════════════════════════════════════════════════
//
// What a game is played WITH, so it can be seen being played: buoys with their
// lanterns and numbers, the totals board, flags, maze letters, crate towers,
// buckets and tanks, the Arena's sets. Each prop is a spec ({ k, u, v, ... } in
// plate coordinates, 0..1) and this file turns it into SVG. Until the painted
// set plates arrive (art jobs D01-D11, E01-E06) the Arena games are drawn here;
// a game with a painted set skips its drawn one (`painted` in play.js).
// Strings only: no DOM, so the steps stay pure and testable.

import { playerAvatarUrl } from '../players.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const at = (p, w, extra = '') => `left:${(p.u * 100).toFixed(2)}%;top:${(p.v * 100).toFixed(2)}%;width:${w}cqw;${extra}`;
const box = (p, w, svg, cls = '') => `<div class="prop ${cls}" style="${at(p, w)}">${svg}</div>`;

const P = {
  // a buoy floating on the water, with a lantern and maybe a number
  buoy: p => box(p, p.w || 4, `<svg viewBox="0 -14 40 60"><ellipse cx="20" cy="40" rx="16" ry="4" fill="rgba(255,255,255,.35)"/><path d="M6 30a14 12 0 0 1 28 0v6H6z" fill="${p.c || '#ff6a1a'}" stroke="#111" stroke-width="2"/><rect x="6" y="30" width="28" height="6" fill="#fff" stroke="#111" stroke-width="2"/>`
    + `<rect x="16" y="10" width="8" height="12" rx="2" fill="${p.lit ? '#fff3a8' : '#5a5148'}" stroke="#111" stroke-width="2"/>${p.lit ? '<circle cx="20" cy="16" r="13" fill="rgba(255,230,120,.35)"/>' : ''}`
    + `${p.num != null && p.lit ? `<text x="20" y="2" text-anchor="middle" font-family="Anton" font-size="19" fill="#ffd21a" stroke="#111" stroke-width="4" paint-order="stroke">${esc(p.num)}</text>` : ''}</svg>`, 'bob'),
  // the totals board on the beach: one row per name
  board: p => box(p, p.w || 20, `<svg viewBox="0 0 200 ${30 + (p.rows || []).length * 22}"><rect x="2" y="2" width="196" height="${26 + (p.rows || []).length * 22}" rx="4" fill="#f4f1ea" stroke="#111" stroke-width="3"/><text x="100" y="20" text-anchor="middle" font-family="Black Ops One" font-size="13" fill="#e3262d">${esc(p.title || 'TOTALS')}</text>`
    + (p.rows || []).map((r, i) => `<text x="12" y="${42 + i * 22}" font-family="Permanent Marker" font-size="15" fill="#1d2b5a">${esc(r.n)}</text><text x="150" y="${42 + i * 22}" font-family="Permanent Marker" font-size="16" fill="${r.ok === false ? '#e3262d' : '#1d2b5a'}" text-anchor="end">${esc(r.t)}</text>`
      + (r.ok === true ? `<path d="M160 ${36 + i * 22}l6 6 12-12" stroke="#1a9a3a" stroke-width="4" fill="none"/>` : r.ok === false ? `<path d="M160 ${30 + i * 22}l14 14m0-14l-14 14" stroke="#e3262d" stroke-width="4"/>` : '')).join('') + '</svg>'),
  flag: p => box(p, 1.6, `<svg viewBox="0 0 20 40"><path d="M3 2v38" stroke="#2a1d12" stroke-width="3"/><path d="M4 3h14l-4 6 4 6H4z" fill="${p.c || '#ff6a1a'}" stroke="#111" stroke-width="1.5"/></svg>`),
  // a letter found in the maze, on its station sign
  letter: p => box(p, 3, `<svg viewBox="0 0 36 36"><rect x="2" y="2" width="32" height="32" rx="3" fill="#7a4b26" stroke="#111" stroke-width="2.5"/><text x="18" y="27" text-anchor="middle" font-family="Black Ops One" font-size="22" fill="#ffd21a" stroke="#111" stroke-width="2" paint-order="stroke">${esc(p.ch)}</text></svg>`, 'pop-in'),
  // a crate tower, standing or knocked down
  tower: p => box(p, p.w || 6, p.down
    ? `<svg viewBox="0 0 60 40"><rect x="2" y="22" width="18" height="16" fill="#a4733e" stroke="#111" stroke-width="2" transform="rotate(-12 11 30)"/><rect x="22" y="24" width="18" height="14" fill="#8e6232" stroke="#111" stroke-width="2" transform="rotate(9 31 31)"/><rect x="40" y="20" width="18" height="18" fill="#a4733e" stroke="#111" stroke-width="2" transform="rotate(20 49 29)"/></svg>`
    : `<svg viewBox="0 0 60 80"><rect x="10" y="44" width="40" height="34" fill="#a4733e" stroke="#111" stroke-width="2.5"/><rect x="14" y="12" width="32" height="32" fill="#8e6232" stroke="#111" stroke-width="2.5"/><path d="M30 12V0" stroke="#2a1d12" stroke-width="3"/><path d="M31 1h14l-4 5 4 5H31z" fill="${p.c || '#ffd21a'}" stroke="#111"/></svg>`, p.down ? 'fallen' : ''),
  // a tank on the far platform, filling up
  tank: p => box(p, 3.4, `<svg viewBox="0 0 30 50"><rect x="3" y="3" width="24" height="44" fill="rgba(200,240,255,.25)" stroke="#111" stroke-width="2.5"/><rect x="5" y="${5 + 40 * (1 - Math.max(0, Math.min(1, p.fill || 0)))}" width="20" height="${40 * Math.max(0, Math.min(1, p.fill || 0))}" fill="#2fb7e8"/><text x="15" y="49" text-anchor="middle" font-family="Anton" font-size="8" fill="#fff">${esc(p.label || '')}</text></svg>`),
  bucket: p => box(p, 1.8, `<svg viewBox="0 0 20 20"><path d="M3 5h14l-2 13H5z" fill="#c9c4bd" stroke="#111" stroke-width="2"/><ellipse cx="10" cy="5" rx="7" ry="2" fill="#2fb7e8" stroke="#111" stroke-width="1.5"/></svg>`),
  token: p => box(p, 1.4, `<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#ffd21a" stroke="#111" stroke-width="2"/><text x="10" y="14" text-anchor="middle" font-family="Anton" font-size="10" fill="#111">${esc(p.num ?? '')}</text></svg>`, 'pop-in'),
  sandbag: p => box(p, 3, `<svg viewBox="0 0 40 20"><path d="M3 14c0-8 34-8 34 0 0 4-34 4-34 0z" fill="#5a5148" stroke="#111" stroke-width="2"/></svg>`),
  puzzle: p => box(p, p.w || 7, `<svg viewBox="0 0 70 56"><rect x="2" y="2" width="66" height="52" fill="#3a2a1c" stroke="#111" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => i < (p.n || 0) ? `<rect x="${6 + (i % 4) * 15.5}" y="${6 + Math.floor(i / 4) * 15.5}" width="14" height="14" fill="${['#2fb7e8', '#ff6a1a', '#ffd21a', '#5bc85b'][i % 4]}" stroke="#111" stroke-width="1.5"/>` : '').join('')}${p.locked ? '<path d="M18 30l10 10 24-24" stroke="#fff" stroke-width="6" fill="none"/>' : ''}</svg>`),
  // ── the Arena's sets, drawn until the painted ones arrive ──
  pole: p => box(p, 16, `<svg viewBox="0 0 160 40"><ellipse cx="80" cy="30" rx="78" ry="9" fill="none" stroke="#ffd21a" stroke-width="3" stroke-dasharray="8 6"/><rect x="10" y="12" width="140" height="8" rx="4" fill="#9aa3ad" stroke="#111" stroke-width="2.5" transform="rotate(${p.tilt || 0} 80 16)"/></svg>`),
  hallway: p => box(p, 34, `<svg viewBox="0 0 340 60"><rect x="10" y="4" width="320" height="14" fill="#ff6a1a" stroke="#111" stroke-width="2.5"/><rect x="10" y="42" width="320" height="14" fill="#ff6a1a" stroke="#111" stroke-width="2.5"/><path d="M10 18v24M330 18v24" stroke="#111" stroke-width="3"/>${[0, 1].map(i => `<g transform="translate(${i ? 322 : 2} 0)"><path d="M8 4v52" stroke="#2a1d12" stroke-width="3"/><path d="M2 10a6 7 0 0 1 12 0v5H2z" fill="#e8b23a" stroke="#111" stroke-width="2"/></g>`).join('')}</svg>`),
  frames: p => box(p, 22, `<svg viewBox="0 0 220 90">${[20, 130].map(x => `<g transform="translate(${x} 0)"><rect x="0" y="4" width="70" height="70" fill="none" stroke="#7a4b26" stroke-width="6"/><path d="M6 14q16 12 30 0t30 0M6 34q16 12 30 0t30 0M6 54q16 12 30 0t30 0" stroke="#d8b36a" stroke-width="4" fill="none"/>${p.done === x ? '' : '<circle cx="18" cy="20" r="4" fill="#d8b36a"/><circle cx="50" cy="40" r="4" fill="#d8b36a"/>'}<rect x="22" y="76" width="26" height="12" fill="#555" stroke="#111" stroke-width="2"/></g>`).join('')}</svg>`),
  pit: p => box(p, 26, `<svg viewBox="0 0 260 70"><ellipse cx="130" cy="44" rx="125" ry="22" fill="${p.mud ? '#6b4a2c' : p.water ? '#3aa6c9' : '#d9b77e'}" stroke="#111" stroke-width="3"/>${p.pieces ? Array.from({ length: 9 }, (_, i) => `<rect x="${40 + i * 21}" y="${36 + (i % 3) * 6}" width="10" height="8" fill="${['#2fb7e8', '#ff6a1a', '#ffd21a'][i % 3]}" stroke="#111" transform="rotate(${i * 23} ${45 + i * 21} 40)"/>`).join('') : ''}</svg>`),
  bar: p => box(p, 26, `<svg viewBox="0 0 260 120"><path d="M20 118V10M240 118V10" stroke="#555" stroke-width="8"/><rect x="14" y="${10 + (p.low || 0) * 12}" width="232" height="8" fill="#9aa3ad" stroke="#111" stroke-width="2"/></svg>`),
  crates: p => box(p, 22, `<svg viewBox="0 0 220 90">${[10, 130].map((x, k) => `<g transform="translate(${x} 0)">${Array.from({ length: 6 }, (_, i) => (p.smashed?.[k] || 0) > i ? '' : `<rect x="${(i % 2) * 38}" y="${60 - Math.floor(i / 2) * 28}" width="36" height="27" fill="#a4733e" stroke="#111" stroke-width="2.5"/>`).join('')}</g>`).join('')}</svg>`),
  rope: p => box(p, 30, `<svg viewBox="0 0 300 50"><rect x="80" y="18" width="140" height="22" rx="6" fill="#3aa6c9" stroke="#111" stroke-width="3"/><path d="M10 20 Q150 ${p.sag ?? 30} 290 20" stroke="#d8b36a" stroke-width="5" fill="none"/><path d="M10 0v30M290 0v30" stroke="#2a1d12" stroke-width="3"/><path d="M11 1h12l-3 5 3 5H11z" fill="#ff6a1a"/><path d="M291 1h-12l3 5-3 5h12z" fill="#ffd21a"/></svg>`),
  ballring: p => box(p, 30, `<svg viewBox="0 0 300 70"><ellipse cx="150" cy="44" rx="140" ry="22" fill="none" stroke="#ff6a1a" stroke-width="4"/>${[8, 292].map(x => `<path d="M${x} 66V10" stroke="#2a1d12" stroke-width="4"/><ellipse cx="${x}" cy="14" rx="10" ry="4" fill="none" stroke="#e3262d" stroke-width="3"/>`).join('')}<circle cx="${150 + (p.ball || 0) * 120}" cy="42" r="9" fill="#7a4b26" stroke="#111" stroke-width="2.5"/></svg>`),
  rafts: p => box(p, 24, `<svg viewBox="0 0 240 60">${[10, 130].map((x, k) => `<g transform="translate(${x} 20)"><rect width="100" height="30" fill="#a4733e" stroke="#111" stroke-width="2.5"/>${Array.from({ length: 8 }, (_, i) => i < (p.laid?.[k] || 0) ? `<rect x="${4 + i * 12}" y="8" width="10" height="14" fill="${['#e3262d', '#2fb7e8', '#ffd21a', '#5bc85b'][i % 4]}" stroke="#111"/>` : '').join('')}</g>`).join('')}</svg>`),
  ramps: p => box(p, 24, `<svg viewBox="0 0 240 90">${[10, 130].map((x, k) => `<g transform="translate(${x} 0)"><path d="M0 88L90 20h10v68z" fill="#d9b77e" stroke="#111" stroke-width="2.5"/><rect x="88" y="12" width="14" height="8" fill="#7a4b26"/>${Array.from({ length: Math.min(10, p.up?.[k] || 0) }, (_, i) => `<rect x="${86 + (i % 2) * 7}" y="${4 - Math.floor(i / 2) * 3}" width="6" height="8" fill="#2f6fd1" stroke="#111"/>`).join('')}</g>`).join('')}</svg>`),
  bats: p => box(p, 22, `<svg viewBox="0 0 220 80">${[10, 130].map((x, k) => `<g transform="translate(${x} 0)"><path d="M10 78V20" stroke="#7a4b26" stroke-width="6"/><rect x="40" y="50" width="40" height="28" fill="#7a4b26" stroke="#111" stroke-width="2"/>${Array.from({ length: Math.min(10, p.stack?.[k] || 0) }, (_, i) => `<rect x="${52 + (i % 2) * 4}" y="${44 - i * 6}" width="14" height="6" fill="#e8c27a" stroke="#111"/>`).join('')}</g>`).join('')}</svg>`),
  lockbox: p => box(p, 2.6, `<svg viewBox="0 0 30 30"><rect x="3" y="10" width="24" height="17" fill="#555" stroke="#111" stroke-width="2"/>${p.smoke ? '<circle cx="15" cy="6" r="8" fill="rgba(255,106,26,.75)"/><circle cx="8" cy="2" r="6" fill="rgba(255,210,26,.6)"/>' : ''}</svg>`),
};

// The user, 2026-10-15, on these drawings: "really out of place", "really primitive". Nothing drawn here is
// put on a plate any more: an object appears in the world only as the user's painted cut-out
// (assets/sets/ch/props/<kind>.webp, listed in SPRITES once it is processed), and what a drawing used to
// say (a total, a letter, a tank level) is on the HUD instead (stage.js: the count board, the totals panel).
// The cut-outs (art job F01, 2026-10-15), with their default width on the stage (cqw).
export const SPRITES = {
  ball: 3, barrel: 1.7, blocks: 4, bucket: 2.2, buoy: 4, 'buoy-lit': 4, 'crates-fallen': 7, flag: 2, key: 3,
  lockbox: 3.4, 'mud-splash': 7, pole: 16, 'puzzle-frame': 6, 'puzzle-pieces': 8, ram: 6, sandbag: 3.6,
  'sign-blank': 4, smoke: 5, splash: 8, 'tank-empty': 4.4, 'tank-full': 4.4, tiles: 7, token: 1.4,
  // one per player, cut out of the user's own plates (tools/ch-art/cutout.py): Pole Truth's post, the gorge's platform
  post: 1.45, 'post-short': 2, platform: 15,
  // the G sets' objects (art jobs G02-G13), one per player
  coffin: 12, buzzer: 2.6, podium: 7.5, dome: 4.4, cup: 2, stool: 4, crate: 8, easel: 5, bell: 3, cage: 36, log: 45, car: 16, 'ice-tub': 12,
};
const sprite = (file, p, w, cls = '', turn = 0) => ({ file, p, w: w || SPRITES[file], cls, turn });
const sides = [.4, .6];

// What a game's prop looks like as cut-outs: one prop can be several (a lockbox and its smoke), and the
// count a drawing used to show is the number of cut-outs (barrels up the ramp, tiles laid).
function spritesOf(p) {
  switch (p.k) {
    case 'buoy': return [sprite(p.lit ? 'buoy-lit' : 'buoy', p, p.w, 'bob')];
    case 'token': case 'flag': case 'bucket': case 'sandbag': return [sprite(p.k, p, p.w, p.k === 'token' ? 'pop-in' : '')];
    case 'tank': return [sprite((p.fill || 0) >= .5 ? 'tank-full' : 'tank-empty', p)];
    case 'tower': return p.down ? [sprite('crates-fallen', p, p.w, 'fallen')] : [];
    case 'puzzle': return [sprite('puzzle-frame', p, p.w || SPRITES['puzzle-frame'], p.locked ? 'pop-in' : '')];
    case 'pit': return p.pieces ? [sprite('puzzle-pieces', p)] : p.mud ? [sprite('mud-splash', { ...p, v: p.v + .02 }, 9)] : [];
    case 'pole': return [sprite('pole', p, 16, '', p.tilt || 0)];
    case 'post': case 'post-short': case 'platform': case 'podium': case 'coffin': case 'buzzer': case 'dome': case 'cup': case 'stool': case 'crate': case 'easel':
    case 'bell': case 'cage': case 'log': case 'car': case 'ice-tub': return [sprite(p.k, p, p.w)];
    case 'ballring': return [sprite('ball', { ...p, u: p.u + (p.ball || 0) * .4 }, 3.2)];
    case 'lockbox': return [sprite('lockbox', p), ...(p.smoke ? [sprite('smoke', { ...p, v: p.v - .07 }, 6, 'pop-in')] : [])];
    case 'crates': return (p.smashed || []).flatMap((n, k) => (n > 0 ? [sprite('crates-fallen', { ...p, u: sides[k], v: p.v + .14 }, 6, 'fallen')] : []));
    case 'rafts': return (p.laid || []).flatMap((n, k) => (n > 0 ? [sprite('tiles', { ...p, u: sides[k], v: p.v }, 7 * Math.min(1, n / 8))] : []));
    case 'ramps': return (p.up || []).flatMap((n, k) => Array.from({ length: Math.min(5, n) }, (_, i) => sprite('barrel', { ...p, u: (k ? .74 : .26) + (k ? 1 : -1) * i * .022, v: p.v }, 2)));
    case 'bats': return (p.stack || []).flatMap((n, k) => (n > 0 ? [sprite('blocks', { ...p, u: sides[k], v: p.v + .08 }, 2 + Math.min(4, n * .4))] : []));
    default: return [];
  }
}
const spriteHtml = s => `<div class="prop sprite ${s.cls}" style="${at(s.p, s.w)}"><img src="assets/sets/ch/props/${esc(s.file)}.webp" alt=""${s.turn ? ` style="transform:rotate(${s.turn}deg)"` : ''}></div>`;

// Pole Truth's big red timer (the user, 2026-10-15: "the clock isn't really well made"): the plate's own
// screen with its digits cleared (G01 timer-empty), and the time drawn as seven-segment digits in the
// plate's coordinates, lit segments red with a glow, the rest dim, like the board the plate was painted
// with. It sits in the prop layer, so it moves with the camera and stays on the board.
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
function digitSvg(ch, x0, y0, w, h, t) {
  const hz = (xa, xb, y) => `${xa},${y} ${xa + t / 2},${y - t / 2} ${xb - t / 2},${y - t / 2} ${xb},${y} ${xb - t / 2},${y + t / 2} ${xa + t / 2},${y + t / 2}`;
  const vt = (x, ya, yb) => `${x},${ya} ${x + t / 2},${ya + t / 2} ${x + t / 2},${yb - t / 2} ${x},${yb} ${x - t / 2},${yb - t / 2} ${x - t / 2},${ya + t / 2}`;
  const g = 3, xl = x0 + t / 2, xr = x0 + w - t / 2, yt = y0 + t / 2, ym = y0 + h / 2, yb = y0 + h - t / 2;
  const S = { a: hz(xl + g, xr - g, yt), g: hz(xl + g, xr - g, ym), d: hz(xl + g, xr - g, yb),
    f: vt(xl, yt + g, ym - g), b: vt(xr, yt + g, ym - g), e: vt(xl, ym + g, yb - g), c: vt(xr, ym + g, yb - g) };
  const on = SEG[ch] || '';
  return Object.entries(S).map(([k, pts]) => `<polygon points="${pts}" class="${on.includes(k) ? 'on' : 'off'}"/>`).join('');
}
function clockHtml(p) {
  const [hh, mm] = String(p.t || '00:00').split(':');
  const ds = [...(hh || '00').padStart(2, '0'), ...(mm || '00').padStart(2, '0')];
  const X = [915, 1047, 1232, 1364];
  const body = ds.map((c, i) => digitSvg(c, X[i], 100, 112, 264, 24)).join('')
    + '<circle cx="1196" cy="182" r="12" class="on"/><circle cx="1196" cy="286" r="12" class="on"/>';
  return `<div class="prop bigclock-w" style="left:${(884 / 16).toFixed(2)}%;top:${(57 / 9).toFixed(2)}%;width:${((1508 - 884) / 16).toFixed(2)}%;height:${((411 - 57) / 9).toFixed(2)}%">`
    + `<svg viewBox="884 57 624 354" preserveAspectRatio="none"><defs><filter id="ckGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`
    + `<g filter="url(#ckGlow)">${body}</g></svg></div>`;
}

/** A step's props as HTML for the stage's prop layer: the painted cut-outs only. */
// The big screen on the club deck (G11): the question, then the names the house said and how many said each.
function screenHtml(p) {
  const rows = (p.rows || []).slice(0, 4).map(r => `<div class="r ${r.top ? 'top' : ''}"><img src="${esc(r.n === 'TJ' ? 'assets/avatars/tj-maxx.png' : playerAvatarUrl(r.n))}" alt=""><b>${esc(r.n)}</b><i style="width:${Math.round(100 * r.c / (p.max || 1))}%"></i><span>${r.c}</span></div>`).join('');
  return `<div class="prop bigscreen" style="left:${(483 / 16).toFixed(2)}%;top:${(117 / 9).toFixed(2)}%;width:${((1113 - 483) / 16).toFixed(2)}%;height:${((447 - 117) / 9).toFixed(2)}%">`
    + `<div class="q">${esc(p.q || '')}</div>${rows}</div>`;
}
export function propsHtml(list = []) {
  return list.filter(p => p.k === 'clock').map(clockHtml).join('') + list.filter(p => p.k === 'screen').map(screenHtml).join('') + list.flatMap(spritesOf).map(spriteHtml).join('');
}
/** The drawn versions, kept for the art jobs' reference sheet and tests; never on a plate. */
export function drawnHtml(list = []) {
  return list.map(p => (P[p.k] ? P[p.k](p) : '')).join('');
}
export const PROP_KINDS = Object.keys(P);
