// ══════════════════════════════════════════════════════════════════════
// vp-tr/selection.js — the blindfold and the tap, on the first afternoon
// ══════════════════════════════════════════════════════════════════════
//
// Spec §9.2 lists this FIRST and it was skipped through seven tasks. It is the
// season's opening image and the only screen in the set that exists ONCE: the
// cast come up the drive in coats with their luggage, they are stood in a rank
// and blindfolded, the host walks the line, and three of them feel a hand on
// their shoulder.
//
// Built in the language Task 1 approved and Tasks 2-8 extended. SHARED: the
// type system (Fraunces 900 display, IM Fell English for anything spoken or
// written, Cormorant Garamond body), the NEUTRAL `_portrait()` -- `.cv-lit` is
// the conclave's own treatment and this screen only borrows it for the four
// faces that end up under the turret's lamp -- `_icon()` for objects that must
// be the same drawing everywhere, the reveal machinery, the sticky stage, and
// TR_NAV_H / TR_STICKY_TOP for the nav offset, which is one constant now.
//
// ── WHAT IS DIFFERENT, AND IT IS ONE THING ────────────────────────────
//
// THIS IS THE ONLY SCREEN WITH A BEFORE. Every other castle screen opens on a
// castle: the hall at night, the turret, breakfast, a corridor, a page on a
// desk, the estate in the rain. This one opens on people who have never been
// here, in daylight, holding suitcases -- and it ENDS in the turret with three
// of them looking at each other. So the environment is not a phase palette
// with four moods in it; it is one continuous fall from a grey afternoon to a
// lit window after dark, and every reveal moves it further down. The sky, the
// facade, the shadow length and the birds all run off `data-phase`, and the
// phases are hours rather than places.
//
// ITS PRIMITIVE IS THE RANK. Not a ring (the hall), not a loom (the day), not
// a slate or a tally board or a column: a straight line of the entire cast
// with a band of cloth across every face, drawn once and never re-ordered,
// with the host's position walking along it and hands landing on shoulders.
// That IS the sticky stage, and it is the only stage in the set that is a
// picture of the room rather than a table of facts about it.
//
// ── AND THE ASYMMETRY IS THE WHOLE POINT ──────────────────────────────
//
// Everybody in that line is blindfolded. The three who are tapped know they
// were tapped and NOTHING ELSE -- not who else, not how many were between
// them. The other seventeen know nothing at all. The audience watches all of
// it. That gap is the format's opening move, so the observer contract here is
// not a filter bolted onto a finished screen; it is the subject.
//
//   AUDIENCE      every tap, by name, at its place in the rank, and the turret.
//   A TAPPED ONE  their own shoulder, and nothing about the other two until
//                 the turret -- which is where they genuinely learn it, with
//                 certainty, because they are standing in a room together.
//   ANYBODY ELSE  a rank, three sets of footsteps that stop and start again,
//                 and no turret at all. They will spend the season guessing.
//
// THE TURRET MEETING IS ONE OF THE ENGINE'S THREE SANCTIONED `public`
// ALIGNMENT WRITES (`seedTraitorKnowledge`, js/tr/deduction.js; the other two
// are a recruit shown the turret and the banishment reveal, and there is never
// a fourth -- tests/tr-missions.test.js holds the closed set). This screen
// RENDERS that moment and writes nothing: js/vp-tr/ imports no engine state at
// all and cannot reach the knowledge layer. The certainty on the page is
// certainty the engine already granted.
import { seasonConfig, players } from '../core.js';
import { PORTRAIT_CSS, TR_NAV_TOP, TR_STICKY_TOP, trHost } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

// NO EXIT VERB IS IMPORTED HERE, AND THAT IS DELIBERATE RATHER THAN AN
// OVERSIGHT. Every other castle screen pulls the show's two doors out of the
// registry because it prints a departure; this one is the only screen in the
// set where nobody leaves. Importing `exitVerbs` to hold a word this screen
// never says would be a field written and never read, which is the shape this
// project's sweeps exist to catch.
const TR = 'traitors';

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
 * The same pool, without saying the same thing twice in one screen.
 *
 * Task 6 found two Traitors arguing for the same victim in word-for-word the
 * same sentence, because `_pick` hashes a key into a pool and different keys
 * collide: with a pool of eight and five speakers it is a coin flip. A scene
 * remembers what it has already said now, and this screen has three taps in a
 * row drawing from one pool, which is the same shape exactly.
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
/** Small counts read as words, because a rank is described and not tabulated. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty'];
const _word = n => (n >= 0 && n < WORDS.length) ? WORDS[n] : String(n);
const _ord = n => ['first', 'second', 'third', 'fourth', 'fifth'][n] || (n + 1) + 'th';
/**
 * A word count at the head of a sentence.
 *
 * `_word` returns lower case because that is what it is nearly always used
 * for, and two pools here open on it — which printed "three of them up here
 * and seventeen down there" with a lower-case T straight after a full stop.
 * Found by dumping the screen and reading it, as every prose defect in nine
 * plans has been.
 */
const _Word = n => { const w = _word(n); return w.charAt(0).toUpperCase() + w.slice(1); };

// ── the host ──────────────────────────────────────────────────────────
//
// `trHost` lives in js/vp-tr/style.js and BOTH premiere screens call it. This
// file used to read `seasonConfig` live with no record fallback while
// js/vp-tr/arrival.js preferred the frozen key, so changing the host in setup
// and replaying episode one printed two different names on two consecutive
// screens of the same evening. One rule, one copy, written down where the
// shared offsets are.

// ── faces ─────────────────────────────────────────────────────────────
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
/** A face on the gravel. NEUTRAL -- there is no lamp on it out here. */
function _av(name, size) {
  return _portrait(_slugOf(name), name, size || 34);
}
/** The four faces that end up under the turret lamp, and only those. */
function _avLit(name, size, tone) {
  return _portrait(_slugOf(name), name, size || 34, { lit: true, tone: tone || null });
}
function _hostAv(host, size, lit) {
  const h = host || trHost(null);
  return _portrait(h.slug, h.name, size || 46, lit ? { lit: true } : undefined);
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — this arrival's own objects, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// `cloak`, `eye`, `seal`, `flame`, `lantern`, `door` and `chevron` come from
// `_icon()` in conclave.js and are NOT redrawn -- they are the same objects on
// every screen in this directory. These are the ones only an arrival needs.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    // A CASE WITH A HANDLE AND TWO STRAPS. Everybody arrives with one and
    // nobody leaves with it.
    trunk: '<path d="M3.2 8.4h17.6v11.2H3.2z" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M9 8.4V6.2a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 6.2v2.2"'
      + ' stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M7.4 8.4v11.2M16.6 8.4v11.2" stroke="' + c + '" stroke-width="1.1" opacity=".7"/>'
      + '<path d="M3.2 13.6h17.6" stroke="' + c + '" stroke-width="1" opacity=".55"/>',
    // THE BAND. A strip of cloth with the knot at one side -- the object the
    // whole screen is named after, so it is drawn as cloth and not as a bar.
    band: '<path d="M2.4 10.2c4.6-2.2 14.6-2.2 19.2 0-.4 1.6-.4 2.6 0 4.2-4.6 2.2-14.6 2.2-19.2 0'
      + ' .4-1.6.4-2.6 0-4.2z" fill="' + c + '" opacity=".9"/>'
      + '<path d="M2.4 10.2c4.6-2.2 14.6-2.2 19.2 0" stroke="#0a0b10" stroke-width=".8" opacity=".5"/>'
      + '<path d="M20.4 11.2l2.6-1.8-.6 3 .8 2.6-2.8-1.6z" fill="' + c + '"/>',
    // A HAND COMING DOWN ONTO A SHOULDER, from above, fingers spread.
    tap: '<path d="M12 21.4c-3.4 0-5.6-2.4-5.6-5.8V9.4a1.5 1.5 0 0 1 3 0v3"'
      + ' stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M9.4 12.4V4.4a1.5 1.5 0 0 1 3 0v7.6" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M12.4 12V5.2a1.5 1.5 0 0 1 3 0V12" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M15.4 12.6V8.4a1.5 1.5 0 0 1 3 0v7.2c0 3.4-1.6 5.8-4.6 5.8"'
      + ' stroke="' + c + '" stroke-width="1.3"/>',
    // THE DRIVE. Two ruts converging on a gate — how everybody got here.
    drive: '<path d="M2 21.4 9.6 3.6M22 21.4 14.4 3.6" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M9.6 3.6h4.8" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M5.4 15.4h13.2M7.4 10.4h9.2" stroke="' + c + '" stroke-width="1" opacity=".55"/>',
    // A COUNT: two figures on one side of a rule and a crowd on the other.
    tally: '<path d="M12 2.6v18.8" stroke="' + c + '" stroke-width="1.3" opacity=".6"/>'
      + '<path d="M4 8.4v7.2M8 8.4v7.2" stroke="' + c + '" stroke-width="1.6"/>'
      + '<path d="M14.6 8.4v7.2M17.4 8.4v7.2M20.2 8.4v7.2" stroke="' + c + '" stroke-width="1.6"/>',
    // A RANK — the count, as a row of strokes with three of them struck.
    rank: '<path d="M3 6.4v11.2M7 6.4v11.2M11 6.4v11.2M15 6.4v11.2M19 6.4v11.2"'
      + ' stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M1.6 12h20.8" stroke="' + c + '" stroke-width="1.2" opacity=".5"/>',
    chevron: '<path d="M9 5.4 16 12l-7 6.6" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE ESTATE ON THE FIRST AFTERNOON — three planes, and the light falls
// ══════════════════════════════════════════════════════════════════════
//
// REDRAWN, AND THE NOTE THAT CAUSED IT IS WORTH KEEPING: "the ambience is
// great but it doesn't look good". The lighting was landing and the OBJECTS
// were letting it down — twenty-seven identical rounded-top windows, a ridge
// of zigzag, three bird-shaped blobs, five crude suitcases, a wrought gate
// made of straight lines, and a hand the size of a door floating in the sky.
// None of that was atmosphere. It was volume.
//
// SO THE RULES THIS DRAWING NOW FOLLOWS:
//
//   FEWER, BETTER. One silhouette, four windows, one lit. Half a dozen
//   well-proportioned things beat thirty crude ones, and most of what reads
//   as ugly in generated SVG is quantity rather than any single shape.
//
//   REAL PROPORTION. A lancet is about one to three and a half with a
//   semicircular head struck on its own width. A drum tower's cone is a
//   little under its own diameter. A curtain wall's merlons are about as
//   wide as the gaps between them. If a shape does not read as the thing it
//   is within a second, it is decoration that is actively hurting.
//
//   IF IT CANNOT BE DRAWN WELL, IT IS NOT DRAWN. The luggage, the birds and
//   the ironwork are gone. They are in the prose, where they belong: a dark
//   plane with a good gradient on it beats a bad chandelier every time.
//
//   ONE COLOUR FAMILY, THREE VALUES. Sky, stone and shadow. The colour
//   TEMPERATURE moves with the hour; the palette does not grow.
//
// NOTHING HERE IS A PALETTE SWITCH. The sky, the lit window and the length of
// the shadows are one drawing whose LIGHT is driven by `data-phase` in CSS,
// because the fall from a grey afternoon to a lit window after dark is the
// screen's only real motion and the only thing it needs.

/**
 * The far plane: sky, weather, and a horizon. Nothing else.
 *
 * THE CASTLE USED TO BE HERE AND IT WAS MEASURED OFF THE RENDERED PAGE THAT
 * NOBODY COULD SEE IT. The shell is 1100 wide and the cards inside it are
 * 1010, so a building drawn between x=186 and x=920 sits entirely behind the
 * stream with about forty-five pixels of it showing down each margin — a
 * facade's worth of craft spent on two slivers. It is in the HERO now, which
 * is the one full-bleed canvas on this screen and the only place a skyline
 * can actually be looked at.
 *
 * What is left is what a background plane seen at the margins is actually
 * for: a graded sky, two bands of weather with no edges on them, and a soft
 * horizon. An empty plane with a good gradient beats a building nobody sees.
 */
function _far() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="tpSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#7d90a4"/><stop offset="42%" stop-color="#a8b4bc"/>'
    + '<stop offset="72%" stop-color="#c2c5bd"/><stop offset="100%" stop-color="#8d8a7c"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#tpSky)"/>'
    // TWO BANDS OF WEATHER, and they are soft-edged ellipses rather than
    // outlined shapes. A cloud with an edge on it is a shape; a cloud without
    // one is weather.
    + '<ellipse class="tp-cloud" cx="380" cy="250" rx="620" ry="132" fill="#dfe4e2" opacity=".26"/>'
    + '<ellipse class="tp-cloud" style="animation-duration:191s" cx="760" cy="452"'
    + ' rx="700" ry="112" fill="#cdd4d4" opacity=".2"/>'
    // the horizon: one soft dark band, no treeline, no ridge, no zigzag
    + '<path d="M0 828h1100v672H0z" fill="#4b4d43" opacity=".5"/>'
    + '<path d="M0 828h1100v34H0z" fill="#3a3c34" opacity=".4"/>'
    + '</svg>';
}

/**
 * THE CASTLE, drawn WHERE IT CAN BE SEEN: on the hero's own skyline, above
 * the heads of the rank, small because it is at the top of a long drive.
 *
 * One path for the whole building, because a silhouette has no bad joins in
 * it, and every number is a ratio of the one beside it rather than a value
 * chosen on its own — which is what stops a facade looking assembled. Read
 * left to right along the top: a drum tower with a cone, a curtain wall with
 * merlons about as wide as the gaps between them, and a taller drum with the
 * turret in it. Four lancets, at roughly one to three with a semicircular
 * head struck on their own width, and one of them comes on after dark.
 */
function _skyline(base) {
  const x0 = 268, x1 = 832;
  const curtainTop = base - 56;
  let merlons = '';
  for (let x = 330; x < 776; x += 34) {
    merlons += 'L' + x + ' ' + curtainTop + ' L' + x + ' ' + (curtainTop - 12)
      + ' L' + (x + 17) + ' ' + (curtainTop - 12) + ' L' + (x + 17) + ' ' + curtainTop + ' ';
  }
  // EVERY HEIGHT IS MEASURED OFF THE VIEW BOX AS WELL AS OFF ITS NEIGHBOUR.
  // The first pass put the taller drum's apex at y = -20 and it rendered as a
  // flat-topped block with a slot in it -- a cone clipped by the frame, found
  // by looking at the page rather than at the numbers.
  const body = 'M' + x0 + ' ' + base
    + ' L' + x0 + ' ' + (base - 84) + ' L296 ' + (base - 124) + ' L324 ' + (base - 84)
    + ' L324 ' + curtainTop + ' '
    + merlons
    + 'L776 ' + curtainTop + ' L776 ' + (base - 100) + ' L804 ' + (base - 146)
    + ' L' + x1 + ' ' + (base - 100) + ' L' + x1 + ' ' + base + ' Z';
  return '<g>'
    // LIGHTER THAN BLACK AND SLIGHTLY TRANSPARENT, because it is at the top of
    // a long drive: a pure black cut-out reads as near, whatever its size.
    + '<path d="' + body + '" fill="#31352e" opacity=".82"/>'
    + _lancet(404, base - 40, 15, 40)
    + _lancet(468, base - 40, 15, 40)
    + _lancet(632, base - 40, 15, 40)
    + _lancet(696, base - 40, 15, 40)
    // THE TURRET WINDOW, and it is the one thing on this drawing that changes.
    + '<ellipse class="tp-turret-lit" cx="804" cy="' + (base - 78) + '" rx="80" ry="62"'
    + ' fill="url(#tpGlow)" opacity="0"/>'
    + '<path class="tp-turret-lit" d="M797 ' + (base - 86) + 'a7 7 0 0 1 14 0v24h-14z"'
    + ' fill="#ffcf86" opacity="0"/>'
    + _lancet(797, base - 86, 14, 31)
    + '</g>';
}

/** One lancet: a rectangle with a semicircle of its own half-width on top. */
function _lancet(x, springing, w, h) {
  const r = w / 2;
  return '<path d="M' + x + ' ' + (springing + h - r) + 'V' + springing
    + 'a' + r + ' ' + r + ' 0 0 1 ' + w + ' 0v' + (h - r) + 'z"'
    + ' fill="#101210" opacity=".92"/>';
}

/**
 * The mid plane: the gravel, and the shadows of people standing on it.
 *
 * The 220 scattered circles and the five suitcases are gone. What is left is
 * a graded ground, the light of the drive running up the middle of it, and
 * eight shadows — and the shadows are the only figurative thing here because
 * they are the one shape on this plane that is about the scene rather than
 * about the surface.
 */
function _mid(seed) {
  const rng = _fieldRng('tp|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="tpGround" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#7e786a"/><stop offset="52%" stop-color="#544f45"/>'
    + '<stop offset="100%" stop-color="#2b2a24"/>'
    + '</linearGradient>'
    + '<linearGradient id="tpDrive" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#a49c88" stop-opacity=".55"/>'
    + '<stop offset="100%" stop-color="#a49c88" stop-opacity="0"/>'
    + '</linearGradient></defs>'
    + '<path d="M0 900h1100v600H0z" fill="url(#tpGround)"/>'
    + '<path d="M496 900h108l356 600H140z" fill="url(#tpDrive)"/>';
  // EIGHT SHADOWS, thrown the same way, at slightly different lengths because
  // people are slightly different heights. Nothing else on this plane.
  s += '<g class="tp-shadows">';
  for (let i = 0; i < 8; i++) {
    const x = 150 + i * 104;
    const len = 188 + Math.round(rng() * 34);
    s += '<path d="M' + x + ' 1052h26l' + len + ' ' + Math.round(len * 0.5)
      + 'h-30z" fill="#1b1a16" opacity=".22"/>';
  }
  s += '</g>';
  return s + '</svg>';
}

/**
 * The fore plane: the frame, and nothing in it.
 *
 * This was a pair of gateposts with a wrought gate drawn as eight straight
 * lines, which read as a fence rather than as ironwork. It is a soft dark
 * edge now — the thing a gatepost actually does to a photograph.
 */
function _fore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="tpEdgeL" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0%" stop-color="#0b0c0a" stop-opacity=".96"/>'
    + '<stop offset="100%" stop-color="#0b0c0a" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<linearGradient id="tpEdgeR" x1="1" y1="0" x2="0" y2="0">'
    + '<stop offset="0%" stop-color="#0b0c0a" stop-opacity=".96"/>'
    + '<stop offset="100%" stop-color="#0b0c0a" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<linearGradient id="tpEdgeT" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0b0c0a" stop-opacity=".9"/>'
    + '<stop offset="100%" stop-color="#0b0c0a" stop-opacity="0"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect x="0" y="0" width="230" height="1500" fill="url(#tpEdgeL)"/>'
    + '<rect x="870" y="0" width="230" height="1500" fill="url(#tpEdgeR)"/>'
    + '<rect x="0" y="0" width="1100" height="150" fill="url(#tpEdgeT)"/>'
    + '</svg>';
}

/**
 * THE HERO. The rank itself, in silhouette, with a band of cloth across every
 * face and the light behind them.
 *
 * THE HAND IS GONE. It was the size of a door, it floated in the sky above
 * everybody, and it was the single worst object on the screen — and the rank
 * does not need it: a row of people in coats who cannot see is already the
 * image this episode is famous for. That is the "if you cannot draw it well,
 * do not draw it" rule spending its budget on the one shape that earns it.
 *
 * The figures are proportioned rather than assembled: head about an eighth of
 * the standing height, shoulders about a third of it, the coat tapering very
 * slightly to the hem. Heights vary by a few per cent because people do.
 */
function _heroScene(count) {
  const n = Math.max(7, Math.min(Number(count) || 12, 13));
  const rng = _fieldRng('tp|hero|' + n);
  let s = '<svg class="tp-hero-scene" viewBox="0 0 1100 470" preserveAspectRatio="xMidYMid slice">'
    + '<defs>'
    + '<linearGradient id="tpHeroSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#4e5c68"/><stop offset="58%" stop-color="#8e9aa0"/>'
    + '<stop offset="100%" stop-color="#a8ab9e"/></linearGradient>'
    + '<linearGradient id="tpHeroGround" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#6b6759"/><stop offset="100%" stop-color="#2e2d27"/>'
    + '</linearGradient>'
    + '<linearGradient id="tpCoat" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#23252a"/><stop offset="100%" stop-color="#141519"/>'
    + '</linearGradient>'
    + '<radialGradient id="tpGlow" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#ffcf86" stop-opacity=".6"/>'
    + '<stop offset="100%" stop-color="#ffcf86" stop-opacity="0"/>'
    + '</radialGradient>'
    + '</defs>'
    + '<rect width="1100" height="470" fill="url(#tpHeroSky)"/>'
    // THE BUILDING THEY HAVE JUST WALKED UP TO, on the skyline behind them and
    // above their heads -- which is the only band of this canvas the rank does
    // not fill and the title does not sit on. Measured, not guessed.
    + _skyline(174)
    + '<rect y="356" width="1100" height="114" fill="url(#tpHeroGround)"/>';
  const ground = 356;
  const step = 1080 / n;
  for (let i = 0; i < n; i++) {
    const x = 34 + step * (i + 0.5);
    const h = 196 * (0.95 + rng() * 0.1);          // people vary by a few per cent
    const top = ground - h;
    const head = h * 0.115;                         // a head is about an eighth
    const sh = h * 0.34;                            // shoulders about a third
    // the shadow, thrown long and to the right
    s += '<path d="M' + (x - sh * 0.4).toFixed(0) + ' ' + ground + 'h'
      + (sh * 0.8).toFixed(0) + 'l' + (h * 0.62).toFixed(0) + ' '
      + (h * 0.3).toFixed(0) + 'h-' + (sh).toFixed(0) + 'z"'
      + ' fill="#1d1c17" opacity=".2"/>';
    // the coat: shoulders, then a very slight taper to the hem
    s += '<path d="M' + (x - sh / 2).toFixed(1) + ' ' + ground
      + ' L' + (x - sh * 0.44).toFixed(1) + ' ' + (top + head * 1.9).toFixed(1)
      + ' Q' + x.toFixed(1) + ' ' + (top + head * 1.15).toFixed(1)
      + ' ' + (x + sh * 0.44).toFixed(1) + ' ' + (top + head * 1.9).toFixed(1)
      + ' L' + (x + sh / 2).toFixed(1) + ' ' + ground + ' Z" fill="url(#tpCoat)"/>';
    // the head, sitting on a neck rather than on the shoulders
    s += '<circle cx="' + x.toFixed(1) + '" cy="' + (top + head).toFixed(1)
      + '" r="' + head.toFixed(1) + '" fill="#2c2620"/>';
    // THE BAND. Across the eyes, which is a third of the way down a head.
    s += '<rect x="' + (x - head * 1.02).toFixed(1) + '" y="'
      + (top + head * 0.74).toFixed(1) + '" width="' + (head * 2.04).toFixed(1)
      + '" height="' + (head * 0.44).toFixed(1) + '" fill="#cfc7b1"/>';
  }
  return s + '</svg>';
}

function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    + '<filter id="tpGrain"><feTurbulence type="fractalNoise" baseFrequency="0.9"'
    + ' numOctaves="4" seed="19"/></filter></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE STYLESHEET
// ══════════════════════════════════════════════════════════════════════
// NO BACKTICKS ANYWHERE IN HERE, INCLUDING IN COMMENTS: this is a template
// literal and one of them ends the stylesheet mid-rule (Task 2's finding).
const TP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.tp-root{
  --tp-ground:#4a4a44;
  --tp-ground-deep:#26261f;
  --tp-gravel:#6f6a5b;
  --tp-cloth:#d5cdb6;
  --tp-ink:#f0ece0;
  --tp-cold:#9fb0c0;
  --tp-lamp:#ffcf86;
  --tp-wax:#a8202f;
  --tp-display:'Fraunces',Georgia,'Times New Roman',serif;
  --tp-hand:'IM Fell English',Georgia,serif;
  --tp-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--tp-ink);
  font-family:var(--tp-body);
  font-size:17px;line-height:1.62;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#0e0f10;
}
.tp-root *{box-sizing:border-box}

.tp-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--tp-ground);
  box-shadow:0 0 0 1px rgba(240,236,224,.09),0 0 90px rgba(0,0,0,.9);
  overflow:visible;
  transition:background 2.4s ease;
}
/* The clip layer takes NO z-index — measured on the conclave: a shell that
   clips is a scroll container and kills sticky for every descendant, and a
   z-index here makes this a stacking context and re-grades every blend. */
.tp-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

/* THE GROUND RUNS THE WHOLE PAGE. The drawn planes are 2100px and this screen
   runs past three thousand; Task 5's endgame was rejected for exactly this
   ("really black and empty") and Task 8's day found the same defect at
   1500px on a 3,900px page. Gravel is a texture, so below the drawing it
   repeats — the drive is what you can see from the gate and this is the rest
   of the yard. */
.tp-yard{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;pointer-events:none;
  opacity:.72;
  background-color:var(--tp-ground-deep);
  /* A GRADIENT AND NOTHING ELSE. Three layers of speckle were sitting under
     the grain layer, which is a real turbulence tile already doing that job;
     two kinds of noise on one surface is what makes a background look busy
     and cheap at the same time. */
  background-image:linear-gradient(180deg,rgba(111,106,91,.42),rgba(34,34,28,.94));
  transition:opacity 2.4s ease,background-color 2.4s ease;
}
/* AND THE WALL OF THE CASTLE BEHIND IT, the full height as well: once the rank
   is formed the drive is behind you and the facade is what you are stood in
   front of. Coursed ashlar, which repeats by nature. */
.tp-ashlar{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;pointer-events:none;
  opacity:.3;
  /* HORIZONTAL COURSES ONLY. The first pass crossed them with verticals,
     which is a stack bond -- a pattern no wall is actually laid in and one
     the eye reads immediately as a grid rather than as stone. */
  background-image:
    repeating-linear-gradient(180deg,rgba(20,19,17,.66) 0 2px,transparent 2px 78px);
}
.tp-far,.tp-mid,.tp-fore{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};height:2100px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.tp-wash,.tp-vig,.tp-grain{position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;pointer-events:none}
.tp-far svg,.tp-mid svg,.tp-fore svg{position:absolute;inset:0;width:100%;height:100%}
.tp-far {z-index:0;filter:blur(2.6px) saturate(.82);opacity:.9;transition:filter 2.4s ease,opacity 2.4s ease}
.tp-mid {z-index:1;filter:blur(.4px);opacity:.9;transition:filter 2.4s ease,opacity 2.4s ease}
.tp-fore{z-index:2}
.tp-wash{z-index:3}
.tp-vig {z-index:4}
.tp-grain{z-index:9}
.tp-body{position:relative;z-index:5}
.tp-far::after,.tp-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:460px;
  background:linear-gradient(180deg,transparent,rgba(38,38,31,.94));
}
.tp-wash{
  mix-blend-mode:screen;opacity:.34;
  background:radial-gradient(64% 34% at 46% 14%,rgba(214,226,236,.3) 0%,transparent 68%);
  transition:opacity 2.4s ease,background 2.4s ease;
}
.tp-vig{
  background:
    radial-gradient(124% 84% at 46% 20%,transparent 0%,transparent 30%,rgba(12,12,10,.5) 72%,rgba(12,12,10,.92) 100%),
    linear-gradient(180deg,rgba(12,12,10,.46) 0%,transparent 13%,transparent 88%,rgba(12,12,10,.62) 100%);
  mix-blend-mode:multiply;
}
.tp-grain{
  opacity:.14;mix-blend-mode:soft-light;
  background-image:var(--tp-grain-src);background-size:220px 220px;
}

/* ── AMBIENT ─────────────────────────────────────────────────────────── */
.tp-cloud{transform-box:fill-box;transform-origin:50% 50%;
  animation:tp-drift 143s ease-in-out infinite alternate}
@keyframes tp-drift{0%{transform:translateX(-130px)}100%{transform:translateX(130px)}}
/* THE SHADOWS LENGTHEN. Anchored at the feet, which is where a shadow starts
   — transform-origin on an SVG element resolves against the VIEW BOX unless
   transform-box is set, which is Task 2's flame defect. */
.tp-shadows{transform-box:fill-box;transform-origin:50% 0;
  transition:transform 2.6s ease,opacity 2.6s ease}
.tp-turret-lit{transition:opacity 2.8s ease}

/* ── THE FALL FROM AFTERNOON TO NIGHT, WHICH IS THE WHOLE ENVIRONMENT ── */
.tp-shell[data-phase="arrival"]{background:#6a6a60}
.tp-shell[data-phase="arrival"] .tp-shadows{transform:scaleY(.7) skewX(-8deg);opacity:.8}
.tp-shell[data-phase="arrival"] .tp-wash{opacity:.44}

.tp-shell[data-phase="blindfold"]{background:#5b5a51}
.tp-shell[data-phase="blindfold"] .tp-shadows{transform:scaleY(1.05) skewX(6deg);opacity:.9}
.tp-shell[data-phase="blindfold"] .tp-wash{opacity:.36;
  background:radial-gradient(60% 30% at 60% 16%,rgba(226,208,172,.28) 0%,transparent 66%)}

.tp-shell[data-phase="walk"]{background:#46443c}
.tp-shell[data-phase="walk"] .tp-shadows{transform:scaleY(1.5) skewX(17deg);opacity:.8}
.tp-shell[data-phase="walk"] .tp-far{filter:blur(2.6px) saturate(.6) brightness(.78)}
.tp-shell[data-phase="walk"] .tp-wash{opacity:.32;
  background:radial-gradient(56% 28% at 72% 20%,rgba(226,178,116,.28) 0%,transparent 64%)}

.tp-shell[data-phase="unmask"]{background:#33322d}
.tp-shell[data-phase="unmask"] .tp-shadows{transform:scaleY(1.9) skewX(24deg);opacity:.5}
.tp-shell[data-phase="unmask"] .tp-far{filter:blur(2.8px) saturate(.42) brightness(.54)}
.tp-shell[data-phase="unmask"] .tp-yard{opacity:.6;background-color:#1e1e19}
.tp-shell[data-phase="unmask"] .tp-wash{opacity:.26;
  background:radial-gradient(52% 26% at 78% 24%,rgba(198,120,86,.26) 0%,transparent 62%)}

.tp-shell[data-phase="turret"]{background:#1a1512}
.tp-shell[data-phase="turret"] .tp-shadows{transform:scaleY(2.3) skewX(30deg);opacity:.16}
.tp-shell[data-phase="turret"] .tp-far{filter:blur(3.4px) saturate(.3) brightness(.26)}
.tp-shell[data-phase="turret"] .tp-mid{filter:blur(.6px) brightness(.3);opacity:.7}
.tp-shell[data-phase="turret"] .tp-yard{opacity:.5;background-color:#151210}
.tp-shell[data-phase="turret"] .tp-ashlar{opacity:.2}
.tp-shell[data-phase="turret"] .tp-turret-lit{opacity:1}
.tp-shell[data-phase="turret"] .tp-wash{opacity:.5;
  background:radial-gradient(38% 20% at 81% 12%,rgba(255,207,134,.42) 0%,transparent 62%)}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.tp-hero{
  position:relative;height:452px;overflow:hidden;
  background:#15161a;border-bottom:1px solid rgba(240,236,224,.14);
}
.tp-hero svg.tp-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.tp-hero::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(10,11,14,.34) 0%,transparent 26%,rgba(10,11,14,.86) 88%);
}
.tp-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 28px;text-align:center}
.tp-eyebrow{
  font-family:var(--tp-hand);font-size:14px;letter-spacing:.34em;text-transform:uppercase;
  color:rgba(240,236,224,.7);margin-bottom:10px;
}
.tp-title{
  font-family:var(--tp-display);font-weight:900;font-variation-settings:'WONK' 1,'SOFT' 0;
  font-size:clamp(46px,7.4vw,88px);line-height:.86;margin:0;
  transform:scaleX(.86);letter-spacing:.012em;
  color:#f6f2e6;text-shadow:0 2px 0 rgba(0,0,0,.5),0 18px 46px rgba(0,0,0,.7);
}
.tp-title-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:16px 0 10px}
.tp-title-rule i{display:block;height:1px;width:min(200px,26vw);
  background:linear-gradient(90deg,transparent,rgba(240,236,224,.6),transparent)}
.tp-sub{max-width:660px;margin:0 auto;font-size:17.5px;color:rgba(240,236,224,.82);
  font-style:italic;font-family:var(--tp-body)}

/* ═══ HEAD / OBSERVER ═════════════════════════════════════════════════ */
.tp-head{padding:22px 44px 0}
.tp-observer{
  display:flex;align-items:center;gap:9px;
  font-family:var(--tp-hand);font-size:13.5px;letter-spacing:.06em;
  padding:9px 14px;border:1px solid rgba(240,236,224,.2);
  background:rgba(18,18,16,.6);color:rgba(240,236,224,.88);
}
.tp-observer em{color:rgba(240,236,224,.6);font-size:13px}
.tp-observer[data-layer="player"]{border-color:rgba(159,176,192,.42)}

/* ═══ THE RANK — the sticky stage, and it is a picture ════════════════ */
.tp-stage{
  position:sticky;top:${TR_STICKY_TOP};z-index:8;
  margin:18px 44px 0;padding:0;
}
/* OPAQUE, AND THAT IS TASK 3'S FINDING ARRIVING AGAIN. The day book had to
   go opaque because a bright page sliding under a translucent one reads as a
   rendering fault; here it was a card's own sentence reading through the
   rank's heading, which is worse — two sentences occupying one line. */
.tp-rank{
  background:#100e0c;
  border:1px solid rgba(240,236,224,.2);
  box-shadow:0 16px 40px rgba(0,0,0,.6);
  padding:13px 16px 11px;
}
.tp-rank-h{
  display:flex;align-items:baseline;justify-content:space-between;gap:12px;
  font-family:var(--tp-hand);font-size:12.5px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(240,236,224,.62);margin-bottom:9px;
}
.tp-rank-h b{font-family:var(--tp-display);font-weight:700;letter-spacing:.04em;
  font-size:14px;color:var(--tp-cloth)}
/* PADDED AT THE TOP because the hand lands ABOVE the portrait and this row is
   an overflow container, so without the room the one mark this stage exists to
   draw was clipped off. Found by rendering it. */
.tp-rank-line{display:flex;align-items:flex-end;gap:4px;overflow-x:auto;
  padding:18px 0 4px}
.tp-fig{
  position:relative;flex:0 0 auto;width:38px;
  display:flex;flex-direction:column;align-items:center;gap:3px;
  opacity:.72;transition:opacity .5s ease,transform .5s ease;
}
.tp-fig[data-you="1"]{opacity:1;transform:translateY(-3px)}
.tp-fig[data-tap="1"]{opacity:1}
.tp-fig .cv-av{filter:grayscale(.5) contrast(.95)}
.tp-fig[data-tap="1"] .cv-av{filter:none;box-shadow:0 0 0 2px var(--tp-wax)}
.tp-fig[data-you="1"] .cv-av{box-shadow:0 0 0 2px var(--tp-cold)}
/* THE BAND, drawn across every face on the stage as well, because on this
   screen the blindfold is the state and not a decoration. */
.tp-band{
  position:absolute;left:2px;right:2px;top:11px;height:6px;
  background:linear-gradient(180deg,var(--tp-cloth),#a89f88);
  box-shadow:0 1px 0 rgba(0,0,0,.5);
  transition:opacity .6s ease,transform .6s ease;
}
.tp-fig[data-off="1"] .tp-band{opacity:0;transform:translateY(-9px) rotate(-4deg)}
.tp-fig-nm{
  font-size:9.5px;line-height:1.1;text-align:center;max-width:38px;
  color:rgba(240,236,224,.5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.tp-fig[data-tap="1"] .tp-fig-nm{color:#f0b7bd}
.tp-hand-mark{
  position:absolute;top:-13px;left:50%;transform:translateX(-50%);
  color:var(--tp-wax);line-height:0;
  animation:tp-land .7s cubic-bezier(.2,.9,.2,1) both;
}
@keyframes tp-land{0%{transform:translate(-50%,-16px);opacity:0}100%{transform:translate(-50%,0);opacity:1}}
/* THE HOST'S POSITION. A caret under the rank that walks along it — drawn for
   the audience only, because where the host had got to is something you can only know
   with your eyes open. */
.tp-walker{
  position:relative;height:16px;margin-top:5px;
  border-top:1px dashed rgba(240,236,224,.22);
}
.tp-walker i{
  position:absolute;top:-1px;width:0;height:0;
  border-left:6px solid transparent;border-right:6px solid transparent;
  border-top:9px solid var(--tp-cloth);
  transition:left 1.1s cubic-bezier(.4,0,.2,1);
}
.tp-rank-foot{
  display:flex;gap:16px;flex-wrap:wrap;margin-top:7px;
  font-family:var(--tp-hand);font-size:12.5px;color:rgba(240,236,224,.58);
}
.tp-rank-foot b{color:var(--tp-cloth);font-family:var(--tp-display);font-weight:600}
.tp-rank-foot [data-tone="wax"] b{color:#e2707c}

/* ═══ THE STREAM ══════════════════════════════════════════════════════ */
.tp-main{padding:22px 44px 60px;display:flex;flex-direction:column;gap:20px}
/* CARDS STEP IN. Not dropped, not hauled, not written and not faded: they
   arrive from the side the host is walking from and rock once as they settle,
   because the motion of this screen is a footfall on gravel. */
.tp-beat{opacity:0;transform:translateX(-40px) rotate(-.7deg);
  transition:opacity .62s ease,transform .62s cubic-bezier(.22,.9,.25,1)}
.tp-beat.tp-vis{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){
  .tp-beat{transition:none;opacity:1;transform:none}
  .tp-cloud,.tp-hand-mark{animation:none}
  .tp-shadows,.tp-turret-lit,.tp-walker i,.tp-band,.tp-shell,
  .tp-far,.tp-mid,.tp-yard,.tp-wash{transition:none}
}
.tp-card{
  position:relative;
  background:linear-gradient(180deg,rgba(28,28,24,.94),rgba(18,18,15,.96));
  border:1px solid rgba(240,236,224,.16);
  box-shadow:0 14px 34px rgba(0,0,0,.5);
  padding:20px 24px 22px;
}
.tp-card[data-tone="wax"]{border-color:rgba(168,32,47,.5)}
.tp-card[data-tone="cold"]{border-color:rgba(159,176,192,.4)}
.tp-card[data-tone="lamp"]{
  border-color:rgba(255,207,134,.44);
  background:linear-gradient(180deg,rgba(38,28,18,.95),rgba(20,15,10,.97));
}
.tp-label{
  display:flex;align-items:center;gap:7px;
  font-family:var(--tp-hand);font-size:12px;letter-spacing:.26em;text-transform:uppercase;
  color:rgba(240,236,224,.56);margin-bottom:8px;
}
.tp-h{
  font-family:var(--tp-display);font-weight:700;font-variation-settings:'WONK' 1;
  font-size:26px;line-height:1.1;margin:0 0 10px;color:#f4efe2;
}
.tp-card p{margin:0 0 10px;color:rgba(240,236,224,.9)}
.tp-card p:last-child{margin-bottom:0}
.tp-quiet{color:rgba(240,236,224,.62);font-style:italic}

/* who — a face and a line about them */
.tp-who{display:flex;align-items:center;gap:13px;margin:2px 0 12px}
.tp-who-nm{font-family:var(--tp-display);font-weight:700;font-size:19px;color:#f6f1e4}
.tp-who-sub{font-family:var(--tp-hand);font-size:13.5px;color:rgba(240,236,224,.6)}
.tp-anon{
  width:54px;height:54px;flex:0 0 auto;
  display:flex;align-items:center;justify-content:center;
  border:1px dashed rgba(240,236,224,.34);background:rgba(240,236,224,.05);
}

/* the place in the rank, said as a number */
.tp-place{
  display:flex;align-items:center;gap:10px;margin:10px 0 0;
  font-family:var(--tp-hand);font-size:13.5px;color:rgba(240,236,224,.66);
}
.tp-place b{font-family:var(--tp-display);font-weight:700;font-size:22px;color:var(--tp-cloth)}

/* THE TURRET, AT HERO SIZE, because it is the payoff and the audience is
   entitled to all of it. The first pass drew it as three chips in a row --
   the same furniture as a summary strip -- which is the composition an
   observer gate produces when it is allowed to design the page. */
.tp-three{display:flex;gap:18px;flex-wrap:wrap;margin:10px 0 18px;justify-content:center}
.tp-three-one{
  flex:1 1 180px;max-width:230px;
  display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:18px 16px 16px;text-align:center;
  border:1px solid rgba(255,207,134,.34);
  background:linear-gradient(180deg,rgba(58,38,18,.6),rgba(26,17,9,.75));
}
.tp-three-nm{font-family:var(--tp-display);font-weight:900;
  font-variation-settings:'WONK' 1;font-size:24px;line-height:1.05;color:#ffe3b4}
.tp-three-sub{font-family:var(--tp-hand);font-size:13px;letter-spacing:.14em;
  text-transform:uppercase;color:rgba(255,227,180,.6)}

/* ── BOTH ROOMS, WHICH IS WHAT THE AUDIENCE HAS AND NOBODY ELSE DOES ── */
.tp-both{display:grid;grid-template-columns:auto 1px 1fr;gap:20px;align-items:center;
  margin:8px 0 4px}
.tp-both-rule{align-self:stretch;background:linear-gradient(180deg,
  transparent,rgba(240,236,224,.32),transparent)}
.tp-both-side{display:flex;flex-direction:column;gap:8px}
.tp-both-h{font-family:var(--tp-hand);font-size:12px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(240,236,224,.56)}
.tp-both-faces{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start}
.tp-both-one{display:flex;flex-direction:column;align-items:center;gap:4px;width:66px}
.tp-both-nm{font-family:var(--tp-display);font-weight:700;font-size:12.5px;
  line-height:1.15;text-align:center;color:#f0b7bd}
.tp-both-list{font-size:13px;line-height:1.5;color:rgba(240,236,224,.44)}
.tp-both-faces[data-side="them"] .cv-av{filter:grayscale(.72) brightness(.72)}
.tp-both-faces[data-side="us"] .cv-av{box-shadow:0 0 0 2px var(--tp-wax)}
.tp-both-cap{font-size:15.5px;color:rgba(240,236,224,.82);font-style:italic}
@media(max-width:720px){.tp-both{grid-template-columns:1fr;gap:14px}
  .tp-both-rule{height:1px;background:rgba(240,236,224,.28)}}

/* the summary strip on a card */
.tp-sums{display:flex;gap:22px;flex-wrap:wrap;margin-top:14px;
  border-top:1px solid rgba(240,236,224,.14);padding-top:11px}
.tp-sum{display:flex;flex-direction:column;gap:2px}
.tp-sum-k{font-family:var(--tp-hand);font-size:11.5px;letter-spacing:.2em;
  text-transform:uppercase;color:rgba(240,236,224,.5)}
.tp-sum-v{font-family:var(--tp-display);font-weight:700;font-size:17px;color:var(--tp-cloth)}
.tp-sum-v[data-tone="wax"]{color:#e2707c}
.tp-sum-v[data-tone="cold"]{color:var(--tp-cold)}

/* the host, who is the only person on the gravel who can see */
.tp-host{
  display:flex;align-items:flex-start;gap:14px;margin-top:16px;
  border-top:1px solid rgba(240,236,224,.14);padding-top:14px;
}
.tp-host-name{
  display:flex;align-items:center;gap:7px;
  font-family:var(--tp-hand);font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;
  color:rgba(240,236,224,.6);margin-bottom:4px;
}
.tp-host-line{font-family:var(--tp-hand);font-size:18px;color:#f2ead6;font-style:italic}

/* the withheld layer, which is a card that says what it is not showing */
.tp-veil{
  border:1px dashed rgba(159,176,192,.42);background:rgba(16,18,20,.7);
  padding:20px 24px;text-align:center;
}
.tp-veil-h{font-family:var(--tp-display);font-weight:700;font-size:20px;
  color:var(--tp-cold);margin:8px 0 6px}
.tp-veil p{color:rgba(240,236,224,.66);font-style:italic;margin:0}

/* ═══ CONTROLS ════════════════════════════════════════════════════════ */
.tp-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:60;
  display:flex;align-items:center;justify-content:center;gap:18px;
  padding:13px 20px;background:rgba(10,10,9,.94);
  border-top:1px solid rgba(240,236,224,.18);
}
.tp-btn{
  display:inline-flex;align-items:center;gap:7px;
  font-family:var(--tp-hand);font-size:15px;letter-spacing:.12em;text-transform:uppercase;
  padding:9px 20px;cursor:pointer;color:#f2ead6;
  background:rgba(38,38,32,.9);border:1px solid rgba(240,236,224,.3);
  transition:opacity .3s ease,background .3s ease;
}
.tp-btn:hover{background:rgba(58,56,46,.95)}
.tp-btn.tp-dim{opacity:.34;cursor:default}
.tp-counter{font-family:var(--tp-display);font-weight:700;font-size:15px;
  letter-spacing:.1em;color:rgba(240,236,224,.7)}

@media(max-width:820px){
  .tp-head,.tp-main{padding-left:20px;padding-right:20px}
  .tp-stage{margin-left:20px;margin-right:20px}
  .tp-hero{height:340px}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS — four or more variants everywhere, and none of them a fact
// ══════════════════════════════════════════════════════════════════════
//
// NOTHING IN THESE POOLS ASSERTS ANYTHING THE ENGINE DID NOT DECIDE. In
// particular there are no near-misses: the host does not pause behind
// somebody and move on, because `selectTraitors` is near-uniform and says why
// (weighting toward masterminds makes every season the same season), so a
// sentence about somebody nearly being chosen would be a claim the engine
// cannot support. What the walk is described by instead is the COUNT of
// people between one tap and the next, which is a real fact about the rank.

const ARRIVAL = [
  'They came up the drive with their bags, shook hands, introduced themselves, and stared '
  + 'up at the castle like it might tell them something. It did not.',
  'The coaches dropped them at the gate and drove off. {C} strangers dragged their luggage '
  + 'up a long gravel drive and tried to make friends before anyone had explained why they '
  + 'were here.',
  '{C} people on a gravel drive in the middle of the afternoon, learning names and '
  + 'guessing at occupations. They had not been told anything yet.',
  'A grey sky, a castle at the top of a long drive, and {c} people arriving with their '
  + 'bags and their best first impressions. None of them knew what they were walking into.',
];
// ── AND THE SAME AFTERNOON, ONCE THE PREMIERE HAS ALREADY DRAWN IT ───
//
// Plan 9 put an ARRIVAL screen above this one: the cars, the introductions and
// the whole rules briefing. Read in sequence, this screen then opened by
// narrating the drive a second time and summarising it as "Told anything:
// Nobody" -- which by that point was flatly false, because they had just been
// told all of it. Found by dumping the premiere and reading it, exactly as the
// day book's out-of-order exits were found in Task 6.
//
// So when the record carries an arrival, the opening card PICKS UP rather than
// starts again. The pool is registered off the record, never off an episode
// number, which is the rule this whole file is built on.
const RESUME = [
  'They have heard the rules now. Traitors and Faithfuls, murders and banishments, and '
  + 'the fact that {c} of them is about to be chosen. They are back on the gravel, and '
  + 'nobody is making small talk any more.',
  'The same {c} people, back out on the same drive, but quieter. They know what the game '
  + 'is now. They do not know who is about to be picked to play the other side of it.',
  'Ten minutes ago they were strangers shaking hands. Now they know that some of them will '
  + 'be chosen as Traitors, and every handshake feels different.',
  'Bags still on the gravel. Rules explained. {C} people standing in the cold, waiting to '
  + 'find out which of them will be asked to lie to the rest.',
];
const GREET = [
  'In a moment I am going to choose the Traitors. You will all be blindfolded. If you feel '
  + 'a hand on your shoulder, that is your answer.',
  'I need all of you in a line. You are about to put blindfolds on, and when I walk behind '
  + 'you, some of you will feel a tap. Those people are the Traitors.',
  'Before we go any further, I need to choose who among you will be lying to everybody '
  + 'else. Line up. Blindfolds on. And do not move.',
  'Some of you want to be chosen. Some of you are terrified of it. In about two minutes '
  + 'you will all find out, and you will not be allowed to react.',
];
const BLINDFOLD = [
  'The blindfolds went on and the drive went silent. Without their eyes, every sound on '
  + 'the gravel became enormous — the wind, somebody shifting their weight, a bird somewhere '
  + 'behind the castle.',
  '{C} blindfolds, tied at the back. The last thing any of them saw was the person standing '
  + 'next to them. After that, nothing but the sound of their own breathing.',
  'One by one, the cloth went over their eyes and was tied tight. The chatter stopped. '
  + 'Nobody wanted to be the last person still talking.',
  'They stood there blind, arms at their sides, trying to keep their breathing steady. '
  + 'Some of them were visibly shaking. All of them were listening.',
];
const RANK = [
  '{N} of them, shoulder to shoulder across the front of the castle, blindfolded and '
  + 'standing completely still. From the outside it looks like a firing squad. From the '
  + 'inside it feels like one.',
  'A line of {n} people stretched across the gravel, each of them facing forward and '
  + 'seeing nothing. Their hands were clenched. Some of them were counting heartbeats.',
  '{N} in a row, blindfolded, waiting. None of them knew who was standing next to them any '
  + 'more. None of them would be able to say afterwards where in the line they had been.',
  'The line filled the width of the drive. {N} people, all blind, all quiet, all trying to '
  + 'figure out whether the host was already behind them or still at the front.',
];
const WALK = [
  'The footsteps started behind the line. Slow, deliberate, crunching on the gravel. '
  + 'Every person in the rank could hear exactly where the host was. Nobody could see.',
  'One set of footsteps, walking the length of the line. The host paused behind shoulders, '
  + 'let the silence stretch, and moved on. Some of those pauses meant nothing. Some of '
  + 'them meant everything.',
  'The walk began at one end of the rank and moved slowly along it. The host stopped, '
  + 'started, shuffled a coat sleeve, let a shoe scrape the gravel. Every sound was '
  + 'designed to make it impossible to know what was real.',
  'Crunch. Crunch. Crunch. Then silence. Then crunch again. Every person in that line was '
  + 'trying to count the steps and place the host behind a specific shoulder, and every '
  + 'one of them was wrong.',
];
// The tap, from the outside — what the audience sees land.
const TAP_SEEN = [
  "The host stops behind {who} and places a hand on {who}'s shoulder. {Who} does not "
  + 'move. Does not flinch. The hand lifts, and the footsteps continue.',
  'The footsteps go quiet behind {who}. A flat hand, pressed firmly onto the shoulder. '
  + '{Who} swallows hard but keeps completely still. The walk resumes.',
  "The hand lands on {who}, holds for a long second, and lifts. {who}'s jaw tightens "
  + 'under the blindfold but nothing else moves. The people on either side have no idea '
  + 'what just happened.',
  'The host taps {who} on the shoulder — slow, unmistakable. {Who} breathes in sharply '
  + 'through the nose and then forces it back to normal. The gravel starts up again.',
  "A hand on {who}'s shoulder. The person standing next to {who} is close enough to hear "
  + 'the fabric move, but blindfolded, that sound could be anything.',
];
// The tap, from inside the cloth, when it is YOUR shoulder.
const TAP_MINE = [
  'A hand on your shoulder. Your stomach drops. You do not move, you do not breathe, you '
  + 'do not make a sound. The hand lifts, and the footsteps walk away.',
  'You feel it land — a firm hand, pressing down on your shoulder. Your heart is hammering '
  + 'but your face is behind a blindfold and nobody can see it. You are a Traitor now.',
  'The gravel goes quiet right behind you. Then the hand. You clench every muscle in your '
  + 'body to stop yourself from reacting. The people next to you cannot know.',
  'It is you. You have been chosen. You have no idea who else was tapped and you will not '
  + 'find out until you are taken upstairs.',
];
// The tap, from inside the cloth, when it is somebody else's.
const TAP_HEARD = [
  'The footsteps stop somewhere along the line. There is a long pause. Then they start '
  + 'again. Someone was just tapped, and you have no idea who.',
  'You hear the gravel go quiet — somewhere to your left, or maybe your right. A pause. '
  + 'Then the walking picks back up. Somebody near you just became a Traitor.',
  'The host stops. You hold your breath, but the hand does not come for you. The footsteps '
  + 'resume. Whoever it landed on is standing somewhere in this line, saying nothing.',
  "A pause in the footsteps. Your heart pounds. But the hand is on someone else's "
  + 'shoulder — you cannot tell whose. The walk continues.',
];
// FOUR VARIANTS, EACH WRITTEN TWICE, because the gap between two taps is
// routinely ONE. Task 8 shipped "They denied it, and was believed" across
// eleven lines by writing one pool under a subject whose number varies; a
// count is the same trap with a noun instead of a verb, and "one people
// further along the rank" is what it reads like.
const GAP = {
  one: [
    'only one person between this tap and the last.',
    'just one shoulder apart from the previous.',
    'one person further along the line.',
    'barely a step from the last one.',
  ],
  many: [
    '{n} people between this tap and the last.',
    '{n} shoulders further along the line.',
    '{n} people passed between them.',
    'the host walked past {n} others before stopping again.',
  ],
  none: [
    'right next to the last one.',
    'the very next person in line — no gap at all.',
    'immediately beside the previous tap.',
    'shoulder to shoulder with the last one, though neither of them knows it.',
  ],
};
const UNMASK = [
  'The blindfolds come off. Everyone blinks in the light, looks around, laughs nervously. '
  + '{N} of them already know something the other {m} do not, and they are smiling '
  + 'exactly the same way as everyone else.',
  'Cloth off. Daylight. And immediately, {c} people scanning each other\'s faces for '
  + 'something — a twitch, a flush, a look held too long. {N} of them are already hiding.',
  'The blindfolds are pulled off and everyone looks at each other like it\'s the first '
  + 'time. Hugs, nervous laughter, relief. {N} of them are performing every second of it.',
  'Eyes open. The castle is still there. So is everyone else. {N} of them have just been '
  + 'chosen as Traitors and they are standing right there, chatting, as if nothing happened.',
];
const TURRET = [
  'One at a time, they are sent upstairs. A narrow staircase, a heavy door, and then the '
  + 'room — small, dim, lit by a single lamp. And standing in it: the others.',
  'The turret door opens and there they are — the {n} of them, face to face, no blindfolds, '
  + 'no pretence. This is the first and last time any of them will know anything for certain.',
  '{N} people in a room at the top of the castle. The door shuts behind the last one. They '
  + 'look at each other. Nobody needs to ask.',
  'A dark staircase, a door, and then {n} faces under a lamp. These are the Traitors. This '
  + 'is the only room in the castle where nobody has to guess.',
];
// {N} IS THE CAPITALISED FORM AND {n} IS NOT, because two of these open on
// the count and two carry it mid-sentence.
const CALCULATION = [
  '{N} Traitors. {M} Faithfuls. The Faithfuls have the numbers, but the Traitors know '
  + 'who everyone is. The Faithfuls have to guess.',
  'The first thing any of them says is the maths. {N} of us against {m} of them. Every '
  + 'night, one of the {m} will be murdered. Every day, the {m} will try to find the {n}.',
  '{N} up here in the turret, {m} downstairs who have no idea. The {m} outnumber them, '
  + 'but numbers mean nothing when you do not know who to count.',
  'The odds: {n} against {m}. The advantage: the Traitors know exactly who to trust. The '
  + 'Faithfuls do not even know that much.',
];
const HOST_CLOSE = {
  audience: [
    'You have seen the selection. You know every name. Downstairs, {m} people are '
    + 'unpacking their bags next to Traitors and they have no idea.',
    '{N} Traitors, chosen. {M} Faithfuls, oblivious. The game starts at breakfast and '
    + 'you are the only one who knows the answer.',
    'The whole thing took four minutes. {N} taps on the shoulder, and now you know something '
    + 'that {m} people will spend the entire season trying to figure out.',
    'That is it. {N} Traitors are in the castle. The Faithfuls will eat with them, '
    + 'laugh with them, and try to catch them. You will watch all of it knowing who they are.',
  ],
  chosen: [
    'You know the other Traitors now. By breakfast, you will need to sit across from {m} '
    + 'people and act like nothing has changed.',
    'You have your team. You have your secret. What you do not have is a plan, and {m} '
    + 'Faithfuls are going to be watching you very closely starting tomorrow morning.',
    'Tonight you are a Traitor. Tomorrow you will smile at {m} people over breakfast '
    + 'and help them hunt for yourself.',
    'The turret door closes. The game starts in the morning. You have between now and then '
    + 'to learn how to lie to {m} people who want to find you.',
  ],
  rest: [
    'You heard the footsteps stop. You felt nothing. Somewhere in this castle, the '
    + 'Traitors are meeting each other for the first time, and you do not know who they are.',
    'The blindfold is off but you are no less in the dark. Someone standing near you on '
    + 'that gravel was chosen, and they will look you in the eye at breakfast like it never '
    + 'happened.',
    'You know there are Traitors. You do not know their names. That is the entire game, '
    + 'and it starts now.',
    'Somebody you shook hands with this afternoon is a Traitor, and they are better '
    + 'informed about this castle than you will ever be.',
  ],
};

// ══════════════════════════════════════════════════════════════════════
// PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

/** The gap between two taps, and the pool that can describe that many. */
function _gapPool(n) {
  if (n <= 0) return GAP.none;
  return n === 1 ? GAP.one : GAP.many;
}

function _card(title, label, ic, inner, tone) {
  return '<div class="tp-card"' + (tone ? ' data-tone="' + tone + '"' : '') + '>'
    + '<div class="tp-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="tp-h">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _hostBand(host, line, lit) {
  return '<div class="tp-host">' + _hostAv(host, 52, lit)
    + '<div><div class="tp-host-name">' + _ic('drive', 12)
    + _esc((host || trHost(null)).name) + '</div>'
    + '<div class="tp-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}
function _sums(bits) {
  return '<div class="tp-sums">' + bits.map(b =>
    '<span class="tp-sum"><span class="tp-sum-k">' + _esc(b[0]) + '</span>'
    + '<span class="tp-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>' + b[1]
    + '</span></span>').join('') + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the two gates, in one place, and each is TWO-STATE
// ══════════════════════════════════════════════════════════════════════

/**
 * WHAT THIS OBSERVER IS ENTITLED TO OF THE FIRST AFTERNOON.
 *
 * TWO GATES, AND THEY ARE NOT THE SAME GATE. A one-way mutation on a
 * two-state gate proves half of it (Task 3's technique, and this is its fifth
 * use in the plan), so both of these are mutated in both directions in
 * tests/tr-vp.test.js.
 *
 *   `named` — MAY THIS OBSERVER BE TOLD WHOSE SHOULDER THIS WAS?
 *     The audience always. The person whose shoulder it was, obviously. Nobody
 *     else, ever, because everybody in that rank had cloth over their eyes and
 *     what they got was a sound. This is not a styling choice: the entire
 *     format is seventeen people trying to reconstruct information they were
 *     physically prevented from receiving, and a screen that hands it over has
 *     deleted the show while looking identical.
 *
 *   `turretKnown` — MAY THIS OBSERVER SEE THE MEETING?
 *     The audience, and the three who were in it. Nobody else. And this is the
 *     gate that RESOLVES the first one: a tapped player learns the other two
 *     names HERE and nowhere earlier, which is exactly what the engine does —
 *     `seedTraitorKnowledge` is the write, at `public` credibility, because
 *     they are standing in a room together. The screen renders that moment; it
 *     does not create it, and it could not: js/vp-tr/ imports no engine state.
 *
 * The withheld names are withheld by NEVER REACHING the branch that draws
 * them — a tap the observer may not have carries `name: null` — so a later
 * edit to the card cannot leak one.
 *
 * ── AND THE SCREEN IS COMPOSED FOR THE AUDIENCE, NOT FOR THE GATE ─────
 *
 * `observer` is `'audience'` on every reader that exists today. The player
 * layers are here because the signature is free now and a rewrite later, and
 * because interactive mode will need them — but they are a LAYER, not the
 * design brief, and an earlier pass had this backwards: it composed the
 * screen around what could be hidden and the audience got a page shaped by a
 * mechanism nobody is looking through.
 *
 * THE AUDIENCE KNOWS. That is the format. The viewer watches three people get
 * tapped, is told exactly who they are, and then watches the other seventeen
 * fail to work it out for nine episodes — and the not-knowing belongs to the
 * people on the gravel, not to the person watching them. Dramatic irony is
 * the product and it requires the audience to hold BOTH halves, which is what
 * the conclave's last beat already says out loud: you are the only one who
 * saw both rooms.
 *
 * So the audience layer is the full one and it is the one the composition is
 * built for: the names, the places in the rank, the marks on the shoulders,
 * the turret at full size, and a closing beat that puts the three back among
 * the rest with the gap made explicit.
 */
function _view(ep, observer) {
  const s = ep && ep.tr && ep.tr.selection;
  if (!s || !Array.isArray(s.taps) || !s.taps.length) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const line = Array.isArray(s.line) ? [...s.line] : [];
  const chosen = Array.isArray(s.chosen) ? [...s.chosen] : [];
  const wasTapped = !!watcher && chosen.indexOf(watcher) >= 0;

  const turretKnown = isAudience || wasTapped;

  const taps = s.taps.map((t, i) => {
    const named = isAudience || (!!watcher && watcher === t.name);
    return {
      order: i,
      // NOT PRESENT AT ALL where this observer never learned it.
      name: named ? t.name : null,
      at: named ? t.at : null,
      named,
      mine: !!watcher && watcher === t.name,
    };
  });

  return {
    ep: s.ep != null ? s.ep : (ep.num || 1),
    isAudience,
    watcher,
    inLine: isAudience || (!!watcher && line.indexOf(watcher) >= 0),
    wasTapped,
    turretKnown,
    line,
    taps,
    tapCount: s.taps.length,
    // The turret's roll, and it is null rather than empty where it is withheld.
    turret: turretKnown ? [...(s.turret || chosen)] : null,
    // -- THE CEREMONY, AND IT IS THE SAME FOR EVERY READER (Plan 9, Task 2)
    //
    // Not behind either gate, and it must never be put behind one. Every line
    // here was said out loud to a rank of people with cloth over every face,
    // and it names nobody: the record's own writer is forbidden from putting a
    // name in a beat for exactly this reason. What separates the three layers
    // is who felt a hand, not who heard a sentence, and a speech withheld from
    // a layer would be a layer that never learns the rules of the game it is
    // about to be played by.
    // Did the premiere already draw the drive and the briefing? Read off the
    // RECORD, never off the episode number.
    afterBriefing: !!(ep && ep.tr && ep.tr.arrival
      && Array.isArray(ep.tr.arrival.introductions) && ep.tr.arrival.introductions.length),
    // The host, resolved ONCE per render and carried on the view, because the
    // resolution now reads the record and the record is only reachable here.
    host: trHost(ep),
    staging: s.staging || '',
    hostBeats: (s.hostBeats || []).map(b => ({ ...b })),
    contestantBeats: (s.contestantBeats || []).map(b => ({ ...b })),
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

/**
 * THE HOST'S WORDS, WHICH ARE ON THE RECORD AND NOT IN THIS FILE.
 *
 * Every pool above is NARRATION -- what the afternoon looked like -- and none
 * of it is a rule. The rules are a ceremony, they are written once by
 * `_selectionRecord` in js/tr/headless.js, and this draws them: complete
 * spoken lines, one card each, with the staging under them.
 *
 * ONE CARD PER BEAT AND NOT ONE CARD FOR THE SPEECH. A ceremony is a sequence
 * of actions and the tension in it comes from being made to wait between two
 * of them; the whole address in a single oversized card is a paragraph, and a
 * paragraph is what the writing contract calls the shortcut by name.
 *
 * `group` is `null` before any hand lands, a tap ORDER for the lines spoken
 * between hands, and 'final' for the two at the front of the rank at the end.
 * The record clamps those orders to the taps that actually exist, because
 * `traitorCount` is configurable and a line pinned to the second hand of a
 * one-Traitor season is a line nothing ever reaches.
 */
function _same(a, b) {
  if (a == null && b == null) return true;
  return a === b;
}
function _pushCeremony(v, group, phase, push) {
  const spoken = (v.hostBeats || []).filter(b => _same(b.afterTap, group));
  if (!spoken.length) return;
  const reacts = (v.contestantBeats || []).filter(b => _same(b.afterTap, group));
  spoken.forEach((b, i) => {
    const last = i === spoken.length - 1;
    push(phase, _card('', b.ruleId ? 'The rules, said out loud' : 'On the gravel',
      'chevron',
      _hostBand(v.host, _esc(b.text))
      + (b.action ? '<p class="tp-quiet">' + _esc(b.action) + '</p>' : '')
      + (last ? reacts.map(r => '<p class="tp-quiet">' + _esc(r.text) + '</p>').join('') : '')),
    { kind: 'rules', ruleId: b.ruleId || null });
  });
}

function _buildBeats(v) {
  const beats = [];
  const key = 'tp|' + v.ep + '|' + v.line.length + '|' + v.tapCount;
  const used = new Set();
  const push = (phase, html, meta) => beats.push({ phase, html, meta: meta || null });
  const n = v.line.length;
  const others = Math.max(0, n - v.tapCount);
  // ONE SUBSTITUTION TABLE FOR EVERY POOL. Lower case for mid-sentence and
  // upper for the head of one; `{c}` is the whole rank, `{n}` the tapped and
  // `{m}` everybody else. Nothing in these pools may write a count as a
  // literal: `traitorCount` is configurable and the cast is whatever the
  // season was built with, so "three of them are lying already" over a
  // one-Traitor season is a sentence the screen has simply made up.
  const S = {
    n: _word(v.tapCount), N: _Word(v.tapCount),
    m: _word(others), M: _Word(others),
    c: _word(n), C: _Word(n),
  };

  // ── the drive, or the ten minutes after it ──────────────────────────
  //
  // The host band is dropped on a record that has an arrival on it: the host
  // has already welcomed this cast, at length, one screen earlier. A second
  // welcome from the same person in the same hour is the format's host
  // introducing themselves twice.
  push('arrival', v.afterBriefing
    ? _card('Back Out Onto The Gravel', 'The arrival', 'trunk',
      '<p>' + _fill(_pick(RESUME, key + '|resume'), S) + '</p>'
      + _sums([
        ['In the rank', String(n), null],
        ['Told the rules', 'All of them', null],
        ['Told who', 'Nobody', 'cold'],
      ]))
    : _card('Up The Drive', 'The arrival', 'trunk',
      '<p>' + _fill(_pick(ARRIVAL, key + '|arrive'), S) + '</p>'
      + _sums([['In the rank', String(n), null], ['Told anything', 'Nobody', 'cold']])
      + _hostBand(v.host, _esc(_pick(GREET, key + '|greet')))),
  { kind: 'arrival' });

  // ── the cloth ───────────────────────────────────────────────────────
  push('blindfold', _card('The Bands Go On', 'The blindfold', 'band',
    '<p>' + _fill(_pick(BLINDFOLD, key + '|band'), S) + '</p>', 'cold'),
  { kind: 'blindfold' });

  // ── the rank ────────────────────────────────────────────────────────
  push('blindfold', _card('The Rank', 'The line', 'rank',
    '<p>' + _fill(_pick(RANK, key + '|rank'), { ...S, n: S.c, N: S.C }) + '</p>'),
  { kind: 'rank' });

  // ── the walk ────────────────────────────────────────────────────────
  push('walk', _card('The Walk', 'Gravel', 'drive',
    '<p>' + _fill(_pick(WALK, key + '|walk'), S) + '</p>'
    + '<p class="tp-quiet">' + (v.isAudience
      ? _fill('{N} of them will be tapped. The other {m} will hear the footsteps stop '
        + 'and never find out whose shoulder it was.', S)
      : (v.wasTapped
        ? 'Somewhere in this walk, a hand is going to land on your shoulder.'
        : 'The hand never comes for you. But you do not know that yet.'))
    + '</p>'),
  { kind: 'walk' });

  // ── what the host says before a single hand has moved ───────────────
  //
  // BEFORE, and that ordering is the ceremony's whole claim: nobody may feel a
  // hand on a shoulder without already having been told what one means.
  _pushCeremony(v, null, 'walk', push);

  // ── the three taps ──────────────────────────────────────────────────
  //
  // ONE BEAT EACH, IN WALK ORDER, and the walk order is the record's `taps`
  // rather than its `chosen`: the draw order is an artefact of how the rng was
  // consumed and nobody on the gravel lived through it.
  let prev = -1;
  for (const t of v.taps) {
    let inner;
    let tone = 'wax';
    if (t.named) {
      const line = _pickUnique(t.mine ? TAP_MINE : TAP_SEEN, key + '|tap|' + t.order, used);
      inner = '<div class="tp-who">' + _av(t.name, 54)
        + '<div><div class="tp-who-nm">' + _esc(t.name) + '</div>'
        + '<div class="tp-who-sub">' + (t.mine
          ? 'You. And that is the whole of what you were given.'
          : 'Blindfolded, and gave away nothing.')
        + '</div></div></div>'
        + '<p>' + _fill(_esc(line), { who: _esc(t.name), Who: _esc(t.name) }) + '</p>'
        + '<div class="tp-place">' + _ic('rank', 15)
        + '<span>Standing at </span><b>' + (t.at + 1) + '</b>'
        + '<span>of ' + n + ' in the rank'
        + (prev >= 0 ? ', ' + _fill(_pick(_gapPool(t.at - prev - 1), key + '|gap|' + t.order),
          { n: _word(Math.max(0, t.at - prev - 1)) }) : '')
        + '</span></div>';
      prev = t.at;
    } else {
      // WITHHELD BY NOT BEING THERE. No name, no position, no gap count —
      // a gap count is a position with one step of arithmetic in front of it.
      tone = 'cold';
      inner = '<div class="tp-who"><span class="tp-anon">'
        + _ic('band', 30, 'rgba(159,176,192,.7)') + '</span>'
        + '<div><div class="tp-who-nm"><em>Somewhere in the line</em></div>'
        + '<div class="tp-who-sub">A sound, and no direction to it.</div></div></div>'
        + '<p>' + _pickUnique(TAP_HEARD, key + '|heard|' + t.order, used) + '</p>';
    }
    push('walk', _card(_ord(t.order).charAt(0).toUpperCase() + _ord(t.order).slice(1)
      + ' Shoulder', 'The tap', 'tap', inner, tone), { kind: 'tap', order: t.order });
    _pushCeremony(v, t.order, 'walk', push);
  }

  // ── the last of it, at the front of the rank ────────────────────────
  _pushCeremony(v, 'final', 'unmask', push);

  // ── the cloth comes off ─────────────────────────────────────────────
  push('unmask', _card('The Bands Come Off', 'Afterwards', 'band',
    '<p>' + _fill(_pick(UNMASK, key + '|unmask'), S) + '</p>'
    + _sums([
      ['Standing there', String(n), null],
      ['Who know', v.isAudience
        ? _Word(v.tapCount) + ' of them, and you'
        : (v.wasTapped ? 'You, and the others upstairs' : 'Not you'), 'wax'],
      ['Who can prove it', 'Nobody', 'cold'],
    ])),
  { kind: 'unmask' });

  // ── the turret ──────────────────────────────────────────────────────
  if (v.turretKnown && v.turret && v.turret.length) {
    const roll = v.turret.map(name =>
      '<div class="tp-three-one">' + _avLit(name, 84, 'wax')
      + '<div class="tp-three-nm">' + _esc(name) + '</div>'
      + '<div class="tp-three-sub">' + (v.watcher === name ? 'You' : 'A Traitor, from tonight')
      + '</div></div>').join('');
    push('turret', _card('The Turret', 'The meeting', 'cloak',
      '<p>' + _fill(_pick(TURRET, key + '|turret'), S) + '</p>'
      + '<div class="tp-three">' + roll + '</div>'
      + '<p class="tp-quiet">' + (v.wasTapped
        ? 'These are the only names you will ever know for sure. Every other suspicion, every '
          + 'other accusation — you will have to earn those.'
        : 'This is the only certain knowledge in the entire game. From here on, everything '
          + 'anyone believes about anyone is a guess.')
      + '</p>', 'lamp'),
    { kind: 'turret' });

    push('turret', _card('The First Count', 'The arithmetic', 'tally',
      '<p>' + _fill(_pick(CALCULATION, key + '|calc'),
        { ...S, n: _word(v.turret.length), N: _Word(v.turret.length) }) + '</p>'
      + _sums([
        ['Upstairs', _word(v.turret.length), 'wax'],
        ['Downstairs', _word(others), 'cold'],
        ['Knew before tonight', 'Nobody', null],
      ]), 'lamp'),
    { kind: 'count' });
  } else {
    // THE LAYER THAT RENDERS NOTHING, and it renders nothing because nothing
    // is what this person got. Not a redaction — an absence.
    push('unmask', '<div class="tp-veil">'
      + _ic('band', 76, 'rgba(159,176,192,.34)')
      + '<div class="tp-veil-h">You Were Not Called Up</div>'
      + '<p>' + _fill('{N} people were taken upstairs tonight to meet each other as Traitors. '
        + 'You were not one of them. You do not know who they are. That is the game.', S) + '</p></div>',
    { kind: 'veil' });
  }

  // ── BOTH ROOMS, AND THIS BEAT IS THE PRODUCT ───────────────────────
  //
  // The audience is the only reader who holds the two halves at once, and
  // holding them at once is the format. So it is drawn: the tapped on one
  // side, everybody else on the other, one rule between them, and the caption
  // says what the gap is going to cost. Not offered to a player layer,
  // because "and the rest of them have no idea" is a claim about a room
  // nobody in the rank can see into.
  if (v.isAudience) {
    // THE NAMES ARE ON IT, NOT JUST THE FACES. Read back as a transcript this
    // card was two headings and a caption with nothing between them, because
    // all of its content was pictures — found by dumping a season and reading
    // it, which is how every prose defect in nine plans has been found.
    const us = v.taps.filter(t => t.name).map(t =>
      '<span class="tp-both-one">' + _av(t.name, 46)
      + '<span class="tp-both-nm">' + _esc(t.name) + '</span></span>').join('');
    const rest = v.line.filter(nm => !v.taps.some(t => t.name === nm));
    const them = rest.map(nm => _av(nm, 30)).join('');
    push('turret', _card('Both Rooms', 'What you now have', 'tally',
      '<div class="tp-both">'
      + '<div class="tp-both-side"><div class="tp-both-h">Upstairs, and you know it</div>'
      + '<div class="tp-both-faces" data-side="us">' + us + '</div></div>'
      + '<div class="tp-both-rule"></div>'
      + '<div class="tp-both-side"><div class="tp-both-h">Downstairs &mdash; '
      + _word(rest.length) + ', and not one of them knows</div>'
      + '<div class="tp-both-faces" data-side="them">' + them + '</div>'
      + '<div class="tp-both-list">' + _esc(rest.join(', ')) + '</div></div>'
      + '</div>'
      + '<p class="tp-both-cap">' + _fill('You know who the Traitors are. The {m} '
        + 'Faithfuls do not. They will spend the rest of the season trying to find out what '
        + 'you already know.', S) + '</p>', 'lamp'),
    { kind: 'both' });
  }

  // ── the host, last ──────────────────────────────────────────────────
  const closePool = v.isAudience ? HOST_CLOSE.audience
    : (v.wasTapped ? HOST_CLOSE.chosen : HOST_CLOSE.rest);
  push(v.turretKnown ? 'turret' : 'unmask',
    _card('', 'And that is the twist', 'chevron',
      _hostBand(v.host, _esc(_fill(_pick(closePool, key + '|close'), S)),
        v.turretKnown),
      v.turretKnown ? 'lamp' : null),
    { kind: 'close' });

  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE RANK — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trSelection`, because a <script> tag inside innerHTML does
// not execute. Gated on `idx` in BOTH directions: a hand appears on a shoulder
// only once its own beat has been read, and the bands come off only once that
// beat has. A stage that shows the finished picture on the first click has
// spoiled the one screen in this set whose entire subject is not knowing.

function _rank(state, idx) {
  const v = state.v;
  const seen = state.stepMeta.slice(0, Math.max(0, idx + 1)).filter(Boolean);
  const kinds = new Set(seen.map(m => m.kind));
  const tapsRead = new Set(seen.filter(m => m.kind === 'tap').map(m => m.order));
  const banded = kinds.has('blindfold') && !kinds.has('unmask');
  const off = kinds.has('unmask');

  // Where the host has got to, as a percentage along the rank. Audience only —
  // where the host had reached is something you can only know with your eyes open.
  let walkPct = 0;
  if (v.isAudience && kinds.has('walk')) {
    const done = v.taps.filter(t => tapsRead.has(t.order) && t.at != null);
    walkPct = done.length
      ? ((done[done.length - 1].at + 0.5) / Math.max(1, v.line.length)) * 100
      : 0;
    if (kinds.has('unmask')) walkPct = 100;
  }

  const marked = new Map();
  for (const t of v.taps) {
    if (t.named && t.at != null && tapsRead.has(t.order)) marked.set(t.name, t.order);
  }

  const figs = v.line.map(name => {
    const isYou = !!v.watcher && v.watcher === name;
    const tap = marked.has(name);
    // The band is on the face only between the beat that ties it and the beat
    // that takes it off. Before and after, `data-off` lifts it.
    return '<div class="tp-fig"' + (isYou ? ' data-you="1"' : '')
      + (tap ? ' data-tap="1"' : '') + (banded ? '' : ' data-off="1"') + '>'
      + (tap ? '<span class="tp-hand-mark">' + _ic('tap', 15, 'currentColor') + '</span>' : '')
      + _av(name, 32)
      + '<span class="tp-band"></span>'
      + '<span class="tp-fig-nm">' + _esc(String(name).split(' ')[0]) + '</span>'
      + '</div>';
  }).join('');

  const foundSoFar = marked.size;
  const foot = [];
  foot.push('<span><b>' + v.line.length + '</b> in the rank</span>');
  if (v.isAudience) {
    foot.push('<span data-tone="wax"><b>' + foundSoFar + '</b> of '
      + v.tapCount + ' tapped so far</span>');
  } else if (v.wasTapped) {
    foot.push('<span data-tone="wax"><b>' + (marked.size ? 'You' : '&mdash;')
      + '</b> were tapped</span>');
    foot.push('<span><b>' + (kinds.has('turret') ? v.tapCount - 1 : '?')
      + '</b> others, learned upstairs</span>');
  } else {
    foot.push('<span><b>' + (kinds.has('walk') ? v.tapCount : '—')
      + '</b> stops heard, none placed</span>');
  }
  foot.push('<span><b>' + (off ? 'Off' : (kinds.has('blindfold') ? 'On' : '—'))
    + '</b> blindfolds</span>');

  return '<div class="tp-rank">'
    + '<div class="tp-rank-h"><span>The rank, as it stood</span>'
    + '<b>' + (off ? 'After' : (kinds.has('walk') ? 'The walk' : 'Before')) + '</b></div>'
    + '<div class="tp-rank-line">' + figs + '</div>'
    + (v.isAudience
      ? '<div class="tp-walker"><i style="left:calc(' + walkPct.toFixed(1) + '% - 6px)"></i></div>'
      : '')
    + '<div class="tp-rank-foot">' + foot.join('') + '</div>'
    + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'selection-' + (epNum || 0); }
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
    const el = document.getElementById('tp-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('tp-vis'); else el.classList.remove('tp-vis');
  }
  const counter = document.getElementById('tp-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('tp-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.tp-btn').forEach(b => b.classList.toggle('tp-dim', done));
  }
  const shell = document.getElementById('tp-shell-' + suffix);
  const last = document.getElementById('tp-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase',
    last.getAttribute('data-phase') || 'arrival');
  if (scroller) scroller.scrollTop = top;
}

function _updateRank(epNum, idx) {
  const el = document.getElementById('tp-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trSelection) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _rank(state, idx);
}

/** Bring the new card into view, UNDER the rank rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('tp-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trSelectionRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('tp-step-' + suffix + '-' + st.idx));
  _updateRank(epNum, st.idx);
}

export function trSelectionRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateRank(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildSelection(ep, observer)` — the blindfold and the tap.
 *
 * `ep` is the episode-one `episodeHistory` row and no other: `tr.selection` is
 * written once, at the top of `playTraitorsSeason`, and `TRAITORS_SCREENS`
 * registers this screen off the presence of that field rather than off an
 * episode number — which is the same rule every other castle screen is
 * registered by, and the reason a mission-less night gets no afternoon.
 *
 * `observer` is `'audience'` or `'player:<Name>'`; `_view` is where the two
 * gates live and it is the only place either question is answered.
 */
export function rpBuildSelection(ep, observer = 'audience') {
  const suffix = 'selection';
  const vars = '--tp-grain-src:' + _noiseTile('0.92', 4, 23, 0.3, 220) + ';';
  const css = '<style>' + TP_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v) {
    return '<div class="tp-root" style="' + vars + '">' + css
      + '<div class="tp-shell" data-phase="arrival">'
      + '<div class="tp-scenery" aria-hidden="true">'
      + '<div class="tp-yard"></div><div class="tp-far">' + _far() + '</div>'
      + '<div class="tp-vig"></div><div class="tp-grain"></div></div>'
      + '<div class="tp-body"><div class="tp-main"><div class="tp-veil">'
      + _ic('drive', 76, 'rgba(159,176,192,.34)')
      + '<div class="tp-veil-h">Nobody Arrived Tonight</div>'
      + '<p>The cast came up this drive once and it was not this evening.</p>'
      + '</div></div></div></div></div>';
  }

  const beats = _buildBeats(v);
  const total = beats.length;
  const epNum = ep.num || v.ep || 1;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trSelection = window.__trSelection || {};
    window.__trSelection[epNum] = state;
  }

  const observerBadge = v.isAudience
    ? '<div class="tp-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; you see every tap, every name, and the meeting '
      + 'in the turret. The players see none of it.</em></div>'
    : '<div class="tp-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; ' + (v.wasTapped
        ? 'you were tapped. You see the turret meeting. You do not see the other taps.'
        : 'you were not tapped. You hear footsteps and pauses. You see nothing.')
      + '</em></div>';

  // The Round Table's first-paint pattern: visibility is baked in from `st.idx`
  // at emit time, because `conclave.js` relied on a click and shipped a screen
  // that was blank until the viewer pressed something.
  const stream = beats.map((b, i) =>
    '<div class="tp-beat' + (i <= st.idx ? ' tp-vis' : '')
    + '" id="tp-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="tp-root" style="' + vars + '">' + css
    + '<div class="tp-shell" id="tp-shell-' + suffix + '"'
    + ' data-phase="' + beats[0].phase + '">'
    + '<div class="tp-scenery" aria-hidden="true">'
    + '<div class="tp-yard"></div>'
    + '<div class="tp-ashlar"></div>'
    + '<div class="tp-far">' + _far() + '</div>'
    + '<div class="tp-mid">' + _mid(epNum + '|' + v.line.length) + '</div>'
    + '<div class="tp-fore">' + _fore() + '</div>'
    + '<div class="tp-wash"></div>'
    + '<div class="tp-vig"></div>'
    + '<div class="tp-grain"></div>'
    + '</div>'
    + '<div class="tp-body">'
    + '<div class="tp-hero">' + _heroScene(v.line.length)
    + '<div class="tp-hero-lock">'
    // TASK 7's carried note: "Day 1" and not "Season I - Day I" — the episode
    // record carries no season number, and the other eight screens say so too.
    + '<div class="tp-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; The First Afternoon</div>'
    + '<h1 class="tp-title">THE SELECTION</h1>'
    + '<div class="tp-title-rule"><i></i>' + _icon('cloak', 36, '#c9c2ac') + '<i></i></div>'
    + '<p class="tp-sub">'
    + (v.isAudience
      ? _Word(v.line.length) + ' people, blindfolded, in a line. The host walks behind them '
        + 'and taps ' + _word(v.tapCount) + ' on the shoulder. You will see every tap. They '
        + 'will not.'
      : _Word(v.line.length) + ' people, blindfolded, in a line. The host walks behind them '
        + 'and taps ' + _word(v.tapCount) + ' on the shoulder. You are standing in that line.')
    + '</p>'
    + '</div></div>'
    + '<header class="tp-head">' + observerBadge + '</header>'
    + '<div class="tp-stage" id="tp-stage-inner">' + _rank(state, st.idx) + '</div>'
    + '<main class="tp-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="tp-controls" id="tp-controls-' + suffix + '">'
    + '<button class="tp-btn" onclick="' + call('trSelectionRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="tp-counter" id="tp-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="tp-btn" onclick="' + call('trSelectionRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
