// ══════════════════════════════════════════════════════════════════════
// vp-tr/cold-open.js — the morning, and the chair nobody is in
// ══════════════════════════════════════════════════════════════════════
//
// Built in the language Task 1 approved and Task 2 extended, and deliberately
// not in either of their rooms.
//
// SHARED: the type system (Fraunces 900 for display, IM Fell English for
// anything spoken, Cormorant Garamond for body), the `_portrait()` helper and
// its stylesheet, the open-eye seal as the show's sigil, `_icon()` for the
// objects both screens have, the reveal machinery, the sticky-stage
// architecture, and the rule that no narration writes a host name or an exit
// word as a literal.
//
// NOT SHARED, AND ON PURPOSE:
//
//   THE LIGHT. This screen is the conclave with the light on. The turret is a
//   cold room at midnight lit by one lantern and the hall is forty candles at
//   an hour when everybody is watching everybody; this is six o'clock, an east
//   window, and nobody has decided to look at anybody yet. It STARTS blue-dark
//   and gets lighter as it runs — the only screen in the set whose atmosphere
//   moves in one direction from beginning to end, because a morning does.
//
//   THE PRIMITIVE IS THE TABLE, LAID. Not the ring: a rectangular refectory
//   table drawn flat from above, in plan, with a place setting per living
//   player — plate, knife, cup. Places FILL as the castle comes down, and the
//   reader watches the table populate. The setting that never fills is the
//   whole screen: its cup is turned over, which is the thing the staff
//   actually do, and it is the only red on the page.
//
//   THE CARD PHYSICS COME DOWNWARD. The turret's cards were drawn out of the
//   dark and the hall's leant in across the wood. Here everything descends —
//   people coming down a stair — and the dust in the window shafts falls,
//   where the turret's embers rose.
//
// ── WHY THE MORNING IS LAST NIGHT'S ───────────────────────────────────
//
// A night runs at the END of the episode it belongs to (js/tr/headless.js: the
// table sits in the evening and the turret meets afterwards), and the castle
// finds out over breakfast the next day. So episode N opens on episode N-1's
// night, and `ep.tr.dawn` carries that previous row's own `exits[]` RAW — this
// file runs `roundExits()` on it and keeps the one channel the room is
// learning about. Episode one has no previous row and therefore no empty
// setting: it is an arrival instead, and the branch is on `dawn.ofEp` being
// null rather than on the episode number, because a number is a thing somebody
// renumbers.
//
// ── THE HARD RULES ────────────────────────────────────────────────────
//
//   1. NOBODY WHO LEFT COMES DOWN. The room is `tr.cast` MINUS everybody in
//      `tr.goneBefore`, and that list is built with `roundExits()` — the registry's
//      own rule — never off `eliminated`, which is the public vote alone. Plan
//      7 found NINE readers asking that field, and on this show that means a
//      victim of the night walking into breakfast.
//   2. ONE CHANNEL IS NEWS AND THE OTHER IS NOT. A vote of the room happened
//      in front of the room; there is nothing to discover about it at
//      breakfast. Only the other door is a gap at this table.
//   3. THE OBSERVER CONTRACT. Breakfast is public, so almost all of it is the
//      same on every layer — the exception is the night the pact struck and a
//      relic ate it. Everybody comes down either way; only the people watching
//      at home know a name was chosen at all. It is stripped off the view
//      before a player's screen is built from it, not hidden in the markup.
import { seasonConfig, players } from '../core.js';
import { pronouns } from '../players.js';
import { exitVerbs, roundExits } from '../shows.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { PORTRAIT_CSS, TR_NAV_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

const TR = 'traitors';

/** The show's own words for the two doors. Never written out. */
function _verbs() {
  const [vote, night] = exitVerbs(TR);
  return { vote: vote || 'out', night: night || vote || 'out' };
}
const _cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

// ── deterministic picking ─────────────────────────────────────────────
// A VP screen is rebuilt on every paint and on every reveal, so nothing here
// may draw from Math.random: the room would resay its lines under the reader.
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
 * THE SAME POOL, TWICE IN ONE SCENE, IS A BUG YOU CAN READ.
 *
 * `_pick` hashes a key into a pool, and two different keys land on the same
 * line often enough that a dumped season had two Traitors arguing for the same
 * victim in word-for-word the same sentence, and two people at the same table
 * saying the same thing about their own slip. Different keys are not a
 * guarantee of different lines — with a pool of eight and five speakers it is
 * a coin flip that two of them collide.
 *
 * So a scene carries a set of what it has already said, and a drawn line that
 * is already in it walks forward to the next one. Still deterministic, still
 * seeded off the record, and the pool is never exhausted because it falls back
 * to the honest first choice.
 */
function _pickAway(pool, key, seen) {
  if (!pool || !pool.length) return '';
  const start = _hash(key) % pool.length;
  for (let n = 0; n < pool.length; n++) {
    const line = pool[(start + n) % pool.length];
    if (!seen || !seen.has(line)) { if (seen) seen.add(line); return line; }
  }
  return pool[start];
}
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function _fill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null) ? subs[k] : m);
}
/** The subject's pronouns, in the keys the pools use. NO `Pos` property. */
function _pr(name) {
  const p = pronouns(name) || {};
  return { sub: p.sub || 'they', Sub: p.Sub || 'They', obj: p.obj || 'them',
    pos: p.posAdj || 'their', ref: p.ref || 'themselves' };
}

// ── the host ──────────────────────────────────────────────────────────
// Resolved, never written. A host name inside a narration string is this
// repo's central bug class, and the guard in tests/tr-vp.test.js scans this
// file for every part of every configured host's name.
function _host() {
  const list = HOSTS_BY_FORMAT[TR] || [];
  const want = seasonConfig && seasonConfig.host;
  const hit = list.find(h => h.value === want) || list[0]
    || { value: 'host', label: 'Your host' };
  return { name: hit.label, slug: String(hit.value).toLowerCase().replace(/[^a-z0-9]+/g, '-') };
}

// ── faces ─────────────────────────────────────────────────────────────
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
/**
 * A face at breakfast, and it is NEUTRAL.
 *
 * `_portrait()` takes an `opts.lit` that asks for the turret's rim-light and
 * shadow side. Nothing in this file asks for it: a room with three east
 * windows in it has no shadow side, and a face that arrived pre-darkened would
 * look broken under them.
 */
function _av(name, size) {
  return _portrait(_slugOf(name), name, size || 40);
}
function _hostAv(size) {
  const h = _host();
  return _portrait(h.slug, h.name, size || 46);
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — objects only, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// The shared set comes from `_icon()` in conclave.js — the seal in particular,
// which is the show's sigil and has to be the same pressing on every screen.
// These are the morning's own objects, which neither of the night rooms has
// any use for.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    cup: '<path d="M4.4 8.2h12.2v6.2a4.6 4.6 0 0 1-4.6 4.6H9a4.6 4.6 0 0 1-4.6-4.6z" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<path d="M16.6 9.6h1.7a2.6 2.6 0 0 1 0 5.2h-1.7" stroke="' + c + '" stroke-width="1.3" fill="none"/>'
      + '<path d="M3 21.2h15.4" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M7.6 5.6c0-1.2 1-1.4 1-2.6M11 5.6c0-1.2 1-1.4 1-2.6" stroke="' + c + '" stroke-width="1.1" opacity=".6"/>',
    cupdown: '<path d="M4.4 15.4h12.2V9.2a4.6 4.6 0 0 0-4.6-4.6H9a4.6 4.6 0 0 0-4.6 4.6z" stroke="' + c + '" stroke-width="1.4" fill="rgba(142,21,38,.16)"/>'
      + '<path d="M2.8 15.4h15.4" stroke="' + c + '" stroke-width="1.6"/>'
      + '<path d="M16.6 13.8h1.7a2.6 2.6 0 0 0 0-5.2h-1.7" stroke="' + c + '" stroke-width="1.3" fill="none"/>',
    plate: '<circle cx="12" cy="12" r="9.2" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<circle cx="12" cy="12" r="6" stroke="' + c + '" stroke-width="1" opacity=".55" fill="none"/>',
    window: '<path d="M5 21V9.6a7 7 0 0 1 14 0V21z" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<path d="M12 2.8V21M5.4 12.6h13.2M5.4 16.8h13.2" stroke="' + c + '" stroke-width="1.1" opacity=".7"/>'
      + '<path d="M3 21.4h18" stroke="' + c + '" stroke-width="1.5"/>',
    stair: '<path d="M2.6 20.6h4.2v-4.2H11v-4.2h4.2V8h4.2V3.8" stroke="' + c + '" stroke-width="1.5" fill="none"/>'
      + '<path d="M2.6 20.6h18.8" stroke="' + c + '" stroke-width="1.3" opacity=".5"/>',
    sun: '<circle cx="12" cy="13.4" r="4.4" fill="' + c + '" opacity=".9"/>'
      + '<path d="M12 4.6v3.2M4.6 13.4h3M16.4 13.4h3M6.4 7.8l2.1 2.1M17.6 7.8l-2.1 2.1" stroke="' + c + '" stroke-width="1.3" stroke-linecap="round"/>'
      + '<path d="M1.6 20.4h20.8" stroke="' + c + '" stroke-width="1.4" opacity=".7"/>',
    bell: '<path d="M12 3.2a6.2 6.2 0 0 1 6.2 6.2c0 4 1.4 5.4 1.4 5.4H4.4s1.4-1.4 1.4-5.4A6.2 6.2 0 0 1 12 3.2z" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<path d="M10.2 18a1.9 1.9 0 0 0 3.6 0" stroke="' + c + '" stroke-width="1.3" fill="none"/>'
      + '<circle cx="12" cy="2.6" r="1.2" fill="' + c + '"/>',
    head: '<circle cx="12" cy="8" r="4.2" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<path d="M3.8 21.4c0-4.6 3.7-7 8.2-7s8.2 2.4 8.2 7z" stroke="' + c + '" stroke-width="1.4" fill="none"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE MORNING — three planes, and neither of the night rooms
// ══════════════════════════════════════════════════════════════════════
//
// We are standing in a doorway at the low end of the long room, looking up it
// at three east windows. The stair comes down on the left. Everything past the
// glass is outside, which is the one thing neither the turret nor the hall
// ever showed: a castle at night has no outside.

/** The far plane: the sky, the hills and the water, seen through nothing yet. */
function _dawnFar() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="coSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#131c2c"/><stop offset="34%" stop-color="#2b3d54"/>'
    + '<stop offset="62%" stop-color="#6b7b8e"/><stop offset="82%" stop-color="#c39a86"/>'
    + '<stop offset="100%" stop-color="#e8c398"/>'
    + '</linearGradient>'
    + '<linearGradient id="coMist" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#cfd9e2" stop-opacity="0"/>'
    + '<stop offset="100%" stop-color="#cfd9e2" stop-opacity=".72"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#coSky)"/>'
    // the sun, only just over the ridge
    + '<circle cx="628" cy="742" r="54" fill="#ffe6b8" opacity=".9" filter="url(#coBloomSoft)"/>'
    + '<circle cx="628" cy="742" r="26" fill="#fff4dd"/>'
    // three ridges, each paler than the one in front: aerial perspective in
    // one attribute, which is all a distance ever needs
    + '<path d="M0 812 L168 736 L322 790 L470 700 L638 774 L806 706 L960 782 L1100 726 V1500 H0Z" fill="#41526a" opacity=".55"/>'
    + '<path d="M0 866 L206 800 L392 856 L568 786 L742 848 L916 792 L1100 852 V1500 H0Z" fill="#33415a" opacity=".7"/>'
    + '<path d="M0 930 L146 892 L340 936 L520 884 L700 934 L884 890 L1100 936 V1500 H0Z" fill="#232f45"/>'
    // the water, and the sun laid flat on it
    + '<rect y="936" width="1100" height="150" fill="#2b3a52"/>'
    + '<rect x="596" y="936" width="64" height="150" fill="#e8c79b" opacity=".34"/>'
    + '<rect y="1030" width="1100" height="470" fill="url(#coMist)"/>'
    + '</svg>';
}

/**
 * The mid plane: the east wall, the light it lets in, and the stair.
 *
 * The three light rhomboids on the floor are the whole reason this room reads
 * as morning rather than as an interior with a window in it — the shafts are
 * what the eye calls daylight, and they are drawn as solid geometry rather
 * than as a glow so that the dust has something to fall inside.
 */
function _dawnMid(seed) {
  const rng = _fieldRng('co|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="coShaft" x1="0" y1="0" x2="0.3" y2="1">'
    + '<stop offset="0%" stop-color="#fff1d4" stop-opacity=".62"/>'
    + '<stop offset="62%" stop-color="#ffe6c0" stop-opacity=".2"/>'
    + '<stop offset="100%" stop-color="#ffe0b4" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<linearGradient id="coWall" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#2c3441"/><stop offset="100%" stop-color="#141a23"/>'
    + '</linearGradient>'
    + '<linearGradient id="coFloor" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#252c37"/><stop offset="100%" stop-color="#0c1016"/>'
    + '</linearGradient>'
    + '</defs>';
  // the wall, with three lancets cut out of it
  s += '<path d="M0 0h1100v1180H0z" fill="url(#coWall)"/>';
  const winX = [268, 508, 748];
  for (const x of winX) {
    s += '<path d="M' + x + ' 1046 V620 a72 72 0 0 1 144 0 v426z" fill="#7d90a6" opacity=".08"/>'
      + '<path d="M' + x + ' 1046 V620 a72 72 0 0 1 144 0 v426z" fill="none" stroke="#0a0e14" stroke-width="13"/>'
      + '<path d="M' + (x + 72) + ' 552 v494" stroke="#0a0e14" stroke-width="10"/>'
      + '<path d="M' + x + ' 800 h144M' + x + ' 924 h144" stroke="#0a0e14" stroke-width="8"/>';
  }
  // the shafts the windows throw across the floor, and the floor they land on
  s += '<path d="M0 1046h1100v454H0z" fill="url(#coFloor)"/>';
  for (const x of winX) {
    s += '<path d="M' + x + ' 1046 L' + (x + 144) + ' 1046 L' + (x + 372)
      + ' 1500 L' + (x - 96) + ' 1500 Z" fill="url(#coShaft)" class="co-shaft"/>';
  }
  // the stair, coming down on the left, and its balusters
  s += '<path d="M0 640 L96 640 L96 712 L192 712 L192 784 L288 784 L288 856 L384 856 L384 928 L384 1046 L0 1046Z" fill="#151b25"/>'
    + '<path d="M0 640 L96 640 L96 712 L192 712 L192 784 L288 784 L288 856 L384 856 L384 928" fill="none" stroke="#3d4a5c" stroke-width="5"/>';
  for (let i = 0; i < 11; i++) {
    const bx = 28 + i * 34, by = 596 - i * 4;
    s += '<rect x="' + bx + '" y="' + by + '" width="9" height="' + (96 + i * 24)
      + '" fill="#1b2330" opacity=".92"/>';
  }
  s += '<path d="M8 590 L392 512" stroke="#3d4a5c" stroke-width="12" stroke-linecap="round"/>';
  // the long table, seen down its length, and the chairs either side
  s += '<path d="M392 1218 L1004 1146 L1052 1214 L420 1300 Z" fill="#2a2118" opacity=".95"/>'
    + '<path d="M392 1218 L1004 1146 L1004 1160 L392 1234 Z" fill="#3d3122"/>';
  for (let i = 0; i < 7; i++) {
    const cx = 430 + i * 88, cy = 1176 - i * 9;
    s += '<rect x="' + cx + '" y="' + cy + '" width="46" height="70" rx="5" fill="#1a1f28" opacity=".85"/>';
  }
  // dust, falling inside the shafts. It falls; the turret's embers rose.
  for (let i = 0; i < 54; i++) {
    const x = 210 + rng() * 760, y = 1000 + rng() * 460;
    const d = (7 + rng() * 11).toFixed(1), delay = (-rng() * 14).toFixed(1);
    s += '<circle class="co-fall" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="'
      + (0.9 + rng() * 2.1).toFixed(1) + '" fill="#ffeccd" opacity="'
      + (0.2 + rng() * 0.45).toFixed(2) + '" style="animation-duration:' + d
      + 's;animation-delay:' + delay + 's"/>';
  }
  return s + '</svg>';
}

/**
 * The fore plane: the doorway we are standing in, and one candle that has been
 * burning since last night and is nearly done.
 *
 * The flame follows the rules Task 2 measured — anchored at its own base with
 * `transform-box:fill-box`, shape and light on coprime periods, small
 * amplitude — and it is the only fire on this screen. It is going OUT, which
 * is the point of it: the room does not need it any more.
 */
function _dawnFore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<path d="M0 0h236v1500H0z" fill="#05070b"/>'
    + '<path d="M236 0h26v1500h-26z" fill="#10151d"/>'
    + '<path d="M960 0h140v1500H960z" fill="#05070b" opacity=".92"/>'
    // a sideboard corner at the low right, with the candlestick on it
    + '<path d="M876 1330h224v170H876z" fill="#0b0f15"/>'
    + '<path d="M876 1330h224v14H876z" fill="#252c37"/>'
    + '<path d="M932 1268h34v62h-34z" fill="#1d242e"/>'
    + '<ellipse cx="949" cy="1268" rx="30" ry="9" fill="#2c3542"/>'
    + '<rect x="941" y="1206" width="16" height="64" fill="#efe6cf" opacity=".9"/>'
    + '<path class="cv-flame" style="--lick:8.9s;--flare:3.1s"'
    + ' d="M949 1170c7 8 10.6 12.4 10.6 17.6a10.6 10.6 0 0 1-21.2 0c0-5.2 3.6-9.6 10.6-17.6z"'
    + ' fill="#ffe6b0" opacity=".82"/>'
    + '<circle class="co-glow" cx="949" cy="1188" r="52" fill="#ffdc9e" opacity=".2" filter="url(#coBloomSoft)"/>'
    + '</svg>';
}

/** The hero plate: the window wall, wide, with the sun just clear of the ridge. */
function _heroDawn(count) {
  const n = Math.max(2, Math.min(14, count || 8));
  let s = '<svg class="co-hero-scene" viewBox="0 0 1100 456" preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="coHeroSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0d1420"/><stop offset="48%" stop-color="#33455e"/>'
    + '<stop offset="78%" stop-color="#9c8b86"/><stop offset="100%" stop-color="#e2bd93"/>'
    + '</linearGradient></defs>'
    + '<rect width="1100" height="456" fill="url(#coHeroSky)"/>'
    + '<circle cx="548" cy="322" r="46" fill="#ffeec4" opacity=".85" filter="url(#coBloomSoft)"/>'
    + '<circle cx="548" cy="322" r="20" fill="#fff6e2"/>'
    + '<path d="M0 336 L184 296 L352 342 L548 288 L742 340 L920 300 L1100 344 V456 H0Z" fill="#1d2839"/>'
    // the room's own silhouette across the bottom: the table's near edge and
    // the backs of the chairs, so the plate is a room and not a landscape
    + '<path d="M0 424h1100v32H0z" fill="#05080d"/>';
  for (let i = 0; i < n; i++) {
    const x = 40 + (1020 / n) * i;
    s += '<path d="M' + x.toFixed(0) + ' 424 v-46 a16 16 0 0 1 32 0 v46z" fill="#05080d"/>';
  }
  return s + '</svg>';
}

/** The filter bank. Bloom only: this screen's surfaces are light, not stone. */
function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="coBloomSoft" x="-160%" y="-160%" width="420%" height="420%">'
    + '<feGaussianBlur stdDeviation="30"/></filter>'
    + '<filter id="coBloom" x="-120%" y="-120%" width="340%" height="340%">'
    + '<feGaussianBlur stdDeviation="10" result="b"/>'
    + '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>'
    + '</filter>'
    + '</defs></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VISUAL SYSTEM
// ══════════════════════════════════════════════════════════════════════
//
// Same three families as the two night screens. Everything else is this hour's.
//
// TWO LAYOUT RULES ARE NOT TASTE AND WERE MEASURED ON THE CONCLAVE:
//
//   * THE CLIP LIVES ON `.co-scenery`, NEVER ON THE SHELL. `overflow:hidden`
//     on the shell makes it a scroll container, which kills `position:sticky`
//     for every descendant. And that layer takes NO z-index: with `z-index:
//     auto` it is not a stacking context, so the grain still paints above the
//     body and the wash's blend still resolves against the shell's own ground.
//   * THE STICKY ELEMENT IS THE INNER PANEL, NOT THE RAIL. Sticky needs an
//     element SHORTER than its containing block. `#co-stage-inner` is also the
//     element the reveal handlers replace by id, so its position survives
//     every innerHTML swap.
//
// The 46px offset on every absolutely-positioned layer is the real VP's
// `.rp-nav` bar, which the standalone mockups do not have.
const CO_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.co-root{
  --co-night:#080c13;
  --co-room:#161d27;
  --co-room-2:#1d2632;
  --co-sky:#8fa6bf;
  --co-frost:#e9f0f5;
  --co-sun:#ffd9a0;
  --co-sun-hot:#fff2d6;
  --co-linen:#f0e9db;
  --co-linen-dim:rgba(240,233,219,.6);
  --co-slate:#54637a;
  --co-mute:#7d8ea3;
  --co-wax:#8e1526;
  --co-wax-hot:#c9283c;
  --co-rule:rgba(233,240,245,.16);
  --co-display:'Fraunces',Georgia,'Times New Roman',serif;
  --co-hand:'IM Fell English',Georgia,serif;
  --co-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  /* the shared portrait reads these; the morning answers in frost, not amber */
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--co-frost);
  font-family:var(--co-body);
  font-size:17px;line-height:1.6;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#000;
}
.co-root *{box-sizing:border-box}

/* ── SHELL — never full-screen; 1100px, centred ─────────────────────── */
.co-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--co-room);
  box-shadow:0 0 0 1px rgba(233,240,245,.09),0 0 90px rgba(0,0,0,.85);
  overflow:visible;
  transition:background 1.8s ease;
}
/* THE CLIP LAYER, AND IT MUST NOT TAKE A z-index — see the header. */
.co-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

.co-far,.co-mid,.co-fore{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};height:1500px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.co-wash,.co-vig,.co-grain{position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;pointer-events:none}
.co-far svg,.co-mid svg,.co-fore svg{position:absolute;inset:0;width:100%;height:100%}
.co-far {z-index:0;filter:blur(2.2px) saturate(.7) brightness(.86);opacity:.7}
.co-mid {z-index:1;filter:blur(.3px);opacity:.9}
.co-fore{z-index:2}
.co-wash{z-index:3}
.co-vig {z-index:4}
.co-grain{z-index:9}
.co-body{position:relative;z-index:5}
.co-far::after,.co-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:400px;
  background:linear-gradient(180deg,transparent,var(--co-room));
}
.co-wash{
  mix-blend-mode:screen;opacity:.5;
  transition:background 2s ease,opacity 2s ease;
  background:radial-gradient(78% 40% at 56% 24%,rgba(255,226,178,.2) 0%,transparent 62%);
}
.co-vig{
  background:
    radial-gradient(126% 84% at 52% 32%,transparent 0%,transparent 42%,rgba(4,6,10,.4) 74%,rgba(4,6,10,.84) 100%),
    linear-gradient(180deg,rgba(4,6,10,.66) 0%,transparent 15%,transparent 80%,rgba(4,6,10,.78) 100%);
  mix-blend-mode:multiply;
}
.co-grain{
  opacity:.11;mix-blend-mode:soft-light;
  background-image:var(--co-grain-src);background-size:210px 210px;
  animation:co-grainshift 1.3s steps(4) infinite;
}
@keyframes co-grainshift{
  0%{transform:translate(0,0)} 25%{transform:translate(5px,-4px)}
  50%{transform:translate(-4px,5px)} 75%{transform:translate(3px,3px)}
  100%{transform:translate(0,0)}
}

/* ── AMBIENT — dust FALLS here. The turret's embers rose. ───────────── */
.co-fall{animation:co-drift linear infinite}
@keyframes co-drift{
  0%{transform:translate(0,-320px);opacity:0}
  12%{opacity:.85}
  56%{transform:translate(-22px,60px);opacity:.5}
  84%{opacity:.25}
  100%{transform:translate(-40px,300px);opacity:0}
}
.co-shaft{animation:co-broaden 13.7s ease-in-out infinite alternate;transform-origin:50% 0}
@keyframes co-broaden{0%{opacity:.72}100%{opacity:1}}
.co-glow{animation:co-gutter 5.9s linear infinite}
@keyframes co-gutter{
  0%{opacity:.22} 17%{opacity:.13} 29%{opacity:.26} 41%{opacity:.1}
  58%{opacity:.24} 72%{opacity:.15} 88%{opacity:.25} 100%{opacity:.22}
}
/* THE FLAME, BY TASK 2'S RULES. transform-origin on an SVG element resolves
   against the VIEW BOX unless transform-box says otherwise, which is what put
   every candle's pivot a thousand units under its own wick. Shape and light on
   coprime periods, small amplitude, and the movement carried by the LIGHT. */
.cv-flame{
  transform-box:fill-box;transform-origin:50% 100%;
  animation:co-lick var(--lick,8.9s) linear infinite,
            co-flare var(--flare,3.1s) ease-in-out infinite;
}
@keyframes co-lick{
  0%{transform:skewX(0deg) scale(1,1)}
  11%{transform:skewX(-1.3deg) scale(.99,1.04)}
  22%{transform:skewX(.8deg) scale(1.02,.97)}
  31%{transform:skewX(-2deg) scale(.97,1.07)}
  43%{transform:skewX(.2deg) scale(1.01,1)}
  54%{transform:skewX(1.6deg) scale(1.03,.96)}
  63%{transform:skewX(-.5deg) scale(.99,1.04)}
  77%{transform:skewX(2.1deg) scale(1.02,.98)}
  89%{transform:skewX(-.9deg) scale(.99,1.05)}
  100%{transform:skewX(0deg) scale(1,1)}
}
@keyframes co-flare{
  0%{opacity:.84} 13%{opacity:.96} 26%{opacity:.68} 37%{opacity:.9}
  49%{opacity:.76} 61%{opacity:1} 74%{opacity:.62} 86%{opacity:.88}
  100%{opacity:.84}
}

/* ── PHASE ATMOSPHERE — THE ONE SCREEN THAT MOVES IN ONE DIRECTION ───
   It gets lighter. A morning does. The gap is the exception and it is a
   TEMPERATURE drop rather than a darkening: the light stays, and stops
   being warm. */
.co-shell[data-phase="still"]{background:#0c111a}
.co-shell[data-phase="still"] .co-wash{opacity:.24}
.co-shell[data-phase="still"] .co-far{filter:blur(3px) saturate(.4) brightness(.5)}

.co-shell[data-phase="stir"]{background:#121925}
.co-shell[data-phase="stir"] .co-wash{opacity:.44;
  background:radial-gradient(86% 44% at 56% 22%,rgba(255,218,164,.26) 0%,transparent 62%)}

.co-shell[data-phase="down"]{background:#1a2330}
.co-shell[data-phase="down"] .co-wash{opacity:.72;
  background:radial-gradient(100% 52% at 56% 20%,rgba(255,226,178,.34) 0%,transparent 64%)}

.co-shell[data-phase="count"]{background:#202b39}
.co-shell[data-phase="count"] .co-wash{opacity:.9;
  background:radial-gradient(112% 58% at 54% 18%,rgba(255,236,200,.36) 0%,transparent 66%)}

.co-shell[data-phase="gap"]{background:#1b2028}
.co-shell[data-phase="gap"] .co-wash{opacity:1;
  background:radial-gradient(96% 50% at 52% 16%,rgba(206,224,238,.34) 0%,transparent 60%)}
.co-shell[data-phase="gap"] .co-far{filter:blur(2.4px) saturate(.28) brightness(.72)}
.co-shell[data-phase="gap"] .co-vig{background:
  radial-gradient(92% 58% at 52% 30%,transparent 0%,transparent 26%,rgba(6,8,12,.56) 64%,rgba(6,8,12,.92) 100%)}

.co-shell[data-phase="told"]{background:#241a1e}
.co-shell[data-phase="told"] .co-wash{opacity:1;
  background:radial-gradient(120% 62% at 52% 16%,rgba(201,40,60,.22) 0%,transparent 62%)}

.co-shell[data-phase="day"]{background:#26303c}
.co-shell[data-phase="day"] .co-wash{opacity:1;
  background:radial-gradient(130% 66% at 52% 12%,rgba(255,242,214,.42) 0%,transparent 70%)}
.co-shell[data-phase="day"] .co-far{filter:blur(1.6px) saturate(.9) brightness(1.02);opacity:.86}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.co-hero{
  position:relative;height:456px;overflow:hidden;
  background:#070b12;border-bottom:1px solid rgba(233,240,245,.14);
}
.co-hero svg.co-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.co-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
.co-eyebrow{
  font-family:var(--co-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:#d8e4ef;opacity:.95;
  text-shadow:0 1px 2px rgba(0,0,0,1),0 2px 14px rgba(0,0,0,1);
  margin-bottom:2px;
}
/* THE LOCKUP. The same one the other two screens use: Fraunces 900 squeezed
   to .80 with a 1.3px stroke. Three screens, one logo. */
.co-title{
  display:inline-block;
  font-family:var(--co-display);font-weight:900;
  font-size:clamp(38px,6.6vw,80px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:var(--co-sun-hot);margin:10px 0 0;
  text-shadow:0 0 8px rgba(255,242,214,.45),0 0 30px rgba(255,217,160,.4),0 4px 20px rgba(0,0,0,.9);
}
.co-title-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 10px}
.co-title-rule i{display:block;height:1px;width:110px;
  background:linear-gradient(90deg,transparent,rgba(233,240,245,.5))}
.co-title-rule i:last-child{background:linear-gradient(270deg,transparent,rgba(233,240,245,.5))}
.co-sub{
  font-family:var(--co-hand);font-style:italic;font-size:18px;line-height:1.55;
  color:rgba(233,240,245,.86);max-width:620px;margin:0 auto;
  text-shadow:0 2px 12px rgba(0,0,0,.95);
}

/* ── OBSERVER STRIP ─────────────────────────────────────────────────── */
.co-head{padding:16px 34px;border-bottom:1px solid var(--co-rule);
  background:linear-gradient(180deg,rgba(8,12,19,.6),transparent)}
.co-observer{
  display:flex;align-items:center;gap:10px;
  font-family:var(--co-display);font-weight:600;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(233,240,245,.72);
}
.co-observer em{font-family:var(--co-body);font-style:italic;font-size:14px;
  letter-spacing:0;text-transform:none;color:var(--co-mute)}

/* ═══ THE TABLE, LAID — the sticky stage ═════════════════════════════ */
.co-stage{position:sticky;top:${TR_NAV_TOP};z-index:12;
  background:linear-gradient(180deg,rgba(8,12,19,.94),rgba(8,12,19,.7) 76%,transparent);
  padding:12px 22px 18px;backdrop-filter:blur(4px)}
.co-stage-bar{
  display:flex;flex-wrap:wrap;align-items:center;gap:9px 22px;
  padding:0 0 11px;margin-bottom:11px;border-bottom:1px solid var(--co-rule);
}
.co-stage-bit{display:inline-flex;align-items:center;gap:8px}
.co-stage-k{font-family:var(--co-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(233,240,245,.5)}
.co-stage-v{font-family:var(--co-display);font-weight:900;font-size:15px;color:var(--co-frost)}
.co-stage-v[data-hot="1"]{color:var(--co-wax-hot)}
.co-stage-say{flex:1 1 100%;font-family:var(--co-hand);font-style:italic;font-size:14px;
  color:var(--co-mute)}

/* THE TABLE IN PLAN. Rectangular, flat, orthographic — not the hall's ring.
   The unit is a PLACE SETTING and the face only appears when its owner has
   come down. */
.co-table{
  position:relative;border:1px solid rgba(233,240,245,.14);
  background:linear-gradient(180deg,rgba(41,32,22,.9),rgba(24,19,13,.94));
  padding:14px 16px;overflow:hidden;
}
.co-table::before{
  content:'';position:absolute;left:12%;right:12%;top:50%;height:34%;transform:translateY(-50%);
  background:var(--co-linen);opacity:.09;
  border-top:1px solid rgba(240,233,219,.18);border-bottom:1px solid rgba(240,233,219,.18);
}
.co-places{position:relative;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.co-place{
  position:relative;width:66px;padding:6px 2px 5px;text-align:center;
  border:1px solid rgba(233,240,245,.1);background:rgba(8,12,19,.42);
  transition:border-color .4s ease,background .4s ease,opacity .4s ease;
}
.co-place .cv-av{opacity:0;transform:translateY(-9px);transition:opacity .45s ease,transform .45s ease}
.co-place[data-down="1"]{border-color:rgba(255,226,178,.42);background:rgba(255,226,178,.07)}
.co-place[data-down="1"] .cv-av{opacity:1;transform:none}
.co-place[data-gap="1"]{border-color:var(--co-wax);background:rgba(142,21,38,.16)}
.co-place-set{display:block;height:22px;margin-bottom:3px;opacity:.72}
.co-place-nm{
  display:block;font-family:var(--co-display);font-weight:700;font-size:8px;
  letter-spacing:.06em;text-transform:uppercase;color:rgba(233,240,245,.52);
  margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.co-place[data-down="1"] .co-place-nm{color:var(--co-frost)}
.co-place[data-gap="1"] .co-place-nm{color:var(--co-wax-hot)}
.co-place-empty{
  display:block;font-family:var(--co-hand);font-style:italic;font-size:10px;
  color:rgba(233,240,245,.32);margin-top:2px;
}

/* ── THE STREAM ─────────────────────────────────────────────────────── */
.co-main{padding:26px 34px 80px;max-width:820px;margin:0 auto}

.co-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.co-beat.co-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:26px}

/* CARD PHYSICS: EVERYTHING COMES DOWN. The turret drew its cards out of the
   dark and the hall leant them in across the wood; a stair only goes one way. */
.co-beat.co-vis .co-card{animation:co-descend .48s cubic-bezier(.19,.9,.3,1) both}
.co-beat.co-vis[data-phase="gap"] .co-card{animation:co-chill .6s ease both}
.co-beat.co-vis[data-phase="told"] .co-card{animation:co-settle .52s ease both}
@keyframes co-descend{
  0%{opacity:0;transform:translateY(-26px)}
  70%{opacity:1;transform:translateY(3px)}
  100%{opacity:1;transform:none}
}
@keyframes co-chill{
  0%{opacity:0;filter:saturate(2) brightness(1.3)}
  100%{opacity:1;filter:none}
}
@keyframes co-settle{
  0%{opacity:0;transform:translateY(-14px) scale(.99)}
  100%{opacity:1;transform:none}
}
.co-beat.co-vis .co-host{animation:co-hostin .34s ease both}
@keyframes co-hostin{from{opacity:0}to{opacity:1}}

.co-card{
  position:relative;
  background:linear-gradient(178deg,rgba(28,37,49,.94),rgba(15,20,28,.96));
  border:1px solid rgba(233,240,245,.14);
  border-left:2px solid rgba(255,226,178,.4);
  padding:20px 24px 22px;
  box-shadow:0 16px 40px rgba(0,0,0,.42);
}
.co-card-label{
  display:flex;align-items:center;gap:9px;
  font-family:var(--co-display);font-weight:700;font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(233,240,245,.54);margin-bottom:9px;
}
.co-card-title{
  font-family:var(--co-display);font-weight:900;font-size:25px;line-height:1.16;
  letter-spacing:-.012em;color:var(--co-frost);margin:0 0 12px;
}
.co-card p{margin:0 0 11px;color:rgba(233,240,245,.88)}
.co-card p:last-child{margin-bottom:0}

.co-beat[data-phase="gap"] .co-card{border-left-color:var(--co-wax-hot)}
.co-beat[data-phase="told"] .co-card{border-left-color:var(--co-wax)}
.co-beat[data-phase="day"] .co-card{border-left-color:rgba(255,242,214,.6)}

/* the spoken line — IM Fell, and a face beside it */
.co-said{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:start;
  margin:14px 0 4px;padding:13px 0 0;border-top:1px dashed rgba(233,240,245,.16)}
.co-said-txt{font-family:var(--co-hand);font-style:italic;font-size:19px;line-height:1.5;
  color:var(--co-linen)}
.co-said cite{display:block;margin-top:6px;font-family:var(--co-display);font-weight:700;
  font-size:9px;letter-spacing:.26em;text-transform:uppercase;font-style:normal;
  color:rgba(233,240,245,.5)}

/* the row of people who have just come down */
.co-arrivals{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 2px}
.co-face-chip{display:inline-flex;align-items:center;gap:8px;padding:5px 11px 5px 5px;
  border:1px solid rgba(233,240,245,.16);background:rgba(8,12,19,.5)}
.co-face-nm{font-family:var(--co-display);font-weight:700;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(233,240,245,.82)}

/* THE GAP. One setting, blown up, with the cup turned over on it. */
.co-gap{
  display:grid;grid-template-columns:auto 1fr;gap:22px;align-items:center;
  margin:16px 0 4px;padding:20px 22px;
  background:linear-gradient(140deg,rgba(142,21,38,.2),rgba(10,13,19,.9));
  border:1px solid rgba(201,40,60,.42);
}
.co-gap-nm{font-family:var(--co-display);font-weight:900;font-size:30px;line-height:1.1;
  color:var(--co-frost);margin-bottom:5px}
.co-gap-verb{font-family:var(--co-display);font-weight:700;font-size:10px;letter-spacing:.34em;
  text-transform:uppercase;color:var(--co-wax-hot)}
.co-gap-cup{display:flex;align-items:center;justify-content:center;width:96px;height:96px;
  border:1px solid rgba(201,40,60,.5);background:rgba(142,21,38,.12)}

/* the counting strip */
.co-count{display:flex;flex-wrap:wrap;gap:8px 26px;margin:14px 0 2px;padding:13px 0 0;
  border-top:1px solid var(--co-rule)}
.co-count-bit{display:inline-flex;align-items:baseline;gap:9px}
.co-count-k{font-family:var(--co-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(233,240,245,.46)}
.co-count-v{font-family:var(--co-display);font-weight:900;font-size:22px;color:var(--co-sun)}
.co-count-v[data-hot="1"]{color:var(--co-wax-hot)}

/* ── HOST BAND ──────────────────────────────────────────────────────── */
.co-host{
  position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:16px 24px;margin-bottom:16px;
  background:linear-gradient(100deg,rgba(8,12,19,.95),rgba(46,58,74,.8) 52%,rgba(8,12,19,.95));
  border-top:1px solid rgba(233,240,245,.34);border-bottom:1px solid rgba(233,240,245,.34);
  box-shadow:inset 0 0 40px -8px rgba(255,226,178,.16),0 12px 30px rgba(0,0,0,.44);
}
.co-host::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 30%,rgba(255,236,200,.12) 50%,transparent 70%);
  animation:co-sweep 12.5s ease-in-out infinite alternate;
}
@keyframes co-sweep{0%{transform:translateX(-60%)}100%{transform:translateX(60%)}}
.co-host-name{
  font-family:var(--co-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--co-sun-hot);margin-bottom:6px;
  display:flex;align-items:center;gap:8px;
}
.co-host-line{font-family:var(--co-hand);font-style:italic;font-size:19px;line-height:1.5;
  color:var(--co-linen)}

/* the low murmur between cards */
.co-murmur{font-family:var(--co-hand);font-style:italic;font-size:15px;
  color:rgba(233,240,245,.44);text-align:center;margin:14px 0 0;padding:0 30px}

/* ── STICKY CONTROLS ────────────────────────────────────────────────── */
.co-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(8,12,19,.1),rgba(8,12,19,.98) 44%);
  border-top:1px solid var(--co-rule);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.co-btn{
  font-family:var(--co-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(233,240,245,.14),rgba(233,240,245,.03));
  color:var(--co-frost);
  border:1px solid rgba(233,240,245,.36);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(255,242,214,.16);
}
.co-btn:hover{background:rgba(233,240,245,.22);color:var(--co-sun-hot);
  box-shadow:0 0 26px rgba(255,226,178,.22),inset 0 1px 0 rgba(255,242,214,.3)}
.co-btn[disabled],.co-btn.co-dim{opacity:.3;cursor:default;pointer-events:none}
.co-counter{
  font-family:var(--co-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:var(--co-mute);min-width:86px;text-align:center;
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
.co-none{max-width:620px;margin:0 auto;padding:64px 34px 90px;text-align:center}
.co-none-h{font-family:var(--co-display);font-weight:900;font-size:32px;letter-spacing:-.01em;
  color:var(--co-frost);margin:22px 0 16px}
.co-none p{font-family:var(--co-hand);font-size:19px;line-height:1.65;
  color:rgba(233,240,245,.74);margin:0 auto 14px;max-width:520px}

/* ── RESPONSIVE ─────────────────────────────────────────────────────── */
@media(max-height:720px){.co-stage{position:static}}
@media(max-width:900px){
  .co-stage{position:static}
  .co-hero{height:380px}
  .co-place{width:58px}
}
@media(max-width:700px){
  .co-main{padding:24px 18px 56px}
  .co-head{padding:14px 20px}
  .co-hero{height:320px}
  .co-hero-lock{padding:0 20px 22px}
  .co-host{grid-template-columns:1fr;gap:10px}
  .co-gap{grid-template-columns:1fr;gap:14px}
  .co-place{width:52px}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .co-root *,.co-root *::before,.co-root *::after{animation:none!important;transition:none!important}
  .co-beat.co-vis .co-card,.co-beat.co-vis .co-host{opacity:1;transform:none;filter:none}
  /* the place settings are FILLED by a transition, so switching it off has to
     put the end state back or nobody ever comes down */
  .co-place[data-down="1"] .cv-av{opacity:1;transform:none}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS — four variants minimum per slot, picked off a hash of the facts
// ══════════════════════════════════════════════════════════════════════

const HOST_LINES = {
  open: [
    'Morning. Somebody in this room slept extremely well.',
    'Good morning. I hope you all had a restful night. One of you certainly did.',
    'Morning, all. Come down. Sit where you like.',
    'Good morning. The kettle is on and the arithmetic is not in your favour.',
  ],
  gap: [
    'Look around you. There is a chair back this morning, and it is not coming forward again.',
    'Take a moment. Count. It will not take you long any more.',
    'One of you is not coming down. I think most of you already know which one.',
    'Before anybody sits: there is a cup turned over on this table.',
  ],
  whole: [
    'Nobody is missing. Sit with that for a second, because it does not happen often.',
    'Everybody came down. Every single one of you. Make of that what you will.',
    'A full table. That is not luck and it is not kindness.',
    'Count again. You will get the same answer, and it should worry somebody.',
  ],
  arrive: [
    'Welcome to the castle. Some of you will not see the end of the week.',
    'Come in. Leave your coats. You will not need everything you brought.',
    'You are all very welcome. Not all of you are very honest.',
    'Come through. From this moment on, one of the friendliest faces here is lying to you.',
  ],
  day: [
    'The day starts whether you are ready for it or not. Outside, in ten minutes.',
    'Eat something. You will want it later.',
    'Right. On your feet. The morning is not going to wait for you to feel better.',
    'That is the news. The rest of the day is yours to ruin.',
  ],
};

const STILL_TEXT = [
  'The castle at this hour is only weather and stone. Something in the roof shifts, gives up '
  + 'and settles again. The fire in the long room went out at some point in the night and '
  + 'nobody was awake to see it happen.',
  'Nothing has happened yet. The corridors are grey, the glass is cold to the touch, and the '
  + 'long room is exactly as the staff left it: laid, straightened, and completely still.',
  'It is the quietest hour this building has. Whatever was decided upstairs was decided hours '
  + 'ago, and the stone has already forgotten it.',
  'Somewhere above, a door that was not shut properly moves an inch on its own. The long room '
  + 'holds its breath the way empty rooms do.',
];

const STIR_TEXT = [
  'The light comes up over the water first and gets to the glass last. The east windows fill '
  + 'from the bottom, and the shafts land across the boards one after another.',
  'First light. Not sunrise — the hour before it, when the sky goes from black to blue and '
  + 'the hills come back one ridge at a time.',
  'Outside, the water turns from ink to pewter. The three tall windows take the colour in '
  + 'order, left to right, and the room stops being dark without ever becoming bright.',
  'The sun is not up yet but the sky has already decided. Somewhere on the second floor a '
  + 'tap runs, and the building starts.',
];

const DOWN_TEXT = [
  'Footsteps on the stair, and they carry. {who} is down first, still in last night\'s jumper.',
  '{who} comes down before anyone else and does the thing everybody does: looks at the table, '
  + 'not at the door.',
  'The stair gives them away long before they reach the bottom. {who} arrives, and stops one '
  + 'step short of the floor to look.',
  '{who} is down early. Not rested — early. There is a difference and the room can see it.',
];
const DOWN_MORE = [
  'Then the rest of it, in twos and threes.',
  'After that they come down in clusters, the way people do when nobody wants to arrive alone.',
  'The others follow within a few minutes of each other, which is its own kind of decision.',
  'The stair does not stop for a while.',
];
const DOWN_SAID = [
  'Did anyone sleep?',
  'I heard something. I am not saying I heard anything, but I heard something.',
  'Is that everyone?',
  'Do not tell me. Let me count first.',
  'I did the thing where you lie awake deciding what you are going to say down here.',
  'Whoever is doing this has a very ordinary face.',
];
const ARRIVE_SAID = [
  'It is so much bigger than it looked in the pictures.',
  'I have decided already. I am reading nobody and trusting everybody, and that is the plan.',
  'Somebody in this room is going to ruin my week.',
  'Right. Faces. Names. Go.',
];

const COUNT_TEXT = [
  'They start counting without admitting they are counting. Eyes go round the table and back '
  + 'again, which is the same sum done twice by people hoping for a different answer.',
  'The room does the arithmetic it now does every morning: how many chairs, how many people, '
  + 'and how long it takes for those two numbers to disagree.',
  'Nobody says the number out loud. Everybody has it.',
  'There is a particular quiet that happens when a room counts itself. This is it.',
];

const GAP_TEXT = [
  'And there it is. A place laid, a plate untouched, and the cup turned face down on the '
  + 'linen — which is the thing the staff do, quietly, before anybody else is up.',
  'One setting is exactly as it was left last night, except for the cup, which is upside down. '
  + 'That is how this castle says it.',
  'The gap is not dramatic. It is a chair still tucked in and a cup the wrong way up, and it '
  + 'takes the room about four seconds to find it.',
  'Everything on that place is where the staff put it. Nothing has been moved. The cup is '
  + 'over, and the room goes very quiet all at once.',
];
const GAP_SAID = [
  'No. No, no, no.',
  'They were sitting right there. Last night. Right there.',
  'I spoke to {them} at the door. I said goodnight.',
  'Who else is not here? Look up. Everyone look up.',
];
const GAP_DOUBLE = [
  'And then a second cup, four places along, turned the same way.',
  'Somebody counts a second time and finds another one. Two settings, two cups over.',
  'It is not one place. Somebody says so, out loud, before anybody is ready for it.',
  'Then the sound of a chair being pushed back too fast, because there is another one.',
];

const TOLD_TEXT = [
  'It is put into the format\'s own word a moment later, and the word lands very differently '
  + 'out loud than it reads on paper. {Nm}.',
  'It is said properly, once, and then not again. {Nm}. The room takes it standing up.',
  'The confirmation is short. It always is. {Nm}, and then nothing for a while.',
  'Nobody argues with it. There is nothing in it to argue with. {Nm}, and that is the fact of '
  + 'the morning.',
];

const AFTER_TEXT = [
  'What happens next is the part nobody rehearses. Somebody starts a sentence about last night '
  + 'and abandons it. Somebody else pours a cup for a person who is not there and puts it down '
  + 'very carefully.',
  'The room reorganises itself around the gap without anybody deciding to. Chairs move a few '
  + 'inches. Nobody sits in the empty place and nobody moves it either.',
  'There are two kinds of people at this table now and they look identical: the ones who are '
  + 'shaken, and the ones who are doing shaken very well indeed.',
  'Somebody says the thing everybody is thinking, which is that whoever did it is sitting here '
  + 'eating breakfast, and the sentence just hangs there over the toast.',
];

const WHOLE_TEXT = [
  'Everybody comes down. Every single place fills, and the room does not know what to do with '
  + 'that at all — a full table this far in is not relief, it is a question.',
  'Nobody is missing. It takes the room two full counts to believe it, and then a much longer '
  + 'silence to work out what it means.',
  'The table fills. All of it. Somewhere behind that is a decision that did not survive '
  + 'contact with the night, and nobody at this table can see it.',
  'A full table. The relief lasts about eleven seconds, which is how long it takes somebody to '
  + 'realise that a night with nothing in it is still a night somebody spent choosing.',
];
const WHOLE_AUDIENCE = [
  'A name WAS written last night. You watched it happen. Something between that room and this '
  + 'one ate it, and not one person at this table will ever be told so.',
  'The turret chose. The morning refused. Everyone here is going to spend the day reading a '
  + 'blank page as if it said something.',
  'There is a decision missing from this table and only the people at home know where it went.',
  'You know what was supposed to happen this morning. They do not, and they never will.',
];

const DAY_TEXT = [
  'And then, because there is nothing else to do with a morning, they eat. The day has a shape '
  + 'and the shape does not care.',
  'Plates get filled. Conversation restarts at half volume. Whatever this room is going to be '
  + 'today, it starts now.',
  'By the time the pots are empty the room has already begun the other thing it does, which is '
  + 'deciding, very quietly, who is next.',
  'Somebody makes a joke and it lands, which is the most frightening thing to happen all '
  + 'morning.',
];

const MURMUR = [
  'the pipes ticking as the building warms',
  'somebody laughing in the corridor and stopping',
  'a chair leg on stone, twice',
  'the gulls starting up over the water',
  'a spoon against a cup, held too long',
  'wind finding the gap in the east window',
  'a door closing two floors up',
  'the kettle, and nobody moving to get it',
];

// ══════════════════════════════════════════════════════════════════════
// CARD PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function _card(title, label, ic, inner) {
  return '<div class="co-card">'
    + '<div class="co-card-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="co-card-title">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _said(who, line) {
  return '<div class="co-said">' + _av(who, 44)
    + '<div><div class="co-said-txt">&ldquo;' + line + '&rdquo;</div>'
    + '<cite>' + _esc(who) + '</cite></div></div>';
}
function _murmur(key) {
  return '<div class="co-murmur">' + _pick(MURMUR, key) + '</div>';
}
function _hostBand(line) {
  return '<div class="co-host">' + _hostAv(52)
    + '<div><div class="co-host-name">' + _ic('bell', 12) + _esc(_host().name) + '</div>'
    + '<div class="co-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}
function _faceChip(name, size) {
  return '<span class="co-face-chip">' + _av(name, size || 26)
    + '<span class="co-face-nm">' + _esc(name) + '</span></span>';
}
function _countStrip(bits) {
  return '<div class="co-count">' + bits.map(b =>
    '<span class="co-count-bit"><span class="co-count-k">' + _esc(b[0]) + '</span>'
    + '<span class="co-count-v"' + (b[2] ? ' data-hot="1"' : '') + '>' + _esc(b[1])
    + '</span></span>').join('') + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the observer contract and the exits rule, in one place
// ══════════════════════════════════════════════════════════════════════

/**
 * WHAT THIS MORNING IS, AND WHAT THIS OBSERVER MAY BE TOLD ABOUT IT.
 *
 * THREE THINGS HAPPEN HERE AND NOWHERE ELSE.
 *
 * 1. WHO IS IN THE ROOM. It is the cast MINUS everybody already gone, and
 *    `goneBefore` is built with `roundExits()` — the registry's own rule, which
 *    knows this show has two doors. `eliminated` is the public vote alone;
 *    Plan 7 found nine readers asking it and counting the other door's
 *    departures as still playing. Nothing downstream re-derives the room.
 * 2. WHAT THE MORNING IS ABOUT. `roundExits()` again, over the PREVIOUS row's
 *    own `exits[]`, keeping only the channel the room is learning about — a
 *    vote of the room happened in front of the room and is not news over
 *    breakfast.
 * 3. THE AUDIENCE'S PRIVILEGE, STRIPPED RATHER THAN HIDDEN. On a night the
 *    pact struck and a relic ate it, everybody comes down on every layer;
 *    only the people watching at home know a name was chosen at all. The flag
 *    is deleted for a `player:` observer, so the card that would print it has
 *    nothing to print rather than a condition to obey.
 */
function _view(ep, observer) {
  const rec = ep && ep.tr;
  const dawn = rec && rec.dawn;
  if (!rec || !dawn) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;

  const gone = new Set((rec.goneBefore || []).map(g => g.name));
  const room = (rec.cast || []).filter(n => !gone.has(n));

  // The doors last night used, in the show's own words. The vote is dropped:
  // it is not a discovery, it happened at the table with the room watching.
  const V = _verbs();
  const lastNight = roundExits({ exits: dawn.lastNight || [] }, TR);
  const missing = lastNight.filter(x => x.verb === V.night);

  return {
    // The record's own episode number, never the row's `num`: `num` is the
    // VP's reveal key and a caller may renumber a copy of a row to get a
    // fresh one.
    ep: rec.ep != null ? rec.ep : (ep.num || 0),
    ofEp: dawn.ofEp == null ? null : dawn.ofEp,
    // The first morning of the season: no previous night, so no gap. The
    // branch is on this rather than on `ep === 1`, because an episode number
    // is a thing somebody renumbers.
    arrival: dawn.ofEp == null,
    isAudience,
    watcher,
    // Was this player in the room to see it? A player who has already left
    // reads the morning the way the country does.
    present: watcher ? room.indexOf(watcher) >= 0 : true,
    // The seating plan, and the reason the stage keeps it: a place that is
    // never going to be used still belongs where its owner sat, not appended
    // to the end of the table because it was discovered last.
    cast: [...(rec.cast || [])],
    room,
    gone: (rec.goneBefore || []).map(g => ({ ...g })),
    missing,
    // AUDIENCE ONLY — see the note above.
    blocked: isAudience ? !!dawn.blocked : false,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════
//
// `phase` is the hour's temperature and the card's physics. `meta` is what the
// stage gates on — the beat's ROLE, derived here rather than pattern-matched
// out of the markup later, because a stage that greps its own HTML goes wrong
// the first time a title is edited and goes wrong in the direction of showing
// the reader a cup that is turned over three beats early.

/** The order people appear on the stair. Stable per morning, never random. */
function _arrivalOrder(v) {
  return [...v.room].sort((a, b) =>
    _hash('co|stair|' + v.ep + '|' + a) - _hash('co|stair|' + v.ep + '|' + b));
}

function _buildBeats(v) {
  const beats = [];
  const key = 'co|' + v.ep + '|' + v.missing.map(m => m.name).join(',');
  // What has already been said at this table this morning. See `_pickAway`.
  const said = new Set();
  const push = (phase, html, hostSlot, meta) =>
    beats.push({ phase, html, hostSlot: hostSlot || null, meta: meta || null });
  const order = _arrivalOrder(v);

  // ── the building, before anybody ────────────────────────────────────
  push('still', _card(
    v.arrival ? 'Before Any Of Them' : 'The Hour Before',
    'First light', 'window',
    '<p>' + _pick(STILL_TEXT, key + '|still') + '</p>'
    + _murmur(key + '|m0')), null, { kind: 'still', down: [] });

  push('stir', _card('The East Windows', 'Dawn', 'sun',
    '<p>' + _pick(STIR_TEXT, key + '|stir') + '</p>'), null,
  { kind: 'stir', down: [] });

  // ── the castle comes down ───────────────────────────────────────────
  //
  // Three arrival beats regardless of the size of the room, so the rhythm of
  // the morning is the same on night one and at a table of four. The GROUPS
  // change size, not the number of beats — a screen whose length tracks the
  // cast reads as long early and abrupt late, which is backwards.
  const groups = [];
  if (order.length) {
    const rest = order.slice(1);
    const half = Math.ceil(rest.length / 2);
    groups.push(order.slice(0, 1), rest.slice(0, half), rest.slice(half));
  }
  const arrivedSoFar = [];
  groups.forEach((g, gi) => {
    if (!g.length) return;
    arrivedSoFar.push(...g);
    const who = g[0];
    const heard = _pickAway(v.arrival ? ARRIVE_SAID : DOWN_SAID,
      key + '|said|' + gi + '|' + who, said);
    const body = gi === 0
      ? '<p>' + _fill(_pick(DOWN_TEXT, key + '|down|' + who), { who: _esc(who) }) + '</p>'
        + _said(who, _esc(heard))
      : '<p>' + _pick(DOWN_MORE, key + '|more|' + gi) + '</p>'
        + '<div class="co-arrivals">' + g.map(n => _faceChip(n, 26)).join('') + '</div>'
        + _said(who, _esc(heard));
    push('down', _card(
      gi === 0 ? (v.arrival ? 'Through The Door' : 'Down First')
        : gi === 1 ? 'And Then The Rest' : 'The Last Of Them',
      gi === 0 ? 'The stair' : 'Arrivals', gi === 0 ? 'stair' : 'head', body),
    gi === 0 ? (v.arrival ? 'arrive' : 'open') : null,
    { kind: 'down', down: [...arrivedSoFar] });
  });

  // ── the room counts itself ──────────────────────────────────────────
  const seatBits = [
    ['At the table', String(v.room.length)],
    ['Places laid', String(v.room.length + v.missing.length)],
  ];
  if (!v.arrival) seatBits.push(['Chairs back', String(v.gone.length), true]);
  push('count', _card(
    v.arrival ? 'Strangers, And One Secret' : 'The Room Counts Itself',
    'The count', 'plate',
    '<p>' + _pick(COUNT_TEXT, key + '|count') + '</p>' + _countStrip(seatBits)),
  null, { kind: 'count', down: [...v.room] });

  // ── the gap, or the absence of one ──────────────────────────────────
  if (v.missing.length) {
    const m = v.missing[0];
    const pr = _pr(m.name);
    let inner = '<p>' + _pick(GAP_TEXT, key + '|gap') + '</p>'
      + '<div class="co-gap"><span class="co-gap-cup">'
      + _ic('cupdown', 52, 'rgba(201,40,60,.85)') + '</span>'
      + '<div><div class="co-gap-nm">' + _esc(m.name) + '</div>'
      + '<div class="co-gap-verb">' + _esc(_cap(m.verb)) + ' &middot; overnight</div></div></div>';
    if (v.missing.length > 1) {
      inner += '<p>' + _pick(GAP_DOUBLE, key + '|dbl') + '</p>'
        + '<div class="co-arrivals">'
        + v.missing.slice(1).map(x => _faceChip(x.name, 26)).join('') + '</div>';
    }
    inner += _said(order[Math.min(1, order.length - 1)] || order[0] || m.name,
      _fill(_pick(GAP_SAID, key + '|gapsaid'), { them: _esc(pr.obj) }));
    push('gap', _card('The Cup Is Turned Over', 'The gap', 'cupdown', inner),
      'gap', { kind: 'gap', down: [...v.room], gap: v.missing.map(x => x.name) });

    push('told', _card('Said Out Loud, Once', 'Confirmed', 'bell',
      '<p>' + _fill(_pick(TOLD_TEXT, key + '|told'),
        { Nm: _esc(m.name) + ' was ' + _esc(m.verb) }) + '</p>'
      + (v.missing.length > 1
        ? '<p>And then the second name, in the same three words, and the room hears that one '
          + 'from a long way off.</p>'
        : '')
      + _countStrip([['Standing', String(v.room.length)],
        ['Chairs back', String(v.gone.length), true]])),
    null, { kind: 'told', down: [...v.room], gap: v.missing.map(x => x.name) });

    push('told', _card('What A Room Does With It', 'After', 'cup',
      '<p>' + _pick(AFTER_TEXT, key + '|after') + '</p>' + _murmur(key + '|m1')),
    null, { kind: 'after', down: [...v.room], gap: v.missing.map(x => x.name) });
  } else if (!v.arrival) {
    let inner = '<p>' + _pick(WHOLE_TEXT, key + '|whole') + '</p>'
      + _countStrip([['At the table', String(v.room.length)],
        ['Places laid', String(v.room.length)]]);
    // THE ONE LINE THIS SCREEN HAS THAT A PLAYER MUST NOT SEE, and it is only
    // ever built when `_view` left the flag on the view.
    if (v.blocked) {
      inner += '<p class="co-murmur">' + _pick(WHOLE_AUDIENCE, key + '|blocked') + '</p>';
    }
    push('count', _card('Nobody Is Missing', 'A full table', 'cup', inner),
      'whole', { kind: 'whole', down: [...v.room] });
  }

  // ── and the day starts ──────────────────────────────────────────────
  push('day', _card(
    v.arrival ? 'Day One' : 'The Day Starts Anyway', 'Onward', 'sun',
    '<p>' + _pick(DAY_TEXT, key + '|day') + '</p>'), 'day',
  { kind: 'day', down: [...v.room], gap: v.missing.map(x => x.name) });

  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE TABLE, LAID — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Its data lives on `window.__trColdOpen` because a <script> tag inside
// innerHTML does not execute, so the build function is the only thing that can
// put it there. `stepMeta` is what it reads: the ROLE of every beat and who
// has come down by it, in order, so the table can be filled without
// re-deriving the stream or grepping its own markup.

/** One place setting, drawn: plate, knife, cup. */
function _setting(down, gap) {
  const c = gap ? 'rgba(201,40,60,.8)' : down ? 'rgba(255,236,200,.7)' : 'rgba(233,240,245,.24)';
  return '<span class="co-place-set">'
    + '<svg width="46" height="22" viewBox="0 0 46 22" fill="none" aria-hidden="true">'
    + '<circle cx="20" cy="11" r="8.4" stroke="' + c + '" stroke-width="1.2"/>'
    + '<circle cx="20" cy="11" r="5" stroke="' + c + '" stroke-width=".7" opacity=".6"/>'
    + '<path d="M32.4 3.6v14.8" stroke="' + c + '" stroke-width="1.2"/>'
    + (gap
      // the cup, face down: a shape with no opening drawn on it
      ? '<path d="M38.2 14.2h6.4V9.6a3.2 3.2 0 0 0-6.4 0z" fill="rgba(201,40,60,.35)" stroke="'
        + c + '" stroke-width="1.1"/><path d="M37 14.4h8.8" stroke="' + c + '" stroke-width="1.3"/>'
      : '<path d="M38.2 7.4h6.4v4.4a3.2 3.2 0 0 1-6.4 0z" stroke="' + c + '" stroke-width="1.1"/>')
    + '<path d="M6.6 4.2v13.6" stroke="' + c + '" stroke-width="1" opacity=".7"/>'
    + '</svg></span>';
}

function _stage(state, idx) {
  const v = state.v;
  const meta = state.stepMeta.slice(0, Math.max(0, idx + 1));
  const last = meta.length ? meta[meta.length - 1] : null;
  const down = new Set((last && last.down) || []);
  // The gap is only ever drawn once the reader has reached the beat that finds
  // it. A stage that knows the ending is a stage that tells it.
  const gapShown = meta.some(m => m && (m.kind === 'gap' || m.kind === 'told'
    || m.kind === 'after' || (m.kind === 'day' && (m.gap || []).length)));
  const gap = new Set(gapShown ? ((last && last.gap) || []) : []);
  const wholeShown = meta.some(m => m && m.kind === 'whole');

  const label = gapShown ? 'A cup turned over'
    : wholeShown ? 'A full table'
      : (v.room.length && down.size >= v.room.length) ? 'Everybody is down'
        : down.size ? 'Coming down' : 'Before anybody';
  const say = gapShown
    ? 'The staff turn the cup before anybody is up. It is the only announcement this castle makes.'
    : wholeShown
      ? 'Every place filled. A night with nothing in it is still a night somebody spent choosing.'
      : down.size ? 'They arrive one at a time and start counting immediately.'
        : 'Laid for everybody who went to bed.';

  let out = '<div class="co-stage-bar">'
    + '<span class="co-stage-bit">' + _ic('sun', 12, 'rgba(255,226,178,.7)')
    + '<span class="co-stage-k">Morning</span>'
    + '<span class="co-stage-v">' + (v.ep || 1) + '</span></span>'
    + '<span class="co-stage-bit"><span class="co-stage-k">' + _esc(label) + '</span></span>'
    + '<span class="co-stage-bit">' + _ic('head', 12, 'rgba(233,240,245,.55)')
    + '<span class="co-stage-k">Down</span>'
    + '<span class="co-stage-v">' + down.size + ' / ' + v.room.length + '</span></span>';
  if (gap.size) {
    out += '<span class="co-stage-bit">' + _ic('cupdown', 12, 'rgba(201,40,60,.85)')
      + '<span class="co-stage-k">Not coming down</span>'
      + '<span class="co-stage-v" data-hot="1">' + gap.size + '</span></span>';
  }
  out += '<span class="co-stage-say">' + _esc(say) + '</span></div>';

  // THE TABLE ITSELF. Every place laid this morning — the room, plus the
  // settings that will not be used, which are only added once the reader has
  // reached the beat that finds them. IN SEATING ORDER, which is cast order:
  // appending the empty setting to the end of the table put the one place the
  // screen is about in the last chair every single morning.
  const inRoom = new Set(v.room);
  const laid = (v.cast || []).filter(n => inRoom.has(n) || gap.has(n));
  out += '<div class="co-table"><div class="co-places">'
    + laid.map(n => {
      const isGap = gap.has(n);
      const isDown = !isGap && down.has(n);
      return '<span class="co-place" data-down="' + (isDown ? 1 : 0) + '"'
        + (isGap ? ' data-gap="1"' : '') + ' data-name="' + _esc(n) + '">'
        + _setting(isDown, isGap)
        + _av(n, 30)
        + '<span class="co-place-nm">' + _esc(n) + '</span>'
        + (isGap ? '<span class="co-place-empty">not down</span>' : '')
        + '</span>';
    }).join('')
    + '</div></div>';
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'cold-open-' + (epNum || 0); }
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
    const el = document.getElementById('co-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('co-vis'); else el.classList.remove('co-vis');
  }
  const counter = document.getElementById('co-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('co-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.co-btn').forEach(b => b.classList.toggle('co-dim', done));
  }
  const shell = document.getElementById('co-shell-' + suffix);
  const last = document.getElementById('co-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase', last.getAttribute('data-phase') || 'down');
  if (scroller) scroller.scrollTop = top;
}

function _updateStage(epNum, idx) {
  const el = document.getElementById('co-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trColdOpen) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _stage(state, idx);
}

/**
 * Bring the new beat into view, UNDER the table rather than behind it.
 *
 * The same measurement the Round Table's stage needed and for the same reason:
 * `block:'center'` puts the beat in the middle of the viewport, which is
 * inside a sticky panel whose height moves with the size of the room.
 */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('co-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trColdOpenRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('co-step-' + suffix + '-' + st.idx));
  _updateStage(epNum, st.idx);
}

export function trColdOpenRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateStage(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildColdOpen(ep, observer)` — the morning the episode opens on.
 *
 * `ep` is an `episodeHistory` row carrying `tr.dawn` and `tr.cast`, written by
 * `_recordEpisode` in js/tr/headless.js. `observer` is `'audience'` or
 * `'player:<Name>'`; see `_view` for exactly what the difference is.
 */
export function rpBuildColdOpen(ep, observer = 'audience') {
  const suffix = 'coldopen';
  const vars = '--co-grain-src:' + _noiseTile('0.9', 4, 41, 0.4, 200) + ';';
  const css = '<style>' + CO_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v || !v.room.length) {
    return '<div class="co-root" style="' + vars + '">' + css
      + '<div class="co-shell" data-phase="still"><div class="co-body"><div class="co-none">'
      + _ic('window', 92, 'rgba(233,240,245,.3)')
      + '<div class="co-none-h">No Morning To Draw</div>'
      + '<p>This episode carries no record of the hour it opened on.</p>'
      + '</div></div></div></div>';
  }

  const beats = _buildBeats(v);
  const total = beats.length;
  const epNum = ep.num || v.ep || 0;
  // THE SEED FOR THE WRITTEN LINES IS THE SEASON'S NUMBER, NOT THE ROW'S KEY.
  // `num` is the VP's key -- js/tr/headless.js says so where it writes the
  // number twice, and a caller is free to renumber a COPY of a row to get a
  // fresh reveal state, which is exactly what the text backlog does. Anything
  // that decides what the screen SAYS has to come off the record instead, or
  // the transcript quotes a host line the screen never spoke.
  const seedEp = v.ep != null ? v.ep : epNum;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trColdOpen = window.__trColdOpen || {};
    window.__trColdOpen[epNum] = state;
  }

  // THE OBSERVER STRIP CARRIES THE LAYER. Breakfast is public and nearly all
  // of it is the same on both, so the strip has to say which one is being
  // drawn or the difference is invisible.
  const observerBadge = v.isAudience
    ? '<div class="co-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; you know what happened upstairs; '
      + 'nobody at this table does</em></div>'
    : '<div class="co-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; '
      + (v.present ? 'you came down this morning like everybody else, and you know exactly '
        + 'as much as the room does'
        : 'this player was already gone, and hears about this morning the way the country did')
      + '</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED. `.co-beat` is
  // `height:0` until `.co-vis` is on it and `.co-vis` is only ever added by
  // `_reapplyVisibility`, which only runs from a click — so a builder emitting
  // the bare class hands back a screen whose stream is collapsed until the
  // reader presses something, with the counter under it already claiming
  // "1 / 9". The Round Table is where this pattern comes from.
  const stream = beats.map((b, i) =>
    '<div class="co-beat' + (i <= st.idx ? ' co-vis' : '')
    + '" id="co-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + (b.hostSlot ? _hostBand(_esc(_pick(HOST_LINES[b.hostSlot],
      'co|host|' + b.hostSlot + '|' + seedEp))) : '')
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="co-root" style="' + vars + '">' + css
    + '<div class="co-shell" id="co-shell-' + suffix + '" data-phase="' + beats[0].phase + '">'
    // EVERY PLANE AND THE GRAIN INSIDE ONE CLIP LAYER, and that layer takes no
    // z-index — see the header for both halves of why.
    + '<div class="co-scenery" aria-hidden="true">'
    + '<div class="co-far">' + _dawnFar() + '</div>'
    + '<div class="co-mid">' + _dawnMid(epNum + '|' + v.room.length) + '</div>'
    + '<div class="co-fore">' + _dawnFore() + '</div>'
    + '<div class="co-wash"></div>'
    + '<div class="co-vig"></div>'
    + '<div class="co-grain"></div>'
    + '</div>'
    + '<div class="co-body">'
    + '<div class="co-hero">' + _heroDawn(v.room.length)
    + '<div class="co-hero-lock">'
    // TASK 7, WHEN YOU WIRE THE EPISODE HISTORY: "Morning 3" and not
    // "Season I · Morning III", for the same reason the other two screens say
    // "Night 3" and "Evening 3" — the episode record carries no season number
    // and inventing one would be a fact the screen does not have.
    + '<div class="co-eyebrow">The Traitors &middot; Morning ' + (v.ep || epNum) + '</div>'
    + '<h1 class="co-title">' + (v.arrival ? 'ARRIVAL' : 'BREAKFAST') + '</h1>'
    + '<div class="co-title-rule"><i></i>' + _icon('seal', 40, '#8e1526') + '<i></i></div>'
    + '<p class="co-sub">'
    + (v.arrival
      ? 'They come up the drive not knowing each other and walk out of this room knowing one '
        + 'thing between them: somebody here has already been given a secret.'
      : 'The castle comes down one at a time, and the first thing anybody learns all day is '
        + 'who did not.')
    + '</p></div></div>'
    + '<header class="co-head">' + observerBadge + '</header>'
    // THE TABLE, STUCK UNDER THE NAV. It is the sticky element AND the element
    // the reveal handlers replace by id — the arrangement both earlier screens
    // ended up in, for the two reasons the header gives.
    + '<div class="co-stage" id="co-stage-inner">' + _stage(state, st.idx) + '</div>'
    + '<main class="co-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="co-controls" id="co-controls-' + suffix + '">'
    + '<button class="co-btn" onclick="' + call('trColdOpenRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="co-counter" id="co-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="co-btn" onclick="' + call('trColdOpenRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
