// ══════════════════════════════════════════════════════════════════════
// vp-tr/house-status.js — the day book, and where the castle stands
// ══════════════════════════════════════════════════════════════════════
//
// Built in the language Task 1 approved and Task 2 extended, and it is the
// screen in the set that is not a room.
//
// SHARED: the type system (Fraunces 900 for display, IM Fell English for
// anything written by hand, Cormorant Garamond for body), the `_portrait()`
// helper and its stylesheet, `_icon()` for the objects — the coffer, the
// relics, the glass and the seal, which have to be the same drawings on every
// screen — the reveal machinery, the sticky-stage architecture, and the rule
// that no narration writes a host name or an exit word as a literal.
//
// NOT SHARED, AND ON PURPOSE:
//
//   IT IS A DOCUMENT, NOT A SCENE. The turret is a meeting, the hall is a
//   trial and the morning is a discovery; all three are things that HAPPEN.
//   This is the one screen a viewer opens to find out where they are, and a
//   room is the wrong shape for that. So it is the castle's own day book, open
//   on a desk in the library with the afternoon coming in sideways, and every
//   card is an ENTRY on a ruled page rather than a beat in a story.
//
//   IT IS INK ON PAPER. Every other screen in this set is light text on a dark
//   room, because every other screen is at night or before sunrise. This one
//   is dark on light — the page is the brightest thing on the display — and
//   that is the whole reason it is recognisable from across a room as the
//   screen you check rather than the screen you watch.
//
//   THE CARDS ARE WRITTEN, NOT DROPPED. The turret drew its cards out of the
//   dark, the hall leant them in across the wood, and the morning brought them
//   down a stair. An entry in a ledger appears the way ink does: the rule is
//   drawn along the page first and the writing bleeds up after it.
//
// ── THE HARD RULES ────────────────────────────────────────────────────
//
//   1. THE FIGURE ON THE PAGE IS THE FIGURE ON THE RECORD. The prize fund is
//      read off `ep.tr.pot` — the snapshot js/tr/headless.js takes at the end
//      of the episode — and printed unmodified. NOTHING IN js/vp-tr/ IMPORTS
//      ENGINE STATE: not `gs`, not the pot, and not either of the two crowd
//      ledgers, which Plan 7 §Task 5 confines to js/tr/crowd.js. A screen is
//      handed a record and cannot reach past it, which is what "read it
//      through the export" means when it is enforced rather than intended.
//   2. NOBODY WHO LEFT IS ON THE ROLL. The standing room is `tr.cast` minus
//      `tr.goneBefore` minus THIS episode's own `roundExits()` — the
//      registry's rule, which knows the show has two doors. `eliminated` is
//      the public vote alone, and Plan 7 found nine readers asking it: a
//      Traitors season rendered with half its cast never leaving, and a
//      finale night with two people alive counting eleven.
//   3. A RELIC DOES NOT NAME ITS HOLDER TO SOMEBODY WHO WAS NOT THERE. Plan 6
//      built the Shield SEMI-VISIBLY on purpose — some of the room saw who
//      came back up the stair with it and some did not — and that visibility
//      model is the mechanic's entire strategic content. The engine records
//      the witness list at the moment of the award (js/tr/powers.js) and this
//      screen obeys it: an observer who is neither the holder nor a witness is
//      told a relic is in the castle and is told nothing else. The name is
//      never put in the markup at all, rather than put there and hidden.
//
//   AND THE BOARD IS PUBLIC ON EVERY LAYER OTHERWISE. It carries no alignment,
//   no belief and no count of the pact — those are the Round Table's to leak
//   or withhold. What is left is what the castle itself could write down, and
//   the relics are the only line in it that depends on who is reading.
import { seasonConfig, players } from '../core.js';
import { exitVerbs, roundExits } from '../shows.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { PORTRAIT_CSS } from './style.js';
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
/** The fund, in the currency the format keeps it in. */
function _money(n) {
  return '&pound;' + Number(n || 0).toLocaleString('en-GB');
}
/** The same figure where it is going to be run through `_esc` — no entity. */
function _moneyPlain(n) {
  return '£' + Number(n || 0).toLocaleString('en-GB');
}

// ── the host ──────────────────────────────────────────────────────────
// Resolved, never written.
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
/** A face in the book, and it is NEUTRAL — see `_portrait()`. */
function _av(name, size) {
  return _portrait(_slugOf(name), name, size || 34);
}
function _hostAv(size) {
  const h = _host();
  return _portrait(h.slug, h.name, size || 46);
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — objects only, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// The coffer, the relics, the glass and the seal come from `_icon()` in
// conclave.js and are not redrawn here: they are the same objects and a second
// drawing of the same object is how two screens start disagreeing about what
// the show's Dagger looks like. These are the library's own.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    ledger: '<path d="M3.4 4.2c2.8-1.2 5.6-1.2 8.6.6 3-1.8 5.8-1.8 8.6-.6v14.4c-2.8-1.2-5.6-1.2-8.6.6-3-1.8-5.8-1.8-8.6-.6z" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<path d="M12 4.8v14.4" stroke="' + c + '" stroke-width="1.2"/>'
      + '<path d="M5.6 8h4.2M5.6 11h4.2M5.6 14h3M14.2 8h4.2M14.2 11h4.2M14.2 14h3" stroke="' + c + '" stroke-width=".9" opacity=".62"/>',
    nib: '<path d="M12 2.2 16.6 13 12 21.8 7.4 13z" stroke="' + c + '" stroke-width="1.3" fill="none"/>'
      + '<path d="M12 8.6v9.4" stroke="' + c + '" stroke-width="1.2"/>'
      + '<circle cx="12" cy="12.6" r="1.5" fill="' + c + '"/>',
    scales: '<path d="M12 3.2v16.4M7.4 20.4h9.2" stroke="' + c + '" stroke-width="1.5"/>'
      + '<path d="M4 7.4h16" stroke="' + c + '" stroke-width="1.4"/>'
      + '<circle cx="12" cy="4.6" r="1.5" fill="' + c + '"/>'
      + '<path d="M1.6 13.4 4 7.6l2.4 5.8a2.4 2.4 0 0 1-4.8 0z" stroke="' + c + '" stroke-width="1.2" fill="none"/>'
      + '<path d="M17.6 13.4 20 7.6l2.4 5.8a2.4 2.4 0 0 1-4.8 0z" stroke="' + c + '" stroke-width="1.2" fill="none"/>',
    stamp: '<rect x="3" y="16.6" width="18" height="4.4" rx="1" fill="' + c + '"/>'
      + '<path d="M7.4 16.6V13a4.6 4.6 0 0 1 4.6-4.6A4.6 4.6 0 0 1 16.6 13v3.6z" stroke="' + c + '" stroke-width="1.3" fill="none"/>'
      + '<rect x="9.6" y="2.6" width="4.8" height="6.2" rx="1.4" fill="' + c + '" opacity=".8"/>',
    shelf: '<path d="M2.6 21h18.8" stroke="' + c + '" stroke-width="1.5"/>'
      + '<rect x="4" y="7" width="3" height="14" stroke="' + c + '" stroke-width="1.2" fill="none"/>'
      + '<rect x="8" y="4.4" width="3" height="16.6" stroke="' + c + '" stroke-width="1.2" fill="none"/>'
      + '<rect x="12" y="9" width="3" height="12" stroke="' + c + '" stroke-width="1.2" fill="none"/>'
      + '<path d="M16.6 21 16 8.2l4-.6.8 13.4z" stroke="' + c + '" stroke-width="1.2" fill="none"/>',
    ring: '<circle cx="12" cy="12" r="8.6" stroke="' + c + '" stroke-width="1.4" fill="none"/>'
      + '<circle cx="12" cy="12" r="4.4" stroke="' + c + '" stroke-width="1" opacity=".6" fill="none"/>'
      + '<circle cx="12" cy="3.4" r="1.6" fill="' + c + '"/>',
    strike: '<path d="M3.4 6h17.2M3.4 12h17.2M3.4 18h11" stroke="' + c + '" stroke-width="1.3" opacity=".55"/>'
      + '<path d="M2.4 15.4 21.6 4.6" stroke="' + c + '" stroke-width="1.7"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE LIBRARY — three planes, and it is the middle of the afternoon
// ══════════════════════════════════════════════════════════════════════
//
// We are looking down at a desk. Behind it, shelves in shade; to the right, a
// window with the sun well up in it. The one thing on this screen that MOVES
// is the light: the rhomboid it lays across the desk creeps as it runs, which
// is the only clock a room like this has.

/** The far plane: the shelves, and the wall they are set into. */
function _libFar() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="dbWall" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#241d16"/><stop offset="100%" stop-color="#0f0b08"/>'
    + '</linearGradient>'
    + '<linearGradient id="dbDayIn" x1="1" y1="0" x2="0" y2="0.4">'
    + '<stop offset="0%" stop-color="#ffeec6" stop-opacity=".5"/>'
    + '<stop offset="100%" stop-color="#ffeec6" stop-opacity="0"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#dbWall)"/>'
    // the shelves: six courses of books, each a run of coloured spines
    + _spines()
    // the window, right, and the daylight coming off it
    + '<path d="M902 190h190v640H902z" fill="#f4e7c6" opacity=".16"/>'
    + '<path d="M902 190h190v640H902z" fill="none" stroke="#0d0a07" stroke-width="16"/>'
    + '<path d="M997 190v640M902 400h190M902 610h190" stroke="#0d0a07" stroke-width="11"/>'
    + '<rect width="1100" height="1500" fill="url(#dbDayIn)"/>'
    + '</svg>';
}
/** Six shelves of spines, laid out from a hash so the library is always this library. */
function _spines() {
  const rng = _fieldRng('db|spines');
  const cols = ['#4a2320', '#3b3a24', '#243a35', '#402c1c', '#2b2233', '#54331f', '#1f2c3d'];
  let s = '';
  for (let row = 0; row < 6; row++) {
    const y = 150 + row * 118;
    s += '<rect x="56" y="' + (y + 96) + '" width="796" height="14" fill="#1a130d"/>';
    let x = 62;
    while (x < 840) {
      const w = 14 + Math.floor(rng() * 22);
      const h = 68 + Math.floor(rng() * 26);
      s += '<rect x="' + x + '" y="' + (y + 96 - h) + '" width="' + w + '" height="' + h
        + '" fill="' + cols[Math.floor(rng() * cols.length)] + '" opacity="'
        + (0.55 + rng() * 0.35).toFixed(2) + '"/>';
      x += w + 2;
    }
  }
  return s;
}

/**
 * The mid plane: the desk, the light lying on it, and what is standing on it.
 *
 * The rhomboid is a real shape with real edges rather than a soft glow,
 * because a hard-edged patch of afternoon is the single cheapest thing that
 * says "indoors, and the sun is out".
 */
function _libMid(seed) {
  const rng = _fieldRng('db|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="dbDesk" x1="0" y1="0" x2="0.2" y2="1">'
    + '<stop offset="0%" stop-color="#3a2a1c"/><stop offset="54%" stop-color="#251a11"/>'
    + '<stop offset="100%" stop-color="#140d08"/>'
    + '</linearGradient>'
    + '<linearGradient id="dbPatch" x1="1" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#fff2d2" stop-opacity=".38"/>'
    + '<stop offset="100%" stop-color="#ffe8bc" stop-opacity="0"/>'
    + '</linearGradient>'
    + '</defs>'
    // the desk, filling the lower two thirds
    + '<path d="M0 828h1100v672H0z" fill="url(#dbDesk)"/>'
    + '<path d="M0 828h1100v18H0z" fill="#4a3623"/>'
    // the afternoon, laid across it. This is the one thing that moves.
    + '<path class="db-patch" d="M760 846 L1100 846 L1100 1500 L332 1500 Z" fill="url(#dbPatch)"/>'
    // the blotter, the inkwell and the glass
    + '<path d="M118 986h560v420H118z" fill="#2c1a16" opacity=".85"/>'
    + '<path d="M118 986h560v420H118z" fill="none" stroke="#5c2420" stroke-width="7"/>'
    + '<rect x="742" y="1024" width="86" height="86" rx="7" fill="#1a1712"/>'
    + '<ellipse cx="785" cy="1026" rx="43" ry="13" fill="#2d2820"/>'
    + '<ellipse cx="785" cy="1030" rx="30" ry="8" fill="#090a10"/>'
    + '<path d="M876 1108 L906 1024 L936 1108 Z" fill="#c9b384" opacity=".5"/>'
    + '<path d="M876 1108 L906 1192 L936 1108 Z" fill="#c9b384" opacity=".3"/>'
    + '<path d="M866 1016h80M866 1198h80" stroke="#b98f3e" stroke-width="9"/>'
    // dust hanging in the beam. It HANGS: the room is still and nobody is in it.
    + '';
  for (let i = 0; i < 44; i++) {
    const x = 420 + rng() * 660, y = 850 + rng() * 640;
    const d = (16 + rng() * 20).toFixed(1), delay = (-rng() * 24).toFixed(1);
    s += '<circle class="db-hang" cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="'
      + (1 + rng() * 2).toFixed(1) + '" fill="#fff0cf" opacity="'
      + (0.18 + rng() * 0.4).toFixed(2) + '" style="animation-duration:' + d
      + 's;animation-delay:' + delay + 's"/>';
  }
  return s + '</svg>';
}

/** The fore plane: the near edge of the desk, and a corner of the book itself. */
function _libFore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<path d="M0 1416h1100v84H0z" fill="#0a0705"/>'
    + '<path d="M0 1416h1100v10H0z" fill="#3d2c1c"/>'
    + '<path d="M0 0h84v1500H0z" fill="#070504" opacity=".9"/>'
    + '<path d="M1016 0h84v1500h-84z" fill="#070504" opacity=".9"/>'
    + '</svg>';
}

/** The hero plate: the book, open, with the afternoon across it. */
function _heroBook(rows) {
  const n = Math.max(3, Math.min(11, rows || 7));
  let s = '<svg class="db-hero-scene" viewBox="0 0 1100 456" preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="dbHeroBg" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#1b1310"/><stop offset="100%" stop-color="#0a0705"/>'
    + '</linearGradient>'
    + '<linearGradient id="dbPage" x1="0" y1="0" x2="0.3" y2="1">'
    + '<stop offset="0%" stop-color="#efe4c8"/><stop offset="100%" stop-color="#cdbc96"/>'
    + '</linearGradient></defs>'
    + '<rect width="1100" height="456" fill="url(#dbHeroBg)"/>'
    // the two pages, curving away from the gutter
    + '<path d="M44 442 Q548 372 548 372 L548 54 Q548 54 44 112 Z" fill="url(#dbPage)"/>'
    + '<path d="M1056 442 Q552 372 552 372 L552 54 Q552 54 1056 112 Z" fill="url(#dbPage)"/>'
    + '<path d="M548 54 L548 372" stroke="#8a7550" stroke-width="6" opacity=".7"/>';
  for (let i = 0; i < n; i++) {
    const y = 128 + i * 26;
    s += '<path d="M92 ' + (y + 8) + ' L512 ' + (y - 14) + '" stroke="#8a7550" stroke-width="2" opacity=".34"/>'
      + '<path d="M588 ' + (y - 14) + ' L1008 ' + (y + 8) + '" stroke="#8a7550" stroke-width="2" opacity=".34"/>';
  }
  // the afternoon across the right-hand page
  s += '<path d="M660 62 L1056 112 L1056 442 L840 412 Z" fill="#fff3d6" opacity=".22"/>';
  return s + '</svg>';
}

/** The filter bank. */
function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="dbFibre" x="0%" y="0%" width="100%" height="100%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.04 0.9" numOctaves="3" seed="23" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '<filter id="dbSoft" x="-140%" y="-140%" width="380%" height="380%">'
    + '<feGaussianBlur stdDeviation="26"/></filter>'
    + '</defs></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VISUAL SYSTEM — the one screen in this set that is ink on paper
// ══════════════════════════════════════════════════════════════════════
const DB_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.db-root{
  --db-desk:#1c1410;
  --db-desk-2:#0d0907;
  --db-paper:#e7dcc2;
  --db-paper-2:#d5c7a6;
  --db-ink:#231b12;
  --db-ink-soft:#5d4c36;
  --db-ruled:rgba(138,117,80,.42);
  --db-leather:#5c2420;
  --db-brass:#b98f3e;
  --db-brass-hot:#f4dda2;
  --db-verdi:#3f645b;
  --db-wax:#8e1526;
  --db-wax-hot:#b8283c;
  --db-display:'Fraunces',Georgia,'Times New Roman',serif;
  --db-hand:'IM Fell English',Georgia,serif;
  --db-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  /* the shared portrait reads these; the book answers in brass */
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--db-paper);
  font-family:var(--db-body);
  font-size:17px;line-height:1.6;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#000;
}
.db-root *{box-sizing:border-box}

.db-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--db-desk);
  box-shadow:0 0 0 1px rgba(185,143,62,.16),0 0 90px rgba(0,0,0,.9);
  overflow:visible;
  transition:background 1.4s ease;
}
/* THE CLIP LAYER, AND IT TAKES NO z-index — the conclave measured both halves
   of this: a shell that clips is a scroll container and kills sticky for every
   descendant, and a z-index here would make this a stacking context and
   silently re-grade every blend on the screen. */
.db-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

.db-far,.db-mid,.db-fore{
  position:absolute;left:0;right:0;top:46px;height:1500px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.db-wash,.db-vig,.db-grain{position:absolute;left:0;right:0;top:46px;bottom:0;pointer-events:none}
.db-far svg,.db-mid svg,.db-fore svg{position:absolute;inset:0;width:100%;height:100%}
.db-far {z-index:0;filter:blur(2.8px) saturate(.62) brightness(.7);opacity:.62}
.db-mid {z-index:1;filter:blur(.4px);opacity:.92}
.db-fore{z-index:2}
.db-wash{z-index:3}
.db-vig {z-index:4}
.db-grain{z-index:9}
.db-body{position:relative;z-index:5}
.db-far::after,.db-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:380px;
  background:linear-gradient(180deg,transparent,var(--db-desk));
}
.db-wash{
  mix-blend-mode:screen;opacity:.6;
  background:radial-gradient(70% 40% at 82% 14%,rgba(255,238,198,.22) 0%,transparent 62%);
}
.db-vig{
  background:
    radial-gradient(122% 84% at 48% 30%,transparent 0%,transparent 40%,rgba(6,4,3,.44) 74%,rgba(6,4,3,.9) 100%),
    linear-gradient(180deg,rgba(6,4,3,.66) 0%,transparent 14%,transparent 82%,rgba(6,4,3,.8) 100%);
  mix-blend-mode:multiply;
}
.db-grain{
  opacity:.13;mix-blend-mode:soft-light;
  background-image:var(--db-grain-src);background-size:230px 230px;
}

/* ── AMBIENT — the dust HANGS and the sun CREEPS. Nothing here hurries. ── */
.db-hang{animation:db-hover ease-in-out infinite alternate}
@keyframes db-hover{
  0%{transform:translate(0,0);opacity:.28}
  50%{transform:translate(14px,-9px);opacity:.6}
  100%{transform:translate(26px,4px);opacity:.22}
}
.db-patch{animation:db-creep 46s ease-in-out infinite alternate}
@keyframes db-creep{0%{transform:translateX(0)}100%{transform:translateX(-52px)}}

/* ── PHASE ATMOSPHERE — the desk, at four times of the afternoon ────── */
.db-shell[data-phase="roll"]{background:#1c1410}
.db-shell[data-phase="ledger"]{background:#1a1210}
.db-shell[data-phase="ledger"] .db-wash{opacity:.4}
.db-shell[data-phase="coffer"]{background:#221912}
.db-shell[data-phase="coffer"] .db-wash{opacity:.9;
  background:radial-gradient(80% 46% at 78% 12%,rgba(255,231,168,.32) 0%,transparent 64%)}
.db-shell[data-phase="relics"]{background:#181713}
.db-shell[data-phase="relics"] .db-wash{opacity:.7;
  background:radial-gradient(66% 40% at 74% 16%,rgba(196,224,214,.2) 0%,transparent 58%)}
.db-shell[data-phase="sum"]{background:#211510}
.db-shell[data-phase="sum"] .db-wash{opacity:1;
  background:radial-gradient(96% 54% at 68% 12%,rgba(184,40,60,.2) 0%,transparent 62%)}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.db-hero{
  position:relative;height:456px;overflow:hidden;
  background:#0a0705;border-bottom:1px solid rgba(185,143,62,.24);
}
.db-hero svg.db-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.db-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
/* THE ONE HERO IN THIS SET THAT IS DARK TEXT. The plate behind it is an open
   page and the other three screens' cream lockup was cream on cream: legible
   only by its own drop shadow, which is not legibility. Ink on paper is also
   the whole claim this screen makes about itself. */
.db-eyebrow{
  font-family:var(--db-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:#4a3717;opacity:.95;
  text-shadow:0 1px 0 rgba(255,250,232,.7);margin-bottom:2px;
}
/* THE LOCKUP. The same one all three earlier screens use: Fraunces 900
   squeezed to .80 with a 1.3px stroke. Four screens, one logo. */
.db-title{
  display:inline-block;
  font-family:var(--db-display);font-weight:900;
  font-size:clamp(38px,6.6vw,80px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:#2b1f0a;margin:10px 0 0;
  text-shadow:0 1px 0 rgba(255,250,232,.6),0 6px 22px rgba(120,96,52,.45);
}
.db-title-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 10px}
.db-title-rule i{display:block;height:1px;width:110px;
  background:linear-gradient(90deg,transparent,rgba(74,55,23,.55))}
.db-title-rule i:last-child{background:linear-gradient(270deg,transparent,rgba(74,55,23,.55))}
.db-sub{
  font-family:var(--db-hand);font-style:italic;font-size:18px;line-height:1.55;
  color:rgba(48,36,17,.92);max-width:620px;margin:0 auto;
  text-shadow:0 1px 0 rgba(255,250,232,.55);
}

/* ── OBSERVER STRIP ─────────────────────────────────────────────────── */
.db-head{padding:16px 34px;border-bottom:1px solid rgba(185,143,62,.2);
  background:linear-gradient(180deg,rgba(10,7,5,.66),transparent)}
.db-observer{
  display:flex;align-items:center;gap:10px;
  font-family:var(--db-display);font-weight:600;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(242,226,187,.74);
}
.db-observer em{font-family:var(--db-body);font-style:italic;font-size:14px;
  letter-spacing:0;text-transform:none;color:rgba(242,226,187,.5)}

/* ═══ THE BRASS RACK — the sticky stage ═════════════════════════════
   Not a map and not a ring. Engraved plates in a rack on the desk edge, one
   per standing fact, each blank until the page that fills it has been read. */
/* OPAQUE, unlike the other three screens' stages. Theirs fade out at the
   bottom because a dark beat sliding under a dark band still reads as one
   room; a PAGE sliding half-visibly under a translucent band reads as a
   rendering fault, and the entries under this one are the brightest thing on
   the screen. */
.db-stage{position:sticky;top:46px;z-index:12;
  background:rgba(9,6,4,.985);border-bottom:1px solid rgba(185,143,62,.28);
  padding:12px 22px 15px;backdrop-filter:blur(5px)}
.db-rack{display:flex;flex-wrap:wrap;gap:10px}
.db-plate{
  flex:1 1 150px;position:relative;padding:9px 13px 10px;
  background:linear-gradient(150deg,#8f6d2c,#4e3a17 46%,#7c5f26);
  border:1px solid rgba(244,221,162,.34);
  box-shadow:inset 0 1px 0 rgba(255,244,208,.36),0 6px 16px rgba(0,0,0,.5);
}
.db-plate[data-blank="1"]{filter:saturate(.18) brightness(.52)}
.db-plate-k{
  display:block;font-family:var(--db-display);font-weight:700;font-size:8.5px;
  letter-spacing:.3em;text-transform:uppercase;color:rgba(28,17,4,.72);
  text-shadow:0 1px 0 rgba(255,244,208,.34);
}
.db-plate-v{
  display:block;font-family:var(--db-display);font-weight:900;font-size:22px;
  line-height:1.15;color:#1d1305;text-shadow:0 1px 0 rgba(255,244,208,.4);margin-top:2px;
}
.db-plate-v small{font-size:12px;font-weight:700;opacity:.72}
.db-plate[data-tone="wax"] .db-plate-v{color:#48090f}
.db-plate-note{
  display:block;font-family:var(--db-body);font-style:italic;font-size:12px;
  color:rgba(28,17,4,.66);margin-top:1px;
}

/* ── THE PAGE ───────────────────────────────────────────────────────── */
.db-main{padding:26px 34px 80px;max-width:840px;margin:0 auto}

.db-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.db-beat.db-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:26px}

/* AN ENTRY IS WRITTEN. The rule is drawn along the page first and the ink
   bleeds up after it — nothing drops, leans or descends on this screen. */
.db-beat.db-vis .db-entry{animation:db-ink .62s ease both}
.db-beat.db-vis .db-entry::after{animation:db-draw .5s cubic-bezier(.3,.9,.4,1) both}
@keyframes db-ink{
  0%{opacity:0;filter:blur(3px)}
  55%{opacity:1;filter:blur(.6px)}
  100%{opacity:1;filter:none}
}
@keyframes db-draw{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}

/* THE PAPER. Dark ink on a light page: the one screen in this set that is
   readable in a bright room, because it is the one you go to for a number. */
.db-entry{
  position:relative;
  background:linear-gradient(178deg,var(--db-paper),var(--db-paper-2));
  color:var(--db-ink);
  border:1px solid rgba(92,36,32,.34);
  padding:22px 26px 24px;
  box-shadow:0 18px 44px rgba(0,0,0,.5),inset 0 0 40px rgba(138,117,80,.16);
}
.db-entry::after{
  content:'';position:absolute;left:0;right:0;top:0;height:3px;
  background:linear-gradient(90deg,var(--db-leather),rgba(92,36,32,.1));
  transform-origin:left center;
}
.db-entry-label{
  display:flex;align-items:center;gap:9px;
  font-family:var(--db-display);font-weight:700;font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(93,76,54,.9);margin-bottom:8px;
}
.db-entry-title{
  font-family:var(--db-display);font-weight:900;font-size:26px;line-height:1.14;
  letter-spacing:-.014em;color:var(--db-ink);margin:0 0 12px;
}
.db-entry p{margin:0 0 11px;color:rgba(35,27,18,.9)}
.db-entry p:last-child{margin-bottom:0}
.db-entry .db-hand{font-family:var(--db-hand);font-style:italic;font-size:18px;
  color:rgba(64,50,32,.92)}

/* the standing roll: portraits ruled onto the page */
.db-roll{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0 2px}
.db-soul{
  display:inline-flex;align-items:center;gap:8px;padding:4px 11px 4px 4px;
  border:1px solid rgba(92,36,32,.28);background:rgba(255,250,236,.5);
}
.db-soul-nm{font-family:var(--db-display);font-weight:700;font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:rgba(35,27,18,.86)}

/* the struck-out list: two doors, drawn differently */
.db-struck{margin:14px 0 2px;border-top:1px solid var(--db-ruled)}
.db-line{
  display:grid;grid-template-columns:auto 1fr auto auto;gap:12px;align-items:center;
  padding:7px 2px;border-bottom:1px solid var(--db-ruled);
}
.db-line-nm{font-family:var(--db-body);font-size:18px;color:rgba(35,27,18,.7);
  text-decoration:line-through;text-decoration-thickness:1px}
.db-line-door{
  font-family:var(--db-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;
}
.db-line[data-door="vote"] .db-line-door{color:rgba(63,100,91,.95)}
.db-line[data-door="night"] .db-line-door{color:var(--db-wax)}
/* the night door is stamped in wax; the public one is only ruled off */
.db-line[data-door="night"] .db-line-nm{text-decoration-color:var(--db-wax)}
.db-line-ep{font-family:var(--db-display);font-weight:700;font-size:10px;
  letter-spacing:.2em;color:rgba(93,76,54,.7)}

/* the fund */
.db-fund{margin:16px 0 4px;padding:18px 20px;border:1px solid rgba(185,143,62,.5);
  background:linear-gradient(150deg,rgba(185,143,62,.16),rgba(255,250,236,.34))}
.db-fund-n{font-family:var(--db-display);font-weight:900;font-size:clamp(34px,6vw,58px);
  line-height:1;color:#3b2a08;letter-spacing:-.02em}
.db-fund-of{font-family:var(--db-display);font-weight:700;font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:rgba(93,76,54,.85);margin-top:7px}
.db-bar{position:relative;height:12px;margin-top:12px;background:rgba(35,27,18,.16);
  border:1px solid rgba(92,36,32,.3)}
.db-bar i{position:absolute;left:0;top:0;bottom:0;display:block;
  background:linear-gradient(90deg,#8f6d2c,#e0bf6d)}

/* the relics */
.db-relics{display:grid;gap:11px;margin:14px 0 2px}
.db-relic{
  display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:center;
  padding:13px 16px;border:1px solid rgba(92,36,32,.3);background:rgba(255,250,236,.44);
}
.db-relic[data-kind="dagger"]{border-color:rgba(142,21,38,.44);
  background:linear-gradient(140deg,rgba(142,21,38,.12),rgba(255,250,236,.42))}
.db-relic[data-kind="shield"]{border-color:rgba(63,100,91,.44);
  background:linear-gradient(140deg,rgba(63,100,91,.12),rgba(255,250,236,.42))}
.db-relic-k{font-family:var(--db-display);font-weight:700;font-size:9px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(93,76,54,.9)}
.db-relic-h{font-family:var(--db-display);font-weight:900;font-size:19px;color:var(--db-ink);
  margin:2px 0 3px}
.db-relic-h em{font-family:var(--db-body);font-style:italic;font-weight:400;font-size:17px;
  color:rgba(93,76,54,.85)}
.db-relic-note{font-family:var(--db-hand);font-style:italic;font-size:15px;
  color:rgba(64,50,32,.86)}
.db-relic-face{display:flex;align-items:center;justify-content:center;width:56px;height:56px;
  border:1px solid rgba(92,36,32,.34);background:rgba(35,27,18,.1)}

/* the arithmetic */
.db-sums{display:flex;flex-wrap:wrap;gap:10px 30px;margin:14px 0 2px;padding:13px 0 0;
  border-top:1px solid var(--db-ruled)}
.db-sum{display:inline-flex;align-items:baseline;gap:9px}
.db-sum-k{font-family:var(--db-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(93,76,54,.8)}
.db-sum-v{font-family:var(--db-display);font-weight:900;font-size:23px;color:#3b2a08}
.db-sum-v[data-tone="wax"]{color:var(--db-wax)}

/* ── HOST BAND — the same furniture as the other three screens ──────── */
.db-host{
  position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:16px 24px;margin-bottom:16px;
  background:linear-gradient(100deg,rgba(10,7,5,.96),rgba(62,44,20,.84) 52%,rgba(10,7,5,.96));
  border-top:1px solid rgba(185,143,62,.46);border-bottom:1px solid rgba(185,143,62,.46);
  box-shadow:inset 0 0 40px -8px rgba(244,221,162,.18),0 12px 30px rgba(0,0,0,.5);
}
.db-host-name{
  font-family:var(--db-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--db-brass-hot);margin-bottom:6px;
  display:flex;align-items:center;gap:8px;
}
.db-host-line{font-family:var(--db-hand);font-style:italic;font-size:19px;line-height:1.5;
  color:#f2e2bb}

/* ── STICKY CONTROLS ────────────────────────────────────────────────── */
.db-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(10,7,5,.1),rgba(10,7,5,.98) 44%);
  border-top:1px solid rgba(185,143,62,.24);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.db-btn{
  font-family:var(--db-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(185,143,62,.24),rgba(185,143,62,.05));
  color:#f2e2bb;
  border:1px solid rgba(185,143,62,.5);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(255,244,208,.2);
}
.db-btn:hover{background:rgba(185,143,62,.34);color:var(--db-brass-hot);
  box-shadow:0 0 26px rgba(185,143,62,.28),inset 0 1px 0 rgba(255,244,208,.34)}
.db-btn[disabled],.db-btn.db-dim{opacity:.3;cursor:default;pointer-events:none}
.db-counter{
  font-family:var(--db-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:rgba(242,226,187,.5);min-width:86px;text-align:center;
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
.db-none{max-width:620px;margin:0 auto;padding:64px 34px 90px;text-align:center}
.db-none-h{font-family:var(--db-display);font-weight:900;font-size:32px;letter-spacing:-.01em;
  color:#f2e2bb;margin:22px 0 16px}
.db-none p{font-family:var(--db-hand);font-size:19px;line-height:1.65;
  color:rgba(242,226,187,.74);margin:0 auto 14px;max-width:520px}

/* ── RESPONSIVE ─────────────────────────────────────────────────────── */
@media(max-height:720px){.db-stage{position:static}}
@media(max-width:900px){
  .db-stage{position:static}
  .db-hero{height:380px}
}
@media(max-width:700px){
  .db-main{padding:24px 18px 56px}
  .db-head{padding:14px 20px}
  .db-hero{height:320px}
  .db-hero-lock{padding:0 20px 22px}
  .db-host{grid-template-columns:1fr;gap:10px}
  .db-line{grid-template-columns:auto 1fr;gap:8px}
  .db-relic{grid-template-columns:1fr;gap:10px}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .db-root *,.db-root *::before,.db-root *::after{animation:none!important;transition:none!important}
  /* the rule along the top of an entry is DRAWN by a scale, so switching the
     animation off has to put it back or every entry loses its edge */
  .db-beat.db-vis .db-entry{opacity:1;filter:none}
  .db-beat.db-vis .db-entry::after{transform:scaleX(1)}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════

const HOST_LINES = {
  open: [
    'This is where you are. Read it slowly, because it does not get better.',
    'The book is open. Everything in it is true and none of it is helpful.',
    'Here is the state of things. No opinions in it, which is a first for this building.',
    'Somebody has to keep count. Here is the count.',
  ],
  close: [
    'That is where the castle stands. Sleep well.',
    'Those are the numbers. What you do about them is the entertainment.',
    'And that is the whole of it, written down and no longer arguable.',
    'The book closes there. It opens again tomorrow with fewer names in it.',
  ],
};

const ROLL_TEXT = [
  'These are the people still in the building. Nothing else about them is written here — not '
  + 'what anybody suspects, not what anybody has said. A name and a face is all the castle '
  + 'is entitled to write down about somebody who is still standing.',
  'The standing roll. It is the shortest true sentence this format produces, and it gets '
  + 'shorter.',
  'Everybody still in the castle, in the order they arrived in it. The book does not rank '
  + 'them and it does not sort them; it counts them, which is the only thing it can do '
  + 'honestly.',
  'This page is the room. Nothing on it is a judgement — the judgements are two rooms away '
  + 'and neither of them writes anything down.',
];

const STRUCK_TEXT = [
  'And these are the entries with a line through them. Two kinds of line, because this format '
  + 'has two ways out, and the book has never once confused them.',
  'The struck entries, in the order they were struck. The door is written beside each one, '
  + 'which is the only detail that matters about any of them.',
  'Everybody who has left, and how. The castle is meticulous about the difference: one of '
  + 'these doors was a decision the room made together and the other was not.',
  'The lines through these names were drawn on different evenings by different hands. The '
  + 'book keeps them apart.',
];

const FUND_TEXT = [
  'The fund, as it stands after everything earned and everything lost. It is not shared and '
  + 'it is not owed — it is simply sitting there, and at the end of this it goes to whoever '
  + 'is left holding it.',
  'The money. It has gone up all season and it has never once gone up because somebody '
  + 'deserved it. It goes to whoever is standing at the end, whatever they were.',
  'What the castle has earned. The number is the reason anybody puts up with any of this, and '
  + 'it is the only thing in this book nobody argues with.',
  'The fund. Note that it does not care who wins it, which is more than can be said for '
  + 'anybody in the building.',
];

const RELIC_TEXT = [
  'What is in play. A relic is not a secret in itself — the castle knows something came back '
  + 'from the field — but who is carrying it is a different question, and the book only '
  + 'answers it to somebody who was standing there.',
  'The relics. Each one was picked up in front of some number of people and behind the backs '
  + 'of the rest, and that split is worth more than the object.',
  'What has been found and what it is worth. The book records the finding; it does not '
  + 'record the finding to everybody equally, because neither did the field.',
  'Objects, and who saw them found. The second half of that is the game.',
];
const RELIC_NONE = [
  'Nothing is in play. Nobody is carrying anything, which means every plan in this castle has '
  + 'to be made out of people.',
  'The rack is empty. No relic has been found and none is being carried.',
  'No objects on the book. Whatever anybody is about to try, they are trying it with nothing '
  + 'in their hands.',
  'Nothing found, nothing held. A clean page, and the only kind of clean page this format has.',
];

const RELIC_SPENT = [
  'Nothing is being carried this evening. One object was in the castle and it has already '
  + 'done whatever it was going to do, which is entered below and is now only history.',
  'The rack is empty as of tonight. It was not empty yesterday, and the entry below is what '
  + 'was on it.',
  'Nobody is holding anything now. Something was found and something was spent, and the book '
  + 'keeps the record of it even though the object is gone.',
  'No relic in play. There is one closed entry, which is the only reason any of tonight makes '
  + 'the sense it does.',
];

const SUM_TEXT = [
  'And the arithmetic, which is the part nobody at the table does out loud. The room shrinks '
  + 'by two most evenings and by one on a good one, and there is a number of people below '
  + 'which this stops being a hunt and becomes a decision.',
  'What is left, and how much of it there is. The format ends when the room is too small to '
  + 'hide anybody, and the book can see that coming from here.',
  'The sums. Nothing in them is a prediction — they are just the shape the season has left in '
  + 'it, written out.',
  'The last page is the one everybody actually reads: how many are left, and how long that '
  + 'can go on.',
];

const CLOSE_HAND = [
  'Entered this evening, and correct at the moment of writing. Nothing in this book has ever '
  + 'stayed correct for a whole day.',
  'Signed off for the night. It will need amending before breakfast; it always does.',
  'Written up by candle, checked twice, and already out of date somewhere in this building.',
  'Ruled off here. Whatever happens next happens on the next page.',
];

// ══════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function _entry(title, label, ic, inner) {
  return '<div class="db-entry">'
    + '<div class="db-entry-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="db-entry-title">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _hostBand(line) {
  return '<div class="db-host">' + _hostAv(52)
    + '<div><div class="db-host-name">' + _ic('ledger', 12) + _esc(_host().name) + '</div>'
    + '<div class="db-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}
function _soul(name) {
  return '<span class="db-soul">' + _av(name, 26)
    + '<span class="db-soul-nm">' + _esc(name) + '</span></span>';
}
function _sums(bits) {
  return '<div class="db-sums">' + bits.map(b =>
    '<span class="db-sum"><span class="db-sum-k">' + _esc(b[0]) + '</span>'
    + '<span class="db-sum-v"' + (b[2] ? ' data-tone="wax"' : '') + '>' + b[1]
    + '</span></span>').join('') + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the three hard rules, in one place
// ══════════════════════════════════════════════════════════════════════

/**
 * WHERE THE CASTLE STANDS, AND WHAT THIS OBSERVER MAY BE TOLD ABOUT IT.
 *
 * THE STANDING ROLL is `tr.cast` minus `tr.goneBefore` minus THIS episode's
 * own departures, and that last set comes from `roundExits()` — the registry's
 * rule — applied to the row itself. It is deliberately NOT taken off
 * `tr.living`, which is a snapshot of the engine's own `activePlayers`: two
 * derivations of "who is standing" is exactly the arrangement where one of
 * them quietly stops agreeing with the ledger, and the one that is checkable
 * from the record is the one worth keeping.
 *
 * THE FIGURE is `tr.pot`, unmodified. Nothing in js/vp-tr/ imports `gs`.
 *
 * THE RELICS carry their witness list, and `known` is decided HERE rather than
 * in the markup. An observer who was not the holder and did not see the award
 * gets an entry with no holder on it at all — not a hidden field, not a
 * blanked one: a branch that never receives the name cannot leak it whatever a
 * later edit does to the card.
 */
function _view(ep, observer) {
  const rec = ep && ep.tr;
  if (!rec || !Array.isArray(rec.cast) || !rec.cast.length) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const V = _verbs();

  const before = (rec.goneBefore || []).map(g => ({ ...g }));
  // TONIGHT'S OWN DEPARTURES, THROUGH THE REGISTRY'S RULE. `eliminated` is the
  // public vote alone and would leave the other door's departures standing on
  // the roll, which is the Plan 7 defect this line exists to not have.
  // The record's own episode number, never the row's `num`: `num` is the VP's
  // reveal key and a caller may renumber a copy of a row to get a fresh one.
  const thisEp = rec.ep != null ? rec.ep : (ep.num || 0);
  const tonight = roundExits(ep, TR).map(x => ({ ...x, ep: thisEp }));
  const gone = [...before, ...tonight];
  const goneSet = new Set(gone.map(g => g.name));
  const room = rec.cast.filter(n => !goneSet.has(n));

  const entitled = r => isAudience || (watcher && (r.holder === watcher
    || (r.witnesses || []).indexOf(watcher) >= 0));
  const relic = (r, kind) => {
    const known = entitled(r);
    return {
      kind,
      ep: r.ep,
      outcome: r.outcome || null,
      visibility: r.visibility || null,
      // NOT PRESENT AT ALL when this observer did not see the award.
      holder: known ? r.holder : null,
      seenLine: known ? (r.seenLine || '') : '',
      known,
    };
  };
  const powers = rec.powers || {};
  const relics = [
    // Only what is still standing on the board. A relic whose holder has left
    // the castle is history and belongs on a career page, not on the state of
    // the game — and a spent one is a fact about a night that is over.
    ...(powers.daggers || []).filter(d => d.outcome === 'held' && room.indexOf(d.holder) >= 0)
      .map(d => relic(d, 'dagger')),
    ...(powers.shields || []).filter(s => s.outcome === 'pending'
      && room.indexOf(s.holder) >= 0).map(s => relic(s, 'shield')),
  ];
  // TONIGHT'S relic, if one was found and has already done whatever it does.
  // Kept as one line of history because "a Shield was live last night" is the
  // most useful thing this board can tell anybody about why nobody is missing
  // this morning -- and scoped to THIS episode, because a relic spent three
  // evenings ago is not the state of the game, it is a career statistic.
  const spent = [...(powers.shields || []), ...(powers.daggers || [])]
    .filter(r => r.ep === thisEp && r.outcome
      && r.outcome !== 'pending' && r.outcome !== 'held').pop();

  return {
    ep: thisEp,
    isAudience,
    watcher,
    standing: watcher ? room.indexOf(watcher) >= 0 : true,
    cast: [...rec.cast],
    room,
    gone,
    doors: { vote: V.vote, night: V.night },
    pot: Number(rec.pot || 0),
    ceiling: Number(rec.potCeiling || 0),
    relics,
    spent: spent ? relic(spent, (powers.shields || []).indexOf(spent) >= 0
      ? 'shield' : 'dagger') : null,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE ENTRIES
// ══════════════════════════════════════════════════════════════════════

function _buildBeats(v) {
  const beats = [];
  const key = 'db|' + v.ep + '|' + v.room.length;
  const push = (phase, html, hostSlot, meta) =>
    beats.push({ phase, html, hostSlot: hostSlot || null, meta: meta || null });

  // ── the standing roll ───────────────────────────────────────────────
  push('roll', _entry('Still In The Castle', 'The roll', 'ring',
    '<p>' + _pick(ROLL_TEXT, key + '|roll') + '</p>'
    + '<div class="db-roll">' + v.room.map(_soul).join('') + '</div>'
    + _sums([['Standing', String(v.room.length)],
      ['Started', String(v.cast.length)]])),
  'open', { kind: 'roll' });

  // ── the struck entries, and the two doors ───────────────────────────
  if (v.gone.length) {
    const lines = v.gone.map(g => {
      const isNight = g.verb === v.doors.night;
      return '<div class="db-line" data-door="' + (isNight ? 'night' : 'vote') + '"'
        + ' data-name="' + _esc(g.name) + '">'
        + _av(g.name, 28)
        + '<span class="db-line-nm">' + _esc(g.name) + '</span>'
        + '<span class="db-line-door">' + _esc(_cap(g.verb)) + '</span>'
        + '<span class="db-line-ep">Ep ' + _esc(String(g.ep || '')) + '</span>'
        + '</div>';
    }).join('');
    const byNight = v.gone.filter(g => g.verb === v.doors.night).length;
    push('ledger', _entry('The Entries With A Line Through Them', 'Struck', 'strike',
      '<p>' + _pick(STRUCK_TEXT, key + '|struck') + '</p>'
      + '<div class="db-struck">' + lines + '</div>'
      + _sums([[_cap(v.doors.vote), String(v.gone.length - byNight)],
        [_cap(v.doors.night), String(byNight), true]])),
    null, { kind: 'ledger' });
  }

  // ── the fund ────────────────────────────────────────────────────────
  const pct = v.ceiling > 0 ? Math.max(0, Math.min(100, Math.round(v.pot / v.ceiling * 100))) : 0;
  const each = v.room.length ? Math.floor(v.pot / v.room.length) : 0;
  push('coffer', _entry('The Fund, As It Stands', 'The coffer', 'scales',
    '<p>' + _pick(FUND_TEXT, key + '|fund') + '</p>'
    + '<div class="db-fund">'
    + '<div class="db-fund-n" data-pot="' + v.pot + '">' + _money(v.pot) + '</div>'
    + (v.ceiling > 0
      ? '<div class="db-fund-of">of a possible ' + _money(v.ceiling) + ' &middot; ' + pct + '%</div>'
        + '<div class="db-bar"><i style="width:' + pct + '%"></i></div>'
      : '')
    + '</div>'
    + _sums([['Split as it stands', _money(each)],
      ['Ways', String(v.room.length)]])),
  null, { kind: 'coffer' });

  // ── what is in play ─────────────────────────────────────────────────
  // THREE CASES, NOT TWO. The first pass printed "the rack is empty" and then
  // drew last night's Shield underneath it, which is the kind of defect only
  // reading the rendered page finds.
  const relicPool = v.relics.length ? RELIC_TEXT : (v.spent ? RELIC_SPENT : RELIC_NONE);
  let relicInner = '<p>' + _pick(relicPool, key + '|relic') + '</p>';
  if (v.relics.length) {
    relicInner += '<div class="db-relics">' + v.relics.map(r => _relicCard(r)).join('') + '</div>';
  }
  if (v.spent) {
    relicInner += '<div class="db-relics">' + _relicCard(v.spent, true) + '</div>';
  }
  push('relics', _entry('What Is In Play', 'The rack', 'stamp', relicInner),
    null, { kind: 'relics' });

  // ── the arithmetic ──────────────────────────────────────────────────
  // The format's own ending condition, stated as a count and never as a
  // prediction: the board carries no alignment on any layer, so it cannot and
  // must not say how close the pact is to being outnumbered.
  const nights = Math.max(0, v.room.length - 3);
  push('sum', _entry('What Is Left Of It', 'The sums', 'nib',
    '<p>' + _pick(SUM_TEXT, key + '|sum') + '</p>'
    + _sums([
      ['Standing', String(v.room.length)],
      ['Gone', String(v.gone.length), true],
      ['Evenings, at most', String(nights)],
      ['Fund per head', _money(each)],
    ])
    + '<p class="db-hand">' + _pick(CLOSE_HAND, key + '|close') + '</p>'),
  'close', { kind: 'sum' });

  return beats;
}

/**
 * ONE RELIC, AND THE THING IT DOES NOT SAY.
 *
 * `r.holder` is null whenever `_view` decided this observer did not witness
 * the award, so an unattributed card has nothing to print rather than
 * something to hide. `data-holder` is emitted only alongside a name, which is
 * what tests/tr-vp.test.js reads: a guard that greps the whole page for the
 * holder's name cannot work here, because a holder who is still standing is on
 * the roll two entries up for perfectly public reasons.
 */
function _relicCard(r, history) {
  const kindName = r.kind === 'dagger' ? 'Dagger' : 'Shield';
  const face = r.known && r.holder
    ? '<span class="db-relic-face">' + _av(r.holder, 44) + '</span>'
    : '<span class="db-relic-face">'
      + _icon(r.kind === 'dagger' ? 'dagger' : 'shield', 34, 'rgba(93,76,54,.8)') + '</span>';
  const line = r.known && r.holder
    ? '<div class="db-relic-h">' + _esc(r.holder) + '</div>'
      + (r.seenLine ? '<div class="db-relic-note">' + _esc(r.seenLine) + '</div>'
        : '<div class="db-relic-note">You were there when it was picked up.</div>')
    : '<div class="db-relic-h"><em>Holder not known to you</em></div>'
      + '<div class="db-relic-note">It came back out of the field in somebody\'s hands and '
      + 'you were not one of the people looking the right way.</div>';
  return '<div class="db-relic" data-kind="' + _esc(r.kind) + '"'
    + ' data-known="' + (r.known && r.holder ? 1 : 0) + '"'
    + (r.known && r.holder ? ' data-holder="' + _esc(r.holder) + '"' : '')
    + '>' + face + '<div>'
    + '<div class="db-relic-k">' + _esc(kindName)
    + (history ? ' &middot; spent, episode ' + _esc(String(r.ep || '')) : ' &middot; in play')
    + '</div>' + line + '</div></div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE BRASS RACK — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trHouseStatus`, because a <script> tag inside innerHTML
// does not execute. Every plate is BLANK until the entry that fills it has
// been read: a board that knows the last page on the first one is not a
// reveal, it is a summary with a button under it.

function _plate(k, val, note, tone, blank) {
  return '<div class="db-plate"' + (blank ? ' data-blank="1"' : '')
    + (tone ? ' data-tone="' + tone + '"' : '') + ' data-k="' + _esc(k) + '">'
    + '<span class="db-plate-k">' + _esc(k) + '</span>'
    + '<span class="db-plate-v">' + (blank ? '&mdash;' : val) + '</span>'
    + (note && !blank ? '<span class="db-plate-note">' + _esc(note) + '</span>' : '')
    + '</div>';
}

function _stage(state, idx) {
  const v = state.v;
  const seen = new Set(state.stepMeta.slice(0, Math.max(0, idx + 1))
    .filter(Boolean).map(m => m.kind));
  const each = v.room.length ? Math.floor(v.pot / v.room.length) : 0;
  const held = v.relics.length;
  return '<div class="db-rack">'
    + _plate('Standing', String(v.room.length),
      'of ' + v.cast.length + ' who arrived', null, !seen.has('roll'))
    + _plate('Chairs back', String(v.gone.length), null, 'wax', !seen.has('ledger'))
    + _plate('The fund', _money(v.pot),
      (v.room.length ? _moneyPlain(each) + ' a head' : ''),
      null, !seen.has('coffer'))
    + _plate('In play', held ? String(held) + (held === 1 ? ' relic' : ' relics') : 'Nothing',
      null, null, !seen.has('relics'))
    + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'house-status-' + (epNum || 0); }
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
    const el = document.getElementById('db-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('db-vis'); else el.classList.remove('db-vis');
  }
  const counter = document.getElementById('db-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('db-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.db-btn').forEach(b => b.classList.toggle('db-dim', done));
  }
  const shell = document.getElementById('db-shell-' + suffix);
  const last = document.getElementById('db-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase', last.getAttribute('data-phase') || 'roll');
  if (scroller) scroller.scrollTop = top;
}

function _updateStage(epNum, idx) {
  const el = document.getElementById('db-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trHouseStatus) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _stage(state, idx);
}

/** Bring the new entry into view, UNDER the rack rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('db-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trHouseStatusRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('db-step-' + suffix + '-' + st.idx));
  _updateStage(epNum, st.idx);
}

export function trHouseStatusRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateStage(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildHouseStatus(ep, observer)` — the standing state of the game.
 *
 * `ep` is an `episodeHistory` row carrying `tr.cast`, `tr.goneBefore`,
 * `tr.pot`, `tr.potCeiling` and `tr.powers`, written by `_recordEpisode` in
 * js/tr/headless.js. `observer` is `'audience'` or `'player:<Name>'`; see
 * `_view` for exactly what the difference is and where it is applied.
 */
export function rpBuildHouseStatus(ep, observer = 'audience') {
  const suffix = 'housestatus';
  const vars = '--db-grain-src:' + _noiseTile('0.82', 4, 61, 0.36, 220) + ';';
  const css = '<style>' + DB_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v) {
    return '<div class="db-root" style="' + vars + '">' + css
      + '<div class="db-shell" data-phase="roll"><div class="db-body"><div class="db-none">'
      + _ic('ledger', 92, 'rgba(185,143,62,.4)')
      + '<div class="db-none-h">The Book Is Not Written</div>'
      + '<p>This episode carries no standing record for the castle.</p>'
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
    window.__trHouseStatus = window.__trHouseStatus || {};
    window.__trHouseStatus[epNum] = state;
  }

  // THE OBSERVER STRIP CARRIES THE LAYER, and on this screen it is carrying
  // exactly one difference: the relics.
  const observerBadge = v.isAudience
    ? '<div class="db-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; the whole book, relics included; '
      + 'nobody inside the castle reads it like this</em></div>'
    : '<div class="db-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; the count and the fund are public; a relic is named to you only if '
      + (v.standing ? 'you were looking the right way when it was found'
        : 'you saw it found before you left')
      + '</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED — the Round Table's
  // pattern, and the reason the conclave shipped a screen that was blank until
  // it was clicked.
  const stream = beats.map((b, i) =>
    '<div class="db-beat' + (i <= st.idx ? ' db-vis' : '')
    + '" id="db-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + (b.hostSlot ? _hostBand(_esc(_pick(HOST_LINES[b.hostSlot],
      'db|host|' + b.hostSlot + '|' + seedEp))) : '')
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="db-root" style="' + vars + '">' + css
    + '<div class="db-shell" id="db-shell-' + suffix + '" data-phase="' + beats[0].phase + '">'
    + '<div class="db-scenery" aria-hidden="true">'
    + '<div class="db-far">' + _libFar() + '</div>'
    + '<div class="db-mid">' + _libMid(epNum + '|' + v.room.length) + '</div>'
    + '<div class="db-fore">' + _libFore() + '</div>'
    + '<div class="db-wash"></div>'
    + '<div class="db-vig"></div>'
    + '<div class="db-grain"></div>'
    + '</div>'
    + '<div class="db-body">'
    + '<div class="db-hero">' + _heroBook(v.room.length)
    + '<div class="db-hero-lock">'
    // TASK 7: "Day 3" and not "Season I · Day III" — the episode record
    // carries no season number, and the other three screens say so too.
    + '<div class="db-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; Ruled Off</div>'
    + '<h1 class="db-title">THE DAY BOOK</h1>'
    + '<div class="db-title-rule"><i></i>' + _icon('seal', 40, '#8e1526') + '<i></i></div>'
    + '<p class="db-sub">Who is left, what it is worth, what is in play, and every entry '
    + 'with a line through it. No opinions, no suspicions &mdash; only what the castle can '
    + 'honestly write down.</p>'
    + '</div></div>'
    + '<header class="db-head">' + observerBadge + '</header>'
    // THE RACK, STUCK UNDER THE NAV. Sticky element AND the element the reveal
    // handlers replace by id.
    + '<div class="db-stage" id="db-stage-inner">' + _stage(state, st.idx) + '</div>'
    + '<main class="db-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="db-controls" id="db-controls-' + suffix + '">'
    + '<button class="db-btn" onclick="' + call('trHouseStatusRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="db-counter" id="db-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="db-btn" onclick="' + call('trHouseStatusRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
