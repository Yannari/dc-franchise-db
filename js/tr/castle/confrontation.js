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
import { findOpenThread } from '../threads.js';
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
