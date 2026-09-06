// ══════════════════════════════════════════════════════════════════════
// tr/castle/carry-on.js — the hours that could only ever start something
// ══════════════════════════════════════════════════════════════════════
//
// MEASURED 2026-09-06 over 30 played seasons, the share of each window's
// scenes that CONTINUE a story rather than open a new one:
//
//     night         67%
//     after-table   66%
//     journey-back  58%
//     evening       54%
//     dawn          53%
//     morning       42%   <-
//     journey-out   44%   <-
//
// A continued scene is the one that reads like television: it arrives with a
// day tab on it, so a viewer can watch an argument or a friendship build
// across the week. The morning and the road out mostly begin things and
// rarely return to them, which is why those two hours read as disconnected
// vignettes next to the evening.
//
// THE CAUSE IS SPECIFIC AND IT IS NOT A WEIGHT. tr-castle-reachability's
// advancer-coverage arm lists eleven (family x window) cells with NO EVENT
// THAT CAN ADVANCE A THREAD, and ten of the eleven are in those two columns:
//
//     cover|morning        grief|morning        romance|morning
//     testing|morning      callback|morning     cover|journey-out
//     grief|journey-out    suspicion|journey-out
//     testing|journey-out  callback|journey-out
//
// A suspicion opened on the road out could never be picked up on the road out
// again — it had to wait for the evening. The five events here are the fix,
// one per cell that a debut season can actually reach. (`callback` is left
// alone deliberately: that family reads franchise history and fires zero in a
// debut season, so an event there cannot be verified by playing one.)
//
// ── WHAT MAKES THESE DIFFERENT FROM THE REST OF THE POOL ─────────────
//
// Every one of them REFUSES TO FIRE WITHOUT A STORY. `arcContinue` opens an
// arc when it finds none, which is the right default for an ordinary event
// and is exactly wrong here — an event written to fill an advancer hole that
// spends half its firings opening new threads has not filled it. So each
// weight() checks `findOpenThread` first and returns 0, and the fire() body
// can then assume the thread exists.
//
// AND THE POOLS ARE DEEP ON PURPOSE. These are continuations, so a viewer
// meets them repeatedly across one story rather than once — the repetition
// ceiling is measured per SEASON, and a scene that recurs by design is the
// shape most likely to trip it. Ten lines a branch rather than the six an
// ordinary event carries.

import { gs } from '../../core.js';
import { pStats } from '../../players.js';
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcContinue } from './effects.js';
import { findOpenThread } from '../threads.js';
import { lineFor } from './lines.js';

/** The open thread of `kind` between exactly these two, or null. */
function storyBetween(kind, actors) {
  if (!actors || actors.length !== 2) return null;
  return findOpenThread(kind, actors) || null;
}

/** Weighted branch draw. Same shape as every other file here. */
function fork(rng, scores) {
  const keys = Object.keys(scores);
  const total = keys.reduce((s, k) => s + Math.max(0, scores[k]), 0) || 1;
  let roll = rng() * total;
  for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) return k; }
  return keys[0];
}

// ══════════════════════════════════════════════════════════════════════
// grief @ morning — the loss, a day or more later
// ══════════════════════════════════════════════════════════════════════
const GRIEF_ON_LINES = {
  'still-carrying-it': [
    '{a} brought {v} up again this morning, unprompted, and {b} let {a} do it.',
    'It has been days and {a} is still starting sentences with {v}.',
    '{b} has noticed that {a} talks about {v} in the present tense.',
    '{a} said something this morning that only makes sense if {v} were still here.',
    'Everybody else has moved on to the arithmetic. {a} has not moved on at all.',
    '{a} asked {b} whether it gets easier, which is not a question about the game.',
    'There is a version of {a} that walked in here and {b} has not seen it since {v} went.',
    '{a} keeps finding things {v} left behind and keeps mentioning each one.',
    'It is the third morning running that {a} has said the name before nine.',
    '{b} would like to talk about something else and cannot find a way to say so.',
  ],
  'put-it-away': [
    '{a} has stopped saying {v}’s name and {b} noticed the exact morning it stopped.',
    'Whatever {a} was carrying about {v}, {a} has put it down somewhere and shut the door on it.',
    '{a} is brisk about it now, which {b} finds harder to watch than the crying was.',
    'It has been folded up and stored, and {b} is not sure that is the same as dealt with.',
    '{a} changed the subject when {v} came up, smoothly, and everybody let it happen.',
    'There is a point where grief becomes inconvenient and {a} has reached it.',
    '{a} said "we have to think about tonight" and that was the whole eulogy.',
    '{b} tried to open it up again and {a} closed it in one sentence.',
    'The mourning is over because {a} decided it was over.',
    'It is efficient and it is a little frightening.',
  ],
  'turned-it-to-use': [
    '{a} has started saying what {v} would have wanted, which is convenient and unfalsifiable.',
    '{v} has become an argument {a} makes, and {b} has spotted it.',
    'Every day {v} has been gone, {a}’s account of what {v} thought has got more useful.',
    '{a} is speaking for somebody who cannot correct {a}, and doing it in front of people.',
    '{b} was there for those conversations too and remembers them differently.',
    'It is not a lie exactly. It is a dead person being enlisted.',
    '{a} quoted {v} this morning and {b} is nearly certain {v} never said it.',
    'The grief is real. What {a} is doing with it is a separate question.',
    '{a} has made {v} into a reason for a vote, which is either honest or grotesque.',
    '{b} has stopped agreeing out loud when {a} does this.',
  ],
  'shared-it-properly': [
    '{a} and {b} talked about {v} for a while this morning without either of them meaning anything by it.',
    'It was the first conversation about {v} that was not also about the game.',
    'They swapped the two or three things they each knew about {v} and left it there.',
    '{a} said the thing nobody says: that {v} was a person and this is horrible.',
    'For ten minutes it was not a strategy conversation, which is rare enough to notice.',
    '{b} needed that more than {b} expected to.',
    'Neither of them tried to make it useful, and that is what made it worth having.',
    'They laughed about something {v} did, which is the first laugh either has had about it.',
    'It cost them nothing and it is the reason they will trust each other on Thursday.',
    '{a} and {b} came out of that morning closer for a reason neither would name.',
  ],
};

registerEvent({
  id: 'carry-grief-days-later',
  family: 'grief',
  window: 'morning',
  advancesThread: true,
  citesResidue: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'temperament', 'strategic', 'social'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // REFUSES WITHOUT A STORY. See the header: an advancer that opens arcs is
    // not an advancer.
    return storyBetween('grief', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-grief-days-later');
    const [a, b] = ctx.actors;
    const t = storyBetween('grief', ctx.actors);
    // WHO THE STORY IS ABOUT, off the thread rather than re-derived. The
    // grief arc's subject is whoever it was opened over; asking the record
    // for tonight's victim would narrate the wrong person on a thread that
    // has been running since day two.
    const v = t?.topic || (gs.tr?.goneBefore || []).slice(-1)[0]?.name || 'them';
    const sa = pStats(a);
    const branch = fork(rng, {
      'still-carrying-it': (sa.loyalty / 10) * 0.4 + (1 - sa.temperament / 10) * 0.2,
      'put-it-away': (sa.temperament / 10) * 0.35 + (1 - sa.social / 10) * 0.15,
      'turned-it-to-use': (sa.strategic / 10) * 0.4 + (1 - sa.loyalty / 10) * 0.2,
      'shared-it-properly': (sa.social / 10) * 0.3 + (sa.loyalty / 10) * 0.2,
    });
    const sceneWhy = branch === 'turned-it-to-use' ? 'made an argument out of somebody who is gone'
      : branch === 'put-it-away' ? 'stopped saying the name'
        : branch === 'shared-it-properly' ? 'talked about the dead without meaning anything by it'
          : 'is still carrying it days later';
    const note = lineFor(GRIEF_ON_LINES[branch],
      `carry-grief-days-later|${branch}|${ctx.ep}`, { a, b, v });
    const bondDelta = branch === 'shared-it-properly' ? 2
      : branch === 'still-carrying-it' ? 0.5
        : branch === 'turned-it-to-use' ? -1.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'grief', [a, b], ctx.ep, note, { source: sceneWhy });
    let crowd = null;
    if (branch === 'turned-it-to-use') crowd = { name: a, colour: 'selfish', reason: 'enlisted somebody who is dead into an argument', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: v, topicKind: 'grief-loss', threadId: thread?.id, cited, note, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ══════════════════════════════════════════════════════════════════════
// cover @ morning — an account, on its second or third telling
// ══════════════════════════════════════════════════════════════════════
const COVER_ON_LINES = {
  'told-it-the-same': [
    '{a} gave {b} the same account this morning, word for word, and word for word is its own problem.',
    'It has not changed a syllable in three days, which is either the truth or a script.',
    '{b} has heard this twice now and could recite the middle of it.',
    '{a} told it again without being asked, which nobody does with an ordinary evening.',
    'The details are identical. People do not usually remember identically.',
    '{a} has clearly told this to somebody else since, and told it well.',
    'There is a rhythm to it now that was not there the first time.',
    '{b} listened for the part that changed and did not find one.',
    'A story that never moves is a story that is being maintained.',
    '{a} finished on exactly the same sentence as last time.',
  ],
  'the-story-grew': [
    'There is more in it this morning than there was on the night, and the extra is oddly specific.',
    '{a} has added a detail nobody asked for, which is what people do when they are filling a hole.',
    'The account is longer every time {b} hears it.',
    '{a} has started explaining parts of it that were never in question.',
    'It has acquired a second person who can vouch for it, which it did not have on Tuesday.',
    'Somewhere between the first telling and this one, {a} thought of something.',
    '{b} noticed the new bit and said nothing about noticing.',
    'An account that grows is an account being defended.',
    'It is a better story now, and better is not the same as truer.',
    '{a} volunteered the new detail before {b} could ask anything at all.',
  ],
  'stopped-telling-it': [
    '{a} will not go through it again, and said so, pleasantly, this morning.',
    'The account has been retired. {b} noticed the retirement.',
    '"I have told you," said {a}, which is true and is not an answer.',
    '{a} has decided that repeating it is what is making it look rehearsed, and stopped.',
    'It is the correct move and it looks exactly like the guilty one.',
    '{b} asked once more and got a change of subject.',
    'Somebody who has nothing to hide usually cannot be stopped talking about it.',
    '{a} is tired of the question, or wants to look tired of it.',
    'The silence is doing more damage than the story was.',
    '{a} has left the account where it is and hopes the week moves on.',
  ],
  'somebody-else-checked': [
    '{b} has been to the other person in it, and the other person said something slightly different.',
    'The account survives on its own and does not survive being cross-referenced.',
    '{b} did the one thing nobody in this castle does: {b} went and asked.',
    'Two accounts of one evening, and the gap between them is about twenty minutes.',
    '{a} does not know yet that {b} has checked.',
    'It is not a contradiction. It is not a match either.',
    '{b} has decided not to say anything about it until it is worth more.',
    'The other half of the story exists and it is not quite this half.',
    '{b} would like there to be an innocent explanation and cannot construct one.',
    'This is the morning the account stopped being safe.',
  ],
};

registerEvent({
  id: 'carry-account-again',
  family: 'cover',
  window: 'morning',
  advancesThread: true,
  citesResidue: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['mental', 'temperament', 'strategic', 'intuition'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return storyBetween('cover', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-account-again');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const branch = fork(rng, {
      'told-it-the-same': (sa.mental / 10) * 0.35 + (sa.temperament / 10) * 0.2,
      'the-story-grew': (1 - sa.temperament / 10) * 0.35 + (sa.social / 10) * 0.15,
      'stopped-telling-it': (sa.strategic / 10) * 0.35 + (1 - sa.social / 10) * 0.15,
      'somebody-else-checked': (sb.intuition / 10) * 0.35 + (sb.mental / 10) * 0.2,
    });
    const sceneWhy = branch === 'the-story-grew' ? 'told an account that had grown since the last telling'
      : branch === 'stopped-telling-it' ? 'refused to go through the account again'
        : branch === 'somebody-else-checked' ? 'went and asked the other half of the account'
          : 'told the same account word for word';
    const note = lineFor(COVER_ON_LINES[branch],
      `carry-account-again|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'told-it-the-same' ? 0
      : branch === 'the-story-grew' ? -1
        : branch === 'stopped-telling-it' ? -1.5 : -0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'cover', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: a, topicKind: 'cover-account', threadId: thread?.id, cited, note, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// romance @ morning — the day after, in daylight
// ══════════════════════════════════════════════════════════════════════
const ROMANCE_ON_LINES = {
  'nothing-changed-in-daylight': [
    'Whatever that was last night, {a} and {b} are behaving this morning as though it did not happen.',
    'They are perfectly normal with each other, at some effort.',
    '{a} said good morning in exactly the voice {a} uses for everybody else.',
    'It is a performance and both of them are giving it.',
    'Neither of them has mentioned it and neither of them has stopped thinking about it.',
    'Daylight makes a thing said at midnight much harder to repeat.',
    'They passed on the stairs and both said something about the weather.',
    'It will have to be raised eventually and neither wants to be the one.',
    '{b} half-expected {a} to pretend, and {a} is pretending, and it still stings.',
    'The castle would notice a change, so there is not going to be one.',
  ],
  'admitted-it-in-daylight': [
    '{a} said it again this morning, sober and in daylight, which is the part that counts.',
    'Anybody can mean it at midnight. {a} meant it at nine.',
    '{b} needed to hear it when it was harder to say, and {a} worked that out.',
    'They had the conversation again properly, with the light on.',
    '{a} did not wait to be asked whether last night had been real.',
    'It is a small brave thing and this castle does not reward it.',
    '{b} has stopped waiting for the other shoe.',
    'They agreed, out loud, what this is — which almost nobody here does about anything.',
    '{a} said it in a corridor where somebody could have walked past.',
    'The daylight version is shorter and it is the one that will hold.',
  ],
  'one-of-them-retreated': [
    '{a} has been unavailable all morning in a way that is not quite avoidance.',
    'Something was said last night and {a} has spent today walking it back without saying so.',
    '{b} has worked out that {a} is frightened, and cannot tell of what.',
    '{a} was warm at midnight and is careful now, and {b} noticed the exact temperature.',
    'It is not cruelty. It is somebody remembering there is a game on.',
    '{a} sat somewhere else at breakfast, which is a whole sentence.',
    '{b} will not chase it and is not going to forget it either.',
    'Whatever was opening has stopped opening.',
    '{a} would say, if asked, that nothing is different. Everything is different.',
    'The retreat is doing more harm than the thing it is retreating from.',
  ],
  'somebody-saw': [
    'They were not as alone last night as they thought, and this morning somebody knows.',
    'A third person has the thing that {a} and {b} have, which changes what it is worth.',
    'Neither of them has been told they were seen, which is the worst version.',
    'It stopped being private somewhere around eleven o’clock.',
    'Somebody looked at {a} over breakfast for slightly too long.',
    'A showmance is protection until the moment it is public, and it is now public.',
    '{b} has started doing the arithmetic on who else has worked it out.',
    'The castle is small and there are not many places to be unobserved in it.',
    '{a} suspects, correctly, that it will be said out loud at a table this week.',
    'What they have is now a fact about them rather than a thing between them.',
  ],
};

registerEvent({
  id: 'carry-the-morning-after',
  family: 'romance',
  window: 'morning',
  advancesThread: true,
  citesResidue: true,
  rare: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['boldness', 'temperament', 'social', 'strategic'],
    relationship: ['romance'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    // Either stage of the castle's own romance ladder — see romance.js's
    // header for why the TD showmance pipeline is not what this reads.
    return (storyBetween('romance-showmance', ctx.actors)
      || storyBetween('romance-spark', ctx.actors)) ? 2.5 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-the-morning-after');
    const [a, b] = ctx.actors;
    const kind = storyBetween('romance-showmance', ctx.actors)
      ? 'romance-showmance' : 'romance-spark';
    const sa = pStats(a);
    const sb = pStats(b);
    const branch = fork(rng, {
      'nothing-changed-in-daylight': (sa.strategic / 10) * 0.3 + (1 - sa.boldness / 10) * 0.2,
      'admitted-it-in-daylight': (sa.boldness / 10) * 0.35 + (sa.loyalty / 10) * 0.2,
      'one-of-them-retreated': (1 - sb.boldness / 10) * 0.3 + (sb.strategic / 10) * 0.2,
      'somebody-saw': (ctx.living || []).length >= 6 ? 0.3 : 0.1,
    });
    const sceneWhy = branch === 'admitted-it-in-daylight' ? 'said it again in daylight'
      : branch === 'one-of-them-retreated' ? 'walked back what was said last night'
        : branch === 'somebody-saw' ? 'found out it had not been private'
          : 'behaved this morning as though nothing had happened';
    const note = lineFor(ROMANCE_ON_LINES[branch],
      `carry-the-morning-after|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'admitted-it-in-daylight' ? 2.5
      : branch === 'one-of-them-retreated' ? -2
        : branch === 'somebody-saw' ? 0.5 : -0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, kind, [a, b], ctx.ep, note, { source: sceneWhy });
    let crowd = null;
    if (branch === 'somebody-saw') crowd = { name: a, colour: 'exposed', reason: 'stopped being a private thing overnight', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: 'romance-bond', threadId: thread?.id, cited, note, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ══════════════════════════════════════════════════════════════════════
// suspicion @ journey-out — the doubt, taken back onto the road
// ══════════════════════════════════════════════════════════════════════
const SUSP_ON_LINES = {
  'tested-it-again': [
    '{a} put the same question to {b} on the road out, phrased differently, to see whether the answer was.',
    'It is the third time {a} has asked and the first time {b} has noticed it is the third.',
    '{a} has a way of returning to it that does not look like returning to it.',
    'The road is long and {a} used most of it on one subject.',
    '{a} asked about the same hour again and got a slightly rounder answer.',
    '{b} answered it patiently, which is either innocence or discipline.',
    'Nothing new came out of it. {a} did not expect anything new to.',
    '{a} is not looking for a confession, only for the story to move.',
    'By the field {a} knew one more thing about how {b} handles being asked.',
    'It was a pleasant conversation and it was an interrogation.',
  ],
  'let-it-cool': [
    '{a} decided the road was the wrong place and talked to {b} about nothing at all.',
    'The doubt is still there and {a} has stopped poking it in public.',
    '{a} has worked out that asking again would tell {b} more than the answer tells {a}.',
    'It is being rested rather than dropped, which are different things.',
    '{a} was warm with {b} the whole way out and meant about half of it.',
    'Somebody who keeps asking gets remembered as the person who kept asking.',
    '{a} is saving it, and knows exactly what for.',
    'The most useful thing {a} did on that road was not say anything.',
    '{b} has relaxed, which is precisely the effect {a} wanted.',
    'It will come back. It is not coming back today.',
  ],
  'found-the-hole': [
    'Somewhere on that road {b} said a thing that does not fit the thing {b} said on day {d}.',
    '{a} has been waiting for a gap and got one, walking, in the open air.',
    'It is small and it is real and {a} has stopped needing to be persuaded.',
    '{b} does not know it happened, which is the part {a} is enjoying least.',
    'The account has a corner that does not turn, and {a} has walked round it now.',
    '{a} asked one more question than was comfortable and it paid.',
    'Two versions of the same hour, five days apart, and {a} has both.',
    '{a} said "of course" and wrote it down in {a}’s head.',
    'That is not a feeling any more. That is a thing {a} can say at a table.',
    'The road gave {a} what a week of watching had not.',
  ],
  'was-talked-round': [
    '{b} answered it properly on that road and {a} came back with less than {a} left with.',
    'It is the first time {b} has been given long enough to answer, and the answer held.',
    '{a} arrived at the field having quietly abandoned most of it.',
    '{b} did not get defensive, which did more work than any of the words.',
    '{a} has been wrong about people before and is trying to be honest about it.',
    'The story {a} had built needed {b} to be careless, and {b} is not.',
    '{a} still has the shape of a doubt and has lost the reason for it.',
    'Five miles of straight answers is hard to argue with.',
    '{a} will not say out loud that {a} has come off it.',
    'Whatever {a} thought on the way out, {a} does not think it on the way back.',
  ],
};

registerEvent({
  id: 'carry-doubt-on-the-road',
  family: 'suspicion',
  window: 'journey-out',
  advancesThread: true,
  citesResidue: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['intuition', 'strategic', 'temperament', 'social'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return storyBetween('suspicion', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-doubt-on-the-road');
    const [a, b] = ctx.actors;
    const t = storyBetween('suspicion', ctx.actors);
    const sa = pStats(a);
    const sb = pStats(b);
    const branch = fork(rng, {
      'tested-it-again': (sa.strategic / 10) * 0.35 + (sa.social / 10) * 0.2,
      'let-it-cool': (sa.temperament / 10) * 0.3 + (sa.strategic / 10) * 0.15,
      'found-the-hole': (sa.intuition / 10) * 0.35 + (1 - sb.mental / 10) * 0.2,
      'was-talked-round': (sb.social / 10) * 0.3 + (sb.temperament / 10) * 0.2,
    });
    const sceneWhy = branch === 'found-the-hole' ? 'found the gap on the road out'
      : branch === 'was-talked-round' ? 'came off it on the road out'
        : branch === 'let-it-cool' ? 'rested it rather than ask again'
          : 'asked the same question a third way';
    const note = lineFor(SUSP_ON_LINES[branch],
      `carry-doubt-on-the-road|${branch}|${ctx.ep}`,
      { a, b, d: String(t?.openedEp ?? ctx.ep) });
    const bondDelta = branch === 'was-talked-round' ? 1.5
      : branch === 'found-the-hole' ? -2
        : branch === 'tested-it-again' ? -0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'suspicion', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: 'road-suspect-walk', threadId: thread?.id, cited, note, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// testing @ journey-out — the loyalty test, run a second time
// ══════════════════════════════════════════════════════════════════════
const TEST_ON_LINES = {
  'passed-it-again': [
    '{a} set it up again on the road and {b} walked into it and came out clean.',
    'Twice now, and twice {b} has done the thing {b} said {b} would.',
    '{a} is running out of ways to doubt {b} and has one or two left.',
    '{b} did not notice being tested, which is either honesty or the best answer available.',
    '{a} gave {b} an easy chance to be disloyal and {b} did not take it.',
    'It is evidence, and {a} is aware of how thin evidence like this is.',
    '{b} passed and {a} felt worse about having asked.',
    'That is two clean answers on the same question five days apart.',
    '{a} has decided to stop testing and is not sure {a} will manage it.',
    'Whatever {b} is, {b} is consistent, and consistency is most of what this castle can measure.',
  ],
  'failed-it-this-time': [
    'The same test, a week later, and {b} did not do what {b} did the first time.',
    'Something has changed in {b} and the road is where {a} found out.',
    '{b} hesitated where {b} did not hesitate before, and {a} was watching for exactly that.',
    'It is not a betrayal. It is the shape of one, arriving early.',
    '{a} has the before and the after and the after is worse.',
    '{b} gave a different answer to the same question and does not remember giving the first.',
    'Whatever {b} is protecting, {b} is protecting it harder than last week.',
    '{a} said nothing about the difference and has thought of nothing else since.',
    'Two data points is not a pattern. {a} is treating it as one.',
    'The test was cheap and what it bought is expensive.',
  ],
  'refused-to-play': [
    '{b} worked out it was a test, said so, and would not answer it.',
    '"You are checking on me," said {b}, on a road, in front of two other people.',
    '{a} has been caught and has to spend the rest of the walk on the back foot.',
    '{b} is not angry, which is worse than angry.',
    'Being tested twice is being told what somebody thinks of you.',
    '{b} would rather fail it than be measured again.',
    '{a} apologised and both of them know the apology is for being caught.',
    'The test is dead now. So is the thing it was testing.',
    '{b} asked what {a} would have done with a bad answer, and {a} did not have one.',
    'It cost {a} more than any result would have been worth.',
  ],
  'turned-it-around': [
    '{b} let it run, answered it, and then set one for {a} on the same road.',
    'Two people testing each other for five miles and pretending to talk about the weather.',
    '{b} has been doing this longer than {a} realised.',
    '{a} came away with an answer and a distinct feeling of having given one.',
    '{b} asked the question back so smoothly that {a} answered before noticing.',
    'By the field neither of them was sure who had learned more.',
    '{b} is not the one being examined any more and did that in about four sentences.',
    '{a} will be more careful and will be careful too late.',
    'It is the most enjoyable conversation either of them has had all week.',
    'They arrived at the field even, which was not {a}’s plan.',
  ],
};

registerEvent({
  id: 'carry-the-second-test',
  family: 'testing',
  window: 'journey-out',
  advancesThread: true,
  citesResidue: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['loyalty', 'intuition', 'boldness', 'strategic'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return storyBetween('testing', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-the-second-test');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const bond = getBond(a, b);
    const branch = fork(rng, {
      'passed-it-again': (sb.loyalty / 10) * 0.4 + Math.max(0, bond) * 0.03,
      'failed-it-this-time': (1 - sb.loyalty / 10) * 0.35 + (sb.strategic / 10) * 0.2,
      'refused-to-play': (sb.intuition / 10) * 0.3 + (sb.boldness / 10) * 0.2,
      'turned-it-around': (sb.strategic / 10) * 0.3 + (sb.social / 10) * 0.2,
    });
    const sceneWhy = branch === 'failed-it-this-time' ? 'gave a different answer to the same test'
      : branch === 'refused-to-play' ? 'named the test out loud and would not take it'
        : branch === 'turned-it-around' ? 'answered a test and set one back'
          : 'passed the same test a second time';
    const note = lineFor(TEST_ON_LINES[branch],
      `carry-the-second-test|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'passed-it-again' ? 2
      : branch === 'failed-it-this-time' ? -2
        : branch === 'refused-to-play' ? -2.5 : -0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'testing', [a, b], ctx.ep, note, { source: sceneWhy });
    let crowd = null;
    if (branch === 'refused-to-play') crowd = { name: b, colour: 'masterful', reason: 'named a loyalty test out loud and refused to take it', mult: 0.5 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, note, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});

// ══════════════════════════════════════════════════════════════════════
// THE LAST THREE REACHABLE CELLS (2026-09-06)
// ══════════════════════════════════════════════════════════════════════
//
// The five above took the zero-advancer list from eleven to six. These three
// take it to three, and the three that remain are all `callback` — a family
// that fires ZERO in a debut season by design, because it reads franchise
// history. An event written for `callback|dawn` cannot be verified by playing
// a season, so it waits for a returnee fixture rather than being guessed at.
//
// Same contract as the five above: each refuses to fire without a story to
// continue, each declares `citesResidue`, and the pools are ten lines deep
// because a continuation is met repeatedly across one story.

// ══════════════════════════════════════════════════════════════════════
// cover @ journey-out — the account, carried out of the gate
// ══════════════════════════════════════════════════════════════════════
const COVER_ROAD_LINES = {
  'rehearsed-on-the-walk': [
    '{a} spent the road out going over it again, silently, in order.',
    'Five miles is enough to say a thing to yourself forty times, and {a} used all of it.',
    '{a} has the account down to the minute now, which is the problem with having it down to the minute.',
    'Nobody walking beside {a} could have known what {a} was doing for an hour.',
    '{a} tested the weak part of it against every step and it held every time.',
    'By the field {a} could have recited it backwards.',
    'It is a good account and {a} has now made it a performance.',
    '{a} has stopped believing it a little, from the repetition.',
    'Practising a truth and practising a lie look identical from the outside, which is what {a} is counting on.',
    '{a} arrived at the field with it word-perfect and slightly sick of it.',
  ],
  'asked-about-it-out-there': [
    '{b} raised it on the road, casually, in the open air where it is harder to seem defensive.',
    'It came up again a mile out, and {a} had to do the whole thing standing up and walking.',
    '{b} picked the one hour {a} could not leave the conversation.',
    'A road is a bad place to be asked and {a} knows {b} knows that.',
    '{b} asked it differently this time, which {a} noticed and did not mention.',
    'The answer was the same. The circumstances of giving it were much worse.',
    '{a} got through it and spent the rest of the walk working out what it had cost.',
    '{b} let it go after one question, which is somehow more worrying than three.',
    'Out there, with nowhere to sit down, {a} sounded exactly as rehearsed as {a} was.',
    'They walked the last mile talking about the weather and both of them knew why.',
  ],
  'somebody-else-was-there': [
    '{a} had not counted on a third person hearing it, and a third person heard it.',
    'It stopped being a private account somewhere on that road.',
    'Whoever was walking behind {a} and {b} has the whole of it now.',
    '{a} spent the rest of the afternoon trying to work out who had been in earshot.',
    'A road carries. {a} learned that an hour too late.',
    'The account is now in two heads {a} did not choose.',
    '{a} said it once and it has been repeated twice since, and not by {a}.',
    'There is no way to ask who heard without telling them there was something to hear.',
    '{a} has lost control of the version, which is worse than losing the argument.',
    'It will come back at a table, in somebody else’s words.',
  ],
  'let-it-lie-out-there': [
    'Neither {a} nor {b} mentioned it once on that road, which took effort from both.',
    'It was the obvious thing to talk about and they talked about everything else.',
    '{a} had the answer ready for five miles and never needed it.',
    'The account got a day older and no more solid.',
    '{b} did not ask. {a} has been trying to decide since whether that is good.',
    'Some silences are mercy and some are somebody waiting, and {a} cannot tell which.',
    'They walked out together and the thing between them walked with them, unspoken.',
    '{a} would almost rather have been asked.',
    'Nothing was said and nothing was resolved and both of them arrived tired.',
    'It is still there. It will be there tomorrow, and heavier.',
  ],
};

registerEvent({
  id: 'carry-account-on-the-road',
  family: 'cover',
  window: 'journey-out',
  advancesThread: true,
  citesResidue: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['temperament', 'mental', 'social', 'intuition'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return storyBetween('cover', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-account-on-the-road');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const branch = fork(rng, {
      'rehearsed-on-the-walk': (sa.mental / 10) * 0.35 + (sa.temperament / 10) * 0.15,
      'asked-about-it-out-there': (sb.intuition / 10) * 0.35 + (sb.social / 10) * 0.15,
      'somebody-else-was-there': (ctx.living || []).length >= 7 ? 0.3 : 0.1,
      'let-it-lie-out-there': (1 - sb.boldness / 10) * 0.3 + 0.1,
    });
    const sceneWhy = branch === 'asked-about-it-out-there' ? 'was asked about it where they could not sit down'
      : branch === 'somebody-else-was-there' ? 'lost the account to a third pair of ears'
        : branch === 'let-it-lie-out-there' ? 'walked five miles beside it and never said it'
          : 'went over the account the whole way out';
    const note = lineFor(COVER_ROAD_LINES[branch],
      `carry-account-on-the-road|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'asked-about-it-out-there' ? -1
      : branch === 'somebody-else-was-there' ? -0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'cover', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: a, topicKind: 'cover-account', threadId: thread?.id, cited, note, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// grief @ journey-out — walking out one short
// ══════════════════════════════════════════════════════════════════════
const GRIEF_ROAD_LINES = {
  'counted-the-column': [
    '{a} counted the column at the gate the way {a} has every morning since {v} went.',
    'It is a shorter walk out every week and {a} is the one keeping the number.',
    '{a} knows exactly how many left the castle this morning without being told.',
    'The gap in the line is where {v} used to walk and {a} has not stopped seeing it.',
    '{a} said the number out loud to {b} and wished {a} had not.',
    'Everybody notices. {a} is the only one who says it.',
    'There were eighteen of them on the first road out. {a} could tell you today’s figure.',
    '{a} watched the column form up and felt the arithmetic land again.',
    'It is not sadness exactly. It is bookkeeping that hurts.',
    '{b} has started dreading the walk out because of what {a} says at the gate.',
  ],
  'talked-about-them-walking': [
    '{a} and {b} talked about {v} for the first two miles and neither of them minded.',
    'The road is where you can say a name without the room hearing it.',
    '{a} told {b} something about {v} that {a} has not told anybody else here.',
    'They laughed about {v} somewhere near the ford, properly, for the first time.',
    'It is easier to grieve walking than sitting still, and both of them have found that out.',
    '{b} asked what {v} had been like before all this, and {a} answered at length.',
    'Two people remembering the same person, out loud, with nobody keeping score.',
    'It was the best conversation either of them has had about {v}.',
    '{a} stopped mid-sentence once and {b} waited.',
    'By the field they had said everything and both felt lighter for it.',
  ],
  'nobody-said-the-name': [
    'Nobody on that road said {v}’s name once, and {a} counted.',
    'A week ago {v} was on this walk. This morning nobody mentioned it.',
    '{a} waited for somebody else to say it first and nobody did.',
    'The castle has moved on and {a} is a few days behind.',
    'It is the speed of the forgetting that {a} cannot get past.',
    '{a} nearly said something at the gate and did not.',
    'There is a version of this walk where {v} is discussed. This was not it.',
    '{b} did not notice the silence, which told {a} something about {b}.',
    'They will all be forgotten this fast and {a} has just understood that.',
    '{a} walked the whole way out composing something and said none of it.',
  ],
  'walking-where-they-walked': [
    '{a} took the place in the column {v} used to take, without deciding to.',
    'The road goes past the spot where {a} last spoke to {v} properly.',
    '{a} slowed at the ford for no reason {b} could see.',
    'There is a gate {v} always went through first and {a} went through it first today.',
    'It is a small haunting and it happens every time they walk out.',
    '{a} has started avoiding one stretch of that road.',
    '{b} asked if {a} was all right and got a yes that was not one.',
    'The landscape has not changed. The walk is completely different.',
    '{a} did the whole road out with somebody who is not there.',
    'Nobody else on that column noticed a thing.',
  ],
};

registerEvent({
  id: 'carry-one-short-on-the-road',
  family: 'grief',
  window: 'journey-out',
  advancesThread: true,
  citesResidue: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['loyalty', 'temperament', 'social', 'intuition'],
    relationship: ['neutral', 'close-ally'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return storyBetween('grief', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-one-short-on-the-road');
    const [a, b] = ctx.actors;
    const t = storyBetween('grief', ctx.actors);
    const v = t?.topic || (gs.tr?.goneBefore || []).slice(-1)[0]?.name || 'them';
    const sa = pStats(a);
    const branch = fork(rng, {
      'counted-the-column': (sa.mental / 10) * 0.3 + (1 - sa.temperament / 10) * 0.15,
      'talked-about-them-walking': (sa.social / 10) * 0.35 + (sa.loyalty / 10) * 0.15,
      'nobody-said-the-name': (sa.intuition / 10) * 0.25 + (1 - sa.social / 10) * 0.2,
      'walking-where-they-walked': (sa.loyalty / 10) * 0.3 + 0.1,
    });
    const sceneWhy = branch === 'talked-about-them-walking' ? 'said the name out loud on the road, at length'
      : branch === 'nobody-said-the-name' ? 'counted how fast the castle forgot'
        : branch === 'walking-where-they-walked' ? 'walked the road with somebody who is not there'
          : 'counted the column at the gate again';
    const note = lineFor(GRIEF_ROAD_LINES[branch],
      `carry-one-short-on-the-road|${branch}|${ctx.ep}`, { a, b, v });
    const bondDelta = branch === 'talked-about-them-walking' ? 2
      : branch === 'nobody-said-the-name' ? -0.5 : 0.5;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'grief', [a, b], ctx.ep, note, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: v, topicKind: 'grief-loss', threadId: thread?.id, cited, note, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// testing @ morning — the test set in daylight
// ══════════════════════════════════════════════════════════════════════
const TEST_MORNING_LINES = {
  'set-it-over-breakfast': [
    '{a} put something in front of {b} at breakfast that only makes sense as a test.',
    'It looked like small talk and it was not small talk.',
    '{a} left a gap in a sentence and watched what {b} filled it with.',
    'Half the table heard the question and only two people knew what it was for.',
    '{a} has got better at this. A week ago it would have been obvious.',
    '{b} answered without breaking stride, which is either innocence or practice.',
    'It cost {a} nothing to ask and {a} learned something either way.',
    '{a} asked it over toast, which is the least threatening hour there is.',
    'The whole thing took nine seconds and {a} has been turning it over since.',
    'Nobody else at that table will remember the question by lunch.',
  ],
  'they-saw-it-coming': [
    '{b} clocked it immediately and answered the question {a} had actually asked.',
    '"You are testing me," {b} said, pleasantly, over the tea.',
    '{a} was not as subtle as {a} thought and now both of them know it.',
    '{b} has been tested before and has stopped finding it insulting.',
    'The test failed and the attempt is now the information.',
    '{b} gave the right answer in a tone that said what it was.',
    '{a} will have to be cleverer next time, and {b} will be readier.',
    'Being caught testing somebody is its own kind of answer about {a}.',
    '{b} smiled about it, which was worse than being angry.',
    'It is a draw and {a} does not enjoy draws.',
  ],
  'answered-too-well': [
    '{b} had an answer ready that was slightly better than the question deserved.',
    'Nobody is that precise about a Tuesday, and {a} noticed.',
    'It was correct in a way that suggested it had been prepared.',
    '{b} remembered a detail nobody remembers and {a} has filed the fact of it.',
    'The answer closed the question completely, which is what worries {a}.',
    '{a} came away with less doubt and more unease, which are not the same.',
    'A good answer at breakfast is not proof of anything and {a} cannot let it go.',
    '{b} volunteered one extra thing, and the extra thing is what {a} kept.',
    'It is thin. It is also the second time.',
    '{a} said thank you and meant something else.',
  ],
  'nothing-to-read': [
    '{b} answered it flatly and {a} came away with nothing at all.',
    'Some people are unreadable and {b} may simply be one of them.',
    'There was no tell because there was nothing to tell, or because {b} is good.',
    '{a} has spent a week on {b} and has not moved an inch.',
    'The test produced a fact {a} already had.',
    '{b} is not hiding anything or is hiding it perfectly, and {a} still cannot tell.',
    'It is the third time {a} has tried and the third time nothing came back.',
    '{a} is starting to think the problem is {a}, not {b}.',
    'A blank is not innocence. It is also not evidence.',
    '{a} will have to find another way at it, and does not have one.',
  ],
};

registerEvent({
  id: 'carry-the-morning-test',
  family: 'testing',
  window: 'morning',
  advancesThread: true,
  citesResidue: true,
  roles: 'initiator-first',
  variationAxes: {
    outcome: ['accepted', 'rejected', 'ambiguous', 'backfire'],
    voice: ['strategic', 'intuition', 'social', 'mental'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    return storyBetween('testing', ctx.actors) ? 3 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'carry-the-morning-test');
    const [a, b] = ctx.actors;
    const sa = pStats(a);
    const sb = pStats(b);
    const branch = fork(rng, {
      'set-it-over-breakfast': (sa.strategic / 10) * 0.35 + (sa.social / 10) * 0.15,
      'they-saw-it-coming': (sb.intuition / 10) * 0.35 + (sb.mental / 10) * 0.15,
      'answered-too-well': (sb.mental / 10) * 0.3 + (sb.strategic / 10) * 0.2,
      'nothing-to-read': (sb.temperament / 10) * 0.3 + (1 - sa.intuition / 10) * 0.15,
    });
    const sceneWhy = branch === 'they-saw-it-coming' ? 'was caught setting a test over breakfast'
      : branch === 'answered-too-well' ? 'got an answer that was better than the question deserved'
        : branch === 'nothing-to-read' ? 'set a test and got nothing back at all'
          : 'set a test over breakfast and nobody else noticed';
    const note = lineFor(TEST_MORNING_LINES[branch],
      `carry-the-morning-test|${branch}|${ctx.ep}`, { a, b });
    const bondDelta = branch === 'they-saw-it-coming' ? -1.5
      : branch === 'answered-too-well' ? -0.5 : 0;
    if (bondDelta) api.addBond(a, b, bondDelta, { source: sceneWhy });
    const { thread, cited } = arcContinue(api, 'testing', [a, b], ctx.ep, note, { source: sceneWhy });
    let crowd = null;
    if (branch === 'they-saw-it-coming') crowd = { name: b, colour: 'masterful', reason: 'named a test out loud over breakfast', mult: 0.4 };
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: 'testing-probe', threadId: thread?.id, cited, note, bondDelta,
      ...(crowd ? { crowd } : {}) };
  },
});
