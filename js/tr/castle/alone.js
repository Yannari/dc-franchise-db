// ══════════════════════════════════════════════════════════════════════
// tr/castle/alone.js — the scenes one person has
// ══════════════════════════════════════════════════════════════════════
//
// MEASURED, AND IT IS WHERE THE REPETITION ACTUALLY LIVES. Firings per season
// over 40 seasons, the ten busiest branches in the pool:
//
//     2.4  mission-a-body-short:on-their-own
//     2.3  trust-confide-fear:nearly-said-it
//     2.1  grief-toast-to-them:poured-two
//     1.9  susp-overheard-conversation:saw-it-alone
//     1.8  mission-a-name-by-the-time-were-back:alone
//     1.8  susp-alliance-shape-guess:drew-it-alone
//     1.6  night-the-seat-they-had:on-their-own
//     1.6  after-somebody-goes-tonight:alone-with-it
//     1.5  after-the-room-got-it-wrong:alone-with-it
//     1.5  mission-what-cost-us:alone
//
// SEVEN OF THE TEN ARE SOLO BRANCHES. `_sceneActors` convenes ONE person about
// 40% of the time and only a handful of events carry a solo branch, so that
// handful absorbs nearly every solo draw in the season. Those are the lines a
// viewer sees twice.
//
// So these are SOLO-ONLY events: they take exactly one actor and decline a
// pair. That is deliberate targeting rather than a limitation — a pair-capable
// event competes in a bracket that already has thirty entrants, while the solo
// bracket has about eight.
//
// ── AND THREE RULES LEARNED THE EXPENSIVE WAY ────────────────────────
//
// An earlier batch of five events for `evening` was written and reverted. It
// took the repetition ceiling from 3.9% to 7.0%. What it got wrong:
//
//   1. POOLS OF EIGHT. A branch that fires twice a season needs far more than
//      eight lines before a viewer stops recognising them. These carry TWENTY
//      — twelve left the pool-health floor at 0.1333 against a 0.13 band and
//      sixteen left it at exactly 0.130, which is the same measurement saying
//      the same thing more quietly each time. Twenty clears it.
//   2. CONTINUING THREADS. Every `arcContinue` draws a recall card from the
//      composer's own small recall pools, so thread-continuing events multiply
//      repetition somewhere the event cannot see. These OPEN arcs.
//   3. WEIGHTS AT PARITY WITH GATED EVENTS. An ungated event weighted like a
//      gated one becomes the window's most common scene. These sit low.
import { gs } from '../../core.js';
import { pStats, pronouns } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi } from './effects.js';
import { peopleLost, potNow } from '../state.js';

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
/**
 * SOLO SCENES NEED PRONOUNS AND THE PAIR-SHAPED LIBRARY NEVER DID. Every other
 * file in this directory alternates {a} and {b}, so a name does not repeat
 * inside one sentence and a name-only substitution reads fine. A ONE-ACTOR
 * scene has only {a}, and the same substitution printed
 *
 *     "Chris McLean came back knowing what Chris McLean was going to write,
 *      days before Chris McLean has to write it."
 *
 * and, worse, "{a}self" as "Beardoself". So {a} is the name, used once, and
 * {sub}/{Sub}/{obj}/{posAdj}/{pos}/{ref} are that person's pronouns for every
 * reference after it. `pronouns()` has no `Pos` — see the project rules.
 */
const fill = (s, a) => {
  const p = pronouns(a);
  return String(s).replace(/\{a\}/g, a)
    .replace(/\{Sub\}/g, p.Sub).replace(/\{sub\}/g, p.sub)
    .replace(/\{obj\}/g, p.obj).replace(/\{posAdj\}/g, p.posAdj)
    .replace(/\{pos\}/g, p.pos).replace(/\{ref\}/g, p.ref);
};

// ── AND THEN THEY SAY IT TO CAMERA ────────────────────────────────────
//
// A solo scene used to be one sentence of narration about somebody alone,
// and a sentence about a person thinking is the easiest place in the library
// to write a riddle. The show's own answer to "somebody alone with a thought"
// is the confessional, so every branch here closes on one: the narration says
// what they are doing, and they say what they think, in their own register
// and — for a Traitor — with a Traitor's knowledge. Banks live in
// js/tr/speech-bank-solo.js; js/tr/speech.js fills the slot.
const CAM = {
  WALK_BACK_LINES: { 'went-over-it': 'replay-mission', 'noticed-the-quiet': 'left-out',
    'let-it-go': 'switch-off', 'worked-out-a-move': 'plan' },
  BEFORE_TABLE_LINES: { 'decided-early': 'have-a-name', 'still-deciding': 'undecided',
    'dreading-it': 'dread-table', 'not-worried-tonight': 'safe-tonight' },
  AFTER_RESULT_LINES: { 'was-right': 'was-right', 'was-wrong': 'was-wrong',
    'counting-the-cost': 'vote-cost', 'voted-against-the-room': 'odd-vote' },
  FIRST_DOWN_LINES: { 'had-the-room': 'switch-off', 'counted-them-in': 'watching',
    'nobody-came': 'left-out', 'wished-they-had-waited': 'too-visible' },
  DAYLIGHT_LINES: { 'looked-at-it-properly': 'the-place', 'the-empty-rooms': 'empty-rooms',
    'got-on-with-it': 'switch-off', 'wanted-to-go-home': 'homesick' },
  COLUMN_PLACE_LINES: { 'took-the-back': 'watching', 'took-the-front': 'front',
    'went-where-put': 'switch-off', 'walked-off-the-path': 'alone-choice' },
  STAIRS_AFTER_LINES: { 'straight-up': 'after-table', 'stayed-down': 'after-table',
    'said-nothing-going-up': 'after-table', 'went-up-with-a-decision': 'plan' },
  LAST_LIGHT_LINES: { 'could-not-sleep': 'cant-sleep', 'slept-fine': 'slept-fine',
    'went-over-tomorrow': 'plan', 'counted-the-doors': 'heard-doors' },
  CHAIR_ALONE_LINES: { 'sat-somewhere-else': 'empty-chair', 'kept-the-place': 'empty-chair',
    'did-not-notice': 'empty-chair', 'took-the-chair': 'empty-chair' },
  SAID_NOTHING_LINES: { 'holding-it': 'holding-info', 'not-sure-it-counts': 'unsure-info',
    'let-it-go': 'drop-it', 'decided-who-to-tell': 'who-to-tell' },
  CAME_BACK_LINES: { 'brought-it-home': 'mission-angry', 'shook-it-off': 'switch-off',
    'watched-them-come-in': 'watching', 'came-back-decided': 'have-a-name' },
  KEEPING_TRACK_LINES: { 'wrote-it-down': 'notes', 'went-through-it-again': 'replay-week',
    'gave-up-tracking': 'gut', 'checked-their-own-record': 'own-record' },
  RECOUNT_LINES: { 'read-the-ballots': 'ballots', 'one-vote-bothering-them': 'one-vote',
    'stopped-counting': 'gut', 'counted-who-did-not-look': 'watching' },
  REHEARSING_LINES: { 'practised-it': 'rehearse', 'decided-to-say-nothing': 'stay-quiet',
    'no-plan-at-all': 'undecided', 'decided-to-go-first': 'go-first' },
  OWN_REASON_LINES: { 'why-they-came': 'why-here', 'what-it-has-cost': 'cost',
    'not-thinking-about-it': 'switch-off', 'did-the-arithmetic': 'money' },
  GLAD_OF_AIR_LINES: { 'glad-to-be-out': 'fresh-air', 'dreading-the-mission': 'dread-mission',
    'already-working': 'plan', 'walked-it-like-a-race': 'up-for-it' },
  AWAKE_WITH_IT_LINES: { 'certain-of-someone': 'certain', 'afraid-of-the-morning': 'dread-table',
    'slept-fine': 'slept-fine', 'changed-their-mind': 'changed-mind' },
  WALKED_LAST_LINES: { 'deliberately-behind': 'alone-choice', 'could-not-keep-up': 'knackered',
    'took-the-long-way': 'alone-choice', 'set-the-pace': 'front' },
  HOW_THEYRE_TREATED_LINES: { 'people-are-warmer': 'too-nice', 'people-are-cooler': 'frozen-out',
    'nothing-changed': 'invisible', 'being-managed': 'too-nice' },
  EMPTY_CASTLE_LINES: { 'thought-about-the-room': 'room-worry', 'left-it-arranged': 'trap',
    'worked-out-who-could-double-back': 'double-back', 'did-not-think-about-it': 'switch-off' },
  CARRIED_NAME_LINES: { 'walked-out-decided': 'have-a-name', 'changed-it-on-the-road': 'changed-mind',
    'walked-out-with-nothing': 'undecided', 'let-the-day-decide': 'wait-and-see' },
  MORNINGS_LINES: { 'counted-the-mornings': 'few-left', 'stopped-counting': 'few-left',
    'thought-about-the-last-one': 'the-end', 'took-the-morning-as-it-came': 'switch-off' },
  OPEN_ROAD_LINES: { 'managed-the-face': 'watched', 'stopped-managing-it': 'switch-off',
    'overdid-the-ease': 'overdid', 'never-thought-about-it': 'switch-off' },
};
function _confess(pool, branch, line, a) {
  const p = CAM[pool] && CAM[pool][branch];
  return p ? `${line}\n${a} (to camera): {cam:${p}}` : line;
}

/** One actor, and only one. The whole point of this file. */
const soloOnly = ctx => (ctx.actors?.length === 1 ? ctx.actors[0] : null);

// ── 1. the walk back, on your own ─────────────────────────────────────

const WALK_BACK_LINES = {
  'went-over-it': [
    '{a} walks back from the mission on {posAdj} own, going over the afternoon.',
    '{a} spends the whole walk home replaying one moment from the mission.',
    '{a} lets the others get ahead and walks back slowly, thinking.',
    'On the road home {a} goes back over who did what this afternoon.',
    '{a} is quiet on the way back. {Sub} is still at the mission in {posAdj} head.',
    '{a} walks back alone and works through the afternoon step by step.',
    '{a} keeps stopping to look back down the road, still thinking about the mission.',
    'Nobody walks with {a} on the way home, and {sub} uses the time.',
  ],
  'noticed-the-quiet': [
    'Nobody falls in beside {a} on the walk home.',
    '{a} walks back on {posAdj} own, and notices nobody has waited.',
    '{a} says something to the group ahead and gets a polite nothing back.',
    'Two groups pass {a} on the road and neither of them slows down.',
    '{a} arrives back at the drive a long way behind everybody else.',
    '{a} walks the whole way home without anybody speaking to {obj}.',
    '{a} tries to catch up with the others, then gives up and walks alone.',
  ],
  'let-it-go': [
    '{a} walks home looking at the hills and not thinking about the game at all.',
    '{a} decides the afternoon is over and leaves it on the road.',
    'By the halfway point {a} has stopped thinking about the mission.',
    '{a} comes back through the gate in a better mood than {sub} left in.',
    '{a} walks back slowly and enjoys the quiet.',
    '{a} counts birds on the way home. Genuinely.',
    '{a} takes the walk home as an hour off from the game.',
  ],
  'worked-out-a-move': [
    '{a} spends the road home working out a plan for tomorrow.',
    'By the time the castle is in sight, {a} knows exactly who {sub} needs to talk to.',
    '{a} walks back alone, deciding who to approach first and what to say.',
    '{a} uses the long walk home to plan the evening.',
    '{a} arrives back with a plan {sub} did not have when {sub} set off.',
    '{a} spends the road choosing between two names, and chooses.',
    'On the way back {a} works out which conversation needs to happen before the Round Table.',
  ],
};

registerEvent({
  id: 'trust-the-walk-back-alone',
  family: 'trust',
  window: 'journey-back',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'strategic', 'social', 'intuition', 'mental'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    // `journey-back` carries three of the pool's ten busiest branches and all
    // three of them are solo. This competes for exactly those draws.
    return soloOnly(ctx) ? 1.6 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-walk-back-alone');
    const a = ctx.actors[0];
    const st = pStats(a);
    // Is anybody actually close to them? Read off the bond graph rather than
    // rolled — walking back alone means something different to somebody who
    // has friends in the castle than to somebody who does not.
    const friends = (ctx.living || []).filter(n => n !== a && getBond(a, n) > 1).length;
    const scores = {
      'went-over-it': (st.strategic / 10) * 0.45 + (st.intuition / 10) * 0.3,
      'noticed-the-quiet': friends === 0 ? 0.9 : friends === 1 ? 0.45 : 0.15,
      'let-it-go': (st.temperament / 10) * 0.5,
      'worked-out-a-move': (st.mental / 10) * 0.35 + (st.boldness / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'went-over-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'worked-out-a-move' ? 'used the road home to build a plan'
      : branch === 'noticed-the-quiet' ? 'walked back with nobody beside them'
      : branch === 'let-it-go' ? 'put the afternoon down on the road back'
        : 'went over the afternoon the whole way back';
    const line = _confess('WALK_BACK_LINES', branch, fill(pick(rng, WALK_BACK_LINES[branch]), a), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── 2. the hour before the table ──────────────────────────────────────

const BEFORE_TABLE_LINES = {
  'decided-early': [
    '{a} has had a name since the afternoon, and sits through the evening without changing it.',
    '{a} knows exactly who {sub} is writing down, hours before anybody sits down.',
    '{a} spends the hour before the table listening to arguments {sub} has already dismissed.',
    'Somebody asks {a} who {sub} is thinking of. {Sub} says {sub} is still deciding. {Sub} is not.',
    '{a} settled on a name before dinner, and nothing tonight is going to move it.',
    '{a} goes to the Round Table to confirm a decision, not to make one.',
    '{a} has a name in {posAdj} head before the plates are cleared.',
    '{a} sits in the hall calmly while everyone else argues about who to vote for.',
  ],
  'still-deciding': [
    '{a} has two names and an hour to choose between them.',
    '{a} goes down to the Round Table still not knowing what to write.',
    '{a} changes {posAdj} mind twice before the doors even open.',
    '{a} asks two people what they think and comes away more confused.',
    '{a} is still arguing with {ref} on the stairs.',
    '{a} keeps waiting for something to make it obvious, and nothing does.',
    '{a} paces the landing, trying to settle on a name.',
    'The hour runs out before {a} has made up {posAdj} mind.',
  ],
  'dreading-it': [
    '{a} spends the hour before the Round Table dreading it.',
    '{a} can’t eat dinner. {Sub} just moves it round the plate.',
    '{a} sits on the stairs for a while rather than go into the hall.',
    '{a} washes up twice rather than go down early.',
    '{a} watches the hall fill up from the doorway, wishing it would fill slower.',
    '{a} is ready an hour early and hates every minute of the wait.',
    '{a} stands outside in the cold rather than wait in the hall.',
    'Somebody leaves tonight, and {a} can’t stop thinking about it.',
  ],
  'not-worried-tonight': [
    '{a} doesn’t expect to hear {posAdj} own name tonight, and it shows.',
    '{a} eats a full dinner before the table, taking {posAdj} time.',
    '{a} spends the hour before the table chatting about anything but the vote.',
    '{a} is relaxed tonight, which in this castle is either confidence or a mistake.',
    '{a} hasn’t been named all week and is starting to expect that to hold.',
    '{a} watches everybody else get nervous and feels strangely calm.',
    '{a} goes down to the Round Table like it’s any other evening.',
  ],
};

registerEvent({
  id: 'grief-the-hour-before-the-table',
  family: 'grief',
  window: 'evening',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['strategic', 'temperament', 'boldness', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    // `evening` is the largest budget in the day and a solo draw there faces
    // 0.51 eligible events against 8.49 for a pair — the worst gap in the pool.
    return soloOnly(ctx) ? 1.6 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-hour-before-the-table');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'decided-early': (st.strategic / 10) * 0.45 + (st.boldness / 10) * 0.25,
      'still-deciding': (1 - st.strategic / 10) * 0.4 + 0.2,
      'dreading-it': (1 - st.temperament / 10) * 0.45 + (st.loyalty / 10) * 0.2,
      'not-worried-tonight': (st.temperament / 10) * 0.3 + (st.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'still-deciding';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'not-worried-tonight' ? 'spent the hour before the table entirely unworried'
      : branch === 'decided-early' ? 'had the name settled hours before the table'
      : branch === 'dreading-it' ? 'spent the hour before the table dreading it'
        : 'went down to the table still undecided';
    const line = _confess('BEFORE_TABLE_LINES', branch, fill(pick(rng, BEFORE_TABLE_LINES[branch]), a), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── 3. what one person does with the result ───────────────────────────

const AFTER_RESULT_LINES = {
  'was-right': [
    '{a} called it. The banished player was a Traitor, and {a} had said so days ago, to nobody.',
    '{a} keeps a straight face through the reveal, but {sub} was right.',
    '{a} had that name days ago. Now the reveal has proved it.',
    '{a} watches the reveal go the way {sub} said it would.',
    '{a} goes up to bed knowing {sub} got one right.',
    '{a} checks {posAdj} reasoning again, to make sure it wasn’t just luck.',
  ],
  'was-wrong': [
    '{a} pushed that name hard, and the name came back Faithful.',
    '{a} got it wrong at the table tonight, in front of everybody.',
    '{a} lies awake taking {posAdj} theory apart.',
    '{a} said that name out loud to two people, and both of them will remember.',
    '{a} goes back over it twice and still can’t see where {sub} went wrong.',
    'The reveal went the other way, and {a} has to start again.',
  ],
  'counting-the-cost': [
    '{a} voted the right way tonight, and still feels awful about it.',
    '{a} sits up late thinking about the person who just left.',
    '{a} wrote that name for good reasons, and keeps going back over them.',
    'The room is one person smaller, and {a} helped make it so.',
    '{a} got the result {sub} wanted and didn’t enjoy a minute of it.',
    '{a} liked the person who went tonight. {Sub} voted for them anyway.',
  ],
  'voted-against-the-room': [
    '{a} wrote a different name from almost everybody else tonight.',
    'The room went one way. {a} went the other, in front of everyone.',
    '{a} is the only person who will have to explain {posAdj} vote tomorrow.',
    '{a} broke from the rest of the table tonight, and everybody saw.',
    '{a} walks up to bed wondering whether that was brave or stupid.',
    '{a} would write the same name again. {Sub} just wishes {sub} hadn’t been alone.',
  ],
};

registerEvent({
  id: 'susp-what-one-person-does-with-it',
  family: 'suspicion',
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['intuition', 'temperament', 'loyalty', 'strategic', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    // `after-table` spends the least of its budget of any window and two of the
    // pool's busiest branches are its solo ones.
    if (!soloOnly(ctx)) return 0;
    // There has to have been a result to sit with.
    return peopleLost(gs) >= 1 ? 1.6 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-what-one-person-does-with-it');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'was-right': (st.intuition / 10) * 0.5 + (st.strategic / 10) * 0.2,
      'was-wrong': (1 - st.intuition / 10) * 0.45 + 0.15,
      'counting-the-cost': (st.loyalty / 10) * 0.4 + (1 - st.temperament / 10) * 0.25,
      'voted-against-the-room': (st.boldness / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'was-wrong';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'voted-against-the-room' ? 'wrote a name nobody else wrote'
      : branch === 'was-right' ? 'was right about a name and said nothing'
      : branch === 'was-wrong' ? 'was wrong about a name in front of everybody'
        : 'counted what the vote had cost';
    const line = _confess('AFTER_RESULT_LINES', branch, fill(pick(rng, AFTER_RESULT_LINES[branch]), a), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ══════════════════════════════════════════════════════════════════════
// SIXTEEN MORE, ACROSS EVERY WINDOW THE DAY HAS
// ══════════════════════════════════════════════════════════════════════
//
// The three above proved the shape works: solo-only, deep pools, arcs OPENED
// rather than continued, weights below the gated events. The repetition
// ceiling took them without moving.
//
// These sixteen take that across the whole day. Every window gets solo cover,
// because `_sceneActors` convenes one person about 40% of the time everywhere
// and the solo bracket was eight events wide against the pair bracket's
// thirty.
//
// POOLS OF TWELVE HERE RATHER THAN TWENTY, and that is arithmetic rather than
// a lowered standard: nineteen solo events share the draws that eight used to,
// so each fires roughly a third as often as the first three did. Depth is
// only worth what the firing rate demands of it.

// ── dawn: the first one down, and who followed ────────────────────────

const FIRST_DOWN_LINES = {
  'had-the-room': [
    '{a} is down before anyone else and has the hall to {ref} for ten minutes.',
    '{a} sits in the empty hall with a cup of tea and enjoys the quiet.',
    '{a} comes down first and listens to the castle wake up.',
    '{a} gets the breakfast table to {ref} for once.',
    '{a} is up early and makes the most of the quiet.',
    '{a} gets to the hall first and sits by the window.',
  ],
  'counted-them-in': [
    '{a} sits by the door with a tea and says good morning to everyone who comes in.\n{a} (to camera): {cam:watching}',
    '{a} watches who looks tired and who looks fine.\n{a} (to camera): {cam:watching}',
    '{a} notices who comes down in pairs.\n{a} (to camera): "Who comes down with who first thing in the morning? That’s who trusts who."',
    '{a} keeps an eye on the stairs all breakfast.\n{a} (to camera): {cam:watching}',
    '{a} is down first and watches every single person come down after.',
    '{a} sits at the end of the table and watches the door.',
    '{a} notes the order people come down in.',
    '{a} watches everybody’s first face of the day as they walk in.',
    '{a} is first down and keeps an eye on who looks like they’ve slept.',
    '{a} watches who comes down together and who comes down alone.',
    '{a} is at the table early, watching the stairs.',
    '{a} counts everyone in, one at a time.',
  ],
  'nobody-came': [
    '{a} is down first and sits there on {posAdj} own for a long time.',
    '{a} waits in the empty hall for twenty minutes before anyone else appears.',
    '{a} starts to wonder where everybody is.',
    '{a} sits alone at the breakfast table, and it stops feeling peaceful.',
    '{a} is the only one down for longer than feels normal.',
    '{a} checks the time twice before anyone else comes in.',
  ],
  'wished-they-had-waited': [
    '{a} comes down first and immediately wishes {sub} hadn’t.',
    '{a} is first down, and now everybody who comes in is looking at {obj}.',
    '{a} comes down early and has nowhere to put {ref} for ten minutes.',
    '{a} realises being first means being watched by everyone after.',
    '{a} sits at the empty table feeling far too visible.',
    '{a} comes down first, looking far too awake for someone with nothing on their mind.',
  ],
};

registerEvent({
  id: 'trust-first-one-down',
  family: 'trust',
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'intuition', 'social', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-first-one-down');
    const a = ctx.actors[0];
    const st = pStats(a);
    const friends = (ctx.living || []).filter(n => n !== a && getBond(a, n) > 1).length;
    const scores = {
      'had-the-room': (st.temperament / 10) * 0.5,
      'counted-them-in': (st.intuition / 10) * 0.5 + 0.1,
      'nobody-came': friends === 0 ? 0.8 : friends === 1 ? 0.35 : 0.1,
      'wished-they-had-waited': (1 - st.boldness / 10) * 0.3 + (1 - st.social / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'had-the-room';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'wished-they-had-waited' ? 'was first down and wished they had not been'
      : branch === 'counted-them-in' ? 'watched the whole castle come down'
      : branch === 'nobody-came' ? 'sat down first and stayed on their own'
        : 'had the hall to themselves for an hour';
    const line = _confess('FIRST_DOWN_LINES', branch, fill(pick(rng, FIRST_DOWN_LINES[branch]), a), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── morning: the castle in daylight ───────────────────────────────────

const DAYLIGHT_LINES = {
  'looked-at-it-properly': [
    '{a} walks the length of the hall in daylight and actually looks at it.',
    '{a} stands at a window for a while, taking in the view.',
    '{a} notices, for the first time in days, how beautiful the castle is.',
    '{a} takes a proper look round the grounds this morning.',
    '{a} stops on the stairs and looks at the paintings.',
    '{a} sits on the front steps in the morning sun.',
  ],
  'the-empty-rooms': [
    '{a} opens the wrong door and finds an empty, made bed.\n{a} (to camera): {cam:empty-rooms}',
    '{a} notices a coat still on a hook that belongs to someone who’s gone.\n{a} (to camera): {cam:empty-rooms}',
    '{a} walks down a corridor that was noisy on the first night.\n{a} (to camera): {cam:empty-rooms}',
    '{a} finds someone’s name tag still on a door.\n{a} (to camera): {cam:empty-rooms}',
    '{a} walks past a bedroom that nobody sleeps in any more.',
    '{a} notices how many beds are empty now.',
    '{a} passes a door that used to be somebody’s, and doesn’t look in.',
    '{a} walks down the corridor and counts the empty rooms.',
    '{a} looks into a room with nobody’s things in it any more.',
    '{a} stops outside the room of somebody who has gone.',
    '{a} notices the castle feels bigger than it did on the first day.',
    '{a} walks through a quiet wing of the castle that used to be busy.',
  ],
  'got-on-with-it': [
    '{a} makes the bed, has a shower, and gets on with the day.',
    '{a} does the ordinary things in order and feels better for it.',
    '{a} gets up, gets dressed and gets on with it.',
    '{a} keeps busy all morning, on purpose.',
    '{a} helps with breakfast and doesn’t think about the game.',
    '{a} tidies the kitchen, just to have something to do.',
    '{a} decides the best thing to do today is get on with it.',
  ],
  'wanted-to-go-home': [
    '{a} looks at the castle this morning and wants to go home.',
    '{a} thinks about home and then has to stop thinking about it.',
    '{a} is homesick this morning, and it catches {obj} off guard.',
    '{a} stands at the gate for a minute longer than {sub} needs to.',
    '{a} wakes up and, for a second, forgets where {sub} is.',
    '{a} is tired of this place today.',
  ],
};

registerEvent({
  id: 'grief-the-castle-in-daylight',
  family: 'grief',
  window: 'morning',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'loyalty', 'social'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-castle-in-daylight');
    const a = ctx.actors[0];
    const st = pStats(a);
    const lost = peopleLost(gs);
    const scores = {
      'looked-at-it-properly': (st.temperament / 10) * 0.45,
      'the-empty-rooms': Math.min(0.9, lost * 0.18) + (st.loyalty / 10) * 0.2,
      'got-on-with-it': (1 - st.social / 10) * 0.3 + 0.3,
      'wanted-to-go-home': (1 - st.temperament / 10) * 0.3 + Math.min(0.25, lost * 0.05),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'got-on-with-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'wanted-to-go-home' ? 'looked at the building and wanted to leave it'
      : branch === 'the-empty-rooms' ? 'noticed how much of the castle is empty now'
      : branch === 'looked-at-it-properly' ? 'looked at the building rather than the game'
        : 'kept busy through the morning on purpose';
    const line = _confess('DAYLIGHT_LINES', branch, fill(pick(rng, DAYLIGHT_LINES[branch]), a), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-out: where in the column, and why ─────────────────────────

const COLUMN_PLACE_LINES = {
  'took-the-back': [
    '{a} lets the whole group go ahead and walks at the back, watching.',
    '{a} drops to the back of the line early and stays there.',
    '{a} walks at the back, where {sub} can see everyone.',
    '{a} hangs back so {sub} can watch who walks with who.',
    '{a} takes the back of the column on the way out.',
    '{a} walks behind everybody and watches the groups form.',
  ],
  'took-the-front': [
    '{a} sets off at the front and sets the pace.',
    '{a} walks out ahead of the group and doesn’t look back.',
    '{a} leads the way to the mission.',
    '{a} is out in front the whole way.',
    '{a} walks at the front, away from everyone else.',
    '{a} marches out of the gate first.',
  ],
  'went-where-put': [
    '{a} ends up in the middle of the group and stays there.',
    '{a} walks out with whoever happens to be next to {obj} at the gate.',
    '{a} doesn’t think about where to walk. {Sub} just walks.',
    '{a} drifts along in the middle of the pack.',
    '{a} falls in with the group and chats about nothing.',
    '{a} keeps pace with whoever’s nearest.',
  ],
  'walked-off-the-path': [
    '{a} walks across the field next to the track, away from everyone.',
    '{a} leaves the path and walks on {posAdj} own, twenty yards out.',
    '{a} takes {posAdj} own route to the mission.',
    '{a} walks parallel to the group but nowhere near it.',
    '{a} wanders off the track and makes {posAdj} own way there.',
    '{a} splits from the group and walks alone.',
  ],
};

registerEvent({
  id: 'susp-where-in-the-column',
  family: 'suspicion',
  window: 'journey-out',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'boldness', 'social'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return (ctx.living || []).length >= 5 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-where-in-the-column');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'took-the-back': (st.intuition / 10) * 0.45 + (st.strategic / 10) * 0.25,
      'took-the-front': (st.boldness / 10) * 0.4 + (1 - st.social / 10) * 0.2,
      'went-where-put': (1 - st.strategic / 10) * 0.35 + 0.2,
      'walked-off-the-path': (1 - st.social / 10) * 0.3 + (st.boldness / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'went-where-put';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'walked-off-the-path' ? 'left the column and walked the field alongside it'
      : branch === 'took-the-back' ? 'walked at the back where the whole column was visible'
      : branch === 'took-the-front' ? 'walked out at the front, ahead of being asked anything'
        : 'walked wherever the column put them';
    const line = _confess('COLUMN_PLACE_LINES', branch, fill(pick(rng, COLUMN_PLACE_LINES[branch]), a), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── after-table: the stairs, afterwards ───────────────────────────────

const STAIRS_AFTER_LINES = {
  'straight-up': [
    '{a} goes straight up to bed after the Round Table without talking to anyone.',
    '{a} takes the stairs two at a time and shuts {posAdj} door.',
    '{a} walks past everyone wanting to explain their votes and goes upstairs.',
    '{a} is the first one out of the hall and the first one upstairs.',
    '{a} says a quick goodnight and goes straight to bed.',
    '{a} leaves the hall the second the vote is done.',
  ],
  'stayed-down': [
    '{a} stays in the hall long after most people have gone up.',
    '{a} doesn’t want to be alone yet, so {sub} stays downstairs.',
    '{a} sits by the fire after the Round Table and doesn’t move.',
    '{a} is one of the last ones still downstairs.',
    '{a} stays up, going over the vote in {posAdj} head.',
    '{a} hangs around the hall rather than face the stairs.',
  ],
  'said-nothing-going-up': [
    '{a} goes up the stairs with two others, and nobody says a word.',
    '{a} walks up beside somebody {sub} voted for, and neither mentions it.',
    '{a} climbs the stairs in silence after the vote.',
    '{a} says goodnight to nobody on the way up.',
    'The stairs are crowded after the Round Table, and completely silent. {a} is in the middle of it.',
    '{a} goes up to bed without speaking to anyone.',
  ],
  'went-up-with-a-decision': [
    '{a} goes up the stairs having decided something.',
    '{a} climbs the stairs thinking about the next Round Table, not this one.',
    'By the top of the stairs, {a} knows what {sub} is doing tomorrow.',
    '{a} goes up to bed with a plan.',
    '{a} makes up {posAdj} mind about something on the way up.',
    '{a} stops on the landing, then carries on, decided.',
  ],
};

registerEvent({
  id: 'trust-the-stairs-afterwards',
  family: 'trust',
  window: 'after-table',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'social', 'loyalty', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-stairs-afterwards');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'straight-up': (1 - st.social / 10) * 0.45 + 0.15,
      'stayed-down': (st.social / 10) * 0.4 + (1 - st.temperament / 10) * 0.25,
      'said-nothing-going-up': (st.temperament / 10) * 0.35 + 0.15,
      'went-up-with-a-decision': (st.strategic / 10) * 0.35 + (st.boldness / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'said-nothing-going-up';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'went-up-with-a-decision' ? 'settled tomorrow somewhere on the stairs'
      : branch === 'straight-up' ? 'went straight up rather than stay in the hall'
      : branch === 'stayed-down' ? 'stayed in the hall until it was empty'
        : 'climbed the stairs in silence with the others';
    const line = _confess('STAIRS_AFTER_LINES', branch, fill(pick(rng, STAIRS_AFTER_LINES[branch]), a), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── night: the hours nobody sees ──────────────────────────────────────

const LAST_LIGHT_LINES = {
  'could-not-sleep': [
    '{a} lies awake, listening to every creak in the castle.',
    '{a} gets up twice to check a door that is already locked.',
    '{a} can’t sleep. Every noise sounds like footsteps.',
    '{a} lies in the dark with {posAdj} eyes open.',
    '{a} tosses and turns until the early hours.',
    '{a} listens to the corridor until about three in the morning.',
  ],
  'slept-fine': [
    '{a} goes to bed and is asleep in five minutes.',
    '{a} sleeps straight through the night.',
    '{a} sleeps well, which in this castle is almost a talent.',
    '{a} is out like a light.',
    '{a} sleeps soundly and doesn’t hear a thing.',
    '{a} puts the day down and sleeps right through.',
  ],
  'went-over-tomorrow': [
    '{a} lies in bed planning tomorrow.',
    '{a} works out who to talk to in the morning, and in what order.',
    '{a} lies awake running through what {sub} will say at the next table.',
    '{a} plans the first hour of tomorrow in the dark.',
    '{a} can’t sleep for thinking about tomorrow.',
    '{a} goes over tomorrow three different ways before sleeping.',
  ],
  'counted-the-doors': [
    '{a} lies awake counting how many times a door opens, and where.',
    '{a} hears somebody up at about two in the morning and tries to work out who.',
    '{a} listens to the corridor and hears more than {sub} expected.',
    '{a} hears footsteps on the landing and lies very still.',
    '{a} keeps track of every door that goes in the night.',
    '{a} hears a door close somewhere down the corridor and can’t sleep after that.',
  ],
};

registerEvent({
  id: 'trust-the-last-light',
  family: 'trust',
  window: 'night',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'strategic', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-last-light');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'could-not-sleep': (1 - st.temperament / 10) * 0.55,
      'slept-fine': (st.temperament / 10) * 0.45 + (st.boldness / 10) * 0.15,
      'went-over-tomorrow': (st.strategic / 10) * 0.5,
      'counted-the-doors': (st.intuition / 10) * 0.4,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'could-not-sleep';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'counted-the-doors' ? 'lay awake tracking who moved in the corridor'
      : branch === 'slept-fine' ? 'slept straight through in a castle nobody sleeps in'
      : branch === 'went-over-tomorrow' ? 'spent the night arranging tomorrow'
        : 'lay awake listening to the building';
    const line = _confess('LAST_LIGHT_LINES', branch, fill(pick(rng, LAST_LIGHT_LINES[branch]), a), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── dawn: what the empty chair does to one person ─────────────────────

const CHAIR_ALONE_LINES = {
  'sat-somewhere-else': [
    '{a} sits somewhere different at breakfast this morning.',
    '{a} moves down two places and nobody says anything.',
    '{a} avoids {posAdj} usual seat, next to the empty one.',
    '{a} sits at the other end of the table this morning.',
    '{a} doesn’t want to sit next to the empty chair, so {sub} doesn’t.',
    '{a} picks a new seat, away from the gap.',
  ],
  'kept-the-place': [
    '{a} sits in {posAdj} usual seat, right next to the empty one.',
    '{a} won’t move seats, and makes a point of not moving.',
    'The chair beside {a} stays empty all through breakfast.',
    '{a} sits next to the empty place and leaves it empty.',
    '{a} keeps {posAdj} seat, even though the person next to {obj} has gone.',
    '{a} puts {posAdj} hand on the back of the empty chair for a second before sitting down.',
  ],
  'did-not-notice': [
    '{a} is three mouthfuls in before {sub} notices who’s missing.',
    'It takes {a} a minute to work out what’s different about the table.',
    '{a} notices the empty chair, then notices how long it took to notice.',
    '{a} sits down and only then realises who isn’t there.',
    '{a} is halfway through breakfast before {sub} clocks the gap.',
    '{a} looks up from {posAdj} toast and sees the empty seat.',
  ],
  'took-the-chair': [
    '{a} sits in the empty chair, on purpose, in front of everyone.',
    '{a} pulls out the dead player’s chair, sits in it and asks for the toast.',
    '{a} takes the empty seat without making a thing of it.',
    '{a} sits in the chair nobody else will sit in.',
    '{a} decides somebody has to sit there eventually, and sits there.',
    '{a} takes the seat, and a few people look away.',
  ],
};

registerEvent({
  id: 'grief-the-chair-beside-them',
  family: 'grief',
  window: 'dawn',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'temperament', 'social', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-the-chair-beside-them');
    const a = ctx.actors[0];
    const st = pStats(a);
    const lost = peopleLost(gs);
    const scores = {
      'sat-somewhere-else': (1 - st.temperament / 10) * 0.4 + 0.15,
      'kept-the-place': (st.loyalty / 10) * 0.5,
      // Getting used to it takes a few of them.
      'did-not-notice': Math.min(0.6, Math.max(0, lost - 1) * 0.16) + 0.1,
      'took-the-chair': (st.boldness / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'kept-the-place';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'took-the-chair' ? 'sat down in the empty place on purpose'
      : branch === 'kept-the-place' ? 'sat beside the empty place and would not move'
      : branch === 'did-not-notice' ? 'took too long to notice who was missing'
        : 'moved seats without being able to say why';
    const line = _confess('CHAIR_ALONE_LINES', branch, fill(pick(rng, CHAIR_ALONE_LINES[branch]), a), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── evening: the thing you noticed and said nothing about ─────────────

const SAID_NOTHING_LINES = {
  'holding-it': [
    '{a} saw something at the mission and hasn’t told a single person.',
    '{a} has been sitting on one thing {sub} noticed since this afternoon.',
    '{a} keeps what {sub} saw today to {ref}.',
    '{a} saw something odd today and is keeping quiet about it, for now.',
    '{a} is holding onto something. {Sub} wants to see if it happens again.',
    '{a} hasn’t mentioned what {sub} saw today to anyone.',
    '{a} could say something at dinner, and doesn’t.',
    '{a} saw something this afternoon and is waiting for the right moment.',
  ],
  'not-sure-it-counts': [
    '{a} saw something today and can’t decide whether it meant anything.',
    '{a} keeps replaying something from this afternoon, and it looks less odd every time.',
    '{a} isn’t sure what {sub} saw, so {sub} doesn’t say anything.',
    '{a} thinks {sub} noticed something, but can’t be sure.',
    'It looked strange at the time. Now {a} isn’t so sure.',
    '{a} goes back and forth on whether to mention it.',
  ],
  'let-it-go': [
    '{a} decides it was nothing and lets it go.',
    '{a} saw something odd today and decides not to make it a thing.',
    '{a} lets it go. It was probably nothing.',
    '{a} doesn’t want to be wrong about something small, so {sub} drops it.',
    '{a} puts it out of {posAdj} mind.',
    '{a} decides not to go looking for trouble.',
  ],
  'decided-who-to-tell': [
    '{a} has decided exactly who to tell, and hasn’t told them yet.',
    '{a} nearly says it to the wrong person twice, and stops both times.',
    '{a} spends the evening working out who is safe to tell.',
    '{a} has one person in mind to tell tomorrow.',
    '{a} knows what {sub} saw. The question is who to trust with it.',
    '{a} picks one person to tell, and waits for a quiet moment.',
  ],
};

registerEvent({
  id: 'susp-said-nothing-about-it',
  family: 'suspicion',
  window: 'evening',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'temperament', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-said-nothing-about-it');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'holding-it': (st.strategic / 10) * 0.45 + (1 - st.social / 10) * 0.2,
      'not-sure-it-counts': (1 - st.boldness / 10) * 0.4 + (st.intuition / 10) * 0.2,
      'let-it-go': (st.temperament / 10) * 0.4,
      'decided-who-to-tell': (st.social / 10) * 0.3 + (st.strategic / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'not-sure-it-counts';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'decided-who-to-tell' ? 'chose which single person to tell, and has not told them yet'
      : branch === 'holding-it' ? 'kept an observation to themselves all evening'
      : branch === 'let-it-go' ? 'decided an observation was nothing and dropped it'
        : 'could not decide whether what they saw was anything';
    const line = _confess('SAID_NOTHING_LINES', branch, fill(pick(rng, SAID_NOTHING_LINES[branch]), a), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-back: what one person carries home ────────────────────────

const CAME_BACK_LINES = {
  'brought-it-home': [
    '{a} comes back from the mission still wound up about it.',
    '{a} is still annoyed about the afternoon hours later.',
    '{a} can’t let the mission go, even back at the castle.',
    '{a} brings the afternoon home with {obj}.',
    '{a} storms back through the gate.',
    '{a} is still going over the mission at dinner.',
  ],
  'shook-it-off': [
    '{a} comes back through the gate and leaves the afternoon behind.',
    '{a} comes back from the mission in a good mood.',
    'By the time the castle is in sight, {a} has let the mission go.',
    '{a} shrugs off a bad afternoon on the walk home.',
    '{a} comes in cheerful, which surprises the people who saw the mission.',
    '{a} puts the mission behind {obj} and moves on.',
  ],
  'watched-them-come-in': [
    '{a} gets back first and watches everybody else come in.',
    '{a} sits on the steps and watches who walks back with who.',
    '{a} is through the gate early and turns round to watch the others.',
    '{a} watches the groups come up the drive.',
    '{a} waits by the door and watches everyone come home.',
    '{a} gets back first and notes who arrives together.',
  ],
  'came-back-decided': [
    '{a} went out unsure and comes back with a name.',
    'Something at the mission made {a}’s mind up.',
    '{a} comes back from the mission knowing who {sub}’s voting for.',
    'The afternoon settled it for {a}.',
    '{a} walks back through the gate with {posAdj} mind made up.',
    '{a} saw enough today. {Sub} knows what {sub}’s doing tonight.',
  ],
};

registerEvent({
  id: 'grief-what-came-back-with-them',
  family: 'grief',
  window: 'journey-back',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'intuition', 'loyalty', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-what-came-back-with-them');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'brought-it-home': (1 - st.temperament / 10) * 0.5,
      'shook-it-off': (st.temperament / 10) * 0.45,
      'watched-them-come-in': (st.intuition / 10) * 0.4,
      'came-back-decided': (st.intuition / 10) * 0.3 + (st.boldness / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'shook-it-off';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'came-back-decided' ? 'settled on a name somewhere on the road home'
      : branch === 'brought-it-home' ? 'brought the afternoon back into the castle'
      : branch === 'watched-them-come-in' ? 'stood in the courtyard and watched everybody arrive'
        : 'left the afternoon at the gate';
    const line = _confess('CAME_BACK_LINES', branch, fill(pick(rng, CAME_BACK_LINES[branch]), a), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── morning: keeping a record ─────────────────────────────────────────

const KEEPING_TRACK_LINES = {
  'wrote-it-down': [
    '{a} has started keeping notes, on paper, where nobody can see them.',
    '{a} writes out the week in order, and it looks different on paper.',
    '{a} scribbles down who voted for who, and hides the page.',
    '{a} keeps a list in the back of a book in {posAdj} room.',
    '{a} writes down everything {sub} remembers from yesterday.',
    '{a} has a notebook now. Nobody knows about it.',
  ],
  'went-through-it-again': [
    '{a} goes through the whole week again from the first night.',
    '{a} runs back over every Round Table so far, in order.',
    '{a} goes through the votes again, looking for a pattern.',
    '{a} lies on the bed going over every day since the start.',
    '{a} goes over it all again, looking for what {sub} missed.',
    '{a} replays the week from day one.',
    '{a} goes back through the votes one more time.',
  ],
  'gave-up-tracking': [
    '{a} has stopped trying to keep track of it all.',
    '{a} admits there’s too much now to hold in {posAdj} head.',
    '{a} used to know where everybody had been. {Sub} doesn’t any more.',
    '{a} gives up on the notes and goes with {posAdj} gut.',
    '{a} decides tracking every vote isn’t helping.',
    '{a} lets it go and stops counting.',
  ],
  'checked-their-own-record': [
    '{a} goes back over {posAdj} own week, looking at it the way the others might.',
    '{a} works out how {posAdj} own votes look from the outside.',
    '{a} finds two things {sub} did this week that look bad written down.',
    '{a} checks {posAdj} own record, the way someone suspicious would.',
    '{a} tries to see {ref} the way the room does.',
    '{a} wonders how {posAdj} votes look to everyone else.',
  ],
};

registerEvent({
  id: 'susp-keeping-track-of-it',
  family: 'suspicion',
  window: 'morning',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['mental', 'strategic', 'intuition', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // There has to be a week worth reviewing.
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-keeping-track-of-it');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'wrote-it-down': (st.mental / 10) * 0.45 + (st.strategic / 10) * 0.2,
      'went-through-it-again': (st.intuition / 10) * 0.4 + 0.15,
      'gave-up-tracking': (1 - st.mental / 10) * 0.4 + (1 - st.temperament / 10) * 0.15,
      'checked-their-own-record': (1 - st.boldness / 10) * 0.3 + (st.intuition / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'went-through-it-again';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'checked-their-own-record' ? 'went back over their own week looking for how it reads'
      : branch === 'wrote-it-down' ? 'keeps a written record nobody is meant to see'
      : branch === 'gave-up-tracking' ? 'stopped trying to hold the whole week in one piece'
        : 'went back over the whole week from the first night';
    const line = _confess('KEEPING_TRACK_LINES', branch, fill(pick(rng, KEEPING_TRACK_LINES[branch]), a), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── after-table: the count, gone over again ───────────────────────────

const RECOUNT_LINES = {
  'read-the-ballots': [
    '{a} goes over tonight’s vote, name by name.',
    '{a} can still say who wrote every name tonight.',
    '{a} runs through the ballots again in {posAdj} head.',
    '{a} pays more attention to who voted against the room than who didn’t.',
    '{a} goes through the vote twice before bed.',
    '{a} lists every vote from tonight and who cast it.',
  ],
  'one-vote-bothering-them': [
    'One vote from tonight has been bothering {a} since it was turned over.',
    '{a} can’t make one of tonight’s votes make sense.',
    '{a} keeps coming back to a single name on a single slate.',
    'One vote tonight doesn’t fit, and {a} can’t stop thinking about it.',
    '{a} wants to know why one person wrote the name they wrote.',
    '{a} can’t get past one vote.',
  ],
  'stopped-counting': [
    '{a} doesn’t go over the vote tonight, for the first time.',
    '{a} has gone over the numbers every night and got nowhere. Tonight {sub} doesn’t bother.',
    '{a} gives up on the maths.',
    '{a} lets the vote go and goes to sleep.',
    '{a} decides going over the votes isn’t helping.',
    '{a} stops counting and just thinks about the people.',
  ],
  'counted-who-did-not-look': [
    '{a} didn’t watch the slates tonight. {Sub} watched the faces.',
    '{a} noticed one person who didn’t look up once during the vote.',
    '{a} watched who looked nervous when the names were read.',
    '{a} paid attention to faces, not votes.',
    '{a} noticed who stared at the table the whole time.',
    '{a} watched who looked relieved when the name was read out.',
  ],
};

registerEvent({
  id: 'susp-going-over-the-count',
  family: 'suspicion',
  window: 'after-table',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['mental', 'intuition', 'strategic', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    return peopleLost(gs) >= 1 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-going-over-the-count');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'read-the-ballots': (st.mental / 10) * 0.4 + (st.strategic / 10) * 0.25,
      'one-vote-bothering-them': (st.intuition / 10) * 0.45 + 0.1,
      'stopped-counting': (st.temperament / 10) * 0.3 + (1 - st.mental / 10) * 0.2,
      'counted-who-did-not-look': (st.intuition / 10) * 0.3 + (st.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'read-the-ballots';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'counted-who-did-not-look' ? 'read the faces at the table rather than the slates'
      : branch === 'one-vote-bothering-them' ? 'cannot make one ballot fit'
      : branch === 'stopped-counting' ? 'did not go over the vote at all tonight'
        : 'went through the whole count again afterwards';
    const line = _confess('RECOUNT_LINES', branch, fill(pick(rng, RECOUNT_LINES[branch]), a), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── night: rehearsing tomorrow, alone ─────────────────────────────────

const REHEARSING_LINES = {
  'practised-it': [
    '{a} says tomorrow’s speech out loud to the bedroom wall.',
    '{a} practises what {sub} is going to say at the Round Table.',
    '{a} has a line ready for tomorrow, and says it over and over.',
    '{a} rehearses {posAdj} defence in the bathroom mirror.',
    '{a} runs through what {sub} will say if {posAdj} name comes up.',
    '{a} practises tomorrow’s argument in a whisper.',
  ],
  'decided-to-say-nothing': [
    '{a} has decided to say nothing at all tomorrow.',
    '{a} is going to keep quiet at the next table and let others talk.',
    '{a} plans to sit back tomorrow and watch.',
    '{a} decides the quiet ones last longer.',
    '{a} will let the room do the work tomorrow.',
    '{a} decides silence is the best plan.',
  ],
  'no-plan-at-all': [
    '{a} tries to plan tomorrow and can’t.',
    '{a} has no idea what {sub} is going to say at the next table.',
    '{a} lies there trying to think of a plan, and nothing comes.',
    '{a} needs to know one more thing before {sub} can plan, and {sub} doesn’t.',
    '{a} goes to sleep with no plan at all.',
    '{a} can’t work out what tomorrow looks like.',
  ],
  'decided-to-go-first': [
    '{a} has decided to speak first at the next Round Table.',
    '{a} is going to be the one who starts it tomorrow.',
    '{a} plans to say the first name out loud tomorrow.',
    '{a} decides somebody has to go first, and it will be {obj}.',
    '{a} wants to set the tone tomorrow, so {sub} will open.',
    '{a} knows the first name said shapes the whole table.',
  ],
};

registerEvent({
  id: 'testing-rehearsing-tomorrow',
  family: 'testing',
  window: 'night',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['strategic', 'boldness', 'social', 'mental'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-rehearsing-tomorrow');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'practised-it': (st.social / 10) * 0.35 + (st.strategic / 10) * 0.3,
      'decided-to-say-nothing': (1 - st.boldness / 10) * 0.4 + (st.strategic / 10) * 0.2,
      'no-plan-at-all': (1 - st.mental / 10) * 0.35 + 0.15,
      'decided-to-go-first': (st.boldness / 10) * 0.4,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'no-plan-at-all';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'decided-to-go-first' ? 'decided to be the one who opens the table tomorrow'
      : branch === 'practised-it' ? 'rehearsed tomorrow out loud to an empty room'
      : branch === 'decided-to-say-nothing' ? 'decided to say nothing at all tomorrow'
        : 'could not make a plan for tomorrow hold still';
    const line = _confess('REHEARSING_LINES', branch, fill(pick(rng, REHEARSING_LINES[branch]), a), a);
    const t = api.openArc('testing', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── evening: what the money is for, thought about alone ───────────────

const OWN_REASON_LINES = {
  'why-they-came': [
    '{a} reads a letter from home again.\n{a} (to camera): {cam:why-here}',
    '{a} thinks about what {sub} would buy first with the money.\n{a} (to camera): {cam:why-here}',
    '{a} lies on the bed, thinking about the people back home.\n{a} (to camera): {cam:why-here}',
    '{a} remembers the day {sub} got the call to come here.\n{a} (to camera): {cam:why-here}',
    '{a} sits on the bed and thinks about why {sub} came here.',
    '{a} thinks about the person back home who told {obj} to go for it.',
    '{a} remembers why {sub} applied in the first place.',
    '{a} thinks about what the money would mean at home.',
    '{a} looks at a photo from home and puts it away again.',
    '{a} reminds {ref} why {sub} is doing this.',
    '{a} thinks about home and what {sub} is playing for.',
    '{a} sits quietly for a minute, thinking about family.',
  ],
  'what-it-has-cost': [
    '{a} thinks about what this game has cost {obj} so far.',
    '{a} has lied to people {sub} likes this week, and sits with that.',
    '{a} adds up the week and doesn’t like the total.',
    '{a} has done things in here {sub} would never do at home.',
    '{a} wonders what the people back home will think when they watch.',
    '{a} feels the weight of the week this evening.',
  ],
  'not-thinking-about-it': [
    '{a} has stopped thinking about the money completely.',
    '{a} plays one day at a time and doesn’t think about the prize.',
    '{a} doesn’t care about the pot tonight. {Sub} just wants to get through.',
    '{a} puts the money out of {posAdj} mind.',
    '{a} decides the prize is a problem for later.',
    '{a} isn’t thinking about the end. Just tomorrow.',
  ],
  'did-the-arithmetic': [
    '{a} works out what the pot would be worth split three ways. Then four. Then two.',
    '{a} does the maths on the prize, properly, for the first time.',
    '{a} knows exactly what the pot is worth now, per head.',
    '{a} works out what {sub} would walk away with if it ended tonight.',
    '{a} does the division in {posAdj} head and doesn’t like how it changes things.',
    '{a} does the sums on the prize fund.',
  ],
};

registerEvent({
  id: 'grief-what-it-is-all-for',
  family: 'grief',
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'temperament', 'strategic', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // THROUGH `potNow`, NOT OFF `gs.tr.pot` — see that function in
    // js/tr/state.js. A scene about the prize money needs there to BE prize
    // money, which is correct; reading it directly meant this weight was the
    // one pot reader tests/tr-missions.test.js could not blind, and a scene
    // that exists in one arm and not the other re-rolls every castle draw
    // after it.
    return potNow(gs) > 0 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-what-it-is-all-for');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'why-they-came': (st.loyalty / 10) * 0.35 + 0.2,
      'what-it-has-cost': (st.loyalty / 10) * 0.3 + (1 - st.temperament / 10) * 0.3,
      'not-thinking-about-it': (st.strategic / 10) * 0.3 + (st.temperament / 10) * 0.25,
      'did-the-arithmetic': (st.mental / 10) * 0.3 + (st.strategic / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'why-they-came';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'did-the-arithmetic' ? 'did the division and looked at the number'
      : branch === 'what-it-has-cost' ? 'added up what the week has already cost them'
      : branch === 'not-thinking-about-it' ? 'has stopped thinking about the prize at all'
        : 'remembered exactly why they came here';
    const line = _confess('OWN_REASON_LINES', branch, fill(pick(rng, OWN_REASON_LINES[branch]), a), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-out: the walk as relief ───────────────────────────────────

const GLAD_OF_AIR_LINES = {
  'glad-to-be-out': [
    '{a} walks out through the gate and feels a weight lift.',
    '{a} is just glad to be out of the castle for a bit.',
    '{a} breathes in the fresh air and relaxes for the first time in days.',
    '{a} enjoys being outside the walls.',
    '{a} is in a good mood on the walk out.',
    '{a} finally gets some fresh air.',
  ],
  'dreading-the-mission': [
    '{a} is dreading the mission the whole walk out.',
    '{a} knows {sub} is bad at these and has to do one anyway.',
    '{a} walks slowly, not looking forward to this afternoon at all.',
    '{a} is worried about letting the team down today.',
    '{a} can’t shake the feeling today’s mission will go badly.',
    '{a} walks to the mission like {sub} is walking to an exam.',
  ],
  'already-working': [
    '{a} uses the walk out to plan the afternoon.',
    '{a} knows who {sub} wants to be paired with before the gate shuts.',
    '{a} spends the walk working out where to stand at the mission.',
    '{a} has a list of who to talk to today.',
    '{a} walks out thinking about the game, not the weather.',
    '{a} plans how to use the mission to get close to someone.',
  ],
  'walked-it-like-a-race': [
    '{a} sets off at a pace nobody asked for.',
    '{a} is at the mission before half of them are out of the drive.',
    '{a} can’t wait to get going. This is the bit {sub} is good at.',
    '{a} practically jogs to the mission.',
    '{a} is fired up and marches out ahead.',
    '{a} walks out like it’s a race, and wins it.',
  ],
};

registerEvent({
  id: 'trust-glad-of-the-air',
  family: 'trust',
  window: 'journey-out',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'strategic', 'boldness', 'physical'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-glad-of-the-air');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'glad-to-be-out': (st.temperament / 10) * 0.4 + 0.15,
      'dreading-the-mission': (1 - st.physical / 10) * 0.35 + (1 - st.boldness / 10) * 0.25,
      'already-working': (st.strategic / 10) * 0.5,
      'walked-it-like-a-race': (st.physical / 10) * 0.3 + (st.endurance / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'glad-to-be-out';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'walked-it-like-a-race' ? 'went out hard and let everybody see they could'
      : branch === 'dreading-the-mission' ? 'walked out dreading being watched work'
      : branch === 'already-working' ? 'planned the afternoon on the way to it'
        : 'was simply glad to be outside the walls';
    const line = _confess('GLAD_OF_AIR_LINES', branch, fill(pick(rng, GLAD_OF_AIR_LINES[branch]), a), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── night: lying awake with a name ────────────────────────────────────

const AWAKE_WITH_IT_LINES = {
  'certain-of-someone': [
    '{a} lies in the dark with one name, and no way to prove it until morning.',
    '{a} is sure. Completely sure. {Sub} can’t sleep for it.',
    '{a} is lying awake, certain {sub} knows who one of them is.',
    '{a} goes over it again and gets the same name every time.',
    '{a} has been sure since about nine o’clock.',
    '{a} is too certain to sleep.',
  ],
  'afraid-of-the-morning': [
    '{a} lies awake working out how many people would need to change their minds.',
    '{a} knows tomorrow could be {posAdj} last day.',
    '{a} does the maths on the votes against {obj}, and it’s not good.',
    '{a} lies awake dreading the morning.',
    '{a} can’t sleep, thinking about the next Round Table.',
    '{a} lies in the dark, worried.',
  ],
  'slept-fine': [
    '{a} puts the day down and sleeps straight through.',
    '{a} is asleep by eleven.',
    '{a} doesn’t lose any sleep over it.',
    '{a} sleeps like a baby.',
    '{a} goes out like a light.',
    '{a} sleeps fine, which is more than most can say.',
  ],
  'changed-their-mind': [
    '{a} went to bed sure of one name and wakes up sure of another.',
    '{a} changes {posAdj} mind somewhere in the middle of the night.',
    '{a} can’t say what changed it, only that it’s changed.',
    '{a} wakes up with a completely different name in {posAdj} head.',
    '{a} has a new suspect by morning.',
    '{a} lies awake, and by three o’clock {sub} has changed {posAdj} mind.',
  ],
};

registerEvent({
  id: 'susp-awake-with-a-name',
  family: 'suspicion',
  window: 'night',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['intuition', 'temperament', 'boldness', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-awake-with-a-name');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'certain-of-someone': (st.intuition / 10) * 0.45 + (st.boldness / 10) * 0.15,
      'afraid-of-the-morning': (1 - st.temperament / 10) * 0.45 + (1 - st.boldness / 10) * 0.15,
      'slept-fine': (st.temperament / 10) * 0.45,
      'changed-their-mind': (st.intuition / 10) * 0.25 + (1 - st.loyalty / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'certain-of-someone';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'changed-their-mind' ? 'went to bed sure of one name and woke sure of another'
      : branch === 'afraid-of-the-morning' ? 'lay awake counting the room against them'
      : branch === 'slept-fine' ? 'put the whole day down and slept through it'
        : 'lay awake certain of one name';
    const line = _confess('AWAKE_WITH_IT_LINES', branch, fill(pick(rng, AWAKE_WITH_IT_LINES[branch]), a), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── journey-back: the one who walked home last ────────────────────────

const WALKED_LAST_LINES = {
  'deliberately-behind': [
    '{a} drops to the back of the group on the way home, on purpose.',
    '{a} lets everyone get ahead and walks behind on {posAdj} own.',
    '{a} hangs back, where nobody is talking at {obj}.',
    '{a} walks home at the back, away from everyone.',
    '{a} takes the walk home slowly, alone.',
    '{a} stays behind the group all the way back.',
  ],
  'could-not-keep-up': [
    '{a} can’t keep up with the group on the way home.',
    '{a} falls behind and pretends it’s on purpose.',
    '{a} arrives back out of breath and hopes nobody noticed.',
    '{a} gets left behind after the first mile.',
    '{a} struggles to keep pace with the rest.',
    '{a} is last back, and knackered.',
  ],
  'took-the-long-way': [
    '{a} takes the long way round and comes in by the far gate.',
    '{a} isn’t ready to be back with everyone, so {sub} takes a longer route.',
    '{a} adds ten minutes to the walk home, on purpose.',
    '{a} wanders the grounds before going in.',
    '{a} takes the scenic route back.',
    '{a} goes round the long way to get some time alone.',
  ],
  'set-the-pace': [
    '{a} sets a fast pace home and doesn’t check if anyone is keeping up.',
    '{a} is back through the gate two minutes before anybody else.',
    '{a} marches home at the front.',
    '{a} walks the whole way back at speed.',
    '{a} leads everybody home, fast.',
    '{a} powers back to the castle first.',
  ],
};

registerEvent({
  id: 'trust-the-back-of-the-column',
  family: 'trust',
  window: 'journey-back',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['physical', 'endurance', 'temperament', 'social', 'strategic'],
    relationship: ['neutral'],
  },
  weight(ctx) { return soloOnly(ctx) ? 1.4 : 0; },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'trust-the-back-of-the-column');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'deliberately-behind': (st.strategic / 10) * 0.3 + (1 - st.social / 10) * 0.25,
      'could-not-keep-up': (1 - st.endurance / 10) * 0.4 + (1 - st.physical / 10) * 0.2,
      'took-the-long-way': (st.temperament / 10) * 0.25 + (1 - st.social / 10) * 0.25,
      'set-the-pace': (st.endurance / 10) * 0.3 + (st.physical / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'deliberately-behind';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'set-the-pace' ? 'set the pace the whole way home and never looked back'
      : branch === 'could-not-keep-up' ? 'could not hold the pace on the road home'
      : branch === 'took-the-long-way' ? 'took the long way round rather than go straight in'
        : 'dropped to the back of the column on purpose';
    const line = _confess('WALKED_LAST_LINES', branch, fill(pick(rng, WALKED_LAST_LINES[branch]), a), a);
    const t = api.openArc('trust', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── morning: how the room is holding one person now ───────────────────

const HOW_THEYRE_TREATED_LINES = {
  'people-are-warmer': [
    '{a} notices people are being extra nice this morning.',
    'Three people go out of their way to chat to {a} before ten.',
    '{a} is suddenly popular, and doesn’t trust it.',
    'People keep making {a} cups of tea this morning.',
    'Everyone is being lovely to {a}, and {sub} wonders why.',
    '{a} gets more good mornings than usual.',
  ],
  'people-are-cooler': [
    '{a} walks into breakfast and the room changes slightly.',
    'Two conversations go quiet when {a} sits down.',
    'People aren’t rude to {a}, but they aren’t talking to {obj} either.',
    '{a} feels the room go a bit cold this morning.',
    '{a} notices people choosing seats away from {obj}.',
    'Nobody asks {a} how {sub} slept.',
  ],
  'nothing-changed': [
    'Nobody treats {a} any differently today.',
    '{a} is neither suspected nor asked for advice.',
    '{a} gets through breakfast with nobody paying {obj} much attention.',
    '{a} is nobody’s problem this morning.',
    'The morning is completely normal for {a}.',
    '{a} blends in at breakfast, as usual.',
    'People are exactly as friendly to {a} as they were yesterday.',
  ],
  'being-managed': [
    'People are being very nice to {a}, and {sub} can tell it’s for a reason.',
    '{a} notices someone is working on {obj}.',
    '{a} is being charmed, and knows it.',
    'Somebody keeps checking in on {a}, a bit too often.',
    '{a} spots the flattery for what it is.',
    '{a} is being handled, and is letting it happen.',
  ],
};

registerEvent({
  id: 'grief-how-the-room-holds-them',
  family: 'grief',
  window: 'morning',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['intuition', 'social', 'temperament', 'strategic'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // Needs a week of behaviour for the room to have changed against.
    return peopleLost(gs) >= 2 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-how-the-room-holds-them');
    const a = ctx.actors[0];
    const st = pStats(a);
    // Bonds are the honest measure of how the room actually holds them.
    const others = (gs.activePlayers || []).filter(n => n !== a);
    const warmth = others.length
      ? others.reduce((acc, n) => acc + getBond(a, n), 0) / others.length
      : 0;
    const scores = {
      'people-are-warmer': Math.max(0, warmth) * 0.12 + (st.social / 10) * 0.2,
      'people-are-cooler': Math.max(0, -warmth) * 0.12 + (st.intuition / 10) * 0.2,
      'nothing-changed': 0.35 - Math.min(0.3, Math.abs(warmth) * 0.04),
      'being-managed': (st.intuition / 10) * 0.25 + (st.strategic / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'nothing-changed';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'being-managed' ? 'worked out the warmth in the room is being spent on them, not felt'
      : branch === 'people-are-warmer' ? 'noticed the room being suddenly kinder'
      : branch === 'people-are-cooler' ? 'noticed the room cooling around them'
        : 'noticed that nobody treats them any differently at all';
    const line = _confess('HOW_THEYRE_TREATED_LINES', branch, fill(pick(rng, HOW_THEYRE_TREATED_LINES[branch]), a), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

// ── the road out, on your own: four more, and the measurement that asked
//    for them ────────────────────────────────────────────────────────────
//
// MEASURED OVER 20 SEASONS, mean events ELIGIBLE facing one draw, worst first:
//
//     journey-out  solo   1.33   28.5% barren   <- the worst in the pool
//     evening      solo   2.45   21.7% barren
//     morning      solo   1.96   19.2% barren
//     dawn         solo   2.27   19.2% barren
//     after-table  pair   3.85    4.1% barren
//     journey-back pair   7.09    0.4% barren
//
// A BARREN DRAW IS BUDGET THROWN AWAY. `runWindow` skips it and tries again,
// and three in a row end the window early — so `journey-out` was delivering
// 2.78 scenes an episode out of a phase budgeted 5-8 across two windows, the
// thinnest window in the castle. The cause is not the writing: twenty events
// fire in `journey-out` and exactly TWO of them accept one actor, while the
// composer convenes one person about 40% of the time.
//
// So these are four more solo-only scenes for the road out, and they were
// chosen by that table rather than by a target number of events. The rules at
// the top of this file all still apply — pools of twelve to match the two
// journey-out scenes already here, arcs OPENED rather than continued, weights
// at 1.4 alongside them.
//
// AND FOUR SUBJECTS THE WALK ACTUALLY OFFERS, not four ways of saying the
// road is long. The castle stands EMPTY for the afternoon with everybody's
// things in it; a name decided last night has an hour on the road to survive;
// the column is one person shorter every morning and somebody is counting; and
// an open road is the one place in the castle where there is nothing to stand
// behind while people look at you.

const EMPTY_CASTLE_LINES = {
  'thought-about-the-room': [
    '{a} gets a mile out and remembers {posAdj} bedroom door doesn’t lock.',
    '{a} thinks about everything {sub} left in {posAdj} room.',
    '{a} worries about the castle being empty while they’re all out.',
    '{a} wonders who might go back to the castle while everyone is away.',
    '{a} thinks about what’s in {posAdj} room that someone might see.',
    '{a} can’t stop thinking about the empty castle behind them.',
  ],
  'left-it-arranged': [
    '{a} left {posAdj} door at an angle {sub} would know again.',
    '{a} set a book square on the table before leaving, to see if it moves.',
    '{a} left {posAdj} room arranged so {sub} would notice if anyone went in.',
    '{a} left a little trap in {posAdj} room: a jumper folded a certain way.',
    '{a} put a hair across the drawer before leaving.',
    '{a} set things up in {posAdj} room to catch anyone snooping.',
  ],
  'worked-out-who-could-double-back': [
    '{a} works out how long it would take someone to double back to the castle.',
    '{a} watches who is at the back of the group, in case anyone slips away.',
    '{a} keeps count of who is on the walk, and who isn’t.',
    '{a} works out who could sneak back without being missed.',
    '{a} notices who hung around the gate when the group left.',
    '{a} works out how long the castle is empty for.',
  ],
  'did-not-think-about-it': [
    'It doesn’t occur to {a} once that the castle is empty behind {obj}.',
    '{a} leaves {posAdj} door open and thinks about lunch.',
    '{a} doesn’t give the castle a second thought.',
    '{a} just walks out and doesn’t worry about it.',
    '{a} isn’t worried about anyone going through {posAdj} things.',
    '{a} forgets about the castle the second {sub} is through the gate.',
  ],
};

registerEvent({
  id: 'susp-the-empty-castle',
  family: 'suspicion',
  window: 'journey-out',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['intuition', 'strategic', 'mental', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // A castle with four people left in it is not a building anybody can get
    // lost in for an afternoon, and the whole scene is about the size of the
    // empty space behind you.
    return (ctx.living || []).length >= 6 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'susp-the-empty-castle');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'thought-about-the-room': (st.intuition / 10) * 0.35 + 0.2,
      'left-it-arranged': (st.strategic / 10) * 0.4 + (st.intuition / 10) * 0.2,
      'worked-out-who-could-double-back': (st.mental / 10) * 0.35 + (st.strategic / 10) * 0.25,
      'did-not-think-about-it': (st.temperament / 10) * 0.3 + (1 - st.strategic / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'thought-about-the-room';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'left-it-arranged' ? 'left their room in a shape they could read later'
      : branch === 'worked-out-who-could-double-back' ? 'worked out who could turn back for the empty castle'
      : branch === 'did-not-think-about-it' ? 'walked out without a thought for what was behind them'
        : 'thought about the room they had left standing open';
    const line = _confess('EMPTY_CASTLE_LINES', branch, fill(pick(rng, EMPTY_CASTLE_LINES[branch]), a), a);
    const t = api.openArc('suspicion', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

const CARRIED_NAME_LINES = {
  'walked-out-decided': [
    '{a} walks out of the gate with a name already picked for tonight.',
    '{a} decided before breakfast. The walk is just to check it.',
    '{a} has a name for tonight and spends the walk looking for reasons to keep it.',
    '{a} knows who {sub} is voting for tonight.',
    '{a} leaves the castle with {posAdj} mind made up.',
    '{a} is sure about tonight already.',
  ],
  'changed-it-on-the-road': [
    '{a} left the castle sure of one name and arrives at the mission sure of another.',
    '{a} changes {posAdj} mind about tonight on the walk out.',
    'Something on the walk makes {a} rethink.',
    '{a} changes {posAdj} vote somewhere between the gate and the field.',
    '{a} sees something on the walk that changes {posAdj} mind.',
    '{a} arrives at the mission with a different name from the one {sub} left with.',
  ],
  'walked-out-with-nothing': [
    '{a} has no name for tonight, and isn’t pretending otherwise.',
    '{a} walks out with no idea who to vote for.',
    '{a} is hoping someone says something that makes it obvious.',
    '{a} still has nobody in mind for tonight.',
    '{a} is completely lost on who to vote for.',
    '{a} spends the walk hoping for a clue.',
  ],
  'let-the-day-decide': [
    '{a} decides not to decide until after the mission.',
    '{a} is waiting to see what happens this afternoon before picking a name.',
    '{a} will let the mission tell {obj} who to vote for.',
    '{a} keeps an open mind on the way out.',
    '{a} is going to watch today and decide later.',
    '{a} leaves the decision till this evening.',
  ],
};

registerEvent({
  id: 'testing-carried-a-name-out',
  family: 'testing',
  window: 'journey-out',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['strategic', 'intuition', 'temperament', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // Nothing to carry out on the first morning: there has been no table.
    return ctx.ep >= 2 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'testing-carried-a-name-out');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'walked-out-decided': (st.strategic / 10) * 0.4 + (st.boldness / 10) * 0.2,
      'changed-it-on-the-road': (st.intuition / 10) * 0.4 + (1 - st.temperament / 10) * 0.2,
      'walked-out-with-nothing': (1 - st.strategic / 10) * 0.35 + 0.15,
      'let-the-day-decide': (st.temperament / 10) * 0.35 + (st.loyalty / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'walked-out-with-nothing';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'walked-out-decided' ? 'walked out of the gate with tonight already decided'
      : branch === 'changed-it-on-the-road' ? 'changed their mind about tonight somewhere on the road'
      : branch === 'let-the-day-decide' ? 'left tonight open until the day had run'
        : 'walked out with no name for tonight at all';
    const line = _confess('CARRIED_NAME_LINES', branch, fill(pick(rng, CARRIED_NAME_LINES[branch]), a), a);
    const t = api.openArc('testing', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

const MORNINGS_LINES = {
  'counted-the-mornings': [
    '{a} works out on the walk how many more mornings there can be.',
    '{a} counts the group on the walk out. It is a lot smaller than on the first day.',
    '{a} does the maths: people go every day, and there aren’t many days left.',
    '{a} counts heads on the walk and gets a number {sub} doesn’t like.',
    '{a} notices the walk out gets shorter every day. Not the distance. The line.',
    '{a} counts how many are left on the road.',
  ],
  'stopped-counting': [
    '{a} used to count the group on the walk out. {Sub} has stopped.',
    '{a} knows the line is shorter and doesn’t want to know by how much.',
    '{a} decides counting doesn’t help.',
    '{a} doesn’t look round to count anymore.',
    '{a} keeps {posAdj} eyes on the road instead of the group.',
    '{a} has stopped counting heads.',
  ],
  'thought-about-the-last-one': [
    '{a} thinks about the last walk out, and who will be on it.',
    '{a} imagines the final day with only a few of them left.',
    '{a} wonders if {sub} will be on the last walk.',
    '{a} pictures the end of the game on the walk out.',
    '{a} thinks about the final Round Table.',
    '{a} wonders who will be standing at the end.',
  ],
  'took-the-morning-as-it-came': [
    '{a} isn’t counting anything. It’s a nice morning, and {sub} enjoys it.',
    '{a} walks out enjoying the weather.',
    '{a} has a good morning and doesn’t overthink it.',
    '{a} chats about nothing on the walk out.',
    '{a} takes the morning as it comes.',
    '{a} is just enjoying the walk.',
  ],
};

registerEvent({
  id: 'grief-counted-the-mornings',
  family: 'grief',
  window: 'journey-out',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['mental', 'temperament', 'loyalty', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // The column has to have got visibly shorter for any of this to be true.
    return peopleLost(gs) >= 2 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'grief-counted-the-mornings');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'counted-the-mornings': (st.mental / 10) * 0.4 + (st.strategic / 10) * 0.15,
      'stopped-counting': (st.temperament / 10) * 0.35 + 0.15,
      'thought-about-the-last-one': (st.loyalty / 10) * 0.3 + (1 - st.temperament / 10) * 0.25,
      'took-the-morning-as-it-came': (st.boldness / 10) * 0.25 + (st.temperament / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'counted-the-mornings';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'counted-the-mornings' ? 'did the arithmetic on how many mornings are left'
      : branch === 'stopped-counting' ? 'stopped counting the column on purpose'
      : branch === 'thought-about-the-last-one' ? 'spent the road thinking about the last walk out'
        : 'let the morning be a morning';
    const line = _confess('MORNINGS_LINES', branch, fill(pick(rng, MORNINGS_LINES[branch]), a), a);
    const t = api.openArc('grief', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});

const OPEN_ROAD_LINES = {
  'managed-the-face': [
    '{a} walks out knowing anyone could look round at {obj} at any moment.',
    '{a} keeps {posAdj} face calm the whole walk, for anyone watching.',
    '{a} treats the walk out like a performance.',
    '{a} makes sure {sub} looks relaxed on the walk.',
    '{a} is careful about how {sub} looks on the open road.',
    '{a} watches {posAdj} own face the whole way out.',
  ],
  'stopped-managing-it': [
    'Somewhere on the walk, {a} stops performing and just walks.',
    '{a} decides it’s too long a walk to spend acting.',
    '{a} relaxes halfway out and stops worrying how {sub} looks.',
    '{a} lets {posAdj} guard down on the walk.',
    '{a} gives up keeping a straight face and just enjoys the walk.',
    '{a} stops thinking about who is watching.',
  ],
  'overdid-the-ease': [
    '{a} is a bit too cheerful on the walk out.',
    '{a} tells a long story nobody asked for, very loudly.',
    '{a} laughs too loud at something that isn’t funny.',
    '{a} is so relaxed it looks forced.',
    '{a} whistles on the walk out, and people notice.',
    '{a} overdoes the small talk.',
  ],
  'never-thought-about-it': [
    'It hasn’t occurred to {a} that anyone is watching {obj} on the walk.',
    '{a} walks out exactly as {sub} would anywhere else.',
    '{a} isn’t performing. {Sub} is just walking.',
    '{a} doesn’t think about how {sub} looks at all.',
    '{a} just walks out, relaxed.',
    '{a} has nothing to hide on the walk, and it shows.',
  ],
};

registerEvent({
  id: 'cover-what-you-look-like-walking',
  family: 'cover',
  window: 'journey-out',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected', 'backfire'],
    voice: ['social', 'temperament', 'strategic', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!soloOnly(ctx)) return 0;
    // Being looked at needs a column to be looked at by.
    return (ctx.living || []).length >= 5 ? 1.4 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'cover-what-you-look-like-walking');
    const a = ctx.actors[0];
    const st = pStats(a);
    const scores = {
      'managed-the-face': (st.social / 10) * 0.35 + (st.strategic / 10) * 0.25,
      'stopped-managing-it': (st.temperament / 10) * 0.4 + 0.1,
      'overdid-the-ease': (1 - st.social / 10) * 0.3 + (st.boldness / 10) * 0.2,
      'never-thought-about-it': (1 - st.strategic / 10) * 0.3 + (st.temperament / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = 'never-thought-about-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'managed-the-face' ? 'spent the open road arranging how they looked'
      : branch === 'stopped-managing-it' ? 'stopped performing somewhere on the road out'
      : branch === 'overdid-the-ease' ? 'was a shade too relaxed on an open road'
        : 'walked out without a thought for who was looking';
    const line = _confess('OPEN_ROAD_LINES', branch, fill(pick(rng, OPEN_ROAD_LINES[branch]), a), a);
    const t = api.openArc('cover', [a], { source: sceneWhy, seed: line });
    return { branch, actor: a, speaker: a, threadId: t?.id, bondDelta: 0 };
  },
});
