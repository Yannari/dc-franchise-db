// ══════════════════════════════════════════════════════════════════════
// vp-tr/castle-day.js — the day the castle actually spent, as a weave
// ══════════════════════════════════════════════════════════════════════
//
// Plan 5 built 106 castle events across eight families and seven windows and
// not one of them has ever been on a screen. This is the show's equivalent of
// Total Drama's camp events and it carries the entire social layer: who was
// trusted, who was doubted, who was mourned, who was covering, who fell in
// with whom, what a shared history dragged back up, who was being tested, and
// what the road did to all of it.
//
// ── THE UNIT IS THE THREAD, NOT THE SCENE ─────────────────────────────
//
// That plan's whole thesis was CONTINUATION OVER NOVELTY — stories that
// accumulate rather than forty unconnected incidents — and it spent eight
// tasks and two amendments getting there. A screen that draws today's scenes
// as a flat list has thrown all of it away and would look, from the outside,
// exactly like a screen that had not.
//
// So the thread is the primitive here, and it is drawn as one. Every scene
// hangs off a coloured cord in its family's colour; a cord that was already
// running enters the card from ABOVE and carries the days it has been running
// since; a cord that ends tonight is knotted off with what it came to. The
// engine already writes the continuity, in `citeMoments` — "It went back to
// day 2 — … — and it did not stop there: day 4" — and `_castleRecord`
// (js/tr/headless.js) splits that sentence back off the beat so it can be
// drawn as a citation instead of buried in a paragraph.
//
// AND THE HONEST SHAPE OF THE DATA IS DESIGNED FOR. 73.9% of threads die at
// their first beat and only 11.2% ever reach a payoff. So the SHORT thread is
// the case this screen is built around: one knot on a cord that goes nowhere
// is drawn as a complete thing, not as a stub of something missing. The
// ten-beat cover story that ran across six days of the dump is the flourish
// on top, not the layout the page assumes.
//
// ── WHAT IS SHARED AND WHAT IS THIS SCREEN'S OWN ──────────────────────
//
// SHARED: the type system (Fraunces 900 display, IM Fell English for anything
// spoken or quoted, Cormorant Garamond for body), the NEUTRAL `_portrait()`
// (`.cv-lit` is the turret's alone), `_icon()` for objects that must be the
// same drawing everywhere, the reveal machinery, the sticky-stage
// architecture, `TR_NAV_H`/`TR_STICKY_TOP`, and the rule that nothing writes a
// host name or an exit word as a literal.
//
// ITS OWN, and every departure is the same departure — THIS IS THE ONLY
// SCREEN THAT HAPPENS IN DAYLIGHT, INDOORS, WITH THE CASTLE AT WORK:
//
//   THE LIGHT MOVES, AND IT IS THE ONLY CLOCK. Six screens hold one hour for
//   their whole length. This one runs from before sunrise to after midnight,
//   so the shaft coming through the high windows CHANGES ANGLE AND COLOUR with
//   the window being drawn — cold and low at dawn, white and vertical over the
//   road, long and amber in the evening, gone by night. Nothing else in the
//   set has a sun in it.
//
//   THE PRIMITIVE IS A LOOM. The turret has cloaks, the hall a ring, the
//   morning a laid table, the book a page, the estate a rope, the corridor a
//   rectangle of moonlight. A castle day is a working room, and the thing this
//   screen is about is a thread — so the sticky stage is a warp of cords, one
//   per story live today, gaining a bead per beat as the reveals run.
//
//   CARDS SWING IN ON THEIR CORD. They are hung, not dealt: the pivot is the
//   top-left corner where the cord attaches, and a card settles from a small
//   rotation rather than travelling across the page.
//
//   PREFIX IS `dy-`. Checked against the whole repo first, which is a step
//   three earlier tasks each had to take: Task 3 moved off `hs-` (owned by
//   hide-and-be-sneaky), Task 4 found `rc-` taken and `ms-` colliding with the
//   `-ms-` vendor prefixes, Task 5 found `eg-` owned by walk-like-an-egyptian.
//   `dy-` is used by nothing.
//
// ── THE OBSERVER CONTRACT, WHICH DOES REAL WORK HERE ──────────────────
//
// See `_view`. In one line: the audience sees the day; a player sees the
// scenes they were in, hears the ones that happened in a room the whole
// castle was in, and gets NOTHING from the night. And the thing withheld from
// an overheard scene is the THREAD — you saw two people talking and you do
// not know what it was about or how long it had been going on, which is the
// most Traitors sentence this screen can make its layers say.
//
// Like every other file in this directory it imports no engine state.
import { seasonConfig, players } from '../core.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { PORTRAIT_CSS, TR_NAV_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';

const TR = 'traitors';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── deterministic picking ─────────────────────────────────────────────
//
// SEEDED OFF `tr.ep` AND NEVER OFF `num`. Task 6 found five screens seeding
// their host lines off the VP's key, so the transcript — which renders a
// RENUMBERED COPY of the row to avoid touching live reveal state — quoted
// lines the screen had never spoken. `num` is the key; `tr.ep` is the fact.
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
/** A face in the daylight, and it is NEUTRAL — `.cv-lit` is the turret's. */
function _av(name, size) {
  return _portrait(_slugOf(name), name, size || 34);
}
function _hostAv(size) {
  const h = _host();
  return _portrait(h.slug, h.name, size || 48);
}

// ══════════════════════════════════════════════════════════════════════
// THE EIGHT FAMILIES, AS EIGHT COLOURS
// ══════════════════════════════════════════════════════════════════════
//
// This is the only screen in the set with a colour SYSTEM rather than a
// palette, and the reason is structural: eight families run at once and a
// reader has to be able to tell at a glance that the cord on this card is the
// cord on that one, four hours and two windows apart. Colour is the only
// channel that survives that distance.
//
// KEYED ON THE EVENT'S FAMILY FIRST AND THE THREAD'S KIND SECOND, because the
// two disagree: romance.js registers with `family: 'romance'` and opens
// threads of kind `romance-spark`. An unknown key falls to `unspun`, which is
// a real colour and not a crash — a screen that throws on a family somebody
// adds next year is a screen that gets deleted.
const FAMILIES = {
  trust: { label: 'Trust', colour: '#8fbf9a',
    gloss: 'somebody decided to put weight on somebody else' },
  suspicion: { label: 'Suspicion', colour: '#d0576b',
    gloss: 'somebody started keeping a list' },
  grief: { label: 'Grief', colour: '#94a0cc',
    gloss: 'the room counted itself and did not like the answer' },
  cover: { label: 'Cover', colour: '#d2a44e',
    gloss: 'somebody spent the day being ordinary on purpose' },
  romance: { label: 'Romance', colour: '#dc95b4',
    gloss: 'two people found the day easier than it was' },
  'romance-spark': { label: 'Romance', colour: '#dc95b4',
    gloss: 'two people found the day easier than it was' },
  callback: { label: 'History', colour: '#ac8fc8',
    gloss: 'something from before this place walked back in' },
  testing: { label: 'Testing', colour: '#5fb6c0',
    gloss: 'somebody set a small trap and watched it' },
  journey: { label: 'The Road', colour: '#d9834f',
    gloss: 'an hour of walking with nothing to do but talk' },
  unspun: { label: 'The Castle', colour: '#b6ac96',
    gloss: 'a thing that happened, in a place where things happen' },
};
function _fam(scene) {
  return FAMILIES[scene.family] || FAMILIES[scene.kind] || FAMILIES.unspun;
}

// ══════════════════════════════════════════════════════════════════════
// THE SEVEN HOURS
// ══════════════════════════════════════════════════════════════════════
//
// FOUR LINES EACH, MINIMUM, and they are hours rather than headings: an hour
// plate says what KIND of hour it is, so a scene under it reads as having
// happened somewhere. `sun` is where the light is and it drives the whole
// screen's atmosphere — see `.dy-shell[data-phase]`.
const HOURS = {
  dawn: { label: 'Dawn', sun: 'dawn', lines: [
    'The light comes up on whoever did not sleep, and it is never the people who say they did.',
    'First light through the east windows, and a room that has to find out what the night cost.',
    'Cold light, cold flags, and the first thing anybody says today.',
    'The hour the castle finds out how many of it there are.',
  ] },
  morning: { label: 'Morning', sun: 'morning', lines: [
    'The castle at work — bread, water, wood — and everything anybody says over the top of it.',
    'Chores, and the excellent cover chores give a conversation nobody wants overheard.',
    'A working morning. Nobody is idle and nobody is only doing what they look like they are doing.',
    'The long stretch before the road, spent in twos, in doorways, over jobs.',
  ] },
  'journey-out': { label: 'The Road Out', sun: 'noon', lines: [
    'An hour of walking away from the castle with nothing to do but talk.',
    'Out along the track in ones and twos, and who falls in beside whom is never nothing.',
    'The column leaves. It is shorter than it was, and everybody counts it.',
    'Open ground, no walls, and the first honest conversation some of them have had all week.',
  ] },
  'journey-back': { label: 'The Road Back', sun: 'afternoon', lines: [
    'The same road, carrying whatever the afternoon put on them.',
    'Home in the low light, tired, and tired is when people say the thing.',
    'The walk back, and the last two hundred yards of it, which are never the same as the rest.',
    'Returning. The castle comes up out of the trees and the talking stops.',
  ] },
  evening: { label: 'Evening', sun: 'evening', lines: [
    'The hour before they all sit down, when the counting gets done out loud.',
    'Long shadows, low sun, and everybody deciding tonight before tonight starts.',
    'The last of the light, spent by everybody working out where everybody else stands.',
    'Evening, and the arithmetic. Nobody is talking about anything else.',
  ] },
  'after-table': { label: 'After The Table', sun: 'dusk', lines: [
    'A chair is empty and the room is still standing in the shape it left.',
    'The doors close behind them and nobody quite knows where to put themselves.',
    'Straight afterwards, before anybody has decided what they think about it.',
    'The hour with a hole in it. Whatever gets said now, gets said too fast.',
  ] },
  night: { label: 'Night', sun: 'night', lines: [
    'Doors shut. Nobody in the castle is asleep who says they are.',
    'Dark corridors, thin walls, and everybody listening to the building.',
    'The hour the castle belongs to whoever is still awake in it.',
    'Night, and every noise in a stone building is somebody.',
  ] },
};
function _hour(w) {
  return HOURS[w] || { label: String(w || 'The Day'), sun: 'noon',
    lines: ['An hour of the day, and the castle spent it the way it spends them.'] };
}

// ── how a beat's position gets said out loud ──────────────────────────
const OPENING_TAG = ['A new thread', 'Cast on', 'Something starts', 'First knot'];
const CARRIED_TAG = ['Still running', 'Picked back up', 'The same thread', 'Carried over'];
const CLOSING_TAG = ['Knotted off', 'The end of it', 'Paid off', 'Cut'];

/** What a closed thread's outcome MEANS, in the show's own terms. */
const SENSE_WORDS = {
  walked: { word: 'Walked away from it',
    gloss: 'the scrutiny arrived and they came out the other side of it' },
  cracked: { word: 'Something came out',
    gloss: 'the scrutiny arrived and it got something out of them' },
  coupled: { word: 'Settled, one way or the other',
    gloss: 'it was a romance and it resolved as one' },
};
/** The eleven outcome strings, in words a viewer has any use for. */
// THE SUBJECT IS ALWAYS "THEY", so every phrase here is PLURAL. The first
// version was written third-person singular and the screen printed "They
// denied it, and was believed" — found by rendering a day and reading it,
// which is how every prose defect in eight plans has been found and none by
// an assertion.
const OUTCOME_WORDS = {
  'denied-convincingly': 'denied it, and were believed',
  'passed-clean': 'came through it with nothing on them',
  'defended-by-history': 'were vouched for by somebody who knew them before all this',
  'turned-back': 'turned it round on whoever started it',
  buried: 'buried it, and it stayed buried',
  'confessed-unrelated': 'admitted to something else entirely',
  'test-exposed': 'failed the test in front of the person setting it',
  'failed-maliciously': 'failed it, and meant to',
  exposed: 'were found out',
  'became-showmance': 'stopped pretending it was nothing',
  'broken-up': 'ended it, badly',
};

// ══════════════════════════════════════════════════════════════════════
// ICONS — this room's own objects, hand-drawn, never emoji
// ══════════════════════════════════════════════════════════════════════
//
// The seal, the eye, the cloak, the door and the hourglass come from
// `_icon()` in conclave.js and are NOT redrawn here: they are the same
// objects on every screen in this directory. These four exist because a
// working room contains them and nothing else in the set does.
function _ic(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    // A SPOOL, on its side, with a tail of thread coming off it.
    spool: '<path d="M5.2 4.4h13.6M5.2 19.6h13.6" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round"/>'
      + '<path d="M8.4 4.4v15.2M15.6 4.4v15.2" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M8.4 8.6h7.2M8.4 12h7.2M8.4 15.4h7.2" stroke="' + c + '" stroke-width="1" opacity=".6"/>'
      + '<path d="M15.6 12c3 0 3.6 2.4 5.4 3.2" stroke="' + c + '" stroke-width="1.2" stroke-linecap="round"/>',
    // A NEEDLE with the thread through the eye of it.
    needle: '<path d="M4.2 20.2 18.6 5.2" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round"/>'
      + '<path d="M17.2 6.6 20.4 3.4" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>'
      + '<ellipse cx="16.1" cy="7.7" rx="1.5" ry="0.9" transform="rotate(-46 16.1 7.7)" stroke="' + c + '" stroke-width="1"/>'
      + '<path d="M15.2 8.6c-2.8 1.4-3.4 3.6-1.4 5.2" stroke="' + c + '" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>',
    // A KNOT — an overhand, drawn as two crossings and two tails.
    knot: '<path d="M3.4 15.6c3.6 0 4-6.6 8-6.6s4.4 6.6 8 6.6" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round"/>'
      + '<path d="M3.4 8.4c3.6 0 4 6.6 8 6.6s4.4-6.6 8-6.6" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round" opacity=".72"/>',
    // A PAIR OF SHEARS, for a thread that ends tonight.
    shears: '<circle cx="5.6" cy="18.4" r="2.4" stroke="' + c + '" stroke-width="1.3"/>'
      + '<circle cx="14.4" cy="18.4" r="2.4" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M7.4 16.8 19.6 3.6M12.6 16.8 6.2 9.4" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round"/>',
    // A SUN, low. The hour plates carry it and it is drawn once.
    sun: '<circle cx="12" cy="12" r="4.4" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M12 2.6v2.8M12 18.6v2.8M2.6 12h2.8M18.6 12h2.8M5.3 5.3l2 2M16.7 16.7l2 2M18.7 5.3l-2 2M7.3 16.7l-2 2" stroke="' + c + '" stroke-width="1.2" stroke-linecap="round"/>',
    // A MOON for the hour that has no sun in it.
    moon: '<path d="M19.4 15.4A8.2 8.2 0 0 1 8.6 4.6a8.4 8.4 0 1 0 10.8 10.8z" stroke="' + c + '" stroke-width="1.4" stroke-linejoin="round"/>',
    ear: '<path d="M7.6 9.4a4.6 4.6 0 0 1 9.2 0c0 3-2.2 3.8-2.2 6.2 0 2-1.4 3.4-3 3.4s-2.6-1-2.6-2.6" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round"/>'
      + '<path d="M11 9.8a1.4 1.4 0 0 1 2.8 0c0 1.4-1.4 1.6-1.4 3" stroke="' + c + '" stroke-width="1.2" stroke-linecap="round"/>',
    chevron: '<path d="M9 5.4 16 12l-7 6.6" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE ROOM — a working hall with high windows and a loom in the corner
// ══════════════════════════════════════════════════════════════════════
//
// Three planes, and the one that matters is the middle one: THE SHAFT. Every
// other screen in this set has a fixed light. This one's moves — the shaft's
// angle, length and colour are driven by `data-phase` on the shell, so the
// page is visibly at a different time of day under each hour plate.

/** The far plane: piers, three tall windows, the vault above them. */
function _hallFar() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="dyWall" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#2a261e"/><stop offset="52%" stop-color="#1d1a15"/>'
    + '<stop offset="100%" stop-color="#141210"/>'
    + '</linearGradient>'
    + '<linearGradient id="dyPane" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#f4e8c6" stop-opacity=".44"/>'
    + '<stop offset="100%" stop-color="#e2c992" stop-opacity=".12"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#dyWall)"/>'
    // the vault
    + '<path d="M0 0h1100v210c-206-96-388-142-550-142S206 114 0 210z" fill="#171410"/>'
    + '<path d="M0 196c206-92 388-138 550-138s344 46 550 138" fill="none" stroke="#3a3327" stroke-width="4" opacity=".7"/>'
    // three lancets, and the light is behind them
    + _lancets()
    // piers
    + '<path d="M96 208h44v1292H96z" fill="#211d17"/>'
    + '<path d="M406 208h40v1292h-40z" fill="#1e1a15"/>'
    + '<path d="M660 208h40v1292h-40z" fill="#1e1a15"/>'
    + '<path d="M962 208h44v1292h-44z" fill="#211d17"/>'
    // course lines in the stone
    + _courses()
    + '</svg>';
}
function _lancets() {
  let s = '<g class="dy-panes">';
  const xs = [[214, 150], [508, 150], [802, 150]];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i][0], w = xs[i][1];
    const top = 300, h = 540;
    s += '<path d="M' + x + ' ' + (top + h) + 'V' + (top + 78)
      + 'a' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + w + ' 0v' + (h - 78) + 'z" fill="url(#dyPane)"/>';
    s += '<path d="M' + x + ' ' + (top + h) + 'V' + (top + 78)
      + 'a' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + w + ' 0v' + (h - 78) + 'z"'
      + ' fill="none" stroke="#141210" stroke-width="11"/>';
    // mullion and transoms
    s += '<path d="M' + (x + w / 2) + ' ' + (top + 24) + 'v' + (h - 24)
      + 'M' + x + ' ' + (top + 250) + 'h' + w + 'M' + x + ' ' + (top + 400) + 'h' + w
      + '" stroke="#141210" stroke-width="7"/>';
  }
  return s + '</g>';
}
function _courses() {
  let s = '<g opacity=".34">';
  for (let i = 0; i < 22; i++) {
    const y = 240 + i * 58;
    s += '<path d="M0 ' + y + 'h1100" stroke="#3b3327" stroke-width="1.6"/>';
  }
  return s + '</g>';
}

/**
 * The mid plane: the floor, THE SHAFT, and the dust in it.
 *
 * The shaft is three overlapping quadrilaterals — one per window — and it is
 * a `<g>` with a class, because the whole thing is skewed and recoloured by
 * CSS off `data-phase`. Doing it in the markup would mean rebuilding the
 * scenery on every reveal, which is exactly the full-page rebuild every screen
 * in this directory refuses to do.
 */
function _hallMid(seed) {
  const rng = _fieldRng('dy|mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="dyShaft" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#ffeec4" stop-opacity=".5"/>'
    + '<stop offset="62%" stop-color="#ffe2a6" stop-opacity=".15"/>'
    + '<stop offset="100%" stop-color="#ffe2a6" stop-opacity="0"/>'
    + '</linearGradient>'
    + '<linearGradient id="dyFloor" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#241f18"/><stop offset="100%" stop-color="#100e0c"/>'
    + '</linearGradient></defs>'
    + '<path d="M0 1040h1100v460H0z" fill="url(#dyFloor)"/>';
  for (let i = 0; i < 8; i++) {
    const y = 1040 + i * 58;
    s += '<path d="M0 ' + y + 'h1100" stroke="#332c22" stroke-width="1.4" opacity=".6"/>';
  }
  // THE SHAFT. One per window, skewed as a group by the phase.
  s += '<g class="dy-shaft">';
  for (const x of [214, 508, 802]) {
    s += '<path d="M' + x + ' 320 L' + (x + 150) + ' 320 L' + (x + 330) + ' 1500 L'
      + (x - 180) + ' 1500 Z" fill="url(#dyShaft)"/>';
  }
  s += '</g>';
  // dust, and there is a great deal of it, because somebody has been sweeping
  for (let i = 0; i < 46; i++) {
    s += '<circle class="dy-mote" cx="' + (60 + rng() * 980).toFixed(0) + '" cy="'
      + (330 + rng() * 1050).toFixed(0) + '" r="' + (0.9 + rng() * 1.9).toFixed(1)
      + '" fill="#ffeec4" opacity="' + (0.12 + rng() * 0.3).toFixed(2)
      + '" style="animation-duration:' + (17 + rng() * 21).toFixed(1)
      + 's;animation-delay:' + (-rng() * 30).toFixed(1) + 's"/>';
  }
  return s + '</svg>';
}

/** The fore plane: the near arch, and the loose warp hanging in front of it. */
function _hallFore() {
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<path d="M0 0h1100v96c-190 40-360 60-550 60S190 136 0 96z" fill="#0d0b09"/>'
    + '<path d="M0 0h150v1500H0z" fill="#0d0b09" opacity=".92"/>'
    + '<path d="M950 0h150v1500H950z" fill="#0d0b09" opacity=".92"/>';
  // THE LOOSE WARP. Eight cords in the eight family colours, hanging down the
  // right-hand pier, moving very slightly. Nothing else on the screen is this.
  const cols = ['#8fbf9a', '#d0576b', '#94a0cc', '#d2a44e', '#dc95b4', '#ac8fc8', '#5fb6c0', '#d9834f'];
  s += '<g class="dy-warp">';
  for (let i = 0; i < cols.length; i++) {
    const x = 1006 + i * 10;
    s += '<path class="dy-cord" d="M' + x + ' 96 q' + (i % 2 ? 8 : -8) + ' 300 0 620 q'
      + (i % 2 ? -6 : 6) + ' 280 0 540" stroke="' + cols[i]
      + '" stroke-width="2" fill="none" opacity=".3" style="animation-delay:'
      + (-i * 1.7).toFixed(1) + 's"/>';
  }
  return s + '</g></svg>';
}

/**
 * The hero plate: a loom with part-woven cloth on it, in the window light.
 *
 * NOT A ROOM AND NOT A CROWD. Every other hero in this set is a place or a
 * pair of people. This one is an OBJECT, close up, because the screen's claim
 * is about a mechanism — stories that accumulate — and a mechanism is best
 * argued by showing the machine.
 */
function _heroScene(threadCount) {
  const cols = ['#8fbf9a', '#d0576b', '#94a0cc', '#d2a44e', '#dc95b4', '#ac8fc8', '#5fb6c0', '#d9834f'];
  let s = '<svg class="dy-hero-scene" viewBox="0 0 1100 470" preserveAspectRatio="xMidYMid slice">'
    + '<defs><linearGradient id="dyHeroBg" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#332c22"/><stop offset="62%" stop-color="#1e1a15"/>'
    + '<stop offset="100%" stop-color="#100e0c"/></linearGradient>'
    + '<linearGradient id="dyHeroLight" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0%" stop-color="#ffeec4" stop-opacity=".34"/>'
    + '<stop offset="60%" stop-color="#ffe2a6" stop-opacity=".05"/>'
    + '<stop offset="100%" stop-color="#ffe2a6" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="dyHeroScrim" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#100e0c" stop-opacity="0"/>'
    + '<stop offset="100%" stop-color="#100e0c" stop-opacity=".93"/></linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="470" fill="url(#dyHeroBg)"/>'
    // light coming in from the upper left, with edges
    + '<path d="M0 0 L340 0 L640 470 L0 470 Z" fill="url(#dyHeroLight)"/>';
  // THE LOOM, off to the right so the centred lockup has somewhere to sit.
  // (Task 4's lesson: the first mission hero put its object dead centre and it
  // read as three faint diagonals behind the title.)
  s += '<g transform="translate(96,0)">'
    // uprights and beams
    + '<path d="M690 40h22v420h-22zM1006 40h22v420h-22z" fill="#2f281e"/>'
    + '<path d="M676 40h366v20H676zM676 250h366v16H676z" fill="#3a3025"/>';
  // the warp: vertical threads between the beams
  for (let i = 0; i < 26; i++) {
    const x = 700 + i * 13;
    s += '<path d="M' + x + ' 60v190" stroke="#6a5c46" stroke-width="1.6" opacity=".8"/>';
  }
  // the woven part: bands of colour, one per family, thickest where the day
  // actually spent its threads
  for (let i = 0; i < cols.length; i++) {
    const y = 60 + i * 22;
    const w = 60 + ((threadCount + i * 3) % 7) * 38;
    s += '<path d="M700 ' + y + 'h' + Math.min(w, 336) + 'v14H700z" fill="' + cols[i]
      + '" opacity="' + (0.5 + (i % 3) * 0.14).toFixed(2) + '"/>';
  }
  // loose ends hanging off the bottom beam
  for (let i = 0; i < cols.length; i++) {
    const x = 706 + i * 40;
    s += '<path class="dy-cord" d="M' + x + ' 266 q' + (i % 2 ? 10 : -10) + ' 90 2 176"'
      + ' stroke="' + cols[i] + '" stroke-width="2.4" fill="none" opacity=".62"'
      + ' style="animation-delay:' + (-i * 1.3).toFixed(1) + 's"/>';
  }
  // a shuttle resting on the cloth
  s += '<path d="M712 176 L804 168 L816 186 L804 204 L712 196 Z" fill="#4a3d2c" stroke="#6d5c42" stroke-width="2"/>'
    + '<path d="M736 178h56v14h-56z" fill="#d2a44e" opacity=".8"/>'
    + '</g>'
    // THE LEFT THIRD WAS AN EMPTY GRADIENT. A basket of wound spools on the
    // flags, low and left, where the centred lockup is not — the same
    // correction Task 4's mission hero needed after being rendered and looked
    // at.
    + '<g transform="translate(60,236)">'
    + '<path d="M0 122 L24 42 L188 42 L212 122 Z" fill="#3b3025" stroke="#5b4a35" stroke-width="3"/>'
    + '<path d="M18 60h176M12 82h188M6 104h200" stroke="#5b4a35" stroke-width="2" opacity=".7"/>'
    + _spools()
    + '</g>'
    + '<rect y="150" width="1100" height="320" fill="url(#dyHeroScrim)"/>'
    + '</svg>';
  return s;
}

/** Wound spools sitting in the basket, one per family. */
function _spools() {
  const cols = ['#8fbf9a', '#d0576b', '#94a0cc', '#d2a44e', '#dc95b4', '#ac8fc8'];
  let s = '<g>';
  for (let i = 0; i < cols.length; i++) {
    const x = 26 + (i % 3) * 62 + (i > 2 ? 18 : 0);
    const y = i > 2 ? 4 : 46;
    s += '<ellipse cx="' + x + '" cy="' + y + '" rx="26" ry="20" fill="' + cols[i]
      + '" opacity=".76"/>'
      + '<ellipse cx="' + x + '" cy="' + (y - 5) + '" rx="26" ry="20" fill="none" stroke="'
      + cols[i] + '" stroke-width="2" opacity=".5"/>'
      + '<ellipse cx="' + x + '" cy="' + y + '" rx="8" ry="6" fill="#241f18" opacity=".7"/>';
  }
  return s + '</g>';
}

/** The filter bank. */
function _filters() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="dyFibre" x="-3%" y="-3%" width="106%" height="106%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="3" seed="23" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '</defs></svg>';
}

// ══════════════════════════════════════════════════════════════════════
// THE VISUAL SYSTEM
// ══════════════════════════════════════════════════════════════════════
const DY_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.dy-root{
  --dy-ground:#24211b;
  --dy-ground-deep:#151310;
  --dy-stone:#3a3327;
  --dy-day:#ffeec4;
  --dy-oak:#6d5c42;
  --dy-brass:#c8a24a;
  --dy-brass-hot:#f4dda2;
  --dy-ink:#ece3d0;
  --dy-display:'Fraunces',Georgia,'Times New Roman',serif;
  --dy-hand:'IM Fell English',Georgia,serif;
  --dy-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  --cv-display:'Fraunces',Georgia,serif;
  color:var(--dy-ink);
  font-family:var(--dy-body);
  font-size:17px;line-height:1.62;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#0a0908;
}
.dy-root *{box-sizing:border-box}

.dy-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--dy-ground);
  box-shadow:0 0 0 1px rgba(255,238,196,.09),0 0 90px rgba(0,0,0,.9);
  overflow:visible;
  transition:background 1.8s ease;
}
/* THE CLIP LAYER, AND IT TAKES NO z-index — measured on the conclave: a shell
   that clips is a scroll container and kills sticky for every descendant, and
   a z-index here makes this a stacking context and re-grades every blend. */
.dy-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

/* THE WALL RUNS THE WHOLE PAGE AND THE HALL SITS AT THE TOP OF IT.
   The drawn planes are 2200px and a busy day runs past four thousand, so
   below the hall the first version was a flat brown gradient for half the
   screen — the same defect Task 5's endgame was rejected for ("really black
   and empty"), which is a place stopping rather than a place being dark.
   Coursed masonry repeats by nature, so it is drawn as a repeat over the FULL
   height: the hall is what you can see from where you are standing and this
   is the wall behind you for the rest of it. */
.dy-stone{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;z-index:0;pointer-events:none;
  opacity:.64;
  background-image:
    repeating-linear-gradient(180deg,rgba(59,51,39,.7) 0 2px,transparent 2px 58px),
    repeating-linear-gradient(90deg,rgba(59,51,39,.42) 0 2px,transparent 2px 184px);
}
/* AND THE WARP FALLS THE WHOLE WAY DOWN IT. Eight cords in the eight family
   colours, hanging past the bottom of the drawn loom — the screen's own
   primitive, running for the full height of whatever day this turns out to
   be. Simple vertical rules, which is the one thing CSS is allowed to draw
   here; everything with a shape in it is SVG. */
.dy-warpfall{
  position:absolute;right:0;width:118px;top:${TR_NAV_TOP};bottom:0;z-index:0;
  pointer-events:none;opacity:.3;
  background-image:linear-gradient(90deg,
    transparent 0 6px,#8fbf9a 6px 8px,transparent 8px 20px,
    #d0576b 20px 22px,transparent 22px 34px,
    #94a0cc 34px 36px,transparent 36px 48px,
    #d2a44e 48px 50px,transparent 50px 62px,
    #dc95b4 62px 64px,transparent 64px 76px,
    #ac8fc8 76px 78px,transparent 78px 90px,
    #5fb6c0 90px 92px,transparent 92px 104px,
    #d9834f 104px 106px,transparent 106px);
}
.dy-far,.dy-mid,.dy-fore{
  position:absolute;left:0;right:0;top:${TR_NAV_TOP};height:2200px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.dy-wash,.dy-vig,.dy-grain{position:absolute;left:0;right:0;top:${TR_NAV_TOP};bottom:0;pointer-events:none}
.dy-far svg,.dy-mid svg,.dy-fore svg{position:absolute;inset:0;width:100%;height:100%}
/* DARKER AND SOFTER THAN IT WAS. The first pass ran the three lancets at
   full brightness directly behind the first cards and the top of the page
   read as fog rather than as a lit room -- found by rendering it. */
.dy-far {z-index:0;filter:blur(3.2px) saturate(.7) brightness(.6);opacity:.62}
.dy-mid {z-index:1;filter:blur(.5px) brightness(.8);opacity:.8}
.dy-fore{z-index:2}
.dy-wash{z-index:3}
.dy-vig {z-index:4}
.dy-grain{z-index:9}
.dy-body{position:relative;z-index:5}
.dy-far::after,.dy-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:520px;
  background:linear-gradient(180deg,transparent,rgba(36,33,27,.9));
}
.dy-wash{
  mix-blend-mode:screen;opacity:.3;
  background:radial-gradient(58% 30% at 34% 20%,rgba(255,238,196,.2) 0%,transparent 66%);
  transition:opacity 1.6s ease,background 1.6s ease;
}
.dy-vig{
  background:
    radial-gradient(122% 84% at 44% 22%,transparent 0%,transparent 30%,rgba(10,8,6,.5) 70%,rgba(10,8,6,.9) 100%),
    linear-gradient(180deg,rgba(10,8,6,.5) 0%,transparent 14%,transparent 88%,rgba(10,8,6,.6) 100%);
  mix-blend-mode:multiply;
}
.dy-grain{
  opacity:.13;mix-blend-mode:soft-light;
  background-image:var(--dy-grain-src);background-size:230px 230px;
}

/* ── AMBIENT — dust, and cords that barely move ─────────────────────── */
.dy-mote{animation:dy-float ease-in-out infinite alternate}
@keyframes dy-float{
  0%{transform:translate(0,0);opacity:.14}
  100%{transform:translate(-13px,-26px);opacity:.42}
}
.dy-cord{transform-box:fill-box;transform-origin:50% 0;
  animation:dy-sway 19s ease-in-out infinite alternate}
@keyframes dy-sway{
  0%{transform:rotate(-.5deg)}
  100%{transform:rotate(.7deg)}
}
/* THE SHAFT MOVES WITH THE HOUR, and it is this screen's clock. Skew is the
   sun's angle, opacity is how much of it there is. Nothing else in the set
   changes the light between one card and the next. */
.dy-shaft{transform-box:fill-box;transform-origin:50% 0;
  transition:transform 2.2s ease,opacity 2.2s ease}

/* ── THE HOURS, AS ATMOSPHERE ───────────────────────────────────────── */
.dy-shell[data-phase="dawn"]{background:#20211f}
.dy-shell[data-phase="dawn"] .dy-shaft{transform:skewX(-19deg) scaleY(1.06);opacity:.5}
.dy-shell[data-phase="dawn"] .dy-wash{opacity:.3;
  background:radial-gradient(58% 30% at 22% 18%,rgba(178,204,224,.26) 0%,transparent 66%)}

.dy-shell[data-phase="morning"]{background:#262219}
.dy-shell[data-phase="morning"] .dy-shaft{transform:skewX(-11deg);opacity:.6}
.dy-shell[data-phase="morning"] .dy-wash{opacity:.5}

.dy-shell[data-phase="noon"]{background:#2a251b}
.dy-shell[data-phase="noon"] .dy-shaft{transform:skewX(-1deg) scaleY(.88);opacity:.72}
.dy-shell[data-phase="noon"] .dy-wash{opacity:.62;
  background:radial-gradient(60% 32% at 50% 16%,rgba(255,246,220,.3) 0%,transparent 66%)}

.dy-shell[data-phase="afternoon"]{background:#282219}
.dy-shell[data-phase="afternoon"] .dy-shaft{transform:skewX(9deg);opacity:.58}
.dy-shell[data-phase="afternoon"] .dy-wash{opacity:.5;
  background:radial-gradient(58% 30% at 64% 20%,rgba(255,226,166,.28) 0%,transparent 66%)}

.dy-shell[data-phase="evening"]{background:#2a1f16}
.dy-shell[data-phase="evening"] .dy-shaft{transform:skewX(21deg) scaleY(1.14);opacity:.7}
.dy-shell[data-phase="evening"] .dy-wash{opacity:.56;
  background:radial-gradient(56% 28% at 76% 24%,rgba(232,150,74,.3) 0%,transparent 64%)}

.dy-shell[data-phase="dusk"]{background:#241b18}
.dy-shell[data-phase="dusk"] .dy-shaft{transform:skewX(27deg) scaleY(1.2);opacity:.34}
.dy-shell[data-phase="dusk"] .dy-wash{opacity:.4;
  background:radial-gradient(54% 26% at 80% 26%,rgba(198,96,72,.26) 0%,transparent 62%)}

.dy-shell[data-phase="night"]{background:#1b1c22}
.dy-shell[data-phase="night"] .dy-shaft{transform:skewX(30deg) scaleY(.5);opacity:.08}
.dy-shell[data-phase="night"] .dy-wash{opacity:.3;
  background:radial-gradient(50% 26% at 52% 16%,rgba(150,176,208,.2) 0%,transparent 62%)}

/* ═══ HERO PLATE ══════════════════════════════════════════════════════ */
.dy-hero{
  position:relative;height:470px;overflow:hidden;
  background:#100e0c;border-bottom:1px solid rgba(255,238,196,.15);
}
.dy-hero svg.dy-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.dy-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
.dy-eyebrow{
  font-family:var(--dy-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:rgba(236,227,208,.8);
  text-shadow:0 2px 12px rgba(0,0,0,.95);margin-bottom:2px;
}
/* THE LOCKUP. The same one the other seven use: Fraunces 900 squeezed to .80
   with a 1.3px stroke. Eight screens, one logo. */
.dy-title{
  display:inline-block;
  font-family:var(--dy-display);font-weight:900;
  font-size:clamp(32px,5.6vw,66px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:#f6eeda;margin:10px 0 0;
  text-shadow:0 4px 34px rgba(0,0,0,.95);
}
.dy-title-rule{display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 10px}
.dy-title-rule i{display:block;height:1px;width:96px;
  background:linear-gradient(90deg,transparent,rgba(236,227,208,.44))}
.dy-title-rule i:last-child{background:linear-gradient(270deg,transparent,rgba(236,227,208,.44))}
.dy-sub{
  font-family:var(--dy-hand);font-style:italic;font-size:18px;line-height:1.55;
  color:rgba(236,227,208,.84);max-width:620px;margin:0 auto;
  text-shadow:0 2px 14px rgba(0,0,0,.95);
}

/* ── OBSERVER STRIP ─────────────────────────────────────────────────── */
.dy-head{padding:16px 34px;border-bottom:1px solid rgba(255,238,196,.13);
  background:linear-gradient(180deg,rgba(16,14,12,.72),transparent)}
.dy-observer{
  display:flex;align-items:center;gap:10px;
  font-family:var(--dy-display);font-weight:600;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(236,227,208,.72);
}
.dy-observer em{font-family:var(--dy-body);font-style:italic;font-size:14px;
  letter-spacing:0;text-transform:none;color:rgba(236,227,208,.5)}

/* ═══ THE LOOM — the sticky stage, and it is the THREADS ══════════════
   Not a scoreboard and not a tally: one warp cord per story running in the
   castle today, with a bead per beat. It is the only sticky stage in the set
   whose rows can GROW during a screen, because a day can start a story. */
.dy-stage{position:sticky;top:${TR_NAV_TOP};z-index:12;
  background:rgba(16,14,12,.97);
  border-bottom:1px solid rgba(255,238,196,.2);
  padding:11px 20px 13px;backdrop-filter:blur(6px)}
.dy-loom-h{
  display:flex;align-items:baseline;gap:12px;margin-bottom:9px;
  font-family:var(--dy-display);font-weight:700;font-size:9px;letter-spacing:.32em;
  text-transform:uppercase;color:rgba(236,227,208,.5);
}
.dy-loom-h b{font-family:var(--dy-display);font-weight:900;font-size:15px;
  letter-spacing:0;color:var(--dy-brass-hot)}
.dy-warps{display:flex;flex-wrap:wrap;gap:8px}
.dy-warp-row{
  position:relative;flex:1 1 190px;min-width:170px;
  padding:7px 11px 8px 15px;
  border:1px solid rgba(255,238,196,.16);background:rgba(30,26,21,.82);
}
.dy-warp-row::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:4px;
  background:var(--dy-thread,#b6ac96);
}
.dy-warp-row[data-done="1"]{filter:saturate(.5) brightness(.82)}
.dy-warp-k{
  display:flex;align-items:center;gap:7px;
  font-family:var(--dy-display);font-weight:700;font-size:8px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--dy-thread,#b6ac96);
}
.dy-warp-nm{font-family:var(--dy-display);font-weight:900;font-size:14.5px;line-height:1.22;
  color:#f6eeda;margin-top:2px}
.dy-beads{display:flex;align-items:center;gap:4px;margin-top:5px}
.dy-bead{width:8px;height:8px;border-radius:50%;border:1px solid var(--dy-thread,#b6ac96);
  opacity:.42}
.dy-bead[data-on="1"]{background:var(--dy-thread,#b6ac96);opacity:1}
.dy-bead[data-old="1"]{border-radius:1px;opacity:.62;background:none}
.dy-warp-note{font-family:var(--dy-body);font-style:italic;font-size:12px;
  color:rgba(236,227,208,.46);margin-top:2px}
.dy-loom-empty{font-family:var(--dy-body);font-style:italic;font-size:14px;
  color:rgba(236,227,208,.42)}

/* ═══ THE DAY ═════════════════════════════════════════════════════════ */
.dy-main{position:relative;padding:30px 34px 90px;max-width:900px;margin:0 auto}

.dy-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.dy-beat.dy-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:22px}

/* ── THE HOUR PLATE ─────────────────────────────────────────────────── */
.dy-hourplate{
  display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;
  margin:26px 0 18px;padding:12px 0 13px;
  border-top:1px solid rgba(255,238,196,.22);
  border-bottom:1px solid rgba(255,238,196,.1);
}
.dy-beat:first-child .dy-hourplate{margin-top:0}
.dy-dial{
  width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(255,238,196,.26);border-radius:50%;
  background:radial-gradient(circle at 40% 34%,rgba(255,238,196,.16),transparent 70%);
}
.dy-hour-nm{font-family:var(--dy-display);font-weight:900;font-size:24px;line-height:1.1;
  letter-spacing:-.012em;color:#f6eeda}
.dy-hour-line{font-family:var(--dy-hand);font-style:italic;font-size:16px;line-height:1.5;
  color:rgba(236,227,208,.62);margin-top:2px}

/* ── A SCENE, HUNG ON ITS CORD ──────────────────────────────────────── */
.dy-scene{
  position:relative;margin-left:26px;
  background:linear-gradient(168deg,rgba(48,42,33,.94),rgba(24,21,17,.96));
  border:1px solid rgba(255,238,196,.15);
  border-left:none;
  padding:17px 22px 19px;
  box-shadow:0 18px 44px rgba(0,0,0,.6);
}
/* THE CORD. It is the card's left edge and it runs the full height, so a
   family is legible from four cards away with the text unread. */
.dy-scene::before{
  content:'';position:absolute;left:-3px;top:-1px;bottom:-1px;width:3px;
  background:var(--dy-thread,#b6ac96);
}
/* AND WHERE IT COMES FROM. A carried thread's cord runs UP out of the card
   and off the top of it, so continuity is visible before a word is read. */
.dy-scene[data-carried="1"]::after{
  content:'';position:absolute;left:-3px;top:-24px;height:24px;width:3px;
  background:linear-gradient(180deg,transparent,var(--dy-thread,#b6ac96));
}
/* CARDS SWING IN ON THE CORD — pivot at the top-left corner, where the cord
   attaches. Nothing in this set is hung; the turret draws, the hall leans,
   the morning descends, the book writes, the estate hauls, the corridor holds
   still. */
.dy-beat.dy-vis .dy-scene{animation:dy-hang 1s cubic-bezier(.2,.9,.24,1) both}
@keyframes dy-hang{
  0%{opacity:0;transform:rotate(-2.4deg) translateY(-12px)}
  58%{opacity:1;transform:rotate(.7deg) translateY(0)}
  100%{opacity:1;transform:rotate(0) translateY(0)}
}
.dy-scene{transform-origin:0 0}

.dy-scene-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:9px}
.dy-fam{
  display:inline-flex;align-items:center;gap:7px;
  font-family:var(--dy-display);font-weight:700;font-size:9px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--dy-thread,#b6ac96);
}
.dy-tag{
  font-family:var(--dy-display);font-weight:700;font-size:8.5px;letter-spacing:.26em;
  text-transform:uppercase;padding:3px 8px;
  border:1px solid rgba(255,238,196,.24);color:rgba(236,227,208,.7);
}
.dy-tag[data-kind="open"]{border-color:var(--dy-thread,#b6ac96);color:var(--dy-thread,#b6ac96)}
.dy-tag[data-kind="carry"]{border-color:rgba(200,162,74,.6);color:var(--dy-brass-hot);
  background:rgba(200,162,74,.1)}
.dy-tag[data-kind="close"]{border-color:rgba(246,238,218,.7);color:#f6eeda;
  background:rgba(246,238,218,.12)}
.dy-tag[data-kind="hearsay"]{border-style:dashed;color:rgba(236,227,208,.5)}

.dy-say{font-family:var(--dy-body);font-size:19px;line-height:1.56;
  color:rgba(240,232,214,.94);margin:0}
.dy-faces{display:flex;align-items:center;gap:8px;margin:12px 0 0;flex-wrap:wrap}
.dy-face{display:inline-flex;align-items:center;gap:8px;
  font-family:var(--dy-display);font-weight:700;font-size:12px;letter-spacing:.04em;
  color:rgba(236,227,208,.78)}

/* ── THE BACK-STITCH: what this beat cites, drawn as a citation ──────
   The engine appends its continuity to the beat's own sentence. Left inline
   it is a paragraph; pulled out here it is a memory, indented under the
   sentence that summoned it, with the days it names as physical tabs. */
.dy-stitch{
  position:relative;margin:14px 0 0 0;padding:12px 16px 13px 18px;
  background:rgba(16,14,12,.5);
  border-left:2px solid var(--dy-thread,#b6ac96);
}
.dy-stitch-k{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  font-family:var(--dy-display);font-weight:700;font-size:8.5px;letter-spacing:.28em;
  text-transform:uppercase;color:rgba(236,227,208,.5);margin-bottom:6px;
}
.dy-day{
  font-family:var(--dy-display);font-weight:900;font-size:10px;letter-spacing:.1em;
  padding:2px 7px;border:1px solid var(--dy-thread,#b6ac96);
  color:var(--dy-thread,#b6ac96);opacity:.6;
}
/* The day the citation actually QUOTES, against the days it merely names. */
.dy-day[data-cited="1"]{opacity:1;background:rgba(255,238,196,.08)}
.dy-stitch-t{font-family:var(--dy-hand);font-style:italic;font-size:17px;line-height:1.5;
  color:rgba(236,227,208,.72);margin:0}

/* ── THE KNOT: a thread that ends tonight ───────────────────────────── */
.dy-knot{
  display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:center;
  margin:14px 0 0;padding:11px 15px;
  border:1px solid rgba(246,238,218,.28);
  background:linear-gradient(96deg,rgba(246,238,218,.08),rgba(16,14,12,.42));
}
.dy-knot-w{font-family:var(--dy-display);font-weight:900;font-size:17px;line-height:1.2;
  color:#f6eeda}
.dy-knot-s{font-family:var(--dy-body);font-style:italic;font-size:14px;
  color:rgba(236,227,208,.6);margin-top:1px}
.dy-knot[data-sense="cracked"]{border-color:rgba(208,87,107,.5);
  background:linear-gradient(96deg,rgba(208,87,107,.14),rgba(16,14,12,.42))}
.dy-knot[data-sense="coupled"]{border-color:rgba(220,149,180,.5);
  background:linear-gradient(96deg,rgba(220,149,180,.14),rgba(16,14,12,.42))}

/* ── AN OVERHEARD SCENE — the observer layer, drawn as less ─────────── */
.dy-scene[data-heard="1"]{
  background:linear-gradient(168deg,rgba(34,30,25,.8),rgba(20,18,15,.9));
  border-style:dashed;
}
.dy-scene[data-heard="1"]::before{opacity:.34}
.dy-heard{font-family:var(--dy-body);font-style:italic;font-size:14px;
  color:rgba(236,227,208,.44);margin:11px 0 0}

/* ── THE WEAVE: the day summed, last card before the host ───────────── */
.dy-weave{
  position:relative;margin-left:26px;padding:20px 24px 22px;
  background:linear-gradient(168deg,rgba(54,46,35,.94),rgba(24,21,17,.96));
  border:1px solid rgba(200,162,74,.34);
  box-shadow:0 18px 44px rgba(0,0,0,.6);
}
.dy-weave h3{font-family:var(--dy-display);font-weight:900;font-size:23px;line-height:1.15;
  letter-spacing:-.014em;color:#f6eeda;margin:0 0 4px}
.dy-weave > p{font-family:var(--dy-hand);font-style:italic;font-size:18px;
  color:rgba(236,227,208,.74);margin:0 0 14px}
.dy-sums{display:flex;flex-wrap:wrap;gap:10px 28px;padding:13px 0 0;
  border-top:1px solid rgba(255,238,196,.18)}
.dy-sum{display:inline-flex;align-items:baseline;gap:9px}
.dy-sum-k{font-family:var(--dy-display);font-weight:700;font-size:9px;letter-spacing:.26em;
  text-transform:uppercase;color:rgba(236,227,208,.5)}
.dy-sum-v{font-family:var(--dy-display);font-weight:900;font-size:21px;color:#f6eeda}
.dy-sum-v[data-tone="brass"]{color:var(--dy-brass-hot)}

/* ── HOST BAND — one, at the very end ───────────────────────────────── */
.dy-host{
  position:relative;overflow:hidden;margin-left:26px;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:16px 24px;margin-top:16px;
  background:linear-gradient(100deg,rgba(16,14,12,.96),rgba(52,42,20,.82) 52%,rgba(16,14,12,.96));
  border-top:1px solid rgba(200,162,74,.44);border-bottom:1px solid rgba(200,162,74,.44);
  box-shadow:inset 0 0 40px -8px rgba(244,221,162,.16),0 12px 30px rgba(0,0,0,.6);
}
.dy-host-name{
  font-family:var(--dy-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--dy-brass-hot);margin-bottom:6px;
  display:flex;align-items:center;gap:8px;
}
.dy-host-line{font-family:var(--dy-hand);font-style:italic;font-size:19px;line-height:1.5;
  color:#f6e6c4}

/* ── STICKY CONTROLS ────────────────────────────────────────────────── */
.dy-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(10,9,8,.1),rgba(10,9,8,.98) 44%);
  border-top:1px solid rgba(255,238,196,.2);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.dy-btn{
  font-family:var(--dy-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(255,238,196,.16),rgba(255,238,196,.03));
  color:var(--dy-ink);
  border:1px solid rgba(255,238,196,.36);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(255,238,196,.14);
}
.dy-btn:hover{background:rgba(255,238,196,.26);color:#fff;
  box-shadow:0 0 26px rgba(255,238,196,.2),inset 0 1px 0 rgba(255,238,196,.26)}
.dy-btn[disabled],.dy-btn.dy-dim{opacity:.3;cursor:default;pointer-events:none}
.dy-counter{
  font-family:var(--dy-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:rgba(236,227,208,.44);min-width:86px;text-align:center;
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
.dy-none{max-width:620px;margin:0 auto;padding:64px 34px 90px;text-align:center}
.dy-none-h{font-family:var(--dy-display);font-weight:900;font-size:30px;letter-spacing:-.01em;
  color:#f6eeda;margin:22px 0 16px}
.dy-none p{font-family:var(--dy-hand);font-size:19px;line-height:1.65;
  color:rgba(236,227,208,.7);margin:0 auto 14px;max-width:520px}

/* ── RESPONSIVE ─────────────────────────────────────────────────────── */
@media(max-height:720px){.dy-stage{position:static}}
@media(max-width:900px){
  .dy-stage{position:static}
  .dy-hero{height:390px}
}
@media(max-width:700px){
  .dy-main{padding:24px 16px 60px}
  .dy-scene,.dy-weave,.dy-host{margin-left:14px}
  .dy-hero{height:320px}
  .dy-hero-lock{padding:0 20px 22px}
  .dy-host{grid-template-columns:1fr;gap:10px}
  .dy-hourplate{grid-template-columns:1fr;gap:8px}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .dy-root *,.dy-root *::before,.dy-root *::after{animation:none!important;transition:none!important}
  .dy-beat.dy-vis .dy-scene{opacity:1;transform:none}
  .dy-mote{opacity:.24}
  .dy-shaft{opacity:.7}
}
` + PORTRAIT_CSS;

// ══════════════════════════════════════════════════════════════════════
// THE VIEW — the observer contract, decided once
// ══════════════════════════════════════════════════════════════════════
//
// A CASTLE DAY IS NOT ONE ROOM, and that is what makes this layer mean
// something rather than filter a list.
//
//   THE AUDIENCE sees the day entire: every scene, every thread, every
//   citation back to the day it started on. It is the only reader that ever
//   gets to see a story as a story.
//
//   A PLAYER sees THREE different things depending on where they were:
//
//     * a scene they were IN — in full, thread and all, because it is theirs.
//       Presence is `people` OR `actors`: the two disagree for thirteen events
//       in the pool (`_threadForActors` narrates a thread's parties rather
//       than the convened pair, see js/tr/events.js), and either claim to
//       having been in the room is a true one.
//     * a scene in a COMMUNAL hour they were not in — the sentence, and
//       nothing else. They saw two people talking over the bread. WHAT IS
//       WITHHELD IS THE THREAD: no citation, no earlier days, no outcome, no
//       place on the loom. That is the layer doing real work rather than
//       hiding a name, and it is the truest sentence this screen can make its
//       observer contract say — you can see that something is going on
//       between those two and you have no idea how long it has been going on
//       for.
//     * a scene at NIGHT they were not in — nothing at all. Doors are shut,
//       the castle is stone, and `recruitment.js`'s "You Were Asleep" is the
//       precedent: rendering a legitimate nothing is the honest answer, not a
//       redaction.
//
// NIGHT IS THE ONLY PRIVATE HOUR and that is a claim about the format, not a
// convenience: the other six all happen with the castle awake and moving
// through shared space — the table, the work, the road, the hall, the minutes
// after somebody has just been sent away. The night is the one hour the
// engine itself treats as behind a door.
const PRIVATE_HOURS = new Set(['night']);

function _sceneFor(scene, watcher) {
  if (watcher == null) return 'full';
  const inIt = (scene.people || []).includes(watcher)
    || (scene.actors || []).includes(watcher);
  if (inIt) return 'full';
  return PRIVATE_HOURS.has(scene.window) ? 'none' : 'heard';
}

function _view(ep, observer) {
  const c = ep && ep.tr && ep.tr.castle;
  if (!c) return null;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs !== null && obs.indexOf('player:') !== 0;
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;

  const all = Array.isArray(c.scenes) ? c.scenes : [];
  const scenes = [];
  let missedInTheDark = 0;
  for (const s of all) {
    const layer = _sceneFor(s, watcher);
    if (layer === 'none') { missedInTheDark++; continue; }
    scenes.push({ ...s, layer });
  }

  // The hours that produced something THIS READER CAN SEE, in the order the
  // day runs them — read off the scenes that survived the layer, never off
  // `c.windows`, or a player would be given an hour heading with nothing
  // under it for a conversation they slept through.
  const order = [];
  for (const s of scenes) if (!order.includes(s.window)) order.push(s.window);

  // The loom's rows: one per thread the reader can actually follow. An
  // overheard scene is deliberately NOT on it — a thread you cannot see is
  // not a thread you have, and a row for it would be the citation leaking
  // through the side of the sidebar.
  const rows = [];
  const rowBy = new Map();
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    if (s.layer !== 'full') continue;
    let row = rowBy.get(s.threadId);
    if (!row) {
      const fam = _fam(s);
      row = { threadId: s.threadId, colour: fam.colour, label: fam.label,
        parties: s.parties.length ? s.parties : (s.people.length ? s.people : s.actors),
        openedEp: s.openedEp, priorDays: s.priorDays.slice(),
        firstStep: i, beatsToday: 0, steps: [], closed: false, outcome: null, sense: null };
      rowBy.set(s.threadId, row);
      rows.push(row);
    }
    row.beatsToday++;
    row.steps.push(i);
    if (s.closedNow) { row.closed = true; row.outcome = s.outcome; row.sense = s.sense; }
  }

  // ── A THREAD MAY ONLY BE KNOTTED OFF ONCE, AND IT IS ON ITS LAST SCENE ──
  //
  // `closedNow` is a fact about the THREAD ("this story ended in this round"),
  // and the recorder is right to stamp it on every one of that round's beats:
  // it is answering "did this end tonight", not "is this the end". The SCREEN
  // is asking the second question, and a story that announces its own ending
  // at dawn, runs two more scenes, and announces the same ending again on the
  // road home reads as a rendering fault.
  //
  // Found by dumping a season's transcript and reading it — day 7 of seed 1
  // closes `suspicion:Axel|Bowie` at dawn and takes another beat on the way
  // back, so "The end of it … Walked away from it" printed twice, four scenes
  // apart, for one story. Every suite was green.
  for (const row of rows) {
    if (!row.closed) continue;
    const last = row.steps[row.steps.length - 1];
    for (const st of row.steps) if (st !== last) scenes[st].closedNow = false;
  }

  return {
    ep: c.ep != null ? c.ep : (ep.tr && ep.tr.ep) || ep.num || 0,
    isAudience, watcher, scenes, order, rows, missedInTheDark,
    total: all.length,
  };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

const HOST_CLOSE = {
  busy: [
    'A castle is a very large building for keeping a secret in, and every one of them '
    + 'spent today finding that out.',
    'None of that was a competition and all of it was the game. It always is.',
    'Nobody won anything this afternoon. Several people lost something and have not '
    + 'noticed yet.',
    'Watch the ones who said the least. There were fewer of them than usual today.',
  ],
  quiet: [
    'A quiet day, and quiet is not the same as nothing. It is simply a day where the '
    + 'work went on underneath.',
    'Not much happened out loud. That is usually the tell.',
    'A slow day in a stone building. Everybody spent it thinking, which is worse.',
    'Very little to report, which will be a great comfort to precisely nobody.',
  ],
  woven: [
    'Three or four of those were the same story, and only some of them know it.',
    'Look at what carried over. Look very hard at who it carried over onto.',
    'Stories in this place are not events. They are debts, and they come due.',
    'Every one of those threads goes somewhere. One of them goes somewhere tonight.',
  ],
};

const WEAVE_LEAD = [
  'What the castle actually did today, once you take the table out of it.',
  'The day as it was spent: in twos, in doorways, on the road, and in the dark.',
  'Everything that happened here between one night and the next.',
  'The day, counted in stories rather than in hours.',
];

/**
 * NOBODY SAID SO OUT LOUD — the beat continues a thread and the engine wrote
 * no citation onto it, which is the ordinary case rather than the exception.
 *
 * FOUR VARIANTS MINIMUM, and this pool is the one that most needed them:
 * `citeMoments` only writes a sentence when it has a prior moment worth
 * quoting, so on a busy day three or four cards land here at once and a single
 * sentence printed three times in one screen reads exactly like a bug. Found
 * by dumping a season's transcript and reading it end to end.
 */
const UNSPOKEN = [
  'Nobody said so out loud. It is the same story all the same, and it has been '
  + 'running since day {d}.',
  'Neither of them called it back to anything. It goes back to day {d} regardless.',
  'No reference was made to any of it. This is the same story, and it started on day {d}.',
  'They did not have to say what it was about. It has been what it was about since day {d}.',
  'Said as though it were the first time. It is not; it has been going since day {d}.',
];

/** Twice in one round, between the same people, about the same thing. */
const SAME_DAY = [
  'The second time today, and about exactly the same thing.',
  'Twice in one day. Whatever this is, it did not keep until tomorrow.',
  'This had already come up once this morning.',
  'The same thread, picked back up before the day was out.',
];

function _fill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null) ? subs[k] : m);
}

function _tag(kind, text) {
  return '<span class="dy-tag" data-kind="' + kind + '">' + _esc(text) + '</span>';
}

function _faces(names) {
  const list = (names || []).filter(Boolean).slice(0, 4);
  if (!list.length) return '';
  return '<div class="dy-faces">' + list.map(n =>
    '<span class="dy-face">' + _av(n, 30) + _esc(n) + '</span>').join('') + '</div>';
}

/**
 * The back-stitch. Three shapes, and the middle one is the common case.
 *
 *   a citation the engine wrote — quote it, with its days as tabs
 *   earlier days and no citation — name the days, say nothing else
 *   earlier beats but all of them TODAY — "later the same day", because a
 *     thread can take two beats in one round and "back to day 4" printed on
 *     day 4 is the citation bug `priorMoments` exists to avoid, arriving from
 *     the other side
 */
/**
 * EVERY DAY THIS THREAD HAS, and the ones the engine quoted marked as quoted.
 *
 * The first version tabbed only `citedDays` when there was a citation, so a
 * beat whose citation names day 9 out of a thread running on days 7 and 9
 * silently dropped day 7 from the screen — the thread looked a day younger
 * than it was. `citeMoments` caps itself at three moments and picks which one
 * to quote, so the quoted set is by design a SUBSET of the history and is not
 * the history.
 */
function _tabs(s) {
  const cited = new Set(s.citedDays || []);
  const all = [...new Set([...(s.priorDays || []), ...cited])].sort((a, b) => a - b);
  return all.map(d => '<span class="dy-day"'
    + (cited.has(d) ? ' data-cited="1"' : '') + '>Day ' + d + '</span>').join('');
}

function _stitch(s, key) {
  if (s.citation) {
    return '<div class="dy-stitch">'
      + '<div class="dy-stitch-k">' + _ic('needle', 12) + 'Back to' + _tabs(s)
      + '</div>'
      + '<p class="dy-stitch-t">' + _esc(s.citation) + '</p></div>';
  }
  const prior = [...new Set(s.priorDays || [])].sort((a, b) => a - b);
  if (prior.length) {
    return '<div class="dy-stitch">'
      + '<div class="dy-stitch-k">' + _ic('needle', 12) + 'The same thread on' + _tabs(s)
      + '</div>'
      + '<p class="dy-stitch-t">'
      + _esc(_fill(_pick(UNSPOKEN, key + '|unspoken'),
        { d: String(s.openedEp), n: String(prior.length) }))
      + '</p></div>';
  }
  return '<div class="dy-stitch">'
    + '<div class="dy-stitch-k">' + _ic('needle', 12) + 'Later the same day</div>'
    + '<p class="dy-stitch-t">' + _esc(_pick(SAME_DAY, key + '|sameday'))
    + '</p></div>';
}

function _knot(s) {
  const sense = SENSE_WORDS[s.sense] || { word: 'It ended here',
    gloss: 'the story stopped, one way or another' };
  const how = OUTCOME_WORDS[s.outcome] || 'came to an end';
  return '<div class="dy-knot" data-sense="' + _esc(s.sense || 'walked') + '">'
    + _ic('shears', 26, '#f6eeda')
    + '<div><div class="dy-knot-w">' + _esc(sense.word) + '</div>'
    + '<div class="dy-knot-s">They ' + _esc(how) + ' &mdash; ' + _esc(sense.gloss) + '.</div>'
    + '</div></div>';
}

function _sceneCard(s, key) {
  const fam = _fam(s);
  const carried = !s.opened;
  const heard = s.layer === 'heard';
  const tags = [];
  if (heard) {
    tags.push(_tag('hearsay', 'Overheard'));
  } else if (s.closedNow) {
    tags.push(_tag('close', _pick(CLOSING_TAG, key + '|close')));
  } else if (carried) {
    tags.push(_tag('carry', _pick(CARRIED_TAG, key + '|carry')));
  } else {
    tags.push(_tag('open', _pick(OPENING_TAG, key + '|open')));
  }

  let body = '<p class="dy-say">' + _esc(s.line) + '</p>';
  if (heard) {
    body += _faces((s.people && s.people.length ? s.people : s.actors));
    // NO CLAIM ABOUT THE AGE OF IT. The first version said "it did not start
    // today", which is a fact about the thread -- exactly the fact this layer
    // exists to withhold -- and it is not even reliably true: plenty of
    // overheard scenes are a story's first beat. Found by rendering a player's
    // day and reading it.
    body += '<p class="dy-heard">You were in the room and you were not in the '
      + 'conversation. Two people talking about something, and no way at all to '
      + 'know whether it started this morning or has been running all week.</p>';
  } else {
    body += _faces(s.parties.length ? s.parties
      : (s.people.length ? s.people : s.actors));
    if (carried) body += _stitch(s, key);
    if (s.closedNow) body += _knot(s);
  }

  return '<div class="dy-scene" data-carried="' + (carried && !heard ? '1' : '0') + '"'
    + (heard ? ' data-heard="1"' : '')
    + ' style="--dy-thread:' + fam.colour + '">'
    + '<div class="dy-scene-top">'
    + '<span class="dy-fam">' + _ic(carried && !heard ? 'knot' : 'spool', 13, fam.colour)
    + _esc(fam.label) + '</span>'
    + tags.join('')
    + '</div>' + body + '</div>';
}

function _hourPlate(w, key) {
  const h = _hour(w);
  return '<div class="dy-hourplate">'
    + '<span class="dy-dial">'
    + _ic(h.sun === 'night' || h.sun === 'dusk' ? 'moon' : 'sun', 22,
      'rgba(255,238,196,.8)') + '</span>'
    + '<div><div class="dy-hour-nm">' + _esc(h.label) + '</div>'
    + '<div class="dy-hour-line">' + _esc(_pick(h.lines, key + '|' + w)) + '</div></div>'
    + '</div>';
}

function _hostBand(line) {
  return '<div class="dy-host">' + _hostAv(50)
    + '<div><div class="dy-host-name">' + _ic('ear', 12) + _esc(_host().name) + '</div>'
    + '<div class="dy-host-line">&ldquo;' + _esc(line) + '&rdquo;</div></div></div>';
}

/**
 * Every step of the day, in the order the day ran it.
 *
 * A step is ONE SCENE, and the hour plate rides on the first scene of its
 * hour rather than taking a step of its own. That is deliberate: a heading
 * with nothing under it yet is a promise the reveal has not kept, and the
 * guard that every fired hour appears would then be satisfiable by a page
 * that shows seven headings and no castle.
 */
function _buildBeats(v) {
  const beats = [];
  const key = 'dy|' + v.ep;
  let hour = null;
  for (let i = 0; i < v.scenes.length; i++) {
    const s = v.scenes[i];
    const plate = s.window !== hour ? _hourPlate(s.window, key) : '';
    hour = s.window;
    beats.push({
      phase: _hour(s.window).sun,
      html: plate + _sceneCard(s, key + '|' + i + '|' + s.eventId),
      meta: { kind: 'scene', idx: i, window: s.window },
    });
  }

  // THE WEAVE — the day summed, and the only card that counts anything.
  const carried = v.rows.filter(r => r.priorDays.length).length;
  const closed = v.rows.filter(r => r.closed).length;
  const stories = v.rows.length;
  const sums = [
    ['Scenes', String(v.scenes.length), null],
    ['Stories', String(stories), null],
    ['Older than today', String(carried), carried ? 'brass' : null],
    ['Finished tonight', String(closed), closed ? 'brass' : null],
  ];
  if (v.missedInTheDark) {
    sums.push(['Behind a shut door', String(v.missedInTheDark), null]);
  }
  const mood = carried >= 3 ? 'woven' : (v.scenes.length <= 3 ? 'quiet' : 'busy');
  beats.push({
    phase: 'night',
    html: '<div class="dy-weave">'
      + '<h3>The Day, Woven</h3>'
      + '<p>' + _esc(_pick(WEAVE_LEAD, key + '|weave')) + '</p>'
      + '<div class="dy-sums">' + sums.map(b =>
        '<span class="dy-sum"><span class="dy-sum-k">' + _esc(b[0]) + '</span>'
        + '<span class="dy-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>'
        + _esc(b[1]) + '</span></span>').join('')
      + '</div></div>'
      // THE ONE HOST LINE, LAST. He walked through none of this — six of the
      // seven hours happen with nobody presenting them — so he arrives only
      // once the day is over, exactly as he does in the corridor.
      + _hostBand(_pick(HOST_CLOSE[mood], key + '|host')),
    meta: { kind: 'weave' },
  });
  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE LOOM — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// Data on `window.__trCastleDay`, because a <script> tag inside innerHTML does
// not execute. GATED ON `idx` IN BOTH DIRECTIONS: a row does not appear until
// the scene that opened it has been revealed, and its beads fill one at a time
// as the day runs. A loom that showed the finished cloth on the first click
// would be the sidebar spoiling the screen, which is the failure every sticky
// stage in this directory is written against.

function _loom(state, idx) {
  const v = state.v;
  const live = v.rows.filter(r => r.firstStep <= idx);
  if (!live.length) {
    return '<div class="dy-loom-h">' + _ic('spool', 13) + 'The Loom</div>'
      + '<div class="dy-loom-empty">Nothing on it yet. Every story the castle is '
      + 'running today gets a cord here as it starts.</div>';
  }
  const rows = live.map((r) => {
    const shown = r.steps.filter(st => st <= idx).length;
    const done = r.closed && r.steps[r.steps.length - 1] <= idx;
    // Earlier days first, drawn as squares rather than beads: they are not
    // part of today and must not read as progress in it.
    const old = r.priorDays.map(() => '<span class="dy-bead" data-old="1"></span>').join('');
    const today = r.steps.map((st, i) =>
      '<span class="dy-bead" data-on="' + (st <= idx ? '1' : '0') + '"'
      + ' title="beat ' + (i + 1) + '"></span>').join('');
    const note = done
      ? 'finished tonight'
      : (r.priorDays.length ? 'running since day ' + r.openedEp
        : (shown > 1 ? 'twice today' : 'opened today'));
    return '<div class="dy-warp-row" data-done="' + (done ? '1' : '0') + '"'
      + ' style="--dy-thread:' + r.colour + '">'
      + '<div class="dy-warp-k">' + _ic(done ? 'shears' : 'knot', 11, r.colour)
      + _esc(r.label) + '</div>'
      + '<div class="dy-warp-nm">' + _esc(r.parties.join(' & ')) + '</div>'
      + '<div class="dy-beads">' + old + today + '</div>'
      + '<div class="dy-warp-note">' + _esc(note) + '</div>'
      + '</div>';
  }).join('');
  return '<div class="dy-loom-h">' + _ic('spool', 13) + 'The Loom'
    + '<b>' + live.length + '</b> ' + (live.length === 1 ? 'story' : 'stories')
    + '</div><div class="dy-warps">' + rows + '</div>';
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

const _tvState = {};
function _key(epNum) { return 'castleday-' + (epNum || 0); }
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
    const el = document.getElementById('dy-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('dy-vis'); else el.classList.remove('dy-vis');
  }
  const counter = document.getElementById('dy-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('dy-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.dy-btn').forEach(b => b.classList.toggle('dy-dim', done));
  }
  // THE SUN MOVES. The shell's phase is read off the step just revealed, so
  // the light on the page is the light at that hour.
  const shell = document.getElementById('dy-shell-' + suffix);
  const last = document.getElementById('dy-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase',
    last.getAttribute('data-phase') || 'morning');
  if (scroller) scroller.scrollTop = top;
}

function _updateLoom(epNum, idx) {
  const el = document.getElementById('dy-loom-inner');
  const store = (typeof window !== 'undefined' && window.__trCastleDay) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _loom(state, idx);
}

/** Bring the new card into view, UNDER the loom rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('dy-loom-inner');
  if (!scroller || !scroller.scrollTo || !el.getBoundingClientRect) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const gap = (stage ? stage.getBoundingClientRect().height : 0) + 26;
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    + scroller.scrollTop - gap;
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

export function trCastleDayRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('dy-step-' + suffix + '-' + st.idx));
  _updateLoom(epNum, st.idx);
}

export function trCastleDayRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateLoom(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildCastleDay(ep, observer)` — a whole day in the castle, as threads.
 *
 * `ep` is an `episodeHistory` row carrying `tr.castle`, written by
 * `_recordEpisode` in js/tr/headless.js on every round the season plays.
 * `observer` is `'audience'` or `'player:<Name>'`; `_view` is the one place
 * the difference between them is decided.
 */
export function rpBuildCastleDay(ep, observer = 'audience') {
  const suffix = 'castleday';
  const vars = '--dy-grain-src:' + _noiseTile('0.78', 4, 37, 0.34, 230) + ';';
  const css = '<style>' + DY_CSS + '</style>' + _filters();
  const v = _view(ep, observer);

  const shellNone = (headline, body, icon) =>
    '<div class="dy-root" style="' + vars + '">' + css
    + '<div class="dy-shell" data-phase="morning">'
    + '<div class="dy-scenery" aria-hidden="true">'
    + '<div class="dy-stone"></div><div class="dy-warpfall"></div>'
    + '<div class="dy-far">' + _hallFar() + '</div>'
    + '<div class="dy-vig"></div><div class="dy-grain"></div></div>'
    + '<div class="dy-body"><div class="dy-none">'
    + _ic(icon || 'spool', 84, 'rgba(255,238,196,.3)')
    + '<div class="dy-none-h">' + _esc(headline) + '</div>'
    + '<p>' + _esc(body) + '</p>'
    + '</div></div></div></div>';

  if (!v) {
    return shellNone('No Day On This Record',
      'This row carries no castle day. Nothing was written down for it, which is not '
      + 'the same as nothing having happened.');
  }
  if (!v.scenes.length) {
    // TWO DIFFERENT NOTHINGS, and they are not interchangeable. A day with no
    // scenes at all is a quiet castle; a day whose every scene happened
    // behind a door this reader was not on the right side of is the observer
    // contract, and `recruitment.js`'s "You Were Asleep" is the precedent for
    // rendering that as a real answer rather than as an error.
    if (v.watcher && v.total) {
      return shellNone('You Were Elsewhere',
        'The castle spent today doing what it does. None of it happened anywhere you '
        + 'were standing, and nobody is going to tell you about it over breakfast.',
        'moon');
    }
    return shellNone('A Quiet Day',
      'Nobody started anything today. The work got done, the road got walked, and not '
      + 'one conversation went anywhere worth writing down.');
  }

  const beats = _buildBeats(v);
  const total = beats.length;
  const epNum = ep.num || v.ep || 0;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trCastleDay = window.__trCastleDay || {};
    window.__trCastleDay[epNum] = state;
  }

  const observerBadge = v.isAudience
    ? '<div class="dy-observer" data-layer="audience">' + _icon('eye', 13)
      + 'Observer: audience <em>&mdash; every hour of it, and every story running '
      + 'underneath; not one person in the castle can see the day like this</em></div>'
    : '<div class="dy-observer" data-layer="player">' + _icon('eye', 13)
      + 'Observer: ' + _esc(v.watcher || 'a player')
      + ' <em>&mdash; what you were in, and what you could hear across a room. The '
      + 'night is not yours' + (v.missedInTheDark
        ? ' &mdash; ' + v.missedInTheDark + ' of today happened behind a shut door'
        : '') + '</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED — the Round Table's
  // pattern, and the reason the conclave first shipped a screen that was
  // blank until it was clicked.
  const stream = beats.map((b, i) =>
    '<div class="dy-beat' + (i <= st.idx ? ' dy-vis' : '')
    + '" id="dy-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';
  const stories = v.rows.length;

  return '<div class="dy-root" style="' + vars + '">' + css
    + '<div class="dy-shell" id="dy-shell-' + suffix + '"'
    + ' data-phase="' + beats[Math.max(0, Math.min(st.idx, total - 1))].phase + '">'
    + '<div class="dy-scenery" aria-hidden="true">'
    + '<div class="dy-stone"></div><div class="dy-warpfall"></div>'
    + '<div class="dy-far">' + _hallFar() + '</div>'
    + '<div class="dy-mid">' + _hallMid(v.ep + '|' + v.scenes.length) + '</div>'
    + '<div class="dy-fore">' + _hallFore() + '</div>'
    + '<div class="dy-wash"></div>'
    + '<div class="dy-vig"></div>'
    + '<div class="dy-grain"></div>'
    + '</div>'
    + '<div class="dy-body">'
    + '<div class="dy-hero">' + _heroScene(stories)
    + '<div class="dy-hero-lock">'
    + '<div class="dy-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; Dawn To Dark</div>'
    + '<h1 class="dy-title">THE CASTLE DAY</h1>'
    + '<div class="dy-title-rule"><i></i>' + _ic('knot', 36, '#d2a44e') + '<i></i></div>'
    + '<p class="dy-sub">' + (v.rows.some(r => r.priorDays.length)
      ? 'Seven hours, and everything that happened in them that was not a vote. Some of '
        + 'it started today. Some of it has been running for days and only the people in '
        + 'it know.'
      : 'Seven hours, and everything that happened in them that was not a vote. All of it '
        + 'starts here. Not one of these stories has a yesterday yet.') + '</p>'
    + '</div></div>'
    + '<header class="dy-head">' + observerBadge + '</header>'
    + '<div class="dy-stage" id="dy-loom-inner">' + _loom(state, st.idx) + '</div>'
    + '<main class="dy-main">' + stream + '</main>'
    + '</div></div>'
    + '<div class="dy-controls" id="dy-controls-' + suffix + '">'
    + '<button class="dy-btn" onclick="' + call('trCastleDayRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="dy-counter" id="dy-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="dy-btn" onclick="' + call('trCastleDayRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
