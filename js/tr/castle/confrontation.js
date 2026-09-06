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

import { gs } from '../../core.js';
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
    '{a} accused {b} to {b}’s face, in front of the room, and {b} did not flinch.',
    '{a} said it plainly — called {b} suspicious — and {b} held the look and gave nothing back.',
    '{a} said {b}’s name out loud as an accusation, and {b} let it sit there until it went cold.',
    '{a} accused {b} directly, and {b} stood there and took it while the room watched both of them.',
  ],
  cracked: [
    '{a} pushed {b} on the accusation, hard, and {b} came apart a little: a stammer, a look away, a hand that would not settle.',
    '{a} would not let the question go, and {b}’s answer got smaller and shakier the longer it ran.',
    '{a} kept pressing {b} for an explanation, and {b} folded — half an answer, then none at all.',
    '{a} said it plainly and {b} could not meet it, and the people watching filed that away.',
  ],
  turned: [
    '{a} accused {b} and {b} turned the whole thing round, and suddenly {a} was the one answering questions.',
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
    'Three or four people started questioning {b} at once, and {b} stood in the middle of it and did not give.',
    'The room closed on {b} with {a} loudest, and {b} took every question without raising a hand or a voice.',
    '{a} led the others onto {b} all at once, and {b} kept calm and waited it out.',
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
    'Cornered, {b} asked {a} one question back, and the nearest half of the table turned to look at {a}.',
    '{b} did not defend at all — just kept asking why {a} was so sure, until the rest of the room started wondering the same thing about {a}.',
    'The room came for {b} and walked away suspicious of {a} instead, which nobody had planned.',
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
    '{a} defended {b} and the room went quiet but nobody changed their mind, and {b} is no safer for it.',
    '{a} tried, for {b}, and it slid off — a defence nobody argued with and nobody bought either.',
  ],
  'drew-fire': [
    '{a} stood up for {b}, and the next question was why {a} cared so much — now there are two of them being watched.',
    'Defending {b} cost {a}: the moment {a} spoke, the doubt widened to take {a} in as well.',
    '{a} put themselves between {b} and the room and caught some of it — standing up for the accused made {a} one of them.',
    '{a} meant to draw the suspicion off {b} and drew it onto themselves instead, and now both of them are being watched.',
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

// ══════════════════════════════════════════════════════════════════════
// THE FAMILY WAS FOUR EVENTS AND ALL OF THEM IN ONE WINDOW
// ══════════════════════════════════════════════════════════════════════
//
// MEASURED 2026-09-05, events per family across the whole pool: trust 35,
// suspicion 31, grief 26, testing 17, cover 17, romance 14, callback 12 —
// and CONFRONTATION 4, every one of them registered to `evening`. So the
// loudest thing this format does could only happen in one hour of the day.
// Nobody was ever accused over breakfast, on the road, walking home from a
// mission that went wrong, or in a corridor at midnight.
//
// These are that. The register is the file's: an argument OUT LOUD, settling
// no fact, moving the room. Each one is placed in a window the family had
// never reached, and each takes its shape from what that hour actually is —
// breakfast is raw and public, the road is long and unavoidable, after the
// table is where the vote gets its reckoning, the corridor is where the two
// of them are finally alone with it.

// ── confront-over-breakfast ─────────────────────────────────────────────
// The rawest hour there is. Somebody is gone, everybody is downstairs, and
// {a} does not wait for the evening to say it.
const BREAKFAST_LINES = {
  'said-it-cold': [
    '{a} let the room fill up, waited for it to go quiet, and put it to {b} before anybody had finished eating.',
    'No preamble. {a} asked {b} one question across the table and the whole hall stopped to hear the answer.',
    '{a} did not wait for the evening. {a} said {b}’s name at breakfast, flatly, and let it land.',
    'It is a strange thing to be accused with a cup in your hand, and {b} found that out over the toast.',
    '{a} put it to {b} in daylight, which is the version nobody can pretend not to have heard.',
    '{a} had clearly decided this on the stairs, and delivered it before {b} had sat down.',
  ],
  'too-raw': [
    '{a} came at {b} an hour after a body and it landed as grief rather than as a case.',
    'The room did not hear an accusation. It heard somebody upset, and it looked away from {a} rather than at {b}.',
    '{a} said it while {a} was still shaking, and that is all anybody took from it.',
    '{a} was too upset to make the accusation land, and the room heard grief instead of a case.',
    '{b} did not even have to answer. The room did the answering for {b}, gently, at {a}.',
    '{a} spent that accusation at the worst possible hour and got nothing back for it.',
  ],
  'room-took-sides': [
    'It split the table down the middle, and {a} could name both halves before the plates were cleared.',
    'Two people backed {a} out loud and two backed {b}, and the rest ate very quietly.',
    'A morning accusation does not stay between two people. This one had four names on it by nine o’clock.',
    'The hall came out of that breakfast in two pieces, and {a} is the reason.',
    'Somebody agreed with {a} before {b} had answered, and that was the moment it stopped being a conversation.',
    '{a} said it, and the silence afterwards had a shape to it that everybody could read.',
  ],
  'shut-down': [
    'Three people told {a} to leave it, and {a} left it, and the morning went on without the answer.',
    '{b} said "not now" and the room agreed with {b}, and that was the end of it.',
    'The hall closed ranks on the hour rather than on the person: not at breakfast, not today.',
    '{a} raised it and the room put it away, which is not the same as the room disagreeing.',
    'It got about eight seconds. Somebody changed the subject and everybody let them.',
    '{a} will have to say it again tonight, to a room that has already decided it has heard it.',
  ],
};

registerEvent({
  id: 'confront-over-breakfast',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'temperament', 'social'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread('suspicion', [a, b]) || findOpenThread(FAMILY, [a, b]);
    if (!t && getBond(a, b) > -2) return 0;
    // Doing it at breakfast rather than waiting for the table takes nerve and
    // a short fuse both.
    const sa = pStats(a);
    return (t ? 2.5 : 1) * (0.4 + (sa.boldness / 10) * 0.4 + (1 - sa.temperament / 10) * 0.3);
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-over-breakfast');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const scores = {
      'said-it-cold': (sa.temperament / 10) * 0.4 + (sa.boldness / 10) * 0.3,
      'too-raw': (1 - sa.temperament / 10) * 0.45,
      'room-took-sides': (sa.social / 10) * 0.4 + 0.15,
      'shut-down': (1 - sa.social / 10) * 0.35 + 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'said-it-cold';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'put it to them over breakfast, in front of everybody';
    const note = lineFor(BREAKFAST_LINES[branch], `confront-over-breakfast|${branch}|${ctx.ep}`, { a, b });
    // Being accused in daylight costs more than being accused at the table,
    // where it is at least the appointed hour for it.
    const bondDelta = branch === 'shut-down' ? -1 : branch === 'too-raw' ? -1.5 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    let crowd = null;
    if (branch === 'too-raw') crowd = { name: a, colour: 'exposed', reason: 'accused somebody an hour after a body, badly', mult: 0.5 };
    else if (branch === 'said-it-cold') crowd = { name: a, colour: 'masterful', reason: 'made an accusation at breakfast and made it stick', mult: 0.5 };
    else if (branch === 'room-took-sides') crowd = { name: a, colour: 'selfish', reason: 'split the hall in two over the eggs', mult: 0.4 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-about-the-vote ─────────────────────────────────────────────
// The reckoning the table itself has no room for. The slates are read, the
// chair is empty, and somebody wants to know why {b} wrote what {b} wrote.
const VOTE_LINES = {
  'owned-it': [
    '{b} did not pretend. "That was me, and here is why," and {b} said the why to {a}’s face.',
    '{a} asked {b} about the slate and got a straight answer, which is rarer here than a right one.',
    '{b} owned the vote in front of {a} and did not soften a word of it.',
    '{a} wanted an explanation and {b} gave one that {a} could not fault, and hated that.',
    '{b} said it plainly: {b} wrote that name, {b} meant it, and {b} would do it again tonight.',
    'There was no wriggling. {b} stood in the hall and answered for the slate.',
  ],
  'blamed-somebody-else': [
    '{b} explained the vote by explaining somebody else’s, which {a} noticed and filed.',
    '"I only wrote it because—" and the rest of {b}’s sentence was a third person’s name.',
    '{b} answered {a} by handing {a} somebody else to be angry with.',
    '{a} recognised what {b} was doing — blaming someone else for the vote — because {a} has seen it before.',
    '{b} spread the vote around until it belonged to nobody, least of all {b}.',
    '{a} came for one answer and left holding two more names and no answer at all.',
  ],
  'would-not-answer': [
    '{a} asked {b} straight out about the slate and {b} said the vote was the vote.',
    '{b} declined to explain, in a corridor, to somebody who plainly was not going to let it go.',
    '"I do not have to tell you that," said {b}, which is true and was not the point.',
    '{b} refused {a} an answer, and refusing is itself an answer of a kind.',
    '{a} got a shrug where {a} had come for a reason.',
    '{b} walked off mid-question, and {a} has that now instead of an explanation.',
  ],
  'turned-it-on-them': [
    '{a} asked {b} why {b} wrote that name and {b} asked {a} the same thing back, harder.',
    '{b} did not defend the vote. {b} attacked {a}’s, and did it in front of two other people.',
    '"Ask yourself that," said {b}, and the corridor went quiet.',
    '{b} had clearly been waiting for {a} to raise it and had the answer ready in the shape of a question.',
    '{a} started asking about the vote and ended up defending {a}’s own, which was {b}’s doing.',
    'By the end it was {a} explaining a slate, which is not how {a} had planned the evening.',
  ],
};

registerEvent({
  id: 'confront-about-the-vote',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'strategic', 'temperament', 'social'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // Needs a table to have happened, which `after-table` guarantees, and a
    // reason to take it up: hostility, or a story already running.
    const [a, b] = ctx.actors;
    const t = findOpenThread('suspicion', [a, b]) || findOpenThread(FAMILY, [a, b])
      || findOpenThread('trust', [a, b]);
    if (!t && getBond(a, b) > -1) return 0;
    return (t ? 3 : 1.5) * (0.5 + (pStats(a).boldness || 5) / 10);
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-about-the-vote');
    const [a, b] = ctx.actors;
    const sb = pStats(b);
    const scores = {
      'owned-it': (sb.boldness / 10) * 0.4 + (sb.loyalty / 10) * 0.3,
      'blamed-somebody-else': (sb.strategic / 10) * 0.4 + (1 - sb.loyalty / 10) * 0.25,
      'would-not-answer': (1 - sb.social / 10) * 0.35 + (sb.temperament / 10) * 0.2,
      'turned-it-on-them': (sb.boldness / 10) * 0.3 + (sb.social / 10) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'owned-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'wanted an answer for the slate';
    const note = lineFor(VOTE_LINES[branch], `confront-about-the-vote|${branch}|${ctx.ep}`, { a, b });
    // Owning it costs almost nothing between two people who already disagree;
    // evasion and counterattack are what actually damage a pair.
    const bondDelta = branch === 'owned-it' ? -0.5
      : branch === 'blamed-somebody-else' ? -1.5
        : branch === 'would-not-answer' ? -2 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    let crowd = null;
    if (branch === 'owned-it') crowd = { name: b, colour: 'masterful', reason: 'answered for a vote to the face of the person who minded it', mult: 0.5 };
    else if (branch === 'blamed-somebody-else') crowd = { name: b, colour: 'selfish', reason: 'explained a vote by handing the room a third name', mult: 0.5 };
    else if (branch === 'would-not-answer') crowd = { name: b, colour: 'cowardly', reason: 'would not account for a vote', mult: 0.4 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-in-the-corridor ────────────────────────────────────────────
// The only confrontation in this file with no audience. That changes what it
// is FOR: nobody is being performed at, so it is either the honest version or
// the one somebody did not want witnessed.
const CORRIDOR_LINES = {
  'said-what-they-meant': [
    'No room, no audience, no performance: {a} said the actual thing to {b} outside the bedroom door.',
    'It is a different conversation with nobody watching, and {a} and {b} finally had that one.',
    '{a} told {b} the truth in a corridor at midnight, with nobody around to hear it.',
    '{b} heard the version {a} has not said downstairs all week.',
    'Two people said what they thought of each other with no third person to play to.',
    'It was quieter than the hall version and considerably worse to hear.',
  ],
  'cleared-the-air': [
    'They had it out in the corridor and came out of it better than they went in, which surprised both of them.',
    '{a} and {b} said the whole thing to each other and then, oddly, shook on it.',
    'It turned out to be a misunderstanding with four days on it, and four days is a long time here.',
    '{b} explained, {a} believed it, and the corridor got twenty minutes and settled it.',
    'The argument ended with both of them agreeing it had been stupid.',
    'They went up separately and came down together, and the hall noticed that in the morning.',
  ],
  'made-it-worse': [
    'Away from the room there was nothing to keep it civil, and neither of them kept it civil.',
    '{a} said something in that corridor {a} will not be able to take back.',
    'It got personal in a way it had not managed to downstairs, because downstairs there were witnesses.',
    'The argument started about suspicion and ended somewhere personal.',
    'They ran out of accusations somewhere around midnight and started on each other instead.',
    'Two doors slammed at the same end of the corridor, and neither of them came back out.',
  ],
  'nobody-heard-it': [
    'Whatever happened in that corridor, it stayed there, and the castle will run tomorrow on not knowing.',
    'They kept it low. Two people, one wall, and nobody the wiser at breakfast.',
    'It was the loudest conversation of the week and it was held at a whisper.',
    'The room will have to read tomorrow off two faces, because it is getting nothing else.',
    'Neither of them mentioned it in the morning, which is not the same as it not having happened.',
    'Something changed between {a} and {b} last night and there is not a witness in the building.',
  ],
};

registerEvent({
  id: 'confront-in-the-corridor',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'loyalty', 'social', 'boldness'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b])
      || findOpenThread('trust', [a, b]);
    // Going to somebody's door at night needs a live story, not just dislike.
    return t ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-in-the-corridor');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const bond = getBond(a, b);
    const scores = {
      'said-what-they-meant': (sa.boldness / 10) * 0.35 + (sa.loyalty / 10) * 0.2,
      // Two calm people with something still between them can end it here.
      'cleared-the-air': ((sa.temperament + sb.temperament) / 20) * 0.4
        + Math.max(0, bond) * 0.05,
      'made-it-worse': ((10 - sa.temperament) + (10 - sb.temperament)) / 20 * 0.4,
      'nobody-heard-it': (1 - sa.social / 10) * 0.3 + 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'said-what-they-meant';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'had it out in the corridor with nobody watching';
    const note = lineFor(CORRIDOR_LINES[branch], `confront-in-the-corridor|${branch}|${ctx.ep}`, { a, b });
    // The only branch in this family that can go UP: a private argument is the
    // one kind that can actually be resolved, because neither of them has an
    // audience to keep face in front of.
    const bondDelta = branch === 'cleared-the-air' ? 2
      : branch === 'made-it-worse' ? -3
        : branch === 'said-what-they-meant' ? -1 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // A cleared air ENDS the story. That is the point of the branch: without
    // it this family can only ever escalate, and a castle where nothing is
    // ever settled is a castle with one note in it.
    if (branch === 'cleared-the-air' && (existing || t)) {
      api.resolveArc((existing || t).id, 'passed-clean', { source: sceneWhy });
    }

    // NO CROWD ON ANY BRANCH, and that is the event rather than an omission:
    // the country did not see this. crowd-map.js pays castle moments off what
    // the room witnessed, and the whole premise here is that nobody did.
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta };
  },
});

// ── confront-on-the-long-walk ───────────────────────────────────────────
// A road is the one place a confrontation cannot be walked away from, and
// that is the whole mechanic: an hour of it, at three miles an hour.
const LONG_WALK_LINES = {
  'ran-the-whole-way': [
    'It started at the gate and it was still going at the ford, and neither of them could leave.',
    '{a} and {b} argued for the length of a valley, which is longer than either of them wanted.',
    'You cannot storm off on a road. {a} and {b} found that out over about five miles.',
    'The column left them a wide berth and let them get on with it for an hour.',
    'By the last mile they had stopped shouting and were simply grinding at each other, which was worse.',
    'Everybody else got a very quiet walk and two people got a long one.',
  ],
  'ran-out-of-road': [
    'They said everything worth saying in the first half mile and had four more to walk.',
    'The argument finished long before the road did, and then it was just two people walking.',
    '{a} and {b} ran out of things to accuse each other of and kept walking anyway.',
    '{a} and {b} ran out of things to say and still had four miles of walking next to each other.',
    'It ended in silence, not agreement, and the silence went on for miles.',
    'By the gate it had gone cold, and cold between those two is not better than loud.',
  ],
  'the-column-broke-it-up': [
    'Somebody else dropped back and walked between them, which is the only way to end one of these.',
    'A third person joined the argument specifically to stop it, and did.',
    'The column would not let it run. Two of them physically split {a} and {b} up.',
    'Whatever was going to be said got said to a referee instead, which took most of the temper out of it.',
    'The rest of them were not going to spend a whole afternoon on this and said so.',
    'It was ended by committee, and neither {a} nor {b} was satisfied with that.',
  ],
  'everybody-heard-it': [
    'A road carries. Every word of that reached the front of the column and the back of it.',
    'They were not quiet about it and there was nowhere for anybody to not hear it.',
    'The castle now has fourteen witnesses to a conversation {a} and {b} thought they were having alone.',
    'People slowed down to listen and then pretended they had not.',
    'That argument is going to be quoted at a table this week, accurately, by three different people.',
    'It is one thing to fall out. It is another to do it at volume in an open field.',
  ],
};

registerEvent({
  id: 'confront-on-the-long-walk',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'journey-back',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'boldness', 'social', 'endurance'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    if ((ctx.living || []).length < 5) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread('suspicion', [a, b]) || findOpenThread(FAMILY, [a, b]);
    if (!t && getBond(a, b) > -2) return 0;
    return t ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-on-the-long-walk');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'ran-the-whole-way': ((10 - sa.temperament) + (10 - sb.temperament)) / 20 * 0.4,
      'ran-out-of-road': ((sa.temperament + sb.temperament) / 20) * 0.3 + 0.15,
      'the-column-broke-it-up': (ctx.living || []).length >= 7 ? 0.35 : 0.1,
      'everybody-heard-it': (sa.boldness / 10) * 0.3 + (1 - sa.social / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'ran-the-whole-way';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'argued the whole way home with nowhere to walk off to';
    const note = lineFor(LONG_WALK_LINES[branch], `confront-on-the-long-walk|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'ran-the-whole-way' ? -3
      : branch === 'everybody-heard-it' ? -2.5
        : branch === 'ran-out-of-road' ? -2 : -1;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    let crowd = null;
    if (branch === 'everybody-heard-it') crowd = { name: a, colour: 'selfish', reason: 'made the whole column listen to a private row', mult: 0.5 };
    else if (branch === 'ran-the-whole-way') crowd = { name: a, colour: 'exposed', reason: 'could not let an argument go for five miles', mult: 0.4 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-blamed-for-the-mission ─────────────────────────────────────
// Missions are the one part of this week with an objective result, so they
// are the one thing people can be blamed for with evidence. `journey-out` is
// deliberate: this is the argument that starts BEFORE the next one, carrying
// yesterday's failure onto today's road.
const MISSION_BLAME_LINES = {
  'named-the-weak-link': [
    '{a} said out loud on the road what half of them had been thinking: yesterday went wrong at {b}.',
    'Nobody had said it until {a} did, and once it was said it could not be unsaid.',
    '{a} put yesterday’s failure on {b} by name, on the way to today’s.',
    'It is one thing to think somebody cost you money. It is another to say it where they can hear.',
    '{a} did the arithmetic out loud and it came out as {b}’s name.',
    'The column had been carrying that quietly since the ford. {a} put it down in front of everybody.',
  ],
  'took-the-blame': [
    '{b} did not argue. {b} said it had been {b}, said sorry, and asked what {b} could do about it today.',
    '{a} came for {b} about yesterday and {b} agreed before {a} had finished the sentence.',
    '{b} owned it flat out, which took most of the fight out of {a} and all of it out of the column.',
    'It is very hard to keep shouting at somebody who has agreed with you.',
    '{b} apologised on a road in front of everybody, which costs something and bought something.',
    '{b} said the thing nobody in this castle says: that was me, and I got it wrong.',
  ],
  'blamed-them-back': [
    '{b} pointed out, at some length, where {a} had been while yesterday was going wrong.',
    '{a} named {b} and {b} named {a}, and the truth is probably both.',
    'It became an argument about the whole afternoon rather than about one person in it.',
    '{b} had a list ready, which suggests {b} had been expecting this since yesterday.',
    'Two people who both cost the castle money spent a mile establishing which had cost more.',
    'By the field neither of them was blameless and both of them were furious.',
  ],
  'nobody-backed-it': [
    '{a} said it and the column did not pick it up, and {a} was left holding an accusation alone.',
    'Nobody agreed out loud. That is not the same as nobody agreeing, and {a} knows it.',
    'The road went quiet in the way roads do when somebody has misjudged the room.',
    '{a} expected support and got fourteen people looking at the hedge.',
    'It turns out the castle would rather lose the money than have that conversation.',
    'Somebody changed the subject, kindly, and {a} let them, which cost {a} more than the silence had.',
  ],
};

registerEvent({
  id: 'confront-blamed-for-the-mission',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'journey-out',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'loyalty', 'social', 'temperament'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // There has to have been a mission to be blamed for, which means at least
    // one afternoon behind them.
    if ((ctx.ep || 0) < 2) return 0;
    if ((ctx.living || []).length < 5) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread('suspicion', [a, b]) || findOpenThread(FAMILY, [a, b]);
    if (!t && getBond(a, b) > 0) return 0;
    return t ? 2 : 1.2;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-blamed-for-the-mission');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'named-the-weak-link': (sa.boldness / 10) * 0.4 + (1 - sa.social / 10) * 0.15,
      'took-the-blame': (sb.loyalty / 10) * 0.4 + (sb.temperament / 10) * 0.2,
      'blamed-them-back': (1 - sb.loyalty / 10) * 0.3 + (sb.boldness / 10) * 0.3,
      'nobody-backed-it': (1 - sa.social / 10) * 0.35 + 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'named-the-weak-link';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'blamed them out loud for how the mission went';
    const note = lineFor(MISSION_BLAME_LINES[branch], `confront-blamed-for-the-mission|${branch}|${ctx.ep}`, { a, b });
    // Taking the blame is the one branch that does not cost the pair — it is
    // the only apology available in this family.
    const bondDelta = branch === 'took-the-blame' ? 0.5
      : branch === 'nobody-backed-it' ? -1
        : branch === 'named-the-weak-link' ? -2 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    let crowd = null;
    if (branch === 'took-the-blame') crowd = { name: b, colour: 'selfless', reason: 'took the blame for a mission out loud, in front of everybody', mult: 0.6 };
    else if (branch === 'named-the-weak-link') crowd = { name: a, colour: 'cruel', reason: 'blamed one person for a mission on the way to the next one', mult: 0.4 };
    else if (branch === 'nobody-backed-it') crowd = { name: a, colour: 'exposed', reason: 'made an accusation nobody would stand behind', mult: 0.5 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-the-broken-word ────────────────────────────────────────────
// The only event in this family with a PRECONDITION IN THE RECORD rather than
// in a bond: it needs a trust story that has already been resolved badly
// between these two. Somebody swore something and did not do it, and this is
// the hour it gets said.
const BROKEN_WORD_LINES = {
  'said-it-plainly': [
    '{a} reminded {b}, quietly and exactly, what {b} had promised, and then waited.',
    '"You said," began {a}, and everything after that was a direct quotation.',
    'There was no shouting. {a} simply repeated {b}’s own words back at {b}, exactly.',
    'There is nothing to argue with when somebody quotes you accurately, and {b} did not try.',
    '{a} had the sentence word for word, which suggests {a} has been carrying it for days.',
    '{a} did not accuse {b} of anything new — just repeated what {b} had promised and let the broken promise speak for itself.',
  ],
  'denied-saying-it': [
    '{b} said {b} had never promised that, and said it with a completely straight face.',
    '{a} quoted {b} and {b} denied the quote, and there is no referee in this castle.',
    '"That is not what I said." It is exactly what {b} said, and only two people know it.',
    '{b} rewrote the conversation on the spot and dared {a} to prove otherwise.',
    'It is {a}’s word against {b}’s, which means it is nothing at all, and {b} knew that going in.',
    '{b} did not even seem angry about it, which {a} found worse than the denial.',
  ],
  'had-a-reason': [
    '{b} had a reason and it was a good one, and {a} still has to decide whether to accept it.',
    '{b} broke it because keeping it would have cost {b} the game, and said so, honestly.',
    '"I would do it again," said {b}, which is at least an answer.',
    '{a} came for an apology and got an explanation, and those are not the same thing.',
    '{b} explained the circumstances at length and {a} listened to all of them without softening.',
    'It was a promise made on a Tuesday about a Thursday, and {b} said as much.',
  ],
  'threw-it-back': [
    '{b} listed, from memory, the two things {a} had promised {b} and not done.',
    'The conversation stopped being about {b}’s broken promise almost immediately — {b} made sure of that.',
    '{a} raised one promise and {b} raised two, and now there are three on the floor.',
    '{b} was clearly waiting to be asked about this and had the counter-charge ready.',
    'Neither of them has kept a word to the other this week and now both of them know it.',
    'It ended with two people who trust each other less than they did an hour ago, which was not {a}’s plan.',
  ],
};

registerEvent({
  id: 'confront-the-broken-word',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'evening',
  advancesThread: true,
  // NOT `citesResidue`. It was declared and it was false: this event writes
  // its note through `lineFor` and `advanceArc`, neither of which appends a
  // citation, so the flag promised a look-back the scene never prints.
  // tr-castle.test.js caught it by failing to make the event eligible in the
  // probe world, which is the same guard saying the same thing twice.
  // `rare: true`: the gate needs a trust story between this exact pair that
  // has already RESOLVED badly, which is a state the season produces a
  // handful of times. Measured at 1-6 firings per 200 seasons without it,
  // under the branch floor. events.js guard 2 exists for precisely this.
  rare: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'temperament', 'strategic', 'boldness'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // THE PRECONDITION IS ON THE RECORD, not on a bond: a trust story between
    // these two that ENDED BADLY. `turned-back` is what trust.js writes when
    // somebody broke their word (see trust-last-word-before-lights-out), so
    // this event cannot fire until that has actually happened between them.
    // `gs.tr.threads` AND NOT `openThreadsFor`, and the distinction is the
    // whole gate: a thread that CARRIES AN OUTCOME has been resolved, so it is
    // by definition not open, and an open-threads read here matched nothing on
    // every firing. (Caught by probing the branch rather than by any
    // assertion -- the same shape as the two dead branches fixed in
    // js/tr/castle/cover.js and js/tr/castle/grief.js.)
    const broken = (gs.tr?.threads || []).some(t =>
      t.kind === 'trust' && (t.parties || []).includes(a) && (t.parties || []).includes(b)
      && (t.outcome === 'turned-back' || t.outcome === 'exposed'));
    if (!broken) return 0;
    return 3;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-the-broken-word');
    const [a, b] = ctx.actors;
    const sb = pStats(b);
    const scores = {
      'said-it-plainly': (sb.temperament / 10) * 0.3 + 0.2,
      'denied-saying-it': (sb.strategic / 10) * 0.4 + (1 - sb.loyalty / 10) * 0.25,
      'had-a-reason': (sb.loyalty / 10) * 0.3 + (sb.boldness / 10) * 0.2,
      'threw-it-back': (sb.boldness / 10) * 0.3 + (1 - sb.temperament / 10) * 0.25,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'said-it-plainly';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'held them to a promise they had already broken';
    const note = lineFor(BROKEN_WORD_LINES[branch], `confront-the-broken-word|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'had-a-reason' ? -0.5
      : branch === 'said-it-plainly' ? -1.5
        : branch === 'denied-saying-it' ? -3 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    let crowd = null;
    if (branch === 'denied-saying-it') crowd = { name: b, colour: 'masterful', reason: 'denied their own promise to the face of the person they made it to', mult: 0.5 };
    else if (branch === 'had-a-reason') crowd = { name: b, colour: 'exposed', reason: 'admitted breaking a promise and said they would do it again', mult: 0.4 };

    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-stop-following-me ──────────────────────────────────────────
// Not an accusation of being a Traitor: an accusation of BEHAVIOUR. Somebody
// has been watching somebody all week and is told to stop, in the open. It is
// the only scene in this family where the person confronted has done nothing
// except pay attention.
const FOLLOWING_LINES = {
  'told-them-to-stop': [
    '"Every time I turn round," said {b}, "you are there." {a} did not deny it.',
    '{b} told {a}, out loud, to stop watching {b}, which is a thing you can only say once.',
    'It had been going on for days and {b} finally put a sentence on it.',
    '{b} named the behaviour rather than the person, which is somehow harder to answer.',
    '{a} has been three feet away from {b} all week and {b} has been counting.',
    '{b} said it in front of two other people, deliberately, so that it could not be smoothed over.',
  ],
  'made-it-worse-for-them': [
    'The complaint made {b} look like somebody with a reason to mind being watched.',
    '{b} objected to being observed, which is the single least helpful thing an innocent person can do.',
    'Half the room heard "stop watching me" and heard "there is something to see".',
    '{b} won the argument and lost the week.',
    '{a} said almost nothing and came out of it better than {b} did.',
    'It is a fair complaint and it was a catastrophic thing to make out loud.',
  ],
  'admitted-it': [
    '{a} said yes, {a} had been watching, and gave the reason, and the reason was not nothing.',
    '{a} did not bother denying it. "I have been. You know why."',
    'There was no wriggling from {a}, which left {b} holding a complaint with nowhere to go.',
    '{a} agreed so readily that {b} was briefly wrong-footed by it.',
    '{a} owned the watching and made it sound reasonable, which was the clever answer.',
    '"I have," said {a}, "and I am going to keep doing it." That ended the conversation.',
  ],
  'both-embarrassed': [
    'It came out wrong, both of them heard it come out wrong, and neither knew how to end it.',
    'What was meant to be a boundary became an awkward two minutes in front of four people.',
    '{b} said it and immediately wished {b} had not, and {a} could see that.',
    'They have to walk out together tomorrow and both of them are thinking about that already.',
    'Nobody won it. Two people simply made a week slightly harder for themselves.',
    'The room let it go quickly, which was the kindest thing available.',
  ],
};

registerEvent({
  id: 'confront-stop-following-me',
  // {a} is the WATCHER and {b} is the one objecting, so the pair is
  // [watcher, complainant] and the complaint runs b -> a. `respondent-first`
  // is not a thing this engine has, so the scene names its speaker explicitly
  // on every return instead.
  roles: 'initiator-first',
  family: FAMILY,
  window: 'morning',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'temperament', 'social', 'intuition'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // {a} has to actually have a running suspicion of {b} -- the watching has
    // to be real before anybody can be told to stop doing it.
    const t = findOpenThread('suspicion', [a, b]);
    if (!t) return 0;
    // And {b} has to be the sort to say something about it.
    return 1.5 + (pStats(b).boldness / 10) * 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-stop-following-me');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'told-them-to-stop': (sb.boldness / 10) * 0.4 + 0.15,
      'made-it-worse-for-them': (1 - sb.social / 10) * 0.35 + (1 - sb.temperament / 10) * 0.2,
      'admitted-it': (sa.boldness / 10) * 0.35 + (sa.temperament / 10) * 0.2,
      'both-embarrassed': ((10 - sa.boldness) + (10 - sb.boldness)) / 20 * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'told-them-to-stop';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = 'was told out loud to stop watching them';
    const note = lineFor(FOLLOWING_LINES[branch], `confront-stop-following-me|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'both-embarrassed' ? -0.5
      : branch === 'admitted-it' ? -1 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });

    let crowd = null;
    if (branch === 'made-it-worse-for-them') crowd = { name: b, colour: 'exposed', reason: 'objected to being watched, in front of people', mult: 0.5 };
    else if (branch === 'admitted-it') crowd = { name: a, colour: 'masterful', reason: 'admitted to watching somebody and made it sound reasonable', mult: 0.5 };

    // THE SPEAKER IS {b} HERE, which is the opposite of every other event in
    // this file: the complaint is made BY the person being watched. Named
    // explicitly rather than left to `roles`, so the composer attributes the
    // line to the right mouth.
    return { branch, pair: [a, b], speaker: b, respondent: a,
      topic: a, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ══════════════════════════════════════════════════════════════════════
// THE FAMILY IS STILL THE THINNEST IN THE POOL
// ══════════════════════════════════════════════════════════════════════
//
// After the September batch that put confrontation into six new windows it
// stood at TWELVE events against trust's 41 and suspicion's 36 — bottom of
// the table, in the register this format runs on. Measured share of scenes:
// 5.0% of the castle is an argument, against suspicion's 26%.
//
// These eight take it to twenty, weighted into the windows it holds ONE event
// in: journey-back, after-table and night had a single confrontation each, so
// the hour after a banishment — the angriest hour the format has — could
// produce exactly one shape of row.
//
// Same gate as the rest of the file: a live suspicion or confrontation
// thread, or real hostility on the bond. Personality scales the weight but
// does not open the door, which is the distinction the archetype
// investigation turned on — who picks a fight may depend on temper, but who
// gets SUSPECTED must not.

// ── confront-carried-it-home ────────────────────────────────────────────
// journey-back. An argument that started out there and does not stop at the
// gate — the one shape a road row can take that the road cannot contain.
const CARRIED_HOME_LINES = {
  'still-going-inside': [
    'It started at the ford and it was still going in the boot room.',
    '{a} followed {b} through the door still talking, which is how the whole castle found out.',
    'They came up the drive arguing and did not stop for the threshold.',
    'The hall got the last four minutes of a conversation that had been running for five miles.',
    '{a} would not let it end at the gate, and a gate is where these are supposed to end.',
    'Everybody else went to change. Those two stood in the corridor and finished it.',
    'It has stopped being about the afternoon and neither of them can say when.',
    '{b} tried three times to walk away and {a} kept finding one more sentence.',
  ],
  'dropped-it-at-the-gate': [
    'Whatever that was on the road, {a} and {b} left it on the other side of the gate.',
    'They came in separately and neither said a word about the last hour.',
    'It is not resolved. It is filed, which in this castle is nearly the same thing.',
    'Both of them decided the castle did not need to see it, and both were right.',
    '{a} was still angry in the hall and said nothing at all about why.',
    'They will pick it up tomorrow on the way out, and both know it.',
    'The gate did what gates do and the argument stayed outside.',
    'It cost them the walk and it did not cost them the evening.',
  ],
  'somebody-else-carried-it': [
    'Neither {a} nor {b} mentioned it inside. Somebody who had been walking behind them did.',
    'The row arrived at the castle before they did, in a third person’s mouth.',
    'By dinner two people who were not on that road had opinions about it.',
    '{a} spent the evening being asked about a conversation {a} had thought was private.',
    'It is a small castle and a long road and neither of them thought about the acoustics.',
    'The version going round the hall is not either of their versions.',
    '{b} has heard it repeated back with a detail {b} does not recognise.',
    'Somebody made that argument public and it was not one of the two people in it.',
  ],
  'one-of-them-apologised': [
    'Halfway up the drive {a} said sorry, properly, and meant it.',
    'It ended better than it had any right to, in the last quarter mile.',
    '{a} climbed down, which is rarer here than being right.',
    '{b} did not expect an apology and did not know what to do with one.',
    'They came in together, which the hall noticed as much as it would have noticed a row.',
    'It is not that {a} was wrong. It is that {a} would rather have {b}.',
    'The apology cost {a} something and bought more than it cost.',
    'Whatever that was, it is over, and both of them are quietly relieved.',
  ],
};

registerEvent({
  id: 'confront-carried-it-home',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'journey-back',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'boldness', 'loyalty', 'social'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    if (!t && getBond(a, b) > -2) return 0;
    return t ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-carried-it-home');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const scores = {
      'still-going-inside': (1 - sa.temperament / 10) * 0.4 + (sa.boldness / 10) * 0.2,
      'dropped-it-at-the-gate': (sa.temperament / 10) * 0.35 + 0.1,
      'somebody-else-carried-it': (ctx.living || []).length >= 7 ? 0.3 : 0.1,
      'one-of-them-apologised': (sa.loyalty / 10) * 0.3 + (sa.social / 10) * 0.15,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'still-going-inside';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'still-going-inside' ? 'brought the argument in through the door'
      : branch === 'dropped-it-at-the-gate' ? 'left it on the other side of the gate'
        : branch === 'somebody-else-carried-it' ? 'had their row repeated by somebody who overheard it'
          : 'climbed down on the last quarter mile';
    const note = lineFor(CARRIED_HOME_LINES[branch],
      `confront-carried-it-home|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'one-of-them-apologised' ? 2
      : branch === 'dropped-it-at-the-gate' ? -0.5
        : branch === 'somebody-else-carried-it' ? -1.5 : -2.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'one-of-them-apologised') crowd = { name: a, colour: 'kind', reason: 'climbed down first, on a road, in front of people', mult: 0.5 };
    else if (branch === 'still-going-inside') crowd = { name: a, colour: 'selfish', reason: 'brought a five-mile argument in through the front door', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-you-let-them-go ────────────────────────────────────────────
// after-table. Not about the vote cast — about the defence NOT made. The
// specific accusation the hour after a banishment produces and this file
// could not say.
const LET_THEM_GO_LINES = {
  'said-nothing-at-all': [
    '{a} wants to know why {b} sat there and said nothing while it happened.',
    '"You were their friend," {a} tells {b}, "and you did not open your mouth."',
    'Silence at a table is a choice and {a} has decided to treat it as one.',
    '{b} had one sentence that might have changed it and did not use it.',
    '{a} counted the people who spoke up and {b} was not among them.',
    'It is an accusation about an absence, which is the hardest kind to answer.',
    '{b} says there was nothing to be done. {a} says there was, and does not say what.',
    'Everybody at that table was quiet. {a} has picked one of them to be angry at.',
  ],
  'saved-themselves': [
    '{a} says plainly what the room was thinking: {b} went quiet to stay safe.',
    '"You could see where it was going and you got out of the way."',
    'It is a fair reading and it is a brutal thing to say out loud in a corridor.',
    '{b} does not deny it, exactly. {b} explains it, which is not the same.',
    '{a} has decided {b} is the kind of player who will do that again.',
    'The accusation is really a prediction, and {b} hears the prediction.',
    'Self-preservation is not a crime here and it is not forgotten either.',
    '{a} would have done the same and would not admit it.',
  ],
  'turned-it-on-the-accuser': [
    '{b} points out, evenly, that {a} did not speak up either.',
    '"Where were you?" ends that conversation faster than any defence.',
    '{a} came for {b} about a silence and had one of their own.',
    '{b} had counted too, and had a different list.',
    'It is the corridor equivalent of a mirror, and {a} does not enjoy it.',
    'Both of them sat there. Only one of them made it somebody else’s fault.',
    '{b} says it without heat, which is what makes it land.',
    '{a} walks off first, which the corridor notes.',
  ],
  'both-admitted-it': [
    'They stood in the corridor and admitted, both of them, that they had let it happen.',
    'It is not an argument by the end. It is two people being honest at midnight.',
    '{a} says it first and {b} agrees before {a} has finished.',
    'Neither of them defended somebody they liked, and both of them know why.',
    'There is no comfort in it. There is something between them that was not there before.',
    'They agreed to speak up next time, which is a promise this castle rarely keeps.',
    '{a} said the ugly thing about {a} and {b} matched it.',
    'It is the first honest conversation either has had since the reveal.',
  ],
};

registerEvent({
  id: 'confront-you-let-them-go',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'boldness', 'temperament', 'social'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b])
      || findOpenThread('trust', [a, b]);
    if (!t && getBond(a, b) > -1) return 0;
    return t ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-you-let-them-go');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'said-nothing-at-all': (sa.loyalty / 10) * 0.35 + (sa.boldness / 10) * 0.2,
      'saved-themselves': (sa.boldness / 10) * 0.3 + (1 - sb.loyalty / 10) * 0.2,
      'turned-it-on-the-accuser': (sb.temperament / 10) * 0.3 + (sb.social / 10) * 0.2,
      'both-admitted-it': ((sa.loyalty + sb.loyalty) / 20) * 0.3,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'said-nothing-at-all';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'both-admitted-it' ? 'admitted together that they had let it happen'
      : branch === 'turned-it-on-the-accuser' ? 'was asked where they had been'
        : branch === 'saved-themselves' ? 'was accused of going quiet to stay safe'
          : 'was asked why they said nothing at all';
    const note = lineFor(LET_THEM_GO_LINES[branch],
      `confront-you-let-them-go|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'both-admitted-it' ? 2
      : branch === 'turned-it-on-the-accuser' ? -2 : -1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'saved-themselves') crowd = { name: b, colour: 'cowardly', reason: 'went quiet at the table to stay out of it', mult: 0.5 };
    else if (branch === 'both-admitted-it') crowd = { name: a, colour: 'exposed', reason: 'admitted out loud to having said nothing when it counted', mult: 0.4 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-waited-up ──────────────────────────────────────────────────
// night. Somebody sat up specifically to have it out — the deliberate
// version, as against `confront-in-the-corridor`'s chance meeting.
const WAITED_UP_LINES = {
  'had-it-out': [
    '{a} sat in the dark for an hour waiting for {b} to come up, and said all of it.',
    'It was not a chance meeting. {a} had been waiting since eleven.',
    '{b} came round the corner and found somebody who had prepared.',
    '{a} had the whole thing ordered and delivered it without raising a voice.',
    'Waiting up for somebody is its own message before a word is said.',
    '{b} listened to the end, which {a} had not expected.',
    'It took four minutes and {a} had spent an hour on it.',
    'Nothing about it was spontaneous and that is what made it frightening.',
  ],
  'lost-their-nerve': [
    '{a} waited up, rehearsed it, and said good night.',
    'The whole speech went unused and {a} is still holding it.',
    '{b} looked tired and {a} could not do it.',
    'It is harder at midnight than it was at nine, and {a} found that out.',
    '{a} will have to wait up again, and knows the second time is worse.',
    'One hour of preparation and four words of delivery.',
    '{b} has no idea what nearly happened on that landing.',
    '{a} went to bed angrier than when {a} sat down.',
  ],
  'they-were-ready-too': [
    '{b} had been expecting it for a day and had an answer waiting.',
    'Two people who had both rehearsed, meeting at midnight.',
    'It was less an argument than two prepared statements.',
    '{a} got nothing new and gave away that {a} had been thinking about it.',
    '{b} had even worked out which corridor {a} would pick.',
    'Nobody was surprised and nobody moved.',
    'It ended politely, which neither of them wanted.',
    'They will do this again and both know the next one is the real one.',
  ],
  'woke-the-corridor': [
    'It got loud enough that two doors opened and one of them stayed open.',
    'A midnight argument in a stone corridor is a public argument.',
    'Whatever {a} had planned to say privately is now known by four people.',
    'Somebody coughed pointedly and neither of them stopped.',
    'The castle heard the shape of it if not the words.',
    'By breakfast three people will know there was a row and none will know what about.',
    '{b} noticed the audience before {a} did and stopped talking.',
    'It was the loudest thing that happened all night and nobody will admit to listening.',
  ],
};

registerEvent({
  id: 'confront-waited-up',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'strategic', 'temperament', 'intuition'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // Sitting up for somebody needs a live story, not just dislike.
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    return t ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-waited-up');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'had-it-out': (sa.boldness / 10) * 0.4 + (sa.temperament / 10) * 0.15,
      'lost-their-nerve': (1 - sa.boldness / 10) * 0.4,
      'they-were-ready-too': (sb.intuition / 10) * 0.3 + (sb.strategic / 10) * 0.2,
      'woke-the-corridor': (1 - sa.temperament / 10) * 0.3 + 0.1,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'had-it-out';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'lost-their-nerve' ? 'waited up for them and said good night instead'
      : branch === 'they-were-ready-too' ? 'found somebody who had rehearsed an answer'
        : branch === 'woke-the-corridor' ? 'had it out loudly enough that doors opened'
          : 'waited up in the dark to say all of it';
    const note = lineFor(WAITED_UP_LINES[branch],
      `confront-waited-up|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'lost-their-nerve' ? 0
      : branch === 'they-were-ready-too' ? -1 : -2.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'woke-the-corridor') crowd = { name: a, colour: 'selfish', reason: 'had a private row at a volume the whole floor could hear', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-apology-refused ────────────────────────────────────────────
// morning. The one direction this family had no event for: somebody trying
// to END a row, and being told no.
const APOLOGY_LINES = {
  'refused-it': [
    '{a} apologised properly and {b} did not take it.',
    '"I am not going to pretend that is enough," said {b}, and meant it.',
    'It is worse to apologise and be refused than never to have tried.',
    '{a} came with something real and left holding it.',
    '{b} is entitled to refuse and both of them know what refusing costs.',
    'The apology was the last card {a} had for this.',
    '{b} said thank you and did not say it was all right.',
    'They are further apart at nine than they were at eight.',
  ],
  'took-it-badly-and-then-took-it': [
    '{b} said no, walked ten yards, came back, and said all right.',
    'It took two attempts and the second one was {b}’s.',
    '{a} was already gone when {b} decided to accept it.',
    'Pride got about four minutes and then lost.',
    'Neither of them will describe that as an apology being accepted, and it was.',
    '{b} did not say sorry back, which {a} noticed and let go.',
    'It is mended badly, which is still mended.',
    'They are civil by lunch and it is not nothing.',
  ],
  'used-it': [
    '{a} apologised and asked for something in the same breath.',
    'It was sincere and it was also a transaction, and {b} heard both.',
    '{b} accepted the apology and declined the request.',
    'An apology with a condition on it is a deal, and this castle knows the difference.',
    '{a} may not have realised {a} was doing it. {b} noticed anyway.',
    'The words were right and the timing said what the timing said.',
    '{b} will remember the ask longer than the sorry.',
    'It cost {a} more than saying nothing would have.',
  ],
  'apologised-for-the-wrong-thing': [
    '{a} apologised at length for something {b} had not minded.',
    'The actual injury went unmentioned, and {b} was not going to raise it.',
    'It is a generous, useless apology and {b} accepted it without warmth.',
    '{a} thinks this is settled. It is not settled.',
    'They have now had the conversation and cannot have it again.',
    '{b} said "it is fine" about a thing that was fine.',
    'The wrong apology closes the door on the right one.',
    '{a} walked away feeling better, which is the worst outcome available.',
  ],
};

registerEvent({
  id: 'confront-apology-refused',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'morning',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'temperament', 'social', 'intuition'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // There has to be something to apologise FOR: a confrontation these two
    // have already had. This is the only event in the file that requires the
    // family's own thread and will not take a suspicion.
    return findOpenThread(FAMILY, [a, b]) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-apology-refused');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'refused-it': (1 - sb.temperament / 10) * 0.35 + (1 - sb.loyalty / 10) * 0.2,
      'took-it-badly-and-then-took-it': (sb.temperament / 10) * 0.3 + (sb.loyalty / 10) * 0.2,
      'used-it': (sa.strategic / 10) * 0.3 + (1 - sa.loyalty / 10) * 0.15,
      'apologised-for-the-wrong-thing': (1 - sa.intuition / 10) * 0.3 + 0.1,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'refused-it';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'refused-it' ? 'apologised and was told it was not enough'
      : branch === 'took-it-badly-and-then-took-it' ? 'refused an apology and came back for it'
        : branch === 'used-it' ? 'apologised and asked for something in the same breath'
          : 'apologised at length for the wrong thing';
    const note = lineFor(APOLOGY_LINES[branch],
      `confront-apology-refused|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'took-it-badly-and-then-took-it' ? 2
      : branch === 'refused-it' ? -1.5
        : branch === 'used-it' ? -1 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // THE ONE BRANCH IN THIS FAMILY THAT ENDS A STORY. Without it a
    // confrontation arc can only ever escalate, and a castle where nothing is
    // ever mended is a castle with one note in it.
    if (branch === 'took-it-badly-and-then-took-it' && (existing || t)) {
      api.resolveArc((existing || t).id, 'passed-clean', { source: sceneWhy });
    }
    let crowd = null;
    if (branch === 'refused-it') crowd = { name: b, colour: 'cruel', reason: 'was offered a real apology and would not take it', mult: 0.4 };
    else if (branch === 'took-it-badly-and-then-took-it') crowd = { name: b, colour: 'kind', reason: 'came back and took an apology they had refused', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-through-the-door ───────────────────────────────────────────
// night. The argument nobody has to look at each other through — which is
// exactly why people say the thing they would not say to a face.
const THROUGH_DOOR_LINES = {
  'said-the-unsayable': [
    'A closed door makes people brave. {a} said a thing through it that {a} would never say to a face.',
    'It is easier through an inch of oak, and {a} used that.',
    'The worst sentence of the week was delivered to a door handle.',
    '{b} did not open it, and {a} kept talking anyway.',
    'Not having to watch somebody hear it is a kind of permission.',
    '{a} will have to look at {b} at breakfast having said that.',
    'There was no answer from inside, which {a} took as licence to continue.',
    'Whatever that was, it cannot be taken back, and it was not even said to a face.',
  ],
  'never-opened-it': [
    '{a} knocked, talked for a minute, and got nothing.',
    'The door stayed shut and {a} eventually stopped.',
    '{b} was awake. {b} simply decided not to be available.',
    'Being ignored is worse than being argued with and both of them know it.',
    '{a} said the whole thing to a closed door and walked away still holding all of it.',
    'There is no answer to no answer.',
    '{b} listened to every word and gave {a} nothing to work with.',
    'It ended without ending, which is how these get worse.',
  ],
  'opened-it': [
    'The door opened halfway through and the whole tone changed.',
    'It is much harder to say once somebody is standing in front of you, and {a} found that out.',
    '{b} opened it and asked {a} to come in, which took the fight out of it.',
    'Two minutes of shouting and twenty minutes of talking.',
    '{a} had a speech and got a conversation instead.',
    'It went better than either of them had any right to expect at that hour.',
    '{b} chose to hear it properly, which is not nothing.',
    'They both came out of that room lighter than they went in.',
  ],
  'wrong-door': [
    '{a} had that argument at the wrong door and somebody else heard all of it.',
    'Stone corridors and identical doors at one in the morning.',
    'A third person now knows exactly what {a} thinks of {b}, and {b} does not.',
    '{a} realised halfway through and could not stop.',
    'It is a very specific kind of humiliation and {a} is living in it.',
    'The person on the other side of that door will remember every word.',
    '{b} slept through the entire thing.',
    'By breakfast the wrong person is holding this and has decided what to do with it.',
  ],
};

registerEvent({
  id: 'confront-through-the-door',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'night',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'temperament', 'social', 'intuition'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    if (!t && getBond(a, b) > -3) return 0;
    return t ? 2 : 0.8;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-through-the-door');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'said-the-unsayable': (1 - sa.temperament / 10) * 0.35 + (1 - sa.social / 10) * 0.15,
      'never-opened-it': (sb.temperament / 10) * 0.3 + (1 - sb.boldness / 10) * 0.2,
      'opened-it': (sb.boldness / 10) * 0.3 + (sb.social / 10) * 0.2,
      'wrong-door': 0.12,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'said-the-unsayable';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'said-the-unsayable' ? 'said it through a closed door instead of to a face'
      : branch === 'never-opened-it' ? 'talked at a door that never opened'
        : branch === 'opened-it' ? 'was let in halfway through'
          : 'had the argument at the wrong door';
    const note = lineFor(THROUGH_DOOR_LINES[branch],
      `confront-through-the-door|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'opened-it' ? 1.5
      : branch === 'wrong-door' ? -0.5
        : branch === 'never-opened-it' ? -2 : -3;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // NO CROWD ON ANY BRANCH. Same reason as `confront-in-the-corridor`: the
    // country did not see this one either, and the whole premise of the
    // `wrong-door` branch is that exactly one unintended person did.
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta };
  },
});

// ── confront-the-empty-chair ────────────────────────────────────────────
// after-table. Not about who voted how — about whether the room got it
// RIGHT, argued over the seat of the person who has just gone.
const EMPTY_CHAIR_LINES = {
  'we-got-it-wrong': [
    '{a} says out loud what half the room is thinking: that was a mistake.',
    '{a} tells the room they have just sent home a Faithful, and the room does not want to hear it.',
    'Saying it does not undo it and {a} says it anyway.',
    '{b} tells {a} there is no point in this, and there is not, and {a} keeps going.',
    'The chair is still pulled out and {a} is standing behind it making the case.',
    'Nobody in that room can prove {a} wrong and nobody wants {a} right.',
    'It is the first honest thing said since the vote and it lands badly.',
    '{a} is grieving out loud and it is coming out as an accusation.',
  ],
  'you-drove-it': [
    '{a} puts it squarely on {b}: that was {b}’s name in the room all afternoon.',
    '"That was you," says {a}. "That was your idea and you know it."',
    'Somebody always gets blamed for a bad banishment and {b} has just been chosen.',
    '{b} points out that everybody voted. {a} points out who spoke first.',
    'The distinction between voting for something and building it is small and {a} is standing on it.',
    '{b} did not hold the pen. {b} did write the sentence.',
    'It is the accusation that follows every wrong result, and tonight it has {b}’s name on it.',
    '{a} has decided who is responsible and is not taking submissions.',
  ],
  'defended-the-room': [
    '{b} says the room did the best it could with what it had, and means it.',
    '{b} points out there was nothing else to go on, which is true and is no comfort.',
    'Somebody has to say the room is not a mob and {b} does it.',
    '{a} does not accept it. Several people nearby quietly do.',
    'It is a decent argument made at the worst possible hour.',
    '{b} is defending everybody at that table, including the two who do not deserve it.',
    'The Traitors in that room heard {b} defend them and said nothing.',
    'It steadies the room and it costs {b} something with {a}.',
  ],
  'nobody-said-anything': [
    'The argument that should have happened did not, and the chair stayed where it was.',
    '{a} opened {a}’s mouth, looked at the chair, and let it go.',
    'They cleared the room instead, which is easier than the conversation.',
    'Everybody had the same thought and nobody was going to be first.',
    'It will be said tomorrow, badly, by somebody less careful.',
    '{a} and {b} looked at each other and both decided not to.',
    'A room can decide to be quiet, and this one did.',
    'The silence after a wrong banishment is its own verdict.',
  ],
};

registerEvent({
  id: 'confront-the-empty-chair',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'after-table',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'boldness', 'social', 'temperament'],
    relationship: ['neutral', 'rival', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b])
      || findOpenThread('grief', [a, b]);
    if (!t && getBond(a, b) > -1) return 0;
    return t ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-the-empty-chair');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'we-got-it-wrong': (sa.loyalty / 10) * 0.3 + (sa.boldness / 10) * 0.2,
      'you-drove-it': (sa.boldness / 10) * 0.3 + (sb.strategic / 10) * 0.2,
      'defended-the-room': (sb.social / 10) * 0.3 + (sb.temperament / 10) * 0.2,
      'nobody-said-anything': (1 - sa.boldness / 10) * 0.3 + 0.1,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'we-got-it-wrong';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'we-got-it-wrong' ? 'said out loud that the room had got it wrong'
      : branch === 'you-drove-it' ? 'put the banishment squarely on one person'
        : branch === 'defended-the-room' ? 'defended the room against the accusation'
          : 'swallowed it and cleared the room instead';
    const note = lineFor(EMPTY_CHAIR_LINES[branch],
      `confront-the-empty-chair|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'you-drove-it' ? -2.5
      : branch === 'we-got-it-wrong' ? -1
        : branch === 'defended-the-room' ? -0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'we-got-it-wrong') crowd = { name: a, colour: 'wronged', reason: 'stood behind an empty chair and said the room had got it wrong', mult: 0.5 };
    else if (branch === 'defended-the-room') crowd = { name: b, colour: 'kind', reason: 'defended the room on the worst night it had had', mult: 0.4 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-first-light ────────────────────────────────────────────────
// dawn. Being downstairs before everybody else is a choice, and waiting
// there for one specific person is a different choice.
const FIRST_LIGHT_LINES = {
  'caught-them-alone': [
    '{a} was in the kitchen at six for one reason and {b} walked into it.',
    'There is nowhere to go in an empty kitchen at first light.',
    '{a} had picked the one hour of the day with no witnesses in it.',
    '{b} came down for tea and got a conversation {b} had been avoiding.',
    'No audience means no performance, and it was worse for that.',
    '{a} did not raise a voice once and {b} would have preferred shouting.',
    'By the time anybody else came down it was finished and neither of them said so.',
    'It is the most deliberate thing {a} has done all week.',
  ],
  'somebody-walked-in': [
    'It was going fine until a third person came down for the kettle.',
    'They stopped mid-sentence and started talking about the weather.',
    'The whole thing got about ninety seconds before the castle woke up.',
    'Whoever that was is now certain something is going on between {a} and {b}.',
    'An argument cut off at the knees is worse than one finished.',
    'Both of them will spend the day knowing it is unfinished.',
    '{a} had four things to say and got through one.',
    'The kettle boiled and the conversation did not.',
  ],
  'not-at-this-hour': [
    '{b} said, flatly, that {b} was not doing this before breakfast, and left.',
    'Refusing to have an argument is a way of winning one and {b} knows it.',
    '{a} had prepared for every answer except no.',
    '{b} took a cup of tea and went back upstairs.',
    'It is not cowardice and it does read a little like it.',
    '{a} is left in an empty kitchen holding all of it.',
    '"Not at six in the morning," said {b}, and that was the whole exchange.',
    '{b} will have to have it eventually and has bought a day.',
  ],
  'it-turned-into-breakfast': [
    'The confrontation lasted four minutes and then they made breakfast together.',
    'Something got said early and honestly and it defused rather than detonated.',
    'By seven they were cooking for the whole castle, which nobody expected.',
    '{a} came down to have it out and stayed to help.',
    'First light is a forgiving hour and both of them used it.',
    'The people who came down later found two people who had clearly been talking a long time.',
    'It is the only argument this week that ended with somebody being fed.',
    'Whatever that was, it is settled, and it was settled before anybody saw it.',
  ],
};

registerEvent({
  id: 'confront-first-light',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'dawn',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'temperament', 'social', 'loyalty'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const [a, b] = ctx.actors;
    // Getting up early for somebody needs a live story, the same as going to
    // their door at night does.
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    return t ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-first-light');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'caught-them-alone': (sa.boldness / 10) * 0.3 + (sa.strategic / 10) * 0.2,
      'somebody-walked-in': (ctx.living || []).length >= 8 ? 0.3 : 0.15,
      'not-at-this-hour': (sb.temperament / 10) * 0.3 + (1 - sb.social / 10) * 0.15,
      'it-turned-into-breakfast': ((sa.social + sb.social) / 20) * 0.35,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'caught-them-alone';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'caught-them-alone' ? 'picked the one hour with no witnesses in it'
      : branch === 'somebody-walked-in' ? 'got ninety seconds before the castle woke up'
        : branch === 'not-at-this-hour' ? 'was told it was not happening before breakfast'
          : 'came down to have it out and stayed to cook';
    const note = lineFor(FIRST_LIGHT_LINES[branch],
      `confront-first-light|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'it-turned-into-breakfast' ? 2.5
      : branch === 'not-at-this-hour' ? -1.5
        : branch === 'somebody-walked-in' ? -0.5 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    // The second branch in this family that can END a story rather than only
    // escalate it — see the note on `confront-apology-refused`.
    if (branch === 'it-turned-into-breakfast' && (existing || t)) {
      api.resolveArc((existing || t).id, 'passed-clean', { source: sceneWhy });
    }
    let crowd = null;
    if (branch === 'it-turned-into-breakfast') crowd = { name: a, colour: 'kind', reason: 'came down to have a row and cooked for the castle instead', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ── confront-would-not-walk-with ────────────────────────────────────────
// journey-out. The cut direct. No words at all, done where everybody can
// count who is walking beside whom.
const WOULD_NOT_WALK_LINES = {
  'made-it-obvious': [
    '{a} waited for {b} to pick a side of the column and took the other one.',
    'Nothing was said. Everybody understood it by the second mile.',
    'It is possible to have an entire argument by choosing where to stand.',
    '{a} made sure it was visible, which is the whole point of doing it that way.',
    '{b} clocked it inside a minute and did not give {a} the satisfaction.',
    'The column arranged itself around a fight nobody had had out loud.',
    '{a} would rather walk at the back alone than beside {b}.',
    'A public snub costs nothing to deliver and is very expensive to receive.',
  ],
  'dragged-others-in': [
    '{a} did not just avoid {b}; {a} took two people along.',
    'By the ford there was a side of the column and there was {b}.',
    'It stopped being a falling-out and became an arrangement.',
    'The people {a} recruited did not entirely want to be recruited.',
    'Somebody had to choose who to walk with and everybody noticed the choosing.',
    '{b} walked most of it with nobody, which the rest of them watched happen.',
    'Isolating somebody on a road that long is a deliberate act.',
    'That is the cruellest thing anybody has done this week and not a word of it was said.',
  ],
  'called-out-for-it': [
    'Somebody asked {a}, out loud, what exactly {a} was doing.',
    'A silent snub only works while nobody names it, and it got named.',
    '{a} had no answer ready because {a} had not expected to need one.',
    'Being asked to justify a cold shoulder is worse than being argued with.',
    'The column was not going to let that run the whole way.',
    '{b} did not have to say anything; somebody else did it for {b}.',
    '{a} spent the rest of the walk looking petty rather than dangerous.',
    'It backfired well before they reached the far end.',
  ],
  'closed-the-gap': [
    '{b} simply walked over and fell in beside {a}, which took the whole thing apart.',
    'You cannot snub somebody who refuses to be snubbed.',
    '{b} talked about nothing for a long stretch until {a} answered.',
    'It was the bravest small thing anybody did on that road.',
    '{a} had built a whole afternoon of coldness and {b} dismantled it by walking.',
    'They came back into the castle side by side and nobody quite knows how.',
    '{b} did not mention the snub once, which is what made it work.',
    'Whatever {a} had planned did not survive contact with somebody being decent.',
  ],
};

registerEvent({
  id: 'confront-would-not-walk-with',
  roles: 'initiator-first',
  family: FAMILY,
  window: 'journey-out',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'social', 'temperament', 'loyalty'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // A snub has to be SEEN to be a snub — it needs a column to be seen from.
    if ((ctx.living || []).length < 6) return 0;
    const [a, b] = ctx.actors;
    const t = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    if (!t && getBond(a, b) > -2) return 0;
    return t ? 2 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'confront-would-not-walk-with');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'made-it-obvious': (sa.boldness / 10) * 0.3 + (1 - sa.temperament / 10) * 0.2,
      'dragged-others-in': (sa.social / 10) * 0.3 + (sa.strategic / 10) * 0.2,
      'called-out-for-it': (ctx.living || []).length >= 8 ? 0.28 : 0.14,
      'closed-the-gap': (sb.social / 10) * 0.25 + (sb.loyalty / 10) * 0.2,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
    let roll = rng() * total, branch = 'made-it-obvious';
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }
    const sceneWhy = branch === 'made-it-obvious' ? 'refused to walk on the same side of the column'
      : branch === 'dragged-others-in' ? 'took two others along and left one person walking alone'
        : branch === 'called-out-for-it' ? 'was asked out loud what exactly they were doing'
          : 'had the snub dismantled by somebody who walked over anyway';
    const note = lineFor(WOULD_NOT_WALK_LINES[branch],
      `confront-would-not-walk-with|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'closed-the-gap' ? 1.5
      : branch === 'dragged-others-in' ? -3
        : branch === 'called-out-for-it' ? -1.5 : -2;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const existing = findOpenThread(FAMILY, [a, b]) || findOpenThread('suspicion', [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'dragged-others-in') crowd = { name: a, colour: 'cruel', reason: 'arranged a column so that one person walked the whole way alone', mult: 0.6 };
    else if (branch === 'closed-the-gap') crowd = { name: b, colour: 'heroic', reason: 'walked straight at a public snub and talked through it', mult: 0.5 };
    else if (branch === 'called-out-for-it') crowd = { name: a, colour: 'selfish', reason: 'was asked to explain a cold shoulder and had no answer', mult: 0.4 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: TOPIC, threadId: t?.id || existing?.id || null, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});
