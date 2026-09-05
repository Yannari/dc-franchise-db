// ══════════════════════════════════════════════════════════════════════
// tr/castle/confrontation.js — the argument that happens OUT LOUD
// ══════════════════════════════════════════════════════════════════════
//
// The suspicion family is people watching each other and saying it quietly to a
// friend. This is the other thing the show runs on: somebody deciding not to be
// quiet — putting it to a face, in front of the room, and living with how it
// goes. A confrontation settles no fact (this knowledge model cannot clear or
// convict anyone in the open), but it MOVES the room: it declares an enmity, it
// shows who folds under pressure and who does not, and it is the loudest thing a
// viewer's affection reacts to. So these scenes are social — bonds, threads, and
// the crowd — and never touch a belief; the deduction layer is the round table's,
// and an argument is not evidence.
//
// GROUNDED like the rest (the topic-record discipline): every scene names the
// person it is ABOUT (`topic`) so the composer never falls back to "it". The
// composer's `confrontation` entry (js/vp-tr/castle-day.js) draws the lead and
// the consequence off that.

import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi } from './effects.js';
import { findOpenThread, openThreadsFor } from '../threads.js';
import { lineFor } from './lines.js';

const FAMILY = 'confrontation';
const TOPIC = 'confrontation';

// ── confront-to-the-face ────────────────────────────────────────────────
// One person takes it straight to another, in the open. `{a}` confronts, `{b}`
// (the topic) answers — and the branch is how `{b}` takes it.
const FACE_LINES = {
  held: [
    '{a} said it to {b}’s face, in front of the room, and {b} did not blink.',
    '{a} put it to {b} straight, no softening, and {b} held the look and gave nothing back.',
    '{a} named it out loud at {b}, and {b} let the accusation sit there and go cold.',
    '{a} came at {b} directly, and {b} took it standing — which the room clocked as much as the accusation.',
  ],
  cracked: [
    '{a} pushed {b} on it, hard, and {b} came apart a little: a stammer, a look away, a hand that would not settle.',
    '{a} would not let it go, and {b}’s answer got smaller and shakier the longer it ran.',
    '{a} kept the pressure on {b}, and {b} folded — half an answer, then none at all.',
    '{a} said it plainly and {b} could not meet it, and the people watching filed that away.',
  ],
  turned: [
    '{a} came for {b} and walked straight into it: {b} turned the whole thing round and put {a} on the back foot.',
    '{a} accused {b} to {b}’s face, and {b} answered with a question {a} could not climb out from under.',
    '{b} did not defend — {b} attacked, and by the end it was {a} doing the explaining.',
    '{a} thought {b} was cornered. {b} was not, and made certain the room saw who really was.',
  ],
  'blew-up': [
    'It went from an accusation to a shouting match in four sentences, and neither {a} nor {b} came out of it clean.',
    '{a} and {b} lost it at each other completely, and the room got a fight where it wanted an answer.',
    'Whatever {a} meant to say to {b}, it ended with both of them raised and ugly and nothing settled.',
    '{a} confronted {b} and it detonated — voices up, chairs back, the room now watching two people who plainly cannot stand each other.',
  ],
};

registerEvent({
  id: 'confront-to-the-face',
  // `{a}` confronts, `{b}` answers — the pair is [confronter, confronted] on
  // every branch. See sceneSpeakers in js/tr/events.js.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  variationAxes: {
    outcome: ['held', 'cracked', 'turned', 'blew-up'],
    voice: ['temperament', 'boldness', 'social'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // Somebody only goes at somebody else in the open when there is a reason:
    // a suspicion thread already running, or real hostility on the bond.
    const t = findOpenThread('suspicion', [a, b]) || findOpenThread(FAMILY, [a, b]);
    const bond = getBond(a, b);
    if (!t && bond > -2) return 0;
    // Bold, hot-tempered people do this more; the timid keep it to a friend.
    return (t ? 3 : 1.5) * (0.5 + (pStats(a).boldness || 5) / 10);
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-to-the-face');
    const [a, b] = ctx.actors;
    const sb = pStats(b);
    // How {b} takes it, off {b}'s own composure and nerve.
    const scores = {
      held: (sb.temperament / 10) * 0.5 + (sb.boldness / 10) * 0.4,
      cracked: (1 - sb.temperament / 10) * 0.5 + (1 - sb.boldness / 10) * 0.3,
      turned: (sb.boldness / 10) * 0.4 + (sb.social / 10) * 0.4,
      'blew-up': (1 - sb.temperament / 10) * 0.35 + (1 - (pStats(a).temperament || 5) / 10) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'held';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'said it to their face, in front of the room';
    const note = lineFor(FACE_LINES[branch], `confront-to-the-face|${branch}|${ctx.ep}`, { a, b });

    // An open clash is friction: it costs the bond, most where it detonates.
    const bondDelta = branch === 'blew-up' ? -3 : branch === 'turned' ? -2 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    // WHAT THE COUNTRY MADE OF IT. Folding in the open reads gutless; turning it
    // round reads impressive; blowing it up makes the aggressor look ugly. Held
    // is a wash — nerve on both sides earns nothing either way. Damped, like
    // every castle crowd moment (js/tr/castle/crowd-map.js), so it colours the
    // affection rather than swinging it.
    let crowd = null;
    if (branch === 'cracked') crowd = { name: b, colour: 'cowardly', reason: 'folded under a question in the open', mult: 0.5 };
    else if (branch === 'turned') crowd = { name: b, colour: 'masterful', reason: 'turned an accusation back on the accuser', mult: 0.5 };
    else if (branch === 'blew-up') crowd = { name: a, colour: 'selfish', reason: 'turned a suspicion into a shouting match', mult: 0.5 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-pile-on ──────────────────────────────────────────────────────
// The room rounds on one person at once — modelled 2-actor (one voice fronts
// the pressure) behind a living-count gate, the way the group-pressure scene
// already is. `{a}` fronts it, `{b}` (topic) is the one being surrounded.
const PILE_LINES = {
  weathered: [
    'It stopped being a conversation and became a circle, three or four voices at {b} at once, and {b} stood in the middle of it and did not give.',
    'The room closed on {b} with {a} loudest, and {b} took every question without raising a hand or a voice.',
    '{a} led the others onto {b} all at once, and {b} weathered it like weather — head down, steady, still there at the end.',
    '{b} had four people’s doubt landing at the same time, {a} first among them, and answered all of it without cracking.',
  ],
  crumbled: [
    'The room came at {b} together, {a} loudest, and somewhere in the middle of it {b} stopped being able to answer.',
    '{a} and the others pressed {b} at once, and {b} folded under the weight of all of it.',
    'It was too many at once. {b} came apart in front of {a} and the rest of them and could not put a sentence back together.',
    '{a} started it and the others joined, and {b} broke somewhere in the pile-on and did not get it back.',
  ],
  overreached: [
    'The room went too hard at {b}, {a} out in front of it, and by the end {b} was the one people felt for.',
    '{a} led a pile-on that overshot — it got ugly enough that {b} came out of it looking wronged rather than guilty.',
    'Four voices on one is not an argument, it is a mob, and the moment that landed, the feeling in the room began to swing back toward {b}.',
    '{a} pushed the pile-on past where it should have stopped, and it bought {b} sympathy the accusation never would have.',
  ],
  'turned-it-back': [
    '{b} took the pile-on, picked the loudest voice in it, and turned the whole thing onto {a} instead.',
    'Cornered by the room, {b} asked {a} one question back, and the room turned round to look at {a}.',
    '{b} did not defend {b}self at all. {b} spent the entire time asking why {a} was so certain, and by the end so was everybody.',
    'The room came for {b} and left holding a question about {a}, which is not how a pile-on is supposed to end.',
    '{b} let it run for a minute and then put a single thing to {a} that nobody had an answer for.',
    'It stopped being about {b} somewhere in the middle, and {a} is the reason it stopped.',
    '{b} was outnumbered and came out of it with the room\'s attention pointed at {a}.',
    '{a} started that and {b} finished it, and the finishing was the part people will repeat.',
  ],
};

registerEvent({
  id: 'confront-pile-on',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  variationAxes: {
    outcome: ['weathered', 'crumbled', 'overreached', 'backfire'],
    voice: ['temperament', 'boldness', 'social', 'strategic'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // A pile-on needs a room big enough to be one, and a reason: real friction
    // between the fronter and the target.
    if ((ctx.living || []).length < 5) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread('suspicion', [a, b]) || findOpenThread(FAMILY, [a, b]);
    if (!t && getBond(a, b) > -2) return 0;
    return t ? 2 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-pile-on');
    const [a, b] = ctx.actors;
    const sb = pStats(b);
    const scores = {
      weathered: (sb.temperament / 10) * 0.5 + (sb.boldness / 10) * 0.4,
      crumbled: (1 - sb.temperament / 10) * 0.55 + (1 - sb.boldness / 10) * 0.25,
      overreached: (sb.social / 10) * 0.35 + 0.2,
      // A FOURTH OUTCOME. Being surrounded does not only produce holding,
      // folding or a mob that overshoots -- a sharp target redirects it, and
      // the accuser ends the evening as the subject. Strategic and boldness
      // in the person UNDER it, which no other branch here reads together.
      'turned-it-back': (sb.strategic / 10) * 0.35 + (sb.boldness / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'weathered';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'was surrounded by the room at once';
    const note = lineFor(PILE_LINES[branch], `confront-pile-on|${branch}|${ctx.ep}`, { a, b });
    // Turning it back costs the pair more than any of the others: {a}
    // started it and {b} made {a} pay in front of everybody.
    const bondDelta = branch === 'turned-it-back' ? -2
      : branch === 'overreached' ? -0.5 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    // Grace under a pile-on reads well; folding reads gutless; a mob that
    // overshoots makes its loudest voice look cruel and its target wronged.
    let crowd = null;
    if (branch === 'weathered') crowd = { name: b, colour: 'masterful', reason: 'stood calm while the room came at them at once', mult: 0.5 };
    else if (branch === 'crumbled') crowd = { name: b, colour: 'cowardly', reason: 'came apart under a pile-on', mult: 0.5 };
    else if (branch === 'overreached') crowd = { name: a, colour: 'cruel', reason: 'led a pile-on past where it should have stopped', mult: 0.5 };
    else if (branch === 'turned-it-back') crowd = { name: b, colour: 'masterful', reason: 'turned a whole room\u2019s pile-on back onto the person who started it', mult: 0.6 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: 'confrontation-pileon', threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-defend-the-accused ───────────────────────────────────────────
// The other side of a confrontation: when the room is turning on `{b}`, `{a}`
// stands up for them in the open. topic = `{b}` (the defended); the branch is
// whether it landed, slid off, or pulled `{a}` into the frame too.
const DEFEND_LINES = {
  worked: [
    '{a} stood up for {b} when the room was tipping against them, and said it plainly enough that the tipping stopped.',
    'With {b} on the back foot, {a} spoke up — not a hedge, a defence — and it landed, and {b} got some room to breathe.',
    '{a} put their own standing behind {b} at the worst moment to do it, and it worked: the doubt eased off {b}.',
    '{a} defended {b} out loud and made it stick, and {b} will remember who did it when it counted.',
  ],
  'fell-flat': [
    '{a} spoke up for {b}, and it did not move anybody — the doubt about {b} sat there exactly as heavy as before.',
    '{a} made the case for {b} and the room heard it and kept its face, and nothing about {b} changed.',
    '{a} defended {b} into a silence that gave nothing back, and {b} is no lighter for it.',
    '{a} tried, for {b}, and it slid off — a defence nobody argued with and nobody bought either.',
  ],
  'drew-fire': [
    '{a} stood up for {b}, and the next question was why {a} cared so much — now there are two of them being watched.',
    'Defending {b} cost {a}: the moment {a} spoke, the doubt widened to take {a} in as well.',
    '{a} put themselves between {b} and the room and caught some of it — standing up for the accused made {a} one of them.',
    '{a} meant to draw the doubt off {b} and drew it onto themselves instead, and now {a} and {b} sink or float together.',
  ],
  'too-late': [
    '{a} defended {b} well and did it a full ten minutes after the room had stopped caring.',
    'By the time {a} spoke up for {b} the conversation had gone somewhere else, and the defence hung there on its own.',
    '{a} made the case for {b} to a room that had already finished with it, which reads less like loyalty and more like positioning.',
    'It was a good defence of {b}. It was the wrong minute for it, and {b} noticed which.',
    '{a} waited to see which way it was going before standing up for {b}, and the waiting was the visible part.',
    '{a} said the right thing about {b} once saying it had stopped costing anything.',
    'The room had already let {b} off the hook when {a} arrived to do it, and {a} took the credit anyway.',
    '{b} needed that twenty minutes earlier. {a} was working out whether to say it at all.',
  ],
};

registerEvent({
  id: 'confront-defend-the-accused',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  variationAxes: {
    outcome: ['worked', 'fell-flat', 'drew-fire', 'rejected'],
    voice: ['boldness', 'social', 'loyalty', 'strategic'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 5) return 0;
    const [a, b] = ctx.actors;
    // You defend a friend, and only when there is something to defend them
    // from: a suspicion thread running on {b}, and a real bond a→b.
    if (getBond(a, b) < 2) return 0;
    // Only worth defending {b} when {b} is actually under it — an open
    // suspicion or confrontation thread naming them.
    const bUnderFire = openThreadsFor(b, ctx.ep)
      .some(t => t.kind === 'suspicion' || t.kind === FAMILY);
    return bUnderFire ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-defend-the-accused');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const scores = {
      worked: (sa.social / 10) * 0.5 + (sa.boldness / 10) * 0.3,
      'fell-flat': (1 - sa.social / 10) * 0.4 + 0.2,
      'drew-fire': (sa.boldness / 10) * 0.3 + (1 - sa.strategic / 10) * 0.3,
      // A FOURTH OUTCOME, and the one a careful player produces: the defence
      // is real and it is late, because {a} waited to see which way the room
      // was going first. High strategic, low boldness -- the opposite corner
      // from `drew-fire`.
      'too-late': (sa.strategic / 10) * 0.3 + (1 - sa.boldness / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'worked';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'stood up for them in front of the room';
    const note = lineFor(DEFEND_LINES[branch], `confront-defend-the-accused|${branch}|${ctx.ep}`, { a, b });
    // Standing together warms the bond; it warms less when it costs the defender.
    // A late defence buys almost nothing with the person defended, who was
    // watching the delay rather than the words.
    const bondDelta = branch === 'too-late' ? 0.5 : branch === 'drew-fire' ? 1 : 2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread('trust', [a, b]) || findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc('trust', [a, b], { source: sceneWhy, seed: note });

    // The country warms to somebody who stands up for another at cost; a defence
    // that works is kind, one that costs the defender is braver still.
    let crowd = null;
    if (branch === 'worked') crowd = { name: a, colour: 'selfless', reason: 'stood up for somebody the room was turning on', mult: 0.5 };
    else if (branch === 'fell-flat') crowd = { name: a, colour: 'kind', reason: 'tried to defend somebody, and meant it', mult: 0.5 };
    else if (branch === 'drew-fire') crowd = { name: a, colour: 'heroic', reason: 'took the room’s suspicion onto themselves to shield another', mult: 0.5 };
    else if (branch === 'too-late') crowd = { name: a, colour: 'selfish', reason: 'waited to see which way the room went before defending a friend', mult: 0.4 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: 'confrontation-defence', threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});
