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
import { tidyNames, scriptParts } from './tidy.js';
import { pronouns as _pronouns } from '../players.js';
const _prOf = n => _pronouns(n) || { sub: 'they', obj: 'them', posAdj: 'their' };
import { seasonConfig, players } from '../core.js';
import { HOSTS_BY_FORMAT } from '../shows.js';
import { PORTRAIT_CSS, TR_NAV_TOP } from './style.js';
import { _noiseTile, _fieldRng } from './scenery.js';
import { _portrait, _icon } from './conclave.js';
import { ADVERSE_OUTCOMES, SMOOTH_OUTCOMES, ADVERSE_BRANCHES, BENIGN_BRANCHES }
  from '../tr/castle/voice.js';
// THE ALCOVE, FOLDED IN (Plan 11). The confessional chair is no longer its own
// screen — it is composed here, into the night segment, beside the night it is
// the voice of. These reuse confessionals.js's own `_view`/`_buildBeats`, so the
// observer gate is the one that file already enforces; nothing here widens it.
import { confessionalBeats, confessionalStyle } from './confessionals.js';

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
// AND THEY ARE COLOURS AND NOTHING ELSE NOW. Each entry used to carry a LABEL
// and a GLOSS, and the card printed them: "Cover — somebody spent the day being
// ordinary on purpose". That is a category and its own footnote above a
// sentence, which is a state report rather than an episode — and one of those
// labels was a word the machine uses and prose may not (see js/tr/scene-api.js).
// The colour survives because it does the one job a label cannot: it makes the
// cord on this card recognisably the cord on that one, four hours apart, with
// the text unread.
const FAMILIES = {
  trust: { colour: '#8fbf9a' },
  suspicion: { colour: '#d0576b' },
  grief: { colour: '#94a0cc' },
  cover: { colour: '#d2a44e' },
  romance: { colour: '#dc95b4' },
  'romance-spark': { colour: '#dc95b4' },
  callback: { colour: '#ac8fc8' },
  testing: { colour: '#5fb6c0' },
  journey: { colour: '#d9834f' },
  confrontation: { colour: '#e0703a' },
  unspun: { colour: '#b6ac96' },
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
  // THE HOUR AFTER BREAKFAST, not dawn. The engine's phase is `breakfast-
  // fallout`: it runs once the breakfast screen has shown who came down and who
  // did not, so everybody in it is awake and knows what the night cost. It was
  // labelled "Dawn · before anyone is up" and printed "Nobody else is down yet"
  // straight after a breakfast the whole castle had just sat through.
  dawn: { label: 'After Breakfast', sun: 'dawn', lines: [
    'Breakfast is over, and nobody has quite decided what to do with what it told them.',
    'The plates are cleared. The chair that stayed empty is still at the table.',
    'The first hour after the news, when everybody finds somebody to say it to.',
    'The castle breaks up from the table in twos, and nobody goes far.',
  ] },
  morning: { label: 'Morning', sun: 'morning', lines: [
    'The castle at work — bread, water, wood — and everything anybody says over the top of it.',
    'Chores, and the excellent excuse a chore gives a conversation nobody wants overheard.',
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
    'One fewer voice in the room, and nobody has worked out how to fill the gap.',
  ] },
  night: { label: 'Night', sun: 'night', lines: [
    'Doors shut. Nobody in the castle is asleep who says they are.',
    'Dark corridors, thin walls, and everybody listening to the building.',
    'The hour the castle belongs to whoever is still awake in it.',
    'Night, and every noise in a stone building is somebody.',
  ] },
};
// THE FIRST MORNING has a breakfast but no murder behind it: nobody is missing,
// and there is no news. Set by `_view` for the episode being drawn.
let _firstDay = false;
const _NEEDS_A_DEATH = /\b(news|empty|missing|grief|mourn)/i;
const _alive = pool => (_firstDay ? pool.filter(l => !_NEEDS_A_DEATH.test(l)) : pool);
function _hour(w) {
  const h = HOURS[w];
  if (h && _firstDay) return { ...h, lines: _alive(h.lines) };
  return h || { label: String(w || 'The Day'), sun: 'noon',
    lines: ['An hour of the day, and the castle spent it the way it spends them.'] };
}

// ══════════════════════════════════════════════════════════════════════
// A SCENE, WRITTEN OUT  (Plan 10, Task 6)
// ══════════════════════════════════════════════════════════════════════
//
// WHAT WAS HERE BEFORE. Three arrays of category labels — `OPENING_TAG`,
// `CARRIED_TAG`, `CLOSING_TAG` — printed above every card, so the screen said
//
//     Suspicion — Cast on
//     Chef Hatchet clocked a completely harmless habit of Bowie's.
//
// and then moved on. That is a state report with a serif font on it. The
// viewer is told a category, a sentence and nothing else: not where anybody
// was, not what was said, not how the other person took it, and above all not
// what is different afterwards. A card that says a thing happened and never
// says what it cost is exactly the disconnected-event shape this plan exists
// to remove.
//
// WHAT REPLACES IT. Every recorded scene is composed into a full television
// scene of four or five CARDS before any markup exists:
//
//     establish    where, when, and who is standing there
//     action       what concretely happens — the engine's own authored
//                  sentence, which is the one fact on the card
//     recall       (only when the story is older than today) what it goes
//                  back to, with the days it has beats on
//     reaction     how the other person takes it, in their own voice, out
//                  loud where dialogue is the honest way to carry it
//     consequence  what is different now, said as behaviour rather than as a
//                  number
//
// EVERY WORD OF IT COMES OFF THE RECORD. The action is the engine's sentence
// verbatim. The recall is the engine's citation, or the days the thread
// actually has beats on. The consequence is keyed on whether this beat opened
// the story, continued it, or ended it, and on the outcome the engine stored.
// The only thing composed here that the record does not literally hold is the
// ROOM — and a room is staging, not a claim: a scene has to happen somewhere
// or the reader cannot see it. Nothing here asserts a fact about the game that
// the record does not already carry.
//
// THE VOICE IS THE CONTESTANT'S. The reaction is picked on the responder's
// archetype, which is what makes a hothead and a mastermind answer the same
// question differently instead of interchangeably. Speech is contemporary —
// contractions, interruptions, short sentences — because the castle is gothic
// and the people in it are not.
//
// AND THE WORDS THE MACHINE USES ARE NOT ON THE PAGE. `cover`, `thread`,
// `heat`, `opened today` and `The Loom` are debug vocabulary (see the header
// of js/tr/scene-api.js) and appear nowhere a viewer can read them, including
// as a heading. Where a label used to carry the meaning, the sentence now
// carries it.

/**
 * WHERE IT HAPPENED. The record stores an hour and not a room, and a scene
 * with no room in it is a scene the reader cannot picture. Picked
 * deterministically off the scene's own key, so the same day always happens in
 * the same places and the transcript and the screen agree.
 */
/** Hours in which "tonight" is still ahead (see `_composeScene`). */
const DAYTIME = new Set(['early', 'dawn', 'morning', 'journey-out', 'journey-back']);
/** Events that only make sense before breakfast (see `_composeScene`). */
const EARLY_EVENTS = new Set(['trust-first-one-down', 'confront-first-light']);
const PLACES = {
  early: ['the kitchen', 'the long table', 'the front hall', 'the bottom of the stairs'],
  dawn: ['the kitchen', 'the long table', 'the bottom of the stairs', 'the front hall',
    'the corridor outside the bedrooms'],
  morning: ['the library', 'the courtyard', 'the woodpile', 'the drawing room',
    'the scullery', 'the terrace steps'],
  'journey-out': ['the drive', 'the track below the gates', 'the minibus', 'the lane',
    'the top of the hill'],
  'journey-back': ['the lane home', 'the minibus', 'the last field before the gates',
    'the gravel outside the doors', 'the boot room'],
  evening: ['the library', 'the landing', 'the billiard room', 'the window seat on the stairs',
    'the fire in the great hall'],
  'after-table': ['the front hall', 'the stairs', 'the kitchen', 'the landing',
    'the far end of the long table'],
  night: ['the upstairs corridor', 'the bedroom under the eaves', 'the back stairs',
    'the window at the end of the passage', 'the linen store'],
};
/** The half of the heading that is a clock, in the words a viewer uses. */
const WHEN_HEAD = {
  early: 'EARLIER, BEFORE BREAKFAST', dawn: 'AFTER BREAKFAST', morning: 'MID-MORNING',
  'journey-out': 'ON THE WAY OUT', 'journey-back': 'ON THE WAY BACK',
  evening: 'BEFORE THE ROUND TABLE', 'after-table': 'AFTER THE ROUND TABLE',
  night: 'AFTER LIGHTS OUT',
};
/** The same clock, in a clause a sentence can end on. */
const WHEN_SAID = {
  early: 'earlier that morning, before anybody else was down',
  dawn: 'just after breakfast', morning: 'in the middle of the morning',
  'journey-out': 'on the way out', 'journey-back': 'on the way back',
  evening: 'an hour before the Round Table', 'after-table': 'minutes after the Round Table',
  night: 'after lights out',
};

/**
 * THE ESTABLISHING CARD, per hour. Four each, because on a busy day three
 * scenes land in one hour and one sentence printed three times reads exactly
 * like a fault — the finding the variety floor in tests/tr-castle-prose.js was
 * written for, arriving on the screen side.
 */
const ESTABLISH_PAIR = {
  early: [
    'Earlier, before breakfast: {a} and {b} had {loc} to themselves.',
    'Earlier that morning. {a} came down to {loc} and found {b} already there.',
    'Before anybody else was down, {a} and {b} were at {loc}.',
    'Earlier, with the castle still asleep, {a} caught {b} at {loc}.',
  ],
  dawn: [
    'Breakfast has only just broken up, and {a} and {b} have {loc} to themselves.',
    'The table empties. {a} follows {b} out to {loc}.',
    'The others are still clearing plates. {a} and {b} are at {loc}, out of earshot.',
    'Ten minutes after breakfast, {a} catches {b} at {loc}.',
    '{a} and {b} leave the table together and stop at {loc}.',
    'The news is barely an hour old. {a} and {b} are at {loc} with the day still ahead of them.',
  ],
  morning: [
    'Mid-morning at {loc}, with the work half done, and {a} and {b} are the only two there.',
    'The castle is busy everywhere except {loc}, which is where {a} and {b} are.',
    'An hour after breakfast, {a} steers {b} towards {loc} and lets the door swing shut.',
    '{a} and {b} end up at {loc} together, with a job between them that neither is really doing.',
    '{a} and {b} pause their chores at {loc} to speak in private.',
    '{a} joins {b} at {loc} and waits for the room to empty before saying anything.',
  ],
  'journey-out': [
    '{a} and {b} fall behind the group near {loc} on the walk to the mission.',
    'Twenty minutes out from the gates, {a} falls into step with {b} at {loc}.',
    'Out at {loc}, with the castle behind them and nothing else to look at, {a} and {b} are talking.',
    '{a} and {b} take {loc} slowly on purpose, and let the others get ahead of them.',
    'The line thins out along the track. By {loc} it is {a} and {b} and a lot of open ground.',
    '{a} waits at {loc} until {b} catches up, and makes it look like stopping for breath.',
  ],
  'journey-back': [
    'On the way back, at {loc}, {a} and {b} are the last two in the line.',
    'The afternoon is gone and so is most of the talking. {a} and {b} are at {loc}, walking it out.',
    'Coming home past {loc}, tired enough to be honest, {a} drops back to {b}.',
    '{a} and {b} do the last stretch — {loc} — side by side and in no particular hurry.',
    'The rest of them are well ahead by {loc}. {a} and {b} are not hurrying to catch up.',
    'By {loc}, {a} and {b} have stopped walking and started having a conversation.',
  ],
  evening: [
    'An hour before they sit down. {a} and {b} are at {loc}, and neither is there by accident.',
    'The light is going. {a} finds {b} at {loc}, which is where {a} hoped {b} would be.',
    'At {loc}, before the Round Table, {a} and {b} have a few minutes and they both know it.',
    '{a} and {b} are at {loc} with the evening in front of them and a name to settle on.',
    'There is an hour left and a decision in it. {a} and {b} spend some of the hour at {loc}.',
    '{a} has been waiting at {loc} for a while before {b} comes past, and {a} does not say so.',
    'The evening is closing in on a name. At {loc}, {a} and {b} are working out whose.',
  ],
  'after-table': [
    'The doors have just shut. {a} and {b} are at {loc}, and neither of them is ready for bed.',
    'Straight afterwards, at {loc}, {a} and {b} find each other before anybody else does.',
    'The Round Table is over and nobody has moved much yet. {a} and {b} are at {loc}.',
    'At {loc}, minutes after the table, {a} says {b}’s name and {b} stops walking.',
    'People are drifting off. {a} and {b} are still at {loc}, and neither has moved yet.',
  ],
  night: [
    'After lights out, at {loc}, {a} and {b} are the only two still up.',
    'The building has gone quiet. {a} and {b} are at {loc}, talking low.',
    'Late, at {loc}, {a} waits until the corridor is empty before saying anything at all to {b}.',
    'The rest of the doors are shut. {a} and {b} are at {loc}, and nobody knows they are.',
    'It is late enough that the building has stopped creaking. {a} and {b} are at {loc}.',
  ],
};
/** Nobody else in the room, which is a scene in its own right and not a fault. */
// ANY HOUR, ANY PLACE: these open scenes on the road and the hilltop as well
// as indoors, so no room and no door. Fourteen, because a whole day of solo
// scenes is drawn without repeats (see `_primedUsed`).
const ESTABLISH_SOLO = [
  'Nobody else is around. {a} is alone.',
  '{a} is alone, with nobody to perform for.',
  '{a} has a few minutes to {aRef}.',
  '{a} is on {aPos} own for once.',
  '{a} is alone, and glad of it.',
  'For a few minutes, nobody needs anything from {a}.',
  '{a} has slipped away from the others.',
  'The others are somewhere else. {a} is not.',
  '{a} is by {aRef}, and nobody comes looking.',
  'Nobody is watching {a}, or nobody {a} can see.',
  '{a} gets a moment alone.',
  'It is just {a} for a while.',
  '{a} has found the one quiet spot going.',
  '{a} is the only one there.',
];
/** Three or more, which the pair templates cannot honestly describe. */
const ESTABLISH_GROUP = [
  '{names} are at {loc} together, {when}.',
  '{when}, {loc} has {names} in it and nobody else.',
  '{names} end up at {loc} at the same time, {when}.',
  'At {loc}, {when}, it is just {names}.',
];

/**
 * WHICH VOICE SOMEBODY ANSWERS IN.
 *
 * Four classes rather than fifteen, because the thing being selected is
 * DELIVERY and fifteen archetypes do not have fifteen deliveries. Every name
 * below is a valid archetype (AGENTS.md), and the behaviour rules hold: no
 * class here scripts a nice archetype into scheming.
 *
 * The fallback is PROPORTIONAL and never a gameplay threshold — this is text
 * selection, which is the one thing AGENTS.md permits a cut on. Somebody with
 * no archetype on their row answers in the register their stats are loudest in.
 */
const VOICE_BY_ARCHETYPE = {
  hothead: 'blunt', villain: 'blunt', 'challenge-beast': 'blunt', 'chaos-agent': 'blunt',
  mastermind: 'sharp', schemer: 'sharp', 'perceptive-player': 'sharp',
  'social-butterfly': 'warm', hero: 'warm', showmancer: 'warm', 'loyal-soldier': 'warm',
  floater: 'guarded', goat: 'guarded', underdog: 'guarded', wildcard: 'guarded',
};
function _voice(name) {
  const p = (players || []).find(x => x && x.name === name);
  const a = p && p.archetype;
  if (a && VOICE_BY_ARCHETYPE[a]) return VOICE_BY_ARCHETYPE[a];
  const s = (p && p.stats) || {};
  const n = k => Number(s[k]) || 5;
  const bid = {
    blunt: n('boldness') + (10 - n('temperament')),
    sharp: n('strategic') + n('intuition'),
    warm: n('social') + n('loyalty'),
    guarded: (10 - n('boldness')) + (10 - n('social')),
  };
  return Object.keys(bid).sort((x, y) => bid[y] - bid[x])[0];
}

/** Which kind of scene this is, for the purpose of how somebody answers. */
function _reactClass(scene) {
  const f = scene.family || scene.kind;
  if (f === 'trust' || f === 'romance' || f === 'romance-spark') return 'bond';
  if (f === 'grief') return 'loss';
  if (f === 'callback') return 'past';
  if (f === 'journey') return 'road';
  // TESTED AND COVERED ARE NOT PRESSED, and running them through the pressure
  // pools was the first defect found by reading a real day: a card that said
  // "Beardo planted a fake secret with Chet and it never went anywhere" was
  // answered by Chet asking Beardo whether Beardo was all right — a reaction to
  // a confrontation that never happened. A test only works while the other
  // person does not know it is one, and somebody being lied to smoothly is not
  // being questioned. Two different scenes, two different sets of answers.
  // ── THE TEST THAT THE OTHER PERSON WON (Task 7 stage 4) ──────────────
  //
  // THE DEFECT, AND IT WAS RECORDED BEFORE IT WAS FIXED. Every `tested` pool
  // below — reaction and consequence, smooth and adverse — is written from one
  // side: `{a}` set the test, `{b}` is being measured and does not know it.
  // That is true of nearly every testing scene in the pool and it is false of a
  // few, and Task 7 stage 3 found the false ones by reading a real day: on
  // `mission-what-you-saw-out-there:turned` the person being asked takes the
  // conversation over and asks the better question, and on
  // `mission-who-was-where:asked-back` they put the question straight back.
  // Flipping `speaker`/`respondent` fixed the reaction card and broke the
  // consequence card — the screen then said the tester had failed their own
  // test — so stage 3 reverted two of the flips and LEFT THE DEFECT OPEN with a
  // note at both call sites, because no value of one field can satisfy two
  // pools that disagree about who is who.
  //
  // Stage 4 made it worse before it fixed it: rewriting the audit's REWRITE
  // list gave `testing-reverse-psychology` and `testing-follow-through-check` a
  // branch each where the answerer sees the test coming and one where they turn
  // it round, which is three more of the same shape. So the fix is here, where
  // the brief says it belongs — in the screen, not in the library.
  //
  // WHAT THE FIX IS. A fifth react class and a matching consequence family,
  // both written from the OTHER side, selected by an explicit list of branches
  // rather than by a heuristic over the sentence. That is the same discipline
  // ADVERSE_BRANCHES already runs on and for the same reason: the information
  // is in the event, and a list somebody has to maintain deliberately is
  // better than a pattern that quietly stops matching. Those events return
  // `speaker`/`respondent` the way round the scene actually went, so in these
  // pools `{a}` is the person who took the conversation over and `{b}` is the
  // one who came in holding the questions.
  if (TURNED_BRANCHES.has(String(scene.branch || ''))) return 'tested-turned';
  if (f === 'testing') return 'tested';
  if (f === 'cover') return 'covered';
  return 'pressure';
}

/**
 * The branches on which the person being tested ended up running the scene.
 *
 * Five, and every one of them is an event that returns `speaker`/`respondent`
 * pointing the other way on that branch and only on that branch. Anything not
 * on this list keeps the ordinary `tested` register, so a testing branch added
 * next year degrades to the old behaviour rather than crashing.
 */
const TURNED_BRANCHES = new Set([
  // js/tr/castle/mission-fallout.js — stage 3 found these two by reading a day
  'turned', 'asked-back',
  // js/tr/castle/testing.js — stage 4's rewrites off the audit's REWRITE list
  'saw-through-it', 'turned-it-round', 'clocked-the-check',
]);


/**
 * WHEN IT WENT BADLY, IT MUST NOT BE ANSWERED AS THOUGH IT WENT WELL.
 *
 * FIX ROUND 1, C2. The record carries `branch` (js/tr/headless.js) and the
 * castle pools fork on it — `testing-night-scores-it` returns `failed`,
 * `cover-alibi-crumbles` returns `collapses` — and the first version of this
 * screen keyed only on the FAMILY. So a scene whose branch was `failed` and
 * whose stored outcome was `failed-maliciously` was answered with "doesn't
 * think twice about it, which is either the truth or a very good habit" and
 * then closed with "It was failed on purpose, and both of them know that as
 * well." The card said the opposite of the card under it.
 *
 * The tone comes off the stored outcome first (it is the harder fact) and off
 * the branch second. The branch list is not a guess: it is every branch string
 * five real seasons produced, read and sorted by hand. Anything unlisted is
 * `smooth`, which is what this screen already did, so a branch added next year
 * degrades to the old behaviour rather than crashing.
 */
// ── THE BRANCH AND OUTCOME TONE TABLES LIVE IN js/tr/castle/voice.js ──
//
// MOVED THERE BY TASK 7A, UNCHANGED. They were four `Set`s and 560 lines of
// hand-sorted classification sitting in a SCREEN, and Task 7A's episode editor
// (js/tr/episode-editor.js) needs exactly the same answer to the same question
// — is the person answering this scene being leaned on — one layer down, where
// an engine module cannot import a VP file without inverting the dependency.
// Copying the lists would have been the drift this project has a name for; the
// tables are now in the one place both callers can reach, and `BRANCH_TONES`
// below still exports them from here so the coverage arm in
// tests/tr-castle-prose.test.js is untouched.

/** Both lists, for the coverage arm. Nothing else reads them. */
export const BRANCH_TONES = { adverse: ADVERSE_BRANCHES, benign: BENIGN_BRANCHES };

/**
 * ── AN ADVERSE BRANCH IS NOT ANSWERED SMOOTHLY (Task 7 stage 4) ────────
 *
 * The order used to be: outcome first, always, because "it is the harder
 * fact". That is right for `ADVERSE_OUTCOMES`, and it was wrong the other way
 * round, and reading a real day is what showed it:
 *
 *   (action)     Brick ended it rather than let Beardo keep asking, which
 *                Brick considered the decent version.
 *   (reaction)   Brick doesn't make a speech about it. Brick moves closer and
 *                stays there, which is the answer.
 *
 * A refusal answered as an embrace, which is the card-contradicts-the-card-
 * under-it defect this function exists to prevent. The cause is that
 * `turned-back` is one of the five outcomes `outcomeSense` calls "walked", and
 * two different events use it to mean two different things: "the scrutiny came
 * at them and they came out the other side" and "the promise was refused and
 * that ended it". The sense label is a COARSER fact than the branch, not a
 * harder one — it is shared by five endings, and the branch names exactly what
 * happened in this scene.
 *
 * So a smooth outcome no longer overrides an adverse branch. `ADVERSE_OUTCOMES`
 * still overrides a benign one, which is the direction that was always right:
 * a story that ended in an exposure is an adverse scene whatever the branch
 * said on the way in.
 */
function _tone(s) {
  const branchAdverse = ADVERSE_BRANCHES.has(String(s.branch || ''));
  if (s.closedNow && ADVERSE_OUTCOMES.has(s.outcome)) return 'adverse';
  if (s.closedNow && SMOOTH_OUTCOMES.has(s.outcome)) return branchAdverse ? 'adverse' : 'smooth';
  return branchAdverse ? 'adverse' : 'smooth';
}



/**
 * ONE PERSON IN THE SENTENCE IS NOT THE SAME AS ONE PERSON IN THE ROOM.
 *
 * FIX ROUND 1, C1, and it is the most serious thing this screen got wrong.
 * `people` is who the sentence is ABOUT — this file's own comment says so — and
 * the first version read `people.length === 1` as "alone" and then wrote cards
 * that ASSERT solitude: "There is nobody at the terrace steps but Caleb",
 * "there is finally nobody in the room to manage". Over an action card reading
 * "Caleb checked what frightened looked like on the two people nearest them".
 *
 * MEASURED over five real seasons, 528 scenes:
 *
 *   people-based "alone":            152 scenes, 86 of them (57%) have an
 *                                    action line naming another player
 *   actors ∪ people "alone":         113 scenes, 66 of them (58%) do
 *
 * So `actors ∪ people` does NOT fix it either, and THERE IS NO FIELD ON THE
 * RECORD THAT MEANS "ALONE". Solitude is a claim about who witnessed the
 * scene, everything downstream depends on it, and the engine does not record
 * it.
 *
 * What this screen can do without an engine change is REFUSE TO CLAIM IT
 * unless the evidence is there. Presence is `actors ∪ people` — the record's
 * own claim, never widened by names the sentence merely mentions, because a
 * third party who was talked about was not in the room either. On top of that,
 * the solitude pools are refused whenever the engine's own sentence names
 * anybody else, or uses one of the address words below, the scene falls back to
 * SINGLE — one named subject, others may well have been there, and not one card
 * says otherwise.
 *
 * The refusal list is read off the corpus, not guessed: every one of these appears
 * in a line that five seasons composed as "alone" and that plainly was not.
 */
// A REGEX LITERAL, NEVER A BUILT STRING. A '\b' typed inside a JS string
// literal is U+0008, not a word boundary, and the whole matcher then matches
// nothing at all — a detector that silently approves everything. This file's
// sibling guards have shipped that exact trap once already, so the list is
// written as one literal and the arm in tests/tr-castle-prose.test.js proves
// the matcher can still match.
//
// FIX ROUND 2 — THE SECOND HALF OF THE LIST. The first version modelled only
// ADDRESS (asked, told, in front of), and the review found the same defect
// surviving in a class it could not see: company referred to by QUANTITY or by
// a COLLECTIVE noun. "checked what frightened looked like on the two people
// nearest them" and "The column out of the gate got shorter every time" both
// composed as solitary, because neither names anybody and neither asks anybody
// anything. Every phrase below is lifted from a line ten real seasons actually
// composed as alone and that plainly was not.
/**
 * AND NOBODY IS EVER ALONE ON THE ROAD.
 *
 * Reading the corpus a second time turned up a whole class the phrase list can
 * only ever chase one sentence at a time: "looked at how few of them were on the
 * road now", "went over their story on the walk", "rehearsed the story so many
 * times on the way out". Every one of those composed as solitary, and every one
 * of them happens while the entire castle is walking in a line. The journey is
 * not a room somebody can be the only person in — that is a fact about the
 * format, not a pattern in a sentence — so solitude is simply not claimable
 * there, and a structural rule beats another regex.
 */
const NEVER_ALONE_WINDOWS = new Set(['journey-out', 'journey-back']);

const COMPANY_WORDS = /\b(?:ask\w*|questions?|answer\w*|told|tells|replied|agree\w*|volunteer\w*|unprompted|a second time|mid-sentence|read as|(?:one|two|three|four|a few|several) (?:person|people)|the column|the only one|in the open|caught|at breakfast|in front of|everyone|everybody|anyone else|anybody|somebody|someone|the room|the table|nobody at the table|the first person|named a room)\b/i;

function _mode(s, cast) {
  // ── ONE NAMED PARTICIPANT IS A CLAIM, AND IT WINS (Task 7 stage 6) ────
  //
  // FOUND BY DUMPING A DAY AND READING IT, like every other prose defect on
  // this plan. `s.actors` is who the runner CONVENED and `s.people` is who the
  // event said was in the scene, and the union below is right for the observer
  // contract — either claim to having been in the room has to be honoured when
  // deciding who may see what. It is wrong for COMPOSITION. A handful of
  // events are convened as a pair and then report exactly one participant on
  // purpose, because the branch is somebody doing a thing the other person is
  // not present for: `susp-pattern-tracking:tracked` (a private tally the
  // subject knows nothing about), `trust-defend-in-absentia` (the person being
  // defended is upstairs — the audit's only REMOVE verdict, answered as a
  // record fix), `cover-feign-fear:borrowed-it` (a reaction copied without the
  // other person knowing). The union put the absent person back into the roll,
  // and the screen then gave them an action line, a reaction card in their
  // voice and a consequence about them — three cards of a conversation that
  // did not happen. Rendered:
  //
  //   (action) Caleb was not in the room. Beth argued for them anyway.
  //   (reaction) Beth accepts it without promising anything back.
  //
  // So an event that names exactly ONE participant is taken at its word here.
  // It is a positive claim rather than an absence — `sceneParticipants` returns
  // an empty list when an event says nothing, and that case still falls through
  // to the union below. Nothing about the observer split moves: `_view` reads
  // `actors`/`people` itself and is untouched.
  const claimed = [...new Set((s.people || []).filter(Boolean))];
  if (claimed.length === 1) {
    const line = String(s.line || '');
    const namedElse = (cast || []).some(n => n && n !== claimed[0] && line.includes(n));
    if (namedElse || COMPANY_WORDS.test(line)) return { mode: 'single', roll: claimed };
    if (NEVER_ALONE_WINDOWS.has(s.window)) return { mode: 'single', roll: claimed };
    return { mode: 'solo', roll: claimed };
  }
  const present = [...new Set([...(s.actors || []), ...(s.people || [])].filter(Boolean))];
  const roll = present.length ? present
    : [...new Set((s.parties || []).filter(Boolean))];
  if (roll.length >= 3) return { mode: 'group', roll };
  if (roll.length === 2) return { mode: 'pair', roll };
  const line = String(s.line || '');
  const named = (cast || []).some(n => n && !roll.includes(n) && line.includes(n));
  if (named || COMPANY_WORDS.test(line)) return { mode: 'single', roll };
  if (NEVER_ALONE_WINDOWS.has(s.window)) return { mode: 'single', roll };
  return { mode: 'solo', roll };
}

/**
 * ONE NAMED SUBJECT, AND NO CLAIM ABOUT WHO ELSE WAS THERE.
 *
 * These are what a scene gets when the record names one person and the sentence
 * will not support "alone". They put the reader in a room with somebody without
 * emptying it, which is the only honest thing to say when the evidence stops
 * where it does.
 */
// THE HEADER ALREADY SAYS WHERE AND WHEN. These lines used to say both again
// ("Bridgette steps into the woodpile, in the middle of the morning, and keeps
// out of the way"), which read badly and doubled every solo card's opening.
// AND IT SAYS NOTHING ABOUT COMPANY. A one-person scene is not always a
// solitary one — "Brightly ends up in the middle of the group" is one — so an
// opening that put them alone contradicted the next line. `ESTABLISH_SOLO`
// is the pool for scenes that ARE alone.
// NEUTRAL ON PURPOSE: the scene after it may be calm or troubled, and an
// opening that set a mood ("has something on his mind") was contradicted by a
// calm one ("Honestly, I'm feeling alright today") in the same card.
const ESTABLISH_SINGLE = [
  '{a} is quiet.',
  '{a} isn’t saying much.',
  '{a} is keeping {aPos} thoughts to {aRef}.',
  '{a} is watching the others.',
  '{a} is around, not saying much.',
  '{a} is there, hands in {aPos} pockets.',
  '{a} is half listening to the others.',
  '{a} is a step behind the rest of them.',
  '{a} is keeping half an eye on the others.',
];
// ── THE CLOSING LINE WHEN NOTHING COUNTABLE MOVED ──────────────────────
//
// `_receiptConsequence` builds its line out of chips — recorded bond and read
// movements. A scene that moved neither has no chip, and a SOLO scene moves
// neither by construction: one person alone has no interpersonal delta, and
// every event in js/tr/castle/alone.js returns bondDelta 0 for that reason.
// So this pool is not a rare safety net. It is the standard closing line for
// most of the solo pool, and it used to be four sentences all saying that
// nothing had been concluded.
//
// NO CHIP IS NOT NO CONSEQUENCE. It is no NUMBER. What a scene with no number
// still has is somebody who now intends something, is carrying something, or
// is one step nearer a name — and in a format where every hour is evidence
// for a vote that is coming, that is the only closing beat that is true.
// PLAIN, AND TRUE OF ANY SCENE. This used to say "closer to identifying a
// traitor" and "carries the information downstairs" under a scene about
// somebody grieving, or being hungry, or — for a Traitor — hiding, which is
// not a step towards identifying anybody. Read in a real dump, it was the
// line most often wrong about the scene above it.
const FALLBACK_SOLO = {
  smooth: [
    '{a} keeps it to {aRef}.',
    '{a} goes back to the others and says nothing about it.',
    'Nobody sees, and {a} does not bring it up.',
    '{a} decides it can wait.',
    '{a} joins the others a few minutes later, as if nothing had happened.',
    'That is all it is for now, but {a} will not forget it.',
    '{a} feels a little better for it.',
    '{a} lets it go, for today.',
    '{a} is quiet for the rest of the hour.',
    '{a} goes to find the others.',
  ],
  adverse: [
    '{a} comes back looking worse than when {aSub} left.',
    '{a} is rattled, and it shows on {aPos} face.',
    '{a} would like that hour back.',
    'It has not done {a} any good.',
    '{a} goes back to the group in a worse mood than before.',
    '{a} is still thinking about it at dinner.',
    'It leaves {a} unsettled for the rest of the day.',
    'Somebody noticed, and {a} is not sure who.',
    '{a} feels worse for it.',
    '{a} sits out the next conversation entirely.',
  ],
};

// The same, for two people who talked and moved nothing measurable between
// them. Never "they did not reach an agreement" — an agreement was not what
// the scene was for.
const FALLBACK_PAIR = {
  smooth: [
    '{a} and {b} leave it there for now.',
    'Nothing is settled, and neither of them pushes it.',
    '{a} and {b} go back in separately, a minute apart.',
    'They agree to talk again later.',
    '{a} and {b} go back to the others without saying much.',
    'Neither of them brings it up again today.',
    '{a} and {b} part on good terms.',
    'It ends there, and both of them seem fine with that.',
  ],
  adverse: [
    '{a} and {b} stop before either of them says something they cannot take back.',
    'It ends because somebody else walks in, not because they are finished.',
    '{a} and {b} leave it, but it is not over.',
    '{a} goes one way and {b} goes the other.',
    'It ends badly, and both of them know it.',
    'They will be polite at dinner. That is about all.',
    '{a} walks off first. {b} does not follow.',
    'Neither of them has changed their mind.',
  ],
};


// ══════════════════════════════════════════════════════════════════════
// TOPIC-GROUNDED SCENES — the reader can name who, the concrete subject,
// what happened, and what changed
// ══════════════════════════════════════════════════════════════════════
//
// A castle scene used to close on a generic consequence drawn by family/tone:
// "{a} will watch where {b} stands tonight". For a scene where {a} confided a
// suspicion of a THIRD person ({c}) to {b}, that names the wrong subject — the
// person watched is {c}, not the confidant {b}. Worse, it fell back on "it /
// whatever this is" with no antecedent on the card.
//
// A REWORKED event's fire() records a concrete `topic` (a name or short phrase
// SOURCED FROM SIM DATA — the suspect discussed, the promise made, the mission
// fact) and a `topicKind`. When the composer sees both, it draws the closing
// consequence from a topic pool keyed by the event's own branch, so every
// sentence follows an actual cause on the record and names the thing it is
// about. `{topic}` fills from that recorded subject. Legacy (un-reworked)
// events leave `topic` null and keep the old generic wrapping unchanged.

// susp-out-of-earshot: {a} raised a THIRD person's name ({topic}) to {b} on the
// road. {b} is the confidant, not the subject — the change is a suspicion of
// {topic} plus what the road revealed about {b}.
const CONSEQ_ROAD_THIRD_NAME = {
  agreed: [
    '{a} and {b} come back agreed on {topic}. Neither has proof, but both will vote that way.',
    'By the gate, {a} and {b} have stopped hedging about {topic}. One more person is watching {topic}, and {topic} doesn’t know it.',
    '{a} went out suspecting {topic} alone and came back with {b} on side. The two of them are closer, and {topic} is in more trouble.',
  ],
  hedged: [
    '{a} is as sure about {topic} as before, and much less sure about {b}, who wouldn’t say either way.',
    '{b} listened about {topic} and gave nothing back. {a} walks in wondering whose side {b} is on.',
    '{a} raised {topic} and got a shrug from {b}. {a} still suspects {topic}, and now trusts {b} a little less.',
  ],
  defended: [
    '{a} learned nothing new about {topic}, but did learn that {b} won’t turn on {topic}.',
    'The name {a} tried was the one name {b} protects. {a} still suspects {topic}, and now knows {b} won’t help.',
    '{b} shut the talk about {topic} down flat. {a} still suspects {topic}, and now wonders why {b} defended {tObj} so fast.',
  ],
  'named-somebody-else': [
    '{a} went out suspecting {topic} and came back with a second name from {b}. Both are on {a}’s list now.',
    '{b} wouldn’t agree about {topic} and offered another name instead. {a} now has two suspects instead of one.',
    '{topic} stays on {a}’s list, and {b}’s suggestion goes on beside it. The walk made things less clear, not more.',
  ],
  'would-not-talk-about-it': [
    "{topic}’s name went nowhere on that road. What {a} took home is that {b} will not say a word out of earshot — and that silence had a shape.",
    '{a} raised {topic}, and {b} changed the subject. {a} still suspects {topic}, and now wonders about {b} too.',
    '{b} wouldn’t talk about {topic}, or anyone. {a} walks in wondering why {b} is being so quiet.',
  ],
};

// susp-let-it-go-on-the-road-back: {a} walked the suspect ({topic} === {b})
// home, asking all the way. The change is on the doubt about {topic}.
const CONSEQ_ROAD_SUSPECT_WALK = {
  cleared: [
    '{a} questioned {topic} all the way home and came away satisfied. {a} doesn’t suspect {topic} any more.',
    '{topic} answered every question on the walk without wavering. By the gate, {a} has let the suspicion go.',
    '{a} went out doubting {topic} and came back an ally.',
  ],
  slipped: [
    '{topic} told {a} one version of the afternoon early on the walk and a different one near the gate. {a} is far more suspicious now.',
    '{a} caught {topic} telling the same story two different ways. That is something {a} could say at the table.',
    'Somewhere on the road {topic}’s story stopped matching itself, and {a} heard it. {a} is much more suspicious now.',
  ],
  hardened: [
    '{topic} stuck to the story the whole way home, and {a} believed none of it. The doubt only got stronger.',
    '{topic} gave {a} a perfect answer every time, and {a} trusts {topic} less because of it.',
    'Nothing {topic} said was wrong, but {a} came home more suspicious than ever.',
  ],
};

// cover-road-rehearsal (reworked): a Traitor rehearsed the answer to a SPECIFIC
// live suspicion aimed at them ({topic} = what they are being asked to account
// for). The change is whether that answer will hold at the table.
const CONSEQ_ROAD_COVER = {
  airtight: [
    '{a} has the story about {topic} word-perfect now. If it comes up at the table, {a} is ready.',
    'By the gate {a} has an answer for every question about {topic}.',
    '{a} found the weak spot in the story about {topic} and fixed it on the walk.',
  ],
  serviceable: [
    'The story about {topic} mostly holds. There is still one part {a} can’t tell the same way twice.',
    '{a}’s story about {topic} works, as long as nobody pushes on the middle of it.',
    'The story about {topic} works if nobody leans on it. {a} is hoping nobody does.',
  ],
  overcooked: [
    '{a} rehearsed the story about {topic} so often that it now sounds rehearsed.',
    '{a}’s story about {topic} has too many details, and {a} knows an honest person wouldn’t remember that much.',
    'By the gate {a} has polished the story about {topic} so much that it no longer sounds true.',
  ],
  'stopped-rehearsing': [
    '{a} realises that rehearsing is what gets people caught, and stops. If {topic} comes up, {a} will answer it fresh.',
    '{a} stops rehearsing the story about {topic}, and will only tell it if someone asks.',
    '{a} has seen people caught for sounding too prepared, and won’t over-prepare the story about {topic}.',
  ],
  'could-not-get-it-straight': [
    '{a} can’t get through the story about {topic} once without losing part of it.',
    'Every time {a} goes over {topic}, it comes out in a different order.',
    '{a} spends the whole walk on the story about {topic}, and ends up less sure of it.',
  ],
};

// cover-story-survived-the-day: a Traitor's account of {topic} (the night the
// last victim was murdered) either lasted the whole day out or came apart on it.
const CONSEQ_ROAD_COVER_BACK = {
  held: [
    "{a}'s story about {topic} held up all day. Nobody questioned it, and {a} comes home with it intact.",
    'A day of questions, and not one landed on {topic}. {a} comes home with the story intact.',
    '{a} told the same story about {topic} to each person who asked, and none of them questioned it.',
  ],
  frayed: [
    "{a}'s story about {topic} got home, but it changed on the road: {a} has to remember a different version now than the one {a} left with.",
    'The story about {topic} held, just. {a} spends the walk back working out which part is weakest.',
    'Someone remembered {topic} differently, and {a} had to go along with it. The story has a patch in it now.',
  ],
  broke: [
    'The story about {topic} fell apart in front of people, and {a} couldn’t fix it.',
    '{a} answered about {topic} too fast, and the story fell apart where people could hear.',
    'The story about {topic} didn’t survive the day. {a} walks back in without an alibi.',
  ],
};

// testing-who-you-walk-with: {a} chose to walk with {topic}, and what {topic}
// did with the pick is the test. The change is the read on {topic}.
const CONSEQ_ROAD_WALK_TEST = {
  flattered: [
    '{a} chose to walk with {topic}, and {topic} took it as a compliment. They are closer now, and {a} learned what {a} wanted to.',
    '{topic} walked beside {a} the whole way and was honest. {a} trusts {topic} a little more now.',
  ],
  wary: [
    '{a} learned less about {topic} than {a} hoped. {topic} kept the walk pleasant and gave nothing away.',
    '{topic} answered carefully the whole way. {a} is no surer of {topic}, and wonders what the care is hiding.',
  ],
  transactional: [
    '{topic} made the road a negotiation. Nothing was decided, but both of them know a deal is on the table now.',
    '{a} wanted a friend and got a deal instead. At least {a} now knows exactly what {topic} wants.',
  ],
  'would-not-be-picked': [
    '{topic} refused to walk with {a}, quickly and in front of people. {a} has an answer, and not the one {a} wanted.',
    'By the top of the hill {topic} had walked on ahead. {a} is further from {topic} than {a} thought.',
  ],
  'turned-it-around': [
    '{a} wanted to read {topic}, but {topic} spent the walk reading {a} instead.',
    "The walk was somebody else's idea and {topic}'s afternoon. {topic} gave away nothing and learned plenty, and now one more person knows how good {topic} is at exactly that.",
  ],
};

// A suspicion scene ABOUT AN ABSENT THIRD PARTY ({topic}): two people ({a}, {b})
// turn over somebody who is not in the room. The generic suspicion consequence
// names {b} (the confidant) by mistake; this names {topic}. Keyed by a coarse
// direction (the read hardened / eased / went nowhere), not by each event's
// branch labels, so one pool serves whisper, timeline and overheard alike.
const CONSEQ_SUSP_THIRD = {
  up: [
    '{a} comes away more sure about {topic}, and now {b} has heard the name too. Neither has proof; both are watching {topic}.',
    '{a} and {b} both suspect {topic} more now. Still no proof, but they agree.',
    "{a} and {b} both leave more suspicious of {topic} than they were when they sat down.",
  ],
  down: [
    '{a} came in doubting {topic} and leaves a little less sure — whatever {b} said took some of the weight off {topic}.',
    'The doubt about {topic} eased between {a} and {b}. It is not gone; it is lighter.',
    '{a} lets some of the doubt about {topic} go, because {b} didn’t think there was much in it.',
  ],
  // nobody with {a}: there is no {b} to share it with
  alone: [
    '{a} saw it alone and has told nobody yet. {topic} is being watched now.',
    'Nobody else saw it. {a} is keeping it, and keeping an eye on {topic}.',
  ],
  // {b} put up a different name: {a} is still on {topic}, {b} is not
  split: [
    '{a} is still on {topic}. {b} has another name, and neither talked the other round.',
    '{b} did not buy it. {a} still has {topic}; {b} is looking somewhere else.',
  ],
  // the hour they were checking turned out to have one of THEM in it
  inside: [
    'They set out to check {topic} and found one of themselves in the same hour. {a} and {b} are warier of each other now.',
    'They were checking {topic}’s hour, and one of them turns out to have been in it too. That is what {a} and {b} will both remember.',
  ],
  flat: [
    "{topic}'s name went between {a} and {b} and settled nothing. The read on {topic} is exactly where it started.",
    '{a} and {b} talk about {topic} and get nowhere.',
    '{b} wouldn’t be drawn on {topic}, so {a} is left with the same doubt as before.',
  ],
};
// How a suspicion scene's branch moves the read, for the consequence direction
// and the hunch chip alike. FLAT = a refusal / disagreement / inconclusive
// check (nothing moved). EASE = the doubt was answered or came up empty.
// Everything else HARDENS the read.
const SUSP_FLAT_BRANCHES = new Set(['would-not-join-in', 'lost-the-hour', 'argued-about-it']);
const SUSP_EASE_BRANCHES = new Set(['checked-out', 'was-nothing', 'let-it-pass',
  'holds', 'it-worked', 'let-it-go', 'cleared']);
/** 'flat' | 'down' | 'up' for a suspicion scene, from its branch and outcome. */
function _suspDir(s) {
  const b = String(s.branch || '');
  if (SUSP_FLAT_BRANCHES.has(b)) return 'flat';
  const eased = SUSP_EASE_BRANCHES.has(b) || (s.closedNow && s.sense === 'walked')
    || /denied-convincingly|checked-out|cleared/.test(String(s.outcome || ''));
  return eased ? 'down' : 'up';
}

// A TEST is run BY {a} ON {topic} (the tested person, {b}). The generic close
// ("For {names}, that is the end of it") never said what the test SHOWED about
// the person it was run on. This names {topic} and states what {a} came away
// believing about them. Keyed by a coarse RESULT, not by each event's branch
// labels, so one pool serves all eleven testing events. A test reads CHARACTER,
// not alignment (see testing.js's header), so these speak of trust and doubt,
// never of "a Traitor".
const CONSEQ_TESTING = {
  held: [
    '{other} trusts {topic} a little more after that. {topic} passed without knowing it was a test.',
    '{topic} gave nothing away, and {other} is satisfied.',
    '{topic} never noticed the test, and passed it.',
    '{other} finds no reason to doubt {topic} after the check.',
    '{other} got the reassurance {other} wanted about {topic}.',
  ],
  failed: [
    '{other} didn’t like how {topic} answered, and can’t stop thinking about it.',
    '{topic} failed a test {tSub} didn’t know about, and only {other} knows.',
    'The test pointed at {topic}, and now {other} is watching {tObj}.',
    '{other} already half-doubted {topic}. Now the doubt is stronger.',
    '{topic} did exactly what {other} was afraid of, right in front of {oObj}.',
  ],
  spotted: [
    '{topic} worked out it was a test, and knows {other} set it.',
    '{other} tried to read {topic}, but {topic} saw through it.',
    '{topic} called it a test to {other}’s face.',
    '{topic} turned it round and learned more about {other} than {other} learned about {tObj}.',
    '{topic} caught {other} testing {tObj}, and {other} can’t try that again.',
  ],
  bargained: [
    '{topic} said yes, on terms. {other} got the promise, and now owes one back.',
    'A deal, struck on {topic}’s terms. {other} will find out later what it cost.',
    '{other} has {topic} on side now, at a price {topic} set.',
  ],
  inconclusive: [
    '{other} found no evidence that either cleared or implicated {topic}.',
    '{other} learned nothing about {topic} either way.',
    'The answers left {other} no more certain about {topic} than before.',
    '{other} still cannot decide whether {topic}’s account is reliable.',
    'The check produced no useful conclusion about {topic}.',
  ],
};
// A test's RESULT, coarsened from each event's branch labels. SPOTTED = the
// tested person realised they were being measured, or turned it back. Otherwise
// the branch either reassured the tester (HELD), worried them (FAILED), or told
// them nothing (INCONCLUSIVE).
const TEST_SPOTTED = new Set(['named-the-test', 'saw-through-it', 'turned-it-round',
  'asked-it-back', 'made-a-condition', 'asked-why-twice', 'said-it-aloud',
  'clocked-the-check', 'caughtTest']);
// AGREED, ON TERMS: a yes with a price is a bargain struck, not a test caught
const TEST_BARGAINED = new Set(['made-a-condition']);
const TEST_HELD = new Set(['complied', 'over-delivered', 'checks-out', 'sincere',
  'stayed-calm', 'reassured', 'consistent', 'read-it-right', 'kept-it',
  'followed-through', 'keptQuiet', 'confirmed']);
const TEST_FAILED = new Set(['refused', 'inconsistent', 'reluctant', 'refuses',
  'got-rattled', 'hedged', 'would-not-repeat-it', 'half-kept-it', 'dropped-it',
  'malicious', 'innocent', 'failed', 'bad']);
/** 'held' | 'failed' | 'spotted' | 'inconclusive' for a testing scene. */
function _testDir(s) {
  const b = String(s.branch || '');
  if (TEST_BARGAINED.has(b)) return 'bargained';
  if (TEST_SPOTTED.has(b)) return 'spotted';
  if (TEST_HELD.has(b)) return 'held';
  if (TEST_FAILED.has(b)) return 'failed';
  return 'inconclusive';
}

// CONFRONTATION (js/tr/castle/confrontation.js). How the open clash left the
// person it was aimed at (`{topic}`). Branch names map one-to-one; the generic
// fallback keeps a card that grows a new branch from ever going blank.
function _confrontDir(s) {
  const b = String(s.branch || '');
  if (b === 'cracked' || b === 'crumbled' || b === 'backfired') return 'exposed';
  if (b === 'turned') return 'turned';
  if (b === 'blew-up') return 'blew-up';
  if (b === 'worked' || b === 'weathered' || b === 'overreached') return 'defended';
  // MADE UP, NOT HELD: a branch that ended in a hug or a handshake fell through
  // to 'held' and was captioned "openly at war" under "No more of this." / "Agreed."
  if (b === 'cleared-the-air' || b === 'said-what-they-meant' || /made-up|apolog|forg|settled/.test(b)) return 'aired';
  if (b === 'made-it-worse') return 'blew-up';
  return 'held';
}
const CONSEQ_CONFRONT = {
  aired: [
    '{a} and {topic} said it to each other’s faces, and it is out of the way now.',
    'It got said, and it got settled. {a} and {topic} are easier with each other for it.',
    'Nobody won, but {a} and {topic} walked off on better terms than they arrived.',
  ],
  held: [
    '{a} got nothing out of {topic}, and the room saw {topic} stay calm under pressure.',
    'The accusation proved nothing, except that {a} and {topic} are now open enemies.',
    '{topic} gave {a} nothing. From now on, the two of them are openly at war.',
  ],
  exposed: [
    '{topic} came off worse. People will remember the flinch more than anything that was said.',
    '{topic} cracked under it, and people are watching {tObj} more closely now.',
    '{topic} didn’t hold up, and now the room has a reason to keep an eye on {tObj}.',
  ],
  turned: [
    '{topic} turned it round, and now {a} is the one on the back foot.',
    '{a} meant to corner {topic} and ended up having to explain {aRef}.',
    '{topic} turned it around, and now people are wondering about {a} instead.',
  ],
  'blew-up': [
    'Nothing got settled, but {a} and {topic} are openly at war now, and the others will have to pick a side.',
    '{a} and {topic} can’t stand each other, and they no longer hide it.',
    'The fight proved nothing about {topic}, but it showed exactly how {a} and {topic} feel about each other.',
  ],
  defended: [
    '{topic} came through it, and people noticed who took which side.',
    'Whatever was meant to land on {topic} didn’t, and {topic} is still standing.',
    '{topic} got through it, maybe a little too easily.',
  ],
};

// CONFRONTATION-DEFENCE (confrontation.js confront-defend-the-accused). `{a}`
// stood up for `{topic}`; the direction is what that got them both.
function _defenceDir(s) {
  const b = String(s.branch || '');
  if (b === 'worked') return 'safe';
  if (b === 'drew-fire') return 'spread';
  return 'unmoved';
}
const CONSEQ_DEFENCE = {
  safe: [
    '{topic} came through it because of {a}, and owes {a} for it.',
    'The doubt eased off {topic}, and people saw {a} risk {aPos} own standing to do it.',
    '{topic} is safer than an hour ago, and now tied to {a}, whether either of them likes it or not.',
  ],
  unmoved: [
    'The defence changed nothing. {topic} is as suspected as before, and {a} risked {aPos} own standing for nothing.',
    '{topic} is no better off, and people will remember that {a} tried.',
    'It didn’t help {topic}, and {a} has shown whose side {a} is on.',
  ],
  spread: [
    'Standing up for {topic} made {a} a target too. Now both of them are being watched.',
    'Now {a} and {topic} are tied together. Whatever hits one will hit the other.',
    'Defending {topic} put {a} under suspicion too.',
  ],
};

// COVER (Traitor-only). Three shapes, all closing on whether the Traitor got
// away with it and NAMING the concrete subject the generic close never did.
// {a} is always the Traitor (every cover event drives from the acting player;
// none flips the speaker), {topic} is the named subject.
//
// cover-deflect — {a} tries to hang suspicion on {topic} (an ally sacrificed, a
// name planted, a Faithful double-bluffed).
const CONSEQ_COVER_DEFLECT = {
  held: [
    '{a} got {topic}’s name to stick, and nobody noticed who said it first. One more person is watching {topic} now.',
    'The suspicion {a} pointed at {topic} took hold. {topic} does not know where it started, and {a} means to keep it that way.',
    '{a} walked away clean and left {topic} carrying a doubt {topic} didn’t earn.',
    '{a} put {topic} in the frame and stepped out of it. The room is looking the wrong way.',
  ],
  slipped: [
    '{a} pushed {topic}’s name too hard, and people noticed the pushing. Now {a} is the one who looks suspicious.',
    'The move against {topic} was a little too neat, and {a} could feel it land wrong.',
    '{a} tried to throw suspicion on {topic}, and it bounced back. Now people are asking about {a}.',
    '{a} overplayed it. The suspicion didn’t stick to {topic}, and some of it stuck to {a} instead.',
  ],
  turned: [
    '{topic} refused to take the blame, and said so where people could hear. {a} is back to square one.',
    '{a} tried to put it on {topic}, and {topic} threw it straight back. Now {topic} knows {a} was trying.',
    'Nobody took the bait on {topic}, and {a}’s plan came to nothing.',
    '{topic} played along long enough to see what {a} was doing, then stopped. {a} gave the game away for nothing.',
  ],
  abandoned: [
    '{a} had {topic}’s name ready, then decided not to say it.',
    '{a} changed {aPos} mind about pointing at {topic} at the last second, and saves it for later.',
    '{a} stopped before saying {topic}’s name. Nobody will know how close it came.',
    '{a} keeps {topic}’s name in reserve for another day.',
  ],
};
// cover-blend — {a} hides inside the grief around {topic} (a murdered player's
// friend, whose circle {a} is not really part of).
// cover-bluff — {a} points at the Traitors' own side, to {topic}, to look
// like the last person who could be one.
const CONSEQ_COVER_BLUFF = {
  held: [
    '{topic} believes {a} now. Somebody who points at their own side cannot be one of them, as far as {topic} is concerned.',
    '{a} gave {topic} a doubt about the pact and took {topic}’s trust in return.',
  ],
  slipped: [
    '{a} gave {topic} more than intended, and {topic} is going to take it to the table.',
    'The hint was too good. {topic} has a name now, and {a} cannot take it back.',
  ],
  turned: [
    '{topic} asked the one question {a} had no answer for, and is still thinking about it.',
    '{topic} wanted a reason, and {a} did not have one ready.',
  ],
  abandoned: [
    '{a} thought better of it and left the name unsaid.',
  ],
};
const CONSEQ_COVER_BLEND = {
  held: [
    '{a} joined in the grief for {topic}, and looked like just another person who was sad.',
    '{a} sat with {topic}, and nobody thought {a} didn’t belong there.',
    '{a} spent the evening with {topic}’s friends, and fitted in without anyone noticing.',
    '{a} got close to {topic} without a wrong note. {topic} has no idea a Traitor just used {tObj} to hide.',
  ],
  slipped: [
    '{a} overdid it with {topic}, too sad and too fast, and {topic} half-noticed.',
    '{a} tried to blend in with {topic}’s friends and stood out instead. It looked like a performance.',
    '{a} pushed too hard to get into {topic}’s group, and it showed that {a} isn’t one of them.',
    '{a} tried to share {topic}’s grief, and {topic} didn’t warm to it. People noticed.',
  ],
  turned: [
    '{topic} kept {a} at arm’s length all evening, politely. {a} won’t be able to hide in that group.',
    '{topic} didn’t want company, least of all {a}’s.',
    '{a} went to stand with {topic} and wasn’t made welcome. {a} moves on and keeps a low profile.',
    '{topic} made room for the others but not for {a}. {a} won’t try that again.',
  ],
  abandoned: [
    '{a} decided not to sit with {topic}’s people, and drifted off before it looked deliberate.',
    '{a} decided not to join {topic}’s group, and kept to the corner instead.',
    '{a} left {topic}’s grief to {topic}’s friends and stayed out of it.',
    '{a} backed away from {topic}’s table before sitting down, and kept a low profile.',
  ],
};
// cover-account — {a} defends, rehearses, or sits alone with the account of
// {topic} (the night the last victim was murdered, or the recruitment approach,
// or — on the first day — what {a} really is).
const CONSEQ_COVER_ACCOUNT = {
  held: [
    '{a}’s story about {topic} is holding. {a} told it the same way to two people, and neither blinked.',
    '{a} got through questions about {topic} without a slip. One more day survived.',
    '{a} told the story about {topic} out loud, and it held. {a} will sleep a little easier.',
    '{a}’s story about {topic} is solid, and nobody has a reason to question it.',
  ],
  slipped: [
    '{a}’s story about {topic} cracked where somebody could see it.',
    '{a} told the story about {topic} once too often, and it stopped sounding true.',
    'Something in {a}’s story about {topic} didn’t add up, and {a} could tell people noticed.',
    '{a} slipped up about {topic} in front of the wrong person. It’s small, but it will be remembered.',
  ],
  turned: [
    'Somebody pushed {a} on {topic} harder than expected, and {a} had to change the story.',
    '{a} was asked about {topic} straight out and answered a second too slowly. People will remember the pause.',
    'Someone else brought up {topic} before {a} could, and now {a} is on the back foot.',
    '{a}’s story about {topic} didn’t quite match someone else’s, and {a} spends the night worrying about it.',
  ],
  abandoned: [
    '{a} decided to say nothing at all about {topic}.',
    '{a} had a story about {topic} ready, and decided not to tell it.',
    '{a} backed off {topic} before anyone asked. Nobody will know there was a story ready.',
    '{a} let {topic} drop rather than defend it.',
  ],
};
// cover-weight — {a} sits ALONE with the account of {topic}. No audience, so it
// never "cracks in the open"; the axis is whether {a} is holding together.
const CONSEQ_COVER_WEIGHT = {
  held: [
    '{a} got through another night with {topic} on {aPos} mind, and nobody could tell.',
    '{a} sat alone with {topic} and stayed steady. Tomorrow {a} has to do it all again.',
    "{a} has stopped fighting {topic} and started managing it. The secret is {a}'s weight to carry.",
    '{a} thought hard about {topic} in the dark, and didn’t flinch.',
  ],
  slipped: [
    '{a} lay awake thinking about {topic}. Nobody saw anything, but {a} is getting tired.',
    '{a} nearly told someone about {topic}, and stopped just in time.',
    '{a} couldn’t sleep for thinking about {topic}. The secret is wearing {aObj} down.',
    '{a} went over {topic} again in the dark. The lie is holding, but {a} is wearing out.',
  ],
  turned: [
    '{a} nearly confessed about {topic} just to be rid of it, and stopped in time.',
    'For a moment {topic} got the better of {a}. Nobody saw, but {a} is frightened it could happen again.',
    '{a} had one bad hour over {topic}, and only got through it because morning came.',
    "{a} nearly said {topic} out loud without meaning to, and caught it just in time. The danger now is {a}'s own mouth.",
  ],
  abandoned: [
    '{a} tried to stop thinking about {topic}, and couldn’t.',
    '{a} tried to leave {topic} until morning and took it to bed instead.',
    '{a} tried to put {topic} aside for one night, and failed.',
    '{a} wanted one night without thinking about {topic}, and didn’t get it.',
  ],
};
// GRIEF (mourning). {topic} is the murdered person. This family KEEPS its
// reaction beat — a comfort beat over a death is coherent, not a wrong-subject
// redundancy — and only the closing consequence is grounded, so it names the
// dead. Lines use {a} and {topic} ONLY (never {b}), so one pool is safe over the
// solo scenes (a keepsake pocketed, somebody numb) and the pair scenes alike.
const CONSEQ_GRIEF = {
  closer: [
    'Grieving {topic} out loud left {a} feeling less alone.',
    'Losing {topic} drew {a} closer to the others who felt it too.',
    '{a} said what {topic} had meant, and found {a} wasn’t the only one who felt it.',
    'Talking about {topic} helped {a} more than {a} expected it to.',
    'With {topic} gone, {a} leans on the people who are still here.',
  ],
  apart: [
    'The loss of {topic} put something cold between {a} and the room, and {a} let it.',
    'Grieving {topic} pushed {a} away from the others instead of closer.',
    '{a} feels more alone after mourning {topic}, not less.',
    'Talking about {topic} made things awkward between {a} and the others.',
    '{a}’s grief for {topic} turned into anger at the room.',
  ],
  borne: [
    'The chair where {topic} sat is still the first thing {a} sees in that room, and will be tomorrow.',
    '{topic} being gone is the first thing {a} thinks about in the morning and the last thing at night.',
    '{a} has not worked out how to be in that room without {topic} in it, and did not manage it today either.',
    '{a} carries the loss of {topic} without saying a word about it, and it does not get lighter.',
    '{a} keeps expecting {topic} to come round the corner, and keeps being wrong, all morning.',
  ],
};
// GRIEF-VIGIL — the two solitary-crisis grief scenes (someone-cries-alone,
// nobody-sleeps). These were LEFT LEGACY because their subject is a mix: some
// mornings the person is grieving the dead, some they are lying awake over
// their OWN name at the last table. So the topic is set PER BRANCH in the
// event, and the branch is coarsened here into four registers that each name
// their real subject: MOURNED/BANISHED name the departed ({topic} = the dead,
// branched on death-vs-banishment from the round record); HAUNTED/RESTLESS name
// the person's own precarity ({topic} = the actor themself, so {a} IS the
// subject). KEEPS its reaction beat (a solo grief reaction is coherent).
const CONSEQ_GRIEF_VIGIL = {
  mourned: [
    '{a} keeps counting the chairs and coming up one short for {topic}.',
    '{a} spent the whole day thinking about {topic}, and none of it helped.',
    '{a} went somewhere private to grieve {topic}, and came back feeling no better.',
    '{a} keeps half-expecting to hear {topic} in the corridor.',
    '{a} grieved {topic} alone and put it away before anyone could see.',
  ],
  banished: [
    '{a} sat alone with the fact that the room chose to send {topic} home.',
    '{topic} was sent home by a vote {a} took part in, and that feels worse than a murder.',
    'With {topic} banished, {a} has nobody to blame but the people still here.',
    '{a} spent the quiet hours looking at the seat {topic} left empty.',
  ],
  haunted: [
    "{a} could not stop counting how many people had written {a}'s name down at that table.",
    '{a} is no safer than before, but now knows exactly who to watch.',
    "{a} lay awake less worried about who went home than about how many votes had {a}'s name on them.",
    '{a} lay awake going over who had written {aPos} name, until it got light.',
  ],
  restless: [
    "{a} talked {a}'s self into suspecting somebody, and by morning could not remember why.",
    '{a} chewed on a hunch all night and it was still a hunch by morning.',
    '{a} had a bad feeling with nothing to back it up, and couldn’t shake it.',
    '{a} went looking for a reason to be afraid, found none, and stayed afraid anyway.',
  ],
  // was-found: somebody came upon the crier and stayed. Role-neutral — the pool
  // names the dead against BOTH of them, so it does not matter which of the pair
  // the composer puts first (see grief.js: the recorded pair is left as-is).
  comforted: [
    'The two of them sat together for a while, missing {topic}.',
    'Neither of them had to grieve {topic} alone this morning, and both felt better for it.',
    'They fixed nothing about {topic} being gone. They just made sure nobody had to face it by themselves.',
    'Sharing the loss of {topic} made it a little easier for both of them.',
    'Neither of them said much about {topic}. Sitting together was enough.',
  ],
};
/** mourned | banished | haunted | restless for a grief-vigil scene. The event
 * chooses the register directly (`topicDir`), because whether a scene mourns the
 * dead or frets over the actor's own name is not something the branch label
 * alone can tell the composer; see grief.js. */
function _vigilDir(s) {
  return s.topicDir || 'mourned';
}

// ROMANCE. {topic} is the partner; the relationship is symmetric, so lines use
// {other} (the non-topic partner) and {topic}, safe whichever way a flip branch
// (a breakup ended BY the partner) orders them. KEEPS its reaction beat.
const CONSEQ_ROMANCE = {
  warmed: [
    '{other} and {topic} are more serious about each other than they were this morning.',
    '{other} and {topic} get a little closer.',
    'It went well for {other} and {topic}. They are starting to rely on each other.',
    '{other} and {topic} took a step they can’t easily take back. It’s a comfort, and a risk.',
    '{other} and {topic} feel steadier together, and want to protect that.',
  ],
  cooled: [
    'Things cooled between {other} and {topic}, and neither pretended otherwise.',
    '{other} and {topic} drift apart again, and other people will notice.',
    'It went badly for {other} and {topic}. What felt safe yesterday doesn’t now.',
    '{other} and {topic} are further apart than this morning, and people can tell.',
    'Something has shut down between {other} and {topic}.',
  ],
  tangled: [
    'Things between {other} and {topic} got more complicated.',
    'For {other} and {topic}, it’s now half feelings and half strategy.',
    'The castle is starting to have opinions about {other} and {topic}, which is the last thing they want.',
    'Whatever {other} and {topic} decided, the game was on both their minds.',
    '{other} and {topic} can’t tell any more whether they are protecting each other or using each other.',
  ],
};
// CALLBACK. {topic} is the person the actor shares prior-season history with.
// KEEPS its reaction beat; uses {other} + {topic}.
const CONSEQ_CALLBACK = {
  warmed: [
    'The old friendship between {other} and {topic} is working for them again. They know how the other plays.',
    '{other} and {topic} find they still get on, just like last time.',
    'Their history from another season works in {other} and {topic}’s favour.',
    'The old understanding between {other} and {topic} still holds.',
  ],
  cooled: [
    'The old trouble between {other} and {topic} is back, and the room can feel it.',
    '{other} and {topic} reopened something from another season, and it still hurts.',
    'Old business between {other} and {topic} came back, and neither will let it go.',
    'What happened between {other} and {topic} before still sours things between them.',
  ],
  noted: [
    'It is out now that {other} and {topic} go back a long way, and people will treat them as a pair.',
    '{other} and {topic} couldn’t keep their past quiet, and now people are wondering what it means.',
    'The room has noticed that {other} and {topic} have history, and that could cost them.',
    'The old connection between {other} and {topic} is common knowledge now, and that makes them a target.',
  ],
};
// CALLBACK-ABSENCE — the two once-skipped callback events, both about the
// ABSENCE of a shared past rather than a shared past itself. warns-newbies: {a}
// has history with {topic} (a threat) and hands a read to {b}, a newbie who has
// none. no-history-envy: {a} has no history with {topic} and sits outside a
// story {b} can tell. Both name {topic} — the person the missing history is
// ABOUT — and frame who is short of it. KEEP the reaction beat (callback).
const CONSEQ_CALLBACK_WARNING = {
  'took-it': [
    '{a} warned {b} about {topic}, and {b}, who has never played with {topic}, has to take {a}’s word for it.',
    '{b} is now watching {topic}, purely on {a}’s say-so.',
    '{b} takes on {a}’s view of {topic}, having nothing of {bPos} own to go on.',
    '{b} leaves with {a}’s warning about {topic} and no way to check it.',
  ],
  'had-it': [
    '{a} warned {b} about {topic}, but {b} had already worked it out.',
    '{b} didn’t need the warning about {topic}. {b} had already seen enough.',
    '{a} told {b} about {topic}, and {b} nodded. {b} had reached the same view alone.',
    'The warning about {topic} only confirmed what {b} already thought.',
  ],
  refused: [
    '{b} trusts what {b} has seen of {topic} more than what {a} remembers, and said so.',
    '{b} didn’t buy {a}’s warning about {topic}, and sided with {topic}.',
    '{b} told {a} the history with {topic} was {a}’s problem, and defended {topic}.',
    '{b} heard {a} out and sided with {topic} anyway. The warning hurt {a} more than {topic}.',
  ],
  'spent-it': [
    '{b} took {a}’s warning about {topic} and used it straight away.',
    '{a} meant it as a warning, but {b} used it as ammunition against {topic}.',
    'Within the hour, {b} was using {a}’s story about {topic} against {tObj}.',
    '{b} turned {a}’s old history with {topic} into a weapon before {a} had even finished talking.',
  ],
};
const CONSEQ_CALLBACK_ENVY = {
  'left-out': [
    '{a} sat through a conversation about {topic} with nothing to add, and felt like an outsider.',
    '{b} had stories about {topic}, and {a} could only listen. {a} feels left out.',
    '{a} has no history with {topic}, and an hour of {b} reminiscing made that clear.',
    'A story about {topic} went round that {a} wasn’t part of, and {a} felt like the new one again.',
  ],
  asked: [
    '{a} got {b} to tell the whole story about {topic} from the start.',
    'Instead of feeling left out, {a} asked {b} to explain everything about {topic}.',
    '{a} has no history with {topic}, so {a} got {b} to fill {aObj} in.',
    '{a} questioned {b} about {topic} until {a} knew the whole history.',
  ],
  virtue: [
    '{a} argued that having no history with {topic} makes {aObj} more trustworthy. No old debts, no old grudges.',
    '{a} pointed out that, unlike the others, {a} has no ties to {topic}.',
    '{a} decided having no history with {topic} was a good thing, and started saying so.',
    '{a} says being new is an advantage: {a} has no reason to protect {topic}, or to fear {tObj}.',
  ],
  'own-story': [
    '{a} stopped envying the others’ history with {topic} and went to make friends of {aPos} own.',
    'Left out of the story about {topic}, {a} went to build new friendships instead.',
    'Rather than hear more about {topic}, {a} spent the morning getting to know another newcomer.',
    'Rather than listen to old stories about {topic}, {a} went off to make some new ones.',
  ],
};
const WARN_TOOK = new Set(['warned']);
const WARN_HAD = new Set(['already-knew']);
const WARN_REFUSED = new Set(['defended-them-instead']);
/** took-it | had-it | refused | spent-it for a callback-warning scene. */
function _warnDir(s) {
  const b = String(s.branch || '');
  if (WARN_TOOK.has(b)) return 'took-it';
  if (WARN_HAD.has(b)) return 'had-it';
  if (WARN_REFUSED.has(b)) return 'refused';
  return 'spent-it';
}
const ENVY_ASKED = new Set(['asked-to-be-told']);
const ENVY_VIRTUE = new Set(['made-a-virtue-of-it']);
const ENVY_OWN = new Set(['went-and-found-one']);
/** left-out | asked | virtue | own-story for a callback-envy scene. */
function _envyDir(s) {
  const b = String(s.branch || '');
  if (ENVY_ASKED.has(b)) return 'asked';
  if (ENVY_VIRTUE.has(b)) return 'virtue';
  if (ENVY_OWN.has(b)) return 'own-story';
  return 'left-out';
}

const CALLBACK_WARMED = new Set(['picked-it-back-up', 'alliance-reformed',
  'renegotiated-it', 'reunion-spark', 'called-a-truce', 'defended-by-history',
  'now-they-are-a-pair', 'redemption', 'alumni-bond', 'let-it-go-at-last',
  'stopped-comparing', 'one-of-them-still-is', 'asked-to-be-told', 'made-a-virtue-of-it']);
const CALLBACK_COOLED = new Set(['still-owed', 'grudge-resurfaced',
  'wants-something-for-it', 'rivalry-carried-over', 'reopened-it',
  'history-is-not-evidence', 'disappointment', 'dissonance', 'left-out',
  'compared-endings', 'both-know-how-it-ends']);
/** 'warmed' | 'cooled' | 'noted' for a callback (shared-history) scene. */
function _callbackDir(s) {
  const b = String(s.branch || '');
  if (CALLBACK_WARMED.has(b)) return 'warmed';
  if (CALLBACK_COOLED.has(b)) return 'cooled';
  return 'noted';
}

// ROMANCE-SUSPICION — romance-liability-exposed, the one romance event that is
// really a SUSPICION READ: one half of a showmance has started to doubt the
// other. Grounded as a read (topic = the doubted partner, hunch chip fires) and
// its reaction beat dropped, because the action line already carries the doubt.
const CONSEQ_ROMANCE_SUSPICION = {
  buried: [
    '{a} has a doubt about {topic}, but would rather keep the relationship than know the answer.',
    '{a} chose not to think about what {topic} might be, and the two of them are closer for it.',
    '{a} noticed something about {topic}, and decided to enjoy the evening instead.',
    '{a} had a doubt about {topic}, and decided not to act on it.',
  ],
  'took-root': [
    '{a} has started to doubt {topic}, and hasn’t said anything yet.',
    '{a} has started watching {topic} more closely. Nothing has been said.',
    '{a} is keeping the doubt about {topic} private, and it is growing.',
    'Something about {topic} stopped adding up for {a}, quietly, and {a} is not going to be the one to raise it first.',
  ],
  'named-it': [
    '{a} asked {topic} straight out, in private. Things between them have changed.',
    '{a} finally asked {topic} the question. Whatever the answer, they can’t go back.',
    '{a} confronted {topic} in private, and something between them broke a little.',
    '{a} finally told {topic} what {a} had been thinking, and things are colder between them.',
  ],
  'went-public': [
    '{a} accused {topic} loud enough for the corridor to hear. Now the relationship is evidence against {tObj}.',
    'The person who knows {topic} best has just accused {tObj} in front of the others.',
    '{a} ended the relationship in one sentence, and exposed {topic} doing it.',
    '{a} accused {topic} publicly, and nobody expected it to come from {aObj}.',
  ],
};
/** buried | took-root | named-it | went-public for a romance-suspicion scene. */
function _romSuspDir(s) {
  const b = String(s.branch || '');
  if (b === 'oblivious') return 'buried';
  if (b === 'suspicious') return 'took-root';
  if (b === 'confronts') return 'named-it';
  return 'went-public';
}

const ROMANCE_WARMED = new Set(['sparked', 'named-it-fast', 'stopped-hiding-it',
  'the-room-said-it', 'told-one-person', 'protected', 'shield-pact', 'shared-alibi',
  'patched-it', 'grief-spark', 'leaned-into-it']);
const ROMANCE_COOLED = new Set(['broke-up', 'faded-out', 'ended-in-strategy',
  'went-cold', 'showmance-fight', 'about-the-vote', 'did-not-match', 'refused-to-vouch',
  'refused-the-pact', 'did-not-step-in', 'asked-not-to', 'one-sided-so-far',
  'interrupted', 'said-nothing', 'one-sided-pact', 'too-loud', 'ended-kindly',
  'too-soon']);
/** 'warmed' | 'cooled' | 'tangled' for a romance scene. */
function _romanceDir(s) {
  const b = String(s.branch || '');
  if (ROMANCE_WARMED.has(b)) return 'warmed';
  if (ROMANCE_COOLED.has(b)) return 'cooled';
  return 'tangled';
}

// A grief scene's DIRECTION, coarsened from its branch. CLOSER = shared,
// forgiven, or spoken grief that binds; APART = grief that divides or curdles;
// otherwise it is BORNE — private, quiet, or unresolved.
const GRIEF_CLOSER = new Set(['laid-a-place', 'reseated', 'shared-mourning',
  'told-a-story-about-them', 'we-had-it-wrong', 'handed-it-over', 'set-it-out',
  'named-them-all', 'turned-into-a-vow', 'one-of-them-still-feels-it',
  'owned-the-mistake', 'about-to-say-something']);
const GRIEF_APART = new Set(['took-their-chair', 'sat-apart', 'one-sided-grief',
  'could-not-say-it', 'would-not-play', 'blamed-room', 'turned-on-them',
  'blamed-themselves', 'could-not-finish', 'nobody-joined-in',
  'said-it-and-regretted-it', 'still-think-we-were-right', 'turned-on-each-other',
  'kept-the-gap', 'moved-it-away']);
/** 'closer' | 'apart' | 'borne' for a grief scene. */
function _griefDir(s) {
  const b = String(s.branch || '');
  if (GRIEF_CLOSER.has(b)) return 'closer';
  if (GRIEF_APART.has(b)) return 'apart';
  return 'borne';
}

// A cover scene's RESULT, coarsened from each event's branch labels. TURNED =
// the other person reacted (took it back, played along, checked it, kept away).
// ABANDONED = the Traitor chose not to play the card. Otherwise the cover either
// held or slipped.
const COVER_TURNED = new Set(['asked-back', 'they-told-it-first',
  'checked-against-somebody', 'kept-out', 'would-not-take-it']);
const COVER_ABANDONED = new Set(['held-it-back', 'thought-better-of-it', 'binned-it',
  'abandoned-it', 'would-not-square-it']);
const COVER_HELD = new Set(['alibi-built', 'it-took', 'rehearsed', 'laughed-it-off',
  'convincing', 'double-bluffed', 'recruit-story-kept', 'holds', 'blended-in',
  'pitched-it-right', 'synchronized', 'were-together-anyway', 'steady', 'sacrificed-ally',
  'played-along', 'the-room-kept-it', 'was-welcomed']);
/** 'held' | 'slipped' | 'turned' | 'abandoned' for a cover scene. */
function _coverDir(s) {
  const b = String(s.branch || '');
  if (COVER_TURNED.has(b)) return 'turned';
  if (COVER_ABANDONED.has(b)) return 'abandoned';
  if (COVER_HELD.has(b)) return 'held';
  return 'slipped';
}

// ── CONSEQUENCES / NIGHTFALL (the two hours either side of a banishment) ──
//
// These "after-table" and "night" scenes are ABOUT the person who just left
// the table — {gone}, a public fact the whole castle watched — but their
// legacy closing drew a generic, subject-free pool that never named the
// departed. Grounded here so the close says WHO the room lost (or caught) and
// what it did to the person having the reaction. topic = {gone}.
//
// AFTER-WRONG — the reveal said the banished player was a Faithful. The room
// got it wrong, and {gone} should still be here. {a} is the survivor
// reckoning with it; {other} is whoever they are reckoning with it beside.
const CONSEQ_AFTER_WRONG = {
  owned: [
    '{a} voted for {topic}, and {topic} was a Faithful. {a} can’t stop thinking about it.',
    '{topic} turned out to be a Faithful, and {a} can’t take back {aPos} vote.',
    '{a} was certain about {topic}, and wrong. That will stay with {aObj}.',
    '{a} helped send {topic} home a Faithful, and no amount of going over it changes that.',
  ],
  blamed: [
    '{a} blames whoever pushed hardest for {topic}’s name, and won’t let it go.',
    '{a} knows exactly who to blame for {topic}, and it isn’t {aRef}.',
    '{a} is sure {topic} should still be here, and that someone talked the room out of it.',
    '{a} is angry about how {topic} went: one person said the name first, and the rest followed.',
  ],
  defended: [
    '{a} won’t call banishing {topic} a mistake, and would do it again.',
    '{topic} is gone, and {a} has decided not to dwell on it.',
    '{a} puts {topic} down to the cost of playing the game, and moves on.',
    '{a} thinks the vote made sense at the time, even though {topic} was a Faithful, and won’t apologise.',
  ],
  // {a} wrote another name: the room was wrong, and {a} was part of the room
  bystander: [
    '{a} did not write {topic}’s name, and it does not feel any better.',
    'It was not {a}’s slate, but it was {a}’s table, and {topic} is still gone.',
    '{a} had another name on the wood, and {topic} went home anyway.',
  ],
  quiet: [
    '{a} wouldn’t say {topic}’s name again, and people noticed.',
    '{a} kept {aPos} feelings about {topic} to {aRef}.',
    '{a} left the hall without a word about {topic}.',
    "{a} answered every question about the table without once saying {topic}’s name, and the room heard the gap where it should have been.",
  ],
};
// AFTER-RIGHT — the reveal said the banished player was a Traitor. The room
// got it right, and now the question is who actually knew.
const CONSEQ_AFTER_RIGHT = {
  credited: [
    '{a} suspected {topic} before anyone, and the reveal proved {a} right.',
    '{topic} was exactly what {a} thought, and {a} finally got to say so.',
    '{a} was right about {topic}, and is quietly pleased about it.',
    '{a} was right about {topic}, and will remember that the next time people ignore {aObj}.',
  ],
  'who-knew': [
    '{a} is less interested in {topic} leaving than in who else voted for {tObj}.',
    '{a} is thinking about who claimed to suspect {topic} all along, and whether they really did.',
    '{topic} is gone, and {a} wonders who else knew all along.',
    'The room got {topic} right, but {a} noticed someone got there suspiciously fast.',
  ],
  onward: [
    '{a} enjoyed catching {topic} for a moment, then started looking at who {topic} had been close to.',
    'With {topic} gone, {a} can see the rest of the game more clearly.',
    '{a} was right about {topic}, but being right hasn’t made {a} any safer.',
    '{a} finally has one certain fact about {topic}, and starts rethinking everything around it.',
  ],
};
// SEAT-LOSS — grief for the banished, either at the table's edge (after-table)
// or in the dark afterwards (night). KEEPS its reaction beat (mourning is
// coherent), and names {gone}: a person banished in daylight, which is a
// different weight from the ones taken at night.
const CONSEQ_SEAT_LOSS = {
  mourned: [
    '{a} keeps looking at {topic}’s empty seat, knowing the people who voted are still in the room.',
    '{a} lost {topic} to a vote, not a murder, and that feels worse.',
    '{a} watched the room banish {topic}, and it hurts more than a murder would.',
    '{a} kept talking about {topic} all evening, so the others wouldn’t forget too quickly.',
  ],
  relieved: [
    '{a} won’t say it out loud, but is glad {topic} is gone.',
    '{a} is relieved {topic} is gone, and will sleep better for it.',
    '{a} doesn’t miss {topic} at all, and is quietly fine with that.',
  ],
  guilty: [
    '{a} wrote {topic}’s name, and now has to look at the empty chair.',
    '{a}’s vote helped put {topic} out, and {a} knows it.',
    '{a} keeps coming back to the same thought: {a} voted for {topic}.',
  ],
  angry: [
    '{a} blames whoever pushed hardest against {topic}, and isn’t finished with them.',
    '{a} blames someone for {topic} going, and it isn’t {aRef}.',
    '{a} is more angry than sad about {topic}, and knows exactly who to be angry at.',
  ],
  quiet: [
    'The seat {topic} had is the first thing {a} sees in that room now, and will be tomorrow.',
    '{a} couldn’t find the words for {topic}, and stopped trying before it got light.',
    "{a} spent the evening with {topic} on {a}'s mind and nothing useful to do about it.",
  ],
};

const CONSEQ_SECRET_CONFIDENCE = {
  kept: [
    '{a} trusts {b} more because {b} kept the confidence about {topic}.',
    '{topic} remains a private suspicion shared only by {a} and {b}, strengthening their trust.',
    '{b} proves that {a} can discuss {topic} without the conversation travelling further.',
    'Keeping the confidence about {topic} brings {a} and {b} closer.',
  ],
  leakedAccident: [
    '{a} trusts {b} less after the private suspicion about {topic} spreads by accident.',
    'The accidental leak about {topic} damages the trust between {a} and {b}.',
    '{b} apologises, but {a} now knows that anything said about {topic} may travel.',
    'The confidence about {topic} is no longer private, and {a} holds {b} responsible.',
  ],
  leakedDeliberate: [
    '{a} trusts {b} far less after {b} deliberately trades the suspicion about {topic}.',
    'Using {topic} as bargaining information breaks the confidence between {a} and {b}.',
    '{b} gains an opening with someone else and loses {a}’s trust over {topic}.',
    'The deliberate leak about {topic} turns a private confidence into a betrayal.',
  ],
};
const AW_OWNED = new Set(['counted-my-own', 'alone-with-it']);
const AW_BLAMED = new Set(['blamed-the-loudest']);
const AW_DEFENDED = new Set(['defended-the-vote']);
/** owned | blamed | defended | quiet for an after-the-room-got-it-wrong scene. */
function _afterWrongDir(s) {
  const b = String(s.branch || '');
  if (AW_OWNED.has(b)) return 'owned';
  if (AW_BLAMED.has(b)) return 'blamed';
  if (AW_DEFENDED.has(b)) return 'defended';
  if (b === 'alone-not-mine') return 'bystander';
  return 'quiet';
}
const AR_CREDITED = new Set(['credit-where-due']);
const AR_WHOKNEW = new Set(['who-knew', 'overclaimed']);
/** credited | who-knew | onward for an after-the-room-got-it-right scene. */
function _afterRightDir(s) {
  const b = String(s.branch || '');
  if (AR_CREDITED.has(b)) return 'credited';
  if (AR_WHOKNEW.has(b)) return 'who-knew';
  return 'onward';
}
const SEAT_MOURNED = new Set(['mourned', 'moved-their-things', 'talked-about-them']);
const SEAT_RELIEVED = new Set(['relieved']);
const SEAT_GUILTY = new Set(['guilty', 'own-ballot']);
const SEAT_ANGRY = new Set(['angry-at-the-room']);
/** mourned | relieved | guilty | angry | quiet for a seat-loss (grief) scene. */
function _seatLossDir(s) {
  const b = String(s.branch || '');
  if (SEAT_MOURNED.has(b)) return 'mourned';
  if (SEAT_RELIEVED.has(b)) return 'relieved';
  if (SEAT_GUILTY.has(b)) return 'guilty';
  if (SEAT_ANGRY.has(b)) return 'angry';
  return 'quiet';
}

// Which topicKinds are grounded, and how the composer renders them. `reaction:
// false` drops the generic reaction card, because the event's own action line
// already carries the exchange — a second, generic reaction on top of it is the
// redundancy the reviewer read. `conseq` is the branch-keyed closing pool; `dir`
// (when present) coarsens the branch into the pool's key.
const TOPIC_CONFIG = {
  'road-third-name': { reaction: false, conseq: CONSEQ_ROAD_THIRD_NAME },
  'road-suspect-walk': { reaction: false, conseq: CONSEQ_ROAD_SUSPECT_WALK },
  'road-cover': { reaction: false, conseq: CONSEQ_ROAD_COVER },
  'road-cover-back': { reaction: false, conseq: CONSEQ_ROAD_COVER_BACK },
  'road-walk-test': { reaction: false, conseq: CONSEQ_ROAD_WALK_TEST },
  'suspicion-third': { reaction: false, conseq: CONSEQ_SUSP_THIRD,
    dir: s => (s.branch === 'saw-it-alone' ? 'alone' : s.branch === 'named-somebody-else' ? 'split'
      : s.branch === 'one-of-us-was-there' ? 'inside' : _suspDir(s)) },
  'testing-probe': { reaction: false, dir: _testDir, conseq: CONSEQ_TESTING },
  'cover-deflect': { reaction: false, dir: _coverDir, conseq: CONSEQ_COVER_DEFLECT },
  'cover-bluff': { reaction: false, dir: _coverDir, conseq: CONSEQ_COVER_BLUFF },
  'cover-blend': { reaction: false, dir: _coverDir, conseq: CONSEQ_COVER_BLEND },
  'cover-account': { reaction: false, dir: _coverDir, conseq: CONSEQ_COVER_ACCOUNT },
  'cover-weight': { reaction: false, dir: _coverDir, conseq: CONSEQ_COVER_WEIGHT },
  // grief KEEPS its reaction beat (mourning comfort is coherent), so no
  // `reaction: false` — only the consequence is grounded to name the dead.
  'grief-loss': { dir: _griefDir, conseq: CONSEQ_GRIEF },
  // the two solitary-crisis grief scenes; topic set per-branch (dead, or self).
  'grief-vigil': { dir: _vigilDir, conseq: CONSEQ_GRIEF_VIGIL },
  // romance KEEPS its reaction beat too — only the consequence is grounded.
  'romance-bond': { dir: _romanceDir, conseq: CONSEQ_ROMANCE },
  // the one romance event that is a suspicion read — reaction dropped, hunch chip on.
  'romance-suspicion': { reaction: false, dir: _romSuspDir, conseq: CONSEQ_ROMANCE_SUSPICION },
  'callback-history': { dir: _callbackDir, conseq: CONSEQ_CALLBACK },
  // the two once-skipped callback events, about the ABSENCE of shared history.
  'callback-warning': { dir: _warnDir, conseq: CONSEQ_CALLBACK_WARNING },
  'callback-envy': { dir: _envyDir, conseq: CONSEQ_CALLBACK_ENVY },
  // consequences / nightfall — the banishment aftermath. after-wrong/right are
  // deduction reckonings and drop the reaction; seat-loss is grief and keeps it.
  'after-wrong': { reaction: false, dir: _afterWrongDir, conseq: CONSEQ_AFTER_WRONG },
  'after-right': { reaction: false, dir: _afterRightDir, conseq: CONSEQ_AFTER_RIGHT },
  'seat-loss': { dir: _seatLossDir, conseq: CONSEQ_SEAT_LOSS },
  'secret-confidence': { reaction: false, conseq: CONSEQ_SECRET_CONFIDENCE },
  'confrontation': { dir: _confrontDir, conseq: CONSEQ_CONFRONT },
  'confrontation-pileon': { dir: _confrontDir, conseq: CONSEQ_CONFRONT },
  'confrontation-defence': { dir: _defenceDir, conseq: CONSEQ_DEFENCE },
};

// The set of event ids that have been reworked to record a concrete topic.
// KEPT ON ONE LOGICAL LINE PER FAMILY, opened with `TOPIC_READY_*` and not a
// bare quote: tr-castle-prose's debug-word source scan treats any trimmed line
// matching /^['"].{10,}['"],?$/ as a prose pool line, so a wrapped array whose
// continuation lines begin `'cover-...',` would read as story prose and trip on
// the word "cover" in the event id. A `const NAME =` opener is an identifier
// line, which that scan (correctly) ignores.
/* eslint-disable-next-line */
const TOPIC_READY_JOURNEY = ['susp-out-of-earshot', 'susp-let-it-go-on-the-road-back', 'cover-road-rehearsal', 'cover-story-survived-the-day', 'testing-who-you-walk-with', 'susp-whisper-about-absent', 'susp-timeline-crosscheck', 'susp-overheard-conversation'];
// testing family (testing.js) — every test names the person it was run ON
// (topic = the tested player) and closes on what it showed about them.
/* eslint-disable-next-line */
const TOPIC_READY_TESTING = ['testing-small-dare', 'testing-ask-for-alibi-check', 'testing-loyalty-oath', 'testing-reverse-psychology', 'testing-hypothetical-loyalty-question', 'testing-double-check-story', 'testing-silence-test', 'testing-cold-read-check', 'testing-follow-through-check', 'testing-decoy-secret', 'testing-night-scores-it'];
// cover family (cover.js) — Traitor-only. Names the subject being covered: the
// person suspicion is deflected onto, the circle blended into, or the account
// (murder night / recruitment / what they are) being defended.
/* eslint-disable-next-line */
const TOPIC_READY_COVER = ['cover-preemptive-alibi', 'cover-suspect-own-ally', 'cover-plant-a-name', 'cover-rehearsed-story-advance', 'cover-cold-sweat-tell', 'cover-story-check', 'cover-double-bluff', 'cover-decline-recruit-offer-story', 'cover-alibi-crumbles', 'cover-blend-with-victims-friends', 'cover-feign-fear', 'cover-swap-story-with-partner', 'cover-alone-with-it'];
// grief family (grief.js) — mourning; topic = the murdered person. The two
// once-skipped ballot-sensitive events (someone-cries-alone, nobody-sleeps) are
// now grounded too, via the grief-vigil pool: they set the topic PER BRANCH (the
// dead when the scene mourns; the actor's own name when it is table-paranoia),
// so a victim-named close never lands on a self-precarity scene.
/* eslint-disable-next-line */
const TOPIC_READY_GRIEF = ['grief-empty-chair', 'grief-headcount', 'grief-seating-shift', 'grief-shared-mourning-bond', 'grief-suspicion-of-timing', 'grief-morning-reaction', 'grief-keepsake', 'grief-blame-the-room', 'grief-toast-to-them', 'grief-numb-to-it-now', 'grief-wrongly-suspected-irony', 'grief-someone-cries-alone', 'grief-nobody-sleeps'];
// romance family (romance.js) — topic = the partner. romance-liability-exposed
// is grounded as a SUSPICION READ (topicKind 'romance-suspicion'): its
// doubter/suspected shape is a read of one partner by the other, so it names the
// doubted partner and carries a hunch chip rather than a couple's TRUST chip.
/* eslint-disable-next-line */
const TOPIC_READY_ROMANCE = ['romance-spark', 'romance-showmance-forms', 'romance-protection-instinct', 'romance-jealousy-third-party', 'romance-showmance-breakup', 'romance-shields-target-together', 'romance-shared-alibi', 'romance-showmance-fight', 'romance-strategic-optics', 'romance-comfort-after-loss-sparks', 'romance-liability-exposed'];
// callback family (callback.js) — topic = the shared-history person. The two
// once-skipped events are now grounded on the ABSENCE of a shared past:
// callback-warns-newbies (a vet handing a newbie a read on a threat the newbie
// has no history with) and callback-no-history-envy (an outsider sitting outside
// a story about a person they never played with). Both name that third person
// and frame who is short of the history.
/* eslint-disable-next-line */
const TOPIC_READY_CALLBACK = ['callback-recognized', 'callback-old-alliance-reforms', 'callback-grudge-resurfaces', 'callback-showmance-reunion-spark', 'callback-competitive-history', 'callback-protects-old-ally-from-vote', 'callback-different-show-different-person', 'callback-shared-alumni-status', 'callback-history-confrontation', 'callback-warns-newbies', 'callback-no-history-envy'];
// consequences.js + nightfall.js — the banishment aftermath. Each names the
// person who left the table ({gone}). after-the-empty-seat (after-table) and
// night-the-seat-they-had (night) share the seat-loss grief pool.
/* eslint-disable-next-line */
const TOPIC_READY_AFTERMATH = ['after-the-room-got-it-wrong', 'after-the-room-got-it-right', 'after-the-empty-seat', 'night-the-seat-they-had'];
const TOPIC_READY_TRUST = ['trust-secret-swap'];
// confrontation family (confrontation.js) — an open clash; topic = the person
// it was aimed at, and the scene closes on how it left them.
const TOPIC_READY_CONFRONTATION = ['confront-to-the-face', 'confront-pile-on', 'confront-defend-the-accused'];
export const TOPIC_READY = new Set([...TOPIC_READY_JOURNEY, ...TOPIC_READY_TESTING, ...TOPIC_READY_COVER, ...TOPIC_READY_GRIEF, ...TOPIC_READY_ROMANCE, ...TOPIC_READY_CALLBACK, ...TOPIC_READY_AFTERMATH, ...TOPIC_READY_TRUST, ...TOPIC_READY_CONFRONTATION]);

/**
 * WHAT CHANGED, NAMED. Draws the closing consequence from the topic pool keyed
 * by the event's own branch, so the sentence is about the recorded subject.
 * Falls back to the branch-agnostic pool for a branch the config does not name
 * (a new branch degrades to generic rather than crashing).
 */
function _topicConsequence(s, subs, key, used, cfg, tone) {
  let branch = String(s.branch || '');
  if (cfg.dir) branch = cfg.dir(s);
  else if (cfg.byDirection) branch = _suspDir(s);
  const pool = (cfg.conseq && cfg.conseq[branch])
    || (cfg.conseq && Object.values(cfg.conseq)[0]) || [];
  // A LINE THAT OPENS ON {topic} opens on whatever the topic is — "the night
  // Amy was murdered would not let…" — so the sentence is capitalised here.
  const say = _cap(_fill(_pickUnique(pool, key + '|tconseq', used, 'tconseq'), subs));
  return { text: say, say, mark: null, tone };
}

/** A plain closing sentence sourced from the scene's visible impacts. */
function _receiptConsequence(s, subs, tone, key, used) {
  const chips = Array.isArray(s.chips) ? s.chips : [];
  const lines = [];
  const seen = new Set();
  // ONE PAIR, ONE SENTENCE. A suspicion chip and a bond chip between the same
  // two people used to be two sentences, and when they pulled opposite ways
  // the card contradicted itself ("B is more suspicious of Beth after that.
  // B and Beth have more ground under them now."). Found reading a real day.
  const byPair = new Map();
  for (const chip of chips) {
    if (!chip || !chip.a || !chip.b) continue;
    const k = [chip.a, chip.b].sort().join('|');
    const e = byPair.get(k) || {};
    if (chip.type === 'suspicion' && s.readKind !== 'pact' && s.readKind !== 'threat') e.susp = chip;
    if (chip.type === 'bond') e.bond = chip;
    byPair.set(k, e);
  }
  for (const [k, e] of byPair) {
    if (!e.susp || !e.bond) continue;
    const c = e.susp, bObj = _prOf(c.b).obj;
    const pool = c.dir > 0
      ? (e.bond.dir > 0 ? [
        '{a} likes {b} a little more after that, and suspects {bObj} a little more too.',
        '{a} likes {b} more, and suspects {bObj} more too.',
        '{a} and {b} get closer, but {a} is watching {bObj} now.',
        '{a} is friendlier with {b}, and more suspicious of {bObj} at the same time.',
      ] : [
        '{a} is cooler with {b}, and more suspicious of {bObj}.',
        '{a} and {b} fall out, and {a} suspects {bObj} more.',
        '{a} trusts {b} less and likes {bObj} less.',
        'Things sour between {a} and {b}, and {a} starts to suspect {bObj}.',
      ])
      : (e.bond.dir > 0 ? [
        '{a} and {b} get closer, and {a} suspects {bObj} less.',
        '{a} warms to {b}, and lets some of the doubt go.',
        '{a} trusts {b} more after that.',
        '{a} and {b} are on better terms, and {a} worries less about {bObj}.',
      ] : [
        '{a} suspects {b} less, though the two of them are cooler.',
        '{a} stops worrying about {b}, but they are not closer for it.',
        '{a} lets the doubt about {b} go, and keeps {bPos} distance.',
        '{a} and {b} are cooler, but {a} is less suspicious of {bObj}.',
      ]);
    lines.push(_fill(_pickUnique(pool, key + '|receipt|mixed|' + k, used, 'receipt-mixed'),
      { a: c.a, b: c.b, bObj, bPos: _prOf(c.b).posAdj }));
    seen.add(k + '|suspicion'); seen.add(k + '|bond');
  }
  for (const chip of chips) {
    if (!chip || !chip.a || !chip.b) continue;
    const pair = [chip.a, chip.b].sort().join('|') + '|' + chip.type;
    if (seen.has(pair)) continue;
    seen.add(pair);
    if (chip.type === 'suspicion') {
      // A TRAITOR IS NOT GETTING MORE SUSPICIOUS, and cannot be. They were
      // shown the pact in the turret, so they know by elimination that the
      // person opposite is innocent. What moves for them is how close that
      // person is getting — which is a different sentence, not a softer one.
      // `pact` draws nothing at all: a Traitor reading a fellow is two people
      // who were introduced to each other at midnight.
      if (s.readKind === 'pact') continue;
      const pool = s.readKind === 'threat' ? (chip.dir > 0 ? [
        '{a} is watching {b} more carefully from here.',
        '{b} is getting closer than {a} would like.',
        '{a} has started planning around {b}.',
        '{a} would rather {b} were not paying this much attention.',
      ] : [
        '{a} stops worrying about {b} for now.',
        '{a} decides {b} is looking the wrong way after all.',
        '{b} is further off it than {a} feared.',
        '{a} breathes out a little where {b} is concerned.',
      ]) : chip.dir > 0 ? [
        '{a} is more suspicious of {b} after that.',
        "{b} is higher on {a}'s list tonight.",
        '{a} decides to keep an eye on {b}.',
        '{a} leaves with a harder read on {b}.',
      ] : [
        '{a} eases off {b} after that.',
        "{b} drops a notch on {a}'s list.",
        '{a} lets some of the doubt about {b} go.',
        '{a} comes away less worried about {b}.',
      ];
      lines.push(_fill(_pickUnique(pool, key + '|receipt|susp|' + pair, used,
        'receipt-susp'), chip));
    } else if (chip.type === 'bond') {
      const pool = chip.dir > 0 ? [
        '{a} and {b} are steadier with each other after that.',
        '{a} and {b} close a little of the distance.',
        '{a} and {b} walk away warmer than they sat down.',
        '{a} and {b} are on better terms now.',
      ] : [
        '{a} and {b} are cooler with each other after that.',
        'Something between {a} and {b} frays a little.',
        '{a} and {b} are more guarded with each other after that.',
        '{a} and {b} are on worse terms now.',
      ];
      lines.push(_fill(_pickUnique(pool, key + '|receipt|bond|' + pair, used,
        'receipt-bond'), chip));
    }
  }
  let say = lines.slice(0, 2).join(' ');
  if (!say) {
    // NO CHIP IS NOT NO CONSEQUENCE — it is no NUMBER, which is a different
    // thing and used to be written as though it were the same. A scene that
    // moved no bond and no read fell through to four interchangeable
    // "nothing was concluded" sentences, and because a SOLO scene moves
    // neither by construction (one person alone has no interpersonal delta,
    // and every event in js/tr/castle/alone.js returns bondDelta 0 for that
    // reason), those four were the standard closing line for most of the
    // solo pool. Measured from a real dump: six solo scenes in one night,
    // six variations on "reaches no firm conclusion".
    //
    // So a closed scene says it ended, and an open one falls back to
    // FALLBACK_PAIR / FALLBACK_SOLO, which say what the person does next.
    // (The old generic CONSEQ / CONSEQ_SINGLE pools and the REACT pools were
    // removed 2026-09-29: nothing had called them for some time.)
    const pair = subs.b && subs.b !== subs.a;
    const pool = s.closedNow ? (pair ? [
      'The conversation ends there.',
      'They say nothing further about it.',
      'That is the last either of them says on the subject.',
      'The talk stops before anyone else joins them.',
    ] : [
      '{a} leaves it there.',
      '{a} does not come back to it.',
      'That is the end of it for {a}.',
      '{a} puts it away and does not take it out again.',
    ]) : pair
      ? (FALLBACK_PAIR[tone] || FALLBACK_PAIR.smooth)
      : (FALLBACK_SOLO[tone] || FALLBACK_SOLO.smooth);
    say = _fill(_pickUnique(pool, key + '|receipt|fallback', used,
      'receipt-fallback'), subs);
  }
  return { text: say, say, mark: null, tone };
}

/**
 * Put the recorded subject into the action itself when an older event line
 * assumes context the viewer does not have. These are plain orientation
 * sentences, not new facts: each one says only what `topicKind` already means.
 */
function _groundedAction(s, subs) {
  const line = String(s.line || '').trim();
  if (!subs.topic || line.includes(subs.topic)) return line;
  // SAID THE WAY A NARRATOR SAYS IT. "{a} is still reacting to the loss of
  // {topic}" and "{a} reviews their story about {topic}" were case notes, and
  // the second printed singular they over gendered players.
  const leads = {
    'road-third-name': 'On the walk, {a} brings up {topic}.',
    'road-suspect-walk': 'On the walk, {other} keeps an eye on {topic}.',
    /* viewer phrase */ 'road-cover': '{a} goes over what to say about {topic}, in case anybody asks.',
    /* viewer phrase */ 'road-cover-back': '{a} goes back over {aPos} story about {topic}.',
    'road-walk-test': '{other} uses the walk to test {topic}.',
    'suspicion-third': '{a} brings up {topic}.',
    'testing-probe': '{other} has been quietly testing {topic}.',
    /* viewer phrase */ 'cover-deflect': '{a} tries to push the suspicion onto {topic}.',
    /* viewer phrase */ 'cover-bluff': '{a} talks to {topic} about the Traitors as if {a} were hunting them.',
    /* viewer phrase */ 'cover-blend': '{a} stays close to the people grieving {topic}. It is a good place for a Traitor to be seen.',
    /* viewer phrase */ 'cover-account': '{a} goes over {aPos} story about {topic} again.',
    /* viewer phrase */ 'cover-weight': '{a} is alone with {topic}, and with the lie that goes with it.',
    'grief-loss': 'The castle is still taking in losing {topic}.',
    'grief-vigil': '{a} cannot stop thinking about {topic}.',
    'romance-bond': '{other} and {topic} finally talk about what is going on between them.',
    'romance-suspicion': '{other} is not sure {topic} can be trusted.',
    'callback-history': '{a} brings up {aPos} history with {topic} from another season.',
    'callback-warning': '{a} passes on what another season taught {aObj} about {topic}.',
    'callback-envy': '{a} asks what the others know about {topic} from before.',
    'after-wrong': '{a} keeps going back to the vote that sent {topic} home.',
    'after-right': '{a} goes back over how the room caught {topic}.',
    'seat-loss': '{a} keeps looking at the empty place where {topic} sat.',
    'secret-confidence': '{a} tells {b} a private suspicion about {topic}.',
    'confrontation': '{a} takes it straight to {topic}, in front of the room.',
    'confrontation-pileon': '{a} goes after {topic}, and the room joins in.',
    'confrontation-defence': '{a} stands up for {topic} in front of the room.',
  };
  const lead = leads[s.topicKind];
  return lead ? _fill(lead, subs) + ' ' + line : line;
}

/**
 * WHAT SOMEBODY ACROSS THE ROOM SEES A PAIR DOING.
 *
 * FIX ROUND 1, I2. The public stream was three cards, two of them authored and
 * ONE COPIED: for every pair scene the establishing card was the audience's,
 * verbatim — so a watcher standing in the corridor was handed "{a} and {b} are
 * at {loc}, and nobody knows they are" and "{a} waits until the corridor is
 * empty before saying anything at all to {b}". Lines written for a private
 * scene, given to somebody who was in it. The same contradiction class as C1,
 * left standing for pairs.
 */
const PUBLIC_ESTABLISH_PAIR = [
  'You are at {loc} too, {when}, and {a} and {b} are already in the middle of something.',
  '{a} and {b} are at {loc} when you get there, {when}, standing closer together than the room needs.',
  '{when}, at {loc}, and you are not the first one there: {a} and {b} are.',
  'There are two people at {loc} already, {when}, and they are {a} and {b}.',
  'You come into {loc}, {when}, and stop, because {a} and {b} are talking and it is not general talk.',
  '{a} and {b} have {loc} between them, {when}, and you are the third person in it.',
];


/**
 * The lead-in on the card that says how far back this goes — and there are TWO
 * pools, because there are two answers.
 *
 * The first version had one pool, and printed "the argument arrives already
 * halfway through, because it started days ago" directly above a line saying
 * the conversation had come up once this morning. A lead that contradicts its
 * own tail is worse than no lead. Found by dumping a day and reading it.
 */
// ── WIDENED (fix round 1, C1b, third pass) ────────────────────────────
//
// Named explicitly in the review alongside two since-deleted pools. The
// recall lead prints on every carried scene, and a carried scene is now much
// commoner than it was when these were written at four lines: Task 7 took the
// castle to ~28 fired scenes an episode and gave the pool 73 advancers, so a
// season draws these several times a day rather than a few times a week.
// Four became ten.
const RECALL_LEAD_DAYS = [
  'This did not start this morning, and both of them know exactly when it did.',
  'This is not the first time these two have stood somewhere and had this exact conversation.',
  'It is older than today, and both of them know precisely how much older.',
  'The argument arrives already halfway through, because it started days ago.',
  'Neither of them has to explain the beginning of it, because both of them were there.',
  'They have had this conversation before, in a different room, on a worse day.',
  'Whatever this is, it has been going long enough to have a shorthand.',
  'The two of them arrive at the middle of it without either one setting it up.',
  'This has history, and both of them are carrying their half of it.',
  'It has been between them since well before this morning, and neither pretends otherwise.',
];
/** The same two, for a scene with nobody in it to be the other half of "both". */
const RECALL_LEAD_DAYS_SOLO = [
  'This did not start this morning, and {a} could name the day it did.',
  '{a} has done a version of this before, and not long ago.',
  'It is older than today, and {a} knows exactly how much older.',
  'Whatever this is, {a} has been carrying it since well before this morning.',
  '{a} has been round this before, more than once, and knows the shape of it.',
  'It started days ago and {a} has not put it down since.',
  'This is not new to {a}, and {a} could say which morning it started on.',
  '{a} picks it up exactly where {a} left it, which is some way in.',
  'There is a history to this and all of it is {a}\'s.',
  '{a} did not arrive at this today. {a} arrived at it some time ago.',
];
const RECALL_LEAD_TODAY_SOLO = [
  '{a} has already been here once today, and here {a} is again.',
  'The second time since breakfast, and nobody has seen {a} do it once.',
  'It did not keep. {a} is back at it before the day is out.',
  '{a} could not leave it alone for the length of an afternoon.',
  'Twice before dark, and {a} would say it was once.',
  '{a} is back on it already, which is faster than {a} meant to be.',
  'It kept for about four hours, which is longer than {a} expected of it.',
  '{a} has been here once today and here {a} is again, sooner.',
  'The same thing, the same day, and {a} has not noticed it is the same.',
  'It did not survive the afternoon. Very little does with {a}.',
];
/**
 * And again for three or more, because "both of them know exactly when it did"
 * printed over a scene with three people in it — found by rendering a day and
 * counting the names against the sentence.
 */
const RECALL_LEAD_DAYS_GROUP = [
  'None of them has to say which day this goes back to. All of them could.',
  'This has been running for days, and everybody standing here is part of why.',
  'It did not start this morning, and not one of them is hearing it for the first time.',
  'They have all been carrying some part of this since well before today.',
  'Every one of them could name a different day this started on, and all of them would be right.',
  'It has been going long enough that nobody bothers explaining it to anybody.',
  'This is old, and the room has been standing in it for some time.',
  'Nobody here is new to this, which is why nobody sets it up.',
  'It goes back further than any of them will say out loud.',
  'All of them have a version of where this began and none of them agree.',
];
const RECALL_LEAD_TODAY_GROUP = [
  'This has already come up once today, and it has picked up people since.',
  'The second time today, and there are more of them in it than there were this morning.',
  'It did not keep, and it did not stay between the two who started it.',
  'They are back on it before the day is out, and the room is bigger this time.',
  'The same subject, hours later, and two more people have joined it.',
  'It came up at breakfast and it is up again, with an audience.',
  'Twice in one day, and the second time nobody kept it quiet.',
  'It has picked up people since this morning, which is what these do.',
  'They are at it again and the room has stopped pretending not to listen.',
  'Round two, same day, more of them in it.',
];
/**
 * The two react classes whose carried scenes must never be called an argument:
 * `bond` (trust and romance) and `loss` (grief). See the note at the call site.
 */
const WARM_RECALL_CLASSES = new Set(['bond', 'loss']);

/**
 * THE SAME TWO SENTENCES, FOR A STORY THAT IS NOT A FIGHT.
 *
 * Ten each, matching the width of the pools they stand in for — these are
 * drawn on every carried trust, romance and grief pair scene, which is roughly
 * a third of all carried pair scenes, so a narrow pool here would repeat
 * inside a single day.
 */
const RECALL_LEAD_DAYS_WARM = [
  'This did not start this morning, and both of them know exactly when it did.',
  'They have been circling this for days, and neither of them has to explain which days.',
  'It is older than today, and both of them know precisely how much older.',
  'Whatever is between them arrives already some way in, because it started days ago.',
  'Neither of them has to explain the beginning of it, because both of them were there.',
  'They have sat like this before, in a different room, on a worse day.',
  'Whatever this is, it has been going long enough to have a shorthand.',
  'The two of them pick it up in the middle without either one setting it up.',
  'This has history, and both of them are carrying their half of it.',
  'It has been between them since well before this morning, and neither pretends otherwise.',
];
const RECALL_LEAD_TODAY_WARM = [
  'Neither of them has left it alone for more than a couple of hours.',
  'It was not going to wait until tomorrow, and neither of them tried to make it.',
  'They are back to it, and the second time is quieter and a good deal more honest.',
  'Whatever was settled the first time did not stay settled for long.',
  'The second time is happening before the first one has finished cooling.',
  'Neither of them waited. It came back up inside the afternoon.',
  'It did not keep for a day, or an evening, or in the end for an hour.',
  'They are back to it, and this time neither of them is pretending it is nothing.',
  'Once was not enough for either of them, apparently.',
  'It came back round before the room had finished with the first version.',
];
/**
 * THE GROUP POOLS, FOR A STORY THAT IS NOT A FIGHT.
 *
 * Ten each, matching their combative siblings. `RECALL_LEAD_DAYS_GROUP` is
 * mostly neutral already — it does not print the word "argument" — but three of
 * its ten put the room in opposition ("none of them agree", "further than any
 * of them will say out loud"), which is the wrong register over three people
 * sitting with a shared grief or a shared confidence.
 */
const RECALL_LEAD_DAYS_GROUP_WARM = [
  'None of them has to say which day this goes back to. All of them could.',
  'This has been running for days, and everybody standing here is part of why.',
  'It did not start this morning, and not one of them is hearing it for the first time.',
  'They have all been carrying some part of this since well before today.',
  'Every one of them could name the day it started, and they would all name the same one.',
  'It has been going long enough that nobody bothers explaining it to anybody.',
  'This is old, and the room has been standing in it for some time.',
  'Nobody here is new to this, which is why nobody sets it up.',
  'It goes back further than any of them would have said a week ago.',
  'All of them arrived at this from a different day, and all of them arrived.',
];
const RECALL_LEAD_TODAY_GROUP_WARM = [
  'This has already come up once today, and it has picked up people since.',
  'The second time today, and there are more of them in it than there were this morning.',
  'It did not keep, and it did not stay between the two who started it.',
  'They are back to it before the day is out, and the room is bigger this time.',
  'The same subject, hours later, and two more people have sat down with it.',
  'It came up at breakfast and it is up again, with company.',
  'Twice in one day, and the second time nobody kept it quiet.',
  'It has picked up people since this morning, which is what these do.',
  'They are at it again and the room has stopped pretending not to listen.',
  'Round two, same day, more of them in it.',
];
const RECALL_LEAD_TODAY = [
  'Neither of them has left it alone for more than a couple of hours.',
  'It was not going to wait until tomorrow, and neither of them tried to make it.',
  'They are back at it, and the second go is shorter and a good deal sharper.',
  'Whatever was settled the first time did not stay settled for long.',
  'The second go is happening before the first one has finished cooling.',
  'Neither of them waited. It came back up inside the afternoon.',
  'It did not keep for a day, or an evening, or in the end for an hour.',
  'They are back on it, and this time nobody is being careful.',
  'Once was not enough for either of them, apparently.',
  'The subject came back before the room had finished with the first version.',
];

// ── TOPIC-AWARE RECALL LEADS ──────────────────────────────────────────
//
// THE DEFECT: the pools above are SUBJECT-FREE ("Whatever this is, it has been
// going long enough to have a shorthand") because they were written before an
// event recorded what a carried scene was ABOUT. On a grounded scene that read
// as the user's complaint — a carried argument opening on "whatever this is"
// directly above a consequence that names the subject in full. Now that a scene
// carries a `topic`, a carried GROUNDED scene names it in the lead instead.
//
// Deliberately mode- and warmth-NEUTRAL (no "both", no "argument"), so ONE pool
// each serves solo/pair/group and trust/grief/suspicion alike — the tail that
// follows ("It went back to day 3: …") supplies the day, so the lead only has
// to say WHAT and roughly WHEN. Legacy scenes (no topic) keep the pools above.
// Each lead's FIXED text (topic aside) runs past 44 characters on purpose: the
// screen renders the lead and its day-citation tail as separate lines, and the
// transcript guard checks a 44-char slice of lead+tail against one shown line,
// so a short lead would bleed into the tail and never match. The legacy pools
// above are all full sentences for the same reason.
const RECALL_LEAD_DAYS_TOPIC = [
  // NO TIME CLAIM IN THE LEAD. The tail says when; "running for some days now"
  // printed over a story that started yesterday.
  'Back to {topic}.',
  'The same subject as before: {topic}.',
  'This is not the first time {topic} has come up.',
  'Once again it comes back to {topic}.',
];
const RECALL_LEAD_TODAY_TOPIC = [
  'Back to {topic} so soon — the same day has not even finished.',
  'It is {topic} again — the second time since breakfast.',
  'The subject of {topic} comes up once more, and it has not even been a full day.',
  'The same subject, {topic}, comes round again the same afternoon.',
  'Back on {topic} within the hour, sooner than intended.',
  'The question of {topic} comes round again, and the first go had barely finished cooling.',
];

// THE FALLBACK LEAD, FOR A SCENE WITH NO RECORDED TOPIC — and it may not
// simply announce that a history exists, because the TAIL already does.
//
// The two halves of this card are printed together, and the old pool produced
// pairs like:
//
//     "They have discussed this before. The earlier discussion happened on
//      day 1."
//     "The conversation has a history. The earlier discussion happened on
//      day 1."
//
// Two sentences, one fact, and neither of them says anything about what the
// return is like. The tail owns WHEN. The lead's job is what it costs to be
// back here, which is the half a viewer cannot get from a day number.
const RECALL_LEAD_RECORDED = [
  // MODE-NEUTRAL: drawn for one person alone as well as for pairs, and
  // "neither of them" over somebody alone in a corridor is a scene with a
  // ghost in it.
  'This is not new.',
  'This started before today.',
  'It is not the first time.',
  'The same thing again.',
];

/**
 * WHAT SOMEBODY ACROSS THE ROOM GETS, and it is WRITTEN, not hidden.
 *
 * The observer contract is not a CSS class over the audience's prose. A
 * watcher who was in the room but not in the conversation gets three cards
 * composed for them, and the thing withheld is the CONTINUITY: you saw two
 * people talking and you have no way of knowing whether it started this
 * morning or has been running all week. That is the most Traitors sentence
 * this screen can make its layers say.
 */
const PUBLIC_ACTION = [
  'From where you are standing it is two people talking low, and stopping when you get closer.',
  'You get about one word in five. None of the five is worth anything on its own.',
  'You can see it isn’t small talk, but that’s all you can see.',
  'Whatever is being said is being said quietly, and it is being said carefully.',
];
/**
 * AND THE ROOM, WHEN THE SCENE HAD ONE PERSON IN IT.
 *
 * The audience's establishing card for a scene with nobody else in it says so
 * — "nobody to perform for", "the door shut and nobody on the other side of
 * it" — and handing that same card to somebody who then reads "you come round
 * the corner" is a card contradicting the card under it. Found by rendering a
 * player's day and reading it.
 */
const PUBLIC_ESTABLISH_SOLO = [
  'You pass {loc}, {when}, and {a} is there.',
  '{a} is at {loc} on your way past, {when}.',
  'There is one person at {loc} when you get there, {when}, and it is {a}.',
  'You were not looking for anybody when you came to {loc}, {when}, and {a} is in it.',
];

/** The same, when the person across the room was on their own. */
const PUBLIC_CLOSE_SOLO = [
  '{a} notices you and is perfectly normal about it, immediately.',
  'By the time you say anything, {a} is talking about something else entirely.',
  '{a} does not explain what {a} was doing, and you do not ask.',
  'Whatever that was, it is over, and {a} is already halfway down the corridor.',
];
const PUBLIC_CLOSE = [
  'It ends when {a} looks up, and after that it is small talk, and you are included in the small talk.',
  'They finish before you get there, and then there are three of you standing about talking of nothing.',
  'Neither of them tells you what it was about, and neither pretends there was nothing to tell.',
  'The conversation is over by the time you are close enough to be part of it.',
];

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
    // A SPOOL, standing, with a tail of thread coming off it. DRAWN AS A
    // SILHOUETTE rather than as six hairlines: this runs at 13px on every
    // scene card in the stream, and at that size the wound barrel was a
    // smudge of parallel strokes that read as a tiny grid. A filled barrel
    // between two flanges survives the size.
    spool: '<rect x="7.6" y="6.6" width="8.8" height="10.8" rx="1" fill="' + c + '" opacity=".85"/>'
      + '<path d="M5 4.6h14M5 19.4h14" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/>'
      + '<path d="M16.4 12.6c3 .4 3.4 2.6 5 3.6" stroke="' + c
      + '" stroke-width="1.3" stroke-linecap="round"/>',
    // A NEEDLE with the thread through the eye of it.
    needle: '<path d="M4.2 20.2 18.6 5.2" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round"/>'
      + '<path d="M17.2 6.6 20.4 3.4" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/>'
      + '<ellipse cx="16.1" cy="7.7" rx="1.5" ry="0.9" transform="rotate(-46 16.1 7.7)" stroke="' + c + '" stroke-width="1"/>'
      + '<path d="M15.2 8.6c-2.8 1.4-3.4 3.6-1.4 5.2" stroke="' + c + '" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>',
    // A BEAD ON A RUNNING CORD, which is what this mark actually MEANS: it
    // sits on a scene that is one more beat of a thread that was already
    // going, and the screen's own language for that is a cord entering the
    // card from above and leaving it below.
    //
    // IT WAS AN OVERHAND KNOT TWICE AND NEITHER SURVIVED 13px. The first was
    // two mirrored sine curves, which read as a small letter X; the second
    // was a loop with two crossed tails, which — rendered at six times size
    // and looked at, which is the only way anybody was ever going to see it —
    // is unmistakably an ankh. A cord and a bead cannot be mistaken for
    // anything, at any size, and it says the truer thing.
    knot: '<path d="M12 2.6v18.8" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>'
      + '<circle cx="12" cy="12" r="3.6" fill="' + c + '"/>',
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

/**
 * The far plane: a graded wall, and three windows cut in it.
 *
 * WHAT WAS DELETED HERE AND WHY. The first pass drew a flat black lens for a
 * vault, four piers a shade off the wall they stood on, and twenty-two ruled
 * course lines — and `.dy-stone` in the stylesheet ALREADY draws coursed
 * masonry, over the full page height, at a different pitch. Two grids of
 * hairlines at two pitches on top of each other is not stonework, it is
 * moiré, and rendering the plane on its own is what showed it. The wall is
 * one gradient plus the CSS coursing now, which is what a wall is.
 *
 * AND THE WINDOWS HAVE A PROPORTION. They were 150 wide, 540 tall, with a
 * SEMICIRCLE of their own half-width on top — which at real size reads as a
 * headstone, not as a window. A lancet is narrow: about five of its own
 * widths tall, with a POINTED head struck as two arcs whose radius is the
 * full opening width, meeting about seven-eighths of that width above the
 * springing. That single ratio is the difference between "castle" and
 * "shape", and it costs nothing.
 */
function _hallFar() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="dyWall" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#2a261e"/><stop offset="52%" stop-color="#1d1a15"/>'
    + '<stop offset="100%" stop-color="#141210"/>'
    + '</linearGradient>'
    + '<linearGradient id="dyPane" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#f4e8c6" stop-opacity=".68"/>'
    + '<stop offset="100%" stop-color="#e2c992" stop-opacity=".18"/>'
    + '</linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="1500" fill="url(#dyWall)"/>'
    + _lancets()
    + '</svg>';
}

/**
 * Two lancets, and the light is behind them.
 *
 * THERE WERE THREE AND THEY WERE ALL DRAWN WHERE NOBODY COULD SEE THEM — the
 * same finding as the selection screen's castle, and measured the same way,
 * off the rendered page. What the scene cards leave is a strip down each
 * SIDE, and a hall lit from its side walls is the more honest room anyway: it
 * is what makes the shaft rake ACROSS the floor rather than fall straight
 * down the wall it came through.
 *
 * AND THE VIEW BOX IS NOT THE PAGE. This is the part that has to be measured
 * rather than reasoned about, and getting it wrong put the first attempt at
 * these two windows off the left-hand edge of the canvas entirely. The plane
 * is a 1100x1500 view box drawn into a 1100x2200 layer under
 * `preserveAspectRatio="xMidYMin slice"`, so it is scaled by 2200/1500 and
 * CENTRED: only view-box x 174 to 925 is on screen at all, and the card
 * stream covers 284 to 833 of that. The two strips a viewer can actually see
 * are 174-284 and 833-925, and that is where these are, to the pixel.
 *
 * One opening width `w` sets every other number: the arch is struck at radius
 * `w` from each springing point so the two arcs meet 0.866w above them, the
 * shaft is 4.2w, the jamb is w/12, the transom sits a third of the way down.
 * Nothing is a value chosen on its own, which is what stops a window looking
 * assembled out of rectangles.
 */
// AND THE HEAD HAS TO CLEAR THE STICKY LOOM. The arch is the whole reading of
// the shape and the first placement put it at page y 589, which is under the
// stage for most of the scroll — so the springing is set to land the apex at
// about page y 900 and the sill just above the floor line at view-box 1040.
const DY_WIN = { w: 104, xs: [178, 826], sill: 1030, springing: 672 };
function _lancets() {
  const w = DY_WIN.w, sp = DY_WIN.springing, sill = DY_WIN.sill;
  const apex = sp - w * 0.866;                       // two arcs of radius w meet here
  let s = '<g class="dy-panes">';
  for (const x of DY_WIN.xs) {
    const d = 'M' + x + ' ' + sill + 'V' + sp
      + 'A' + w + ' ' + w + ' 0 0 1 ' + (x + w / 2) + ' ' + apex.toFixed(1)
      + 'A' + w + ' ' + w + ' 0 0 1 ' + (x + w) + ' ' + sp
      + 'V' + sill + 'Z';
    s += '<path d="' + d + '" fill="url(#dyPane)"/>'
      + '<path d="' + d + '" fill="none" stroke="#141210" stroke-width="9"/>'
      // one mullion to the springing, one transom a third of the way down
      + '<path d="M' + (x + w / 2) + ' ' + sp + 'V' + sill
      + 'M' + x + ' ' + (sp + (sill - sp) / 3).toFixed(0) + 'h' + w
      + '" stroke="#141210" stroke-width="6"/>';
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
    // The floor, and ONE line on it: where it meets the wall. The eight ruled
    // courses that used to be here were the same hairline grid the far plane
    // was deleted for, laid on a surface seen dead-on — which cannot have
    // perspective and so read as graph paper rather than as flags.
    + '<path d="M0 1040h1100v460H0z" fill="url(#dyFloor)"/>'
    + '<path d="M0 1040h1100" stroke="#443a2c" stroke-width="2" opacity=".55"/>';
  // THE SHAFT, and it is the one thing on this screen that keeps time. One
  // per window, skewed as a group by the phase. Now that the windows are in
  // the side walls the shafts RAKE INWARD — light from a side window lands
  // across the middle of a floor, it does not fall straight down the wall it
  // came through — which is also what makes the phase skew read as the sun
  // moving rather than as the drawing shearing.
  s += '<g class="dy-shaft">';
  for (const x of DY_WIN.xs) {
    const inward = x < 550 ? 1 : -1;                 // toward the middle of the room
    const land = x + DY_WIN.w / 2 + inward * 300;    // where the middle of it falls
    s += '<path d="M' + x + ' ' + DY_WIN.springing + ' L' + (x + DY_WIN.w) + ' '
      + DY_WIN.springing + ' L' + (land + 300) + ' 1500 L'
      + (land - 300) + ' 1500 Z" fill="url(#dyShaft)"/>';
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

/**
 * The fore plane: the near arch, and nothing else.
 *
 * IT HAD TWO THINGS ON IT AND BOTH WERE DUPLICATES OF SOMETHING BETTER.
 *
 * The eight SVG cords down the right-hand side were the clearest duplicate on
 * the screen: `.dy-warpfall` in the stylesheet draws the same eight family
 * colours down the same strip, for the FULL page height, which is the version
 * the plane-height invariant needs. The SVG pair stopped at 2200px and ran
 * out of register with the CSS pair, so the right margin was two sets of
 * coloured hairlines crossing each other at a slight angle.
 *
 * The two side rectangles were flat black at .92 with hard vertical seams at
 * x=150 and x=950 — visible as seams, which is what the selection screen's
 * gateposts were deleted for — and `.dy-vig` already lays a radial vignette
 * over the whole page and does the job properly. They were also the reason
 * the only two margins a viewer can actually see were painted out, which is
 * where the windows have just been moved to.
 */
function _hallFore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<path d="M0 0h1100v96c-190 40-360 60-550 60S190 136 0 96z" fill="#0d0b09"/>'
    + '</svg>';
}

/**
 * The hero plate: a loom in the window light, and nothing else.
 *
 * NOT A ROOM AND NOT A CROWD. Every other hero in this set is a place or a
 * pair of people. This one is an OBJECT, close up, because the screen's claim
 * is about a mechanism — stories that accumulate — and a mechanism is best
 * argued by showing the machine.
 *
 * ── WHAT WAS DELETED, AND IT IS MOST OF WHAT WAS HERE ─────────────────
 *
 * THE BASKET OF SPOOLS IS GONE. Six flat ellipses with a hole punched in each
 * sat on a trapezoid, at real size, in the brightest corner of the plate:
 * doughnuts on a tray. It is the same call the selection screen made on the
 * door-sized hand — the left third is a graded darkness again, and a graded
 * darkness beats a badly drawn object every time.
 *
 * AND THE CLOTH IS CLOTH NOW. The woven bands used to be eight DIFFERENT
 * lengths driven off the thread count, ragged down the right-hand side, which
 * at real size reads as a bar chart with a wooden frame around it — the one
 * thing a loom must not look like. Weft goes selvedge to selvedge: every
 * course is the full width of the warp, and what the day's thread count moves
 * is HOW MUCH cloth there is, which is the honest reading of it anyway.
 *
 * WHAT MAKES IT READ AS A LOOM IN A SECOND is one line: the FELL, where the
 * weaving has got to. Bare warp above it, finished cloth below it, and the
 * shuttle lying on the fell where it was put down. That is the whole drawing,
 * and it is also, exactly, what this screen is about.
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

  // ── THE LOOM ────────────────────────────────────────────────────────
  // IN THE RIGHT THIRD AND MEASURED OFF THE LOCKUP, not merely "off to the
  // right". The shell is 1100 wide and the centred title runs to x=792 at its
  // widest, so the loom starts at 790 — the first version began at 640 and
  // the cloth was drawn straight through the word DAY. It also used to be
  // translated 96 further right than a drawing that already ended at x=1042,
  // so the far upright was sliced off by the frame. Both found by rendering.
  // Every number below is measured off the frame: uprights at the ends, beams
  // across them, warp between the beams, cloth from the breast beam up to the
  // fell.
  const L = 790, R = 1058, TOP = 64, BREAST = 330;   // the frame
  const warpL = L + 24, warpR = R - 24;
  const courses = 4 + (Math.abs(Number(threadCount) || 0) % 4);  // how much cloth
  const band = 17;
  const fell = BREAST - courses * band;              // where the weaving got to

  s += '<g>'
    // uprights, then the two beams across them
    + '<path d="M' + L + ' ' + TOP + 'h18v' + (452 - TOP) + 'h-18zM' + (R - 18) + ' '
    + TOP + 'h18v' + (452 - TOP) + 'h-18z" fill="#2f281e"/>'
    + '<path d="M' + (L - 16) + ' ' + (TOP - 20) + 'h' + (R - L + 32) + 'v24H' + (L - 16) + 'z'
    + 'M' + (L - 16) + ' ' + BREAST + 'h' + (R - L + 32) + 'v18H' + (L - 16) + 'z" fill="#3a3025"/>';

  // the warp: one even rank of threads, beam to beam
  for (let x = warpL; x <= warpR; x += 13) {
    s += '<path d="M' + x + ' ' + (TOP + 4) + 'V' + BREAST
      + '" stroke="#6a5c46" stroke-width="1.6" opacity=".78"/>';
  }
  // the cloth: full-width courses, selvedge to selvedge, one colour each
  for (let i = 0; i < courses; i++) {
    s += '<rect x="' + warpL + '" y="' + (fell + i * band) + '" width="' + (warpR - warpL)
      + '" height="' + (band - 2) + '" fill="' + cols[i % cols.length]
      + '" opacity="' + (0.46 + (i % 3) * 0.1).toFixed(2) + '"/>';
  }
  // THE FELL. One bright line, and it is the whole reading of the drawing.
  s += '<path d="M' + warpL + ' ' + fell + 'H' + warpR
    + '" stroke="#f4e8c6" stroke-width="2.4" opacity=".5"/>';
  // the shuttle, lying on the fell where it was put down: a slender pointed
  // boat with the quill showing through the throat of it
  const sx = warpL + 54, sy = fell + 9;
  s += '<path d="M' + sx + ' ' + sy + 'l30-9h84l30 9-30 9h-84z"'
    + ' fill="#4a3d2c" stroke="#6d5c42" stroke-width="2" stroke-linejoin="round"/>'
    + '<rect x="' + (sx + 52) + '" y="' + (sy - 4) + '" width="44" height="8" rx="4"'
    + ' fill="#d2a44e" opacity=".85"/>';
  // loose ends falling off the breast beam, three of them
  for (let i = 0; i < 3; i++) {
    const x = warpL + 40 + i * 70;
    s += '<path class="dy-cord" d="M' + x + ' ' + (BREAST + 18) + ' q'
      + (i % 2 ? 9 : -9) + ' 60 2 128" stroke="' + cols[i * 2]
      + '" stroke-width="2.4" fill="none" opacity=".6"'
      + ' style="animation-delay:' + (-i * 1.7).toFixed(1) + 's"/>';
  }
  s += '</g>'
    + '<rect y="150" width="1100" height="320" fill="url(#dyHeroScrim)"/>'
    + '</svg>';
  return s;
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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&display=swap');

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
/* DARKER AND SOFTER THAN IT WAS, BUT NOT AS DARK AS IT BECAME. The first
   pass ran three lancets at full brightness directly behind the first cards
   and the top of the page read as fog rather than as a lit room, so it was
   knocked back to brightness .6 / opacity .62 -- which then took the windows
   with it once they moved out to the margins, where the vignette is at its
   strongest and there is nothing to overpower. The fog was the windows being
   BEHIND THE STREAM, not the plane being bright; with them out at the sides
   the plane can come back up. Both numbers measured by rendering it. */
.dy-far {z-index:0;filter:blur(2.6px) saturate(.75) brightness(.78);opacity:.72}
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
.dy-panel-h{
  display:flex;align-items:baseline;gap:12px;margin-bottom:9px;
  font-family:var(--dy-display);font-weight:700;font-size:9px;letter-spacing:.32em;
  text-transform:uppercase;color:rgba(236,227,208,.5);
}
.dy-panel-h b{font-family:var(--dy-display);font-weight:900;font-size:14px;
  letter-spacing:0;text-transform:none;color:var(--dy-brass-hot)}
.dy-parts{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:9px}
.dy-part{
  display:inline-flex;align-items:baseline;gap:8px;
  padding:5px 11px;border:1px solid rgba(255,238,196,.16);
  background:rgba(30,26,21,.82);
  font-family:var(--dy-display);font-weight:700;font-size:12px;color:rgba(236,227,208,.6);
}
.dy-part[data-here="1"]{border-color:var(--dy-brass);color:#f6eeda;
  background:rgba(200,162,74,.14)}
.dy-part-n{font-family:var(--dy-body);font-size:12px;color:rgba(236,227,208,.45)}
.dy-whos{display:flex;flex-wrap:wrap;gap:6px}
.dy-who{display:inline-flex;align-items:center;gap:6px;
  font-family:var(--dy-display);font-weight:700;font-size:11.5px;
  color:rgba(236,227,208,.68);padding:3px 8px 3px 3px;
  border:1px solid rgba(255,238,196,.12)}
.dy-who[data-busy="1"]{border-color:rgba(200,162,74,.5);color:#f6eeda}
.dy-who b{font-family:var(--dy-body);font-size:11px;color:var(--dy-brass-hot)}
.dy-panel-empty{font-family:var(--dy-body);font-style:italic;font-size:14px;
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

/* ── THE CARDS OF ONE SCENE ─────────────────────────────────────────
   A scene is four or five cards and they have to read as ONE scene. The
   establishing card carries the room and opens a gap above itself; the cards
   after it sit tight underneath, share the cord, and are progressively
   quieter, so the eye runs down a scene and stops at the next room heading. */
.dy-beat.dy-vis .dy-scene[data-beat="establish"]{margin-top:14px}
.dy-scene[data-beat="action"],
.dy-scene[data-beat="reaction"],
.dy-scene[data-beat="consequence"]{border-top:none}
.dy-scene[data-beat="reaction"] .dy-say{font-family:var(--dy-hand);font-size:19.5px}
.dy-scene[data-beat="consequence"]{
  background:linear-gradient(168deg,rgba(40,35,27,.94),rgba(20,18,14,.96));
}
.dy-scene[data-beat="consequence"] .dy-say{font-size:17.5px;
  color:rgba(240,232,214,.8)}
/* THE ROOM AND THE HOUR, which is the only heading a scene gets. */
.dy-place{
  font-family:var(--dy-display);font-weight:700;font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--dy-thread,#b6ac96);margin-bottom:9px;
}
/* AN HOUR THE RUNNING ORDER DOES NOT HAVE. Marked, never blended in. */
.dy-unsched{
  margin:30px 0 8px 26px;padding:12px 16px;
  border:1px dashed rgba(255,238,196,.4);background:rgba(200,162,74,.08);
}
.dy-unsched-k{font-family:var(--dy-display);font-weight:700;font-size:9px;
  letter-spacing:.3em;text-transform:uppercase;color:var(--dy-brass-hot)}
.dy-unsched p{font-family:var(--dy-body);font-style:italic;font-size:15px;
  color:rgba(236,227,208,.72);margin:5px 0 0}

.dy-say{font-family:var(--dy-body);font-size:19px;line-height:1.56;
  color:rgba(240,232,214,.94);margin:0}
.dy-say + .dy-say{margin-top:8px}
/* SPOKEN LINES: the speaker's face and name, then the words. */
.dy-line{margin:8px 0 0;padding-left:12px;border-left:2px solid rgba(214,178,110,.35);
  font-family:var(--dy-body);font-size:18px;line-height:1.5;color:rgba(244,236,220,.96)}
.dy-line + .dy-say{margin-top:10px}
.dy-line-who{display:inline-flex;align-items:center;gap:6px;vertical-align:middle;
  font-family:var(--dy-display);font-size:13px;letter-spacing:.04em;color:#e6c27a}
.dy-line-who .cv-av{width:22px;height:22px}
.dy-line-who i{font-style:italic;font-weight:400;color:rgba(230,194,122,.7)}
.dy-line-q{font-style:normal}
.dy-cam{border-left-color:rgba(160,190,220,.45)}
.dy-cam .dy-line-q{font-style:italic}
.dy-faces{display:flex;align-items:center;gap:8px;margin:12px 0 0;flex-wrap:wrap}
.dy-face{display:inline-flex;align-items:center;gap:8px;
  font-family:var(--dy-display);font-weight:700;font-size:12px;letter-spacing:.04em;
  color:rgba(236,227,208,.78)}
/* THE INITIALS FALLBACK STAYS INSIDE ITS OWN FRAME, NEVER INLINE WITH THE NAME.
   When a player has no avatar file the portrait draws its initials ("P", "R")
   as the fallback; those must stay clipped inside the box and be separated from
   the name by the flex gap, not run flush against it ("PPriya", "RRaj"). The
   name is a sibling text node right after the <span class="cv-av">, so a
   PORTRAIT_CSS that is missing on this screen — or, more to the point, one that
   a later screen's own bare .cv-av-ini rule has overridden lower in the same
   document — lets the initials fall out of the frame and mash into the name.
   These SCOPED copies carry higher specificity than the bare global rule, so
   they win the cascade wherever castle-day draws a portrait beside a name (the
   establishing faces and the sidebar loom rows alike). Mirrors the same fix
   already carried by cold-open.js's .co-face-chip. */
.dy-face .cv-av,.dy-who .cv-av{position:relative;overflow:hidden;flex:none}
.dy-face .cv-av-ini,.dy-who .cv-av-ini{position:absolute;inset:0}

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
  display:flex;gap:11px;align-items:center;
  margin:14px 0 0;padding:11px 15px;
  border:1px solid rgba(246,238,218,.28);
  background:linear-gradient(96deg,rgba(246,238,218,.08),rgba(16,14,12,.42));
}
.dy-knot-w{font-family:var(--dy-display);font-weight:900;font-size:15.5px;line-height:1.2;
  color:#f6eeda}
.dy-knot[data-sense="cracked"]{border-color:rgba(208,87,107,.5);
  background:linear-gradient(96deg,rgba(208,87,107,.14),rgba(16,14,12,.42))}
.dy-knot[data-sense="coupled"]{border-color:rgba(220,149,180,.5);
  background:linear-gradient(96deg,rgba(220,149,180,.14),rgba(16,14,12,.42))}

/* ── THE SPOKEN LINE — pulled out of the narration, in a hand ────────── */
.dy-say + .dy-say{margin-top:11px}
.dy-say.dy-spoken{font-family:var(--dy-hand);font-size:19.5px;line-height:1.5;
  color:rgba(245,238,222,.96);padding-left:14px;
  border-left:2px solid rgba(255,238,196,.28);margin-top:13px}

/* ── THE CONSEQUENCE — what changed, under a hairline in its own block ── */
.dy-outcome{margin-top:15px;padding-top:14px;
  border-top:1px solid rgba(255,238,196,.14)}
.dy-outcome .dy-say-out{font-size:17.5px;line-height:1.55;
  color:rgba(240,232,214,.82)}

/* ── THE IMPACT ROW — the suspicion / bond / popularity a scene moved ──
   A chip carries the avatar(s) of the people concerned and which way the
   thing went. Visually a row of tokens, never sentences, so the eye reads the
   consequences of a scene without reading its prose. */
.dy-impact{margin-top:15px;padding-top:13px;
  border-top:1px dashed rgba(255,238,196,.16)}
.dy-impact-k{display:block;font-family:var(--dy-display);font-weight:700;
  font-size:8.5px;letter-spacing:.28em;text-transform:uppercase;
  color:rgba(236,227,208,.44);margin-bottom:9px}
.dy-chips{display:flex;flex-wrap:wrap;gap:8px}
.dy-chip{display:inline-flex;align-items:center;gap:6px;
  padding:4px 10px 4px 5px;border-radius:14px;
  border:1px solid rgba(255,238,196,.2);background:rgba(16,14,12,.5);
  font-family:var(--dy-display);font-weight:700;font-size:11px;letter-spacing:.02em;
  color:rgba(236,227,208,.9)}
.dy-chip .cv-av{position:relative;overflow:hidden;flex:none}
.dy-chip .cv-av-ini{position:absolute;inset:0}
.dy-chip-av{display:inline-flex}
.dy-chip-link{color:rgba(236,227,208,.5);font-weight:400;margin:0 -2px}
.dy-chip-to{color:rgba(236,227,208,.6);font-size:13px;margin:0 -1px}
.dy-chip-t{margin-left:3px;display:inline-flex;align-items:center;gap:4px;
  text-transform:uppercase;font-size:9.5px;letter-spacing:.12em;
  color:rgba(236,227,208,.72)}
.dy-chip-ar{font-size:10px}
.dy-chip-note{margin-left:2px;font-family:var(--dy-hand);font-style:italic;font-weight:400;text-transform:none;letter-spacing:0;font-size:10px;color:rgba(236,227,208,.5)}
.dy-chip-up{border-color:rgba(122,178,122,.5);background:rgba(70,110,70,.18)}
.dy-chip-up .dy-chip-ar{color:#8fd08f}
.dy-chip-dn{border-color:rgba(208,110,110,.5);background:rgba(120,60,60,.18)}
.dy-chip-dn .dy-chip-ar{color:#e08a8a}
.dy-chip[data-k="susp"].dy-chip-up{border-color:rgba(210,150,74,.55);
  background:rgba(150,100,40,.18)}
.dy-chip[data-k="susp"].dy-chip-up .dy-chip-ar{color:#e6b25a}

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
/* ══ READABILITY PASS (2026-09-29) ═════════════════════════════════════
   The user found these pages hard to read next to Perfect Match. What was
   wrong, measured on a real morning: narration, speech and results all in one
   thin display serif at one size and one muted colour; the spoken line — the
   interesting part — the smallest and most italic thing on the card; the
   establishing sentence restating the header in full; tiny tracked capitals
   everywhere. So: a book face for the text, speech the largest and brightest
   thing with a face beside it, the establishing line set as a stage
   direction, the history as a footnote, the result as one tinted block. */
.dy-root{--dy-text:'Crimson Pro',Georgia,'Times New Roman',serif}
.dy-scene{padding:16px 22px 18px}
.dy-sh{display:flex;align-items:center;gap:12px;margin:0 0 10px}
.dy-stack{display:flex;flex:none}
.dy-stack .cv-av{position:relative;overflow:hidden;flex:none;box-shadow:0 0 0 2px #1d1914}
.dy-stack .cv-av-ini{position:absolute;inset:0}
.dy-stack .cv-av + .cv-av{margin-left:-10px}
.dy-sh-t{min-width:0}
.dy-sh .dy-place{margin:0;font-size:11px;letter-spacing:.2em;opacity:1}
.dy-sh-who{font-family:var(--dy-display);font-weight:700;font-size:15px;letter-spacing:.01em;color:#f4ead4;line-height:1.25}
.dy-scene .dy-say{font-family:var(--dy-text);font-size:18px;line-height:1.55;color:rgba(240,232,214,.9)}
.dy-scene .dy-say.dy-dir{font-style:italic;font-size:16px;color:rgba(236,227,208,.6);margin:0 0 6px}
.dy-scene .dy-say.dy-act{color:rgba(240,232,214,.86);margin-top:10px}
.dy-scene .dy-line{display:flex;gap:12px;align-items:flex-start;margin:12px 0 0;padding:0;border:0;
  font-family:var(--dy-text);font-size:20px;line-height:1.42;color:#fbf4e4}
.dy-line-av{flex:none;padding-top:2px}
.dy-line-av .cv-av{position:relative;overflow:hidden;box-shadow:0 0 0 2px rgba(230,194,122,.55)}
.dy-line-av .cv-av-ini{position:absolute;inset:0}
.dy-line-body{display:block;min-width:0}
.dy-scene .dy-line-who{display:block;font-family:var(--dy-display);font-weight:700;font-size:12.5px;letter-spacing:.06em;
  color:#e6c27a;margin-bottom:1px}
.dy-scene .dy-line-who b{font-weight:700}
.dy-scene .dy-line-q{display:block;font-style:normal;font-weight:500}
.dy-scene .dy-cam .dy-line-who{color:#9fbde0}
.dy-scene .dy-cam .dy-line-av .cv-av{box-shadow:0 0 0 2px rgba(159,189,224,.6)}
.dy-scene .dy-cam .dy-line-q{font-style:italic;font-weight:400;color:#dfe9f5}
.dy-recall{display:flex;align-items:center;flex-wrap:wrap;gap:4px 12px;margin-top:12px}
.dy-recall .dy-say{font-size:14.5px;font-style:italic;color:rgba(236,227,208,.55);margin:0}
.dy-recall .dy-stitch{margin:0;padding:0;background:none;border:0}
.dy-recall .dy-stitch-k{margin:0;font-size:8.5px}
.dy-scene .dy-outcome{margin-top:14px;padding:10px 14px 11px;border:0;border-left:3px solid rgba(236,227,208,.3);
  background:rgba(255,238,196,.05)}
.dy-scene .dy-outcome[data-tone="smooth"]{border-left-color:rgba(122,178,122,.8);background:rgba(70,110,70,.12)}
.dy-scene .dy-outcome[data-tone="adverse"]{border-left-color:rgba(208,110,110,.85);background:rgba(120,60,60,.14)}
.dy-scene .dy-outcome .dy-say-out{font-size:16.5px;color:rgba(244,236,220,.9)}
.dy-scene .dy-outcome .dy-impact{margin-top:9px;padding-top:0;border:0}
.dy-scene .dy-outcome .dy-impact-k{display:none}
.dy-scene .dy-say.dy-spoken{font-family:var(--dy-text);font-size:19px}
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

// ══════════════════════════════════════════════════════════════════════
// THE DAY, SPLIT INTO THREE BROADCAST SEGMENTS  (Plan 11, interleave)
// ══════════════════════════════════════════════════════════════════════
//
// The day used to be ONE screen at the foot of the episode, after the conclave,
// because two of its phases happen after the Round Table and drawing the whole
// stream anywhere above the table printed a reaction three screens before the
// reveal it reacted to. That rule is intact — it is why the NIGHT segment still
// sits after the table — but the other two thirds of the day happen BEFORE the
// table and belong at their real chronological moment: the morning before the
// mission, the afternoon between the mission and the table.
//
// So the screen is parameterised by SEGMENT rather than duplicated three times.
// Each segment names the phases (js/tr/castle/phases.js) it draws, and the
// registration in screens.js binds one segment per screen. `null`/undefined is
// the WHOLE day, unchanged, which is what the transcript renderer and every
// existing test that calls `rpBuildCastleDay(ep, observer)` still gets.
const SEGMENT_PHASES = {
  morning: ['breakfast-fallout', 'morning-life'],
  afternoon: ['mission-fallout', 'private-strategy'],
  night: ['roundtable-scramble', 'post-banishment'],
};
// The two windows that happen AFTER the Round Table's banishment. A scene in
// one of them may only ever appear in the NIGHT segment — see the causality
// guard in `_view`.
const POST_TABLE_WINDOWS = new Set(['after-table', 'night']);
/**
 * Does a phase id belong in this segment?
 *
 * The six named phases split three-and-three. The overflow bucket
 * (`unmapped:<window>`, appended by `castlePhaseRecord` when a scene fires
 * under a window the running order has never heard of) rides on the NIGHT
 * segment — the last one — so that a scene can never be dropped by the split.
 * It is inert today (every window maps to a phase), a guard for a window an
 * author adds next year without also updating `WINDOW_TO_PHASE`.
 */
function _phaseInSegment(phaseId, segment) {
  const list = SEGMENT_PHASES[segment];
  if (!list) return true; // whole day
  if (list.includes(phaseId)) return true;
  if (segment === 'night' && String(phaseId).indexOf('unmapped:') === 0) return true;
  return false;
}

/**
 * Does a record carry any castle scene in this segment's phases?
 *
 * `screens.js` registers each segment screen off this — the same rule as
 * every other castle screen, off the RECORD and never an episode number — so
 * the phase→segment split lives in ONE place. The scene→phase grouping is
 * already on the record (`castlePhaseRecord`), so this is a pure read.
 */
export function castleSegmentHasScenes(r, segment) {
  const phases = r && r.tr && r.tr.castle && r.tr.castle.phases;
  if (!Array.isArray(phases)) return false;
  return phases.some(ph => _phaseInSegment(ph.id, segment)
    && Array.isArray(ph.scenes) && ph.scenes.length);
}

function _sceneFor(scene, watcher) {
  if (watcher == null) return 'full';
  // ── ONE NAMED PARTICIPANT IS A CLAIM HERE TOO (Task 7 stage 6) ────────
  //
  // The union of `people` and `actors` is the right entitlement rule in
  // general: either claim to having been in the room earns the full layer,
  // because a scene the runner convened you into is a scene you were standing
  // in. It is wrong for the same handful of events `_mode` carves out — the
  // ones convened as a pair that report exactly ONE participant on purpose,
  // because the branch is something the other person is not present for
  // (`susp-pattern-tracking:tracked`, `trust-defend-in-absentia`,
  // `cover-alone-with-it`, `cover-feign-fear:borrowed-it`). Without this the
  // two functions disagree: `_mode` composes a one-person scene while this
  // grants the full layer to somebody the scene has just said was not there,
  // and `tests/tr-castle-prose.test.js`'s observer arm catches the
  // disagreement exactly as it should — a player holding the audience stream
  // for a scene whose own `participants` list does not contain them.
  //
  // A ONE-PERSON CLAIM IS ALSO NEVER A LEAK. Somebody who was convened and
  // then written out of the scene falls to `heard` (or, in a private hour, to
  // `none`), which is the SAFER layer in both directions — the same rule the
  // union applies to everybody else who was not in the room.
  const claimed = (scene.people || []).filter(Boolean);
  const inIt = claimed.length === 1
    ? claimed[0] === watcher
    : claimed.includes(watcher) || (scene.actors || []).includes(watcher);
  if (inIt) return 'full';
  return PRIVATE_HOURS.has(scene.window) ? 'none' : 'heard';
}

function _view(ep, observer, segment = null) {
  const c = ep && ep.tr && ep.tr.castle;
  if (!c) return null;
  _firstDay = Number(c.ep != null ? c.ep : (ep.tr && ep.tr.ep) || ep.num || 0) === 1;
  const obs = observer == null ? 'audience' : String(observer);
  const isAudience = obs !== null && obs.indexOf('player:') !== 0;
  const watcher = obs.indexOf('player:') === 0 ? obs.slice('player:'.length) : null;

  const all = Array.isArray(c.scenes) ? c.scenes : [];

  // ── THE DAY IN THE ORDER TASK 5 PUT IT IN ───────────────────────────
  //
  // `c.phases` is the chronological Castle Day (js/tr/castle/phases.js): six
  // named parts, always all six, in fixed order, with an OVERFLOW BUCKET
  // (`unmapped:<window>`) appended when a scene arrives under a window the
  // running order has never heard of. That bucket exists so a scene can never
  // be silently dropped, and a screen that ignored it would put the loss back
  // — so it is walked like the rest and MARKED when it is drawn.
  //
  // A ROW MAY NOT HAVE IT. `tests/tr-vp.test.js` constructs a night-only row
  // by hand to reach the withheld-day branch, and that row carries `scenes`
  // and no `phases`; so does any record written before Task 5. The fallback is
  // the scenes in the order they fired, which is the same order on every real
  // day anyway — the phases are chronological by construction.
  const phaseOf = new Map();
  const bands = [];
  for (const ph of (Array.isArray(c.phases) ? c.phases : [])) {
    // A SEGMENT DRAWS ONLY ITS OWN PHASES. The whole day (segment null) keeps
    // every phase, so the transcript and every legacy caller are unchanged.
    if (segment && !_phaseInSegment(ph.id, segment)) continue;
    bands.push(ph);
    for (const s of (ph.scenes || [])) phaseOf.set(s, ph);
  }
  const ordered = bands.length
    ? bands.flatMap(ph => (ph.scenes || []).filter(s => all.includes(s)))
    // A segment with no matching phases renders empty; only the whole day
    // falls back to the raw scene list (the hand-built night-only test rows,
    // and any record written before phases existed).
    : (segment ? [] : all.slice());
  // Anything the record holds and no phase claimed still gets drawn. Same rule
  // as the overflow bucket itself, one level up. NOT for a segment — a segment
  // is exactly its phases, and an unclaimed scene it did not ask for would be
  // the split silently leaking material from another hour.
  if (!segment) for (const s of all) if (!ordered.includes(s)) ordered.push(s);

  const scenes = [];
  let missedInTheDark = 0;
  for (const s of ordered) {
    const layer = _sceneFor(s, watcher);
    if (layer === 'none') { missedInTheDark++; continue; }
    const ph = phaseOf.get(s) || null;
    scenes.push({ ...s, layer,
      phaseId: ph ? ph.id : null,
      phaseLabel: ph ? ph.label : null,
      unscheduled: !!(ph && String(ph.id).indexOf('unmapped:') === 0) });
  }

  // ── CAUSALITY: A MORNING MAY NOT REACT TO A NIGHT THAT HAS NOT HAPPENED ──
  //
  // This is why the day used to live at the foot of the episode. The banishment
  // happens at the Round Table, which sits between the `evening` window and the
  // `after-table`/`night` windows; a scene reacting to it can only fire in one
  // of those two post-table windows, which belong to the NIGHT segment alone.
  // If a scene from a post-table window has been sorted into the morning or the
  // afternoon segment, the split is broken and the screen would print a
  // reaction to a banishment that, in broadcast order, has not happened yet.
  // Surface it — do not render it. Mutate `SEGMENT_PHASES.morning` to include
  // `'post-banishment'` and this throws, which is the band on the guard.
  if (segment === 'morning' || segment === 'afternoon') {
    for (const s of scenes) {
      if (POST_TABLE_WINDOWS.has(s.window)) {
        throw new Error('tr castle causality: the ' + segment + ' segment holds a '
          + 'post-banishment scene "' + (s.eventId || s.threadId || '?')
          + '" from window "' + s.window + '" — it would react to a banishment '
          + 'that has not happened yet in broadcast order');
      }
    }
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
      row = { threadId: s.threadId, colour: fam.colour,
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

  // ── IMPACT CHIPS: what each scene actually moved, observer-gated ───────
  // Read the episode's receipts once and attach the movements to each scene,
  // gated by the same layer/watcher this view was built for.
  // ── THE READ LABEL, STRIPPED FOR EVERYBODY IT WOULD TELL SOMETHING ──
  //
  // `readKind` is computed in js/tr/headless.js off ground truth: `threat`
  // means the doubter is a Traitor watching somebody they KNOW is innocent,
  // `pact` means they are reading a fellow. Either value names the doubter's
  // alignment to anybody who can see it, so it is exactly as sensitive as the
  // alignment itself and is dropped for every observer except the two who
  // already have it — the AUDIENCE, and the DOUBTER, who is that person.
  //
  // Same gate the suspicion chip below already applies, and applied here
  // rather than at each use so a later reader cannot pick the field up
  // without it.
  for (const s of scenes) {
    if (!s.readKind) continue;
    if (!isAudience && watcher !== s.readDoubter) { s.readKind = null; }
  }

  // `impacts` is the viewer-safe projection js/tr/headless.js writes; the
  // full ledger it comes from is the Debug screen's alone.
  const _impacts = (ep.tr && Array.isArray(ep.tr.impacts)) ? ep.tr.impacts : [];
  const _epNum = c.ep != null ? c.ep : (ep.tr && ep.tr.ep) || ep.num || 0;
  for (const s of scenes) {
    s.chips = _chipsFor(_impacts, _epNum + ':' + s.window + ':' + s.eventId,
      s.layer, isAudience, watcher);
    if (s.layer !== 'heard') {
      // The real thing wins: if the scene wrote a belief/doubt receipt, that
      // drives the suspicion chip. Only fall back to the record-derived
      // direction when the scene moved no belief (a bonds-only event, or a read
      // the priced channel refused).
      const hasReal = s.chips.some(c => c.type === 'suspicion');
      if (!hasReal) {
        const susp = _suspicionChipFromRecord(s, isAudience, watcher);
        if (susp) s.chips = [susp, ...s.chips];
      }
    }
  }

  // EVERY NAME THE DAY COULD BE ABOUT. `_mode` needs it to tell a scene with
  // one person in it from a scene with one person in the SENTENCE, and the
  // record's own cast list is the only place to get it without importing the
  // engine. Falls back to the living list, then to the scenes themselves.
  const cast = [...new Set([
    ...((ep.tr && ep.tr.cast) || []),
    ...((ep.tr && ep.tr.living) || []),
    ...all.flatMap(x => [...(x.actors || []), ...(x.people || []), ...(x.parties || [])]),
  ].filter(Boolean))];

  return {
    ep: c.ep != null ? c.ep : (ep.tr && ep.tr.ep) || ep.num || 0,
    isAudience, watcher, scenes, order, rows, missedInTheDark, cast,
    segment,
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
    'Nobody won anything today. Several people lost something and have not '
    + 'noticed yet.',
    'Watch the ones who said the least. There were fewer of them than usual today.',
  ],
  quiet: [
    'A quiet day. Not much happened out loud, but plenty went on underneath.',
    'Not much happened out loud today, and that usually means something is being planned.',
    'A slow day. Everybody spent it thinking.',
    'Very little to report today.',
  ],
  woven: [
    'Three or four of those were the same story, and only some of them know it.',
    'Look at what carried over. Look very hard at who it carried over onto.',
    'Stories in this place are not events. They are debts, and they come due.',
    'Every one of those stories goes somewhere. One of them goes somewhere tonight.',
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
  'Neither of them mentioned day {d}, which is where all of this actually starts.',
  'The day itself went unmentioned. It was day {d}, and both of them know it.',
  'Not a word about day {d}. It is the whole reason this conversation exists.',
  'It has been running since day {d} and nobody in the room said the number.',
  'Day {d} did not come up. Day {d} did not need to.',
];

/** Twice in one round, between the same people, about the same thing. */
const SAME_DAY = [
  'The second time today, and about exactly the same thing.',
  'Twice in one day. Whatever this is, it did not keep until tomorrow.',
  'This had already come up once this morning.',
  'The same conversation, picked back up before the day was out.',
];

function _fill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null) ? subs[k] : m);
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

function _stitch(s, tail) {
  if (s.citation) {
    return '<div class="dy-stitch">'
      + '<div class="dy-stitch-k">' + _ic('needle', 12) + 'Back to' + _tabs(s)
      + '</div></div>';
  }
  const prior = [...new Set(s.priorDays || [])].sort((a, b) => a - b);
  if (prior.length) {
    return '<div class="dy-stitch">'
      + '<div class="dy-stitch-k">' + _ic('needle', 12) + 'The same story on' + _tabs(s)
      + '</div></div>';
  }
  return '<div class="dy-stitch">'
    + '<div class="dy-stitch-k">' + _ic('needle', 12) + 'Later the same day</div>'
    + '<p class="dy-stitch-t">' + _esc(tail) + '</p></div>';
}

/**
 * A CARD STARTS WITH A CAPITAL LETTER.
 *
 * Several establishing templates open on the hour rather than on a person —
 * "{when}, {a} stops at {loc}" — and `{when}` is a clause written for the
 * middle of a sentence, so the screen printed "after lights out, Chris McLean
 * stops at the window". Found by dumping a day and reading it; the alternative
 * (a second, capitalised copy of every hour phrase) is two copies of one
 * string, which is this repo's most-repeated bug.
 */
function _cap(t) {
  const v = String(t || '');
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/** Names as a person would say them: one, a pair, or a list. */
function _namesPhrase(list) {
  const l = [...new Set((list || []).filter(Boolean))];
  if (!l.length) return 'the two of them';
  if (l.length === 1) return l[0];
  if (l.length === 2) return l[0] + ' and ' + l[1];
  return l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1];
}

/** Somebody alone, seen from across a room, is not two people talking. */
const PUBLIC_ACTION_SOLO = [
  'You come round the corner and {a} is already leaving, which is all you get of it.',
  'From the doorway it is one person standing still for slightly too long.',
  '{a} is on their own and stops being on their own the moment you are in the room.',
  'Whatever {a} was doing, {a} had finished doing it before you saw any of it.',
];

/**
 * ONE RECORDED SCENE, WRITTEN OUT AS A SCENE.
 *
 * Four cards, or five when the story is older than today. Every card's fact
 * comes off the record: the ACTION is the engine's own authored sentence, the
 * RECALL is the engine's citation or the days the story actually has beats on,
 * and the CONSEQUENCE is keyed on whether this beat started it, continued it
 * or ended it, plus the outcome the engine stored. Only the ROOM is composed
 * here, and a room is staging rather than a claim about the game.
 *
 * THE OBSERVER SPLIT HAPPENS HERE, BEFORE ANY MARKUP EXISTS. `audience` is the
 * whole scene. `public` is what somebody standing across the room got, and it
 * is written separately rather than being the same sentences with a class on
 * them — the thing withheld is the CONTINUITY, and prose that says "you have
 * no idea how long this has been going on" cannot be produced by hiding a
 * paragraph.
 */
function _composeScene(s, key, used, cast) {
  const shape = _mode(s, cast);
  const roll = _order(s, shape.roll);
  const mode = shape.mode;
  const a = roll[0] || 'Somebody';
  const b = mode === 'pair' || mode === 'group' ? roll[1] : null;
  const tone = _tone(s);
  // BUCKETED BY HOUR, and that is not decoration. Four rooms appear in two
  // hours' lists — the front hall and the kitchen are both a dawn room and an
  // after-table room — so a shared set had the morning's picks quietly
  // exhausting the evening's pool, and the third scene after the table fell
  // through to a repeat. Two consecutive scenes in the same room, which the
  // pacing contract forbids outright. Found by dumping a day and reading it.
  // A scene whose premise IS being up before anybody else is staged as an
  // earlier cut ("EARLIER · BEFORE BREAKFAST"), since the hour it is drawn in
  // comes after the breakfast screen. See EARLY_EVENTS.
  const stage = EARLY_EVENTS.has(s.eventId) ? 'early' : s.window;
  const loc = _pickUnique(PLACES[stage] || PLACES.morning, key + '|loc', used,
    'loc|' + stage);
  const subs = {
    a, b: b || a, loc,
    when: WHEN_SAID[stage] || 'somewhere in the middle of the day',
    names: _namesPhrase(roll),
    d: String(s.openedEp), n: String([...new Set(s.priorDays || [])].length),
    // THE CONCRETE SUBJECT, when the event recorded one. Empty string for a
    // legacy event, so a stray `{topic}` in an un-reworked pool renders blank
    // rather than literal — but no legacy pool carries the token.
    topic: s.topic ? String(s.topic) : '',
    // THE OTHER PERSON, role-safe. `{a}`/`{b}` swap with the scene's speaker
    // (a flip branch makes the tested person the speaker, so `a` becomes the
    // subject) — so a topic pool that means "the person who ISN'T the subject"
    // cannot say `{a}` and be sure. `{other}` is whichever participant is not
    // the topic, which stays the tester/observer across every branch. Falls
    // back to `b` (then `a`) when the topic is off-scene (a behind-the-back
    // check) or the scene is solo.
    other: (s.topic && roll.find(n => n && n !== s.topic)) || b || a,
    // THE SPEAKER'S PRONOUNS, so a pool can say "her story" instead of
    // "their story" over somebody the roster says is a woman.
    aSub: _prOf(a).sub, aObj: _prOf(a).obj, aPos: _prOf(a).posAdj, aRef: _prOf(a).ref,
    bSub: _prOf(b || a).sub, bObj: _prOf(b || a).obj, bPos: _prOf(b || a).posAdj,
  };
  // AND THE SAME FOR {topic} AND {other}, so a closing line can say "him" the
  // second time instead of the name a third time. Capitalised forms for a
  // pronoun that opens a sentence.
  {
    const tp = _prOf(subs.topic || a), op = _prOf(subs.other);
    const up = w => String(w || '').replace(/^./, c => c.toUpperCase());
    Object.assign(subs, { tSub: tp.sub, tObj: tp.obj, tPos: tp.posAdj, TSub: up(tp.sub),
      oSub: op.sub, oObj: op.obj, oPos: op.posAdj, OSub: up(op.sub) });
  }
  // A grounded event drives its own closing consequence off the recorded topic
  // and branch; legacy events keep the generic family/tone pools.
  const topicCfg = (s.topic && TOPIC_CONFIG[s.topicKind]) ? TOPIC_CONFIG[s.topicKind] : null;

  const estPool = _alive(mode === 'group' ? ESTABLISH_GROUP
    : mode === 'pair' ? (ESTABLISH_PAIR[stage] || ESTABLISH_PAIR.morning)
      : mode === 'solo' ? ESTABLISH_SOLO : ESTABLISH_SINGLE);
  const establish = _cap(_fill(_pickUnique(estPool, key + '|est', used), subs));

  const audience = [
    { kind: 'establish', text: establish, tone: 'neutral' },
    { kind: 'action', text: topicCfg ? _groundedAction(s, subs)
      : String(s.line || '').trim(), tone: 'neutral' },
  ];
  const carried = !s.opened;
  if (carried && (s.citation || (s.priorDays || []).length)) {
    // THE LEAD AND THE TAIL ARE SEPARATE because the card draws them in two
    // places — the lead as narration, the tail inside the element carrying
    // the day tabs — and the transcript has to read back the whole sentence.
    const tail = _recallTail(s, key, used);
    // A ONE-PERSON SCENE HAS NO "BOTH OF THEM". The pair leads printed "both of
    // them know precisely how much older" over one person in a corridor —
    // found by dumping a day and reading it, same as everything else here.
    // ── THE LEAD IS DRAWN IN THE SCENE'S OWN REGISTER ──────────────────
    //
    // `RECALL_LEAD_DAYS` was drawn regardless of tone, so "The argument
    // arrives already halfway through, because it started days ago" landed on
    // a trust, romance or grief beat — a card calling a shared mourning or a
    // quiet confidence an argument, in the one sentence whose whole job is to
    // say what KIND of thing has been running. Measured at 4.6% of carried
    // pair scenes before the split.
    //
    // The register is the one the reaction card is already keyed on
    // (`_reactClass`): `bond` is trust/romance and `loss` is grief, and both
    // are answered warmly. Everything else keeps the pool it had.
    // AND THE GROUP HALF, WHICH FIX ROUND 1 FOUND STILL OPEN. The split above
    // was applied to `mode === 'pair'` only, so a carried trust, romance or
    // grief scene with three or more people in it still drew "The argument
    // arrives already halfway through" out of the group pool. Same defect, same
    // register, one branch further down the same ternary.
    const warmCarry = WARM_RECALL_CLASSES.has(_reactClass(s));
    // A GROUNDED carried scene NAMES its subject in the lead — the fix for the
    // "whatever this is" filler landing above a consequence that names it in
    // full. The topic pools are mode/warmth-neutral, so they serve every shape;
    // legacy scenes (no recorded topic) keep the subject-free pools below.
    // A COVER STORY IS ONE THREAD WITH A NEW SUBJECT EVERY NIGHT: the
    // Traitor's account of whichever murder is newest. Naming tonight's
    // subject over the thread's whole history read "Back to the night Chef
    // Hatchet was murdered. It has come up on day 2…", three nights before he
    // was murdered. A cover recall says the story is old, not what it is about.
    const topicLead = subs.topic && s.kind !== 'cover';
    const leads = topicLead
      ? (tail.days ? RECALL_LEAD_DAYS_TOPIC : RECALL_LEAD_TODAY_TOPIC)
      : RECALL_LEAD_RECORDED;
    const lead = _fill(_pickUnique(leads, key + '|lead', used), subs);
    // FILLED, and this line is why the placeholder guard in tests/tr-vp.test.js
    // exists: `UNSPOKEN` carries a `{d}` and an earlier draft of this function
    // dropped the `_fill` when the tail became a record instead of a string, so
    // the screen printed "it has been running since day {d}".
    const tailText = _fill(tail.text, subs);
    // A second beat on the same day needs no separate recap card. The action
    // and grounded consequence already name the subject; adding "Later the
    // same day" plus a generic "this again" sentence only repeats them and
    // creates an antecedent-free paragraph. Keep recall for earlier DAYS,
    // where the viewer genuinely needs the history.
    if (tail.days) {
      audience.push({ kind: 'action', role: 'recall', lead, tail: tailText,
        text: lead + ' ' + tailText, tone: 'neutral' });
    }
  }
  // ── THE CONSEQUENCE ANSWERS THE RECORDED ACTION ───────────────────────
  //
  // Grounded actions already contain the response that belongs to the event.
  // A generic reaction here could name the wrong subject or contradict it.
  audience.push({ kind: 'consequence', ...(topicCfg
    ? _topicConsequence(s, subs, key, used, topicCfg, tone)
    : _receiptConsequence(s, subs, tone, key, used)) });

  const publicStream = [
    { kind: 'establish', tone: 'neutral',
      text: _cap(_fill(_pickUnique(
        b ? PUBLIC_ESTABLISH_PAIR : PUBLIC_ESTABLISH_SOLO, key + '|pubest', used), subs)) },
    { kind: 'action', tone: 'neutral',
      text: _fill(_pick(b ? PUBLIC_ACTION : PUBLIC_ACTION_SOLO, key + '|pub'), subs) },
    { kind: 'reaction', tone: 'neutral',
      text: _fill(_pick(b ? PUBLIC_CLOSE : PUBLIC_CLOSE_SOLO, key + '|pubclose'), subs) },
  ];

  // A DAYTIME SCENE IS NOT "TONIGHT". The consequence pools describe where two
  // people stand "tonight" whatever hour the scene is in, so a scene just after
  // breakfast closed on "Brick and Sanders have less ground under them
  // tonight". In the daylight hours that becomes "now"; a future "tonight"
  // (at the table tonight, the name for tonight) stays.
  if (DAYTIME.has(stage)) {
    const daylight = t => t.replace(/\b(at the table |for |into |until |before |at |by )?tonight(’s)?\b/g,
      (m, fut, poss) => (fut || poss ? m : 'now'))
      .replace(/than (?:it was |they were )?this morning/g, m => m.replace('this morning', 'yesterday'));
    for (const c of audience) {
      if (c.kind !== 'consequence') continue;
      // `say` is what the card draws when present; `text` is what the
      // transcript reads. Both, or the two disagree.
      for (const f of ['text', 'say']) if (typeof c[f] === 'string') c[f] = daylight(c[f]);
    }
  }
  // A NAME SAID TWICE IN ONE SENTENCE BECOMES A PRONOUN. See js/vp-tr/tidy.js.
  for (const c of [...audience, ...publicStream]) {
    for (const f of ['text', 'lead', 'tail', 'say']) {
      if (typeof c[f] === 'string') c[f] = tidyNames(c[f]);
    }
  }

  return {
    id: 'ep' + (s.epNum || 0) + '-' + s.window + '-' + s.eventId + '-' + s.beatNo,
    eventId: s.eventId,
    phase: s.phaseId || ('window:' + s.window),
    window: s.window,
    location: loc,
    when: WHEN_HEAD[stage] || 'DURING THE DAY',
    heading: loc.replace(/^the /, 'THE ').toUpperCase() + ' · '
      + (WHEN_HEAD[stage] || 'DURING THE DAY'),
    participants: roll,
    // WHAT THE SCREEN DECIDED, ON THE RECORD, so a guard can check the prose
    // against the reasons for it rather than against itself. `mode` is how many
    // people this screen is willing to claim were there; `tone` is whether the
    // stored branch says it went well or badly; `layer` is which observer this
    // record was composed for.
    mode, tone,
    // THE RECORDED SUBJECT, carried onto the composed scene so a guard (and the
    // consequence-chip row) can read what the scene is about without re-deriving it.
    topic: s.topic || null, topicKind: s.topicKind || null,
    layer: s.layer === 'heard' ? 'heard' : 'full',
    observerText: s.layer === 'heard'
      ? { public: publicStream }
      : { audience, public: publicStream },
  };
}

/**
 * WHO ANSWERED — THE RECORD FIRST, THE SENTENCE ONLY IF THE RECORD IS SILENT.
 *
 * THE FIELD WINS. `speaker`/`respondent` are written by `_castleRecord`
 * (js/tr/headless.js) from what the EVENT declared, and an event that declares
 * it is never second-guessed here: the paragraph below describes a heuristic
 * that inverts the scene in a small share of cases, and once the engine has
 * said which way round it goes there is nothing left for a heuristic to add.
 * The fallback stays because most of the pool has not been annotated yet — a
 * silent record is the common case today, not the exception.
 *
 * ── AND THE FALLBACK, WHICH IS STILL A HEURISTIC ──
 *
 * The record could not say. `actors` is the order the scheduler convened them in,
 * and the authored line is free to put either of them first — trust.js's
 * `trust-trade-reads` convenes [Chase, Brody] and writes "Brody asked, and
 * Chase answered". Ordering off `actors` therefore had the reaction card
 * answering in the questioner's voice, which a reader sees immediately: Bowie
 * asked a question and Bowie replied to it. Found by dumping a day.
 *
 * English puts the person a thing is done TO last, so the last name in the
 * sentence is the respondent. It is a heuristic and it is written down as one:
 * a two-clause line that names the same person twice ("Chet gave Beardo one
 * name ... when Beardo asked again") can still put the wrong one last. It is
 * right far more often than convening order is, and the alternative — a
 * reaction that names nobody — would cost the voice contract entirely.
 */
function _order(s, roll) {
  if (roll.length < 2) return roll;
  if (typeof s.speaker === 'string' && typeof s.respondent === 'string'
    && s.speaker !== s.respondent
    && roll.includes(s.speaker) && roll.includes(s.respondent)) {
    return [...new Set([s.speaker, s.respondent, ...roll])];
  }
  const named = roll
    .map(n => ({ n, at: String(s.line || '').lastIndexOf(n) }))
    .filter(x => x.at >= 0);
  if (named.length >= 2) {
    named.sort((x, y) => x.at - y.at);
    return [...new Set([...named.map(x => x.n), ...roll])];
  }
  const lead = (s.actors || []).filter(n => roll.includes(n));
  return [...new Set([...lead, ...roll])];
}

/**
 * PICK, AND DO NOT PICK THE SAME SENTENCE TWICE IN ONE DAY.
 *
 * A pool of three read four times in one evening prints one of them twice, and
 * a reader notices that immediately — the same finding the engine-side variety
 * floor was written for, arriving on the screen. `used` is a per-day set, so
 * the walk steps to the next unused element and only falls back to repeating
 * when the day has genuinely exhausted the pool.
 *
 * DETERMINISTIC IN BOTH CALLERS. The set is built fresh per day and filled in
 * scene order, and `castleDayScenes` and `_buildBeats` walk the same scenes in
 * the same order — so the records and the page cannot disagree.
 */
function _pickUnique(pool, key, used, bucket) {
  if (!pool || !pool.length) return '';
  const n = pool.length;
  const start = _hash(key) % n;
  if (used) {
    for (let i = 0; i < n; i++) {
      const v = pool[(start + i) % n];
      const tag = (bucket || '') + ' | ' + v;
      if (!used.has(tag)) { used.add(tag); return v; }
    }
    // EXHAUSTED, SO START THE POOL AGAIN rather than fall back on the hash.
    // The hash fallback let a busy day draw the same line a third time while
    // three others sat unused — a three-peat the review reproduced on seed 99.
    // Clearing this pool's own tags makes an exhausted pool round-robin, which
    // caps repeats at ceil(draws / pool size) instead of leaving it to chance.
    for (const v of pool) used.delete((bucket || '') + ' | ' + v);
    const v = pool[start];
    used.add((bucket || '') + ' | ' + v);
    return v;
  }
  return pool[start];
}

/** The half of the recall card that says what it goes back to. */
function _recallTail(s, key, used) {
  // The current action carries the scene. Quoting an older event's entire
  // sentence here can reintroduce vague prose and makes this scene depend on
  // wording from another card. Preserve the real day link without replaying
  // the old sentence, for grounded and legacy events alike.
  if (s.citation || (s.priorDays || []).length) {
    const days = [...new Set([...(s.priorDays || []), ...(s.citedDays || [])])]
      .sort((a, b) => a - b);
    // SAID THE WAY A PERSON SAYS IT. "The earlier discussion happened on day
    // 1." read as a database row printed under a scene.
    const today = Number(s.epNum) || 0;
    const when = d => (d === today - 1 ? 'yesterday' : 'on day ' + d);
    const list = days.map(when);
    return { days: true, text: days.length === 1
      ? `It first came up ${list[0]}.`
      : `It has come up ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}.` };
  }
  return { days: false, text: _pickUnique(SAME_DAY, key + '|sameday', used) };
}


/**
 * The knot — a story ending, drawn once, on the card that says it ended.
 *
 * IT NO LONGER PRINTS A CATEGORY AND A GLOSS. The old band said
 * "Walked away from it — the scrutiny arrived and they came out the other side
 * of it", which is a label and its own footnote. What is drawn now is the
 * sentence the consequence card is already making, marked as the end of it.
 */
function _knotMark(s, mark) {
  return '<div class="dy-knot" data-sense="' + _esc(s.sense || 'walked') + '">'
    + _ic('shears', 22, '#f6eeda')
    + '<div class="dy-knot-w">' + _esc(mark || 'And that is where it finishes.')
    + '</div></div>';
}

/**
 * ONE CARD. The unit the reveal steps through, and the unit the transcript
 * retranscribes.
 *
 * The heading, the faces and the room ride on the ESTABLISH card, because that
 * is the card whose job is to put the reader in the room. The recall card
 * carries the day tabs. The consequence card carries the ending mark. Nothing
 * carries a category name.
 */
function _beatCard(s, beat, key) {
  const fam = _fam(s);
  const heard = s.layer === 'heard';
  const carried = !s.opened;
  let body = '';
  if (beat.kind === 'establish') {
    body += '<div class="dy-place">' + _esc(s.heading) + '</div>';
  }
  body += '<p class="dy-say">'
    + _esc(beat.say || beat.text) + '</p>';
  if (beat.kind === 'establish') {
    body += _faces(s.participants);
  }
  if (!heard && beat.role === 'recall') body += _stitch(s, beat.tail);
  if (!heard && beat.kind === 'consequence' && s.closedNow && !(s.topic && TOPIC_CONFIG[s.topicKind])) {
    body += _knotMark(s, beat.mark);
  }

  return '<div class="dy-scene" data-carried="' + (carried && !heard ? '1' : '0') + '"'
    + ' data-beat="' + _esc(beat.kind) + '"'
    + (heard ? ' data-heard="1"' : '')
    + ' style="--dy-thread:' + fam.colour + '">'
    + body + '</div>';
}

// ONE CARD PER SCENE (user-directed): the establish/action/reaction/consequence
// beats that used to be four separate reveal-cards now flow inside a single
// card, so a scene reads as one moment instead of four fragments and there is
// ══════════════════════════════════════════════════════════════════════
// IMPACT CHIPS — the suspicion / bond / popularity a scene actually moved
// ══════════════════════════════════════════════════════════════════════
//
// The reviewer could read what a scene SAID but not SEE what it did. Every
// castle write leaves a receipt on the scene API (js/tr/scene-api.js), keyed
// by `sceneId = ${ep}:${window}:${eventId}` — the same coordinates the composed
// scene carries — so the movements are recoverable without re-deriving them.
// A compact chip row under the prose shows them, each with the avatar(s) of the
// people concerned, visually distinct from the sentences.
//
// OBSERVER-GATED IN THE DATA. The audience sees every applied movement. A
// Faithful `player:<name>` layer sees only what that watcher could know: a bond
// they are half of, a read they themselves formed. Never another player's
// private suspicion, never the audience-only popularity meta, and nothing at
// all on a scene they merely overheard. This is the same contract the prose
// layer already keeps, applied to the receipts.
function _chipsFor(impacts, sceneId, layer, isAudience, watcher) {
  if (layer === 'heard') return [];               // overheard: no private impact
  const mine = impacts.filter(r => r && r.sceneId === sceneId);
  const out = [];
  const seen = new Map();                          // dedup by type|a|b, summing dir
  const add = (type, a, b, dir) => {
    if (!a) return;
    const key = type + '|' + a + '|' + (b || '');
    if (seen.has(key)) { seen.get(key).dir += dir; return; }
    const chip = { type, a, b: b || null, dir };
    seen.set(key, chip); out.push(chip);
  };
  for (const r of mine) {
    if (r.kind === 'bond' && r.delta) {
      const [a, b] = r.players || [];
      if (!isAudience && watcher && watcher !== a && watcher !== b) continue;
      add('bond', a, b, r.delta > 0 ? 1 : -1);
    } else if (r.kind === 'belief') {
      if (!isAudience && watcher !== r.observer) continue;
      add('suspicion', r.observer, r.subject, 1);
    } else if (r.kind === 'doubt' && r.delta) {
      if (!isAudience && watcher !== r.observer) continue;
      add('suspicion', r.observer, r.subject, -1);
    } else if (r.kind === 'crowd' && r.delta) {
      if (!isAudience) continue;                   // popularity is audience meta
      add('popularity', r.observer, null, r.delta > 0 ? 1 : -1);
    }
  }
  return out;
}

// SUSPICION MOVEMENT, from the scene's OWN RECORD. Castle events write no
// beliefs (by design — see the family headers and tr-castle-write-path), so a
// suspicion delta is not a receipt. It IS recorded, though: a reworked
// suspicion scene carries the subject it is about (`topic`) and the branch that
// says which way the doubt went. This maps the branch to a direction, so the
// chip shows a real recorded movement rather than a fabricated number.
// Observer-gated: only the doubter's own layer (or the audience) sees it.
const _SUSP_DIR = {
  'road-third-name': { agreed: 1, 'named-somebody-else': 1 },
  'road-suspect-walk': { slipped: 1, hardened: 1, cleared: -1 },
  // A doubt inside a showmance: buried EASES it (the doubter looks away),
  // everything else HARDENS it (a read taking root, said, or made public).
  'romance-suspicion': { oblivious: -1, suspicious: 1, confronts: 1, exposes: 1 },
};
function _suspicionChipFromRecord(s, isAudience, watcher) {
  // A HUNCH, NOT A BELIEF-BOARD MOVE. Castle scenes never write the deduction
  // board — only the priced channels (missions, ballots, murders, the Seer) do.
  // This chip shows what a scene made somebody FEEL about somebody, LABELLED as
  // a read, so the viewer sees the daily suspicion without mistaking it for the
  // hard evidence that decides the vote. Shown on every suspicion scene.
  const fam = s.family || s.kind;
  // A suspicion read shows a hunch chip. Family 'suspicion' always; plus the one
  // romance event (romance-liability-exposed) that is a read of one partner by
  // the other, tagged 'romance-suspicion' so the chip fires though its family
  // is 'romance'.
  if (fam !== 'suspicion' && s.topicKind !== 'romance-suspicion') return null;
  const doubter = s.speaker || (s.actors && s.actors[0])
    || (s.participants && s.participants[0]) || (s.parties && s.parties[0]);
  if (!doubter) return null;
  // Observer safety: only the doubter's own layer (or the audience) sees the
  // hunch. A player never sees another player's read.
  if (!isAudience && watcher !== doubter) return null;
  // The person read: a named topic/third party the scene is about, else the
  // person questioned to their face, else the other participant.
  let subject = s.topic || s.about
    || (s.respondent && s.respondent !== doubter ? s.respondent : null)
    || (s.participants || s.parties || s.actors || []).find(n => n && n !== doubter)
    || null;
  if (!subject || subject === doubter) return null;
  // Direction: the road topicKinds carry a per-branch table (some ease a read);
  // otherwise a read HARDENS, unless the scene closed with the suspect walking
  // away clean or a convincing denial, which EASES it.
  let dir = 1;
  const map = _SUSP_DIR[s.topicKind];
  if (map && s.topic) {
    dir = map[String(s.branch || '')];
    if (!dir) return null;
  } else {
    const d = _suspDir(s);
    if (d === 'flat') return null;                 // nothing moved — no hunch chip
    dir = d === 'down' ? -1 : 1;
  }
  return { type: 'suspicion', a: doubter, b: subject, dir };
}

/** One impact chip: the people (avatars) and which way the thing moved. */
function _chip(c) {
  const dirCls = c.dir > 0 ? 'up' : c.dir < 0 ? 'dn' : 'flat';
  const arrow = c.dir > 0 ? '▲' : c.dir < 0 ? '▼' : '■';
  if (c.type === 'bond') {
    return '<span class="dy-chip dy-chip-' + dirCls + '" data-k="bond">'
      + '<span class="dy-chip-av">' + _av(c.a, 20) + '</span>'
      + '<span class="dy-chip-link">–</span>'
      + '<span class="dy-chip-av">' + _av(c.b, 20) + '</span>'
      + '<span class="dy-chip-t">trust <span class="dy-chip-ar">' + arrow + '</span></span>'
      + '</span>';
  }
  if (c.type === 'suspicion') {
    // Labelled a HUNCH, not a mechanical deduction delta — the read moved, the
    // board did not. "reads harder" (a read forming) / "easing" (a doubt fading).
    const word = c.dir < 0 ? 'easing' : 'reads harder';
    return '<span class="dy-chip dy-chip-' + dirCls + '" data-k="susp" title="a read, not proof — the vote is decided by hard evidence">'
      + '<span class="dy-chip-av">' + _av(c.a, 20) + '</span>'
      + '<span class="dy-chip-to">→</span>'
      + '<span class="dy-chip-av">' + _av(c.b, 20) + '</span>'
      + '<span class="dy-chip-t">' + word + ' <span class="dy-chip-ar">' + arrow + '</span></span>'
      + '<span class="dy-chip-note">a hunch</span>'
      + '</span>';
  }
  return '<span class="dy-chip dy-chip-' + dirCls + '" data-k="pop">'
    + '<span class="dy-chip-av">' + _av(c.a, 20) + '</span>'
    + '<span class="dy-chip-t">popularity <span class="dy-chip-ar">' + arrow + '</span></span>'
    + '</span>';
}

/** The impact row: what the scene moved, in chips. */
function _chipRow(chips) {
  if (!chips || !chips.length) return '';
  return '<div class="dy-impact">'
    + '<span class="dy-impact-k">What it moved</span>'
    + '<div class="dy-chips">' + chips.map(_chip).join('') + '</div></div>';
}

// nothing to click through. The 4-beat DATA is unchanged (castleDayScenes still
// returns the full stream) — only the rendering is merged.
/**
 * A SCENE'S ACTION IS A SCRIPT (js/tr/speech.js): narration lines, spoken
 * lines and confessionals. Speech is drawn in the speaker's own row with
 * their face, so a reader can follow who said what without a name in every
 * sentence; the transcript reads it back as `Name: “words”`.
 */
function _scriptHtml(text) {
  return scriptParts(text).map(p => {
    if (p.kind === 'narr') return '<p class="dy-say dy-act">' + _esc(p.text) + '</p>';
    // THE WORDS ARE THE BRIGHTEST THING IN A SCENE. A face beside every line,
    // the name over it, the words under it at the largest size on the card —
    // the reading order of a script, which is what a scene is.
    return '<p class="dy-line' + (p.kind === 'cam' ? ' dy-cam' : '') + '">'
      + '<span class="dy-line-av">' + _av(p.who, 36) + '</span>'
      + '<span class="dy-line-body">'
      // Name, "(to camera)" and the colon are ONE item: as siblings the row's
      // gap printed "Julia :" with a space before the colon.
      + '<span class="dy-line-who"><b>' + _esc(p.who) + '</b>'
      + (p.kind === 'cam' ? '<i> (to camera)</i>' : '') + ':</span> '
      + '<span class="dy-line-q">“' + _esc(p.text) + '”</span></span></p>';
  }).join('');
}

function _sceneCard(s, stream, key) {
  const fam = _fam(s);
  const heard = s.layer === 'heard';
  const carried = !s.opened;
  // THE HEADER: who, where, when — read once, then out of the way. Faces
  // stacked, the room and the hour, the names.
  const names = (s.participants || []).filter(Boolean).slice(0, 4);
  let body = '<header class="dy-sh">'
    + (names.length ? '<span class="dy-stack">' + names.map(n => _av(n, 34)).join('') + '</span>' : '')
    + '<div class="dy-sh-t"><div class="dy-place">' + _esc(s.heading) + '</div>'
    + (names.length ? '<div class="dy-sh-who">' + names.map(_esc).join(' · ') + '</div>' : '')
    + '</div></header>';
  let outcome = '';
  for (const beat of stream) {
    const txt = _esc(beat.say || beat.text);
    if (beat.kind === 'consequence') {
      // THE RESULT, in one block with what it moved: the sentence, then the
      // chips, tinted by which way it went.
      outcome += '<div class="dy-outcome" data-tone="' + _esc(beat.tone || 'neutral') + '">'
        + '<p class="dy-say dy-say-out">' + txt + '</p>';
      if (!heard && s.closedNow && !(s.topic && TOPIC_CONFIG[s.topicKind])) {
        outcome += _knotMark(s, beat.mark);
      }
      outcome += '</div>';
    } else if (beat.kind === 'reaction') {
      body += '<p class="dy-say dy-spoken">' + txt + '</p>';
    } else if (beat.kind === 'action' && beat.role !== 'recall') {
      body += _scriptHtml(beat.say || beat.text);
    } else if (beat.role === 'recall') {
      // THE HISTORY IS A FOOTNOTE, NOT A PARAGRAPH: one small line and its tabs.
      body += '<div class="dy-recall"><p class="dy-say">' + txt + '</p>'
        + (heard ? '' : _stitch(s, beat.tail)) + '</div>';
    } else {
      // The establishing line: a stage direction, set small, under the header.
      body += '<p class="dy-say dy-dir">' + txt + '</p>';
    }
  }
  if (!heard && s.chips && s.chips.length) {
    outcome = outcome ? outcome.replace(/<\/div>$/, _chipRow(s.chips) + '</div>') : _chipRow(s.chips);
  }
  body += outcome;
  return '<div class="dy-scene" data-carried="' + (carried && !heard ? '1' : '0') + '"'
    + ' data-beat="scene"'
    + (heard ? ' data-heard="1"' : '')
    + ' style="--dy-thread:' + fam.colour + '">'
    + body + '</div>';
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
 * THE PARTS OF THE DAY, in the words a viewer would use for them.
 *
 * `js/tr/castle/phases.js` names its six parts for the engine — the labels on
 * the record are working names, and a working name on a screen is the same
 * defect as a category label above a card. These are the same six parts said
 * out loud.
 */
const BAND_NAME = {
  'breakfast-fallout': 'After breakfast',
  'morning-life': 'The morning',
  'mission-fallout': 'The way back',
  'private-strategy': 'Before the Round Table',
  'roundtable-scramble': 'After the Round Table',
  'post-banishment': 'After lights out',
};
function _bandName(id, window) {
  if (BAND_NAME[id]) return BAND_NAME[id];
  if (id && String(id).indexOf('unmapped:') === 0) {
    return 'Unscheduled — ' + String(id).slice('unmapped:'.length);
  }
  return _hour(window).label;
}

/**
 * THE OVERFLOW BAND, AND IT IS DRAWN LOUDLY ON PURPOSE.
 *
 * `castlePhaseRecord` appends an `unmapped:<window>` bucket for any scene
 * whose hour the running order has never heard of, so that a scene can never
 * vanish in silence. A screen that drew it as ordinary programming would put
 * the silence back in a different place — the reader would be shown material
 * from an hour the day does not have and would have no way to know. So it is
 * banded, named, and says what it is.
 */
function _unscheduledBand(id) {
  return '<div class="dy-unsched">'
    + '<div class="dy-unsched-k">Outside the running order</div>'
    + '<p>This happened in an hour the day does not have a place for &mdash; '
    + _esc(String(id).slice('unmapped:'.length))
    + '. It is here because it happened, and not because anything scheduled it.</p>'
    + '</div>';
}

/**
 * Every card of the day, in the order Task 5's phases put them in.
 *
 * A STEP IS ONE CARD, NOT ONE SCENE. That is the whole change: a scene is four
 * or five cards and the reveal walks them, so the reader arrives in the room,
 * watches the thing happen, hears the answer and is told what it cost, one
 * click at a time — which is what watching an episode is.
 *
 * The hour plate and the part-of-the-day band ride on the FIRST CARD of their
 * run rather than taking a step of their own: a heading with nothing under it
 * yet is a promise the reveal has not kept.
 */
// ONE DAY, THREE SCREENS. Each castle screen composes only its own scenes, so
// a sentence the morning screen printed could print again in the afternoon
// ("Cameron is on his own, and has shut the door" twice in one day). The
// earlier screens' scenes are composed first, with the keys they had on their
// own screens, so the set already holds every line they printed.
function _primedUsed(ep, observer, segment) {
  const used = new Set();
  if (!segment || !SEGMENT_PHASES[segment]) return used;
  for (const sg of Object.keys(SEGMENT_PHASES)) {
    if (sg === segment) break;
    const pv = _view(ep, observer, sg);
    if (!pv) continue;
    const k = 'dy|' + pv.ep;
    pv.scenes.forEach((raw, i) =>
      _composeScene({ ...raw, epNum: pv.ep }, k + '|' + i + '|' + raw.eventId, used, pv.cast));
  }
  _view(ep, observer, segment);   // leave the module flags on this screen's episode
  return used;
}
const SEG_IX = { morning: 0, afternoon: 1, night: 2 };

function _buildBeats(v, primed = null) {
  const beats = [];
  const key = 'dy|' + v.ep;
  const used = primed || new Set();
  let hour = null;
  let band = null;
  for (let i = 0; i < v.scenes.length; i++) {
    const raw = v.scenes[i];
    const skey = key + '|' + i + '|' + raw.eventId;
    const composed = _composeScene({ ...raw, epNum: v.ep }, skey, used, v.cast);
    const s = { ...raw, heading: composed.heading, participants: composed.participants };
    // OFF THE COMPOSED RECORD, never re-derived: `_composeScene` has already
    // decided which stream this observer is entitled to, and a second copy of
    // that decision here is the drift this directory keeps one list to avoid.
    const stream = composed.observerText.audience || composed.observerText.public;

    let lead = '';
    if (raw.phaseId && raw.phaseId !== band) {
      band = raw.phaseId;
      if (raw.unscheduled) lead += _unscheduledBand(raw.phaseId);
    }
    if (raw.window !== hour) { lead += _hourPlate(raw.window, key); hour = raw.window; }

    beats.push({
      phase: _hour(raw.window).sun,
      html: lead + _sceneCard(s, stream, skey),
      meta: { kind: 'card', beat: 'scene', scene: i, window: raw.window,
        band: _bandName(raw.phaseId, raw.window), who: composed.participants },
    });
  }

  // THE LAST CARD — the day added up, and the only card that counts anything.
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
      + '<h3>The Day, Added Up</h3>'
      // three castle screens a day each close on this card: keyed by the
      // screen, or all three print the same sentence
      + '<p>' + _esc(WEAVE_LEAD[(_hash(key + '|weave') + (SEG_IX[v.segment] || 0)) % WEAVE_LEAD.length]) + '</p>'
      + '<div class="dy-sums">' + sums.map(b =>
        '<span class="dy-sum"><span class="dy-sum-k">' + _esc(b[0]) + '</span>'
        + '<span class="dy-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>'
        + _esc(b[1]) + '</span></span>').join('')
      + '</div></div>'
      // THE ONE HOST LINE, LAST. The host walked through none of this — six
      // of the seven hours happen with nobody presenting them — so the host
      // arrives only once the day is over, exactly as in the corridor.
      + _hostBand(HOST_CLOSE[mood][(_hash(key + '|host') + (SEG_IX[v.segment] || 0)) % HOST_CLOSE[mood].length]),
    meta: { kind: 'sum' },
  });
  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// THE DAY SO FAR — the sticky stage, replaced by innerHTML on every reveal
// ══════════════════════════════════════════════════════════════════════
//
// WHAT WAS HERE BEFORE was a panel called The Loom whose rows read
// "Cover · Brody · opened today" — a category, a machine word and a debug
// phrase, in a box, on a television screen. It also spoiled its own page: a
// row named the family of a story before the card that told the story.
//
// WHAT IT DOES NOW is the one thing a viewer actually loses track of on a long
// day, which is WHERE IN THE DAY THEY ARE and WHO IT HAS BEEN ABOUT. Both are
// read off the cards already revealed and nothing else, so it can never run
// ahead of the page.
//
// Data on `window.__trCastleDay`, because a <script> tag inside innerHTML does
// not execute.

function _dayPanel(state, idx) {
  const meta = (state.stepMeta || []).slice(0, Math.max(0, idx + 1))
    .filter(m => m && m.kind === 'card');
  if (!meta.length) {
    return '<div class="dy-panel-h">' + _ic('sun', 13) + 'The day so far</div>'
      + '<div class="dy-panel-empty">Nothing yet. The castle has been awake for '
      + 'about ten minutes.</div>';
  }
  // Where in the day the reader has got to, and how much of each part they
  // have seen. Only parts already reached — a running order printed in full
  // would tell the reader how much of the evening is still coming.
  const parts = [];
  const byPart = new Map();
  for (const m of meta) {
    if (!byPart.has(m.band)) { byPart.set(m.band, 0); parts.push(m.band); }
    // SCENES, NOT CARDS. "The morning 16" is a number about the rendering; a
    // viewer counts rooms they have been in, and there is one establishing
    // card per room.
    if (m.beat === 'scene') byPart.set(m.band, byPart.get(m.band) + 1);
  }
  const here = parts[parts.length - 1];
  const rows = parts.map(p =>
    '<div class="dy-part" data-here="' + (p === here ? '1' : '0') + '">'
    + '<span class="dy-part-nm">' + _esc(p) + '</span>'
    + '<span class="dy-part-n">' + byPart.get(p) + '</span></div>').join('');

  // And who the day has actually been about, biggest first. Names, never a
  // count of "the castle" — the evidence rule, on a sidebar.
  const seen = new Map();
  for (const m of meta) {
    if (m.beat !== 'scene') continue;
    for (const n of (m.who || [])) seen.set(n, (seen.get(n) || 0) + 1);
  }
  const who = [...seen].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  const faces = who.map(([n, c]) =>
    '<span class="dy-who"' + (c > 1 ? ' data-busy="1"' : '') + '>' + _av(n, 24)
    + _esc(n) + (c > 1 ? '<b>&times;' + c + '</b>' : '') + '</span>').join('');

  return '<div class="dy-panel-h">' + _ic('sun', 13) + 'The day so far'
    + '<b>' + _esc(here) + '</b></div>'
    + '<div class="dy-parts">' + rows + '</div>'
    + (faces ? '<div class="dy-whos">' + faces + '</div>' : '');
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════

// KEYED BY SUFFIX, NOT BY EPISODE NUMBER. Three castle segments now sit on one
// episode — morning, afternoon, night — each a separate screen with its own
// reveal progress, so the key is the suffix (`castleday`, `castleday-morning`,
// …) the reveal handler is handed, never the shared episode number.
const _tvState = {};
function _state(suffix, total) {
  const k = suffix || 'castleday';
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

function _updatePanel(suffix, idx) {
  const el = document.getElementById('dy-panel-inner-' + suffix);
  const store = (typeof window !== 'undefined' && window.__trCastleDay) || {};
  const state = store[suffix];
  if (!el || !state) return;
  el.innerHTML = _dayPanel(state, idx);
}

/** Bring the new card into view, UNDER the loom rather than behind it. */
function _scrollTo(el, suffix) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('dy-panel-inner-' + suffix);
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
  const st = _state(suffix, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  _scrollTo(document.getElementById('dy-step-' + suffix + '-' + st.idx), suffix);
  _updatePanel(suffix, st.idx);
}

export function trCastleDayRevealAll(suffix, total, epNum) {
  const st = _state(suffix, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updatePanel(suffix, st.idx);
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
/**
 * THE ALCOVE, AS BEATS IN THE NIGHT STREAM.
 *
 * `confessionalBeats` reuses confessionals.js's own `_view`/`_buildBeats`, so
 * the observer gate is theirs, unchanged. Here we only re-home the beats into
 * the castle-day reveal stream: they are forced to `data-phase="night"` so the
 * shell keeps its dark background as they reveal, and given a band header on the
 * first one so the viewer sees the chair begin. Their meta keeps its own kind
 * (`open`/`chair`/`close`), which the day panel ignores — it counts only `card`
 * beats — so the confessionals ride the same Continue button without touching
 * the sidebar's story count.
 */
function _alcoveBand() {
  return '<div style="display:flex;gap:12px;align-items:center;margin:30px 0 8px;'
    + 'padding:13px 16px;border-top:1px solid rgba(224,176,112,.30);'
    + 'border-bottom:1px solid rgba(224,176,112,.16);'
    + 'background:linear-gradient(90deg,rgba(224,176,112,.10),transparent 70%)">'
    + _ic('moon', 22, 'rgba(224,176,112,.85)')
    + '<div><div style="font-family:var(--dy-disp,\'Fraunces\',serif);font-size:15px;'
    + 'letter-spacing:.04em;color:rgba(240,214,178,.95)">The Alcove</div>'
    + '<div style="font-family:var(--dy-body,\'Cormorant Garamond\',serif);font-size:13px;'
    + 'font-style:italic;color:rgba(224,214,196,.72)">One chair, one lamp, and the last '
    + 'thing said before the day is ruled off — said to the camera, and to nobody else.'
    + '</div></div></div>';
}
function _confessionalNightBeats(ep, observer) {
  const cb = confessionalBeats(ep, observer);
  if (!cb || !cb.length) return [];
  return cb.map((b, i) => ({
    phase: 'night',
    html: (i === 0 ? _alcoveBand() : '') + b.html,
    meta: { ...(b.meta || {}), alcove: true },
  }));
}

// Per-segment title furniture. Whole-day (segment null) keeps its own text
// below, unchanged, so the transcript renderer sees the same page it always did.
const SEGMENT_META = {
  morning: { eyebrow: 'From Breakfast To The Mission', title: 'THE CASTLE &middot; MORNING',
    sub: 'The hours before the mission — the fallout from breakfast, '
      + 'and the long working morning the castle spends in twos and in doorways.' },
  afternoon: { eyebrow: 'The Road Back, Into The Evening',
    title: 'THE CASTLE &middot; AFTERNOON',
    sub: 'Between the mission and the table — what the road put on them, and the '
      + 'arithmetic of the evening, worked out before anybody sits down.' },
  night: { eyebrow: 'After The Table, Into The Dark',
    title: 'THE CASTLE &middot; NIGHT',
    sub: 'After the Round Table — the room still standing in the shape the '
      + 'banishment left it, and the one private hour the castle belongs to '
      + 'whoever is still awake in it.' },
};
// A NIGHT WITH NO TABLE BEFORE IT. The first night (and any night the format
// skips the vote) has no banishment to stand in the shape of, and the header
// above said it did — found by dumping episode one and reading it.
const NIGHT_NO_TABLE = { eyebrow: 'Into The Dark',
  title: 'THE CASTLE &middot; NIGHT',
  sub: 'Lights out, and the one private hour the castle belongs to whoever is '
    + 'still awake in it.' };
function _segMeta(segment, ep) {
  if (segment === 'night' && !(ep && ep.tr && ep.tr.table)) return NIGHT_NO_TABLE;
  return SEGMENT_META[segment];
}

export function rpBuildCastleDay(ep, observer = 'audience', segment = null) {
  const suffix = segment ? 'castleday-' + segment : 'castleday';
  const vars = '--dy-grain-src:' + _noiseTile('0.78', 4, 37, 0.34, 230) + ';';
  const css = '<style>' + DY_CSS + '</style>' + _filters();
  const v = _view(ep, observer, segment);

  const shellNone = (headline, body, icon) =>
    '<div class="dy-root" style="' + vars + '">' + css
    + '<div class="dy-shell" data-phase="morning">'
    + '<div class="dy-scenery" aria-hidden="true">'
    + '<div class="dy-stone"></div>'
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

  // THE NIGHT SEGMENT CARRIES THE CONFESSIONALS (Plan 11, alcove fold). Built
  // here from confessionals.js's own gate, appended after the night's scenes.
  // A night with a confessional but no post-table scene still renders, which is
  // why the empty-day shell now checks BOTH.
  const confBeats = segment === 'night' ? _confessionalNightBeats(ep, observer) : [];
  const extraCss = confBeats.length ? confessionalStyle() : '';

  if (!v.scenes.length && !confBeats.length) {
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

  const castleBeats = v.scenes.length ? _buildBeats(v, _primedUsed(ep, observer, segment)) : [];
  const beats = [...castleBeats, ...confBeats];
  const total = beats.length;
  const epNum = ep.num || v.ep || 0;
  const st = _state(suffix, total);
  if (st.idx > total - 1) st.idx = total - 1;

  const state = { v, stepMeta: beats.map(b => b.meta) };
  if (typeof window !== 'undefined') {
    window.__trCastleDay = window.__trCastleDay || {};
    window.__trCastleDay[suffix] = state;
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
    '<div class="dy-beat dy-vis'
    + '" id="dy-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + b.html + '</div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state
  // on every paint and there is no closure left to hold them.
  const stories = v.rows.length;

  return '<div class="dy-root" style="' + vars + '">' + css + extraCss
    + '<div class="dy-shell" id="dy-shell-' + suffix + '"'
    + ' data-phase="' + beats[Math.max(0, Math.min(st.idx, total - 1))].phase + '">'
    + '<div class="dy-scenery" aria-hidden="true">'
    + '<div class="dy-stone"></div>'
    + '<div class="dy-far">' + _hallFar() + '</div>'
    + '<div class="dy-mid">' + _hallMid(v.ep + '|' + v.scenes.length) + '</div>'
    + '<div class="dy-fore">' + _hallFore() + '</div>'
    + '<div class="dy-wash"></div>'
    + '<div class="dy-vig"></div>'
    + '<div class="dy-grain"></div>'
    + '</div>'
    + '<div class="dy-body">'
    + '<div class="dy-hero">' + '' /* loom hero removed — user found it out of place */
    + '<div class="dy-hero-lock">'
    + '<div class="dy-eyebrow">The Traitors &middot; Day ' + (v.ep || epNum)
    + ' &middot; ' + (segment ? _segMeta(segment, ep).eyebrow : 'Dawn To Dark') + '</div>'
    + '<h1 class="dy-title">' + (segment ? _segMeta(segment, ep).title : 'THE CASTLE DAY')
    + '</h1>'
    + '<div class="dy-title-rule"><i></i>' + _ic('knot', 36, '#d2a44e') + '<i></i></div>'
    + '<p class="dy-sub">' + (segment ? _segMeta(segment, ep).sub
      : (v.rows.some(r => r.priorDays.length)
        ? 'Seven hours, and everything that happened in them that was not a vote. Some of '
          + 'it started today. Some of it has been running for days and only the people in '
          + 'it know.'
        : 'Seven hours, and everything that happened in them that was not a vote. All of it '
          + 'starts here. Not one of these stories has a yesterday yet.')) + '</p>'
    + '</div></div>'
    + '<header class="dy-head">' + observerBadge + '</header>'
    + '<div class="dy-stage" id="dy-panel-inner-' + suffix + '">'
    + _dayPanel(state, total - 1) + '</div>'
    + '<main class="dy-main">' + stream + '</main>'
    + '</div></div></div>';
}

/**
 * `castleDayScenes(ep, observer)` — the day as SCENES rather than as markup.
 *
 * The same composition the screen draws, handed back as records: every scene
 * with its heading, its room, who was in it, and its per-observer streams. It
 * exists because the composition is the thing worth checking — a guard that
 * reads the HTML is reading a rendering of the answer, and this plan's whole
 * argument is that the ANSWER is the deliverable.
 *
 * Keyed identically to `_buildBeats`, so a scene's cards here are the exact
 * cards on the page and in the transcript. Three copies of a day that can
 * drift apart is the shape js/vp-tr/screens.js exists to prevent, one level up.
 */
export function castleDayScenes(ep, observer = 'audience', segment = null) {
  // `segment` narrows to one castle screen's phases — the stage (castle-stage.js)
  // plays the same scenes that screen's page draws, composed with the same keys.
  const used = _primedUsed(ep, observer, segment);
  const v = _view(ep, observer, segment);
  if (!v) return [];
  const key = 'dy|' + v.ep;
  return v.scenes.map((raw, i) =>
    _composeScene({ ...raw, epNum: v.ep }, key + '|' + i + '|' + raw.eventId, used, v.cast));
}

/**
 * THE IMPACT CHIPS PER SCENE, for the observer given — the machine-readable
 * form of the "What it moved" row. Exposed so a guard can assert the
 * observer-gating (a player never sees another player's private read) at the
 * data level rather than by scraping markup.
 */
export function castleDayChips(ep, observer = 'audience', segment = null) {
  const v = _view(ep, observer, segment);
  if (!v) return [];
  return v.scenes.map(s => ({ eventId: s.eventId, window: s.window,
    layer: s.layer, chips: (s.chips || []).map(c => ({ ...c })) }));
}

