// ══════════════════════════════════════════════════════════════════════
// vp-tr/arrival.js — the drive, the register, and the rules read out loud
// ══════════════════════════════════════════════════════════════════════
//
// THE SCREEN THE SEASON WAS MISSING. Spec §2.2 opens episode one on an
// arrival and a briefing, and until this file the first thing a viewer saw was
// twenty people already blindfolded. The format's product is watching a room
// fail to work something out — and a room the viewer has not met is not a
// room, it is a list of names with a hand landing on three of them.
//
// ── ITS PRIMITIVE IS THE REGISTER, AND THAT IS NOT THE RANK ───────────
//
// `selection.js` owns the RANK: a straight line of the whole cast with a band
// of cloth across every face, drawn once and walked along. This screen must
// not borrow it, because the two afternoons are twenty minutes apart and would
// otherwise look like one screen with the lights turned down.
//
// So the stage here is a REGISTER: a ruled vellum page on a table inside the
// gatehouse, one line per arrival, filled in with a name and a billing as each
// car comes up. It is a LEDGER rather than a picture of the room — the one
// object on the estate that is about who these people are rather than about
// where they are standing — and it fills downward while the rank stays still.
//
// The light runs the other way as well. The selection falls from a grey
// afternoon to a lit window after dark; this is the warm end of the same day,
// low sun on stone, and it COOLS as the briefing lands: `data-phase` moves
// drive → flags → briefing → line, and the last of those is the light the
// selection opens in. Two screens, one continuous hour.
//
// ── AND IT REVEALS NOTHING ────────────────────────────────────────────
//
// Nobody is anything yet. `tr.arrival` carries no alignment, no tap, no
// turret and no count, so there is no gate on this screen and no layer to
// withhold — an observer badge, an entry marked "You" where the reader is in
// the cast, and otherwise every reader gets all of it. That is not laxity: it
// is the honest rendering of a record that has nothing in it to hide, and the
// tests assert the record stays that way.
//
// ── AND NOT ONE WORD ON IT WAS WRITTEN HERE ───────────────────────────
//
// Every sentence — the cars, the introductions, the billings, the host's nine
// spoken rules — is on the record, written by `buildArrivalRecord` in
// js/tr/headless.js off the FROZEN background snapshot. This file lays it out.
// That is the whole of "read it through the export": js/vp-tr/ imports no
// engine state, so a screen cannot invent a past for somebody who has none,
// and the transcript retranscribing this screen prints the same words.
import { seasonConfig, players } from '../core.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { PORTRAIT_CSS, TR_NAV_TOP, TR_STICKY_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

// NO EXIT VERB IS IMPORTED, for the reason selection.js gives: this is the
// other screen in the set where nobody leaves, and a word held and never said
// is a field written and never read.
const TR = 'traitors';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The record's prose already carries the entities a castle screen writes
// (&ldquo;, &mdash;), so a line off the record is escaped for angle brackets
// and ampersands ONLY — running `_esc` over it would print "&amp;ldquo;" in
// the middle of a sentence, which is the markup retranscribed instead of the
// quotation mark. Found the way every prose defect in this project is found.
const _line = s => String(s == null ? '' : s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── the host, out of the registry and never out of a literal ──────────
//
// Same resolution `js/vp-tr/selection.js` uses, and for the same reason
// (docs/ADDING-A-SHOW.md §14.10): a host name typed into a screen is a name
// swapping the host in the setup screen cannot reach. The record carries the
// configured KEY; the label is looked up here, at draw time.
function _host(ep) {
  const list = HOSTS_BY_FORMAT[TR] || [];
  const want = (ep && ep.tr && ep.tr.arrival && ep.tr.arrival.host)
    || (seasonConfig && seasonConfig.host);
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
function _av(name, size) { return _portrait(_slugOf(name), name, size || 34); }
function _hostAv(ep, size) {
  const h = _host(ep);
  return _portrait(h.slug, h.name, size || 48);
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — the gatehouse's own objects, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// `eye`, `seal`, `cloak` and `chevron` come from `_icon()` in conclave.js and
// are not redrawn — they are the same objects on every screen in this set.
// These four exist only where somebody is arriving.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    // A CAR SEEN FROM THE SIDE, low and long, because everybody came up that
    // drive in one and this screen is organised by which.
    car: '<path d="M2.6 15.4h18.8v3.2H2.6z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M5 15.4l2.4-4.6a1.6 1.6 0 0 1 1.4-.9h6.4a1.6 1.6 0 0 1 1.4.9l2.4 4.6"'
      + ' stroke="' + c + '" stroke-width="1.3"/>'
      + '<circle cx="7.4" cy="18.6" r="1.9" stroke="' + c + '" stroke-width="1.2"/>'
      + '<circle cx="16.6" cy="18.6" r="1.9" stroke="' + c + '" stroke-width="1.2"/>',
    // THE GATEHOUSE ARCH. One opening, one keystone, two jambs — the thing
    // every one of them walked through and none of them walks back out of.
    gate: '<path d="M4.4 21V10.8a7.6 7.6 0 0 1 15.2 0V21" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M8.6 21v-9.6a3.4 3.4 0 0 1 6.8 0V21" stroke="' + c + '" stroke-width="1.2"'
      + ' opacity=".72"/>'
      + '<path d="M2.4 21h19.2" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M10.6 3.6h2.8v2.2h-2.8z" fill="' + c + '" opacity=".8"/>',
    // A RULED PAGE WITH A LINE WRITTEN ON IT. The stage's own object.
    ledger: '<path d="M4.6 3.4h14.8v17.2H4.6z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M7.4 8h9.2M7.4 11.4h9.2M7.4 14.8h6.2" stroke="' + c + '" stroke-width="1.1"'
      + ' opacity=".7"/>'
      + '<path d="M7.4 5.2h4.4" stroke="' + c + '" stroke-width="1.4"/>',
    // A QUILL — a name going onto the page, which is the only thing that
    // happens on this whole afternoon.
    quill: '<path d="M20.4 3.6c-6 .6-10.4 4-12.4 8.4-1 2.2-1.2 4-1.2 5.4"'
      + ' stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M20.4 3.6c.6 5.2-2 9-6 10.6-2 .8-3.8.8-5 .6"'
      + ' stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M6.8 17.4 3.6 20.6" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round"/>',
    // A CASE ON THE FLAGS. Everybody arrives with one; nobody leaves with it.
    trunk: '<path d="M3.2 8.4h17.6v11.2H3.2z" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M9 8.4V6.2a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6.2v2.2"'
      + ' stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M3.2 13.6h17.6" stroke="' + c + '" stroke-width="1" opacity=".55"/>',
    chevron: '<path d="M9 5.4 16 12l-7 6.6" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE ESTATE AT THE WARM END OF THE DAY
// ══════════════════════════════════════════════════════════════════════
//
// Same drawing rules the selection's redraw settled on and they are worth
// restating because they are what stops generated SVG looking assembled:
// FEWER AND BETTER, real proportion, nothing drawn that cannot be drawn well,
// one colour family in three values. What is DIFFERENT is the light and the
// subject — low sun rather than flat grey, and a gatehouse seen from below
// rather than a facade seen from the end of a drive.

/** The far plane: a low sun, two bands of weather, a soft horizon. */
function _far() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="arSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#6d7a86"/><stop offset="38%" stop-color="#b39a7e"/>'
    + '<stop offset="66%" stop-color="#d9b98d"/><stop offset="100%" stop-color="#8a7a62"/>'
    + '</linearGradient>'
    + '<radialGradient id="arSun" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#ffdca8" stop-opacity=".72"/>'
    + '<stop offset="100%" stop-color="#ffdca8" stop-opacity="0"/>'
    + '</radialGradient></defs>'
    + '<rect width="1100" height="1500" fill="url(#arSky)"/>'
    + '<ellipse cx="286" cy="596" rx="420" ry="330" fill="url(#arSun)"/>'
    + '<ellipse class="ar-cloud" cx="420" cy="272" rx="600" ry="118" fill="#e6d9c4" opacity=".24"/>'
    + '<ellipse class="ar-cloud" style="animation-duration:203s" cx="760" cy="470" rx="680"'
    + ' ry="96" fill="#d7c8b0" opacity=".18"/>'
    + '<path d="M0 842h1100v658H0z" fill="#4a453a" opacity=".5"/>'
    + '<path d="M0 842h1100v30H0z" fill="#3a362d" opacity=".42"/>'
    + '</svg>';
}

/** The mid plane: the flags of the courtyard, and long low-sun shadows. */
function _mid(seed) {
  const rng = _fieldRng('ar|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="arFlags" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#8a7f6c"/><stop offset="54%" stop-color="#5b5346"/>'
    + '<stop offset="100%" stop-color="#2d2a23"/></linearGradient></defs>'
    + '<path d="M0 900h1100v600H0z" fill="url(#arFlags)"/>';
  // THE FLAGS THEMSELVES. Courses of large stones in perspective — four rows,
  // widening downward, which is the one pattern a courtyard actually has and
  // is why this plane is not simply a gradient.
  s += '<g opacity=".2">';
  for (let r = 0; r < 4; r++) {
    const y = 940 + r * 118;
    const w = 150 + r * 44;
    for (let x = -60; x < 1160; x += w) {
      s += '<path d="M' + x + ' ' + y + 'h' + (w - 6) + 'v' + (110 + r * 8) + 'h-'
        + (w - 6) + 'z" fill="none" stroke="#241f18" stroke-width="1.4"/>';
    }
  }
  s += '</g>';
  // SIX SHADOWS, thrown long and low because the sun is nearly on the horizon.
  s += '<g class="ar-shadows">';
  for (let i = 0; i < 6; i++) {
    const x = 190 + i * 132;
    const len = 250 + Math.round(rng() * 46);
    s += '<path d="M' + x + ' 1064h24l' + len + ' ' + Math.round(len * 0.34)
      + 'h-28z" fill="#1a1712" opacity=".2"/>';
  }
  return s + '</g></svg>';
}

/** The fore plane: a soft dark edge, which is what a gatepost does to a shot. */
function _fore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="arEdgeL" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0%" stop-color="#0d0b08" stop-opacity=".95"/>'
    + '<stop offset="100%" stop-color="#0d0b08" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="arEdgeR" x1="1" y1="0" x2="0" y2="0">'
    + '<stop offset="0%" stop-color="#0d0b08" stop-opacity=".95"/>'
    + '<stop offset="100%" stop-color="#0d0b08" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="arEdgeT" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0d0b08" stop-opacity=".88"/>'
    + '<stop offset="100%" stop-color="#0d0b08" stop-opacity="0"/></linearGradient>'
    + '</defs>'
    + '<rect x="0" y="0" width="236" height="1500" fill="url(#arEdgeL)"/>'
    + '<rect x="864" y="0" width="236" height="1500" fill="url(#arEdgeR)"/>'
    + '<rect x="0" y="0" width="1100" height="150" fill="url(#arEdgeT)"/>'
    + '</svg>';
}

/**
 * THE HERO: the gatehouse from the bottom of the drive, with the cars on it.
 *
 * Seen from BELOW and near, which is the opposite framing to the selection's
 * hero (a rank at eye level with the building small behind it). One arch, one
 * keystone, two flanking towers whose merlons are about as wide as the gaps
 * between them, and the drive running out of the bottom of the frame with a
 * short queue of cars on it — few shapes, each one proportioned.
 */
function _heroScene(cars) {
  const n = Math.max(2, Math.min(Number(cars) || 4, 5));
  let s = '<svg class="ar-hero-scene" viewBox="0 0 1100 470" preserveAspectRatio="xMidYMid slice">'
    + '<defs>'
    + '<linearGradient id="arHeroSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#3f4854"/><stop offset="52%" stop-color="#9a8163"/>'
    + '<stop offset="100%" stop-color="#d3b184"/></linearGradient>'
    + '<linearGradient id="arHeroGround" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#6e6252"/><stop offset="100%" stop-color="#292520"/>'
    + '</linearGradient>'
    + '<linearGradient id="arDrive" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#c2a883" stop-opacity=".5"/>'
    + '<stop offset="100%" stop-color="#c2a883" stop-opacity="0"/></linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="470" fill="url(#arHeroSky)"/>';
  // THE GATEHOUSE. Two drums with merlons, a curtain between them, and the
  // arch struck on its own half-width so it reads as an arch and not a slot.
  const base = 372;
  let merl = '';
  for (let x = 430; x < 674; x += 34) {
    merl += 'L' + x + ' 150 L' + x + ' 132 L' + (x + 17) + ' 132 L' + (x + 17) + ' 150 ';
  }
  s += '<path d="M392 ' + base + ' L392 118 L420 118 L420 150 ' + merl
    + 'L680 150 L680 118 L708 118 L708 ' + base + ' Z" fill="#2c2a24" opacity=".92"/>';
  // the opening: a rectangle with a semicircle of its own half-width on top
  s += '<path d="M498 ' + base + 'V222a52 52 0 0 1 104 0v' + (base - 222) + 'z" fill="#100e0b"/>';
  s += '<path d="M541 200h18v22h-18z" fill="#6d6350" opacity=".9"/>';
  // the warm light coming back out of the arch
  s += '<ellipse cx="550" cy="330" rx="118" ry="86" fill="#ffcf86" opacity=".14"/>';
  s += '<rect y="' + base + '" width="1100" height="' + (470 - base) + '" fill="url(#arHeroGround)"/>';
  s += '<path d="M498 ' + base + 'h104l238 ' + (470 - base) + 'H260z" fill="url(#arDrive)"/>';
  // THE QUEUE. Low, long silhouettes getting smaller down the drive.
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(1, n - 1);
    const w = 116 - t * 58;
    const x = 550 - w / 2 + (t - 0.5) * 236;
    const y = base + 16 + t * 62;
    s += '<g opacity="' + (0.92 - t * 0.24).toFixed(2) + '">'
      + '<path d="M' + x + ' ' + y + 'h' + w + 'v' + (w * 0.17).toFixed(1) + 'H' + x + 'z"'
      + ' fill="#191713"/>'
      + '<path d="M' + (x + w * 0.2) + ' ' + y + 'l' + (w * 0.12).toFixed(1) + ' -'
      + (w * 0.16).toFixed(1) + 'h' + (w * 0.36).toFixed(1) + 'l' + (w * 0.12).toFixed(1)
      + ' ' + (w * 0.16).toFixed(1) + 'z" fill="#191713"/>'
      + '<circle cx="' + (x + w * 0.24).toFixed(1) + '" cy="' + (y + w * 0.17).toFixed(1)
      + '" r="' + (w * 0.075).toFixed(1) + '" fill="#0d0c09"/>'
      + '<circle cx="' + (x + w * 0.76).toFixed(1) + '" cy="' + (y + w * 0.17).toFixed(1)
      + '" r="' + (w * 0.075).toFixed(1) + '" fill="#0d0c09"/>'
      + '</g>';
  }
  return s + '</svg>';
}

function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    + '<filter id="arGrain"><feTurbulence type="fractalNoise" baseFrequency="0.88"'
    + ' numOctaves="4" seed="31"/></filter></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE STYLESHEET
// ══════════════════════════════════════════════════════════════════════
// NO BACKTICKS ANYWHERE IN HERE, INCLUDING IN COMMENTS: this is a template
// literal and one of them ends the stylesheet mid-rule.
const AR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.ar-root{
  --ar-stone:#4c463c;
  --ar-stone-deep:#241f19;
  --ar-vellum:#e6dcc4;
  --ar-vellum-deep:#cfc2a2;
  --ar-ink:#f2ebdb;
  --ar-rule:#8e7f61;
  --ar-sun:#e7b978;
  --ar-wax:#a8202f;
  --ar-cold:#9fb0c0;
  --ar-display:'Fraunces',Georgia,'Times New Roman',serif;
  --ar-hand:'IM Fell English',Georgia,serif;
  --ar-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--ar-ink);
  font-family:var(--ar-body);
  font-size:17px;line-height:1.62;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#100e0b;
}
.ar-root *{box-sizing:border-box}

.ar-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--ar-stone);
  box-shadow:0 0 0 1px rgba(242,235,219,.09),0 0 90px rgba(0,0,0,.9);
  overflow:visible;
  transition:background 2.2s ease;
}
/* No z-index on the clip layer: a shell that clips is a scroll container and
   kills sticky for every descendant, and a z-index here makes it a stacking
   context and re-grades every blend. Measured on the conclave. */
.ar-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

/* THE GROUND RUNS THE WHOLE PAGE, not the height of the drawing. The drawn
   planes are 2100px and this screen runs past three thousand with a full cast
   on it; a place that stops looks like a place that is broken. */
.ar-yard{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;pointer-events:none;
  opacity:.74;
  background-color:var(--ar-stone-deep);
  background-image:linear-gradient(180deg,rgba(138,127,108,.4),rgba(30,27,21,.95));
  transition:opacity 2.2s ease,background-color 2.2s ease;
}
/* And the wall you are stood in front of once you are through the arch.
   Coursed ashlar, horizontal only -- crossing it with verticals is a stack
   bond, a pattern no wall is laid in and one the eye reads as a grid. */
.ar-wall{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;pointer-events:none;
  opacity:.28;
  background-image:
    repeating-linear-gradient(180deg,rgba(18,16,12,.62) 0 2px,transparent 2px 82px);
}
.ar-far,.ar-mid,.ar-fore{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};height:2100px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.ar-wash,.ar-vig,.ar-grain{position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;pointer-events:none}
.ar-far svg,.ar-mid svg,.ar-fore svg{position:absolute;inset:0;width:100%;height:100%}
.ar-far {z-index:0;filter:blur(2.4px) saturate(.88);opacity:.92;transition:filter 2.2s ease,opacity 2.2s ease}
.ar-mid {z-index:1;filter:blur(.4px);opacity:.9;transition:filter 2.2s ease,opacity 2.2s ease}
.ar-fore{z-index:2}
.ar-wash{z-index:3}
.ar-vig {z-index:4}
.ar-grain{z-index:9}
.ar-body{position:relative;z-index:5}
.ar-far::after,.ar-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:440px;
  background:linear-gradient(180deg,transparent,rgba(36,31,25,.94));
}
.ar-wash{
  mix-blend-mode:screen;opacity:.3;
  background:radial-gradient(56% 30% at 26% 16%,rgba(255,214,158,.34) 0%,transparent 70%);
  transition:opacity 2.2s ease,background 2.2s ease;
}
.ar-vig{
  background:radial-gradient(120% 74% at 50% 22%,transparent 40%,rgba(8,7,5,.72) 100%);
}
.ar-grain{
  opacity:.2;mix-blend-mode:overlay;
  background-image:var(--ar-grain-src);background-size:220px 220px;
}
.ar-cloud{animation:ar-drift 167s linear infinite}
@keyframes ar-drift{from{transform:translateX(-90px)}to{transform:translateX(90px)}}

/* ── THE HOUR MOVES, AND IT MOVES ONE WAY ────────────────────────────
   Warm low sun on the drive, warmest on the flags, then the colour drains as
   the rules land, and the last phase is the light the Selection opens in. */
.ar-shell[data-phase="flags"]    {background:#544c40}
.ar-shell[data-phase="flags"]    .ar-wash{opacity:.4}
.ar-shell[data-phase="briefing"] {background:#474338}
.ar-shell[data-phase="briefing"] .ar-wash{opacity:.2}
.ar-shell[data-phase="briefing"] .ar-far{filter:blur(3px) saturate(.7)}
.ar-shell[data-phase="line"]     {background:#3a3a36}
.ar-shell[data-phase="line"]     .ar-wash{opacity:.1}
.ar-shell[data-phase="line"]     .ar-far{filter:blur(3.4px) saturate(.54)}
.ar-shell[data-phase="line"]     .ar-yard{opacity:.86}

/* ── THE HERO ───────────────────────────────────────────────────────── */
.ar-hero{position:relative;height:470px;overflow:hidden}
.ar-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.ar-hero::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(16,14,11,.5) 0%,transparent 34%,rgba(16,14,11,.9) 100%);
}
.ar-hero-lock{position:absolute;left:0;right:0;bottom:26px;z-index:2;text-align:center;padding:0 46px}
.ar-eyebrow{
  font-family:var(--ar-hand);font-size:13px;letter-spacing:.3em;text-transform:uppercase;
  color:rgba(242,235,219,.72);margin-bottom:10px;
}
.ar-title{
  font-family:var(--ar-display);font-variation-settings:'wght' 900,'WONK' 1,'SOFT' 0;
  font-size:clamp(40px,7.2vw,86px);line-height:.86;margin:0;
  transform:scaleX(.86);letter-spacing:.01em;
  color:#f6efdf;text-shadow:0 3px 26px rgba(0,0,0,.7);
}
.ar-title-rule{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px 0 12px}
.ar-title-rule i{flex:0 0 132px;height:1px;background:linear-gradient(90deg,transparent,rgba(231,185,120,.7),transparent)}
.ar-sub{
  max-width:760px;margin:0 auto;font-size:17.5px;line-height:1.6;
  color:rgba(242,235,219,.85);
}

/* ── THE HEAD ───────────────────────────────────────────────────────── */
.ar-head{padding:20px 46px 0}
.ar-observer{
  display:flex;align-items:flex-start;gap:9px;
  font-size:13.5px;line-height:1.5;color:rgba(242,235,219,.74);
  border-left:2px solid rgba(231,185,120,.5);padding:8px 0 8px 12px;
}
.ar-observer em{opacity:.8;font-style:italic}

/* ── THE REGISTER: the sticky stage, and this screen's own primitive ── */
.ar-stage{
  position:sticky;top:${TR_STICKY_TOP};z-index:6;
  margin:18px 46px 0;
}
.ar-reg{
  background:linear-gradient(178deg,var(--ar-vellum),var(--ar-vellum-deep));
  color:#2a2419;
  border:1px solid rgba(40,33,22,.4);
  box-shadow:0 20px 44px rgba(0,0,0,.6);
  padding:12px 16px 10px;
}
.ar-reg-h{
  display:flex;align-items:baseline;justify-content:space-between;gap:12px;
  font-family:var(--ar-hand);font-size:13px;letter-spacing:.2em;text-transform:uppercase;
  color:#5c5038;border-bottom:1px solid rgba(60,50,32,.34);padding-bottom:6px;margin-bottom:8px;
}
.ar-reg-h b{font-family:var(--ar-body);letter-spacing:0;text-transform:none;font-size:15px;color:#3a3122}
.ar-reg-rows{
  display:flex;flex-wrap:wrap;gap:5px 14px;
  max-height:112px;overflow:auto;
}
.ar-reg-one{display:flex;align-items:center;gap:6px;font-size:14.5px;color:#2a2419}
.ar-reg-one[data-you="1"]{font-weight:600;color:#7a1a26}
.ar-reg-one em{font-style:normal;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#6d6047}
.ar-reg-wait{font-size:14px;color:#6d6047;font-style:italic}
.ar-reg-foot{
  display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:8px;padding-top:7px;
  border-top:1px solid rgba(60,50,32,.3);font-size:13px;color:#5c5038;
}
.ar-reg-foot b{color:#2a2419}
.ar-reg-foot span[data-tone="wax"] b{color:#8d1f2c}
.ar-rules-tick{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
.ar-tick{
  font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;
  border:1px solid rgba(60,50,32,.36);padding:2px 7px;color:#6d6047;opacity:.45;
}
.ar-tick[data-said="1"]{opacity:1;color:#2a2419;border-color:rgba(60,50,32,.72);background:rgba(231,185,120,.28)}

/* ── THE STREAM ─────────────────────────────────────────────────────── */
.ar-main{padding:18px 46px 40px;display:flex;flex-direction:column;gap:16px}
.ar-beat{opacity:0;transform:translateY(12px);pointer-events:none;height:0;overflow:hidden}
.ar-beat.ar-vis{
  opacity:1;transform:none;pointer-events:auto;height:auto;overflow:visible;
  transition:opacity .5s ease,transform .5s ease;
}
.ar-card{
  position:relative;
  background:linear-gradient(180deg,rgba(28,25,19,.9),rgba(20,18,13,.94));
  border:1px solid rgba(231,185,120,.18);
  padding:16px 20px 18px;
}
.ar-card[data-tone="vellum"]{
  background:linear-gradient(178deg,var(--ar-vellum),var(--ar-vellum-deep));
  color:#2a2419;border-color:rgba(40,33,22,.4);
}
.ar-card[data-tone="vellum"] .ar-h{color:#221d14}
.ar-card[data-tone="vellum"] .ar-label{color:#6d6047}
.ar-card[data-tone="vellum"] p{color:rgba(34,29,20,.88)}
.ar-card[data-tone="sun"]{border-color:rgba(231,185,120,.5);box-shadow:0 0 46px rgba(231,185,120,.09) inset}
.ar-label{
  display:flex;align-items:center;gap:7px;
  font-family:var(--ar-hand);font-size:12px;letter-spacing:.22em;text-transform:uppercase;
  color:rgba(231,185,120,.78);margin-bottom:7px;
}
.ar-h{
  font-family:var(--ar-display);font-variation-settings:'wght' 700,'WONK' 1;
  font-size:22px;line-height:1.16;margin:0 0 9px;color:#f4ecda;
}
.ar-card p{margin:0 0 9px;font-size:17px;line-height:1.64}
.ar-card p:last-child{margin-bottom:0}
.ar-quiet{opacity:.72;font-size:15.5px;font-style:italic}

/* one entry on the page: face, name, billing */
.ar-who{display:flex;align-items:flex-start;gap:13px;margin-bottom:11px}
.ar-who-nm{
  font-family:var(--ar-display);font-variation-settings:'wght' 700;
  font-size:20px;line-height:1.2;color:#f6efdf;
}
.ar-card[data-tone="vellum"] .ar-who-nm{color:#221d14}
.ar-who-sub{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:rgba(231,185,120,.8)}
.ar-card[data-tone="vellum"] .ar-who-sub{color:#7a6a48}

/* the host speaking, which is a different object from a narrated card */
.ar-host{display:flex;align-items:flex-start;gap:14px}
.ar-host-name{
  display:flex;align-items:center;gap:6px;
  font-family:var(--ar-hand);font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;
  color:rgba(231,185,120,.85);margin-bottom:5px;
}
.ar-host-line{font-family:var(--ar-hand);font-size:19px;line-height:1.5;color:#f6efdf}
.ar-host-do{margin-top:9px;font-size:15px;opacity:.7;font-style:italic}

.ar-sums{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:11px;padding-top:9px;
  border-top:1px solid rgba(231,185,120,.16)}
.ar-sum{display:flex;flex-direction:column;gap:1px}
.ar-sum-k{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;opacity:.6}
.ar-sum-v{font-family:var(--ar-display);font-variation-settings:'wght' 700;font-size:17px}
.ar-sum-v[data-tone="wax"]{color:#e05a68}
.ar-sum-v[data-tone="cold"]{color:var(--ar-cold)}

.ar-veil{
  text-align:center;padding:56px 30px;border:1px dashed rgba(159,176,192,.3);
}
.ar-veil-h{
  font-family:var(--ar-display);font-variation-settings:'wght' 700;
  font-size:22px;margin:14px 0 8px;color:rgba(242,235,219,.8);
}

/* ── THE CONTROLS, BELOW THE NAV BAR AND ABOVE EVERYTHING ───────────── */
.ar-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  display:flex;align-items:center;justify-content:center;gap:14px;
  padding:11px 16px;
  background:linear-gradient(180deg,rgba(16,14,11,.2),rgba(16,14,11,.96));
  backdrop-filter:blur(5px);
}
.ar-btn{
  display:inline-flex;align-items:center;gap:7px;
  font-family:var(--ar-hand);font-size:14px;letter-spacing:.16em;text-transform:uppercase;
  background:rgba(231,185,120,.13);color:#f2ebdb;
  border:1px solid rgba(231,185,120,.45);
  padding:8px 20px;cursor:pointer;transition:background .18s ease,opacity .18s ease;
}
.ar-btn:hover{background:rgba(231,185,120,.25)}
.ar-btn.ar-dim{opacity:.34;cursor:default}
.ar-counter{font-family:var(--ar-hand);font-size:14px;letter-spacing:.18em;color:rgba(242,235,219,.72)}

@media (max-width:760px){
  .ar-head,.ar-main{padding-left:18px;padding-right:18px}
  .ar-stage{margin-left:18px;margin-right:18px}
  .ar-hero{height:340px}
}
@media (prefers-reduced-motion:reduce){
  .ar-cloud{animation:none}
  .ar-beat,.ar-beat.ar-vis{transition:none;transform:none}
  .ar-shell,.ar-yard,.ar-far,.ar-mid,.ar-wash{transition:none}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — and there is almost nothing in it, which is the point
// ══════════════════════════════════════════════════════════════════════
//
// The selection has two gates on it because the whole afternoon is a piece of
// information three people were given and seventeen were not. This screen has
// NONE, because `tr.arrival` contains no such information: nobody has been
// chosen yet, and the record carries no alignment, no tap, no turret and no
// count for a gate to stand in front of.
//
// So `observer` does exactly two things here, and both are cosmetic: it names
// the reader in the badge and marks their own line on the register. Writing a
// filter that removes nothing would be worse than writing none — it would
// suggest to the next reader that something on this page is withheld, and the
// first edit that "extends" it would be extending a mechanism against a record
// that has nothing to hide. The tests assert the record stays that way.
function _view(ep, observer) {
  const a = ep && ep.tr && ep.tr.arrival;
  if (!a || !Array.isArray(a.introductions) || !a.introductions.length) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const rules = a.rules || {};
  return {
    ep: a.ep != null ? a.ep : (ep.num || 1),
    isAudience,
    watcher,
    groups: (a.groups || []).map(g => ({ ...g, arrivals: [...(g.arrivals || [])] })),
    intros: a.introductions.map(i => ({ ...i, lines: [...(i.lines || [])] })),
    recognitions: (a.recognitions || []).map(r => ({ ...r })),
    staging: rules.staging || '',
    hostBeats: (rules.hostBeats || []).map(b => ({ ...b })),
    rulePoints: (rules.rulePoints || []).map(r => ({ ...r })),
    revealBeats: (rules.revealBeats || []).map(b => ({ ...b })),
    reminder: rules.reminder || '',
  };
}

/** The register's short word for a billing. Never a season the record lacks. */
const _BILLING = { alumni: 'Alumni', celebrity: 'Celebrity', civilian: 'Civilian' };
const _billing = t => _BILLING[t] || _BILLING.civilian;

/** The heading the rules ticker uses for each rule the host has reached. */
const _RULE_LABEL = {
  'faithfuls-and-traitors': 'Two sides',
  'traitors-murder': 'The murder',
  'missions-build-the-pot': 'The pot',
  'shield-blocks-a-murder': 'The shield',
  'round-table-banishment': 'The Round Table',
  'endgame-payout': 'The payout',
};

// ══════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function _card(title, label, ic, inner, tone) {
  return '<div class="ar-card"' + (tone ? ' data-tone="' + tone + '"' : '') + '>'
    + '<div class="ar-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="ar-h">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _hostBand(ep, line, action) {
  return '<div class="ar-host">' + _hostAv(ep, 52)
    + '<div><div class="ar-host-name">' + _ic('gate', 12) + _esc(_host(ep).name) + '</div>'
    + '<div class="ar-host-line">&ldquo;' + _line(line) + '&rdquo;</div>'
    + (action ? '<div class="ar-host-do">' + _line(action) + '</div>' : '')
    + '</div></div>';
}
function _sums(bits) {
  return '<div class="ar-sums">' + bits.map(b =>
    '<span class="ar-sum"><span class="ar-sum-k">' + _esc(b[0]) + '</span>'
    + '<span class="ar-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>' + b[1]
    + '</span></span>').join('') + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS — the drive, then the page, then the rules, then the line
// ══════════════════════════════════════════════════════════════════════

function _buildBeats(v, ep) {
  const beats = [];
  const push = (phase, html, meta) => beats.push({ phase, html, meta: meta || null });
  const total = v.intros.length;

  // ── the estate, before anybody is on it ─────────────────────────────
  push('drive', _card('Up The Drive', 'The arrival', 'car',
    '<p>' + _line(v.staging) + '</p>'
    + _sums([
      ['Coming up the drive', String(total), null],
      ['Cars', String(v.groups.length), null],
      ['Told anything', 'Nobody', 'cold'],
    ])),
  { kind: 'staging' });

  // ── the cars, and the people out of them ────────────────────────────
  //
  // A car is a SCENE and not a card: the group card sets it up, each arrival
  // is an action, and the reaction line lands on the person it happened to.
  let placed = 0;
  for (const g of v.groups) {
    push('drive', _card(g.label, 'On the gravel', 'car',
      '<p>' + _line(g.text) + '</p>'), { kind: 'car', id: g.id });
    for (const name of g.arrivals) {
      const it = v.intros.find(x => x.name === name);
      if (!it) continue;
      placed++;
      const you = !!v.watcher && v.watcher === name;
      // NO RÉSUMÉ CHIPS. There were season pills under every alumni card and
      // they printed "<season label> · 3" -- the bare placement, because the
      // ordinal lives in the billing sentence -- directly beneath a sentence
      // that had just said "<season label> · 3rd place" properly. Two bugs in
      // one element: a number rendered wrong, and the same fact stated twice
      // in one card. The billing sentence names every season and every finish
      // the ledger holds, so the pills were volume rather than information,
      // which is the rule this set's drawings already follow.
      push('flags', _card('', 'Through the arch', 'quill',
        '<div class="ar-who">' + _av(name, 54)
        + '<div><div class="ar-who-nm">' + _esc(name) + '</div>'
        + '<div class="ar-who-sub">' + _esc(_billing(it.type))
        + (you ? ' &middot; You' : '') + '</div></div></div>'
        + (it.lines || []).map(l => '<p' + (l.kind === 'reaction' ? ' class="ar-quiet"' : '')
          + '>' + _line(l.text) + '</p>').join(''),
        'vellum'),
      { kind: 'intro', name, placed });
    }
  }

  // ── the rules, and every one of them is said out loud ───────────────
  const gather = v.revealBeats.find(b => b.kind === 'gather');
  if (gather) {
    push('flags', _card('The Cars Go Back Down', 'The courtyard', 'trunk',
      '<p>' + _line(gather.text) + '</p>'
      + '<p class="ar-quiet">Everybody who is going to be in this season is now standing '
      + 'on the same twenty feet of stone, and none of them has been told a single thing '
      + 'about what happens next.</p>'), { kind: 'gather' });
  }
  const briefing = v.revealBeats.find(b => b.kind === 'briefing');
  if (briefing) {
    push('briefing', _card('The Rules', 'The briefing', 'gate',
      '<p>' + _line(briefing.text) + '</p>'), { kind: 'briefing' });
  }
  // ONE CARD PER SPOKEN BEAT. The whole speech in one oversized card is the
  // shortcut the ceremony contract names by name: a ceremony is a sequence of
  // actions, and a reader who cannot stop between two of them is reading a
  // paragraph rather than watching an evening.
  v.hostBeats.forEach((b, i) => {
    push('briefing', _card('', b.ruleId ? (_RULE_LABEL[b.ruleId] || 'The rules') : 'The host',
      'chevron', _hostBand(ep, b.text, b.action), b.ruleId ? 'sun' : null),
    { kind: 'rule', beat: i, ruleId: b.ruleId || null });
  });

  // ── and then they are asked to stand in a line ──────────────────────
  const form = v.revealBeats.find(b => b.kind === 'form-line');
  if (form) {
    push('line', _card('The Bags Stay Where They Are', 'What happens next', 'gate',
      '<p>' + _line(form.text) + '</p>'
      + '<p class="ar-quiet">' + (v.isAudience
        ? 'That rank is the last moment in this season when every person in it is the same '
          + 'as every other, and it lasts about four minutes.'
        : (v.watcher
          ? 'You are in that rank. Whatever happens on it happens to you with cloth over '
            + 'your eyes.'
          : 'Whatever happens on that rank happens with cloth over every face on it.'))
      + '</p>'
      + _sums([
        ['On the flags', String(total), null],
        ['Rules given', String(v.rulePoints.length), null],
        ['Anybody chosen yet', 'No', 'cold'],
      ])), { kind: 'line' });
  }
  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE REGISTER — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trArrival`, because a <script> tag inside innerHTML does
// not execute. GATED ON `idx` IN ONE DIRECTION ONLY, and only one is needed:
// a name appears on the page once their own card has been read, and the rules
// ticker lights a rule once the host has said it. There is nothing here to
// spoil in the other direction, because the record holds no answer.
function _register(state, idx) {
  const v = state.v;
  const seen = state.stepMeta.slice(0, Math.max(0, idx + 1)).filter(Boolean);
  const kinds = new Set(seen.map(m => m.kind));
  const written = seen.filter(m => m.kind === 'intro').map(m => m.name);
  const said = new Set(seen.filter(m => m.kind === 'rule' && m.ruleId).map(m => m.ruleId));

  const rows = written.length
    ? written.map(name => {
      const it = v.intros.find(x => x.name === name);
      const you = !!v.watcher && v.watcher === name;
      return '<span class="ar-reg-one"' + (you ? ' data-you="1"' : '') + '>'
        + _esc(name) + ' <em>' + _esc(_billing(it && it.type)) + '</em></span>';
    }).join('')
    : '<span class="ar-reg-wait">Nobody through the arch yet.</span>';

  const ticks = v.rulePoints.map(r =>
    '<span class="ar-tick"' + (said.has(r.id) ? ' data-said="1"' : '') + '>'
    + _esc(_RULE_LABEL[r.id] || r.id) + '</span>').join('');

  const foot = [
    '<span><b>' + written.length + '</b> of ' + v.intros.length + ' written in</span>',
    '<span><b>' + said.size + '</b> of ' + v.rulePoints.length + ' rules given</span>',
    '<span data-tone="wax"><b>' + (kinds.has('line') ? 'Forming' : 'Not yet')
    + '</b> the rank</span>',
  ];

  return '<div class="ar-reg">'
    + '<div class="ar-reg-h"><span>' + _ic('ledger', 13) + ' The arrival register</span>'
    + '<b>' + (kinds.has('briefing') ? 'The rules' : 'The drive') + '</b></div>'
    + '<div class="ar-reg-rows">' + rows + '</div>'
    + (ticks ? '<div class="ar-rules-tick">' + ticks + '</div>' : '')
    + '<div class="ar-reg-foot">' + foot.join('') + '</div>'
    + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'arrival-' + (epNum || 0); }
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
    const el = document.getElementById('ar-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('ar-vis'); else el.classList.remove('ar-vis');
  }
  const counter = document.getElementById('ar-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('ar-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.ar-btn').forEach(b => b.classList.toggle('ar-dim', done));
  }
  const shell = document.getElementById('ar-shell-' + suffix);
  const last = document.getElementById('ar-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase',
    last.getAttribute('data-phase') || 'drive');
  if (scroller) scroller.scrollTop = top;
}

function _updateRegister(epNum, idx) {
  const el = document.getElementById('ar-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trArrival) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _register(state, idx);
}

/** Bring the new card into view, UNDER the register rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('ar-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trArrivalRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('ar-step-' + suffix + '-' + st.idx));
  _updateRegister(epNum, st.idx);
}

export function trArrivalRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateRegister(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildArrival(ep, observer)` — the drive, the register and the briefing.
 *
 * `ep` is the episode-one `episodeHistory` row and no other: `tr.arrival` is
 * written once, at the top of `playTraitorsSeason`, and `TRAITORS_SCREENS`
 * registers this screen off the presence of that field rather than off an
 * episode number — the same rule every other castle screen is registered by.
 *
 * It is registered ABOVE the Selection, which is the whole point of the task:
 * the cast are people before they are anything, and a premiere that opens on
 * the blindfolds has a viewer who has met nobody in the rank.
 */
export function rpBuildArrival(ep, observer = 'audience') {
  const suffix = 'arrival';
  const vars = '--ar-grain-src:' + _noiseTile('0.88', 4, 31, 0.28, 220) + ';';
  const css = '<style>' + AR_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v) {
    return '<div class="ar-root" style="' + vars + '">' + css
      + '<div class="ar-shell" data-phase="drive">'
      + '<div class="ar-scenery" aria-hidden="true">'
      + '<div class="ar-yard"></div><div class="ar-far">' + _far() + '</div>'
      + '<div class="ar-vig"></div><div class="ar-grain"></div></div>'
      + '<div class="ar-body"><div class="ar-main"><div class="ar-veil">'
      + _ic('gate', 76, 'rgba(159,176,192,.34)')
      + '<div class="ar-veil-h">Nobody Came Up The Drive Tonight</div>'
      + '<p>This cast arrived once, and it was not this evening.</p>'
      + '</div></div></div></div></div>';
  }

  const beats = _buildBeats(v, ep);
  const total = beats.length;
  const epNum = ep.num || v.ep || 1;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trArrival = window.__trArrival || {};
    window.__trArrival[epNum] = state;
  }

  const observerBadge = v.isAudience
    ? '<div class="ar-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; and for once that is worth nothing extra. Nobody '
      + 'on these flags is anything yet, so you are being introduced to this cast on '
      + 'exactly the terms they are being introduced to each other</em></div>'
    : '<div class="ar-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; you came up this drive with the rest of them and heard the same '
      + 'briefing on the same flags</em></div>';

  const stream = beats.map((b, i) =>
    '<div class="ar-beat' + (i <= st.idx ? ' ar-vis' : '')
    + '" id="ar-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state on
  // every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="ar-root" style="' + vars + '">' + css
    + '<div class="ar-shell" id="ar-shell-' + suffix + '"'
    + ' data-phase="' + beats[0].phase + '">'
    + '<div class="ar-scenery" aria-hidden="true">'
    + '<div class="ar-yard"></div>'
    + '<div class="ar-wall"></div>'
    + '<div class="ar-far">' + _far() + '</div>'
    + '<div class="ar-mid">' + _mid(epNum + '|' + v.intros.length) + '</div>'
    + '<div class="ar-fore">' + _fore() + '</div>'
    + '<div class="ar-wash"></div>'
    + '<div class="ar-vig"></div>'
    + '<div class="ar-grain"></div>'
    + '</div>'
    + '<div class="ar-body">'
    + '<div class="ar-hero">' + _heroScene(v.groups.length)
    + '<div class="ar-hero-lock">'
    + '<div class="ar-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; The Arrival</div>'
    + '<h1 class="ar-title">THROUGH THE ARCH</h1>'
    + '<div class="ar-title-rule"><i></i>' + _icon('seal', 34, '#e7b978') + '<i></i></div>'
    + '<p class="ar-sub">' + v.intros.length + ' people come up a mile of gravel with their '
    + 'bags, meet each other on the flags, and are told exactly how this works while they '
    + 'still have every reason to trust the person standing next to them.</p>'
    + '</div></div>'
    + '<header class="ar-head">' + observerBadge + '</header>'
    + '<div class="ar-stage" id="ar-stage-inner">' + _register(state, st.idx) + '</div>'
    + '<main class="ar-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="ar-controls" id="ar-controls-' + suffix + '">'
    + '<button class="ar-btn" onclick="' + call('trArrivalRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="ar-counter" id="ar-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="ar-btn" onclick="' + call('trArrivalRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
