// ══════════════════════════════════════════════════════════════════════
// vp-tr/endgame.js — banish again, or end it, and nobody is turned over
// ══════════════════════════════════════════════════════════════════════
//
// Built in the language Task 1 approved and Tasks 2-4 extended. SHARED: the
// type system (Fraunces 900 for display, IM Fell English for anything spoken
// or written by hand, Cormorant Garamond for body), the neutral `_portrait()`
// and its stylesheet, `_icon()` for objects that must be the same drawing on
// every screen, the reveal machinery, the sticky-stage architecture, and the
// rule that nothing writes a host name or an exit word as a literal.
//
// ── AND THE DEPARTURE, WHICH IS AN ABSENCE ────────────────────────────
//
// Spec 8. Everywhere else in this show a departure ends in an ANSWER: the
// host turns a card over, the room finds out what it just did, and the next
// table is played on the evidence the last one produced. At the end that
// stops. `runEndgame` calls the table with `reveal:false`, nobody who leaves
// says what they were, and the survivors carry on with exactly the beliefs
// they walked in with.
//
// So the screen is built around the missing payoff rather than around a new
// one, and every choice below is the same choice:
//
//   THE FIRE IS OUT. The hall is fifty-six candles and a lantern; the turret
//   is one lamp in the dark; the estate is daylight. This room is the SAME
//   candles with the light gone -- cold wicks and smoke going up off them, on
//   coprime periods, because Task 2's flame rules apply just as well to a
//   flame that is not there. It is the one screen in the set with no fire on
//   it at all, and that is the whole of "colder than the Round Table".
//
//   IT IS NOT THE RING, AND THE REASON IS THE RING'S OWN GRAMMAR. The Round
//   Table draws everybody at once with the argument crossing the space as
//   chords from a voter's seat to the seat they named. There are no chords
//   here: the question is answered in private, in writing, and counted
//   without being read out. A ring with nothing drawn between the seats is
//   the Round Table with its content deleted, which reads as a fault rather
//   than as a decision -- and Task 2 already renders these very tables as a
//   ring, so reusing it would print the same primitive twice in one episode.
//   The primitive here is the SEALED SLIP, dealt back out one at a time.
//
//   THE CARDS ARE DEALT ACROSS A TABLE. The turret drew them out of the dark,
//   the hall leant them in, the morning brought them down a stair, the book
//   wrote them, the estate hauled them in on a rope and the corridor refused
//   to move at all. These are pushed in from the left, flat, one after the
//   other, because that is what somebody collecting folded paper and handing
//   it back does.
//
//   THE SCREEN IS GREY UNTIL THE MONEY. There is exactly one warm colour on
//   it and it arrives on the last card. Everything upstream -- every slip,
//   every count, every name that leaves -- is ash and slate, because none of
//   it is ever explained. The pot is the season's one legitimate reveal
//   (js/tr/endgame.js says so of `resolvePot`: the game is over, the cloaks
//   come off) and it is the only thing on the screen allowed to be warm.
//
// ── AND THE THING THAT MUST NOT HAPPEN ────────────────────────────────
//
// `endgameChoice` returns the whole basis of a decision and half of it is
// ground truth -- a `role` read off `alignmentAt`, and a `fellows` list that
// exists only on one side. The record in js/tr/headless.js rebuilds each
// choice to two fields rather than copying and pruning, and `_view` below
// rebuilds them AGAIN off a record it does not trust. Both locks are
// individually catchable, which is the point: the record's is caught by
// reading the record, and the screen's is caught by handing it a forged one.
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
const _num = n => Number(n || 0).toLocaleString('en-US');
/**
 * MONEY, WITH THE SYMBOL ON IT.
 *
 * The other four screens print the fund as "&pound;12,111" and this one printed
 * "12,111" -- the same quantity, in a room whose entire subject is that
 * quantity, written as if it were a count of chairs. Found by dumping a season
 * and reading it: the day book, the mission and the transcript all said pounds
 * and the strongbox said a number.
 */
const _money = n => '&pound;' + Number(n || 0).toLocaleString('en-GB');
/** "A", "A and B", "A, B and C" — a four-way split must not read as a chant. */
function _listOf(names) {
  const a = (names || []).filter(Boolean);
  if (a.length <= 1) return a[0] || '';
  if (a.length === 2) return a[0] + ' and ' + a[1];
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
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
/** A face at the last table, and it is NEUTRAL — `.cv-lit` is the turret's. */
function _av(name, size) {
  return _portrait(_slugOf(name), name, size || 34);
}
function _hostAv(size) {
  const h = _host();
  return _portrait(h.slug, h.name, size || 46);
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — this room's own objects, hand-drawn SVG, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// The seal, the eye, the coffer, the chair and the chevron come from
// `_icon()` in conclave.js and are NOT redrawn: they are the same objects on
// every screen in this directory. These are the ones only this room needs.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    // A FOLDED SLIP, STILL FOLDED. The whole screen in one drawing.
    slip: '<path d="M4.4 5.2h15.2v13.6H4.4z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M4.4 12h15.2" stroke="' + c + '" stroke-width="1.1" opacity=".8"/>'
      + '<path d="M8 8.6h8M8 15.4h5.6" stroke="' + c + '" stroke-width="1" opacity=".45"/>',
    // The same slip, opened out.
    read: '<path d="M3.4 6.2 12 4l8.6 2.2v13.4L12 17.4 3.4 19.6z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M12 4v13.4" stroke="' + c + '" stroke-width="1.1" opacity=".7"/>'
      + '<path d="M6 9.2h3.4M14.6 9.2H18M6 13h3.4M14.6 13H18" stroke="' + c + '" stroke-width="1" opacity=".5"/>',
    // A WICK THAT IS OUT, with the thread of smoke off it. The set's only
    // candle with nothing burning on top of it.
    cold: '<path d="M8.6 9.4h6.8v11.2H8.6z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M8.6 9.4c0-1 6.8-1 6.8 0" stroke="' + c + '" stroke-width="1.1"/>'
      + '<path d="M12 9.2V7.4" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M12 6.6c2-1 0-2.2 1.6-3.4M12 6.6c-1.8-.8-.2-1.9-1.4-3" stroke="' + c
      + '" stroke-width="1" opacity=".6"/>',
    // Four strokes and a fifth through them: a count nobody read aloud.
    tally: '<path d="M5 5.6v12.8M9 5.6v12.8M13 5.6v12.8M17 5.6v12.8" stroke="' + c
      + '" stroke-width="1.4"/><path d="M3.4 15.6 18.8 8.4" stroke="' + c + '" stroke-width="1.4"/>',
    // A bell rope with nothing on the end of it. The first drawing was a mouth
    // with a line across it and read unmistakably as a censor bar, which is a
    // thing a castle does not contain -- found by looking at it.
    silence: '<path d="M12 2.6v13.2" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M12 15.8c-2.6 0-4.6 1.6-4.6 3.2h9.2c0-1.6-2-3.2-4.6-3.2z" stroke="' + c
      + '" stroke-width="1.3"/>'
      + '<path d="M4.6 21.4h14.8" stroke="' + c + '" stroke-width="1.2" opacity=".55"/>',
    // Two hands and nothing between them.
    part: '<path d="M2.6 12h6.2M15.2 12h6.2" stroke="' + c + '" stroke-width="1.5"/>'
      + '<circle cx="12" cy="12" r="2.4" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M12 3.4v3.6M12 17v3.6" stroke="' + c + '" stroke-width="1.2" opacity=".55"/>',
    chevron: '<path d="M9 5.4 16 12l-7 6.6" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE ROOM AFTER EVERYBODY HAS LEFT IT — three planes, and it IS a place
// ══════════════════════════════════════════════════════════════════════
//
// COLD IS NOT THE SAME AS EMPTY, and the first version of this screen made
// that mistake in the most literal way available: the scenery ran 1500px, the
// shell under it was flat near-black, and a page two and a half thousand
// pixels long therefore had NO ROOM IN IT below the first screenful. It did
// not read as the end of something. It read as nothing having rendered.
//
// The absence at the endgame belongs to what is WITHHELD -- no alignment, a
// departure that ends in silence, survivors carrying on without ever being
// told whether they were right. That is carried by the content, and the
// content is where it stays. The environment is a real place, and it is the
// SAME CASTLE at the end of it:
//
//   * THE ROOM AFTER EVERYBODY HAS LEFT IT. The chairs are pushed back from
//     the table at the angles people leave them at, not deleted. The long
//     table is still there with almost nobody at it.
//   * THE FIRE HAS RUN DOWN. Every other screen in this set is lit by flame --
//     forty candles in the hall, one lantern in the turret. Here the hearth is
//     grey ash with ONE EMBER still in it, breathing. That is far colder than
//     blackness and it is spoken in the language the set already has.
//   * DAWN, OR THE HOUR BEFORE IT. Cold blue-grey through three tall windows
//     rather than lantern amber -- the one hour of the day this show has not
//     used, and the only light in the building.
//   * THE POT IS PHYSICALLY ON THE TABLE. It is the only thing anybody is
//     still in the castle for, so it is in the room where they can see it.
//
// The planes run 2600px and the shell carries a lit stone gradient the whole
// way down underneath them, so there is no scroll position at which the place
// stops existing.

const ROOM_H = 2600;

/** The far plane: the wall, the windows, the hearth, and the dawn. */
function _roomFar() {
  return '<svg viewBox="0 0 1100 ' + ROOM_H + '" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="ltWall" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#1b232e"/><stop offset="26%" stop-color="#151c26"/>'
    + '<stop offset="64%" stop-color="#111721"/><stop offset="100%" stop-color="#0d131b"/>'
    + '</linearGradient>'
    + '<linearGradient id="ltDawn" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#9fb8d2" stop-opacity=".42"/>'
    + '<stop offset="100%" stop-color="#9fb8d2" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<radialGradient id="ltEmber" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#ff9a4a" stop-opacity=".55"/>'
    + '<stop offset="100%" stop-color="#ff9a4a" stop-opacity="0"/>'
    + '</radialGradient>'
    + '</defs>'
    + '<rect width="1100" height="' + ROOM_H + '" fill="url(#ltWall)"/>'
    + _courses()
    // THE WINDOWS, and the hour before sunrise coming through them. There is
    // no lamp in this room: the light is the morning, which nobody asked for.
    + '<path d="M232 168a52 52 0 0 1 104 0v250H232z" fill="#a8c0d8" opacity=".3"/>'
    + '<path d="M498 132a52 52 0 0 1 104 0v286H498z" fill="#b6cce2" opacity=".38"/>'
    + '<path d="M764 168a52 52 0 0 1 104 0v250H764z" fill="#a8c0d8" opacity=".3"/>'
    + '<path d="M232 168a52 52 0 0 1 104 0v250H232zM498 132a52 52 0 0 1 104 0v286H498z'
    + 'M764 168a52 52 0 0 1 104 0v250H764z" fill="none" stroke="#0a0f16" stroke-width="9"/>'
    + '<path d="M284 106v312M550 70v348M816 106v312" stroke="#0a0f16" stroke-width="7"/>'
    + '<rect y="70" width="1100" height="620" fill="url(#ltDawn)"/>'
    // the shape the windows throw on the far wall, low and cold
    + '<path d="M170 700 L398 700 L446 980 L136 980 Z" fill="#a8c0d8" opacity=".07"/>'
    + '<path d="M702 700 L930 700 L964 980 L654 980 Z" fill="#a8c0d8" opacity=".06"/>'
    + _hearth()
    + '</svg>';
}

/** Stone courses down the wall, so it is masonry rather than a gradient. */
function _courses() {
  let s = '<g opacity=".5">';
  for (let y = 120; y < ROOM_H; y += 74) {
    s += '<path d="M0 ' + y + 'h1100" stroke="#0c1119" stroke-width="2" opacity=".7"/>';
    const off = ((y / 74) % 2) ? 108 : 0;
    for (let x = off; x < 1100; x += 216) {
      s += '<path d="M' + x + ' ' + y + 'v74" stroke="#0c1119" stroke-width="2" opacity=".45"/>';
    }
  }
  return s + '</g>';
}

/**
 * The hearth, and it is the whole thesis in one object.
 *
 * Grey ash, a burnt-through log, and ONE EMBER still alive in it. Every other
 * screen in this directory is lit by fire; this is what is left of that fire,
 * and it is the only warm pixel on the screen until the strongbox opens.
 */
function _hearth() {
  return '<g>'
    + '<path d="M40 980h250v300H40z" fill="#0a0f16" stroke="#1d2531" stroke-width="6"/>'
    + '<path d="M40 980a125 60 0 0 1 250 0" fill="#0a0f16" stroke="#1d2531" stroke-width="6"/>'
    + '<path d="M24 1272h282v26H24z" fill="#222b38"/>'
    // the ash bed
    + '<path d="M74 1272c14-56 46-84 91-84s77 28 91 84z" fill="#39414d" opacity=".85"/>'
    + '<path d="M96 1272c10-38 32-58 69-58s59 20 69 58z" fill="#4a525e" opacity=".7"/>'
    // a log that burned through and fell in two
    + '<path d="M108 1246l58-16 10 22-58 16z" fill="#161b23"/>'
    + '<path d="M178 1240l60 12-6 24-60-12z" fill="#141920"/>'
    // THE EMBER. One, small, breathing on its own slow period.
    + '<ellipse class="lt-ember-glow" cx="172" cy="1244" rx="86" ry="52" fill="url(#ltEmber)"/>'
    + '<ellipse class="lt-ember" cx="172" cy="1244" rx="9" ry="5" fill="#ff8a3c"/>'
    + '<ellipse class="lt-ember" cx="196" cy="1250" rx="4" ry="2.6" fill="#ffb066"'
    + ' style="animation-duration:23s"/>'
    + '</g>';
}

/** The mid plane: the table, the chairs pushed back, and the pot on it. */
function _roomMid(seed, wicks) {
  const rng = _fieldRng('lt|mid|' + seed);
  const n = Math.max(3, Math.min(9, wicks || 5));
  let s = '<svg viewBox="0 0 1100 ' + ROOM_H + '" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="ltTable" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#242c37"/><stop offset="42%" stop-color="#19202a"/>'
    + '<stop offset="100%" stop-color="#0e141c"/>'
    + '</linearGradient></defs>'
    // the table, running away from the viewer and off the bottom of the room
    + '<path d="M436 588 L664 588 L1006 ' + ROOM_H + ' L94 ' + ROOM_H + ' Z" fill="url(#ltTable)"/>'
    + '<path d="M436 588 L664 588 L676 616 L424 616 Z" fill="#333c4a"/>'
    // the grain of it, receding
    + _tableGrain();
  // THE CHAIRS ARE PUSHED BACK, NOT ABSENT. Everybody who is gone left one,
  // and they left it at the angle people leave a chair at when they stand up
  // and do not come back. The room reads as vacated rather than unfurnished.
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const y = 660 + 1500 * (t * t + t) / 2;
    const w = 54 + 108 * t, h = 88 + 176 * t;
    const push = 40 + 130 * t;
    const tilt = [-9, 7, -5, 11, -13, 6][i];
    for (const [x, dir] of [[330 - 230 * t - push, -1], [770 + 230 * t + push - w, 1]]) {
      s += '<g transform="rotate(' + (tilt * dir) + ' ' + (x + w / 2).toFixed(0) + ' '
        + (y + h).toFixed(0) + ')">'
        + '<path d="M' + x.toFixed(0) + ' ' + (y + h).toFixed(0) + 'V' + y.toFixed(0)
        + 'h' + w.toFixed(0) + 'v' + h.toFixed(0) + 'z" fill="#111823"'
        + ' stroke="#28323f" stroke-width="4"/>'
        + '<path d="M' + (x + 6).toFixed(0) + ' ' + (y + 14).toFixed(0) + 'h'
        + (w - 12).toFixed(0) + 'v' + (h * 0.42).toFixed(0) + 'h' + (12 - w).toFixed(0)
        + 'z" fill="#0b111a" opacity=".8"/>'
        + '</g>';
    }
  }
  // THE POT, ON THE TABLE, WHERE THEY CAN SEE IT. It is the only reason
  // anybody is still in the building.
  s += '<g>'
    + '<ellipse cx="550" cy="742" rx="118" ry="26" fill="#05080d" opacity=".7"/>'
    + '<path d="M448 636h204v96H448z" fill="#171e28" stroke="#3a4553" stroke-width="5"/>'
    + '<path d="M448 636c0-40 204-40 204 0" fill="#1b232e" stroke="#3a4553" stroke-width="5"/>'
    + '<rect x="448" y="672" width="204" height="10" fill="#3a4553"/>'
    + '<rect x="536" y="666" width="28" height="34" fill="#4a5666"/>'
    + '<circle cx="550" cy="684" r="5" fill="#0b111a"/>'
    + '<path d="M470 620h30v-14h-30z" fill="#4a5666" opacity=".8"/>'
    + '<path d="M600 620h30v-14h-30z" fill="#4a5666" opacity=".8"/>'
    + '</g>';
  // THE WICKS, and every one of them is out. Smoke is the only thing on this
  // screen that moves, and the periods are coprime for the reason Task 2
  // measured: a shared beat is visible as one.
  const PERIODS = [13, 17, 19, 23, 29, 31, 37, 41, 43];
  for (let i = 0; i < n; i++) {
    const x = 300 + (i - (n - 1) / 2) * 62;
    const y = 806 + (rng() * 12);
    const hgt = 44 + rng() * 26;
    s += '<g>'
      + '<rect x="' + (x - 8).toFixed(0) + '" y="' + (y - hgt).toFixed(0)
      + '" width="16" height="' + hgt.toFixed(0) + '" fill="#2b3340"/>'
      + '<rect x="' + (x - 8).toFixed(0) + '" y="' + (y - hgt).toFixed(0)
      + '" width="16" height="4" fill="#4b5666"/>'
      + '<path class="lt-smoke" d="M' + x.toFixed(0) + ' ' + (y - hgt - 2).toFixed(0)
      + 'c9-16-8-22 2-40c8-14-4-20 1-32" stroke="#a8bccf" stroke-width="2.6" fill="none"'
      + ' opacity=".26" style="animation-duration:' + PERIODS[i % PERIODS.length]
      + 's;animation-delay:-' + (i * 3.7).toFixed(1) + 's"/>'
      + '</g>';
  }
  // and the same again on the other side of the pot
  for (let i = 0; i < Math.max(2, n - 2); i++) {
    const x = 800 + (i - (n - 3) / 2) * 62;
    const y = 812 + (rng() * 12);
    const hgt = 40 + rng() * 26;
    s += '<g>'
      + '<rect x="' + (x - 8).toFixed(0) + '" y="' + (y - hgt).toFixed(0)
      + '" width="16" height="' + hgt.toFixed(0) + '" fill="#2b3340"/>'
      + '<rect x="' + (x - 8).toFixed(0) + '" y="' + (y - hgt).toFixed(0)
      + '" width="16" height="4" fill="#4b5666"/>'
      + '<path class="lt-smoke" d="M' + x.toFixed(0) + ' ' + (y - hgt - 2).toFixed(0)
      + 'c-8-15 7-21-2-38c-7-13 3-19-1-30" stroke="#a8bccf" stroke-width="2.4" fill="none"'
      + ' opacity=".22" style="animation-duration:' + PERIODS[(i + 4) % PERIODS.length]
      + 's;animation-delay:-' + (i * 5.3 + 2).toFixed(1) + 's"/>'
      + '</g>';
  }
  // ash in the air, the whole height of the room
  for (let i = 0; i < 54; i++) {
    s += '<circle class="lt-ash" cx="' + (60 + rng() * 980).toFixed(0) + '" cy="'
      + (200 + rng() * (ROOM_H - 300)).toFixed(0) + '" r="' + (0.9 + rng() * 1.7).toFixed(1)
      + '" fill="#cfdae6" opacity="' + (0.12 + rng() * 0.24).toFixed(2)
      + '" style="animation-duration:' + (26 + rng() * 22).toFixed(1)
      + 's;animation-delay:-' + (rng() * 34).toFixed(1) + 's"/>';
  }
  return s + '</svg>';
}

/** The boards of the table, receding. */
function _tableGrain() {
  let s = '<g opacity=".5">';
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const xTop = 436 + 228 * t, xBot = 94 + 912 * t;
    s += '<path d="M' + xTop.toFixed(0) + ' 588 L' + xBot.toFixed(0) + ' ' + ROOM_H
      + '" stroke="#0d131b" stroke-width="3"/>';
  }
  return s + '</g>';
}

/** The fore plane: the near arch, and the edges of the frame. */
function _roomFore() {
  return '<svg viewBox="0 0 1100 ' + ROOM_H + '" preserveAspectRatio="xMidYMin slice">'
    + '<path d="M0 0h1100v88c-190 38-360 58-550 58S190 126 0 88z" fill="#05080d"/>'
    + '<path d="M0 0h120v' + ROOM_H + 'H0z" fill="#05080d" opacity=".78"/>'
    + '<path d="M980 0h120v' + ROOM_H + 'H980z" fill="#05080d" opacity=".78"/>'
    + '</svg>';
}

/**
 * The hero plate: a row of folded slips, face down, on a bare table.
 *
 * THE ROOM IN THE TOP, THE PAPER DOWN THE SIDES, AND NOTHING WHERE THE WORDS
 * GO. Two defects were found by rendering the first version and looking at it,
 * and they are the same two Task 4 found:
 *
 *   * the top two thirds were an empty gradient, so the plate said nothing
 *     about what room this is. The table now recedes to a strongbox under the
 *     windows, with the cast's own chairs standing empty either side of it and
 *     two cold wicks smoking on the cloth -- the screen's whole thesis, drawn.
 *   * the slips sat UNDER the scrim and read as grey smudges either side of
 *     the sentence. Paper is the one bright thing in this room, so it is drawn
 *     ON TOP of the scrim and kept out of the centre 660px, which is where the
 *     lockup is. The scrim then darkens the room and not the paper.
 */
function _heroScene(count) {
  const n = Math.max(2, Math.min(9, count || 4));
  let s = '<svg class="lt-hero-scene" viewBox="0 0 1100 456" preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="ltHeroBg" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0c0f15"/><stop offset="66%" stop-color="#06080c"/>'
    + '<stop offset="100%" stop-color="#020305"/></linearGradient>'
    + '<linearGradient id="ltHeroSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#8fa2b6" stop-opacity=".3"/>'
    + '<stop offset="100%" stop-color="#8fa2b6" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="ltHeroCloth" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#1b212a"/><stop offset="100%" stop-color="#0a0d13"/>'
    + '</linearGradient>'
    + '<linearGradient id="ltHeroScrim" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#020305" stop-opacity="0"/>'
    + '<stop offset="52%" stop-color="#020305" stop-opacity=".62"/>'
    + '<stop offset="100%" stop-color="#020305" stop-opacity=".93"/></linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="456" fill="url(#ltHeroBg)"/>'
    + '<rect width="1100" height="250" fill="url(#ltHeroSky)"/>'
    // three high windows with the morning in them, and no lamp anywhere
    + '<path d="M300 24a34 34 0 0 1 68 0v128h-68zM516 8a34 34 0 0 1 68 0v144h-68z'
    + 'M732 24a34 34 0 0 1 68 0v128h-68z" fill="#8fa2b6" opacity=".2"/>'
    + '<path d="M334 -8v160M550 -24v176M766 -8v160" stroke="#05070a" stroke-width="6"/>'
    // the strongbox, shut, at the far end of the room
    + '<path d="M492 96h116v58H492z" fill="#0b0f15" stroke="#242c38" stroke-width="4"/>'
    + '<path d="M492 96c0-24 116-24 116 0" fill="#0b0f15" stroke="#242c38" stroke-width="4"/>'
    + '<rect x="492" y="118" width="116" height="6" fill="#242c38"/>'
    + '<rect x="542" y="114" width="16" height="20" fill="#2f3846"/>'
    // the table, running away from the viewer, and the chairs down both sides
    + '<path d="M470 154 L630 154 L1010 456 L90 456 Z" fill="url(#ltHeroCloth)"/>'
    + '<path d="M470 154 L630 154 L636 168 L464 168 Z" fill="#2a323e"/>'
    + _heroChairs()
    + _heroWicks()
    + '<rect y="120" width="1100" height="336" fill="url(#ltHeroScrim)"/>';
  // THE SLIPS, ON THE NEAR END OF THE TABLE AND ON TOP OF THE SCRIM.
  //
  // Both facts were found by rendering. UNDER the scrim they went grey and
  // read as smudges -- paper is the one bright thing in this room. And in the
  // middle of the plate they floated in mid-air like playing cards, because
  // the table is narrow up there: at this height the cloth runs almost the
  // full width, so a slip lying at the outer edge is lying ON something. The
  // centre 640px stays clear, which is where the lockup is.
  const half = Math.ceil(n / 2);
  const W = 62, H = 40;
  for (let i = 0; i < Math.min(n, 6); i++) {
    const left = i < half;
    const k = left ? i : i - half;
    const perSide = Math.max(1, left ? half : n - half);
    const x = left ? 118 + k * Math.min(58, 150 / perSide)
      : 1100 - 118 - W - k * Math.min(58, 150 / perSide);
    const y = 388 + ((i * 29) % 34);
    const rot = ((i * 37) % 15) - 7;
    s += '<g transform="rotate(' + rot + ' ' + (x + W / 2) + ' ' + (y + H / 2) + ')">'
      + '<path d="M' + (x + 3).toFixed(0) + ' ' + (y + H + 2).toFixed(0)
      + 'h' + W + 'v6h-' + W + 'z" fill="#020305" opacity=".6"/>'
      + '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'h' + W + 'v' + H
      + 'h-' + W + 'z" fill="#cdd4dc"/>'
      + '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'h' + W + 'v' + H
      + 'h-' + W + 'z" fill="none" stroke="#7f8791" stroke-width="2"/>'
      + '<path d="M' + x.toFixed(0) + ' ' + (y + H / 2).toFixed(0) + 'h' + W
      + '" stroke="#7f8791" stroke-width="2" opacity=".85"/>'
      + '</g>';
  }
  return s + '</svg>';
}

/** Empty chairs down both sides of the hero's table, receding. */
function _heroChairs() {
  let s = '<g>';
  for (let i = 0; i < 3; i++) {
    const t = i / 3;
    const y = 176 + 210 * (t * t + t) / 2;
    const w = 34 + 58 * t, h = 52 + 92 * t;
    for (const x of [402 - 190 * t, 698 + 190 * t - w]) {
      s += '<path d="M' + x.toFixed(0) + ' ' + (y + h).toFixed(0) + 'V' + y.toFixed(0)
        + 'h' + w.toFixed(0) + 'v' + h.toFixed(0) + 'z" fill="#070a10"'
        + ' stroke="#1a1f29" stroke-width="3" opacity=".92"/>';
    }
  }
  return s + '</g>';
}

/** Two candles on the cloth, both out, both still smoking. Coprime periods. */
function _heroWicks() {
  let s = '<g>';
  const at = [[512, 200, 13], [578, 208, 17]];
  for (const [x, y, per] of at) {
    s += '<rect x="' + (x - 5) + '" y="' + (y - 34) + '" width="10" height="34" fill="#232a34"/>'
      + '<rect x="' + (x - 5) + '" y="' + (y - 34) + '" width="10" height="3" fill="#3c4552"/>'
      + '<path class="lt-smoke" d="M' + x + ' ' + (y - 36)
      + 'c7-12-6-16 2-30c6-10-3-15 1-24" stroke="#9fb0c2" stroke-width="2" fill="none"'
      + ' opacity=".2" style="animation-duration:' + per + 's"/>';
  }
  return s + '</g>';
}

/**
 * Ash in the air, over the WHOLE page rather than over the drawn room.
 *
 * The planes are 2600px and an episode with six asks is over five thousand,
 * so everything the room does stops half way down. These are positioned in
 * percentages of the shell, which means the bottom of a long episode is still
 * a room with something moving in it. Simple dots, which is the one thing
 * this project lets CSS draw.
 */
function _air(seed) {
  const rng = _fieldRng('lt|air|' + seed);
  let s = '';
  for (let i = 0; i < 46; i++) {
    const r = (1 + rng() * 2.2).toFixed(1);
    s += '<span class="lt-mote" style="left:' + (2 + rng() * 96).toFixed(1)
      + '%;top:' + (2 + rng() * 96).toFixed(1) + '%;width:' + r + 'px;height:' + r
      + 'px;opacity:' + (0.1 + rng() * 0.26).toFixed(2)
      + ';animation-duration:' + (24 + rng() * 26).toFixed(1)
      + 's;animation-delay:-' + (rng() * 40).toFixed(1) + 's"></span>';
  }
  return s;
}

/** The filter bank. */
function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="ltCrease" x="-4%" y="-4%" width="108%" height="108%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="3" seed="29" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '</defs></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VISUAL SYSTEM — ash and slate, and one warm card at the very end
// ══════════════════════════════════════════════════════════════════════
const LT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.lt-root{
  --lt-ash:#0a0c11;
  --lt-ash-2:#040508;
  --lt-slate:#151a22;
  --lt-cold:#8fa2b6;
  --lt-bone:#dde3ea;
  --lt-smoke:#5d6873;
  --lt-paper:#cdd4dc;
  --lt-wax:#8e1526;
  --lt-wax-hot:#c8455a;
  --lt-brass:#b98f3e;
  --lt-brass-hot:#f4dda2;
  --lt-display:'Fraunces',Georgia,'Times New Roman',serif;
  --lt-hand:'IM Fell English',Georgia,serif;
  --lt-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--lt-bone);
  font-family:var(--lt-body);
  font-size:17px;line-height:1.62;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#000;
}
.lt-root *{box-sizing:border-box}

/* THE GROUND IS A LIT WALL, THE WHOLE WAY DOWN. The scenery planes are tall
   but they are still finite, and the first version put flat near-black under
   them -- so a page of two and a half thousand pixels stopped being a room
   after the first screenful and read as a failed render. The shell now paints
   cold stone under everything, and the phase atmosphere moves --lt-ground
   rather than replacing the background, so no phase can flatten it again. */
.lt-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  --lt-ground:#141b25;
  background:
    linear-gradient(180deg,rgba(168,192,216,.1) 0,rgba(168,192,216,0) 460px),
    linear-gradient(180deg,var(--lt-ground) 0%,#101720 46%,#0d141c 100%);
  box-shadow:0 0 0 1px rgba(143,162,182,.12),0 0 90px rgba(0,0,0,.94);
  overflow:visible;
  transition:background 1.8s ease;
}
/* THE CLIP LAYER, AND IT TAKES NO z-index. Measured on the conclave: a shell
   that clips is a scroll container and kills sticky for every descendant, and
   a z-index here would make this a stacking context and silently re-grade
   every blend on the screen. */
.lt-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

/* THE WALL RUNS THE WHOLE PAGE, AND THE ROOM SITS AT THE TOP OF IT.
   The drawn planes are 2600px and a long episode is over five thousand, so
   below the room the second version was still a flat gradient. Masonry is
   repeating by nature, so it is drawn as a repeat over the FULL height: the
   room is what you can see of the hall, and the wall is what is behind you
   for the rest of it. */
.lt-stone{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;pointer-events:none;
  opacity:.55;
  background-image:
    repeating-linear-gradient(180deg,rgba(11,16,23,.85) 0 2px,transparent 2px 74px),
    repeating-linear-gradient(90deg,rgba(11,16,23,.55) 0 2px,transparent 2px 216px);
}
.lt-far,.lt-mid,.lt-fore{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};height:2600px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.lt-air,.lt-wash,.lt-vig,.lt-grain{position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;pointer-events:none}
.lt-far svg,.lt-mid svg,.lt-fore svg{position:absolute;inset:0;width:100%;height:100%}
.lt-far {z-index:1;filter:blur(2.2px) saturate(.62) brightness(1);opacity:.94}
.lt-mid {z-index:2;filter:blur(.4px) saturate(.68);opacity:.96}
.lt-fore{z-index:3}
.lt-air {z-index:4}
.lt-wash{z-index:5}
.lt-vig {z-index:6}
.lt-grain{z-index:9}
.lt-body{position:relative;z-index:7}
/* Ash in the air the whole way down, so the lower half of a long episode is
   still a room somebody is standing in. Simple geometric indicators, which is
   the one thing CSS is allowed to draw here. */
.lt-mote{
  position:absolute;border-radius:50%;background:#cfdae6;
  animation:lt-settle ease-in-out infinite alternate;
}
/* The room dissolves into the wall rather than into black, so the bottom of a
   long episode is still masonry and not a hole. */
.lt-far::after,.lt-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:520px;
  background:linear-gradient(180deg,transparent,rgba(13,20,28,.92));
}
.lt-wash{
  mix-blend-mode:screen;opacity:.5;
  background:radial-gradient(52% 24% at 50% 7%,rgba(168,192,216,.24) 0%,transparent 68%);
}
/* LIGHTER THAN IT WAS, AND DELIBERATELY. The first vignette went to .98 black
   at the corners and did most of the work of making the screen look unlit. */
.lt-vig{
  background:
    radial-gradient(122% 86% at 50% 18%,transparent 0%,transparent 34%,rgba(4,7,12,.42) 70%,rgba(4,7,12,.8) 100%),
    linear-gradient(180deg,rgba(4,7,12,.44) 0%,transparent 14%,transparent 86%,rgba(4,7,12,.72) 100%);
  mix-blend-mode:multiply;
}
.lt-grain{
  opacity:.12;mix-blend-mode:soft-light;
  background-image:var(--lt-grain-src);background-size:210px 210px;
}

/* ── AMBIENT — smoke off a wick, and no flame anywhere on the screen ── */
.lt-smoke{
  animation:lt-rise ease-in-out infinite alternate;
  transform-box:fill-box;transform-origin:50% 100%;
}
@keyframes lt-rise{
  0%  {opacity:.08;transform:translateY(0)    skewX(-1.4deg) scaleY(1)}
  46% {opacity:.2; transform:translateY(-7px) skewX(1.6deg)  scaleY(1.06)}
  100%{opacity:.05;transform:translateY(-14px) skewX(-.8deg) scaleY(1.12)}
}
.lt-ash{animation:lt-settle ease-in-out infinite alternate}
@keyframes lt-settle{
  0%  {transform:translate(0,0);opacity:.1}
  100%{transform:translate(-7px,11px);opacity:.3}
}
/* THE ONE EMBER. Every other screen in this set is lit by fire; this is what
   is left of it, and it is the only warm thing on the page until the
   strongbox opens. Slow, and on its own period so it shares a beat with
   nothing. */
.lt-ember{animation:lt-ember 17s ease-in-out infinite alternate}
@keyframes lt-ember{
  0%  {opacity:.42}
  38% {opacity:.95}
  71% {opacity:.55}
  100%{opacity:.8}
}
.lt-ember-glow{animation:lt-ember-glow 29s ease-in-out infinite alternate}
@keyframes lt-ember-glow{
  0%  {opacity:.36}
  54% {opacity:.78}
  100%{opacity:.46}
}

/* ── PHASE ATMOSPHERE — the hour moves, the room does not go out ────────
   These move --lt-ground and the washes. They must NEVER set the background
   shorthand outright again: the first version did, which threw away the stone
   under the whole page and left flat black behind every card.
   (And no backtick may appear in a comment in this stylesheet -- it is inside
   a template literal, so one is a parse error. Task 2 wrote that down and
   this file rediscovered it anyway.) */
.lt-shell[data-phase="open"]  {--lt-ground:#141b25}
.lt-shell[data-phase="ask"]   {--lt-ground:#121924}
.lt-shell[data-phase="answer"]{--lt-ground:#101722}
.lt-shell[data-phase="answer"] .lt-wash{opacity:.34}
.lt-shell[data-phase="count"] {--lt-ground:#111823}
.lt-shell[data-phase="vote"]  {--lt-ground:#0f1620}
.lt-shell[data-phase="vote"] .lt-wash{opacity:.28}
.lt-shell[data-phase="table"] {--lt-ground:#0e141d}
.lt-shell[data-phase="table"] .lt-wash{opacity:.22}
.lt-shell[data-phase="money"] {--lt-ground:#1c1a12}
.lt-shell[data-phase="money"] .lt-wash{opacity:.85;
  background:radial-gradient(54% 26% at 50% 12%,rgba(244,221,162,.24) 0%,transparent 64%)}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.lt-hero{
  position:relative;height:456px;overflow:hidden;
  background:#020305;border-bottom:1px solid rgba(143,162,182,.16);
}
.lt-hero svg.lt-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.lt-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
.lt-eyebrow{
  font-family:var(--lt-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:rgba(221,227,234,.78);
  text-shadow:0 2px 12px rgba(0,0,0,.95);margin-bottom:2px;
}
/* THE LOCKUP. The same one all five earlier screens use: Fraunces 900
   squeezed to .80 with a 1.3px stroke. Six screens, one logo. */
.lt-title{
  display:inline-block;
  font-family:var(--lt-display);font-weight:900;
  font-size:clamp(30px,5.2vw,62px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:#eaeff5;margin:10px 0 0;
  text-shadow:0 4px 34px rgba(0,0,0,.95);
}
.lt-title-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 10px}
.lt-title-rule i{display:block;height:1px;width:96px;
  background:linear-gradient(90deg,transparent,rgba(221,227,234,.44))}
.lt-title-rule i:last-child{background:linear-gradient(270deg,transparent,rgba(221,227,234,.44))}
.lt-sub{
  font-family:var(--lt-hand);font-style:italic;font-size:18px;line-height:1.55;
  color:rgba(221,227,234,.82);max-width:640px;margin:0 auto;
  text-shadow:0 2px 14px rgba(0,0,0,.95);
}

/* ── OBSERVER STRIP ─────────────────────────────────────────────────── */
.lt-head{padding:16px 34px;border-bottom:1px solid rgba(143,162,182,.14);
  background:linear-gradient(180deg,rgba(2,3,5,.74),transparent)}
.lt-observer{
  display:flex;align-items:center;gap:10px;
  font-family:var(--lt-display);font-weight:600;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(221,227,234,.72);
}
.lt-observer em{font-family:var(--lt-body);font-style:italic;font-size:14px;
  letter-spacing:0;text-transform:none;color:rgba(221,227,234,.5)}

/* ═══ THE STAGE — the chairs, and what is on the paper in front of each ═══
   Sticky element AND the element the reveal handlers replace by id. Every
   chair starts SEALED and stays sealed for anybody the observer is not
   entitled to read, which is the whole observer contract on this screen. */
.lt-stage{position:sticky;top:${TR_NAV_TOP};z-index:12;
  background:rgba(2,3,5,.97);
  border-bottom:1px solid rgba(143,162,182,.2);
  padding:11px 20px 12px;backdrop-filter:blur(6px)}
.lt-stage-row{display:flex;flex-wrap:wrap;gap:8px;align-items:stretch}
.lt-chair{
  flex:0 1 auto;display:flex;align-items:center;gap:9px;
  padding:6px 11px 6px 7px;
  border:1px solid rgba(143,162,182,.2);background:rgba(12,16,22,.86);
  transition:border-color .3s,background .3s,opacity .3s;
}
.lt-chair[data-state="sealed"]{opacity:.72}
.lt-chair[data-state="end"]   {border-color:rgba(143,162,182,.52);background:rgba(20,27,36,.9)}
.lt-chair[data-state="banish"]{border-color:rgba(200,69,90,.6);background:rgba(30,9,14,.82)}
.lt-chair[data-state="gone"]  {opacity:.34;filter:saturate(.1)}
.lt-chair-nm{
  font-family:var(--lt-display);font-weight:700;font-size:12px;letter-spacing:.06em;
  color:rgba(221,227,234,.9);white-space:nowrap;
}
.lt-chair-st{
  display:block;font-family:var(--lt-display);font-weight:700;font-size:8px;
  letter-spacing:.24em;text-transform:uppercase;color:rgba(143,162,182,.68);margin-top:1px;
}
.lt-chair[data-state="banish"] .lt-chair-st{color:var(--lt-wax-hot)}
.lt-chair[data-state="gone"] .lt-chair-st{color:rgba(221,227,234,.5)}
/* the collapse toggle on the sticky stage (breakfast has one; this now does too) */
.lt-stage-head{display:flex;justify-content:flex-end;margin-bottom:8px}
.lt-stage-toggle{font-family:var(--lt-display);font-weight:700;font-size:9px;
  letter-spacing:.24em;text-transform:uppercase;cursor:pointer;
  background:rgba(143,162,182,.1);color:rgba(221,227,234,.7);
  border:1px solid rgba(143,162,182,.28);padding:5px 12px;display:inline-flex;
  align-items:center;gap:7px;transition:background .2s,color .2s}
.lt-stage-toggle:hover{background:rgba(143,162,182,.2);color:#fff}
.lt-stage.lt-collapsed .lt-stage-body{display:none}
.lt-meters{display:flex;flex-wrap:wrap;gap:8px;margin-top:9px}
.lt-meter{
  flex:1 1 130px;padding:6px 12px 7px;
  border:1px solid rgba(143,162,182,.18);background:rgba(9,12,17,.8);
}
.lt-meter-k{display:block;font-family:var(--lt-display);font-weight:700;font-size:8px;
  letter-spacing:.28em;text-transform:uppercase;color:rgba(221,227,234,.48)}
.lt-meter-v{display:block;font-family:var(--lt-display);font-weight:900;font-size:18px;
  line-height:1.2;color:#eaeff5;margin-top:2px}
.lt-meter[data-tone="brass"] .lt-meter-v{color:var(--lt-brass-hot)}
.lt-meter[data-tone="wax"] .lt-meter-v{color:var(--lt-wax-hot)}

/* ═══ THE COLUMN ══════════════════════════════════════════════════════ */
.lt-main{position:relative;padding:32px 34px 92px;max-width:900px;margin:0 auto}

.lt-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.lt-beat.lt-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:22px}

/* DEALT ACROSS A TABLE. Pushed in flat from the left and stopped dead --
   no rise, no bounce, no light. Somebody is handing folded paper back. */
.lt-beat.lt-vis .lt-card{animation:lt-deal .62s cubic-bezier(.17,.84,.24,1) both}
@keyframes lt-deal{
  0%  {opacity:0;transform:translateX(-44px) rotate(-1.1deg)}
  70% {opacity:1}
  100%{opacity:1;transform:none}
}

/* A LITTLE TRANSLUCENT, NOW THERE IS SOMETHING BEHIND THEM. The cards used to
   be all but opaque, which was fine over black and is wrong over a room: the
   table and the chairs read faintly through them, which is what puts the
   reader in the hall rather than in front of a list. */
.lt-card{
  position:relative;
  background:linear-gradient(172deg,rgba(20,26,35,.9),rgba(8,11,16,.93));
  border:1px solid rgba(143,162,182,.24);
  padding:19px 23px 21px;
  box-shadow:0 18px 46px rgba(0,0,0,.7);
}
.lt-card[data-kind="answer"]{margin-left:44px;padding:15px 20px 16px}
.lt-card[data-kind="count"]{border-color:rgba(143,162,182,.36)}
.lt-card[data-kind="table"]{
  border-color:rgba(200,69,90,.4);
  background:linear-gradient(172deg,rgba(24,14,18,.94),rgba(5,6,10,.96));
}
/* THE ONE WARM THING ON THE SCREEN. Everything above it is ash, because
   nothing above it was ever explained. */
.lt-card[data-kind="money"]{
  border-color:rgba(185,143,62,.5);
  background:linear-gradient(160deg,rgba(46,36,16,.9),rgba(9,8,6,.96));
  box-shadow:0 22px 60px rgba(0,0,0,.75),inset 0 0 60px -18px rgba(244,221,162,.22);
  padding:26px 26px 24px;
}
.lt-label{
  display:flex;align-items:center;gap:9px;
  font-family:var(--lt-display);font-weight:700;font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(143,162,182,.72);margin-bottom:8px;
}
.lt-card[data-kind="money"] .lt-label{color:var(--lt-brass-hot)}
.lt-h{
  font-family:var(--lt-display);font-weight:900;font-size:23px;line-height:1.16;
  letter-spacing:-.014em;color:#eaeff5;margin:0 0 10px;
}
.lt-card[data-kind="money"] .lt-h{font-size:30px}
.lt-card p{margin:0 0 10px;color:rgba(221,227,234,.82)}
.lt-card p:last-child{margin-bottom:0}
.lt-say{font-family:var(--lt-hand);font-style:italic;font-size:19px;line-height:1.55;
  color:rgba(234,239,245,.94)}

/* ── AN ANSWER, AND IT IS A PIECE OF PAPER ──────────────────────────── */
.lt-answer{display:flex;align-items:center;gap:16px}
.lt-answer-who{display:flex;align-items:center;gap:11px;min-width:190px}
.lt-answer-nm{font-family:var(--lt-display);font-weight:900;font-size:19px;color:#eaeff5}
.lt-slip{
  position:relative;flex:none;width:132px;padding:9px 10px 10px;text-align:center;
  background:linear-gradient(176deg,var(--lt-paper),#aeb6c0);
  color:#1b2029;
  box-shadow:0 8px 20px rgba(0,0,0,.6);
}
.lt-slip::after{content:'';position:absolute;left:0;right:0;top:50%;height:1px;
  background:rgba(27,32,41,.28)}
.lt-slip-w{font-family:var(--lt-display);font-weight:900;font-size:15px;letter-spacing:.1em;
  text-transform:uppercase;line-height:1.2}
.lt-slip[data-choice="banish"]{background:linear-gradient(176deg,#e3c8cd,#c39aa2)}
.lt-slip[data-choice="banish"] .lt-slip-w{color:#5c0c17}
.lt-slip[data-choice="sealed"]{background:linear-gradient(176deg,#3a424e,#232a34);color:#8fa2b6}
.lt-slip[data-choice="sealed"] .lt-slip-w{color:rgba(143,162,182,.8);font-size:13px}
.lt-answer-note{font-family:var(--lt-body);font-style:italic;font-size:15px;
  color:rgba(221,227,234,.6)}

/* ── A COUNT NOBODY READ OUT ────────────────────────────────────────── */
.lt-count{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin:4px 0 2px}
.lt-count-n{font-family:var(--lt-display);font-weight:900;
  font-size:clamp(34px,6vw,58px);line-height:1;letter-spacing:-.03em;color:#eaeff5}
.lt-count-n[data-tone="wax"]{color:var(--lt-wax-hot)}
.lt-count-n[data-tone="cold"]{color:var(--lt-cold)}
.lt-count-s{font-family:var(--lt-display);font-weight:700;font-size:10px;
  letter-spacing:.28em;text-transform:uppercase;color:rgba(221,227,234,.6)}

/* ── AND THE HOLE WHERE THE ANSWER GOES ─────────────────────────────── */
.lt-void{
  margin:13px 0 2px;padding:15px 18px;text-align:center;
  border:1px dashed rgba(143,162,182,.34);background:rgba(4,5,8,.6);
}
.lt-void-w{font-family:var(--lt-display);font-weight:900;font-size:17px;letter-spacing:.04em;
  color:rgba(221,227,234,.72)}
.lt-void-s{font-family:var(--lt-body);font-style:italic;font-size:15px;
  color:rgba(221,227,234,.52);margin-top:4px}

/* ── THE VOTE THAT ACTUALLY BANISHES — slates read aloud ───────────── */
.lt-vote{display:flex;flex-direction:column;gap:7px;margin:6px 0 4px}
.lt-slate{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;
  padding:8px 12px;background:rgba(6,8,12,.62);border:1px solid rgba(143,162,182,.16);
  border-left:2px solid rgba(143,162,182,.34)}
.lt-slate-who{display:flex;align-items:center;gap:9px;min-width:0}
.lt-slate-nm{font-family:var(--lt-display);font-weight:700;font-size:14px;letter-spacing:.02em;
  color:rgba(221,227,234,.82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-slate-arrow{font-family:var(--lt-body);font-size:11px;letter-spacing:.2em;
  text-transform:uppercase;color:rgba(143,162,182,.5);text-align:center}
.lt-slate-tgt{position:relative;justify-self:end;padding:5px 13px;text-align:center;
  background:linear-gradient(176deg,var(--lt-paper),#aeb6c0);color:#1b2029;
  font-family:var(--lt-display);font-weight:900;font-size:13px;letter-spacing:.06em;
  text-transform:uppercase;box-shadow:0 5px 13px rgba(0,0,0,.5);white-space:nowrap}
.lt-slate[data-hit="1"] .lt-slate-tgt{background:linear-gradient(176deg,#e3c8cd,#c39aa2);
  color:#5c0c17}
/* the tally the slates come to */
.lt-tally{display:flex;flex-direction:column;gap:6px;margin:12px 0 2px}
.lt-trow{display:grid;grid-template-columns:120px 1fr auto;align-items:center;gap:12px}
.lt-tname{font-family:var(--lt-display);font-weight:700;font-size:13px;letter-spacing:.02em;
  color:rgba(221,227,234,.78);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right}
.lt-tbar{position:relative;height:16px;background:rgba(143,162,182,.1);overflow:hidden}
.lt-tbar-f{position:absolute;left:0;top:0;bottom:0;
  background:linear-gradient(90deg,rgba(143,162,182,.4),rgba(143,162,182,.68));
  transition:width .5s ease}
.lt-trow[data-top="1"] .lt-tbar-f{background:linear-gradient(90deg,#8f1d2c,#c8455a)}
.lt-trow[data-top="1"] .lt-tname{color:#f0c3ca}
.lt-tnum{font-family:var(--lt-display);font-weight:900;font-size:16px;color:#eaeff5;min-width:22px;text-align:center}
/* the tie-break: a re-vote, or the draw of last resort */
.lt-tiebreak{margin:12px 0 2px;padding:12px 14px;border:1px solid rgba(185,143,62,.28);
  border-left:2px solid var(--lt-wax-hot);background:rgba(28,20,8,.5)}
.lt-tiebreak-h{font-family:var(--lt-display);font-weight:900;font-size:13px;letter-spacing:.06em;
  text-transform:uppercase;color:var(--lt-wax-hot)}
.lt-tiebreak-s{font-family:var(--lt-body);font-style:italic;font-size:14px;
  color:rgba(234,223,198,.72);margin:3px 0 8px}
.lt-tiebreak .lt-vote{margin:0}
.lt-tiebreak.lt-drawn{border-left-color:#c8455a;background:rgba(30,10,14,.55)}
.lt-tiebreak.lt-drawn .lt-tiebreak-h{color:#e86073}

/* ── THE REVEAL, WHEN THE AUTHOR TURNED IT ON ──────────────────────── */
.lt-reveal{margin:13px 0 2px;padding:20px 20px 18px;text-align:center;position:relative;
  overflow:hidden;border:1px solid rgba(185,143,62,.3)}
.lt-reveal[data-side="traitor"]{background:radial-gradient(120% 140% at 50% 0,rgba(90,14,22,.62),rgba(6,4,6,.9));
  border-color:rgba(200,69,90,.5)}
.lt-reveal[data-side="faithful"]{background:radial-gradient(120% 140% at 50% 0,rgba(30,42,58,.6),rgba(5,7,10,.9));
  border-color:rgba(143,162,182,.42)}
.lt-reveal-tag{font-family:var(--lt-display);font-weight:900;
  font-size:clamp(26px,5vw,40px);letter-spacing:.14em;text-transform:uppercase;line-height:1;
  margin:6px 0 8px}
.lt-reveal[data-side="traitor"] .lt-reveal-tag{color:#e86073;
  text-shadow:0 0 34px rgba(200,69,90,.5)}
.lt-reveal[data-side="faithful"] .lt-reveal-tag{color:#bcd2e6;
  text-shadow:0 0 30px rgba(143,162,182,.4)}
.lt-reveal-s{font-family:var(--lt-hand);font-style:italic;font-size:18px;line-height:1.5;
  color:#eadfc6;max-width:560px;margin:0 auto}

/* ── REACTIONS that the reveal leaves in the room ──────────────────── */
.lt-reacts{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0 2px;justify-content:center}
.lt-react{display:flex;align-items:center;gap:10px;padding:9px 15px 9px 9px;max-width:340px;
  border:1px solid rgba(143,162,182,.2);border-left:2px solid;background:rgba(8,10,14,.72)}
.lt-react[data-tone="grief"]{border-left-color:#6f8aa8}
.lt-react[data-tone="shock"]{border-left-color:#c8455a}
.lt-react[data-tone="relief"]{border-left-color:#b98f3e}
.lt-react[data-tone="steel"]{border-left-color:#8fa2b6}
.lt-react-tx{font-family:var(--lt-body);font-style:italic;font-size:14px;line-height:1.45;
  color:rgba(234,223,198,.9)}
.lt-react-tx b{font-style:normal;font-weight:700;color:#f2e2bb}

/* ── THE VERDICT — the season's one headline ───────────────────────── */
.lt-verdict{position:relative;overflow:hidden;margin:2px 0 16px;padding:26px 22px 22px;
  text-align:center;border:1px solid rgba(185,143,62,.34)}
.lt-verdict[data-side="traitors"]{
  background:radial-gradient(130% 150% at 50% 0,rgba(120,16,26,.7),rgba(6,3,5,.94));
  border-color:rgba(200,69,90,.55)}
.lt-verdict[data-side="faithfuls"]{
  background:radial-gradient(130% 150% at 50% 0,rgba(30,46,64,.66),rgba(4,7,10,.94));
  border-color:rgba(160,196,224,.4)}
.lt-verdict-k{font-family:var(--lt-display);font-weight:700;font-size:10px;letter-spacing:.4em;
  text-transform:uppercase;color:rgba(234,223,198,.6);margin-bottom:10px}
.lt-verdict-h{font-family:var(--lt-display);font-weight:900;
  font-size:clamp(30px,6.4vw,56px);letter-spacing:.02em;line-height:1;margin:0}
.lt-verdict[data-side="traitors"] .lt-verdict-h{color:#f0596c;
  text-shadow:0 0 44px rgba(200,69,90,.55)}
.lt-verdict[data-side="faithfuls"] .lt-verdict-h{color:#cfe0f0;
  text-shadow:0 0 40px rgba(160,196,224,.45)}
.lt-verdict-s{font-family:var(--lt-hand);font-style:italic;font-size:18px;
  color:#eadfc6;margin:12px auto 0;max-width:520px}
/* winner cards wear the pact colour on a Traitor win — they ARE unmasked here */
.lt-winners[data-side="traitors"] .lt-winner{border-color:rgba(200,69,90,.5);
  background:rgba(48,12,18,.6)}
.lt-winners[data-side="traitors"] .lt-winner-nm{color:#f4c8ce}
.lt-winners[data-side="traitors"] .lt-winner-sh{color:rgba(232,150,160,.85)}

/* ── THE UNMASKING ──────────────────────────────────────────────────
   One person at a time. The card is deliberately the biggest thing on the
   screen after the verdict: this is the scene the season was built to reach,
   and it used to not exist at all. */
.lt-turn{display:flex;align-items:center;gap:18px;padding:18px 20px;border-radius:14px;
  border:1px solid rgba(185,143,62,.28);background:rgba(10,8,10,.55);position:relative;
  overflow:hidden}
.lt-turn:after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.5;
  background:radial-gradient(120% 160% at 8% 50%,rgba(244,221,162,.10),transparent 62%)}
.lt-turn[data-role="traitor"]{border-color:rgba(200,69,90,.6);
  background:radial-gradient(130% 180% at 6% 50%,rgba(96,12,22,.72),rgba(8,3,5,.92));
  box-shadow:0 0 46px rgba(200,69,90,.22) inset}
.lt-turn[data-role="traitor"]:after{
  background:radial-gradient(120% 160% at 8% 50%,rgba(240,89,108,.18),transparent 64%)}
.lt-turn-av{flex:0 0 auto;position:relative;z-index:1}
.lt-turn[data-role="traitor"] .lt-turn-av img{
  box-shadow:0 0 0 2px rgba(200,69,90,.75),0 0 30px rgba(200,69,90,.4)}
.lt-turn-body{min-width:0;position:relative;z-index:1}
.lt-turn-nm{font-family:var(--lt-display);font-weight:800;font-size:20px;letter-spacing:.01em;
  color:#eadfc6;line-height:1.1}
.lt-turn-role{font-family:var(--lt-display);font-weight:900;font-size:clamp(22px,4.4vw,38px);
  letter-spacing:.16em;text-transform:uppercase;line-height:1.05;margin:2px 0 8px}
.lt-turn[data-role="faithful"] .lt-turn-role{color:#cfe0f0;
  text-shadow:0 0 26px rgba(160,196,224,.4)}
.lt-turn[data-role="traitor"] .lt-turn-role{color:#f0596c;
  text-shadow:0 0 34px rgba(200,69,90,.6);animation:lt-strike 1.1s ease-out both}
.lt-turn-tx{margin:0;font-size:14px;line-height:1.62;color:rgba(234,223,198,.9)}
@keyframes lt-strike{
  0%{opacity:0;transform:scale(1.22);letter-spacing:.5em;filter:blur(7px)}
  55%{opacity:1;filter:blur(0)}
  100%{opacity:1;transform:scale(1);letter-spacing:.16em}
}
/* The ones banished blind, and whether the room was right about them. */
.lt-sent{display:flex;flex-direction:column;gap:8px;margin:12px 0 14px}
.lt-sent-row{display:grid;grid-template-columns:auto auto auto 1fr;align-items:center;gap:11px;
  padding:9px 12px;border-radius:11px;border:1px solid rgba(185,143,62,.22);
  background:rgba(12,10,12,.5)}
.lt-sent-row[data-role="traitor"]{border-color:rgba(200,69,90,.45);
  background:rgba(52,12,20,.44)}
.lt-sent-nm{font-family:var(--lt-display);font-weight:700;font-size:14px;color:#eadfc6}
.lt-sent-role{font-family:var(--lt-display);font-weight:900;font-size:10px;letter-spacing:.22em;
  text-transform:uppercase;padding:2px 8px;border-radius:999px}
.lt-sent-row[data-role="traitor"] .lt-sent-role{color:#f4c8ce;background:rgba(200,69,90,.24)}
.lt-sent-row[data-role="faithful"] .lt-sent-role{color:#cfe0f0;background:rgba(160,196,224,.16)}
.lt-sent-say{font-family:var(--lt-hand);font-style:italic;font-size:13px;
  color:rgba(234,223,198,.72);min-width:0}
@media (max-width:620px){
  .lt-turn{flex-direction:column;align-items:flex-start;gap:12px}
  .lt-sent-row{grid-template-columns:auto 1fr;row-gap:4px}
  .lt-sent-say{grid-column:1/-1}
}
@media (prefers-reduced-motion:reduce){
  .lt-turn[data-role="traitor"] .lt-turn-role{animation:none}
}

/* ── THE MONEY, WHICH IS THE ONLY THING TURNED OVER ─────────────────── */
.lt-pot{
  display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;
  margin:6px 0 16px;padding-bottom:14px;
  border-bottom:1px solid rgba(185,143,62,.3);
}
.lt-pot-n{font-family:var(--lt-display);font-weight:900;
  font-size:clamp(38px,7vw,66px);line-height:1;letter-spacing:-.03em;color:var(--lt-brass-hot);
  text-shadow:0 0 40px rgba(244,221,162,.28)}
.lt-pot-k{font-family:var(--lt-display);font-weight:700;font-size:10px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(244,221,162,.62)}
/* EVERY WINNER, AND NEVER THE FIRST OF THEM. Up to four people split this. */
.lt-winners{display:flex;flex-wrap:wrap;gap:12px;margin:4px 0 14px}
.lt-winner{
  display:flex;align-items:center;gap:12px;padding:11px 16px 11px 11px;
  border:1px solid rgba(185,143,62,.45);background:rgba(30,24,10,.66);
}
.lt-winner-nm{font-family:var(--lt-display);font-weight:900;font-size:21px;color:#f7ecd0}
.lt-winner-sh{display:block;font-family:var(--lt-display);font-weight:700;font-size:9.5px;
  letter-spacing:.22em;text-transform:uppercase;color:rgba(244,221,162,.72);margin-top:2px}
.lt-lost{display:flex;flex-wrap:wrap;gap:10px;margin:2px 0 12px}
.lt-lost-one{display:flex;align-items:center;gap:9px;padding:7px 13px 7px 8px;
  border:1px solid rgba(143,162,182,.22);background:rgba(8,10,14,.7);opacity:.72}
.lt-lost-nm{font-family:var(--lt-display);font-weight:700;font-size:15px;
  color:rgba(221,227,234,.82)}

.lt-sums{display:flex;flex-wrap:wrap;gap:10px 26px;margin:13px 0 2px;padding:12px 0 0;
  border-top:1px solid rgba(143,162,182,.18)}
.lt-sum{display:inline-flex;align-items:baseline;gap:9px}
.lt-sum-k{font-family:var(--lt-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(221,227,234,.5)}
.lt-sum-v{font-family:var(--lt-display);font-weight:900;font-size:20px;color:#eaeff5}
.lt-sum-v[data-tone="brass"]{color:var(--lt-brass-hot)}
.lt-sum-v[data-tone="wax"]{color:var(--lt-wax-hot)}

/* ── HOST BAND ──────────────────────────────────────────────────────── */
.lt-host{
  position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:16px 24px;margin-top:18px;
  background:linear-gradient(100deg,rgba(2,3,5,.96),rgba(40,32,16,.8) 52%,rgba(2,3,5,.96));
  border-top:1px solid rgba(185,143,62,.42);border-bottom:1px solid rgba(185,143,62,.42);
  box-shadow:inset 0 0 40px -8px rgba(244,221,162,.14),0 12px 30px rgba(0,0,0,.6);
}
.lt-host-name{
  font-family:var(--lt-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--lt-brass-hot);margin-bottom:6px;
  display:flex;align-items:center;gap:8px;
}
.lt-host-line{font-family:var(--lt-hand);font-style:italic;font-size:19px;line-height:1.5;
  color:#f2e2bb}

/* ── STICKY CONTROLS ────────────────────────────────────────────────── */
.lt-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(2,3,5,.1),rgba(2,3,5,.98) 44%);
  border-top:1px solid rgba(143,162,182,.2);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.lt-btn{
  font-family:var(--lt-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(143,162,182,.16),rgba(143,162,182,.03));
  color:var(--lt-bone);
  border:1px solid rgba(143,162,182,.38);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(221,227,234,.14);
}
.lt-btn:hover{background:rgba(143,162,182,.26);color:#fff;
  box-shadow:0 0 26px rgba(143,162,182,.22),inset 0 1px 0 rgba(221,227,234,.26)}
.lt-btn[disabled],.lt-btn.lt-dim{opacity:.3;cursor:default;pointer-events:none}
.lt-counter{
  font-family:var(--lt-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:rgba(221,227,234,.44);min-width:86px;text-align:center;
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
.lt-none{max-width:620px;margin:0 auto;padding:64px 34px 90px;text-align:center}
.lt-none-h{font-family:var(--lt-display);font-weight:900;font-size:30px;letter-spacing:-.01em;
  color:#eaeff5;margin:22px 0 16px}
.lt-none p{font-family:var(--lt-hand);font-size:19px;line-height:1.65;
  color:rgba(221,227,234,.68);margin:0 auto 14px;max-width:520px}

/* ── RESPONSIVE ─────────────────────────────────────────────────────── */
@media(max-height:720px){.lt-stage{position:static}}
@media(max-width:900px){
  .lt-stage{position:static}
  .lt-hero{height:392px}
}
@media(max-width:700px){
  .lt-main{padding:24px 16px 60px}
  .lt-card[data-kind="answer"]{margin-left:0}
  .lt-answer{flex-direction:column;align-items:flex-start;gap:10px}
  .lt-answer-who{min-width:0}
  .lt-head{padding:14px 18px}
  .lt-hero{height:330px}
  .lt-hero-lock{padding:0 18px 22px}
  .lt-host{grid-template-columns:1fr;gap:10px}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .lt-root *,.lt-root *::before,.lt-root *::after{animation:none!important;transition:none!important}
  .lt-beat.lt-vis .lt-card{opacity:1;transform:none}
  .lt-smoke{opacity:.2}
  .lt-ember{opacity:.8}
  .lt-ember-glow{opacity:.55}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE WORDS
// ══════════════════════════════════════════════════════════════════════
//
// Four variants minimum everywhere, and the pools are split by the STATE they
// describe rather than by flavour, for the reason js/tr/endgame.js gives about
// its own pot lines: a sentence asserting a fact about the room has to agree
// with the room. "Nobody wrote a name" and "one of them did" are different
// events and cannot share a pool with a number substituted in.

const OPEN = [
  'The table is set for a room that used to seat twenty. What is left of the castle sits '
  + 'down at it and is not asked to accuse anybody. It is asked something else.',
  'The candles have been let go out. Nobody lit them again, because there is no evening '
  + 'left to get through -- only a question, put once and then put again.',
  'They come in and take chairs that no longer have anybody either side of them. The room '
  + 'is the same room. Everything about the question in it has changed.',
  'What is left of the cast sits down in a hall built for four times as many. From here '
  + 'the game stops asking who is lying and starts asking whether anybody wants to keep going.',
];

const RULE = [
  'Each of them writes one word, in private, and folds it. One word for another table, '
  + 'one word for the end of it. A single vote for another table is enough to force one '
  + '-- the game does not stop until every hand in the room agrees to stop it.',
  'The question goes to each of them alone and is answered on paper. Anybody can keep the '
  + 'game running by themselves; nobody can end it by themselves. That asymmetry is the '
  + 'whole of the last night.',
  'One word each, folded and handed back. It takes the entire room to finish, and one '
  + 'person to carry on -- so the quietest player at the table holds the same power as the '
  + 'loudest one, and neither of them has to explain it.',
  'They answer in writing and out of sight of each other. Unanimity ends it; anything else '
  + 'sends them all back to the same chairs tomorrow with one of them missing.',
];

const ASK_FIRST = [
  'The question is put for the first time. Nobody in this room has been asked it before, '
  + 'and nobody knows how anybody else is going to answer.',
  'The first time of asking. They have spent the whole season reading each other and none '
  + 'of that reaches across a folded piece of paper.',
  'It is put to them cold, with no debate before it and no debate allowed after it.',
  'The first ask. Whatever they decide, they decide it without saying a word to anybody.',
];
const ASK_AGAIN = [
  'The question comes round again, to a room one chair emptier and no wiser than it was. '
  + 'Nothing was explained in between.',
  'Asked again. They have lost somebody since the last time and they still do not know '
  + 'whether losing them helped.',
  'The same question, the same paper, fewer hands. The last one cost somebody the game and '
  + 'told the survivors nothing at all.',
  'Round again. Every previous answer is still folded up in somebody else{apos}s pocket, and '
  + 'the room has to guess at all of them a second time.',
];

const SAY_END = [
  'End it here.', 'Enough. End it.', 'No more names.', 'I am done. End the game.',
  'Stop.', 'That is enough of this.', 'Not another one.', 'End it. Now.',
];
const SAY_BANISH = [
  'One more.', 'Not yet. One more.', 'There is somebody in here.', 'I want another table.',
  'Not finished.', 'One of you is lying.', 'We go again.', 'Not yet.',
];

// EIGHT, NOT FOUR, AND THE COUNT WAS MEASURED. A room of five or six answers
// this question three times over, which is eighteen of these notes on one
// screen; at four variants the same sentence appeared under three faces in a
// row on a real seed, which is the kind of thing that is only ever found by
// rendering it and reading it.
const NOTE_END = [
  'Believes the room is clean, or wants very badly to believe it.',
  'Would rather take a share than take a risk.',
  'Has looked at everybody left and cannot make any of them fit.',
  'Is finished reading people. Wants the doors open.',
  'Has run out of suspicion and is not going to invent any more.',
  'Trusts the room, which is either the best or the worst call of the season.',
  'Would sooner divide it than lose all of it on a hunch.',
  'Has nothing left to accuse anybody of, and knows how that could look.',
];
const NOTE_BANISH = [
  'Is not finished with somebody in this room.',
  'Has a name and no way to say it out loud.',
  'Would rather be wrong tomorrow than robbed tonight.',
  'Thinks the castle still has a cloak in it and is prepared to spend a table proving it.',
  'Cannot look at one of these faces without hearing something that did not add up.',
  'Would rather take one more chance on being right than none on being safe.',
  'Has been carrying a suspicion since the first week and refuses to put it down.',
  'Does not believe a room this small got here honestly.',
];
const NOTE_SEALED = [
  'Folded, handed back, and never read out.',
  'Whatever is written on it stayed written on it.',
  'One word, in somebody else{apos}s handwriting, on the wrong side of the fold.',
  'Nobody at this table saw this one and nobody ever will.',
  'A crease, and a word on the inside of it.',
  'Handed over face down and counted face down.',
  'You watched this one get folded and that is the whole of what you know.',
  'Somebody at this table wrote something here. It was not read to you.',
];

const COUNT_SPLIT = [
  'It is not unanimous, so it is not over. The room goes back to the same chairs and one '
  + 'of them will not be sitting in theirs tomorrow.',
  'Somebody wants another one. That is all it takes, and the room is not told who.',
  'The count is short of the room, which means the game continues -- and every person at '
  + 'this table now knows that at least one of the others is not finished with them.',
  'Not one voice. So they sit down again, in a room that has just learned somebody in it '
  + 'is still hunting.',
];
const COUNT_ONE_VOICE = [
  'One voice, and it is the only one this game accepts. Nothing else is written down and '
  + 'nothing else will be.',
  'Every hand in the room says the same word. That ends it, and it ends it without a '
  + 'single explanation.',
  'Unanimous. The game stops exactly where it stands, whoever happens to be standing in it.',
  'Nobody asks for another. The castle is finished with them and they are finished with it.',
];

const TABLE_SILENT = [
  '{who} goes out of the door with the room no wiser than it was an hour ago. Nothing is '
  + 'turned over, nothing is read out, and the survivors sit back down carrying exactly '
  + 'the beliefs they came in with.',
  'They vote, and {who} leaves. That is all that happens: no card, no answer, no relief '
  + 'and no horror -- just a chair that is now empty and a room that has to guess what it '
  + 'has done.',
  '{who} is gone and the question of what {who} actually was goes with them. The rest of '
  + 'this game will be played on nerve, because nothing else has been supplied.',
  'The name is read, {who} stands up, and the room waits for the part where it finds out. '
  + 'It does not come. It is not going to.',
];

// THE VOTE THAT ACTUALLY BANISHES. The secret ballot only decided to HOLD a
// table; this is the table. Written blind of who is named — the slates carry
// that — so every line here is about the act, not the target.
const VOTE_INTRO = [
  'One of them would not let it end, so all of them have to write a name. The slates go '
  + 'round the table face-down and come back with somebody on them.',
  'The room asked for another and the room gets one. Every hand takes a slate, and this '
  + 'time the word on it is a person.',
  'No more folded words about whether to stop. A name each now, out loud, in front of the '
  + 'people it might be.',
  'A single hand held the game open, and this is the price of it: a full table, one name '
  + 'apiece, and no way to take it back once the chalk is dry.',
];
const VOTE_HOST = [
  'Names this time. Write them where I can see them, and hold them up when I call it.',
  'One name each. Not whether -- who. And you will show me.',
  'You wanted another table. Here it is. Write the name you came to write.',
  'The slates, please. A person on each one, and no hiding it this time.',
];
// The banished, revealed at the count. Blind of alignment.
const VOTE_RESULT = [
  'The chalk is read out one slate at a time, and the pile in front of {who} is the one '
  + 'that keeps growing.',
  'They hold the slates up together, and {who} is on more of them than anybody else at '
  + 'the table.',
  'The count comes in and it comes in on {who}. Whatever the folded words said, this is '
  + 'the one that landed.',
  '{who} watched the names go up and knew before the last one turned over. The table '
  + 'chose, and it chose {who}.',
];
// When the first count tied and the room had to break it (a re-vote, or the
// draw of last resort). Blind of alignment; about the deadlock, not the target.
const VOTE_RESULT_TIE = [
  'The first count came in level, so it did not settle anything. It took another pass to '
  + 'land on {who}.',
  'Nobody had the numbers on the first count. The tie had to be broken, and when it was, '
  + 'the name under it was {who}.',
  '{who} tied the first count and lost the tie-break. That is the whole of how {who} came '
  + 'to be the one to leave.',
];

// REVEAL ON (Ireland S1 mode) — the alignment IS turned over, the same as any
// earlier table. Two pools; the record's `revealedTraitor` picks between them.
const REVEAL_TRAITOR = [
  '{who} draws the cloak closed for the last time. A Traitor -- and the room had the '
  + 'right one in its hand at the end after all.',
  'The word is TRAITOR, and the table lets out the breath it has been holding since the '
  + 'first night. {who} was one of them.',
  '{who} was a Traitor. It is read out, it is over, and half the room is already turning '
  + 'to look at whoever is left.',
  'A cloak, and everyone sees it this time. {who} played the whole castle and the castle '
  + 'caught {obj} on the last table it had.',
];
const REVEAL_FAITHFUL = [
  '{who} was Faithful. The word lands in a silent room, and every face at the table does '
  + 'the arithmetic on what they have just done.',
  'FAITHFUL. {who} was telling the truth the entire time, and the table spent its last '
  + 'banishment on {obj}.',
  '{who} leaves as a Faithful, and the people who wrote that name will carry it into '
  + 'whatever this room decides next.',
  'The reveal is FAITHFUL, and it costs the room more than a chair -- it costs them the '
  + 'certainty they voted with.',
];

// REACTIONS THE REVEAL LEAVES IN THE ROOM. Each is grounded — grief needs a
// stored bond, vindication needs a vote actually cast at this table, guilt
// needs the same vote landing on a Faithful. `{a}` is the reactor, `{who}` the
// banished. Nothing here reads an alignment the reactor was not just shown.
const REACT_GRIEF = [
  '{a} does not look at the empty chair, and not looking at it is the loudest thing {a} does.',
  '{a} had spent the whole game beside {who}, and the room can see the cost of it land.',
  'Whatever {who} was, {a} is not ready for the chair to be empty, and does not pretend to be.',
];
// Deliberately agnostic about HOW the name got written — the reactor may be a
// Faithful who read it right or a Traitor who cut a fellow loose, and this
// screen may not tell which. Every line is true of both: the slate matched the
// cloak, and that is all it claims.
const REACT_VINDICATED = [
  '{a} wrote that name, and the cloak proves it. Whatever it took to put it down, it was '
  + 'the right one.',
  '{a} named {who} at this table, and the reveal says the slate was not wrong. {a} sits '
  + 'very still.',
  'Of everyone at the table, {a} is the one whose name matched what came off {who}.',
];
const REACT_GUILT = [
  '{a} voted for {who} and {who} was Faithful. That is a thing {a} now has to carry out '
  + 'of this room.',
  '{a} put a name down and the name was clean. The look on {posAdj} face is the whole '
  + 'price of playing this game on nerve.',
  '{a} spent the last banishment on the wrong person, and {a} knows it before the host '
  + 'says another word.',
];
const REACT_ROBBED = [
  '{a} sat across from that cloak for the length of the season and never once wrote the '
  + 'name. It is not the money that lands hardest.',
  '{a} thought the room was clean. {a} was going to split it with the person who is about '
  + 'to take all of it.',
  '{a} reached the last table honest and leaves it with nothing, beaten by somebody who '
  + 'was never once in danger.',
];

// THE BEAT BEFORE THE BOX. The room has stopped, the cloaks are still on, and
// for one held moment nobody knows — the whole season narrows to this.
const SUSPENSE = [
  'They have agreed to stop. The strongbox is carried in and set on the table, and for '
  + 'the length of one breath not one person at it knows what any of the others are.',
  'The game is over and the cloaks are still on. That is the trick of the ending: the '
  + 'money is decided, and the people it is being decided between are about to find out '
  + 'with everyone else.',
  'No more slates. No more asks. Just the box on the table and the last thing left to '
  + 'do -- which is to find out, all at once, who has been sitting there the whole time.',
  'The candles are let go out and nobody lights them. There is no evening left to get '
  + 'through, only the box, and the answer folded up inside the people around it.',
];
const SUSPENSE_HOST = [
  'You have stopped the game. Now I get to tell you what you stopped it on.',
  'Before anybody touches that box -- one of you already knows how this ends. The rest '
  + 'of you are about to.',
  'You decided to trust each other. In a moment you will learn exactly what that was '
  + 'worth.',
  'Hands off the box. Look at the faces around you first. Remember them like this.',
];
// ══════════════════════════════════════════════════════════════════════
// THE UNMASKING
// ══════════════════════════════════════════════════════════════════════
//
// The scene the format is built to reach, and the one this screen did not
// have. The room agreed to stop, the money was announced, and the season's
// central question — what were these people — was answered only by implication
// in a list of who got paid. Nobody ever turned over.
//
// In the show this is the whole ending: the host stops the room, says the
// thing, and then goes round one at a time. A Faithful says it and the table
// exhales. A Traitor says it and the table comes apart. That is why the
// reveals arrive one card at a time here, Faithfuls first and the pact last —
// the order is on the record (js/tr/endgame.js) precisely so this screen
// cannot give the ending away halfway through.

/** The host stopping the room. This is the speech, and it is said once. */
const UNMASK_HOST = [
  'Nobody move. You have played this game for {days} days without ever being told '
  + 'the truth, and I am about to tell you all of it at once.',
  'You have made your decision. Now I make mine, which is to stop lying to you. '
  + 'One at a time, in this room, we find out what you all were.',
  'Look around this table. Some of you are exactly what you said you were. At '
  + 'least one of you has been sitting there since the first morning waiting for this.',
  'There is nothing left to vote on. There is only the last thing, which is the '
  + 'truth, and it has been in this room the whole time.',
  'You came in here strangers and you are leaving as something. In a moment you '
  + 'will all find out what.',
  'This is the part nobody can lie through. When I ask, you answer, and the answer '
  + 'is the one you have been carrying since the night I picked.',
];
const UNMASK_LEAD = [
  'Nobody sits down. The host goes round the table and asks the only question the '
  + 'castle has ever cared about, and this time there is no vote attached to it.',
  'The candles are behind them and the room has gone completely quiet. One at a '
  + 'time, each of them is asked to say what they are, out loud, to the people they '
  + 'played it with.',
  'This is the moment the whole season has been arranged around. Not the money — '
  + 'the turning over.',
  'They stand where they are. There is no slate to write on and nowhere to look '
  + 'except at each other while it happens.',
];

/** A Faithful turning over. Relief, or the cost of having been honest. */
const UNMASK_FAITHFUL = [
  '{a} says it plainly and the table lets out a breath it has been holding since '
  + 'the first table.',
  '&ldquo;Faithful,&rdquo; says {a}, and means it, and has meant it every single '
  + 'night in this castle.',
  '{a} was exactly what {sub} said {sub} was. In this room that is somehow the '
  + 'more surprising answer.',
  '{a} turns over honest. Nobody is shocked and one or two people look faintly '
  + 'guilty about the ballots they wrote.',
  'Faithful. {a} has been telling the truth in a building where that was worth '
  + 'nothing, and the room knows it now.',
  '{a} says the word and somebody reaches over and grips {posAdj} arm. That is '
  + 'the whole of it: honest, and nearly not believed.',
  '{a} is clean, and the way {sub} says it makes it obvious how long {sub} has '
  + 'wanted somebody to just ask.',
  'Faithful, says {a}, and the person who very nearly wrote that name cannot '
  + 'look up.',
];

/** A Traitor turning over. The gasp — this is the beat the ending is for. */
const UNMASK_TRAITOR = [
  '{a} does not say it straight away. {a} lets the room look, and then says it, '
  + 'and the table comes apart.',
  '&ldquo;Traitor.&rdquo; One word out of {a}, and every conversation of the last '
  + 'fortnight rearranges itself in the heads of the people who had it.',
  '{a} smiles before {sub} answers, which is the answer. The noise the table makes '
  + 'is not a word.',
  '{a} says it quietly and it lands like a door. Somebody says <em>no</em> out '
  + 'loud, to nobody.',
  'Traitor. {a} has sat at every table in this castle and written a name every '
  + 'time, and not one of those names was true.',
  '{a} turns over and the room does not believe it for a full second. Then it '
  + 'does, all at once, and everybody starts talking.',
  '&ldquo;I have been a Traitor since the first night,&rdquo; says {a}. The people '
  + 'who defended {obj} at the last table are the loudest.',
  '{a} says the word almost gently, which is somehow worse, and the table erupts.',
];

/** The room, watching a cloak turn over. Grounded in what they actually did. */
const REACT_UNMASK = [
  '{b} sat next to that for the entire season.',
  '{b} defended {a} at a table. Out loud. To the room.',
  '{b} is not saying anything. {b} is just doing the arithmetic.',
  '{b} laughs once, entirely without humour.',
  '{b} had the name and talked {ref} out of it.',
  '{b} has both hands over {posAdj} mouth and has not moved.',
  '{b} looks at {a} the way you look at a stranger who knows your address.',
  '{b} says &ldquo;I knew it&rdquo; and absolutely nobody in this room believes {obj}.',
];

/** What the room banished blind, and whether it was right. */
// `{door}` is the registry's word for this show's public exit and is filled at
// the call site — see tests/tr-vp.test.js, which fails any castle source that
// writes one as a literal. This screen has no business knowing the word.
const SENTHOME_LEAD = [
  'And the ones they sent home at the end — nobody was ever told what those were, '
  + 'not the room and not the people watching it. Here they are.',
  'The last {door}s went out without a word. This is what the room actually '
  + 'did with them.',
  'Every chair emptied in this endgame was emptied blind. The castle finds out now, '
  + 'at the same time as everybody else.',
  'They went on nerve and were told nothing. This is the score.',
];
const SENTHOME_RIGHT = [
  'They were right, and they never knew it at the time.',
  'The room found it, on nothing but instinct, and then had to sit there wondering.',
  'That was a cloak, and the table sent it out without ever being told it had.',
];
const SENTHOME_WRONG = [
  'Honest, and sent home anyway, on nothing.',
  'The room spent its last {door} on somebody who never told it a single lie.',
  'A Faithful, put out at the end by the people {sub} had been right about all along.',
];

// THE HEADLINE THE WHOLE SEASON WAS FOR. Chosen off the record's own word.
const VERDICT = {
  traitors: { solo: 'The Traitor Wins', many: 'The Traitors Win',
    kicker: 'The pact was never broken. The castle handed it the box.' },
  faithfuls: { solo: 'The Faithful Wins', many: 'The Faithful Win',
    kicker: 'Not one cloak left in the room. They found every last one.' },
};

const MONEY_LEAD = {
  faithfuls: [
    'Nobody left in this room was lying, and the money stays where the room put it.',
    'The cloaks are counted and there are none. Everything the season earned is theirs.',
    'The castle is clean, and it is clean because these people made it clean.',
    'The last cloak came off at some table nobody was told about. What is standing here '
    + 'is exactly what it says it is.',
  ],
  traitors: [
    'And here is what the silence was hiding.',
    'The room ended the game with somebody in it who was never going to be caught.',
    'Every table since the first one was played against somebody still in this room.',
    'They stopped, and the reason they could afford to stop is standing at the table with '
    + 'them.',
  ],
};

const HOST_ASK = [
  'One word. Fold it. Nobody is going to read these out.',
  'Write what you want to happen next, and be careful what that is.',
  'You may end this now, all of you together, or not at all.',
  'I want a word from each of you and I do not want to hear a single one of them.',
];
const HOST_CLOSE = {
  faithfuls: [
    'You never found the last one, and it turns out there was not a last one to find. '
    + 'Take it. All of you.',
    'You spent weeks accusing each other and you were right at the end of it. That happens '
    + 'less often than you would like.',
    'A clean castle. I have watched a great many of these and I do not see that often.',
    'You stopped at exactly the right moment, and you had no way of knowing that.',
  ],
  traitors: [
    'You were sitting across a table from that for a very long time.',
    'You ended the game the moment you should have kept going, and there was no way for '
    + 'you to know it. That is the format working.',
    'Somebody in that room was never worried, and now you know why.',
    'You wanted an answer at every table you sat at. Here is the one the castle owed you, '
    + 'and it is late.',
  ],
};

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — what this observer is entitled to, decided once
// ══════════════════════════════════════════════════════════════════════
//
// TWO THINGS HAPPEN HERE AND THEY ARE DIFFERENT THINGS.
//
// 1. THE ALIGNMENT LOCK. Each choice is rebuilt to two fields -- a name and a
//    word -- rather than copied and pruned. The record in js/tr/headless.js
//    already does this and this does it AGAIN, deliberately, because the two
//    locks fail for different reasons and are caught by different tests: the
//    record's is caught by reading the record, and this one is caught by
//    handing the screen a record that is holding an alignment. A screen that
//    trusted its input would render whatever a later edit to the engine put
//    on it, and the thing spec 8 forbids is precisely a field growing where
//    nobody is looking.
//
// 2. THE READERSHIP. Who is allowed to read whose paper. The audience reads
//    every slip; a player reads their own and nobody else's, forever, because
//    that is what a secret ballot IS. What is public in both layers is the
//    COUNT -- the room is told whether it was unanimous, since that is the
//    fact that forces another table -- and the money, which is announced to
//    everybody including the people it is being taken from.
function _view(ep, observer) {
  const rec = ep && ep.tr && ep.tr.endgame;
  if (!rec || !Array.isArray(rec.asks) || !rec.asks.length) return null;
  const isAudience = observer === 'audience' || !observer;
  const watcher = isAudience ? null
    : String(observer).replace(/^player:/, '') || null;

  // THE ALIGNMENT LOCK. Two fields, built from scratch. Nothing else on a
  // choice record reaches this screen whatever the engine grows.
  const asks = rec.asks.map(a => {
    const choices = (a.choices || []).map(c => ({
      name: c.name,
      choice: c.choice === 'banish' ? 'banish' : 'end',
    }));
    const banish = choices.filter(c => c.choice === 'banish').length;
    return { ep: a.ep, living: [...(a.living || [])], choices, banish,
      unanimous: banish === 0 };
  });
  // Same lock on the tables: an episode and a name, plus the VOTE that named
  // them — who wrote whose name (public, read aloud at any Round Table) and the
  // count it came to. `revealedTraitor` is the one alignment field, and it is
  // null unless the author turned the finale reveals on: with them off the
  // record never carried it, so the screen is blind by construction.
  const tables = (rec.tables || []).map(t => ({
    ep: t.ep, chosen: t.chosen || null,
    ballots: Array.isArray(t.ballots)
      ? t.ballots.map(b => ({ voter: b.voter, voted: b.voted })) : [],
    tally: t.tally && typeof t.tally === 'object' ? { ...t.tally } : null,
    revotes: Array.isArray(t.revotes) ? t.revotes.map(rv => ({
      tied: [...(rv.tied || [])],
      ballots: (rv.ballots || []).map(b => ({ voter: b.voter, voted: b.voted })),
    })) : [],
    revealedTraitor: rec.reveal ? (t.revealedTraitor === true) : null,
  }));
  const revealOn = !!rec.reveal;

  const room = [];
  for (const a of asks) for (const n of a.living) if (!room.includes(n)) room.push(n);
  const present = !!watcher && room.includes(watcher);

  return {
    isAudience, watcher, present, room, asks, tables, revealOn,
    ep: rec.from || ep.num || 0,
    // The money. Ground truth, and this is the one place in the format where
    // that is legitimate -- see `resolvePot`. Read straight off the record so
    // the figure on the page and the figure in the export cannot disagree.
    winner: rec.winner || null,
    // THE UNMASKING, in the order the record put it in — Faithfuls first and
    // the pact last, decided in js/tr/endgame.js so this screen cannot give
    // the ending away halfway through by sorting it differently.
    reveals: (rec.reveals || []).map(r => ({ name: r.name, role: r.role })),
    sentHome: (rec.sentHome || []).map(r => ({ name: r.name, role: r.role, ep: r.ep })),
    takers: [...(rec.takers || [])],
    losers: [...(rec.losers || [])],
    pot: rec.pot || 0,
    share: rec.share || 0,
    line: rec.line || '',
    doors: _verbs(),
    // How the room got this small, for the opening card. Both doors, both
    // words from the registry.
    //
    // `goneBefore` IS EVERYBODY WHO HAD LEFT WHEN THIS EPISODE OPENED and
    // deliberately excludes this row's own departures -- see the note on it
    // in js/tr/headless.js. This screen rides on the LAST row of the season,
    // so those are the two people who left on the night the endgame started,
    // and leaving them out undercounted the castle by exactly one door's
    // worth. They come in through `roundExits()`, which is the registry's own
    // rule for the question and the only place this file is allowed to ask
    // which door somebody used.
    //
    // AND IT IS THE ROOM AS THE LAST QUESTION FOUND IT, not as it was left.
    // The endgame's own tables take people out of this same list, and the
    // opening card says how many are standing at the FIRST ask -- printing
    // "six standing" beside a door count that had already removed two of the
    // six is a sentence disagreeing with the sentence next to it, which is
    // the defect js/tr/endgame.js split its own pot pools to make
    // unrepresentable. Anybody who was in the room when it opened is not
    // somebody who had already gone, whatever happened to them afterwards.
    gone: [...((ep.tr && ep.tr.goneBefore) || []), ...roundExits(ep, TR)]
      .filter(g => g && !room.includes(g.name)),
    cast: (ep.tr && ep.tr.cast) || [],
    // The living-pair bonds as they stood this episode (js/tr/headless.js
    // `_snapshotBonds`: {a,b,v}, |v|>=1). Faithful-safe — a bond is a thing
    // the whole castle can see — and it is what grounds a reveal's grief: the
    // room turns to the person who was closest to whoever just left.
    bonds: (ep.tr && Array.isArray(ep.tr.bonds)) ? ep.tr.bonds : [],
  };
}

/** May this observer read this person's paper? */
function _mayRead(v, name) {
  if (v.isAudience) return true;
  return !!v.watcher && v.watcher === name;
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

function _card(kind, label, icon, inner) {
  return '<div class="lt-card" data-kind="' + kind + '">'
    + (label ? '<div class="lt-label">' + _ic(icon || 'slip', 13, 'currentColor')
      + _esc(label) + '</div>' : '')
    + inner + '</div>';
}
function _sums(rows) {
  return '<div class="lt-sums">' + rows.map(r =>
    '<span class="lt-sum"><span class="lt-sum-k">' + _esc(r[0]) + '</span>'
    + '<span class="lt-sum-v"' + (r[2] ? ' data-tone="' + r[2] + '"' : '') + '>'
    + r[1] + '</span></span>').join('') + '</div>';
}
function _hostBand(line) {
  const h = _host();
  return '<div class="lt-host">' + _hostAv(46)
    + '<div><div class="lt-host-name">' + _icon('seal', 13, '#f4dda2')
    + _esc(h.name) + '</div>'
    + '<div class="lt-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}
/** Curly apostrophes in the pools, without a literal in every string. */
const _apos = s => String(s).replace(/\{apos\}/g, '&rsquo;');

// How warm a bond has to be before an empty chair reads as grief. Held, not
// tuned — the same threshold the morning-after grief uses in headless.js.
const GRIEF_BOND = 3;
function _pron(name) { try { return pronouns(name) || {}; } catch (e) { return {}; } }
function _bondBetween(v, a, b) {
  for (const p of (v.bonds || [])) {
    if ((p.a === a && p.b === b) || (p.a === b && p.b === a)) return p.v || 0;
  }
  return 0;
}
// Did the first count of this table tie at the top? Decides which result line
// the table's card draws — a clean count "chose" the name; a tie "broke" to it.
function _tableWasTie(table) {
  const t = table && table.tally && typeof table.tally === 'object' ? table.tally : {};
  const counts = Object.values(t);
  if (counts.length < 2) return false;
  const top = Math.max(...counts);
  return counts.filter(c => c === top).length > 1;
}
// THE VOTE, DRAWN. Every slate face-up (a Round Table reads them aloud — this
// is public in both layers), the ones that named the banished flagged, and the
// tally they came to with the top name barred in blood.
function _voteStage(table, akey) {
  const chosen = table.chosen;
  const slates = (table.ballots || []).map(b =>
    '<div class="lt-slate" data-hit="' + (b.voted === chosen ? 1 : 0) + '">'
    + '<span class="lt-slate-who">' + _av(b.voter, 32)
    + '<span class="lt-slate-nm">' + _esc(b.voter) + '</span></span>'
    + '<span class="lt-slate-arrow">wrote</span>'
    + '<span class="lt-slate-tgt">' + _esc(b.voted || '—') + '</span></div>').join('');
  const t = table.tally && typeof table.tally === 'object' ? table.tally : {};
  const entries = Object.entries(t).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? Math.max(1, entries[0][1]) : 1;
  // A TIE AT THE TOP is not decided by this count. The top score is shared when
  // two or more names hold it; the banished (`table.chosen`) is only "top" here
  // if nothing else matched it. `data-top` flags every name on the top score,
  // not just the one who left, so the count reads honestly as level.
  const top = entries.length ? entries[0][1] : 0;
  const tiedNames = entries.filter(([, c]) => c === top).map(([nm]) => nm);
  const isTie = tiedNames.length > 1;
  const rows = entries.map(([nm, c]) =>
    '<div class="lt-trow" data-top="' + (c === top ? 1 : 0) + '">'
    + '<span class="lt-tname">' + _esc(nm) + '</span>'
    + '<span class="lt-tbar"><span class="lt-tbar-f" style="width:'
    + Math.round(c / max * 100) + '%"></span></span>'
    + '<span class="lt-tnum">' + c + '</span></div>').join('');
  let html = '<div class="lt-vote">' + slates + '</div>'
    + (rows ? '<div class="lt-tally">' + rows + '</div>' : '');
  // THE TIE-BREAK, drawn only when the first count actually tied. Each revote is
  // its own set of slates (the format re-asks only the tied, and they do not
  // vote on themselves); a tie that survives every revote was settled by a draw,
  // which is the format's last resort and has to be SAID or the banishment looks
  // arbitrary — the reported bug (a level 1-1-1 and then "it chose Gwen").
  if (isTie) {
    const revotes = Array.isArray(table.revotes) ? table.revotes : [];
    let broke = false;
    for (const rv of revotes) {
      const rslates = (rv.ballots || []).map(b =>
        '<div class="lt-slate" data-hit="' + (b.voted === chosen ? 1 : 0) + '">'
        + '<span class="lt-slate-who">' + _av(b.voter, 30)
        + '<span class="lt-slate-nm">' + _esc(b.voter) + '</span></span>'
        + '<span class="lt-slate-arrow">again</span>'
        + '<span class="lt-slate-tgt">' + _esc(b.voted || '—') + '</span></div>').join('');
      const rt = {};
      for (const b of (rv.ballots || [])) if (b.voted) rt[b.voted] = (rt[b.voted] || 0) + 1;
      const rtop = Object.values(rt).length ? Math.max(...Object.values(rt)) : 0;
      const rtied = Object.entries(rt).filter(([, c]) => c === rtop).map(([n]) => n);
      if (rtied.length <= 1) broke = true;
      html += '<div class="lt-tiebreak"><div class="lt-tiebreak-h">A Tie — They Vote Again</div>'
        + '<div class="lt-tiebreak-s">Level between ' + _esc(_listOf(rv.tied || tiedNames))
        + '. Only the tied are named, and they do not vote on themselves.</div>'
        + '<div class="lt-vote">' + rslates + '</div></div>';
    }
    if (!broke) {
      // Every revote tied too (or there was no eligible voter to break it): the
      // name was drawn. The format does this in the open — it hands them boxes.
      html += '<div class="lt-tiebreak lt-drawn"><div class="lt-tiebreak-h">Still Level — '
        + 'The Name Is Drawn</div><div class="lt-tiebreak-s">Nobody could break it, so it '
        + 'came down to the draw. ' + _esc(chosen) + ' was the name pulled.</div></div>';
    }
  }
  return html;
}
// THE REACTIONS THE CHAIR LEAVES BEHIND, each grounded in a record the room
// can see. Grief off a stored bond (alignment-free, so it fires whether or not
// the reveal is on); vindication/guilt only when the reveal turned the cloak
// over, and only for somebody who actually wrote that name at this table.
function _revealReacts(v, table, akey) {
  const chosen = table.chosen;
  const chips = [];
  const used = new Set([chosen]);
  let griever = null, best = GRIEF_BOND;
  for (const n of (v.room || [])) {
    if (used.has(n)) continue;
    const b = _bondBetween(v, n, chosen);
    if (b >= best) { best = b; griever = n; }
  }
  if (griever) {
    used.add(griever);
    const pr = _pron(griever);
    chips.push({ tone: 'grief', name: griever,
      tx: _fill(_pick(REACT_GRIEF, akey + '|grief'),
        { a: '<b>' + _esc(griever) + '</b>', who: _esc(chosen), posAdj: pr.posAdj || 'their' }) });
  }
  if (table.revealedTraitor !== null && table.revealedTraitor !== undefined) {
    const voters = (table.ballots || [])
      .filter(b => b.voted === chosen && (v.room || []).includes(b.voter) && !used.has(b.voter))
      .map(b => b.voter);
    if (voters.length) {
      const who = voters[_hash(akey + '|react-voter') % voters.length];
      used.add(who);
      const pr = _pron(who);
      const pool = table.revealedTraitor ? REACT_VINDICATED : REACT_GUILT;
      chips.push({ tone: table.revealedTraitor ? 'relief' : 'steel', name: who,
        tx: _fill(_pick(pool, akey + '|vg'),
          { a: '<b>' + _esc(who) + '</b>', who: _esc(chosen), posAdj: pr.posAdj || 'their' }) });
    }
  }
  if (!chips.length) return '';
  return '<div class="lt-reacts">' + chips.map(c =>
    '<span class="lt-react" data-tone="' + c.tone + '">' + _av(c.name, 34)
    + '<span class="lt-react-tx">' + c.tx + '</span></span>').join('') + '</div>';
}

function _buildBeats(v) {
  const beats = [];
  const key = 'lt|' + v.ep + '|' + v.room.join(',');
  const push = (phase, html, meta) => beats.push({ phase, html, meta: meta || null });

  // ── the room at the end ─────────────────────────────────────────────
  const byDoor = { vote: 0, night: 0 };
  for (const g of v.gone) {
    if (g && g.channel === 'murder') byDoor.night++; else byDoor.vote++;
  }
  push('open', _card('open', 'The Room At The End', 'cold',
    '<h2 class="lt-h">Nobody Is Going To Be Turned Over</h2>'
    + '<p>' + _apos(_pick(OPEN, key + '|open')) + '</p>'
    + '<p>' + _apos(_pick(RULE, key + '|rule')) + '</p>'
    + _sums([
      ['Still standing', String(v.room.length), null],
      [_cap(v.doors.vote), String(byDoor.vote), null],
      [_cap(v.doors.night), String(byDoor.night), 'wax'],
      ['The fund', _money(v.pot), 'brass'],
    ])), { kind: 'open' });

  // ── every time the question was put ─────────────────────────────────
  for (let i = 0; i < v.asks.length; i++) {
    const a = v.asks[i];
    const akey = key + '|' + i;
    push('ask', _card('ask', i === 0 ? 'The Question, For The First Time'
      : 'The Question, ' + _ordinal(i + 1), 'silence',
      '<h2 class="lt-h">' + (i === 0 ? 'Banish Again, Or End It'
        : 'The Same Question, Fewer Hands') + '</h2>'
      + '<p>' + _apos(_pick(i === 0 ? ASK_FIRST : ASK_AGAIN, akey + '|ask')) + '</p>'
      + _hostBand(_esc(_pick(HOST_ASK, akey + '|host')))),
    { kind: 'ask', askIdx: i });

    // Nobody at this table says what somebody else at it just said.
    const said = new Set();
    for (const c of a.choices) {
      const readable = _mayRead(v, c.name);
      const word = readable ? (c.choice === 'banish' ? 'Another' : 'End it') : 'Sealed';
      const spoke = readable
        ? _pickAway(c.choice === 'banish' ? SAY_BANISH : SAY_END, akey + '|' + c.name, said)
        : '';
      const note = readable
        ? _pickAway(c.choice === 'banish' ? NOTE_BANISH : NOTE_END, akey + '|n|' + c.name, said)
        : _pickAway(NOTE_SEALED, akey + '|s|' + c.name, said);
      push('answer', _card('answer', '', 'slip',
        '<div class="lt-answer">'
        + '<span class="lt-answer-who">' + _av(c.name, 40)
        + '<span class="lt-answer-nm">' + _esc(c.name) + '</span></span>'
        + '<span class="lt-slip" data-choice="' + (readable ? c.choice : 'sealed') + '"'
        + ' data-name="' + _esc(c.name) + '">'
        + '<span class="lt-slip-w">' + _esc(word) + '</span></span>'
        + '<span class="lt-answer-note">' + _apos(_esc(note))
        + (spoke ? ' <em>&ldquo;' + _esc(spoke) + '&rdquo;</em>' : '') + '</span>'
        + '</div>'),
      { kind: 'answer', askIdx: i, name: c.name,
        shown: readable ? c.choice : 'sealed' });
    }

    // THE COUNT IS PUBLIC IN BOTH LAYERS, and it has to be: it is the fact
    // that forces another table, so the room is told it whether or not the
    // room is told who supplied it.
    const table = a.unanimous ? null : (v.tables[i] || null);
    push('count', _card('count', 'The Count', 'tally',
      '<div class="lt-count">'
      + '<span class="lt-count-n" data-tone="' + (a.unanimous ? 'cold' : 'wax') + '">'
      + (a.unanimous ? 'None' : String(a.banish)) + '</span>'
      + '<span class="lt-count-s">' + (a.unanimous
        ? 'not one hand asked for another'
        : (a.banish === 1 ? 'one hand, of ' + a.choices.length
          : a.banish + ' hands, of ' + a.choices.length)) + '</span></div>'
      + '<p>' + _apos(_pick(a.unanimous ? COUNT_ONE_VOICE : COUNT_SPLIT, akey + '|count'))
      + '</p>'),
    { kind: 'count', askIdx: i, unanimous: a.unanimous, banish: a.banish });

    // ── the vote that forced the table, and then the table itself ─────
    if (table && table.chosen) {
      // THE VOTE. The secret ballot above only decided to HOLD a table; this
      // is the table. Rendering it is what stops a player who voted "end it"
      // from being banished with nothing on screen to explain who chose them.
      push('vote', _card('vote', 'The Vote', 'slip',
        '<h2 class="lt-h">A Name, Not A Word</h2>'
        + '<p>' + _apos(_pick(VOTE_INTRO, akey + '|vintro')) + '</p>'
        + _hostBand(_esc(_pick(VOTE_HOST, akey + '|vhost')))
        + _voteStage(table, akey)
        + '<p class="lt-say">'
        + _esc(_fill(_pick(_tableWasTie(table) ? VOTE_RESULT_TIE : VOTE_RESULT,
          akey + '|vres'), { who: table.chosen }))
        + '</p>'),
      { kind: 'vote', askIdx: i, chosen: table.chosen });

      // WHAT IT COST — turned over, or not, on the author's Castle Option.
      const reacts = _revealReacts(v, table, akey);
      if (v.revealOn && table.revealedTraitor !== null
        && table.revealedTraitor !== undefined) {
        const traitor = table.revealedTraitor === true;
        const side = traitor ? 'traitor' : 'faithful';
        const pr = _pron(table.chosen);
        push('table', _card('table', 'What It Cost', 'part',
          '<h2 class="lt-h">' + _esc(table.chosen) + ' Was ' + _cap(v.doors.vote)
          + '</h2>'
          + '<div class="lt-reveal" data-side="' + side + '">'
          + '<div class="lt-reveal-tag">' + (traitor ? 'A Traitor' : 'Faithful')
          + '</div><div class="lt-reveal-s">'
          + _apos(_esc(_fill(_pick(traitor ? REVEAL_TRAITOR : REVEAL_FAITHFUL,
            akey + '|rev'), { who: table.chosen, obj: pr.obj || 'them' })))
          + '</div></div>' + reacts),
        { kind: 'table', askIdx: i, chosen: table.chosen, revealed: side });
      } else {
        push('table', _card('table', 'What It Cost', 'part',
          '<h2 class="lt-h">' + _esc(table.chosen) + ' Was ' + _cap(v.doors.vote)
          + '</h2>'
          + '<p>' + _esc(_fill(_pick(TABLE_SILENT, akey + '|table'),
            { who: table.chosen })) + '</p>'
          + '<div class="lt-void"><div class="lt-void-w">Nothing Is Turned Over</div>'
          + '<div class="lt-void-s">There is no reveal at a table this late. Whatever '
          + _esc(table.chosen) + ' was, they took it out of the door with them.</div>'
          + '</div>' + reacts),
        { kind: 'table', askIdx: i, chosen: table.chosen });
      }
    }
  }

  // ── AND THE ONE THING THAT IS TURNED OVER ───────────────────────────
  //
  // EVERY TAKER, AND NEVER THE FIRST OF THEM. Up to four people split this
  // pot, and js/tr/export.js is explicit that picking a main winner out of
  // `winners[]` is inventing a fact the season does not contain.
  const solo = v.takers.length === 1;
  const winnersHtml = v.takers.map(n =>
    '<span class="lt-winner" data-name="' + _esc(n) + '">' + _av(n, 46)
    + '<span><span class="lt-winner-nm">' + _esc(n) + '</span>'
    + '<span class="lt-winner-sh">' + (solo ? 'takes all of it' : _money(v.share)) + '</span>'
    + '</span></span>').join('');
  const lostHtml = v.losers.length
    ? '<div class="lt-lost">' + v.losers.map(n =>
      '<span class="lt-lost-one" data-name="' + _esc(n) + '">' + _av(n, 30)
      + '<span class="lt-lost-nm">' + _esc(n) + '</span></span>').join('') + '</div>'
    : '';
  // THE POOL IS CHOSEN BY THE RECORD'S OWN WORD, NOT BY A COMPARISON.
  // `resolvePot` returns 'faithfuls' or 'traitors' and this looks the pool up
  // under it -- `v.winner === 'traitors' ? ... : ...` was the first draft and
  // tests/show-list-duplication.test.js caught it, because one of the two
  // sides of this game is spelled the same as one of the three shows on this
  // engine and a comparison against a show slug is how a two-show world gets
  // written. It is a false positive on the meaning and a true one on the
  // shape, and the shape is the thing the rule is about.
  const side = MONEY_LEAD[v.winner] ? v.winner : 'faithfuls';

  // ── THE HELD BREATH BEFORE THE BOX ──────────────────────────────────
  // A beat with no numbers on it: the game has stopped, the cloaks are still
  // on, and the whole season narrows to the moment before it is turned over.
  // This is the suspense the ending was missing — the reveal lands on a room
  // the viewer has been made to wait for, not on a line of accounting.
  push('money', _card('money', 'The Fire Of Truth', 'read',
    '<p>' + _apos(_pick(SUSPENSE, key + '|susp')) + '</p>'
    + _hostBand(_esc(_pick(SUSPENSE_HOST, key + '|susphost')))),
  { kind: 'suspense' });

  // ── THE UNMASKING ───────────────────────────────────────────────────
  //
  // One card per person, in the record's order — Faithfuls first, the pact
  // last. Before this the ending was a list of who got paid, and the season's
  // actual question was answered only by implication. Nobody ever turned over.
  if (v.reveals.length) {
    // ONE SET FOR THE WHOLE SCENE. Eight variants and five people turning over
    // is a coin flip that two of them collide, and a dumped finale had exactly
    // that: two Faithfuls saying word for word the same sentence, one after
    // the other. `_pickAway` is here for this and its doc comment says so.
    const said = new Set();
    push('unmask', _card('unmask', 'The Last Question', 'seal',
      '<p>' + _apos(_pick(UNMASK_LEAD, key + '|unmask-lead')) + '</p>'
      + _hostBand(_esc(_fill(_pick(UNMASK_HOST, key + '|unmask-host'),
        { days: String(Math.max(2, v.ep || 2)) })))),
    { kind: 'unmask-open' });

    v.reveals.forEach((r, i) => {
      const isT = r.role === 'traitor';
      const pr = _pron(r.name);
      const pool = isT ? UNMASK_TRAITOR : UNMASK_FAITHFUL;
      // THE ROOM ONLY REACTS TO A CLOAK. A Faithful turning over is a relief;
      // a Traitor turning over is the scene, so the reaction is spent there
      // and the person reacting is somebody who was actually in the room.
      const others = v.reveals.filter(x => x.name !== r.name).map(x => x.name);
      const reactor = (isT && others.length)
        ? others[_hash(key + '|unmask-react-who|' + r.name) % others.length] : null;
      const rpr = reactor ? _pron(reactor) : {};
      push('unmask', _card('unmask', '', isT ? 'cloak' : 'seal',
        '<div class="lt-turn" data-role="' + r.role + '">'
        + '<div class="lt-turn-av">' + _av(r.name, 62) + '</div>'
        + '<div class="lt-turn-body">'
        + '<div class="lt-turn-nm">' + _esc(r.name) + '</div>'
        + '<div class="lt-turn-role">' + (isT ? 'Traitor' : 'Faithful') + '</div>'
        + '<p class="lt-turn-tx">'
        + _apos(_fill(_pickAway(pool, key + '|unmask|' + r.name, said),
          { a: '<b>' + _esc(r.name) + '</b>', sub: pr.sub || 'they',
            obj: pr.obj || 'them', posAdj: pr.posAdj || 'their' })) + '</p>'
        + '</div></div>'
        + (reactor
          ? '<div class="lt-reacts"><span class="lt-react" data-tone="shock">'
            + _av(reactor, 34) + '<span class="lt-react-tx">'
            + _apos(_fill(_pickAway(REACT_UNMASK, key + '|unmask-react|' + r.name, said),
              { a: '<b>' + _esc(r.name) + '</b>', b: '<b>' + _esc(reactor) + '</b>',
                obj: rpr.obj || 'them', ref: rpr.ref || 'themselves',
                posAdj: rpr.posAdj || 'their' }))
            + '</span></span></div>'
          : '')),
      { kind: 'unmask', name: r.name, role: r.role, order: i });
    });

    // AND WHAT THEY SENT HOME BLIND. No endgame banishment revealed anything,
    // so this is the first time anybody learns whether the room was right —
    // the difference between a clean win and one they arrived at by luck.
    if (v.sentHome.length) {
      const right = v.sentHome.filter(x => x.role === 'traitor').length;
      push('unmask', _card('unmask', 'And The Ones They Sent Home', 'part',
        '<p>' + _apos(_fill(_pick(SENTHOME_LEAD, key + '|sent-lead'),
          { door: _esc(v.doors.vote) })) + '</p>'
        + '<div class="lt-sent">' + v.sentHome.map(x => {
          const spr = _pron(x.name);
          return '<div class="lt-sent-row" data-role="' + x.role + '">'
            + _av(x.name, 34)
            + '<span class="lt-sent-nm">' + _esc(x.name) + '</span>'
            + '<span class="lt-sent-role">' + (x.role === 'traitor' ? 'Traitor' : 'Faithful')
            + '</span>'
            + '<span class="lt-sent-say">' + _apos(_fill(_pickAway(
              x.role === 'traitor' ? SENTHOME_RIGHT : SENTHOME_WRONG,
              key + '|sent|' + x.name, said),
              { sub: spr.sub || 'they', door: _esc(v.doors.vote) })) + '</span>'
            + '</div>';
        }).join('') + '</div>'
        + _sums([
          ['Cloaks found blind', String(right), right ? 'brass' : null],
          ['Honest, sent anyway', String(v.sentHome.length - right), null],
        ])),
      { kind: 'sent-home' });
    }
  }

  // ── AND THEN IT IS TURNED OVER ──────────────────────────────────────
  // The verdict is the headline the whole season was for. `resolvePot` decided
  // the winner off ground truth (the one place that is legitimate); the tag is
  // read straight off its word so the banner and the money cannot disagree.
  const vv = VERDICT[side] || VERDICT.faithfuls;
  // A Traitor win is a Traitor UNMASK — the winners wear the pact colour and
  // the robbed Faithful get a reaction, grounded in their having reached the
  // end without ever writing the winning name.
  const robbedHtml = (side === 'traitors' && v.losers.length)
    ? (() => {
      const who = v.losers[_hash(key + '|robbed-who') % v.losers.length];
      const pr = _pron(who);
      return '<div class="lt-reacts"><span class="lt-react" data-tone="shock">'
        + _av(who, 34) + '<span class="lt-react-tx">'
        + _fill(_pick(REACT_ROBBED, key + '|robbed'),
          { a: '<b>' + _esc(who) + '</b>', posAdj: pr.posAdj || 'their' })
        + '</span></span></div>';
    })() : '';
  push('money', _card('money', 'The Strongbox', 'read',
    '<div class="lt-verdict" data-side="' + side + '">'
    + '<div class="lt-verdict-k">' + (side === 'traitors'
      ? 'The Castle Was Betrayed' : 'The Castle Held') + '</div>'
    + '<h2 class="lt-verdict-h">' + (solo ? vv.solo : vv.many) + '</h2>'
    + '<div class="lt-verdict-s">' + _esc(vv.kicker) + '</div></div>'
    + '<div class="lt-pot"><span class="lt-pot-n">' + _money(v.pot) + '</span>'
    + '<span class="lt-pot-k">in the box</span></div>'
    + '<h2 class="lt-h">' + (solo ? 'One Of Them Takes It'
      : v.takers.length + ' Ways') + '</h2>'
    + '<p>' + _apos(_pick(MONEY_LEAD[side], key + '|lead')) + '</p>'
    + '<div class="lt-winners" data-side="' + side + '">' + winnersHtml + '</div>'
    + robbedHtml
    + (lostHtml ? '<p class="lt-say">And these were at the same table.</p>' + lostHtml : '')
    // THE ENGINE'S OWN SENTENCE, not a second copy of it. `resolvePot` picks
    // its pool off the number of takers and whether anybody is standing
    // beside them, so a sentence written here would be a second rule that
    // could come to disagree with the money above it.
    + '<p class="lt-say">' + _esc(v.line) + '</p>'
    + _sums([
      ['Each', solo ? _money(v.pot) : _money(v.share), 'brass'],
      ['Took nothing', v.losers.length ? _listOf(v.losers) : 'Nobody', null],
      ['Tables it took', String(v.tables.length), null],
    ])
    + _hostBand(_esc(_pick(HOST_CLOSE[side], key + '|close')))),
  { kind: 'money' });

  return beats;
}

function _ordinal(n) {
  const words = ['', 'For The First Time', 'A Second Time', 'A Third Time',
    'A Fourth Time', 'A Fifth Time', 'A Sixth Time', 'A Seventh Time'];
  return words[n] || ('A ' + n + 'th Time');
}

// ══════════════════════════════════════════════════════════════════════
// THE STAGE — the chairs, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trEndgame`, because a <script> tag inside innerHTML does
// not execute. GATED BY `_tvState` IN BOTH DIRECTIONS: a chair shows nothing
// the reveals have not reached, and it also shows nothing the OBSERVER is not
// allowed to read, so a player watching their own season sees one word of
// their own and a row of folded paper belonging to everybody else -- which is
// the same thing they saw in the room.

function _chairState(state, idx) {
  const v = state.v;
  const seen = state.stepMeta.slice(0, Math.max(0, idx + 1)).filter(Boolean);
  // who has already gone, on the beats revealed so far
  const gone = new Set(seen.filter(m => m.kind === 'table' && m.chosen).map(m => m.chosen));
  // the ask currently on screen, and the answers read within it
  const askIdx = seen.reduce((n, m) => (m.askIdx == null ? n : m.askIdx), 0);
  const answered = {};
  for (const m of seen) {
    if (m.kind === 'answer' && m.askIdx === askIdx) answered[m.name] = m.shown;
  }
  const living = (v.asks[askIdx] && v.asks[askIdx].living) || v.room;
  return v.room.map(name => {
    if (gone.has(name) || !living.includes(name)) return { name, state: 'gone', word: 'Gone' };
    const a = answered[name];
    if (!a) return { name, state: 'sealed', word: 'Sealed' };
    if (a === 'sealed') return { name, state: 'sealed', word: 'Folded' };
    return { name, state: a, word: a === 'banish' ? 'Another' : 'End it' };
  });
}

function _stage(state, idx) {
  const v = state.v;
  const seen = state.stepMeta.slice(0, Math.max(0, idx + 1)).filter(Boolean);
  const chairs = _chairState(state, idx);
  const askIdx = seen.reduce((n, m) => (m.askIdx == null ? n : m.askIdx), 0);
  const forced = seen.filter(m => m.kind === 'table' && m.chosen).length;
  const standing = chairs.filter(c => c.state !== 'gone').length;
  const money = seen.some(m => m.kind === 'money');
  const collapsed = !!state.collapsed;
  // The stage sticks under the nav all the way down the screen; late in a long
  // endgame that is a lot of fixed furniture, so it collapses the same way the
  // breakfast table does. The toggle label is rendered from `state.collapsed`
  // because `_updateStage` rewrites this innerHTML on every reveal — the class
  // lives on the persistent container, the label has to be redrawn from state.
  const epNum = state.epNum;
  const toggle = '<div class="lt-stage-head">'
    + '<button class="lt-stage-toggle" onclick="trEndgameToggleStage(\'endgame\',0,'
    + epNum + ')">' + _ic('chevron', 10)
    + (collapsed ? 'Show table' : 'Hide table') + '</button></div>';
  return toggle + '<div class="lt-stage-body">'
    + '<div class="lt-stage-row">'
    + chairs.map(c => '<span class="lt-chair" data-state="' + c.state + '"'
      + ' data-name="' + _esc(c.name) + '">' + _av(c.name, 28)
      + '<span><span class="lt-chair-nm">' + _esc(c.name) + '</span>'
      + '<span class="lt-chair-st">' + _esc(c.word) + '</span></span></span>').join('')
    + '</div>'
    + '<div class="lt-meters">'
    // THE ORDINAL ALONE, NEVER "1 OF 3". The number of times the question
    // gets asked is the whole shape of the endgame -- printing the total at
    // first paint tells the viewer, before a single slip is opened, that the
    // first two asks were not unanimous. The stage is gated by `_tvState` and
    // this is the one number on it that could reach past the gate.
    + '<span class="lt-meter"><span class="lt-meter-k">Times asked</span>'
    + '<span class="lt-meter-v">' + (askIdx + 1) + '</span></span>'
    + '<span class="lt-meter"><span class="lt-meter-k">Still standing</span>'
    + '<span class="lt-meter-v">' + standing + '</span></span>'
    + '<span class="lt-meter" data-tone="wax"><span class="lt-meter-k">Tables forced</span>'
    + '<span class="lt-meter-v">' + forced + '</span></span>'
    + '<span class="lt-meter" data-tone="brass"><span class="lt-meter-k">'
    + (money ? 'Each' : 'In the box') + '</span>'
    + '<span class="lt-meter-v">'
    + (money ? (v.takers.length === 1 ? _money(v.pot) : _money(v.share)) : _money(v.pot))
    + '</span></span>'
    + '</div>'   // .lt-meters
    + '</div>';  // .lt-stage-body
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'endgame-' + (epNum || 0); }
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
    const el = document.getElementById('lt-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('lt-vis'); else el.classList.remove('lt-vis');
  }
  const counter = document.getElementById('lt-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('lt-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.lt-btn').forEach(b => b.classList.toggle('lt-dim', done));
  }
  const shell = document.getElementById('lt-shell-' + suffix);
  const last = document.getElementById('lt-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase',
    last.getAttribute('data-phase') || 'open');
  if (scroller) scroller.scrollTop = top;
}

function _updateStage(epNum, idx) {
  const el = document.getElementById('lt-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trEndgame) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _stage(state, idx);
}

/** Bring the new card into view, UNDER the chairs rather than behind them. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('lt-stage-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 22;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trEndgameRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('lt-step-' + suffix + '-' + st.idx));
  _updateStage(epNum, st.idx);
}

export function trEndgameRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateStage(epNum, st.idx);
}

// Collapse/expand the sticky stage — the same convenience the breakfast table
// has. The collapsed flag lives on the persistent stage state so it survives
// the innerHTML rewrites `_updateStage` does on every reveal.
export function trEndgameToggleStage(suffix, total, epNum) {
  const el = document.getElementById('lt-stage-inner');
  const store = (typeof window !== 'undefined' && window.__trEndgame) || {};
  const state = store[epNum];
  if (!el || !state) return;
  state.collapsed = !state.collapsed;
  el.classList.toggle('lt-collapsed', state.collapsed);
  const st = _tvState[_key(epNum)];
  _updateStage(epNum, st ? st.idx : 0);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildEndgame(ep, observer)` — the secret choice, the loop, and the money.
 *
 * `ep` is the LAST `episodeHistory` row a Traitors season writes; `tr.endgame`
 * is attached there by `playTraitorsSeason` in js/tr/headless.js, because the
 * endgame is a phase rather than a night -- it can force six extra tables or
 * none at all, and when the first ask is unanimous there is no row for it to
 * live on. `observer` is `'audience'` or `'player:<Name>'`; see `_view` for
 * exactly what the difference is.
 */
export function rpBuildEndgame(ep, observer = 'audience') {
  const suffix = 'endgame';
  const vars = '--lt-grain-src:' + _noiseTile('0.9', 4, 43, 0.3, 210) + ';';
  const css = '<style>' + LT_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  if (!v) {
    return '<div class="lt-root" style="' + vars + '">' + css
      + '<div class="lt-shell" data-phase="open">'
      + '<div class="lt-scenery" aria-hidden="true">'
      + '<div class="lt-stone"></div>'
      + '<div class="lt-far">' + _roomFar() + '</div>'
      + '<div class="lt-air">' + _air('none') + '</div>'
      + '<div class="lt-vig"></div><div class="lt-grain"></div></div>'
      + '<div class="lt-body"><div class="lt-none">'
      + _ic('cold', 84, 'rgba(143,162,182,.34)')
      + '<div class="lt-none-h">The Game Is Still Running</div>'
      + '<p>Nobody has been asked the last question yet. The castle still has people in '
      + 'it who are being accused of things, and the strongbox is still shut.</p>'
      + '</div></div></div></div>';
  }

  const beats = _buildBeats(v);
  const total = beats.length;
  const epNum = ep.num || v.ep || 0;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta), epNum, collapsed: false };
  if (typeof window !== 'undefined') {
    window.__trEndgame = window.__trEndgame || {};
    window.__trEndgame[epNum] = state;
  }

  const observerBadge = v.isAudience
    ? '<div class="lt-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; every slip, read out to you and to nobody in the '
      + 'room; not one person at that table can see it like this</em></div>'
    : '<div class="lt-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; ' + (v.present
        ? 'your own word, and a row of folded paper you will never open'
        : 'you were already out of the castle; you learn what everybody else learned, '
          + 'which is the total and the money')
      + '</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED — the Round Table's
  // pattern, and the reason the conclave shipped a screen that was blank
  // until it was clicked.
  const stream = beats.map((b, i) =>
    '<div class="lt-beat' + (i <= st.idx ? ' lt-vis' : '')
    + '" id="lt-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="lt-root" style="' + vars + '">' + css
    + '<div class="lt-shell" id="lt-shell-' + suffix + '"'
    + ' data-phase="' + beats[0].phase + '">'
    + '<div class="lt-scenery" aria-hidden="true">'
    + '<div class="lt-stone"></div>'
    + '<div class="lt-far">' + _roomFar() + '</div>'
    + '<div class="lt-mid">' + _roomMid(epNum + '|' + v.room.length, v.room.length) + '</div>'
    + '<div class="lt-fore">' + _roomFore() + '</div>'
    + '<div class="lt-air">' + _air(epNum) + '</div>'
    + '<div class="lt-wash"></div>'
    + '<div class="lt-vig"></div>'
    + '<div class="lt-grain"></div>'
    + '</div>'
    + '<div class="lt-body">'
    + '<div class="lt-hero">' + _heroScene(v.room.length)
    + '<div class="lt-hero-lock">'
    // TASK 7: "Night 9" and not "Season I - Night IX" — the episode record
    // carries no season number, and the other five screens say so too.
    + '<div class="lt-eyebrow">The Traitors &middot; Night ' + (v.ep || epNum)
    + ' &middot; The Last Question</div>'
    + '<h1 class="lt-title">THE ENDGAME</h1>'
    + '<div class="lt-title-rule"><i></i>' + _ic('slip', 34, '#cdd4dc') + '<i></i></div>'
    + '<p class="lt-sub">One word each, folded and handed back. Every hand in the room has '
    + 'to agree before it stops &mdash; and from here nobody who leaves is ever turned '
    + 'over, so whatever is decided is decided blind.</p>'
    + '</div></div>'
    + '<header class="lt-head">' + observerBadge + '</header>'
    // THE CHAIRS, STUCK UNDER THE NAV. Sticky element AND the element the
    // reveal handlers replace by id.
    + '<div class="lt-stage" id="lt-stage-inner">' + _stage(state, st.idx) + '</div>'
    + '<main class="lt-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="lt-controls" id="lt-controls-' + suffix + '">'
    + '<button class="lt-btn" onclick="' + call('trEndgameRevealNext') + '">'
    + _ic('chevron', 12) + 'Continue</button>'
    + '<span class="lt-counter" id="lt-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="lt-btn" onclick="' + call('trEndgameRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
