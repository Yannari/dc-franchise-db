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
  dawn: { label: 'Dawn', sun: 'dawn', lines: [
    'The light comes up on whoever did not sleep, and it is never the people who say they did.',
    'First light through the east windows, and a room that has to find out what the night cost.',
    'Cold light, cold flags, and the first thing anybody says today.',
    'The hour the castle finds out how many of it there are.',
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
const PLACES = {
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
  dawn: 'BEFORE ANYONE IS UP', morning: 'MID-MORNING',
  'journey-out': 'ON THE WAY OUT', 'journey-back': 'ON THE WAY BACK',
  evening: 'BEFORE THE ROUND TABLE', 'after-table': 'AFTER THE ROUND TABLE',
  night: 'AFTER LIGHTS OUT',
};
/** The same clock, in a clause a sentence can end on. */
const WHEN_SAID = {
  dawn: 'before the castle is properly awake', morning: 'in the middle of the morning',
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
  dawn: [
    'It is barely light yet, and {a} and {b} have {loc} to themselves.',
    'First light. {a} comes down to {loc} and finds {b} already standing there.',
    'Nobody else is down yet. {a} and {b} are at {loc} with the whole building quiet behind them.',
    'The morning is about ten minutes old. {a} catches {b} at {loc}, before anybody else comes down.',
    '{a} and {b} are the first two down, and they are at {loc}, and neither says why.',
    'The kettle has not gone on yet. {a} and {b} are at {loc} with the day still ahead of them.',
  ],
  morning: [
    'Mid-morning at {loc}, with the work half done, and {a} and {b} are the only two there.',
    'The castle is busy everywhere except {loc}, which is where {a} and {b} are.',
    'An hour after breakfast, {a} steers {b} towards {loc} and lets the door swing shut.',
    '{a} and {b} end up at {loc} together, with a job between them that neither is really doing.',
    'There is work going on everywhere this morning. At {loc} there is {a}, and {b}, and no work.',
    '{a} carries something to {loc} that did not need carrying, because {b} is at {loc}.',
  ],
  'journey-out': [
    'The walk out has strung them along the track, and {a} and {b} are at the back of it, near {loc}.',
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
    'The light is going. {a} finds {b} at {loc}, which is where {a} was hoping to find them.',
    'At {loc}, before the Round Table, {a} and {b} have a few minutes and they both know it.',
    '{a} and {b} are at {loc} with the evening in front of them and a name to settle on.',
    'There is an hour left and a decision in it. {a} and {b} spend some of the hour at {loc}.',
    '{a} has been waiting at {loc} for a while before {b} comes past, and {a} does not say so.',
    'The evening is closing in on a name. At {loc}, {a} and {b} are working out whose.',
  ],
  'after-table': [
    'The doors have just shut. {a} and {b} are at {loc}, standing the way they were standing.',
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
const ESTABLISH_SOLO = [
  'There is nobody at {loc} but {a}, {when}.',
  '{a} has {loc} to themselves, {when}, and nobody to perform for.',
  '{when}, {a} stops at {loc} on their own and stays there.',
  'Nobody else is at {loc}. {a} is there alone, {when}.',
  '{a} is at {loc} with the door shut and nobody on the other side of it, {when}.',
];
/** Three or more, which the pair templates cannot honestly describe. */
const ESTABLISH_GROUP = [
  '{names} are at {loc} together, {when}.',
  '{when}, {loc} has {names} in it and nobody else.',
  '{names} end up at {loc} at the same time, {when}, which none of them planned.',
  'At {loc}, {when}, it is {names} — and it stays {names} for as long as this takes.',
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
  if (f === 'testing') return 'tested';
  if (f === 'cover') return 'covered';
  return 'pressure';
}

/**
 * HOW THE OTHER PERSON TAKES IT, and it is the card that carries the dialogue.
 *
 * Keyed on what the scene IS and on who is answering, so the same recorded
 * fact gets a different answer out of a hothead and out of a mastermind. These
 * are not interchangeable quote pools: the blunt branch escalates, the sharp
 * branch turns the question over, the warm branch slows it down, the guarded
 * branch answers less than it was asked.
 */
const REACT = {
  pressure: {
    blunt: [
      '“Say what you actually mean,” {b} says. “You’ve been circling it since this morning.”',
      '{b} doesn’t soften it. “If you think I did something, put my name up tonight and stop asking me questions.”',
      '“Ask me properly or drop it,” {b} says, and doesn’t look away while {a} decides which.',
    ],
    sharp: [
      '{b} answers it, then asks {a} the same question back, word for word, to hear how it sounds coming the other way.',
      '“You’ve asked me that twice now,” {b} says. “The second time wasn’t for your benefit.”',
      '{b} gives {a} the answer and watches what {a} does with it, which is the part {b} actually came for.',
    ],
    warm: [
      '“Can we slow down?” {b} says. “I’d rather answer it properly than win it.”',
      '{b} takes it better than {a} expected — answers straight, and then asks whether {a} is all right.',
      '“I’m not going to be weird about this,” {b} says, and means it, and answers anyway.',
    ],
    guarded: [
      '{b} gives {a} an answer that is true and about half as long as it could have been.',
      '“Sure,” {b} says, and nothing else, and lets the silence do the rest of the work.',
      '{b} laughs it off, agrees with {a} about something next to it, and never answers the question asked.',
    ],
  },
  bond: {
    blunt: [
      '“Don’t make me regret this,” {b} says, which from {b} is as close to warm as it gets.',
      '{b} says it back plainly, no hedging. {a} is on the short list of people {b} intends to keep.',
      '“Good,” {b} says. “Then we stop wasting each other’s time and start counting the same way.”',
    ],
    sharp: [
      '{b} agrees, and privately works out exactly what {a} has handed over and what it is worth.',
      '“That helps me,” {b} says, and it is a true sentence doing two jobs at once.',
      '{b} takes the offer, keeps a little back, and lets {a} believe the whole of it changed hands.',
    ],
    warm: [
      '{b} is visibly relieved. “I’ve been carrying that on my own since we got here.”',
      '“I know,” {b} says. “I’ve known since the first night. I was waiting for you to say it.”',
      '{b} doesn’t make a speech about it. {b} moves closer and stays there, which is the answer.',
    ],
    guarded: [
      '{b} says yes, carefully, in a way that could be walked back tomorrow if it has to be.',
      '“All right,” {b} says. It isn’t much, and coming from {b} it is a great deal.',
      '{b} accepts it without promising anything back, and both of them notice the gap.',
    ],
  },
  loss: {
    blunt: [
      '“I’m not doing the sad voice,” {b} says. “I want to know who sat there and picked.”',
      '{b} is angry rather than sad, says so, and doesn’t apologise for the difference.',
      '“People are going to be very kind today,” {b} says. “One of them did it.”',
    ],
    sharp: [
      '{b} lets {a} finish, then asks who is better off for the empty chair — which is not a kind question and is the right one.',
      '“I liked them too,” {b} says. “And I’m still going to think about what it means that it was them.”',
      '{b} grieves for about a minute and then starts working, because {b} doesn’t know another way to do it.',
    ],
    warm: [
      '{b} doesn’t try to fix it. {b} sits down beside {a} and stays until {a} has stopped.',
      '“You’re allowed to be upset,” {b} says. “You don’t have to be useful this morning.”',
      '{b} cries too, which {a} was not expecting, and it helps more than anything either of them says.',
    ],
    guarded: [
      '{b} says the right things in the right order and none of it reaches {b}’s face.',
      '“Yeah,” {b} says, and looks at the floor, and that is the whole of what {b} has today.',
      '{b} holds it together in front of {a}, then goes somewhere else to not hold it together.',
    ],
  },
  past: {
    blunt: [
      '“That was a different game and you know it,” {b} says. “Bring it up again and I’ll bring up yours.”',
      '{b} denies none of it. “I did that. I’d probably do it again. Ask me something harder.”',
      '“You’ve been waiting a week to say that,” {b} says. “Feel better?”',
    ],
    sharp: [
      '{b} corrects one detail of {a}’s version, precisely, and lets the correction do the arguing.',
      '“You’re remembering the part that suits you,” {b} says. “Tell them what you did the round before.”',
      '{b} agrees with the facts and disagrees with the conclusion, out loud, so {a} has to defend the conclusion.',
    ],
    warm: [
      '“I’ve thought about that a lot since,” {b} says. “I’m not going to pretend it didn’t happen.”',
      '{b} apologises for it properly and without conditions, which is not what {a} came for and lands anyway.',
      '“We were different people then,” {b} says. “I’d quite like to find out whether that’s true.”',
    ],
    guarded: [
      '{b} laughs, changes the subject twice, and never once says the old season out loud.',
      '“Long time ago,” {b} says, in the voice people use when they would like it to stay a long time ago.',
      '{b} lets {a} tell the story and adds nothing at all to it, which {a} notices.',
    ],
  },
  tested: {
    blunt: [
      '{b} answers it the way {b} answers everything — fast, loud, and without once wondering why it was asked.',
      '“Why do you want to know that?” {b} says, and then answers it anyway, at length.',
      '{b} doesn’t think twice about it, which is either the truth or a very good habit.',
    ],
    sharp: [
      '{b} answers, and half a beat later works out that the question had a shape to it.',
      '“That’s a strange thing to want to know,” {b} says, evenly, and gives {a} rather less than {a} asked for.',
      '{b} answers, then asks {a} a question of {b}’s own, which was not part of what {a} came here to do.',
    ],
    warm: [
      '{b} answers openly and never once considers that {b} is being measured.',
      '“Course,” {b} says, and helps, and it does not occur to {b} to wonder why.',
      '{b} takes it entirely at face value, which tells {a} something {b} did not mean to say.',
    ],
    guarded: [
      '{b} answers with the smallest true thing available and waits to see what happens next.',
      '{b} hesitates for exactly as long as it takes to decide how much of it to hand over.',
      '“Depends who’s asking,” {b} says, lightly, and it is not entirely a joke.',
    ],
  },
  covered: {
    blunt: [
      '{b} buys it without blinking, because {a} said it the way people say true things.',
      '“Fine,” {b} says, already talking about something else, which is the best {a} could have hoped for.',
      '{b} doesn’t push. {b} isn’t interested enough today to push.',
    ],
    sharp: [
      '{b} nods along and privately notes that the answer arrived a little too complete.',
      '“Right,” {b} says, and keeps the version {a} has just given, in case there is another one later.',
      '{b} accepts it out loud and does not accept it, and {a} cannot tell which.',
    ],
    warm: [
      '{b} believes {a} completely and says so, which is the part {a} will think about tonight.',
      '“I never thought otherwise,” {b} says, and means it, and {a} has to hold {b}’s eye for it.',
      '{b} is kind about it, which somehow costs {a} more than being doubted would have.',
    ],
    guarded: [
      '{b} says very little and lets it go, and neither of them mentions it again.',
      '{b} takes it, keeps it, and gives no sign at all of what {b} means to do with it.',
      '“Mm,” {b} says, and the subject changes, and {a} lets it change.',
    ],
  },
  road: {
    blunt: [
      '“You’re not walking with me for the view,” {b} says. “Go on, then.”',
      '{b} goes straight past the small talk and asks {a} what {a} actually wants out here.',
      '“We’ve got twenty minutes and nobody can hear us,” {b} says. “Use them.”',
    ],
    sharp: [
      '{b} keeps it light for the first hundred yards and asks the real question when the road bends.',
      '“Interesting time to fall into step with me,” {b} says, pleasantly, and keeps walking.',
      '{b} answers everything {a} asks and gives away nothing {a} did not already have.',
    ],
    warm: [
      '{b} is glad of the company and says so, and for a while it is just two people walking.',
      '“This is the only hour of the day I like,” {b} says, and the talking gets easier after that.',
      '{b} makes {a} laugh about something with nothing to do with any of it, and both of them needed it.',
    ],
    guarded: [
      '{b} matches {a}’s pace and says about a third of what {b} is actually thinking.',
      '“Mm,” {b} says, at the parts that matter, and something longer at the parts that don’t.',
      '{b} lets the conversation happen and steers it, gently, away from anything expensive.',
    ],
  },
};
/** Nobody there to react, so the reaction is the one they do not have to hide. */
const REACT_SOLO = {
  blunt: [
    'There is nobody to perform for, so {a} doesn’t, and what is on {a}’s face now was not on it at breakfast.',
    '{a} swears once, quietly, at nobody in particular, and that is the whole of it.',
    '{a} stands there long enough that it stops being a pause and turns into a decision.',
  ],
  sharp: [
    '{a} runs it through again from the start, looking for the place it comes apart, and finds one.',
    'Nobody sees it. {a} spends the next minute working out who would have, if anyone had been standing there.',
    '{a} files it away the way {a} files everything, and rearranges tomorrow around it.',
  ],
  warm: [
    '{a} lets it show, for as long as it takes, because there is finally nobody in the room to manage.',
    'There is no audience for it, so {a} stops being fine for a minute and then starts again.',
    '{a} says something out loud to an empty room, which is the nearest {a} has come to saying it at all.',
  ],
  guarded: [
    '{a} takes the moment, puts it back where it was, and goes to find somebody to be normal in front of.',
    'Nothing shows. {a} has had a great deal of practice at nothing showing.',
    '{a} waits until the corridor is quiet again and leaves it exactly where it fell.',
  ],
};

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
const ADVERSE_OUTCOMES = new Set(['test-exposed', 'failed-maliciously', 'exposed',
  'broken-up', 'confessed-unrelated']);
const SMOOTH_OUTCOMES = new Set(['denied-convincingly', 'passed-clean',
  'defended-by-history', 'turned-back', 'buried', 'became-showmance']);
const ADVERSE_BRANCHES = new Set([
  // the story did not survive contact
  'awkward', 'broke', 'collapses', 'frayed', 'overcooked', 'slip', 'suspicious',
  'tell', 'wobbles', 'nearly', 'sleepless', 'sacrificed-ally',
  // the mourning turned into an accusation, or into paranoia
  'blamed-room', 'wrongly-suspected-irony', 'awake-paranoid', 'opportunistic',
  // it went wrong, and in public
  'broke-up', 'confronts', 'exposes', 'jealousy', 'showmance-fight', 'called-strategic',
  // the doubt got sharper rather than softer
  'caught', 'cracks', 'confess', 'crosschecked', 'hardened', 'denyWeak',
  'misread-nervy', 'revived', 'tracked', 'turned', 'redirects', 'overheard',
  // they failed it, or worked out that it was one
  'caughtTest', 'failed', 'malicious', 'got-rattled', 'inconsistent', 'refused',
  'refuses', 'reluctant', 'chased',
  // it did not hold
  'broken', 'deflected', 'dropped', 'leakedAccident', 'leakedDeliberate', 'soured',
]);
function _tone(s) {
  if (s.closedNow && ADVERSE_OUTCOMES.has(s.outcome)) return 'adverse';
  if (s.closedNow && SMOOTH_OUTCOMES.has(s.outcome)) return 'smooth';
  return ADVERSE_BRANCHES.has(String(s.branch || '')) ? 'adverse' : 'smooth';
}

/**
 * The same seven scene classes, for a branch the record says went badly.
 *
 * TWO PER SLOT rather than four: a specific (class, voice, adverse) triple is
 * drawn far less often in one day than a consequence pool is, and the verbatim
 * repeats the review measured were all in the consequence pools, which are
 * four-wide below.
 */
const REACT_ADVERSE = {
  pressure: {
    blunt: [
      '{b} stops pretending to be reasonable about it. “Fine. Say it at the table and see who backs you.”',
      '“You have been building up to this all day,” {b} says, and it comes out louder than {b} meant it to.',
    ],
    sharp: [
      '{b} hears the trap half a second late and spends the rest of it sounding like somebody who had not.',
      '“That is not what I said,” {b} says. It is very close to what {b} said, and both of them know it.',
    ],
    warm: [
      '{b} goes quiet, which from {b} is worse than shouting, and does not finish the sentence {b} started.',
      '“I do not know how to answer that in a way you would believe,” {b} says, and stops trying to.',
    ],
    guarded: [
      '{b} gives an answer that does not fit the one {b} gave this morning, and hears it not fit.',
      '{b} looks for a way out of the conversation, finds none, and says nothing at all instead.',
    ],
  },
  tested: {
    blunt: [
      '“Is this a test?” {b} says, far too late, and the way {b} says it answers {a} on its own.',
      '{b} fails it loudly, argues about having failed it, and makes a worse job of the arguing.',
    ],
    sharp: [
      '{b} works out mid-sentence that {b} is being measured, and the correction gives away more than the slip.',
      '{b} gives two versions inside a minute and cannot make the second one square with the first.',
    ],
    warm: [
      '{b} gets it wrong and knows it instantly, and the apology arrives before {a} has said anything.',
      '{b} stumbles, laughs at having stumbled, and the laugh does not land the way {b} wanted.',
    ],
    guarded: [
      '{b} hesitates in the wrong place, and the hesitation is the only answer {a} needed.',
      '{b} shuts down completely, which tells {a} a good deal more than an answer would have.',
    ],
  },
  covered: {
    blunt: [
      '{b} does not buy it, says so flatly, and does not soften it afterwards.',
      '“That is not what you told me last night,” {b} says, and will not let {a} move past it.',
    ],
    sharp: [
      '{b} takes the version apart out loud, a piece at a time, without ever raising {b}’s voice.',
      '“Say it again,” {b} says. {a} says it again. It is not quite the same, and {b} lets that sit.',
    ],
    warm: [
      '{b} wants to believe it and cannot make it fit, and the disappointment is the part that lands.',
      '“I am not calling you a liar,” {b} says, in a way that leaves the word in the room regardless.',
    ],
    guarded: [
      '{b} accepts it out loud and does not sit near {a} again for the rest of the day.',
      '{b} says nothing, and starts checking the story against somebody else inside the hour.',
    ],
  },
  bond: {
    blunt: [
      '“Do not do that again,” {b} says. It is not quite a threat and it is not far off one.',
      '{b} is not interested in the explanation and says so before {a} has finished offering it.',
    ],
    sharp: [
      '{b} takes the apology, does not accept it, and remembers precisely what it was for.',
      '“We are still fine,” {b} says, and it is the first sentence today {b} has not meant.',
    ],
    warm: [
      '{b} is hurt and does not hide it, which is harder on {a} than being shouted at would be.',
      '“I would not have done that to you,” {b} says, and there is nothing {a} can say back.',
    ],
    guarded: [
      '{b} says it is fine, twice, and the second one is the one to worry about.',
      '{b} steps back from it without a word, and the distance is the whole of the answer.',
    ],
  },
  loss: {
    blunt: [
      '“Do not stand there being sad at me,” {b} says. “One of you did this.”',
      '{b} turns the grief straight into a name, and says the name out loud to {a}.',
    ],
    sharp: [
      '{b} watches who is upset and by how much, hates doing it, and does it anyway.',
      '“We can be sad about it tomorrow,” {b} says. “Tonight it is information.”',
    ],
    warm: [
      '{b} cannot make the comfort come out right, and hears it not come out right.',
      '{b} says the wrong thing, badly, and then has to sit in it with {a}.',
    ],
    guarded: [
      '{b} takes it as a warning rather than as a loss, and stops talking about it.',
      '{b} says nothing and changes seats, and that is the whole of the reaction.',
    ],
  },
  past: {
    blunt: [
      '“You brought that here,” {b} says. “That is on you. It is not on me.”',
      '{b} refuses to have the old argument again, and then has it anyway, at volume.',
    ],
    sharp: [
      '{b} corrects the record and makes it worse, because the corrected version is not better.',
      '“You are telling that story because it helps you tonight,” {b} says. “Not because it is true.”',
    ],
    warm: [
      '{b} had thought this was finished, says so, and cannot get the sentence to come out calm.',
      '{b} does not defend the old version. {b} only looks tired of being asked about it.',
    ],
    guarded: [
      '{b} lets it stand, unanswered, and it costs {b} more than answering would have.',
      '{b} leaves the conversation rather than finish it, and {a} is left holding the end of it.',
    ],
  },
  road: {
    blunt: [
      '{b} walks faster, which is the politest way {b} has of ending a conversation.',
      '“Save it for the table,” {b} says, and puts twenty yards between them.',
    ],
    sharp: [
      '{b} answers pleasantly, and rearranges who {b} intends to walk back with.',
      '“That was a great many questions for one walk,” {b} says, and smiles, and it is not a nice smile.',
    ],
    warm: [
      '{b} is quiet for the rest of it, and the quiet is not the comfortable kind it was on the way out.',
      '{b} says that it is fine and drops back to walk with somebody else.',
    ],
    guarded: [
      '{b} gives less than {b} gave yesterday, and the difference is the whole message.',
      '{b} stops offering anything and lets {a} carry the conversation on {a}’s own.',
    ],
  },
};

/**
 * WHAT IS DIFFERENT NOW — said as behaviour, never as a number.
 *
 * The consequence card is the one the old screen did not have at all, and it
 * is the reason a card can be checked against the season instead of taken on
 * trust. Keyed on the family, on whether this beat STARTED the story or
 * CONTINUED it, and — fix round 1, C2 — on whether the recorded branch says it
 * went well or badly. The ending has its own pools further down, because "it is
 * over" is a different sentence from "it goes on".
 *
 * FOUR ENTRIES PER SLOT, MINIMUM, and that is a measurement rather than a
 * preference. The review rendered 42 episodes and counted 48 verbatim repeats
 * of a composed card INSIDE a single episode; every one of them came from a
 * pool of two being drawn three or more times in one day. Four is the floor
 * this file's own comment already stated for the engine's pools, and these are
 * held to it.
 */
const CONSEQ = {
  suspicion: {
    opened: {
      smooth: [
        '{a} says nothing more about it and doesn’t stop thinking about it either. {b} has a place in {a}’s head now that {b} did not have this morning.',
        'Nothing is decided. But {a} is going to watch where {b} stands tonight, and {b} has no idea that is happening.',
        '{a} lets it go for now and does not forget it. {b} walks away thinking the conversation went fine.',
        '{a} keeps it to {a}’s self, which is the most useful thing {a} can do with it today.',
      ],
      adverse: [
        '{a} has a reason now, and it is a specific one, and {a} can say it in a sentence in front of people.',
        'That is not a feeling any more. {a} leaves with something {a} would be willing to repeat at the table.',
        '{b} did not talk {a} out of it. {b} made {a} more certain, which is the opposite of what {b} was trying to do.',
        '{a} has stopped wondering. What {a} does about it is the only question left.',
      ],
    },
    carried: {
      smooth: [
        'That is twice. {a} stops calling it a feeling and starts treating it as something to prove.',
        '{a} sets it beside what {a} already had. It is not proof yet, and it is getting harder for {b} to explain away.',
        'It stops being a thing {a} noticed and becomes a thing {a} is prepared to say out loud in front of people.',
        '{a} adds it to the pile and says nothing, and the pile is now big enough to be worth mentioning.',
      ],
      adverse: [
        'Two of these now, and the second one is worse than the first. {a} is no longer looking for reasons to be wrong.',
        '{a} has enough of it to be dangerous with, and {b} has just handed over the piece {a} was missing.',
        'The doubt does not need any more evidence. It needs an audience, and {a} knows where to find one tonight.',
        '{a} stops giving {b} the benefit of it. That is the change, and it does not go back.',
      ],
    },
  },
  testing: {
    opened: {
      smooth: [
        '{a} came away with an answer, and the answer is worth more to {a} than {b} would like it to be.',
        'It was a small thing to ask and {a} was never really asking it. {a} has what {a} came for either way.',
        '{b} passes it without ever knowing there was anything to pass. {a} knows, and that is the whole point of it.',
        '{a} puts {b} a little higher on the list of people worth keeping, and never says why.',
      ],
      adverse: [
        '{b} fails it, and {a} does not say so. {a} simply stops planning tomorrow around {b}.',
        '{a} got the answer {a} was afraid of. {b} has no idea a question was asked, let alone answered badly.',
        'That is the last favour {b} gets from {a} for a while, and {b} will not be told why.',
        '{a} was hoping to be wrong about {b} and is not. It moves {b} up a list {b} cannot see.',
      ],
    },
    carried: {
      smooth: [
        '{a} has set this up twice now, and {b} still does not know that either time was a test.',
        'Two goes, two results, and {a} is beginning to trust the pattern more than the person.',
        '{a} does it again and gets the same answer again, which is either reassuring or very well rehearsed.',
        '{a} stops testing {b}. Whatever {a} was checking for, {a} has stopped expecting to find it.',
      ],
      adverse: [
        'Twice now, and {b} has failed both. {a} stops calling it bad luck.',
        '{a} does not need a third. {b} has answered the same question two different ways and not noticed.',
        'The pattern holds and it is the wrong pattern. {a} starts working out who else has seen it.',
        '{a} was giving {b} a chance to come out of this well. {b} has now used the last of them.',
      ],
    },
  },
  cover: {
    opened: {
      smooth: [
        '{a} gets away with it. Nobody asks a second question, which is precisely what {a} needed today.',
        'It holds. {a} walks away from it looking like somebody who had nothing to walk away from.',
        'Nothing about {a} looked wrong to {b}, and {a} spends the rest of the day quietly grateful for that.',
        '{a} banks it. One more ordinary hour on the record, and ordinary is the whole strategy.',
      ],
      adverse: [
        'It does not hold. {a} leaves knowing exactly which sentence gave way, and cannot take it back.',
        '{a} has to remember the new version now as well as the old one, and there is no writing either of them down.',
        'Something in it did not sit right with {b}, and {a} watched it not sit right, and could do nothing.',
        '{a} came out of that with a hole in the story and a person who has noticed the hole.',
      ],
    },
    carried: {
      smooth: [
        '{a} tells it the same way again. Nobody has yet noticed that it is always exactly the same way.',
        'It survives another day, and every day it survives makes it harder for {a} to change any part of it.',
        '{a} gets through another one. The version {a} is telling has not moved a word since the first time.',
        'Another day of ordinary. {a} is getting very good at ordinary, and that is its own kind of risk.',
      ],
      adverse: [
        'The version is coming apart at the edges now, and {a} is patching it in front of the person who noticed.',
        '{a} has told it too many times and it has started to sound told. {b} heard that, whatever {b} said.',
        'It does not survive this one intact. What {a} has left is a story with a repair in it.',
        '{a} spends the rest of the day working out who {b} is going to repeat that to.',
      ],
    },
  },
  trust: {
    opened: {
      smooth: [
        'Something gets agreed here that neither of them writes down. {a} and {b} go into tonight on the same side.',
        'It is a small thing to have decided and it is decided. {a} would defend {b} now, out loud, in front of people.',
        'Neither of them calls it an arrangement. {a} and {b} both leave behaving as though one had been made.',
        '{a} and {b} have a name they will not write, and they have it in common, which is the whole of it.',
      ],
      adverse: [
        '{a} offered something and did not get it back. {a} will remember which way that went.',
        'Whatever {a} thought was there is not there, and {a} leaves having said more than {b} did.',
        'It does not take. {a} and {b} are politer with each other afterwards than they were before, which is worse.',
        '{a} has learned where the edge of this is, and it is closer in than {a} had assumed.',
      ],
    },
    carried: {
      smooth: [
        'It holds again. {a} and {b} have built something the rest of the castle has not been shown.',
        'Whatever this is, it survived today as well. That is starting to be worth something to both of them.',
        '{a} and {b} keep choosing each other, and it is beginning to be the thing they are known for.',
        'Neither of them tests it any more. That is either the safest thing either of them has, or the most expensive.',
      ],
      adverse: [
        'It bends, and both of them feel it bend. Neither of them says so, which is how it stays bent.',
        '{a} stops assuming {b} will be there tonight, and starts making a second plan.',
        'Something they had is smaller after this than it was before it, and neither can point at what.',
        '{a} and {b} are still allies out loud. Out loud is now the only place it is true.',
      ],
    },
  },
  romance: {
    opened: {
      smooth: [
        'Neither of them mentions it afterwards, which is its own way of mentioning it.',
        'It is not nothing. {a} and {b} both notice that it is not nothing, and both decide to leave it there.',
        '{a} and {b} spend an hour together that neither of them needed to spend, and both of them noticed the hour.',
        'Nothing is said about it out loud. Both of them go to bed having thought about it.',
      ],
      adverse: [
        'Whatever this was, it just became a thing {a} and {b} have to manage in front of people.',
        'It goes wrong in a way neither of them planned, and the room is going to have opinions by morning.',
        '{a} and {b} are further apart at the end of it than they were at the start, and both are surprised by that.',
        'It stops being sweet and starts being a liability, in the space of about a minute.',
      ],
    },
    carried: {
      smooth: [
        'It happens again, and neither of them is being especially careful about who is nearby any more.',
        '{a} and {b} spend another hour together that they did not have to spend together.',
        'It is not a secret so much as a thing nobody has said aloud yet. That will not last the week.',
        '{a} and {b} stop pretending to be surprised when they end up in the same room.',
      ],
      adverse: [
        'Twice now it has gone badly, and {a} and {b} are running out of ways to call it nothing.',
        'What was easy about it yesterday is not easy today, and both of them are working at it.',
        '{a} and {b} have an argument they have already had once, and it goes further this time.',
        'It is costing both of them something now, and neither is sure it is still worth what it costs.',
      ],
    },
  },
  grief: {
    opened: {
      smooth: [
        'Nothing is fixed by it. But {a} and {b} got through the morning next to each other instead of alone.',
        'It goes nowhere useful, and it is not supposed to. It is a bad morning being had out loud.',
        '{a} and {b} do not talk about the game once, which neither of them manages twice in a week.',
        'Nobody feels better. {a} and {b} feel slightly less alone about it, which is a different thing and it counts.',
      ],
      adverse: [
        'The grief turns into a question halfway through, and the question has a name in it.',
        '{a} came for comfort and left with a suspicion, which is not what {a} came for.',
        'It stops being about the person who is gone and starts being about who is still here.',
        '{a} and {b} both say the kind thing and both hear the other one working out the arithmetic underneath.',
      ],
    },
    carried: {
      smooth: [
        'The same weight, a day later, and it has not got any lighter for either of them.',
        '{a} and {b} keep coming back to it, because there is nowhere else for it to go.',
        'They do this most mornings now. Neither has said out loud that it has become a habit.',
        'Nothing changes. {a} and {b} sit with it again, and sitting with it is the whole of what there is.',
      ],
      adverse: [
        'It curdles this time. What was shared yesterday is being counted today.',
        '{a} says the wrong name out loud and cannot get it back, and {b} heard it.',
        'The mourning has turned into a shortlist, and both of them can feel it turn.',
        'They have done this once too often, and this is the morning it goes sour.',
      ],
    },
  },
  callback: {
    opened: {
      smooth: [
        'Something from before this place is now inside this place, and {a} and {b} are the only two who have the whole of it.',
        'The old story is out. It changes how {a} looks at {b} tonight, and it does not go back in.',
        '{a} and {b} settle something that has been sitting between them since long before the castle.',
        'They get through it, which neither of them entirely expected to. Whatever it was, it is smaller now.',
      ],
      adverse: [
        'The old argument arrives intact, and it is exactly as bad as it was the first time.',
        '{a} says a thing about the old season that {b} is not going to be able to leave alone.',
        'Whatever was buried is not buried. {a} and {b} have to be in a castle together with it out.',
        'It does not stay between them. By tonight somebody else has the shape of it.',
      ],
    },
    carried: {
      smooth: [
        'It comes up again, which means it was never really settled the first time.',
        '{a} and {b} are still arguing about something that happened long before either of them saw this castle.',
        'The old story gets another airing, and it is a little less sharp than it was yesterday.',
        'They have reached the part where it is a shared joke rather than a shared wound. Nearly.',
      ],
      adverse: [
        'It is worse this time. Whatever {a} and {b} did not say last time gets said now.',
        'The old wound is doing new damage, and both of them can see it doing the damage.',
        '{a} and {b} have now had this argument twice in a castle, and the second one was public.',
        'It stops being history and becomes a reason, which is exactly what it should never have become.',
      ],
    },
  },
  journey: {
    opened: {
      smooth: [
        'By the time the doors are in sight, {a} and {b} have an understanding they did not set out with.',
        'The road did what the road does. {a} and {b} said things out there they would not have said indoors.',
        'They come back through the gates walking together, which is not how they went out.',
        'An hour of it and no walls. {a} and {b} both got something they could not have got at the table.',
      ],
      adverse: [
        'They come back through the gates not walking together, and several people notice that.',
        'The road was the wrong place for it, and {a} and {b} both worked that out about a mile too late.',
        'Something got said out there that cannot be unsaid indoors, and now they are indoors.',
        '{a} pushed it further than the walk could carry, and {b} spent the last mile silent.',
      ],
    },
    carried: {
      smooth: [
        'Another hour of walking, another hour of talking, and it goes a little further than last time.',
        '{a} and {b} have made this walk together before. This one moves it on.',
        'The walk is becoming the place they do this, and both of them are starting to rely on it.',
        'Same road, same pair, a little more said each time. That is how these get built.',
      ],
      adverse: [
        '{a} and {b} have had this conversation on this road before, and it went better the first time.',
        'The walk is no longer the safe place it was. Neither of them will suggest it tomorrow.',
        'They run out of road before they run out of argument, which is the worst way to end one.',
        'It gets worse over the distance rather than better, which is not what walking usually does.',
      ],
    },
  },
  unspun: {
    opened: {
      smooth: [
        'It is a small thing and it is not nothing. {a} and {b} both leave with a slightly different read of the other.',
        'Nothing is settled by it. Something is nudged by it, and neither of them could say exactly what.',
        'Neither of them will remember this on Friday. Both of them are slightly changed by it tonight.',
        'It is the sort of exchange a castle is made of: no consequence anybody can name, and a consequence all the same.',
      ],
      adverse: [
        'It goes slightly wrong, in a way neither of them will mention and both of them will remember.',
        '{a} and {b} leave it a little colder than they arrived at it, and neither is sure why.',
        'Something small gets broken here, and small things are what a fortnight is made of.',
        'Nothing happens, exactly. {a} and {b} are simply worse with each other afterwards.',
      ],
    },
    carried: {
      smooth: [
        'It comes round again, the way things in a building this size come round again.',
        '{a} and {b} pick it up where they left it and put it down about where they picked it up.',
        'Twice now, and it still has not turned into anything. It may not need to.',
        'The same exchange, a day older. It is becoming the thing {a} and {b} do instead of talking.',
      ],
      adverse: [
        'It comes round again and it is thinner than it was. {a} and {b} are running out of it.',
        'The second go is worse than the first, and neither of them has the energy to fix it.',
        'Whatever this was, it is souring by repetition, and both of them can hear it souring.',
        'They do it again and it does not work again, and that is now the pattern.',
      ],
    },
  },
};

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
const COMPANY_WORDS = /\b(ask\w*|answer\w*|told|replied|tells|in front of|everyone|everybody|anyone else|anybody|somebody|someone|the room|the table|unprompted|a second time|the first person)\b/i;

function _mode(s, cast) {
  const present = [...new Set([...(s.actors || []), ...(s.people || [])].filter(Boolean))];
  const roll = present.length ? present
    : [...new Set((s.parties || []).filter(Boolean))];
  if (roll.length >= 3) return { mode: 'group', roll };
  if (roll.length === 2) return { mode: 'pair', roll };
  const line = String(s.line || '');
  const named = (cast || []).some(n => n && !roll.includes(n) && line.includes(n));
  if (named || COMPANY_WORDS.test(line)) return { mode: 'single', roll };
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
const ESTABLISH_SINGLE = [
  '{loc}, {when}, and the person worth watching in it is {a}.',
  '{when}, at {loc}, and whatever is going on with {a} is going on quietly.',
  '{a} is at {loc}, {when}, and not making much of being there.',
  'At {loc}, {when}. {a} is in the middle of something and not advertising it.',
  '{when}. {a} is at {loc}, doing the thing people here do with their hands while they think.',
];
const REACT_SINGLE = {
  blunt: [
    '{a} does not soften it for whoever is within earshot, and does not check who is.',
    '{a} lets it show for exactly as long as it takes and then puts it away again.',
    'Whatever {a} feels about it, {a} feels it at full volume for about a second.',
    '{a} makes no attempt to be gracious about it, and is not sorry afterwards either.',
  ],
  sharp: [
    '{a} runs it through again, looking for the place it comes apart, and finds one.',
    '{a} files it the way {a} files everything, and rearranges tomorrow around it.',
    '{a} does not react at all, which for {a} is a decision rather than an absence.',
    '{a} works out, standing there, exactly what that is going to be worth on Thursday.',
  ],
  warm: [
    'It gets to {a} more than {a} would like, and it takes {a} a moment to be all right again.',
    '{a} takes it hard and takes it quietly, which is not how {a} usually takes anything.',
    '{a} is fine about it, right up until the moment {a} has to say something, and then is fine again.',
    '{a} does the kind thing before {a} has finished deciding whether it was deserved.',
  ],
  guarded: [
    'Nothing shows. {a} has had a great deal of practice at nothing showing.',
    '{a} puts it back where it was and goes to find somebody to be normal in front of.',
    '{a} gives it about a second and a half and then stops giving it anything.',
    '{a} agrees with whatever was nearest and lets the moment go past unremarked.',
  ],
};
const CONSEQ_SINGLE = {
  opened: {
    smooth: [
      '{a} does nothing about it today. {a} will do something about it, and not yet.',
      'It changes nothing anybody could point at, and it changes what {a} intends to do tomorrow.',
      '{a} keeps it. Whoever was near enough to see it did not know what they were looking at.',
      'Nothing is decided by it, and {a} is carrying one more thing into tonight than {a} was this morning.',
    ],
    adverse: [
      'That is going to cost {a} something, and {a} knew it was going to as it was happening.',
      '{a} cannot take it back and spends the rest of the hour working out who saw.',
      'It gets away from {a}, briefly, and briefly is all it takes in a building this size.',
      '{a} has made tonight harder for {a}, and has nobody to blame for it.',
    ],
  },
  carried: {
    smooth: [
      'The same again, a day later, and {a} is a little better at it than yesterday.',
      '{a} does it again and it costs about what it cost last time, which is manageable.',
      'It repeats, quietly, and nothing about it has got any easier or any worse.',
      'Another day of it. {a} has stopped noticing that {a} is doing it at all.',
    ],
    adverse: [
      'It is getting heavier. {a} has nowhere to set it down and nobody safe to set it down in front of.',
      '{a} does it again, and is worse at it than the last time, and can tell.',
      'The second one is harder than the first, and {a} has no reason to think the third will not be harder still.',
      '{a} is running out of room to do this in, and there is a week of it left.',
    ],
  },
};

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
 * AND WHEN THE STORY ACTUALLY ENDS.
 *
 * Keyed on the SENSE the engine stored rather than on the family, because "it
 * finished" and "it broke" are different endings and the family is not what
 * decides which. Written with a `For {names},` opening so the same sentence is
 * true of one person or of four — the plural-verb trap this file has already
 * shipped once, in the other direction ("They denied it, and was believed").
 */
const CLOSE_BY_SENSE = {
  walked: [
    'For {names}, that is the end of it: it does not travel any further than the people standing there.',
    'For {names}, it closes here, and it closes quietly. None of it is going to the Round Table tonight.',
    'For {names}, it stops — not resolved, which would take longer, but finished, which only takes somebody deciding.',
  ],
  cracked: [
    'For {names}, it does not end quietly: something came out that was not meant to, and it is not going back in.',
    'For {names}, that is the end of it, and the end is worse than the middle was. This one gets repeated.',
    'For {names}, it breaks rather than finishes. Whatever was being held together here is not being held together now.',
  ],
  coupled: [
    'For {names}, that settles it. By tomorrow morning it will not be a private matter.',
    'For {names}, it is not an open question any more, and neither of them is going to pretend that it is.',
    'For {names}, it resolves — and the rest of the castle will work out which way on its own schedule.',
  ],
};
/**
 * THE ELEVEN STORED OUTCOMES, as a sentence a viewer has a use for.
 *
 * SUBJECT-FREE, every one of them. The previous version of this table wrote
 * them as verb phrases hung off a pronoun, which printed "They denied it, and
 * was believed" the moment the subject was one person — found by rendering a
 * day and reading it, which is how every prose defect on this project has been
 * found and none of them by an assertion. A sentence that needs no subject
 * cannot get the subject wrong.
 */
const OUTCOME_CLAUSE = {
  'denied-convincingly': 'The denial held.',
  'passed-clean': 'Nothing stuck to anybody.',
  'defended-by-history': 'Somebody who knew them before this place spoke up, and that was what settled it.',
  'turned-back': 'The question came back the other way and stayed there.',
  buried: 'It got buried, deliberately, by the people who were standing there.',
  'confessed-unrelated': 'Something got admitted to. It was not the thing being asked about.',
  'test-exposed': 'It came apart in front of the person who set it up.',
  'failed-maliciously': 'It was failed on purpose, and both of them know that as well.',
  exposed: 'It came out in front of the one person it was being kept from.',
  'became-showmance': 'Neither of them is calling it nothing any more.',
  'broken-up': 'It ended, and it ended badly.',
};

/**
 * The lead-in on the card that says how far back this goes — and there are TWO
 * pools, because there are two answers.
 *
 * The first version had one pool, and printed "the argument arrives already
 * halfway through, because it started days ago" directly above a line saying
 * the conversation had come up once this morning. A lead that contradicts its
 * own tail is worse than no lead. Found by dumping a day and reading it.
 */
const RECALL_LEAD_DAYS = [
  'This did not start this morning, and both of them know exactly when it did.',
  'This is not the first time these two have stood somewhere and had this exact conversation.',
  'It is older than today, and both of them know precisely how much older.',
  'The argument arrives already halfway through, because it started days ago.',
];
/** The same two, for a scene with nobody in it to be the other half of "both". */
const RECALL_LEAD_DAYS_SOLO = [
  'This did not start this morning, and {a} could name the day it did.',
  '{a} has done a version of this before, and not long ago.',
  'It is older than today, and {a} knows exactly how much older.',
  'Whatever this is, {a} has been carrying it since well before this morning.',
];
const RECALL_LEAD_TODAY_SOLO = [
  '{a} has already been here once today, and here {a} is again.',
  'The second time since breakfast, and nobody has seen {a} do it once.',
  'It did not keep. {a} is back at it before the day is out.',
  '{a} could not leave it alone for the length of an afternoon.',
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
];
const RECALL_LEAD_TODAY_GROUP = [
  'This has already come up once today, and it has picked up people since.',
  'The second time today, and there are more of them in it than there were this morning.',
  'It did not keep, and it did not stay between the two who started it.',
  'They are back on it before the day is out, and the room is bigger this time.',
];
const RECALL_LEAD_TODAY = [
  'Neither of them has left it alone for more than a couple of hours.',
  'It was not going to wait until tomorrow, and neither of them tried to make it.',
  'They are back at it, and the second go is shorter and a good deal sharper.',
  'Whatever was settled the first time did not stay settled for long.',
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
  'You can see that it is not small talk. That is the whole of what you can see.',
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
    bands.push(ph);
    for (const s of (ph.scenes || [])) phaseOf.set(s, ph);
  }
  const ordered = bands.length
    ? bands.flatMap(ph => (ph.scenes || []).filter(s => all.includes(s)))
    : all.slice();
  // Anything the record holds and no phase claimed still gets drawn. Same rule
  // as the overflow bucket itself, one level up.
  for (const s of all) if (!ordered.includes(s)) ordered.push(s);

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
      + '</div>'
      + '<p class="dy-stitch-t">' + _esc(s.citation) + '</p></div>';
  }
  const prior = [...new Set(s.priorDays || [])].sort((a, b) => a - b);
  if (prior.length) {
    return '<div class="dy-stitch">'
      + '<div class="dy-stitch-k">' + _ic('needle', 12) + 'The same story on' + _tabs(s)
      + '</div>'
      + '<p class="dy-stitch-t">' + _esc(tail) + '</p></div>';
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
  const loc = _pickUnique(PLACES[s.window] || PLACES.morning, key + '|loc', used,
    'loc|' + s.window);
  const subs = {
    a, b: b || a, loc,
    when: WHEN_SAID[s.window] || 'somewhere in the middle of the day',
    names: _namesPhrase(roll),
    d: String(s.openedEp), n: String([...new Set(s.priorDays || [])].length),
  };

  const estPool = mode === 'group' ? ESTABLISH_GROUP
    : mode === 'pair' ? (ESTABLISH_PAIR[s.window] || ESTABLISH_PAIR.morning)
      : mode === 'solo' ? ESTABLISH_SOLO : ESTABLISH_SINGLE;
  const establish = _cap(_fill(_pickUnique(estPool, key + '|est', used), subs));

  const audience = [
    { kind: 'establish', text: establish, tone: 'neutral' },
    { kind: 'action', text: String(s.line || '').trim(), tone: 'neutral' },
  ];
  const carried = !s.opened;
  if (carried) {
    // THE LEAD AND THE TAIL ARE SEPARATE because the card draws them in two
    // places — the lead as narration, the tail inside the element carrying
    // the day tabs — and the transcript has to read back the whole sentence.
    const tail = _recallTail(s, key, used);
    // A ONE-PERSON SCENE HAS NO "BOTH OF THEM". The pair leads printed "both of
    // them know precisely how much older" over one person in a corridor —
    // found by dumping a day and reading it, same as everything else here.
    const leads = mode === 'group'
      ? (tail.days ? RECALL_LEAD_DAYS_GROUP : RECALL_LEAD_TODAY_GROUP)
      : (b ? (tail.days ? RECALL_LEAD_DAYS : RECALL_LEAD_TODAY)
        : (tail.days ? RECALL_LEAD_DAYS_SOLO : RECALL_LEAD_TODAY_SOLO));
    const lead = _fill(_pickUnique(leads, key + '|lead', used), subs);
    // FILLED, and this line is why the placeholder guard in tests/tr-vp.test.js
    // exists: `UNSPOKEN` carries a `{d}` and an earlier draft of this function
    // dropped the `_fill` when the tail became a record instead of a string, so
    // the screen printed "it has been running since day {d}".
    const tailText = _fill(tail.text, subs);
    audience.push({ kind: 'action', role: 'recall', lead, tail: tailText,
      text: lead + ' ' + tailText, tone: 'neutral' });
  }
  const voice = _voice(b || a);
  const reactPool = b
    ? (tone === 'adverse' ? REACT_ADVERSE : REACT)[_reactClass(s)][voice]
    : (mode === 'solo' ? REACT_SOLO[voice] : REACT_SINGLE[voice]);
  audience.push({ kind: 'reaction', tone: b ? tone : 'neutral',
    text: _fill(_pickUnique(reactPool, key + '|react', used), subs) });
  audience.push({ kind: 'consequence', ..._consequenceText(s, subs, key, used, mode, tone) });

  const publicStream = [
    { kind: 'establish', tone: 'neutral',
      text: _cap(_fill(_pickUnique(
        b ? PUBLIC_ESTABLISH_PAIR : PUBLIC_ESTABLISH_SOLO, key + '|pubest', used), subs)) },
    { kind: 'action', tone: 'neutral',
      text: _fill(_pick(b ? PUBLIC_ACTION : PUBLIC_ACTION_SOLO, key + '|pub'), subs) },
    { kind: 'reaction', tone: 'neutral',
      text: _fill(_pick(b ? PUBLIC_CLOSE : PUBLIC_CLOSE_SOLO, key + '|pubclose'), subs) },
  ];

  return {
    id: 'ep' + (s.epNum || 0) + '-' + s.window + '-' + s.eventId + '-' + s.beatNo,
    eventId: s.eventId,
    phase: s.phaseId || ('window:' + s.window),
    window: s.window,
    location: loc,
    when: WHEN_HEAD[s.window] || 'DURING THE DAY',
    heading: loc.replace(/^the /, 'THE ').toUpperCase() + ' · '
      + (WHEN_HEAD[s.window] || 'DURING THE DAY'),
    participants: roll,
    // WHAT THE SCREEN DECIDED, ON THE RECORD, so a guard can check the prose
    // against the reasons for it rather than against itself. `mode` is how many
    // people this screen is willing to claim were there; `tone` is whether the
    // stored branch says it went well or badly; `layer` is which observer this
    // record was composed for.
    mode, tone,
    layer: s.layer === 'heard' ? 'heard' : 'full',
    observerText: s.layer === 'heard'
      ? { public: publicStream }
      : { audience, public: publicStream },
  };
}

/**
 * WHO ANSWERED, READ OFF THE SENTENCE ITSELF.
 *
 * The record cannot say. `actors` is the order the scheduler convened them in,
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
  }
  return pool[start];
}

/** The half of the recall card that says what it goes back to. */
function _recallTail(s, key, used) {
  if (s.citation) return { days: true, text: String(s.citation).trim() };
  const prior = [...new Set(s.priorDays || [])];
  if (prior.length) {
    return { days: true, text: _pickUnique(UNSPOKEN, key + '|unspoken', used) };
  }
  return { days: false, text: _pickUnique(SAME_DAY, key + '|sameday', used) };
}

/** What is different now — an ending if it ended, a direction if it did not. */
function _consequenceText(s, subs, key, used, mode, tone) {
  if (s.closedNow) {
    const sense = CLOSE_BY_SENSE[s.sense] ? s.sense : 'walked';
    // THE MARK CARRIES THE OUTCOME, and it used to carry a slogan. The band
    // said "And that is where it finishes." immediately under a sentence that
    // had just said the story was over — a line that repeated its neighbour
    // and added nothing. The one thing the record holds that the sentence
    // above cannot say is WHICH of the eleven endings this was, so that is
    // what goes in the mark.
    const clause = OUTCOME_CLAUSE[s.outcome] || 'And that is where it finishes.';
    const say = _fill(_pickUnique(CLOSE_BY_SENSE[sense], key + '|close', used), subs);
    return { text: say + ' ' + clause, say, mark: clause, tone };
  }
  const dir = s.opened ? 'opened' : 'carried';
  const famKey = (s.family === 'romance-spark' || s.kind === 'romance-spark') ? 'romance'
    : (CONSEQ[s.family] ? s.family : (CONSEQ[s.kind] ? s.kind : 'unspun'));
  const pool = (mode === 'pair' || mode === 'group')
    ? CONSEQ[famKey][dir][tone]
    : CONSEQ_SINGLE[dir][tone];
  const say = _fill(_pickUnique(pool, key + '|conseq', used), subs);
  return { text: say, say, mark: null, tone };
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
    + _esc(beat.role === 'recall' ? beat.lead : (beat.say || beat.text)) + '</p>';
  if (beat.kind === 'establish') {
    body += _faces(s.participants);
  }
  if (!heard && beat.role === 'recall') body += _stitch(s, beat.tail);
  if (!heard && beat.kind === 'consequence' && s.closedNow) {
    body += _knotMark(s, beat.mark);
  }

  return '<div class="dy-scene" data-carried="' + (carried && !heard ? '1' : '0') + '"'
    + ' data-beat="' + _esc(beat.kind) + '"'
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
  'breakfast-fallout': 'First light',
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
function _buildBeats(v) {
  const beats = [];
  const key = 'dy|' + v.ep;
  const used = new Set();
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

    for (let j = 0; j < stream.length; j++) {
      beats.push({
        phase: _hour(raw.window).sun,
        html: (j === 0 ? lead : '') + _beatCard(s, stream[j], skey),
        meta: { kind: 'card', beat: stream[j].kind, scene: i, window: raw.window,
          band: _bandName(raw.phaseId, raw.window), who: composed.participants },
      });
    }
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
      + '<p>' + _esc(_pick(WEAVE_LEAD, key + '|weave')) + '</p>'
      + '<div class="dy-sums">' + sums.map(b =>
        '<span class="dy-sum"><span class="dy-sum-k">' + _esc(b[0]) + '</span>'
        + '<span class="dy-sum-v"' + (b[2] ? ' data-tone="' + b[2] + '"' : '') + '>'
        + _esc(b[1]) + '</span></span>').join('')
      + '</div></div>'
      // THE ONE HOST LINE, LAST. The host walked through none of this — six
      // of the seven hours happen with nobody presenting them — so the host
      // arrives only once the day is over, exactly as in the corridor.
      + _hostBand(_pick(HOST_CLOSE[mood], key + '|host')),
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
    if (m.beat === 'establish') byPart.set(m.band, byPart.get(m.band) + 1);
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
    if (m.beat !== 'establish') continue;
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

function _updatePanel(epNum, idx) {
  const el = document.getElementById('dy-panel-inner');
  const store = (typeof window !== 'undefined' && window.__trCastleDay) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _dayPanel(state, idx);
}

/** Bring the new card into view, UNDER the loom rather than behind it. */
function _scrollTo(el) {
  if (!el) return;
  const scroller = document.querySelector('.rp-main');
  const stage = document.getElementById('dy-panel-inner');
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
  _updatePanel(epNum, st.idx);
}

export function trCastleDayRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updatePanel(epNum, st.idx);
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
    + '<div class="dy-stage" id="dy-panel-inner">' + _dayPanel(state, st.idx) + '</div>'
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
export function castleDayScenes(ep, observer = 'audience') {
  const v = _view(ep, observer);
  if (!v) return [];
  const key = 'dy|' + v.ep;
  const used = new Set();
  return v.scenes.map((raw, i) =>
    _composeScene({ ...raw, epNum: v.ep }, key + '|' + i + '|' + raw.eventId, used, v.cast));
}
