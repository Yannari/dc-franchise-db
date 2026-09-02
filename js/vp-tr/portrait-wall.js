// ══════════════════════════════════════════════════════════════════════
// vp-tr/portrait-wall.js — the cast as a wall of framed portraits
// ══════════════════════════════════════════════════════════════════════
//
// A SHARED COMPONENT, and the emphasis is on shared. The Traitors has several
// screens that want to show the whole cast at once with each face in a
// different STATE — the morning after a murder (this task's consumer), a
// Voting Plans board, the Conclave — and every one of them needs the same
// three things: a framed portrait, a way to strike out the people who are
// gone, and a way to pick out the one being talked about. Building that three
// times is how a project ends up with three avatar patterns that drift.
//
// SO IT REUSES THE ONE PATTERN THIS DIRECTORY ALREADY HAS. `_portrait` and
// `_slugOf` come from js/vp-tr/conclave.js — the same `assets/avatars/<slug>.png`
// with an initials fallback that every other screen draws — and the wall adds
// only the FRAME and the STATE on top. There is no second `<img>` convention
// in here.
//
// TWO EXITS, DRAWN DIFFERENTLY, because they are different facts. A banishment
// is the room's decision, made in the open — its portrait is struck through
// with a single hard bar, the way a name is struck off a slate. A murder is
// the pact's, made in the dark — its portrait is torn across by a red gash and
// dimmed, the empty place at breakfast. A screen that drew both the same way
// would be telling the viewer the castle's two doors are one door.
//
// REDUCED-MOTION SAFE by construction: nothing here animates. The highlight is
// a static ring; the strikes are static SVG. There is no transition to gate.
import { _portrait, _slugOf } from './conclave.js';

// THE TWO EXIT STATES, as exported constants rather than bare strings a caller
// must retype. A consumer screen lives under the exit-verb-literal guard
// (tests/tr-vp.test.js) — it may not write the registry's words 'murdered' or
// 'banished' as literals in its own source — so it imports these instead. This
// file is not a prose screen and is exempt; the words live here, once.
export const WALL_MURDERED = 'murdered';
export const WALL_BANISHED = 'banished';

function _esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── the two strikes, as SVG overlays ───────────────────────────────────
//
// Drawn over the portrait, not instead of it: the face stays visible under the
// mark, because the viewer needs to know WHO left, not merely that a chair is
// empty.

/** The banishment bar — one hard horizontal stroke, struck off like a slate. */
function _banishMark() {
  return '<svg class="pw-mark" viewBox="0 0 100 100" preserveAspectRatio="none" '
    + 'aria-hidden="true"><line x1="6" y1="52" x2="94" y2="48" '
    + 'stroke="rgba(222,214,196,.92)" stroke-width="5" stroke-linecap="round"/>'
    + '<line x1="6" y1="52" x2="94" y2="48" stroke="rgba(20,16,12,.55)" '
    + 'stroke-width="1.4" stroke-linecap="round"/></svg>';
}

/** The murder gash — a red diagonal tear, drawn ragged rather than ruled. */
function _murderMark() {
  return '<svg class="pw-mark" viewBox="0 0 100 100" preserveAspectRatio="none" '
    + 'aria-hidden="true"><path d="M12 84 L38 52 L34 44 L62 20 L58 30 L88 14" '
    + 'fill="none" stroke="rgba(201,40,60,.9)" stroke-width="4.6" '
    + 'stroke-linejoin="round" stroke-linecap="round"/>'
    + '<path d="M12 84 L38 52 L34 44 L62 20 L58 30 L88 14" fill="none" '
    + 'stroke="rgba(90,10,18,.6)" stroke-width="1.4"/></svg>';
}

/** A gilt corner ornament, one per frame corner — the 18th-century flourish. */
function _corner() {
  return '<svg class="pw-corner" viewBox="0 0 24 24" fill="none" aria-hidden="true">'
    + '<path d="M2 2c7 0 12 1 15 4s4 8 4 15" stroke="currentColor" '
    + 'stroke-width="1.3"/>'
    + '<path d="M2 8c4 0 7 .6 9 2.6S13.4 16 13.4 20" stroke="currentColor" '
    + 'stroke-width=".9" opacity=".7"/>'
    + '<circle cx="4.5" cy="4.5" r="1.5" fill="currentColor"/></svg>';
}

/**
 * Normalise the per-name state into one of the three exits.
 *
 * `state` may be a plain object `{ name: 'murdered' | 'banished' }` or a
 * function `name => 'murdered' | 'banished' | 'alive'`. Anything not one of
 * the two exit words is alive — the wall never guesses a death.
 */
function _stateOf(state, name) {
  const raw = typeof state === 'function' ? state(name) : (state && state[name]);
  return raw === 'murdered' || raw === 'banished' ? raw : 'alive';
}

/**
 * THE WALL. A row of framed portraits, in the order given.
 *
 * @param {object} o
 * @param {string[]} o.names     — the cast, in the order they hang. Required.
 * @param {object|function} o.state — per-name exit: 'murdered' | 'banished'
 *                                     (a name absent, or 'alive', hangs whole).
 * @param {string|string[]|Set} o.highlight — the name(s) being discussed, ringed.
 * @param {number} o.size        — portrait px (default 56).
 * @param {string} o.caption     — optional line under a struck portrait's plate,
 *                                  keyed by name: `{ name: 'text' }`.
 *
 * Returns a `<div class="pw-wall">…`. Include `PORTRAIT_WALL_CSS` once on the
 * hosting screen — it depends on the shared `PORTRAIT_CSS` (`.cv-av`) being
 * present too, which every vp-tr screen already carries.
 */
export function portraitWall(o = {}) {
  const names = (o.names || []).filter(Boolean);
  const size = o.size || 56;
  const hiSet = o.highlight == null ? new Set()
    : (o.highlight instanceof Set ? o.highlight
      : new Set(Array.isArray(o.highlight) ? o.highlight : [o.highlight]));
  const caption = o.caption || {};

  const tiles = names.map(name => {
    const exit = _stateOf(o.state, name);
    const hi = hiSet.has(name);
    const mark = exit === 'murdered' ? _murderMark()
      : exit === 'banished' ? _banishMark() : '';
    const cap = caption[name]
      ? '<span class="pw-cap">' + _esc(caption[name]) + '</span>' : '';
    return '<figure class="pw-tile" data-exit="' + exit + '"'
      + (hi ? ' data-hi="1"' : '') + '>'
      + '<span class="pw-frame">'
      + _corner() + _corner() + _corner() + _corner()
      + '<span class="pw-plate">' + _portrait(_slugOf(name), name, size)
      + mark + '</span></span>'
      + '<figcaption class="pw-nm">' + _esc(name) + '</figcaption>'
      + cap + '</figure>';
  }).join('');

  return '<div class="pw-wall" role="group" aria-label="The cast">' + tiles + '</div>';
}

// The gilt-frame and state styling. The face itself is `.cv-av` from
// PORTRAIT_CSS, which every vp-tr screen already loads; this only adds the
// frame around it and the two strikes over it. No animation — the highlight is
// a static ring and both marks are static SVG, so there is nothing for
// prefers-reduced-motion to turn off.
export const PORTRAIT_WALL_CSS = `
.pw-wall{
  display:flex;flex-wrap:wrap;gap:14px 12px;justify-content:center;
  padding:6px 2px;
}
.pw-tile{
  margin:0;display:flex;flex-direction:column;align-items:center;gap:5px;width:auto;
}
.pw-frame{
  position:relative;display:inline-block;padding:7px;border-radius:5px;
  background:linear-gradient(150deg,#2a2013,#5c451c 40%,#caa24e 62%,#6b511f 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255,226,170,.4),
    inset 0 0 6px rgba(0,0,0,.6),
    0 0 0 1px rgba(20,14,6,.9),
    0 6px 16px rgba(0,0,0,.55);
  color:rgba(255,226,170,.72);
}
.pw-plate{
  position:relative;display:block;border-radius:3px;overflow:hidden;
  box-shadow:inset 0 0 0 2px rgba(20,14,6,.85);
  background:#0a0c11;
}
.pw-plate .cv-av{
  display:block;border-radius:3px;box-shadow:none;
}
.pw-corner{
  position:absolute;width:15px;height:15px;color:rgba(255,232,186,.85);opacity:.9;
  pointer-events:none;
}
.pw-corner:nth-of-type(1){top:2px;left:2px}
.pw-corner:nth-of-type(2){top:2px;right:2px;transform:scaleX(-1)}
.pw-corner:nth-of-type(3){bottom:2px;left:2px;transform:scaleY(-1)}
.pw-corner:nth-of-type(4){bottom:2px;right:2px;transform:scale(-1,-1)}
.pw-mark{
  position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none;
}
.pw-nm{
  font-family:var(--cv-display,'Playfair Display',serif);font-size:12px;
  letter-spacing:.02em;color:rgba(233,224,205,.86);text-align:center;max-width:82px;
  line-height:1.15;
}
.pw-cap{
  font-size:10px;letter-spacing:.04em;text-transform:uppercase;
  color:rgba(201,120,110,.85);text-align:center;
}
/* BANISHED — struck in the open, drained to bone. The frame goes cold. */
.pw-tile[data-exit="banished"] .pw-frame{
  background:linear-gradient(150deg,#20211f,#3b3a34 45%,#6a695c 62%,#3a3934 100%);
  color:rgba(210,206,192,.6);
}
.pw-tile[data-exit="banished"] .cv-av img{filter:grayscale(1) brightness(.62) contrast(.95)}
.pw-tile[data-exit="banished"] .pw-nm{color:rgba(200,196,182,.55);text-decoration:line-through}
/* MURDERED — taken in the dark. The frame bruises red, the face dims further. */
.pw-tile[data-exit="murdered"] .pw-frame{
  background:linear-gradient(150deg,#1d1113,#3a1519 46%,#6d2028 62%,#38151a 100%);
  color:rgba(230,170,168,.6);
}
.pw-tile[data-exit="murdered"] .cv-av img{filter:grayscale(.85) brightness(.5) sepia(.2) saturate(1.3)}
.pw-tile[data-exit="murdered"] .pw-nm{color:rgba(210,150,150,.7)}
/* HIGHLIGHT — the one being discussed. A warm ring, static. */
.pw-tile[data-hi="1"] .pw-frame{
  box-shadow:
    inset 0 0 0 1px rgba(255,236,190,.6),
    inset 0 0 6px rgba(0,0,0,.5),
    0 0 0 2px rgba(224,160,73,.9),
    0 0 18px rgba(224,160,73,.5),
    0 6px 16px rgba(0,0,0,.55);
}
`;
