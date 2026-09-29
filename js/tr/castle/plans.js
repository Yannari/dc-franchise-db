// ══════════════════════════════════════════════════════════════════════
// tr/castle/plans.js — the day the twists actually happen to people
// ══════════════════════════════════════════════════════════════════════
//
// Three scenes, and all three exist because the same complaint kept being
// right: a mechanic the castle never reacts to is a mechanic that happened to
// a record. On Trial writes a list and the castle reads it out at breakfast —
// and then everybody went about their day as though nothing had been said. A
// truce is a conversation two people have in a corridor, and there was no
// corridor. A test is one name given to one person, and the morning after it
// lands the person holding it sat through breakfast with nothing to say.
//
//   plan-under-the-list   morning, on a day the castle is living under an
//                         On Trial list. What it is like to be on it, or to
//                         be standing next to somebody who is.
//   plan-the-offer        evening, when somebody has just done a deal. The
//                         deal itself, from the inside.
//   plan-holding-it       dawn, the morning after a test landed. The one
//                         scene in this family where a player knows something
//                         real and cannot use it.
//
// WHAT THE ROOM MAY SEE, which is quiet-night.js's rule and it bites hardest
// here. The LIST is public — read out over breakfast, so a scene may name it
// and the named may talk about it. The DEAL and the TEST are not: those two
// scenes are the private moment itself, so the only people in them are the
// people who were there, and nothing either scene writes may reach anybody
// else. No scene here writes a belief; the engine (js/tr/on-trial.js,
// js/tr/strategy.js) has already decided what everybody knows, and a castle
// file that re-decided it would be a second, quieter copy of the rule.
import { pStats } from '../../players.js';
// getBond is a PURE READ and the one bonds.js name a castle file may hold;
// every WRITE goes through the scene API (see ./effects.js).
import { getBond } from '../../bonds.js';
import { registerEvent } from '../events.js';
import { sceneApi, arcContinue } from './effects.js';
import { lineFor } from './lines.js';
import { trialToday } from '../on-trial.js';
import { liveTruces } from '../strategy.js';
import { gs } from '../../core.js';

// ══════════════════════════════════════════════════════════════════════
// 1. THE DAY UNDER THE LIST
// ══════════════════════════════════════════════════════════════════════

const LIST_LINES = {
  'both-of-us': [
    '{a} and {b} sit next to each other at breakfast, very upright.\n{b}: "Nervous?"\n{a}: "Terrified. You?"\n{b}: "Terrified."',
    '{a} and {b} are both on the list, and spend the morning being very calm at each other.\n{a}: "Well. Here we are."\n{b}: "Here we are."\n{a}: "Calm."\n{b}: "Very calm."',
    '{a} and {b} are on trial together.\n{a}: "Both of us, then."\n{b}: "Both of us."\n{b} (to camera): "Both of us. One of us might go. Horrible."',
    '{a} and {b} share a nervous laugh.\n{a}: "May the best one survive."\n{b}: "May it be me."',
  ],
  'not-me': [
    '{a} isn’t on the list and hovers by {b}.\n{a}: "Is there anything I can do?"\n{b}: "Just don’t vote for me."',
    '{a} isn’t on the list, and can’t work out where to stand.\n{b}: "You alright?"\n{a}: "I don’t know whether to be relieved or guilty."',
    '{a} feels awkward being safe.\n{a} (to camera): "I’m not on it. Some of my friends are. What do I say?"',
    '{b} notices {a} not knowing what to do.\n{b}: "Just act normal."\n{a}: "What’s normal?"',
  ],
  'they-picked-you': [
    '{a} leans over.\n{a}: "So why you, do you think?"\n{b}: "Thanks, {a}. Very reassuring."',
    '{a} wants to know what {b} did to get on the list.\n{a}: "Why do you think they put you on it?"\n{b}: "Thanks, {a}. Really helpful."',
    '{a} asks bluntly.\n{a}: "What did you do?"\n{b}: "Nothing! That’s the point!"',
    '{a} wonders about {b}.\n{a}: "Why do you think they put you on it?"\n{b}: "Thanks, {a}. Very helpful."\n{a} (to camera): "Nobody gets on that list for no reason."',
  ],
  'work-the-room': [
    '{b} brings everyone tea.\n{b}: "Sugar? No? Lovely."\n{a}: "You’re very helpful today."\n{b}: "I’m always helpful!"\n{a} (to camera): "Somebody’s on a list."',
    '{b} spends the morning being useful to everybody, which is what people on a list do.\n{b}: "Tea, anyone? Coffee? I’ll make it."\n{a}: "You’re very busy this morning."\n{b}: "Just being useful."\n{a} (to camera): "Very helpful all of a sudden."',
    '{b} works the room.\n{b}: "Need anything? Anything at all?"\n{a}: "I’m fine, {b}."\n{b} (to camera): "I’m on the list. I need every friend I’ve got."',
    '{b} is suddenly everyone’s best mate.\n{a}: "You’re very chatty today."\n{b}: "Am I?"',
  ],
};

/** The names the castle is living under today, or null. */
function _listToday(ep) {
  const t = trialToday(ep);
  if (!t || !(t.names || []).length) return null;
  const living = gs.activePlayers || [];
  const on = t.names.filter(n => living.includes(n));
  return on.length ? { names: on } : null;
}

registerEvent({
  id: 'plan-under-the-list',
  // The pair is [whoever is doing the looking, whoever is being looked at].
  roles: 'initiator-first',
  family: 'suspicion',
  window: 'morning',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['temperament', 'social', 'intuition'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const list = _listToday(ctx.ep);
    if (!list) return 0;
    const [a, b] = ctx.actors;
    // The scene needs at least one of them under it, and it is weighted well
    // above the family's ordinary events: it can only happen on the one day a
    // season a list is standing, and on that day it IS the castle. Measured at
    // a weight of 7 it reached four of twenty list days; at 12, nine.
    const on = list.names.includes(a) || list.names.includes(b);
    return on ? 12 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'plan-under-the-list');
    const [a0, b0] = ctx.actors;
    const list = _listToday(ctx.ep);
    const names = list ? list.names : [];
    const bothOn = names.includes(a0) && names.includes(b0);
    // THE PERSON ON THE LIST IS `b`, so every pool can be written one way
    // round. When both are on it, the order is left alone.
    const listed = names.includes(b0) ? b0 : a0;
    const other = listed === b0 ? a0 : b0;
    const a = bothOn ? a0 : other;
    const b = bothOn ? b0 : listed;
    const sa = pStats(a);
    const sb = pStats(b);
    const scores = {
      'both-of-us': bothOn ? 1.4 : 0,
      'not-me': bothOn ? 0 : 0.35 + (getBond(a, b) > 0 ? 0.45 : 0),
      'they-picked-you': bothOn ? 0 : 0.2 + ((10 - (sa.temperament || 5)) / 10) * 0.4
        + (getBond(a, b) < 0 ? 0.3 : 0),
      'work-the-room': bothOn ? 0.3 : 0.25 + ((sb.social || 5) / 10) * 0.5,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[0];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'both-of-us' ? 'were both on the list and spent the day beside each other'
      : branch === 'not-me' ? 'could not work out what to say to somebody on the list'
        : branch === 'they-picked-you' ? 'asked out loud why the pact had chosen that name'
          : 'spent the day on the list being impossible to give up';
    // A LIST MAKES PEOPLE EITHER CLOSER OR MUCH LESS CLOSE, and nothing in
    // between: the two on it hold together, the one asking why does damage.
    const bondDelta = branch === 'they-picked-you' ? -1.5
      : branch === 'both-of-us' ? 1.5 : branch === 'work-the-room' ? 1 : 0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(LIST_LINES[branch], `plan-under-the-list|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, 'suspicion', [a, b], ctx.ep, line,
      { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      topic: b, topicKind: 'on-the-list', threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 2. THE OFFER
// ══════════════════════════════════════════════════════════════════════

const OFFER_LINES = {
  'said-it-straight': [
    '{a} keeps it to one sentence.\n{a}: "You don’t write me, I don’t write you."\n{b}: "Done."',
    '{a} says it in one sentence, in a corridor.\n{a}: "Not you, not this week. And we both go after the other one."\n{b}: "Deal."',
    '{a} lays out the deal.\n{a}: "You don’t write me. I don’t write you. Simple."',
    '{a} makes the offer plainly.\n{a} (to camera): "No frills. Just a deal."',
  ],
  'took-it': [
    '{b} agrees almost before {a} finishes.\n{b}: "Yes. Deal."\n{a}: "That was quick."\n{b}: "It was a good offer."\n{a} (to camera): "Quick. Too quick?"',
    '{b} agrees before {a} has finished.\n{a}: "So what I’m proposing is—"\n{b}: "Yes."\n{a} (to camera): "Too quick. I noticed."',
    '{b} jumps at the deal.\n{b}: "Done. Shake on it."\n{a}: "Done."',
    '{b} accepts instantly.\n{b}: "Yes. Deal. Done."\n{a}: "You didn’t even think about it."\n{a} (to camera): "Why so eager, {b}?"',
  ],
  'did-not-say-yes': [
    '{b} thinks about it for a long time.\n{b}: "Ask me tomorrow."\n{a}: "That’s a no."\n{b}: "It’s a tomorrow."',
    '{b} doesn’t say yes. {b} doesn’t say no either.\n{a}: "Well?"\n{b}: "I’ll think about it."\n{a} (to camera): "That’s an answer. Just not the one I wanted."',
    '{b} stays non-committal.\n{b}: "Let’s see how the week goes."\n{a}: "That’s not a no."\n{b}: "It’s not a yes, either."',
    '{b} won’t commit.\n{a}: "So are we agreed?"\n{b}: "Let’s see."\n{a} (to camera): {cam:unsure-info}',
  ],
  // ── THE SECOND SHAPE, AND THE ONE THAT ACTUALLY GETS SEEN ──────────
  //
  // The corridor needs the engine to draw exactly two names out of a castle
  // of twelve, which it managed on three deals in sixty seasons. This shape
  // needs only ONE of them — the person who did the deal, talking to anybody —
  // and it is the more interesting scene anyway: a deal is invisible, and a
  // name somebody has stopped saying is not.
  'asked-outright': [
    '{b} puts it plainly.\n{b}: "You’ve stopped saying one particular name. What deal did you do?"\n{a}: "No deal."',
    '{b} has noticed one name never comes out of {a}’s mouth any more.\n{b}: "You never say their name. Why not?"\n{a}: "No reason."\n{b}: "There’s always a reason."',
    '{b} calls it out.\n{b}: "You’ve done a deal, haven’t you?"\n{a}: "Deal? What deal?"',
    '{b} asks directly.\n{b}: "You’ve stopped saying one name. Why?"\n{a}: "No reason."\n{a} (to camera): "{b} noticed. Of course {bSub} did."',
  ],
  'noticed-quietly': [
    '{b} notices and says nothing.\n{b} (to camera): "Some names go quiet for a reason. I’ll wait."',
    '{b} says nothing about it to anybody, and keeps count.\n{b} (to camera): "{a} has stopped mentioning a certain name. I’m watching."',
    '{b} files it away.\n{b} (to camera): {cam:holding-info}',
    '{b} notices, and keeps quiet.\n{b} (to camera): "Something’s changed with {a}. I’ll wait."',
  ],
};

/** A truce declared this evening, or null. */
function _dealTonight(ep) {
  return liveTruces(ep).find(t => t.ep === ep) || null;
}

registerEvent({
  id: 'plan-the-offer',
  roles: 'initiator-first',
  family: 'trust',
  window: 'evening',
  variationAxes: {
    outcome: ['accepted', 'ambiguous', 'rejected'],
    voice: ['strategic', 'social', 'loyalty'],
    relationship: ['neutral', 'rival'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const deal = _dealTonight(ctx.ep);
    if (!deal) return 0;
    const [a, b] = ctx.actors;
    // THE CORRIDOR — only the two people who were actually in it. A scene
    // about the deal between anybody else would be the castle knowing a thing
    // the engine has been careful nobody knows.
    const pair = (a === deal.by && b === deal.spared) || (b === deal.by && a === deal.spared);
    if (pair) return 9;
    // THE OTHER SHAPE: the person who did it, and somebody who has noticed
    // what they have stopped saying. That is not private — a name nobody says
    // any more is the most public thing about a deal.
    const holder = a === deal.by || b === deal.by;
    const spared = a === deal.spared || b === deal.spared;
    return (holder && !spared) ? 7 : 0;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'plan-the-offer');
    const deal = _dealTonight(ctx.ep);
    const [x, y] = ctx.actors;
    // `a` is always the person who did the deal; `b` is whoever they are with,
    // which is either the person they did it with or somebody watching them
    // not say a name.
    const a = deal && deal.by === y ? y : x;
    const b = a === x ? y : x;
    const corridor = !!deal && (b === deal.spared);
    const sb = pStats(b);
    const scores = corridor ? {
      'said-it-straight': 0.5,
      'took-it': 0.25 + ((sb.social || 5) / 10) * 0.45,
      'did-not-say-yes': 0.25 + ((sb.strategic || 5) / 10) * 0.4,
    } : {
      'asked-outright': 0.25 + ((sb.boldness || 5) / 10) * 0.5,
      'noticed-quietly': 0.3 + ((sb.intuition || 5) / 10) * 0.45,
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[0];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'took-it' ? 'took a deal in a corridor and meant about half of it'
      : branch === 'did-not-say-yes' ? 'was offered a week and never actually said yes'
        : branch === 'asked-outright' ? 'was asked why one name never gets said any more'
          : branch === 'noticed-quietly' ? 'noticed which name somebody had stopped saying'
            : 'offered somebody a week in exchange for a name';
    // A DEAL IS A BOND EVEN WHEN NOBODY MEANS IT — that is the mechanism the
    // engine already trades on. Being CAUGHT at it is the opposite, and the
    // quiet one costs more than the loud one: somebody who asks you outright
    // is somebody who might still be talked round.
    const bondDelta = branch === 'asked-outright' ? -0.5
      : branch === 'noticed-quietly' ? -1
        : branch === 'did-not-say-yes' ? 0.5 : 1.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(OFFER_LINES[branch], `plan-the-offer|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, 'trust', [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: corridor ? a : b, respondent: corridor ? b : a,
      // NO NAME ON THE RECORD from the shape where somebody is only noticing:
      // what they have is a gap, not a name, and a record carrying the name
      // would be handing a screen the thing the scene is about not having.
      topic: corridor && deal ? deal.against : null, topicKind: 'the-deal',
      threadId: thread?.id, cited, bondDelta };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 3. THE MORNING AFTER IT LANDS
// ══════════════════════════════════════════════════════════════════════

const HOLDING_LINES = {
  'cannot-say-it': [
    '{b} asks what’s wrong over breakfast.\n{a}: "Nothing. Honestly."\n{b}: "It doesn’t look like nothing."\n{a} (to camera): "Everything. And I can’t tell a soul."',
    '{a} has done something that can’t be explained to anybody, and spends breakfast not explaining it to {b}.\n{b}: "You’re quiet."\n{a}: "Tired."\n{a} (to camera): "I can’t tell {bObj}. I can’t tell anyone."',
    '{a} holds a secret through breakfast.\n{a} (to camera): {cam:holding-info}',
    '{a} keeps it inside.\n{b}: "Something’s up with you."\n{a}: "Nothing’s up."',
  ],
  'said-half': [
    '{a} gives {b} a name and nothing else.\n{a}: "Watch them. Don’t ask me why."\n{b}: "That’s all I get?"',
    '{a} gives {b} half of it: a name to watch, and none of the reason.\n{a}: "Just watch them. Trust me."\n{b}: "Why?"\n{a}: "I can’t say."',
    '{a} tells {b} just enough.\n{a}: "Watch them. Don’t ask why."\n{b}: "That’s all I get?"\n{b} (to camera): "Half a story. The worst kind."',
    '{a} drops a hint.\n{a}: "Keep an eye on them. That’s all."',
  ],
  'told-them-everything': [
    '{a} tells {b} the whole thing in a rush.\n{b}: "You’ve been carrying that all night?"\n{a}: "Since three a.m."',
    '{a} tells {b} the whole of it, in order, and looks lighter for about four seconds.\n{b}: "Wow."\n{a}: "Yeah."\n{b}: "What do we do now?"',
    '{a} spills everything to {b}.\n{b}: "You’ve been carrying that all night?"\n{a}: "Since three a.m."\n{a} (to camera): "I had to tell someone. It was {b}."',
    '{a} confides in {b}.\n{b}: "I won’t tell a soul."\n{a}: "Thank you."',
  ],
};

/**
 * A test that came back last night, whichever way, or null.
 *
 * ANY OUTCOME, AND THAT IS THE FIX RATHER THAN A COMPROMISE. Gated on a
 * LANDED test this fired five times in a thousand-season prose sweep, which is
 * under the variety floor by a factor of eight and unmeasurable by
 * construction: a test lands about once in twenty-five seasons. The scene was
 * never really about what was learned — it is about having done a thing you
 * cannot describe — and a test that came back with nothing is, if anything,
 * harder to talk about at breakfast than one that came back with a name.
 */
function _testCameBack(ep) {
  // TWO MORNINGS, NOT ONE. A test resolves about half a season in one, and
  // the scene also needs the engine to draw the right person into a dawn
  // pair — which together left its branches short of the prose suite's
  // variety floor however hard the weight was pushed. The thing being carried
  // does not evaporate overnight, so the morning after the morning after is
  // the same scene, and none of the lines says when it happened.
  return (gs.tr?.plans || []).find(p => p.resolvedEp != null
    && ep - p.resolvedEp >= 1 && ep - p.resolvedEp <= 2
    && (p.outcome === 'landed' || p.outcome === 'quiet')) || null;
}

registerEvent({
  id: 'plan-holding-it',
  roles: 'initiator-first',
  family: 'trust',
  window: 'dawn',
  variationAxes: {
    outcome: ['ambiguous', 'accepted', 'rejected'],
    voice: ['loyalty', 'strategic', 'temperament'],
    relationship: ['close-ally', 'neutral'],
  },
  weight(ctx) {
    if (ctx.actors?.length !== 2) return 0;
    const plan = _testCameBack(ctx.ep);
    if (!plan) return 0;
    const [a, b] = ctx.actors;
    // The person holding it has to be in the scene, and the person they are
    // holding it about must not be: that conversation is a different event
    // and a much shorter one.
    if (a !== plan.by && b !== plan.by) return 0;
    if (a === plan.suspect || b === plan.suspect) return 0;
    // Weighted like the list scene and for the same reason: it can only happen
    // on the morning after somebody ran the castle's biggest private move, and
    // on that morning it is the scene worth having. At 7 its branches fired 23
    // to 32 times in the prose sweep, under the variety floor of 40.
    return 14;
  },
  fire(ctx, rng) {
    const api = sceneApi(ctx, 'plan-holding-it');
    const plan = _testCameBack(ctx.ep);
    const [x, y] = ctx.actors;
    const a = (plan && plan.by === y) ? y : x;
    const b = a === x ? y : x;
    const sa = pStats(a);
    const scores = {
      // The commonest thing to do with a secret is nothing, and the branch
      // needs the share anyway: at a base of 0.3 it came in under the prose
      // suite's variety floor while its two siblings cleared it.
      'cannot-say-it': 0.45 + ((10 - (sa.social || 5)) / 10) * 0.4,
      'said-half': 0.35 + ((sa.strategic || 5) / 10) * 0.4,
      // Telling somebody the whole thing is what a loyal player does, and it
      // is how the castle's biggest read gets a second holder.
      // Telling somebody the whole thing is what a loyal player does, and on a
      // night the test came back with something it is how the castle's sharpest
      // read gets a second holder.
      'told-them-everything': 0.2 + ((sa.loyalty || 5) / 10) * 0.45
        + (getBond(a, b) >= 3 ? 0.4 : 0) + (plan && plan.outcome === 'landed' ? 0.3 : 0),
    };
    const keys = Object.keys(scores);
    const total = keys.reduce((acc, k) => acc + Math.max(0, scores[k]), 0);
    let roll = rng() * total, branch = keys[0];
    for (const k of keys) { roll -= Math.max(0, scores[k]); if (roll <= 0) { branch = k; break; } }

    const sceneWhy = branch === 'cannot-say-it' ? 'had done something that could not be explained'
      : branch === 'said-half' ? 'handed over a name and kept the reason'
        : 'told somebody the whole of what had been done and what came back';
    const bondDelta = branch === 'told-them-everything' ? 2
      : branch === 'said-half' ? 0.5 : -0.5;
    api.addBond(a, b, bondDelta, { source: sceneWhy });
    const line = lineFor(HOLDING_LINES[branch], `plan-holding-it|${branch}|${ctx.ep}`, { a, b });
    const { thread, cited } = arcContinue(api, 'trust', [a, b], ctx.ep, line, { source: sceneWhy });
    return { branch, pair: [a, b], speaker: a, respondent: b,
      // NO SUSPECT ON THE RECORD. The name is the whole secret; a scene
      // record carrying it is one screen away from printing it.
      topic: null, topicKind: 'holding-a-read',
      threadId: thread?.id, cited, bondDelta };
  },
});
