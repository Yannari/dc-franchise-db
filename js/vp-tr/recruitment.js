// ══════════════════════════════════════════════════════════════════════
// vp-tr/recruitment.js — the note and the ultimatum, in an empty corridor
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
// NOT SHARED, AND EVERY DEPARTURE IS THE SAME DEPARTURE: this is the only
// scene in the format with TWO PEOPLE IN IT.
//
//   IT IS NARROW, AND THE EMPTINESS IS THE DESIGN. Every other screen fills
//   the 1100px shell -- the hall seats twenty-four, the day book runs 840px
//   of page, the estate has a horizon in it. This one runs a 560px column
//   down the middle of a shell that is otherwise dark and empty on both
//   sides, because the scene is two people in a corridor and everything else
//   in the castle is asleep.
//
//   NOTHING MOVES ON REVEAL. The turret drew its cards out of the dark, the
//   hall leant them in, the morning brought them down a stair, the book wrote
//   them and the estate hauls them in on a rope. A card here FADES UP WHERE
//   IT ALREADY IS and does not travel a pixel. That is the point: nobody in
//   this scene moves, because moving would be heard.
//
//   CARDS TAKE A SIDE. The one who asks is on the left, the one who answers
//   is on the right, and a hairline runs down the gap between them for the
//   whole screen. The gap is what the scene is about, so it is drawn.
//
//   THE HOST IS NOT IN THE ROOM. Four screens open on a host band; this one
//   has exactly one host line and it is the LAST thing on the screen, after
//   the answer, addressed to the audience about a scene the host was not at.
//   Opening on the host would put a third person in a corridor that has two.
//
// AND THE MECHANIC THE WHOLE SCREEN EXISTS TO DRAW (spec 6.6). There are two
// ways to make the offer and they differ MECHANICALLY, not in flavour:
//
//   THE NOTE is anonymous. Refusing it is survivable, because the refuser
//   never learned who asked.
//   THE ULTIMATUM is face to face. Refusing it is fatal, and it is fatal for
//   exactly one reason: they have seen your face.
//
// So the screen must render the two differently, and a refused note must not
// name the recruiter to the person who refused it -- the anonymity IS the
// survivability, and a screen that prints the name has deleted the rule while
// looking identical. `_view` decides that once. See its comment.
import { seasonConfig, players } from '../core.js';
import { exitVerbs } from '../shows.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { PORTRAIT_CSS, TR_NAV_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';
import { ruleReminder } from '../tr-rules.js';

const TR = 'traitors';

/** The show's own words for the two doors. Never written out. */
function _verbs() {
  const [vote, night] = exitVerbs(TR);
  return { vote: vote || 'out', night: night || vote || 'out' };
}
const _cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

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
function _fill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null) ? subs[k] : m);
}

// ── the host ──────────────────────────────────────────────────────────
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
/** A face in the corridor, and it is NEUTRAL -- `.cv-lit` is the turret's. */
function _av(name, size) {
  return _portrait(_slugOf(name), name, size || 34);
}
function _hostAv(size) {
  const h = _host();
  return _portrait(h.slug, h.name, size || 46);
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — the corridor's own objects, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// The seal, the eye, the cloak and the door come from `_icon()` in conclave.js
// and are NOT redrawn: they are the same objects on every screen in this
// directory. These are the ones this scene needs and nowhere else does.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    fold: '<path d="M3 6.6 12 3l9 3.6v11L12 21l-9-3.6z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M3 6.6 12 10.2l9-3.6M12 10.2V21" stroke="' + c + '" stroke-width="1.1" opacity=".7"/>',
    threshold: '<path d="M4.6 21.4V6.2L14.4 2.6v18.8z" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M14.4 21.4h5" stroke="' + c + '" stroke-width="1.3"/>'
      + '<circle cx="12.4" cy="12.2" r="1.1" fill="' + c + '"/>'
      + '<path d="M4.6 18.6h9.8" stroke="' + c + '" stroke-width="1" opacity=".55"/>',
    // A BELL NOBODY RANG. The first drawing had a stem and a base and read
    // unmistakably as a microphone on the rendered page, which is a thing a
    // castle does not contain -- found by looking at it, which is what the
    // look is judged by here.
    hush: '<path d="M10.4 4.2a1.6 1.6 0 0 1 3.2 0" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M6.6 16.6v-5.4a5.4 5.4 0 0 1 10.8 0v5.4" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M4.6 16.6h14.8" stroke="' + c + '" stroke-width="1.4"/>'
      + '<circle cx="12" cy="19.4" r="1.7" stroke="' + c + '" stroke-width="1.3"/>',
    hand: '<path d="M9 21.4c-2.8 0-4.6-2.2-4.6-5V9.6a1.4 1.4 0 0 1 2.8 0v3.2" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M7.2 12.8V4.6a1.4 1.4 0 0 1 2.8 0v7.4" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M10 11.6V5.4a1.4 1.4 0 0 1 2.8 0v6.2" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M12.8 11.8V7.6a1.4 1.4 0 0 1 2.8 0v6.6c0 4-1.8 7.2-5.2 7.2z" stroke="' + c + '" stroke-width="1.3"/>',
    scales: '<path d="M12 3.2v16.4M7.4 20.4h9.2" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M4 7.4h16" stroke="' + c + '" stroke-width="1.4"/>'
      + '<circle cx="12" cy="4.6" r="1.5" fill="' + c + '"/>'
      + '<path d="M1.6 13.4 4 7.6l2.4 5.8a2.4 2.4 0 0 1-4.8 0z" stroke="' + c + '" stroke-width="1.2"/>'
      + '<path d="M17.6 13.4 20 7.6l2.4 5.8a2.4 2.4 0 0 1-4.8 0z" stroke="' + c + '" stroke-width="1.2"/>',
    stair: '<path d="M3 21.4V17h5v-4.4h5V8.2h5V3.6h3" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M3 21.4h18" stroke="' + c + '" stroke-width="1.3" opacity=".6"/>',
    chevron: '<path d="M9 5.4 16 12l-7 6.6" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE CORRIDOR — three planes, and one of them is a rectangle of moonlight
// ══════════════════════════════════════════════════════════════════════
//
// A long stone passage with doors down one side and one window at the far
// end. Nothing in it is lit except that window and the shape it throws on the
// flags. THE ONE THING THAT MOVES IS THE MOONLIGHT, and it breathes rather
// than travels -- a cloud going over, then off again, on a very slow cycle.

/** The far plane: the passage, the doors, the window at the end of it. */
function _corridorFar() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="ntWall" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0c0e14"/><stop offset="60%" stop-color="#080a0f"/>'
    + '<stop offset="100%" stop-color="#04050a"/>'
    + '</linearGradient>'
    + '<radialGradient id="ntMoon" cx="0.5" cy="0.5" r="0.5">'
    + '<stop offset="0%" stop-color="#c8d8ec" stop-opacity=".5"/>'
    + '<stop offset="100%" stop-color="#c8d8ec" stop-opacity="0"/>'
    + '</radialGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#ntWall)"/>'
    // the vanishing passage: walls converging on a lancet window
    + '<path d="M0 0 L470 470 L470 1020 L0 1500z" fill="#0a0c12"/>'
    + '<path d="M1100 0 L630 470 L630 1020 L1100 1500z" fill="#090b11"/>'
    + '<path d="M470 470h160v550H470z" fill="#05060b"/>'
    // the window, and the moon behind it
    + '<path d="M508 590a42 42 0 0 1 84 0v230h-84z" fill="#9fb6d2" opacity=".34"/>'
    + '<path d="M508 590a42 42 0 0 1 84 0v230h-84z" fill="none" stroke="#04050a" stroke-width="9"/>'
    + '<path d="M550 548v272M508 690h84" stroke="#04050a" stroke-width="7"/>'
    + '<ellipse cx="550" cy="700" rx="300" ry="240" fill="url(#ntMoon)"/>'
    + _doorsDownOneSide()
    + '</svg>';
}
/** Doors, receding. One of them is the one the note goes under. */
function _doorsDownOneSide() {
  let s = '<g>';
  const rows = [[86, 250, 700], [214, 336, 560], [318, 404, 452], [398, 456, 372]];
  for (let i = 0; i < rows.length; i++) {
    const x = rows[i][0], top = rows[i][1], h = rows[i][2];
    const w = Math.round(h * 0.34);
    s += '<path d="M' + x + ' ' + (top + h) + 'V' + top + 'a' + Math.round(w / 2) + ' '
      + Math.round(w / 2) + ' 0 0 1 ' + w + ' 0v' + h + 'z" fill="#070810"'
      + ' stroke="#141824" stroke-width="5"/>';
    // the sliver of nothing under each door
    s += '<rect x="' + x + '" y="' + (top + h - 6) + '" width="' + w
      + '" height="6" fill="#04050a"/>';
  }
  return s + '</g>';
}

/** The mid plane: the flagstone floor and the shape the window throws on it. */
function _corridorMid(seed) {
  const rng = _fieldRng('nt|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="ntFlags" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0e1017"/><stop offset="100%" stop-color="#05060a"/>'
    + '</linearGradient></defs>'
    + '<path d="M470 1020 L630 1020 L1100 1500 L0 1500z" fill="url(#ntFlags)"/>';
  // flag joints, receding
  for (let i = 0; i < 9; i++) {
    const t = i / 9;
    const y = 1020 + (1500 - 1020) * (t * t);
    const half = 80 + (550 - 80) * (t * t);
    s += '<path d="M' + (550 - half) + ' ' + y.toFixed(0) + 'H' + (550 + half)
      + '" stroke="#171b26" stroke-width="' + (1.4 + t * 3).toFixed(1) + '" opacity=".7"/>';
  }
  // THE RECTANGLE OF MOONLIGHT. It breathes -- a cloud goes over and comes
  // off again -- and it is the only thing on this screen that changes.
  s += '<path class="nt-moonpatch" d="M486 1046 L616 1046 L724 1330 L370 1330 Z"'
    + ' fill="#b9cde6" opacity=".16"/>'
    + '<path class="nt-moonpatch" d="M512 1046 L520 1046 L556 1330 L510 1330 Z"'
    + ' fill="#04050a" opacity=".5" style="animation-delay:-7s"/>';
  // dust, and there is almost none of it, because nothing has been disturbed
  for (let i = 0; i < 14; i++) {
    s += '<circle class="nt-mote" cx="' + (400 + rng() * 320).toFixed(0) + '" cy="'
      + (1040 + rng() * 300).toFixed(0) + '" r="' + (0.8 + rng() * 1.4).toFixed(1)
      + '" fill="#cfe0f2" opacity="' + (0.1 + rng() * 0.22).toFixed(2)
      + '" style="animation-duration:' + (22 + rng() * 20).toFixed(1)
      + 's;animation-delay:' + (-rng() * 30).toFixed(1) + 's"/>';
  }
  return s + '</svg>';
}

/** The fore plane: the near arch, black, and the edge of the frame. */
function _corridorFore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<path d="M0 0h1100v1500H0z" fill="none"/>'
    + '<path d="M0 0h1100v112c-190 42-360 64-550 64S190 154 0 112z" fill="#020306"/>'
    + '<path d="M0 0h180v1500H0z" fill="#020306" opacity=".94"/>'
    + '<path d="M920 0h180v1500H920z" fill="#020306" opacity=".94"/>'
    + '</svg>';
}

/**
 * The hero plate, and it BRANCHES on the mode, because the two are different
 * events and not two labels on one.
 *
 * A note is an object on the floor. An ultimatum is two people standing much
 * too close together in a passage where there is nowhere to go.
 */
function _heroScene(mode) {
  const open = '<svg class="nt-hero-scene" viewBox="0 0 1100 456" preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="ntHeroBg" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0a0d14"/><stop offset="70%" stop-color="#05070c"/>'
    + '<stop offset="100%" stop-color="#020306"/></linearGradient>'
    + '<linearGradient id="ntHeroGlow" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#9fb6d2" stop-opacity=".26"/>'
    + '<stop offset="70%" stop-color="#9fb6d2" stop-opacity=".05"/>'
    + '<stop offset="100%" stop-color="#9fb6d2" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="ntHeroScrim" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#020306" stop-opacity="0"/>'
    + '<stop offset="100%" stop-color="#020306" stop-opacity=".9"/>'
    + '</linearGradient></defs>'
    + '<rect width="1100" height="456" fill="url(#ntHeroBg)"/>'
    // A SHAFT, NOT A LAMP. A radial glow over near-black rendered as a grey
    // oval floating in the middle of the plate; light coming through
    // something has edges.
    + '<path d="M486 0 L614 0 L700 456 L400 456 Z" fill="url(#ntHeroGlow)"/>'
    + '<path d="M540 0 L560 0 L590 456 L512 456 Z" fill="#020306" opacity=".5"/>';
  if (mode === 'ultimatum') {
    // Two figures, one hooded, one not, far too close. No faces on either --
    // the faces are on the cards, where the observer contract can reach them.
    return open
      + '<path d="M300 456V300c0-56 34-96 84-96s84 40 84 96v156z" fill="#05070c"/>'
      + '<ellipse cx="384" cy="196" rx="46" ry="52" fill="#05070c"/>'
      + '<path d="M338 200c0-42 20-70 46-70s46 28 46 70c0 10-4 18-10 22H348c-6-4-10-12-10-22z" fill="#0b0e16"/>'
      + '<path d="M632 456V308c0-52 32-90 78-90s78 38 78 90v148z" fill="#070a11"/>'
      + '<ellipse cx="710" cy="214" rx="42" ry="48" fill="#070a11"/>'
      + '<path d="M470 456V150h6v306z" fill="#9fb6d2" opacity=".12"/>'
      + '<path d="M620 456V150h6v306z" fill="#9fb6d2" opacity=".08"/>'
      // the scrim the lockup sits on, so the sentence reads over the figures
      + '<rect y="150" width="1100" height="306" fill="url(#ntHeroScrim)"/>'
      + '</svg>';
  }
  // A folded sheet on the flags, half under a door, with a wax bead on it.
  //
  // OFF TO THE LEFT, NOT DEAD CENTRE. The first draft put the sheet in the
  // middle of the plate at the height the subtitle sits, so the note was
  // printed straight through the sentence explaining what a note is -- found
  // by rendering it and looking. The door and the sheet now live in the left
  // third, where the centred lockup is not, and a scrim keeps the sentence
  // legible over whatever is behind it.
  return open
    + '<path d="M0 330h1100v126H0z" fill="#070910"/>'
    + '<path d="M0 330h1100v5H0z" fill="#1a1f2c"/>'
    // Shifted left again: at the first position the corner of the sheet still
    // touched the first letter of the sentence underneath it.
    + '<g transform="translate(-58,12)">'
    + '<path d="M118 176h246v154H118z" fill="#03040a"/>'
    + '<path d="M118 176h246v154H118z" fill="none" stroke="#141824" stroke-width="6"/>'
    + '<path d="M118 322h246v8H118z" fill="#0d1119"/>'
    + '<circle cx="336" cy="266" r="7" fill="#1e2534"/>'
    + '<g transform="rotate(-7 246 394)">'
    + '<path d="M162 368h168v52H162z" fill="#ded3b4"/>'
    + '<path d="M162 368h168v52H162z" fill="none" stroke="#a2957a" stroke-width="2"/>'
    + '<path d="M162 368 246 402 330 368" fill="none" stroke="#a2957a" stroke-width="2" opacity=".8"/>'
    + '<circle cx="246" cy="400" r="10" fill="#8e1526"/>'
    + '<circle cx="242" cy="396" r="3.6" fill="#c8455a" opacity=".7"/>'
    + '</g>'
    + '<path d="M164 420h166v9H164z" fill="#020306" opacity=".6"/>'
    + '</g>'
    // the scrim the lockup sits on
    + '<rect y="150" width="1100" height="306" fill="url(#ntHeroScrim)"/>'
    + '</svg>';
}

/** The filter bank. */
function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="ntFold" x="-4%" y="-4%" width="108%" height="108%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.03 0.06" numOctaves="3" seed="11" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '</defs></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VISUAL SYSTEM — a narrow column, a hairline, and nothing moving
// ══════════════════════════════════════════════════════════════════════
const NT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.nt-root{
  --nt-stone:#080a10;
  --nt-stone-2:#03040a;
  --nt-moon:#b9cde6;
  --nt-vellum:#ded3b4;
  --nt-brass:#b98f3e;
  --nt-brass-hot:#f4dda2;
  --nt-wax:#8e1526;
  --nt-wax-hot:#c8455a;
  --nt-display:'Fraunces',Georgia,'Times New Roman',serif;
  --nt-hand:'IM Fell English',Georgia,serif;
  --nt-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --cv-display:'Fraunces',Georgia,serif;
  color:#dbe3ee;
  font-family:var(--nt-body);
  font-size:17px;line-height:1.62;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#000;
}
.nt-root *{box-sizing:border-box}

.nt-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--nt-stone);
  box-shadow:0 0 0 1px rgba(159,182,210,.1),0 0 90px rgba(0,0,0,.94);
  overflow:visible;
  transition:background 1.6s ease;
}
/* THE CLIP LAYER, AND IT TAKES NO z-index. Measured on the conclave: a shell
   that clips is a scroll container and kills sticky for every descendant, and
   a z-index here would make this a stacking context and silently re-grade
   every blend on the screen. */
.nt-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

.nt-far,.nt-mid,.nt-fore{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};height:1500px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.nt-wash,.nt-vig,.nt-grain{position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;pointer-events:none}
.nt-far svg,.nt-mid svg,.nt-fore svg{position:absolute;inset:0;width:100%;height:100%}
.nt-far {z-index:0;filter:blur(2.2px) saturate(.6) brightness(.9);opacity:.8}
.nt-mid {z-index:1;filter:blur(.3px);opacity:.95}
.nt-fore{z-index:2}
.nt-wash{z-index:3}
.nt-vig {z-index:4}
.nt-grain{z-index:9}
.nt-body{position:relative;z-index:5}
.nt-far::after,.nt-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:400px;
  background:linear-gradient(180deg,transparent,var(--nt-stone));
}
.nt-wash{
  mix-blend-mode:screen;opacity:.5;
  background:radial-gradient(46% 26% at 50% 24%,rgba(159,182,210,.2) 0%,transparent 64%);
}
.nt-vig{
  background:
    radial-gradient(110% 76% at 50% 26%,transparent 0%,transparent 26%,rgba(1,2,4,.66) 66%,rgba(1,2,4,.98) 100%),
    linear-gradient(180deg,rgba(1,2,4,.6) 0%,transparent 12%,transparent 82%,rgba(1,2,4,.9) 100%);
  mix-blend-mode:multiply;
}
.nt-grain{
  opacity:.11;mix-blend-mode:soft-light;
  background-image:var(--nt-grain-src);background-size:210px 210px;
}

/* ── AMBIENT — a cloud goes over, and almost nothing else happens ───── */
.nt-moonpatch{animation:nt-breathe 34s ease-in-out infinite alternate;
  transform-box:fill-box;transform-origin:50% 100%}
@keyframes nt-breathe{
  0%{opacity:.06}
  38%{opacity:.2}
  100%{opacity:.1}
}
.nt-mote{animation:nt-drift ease-in-out infinite alternate}
@keyframes nt-drift{
  0%{transform:translate(0,0);opacity:.1}
  100%{transform:translate(9px,-14px);opacity:.3}
}

/* ── PHASE ATMOSPHERE — the corridor gets colder as the answer nears ── */
.nt-shell[data-phase="approach"]{background:#080a10}
.nt-shell[data-phase="asker"]{background:#070910}
.nt-shell[data-phase="ask"]{background:#090b12}
.nt-shell[data-phase="ask"] .nt-wash{opacity:.7}
.nt-shell[data-phase="weigh"]{background:#06080e}
.nt-shell[data-phase="weigh"] .nt-wash{opacity:.35}
.nt-shell[data-phase="answer"]{background:#0b0810}
.nt-shell[data-phase="answer"] .nt-wash{opacity:.9;
  background:radial-gradient(52% 28% at 50% 20%,rgba(200,69,90,.2) 0%,transparent 62%)}
.nt-shell[data-phase="after"]{background:#050609}
.nt-shell[data-phase="after"] .nt-wash{opacity:.4}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.nt-hero{
  position:relative;height:456px;overflow:hidden;
  background:#020306;border-bottom:1px solid rgba(159,182,210,.16);
}
.nt-hero svg.nt-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.nt-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
.nt-eyebrow{
  font-family:var(--nt-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:rgba(219,227,238,.78);
  text-shadow:0 2px 12px rgba(0,0,0,.95);margin-bottom:2px;
}
/* THE LOCKUP. The same one all four earlier screens use: Fraunces 900
   squeezed to .80 with a 1.3px stroke. Six screens, one logo. */
.nt-title{
  display:inline-block;
  font-family:var(--nt-display);font-weight:900;
  font-size:clamp(32px,5.6vw,66px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:#e9eef6;margin:10px 0 0;
  text-shadow:0 4px 34px rgba(0,0,0,.95);
}
.nt-title-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 10px}
.nt-title-rule i{display:block;height:1px;width:96px;
  background:linear-gradient(90deg,transparent,rgba(219,227,238,.44))}
.nt-title-rule i:last-child{background:linear-gradient(270deg,transparent,rgba(219,227,238,.44))}
.nt-sub{
  font-family:var(--nt-hand);font-style:italic;font-size:18px;line-height:1.55;
  color:rgba(219,227,238,.82);max-width:560px;margin:0 auto;
  text-shadow:0 2px 14px rgba(0,0,0,.95);
}

/* ── OBSERVER STRIP ─────────────────────────────────────────────────── */
.nt-head{padding:16px 34px;border-bottom:1px solid rgba(159,182,210,.14);
  background:linear-gradient(180deg,rgba(2,3,6,.74),transparent)}
.nt-observer{
  display:flex;align-items:center;gap:10px;
  font-family:var(--nt-display);font-weight:600;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(219,227,238,.72);
}
.nt-observer em{font-family:var(--nt-body);font-style:italic;font-size:14px;
  letter-spacing:0;text-transform:none;color:rgba(219,227,238,.48)}

/* ═══ THE TERMS — the sticky stage, and it is the MECHANIC written out ═══
   Not a rack, not a board, not a ring: four flat facts about what kind of
   conversation this is. The third of them is the whole of spec 6.6 -- what
   happens if the answer is no -- and it is visible before the answer is. */
.nt-stage{position:sticky;top:${TR_NAV_TOP};z-index:12;
  background:rgba(2,3,6,.97);
  border-bottom:1px solid rgba(159,182,210,.2);
  padding:12px 22px 14px;backdrop-filter:blur(6px)}
.nt-terms{display:flex;flex-wrap:wrap;gap:10px}
.nt-term{
  flex:1 1 140px;position:relative;padding:9px 13px 10px;
  border:1px solid rgba(159,182,210,.2);background:rgba(12,16,24,.8);
}
.nt-term[data-blank="1"]{filter:saturate(.15) brightness(.55)}
.nt-term[data-tone="wax"]{border-color:rgba(200,69,90,.5);background:rgba(30,8,14,.7)}
.nt-term-k{
  display:block;font-family:var(--nt-display);font-weight:700;font-size:8.5px;
  letter-spacing:.3em;text-transform:uppercase;color:rgba(219,227,238,.5);
}
.nt-term-v{
  display:block;font-family:var(--nt-display);font-weight:900;font-size:19px;
  line-height:1.18;color:#e9eef6;margin-top:3px;
}
.nt-term[data-tone="wax"] .nt-term-v{color:var(--nt-wax-hot)}
.nt-term[data-tone="moon"] .nt-term-v{color:var(--nt-moon)}
.nt-term-note{display:block;font-family:var(--nt-body);font-style:italic;font-size:12px;
  color:rgba(219,227,238,.44);margin-top:1px}

/* ═══ THE PASSAGE — narrow, and the gap down the middle is drawn ═══════ */
.nt-main{
  position:relative;padding:34px 34px 90px;max-width:760px;margin:0 auto;
}
/* THE GAP BETWEEN THEM, AS A LINE. It runs the whole height of the column
   and it is the only piece of furniture on this screen. */
.nt-main::before{
  content:'';position:absolute;left:50%;top:0;bottom:60px;width:1px;
  background:linear-gradient(180deg,transparent,rgba(159,182,210,.26) 12%,
    rgba(159,182,210,.26) 88%,transparent);
}

.nt-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.nt-beat.nt-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:24px}

/* NOTHING TRAVELS. Every other screen in this set moves its cards -- drawn
   out of the dark, leant in, brought down a stair, written, hauled on a rope.
   A card here appears exactly where it already was, because nobody in this
   scene moves: moving would be heard. */
.nt-beat.nt-vis .nt-card{animation:nt-hold .9s ease both}
@keyframes nt-hold{
  0%{opacity:0;filter:blur(5px)}
  60%{opacity:1;filter:blur(1px)}
  100%{opacity:1;filter:none}
}

.nt-card{
  position:relative;
  background:linear-gradient(172deg,rgba(16,20,29,.94),rgba(6,8,13,.96));
  border:1px solid rgba(159,182,210,.2);
  padding:20px 24px 22px;
  box-shadow:0 20px 50px rgba(0,0,0,.7);
  max-width:64%;
}
/* WHICH SIDE OF THE GAP. The one who asks stands left, the one who answers
   stands right, and the two cards that belong to the room itself take the
   whole width. */
.nt-card[data-side="ask"]{margin-right:auto;border-left:2px solid rgba(200,69,90,.5)}
.nt-card[data-side="answer"]{margin-left:auto;border-right:2px solid rgba(159,182,210,.44)}
.nt-card[data-side="both"]{max-width:100%;margin:0 auto}
.nt-label{
  display:flex;align-items:center;gap:9px;
  font-family:var(--nt-display);font-weight:700;font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(159,182,210,.72);margin-bottom:8px;
}
.nt-card[data-side="answer"] .nt-label{justify-content:flex-end}
.nt-h{
  font-family:var(--nt-display);font-weight:900;font-size:23px;line-height:1.16;
  letter-spacing:-.014em;color:#e9eef6;margin:0 0 11px;
}
.nt-card[data-side="answer"] .nt-h,
.nt-card[data-side="answer"] p{text-align:right}
.nt-card p{margin:0 0 10px;color:rgba(219,227,238,.82)}
.nt-card p:last-child{margin-bottom:0}
.nt-say{font-family:var(--nt-hand);font-style:italic;font-size:19px;line-height:1.55;
  color:rgba(232,238,246,.94)}

/* the two people, as faces on their own side of the line */
.nt-who{display:flex;align-items:center;gap:14px;margin:12px 0 4px}
.nt-card[data-side="answer"] .nt-who{flex-direction:row-reverse}
.nt-who-nm{font-family:var(--nt-display);font-weight:900;font-size:21px;color:#e9eef6}
.nt-who-nm em{font-family:var(--nt-body);font-style:italic;font-weight:400;font-size:19px;
  color:rgba(219,227,238,.6)}
.nt-who-sub{font-family:var(--nt-body);font-style:italic;font-size:15px;
  color:rgba(219,227,238,.55);margin-top:2px}

/* THE ANONYMOUS ASKER. A hood with nothing in it -- not a blanked portrait,
   a different drawing, because there is no face to blank. */
.nt-hood{
  width:54px;height:54px;flex:none;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(200,69,90,.4);background:rgba(10,6,10,.9);
}

/* the note itself, when there is one to read */
.nt-vellum{
  position:relative;margin:14px 0 6px;padding:20px 22px;
  background:linear-gradient(174deg,#ded3b4,#c6ba97);
  color:#2a2314;
  box-shadow:0 14px 34px rgba(0,0,0,.66);
}
.nt-vellum p{color:rgba(42,35,20,.9);font-family:var(--nt-hand);font-style:italic;
  font-size:19px;line-height:1.5;text-align:left}
.nt-vellum-seal{position:absolute;right:16px;bottom:12px;opacity:.9}

/* THE RULE, under the note that does not state it. Upright and lettered
   against the vellum's handwriting: the paper is a character speaking and
   this is the format speaking, and they must not look like the same voice. */
.nt-rule{font-size:13px;letter-spacing:.03em;line-height:1.55;
  color:rgba(159,182,210,.78);text-align:left;margin:12px 0 2px;
  padding:9px 13px;border-left:2px solid rgba(142,21,38,.6);
  background:rgba(142,21,38,.08);border-radius:2px}

/* the answer, and it is the only loud thing on the screen */
.nt-verdict{
  margin:14px 0 4px;padding:18px 20px;border:1px solid rgba(159,182,210,.34);
  background:rgba(6,9,14,.7);
}
.nt-verdict[data-answer="yes"]{border-color:rgba(200,69,90,.6);
  background:linear-gradient(150deg,rgba(142,21,38,.26),rgba(6,9,14,.7))}
.nt-verdict-w{font-family:var(--nt-display);font-weight:900;
  font-size:clamp(28px,5vw,46px);line-height:1;letter-spacing:-.02em;color:#e9eef6}
.nt-verdict[data-answer="yes"] .nt-verdict-w{color:var(--nt-wax-hot)}
.nt-verdict-s{font-family:var(--nt-display);font-weight:700;font-size:10px;
  letter-spacing:.28em;text-transform:uppercase;color:rgba(219,227,238,.6);margin-top:8px}

.nt-sums{display:flex;flex-wrap:wrap;gap:10px 26px;margin:13px 0 2px;padding:12px 0 0;
  border-top:1px solid rgba(159,182,210,.18)}
.nt-sum{display:inline-flex;align-items:baseline;gap:9px}
.nt-sum-k{font-family:var(--nt-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(219,227,238,.5)}
.nt-sum-v{font-family:var(--nt-display);font-weight:900;font-size:20px;color:#e9eef6}
.nt-sum-v[data-tone="wax"]{color:var(--nt-wax-hot)}

/* ── HOST BAND — one, at the very end, and the host was not in the corridor ── */
.nt-host{
  position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:16px 24px;margin-top:18px;
  background:linear-gradient(100deg,rgba(2,3,6,.96),rgba(40,32,16,.8) 52%,rgba(2,3,6,.96));
  border-top:1px solid rgba(185,143,62,.42);border-bottom:1px solid rgba(185,143,62,.42);
  box-shadow:inset 0 0 40px -8px rgba(244,221,162,.14),0 12px 30px rgba(0,0,0,.6);
}
.nt-host-name{
  font-family:var(--nt-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--nt-brass-hot);margin-bottom:6px;
  display:flex;align-items:center;gap:8px;
}
.nt-host-line{font-family:var(--nt-hand);font-style:italic;font-size:19px;line-height:1.5;
  color:#f2e2bb}

/* ── STICKY CONTROLS ────────────────────────────────────────────────── */
.nt-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(2,3,6,.1),rgba(2,3,6,.98) 44%);
  border-top:1px solid rgba(159,182,210,.2);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.nt-btn{
  font-family:var(--nt-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(159,182,210,.16),rgba(159,182,210,.03));
  color:#dbe3ee;
  border:1px solid rgba(159,182,210,.38);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(219,227,238,.14);
}
.nt-btn:hover{background:rgba(159,182,210,.26);color:#fff;
  box-shadow:0 0 26px rgba(159,182,210,.22),inset 0 1px 0 rgba(219,227,238,.26)}
.nt-btn[disabled],.nt-btn.nt-dim{opacity:.3;cursor:default;pointer-events:none}
.nt-counter{
  font-family:var(--nt-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:rgba(219,227,238,.44);min-width:86px;text-align:center;
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
.nt-none{max-width:600px;margin:0 auto;padding:64px 34px 90px;text-align:center}
.nt-none-h{font-family:var(--nt-display);font-weight:900;font-size:30px;letter-spacing:-.01em;
  color:#e9eef6;margin:22px 0 16px}
.nt-none p{font-family:var(--nt-hand);font-size:19px;line-height:1.65;
  color:rgba(219,227,238,.68);margin:0 auto 14px;max-width:500px}

/* ── RESPONSIVE ─────────────────────────────────────────────────────── */
@media(max-height:720px){.nt-stage{position:static}}
@media(max-width:900px){
  .nt-stage{position:static}
  .nt-hero{height:380px}
}
@media(max-width:700px){
  .nt-main{padding:26px 18px 60px}
  .nt-main::before{display:none}
  .nt-card{max-width:100%}
  .nt-card[data-side="answer"] .nt-h,
  .nt-card[data-side="answer"] p{text-align:left}
  .nt-card[data-side="answer"] .nt-who{flex-direction:row}
  .nt-card[data-side="answer"] .nt-label{justify-content:flex-start}
  .nt-head{padding:14px 20px}
  .nt-hero{height:320px}
  .nt-hero-lock{padding:0 20px 22px}
  .nt-host{grid-template-columns:1fr;gap:10px}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .nt-root *,.nt-root *::before,.nt-root *::after{animation:none!important;transition:none!important}
  .nt-beat.nt-vis .nt-card{opacity:1;filter:none}
  .nt-moonpatch{opacity:.14}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════
//
// EVERY POOL BELOW IS SPLIT BY MODE, and that is the discipline this screen
// needs most: a note and an ultimatum are different events, and a shared pool
// with a name swapped into it is exactly how "they had seen that face" ends up
// printed over an anonymous sheet of paper pushed under a door. The pools
// cannot contradict the record because the record chooses which pool exists.

const APPROACH = {
  note: [
    'It came under the door some time after the castle had gone quiet. No knock, no '
    + 'footsteps going away, nothing to look up at. Just the corner of a folded sheet '
    + 'appearing on the flags where there had not been one.',
    'Whoever left it did not wait. It was on the floor inside the door by the time it was '
    + 'noticed, and the passage outside was empty in both directions.',
    'A sheet of paper, folded twice, pushed through the gap under a door in a corridor '
    + 'where nobody was walking. That is the whole of the approach.',
    'No conversation. A fold of vellum arriving in a dark room from a corridor with nobody '
    + 'in it.',
  ],
  ultimatum: [
    'This one arrived in person. A hand on an arm in a passage with a window at one end and '
    + 'nowhere at the other, and no possibility at all of pretending it had not happened.',
    'They were stopped in the corridor. Not led anywhere, not taken aside — stopped, where '
    + 'they stood, by somebody standing much too close.',
    'It was said out loud, face to face, in a passage where a raised voice would have '
    + 'carried to four bedrooms. Neither of them raised a voice.',
    'There was no paper and no distance. Somebody came and stood in front of them and made '
    + 'the offer with their own mouth.',
  ],
};

const ASKER_KNOWN = {
  note: [
    'The hand that wrote it belongs to {who}, which is a fact the audience is being given '
    + 'and the castle is not.',
    'It was {who}. Nobody in the building could tell you that, and nobody in the building '
    + 'is going to be told.',
    '{who} folded it, walked it down, pushed it through and walked away. The whole errand '
    + 'took under a minute.',
    'The author is {who} — and the entire value of a note is that this sentence exists '
    + 'nowhere inside the castle.',
  ],
  ultimatum: [
    'It is {who}, standing close enough to be recognised, which is exactly the risk being '
    + 'taken and exactly the pressure being applied.',
    '{who} did not hide. There was no way to make this offer in person and hide, and that '
    + 'is the whole reason it works.',
    '{who}, in the open, with nothing between them. The offer and the threat are the same '
    + 'gesture.',
    'The face is {who}. Once it has been seen it cannot be unseen, and both of them know '
    + 'what that means before a word is said.',
  ],
};

const ASKER_HIDDEN = [
  'You do not know. The sheet carries no name, no hand you recognise and no way back to '
  + 'whoever folded it — and that is not a gap in the record, it is the point of a note.',
  'There is nothing to look at. No face, no voice, no footsteps. Somebody in this castle '
  + 'wrote it and you could stand next to them at breakfast and not know.',
  'Anonymous, completely. Whoever it was took care to be nothing but a fold of paper, and '
  + 'they succeeded.',
  'No name on it and no name available. That is the bargain a note makes: it asks less '
  + 'convincingly, and it costs nothing to say no to.',
];

// ── what was offered, AND WHAT THIS POOL IS NOW FOR ───────────────────
//
// These eight lines used to state the RULES of the offer -- "Refusing is fatal
// because they have seen and can identify the recruiter", "Accepting means
// helping choose future murder victims" -- in the flat register of a manual,
// while the ASKER pool directly above was doing real writing about the very
// same moment.
//
// The rules are now said properly and once, by js/tr-rules.js, in the reminder
// printed directly beneath this card: a viewer meeting their first recruitment
// is told what a note is and what an ultimatum costs. That frees this pool to
// do what a screen is for, which is the moment rather than the mechanic. Two
// copies of the rules stacked on one card would have been worse than the flat
// version it replaces.
const ASK = {
  note: [
    'Somebody is asking {who} to change sides, in writing, from behind a door they '
    + 'were careful not to be standing at.',
    'It is an invitation to stop being one of the people downstairs and start being '
    + 'one of the people the downstairs is afraid of.',
    'The paper asks for a defection and offers a share of the money, and does both '
    + 'in fewer words than anybody would use out loud.',
    'The offer is the turret: the stair, the meetings, and a hand in who does not '
    + 'come down to breakfast.',
  ],
  ultimatum: [
    'The offer and the threat arrive in the same breath, from somebody standing close '
    + 'enough to be recognised.',
    'It is put simply, because there is no version of this that takes long: come up '
    + 'the stair, or do not come down to breakfast.',
    'There is no paper to burn and no door to shut. The offer is a person, and the '
    + 'person is not leaving without an answer.',
    'One night, one Traitor, and no safe way to make this offer. So it is made '
    + 'unsafely, and the risk is loaded onto {who} instead.',
  ],
};

const WEIGH = [
  'There is nobody to ask. Every person who could be consulted about this is a '
  + 'person it cannot be mentioned to.',
  'The whole decision happens in a corridor, in the time it takes to be missed, and '
  + 'there is no version where thinking about it longer helps.',
  'A pause. Not a long one — a long one would be an answer on its own.',
  'Whatever gets decided in the next few seconds is the rest of somebody&rsquo;s '
  + 'season, and it gets decided standing up.',
];

const ANSWER = {
  yes: [
    'They said yes.',
    'They accepted the offer.',
    'They said yes, and did not take long about it.',
    'The answer was yes, which is how most of these end and never feels that way at the time.',
  ],
  no: [
    'They said no.',
    'They refused.',
    'The answer was no, flatly, with nothing hedged in it.',
    'They turned it down.',
  ],
};

const AFTER = {
  acceptedNote: [
    'So {who} goes upstairs tonight, and everything they said downstairs last week is now a '
    + 'different sentence. Nobody in the castle knows to reread it.',
    '{who} climbs the stair. The room they left this morning will spend the rest of the '
    + 'season arguing about people who are no longer the problem.',
    'A Faithful walked into that corridor and somebody else walked out of it. The building '
    + 'is not told, and will not work it out from anything said before tonight.',
    '{who} is on the other side of it now, holding every conversation they have ever had '
    + 'down here as material.',
  ],
  acceptedUltimatum: [
    '{who} says yes and lives, and the two of them now hold the same secret from '
    + 'opposite ends of how willingly they took it.',
    'So it worked, and it worked because it had to. {who} goes up the stair holding '
    + 'a face nobody else in the castle can name.',
    '{who} accepts. It is not quite the same as being recruited — being recruited '
    + 'is a choice, and this was arithmetic.',
    '{who} is upstairs tonight. Every person who trusted {who} this morning is going '
    + 'to carry on doing it, which is precisely what the pact just bought.',
  ],
  refusedNote: [
    'And that is the end of it, because there is nothing to end. {who} never saw a face, '
    + 'never heard a voice, and cannot describe the person who asked to anybody at the '
    + 'table tomorrow. The paper goes on the fire and the castle carries on.',
    'Nothing happens. Nothing CAN happen — a note is a question asked from behind a door, '
    + 'and a question asked from behind a door can be ignored. {who} walks away from it '
    + 'knowing exactly as much as before.',
    'No consequence, and that is the design. The pact spent a night asking instead of '
    + 'killing and got nothing for it, and {who} is alive because paper cannot be '
    + 'recognised in a corridor.',
    '{who} refuses and survives refusing, which is the entire difference between the two '
    + 'ways of asking. There is no face to report and no name to give.',
  ],
  refusedUltimatum: [
    'And that is why the face matters. {who} refused somebody they could describe, in a '
    + 'passage with nobody else in it, and there was only ever one way that could end.',
    'A refusal to a face is a witness. {who} could have named somebody at the table '
    + 'tomorrow, and the pact does not survive that, so {who} does not survive tonight.',
    'They had seen the face. That is the whole of it — the offer was fatal to refuse from '
    + 'the moment it was made in person, and {who} refused it.',
    'It was never a negotiation. Somebody stood in front of {who} without a hood on and '
    + 'asked, and no is not an answer that can be allowed to walk away.',
  ],
};

const HOST_CLOSE = {
  acceptedNote: [
    'Somebody read a letter tonight and decided to become a different person. Nobody else '
    + 'in that building has the faintest idea.',
    'A piece of paper went under a door and the whole shape of this season changed. '
    + 'Marvellous.',
  ],
  acceptedUltimatum: [
    'One of them made an offer they could not take back and the other took it. They will be '
    + 'sharing a turret and a great deal of resentment.',
    'Recruited at close range. I would not call it a friendship.',
  ],
  refusedNote: [
    'And nothing happens, which almost never happens here. A wasted night for the people '
    + 'upstairs and a very lucky one for somebody who will never know it.',
    'No, said to nobody in particular. A night the castle spent entirely safely without '
    + 'ever finding out it was in danger.',
  ],
  refusedUltimatum: [
    'That is what it costs to say no to somebody standing in front of you. Nobody downstairs '
    + 'will ever be told why.',
    'A refusal, and the only possible consequence of it. The castle will find out at '
    + 'breakfast that somebody is missing and will spend the day guessing wrongly.',
  ],
};

// ══════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function _card(side, title, label, ic, inner) {
  return '<div class="nt-card" data-side="' + side + '">'
    + '<div class="nt-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="nt-h">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _hostBand(line) {
  return '<div class="nt-host">' + _hostAv(52)
    + '<div><div class="nt-host-name">' + _ic('hush', 12) + _esc(_host().name) + '</div>'
    + '<div class="nt-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}
function _sums(bits) {
  return '<div class="nt-sums">' + bits.map(b =>
    '<span class="nt-sum"><span class="nt-sum-k">' + _esc(b[0]) + '</span>'
    + '<span class="nt-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>' + b[1]
    + '</span></span>').join('') + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the two hard rules, in one place
// ══════════════════════════════════════════════════════════════════════

/**
 * THE OFFER, AND WHAT THIS OBSERVER MAY BE TOLD ABOUT IT.
 *
 * WHO WAS EVEN THERE. Two people, in a corridor, at night. Everybody else in
 * the castle was asleep, so a player observer who is neither of them gets an
 * empty screen -- not a redacted one. This is the only screen in the set with
 * a whole layer that renders nothing, and it renders nothing because nothing
 * is what that person saw.
 *
 * WHETHER THE ASKER HAS A NAME, WHICH IS THE MECHANIC (spec 6.6).
 *
 *   The AUDIENCE is always told. It watches the conclave; there is nothing to
 *   keep from it here.
 *   The RECRUITER obviously knows who they are.
 *   The TARGET learns the name in exactly two cases: the offer was made FACE
 *   TO FACE, or they ACCEPTED it and are standing in the turret tonight --
 *   which is the engine's own rule, `offerRecruitment` writes the alignment
 *   fact into both players' knowledge on an acceptance and into neither on a
 *   refusal.
 *
 * SO A REFUSED NOTE NAMES NOBODY TO THE PERSON WHO REFUSED IT, and that is
 * not a styling choice: the anonymity IS the survivability. If the refuser
 * could name the author, the note would be exactly as fatal to refuse as the
 * ultimatum and the format would have one delivery mode instead of two. The
 * name is withheld by NEVER REACHING the branch that renders it -- `recruiter`
 * is null on the view -- so a later edit to the card cannot leak it.
 */
function _view(ep, observer) {
  const r = ep && ep.tr && ep.tr.recruitment;
  if (!r || !r.target) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const mode = r.mode === 'ultimatum' ? 'ultimatum' : 'note';
  const accepted = !!r.accepted;

  const present = isAudience || watcher === r.target || watcher === r.recruiter;
  const known = isAudience
    || watcher === r.recruiter
    || (watcher === r.target && (mode === 'ultimatum' || accepted));

  return {
    ep: ep.tr.ep != null ? ep.tr.ep : (ep.num || 0),
    isAudience,
    watcher,
    present,
    mode,
    accepted,
    target: r.target,
    // NOT PRESENT AT ALL where this observer never learned it.
    recruiter: known ? (r.recruiter || null) : null,
    recruiterKnown: known && !!r.recruiter,
    executed: r.executed || null,
    doors: _verbs(),
    // The two facts the sticky terms strip states BEFORE the answer is read,
    // because they are the mechanic and the mechanic is not a spoiler.
    anonymous: mode === 'note',
    fatalToRefuse: mode === 'ultimatum',
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

function _buildBeats(v) {
  const beats = [];
  const key = 'nt|' + v.ep + '|' + v.target + '|' + v.mode;
  const push = (phase, side, html, meta) =>
    beats.push({ phase, side, html, meta: meta || null });

  // ── how it arrived ──────────────────────────────────────────────────
  push('approach', 'ask', _card('ask', v.mode === 'note' ? 'Under The Door' : 'In The Passage',
    v.mode === 'note' ? 'The delivery' : 'The approach',
    v.mode === 'note' ? 'threshold' : 'hand',
    '<p>' + _pick(APPROACH[v.mode], key + '|approach') + '</p>'),
  { kind: 'approach' });

  // ── who is asking, and whether that is a question with an answer ─────
  const askerInner = v.recruiterKnown
    ? '<div class="nt-who">' + _av(v.recruiter, 54)
      + '<div><div class="nt-who-nm">' + _esc(v.recruiter) + '</div>'
      + '<div class="nt-who-sub">' + (v.mode === 'ultimatum'
        ? 'Seen, and therefore describable.' : 'Not seen by anybody in the castle.')
      + '</div></div></div>'
      + '<p>' + _esc(_fill(_pick(ASKER_KNOWN[v.mode], key + '|asker'),
        { who: v.recruiter })) + '</p>'
    : '<div class="nt-who"><span class="nt-hood">'
      + _icon('cloak', 32, 'rgba(200,69,90,.7)') + '</span>'
      + '<div><div class="nt-who-nm"><em>No name on it</em></div>'
      + '<div class="nt-who-sub">Anonymous, and permanently so.</div></div></div>'
      + '<p>' + _pick(ASKER_HIDDEN, key + '|hidden') + '</p>';
  push('asker', 'ask', _card('ask', 'The One Who Asked', 'The hand', 'fold', askerInner),
    { kind: 'asker' });

  // ── the offer itself ────────────────────────────────────────────────
  push('ask', 'both', _card('both', 'What Was Offered', 'The offer', 'stair',
    // `{who}` HAS TO BE FILLED. One line in the `note` pool names the person
    // being asked and `_pick` alone leaves the brace in the copy — it shipped
    // that way and only surfaced when a stream shift drew that variant, which
    // is the whole reason tests/tr-vp.test.js scans a full seeded transcript
    // for raw placeholders rather than trusting any single rendering.
    '<p>' + _pick(ASK[v.mode], key + '|ask').split('{who}').join(_esc(v.target || 'them'))
    + '</p>'
    + '<div class="nt-vellum"><p>' + (v.mode === 'note'
      ? 'You are being offered the chance to become a Traitor. If you accept, come to the turret tonight and join us. Destroy this note.'
      : 'I am a Traitor. You must become a Traitor and join us in the turret. If you refuse, you will not return to breakfast.')
    + '</p><span class="nt-vellum-seal">' + _icon('seal', 30, '#8e1526') + '</span></div>'
    // WHAT KIND OF OFFER THIS IS, as a rule and not as atmosphere.
    //
    // Recruitment is a SURPRISE rule: the premiere briefing deliberately never
    // mentions it, because a cast told on day one that Traitors may recruit
    // spends the whole season watching for it and the show has given that away
    // for nothing (js/tr/rules.js explains the split). The consequence is that
    // this screen is the first and only place a viewer can be told, and until
    // now it told them by implication -- the note's own wording -- which does
    // not say the thing that actually matters, which is that refusing a NOTE
    // is survivable and refusing an ULTIMATUM is not.
    + '<p class="nt-rule">' + _esc(ruleReminder(
      v.mode === 'ultimatum' ? 'recruitment-ultimatum' : 'recruitment-note') || '') + '</p>'),
  { kind: 'ask' });

  // ── the pause ───────────────────────────────────────────────────────
  push('weigh', 'answer', _card('answer', 'The One Who Had To Answer', 'The pause', 'scales',
    '<div class="nt-who">' + _av(v.target, 54)
    + '<div><div class="nt-who-nm">' + _esc(v.target) + '</div>'
    + '<div class="nt-who-sub">' + (v.mode === 'ultimatum'
      ? 'Has now seen a face and cannot give it back.'
      : 'Holding a piece of paper and no more information than that.')
    + '</div></div></div>'
    + '<p>' + _pick(WEIGH, key + '|weigh') + '</p>'),
  { kind: 'weigh' });

  // ── the answer ──────────────────────────────────────────────────────
  push('answer', 'answer', _card('answer', '', 'The answer', 'hush',
    '<div class="nt-verdict" data-answer="' + (v.accepted ? 'yes' : 'no') + '">'
    + '<div class="nt-verdict-w">' + (v.accepted ? 'Yes' : 'No') + '</div>'
    + '<div class="nt-verdict-s">' + _pick(ANSWER[v.accepted ? 'yes' : 'no'], key + '|answer')
    + '</div></div>'),
  { kind: 'answer' });

  // ── and what that costs ─────────────────────────────────────────────
  // FOUR OUTCOMES, NOT TWO, and the pools are separate rather than a shared
  // pool with a name swapped in: an accepted note and an accepted ultimatum
  // are different partnerships, and a refused note and a refused ultimatum
  // are the difference between a wasted night and a body.
  const outcome = v.accepted
    ? (v.mode === 'ultimatum' ? 'acceptedUltimatum' : 'acceptedNote')
    : (v.mode === 'ultimatum' ? 'refusedUltimatum' : 'refusedNote');
  const sums = [];
  if (v.executed) {
    sums.push([_cap(v.doors.night), _esc(v.executed), 'wax']);
  } else if (!v.accepted) {
    sums.push(['Consequence', 'None', null]);
  } else {
    sums.push(['The turret', 'One more chair', 'wax']);
  }
  sums.push(['Delivered', v.mode === 'note' ? 'Anonymously' : 'Face to face', null]);
  push('after', 'both', _card('both', v.executed ? 'The Only Possible End' : 'What It Cost',
    'Afterwards', v.executed ? 'hush' : 'threshold',
    '<p>' + _esc(_fill(_pick(AFTER[outcome], key + '|after'), { who: v.target })) + '</p>'
    + _sums(sums)
    // THE ONE HOST LINE, and it is the LAST thing on the screen. The host was not
    // in the corridor -- four screens open on a host band and this one is
    // deliberately not one of them.
    + _hostBand(_esc(_pick(HOST_CLOSE[outcome], key + '|host')))),
  { kind: 'after', outcome });

  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE TERMS — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trRecruitment`, because a <script> tag inside innerHTML
// does not execute. Two of the four terms are LIVE FROM THE FIRST CLICK and
// two are blank until read, and the split is the design: how the offer was
// delivered and what refusing it costs are the RULES of the scene, and the
// viewer is entitled to them before the answer, exactly as the person in the
// corridor was. Who asked and what they said are the scene, and those wait.

function _term(k, val, note, tone, blank) {
  return '<div class="nt-term"' + (blank ? ' data-blank="1"' : '')
    + (tone ? ' data-tone="' + tone + '"' : '') + ' data-k="' + _esc(k) + '">'
    + '<span class="nt-term-k">' + _esc(k) + '</span>'
    + '<span class="nt-term-v">' + (blank ? '&mdash;' : val) + '</span>'
    + (note && !blank ? '<span class="nt-term-note">' + _esc(note) + '</span>' : '')
    + '</div>';
}

function _terms(state, idx) {
  const v = state.v;
  const seen = new Set(state.stepMeta.slice(0, Math.max(0, idx + 1))
    .filter(Boolean).map(m => m.kind));
  return '<div class="nt-terms">'
    + _term('Delivery', v.mode === 'note' ? 'A note' : 'An ultimatum',
      v.mode === 'note' ? 'pushed under a door' : 'said to a face', 'moon', false)
    + _term('If refused', v.fatalToRefuse ? 'Fatal' : 'Survivable',
      v.fatalToRefuse ? 'they have seen your face' : 'they never saw a face',
      v.fatalToRefuse ? 'wax' : null, false)
    + _term('The hand', v.recruiterKnown ? _esc(v.recruiter) : 'Not known to you',
      v.recruiterKnown ? null : 'and it never will be', null, !seen.has('asker'))
    + _term('The answer', v.accepted ? 'Yes' : 'No',
      v.accepted ? 'one more chair upstairs' : (v.executed ? 'and it was the last one' : ''),
      v.accepted ? 'wax' : null, !seen.has('answer'))
    + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'recruitment-' + (epNum || 0); }
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
    const el = document.getElementById('nt-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('nt-vis'); else el.classList.remove('nt-vis');
  }
  const counter = document.getElementById('nt-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('nt-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.nt-btn').forEach(b => b.classList.toggle('nt-dim', done));
  }
  const shell = document.getElementById('nt-shell-' + suffix);
  const last = document.getElementById('nt-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase',
    last.getAttribute('data-phase') || 'approach');
  if (scroller) scroller.scrollTop = top;
}

function _updateTerms(epNum, idx) {
  const el = document.getElementById('nt-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trRecruitment) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _terms(state, idx);
}

/** Bring the new card into view, UNDER the terms strip rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('nt-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trRecruitmentRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('nt-step-' + suffix + '-' + st.idx));
  _updateTerms(epNum, st.idx);
}

export function trRecruitmentRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateTerms(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildRecruitment(ep, observer)` — two people, one decision.
 *
 * `ep` is an `episodeHistory` row carrying `tr.recruitment`, written by
 * `_recordEpisode` in js/tr/headless.js on the minority of nights the pact
 * spends asking instead of killing. `observer` is `'audience'` or
 * `'player:<Name>'`; see `_view` for exactly what the difference is and where
 * it is applied.
 */
export function rpBuildRecruitment(ep, observer = 'audience') {
  const suffix = 'recruitment';
  const vars = '--nt-grain-src:' + _noiseTile('0.86', 4, 71, 0.32, 210) + ';';
  const css = '<style>' + NT_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  const shellNone = (headline, body, mode) =>
    '<div class="nt-root" style="' + vars + '">' + css
    + '<div class="nt-shell" data-phase="approach">'
    + '<div class="nt-scenery" aria-hidden="true">'
    + '<div class="nt-far">' + _corridorFar() + '</div>'
    + '<div class="nt-vig"></div><div class="nt-grain"></div></div>'
    + '<div class="nt-body"><div class="nt-none">'
    + _ic(mode || 'threshold', 84, 'rgba(159,182,210,.34)')
    + '<div class="nt-none-h">' + _esc(headline) + '</div>'
    + '<p>' + _esc(body) + '</p>'
    + '</div></div></div></div>';

  if (!v) {
    return shellNone('Nobody Was Approached',
      'No offer was made this evening. The pact spent the night doing the other thing it '
      + 'does, or doing nothing at all.');
  }
  // THE LAYER THAT RENDERS NOTHING, and it renders nothing on purpose. Two
  // people were in that corridor. Everybody else in the castle was asleep and
  // is entitled to exactly what they saw, which is a dark passage.
  if (!v.present) {
    return shellNone('You Were Asleep',
      'Two people met in a corridor tonight while you were not in it. Nothing about that '
      + 'conversation is yours, and nothing about it will be offered to you in the morning '
      + 'either.', 'hush');
  }

  const beats = _buildBeats(v);
  const total = beats.length;
  const epNum = ep.num || v.ep || 0;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trRecruitment = window.__trRecruitment || {};
    window.__trRecruitment[epNum] = state;
  }

  // THE OBSERVER STRIP CARRIES THE LAYER, and on this screen it is carrying
  // the mechanic itself: whether the person reading it can name the hand.
  const observerBadge = v.isAudience
    ? '<div class="nt-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; both people, both names; the corridor had two '
      + 'people in it and neither of them can see it like this</em></div>'
    : '<div class="nt-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; ' + (v.recruiterKnown
        ? 'you know exactly who asked, which is the expensive half of this'
        : 'a folded sheet of paper and no way at all back to whoever wrote it')
      + '</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED — the Round Table's
  // pattern, and the reason the conclave shipped a screen that was blank
  // until it was clicked.
  const stream = beats.map((b, i) =>
    '<div class="nt-beat' + (i <= st.idx ? ' nt-vis' : '')
    + '" id="nt-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="nt-root" style="' + vars + '">' + css
    + '<div class="nt-shell" id="nt-shell-' + suffix + '" data-mode="' + v.mode + '"'
    + ' data-phase="' + beats[0].phase + '">'
    + '<div class="nt-scenery" aria-hidden="true">'
    + '<div class="nt-far">' + _corridorFar() + '</div>'
    + '<div class="nt-mid">' + _corridorMid(epNum + '|' + v.target) + '</div>'
    + '<div class="nt-fore">' + _corridorFore() + '</div>'
    + '<div class="nt-wash"></div>'
    + '<div class="nt-vig"></div>'
    + '<div class="nt-grain"></div>'
    + '</div>'
    + '<div class="nt-body">'
    + '<div class="nt-hero">' + _heroScene(v.mode)
    + '<div class="nt-hero-lock">'
    // TASK 7: "Night 3" and not "Season I - Night III" — the episode record
    // carries no season number, and the other four screens say so too.
    + '<div class="nt-eyebrow">The Traitors &middot; Night ' + (v.ep || epNum)
    + ' &middot; ' + (v.mode === 'note' ? 'Under A Door' : 'Face To Face') + '</div>'
    + '<h1 class="nt-title">' + (v.mode === 'note' ? 'THE NOTE' : 'THE ULTIMATUM') + '</h1>'
    + '<div class="nt-title-rule"><i></i>'
    + _icon(v.mode === 'note' ? 'letter' : 'cloak', 36,
      v.mode === 'note' ? '#ded3b4' : '#8e1526') + '<i></i></div>'
    + '<p class="nt-sub">' + (v.mode === 'note'
      ? 'An anonymous written offer to become a Traitor. Refusing is survivable because the recipient never sees who delivered it.'
      : 'A face-to-face demand to become a Traitor. Refusing is fatal because the recipient can identify the recruiter.')
    + '</p>'
    + '</div></div>'
    + '<header class="nt-head">' + observerBadge + '</header>'
    // THE TERMS, STUCK UNDER THE NAV. Sticky element AND the element the
    // reveal handlers replace by id.
    + '<div class="nt-stage" id="nt-stage-inner">' + _terms(state, st.idx) + '</div>'
    + '<main class="nt-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="nt-controls" id="nt-controls-' + suffix + '">'
    + '<button class="nt-btn" onclick="' + call('trRecruitmentRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="nt-counter" id="nt-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="nt-btn" onclick="' + call('trRecruitmentRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
