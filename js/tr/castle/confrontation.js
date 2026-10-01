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
    '{a} accuses {b} to {bPos} face, in front of the room.\n{a}: "I think you’re a Traitor."\n{b}: "I’m a Faithful. One hundred percent. Look at me."\n{b} doesn’t blink.',
    '{a} calls {b} out.\n{a}: "Something about you doesn’t add up."\n{b}: "Then add it up out loud. I’ll wait."',
    '{a} goes for {b} in front of everyone.\n{a}: "You’ve been hiding all week."\n{b}: "I’ve been sitting right here. Ask me anything."',
    '{b} holds {a}’s stare.\n{b}: "Say it again. Slower. I’m not going anywhere."\n{a}: "You went quiet the moment the murder came up."\n{b}: "I went quiet because I was listening."\n{a} (to camera): "Not a flicker. Either {bSub}’s innocent or {bSub}’s very good."',
  ],
  cracked: [
    '{a} pushes {b} hard, and {b} starts to come apart.\n{a}: "Where were you last night?"\n{b}: "I was — I was upstairs, I think, I—"\n{a}: "You think?"',
    '{a} won’t let the question go.\n{b}: {say:answer-shaky}\n{a}: "Then why can’t you look at me?"\n{a} (to camera): "Watch the hands. {bPos} hands wouldn’t stay still."',
    '{b} stammers under {a}’s questions.\n{b}: "I don’t — why are you — I’m Faithful!"\n{a}: "Then why are you shaking?"',
    '{a} keeps pressing, and {b}’s answers get smaller.\n{b}: "Can we not do this here?"\n{a}: "No. Here."',
  ],
  turned: [
    '{a} accuses {b}, and {b} turns it round.\n{b}: "Interesting. You’ve accused three people this week. Why so keen?"\n{a}: "Because I’m looking."\n{b}: "Or because you’re hiding."',
    '{b} answers with a question.\n{b}: "Who told you to say my name, {a}?"\n{a}: "Nobody told me. I worked it out."\n{b}: "Worked out what, exactly?"\n{a} (to camera): "Suddenly I was the one answering."',
    '{b} flips it.\n{b}: "That’s exactly what a Traitor would do. Point first."\n{a}: "That’s not—"\n{b}: "Isn’t it?"',
    '{b} goes on the attack.\n{b}: "Where were you when it mattered?"\n{a}: "I was— that’s not the point."\n{b}: "It’s exactly the point."\n{a} can’t answer fast enough.',
  ],
  'blew-up': [
    'It goes from an accusation to a shouting match in four sentences.\n{a}: "You’re lying!"\n{b}: "How dare you!"\n{a}: "Don’t shout at me!"\n{b}: "You started it!"',
    '{a} and {b} lose it completely.\n{b}: "I’m not having this."\n{a}: "You’re having it whether you like it or not."',
    '{a} and {b} are on their feet, shouting.\n{a}: "You’ve been lying since day one!"\n{b}: "And you’ve been guessing since day one!"\n{a} (to camera): "I went too far. So did {b}."',
    '{a} accuses. {b} explodes.\n{b}: "I have done NOTHING!"\n{a}: "Then calm down!"',
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
    'Three or four people question {b} at once, {a} loudest, and {b} doesn’t give.\n{b}: "One at a time. I’ll answer every one of you."\n{a}: "Fine. Where were you?"\n{b}: "Here. With you lot."',
    'The room closes on {b}.\n{b}: "I know what this looks like. I’m still Faithful."\n{a}: "That’s what a Traitor would say."\n{b}: "It’s also what a Faithful would say."',
    '{b} takes every question calmly.\n{a}: "Where were you last night?"\n{b}: "Bed. Same as you. Next question."\n{b} (to camera): "They came for me. I didn’t crack. That’s all I can do."',
    '{a} leads the charge, and {b} stands firm.\n{a}: "Just admit it."\n{b}: "There’s nothing to admit."',
  ],
  crumbled: [
    'The room comes at {b} together, {a} loudest, and {b} stops being able to answer.\n{b}: "I can’t — everyone’s talking at once—"\n{a}: "Just answer the question!"',
    '{b} folds under the weight of it.\n{b}: "Please. Stop."\n{a}: "Just answer the question."\n{a} (to camera): "{b} fell apart. That’s telling."',
    '{a} and the others keep firing questions.\n{b}: {say:answer-shaky}\n{a}: "Try that again. Slower."',
    '{b} goes quiet in the middle of it.\n{a}: "Well? Nothing to say?"\n{b}: "I— give me a second."\n{b} (to camera): "I just froze. Everyone was shouting."',
  ],
  overreached: [
    'The room goes too hard at {b}, {a} in front, and people start to feel for {b}.\n{b}: "Is this really how we treat each other?"\n{a}: "We’re only asking questions."\n{a} (to camera): "We went too far. Now {b} looks like the victim."',
    '{a} leads a pile-on that overshoots.\n{b}: "Five of you, one of me. Brave."\n{a}: "Nobody’s ganging up on you."\n{b}: "Count the chairs pointing at me."',
    'It gets ugly enough that people start feeling sorry for {b}.\n{b}: "Is this how we treat people now?"\n{a}: "We’re just asking."\n{b} (to camera): "They made me look innocent. Thanks, {a}."',
    '{a} pushes too hard.\n{a}: "Admit it!"\nSomebody further down the table tells {a} that’s enough, and {a} sits back.',
  ],
  'turned-it-back': [
    '{b} takes the pile-on, picks the loudest voice, and turns it on {a}.\n{b}: "Why is it always you leading these?"\n{a}: "Because someone has to."\n{b}: "Does someone?"',
    'Cornered, {b} asks {a} one question back, and half the table looks at {a}.\n{b}: "Where were you last night, {a}?"\n{a}: "Asleep. Like you."\n{b}: "Prove it."',
    '{b} deflects onto {a}.\n{b}: "Loudest voice in the room. Every time. Think about that."\n{a}: "Someone has to lead."\n{b}: "Funny who always volunteers."',
    '{b} turns the room on {a}.\n{b}: "Why is it always {a} starting these?"\n{a}: "Because somebody has to!"\n{a} (to camera): {cam:story-close}',
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
    '{a} stands up for {b} when the room is tipping.\n{a}: "No. Stop. I’ve been with {b} every night this week. It’s not {bObj}."\n{b}: "Thank you."',
    '{a} speaks up for {b}, and it lands.\n{a}: "You’re wrong about {b}, and I’ll tell you why."\n{a}: "{b} was with me all night. All of it."',
    '{a} defends {b} plainly.\n{a}: "I’d bet my game on {b}."\n{b}: "Thank you."\n{b} (to camera): "{a} saved me there. I owe {aObj}."',
    '{a} steps in.\n{a}: "Leave {b} alone. You’ve got nothing."\n{b}: "Thank you."\n{a}: "Don’t. It needed saying."',
  ],
  'fell-flat': [
    '{a} speaks up for {b}, and nobody moves.\n{a}: "{b} is Faithful. I know it."\n{b}: "Thanks for trying."\nSilence.\n{a} (to camera): "Nobody bought it."',
    '{a} makes the case for {b}, and the room keeps its face.\n{a}: "I’m telling you, it isn’t {b}."\n{b}: "Leave it, {a}. They’ve decided."\n{b} (to camera): "Nice try, {a}. Didn’t help."',
    '{a} defends {b}, and it goes nowhere.\n{a}: "Come on, it’s {b}!"\n{b}: "Thanks anyway."\nNobody answers.',
    '{a} tries, and fails.\n{a} (to camera): "I said my piece. It changed nothing."',
  ],
  'drew-fire': [
    '{a} stands up for {b}, and the next question is why {a} cares so much.\nSomebody asks {a} why {aSub}’s protecting {b}.\n{a}: "I’m not protecting anyone."\n{b}: "You didn’t have to do that."\n{a}: "Clearly."',
    'Defending {b} costs {a}.\n{a}: "It isn’t {b}. I’d stake my game on it."\n{b}: "Don’t. They’ll come for you too."\n{a} (to camera): "Now they’re looking at both of us. Brilliant."',
    '{a} defends {b}, and the doubt spreads to {aObj}.\n{b}: "You didn’t have to do that."\n{a}: "Clearly."',
    '{a} speaks up, and becomes a target.\n{a} (to camera): {cam:story-close}',
  ],
  'too-late': [
    '{a} finally stands up for {b} as everyone is getting up to leave.\n{a}: "For what it’s worth, it isn’t {b}."\n{a}: "Better late than never."\n{b} (to camera): "Now you tell them."',
    '{a} defends {b} well, ten minutes after the room stopped caring.\n{a}: "I just want to say, about {b}—"\n{b}: "Thanks, {a}."\nNobody looks up. The table has moved on.',
    '{a} speaks up too late.\n{a}: "For the record, I don’t think it’s {b}."\n{b}: "Now you say it."\n{b} (to camera): "Thanks, {a}. Where were you ten minutes ago?"',
    '{a}’s defence of {b} hangs there on its own.\n{a}: "It isn’t {b}, by the way."\n{b}: "You’re a bit late."\n{a} (to camera): "Too slow. Should have said it straight away."',
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
    '{a} waits for the room to go quiet, then puts it to {b}.\n{a}: "I want to ask you something, {b}, in front of everybody."\n{b}: "Go on."\n{a}: "Are you a Traitor?"',
    'No preamble. {a} asks across the table.\n{a}: "Where were you last night?"\nThe hall stops eating.',
    '{a} puts down {aPos} fork.\n{a}: "{b}, I don’t trust you. I want everyone to hear why."\n{b}: "Go on, then. Everyone’s listening."',
    '{a} waits for silence.\n{a}: "Before we go any further. {b}."\n{b}: "Here we go."',
  ],
  'too-raw': [
    '{a} comes at {b} an hour after the murder, and it lands as grief.\n{a}: "They’re gone, and you’re just sitting there eating!"\n{b}: "What do you want me to do?"',
    '{a} is too upset to make a case.\n{a}: "I just — I think it’s you. I don’t know."\nThe room looks away from {a}.',
    '{a} accuses {b} through tears.\n{b}: "I’m sorry you’re upset. It’s not me."\n{a}: "I loved them. And you just sat there eating."',
    '{a}’s accusation comes out as grief.\n{a} (to camera): "I wasn’t ready. I shouldn’t have said anything."',
  ],
  'room-took-sides': [
    'It splits the table down the middle.\n{a}: "It’s {b}."\nHalf the table disagrees out loud, and the other half disagrees with them.\n{b}: "Great. Now we’re all fighting."',
    'Two people back {a} out loud, two back {b}.\n{a}: "It’s {b}."\n{b}: "It isn’t, and you two know it."\n{a} (to camera): "Now I know exactly who’s with who."',
    'The breakfast table takes sides.\n{b}: "So that’s where everyone stands."\n{a}: "It’s not about sides."\n{b}: "It is now."',
    '{a} accuses {b}, and the room divides.\n{a}: "I think it’s you, {b}."\n{b}: "Then say why."\n{b} (to camera): "I learned who my friends are over a boiled egg."',
  ],
  'shut-down': [
    'Three people tell {a} to leave it.\nSomebody tells {a} not at breakfast.\n{a}: "Fine."\nThe morning goes on without the answer.',
    '{b} says "not now", and nobody backs {a} up.\n{b}: "Not now, {a}."\n{a}: "When, then?"\n{b}: "Not over toast."\n{a} (to camera): "They shut me down. That tells me something too."',
    '{a} tries, and the room won’t have it.\n{a}: "But—"\n{b}: "Eat your breakfast."',
    '{a} gets shut down before starting.\n{a} (to camera): {cam:drop-it}',
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
    '{b} doesn’t pretend.\n{b}: "That was me, and here’s why. You went quiet, and quiet scares me."\n{a}: "Fair enough. Wrong, but fair."',
    '{a} asks {b} about the vote, and gets a straight answer.\n{b}: "Yes. I wrote your name. It was a gut call."\n{a}: "A gut call. Right."\n{b}: "You asked."',
    '{b} owns it.\n{b}: "I stand by it."\n{a}: "You could have told me first."\n{a} (to camera): "At least {bSub} said it to my face."',
    '{b} is honest.\n{b}: "I’m not going to lie to you. It was me."\n{a}: "Why?"\n{b}: "Because you went quiet. Quiet scares me."',
  ],
  'blamed-somebody-else': [
    '{b} explains the vote by explaining somebody else’s.\n{b}: "I only wrote it because everyone else was going that way."\n{a}: "So it’s their fault."',
    '{b} passes the blame.\n{b}: "I was told it was you. I went along with it."\n{a}: "Told by who?"',
    '{b} deflects.\n{b}: "Ask the people who started it."\n{a}: "I’m asking about yours."\n{a} (to camera): "Not a single word about {bPos} own vote."',
    '{b} points elsewhere.\n{a}: "Why my name?"\n{b}: "Ask the ones who said it first."\n{a} (to camera): {cam:holding-info}',
  ],
  'would-not-answer': [
    '{a} asks {b} straight out, and {b} won’t explain.\n{b}: "The vote’s the vote."\n{a}: "That’s not an answer."\n{b}: "It’s the only one you’re getting."',
    '{b} refuses to talk about it.\n{b}: "I don’t have to justify myself to you."\n{a}: "Nobody said justify. I said explain."',
    '{b} shuts it down.\n{b}: "Drop it, {a}."\n{a}: "I’m not dropping it."\n{a} (to camera): "Why won’t {bSub} explain? What’s there to hide?"',
    '{b} gives nothing.\n{b}: {say:deny}\n{a}: "That’s not an answer."',
  ],
  'turned-it-on-them': [
    '{a} asks {b} why {bSub} wrote that name, and {b} asks the same back, harder.\n{b}: "Why did YOU write who you wrote?"\n{a}: "That’s not the point."\n{b}: "It’s exactly the point."',
    '{b} attacks {a}’s vote instead.\n{b}: "Your vote made less sense than mine."\n{a}: "We’re talking about yours."',
    '{b} flips it in front of two others.\n{b}: "Let’s talk about your vote, shall we?"\n{a}: "Mine made sense."\n{b}: "Did it?"',
    '{b} turns on {a}.\n{a}: "Why my name?"\n{b}: "Why did you write who you wrote?"\n{a} (to camera): "I asked one question. I got an interrogation."',
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
    'No audience, no performance. {a} says the real thing to {b} outside the bedroom door.\n{a}: "I don’t trust you. I want to, and I don’t."\n{b}: "Thank you for saying it to me first."',
    'With nobody watching, {a} and {b} finally have the honest conversation.\n{b}: "What do you actually think of me?"\n{a}: "Honestly? I don’t know yet."',
    '{a} and {b} speak plainly in the corridor.\n{a}: "I don’t trust you."\n{b}: "Thank you for saying it to me first."\n{a} (to camera): "No cameras in the room. Well, you know what I mean. No people."',
    '{a} tells {b} the truth.\n{a}: "You scare me a bit."\n{b}: "Good. You scare me too."',
  ],
  'cleared-the-air': [
    '{a} and {b} have it out in the corridor, and come out better.\n{a}: "So we’re okay?"\n{b}: "We’re okay."\nThey shake on it.',
    '{a} and {b} say everything, then laugh.\n{b}: "Well, that was intense."\n{a}: "Needed saying."',
    '{a} and {b} clear the air.\n{a}: "So we’re alright?"\n{b}: "We’re alright."\n{b} (to camera): "Feel much better. Honestly."',
    '{a} and {b} end the argument with a hug.\n{a}: "No more of this."\n{b}: "Agreed."',
  ],
  'made-it-worse': [
    'Away from the room, nobody keeps it civil.\n{b}: "You’re pathetic."\n{a}: "And you’re a liar."\n{b}: "Goodnight, {a}."',
    '{a} says something in that corridor {aSub} can’t take back.\n{a} (to camera): "I went too far. I know I did."',
    '{a} and {b} make it worse in private.\n{b}: "I’ll remember that."\n{a}: "Good."',
    'The corridor argument escalates.\n{b}: "Say that again."\n{a}: "You heard me."\n{b} (to camera): "{a} showed me who {aSub} really is tonight."',
  ],
  'nobody-heard-it': [
    'Whatever happens in that corridor stays there.\n{a}: "Keep your voice down."\n{b}: "I am."\nNobody hears a word.',
    '{a} and {b} keep it low.\n{a}: "Keep your voice down."\n{b}: "I am."\n{a} (to camera): "Nobody will know about that. Good."',
    '{a} and {b} whisper their argument.\n{b}: "Not here. Walls have ears."\n{a}: "Then where?"',
    '{a} and {b} settle it quietly.\n{b}: "Done?"\n{a}: "Done."\n{b} (to camera): "What happens in the corridor stays in the corridor."',
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
    '{a} and {b} are still at it when the vans come into view.\n{b}: "Are we doing this all the way there?"\n{a}: "Unless you admit I’m right."',
    'It starts at the gate and is still going at the ford.\n{a}: "And another thing—"\n{b}: "There’s always another thing with you."',
    '{a} and {b} argue for the length of a valley.\n{a}: "And another thing—"\n{b}: "There’s always another thing with you."\n{b} (to camera): "Three miles. The whole three miles."',
    '{a} and {b} can’t stop.\n{a}: "You never listen."\n{b}: "I’m listening now. For the fortieth time."',
  ],
  'ran-out-of-road': [
    '{a} and {b} say the last angry thing by the first gate.\n{a}: "So."\n{b}: "So."\nThree more miles of nothing.',
    'They say everything worth saying in the first half mile, and have four more to walk.\n{a}: "…So."\n{b}: "So."',
    'The argument finishes long before the road.\n{a}: "…So."\n{b}: "So."\n{b} (to camera): "Awkward. Very awkward. Four miles of awkward."',
    '{a} and {b} run out of words.\n{a}: "Nice weather."\n{b}: "Don’t."',
  ],
  'the-column-broke-it-up': [
    'Someone drops back and walks right between {a} and {b}.\n{a}: "We were talking."\n{b}: "We were shouting. Leave it."',
    'Somebody drops back and walks between them, which is the only way to end one of these.\n{a}: "We were talking."\n{b}: "We were shouting."',
    'A third person joins the argument to stop it.\n{a}: "We were talking."\n{b}: "We were shouting."\n{b} (to camera): "Thank God somebody stepped in."',
    'The group breaks it up.\n{a}: "Fine. Later."\n{b}: "Later."',
  ],
  'everybody-heard-it': [
    '{a} raises {aPos} voice without meaning to, and the whole line turns round.\n{a}: "Oh, brilliant."\n{b}: "You started it."',
    'A road carries. Every word reaches the front of the line.\n{a}: "You’re a liar!"\n{b}: "Say it louder, they didn’t hear you at the back!"',
    '{a} and {b} aren’t quiet about it.\n{a}: "Say it to my face!"\n{b}: "I am saying it to your face!"\n{a} (to camera): "Everyone heard. Great."',
    'The whole group hears {a} and {b} going at it.\n{b}: "You never listen!"\n{a}: "I’m listening now!"\n{b} (to camera): "So that’s tonight’s gossip sorted."',
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
// EVERY LINE SAYS WHICH MISSION (the user, 2026-09-30: "they talk about
// the mission before the mission"). This runs on the road OUT to today's, so
// a line that only said "we lost money because of you" read as today's,
// which has not happened. Each one names yesterday's afternoon ({m}), and the
// event only fires when the record says {b} really had a bad moment in it.
const MISSION_BLAME_LINES = {
  'named-the-weak-link': [
    '{a} brings up yesterday on the road.\n{a}: "{m}. It went wrong at you, {b}. You froze."\n{b}: "Wow."\n{a}: "Somebody had to say it."',
    '{a} has not let {m} go.\n{a}: "We lost money yesterday because of you."\n{b}: "Thanks for that."',
    '{a} names {b} as yesterday’s weak link.\n{a}: "At {m}, we lost it at your bit. Everyone saw."\n{b}: "Thanks for that."\n{b} (to camera): "In front of everyone. Lovely."',
    '{a} doesn’t hold back.\n{a}: "You were the problem at {m} yesterday. Don’t be the problem today."',
  ],
  'took-the-blame': [
    '{b} doesn’t argue.\n{b}: "Yesterday was me. I’m sorry. Let me make it up today."\n{a}: "…Oh. Okay."',
    '{b} agrees before {a} finishes.\n{b}: "You’re right. I messed up {m}."\n{a}: "…Oh. Right. Okay."\n{a} (to camera): "Didn’t expect that. Took the wind out of me."',
    '{b} owns yesterday.\n{b}: "{m} was my fault. Fully. It won’t happen today."\n{a}: "Well. Thanks for saying it."',
    '{b} apologises for yesterday.\n{b}: "I let everyone down at {m}."\n{a}: "It happens. Just not twice."',
  ],
  'blamed-them-back': [
    '{b} remembers {m} differently.\n{b}: "Where were you yesterday, though? Because I didn’t see you."\n{a}: "I was—"\n{b}: "Exactly."',
    '{a} blames {b} for yesterday, {b} blames {a}.\n{b}: "Pot, kettle."\n{a}: "Oh, please."',
    '{b} fights back.\n{b}: "Where were you when {m} went wrong?"\n{a}: "That’s not the point."\n{b} (to camera): "{a} wants to blame me? {a} did nothing yesterday."',
    '{a} and {b} blame each other for yesterday.\n{a}: "You froze."\n{b}: "You wandered off!"\n{a} (to camera): "Probably both of us, honestly."',
  ],
  'nobody-backed-it': [
    '{a} looks round for support after blaming {b} for yesterday. Nobody meets {aPos} eye.\n{b}: "Seems it’s just you, then."\n{a}: "They’re just being polite."',
    '{a} says it, and nobody picks it up.\n{a}: "{m} was {b}’s fault."\nSilence.\n{a} (to camera): "Left hanging. Great."',
    'Nobody agrees with {a} about yesterday, out loud.\n{a} (to camera): "They were thinking it. They just wouldn’t say it."',
    '{a} blames {b} for {m}, alone.\n{b}: "Nobody agrees with you, {a}."\n{a}: "They will."',
  ],
};

// THE SAME ARGUMENT WITH NOTHING BEHIND IT: about today's mission, which has
// not happened, so nobody can be blamed for it — only not wanted.
const MISSION_TODAY_LINES = {
  'named-the-weak-link': [
    '{a} says it on the road, loud enough.\n{a}: "Whatever it is today, I don’t want {b} on my team."\n{b}: "Wow."\n{a}: "Somebody had to say it."',
    '{a}: "If today needs anyone fast, it isn’t {b}."\n{b}: "Thanks for that."',
  ],
  'took-the-blame': [
    '{b} gets in first.\n{b}: "I know I’ve been quiet on the missions. Today I’ll pull my weight."\n{a}: "…Oh. Okay."',
    '{b}: "Put me wherever you need me today. I mean it."\n{a}: "Well. Thanks for saying it."',
  ],
  'blamed-them-back': [
    '{a}: "Just don’t slow us down today, {b}."\n{b}: "Worry about yourself."\n{a}: "I am."',
    '{a} starts on {b} before the van has stopped.\n{b}: "We haven’t even started yet!"\n{a} (to camera): "Fair point. I still mean it."',
  ],
  'nobody-backed-it': [
    '{a}: "Bet you {b} is the weak link today."\nNobody takes the bet.\n{a} (to camera): "Left hanging. Great."',
    '{a} tries to start something about today’s teams. Nobody joins in.\n{b}: "Seems it’s just you, then."',
  ],
};

// WHAT TODAY HOLDS, said on the same road: what they expect from the mission
// they are driving to, which is the only thing about it anybody can know yet.
const MISSION_AHEAD_LINES = [
  '{a}: "Whatever it is today, I’m not standing next to {b}."\n{b}: "Suits me."',
  '{a}: "If it’s anything like {m}, I want to be on a different team from {b}."\n{b} (to camera): "Charming."',
  '{a}: "Just don’t freeze today, {b}. That’s all I’m asking."\n{b}: "Noted."',
];

/** Yesterday's mission, and whether {name} had a bad moment in it, off the record. */
export function _yesterdaysMission(ep, name, other) {
  const ms = (gs.tr && gs.tr.missions) || [];
  const m = [...ms].reverse().find(x => x && x.ep != null && x.ep < ep);
  if (!m) return null;
  const teamOf = n => (m.teams || []).find(t => (t.members || []).includes(n));
  const tb = teamOf(name), ta = teamOf(other);
  if (!tb || !ta || tb !== ta) return null;           // you blame a teammate, not a rival
  // a themed afternoon records each beat: a bad one by {name}
  const BAD = /weak|freeze|wrong|lost|out|bad|lose|stop|dull/;
  const beats = (m.phases || []).flatMap(p => p.beats || []);
  if (beats.length) return beats.some(x => x.player === name && BAD.test(String(x.kind))) ? m : null;
  // an archetype afternoon records the team: theirs had to be the losing side
  const other2 = (m.teams || []).find(t => t !== tb);
  return other2 && Number(tb.perf) < Number(other2.perf) ? m : null;
}

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
    // NOT gated on the mission record: what fires must not depend on which
    // missions ran (tests/tr-missions.test.js plays seasons with the money
    // missions on and off and asks for bit-identical castles). The record
    // decides the WORDS instead — see fire().
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
    // GROUNDED OR NOT: when the record says {b} really had a bad moment in
    // yesterday's mission on {a}'s team, it is blame for yesterday; when it
    // does not, nobody can be blamed for anything, and the same argument is
    // about TODAY's — who {a} does not want beside them. Words only: the
    // branch, the bond and the stream are the same either way.
    const ym = _yesterdaysMission(ctx.ep, b, a);
    const mName = (ym && ym.name) || 'yesterday';
    let note = ym
      ? lineFor(MISSION_BLAME_LINES[branch], `confront-blamed-for-the-mission|${branch}|${ctx.ep}`, { a, b, m: mName })
      : lineFor(MISSION_TODAY_LINES[branch], `confront-today|${branch}|${ctx.ep}`, { a, b });
    // and, now and then, where it goes next: what they expect from today's
    // (a hash, not a draw: an extra rng() here would shift every later scene)
    const hk = [...(a + '|' + b + '|' + ctx.ep)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
    if (branch !== 'took-the-blame' && hk % 100 < 35) {
      note += '\n' + lineFor(MISSION_AHEAD_LINES, `confront-blamed-ahead|${ctx.ep}`, { a, b, m: mName });
    }
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
    '{a} stops {b} on the stairs.\n{a}: "You promised me. On this step. Two days ago."\n{b}: "I remember."',
    '{a} reminds {b}, quietly and exactly, what {bSub} promised.\n{a}: "You said you’d never write my name. Your words."\n{b}: "I know what I said."',
    '{a} quotes {b} back to {bObj}.\n{a}: "You said, and I quote, ‘I’ve got you.’"\n{a}: "Well?"\n{b} has no answer.',
    '{a} confronts {b} with {bPos} promise.\n{a}: "You gave me your word."\n{b}: "Things changed."',
  ],
  'denied-saying-it': [
    '{a} repeats {b}’s promise word for word.\n{b}: "I never said that."\n{a}: "You said it with your hand on my arm."',
    '{b} says {bSub} never promised that, with a straight face.\n{b}: "I never said that."\n{a}: "You did. On the stairs."\n{b}: "You must have misheard."',
    '{b} denies the promise.\n{a}: "You promised me."\n{b}: "I never promised anything."\n{a} (to camera): "{b} is rewriting history. I was there."',
    '{b} flatly denies it.\n{b}: {say:deny}\n{a}: "I was there, {b}."',
  ],
  'had-a-reason': [
    '{b} doesn’t pretend.\n{b}: "I broke it because keeping it would have sent me home."\n{a}: "At least you’re honest about it."',
    '{b} has a reason, and it’s a good one.\n{b}: "If I’d kept it, I’d be gone. I had to."\n{a}: "So I’m just collateral."\n{b}: "I’m sorry."',
    '{b} explains why.\n{b}: "Keeping that promise would have cost me the game."\n{a}: "So I was just in the way."\n{b}: "You were in the way of me going home."',
    '{b} is honest about breaking it.\n{a}: "You broke your word."\n{b}: "I did. And I’d do it again."\n{b} (to camera): "I broke my word. I’d do it again."',
  ],
  'threw-it-back': [
    '{b} counts on {bPos} fingers.\n{b}: "You promised me the vote on day two. And on day three."\n{a}: "That’s different."\n{b}: "It never is."',
    '{b} lists the two things {a} promised and didn’t do.\n{b}: "Shall we talk about your promises? Because I can."\n{a}: "That’s different."',
    '{b} throws it back.\n{b}: "You broke yours first."\n{a}: "That’s not true."\n{b}: "Day two. Remember?"',
    '{b} turns it around.\n{b}: "What about your promises?"\n{a}: "We’re talking about yours."\n{a} (to camera): "Somehow it became about me."',
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
    '{b} turns round in the corridor.\n{b}: "Stop following me, {a}."\n{a}: "I’m going to my room."\n{b}: "Your room’s the other way."',
    '{b} tells {a} to stop watching {bObj}.\n{b}: "Every time I turn round, you’re there."\n{a}: "And?"\n{b}: "Stop it."',
    '{b} confronts {a}.\n{b}: "Why are you following me?"\n{a}: "I’m not."',
    '{b} has had enough.\n{b}: "Back off, {a}."\n{a}: "I’m just walking."\n{b}: "Walk somewhere else."',
  ],
  'made-it-worse-for-them': [
    '{b} snaps at {a} for watching {bObj}, loudly.\n{a}: "Touchy."\n{a} (to camera): "Why mind being watched, unless you’ve something to hide?"',
    '{b} complains about being watched, and looks like someone who minds.\n{b}: "Stop following me!"\n{a} (to camera): "Why would an innocent person care?"',
    '{b} objects too loudly.\n{a}: "Nervous, are we?"\n{b}: "No!"',
    '{b}’s complaint backfires.\n{b}: "Stop watching me!"\n{a}: "Why? What am I going to see?"\n{b} (to camera): "I shouldn’t have said anything."',
  ],
  'admitted-it': [
    '{b} asks, and {a} doesn’t deny it.\n{a}: "Yes. I’m watching you."\n{b}: "Why?"\n{a}: "You tell me."',
    '{a} doesn’t deny it.\n{a}: "Yes, I’ve been watching you. You know why."\n{b}: "I really don’t."\n{a}: "Then you’ve nothing to worry about."',
    '{a} admits it straight out.\n{a}: "I’m keeping an eye on you. Get used to it."',
    '{a} owns the watching.\n{b}: "Why are you always behind me?"\n{a}: "Because I’m watching you. You know why."\n{a} (to camera): "I told {b} straight. I’m watching."',
  ],
  'both-embarrassed': [
    '{b} complains, {a} protests, and both trail off.\n{a}: "I didn’t mean—"\n{b}: "No, I know, I just—"\nNeither finishes.',
    'It comes out wrong, and neither knows how to end it.\n{b}: "I just meant—"\n{a}: "No, I get it—"\n{b}: "Okay."\n{a}: "Okay."',
    '{a} and {b} have an awkward two minutes in front of four people.\n{b}: "I just meant—"\n{a}: "No, I know, I—"\n{b}: "Okay."\n{b} (to camera): "Cringe. Absolute cringe."',
    'It turns awkward fast.\n{a}: "Shall we just forget that?"\n{b}: "Please."',
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
    '{a} follows {b} into the boot room, still talking.\n{b}: "Take your boots off, at least."\n{a}: "I’m not finished."',
    'It started at the ford, and it’s still going in the boot room.\n{a}: "We’re not done."\n{b}: "We’re inside now, {a}."\n{a}: "So?"',
    '{a} follows {b} through the door, still talking.\n{a}: "We’re not done."\n{b}: "We’re inside, {a}!"\n{b} (to camera): "The whole castle heard. Thanks, {a}."',
    '{a} and {b} bring the row inside.\n{b}: "Can we not do this in front of everyone?"\n{a}: "Then stop walking away."',
  ],
  'dropped-it-at-the-gate': [
    '{a} stops at the gate.\n{a}: "Leave it out here?"\n{b}: "Leave it out here."',
    'Whatever that was on the road, {a} and {b} leave it outside the gate.\n{a}: "Leave it out here?"\n{b}: "Leave it out here."',
    '{a} and {b} come in separately and say nothing.\n{a}: "Leave it at the gate?"\n{b}: "Leave it at the gate."\n{a} (to camera): "Done. Out there it stays."',
    '{a} and {b} let it go at the gate.\n{a}: "Not a word inside."\n{b}: "Not a word."\n{b} (to camera): "Nobody inside needs to know."',
  ],
  'somebody-else-carried-it': [
    '{a} walks into the kitchen to find the row already there.\n{a}: "Who told you?"\nNobody owns up.',
    'Neither {a} nor {b} mentions it inside. Somebody walking behind them does.\n{b}: "Who told them?"\n{a}: "Not me."',
    'The row reaches the castle before they do.\n{a} (to camera): "Someone was listening. Of course they were."',
    '{a} and {b} find out everyone already knows.\n{b}: "So much for keeping it quiet."\n{a}: "Who told them?"\n{b}: "Does it matter?"',
  ],
  'one-of-them-apologised': [
    '{a} catches up with {b} on the drive.\n{a}: "That was out of order. Sorry."\n{b}: "Yeah. Me too."',
    'Halfway up the drive, {a} says sorry, and means it.\n{a}: "I’m sorry. I was out of order."\n{b}: "We both were."',
    '{a} apologises before the gate.\n{a}: "I’m sorry. I was out of order."\n{b}: "Yeah. So was I."\n{b} (to camera): "Didn’t expect that. Respect."',
    'It ends better than it should.\n{a}: "Friends?"\n{b}: "Friends."',
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
    '{a} corners {b} after the table.\n{a}: "Not one word, while they took them apart."\n{b}: "I froze."',
    '{a} wants to know why {b} sat there and said nothing.\n{a}: "You were their friend, and you didn’t open your mouth."\n{b}: "What was I supposed to say?"\n{a}: "Anything."',
    '{a} confronts {b} about the silence.\n{a}: "You let it happen."\n{b}: "I didn’t know what to do."',
    '{a} is angry with {b}.\n{a}: "You didn’t say a word for them."\n{b}: "What was I meant to say?"\n{a} (to camera): "Not one word. Not one."',
  ],
  'saved-themselves': [
    '{a} doesn’t soften it.\n{a}: "You kept your head down so it wouldn’t be yours."\n{b}: "Wouldn’t you?"',
    '{a} says it plainly.\n{a}: "You went quiet to stay safe."\n{b}: "That’s not fair."\n{a}: "Isn’t it?"',
    '{a} accuses {b} of self-preservation.\n{a}: "You saw where it was going and you got out of the way."\n{b}: "That’s not fair."\n{a}: "Isn’t it?"',
    '{a} calls it out.\n{a}: "You kept quiet to save yourself."\n{b}: "…Yes."\n{b} (to camera): "{a}’s right. I hate that {a}’s right."',
  ],
  'turned-it-on-the-accuser': [
    '{b} looks {a} in the eye.\n{b}: "And what did you say, exactly?"\n{a} has no answer.',
    '{b} points out, evenly, that {a} didn’t speak up either.\n{b}: "Where were you?"\n{a} has nothing.',
    '{b} turns it around.\n{b}: "You were sitting right there too."\n{a}: "I know. That’s why I’m angry."',
    '{b} deflects.\n{b}: "And you? What did you say?"\n{a}: "…Nothing."\n{a} (to camera): "Fair point. Horrible, but fair."',
  ],
  'both-admitted-it': [
    '{a} and {b} sit on the stairs.\n{a}: "We let it happen."\n{b}: "We did."',
    'They stand in the corridor and admit they both let it happen.\n{a}: "We should have said something."\n{b}: "I know. I know."',
    '{a} and {b} are honest at midnight.\n{b}: "I was scared."\n{a}: "So was I."',
    '{a} and {b} share the guilt.\n{a}: "We should have said something."\n{b}: "I know. I know."\n{a} (to camera): "We both failed them. We both know it."',
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
    '{a} is sitting on {b}’s bed when {b} comes in.\n{b}: "Get out of my room."\n{a}: "After you’ve answered me."',
    '{a} sits in the dark for an hour, waiting for {b}.\n{b}: "Jesus! You scared me."\n{a}: "We need to talk."',
    '{a} has been waiting since eleven.\n{a}: "Sit down. I’ve got things to say."\n{b}: "At this hour?"',
    '{a} ambushes {b} on the landing.\n{a}: "I couldn’t sleep until I said this."\n{b}: "At two in the morning?"\n{a}: "Especially at two in the morning."',
  ],
  'lost-their-nerve': [
    '{a} waits an hour on the landing, then just says goodnight.\n{b}: "Were you waiting for me?"\n{a}: "No. Night."',
    '{a} waits up, rehearses it, and says goodnight.\n{b}: "You’re up late."\n{a}: "Couldn’t sleep. Night."\n{a} (to camera): "Bottled it. Completely."',
    '{a} loses {aPos} nerve.\n{a} (to camera): "Had the whole speech ready. Nothing came out."',
    '{a} lets {b} walk past.\n{a} (to camera): {cam:drop-it}',
  ],
  'they-were-ready-too': [
    '{b} walks straight up to {a} in the dark.\n{b}: "I know why you’re up. Go on, then."\n{a}: "You knew I’d be here."\n{b}: "I’d have been here too."',
    '{b} has been expecting it and has an answer ready.\n{a}: "We need to talk."\n{b}: "I know. I’ve been waiting for you to say that."',
    'Two people who both rehearsed, meeting at midnight.\n{b}: "Go on then. I’m ready."\n{a}: "You first."',
    '{b} is ready for {a}.\n{a}: "Where were you?"\n{b}: "Bed by eleven. Ask anyone. Next."\n{a} (to camera): "{b} had an answer for everything. Rehearsed."',
  ],
  'woke-the-corridor': [
    '{a} and {b} forget where they are.\n{a}: "LIAR!"\nA door opens down the corridor.\n{b}: "Well done."',
    'It gets loud enough that two doors open.\n{a}: "You’re a liar!"\n{b}: "Keep your voice down!"\nSomebody shouts from behind a door that people are trying to sleep.',
    'The midnight argument wakes the corridor.\n{a}: "Liar!"\n{b}: "Keep it down!"\n{b} (to camera): "Everyone heard. At one in the morning."',
    '{a} and {b} forget how sound carries in stone.\n{a}: "You’re a liar!"\n{b}: "Shh! Everyone can hear!"\n{a} (to camera): "Oops."',
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
    '{a} apologises, and {b} looks at {aObj} for a long time.\n{b}: "No."\n{a}: "No?"\n{b}: "Not yet."',
    '{a} apologises properly, and {b} doesn’t take it.\n{a}: "I’m sorry. I mean it."\n{b}: "I’m not going to pretend that’s enough."',
    '{b} turns down the apology.\n{b}: "Sorry doesn’t fix it."\n{a}: "What would, then?"\n{a} (to camera): "I tried. That’s all I can do."',
    '{b} won’t accept it.\n{b}: "Not yet. Maybe not ever."\n{a}: "I understand."',
  ],
  'took-it-badly-and-then-took-it': [
    '{b} walks off, then comes back.\n{b}: "Fine. I accept it. I’m still annoyed."\n{a}: "That’s fair."',
    '{b} says no, walks ten yards, comes back, and says alright.\n{b}: "No."\n{b} gets as far as the stairs, then turns round.\n{b}: "Fine. Alright. Apology accepted."',
    '{b} takes two goes.\n{b}: "No."\n{a}: "Okay."\n{b}: "…Fine. Yes. Apology accepted."\n{b} (to camera): "I needed a minute. Then I forgave {aObj}."',
    '{b} refuses, then relents.\n{b}: "Oh, come here."\n{a}: "Friends?"',
  ],
  'used-it': [
    '{a} apologises and keeps going.\n{a}: "I’m sorry. So can I count on you tonight?"\n{b}: "Wow. There it is."',
    '{a} apologises and asks for something in the same breath.\n{a}: "I’m sorry. And I need your vote tonight."\n{b}: "Wow. Smooth."',
    '{a}’s apology comes with a condition.\n{a}: "I’m sorry. And I need your vote tonight."\n{b}: "Wow. Smooth."\n{b} (to camera): "Sincere, and a deal. Both at once."',
    '{a} says sorry, then makes an ask.\n{b}: "So that’s what this was."\n{a}: "It’s both. I’m sorry and I need you."',
  ],
  'apologised-for-the-wrong-thing': [
    '{a} apologises for the shouting.\n{b}: "The shouting was fine. It was what you said after."\n{a}: "…Oh."',
    '{a} apologises at length for something {b} didn’t mind.\n{a}: "I’m so sorry about the other night."\n{b}: "That? I didn’t care about that."\n{b} (to camera): "{a} still doesn’t know what actually hurt."',
    '{a} misses the point entirely.\n{b}: "Thanks. I suppose."\n{a}: "Are we okay now?"',
    '{a} says sorry for the wrong thing.\n{a}: "I’m sorry I shouted."\n{b}: "The shouting was fine."\n{b} (to camera): "I wasn’t going to explain it to {aObj}."',
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
    '{a} talks to {b}’s closed door.\n{a}: "I know what you are. I just can’t prove it."\nNothing from inside.',
    'A closed door makes people brave.\n{a}: "I know what you are, {b}. I know."\nNo answer from inside.',
    '{a} says through the door what {aSub} would never say to {bPos} face.\n{a} (to camera): "Easier through an inch of wood."',
    '{a} talks to the closed door.\n{a}: "You don’t fool me. You never have."',
  ],
  'never-opened-it': [
    '{a} knocks twice.\n{a}: "{b}, please."\nThe door stays shut.',
    '{a} knocks, talks for a minute, and gets nothing.\n{a}: "{b}? I know you’re in there."\nSilence.',
    'The door stays shut.\n{a}: "{b}? I just want to talk."\n{a} (to camera): "{b} wouldn’t even open the door."',
    '{a} gives up.\n{a}: "Fine. Tomorrow."',
  ],
  'opened-it': [
    'The door swings open mid-sentence.\n{b}: "Say that again. To my face."\n{a}: "…I said we should talk."',
    'The door opens halfway through, and the tone changes.\n{b}: "Say it to my face."\n{a}: "…I just wanted to talk."',
    '{b} opens the door.\n{b}: "You were saying?"\n{a}: "…I just wanted to talk."\n{a} (to camera): "Much harder once {bSub}’s standing there."',
    '{b} appears in the doorway.\n{b}: "Well? Go on."\n{a}: "…I just wanted to talk."',
  ],
  'wrong-door': [
    '{a} realises halfway through that it’s the wrong door.\n{a}: "Sorry. Carry on sleeping."\n{a} (to camera): "Mortifying."',
    '{a} has the argument at the wrong door.\n{a}: "…Oh. Sorry. Wrong room."\nSomebody else heard all of it.',
    '{a} knocks on the wrong door.\n{a} (to camera): "Identical doors. One in the morning. Disaster."',
    'The wrong person opens the door.\n{a}: "Is {b} in there?"\nThe answer is no, and whoever it is heard every word.',
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
    '{a} looks at the empty chair and says it.\n{a}: "That was a Faithful. We did that."\n{b}: "We know."',
    '{a} says it out loud.\n{a}: "We just sent home a Faithful."\n{b}: "We know, {a}."\n{a}: "Do we? Because nobody’s saying it."',
    '{a} tells the room they made a mistake.\n{a}: "That was wrong. We were wrong."',
    '{a} confronts the room.\n{a} (to camera): {cam:was-wrong}',
  ],
  'you-drove-it': [
    '{a} points at {b}.\n{a}: "You said that name first, and you said it all afternoon."\n{b}: "And you wrote it."',
    '{a} puts it on {b}.\n{a}: "That was you. Your idea, all afternoon."\n{b}: "We all wrote it!"\n{a}: "Because you pushed."',
    '{a} blames {b} directly.\n{a}: "You led us there."\n{b}: "We all wrote it!"\n{a}: "Because you said it first."',
    '{a} won’t let {b} hide.\n{a}: "That was your name all afternoon."\n{b}: "And half the table went with it!"\n{b} (to camera): "Now it’s my fault? Everyone voted."',
  ],
  'defended-the-room': [
    '{b} won’t apologise for the vote.\n{b}: "We had nothing better. We still don’t."\n{a}: "That’s not a comfort."',
    '{b} says the room did its best.\n{b}: "We had nothing else to go on."\n{a}: "That’s no comfort."',
    '{b} defends the vote.\n{b}: "With what we knew, it made sense."\n{a}: "It didn’t make sense. It made noise."',
    '{b} won’t apologise for the room.\n{a}: "We sent home a Faithful."\n{b}: "With what we had, I’d do it again."\n{b} (to camera): "We played the evidence. The evidence was wrong."',
  ],
  'nobody-said-anything': [
    '{a} and {b} sit looking at the empty chair.\n{b}: "Say it."\n{a}: "No. You say it."\nNeither does.',
    '{a} opens {aPos} mouth, looks at the chair, and lets it go.\n{a} (to camera): {cam:drop-it}',
    'The argument that should happen doesn’t.\n{a} (to camera): "Nobody wanted to say it. So nobody did."',
    '{a} stays silent.\n{a} (to camera): {cam:vote-cost}',
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
    '{b} walks into the kitchen at six and finds {a} waiting.\n{a}: "Kettle’s on. Sit down."\n{b}: "This is an ambush."',
    '{a} is in the kitchen at six, and {b} walks into it.\n{a}: "Morning. Sit down."\n{b}: "At six?"\n{a}: "At six."',
    '{a} catches {b} alone at first light.\n{a}: "Nobody else is up. Good. We need to talk."\n{b}: "It’s six in the morning."',
    '{a} has been waiting in the kitchen.\n{a}: "Sit down."\n{b}: "At six?"\n{b} (to camera): "Nowhere to go. Nowhere to hide."',
  ],
  'somebody-walked-in': [
    '{a} is halfway through when footsteps come down the stairs.\n{a}: "…and that’s how you make porridge."\n{b}: "Fascinating."',
    'It’s going fine until a third person comes down for the kettle.\n{a}: "—so what I’m saying is—"\n{b}: "Lovely weather!"\n{a}: "Gorgeous."',
    '{a} and {b} stop mid-sentence.\n{a}: "—and that’s why I think—"\n{b}: "Morning!"\n{a} (to camera): "Interrupted. We’ll finish it later."',
    'Someone walks in on {a} and {b}.\n{b}: "Tea, anyone?"\n{a}: "Lovely weather."',
  ],
  'not-at-this-hour': [
    '{b} doesn’t even sit down.\n{b}: "It’s six in the morning, {a}."\n{a}: "It’s important."\n{b}: "So is sleep."',
    '{b} says flatly that {bSub} is not doing this before breakfast.\n{b}: "Not at this hour."\n{b} leaves.',
    '{b} refuses to engage.\n{b}: "Talk to me after coffee."\n{a}: "It can’t wait."\n{b}: "It can."\n{a} (to camera): "Refusing is a way of winning. {b} knows that."',
    '{b} walks out.\n{b}: "No."',
  ],
  'it-turned-into-breakfast': [
    '{a} and {b} are still talking when the eggs are done.\n{b}: "We should fight more often. You cook when you’re guilty."\n{a}: "I’m not guilty. I’m hungry."',
    'The confrontation lasts four minutes, then they make breakfast together.\n{a}: "Toast?"\n{b}: "Go on then."',
    'Something gets said early and honestly, and it defuses.\n{b}: "Fair enough. I get it."\n{a}: "Eggs?"',
    '{a} and {b} end up cooking together.\n{a}: "Toast?"\n{b}: "Go on, then."\n{a} (to camera): "Came down for a fight. Got breakfast."',
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
    '{b} falls in beside {a}, and {a} crosses to the other side of the track.\n{b}: "Subtle."\n{a}: "I just like this side."',
    '{a} waits for {b} to pick a side of the line and takes the other one.\n{b}: "Walk with me?"\n{a}: "I’m alright here."\n{b} (to camera): "{a} won’t walk with me. Everyone can see it."',
    '{a} avoids {b} the whole walk.\n{b}: "Is it something I said?"\n{a} says nothing.',
    '{a} snubs {b} in front of the group.\n{b}: "Room for one more?"\n{a}: "Not really."\n{b} (to camera): {cam:left-out}',
  ],
  'dragged-others-in': [
    '{a} calls two others over just as {b} arrives.\n{a}: "Walk with us."\n{b} (to camera): "Us. Not me. Got it."',
    '{a} doesn’t just avoid {b}; {a} takes two people along.\n{b}: "Can I join?"\n{a}: "We’re fine, thanks."\n{b} (to camera): "Now it’s them and me. Great."',
    '{a} pulls others away from {b}.\n{a}: "Come walk with me."\n{b}: "Guess I’ll walk on my own, then."\n{b} walks alone.',
    '{a} leaves {b} isolated.\n{b}: "Wait for me?"\n{a}: "Keep up."\n{b} (to camera): {cam:left-out}',
  ],
  'called-out-for-it': [
    'Somebody asks {a} straight out why {aSub} keeps avoiding {b}.\n{a}: "I’m not avoiding anyone."\n{b}: "You crossed a field to avoid me."',
    '{a} keeps to the far side of the track, and somebody asks why {aSub} won’t walk with {b}.\n{a}: "I just don’t want to."\n{b}: "Right. Good to know."',
    'The snub gets named.\n{a} (to camera): "Caught. Now I look petty."',
    '{a} gets called out.\n{a}: "It’s nothing."\n{b}: "It’s clearly something."',
  ],
  'closed-the-gap': [
    '{b} jogs to catch up and walks right beside {a}.\n{b}: "You can walk faster. I’ll keep up."\n{a}: "…Fine."',
    '{b} walks over and falls in beside {a}.\n{b}: "Morning."\n{a}: "…Morning."',
    '{b} refuses to be snubbed.\n{b}: "You can’t avoid me forever."\n{a}: "I wasn’t avoiding you."\n{b}: "You crossed a field."\n{a} (to camera): "Apparently not."',
    '{b} catches up with {a}.\n{b}: "So. How are you?"\n{a}: "Fine. You?"\n{b}: "Better now."',
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
