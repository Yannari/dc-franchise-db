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
    '{a} sets a place for {v} without thinking.\n{b}: "Oh, love."\n{a}: "Habit. Sorry."',
    '{a} brings {v} up again this morning, unprompted, and {b} lets {aObj}.\n{a}: "{v} would have loved this weather."\n{b}: "{v} would."',
    '{a} can’t stop talking about {v}.\n{b} (to camera): "{a} still isn’t over {v}. I don’t think {aSub} will be."',
    '{a} mentions {v} at breakfast.\n{a}: "I keep saving {v} a seat."',
  ],
  'put-it-away': [
    '{b} mentions {v} and {a} changes the subject.\n{a}: "Not today."\n{b} (to camera): "That’s new."',
    '{a} has stopped saying {v}’s name, and {b} notices the morning it stopped.\n{b}: "You haven’t mentioned {v} today."\n{a}: "No. I can’t keep doing it."',
    '{a} packs the grief away.\n{a} (to camera): "I have to play now. {v} would want that."',
    '{a} moves on from {v}.\n{b} (to camera): "Overnight, {a} just stopped. Strange."',
  ],
  'turned-it-to-use': [
    '{a} says {v}’s name again at the table.\n{a}: "{v} would have voted this way."\n{b}: "You don’t know that."',
    '{a} has started saying what {v} would have wanted, which is convenient.\n{a}: "{v} would want us to vote out the quiet ones."\n{b}: "Would {v}, though?"',
    '{a} uses {v}’s memory.\n{b} (to camera): "Funny how {v} always wants what {a} wants."',
    '{a} invokes {v} to make a point.\n{a}: "Do it for {v}."',
  ],
  'shared-it-properly': [
    '{a} and {b} laugh about {v} over coffee.\n{b}: "{v} would hate us being sad."\n{a}: "{v} would hate the coffee."',
    '{a} and {b} talk about {v} for a while this morning, without meaning anything by it.\n{b}: "Remember when {v} burnt the toast?"\n{a}: "Twice!"\nThey both laugh.',
    '{a} and {b} share memories of {v}.\n{a} (to camera): "It felt good to just talk about {v}."',
    '{a} and {b} remember {v} fondly.\n{b}: "I miss {v}."\n{a}: "Me too."',
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
    '{b} asks again, and {a} answers exactly as before.\n{b}: "Word for word."\n{a}: "Because it’s true."',
    '{a} gives {b} the same account this morning, word for word.\n{b}: "You said that exactly the same way yesterday."\n{a}: "Because it’s what happened."\n{b} (to camera): "Or because it’s rehearsed."',
    '{a} repeats the story perfectly.\n{b} (to camera): "Word for word. That bothers me."',
    '{a} tells it the same again.\n{a} (to camera): {cam:story-hold}',
  ],
  'the-story-grew': [
    '{a} adds a detail {b} hasn’t heard.\n{b}: "You never said there was a candle."\n{a}: "Didn’t I?"',
    'There’s more in {a}’s story this morning than there was on the night.\n{b}: "You didn’t mention the stairs before."\n{a}: "Didn’t I?"',
    '{a}’s account gets new details.\n{b} (to camera): "The story’s growing. Stories that grow are made up."',
    '{a} adds something.\n{a} (to camera): {cam:overdid}',
  ],
  'stopped-telling-it': [
    '{b} asks for the story one more time.\n{a}: "I’ve told it. I’m not performing it."',
    '{a} won’t go through it again.\n{a}: "I’ve told you three times. I’m not doing it again."\n{b}: "Just once more?"\n{a}: "No."',
    '{a} refuses, pleasantly.\n{b} (to camera): "Why won’t {a} just tell it again?"',
    '{a} shuts it down.\n{a} (to camera): {cam:stay-quiet}',
  ],
  'somebody-else-checked': [
    '{b} comes back from asking around.\n{b}: "They say you went up at eleven. You said ten."\n{a}: "They’re wrong."',
    '{b} has been to the other person in {a}’s story, and they said something slightly different.\n{b}: "Funny. They remember it differently."\n{a}: "They must be confused."',
    '{b} checks {a}’s story.\n{a} (to camera): {cam:story-close}',
    '{b} finds a mismatch.\n{b}: "One of you is wrong."\n{a}: "Well, it isn’t me."',
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
    '{a} and {b} pass the toast without looking at each other.\n{b}: "Thanks."\n{a}: "Mm."',
    'Whatever that was last night, {a} and {b} are acting like it didn’t happen.\n{a}: "Morning."\n{b}: "Morning."\nThat’s it.',
    '{a} and {b} are normal at breakfast.\n{b} (to camera): "What happens at night stays at night. Apparently."',
    '{a} and {b} don’t mention it.\n{a} (to camera): "Awkward. Very awkward."',
  ],
  'admitted-it-in-daylight': [
    '{a} says it over breakfast, quietly.\n{a}: "Last night wasn’t the wine."\n{b}: "Good."',
    '{a} says it again this morning, sober and in daylight.\n{a}: "I meant what I said last night."\n{b}: "Good. So did I."',
    '{a} repeats it at breakfast.\n{b} (to camera): "In daylight. That’s when you know."',
    '{a} confirms it.\n{a}: "Still true. Just so you know."',
  ],
  'one-of-them-retreated': [
    '{b} finds {a} busy all morning.\n{b}: "Are you avoiding me?"\n{a}: "Just busy!"',
    '{a} has been unavailable all morning.\n{b}: "Are you avoiding me?"\n{a}: "No! Just busy."\n{b} (to camera): "Busy doing what? It’s a castle."',
    '{a} backs off after last night.\n{a} (to camera): "I panicked. I need a minute."',
    '{a} keeps a distance.\n{b}: "Did I do something?"',
  ],
  'somebody-saw': [
    'Someone winks at {a} and {b} over breakfast.\n{a}: "They know."\n{b}: "Nothing stays private in here."',
    'They weren’t as alone last night as they thought.\n{b}: "Someone saw us."\n{a}: "Who?"\n{b}: "Does it matter?"',
    '{a} and {b} find out they were spotted.\n{a} (to camera): "Great. Now it’s everybody’s business."',
    'The news is out by breakfast.\n{b}: "Well, that’s that."',
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
    '{a} asks the day {d} question again, differently.\n{a}: "Who were you with, after dinner?"\n{b}: "Same answer as last time."',
    '{a} puts the same question to {b} on the road, phrased differently.\n{a}: "Remind me where you were that night?"\n{b}: "I told you on day {d}."\n{a}: "Tell me again."',
    '{a} checks {b}’s answer against day {d}.\n{a} (to camera): "Same question, different words. Let’s see."',
    '{a} tests {b} again.\n{b}: "You’ve asked me this before."',
  ],
  'let-it-cool': [
    '{a} almost asks, then talks about the weather.\n{b}: "You wanted to say something."\n{a}: "Later."',
    '{a} decides the road is the wrong place, and talks to {b} about nothing.\n{a}: "Nice day."\n{b}: "Isn’t it?"',
    '{a} lets it rest for now.\n{a} (to camera): {cam:wait-and-see}',
    '{a} doesn’t push.\n{a} (to camera): "Another day. Not today."',
  ],
  'found-the-hole': [
    '{a} stops walking.\n{a}: "On day {d} you told me the opposite."\n{b}: "I don’t remember that."',
    'Somewhere on the road, {b} says something that doesn’t fit what {bSub} said on day {d}.\n{a}: "That’s not what you told me on day {d}."\n{b}: "Isn’t it?"',
    '{a} catches a contradiction.\n{a} (to camera): "Day {d}, {b} said one thing. Today, another."',
    '{b} slips up.\n{a} (to camera): {cam:holding-info}',
  ],
  'was-talked-round': [
    '{b} explains, calmly, all the way to the vans.\n{a}: "Fine. I was wrong about you."\n{b}: "Say it louder."',
    '{b} answers it properly, and {a} comes back less sure.\n{b}: {say:answer-clean}\n{a}: "Okay. That makes sense."',
    '{b} convinces {a}.\n{a} (to camera): "I went out suspicious. I came back less so."',
    '{b} talks {a} round.\n{a}: "Fine. I believe you."',
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
    // AND IT HAS TO BE YESTERDAY'S DOUBT. `SUSP_ON_LINES` names the day the
    // story opened ("does not fit the thing {b} said on day {d}"), so a thread
    // that opened THIS MORNING makes the line cite the day it is written on —
    // a citation to a beat that is not earlier than itself, which is exactly
    // what tests/tr-castle-reachability.test.js's citation arm forbids. It went
    // unseen because two beats of one suspicion thread landing in one episode
    // is rare; four events added to this window in 2026-09 made it common
    // enough to fail a 60-season sweep. Carrying a doubt onto the road means
    // carrying it from an earlier day, so this is the event's own precondition
    // rather than a repair to the sentence.
    const t = storyBetween('suspicion', ctx.actors);
    return t && t.openedEp != null && t.openedEp < ctx.ep ? 3 : 0;
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
      // `openedEp` is guaranteed present and earlier by the weight above.
      { a, b, d: String(t.openedEp) });
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
    '{a} runs the same test a second time, and {b} passes it again.\n{a} (to camera): "Twice clean. I’m starting to believe it."',
    '{a} sets it up again on the road, and {b} comes out clean.\n{a} (to camera): "Twice now. {b}’s passed twice."',
    '{b} passes the test again.\n{a}: "Just checking."\n{b}: "Checking what?"\n{a}: "Nothing."',
    '{a} tests {b} and gets the right answer.\n{a} (to camera): "Clean. Again."',
  ],
  'failed-it-this-time': [
    '{b} gives a different answer this time.\n{a}: "Last week you said the opposite."\n{b}: "Did I?"',
    'The same test, a week later, and {b} doesn’t do what {bSub} did the first time.\n{a} (to camera): "Different answer. Why?"',
    '{b} fails the second test.\n{a} (to camera): {cam:holding-info}',
    '{b} slips on the repeat test.\n{a} (to camera): "Last time {b} passed. This time, no."',
  ],
  'refused-to-play': [
    '{b} sees the test coming.\n{b}: "Is this another one of your tests?"\n{a}: "Would I?"\n{b}: "Yes."',
    '{b} works out it’s a test and says so.\n{b}: "This is a test, isn’t it?"\n{a}: "What? No."\n{b}: "I’m not answering."',
    '{b} won’t play along.\n{b}: "Nice try, {a}."',
    '{b} spots the trap.\n{a} (to camera): "Caught out. {b}’s sharp."',
  ],
  'turned-it-around': [
    '{b} answers, then asks one back.\n{b}: "Now you. Who did you tell about my secret?"\n{a}: "…Nobody."',
    '{b} answers the test, then sets one for {a}.\n{b}: "My turn. Where were you on Tuesday night?"\n{a}: "Oh, very good."',
    '{b} tests {a} back.\n{a} (to camera): "Two can play that game."',
    '{b} flips it.\n{b}: "Let’s see how you like it."',
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
    '{b} asks what {a} is muttering.\n{a}: "Nothing. A song."\n{a} (to camera): {cam:story-hold}',
    '{a} spends the road out going over it again, silently.\n{a} (to camera): {cam:story-hold}',
    '{a} rehearses on the walk.\n{a} (to camera): "In order. Every time. In order."',
    '{a} goes quiet, running the story.\n{b}: "You okay?"\n{a}: "Fine. Just thinking."',
  ],
  'asked-about-it-out-there': [
    '{b} brings it up by the ford.\n{b}: "So that night. Where did you go?"\n{a}: "Bed."',
    '{b} raises it on the road, casually.\n{b}: "So, the other night. Where did you go after?"\n{a}: "Bed."\n{b}: "Straight to bed?"',
    '{b} asks in the open air.\n{a} (to camera): {cam:story-close}',
    '{b} brings it up on the road.\n{a}: "Why do you want to know?"',
  ],
  'somebody-else-was-there': [
    '{a} turns and finds someone right behind them.\n{a}: "How long have you been there?"\nNo answer.',
    '{a} hadn’t counted on a third person hearing it, and a third person hears it.\n{a} (to camera): "Someone was right behind us. Great."',
    '{a} realises someone overheard.\n{b}: "Did they hear?"\n{a}: "Every word."',
    'A third person catches the conversation.\n{a} (to camera): {cam:story-close}',
  ],
  'let-it-lie-out-there': [
    '{a} and {b} talk about everything except that night.\n{b}: "Lovely walk."\n{a}: "Lovely."',
    'Neither {a} nor {b} mentions it once on the road, which takes effort.\n{a} (to camera): "We both knew. We both said nothing."',
    '{a} and {b} avoid the subject.\n{b}: "Lovely walk."\n{a}: "Lovely."',
    '{a} and {b} keep off it.\n{a} (to camera): {cam:story-fine}',
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
    '{a} counts the line at the gate again.\n{b}: "You do that every morning."\n{a}: "Since {v}. Yes."',
    '{a} counts the line at the gate, the way {aSub} has every morning since {v} went.\n{a} (to camera): {cam:few-left}',
    '{a} counts heads again.\n{a} (to camera): "Since {v} went, I count. Every time."',
    '{a} checks who’s still here.\n{b}: "You’re counting again."\n{a}: "I can’t stop."',
  ],
  'talked-about-them-walking': [
    '{b} starts a {v} story.\n{b}: "Remember when {v} got lost on this exact path?"\n{a}: "Twice!"',
    '{a} and {b} talk about {v} for the first two miles.\n{b}: "{v} would have been at the front, chatting."\n{a}: "Never shut up."\n{b}: "Never."',
    '{a} and {b} remember {v} on the road.\n{a} (to camera): "Talking about {v} made the walk shorter."',
    '{a} and {b} share a {v} story.\n{b}: "I miss {v}."\n{a}: "Me too."',
  ],
  'nobody-said-the-name': [
    '{a} waits the whole walk for someone to say {v}’s name.\n{a} (to camera): "Nobody did. Like {v} was never here."',
    'Nobody on that road says {v}’s name once, and {a} counts.\n{a} (to camera): "Not once. Like {v} was never here."',
    '{a} notices the silence about {v}.\n{a} (to camera): {cam:few-left}',
    '{a} waits for someone to mention {v}.\n{a} (to camera): "Nobody did. I didn’t either."',
  ],
  'walking-where-they-walked': [
    '{b} points it out.\n{b}: "You’re walking where {v} always walked."\n{a}: "I know."',
    '{a} takes {v}’s old place in the line without deciding to.\n{a} (to camera): "I realised halfway. That was {v}’s spot."',
    '{a} walks where {v} used to walk.\n{b}: "That’s where {v} always was."\n{a}: "I know."',
    '{a} fills {v}’s place.\n{a} (to camera): {cam:few-left}',
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
    '{a} slides the jam over with a question.\n{a}: "Heard anything interesting about me?"\n{b}: "No. Should I have?"',
    '{a} puts something in front of {b} at breakfast that only makes sense as a test.\n{a}: "Did you hear what they said about you last night?"\n{b}: "No. What?"\n{a} (to camera): "Nobody said anything. Let’s see who {b} runs to."',
    '{a} sets a trap over toast.\n{a} (to camera): {cam:trap}',
    '{a} tests {b} at breakfast.\n{a}: "Just between us…"',
  ],
  'they-saw-it-coming': [
    '{b} smiles over the teapot.\n{b}: "This is a test."\n{a}: "It’s toast."\n{b}: "It’s a test."',
    '{b} clocks it immediately, and answers the real question.\n{b}: "You want to know if I’ll repeat it. I won’t."\n{a}: "…Right."',
    '{b} sees through it.\n{a} (to camera): "{b} knew exactly what I was doing."',
    '{b} isn’t fooled.\n{b}: "Nice try."',
  ],
  'answered-too-well': [
    '{b} answers perfectly and instantly.\n{a} (to camera): "That answer was ready before I asked."',
    '{b} has an answer ready that’s slightly better than the question deserves.\n{a} (to camera): "Too smooth. Nobody’s that ready at breakfast."',
    '{b} answers perfectly.\n{a} (to camera): {cam:holding-info}',
    '{b} is suspiciously prepared.\n{a}: "You’ve thought about that."\n{b}: "I think about everything."',
  ],
  'nothing-to-read': [
    '{b} shrugs.\n{b}: "Don’t know. Don’t mind."\n{a} (to camera): "Nothing. Absolutely nothing."',
    '{b} answers flatly, and {a} comes away with nothing.\n{b}: "Okay."\n{a}: "…That’s it?"\n{b}: "That’s it."',
    '{b} gives nothing away.\n{a} (to camera): "Blank. Totally blank."',
    '{b} is unreadable.\n{a} (to camera): {cam:unsure-info}',
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
