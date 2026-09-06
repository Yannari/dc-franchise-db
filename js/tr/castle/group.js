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
    '{names} talked it round for an hour and came out of it with one name between them.',
    'It took {names} three goes and a lot of doubling back, and then it was settled.',
    'Nobody in that room proposed the name first. By the end all {n} of them were saying the same one.',
    '{a} said the name, {b} did not argue, and after that {c} had nowhere to stand.',
    '{names} went in with {n} opinions and came out with one, which is how blocs are made.',
    '{names} agreed on a name, which is the first thing any group here has agreed on all week.',
  ],
  'two-against-one': [
    '{a} and {b} were already agreed, and {c} spent twenty minutes finding that out.',
    'It was not a discussion. It was {a} and {b} explaining a decision to {c}.',
    '{c} argued the other way and got nowhere, in front of witnesses.',
    'Being outnumbered in a small room told {c} exactly where the votes are, and {c} will use that.',
    '{c} will vote with them tomorrow and will not have meant a word of it.',
    'Two people who have already spoken and one who has not is not a conversation.',
  ],
  'broke-up-with-nothing': [
    '{names} spent an hour on it and stood up with {n} different names.',
    'Nobody moved. Everybody talked. It was the most productive-sounding hour of the day.',
    'The room could not agree and now everybody in it knows where everybody else stands.',
    'They will each go and have this conversation again separately, which is worse.',
    'That group broke up more suspicious of each other than it sat down.',
    'Three people, three names, and a table in about four hours.',
  ],
  'somebody-said-nothing': [
    '{names} settled it, and one of them did not say a single word while it happened.',
    '{c} was in that room for the whole of it and contributed nothing anybody could quote.',
    'Silence in a group is louder than silence in a pair, because everybody can see it.',
    'Two of them noticed how little {c} said. They have not mentioned it to each other yet.',
    '{c} agreed at the end, which is not the same as having been part of it.',
    'The most careful person in that room was the one who let the other {n} decide.',
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
    '{names} made breakfast around each other for twenty minutes and none of them said the name.',
    'There is an empty chair through there and {n} people in here talking about the weather.',
    'It is not denial. It is {n} people who have all decided somebody else should go first.',
    '{names} were perfectly pleasant to each other and it was unbearable.',
    'The kettle went on twice. Nobody said anything that mattered either time.',
    'Everything in that kitchen was said in the gaps.',
  ],
  'said-it-first': [
    '{a} put it into the room while {b} and {c} were still deciding whether to.',
    'Somebody has to say the name first at breakfast, and {a} did it.',
    '{a} said what all {n} of them were thinking and the other two had to react in front of each other.',
    'It cost {a} something to go first, and both of the others watched {a} pay it.',
    '{a} did not wait to see which way {b} and {c} were leaning.',
    'The first person to say a name in a kitchen is a person the other two will remember.',
  ],
  'the-room-split': [
    '{a} said one thing, {b} said the opposite, and {c} stood there with a plate.',
    'A kitchen is too small for a disagreement and they had one anyway.',
    'By the end of it {c} had to choose, in a kitchen, before nine in the morning.',
    'Two of them wanted to talk about it and one of them very much did not.',
    'It got sharp fast, the way it does when nobody has slept.',
    'They will all three be careful with each other for the rest of the day.',
  ],
  'closed-ranks': [
    '{names} agreed, quickly and without discussing it, that this stays in the kitchen.',
    'Whatever was said in there, all {n} of them came out saying nothing.',
    'It is the closest thing to an alliance any of them have, and none of them called it that.',
    'Three people decided to trust each other over a kettle, which is how it usually starts.',
    'Somebody came in and the conversation changed shape before the door had opened.',
    '{names} have a thing now, and the rest of the castle does not have it.',
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
    '{names} walked out as a unit and stayed one the whole way.',
    'A column of eighteen has shapes in it, and {names} were the most obvious one this morning.',
    'They did not plan it. All {n} of them arrived at the gate and fell in together anyway.',
    'It is the third morning running those {n} have walked out together, and people count.',
    'Anybody at the back of that road could tell you exactly who the {n} of them are.',
    'They spent an hour being a bloc in daylight, which is a thing you cannot take back.',
  ],
  'picked-up-a-stray': [
    '{c} attached to {a} and {b} at the gate and neither of them could work out how to prevent it.',
    'Two of them wanted an hour to talk and got a third person instead.',
    '{c} walked with them the whole way and was not once part of the conversation.',
    'It is very hard to tell somebody they cannot walk beside you.',
    '{a} and {b} said nothing useful for five miles because {c} was there.',
    '{c} may have learned something. {c} certainly learned that they did not want {c} there.',
  ],
  'left-somebody-out': [
    '{a} and {b} pulled ahead and {c} spent the last two miles walking behind them.',
    'Nobody said {c} could not walk with them. Nobody made room either.',
    'The gap was three feet and it was completely deliberate.',
    '{c} tried twice to join it and both times the conversation went quiet.',
    'It is the cruellest thing this castle does and it never involves a word.',
    'By the field {c} had stopped trying.',
  ],
  'traded-what-they-had': [
    'Somewhere on that road {names} told each other what they each knew, and it added up.',
    'Three people with three pieces of a week put them together on a road with nobody listening.',
    'It is the most efficient hour any of them will spend, and they spent it walking.',
    '{a} had a name, {b} had a night, {c} had the thing that connected them.',
    'They arrived at that field with a shared picture none of them had at the gate.',
    'A road is the only place in this game where three people can talk without being interrupted.',
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
    '{names} went through the slates together, name by name, until the arithmetic stopped working.',
    'Three people counting the same vote find things one person counting it does not.',
    '{a} noticed the gap and {b} confirmed it and {c} went quiet.',
    'They could account for every vote but two, and they spent an hour on the two.',
    'It is the only hard evidence this castle produces and {n} of them read it together.',
    'By the end of it all {n} had the same short list.',
  ],
  'blamed-each-other': [
    'It took about four minutes for {names} to start asking each other about their own slates.',
    'A post-mortem between three people becomes an interrogation of one of them very quickly.',
    '{a} asked {c} a question that {b} had clearly also wanted to ask.',
    'Nobody in that room came out of it with more allies than they went in with.',
    'They had one wrong vote between them and three theories about whose fault it was.',
    'That conversation should have been had with two people, or none.',
  ],
  'protected-one-of-them': [
    'One of those slates was indefensible and the other two decided not to raise it.',
    '{a} and {b} both saw what {c} wrote and neither of them said a word about it.',
    'It is a favour, and {c} knows exactly how large a favour it is.',
    'They let it go, in front of each other, which makes it a shared decision.',
    'Two people who agree without discussing it to say nothing about a third are an alliance, whether anybody names it or not.',
    'Nothing was agreed. All three of them understood it perfectly.',
  ],
  'went-to-bed-on-it': [
    '{names} agreed to leave it until morning and none of them meant it.',
    'They ran out of energy before they ran out of disagreement.',
    'It is too late and they are too tired and it will be worse tomorrow for waiting.',
    'The conversation stopped rather than finished.',
    'All {n} of them went up knowing this is not over.',
    'Somebody said "in the morning" and everybody was relieved to be let off.',
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
    '{names} stayed downstairs long after there was any reason to, because upstairs is where it happens.',
    'The fire went out and all {n} of them were still in the room.',
    'Nobody says it. Going to bed is the part where somebody is chosen.',
    'They talked about nothing for two hours rather than be the first to stand up.',
    'It is the safest place in the castle and none of them would say why they are in it.',
    'Three people sitting in a cold room at one in the morning, being extremely casual.',
  ],
  'told-each-other-things': [
    'It got late enough that {names} started saying true things.',
    'Something about one in the morning makes people honest, and all {n} of them were.',
    '{a} said something that will matter on Thursday and did not realise it.',
    'They will all three remember this conversation differently and all three will remember it.',
    'Nobody was strategising. That is what made it worth more than the strategising.',
    'By the time they went up they knew things about each other the castle does not.',
  ],
  'one-of-them-left-early': [
    '{c} went up before the others and both of them watched {c} go.',
    'Leaving a room first at night is a decision, and {c} made it in front of two people.',
    '{a} and {b} did not say anything about it until the stairs had stopped creaking.',
    'It is nothing. It is also the only thing either of them will think about tonight.',
    '{c} had a reason. {c} did not give it.',
    'Two people stayed up specifically to talk about the third.',
  ],
  'heard-something': [
    'All {n} of them heard it at the same time and all {n} of them pretended not to.',
    'A door, upstairs, at the wrong hour, and three witnesses who will each tell it differently.',
    'Nobody went to look. That is the part they will be embarrassed about tomorrow.',
    'It was probably the building. Three people have now decided it was probably the building.',
    'They agreed it was nothing quickly enough that none of them believed it.',
    'For about four seconds the room was completely still.',
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
    '{c} took it from all {n} of them at once and did not give an inch.',
    'Being questioned by one person is a conversation. Being questioned by {n} is a trial, and {c} stood through it.',
    '{c} answered {a}, then {b}, then {a} again, and never changed the story.',
    'The room came at {c} together and got the same answer every time.',
    'It is hard to fake composure in front of that many people and {c} either did or did not need to.',
    'By the end of it two of them were less sure than when they started.',
  ],
  'came-apart': [
    '{c} managed {a} and managed {b} and could not manage both of them at once.',
    'It was the third question that did it, and everybody in the room saw which one.',
    '{c} contradicted {c}’s own answer in front of {n} people.',
    'One accuser is survivable. {c} found out what several are.',
    '{c} stopped answering somewhere in the middle and the silence did the rest.',
    'Everybody in that room came out of it agreeing about one thing.',
  ],
  'the-room-turned': [
    'It went too far and one of them said so, and after that it was over.',
    '{b} stopped it, which nobody expected, least of all {c}.',
    'A pile-on has a moment where it becomes bullying and this one found it.',
    '{a} kept going after the room had stopped, and that is what people will remember.',
    'By the end {c} had more sympathy than {c} started with, and {a} had less.',
    'They came in {n} against one and left with the one looking better than two of them.',
  ],
  'nobody-would-start': [
    'All {n} of them had the same question and none of them asked it.',
    'Everybody in that room was waiting for somebody else to say the name.',
    'It is astonishing how long three people can talk without asking the one thing.',
    'They circled it for twenty minutes and went to lunch.',
    '{c} knew exactly what the room wanted to ask and was not going to help.',
    'Nobody wanted to be the person who said it, so nobody was.',
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
    '{names} rebuilt the whole afternoon on the way home, out loud, between the three of them.',
    'Everybody saw a different part of that mission and {n} of them put theirs together.',
    '{a} had missed the thing {b} saw, and {c} had seen it from the other side.',
    'By the drive they had a version of the afternoon none of them arrived with.',
    'Three accounts of one hour, and the interesting part was where they did not match.',
    'They were still comparing it when they got to the gate.',
  ],
  'agreed-who-cost-them': [
    'Somewhere on that road all {n} of them arrived at the same name for it.',
    'Nobody proposed it. It simply became the thing they were all saying.',
    'A group deciding whose fault an afternoon was is faster and less fair than one person doing it.',
    'They will each repeat that name separately tonight and it will sound like three sources.',
    'It took a mile and by the end it was settled and it may not even be true.',
    'That is how a name gets into a castle: three people and a long walk.',
  ],
  'one-of-them-defended-them': [
    '{c} would not have it, and said so, and the other two had to argue for it properly.',
    'It is easy to blame somebody who is not there. {c} made it harder.',
    '{c} defended somebody at the cost of being on the wrong side of the other two for a mile.',
    'The name still stuck. It stuck with a witness who had objected, which is different.',
    '{a} and {b} noticed exactly how hard {c} fought for it.',
    'Defending an absent person in front of two people who have decided is not a free act.',
  ],
  'said-nothing-useful': [
    'Three people walked five miles and produced nothing but agreement about the weather.',
    'Whatever any of them thought about that afternoon, none of it got said on that road.',
    'It was pleasant and it was completely empty and all {n} of them chose that.',
    'Nobody wanted to be the first to have an opinion.',
    'A wasted road, and all three of them will realise it at about eleven tonight.',
    'They had the one hour nobody could overhear and they spent it being careful.',
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
