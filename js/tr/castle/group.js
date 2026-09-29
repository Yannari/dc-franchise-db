// ══════════════════════════════════════════════════════════════════════
// tr/castle/group.js — the scenes that need a room, not a pair
// ══════════════════════════════════════════════════════════════════════
//
// MEASURED 2026-09-05, actors per scene across 40 played seasons (9,796
// scenes):
//
//     1 actor   4,368   45%
//     2 actors  5,428   55%
//     3+            0    0%
//
// Not rare. ZERO. `_sceneActors` (js/tr/events.js) had exactly two uniform
// branches — `[living[i]]` or `[living[i], living[j]]` — and its continuation
// branch returns a thread's parties, and threads are opened with one or two
// names. So a castle of eighteen people never once had three of them in a
// room together.
//
// AND THE SCREEN WAS ALREADY BUILT FOR IT. js/vp-tr/castle-day.js line 1461:
//
//     if (roll.length >= 3) return { mode: 'group', roll };
//
// with its own `ESTABLISH_GROUP` pool, its own establish branch, and a
// group arm in the consequence path. Four written sentences and a whole
// composition mode, wired end to end, that had never run. Dead content of the
// most expensive kind: not a fork nobody takes, a MODE nobody reaches.
//
// ── WHY THE SAMPLER COULD NOT SIMPLY BE OPENED ───────────────────────
//
// 93 of the 167 events in the pool open with `if (ctx.actors?.length !== 2)
// return 0;`. Turn on a three-actor draw with nothing that accepts one and
// every such draw finds an empty eligible set, the window's barren-draw
// counter ticks, and scene density falls — the exact measure an earlier batch
// raised `BARREN_DRAWS_BEFORE_DONE` to protect. So the content comes first
// and the draw is opened underneath it, in that order, in one change.
//
// ── WHAT A GROUP SCENE IS FOR, WHICH IS NOT A BIGGER PAIR SCENE ──────
//
// A pair scene is two people deciding something about each other. A group
// scene is the thing this format actually runs on and could not previously
// show: a ROOM deciding something, where the interesting fact is not what any
// one person said but who agreed, who went quiet, and who was outnumbered.
// Every event here needs its third person to mean anything — none of them
// would work with two, which is the test of whether it belongs in this file.

import { gs } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi } from './effects.js';
import { findOpenThread } from '../threads.js';
import { lineFor } from './lines.js';
import { peopleLost } from '../state.js';

const FAMILY_TRUST = 'trust';
const FAMILY_SUSP = 'suspicion';
const FAMILY_GRIEF = 'grief';
const FAMILY_CONF = 'confrontation';

/** Three or more, and the extras are the point. */
const groupOnly = ctx => ((ctx.actors || []).length >= 3 ? ctx.actors : null);

const NUMBER_WORD = { 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' };

/** "A, B and C" — the group's own name for itself, for the {names} slot. */
function namesOf(list) {
  const l = (list || []).filter(Boolean);
  if (l.length <= 1) return l[0] || '';
  if (l.length === 2) return `${l[0]} and ${l[1]}`;
  return `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`;
}

/**
 * Fill a group line. `{a}` `{b}` `{c}` are the first three by convention,
 * `{names}` is the whole room, `{n}` the count and `{rest}` everybody but {a}.
 */
function fillGroup(s, actors) {
  const [a, b, c] = actors;
  return String(s)
    .replace(/\{names\}/g, namesOf(actors))
    .replace(/\{rest\}/g, namesOf(actors.slice(1)))
    // AS A WORD, NEVER A DIGIT. tests/tr-castle-prose.test.js's number rule
    // says any digit a castle sentence prints must equal a fact the season
    // state can justify -- how many are living, lost, murdered, banished, in
    // the cast, or an episode that has happened. A GROUP SIZE is none of
    // those, so "all 3 of them" is a number the rule cannot check and
    // correctly refuses. Spelling it removes the digit and reads better.
    .replace(/\{n\}/g, NUMBER_WORD[actors.length] || String(actors.length))
    .replace(/\{a\}/g, a).replace(/\{b\}/g, b).replace(/\{c\}/g, c || '');
}

/** Pick a branch off a weighted score object. Same shape as everywhere else. */
function rollBranch(scores, rng, fallback) {
  const keys = Object.keys(scores);
  const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
  let roll = rng() * total, branch = fallback;
  for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { return k; } }
  return branch;
}

// ══════════════════════════════════════════════════════════════════════
// 1. THE ROOM AGREES A NAME — evening
// ══════════════════════════════════════════════════════════════════════
// The single most important thing a group of Faithfuls does, and it could not
// be shown: three or more people arriving at one name before the table.
const AGREE_LINES = {
  'landed-on-one': [
    '{names} go round the room once more and land in the same place.\n{b}: "Then it’s settled."\n{c}: "It’s settled. Nobody wobbles."',
    '{names} talk it round for an hour and come out with one name.\n{a}: "So we’re agreed?"\n{b}: "Agreed."\n{c}: "Agreed. Nobody breaks it."',
    '{names} settle on a name in the library.\n{c}: "Say it out loud, so we all hear it."\n{b}: "Then that’s us. Three votes."\n{a} says it. Nobody argues.',
    '{names} agree after a long hour.\n{a}: "So we’re agreed?"\n{b}: "Agreed."\n{c}: "Agreed."\n{b} (to camera): "Three votes, one name. That’s how you do it."',
  ],
  'two-against-one': [
    '{c} catches {a} and {b} exchanging a look.\n{c}: "You two already had a name before I sat down."\n{a}: "We had a suggestion."',
    '{a} and {b} are already agreed, and {c} spends twenty minutes finding that out.\n{c}: "Hang on. You two have already decided."\n{a}: "We were waiting for you."\n{c}: "No, you weren’t."',
    '{c} realises the others made up their minds without asking.\n{c} (to camera): "I was the last to know. Again."',
    '{a} and {b} bring {c} round.\n{b}: "Come on. It makes sense."\n{c}: "Fine. But I don’t like it."',
  ],
  'broke-up-with-nothing': [
    '{names} stand up with nothing agreed.\n{a}: "Well, that was an hour."\n{c}: "An hour we won’t get back."',
    '{names} spend an hour on it and stand up with {n} different names.\n{a}: "So that was a waste of time."\n{b}: "Totally."',
    '{names} can’t agree on anyone.\n{a}: "I’m going with my gut."\n{b}: "So am I. Different gut."\n{c} (to camera): "Three people, three names. Useless."',
    '{names} give up.\n{b}: "Let’s just vote how we vote."\n{a}: "Fine."',
  ],
  'somebody-said-nothing': [
    '{a} and {b} agree while {c} just listens.\n{b}: "You’re quiet."\n{c}: "I’m thinking."',
    '{names} settle it, and one of them doesn’t say a word throughout.\n{a}: "You’re quiet, {c}."\n{c}: "Just listening."',
    '{c} lets the others decide.\n{a} (to camera): "{c} agreed to nothing. Just nodded. I noticed."',
    '{c} stays silent while {a} and {b} settle it.\n{b}: "You with us?"\n{c}: "Sure."',
  ],
};

registerEvent({
  id: 'group-agreed-a-name',
  family: FAMILY_SUSP,
  window: 'evening',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['social', 'strategic', 'boldness', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!groupOnly(ctx)) return 0;
    // A room agreeing a name needs a week behind it to have names in.
    return peopleLost(gs) >= 1 ? 3 : 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'group-agreed-a-name');
    const actors = ctx.actors;
    const [a, b, c] = actors;
    const sa = pStats(a);
    const sc = pStats(c);
    const branch = rollBranch({
      'landed-on-one': (sa.social / 10) * 0.4 + 0.2,
      'two-against-one': (sa.strategic / 10) * 0.3 + (1 - sc.boldness / 10) * 0.25,
      'broke-up-with-nothing': (1 - sa.social / 10) * 0.3 + 0.15,
      'somebody-said-nothing': (1 - sc.social / 10) * 0.3 + (sc.strategic / 10) * 0.2,
    }, rng, 'landed-on-one');
    const sceneWhy = branch === 'broke-up-with-nothing' ? 'talked for an hour and agreed on nothing'
      : branch === 'two-against-one' ? 'was outnumbered in a small room'
        : branch === 'somebody-said-nothing' ? 'let the rest of the room decide it'
          : 'agreed one name between them';
    const note = fillGroup(lineFor(AGREE_LINES[branch],
      `group-agreed-a-name|${branch}|${ctx.ep}`, { a, b }), actors);
    // A room that agrees warms; a room that splits cools. The bond is written
    // across every PAIR in the group, which is the thing a pair scene cannot
    // do and is most of why this file exists.
    const delta = branch === 'landed-on-one' ? 1
      : branch === 'broke-up-with-nothing' ? -1
        : branch === 'two-against-one' ? -0.5 : 0;
    if (delta) {
      for (let i = 0; i < actors.length; i++) {
        for (let j = i + 1; j < actors.length; j++) {
          api.addBond(actors[i], actors[j], delta, { source: sceneWhy });
        }
      }
    }
    const existing = findOpenThread(FAMILY_SUSP, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY_SUSP, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'two-against-one') crowd = { name: c, colour: 'wronged', reason: 'was outnumbered in a room and had to agree anyway', mult: 0.4 };
    else if (branch === 'somebody-said-nothing') crowd = { name: c, colour: 'exposed', reason: 'said nothing at all while a room decided a name', mult: 0.4 };
    return { branch, actors: [...actors], people: [...actors], speaker: a, respondent: c,
      threadId: t?.id || existing?.id || null,
      bondDelta: delta, ...(crowd ? { crowd } : {}) };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 2. THE KITCHEN AT BREAKFAST — dawn
// ══════════════════════════════════════════════════════════════════════
const KITCHEN_LINES = {
  'nobody-mentioned-it': [
    '{names} butter toast in silence.\n{a}: "Pass the jam?"\n{c}: "Here."\nThe name never comes up.',
    '{names} make breakfast around each other for twenty minutes, and nobody says the name.\n{a}: "Toast?"\n{b}: "Please."\n{c}: "Lovely morning."\nThe name stays unsaid.',
    '{names} talk about anything else.\n{a}: "Anyone for more tea?"\n{c}: "Please."\n{c} (to camera): "Elephant in the kitchen. Nobody mentioned it."',
    '{names} keep it light at breakfast.\n{a}: "Did anyone sleep?"\n{b}: "Not really."',
  ],
  'said-it-first': [
    '{a} puts the kettle down.\n{a}: "We all know who we’re thinking about. I’ll say it."\n{c}: "Go on, then."',
    '{a} puts it into the room while {b} and {c} are still deciding whether to.\n{a}: "Right. Let’s just say it. Who do we think?"\n{b}: "Straight to it, then."',
    '{a} goes first.\n{c} (to camera): "{a} didn’t wait. Brave, or reckless."',
    '{a} breaks the silence.\n{a}: "Someone has to start. I will."',
  ],
  'the-room-split': [
    '{a} and {b} disagree over the bread board.\n{b}: "You’re miles off."\n{c}: "Can I just have a slice of toast, please?"',
    '{a} says one thing, {b} says the opposite, and {c} stands there with a plate.\n{a}: "It’s obvious."\n{b}: "It’s obviously not."\n{c}: "I’m just going to eat."',
    '{a} and {b} disagree over breakfast.\n{a}: "It’s obvious."\n{b}: "It’s obviously not."\n{c} (to camera): "Caught in the middle. With a croissant."',
    '{a} and {b} argue across the counter.\n{c}: "Can we not, before coffee?"\n{a}: "Fine. After coffee."',
  ],
  'closed-ranks': [
    '{names} lower their voices at the same moment.\n{c}: "Not a word outside this kitchen."\n{a}: "Not a word."',
    '{names} agree, quickly, that this stays in the kitchen.\n{a}: "This doesn’t leave this room."\n{b}: "Obviously."\n{c}: "Obviously."',
    '{names} make a pact.\n{a}: "Kitchen rules."\n{c}: "Kitchen rules."\n{b} (to camera): "What’s said in the kitchen stays in the kitchen."',
    '{names} close ranks.\n{c}: "Not a word to anyone."\n{a}: "Not a word."',
  ],
};

registerEvent({
  id: 'group-kitchen-at-breakfast',
  family: FAMILY_TRUST,
  window: 'dawn',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['boldness', 'social', 'loyalty', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!groupOnly(ctx)) return 0;
    return peopleLost(gs) >= 1 ? 2.5 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'group-kitchen-at-breakfast');
    const actors = ctx.actors;
    const [a, b, c] = actors;
    const sa = pStats(a);
    const warm = actors.reduce((acc, n, i) => acc
      + actors.slice(i + 1).reduce((s, m) => s + getBond(n, m), 0), 0);
    const branch = rollBranch({
      'nobody-mentioned-it': (1 - sa.boldness / 10) * 0.35 + 0.15,
      'said-it-first': (sa.boldness / 10) * 0.4,
      'the-room-split': (1 - sa.temperament / 10) * 0.3 + Math.max(0, -warm) * 0.03,
      'closed-ranks': Math.max(0, warm) * 0.05 + (sa.loyalty / 10) * 0.2,
    }, rng, 'nobody-mentioned-it');
    const sceneWhy = branch === 'said-it-first' ? 'was the first to say a name in the kitchen'
      : branch === 'the-room-split' ? 'fell out with the room over breakfast'
        : branch === 'closed-ranks' ? 'agreed with the room that this goes no further'
          : 'made breakfast beside people nobody would talk to';
    const note = fillGroup(lineFor(KITCHEN_LINES[branch],
      `group-kitchen-at-breakfast|${branch}|${ctx.ep}`, { a, b }), actors);
    const delta = branch === 'closed-ranks' ? 1.5
      : branch === 'the-room-split' ? -1.5
        : branch === 'said-it-first' ? 0.5 : 0;
    if (delta) {
      for (let i = 0; i < actors.length; i++) {
        for (let j = i + 1; j < actors.length; j++) {
          api.addBond(actors[i], actors[j], delta, { source: sceneWhy });
        }
      }
    }
    const existing = findOpenThread(FAMILY_TRUST, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY_TRUST, [a, b], { source: sceneWhy, seed: note });
    return { branch, actors: [...actors], people: [...actors], speaker: a, respondent: b,
      threadId: t?.id || existing?.id || null, bondDelta: delta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 3. WHO IS WALKING WITH WHOM — journey-out
// ══════════════════════════════════════════════════════════════════════
const COLUMN_GROUP_LINES = {
  'walked-as-a-block': [
    '{names} set off together and nobody else tries to join.\n{b}: "We look like a gang."\n{a}: "We are a gang."',
    '{names} walk out as a unit and stay one the whole way.\n{a}: "Nobody’s getting between us today."\n{b}: "Nobody’s trying."',
    '{names} stick together on the road.\n{a}: "Nobody’s splitting us up today."\n{b}: "Nobody’s trying."\n{c} (to camera): "Us three. All the way."',
    '{names} walk as a group.\n{b}: "People are looking."\n{a}: "Let them."',
  ],
  'picked-up-a-stray': [
    '{c} falls in with {a} and {b} uninvited.\n{c}: "What are we talking about?"\n{a}: "…The weather."',
    '{c} attaches to {a} and {b} at the gate, and neither can work out how to stop it.\n{c}: "Mind if I join you?"\n{a}: "…Course not."',
    '{c} tags along uninvited.\n{c}: "What are we talking about?"\n{a}: "The weather."\n{b} (to camera): "We had things to talk about. Now we can’t."',
    '{c} joins {a} and {b}.\n{a}: "Lovely."\n{c}: "What did I miss?"\n{b} (to camera): "Not lovely."',
  ],
  'left-somebody-out': [
    '{a} and {b} speed up, and {c} is left a few yards behind.\n{c}: "Wait for me!"\n{b}: "Walk faster."\nThey don’t.',
    '{a} and {b} pull ahead, and {c} walks behind them for the last two miles.\n{c}: "Wait up, you two!"\n{a}: "Keep up!"\n{c} (to camera): {cam:left-out}',
    '{a} and {b} leave {c} behind.\n{c}: "Wait up!"\n{a}: "Keep up, then!"\nThey don’t.',
    '{c} trails behind {a} and {b}.\n{c}: "Slow down a bit?"\n{b}: "We’re nearly there."\n{c} (to camera): "I know when I’m not wanted."',
  ],
  'traded-what-they-had': [
    '{names} swap what they know by the ford.\n{c}: "So that’s why."\n{a}: "That’s exactly why."',
    'Somewhere on the road, {names} tell each other what they know, and it adds up.\n{a}: "So you saw that too?"\n{c}: "And I heard this."\n{b}: "Then it’s them."',
    '{names} pool their information.\n{a}: "So that’s what you saw?"\n{c}: "And that’s what I heard."\n{b} (to camera): "Three halves of a story. Put together, it made sense."',
    '{names} compare notes.\n{c}: "That’s the missing piece."\n{a}: "Then it’s them."',
  ],
};

registerEvent({
  id: 'group-walked-out-together',
  family: FAMILY_TRUST,
  window: 'journey-out',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['social', 'strategic', 'intuition', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!groupOnly(ctx)) return 0;
    return (ctx.living || []).length >= 6 ? 3 : 1;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'group-walked-out-together');
    const actors = ctx.actors;
    const [a, b, c] = actors;
    const sa = pStats(a);
    const sc = pStats(c);
    const abBond = getBond(a, b);
    const branch = rollBranch({
      'walked-as-a-block': (sa.social / 10) * 0.35 + Math.max(0, abBond) * 0.03,
      'picked-up-a-stray': (sc.social / 10) * 0.3 + 0.15,
      'left-somebody-out': Math.max(0, -getBond(a, c)) * 0.05 + (1 - sc.social / 10) * 0.2,
      'traded-what-they-had': (sa.strategic / 10) * 0.3 + (sa.intuition / 10) * 0.2,
    }, rng, 'walked-as-a-block');
    const sceneWhy = branch === 'left-somebody-out' ? 'was walked away from on the road out'
      : branch === 'picked-up-a-stray' ? 'joined two people who did not want a third'
        : branch === 'traded-what-they-had' ? 'put three weeks of information together on a road'
          : 'walked out as a bloc, in daylight';
    const note = fillGroup(lineFor(COLUMN_GROUP_LINES[branch],
      `group-walked-out-together|${branch}|${ctx.ep}`, { a, b }), actors);
    const delta = branch === 'traded-what-they-had' ? 1.5
      : branch === 'walked-as-a-block' ? 1 : 0;
    if (delta) {
      for (let i = 0; i < actors.length; i++) {
        for (let j = i + 1; j < actors.length; j++) {
          api.addBond(actors[i], actors[j], delta, { source: sceneWhy });
        }
      }
    }
    // Being walked away from costs the pair that did it, and only them.
    if (branch === 'left-somebody-out') {
      api.addBond(a, c, -1.5, { source: sceneWhy });
      api.addBond(b, c, -1.5, { source: sceneWhy });
    }
    const existing = findOpenThread(FAMILY_TRUST, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY_TRUST, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'left-somebody-out') crowd = { name: c, colour: 'wronged', reason: 'was left to walk a road behind two people who would not make room', mult: 0.5 };
    return { branch, actors: [...actors], people: [...actors], speaker: a, respondent: c,
      threadId: t?.id || existing?.id || null,
      bondDelta: delta, ...(crowd ? { crowd } : {}) };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 4. THE ROOM AFTER THE VOTE — after-table
// ══════════════════════════════════════════════════════════════════════
const AFTER_GROUP_LINES = {
  'counted-it-out-loud': [
    '{names} count the slates on their fingers.\n{b}: "That’s one vote more than anyone admitted to."\n{c}: "So someone lied to us."',
    '{names} go through the votes together, name by name.\n{a}: "So that’s two for them, one for—"\n{b}: "No, that was three."\n{c}: "It doesn’t add up."',
    '{names} count the ballots again.\n{a}: "One, two, three for them—"\n{b}: "And one that makes no sense."\n{c} (to camera): {cam:ballots}',
    '{names} do the maths after the table.\n{a}: "Someone voted strangely."\n{c}: "Who?"',
  ],
  'blamed-each-other': [
    '{a} turns on the other two.\n{a}: "Which of you went off plan?"\n{b}: "Which of YOU?"',
    'It takes about four minutes for {names} to start asking about each other’s votes.\n{a}: "Why did you write that?"\n{b}: "Why did you?"\n{c}: "Oh, here we go."',
    '{names} turn on each other.\n{a}: "Why did you write that?"\n{b}: "Why did YOU?"\n{c} (to camera): "Our little group. Falling apart."',
    '{names} start blaming.\n{a}: "That wasn’t the plan."\n{b}: "Plans change."',
  ],
  'protected-one-of-them': [
    '{a} starts to mention the odd vote, and {b} shakes {bPos} head.\n{b}: "Leave it."\n{a}: "…Fine."',
    'One of those votes makes no sense, and the other two decide not to raise it.\n{a} (to camera): "We all know. Nobody’s saying."',
    '{names} let one odd vote slide.\n{b}: "Let’s not."\n{a}: "Agreed."',
    '{names} protect each other.\n{a}: "That vote was odd."\n{b}: "Leave it."\n{c} (to camera): "Loyalty. Or cowardice. Hard to tell."',
  ],
  'went-to-bed-on-it': [
    '{names} climb the stairs together.\n{c}: "Sleep on it."\n{a}: "Nobody’s sleeping."',
    '{names} agree to leave it until morning, and none of them means it.\n{a}: "Sleep on it?"\n{b}: "Sleep on it."\nNobody sleeps.',
    '{names} call it a night.\n{a}: "Sleep on it?"\n{c}: "Nobody’s sleeping."\n{c} (to camera): "Nobody’s sleeping. We’re all just lying there thinking."',
    '{names} go up together.\n{b}: "Tomorrow, then."\n{c}: "Tomorrow."',
  ],
};

registerEvent({
  id: 'group-went-through-the-vote',
  family: FAMILY_SUSP,
  window: 'after-table',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['mental', 'intuition', 'loyalty', 'temperament'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!groupOnly(ctx)) return 0;
    return 3;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'group-went-through-the-vote');
    const actors = ctx.actors;
    const [a, b, c] = actors;
    const sa = pStats(a);
    const branch = rollBranch({
      'counted-it-out-loud': (sa.mental / 10) * 0.35 + (sa.intuition / 10) * 0.2,
      'blamed-each-other': (1 - sa.temperament / 10) * 0.35,
      'protected-one-of-them': (sa.loyalty / 10) * 0.3 + Math.max(0, getBond(a, c)) * 0.03,
      'went-to-bed-on-it': 0.3,
    }, rng, 'counted-it-out-loud');
    const sceneWhy = branch === 'blamed-each-other' ? 'turned a post-mortem into an interrogation'
      : branch === 'protected-one-of-them' ? 'saw a bad slate and said nothing about it'
        : branch === 'went-to-bed-on-it' ? 'left it until morning and meant none of it'
          : 'went through the whole count together';
    const note = fillGroup(lineFor(AFTER_GROUP_LINES[branch],
      `group-went-through-the-vote|${branch}|${ctx.ep}`, { a, b }), actors);
    const delta = branch === 'protected-one-of-them' ? 1.5
      : branch === 'counted-it-out-loud' ? 0.5
        : branch === 'blamed-each-other' ? -1.5 : 0;
    if (delta) {
      for (let i = 0; i < actors.length; i++) {
        for (let j = i + 1; j < actors.length; j++) {
          api.addBond(actors[i], actors[j], delta, { source: sceneWhy });
        }
      }
    }
    const existing = findOpenThread(FAMILY_SUSP, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY_SUSP, [a, b], { source: sceneWhy, seed: note });
    return { branch, actors: [...actors], people: [...actors], speaker: a, respondent: b,
      threadId: t?.id || existing?.id || null, bondDelta: delta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 5. THE ONES WHO SAT UP — night
// ══════════════════════════════════════════════════════════════════════
const SAT_UP_LINES = {
  'nobody-wanted-to-go-up': [
    '{names} put another log on.\n{b}: "One more."\n{c}: "You said that an hour ago."',
    '{names} stay downstairs long after there’s any reason to.\n{a}: "Another one?"\n{b}: "Go on."\n{c}: "Nobody wants to go upstairs, do they?"',
    '{names} put off going to bed.\n{b}: "Another log?"\n{c}: "Go on. Nobody wants to go up."\n{c} (to camera): "Upstairs is where it happens. So we stayed down."',
    '{names} sit by the fire until late.\n{a}: "Just five more minutes."\n{c}: "You said that an hour ago."',
  ],
  'told-each-other-things': [
    '{names} get honest near midnight.\n{c}: "If I go tonight, I want you two to know I was Faithful."\n{a}: "Don’t say that."',
    'It gets late enough that {names} start saying true things.\n{b}: "Honestly? I’m terrified."\n{a}: "Me too."\n{c}: "Me three."',
    '{names} open up by the fire.\n{b}: "Honestly? I’m terrified."\n{c}: "Me too."\n{a} (to camera): "Midnight honesty. You can’t fake it at that hour."',
    '{names} share secrets.\n{c}: "I’ve never told anyone this."\n{a}: "Go on."',
  ],
  'one-of-them-left-early': [
    '{c} stands up first.\n{c}: "Night, both."\n{a} (to camera): "Early. Very early. Why?"',
    '{c} goes up before the others, and both of them watch {c} go.\n{a}: "Bit early."\n{b}: "Very early."',
    '{c} leaves first.\n{c}: "Night, both."\n{a}: "Early night?"\n{c}: "Tired."\n{b} (to camera): "Why’s {c} in such a hurry?"',
    '{a} and {b} exchange a look as {c} heads upstairs.\n{a}: "Interesting."\n{b}: "Very interesting."',
  ],
  'heard-something': [
    '{names} freeze at a creak upstairs.\n{b}: "Was that…"\n{a}: "Don’t."',
    'All {n} of them hear it at once, and all {n} of them pretend not to.\n{a}: "Did you—"\n{b}: "No."\n{c}: "Nothing."',
    '{names} freeze at a noise upstairs.\n{b}: "Did you hear that?"\n{a}: "No."\n{c}: "Nothing."\n{c} (to camera): "We all heard it. None of us said so."',
    '{names} hear a door.\n{b}: "Just the wind."\n{a}: "Yeah. The wind."',
  ],
};

registerEvent({
  id: 'group-sat-up-late',
  family: FAMILY_GRIEF,
  window: 'night',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['temperament', 'social', 'intuition', 'loyalty'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!groupOnly(ctx)) return 0;
    return 2.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'group-sat-up-late');
    const actors = ctx.actors;
    const [a, b, c] = actors;
    const sa = pStats(a);
    const sc = pStats(c);
    const branch = rollBranch({
      'nobody-wanted-to-go-up': (1 - sa.temperament / 10) * 0.35 + 0.15,
      'told-each-other-things': (sa.social / 10) * 0.3 + (sa.loyalty / 10) * 0.2,
      'one-of-them-left-early': (1 - sc.social / 10) * 0.3,
      'heard-something': (sa.intuition / 10) * 0.25 + 0.1,
    }, rng, 'nobody-wanted-to-go-up');
    const sceneWhy = branch === 'told-each-other-things' ? 'said true things at one in the morning'
      : branch === 'one-of-them-left-early' ? 'went up before the others and was watched going'
        : branch === 'heard-something' ? 'heard a door upstairs and agreed it was nothing'
          : 'would not be the first to go up';
    const note = fillGroup(lineFor(SAT_UP_LINES[branch],
      `group-sat-up-late|${branch}|${ctx.ep}`, { a, b }), actors);
    const delta = branch === 'told-each-other-things' ? 2
      : branch === 'nobody-wanted-to-go-up' ? 0.5
        : branch === 'one-of-them-left-early' ? -0.5 : 0;
    if (delta) {
      for (let i = 0; i < actors.length; i++) {
        for (let j = i + 1; j < actors.length; j++) {
          api.addBond(actors[i], actors[j], delta, { source: sceneWhy });
        }
      }
    }
    const existing = findOpenThread(FAMILY_TRUST, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY_TRUST, [a, b], { source: sceneWhy, seed: note });
    return { branch, actors: [...actors], people: [...actors], speaker: a, respondent: b,
      threadId: t?.id || existing?.id || null, bondDelta: delta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 6. THE ROOM ROUNDS ON SOMEBODY — morning
// ══════════════════════════════════════════════════════════════════════
// confrontation.js models a pile-on with TWO actors and a living-count gate,
// because two was all the engine could convene. This is the same scene with
// the room actually in it.
const ROUNDED_LINES = {
  'held-the-room': [
    '{c} answers every question without once raising a voice.\n{c}: "Next question."\n{a} (to camera): "Nothing. Couldn’t crack it."',
    '{c} takes it from all {n} of them at once, and doesn’t give an inch.\n{c}: "Ask me anything. All of you. I’ll wait."',
    '{c} stands firm.\n{a} (to camera): "All of us on {c} at once. Didn’t crack."',
    '{c} holds firm.\n{c}: "I’m Faithful. That’s the answer, every time."',
  ],
  'came-apart': [
    '{c} gets two questions at once and loses it.\n{c}: "Stop! One of you, please!"',
    '{c} manages {a} and manages {b}, but can’t manage both at once.\n{a}: "Where were you?"\n{b}: "And who with?"\n{c}: "I — hang on — one at a time!"',
    '{c} crumbles under two questioners.\n{a}: "Where were you?"\n{b}: "And who with?"\n{c}: "One at a time!"\n{b} (to camera): "Two of us was too many for {c}."',
    '{c} gets flustered.\n{c}: "Stop talking at the same time!"',
  ],
  'the-room-turned': [
    '{b} pulls {a} back.\n{b}: "That’s enough. We’re ganging up."\n{a}: "We’re asking."',
    'It goes too far, and one of them says so.\n{b}: "Alright, stop. This is bullying."\n{a}: "It’s questions."\n{b}: "It’s bullying."',
    '{b} calls a halt.\n{b}: "That’s enough, both of you."\n{a}: "We’re just asking."\n{c} (to camera): "{b} stepped in. I’ll remember that."',
    'The questioning stops.\n{a}: "Fine. Fine."',
  ],
  'nobody-would-start': [
    '{names} sit round the table and nobody asks.\n{c}: "If you’ve got something to say, say it."\n{a}: "…Fine. I will."\nNobody does.',
    'All {n} of them have the same question, and none of them asks it.\n{c}: "Well? Go on."\nSilence.',
    '{names} sit in an awkward silence.\n{c}: "Well? Someone say it."\nNobody does.\n{a} (to camera): "We were all thinking it. Nobody asked."',
    '{names} can’t bring themselves to say it.\n{b}: "Someone say something."\n{c}: "You first."',
  ],
};

registerEvent({
  id: 'group-rounded-on-them',
  family: FAMILY_CONF,
  window: 'morning',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'boldness', 'social', 'strategic'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (!groupOnly(ctx)) return 0;
    const [a, b, c] = ctx.actors;
    // The room needs a reason to round on {c}: a live suspicion, or real
    // hostility from at least one of the others.
    const t = findOpenThread(FAMILY_SUSP, [a, c]) || findOpenThread(FAMILY_SUSP, [b, c]);
    if (!t && getBond(a, c) > -2 && getBond(b, c) > -2) return 0;
    return t ? 3 : 1.5;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'group-rounded-on-them');
    const actors = ctx.actors;
    // REFUSE, RATHER THAN THROW ON `pStats(undefined)`. `weight()` already
    // guarantees three, so this only ever fires for a caller that reached
    // fire() directly — and one did: the belief gate's probe, which swallowed
    // the exception and filed this event as dead content for two weeks.
    if (!actors || actors.length < 3) return null;
    const [a, b, c] = actors;
    const sa = pStats(a);
    const sc = pStats(c);
    const branch = rollBranch({
      'held-the-room': (sc.temperament / 10) * 0.4 + (sc.boldness / 10) * 0.25,
      'came-apart': (1 - sc.temperament / 10) * 0.4 + (1 - sc.boldness / 10) * 0.2,
      'the-room-turned': (1 - sa.temperament / 10) * 0.3 + (sc.social / 10) * 0.2,
      'nobody-would-start': (1 - sa.boldness / 10) * 0.3,
    }, rng, 'held-the-room');
    const sceneWhy = branch === 'came-apart' ? 'came apart with the whole room asking at once'
      : branch === 'the-room-turned' ? 'was pushed past the point the room would follow'
        : branch === 'nobody-would-start' ? 'sat in a room where nobody would ask the question'
          : 'took it from the whole room and gave nothing';
    const note = fillGroup(lineFor(ROUNDED_LINES[branch],
      `group-rounded-on-them|${branch}|${ctx.ep}`, { a, b }), actors);
    // The cost lands on the pair that did the rounding, not across the room.
    const delta = branch === 'nobody-would-start' ? 0 : -1.5;
    if (delta) {
      api.addBond(a, c, delta, { source: sceneWhy });
      api.addBond(b, c, delta, { source: sceneWhy });
    }
    const existing = findOpenThread(FAMILY_CONF, [a, c]) || findOpenThread(FAMILY_SUSP, [a, c]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY_CONF, [a, c], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'came-apart') crowd = { name: c, colour: 'cowardly', reason: 'came apart with a whole room asking at once', mult: 0.5 };
    else if (branch === 'held-the-room') crowd = { name: c, colour: 'masterful', reason: 'took a room full of accusers and gave nothing', mult: 0.6 };
    else if (branch === 'the-room-turned') crowd = { name: a, colour: 'cruel', reason: 'kept going after the room had stopped', mult: 0.5 };
    return { branch, actors: [...actors], people: [...actors], speaker: a, respondent: c,
      threadId: t?.id || existing?.id || null,
      bondDelta: delta, ...(crowd ? { crowd } : {}) };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 7. THE WALK HOME, IN THREES — journey-back
// ══════════════════════════════════════════════════════════════════════
const HOME_GROUP_LINES = {
  'went-over-the-afternoon': [
    '{names} rebuild the mission step by step on the way back.\n{b}: "And that’s where we lost the money."\n{c}: "Right there."',
    '{names} rebuild the whole afternoon on the way home, out loud.\n{a}: "Then you went left—"\n{b}: "—and you went right."\n{c}: "And that’s where it went wrong."',
    '{names} replay the mission.\n{a}: "Then we went left—"\n{c}: "—and that’s where it went wrong."\n{c} (to camera): {cam:replay-mission}',
    '{names} go over every detail.\n{b}: "Again, from the start."\n{c}: "Again? We know how it ends."',
  ],
  'agreed-who-cost-them': [
    '{a} says a name, and the other two nod.\n{a}: "It was them."\n{b}: "Obviously."',
    'Somewhere on the road, all {n} of them arrive at the same name for it.\n{a}: "You’re thinking what I’m thinking."\n{b}: "Yep."\n{c}: "Yep."',
    '{names} agree on who let them down.\n{a}: "It was them."\n{b}: "Obviously."\n{b} (to camera): "One name between us. Easy."',
    '{names} settle the blame.\n{c}: "It was them. No question."\n{a}: "No question."',
  ],
  'one-of-them-defended-them': [
    '{c} stops walking.\n{c}: "It wasn’t their fault and you both know it."\n{a}: "Then whose was it?"',
    '{c} won’t have it, and the other two have to argue properly.\n{c}: "That’s not fair. Anyone could have made that mistake."\n{a}: "But they did make it."',
    '{c} defends the one they’re blaming.\n{a} (to camera): "{c} is very protective. Why?"',
    '{c} pushes back.\n{c}: "Leave it. It’s not worth it."',
  ],
  'said-nothing-useful': [
    '{names} talk about lunch for five miles.\n{c}: "Sandwiches, though."\n{a}: "Sandwiches."',
    'Three people walk five miles and produce nothing but agreement about the weather.\n{a}: "Nice day."\n{b}: "Lovely."\n{c}: "Bit windy."',
    '{names} talk about nothing all the way home.\n{c}: "Nice day."\n{a}: "Lovely."\n{b} (to camera): "Five miles. Weather and dinner."',
    '{names} avoid the real conversation.\n{b}: "What’s for dinner?"\n{c}: "Stew again."\n{c} (to camera): {cam:switch-off}',
  ],
};

registerEvent({
  id: 'group-walked-home-in-threes',
  family: FAMILY_SUSP,
  window: 'journey-back',
  advancesThread: true,
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous'],
    voice: ['mental', 'social', 'loyalty', 'boldness'],
    relationship: ['neutral'],
  },
  weight(ctx) {
    if (!groupOnly(ctx)) return 0;
    if ((ctx.ep || 0) < 2) return 0;
    return 3;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'group-walked-home-in-threes');
    const actors = ctx.actors;
    const [a, b, c] = actors;
    const sa = pStats(a);
    const sc = pStats(c);
    const branch = rollBranch({
      'went-over-the-afternoon': (sa.mental / 10) * 0.35 + 0.15,
      'agreed-who-cost-them': (sa.social / 10) * 0.3 + (1 - sa.loyalty / 10) * 0.2,
      'one-of-them-defended-them': (sc.loyalty / 10) * 0.3 + (sc.boldness / 10) * 0.2,
      'said-nothing-useful': (1 - sa.boldness / 10) * 0.3,
    }, rng, 'went-over-the-afternoon');
    const sceneWhy = branch === 'agreed-who-cost-them' ? 'agreed a name for the afternoon on the road home'
      : branch === 'one-of-them-defended-them' ? 'defended an absent person to a road that had decided'
        : branch === 'said-nothing-useful' ? 'spent the one unoverhearable hour being careful'
          : 'rebuilt the afternoon out loud between them';
    const note = fillGroup(lineFor(HOME_GROUP_LINES[branch],
      `group-walked-home-in-threes|${branch}|${ctx.ep}`, { a, b }), actors);
    const delta = branch === 'went-over-the-afternoon' ? 1
      : branch === 'agreed-who-cost-them' ? 0.5
        : branch === 'one-of-them-defended-them' ? -0.5 : 0;
    if (delta) {
      for (let i = 0; i < actors.length; i++) {
        for (let j = i + 1; j < actors.length; j++) {
          api.addBond(actors[i], actors[j], delta, { source: sceneWhy });
        }
      }
    }
    const existing = findOpenThread(FAMILY_SUSP, [a, b]);
    const t = existing
      ? api.advanceArc(existing.id, note, { source: sceneWhy })
      : api.openArc(FAMILY_SUSP, [a, b], { source: sceneWhy, seed: note });
    let crowd = null;
    if (branch === 'one-of-them-defended-them') crowd = { name: c, colour: 'selfless', reason: 'defended somebody who was not there, to a road that had already decided', mult: 0.5 };
    return { branch, actors: [...actors], people: [...actors], speaker: a, respondent: b,
      threadId: t?.id || existing?.id || null,
      bondDelta: delta, ...(crowd ? { crowd } : {}) };
  },
});
