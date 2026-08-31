// ══════════════════════════════════════════════════════════════════════
// vp-tr/suspicion.js — who believes what, and how wrong they are
// ══════════════════════════════════════════════════════════════════════
//
// THE SHOW'S CORE SYSTEM, ON SCREEN FOR THE FIRST TIME. Plans 1-4 built the
// entire deduction model — facts with a ground truth, per-person beliefs with a
// confidence and a valence, credibility tiers, decay, second-order knowledge,
// trust-gated propagation — and through nine tasks a viewer never saw one line
// of it. Task 1 drew a "what the castle believes" panel and it was DROPPED,
// because nothing in the export exposed per-Faithful suspicion and a panel that
// needs an export change to be truthful is a panel that is lying. The export
// carries it now (`traitorsBeliefSnapshot`, js/tr/export.js) and this screen is
// what it was extended for.
//
// ── THE SUBJECT IS THE GAP, NOT THE RANKING ───────────────────────────
//
// Spec §9.1 wants three layers renderable: what a given player knows, what the
// Faithfuls collectively believe, and what is TRUE. The audience holds all
// three at once and the distance between the last two is the entire format.
// So this screen is not a leaderboard of suspicion with a tick beside the right
// answer. It is built for the case that makes the format work — SOMEBODY
// CERTAIN AND WRONG — and every card is composed so the belief lands before the
// truth does, in that order, because that is the order the drama happens in.
//
// ── ITS PRIMITIVE IS THE RULE, AND THE WALL ON IT ─────────────────────
//
// Not a ring (the hall), a loom (the day), a rank (the gravel), a laid table
// (breakfast), a brass rack (the book), a chalked tally (the afternoon) or a
// sheet of terms (the offer): a graduated RULE, from nothing to certainty, with
// every living name pinned along it — and a WALL standing at 0.62.
//
// That wall is not decoration and it is not a threshold somebody chose for this
// screen. It is `ALIGNMENT_CRED_CEILING` in js/knowledge.js, the most an
// inference about who somebody IS can ever be worth in this format, and it is
// why the room can never be sure. Everything that has ever got past it got
// there by standing in a room with somebody: the turret on the first night, a
// recruit shown the turret, a cloak coming off at a banishment. There is no
// fourth way, ever. Drawing the ceiling as a physical barrier makes the single
// most important rule in the engine the most visible thing on the page.
//
// ── AND THE WHOLE SCREEN IS AN INSTRUMENT ─────────────────────────────
//
// The other eight screens are places. This one is not anywhere: it is the
// inside of the castle's head, so its objects are the objects of MEASUREMENT —
// a rule, a pair of dividers, a plumb line, a balance, a pin. The hero is two
// plumb lines side by side: one hangs dead true and one hangs off by exactly
// how wrong the room is tonight. Nothing else on the page has to explain what
// the screen is for.
//
// SHARED, as every screen in this directory shares it: the type system
// (Fraunces for display, IM Fell English for anything spoken or written,
// Cormorant Garamond for body), the NEUTRAL `_portrait()`, `_icon()` for the
// objects that must be the same drawing everywhere, the reveal machinery, the
// sticky stage, and TR_NAV_TOP / TR_STICKY_TOP for the nav offset — one
// constant, and this file does not add a twenty-fourth literal.
import { players } from '../core.js';
import { PORTRAIT_CSS, TR_NAV_TOP, TR_STICKY_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

// NO EXIT VERB HERE, for the reason selection.js gives: nobody leaves on this
// screen. It reports a state of mind, not a departure, and importing a word it
// never prints would be a field written and never read.

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── deterministic picking ─────────────────────────────────────────────
function _hash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function _pick(pool, key) {
  if (!pool || !pool.length) return '';
  return pool[_hash(key) % pool.length];
}
/**
 * The same pool, without saying the same thing twice on one screen.
 *
 * Task 6 found two Traitors arguing for the same victim in word-for-word the
 * same sentence, because `_pick` hashes a key into a pool and different keys
 * collide. This screen draws up to six names out of one pool in a row, which is
 * that shape exactly.
 */
function _pickUnique(pool, key, used) {
  if (!pool || !pool.length) return '';
  const start = _hash(key) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const line = pool[(start + i) % pool.length];
    if (!used.has(line)) { used.add(line); return line; }
  }
  return pool[start];
}
function _fill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null) ? subs[k] : m);
}

// SMALL COUNTS READ AS WORDS, because a room is described and not tabulated.
// Task 9 found nine hard-coded counts in one screen's prose — "the other
// seventeen", "three of them are lying already" — every one of which would be a
// sentence the screen simply made up on a season with a different cast size or
// a different number of Traitors. NO POOL IN THIS FILE MAY WRITE A COUNT AS A
// LITERAL: `{n}` is the lower-case slot and `{N}` the sentence-initial one.
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty'];
const _word = n => (n >= 0 && n < WORDS.length) ? WORDS[n] : String(n);
const _Word = n => { const w = _word(n); return w.charAt(0).toUpperCase() + w.slice(1); };
const _ord = n => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][n]
  || (n + 1) + 'th';
/** A plural that never has to be written twice. */
const _s = (n, one, many) => (Math.abs(Number(n)) === 1 ? one : (many || one + 's'));

// ── faces ─────────────────────────────────────────────────────────────
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
/** A face on this screen. NEUTRAL — there is no lamp in here. */
function _av(name, size) { return _portrait(_slugOf(name), name, size || 34); }
/** The first name, at the size a pin label runs at. Same trade as the rank. */
const _first = n => String(n || '').split(' ')[0];

// ══════════════════════════════════════════════════════════════════════
// ICONS — the instruments, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// `eye`, `seal`, `cloak`, `chevron`, `hourglass` and `quill` come from `_icon()`
// in conclave.js and are NOT redrawn — they are the same objects on every
// screen in this directory. These are the ones only a measurement needs, and
// there are six of them rather than sixteen: the artwork rule from the last two
// tasks is FEWER AND BETTER, and an icon that cannot be read at the 13px it
// actually runs at is a smudge whatever it looks like at 6x. Every one of these
// was rendered on a sheet at 1x and 6x and looked at, which is how Task 8
// caught an accidental ankh.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    // A GRADUATED STRAIGHT-EDGE. One long edge, ticks of two lengths — which is
    // the only thing that distinguishes a rule from a bar at this size.
    rule: '<path d="M2 8.6h20v6.8H2z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M6 8.6v4M10 8.6v2.6M14 8.6v4M18 8.6v2.6" stroke="' + c
      + '" stroke-width="1.1"/>',
    // A PAIR OF DIVIDERS, hinged at the top, stepping off a distance. Legs at a
    // real angle rather than a wide V, because a wide V is a letter.
    dividers: '<circle cx="12" cy="4.6" r="2" stroke="' + c + '" stroke-width="1.2"/>'
      + '<path d="M10.9 6.4 6.6 18.4M13.1 6.4 17.4 18.4" stroke="' + c
      + '" stroke-width="1.4"/>'
      // THE FEET, which is what makes a pair of dividers dividers: two points
      // set down on a line, a measured distance apart.
      + '<path d="M6.6 18.4 5.4 21.6M17.4 18.4l1.2 3.2" stroke="' + c
      + '" stroke-width="1.4" stroke-linecap="round"/>',
    // A PLUMB LINE: a cord from a fixed point and a bob at the bottom. The bob
    // is a cone on a stub, which is what a plumb bob actually is.
    plumb: '<path d="M5 3.4h14" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M12 3.4v11.8" stroke="' + c + '" stroke-width="1.1"/>'
      // A BOB IS A BARREL WITH A POINT ON IT and hangs from a shoulder, not a
      // diamond threaded onto a string.
      + '<path d="M10.2 15.2h3.6v2.9L12 21.8l-1.8-3.7z" fill="' + c + '" opacity=".92"/>',
    // A BALANCE, tipped. A level balance and a tipped one are different
    // statements and this screen only ever means the tipped one.
    balance: '<path d="M12 3.2v3.4" stroke="' + c + '" stroke-width="1.2"/>'
      + '<path d="M3.6 8.6 20.4 5.4" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M3.6 8.6 1.4 14h4.4zM20.4 5.4 18.2 10.8h4.4z" stroke="' + c
      + '" stroke-width="1.1"/>'
      + '<path d="M9.6 21.4h4.8" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M12 6.6v14.8" stroke="' + c + '" stroke-width="1.2"/>',
    // A PIN pushed into a board, seen from the side: a head, a shaft, a point.
    pin: '<path d="M12 21.4V13" stroke="' + c + '" stroke-width="1.2"/>'
      + '<path d="M7.4 12.2h9.2l-1.6-3.4V4.2H9v4.6z" fill="' + c + '" opacity=".9"/>',
    // THE WALL. A barrier with the hatching a section is drawn with — the one
    // shape on this screen that is allowed to look like a technical drawing,
    // because that is exactly what it is.
    wall: '<path d="M6.4 5h11.2v14.6H6.4z" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M6.4 12.4 13.8 5M6.4 19l11.2-11.2M10.6 19.6l7-7"'
      + ' stroke="' + c + '" stroke-width="1.1" opacity=".7"/>'
      + '<path d="M2 19.6h20" stroke="' + c + '" stroke-width="1.5"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE PLANES — cold, flat, and measured rather than furnished
// ══════════════════════════════════════════════════════════════════════
//
// THIS SCREEN IS NOT A PLACE, so it is not given a room. Every attempt to put
// one behind it produced somebody else's room: a wall with lancets is the
// castle day, a refectory is breakfast, a facade on a skyline is the selection.
// What is behind this screen instead is the SURFACE AN INSTRUMENT IS USED ON —
// a dark drawing board with a faint engraved grid, one cold light across it,
// and a slow drift of hatching. Three values, one colour family, nothing
// figurative except the arcs.
//
// THE PLANES COVER THE FULL PAGE HEIGHT, which is a live-measured invariant in
// this plan rather than a note: Task 5's endgame was rejected for "really black
// and empty" below the drawing, Task 8 found the same at 1500px on a 3,900px
// page, and Task 9 pinned it by reading the rendered stylesheet. `.sn-board`
// and `.sn-hatch` both run top:${TR_NAV_TOP} to bottom:0 with no height cap.

/**
 * The far plane: the protractor arcs.
 *
 * Two concentric arcs struck from a centre well off the top of the frame, with
 * graduations on the outer one — an instrument's face, enormous and faint. It
 * is the only figurative thing on any plane and it is drawn ONCE, because the
 * thing that makes generated SVG ugly is quantity.
 */
function _far() {
  const cx = 550, cy = -260;
  let ticks = '';
  for (let a = 34; a <= 146; a += 4) {
    const r = (a % 20 === 6) ? 1 : 0;
    const rad = a * Math.PI / 180;
    const r1 = 1020, r2 = 1020 - (r ? 34 : 16);
    ticks += '<path d="M' + (cx + Math.cos(rad) * r1).toFixed(1) + ' '
      + (cy + Math.sin(rad) * r1).toFixed(1) + 'L' + (cx + Math.cos(rad) * r2).toFixed(1)
      + ' ' + (cy + Math.sin(rad) * r2).toFixed(1) + '" stroke="#8ea6bb" stroke-width="'
      + (r ? 2.2 : 1.2) + '" opacity="' + (r ? '.34' : '.2') + '"/>';
  }
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><radialGradient id="snField" cx="50%" cy="6%" r="86%">'
    + '<stop offset="0%" stop-color="#2b3641"/><stop offset="58%" stop-color="#1a2027"/>'
    + '<stop offset="100%" stop-color="#0d1114"/></radialGradient></defs>'
    + '<rect width="1100" height="1500" fill="url(#snField)"/>'
    + '<circle cx="' + cx + '" cy="' + cy + '" r="1020" stroke="#8ea6bb"'
    + ' stroke-width="1.4" fill="none" opacity=".22"/>'
    + '<circle cx="' + cx + '" cy="' + cy + '" r="784" stroke="#8ea6bb"'
    + ' stroke-width="1.1" fill="none" opacity=".13"/>'
    + ticks
    + '</svg>';
}

/**
 * The mid plane: the light across the board, and the dust in it.
 *
 * One raking wash from the upper left and eighteen specks. Not two hundred —
 * the selection deleted 220 gravel circles for the same reason and the page was
 * better for it.
 */
function _mid(seed) {
  const rng = _fieldRng('sn|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="snRake" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0%" stop-color="#bcd2e4" stop-opacity=".13"/>'
    + '<stop offset="46%" stop-color="#bcd2e4" stop-opacity=".04"/>'
    + '<stop offset="100%" stop-color="#bcd2e4" stop-opacity="0"/>'
    + '</linearGradient></defs>'
    + '<rect width="1100" height="1500" fill="url(#snRake)"/>';
  s += '<g class="sn-specks">';
  for (let i = 0; i < 18; i++) {
    s += '<circle cx="' + (40 + rng() * 1020).toFixed(0) + '" cy="'
      + (60 + rng() * 1380).toFixed(0) + '" r="' + (0.9 + rng() * 1.5).toFixed(1)
      + '" fill="#d6e4ef" opacity="' + (0.1 + rng() * 0.22).toFixed(2) + '"/>';
  }
  return s + '</g></svg>';
}

/** The fore plane: a soft dark edge, which is what a lamp on a board leaves. */
function _fore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="snEdgeL" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0%" stop-color="#070a0c" stop-opacity=".95"/>'
    + '<stop offset="100%" stop-color="#070a0c" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="snEdgeR" x1="1" y1="0" x2="0" y2="0">'
    + '<stop offset="0%" stop-color="#070a0c" stop-opacity=".95"/>'
    + '<stop offset="100%" stop-color="#070a0c" stop-opacity="0"/></linearGradient>'
    + '</defs>'
    + '<rect x="0" y="0" width="228" height="1500" fill="url(#snEdgeL)"/>'
    + '<rect x="872" y="0" width="228" height="1500" fill="url(#snEdgeR)"/>'
    + '</svg>';
}

/**
 * THE HERO: two plumb lines, and the gap between their bobs.
 *
 * One hangs dead true. The other hangs off by exactly how wrong the room is
 * tonight — `err` is 0 when every ounce of the castle's suspicion is aimed at
 * somebody who really is a Traitor and 1 when none of it is. Nothing else on
 * this screen has to say what it is about.
 *
 * DRAWN AS A REAL PLUMB LINE and not as two diagonals: a beam, a fixed point,
 * a cord that hangs from it, and a bob that is a cone on a stub. The skew is
 * applied at the bob rather than at the beam, so the cord stays straight and
 * taut, which is the one thing a plumb line must never stop looking like.
 */
function _heroScene(err) {
  const e = Math.max(0, Math.min(1, Number(err) || 0));
  const beamY = 248, bobY = 372;
  const trueX = 508, beliefTop = 592;
  const drift = 66 * e;                       // dead true at 0, a hand's width at 1
  const beliefX = beliefTop + drift;
  const cord = (x0, x1, cls) => '<path class="' + cls + '" d="M' + x0 + ' ' + beamY
    + 'L' + x1.toFixed(1) + ' ' + bobY + '" stroke="#cfe0ee" stroke-width="1.5"'
    + ' opacity=".8"/>';
  // A REAL BOB: a short barrel with a cone on the bottom of it, not an arrow.
  const bob = (x, fill, cls) => '<g class="' + cls + '">'
    + '<path d="M' + (x - 7).toFixed(1) + ' ' + (bobY - 11) + 'h14v11l-7 13-7-13z"'
    + ' fill="' + fill + '"/>'
    + '<path d="M' + (x - 7).toFixed(1) + ' ' + (bobY - 11) + 'h14" stroke="#0b0f12"'
    + ' stroke-width="1" opacity=".5"/></g>';
  const gapY = bobY + 30;
  return '<svg class="sn-hero-scene" viewBox="0 0 1100 440"'
    + ' preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="snHeroBg" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#1d262e"/><stop offset="62%" stop-color="#131a20"/>'
    + '<stop offset="100%" stop-color="#0b0f12"/></linearGradient></defs>'
    + '<rect width="1100" height="440" fill="url(#snHeroBg)"/>'
    // the beam the two lines hang from, and the two fixed points on it
    + '<path d="M452 ' + beamY + 'h196" stroke="#7f93a4" stroke-width="3"/>'
    + '<circle cx="' + trueX + '" cy="' + beamY + '" r="3.4" fill="#cfe0ee"/>'
    + '<circle cx="' + beliefTop + '" cy="' + beamY + '" r="3.4" fill="#cfe0ee"/>'
    // the true line, and a dashed vertical through it so the eye has a datum
    + '<path d="M' + trueX + ' ' + beamY + 'V' + (bobY + 40) + '" stroke="#4c5f6e"'
    + ' stroke-width="1" stroke-dasharray="3 7" opacity=".75"/>'
    + cord(trueX, trueX, 'sn-cord-true')
    + bob(trueX, '#e6f0f8', 'sn-bob-true')
    // the believed line, off by the room's error
    + '<path d="M' + beliefTop + ' ' + beamY + 'V' + (bobY + 40) + '" stroke="#4c5f6e"'
    + ' stroke-width="1" stroke-dasharray="3 7" opacity=".4"/>'
    + cord(beliefTop, beliefX, 'sn-cord-off')
    + bob(beliefX, '#d8a34a', 'sn-bob-off')
    // the gap, measured, between where the line hangs and where true is
    + (drift > 6
      ? '<path d="M' + beliefTop + ' ' + gapY + 'H' + beliefX.toFixed(1)
        + '" stroke="#d8a34a" stroke-width="1.2" opacity=".85"/>'
        + '<path d="M' + beliefTop + ' ' + (gapY - 5) + 'v10M' + beliefX.toFixed(1)
        + ' ' + (gapY - 5) + 'v10" stroke="#d8a34a" stroke-width="1.2" opacity=".85"/>'
      : '')
    + '</svg>';
}

function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    + '<filter id="snGrain"><feTurbulence type="fractalNoise" baseFrequency="0.86"'
    + ' numOctaves="4" seed="41"/></filter></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE STYLESHEET
// ══════════════════════════════════════════════════════════════════════
// NO BACKTICKS ANYWHERE IN HERE, INCLUDING IN COMMENTS: this is a template
// literal and one of them ends the stylesheet mid-rule (Task 2's finding).
const SN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.sn-root{
  --sn-slate:#151c22;
  --sn-slate-deep:#0a0e11;
  --sn-steel:#8ea6bb;
  --sn-ink:#e8eef4;
  --sn-quiet:#93a3b0;
  --sn-brass:#d8a34a;
  --sn-wrong:#c8503f;
  --sn-right:#6fae86;
  --sn-line:rgba(142,166,187,.24);
  --sn-display:'Fraunces',Georgia,'Times New Roman',serif;
  --sn-hand:'IM Fell English',Georgia,serif;
  --sn-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--sn-ink);
  font-family:var(--sn-body);
  font-size:17px;line-height:1.62;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#080b0e;
}
.sn-root *{box-sizing:border-box}

.sn-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--sn-slate);
  box-shadow:0 0 0 1px rgba(232,238,244,.08),0 0 90px rgba(0,0,0,.9);
  overflow:visible;
  transition:background 2.2s ease;
}
/* The clip layer takes NO z-index — measured on the conclave: a shell that
   clips is a scroll container and kills sticky for every descendant, and a
   z-index here makes this a stacking context and re-grades every blend. */
.sn-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

/* THE BOARD RUNS THE WHOLE PAGE. Both full-height layers are top:nav to
   bottom:0 with no height cap — the invariant Tasks 5, 8 and 9 each paid for
   separately. */
.sn-board{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;
  pointer-events:none;
  background:
    linear-gradient(180deg,rgba(20,27,33,0) 0,rgba(9,12,15,.86) 100%),
    repeating-linear-gradient(0deg,rgba(142,166,187,.055) 0 1px,transparent 1px 46px),
    repeating-linear-gradient(90deg,rgba(142,166,187,.04) 0 1px,transparent 1px 46px),
    #101519;
}
/* THE DRIFT OF HATCHING. One pitch only: the castle day had twenty-two ruled
   course lines over a stone texture already drawing courses at a different
   pitch, and two hairline grids on top of each other is moire. The engraved
   grid above is 46px square and this is a 9px diagonal, which is far enough
   apart to read as two materials rather than as interference. */
.sn-hatch{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;
  pointer-events:none;opacity:.4;
  background:repeating-linear-gradient(58deg,rgba(190,214,232,.05) 0 1px,transparent 1px 9px);
  animation:snDrift 46s linear infinite;
}
@keyframes snDrift{from{background-position:0 0}to{background-position:220px 0}}

.sn-far,.sn-mid,.sn-fore{position:absolute;left:0;right:0;top:0;height:2100px;z-index:0}
.sn-far{opacity:.9}
.sn-mid{opacity:.85;mix-blend-mode:screen}
.sn-fore{opacity:.95}
.sn-far svg,.sn-mid svg,.sn-fore svg{width:100%;height:100%;display:block}
.sn-far::after,.sn-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:420px;
  background:linear-gradient(180deg,rgba(16,21,25,0) 0,#101519 100%);
}
.sn-specks circle{animation:snFloat 22s ease-in-out infinite alternate}
@keyframes snFloat{from{transform:translateY(0)}to{transform:translateY(-14px)}}

.sn-vig{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(ellipse at 50% 30%,rgba(0,0,0,0) 34%,rgba(0,0,0,.72) 100%)}
.sn-grain{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.3;
  background-image:var(--sn-grain-src);background-size:220px 220px;mix-blend-mode:overlay}

/* PHASE. Not a palette switch: the light gets colder as the screen goes from
   what is believed to what is so. */
.sn-shell[data-phase="open"]{background:#161d24}
.sn-shell[data-phase="castle"]{background:#141b21}
.sn-shell[data-phase="reads"]{background:#171c20}
.sn-shell[data-phase="wall"]{background:#101820}
.sn-shell[data-phase="gap"]{background:#0d1317}

.sn-body{position:relative;z-index:2}

/* ═══ THE HERO ═══════════════════════════════════════════════════════ */
.sn-hero{position:relative;height:440px;overflow:hidden;
  border-bottom:1px solid var(--sn-line)}
.sn-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.sn-cord-off,.sn-bob-off{animation:snSway 9s ease-in-out infinite alternate;
  transform-box:fill-box;transform-origin:50% 0}
@keyframes snSway{from{transform:rotate(-.7deg)}to{transform:rotate(.7deg)}}
.sn-hero-lock{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:flex-start;text-align:center;padding:34px 40px 0;
  background:radial-gradient(ellipse at 50% 54%,rgba(8,11,14,.72) 0,rgba(8,11,14,.34) 62%,rgba(8,11,14,.8) 100%)}
.sn-eyebrow{font-family:var(--sn-hand);font-size:14px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--sn-steel);opacity:.9}
.sn-title{font-family:var(--sn-display);font-weight:900;font-size:58px;
  letter-spacing:.05em;margin:8px 0 0;line-height:1;
  text-shadow:0 2px 30px rgba(0,0,0,.85)}
.sn-title-rule{display:flex;align-items:center;gap:16px;margin:14px 0 12px;width:min(560px,80%)}
.sn-title-rule i{flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--sn-steel),transparent)}
.sn-sub{max-width:760px;font-size:19px;color:#cfd9e2;margin:0}

/* ═══ THE HEAD ═══════════════════════════════════════════════════════ */
.sn-head{padding:16px 45px 0}
.sn-observer{display:flex;align-items:center;gap:8px;font-family:var(--sn-hand);
  font-size:14.5px;letter-spacing:.05em;color:var(--sn-steel);
  border:1px solid var(--sn-line);border-left:3px solid var(--sn-brass);
  padding:9px 14px;background:rgba(10,14,17,.6)}
.sn-observer[data-layer="player"]{border-left-color:var(--sn-steel)}
.sn-observer em{font-style:italic;opacity:.85;font-family:var(--sn-body);font-size:16px}

/* ═══ THE RULE — the sticky stage ════════════════════════════════════
   Opaque. Task 3 found a translucent band letting a card's sentence read
   through its heading, and Task 9 found it again on the rank. */
.sn-stage{position:sticky;top:${TR_STICKY_TOP};z-index:6;margin:14px 45px 0;
  background:linear-gradient(180deg,#0d1317 0,#10181e 100%);
  border:1px solid var(--sn-line);box-shadow:0 14px 34px rgba(0,0,0,.6)}
.sn-rule-h{display:flex;justify-content:space-between;align-items:center;
  padding:8px 14px;border-bottom:1px solid var(--sn-line);
  font-family:var(--sn-hand);font-size:13px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--sn-steel)}
.sn-rule-h b{font-family:var(--sn-display);font-weight:700;letter-spacing:.1em;
  color:var(--sn-ink)}
.sn-rule-body{position:relative;height:142px;padding:0 22px}
/* the rule itself */
.sn-rule-bar{position:absolute;left:22px;right:22px;top:88px;height:12px;
  border:1px solid rgba(142,166,187,.5);
  background:linear-gradient(180deg,rgba(142,166,187,.16),rgba(142,166,187,.04))}
.sn-tick{position:absolute;top:88px;width:1px;height:12px;background:rgba(142,166,187,.5)}
.sn-tick[data-major="1"]{height:20px;background:rgba(200,220,236,.7)}
.sn-tick-l{position:absolute;top:110px;transform:translateX(-50%);
  font-family:var(--sn-hand);font-size:11px;color:var(--sn-quiet);white-space:nowrap}
/* THE WALL, and it is the point of the whole stage */
.sn-wall{position:absolute;top:34px;height:66px;width:8px;
  background:repeating-linear-gradient(48deg,rgba(216,163,74,.85) 0 2px,rgba(216,163,74,.25) 2px 5px);
  border-left:1px solid var(--sn-brass);border-right:1px solid var(--sn-brass)}
.sn-wall-l{position:absolute;top:16px;transform:translateX(-50%);font-family:var(--sn-hand);
  font-size:11px;letter-spacing:.1em;color:var(--sn-brass);white-space:nowrap}
/* a pin on the rule */
.sn-pin{position:absolute;transform:translateX(-50%);text-align:center;width:74px}
.sn-pin i{display:block;width:1px;margin:0 auto;background:var(--sn-steel)}
.sn-pin s{display:block;width:9px;height:9px;margin:1px auto 0;border-radius:50%;
  text-decoration:none;border:1.5px solid var(--sn-steel);background:transparent}
.sn-pin[data-truth="traitor"] s{background:var(--sn-brass);border-color:var(--sn-brass)}
.sn-pin[data-truth="faithful"] s{background:transparent;border-color:#9fb4c6}
.sn-pin[data-certain="1"] i{background:var(--sn-brass)}
.sn-pin b{display:block;font-family:var(--sn-hand);font-size:11.5px;font-weight:400;
  line-height:14px;color:var(--sn-ink);white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.sn-rule-foot{display:flex;gap:18px;flex-wrap:wrap;padding:7px 14px;
  border-top:1px solid var(--sn-line);font-family:var(--sn-hand);font-size:12.5px;
  color:var(--sn-quiet)}
.sn-rule-foot b{color:var(--sn-ink);font-family:var(--sn-display);font-weight:700}
.sn-rule-foot span[data-tone="brass"] b{color:var(--sn-brass)}

/* ═══ THE STREAM ═════════════════════════════════════════════════════ */
.sn-main{padding:22px 45px 40px;display:flex;flex-direction:column;gap:20px}
.sn-beat{opacity:0;transform:translateY(14px);
  transition:opacity .6s ease,transform .6s ease;pointer-events:none}
.sn-beat.sn-vis{opacity:1;transform:none;pointer-events:auto}

.sn-card{border:1px solid var(--sn-line);background:rgba(11,15,19,.82);
  padding:18px 20px 20px;position:relative}
.sn-card[data-tone="wrong"]{border-left:3px solid var(--sn-wrong)}
.sn-card[data-tone="right"]{border-left:3px solid var(--sn-right)}
.sn-card[data-tone="brass"]{border-left:3px solid var(--sn-brass)}
.sn-card[data-tone="quiet"]{border-left:3px solid var(--sn-steel)}
.sn-label{display:flex;align-items:center;gap:7px;font-family:var(--sn-hand);
  font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--sn-steel)}
.sn-h{font-family:var(--sn-display);font-weight:700;font-size:26px;margin:6px 0 10px;
  letter-spacing:.01em}
.sn-card p{margin:0 0 10px}
.sn-card p:last-child{margin-bottom:0}
.sn-said{font-family:var(--sn-hand);font-style:italic;color:#d5e0ea}

/* a name being weighed: the face, the reading, and what is so */
.sn-weigh{display:flex;gap:16px;align-items:flex-start;margin:2px 0 12px}
.sn-weigh-who{display:flex;align-items:center;gap:11px;min-width:210px}
.sn-weigh-nm{font-family:var(--sn-display);font-weight:700;font-size:21px}
.sn-weigh-meta{font-family:var(--sn-hand);font-size:12.5px;color:var(--sn-quiet);
  letter-spacing:.06em}
.sn-meter{flex:1;position:relative;height:52px;margin-top:6px}
.sn-meter-bar{position:absolute;left:0;right:0;top:13px;height:8px;
  border:1px solid rgba(142,166,187,.35);background:rgba(142,166,187,.07)}
.sn-meter-fill{position:absolute;left:1px;top:14px;height:6px;background:var(--sn-steel)}
.sn-meter[data-truth="traitor"] .sn-meter-fill{background:var(--sn-brass)}
.sn-meter-wall{position:absolute;top:6px;height:22px;width:6px;
  background:repeating-linear-gradient(48deg,rgba(216,163,74,.8) 0 2px,rgba(216,163,74,.2) 2px 5px)}
.sn-meter-n{position:absolute;right:0;top:-6px;font-family:var(--sn-display);
  font-weight:700;font-size:15px;color:var(--sn-ink)}
.sn-meter-capt{position:absolute;left:0;top:26px;font-family:var(--sn-hand);
  font-size:12px;color:var(--sn-quiet)}

/* the verdict strip that closes a weighing */
.sn-verdict{display:flex;align-items:center;gap:10px;margin-top:10px;padding:9px 12px;
  border:1px dashed var(--sn-line);font-family:var(--sn-hand);font-size:15px}
.sn-verdict[data-truth="traitor"]{border-color:rgba(216,163,74,.5);color:#f0d9a8}
.sn-verdict[data-truth="faithful"]{border-color:rgba(200,80,63,.45);color:#f0bdb4}

/* a single person's read, as rows */
.sn-rows{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.sn-row{display:grid;grid-template-columns:34px 1fr auto;gap:11px;align-items:center;
  padding:8px 11px;border:1px solid var(--sn-line);background:rgba(16,22,27,.7)}
.sn-row-nm{font-family:var(--sn-display);font-weight:600;font-size:17px}
.sn-row-why{font-family:var(--sn-hand);font-size:13.5px;color:var(--sn-quiet);
  font-style:italic}
.sn-row-n{font-family:var(--sn-display);font-weight:700;font-size:16px;text-align:right}
.sn-row[data-dismissed="1"]{opacity:.62}
.sn-row[data-dismissed="1"] .sn-row-n{color:var(--sn-quiet)}
.sn-tier{display:inline-block;margin-left:8px;font-family:var(--sn-hand);font-size:11.5px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--sn-steel);
  border:1px solid var(--sn-line);padding:0 6px}
.sn-tier[data-t="public"]{color:var(--sn-brass);border-color:rgba(216,163,74,.5)}

.sn-sums{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.sn-sum{display:flex;align-items:baseline;gap:7px;border:1px solid var(--sn-line);
  padding:6px 11px;background:rgba(10,14,17,.6)}
.sn-sum-k{font-family:var(--sn-hand);font-size:12px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--sn-quiet)}
.sn-sum-v{font-family:var(--sn-display);font-weight:700;font-size:19px}
.sn-sum-v[data-tone="brass"]{color:var(--sn-brass)}
.sn-sum-v[data-tone="wrong"]{color:var(--sn-wrong)}

/* the notice a layer with nothing to show gets, instead of an empty page */
.sn-veil{text-align:center;padding:74px 30px;color:var(--sn-quiet)}
.sn-veil-h{font-family:var(--sn-display);font-weight:700;font-size:27px;
  color:var(--sn-ink);margin:14px 0 8px}

/* ═══ THE CONTROLS ═══════════════════════════════════════════════════ */
.sn-controls{position:fixed;bottom:0;left:0;right:0;z-index:40;
  display:flex;align-items:center;justify-content:center;gap:16px;
  padding:11px;background:rgba(8,11,14,.96);
  border-top:1px solid var(--sn-line)}
.sn-btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;
  font-family:var(--sn-hand);font-size:15px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--sn-ink);background:rgba(142,166,187,.1);
  border:1px solid var(--sn-line);padding:8px 18px;transition:opacity .3s ease}
.sn-btn:hover{background:rgba(142,166,187,.2)}
.sn-btn.sn-dim{opacity:.34;pointer-events:none}
.sn-counter{font-family:var(--sn-display);font-weight:700;font-size:15px;
  color:var(--sn-steel)}

@media(prefers-reduced-motion:reduce){
  .sn-hatch,.sn-specks circle,.sn-cord-off,.sn-bob-off{animation:none!important}
  .sn-beat{transition:none!important;opacity:1;transform:none}
  .sn-beat:not(.sn-vis){opacity:0}
}
@media(max-width:900px){
  .sn-head,.sn-main{padding-left:22px;padding-right:22px}
  .sn-stage{margin-left:22px;margin-right:22px}
  .sn-title{font-size:42px}
  .sn-weigh{flex-direction:column}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════
//
// FOUR VARIANTS MINIMUM PER SHAPE, and none of them writes a count, a cast
// size or a number of Traitors as a literal. `{n}` / `{N}` are the slots.

const OPENING = [
  'Nobody in this castle can see inside anybody else. What follows is what '
  + '{whoN} {has} decided anyway.',
  'None of this was said out loud. It is what {whoN} {are} carrying around, and '
  + 'it is what the next table will be decided on.',
  'The room has had another day to think. This is where the thinking has got to.',
  'Every read below was built out of a vote, a silence or a rumour. Not one of '
  + 'them was built out of proof.',
];

const WALL_RULE = [
  'A guess in this castle tops out at {pct}. Past that line there is only one '
  + 'kind of knowledge and it is not deduction — it is having been in the room.',
  'Nothing anybody works out can be worth more than {pct}. Certainty here is a '
  + 'place you stood, not a conclusion you reached.',
  'The wall on the rule is at {pct}, and no amount of evidence walks through '
  + 'it. Everything on the far side got there by looking somebody in the face.',
  'You may reason your way to {pct} and no further. The rest is a room, a lamp '
  + 'and somebody telling you what they are.',
];

// A name the castle has settled on. The belief lands first; the truth comes
// after it, in its own strip.
const WEIGH = [
  '{N} of them have written {who} down, and the strongest of those reads is '
  + 'the one that will do the damage.',
  '{who} has {n} {acc} now. None of them has anything you could call proof, '
  + 'and that has never once mattered at a table.',
  'The name that keeps coming back is {who}. {N} {have} it, and the pattern '
  + 'they are describing is real whether or not it means what they think.',
  '{who} is being read by {n} of them. What each of them has is thin; what all '
  + 'of them have together is a majority.',
];
const WEIGH_ONE = [
  '{who2} is the only one carrying {who}, and carrying a name alone is how '
  + 'people end up carrying it out of the door.',
  'One read against {who}, and it is {who2} holding it. {who2} may be the only '
  + 'one looking in the right place, or the only one looking in the wrong one.',
  'It is {who2} and nobody else on {who}. A room does not banish on one voice, '
  + 'but one voice is how every banishment starts.',
  'Just {who2}, so far, on {who}. Whether that stays a private opinion depends '
  + 'entirely on how loud {who2} is prepared to be about it.',
];
// A NAME THAT IS ON THE BOARD AND NOBODY KEPT. `suspicion()` returns 0 for a
// belief its holder correctly saw through, so a name can be raised, heard by
// several people and dismissed by every one of them -- and the first draft of
// this screen printed "no of them have written Alejandro down", which is the
// singular/plural trap from Task 9 with a zero in it. Found by dumping a season
// and reading it, like every prose defect in ten plans.
const WEIGH_NONE = [
  '{who} is on the board only because somebody said the name out loud. '
  + 'Everybody who heard it put it straight back down.',
  'Nobody is carrying {who}. The name has been raised and cleared every time it '
  + 'has come up.',
  '{who} has been considered and set aside: {n} of them heard the case and not '
  + 'one of them kept it.',
  'The room looked at {who} and looked away again. Not a single read survived '
  + 'the hearing.',
];
// The truth strip. Never the same sentence for a Traitor and a Faithful, and
// never a scoreline: the audience is not being told whether the room won.
const TRUE_HIT = [
  'And they are right. {who} is one of them, and has been since {since}.',
  'They are right, and they do not know they are right. {who} really is a '
  + 'Traitor.',
  'The read is good. {who} is exactly what the room has decided they are.',
  'This one lands. Whatever the reasoning was worth, the name is correct.',
];
const TRUE_MISS = [
  'And they are wrong. {who} is a Faithful and has never been anything else.',
  'They are wrong, and there is nothing in the castle that will tell them so. '
  + '{who} is a Faithful.',
  'The read is bad. {who} has done nothing but be in the wrong place in a '
  + 'ballot record.',
  'Nothing here is true. {who} is a Faithful, and the case against them was '
  + 'built out of nothing that ever happened.',
];
// A recruited Traitor: the read may have been formed before the flip.
const TRUE_FLIP = [
  'And they are right now. {who} was a Faithful when most of this was written '
  + 'down, and took the cloak on day {day}.',
  'Right, but late. Whoever formed this read before day {day} formed it about '
  + 'somebody who had not yet said yes.',
  'True tonight. It was not true when the first of these reads was made, which '
  + 'is the thing a castle can never keep track of.',
  'The name is correct and the reasoning is not — {who} became one of them '
  + 'after the pattern the room is pointing at.',
];

const DROPPED_HIT = [
  'And they have just talked themselves out of the only name that mattered. '
  + '{who} is a Traitor.',
  'They let it go, and they were holding it. {who} is a Traitor and the room '
  + 'has handed the name back.',
  'The one they dropped is the one they wanted. {who} is a Traitor.',
  'Every person who heard it decided against it, and every one of them was '
  + 'wrong to. {who} is a Traitor.',
];
const DROPPED_MISS = [
  'And they were right to drop it. {who} is a Faithful, and the room has done '
  + 'the rarest thing this format allows: nothing, correctly.',
  'They put it down and it deserved to be put down. {who} is a Faithful.',
  'Nothing came of it and nothing should have. {who} is a Faithful.',
  'The name went nowhere, which is exactly where it belonged: {who} is a '
  + 'Faithful.',
];
// SHORT AND NEUTRAL, because the card is already labelled "Inside one head" and
// a lead that repeats its own label reads as a stutter. The first draft had the
// whole sentence AS the label, in small caps at twelve pixels, which is
// furniture wearing a paragraph.
const READ_LEAD = [
  'What {who} is actually holding, and where it came from.',
  'One page, and it belongs to {who}.',
  'Everything {who} would be able to say at a table tonight.',
  'The room from where {who} is standing.',
];
// THE REASON IS PRESENTED, NEVER GRAMMATICALLY SWALLOWED. `learn()`'s `source`
// is sometimes a noun ("the turret") and sometimes a whole clause ("kept Beardo
// in on the night Beardo was revealed"), so every template that read "on {why}"
// produced "on kept Beardo in on the night Beardo was revealed". Found by
// reading the dump.
const READ_TOP = [
  '{who} would write {t} down tonight. The note beside it: {why}.',
  'Ask {who} for a name and it is {t}. What it is built on: {why}.',
  '{who} has settled on {t}, on the strength of one thing: {why}.',
  'Top of the list, for {who}: {t}. The reason, in full: {why}.',
];
// THE SAME SENTENCES IN THE SECOND PERSON, because a template with a name in it
// produces "You has settled on Beardo" the moment the name is "You". The player
// layer had four of those and an "Ask You for a name"; they are its own pools
// now rather than a substitution nothing can make agree.
const MINE_TOP = [
  'You would write {t} down tonight. The note beside it: {why}.',
  'Ask you for a name and it is {t}. What it is built on: {why}.',
  'You have settled on {t}, on the strength of one thing: {why}.',
  'Top of your list: {t}. The reason, in full: {why}.',
];
const MINE_DISMISSED = [
  'You looked at {t} and put the thought down again.',
  '{t} came up and you did not believe a word of it.',
  'A name you have already considered and cleared: {t}.',
  'You have heard the case against {t} and you do not buy it.',
];
// A BOARD WITH NOTHING KEPT ON IT IS NOT AN EMPTY BOARD. `suspicion()` returns
// 0 for a belief its holder saw through, so somebody can have heard three names
// and kept none -- and the empty-list pool said "carrying no read whatsoever"
// directly above the rows of names they had considered.
const READ_DROPPED = [
  '{who} has heard names and kept none of them. Everything below was raised, '
  + 'weighed and put down again.',
  'Nothing on {who}\u2019s page survived the hearing. The names are there; the '
  + 'belief is not.',
  '{who} has considered every one of these and believes none of them, which is '
  + 'either the sharpest read in the castle or the emptiest.',
  'All of it dismissed. {who} will go to the table with a list of people they '
  + 'have already decided against suspecting.',
];
const READ_EMPTY = [
  '{who} has nothing. Not a suspicion worth the name — {sub} has been in the '
  + 'same rooms as everybody else and come out of them with an empty page.',
  'Nothing at all. {who} could not put a name to anybody tonight if the table '
  + 'demanded one, which it will.',
  '{who} is carrying no read whatsoever, which in this castle is not the same '
  + 'as being careful.',
  'An empty list. {who} will be voting on somebody else’s reasoning.',
];

const WALL_LEAD = [
  'Everything past the wall',
  'The far side of the rule',
  'What certainty looks like here',
  'The only knowledge in the building',
];
const WALL_PACT = [
  '{N} {mark} past the line, and every one of them is a Traitor looking at '
  + 'another Traitor. Nobody else in the castle is on that side of the wall and '
  + 'nobody else ever will be.',
  'The far side of the rule is not empty, and it never holds a Faithful: {n} '
  + '{mark}, every one of them the pact recognising itself.',
  'Past the wall: {n} {mark}. Not deductions. People who have stood in a room '
  + 'together and know exactly what they saw.',
  'The wall holds against everyone except the people it was never keeping out '
  + '— {n} {mark}, every one of them inside the pact.',
];
const WALL_EMPTY = [
  'Nothing is past the wall tonight. Every read in the castle is a guess, and '
  + 'the guesses are all that is left.',
  'The far side of the rule is empty. Nobody living knows anything about '
  + 'anybody, which is the state this format is designed to hold people in.',
  'Not one mark past the line. Whatever anybody says at the table, they are '
  + 'saying it on a feeling.',
  'The wall stands with nothing behind it. Certainty has left the castle by the '
  + 'usual door.',
];

const GAP_LEAD = [
  'What it costs to be sure',
  'The two lines, and the distance between them',
  'How wrong the room is, in one measurement',
  'What the castle believes, against what is so',
];
const GAP_BAD = [
  'Most of the weight in that room is on the wrong people. The room is not '
  + 'failing to think — it is thinking hard, in the wrong direction, which '
  + 'is a far more useful thing to be doing if you are a Traitor.',
  'The bulk of the suspicion is aimed at Faithfuls. Every ounce of it is work '
  + 'somebody did, and every ounce of it is doing the pact’s job for it.',
  'The room has built a story and the story is about the wrong people. It will '
  + 'take a body to shake it, and the body will be one of theirs.',
  'Almost none of this is landing. The castle is arguing about people who have '
  + 'nothing to hide, which is the position the pact spends every night trying '
  + 'to put it in.',
];
const GAP_GOOD = [
  'Most of the weight is on the right people, and the pact should be frightened '
  + 'of that. A room that is reasoning well does not need to be right about '
  + 'everybody — only about whoever it names next.',
  'The room is close. The reasoning is thin and the conclusion is largely '
  + 'correct, which is how this format tends to end when it ends badly for the '
  + 'Traitors.',
  'More of this suspicion is aimed at Traitors than at anybody else. Nobody in '
  + 'the castle knows that, but the next table will act as though somebody did.',
  'The castle has got hold of the right end of it. Not by proof — there is '
  + 'none — but by enough people privately arriving at the same name.',
];
const GAP_SPLIT = [
  'It is split. Some of the weight is on the right people and about as much is '
  + 'not, and a table that divides like that banishes whoever is worst at being '
  + 'looked at.',
  'Half right. Which, at a table where the majority decides, is indistinguishable '
  + 'from wrong until the cloak comes off.',
  'The room is pulling in two directions at once. That is not indecision; it is '
  + 'two different stories with about the same amount of evidence behind them, '
  + 'which is to say almost none.',
  'Evenly wrong and evenly right. The name that leaves will be decided by '
  + 'something other than the reasoning above.',
];
const QUIET_ONE = [
  'The Traitor the room is looking at least hard is {who}, with {n} {acc}.',
  'Meanwhile {who} — also a Traitor — has attracted {n} {acc}, and the '
  + 'room has bigger names to argue about.',
  '{who} is a Traitor carrying {n} {acc}, which is the lightest load any of '
  + 'them has to answer tonight.',
  'Least looked at of any of them: {who}, a Traitor with {n} {acc}.',
];
const QUIET_NONE = [
  'And {who} has not been named by anybody at all. Not a read, not a rumour, '
  + 'not one page with that name on it.',
  '{who} is a Traitor and is not on a single list in the building.',
  'Nobody has written {who} down. Not once, not by anyone, on any night.',
  'The castle has never once looked at {who}, who has been a Traitor the whole '
  + 'time.',
];

const MINE_LEAD = [
  'What you have, and it is all you have.',
  'Your own list, in the order it weighs.',
  'Everything you are carrying into the next table.',
  'The room, from where you are standing.',
];
const MINE_CLOSE = [
  'None of that is knowledge. You may be reading the room better than anybody '
  + 'in it and you will not find out until somebody’s cloak comes off.',
  'That is the whole of your case, and there is no way to test any of it before '
  + 'you have to vote on it.',
  'You cannot get past the wall. Nobody can, from where you are, and the people '
  + 'who are past it are not going to tell you.',
  'This is what you take to the table: an opinion, held firmly, about people '
  + 'who have never once told you the truth.',
];
const MINE_CLOSE_SURE = [
  'And past the wall, the part you are not guessing about. You have stood in a '
  + 'room with them, which is the only way anybody in this castle knows '
  + 'anything.',
  'The names past the wall you do not have to think about. Everything on this '
  + 'side of it you do.',
  'You are one of the few people in the building who is certain of anything, '
  + 'and being certain is exactly what you must never let show.',
  'What you know, you know for the same reason everybody who knows anything '
  + 'here knows it: you were in the room.',
];

// ══════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

const _pct = v => Math.round(Math.max(0, Math.min(1, Number(v) || 0)) * 100);
/** Where a 0..1 reading sits along the rule, as a percentage of its length. */
const _at = v => Math.max(0, Math.min(100, (Number(v) || 0) * 100));

function _card(title, label, ic, inner, tone) {
  return '<div class="sn-card"' + (tone ? ' data-tone="' + tone + '"' : '') + '>'
    + '<div class="sn-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="sn-h">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _sums(bits) {
  return '<div class="sn-sums">' + bits.map(b =>
    '<span class="sn-sum"><span class="sn-sum-k">' + _esc(b[0]) + '</span>'
    + '<span class="sn-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>'
    + b[1] + '</span></span>').join('') + '</div>';
}
/** The tier a belief arrived on, in the tier's own word. */
function _tier(t) {
  return '<span class="sn-tier" data-t="' + _esc(t || 'none') + '">'
    + _esc(t || 'none') + '</span>';
}

/**
 * ONE NAME BEING WEIGHED — the face, the strongest single read against them,
 * and the wall drawn in the same measure so the number has something to mean.
 *
 * `truth` is passed as null on a player layer and the meter simply has no
 * colour then. It is not a styling branch: it is the ground-truth gate, and it
 * lives here rather than at the call site so a later edit to this card cannot
 * reintroduce it.
 */
function _weigh(name, top, ceiling, truth, meta, capt) {
  const w = _at(top), wall = _at(ceiling);
  return '<div class="sn-weigh">'
    + '<div class="sn-weigh-who">' + _av(name, 40)
    + '<div><div class="sn-weigh-nm">' + _esc(name) + '</div>'
    + '<div class="sn-weigh-meta">' + _esc(meta || '') + '</div></div></div>'
    + '<div class="sn-meter"' + (truth ? ' data-truth="' + _esc(truth) + '"' : '') + '>'
    + '<div class="sn-meter-bar"></div>'
    + '<div class="sn-meter-fill" style="width:calc(' + w.toFixed(1) + '% - 2px)"></div>'
    + '<div class="sn-meter-wall" style="left:calc(' + wall.toFixed(1) + '% - 3px)"></div>'
    + '<div class="sn-meter-n">' + _pct(top) + '%</div>'
    + (capt ? '<div class="sn-meter-capt">' + _esc(capt) + '</div>' : '')
    + '</div></div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the gate, and it is a TWO-STATE gate
// ══════════════════════════════════════════════════════════════════════

/**
 * WHAT THIS OBSERVER IS ENTITLED TO OF THE CASTLE'S HEAD.
 *
 * ONE GATE, `truthKnown`, AND IT IS MUTATED IN BOTH DIRECTIONS in
 * tests/tr-vp.test.js. A one-way mutation on a two-state gate proves half of it
 * — Task 3's technique, and this is its seventh use in the plan.
 *
 *   AUDIENCE   all three of spec §9.1's layers: every person's own read, the
 *              Faithfuls' collective read, and what is actually true. Holding
 *              all three at once is the entire product. The gap between the
 *              second and the third IS the show.
 *
 *   A PLAYER   their own board and nothing else, ever. Not the aggregate —
 *              that is a compilation of what is inside other people's heads and
 *              there is no way to be handed it. Not the truth. Not the flips,
 *              because a recruitment IS ground truth wearing a date.
 *
 * AND THE VALENCE NEVER CROSSES EITHER. `valence` looks like a property of a
 * belief and is not: `_assess` in js/knowledge.js reads the fact's GROUND TRUTH
 * to set it, so `valence: 'false'` means "this person really is innocent" and
 * handing it to a player layer would leak the answer through a field that does
 * not look like the answer. A player is told they DISMISSED a name — which is
 * what they did — and never that they were right to.
 *
 * The withheld layers are withheld by NEVER REACHING the branch that draws
 * them: `truth`, `castle`, `flips` and every other observer's board are absent
 * from the view rather than present and unused, so a later edit to a card
 * cannot print one.
 */
function _view(ep, observer) {
  const b = ep && ep.tr && ep.tr.beliefs;
  if (!b || !Array.isArray(b.castle)) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const living = Array.isArray(b.living) ? [...b.living] : [];
  const ceiling = Number(b.ceiling) || 0;
  const boards = Array.isArray(b.boards) ? b.boards : [];

  const truthKnown = isAudience;

  // A player who is not in the castle tonight has no read to show. They are
  // not refused the screen — they are told why there is nothing on it, which
  // is the notice Task 4 put on the offer for the same reason.
  const inRoom = isAudience || (!!watcher && living.indexOf(watcher) >= 0);

  // THE PLAYER LAYER. Their own rows, rebuilt field by field rather than
  // spread and pruned: a spread that later grows a field grows it silently,
  // which is precisely how ground truth escapes.
  let mine = null;
  if (watcher) {
    const own = boards.find(x => x.observer === watcher);
    mine = (own ? own.entries : []).map(e => ({
      name: e.name,
      score: e.score,
      confidence: e.confidence,
      sourceType: e.sourceType,
      why: e.why,
      learnedEp: e.learnedEp,
      certain: !!e.certain,
      // What THEY did with it, which is a fact about them. Not what it was
      // worth against the truth, which is a fact about somebody else.
      dismissed: !(e.score > 0),
    }));
  }

  return {
    ep: b.ep != null ? b.ep : (ep.num || 1),
    isAudience, watcher, inRoom, truthKnown, ceiling,
    living,
    mine,
    // AUDIENCE ONLY, and null rather than empty where withheld.
    boards: truthKnown ? boards : null,
    castle: truthKnown ? b.castle : null,
    truth: truthKnown ? (b.truth || {}) : null,
    flips: truthKnown ? (b.flips || []) : null,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

/** How much of the room's weight is aimed at somebody who really is one. */
function _accuracy(castle, truth) {
  let hit = 0, all = 0;
  for (const r of castle || []) {
    all += r.weight;
    if (truth && truth[r.name] === 'traitor') hit += r.weight;
  }
  return all > 0 ? hit / all : 0;
}

/** Every certainty anybody living is holding, as `{ observer, name }` pairs. */
function _certainties(boards) {
  const out = [];
  for (const b of boards || []) {
    for (const e of b.entries) if (e.certain) out.push({ observer: b.observer, name: e.name });
  }
  return out;
}

function _buildBeats(v) {
  const beats = [];
  const key = 'sn|' + v.ep + '|' + v.living.length;
  const used = new Set();
  const push = (phase, html, meta) => beats.push({ phase, html, meta: meta || null });
  const pctWall = _pct(v.ceiling) + '%';

  // THE GATE DECIDES THE PAGE, and it did not until a mutation said so.
  //
  // This read `if (!v.isAudience)`, which is the same answer by coincidence and
  // left `truthKnown` a field nothing branched on: flipping it to `true` handed
  // a player layer the whole truth block and every guard stayed green, because
  // the player path was chosen by a DIFFERENT expression that happened to agree
  // with it. That is "redundancy hiding a dead guard" — the second shape on
  // this plan's list — and the fix belongs in the source, not in a stronger
  // assertion. One gate, read everywhere.
  if (!v.truthKnown) return _buildPlayerBeats(v, beats, push, key, used, pctWall);

  const castle = v.castle || [];
  const truth = v.truth || {};
  const flipEp = {};
  for (const f of v.flips || []) flipEp[f.name] = f.ep;
  const holders = (v.boards || []).length;

  // ── 1. THE ROOM, MEASURED ───────────────────────────────────────────
  push('open', _card('The Room, Measured', 'The rule', 'rule',
    '<p>' + _fill(_pick(OPENING, key + '|open'), {
      whoN: _word(holders) + ' ' + _s(holders, 'person', 'people'),
      has: _s(holders, 'has', 'have'), are: _s(holders, 'is', 'are'),
    }) + '</p>'
    + '<p class="sn-said">' + _fill(_pick(WALL_RULE, key + '|wall'), { pct: pctWall })
    + '</p>'
    + _sums([
      ['In the castle', v.living.length],
      ['Holding a read', holders],
      ['Names written down', castle.length, castle.length ? 'brass' : null],
    ]), 'quiet'), { kind: 'open' });

  // ── 2. WHAT THE CASTLE BELIEVES, ONE NAME AT A TIME ─────────────────
  //
  // ONE BEAT PER NAME AND THE TRUTH LAST INSIDE EACH. A table of names with
  // ticks beside them is a scoreboard; this format is the moment before the
  // tick, held for as long as it can be held.
  const shown = castle.slice(0, 6);
  shown.forEach((row, i) => {
    const isT = truth[row.name] === 'traitor';
    const flip = flipEp[row.name];
    const lead = row.accusers === 0
      ? _fill(_pickUnique(WEIGH_NONE, key + '|w0|' + i, used),
        { who: _esc(row.name), n: _word(row.cleared) })
      : row.accusers === 1
      ? _fill(_pickUnique(WEIGH_ONE, key + '|w1|' + i, used),
        { who: _esc(row.name), who2: _esc(_topAccuser(v, row.name) || 'one of them') })
      : _fill(_pickUnique(WEIGH, key + '|w|' + i, used), {
        who: _esc(row.name), n: _word(row.accusers), N: _Word(row.accusers),
        acc: _s(row.accusers, 'name against them', 'names against them'),
        have: _s(row.accusers, 'has', 'have'),
      });
    const verdictPool = row.accusers === 0
      ? (isT ? DROPPED_HIT : DROPPED_MISS)
      : (!isT ? TRUE_MISS : (flip ? TRUE_FLIP : TRUE_HIT));
    const verdict = _fill(_pickUnique(verdictPool, key + '|v|' + i, used), {
      who: _esc(row.name), sub: 'they', since: 'the first night',
      day: _word(flip || 1),
    });
    push('castle', _card(row.name, _ord(i) + ' by weight of opinion', 'pin',
      '<p>' + lead + '</p>'
      + _weigh(row.name, row.top, v.ceiling, truth[row.name] || null,
        _word(row.accusers) + ' ' + _s(row.accusers, 'accuser') + ', '
        + (row.cleared ? _word(row.cleared) + ' ' + _s(row.cleared, 'dismissal')
          : 'nobody unconvinced'),
        'the strongest single read against them')
      + '<div class="sn-verdict" data-truth="' + _esc(truth[row.name] || 'faithful') + '">'
      + _ic(isT ? 'plumb' : 'balance', 14) + '<span>' + verdict + '</span></div>',
      isT ? 'right' : 'wrong'),
    { kind: 'name', name: row.name, top: row.top, truth: truth[row.name] || null });
  });

  // ── 3. INSIDE ONE HEAD ──────────────────────────────────────────────
  //
  // The people whose read carries furthest, because a board nobody acts on is
  // a page in a drawer. Sorted on the strongest thing they hold.
  //
  // FAITHFUL OBSERVERS ONLY, and the first draft got this exactly backwards.
  // Sorting every board by its strongest read puts the Traitors at the top of
  // the list every single night, because a turret belief is worth 0.84 and the
  // best thing anybody else holds is worth a fifth of that -- so the section
  // called "inside one head" was three heads that already knew the answer. The
  // people doing the deducing are the people who cannot, and their certainty
  // has its own beat two cards further down.
  const readers = (v.boards || [])
    .filter(b => truth[b.observer] !== 'traitor')
    .map(b => ({ b, best: b.entries.reduce((m, e) => Math.max(m, e.score), 0) }))
    .sort((x, y) => y.best - x.best || x.b.observer.localeCompare(y.b.observer))
    .slice(0, 3);
  readers.forEach(({ b }, i) => {
    const rows = b.entries.slice(0, 5);
    const top = rows.find(e => e.score > 0) || null;
    const lead = top
      ? _fill(_pickUnique(READ_TOP, key + '|rt|' + i, used), {
        who: _esc(b.observer), t: _esc(top.name),
        why: '<em>' + _esc(top.why || 'nothing they could put a name to') + '</em>',
      })
      : _fill(_pickUnique(rows.length ? READ_DROPPED : READ_EMPTY,
        key + '|re|' + i, used), { who: _esc(b.observer), sub: 'they' });
    push('reads', _card(b.observer, 'Inside one head', 'dividers',
      '<p class="sn-said">'
      + _esc(_fill(_pick(READ_LEAD, key + '|rl|' + i), { who: b.observer })) + '</p>'
      + '<p>' + lead + '</p>' + _rowsOf(rows),
      'quiet'),
    { kind: 'read', name: b.observer });
  });

  // ── 4. THE WALL ─────────────────────────────────────────────────────
  const certain = _certainties(v.boards);
  push('wall', _card('Past The Wall', _pick(WALL_LEAD, key + '|wl'), 'wall',
    '<p>' + (certain.length
      ? _fill(_pick(WALL_PACT, key + '|wp'), {
        n: _word(certain.length), N: _Word(certain.length),
        mark: _s(certain.length, 'mark'),
      })
      : _pick(WALL_EMPTY, key + '|we')) + '</p>'
    + (certain.length
      ? '<div class="sn-rows">' + certain.slice(0, 8).map(c =>
        '<div class="sn-row">' + _av(c.observer, 30)
        + '<div><span class="sn-row-nm">' + _esc(c.observer) + '</span>'
        + '<span class="sn-row-why"> knows exactly what ' + _esc(c.name)
        + ' is</span>' + _tier('public') + '</div>'
        + '<div class="sn-row-n">' + _pct(1) + '%</div></div>').join('') + '</div>'
      : ''), 'brass'),
  { kind: 'wall', certain: certain.length });

  // ── 5. THE GAP ──────────────────────────────────────────────────────
  const acc = _accuracy(castle, truth);
  const quiet = _quietestTraitor(v);
  const gapPool = acc < 0.34 ? GAP_BAD : (acc > 0.66 ? GAP_GOOD : GAP_SPLIT);
  push('gap', _card('The Distance', _pick(GAP_LEAD, key + '|gl'), 'plumb',
    '<p>' + _pick(gapPool, key + '|gp') + '</p>'
    + (quiet
      ? '<p class="sn-said">' + _fill(_pick(quiet.accusers ? QUIET_ONE : QUIET_NONE,
        key + '|q'), {
        who: _esc(quiet.name), obj: 'them', n: _word(quiet.accusers),
        acc: _s(quiet.accusers, 'name against them', 'names against them'),
      }) + '</p>'
      : '')
    + _sums([
      ['Weight on Traitors', _pct(acc) + '%', acc > 0.5 ? 'brass' : 'wrong'],
      ['Weight on Faithfuls', _pct(1 - acc) + '%'],
      ['Certainties in the room', certain.length, certain.length ? 'brass' : null],
    ]),
  acc > 0.5 ? 'right' : 'wrong'), { kind: 'gap', acc });

  return beats;
}

/**
 * Who holds the strongest single read against this name.
 *
 * FAITHFUL OBSERVERS ONLY, because the number this sentence sits beside is the
 * castle aggregate and that is counted over Faithfuls. Scanning every board
 * produced a card reading "one accuser" and then naming a Traitor as the
 * accuser -- two figures derived from two different populations, printed a line
 * apart. Found by reading the dump.
 */
function _topAccuser(v, name) {
  const truth = v.truth || {};
  let best = null, bestScore = 0;
  for (const b of v.boards || []) {
    if (truth[b.observer] === 'traitor') continue;
    for (const e of b.entries) {
      if (e.name !== name || !(e.score > bestScore)) continue;
      bestScore = e.score; best = b.observer;
    }
  }
  return best;
}

/**
 * The Traitor the room is looking at least hard.
 *
 * Read off the CASTLE aggregate rather than recomputed, so the number in the
 * sentence and the number on the rule cannot come to disagree — and a Traitor
 * who appears on nobody's board at all is the best answer this can return, so
 * an absence is a result here rather than a miss.
 */
function _quietestTraitor(v) {
  const truth = v.truth || {};
  const names = v.living.filter(n => truth[n] === 'traitor');
  if (!names.length) return null;
  const byName = new Map((v.castle || []).map(r => [r.name, r]));
  let best = null;
  for (const n of names) {
    const row = byName.get(n);
    const w = row ? row.weight : 0;
    if (!best || w < best.weight) {
      best = { name: n, weight: w, accusers: row ? row.accusers : 0 };
    }
  }
  return best;
}

/**
 * A list of reads, as rows.
 *
 * NO TRUTH REACHES THIS FUNCTION AND IT TAKES NONE. A row that said whether the
 * reader was right would turn every private list into a marked exam paper, and
 * this screen's whole argument is that nobody in the castle gets one — the
 * verdict belongs to the weighing cards, once, where the audience layer holds
 * it deliberately.
 */
function _rowsOf(rows) {
  if (!rows || !rows.length) return '';
  return '<div class="sn-rows">' + rows.map(e =>
    '<div class="sn-row"' + (e.dismissed || !(e.score > 0) ? ' data-dismissed="1"' : '') + '>'
    + _av(e.name, 30)
    + '<div><span class="sn-row-nm">' + _esc(e.name) + '</span>'
    + (e.why ? '<span class="sn-row-why"> &mdash; ' + _esc(e.why) + '</span>' : '')
    + _tier(e.sourceType) + '</div>'
    + '<div class="sn-row-n">' + _pct(e.score) + '%</div>'
    + '</div>').join('') + '</div>';
}

/**
 * THE PLAYER LAYER. Their own list, and nothing that is not theirs.
 *
 * It is a real layer and not a stub, because the observer contract is what this
 * screen exists to honour — but the composition is still built for the
 * audience, exactly as Task 9 corrected the selection: `observer` is
 * `'audience'` on every reader that exists today, the player layers are here
 * because the signature is free now and a rewrite later, and a screen composed
 * around what can be HIDDEN produces a page shaped by a mechanism nobody is
 * looking through.
 */
function _buildPlayerBeats(v, beats, push, key, used, pctWall) {
  const mine = v.mine || [];
  if (!v.inRoom) {
    push('open', _card('You Are Not In The Castle', 'The rule', 'rule',
      '<p>The board is drawn from what the people still in the building are '
      + 'carrying. You are not one of them tonight, so there is nothing here '
      + 'that is yours.</p>', 'quiet'), { kind: 'open' });
    return beats;
  }
  const held = mine.filter(e => !e.dismissed);
  const sure = mine.filter(e => e.certain);

  push('open', _card('What You Have', _pick(MINE_LEAD, key + '|ml'), 'rule',
    '<p>' + (held.length
      ? 'Everything below is something you worked out, were told, or overheard. '
        + 'None of it is proof and all of it is what you will be voting on.'
      : 'You are carrying nothing. Not a name, not a suspicion you would repeat '
        + 'out loud — and the table will still ask you for one.') + '</p>'
    + '<p class="sn-said">' + _fill(_pick(WALL_RULE, key + '|wall'), { pct: pctWall })
    + '</p>'
    + _sums([
      ['Names you hold', held.length],
      ['Names you dismissed', mine.length - held.length],
      ['Past the wall', sure.length, sure.length ? 'brass' : null],
    ]), 'quiet'), { kind: 'open' });

  mine.slice(0, 6).forEach((e, i) => {
    const lead = e.dismissed
      ? _fill(_pickUnique(MINE_DISMISSED, key + '|d|' + i, used), { t: _esc(e.name) })
      : _fill(_pickUnique(MINE_TOP, key + '|mt|' + i, used), {
        t: _esc(e.name),
        why: '<em>' + _esc(e.why || 'a feeling you could not source') + '</em>',
      });
    // THE METER IS WHAT IT IS WORTH AT A BALLOT and the meta carries what the
    // belief itself is worth, which are two different numbers whenever the
    // observer likes or dislikes the person -- `bondResistance` is the whole
    // reason a well-liked Traitor survives, and burying it would report the
    // model as simpler than it is. Drawing one on the bar and the other in the
    // rows, as the first draft did, printed the same pair at two figures a
    // finger apart with nothing saying why.
    const meta = (e.sourceType || 'nothing') + ' \u00b7 day ' + (e.learnedEp || v.ep)
      + ' \u00b7 ' + _pct(e.confidence) + '% before the way you feel about them';
    push('castle', _card(e.name,
      e.certain ? 'Past the wall'
        : (e.dismissed ? 'Considered and dropped' : _ord(i) + ' on your list'),
      e.certain ? 'wall' : 'pin',
      '<p>' + lead + '</p>'
      + _weigh(e.name, e.score, v.ceiling, null, meta,
        'what it is worth to you at a table'),
      e.certain ? 'brass' : (e.dismissed ? 'quiet' : null)),
    { kind: 'name', name: e.name, top: e.score, truth: null });
  });

  push('gap', _card('And That Is All Of It', 'The far side', 'wall',
    '<p>' + _pick(sure.length ? MINE_CLOSE_SURE : MINE_CLOSE, key + '|mc') + '</p>',
    'quiet'), { kind: 'gap' });
  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE RULE — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trSuspicion`, because a <script> tag inside innerHTML does
// not execute. GATED ON `idx` IN BOTH DIRECTIONS: a pin appears on the rule
// only once its own beat has been read, and the truth glyph on it only once the
// card carrying that truth has been. A stage that shows the finished picture on
// the first click has spoiled a screen whose subject is the moment before you
// know.

function _rule(state, idx) {
  const v = state.v;
  const seen = state.stepMeta.slice(0, Math.max(0, idx + 1)).filter(Boolean);
  const kinds = new Set(seen.map(m => m.kind));
  const pins = seen.filter(m => m.kind === 'name');

  // The graduations. Five majors, four minors between them, and the labels are
  // the two ends and the wall — a rule with a number on every tick is a table.
  let ticks = '';
  for (let i = 0; i <= 20; i++) {
    const major = i % 5 === 0;
    ticks += '<div class="sn-tick"' + (major ? ' data-major="1"' : '')
      + ' style="left:calc(22px + (100% - 44px) * ' + (i / 20) + ')"></div>';
  }
  const wallPct = _at(v.ceiling);
  const wall = '<div class="sn-wall" style="left:calc(22px + (100% - 44px) * '
    + (wallPct / 100).toFixed(4) + ' - 4px)"></div>'
    + '<div class="sn-wall-l" style="left:calc(22px + (100% - 44px) * '
    + (wallPct / 100).toFixed(4) + ')">' + _pct(v.ceiling) + '% &mdash; the wall</div>';

  // THE PINS, AND THE LANES ARE ASSIGNED RATHER THAN ALTERNATED.
  //
  // A two-lane `i % 2` stagger is Task 2's fix for the ring's markers and it is
  // not enough here, because suspicion CLUSTERS: most of a castle's reads sit
  // under a fifth of the rule and the low end rendered as "CameronAnneAxel"
  // with the labels laid straight over each other. Found by looking at the
  // page, not by an assertion. So a pin takes the first lane whose last
  // occupant is far enough to the left of it, and falls back to the emptiest
  // lane when all four are busy — position-ordered, so the assignment does not
  // depend on which name happened to be weighed first.
  const LANES = 4, MIN_GAP = 8.2;
  const laneLast = new Array(LANES).fill(-99);
  const laneOf = new Map();
  const ordered = pins.map((m, i) => ({ m, i, at: _at(m.top) })
  ).sort((a, b) => a.at - b.at || a.i - b.i);
  for (const o of ordered) {
    let lane = -1;
    for (let l = 0; l < LANES; l++) {
      if (o.at - laneLast[l] >= MIN_GAP) { lane = l; break; }
    }
    if (lane < 0) {
      lane = 0;
      for (let l = 1; l < LANES; l++) if (laneLast[l] < laneLast[lane]) lane = l;
    }
    laneLast[lane] = o.at;
    laneOf.set(o.i, lane);
  }
  const pinHtml = pins.map((m, i) => {
    const at = _at(m.top);
    const lane = laneOf.get(i) || 0;
    const top = 2 + lane * 15;
    return '<div class="sn-pin" data-certain="' + (m.top >= v.ceiling ? 1 : 0) + '"'
      + (m.truth ? ' data-truth="' + _esc(m.truth) + '"' : '')
      + ' style="left:calc(22px + (100% - 44px) * ' + (at / 100).toFixed(4)
      + ');top:' + top + 'px">'
      + '<b>' + _esc(_first(m.name)) + '</b><s></s>'
      + '<i style="height:' + Math.max(3, 88 - top - 24) + 'px"></i></div>';
  }).join('');

  const foot = [];
  foot.push('<span><b>' + v.living.length + '</b> in the castle</span>');
  if (v.truthKnown) {
    foot.push('<span data-tone="brass"><b>' + pins.length + '</b> of '
      + (v.castle || []).length + ' names weighed</span>');
    const hits = pins.filter(m => m.truth === 'traitor').length;
    foot.push('<span><b>' + (pins.length ? hits : '&mdash;')
      + '</b> of those really are</span>');
  } else {
    foot.push('<span data-tone="brass"><b>' + pins.length + '</b> of '
      + (v.mine || []).length + ' of your own</span>');
    // NOT "62% is as sure as you get". A Traitor observer is looking at their
    // own turret certainty while the footer tells them they cannot have one.
    const sure = (v.mine || []).filter(e => e.certain).length;
    foot.push('<span><b>' + sure + '</b> of yours past the wall</span>');
  }
  foot.push('<span><b>' + (kinds.has('wall') ? 'Shown' : 'Standing')
    + '</b> the wall</span>');

  return '<div class="sn-rule">'
    + '<div class="sn-rule-h"><span>' + (v.truthKnown
      ? 'What the castle believes' : 'What you believe')
    + '</span><b>' + (kinds.has('gap') ? 'Ruled off'
      : (kinds.has('wall') ? 'The far side' : 'Weighing')) + '</b></div>'
    + '<div class="sn-rule-body">'
    + '<div class="sn-rule-bar"></div>' + ticks + wall + pinHtml
    // THE TWO ENDS, NAMED SO THEY STILL MEAN SOMETHING ALONE. The transcript
    // renders the stage as prose, and "nothing" and "certain" on their own
    // lines read as stray words rather than as the ends of a scale.
    + '<div class="sn-tick-l" style="left:22px">no read at all</div>'
    + '<div class="sn-tick-l" style="left:calc(100% - 22px)">certainty</div>'
    + '</div>'
    + '<div class="sn-rule-foot">' + foot.join('') + '</div>'
    + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'suspicion-' + (epNum || 0); }
function _state(epNum, total) {
  const k = _key(epNum);
  if (!_tvState[k]) _tvState[k] = { idx: 0, total };
  _tvState[k].total = total;
  return _tvState[k];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  const scroller = document.querySelector('.rp-main');
  const top = scroller ? scroller.scrollTop : 0;
  for (let i = 0; i < total; i++) {
    const el = document.getElementById('sn-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('sn-vis'); else el.classList.remove('sn-vis');
  }
  const counter = document.getElementById('sn-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('sn-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.sn-btn').forEach(b => b.classList.toggle('sn-dim', done));
  }
  const shell = document.getElementById('sn-shell-' + suffix);
  const last = document.getElementById('sn-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase',
    last.getAttribute('data-phase') || 'open');
  if (scroller) scroller.scrollTop = top;
}

function _updateRule(epNum, idx) {
  const el = document.getElementById('sn-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trSuspicion) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _rule(state, idx);
}

/** Bring the new card into view, UNDER the rule rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('sn-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trSuspicionRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('sn-step-' + suffix + '-' + st.idx));
  _updateRule(epNum, st.idx);
}

export function trSuspicionRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateRule(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildSuspicion(ep, observer)` — who believes what, and how wrong they are.
 *
 * `ep` is an `episodeHistory` row carrying `tr.beliefs`, which js/tr/headless.js
 * writes on every night that is not an endgame table. `TRAITORS_SCREENS`
 * registers this screen off the presence of a NON-EMPTY castle board rather
 * than off an episode number, which is the same rule every other castle screen
 * is registered by: on the first night the Faithfuls have not formed a single
 * read between them, and a page reporting that they have not is a page with
 * nothing on it.
 *
 * `observer` is `'audience'` or `'player:<Name>'`; `_view` is where the gate
 * lives and it is the only place the question is answered.
 */
export function rpBuildSuspicion(ep, observer = 'audience') {
  const suffix = 'suspicion';
  const vars = '--sn-grain-src:' + _noiseTile('0.86', 4, 41, 0.28, 220) + ';';
  const css = '<style>' + SN_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v) {
    return '<div class="sn-root" style="' + vars + '">' + css
      + '<div class="sn-shell" data-phase="open">'
      + '<div class="sn-scenery" aria-hidden="true">'
      + '<div class="sn-board"></div><div class="sn-far">' + _far() + '</div>'
      + '<div class="sn-vig"></div><div class="sn-grain"></div></div>'
      + '<div class="sn-body"><div class="sn-main"><div class="sn-veil">'
      + _ic('rule', 76, 'rgba(142,166,187,.34)')
      + '<div class="sn-veil-h">The Board Was Not Drawn</div>'
      + '<p>Nothing was written down on this night that anybody could measure.</p>'
      + '</div></div></div></div></div>';
  }

  const beats = _buildBeats(v);
  const total = beats.length;
  const epNum = ep.num || v.ep || 1;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trSuspicion = window.__trSuspicion || {};
    window.__trSuspicion[epNum] = state;
  }

  const err = v.truthKnown ? 1 - _accuracy(v.castle, v.truth) : 0.5;

  const observerBadge = v.isAudience
    ? '<div class="sn-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; you get all three: what each of them '
      + 'privately thinks, what they think together, and what is actually so. '
      + 'Nobody in that building holds more than the first of those</em></div>'
    : '<div class="sn-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; your own list and nothing else. What anybody else is '
      + 'carrying, and whether any of it is true, is not a thing this castle '
      + 'lets you have</em></div>';

  // The Round Table's first-paint pattern: visibility is baked in from `st.idx`
  // at emit time, because conclave.js relied on a click and shipped a screen
  // that was blank until the viewer pressed something.
  const stream = beats.map((b, i) =>
    '<div class="sn-beat' + (i <= st.idx ? ' sn-vis' : '')
    + '" id="sn-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state on
  // every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="sn-root" style="' + vars + '">' + css
    + '<div class="sn-shell" id="sn-shell-' + suffix + '"'
    + ' data-phase="' + beats[0].phase + '">'
    + '<div class="sn-scenery" aria-hidden="true">'
    + '<div class="sn-board"></div>'
    + '<div class="sn-hatch"></div>'
    + '<div class="sn-far">' + _far() + '</div>'
    + '<div class="sn-mid">' + _mid(epNum + '|' + v.living.length) + '</div>'
    + '<div class="sn-fore">' + _fore() + '</div>'
    + '<div class="sn-vig"></div>'
    + '<div class="sn-grain"></div>'
    + '</div>'
    + '<div class="sn-body">'
    + '<div class="sn-hero">' + _heroScene(err)
    + '<div class="sn-hero-lock">'
    // "Day N" and not "Season I - Day I", for the reason all nine other screens
    // say so: the episode record carries no season number.
    + '<div class="sn-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; What The Castle Believes</div>'
    + '<h1 class="sn-title">THE SUSPICION BOARD</h1>'
    + '<div class="sn-title-rule"><i></i>' + _ic('balance', 34, '#8ea6bb')
    + '<i></i></div>'
    + '<p class="sn-sub">'
    + (v.isAudience
      ? 'One line hangs true and the other hangs where the castle thinks true '
        + 'is. Everything on this page is the distance between them, and '
        + 'nobody in that building can measure it.'
      : 'Everything you have worked out, weighed against a wall you are not '
        + 'able to get past. Nobody in this castle is.')
    + '</p>'
    + '</div></div>'
    + '<header class="sn-head">' + observerBadge + '</header>'
    + '<div class="sn-stage" id="sn-stage-inner">' + _rule(state, st.idx) + '</div>'
    + '<main class="sn-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="sn-controls" id="sn-controls-' + suffix + '">'
    + '<button class="sn-btn" onclick="' + call('trSuspicionRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="sn-counter" id="sn-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="sn-btn" onclick="' + call('trSuspicionRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
