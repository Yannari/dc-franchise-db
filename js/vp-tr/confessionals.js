// ══════════════════════════════════════════════════════════════════════
// vp-tr/confessionals.js — a player alone with the camera, being wrong
// ══════════════════════════════════════════════════════════════════════
//
// THE FORMAT RUNS ON THESE. Total Drama has confessionals and treats them as
// garnish; this show cannot work without them, because the whole engine of it
// is DRAMATIC IRONY and irony needs a voice to be ironic about. A board of
// weights (Task 10) tells you the room is 71% wrong. A person saying "it is
// Beardo, it has been Beardo since the first night" while the audience knows
// perfectly well that it is not tells you the same thing and is unbearable.
//
// ── GENERATED FROM BELIEF, NEVER FROM GROUND TRUTH ────────────────────
//
// Every word anybody speaks on this screen is composed out of THEIR OWN ENTRY
// on `tr.beliefs.boards` -- the name, the score, the tier, and `learn()`'s own
// `source` string for why. Nothing a speaker says is checked against the truth
// before it is said, because a Faithful's confessional is exactly as wrong as
// their suspicion is and the wrongness is the product. `truth` is read in ONE
// place on this page, the strip headed "What the camera knows", it is drawn
// OUTSIDE the frame the speaker is inside, and it is audience-only.
//
// ── A TRAITOR'S IS A PERFORMANCE, NOT A CONFESSION ────────────────────
//
// Nobody in that chair ever says what they are. A Traitor's confessional has to
// work as a Faithful's -- "somebody in this castle sat down last night and
// decided who was not going to wake up" is true out of any mouth in the
// building, and only the audience hears the second half of it. So the pact
// pools are written Faithful-passable, and the one thing a Traitor holds that
// nobody else could is never spoken:
//
//   NOBODY SPEAKS A `certain` BELIEF. `certain` is `public` and only `public`
//   (js/tr/export.js), and about a LIVING person that is the turret and nothing
//   else -- the pact seeing each other, or a recruit being shown it. It is
//   removed at the source, in `_speakable()`, so no pool and no later edit to a
//   card can reach it.
//
// AND A TRAITOR NAMING A TRAITOR IS NOT THE SAME THING, which is why the filter
// is `certain` and not alignment. A recruit is shown SOME of the pact and not
// all of it -- measured on seed 7, Alejandro joins on day 2 knowing Brick for
// certain and carrying a 0.46 deduction against Brody, who is also one of them.
// Him saying "Brody" out loud is not the pact being named; it is a Traitor who
// does not know, which is the best joke this format has. The camera strip has
// its own line for it.
//
// ── AND WHO SPEAKS IS COMPOSED, NOT RANKED ────────────────────────────
//
// Task 10's most useful finding: its "Inside one head" section turned out to be
// three Traitors EVERY SINGLE NIGHT, because sorting every board by its
// strongest read always puts the pact on top -- a turret belief is worth 0.84
// and the best a Faithful ever holds is a fifth of that. A single ranking rule
// silently selects one kind of person. So this screen does not rank at all: it
// fills four NAMED SEATS (the room's name, a reader, the pact, somebody
// adrift), and inside each seat the choice is a merit shortlist with a
// deterministic per-night rotation on top of it, so no one person owns a seat
// for a season. The distribution is measured in the task report rather than
// assumed.
//
// SHARED, as everything in this directory is: the type system, the neutral
// `_portrait()`, `_icon()` for objects that must be the same drawing on every
// screen, the reveal machinery, and TR_NAV_TOP / TR_STICKY_TOP for the nav
// offset -- one constant, and this file does not add another literal.
import { players } from '../core.js';
import { PORTRAIT_CSS, TR_NAV_TOP, TR_STICKY_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

// NO EXIT VERB IMPORTED, for the reason suspicion.js and selection.js give:
// nobody leaves on this screen. It is a room with a chair in it.

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── deterministic picking, and no rng anywhere in this file ───────────
//
// The castle's own answer to this is `lineFor()` in js/tr/castle/lines.js, and
// it exists because `fire(ctx, rng)` shares the season's rng stream: one extra
// draw for a cosmetic reason reroutes the whole season (measured, Plan 5 --
// 38 of 41 low-count branches moved). A SCREEN HAS NO RNG AT ALL, and it may
// not import from js/tr/ either (guarded in tests/tr-vp.test.js: a screen is
// handed a record and cannot reach past it). So this is the same technique in
// the same shape as every other file in js/vp-tr/ -- a hash of state the beat
// already has, consuming nothing, reproducible, and varied by night and by who
// is in the chair.
function _hash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  // A FINALISER, AND IT IS NOT OPTIONAL HERE. Raw FNV-1a barely avalanches:
  // two keys differing only in their LAST character come out within about
  // 1/256 of each other, because the final step is one xor of a small value
  // followed by one multiply. Every line on this screen is a pair drawn with
  // two keys that differ in one character, so without this the second half
  // landed on the same index as the first almost every time -- the pools
  // printed "It is not a feeling. I want it on the record that it is not a
  // feeling." because A[4] could only ever meet B[4]. MEASURED: 50 of 60
  // seasons repeated a line three times with the raw hash, and one line five
  // times, on pools whose width predicts a worst case of two. This is
  // MurmurHash3's finaliser and it costs two multiplies.
  //
  // AND IT IS NOT OPTIONAL *HERE* FOR A REASON THIS FILE ORIGINALLY GOT
  // WRONG, which matters because the wrong version of it was carried into a
  // task brief as a defect present in ten other screens. Being 1/256 apart is
  // only fatal to an index taken off the TOP BITS, which is what `_idx` below
  // does. Every other file in js/vp-tr/, and `lineFor` in js/tr/castle/
  // lines.js, index with `h % pool.length` instead -- and `% len` is IMMUNE to
  // this, because the gap between the two hashes is (delta * 16777619) and
  // 16777619 is prime, so a family of keys ending in 0,1,2... walks every slot
  // exactly once before repeating. Measured both ways, 200 seasons, every
  // `_pick` site in the directory: raw `% len` reaches every slot at every
  // site, and ADDING this finaliser to those sites makes their within-season
  // repeat rate worse, not better. The pairing at the top of this file is what
  // the other screens do not have and do not need.
  //
  // The shape that IS live elsewhere is `_lineHash(k) / 4294967296` used as a
  // probability -- js/tr/endgame.js, js/tr/powers.js, js/tr/murder-variants.js.
  // Those are engine decisions on keys ending in the episode number, so they
  // are frozen across the single-digit episodes of a season; see the guard in
  // tests/tr-vp.test.js, which pins the list.
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
/** A stable 0..1 from a key. */
const _unit = s => _hash(s) / 4294967296;
/**
 * AN INDEX OFF THE TOP BITS.
 *
 * Raw FNV-1a's low bits barely mix, so `hash % 8` over keys that share a suffix
 * lands on the same index far more often than chance. This takes the top bits
 * instead — and it is NOT the thing that fixed the repetition, which is worth
 * saying because the first version of this comment claimed it was. MEASURED:
 * with the finaliser in `_hash` present, reverting this line to `hash % len`
 * changes nothing a guard can see (717 distinct spoken lines either way over
 * twenty seasons), so that mutation is a NON-mutation and is recorded as one.
 * The finaliser is the load-bearing part; this is kept because an index off the
 * top bits does not depend on the finaliser staying, and the guard that has
 * teeth is on the finaliser.
 */
const _idx = (key, len) => Math.min(len - 1, Math.floor(_unit(key) * len));
function _pick(pool, key) {
  if (!pool || !pool.length) return '';
  return pool[_idx(key, pool.length)];
}
/**
 * The same pool, without saying the same thing twice on one screen.
 *
 * Four people sit in this chair on one night and three of them draw from the
 * same pools. `_pick` hashes a key into a pool and different keys collide --
 * Task 6 found two Traitors arguing for the same victim word for word, and
 * Task 10 found the same shape drawing six names in a row.
 */
function _pickUnique(pool, key, used) {
  if (!pool || !pool.length) return '';
  const start = _idx(key, pool.length);
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

// SMALL COUNTS READ AS WORDS. Task 9 found nine hard-coded counts in one
// screen's prose, every one of which would be a lie on a season with a
// different cast size or a different number of Traitors. NO POOL IN THIS FILE
// WRITES A COUNT AS A LITERAL: `{n}` is the lower-case slot, `{N}` the
// sentence-initial one.
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty'];
const _word = n => (n >= 0 && n < WORDS.length) ? WORDS[n] : String(n);
// THE SENTENCE-INITIAL SLOT. Task 10 shipped "two of them have written Beardo
// down" with the count opening the sentence in lower case.
const _Word = n => { const w = _word(n); return w.charAt(0).toUpperCase() + w.slice(1); };
/** A plural that never has to be written twice. */
const _s = (n, one, many) => (Math.abs(Number(n)) === 1 ? one : (many || one + 's'));
const _pct = v => Math.round(Math.max(0, Math.min(1, Number(v) || 0)) * 100);

// ── faces ─────────────────────────────────────────────────────────────
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
/**
 * A face on this screen. NEUTRAL -- the lamp belongs to the alcove and not to
 * the shared helper, which is Task 1's fourth fix: a helper that bakes in one
 * screen's atmosphere forces every later screen to fight it or wear it.
 */
function _av(name, size) { return _portrait(_slugOf(name), name, size || 34); }

// ══════════════════════════════════════════════════════════════════════
// ICONS — three of them, and three borrowed
// ══════════════════════════════════════════════════════════════════════
//
// `eye`, `chair` and `chevron` come from `_icon()` in conclave.js and are NOT
// redrawn: an object that appears on more than one castle screen is the same
// drawing on all of them. These three are the ones only this room needs.
// Rendered on a sheet at 1x and 6x and looked at, which is how Task 8 caught an
// accidental ankh and Task 10 caught two more.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    // A LENS IN PROFILE, not head-on. Head-on is two concentric circles, which
    // at 13px is the `eye` this file already borrows. In profile it is a
    // barrel with a hood on the front and legs under it, and it cannot be
    // mistaken for anything else on the page.
    lens: '<path d="M9.4 6.6h11.4v8.2H9.4z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M5.6 8.8h3.8v3.8H5.6z" stroke="' + c + '" stroke-width="1.2"/>'
      + '<path d="M3.2 8.2h2.4v5h-2.4z" fill="' + c + '" opacity=".85"/>'
      + '<path d="M15 14.8v2.6M15 17.4 11.4 21.6M15 17.4l3.6 4.2M15 17.4l1 3.4"'
      + ' stroke="' + c + '" stroke-width="1.2" stroke-linecap="round"/>',
    // A ROUND-HEADED RECESS with its floor and its depth. A plain arch is
    // conclave's `arch`; what makes this one a recess is the second, inset
    // line -- the back of it, standing behind the opening.
    alcove: '<path d="M4.6 21V10.6a7.4 7.4 0 0 1 14.8 0V21" stroke="' + c
      + '" stroke-width="1.4"/>'
      + '<path d="M8.2 21v-9.4a3.8 3.8 0 0 1 7.6 0V21" stroke="' + c
      + '" stroke-width="1.1" opacity=".62"/>'
      + '<path d="M2.6 21h18.8" stroke="' + c + '" stroke-width="1.5"/>',
    // FOUR CORNER MARKS. What a shot is framed with, and it is the only thing
    // on this page allowed to be four identical strokes: the repetition is the
    // object.
    crop: '<path d="M3 8.4V3h5.4M15.6 3H21v5.4M21 15.6V21h-5.4M8.4 21H3v-5.4"'
      + ' stroke="' + c + '" stroke-width="1.6" stroke-linecap="square"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE PLANES — a dark room, a drape, and one warm pool of light
// ══════════════════════════════════════════════════════════════════════
//
// EVERY OTHER CASTLE SCREEN THAT IS A PLACE IS A STONE ONE, and drawing a
// fourth stone wall here would make the confessional look like the day, the
// selection or the table with the furniture moved. What a confessional
// actually is, is somewhere small and hung: a recess with heavy drapery behind
// the chair, so the sound is dead and the background is nothing. So the two
// full-height layers are a warm pool falling off into near-black and a slow
// vertical DRAPE, which no other screen in this directory has.
//
// THE PLANES COVER THE FULL PAGE HEIGHT -- a live-measured invariant in this
// plan, not a note. Task 5's endgame was rejected for "really black and empty"
// below the drawing, Task 8 found the same at 1500px on a 3,900px page, Task 9
// and Task 10 each pinned it by reading the rendered stylesheet. `.al-dark` and
// `.al-drape` both run top:${TR_NAV_TOP} to bottom:0 with no height cap.

/**
 * The far plane: the tall slit and the light coming through it.
 *
 * One opening, high and narrow, and the wedge of light it throws. Not a row of
 * windows -- the whole point of the room is that there is nothing in it.
 */
function _far() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><radialGradient id="alPool" cx="42%" cy="18%" r="74%">'
    + '<stop offset="0%" stop-color="#3a2c20"/><stop offset="54%" stop-color="#221a15"/>'
    + '<stop offset="100%" stop-color="#0e0b09"/></radialGradient>'
    + '<linearGradient id="alShaft" x1="0" y1="0" x2="0.6" y2="1">'
    + '<stop offset="0%" stop-color="#f0c98a" stop-opacity=".22"/>'
    + '<stop offset="70%" stop-color="#f0c98a" stop-opacity=".05"/>'
    + '<stop offset="100%" stop-color="#f0c98a" stop-opacity="0"/></linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#alPool)"/>'
    // the slit itself: a round-headed opening, deep and narrow
    + '<path d="M232 300V182a34 34 0 0 1 68 0v118z" fill="#0a0806"/>'
    + '<path d="M240 292V184a26 26 0 0 1 52 0v108z" fill="#f6dcae" opacity=".16"/>'
    // the wedge it throws across the floor
    + '<path d="M240 292 L292 292 L640 1180 L360 1180 Z" fill="url(#alShaft)"/>'
    + '</svg>';
}

/**
 * The mid plane: the dust in the shaft.
 *
 * Twenty-two motes, not two hundred, and all of them inside the wedge, because
 * dust is only visible where the light is. The selection deleted 220 gravel
 * circles for the same reason and the page was better for it.
 */
function _mid(seed) {
  const rng = _fieldRng('al|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<g class="al-motes">';
  for (let i = 0; i < 22; i++) {
    const t = rng();
    const y = 300 + t * 880;
    const spread = 26 + t * 150;
    const cx = 266 + (t * 174) + (rng() - 0.5) * spread * 2;
    s += '<circle cx="' + cx.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="'
      + (0.8 + rng() * 1.7).toFixed(1) + '" fill="#f7e2bb" opacity="'
      + (0.12 + rng() * 0.3).toFixed(2) + '"/>';
  }
  return s + '</g></svg>';
}

/** The fore plane: the dark the camera is standing in. */
function _fore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="alEdgeL" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0%" stop-color="#080605" stop-opacity=".96"/>'
    + '<stop offset="100%" stop-color="#080605" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="alEdgeR" x1="1" y1="0" x2="0" y2="0">'
    + '<stop offset="0%" stop-color="#080605" stop-opacity=".96"/>'
    + '<stop offset="100%" stop-color="#080605" stop-opacity="0"/></linearGradient>'
    + '</defs>'
    + '<rect x="0" y="0" width="244" height="1500" fill="url(#alEdgeL)"/>'
    + '<rect x="856" y="0" width="244" height="1500" fill="url(#alEdgeR)"/>'
    + '</svg>';
}

/**
 * THE HERO: the alcove, the empty chair, and the lens looking at it.
 *
 * The chair is EMPTY and that is the whole drawing. A confessional is a room
 * waiting for somebody, and every person who sits in it tonight sits in that
 * one. The lens is in the near dark on the right, a silhouette, pointed at the
 * seat -- the object that makes anything said in here a performance rather
 * than a thought.
 */
function _heroScene() {
  // THREE PASSES, AND THE FIRST TWO ARE WHY THIS ONE IS LOW AND WIDE.
  //
  // Pass one put the chair and the camera in the middle of the plate, where the
  // title lock sits: both came out as smudges behind the type and the chair
  // read as a slanted flag. Pass two moved them to the outer thirds and gave
  // the chair real proportion, and the arch then crossed THE ALCOVE at its
  // apex while a filled seat plane turned the chair into a wardrobe.
  //
  // So: NO ARCH. A round-headed recess tall enough to be a recess is tall
  // enough to hit the title, and a drawing that has to be squeezed past the
  // type is a drawing that should be something else. What is left is a valance
  // of heavy cloth, a floor, a chair and the thing pointed at it — everything
  // below the last line of the subtitle, nothing crossing anything, and the
  // artwork rule from the last three tasks honoured: if you cannot draw it
  // well, do not draw it.
  const floor = 400;
  const seatF = 322, seatB = 302, backTop = 232;
  return '<svg class="al-hero-scene" viewBox="0 0 1100 460"'
    + ' preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="alHeroBg" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#2a2018"/><stop offset="56%" stop-color="#191310"/>'
    + '<stop offset="100%" stop-color="#0b0908"/></linearGradient>'
    + '<radialGradient id="alSeatGlow" cx="50%" cy="56%" r="54%">'
    + '<stop offset="0%" stop-color="#f2cd91" stop-opacity=".26"/>'
    + '<stop offset="100%" stop-color="#f2cd91" stop-opacity="0"/></radialGradient>'
    + '<linearGradient id="alDrapeG" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#34231b"/><stop offset="100%" stop-color="#130d0a"/>'
    + '</linearGradient></defs>'
    + '<rect width="1100" height="460" fill="url(#alHeroBg)"/>'
    // THE DRAPE: a hung cloth with a slack top edge, not an arch. Two shallow
    // curves are what a heavy curtain does on a rail and they read as cloth at
    // any size.
    + '<path d="M156 ' + floor + 'V268q76-26 152 0t152-26v' + (floor - 242)
    + 'z" fill="url(#alDrapeG)"/>'
    + '<path d="M156 268q76-26 152 0t152-26" stroke="#7a5f47" stroke-width="2.4"'
    + ' fill="none"/>'
    + '<g opacity=".5">'
    + [186, 216, 246, 278, 310, 342, 372, 404, 434].map((x, i) =>
      '<path d="M' + x + ' ' + (276 + (i % 3) * 12) + 'V' + (floor - 4)
      + '" stroke="#9a7757" stroke-width="' + (i % 2 ? 1 : 1.8) + '"/>').join('')
    + '</g>'
    + '<ellipse cx="304" cy="352" rx="132" ry="66" fill="url(#alSeatGlow)"/>'
    // THE CHAIR, IN PROFILE, and that is the fourth attempt.
    //
    // Three-quarters ON is what a chair in a room looks like and it is not what
    // a chair READS as: with the back posts nearly above the front legs the
    // whole thing came out as a window frame, twice. In profile a chair is four
    // strokes anybody recognises — a back post, a seat going away from it, a
    // front leg, a rail — and the far side is the same four shifted up and
    // right. It is also the pose the empty chair is always drawn in, which is
    // the point of the image.
    + '<g stroke="#d0b087" stroke-width="2.4" stroke-linecap="round"'
    + ' stroke-linejoin="round" fill="none">'
    // the near side
    + '<path d="M250 ' + floor + 'V' + backTop + '"/>'
    + '<path d="M250 ' + seatF + 'h96l4 ' + (floor - seatF) + '"/>'
    // the far side, shifted up and to the right
    + '<path d="M266 ' + (floor - 10) + 'V' + (backTop - 10) + '" opacity=".72"/>'
    + '<path d="M266 ' + seatB + 'h96l4 ' + (floor - 10 - seatB) + '" opacity=".72"/>'
    // and the pieces that join them into one object
    + '<path d="M250 ' + backTop + 'l16-10M250 ' + seatF + 'l16-'
    + (seatF - seatB) + 'M346 ' + seatF + 'l16-' + (seatF - seatB) + '"/>'
    + '<path d="M250 268l16-10" stroke-width="1.8" opacity=".66"/>'
    + '<path d="M350 372l16-10" stroke-width="1.8" opacity=".66"/>'
    + '</g>'
    + '<path d="M120 ' + floor + 'H1010" stroke="#634c38" stroke-width="2"/>'
    // THE CAMERA. A body wider than it is tall, a barrel and a hood projecting
    // LEFT towards the chair, a viewfinder hump, and a tripod with three splayed
    // legs standing on the same floor. Pass two had a square body on a single
    // stalk, which is a television.
    + '<g fill="#100b09" stroke="#8a6b4d" stroke-width="2.4"'
    + ' stroke-linejoin="round" stroke-linecap="round">'
    + '<path d="M820 286h92v50h-92z"/>'
    + '<path d="M882 274h24v12h-24z"/>'
    + '<path d="M792 300h28v22h-28z"/>'
    + '<path d="M774 296h18v30h-18z" fill="#251b15"/>'
    + '<path d="M866 336v18"/>'
    + '<path d="M866 354 828 ' + (floor - 2) + 'M866 354 904 ' + (floor - 2)
    + 'M866 354l8 34"/>'
    + '</g>'
    + '<circle class="al-tally" cx="920" cy="278" r="5.5" fill="#d9553f"/>'
    + '</svg>';
}

function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    + '<filter id="alGrain"><feTurbulence type="fractalNoise" baseFrequency="0.82"'
    + ' numOctaves="4" seed="23"/></filter></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE STYLESHEET
// ══════════════════════════════════════════════════════════════════════
// NO BACKTICKS ANYWHERE IN HERE, INCLUDING IN COMMENTS: this is a template
// literal and one of them ends the stylesheet mid-rule (Task 2's finding).
const AL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.al-root{
  --al-ground:#211a15;
  --al-deep:#0d0a08;
  --al-warm:#e0b070;
  --al-ink:#f2e8dc;
  --al-quiet:#a8988a;
  --al-right:#7fb08c;
  --al-wrong:#c86a52;
  --al-line:rgba(224,176,112,.22);
  --al-display:'Fraunces',Georgia,'Times New Roman',serif;
  --al-hand:'IM Fell English',Georgia,serif;
  --al-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--al-ink);
  font-family:var(--al-body);
  font-size:17px;line-height:1.62;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#0b0907;
}
.al-root *{box-sizing:border-box}

.al-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--al-ground);
  box-shadow:0 0 0 1px rgba(242,232,220,.07),0 0 90px rgba(0,0,0,.92);
  overflow:visible;
  transition:background 2.2s ease;
}
/* The clip layer takes NO z-index — measured on the conclave: a shell that
   clips is a scroll container and kills sticky for every descendant, and a
   z-index here makes this a stacking context and re-grades every blend. */
.al-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

/* BOTH FULL-HEIGHT LAYERS RUN nav TO bottom, NO CAP. The invariant Tasks 5,
   8, 9 and 10 each paid for separately. */
.al-dark{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;
  pointer-events:none;
  background:
    radial-gradient(ellipse 62% 34% at 40% 8%,rgba(240,201,138,.13) 0,rgba(240,201,138,0) 100%),
    linear-gradient(180deg,rgba(33,26,21,0) 0,rgba(11,9,7,.9) 100%),
    #1a1410;
}
/* THE DRAPE. Soft wide vertical bands, which is what heavy cloth does to
   light — deliberately NOT a hairline grid: three castle screens already
   carry one and two hairline pitches on top of each other is moire. */
.al-drape{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;
  pointer-events:none;opacity:.5;
  background:repeating-linear-gradient(90deg,
    rgba(255,222,178,.045) 0 3px,
    rgba(0,0,0,.05) 3px 20px,
    rgba(255,222,178,.02) 20px 34px,
    rgba(0,0,0,.06) 34px 52px);
  animation:alBreathe 38s ease-in-out infinite alternate;
}
@keyframes alBreathe{from{background-position:0 0}to{background-position:26px 0}}

.al-far,.al-mid,.al-fore{position:absolute;left:0;right:0;top:0;height:2100px;z-index:0}
.al-far{opacity:.92}
.al-mid{opacity:.9;mix-blend-mode:screen}
.al-fore{opacity:.95}
.al-far svg,.al-mid svg,.al-fore svg{width:100%;height:100%;display:block}
.al-far::after,.al-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:420px;
  background:linear-gradient(180deg,rgba(26,20,16,0) 0,#1a1410 100%);
}
.al-motes circle{animation:alRise 26s linear infinite alternate}
@keyframes alRise{from{transform:translateY(0)}to{transform:translateY(-26px)}}

.al-vig{position:absolute;inset:0;z-index:1;pointer-events:none;
  background:radial-gradient(ellipse at 46% 26%,rgba(0,0,0,0) 30%,rgba(0,0,0,.76) 100%)}
.al-grain{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.32;
  background-image:var(--al-grain-src);background-size:220px 220px;mix-blend-mode:overlay}

/* PHASE. The light comes up as the chair fills and goes down when it empties. */
.al-shell[data-phase="open"]{background:#241c16}
.al-shell[data-phase="chair"]{background:#2a201a}
.al-shell[data-phase="close"]{background:#1c1613}

.al-body{position:relative;z-index:2}

/* ═══ THE HERO ═══════════════════════════════════════════════════════ */
.al-hero{position:relative;height:460px;overflow:hidden;
  border-bottom:1px solid var(--al-line)}
.al-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.al-tally{animation:alBlink 4.2s steps(1,end) infinite;
  transform-box:fill-box;transform-origin:50% 50%}
@keyframes alBlink{0%,64%{opacity:.95}65%,100%{opacity:.15}}
.al-hero-lock{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:flex-start;text-align:center;padding:34px 40px 0;
  background:radial-gradient(ellipse at 50% 58%,rgba(9,7,6,.68) 0,rgba(9,7,6,.3) 60%,rgba(9,7,6,.84) 100%)}
.al-eyebrow{font-family:var(--al-hand);font-size:14px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--al-warm);opacity:.92}
.al-title{font-family:var(--al-display);font-weight:900;font-size:56px;
  letter-spacing:.05em;margin:8px 0 0;line-height:1;
  text-shadow:0 2px 30px rgba(0,0,0,.9)}
.al-title-rule{display:flex;align-items:center;gap:16px;margin:14px 0 12px;width:min(560px,80%)}
.al-title-rule i{flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--al-warm),transparent)}
.al-sub{max-width:760px;font-size:19px;color:#e2d3c1;margin:0}

/* ═══ THE HEAD ═══════════════════════════════════════════════════════ */
.al-head{padding:16px 45px 0}
.al-observer{display:flex;align-items:center;gap:8px;font-family:var(--al-hand);
  font-size:14.5px;letter-spacing:.05em;color:var(--al-warm);
  border:1px solid var(--al-line);border-left:3px solid var(--al-warm);
  padding:9px 14px;background:rgba(13,10,8,.62)}
.al-observer[data-layer="player"]{border-left-color:var(--al-quiet);color:var(--al-quiet)}
.al-observer b{font-weight:400;white-space:nowrap}
.al-observer em{font-style:italic;opacity:.9;font-family:var(--al-body);
  font-size:16px;color:#e2d3c1}

/* ═══ THE CALL SHEET — the sticky stage ══════════════════════════════
   OPAQUE. Task 3 found a translucent band letting a card's sentence read
   through its heading, Task 9 found it again on the rank, Task 10 on the
   rule. */
.al-stage{position:sticky;top:${TR_STICKY_TOP};z-index:6;margin:14px 45px 0;
  background:linear-gradient(180deg,#17110e 0,#1e1712 100%);
  border:1px solid var(--al-line);box-shadow:0 14px 34px rgba(0,0,0,.66)}
.al-sheet-h{display:flex;justify-content:space-between;align-items:center;
  padding:8px 14px;border-bottom:1px solid var(--al-line);
  font-family:var(--al-hand);font-size:13px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--al-warm)}
.al-sheet-h b{font-family:var(--al-display);font-weight:700;letter-spacing:.1em;
  color:var(--al-ink)}
.al-sheet-body{display:flex;gap:9px;flex-wrap:wrap;padding:11px 14px;min-height:62px}
/* ONE SLOT ON THE SHEET: who sat, and the name they gave. An unfilled slot is
   drawn as an outline rather than left out, so the sheet does not jump about
   as it fills. */
.al-slot{display:flex;align-items:center;gap:9px;padding:6px 11px 6px 6px;
  border:1px solid var(--al-line);background:rgba(20,15,12,.8);min-width:172px}
.al-slot[data-empty="1"]{border-style:dashed;opacity:.4;background:transparent}
.al-slot-t{display:flex;flex-direction:column;line-height:1.24}
.al-slot-nm{font-family:var(--al-display);font-weight:700;font-size:15.5px}
.al-slot-said{font-family:var(--al-hand);font-size:12.5px;color:var(--al-quiet)}
.al-slot[data-truth="traitor"]{border-left:3px solid var(--al-warm)}
.al-slot[data-truth="faithful"]{border-left:3px solid rgba(168,152,138,.6)}
.al-slot-mk{width:9px;height:9px;border-radius:50%;border:1.5px solid var(--al-quiet);
  flex:0 0 auto}
.al-slot[data-hit="1"] .al-slot-mk{background:var(--al-right);border-color:var(--al-right)}
.al-slot[data-hit="0"] .al-slot-mk{background:var(--al-wrong);border-color:var(--al-wrong)}
.al-sheet-foot{display:flex;gap:18px;flex-wrap:wrap;padding:7px 14px;
  border-top:1px solid var(--al-line);font-family:var(--al-hand);font-size:12.5px;
  color:var(--al-quiet)}
.al-sheet-foot b{color:var(--al-ink);font-family:var(--al-display);font-weight:700}
.al-sheet-foot span[data-tone="warm"] b{color:var(--al-warm)}

/* ═══ THE STREAM ═════════════════════════════════════════════════════ */
.al-main{padding:22px 45px 40px;display:flex;flex-direction:column;gap:22px}
/* A CUT, NOT A FADE. Every other castle screen drifts its cards up into
   place; a confessional is an edit, so these land hard and fast and settle a
   fraction of a percent. Same machinery, and it does not feel like the same
   screen. */
.al-beat{opacity:0;transform:scale(1.006);
  transition:opacity .12s steps(2,end),transform .34s cubic-bezier(.2,.9,.3,1);
  pointer-events:none}
.al-beat.al-vis{opacity:1;transform:none;pointer-events:auto}

.al-card{border:1px solid var(--al-line);background:rgba(14,10,8,.84);
  padding:18px 20px 20px;position:relative}
.al-card[data-tone="warm"]{border-left:3px solid var(--al-warm)}
.al-card[data-tone="quiet"]{border-left:3px solid rgba(168,152,138,.5)}
.al-label{display:flex;align-items:center;gap:7px;font-family:var(--al-hand);
  font-size:12.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--al-warm)}
.al-h{font-family:var(--al-display);font-weight:700;font-size:26px;margin:6px 0 10px;
  letter-spacing:.01em}
.al-card p{margin:0 0 10px}
.al-card p:last-child{margin-bottom:0}

/* ═══ THE SHOT — one person, framed ══════════════════════════════════ */
.al-shot{position:relative;border:1px solid var(--al-line);
  background:linear-gradient(160deg,rgba(38,27,20,.92) 0,rgba(14,10,8,.94) 68%);
  padding:20px 24px 22px}
/* THE CROP MARKS. Four corners, and the only place in this file where a CSS
   box does an illustration's job — it does it because a crop mark IS a right
   angle of exactly two straight lines. */
.al-shot::before,.al-shot::after,.al-shot i.al-cx,.al-shot i.al-cy{
  content:'';position:absolute;width:18px;height:18px;border:2px solid var(--al-warm);
  opacity:.8;pointer-events:none}
.al-shot::before{top:-1px;left:-1px;border-right:0;border-bottom:0}
.al-shot::after{top:-1px;right:-1px;border-left:0;border-bottom:0}
.al-shot i.al-cx{bottom:-1px;left:-1px;border-right:0;border-top:0}
.al-shot i.al-cy{bottom:-1px;right:-1px;border-left:0;border-top:0}

.al-who{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.al-who-nm{font-family:var(--al-display);font-weight:700;font-size:25px;line-height:1.1}
.al-who-role{font-family:var(--al-hand);font-size:13px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--al-warm);opacity:.85}
/* WHAT THEY SAY. Big, hand-set, and the largest type on the page under the
   title — the words are the entire screen. */
.al-say{font-family:var(--al-hand);font-style:italic;font-size:21.5px;line-height:1.5;
  color:#f6ecdd;margin:0 0 12px;padding-left:18px;
  border-left:2px solid rgba(224,176,112,.4)}
.al-note{display:flex;align-items:center;gap:9px;flex-wrap:wrap;
  font-family:var(--al-hand);font-size:13.5px;color:var(--al-quiet);
  letter-spacing:.05em;margin-top:12px}
.al-why{font-style:italic;color:#c6b5a5}
.al-tier{display:inline-block;font-family:var(--al-hand);font-size:11.5px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--al-warm);
  border:1px solid var(--al-line);padding:0 6px}

/* ═══ WHAT THE CAMERA KNOWS — outside the frame, and audience only ═══ */
.al-cam{margin:16px 0 0 34px;padding:12px 16px;border-left:2px solid var(--al-wrong);
  background:rgba(9,7,6,.6);font-family:var(--al-body);font-size:16.5px;
  color:#e8d8c6}
.al-cam[data-truth="traitor"]{border-left-color:var(--al-right)}
.al-cam-k{display:flex;align-items:center;gap:7px;font-family:var(--al-hand);
  font-size:11.5px;letter-spacing:.22em;text-transform:uppercase;
  color:var(--al-quiet);margin-bottom:5px}

.al-sums{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.al-sum{display:flex;align-items:baseline;gap:7px;border:1px solid var(--al-line);
  padding:6px 11px;background:rgba(13,10,8,.6)}
.al-sum-k{font-family:var(--al-hand);font-size:12px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--al-quiet)}
.al-sum-v{font-family:var(--al-display);font-weight:700;font-size:19px}
.al-sum-v[data-tone="warm"]{color:var(--al-warm)}
.al-sum-v[data-tone="wrong"]{color:var(--al-wrong)}

/* the notice a layer with nothing to show gets, instead of an empty page */
.al-veil{text-align:center;padding:74px 30px;color:var(--al-quiet)}
.al-veil-h{font-family:var(--al-display);font-weight:700;font-size:27px;
  color:var(--al-ink);margin:14px 0 8px}

/* ═══ THE CONTROLS ═══════════════════════════════════════════════════ */
.al-controls{position:fixed;bottom:0;left:0;right:0;z-index:40;
  display:flex;align-items:center;justify-content:center;gap:16px;
  padding:11px;background:rgba(9,7,6,.96);
  border-top:1px solid var(--al-line)}
.al-btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;
  font-family:var(--al-hand);font-size:15px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--al-ink);background:rgba(224,176,112,.1);
  border:1px solid var(--al-line);padding:8px 18px;transition:opacity .3s ease}
.al-btn:hover{background:rgba(224,176,112,.2)}
.al-btn.al-dim{opacity:.34;pointer-events:none}
.al-counter{font-family:var(--al-display);font-weight:700;font-size:15px;
  color:var(--al-warm)}

@media(prefers-reduced-motion:reduce){
  .al-drape,.al-motes circle,.al-tally{animation:none!important}
  .al-beat{transition:none!important;opacity:1;transform:none}
  .al-beat:not(.al-vis){opacity:0}
}
@media(max-width:900px){
  .al-head,.al-main{padding-left:22px;padding-right:22px}
  .al-stage{margin-left:22px;margin-right:22px}
  .al-title{font-size:42px}
  .al-say{font-size:19px}
  .al-cam{margin-left:0}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════
//
// FOUR VARIANTS MINIMUM PER SHAPE and the high-frequency shapes carry eight,
// because a season puts thirty-odd people in this chair. Nothing here writes a
// count, a cast size or a number of Traitors as a literal.
//
// NOT ONE LINE IN ANY SPOKEN POOL SAYS WHAT THE SPEAKER IS. That is the rule
// that makes a Traitor's confessional a performance instead of a confession,
// and it is asserted over these arrays in tests/tr-vp.test.js rather than over
// a sample of renders, because a pool nothing happened to draw is a pool that
// ships anyway.

// ── EVERY NAME-LESS LINE IS BUILT OUT OF TWO HALVES, AND THAT IS THE ONLY
//    WAY THIS SCREEN CLEARS PLAN 5'S REPETITION BAR ─────────────────────
//
// Plan 5's hardest-won number is 26.5% -> 1.54%: the share of seasons that
// print one sentence three times. A NAME-BEARING line clears it for free,
// because "It is Beardo" and "It is Axel" are different sentences — which is
// why every line below that can carry a name does. A NAME-LESS line cannot:
// a confessional is first person, the speaker never says their own name, and
// a pool of eight drawn seven times a season repeats three times about a
// quarter of the time. Measured on the first draft of this file: 53 of 60
// seasons printed some line three times, and 22 of them four.
//
// Writing thirty variants of every opening is the obvious answer and it is the
// wrong one — thirty lines nobody can hold in their head drift into saying the
// same thing anyway. So a name-less line is a PAIR: a statement drawn from one
// pool and a second clause drawn from another, keyed separately. Eight and
// eight is sixty-four sentences out of sixteen written ones, and a repeat now
// needs BOTH halves to collide.
//
// The halves are written so that any A takes any B. Nothing in an A half sets
// up a specific B, and no B half refers back to a noun only one A introduces.

const OPEN_A = [
  'One chair, one lamp and a door that shuts.',
  'They come in one at a time and say the thing they would not say at the table.',
  'The camera does not argue back.',
  'What follows was said alone, in a room with a chair in it.',
  'This is the only room in the castle where nobody has to be careful.',
  'The door shuts, and the performance stops for about a minute.',
  'Nobody out there hears any of this.',
  'A room the size of a cupboard, and a queue outside it.',
];
const OPEN_B = [
  'Everything said in it tonight was said to nobody.',
  'None of it is proof, and all of it is meant.',
  'That is why people tell it things.',
  'Not one of them has any way of knowing whether they are right.',
  'Watch what they do with that.',
  'What comes out is not what gets said at the table, and that is the point.',
  'Which is exactly why it is worth listening to.',
  'They will all deny half of it by morning.',
  'Nothing said in it has to survive contact with anybody.',
  'By tomorrow evening most of it will have been quietly abandoned.',
];

// ── THE SEATS ─────────────────────────────────────────────────────────

const NAMED_A = [
  'They have been saying my name.',
  'I know how I look. I know exactly how I look.',
  'Somebody decided it was me and now everybody is standing behind them nodding.',
  'It has been my name for two days now.',
  'Everybody in this castle wants somebody to be sure about, and I am the '
  + 'closest thing to a sure thing they have got.',
  'I have stopped defending myself.',
  'They want a name, and I am a name.',
  'You can feel it before anybody opens their mouth.',
];
const NAMED_B = [
  'Nobody says it to my face, but a room goes quiet in a particular way and I '
  + 'know what that way sounds like.',
  'There is nothing I can do about it except keep talking.',
  'That is not evidence. That is a queue.',
  'If they take me tomorrow they will find out about four days too late.',
  'It makes it worse. The more you explain the more it sounds rehearsed.',
  'None of it is about anything I have actually done.',
  'And I am running out of ways to say the same true thing.',
  'The worst of it is that I would probably vote for me as well.',
  'And I have to walk out of here in a minute and be normal about it.',
  'It is not the being suspected. It is the being right and being suspected.',
];

const READER_A = [
  'I have been keeping a list.',
  'You stop listening to what people say in here fairly quickly.',
  'Everybody talks at that table and almost nobody says anything.',
  'I have been wrong about people my whole life.',
  'It is not a feeling.',
  'There is a way people sit when they already know how the evening ends.',
  'I have had days of this and I have got one thing I would stand behind.',
  'Nobody in here is going to hand me proof.',
];
const READER_B = [
  'It is a short list and I have not shown it to anybody.',
  'You watch what they do with their hands instead.',
  'So I have been counting who does not.',
  'That is not going to stop tonight, and I still have to pick somebody.',
  'I want it on the record that it is not a feeling.',
  'So it comes down to what I have noticed, and I have noticed something.',
  'One is not many. One is more than most of them have.',
  'I am not going to pretend that is a comfortable place to be voting from.',
  'I would like a second thing before tomorrow. I do not expect to get one.',
  'It is not enough and it is going to have to do.',
];

// THE PACT. Faithful-passable, every half of it: nothing in either pool is a
// sentence a Faithful could not have said, and nothing says what the speaker
// is. The second meaning is the audience's and it is not on the page.
const PACT_A = [
  'Somebody in this castle sat down last night and decided who was not going '
  + 'to wake up.',
  'You have to be seen to be looking.',
  'I have been trying to work out who benefits.',
  'Everybody says trust your gut.',
  'It is the ones who are certain who worry me.',
  'I would like to sit down at a table and have somebody be obviously guilty.',
  'You end up watching your friends.',
  'They will get it wrong tomorrow.',
];
const PACT_B = [
  'You look round that table and you try to see it on a face.',
  'If you are quiet in here, quiet is the first thing they hold against you.',
  'That is what you do, is it not. You follow it back to whoever it helped.',
  'My gut has been wrong about every single person I have ever met.',
  'Nobody in this building should be certain about anything yet.',
  'It is never that. It is never going to be that.',
  'That is the thing nobody warns you about.',
  'And every time they do it gets harder to say so.',
  'I have stopped expecting this room to work anything out.',
  'And the next morning everybody agrees it was obvious all along.',
];

const ADRIFT_A = [
  'I have got nothing.',
  'Ask me who and I will give you four answers.',
  'Everybody else seems to have decided.',
  'There was somebody, and there is not any more.',
  'It is a room full of people I quite like and one of them is doing this to us.',
  'I am going to follow somebody tomorrow.',
  'The honest answer is that I have no idea.',
  'Every name I try on fits.',
];
const ADRIFT_B = [
  'I am going to sit down at that table with nothing and say a name anyway, '
  + 'because that is what the table is.',
  'I would mean none of them.',
  'I keep waiting for the bit where it becomes obvious and it does not come.',
  'So here I am with my hands empty, the night before a vote.',
  'I cannot make those two things sit together.',
  'I am not proud of it. I do not have anything better.',
  'Nobody says that out there, and I would put money on most of them being in '
  + 'the same place.',
  'That is how I know I am nowhere.',
  'I am going to end up doing whatever the loudest person in the room does.',
  'Being useless in here is not restful. It is just quiet.',
];

// ── WHAT THEY ACTUALLY SAY ────────────────────────────────────────────
// NAME-BEARING, deliberately: a sentence with a name in it renders differently
// every time it is drawn, which is what keeps a season off the repetition
// ceiling without a pool of thirty.
// THE NAME, AND IT IS A PAIR TOO. A name-bearing line varies with the name and
// that is usually enough — but the room spends four or five nights on ONE name,
// so "{t}" is the same word every time and a twelve-line pool printed the same
// finished sentence three times in 11 of 60 seasons. Eight and eight.
const NAME_A = [
  'It is {t}.',
  'If you made me say it tonight I would say {t}.',
  '{t}. That is the name.',
  'I keep coming back to {t}.',
  'Everybody wants a name, and mine is {t}.',
  '{t} is the one I cannot put down.',
  'I am on {t}.',
  'One thing put me on {t} and it is not much of a thing.',
];
const NAME_B = [
  'I have gone round it and round it and it comes back to the same place every '
  + 'time.',
  'I would not enjoy saying it and I am going to say it anyway.',
  'I have not said it out loud until now.',
  'Not because of anything that was said — because of the shape of it.',
  'I would rather it was not, and it is.',
  'I have tried to talk myself out of it and I cannot.',
  'I could not tell you I am sure; I could tell you I am not moving off it.',
  'And no, before you ask, I could not prove a word of it.',
  'It is the only thing I have been able to hold on to for two days.',
  'If I am wrong about this I have been wrong about everything.',
];

const SECOND_NAME = [
  'And if it is not that, it is {t2}. Two names is not much of a list, and it '
  + 'is mine.',
  'There is {t2} as well. Further back, but there.',
  'I have {t2} written down underneath, and I have not crossed it out.',
  'If somebody stood {t2} up tomorrow I would not argue.',
  'Second name is {t2}, and I would like it to stay a second name.',
  '{t2} is the other one. Quieter, and I have noticed the quiet.',
  'There is {t2} too, and I have been careful not to say so out loud.',
  'A long way behind it, {t2}. Far enough behind that I would feel sick about '
  + 'it.',
  'And {t2}, who I would be delighted to be wrong about.',
  'I have got {t2} in the same breath, for reasons I could not begin to '
  + 'explain.',
];

// THE REASON IS NOT SPOKEN, IT IS THE NOTE BESIDE THE NAME.
//
// `learn()`'s `source` has two grammars and no way to tell them apart from
// inside a sentence: it is sometimes a noun phrase ("the turret", "the reveal",
// "Chase at the Round Table") and sometimes a bare predicate whose subject is
// somebody else entirely ("was the one person the Traitors could not touch",
// "heard a voice on the dungeon stair" — and that second one is a thing the
// OBSERVER did, not the target). The first draft of this file put it in a
// speaker's mouth after a colon and printed *"If you want the reason, this is
// the reason: was the one person the Traitors could not touch"*, which is Task
// 10's finding arriving somewhere worse, because a narrator can present a
// fragment and a person talking cannot.
//
// So the reason is PRESENTED, in the third person, on the note strip under the
// shot — Task 10's "The note beside it:" device, which survives every shape the
// engine writes. What the speaker says out loud is what they are sure of; what
// it is built on is written beside it.
const NOTE_LEAD = [
  'The note beside it',
  'What it is built on',
  'Where it came from',
  'On the strength of',
];

const DOUBT_A = [
  'I could be wrong.',
  'And if I am wrong I have spent days building a case against somebody who '
  + 'was on my side the whole time.',
  'It is thin. I know it is thin.',
  'Ask me again tomorrow and I might have moved.',
  'The worst part is that this is the best I have.',
  'Somewhere in this building somebody is watching me get it wrong.',
  'I have been sure before and been wrong before, in here, this week.',
  'None of this would survive five minutes of anybody arguing back.',
];
const DOUBT_B = [
  'Everybody in this castle could be wrong, and that is exactly how this thing '
  + 'eats people.',
  'That is the part I have stopped letting myself think about.',
  'Thin is all anybody has got in here.',
  'It is not a strong position to be voting from and I know it.',
  'And I am going to say it out loud tomorrow anyway.',
  'They are saying nothing, and they are right to.',
  'Nobody is going to correct me, which is the frightening part.',
  'I would like somebody to tell me I am being stupid. Nobody will.',
];

// A SEAT WITH NOTHING KEPT ON IT. Not the same as an empty board: a name can
// be raised, heard and put back down by everybody, which Task 10 found the
// hard way. Both cases have their own pool, and the dropped one carries a name.
const DROP_A = [
  'I had {t} for two days and I have taken it back off.',
  'I talked myself out of {t}.',
  '{t} was my name until this afternoon.',
  'I took {t} off the list.',
  'Everybody is still on {t} and I have quietly stopped being.',
  'I gave {t} up.',
];
const DROP_B = [
  'Either that is the best thing I do in here or it is the last.',
  'I would like to be able to tell you why.',
  'It is nobody now, and I have nobody to put in its place.',
  'So I am back at the start with less time left.',
  'I have not told any of them, and I am not going to.',
  'That is either the sharpest thing I have done in here or the stupidest, and '
  + 'I find out which at a table.',
];
const NONE_EMPTY_A = [
  'I have not got one.',
  'There is nobody.',
  'If they ask me tomorrow I am going to have to make it up.',
  'I am going in blind.',
  'My list is a blank page.',
  'I have spent the whole day trying to build one and got nowhere.',
];
const NONE_EMPTY_B = [
  'Not a name, not a feeling, nothing I would repeat.',
  'I have looked at every single one of them and there is nobody.',
  'Everybody at that table will be able to tell.',
  'I have been in here as long as everybody else and I am completely blind.',
  'You are supposed to have something by now.',
  'So I will be voting on somebody else’s reasoning, like most of them.',
];

// PACT WITH NOTHING SPEAKABLE. Still not a confession, and still nobody named.
const PACT_QUIET_A = [
  'I am not going to throw a name out for the sake of it.',
  'I would rather say nothing tomorrow than say the wrong thing loudly.',
  'Everybody is picking somebody tonight.',
  'I have not got one I would defend.',
  'There is a version of tomorrow where I say nothing at all.',
  'I keep being asked and I keep not answering.',
];
const PACT_QUIET_B = [
  'That is how good people go home.',
  'A name said with confidence is worth more in that room than a name that is '
  + 'right, and everybody knows it.',
  'I am going to sit and watch who picks first.',
  'Defending it is the part that matters.',
  'It is not the worst version.',
  'Nothing I have got is worth what saying it would cost.',
];

// ── WHAT THE CAMERA KNOWS — audience only, outside the frame ──────────
// The ONLY pools on this page that read `truth`. Never the same sentence for a
// hit and a miss, and never a scoreline: the audience is not being told
// whether the room is winning.
// THE TWO COMMONEST VERDICTS ARE PAIRS. One of these fires every time anybody
// names anybody, which is most seats on most nights, and the room spends four
// or five nights on the same name — so the {t} slot is the same word and a flat
// pool of four printed one line three times a season.
const CAM_RIGHT_A = [
  'They are right about {t}, and there is nothing in this castle that will '
  + 'ever tell them so.',
  '{t}. That is the name.',
  '{t} is one of them.',
  'Correct, and arrived at sideways: {t}.',
  'The read on {t} lands.',
  'They have got hold of the right person in {t}.',
];
const CAM_RIGHT_B = [
  '{t} is one of them.',
  '{t} really is a Traitor, and the reasoning that got there was worth almost '
  + 'nothing.',
  'Whether anybody at that table believes it tomorrow is another question '
  + 'entirely.',
  '{t} is a Traitor and the case against {t} is barely a case at all.',
  'Being right is not the same as being able to prove it, and in this building '
  + 'it is worth about half as much.',
  'It will take three more people agreeing before it means anything.',
];
const CAM_WRONG_A = [
  'And it is not {t}.',
  'Wrong about {t}, and unfixably wrong.',
  '{t} is a Faithful.',
  'There is no version of this in which {t} is one of them.',
  'The name is wrong: not {t}, not on any night.',
  'Nothing said about {t} in there is true.',
];
const CAM_WRONG_B = [
  '{t} is a Faithful and has been from the first night.',
  '{t} has done nothing but stand in the wrong place in a ballot record.',
  'Everything just said about {t} was built out of nothing that ever happened.',
  '{t} is a Faithful, and nobody in that building is going to say so.',
  'It is a day spent walking away from the answer, and it will feel like '
  + 'progress.',
  'Somewhere in this castle the right person heard that and said nothing.',
];
const CAM_LATE = [
  '{t} is a Traitor tonight and was not one when this read was formed — the '
  + 'cloak went on on day {day}. It was wrong when it was made and it is right '
  + 'now, and nobody in the building can tell the difference.',
  'Right, but late. {t} took the cloak on day {day}; whoever formed this before '
  + 'then formed it about somebody who had not yet said yes.',
  '{t} said yes on day {day}. A read older than that was an accusation against '
  + 'a Faithful, and it has quietly become correct without anybody touching it.',
  'The name is correct and the reasoning is not: {t} became one of them on day '
  + '{day}, after most of this was already written down.',
];
// A TRAITOR NAMING A TRAITOR THEY WERE NEVER SHOWN. A recruit is told part of
// the pact and not all of it, so this happens, and it is the best thing the
// format does.
const CAM_BLIND = [
  '{t} is one of them, and the person who just said so has no idea. They were '
  + 'never shown each other.',
  'That is a Traitor naming a Traitor and not knowing it. Nobody ever put the '
  + 'speaker and {t} in a room together.',
  '{t} really is one of them. So is the person in that chair, and neither of '
  + 'them knows about the other.',
  'Correct, and by accident. {t} is a Traitor; so is the speaker; they have '
  + 'never been introduced.',
];
// A TRAITOR NAMING A FAITHFUL. The performance, seen from the other side.
// A TRAITOR NAMING A FAITHFUL, AND IT ASSERTS ONLY ALIGNMENTS.
//
// The first draft said the speaker "knows perfectly well where the answer
// actually is", and that is a claim about a motive the model does not hold. A
// recruit is shown SOME of the pact, so a Traitor naming a Faithful is
// sometimes deflecting and sometimes genuinely suspicious of somebody they
// were never shown — and nothing on the record says which. A sentence
// asserting a fact about the state has to agree with the state; this plan has
// broken that three times. These say what is certainly true — who is a
// Faithful, and where the name came from — and leave the motive alone.
const CAM_PERFORM = [
  '{t} is a Faithful. The name came from a Traitor, which is the one direction '
  + 'a name can travel in this castle and mean nothing at all.',
  'A name offered up, and {t} is a Faithful. Whether that was a lie or a bad '
  + 'guess is the one thing not even the camera can settle.',
  'That is a Faithful being handed to a room that badly wants one. {t} has '
  + 'done nothing, and the person who said so is one of them.',
  '{t} is a Faithful, named by a Traitor. Both halves of that sentence are '
  + 'true and the room will never get either of them.',
  'It is not {t}. It has never been {t}. And the one person in that chair who '
  + 'was in a position to know better is the one who said it.',
  '{t} is a Faithful. The castle is now being pointed at them by somebody who '
  + 'is not.',
];

// THE SILENT CHAIR, and it is a PAIR for the reason every name-less line here
// is: the camera speaks once per silent seat, four or five times a season, and
// a flat pool of eight printed three identical lines in 14 of 60 seasons. Six
// and six is thirty-six.
const CAM_SILENT_F_A = [
  'Nothing given, and nothing held back.',
  'An empty chair, effectively.',
  'That is a Faithful with nothing.',
  'No name, and no name is what it looks like from the inside as well.',
  'Not a performance.',
  'The blank is real.',
];
const CAM_SILENT_F_B = [
  'This one genuinely has no idea.',
  'There is no name in there to give.',
  'It is the most common thing in this building and the least often admitted.',
  'Being honest about it will not count for anything at all tomorrow.',
  'There is nothing behind that, and nothing being kept from anybody.',
  'Some of them are simply lost, and this is one.',
];
const CAM_SILENT_T_A = [
  'No name given, and that is a choice rather than a shortage.',
  'Nothing offered.',
  'A quiet night in the chair, from somebody who could have filled it.',
  'A blank page, kept blank on purpose.',
  'Held back.',
  'Nothing, from somebody who has known the answer since the first night.',
];
const CAM_SILENT_T_B = [
  'The holding back is the whole performance.',
  'There is a difference between having nothing and giving nothing, and only '
  + 'one person in that room knows which this was.',
  'An empty minute, from the one person who could have ended the season with a '
  + 'sentence.',
  'Nothing said in there can be checked against anything later, which is the '
  + 'point of saying nothing.',
  'It costs less than a name that turns out to be wrong.',
  'The camera is the only thing in this castle that can tell the difference.',
];
// THE SEAT OF THE ACCUSED. The camera speaks about the SPEAKER here and not
// about the name they gave, because somebody protesting is the one case where
// the interesting truth belongs to the person in the chair.
const CAM_ACCUSED_F = [
  'The room is wrong. {who} is a Faithful, and every day this goes on is a day '
  + 'the castle spends on the wrong person.',
  '{who} is telling the truth. That is the trouble with the truth in this '
  + 'building: it sounds exactly like the other thing.',
  'A Faithful being closed in on. Nothing {who} said in that chair was a lie '
  + 'and none of it is going to help.',
  '{who} has done nothing. The room has decided otherwise, and the room does '
  + 'not have to be right.',
  'The name is wrong. {who} is a Faithful, and the castle is about to spend '
  + 'its one vote of the day on somebody who was helping.',
  'Every word of that was true and none of it will land. {who} is a Faithful.',
];
const CAM_ACCUSED_T = [
  'The room is right, and it does not know how right it is. {who} is one of '
  + 'them.',
  '{who} is a Traitor. Everything just said in that chair was said to camera, '
  + 'about camera, for the benefit of a room that is not in it.',
  'Correct. {who} is one of them, and is about to spend a day being gracious '
  + 'about being suspected.',
  'They have got it. {who} is a Traitor, and the performance of being hurt by '
  + 'that is about to start.',
  'The castle has found one. {who} really is one of them, and has just spent a '
  + 'minute being wounded about it to a camera.',
  '{who} is a Traitor. Every word of that was aimed at people who are not in '
  + 'the room and will hear none of it.',
];

// ── THE CLOSE ─────────────────────────────────────────────────────────
const CLOSE_LEAD = [
  'The lamp goes off',
  'And the room empties',
  'Nobody else comes in',
  'The chair is empty again',
  'The door stays shut',
  'That is the last of them',
];
// THE CLOSING CARD IS A PAIR, and the reason it is one was hidden until a
// separate fix removed the paragraph that was masking it. `_unnamed` used to
// name somebody on almost every night, so the measurement unit was two
// paragraphs and the second carried a name; the moment that paragraph became
// rare, a four-line pool firing once a night showed up as FOUR identical cards
// in one season. A guard whose unit is bigger than the thing it is guarding
// measures the wrong thing, which is this plan's most repeated defect wearing
// yet another hat.
const CLOSE_HIT_A = [
  'They are not far off tonight.',
  'Most of what was said in that chair was true.',
  'The room is closer than it has been.',
  'They have got hold of something.',
  'That is the castle, briefly, being right.',
  'Every name given in there landed.',
];
const CLOSE_HIT_B = [
  'That is rarer in this building than anybody in it would believe.',
  'Not one of the people who said it will find out until it is far too late to '
  + 'matter.',
  'Closer is not close.',
  'Whether they can keep hold of it until the table sits is a different '
  + 'question.',
  'It will not survive one confident person arguing the other way.',
  'And every one of them will go to bed thinking they got lucky.',
];
const CLOSE_MISS_A = [
  'Not one of those names was right.',
  'Everything said in that chair tonight was said with total conviction.',
  'The castle has spent a day getting further away from the answer.',
  'Nobody named anybody worth naming.',
  'Every name in there belongs to somebody who has done nothing.',
  'A clean sweep, in the wrong direction.',
];
const CLOSE_MISS_B = [
  'They will sit down tomorrow and vote on them anyway.',
  'Almost none of it was true.',
  'It feels to them like progress.',
  'They will go to bed feeling as though they have narrowed it down.',
  'Tomorrow one of those people loses everything for it.',
  'And the ones who are actually doing this sat in that room and agreed.',
];
const CLOSE_SPLIT_A = [
  'Some of that was right.',
  'One of those names lands and the rest do not.',
  'Half of it is true.',
  'A mixed night.',
  'There is a correct answer somewhere in that room tonight.',
  'Part of the castle is looking in the right place.',
];
const CLOSE_SPLIT_B = [
  'From inside the room there is no way at all to tell which part.',
  'Every one of them was said with the same face.',
  'Half of it is going to cost somebody everything.',
  'Which is the only kind this format really has.',
  'It is sitting next to three that are not, and they all sound alike.',
  'The other part is about to be much louder.',
];
// A NIGHT WITH NO NAMES ON IT AT ALL. The first draft ran this into CLOSE_MISS
// and printed *"Not one of those names was right"* over an evening in which
// nobody gave a name — a sentence asserting a fact about the state that the
// state contradicts, which is a standing requirement in this plan and has been
// broken three times before. Found by reading the dump.
const CLOSE_NONE_A = [
  'Nobody gave a name tonight. {N} of them sat in that chair and not one could '
  + 'finish the sentence.',
  'Not one name, all evening.',
  'An evening of people explaining why they cannot answer the question.',
  'No names at all.',
  '{N} people in that chair and nothing came out of any of them.',
  'The question was put {N} times and never once answered.',
];
const CLOSE_NONE_B = [
  'The castle has had a whole day and come out of it with nothing.',
  'They will still be asked it tomorrow, and one of them will have to say '
  + 'something.',
  'Nobody who sat down in that room got near enough to say so.',
  'Whatever is happening in this building is happening somewhere none of them '
  + 'is looking.',
  'A day gone, and the pot with it.',
  'Tomorrow they vote anyway. That is the part nobody agreed to and everybody '
  + 'does.',
];
const CLOSE_QUIET = [
  '{who} was not mentioned once tonight. Not by anybody, in any chair.',
  'Nobody said {who} out loud. Not once, all evening.',
  '{who} came through the whole night without being named by a single person '
  + 'in that chair.',
  'Not one of them said {who}. That is the safest place in this castle and it '
  + 'is not a coincidence.',
  'A whole evening, and {who} did not come up. Not as a name, not as a '
  + 'possibility.',
  'Nobody thought of {who}, which is exactly the position {who} has spent a '
  + 'week arranging.',
];
// The player layer's close. No truth, and therefore no scoreline to withhold.
const CLOSE_MINE = [
  'That is what you have got, and you have said it out loud now, which makes '
  + 'it harder to walk back.',
  'The lamp goes off. Tomorrow you say some of that at a table full of people '
  + 'who can hear it.',
  'It is on the record. Nobody in this castle will ever hear it, and you will '
  + 'have to live with having meant it.',
  'And that is the whole of what you have. It is not much, and it is not '
  + 'nothing.',
];

/**
 * EVERY SPOKEN POOL, exported for the guard.
 *
 * The rule that a confessional is never a confession is a property of these
 * arrays and not of any particular render — a line nothing happened to draw is
 * a line that ships. So the guard reads the pools directly. The camera pools
 * are deliberately NOT in this list: they are the audience's voice and they
 * are the one thing on the page allowed to say what people are.
 */
export const SPOKEN_POOLS = {
  OPEN_A, OPEN_B,
  NAMED_A, NAMED_B, READER_A, READER_B, PACT_A, PACT_B, ADRIFT_A, ADRIFT_B,
  NAME_A, NAME_B, SECOND_NAME, DOUBT_A, DOUBT_B,
  DROP_A, DROP_B, NONE_EMPTY_A, NONE_EMPTY_B, PACT_QUIET_A, PACT_QUIET_B,
};

// ══════════════════════════════════════════════════════════════════════
// THE SLATE — who sits in the chair, and it is composed rather than ranked
// ══════════════════════════════════════════════════════════════════════

/**
 * WHAT A PERSON IS ABLE TO SAY OUT LOUD.
 *
 * `certain` is dropped HERE, at the source, and nowhere further down: about a
 * LIVING person `certain` is `public` and `public` about an alignment is the
 * turret — the pact seeing each other on the first night, or a recruit being
 * shown it. It is the one thing in the building nobody would ever say to a
 * camera, and a filter at the source cannot be undone by an edit to a card.
 */
function _speakable(entries) {
  return (entries || []).filter(e => !e.certain && e.score > 0);
}
/** Names they considered and put back down. Also never `certain`. */
function _dropped(entries) {
  return (entries || []).filter(e => !e.certain && !(e.score > 0));
}

/**
 * A shortlist, then a rotation — and the SEATS are the point, not this.
 *
 * Take the top third by merit (never fewer than three, so a shortlist is a
 * shortlist and not a winner), then order that shortlist by a hash of the name
 * and the night. Somebody with a strong read is far likelier to be in the chair
 * than somebody without one, and nobody quite owns a seat.
 *
 * BUT THIS IS THE SMALLER HALF OF THE ANSWER AND THE FIRST DRAFT OF THIS
 * COMMENT SAID OTHERWISE. Deleting the rotation entirely and returning the
 * merit ranking moves distinct speakers per season from 10.3 to 9.6 — MEASURED
 * over twenty seasons — because the accused seat rotates over three names and
 * the pact seat over three people whatever this function does, and a reader's
 * merit order changes every night on its own as the scores move. So that
 * mutation is a NON-mutation and is recorded as one; the property that actually
 * keeps one kind of person out of the chair is the four NAMED SEATS below, and
 * that is what the guard attacks.
 */
function _rotate(pool, merit, key) {
  if (!pool.length) return [];
  const ranked = [...pool].sort((a, b) =>
    merit(b) - merit(a) || a.observer.localeCompare(b.observer));
  const short = ranked.slice(0, Math.max(3, Math.ceil(ranked.length / 3)));
  return short.sort((a, b) =>
    _unit(key + '|' + b.observer) - _unit(key + '|' + a.observer));
}

/**
 * FOUR NAMED SEATS, filled from the record and from nothing else.
 *
 * The composition is OBSERVER-INDEPENDENT and deliberately so: withholding
 * must not shape the page. A `player:` observer is shown their own card out of
 * this same slate, or told they were not in the chair tonight — the evening
 * itself is the evening the audience gets.
 *
 *   named   — one of the three names the castle is heaviest on, if they are
 *             still in the building and holding a board. The rotation runs
 *             over the three, because the top name is often the same person
 *             for four nights running and that is a fact about the season, not
 *             a reason to book the same guest.
 *   reader  — a Faithful with something kept. The spine of the screen.
 *   pact    — a living Traitor. The performance, and the double meaning.
 *   adrift  — somebody holding nothing: a name dropped, or a blank board. The
 *             most common state in the castle and the least often on screen.
 */
function _slate(b, truth) {
  const boardOf = new Map();
  for (const bd of b.boards || []) boardOf.set(bd.observer, bd.entries || []);
  const living = new Set(b.living || []);
  const key = 'al|seat|' + b.ep;
  const isT = n => truth[n] === 'traitor';
  const out = [];
  const taken = new Set();
  const add = (observer, role) => {
    if (!observer || taken.has(observer)) return;
    taken.add(observer);
    out.push({ observer, role, entries: boardOf.get(observer) || [] });
  };

  // 1. THE NAME THE ROOM IS ON.
  const heavy = (b.castle || [])
    .filter(r => living.has(r.name) && boardOf.has(r.name))
    .slice(0, 3).map(r => ({ observer: r.name, w: r.weight }));
  const named = _rotate(heavy, x => x.w, key + '|named')[0];
  if (named) add(named.observer, 'named');

  // 2. A FAITHFUL WITH SOMETHING KEPT.
  const readers = (b.boards || [])
    .filter(bd => !isT(bd.observer) && !taken.has(bd.observer)
      && _speakable(bd.entries).length)
    .map(bd => ({ observer: bd.observer, best: _speakable(bd.entries)[0].score }));
  const reader = _rotate(readers, x => x.best, key + '|reader')[0];
  if (reader) add(reader.observer, 'reader');

  // 3. THE PACT. Merit here is how much they have to perform WITH — a Traitor
  //    carrying a speakable read gives a better confessional than one who has
  //    to say nothing — but every living Traitor is eligible, so a pact with
  //    nothing still gets the chair.
  const pactPool = (b.boards || [])
    .filter(bd => isT(bd.observer) && !taken.has(bd.observer))
    .map(bd => ({
      observer: bd.observer,
      best: (_speakable(bd.entries)[0] || { score: 0 }).score,
    }));
  const pact = _rotate(pactPool, x => x.best, key + '|pact')[0];
  if (pact) add(pact.observer, 'pact');

  // 4. SOMEBODY ADRIFT. A dropped name first — it is a better confessional
  //    than a blank one — and a blank board only if nobody dropped anything.
  const adriftPool = (b.boards || [])
    .filter(bd => !isT(bd.observer) && !taken.has(bd.observer)
      && !_speakable(bd.entries).length)
    .map(bd => ({ observer: bd.observer, drops: _dropped(bd.entries).length }));
  const adrift = _rotate(adriftPool, x => x.drops, key + '|adrift')[0];
  if (adrift) add(adrift.observer, 'adrift');

  return out;
}

/**
 * IS THERE A CONFESSIONAL ON THIS NIGHT AT ALL?
 *
 * `TRAITORS_SCREENS` registers off the RECORD and never off an episode number,
 * which is the rule every castle screen is registered by. On night one the
 * only boards in the building are the pact's and every entry on them is the
 * turret, which is the one thing nobody says out loud — so there is genuinely
 * nothing to put in the chair, and the Selection already draws that meeting.
 *
 * EXPORTED so `screens.js` asks this file rather than keeping a second copy of
 * the condition. Two copies of one rule is the shape this repo has been bitten
 * by at least six times.
 */
export function _hasConfessionals(r) {
  const b = r && r.tr && r.tr.beliefs;
  if (!b || !Array.isArray(b.boards)) return false;
  return b.boards.some(bd =>
    _speakable(bd.entries).length || _dropped(bd.entries).length);
}

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the gate, and it is a TWO-STATE gate
// ══════════════════════════════════════════════════════════════════════

/**
 * WHAT THIS OBSERVER IS ENTITLED TO OF WHAT WAS SAID IN THAT ROOM.
 *
 * ONE GATE, `truthKnown`, read everywhere, and mutated in BOTH directions in
 * tests/tr-vp.test.js. A one-way mutation on a two-state gate proves half of
 * it (Task 3's technique, eighth use in this plan), and Task 10 shipped a
 * `truthKnown` that NOTHING BRANCHED ON because a second expression happened
 * to agree with it — "redundancy hiding a dead guard", shape two on the list.
 * So there is one expression here and every consumer reads it.
 *
 *   AUDIENCE   every confessional, and the camera's own line under each one.
 *              Spec §9.1's three layers arrive on this screen as: what each
 *              speaker holds (the words), what the room holds together (the
 *              call sheet), and what is so (the strip outside the frame).
 *
 *   A PLAYER   their own confessional and nothing else. Not anybody else's — a
 *              confessional is by definition said to nobody, and a screen that
 *              handed one player another player's would be inventing a channel
 *              the format does not have. Not the truth. Not `valence`, which
 *              LOOKS like a property of a belief and is not: `_assess` reads
 *              the fact's ground truth to set it, so it is the answer wearing
 *              a field name that does not look like the answer.
 *
 * The withheld layers are withheld by NEVER REACHING the branch that draws
 * them — `truth`, `flips` and everybody else's seat are absent from the view
 * rather than present and unused, so a later edit to a card cannot print one.
 */
function _view(ep, observer) {
  const b = ep && ep.tr && ep.tr.beliefs;
  if (!b || !Array.isArray(b.boards)) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs === 'audience';
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;
  const living = Array.isArray(b.living) ? [...b.living] : [];
  const truthAll = b.truth || {};

  const truthKnown = isAudience;

  // COMPOSED FIRST, GATED AFTER. The slate is a function of the record, so a
  // player layer and the audience layer are looking at the same evening.
  const slate = _slate(b, truthAll);
  const flipEp = {};
  for (const f of b.flips || []) flipEp[f.name] = f.ep;

  // Rebuilt field by field rather than spread and pruned: a spread that later
  // grows a field grows it silently, which is precisely how ground truth
  // escapes. `valence` is the field this is guarding against.
  const shape = s => ({
    observer: s.observer,
    role: s.role,
    speak: _speakable(s.entries).map(e => ({
      name: e.name, score: e.score, sourceType: e.sourceType,
      why: e.why, learnedEp: e.learnedEp,
    })),
    drop: _dropped(s.entries).map(e => ({ name: e.name })),
  });

  if (truthKnown) {
    return {
      ep: b.ep != null ? b.ep : (ep.num || 1),
      isAudience: true, watcher: null, truthKnown: true, inChair: true,
      living, seats: slate.map(shape), truth: truthAll, flipEp,
    };
  }

  const own = slate.find(s => s.observer === watcher) || null;
  return {
    ep: b.ep != null ? b.ep : (ep.num || 1),
    isAudience: false, watcher, truthKnown: false,
    inChair: !!own,
    living,
    seats: own ? [shape(own)] : [],
    // AUDIENCE ONLY, and null rather than empty where withheld.
    truth: null, flipEp: null,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

const ROLE_LABEL = {
  named: 'The name in the room',
  reader: 'Alone with a list',
  pact: 'After the table',
  adrift: 'Nothing to give',
};
/** The two halves each seat's opening line is drawn from. See the pool header. */
const LEAD_HALVES = {
  named: [NAMED_A, NAMED_B], reader: [READER_A, READER_B],
  pact: [PACT_A, PACT_B], adrift: [ADRIFT_A, ADRIFT_B],
};

/**
 * ONE LINE OUT OF TWO POOLS, and the pair is what `used` remembers.
 *
 * `_pickUnique` on each half separately would let two speakers on one night
 * share a half and read as an echo; `used` therefore holds the HALVES as well
 * as the finished line, so no half is spoken twice in one evening either.
 */
function _pair(halves, key, used) {
  const a = _pickUnique(halves[0], key + '|a', used);
  const b = _pickUnique(halves[1], key + '|b', used);
  return a + ' ' + b;
}

/**
 * THE TIER, IN THE SCREEN'S OWN WORD RATHER THAN THE ENGINE'S KEY.
 *
 * `sourceType` is an identifier — `deduced`, `rumor`, `told`, `observed`,
 * `public` — and two of those are wrong on the page for two separate reasons:
 * `rumor` is the American spelling in a show that talks in British English
 * everywhere else, and `deduced` is a word nobody in that chair would use about
 * themselves. So the tier is translated once, here, and an unknown key falls
 * through as itself rather than being swallowed.
 */
const TIER_WORD = {
  deduced: 'worked out', rumor: 'heard', told: 'told', observed: 'seen',
  public: 'seen',
};
function _tier(t) {
  if (!t) return '';
  return '<span class="al-tier">' + _esc(TIER_WORD[t] || t) + '</span>';
}

/**
 * WHAT ONE PERSON SAYS, BUILT OUT OF THEIR OWN BOARD AND NOTHING ELSE.
 *
 * `truth` is not a parameter and cannot become one: this function is handed
 * the speaker's own entries and the pools, and the camera's line is composed
 * by a different function and drawn outside the frame. That is the shape of
 * hard guard one — a confessional cannot cite what the speaker does not hold,
 * because the composer has no access to it.
 */
function _saidBy(seat, key, used, epNum) {
  const lines = [];
  const top = seat.speak[0] || null;
  const second = seat.speak[1] || null;
  const k = key + '|' + seat.observer;

  lines.push(_pair(LEAD_HALVES[seat.role] || LEAD_HALVES.reader, k + '|lead', used));

  if (top) {
    lines.push(_fill(_pair([NAME_A, NAME_B], k + '|name', used), { t: _esc(top.name) }));
    // A SECOND NAME ONLY WHERE THERE IS A REAL SECOND NAME, and only when it
    // is close enough to the first to be a hesitation rather than a list.
    if (second && second.score > top.score * 0.7) {
      lines.push(_fill(_pickUnique(SECOND_NAME, k + '|two', used), { t2: _esc(second.name) }));
    }
    // DOUBT WHERE THE READ IS ACTUALLY WEAK, and not as a tic on every card.
    if (top.score < 0.42) lines.push(_pair([DOUBT_A, DOUBT_B], k + '|doubt', used));
  } else if (seat.role === 'pact') {
    lines.push(_pair([PACT_QUIET_A, PACT_QUIET_B], k + '|quiet', used));
  } else if (seat.drop.length) {
    lines.push(_fill(_pair([DROP_A, DROP_B], k + '|drop', used),
      { t: _esc(seat.drop[0].name) }));
  } else {
    lines.push(_pair([NONE_EMPTY_A, NONE_EMPTY_B], k + '|empty', used));
  }

  // THE NOTE STRIP. Third person, and the only place `why` appears — see
  // NOTE_LEAD for why it is not in anybody's mouth.
  const note = top
    ? _tier(top.sourceType) + '<span>&middot; carried since day '
      + (top.learnedEp || epNum) + '</span><span>&middot; ' + _pct(top.score)
      + '% of a vote</span>'
      + (top.why
        ? '<span class="al-why">&middot; ' + _esc(_pick(NOTE_LEAD, k + '|note'))
          + ': ' + _esc(top.why) + '</span>'
        : '')
    : '<span>nothing they would repeat at a table</span>';
  return { lines, note, top };
}

/**
 * THE CAMERA'S OWN LINE, and it is the only place `truth` is read.
 *
 * Six cases, because six different things are true, and a screen that printed
 * one sentence for all of them would have thrown away the reason it exists.
 */
function _cameraLine(v, seat, top, key, used) {
  const truth = v.truth || {};
  const k = key + '|cam|' + seat.observer;
  const speakerIsT = truth[seat.observer] === 'traitor';

  // THE ACCUSED SEAT IS ABOUT THE SPEAKER and not about the name they gave:
  // the one case where the interesting truth is the chair's own.
  if (seat.role === 'named') {
    return {
      truth: truth[seat.observer] || 'faithful',
      text: _fill(_pickUnique(speakerIsT ? CAM_ACCUSED_T : CAM_ACCUSED_F, k, used),
        { who: _esc(seat.observer) }),
    };
  }
  if (!top) {
    return {
      truth: truth[seat.observer] || 'faithful',
      text: _pair(speakerIsT ? [CAM_SILENT_T_A, CAM_SILENT_T_B]
        : [CAM_SILENT_F_A, CAM_SILENT_F_B], k, used),
    };
  }
  const targetIsT = truth[top.name] === 'traitor';
  const flip = (v.flipEp || {})[top.name];
  let pool;
  if (!targetIsT && !speakerIsT) {
    return {
      truth: 'faithful',
      text: _fill(_pair([CAM_WRONG_A, CAM_WRONG_B], k, used), { t: _esc(top.name) }),
    };
  }
  if (targetIsT && !speakerIsT && !((v.flipEp || {})[top.name] && top.learnedEp != null
    && top.learnedEp < (v.flipEp || {})[top.name])) {
    return {
      truth: 'traitor',
      text: _fill(_pair([CAM_RIGHT_A, CAM_RIGHT_B], k, used), { t: _esc(top.name) }),
    };
  }
  if (!targetIsT) pool = CAM_PERFORM;
  else if (speakerIsT) pool = CAM_BLIND;
  // A READ OLDER THAN THE RECRUITMENT IS THE ERA RULE, said on the page. It is
  // only "late" if the belief predates the flip; a read formed after it is
  // simply right.
  else pool = CAM_LATE;
  return {
    truth: targetIsT ? 'traitor' : 'faithful',
    text: _fill(_pickUnique(pool, k, used), { t: _esc(top.name), day: _word(flip || 1) }),
  };
}

function _shot(seat, said, cam) {
  return '<div class="al-shot"><i class="al-cx"></i><i class="al-cy"></i>'
    + '<div class="al-who">' + _av(seat.observer, 52)
    + '<div><div class="al-who-nm">' + _esc(seat.observer) + '</div>'
    + '<div class="al-who-role">' + _esc(ROLE_LABEL[seat.role] || 'In the chair')
    + '</div></div></div>'
    + said.lines.map(l => '<p class="al-say">' + l + '</p>').join('')
    + '<div class="al-note">' + _ic('lens', 13) + said.note + '</div>'
    + '</div>'
    + (cam
      ? '<div class="al-cam" data-truth="' + _esc(cam.truth) + '">'
        + '<div class="al-cam-k">' + _icon('eye', 11) + 'What the camera knows</div>'
        + cam.text + '</div>'
      : '');
}

function _card(title, label, ic, inner, tone) {
  return '<div class="al-card"' + (tone ? ' data-tone="' + tone + '"' : '') + '>'
    + '<div class="al-label">' + _ic(ic, 14) + _esc(label) + '</div>'
    + (title ? '<h3 class="al-h">' + _esc(title) + '</h3>' : '')
    + inner + '</div>';
}
function _sums(bits) {
  return '<div class="al-sums">' + bits.map(b =>
    '<span class="al-sum"><span class="al-sum-k">' + _esc(b[0]) + '</span>'
    + '<span class="al-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>'
    + b[1] + '</span></span>').join('') + '</div>';
}

/**
 * A living Traitor nobody in the chair said tonight. Audience only.
 *
 * THE PEOPLE WHO SAT IN THE CHAIR ARE EXCLUDED AS WELL AS THE NAMES THEY GAVE.
 * The first draft counted only the names given and printed *"Bowie was not
 * mentioned once tonight, not by anybody, in any chair"* over an evening whose
 * opening card was Bowie in the accused seat, being asked about it. Found by
 * reading the dump.
 */
function _unnamed(v, given, spoke) {
  const said = new Set([...given, ...(spoke || [])]);
  const quiet = (v.living || []).filter(n =>
    (v.truth || {})[n] === 'traitor' && !said.has(n));
  if (!quiet.length) return null;
  return quiet.sort((a, b) =>
    _unit('al|q|' + v.ep + '|' + a) - _unit('al|q|' + v.ep + '|' + b))[0];
}

function _buildBeats(v) {
  const beats = [];
  const key = 'al|' + v.ep + '|' + v.living.length;
  const used = new Set();
  const push = (phase, html, meta) => beats.push({ phase, html, meta: meta || null });

  if (!v.truthKnown && !v.inChair) {
    push('open', _card('You Were Not In The Chair', 'The alcove', 'alcove',
      '<p>People sat in that room tonight and you were not one of them. What '
      + 'they said in there was said to a camera and to nobody else, and there '
      + 'is no door in this castle that opens on it.</p>', 'quiet'),
    { kind: 'open' });
    return beats;
  }

  // ── 1. THE ROOM ─────────────────────────────────────────────────────
  const n = v.seats.length;
  push('open', _card(v.truthKnown ? 'The Alcove' : 'Your Turn In The Chair',
    'The alcove', 'alcove',
    '<p>' + (v.truthKnown
      ? _pair([OPEN_A, OPEN_B], key + '|open', used)
      : 'One chair, one lamp and a door that shuts. What you say in here goes '
        + 'nowhere. That is the only reason anybody says it.') + '</p>'
    + (v.truthKnown
      ? _sums([
        ['In the castle', v.living.length],
        ['In the chair tonight', n, n ? 'warm' : null],
      ])
      : ''), 'quiet'), { kind: 'open' });

  // ── 2. ONE PERSON AT A TIME ─────────────────────────────────────────
  const given = [];
  v.seats.forEach((seat) => {
    const said = _saidBy(seat, key, used, v.ep);
    const cam = v.truthKnown ? _cameraLine(v, seat, said.top, key, used) : null;
    if (said.top) given.push(said.top.name);
    push('chair', _shot(seat, said, cam), {
      kind: 'chair',
      observer: seat.observer,
      role: seat.role,
      gave: said.top ? said.top.name : null,
      // GATED WITH THE CARD. The call sheet learns a slot's answer at exactly
      // the moment the reader does, and not one beat earlier.
      hit: v.truthKnown && said.top
        ? ((v.truth || {})[said.top.name] === 'traitor') : null,
      speakerTruth: v.truthKnown
        ? ((v.truth || {})[seat.observer] || 'faithful') : null,
    });
  });

  // ── 3. THE LAMP GOES OFF ────────────────────────────────────────────
  if (v.truthKnown) {
    const hits = given.filter(nm => (v.truth || {})[nm] === 'traitor').length;
    const halves = given.length === 0 ? [CLOSE_NONE_A, CLOSE_NONE_B]
      : (hits === 0 ? [CLOSE_MISS_A, CLOSE_MISS_B]
        : (hits === given.length ? [CLOSE_HIT_A, CLOSE_HIT_B]
          : [CLOSE_SPLIT_A, CLOSE_SPLIT_B]));
    const quiet = _unnamed(v, given, v.seats.map(x => x.observer));
    push('close', _card('And The Lamp Goes Off', _pick(CLOSE_LEAD, key + '|cl'), 'crop',
      '<p>' + _fill(_pair(halves, key + '|cp', used), { N: _Word(v.seats.length) })
      + '</p>'
      + (quiet
        ? '<p>' + _fill(_pick(CLOSE_QUIET, key + '|cq'), { who: _esc(quiet) }) + '</p>'
        : '')
      + _sums([
        ['Names given', given.length],
        ['Names that were right', hits, hits ? 'warm' : 'wrong'],
      ]), hits ? 'warm' : 'quiet'), { kind: 'close', hits, given: given.length });
  } else {
    push('close', _card('And The Lamp Goes Off', 'The door', 'crop',
      '<p>' + _pick(CLOSE_MINE, key + '|cm') + '</p>', 'quiet'), { kind: 'close' });
  }

  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE CALL SHEET — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trConfessionals`, because a <script> tag inside innerHTML
// does not execute. GATED ON `idx` IN BOTH DIRECTIONS: a slot fills only once
// its own card has been read, and the mark saying whether the name was right
// arrives with the camera line that says so. A sheet that shows the finished
// evening on the first click has spoiled a screen whose whole subject is not
// knowing yet.

function _sheet(state, idx) {
  const v = state.v;
  const all = state.stepMeta.filter(m => m && m.kind === 'chair');
  const seen = state.stepMeta.slice(0, Math.max(0, idx + 1))
    .filter(m => m && m.kind === 'chair');
  const done = new Set(seen.map(m => m.observer));

  const slots = all.map(m => {
    if (!done.has(m.observer)) {
      return '<div class="al-slot" data-empty="1">'
        + '<span class="al-slot-mk"></span>'
        + '<span class="al-slot-t"><span class="al-slot-nm">&mdash;</span>'
        + '<span class="al-slot-said">still to come in</span></span></div>';
    }
    const attrs = (m.speakerTruth ? ' data-truth="' + _esc(m.speakerTruth) + '"' : '')
      + (m.hit == null ? '' : ' data-hit="' + (m.hit ? 1 : 0) + '"');
    return '<div class="al-slot"' + attrs + '>'
      + '<span class="al-slot-mk"></span>'
      + '<span class="al-slot-t"><span class="al-slot-nm">' + _esc(m.observer)
      + '</span><span class="al-slot-said">'
      + (m.gave ? 'gave ' + _esc(m.gave) : 'gave no name') + '</span></span></div>';
  }).join('');

  const gave = seen.filter(m => m.gave).length;
  const foot = [];
  foot.push('<span><b>' + seen.length + '</b> of ' + all.length + ' in the chair</span>');
  foot.push('<span data-tone="warm"><b>' + gave + '</b> ' + _s(gave, 'name')
    + ' given</span>');
  if (v.truthKnown) {
    const hits = seen.filter(m => m.hit === true).length;
    foot.push('<span><b>' + (gave ? hits : '&mdash;') + '</b> of those right</span>');
  } else {
    foot.push('<span><b>' + (v.living || []).length + '</b> still in the castle</span>');
  }

  return '<div class="al-sheet">'
    + '<div class="al-sheet-h"><span>'
    + (v.truthKnown ? 'Who sat in the chair' : 'Your turn') + '</span><b>'
    + (seen.length >= all.length ? 'Wrapped' : 'Rolling') + '</b></div>'
    + '<div class="al-sheet-body">' + slots + '</div>'
    + '<div class="al-sheet-foot">' + foot.join('') + '</div>'
    + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'confessionals-' + (epNum || 0); }
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
    const el = document.getElementById('al-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('al-vis'); else el.classList.remove('al-vis');
  }
  const counter = document.getElementById('al-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('al-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.al-btn').forEach(b => b.classList.toggle('al-dim', done));
  }
  const shell = document.getElementById('al-shell-' + suffix);
  const last = document.getElementById('al-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase',
    last.getAttribute('data-phase') || 'open');
  if (scroller) scroller.scrollTop = top;
}

function _updateSheet(epNum, idx) {
  const el = document.getElementById('al-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trConfessionals) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _sheet(state, idx);
}

/** Bring the new card into view, UNDER the call sheet rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('al-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trConfessionalsRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('al-step-' + suffix + '-' + st.idx));
  _updateSheet(epNum, st.idx);
}

export function trConfessionalsRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateSheet(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildConfessionals(ep, observer)` — the chair, and what gets said in it.
 *
 * `ep` is an `episodeHistory` row carrying `tr.beliefs`, which js/tr/headless.js
 * writes on every night that is not an endgame table (spec §8 reveals nothing
 * there, so there is nothing to be ironic about). `observer` is `'audience'` or
 * `'player:<Name>'`; `_view` is where the gate lives and it is the only place
 * the question is answered.
 */
/**
 * THE CONFESSIONALS AS FOLDED BEATS — for the Castle Day's night segment.
 *
 * Plan 11 retired the standalone Alcove screen and folds the chair INTO the
 * castle-day stream, beside the night it is the voice of. This is the seam: it
 * reuses `_view` (the observer gate, unchanged and untouched) and `_buildBeats`
 * (the exact composition the standalone screen drew), and hands back the beats
 * — `{ phase, html, meta }` — for castle-day.js to wrap in its own reveal
 * stream. The observer contract is the one `_view` already enforces: audience
 * gets the room and the camera's truth strip, a player gets their own chair and
 * nothing else. This function WIDENS NOTHING — it passes `observer` straight
 * through and returns exactly what `rpBuildConfessionals` would have rendered.
 *
 * `null` when there is nothing to say (no beliefs on the record). An empty array
 * is impossible from a live view — `_buildBeats` always opens with a card — so
 * the caller can treat a null as "no chair tonight".
 */
export function confessionalBeats(ep, observer = 'audience') {
  const v = _view(ep, observer);
  if (!v) return null;
  return _buildBeats(v);
}

/** The Alcove's stylesheet + filters, so a host screen can draw `al-*` cards. */
export function confessionalStyle() {
  return '<style>' + AL_CSS + '</style>' + _filters();
}

export function rpBuildConfessionals(ep, observer = 'audience') {
  const suffix = 'confessionals';
  const vars = '--al-grain-src:' + _noiseTile('0.82', 4, 23, 0.26, 220) + ';';
  const css = '<style>' + AL_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v) {
    return '<div class="al-root" style="' + vars + '">' + css
      + '<div class="al-shell" data-phase="open">'
      + '<div class="al-scenery" aria-hidden="true">'
      + '<div class="al-dark"></div><div class="al-far">' + _far() + '</div>'
      + '<div class="al-vig"></div><div class="al-grain"></div></div>'
      + '<div class="al-body"><div class="al-main"><div class="al-veil">'
      + _ic('alcove', 76, 'rgba(224,176,112,.34)')
      + '<div class="al-veil-h">Nobody Came In</div>'
      + '<p>The chair stood empty on this night. Nothing was said to the camera '
      + 'that anybody would have wanted said.</p>'
      + '</div></div></div></div></div>';
  }

  const beats = _buildBeats(v);
  const total = beats.length;
  const epNum = ep.num || v.ep || 1;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trConfessionals = window.__trConfessionals || {};
    window.__trConfessionals[epNum] = state;
  }

  const observerBadge = v.isAudience
    ? '<div class="al-observer" data-layer="audience">' + _icon('eye', 13)
      + '<b>Observer: audience</b> <em>&mdash; you hear all of it, and you have known '
      + 'the answer since the first night. Nobody in that chair ever will, '
      + 'which is the only reason any of this is worth listening to</em></div>'
    : '<div class="al-observer" data-layer="player">' + _icon('eye', 13)
      + '<b>Observer: ' + _esc(v.watcher || 'a player')
      + '</b> <em>&mdash; your own minute in that room. What anybody else said to '
      + 'that camera was said to nobody, and there is no door in this castle '
      + 'that opens on it</em></div>';

  // The Round Table's first-paint pattern: visibility is baked in from `st.idx`
  // at emit time, because conclave.js relied on a click and shipped a screen
  // that was blank until the viewer pressed something.
  const stream = beats.map((b, i) =>
    '<div class="al-beat' + (i <= st.idx ? ' al-vis' : '')
    + '" id="al-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state on
  // every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="al-root" style="' + vars + '">' + css
    + '<div class="al-shell" id="al-shell-' + suffix + '"'
    + ' data-phase="' + beats[0].phase + '">'
    + '<div class="al-scenery" aria-hidden="true">'
    + '<div class="al-dark"></div>'
    + '<div class="al-drape"></div>'
    + '<div class="al-far">' + _far() + '</div>'
    + '<div class="al-mid">' + _mid(epNum + '|' + v.living.length) + '</div>'
    + '<div class="al-fore">' + _fore() + '</div>'
    + '<div class="al-vig"></div>'
    + '<div class="al-grain"></div>'
    + '</div>'
    + '<div class="al-body">'
    + '<div class="al-hero">' + _heroScene()
    + '<div class="al-hero-lock">'
    // "Day N" and not "Season I - Day I", for the reason all ten other screens
    // say so: the episode record carries no season number.
    + '<div class="al-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; Said To Nobody</div>'
    + '<h1 class="al-title">THE ALCOVE</h1>'
    + '<div class="al-title-rule"><i></i>' + _ic('lens', 34, '#e0b070')
    + '<i></i></div>'
    + '<p class="al-sub">'
    + (v.isAudience
      ? 'One chair, and a queue of people about to tell it exactly who they '
        + 'think is lying. You have known the answer since the first night. '
        + 'Not one of them ever will.'
      : 'One chair, one lamp, and a minute in which you do not have to be '
        + 'careful about any of it.')
    + '</p>'
    + '</div></div>'
    + '<header class="al-head">' + observerBadge + '</header>'
    + '<div class="al-stage" id="al-stage-inner">' + _sheet(state, st.idx) + '</div>'
    + '<main class="al-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="al-controls" id="al-controls-' + suffix + '">'
    + '<button class="al-btn" onclick="' + call('trConfessionalsRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="al-counter" id="al-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="al-btn" onclick="' + call('trConfessionalsRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
