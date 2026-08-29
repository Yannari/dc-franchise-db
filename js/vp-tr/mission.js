// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission.js — the afternoon, and the money nobody is promised
// ══════════════════════════════════════════════════════════════════════
//
// Built in the language Task 1 approved and Tasks 2 and 3 extended. SHARED:
// the type system (Fraunces 900 for display, IM Fell English for anything
// spoken or written by hand, Cormorant Garamond for body), the neutral
// `_portrait()` and its stylesheet, `_icon()` for objects that must be the
// same drawing on every screen, the reveal machinery, the sticky-stage
// architecture, and the rule that no narration writes a host name or an exit
// word as a literal.
//
// NOT SHARED, AND ON PURPOSE:
//
//   IT IS OUTDOORS, AND IT IS THE ONLY ONE. The turret is a meeting at night,
//   the hall is a trial at night, the morning is a discovery before sunrise
//   and the day book is a page on a desk. All four are interiors. The mission
//   happens out on the estate in daylight and weather, with the castle small
//   on the skyline behind them, and that single fact separates this screen
//   from the other four more than any palette would.
//
//   THE WEATHER IS THE AMBIENT. The turret has embers rising, the hall has
//   candles, the morning has dust falling and the book has a patch of sun
//   creeping. This screen has RAIN, driven at an angle, and it does not let
//   up: the work is unpleasant, it goes on for hours, and nobody out there is
//   being paid by the hour.
//
//   THE CARDS ARE HAULED. Everything here arrives the way a loaded thing
//   arrives on the end of a rope -- dragged in from the left, checked, and
//   settling back. Nothing drops, leans, descends or is written.
//
//   THE STAGE IS A TALLY BOARD chalked on the side of the cart, and the one
//   number on it counts UP. The pot ticking is the whole tension of the
//   screen, and it is the only figure on any of the five that gets better as
//   the reveals run.
//
// WHAT THIS SCREEN IS ABOUT, and every line of copy in it serves the one
// idea: a Faithful who hauls coffins out of the tide every afternoon for
// three weeks may be doing unpaid labour for the people quietly murdering
// their friends. The fund is collected by whoever is standing at the end. The
// sting is STRUCTURAL and needs no mechanic -- it needs the money to be worth
// having, and the screen to keep saying, without ever naming anybody, that
// nobody out there is guaranteed a penny of it.
//
// AND THE ONE THING IT MUST NOT SAY. A relic comes back out of the field in
// somebody's hands and is seen by SOME of the room and not the rest -- Plan 6
// built that visibility model deliberately and the asymmetry is the
// mechanic's entire strategic content. `_view` decides entitlement once, and
// an unentitled observer's card never receives the name at all. See the note
// on `_relicCard`.
import { seasonConfig, players } from '../core.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { PORTRAIT_CSS } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

const TR = 'traitors';

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
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** The fund, in the currency the format keeps it in. */
function _money(n) {
  return '&pound;' + Number(n || 0).toLocaleString('en-GB');
}
/** The same figure where it is going to be run through `_esc` — no entity. */
function _moneyPlain(n) {
  return '£' + Number(n || 0).toLocaleString('en-GB');
}

// ── the host ──────────────────────────────────────────────────────────
// Resolved from the registry, never written.
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
/** A face out in the weather, and it is NEUTRAL -- `.cv-lit` is the turret's. */
function _av(name, size) {
  return _portrait(_slugOf(name), name, size || 34);
}
function _hostAv(size) {
  const h = _host();
  return _portrait(h.slug, h.name, size || 46);
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — the worksite's own objects, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// The coffer, the shield, the dagger and the seal come from `_icon()` in
// conclave.js and are NOT redrawn here: they are the same objects, and a
// second drawing of the show's Dagger is how two screens start disagreeing
// about what it looks like. These are the worksite's own.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    rope: '<path d="M3 19.4c3.4-2 3.4-5.6 0-7.6 3.4-2 3.4-5.6 0-7.6" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M9 19.4c3.4-2 3.4-5.6 0-7.6 3.4-2 3.4-5.6 0-7.6" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M15 19.4c3.4-2 3.4-5.6 0-7.6 3.4-2 3.4-5.6 0-7.6" stroke="' + c + '" stroke-width="1.5"/>',
    cart: '<path d="M3.4 6.6h12.2l1.8 7.8H5.2z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M17.4 14.4h3.2" stroke="' + c + '" stroke-width="1.3"/>'
      + '<circle cx="8" cy="18.6" r="2.4" stroke="' + c + '" stroke-width="1.3"/>'
      + '<circle cx="16" cy="18.6" r="2.4" stroke="' + c + '" stroke-width="1.3"/>',
    chalk: '<path d="M3 4.4h18v13.2H3z" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M5.6 8h8M5.6 11h10.6M5.6 14h6" stroke="' + c + '" stroke-width="1.1" opacity=".6"/>'
      + '<path d="M7.4 17.6 6 21.4M16.6 17.6 18 21.4" stroke="' + c + '" stroke-width="1.3"/>',
    spade: '<path d="M10.2 2.6h3.6v9.6h-3.6z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M7 12.2h10l-1.4 6.2a3.8 3.8 0 0 1-7.2 0z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M8.4 2.6h7.2" stroke="' + c + '" stroke-width="1.3"/>',
    rain: '<path d="M6.4 3.6 3.8 10.4M12 3.6 9.4 10.4M17.6 3.6 15 10.4" stroke="' + c + '" stroke-width="1.3" opacity=".75"/>'
      + '<path d="M8.4 13.4 5.8 20.2M14 13.4 11.4 20.2M19.6 13.4 17 20.2" stroke="' + c + '" stroke-width="1.3" opacity=".75"/>',
    tally: '<path d="M4 20.4h16" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M6.6 20.4v-5.2M11.4 20.4V9.4M16.2 20.4V4.6" stroke="' + c + '" stroke-width="2.6"/>'
      + '<path d="M18.6 6.4 16.2 3.4 13.8 6.4" stroke="' + c + '" stroke-width="1.3"/>',
    banner: '<path d="M5.4 2.8h13.2v18.4L12 16.6l-6.6 4.6z" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M9 8.2h6M9 11.4h6" stroke="' + c + '" stroke-width="1.1" opacity=".65"/>',
    chevron: '<path d="M9 5.4 16 12l-7 6.6" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE ESTATE — three planes, and it has been raining since lunch
// ══════════════════════════════════════════════════════════════════════
//
// We are standing on the working ground. Behind, a long wet horizon with the
// castle small and grey on it; in front, the cart with the strongbox on its
// bed, and the ground churned to mud. The one thing that never stops is the
// rain.

/** The far plane: sky, weather, horizon, and the castle a long way off. */
function _fieldFar() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="miSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#4b5560"/><stop offset="52%" stop-color="#6a6f6c"/>'
    + '<stop offset="100%" stop-color="#8b8877"/>'
    + '</linearGradient>'
    + '<linearGradient id="miMoor" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#4a4a37"/><stop offset="100%" stop-color="#221f16"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#miSky)"/>'
    + '<path d="M0 190c150-52 260 22 400-14s250-58 380-16 320 4 320 4v-190H0z" fill="#3f4852" opacity=".62"/>'
    + '<path d="M0 320c190-44 300 30 470-6s280-46 430-6 200 2 200 2v-140H0z" fill="#565f66" opacity=".5"/>'
    + '<path d="M0 560h1100v940H0z" fill="url(#miMoor)"/>'
    + '<path d="M0 560c180-26 300 16 470-4s300-30 630-8v20H0z" fill="#3d3f2e"/>'
    + _castleOnTheSkyline()
    + '</svg>';
}
/** The castle, small, grey and a long walk away. It is where the money goes. */
function _castleOnTheSkyline() {
  const x = 806, y = 560;
  return '<g opacity=".62" fill="#2f3339">'
    + '<path d="M' + x + ' ' + y + 'v-92h132v92z"/>'
    + '<path d="M' + (x + 6) + ' ' + (y - 92) + 'v-16h16v16zM' + (x + 40) + ' ' + (y - 92) + 'v-16h16v16z'
    + 'M' + (x + 74) + ' ' + (y - 92) + 'v-16h16v16zM' + (x + 108) + ' ' + (y - 92) + 'v-16h16v16z"/>'
    + '<path d="M' + (x - 22) + ' ' + y + 'v-132h30v132zM' + (x + 124) + ' ' + y + 'v-146h32v146z"/>'
    + '<path d="M' + (x - 26) + ' ' + (y - 132) + 'l12-26 12 26zM' + (x + 120) + ' ' + (y - 146) + 'l16-30 16 30z"/>'
    + '</g>';
}

/**
 * The mid plane: the gantry, the cart, the strongbox and the churned ground.
 *
 * The cart is the screen's anchor because it is where the money physically
 * ends up, and the tally board chalked on its side is the sticky stage's
 * real-world object.
 */
function _fieldMid(seed) {
  const rng = _fieldRng('mi|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="miMud" x1="0" y1="0" x2="0.2" y2="1">'
    + '<stop offset="0%" stop-color="#2f2a1d"/><stop offset="58%" stop-color="#1d1a12"/>'
    + '<stop offset="100%" stop-color="#0d0b07"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<path d="M0 700h1100v800H0z" fill="url(#miMud)"/>';
  // ruts and standing water, laid out from the hash so this afternoon is
  // always this afternoon and the field does not swim on every reveal
  for (let i = 0; i < 22; i++) {
    const x = rng() * 1100, y = 720 + rng() * 640;
    const w = 60 + rng() * 190, h = 5 + rng() * 12;
    s += '<ellipse cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" rx="' + (w / 2).toFixed(0)
      + '" ry="' + h.toFixed(0) + '" fill="#5c6a63" opacity="'
      + (0.06 + rng() * 0.13).toFixed(2) + '"/>';
  }
  s += '<g stroke="#221a10" stroke-width="13" fill="none">'
    + '<path d="M120 760 190 560 260 760M300 760 370 560 440 760"/>'
    + '</g>'
    + '<path d="M190 560 370 560" stroke="#3a2c1a" stroke-width="8"/>'
    + '<path d="M280 560 280 668" stroke="#3a2c1a" stroke-width="5"/>'
    + '<path d="M254 668h52v46h-52z" fill="#2b2114" stroke="#4a3823" stroke-width="4"/>'
    + '<g>'
    + '<path d="M600 700h360v56H600z" fill="#2a2013" stroke="#4a3823" stroke-width="5"/>'
    + '<circle cx="672" cy="792" r="42" fill="none" stroke="#3d2e1b" stroke-width="11"/>'
    + '<circle cx="892" cy="792" r="42" fill="none" stroke="#3d2e1b" stroke-width="11"/>'
    + '<path d="M690 700V612h180v88z" fill="#211a10" stroke="#6a5326" stroke-width="5"/>'
    + '<path d="M690 612 780 566l90 46z" fill="#2c2415" stroke="#6a5326" stroke-width="5"/>'
    + '<path d="M718 612v88M842 612v88" stroke="#6a5326" stroke-width="5" opacity=".8"/>'
    + '<rect x="766" y="640" width="28" height="26" fill="#8f6d2c"/>'
    + '</g>';
  return s + '</svg>';
}

/** The fore plane: the near mud, and a coil of rope dumped in the corner. */
function _fieldFore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<path d="M0 1408h1100v92H0z" fill="#0a0806"/>'
    + '<g fill="none" stroke="#1a1409" stroke-width="14" opacity=".9">'
    + '<ellipse cx="96" cy="1424" rx="86" ry="26"/>'
    + '<ellipse cx="96" cy="1408" rx="66" ry="20"/>'
    + '<ellipse cx="96" cy="1394" rx="46" ry="14"/>'
    + '</g>'
    + '<path d="M0 0h64v1500H0z" fill="#070604" opacity=".85"/>'
    + '<path d="M1036 0h64v1500h-64z" fill="#070604" opacity=".85"/>'
    + '</svg>';
}

/**
 * The rain, and it is the whole ambient.
 *
 * TWO DEPTHS, TWO SPEEDS, AND NO SHARED BEAT. Near drops are brighter, wider
 * and fall in 0.72s; far drops are thin, dim and take 1.24s. The two periods
 * are deliberately not multiples of one another -- the flame rule from Task 2
 * applied to weather, because a sheet of rain that repeats on a visible cycle
 * reads as a texture rather than as weather. Every drop also carries its own
 * negative delay, so 130 of them share no frame.
 */
function _rain(seed) {
  const rng = _fieldRng('mi|rain|' + seed);
  let s = '<svg class="mi-rain-svg" viewBox="0 0 1100 900" preserveAspectRatio="none">';
  for (let i = 0; i < 130; i++) {
    const x = rng() * 1240 - 90, y = rng() * 900;
    const len = 26 + rng() * 46;
    const near = rng() < 0.34;
    s += '<path class="mi-drop" d="M' + x.toFixed(0) + ' ' + y.toFixed(0)
      + 'l' + (-len * 0.28).toFixed(0) + ' ' + len.toFixed(0) + '" stroke="#cfe0e6"'
      + ' stroke-width="' + (near ? 1.5 : 0.8) + '" opacity="' + (near ? 0.3 : 0.15)
      + '" style="animation-duration:' + (near ? '0.72' : '1.24')
      + 's;animation-delay:' + (-rng() * 1.4).toFixed(2) + 's"/>';
  }
  return s + '</svg>';
}

/**
 * The hero plate: the working ground, and the box on the end of it.
 *
 * THE FIRST DRAFT PUT A HUGE OPEN CHEST DEAD CENTRE and the title lockup sat
 * on top of it, so the chest read as three faint diagonal lines behind the
 * word MISSION and the plate said nothing at all about being outdoors --
 * found by rendering it and looking, which is what this plan says the look is
 * judged by. The chest is now a real object at real distance, off to the
 * right where the lockup is not, with a horizon and the castle behind it and
 * the weather coming across. The gantry on the left frames the other side.
 */
function _heroCoffer(pct) {
  const fill = Math.max(0, Math.min(100, pct || 0));
  // The gold sits inside the box: 314 is the rim, 402 the bottom boards.
  const top = 402 - (fill / 100) * 84;
  const rng = _fieldRng('mi|hero|' + Math.round(fill));
  let rain = '';
  for (let i = 0; i < 70; i++) {
    const x = rng() * 1240 - 80, y = rng() * 420;
    const len = 18 + rng() * 34;
    rain += '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'l'
      + (-len * 0.3).toFixed(0) + ' ' + len.toFixed(0) + '" stroke="#cfe0e6"'
      + ' stroke-width="' + (rng() < 0.3 ? 1.4 : 0.7).toFixed(1) + '" opacity="'
      + (0.1 + rng() * 0.2).toFixed(2) + '"/>';
  }
  return '<svg class="mi-hero-scene" viewBox="0 0 1100 456" preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="miHeroSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#5b6672"/><stop offset="60%" stop-color="#7b7f79"/>'
    + '<stop offset="100%" stop-color="#9a9585"/></linearGradient>'
    + '<linearGradient id="miHeroGround" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#3a3627"/><stop offset="100%" stop-color="#0d0c08"/>'
    + '</linearGradient>'
    + '<linearGradient id="miGold" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#ffe9ac"/><stop offset="100%" stop-color="#8a5f1c"/>'
    + '</linearGradient>'
    + '<linearGradient id="miHeroScrim" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0d0c08" stop-opacity="0"/>'
    + '<stop offset="100%" stop-color="#0d0c08" stop-opacity=".92"/>'
    + '</linearGradient></defs>'
    + '<rect width="1100" height="456" fill="url(#miHeroSky)"/>'
    // low cloud, flat and unhurried
    + '<path d="M0 96c160-40 250 22 400-8s250-44 380-10 320 2 320 2V0H0z" fill="#48525c" opacity=".6"/>'
    + '<path d="M0 172c190-34 300 26 470-4s280-36 430-4 200 2 200 2V60H0z" fill="#616a70" opacity=".44"/>'
    // the horizon, the moor, and the castle a long walk away
    + '<path d="M0 244h1100v212H0z" fill="url(#miHeroGround)"/>'
    + '<path d="M0 244c180-18 300 12 470-4s300-20 630-6v14H0z" fill="#3f4230"/>'
    + '<g opacity=".5" fill="#343a41">'
    + '<path d="M132 244v-52h84v52zM120 244v-72h18v72zM212 244v-80h20v80z"/>'
    + '<path d="M116 172l11-20 11 20zM210 164l12-22 12 22z"/>'
    + '</g>'
    // the gantry, left, and a rope hanging off it
    + '<g stroke="#171208" stroke-width="9" fill="none">'
    + '<path d="M36 456 92 268 148 456M196 456 252 268 308 456"/>'
    + '</g>'
    + '<path d="M92 268 252 268" stroke="#2b2114" stroke-width="7"/>'
    + '<path d="M172 268 172 356" stroke="#2b2114" stroke-width="4"/>'
    + '<path d="M150 356h44v38h-44z" fill="#1d160c" stroke="#3d2e1b" stroke-width="4"/>'
    // the cart, right, with the box open on its bed
    + '<g>'
    + '<path d="M706 402h330v40H706z" fill="#241b10" stroke="#3d2e1b" stroke-width="5"/>'
    + '<circle cx="768" cy="452" r="34" fill="none" stroke="#33270f" stroke-width="9"/>'
    + '<circle cx="972" cy="452" r="34" fill="none" stroke="#33270f" stroke-width="9"/>'
    + '<path d="M756 402V314h230v88z" fill="#170f07" stroke="#6a5326" stroke-width="5"/>'
    // WHAT IS IN IT RISES WITH THE FUND. The hero plate is the tally board's
    // number drawn as a physical quantity, and it is the first thing on the
    // screen -- the viewer sees how full the box is before a word of it.
    + '<path d="M762 398h218V' + top.toFixed(0) + 'H762z" fill="url(#miGold)" opacity=".8"/>'
    + '<path d="M756 314 871 268l115 46z" fill="#221a0f" stroke="#6a5326" stroke-width="5"/>'
    + '<path d="M800 314v88M942 314v88" stroke="#6a5326" stroke-width="5" opacity=".85"/>'
    + '<rect x="856" y="336" width="30" height="28" fill="#8f6d2c"/>'
    + '</g>'
    + rain
    // the scrim the lockup sits on, so the title is legible over weather
    + '<rect y="216" width="1100" height="240" fill="url(#miHeroScrim)"/>'
    + '</svg>';
}

/** The filter bank. */
function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="miWet" x="0%" y="0%" width="100%" height="100%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.9 0.05" numOctaves="2" seed="41" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '</defs></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VISUAL SYSTEM — daylight, weather, and a rope-lag on everything
// ══════════════════════════════════════════════════════════════════════
const MI_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.mi-root{
  --mi-ground:#1b1a13;
  --mi-chalk:#e8eae4;
  --mi-rope:#8a6a34;
  --mi-brass:#b98f3e;
  --mi-brass-hot:#f4dda2;
  --mi-verdi:#3f645b;
  --mi-wax:#8e1526;
  --mi-display:'Fraunces',Georgia,'Times New Roman',serif;
  --mi-hand:'IM Fell English',Georgia,serif;
  --mi-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  /* the shared portrait reads this; out here the answer is bone, not brass */
  --cv-display:'Fraunces',Georgia,serif;
  color:#ece5d2;
  font-family:var(--mi-body);
  font-size:17px;line-height:1.6;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#000;
}
.mi-root *{box-sizing:border-box}

.mi-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--mi-ground);
  box-shadow:0 0 0 1px rgba(185,143,62,.14),0 0 90px rgba(0,0,0,.9);
  overflow:visible;
  transition:background 1.4s ease;
}
/* THE CLIP LAYER, AND IT TAKES NO z-index. Both halves of this were measured
   on the conclave: a shell that clips is a scroll container and kills sticky
   for every descendant, and a z-index here would make this a stacking context
   and silently re-grade every blend on the screen. */
.mi-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

.mi-far,.mi-mid,.mi-fore{
  position:absolute;left:0;right:0;top:46px;height:1500px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.mi-rain,.mi-wash,.mi-vig,.mi-grain{position:absolute;left:0;right:0;top:46px;bottom:0;pointer-events:none}
.mi-far svg,.mi-mid svg,.mi-fore svg{position:absolute;inset:0;width:100%;height:100%}
.mi-far {z-index:0;filter:blur(3.4px) saturate(.5) brightness(.86);opacity:.7}
.mi-mid {z-index:1;filter:blur(.5px);opacity:.9}
.mi-fore{z-index:2}
.mi-rain{z-index:3;opacity:.72;overflow:hidden}
.mi-wash{z-index:4}
.mi-vig {z-index:5}
.mi-grain{z-index:9}
.mi-body{position:relative;z-index:6}
.mi-far::after,.mi-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:420px;
  background:linear-gradient(180deg,transparent,var(--mi-ground));
}
.mi-rain-svg{position:absolute;left:-6%;top:0;width:112%;height:104%}
.mi-wash{
  mix-blend-mode:screen;opacity:.42;
  background:radial-gradient(84% 40% at 42% 4%,rgba(196,214,222,.3) 0%,transparent 66%);
}
.mi-vig{
  background:
    radial-gradient(126% 88% at 48% 24%,transparent 0%,transparent 38%,rgba(5,6,6,.5) 72%,rgba(5,6,6,.94) 100%),
    linear-gradient(180deg,rgba(5,6,6,.5) 0%,transparent 16%,transparent 78%,rgba(5,6,6,.86) 100%);
  mix-blend-mode:multiply;
}
.mi-grain{
  opacity:.16;mix-blend-mode:soft-light;
  background-image:var(--mi-grain-src);background-size:240px 240px;
}

/* ── AMBIENT — the rain does not let up ─────────────────────────────── */
.mi-drop{animation:mi-fall linear infinite}
@keyframes mi-fall{
  0%{transform:translate(0,-120px);opacity:0}
  12%{opacity:1}
  100%{transform:translate(-70px,940px);opacity:.05}
}

/* ── PHASE ATMOSPHERE — one afternoon, going grey, then gold, then out ── */
.mi-shell[data-phase="brief"]{background:#1b1a13}
.mi-shell[data-phase="field"]{background:#191b16}
.mi-shell[data-phase="field"] .mi-wash{opacity:.6}
.mi-shell[data-phase="work"]{background:#151714}
.mi-shell[data-phase="work"] .mi-rain{opacity:1}
.mi-shell[data-phase="break"]{background:#141513}
.mi-shell[data-phase="break"] .mi-wash{opacity:.8;
  background:radial-gradient(60% 34% at 66% 8%,rgba(126,160,152,.28) 0%,transparent 60%)}
.mi-shell[data-phase="break"] .mi-rain{opacity:.4}
.mi-shell[data-phase="extras"]{background:#1c1913}
.mi-shell[data-phase="count"]{background:#241c11}
.mi-shell[data-phase="count"] .mi-wash{opacity:1;
  background:radial-gradient(96% 50% at 54% 4%,rgba(244,221,162,.3) 0%,transparent 64%)}
.mi-shell[data-phase="count"] .mi-rain{opacity:.28}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.mi-hero{
  position:relative;height:456px;overflow:hidden;
  background:#0f100c;border-bottom:1px solid rgba(185,143,62,.24);
}
.mi-hero svg.mi-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.mi-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
.mi-eyebrow{
  font-family:var(--mi-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:rgba(236,229,210,.88);
  text-shadow:0 2px 12px rgba(0,0,0,.9);margin-bottom:2px;
}
/* THE LOCKUP. The same one all four earlier screens use: Fraunces 900
   squeezed to .80 with a 1.3px stroke. Five screens, one logo. */
.mi-title{
  display:inline-block;
  font-family:var(--mi-display);font-weight:900;
  font-size:clamp(34px,6.2vw,74px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:#f6efdb;margin:10px 0 0;
  text-shadow:0 4px 30px rgba(0,0,0,.92);
}
.mi-title-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 10px}
.mi-title-rule i{display:block;height:1px;width:110px;
  background:linear-gradient(90deg,transparent,rgba(236,229,210,.5))}
.mi-title-rule i:last-child{background:linear-gradient(270deg,transparent,rgba(236,229,210,.5))}
.mi-sub{
  font-family:var(--mi-hand);font-style:italic;font-size:18px;line-height:1.55;
  color:rgba(236,229,210,.88);max-width:640px;margin:0 auto;
  text-shadow:0 2px 14px rgba(0,0,0,.92);
}

/* ── OBSERVER STRIP ─────────────────────────────────────────────────── */
.mi-head{padding:16px 34px;border-bottom:1px solid rgba(185,143,62,.2);
  background:linear-gradient(180deg,rgba(8,9,7,.7),transparent)}
.mi-observer{
  display:flex;align-items:center;gap:10px;
  font-family:var(--mi-display);font-weight:600;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(236,229,210,.76);
}
.mi-observer em{font-family:var(--mi-body);font-style:italic;font-size:14px;
  letter-spacing:0;text-transform:none;color:rgba(236,229,210,.52)}

/* ═══ THE TALLY BOARD — the sticky stage, chalk on slate ═══════════════
   Not a rack of brass plates and not a ring of chairs: a board nailed to the
   side of the cart. The one number on it counts UP, which no other screen in
   this set has. */
.mi-stage{position:sticky;top:46px;z-index:12;
  background:linear-gradient(180deg,rgba(9,10,9,.97),rgba(9,10,9,.9));
  border-bottom:1px solid rgba(185,143,62,.28);
  padding:12px 22px 15px;backdrop-filter:blur(5px)}
.mi-board{display:flex;flex-wrap:wrap;gap:10px;align-items:stretch}
.mi-chalk{
  flex:1 1 148px;position:relative;padding:9px 13px 10px;
  background:linear-gradient(160deg,#2b3134,#1a1e20 60%,#252b2d);
  border:1px solid rgba(232,234,228,.2);
  box-shadow:inset 0 1px 0 rgba(232,234,228,.14),0 6px 16px rgba(0,0,0,.55);
}
.mi-chalk[data-blank="1"]{filter:saturate(.2) brightness(.55)}
.mi-chalk-k{
  display:block;font-family:var(--mi-display);font-weight:700;font-size:8.5px;
  letter-spacing:.3em;text-transform:uppercase;color:rgba(232,234,228,.56);
}
.mi-chalk-v{
  display:block;font-family:var(--mi-hand);font-size:24px;line-height:1.18;
  color:var(--mi-chalk);margin-top:2px;text-shadow:0 0 10px rgba(232,234,228,.24);
}
.mi-chalk[data-tone="gold"] .mi-chalk-v{color:var(--mi-brass-hot)}
.mi-chalk[data-tone="wax"] .mi-chalk-v{color:#e88b96}
.mi-chalk-note{display:block;font-family:var(--mi-body);font-style:italic;font-size:12px;
  color:rgba(232,234,228,.5);margin-top:1px}
.mi-chalk-bar{position:relative;height:6px;margin-top:7px;background:rgba(232,234,228,.14)}
.mi-chalk-bar i{position:absolute;left:0;top:0;bottom:0;display:block;
  background:linear-gradient(90deg,#8f6d2c,#f4dda2)}

/* ── THE WORKING GROUND ─────────────────────────────────────────────── */
.mi-main{padding:26px 34px 80px;max-width:880px;margin:0 auto}

.mi-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.mi-beat.mi-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:26px}

/* A CARD IS HAULED: in from the left on the end of a rope, checked, settling
   back. Nothing on this screen drops, leans, descends or is written. */
.mi-beat.mi-vis .mi-card{animation:mi-haul .66s cubic-bezier(.22,1.2,.36,1) both}
@keyframes mi-haul{
  0%{opacity:0;transform:translateX(-56px) rotate(-1.1deg)}
  62%{opacity:1;transform:translateX(9px) rotate(.3deg)}
  100%{opacity:1;transform:none}
}

/* THE CANVAS. A card out here is a sheet of oiled canvas pegged to a frame:
   warm, a little translucent, and darker than the day book's page because it
   is outside and it is wet. */
.mi-card{
  position:relative;
  background:linear-gradient(176deg,rgba(46,44,34,.94),rgba(26,25,19,.96));
  border:1px solid rgba(185,143,62,.3);
  padding:22px 26px 24px;
  box-shadow:0 18px 46px rgba(0,0,0,.6),inset 0 0 60px rgba(138,106,52,.1);
}
.mi-card::before{
  content:'';position:absolute;left:0;right:0;top:0;height:2px;
  background:linear-gradient(90deg,var(--mi-rope),rgba(138,106,52,.05));
}
.mi-label{
  display:flex;align-items:center;gap:9px;
  font-family:var(--mi-display);font-weight:700;font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(185,143,62,.9);margin-bottom:8px;
}
.mi-h{
  font-family:var(--mi-display);font-weight:900;font-size:26px;line-height:1.14;
  letter-spacing:-.014em;color:#f6efdb;margin:0 0 12px;
}
.mi-card p{margin:0 0 11px;color:rgba(236,229,210,.86)}
.mi-card p:last-child{margin-bottom:0}
.mi-say{font-family:var(--mi-hand);font-style:italic;font-size:19px;line-height:1.55;
  color:rgba(244,232,204,.94)}

/* the two teams, side by side */
.mi-teams{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0 2px}
.mi-team{padding:13px 15px;border:1px solid rgba(185,143,62,.28);background:rgba(12,13,10,.5)}
.mi-team[data-best="1"]{border-color:rgba(244,221,162,.6);
  background:linear-gradient(150deg,rgba(185,143,62,.16),rgba(12,13,10,.5))}
.mi-team-n{font-family:var(--mi-display);font-weight:900;font-size:19px;color:#f6efdb;
  display:flex;align-items:center;gap:9px}
.mi-team-tag{font-family:var(--mi-display);font-weight:700;font-size:8.5px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(244,221,162,.9)}
.mi-hands{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
.mi-hand-chip{display:inline-flex;align-items:center;gap:7px;padding:3px 9px 3px 3px;
  border:1px solid rgba(185,143,62,.24);background:rgba(0,0,0,.28)}
.mi-hand-nm{font-family:var(--mi-display);font-weight:700;font-size:9.5px;letter-spacing:.1em;
  text-transform:uppercase;color:rgba(236,229,210,.82)}

/* the side objectives: one line, one name, paid or not */
.mi-extras{margin:14px 0 2px;border-top:1px solid rgba(185,143,62,.24)}
.mi-extra{display:grid;grid-template-columns:auto 1fr auto;gap:13px;align-items:center;
  padding:11px 2px;border-bottom:1px solid rgba(185,143,62,.18)}
.mi-extra-t{font-family:var(--mi-hand);font-style:italic;font-size:17px;
  color:rgba(236,229,210,.9)}
.mi-extra-p{font-family:var(--mi-display);font-weight:900;font-size:15px;white-space:nowrap}
.mi-extra[data-won="1"] .mi-extra-p{color:var(--mi-brass-hot)}
.mi-extra[data-won="0"] .mi-extra-p{color:rgba(236,229,210,.34)}

/* the relic: the one card on this screen that depends on who is reading it */
.mi-relic{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;
  padding:15px 18px;margin:14px 0 2px;border:1px solid rgba(63,100,91,.5);
  background:linear-gradient(140deg,rgba(63,100,91,.18),rgba(12,13,10,.6))}
.mi-relic[data-kind="dagger"]{border-color:rgba(142,21,38,.5);
  background:linear-gradient(140deg,rgba(142,21,38,.18),rgba(12,13,10,.6))}
.mi-relic[data-known="0"]{border-color:rgba(185,143,62,.24);
  background:linear-gradient(140deg,rgba(60,58,48,.4),rgba(12,13,10,.6))}
.mi-relic-face{display:flex;align-items:center;justify-content:center;width:58px;height:58px;
  border:1px solid rgba(185,143,62,.34);background:rgba(0,0,0,.4)}
.mi-relic-k{font-family:var(--mi-display);font-weight:700;font-size:9px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(185,143,62,.92)}
.mi-relic-h{font-family:var(--mi-display);font-weight:900;font-size:20px;color:#f6efdb;
  margin:3px 0 4px}
.mi-relic-h em{font-family:var(--mi-body);font-style:italic;font-weight:400;font-size:18px;
  color:rgba(236,229,210,.7)}
.mi-relic-note{font-family:var(--mi-hand);font-style:italic;font-size:16px;
  color:rgba(236,229,210,.82)}

/* the count */
.mi-count{margin:16px 0 4px;padding:18px 20px;border:1px solid rgba(185,143,62,.5);
  background:linear-gradient(150deg,rgba(185,143,62,.2),rgba(12,13,10,.6))}
.mi-count-n{font-family:var(--mi-display);font-weight:900;font-size:clamp(32px,5.6vw,56px);
  line-height:1;color:var(--mi-brass-hot);letter-spacing:-.02em}
.mi-count-of{font-family:var(--mi-display);font-weight:700;font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:rgba(236,229,210,.72);margin-top:7px}
.mi-bar{position:relative;height:12px;margin-top:12px;background:rgba(0,0,0,.5);
  border:1px solid rgba(185,143,62,.36)}
.mi-bar i{position:absolute;left:0;top:0;bottom:0;display:block;
  background:linear-gradient(90deg,#8f6d2c,#f4dda2)}
.mi-bar b{position:absolute;top:0;bottom:0;width:2px;background:rgba(232,234,228,.6)}

.mi-sums{display:flex;flex-wrap:wrap;gap:10px 30px;margin:14px 0 2px;padding:13px 0 0;
  border-top:1px solid rgba(185,143,62,.24)}
.mi-sum{display:inline-flex;align-items:baseline;gap:9px}
.mi-sum-k{font-family:var(--mi-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(236,229,210,.62)}
.mi-sum-v{font-family:var(--mi-display);font-weight:900;font-size:23px;color:#f6efdb}
.mi-sum-v[data-tone="gold"]{color:var(--mi-brass-hot)}
.mi-sum-v[data-tone="wax"]{color:#e88b96}

/* ── HOST BAND — the same furniture as the other four screens ───────── */
.mi-host{
  position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:16px 24px;margin-bottom:16px;
  background:linear-gradient(100deg,rgba(8,9,7,.96),rgba(62,50,20,.82) 52%,rgba(8,9,7,.96));
  border-top:1px solid rgba(185,143,62,.46);border-bottom:1px solid rgba(185,143,62,.46);
  box-shadow:inset 0 0 40px -8px rgba(244,221,162,.16),0 12px 30px rgba(0,0,0,.5);
}
.mi-host-name{
  font-family:var(--mi-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--mi-brass-hot);margin-bottom:6px;
  display:flex;align-items:center;gap:8px;
}
.mi-host-line{font-family:var(--mi-hand);font-style:italic;font-size:19px;line-height:1.5;
  color:#f2e2bb}
/* A CLOSING BAND SITS UNDER ITS CARD, so its margin runs the other way. */
.mi-card + .mi-host{margin-bottom:0;margin-top:18px}

/* ── STICKY CONTROLS ────────────────────────────────────────────────── */
.mi-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(8,9,7,.1),rgba(8,9,7,.98) 44%);
  border-top:1px solid rgba(185,143,62,.24);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.mi-btn{
  font-family:var(--mi-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(185,143,62,.24),rgba(185,143,62,.05));
  color:#f2e2bb;
  border:1px solid rgba(185,143,62,.5);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(255,244,208,.2);
}
.mi-btn:hover{background:rgba(185,143,62,.34);color:var(--mi-brass-hot);
  box-shadow:0 0 26px rgba(185,143,62,.28),inset 0 1px 0 rgba(255,244,208,.34)}
.mi-btn[disabled],.mi-btn.mi-dim{opacity:.3;cursor:default;pointer-events:none}
.mi-counter{
  font-family:var(--mi-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:rgba(236,229,210,.5);min-width:86px;text-align:center;
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
.mi-none{max-width:620px;margin:0 auto;padding:64px 34px 90px;text-align:center}
.mi-none-h{font-family:var(--mi-display);font-weight:900;font-size:32px;letter-spacing:-.01em;
  color:#f6efdb;margin:22px 0 16px}
.mi-none p{font-family:var(--mi-hand);font-size:19px;line-height:1.65;
  color:rgba(236,229,210,.74);margin:0 auto 14px;max-width:520px}

/* ── RESPONSIVE ─────────────────────────────────────────────────────── */
@media(max-height:720px){.mi-stage{position:static}}
@media(max-width:900px){
  .mi-stage{position:static}
  .mi-hero{height:380px}
}
@media(max-width:700px){
  .mi-main{padding:24px 18px 56px}
  .mi-head{padding:14px 20px}
  .mi-hero{height:320px}
  .mi-hero-lock{padding:0 20px 22px}
  .mi-host{grid-template-columns:1fr;gap:10px}
  .mi-teams{grid-template-columns:1fr}
  .mi-extra{grid-template-columns:auto 1fr;gap:9px}
  .mi-relic{grid-template-columns:1fr;gap:11px}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .mi-root *,.mi-root *::before,.mi-root *::after{animation:none!important;transition:none!important}
  .mi-beat.mi-vis .mi-card{opacity:1;transform:none}
  .mi-rain{display:none}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════
//
// EVERY LINE HERE IS A CLAIM ABOUT THE AFTERNOON AND NEVER ABOUT ANYBODY'S
// ALIGNMENT. The engine's own prose files hold that discipline at source
// (js/tr/missions.js, js/tr/powers.js) and this screen is held to it too: the
// sting is that the money may go to the wrong people, and it is said as a
// GENERAL truth about the fund, never as a claim about a named player. A
// sentence like "somebody out here is not what they say" would be true most
// afternoons and would still be the screen guessing on the audience's behalf.

const HOST_LINES = {
  open: [
    'Out you go. It is wet, it is heavy, and none of it is yours yet.',
    'Work hard this afternoon. Somebody is going to enjoy the money enormously.',
    'The fund does not care who fills it. Neither, frankly, do I.',
    'Everything you bring back today goes in the box. Who opens the box is a later conversation.',
  ],
  close: [
    'And into the box it goes, where it will sit being extremely valuable to whoever is left.',
    'Well done. Every penny of that belongs to whoever is standing at the end of this, '
    + 'and not one of you knows who that is.',
    'The fund is heavier than it was this morning. So is everybody, mostly with mud.',
    'Banked. It is a lovely number and it has no opinion about which of you deserves it.',
  ],
};

const BRIEF_TEXT = {
  triumph: [
    'They were told what it was and how long they had, and then they did rather more than '
    + 'that, which nobody out on the estate was expecting.',
    'A brief, a horn, and an afternoon that the crew will be talking about for the rest of '
    + 'the season.',
  ],
  solid: [
    'A brief, a horn, and a long wet afternoon of doing a job properly and not brilliantly.',
    'Everybody knew what was being asked. Most of it got done, which out here counts as a '
    + 'success and is priced accordingly.',
  ],
  scraped: [
    'The brief was clear enough. What happened to it afterwards was not.',
    'They were told exactly what to do and then spent most of the hour discovering how many '
    + 'ways there are not to do it.',
  ],
  failed: [
    'A brief, a horn, and nothing whatever to show for either.',
    'The estate asked for something specific. It received an afternoon of weather and an '
    + 'apology.',
  ],
};

const TEAM_TEXT = [
  'Two halves of the same room, drawn out of a hat this morning, and neither of them chosen '
  + 'for anything. Nobody out here is on a side that means anything yet.',
  'The room split in two. The split is arbitrary and everybody knows it, which does not stop '
  + 'either half wanting to beat the other by dinner.',
  'Two teams. Note who is standing next to whom, because in about four hours some of these '
  + 'people will be arguing about which of them is lying.',
  'The field, split down the middle. The fund does not care which half earned more of it, '
  + 'which is the single most useful thing to remember about any of this.',
];

const WORK_TEXT = [
  'And then it was simply hours of it, in the rain, with the castle a long way off up the hill.',
  'What follows is the afternoon itself, which took considerably longer than it takes to read.',
  'Then the work, which is the part nobody signs up for and everybody has to do.',
  'The horn went and the estate got on with it.',
];

const BREAK_TEXT = [
  'And at some point in the middle of it somebody was not where they were supposed to be.',
  'Somewhere in the second hour the line was a body short, and the line noticed.',
  'The carry needs everybody on it. For a good stretch of the afternoon it did not have '
  + 'everybody on it.',
  'One person out here stopped doing the job everybody else was doing.',
];

const BREAK_COST = [
  'That hour came out of the fund, and it came out of everybody’s share of it — '
  + 'including the shares of the people who never knew it was happening.',
  'The gap in the line has a price, and the whole castle paid it without being asked.',
  'Somebody has to carry the end they dropped, and nobody did, so the box is lighter than it '
  + 'would have been.',
  'It cost the afternoon real money. It always does; that is what makes breaking away a '
  + 'gamble instead of a purchase.',
];

const EXTRA_TEXT = [
  'Nobody had to do any of the following. The estate offers a little extra to anybody willing '
  + 'to make their afternoon worse, and there is always somebody.',
  'The optional part, worth a fraction of the main haul and taken on entirely for the story.',
  'Small money, taken by people who wanted their name on something.',
  'And the extras, which pay badly and are attempted anyway.',
];

const COUNT_TEXT = [
  'Then the box, and the arithmetic, done in front of everybody so that nobody can argue '
  + 'about it later.',
  'The count. This is the only honest number produced anywhere on this estate.',
  'And the money, weighed and entered while they were all still dripping on the flags.',
  'The take, counted out on the tailgate in the rain.',
];

const STING = [
  'It goes in the box with everything earned before it. The box is opened once, at the end, '
  + 'by whoever is still standing — and every hour of this afternoon counts exactly the '
  + 'same whether the hands that did it are still in the castle by then or not.',
  'Nobody out here is working for themselves. They are working for the fund, and the fund is '
  + 'collected at the end by the survivors, whoever those turn out to be.',
  'The afternoon buys nothing else. No safety, no advantage, no read on anybody — only '
  + 'money, and only for whoever lasts.',
  'And that is the whole bargain: a hard afternoon, a heavier box, and no promise at all '
  + 'about who opens it.',
];

const CEILING_HIT = [
  'The box would not take all of it. The fund has a ceiling and the afternoon ran past it, '
  + 'so the rest is simply gone.',
  'They earned more than there was room for. The overflow is not owed to anybody and is not '
  + 'coming back.',
];

// ══════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function _card(title, label, ic, inner) {
  return '<div class="mi-card">'
    + '<div class="mi-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="mi-h">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _hostBand(line) {
  return '<div class="mi-host">' + _hostAv(52)
    + '<div><div class="mi-host-name">' + _ic('banner', 12) + _esc(_host().name) + '</div>'
    + '<div class="mi-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}
function _chip(name) {
  return '<span class="mi-hand-chip">' + _av(name, 24)
    + '<span class="mi-hand-nm">' + _esc(name) + '</span></span>';
}
function _sums(bits) {
  return '<div class="mi-sums">' + bits.map(b =>
    '<span class="mi-sum"><span class="mi-sum-k">' + _esc(b[0]) + '</span>'
    + '<span class="mi-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>' + b[1]
    + '</span></span>').join('') + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the hard rules, in one place
// ══════════════════════════════════════════════════════════════════════

/**
 * THE AFTERNOON, AND WHAT THIS OBSERVER MAY BE TOLD ABOUT IT.
 *
 * THE FIGURES come off `ep.tr.mission` and `ep.tr.pot`, both snapshotted onto
 * the episode row by `_recordEpisode` in js/tr/headless.js. Nothing in
 * js/vp-tr/ imports `gs`: `gs.tr.missions` is the season's whole log and a
 * screen reaching into it would draw whichever afternoon happened to be last
 * when the viewer opened the episode.
 *
 * THE RELIC IS THE ONE THING ON THIS SCREEN THAT DEPENDS ON WHO IS READING.
 * A Shield or a Dagger is found in front of SOME of the room and behind the
 * backs of the rest -- Plan 6 built that visibility model deliberately, and
 * the split is worth more than the object. `known` is decided HERE and not in
 * the markup, and an observer who was neither the holder nor a witness gets a
 * relic block that never receives the name at all: not a hidden field, not a
 * blanked one, a branch with nothing in it to leak. A later edit to the card
 * cannot undo that.
 *
 * A MISS IS NOT GATED, and the asymmetry is deliberate rather than an
 * oversight. When the searcher comes back with nothing there is no relic, no
 * holder and no witness list -- and the gap in the line was public: the
 * engine's own miss prose ("the line noticed the gap where they should have
 * been") is a claim about something the whole team saw. Gating a fact the
 * room watched happen would be a guard on an unreachable secret.
 */
function _view(ep, observer) {
  const m = ep && ep.tr && ep.tr.mission;
  if (!m || !Array.isArray(m.teams) || m.teams.length < 2) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;

  const r = m.relic || null;
  let relic = null;
  if (r) {
    const awarded = !!(r.found && r.holder);
    // ENTITLEMENT, DECIDED ONCE. Two states, and both of them matter: an
    // entitled observer is told a name, a blind one is told an object.
    const known = !awarded || isAudience || (watcher != null
      && (watcher === r.holder || (r.witnesses || []).indexOf(watcher) >= 0));
    relic = {
      kind: r.kind === 'dagger' ? 'dagger' : 'shield',
      found: !!r.found,
      awarded,
      cost: Number(r.cost || 0),
      visibility: r.visibility || null,
      known,
      // NOT PRESENT AT ALL where this observer did not see the award. The
      // searcher IS the holder on a found afternoon, so the searcher's name
      // and the engine's own carry prose go the same way.
      //
      // ONE TEST, NOT TWO. These read `known` alone rather than repeating
      // `!awarded ||`, and the repetition WAS here in the first draft: it
      // made the empty-handed case unreachable from `known`, so a mutation
      // closing the gate over a miss changed nothing and the guard on it
      // passed for free. That is this plan's recurring vacuous shape --
      // redundancy hiding a dead guard -- and the fix is one place where the
      // question is answered.
      searcher: known ? r.searcher : null,
      holder: (awarded && known) ? r.holder : null,
      lines: known ? [...(r.lines || [])] : [],
      seen: (r.witnesses || []).length,
    };
  }

  const pot = Number(ep.tr.pot || 0);
  const earned = Number(m.earned || 0);
  return {
    ep: ep.tr.ep != null ? ep.tr.ep : (ep.num || 0),
    isAudience,
    watcher,
    // Did this observer work this afternoon? Everybody living did -- the
    // teams are the whole room -- so this is a fact about whether they were
    // still in the castle, and it is what the observer strip says.
    onTheField: watcher == null
      || m.teams.some(t => (t.members || []).indexOf(watcher) >= 0),
    name: m.name || 'The Mission',
    id: m.id || '',
    teams: m.teams.map(t => ({ name: t.name, members: [...(t.members || [])] })),
    bestTeam: m.bestTeam || null,
    tier: m.tier || 'solid',
    summary: m.summary || '',
    tellLines: Array.isArray(m.tellLines) ? [...m.tellLines] : null,
    extras: (m.sideObjectives || []).map(o => ({
      player: o.player, achieved: !!o.achieved, bonus: Number(o.bonus || 0),
      line: o.line || '',
    })),
    relic,
    gross: Number(m.gross || 0),
    earned,
    // THE FUND AS THE ROW CARRIES IT, and `potBefore` is derived from it
    // rather than from a second snapshot: one number on the record, one
    // subtraction, and nothing for two sources to disagree about.
    pot,
    potBefore: Math.max(0, pot - earned),
    ceiling: Number(ep.tr.potCeiling || 0),
    spilled: Math.max(0, Number(m.gross || 0) - earned),
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

function _buildBeats(v) {
  const beats = [];
  const key = 'mi|' + v.ep + '|' + v.id;
  const push = (phase, html, hostSlot, meta) =>
    beats.push({ phase, html, hostSlot: hostSlot || null, meta: meta || null });

  // ── the brief ───────────────────────────────────────────────────────
  push('brief', _card(v.name, 'The brief', 'banner',
    '<p>' + _pick(BRIEF_TEXT[v.tier] || BRIEF_TEXT.solid, key + '|brief') + '</p>'
    + '<p class="mi-say">&ldquo;' + _esc(v.summary) + '&rdquo;</p>'),
  'open', { kind: 'brief' });

  // ── the two halves of the room ──────────────────────────────────────
  push('field', _card('Two Halves Of The Same Room', 'The teams', 'rope',
    '<p>' + _pick(TEAM_TEXT, key + '|teams') + '</p>'
    + '<div class="mi-teams">' + v.teams.map(t =>
      '<div class="mi-team" data-team="' + _esc(t.name) + '"'
      + ' data-best="' + (t.name === v.bestTeam ? 1 : 0) + '">'
      + '<div class="mi-team-n">' + _ic('rope', 15) + _esc(t.name)
      + (t.name === v.bestTeam
        ? '<span class="mi-team-tag">Better afternoon</span>' : '') + '</div>'
      + '<div class="mi-hands">' + t.members.map(_chip).join('') + '</div>'
      + '</div>').join('') + '</div>'),
  null, { kind: 'field' });

  // ── the work itself ─────────────────────────────────────────────────
  // The Chess afternoon has its own observable and prints it here; every
  // other archetype has only the tier line, which is already on the brief, so
  // this beat is the afternoon's own account of itself and nothing more.
  const workInner = '<p>' + _pick(WORK_TEXT, key + '|work') + '</p>'
    + (v.tellLines && v.tellLines.length
      ? v.tellLines.map(l => '<p class="mi-say">' + _esc(l) + '</p>').join('')
      : '<p class="mi-say">' + _esc(v.summary) + '</p>');
  push('work', _card('The Afternoon', 'The work', 'spade', workInner),
    null, { kind: 'work' });

  // ── somebody left the line ──────────────────────────────────────────
  if (v.relic) {
    push('break', _card('Somebody Was Not On The Line', 'The break', 'rain',
      '<p>' + _pick(BREAK_TEXT, key + '|break') + '</p>'
      + _relicCard(v.relic)
      + '<p>' + _pick(BREAK_COST, key + '|cost') + '</p>'
      + _sums([['What the hour cost', _money(v.relic.cost), 'wax']])),
    null, { kind: 'break' });
  }

  // ── the extras ──────────────────────────────────────────────────────
  if (v.extras.length) {
    push('extras', _card('Nobody Had To Do Any Of This', 'The extras', 'tally',
      '<p>' + _pick(EXTRA_TEXT, key + '|extra') + '</p>'
      + '<div class="mi-extras">' + v.extras.map(o =>
        '<div class="mi-extra" data-won="' + (o.achieved ? 1 : 0) + '"'
        + ' data-name="' + _esc(o.player) + '">'
        + _av(o.player, 30)
        + '<span class="mi-extra-t">' + _esc(o.line) + '</span>'
        + '<span class="mi-extra-p">'
        + (o.achieved ? '+' + _money(o.bonus) : 'Nothing') + '</span></div>').join('')
      + '</div>'),
    null, { kind: 'extras' });
  }

  // ── the count, and the sting ────────────────────────────────────────
  const pct = v.ceiling > 0
    ? Math.max(0, Math.min(100, Math.round(v.pot / v.ceiling * 100))) : 0;
  const wasPct = v.ceiling > 0
    ? Math.max(0, Math.min(100, Math.round(v.potBefore / v.ceiling * 100))) : 0;
  push('count', _card('Into The Box', 'The count', 'cart',
    '<p>' + _pick(COUNT_TEXT, key + '|count') + '</p>'
    + '<div class="mi-count">'
    + '<div class="mi-count-n" data-earned="' + v.earned + '">+' + _money(v.earned) + '</div>'
    + '<div class="mi-count-of">Earned this afternoon</div>'
    + '</div>'
    + _sums([
      ['Fund before', _money(v.potBefore)],
      ['Fund now', '<span data-pot="' + v.pot + '">' + _money(v.pot) + '</span>', 'gold'],
    ].concat(v.spilled > 0 ? [['Over the ceiling', _money(v.spilled), 'wax']] : []))
    + (v.ceiling > 0
      ? '<div class="mi-bar" data-pct="' + pct + '"><i style="width:' + pct + '%"></i>'
        + '<b style="left:' + wasPct + '%"></b></div>'
        + '<div class="mi-count-of">' + _money(v.pot) + ' of a possible '
        + _money(v.ceiling) + ' &middot; ' + pct + '%</div>'
      : '')
    + (v.spilled > 0 ? '<p>' + _pick(CEILING_HIT, key + '|spill') + '</p>' : '')
    + '<p class="mi-say">' + _pick(STING, key + '|sting') + '</p>'),
  'close', { kind: 'count' });

  return beats;
}

/**
 * ONE RELIC, AND THE THING IT DOES NOT SAY.
 *
 * `r.holder` and `r.searcher` are BOTH null whenever `_view` decided this
 * observer did not witness the award, and `r.lines` is empty for the same
 * reason -- the engine's carry prose names the searcher in its first
 * sentence, and on a found afternoon the searcher IS the holder. An
 * unattributed card therefore has nothing to print rather than something to
 * hide.
 *
 * `data-holder` is emitted only alongside a name, which is what
 * tests/tr-vp.test.js reads. A guard that greps the whole page for the
 * holder's name cannot work here: the holder is on a team roster two cards up
 * for perfectly public reasons, because everybody was out there.
 */
function _relicCard(r) {
  const kindName = r.kind === 'dagger' ? 'Dagger' : 'Shield';
  const named = r.awarded && r.known && r.holder;
  const face = named
    ? '<span class="mi-relic-face">' + _av(r.holder, 46) + '</span>'
    : '<span class="mi-relic-face">'
      + _icon(r.kind === 'dagger' ? 'dagger' : 'shield', 32, 'rgba(185,143,62,.8)') + '</span>';
  let body;
  if (!r.awarded) {
    body = '<div class="mi-relic-k">Nothing came back</div>'
      + '<div class="mi-relic-h">' + _esc(r.searcher || 'Somebody') + '</div>'
      + (r.lines[0] ? '<div class="mi-relic-note">' + _esc(r.lines[0]) + '</div>' : '');
  } else if (named) {
    body = '<div class="mi-relic-k">' + _esc(kindName) + ' &middot; carried off the field</div>'
      + '<div class="mi-relic-h">' + _esc(r.holder) + '</div>'
      + r.lines.map(l => '<div class="mi-relic-note">' + _esc(l) + '</div>').join('');
  } else {
    body = '<div class="mi-relic-k">Something came back</div>'
      + '<div class="mi-relic-h"><em>You did not see who</em></div>'
      + '<div class="mi-relic-note">Somebody left the line, went along on their own and '
      + 'came back up carrying something. You were not one of the people looking the right '
      + 'way, and nobody who was is going to volunteer it.</div>';
  }
  return '<div class="mi-relic" data-kind="' + _esc(r.kind) + '"'
    + ' data-awarded="' + (r.awarded ? 1 : 0) + '"'
    + ' data-known="' + (named ? 1 : 0) + '"'
    + (named ? ' data-holder="' + _esc(r.holder) + '"' : '')
    + '>' + face + '<div>' + body + '</div></div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE TALLY BOARD — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trMission`, because a <script> tag inside innerHTML does
// not execute. Every panel is BLANK until the beat that fills it has been
// read: a board that knows the count on the first click is not a reveal, it
// is a summary with a button under it. The fund panel is the exception in
// spirit rather than in rule -- it shows the fund AS IT STOOD THIS MORNING
// from the first click, and only becomes tonight's figure when the count is
// read, which is what makes it tick up in front of the viewer.

function _chalkPanel(k, val, note, tone, blank, bar) {
  return '<div class="mi-chalk"' + (blank ? ' data-blank="1"' : '')
    + (tone ? ' data-tone="' + tone + '"' : '') + ' data-k="' + _esc(k) + '">'
    + '<span class="mi-chalk-k">' + _esc(k) + '</span>'
    + '<span class="mi-chalk-v">' + (blank ? '&mdash;' : val) + '</span>'
    + (note && !blank ? '<span class="mi-chalk-note">' + _esc(note) + '</span>' : '')
    + (bar != null && !blank
      ? '<span class="mi-chalk-bar"><i style="width:' + bar + '%"></i></span>' : '')
    + '</div>';
}

function _board(state, idx) {
  const v = state.v;
  const seen = new Set(state.stepMeta.slice(0, Math.max(0, idx + 1))
    .filter(Boolean).map(m => m.kind));
  const counted = seen.has('count');
  const fund = counted ? v.pot : v.potBefore;
  const pct = v.ceiling > 0
    ? Math.max(0, Math.min(100, Math.round(fund / v.ceiling * 100))) : 0;
  const hands = v.teams.reduce((s, t) => s + t.members.length, 0);
  const paid = v.extras.filter(o => o.achieved).length;
  return '<div class="mi-board">'
    + _chalkPanel('The fund', _money(fund),
      (v.ceiling > 0 ? pct + '% of the ceiling' : ''), 'gold', false, pct)
    + _chalkPanel('Today', counted ? '+' + _money(v.earned) : '&mdash;',
      counted && v.spilled > 0 ? _moneyPlain(v.spilled) + ' over the ceiling' : '',
      'gold', !counted)
    + _chalkPanel('Out there', String(hands), 'in two teams', null, !seen.has('field'))
    + _chalkPanel('Extras paid', String(paid) + ' of ' + v.extras.length,
      null, null, !seen.has('extras'))
    + (v.relic
      ? _chalkPanel('Off the line', v.relic.awarded ? 'Carrying' : 'Empty-handed',
        v.relic.awarded ? 'somebody came back with something' : 'the hour bought nothing',
        v.relic.awarded ? 'wax' : null, !seen.has('break'))
      : '')
    + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'mission-' + (epNum || 0); }
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
    const el = document.getElementById('mi-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('mi-vis'); else el.classList.remove('mi-vis');
  }
  const counter = document.getElementById('mi-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('mi-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.mi-btn').forEach(b => b.classList.toggle('mi-dim', done));
  }
  const shell = document.getElementById('mi-shell-' + suffix);
  const last = document.getElementById('mi-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase', last.getAttribute('data-phase') || 'brief');
  if (scroller) scroller.scrollTop = top;
}

function _updateBoard(epNum, idx) {
  const el = document.getElementById('mi-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trMission) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _board(state, idx);
}

/** Bring the new card into view, UNDER the tally board rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('mi-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trMissionRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('mi-step-' + suffix + '-' + st.idx));
  _updateBoard(epNum, st.idx);
}

export function trMissionRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateBoard(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildMission(ep, observer)` — the afternoon, and what it paid.
 *
 * `ep` is an `episodeHistory` row carrying `tr.mission`, `tr.pot` and
 * `tr.potCeiling`, written by `_recordEpisode` in js/tr/headless.js.
 * `observer` is `'audience'` or `'player:<Name>'`; see `_view` for exactly
 * what the difference is and where it is applied.
 */
export function rpBuildMission(ep, observer = 'audience') {
  const suffix = 'mission';
  const vars = '--mi-grain-src:' + _noiseTile('0.9', 4, 29, 0.4, 240) + ';';
  const css = '<style>' + MI_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v) {
    return '<div class="mi-root" style="' + vars + '">' + css
      + '<div class="mi-shell" data-phase="brief"><div class="mi-body"><div class="mi-none">'
      + _ic('cart', 92, 'rgba(185,143,62,.4)')
      + '<div class="mi-none-h">Nobody Went Out Today</div>'
      + '<p>No afternoon is recorded on this episode. The estate keeps its money and the '
      + 'castle keeps its hands clean.</p>'
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
    window.__trMission = window.__trMission || {};
    window.__trMission[epNum] = state;
  }

  // THE OBSERVER STRIP CARRIES THE LAYER, and on this screen it is carrying
  // exactly one difference: who came off the line with something.
  const observerBadge = v.isAudience
    ? '<div class="mi-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; the whole afternoon, including who broke away and '
      + 'what they came back with; not one person out there sees it like this</em></div>'
    : '<div class="mi-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; the work, the teams and the money are public; what somebody carried '
      + 'off the field is yours only if you were looking the right way</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED — the Round Table's
  // pattern, and the reason the conclave shipped a screen that was blank
  // until it was clicked.
  const stream = beats.map((b, i) =>
    '<div class="mi-beat' + (i <= st.idx ? ' mi-vis' : '')
    + '" id="mi-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    // THE CLOSING LINE COMES AFTER ITS CARD, and that is a departure from the
    // other four screens, which put every host band above the beat it
    // introduces. It was found by reading the rendered page: the host was
    // saying "and into the box it goes" one card ABOVE the number going into
    // the box. An opening line introduces something; a closing line has to
    // have something to close.
    + (b.hostSlot === 'open'
      ? _hostBand(_esc(_pick(HOST_LINES.open, 'mi|host|open|' + seedEp))) : '')
    + b.html
    + (b.hostSlot === 'close'
      ? _hostBand(_esc(_pick(HOST_LINES.close, 'mi|host|close|' + seedEp))) : '')
    + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';
  const heroPct = v.ceiling > 0
    ? Math.max(0, Math.min(100, Math.round(v.pot / v.ceiling * 100))) : 0;

  return '<div class="mi-root" style="' + vars + '">' + css
    + '<div class="mi-shell" id="mi-shell-' + suffix + '" data-phase="' + beats[0].phase + '">'
    + '<div class="mi-scenery" aria-hidden="true">'
    + '<div class="mi-far">' + _fieldFar() + '</div>'
    + '<div class="mi-mid">' + _fieldMid(epNum + '|' + v.id) + '</div>'
    + '<div class="mi-fore">' + _fieldFore() + '</div>'
    + '<div class="mi-rain">' + _rain(epNum + '|' + v.id) + '</div>'
    + '<div class="mi-wash"></div>'
    + '<div class="mi-vig"></div>'
    + '<div class="mi-grain"></div>'
    + '</div>'
    + '<div class="mi-body">'
    + '<div class="mi-hero">' + _heroCoffer(heroPct)
    + '<div class="mi-hero-lock">'
    // TASK 7: "Day 3" and not "Season I - Day III" — the episode record
    // carries no season number, and the other four screens say so too.
    + '<div class="mi-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; Out On The Estate</div>'
    + '<h1 class="mi-title">THE MISSION</h1>'
    + '<div class="mi-title-rule"><i></i>' + _icon('coffer', 40, '#f4dda2') + '<i></i></div>'
    + '<p class="mi-sub">A wet afternoon, two teams, and a box that gets heavier. Every '
    + 'hour of it is worked by people who have no idea which of them will be alive to '
    + 'open it.</p>'
    + '</div></div>'
    + '<header class="mi-head">' + observerBadge + '</header>'
    // THE BOARD, STUCK UNDER THE NAV. Sticky element AND the element the
    // reveal handlers replace by id.
    + '<div class="mi-stage" id="mi-stage-inner">' + _board(state, st.idx) + '</div>'
    + '<main class="mi-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="mi-controls" id="mi-controls-' + suffix + '">'
    + '<button class="mi-btn" onclick="' + call('trMissionRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="mi-counter" id="mi-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="mi-btn" onclick="' + call('trMissionRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
