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
    'One fewer voice in the room, and nobody has worked out how to fill the gap.',
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
    '{a} and {b} reach {loc} before anyone else. Neither explains why they came down so early.',
    'The kettle has not gone on yet. {a} and {b} are at {loc} with the day still ahead of them.',
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
  '{a} is alone at {loc}, {when}, with nobody to perform for.',
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
 * HOW THE OTHER PERSON TAKES IT, and it is the card that carries the dialogue.
 *
 * Keyed on what the scene IS and on who is answering, so the same recorded
 * fact gets a different answer out of a hothead and out of a mastermind. These
 * are not interchangeable quote pools: the blunt branch escalates, the sharp
 * branch turns the question over, the warm branch slows it down, the guarded
 * branch answers less than it was asked.
 */
// ── WIDENED (fix round 1, C1b, second pass) ───────────────────────────
//
// After `REACT_SINGLE` and `CONSEQ_SINGLE` went from four lines to twelve, the
// worst composed card in a season fell from 9 to 7 and the top of the census
// moved here: `bond` and `pressure` are the two commonest reaction classes and
// each voice held THREE lines against ~4 draws a season. Both are now nine.
//
// The other six classes are left at three. That is deliberate and it is
// measured rather than assumed: they sit an order of magnitude down the census
// and widening a pool nothing is hitting is decoration — the same call
// `REACT_ADVERSE`'s docblock makes about its own two-per-slot pools. The
// remaining exposure is stated in the season-scope arm in
// tests/tr-castle-prose.test.js rather than left for somebody to find.
const REACT = {
  pressure: {
    blunt: [
      '“Say what you actually mean,” {b} says. “You’ve been circling it since this morning.”',
      '{b} doesn’t soften it. “If you think I did something, put my name up tonight and stop asking me questions.”',
      '“Ask me properly or drop it,” {b} says, and doesn’t look away while {a} decides which.',
      '“You have had all day to ask me that,” {b} says. “Ask it.”',
      '{b} answers the first question at some volume and refuses the second one entirely.',
      '“Do not do the voice,” {b} says. “Just say the thing.”',
      '{b} tells {a} exactly where {b} was and then asks why {a} needed to know.',
      '“I am not going to be careful about this,” {b} says, and is not.',
      '{b} answers, hard and fast, and leaves the room before {a} can follow it up.',
    ],
    sharp: [
      '{b} answers it, then asks {a} the same question back, word for word, to hear how it sounds coming the other way.',
      '“You’ve asked me that twice now,” {b} says. “The second time wasn’t for your benefit.”',
      '{b} gives {a} the answer and watches what {a} does with it, which is the part {b} actually came for.',
      '{b} answers in a way that is true, complete, and impossible to build anything on.',
      '{b} works out what the question is really about and answers THAT, which {a} did not expect.',
      '“You are asking the wrong thing,” {b} says, and then tells {a} the right one.',
      '{b} pauses for exactly as long as an honest person would and then answers.',
      '{b} answers and adds nothing, and the nothing is deliberate.',
      '{b} turns the whole thing over once in front of {a} and hands it back the same shape.',
    ],
    warm: [
      '“Can we slow down?” {b} says. “I’d rather answer it properly than win it.”',
      '{b} takes it better than {a} expected — answers straight, and then asks whether {a} is all right.',
      '“I’m not going to be weird about this,” {b} says, and means it, and answers anyway.',
      '{b} looks a bit hurt by the asking and answers it properly regardless.',
      '“You could have just asked me,” {b} says, and there is no edge on it at all.',
      '{b} answers, and then asks {a} whether something is wrong, and means the question.',
      '“I would rather you asked than wondered,” {b} says, and that is the end of it.',
      '{b} takes it as a fair question, which it was, and treats it like one.',
      '{b} answers and then makes {a} a cup of tea, which is not an answer and helps.',
    ],
    guarded: [
      '{b} gives {a} an answer that is true and about half as long as it could have been.',
      '“Sure,” {b} says, and nothing else, and lets the silence do the rest of the work.',
      '{b} laughs it off, agrees with {a} about something next to it, and never answers the question asked.',
      '{b} gives a date, a room and a reason, and none of it is checkable.',
      '“Ask somebody else and see if they say the same,” {b} says, which is not a yes.',
      '{b} answers a slightly different question so smoothly that {a} nearly misses it.',
      '{b} says something agreeable, at length, that contains no information whatever.',
      '“I was where I said I was,” {b} says, and does not say where that was.',
      '{b} smiles, answers halfway, and lets {a} decide whether to push.',
    ],
  },
  bond: {
    blunt: [
      '“Don’t make me regret this,” {b} says, which from {b} is as close to warm as it gets.',
      '{b} says it back plainly, no hedging. {a} is on the short list of people {b} intends to keep.',
      '“Good,” {b} says. “Then we stop wasting each other’s time and start counting the same way.”',
      '“Right,” {b} says. “Then that is settled and we do not discuss it again.”',
      '{b} shakes on it, which nobody in this castle does, and means it.',
      '“Finally,” {b} says, which is not gracious and is entirely honest.',
      '{b} says yes before {a} has finished the sentence and does not take it back.',
      '“You are the only one I would have said that to,” {b} says, flatly, as a fact.',
      '{b} agrees in four words and then talks about something else for an hour.',
    ],
    sharp: [
      '{b} agrees, and privately works out exactly what {a} has handed over and what it is worth.',
      '“That helps me,” {b} says, and it is a true sentence doing two jobs at once.',
      '{b} takes the offer, keeps a little back, and lets {a} believe the whole of it changed hands.',
      '{b} accepts, and is already working out what this is worth on Thursday.',
      '{b} says yes and means a slightly smaller yes than {a} heard.',
      '“Good,” says {b}, who has wanted exactly this since Tuesday and never once asked.',
      '{b} agrees, and files the fact that {a} asked first.',
      '{b} takes it, and takes note of how much it cost {a} to offer.',
      '{b} accepts with one small condition that sounds like nothing and is not.',
    ],
    warm: [
      '{b} is visibly relieved. “I’ve been carrying that on my own since we got here.”',
      '“I know,” {b} says. “I’ve known since the first night. I was waiting for you to say it.”',
      '{b} doesn’t make a speech about it. {b} moves closer and stays there, which is the answer.',
      '{b} says thank you, badly, twice, and gets it wrong both times and means it.',
      '”I did not think anybody had noticed,” {b} says, and means it.',
      '{b} laughs, and it is the first honest noise {b} has made in this building.',
      '“Do not be nice to me,” {b} says. “I will not cope with it.” And does not.',
      '{b} goes quiet for a second and comes back with something much warmer than expected.',
      '{b} tells {a} something true in return, immediately, without being asked.',
    ],
    guarded: [
      '{b} says yes, carefully, in a way that could be walked back tomorrow if it has to be.',
      '“All right,” {b} says. It isn’t much, and coming from {b} it is a great deal.',
      '{b} accepts it without promising anything back, and both of them notice the gap.',
      '{b} says “we will see,” which from {b} is close to a yes.',
      '{b} agrees to the part {b} can agree to and is precise about which part.',
      '“Ask me again on Thursday,” {b} says, and it is not a brush-off.',
      '{b} nods, once, and does not add a word to it.',
      '{b} takes it seriously enough not to answer straight away.',
      '“I will not say yes to something I might not do,” {b} says, which is nearly better.',
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
  // See `_reactClass`: `{a}` is the one who took the conversation over and
  // `{b}` is the one who arrived holding the questions.
  'tested-turned': {
    blunt: [
      '{b} came in with a question and is now answering one, and cannot work out when that happened.',
      '“That is not what I asked you,” {b} says, and gets no help at all with what {b} did ask.',
      '{b} keeps going for another minute out of momentum and then stops, because there is nowhere left to go.',
    ],
    sharp: [
      '{b} recognises the shape of it happening and cannot stop it happening.',
      '“All right,” {b} says. “Fair.” It costs {b} something to say and {a} watches it cost.',
      '{b} spends the rest of it answering carefully, which is not what {b} came here to do.',
    ],
    warm: [
      '{b} laughs, admits {b} had been fishing, and the admission is the most honest thing either of them says.',
      '“I have been rumbled,” {b} says, cheerfully, and does not entirely mean the cheerfulness.',
      '{b} takes it well and takes it, which are two different things and {b} does both.',
    ],
    guarded: [
      '{b} lets it go without conceding anything out loud, and neither of them says who won.',
      '{b} answers as little as possible on the way out, having arrived meaning to ask.',
      '{b} says something pleasant and leaves earlier than {b} had planned to leave.',
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
    '{a} says the short version of it out loud, to the wall, and does not soften a word.',
    'No audience, so no manners. {a} calls it what it is and goes to bed.',
    '{a} does not dress it up. There is nobody standing there to dress it up for.',
  ],
  sharp: [
    '{a} runs it through again from the start, looking for the place it comes apart, and finds one.',
    'Nobody sees it. {a} spends the next minute working out who would have, if anyone had been standing there.',
    '{a} files it away the way {a} files everything, and rearranges tomorrow around it.',
    '{a} does the arithmetic twice and gets a slightly different answer the second time.',
    'Alone, {a} takes it apart properly, which is not something {a} would do where it could be watched.',
    '{a} works out what it changes and what it does not, and the second list is shorter than {a} expected.',
  ],
  warm: [
    '{a} lets it show, for as long as it takes, because there is finally nobody in the room to manage.',
    'There is no audience for it, so {a} stops being fine for a minute and then starts again.',
    '{a} says something out loud to an empty room, which is the nearest {a} has come to saying it at all.',
    '{a} sits down on the nearest thing that will take the weight and stays there a while.',
    'It gets to {a} properly, in private, and {a} lets it, because letting it is cheaper here than anywhere else.',
    '{a} would have said all of this to somebody, if there had been a somebody in the room.',
  ],
  guarded: [
    '{a} takes the moment, puts it back where it was, and goes to find somebody to be normal in front of.',
    'Nothing shows. {a} has had a great deal of practice at nothing showing.',
    '{a} waits until the corridor is quiet again and leaves it exactly where it fell.',
    '{a} arranges a face for the next room before there is anybody in the next room.',
    'It gets about a second of {a}’s attention and then gets put where {a} puts things.',
    '{a} checks, out of habit, that the corridor is empty, and then does not use the empty corridor for anything.',
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
 * The same seven scene classes, for a branch the record says went badly.
 *
 * TWO PER SLOT rather than four WAS the calibration, on the reasoning that a
 * specific (class, voice, adverse) triple is drawn far less often in one day
 * than a consequence pool is, and that the verbatim repeats the review
 * measured were all in the consequence pools.
 *
 * TASK 7 STAGE 5 MADE THAT REASONING FALSE FOR ONE CLASS AND MEASURED IT.
 * `runWindow`'s barren-draw fix took the castle from 12.8 scenes an episode to
 * 27.0, so every slot here is drawn about 2.1x as often, and a probe listing
 * every verbatim repeat inside a rendered day named `pressure` twice -- the
 * only slot in this table to appear at all. `pressure` is now four wide, like
 * the consequence pools. The other six classes are left at two, because the
 * same probe found none of them repeating and widening a pool nothing is
 * hitting is decoration.
 */
const REACT_ADVERSE = {
  pressure: {
    blunt: [
      '{b} stops pretending to be reasonable about it. “Fine. Say it at the table and see who backs you.”',
      '“You have been building up to this all day,” {b} says, and it comes out louder than {b} meant it to.',
      '“Just ask me the actual question,” {b} says, and does not wait for it to be asked.',
      '{b} answers with a question of {b}’s own, and it is not a friendly one.',
    ],
    sharp: [
      '{b} hears the trap half a second late and spends the rest of it sounding like somebody who had not.',
      '“That is not what I said,” {b} says. It is very close to what {b} said, and both of them know it.',
      '{b} corrects one small detail very precisely and lets the large one stand, and hears how that lands.',
      '{b} works out mid-sentence where this is going and cannot make the sentence go somewhere else.',
    ],
    warm: [
      '{b} goes quiet, which from {b} is worse than shouting, and does not finish the sentence {b} started.',
      '“I do not know how to answer that in a way you would believe,” {b} says, and stops trying to.',
      '{b} looks genuinely wounded by it, and the being wounded is not doing {b} any good here.',
      '{b} apologises for something {b} has not been accused of, which makes the room worse rather than better.',
    ],
    guarded: [
      '{b} gives an answer that does not fit the one {b} gave this morning, and hears it not fit.',
      '{b} looks for a way out of the conversation, finds none, and says nothing at all instead.',
    ],
  },
  // See `_reactClass`. `{a}` took the scene over; `{b}` is the one who came in
  // holding the questions and is not enjoying the reversal.
  'tested-turned': {
    blunt: [
      '{b} does not take being turned round well, and says so at a volume the corridor can hear.',
      '“You are not answering me,” {b} says, twice, and both times it is {b} who ends up answering.',
    ],
    sharp: [
      '{b} tries once to get back to the original question and cannot find a way in that does not look like retreat.',
      '{b} concedes nothing, learns nothing, and leaves having given away rather more than {b} got.',
    ],
    warm: [
      '{b} had not expected to be on this end of it and it shows, and {b} hates that it shows.',
      '{b} says something reasonable in a voice that is not, and stops mid-sentence.',
    ],
    guarded: [
      '{b} shuts the conversation rather than lose it. That told {a} more than finishing it would have.',
      '{b} goes very quiet and stays that way, and it is not the quiet of somebody thinking.',
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
  // The same scene from the side that won it. See `TURNED_BRANCHES` and
  // `_reactClass`: `{a}` is the person who was being tested and took the
  // conversation over, `{b}` is the one who set it up.
  'testing-turned': {
    opened: {
      smooth: [
        '{b} came to find something out and went away having been found out. Neither of them says that out loud.',
        '{a} now knows {b} is checking, which is worth more than whatever {b} was checking for.',
        'The test went the wrong way for the person who set it. {b} will not be trying that one again.',
        '{a} leaves holding the thing {b} came to collect, and {b} knows it.',
      ],
      adverse: [
        '{b} has lost the one advantage {b} had, which was that {a} did not know {b} was looking.',
        '{a} was being measured and is now measuring, and {b} handed that over in a single sentence.',
        'It costs {b} more than it costs {a}, and both of them can see exactly how much.',
        '{b} came in with a question and leaves with a problem, and the problem is {a}.',
      ],
    },
    carried: {
      smooth: [
        'Twice now {b} has come at it sideways, and twice {a} has turned it round. {b} stops trying.',
        '{a} has stopped pretending not to notice, and {b} has stopped pretending not to be doing it.',
        'The two of them are past the sideways version of this conversation, which suits {a} and does not suit {b}.',
        '{a} has the measure of how {b} asks things now, which is a more useful thing to own than an answer.',
      ],
      adverse: [
        '{b} has done this twice and been caught twice, and {a} has stopped giving {b} the benefit of it.',
        'Whatever {b} was building, {a} has taken it apart in front of {b} for the second time.',
        '{a} does not need to test {b} back. {b} keeps volunteering it.',
        'Two of these now, and the only thing {b} has established is that {a} is watching {b} do it.',
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
        // WAS "{b} has no idea a question was asked, let alone answered badly." That
        // line was written for a BEHIND-THE-BACK check where {b} is absent, and it
        // sat in this SHARED pair/group pool, so it landed on to-their-face tests
        // where {b} had just answered in the reaction card one line above — saying
        // {b} did not know a question was asked, a card after {b} answered it. The
        // one event it was right for (the alibi check) now composes as a solo
        // scene and draws from CONSEQ_SINGLE, so this pool only ever answers a
        // scene {b} was in. The line now says {b} was present and oblivious to the
        // STAKES, not to the question. Found by the Defect 3 coherence sweep.
        '{a} got the answer {a} was afraid of. {b} thinks it was just a conversation, and does not know it was anything else.',
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
        'Another day of flying under the radar. {a} is getting very good at it, and that is when people stop noticing you.',
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
        'Another day and {a} and {b} are still where they were. That is starting to be worth something to both of them.',
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
        'Neither of them mentions it afterwards, and neither of them forgets it either.',
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
        'A bad morning, shared. Neither of them tries to make it useful.',
        '{a} and {b} do not talk about the game once, which neither of them manages twice in a week.',
        'Nothing is fixed. {a} and {b} are just less alone with it than they were an hour ago.',
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
        'Old history is back on the table, and {a} and {b} are the only two in the room who know the full version.',
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
        'What started as history is now a reason to act, and both of them know it.',
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
        'Same road, same pair, and each walk takes it a step further than the last.',
      ],
      adverse: [
        '{a} and {b} have had this conversation on this road before, and it went better the first time.',
        'The walk is no longer the safe place it was. Neither of them will suggest it tomorrow.',
        'They run out of road before they run out of argument, which is the worst way to end one.',
        'They get worse with each other over the distance rather than better, and the gate is still a mile off.',
      ],
    },
  },
  unspun: {
    opened: {
      smooth: [
        'It is a small thing and it is not nothing. {a} and {b} both leave with a slightly different read of the other.',
        'Nothing is settled by it. Something is nudged by it, and neither of them could say exactly what.',
        '{a} and {b} move on to other people, carrying a read neither of them asked for.',
        '{a} and {b} part ways without saying anything worth repeating, and both remember how the other said it.',
      ],
      adverse: [
        'It goes slightly wrong, in a way neither of them will mention and both of them will remember.',
        '{a} and {b} leave it a little colder than they arrived at it, and neither is sure why.',
        'Something goes wrong between {a} and {b}, too small to name and too sharp to ignore.',
        '{a} and {b} leave it sharper with each other than when they sat down, and neither can point at what changed.',
      ],
    },
    carried: {
      smooth: [
        '{a} and {b} end up in the same room again, and pick it up without deciding to.',
        '{a} and {b} pick it up where they left it and put it down about where they picked it up.',
        'Twice now, and it still has not turned into anything. It may not need to.',
        '{a} and {b} have the same exchange a second time and neither of them calls it a habit yet.',
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
const ESTABLISH_SINGLE = [
  '{a} pauses at {loc}, {when}, while the rest of the castle carries on nearby.',
  '{a} steps into {loc}, {when}, and keeps their voice low.',
  '{a} stays near {loc}, {when}, watching the others come and go.',
  'At {loc}, {when}, {a} waits until the nearby conversation has finished.',
  '{a} stops at {loc}, {when}, away from the busiest part of the castle.',
  '{a} reaches {loc}, {when}, and takes a moment before returning to the group.',
  '{a} moves to {loc}, {when}, where the others are less likely to interrupt.',
];
// ── WIDENED (fix round 1, C1b) ────────────────────────────────────────
//
// THE DEFECT, MEASURED AT THE LAYER A VIEWER READS: 100% of seasons printed
// the same composed card four or more times; median worst 9, worst 15, over
// 206,364 cards. Every one of the top eight offenders was a FOUR-element pool
// in this file — `CONSEQ_SINGLE` and `REACT_SINGLE` below — and Task 7 never
// touched either while taking the castle from 12.8 fired scenes an episode to
// ~28, which roughly doubled the draws against them.
//
// WHY `_pickUnique` DID NOT SAVE THEM. It round-robins, but its `used` set is
// PER DAY (`castleDayScenes` builds a fresh one per episode), so a four-line
// pool drawn five times a day is exhausted every day and starts again every
// day. Across ten episodes that is ten passes over four sentences.
//
// AND WHY THE FIX IS WIDTH RATHER THAN A SEASON-SCOPED SET. A season-scoped
// `used` would make the composed output depend on how many times the caller
// had already rendered the season, and this function is called repeatedly for
// the same episode by the screen, by the transcript and by the guards — the
// "records and the page cannot disagree" property in `_pickUnique`'s own
// docblock is exactly what that would break. Width is stateless and
// deterministic, and it is what the pools were short of.
//
// Four lines became twelve in all eight pools.
const REACT_SINGLE = {
  blunt: [
    '{a} does not soften it for whoever is within earshot, and does not check who is.',
    '{a} lets it show for exactly as long as it takes and then puts it away again.',
    'Whatever {a} feels about it, {a} feels it at full volume for about a second.',
    '{a} makes no attempt to be gracious about it, and is not sorry afterwards either.',
    '{a} says exactly what {a} thinks of it, to nobody in particular, and does not lower the volume.',
    '{a} is not interested in being reasonable about this one and does not pretend to be.',
    'It shows on {a} for a second and a half and {a} does not spend any of that hiding it.',
    '{a} swears once, quietly, at a wall, and feels marginally better.',
    'Whoever is in the room gets the whole of it, and {a} does not check who is in the room.',
    '{a} does not do the thing where you arrange your face. {a} has never done that thing.',
    'It comes out flat and hard and {a} would say it again.',
    '{a} does not soften it, does not qualify it, and does not stay to discuss it.',
  ],
  sharp: [
    '{a} runs it through again, looking for the place it comes apart, and finds one.',
    '{a} files it the way {a} files everything, and rearranges tomorrow around it.',
    '{a} does not react at all, which for {a} is a decision rather than an absence.',
    '{a} works out, standing there, exactly what that is going to be worth on Thursday.',
    '{a} does the arithmetic before {a} does the feeling, which is the wrong way round and is {a}.',
    '{a} stands very still for a moment, which with {a} means something is being filed.',
    'Nothing about {a} moves. A great deal behind {a} rearranges itself.',
    '{a} finds the one part of it that is useful and keeps only that part.',
    '{a} is already two conversations ahead and it shows if you know where to look.',
    '{a} makes a note of it in the place {a} keeps notes, which is not paper.',
    'It becomes a plan, for {a}, before it has finished being a surprise.',
    '{a} asks nothing and works out most of it anyway.',
  ],
  warm: [
    'It gets to {a} more than {a} would like, and it takes {a} a moment to be all right again.',
    '{a} takes it hard and takes it quietly, which is not how {a} usually takes anything.',
    '{a} is fine about it, right up until the moment {a} has to say something, and then is fine again.',
    '{a} does the kind thing before {a} has finished deciding whether it was deserved.',
    '{a} minds more than {a} lets on, and lets on more than {a} means to.',
    'It lands somewhere {a} was not braced for, and {a} needs a second with it.',
    '{a} does not say anything for a moment, and the moment is the whole of the answer.',
    '{a} is generous about it, immediately, and thinks about the cost afterwards.',
    'Something goes out of {a} and comes back slightly changed.',
    '{a} would rather have been told sooner and does not say so.',
    'It gets under {a}, and {a} carries it around all afternoon being fine.',
    '{a} feels the whole of it and gives about a third of it away.',
  ],
  guarded: [
    'Nothing shows. {a} has had a great deal of practice at nothing showing.',
    '{a} puts it back where it was and goes to find somebody to be normal in front of.',
    '{a} gives it about a second and a half and then stops giving it anything.',
    '{a} agrees with whatever was nearest and lets the moment go past unremarked.',
    '{a} produces the face that ends conversations and it ends the conversation.',
    'Whatever went through {a} went through somewhere the room cannot see.',
    '{a} says the small safe thing and lets the large one go by.',
    'It is impossible to tell from {a} whether that landed at all.',
    '{a} nods once, at nothing much, and the subject is closed.',
    '{a} takes it the way {a} takes everything, which is to say invisibly.',
    'There is a reaction. {a} has put it somewhere nobody was invited to.',
    '{a} keeps whatever it was and keeps the keeping of it quiet too.',
  ],
};
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
const FALLBACK_SOLO = {
  smooth: [
    '{a} keeps what {a} worked out to {ref} and goes down to dinner closer to identifying a traitor.',
    'Nobody watched {a} work that out, which is the whole value of it.',
    '{a} carries the information downstairs and intends to use it at the right table.',
    'None of that helps {a} tonight. {a} is playing a longer game.',
    '{a} comes away with the start of a suspicion and the sense to keep quiet about it.',
    'Whoever the traitors are, they slipped up today, and {a} is a step closer to a name because of it.',
    '{a} adds another observation to the pile, and the pile is starting to point somewhere.',
    'Nothing about the evening changes. {a} goes into the round table knowing one more thing than the room does.',
    '{a} will not act on what {a} learned this week, but {a} will not forget it either.',
    'What {a} has is not evidence yet, but {a} has been here long enough to know where it is heading.',
  ],
  adverse: [
    '{a} goes back down having got something wrong and not yet knowing which part.',
    'Somebody is going to make {a} pay for that hour, and {a} half knows it.',
    '{a} walks away because walking away is the only option left.',
    'The damage will not show tonight. That is the kind of mistake that arrives late.',
    '{a} lost ground this evening and cannot say exactly where.',
    '{a} thought {a} had a theory forming, but there is a gap in it {a} cannot close.',
    '{a} goes down to the hall hoping the mistake does not show on {pos} face.',
    'The week has got harder for {a} and nobody in the room did it to {a}.',
    '{a} would take that hour back, but there is no taking it back.',
    '{a} is further from a name than {a} was this morning, and further along in the week.',
  ],
};

// The same, for two people who talked and moved nothing measurable between
// them. Never "they did not reach an agreement" — an agreement was not what
// the scene was for.
const FALLBACK_PAIR = {
  smooth: [
    '{a} and {b} leave it where it is, and both of them will come back to it before Thursday.',
    'Nothing is settled between {a} and {b}, and neither of them wanted it settled tonight.',
    '{a} and {b} go back in separately, a minute apart, which is a habit now.',
    'They have not agreed anything. {a} and {b} have agreed to keep having the conversation.',
    '{a} takes something away from that and {b} takes something different.',
    '{a} and {b} come out of it with the same short list and neither says so.',
    'It moves nobody tonight. It has moved {a} and {b} nearer to each other all week.',
    '{a} and {b} say goodnight in the corridor like two people who have not just done that.',
  ],
  adverse: [
    '{a} and {b} stop before either of them says the thing that could not be walked back.',
    'It ends because it has to end, not because {a} or {b} is finished.',
    '{a} and {b} leave it, and it is going to be waiting for both of them tomorrow.',
    'Neither of them has moved. That is the part {a} and {b} will each report differently.',
    '{a} goes one way and {b} goes the other and the hall notices the order.',
    'Nothing was decided and something between {a} and {b} was.',
    'They will be perfectly civil at breakfast. {a} and {b} both know what that is worth.',
    '{a} and {b} run out of evening before either runs out of argument.',
  ],
};

const CONSEQ_SINGLE = {
  opened: {
    smooth: [
      '{a} does nothing about it today. {a} will do something about it, and not yet.',
      'It changes nothing anybody could point at, and it changes what {a} intends to do tomorrow.',
      '{a} keeps it. Whoever was near enough to see it did not know what they were looking at.',
      'Nothing is decided by it, and {a} is carrying one more thing into tonight than {a} was this morning.',
      'It goes nowhere today. It has somewhere to go, and {a} knows where.',
      'Nobody else will remember this by supper. {a} will remember it on Thursday.',
      '{a} files it and the filing is the whole of what happened.',
      'It costs nothing now, which is not the same as costing nothing.',
      'The day carries on exactly as it was going to, with one more thing in it.',
      '{a} does not act on it. {a} does not put it down either.',
      'It is small, and small things in this building have a way of not staying small.',
      'Whatever that was worth, {a} has decided not to spend it this morning.',
    ],
    adverse: [
      'That is going to cost {a} something, and {a} knew it was going to as it was happening.',
      '{a} cannot take it back and spends the rest of the hour working out who saw.',
      'It gets away from {a}, briefly, and briefly is all it takes in a building this size.',
      '{a} has made tonight harder for {a}, and has nobody to blame for it.',
      'That is going to be quoted back, and {a} could name the person who will quote it.',
      '{a} spends the next hour finding out how far it went, and it went further than that.',
      'It is out. There is no version of the evening where {a} gets it back.',
      '{a} has given the room something to do with {a}, which is the last thing {a} needed.',
      'Somebody heard the whole of that, and {a} does not know which somebody.',
      'It costs {a} a name at the table tonight and {a} can already feel which one.',
      '{a} would take it back. {a} has been in this format long enough to know that is not on offer.',
      'The damage is small and it is the kind that compounds.',
    ],
  },
  carried: {
    smooth: [
      'The same again, a day later, and {a} is a little better at it than yesterday.',
      '{a} does it again and it costs about what it cost last time, which is manageable.',
      '{a} does the same thing again and it has got no easier and no harder.',
      'Another day of it. {a} has stopped noticing that {a} is doing it at all.',
      'It has become a habit rather than a decision, which is how most of these end.',
      'The second time is easier. The third one was easier than that.',
      '{a} has done this enough times now that there is a rhythm to it.',
      'It is the same weight and {a} has got better at carrying it.',
      'Nothing new. That is not the same as nothing.',
      'By now {a} could do it without thinking, and increasingly does.',
      'It repeats because it works, and {a} has stopped asking whether it still does.',
      'Another morning, the same shape, and {a} is a fraction further in than yesterday.',
    ],
    adverse: [
      'It is getting heavier. {a} has nowhere to set it down and nobody safe to set it down in front of.',
      '{a} does it again, and is worse at it than the last time, and can tell.',
      'It is costing more each time and {a} has not found a way to stop.',
      'The third one is where it stops looking like bad luck to anybody watching.',
      '{a} is further in than {a} meant to be and cannot see the way back from here.',
      'It compounds. Everything in this building compounds.',
      '{a} knows exactly how this ends and does it again anyway.',
      'Every repeat makes the first one look worse, and there have been several.',
      'It is heavier than yesterday and yesterday was heavier than the day before.',
      '{a} has run out of ways to make this one mean something else.',
      'The second one is harder than the first, and {a} has no reason to think the third will not be harder still.',
      '{a} is running out of room to do this in, and there is a week of it left.',
    ],
  },
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
    '{a} and {b} came off the road with {topic}’s name settled between them. Neither has proof; both are treating {topic} as the name for tonight.',
    'By the gate, {a} and {b} had said {topic} out loud enough times to stop hedging. That is one more person now watching {topic}, and {topic} does not know it.',
    '{a} went out carrying {topic}’s name alone and walked back sharing it with {b}. The two of them are closer for it; {topic} is further exposed for it.',
  ],
  hedged: [
    '{a} is no less sure about {topic} than at the gate — and a good deal less sure about {b}, who would not say either way.',
    '{topic}’s name is still {a}’s alone to carry: {b} took it and gave nothing back. {a} walks in wondering which side {b} is really keeping.',
    '{a} put {topic} in front of {b} and got a shrug. The suspicion of {topic} stands; the trust in {b} is the thing that moved, and downward.',
  ],
  defended: [
    '{a} learned nothing new about {topic} and something new about {b}: whatever the road offered, {b} will not move against {topic}.',
    'The name {a} tried was the one name {b} guards. {a} still suspects {topic} — and now knows {b} is no help there, and files that too.',
    '{b} shut the talk of {topic} down flat. {a} keeps the suspicion of {topic} and adds a fresh one, about how fast {b} came to {topic}’s defence.',
  ],
  'named-somebody-else': [
    '{a} went out with {topic}’s name and walked home with {b}’s alternative beside it. Both are on {a}’s list now.',
    '{b} would not follow {a} to {topic}, and would not let {a} arrive empty either. {a} carries in two names instead of one.',
    '{topic} stays on {a}’s list; the name {b} traded goes on beside it. The road doubled the problem instead of settling it.',
  ],
  'would-not-talk-about-it': [
    "{topic}’s name went nowhere on that road. What {a} took home is that {b} will not say a word out of earshot — and that silence had a shape.",
    '{a} raised {topic} and {b} raised the weather. The suspicion of {topic} is exactly where it started; the read on {b} is not.',
    '{b} would not touch {topic}, or anyone. {a} walks in with the same doubt about {topic} and a new one about why {b} stays so quiet.',
  ],
};

// susp-let-it-go-on-the-road-back: {a} walked the suspect ({topic} === {b})
// home, asking all the way. The change is on the doubt about {topic}.
const CONSEQ_ROAD_SUSPECT_WALK = {
  cleared: [
    '{a} spent the whole road home working on {topic} and came away satisfied. The doubt about {topic} is set down, and {a} means it.',
    'A long walk with nothing to do but be asked about it, and {topic} never wavered. {a} lets the suspicion of {topic} go at the gate.',
    '{a} went out doubting {topic} and walked back an ally. Whatever the road tested, {topic} passed it.',
  ],
  slipped: [
    '{topic} gave {a} one account of the afternoon early on the road and a different one near the gate — and {a} was still listening. The doubt about {topic} is far harder now.',
    '{a} caught {topic} telling the same hours two ways on one walk. That is no longer a feeling about {topic}; it is a thing {a} could say at the table.',
    'Somewhere on the road {topic}’s story stopped matching itself, and {a} heard it. The suspicion of {topic} has teeth now.',
  ],
  hardened: [
    '{topic} held the line the whole way home and {a} believed none of it. The doubt about {topic} did not clear — it set.',
    '{a} asked {topic} about it all the way to the gate, got a clean answer each time, and trusts {topic} less for how clean they were.',
    'Nothing {topic} said was wrong, and {a} came home surer than ever that something is. The read on {topic} hardened on that road.',
  ],
};

// cover-road-rehearsal (reworked): a Traitor rehearsed the answer to a SPECIFIC
// live suspicion aimed at them ({topic} = what they are being asked to account
// for). The change is whether that answer will hold at the table.
const CONSEQ_ROAD_COVER = {
  airtight: [
    '{a} walked the account of {topic} smooth enough to say in {a}’s sleep. If it comes up at the table tonight, {a} is ready for it.',
    'By the gate {a} had {topic} answered from every side. The one advantage a Traitor keeps is a story that does not move, and {a} has it.',
    '{a} found the seam in the account of {topic}, closed it on the road, and arrived with nothing left to catch.',
  ],
  serviceable: [
    '{a} got the account of {topic} to hold, mostly. There is one part {a} still cannot say the same way twice, and the road ran out before it was fixed.',
    '{a} has a version of {topic} that survives being repeated, provided nobody pushes the middle of it. {a} is betting nobody does.',
    'The story about {topic} works if you do not lean on it. {a} spent the walk hoping the table will not.',
  ],
  overcooked: [
    '{a} rehearsed the account of {topic} so many times on the road that it stopped sounding like something that happened. Now having it is itself the risk.',
    '{a}’s answer for {topic} grew a detail for every hour, which no honest person has. {a} knows it and cannot cut any of them.',
    'By the gate {a} had polished {topic} past the point of belief, and could feel it, and could not stop.',
  ],
  'stopped-rehearsing': [
    '{a} heard how the rehearsed account of {topic} sounded and decided the rehearsing was the thing that gets people caught. {a} goes in cold, on purpose.',
    '{a} put the account of {topic} down on the road and will say it, for the first time, only if the table asks. Nobody else will ever know there was a rehearsal.',
    '{a} has watched two people caught by being too ready about their story. On {topic}, {a} will not be the third.',
  ],
  'could-not-get-it-straight': [
    '{a} could not get through the account of {topic} once, all the way, without losing an hour of it. {a} arrives with a night that has a hole in the middle.',
    'Every time {a} started on {topic} it came out in a different order, and the order is the whole thing. The road did not give it back.',
    '{a} spent two miles on {topic} and got off the road less sure of it than at the gate.',
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
    'The story of {topic} held, barely. {a} spends the walk in learning which loose end to watch.',
    'One person remembered {topic} differently and {a} had to agree with them. The account is a repair now, not a clean run.',
  ],
  broke: [
    'The account of {topic} came apart in the open, and {a} could not put it back. One story {a} was leaning on has stopped working.',
    '{a} answered about {topic} once too often and once too fast, and it fell over where people could hear. There is no taking that back on a road.',
    'The story of {topic} did not survive the day. {a} walks in with a hole where an alibi used to be.',
  ],
};

// testing-who-you-walk-with: {a} chose to walk with {topic}, and what {topic}
// did with the pick is the test. The change is the read on {topic}.
const CONSEQ_ROAD_WALK_TEST = {
  flattered: [
    '{a} picked {topic} for the road and {topic} took it as the compliment it was. The two are closer for it, and {a} has the read {a} went out for.',
    '{topic} walked the whole way beside {a} and gave the honest version. {a} comes off the road trusting {topic} a little more than at the gate.',
  ],
  wary: [
    '{a} learned less about {topic} than {a} hoped: {topic} kept the walk pleasant and gave nothing away. {a} files the caution.',
    '{topic} answered {a} carefully the whole road out. {a} is no surer of {topic}, and a little more curious about why.',
  ],
  transactional: [
    '{topic} made the road a negotiation. Nothing was decided, but both of them know a deal is on the table now.',
    '{a} picked {topic} and got a trade rather than a friendship. {a} knows exactly what {topic} wants, and that is worth more than warmth.',
  ],
  'would-not-be-picked': [
    '{topic} declined to be walked with, quickly and in front of people. {a} has the answer {a} went for, and it is not the one {a} wanted.',
    '{topic} put a length of road between them by the top of the hill. {a} comes home knowing where {a} stands with {topic} — further out than {a} thought.',
  ],
  'turned-it-around': [
    '{topic} was picked to be read and spent the road doing the reading instead. Whoever set out to test {topic} came home tested.',
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
    'The read on {topic} hardened between {a} and {b}. It is still a feeling — but it is a shared one now.',
    "{a} and {b} both leave more suspicious of {topic} than they were when they sat down.",
  ],
  down: [
    '{a} came in doubting {topic} and leaves a little less sure — whatever {b} said took some of the weight off {topic}.',
    'The doubt about {topic} eased between {a} and {b}. It is not gone; it is lighter.',
    '{a} lets some of {topic} go. {b} did not think there was much in it, and said so.',
  ],
  flat: [
    "{topic}'s name went between {a} and {b} and settled nothing. The read on {topic} is exactly where it started.",
    '{a} and {b} turned {topic} over and put it down again, no further along.',
    '{b} would not be drawn on {topic}. {a} carries the same half-thought back inside, alone.',
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
    '{other} came off that test trusting {topic} a shade more than before — a small thing, but {topic} passed it clean.',
    'Whatever {other} was probing for, {topic} did not give it, and {other} files {topic} on the safer side of the ledger tonight.',
    '{other} set the test and {topic} walked through it without ever noticing there had been one. That is the best a test like this does.',
    '{other} finds no reason to doubt {topic} after the check.',
    '{other} got the reassurance {other} went looking for: on this evidence, {topic} is exactly who {topic} appears to be.',
  ],
  failed: [
    '{other} did not like what the test showed about {topic}, and there is no unseeing it now.',
    '{topic} failed a check {topic} did not know was running, and {other} is the only one who knows {topic} failed it.',
    'The test came back wrong about {topic}. It is a feeling with a shape now, and the shape is {topic}.',
    '{other} went in half-doubting {topic} and came out further along that road — nothing proven, but the doubt about {topic} has weight it lacked this morning.',
    'Whatever {other} suspected, {topic} did the thing that confirms it, and {other} watched {topic} do it.',
  ],
  spotted: [
    '{topic} worked out {other} was running a test, which means the test is over and {topic} knows who set it.',
    '{other} set out to read {topic} and {topic} read the room instead. Now {topic} knows exactly where {other} stands.',
    '{topic} called it out as a test to {other}\'s face. {other} got an answer, but {topic} now knows {other} was looking.',
    '{topic} turned the check back on {other}, and came away knowing more about {other} than {other} got about {topic}.',
    '{other} tried it once too plainly and {topic} caught it. There is no running that particular test on {topic} again.',
  ],
  inconclusive: [
    '{other} found no evidence that either cleared or implicated {topic}.',
    '{other} learned nothing conclusive about {topic}; nobody would confirm or contradict {topic}’s account.',
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
const TEST_HELD = new Set(['complied', 'over-delivered', 'checks-out', 'sincere',
  'stayed-calm', 'reassured', 'consistent', 'read-it-right', 'kept-it',
  'followed-through', 'keptQuiet', 'confirmed']);
const TEST_FAILED = new Set(['refused', 'inconsistent', 'reluctant', 'refuses',
  'got-rattled', 'hedged', 'would-not-repeat-it', 'half-kept-it', 'dropped-it',
  'malicious', 'innocent', 'failed', 'bad']);
/** 'held' | 'failed' | 'spotted' | 'inconclusive' for a testing scene. */
function _testDir(s) {
  const b = String(s.branch || '');
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
  return 'held';
}
const CONSEQ_CONFRONT = {
  held: [
    '{a} got nothing out of {topic}, and the room saw {topic} take a direct hit without falling — which says something, just not the thing {a} wanted said.',
    '{topic} held, so the accusation proved nothing; what it proved is that {a} and {topic} are enemies out loud now.',
    'Whatever {a} hoped to shake loose, {topic} did not give it up. The two of them are a known feud from here on.',
  ],
  exposed: [
    '{topic} came off worse for it — the flinch is what the room keeps, not the words — and {a} knows exactly what that bought.',
    'The room will remember {topic} coming apart more than anything {topic} actually said, and it is watching {topic} harder for it.',
    '{topic} did not hold, and a room that watches for exactly that now has its reason to keep watching {topic}.',
  ],
  turned: [
    'It is {a} on the back foot now, not {topic}. Whatever {a} walked in carrying, {topic} handed straight back.',
    '{a} meant to corner {topic} and ended up explaining themselves, and the room noticed which way that went.',
    '{topic} turned it clean around, and now it is {a} the room is quietly wondering about.',
  ],
  'blew-up': [
    'Nothing about {topic} got settled — but {a} and {topic} are a declared war now, and the rest of the room has to pick a side or work hard to look like it has not.',
    'Two people who plainly cannot stand each other, out loud, with a vote coming: {a} and {topic} just made the week harder for the room around them.',
    'The fight told the room nothing about {topic} and everything about {a} and {topic}, and none of it can be taken back.',
  ],
  defended: [
    '{topic} came through it, and the room half-remembers who stood where while it happened.',
    'Whatever was meant to land on {topic} did not, quite — {topic} is still standing and the room files that too.',
    '{topic} weathered it, and the room noticed that the accusation slid off cleaner than it should have.',
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
    '{topic} came through it, and {a} is the reason — a debt like that does not un-happen.',
    'The doubt eased off {topic}, and the people who saw it know {a} bought that with their own standing.',
    '{topic} is safer than they were an hour ago, and tied to {a} now whether either of them wanted that.',
  ],
  unmoved: [
    'The defence changed nothing: {topic} is under exactly as much suspicion as before, and {a} spent standing on it for no return.',
    '{topic} is no better off, and {a} is on record having tried — which is its own small mark, for later.',
    'It slid off. {topic} stays where they were, and the only thing that moved is that {a} showed a card.',
  ],
  spread: [
    '{a} drew the room’s doubt onto themselves standing up for {topic}, and now both of them are being watched — a defence that widened the target instead of shrinking it.',
    'Now it is {a} and {topic} both, tied together by the defence: whatever lands on one has a way to the other.',
    'Standing up for {topic} put {a} in the frame beside them, and neither can get clear of the other now.',
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
    '{a} got {topic}’s name to sit where {a} needed it. Nobody looked at {a} for saying it, and one more person is watching {topic} tonight.',
    'The suspicion {a} pointed at {topic} took hold. {topic} does not know where it started, and {a} means to keep it that way.',
    '{a} walked away clean and left {topic} holding a doubt {topic} did not earn — a good night’s work, for a Traitor.',
    '{a} put {topic} in the frame and stepped out of it. The room is looking the wrong way, which is the only way {a} needs it to look.',
  ],
  slipped: [
    '{a} pushed {topic}’s name too hard, and the room noticed the pushing more than the name. Now {a} is the one who looks like they had a reason.',
    'The move against {topic} was a shade too neat, and neat is what gets a Traitor caught. {a} felt it land wrong.',
    '{a} aimed a doubt at {topic} and it ricocheted. {topic} is fine; {a} is the one with a question on them now.',
    '{a} overplayed {topic} and knows it. The name did not stick to {topic}, and something stuck to {a} instead.',
  ],
  turned: [
    '{topic} would not carry what {a} tried to hang on them, and said so where people could hear. {a} is back to square one, and lighter one option.',
    '{a} offered {topic} up and {topic} handed it straight back. Whatever {a} learned, {topic} learned {a} was reaching.',
    'The name went out and came back. {topic} did not take it, the room did not take it, and {a} is holding a plan that did nothing.',
    '{topic} played along just far enough to see where {a} was going, then stopped. {a} showed a card for nothing.',
  ],
  abandoned: [
    '{a} had {topic}’s name ready and swallowed it. Some nights the safest move is the one {a} does not make, and {a} decided this was one.',
    '{a} thought better of pointing at {topic} at the last second. The plan is intact because {a} never spent it.',
    '{a} pulled the move against {topic} before it left {a}’s mouth. Nobody will ever know {topic} was almost tonight’s name.',
    '{a} kept {topic}’s name in reserve — not tonight, but {a} knows exactly where it is for when {a} needs it.',
  ],
};
// cover-blend — {a} hides inside the grief around {topic} (a murdered player's
// friend, whose circle {a} is not really part of).
const CONSEQ_COVER_BLEND = {
  held: [
    '{a} folded into the grief around {topic} and came out looking like one more person who is sad — which is exactly what {a} needed to look like.',
    '{a} sat with {topic} and nobody once thought {a} did not belong there. The best place to hide is inside the mourning.',
    '{a} borrowed {topic}’s circle for the evening and it fit: one more ordinary griever, as far as anyone watching could tell.',
    '{a} got close to {topic} without a single false note. {topic} has no idea they just gave a Traitor somewhere to hide.',
  ],
  slipped: [
    '{a} overdid it with {topic} — too sad, too fast — and grief does not work like that. {topic} half-noticed, and half is enough.',
    '{a} tried to blend in with {topic} and stood out instead. There is a way real friends behave, and {a} was performing next to it.',
    '{a} pushed too hard into {topic}’s circle and it closed a little. {a} is not one of them, and tonight it showed.',
    '{a} reached for {topic}’s grief and grabbed air. {topic} did not warm to it, and a cold reception is a thing people remember.',
  ],
  turned: [
    '{topic} kept {a} at arm’s length all evening, politely and completely. {a} learned that {topic}’s circle is not a place {a} gets to hide.',
    '{topic} did not want company, least of all {a}’s. Whatever {a} was going for, {topic} was not in the mood to supply it.',
    '{a} went to stand with {topic} and was quietly not made room for. {a} files it and finds somewhere else to be ordinary.',
    '{topic} made room for the others and not for {a}, and only {a} noticed the gap. {a} will not try that door again.',
  ],
  abandoned: [
    '{a} decided the safest way to sit with {topic}’s people was not to, and drifted off before it looked deliberate. Nothing risked is nothing lost.',
    '{a} thought better of joining {topic}’s circle tonight. Better to be nobody in the corner than the wrong somebody in the group.',
    '{a} left {topic}’s grief to {topic}’s friends and kept out of it. The move {a} did not make is the move that cannot fail.',
    '{a} backed away from {topic}’s table before sitting down. Some nights the move is to be forgettable, and {a} made it.',
  ],
};
// cover-account — {a} defends, rehearses, or sits alone with the account of
// {topic} (the night the last victim was murdered, or the recruitment approach,
// or — on the first day — what {a} really is).
const CONSEQ_COVER_ACCOUNT = {
  held: [
    '{a}’s account of {topic} is holding. Said the same way twice, to two different people, and neither of them blinked.',
    '{a} got through {topic} without a seam showing. One more day survived is one more day a Traitor gets to keep playing.',
    'Whatever {topic} needed to be, {a} made it that, out loud, and it held. {a} sleeps a little easier for it.',
    '{a}’s version of {topic} is solid tonight. Nobody has a reason to pull at it, and {a} has given them none.',
  ],
  slipped: [
    '{a}’s account of {topic} cracked where somebody could see it, and there is no taking that back on the spot.',
    '{a} said {topic} one way too many times and heard it stop sounding true. The story about {topic} has a soft place in it now.',
    'Something in {a}’s telling of {topic} did not add up, and {a} felt the room catch it — the worst feeling a Traitor gets.',
    '{a} tripped on {topic} in front of the wrong person. It is a small thing, and small things are exactly what get remembered.',
  ],
  turned: [
    'Somebody pushed {a} on {topic} harder than expected, and {a} had to give ground. The account of {topic} is a repair now, not a clean run.',
    '{a} got asked about {topic} straight out and answered a beat too slow. The beat is what they will remember, not the answer.',
    '{a} planned to raise {topic} and got beaten to it, which is never where a Traitor wants to be. Now {a} is reacting, not steering.',
    'The story of {topic} got checked against somebody else’s and did not quite match. {a} spends the night working out how much that cost.',
  ],
  abandoned: [
    '{a} decided the safest thing to do about {topic} was nothing at all, and said none of it. A story you never tell cannot be caught.',
    '{a} had a whole account of {topic} rehearsed and left it in {a}’s pocket. Better an awkward silence than a story that unravels.',
    '{a} backed off {topic} before anyone asked. Nobody will ever know there was a version ready, which is the point.',
    '{a} buried {topic} rather than defend it. On the nights {a} cannot make it hold, the move is to make it small.',
  ],
};
// cover-weight — {a} sits ALONE with the account of {topic}. No audience, so it
// never "cracks in the open"; the axis is whether {a} is holding together.
const CONSEQ_COVER_WEIGHT = {
  held: [
    '{a} carried {topic} through another night without it showing. The whole cost of it is that {a} is the one who has to carry it.',
    '{a} sat alone with {topic} and put it down again, steady. Tomorrow {a} does it all over, and knows it.',
    "{a} has stopped fighting {topic} and started managing it. The secret is {a}'s weight to carry.",
    '{a} looked {topic} full in the face in the dark and did not flinch. That is the job, on the nights nobody is watching.',
  ],
  slipped: [
    '{a} lay awake with {topic}. Nothing cracked in the open, but {a} is running on less than {a} needs to keep this up.',
    '{a} came within a sentence of telling somebody about {topic}, alone in the dark, and stopped. Nobody will ever know how close it was.',
    '{topic} would not let {a} sleep. It is not the room that is wearing {a} down; it is the thing only {a} knows.',
    '{a} went over {topic} again in the dark and the dark did not help. The lie is holding fine. {a} is the part that is wearing out.',
  ],
  turned: [
    '{a} nearly handed {topic} to somebody just to be rid of it, and caught {a}’s own mouth in time. The weight of it is starting to steer {a}.',
    '{topic} got the better of {a} for a moment tonight. Nobody saw — but {a} knows it can, now, which is a new thing to be afraid of.',
    'For the length of one bad hour {topic} was louder than {a}’s sense, and {a} is only sure it passed because morning came.',
    "{a} nearly said {topic} out loud without meaning to, and caught it just in time. The danger now is {a}'s own mouth.",
  ],
  abandoned: [
    '{a} tried to stop thinking about {topic} and could not. A secret that size does not let you set it down.',
    '{a} tried to leave {topic} for the morning and took it to bed instead. There is no shift that ends for a Traitor.',
    '{a} meant to set {topic} aside tonight. {topic} had other ideas, and {a} lost the argument to {a}’s own head.',
    '{a} wanted one night off from {topic} and did not get it. The secret does not take nights off.',
  ],
};
// GRIEF (mourning). {topic} is the murdered person. This family KEEPS its
// reaction beat — a comfort beat over a death is coherent, not a wrong-subject
// redundancy — and only the closing consequence is grounded, so it names the
// dead. Lines use {a} and {topic} ONLY (never {b}), so one pool is safe over the
// solo scenes (a keepsake pocketed, somebody numb) and the pair scenes alike.
const CONSEQ_GRIEF = {
  closer: [
    'Grieving {topic} out loud left {a} less alone than before it — the one thing a death like this ever gives back.',
    'The loss of {topic} drew {a} toward the people who felt it too. Something in the room is warmer for the naming of it.',
    '{a} said what {topic} had meant and found {a} was not the only one who felt it. Shared grief is lighter than the other kind.',
    'Talking about {topic} helped {a} more than {a} expected it to.',
    '{topic} being gone drove {a} toward the people who are still here.',
  ],
  apart: [
    'The loss of {topic} put something cold between {a} and the room, and {a} let it.',
    'Grieving {topic} went wrong for {a}: what should have drawn people together drove a wedge instead.',
    '{a} came away from the mourning of {topic} more alone, not less. Not every death brings a room closer.',
    '{topic}’s name sat badly between {a} and the others, and by the end nobody was pretending otherwise.',
    'The grief for {topic} turned sharp on {a}, and {a} pointed it at the room.',
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
    '{a} took the grief over {topic} off somewhere private, and it weighed exactly the same coming back.',
    '{a} keeps listening for {topic} in a building with one fewer person in it, and knows {a} is doing it.',
    '{a} grieved {topic} alone and put it away before anyone could see.',
  ],
  banished: [
    'The castle is one chair lighter for {topic}, and {a} sat alone with the fact that the room did it in daylight, on purpose.',
    '{topic} was sent home by a vote {a} was part of — a different weight, somehow, from the ones taken in the dark.',
    'For {a}, {topic} leaving by the table is the harder kind of gone: nobody to blame but the people still in the building.',
    '{a} spent the quiet hours with the seat {topic} left — not taken, but given away by a room {a} still stands in.',
  ],
  haunted: [
    "{a} could not stop counting how many people had written {a}'s name down at that table.",
    '{a} came out of it no safer than {a} went in, and knowing exactly which faces to watch from here.',
    "{a} lay awake less worried about who went home than about how many votes had {a}'s name on them.",
    '{a} counted, alone, who had written {a} down, until the counting stopped meaning anything and the light came anyway.',
  ],
  restless: [
    "{a} talked {a}'s self into suspecting somebody, and by morning could not remember why.",
    '{a} chewed on a hunch all night and it was still a hunch by morning.',
    '{a} sat alone with a feeling that had no fact under it, knew as much, and sat with it regardless.',
    '{a} went looking for a reason to be afraid, found none, and stayed afraid anyway.',
  ],
  // was-found: somebody came upon the crier and stayed. Role-neutral — the pool
  // names the dead against BOTH of them, so it does not matter which of the pair
  // the composer puts first (see grief.js: the recorded pair is left as-is).
  comforted: [
    'The two of them sat with the fact of {topic} for a while, and neither pretended it was nothing.',
    'Grief for {topic} did not have to be carried alone this morning, and both of them were quietly the better for that.',
    'They fixed nothing about {topic} being gone. They just made sure nobody had to face it by themselves.',
    'Whatever {topic} had been to them, the loss was lighter for being shared in that corner before anyone else was up.',
    'Neither of them said much about {topic}. Sitting there together was the whole of what either had to offer, and it was enough.',
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
    'What {other} and {topic} have is realer tonight than it was this morning, and both of them felt it move.',
    '{other} and {topic} closed a little more of the distance. In a castle, being sure of one person is worth more than it looks.',
    'It went well for {other} and {topic}. There is a place in this game to stand next to somebody, and they are building one.',
    'The thing between {other} and {topic} took a step it cannot easily take back — a comfort and a liability, both at once.',
    '{other} and {topic} are steadier tonight. Two people who trust each other in here is rare enough to be worth guarding.',
  ],
  cooled: [
    'Whatever {other} and {topic} had cooled tonight, and neither of them pretended it hadn’t.',
    'The distance between {other} and {topic} opened back up, and in here a rift between two people is a thing other people use.',
    'It went badly for {other} and {topic}. What was shelter yesterday is a draught tonight.',
    '{other} and {topic} are further apart than they were this morning, and a castle notices a couple coming unstuck.',
    'Something closed between {other} and {topic}, and closed doors between two people are read by the rest of the building.',
  ],
  tangled: [
    'What {other} and {topic} are to each other got more complicated tonight, and complicated is dangerous in a game that turns on who trusts whom.',
    'The thing between {other} and {topic} is now half feeling and half strategy, and neither of them could tell you the ratio.',
    '{other} and {topic} are a fact the rest of the castle is starting to have opinions about — the last thing a couple in here wants.',
    'Whatever {other} and {topic} decided tonight, the game was in the room with them, and it always will be now.',
    'For {other} and {topic} the line between protecting each other and using each other got thinner tonight, and both of them know it.',
  ],
};
// CALLBACK. {topic} is the person the actor shares prior-season history with.
// KEEPS its reaction beat; uses {other} + {topic}.
const CONSEQ_CALLBACK = {
  warmed: [
    'The history between {other} and {topic} came back on the right side tonight. Two people who already know how the other plays is an edge, and they have it.',
    '{other} and {topic} found their old rapport still there. The franchise remembers, and tonight it paid {other} a dividend.',
    'Whatever {other} and {topic} were on another season, tonight it works in their favour, and both of them are lighter for it.',
    'The old understanding between {other} and {topic} held across the gap between seasons — rarer than it sounds, and worth more.',
  ],
  cooled: [
    'Whatever is between {other} and {topic} from before did not stay in the past. It is a live thing again, and the room can feel there is history in it.',
    '{other} and {topic} reopened something that started on another season. Whatever it was then, it has teeth again now.',
    'The old business between {other} and {topic} came back on the wrong side tonight, and neither of them is letting it go.',
    'What {other} and {topic} carry from before soured the room between them. The past does not expire in here; it waits.',
  ],
  noted: [
    'The history between {other} and {topic} is out in the open now, and a room that knows two people go back will price them as a pair.',
    '{other} and {topic} could not keep their past to themselves, and now the castle is doing the maths on it.',
    'Whatever {other} and {topic} were before, the room has noticed they were something — a fact with a cost in here.',
    'The old connection between {other} and {topic} is common knowledge tonight. Two people with a shared yesterday are a target with a shared today.',
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
    '{a} handed {b} a read on {topic} that {b} had no way to check — {b} has no history with {topic} to weigh it against, only {a}’s word.',
    '{b} came away watching {topic} on {a}’s say-so alone, which is the whole power of having played before and the whole risk of trusting somebody who has.',
    '{a}’s history with {topic} is {b}’s inheritance now, secondhand, and {b} took it because {b} had nothing of {b}’s own to set against it.',
    '{b} left with {a}’s warning about {topic} and no way to test it — a newcomer’s bargain, taking a veteran’s past on trust.',
  ],
  'had-it': [
    '{a} warned {b} about {topic} and found {b} already halfway there — a reputation beats a warning to the room, as it usually does.',
    '{b} did not need {a}’s history with {topic}; {b} had built enough of a read here to meet it, and the missing past turned out not to matter this time.',
    '{a} told {b} what {topic} was, and {b} nodded along to a thing {b} had worked out with no history to go on at all.',
    '{a}’s account of {topic} landed on somebody who had already reached it alone — the warning confirmed {b} rather than informing {b}.',
  ],
  refused: [
    '{b} has no history with {topic} and decided that cut the other way — {b} trusts what {b} has seen over what {a} remembers, and said so.',
    '{a}’s warning about {topic} bounced: with no shared past of {b}’s own, {b} weighed {a} against {topic} and came down on {topic}’s side.',
    '{b} took {a}’s history with {topic} as {a}’s problem, not {b}’s, and defended {topic} to {a}’s face.',
    'Having nothing owed to {topic} either way, {b} heard {a} out and sided with {topic} anyway — the warning cost {a} more than {topic}.',
  ],
  'spent-it': [
    '{b} had no stake in {a}’s history with {topic} and every use for it — {b} took the warning straight to work, and {a} watched it be spent.',
    '{a} meant a caution and {b} heard ammunition. No history with {topic} left {b} free to use one without a second thought.',
    '{a}’s account of {topic} became {b}’s opening move inside the hour, which is not what a warning is for.',
    '{b} turned {a}’s past with {topic} into {b}’s present against {topic}, and did it before {a} had finished talking.',
  ],
};
const CONSEQ_CALLBACK_ENVY = {
  'left-out': [
    '{a} sat outside a conversation about {topic} that {a} had no part in, and felt the whole weight of having no history here to fall back on.',
    'The story about {topic} was one {b} could tell and {a} could only listen to. In a returnee castle, that gap leaves you standing in the open.',
    '{a} has no shared past with {topic} to trade on, and an hour of {b} reminiscing made sure {a} felt it.',
    'A story about {topic} went round that {a} was not in, and {a} learned again that a clean slate is also an empty hand here.',
  ],
  asked: [
    '{a} made {b} tell the whole story about {topic} from the start — if {a} cannot have the history, {a} will at least have the information.',
    'Rather than sit outside it, {a} asked {b} for the whole of {topic}, and turned a gap into a briefing.',
    '{a} has no history with {topic}, so {a} did the next best thing and got {b} to hand it over in full.',
    '{a} could not share {topic}’s past, so {a} borrowed it — questioned {b} until the missing years were at least secondhand knowledge.',
  ],
  virtue: [
    '{a} turned having no history with {topic} into the argument — no old debts, no old grudges, nothing owed. In here, a clean slate can be sold as trustworthiness.',
    '{a} made a virtue of the gap: the rest of the room is tangled up with {topic}, and {a} is not, and {a} made sure that was heard.',
    '{a} decided that not sharing {topic}’s history was a feature, not a wound, and started saying so out loud.',
    '{a} recast the missing past with {topic} as an asset — the one person here with no reason to protect {topic} or fear them.',
  ],
  'own-story': [
    '{a} stopped envying the history with {topic} and went and started one of {a}’s own instead — the only real cure for being the newcomer.',
    'Left out of {topic}’s story, {a} went and built a fresh one elsewhere in the room, which is worth more than borrowing an old one.',
    '{a} could not share the past with {topic}, so {a} spent the morning making a present with somebody who also had none.',
    'Rather than stand at the edge of {topic}’s history, {a} walked off and laid the first stone of a history of {a}’s own.',
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
    '{a} felt the ground shift under {topic} and stepped back onto it — the doubt is real, but tonight {a} would rather have the showmance than the answer.',
    '{a} looked straight at what {topic} might be and chose not to see it, and the couple is warmer tonight for the looking away.',
    'Whatever {a} half-noticed about {topic}, {a} buried it under one more good evening. The read is still there; {a} just is not ready to spend it.',
    '{a} had the thought about {topic} and put it back down. Some doubts are safer kept than acted on, and {a} decided this was one.',
  ],
  'took-root': [
    'A cold thought about {topic} took root in {a} tonight, and {a} said nothing — so {topic} does not yet know {a} has started counting.',
    '{a} has begun watching {topic} the way you watch a person you sleep beside and have started to wonder about. Nothing said, everything changed.',
    '{a} kept the doubt about {topic} private, and a doubt kept is a doubt that grows. {topic} is a question to {a} now, not just a partner.',
    'Something about {topic} stopped adding up for {a}, quietly, and {a} is not going to be the one to raise it first.',
  ],
  'named-it': [
    '{a} put the doubt to {topic} directly, in private, and the showmance is a different thing now for {a} having said it aloud.',
    '{a} asked {topic} the question {a} had been swallowing for days. Whatever {topic} answered, the couple cannot go back to not having asked.',
    '{a} confronted {topic} where nobody could hear, and something broke a little in the asking — trust, once queried, does not fully re-seal.',
    '{a} finally said to {topic} what {a} had been thinking, and the room the two of them shared is smaller for it now.',
  ],
  'went-public': [
    '{a} named {topic} out loud in the dark, loud enough for the corridor, and the showmance stopped being shelter and became evidence against {topic}.',
    'The one person who knew {topic} best just told the floor what {a} believes {topic} is. There is no protection left in it for {topic} now.',
    '{a} spent the whole of the showmance in a single sentence: {topic} is exposed, and the person who exposed {topic} is the one who used to shield them.',
    '{a} turned the couple into an accusation — {topic} is named, publicly, by the last person anyone expected to do it.',
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
    '{a} keeps coming back to {a}’s own ballot with {topic}’s name on it. The room got it wrong, and {a} was part of the room.',
    'The reveal cleared {topic} of everything and left {a} holding a vote {a} cannot take back.',
    '{a} was certain about {topic} at six o’clock, and certainty is exactly what cost {topic} the game. {a} will carry the price of that a while.',
    '{a} helped send {topic} home a Faithful, and no amount of going over it changes that.',
  ],
  blamed: [
    '{a} traced {topic}’s whole banishment back to the loudest voice in the room, and is not letting that voice forget it.',
    'For {a}, the wrong done to {topic} has a face on it now, and it is not {a}’s own.',
    '{a} came away sure of one thing: {topic} should still be here, and somebody talked the room into the opposite.',
    '{a} is angrier at how {topic} went than at the fact of it — a name got said first, and the rest of them only agreed.',
  ],
  defended: [
    '{a} will not call {topic} a mistake, only the best answer to a bad question, and means to make the same kind of call tomorrow.',
    '{topic} is gone and {a} has decided to be colder about it than the room expected, because the alternative is being useless.',
    '{a} filed {topic} under the cost of playing this game at all, and went back to work. Somebody has to.',
    'For {a}, the read was right on the night even if {topic} was wrong, and {a} is not going to apologise for arithmetic.',
  ],
  quiet: [
    '{a} would not say {topic}’s name again tonight, and the not-saying was louder than anything {a} could have said.',
    'Whatever losing {topic} did to {a}, {a} took it somewhere the room could not follow.',
    '{a} carried {topic} out of that hall without a word, and nobody was going to make {a} put it down for them.',
    "{a} answered every question about the table without once saying {topic}’s name, and the room heard the gap where it should have been.",
  ],
};
// AFTER-RIGHT — the reveal said the banished player was a Traitor. The room
// got it right, and now the question is who actually knew.
const CONSEQ_AFTER_RIGHT = {
  credited: [
    '{a} had {topic}’s name before the reveal did, and tonight the slate proved it — worth more to {a} than the banishment itself.',
    'For once the castle confirmed something for {a}: {topic} was exactly what {a} had thought, and {a} got to say so at last.',
    'The read on {topic} came good, and {a} is walking a shade taller for it — quietly, where it cannot be used against {a}.',
    '{a} and the slate agreed about {topic}, and {a} filed the feeling away for the next time a read of {a}’s gets waved off.',
  ],
  'who-knew': [
    'The interesting thing was never {topic} leaving. It was working out who else had {topic}’s name, and what that says about them.',
    '{a} came away from {topic} less interested in the win than in who claimed to have seen it coming and could not prove they had.',
    '{topic} is off the board, and now {a} is doing the harder arithmetic: which of the people still here really knew.',
    'For {a}, catching {topic} only sharpened the next question — the room got one right, and somebody in it got there suspiciously fast.',
  ],
  onward: [
    '{a} gave {topic} about four seconds of satisfaction and then went straight to who {topic} had been sitting with.',
    '{topic}’s name is off the board, and for {a} it only made the shape of the rest of them clearer.',
    'Being right about {topic} is not the same as being safe, and {a} spent the quiet minutes on the difference.',
    '{a} took {topic} away to keep — one fact the castle had finally made certain — and started rebuilding the week around it.',
  ],
};
// SEAT-LOSS — grief for the banished, either at the table's edge (after-table)
// or in the dark afterwards (night). KEEPS its reaction beat (mourning is
// coherent), and names {gone}: a person banished in daylight, which is a
// different weight from the ones taken at night.
const CONSEQ_SEAT_LOSS = {
  mourned: [
    'The empty place where {topic} sat is the one {a} keeps looking at, and the vote that made it empty was cast in daylight, by hands still in the room.',
    '{a} lost {topic} to a show of hands, not to the dark, and somehow that is the harder thing to sit with.',
    '{a} watched the room vote {topic} out in daylight, which sits heavier than a murder nobody saw.',
    '{a} spent the evening keeping {topic} in the conversation, because the alternative was letting the room close over the gap too fast.',
  ],
  relieved: [
    '{a} would not say it aloud, but the seat {topic} left is one {a} is glad to see empty. Some banishments are a mercy, and this was one.',
    'Whatever {a} owes the room tonight, it is thanks: {topic} is gone, and {a} will sleep easier for the chair being empty.',
    'For {a}, the loss of {topic} is not a loss at all, and {a} spent the night making a careful private peace with that.',
  ],
  guilty: [
    '{a} wrote {topic}’s name and now has to sit across from the gap it made. There is no version of the evening where {a} did not help do that.',
    'The empty seat is {a}’s doing as much as anyone’s — {a}’s ballot said {topic}, and the slate does not forget.',
    '{a} keeps arriving back at the same fact: {a} put {topic}’s name down, and {topic}’s chair is where {a} put it.',
  ],
  angry: [
    '{a} traced the seat {topic} left back to the loudest voice at the table, and is not finished with that voice yet.',
    'For {a}, {topic} leaving has a face on it, and it is not {a}’s: somebody talked the room into that chair being empty.',
    '{a} came away from {topic}’s seat less sad than furious, and clear about exactly who to be furious at.',
  ],
  quiet: [
    'The seat {topic} had is the first thing {a} sees in that room now, and will be tomorrow.',
    '{a} could not put {topic} into words tonight, and stopped trying somewhere before it got light.',
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
  'suspicion-third': { reaction: false, byDirection: true, conseq: CONSEQ_SUSP_THIRD },
  'testing-probe': { reaction: false, dir: _testDir, conseq: CONSEQ_TESTING },
  'cover-deflect': { reaction: false, dir: _coverDir, conseq: CONSEQ_COVER_DEFLECT },
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
  const say = _fill(_pickUnique(pool, key + '|tconseq', used, 'tconseq'), subs);
  return { text: say, say, mark: null, tone };
}

/** A plain closing sentence sourced from the scene's visible receipts. */
function _receiptConsequence(s, subs, tone, key, used) {
  const chips = Array.isArray(s.chips) ? s.chips : [];
  const lines = [];
  const seen = new Set();
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
        '{a} files {b} under the names worth keeping an eye on.',
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
        '{a} and {b} have more ground under them tonight.',
      ] : [
        '{a} and {b} are cooler with each other after that.',
        'Something between {a} and {b} frays a little.',
        '{a} and {b} are more guarded with each other after that.',
        '{a} and {b} have less ground under them tonight.',
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
    // `CONSEQ_SINGLE` and `CONSEQ` are already written for exactly this — a
    // scene whose outcome is internal rather than countable — and carry
    // twelve lines a branch against these four. So the fallback now goes
    // THERE rather than to a fifth pool that says nothing.
    const pool = s.closedNow ? [
      'The conversation ends there.',
      'They say nothing further about it.',
      'That is the last either of them says on the subject.',
      'The discussion stops before anyone else joins them.',
    ] : (subs.b && subs.b !== subs.a)
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
  const leads = {
    'road-third-name': '{a} brings up {topic} on the walk.',
    'road-suspect-walk': '{other} watches how {topic} behaves on the walk.',
    /* viewer phrase */ 'road-cover': '{a} rehearses what to say about {topic}.',
    /* viewer phrase */ 'road-cover-back': '{a} checks whether their story about {topic} still holds up.',
    'road-walk-test': '{other} uses the walk to test {topic}.',
    'suspicion-third': '{a} raises a concern about {topic}.',
    'testing-probe': '{other} checks what {topic} has said and done.',
    /* viewer phrase */ 'cover-deflect': '{a} tries to redirect suspicion toward {topic}.',
    /* viewer phrase */ 'cover-blend': '{a} uses the grief around {topic} to appear Faithful.',
    /* viewer phrase */ 'cover-account': '{a} reviews their story about {topic}.',
    /* viewer phrase */ 'cover-weight': '{a} considers how to keep hiding {topic}.',
    'grief-loss': '{a} is still reacting to the loss of {topic}.',
    'grief-vigil': '{a} cannot stop thinking about {topic}.',
    'romance-bond': '{other} and {topic} confront what is happening between them.',
    'romance-suspicion': '{other} questions whether {topic} can be trusted.',
    'callback-history': '{a} brings up their previous-season history with {topic}.',
    'callback-warning': '{a} shares what earlier seasons taught them about {topic}.',
    'callback-envy': '{a} asks what the others know about {topic} from previous seasons.',
    'after-wrong': '{a} reconsiders the vote that banished {topic}.',
    'after-right': '{a} reconsiders the evidence that exposed {topic} as a Traitor.',
    'seat-loss': '{a} reacts to the empty place left by {topic}.',
    'secret-confidence': '{a} tells {b} a private suspicion about {topic}.',
    'confrontation': '{a} takes it straight to {topic}, in front of the room.',
    'confrontation-pileon': '{a} and the room round on {topic} at once.',
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
    'For {names}, that is where it ends, and it ends without anybody having to be told it has.',
    'For {names}, the conversation ends here. Neither plans to raise the subject at the Round Table.',
    'For {names}, it goes no further. Whatever it was going to cost, it has finished costing.',
  ],
  cracked: [
    'For {names}, it does not end quietly: something came out that was not meant to, and it is not going back in.',
    'For {names}, that is the end of it, and the end is worse than the middle was. This one gets repeated.',
    'For {names}, it breaks rather than finishes. Whatever was being held together here is not being held together now.',
    'For {names}, it ends loudly enough that it is somebody else’s business by the morning.',
    'For {names}, the end of it is the part that gets repeated, which is the worst way for a thing to end here.',
    'For {names}, it does not close so much as give way, and there is no version where it stays between them.',
  ],
  coupled: [
    'For {names}, that settles it. By tomorrow morning it will not be a private matter.',
    'For {names}, it is not an open question any more, and neither of them is going to pretend that it is.',
    'For {names}, it resolves — and the rest of the castle will work out which way on its own schedule.',
    'For {names}, the question is answered, and the answer is the sort a castle notices without being told.',
    'For {names}, that is decided. What the room does with it is a separate problem and it starts tomorrow.',
    'For {names}, it stops being a thing they are working out and starts being a thing they are.',
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
  buried: 'It gets buried on purpose. Nobody who was there means to raise it at the table.',
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
// ── WIDENED (fix round 1, C1b, third pass) ────────────────────────────
//
// Named explicitly in the review alongside REACT_SINGLE and CONSEQ_SINGLE. The
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
  'Back to {topic} — and none of this started this morning.',
  'It is {topic} once more, and this is older than this morning.',
  'The same subject, {topic}, picked up again from days ago.',
  'The matter of {topic} comes up once more, and not for the first time this week.',
  'This returns to {topic}, which has been running for some days now.',
  'The subject of {topic} comes up again, and this one has been running since earlier in the week.',
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
  'Neither of them comes into this fresh.',
  // NOT "a new argument": this pool is drawn for carried TRUST, ROMANCE and
  // GRIEF scenes as well, and tr-castle-prose has an arm asserting that a
  // shared confidence is never introduced as a row. It caught this line.
  'This started before today, and both of them know it.',
  'They pick the conversation up exactly where they left it, which is not a comfortable place.',
  'The conversation did not finish the first time, and neither of them has let it go.',
  'They had this same conversation before, and it ended the same way.',
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

  const _receipts = (ep.tr && Array.isArray(ep.tr.receipts)) ? ep.tr.receipts : [];
  const _epNum = c.ep != null ? c.ep : (ep.tr && ep.tr.ep) || ep.num || 0;
  for (const s of scenes) {
    s.chips = _chipsFor(_receipts, _epNum + ':' + s.window + ':' + s.eventId,
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
  const loc = _pickUnique(PLACES[s.window] || PLACES.morning, key + '|loc', used,
    'loc|' + s.window);
  const subs = {
    a, b: b || a, loc,
    when: WHEN_SAID[s.window] || 'somewhere in the middle of the day',
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
  };
  // A grounded event drives its own closing consequence off the recorded topic
  // and branch; legacy events keep the generic family/tone pools.
  const topicCfg = (s.topic && TOPIC_CONFIG[s.topicKind]) ? TOPIC_CONFIG[s.topicKind] : null;

  const estPool = mode === 'group' ? ESTABLISH_GROUP
    : mode === 'pair' ? (ESTABLISH_PAIR[s.window] || ESTABLISH_PAIR.morning)
      : mode === 'solo' ? ESTABLISH_SOLO : ESTABLISH_SINGLE;
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
    const leads = subs.topic
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
    return { days: true, text: days.length === 1
      ? `The earlier discussion happened on day ${days[0]}.`
      : `The same concern also surfaced on days ${days.join(', ')}.` };
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
  // THE TURNED TEST GETS ITS OWN FAMILY KEY, for the reason `_reactClass`
  // gives at length: the ordinary `testing` consequence pool says the tester
  // came away with something, and on these five branches the tester is the one
  // who lost the conversation. Checked FIRST, so a branch on the list can
  // never fall through to the pool that would contradict its own reaction card.
  const famKey = TURNED_BRANCHES.has(String(s.branch || '')) ? 'testing-turned'
    : (s.family === 'romance-spark' || s.kind === 'romance-spark') ? 'romance'
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
function _chipsFor(receipts, sceneId, layer, isAudience, watcher) {
  if (layer === 'heard') return [];               // overheard: no private impact
  const mine = receipts.filter(r => r && r.applied && r.sceneId === sceneId);
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
function _sceneCard(s, stream, key) {
  const fam = _fam(s);
  const heard = s.layer === 'heard';
  const carried = !s.opened;
  let body = '<div class="dy-place">' + _esc(s.heading) + '</div>';
  body += _faces(s.participants);
  // THE BEATS, SET APART SO A SCENE PARSES AT A GLANCE. The action reads as
  // narration; a spoken reaction is pulled out in its own hand; the consequence
  // sits below a hairline in its own block; the impact chips close the card.
  // One scrollable card still — the separation is structural, not a click.
  for (const beat of stream) {
    const txt = _esc(beat.say || beat.text);
    if (beat.kind === 'consequence') {
      body += '<div class="dy-outcome"><p class="dy-say dy-say-out">' + txt + '</p>';
      if (!heard && s.closedNow && !(s.topic && TOPIC_CONFIG[s.topicKind])) {
        body += _knotMark(s, beat.mark);
      }
      body += '</div>';
    } else if (beat.kind === 'reaction') {
      body += '<p class="dy-say dy-spoken">' + txt + '</p>';
    } else {
      body += '<p class="dy-say">' + txt + '</p>';
      if (!heard && beat.role === 'recall') body += _stitch(s, beat.tail);
    }
  }
  if (!heard && s.chips && s.chips.length) body += _chipRow(s.chips);
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
  morning: { eyebrow: 'Dawn Into The Morning', title: 'THE CASTLE &middot; MORNING',
    sub: 'The hours before the mission — first light on whatever the night cost, '
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

  const castleBeats = v.scenes.length ? _buildBeats(v) : [];
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
    + ' &middot; ' + (segment ? SEGMENT_META[segment].eyebrow : 'Dawn To Dark') + '</div>'
    + '<h1 class="dy-title">' + (segment ? SEGMENT_META[segment].title : 'THE CASTLE DAY')
    + '</h1>'
    + '<div class="dy-title-rule"><i></i>' + _ic('knot', 36, '#d2a44e') + '<i></i></div>'
    + '<p class="dy-sub">' + (segment ? SEGMENT_META[segment].sub
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
export function castleDayScenes(ep, observer = 'audience') {
  const v = _view(ep, observer);
  if (!v) return [];
  const key = 'dy|' + v.ep;
  const used = new Set();
  return v.scenes.map((raw, i) =>
    _composeScene({ ...raw, epNum: v.ep }, key + '|' + i + '|' + raw.eventId, used, v.cast));
}

/**
 * THE IMPACT CHIPS PER SCENE, for the observer given — the machine-readable
 * form of the "What it moved" row. Exposed so a guard can assert the
 * observer-gating (a player never sees another player's private read) at the
 * data level rather than by scraping markup.
 */
export function castleDayChips(ep, observer = 'audience') {
  const v = _view(ep, observer);
  if (!v) return [];
  return v.scenes.map(s => ({ eventId: s.eventId, window: s.window,
    layer: s.layer, chips: (s.chips || []).map(c => ({ ...c })) }));
}

