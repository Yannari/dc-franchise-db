// ══════════════════════════════════════════════════════════════════════
// vp-tr/round-table.js — the one place the castle is handed a fact
// ══════════════════════════════════════════════════════════════════════
//
// Built in the language Task 1 approved, and deliberately not in its room.
//
// SHARED WITH THE CONCLAVE: the type system (Fraunces 900 for display, IM Fell
// English for anything spoken or written by hand, Cormorant Garamond for
// body), the `_portrait()` helper and its stylesheet, `_icon()` for objects,
// the open-eye seal as the show's sigil, the reveal machinery, the sidebar
// architecture, and the rule that no narration writes a host name or an exit
// word as a literal.
//
// NOT SHARED, AND ON PURPOSE:
//
//   THE ROOM. The conclave is a cold turret at the top of a stair — three
//   people, one lantern — and its portraits are lit by `.cv-lit`: rim-light on
//   the lamp side, the far side sunk into shadow. This is the whole castle in
//   one room with the candles up, and everybody can see everybody. The faces
//   here are NEUTRAL, which is what `_portrait()` renders when nothing asks it
//   for the lamp. A hall under forty candles has no shadow side, and a face
//   that arrived pre-darkened would look broken in it.
//
//   THE PALETTE. Amber on blue-black up there; bone and candle-white on a deep
//   green hall down here, with the wax red kept for the one thing that is
//   actually decided. Nothing in this file reads `--cv-lantern`.
//
//   THE PRIMITIVE. The turret's was the irony gutter — two columns, and the
//   audience reading both at once. This screen's is THE TABLE ITSELF: a map of
//   the room in the rail, every seat a face, and a line drawn across the wood
//   from each voter to the name they wrote, accumulating as the slates are
//   read. By the last slate the shape of the room is a picture and not a list.
//
//   THE CARD. Vellum and stone up there. SLATE down here: they write in chalk,
//   they hold it up, and the card turns to face the room as it is read.
//
// ── WHY THE SLATES ARE THE POINT ──────────────────────────────────────
//
// Everything else in this engine is belief. The deduction model is built on
// scarcity: an accusation is a rumour scaled by trust in whoever said it, a
// murder is inferred from a shape, a mission tells almost nobody anything. The
// ballots read aloud at this table are the ONLY public-certainty facts the
// castle is ever handed — which is why `ballotEvidence` is the strongest
// source the model has. So they are read one at a time, one beat each, with
// the count moving underneath them: the room's whole supply of solid ground,
// spent slowly.
//
// ── THE HARD RULES ────────────────────────────────────────────────────
//
//   1. ONLY THE PUBLIC CHANNEL. The conclave's ballots ride on the same
//      `votes[]` array as this table's and are told apart by `channel` alone.
//      Plan 7 caught js/social/archive.js iterating them unfiltered and
//      publishing five nights of the turret as public events. So this file
//      never iterates `votes`: `publicBallots()` from js/shows.js is the rule,
//      it is applied ONCE at the top of `_view`, and nothing downstream is
//      ever handed the array it filtered.
//   2. A REVOTE IS ITS OWN STATE. `banishment-revote` is the same decision
//      still being taken, not a second helping of the first count. Its ballots
//      never join the first tally and its beats carry their own phase.
//   3. NO REVEAL IN THE ENDGAME (spec §8). The survivors go on nerve alone,
//      and that absence is what makes the last votes feel unlike every earlier
//      one. The record already refuses to carry an alignment for a finale
//      table (js/tr/headless.js `_tableRecord`); this file refuses again, so
//      neither lock depends on the other.
//   4. THE OBSERVER CONTRACT. The table is public, so nearly all of it is the
//      same for everybody — that is the whole difference between this screen
//      and the turret. What is NOT the same is the audience's privilege of
//      knowing whether an accusation is TRUE. That is stripped off the record
//      inside `_view` before a player's screen is built from it, rather than
//      hidden in the markup: a blanking pass is one edit away from leaking,
//      and a branch that never receives the data cannot leak it at all.
import { seasonConfig, players } from '../core.js';
import { pronouns } from '../players.js';
import { exitVerbs, publicBallots } from '../shows.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { PORTRAIT_CSS, TR_NAV_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

const TR = 'traitors';

/** The show's own word for the door this table opens. Never written out. */
function _verbs() {
  const [banish, murder] = exitVerbs(TR);
  return { banish: banish || 'out', murder: murder || banish || 'out' };
}
const _cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

// ── deterministic picking ─────────────────────────────────────────────
// A VP screen is rebuilt on every paint and on every reveal, so nothing here
// may draw from Math.random: the room would resay its lines under the reader.
// A hash of the beat's own facts picks the variant instead.
function _hash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
/**
 * MurmurHash3's finaliser, AND IT IS NOT WANTED ON `_pick`.
 *
 * `_hash` above is raw FNV-1a, and its last step is one xor of a small value
 * followed by one multiply by 16777619. So two keys differing only in their
 * LAST character come out about 1/256 of the range apart. What that does
 * depends entirely on how the hash is then turned into a choice, and the two
 * answers are opposite:
 *
 *   `h % len`   -- IMMUNE, and better than a coin. The gap between the two
 *                  hashes is (delta * 16777619), and 16777619 is prime, so
 *                  `key|0 .. key|len-1` walk every slot exactly once before
 *                  any of them repeats. MEASURED over 200 seasons: every pool
 *                  in this file reaches every one of its slots, and adding the
 *                  finaliser to `_pick` makes the within-season repeat rate
 *                  WORSE at eleven of thirteen sites, because a stride cycle
 *                  beats a fresh coin flip at not repeating.
 *   `h / 2**32` -- COLLAPSES. Two keys 1/256 apart are the same number as far
 *                  as a top-bit index or a `< p` threshold is concerned, so
 *                  they make the same decision 96% of the time.
 *
 * `routine` below is neither -- it is `% 2`, which is the stride cycle at its
 * shortest: the gap is always odd, so consecutive `i` land on alternate
 * values, FOREVER. Its comment says the note goes on "about half" of the
 * slates as though it were a coin, and it was in fact a metronome: notes on
 * every other slate, on every table, in every season. MEASURED over 333 real
 * tables -- mean longest strictly-alternating run 5.14 against a coin's 3.80,
 * with the density unchanged at 47%. Finalised here and nowhere else in this
 * file, because this is the one site whose key ends in a counter AND whose
 * pool is two wide.
 */
function _mix(h) {
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
function _pick(pool, key) {
  if (!pool || !pool.length) return '';
  return pool[_hash(key) % pool.length];
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
 * A face at this table, and it is NEUTRAL.
 *
 * `_portrait()` takes an `opts.lit` that asks for the turret's rim-light and
 * shadow side. Nothing in this file asks for it. That split is the whole
 * reason Task 1 moved the lighting out of the shared helper.
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
// These are the hall's own objects, which the turret has no use for.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    slate: '<rect x="2.6" y="4" width="18.8" height="14.6" rx="1.1" fill="#1a2027" stroke="' + c + '" stroke-width="1.4"/>'
      + '<rect x="4.6" y="6" width="14.8" height="10.6" fill="#0f141a"/>'
      + '<path d="M7 13.4h10M7 10.2h6.4" stroke="#e7eee6" stroke-width="1.3" stroke-linecap="round" opacity=".82"/>'
      + '<path d="M5.4 18.6h13.2v1.6H5.4z" fill="' + c + '"/>',
    chalk: '<path d="M6.4 19.6 4 21.4l.6-3 11.2-11.2 2.4 2.4z" fill="#eef2ec"/>'
      + '<path d="M15.8 7.2 18.2 4.8a1.7 1.7 0 0 1 2.4 2.4l-2.4 2.4z" fill="' + c + '"/>'
      + '<path d="m4.6 18.4 1.8 1.8" stroke="' + c + '" stroke-width="1.1"/>',
    candles: '<path d="M3.6 20.4h16.8" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M12 20.4V7.4M5.4 20.4v-4.2q0-3 6.6-3M18.6 20.4v-4.2q0-3-6.6-3" stroke="' + c + '" stroke-width="1.3" fill="none"/>'
      + '<rect x="10.9" y="4.6" width="2.2" height="3" fill="#f5ecd4"/>'
      + '<rect x="4.3" y="12.4" width="2.2" height="3" fill="#f5ecd4"/>'
      + '<rect x="17.5" y="12.4" width="2.2" height="3" fill="#f5ecd4"/>'
      + '<path class="rt-lick" d="M12 1.8c1.5 1.7 2.3 2.7 2.3 4a2.3 2.3 0 0 1-4.6 0c0-1.3.8-2.3 2.3-4z" fill="#fff3d2"/>'
      + '<path class="rt-lick" d="M5.4 9.6c1.2 1.4 1.9 2.2 1.9 3.2a1.9 1.9 0 0 1-3.8 0c0-1 .7-1.8 1.9-3.2z" fill="#fff3d2"/>'
      + '<path class="rt-lick" d="M18.6 9.6c1.2 1.4 1.9 2.2 1.9 3.2a1.9 1.9 0 0 1-3.8 0c0-1 .7-1.8 1.9-3.2z" fill="#fff3d2"/>',
    hand: '<path d="M9 21.2c-3 0-4.6-2-4.6-4.6v-4.2a1.3 1.3 0 0 1 2.6 0v1.4" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<path d="M7 13.2V4.6a1.3 1.3 0 0 1 2.6 0v7M9.6 11.6V3.4a1.3 1.3 0 0 1 2.6 0v8.2M12.2 11.6V4.4a1.3 1.3 0 0 1 2.6 0v7.2" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<path d="M14.8 11.6V6.8a1.3 1.3 0 0 1 2.6 0v9.8c0 2.6-1.6 4.6-4.6 4.6z" stroke="' + c + '" stroke-width="1.4" fill="none"/>',
    scales: '<path d="M12 3.2v16.4M7.4 20.4h9.2" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M4 7.4h16" stroke="' + c + '" stroke-width="1.4"/>'
      + '<circle cx="12" cy="4.6" r="1.5" fill="' + c + '"/>'
      + '<path d="M1.6 13.4 4 7.6l2.4 5.8a2.4 2.4 0 0 1-4.8 0z" stroke="' + c + '" stroke-width="1.2" fill="none"/>'
      + '<path d="M17.6 13.4 20 7.6l2.4 5.8a2.4 2.4 0 0 1-4.8 0z" stroke="' + c + '" stroke-width="1.2" fill="none"/>',
    table: '<ellipse cx="12" cy="12" rx="9.4" ry="6.4" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<ellipse cx="12" cy="12" rx="5.4" ry="3.4" stroke="' + c + '" stroke-width="1" opacity=".55" fill="none"/>'
      + '<circle cx="12" cy="4.6" r="1.5" fill="' + c + '"/><circle cx="12" cy="19.4" r="1.5" fill="' + c + '"/>'
      + '<circle cx="3.2" cy="12" r="1.5" fill="' + c + '"/><circle cx="20.8" cy="12" r="1.5" fill="' + c + '"/>'
      + '<circle cx="5.6" cy="6.6" r="1.5" fill="' + c + '"/><circle cx="18.4" cy="6.6" r="1.5" fill="' + c + '"/>'
      + '<circle cx="5.6" cy="17.4" r="1.5" fill="' + c + '"/><circle cx="18.4" cy="17.4" r="1.5" fill="' + c + '"/>',
    tally: '<path d="M4.4 5.6v12.8M9 5.6v12.8M13.6 5.6v12.8M18.2 5.6v12.8" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M2.6 18 20 6.6" stroke="' + c + '" stroke-width="1.5"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE HALL — three planes, and none of them is the turret
// ══════════════════════════════════════════════════════════════════════
//
// We are standing BEHIND two empty chairs, looking across the table. That
// angle is the argument of the screen: everybody can see everybody, and so can
// you. Nothing is drawn from Math.random — the candles and the smoke are laid
// out from a hash of the night, so the same table has the same flames in it
// every time it is opened and a different table has different ones.

/** Far: the gallery wall, tall lancets with a cold night behind them. */
function _hallFar() {
  let s = '<svg viewBox="0 0 1100 1400" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="rtPane" x1="0" y1="0" x2="0.3" y2="1">'
    + '<stop offset="0%" stop-color="#39506b" stop-opacity=".7"/>'
    + '<stop offset="100%" stop-color="#16202c" stop-opacity=".9"/></linearGradient>'
    + '<radialGradient id="rtFarFall" cx="50%" cy="10%" r="88%">'
    + '<stop offset="0%" stop-color="#20342a" stop-opacity=".7"/>'
    + '<stop offset="56%" stop-color="#0d1712" stop-opacity=".55"/>'
    + '<stop offset="100%" stop-color="#040705" stop-opacity=".96"/></radialGradient>'
    + '<pattern id="rtPanel" width="150" height="260" patternUnits="userSpaceOnUse">'
    + '<rect width="150" height="260" fill="#101c15"/>'
    + '<rect x="10" y="14" width="130" height="232" fill="none" stroke="#0a120d" stroke-width="5"/>'
    + '<rect x="16" y="20" width="118" height="220" fill="none" stroke="#1b2c21" stroke-width="1.2" opacity=".55"/>'
    + '</pattern></defs>'
    + '<rect width="1100" height="1400" fill="url(#rtPanel)"/>';
  for (let i = 0; i < 4; i++) {
    const x = 96 + i * 264;
    s += '<g>'
      + '<path d="M' + x + ' 470V182a58 58 0 0 1 116 0v288z" fill="#0a120d"/>'
      + '<path d="M' + (x + 7) + ' 462V184a51 51 0 0 1 102 0v278z" fill="url(#rtPane)"/>'
      + '<path d="M' + (x + 58) + ' 184v278M' + (x + 7) + ' 318h102" stroke="#080e0a" stroke-width="6"/>'
      + '<path d="M' + x + ' 470V182a58 58 0 0 1 116 0v288z" fill="none" stroke="#080e0a" stroke-width="7"/>'
      + '</g>';
  }
  s += '<g opacity=".5" fill="#122a1c">'
    + '<path d="M240 120h84v560l-42 34-42-34z"/><path d="M504 120h84v560l-42 34-42-34z"/>'
    + '<path d="M768 120h84v560l-42 34-42-34z"/></g>'
    + '<rect width="1100" height="1400" fill="url(#rtFarFall)"/>';
  return s + '</svg>';
}

/** Mid: the candle ring above, its smoke, the great table, the high chairs. */
function _hallMid(seed) {
  const rng = _fieldRng('hall|' + seed);
  let s = '<svg viewBox="0 0 1100 1400" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="rtIron" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0%" stop-color="#7d8a85"/><stop offset="40%" stop-color="#3c4744"/>'
    + '<stop offset="72%" stop-color="#6d7a75"/><stop offset="100%" stop-color="#232b29"/></linearGradient>'
    + '<radialGradient id="rtGlow" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#fff3d2" stop-opacity=".9"/>'
    + '<stop offset="100%" stop-color="#fff3d2" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="rtWashG" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#fff3d2" stop-opacity=".3"/>'
    + '<stop offset="100%" stop-color="#fff3d2" stop-opacity="0"/></linearGradient>'
    + '<radialGradient id="rtBaize" cx="50%" cy="34%" r="70%">'
    + '<stop offset="0%" stop-color="#25523a"/><stop offset="62%" stop-color="#15301f"/>'
    + '<stop offset="100%" stop-color="#0a1811"/></radialGradient>'
    + '</defs>';

  s += '<g class="rt-hang">'
    + '<path d="M330 0v210M770 0v210M436 0v226M664 0v226" stroke="url(#rtIron)" stroke-width="2.4" opacity=".8"/>'
    + '<g filter="url(#rtHalo)" class="rt-breathe">'
    + '<ellipse cx="550" cy="250" rx="330" ry="132" fill="url(#rtGlow)" opacity=".5"/></g>'
    + '<ellipse cx="550" cy="248" rx="248" ry="66" fill="none" stroke="url(#rtIron)" stroke-width="11"/>'
    + '<ellipse cx="550" cy="248" rx="248" ry="66" fill="none" stroke="rgba(255,243,210,.22)" stroke-width="2"/>';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const cx = 550 + Math.cos(a) * 248;
    const cy = 248 + Math.sin(a) * 66;
    const h = 30 + rng() * 12;
    // THREE CLOCKS PER CANDLE, none of them shared with its neighbour: the
    // shape, the brightness, and the light it throws. The negative delays are
    // what stop the ring guttering in unison, which reads as fake faster than
    // any curve does. animation-delay takes one value per animation, so the
    // shape and the flare are phased independently of each other too.
    const lick = (6.1 + rng() * 2.6).toFixed(2);
    const flare = (2.3 + rng() * 1.5).toFixed(2);
    const halo = (4.4 + rng() * 2.2).toFixed(2);
    const dl = (-rng() * 9).toFixed(2), df = (-rng() * 4).toFixed(2);
    const dh = (-rng() * 6).toFixed(2);
    s += '<g>'
      + '<rect x="' + (cx - 4).toFixed(1) + '" y="' + (cy - h).toFixed(1)
      + '" width="8" height="' + h.toFixed(1) + '" fill="#f2e8cd" opacity=".92"/>'
      + '<path class="rt-lick" d="M' + cx.toFixed(1) + ' ' + (cy - h - 15).toFixed(1)
      + 'c5 6 8 9.4 8 13a8 8 0 0 1-16 0c0-3.6 3-7 8-13z" fill="#fff3d2"'
      + ' style="--lick:' + lick + 's;--flare:' + flare + 's;animation-delay:'
      + dl + 's,' + df + 's"/>'
      + '<circle class="rt-halo" cx="' + cx.toFixed(1) + '" cy="' + (cy - h - 8).toFixed(1)
      + '" r="17" fill="url(#rtGlow)" opacity=".4"'
      + ' style="--halo:' + halo + 's;animation-delay:' + dh + 's"/>'
      + '</g>';
  }
  s += '</g>';

  s += '<g filter="url(#rtSoft)" style="mix-blend-mode:screen">'
    + '<path class="rt-wash" d="M300 250 800 250 1010 900 90 900Z" fill="url(#rtWashG)"/></g>';

  for (let k = 0; k < 22; k++) {
    const x = 300 + rng() * 500, y = 210 + rng() * 70;
    const r = 8 + rng() * 22;
    const d = (18 + rng() * 20).toFixed(1), del = (-rng() * 26).toFixed(1);
    s += '<circle class="rt-smoke" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1)
      + '" r="' + r.toFixed(1) + '" fill="rgba(190,205,196,.1)"'
      + ' style="animation-duration:' + d + 's;animation-delay:' + del + 's"/>';
  }

  s += '<g>'
    + '<ellipse cx="550" cy="742" rx="430" ry="150" fill="#060c08" opacity=".85"/>'
    + '<ellipse cx="550" cy="726" rx="430" ry="150" fill="url(#rtBaize)"/>'
    + '<ellipse cx="550" cy="726" rx="430" ry="150" fill="none" stroke="#3a2a15" stroke-width="9"/>'
    + '<ellipse cx="550" cy="726" rx="416" ry="140" fill="none" stroke="rgba(255,243,210,.1)" stroke-width="1.6"/>'
    + '<ellipse cx="550" cy="700" rx="150" ry="50" fill="none" stroke="rgba(255,243,210,.09)" stroke-width="1.4"/>'
    + '</g>';

  s += '<g fill="#0b130e" stroke="#1d2b21" stroke-width="2">';
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    const cx = 550 + Math.cos(a) * 430;
    const cy = 726 + Math.sin(a) * 150;
    const hh = 118 - Math.abs(Math.cos(a)) * 26;
    s += '<path d="M' + (cx - 30).toFixed(1) + ' ' + cy.toFixed(1) + 'v' + (-hh).toFixed(1)
      + 'a30 26 0 0 1 60 0v' + hh.toFixed(1) + 'z"/>';
  }
  s += '</g>';
  return s + '</svg>';
}

/** Fore: the two empty chairs we stand behind, and the table's near lip. */
function _hallFore() {
  return '<svg viewBox="0 0 1100 1400" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="rtForeEdge" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#080f0b"/><stop offset="100%" stop-color="#020403"/>'
    + '</linearGradient></defs>'
    + '<path d="M40 1400V1010a112 96 0 0 1 224 0v390z" fill="url(#rtForeEdge)"/>'
    + '<path d="M40 1400V1010a112 96 0 0 1 224 0" fill="none" stroke="rgba(255,243,210,.09)" stroke-width="2.5"/>'
    + '<path d="M836 1400V1010a112 96 0 0 1 224 0v390z" fill="url(#rtForeEdge)"/>'
    + '<path d="M836 1400V1010a112 96 0 0 1 224 0" fill="none" stroke="rgba(255,243,210,.09)" stroke-width="2.5"/>'
    + '<path d="M0 1332q550 -128 1100 0v68H0z" fill="#020403"/>'
    + '<path d="M0 1332q550 -128 1100 0" fill="none" stroke="rgba(255,243,210,.12)" stroke-width="2.5"/>'
    + '</svg>';
}

/** The chapter card's scene: the table from above, a slate at every place. */
function _heroScene(count) {
  const n = Math.max(3, Math.min(22, count || 8));
  let s = '<svg class="rt-hero-scene" viewBox="0 0 1100 456" preserveAspectRatio="xMidYMid slice">'
    + '<defs>'
    + '<linearGradient id="rtHeroSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#12211a"/><stop offset="66%" stop-color="#08110c"/>'
    + '<stop offset="100%" stop-color="#030605"/></linearGradient>'
    + '<radialGradient id="rtHeroBaize" cx="50%" cy="40%" r="66%">'
    + '<stop offset="0%" stop-color="#2a5c41"/><stop offset="60%" stop-color="#163322"/>'
    + '<stop offset="100%" stop-color="#0a1a11"/></radialGradient>'
    + '<linearGradient id="rtHeroFade" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#030605" stop-opacity="0"/>'
    + '<stop offset="70%" stop-color="#030605" stop-opacity=".8"/>'
    + '<stop offset="100%" stop-color="#030605" stop-opacity=".97"/></linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="456" fill="url(#rtHeroSky)"/>'
    + '<ellipse cx="550" cy="286" rx="330" ry="132" fill="url(#rtHeroBaize)"/>'
    + '<ellipse cx="550" cy="286" rx="330" ry="132" fill="none" stroke="#3a2a15" stroke-width="8"/>'
    + '<ellipse cx="550" cy="286" rx="316" ry="122" fill="none" stroke="rgba(255,243,210,.1)" stroke-width="1.6"/>';
  s += '<g fill="#0a120d" stroke="#203025" stroke-width="2">';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    s += '<ellipse cx="' + (550 + Math.cos(a) * 372).toFixed(1) + '" cy="'
      + (286 + Math.sin(a) * 166).toFixed(1) + '" rx="25" ry="17"/>';
  }
  s += '</g><g fill="#1b232a" stroke="rgba(255,243,210,.16)" stroke-width="1.4">';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const cx = 550 + Math.cos(a) * 300, cy = 286 + Math.sin(a) * 118;
    s += '<rect x="' + (cx - 15).toFixed(1) + '" y="' + (cy - 10).toFixed(1)
      + '" width="30" height="20" rx="2" transform="rotate('
      + ((a * 180 / Math.PI + 90) % 360).toFixed(1) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"/>';
  }
  s += '</g>';
  s += '<g class="rt-breathe"><ellipse cx="550" cy="212" rx="240" ry="96" fill="url(#rtHeroGlowX)" opacity=".4"/></g>'
    + '<ellipse cx="550" cy="196" rx="180" ry="48" fill="none" stroke="#4a5551" stroke-width="7" opacity=".85"/>';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const cx = 550 + Math.cos(a) * 180, cy = 196 + Math.sin(a) * 48;
    // The chandelier behind the title, staggered off the index rather than the
    // field — the hero scene takes no seed and fourteen candles on one beat
    // would be the first motion anybody looking at this screen sees.
    s += '<rect x="' + (cx - 3).toFixed(1) + '" y="' + (cy - 24).toFixed(1)
      + '" width="6" height="24" fill="#f2e8cd" opacity=".9"/>'
      + '<path class="rt-lick" d="M' + cx.toFixed(1) + ' ' + (cy - 36).toFixed(1)
      + 'c4 5 6 7.4 6 10a6 6 0 0 1-12 0c0-2.6 2-5 6-10z" fill="#fff3d2"'
      + ' style="--lick:' + (6.3 + (i % 5) * 0.53).toFixed(2)
      + 's;--flare:' + (2.4 + (i % 7) * 0.19).toFixed(2)
      + 's;animation-delay:-' + ((i * 1.37) % 8).toFixed(2)
      + 's,-' + ((i * 0.71) % 4).toFixed(2) + 's"/>';
  }
  s += '<rect y="214" width="1100" height="242" fill="url(#rtHeroFade)"/>';
  return s + '</svg>';
}

/** The filter bank. Its own ids, so it cannot collide with the turret's. */
function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="rtHalo" x="-120%" y="-120%" width="340%" height="340%">'
    + '<feGaussianBlur stdDeviation="40"/></filter>'
    + '<filter id="rtSoft" x="-40%" y="-40%" width="180%" height="180%">'
    + '<feGaussianBlur stdDeviation="18"/></filter>'
    + '<filter id="rtScratch" x="-5%" y="-9%" width="110%" height="118%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.02 0.36" numOctaves="3" seed="41" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="3.4" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '<radialGradient id="rtHeroGlowX" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#fff3d2" stop-opacity=".85"/>'
    + '<stop offset="100%" stop-color="#fff3d2" stop-opacity="0"/></radialGradient>'
    + '</defs></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VISUAL SYSTEM
// ══════════════════════════════════════════════════════════════════════
//
// Same three families as the turret: Fraunces 900 (wonk) for display, IM Fell
// English for anything spoken or written by hand, Cormorant Garamond for body.
// Everything else here is this room's.
//
// TWO LAYOUT RULES ARE NOT TASTE AND WERE MEASURED ON THE CONCLAVE:
//
//   * THE CLIP LIVES ON `.rt-scenery`, NEVER ON THE SHELL. `overflow:hidden`
//     on the shell makes it a scroll container, which kills `position:sticky`
//     for every descendant — the conclave's rail measured top:-2455 at a page
//     scroll of 3000 before this was found. And that layer takes NO z-index:
//     with `z-index:auto` it is not a stacking context, so the grain still
//     paints above the body and the wash's `screen` still blends against the
//     shell's own background instead of an isolated transparent group.
//   * THE STICKY ELEMENT IS THE INNER PANEL, NOT THE RAIL. Sticky needs an
//     element SHORTER than its containing block; a rail exactly as tall as its
//     grid has zero range and scrolls like a static box. `#rt-sidebar-inner`
//     is also the element the reveal handlers replace by id, so its position
//     survives every innerHTML swap.
//
// The 46px offset on every absolutely-positioned layer is the real VP's
// `.rp-nav` bar, which the standalone mockups do not have.
const RT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.rt-root{
  --rt-night:#040705;
  --rt-hall:#0d1712;
  --rt-hall-2:#101c15;
  --rt-baize:#15301f;
  --rt-candle:#fff3d2;
  --rt-bone:#ded6c4;
  --rt-bone-dim:rgba(222,214,196,.62);
  --rt-chalk:#eef2ec;
  --rt-slate:#20262c;
  --rt-slate-2:#12171c;
  --rt-blood:#8e1526;
  --rt-blood-hot:#c9283c;
  --rt-pewter:#8b9a94;
  --rt-mute:#69786f;
  --rt-rule:rgba(222,214,196,.17);
  --rt-display:'Fraunces',Georgia,'Times New Roman',serif;
  --rt-hand:'IM Fell English',Georgia,serif;
  --rt-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  /* the shared portrait reads these; the hall answers in bone, not amber */
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--rt-bone);
  font-family:var(--rt-body);
  font-size:17px;line-height:1.6;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#000;
}
.rt-root *{box-sizing:border-box}
.cv-ic{display:inline-block;vertical-align:middle;flex:none}

/* the shared portrait, re-tuned for a room with no shadow side */
.rt-root .cv-av{
  background:linear-gradient(162deg,#20302a,#070c09);
  box-shadow:0 0 0 1px rgba(222,214,196,.26),0 3px 10px rgba(0,0,0,.55);
}
.rt-root .cv-av-ini{color:rgba(222,214,196,.6)}

/* ── SHELL ─────────────────────────────────────────────────────────── */
.rt-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--rt-hall);
  box-shadow:0 0 0 1px rgba(222,214,196,.09),0 0 90px rgba(0,0,0,.9),0 0 200px rgba(0,0,0,.7);
  overflow:visible;
  transition:background 1.6s ease;
}
.rt-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.rt-far,.rt-mid,.rt-fore{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};height:1460px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.rt-wash-l,.rt-vig,.rt-grain{position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;pointer-events:none}
.rt-far{z-index:0}
.rt-mid{z-index:1}
.rt-fore{z-index:2}
.rt-wash-l{z-index:3}
.rt-vig{z-index:4}
.rt-grain{z-index:9}
.rt-body{position:relative;z-index:5}
.rt-far svg,.rt-mid svg,.rt-fore svg{position:absolute;inset:0;width:100%;height:100%}
.rt-far::after,.rt-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:400px;
  background:linear-gradient(180deg,transparent,var(--rt-hall));
}
/* aerial perspective — depth for the price of a filter */
.rt-far{filter:blur(2.6px) saturate(.55) brightness(.7);opacity:.5}
.rt-mid{filter:blur(.4px);opacity:.6}
.rt-shell::before{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:var(--rt-oak-src);background-size:320px 320px;
  opacity:.13;mix-blend-mode:overlay;
}
.rt-wash-l{
  transition:background 1.8s ease,opacity 1.8s ease;
  mix-blend-mode:screen;opacity:.62;
  background:radial-gradient(112% 54% at 50% 4%,rgba(255,243,210,.18) 0%,transparent 60%);
}
.rt-vig{
  background:
    radial-gradient(128% 86% at 50% 32%,transparent 0%,transparent 42%,rgba(3,6,5,.4) 72%,rgba(3,6,5,.88) 100%),
    linear-gradient(180deg,rgba(3,6,5,.68) 0%,transparent 15%,transparent 80%,rgba(3,6,5,.82) 100%);
  mix-blend-mode:multiply;
}
.rt-grain{
  opacity:.12;mix-blend-mode:soft-light;
  background-image:var(--rt-grain-src);
  background-size:200px 200px;
  animation:rt-grainshift 1.3s steps(3) infinite;
}
@keyframes rt-grainshift{
  0%{transform:translate(0,0)} 33%{transform:translate(-5px,4px)}
  66%{transform:translate(4px,-4px)} 100%{transform:translate(0,0)}
}

/* ── AMBIENT: candles breathe, smoke goes flat, the ring hangs ─────── */
/* ── FORTY CANDLES, AND NOT ONE OF THEM ON THE SAME BEAT ─────────────
   The same fix as the turret's lantern, and it matters more here: this room's
   light is a ring of eighteen flames over the table and a chandelier of
   fourteen behind the title.
   * transform-box:fill-box is the whole of why this looked wrong. Without it
     an SVG transform-origin resolves against the VIEW BOX, so 50% 92% on a
     candle 200 units down a 1400-unit box pivoted it a thousand units below the
     wick, and every skew swung the flame bodily sideways. Fire changes shape;
     it does not travel.
   * The shape loop is long and asymmetric and the brightness runs at a coprime
     period, because a symmetric 1.4s loop is a pendulum the eye catches inside
     two cycles.
   * Small amplitude on the shape, the real flicker on opacity, and the halo
     behind each candle breathing on a third clock again.
   * PER-CANDLE PERIODS AND NEGATIVE DELAYS. Eighteen flames guttering in
     unison is the other thing that reads as fake instantly, so every candle
     takes its own --lick, --flare, --halo and phase off the night's own
     seeded field. */
.rt-lick,.cv-flame{
  transform-box:fill-box;transform-origin:50% 100%;
  animation:rt-lick var(--lick,7.3s) linear infinite,
            rt-flare var(--flare,2.9s) ease-in-out infinite;
}
@keyframes rt-lick{
  0%{transform:skewX(0deg) scale(1,1)}
  9%{transform:skewX(-1.5deg) scale(.985,1.05)}
  17%{transform:skewX(.7deg) scale(1.02,.98)}
  28%{transform:skewX(-2.3deg) scale(.97,1.08)}
  36%{transform:skewX(-.3deg) scale(1.01,1.01)}
  47%{transform:skewX(1.8deg) scale(1.03,.96)}
  55%{transform:skewX(.4deg) scale(.99,1.03)}
  66%{transform:skewX(-1deg) scale(1.01,1.06)}
  74%{transform:skewX(2.1deg) scale(1.02,.97)}
  88%{transform:skewX(-.6deg) scale(.99,1.04)}
  100%{transform:skewX(0deg) scale(1,1)}
}
@keyframes rt-flare{
  0%{opacity:.9} 12%{opacity:1} 23%{opacity:.78} 31%{opacity:.95}
  44%{opacity:.84} 58%{opacity:1} 67%{opacity:.72} 79%{opacity:.93}
  91%{opacity:.86} 100%{opacity:.9}
}
.rt-halo{animation:rt-halo var(--halo,5.3s) ease-in-out infinite}
@keyframes rt-halo{
  0%{opacity:.34} 17%{opacity:.46} 29%{opacity:.3} 46%{opacity:.44}
  61%{opacity:.33} 78%{opacity:.48} 90%{opacity:.36} 100%{opacity:.34}
}
.rt-breathe{animation:rt-breathe 7.8s ease-in-out infinite;transform-origin:center}
@keyframes rt-breathe{
  0%,100%{opacity:.85;transform:scale(1)}
  28%{opacity:1;transform:scale(1.04)}
  63%{opacity:.66;transform:scale(.97)}
}
.rt-hang{animation:rt-hang 15s ease-in-out infinite;transform-origin:50% 0}
@keyframes rt-hang{0%,100%{transform:rotate(-.35deg)}50%{transform:rotate(.35deg)}}
.rt-wash{animation:rt-guttering 8.4s linear infinite}
@keyframes rt-guttering{
  0%{opacity:.62} 11%{opacity:.7} 19%{opacity:.5} 28%{opacity:.66}
  41%{opacity:.58} 55%{opacity:.74} 66%{opacity:.52} 79%{opacity:.68}
  90%{opacity:.57} 100%{opacity:.62}
}
.rt-smoke{animation:rt-rise linear infinite}
@keyframes rt-rise{
  0%{transform:translate(0,0) scale(.5);opacity:0}
  18%{opacity:.5}
  100%{transform:translate(58px,-190px) scale(2.4);opacity:0}
}

/* ── PHASE ATMOSPHERE — the hall changes temperature, not just tint ──
   Five rooms in one room. The debate is warm and wide, the writing goes
   quiet and cold, the reading is hard white light, a revote closes the
   walls in, and the verdict drains to the wax red the format decides in. */
.rt-shell[data-phase="gather"]{background:#0e1a13}
.rt-shell[data-phase="gather"] .rt-wash-l{background:radial-gradient(104% 50% at 50% 4%,rgba(255,243,210,.16) 0%,transparent 58%);opacity:.7}

.rt-shell[data-phase="debate"]{background:#13221a}
.rt-shell[data-phase="debate"] .rt-wash-l{background:radial-gradient(122% 62% at 50% 6%,rgba(255,243,210,.26) 0%,transparent 64%);opacity:.95}

.rt-shell[data-phase="slates"]{background:#0a120f}
.rt-shell[data-phase="slates"] .rt-wash-l{background:radial-gradient(80% 40% at 50% 10%,rgba(200,222,232,.2) 0%,transparent 56%);opacity:.8}
.rt-shell[data-phase="slates"] .rt-far{filter:blur(3.4px) saturate(.35) brightness(.56)}

.rt-shell[data-phase="read"]{background:#101b16}
.rt-shell[data-phase="read"] .rt-wash-l{background:radial-gradient(90% 46% at 50% 12%,rgba(255,249,232,.34) 0%,transparent 54%);opacity:1}
.rt-shell[data-phase="read"] .rt-vig{background:
  radial-gradient(94% 60% at 50% 30%,transparent 0%,transparent 28%,rgba(3,6,5,.58) 64%,rgba(3,6,5,.94) 100%)}

.rt-shell[data-phase="revote"]{background:#08100d}
.rt-shell[data-phase="revote"] .rt-wash-l{background:radial-gradient(58% 32% at 50% 16%,rgba(200,222,232,.28) 0%,transparent 50%);opacity:1}
.rt-shell[data-phase="revote"] .rt-vig{background:
  radial-gradient(70% 46% at 50% 30%,transparent 0%,transparent 16%,rgba(3,6,5,.72) 56%,rgba(3,6,5,.98) 100%)}

.rt-shell[data-phase="verdict"]{background:#150d10}
.rt-shell[data-phase="verdict"] .rt-wash-l{background:radial-gradient(120% 64% at 50% 18%,rgba(142,21,38,.32) 0%,transparent 60%);opacity:1}
.rt-shell[data-phase="verdict"] .rt-far{filter:blur(2.6px) saturate(.6) brightness(.6) hue-rotate(-24deg)}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.rt-hero{
  position:relative;height:456px;overflow:hidden;
  background:#050a07;border-bottom:1px solid rgba(222,214,196,.16);
}
.rt-hero svg.rt-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.rt-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
.rt-eyebrow{
  font-family:var(--rt-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:#cfe0d5;opacity:.95;
  text-shadow:0 1px 2px rgba(0,0,0,1),0 2px 14px rgba(0,0,0,1),0 0 26px rgba(0,0,0,.9);
  margin-bottom:2px;
}
/* THE LOCKUP. Fraunces 900 squeezed to .80 with a 1.3px stroke, exactly as
   the conclave's is — this is the one distorted text on either screen, and
   the two titles have to be the same lockup or the show has two logos. */
.rt-title{
  display:inline-block;
  font-family:var(--rt-display);font-weight:900;
  font-size:clamp(38px,6.6vw,80px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:var(--rt-candle);
  margin:10px 0 0;
  text-shadow:
    0 0 8px rgba(255,249,232,.5),
    0 0 30px rgba(255,243,210,.42),
    0 0 84px rgba(255,243,210,.26),
    0 4px 0 rgba(0,0,0,.6),
    0 10px 30px rgba(0,0,0,.9);
  animation:rt-titleglow 9s ease-in-out infinite;
}
@keyframes rt-titleglow{
  0%,100%{text-shadow:0 0 8px rgba(255,249,232,.5),0 0 30px rgba(255,243,210,.42),0 0 84px rgba(255,243,210,.26),0 4px 0 rgba(0,0,0,.6),0 10px 30px rgba(0,0,0,.9)}
  44%{text-shadow:0 0 11px rgba(255,249,232,.66),0 0 42px rgba(255,243,210,.6),0 0 118px rgba(255,243,210,.36),0 4px 0 rgba(0,0,0,.6),0 10px 30px rgba(0,0,0,.9)}
}
.rt-title-rule{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px auto 12px;max-width:560px}
.rt-title-rule i{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(222,214,196,.5),transparent)}
.rt-sub{
  font-family:var(--rt-hand);font-style:italic;
  font-size:18.5px;line-height:1.5;color:rgba(222,214,196,.82);
  max-width:700px;margin:0 auto;text-shadow:0 2px 10px rgba(0,0,0,.95);
}
.rt-head{
  padding:16px 40px;position:relative;
  border-bottom:1px solid var(--rt-rule);
  background:linear-gradient(180deg,rgba(4,7,5,.72),rgba(4,7,5,.25));
  display:flex;gap:14px;align-items:center;flex-wrap:wrap;
}
.rt-observer{
  display:inline-flex;align-items:center;gap:9px;
  padding:7px 14px;border:1px solid var(--rt-rule);
  background:rgba(222,214,196,.045);
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--rt-bone);
}
.rt-observer em{
  font-family:var(--rt-body);font-style:italic;text-transform:none;
  letter-spacing:0;font-size:14px;color:var(--rt-mute);
}
.rt-observer[data-layer="player"]{border-color:rgba(139,154,148,.4);color:var(--rt-pewter)}

/* ══ THE STAGE — the ring of faces, and it never leaves the screen ══════
   THE ARGUMENT OF THIS SCREEN. A Round Table is a room of people in a ring
   accusing each other, and the tension is that you can see all of them at
   once while one of them talks. So the ring is not an illustration beside
   the text: it is sticky under the nav, it holds every state the vote has,
   and the beats scroll underneath it.

   It is also what replaced the narrow rail. A 292px column of numbers was
   telling the reader that Amy has four votes; the ring shows WHO put them
   there, from which side of the table, with the empty chairs of everybody
   already gone still in the circle. That is the same information as a
   spatial fact, and it is a better one.

   STICKY, and the same two rules the conclave learned the hard way: the
   shell must not clip (a scroll container kills sticky for descendants) and
   the sticky element must be SHORTER than its containing block, which here
   is .rt-body — the whole page. It is also the element the reveal
   handlers replace by id, so its position survives every innerHTML swap. */
.rt-stage{
  position:sticky;top:${TR_NAV_TOP};z-index:20;
  padding:10px 16px 14px;
  background:linear-gradient(180deg,rgba(6,11,8,.97) 0%,rgba(9,17,12,.96) 62%,rgba(6,11,8,.9) 100%);
  border-bottom:1px solid var(--rt-rule);
  box-shadow:0 22px 50px -18px rgba(0,0,0,.95);
  backdrop-filter:blur(4px);
}
.rt-stage-bar{
  display:flex;align-items:center;gap:20px;flex-wrap:wrap;
  padding:0 6px 9px;margin-bottom:4px;
  border-bottom:1px solid rgba(222,214,196,.1);
}
.rt-stage-bit{display:flex;align-items:center;gap:8px}
.rt-stage-k{
  font-family:var(--rt-display);font-weight:700;font-size:9px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--rt-mute);
}
.rt-stage-v{
  font-family:var(--rt-display);font-weight:900;font-size:13px;letter-spacing:.04em;
  color:var(--rt-bone);
}
.rt-stage-v[data-hot="1"]{color:#e58490}
.rt-stage-say{
  flex:1;min-width:180px;text-align:right;
  font-family:var(--rt-hand);font-style:italic;font-size:14px;
  color:rgba(222,214,196,.62);
}
/* ── THE COLLAPSE CONTROL — a small framed button, keyboard-reachable ─── */
.rt-board-toggle{
  flex:none;margin-left:6px;display:inline-flex;align-items:center;gap:7px;cursor:pointer;
  font-family:var(--rt-display);font-weight:700;font-size:9px;letter-spacing:.2em;
  text-transform:uppercase;color:rgba(222,214,196,.72);
  background:linear-gradient(180deg,rgba(222,214,196,.12),rgba(222,214,196,.03));
  border:1px solid rgba(222,214,196,.28);padding:6px 11px;border-radius:2px;
  transition:background .2s,color .2s,border-color .2s;
}
.rt-board-toggle:hover,.rt-board-toggle:focus-visible{
  background:rgba(222,214,196,.2);color:var(--rt-bone);border-color:rgba(222,214,196,.5);
  outline:none;
}
.rt-board-toggle .rt-board-chev{transition:transform .2s ease;display:inline-flex}
/* when the board is folded away, hide the room and give the main column the
   reclaimed height; the status bar and the toggle stay so it can be reopened */
.rt-stage[data-collapsed="1"] .rt-ring,
.rt-stage[data-collapsed="1"] .rt-stage-say{display:none}
.rt-stage[data-collapsed="1"] .rt-board-chev{transform:rotate(180deg)}
@media(prefers-reduced-motion:reduce){
  .rt-board-toggle,.rt-board-chev{transition:none!important}
}

/* the room itself: a fixed 1020x380 design box, scaled by the column */
.rt-ring{position:relative;width:100%;max-width:960px;margin:0 auto;padding-top:41.7%}
.rt-ring-in{position:absolute;inset:0}
.rt-felt{position:absolute;inset:0;width:100%;height:100%;z-index:1}
.rt-chords{position:absolute;inset:0;width:100%;height:100%;z-index:2;overflow:visible}

/* ── A STATION. One per chair, and the chair stays when the person goes ── */
.rt-seat{
  position:absolute;width:82px;margin-left:-41px;margin-top:-41px;
  text-align:center;pointer-events:none;
  transform:scale(var(--s,1));transform-origin:50% 40%;
  transition:filter .28s ease,opacity .28s ease;
}
.rt-seat .cv-av{
  width:48px;height:48px;
  box-shadow:0 0 0 1px rgba(222,214,196,.3),0 6px 14px rgba(0,0,0,.75);
}
.rt-seat-nm{
  display:block;margin-top:4px;padding:1px 4px;
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.02em;
  color:rgba(222,214,196,.92);
  /* a plate rather than a shadow: the sides of the table are crowded and a
     name has to survive being drawn over somebody else's face */
  background:rgba(4,8,6,.72);border-radius:2px;
  text-shadow:0 1px 3px rgba(0,0,0,1);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
/* the votes against them, as chalk ticks at their place */
.rt-pips{display:flex;gap:2.5px;justify-content:center;height:8px;margin-top:2px}
.rt-pips:empty{display:none}
.rt-pip{
  width:2.5px;height:8px;background:#f08d99;transform:skewX(-12deg);
  box-shadow:0 0 5px rgba(201,40,60,.9),0 0 2px rgba(0,0,0,.9);
}
.rt-pip[data-x="1"]{background:rgba(222,214,196,.9);box-shadow:0 0 5px rgba(222,214,196,.6)}

/* the far side of the table is further away, and reads it */
.rt-seat[data-far="1"]{filter:saturate(.72) brightness(.82)}

/* whose turn it is. The camera does not swing — the seats have to stay put
   or the eye loses the person — so the light does the moving instead. */
.rt-seat[data-seat="reading"]{z-index:400!important}
.rt-seat[data-seat="reading"] .cv-av{
  box-shadow:0 0 0 2px rgba(255,243,210,.95),0 0 30px rgba(255,243,210,.75),0 8px 18px rgba(0,0,0,.8);
}
.rt-seat[data-seat="reading"] .rt-seat-nm{color:var(--rt-candle)}
.rt-seat[data-seat="speaking"] .cv-av{box-shadow:0 0 0 2px rgba(255,243,210,.6),0 0 18px rgba(255,243,210,.4)}
.rt-seat[data-seat="accused"] .cv-av{box-shadow:0 0 0 2px rgba(201,40,60,.85),0 0 20px rgba(201,40,60,.5)}
.rt-seat[data-lead="1"] .cv-av{box-shadow:0 0 0 2px rgba(201,40,60,.9),0 0 24px rgba(201,40,60,.6)}
.rt-seat[data-seat="done"] .cv-av{box-shadow:0 0 0 1px rgba(222,214,196,.5),0 4px 10px rgba(0,0,0,.7)}
.rt-seat[data-seat="done"]{opacity:.9}

/* ── THE EMPTY CHAIRS ────────────────────────────────────────────────
   Everyone who has left keeps their seat, and the two doors out of this
   castle do not look alike: the vote of the room leaves a chalk cross
   through the portrait, and the thing the room did not vote on leaves the
   wax. The ring thins as the season runs and the survivors are looking at
   the gaps, which is the format's best recurring image and it lives here. */
.rt-seat[data-seat="gone"]{opacity:.62}
.rt-seat[data-seat="gone"] .cv-av{
  filter:grayscale(1) brightness(.66) contrast(.92);
  box-shadow:0 0 0 1px rgba(222,214,196,.16),inset 0 0 20px rgba(0,0,0,.8);
}
.rt-seat[data-seat="gone"] .rt-seat-nm{color:rgba(222,214,196,.4)}
.rt-mark{
  position:absolute;left:50%;top:24px;transform:translate(-50%,-50%);
  z-index:3;line-height:0;pointer-events:none;
}
.rt-seat[data-door="murder"] .cv-av{box-shadow:0 0 0 1px rgba(142,21,38,.6),inset 0 0 20px rgba(0,0,0,.8)}
.rt-gonelbl{
  display:block;margin-top:1px;
  font-family:var(--rt-display);font-weight:700;font-size:7.5px;letter-spacing:.2em;
  text-transform:uppercase;color:rgba(222,214,196,.34);
}
.rt-seat[data-door="murder"] .rt-gonelbl{color:rgba(201,40,60,.55)}
/* the one who goes tonight, at the moment the chair goes back */
.rt-seat[data-seat="chosen"] .cv-av{box-shadow:0 0 0 2px rgba(201,40,60,.9),0 0 34px rgba(201,40,60,.7)}

/* the argument crossing the ring */
.rt-chord{stroke:rgba(201,40,60,.85);stroke-width:1.2;fill:none}
.rt-chord[data-fresh="1"]{
  stroke:rgba(255,243,210,.95);stroke-width:2.6;
  stroke-dasharray:900;animation:rt-draw .34s ease-out both;
}
@keyframes rt-draw{from{stroke-dashoffset:900}to{stroke-dashoffset:0}}
.rt-chord-head{fill:rgba(255,243,210,.95)}

/* the centre of the table carries the round, because that is where the
   room is looking anyway */
.rt-ring-cap{
  position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);
  text-align:center;z-index:3;pointer-events:none;
  padding:6px 18px 7px;border-radius:40px;
  /* a plate, because the freshest argument is a bright line drawn straight
     across the middle of the table and it was crossing this out */
  background:radial-gradient(60% 60% at 50% 50%,rgba(4,10,7,.88),rgba(4,10,7,0));
}
.rt-ring-cap b{
  display:block;font-family:var(--rt-display);font-weight:900;font-size:26px;
  color:var(--rt-candle);text-shadow:0 0 22px rgba(0,0,0,1),0 2px 4px rgba(0,0,0,1);
}
.rt-ring-cap span{
  font-family:var(--rt-display);font-weight:700;font-size:8.5px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(222,214,196,.5);text-shadow:0 1px 6px rgba(0,0,0,1);
}

/* ── THE STREAM ─────────────────────────────────────────────────────
   One column, narrower than the stage above it, so the eye returns to
   the same measure for every beat. */
.rt-main{padding:26px 34px 80px;max-width:820px;margin:0 auto}

/* THE CLASHES. An argument card, deliberately unlike the accusation cards
   around it: two faces facing each other across a struck rule, and a colour
   that says friction rather than suspicion. */
.rt-clash{
  position:relative;margin:14px 0;padding:15px 17px;
  background:linear-gradient(150deg,rgba(120,20,28,.20),rgba(12,10,14,.92));
  border:1px solid rgba(201,40,60,.40);
  border-left:3px solid rgba(201,40,60,.75);
}
.rt-clash-k{
  display:flex;align-items:center;gap:8px;margin-bottom:9px;
  font-family:var(--rt-display,serif);font-weight:700;font-size:9.5px;
  letter-spacing:.28em;text-transform:uppercase;color:rgba(230,150,150,.85);
}
.rt-clash-pair{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.rt-clash-v{
  flex:0 0 auto;width:16px;height:1px;background:rgba(201,40,60,.6);position:relative;
}
.rt-clash-v::before,.rt-clash-v::after{
  content:'';position:absolute;width:5px;height:1px;background:rgba(201,40,60,.85);
}
.rt-clash-v::before{left:0;top:-2px;transform:rotate(28deg)}
.rt-clash-v::after{right:0;top:2px;transform:rotate(28deg)}
.rt-clash-t{font-size:16px;line-height:1.55;color:rgba(238,232,224,.93)}
.rt-clash-since{
  margin-top:9px;padding-left:11px;border-left:2px solid rgba(201,40,60,.35);
  font-size:14px;line-height:1.5;font-style:italic;color:rgba(226,214,206,.66);
}
@media(prefers-reduced-motion:reduce){.rt-clash{animation:none}}

/* ── HOST BAND ──────────────────────────────────────────────────────── */
.rt-host{
  position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:17px 26px;margin-bottom:18px;
  background:linear-gradient(100deg,rgba(4,7,5,.96),rgba(20,44,28,.86) 52%,rgba(4,7,5,.96));
  border-top:1px solid rgba(222,214,196,.4);
  border-bottom:1px solid rgba(222,214,196,.4);
  box-shadow:inset 0 0 40px -8px rgba(255,243,210,.16),0 14px 34px rgba(0,0,0,.5);
}
.rt-host::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 30%,rgba(255,243,210,.12) 50%,transparent 70%);
  animation:rt-sweep 11s ease-in-out infinite alternate;
}
.rt-host::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  border-top:3px solid rgba(2,4,3,.85);border-bottom:3px solid rgba(2,4,3,.85);
}
@keyframes rt-sweep{0%{transform:translateX(-60%)}100%{transform:translateX(60%)}}
.rt-host-name{
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--rt-candle);margin-bottom:7px;
  display:flex;align-items:center;gap:8px;
}
.rt-host-line{
  font-family:var(--rt-hand);font-style:italic;
  font-size:20px;line-height:1.5;color:rgba(255,249,232,.95);
  text-shadow:0 1px 12px rgba(255,243,210,.18);
}

/* ── CARDS — a place laid at the table, not a slab of wall ───────────
   Flat, wide, top-lit, with a hairline of candlelight along the upper
   edge and the wood grain showing through. The turret's cards are lumps
   of stone standing up; these lie down. */
.rt-card{
  position:relative;padding:22px 26px;
  border:1px solid rgba(222,214,196,.12);
  border-top:1px solid rgba(255,243,210,.26);
  background:
    linear-gradient(178deg,rgba(255,243,210,.06),transparent 22%),
    linear-gradient(168deg,rgba(24,44,32,.94),rgba(8,15,11,.96));
  box-shadow:
    0 20px 44px rgba(0,0,0,.6),0 3px 8px rgba(0,0,0,.5),
    inset 0 1px 0 rgba(255,243,210,.14),inset 0 -1px 0 rgba(0,0,0,.7);
}
.rt-card::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:var(--rt-oak-src);background-size:300px 300px;
  opacity:.12;mix-blend-mode:overlay;
}
.rt-card>*{position:relative;z-index:1}
.rt-card-label{
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--rt-candle);opacity:.82;margin-bottom:10px;
  display:flex;align-items:center;gap:9px;
}
.rt-card-title{
  font-family:var(--rt-display);font-weight:900;font-size:24px;
  letter-spacing:-.005em;color:var(--rt-bone);margin:0 0 11px;
  text-shadow:0 2px 14px rgba(0,0,0,.7);
}
.rt-card p{margin:0 0 12px;color:rgba(222,214,196,.86)}
.rt-card p:last-child{margin-bottom:0}
.rt-said{
  display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;
  border-left:2px solid rgba(255,243,210,.7);padding:5px 0 5px 18px;margin:14px 0;
  box-shadow:-14px 0 26px -18px rgba(255,243,210,.6);
}
.rt-said-txt{font-family:var(--rt-hand);font-size:19px;line-height:1.55;color:var(--rt-bone)}
.rt-said cite{
  display:block;margin-top:8px;font-style:normal;
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--rt-mute);
}

/* the accusers, in a row of faces under an accusation */
.rt-faces{display:flex;gap:9px;flex-wrap:wrap;margin:12px 0 4px;align-items:center}
.rt-face-chip{display:flex;align-items:center;gap:8px;padding:5px 11px 5px 5px;
  border:1px solid rgba(222,214,196,.14);background:rgba(222,214,196,.04)}
.rt-face-nm{font-family:var(--rt-display);font-weight:700;font-size:11px;letter-spacing:.05em}
.rt-accused{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;
  padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid rgba(222,214,196,.12)}
.rt-accused-nm{font-family:var(--rt-display);font-weight:900;font-size:27px;letter-spacing:-.01em}
.rt-accused-ct{
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--rt-mute);text-align:right;line-height:1.5;
}

/* ── THE AUDIENCE'S PRIVILEGE ────────────────────────────────────────
   Whether the room is right. Never rendered for a player observer, and
   never at a finale table — see the _view helper. In the show's own red,
   it is the same privilege the turret's red-ink margin is. */
.rt-irony{
  margin-top:14px;padding:11px 0 2px 16px;
  border-left:2px solid rgba(142,21,38,.65);
  box-shadow:-14px 0 26px -18px rgba(201,40,60,.8);
}
.rt-irony b{
  display:block;font-family:var(--rt-display);font-weight:700;font-size:9px;
  letter-spacing:.3em;text-transform:uppercase;color:rgba(201,40,60,.85);margin-bottom:5px;
}
.rt-irony span{font-family:var(--rt-hand);font-style:italic;font-size:16px;
  line-height:1.5;color:rgba(226,130,140,.92)}

/* ── THE SLATE — this screen's card, and its whole material argument ──
   Real slate: a dark stone face inside a wooden frame, a chalk ghost
   where the last name was wiped off, and the name itself drawn with a
   displacement filter so the stroke breaks up the way chalk does. */
.rt-slate{
  position:relative;margin:4px auto 0;max-width:520px;
  padding:16px;border-radius:3px;
  background:linear-gradient(150deg,#4b3a22,#241b10);
  box-shadow:0 22px 44px rgba(0,0,0,.72),inset 0 1px 0 rgba(255,243,210,.2);
}
.rt-slate-face{
  position:relative;overflow:hidden;
  padding:26px 22px 20px;text-align:center;
  background:linear-gradient(158deg,var(--rt-slate),var(--rt-slate-2));
  box-shadow:inset 0 0 40px rgba(0,0,0,.75),inset 0 2px 0 rgba(0,0,0,.6);
}
.rt-slate-face::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background-image:var(--rt-grit-src);background-size:200px 200px;
  opacity:.4;mix-blend-mode:overlay;
}
/* the smear of the last name, never quite gone */
.rt-slate-face::after{
  content:'';position:absolute;left:8%;right:14%;top:22%;height:38%;pointer-events:none;
  background:radial-gradient(60% 50% at 40% 50%,rgba(238,242,236,.09),transparent 72%),
    radial-gradient(40% 60% at 74% 44%,rgba(238,242,236,.06),transparent 70%);
  transform:rotate(-3deg);
}
.rt-slate-face>*{position:relative;z-index:2}
.rt-slate-name{
  font-family:var(--rt-hand);font-size:clamp(34px,5.4vw,54px);line-height:1.06;
  color:var(--rt-chalk);letter-spacing:.02em;
  filter:url(#rtScratch);
  text-shadow:0 0 1px rgba(238,242,236,.9),0 0 14px rgba(238,242,236,.28);
  transform:rotate(-1.1deg);
}
.rt-slate-none{
  font-family:var(--rt-hand);font-style:italic;font-size:26px;
  color:rgba(238,242,236,.42);
}
.rt-slate-by{
  display:flex;align-items:center;justify-content:center;gap:12px;
  margin-top:16px;padding-top:13px;border-top:1px solid rgba(238,242,236,.14);
}
.rt-vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;
  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.rt-slate-by-nm{
  font-family:var(--rt-display);font-weight:700;font-size:10.5px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(238,242,236,.72);
}
.rt-slate-ord{
  position:absolute;left:14px;top:10px;z-index:3;
  font-family:var(--rt-display);font-weight:900;font-size:12px;letter-spacing:.14em;
  color:rgba(238,242,236,.3);
}
/* the running count, printed on the frame under the stone */
.rt-slate-run{
  display:flex;gap:9px;flex-wrap:wrap;justify-content:center;
  padding:13px 4px 2px;
}
.rt-run-chip{
  display:inline-flex;align-items:center;gap:7px;padding:4px 10px;
  border:1px solid rgba(222,214,196,.2);background:rgba(4,7,5,.55);
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:rgba(222,214,196,.8);
}
.rt-run-chip b{font-size:13px;color:var(--rt-candle)}
.rt-run-chip[data-lead="1"]{border-color:rgba(201,40,60,.55);color:#e58490}
.rt-run-chip[data-lead="1"] b{color:#e58490}
/* the name on the slate that was just turned over — it is always in the strip
   (see _runStrip) and it is worth being able to find without counting */
.rt-run-chip[data-just="1"]{border-color:rgba(240,224,170,.6);
  background:rgba(240,224,170,.1);color:rgba(246,238,214,.95)}

/* the moment a name lands on somebody who already had one */
.rt-note{
  margin-top:13px;font-family:var(--rt-hand);font-style:italic;
  font-size:16px;line-height:1.5;color:rgba(222,214,196,.72);
}
.rt-note[data-tone="turn"]{color:#e58490}

/* ── THE COUNT ──────────────────────────────────────────────────────── */
.rt-tally{display:grid;gap:8px;margin-top:16px}
.rt-tally-row{
  display:grid;grid-template-columns:34px 1fr auto;gap:13px;align-items:center;
  padding:9px 13px;border:1px solid rgba(222,214,196,.11);
  background:linear-gradient(160deg,rgba(9,16,12,.8),rgba(4,7,5,.6));
}
.rt-tally-nm{font-family:var(--rt-display);font-weight:700;font-size:14px}
.rt-tally-bar{grid-column:1/-1;height:4px;background:rgba(222,214,196,.09);position:relative;overflow:hidden}
.rt-tally-bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,rgba(142,21,38,.9),rgba(201,40,60,.9));
  animation:rt-fill .45s cubic-bezier(.2,.9,.3,1) both}
@keyframes rt-fill{from{width:0!important}}
.rt-tally-n{
  font-family:var(--rt-display);font-weight:900;font-size:19px;color:var(--rt-candle);
  min-width:26px;text-align:right;
}
.rt-tally-row[data-top="1"]{border-color:rgba(201,40,60,.5);box-shadow:inset 0 0 30px -14px rgba(201,40,60,.9)}
.rt-tally-row[data-top="1"] .rt-tally-n{color:#e58490}

/* ── THE VERDICT AND THE CHAIR ──────────────────────────────────────── */
.rt-verdict{text-align:center;padding:8px 0 4px}
.rt-verdict-face{margin:0 auto 16px;filter:drop-shadow(0 18px 34px rgba(0,0,0,.85))}
.rt-verdict-nm{
  font-family:var(--rt-display);font-weight:900;font-size:clamp(30px,4.4vw,44px);
  letter-spacing:-.015em;color:var(--rt-bone);margin:0 0 6px;
}
.rt-verdict-word{
  font-family:var(--rt-display);font-weight:700;font-size:11px;letter-spacing:.4em;
  text-transform:uppercase;color:#e58490;
}
.rt-chair{margin:22px auto 0;max-width:460px;opacity:.9}
.rt-chair svg{width:100%;display:block}

/* the alignment, and it is a card that TURNS OVER */
.rt-reveal{
  position:relative;margin:20px auto 0;max-width:400px;height:190px;
  perspective:1200px;
}
.rt-reveal-inner{
  position:absolute;inset:0;transform-style:preserve-3d;
  animation:rt-flip .72s cubic-bezier(.25,.9,.3,1) .12s both;
}
@keyframes rt-flip{
  0%{transform:rotateY(180deg)}
  76%{transform:rotateY(-7deg)}
  100%{transform:rotateY(0)}
}
.rt-reveal-face,.rt-reveal-back{
  position:absolute;inset:0;backface-visibility:hidden;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
  border:1px solid rgba(222,214,196,.3);
}
.rt-reveal-back{transform:rotateY(180deg);background:linear-gradient(150deg,#1a2a20,#070c09)}
.rt-reveal-face[data-side="traitor"]{
  background:radial-gradient(120% 100% at 50% 0%,rgba(142,21,38,.6),rgba(10,4,6,.98));
  border-color:rgba(201,40,60,.65);box-shadow:0 0 60px -10px rgba(201,40,60,.6);
}
.rt-reveal-face[data-side="faithful"]{
  background:radial-gradient(120% 100% at 50% 0%,rgba(224,232,226,.22),rgba(7,12,9,.98));
  border-color:rgba(222,214,196,.4);box-shadow:0 0 60px -10px rgba(222,214,196,.34);
}
.rt-reveal-word{
  font-family:var(--rt-display);font-weight:900;font-size:38px;letter-spacing:.06em;
  text-transform:uppercase;
}
.rt-reveal-face[data-side="traitor"] .rt-reveal-word{color:#f0929c;text-shadow:0 0 30px rgba(201,40,60,.8)}
.rt-reveal-face[data-side="faithful"] .rt-reveal-word{color:#f2f5ef;text-shadow:0 0 30px rgba(222,214,196,.5)}
.rt-reveal-sub{font-family:var(--rt-hand);font-style:italic;font-size:16px;color:rgba(222,214,196,.72)}

/* the endgame's non-reveal: the same slot, holding nothing */
.rt-silence{
  margin:20px auto 0;max-width:460px;padding:34px 26px;text-align:center;
  border:1px dashed rgba(222,214,196,.24);background:rgba(4,7,5,.5);
}
.rt-silence-h{
  font-family:var(--rt-display);font-weight:900;font-size:22px;letter-spacing:.02em;
  color:var(--rt-bone);margin:14px 0 10px;
}
.rt-silence p{font-family:var(--rt-hand);font-style:italic;font-size:17px;
  line-height:1.6;color:rgba(222,214,196,.68);margin:0}

/* ── CHIPS ──────────────────────────────────────────────────────────── */
.rt-chips{display:flex;gap:11px;flex-wrap:wrap;margin-top:16px;padding-top:14px;
  border-top:1px solid rgba(222,214,196,.12)}
.rt-chip{
  display:inline-flex;align-items:center;gap:8px;padding:6px 12px;
  border:1px solid rgba(222,214,196,.22);
  background:linear-gradient(170deg,rgba(222,214,196,.1),rgba(222,214,196,.02));
  font-family:var(--rt-display);font-weight:700;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(222,214,196,.86);
}
.rt-chip[data-tone="bad"]{border-color:rgba(201,40,60,.45);color:#e58490;
  background:linear-gradient(170deg,rgba(201,40,60,.16),rgba(201,40,60,.03))}
.rt-chip[data-tone="cold"]{border-color:rgba(139,154,148,.32);color:var(--rt-pewter)}

/* the murmur under a card — the room, not the argument */
.rt-murmur{
  font-family:var(--rt-hand);font-style:italic;font-size:14.5px;
  color:rgba(139,154,148,.68);margin-top:12px;padding-left:15px;
  border-left:1px solid rgba(139,154,148,.26);
}

/* ── THE POT, under the ring ─────────────────────────────────────── */
.rt-pot{
  font-family:var(--rt-display);font-weight:900;font-size:15px;letter-spacing:-.01em;
  color:var(--rt-candle);text-shadow:0 0 18px rgba(255,243,210,.4);
}

/* ── REVEAL MACHINERY ───────────────────────────────────────────────── */
.rt-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.rt-beat.rt-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:28px}
/* ONE EASING FOR EVERY BEAT, AND IT IS SHORT. These fire on every click, so
   anything over half a second stops reading as motion and starts reading as
   lag. The two beats that carry weight -- a slate turned to face the room and
   the chair going back -- get the long end of it, and nothing else does. */
.rt-beat.rt-vis .rt-card,.rt-beat.rt-vis .rt-slate{
  animation-duration:.34s;animation-fill-mode:both;
  animation-timing-function:cubic-bezier(.22,.9,.3,1);
}
/* CARD PHYSICS — the cards move differently in every phase, and the way
   they move is what the phase IS. Leaning in over the table, laid face
   down, turned over to the room, drawn tight, pushed back. */
.rt-beat.rt-vis[data-phase="gather"]  .rt-card{animation-name:rt-seat}
.rt-beat.rt-vis[data-phase="debate"]  .rt-card{animation-name:rt-lean}
.rt-beat.rt-vis[data-phase="slates"]  .rt-card{animation-name:rt-facedown}
.rt-beat.rt-vis[data-phase="read"]    .rt-slate{animation-name:rt-turn;animation-duration:.52s}
.rt-beat.rt-vis[data-phase="read"]    .rt-card{animation-name:rt-seat}
.rt-beat.rt-vis[data-phase="revote"]  .rt-card{animation-name:rt-tighten}
.rt-beat.rt-vis[data-phase="revote"]  .rt-slate{animation-name:rt-turn;animation-duration:.52s}
.rt-beat.rt-vis[data-phase="verdict"] .rt-card{animation-name:rt-pushback;animation-duration:.5s}
.rt-beat.rt-vis .rt-host{animation:rt-hostin .3s ease both}
@keyframes rt-seat{
  from{opacity:0;transform:translateY(10px)}
  to{opacity:1;transform:none}
}
/* Leaning in over the table. The first pass put an 11deg rotateX on a card
   already carrying four box-shadows and a noise overlay -- a full repaint of
   the card on every frame, and it looked like one. A translate reads the
   same and costs nothing. */
@keyframes rt-lean{
  0%{opacity:0;transform:translateY(16px)}
  100%{opacity:1;transform:none}
}
@keyframes rt-facedown{
  0%{opacity:0;transform:perspective(1200px) rotateX(-20deg) translateY(-14px)}
  100%{opacity:1;transform:none}
}
/* ONE OF THE TWO THAT EARN THEIR LENGTH: a slate turned to face the room. */
@keyframes rt-turn{
  0%{opacity:0;transform:perspective(1200px) rotateY(72deg)}
  70%{opacity:1;transform:perspective(1200px) rotateY(-6deg)}
  100%{opacity:1;transform:none}
}
@keyframes rt-tighten{
  0%{opacity:0;transform:scale(1.035)}
  100%{opacity:1;transform:none}
}
/* AND THE OTHER: the chair going back. */
@keyframes rt-pushback{
  0%{opacity:0;transform:translateY(-24px) scale(1.02)}
  66%{opacity:1;transform:translateY(5px) scale(.998)}
  100%{transform:none}
}
@keyframes rt-hostin{from{opacity:0}to{opacity:1}}
.rt-knock{animation:rt-knock .38s cubic-bezier(.36,.07,.19,.97)}
@keyframes rt-knock{
  0%,100%{transform:translate(0,0)}
  16%{transform:translate(0,-7px)} 34%{transform:translate(0,4px)}
  56%{transform:translate(0,-3px)} 78%{transform:translate(0,2px)}
}

/* ── STICKY CONTROLS ────────────────────────────────────────────────── */
.rt-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(4,7,5,.1),rgba(4,7,5,.98) 44%);
  border-top:1px solid var(--rt-rule);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.rt-btn{
  font-family:var(--rt-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(222,214,196,.14),rgba(222,214,196,.03));
  color:var(--rt-bone);
  border:1px solid rgba(222,214,196,.38);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(255,243,210,.16);
}
.rt-btn:hover{background:rgba(222,214,196,.22);color:var(--rt-candle);
  box-shadow:0 0 26px rgba(255,243,210,.22),inset 0 1px 0 rgba(255,243,210,.3)}
.rt-btn[disabled],.rt-btn.rt-dim{opacity:.3;cursor:default;pointer-events:none}
.rt-counter{
  font-family:var(--rt-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:var(--rt-mute);min-width:86px;text-align:center;
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
.rt-none{max-width:620px;margin:0 auto;padding:64px 34px 90px;text-align:center}
.rt-none-h{
  font-family:var(--rt-display);font-weight:900;font-size:32px;letter-spacing:-.01em;
  color:var(--rt-bone);margin:22px 0 16px;text-shadow:0 3px 20px rgba(0,0,0,.8);
}
.rt-none p{font-family:var(--rt-hand);font-size:19px;line-height:1.65;
  color:rgba(222,214,196,.74);margin:0 auto 14px;max-width:520px}

/* ── RESPONSIVE ─────────────────────────────────────────────────────── */
@media(max-height:720px){
  /* not a width problem: a 450px ring stuck under a 46px bar leaves a short
     screen with no room to read the beat it is illustrating */
  .rt-stage{position:static}
}
@media(max-width:900px){
  /* the ring stops sticking rather than eating the screen: at this width it
     is more than half the viewport and the beats have nowhere to go */
  .rt-stage{position:static}
  .rt-hero{height:380px}
  .rt-seat{width:74px;margin-left:-37px;margin-top:-37px}
  .rt-seat .cv-av{width:40px;height:40px}
  .rt-seat-nm{font-size:9px}
}
@media(max-width:700px){
  .rt-main{padding:24px 18px 56px}
  .rt-head{padding:14px 20px}
  .rt-hero{height:320px}
  .rt-hero-lock{padding:0 20px 22px}
  .rt-host{grid-template-columns:1fr;gap:10px}
  .rt-accused{grid-template-columns:auto 1fr;gap:12px}
  .rt-accused-ct{grid-column:1/-1;text-align:left}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .rt-root *,.rt-root *::before,.rt-root *::after{animation:none!important;transition:none!important}
  .rt-reveal-inner{transform:none}
  /* the freshest chord is DRAWN by a dash offset, so switching the animation
     off has to put the offset back or the newest argument is an invisible
     line -- the one beat the reader is actually on */
  .rt-chord{stroke-dasharray:none;stroke-dashoffset:0}
  .rt-beat.rt-vis .rt-card,.rt-beat.rt-vis .rt-slate,.rt-beat.rt-vis .rt-host,
  .rt-tally-bar i{opacity:1;transform:none;filter:none}
  .rt-seat{opacity:1;filter:none;transform:scale(var(--s,1))}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// NARRATION
// ══════════════════════════════════════════════════════════════════════
//
// Four variants minimum per slot, picked by a hash of the beat's own facts.
// Not one line here contains a host's name or either of the show's two exit
// words: the host resolves through `_host()` and the words through `_verbs()`,
// and tests/tr-vp.test.js scans this file for both.

const HOST_LINES = {
  open: [
    'Sit down. All of you. Nobody leaves this room until a name has been said out loud.',
    'Take your places. In a few minutes one of you will not have one.',
    'Somebody at this table killed one of your friends last night. Somebody at this table is going to smile at you about it.',
    'Look around the table. Count the faces. The number is smaller than it was yesterday, and one of the ones left did that.',
  ],
  debate: [
    'So say it. Out loud, to the face, while everybody is watching.',
    'You have suspicions. This is the only hour of the day you are allowed to spend them.',
    'Talk. And listen to who talks back, and to who does not.',
    'Accuse each other. It is the only tool any of you have, and it is a blunt one.',
  ],
  write: [
    'Enough. Pick up your chalk.',
    'That is the debate. Write a name.',
    'Stop talking and start writing. One name each, and no one may sit it out.',
    'Chalk down. One name, and be certain, because you are about to read it aloud yourselves.',
  ],
  read: [
    'Turn them over. One at a time, so the room can watch each other hear it.',
    'Show me. And show each other, which is the part that will cost you.',
    'Read them out. This is the only true thing any of you will be given all day.',
    'Hold it up. Everything else in this castle is a guess; this is not.',
  ],
  count: [
    'Then the room has decided, and the room will find out shortly what it decided.',
    'That is the count. Nobody gets to take it back.',
    'The chalk is dry. Let us see what you have done to yourselves.',
    'The names are in. Now the room lives with them.',
  ],
  tie: [
    'A tie. Which means we go again, and only the tied are in question — and they do not get a say.',
    'You have split yourselves. The two of you may sit and listen; everybody else, chalk up.',
    'Nobody wins a tie in this castle. We do it again, smaller.',
    'Level. So the rest of you will decide it without them, and they will watch you do it.',
  ],
  // `{banish}` and `{Nm}` are filled at the last possible moment — the verb
  // from the registry through `_verbs()`, the name off the record. A host line
  // that spelled either of them out is the bug this whole file is careful
  // about, one clause further in.
  verdict: [
    '{Nm}. The room has spoken, and you are {banish}.',
    'That is a majority. {Nm} is {banish} — say goodbye to the people who did it.',
    'It is done. {Nm} is {banish}, tonight, by the hands of everybody sitting here.',
    '{Nm} is {banish}. Whatever the truth turns out to be, this room chose it together.',
  ],
  reveal: [
    'Before you go — tell them what you were.',
    'Turn it over. Let them see what they have just done.',
    'One more thing, and it is the only certainty this room will get today.',
    'Show them. They have earned the answer, one way or the other.',
  ],
  silence: [
    'And this far in, nobody is told anything. You will sit with it.',
    'No. Not tonight. From here you find out at the end, or you do not find out.',
    'There is no answer coming. That is the game now.',
    'You will get nothing. Whatever you decided, you decided it blind, and you live in it.',
  ],
};

// ══════════════════════════════════════════════════════════════════════
// THE HOST PUTS IT TO SOMEBODY — by name
// ══════════════════════════════════════════════════════════════════════
//
// WHAT WAS WRONG. Every line in `HOST_LINES` above is addressed to the room:
// 'sit down', 'so say it', 'pick up your chalk'. Correct for the slots they
// fill, and it left the host as a master of ceremonies who could have been
// reading the same script over any table of any season. In the format he is a
// PARTICIPANT at this table -- he leans on one person, by name, using a thing
// that has already happened in front of everybody, and the room watches them
// answer him.
//
// So these are addressed to ONE PERSON, and which person is chosen from the
// table's own record before any pool is read: who this room is converging on,
// who is doing the converging, or who has said nothing at all. All three are
// public facts -- accusations made out loud at this table -- so the beat is
// identical on every observer layer, which is what a host beat has to be.

const NEEDLE_CONVERGE = [
  '{Nm}. {n} people have said your name tonight and you have answered none of them properly. '
  + 'Would you like to try, or would you like to keep looking at the table?',
  '{Nm}, {n} of them have decided you are the interesting one this evening. How does that feel from where you are sitting?',
  'Let us start with {Nm}, since {n} of them already have. {Nm}, they think it is you. Are they right?',
  '{Nm}. You have had all day to think of an answer to this. I do hope it is a good one.',
  'I want to hear from {Nm} first, and I want the rest of you to watch {them} do it.',
  '{Nm}, you are the name in this room. Tell them why they are wrong, and tell them properly.',
];
const NEEDLE_ACCUSER = [
  '{Nm}, you have been very sure of yourself tonight. What happens to you if you are wrong?',
  '{Nm} has done most of the talking at this table. {Nm}, if that slate comes back the wrong colour, this room will remember it was you.',
  'You have led this, {Nm}. I hope you have thought about tomorrow morning as well as tonight.',
  '{Nm}, you built this case. In a few minutes you will find out whether you built it out of anything.',
  '{Nm}, you are asking everybody here to follow you. That is a great deal to ask of people who do not know you.',
  'A confident evening for {Nm}. I hope for your sake it was more than that.',
];
const NEEDLE_SILENT = [
  '{Nm}. You have not said a word. Is that a strategy, or is it a hiding place?',
  'I notice {Nm} has contributed nothing at all this evening. {Nm}, this is the part where that stops being clever.',
  '{Nm}, everybody else has put a name in the air. You have not. Why is that?',
  'The quietest person at this table is {Nm}, and the quietest person at a table is always worth a look.',
  '{Nm} has been extremely careful tonight. That works until it does not, and this table is where it stops working.',
  'Nothing from {Nm}. Nothing last night either. At some point, {Nm}, silence starts to say something on your behalf.',
];
const NEEDLE_NOBODY = [
  'Not one of you has said a name. That is either a very peaceful table or a very frightened one.',
  'You have sat here for an hour and produced nothing. Somebody in this room is delighted about that.',
  'No accusations at all. Marvellous. You are going to write down names anyway, and you are going to do it blind.',
  'An entire evening and not one person named. Whoever arranged that is having a very good night.',
];

/**
 * WHO THE HOST GOES AT, and the order is the show's. The person the room has
 * converged on is the one it wants to hear from; failing that, the person
 * driving the convergence; failing that, the person who has not spoken. All
 * three are read off `v.accusations`, which is what was said out loud at this
 * table and is therefore public on every layer.
 */
function _needle(v) {
  const counts = new Map();
  const made = new Map();
  for (const a of v.accusations) {
    counts.set(a.target, (counts.get(a.target) || 0) + 1);
    made.set(a.accuser, (made.get(a.accuser) || 0) + 1);
  }
  const top = arr => [...arr].sort((x, y) => y[1] - x[1]
    || String(x[0]).localeCompare(String(y[0])))[0];
  // 1. The name this room keeps coming back to -- but only if it IS coming
  //    back to it. One person naming one person is not a convergence.
  const t = top(counts);
  if (t && t[1] >= 2 && v.seated.indexOf(t[0]) >= 0) {
    return { pool: NEEDLE_CONVERGE, who: t[0], n: t[1] };
  }
  // 2. Whoever is driving it.
  const m = top(made);
  if (m && v.seated.indexOf(m[0]) >= 0) return { pool: NEEDLE_ACCUSER, who: m[0] };
  // 3. Somebody who has neither accused nor been accused. Deterministic pick,
  //    never random: this screen is rebuilt on every reveal.
  const spoke = new Set([...counts.keys(), ...made.keys()]);
  const quiet = v.seated.filter(n => !spoke.has(n));
  if (quiet.length) {
    return { pool: NEEDLE_SILENT,
      who: quiet[_hash('rt|quiet|' + v.ep + '|' + quiet.join(',')) % quiet.length] };
  }
  // 4. Nobody said anything at all, which is its own beat.
  return { pool: NEEDLE_NOBODY, who: null };
}

// AND THE SIGN-OFF, which is the most implicated thing the host says all week:
// he addresses the people who are about to do it, in a room where the rest of
// them are listening, and everybody has to sit there and take it. The verb is
// filled from the registry at the last moment like every other verb in this
// file -- `{kill}` is never written out.
const HOST_SENDOFF = [
  'The rest of you, go to bed. Traitors — you have work tonight, and one of these faces will not be at breakfast.',
  'Off you go. Traitors, whoever you are: choose well. The rest of you, sleep if you can manage it.',
  'That is tonight. Somewhere in this room are people who now have a second decision to make, and they will be making it without you.',
  'Goodnight to all of you. To two or three of you, good luck — you have somebody to {kill} before morning.',
  'Go up. Traitors, the castle is yours for a few hours. Do try to be interesting about it.',
];

const ACCUSE_LINES = [
  '{A} keeps coming back to {t}, and will not be talked off it.',
  '{A} says it is {t}, looking straight down the table and refusing to look away.',
  '{A} lays out the week and every part of it ends at {t}.',
  '{A} names {t}. No hedging, no softening, and no route back from it afterwards.',
  '{A} asks {t} a question with the answer already written on {pos} face.',
  '{A} will not let {t} finish a sentence tonight.',
  '{A} says the quiet thing: {t} has been in the right room every single time.',
  '{A} points across the wood at {t} and lets the silence do the rest.',
];
// SPOKEN, first person, because these go inside quotation marks with a face
// beside them. The pool above is NARRATION and belongs in a paragraph: the
// first draft put "Caleb names Amy" in Caleb's own mouth, which is the kind of
// defect no assertion catches and a single read of the output does.
const ACCUSE_SAID = [
  'It is {t}. I have thought about nothing else since yesterday morning, and it is {t}.',
  'I want to ask {t} something, and I want all of you watching {pos} face while {sub} answers it.',
  'Every time something has gone wrong this week, {t} has been standing exactly where it went wrong.',
  'I am not going to dress it up. I think it is {t}, and I think most of you think so too.',
  'Tell me I am wrong, {t}. Out loud. Now, in front of everybody.',
  'I have spent all week defending {t}. I am finished doing that.',
  'Nobody else is going to say it, so I will. {t}.',
  'If I am wrong about {t} then I should be the next one out of that door, and I will take it.',
];
const ACCUSED_REPLY = [
  '{T} takes it flat, which half the room reads as innocence and the other half as practice.',
  '{T} answers too fast, and the room hears the speed rather than the words.',
  '{T} says the only true thing {sub} has left: that being suspected is not evidence.',
  '{T} laughs, and it lands badly.',
  '{T} says nothing at all, and lets the accusation sit there getting older.',
  '{T} turns it round and asks who put the idea in {a}’s head.',
];
// THE ACCUSED ANSWERS, in their own voice — the show gives everyone the floor to
// defend themselves before the slates. First person; asserts nothing but the
// bare fact of being accused, which every layer can see. Original lines.
const ACCUSED_DEFENCE = [
  'I did not touch anyone. I cannot prove that to you, and I know exactly how that sounds from where I am sitting.',
  'You want a Traitor and I am the easiest name in this room. Those are not the same thing, and you all know it.',
  'Ask yourself who is loudest about me tonight. Then ask yourself why they need me gone before I can talk.',
  'If you send me out and I was one of yours, you have just done their work for them, in the open, for free.',
  'Every one of you has had an hour today you could not fully account for. Tonight you have decided it is mine.',
  'Write my name if you have already made your minds up. But you will be back here next week with the same problem.',
];
// AND SOMETIMES THROWS IT BACK — only at a name they ACTUALLY put up tonight
// (`byTarget` says so), never an invented one. `{d}` is that name.
const ACCUSED_DEFLECT = [
  '{T} will not sit there and wear it, and says the name right back: {d}.',
  '{T} answers a name with a name — before you look at me, look at {d}.',
  '{T} turns the whole table around by pointing at {d} and refusing to be the only one on trial.',
];
// AND WHY THAT NAME. The deflection used to end at the name, so the counter --
// the commonest move at any table -- was pure reflex: somebody accused, and
// somebody said a name back with nothing under it. When the deflector holds a
// citable record against the person they are pointing at, it goes on the wood
// with the name. `{d}` is the name, `{dsrc}` their own stored reason.
const DEFLECT_SOURCE = [
  'And {T} is not doing it empty-handed: {dsrc}.',
  'It is not just a name thrown back. {T} has a reason for {d}, and gives it: {dsrc}.',
  '{T} puts something under it before anybody can call it a reflex: {dsrc}.',
  'The room was ready to hear a name and nothing else. What it gets is a reason: {dsrc}.',
];
// HOW A SPEAKER PUTS THEIR EVIDENCE ON THE TABLE. `{src}` is the exact reason
// their belief carries — drawn from the stored source, never invented — so the
// claim is never "{A} finds {t} suspicious" but a thing that actually happened.
// The framing lets the source phrase stand as the reason.
const CLAIM_SOURCE = [
  '{A} backs the accusation up with something specific: {src}.',
  'And {A} has evidence — {src} — which is more than most accusations at this table come with.',
  '{A} gives the table a reason, not just a name: {src}.',
  '{A} does not stop at the name. {A} says why: {src}.',
];
// AND WHEN THERE IS NOTHING TO CITE, WHICH IS BETTER THAN A QUARTER OF THE
// TIME. These four pools are the counterpart of CLAIM_SOURCE above and exist
// for the same reason it does: the screen used to print the name and stop, so
// 27% of the debate was somebody accusing somebody of murder and offering the
// room no reason of any kind. None of these invents evidence. Each says which
// KIND of nothing the speaker is working from, which is honest and is a better
// scene than silence -- the hearsay pool especially, because the room's echo
// is a thing the format runs on and a bare name hid it completely.
// Keyed by `reasonKind` from js/tr/roundtable.js `_reasonFor`.
const NO_SOURCE = {
  // Somebody else said it first, at this table, and it went round.
  hearsay: [
    '{A} cannot point at anything {asub} saw. {Asub} can point at {f}, who said it first, and that is the whole of it.',
    'Pressed for a reason, {A} gives one: {f} thinks so. That is not evidence and it has still moved the room.',
    'It came from {f} and it has been going round ever since. {A} is repeating it back at the table it started at.',
    'The reason is {f}. {A} does not say that out loud, and everybody who was here last night works it out anyway.',
    '{A} is certain, and every bit of the certainty was handed over by {f} at this same wood.',
    'Ask {A} where it came from and the answer is a person, not a thing. The person is {f}.',
    'Every part of this reached {aobj} secondhand, from {f}, and {asub} is delivering it like a discovery.',
  ],
  // Something the whole room already has, so it reads as nobody's insight.
  public: [
    '{A} offers a reason everybody at this table already had, which persuades exactly nobody.',
    '{A} points at something the whole room already saw happen, which convinces nobody who was there.',
    '{A} has no information the rest of them do not have, and says it like a discovery anyway.',
    'Every person here could have made that speech. {A} is the one who chose to.',
    'The room hears its own knowledge repeated at it and stays exactly where it was.',
  ],
  // They had something. It has stopped being true under them.
  'gone-cold': [
    '{A} is still working from something that stopped being true days ago, and has not noticed.',
    'The reason {A} has is out of date. {Asub} says it with all of last week’s certainty.',
    'That was a good read on Tuesday. {A} is the last person in the castle still holding it.',
    'Whatever {A} had is days old now, and {asub} is still arguing as if it just happened.',
    '{A} is answering a question the week has already moved past.',
  ],
  // No record at all. A bond, a manner, an accumulation of small things.
  feeling: [
    '{A} has no reason and does not pretend to have one. It is a feeling, and {A} says so out loud.',
    'Asked why, {A} cannot say. Not evasively — {asub} genuinely cannot put a thing under it.',
    '{A} has noticed a dozen small things about {t} this week, and none of them are enough to say out loud on their own.',
    '{A} is going on the way {t} has been behaving, which is hard to pin down but impossible to ignore.',
    '{A} has no evidence — just a gut feeling about {t}, and the room has to decide whether that is enough.',
    '{A} admits it is instinct, not proof, and says the name anyway.',
  ],
};

// A LISTENER MOVED. Not because the writer needed a flip — because the claim
// reached them and it now sits at the top of what they believe. `{who}` is the
// mover, `{t}` the name they have moved onto.
const MINDCHANGE_TEXT = [
  '{who} had a different name in mind an hour ago. Not any more — {who} is writing {t} now, and '
  + 'says so before the chalk is even out.',
  'It lands on {who}. You can see it land: {who} was undecided, and now {who} is not, and the '
  + 'name {sub} has settled on is {t}.',
  'Across the table {who} changes {pos} mind in real time — the argument lands, and {t} is the '
  + 'name {who} is writing now.',
  '{who} nods slowly, the way people do when an argument has actually moved them. {t}. That is '
  + 'where {who} is now.',
];
const MINDCHANGE_MORE = [
  'And {who} is not the only one the argument turned.',
  'A couple of others quietly change their vote to match {obj}.',
  'The name travels; it does not stop at one slate.',
];

// THE AUDIENCE'S PRIVILEGE, and nobody else's. Stripped off the record in
// `_view` before a player observer's screen is built, and never written at a
// finale table.
const IRONY_TRUE = [
  'And the room is right — {t} really is a Traitor. They have no proof, but they have the right name.',
  'Correct, even though the reasoning that got them here was wrong.',
  'They have the right name. Watch how little that is worth in a minute.',
  'True — which at this table is a coincidence more often than it is a deduction.',
  'The room has it. The room will now talk itself out of it.',
];
const IRONY_FALSE = [
  'And it is not true. Not a word of it.',
  'Wrong, and expensively so.',
  'This is a loyal player being taken apart for having an honest face.',
  'Nothing here is true. The room built it out of nerves and one bad breakfast.',
  'Innocent, and about to spend the rest of the hour proving a negative.',
];
const IRONY_STEER = [
  'And most of the hands pointing here belong to the people who did it.',
  'Steered. The pact picked this name before the room did, and the room has not noticed.',
  'The loudest accusers at this table have the most obvious reason to be loud.',
  'A clean player, held up by the very people who know it.',
];

const WRITE_TEXT = [
  'Chalk on slate. No conferring, no changing it once it is down, and everybody writes.',
  'Twenty seconds of scratching, and then a silence with a name in every hand.',
  'They write with their arms curled round the board like schoolchildren, which is exactly what it looks like.',
  'Heads down. Some of them wrote before the debate finished; some are still deciding with the chalk moving.',
];
const READ_FIRST = [
  'First name on the wood tonight.',
  'The first one turned over, and the room leans in for it.',
  'Nothing has been decided yet. This is where it starts.',
  'One slate up, and every face in the room is watching it rather than the hand holding it.',
];
// TEN, NOT FOUR, AND THE NUMBER IS ARITHMETIC RATHER THAN TASTE. This is the
// routine-join line and it is drawn once per slate that adds to a pile which
// already exists — on a seventeen-person table that is a dozen draws from one
// pool. Four lines cannot cover twelve draws; they can only be rearranged, and
// a real night printed "Same name again. Nobody in the room misses it." three
// times down one board. The draw is rotated as well (see the call site), which
// stops two adjacent slates matching; the extra lines are what stop the same
// sentence coming round twice on one reading.
const READ_JOIN = [
  'That is another for {t}.',
  '{T} takes a second look down the table, and a third name is already coming.',
  'The pile in front of {t} grows.',
  'Same name again. Nobody in the room misses it.',
  'Another one for {t}, and the room has stopped being surprised by it.',
  '{T} does not react this time. The table notices that too.',
  'That name again. Somebody down the table lets out a breath.',
  'It goes on the same pile, and the pile is starting to look like a decision.',
  'One more for {t}. Nobody writes a name twice by accident.',
  '{T} watches it land and says nothing at all.',
];
const READ_NEW = [
  'A name nobody had said out loud all evening.',
  'That one was not in the debate at all.',
  'A slate out of nowhere, and half the table turns to look at the wrong person.',
  'Somebody has been keeping their own counsel.',
];
const READ_LEAD = [
  'And with that, {t} is in front.',
  'The count turns. It is {t} now, and {sub} knows it.',
  '{T} moves ahead, and the arithmetic in the room changes shape.',
  'That puts {t} on top of the pile.',
];
const READ_BACK = [
  '{A} writes down the name of the person who just wrote {pos}.',
  'Both ways across the table, in the same handwriting hour.',
  'They chose each other. One of them is about to find out what that cost.',
  'A straight exchange, and neither of them looks away while it happens.',
];

const COUNT_TEXT = [
  'The chalk is read. The count is the only fact this room owns.',
  'That is all of them, in the order they were held up.',
  'Every slate turned. Now the room has to look at the shape it made.',
  'The count, and the faces round it doing sums they will not say out loud.',
];
const TIE_TEXT = [
  'Level. The format is unkind about this: only the tied are in question, and they are not allowed to speak for themselves with chalk.',
  'Level pegging, so the room goes again — without the two people it is about.',
  'Split down the middle. The tied put their chalk down and watch everybody else pick theirs up.',
  'Nobody has a majority. The room does it again, and this time the people at risk have no say in it.',
];
const VERDICT_TEXT = [
  'The chair is pushed back. The room does not look up.',
  'Whatever anybody says now, the count already said it.',
  'A short walk, and the table is one seat emptier for the rest of the season.',
  'The room watches the door and then very carefully does not look at each other.',
];
// WHAT THEY SAY ON THE WAY OUT.
//
// `speech.text` on the record is the engine's NARRATION -- "X names Y on the
// way out" -- and the first draft of this card put that sentence inside
// quotation marks with X's face beside it, so the leaver stood there
// describing themselves in the third person. The record's FACTS are what this
// screen takes (`burns`, and the name if there is one); the words are the
// screen's. `speech.text` stays on the record for a reader that wants a
// sentence rather than a scene.
const BURN_SAID = [
  'Before I go — it is {t}. Look at {obj}. It has been {t} this whole time.',
  'You have made a mistake, and the mistake is sitting right there. {t}.',
  'I hope you are all very pleased with yourselves. Watch {t}. That is all I will say.',
  'One thing. {t}. When you finally work it out, remember who told you first.',
  'I am not angry at all of you. I am angry at {t}, and you should be as well.',
  'Fine. But start with {t}, because I have run out of time to prove it myself.',
];
const QUIET_SAID = [
  'I have no idea who it is. I hope one of you does.',
  'I do not blame anybody here. I would probably have written my own name too.',
  'Well. That is that. Be careful with each other.',
  'I got it wrong. I hope the rest of you get it right.',
  'Nothing clever from me. Just think about who wanted this.',
  'I would wish you luck, but most of you do not seem to need any.',
];
const SPEECH_BURN = [
  'And it is not a quiet exit.',
  'The parting shot, aimed and delivered.',
  'Nothing left to protect, so nothing gets protected.',
  'One last accusation, thrown from the doorway.',
];
const SPEECH_QUIET = [
  'It is said quite evenly, which somehow lands harder.',
  'A last sentence, and it is almost kind.',
  'No shouting. Just the name and the door.',
  'Said evenly, to a room that will be arguing about it by breakfast.',
];
const REVEAL_TRAITOR = [
  'The room got one. It will be unbearable about this for two days and it will get the next one wrong.',
  'They had it. Out of everything they guessed at this evening, this one was true.',
  'A hit — and every read that produced it was luck stacked on a hunch.',
  'Right. The table erupts, and the two still sitting in it erupt loudest.',
];
const REVEAL_FAITHFUL = [
  'Wrong. The room spent its one certain fact on somebody who was on its side.',
  'A loyal player, removed by the people they were loyal to.',
  'The count was clean and the answer was wrong, which is the worst combination this table produces.',
  'They did that to one of their own, in the open, unanimously enough.',
];
// FIRST PERSON, SPOKEN AT THE DOOR. The banished turns their own card — the
// one certainty the format hands the room comes out of the mouth of the person
// leaving. Original lines; the only fact they may assert is the alignment the
// record already reveals here (never in the endgame, where nothing is turned
// over).
const ANNOUNCE_TRAITOR = [
  'I am a Traitor. I have been one since the first night, and every one of you sat next to it and smiled.',
  'Yes. It was me. You will want to remember that I was not the only one at this table.',
  'Traitor. You got one right — and you have no idea how far that is from getting them all.',
  'I am a Traitor. Look hard at who was quietest tonight, because I am leaving one behind.',
];
const ANNOUNCE_FAITHFUL = [
  'I am a Faithful. I always was, and you have just done their work for them.',
  'Faithful. Every single day. Look at what you have done, and look at who talked you into it.',
  'A Faithful. That is what this room burned tonight, and the ones who wanted it are still sitting there.',
  'I am a Faithful — and now you get to live with that while a Traitor of yours walks free.',
];
// THE ROOM, AFTER. Public on every layer — the mood of a table that has just
// been handed its one true thing, or spent it on an innocent.
const REACT_TRAITOR_PUBLIC = [
  'The table comes apart — relief and fury at once, and under both the same cold arithmetic: how many are left.',
  'For a moment nobody can look at anybody. They were right, and being right feels like nothing they expected it to.',
  'For the first time all week a read has paid off, and the faces round the table do not quite know what to do with being right.',
  'Somebody starts to celebrate and thinks better of it. There are still chairs at this table that have not been turned over.',
];
const REACT_FAITHFUL_PUBLIC = [
  'The silence goes on a beat too long. Every person at this table is now somebody who did that.',
  'A hand goes to a mouth. The apology forms and there is no one left in the chair to give it to.',
  'They look at each other and understand, all at once, that a Traitor is still here, wearing one of these sorry faces.',
  'Nobody says the obvious thing out loud: whoever wanted this one gone the most is the one to watch now.',
];
// AUDIENCE PRIVILEGE. Only the crowd sees the surviving pact react — same
// channel as the debate's "what the room cannot see". `{who}` is a Traitor
// still seated; never rendered on a player layer, where `v.truth` is null.
const REACT_TRAITOR_HIDDEN = [
  '{who} keeps a straight face and does the only sum that matters: the pact down by one, and every remaining pair of eyes now free to turn their way.',
  'A friend just went out that door and {who} mourns nothing — only measures how much warmer the room got, and how much colder.',
  '{who} grieves loudly for exactly as long as the others are watching, and not one second past it.',
];
const REACT_FAITHFUL_HIDDEN = [
  '{who} lets the room do the grieving and does not have to fake a thing — the table just spent its knife on one of its own.',
  'Behind a sympathetic face, {who} is having the best night of the week and cannot let a muscle of it show.',
  'The pact loses no one and the room loses a friend, and {who} keeps the smile off {pos} face by an act of pure will.',
];
const SILENCE_TEXT = [
  'Nobody is told anything. Not tonight, not at this number, not ever again.',
  'The chair empties and the room learns precisely nothing from it.',
  'No answer. The survivors go back to the fire with exactly the beliefs they arrived with.',
  'The seat is gone and the truth goes with it. From here it is nerve and nothing else.',
];

/** The room, rather than the argument. Ambient, one under some cards. */
const MURMUR = [
  'Somebody laughs and immediately wishes they had not.',
  'A chair scrapes at the far end and nobody turns round.',
  'The candles above the table have been guttering all evening on the same draught.',
  'Two of them have not looked at each other since the doors closed.',
  'Somebody is turning a piece of chalk over and over without writing anything.',
  'The wax is dripping onto the wood and nobody has moved to stop it.',
  'One of them keeps counting the empty chairs.',
  'Water is poured. Nobody drinks it.',
  'A cough, in the pause, from the one person nobody had been watching.',
  'The wood under the chalk is scratched all over from every night before this one.',
  'Somebody at the far end has their arms folded and has not spoken once.',
  'The room has gone quiet in a way that is entirely about the person not speaking.',
];

// ══════════════════════════════════════════════════════════════════════
// CARD PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function _card(title, label, ic, inner, iconFn) {
  const draw = iconFn || _ic;
  return '<div class="rt-card">'
    + '<div class="rt-card-label">' + draw(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="rt-card-title">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _said(who, line) {
  return '<div class="rt-said">' + _av(who, 44)
    + '<div><div class="rt-said-txt">&ldquo;' + line + '&rdquo;</div>'
    + '<cite>' + _esc(who) + '</cite></div></div>';
}
function _murmur(key) {
  return '<div class="rt-murmur">' + _pick(MURMUR, key) + '</div>';
}
function _chip(text, tone) {
  return '<span class="rt-chip"' + (tone ? ' data-tone="' + tone + '"' : '') + '>'
    + _esc(text) + '</span>';
}
function _hostBand(line) {
  return '<div class="rt-host">' + _hostAv(52)
    + '<div><div class="rt-host-name">' + _ic('candles', 12) + _esc(_host().name) + '</div>'
    + '<div class="rt-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}
function _faceChip(name, size) {
  return '<span class="rt-face-chip">' + _av(name, size || 26)
    + '<span class="rt-face-nm">' + _esc(name) + '</span></span>';
}

/**
 * ONE SLATE, HELD UP.
 *
 * `data-voter` / `data-target` are not decoration. They are how
 * tests/tr-vp.test.js reads back the exact set of (voter, name) pairs this
 * screen rendered and compares it to `publicBallots()` — a guard that greps
 * prose for a name cannot tell "Bowie wrote Chet" from "Chet wrote Bowie", and
 * the private ballots it has to catch are pairs of people who are BOTH at this
 * table for perfectly public reasons.
 */
function _slate(b, ord, run) {
  return '<div class="rt-slate" data-voter="' + _esc(b.voter) + '"'
    + ' data-target="' + _esc(b.target || '') + '"'
    + ' data-channel="' + _esc(b.channel) + '">'
    + '<div class="rt-slate-face">'
    + '<div class="rt-slate-ord">' + _esc(ord) + '</div>'
    + (b.target
      ? '<div class="rt-slate-name">' + _esc(b.target) + '</div>'
      : '<div class="rt-slate-none">left blank</div>')
    // "WRITTEN BY", AND IT IS NOT DECORATION EVEN THOUGH IT IS NOT DRAWN.
    // On the slate the relation is obvious: a name in chalk, a rule under it,
    // and the face of whoever wrote it. Read back as text -- which is what the
    // transcript does, and what a screen reader does -- it is two names in a
    // row, and "Beth Alejandro" does not say which of them wrote the other
    // down. Found by dumping a season and reading it. Clipped rather than
    // hidden, because `display:none` is not read out either.
    + '<div class="rt-slate-by">' + _av(b.voter, 30)
    + '<span class="rt-vh">written by </span>'
    + '<span class="rt-slate-by-nm">' + _esc(b.voter) + '</span></div>'
    + '</div>'
    + (run && run.length ? '<div class="rt-slate-run">' + run + '</div>' : '')
    + '</div>';
}

/**
 * The running count, printed on the slate's frame.
 *
 * `justNamed` IS ALWAYS SHOWN, AND THAT IS THE WHOLE POINT OF THE ARGUMENT.
 * The strip is the top six by count, and a name that has just received its
 * FIRST vote sorts last among the ones — so on a seventeen-person table the
 * board stopped moving somewhere around slate fourteen. Three consecutive
 * slates read out three different names and printed the identical tally under
 * all of them, because none of the three could get into the top six.
 *
 * A running count whose whole job is to show the vote that was just read may
 * not be capable of omitting it. So the cap still holds at six, and the name
 * on the slate takes one of the places.
 */
function _runStrip(tally, leaders, justNamed) {
  const rows = Object.keys(tally).sort((a, b) => tally[b] - tally[a] || a.localeCompare(b));
  let shown = rows.slice(0, 6);
  if (justNamed && tally[justNamed] != null && shown.indexOf(justNamed) < 0) {
    shown = rows.slice(0, 5).concat([justNamed])
      .sort((a, b) => tally[b] - tally[a] || a.localeCompare(b));
  }
  return shown.map(n =>
    '<span class="rt-run-chip"' + (leaders.indexOf(n) >= 0 ? ' data-lead="1"' : '')
    + (n === justNamed ? ' data-just="1"' : '') + '>'
    + _esc(n) + ' <b>' + tally[n] + '</b></span>').join('');
}

/** The count, as a board. Bars are proportional; numbers are the fact. */
function _tallyBoard(tally, leaders) {
  const rows = Object.keys(tally).sort((a, b) => tally[b] - tally[a] || a.localeCompare(b));
  const max = rows.length ? tally[rows[0]] : 1;
  return '<div class="rt-tally">' + rows.map(n =>
    '<div class="rt-tally-row"' + (leaders.indexOf(n) >= 0 ? ' data-top="1"' : '') + '>'
    + _av(n, 32)
    + '<span class="rt-tally-nm">' + _esc(n) + '</span>'
    + '<span class="rt-tally-n">' + tally[n] + '</span>'
    + '<span class="rt-tally-bar"><i style="width:' + Math.round(tally[n] / max * 100) + '%"></i></span>'
    + '</div>').join('') + '</div>';
}

/** The chair, pushed back and left where it is. */
function _chair() {
  return '<svg viewBox="0 0 460 190" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
    + '<defs><linearGradient id="rtChairG" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#28372c"/><stop offset="100%" stop-color="#0a120d"/>'
    + '</linearGradient></defs>'
    + '<ellipse cx="230" cy="176" rx="140" ry="12" fill="#030604" opacity=".8"/>'
    + '<path d="M170 168V54a60 44 0 0 1 120 0v114z" fill="url(#rtChairG)" stroke="#3b4d40" stroke-width="2"/>'
    + '<path d="M186 148V60a44 32 0 0 1 88 0v88z" fill="none" stroke="rgba(255,243,210,.14)" stroke-width="1.5"/>'
    + '<path d="M170 122h120" stroke="#3b4d40" stroke-width="3"/>'
    + '<path d="M176 168v12M284 168v12" stroke="#3b4d40" stroke-width="5"/>'
    + '<path d="M60 128q170 -26 340 0" fill="none" stroke="rgba(255,243,210,.1)" stroke-width="2"/>'
    + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the observer contract, and the channel filter, in one place
// ══════════════════════════════════════════════════════════════════════

/** Ballots into a count. The Dagger is a WEIGHT, never a second ballot. */
function _tally(ballots, dagger) {
  const t = {};
  for (const b of ballots) {
    if (!b.target) continue;
    const w = (dagger && dagger.holder === b.voter) ? (dagger.votes || 1) : 1;
    t[b.target] = (t[b.target] || 0) + w;
  }
  return t;
}
function _leaders(t) {
  const vals = Object.keys(t).map(n => t[n]);
  if (!vals.length) return [];
  const max = Math.max.apply(null, vals);
  return Object.keys(t).filter(n => t[n] === max);
}

/**
 * WHAT THIS OBSERVER IS ALLOWED TO BE SHOWN, decided once, at the top.
 *
 * TWO THINGS HAPPEN HERE AND NOWHERE ELSE.
 *
 * 1. `publicBallots()` — js/shows.js, reading the registry's own list of
 *    private channels — is applied to `votes`, and the raw array is dropped on
 *    the floor. The conclave's murder ballots ride in that array and are told
 *    apart from this table's by `channel` alone; Plan 7 caught
 *    js/social/archive.js iterating it unfiltered and publishing five nights
 *    of the turret as public events. Nothing downstream of this function is
 *    ever handed `rec.votes`, so no later edit to a card can reach one.
 *
 * 2. The AUDIENCE'S PRIVILEGE is stripped off the record rather than hidden in
 *    the markup. `truth` is every seat's real alignment and `betrayals` is a
 *    Traitor writing a Traitor's name — both are ground truth, both belong to
 *    the people watching at home, and neither is a thing a player at this
 *    table could know. They are deleted for a `player:` observer, so the card
 *    that prints them has nothing to print rather than a flag to obey.
 *
 * AND THE ENDGAME KEEPS NOTHING (spec §8). `chosenAlignment` is dropped for a
 * finale table on every layer including the audience's: there are no reveals
 * from that point, and the absence is the design. js/tr/headless.js already
 * refuses to write the field onto a finale record; this refuses again, so
 * neither lock is load-bearing on its own.
 */
function _view(rec, observer) {
  if (!rec) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const endgame = !!rec.endgame;

  const pub = publicBallots(rec, TR);
  const first = pub.filter(b => b.channel === 'banishment');
  const later = pub.filter(b => b.channel === 'banishment-revote');

  // The revote ballots, split back into the rounds that cast them. The count
  // per round is READ off the record (`js/tr/headless.js` writes what the tie
  // loop actually cast) rather than guessed from the tied set, because the
  // format's rule — the tied do not vote — is the engine's to state and not
  // this screen's to re-derive.
  const rounds = [];
  let at = 0;
  for (const rv of rec.revotes || []) {
    const n = rv.count != null
      ? rv.count
      : Math.max(0, (rec.seated || []).length - (rv.tied || []).length);
    rounds.push({ tied: rv.tied || [], ballots: later.slice(at, at + n) });
    at += n;
  }
  if (at < later.length && rounds.length) {
    const last = rounds[rounds.length - 1];
    last.ballots = last.ballots.concat(later.slice(at));
  }

  const seated = (rec.seated || []).length ? [...rec.seated] : first.map(b => b.voter);
  // Only a betrayal on a ballot this screen is actually rendering. The engine
  // reads the public ballots alone when it builds them, so this is a belt on
  // top of a brace — and it is the kind of belt that has caught this repo
  // three times.
  const pairs = new Set(pub.map(b => b.voter + '|' + b.target));
  const betrayals = (isAudience && !endgame)
    ? (rec.betrayals || []).filter(b => pairs.has(b.voter + '|' + b.target))
    : [];

  return {
    ep: rec.ep,
    endgame,
    isAudience,
    watcher,
    // Was this player in the room? The table is public and everyone at it saw
    // the same slates, so this changes the strip and not the screen.
    atTable: watcher ? seated.indexOf(watcher) >= 0 : true,
    seated,
    // THE WHOLE SEATING PLAN, empty chairs included. Public on every layer:
    // the castle can see which chairs are empty and which door each of them
    // went out by, because it watched both happen.
    ring: (rec.ring || []).map(c => ({ ...c })),
    first,
    rounds,
    accusations: (rec.accusations || []).filter(a => a && a.accuser && a.target),
    // THE ARGUMENTS, as opposed to the list of names. Public on every layer
    // -- a clash is two people going at each other out loud at this table,
    // built from what was said here plus the season's own thread kinds and
    // outcomes (js/tr/roundtable.js `clashes`). No alignment, no certainty.
    clashes: (rec.clashes || []).filter(c => c && c.a && c.b && c.line),
    // THE SPEECHES, with their provenance. Public on every layer — a claim
    // made out loud at the table, its `sources` drawn from the speaker's own
    // suspicion (never a `public`-tier turret belief; see roundtable.js's
    // `speechesFrom`). `swayed`/`mindChanges` are the listeners it reached and
    // moved. Nothing here is a fact a player at the table could not have heard.
    // A SOURCELESS SPEECH IS NO LONGER DROPPED HERE. It used to be, and the
    // accusation then reached the screen as a name with nothing under it --
    // 27% of them. What it carries instead is `reasonKind`, which describes
    // the ABSENCE of a record rather than any record's contents, so the
    // observer gating is unchanged: `hearsay` names a player who accused out
    // loud at this table, and the other three say only that there is nothing
    // to cite.
    speeches: (rec.speeches || []).filter(s => s && s.speaker && s.target),
    chosen: rec.chosen || null,
    chosenAlignment: endgame ? null : (rec.chosenAlignment || null),
    truth: (isAudience && !endgame) ? (rec.truth || {}) : null,
    betrayals,
    speech: rec.speech || null,
    dagger: rec.dagger || null,
    pot: rec.pot || 0,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════
//
// `phase` is the room's temperature and the card's physics. `meta` is what the
// sidebar gates on — the beat's ROLE, derived here rather than pattern-matched
// out of the markup later, because a sidebar that greps its own HTML goes
// wrong the first time a title is edited and goes wrong in the direction of
// spoiling the ending.

function _buildBeats(v) {
  const V = _verbs();
  const beats = [];
  const key = 'rt|' + v.ep + '|' + (v.chosen || '');
  const push = (phase, html, hostSlot, meta) =>
    beats.push({ phase, html, hostSlot: hostSlot || null, meta: meta || null });

  // ── the room sits down ──────────────────────────────────────────────
  const seats = v.seated.map(n => _faceChip(n, 28)).join('');
  push('gather', _card(
    v.endgame ? 'What Is Left Of The Room' : 'The Room Sits Down',
    'The table', 'table',
    '<p>' + v.seated.length + ' of them, and one chalkboard each. '
    + (v.endgame
      ? 'This far in there is nothing to work with but each other, and no answer coming afterwards.'
      : 'Whatever anybody has worked out since breakfast has to be said here or not at all.')
    + '</p><div class="rt-faces">' + seats + '</div>'
    + _murmur(key + '|m0')), 'open', { kind: 'gather' });

  // ── AND THE HOST GOES AT SOMEBODY ─────────────────────────────────────
  //
  // Not on a finale table: by the endgame the host has stopped prompting and
  // the room argues into a silence, which is the whole texture of those
  // votes (spec §8) and a needling host would flatten it.
  if (!v.endgame) {
    const nd = _needle(v);
    const npr = nd.who ? _pr(nd.who) : null;
    const nline = _fill(_pick(nd.pool, key + '|needle|' + (nd.who || '-')),
      { Nm: _esc(nd.who || ''), them: npr ? npr.obj : '', they: npr ? npr.sub : '',
        their: npr ? npr.posAdj : '', n: String(nd.n == null ? '' : nd.n) });
    push('gather', _hostBand(nline)
      + (nd.who
        ? '<div class="rt-faces">' + _faceChip(nd.who, 30) + '</div>'
        : ''),
    null, { kind: 'needle', who: nd.who });
  }

  // ── the debate ──────────────────────────────────────────────────────
  //
  // SPEECH-DRIVEN when the debate produced speeches with provenance (see
  // roundtable.js `speechesFrom`): each claim cites a source its speaker
  // actually knows, the accused answers, and any listener the claim MOVED is
  // shown moving — a mind-change caused by an argument, never by the writer
  // needing a flip. When no speech carries a source (an early table where
  // nobody has a read yet), the room says so rather than inventing reasons.
  const byTarget = new Map();
  for (const a of v.accusations) {
    if (!byTarget.has(a.target)) byTarget.set(a.target, []);
    byTarget.get(a.target).push(a.accuser);
  }
  const named = new Set(byTarget.keys());
  const clusters = [...byTarget.entries()].map(([t, acc]) => ({ t, acc }))
    .sort((x, y) => y.acc.length - x.acc.length || String(x.t).localeCompare(String(y.t)))
    .slice(0, 5);

  // The speech (with provenance) backing each accused, if the debate produced
  // one. A target with a speech gets its source CITED and its mind-changes
  // shown; a target with only a bare accusation renders as before — the room
  // suspecting a name it cannot fully justify is a real thing the format does.
  const speechFor = new Map();
  for (const s of v.speeches) {
    if (!speechFor.has(s.target)) speechFor.set(s.target, []);
    speechFor.get(s.target).push(s);
  }

  if (!clusters.length) {
    push('debate', _card('Nobody Has A Name', 'The debate', 'hand',
      '<p>Nothing has happened yet that anybody can point at. They talk round the table '
      + 'for an hour and it produces exactly nothing — so now '
      + 'the room is about to write down names it has no reason for.</p>'
      + _murmur(key + '|m1')), 'debate', { kind: 'debate' });
  }
  // No two accused give the same defence in one table — the pool is small and
  // hash collisions otherwise put an identical first-person line under two
  // different faces on the same screen. Picked hash-first, advanced past any
  // line already spoken tonight.
  const usedDef = new Set();
  const pickDefence = seedKey => {
    let i = _hash(seedKey) % ACCUSED_DEFENCE.length;
    for (let n = 0; n < ACCUSED_DEFENCE.length; n++) {
      const line = ACCUSED_DEFENCE[(i + n) % ACCUSED_DEFENCE.length];
      if (!usedDef.has(line)) { usedDef.add(line); return line; }
    }
    return ACCUSED_DEFENCE[i];
  };
  clusters.forEach((c, ci) => {
    const speeches = speechFor.get(c.t) || [];
    // THE LEAD ACCUSER'S OWN SPEECH, not merely the first one filed against
    // this name. `lead` is who the card quotes, so citing somebody else's
    // reason under `lead`'s face would put a sentence in the wrong mouth --
    // which is the defect the ACCUSE_SAID note two hundred lines up records
    // being caught by a single read of the output.
    const leadName = c.acc[0];
    const mine = speeches.find(sp => sp.speaker === leadName) || speeches[0] || null;
    const src = mine && (mine.sources || []).length ? mine.sources[0] : null;
    const movers = [...new Set(speeches.flatMap(s => s.mindChanges || []))]
      .filter(n => n !== c.t);
    const lead = leadName;
    const pr = _pr(c.t);
    const apr = _pr(lead);
    const subs = { A: lead, a: lead, T: c.t, t: c.t, sub: pr.sub, Sub: pr.Sub,
      obj: pr.obj, pos: pr.pos, src: src ? _esc(src.text) : '',
      // THE ACCUSER'S pronouns, under their own keys. `sub`/`pos` above are
      // the ACCUSED's and always have been, so a sentence about the person
      // doing the accusing had no pronoun available and had to say the name
      // again -- three times in two sentences, in the rendered output.
      asub: apr.sub, Asub: apr.Sub, aobj: apr.obj, apos: apr.pos,
      f: mine && mine.hearsayFrom ? _esc(mine.hearsayFrom) : '' };
    let inner = '<div class="rt-accused">' + _av(c.t, 54)
      + '<span class="rt-accused-nm">' + _esc(c.t) + '</span>'
      + '<span class="rt-accused-ct">' + c.acc.length
      + (c.acc.length === 1 ? ' voice' : ' voices') + '<br>at this name</span></div>';
    inner += '<p>' + _fill(_pick(ACCUSE_LINES, key + '|acc|' + c.t), subs) + '</p>';
    inner += _said(lead, _fill(_pick(ACCUSE_SAID, key + '|say|' + c.t), subs));
    // THE SOURCE, CITED — only when the speaker actually holds one. And when
    // they do not, WHICH KIND OF NOTHING they are working from, rather than
    // the name-and-silence this printed before. `hearsay` needs a name it can
    // point at, so it falls back to the `feeling` pool without one.
    if (src) {
      inner += '<p>' + _fill(_pick(CLAIM_SOURCE, key + '|src|' + c.t), subs) + '</p>';
    } else {
      let rk = (mine && mine.reasonKind) || 'feeling';
      if (rk === 'hearsay' && !subs.f) rk = 'feeling';
      const pool = NO_SOURCE[rk] || NO_SOURCE.feeling;
      inner += '<p>' + _fill(_pick(pool, key + '|nosrc|' + rk + '|' + c.t), subs) + '</p>';
    }
    if (c.acc.length > 1) {
      inner += '<div class="rt-faces">'
        + c.acc.slice(0, 8).map(n => _faceChip(n, 26)).join('') + '</div>';
    }
    inner += '<p>' + _fill(_pick(ACCUSED_REPLY, key + '|rep|' + c.t), subs) + '</p>';
    // THE ACCUSED GETS THE FLOOR, in their own voice — every table on the real
    // show lets the named player answer before the slates. And they throw it
    // back ONLY at a name they actually put up tonight (`byTarget` proves it),
    // never one invented for the sentence.
    inner += _said(c.t, pickDefence(key + '|def|' + c.t));
    const deflectTo = [...byTarget.entries()].find(([tgt, accs]) => tgt !== c.t && accs.includes(c.t));
    if (deflectTo) {
      const dsubs = { ...subs, d: _esc(deflectTo[0]) };
      inner += '<p>' + _fill(_pick(ACCUSED_DEFLECT, key + '|dfl|' + c.t), dsubs) + '</p>';
      // AND THE REASON FOR IT, when the deflector holds one. `v.speeches` is
      // the whole table's, so this is the deflector's OWN record against the
      // name they just said — never the reason somebody else has for it.
      const back = v.speeches.find(sp => sp.speaker === c.t && sp.target === deflectTo[0]
        && (sp.sources || []).length);
      if (back) {
        inner += '<p>' + _fill(_pick(DEFLECT_SOURCE, key + '|dsrc|' + c.t),
          { ...dsubs, dsrc: _esc(back.sources[0].text) }) + '</p>';
      }
    }
    // THE AUDIENCE'S PRIVILEGE. `v.truth` is null on every other layer and at
    // every finale table, so this block simply does not exist for them.
    if (v.truth) {
      const real = v.truth[c.t];
      const traitorAccusers = c.acc.filter(n => v.truth[n] === 'traitor').length;
      const steered = real === 'faithful' && traitorAccusers * 2 > c.acc.length;
      const pool = real === 'traitor' ? IRONY_TRUE : (steered ? IRONY_STEER : IRONY_FALSE);
      inner += '<div class="rt-irony"><b>What the room cannot see</b><span>'
        + _pick(pool, key + '|iro|' + c.t) + '</span></div>';
    }
    if (ci === clusters.length - 1 && !movers.length) inner += _murmur(key + '|m2|' + c.t);
    push('debate', _card(null, 'The debate', 'hand', inner),
      ci === 0 ? 'debate' : null,
      { kind: 'debate', target: c.t, accusers: [...c.acc] });

    // ── THE MIND CHANGE — a separate beat, only when the claim MOVED ──
    // somebody. A vote turns because an argument moved it, never because the
    // writer needed a flip. It is what makes a late table (reads accumulated)
    // longer and sharper than an early one.
    if (movers.length) {
      const mv = movers[0];
      const mpr = _pr(mv);
      const msubs = { who: _esc(mv), t: c.t, sub: mpr.sub, Sub: mpr.Sub,
        obj: mpr.obj, pos: mpr.pos };
      let mi = '<p>' + _fill(_pick(MINDCHANGE_TEXT, key + '|mc|' + c.t + '|' + mv), msubs) + '</p>';
      if (movers.length > 1) {
        mi += '<div class="rt-faces">'
          + movers.slice(0, 8).map(n => _faceChip(n, 26)).join('') + '</div>'
          + '<p>' + _fill(_pick(MINDCHANGE_MORE, key + '|mcm|' + c.t), msubs) + '</p>';
      }
      if (ci === clusters.length - 1) mi += _murmur(key + '|m2|' + c.t);
      push('debate', _card('A Name Travels', 'The debate', 'hand', mi),
        null, { kind: 'debate', target: c.t, accusers: [...movers] });
    }
  });

  // ── the slates ──────────────────────────────────────────────────────
  // ── AND THE ARGUMENTS THE ROOM ACTUALLY HAD ─────────────────────────
  //
  // The debate above is a list of names with defences under them. A clash is
  // two of those people going at each other, and it is drawn LAST in the
  // debate — after every accusation has been made and before the chalk comes
  // out, which is where the format puts it: the hour turns nasty at the end.
  //
  // Each card names both people and its own kind, because the KIND is the
  // information: a counter-accusation is a different animal from a promise
  // being quoted back, and the card that does not say which is a card the
  // viewer has to guess at.
  const CLASH_KIND = {
    counter: 'Straight back at them',
    // THREE HEADINGS FOR THE THREE AGE BANDS. A single "this started days
    // ago" was printed over rows that had started that morning; the band is
    // measured in js/tr/roundtable.js and the heading follows it.
    'grievance-fresh': 'They had this argument yesterday',
    'old-grievance': 'An old argument reaches the table',
    'grievance-old': 'This argument has run all week',
    'broken-word': 'A promise, quoted back',
    'ganged-up': 'Too many accusers to be a coincidence',
    defended: 'Somebody speaks up for them',
  };
  for (const c of (v.clashes || [])) {
    push('debate', '<div class="rt-clash">'
      + '<div class="rt-clash-k">' + _ic('candles', 11)
      + _esc(CLASH_KIND[c.kind] || 'It gets sharp') + '</div>'
      + '<div class="rt-clash-pair">' + _faceChip(c.a, 26)
      + '<span class="rt-clash-v"></span>' + _faceChip(c.b, 26) + '</div>'
      + '<p class="rt-clash-t">' + _esc(c.line) + '</p>'
      // WHAT IT IS ABOUT, quoted off the thread's opening beat. Without this
      // the card says an argument happened and never says what argument.
      + (c.since ? '<p class="rt-clash-since">&ldquo;' + _esc(c.since)
        + '&rdquo;</p>' : '') + '</div>',
    null, { kind: 'clash', pair: [c.a, c.b] });
  }

  push('slates', _card('Write A Name', 'The slates', 'chalk',
    '<p>' + _pick(WRITE_TEXT, key + '|wr') + '</p>'
    + '<div class="rt-chips">' + _chip(v.seated.length + ' slates', null)
    + _chip('one name each', null)
    + _chip('read aloud, by hand', 'cold') + '</div>'
    + _murmur(key + '|m3')), 'write', { kind: 'slates' });

  // ── the ballots, read one at a time ─────────────────────────────────
  //
  // This is the screen. Everything else in the engine is somebody's belief;
  // these are the only facts the castle is handed all week, so they are spent
  // one beat at a time with the count moving under them.
  const betrayalBy = new Map();
  for (const b of v.betrayals) betrayalBy.set(b.voter + '|' + b.target, b);
  const emitRead = (ballots, phase, roundIx) => {
    const run = {};
    let leadersBefore = [];
    // What has actually been held up so far, for the reciprocal check.
    const seenPair = new Map();
    let surprised = false;
    // Advances on every routine join so two in a row cannot match — see the
    // note at the draw itself.
    let joinIx = 0;
    ballots.forEach((b, i) => {
      const w = (v.dagger && v.dagger.holder === b.voter) ? (v.dagger.votes || 1) : 1;
      const had = b.target ? (run[b.target] || 0) : 0;
      if (b.target) run[b.target] = had + w;
      const leadersNow = _leaders(run);
      const pr = b.target ? _pr(b.target) : _pr(b.voter);
      const subs = { A: b.voter, a: b.voter, T: b.target || '', t: b.target || '',
        sub: pr.sub, Sub: pr.Sub, obj: pr.obj, pos: pr.pos };
      const bet = betrayalBy.get(b.voter + '|' + b.target);
      // ROUTINE BEATS GO QUIET. A note on every slate makes seventeen of them
      // read identically and buries the four that matter; a note on about half
      // lets the count carry the rest, which it already does. Hashed, not
      // rolled, because the screen redraws on every reveal -- and FINALISED,
      // because `_hash(...|i) % 2` over consecutive `i` is not a coin, it is
      // an alternation that never breaks. See `_mix` for the measurement.
      const routine = _mix(_hash(key + '|q' + roundIx + '|' + i)) % 2 === 0;
      let note = '', tone = '';
      if (bet) { note = bet.line; tone = 'turn'; }
      // The reciprocal only counts once BOTH slates are on the table. Reading
      // it off the whole ballot list fired it on slate one and told the room
      // about a slate it had not seen yet -- the sidebar's spoiling bug,
      // wearing a card.
      else if (b.target && seenPair.get(b.target) === b.voter) {
        note = _fill(_pick(READ_BACK, key + '|bk|' + b.voter), subs);
      } else if (i === 0) {
        note = _pick(READ_FIRST, key + '|f' + roundIx);
      } else if (b.target && leadersNow.length === 1 && leadersNow[0] === b.target
        && leadersBefore.indexOf(b.target) < 0) {
        note = _fill(_pick(READ_LEAD, key + '|ld|' + b.target), subs);
      } else if (had > 0 && routine) {
        // ROTATED, NOT HASHED. `_pick` keyed on the voter cannot see what the
        // slate above it drew, and this branch fires on every routine join --
        // a seventeen-slate night gave three people "Same name again. Nobody
        // in the room misses it" and three more "takes a second look down the
        // table". The READ_NEW branch below already carries a once-a-round
        // guard with a comment about a stuck record; this is the same defect
        // one branch up. Advancing an offset per draw keeps it deterministic
        // and makes two consecutive joins impossible to match.
        note = _fill(READ_JOIN[(_hash(key + '|jn|' + b.voter) + joinIx++)
          % READ_JOIN.length], subs);
      } else if (b.target && !named.has(b.target) && !surprised && roundIx === 0) {
        // ONCE a round. On a night the debate never converged, half the slates
        // are names nobody said, and four variants of the same observation in
        // a row reads as a stuck record rather than a quiet room.
        note = _pick(READ_NEW, key + '|nw|' + b.voter);
        surprised = true;
      }
      seenPair.set(b.voter, b.target);
      leadersBefore = leadersNow;
      const strip = _runStrip(run, leadersNow, b.target);
      const html = _slate(b, (i + 1) + ' / ' + ballots.length, strip)
        + (note ? '<div class="rt-note"' + (tone ? ' data-tone="' + tone + '"' : '')
          + '>' + note + '</div>' : '');
      push(phase, html, (i === 0 && roundIx === 0) ? 'read' : null,
        { kind: 'read', round: roundIx, ballot: b, tally: { ...run } });
    });
  };

  emitRead(v.first, 'read', 0);

  // ── the count ───────────────────────────────────────────────────────
  const firstTally = _tally(v.first, v.dagger);
  const firstLeaders = _leaders(firstTally);
  let inner = '<p>' + _pick(COUNT_TEXT, key + '|ct') + '</p>' + _tallyBoard(firstTally, firstLeaders);
  if (v.dagger) {
    inner += '<div class="rt-chips">'
      + _chip('one slate counted ' + (v.dagger.votes || 1) + ' times', 'bad')
      + _chip('the room watched it drawn', 'cold') + '</div>';
  }
  // `data-round` is not decoration either: it is how tests/tr-vp.test.js reads
  // back THIS count and no other. A revote's ballots must never be added into
  // the first one, and a guard that greps the whole page for numbers cannot
  // tell one board from the next.
  push('read', '<div class="rt-count" data-round="0">'
    + _card(v.rounds.length ? 'A Level Count' : 'The Count', 'The count', 'tally', inner)
    + '</div>', 'count', { kind: 'count', round: 0, tally: firstTally });

  // ── the revote, which is its own state and never a second helping ───
  //
  // `banishment-revote` is the same decision still being taken. Its ballots
  // are counted apart from the first set, and the room it is put to is a
  // smaller one: the tied are the question and do not answer it.
  v.rounds.forEach((r, ri) => {
    // A REVOTE WITH NOBODY LEFT TO CAST ONE IS A REAL NIGHT, not a defect.
    // When every living player draws exactly one name the whole room is tied,
    // and the format's rule -- the tied do not vote -- leaves no electorate at
    // all. The engine falls through to a seeded draw, and the screen has to
    // say so rather than print an empty board and a count of nothing.
    const stranded = !r.ballots.length;
    push('revote', _card(stranded ? 'Level, And Nobody Left To Break It' : 'Level — And Again',
      'The tie', 'scales',
      '<p>' + (stranded
        ? 'Everybody at this table drew a name, so everybody at this table is in '
          + 'question — and the people in question do not write. There is nobody '
          + 'left to ask. It comes down to the draw.'
        : _pick(TIE_TEXT, key + '|tie' + ri)) + '</p>'
      + '<div class="rt-faces">' + r.tied.map(n => _faceChip(n, 30)).join('') + '</div>'
      + '<div class="rt-chips">' + _chip('only these names are in question', 'bad')
      + (stranded
        ? _chip('and no one else is left to write', 'cold')
        : _chip('and none of them writes', 'cold')
          + _chip(r.ballots.length + ' slates this time', null)) + '</div>'),
      ri === 0 ? 'tie' : null, { kind: 'revote-open', round: ri + 1, tied: r.tied });
    if (stranded) return;
    emitRead(r.ballots, 'revote', ri + 1);
    const t = _tally(r.ballots, v.dagger);
    push('revote', '<div class="rt-count" data-round="' + (ri + 1) + '">'
      + _card('The Second Count', 'The count', 'tally',
        '<p>' + _pick(COUNT_TEXT, key + '|ct2' + ri) + '</p>' + _tallyBoard(t, _leaders(t)))
      + '</div>', null, { kind: 'count', round: ri + 1, tally: t });
  });

  // ── the verdict ─────────────────────────────────────────────────────
  if (v.chosen) {
    const pr = _pr(v.chosen);
    let vh = '<div class="rt-verdict">'
      + '<div class="rt-verdict-face">' + _av(v.chosen, 92) + '</div>'
      + '<div class="rt-verdict-nm">' + _esc(v.chosen) + '</div>'
      + '<div class="rt-verdict-word">' + _esc(_cap(V.banish)) + '</div>'
      + '<div class="rt-chair">' + _chair() + '</div></div>'
      + '<p>' + _pick(VERDICT_TEXT, key + '|vd') + '</p>';
    if (v.speech) {
      const burn = v.speech.burns && v.speech.target;
      const tp = burn ? _pr(v.speech.target) : pr;
      const line = burn
        ? _fill(_pick(BURN_SAID, key + '|bs'), { t: _esc(v.speech.target), obj: tp.obj })
        : _pick(QUIET_SAID, key + '|qs');
      vh += _said(v.chosen, line)
        + '<p>' + _pick(burn ? SPEECH_BURN : SPEECH_QUIET, key + '|sp') + '</p>';
    }
    push('verdict', _card(null, 'The chair', 'chair', vh, _icon),
      'verdict', { kind: 'verdict', who: v.chosen });
  }

  // ── and the only certainty, or the deliberate absence of one ────────
  //
  // SPEC §8: THERE ARE NO REVEALS IN THE ENDGAME. The survivors carry on with
  // exactly the beliefs they walked in with, and that absence is what makes
  // the last votes feel unlike every earlier one. `v.chosenAlignment` is
  // already null on a finale table — `_view` drops it and the record never
  // carried it — and this branch refuses a second time, so that a mutation to
  // either lock is caught rather than covered for.
  if (!v.endgame && v.chosenAlignment) {
    const isTraitor = v.chosenAlignment === 'traitor';
    // THE BANISHED TURNS THEIR OWN CARD. The one certain thing the format hands
    // the room is said out loud, in the leaving player's own voice, before the
    // seal confirms it — the "circle of truth" the reveal used to skip straight
    // past. First person, and it may assert only the alignment already revealed.
    push('verdict',
      _said(v.chosen, _pick(isTraitor ? ANNOUNCE_TRAITOR : ANNOUNCE_FAITHFUL, key + '|an'))
      + '<div class="rt-reveal" data-reveal="alignment"><div class="rt-reveal-inner">'
      + '<div class="rt-reveal-face" data-side="' + _esc(v.chosenAlignment) + '">'
      + _icon('seal', 40, isTraitor ? '#c9283c' : 'rgba(222,214,196,.75)')
      + '<div class="rt-reveal-word">' + (isTraitor ? 'Traitor' : 'Faithful') + '</div>'
      + '<div class="rt-reveal-sub">' + _esc(v.chosen) + '</div></div>'
      + '<div class="rt-reveal-back">' + _ic('slate', 46, 'rgba(222,214,196,.5)') + '</div>'
      + '</div></div>'
      + '<div class="rt-note">' + _pick(isTraitor ? REVEAL_TRAITOR : REVEAL_FAITHFUL,
        key + '|rv') + '</div>',
      'reveal', { kind: 'reveal', alignment: v.chosenAlignment });

    // ── THE ROOM REACTS — the beat the table used to skip ────────────────
    //
    // A reveal with no reaction is a fact with nobody to land on. The room's
    // mood is public; the surviving pact's private read is the audience's alone
    // (`v.truth` is null on every player layer), same channel as the debate's
    // "what the room cannot see".
    const pushers = (v.first || []).filter(b => b.target === v.chosen).map(b => b.voter);
    const survTraitors = v.truth
      ? Object.keys(v.truth).filter(n => v.truth[n] === 'traitor'
          && n !== v.chosen && v.seated.includes(n))
      : [];
    let rh = '<p>' + _pick(isTraitor ? REACT_TRAITOR_PUBLIC : REACT_FAITHFUL_PUBLIC,
      key + '|rxp') + '</p>';
    if (pushers.length) {
      rh += '<div class="rt-faces">'
        + pushers.slice(0, 8).map(n => _faceChip(n, 26)).join('') + '</div>';
    }
    if (survTraitors.length) {
      const who = survTraitors[0];
      const wpr = _pr(who);
      rh += '<div class="rt-irony"><b>What the room cannot see</b><span>'
        + _fill(_pick(isTraitor ? REACT_TRAITOR_HIDDEN : REACT_FAITHFUL_HIDDEN, key + '|rxh'),
          { who: _esc(who), pos: wpr.pos, sub: wpr.sub, obj: wpr.obj }) + '</span></div>';
    }
    push('verdict', _card(null, 'The room', 'table', rh),
      null, { kind: 'reaction' });
  } else {
    push('verdict', '<div class="rt-silence">'
      + _icon('eye', 42, 'rgba(222,214,196,.42)')
      + '<div class="rt-silence-h">Nothing Is Turned Over</div>'
      + '<p>' + _pick(SILENCE_TEXT, key + '|si') + '</p></div>',
      'silence', { kind: 'silence' });
  }

  // ── AND THE HOST SENDS THEM UP ────────────────────────────────────────
  //
  // The format's closing move, and the screen ended without it: the host
  // turns from the room he has just made vote and addresses the people who
  // are about to do the other thing, while everybody else listens. Nothing
  // secret is said -- the castle knows Traitors exist and knows what they do
  // after a table -- so it is the same beat on every observer layer.
  //
  // Not on a finale table, where there is no night after the vote.
  if (!v.endgame) {
    push('verdict', _hostBand(_fill(_pick(HOST_SENDOFF, key + '|sendoff'),
      { kill: _esc(_verbs().murder) })), null, { kind: 'sendoff' });
  }
  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE RING — the whole room, in perspective, and it never leaves the screen
// ══════════════════════════════════════════════════════════════════════
//
// THIS IS THE SCREEN. A Round Table is a circle of people arguing about which
// of them is lying, and the tension of it is that you can see all of them at
// once while one of them talks. So the room is drawn as a room: an ellipse
// seen from slightly above, every chair a face, the far side of the table
// smaller and cooler than the near side, and the whole thing sticky under the
// nav so the beats scroll underneath it rather than beside it.
//
// It carries the entire state of the vote, spatially:
//
//   * who has spoken and who is being spoken about, during the debate;
//   * whose slate has been turned over and who is still holding one;
//   * WHO EACH READ BALLOT NAMED, as a line across the wood from the voter's
//     place to the named one — an argument crossing the ring, which is
//     something no column of numbers can show;
//   * the count against each person, as chalk ticks at their own place, so
//     the tally is a shape in the room rather than a list beside it;
//   * AND THE EMPTY CHAIRS. Everybody who has left keeps their seat, and the
//     two doors out of this castle do not look alike. The ring visibly thins
//     as the season runs and the survivors sit there looking at the gaps.
//
// THE SEATS NEVER MOVE. They are laid out from `gs.tr.castOrder`, which is
// fixed at the start of the season, so a viewer can follow one person from
// episode one to the last table. Seating the room from the LIVING would
// re-deal every chair the moment somebody died, which is the same picture
// carrying none of the information.

// The design box. Everything below is in these coordinates and the CSS scales
// the whole thing by the column width, so the geometry is written once.
//
// THE SEATS ARE SPACED BY ARC LENGTH, NOT BY ANGLE, and that is the whole of
// why this ellipse works. Even angle looks right and is not: on an ellipse
// 436 wide and 172 tall, a degree of angle is worth 436 units of table at the
// far centre and 172 at the sides, so evenly-angled chairs bunch exactly where
// the curve is steepest. At twenty chairs that put the side seats 51px apart
// with a 48px portrait on each of them, and at twenty-four they overlapped
// outright. Walking the perimeter instead and dropping a chair every
// `perimeter / n` units costs one lookup table and fixes it without touching
// the ellipse: 51.2px -> 87.0px at twenty, 41.8px -> 72.7px at twenty-four.
const _RING = { w: 1020, h: 452, cx: 510, cy: 222, rx: 436, ry: 172 };
// Where a person's slate lies on the table in front of them — the chords run
// place to place, not face to face, because the argument happens on the wood.
const _PLACE = { rx: 322, ry: 106 };
// How far toward the middle a chord bows. Straight lines all through the
// centre turn nineteen ballots into a hairball with one bright knot in it;
// bowing them part of the way keeps the bundle readable and still says which
// side of the table a name came from.
const _CHORD_PULL = 0.5;

// ── walking the perimeter ─────────────────────────────────────────────
//
// A cumulative arc-length table over the seat ellipse, sampled once and kept.
// No elliptic integral is needed for this: at 1024 samples the answer agrees
// with a 20,000-sample table to within 0.1px at every cast size the show
// produces, which is two orders of magnitude below the thing being fixed.
const _ARC_N = 1024;
let _arc = null;
function _arcTable() {
  if (_arc) return _arc;
  const t = [0];
  const step = (Math.PI * 2) / _ARC_N;
  let acc = 0;
  for (let k = 1; k <= _ARC_N; k++) {
    const a0 = (k - 1) * step, a1 = k * step;
    const d0 = Math.hypot(_RING.rx * Math.cos(a0), _RING.ry * Math.sin(a0));
    const d1 = Math.hypot(_RING.rx * Math.cos(a1), _RING.ry * Math.sin(a1));
    acc += ((d0 + d1) / 2) * step;   // trapezoid over ds = |r'(a)| da
    t.push(acc);
  }
  _arc = t;
  return t;
}

/**
 * The angle of chair `i` of `n`, `i/n` of the way ROUND THE PERIMETER.
 *
 * Seat 0 still sits at the far centre and the order still runs clockwise, so
 * chairs keep their identity and their order across every reveal and every
 * episode — the seating plan is `gs.tr.castOrder` and nothing here re-deals it.
 */
function _seatAngle(i, n) {
  const tbl = _arcTable();
  const P = tbl[_ARC_N];
  const s = ((i % n) / n) * P;
  let lo = 0, hi = _ARC_N;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (tbl[mid] < s) lo = mid + 1; else hi = mid; }
  const k = Math.max(1, lo);
  const span = tbl[k] - tbl[k - 1];
  const f = span ? (s - tbl[k - 1]) / span : 0;
  return ((k - 1) + f) * ((Math.PI * 2) / _ARC_N);
}

/**
 * One chair, in perspective.
 *
 * `a` runs from 0 at the FAR centre of the table clockwise to the near side,
 * so `t` — how near this chair is to the camera — falls straight out of it and
 * drives the scale, the stacking order and the aerial-perspective dimming.
 */
function _seatAt(i, n) {
  const a = _seatAngle(i, n);
  const t = (1 - Math.cos(a)) / 2;           // 0 far, 1 near
  return {
    x: _RING.cx + Math.sin(a) * _RING.rx,
    y: _RING.cy - Math.cos(a) * _RING.ry,
    px: _RING.cx + Math.sin(a) * _PLACE.rx,
    py: _RING.cy - Math.cos(a) * _PLACE.ry,
    t,
    scale: 0.6 + 0.5 * t,
    z: 10 + Math.round(t * 200),
  };
}

/** The wood, the baize, and the light sitting on it. */
function _felt() {
  return '<svg class="rt-felt" viewBox="0 0 ' + _RING.w + ' ' + _RING.h + '"'
    + ' preserveAspectRatio="none" aria-hidden="true">'
    + '<defs>'
    + '<radialGradient id="rtFeltG" cx="50%" cy="30%" r="66%">'
    + '<stop offset="0%" stop-color="#2b6042"/><stop offset="54%" stop-color="#173a26"/>'
    + '<stop offset="100%" stop-color="#0a1a11"/></radialGradient>'
    + '<linearGradient id="rtRim" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#6b4f2a"/><stop offset="48%" stop-color="#33240f"/>'
    + '<stop offset="100%" stop-color="#4d3719"/></linearGradient>'
    + '<radialGradient id="rtSpot" cx="50%" cy="26%" r="52%">'
    + '<stop offset="0%" stop-color="#fff3d2" stop-opacity=".26"/>'
    + '<stop offset="100%" stop-color="#fff3d2" stop-opacity="0"/></radialGradient>'
    + '</defs>'
    // the shadow the table casts on the floor
    + '<ellipse cx="' + _RING.cx + '" cy="' + (_RING.cy + 22) + '" rx="' + (_PLACE.rx + 66)
    + '" ry="' + (_PLACE.ry + 26) + '" fill="#030705" opacity=".8"/>'
    // the rim and the baize
    + '<ellipse cx="' + _RING.cx + '" cy="' + _RING.cy + '" rx="' + (_PLACE.rx + 66)
    + '" ry="' + (_PLACE.ry + 26) + '" fill="url(#rtRim)"/>'
    + '<ellipse cx="' + _RING.cx + '" cy="' + _RING.cy + '" rx="' + (_PLACE.rx + 50)
    + '" ry="' + (_PLACE.ry + 16) + '" fill="url(#rtFeltG)"/>'
    + '<ellipse cx="' + _RING.cx + '" cy="' + _RING.cy + '" rx="' + (_PLACE.rx + 50)
    + '" ry="' + (_PLACE.ry + 16) + '" fill="none" stroke="rgba(255,243,210,.14)" stroke-width="1.4"/>'
    + '<ellipse cx="' + _RING.cx + '" cy="' + (_RING.cy - 6) + '" rx="' + (_PLACE.rx - 96)
    + '" ry="' + (_PLACE.ry - 34) + '" fill="none" stroke="rgba(255,243,210,.08)" stroke-width="1.2"/>'
    // the candle ring's light landing on it
    + '<ellipse cx="' + _RING.cx + '" cy="' + (_RING.cy - 14) + '" rx="' + (_PLACE.rx + 30)
    + '" ry="' + (_PLACE.ry + 6) + '" fill="url(#rtSpot)" style="mix-blend-mode:screen"/>'
    + '</svg>';
}

/**
 * The whole ring at one moment of the reveal.
 *
 * Everything it draws is gated on what has already been shown. A chord for a
 * ballot nobody has read yet, or a tick against a name that has not been said
 * aloud, is the sidebar's spoiling bug wearing a nicer coat.
 */
function _ring(v, opts) {
  const o = opts || {};
  const ballots = o.ballots || [];
  const tally = o.tally || {};
  const chairs = (v.ring && v.ring.length) ? v.ring : v.seated.map(name => ({ name, door: null }));
  const n = Math.max(1, chairs.length);
  const at = {};
  chairs.forEach((c, i) => { at[c.name] = _seatAt(i, n); });
  // THE LEAD HIGHLIGHT IS A LEADER TALLY TOO. Ringing the front-runner's seat
  // red while the slates are still being read telegraphs the banishment exactly
  // as the sticky's leader chip did, so it is gated the same way: no lead until
  // the count for this round (or the verdict) has been reached.
  const leaders = o.showLead ? _leaders(tally) : [];
  const last = ballots.length ? ballots[ballots.length - 1] : null;
  const V = _verbs();

  // ── the arguments, crossing the wood ──
  let chords = '<svg class="rt-chords" viewBox="0 0 ' + _RING.w + ' ' + _RING.h + '"'
    + ' preserveAspectRatio="none" aria-hidden="true">';
  ballots.forEach((b, i) => {
    const from = at[b.voter], to = b.target ? at[b.target] : null;
    if (!from || !to) return;
    const mx = _RING.cx + ((from.px + to.px) / 2 - _RING.cx) * (1 - _CHORD_PULL);
    const my = _RING.cy + ((from.py + to.py) / 2 - _RING.cy) * (1 - _CHORD_PULL);
    const fresh = i === ballots.length - 1;
    // OLDER ARGUMENTS FADE. Seventeen lines at one opacity is a red hairball
    // with the newest one lost inside it, and the newest one is the beat the
    // reader is actually on. The last few stay legible and everything behind
    // them settles into the wood.
    const age = ballots.length - 1 - i;
    const op = fresh ? 1 : Math.max(0.16, 0.5 - age * 0.055);
    chords += '<path class="rt-chord" d="M' + from.px.toFixed(1) + ' ' + from.py.toFixed(1)
      + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + to.px.toFixed(1) + ' ' + to.py.toFixed(1)
      + '" style="opacity:' + op.toFixed(2) + '"'
      + (fresh ? ' data-fresh="1"' : '') + '/>';
    if (fresh) {
      chords += '<circle class="rt-chord-head" cx="' + to.px.toFixed(1)
        + '" cy="' + to.py.toFixed(1) + '" r="4"/>';
    }
  });
  chords += '</svg>';

  // ── the chairs ──
  let seats = '';
  for (const c of chairs) {
    const p = at[c.name];
    const gone = !!c.door || (o.chosenGone && c.name === v.chosen);
    const door = c.door || (o.chosenGone && c.name === v.chosen ? 'banishment' : null);
    let state = 'waiting';
    if (gone) state = c.door ? 'gone' : 'chosen';
    else if (last && c.name === last.voter) state = 'reading';
    else if (o.spoke && o.spoke.indexOf(c.name) >= 0) state = 'speaking';
    else if (o.accused && o.accused.indexOf(c.name) >= 0) state = 'accused';
    else if (ballots.some(b => b.voter === c.name)) state = 'done';

    const votes = tally[c.name] || 0;
    let pips = '';
    for (let k = 0; k < Math.min(votes, 12); k++) pips += '<span class="rt-pip"></span>';

    seats += '<span class="rt-seat" data-seat="' + state + '"'
      + (door ? ' data-door="' + door + '"' : '')
      + (leaders.indexOf(c.name) >= 0 && !gone ? ' data-lead="1"' : '')
      + (p.t < 0.34 ? ' data-far="1"' : '')
      + ' style="left:' + (p.x / _RING.w * 100).toFixed(2) + '%;top:'
      + (p.y / _RING.h * 100).toFixed(2) + '%;--s:' + p.scale.toFixed(3)
      + ';z-index:' + p.z + '" title="' + _esc(c.name) + '">'
      + _av(c.name, 48)
      + (gone
        ? '<span class="rt-mark">' + (door === 'murder'
          ? _icon('seal', 26, '#8e1526')
          : '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">'
            + '<path d="M4 5 26 25M26 5 4 25" stroke="rgba(238,242,236,.8)" stroke-width="3"'
            + ' stroke-linecap="round" filter="url(#rtScratch)"/></svg>')
        + '</span>'
        : '')
      + '<span class="rt-seat-nm">' + _esc(c.name) + '</span>'
      + (gone
        ? '<span class="rt-gonelbl">' + _esc(door === 'murder' ? V.murder : V.banish) + '</span>'
        : '<span class="rt-pips">' + pips + '</span>')
      + '</span>';
  }

  const cap = ballots.length
    ? '<b>' + ballots.length + ' / ' + (o.roundTotal || ballots.length) + '</b><span>read aloud</span>'
    : '<b>' + v.seated.length + '</b><span>still seated</span>';

  return '<div class="rt-ring"><div class="rt-ring-in">' + _felt() + chords
    + '<div class="rt-ring-cap">' + cap + '</div>' + seats + '</div></div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE STAGE — replaced by innerHTML on every reveal, gated by idx
// ══════════════════════════════════════════════════════════════════════
//
// Its data lives on `window.__trRoundTable` because a <script> tag inside
// innerHTML does not execute, so the build function is the only thing that can
// put it there. `stepMeta` is what it reads: the ROLE of every beat, in order,
// so it can ask what has been shown without re-deriving the stream or grepping
// its own markup — which goes wrong the first time a title is edited, and goes
// wrong in the direction of spoiling the ending.

function _stage(state, idx) {
  const v = state.v;
  const meta = state.stepMeta.slice(0, Math.max(0, idx + 1));
  const V = _verbs();
  const h = _host();
  const reads = meta.filter(m => m && m.kind === 'read');
  const counts = meta.filter(m => m && m.kind === 'count');
  const debates = meta.filter(m => m && m.kind === 'debate');
  const verdictShown = meta.some(m => m && m.kind === 'verdict');
  const revealShown = meta.some(m => m && (m.kind === 'reveal' || m.kind === 'silence'));
  // The round the room has actually reached. The chords and the count both
  // come from it, so the ring never shows a first-count tally over a revote.
  const roundIx = reads.length ? reads[reads.length - 1].round
    : (counts.length ? counts[counts.length - 1].round : 0);
  const inRound = reads.filter(m => m.round === roundIx).map(m => m.ballot);
  const live = counts.filter(m => m.round === roundIx).pop();
  const tally = live ? live.tally : (inRound.length ? _tally(inRound, v.dagger) : {});
  const roundTotal = roundIx === 0
    ? v.first.length
    : ((v.rounds[roundIx - 1] || {}).ballots || []).length;

  // WHETHER THE COUNT IS ALLOWED TO NAME A LEADER YET. The running plurality
  // is a spoiler: a single dominant name held in the sticky for fifteen beats
  // tells the reader who gets banished long before the verdict. So the leader
  // tally is gated to the beat it belongs to — the COUNT for this round, or the
  // verdict/reveal after it — and stays hidden while the slates are still being
  // read. Per-round, so a revote re-hides it until its own count is shown.
  const countShownThisRound = counts.some(m => m.round === roundIx);
  const tallyRevealed = verdictShown || revealShown || countShownThisRound;

  const label = revealShown ? 'The table is closed'
    : verdictShown ? 'The chair is empty'
      : reads.length ? (roundIx ? 'Reading again' : 'Reading the slates')
        : debates.length ? 'In session' : 'Convening';
  const say = revealShown
    ? (v.endgame ? 'Nothing was turned over, and nothing will be.'
      : 'Everybody knows one true thing now, and only one.')
    : verdictShown ? 'One chair back, and nobody looking up.'
      : reads.length
        ? 'Every slate held up is a fact. There will not be another one all week.'
        : debates.length ? 'Nothing said here is evidence. It is all any of them have.'
          : 'The doors are shut and the candles are lit.';

  let out = '<div class="rt-stage-bar">'
    + '<span class="rt-stage-bit">' + _ic('candles', 12, 'rgba(222,214,196,.55)')
    + '<span class="rt-stage-k">Evening</span>'
    + '<span class="rt-stage-v">' + (v.ep || 1) + '</span></span>'
    + '<span class="rt-stage-bit"><span class="rt-stage-k">' + _esc(label) + '</span></span>'
    + '<span class="rt-stage-bit">' + _ic('slate', 12, 'rgba(222,214,196,.55)')
    + '<span class="rt-stage-k">Slates</span>'
    + '<span class="rt-stage-v">' + inRound.length + ' / ' + roundTotal + '</span></span>';
  const top = _leaders(tally);
  // THE BANISHED, NAMED AT THE VERDICT AND NOT ONE BEAT BEFORE. Once the chair
  // is empty the sticky says who is in it — the user found the board would
  // telegraph this early and then never state it plainly at the end.
  if (verdictShown && v.chosen) {
    out += '<span class="rt-stage-bit">' + _icon('chair', 12, 'rgba(201,40,60,.85)')
      + '<span class="rt-stage-k">' + _esc(_cap(V.banish)) + '</span>'
      + '<span class="rt-stage-v" data-hot="1">' + _esc(v.chosen) + '</span></span>';
  } else if (tallyRevealed && top.length && inRound.length) {
    // A FOUR-WAY TIE IS A SENTENCE, NOT A LIST. Joining every leader with an
    // ampersand produced "Cameron & Brody & Brightly & B" across a strip meant
    // to be read at a glance, which is what a finale table looks like every
    // time. Past two names the interesting fact is that nobody is ahead.
    out += '<span class="rt-stage-bit">' + _ic('tally', 12, 'rgba(201,40,60,.7)')
      + '<span class="rt-stage-k">' + (top.length > 2 ? 'All level on' : 'Most named')
      + '</span>'
      + '<span class="rt-stage-v" data-hot="1">'
      + (top.length > 2
        ? tally[top[0]] + ', ' + top.length + ' ways'
        : top.map(_esc).join(' &amp; ') + ' &middot; ' + tally[top[0]])
      + '</span></span>';
  }
  out += '<span class="rt-stage-bit">' + _icon('coffer', 12, 'rgba(255,243,210,.6)')
    + '<span class="rt-pot">&pound;' + Number(v.pot || 0).toLocaleString('en-GB')
    + '</span></span>';
  if (v.dagger && inRound.some(b => b.voter === v.dagger.holder)) {
    out += '<span class="rt-stage-bit">' + _icon('dagger', 12, 'rgba(201,40,60,.8)')
      + '<span class="rt-stage-k">One slate counts ' + (v.dagger.votes || 1) + '</span></span>';
  }
  out += '<span class="rt-stage-say">' + _esc(say) + '</span>'
    + _boardToggleBtn() + '</div>';

  // Who is on their feet, and who they are on their feet about. Read off the
  // debate beats that have actually been shown, so the ring does not light up
  // an accusation the reader has not reached.
  const spoke = [], accused = [];
  for (const d of debates) {
    if (d.target) accused.push(d.target);
    for (const a of d.accusers || []) if (spoke.indexOf(a) < 0) spoke.push(a);
  }

  out += _ring(v, { ballots: inRound, tally, roundTotal,
    chosenGone: verdictShown, showLead: tallyRevealed,
    spoke: reads.length ? [] : spoke,
    accused: reads.length ? [] : accused });
  return out;
}

// Exposed only so the reveal-gating guard can drive the sticky at any idx
// without a browser: it returns exactly what the board renders, so a test can
// prove the leader tally is absent before the count beat and present at it.
// See tests/tr-roundtable.test.js.
export function __rtStageHTML(state, idx) { return _stage(state, idx); }

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════
//
// `_reapplyVisibility` loops 0 -> idx on every click, which is what patches a
// stale DOM after a screen switch. `.rp-main` is the scroller and its position
// is saved and restored around the pass, or a reveal throws the reader back to
// the top of the page.

const _tvState = {};
function _key(epNum) { return 'round-table-' + (epNum || 0); }
function _state(epNum, total) {
  const k = _key(epNum);
  if (!_tvState[k]) _tvState[k] = { idx: 0, total };
  _tvState[k].total = total;
  return _tvState[k];
}

// ── THE COLLAPSE FLAG — session-scoped, survives every reveal ───────────
//
// The user wanted the sticky board foldable so the debate below it is easier to
// read. The choice is a MODULE flag (mirrored to localStorage so it holds
// across screen switches), deliberately NOT part of `_tvState`: that record is
// rebuilt on every paint, and a collapse that lived there would spring back
// open on the next Continue. Collapsing only HIDES the board — the reveal
// gating in `_stage`/`_ring` is untouched, so a folded board that is reopened
// still shows nothing ahead of its reveal step (defect #5 does not return).
let _boardCollapsed = (() => {
  try { return localStorage.getItem('tr-rt-board') === '1'; } catch (e) { return false; }
})();
function _saveBoard(v) { try { localStorage.setItem('tr-rt-board', v ? '1' : '0'); } catch (e) { /* private mode */ } }
function _boardToggleBtn() {
  return '<button type="button" class="rt-board-toggle" id="rt-board-toggle"'
    + ' aria-expanded="' + (!_boardCollapsed) + '"'
    + ' aria-controls="rt-stage-inner"'
    + ' onclick="trRoundTableToggleBoard(\'roundtable\')">'
    + '<span class="rt-board-chev">' + _icon('chevron', 11) + '</span>'
    + '<span class="rt-board-toggle-lbl">' + (_boardCollapsed ? 'Show board' : 'Hide board')
    + '</span></button>';
}

/** Fold the sticky board away, or bring it back. Keyboard-reachable button. */
export function trRoundTableToggleBoard() {
  _boardCollapsed = !_boardCollapsed;
  _saveBoard(_boardCollapsed);
  const wrap = document.getElementById('rt-stage-inner');
  if (wrap) wrap.setAttribute('data-collapsed', _boardCollapsed ? '1' : '0');
  const btn = document.getElementById('rt-board-toggle');
  if (btn) {
    btn.setAttribute('aria-expanded', String(!_boardCollapsed));
    const lbl = btn.querySelector('.rt-board-toggle-lbl');
    if (lbl) lbl.textContent = _boardCollapsed ? 'Show board' : 'Hide board';
  }
}

function _reapplyVisibility(suffix, upToIdx, total) {
  const scroller = document.querySelector('.rp-main');
  const top = scroller ? scroller.scrollTop : 0;
  for (let i = 0; i < total; i++) {
    const el = document.getElementById('rt-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('rt-vis'); else el.classList.remove('rt-vis');
  }
  const counter = document.getElementById('rt-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('rt-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.rt-btn').forEach(b => b.classList.toggle('rt-dim', done));
  }
  const shell = document.getElementById('rt-shell-' + suffix);
  const last = document.getElementById('rt-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase', last.getAttribute('data-phase') || 'read');
  if (scroller) scroller.scrollTop = top;
}

function _updateStage(epNum, idx) {
  const el = document.getElementById('rt-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trRoundTable) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _stage(state, idx);
}

/**
 * Bring the new beat into view, UNDER the ring rather than behind it.
 *
 * `scrollIntoView({block:'center'})` is the pattern everywhere else in this
 * repo and it is wrong on this screen: the ring is sticky and ~530px tall, so
 * the middle of the viewport is inside it and every revealed beat landed
 * behind the table. There is no CSS answer either -- `scroll-margin-top` would
 * work but only against a hardcoded height, and the stage's height moves with
 * the round, the Dagger and the width of the column.
 *
 * So it measures. The stage is asked how tall it is right now and the beat is
 * put just below it. `scrollIntoView` stays as the fallback for any host that
 * is not the VP's own scroller.
 */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('rt-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trRoundTableRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('rt-step-' + suffix + '-' + st.idx));
  const el = document.getElementById('rt-step-' + suffix + '-' + st.idx);
  // The chair goes back and the whole room feels it.
  if (el && el.getAttribute('data-phase') === 'verdict') {
    const shell = document.getElementById('rt-shell-' + suffix);
    if (shell) {
      shell.classList.remove('rt-knock');
      void shell.offsetWidth;
      shell.classList.add('rt-knock');
    }
  }
  _updateStage(epNum, st.idx);
}

export function trRoundTableRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateStage(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildRoundTable(ep, observer)` — the public half of the night.
 *
 * `ep` is an `episodeHistory` row carrying `tr.table`, written by
 * `_recordEpisode` in js/tr/headless.js. `observer` is `'audience'` or
 * `'player:<Name>'`; see `_view` for exactly what the difference is and where
 * it is applied.
 */
export function rpBuildRoundTable(ep, observer = 'audience') {
  const rec = ep && ep.tr && ep.tr.table;
  const suffix = 'roundtable';
  // The noise tiles are rendered once per build and handed to CSS as custom
  // properties. A live turbulence over the whole shell costs frames on every
  // paint; a tile costs nothing after the first.
  const vars = '--rt-grain-src:' + _noiseTile('0.85', 4, 29, 0.4, 200) + ';'
    + '--rt-oak-src:' + _noiseTile('0.02 0.14', 5, 13, 0.55, 320) + ';'
    + '--rt-grit-src:' + _noiseTile('0.62 0.62', 3, 61, 0.5, 200) + ';';
  const css = '<style>' + RT_CSS + '</style>' + _filters();

  if (!rec) {
    return '<div class="rt-root" style="' + vars + '">' + css
      + '<div class="rt-shell" data-phase="gather"><div class="rt-body"><div class="rt-none">'
      + _ic('table', 92, 'rgba(222,214,196,.36)')
      + '<div class="rt-none-h">The Table Does Not Sit</div>'
      + '<p>Nobody is called down tonight. The format gives the castle one evening '
      + 'before it starts choosing, and this is it.</p>'
      + '</div></div></div></div>';
  }

  const v = _view(rec, observer);
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
  // A <script> tag inside innerHTML does not run, so the build function is the
  // only place that can put the sidebar's data where the reveal handlers will
  // find it. Keyed by episode, so two nights never share a store.
  if (typeof window !== 'undefined') {
    window.__trRoundTable = window.__trRoundTable || {};
    window.__trRoundTable[epNum] = state;
  }

  // THE OBSERVER STRIP CARRIES THE LAYER. The table is public and nearly all
  // of it is the same on both, so the strip has to say which one is being
  // drawn or the difference is invisible — and the difference is the entire
  // right-hand column of every accusation card.
  const observerBadge = v.isAudience
    ? '<div class="rt-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; you are shown what the room heard, '
      + 'and what it had no way of knowing</em></div>'
    : '<div class="rt-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; the slates are public, so you see all of them; '
      + (v.atTable ? 'whether any of it is true is not something anybody in this room knows'
        : 'this player was not in the room, and hears it the way the castle did')
      + '</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED.
  //
  // `.rt-beat` is `height:0` until `.rt-vis` is on it, and `.rt-vis` is added
  // by `_reapplyVisibility` — which only ever runs from a click. So a builder
  // that emitted the bare class handed back a screen whose entire stream was
  // collapsed until the reader pressed Continue, with the counter underneath
  // it already claiming "1 / 24". Same on every redraw: `renderVPScreen` wipes
  // nothing here, but the markup is rebuilt on every paint and a reader who
  // had revealed eleven beats got a blank page back. The class is baked in at
  // build time from the state the handlers keep, and `_reapplyVisibility`
  // still owns it from there.
  const stream = beats.map((b, i) =>
    '<div class="rt-beat' + (i <= st.idx ? ' rt-vis' : '')
    + '" id="rt-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + (b.hostSlot ? _hostBand(_fill(_pick(HOST_LINES[b.hostSlot],
      'rt|host|' + b.hostSlot + '|' + seedEp + '|' + (v.chosen || '')),
    { Nm: _esc(v.chosen || ''), nm: _esc(v.chosen || ''),
      banish: _esc(_verbs().banish), Banish: _esc(_cap(_verbs().banish)) })) : '')
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="rt-root" style="' + vars + '">' + css
    + '<div class="rt-shell" id="rt-shell-' + suffix + '" data-phase="' + beats[0].phase + '">'
    // EVERY PLANE, THE WASH AND THE GRAIN INSIDE ONE CLIP LAYER, and that
    // layer takes no z-index. The conclave learned both halves of this the
    // hard way: a shell with `overflow:hidden` is a scroll container and kills
    // the sticky rail, and a z-index here would make this a stacking context
    // and silently re-grade the screen's blend modes.
    + '<div class="rt-scenery" aria-hidden="true">'
    + '<div class="rt-far">' + _hallFar() + '</div>'
    + '<div class="rt-mid">' + _hallMid(epNum + '|' + (v.chosen || '')) + '</div>'
    + '<div class="rt-fore">' + _hallFore() + '</div>'
    + '<div class="rt-wash-l"></div>'
    + '<div class="rt-vig"></div>'
    + '<div class="rt-grain"></div>'
    + '</div>'
    + '<div class="rt-body">'
    + '<div class="rt-hero">' + _heroScene(v.seated.length)
    + '<div class="rt-hero-lock">'
    // TASK 7, WHEN YOU WIRE THE EPISODE HISTORY: "Evening 3" and not
    // "Season I · Evening III", for the same reason js/vp-tr/conclave.js says
    // "Night 3" — the episode record carries no season number and inventing
    // one would be a fact the screen does not have. The two lines are a pair:
    // the table sits in the evening and the turret meets that night.
    + '<div class="rt-eyebrow">The Traitors &middot; Evening ' + (v.ep || epNum)
    + (v.endgame ? ' &middot; No Answers From Here' : '') + '</div>'
    + '<h1 class="rt-title">THE ROUND TABLE</h1>'
    + '<div class="rt-title-rule"><i></i>' + _icon('seal', 40, '#8e1526') + '<i></i></div>'
    + '<p class="rt-sub">'
    + (v.endgame
      ? 'The same table, the same chalk, and nothing turned over at the end of it. '
        + 'Whoever is left carries on with exactly the beliefs they walked in with.'
      : 'They sit down together, argue in the open, and write one name each in chalk. '
        + 'It is the only hour of the day this castle is handed something true.')
    + '</p></div></div>'
    + '<header class="rt-head">' + observerBadge + '</header>'
    // THE ROOM, STUCK UNDER THE NAV. It is the sticky element AND the element
    // the reveal handlers replace by id — the same arrangement the conclave's
    // rail ended up in, and for the same two reasons: a shell that clips kills
    // sticky for its descendants, and a sticky element needs a containing
    // block taller than itself. Here that block is `.rt-body`, the whole page.
    + '<div class="rt-stage" id="rt-stage-inner" data-collapsed="'
    + (_boardCollapsed ? '1' : '0') + '">' + _stage(state, st.idx) + '</div>'
    + '<main class="rt-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="rt-controls" id="rt-controls-' + suffix + '">'
    + '<button class="rt-btn" onclick="' + call('trRoundTableRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="rt-counter" id="rt-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="rt-btn" onclick="' + call('trRoundTableRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
